/**
 * Running Pace Calculator — Google Apps Script (GAS) 賽事自動爬蟲同步腳本
 *
 * 自動爬取「運動筆記」與「馬拉松世界」最新賽事並寫入 Google 試算表,免手動輸入。
 * 解析邏輯與 Cloudflare Worker 後端一致(已驗證兩來源皆可「匿名」抓取)。
 *
 * 💡 使用步驟:
 * 1. 建立 Google 試算表,第一列標頭(順序一致):
 *    A1: Date  B1: Name  C1: Location  D1: RegistrationLink
 *    E1: StravaFull  F1: StravaHalf  G1: GpxFull  H1: GpxHalf
 *    I1: Distances  J1: RegClose
 *    (A–H 為前端必要欄;I/J 為新增的距離與報名截止,選填)
 * 2.「擴充功能 → Apps Script」,把本檔貼到 Code.gs,儲存後重新整理試算表。
 * 3. 上方選單「🏃‍♂️ 賽事助手 → 🔄 從運動筆記與馬拉松世界更新賽事」即可同步。
 *
 * 同步策略:append-only,以「日期_名稱」去重、只加未來賽事;手填的 Strava/GPX 不受影響。
 * 來源若再改版導致解析 0 筆,請看「執行紀錄」的內容樣本調整下方解析 regex
 * (或對照 worker/src/lib.js 的 parseBijiRaces / parseMwRaces)。
 */

// ===== 可調整設定(來源網站若改版,改這裡)=====
var CONFIG = {
  marathonsWorld: {
    url: 'https://www.marathonsworld.com/artapp/racePage.php',
    payload: {
      action: 'getRaceListByCountryYear',
      user_id: '1',
      country: '1',
      year: '0',
      sort: '0',
      type: '0'
    },
    referer: 'https://www.marathonsworld.com/artapp/racelist.php?p=1'
  },
  runningBiji: {
    url: 'https://running.biji.co/?q=competition'
  },
  sampleLogChars: 800
};

var UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

// 1. 試算表開啟時建立自訂選單
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('🏃‍♂️ 賽事助手')
    .addItem('🔄 從運動筆記與馬拉松世界更新賽事', 'syncRaces')
    .addToUi();
}

// 2. 主同步函數
function syncRaces() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var ui = SpreadsheetApp.getUi();

  var response = ui.alert(
    '確認同步',
    '即將從馬拉松世界與運動筆記爬取最新賽事,可能需數秒,是否繼續?',
    ui.ButtonSet.YES_NO
  );
  if (response !== ui.Button.YES) return;

  var existingRaces = getExistingRaces(sheet);

  var mw = crawlMarathonsWorld();
  var biji = crawlRunningBiji();
  var sites = [mw, biji];

  var today = new Date();
  today.setHours(0, 0, 0, 0);

  var newRaces = [];
  var allFetched = mw.races.concat(biji.races);
  for (var i = 0; i < allFetched.length; i++) {
    var race = allFetched[i];
    var raceDate = new Date(race.date);
    if (isNaN(raceDate.getTime()) || raceDate < today) continue;

    var key = race.date + '_' + race.name;
    if (!existingRaces[key]) {
      newRaces.push(race);
      existingRaces[key] = true;
    }
  }

  newRaces.sort(function (a, b) {
    return new Date(a.date).getTime() - new Date(b.date).getTime();
  });

  for (var j = 0; j < newRaces.length; j++) {
    var nr = newRaces[j];
    sheet.appendRow([
      nr.date,
      nr.name,
      nr.location,
      nr.registrationLink,
      nr.stravaFull,
      nr.stravaHalf,
      nr.gpxFull,
      nr.gpxHalf,
      nr.distances,
      nr.regClose
    ]);
  }

  var lines = [];
  var anyFailed = false;
  for (var s = 0; s < sites.length; s++) {
    var st = sites[s];
    if (st.ok) {
      lines.push('✅ ' + st.site + ':抓取 ' + st.races.length + ' 筆(' + st.note + ')');
    } else {
      anyFailed = true;
      lines.push('⚠️ ' + st.site + ':失敗或 0 筆(HTTP ' + st.status + ')— ' + st.note);
    }
  }
  lines.push('');
  lines.push('本次新增寫入試算表:' + newRaces.length + ' 筆。');
  if (anyFailed) {
    lines.push('');
    lines.push('部分來源 0 筆(多半因網站改版)。請看「執行紀錄」內容樣本後調整解析,或手動輸入。');
  }

  ui.alert(anyFailed ? '同步完成(含警告)' : '同步完成!', lines.join('\n'), ui.ButtonSet.OK);
}

// 已存在的「日期_名稱」對照表
function getExistingRaces(sheet) {
  var data = sheet.getDataRange().getValues();
  var existing = {};
  for (var i = 1; i < data.length; i++) {
    var dateVal = data[i][0];
    var nameVal = data[i][1];
    if (dateVal && nameVal) {
      var dateStr = dateVal instanceof Date ? formatDate(dateVal) : String(dateVal).trim();
      existing[dateStr + '_' + String(nameVal).trim()] = true;
    }
  }
  return existing;
}

// ===== 共用 =====

function fetch_(url, options) {
  options = options || {};
  options.muteHttpExceptions = true;
  if (!options.headers) options.headers = {};
  if (!options.headers['User-Agent']) options.headers['User-Agent'] = UA;
  var resp = UrlFetchApp.fetch(url, options);
  var text = resp.getContentText('UTF-8') || '';
  return { code: resp.getResponseCode(), text: text, bytes: text.length };
}

function siteResult_(name) {
  return { site: name, ok: false, races: [], status: 0, bytes: 0, note: '' };
}

function makeRace_(date, name, location, link, distances, regClose) {
  return {
    date: date,
    name: name,
    location: location || '',
    registrationLink: link || '',
    stravaFull: '',
    stravaHalf: '',
    gpxFull: '',
    gpxHalf: '',
    distances: distances || '',
    regClose: regClose || ''
  };
}

function stripTags_(s) {
  return String(s || '')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// ===== 馬拉松世界 (MarathonsWorld) — POST racePage.php(免 cookie),回 HTML 片段 =====

function crawlMarathonsWorld() {
  var r = siteResult_('馬拉松世界');
  var cfg = CONFIG.marathonsWorld;
  try {
    var res = fetch_(cfg.url, {
      method: 'post',
      payload: cfg.payload,
      headers: {
        Referer: cfg.referer,
        Origin: 'https://www.marathonsworld.com',
        'X-Requested-With': 'XMLHttpRequest'
      }
    });
    r.status = res.code;
    r.bytes = res.bytes;
    Logger.log('[馬拉松世界] HTTP ' + res.code + ', ' + res.bytes + ' bytes');
    Logger.log('[馬拉松世界] 樣本: ' + res.text.substring(0, CONFIG.sampleLogChars));
    if (res.code !== 200) {
      r.note = 'HTTP ' + res.code;
      return r;
    }
    r.races = parseMwHtml_(res.text);
    r.ok = r.races.length > 0;
    r.note = r.ok ? 'HTML 解析成功' : '取得回應但解析 0 筆(結構可能已變更)';
    return r;
  } catch (e) {
    r.note = '例外:' + e;
    Logger.log('[馬拉松世界] 例外: ' + e);
    return r;
  }
}

// 資料列 <tr class='ColorBar9|11'>;日期格僅 MM/DD,年份由 YYYY年M月 區塊標頭追蹤。
function parseMwHtml_(html) {
  var races = [];
  var year = '';
  var re = /(\d{4})年\d{1,2}月|<tr class='ColorBar(?:9|11)'>([\s\S]*?)<\/tr>/g;
  var m;
  while ((m = re.exec(html)) !== null) {
    if (m[1]) {
      year = m[1];
      continue;
    }
    var row = m[2];
    var rid = row.match(/racedetail\.php\?rid=(\d+)'[^>]*>([\s\S]*?)<\/a>/);
    var dm = row.match(/>(\d{1,2})\/(\d{1,2})\(/);
    if (!rid || !dm || !year) continue;
    var name = stripTags_(rid[2]).replace(/^[\s*]+/, '');
    var date = normalizeDate_(year + '-' + dm[1] + '-' + dm[2]);
    if (!name || !date) continue;
    var loc = row.match(/width='150'[^>]*>([\s\S]*?)<\/td>/);
    var dist = row.match(/width='130'[^>]*>([\s\S]*?)<\/td>/);
    races.push(
      makeRace_(
        date,
        name,
        loc ? stripTags_(loc[1]) : '',
        'https://www.marathonsworld.com/artapp/racedetail.php?rid=' + rid[1],
        dist ? stripTags_(dist[1]) : '',
        ''
      )
    );
  }
  return races;
}

// ===== 運動筆記 (Running Biji) — GET ?q=competition,伺服器端渲染 HTML =====

function crawlRunningBiji() {
  var r = siteResult_('運動筆記');
  try {
    var res = fetch_(CONFIG.runningBiji.url, {
      headers: { 'Accept-Language': 'zh-TW,zh;q=0.9' }
    });
    r.status = res.code;
    r.bytes = res.bytes;
    Logger.log('[運動筆記] HTTP ' + res.code + ', ' + res.bytes + ' bytes');
    Logger.log('[運動筆記] 樣本: ' + res.text.substring(0, CONFIG.sampleLogChars));
    if (res.code !== 200) {
      r.note = 'HTTP ' + res.code;
      return r;
    }
    r.races = parseBijiHtml_(res.text);
    r.ok = r.races.length > 0;
    r.note = r.ok ? 'HTML 解析成功' : '取得回應但解析 0 筆(結構可能已變更)';
    return r;
  } catch (e) {
    r.note = '例外:' + e;
    Logger.log('[運動筆記] 例外: ' + e);
    return r;
  }
}

// 每筆以 competition-name 錨點;日期取行事曆 dates=YYYYMMDD、地點取 competition-place、
// 距離取 event-item、報名截止取「報名日期:…~CLOSE」。
function parseBijiHtml_(html) {
  var races = [];
  var nameRe = /<div class="competition-name">\s*<a href='([^']+)'>([\s\S]*?)<\/a>/g;
  var matches = [];
  var mm;
  while ((mm = nameRe.exec(html)) !== null) {
    matches.push({ index: mm.index, len: mm[0].length, href: mm[1], inner: mm[2] });
  }
  for (var i = 0; i < matches.length; i++) {
    var it = matches[i];
    var name = stripTags_(it.inner);
    var cidM = it.href.match(/cid=(\d+)/);
    if (!name || !cidM) continue;

    var before = html.substring(
      i > 0 ? matches[i - 1].index + matches[i - 1].len : 0,
      it.index
    );
    var after = html.substring(
      it.index + it.len,
      i + 1 < matches.length ? matches[i + 1].index : html.length
    );

    var cal = before.match(/dates=(\d{8})/);
    var date = cal
      ? normalizeDate_(cal[1].slice(0, 4) + '-' + cal[1].slice(4, 6) + '-' + cal[1].slice(6, 8))
      : '';
    if (!date) continue;

    var place = before.match(/competition-place"><span>([^<]*)<\/span>/);

    var distRe = /event-item[^>]*>([^<]+)<\/div>/g;
    var dlist = [];
    var seen = {};
    var dmt;
    while ((dmt = distRe.exec(after)) !== null) {
      var dv = dmt[1].trim();
      if (dv && !seen[dv]) {
        seen[dv] = true;
        dlist.push(dv);
      }
    }

    var reg = before.match(/報名日期[:：]\s*\d{4}-\d{2}-\d{2}[^~]*~\s*(\d{4}-\d{2}-\d{2})/);
    var regClose = reg ? reg[1] : '';

    var href = it.href;
    var link =
      href.indexOf('http') === 0
        ? href
        : 'https://running.biji.co' + (href.indexOf('/') === 0 ? '' : '/') + href;

    races.push(
      makeRace_(date, name, place ? place[1].trim() : '', link, dlist.join(', '), regClose)
    );
  }
  return races;
}

// ===== 日期工具 =====

function normalizeDate_(raw) {
  if (!raw) return '';
  var s = (raw instanceof Array ? raw[0] : String(raw)).trim();
  var m = s.match(/(\d{4})[\/\-.](\d{1,2})[\/\-.](\d{1,2})/);
  if (m) {
    var mm = m[2].length === 1 ? '0' + m[2] : m[2];
    var dd = m[3].length === 1 ? '0' + m[3] : m[3];
    return m[1] + '-' + mm + '-' + dd;
  }
  var d = new Date(s);
  if (!isNaN(d.getTime())) return formatDate(d);
  return '';
}

function formatDate(dateObj) {
  var d = dateObj.getDate();
  var m = dateObj.getMonth() + 1;
  var y = dateObj.getFullYear();
  return '' + y + '-' + (m <= 9 ? '0' + m : m) + '-' + (d <= 9 ? '0' + d : d);
}

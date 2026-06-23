/**
 * Running Pace Calculator - Google Apps Script (GAS) 賽事自動爬蟲同步腳本（強化診斷版）
 *
 * 本腳本可自動爬取「運動筆記」與「馬拉松世界」的最新賽事，並寫入 Google 試算表中，
 * 避免手動輸入的繁瑣！
 *
 * 💡 使用步驟：
 * 1. 建立一個 Google 試算表，第一行設定為以下標頭（順序要一樣）：
 *    A1: Date (日期)        B1: Name (賽事名稱)   C1: Location (地點)
 *    D1: RegistrationLink   E1: StravaFull        F1: StravaHalf
 *    G1: GpxFull            H1: GpxHalf
 * 2. 點擊「擴充功能 > Apps Script」，把本檔案程式碼貼到 Code.gs，儲存後重新整理試算表。
 * 3. 上方選單會出現「🏃‍♂️ 賽事助手」，點「🔄 從運動筆記與馬拉松世界更新賽事」即可同步。
 *
 * ⚠️ 重要（2026 起的來源變更）：
 *  - 「運動筆記」與「馬拉松世界」的賽事清單已改為 JS/AJAX 動態載入（運動筆記另加登入牆），
 *    舊版以靜態 HTML regex 解析的方式會抓到 0 筆。
 *  - 本版會「明確告警」而非靜默回報「無須更新」，並嘗試改打 AJAX/JSON 端點。
 *  - 若某來源仍抓不到，請打開「執行紀錄」(編輯器上方「執行紀錄」/ Executions) 查看本腳本
 *    記錄的「HTTP 狀態 + 內容樣本 + 首筆 JSON 欄位」，據此調整下方 CONFIG，或改用手動輸入。
 *  - 手動在試算表輸入賽事永遠是最可靠的來源（前端 API 會照常讀取）。
 */

// ===== 可調整設定（來源網站若再改版，改這裡即可）=====
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
    // 舊的 ?q=competition&act=list 已失效（回 404 + 登入牆）。
    // 下列為候選清單端點；若全部取不到，多半已需登入，請改用手動輸入。
    candidateUrls: [
      'https://running.biji.co/index.php?q=competition&act=list_item',
      'https://running.biji.co/index.php?q=competition&act=list'
    ]
  },
  sampleLogChars: 800 // 記錄到執行紀錄的內容樣本長度
};

var UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

// 1. 當試算表開啟時，自動建立自訂選單
function onOpen() {
  var ui = SpreadsheetApp.getUi();
  ui.createMenu('🏃‍♂️ 賽事助手')
    .addItem('🔄 從運動筆記與馬拉松世界更新賽事', 'syncRaces')
    .addToUi();
}

// 2. 主同步函數
function syncRaces() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var ui = SpreadsheetApp.getUi();

  var response = ui.alert(
    '確認同步',
    '即將從馬拉松世界與運動筆記爬取最新路跑賽事，這可能需要數秒鐘，是否繼續？',
    ui.ButtonSet.YES_NO
  );
  if (response !== ui.Button.YES) {
    return;
  }

  var existingRaces = getExistingRaces(sheet);

  // 分站爬取（各自回傳含成功/失敗旗標的結果物件，不再裸回 []）
  var mw = crawlMarathonsWorld();
  var biji = crawlRunningBiji();
  var sites = [mw, biji];

  // 合併、過濾過期、去重
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
      existingRaces[key] = true; // 避免本次同步內部重複
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
      nr.gpxHalf
    ]);
  }

  // 分站狀態報告 —— 關鍵：不再以「無須更新」掩蓋失敗
  var lines = [];
  var anyFailed = false;
  for (var s = 0; s < sites.length; s++) {
    var st = sites[s];
    if (st.ok) {
      lines.push('✅ ' + st.site + '：抓取 ' + st.races.length + ' 筆（' + st.note + '）');
    } else {
      anyFailed = true;
      lines.push('⚠️ ' + st.site + '：失敗或 0 筆（HTTP ' + st.status + '）— ' + st.note);
    }
  }
  lines.push('');
  lines.push('本次新增寫入試算表：' + newRaces.length + ' 筆。');

  if (anyFailed) {
    lines.push('');
    lines.push(
      '部分來源已失效（多半因網站改版／登入牆）。請改用手動輸入，' +
        '或打開「執行紀錄」查看內容樣本後調整 CONFIG。'
    );
  }

  var title = anyFailed ? '同步完成（含失效來源警告）' : '同步完成！';
  ui.alert(title, lines.join('\n'), ui.ButtonSet.OK);
}

// 取得試算表中已存在的「日期_名稱」對照表
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

// ===== 共用 HTTP / 結果物件 / 賽事物件 =====

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

function makeRace_(date, name, location, link) {
  return {
    date: date,
    name: name,
    location: location || '台灣',
    registrationLink: link || '',
    stravaFull: '',
    stravaHalf: '',
    gpxFull: '',
    gpxHalf: ''
  };
}

// ===== 馬拉松世界 (MarathonsWorld) =====

function crawlMarathonsWorld() {
  var r = siteResult_('馬拉松世界');
  var cfg = CONFIG.marathonsWorld;
  try {
    var res = fetch_(cfg.url, {
      method: 'post',
      payload: cfg.payload,
      headers: { Referer: cfg.referer }
    });
    r.status = res.code;
    r.bytes = res.bytes;
    Logger.log('[馬拉松世界] HTTP ' + res.code + ', ' + res.bytes + ' bytes');
    Logger.log('[馬拉松世界] 內容樣本: ' + res.text.substring(0, CONFIG.sampleLogChars));

    if (res.code !== 200) {
      r.note = 'HTTP ' + res.code + '（來源拒絕或端點變更）';
      return r;
    }

    // 1) racePage.php 是 AJAX 端點，回應很可能是 JSON —— 先試 JSON
    var fromJson = parseMarathonsWorldJson_(res.text);
    if (fromJson.length > 0) {
      r.races = fromJson;
      r.ok = true;
      r.note = 'JSON 解析成功';
      return r;
    }

    // 2) 退回 HTML <tr> 解析（整頁或片段皆可）
    var fromHtml = parseMarathonsWorldHtml_(res.text);
    if (fromHtml.length > 0) {
      r.races = fromHtml;
      r.ok = true;
      r.note = 'HTML 解析成功';
      return r;
    }

    r.note = '取得回應但解析 0 筆（JSON 與 HTML 皆未命中，來源結構已變更）。請依執行紀錄的內容樣本調整解析。';
    return r;
  } catch (e) {
    r.note = '例外：' + e;
    Logger.log('[馬拉松世界] 例外: ' + e);
    return r;
  }
}

function parseMarathonsWorldJson_(text) {
  var trimmed = (text || '').replace(/^﻿/, '').trim();
  if (trimmed.charAt(0) !== '[' && trimmed.charAt(0) !== '{') return [];

  var data;
  try {
    data = JSON.parse(trimmed);
  } catch (e) {
    return [];
  }

  var list = Array.isArray(data)
    ? data
    : data.data || data.list || data.races || data.result || data.rows || [];
  if (!Array.isArray(list) || list.length === 0) return [];

  Logger.log('[馬拉松世界] JSON 首筆欄位: ' + JSON.stringify(Object.keys(list[0] || {})));

  var races = [];
  for (var i = 0; i < list.length; i++) {
    var row = list[i] || {};
    var date = normalizeDate_(
      row.date || row.raceDate || row.race_date || row.startDate || row.start_date || ''
    );
    var name = String(row.name || row.title || row.raceName || row.race_name || '').trim();
    if (!date || !name) continue;

    var rid = row.rid || row.id || row.raceId || row.race_id || '';
    var link =
      row.url || row.link || (rid ? 'https://www.marathonsworld.com/artapp/race.php?rid=' + rid : '');
    var location = String(row.location || row.place || row.city || row.area || '').trim();

    races.push(makeRace_(date, name, location, link));
  }
  return races;
}

function parseMarathonsWorldHtml_(html) {
  var races = [];
  var trPattern = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
  var trMatches;

  while ((trMatches = trPattern.exec(html)) !== null) {
    var trContent = trMatches[1];

    var dateMatch = trContent.match(/\d{4}-\d{2}-\d{2}/);
    if (!dateMatch) continue;

    var nameMatch = trContent.match(/href=['"](race\.php\?rid=\d+)['"][^>]*>([\s\S]*?)<\/a>/i);
    if (!nameMatch) continue;

    var link = 'https://www.marathonsworld.com/artapp/' + nameMatch[1];
    var name = nameMatch[2].replace(/<[^>]+>/g, '').trim();

    var tdPattern = /<td[^>]*>([\s\S]*?)<\/td>/gi;
    var tds = [];
    var tdMatch;
    while ((tdMatch = tdPattern.exec(trContent)) !== null) {
      tds.push(tdMatch[1].replace(/<[^>]+>/g, '').trim());
    }
    var location = tds.length > 2 ? tds[2] : '台灣';

    races.push(makeRace_(dateMatch[0], name, location, link));
  }
  return races;
}

// ===== 運動筆記 (Running Biji) =====

function crawlRunningBiji() {
  var r = siteResult_('運動筆記');
  var cfg = CONFIG.runningBiji;

  for (var u = 0; u < cfg.candidateUrls.length; u++) {
    var url = cfg.candidateUrls[u];
    try {
      var res = fetch_(url, {});
      r.status = res.code;
      r.bytes = res.bytes;
      Logger.log('[運動筆記] ' + url + ' -> HTTP ' + res.code + ', ' + res.bytes + ' bytes');
      Logger.log('[運動筆記] 內容樣本: ' + res.text.substring(0, CONFIG.sampleLogChars));

      if (res.code !== 200) continue;

      var fromJson = parseRunningBijiJson_(res.text);
      if (fromJson.length > 0) {
        r.races = fromJson;
        r.ok = true;
        r.note = 'JSON 解析成功 (' + url + ')';
        return r;
      }

      var fromHtml = parseRunningBijiHtml_(res.text);
      if (fromHtml.length > 0) {
        r.races = fromHtml;
        r.ok = true;
        r.note = 'HTML 解析成功 (' + url + ')';
        return r;
      }
    } catch (e) {
      Logger.log('[運動筆記] 例外 (' + url + '): ' + e);
    }
  }

  r.note =
    '所有候選端點皆未取得賽事。運動筆記賽事清單已改為需登入 / JS 動態載入，匿名爬取無法取得。' +
    '建議改用手動輸入，或在可登入環境取得其內部 API 後更新 CONFIG.runningBiji.candidateUrls。';
  return r;
}

function parseRunningBijiJson_(text) {
  var trimmed = (text || '').replace(/^﻿/, '').trim();
  if (trimmed.charAt(0) !== '[' && trimmed.charAt(0) !== '{') return [];

  var data;
  try {
    data = JSON.parse(trimmed);
  } catch (e) {
    return [];
  }

  var list = Array.isArray(data)
    ? data
    : data.data || data.list || data.competitions || data.result || data.rows || [];
  if (!Array.isArray(list) || list.length === 0) return [];

  Logger.log('[運動筆記] JSON 首筆欄位: ' + JSON.stringify(Object.keys(list[0] || {})));

  var races = [];
  for (var i = 0; i < list.length; i++) {
    var row = list[i] || {};
    var date = normalizeDate_(
      row.date || row.eventDate || row.event_date || row.startDate || row.start_date || ''
    );
    var name = String(row.name || row.title || row.eventName || row.event_name || '').trim();
    if (!date || !name) continue;

    var cid = row.cid || row.id || row.sid || row.eventId || row.event_id || '';
    var link =
      row.url ||
      row.link ||
      (cid ? 'https://running.biji.co/index.php?q=competition&act=list_item&sid=' + cid : '');
    var location = String(row.location || row.place || row.city || row.area || '').trim();

    races.push(makeRace_(date, name, location, link));
  }
  return races;
}

function parseRunningBijiHtml_(html) {
  var races = [];
  var itemPattern = /<a[^>]+href=["']([^"']*(?:q=competition&act=info|competition\/info)[^"']*)["'][^>]*>([\s\S]*?)<\/a>/gi;
  var match;

  while ((match = itemPattern.exec(html)) !== null) {
    var rawLink = match[1];
    var inner = match[2];

    if (rawLink.indexOf('cid=') === -1 && rawLink.indexOf('/info/') === -1) continue;

    var link =
      rawLink.indexOf('http') === 0
        ? rawLink
        : 'https://running.biji.co' + (rawLink.indexOf('/') === 0 ? '' : '/') + rawLink;

    var titleMatch =
      inner.match(/<div class="[^"]*title[^"]*">([\s\S]*?)<\/div>/i) ||
      inner.match(/<h[2-4][^>]*>([\s\S]*?)<\/h[2-4]>/i);
    var name = titleMatch ? titleMatch[1].replace(/<[^>]+>/g, '').trim() : '';
    if (!name) {
      name = inner.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
      if (name.length > 50) name = name.substring(0, 30);
    }

    var date = normalizeDate_(inner.match(/\d{4}[\/\-\.]\d{1,2}[\/\-\.]\d{1,2}/));
    if (!date) continue;

    var locMatch =
      inner.match(/<div class="[^"]*location[^"]*">([\s\S]*?)<\/div>/i) ||
      inner.match(/<span class="[^"]*location[^"]*">([\s\S]*?)<\/span>/i);
    var location = locMatch ? locMatch[1].replace(/<[^>]+>/g, '').trim() : '';
    if (!location) {
      var cityMatch = inner.match(
        /(台北|臺北|新北|桃園|台中|臺中|台南|臺南|高雄|基隆|新竹|苗栗|彰化|南投|雲林|嘉義|屏東|宜蘭|花蓮|台東|臺東|澎湖|金門|連江)[市縣]?[^\s<]*/
      );
      if (cityMatch) location = cityMatch[0];
    }

    if (name && date) races.push(makeRace_(date, name, location, link));
  }
  return races;
}

// ===== 日期工具 =====

// 將各種日期輸入正規化為 YYYY-MM-DD（無法解析回 ''）
function normalizeDate_(raw) {
  if (!raw) return '';
  var s = (raw instanceof Array ? raw[0] : String(raw)).trim();

  var m = s.match(/(\d{4})[\/\-\.](\d{1,2})[\/\-\.](\d{1,2})/);
  if (m) {
    var mm = m[2].length === 1 ? '0' + m[2] : m[2];
    var dd = m[3].length === 1 ? '0' + m[3] : m[3];
    return m[1] + '-' + mm + '-' + dd;
  }

  var d = new Date(s);
  if (!isNaN(d.getTime())) return formatDate(d);
  return '';
}

// 格式化 Date 為 YYYY-MM-DD
function formatDate(dateObj) {
  var d = dateObj.getDate();
  var m = dateObj.getMonth() + 1;
  var y = dateObj.getFullYear();
  return '' + y + '-' + (m <= 9 ? '0' + m : m) + '-' + (d <= 9 ? '0' + d : d);
}

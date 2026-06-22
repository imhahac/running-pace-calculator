/**
 * Running Pace Calculator - Google Apps Script (GAS) 賽事自動爬蟲同步腳本
 * 
 * 本腳本可自動爬取「運動筆記」與「馬拉松世界」的最新賽事，並寫入 Google 試算表中，
 * 避免手動輸入的繁瑣！
 * 
 * 💡 使用步驟：
 * 1. 建立一個 Google 試算表，第一行設定為以下標頭（順序要一樣）：
 *    A1: Date (日期)
 *    B1: Name (賽事名稱)
 *    C1: Location (地點)
 *    D1: RegistrationLink (報名連結)
 *    E1: StravaFull (全馬/主賽事 Strava 路線)
 *    F1: StravaHalf (半馬/副賽事 Strava 路線)
 *    G1: GpxFull (全馬/主賽事 GPX 路線連結)
 *    H1: GpxHalf (半馬/副賽事 GPX 路線連結)
 * 2. 點擊「擴充功能 > Apps Script」。
 * 3. 在 Code.gs 中貼上本檔案程式碼。
 * 4. 點擊儲存，重新整理 Google 試算表。
 * 5. 試算表上方選單會出現「🏃‍♂️ 賽事助手」，點擊「🔄 從運動筆記與馬拉松世界更新賽事」即可全自動同步！
 */

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
  
  // 取得目前試算表已有的賽事（避免重複）
  var existingRaces = getExistingRaces(sheet);
  
  // 顯示提示
  var response = ui.alert('確認同步', '即將從馬拉松世界與運動筆記爬取最新路跑賽事，這可能需要數秒鐘，是否繼續？', ui.ButtonSet.YES_NO);
  if (response !== ui.Button.YES) {
    return;
  }
  
  var newRaces = [];
  var totalFetched = 0;
  
  try {
    // 爬取馬拉松世界
    var mwRaces = crawlMarathonsWorld();
    totalFetched += mwRaces.length;
    
    // 爬取運動筆記
    var bijiRaces = crawlRunningBiji();
    totalFetched += bijiRaces.length;
    
    // 合併並去重
    var allFetched = mwRaces.concat(bijiRaces);
    var today = new Date();
    today.setHours(0, 0, 0, 0);
    
    for (var i = 0; i < allFetched.length; i++) {
      var race = allFetched[i];
      var raceDate = new Date(race.date);
      
      // 過濾掉今天之前的過期賽事
      if (raceDate < today) continue;
      
      // 檢查是否已存在
      var key = race.date + "_" + race.name;
      if (!existingRaces[key]) {
        newRaces.push(race);
        existingRaces[key] = true; // 避免本次同步內部重複
      }
    }
    
    // 寫入試算表
    if (newRaces.length > 0) {
      // 依日期排序（由近到遠）
      newRaces.sort(function(a, b) {
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
      
      ui.alert('同步完成！', '成功抓取 ' + totalFetched + ' 筆賽事。\n已將 ' + newRaces.length + ' 筆全新賽事寫入試算表中！\n（若有 Strava 或 GPX 路線連結請在 E、F、G、H 欄自行補上）', ui.ButtonSet.OK);
    } else {
      ui.alert('同步完成！', '所有爬取到的賽事皆已存在於試算表中，無須更新！', ui.ButtonSet.OK);
    }
    
  } catch (err) {
    ui.alert('錯誤！', '同步過程中發生錯誤：' + err.toString(), ui.ButtonSet.OK);
  }
}

// 取得試算表中已存在的日期_名稱對照表
function getExistingRaces(sheet) {
  var data = sheet.getDataRange().getValues();
  var existing = {};
  for (var i = 1; i < data.length; i++) {
    var dateVal = data[i][0];
    var nameVal = data[i][1];
    if (dateVal && nameVal) {
      // 處理日期格式
      var dateStr = "";
      if (dateVal instanceof Date) {
        dateStr = formatDate(dateVal);
      } else {
        dateStr = String(dateVal).trim();
      }
      var key = dateStr + "_" + String(nameVal).trim();
      existing[key] = true;
    }
  }
  return existing;
}

// 3. 馬拉松世界 (MarathonsWorld) 爬蟲
function crawlMarathonsWorld() {
  var url = "https://www.marathonsworld.com/artapp/racePage.php";
  var options = {
    "method": "post",
    "headers": {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Referer": "https://www.marathonsworld.com/artapp/racelist.php?p=1"
    },
    "payload": {
      "action": "getRaceListByCountryYear",
      "user_id": "1",
      "country": "1",
      "year": "0",
      "sort": "0",
      "type": "0"
    },
    "muteHttpExceptions": true
  };
  
  var response = UrlFetchApp.fetch(url, options);
  if (response.getResponseCode() !== 200) {
    Logger.log("Failed to fetch Marathons World. Status: " + response.getResponseCode());
    return [];
  }
  
  var html = response.getContentText("UTF-8");
  var races = [];
  
  // 正規表達式匹配 tr 區塊
  var trPattern = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
  var trMatches;
  
  while ((trMatches = trPattern.exec(html)) !== null) {
    var trContent = trMatches[1];
    
    // 檢查是否有日期
    var dateMatch = trContent.match(/\d{4}-\d{2}-\d{2}/);
    if (!dateMatch) continue;
    var dateStr = dateMatch[0];
    
    // 抓取賽事連結與名稱
    var nameMatch = trContent.match(/href=['"](race\.php\?rid=\d+)['"][^>]*>([\s\S]*?)<\/a>/i);
    if (!nameMatch) continue;
    var link = "https://www.marathonsworld.com/artapp/" + nameMatch[1];
    var name = nameMatch[2].replace(/<[^>]+>/g, "").trim();
    
    // 抓取所有 td 的文字內容
    var tdPattern = /<td[^>]*>([\s\S]*?)<\/td>/gi;
    var tdMatches = [];
    var tdMatch;
    while ((tdMatch = tdPattern.exec(trContent)) !== null) {
      tdMatches.push(tdMatch[1].replace(/<[^>]+>/g, "").trim());
    }
    
    // 欄位 3 通常是地點
    var location = tdMatches.length > 2 ? tdMatches[2] : "台灣";
    
    races.push({
      date: dateStr,
      name: name,
      location: location,
      registrationLink: link,
      stravaFull: "",
      stravaHalf: "",
      gpxFull: "",
      gpxHalf: ""
    });
  }
  
  return races;
}

// 4. 運動筆記 (Running Biji) 爬蟲
function crawlRunningBiji() {
  var url = "https://running.biji.co/index.php?q=competition&act=list";
  var options = {
    "headers": {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    },
    "muteHttpExceptions": true
  };
  
  var response = UrlFetchApp.fetch(url, options);
  if (response.getResponseCode() !== 200) {
    Logger.log("Failed to fetch Running Biji. Status: " + response.getResponseCode());
    return [];
  }
  
  var html = response.getContentText("UTF-8");
  var races = [];
  
  // 匹配所有包含 q=competition&act=info 的 a 連結區塊
  var itemPattern = /<a[^>]+href=["']([^"']*(?:q=competition&act=info|competition\/info)[^"']*)["'][^>]*>([\s\S]*?)<\/a>/gi;
  var match;
  
  while ((match = itemPattern.exec(html)) !== null) {
    var rawLink = match[1];
    var innerContent = match[2];
    
    if (rawLink.indexOf("cid=") === -1 && rawLink.indexOf("/info/") === -1) continue;
    
    var link = rawLink.indexOf("http") === 0 ? rawLink : "https://running.biji.co" + (rawLink.indexOf("/") === 0 ? "" : "/") + rawLink;
    
    // 提取名稱
    var titleMatch = innerContent.match(/<div class="[^"]*title[^"]*">([\s\S]*?)<\/div>/i) || 
                     innerContent.match(/<h[2-4][^>]*>([\s\S]*?)<\/h[2-4]>/i);
    var name = titleMatch ? titleMatch[1].replace(/<[^>]+>/g, "").trim() : "";
    if (!name) {
      name = innerContent.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
      if (name.length > 50) name = name.substring(0, 30);
    }
    
    // 提取日期 (YYYY/MM/DD)
    var dateMatch = innerContent.match(/\d{4}[\/\-\.]\d{1,2}[\/\-\.]\d{1,2}/);
    if (!dateMatch) continue;
    var dateStr = dateMatch[0].replace(/\./g, "-").replace(/\//g, "-");
    
    var dateParts = dateStr.split("-");
    if (dateParts[1].length === 1) dateParts[1] = "0" + dateParts[1];
    if (dateParts[2].length === 1) dateParts[2] = "0" + dateParts[2];
    dateStr = dateParts.join("-");
    
    // 提取地點
    var locMatch = innerContent.match(/<div class="[^"]*location[^"]*">([\s\S]*?)<\/div>/i) || 
                   innerContent.match(/<span class="[^"]*location[^"]*">([\s\S]*?)<\/span>/i);
    var location = locMatch ? locMatch[1].replace(/<[^>]+>/g, "").trim() : "";
    
    if (!location) {
      var cityMatch = innerContent.match(/(台北|臺北|新北|桃園|台中|臺中|台南|臺南|高雄|基隆|新竹|苗栗|彰化|南投|雲林|嘉義|屏東|宜蘭|花蓮|台東|臺東|澎湖|金門|連江)[市縣]?[^\s<]*/);
      if (cityMatch) location = cityMatch[0];
    }
    
    if (name && dateStr) {
      races.push({
        date: dateStr,
        name: name,
        location: location || "台灣",
        registrationLink: link,
        stravaFull: "",
        stravaHalf: "",
        gpxFull: "",
        gpxHalf: ""
      });
    }
  }
  
  return races;
}

// 格式化 Date 為 YYYY-MM-DD
function formatDate(dateObj) {
  var d = dateObj.getDate();
  var m = dateObj.getMonth() + 1;
  var y = dateObj.getFullYear();
  return '' + y + '-' + (m <= 9 ? '0' + m : m) + '-' + (d <= 9 ? '0' + d : d);
}

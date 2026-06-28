/**
 * Running Pace Calculator - Google Apps Script Backend (API / doGet)
 *
 * 📘 Full setup guide (architecture, the crawler companion script, deployment,
 *    troubleshooting): see docs/GAS_SETUP.md.
 *
 * Instructions:
 * 1. Create a new Google Sheet.
 * 2. Set the first row as Headers exactly like this:
 *    A1: Date (e.g., 2026-12-15)
 *    B1: Name (e.g., 台北馬拉松)
 *    C1: Location (e.g., 台北市政府)
 *    D1: RegistrationLink (e.g., https://...)
 *    E1: StravaFull (e.g., https://www.strava.com/routes/12345)
 *    F1: StravaHalf (e.g., https://www.strava.com/routes/67890)
 *    G1: GpxFull (e.g., https://example.com/route_full.gpx)
 *    H1: GpxHalf (e.g., https://example.com/route_half.gpx)
 *    I1: Distances (optional, e.g., 42.2K, 21.1K)
 *    J1: RegClose (optional, registration close date, e.g., 2026-05-30)
 * 3. Go to Extensions > Apps Script. Paste this into a file (e.g. Code.gs). It can
 *    share the project with gas-crawler-script.js (no name clash after the
 *    crawler's formatDate was renamed formatDate_).
 * 4. Click Deploy > New deployment. Type: Web App. Execute as: Me. Access: Anyone.
 * 5. Copy the Web App /exec URL and set it as the app's backend URL — in the app's
 *    ⚙️ System Settings ("後端 URL") at runtime, or inject GAS_API_URL at build
 *    time. (You do NOT edit constants/index.ts by hand.)
 */

function doGet(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var data = sheet.getDataRange().getValues();
  
  if (data.length <= 1) {
    return createJsonResponse([]);
  }
  
  var headers = data[0];
  var result = [];
  var today = new Date();
  today.setHours(0, 0, 0, 0); // Reset time to midnight for accurate day comparison
  
  // Start from row 1 (skip headers)
  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    var rawDate = row[0];
    
    // Skip empty rows
    if (!rawDate || !row[1]) continue;
    
    // Parse date safely
    var raceDate = new Date(rawDate);
    if (isNaN(raceDate.getTime())) continue;
    
    // Filter out past events (keep events from today onwards)
    if (raceDate < today) continue;
    
    var event = {
      id: "race_" + i,
      date: formatDate(raceDate),
      name: String(row[1] || ""),
      location: String(row[2] || ""),
      registrationLink: String(row[3] || ""),
      stravaFull: String(row[4] || ""),
      stravaHalf: String(row[5] || ""),
      gpxFull: String(row[6] || ""),
      gpxHalf: String(row[7] || ""),
      distances: String(row[8] || ""),
      regClose: String(row[9] || "")
    };
    
    result.push(event);
  }
  
  // Sort by date ascending (closest events first)
  result.sort(function(a, b) {
    return new Date(a.date).getTime() - new Date(b.date).getTime();
  });
  
  return createJsonResponse(result);
}

function createJsonResponse(data) {
  var output = ContentService.createTextOutput(JSON.stringify(data));
  output.setMimeType(ContentService.MimeType.JSON);
  return output;
}

function formatDate(dateObj) {
  var d = dateObj.getDate();
  var m = dateObj.getMonth() + 1;
  var y = dateObj.getFullYear();
  return '' + y + '-' + (m<=9 ? '0' + m : m) + '-' + (d <= 9 ? '0' + d : d);
}

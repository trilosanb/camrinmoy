/**
 * =========================================================================
 * MRINMOY & CO. / BIGMIND CONSULTING — CAREERS & JOB APPLICATIONS BACKEND
 * =========================================================================
 * 
 * INSTRUCTIONS FOR SETUP:
 * 1. Open Google Sheets (https://sheets.google.com) and create or open your sheet.
 * 2. In the top menu, go to: Extensions -> Apps Script
 * 3. Delete any code in the editor, and paste this ENTIRE file.
 * 4. Click the Save icon (Ctrl + S / Cmd + S).
 * 5. Click "Deploy" (top right) -> "New deployment" (or Manage deployments -> New version).
 * 6. Click the gear icon next to "Select type" and select "Web app".
 * 7. Configure EXACTLY as follows:
 *    - Description: "Job Applications API"
 *    - Execute as: "Me (<your-email>@gmail.com)"  <-- MUST BE "Me"
 *    - Who has access: "Anyone"                     <-- MUST BE "Anyone" (NOT "Only myself")
 * 8. Click "Deploy".
 * 9. Click "Authorize access", choose your Google account, click "Advanced", 
 *    and click "Go to Untitled project (unsafe)" -> click "Allow".
 * 10. Copy the Web App URL (starts with https://script.google.com/macros/s/.../exec).
 * 11. Paste this URL into Dashboard -> API Settings -> "Job Applications Web App URL".
 * =========================================================================
 */

var CAREER_HEADERS = [
  "Timestamp",
  "Full Name",
  "Email Address",
  "Phone Number",
  "Message",
  "Resume File Name",
  "Resume File Link"
];

var DRIVE_FOLDER_NAME = "Careers Resumes (Mrinmoy & Co)";

/**
 * Handles incoming application submissions from careers.html
 */
function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(30000);
    
    if (!e || !e.postData || !e.postData.contents) {
      return makeJsonResponse({ status: "error", message: "No data payload received" }, 400);
    }
    
    var data = JSON.parse(e.postData.contents);
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = getOrCreateApplicationsSheet(ss);
    
    // Save resume to Google Drive if attached
    var resumeLink = "";
    if (data.resumeBase64 && data.resumeName) {
      try {
        var folder = getOrCreateResumeFolder();
        var decodedBytes = Utilities.base64Decode(data.resumeBase64);
        var mimeType = data.resumeMimeType || "application/pdf";
        
        var safeFileName = (data.fullName ? data.fullName.replace(/[^a-zA-Z0-9]/g, "_") + "_" : "") + 
                           data.resumeName;
        
        var fileBlob = Utilities.newBlob(decodedBytes, mimeType, safeFileName);
        var file = folder.createFile(fileBlob);
        
        file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
        resumeLink = file.getUrl();
      } catch (fileErr) {
        resumeLink = "Upload Error: " + fileErr.toString();
        Logger.log("Drive upload error: " + fileErr.toString());
      }
    }
    
    var careerRow = [
      new Date(),
      data.fullName || "",
      data.email || "",
      data.phone || "",
      data.message || "",
      data.resumeName || "",
      resumeLink
    ];
    
    sheet.appendRow(careerRow);
    
    return makeJsonResponse({ 
      status: "success", 
      message: "Application submitted successfully", 
      resumeUrl: resumeLink 
    }, 200);
    
  } catch (err) {
    Logger.log("doPost Error: " + err.toString());
    return makeJsonResponse({ status: "error", message: err.toString() }, 500);
  } finally {
    lock.releaseLock();
  }
}

/**
 * Handles fetching live candidates for dashboard.html
 */
function doGet(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = getOrCreateApplicationsSheet(ss);
    
    var lastRow = sheet.getLastRow();
    // If only header row exists or sheet is empty, return empty list
    if (lastRow <= 1) {
      return makeJsonResponse([], 200);
    }
    
    var values = sheet.getDataRange().getValues();
    if (!values || values.length <= 1) {
      return makeJsonResponse([], 200);
    }

    var headers = values[0];
    var dataList = [];
    
    for (var i = 1; i < values.length; i++) {
      var row = values[i];
      // Skip empty blank rows
      var isEmpty = row.every(function(cell) { 
        return cell === "" || cell === null || cell === undefined; 
      });
      if (isEmpty) continue;
      
      var record = {};
      for (var j = 0; j < headers.length; j++) {
        var header = headers[j];
        var propName = mapHeaderToField(header);
        var val = row[j];
        
        if (val instanceof Date) {
          val = val.toISOString();
        }
        record[propName] = val;
      }
      
      // Fallback property normalization
      if (!record.resumeUrl && record.resumeFileLink) {
        record.resumeUrl = record.resumeFileLink;
      }
      if (!record.fullName && record.name) {
        record.fullName = record.name;
      }
      if (!record.phone && (record.mobile || record.contact || record.whatsapp)) {
        record.phone = record.mobile || record.contact || record.whatsapp;
      }
      
      dataList.push(record);
    }
    
    // Sort descending by submission timestamp (latest first)
    dataList.sort(function(a, b) {
      var tA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
      var tB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
      return tB - tA;
    });
    
    return makeJsonResponse(dataList, 200);
    
  } catch (err) {
    Logger.log("doGet Error: " + err.toString());
    return makeJsonResponse({ status: "error", message: err.toString() }, 200);
  }
}

/**
 * Intelligent field mapper to support any custom sheet column naming
 */
function mapHeaderToField(header) {
  var h = String(header).trim().toLowerCase();
  if (/name/i.test(h)) return "fullName";
  if (/email/i.test(h)) return "email";
  if (/phone|mobile|contact|whatsapp/i.test(h)) return "phone";
  if (/message|cover|note|experience|about|remarks/i.test(h)) return "message";
  if (/resume\s*name|file\s*name/i.test(h)) return "resumeName";
  if (/resume|cv|file\s*link|drive|document|attachment/i.test(h)) return "resumeUrl";
  if (/time|date|timestamp/i.test(h)) return "timestamp";
  return h.replace(/[^a-zA-Z0-9]/g, "");
}

/**
 * Intelligent sheet locator: Finds existing sheet with candidate data 
 * without creating duplicate empty tabs.
 */
function getOrCreateApplicationsSheet(ss) {
  // 1. Check common sheet names that already have data
  var candidateNames = ["Applications", "Job Applications", "Careers", "Candidates", "Responses", "Form Responses 1", "Sheet1", "Sheet 1"];
  for (var i = 0; i < candidateNames.length; i++) {
    var s = ss.getSheetByName(candidateNames[i]);
    if (s && s.getLastRow() > 1) {
      return s; // Found existing sheet with data!
    }
  }
  
  // 2. Check active sheet if it has data
  var active = ss.getActiveSheet();
  if (active && active.getLastRow() > 1) {
    return active;
  }
  
  // 3. Scan all sheets to find which one has data
  var allSheets = ss.getSheets();
  for (var j = 0; j < allSheets.length; j++) {
    if (allSheets[j].getLastRow() > 1) {
      return allSheets[j];
    }
  }
  
  // 4. If no data exists anywhere, use or create "Applications"
  var appSheet = ss.getSheetByName("Applications") || allSheets[0];
  if (appSheet.getLastRow() === 0) {
    appSheet.appendRow(CAREER_HEADERS);
    var headerRange = appSheet.getRange(1, 1, 1, CAREER_HEADERS.length);
    headerRange.setFontWeight("bold")
               .setBackground("#0A2E4D")
               .setFontColor("#FFFFFF");
    appSheet.setFrozenRows(1);
  }
  return appSheet;
}

/**
 * Returns or creates a dedicated Google Drive folder for resumes
 */
function getOrCreateResumeFolder() {
  var folders = DriveApp.getFoldersByName(DRIVE_FOLDER_NAME);
  if (folders.hasNext()) {
    return folders.next();
  }
  var newFolder = DriveApp.createFolder(DRIVE_FOLDER_NAME);
  newFolder.setDescription("Auto-created folder for resumes uploaded through Mrinmoy & Co. careers portal.");
  return newFolder;
}

/**
 * Standard JSON response helper with CORS compatibility
 */
function makeJsonResponse(data, statusCode) {
  var output = ContentService.createTextOutput(JSON.stringify(data))
                             .setMimeType(ContentService.MimeType.JSON);
  return output;
}

/**
 * TEST FUNCTION: Click "Run" on this function in Apps Script to verify setup!
 * This appends a test candidate into your Google Sheet.
 */
function addSampleApplication() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = getOrCreateApplicationsSheet(ss);
  
  sheet.appendRow([
    new Date(),
    "Debashish Sarma (Test Candidate)",
    "debashish.s@outlook.com",
    "+91 94350 22341",
    "Qualified CA with 3 years experience in corporate valuation and project report modeling.",
    "Debashish_Sarma_CV.pdf",
    "https://drive.google.com"
  ]);
  
  Logger.log("Successfully added sample candidate to sheet: " + sheet.getName() + "! Refresh your dashboard to see it.");
}

/**
 * TEST FUNCTION: Run this to test doGet() data output in execution log
 */
function testDoGet() {
  var res = doGet(null);
  Logger.log("doGet response content: " + res.getContent());
}

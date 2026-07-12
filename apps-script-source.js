/**
 * ============================================================================
 * GOOGLE APPS SCRIPT PORTAL BACKENDS
 * Mrinmoy & Co. / BigMind Consulting
 * ============================================================================
 * 
 * Since the Client Leads and Careers portals submit and read data from two 
 * separate spreadsheets, they require two separate Google Apps Script deployments.
 * Below are the standalone source scripts for both sheets.
 * 
 * General Instructions:
 * 1. Open your target Google Sheet (e.g., Client Leads Sheet or Careers Sheet).
 * 2. Go to Extensions -> Apps Script.
 * 3. Delete any default code block and paste the appropriate script below.
 * 4. Save and click "Deploy" -> "New Deployment".
 * 5. Choose "Web App". Set "Execute as" to "Me", and "Who has access" to "Anyone".
 * 6. Authorize the permissions, copy the Web App URL, and paste it into the 
 *    dashboard connection modal.
 */


/* ============================================================================
 * TEMPLATE 1: CLIENT CHECK-IN (LEADS) SCRIPT
 * Paste this in your Client Leads Spreadsheet Apps Script Editor
 * ============================================================================ */

var LEAD_HEADERS = [
  "Timestamp", 
  "Full Name", 
  "Email Address", 
  "WhatsApp Number", 
  "Currently Investing?", 
  "Where Invested", 
  "Avails Professional Help?", 
  "Wants Portfolio Review?", 
  "Wants to Start?", 
  "Insurance Held", 
  "Preferred Follow-Up Date"
];

function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(15000);
    
    if (!e || !e.postData || !e.postData.contents) {
      return makeJsonResponse({ status: "error", message: "No data received" }, 400);
    }
    
    var data = JSON.parse(e.postData.contents);
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName("Leads") || ss.getActiveSheet();
    
    if (sheet.getName() === "Sheet1") {
      sheet.setName("Leads");
    }
    
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(LEAD_HEADERS);
      sheet.getRange(1, 1, 1, LEAD_HEADERS.length)
           .setFontWeight("bold")
           .setBackground("#14213D")
           .setFontColor("#FFFFFF");
    }
    
    var whereInvestedStr = Array.isArray(data.whereInvested) ? data.whereInvested.join(", ") : (data.whereInvested || "");
    var insuranceHeldStr = Array.isArray(data.insuranceHeld) ? data.insuranceHeld.join(", ") : (data.insuranceHeld || "");
    
    var leadRow = [
      new Date(),
      data.fullName || "",
      data.email || "",
      data.whatsapp || "",
      data.investingNow || "",
      whereInvestedStr,
      data.professionalHelp || "",
      data.portfolioReview || "",
      data.wantToStart || "",
      insuranceHeldStr,
      data.followUpDate || ""
    ];
    
    sheet.appendRow(leadRow);
    return makeJsonResponse({ status: "success", message: "Lead saved successfully" }, 200);
    
  } catch (err) {
    return makeJsonResponse({ status: "error", message: err.toString() }, 500);
  } finally {
    lock.releaseLock();
  }
}

function doGet(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName("Leads") || ss.getActiveSheet();
    
    if (sheet.getLastRow() === 0) {
      return makeJsonResponse([], 200);
    }
    
    var values = sheet.getDataRange().getValues();
    var headers = values[0];
    var dataList = [];
    
    var leadMapping = {
      "Timestamp": "timestamp",
      "Full Name": "fullName",
      "Email Address": "email",
      "WhatsApp Number": "whatsapp",
      "Currently Investing?": "investingNow",
      "Where Invested": "whereInvested",
      "Avails Professional Help?": "professionalHelp",
      "Wants Portfolio Review?": "portfolioReview",
      "Wants to Start?": "wantToStart",
      "Insurance Held": "insuranceHeld",
      "Preferred Follow-Up Date": "followUpDate"
    };
    
    for (var i = 1; i < values.length; i++) {
      var row = values[i];
      var record = {};
      
      for (var j = 0; j < headers.length; j++) {
        var header = headers[j];
        var propName = leadMapping[header] || header.replace(/[^a-zA-Z0-9]/g, "");
        var val = row[j];
        
        if (val instanceof Date) {
          val = val.toISOString();
        }
        
        if ((propName === "whereInvested" || propName === "insuranceHeld") && typeof val === "string") {
          record[propName] = val ? val.split(", ").map(function(item) { return item.trim(); }) : [];
        } else {
          record[propName] = val;
        }
      }
      dataList.push(record);
    }
    
    dataList.sort(function(a, b) {
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });
    
    return makeJsonResponse(dataList, 200);
    
  } catch (err) {
    return makeJsonResponse({ status: "error", message: err.toString() }, 500);
  }
}


/* ============================================================================
 * TEMPLATE 2: CAREERS / JOB APPLICATIONS SCRIPT
 * Paste this in your Careers Spreadsheet Apps Script Editor
 * ============================================================================ */

var CAREER_HEADERS = [
  "Timestamp",
  "Full Name",
  "Email Address",
  "Phone Number",
  "Message",
  "Resume File Name",
  "Resume File Link"
];

function doPostCareers(e) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(15000);
    
    if (!e || !e.postData || !e.postData.contents) {
      return makeJsonResponse({ status: "error", message: "No data received" }, 400);
    }
    
    var data = JSON.parse(e.postData.contents);
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName("Applications") || ss.getActiveSheet();
    
    if (sheet.getName() === "Sheet1") {
      sheet.setName("Applications");
    }
    
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(CAREER_HEADERS);
      sheet.getRange(1, 1, 1, CAREER_HEADERS.length)
           .setFontWeight("bold")
           .setBackground("#0A2E4D")
           .setFontColor("#FFFFFF");
    }
    
    var resumeLink = "";
    if (data.resumeBase64 && data.resumeName) {
      try {
        var folderId = "18iR2x8VJBbUOcKrQQVLBSs6UiAcqdrHs";
        var folder;
        try {
          folder = DriveApp.getFolderById(folderId);
        } catch (folderErr) {
          var folderName = "Careers Resumes";
          var folders = DriveApp.getFoldersByName(folderName);
          if (folders.hasNext()) {
            folder = folders.next();
          } else {
            folder = DriveApp.createFolder(folderName);
          }
        }
        
        var decodedBytes = Utilities.base64Decode(data.resumeBase64);
        var fileBlob = Utilities.newBlob(decodedBytes, data.resumeMimeType || "application/pdf", data.resumeName);
        var file = folder.createFile(fileBlob);
        file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
        resumeLink = file.getUrl();
      } catch (fileErr) {
        resumeLink = "Error uploading resume: " + fileErr.toString();
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
    return makeJsonResponse({ status: "success", message: "Application saved successfully", resumeUrl: resumeLink }, 200);
    
  } catch (err) {
    return makeJsonResponse({ status: "error", message: err.toString() }, 500);
  } finally {
    lock.releaseLock();
  }
}

function doGetCareers(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName("Applications") || ss.getActiveSheet();
    
    if (sheet.getLastRow() === 0) {
      return makeJsonResponse([], 200);
    }
    
    var values = sheet.getDataRange().getValues();
    var headers = values[0];
    var dataList = [];
    
    var careerMapping = {
      "Timestamp": "timestamp",
      "Full Name": "fullName",
      "Email Address": "email",
      "Phone Number": "phone",
      "Message": "message",
      "Resume File Name": "resumeName",
      "Resume File Link": "resumeUrl"
    };
    
    for (var i = 1; i < values.length; i++) {
      var row = values[i];
      var record = {};
      
      for (var j = 0; j < headers.length; j++) {
        var header = headers[j];
        var propName = careerMapping[header] || header.replace(/[^a-zA-Z0-9]/g, "");
        var val = row[j];
        
        if (val instanceof Date) {
          val = val.toISOString();
        }
        record[propName] = val;
      }
      dataList.push(record);
    }
    
    dataList.sort(function(a, b) {
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });
    
    return makeJsonResponse(dataList, 200);
    
  } catch (err) {
    return makeJsonResponse({ status: "error", message: err.toString() }, 500);
  }
}

// Rename doGet / doPost to matches sheet entry points for Career sheet
// Note: When deploying Template 2, name these standard entry points:
// function doPost(e) { return doPostCareers(e); }
// function doGet(e) { return doGetCareers(e); }


/* ============================================================================
 * COMMON HELPER FUNCTION
 * ============================================================================ */

function makeJsonResponse(data, statusCode) {
  var output = ContentService.createTextOutput(JSON.stringify(data))
                             .setMimeType(ContentService.MimeType.JSON);
  return output;
}

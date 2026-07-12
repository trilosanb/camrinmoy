/**
 * Careers / Job Application Form Spreadsheet Backend
 * Mrinmoy & Co. / BigMind Consulting
 * 
 * Instructions:
 * 1. Open the Google Sheet for CAREERS / JOB APPLICATIONS.
 * 2. Go to Extensions -> Apps Script.
 * 3. Delete any default code block and paste this script.
 * 4. Save and click "Deploy" -> "New Deployment".
 * 5. Choose "Web App". Set "Execute as" to "Me", and "Who has access" to "Anyone".
 * 6. Authorize the permissions, copy the Web App URL, and paste it into the 
 *    dashboard connection modal (Job Applications URL).
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

function doPost(e) {
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

function doGet(e) {
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

function makeJsonResponse(data, statusCode) {
  var output = ContentService.createTextOutput(JSON.stringify(data))
                             .setMimeType(ContentService.MimeType.JSON);
  return output;
}

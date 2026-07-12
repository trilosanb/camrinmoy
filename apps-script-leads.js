/**
 * Client Check-In (Leads) Form Spreadsheet Backend
 * Mrinmoy & Co. / BigMind Consulting
 * 
 * Instructions:
 * 1. Open the Google Sheet for CLIENT CHECK-INS / LEADS.
 * 2. Go to Extensions -> Apps Script.
 * 3. Delete any default code block and paste this script.
 * 4. Save and click "Deploy" -> "New Deployment".
 * 5. Choose "Web App". Set "Execute as" to "Me", and "Who has access" to "Anyone".
 * 6. Authorize the permissions, copy the Web App URL, and paste it into the 
 *    dashboard connection modal (Client Leads URL).
 */

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

function makeJsonResponse(data, statusCode) {
  var output = ContentService.createTextOutput(JSON.stringify(data))
                             .setMimeType(ContentService.MimeType.JSON);
  return output;
}

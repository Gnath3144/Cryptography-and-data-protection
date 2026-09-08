/**
 * Automated Attendance Webhook for Slack Channel #board-infinity
 * Workspace: gnath3144gmai-lbi3350.slack.com
 * Channel ID: C0C0U2PJ43A
 * Channel URL: https://gnath3144gmai-lbi3350.slack.com/archives/C0C0U2PJ43A
 * Target Sheet: Cryptographic and Data Protection Student list.xlsx (GID: 1241955991)
 */

function doGet(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName("Sheet1") || ss.getSheets()[0];
    var today = Utilities.formatDate(new Date(), "Asia/Kolkata", "dd-MM-yyyy");
    
    var colInfo = getOrCreateDateColumn(sheet, today);
    
    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      date: today,
      column: colInfo.column,
      newColumnCreated: colInfo.isNew,
      message: colInfo.isNew 
        ? "✅ Added new attendance date column for " + today + " at column " + colInfo.column + " with student checkboxes." 
        : "ℹ️ Attendance column for " + today + " already exists at column " + colInfo.column + "."
    })).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doPost(e) {
  try {
    var data = {};
    var isSlackInteraction = false;
    var responseUrl = "";
    var studentEmail = "";
    var studentName = "Student";
    var channelId = "";
    var channelName = "";

    // 1. Detect Slack Interactive Payload (Button Click)
    var rawPayload = null;
    if (e.parameter && e.parameter.payload) {
      rawPayload = e.parameter.payload;
    } else if (e.postData && e.postData.contents) {
      if (e.postData.type === "application/json") {
        try {
          data = JSON.parse(e.postData.contents);
          if (data.payload) rawPayload = data.payload;
        } catch (jsonErr) {}
      } else {
        data = parseQueryString(e.postData.contents);
        if (data.payload) rawPayload = data.payload;
      }
    } else if (e.parameter) {
      data = e.parameter;
      if (data.payload) rawPayload = data.payload;
    }

    if (rawPayload) {
      isSlackInteraction = true;
      var payloadObj = (typeof rawPayload === "string") ? JSON.parse(rawPayload) : rawPayload;
      var user = payloadObj.user || {};
      var channel = payloadObj.channel || {};
      responseUrl = payloadObj.response_url || "";
      
      studentName = user.name || user.username || "Student";
      channelId = channel.id || "";
      channelName = channel.name || "";
      
      if (user.username) {
        var u = user.username.toLowerCase();
        // Instructor test fallback: map gnath3144 to sample student RASUTH GOWDA for trial verification
        if (u.includes("gnath")) {
          studentEmail = "23bcar0050@jainuniversity.ac.in";
          studentName = "RASUTH GOWDA [Verified by Instructor " + (user.name || user.username) + "]";
        } else {
          studentEmail = u.includes("@") ? u : (u + "@jainuniversity.ac.in");
        }
      }
    } else {
      // Direct JSON API or n8n HTTP Request
      studentEmail = (data.email || data.user_email || "").trim().toLowerCase();
      studentName = data.user_name || data.name || "Student";
      channelId = (data.channel_id || data.channel || "").trim();
      channelName = (data.channel_name || "").trim().toLowerCase();
      
      // Instructor test fallback
      if (studentEmail.includes("gnath")) {
        studentEmail = "23bcar0050@jainuniversity.ac.in";
        studentName = "RASUTH GOWDA [Instructor Test]";
      }
    }

    // TARGET CHANNEL VERIFICATION: C0C0U2PJ43A (#board-infinity)
    var targetChannelId = "C0C0U2PJ43A";
    if (channelId && channelId !== targetChannelId && !channelName.includes("board")) {
      var msg = "⚠️ Attendance must be submitted from #board-infinity (Channel ID: " + targetChannelId + ").";
      return formatOutput(isSlackInteraction, { status: "error", message: msg }, msg);
    }

    if (!studentEmail) {
      var msg = "⚠️ Could not identify student email. Ensure your Slack username matches your @jainuniversity.ac.in ID.";
      return formatOutput(isSlackInteraction, { status: "error", message: msg }, msg);
    }

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName("Sheet1") || ss.getSheets()[0];
    
    // Format Today's Date: DD-MM-YYYY (e.g. 08-09-2026)
    var today = Utilities.formatDate(new Date(), "Asia/Kolkata", "dd-MM-yyyy");
    
    // 1. Get or dynamically create today's date column with full formatting & checkboxes
    var colInfo = getOrCreateDateColumn(sheet, today);
    var targetCol = colInfo.column;

    var lastRow = sheet.getLastRow();

    // 2. Locate student in Column B (Email roster)
    var emailRange = sheet.getRange(3, 2, lastRow - 2, 1).getValues();
    var studentRow = -1;

    for (var i = 0; i < emailRange.length; i++) {
      var sheetEmail = emailRange[i][0].toString().trim().toLowerCase();
      // Match exact email or student ID prefix (e.g. 23bcar0050)
      if (sheetEmail && (sheetEmail === studentEmail || sheetEmail.split("@")[0] === studentEmail.split("@")[0])) {
        studentRow = i + 3; // Offset for header rows (Row 1 & Row 2)
        studentEmail = sheetEmail; // Use canonical roster email
        break;
      }
    }

    if (studentRow === -1) {
      var msg = "❌ Student email (" + studentEmail + ") was not found in the official class roster.";
      return formatOutput(isSlackInteraction, { status: "not_found", message: msg }, msg);
    }

    // 3. Check current status
    var currentStatus = sheet.getRange(studentRow, targetCol).getValue();
    if (currentStatus === true) {
      var alreadyMsg = "ℹ️ You are already marked PRESENT for today (" + today + ").";
      postToSlack(responseUrl, alreadyMsg);
      return formatOutput(isSlackInteraction, { status: "already_marked", message: alreadyMsg }, alreadyMsg);
    }

    // 4. Mark student as PRESENT (TRUE / Checkbox Ticked)
    sheet.getRange(studentRow, targetCol).setValue(true);
    var successMsg = "✅ " + studentName + " (" + studentEmail + ") marked PRESENT for " + today + " in course register!";

    postToSlack(responseUrl, successMsg);

    return formatOutput(isSlackInteraction, {
      status: "success",
      message: successMsg,
      date: today,
      column: targetCol
    }, successMsg);

  } catch (err) {
    var errMsg = "❌ Error recording attendance: " + err.toString();
    return formatOutput(isSlackInteraction, { status: "error", message: errMsg }, errMsg);
  }
}

/**
 * Automatically locates today's date column or dynamically appends a new date column
 * with full header formatting, bold date label, and Google Sheets checkboxes for every student.
 */
function getOrCreateDateColumn(sheet, today) {
  var lastCol = sheet.getLastColumn();
  var lastRow = sheet.getLastRow();
  var dateRow = 2; // Date strings are on Row 2
  
  // Search existing columns starting from Col 9 (Col I)
  for (var col = 9; col <= lastCol; col++) {
    var cellVal = sheet.getRange(dateRow, col).getValue();
    if (cellVal) {
      var formattedCellDate = cellVal instanceof Date 
        ? Utilities.formatDate(cellVal, "Asia/Kolkata", "dd-MM-yyyy")
        : cellVal.toString().trim();
      if (formattedCellDate === today) {
        return { column: col, isNew: false };
      }
    }
  }

  // If not found, create a new column at the end of the sheet
  var newCol = lastCol + 1;

  // Header on Row 1 (Styled in University Blue)
  sheet.getRange(1, newCol)
    .setValue("Attendance")
    .setFontWeight("bold")
    .setHorizontalAlignment("center")
    .setBackground("#1a73e8")
    .setFontColor("#ffffff");

  // Date label on Row 2 (Bold, Centered, Soft Blue Highlight)
  sheet.getRange(dateRow, newCol)
    .setValue(today)
    .setFontWeight("bold")
    .setHorizontalAlignment("center")
    .setBackground("#e8f0fe")
    .setFontColor("#1967d2")
    .setNumberFormat("@"); // Store as explicit text string

  // Insert interactive Google Sheets checkboxes for all student rows (Row 3 to lastRow)
  if (lastRow >= 3) {
    var studentRange = sheet.getRange(3, newCol, lastRow - 2, 1);
    studentRange.insertCheckboxes();
    studentRange.setValue(false); // Default to unchecked (Absent)
    studentRange.setHorizontalAlignment("center");
  }

  // Set clean standard column width
  sheet.setColumnWidth(newCol, 110);

  return { column: newCol, isNew: true };
}

function postToSlack(responseUrl, text) {
  if (!responseUrl) return;
  try {
    UrlFetchApp.fetch(responseUrl, {
      method: "post",
      contentType: "application/json",
      payload: JSON.stringify({
        response_type: "ephemeral",
        replace_original: false,
        text: text
      }),
      muteHttpExceptions: true
    });
  } catch (e) {
    Logger.log("Slack post error: " + e);
  }
}

function formatOutput(isSlackInteraction, standardObj, slackText) {
  if (isSlackInteraction) {
    return ContentService.createTextOutput(JSON.stringify({
      response_type: "ephemeral",
      replace_original: false,
      text: slackText
    })).setMimeType(ContentService.MimeType.JSON);
  } else {
    return ContentService.createTextOutput(JSON.stringify(standardObj))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function parseQueryString(str) {
  var params = {};
  var pairs = str.split("&");
  for (var i = 0; i < pairs.length; i++) {
    var pair = pairs[i].split("=");
    params[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1] || "");
  }
  return params;
}

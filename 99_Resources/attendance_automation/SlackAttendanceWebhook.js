/**
 * Automated Attendance Webhook for Slack Channel #board-infinity
 * Workspace: gnath3144gmai-lbi3350.slack.com
 * Channel ID: C0C0U2PJ43A
 * Channel URL: https://gnath3144gmai-lbi3350.slack.com/archives/C0C0U2PJ43A
 * Target Sheet: Cryptographic and Data Protection Student list.xlsx (GID: 1241955991)
 */

function doPost(e) {
  try {
    var data;
    if (e.postData && e.postData.contents) {
      if (e.postData.type === "application/json") {
        data = JSON.parse(e.postData.contents);
      } else {
        data = parseQueryString(e.postData.contents);
      }
    } else if (e.parameter) {
      data = e.parameter;
    } else {
      return responseJSON({ status: "error", message: "No data received" });
    }

    // Extract student email, username, and channel info
    var studentEmail = (data.email || data.user_email || "").trim().toLowerCase();
    var studentName = data.user_name || data.name || "Student";
    var channelId = (data.channel_id || data.channel || "").trim();
    var channelName = (data.channel_name || "").trim().toLowerCase();

    // TARGET CHANNEL VERIFICATION: C0C0U2PJ43A (#board-infinity)
    var targetChannelId = "C0C0U2PJ43A";
    if (channelId && channelId !== targetChannelId && !channelName.includes("board")) {
      return responseJSON({
        status: "error",
        message: "Attendance must be submitted from #board-infinity (Channel ID: " + targetChannelId + ")."
      });
    }

    if (!studentEmail) {
      return responseJSON({ 
        status: "error", 
        message: "Could not find email. Ensure student Slack account uses the @jainuniversity.ac.in email address." 
      });
    }

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName("Sheet1") || ss.getSheets()[0];
    
    // Format Today's Date: DD-MM-YYYY (e.g. 07-09-2026, matching sheet format)
    var today = Utilities.formatDate(new Date(), "Asia/Kolkata", "dd-MM-yyyy");
    
    var lastCol = sheet.getLastColumn();
    var lastRow = sheet.getLastRow();
    var dateRow = 2; // Date strings are on Row 2
    var targetCol = -1;

    // 1. Find or create the column for today's date (starting from column I / col 9)
    for (var col = 9; col <= lastCol; col++) {
      var cellVal = sheet.getRange(dateRow, col).getValue();
      if (cellVal) {
        var colDateStr = (cellVal instanceof Date) 
          ? Utilities.formatDate(cellVal, "Asia/Kolkata", "dd-MM-yyyy")
          : cellVal.toString().trim();
        if (colDateStr === today) {
          targetCol = col;
          break;
        }
      }
    }

    // If today's column does not exist, automatically append it!
    if (targetCol === -1) {
      targetCol = lastCol + 1;
      sheet.getRange(1, targetCol).setValue("Date");
      sheet.getRange(dateRow, targetCol).setValue(today);
      // Initialize checkboxes for all students to FALSE
      for (var r = 3; r <= lastRow; r++) {
        sheet.getRange(r, targetCol).setValue(false);
      }
    }

    // 2. Search for student by Column B (Email)
    var emailRange = sheet.getRange(3, 2, lastRow - 2, 1).getValues();
    var studentRow = -1;

    for (var i = 0; i < emailRange.length; i++) {
      var rowEmail = emailRange[i][0].toString().trim().toLowerCase();
      if (rowEmail === studentEmail) {
        studentRow = i + 3; // +3 for 1-based indexing and 2 header rows
        break;
      }
    }

    if (studentRow === -1) {
      return responseJSON({
        status: "not_found",
        message: "Email " + studentEmail + " not found in student roster."
      });
    }

    // 3. Prevent duplicate check-ins
    var currentStatus = sheet.getRange(studentRow, targetCol).getValue();
    if (currentStatus === true) {
      return responseJSON({
        status: "already_marked",
        message: "You are already marked PRESENT for today (" + today + ")."
      });
    }

    // 4. Mark student as PRESENT (TRUE)
    sheet.getRange(studentRow, targetCol).setValue(true);

    return responseJSON({
      status: "success",
      message: "✅ " + studentName + " (" + studentEmail + ") marked PRESENT for " + today
    });

  } catch (err) {
    return responseJSON({ status: "error", message: err.toString() });
  }
}

function responseJSON(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
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

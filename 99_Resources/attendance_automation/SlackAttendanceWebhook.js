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

    var isSlackInteraction = false;
    var responseUrl = "";

    // Check if request comes from Slack Interactive Button click
    if (data.payload) {
      isSlackInteraction = true;
      var payloadObj = (typeof data.payload === "string") ? JSON.parse(data.payload) : data.payload;
      var user = payloadObj.user || {};
      var channel = payloadObj.channel || {};
      responseUrl = payloadObj.response_url || "";
      
      var studentName = user.name || user.username || "Student";
      var channelId = channel.id || "";
      var channelName = channel.name || "";
      
      // Match university email from Slack username (e.g. 23bcar0050 -> 23bcar0050@jainuniversity.ac.in)
      var studentEmail = "";
      if (user.username) {
        var u = user.username.toLowerCase();
        studentEmail = u.includes("@") ? u : (u + "@jainuniversity.ac.in");
      }
    } else {
      // Direct JSON / n8n HTTP Request
      var studentEmail = (data.email || data.user_email || "").trim().toLowerCase();
      var studentName = data.user_name || data.name || "Student";
      var channelId = (data.channel_id || data.channel || "").trim();
      var channelName = (data.channel_name || "").trim().toLowerCase();
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
    
    // Format Today's Date: DD-MM-YYYY (e.g. 08-09-2026, matching sheet format)
    var today = Utilities.formatDate(new Date(), "Asia/Kolkata", "dd-MM-yyyy");
    
    var lastCol = sheet.getLastColumn();
    var lastRow = sheet.getLastRow();
    var dateRow = 2; // Date strings are on Row 2
    var targetCol = -1;

    // 1. Find or create the column for today's date (starting from column I / col 9)
    for (var col = 9; col <= lastCol; col++) {
      var cellVal = sheet.getRange(dateRow, col).getValue();
      if (cellVal) {
        var formattedCellDate = cellVal instanceof Date 
          ? Utilities.formatDate(cellVal, "Asia/Kolkata", "dd-MM-yyyy")
          : cellVal.toString().trim();
        if (formattedCellDate === today) {
          targetCol = col;
          break;
        }
      }
    }

    if (targetCol === -1) {
      targetCol = lastCol + 1;
      sheet.getRange(dateRow, targetCol).setValue(today);
    }

    // 2. Locate student in Column B (Email roster)
    var emailRange = sheet.getRange(3, 2, lastRow - 2, 1).getValues();
    var studentRow = -1;

    for (var i = 0; i < emailRange.length; i++) {
      var sheetEmail = emailRange[i][0].toString().trim().toLowerCase();
      // Match exact email or student ID prefix (e.g. 23bcar0050)
      if (sheetEmail && (sheetEmail === studentEmail || sheetEmail.split("@")[0] === studentEmail.split("@")[0])) {
        studentRow = i + 3; // Offset for row 1 & 2
        studentEmail = sheetEmail; // Use canonical roster email
        break;
      }
    }

    if (studentRow === -1) {
      var msg = "❌ Student email (" + studentEmail + ") was not found in the official class roster.";
      return formatOutput(isSlackInteraction, { status: "not_found", message: msg }, msg);
    }

    // 3. Prevent duplicate check-ins
    var currentStatus = sheet.getRange(studentRow, targetCol).getValue();
    if (currentStatus === true) {
      var msg = "ℹ️ You are already marked PRESENT for today (" + today + ").";
      return formatOutput(isSlackInteraction, { status: "already_marked", message: msg }, msg);
    }

    // 4. Mark student as PRESENT (TRUE)
    sheet.getRange(studentRow, targetCol).setValue(true);
    var successMsg = "✅ " + studentName + " (" + studentEmail + ") marked PRESENT for " + today + " in course register!";

    // If Slack response_url is available, post immediate confirmation
    if (responseUrl) {
      try {
        UrlFetchApp.fetch(responseUrl, {
          method: "post",
          contentType: "application/json",
          payload: JSON.stringify({
            response_type: "ephemeral",
            replace_original: false,
            text: successMsg
          }),
          muteHttpExceptions: true
        });
      } catch (postErr) {
        Logger.log("responseUrl post error: " + postErr);
      }
    }

    return formatOutput(isSlackInteraction, {
      status: "success",
      message: successMsg
    }, successMsg);

  } catch (err) {
    var errMsg = "❌ Error recording attendance: " + err.toString();
    return formatOutput(isSlackInteraction, { status: "error", message: errMsg }, errMsg);
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

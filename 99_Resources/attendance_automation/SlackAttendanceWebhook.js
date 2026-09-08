/**
 * Automated Attendance Webhook for Slack Channel #board-infinity
 * Workspace: gnath3144gmai-lbi3350.slack.com
 * Channel ID: C0C0U2PJ43A
 * Channel URL: https://gnath3144gmai-lbi3350.slack.com/archives/C0C0U2PJ43A
 * Target Sheet: Cryptographic and Data Protection Student list.xlsx (GID: 1241955991)
 */

// Slack Incoming Webhook for #board-infinity announcements
var SLACK_CHANNEL_WEBHOOK = PropertiesService.getScriptProperties().getProperty("SLACK_WEBHOOK_URL") || "https://hooks.slack.com/services/YOUR_WORKSPACE/YOUR_BOT/YOUR_TOKEN";

function doGet(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName("Sheet1") || ss.getSheets()[0];
    
    // Support ?date=07-09-2026 query param, default to today
    var requestedDate = (e && e.parameter && e.parameter.date) 
      ? e.parameter.date.trim() 
      : Utilities.formatDate(new Date(), "Asia/Kolkata", "dd-MM-yyyy");
    
    var colInfo = getOrCreateDateColumn(sheet, requestedDate);
    var consolidated = buildConsolidatedColumn(sheet, colInfo.column, requestedDate);
    
    return ContentService.createTextOutput(JSON.stringify(consolidated))
      .setMimeType(ContentService.MimeType.JSON);
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

    // Direct Column Consolidation Request for n8n: { action: "get_column", date: "07-09-2026" }
    var action = (data && data.action) || (e.parameter && e.parameter.action) || "";
    if (action === "get_column") {
      var ss = SpreadsheetApp.getActiveSpreadsheet();
      var sheet = ss.getSheetByName("Sheet1") || ss.getSheets()[0];
      var targetDate = (data.date || (e.parameter && e.parameter.date) || Utilities.formatDate(new Date(), "Asia/Kolkata", "dd-MM-yyyy")).trim();
      var colInfo = getOrCreateDateColumn(sheet, targetDate);
      var consolidated = buildConsolidatedColumn(sheet, colInfo.column, targetDate);
      return ContentService.createTextOutput(JSON.stringify(consolidated)).setMimeType(ContentService.MimeType.JSON);
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
    
    // Format Today's Date: DD-MM-YYYY (e.g. 07-09-2026 or 08-09-2026)
    var today = (data.date || (e.parameter && e.parameter.date) || Utilities.formatDate(new Date(), "Asia/Kolkata", "dd-MM-yyyy")).trim();
    
    // 1. Get or dynamically create today's date column with Date header & checkboxes
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
      var alreadyMsg = "ℹ️ *Already Recorded:* You are already marked *PRESENT* for today (" + today + ").";
      postToSlack(responseUrl, alreadyMsg, false);
      
      var consolidatedData = buildConsolidatedColumn(sheet, targetCol, today);
      return formatOutput(isSlackInteraction, { 
        status: "already_marked", 
        message: alreadyMsg,
        date: today,
        column: targetCol,
        consolidated: consolidatedData
      }, alreadyMsg);
    }

    // 4. Mark student as PRESENT (TRUE / Checkbox Ticked)
    sheet.getRange(studentRow, targetCol).setValue(true);
    var successMsg = "✅ " + studentName + " (" + studentEmail + ") marked PRESENT for " + today + " in course register!";

    // A. Send private ephemeral confirmation card to the student in Slack
    postToSlack(responseUrl, successMsg, true, studentName, studentEmail, today);

    // B. Send live attendance broadcast to #board-infinity channel
    notifyChannelAttendance(studentName, studentEmail, today);

    // C. Build consolidated single-column output for n8n automation
    var consolidatedData = buildConsolidatedColumn(sheet, targetCol, today);

    return formatOutput(isSlackInteraction, {
      status: "success",
      message: successMsg,
      date: today,
      column: targetCol,
      raw_column_text: consolidatedData.raw_column_text,
      column_values: consolidatedData.column_values,
      items: consolidatedData.items,
      summary: consolidatedData.summary
    }, successMsg, true, studentName, studentEmail, today);

  } catch (err) {
    var errMsg = "❌ Error recording attendance: " + err.toString();
    return formatOutput(isSlackInteraction, { status: "error", message: errMsg }, errMsg);
  }
}

/**
 * Builds the exact consolidated single-column format requested for n8n:
 * Row 1: "Date"
 * Row 2: "07-09-2026"
 * Row 3..N: "TRUE" / "FALSE" for each student in the roster
 */
function buildConsolidatedColumn(sheet, col, dateStr) {
  var lastRow = sheet.getLastRow();
  var colValues = [];
  var rawTextLines = [];
  var items = [];
  var presentCount = 0;
  var absentCount = 0;

  // Row 1: Header ("Date")
  var headerVal = "Date";
  colValues.push(headerVal);
  rawTextLines.push(headerVal);
  items.push({ row: 1, value: headerVal });

  // Row 2: Date String ("07-09-2026")
  colValues.push(dateStr);
  rawTextLines.push(dateStr);
  items.push({ row: 2, value: dateStr });

  // Rows 3 to lastRow: Student Attendance Booleans (TRUE / FALSE)
  if (lastRow >= 3) {
    var rangeVals = sheet.getRange(3, col, lastRow - 2, 1).getValues();
    for (var i = 0; i < rangeVals.length; i++) {
      var rowNum = i + 3;
      var rawVal = rangeVals[i][0];
      var isPresent = (rawVal === true || rawVal === "TRUE" || rawVal === "true" || rawVal === 1);
      var strVal = isPresent ? "TRUE" : "FALSE";
      
      if (isPresent) {
        presentCount++;
      } else {
        absentCount++;
      }

      colValues.push(strVal);
      rawTextLines.push(strVal);
      items.push({ row: rowNum, value: strVal, boolean: isPresent });
    }
  }

  return {
    status: "success",
    date: dateStr,
    column: col,
    header: "Date",
    raw_column_text: rawTextLines.join("\n"),
    column_values: colValues,
    items: items,
    summary: {
      total_students: presentCount + absentCount,
      present: presentCount,
      absent: absentCount,
      attendance_percentage: (presentCount + absentCount > 0) 
        ? ((presentCount / (presentCount + absentCount)) * 100).toFixed(1) + "%" 
        : "0%"
    }
  };
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
        // Ensure Row 1 has "Date" header
        sheet.getRange(1, col).setValue("Date");
        return { column: col, isNew: false };
      }
    }
  }

  // If not found, create a new column at the end of the sheet
  var newCol = lastCol + 1;

  // Header on Row 1 (Explicitly "Date" styled in University Blue)
  sheet.getRange(1, newCol)
    .setValue("Date")
    .setFontWeight("bold")
    .setHorizontalAlignment("center")
    .setBackground("#1a73e8")
    .setFontColor("#ffffff");

  // Date label on Row 2 (e.g. 07-09-2026)
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
    studentRange.setValue(false); // Default to unchecked (FALSE / Absent)
    studentRange.setHorizontalAlignment("center");
  }

  // Set clean standard column width
  sheet.setColumnWidth(newCol, 110);

  return { column: newCol, isNew: true };
}

/**
 * Private response to the individual student
 */
function postToSlack(responseUrl, text, isSuccess, studentName, studentEmail, today) {
  if (!responseUrl) return;
  try {
    var payload = {
      response_type: "ephemeral",
      replace_original: false,
      text: text
    };
    
    if (isSuccess) {
      payload.blocks = [
        {
          type: "header",
          text: {
            type: "plain_text",
            text: "🎉 Attendance Confirmed!",
            emoji: true
          }
        },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: "✅ *Attendance successfully marked!*\n• *Student*: " + studentName + "\n• *Email*: `" + studentEmail + "`\n• *Date*: *" + today + "* (07:50 AM – 10:50 AM)\n• *Status*: *PRESENT* in official Google Sheet."
          }
        },
        {
          type: "context",
          elements: [
            {
              type: "mrkdwn",
              text: "🔒 Verified Course Register • Channel: *#board-infinity*"
            }
          ]
        }
      ];
    }

    UrlFetchApp.fetch(responseUrl, {
      method: "post",
      contentType: "application/json",
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    });
  } catch (e) {
    Logger.log("Slack post error: " + e);
  }
}

/**
 * Live broadcast to #board-infinity channel
 */
function notifyChannelAttendance(studentName, studentEmail, today) {
  if (!SLACK_CHANNEL_WEBHOOK || SLACK_CHANNEL_WEBHOOK.includes("YOUR_WORKSPACE")) return;
  try {
    UrlFetchApp.fetch(SLACK_CHANNEL_WEBHOOK, {
      method: "post",
      contentType: "application/json",
      payload: JSON.stringify({
        text: "🎓 *Attendance Update:* ✅ *" + studentName + "* (`" + studentEmail + "`) has marked attendance for *" + today + "*."
      }),
      muteHttpExceptions: true
    });
  } catch (e) {
    Logger.log("Channel webhook error: " + e);
  }
}

function formatOutput(isSlackInteraction, standardObj, slackText, isSuccess, studentName, studentEmail, today) {
  if (isSlackInteraction) {
    var resp = {
      response_type: "ephemeral",
      replace_original: false,
      text: slackText
    };
    if (isSuccess) {
      resp.blocks = [
        {
          type: "header",
          text: {
            type: "plain_text",
            text: "🎉 Attendance Confirmed!",
            emoji: true
          }
        },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: "✅ *Attendance successfully marked!*\n• *Student*: " + studentName + "\n• *Email*: `" + studentEmail + "`\n• *Date*: *" + today + "* (07:50 AM – 10:50 AM)\n• *Status*: *PRESENT* in official Google Sheet."
          }
        },
        {
          type: "context",
          elements: [
            {
              type: "mrkdwn",
              text: "🔒 Verified Course Register • Channel: *#board-infinity*"
            }
          ]
        }
      ];
    }
    return ContentService.createTextOutput(JSON.stringify(resp)).setMimeType(ContentService.MimeType.JSON);
  } else {
    return ContentService.createTextOutput(JSON.stringify(standardObj)).setMimeType(ContentService.MimeType.JSON);
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

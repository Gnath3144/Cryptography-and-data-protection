# Slack Attendance Automation for #board-infinity

- **Slack Channel**: `#board-infinity`
- **Channel ID**: `C0C0U2PJ43A`
- **Channel Link**: [gnath3144gmai-lbi3350.slack.com/archives/C0C0U2PJ43A](https://gnath3144gmai-lbi3350.slack.com/archives/C0C0U2PJ43A)
- **Target Google Sheet**: [Cryptographic and Data Protection Student list.xlsx](https://docs.google.com/spreadsheets/d/1RdGz6eca5_t5xdSUiHtgF8OEb9l02ePW/edit?gid=1241955991#gid=1241955991)

---

## 🛠️ Step 1: Deploy Webhook in Google Sheets

1. Open your [Student list spreadsheet](https://docs.google.com/spreadsheets/d/1RdGz6eca5_t5xdSUiHtgF8OEb9l02ePW/edit?gid=1241955991#gid=1241955991).
2. Go to **Extensions** ➔ **Apps Script**.
3. Copy the contents of [`SlackAttendanceWebhook.js`](./SlackAttendanceWebhook.js) and paste it into the editor (replace any existing template code).
4. Click **Deploy** ➔ **New deployment**:
   - **Type**: Web app
   - **Description**: `Board Infinity Attendance Webhook`
   - **Execute as**: `Me`
   - **Who has access**: `Anyone`
5. Click **Deploy**, approve permissions, and copy the **Web App URL**.

---

## ⚡ Step 2: Configure Slack Workflow Builder

1. Open your Slack workspace: **gnath3144gmai-lbi3350.slack.com**.
2. Click workspace name (top left) ➔ **Tools** ➔ **Workflow Builder**.
3. Click **Create Workflow**:
   - Name: `Class Attendance Check-in`
4. **Choose a Trigger**:
   - **Schedule**: Set to post at class start time (e.g. 09:00 AM) in channel `#board-infinity`.
   - *OR* **Channel shortcut**: Add a shortcut button in `#board-infinity`.
5. **Add Action 1: Send interactive message**:
   - Channel: `#board-infinity`
   - Message: `📢 Good morning class! Class is in session. Click below to mark your daily attendance.`
   - Add button: `🟢 Check In`
6. **Add Action 2: Send a Webhook request**:
   - Webhook URL: *(Paste your Google Apps Script Web App URL from Step 1)*
   - Request Body (JSON):
     ```json
     {
       "email": "{{user_email}}",
       "user_name": "{{user_name}}",
       "channel_id": "C0C0U2PJ43A",
       "channel_name": "board-infinity",
       "timestamp": "{{timestamp}}"
     }
     ```
7. **Add Action 3: Ephemeral Confirmation Message**:
   - Send private message to the person who clicked:
     `✅ Your attendance has been logged in the register for today.`
8. Click **Publish**!

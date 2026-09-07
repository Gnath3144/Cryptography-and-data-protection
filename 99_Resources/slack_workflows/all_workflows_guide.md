# Complete Slack Workflow Automation Suite for #board-infinity

This guide provides the complete blueprint to set up all 4 classroom automations inside your Slack workspace:
**`https://gnath3144gmai-lbi3350.slack.com`** in channel **`#board-infinity`** (`C0C0U2PJ43A`).

---

## 📋 The 4 Core Classroom Automations

| # | Automation Name | Trigger | Actions |
|---|---|---|---|
| **1** | **Daily Attendance Check-in** | Scheduled daily at class start time (e.g. 09:00 AM) | Posts interactive Check-in card ➔ Sends Webhook to Google Sheet ➔ Logs `TRUE` next to student email. |
| **2** | **Student Welcome & Onboarding** | New member joins `#board-infinity` | Auto-sends private DM with Syllabus, Google Drive, and GitHub repo links. |
| **3** | **Daily Exit Ticket (Comprehension Pulse)** | Scheduled at class end (e.g. 10:50 AM) | Posts 1-click feedback poll (*"How confident do you feel about today's cipher?"*). |
| **4** | **Raise a Doubt / Lab Help Queue** | Channel Shortcut button `⚡ Ask a Question` | Student submits question in a modal ➔ Formats and posts ticket to instructor queue. |

---

## 🛠️ Workflow 1: Daily Attendance Check-in (Detailed Setup)

1. In Slack, click **gnath3144gmai-lbi3350** (top left) ➔ **Tools** ➔ **Workflow Builder**.
2. Click **Create Workflow** (or **New Workflow**).
3. Name it: `Daily Attendance Check-in`.
4. **Choose a trigger**:
   - Select **On a schedule**.
   - Frequency: Every weekday (Monday to Friday) at your class time (e.g. `09:00 AM`).
5. **Add Step 1: Send a message**:
   - Send to: **Channel** ➔ `#board-infinity`.
   - Message text:
     ```markdown
     📢 *Good morning class! Attendance check-in is now open.*
     Please click the button below within the next 15 minutes to register your presence for today's session in *Cryptography & Data Protection*.
     ```
   - Check the box: **Add a button**.
   - Button label: `🟢 Check In Now`
   - Button style: **Primary (Green)**.
6. **Add Step 2: Send a web request (Webhook)**:
   - Webhook URL: `[PASTE YOUR GOOGLE APPS SCRIPT WEB APP URL]`
   - HTTP Method: `POST`
   - Content Type: `application/json`
   - Custom body parameters:
     ```json
     {
       "email": "{{user_email}}",
       "user_name": "{{user_name}}",
       "channel_id": "C0C0U2PJ43A",
       "channel_name": "board-infinity",
       "timestamp": "{{timestamp}}"
     }
     ```
7. **Add Step 3: Send a message**:
   - Send to: **Person who clicked the button**.
   - Message text: `✅ Thanks {{user_name}}! Your attendance has been logged in the register for today.`
8. Click **Publish** (top right).

---

## 🛠️ Workflow 2: Student Welcome & Onboarding

1. In **Workflow Builder**, click **Create Workflow**.
2. Name it: `Student Welcome - Cryptography & Data Protection`.
3. **Choose a trigger**:
   - Select **When someone joins a channel**.
   - Channel: `#board-infinity`.
4. **Add Step: Send a message**:
   - Send to: **Person who joined the channel** (private DM).
   - Message text:
     ```markdown
     👋 *Welcome to Cryptography and Data Protection, {{user_name}}!*

     Here are your essential course links to get started:
     • 📚 *Official Student List & Attendance*: [Google Sheet](https://docs.google.com/spreadsheets/d/1RdGz6eca5_t5xdSUiHtgF8OEb9l02ePW/edit?gid=1241955991#gid=1241955991)
     • 💻 *Course Code & Lab Repository*: [GitHub Repo](https://github.com/Gnath3144/Cryptography-and-data-protection.git)
     • 📁 *Class Notes & Presentations*: [Google Drive Course Folder]

     📌 *Class Rules & Industry Etiquette*:
     1. Mark your attendance daily at 09:00 AM via the check-in prompt in #board-infinity.
     2. Keep all technical questions and lab discussions in the channel threads so your peers can learn too.
     3. Ensure your Slack account uses your `@jainuniversity.ac.in` student email so attendance syncs automatically!
     ```
5. Click **Publish**.

---

## 🛠️ Workflow 3: Daily Exit Ticket (Comprehension Check)

1. In **Workflow Builder**, click **Create Workflow**.
2. Name it: `Daily Exit Ticket`.
3. **Choose a trigger**:
   - Select **On a schedule** (e.g. Mon–Fri at `10:50 AM`).
4. **Add Step: Send a message**:
   - Send to: `#board-infinity`.
   - Message text:
     ```markdown
     📊 *Session Wrap-up: Quick Pulse Check*
     How confident do you feel about today's cryptographic concepts?
     • React with 🟢 if you understood completely and are ready for the lab.
     • React with 🟡 if you need to review the lecture slides.
     • React with 🔴 if you have questions or got stuck.
     ```
5. Click **Publish**.

---

## 🛠️ Workflow 4: Raise a Doubt / Lab Help Request

1. In **Workflow Builder**, click **Create Workflow**.
2. Name it: `Ask a Question / Lab Help`.
3. **Choose a trigger**:
   - Select **From a link or shortcut in Slack**.
   - Available in: `#board-infinity`.
   - Short description: `Ask for help with code or lecture concepts`.
4. **Add Step 1: Collect info in a form**:
   - Title: `Submit a Question`
   - Question 1: `Topic / Day (e.g., Day 01 Classical Ciphers)` (Short text)
   - Question 2: `Describe your question or error` (Long text)
   - Question 3: `Paste code snippet or error message` (Optional long text)
5. **Add Step 2: Send a message**:
   - Send to: `#board-infinity`.
   - Message text:
     ```markdown
     ❓ *Question from {{user_name}}*
     *Topic*: {{Form.Topic}}
     *Details*: {{Form.Details}}
     ```
6. Click **Publish**.

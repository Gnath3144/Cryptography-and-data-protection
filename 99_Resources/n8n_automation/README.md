# End-to-End n8n Classroom Attendance Automation Guide

This guide walks you through importing and running the end-to-end **n8n workflow** that completely automates classroom attendance from **Slack `#board-infinity`** into your **Google Sheet**.

---

## ⚡ Architecture Overview

```
[Cron Trigger (09:00 AM)] ➔ [Slack Post: Check-In Button in #board-infinity]
                                          │
                               (Student Clicks Button)
                                          ▼
[Slack Interactivity Webhook] ➔ [Parse Date (DD-MM-YYYY)] ➔ [Fetch Student Email from Slack API]
                                                                        │
                                                                        ▼
[Confirm to Student in Slack] ◄── [Update Sheet (TRUE)] ◄── [Match Row in Google Sheet]
```

---

## 🚀 Step 1: Launch n8n

If you don't have n8n running yet, you can start it immediately in 1 command:

### Option A: Using npx (Fastest, No Docker needed)
```bash
npx n8n
```
*Open http://localhost:5678 in your browser.*

### Option B: Using Docker
```bash
docker run -it --rm --name n8n -p 5678:5678 -v ~/.n8n:/home/node/.n8n n8nio/n8n
```

### Option C: n8n Cloud
Log in to your dashboard at [n8n.io](https://n8n.io).

---

## 📥 Step 2: Import the Workflow in n8n (1 Click)

1. Open your **n8n dashboard** (`http://localhost:5678`).
2. Click **Workflows** ➔ Click the **`...` (Options menu)** at the top right ➔ **Import from File**.
3. Select [`n8n_classroom_attendance_workflow.json`](./n8n_classroom_attendance_workflow.json).
4. *Voila!* The complete multi-node pipeline will appear on your canvas.

---

## 🔑 Step 3: Connect Credentials in n8n

### 1. Slack Credentials
* Double-click any Slack node (e.g. `Post Check-in Card to #board-infinity`).
* Under **Credential to connect with**, select **Create New Credential**.
* Paste your **Slack Bot User OAuth Token** (starts with `xoxb-...` from your Slack App at [api.slack.com/apps](https://api.slack.com/apps)).

### 2. Google Sheets Credentials
* Double-click the `Read Student List Sheet` node.
* Under **Credential to connect with**, select **Create New Credential** ➔ **Google Sheets OAuth2 API**.
* Click **Sign in with Google** and select your account that has access to [Cryptographic and Data Protection Student list.xlsx](https://docs.google.com/spreadsheets/d/1RdGz6eca5_t5xdSUiHtgF8OEb9l02ePW/edit?gid=1241955991#gid=1241955991).

---

## 🔗 Step 4: Link n8n Webhook to Slack

1. In your n8n workflow canvas, double-click the **`Slack Interactivity Webhook`** node.
2. Copy the **Production URL** (or Test URL for debugging), for example:
   `https://your-n8n-domain.com/webhook/slack-attendance-checkin`
3. Go to [api.slack.com/apps](https://api.slack.com/apps) ➔ Select your Slack App ➔ **Interactivity & Shortcuts**.
4. Turn **Interactivity ON** and paste the n8n webhook URL into the **Request URL** field.
5. Click **Save Changes**.

---

## 🧪 Step 5: Test the Workflow

1. In n8n, click **Execute Workflow** (bottom bar).
2. Right-click the `Post Check-in Card to #board-infinity` node and click **Execute Node**.
3. In Slack channel `#board-infinity`, the green **"🟢 Check In for Today"** card will appear!
4. Click the button.
5. Watch n8n execute live:
   * It captures your Slack click.
   * Pulls your `@jainuniversity.ac.in` student email.
   * Matches your row in the spreadsheet.
   * Sets today's date column to `TRUE` (checkbox checked).
   * Sends an instant ephemeral confirmation back to your Slack client:
     *"✅ Attendance Confirmed! Hello [Name], your attendance has been recorded as PRESENT for today."*
6. Toggle the **Active** switch at the top right of the n8n workflow to **ON** to enable the automatic 09:00 AM schedule!

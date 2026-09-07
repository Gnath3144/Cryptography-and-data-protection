import time
import os
import json
from playwright.sync_api import sync_playwright

WORKFLOW_FILE = r"c:\Users\gnath\OneDrive\Documents\Cryptograpghy_Data_protection\99_Resources\n8n_automation\n8n_classroom_attendance_workflow.json"
SCREENSHOT_FILE = r"c:\Users\gnath\OneDrive\Documents\Cryptograpghy_Data_protection\99_Resources\n8n_automation\n8n_canvas_screenshot.png"
N8N_URL = "http://localhost:5678"

with open(WORKFLOW_FILE, "r", encoding="utf-8") as f:
    workflow_json = json.load(f)

with sync_playwright() as p:
    print("Launching browser with Playwright...")
    browser = p.chromium.launch(headless=False, slow_mo=300)
    context = browser.new_context(viewport={"width": 1440, "height": 900})
    page = context.new_page()

    print(f"Navigating to {N8N_URL}...")
    page.goto(f"{N8N_URL}/signin", wait_until="networkidle")
    time.sleep(2)

    # 1. Sign In
    if page.locator("button:has-text('Sign in')").is_visible():
        print("Signing in with admin account...")
        page.locator("input[type='email'], input[name='email']").fill("gnath3144@gmail.com")
        page.locator("input[type='password']").fill("CryptoDataProtection2026!")
        page.locator("button:has-text('Sign in')").click()
        print("Clicked Sign in, waiting for dashboard...")
        page.wait_for_load_state("networkidle")
        time.sleep(4)

    # 2. Skip any popups / surveys
    skip_btn = page.locator("button:has-text('Skip'), a:has-text('Skip'), [data-test-id*='skip']").first
    if skip_btn.is_visible(timeout=3000):
        print("Skipping survey modal...")
        skip_btn.click()
        time.sleep(2)

    close_modal = page.locator("[data-test-id='modal-close'], button[aria-label='Close']").first
    if close_modal.is_visible(timeout=2000):
        close_modal.click()
        time.sleep(1)

    print(f"Logged in successfully. Current URL: {page.url}")

    # 3. Create/Import Workflow via n8n internal REST API (session authenticated!)
    print("Importing workflow via session API...")
    import_result = page.evaluate("""async (wf) => {
        try {
            const res = await fetch('/rest/workflows', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(wf)
            });
            return await res.json();
        } catch (err) {
            return { error: err.toString() };
        }
    }""", workflow_json)

    print("Import result:", import_result)

    # If workflow created, navigate directly to it!
    wf_id = import_result.get("data", {}).get("id") or import_result.get("id")
    if wf_id:
        print(f"Workflow successfully created with ID: {wf_id}")
        page.goto(f"{N8N_URL}/workflow/{wf_id}", wait_until="networkidle")
    else:
        print("Opening new workflow canvas...")
        page.goto(f"{N8N_URL}/workflow/new", wait_until="networkidle")

    time.sleep(4)

    # Fit canvas view
    page.keyboard.press("1")  # n8n shortcut to center/fit workflow
    time.sleep(2)

    # Save screenshot of the imported workflow canvas
    page.screenshot(path=SCREENSHOT_FILE, full_page=True)
    print(f"Workflow canvas screenshot saved to: {SCREENSHOT_FILE}")

    print("Playwright end-to-end automation complete!")
    time.sleep(5)
    browser.close()

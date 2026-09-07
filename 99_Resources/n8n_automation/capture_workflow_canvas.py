import time
import os
from playwright.sync_api import sync_playwright

SCREENSHOT_FILE = r"c:\Users\gnath\OneDrive\Documents\Cryptograpghy_Data_protection\99_Resources\n8n_automation\n8n_canvas_screenshot.png"
N8N_URL = "http://localhost:5678"

with sync_playwright() as p:
    print("Launching Chromium via Playwright...")
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 1600, "height": 950})

    print(f"Navigating to {N8N_URL}/signin...")
    page.goto(f"{N8N_URL}/signin", wait_until="domcontentloaded")
    time.sleep(3)

    # 1. Sign In if needed
    if page.locator("button:has-text('Sign in')").is_visible():
        print("Signing in with admin credentials...")
        page.locator("input[type='email']").fill("gnath3144@gmail.com")
        page.locator("input[type='password']").fill("CryptoDataProtection2026!")
        page.locator("button:has-text('Sign in')").click()
        time.sleep(4)

    # 2. Dismiss any customization / survey modals
    get_started_btn = page.locator("button:has-text('Get started')")
    if get_started_btn.is_visible(timeout=2000):
        get_started_btn.click()
        time.sleep(1)

    page.keyboard.press("Escape")
    time.sleep(1)

    # 3. Navigate directly to imported workflow
    workflow_url = f"{N8N_URL}/workflow/cryptoattend123"
    print(f"Opening workflow URL: {workflow_url}...")
    page.goto(workflow_url, wait_until="domcontentloaded")
    time.sleep(5)

    # Dismiss any guide/onboarding tooltips if present
    page.keyboard.press("Escape")
    time.sleep(1)

    # Fit canvas to screen
    page.keyboard.press("Shift+1")
    time.sleep(1)
    page.keyboard.press("1")
    time.sleep(2)

    # Capture canvas screenshot
    page.screenshot(path=SCREENSHOT_FILE, full_page=True)
    print(f"Screenshot successfully saved to: {SCREENSHOT_FILE}")

    browser.close()
    print("Playwright capture completed!")

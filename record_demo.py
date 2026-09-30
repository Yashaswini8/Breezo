"""Record a ~60s live demo of the deployed Breezo app with Playwright."""

import os
import shutil
import time

from playwright.sync_api import sync_playwright

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "video_out")
URL = "https://yashaswini8.github.io/Breezo/"
TARGET = 60.0

if os.path.isdir(OUT):
    shutil.rmtree(OUT)
os.makedirs(OUT, exist_ok=True)


def scroll_to(page, y):
    page.evaluate(
        "y => window.scrollTo({top: y, behavior: 'smooth'})", y
    )
    time.sleep(1.1)


def glide(page, sel, steps=18):
    try:
        box = page.locator(sel).first.bounding_box()
        if box:
            page.mouse.move(box["x"] + box["width"] / 2, box["y"] + box["height"] / 2, steps=steps)
    except Exception:
        pass


def main():
    t0 = time.monotonic()

    with sync_playwright() as p:
        browser = p.chromium.launch(args=["--force-color-profile=srgb", "--font-render-hinting=none"])
        ctx = browser.new_context(
            viewport={"width": 1920, "height": 1080},
            record_video_dir=OUT,
            record_video_size={"width": 1920, "height": 1080},
            device_scale_factor=1,
        )
        page = ctx.new_page()

        # 1. Cold load — skeleton visible, then Chennai resolves (~8s)
        page.goto(URL, wait_until="domcontentloaded")
        time.sleep(2.2)
        page.wait_for_selector("text=US AQI right now", timeout=45000)
        time.sleep(2.4)

        # 2. Settle on the AQI card, drift the cursor across the status bar (~7s)
        glide(page, "text=US AQI right now", steps=25)
        time.sleep(2.6)
        scroll_to(page, 260)
        glide(page, "text=PM2.5", steps=20)
        time.sleep(2.6)

        # 3. Forecast chart, hover a point to raise the tooltip (~9s)
        scroll_to(page, 620)
        glide(page, ".recharts-wrapper", steps=22)
        time.sleep(1.9)
        box = page.locator(".recharts-wrapper").first.bounding_box()
        if box:
            page.mouse.move(box["x"] + box["width"] * 0.62, box["y"] + box["height"] * 0.45, steps=25)
            time.sleep(1.5)
            page.mouse.move(box["x"] + box["width"] * 0.34, box["y"] + box["height"] * 0.62, steps=25)
        time.sleep(2.4)

        # 4. City search: type "Bangalore" -> aliases to "Bengaluru" (~11s)
        scroll_to(page, 0)
        page.locator('input[aria-label="Search a city"]').click()
        time.sleep(1.2)
        page.keyboard.type("Bangalore", delay=115)
        time.sleep(2.0)
        page.wait_for_selector("ul li button", timeout=25000)
        time.sleep(2.6)

        # 5. Pick Bengaluru from the dropdown (~7s)
        glide(page, "ul li button", steps=16)
        time.sleep(1.5)
        page.locator("ul li button").first.click()
        page.wait_for_selector("text=US AQI right now", timeout=45000)
        time.sleep(3.0)

        # 6. Personalised tips: switch profile Child -> Asthma (~10s)
        scroll_to(page, 640)
        time.sleep(0.8)
        page.select_option("#profile", "Child")
        time.sleep(3.0)
        page.select_option("#profile", "Asthma")
        time.sleep(3.0)

        # 7. Full-page sweep to finish (~7s)
        scroll_to(page, 0)
        time.sleep(1.4)
        scroll_to(page, 520)
        time.sleep(1.5)
        scroll_to(page, 0)
        time.sleep(1.6)

        # Pad to the target length so the cut lands on a clean hold.
        while time.monotonic() - t0 < TARGET - 0.6:
            time.sleep(0.25)

        ctx.close()
        browser.close()

    vids = [f for f in os.listdir(OUT) if f.endswith(".webm")]
    if not vids:
        raise SystemExit("no video produced")
    src = os.path.join(OUT, vids[0])
    print("RAW:", src)
    print("ELAPSED: %.1fs" % (time.monotonic() - t0))


if __name__ == "__main__":
    main()

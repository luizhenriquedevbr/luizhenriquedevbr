import os
import threading
import http.server
import time
from playwright.sync_api import sync_playwright

PROJECT_DIR = os.path.dirname(os.path.abspath(__file__))
OUT_DIR = os.path.join(PROJECT_DIR, "screenshots")
os.makedirs(OUT_DIR, exist_ok=True)

# Sobe servidor HTTP local para servir os arquivos
class SilentHandler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *args): pass

def start_server():
    os.chdir(PROJECT_DIR)
    server = http.server.HTTPServer(("localhost", 8765), SilentHandler)
    server.serve_forever()

t = threading.Thread(target=start_server, daemon=True)
t.start()
time.sleep(1)

BASE = "http://localhost:8765"

with sync_playwright() as p:
    browser = p.chromium.launch()

    # === Desktop full-page ===
    page = browser.new_page(viewport={"width": 1440, "height": 900})
    page.goto(BASE, wait_until="domcontentloaded")
    page.wait_for_timeout(1200)

    # Forca todos os elementos animados a ficarem visiveis para screenshot
    page.add_style_tag(content="""
        .fade-in { opacity: 1 !important; transform: none !important; }
        * { animation-duration: 0.01s !important; transition-duration: 0.01s !important; }
        .hero__scroll { display: none !important; }
    """)
    page.wait_for_timeout(400)

    page.screenshot(path=os.path.join(OUT_DIR, "01-fullpage-desktop.png"), full_page=True)
    print("OK 01-fullpage-desktop.png")

    # === Seções individuais ===
    sections = [
        ("#hero",           "02-hero.png"),
        ("#solucoes",       "03-solucoes.png"),
    ]

    for selector, filename in sections:
        try:
            el = page.locator(selector)
            el.screenshot(path=os.path.join(OUT_DIR, filename))
            print(f"OK {filename}")
        except Exception as e:
            print(f"ERRO {filename}: {e}")

    # === Tablet e mobile ===
    tablet = browser.new_page(viewport={"width": 768, "height": 1024})
    tablet.goto(BASE, wait_until="networkidle")
    tablet.wait_for_timeout(1200)
    tablet.screenshot(path=os.path.join(OUT_DIR, "04-tablet.png"), full_page=True)
    print("OK 04-tablet.png")

    mobile = browser.new_page(viewport={"width": 375, "height": 812})
    mobile.goto(BASE, wait_until="networkidle")
    mobile.wait_for_timeout(1200)
    mobile.screenshot(path=os.path.join(OUT_DIR, "05-mobile.png"), full_page=True)
    print("OK 05-mobile.png")

    browser.close()

print(f"\nScreenshots salvos em: {OUT_DIR}")

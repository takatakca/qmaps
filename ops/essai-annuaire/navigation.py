from pathlib import Path
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from threading import Thread
from urllib.request import urlopen
from urllib.error import HTTPError
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
import json

class Preview(SimpleHTTPRequestHandler):
    def do_GET(self):
        if self.path.startswith("/api/v1/"):
            try:
                upstream = urlopen("http://127.0.0.1:3102" + self.path[4:], timeout=10)
            except HTTPError as error:
                upstream = error
            with upstream:
                self.send_response(upstream.status)
                self.send_header("Content-Type", upstream.headers["content-type"])
                self.end_headers()
                self.wfile.write(upstream.read())
        else:
            if not Path("dist", self.path.split("?")[0].lstrip("/")).is_file():
                self.path = "/index.html"
            return super().do_GET()

class Served(Preview):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory="dist", **kwargs)

httpd = ThreadingHTTPServer(("127.0.0.1", 4899), Served)
Thread(target=httpd.serve_forever, daemon=True).start()
origin = "http://127.0.0.1:4899"
opts = webdriver.ChromeOptions()
opts.add_argument("--headless=new")
opts.add_argument("--window-size=1440,1050")
observations = Path("observations")
observations.mkdir(exist_ok=True)
try:
    with webdriver.Chrome(options=opts) as browser:
        wait = WebDriverWait(browser, 30)
        def visit(path, expected):
            browser.get(origin + path)
            wait.until(lambda d: expected in d.find_element(By.TAG_NAME, "body").text)
        visit("/search?city=Montreal", "2 résultats à Montréal")
        names = [a.text for a in browser.find_elements(By.CSS_SELECTOR, "h3 a[href^='/business/']")]
        assert len(names) == 2 and any("Bistro" in name for name in names) and any("Café" in name for name in names), names
        browser.save_screenshot(str(observations / "recherche-postgresql.png"))
        button = wait.until(lambda d: next((b for b in d.find_elements(By.CSS_SELECTOR, "button[aria-label='Enregistrer']") if b.is_enabled()), False))
        button.click()
        wait.until(lambda d: "/compte?fiche=" in d.current_url)
        wait.until(lambda d: d.find_elements(By.CSS_SELECTOR, "input[type='password']"))
        visit("/search?city=Laval&category=restaurants", "0 résultat")
        visit("/city/montreal", "QMAPS Démo — Bistro de nuit")
        visit("/city/montreal/restaurants", "QMAPS Démo — Café du quartier")
        visit("/c/restaurants", "QMAPS Démo — Bistro de nuit")
        visit("/business/a9bf0001-0000-4000-8000-000000000001", "Ouvrir cette fiche dans mon compte")
        wait.until(lambda d: d.find_element(By.TAG_NAME, "h1").text == "QMAPS Démo — Bistro de nuit")
        browser.save_screenshot(str(observations / "fiche-postgresql.png"))
        print(json.dumps({"catalogue":names,"filtres":True,"ville":True,"categorie":True,"favori_vers_compte":True,"fiche":True}, ensure_ascii=False))
finally:
    httpd.shutdown()

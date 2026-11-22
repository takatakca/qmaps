"""Public, read-only comparison of the discovery and merchant entry points."""
import json
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait

output = Path("observations")
output.mkdir(exist_ok=True)

def visit(driver, url):
    driver.get(url)
    WebDriverWait(driver, 20).until(lambda d: d.find_element(By.TAG_NAME, "body").text.strip())

def reference():
    options = webdriver.FirefoxOptions()
    options.add_argument("-headless")
    with webdriver.Firefox(options=options) as driver:
        driver.set_page_load_timeout(40)
        observations = {}
        for role, url in {
            "client": "https://www.yelp.ca/search?find_desc=Restaurants&find_loc=Montr%C3%A9al%2C+QC",
            "merchant": "https://biz.yelp.com/",
        }.items():
            try:
                visit(driver, url)
                page = driver.find_element(By.TAG_NAME, "body").text.lower()
                blocked = any(t in page for t in ("captcha", "verify you are human", "access denied", "robot", "enable js", "verify that you are human", "vérifiez que vous êtes humain"))
                controls = {
                    "location": ("location", "adresse", "montréal", "montreal"),
                    "filters": ("all filters", "tous les filtres", "filters"),
                    "hours": ("open now", "ouvert"),
                    "reviews": ("reviews", "avis"),
                    "claim": ("claim", "revendiqu"),
                    "sign_in": ("log in", "sign in", "connexion"),
                }
                observations[role] = {"url": driver.current_url, "title": driver.title,
                    "interstitial": blocked, "controls": [] if blocked else
                    [key for key, terms in controls.items() if any(term in page for term in terms)]}
            except Exception as problem:
                observations[role] = {"unavailable": type(problem).__name__}
        return observations

def qmaps():
    options = webdriver.ChromeOptions()
    options.add_argument("--headless=new")
    options.add_argument("--window-size=1440,1100")
    with webdriver.Chrome(options=options) as driver:
        driver.set_page_load_timeout(40)
        visit(driver, "https://qmaps.ca/")
        driver.save_screenshot(str(output / "qmaps-accueil.png"))
        visit(driver, "https://qmaps.ca/search?city=Montr%C3%A9al")
        def result(d):
            for link in d.find_elements(By.CSS_SELECTOR, "a[href*='/business/']"):
                if link.is_displayed():
                    return link
            return False
        link = WebDriverWait(driver, 20).until(result)
        target = link.get_attribute("href")
        WebDriverWait(driver, 12).until(lambda d: "résultat" in d.find_element(By.TAG_NAME, "body").text.lower())
        driver.save_screenshot(str(output / "qmaps-recherche.png"))
        link.click()
        WebDriverWait(driver, 20).until(lambda d: d.current_url.split("?")[0] == target.split("?")[0] and any(h.text.strip() for h in d.find_elements(By.TAG_NAME,"h1")))
        heading = driver.find_element(By.TAG_NAME, "h1").text
        driver.save_screenshot(str(output / "qmaps-fiche.png"))
        visit(driver, "https://qmaps.ca/compte")
        WebDriverWait(driver, 20).until(lambda d: d.find_elements(By.CSS_SELECTOR,"input[type='password']"))
        driver.save_screenshot(str(output / "qmaps-compte.png"))
        visit(driver, "https://qmaps.ca/console")
        WebDriverWait(driver, 20).until(lambda d: d.find_elements(By.CSS_SELECTOR,"input[type='password']"))
        return {"city":"Montréal", "opened_business":target, "heading":heading, "account_login": True, "console_login": True}

with ThreadPoolExecutor(max_workers=2) as pool:
    yelp_result = pool.submit(reference)
    qmaps_result = pool.submit(qmaps)
    try:
        observations = {"Firefox / Yelp": yelp_result.result(), "Chrome / QMAPS": qmaps_result.result()}
    finally:
        if yelp_result.done() and not yelp_result.exception():
            (output / "yelp.json").write_text(json.dumps(yelp_result.result(),ensure_ascii=False,indent=2))
    report = json.dumps(observations,ensure_ascii=False,indent=2)
    (output / "parcours.json").write_text(report)
    print(report)

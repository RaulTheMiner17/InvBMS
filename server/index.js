import express from "express";
import cors from "cors";
import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import AdblockerPlugin from "puppeteer-extra-plugin-adblocker";
import path from "path";
import { fileURLToPath } from "url";  // ✅ Fix for __dirname

const app = express();
const PORT = process.env.PORT || 3005;

// Apply Puppeteer plugins
puppeteer.use(StealthPlugin());
puppeteer.use(AdblockerPlugin({ blockTrackers: true }));

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(cors());
app.use(express.json());

app.get("/api/scrape", async (req, res) => {
  try {
    const { url } = req.query;
    if (!url) {
      console.warn("[WARN] No URL provided");
      return res.status(400).json({ error: "URL is required" });
    }

    console.log(`[INFO] Scraping URL: ${url}`);

    const browser = await puppeteer.launch({
      headless: "new",
      args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-gpu"],
    });

    const page = await browser.newPage();
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
    );

    console.log("[INFO] Navigating to page...");
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });

    console.log("[INFO] Extracting JSON-LD data...");
    
    const jsonLdDataArray = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('script[type="application/ld+json"]'))
        .map(script => script.textContent)
        .map(text => {
          try {
            return JSON.parse(text);
          } catch (err) {
            return null;
          }
        })
        .filter(data => data);
    });

    console.log(`[INFO] Found ${jsonLdDataArray.length} JSON-LD scripts.`);
    await browser.close();

    if (!jsonLdDataArray.length) {
      console.warn("[WARN] No JSON-LD data found.");
      return res.status(404).json({ error: "No JSON-LD data found" });
    }

    const flattenedJsonLd = jsonLdDataArray.flat();
    const eventData = flattenedJsonLd.find(item => item["@type"] === "Event" && item.offers);

    if (!eventData || !eventData.offers) {
      console.warn("[WARN] No offers found in JSON-LD data.");
      return res.status(404).json({ error: "No offers found" });
    }

    console.log(`[INFO] Extracted ${eventData.offers.length} offers.`);
    
    const offers = eventData.offers.map(offer => ({
      name: offer.name,
      price: offer.price,
      priceCurrency: offer.priceCurrency,
      availability: offer.availability,
      inventoryLevel: offer.inventoryLevel || "0",
      validFrom: offer.validFrom,
    }));

    return res.json({ offers });
  } catch (error) {
    console.error("[ERROR] Scraping error:", error.message);
    return res.status(500).json({ error: "Failed to scrape", details: error.message });
  }
});

// Serve frontend from "dist"
app.use(express.static(path.join(__dirname, "../dist")));

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../dist", "index.html"));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

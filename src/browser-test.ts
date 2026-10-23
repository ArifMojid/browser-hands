import { chromium } from "playwright";

// Launch Microsoft Edge (already installed on windows)
// headless: false means you'll actually SEE the window open
const browser = await chromium.launch({ channel: "msedge", headless: false });

// A "page" is one browser tab
const page = await browser.newPage();

// Go to a website and wait for it to load
await page.goto("https://example.com");

// Read the page's title (the text shown on the browser tab)
const title = await page.title();
console.log("Page title:", title);

// Close the browser when done
await browser.close();
import { chromium, type Browser, type Page } from "playwright";

// Keep ONE browser and ONE tab open and reuse them
let browser: Browser | null = null;
let page: Page | null = null;

// Get the tab, launching Edge the first time it's needed
export async function getPage(): Promise<Page> {
  if (!page) {
    browser = await chromium.launch({ channel: "msedge", headless: false });
    page = await browser.newPage();
  }
  return page;
}

// Tool 1: go to a URL
export async function openPage(url: string) {
  const p = await getPage();
  await p.goto(url, { waitUntil: "domcontentloaded" });
  return { url: p.url(), title: await p.title() };
}

// Tool 2: turn the current page into clean text for an AI
export async function readPage(maxChars = 5000) {
  const p = await getPage();
  const text = await p.innerText("body");               // all visible text
  const clean = text.replace(/\n\s*\n+/g, "\n").trim(); // remove blank lines
  return {
    url: p.url(),
    title: await p.title(),
    text: clean.slice(0, maxChars),   // cap length so the AI isn't flooded
    truncated: clean.length > maxChars,
  };
}

// Close everything when finished
export async function closeBrowser() {
  await browser?.close();
  browser = null;
  page = null;
}
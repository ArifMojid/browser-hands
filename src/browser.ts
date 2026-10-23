import { chromium, type Browser, type Page } from "playwright";

// Keep ONE browser and ONE tab open and reuse them
let browser: Browser | null = null;
let page: Page | null = null;

// Get the tab, launching Edge if needed.
// Also recovers if the user closed the window or Edge crashed.
export async function getPage(): Promise<Page> {
    // Browser missing or dead? Launch a fresh one.
    if (!browser || !browser.isConnected()) {
        browser = await chromium.launch({ channel: "msedge", headless: false });
        // If Edge closes later, forget it so the next call starts fresh
        browser.on("disconnected", () => {
            browser = null;
            page = null;
        });
        page = null;
    }

    // Tab missing or closed? Open a new one.
    if (!page || page.isClosed()) {
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

// Tool 3: list clickable things and inputs, each with a number ("ref")
export async function listElements(limit = 50) {
    const p = await getPage();
    return await p.$$eval(
        "a, button, input, select, textarea, [role=button]",
        (els, limit) => {
            document.querySelectorAll("[data-bh-ref]").forEach((e) => e.removeAttribute("data-bh-ref"));
            return els
                .filter((el) => {
                    const r = el.getBoundingClientRect();
                    return r.width > 0 && r.height > 0;
                })
                .slice(0, limit)
                .map((el, i) => {
                    el.setAttribute("data-bh-ref", String(i));
                    const h = el as HTMLElement;
                    const text = (
                        h.innerText ||
                        h.getAttribute("aria-label") ||
                        h.getAttribute("placeholder") ||
                        h.getAttribute("name") ||
                        ""
                    ).trim().slice(0, 80);
                    return { ref: i, tag: el.tagName.toLowerCase(), text };
                });
        },
        limit
    );
}

// Tool 4: click an element by its ref number
export async function clickElement(ref: number) {
    const p = await getPage();
    await p.click(`[data-bh-ref="${ref}"]`);
    await p.waitForLoadState("domcontentloaded");
    return { url: p.url(), title: await p.title() };
}

// Tool 5: type into an input by its ref number
export async function fillElement(ref: number, value: string) {
    const p = await getPage();
    await p.fill(`[data-bh-ref="${ref}"]`, value);
    return { ok: true, ref, value };
}

// Tool 6: press a keyboard key (e.g. "Enter", "Tab", "Escape", "ArrowDown")
// If a ref is given, press it on that element. If the page re-rendered and the
// ref went stale, fall back to pressing it wherever the cursor already is.
export async function pressKey(key: string, ref?: number) {
    const p = await getPage();
    const urlBefore = p.url();
    let staleRef = false;

    if (ref !== undefined) {
        const target = p.locator(`[data-bh-ref="${ref}"]`);
        if ((await target.count()) > 0) {
            await target.press(key, { timeout: 5000 });
        } else {
            staleRef = true;              // element was replaced; don't wait 30s for it
            await p.keyboard.press(key);
        }
    } else {
        await p.keyboard.press(key);
    }

    // If the key triggers navigation (e.g. Enter submits a search), wait for it.
    // Keys like Tab or Escape usually don't navigate, so give up after 3 seconds.
    await p.waitForURL((u) => u.toString() !== urlBefore, { timeout: 3000 }).catch(() => { });
    await p.waitForLoadState("domcontentloaded");
    return { url: p.url(), title: await p.title(), staleRef };
}
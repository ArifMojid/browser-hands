import { openPage, readPage, closeBrowser } from "./browser.js";

await openPage("https://example.com");
const result = await readPage();
console.log(result);
await closeBrowser();
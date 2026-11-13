import { open, goHome, txt, shot } from "./agent-D-h.mjs";
const {b, page} = await open("journey");
await goHome(page);
await page.getByRole('button',{name:/Minggu Ini/}).click(); await page.waitForTimeout(700);
console.log(await txt(page,1300));
await shot(page,"D","E15-dashboard-after-split");
await b.close();

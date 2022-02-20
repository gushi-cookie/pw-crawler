const puppeteer = require('puppeteer');
const fs = require('fs');

async function savePageAsMHTML(cdpSession) {
    let { data } = await cdpSession.send('Page.captureSnapshot');
    fs.writeFileSync('page.mhtml', data);
}

(async () => {
    const browser = await puppeteer.launch({
        headless: true,
        defaultViewport: {width: 1366, height: 768},
        args: ['--user-data-dir=./profile']
    });
    const page = await browser.newPage();
    await page.goto('https://vk.com/feed');

    const cdpSession = await page.target().createCDPSession();
    await savePageAsMHTML(cdpSession);

    await browser.close();
})();
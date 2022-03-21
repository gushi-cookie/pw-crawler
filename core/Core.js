const puppeteer = require('puppeteer');
const fs = require('fs');
const DynamicContainerSafe = require('./DynamicContainerSafe');
const ScrollPageLoad = require('./ScrollPageLoad');
const Logger = require('./Logger');

module.exports = class Core {

    constructor() {
        this.browser = null;
        this.pages = new Array();

        this.headless = true;
        this.defaultViewport = {width: 1366, height: 768};
        this.args = ['--user-data-dir=./profile'];
    };


    async createBrowserInstance() {
        this.browser = await puppeteer.launch({
            headless: this.headless,
            defaultViewport: this.defaultViewport,
            args: this.args,
        });
    };
    
    async closeBrowser() {
        if(this.browser !== null) {
            await this.browser.close();
            this.browser = null;
        }
    };

    async createNewPage(url) {
        let page = await this.browser.newPage();
        await page.goto(url);
        this.pages.push(page);
        return page;
    };


    async manualProfileInput(page) {
        let logger = new Logger();
        logger.initLogger('MPI', true);

        let waitComplition = async () => {
            await new Promise((resolve, reject) => {
                let intervalId = setInterval(() => {
                    if(page.isClosed()) {
                        clearInterval(intervalId);
                        resolve();
                    }
                }, 1000);
            });
        };

        logger.log('MPI mode has started');
        return waitComplition;
    };

    async savePageAsMHTML(page, path) {
        let cdpSession = await page.target().createCDPSession();
        let { data } = await cdpSession.send('Page.captureSnapshot');
        fs.writeFileSync(path + `${await page.title()}.mhtml`, data);
        await cdpSession.detach();
    };

    async scrollPageLoad(page, selector, scrollDown, timeout) {
        let spl = new ScrollPageLoad(page, selector, scrollDown, timeout);
        await spl.init();
        return spl;
    };

    async dynamicContainerSafe(page, selector, insertBegin, strict) {
        let dcs = new DynamicContainerSafe(page, selector, insertBegin, strict);
        return dcs;
    };
};
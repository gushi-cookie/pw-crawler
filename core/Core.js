const puppeteer = require('puppeteer');
const fs = require('fs');
const DynamicContainerSafe = require('./DynamicContainerSafe');

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

    async createNewPage(url) {
        let page = await this.browser.newPage();
        await page.goto(url);
        this.pages.push(page);
        return page;
    };


    static async pageConsoleLogHandler(msg) {
        const msgArgs = msg.args();
        for (let i = 0; i < msgArgs.length; ++i) {
            console.log(await msgArgs[i].jsonValue());
        }
    };
    static async pageErrorLogHandler(error) {
        console.log(error);
    };
    static enablePageLog(page) {
        page.on('console', Core.pageConsoleLogHandler);
        page.on('error', Core.pageErrorLogHandler);
    };
    static disablePageLog(page) {
        page.off('console', Core.pageConsoleLogHandler);
        page.off('error', Core.pageErrorLogHandler);
    };


    static async savePageAsMHTML(page, path) {
        let cdpSession = await page.target().createCDPSession();
        let { data } = await cdpSession.send('Page.captureSnapshot');
        fs.writeFileSync(path + 'page.mhtml', data);
        console.log('Page saved to ' + path + 'page.mhtml');
        await cdpSession.detach();
    };


    static async scrollPageLoadUntilEnd(page, scrollDown, timeout, dcsSelector = null, dcsInsertBegin = 'aftercontent', dcsStrict = false) {
        let dcs = null;

        if(dcsSelector !== null) {
            dcs = new DynamicContainerSafe(page, dcsSelector, dcsInsertBegin, dcsStrict);
            await dcs.serveContainer();
        }
        
        await page.evaluate((scrollDown, timeout) => {
            return new Promise((resolve, reject) => {
    
                let lastScrollTimestamp = null;
                let recursionTimeoutId = null;
                let loggerIntervalId = null;
                let timeoutIntervalId = null;

                let randomIntFromInterval = function(min, max) {
                    // min and max included 
                    return Math.floor(Math.random() * (max - min + 1) + min)
                };
                
                let scrollerRecursion = function() {
                    let doc = document.documentElement;

                    let scrollTo = scrollDown ? doc.scrollTop + 400 : doc.scrollTop - 400;
                    let prevScrollTop = doc.scrollTop;

                    if(scrollTo >= 0) {
                        doc.scrollTo(0, scrollTo);
                    } else {
                        doc.scrollTo(0, 0);
                    }

                    if(prevScrollTop - doc.scrollTop !== 0) {
                        lastScrollTimestamp = new Date().getTime();
                    }
    
                    recursionTimeoutId = setTimeout(scrollerRecursion, randomIntFromInterval(400, 1000));
                };
                scrollerRecursion();
        
                loggerIntervalId = setInterval(() => {
                    let date = new Date();
                    let time = date.getHours() + ':' + date.getMinutes() + ':' + date.getSeconds();
                    
                    console.log(`\n------------${time}-------------`);
                    console.log(`Date: ${document.getElementsByClassName('im-page--history-new-bar_days')[0].innerText}`);
                    console.log(`Scroll: ${document.documentElement.scrollHeight - document.documentElement.scrollTop}px`);
                }, 5000);

                timeoutIntervalId = setInterval(() => {
                    if(new Date().getTime() - lastScrollTimestamp >= timeout) {
                        clearTimeout(recursionTimeoutId);
                        clearInterval(loggerIntervalId);
                        clearInterval(timeoutIntervalId);
                        resolve();
                    }
                }, 30000);
            });
        }, scrollDown, timeout);

        if(dcs !== null) await dcs.stopServe();
    };
};
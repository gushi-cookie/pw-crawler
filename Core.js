const puppeteer = require('puppeteer');
const fs = require('fs');

module.exports = class Core {

    constructor() {
        this.browser = null;
        this.pages = new Array();

        this.headless = true;
        this.defaultViewport = {width: 1366, height: 768};
        this.args = ['--user-data-dir=./profile'];

        this.savePageFolder = './result/';
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
    enablePageLog(page) {
        page.on('console', Core.pageConsoleLogHandler);
        page.on('error', Core.pageErrorLogHandler);
    };
    disablePageLog(page) {
        page.off('console', Core.pageConsoleLogHandler);
        page.off('error', Core.pageErrorLogHandler);
    };


    static async savePageAsMHTML(page) {
        let cdpSession = await page.target().createCDPSession();
        let { data } = await cdpSession.send('Page.captureSnapshot');
        fs.writeFileSync(this.savePageFolder + 'page.mhtml', data);
        await cdpSession.detach();
    };


    static async scrollPageLoadUntilEnd(page, scrollDown) {
        await page.evaluate(() => {
            return new Promise((resolve, reject) => {
    
                let randomIntFromInterval = function(min, max) {
                    // min and max included 
                    return Math.floor(Math.random() * (max - min + 1) + min)
                };
                
                let scrollerRecursion = function() {
                    let doc = document.documentElement;
                    let scrollTo = scrollDown ? doc.scrollTop + 250 : doc.scrollTop - 250;
                
                    if(scrollTo >= 0) {
                        doc.scrollTo(0, scrollTo);
                    } else {
                        doc.scrollTo(0, scrollDown ? doc.scrollTop : 0);
                    }
    
                    setTimeout(scrollerRecursion, randomIntFromInterval(400, 1000));
                };
                scrollerRecursion();
        
                setInterval(() => {
                    let date = new Date();
                    let time = date.getHours() + ':' + date.getMinutes() + ':' + date.getSeconds();
                    
                    console.log(`\n------------${time}-------------`);
                    console.log(`Date: ${document.getElementsByClassName('im-page--history-new-bar_days')[0].innerText}`);
                    console.log(`ScrollHeight: ${document.documentElement.scrollHeight}px`);
                }, 5000);
            });
        });
    };
};
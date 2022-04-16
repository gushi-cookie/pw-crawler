const Logger = require("./Logger");

module.exports = class ScrollPageLoad {

    constructor(page, selector, scrollDown, timeout) {
        this.page = page;
        this.selector = selector;
        this.scrollDown = scrollDown;
        this.timeout = timeout;
        this.logger = new Logger();

        this.dataId = null;
        this.dataProperty = null;
    };

    async init() {
        let result = await this.page.evaluate(() => {
            let dataId;
            let dataProperty;

            do {
                dataId = Math.random().toString(36).slice(2);
                dataProperty = `scrollPageLoadData_${dataId}`;

                if(window[dataProperty] === undefined) {
                    window[dataProperty] = {
                        moduleAbbr: 'SPL',
                        moduleId: dataId,
                        scroller_TimeoutId: null,
                        enabled: false,
                    };
                    break;
                }
            } while(true);

            return { dataId: dataId, dataProperty: dataProperty };
        });

        this.dataId = result.dataId;
        this.dataProperty = result.dataProperty;

        this.logger.initLogger('SPL', true, this.dataId, Logger.FgColor.BLUE);
        this.logger.enablePageLog(this.page);

        this.logger.log('Instance initialized.');
    };


    async waitComplition() {
        await this.page.evaluate((dataProperty) => {
            return new Promise((resolve, reject) => {
                let intervalId = setInterval(() => {
                    if(!window[dataProperty].enabled) {
                        clearInterval(intervalId);
                        resolve();
                    }
                }, 1000);
            });
        }, this.dataProperty);
    };

    async enableScrollLoad() {
        await this.page.evaluate((selector, scrollDown, timeout, dataProperty) => {
            
            let lastScrollTimestamp = null;
            let target = document.querySelector(selector);

            let log = function(message) {
                console.log(JSON.stringify({
                    moduleAbbr: window[dataProperty].moduleAbbr,
                    moduleId: window[dataProperty].moduleId,
                    message: message,
                }));
            };

            let randomIntFromInterval = function(min, max) {
                // min and max included 
                return Math.floor(Math.random() * (max - min + 1) + min)
            };

            let scrollerRecursion = function(prevScrollHeight) {
                let scrollTo = scrollDown ? target.scrollTop + 700 : target.scrollTop - 700;
                let prevScrollTop = target.scrollTop;

                target.scrollTo(0, scrollTo);

                if(prevScrollTop - target.scrollTop !== 0) {
                    lastScrollTimestamp = new Date().getTime();
                }

                if(lastScrollTimestamp !== null && new Date().getTime() - lastScrollTimestamp >= timeout) {
                    window[dataProperty].enabled = false;
                    window[dataProperty].scroller_TimeoutId = null;
                    log('Scrolling has ended.');
                } else if(window[dataProperty].enabled) {
                    if(prevScrollHeight !== null && prevScrollHeight !== target.scrollHeight) {
                        window[dataProperty].scroller_TimeoutId = setTimeout(scrollerRecursion, 2000, target.scrollHeight);
                    } else {
                        window[dataProperty].scroller_TimeoutId = setTimeout(scrollerRecursion, randomIntFromInterval(400, 1000), target.scrollHeight);
                    }
                }
            };

            window[dataProperty].enabled = true;
            scrollerRecursion(null);
            log('Scrolling has started.');

        }, this.selector, this.scrollDown, this.timeout, this.dataProperty);
    };

    async disableScrollLoad() {
        await this.page.evaluate((dataProperty) => {
            window[dataProperty].enabled = false;

            if(window[dataProperty].scroller_TimeoutId !== null) {
                clearTimeout(window[dataProperty].scroller_TimeoutId);
                window[dataProperty].scroller_TimeoutId = null;
            }
        }, this.dataProperty);
    };
}
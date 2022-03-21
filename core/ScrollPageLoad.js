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
        this.logger.enablePageErrorLog(this.page);

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

            let randomIntFromInterval = function(min, max) {
                // min and max included 
                return Math.floor(Math.random() * (max - min + 1) + min)
            };

            let scrollerRecursion = function() {
                let scrollTo = scrollDown ? target.scrollTop + 400 : target.scrollTop - 400;
                let prevScrollTop = target.scrollTop;

                target.scrollTo(0, scrollTo);

                if(prevScrollTop - target.scrollTop !== 0) {
                    lastScrollTimestamp = new Date().getTime();
                }

                if(lastScrollTimestamp !== null && new Date().getTime() - lastScrollTimestamp >= timeout) {
                    window[dataProperty].enabled = false;
                    window[dataProperty].scroller_TimeoutId = null;
                    console.log('Scrolling has ended.');
                } else if(window[dataProperty].enabled) {
                    window[dataProperty].scroller_TimeoutId = setTimeout(scrollerRecursion, randomIntFromInterval(400, 1000));
                }
            };

            window[dataProperty].enabled = true;
            scrollerRecursion();
            console.log('Scrolling has started');

        }, this.selector, this.direction, this.timeout, this.dataProperty);
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
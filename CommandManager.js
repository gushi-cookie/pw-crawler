const Core = require("./core/Core");

module.exports = class CommandManager {

    static printHelpMessage() {
        console.log('Command usage.. (in TODO)');
    };

    static isValidURL(str) {
        var pattern = new RegExp('^(https?:\\/\\/)?'+ // protocol
            '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|'+ // domain name
            '((\\d{1,3}\\.){3}\\d{1,3}))'+ // OR ip (v4) address
            '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*'+ // port and path
            '(\\?[;&a-z\\d%_.~+=-]*)?'+ // query string
            '(\\#[-a-z\\d_]*)?$','i'); // fragment locator
        return !!pattern.test(str);
    };


    async init(core, args) {
        this.core = core;
        this.savePagePath = './result/';

        let headedMode = false;

        let scrollPageLoadUrl = null;
        let scrollPageLoadDirection = 'bottom';
        let scrollPageLoadTimeout = 180000;
        let savePageOnScrollLoadComplete = null;

        let dynamicContainerSafe_Selector = null;
        let dynamicContainer_InsertBegin = 'aftercontent';
        let dynamicContainer_Strict = false;

        if(args.length === 0 || args[0] === '-h' || args[0] === '--help') {
            CommandManager.printHelpMessage();
            return;
        }

        for(let i = 0; i < args.length; i++) {
            if(args[i] === '--manual-profile-input') {
                let url = 'https://google.com';
                if(args.length - 1 > i && CommandManager.isValidURL(args[i + 1])) {
                    url = args[i + 1];
                }
                await this.manualProfileInput(url);
                return;
            } else if(args[i] === '--headed') {
                headedMode = true;
            } else if(args[i] === '--scroll-page-load') {
                // --scroll-page-load <url>
                
                if(i === args.length - 1) {
                    throw new Error('Value is not set for --scroll-page-load <url> parameter.');
                }

                let url = args[i + 1];
                if(url === undefined || !CommandManager.isValidURL(args[i + 1])) {
                    throw new Error('Invalid url for --scroll-page-load parameter. Url: ' + args[i + 1]);
                }

                scrollPageLoadUrl = url;
            } else if(args[i] === '--scroll-page-load-direction') {
                // --scroll-page-load-direction <top|bottom>

                if(i === args.length - 1) {
                    throw new Error('Value is not set for --scroll-page-load-direction parameter. Available: <top|bottom>.');
                } else if(!['top', 'bottom'].includes(args[i + 1])) {
                    throw new Error('Invalid value for --scroll-page-load-direction paremeter. Avialable <top|bottom>. Given: ' + args[i + 1]);
                }

                scrollPageLoadDirection = args[i + 1];
            } else if(args[i] === '--save-page-on-scroll-load-complete') {
                // --save-page-on-scroll-load-complete [mhtml] default: mhtml

                if(i === args.length - 1) {
                    savePageOnScrollLoadComplete = 'mhtml';
                } else if(['mhtml'].includes(args[i + 1])) {
                    savePageOnScrollLoadComplete = args[i + 1];
                } else {
                    savePageOnScrollLoadComplete = 'mhtml';
                }
            } else if(args[i] === '--scroll-page-load-timeout') {
                // --scroll-page-load-timeout <ms> default: 180000

                if(i === args.length - 1) {
                    throw new Error('Value is not set for --scroll-page-load-timeout <ms> parameter.');
                }
                
                let delay = parseInt(args[i + 1]);
                if(isNaN(delay) || delay <= 0) {
                    throw new Error('Invalid value for --scroll-page-load-timeout parameter. Given: ' + args[i + 1]);
                }

                scrollPageLoadTimeout = delay;
            } else if(args[i] === '--dynamic-container-safe') {
                // --dynamic-container-safe <selector>

                if(i === args.length - 1) {
                    throw new Error('Value is not set for --dynamic-container-safe <selector>.');
                }

                dynamicContainerSafe_Selector = args[i + 1];
            } else if(args[i] === '--dynamic-container-insert-begin') {
                // --dynamic-container-insert-begin <beforecontent|aftercontent>  default: aftercontent

                if(i === args.length - 1) {
                    throw new Error('Value is not set for --dynamic-container-insert-begin <beforecontent|aftercontent>.');
                }

                if(!['beforecontent', 'aftercontent'].includes(args[i + 1])) {
                    throw new Error('Invalid value for --dynamic-container-insert-begin parameter. Available: <beforecontent|aftercontent>. Given: ' + args[i + 1]);
                }

                dynamicContainer_InsertBegin = args[i + 1];
            } else if(args[i] === '--dynamic-container-strict') {
                // --dynamic-container-strict
                dynamicContainer_Strict = true;
            }
        }
    
        this.core.headless = !headedMode;

        if(scrollPageLoadUrl !== null) {
            await this.scrollPageLoad(scrollPageLoadUrl, scrollPageLoadDirection, scrollPageLoadTimeout, savePageOnScrollLoadComplete, dynamicContainerSafe_Selector, dynamicContainer_InsertBegin, dynamicContainer_Strict);
        }

        if(this.core.browser !== null) {
            await this.core.browser.close();
        }
    };


    async manualProfileInput(url) {
        this.core.headless = false;
        await this.core.createBrowserInstance();
        let page = await this.core.createNewPage(url);
        Core.enablePageLog(page);
    };

    async scrollPageLoad(url, direction, timeout, savePageFormat, dynamicContainerSafe_Selector, dynamicContainer_InsertBegin, dynamicContainer_Strict) {
        await this.core.createBrowserInstance();
        let page = await this.core.createNewPage(url);
        Core.enablePageLog(page);

        await Core.scrollPageLoadUntilEnd(page, direction === 'bottom', timeout, dynamicContainerSafe_Selector, dynamicContainer_InsertBegin, dynamicContainer_Strict);
        
        if(savePageFormat !== null) {
            if(savePageFormat === 'mhtml') {
                await Core.savePageAsMHTML(page, this.savePagePath);
            } else {
                console.log(`Handler for saving page in ${savePageFormat} format not found.`);
            }
        }
    };

};
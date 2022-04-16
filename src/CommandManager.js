const Core = require("./core/Core");
const FileSystem = require('fs');
const Buffer = require('buffer');
const Logger = require("./core/Logger");

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
        this.logger = new Logger();
        this.logger.initLogger('CMD', true);

        this.core = core;
        this.savePagePath = process.cwd() + '/result/';
        this.url = null;

        let headedMode = false;
        let manualProfileInput = false;
        let savePageOnComplete_Format = null;

        let scrollPageLoad_Selector = null;
        let scrollPageLoad_Direction = 'bottom';
        let scrollPageLoad_Timeout = 180000;

        let dynamicContainerSafe_Selector = null;
        let dynamicContainer_InsertBegin = 'aftercontent';
        let dynamicContainer_Strict = false;

        let externalScript = null;

        let bulkContentCaching_Selector = null;
        let bulkContentCaching_CutSize = 50;
        let bulkContentCaching_Limit = 300;
        let bulkContentCaching_InsertBegin = 'aftercontent';


        if(args.length === 0 || args[0] === '-h' || args[0] === '--help') {
            CommandManager.printHelpMessage();
            return;
        }

        for(let i = 0; i < args.length; i++) {
            if(args[i] === '--manual-profile-input') {
                // --manual-profile-input
                manualProfileInput = true;
            } else if(args[i] === '--headed') {
                // --headed
                headedMode = true;
            } else if(args[i] === '--scroll-page-load') {
                // --scroll-page-load <selector>
                if(args[i + 1] === undefined) {
                    throw new Error('Invalid value for parameter --scroll-page-load. Format: <selector>. Passed: ' + args[i + 1]);
                } else {
                    scrollPageLoad_Selector = args[i + 1];
                }
            } else if(args[i] === '--scroll-page-load-direction') {
                // --scroll-page-load-direction <top|bottom> default: bottom
                if(!['top', 'bottom'].includes(args[i + 1])) {
                    throw new Error('Invalid value for --scroll-page-load-direction paremeter. Format: <top|bottom>. Passed: ' + args[i + 1]);
                } else {
                    scrollPageLoad_Direction = args[i + 1];
                }
            } else if(args[i] === '--save-page-on-complete') {
                // --save-page-on-complete [mhtml] default: mhtml
                if(['mhtml'].includes(args[i + 1])) {
                    savePageOnComplete_Format = args[i + 1];
                } else {
                    savePageOnComplete_Format = 'mhtml';
                }
            } else if(args[i] === '--scroll-page-load-timeout') {
                // --scroll-page-load-timeout <ms> default: 180000
                let timeout = parseInt(args[i + 1]);
                if(isNaN(timeout) || timeout <= 0) {
                    throw new Error('Invalid value for --scroll-page-load-timeout parameter. Format: <ms>. Passed: ' + args[i + 1]);
                }
                scrollPageLoad_Timeout = timeout;
            } else if(args[i] === '--dynamic-container-safe') {
                // --dynamic-container-safe <selector>
                if(args[i + 1] === undefined) {
                    throw new Error('Invalid value for --dynamic-container-safe parameter. Format: <selector>. Passed: ' + args[i + 1]);
                }
                dynamicContainerSafe_Selector = args[i + 1];
            } else if(args[i] === '--dynamic-container-insert-begin') {
                // --dynamic-container-insert-begin <beforecontent|aftercontent>  default: aftercontent
                if(!['beforecontent', 'aftercontent'].includes(args[i + 1])) {
                    throw new Error('Invalid value for --dynamic-container-insert-begin parameter. Format: <beforecontent|aftercontent>. Passed: ' + args[i + 1]);
                }
                dynamicContainer_InsertBegin = args[i + 1];
            } else if(args[i] === '--dynamic-container-strict') {
                // --dynamic-container-strict
                dynamicContainer_Strict = true;
            } else if(args[i] === '--external-script') {
                // --external-script <path>
                if(args[i + 1] === undefined) {
                    throw new Error('Invalid value for --external-script parameter. Format: <path>. Passed: ' + args[i + 1]);
                }
                
                let result = FileSystem.readFileSync(args[i + 1]);
                if(result instanceof String) {
                    externalScript = result;
                } else if(result instanceof Buffer.Buffer) {
                    externalScript = result.toString('utf-8');
                }
            } else if(args[i] === '--bulk-content-caching') {
                // --bulk-content-caching <selector>
                if(args[i + 1] === undefined) {
                    throw new Error('Invalid value for --bulk-content-caching parameter. Format: <selector>. Passed: ' + args[i + 1]);
                }
                bulkContentCaching_Selector = args[i + 1];
            } else if(args[i] === '--bulk-content-caching-cut-size') {
                // --bulk-content-caching-cut-size <int>  default: 50
                let cutSize = parseInt(args[i + 1]);
                if(isNaN(cutSize) || cutSize < 0) {
                    throw new Error('Invalid value for --bulk-content-caching-cut-size parameter. Format: <int>. Passed: ' + args[i + 1]);
                }

                bulkContentCaching_CutSize = cutSize;
            } else if(args[i] === '--bulk-content-caching-limit') {
                // --bulk-content-caching-limit <int>  default: 300
                let limit = parseInt(args[i + 1]);
                if(isNaN(limit) || limit < 0) {
                    throw new Error('Invalid value for --bulk-content-caching-limit parameter. Format: <int>. Passed: ' + args[i + 1]);
                }

                bulkContentCaching_Limit = limit;
            } else if(args[i] === '--bulk-content-caching-insert-begin') {
                // --bulk-content-caching-insert-begin <beforecontent|aftercontent> default: aftercontent
                if(!['beforecontent', 'aftercontent'].includes(args[i + 1])) {
                    throw new Error('Invalid value for --bulk-content-caching-insert-begin parameter. Format: <beforecontent|aftercontent>. Passed: ' + args[i + 1]);
                }
                bulkContentCaching_InsertBegin = args[i + 1];
            } else if(i === args.length - 1) {
                if(!CommandManager.isValidURL(args[i])) {
                    throw new Error('Invalid URL passed: ' + args[i]);
                } else {
                    this.url = args[i];
                }
            }
        }
    
        if(this.url === null) {
            throw new Error('URL is not set.');
        }



        this.core.headless = manualProfileInput ? false : !headedMode;
        await this.core.createBrowserInstance();

        let page = await this.core.createNewPage(this.url);
        if(externalScript !== null) {
            await page.evaluate((externalScript) => {
                eval(externalScript);
            }, externalScript);
        }


        let spl = null;
        if(scrollPageLoad_Selector !== null) {
            spl = await this.scrollPageLoad(page, scrollPageLoad_Selector, scrollPageLoad_Direction, scrollPageLoad_Timeout);
        }

        let mpi_waitComplition = null;
        if(manualProfileInput) {
            mpi_waitComplition = await this.manualProfileInput(page);
        }

        let dcs = null;
        if(dynamicContainerSafe_Selector !== null) {
            dcs = await this.dynamicContainerSafe(page, dynamicContainerSafe_Selector, dynamicContainer_InsertBegin, dynamicContainer_Strict);
        }

        let bcc = null;
        if(bulkContentCaching_Selector !== null) {
            bcc = await this.bulkContentCaching(page, bulkContentCaching_Selector, bulkContentCaching_CutSize, bulkContentCaching_Limit, bulkContentCaching_InsertBegin);
        }

        if(spl !== null) await spl.waitComplition();
        if(mpi_waitComplition !== null) await mpi_waitComplition();
        if(dcs !== null) await dcs.stopServe();
        if(bcc !== null) await bcc.stopCaching();
        if(savePageOnComplete_Format !== null) await this.savePage(page, savePageOnComplete_Format, bcc);

        await this.core.closeBrowser();
    };


    async manualProfileInput(page) {
        let waitComplition = await this.core.manualProfileInput(page);
        return waitComplition;
    };

    async savePage(page, format, bcc) {
        if(format === 'mhtml') {

            if(bcc !== null) {
                if(await bcc.shouldDumpCacheFully()) {
                    await bcc.dumpCache();
                    await this.core.pageSaver.savePageAsMHTML(page, this.savePagePath);
                } else {
                    this.logger.log('Disabling internet connection to prevent cache parts from corrupt.');
                    let session = await Core.setPageOffline(page);

                    await this.core.pageSaver.savePagesAsMHTML_BCC(page, bcc, this.savePagePath, 'Part');
                    
                    this.logger.log('Enabling internet connection.');
                    await session.detach();
                }
            } else {
                await this.core.pageSaver.savePageAsMHTML(page, this.savePagePath);
            }

        } else {
            this.logger.log(`Couldn't save page in format ${format}. Handler not found.`);
        }
    };

    async scrollPageLoad(page, selector, direction, timeout) {
        let spl = await this.core.scrollPageLoad(page, selector, direction === 'bottom', timeout);
        await spl.enableScrollLoad();
        return spl;
    };

    async dynamicContainerSafe(page, selector, insertBegin, strict) {
        let dcs = await this.core.dynamicContainerSafe(page, selector, insertBegin, strict);
        await dcs.serveContainer();
        return dcs;
    };

    async bulkContentCaching(page, selector, cutSize, limit, insertBegin) {
        let bcc = await this.core.bulkContentCaching(page, selector, cutSize, limit, insertBegin);
        await bcc.startCaching();
        return bcc;
    };

};
const Logger = require('./Logger');
const fs = require('fs');

module.exports = class PageSaver {
    constructor() {
        this.logger = new Logger();
        this.logger.initLogger('PS', true, null, Logger.FgColor.MAGENTA);
    };

    async savePageAsMHTML(page, path, fileName = null) {
        let cdpSession = await page.target().createCDPSession();
        let { data } = await cdpSession.send('Page.captureSnapshot');

        if(fileName === null) {
            fileName = await page.title();
        }

        fs.writeFileSync(path + `${fileName}.mhtml`, data);
        await cdpSession.detach();

        this.logger.log(`Page saved at: ${path} in file '${fileName}.mhtml'.`);
    };

    async savePagesAsMHTML_BCC(page, bcc, path, fileNamePattern) {
        let cacheParts = await bcc.cachePartsSummary();
        
        for(let i = 0; i < cacheParts; i++) {
            await bcc.dumpCachePart(i);
            await this.savePageAsMHTML(page, path, `${fileNamePattern}_${i + 1}`);
        }
    };
};
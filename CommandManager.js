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

        let headedMode = false;

        if(args.length === 0 || args[0] === '-h' || args[0] === '--help') {
            CommandManager.printHelpMessage();
        }

        for(let i = 0; i < args.length; i++) {
            if(args[i] === '--manual-profile-input') {
                let url = 'https://google.com';
                if(args.length - 1 > i && CommandManager.isValidURL(args[i + 1])) {
                    url = args[i + 1];
                }
                await this.manualProfileInput(url);
            } else if(args[i] === '--headed') {
                headedMode = true;
            }
        }
    };

    async manualProfileInput(url) {
        this.core.headless = false;
        await this.core.createBrowserInstance();
        let page = await this.core.createNewPage(url);
        this.core.enablePageLog(page);
    };

};
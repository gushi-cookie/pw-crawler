module.exports = class Logger {

    static FontStyle = Object.freeze({
        RESET: '\x1b[0m',
        BRIGHT: '\x1b[1m',
        DIM: '\x1b[2m',
        UNDERSCORE: '\x1b[4m',
        BLINK: '\x1b[5m',
        REVERSE: '\x1b[7m',
        HIDDEN: '\x1b[8m',
    });
    static FgColor = Object.freeze({
        BLACK: '\x1b[30m',
        RED: '\x1b[31m',
        GREEN: '\x1b[32m',
        YELLOW: '\x1b[33m',
        BLUE: '\x1b[34m',
        MAGENTA: '\x1b[35m',
        CYAN: '\x1b[36m',
        WHITE: '\x1b[37m',
    });
    static BgColor = Object.freeze({
        BLACK: '\x1b[40m',
        RED: '\x1b[41m',
        GREEN: '\x1b[42m',
        YELLOW: '\x1b[43m',
        BLUE: '\x1b[44m',
        MAGENTA: '\x1b[45m',
        CYAN: '\x1b[46m',
        WHITE: '\x1b[47m',
    });


    initLogger(moduleAbbr, enabled, moduleId = null, messageColor = '\x1b[37m', topLine = '', bottomLine = '') {
        this.moduleAbbr = moduleAbbr;
        this.enabled = enabled;
        this.moduleId = moduleId;
        this.messageColor = messageColor;

        if(topLine.length > 0) {
            this.topLine = topLine + '\n';
        } else {
            this.topLine = '';
        }

        if(bottomLine.length > 0) {
            this.bottomLine = '\n' + bottomLine;
        } else {
            this.bottomLine = '';
        }


        let prefix = '[' + moduleAbbr;
        if(moduleId !== null) {
            prefix += `: ${moduleId}]`;
        } else {
            prefix += ']';
        }
        this.prefix = prefix;
    };


    log(message) {
        if(!this.enabled) return;
        console.log(`${this.topLine}${Logger.FontStyle.RESET}${this.messageColor}${this.prefix} ${message}${Logger.FontStyle.RESET}${this.bottomLine}`);
    };


    enablePageLog(page) {
        page.on('console', async (msg) => {
            let msgArgs = await msg.args();

            let message = '';
            for(let i = 0; i < msgArgs.length; i++) {
                if(i === 0) {
                    message = await msgArgs[i].jsonValue();
                } else {
                    message += '\n' + await msgArgs[i].jsonValue();
                }
            }

            console.log(`${this.topLine}${Logger.FontStyle.RESET}${this.messageColor}${this.prefix} ${message}${Logger.FontStyle.RESET}${this.bottomLine}`);
        });
    };
    
    enablePageErrorLog(page) {
        page.on('error', (error) => {
            console.log(`${this.topLine}${Logger.FontStyle.RESET}${this.messageColor}${this.prefix} ${error}${LOgger.FontStyle.RESET}${this.bottomLine}`);
        });
    };
};
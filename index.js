const Core = require('./Core');
const CommandManager = require('./CommandManager');

(async () => {
    const core = new Core();
    const commandManager = new CommandManager();
    await commandManager.init(core, process.argv.slice(2));
})();
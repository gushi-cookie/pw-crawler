const Core = require('./src/core/Core');
const CommandManager = require('./src/CommandManager');

(async () => {
    const core = new Core();
    const commandManager = new CommandManager();
    await commandManager.init(core, process.argv.slice(2));
})();
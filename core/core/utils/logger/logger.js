var log4js = require('log4js');
var log4jsConfig = require("../../config/log4jsConfig");
log4js.configure({
    appenders: [
        {type: 'console'}, {
            type: 'file',
            filename: log4jsConfig.FILENAME,
            maxLogSize: log4jsConfig.MAXLOGSIZE,
            backups: log4jsConfig.BACKUPS,
            //category: 'normal'
        }
    ],
    replaceConsole: log4jsConfig.SHOWCONSOLELOG
});
var logger = function (name) {
    var logger = log4js.getLogger(name);
    logger.setLevel(log4jsConfig.LOGLEVEL);
    return logger;
}
module.exports = logger;

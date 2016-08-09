/**
 * Created by developer on 2016/8/9.
 */
var schedule = require('node-schedule');
var moment = require('moment');
var mysqlPool = require("./core/utils/pool/mysql/mysqlPool");
var logger = require("./core/utils/logger/logger")(__filename);

var task = schedule.scheduleJob('30 0 * * *', function () {
    var currentTimestamp = moment().format("YYYYMMDDHHmmss");
    logger.info("[crontab task]" + currentTimestamp + ' - start to reset device state');
    mysqlPool.query("update XL_DEVICE set deviceState=0,doneDate=now() where state=1", [], function (err, upd) {
            if (err) {
                return logger.error("[crontab task]error:" + err);
            }
            logger.info("[crontab task]updated device records:" + upd.affectedRows);
        }
    )
    ;
});
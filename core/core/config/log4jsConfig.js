/**
 * Created by pz on 16/1/25.
 */
var log4jsConfig  = {
    FILENAME : 'app/logs/access.log',
    //WEBLOGNAME:'app/logs/webacess.log',
<<<<<<< HEAD
    LOGLEVEL : "debug",
=======
    LOGLEVEL : "info",
>>>>>>> remotes/origin/master
    MAXLOGSIZE : 1024 * 1024 * 100 ,
    BACKUPS : 4 ,
    SHOWCONSOLELOG :false
}
module.exports = log4jsConfig;

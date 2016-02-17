var mysqlUtil = require("../../../core/utils/pool/mysql/mysqlPool");
var SmsLog = module.exports;

SmsLog.saveSmsLog = function(args, callback){
    mysqlUtil.query("insert into XL_SMS_LOG(billId,securityCode,sendDate,sendFlag,result) values (?,?,?,?,?)", args, callback);
}

SmsLog.findOne = function(billId, securityCode, callback){
    mysqlUtil.queryOne("select * from XL_SMS_LOG where billId=? and securityCode=? and sendFlag=0", [billId, securityCode], callback);
}
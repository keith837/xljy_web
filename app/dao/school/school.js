var mysqlUtil = require("../../../core/utils/pool/mysql/mysqlPool");

var School = module.exports;

School.listByPrincipalId = function(principalId, callback){
    mysqlUtil.query("select * from XL_SCHOOL where sUserId = ? ", [principalId], callback);
}

School.findOne = function(userId, schoolId, callback){
    mysqlUtil.queryOne("select * from XL_SCHOOL where sUserId = ? and schoolId = ?", [userId, schoolId], callback);
}
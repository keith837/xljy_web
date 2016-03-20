var UserAttr = module.exports;
var mysqlUtil = require("../../../core/utils/pool/mysql/mysqlPool");

UserAttr.save = function(args, callback){
    var sql = "insert into XL_USER_ATTR(userId, attrType, attrCode, attrValue, doneCode, state, createDate, doneDate, oUserId) values ?";
    mysqlUtil.query(sql, [args], callback);
}

UserAttr.list = function(userId, obj, callback){
    var sql = "select * from XL_USER_ATTR where state = 1 and userId = ?";
    var tempArgs = new Array();
    tempArgs.push(userId);
    if(obj){
        for(var key in obj){
            sql += " and " + key + " = ? ";
            tempArgs.push(obj[key]);
        }
    }
    sql += " order by attrType, doneCode desc";
    mysqlUtil.query(sql, tempArgs ,callback);
}

UserAttr.delete = function(userId, attrType, doneCode, oUserId, callback){
    var sql = "update XL_USER_ATTR set state=0, doneDate=now(), oUserId=? where userId=? and attrType=? and doneCode=?";
    mysqlUtil.query(sql, [oUserId, userId, attrType, doneCode], callback);
}
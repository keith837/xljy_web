var User = module.exports;
var mysqlUtil = require("../../../core/utils/pool/mysql/mysqlPool");

User.findOne = function(groupId, userName, callback){
    mysqlUtil.queryOne("select * from XL_USER where groupId=? and userName=?", [groupId, userName], callback);
}

User.findOneByUserId = function(userId, callback){
    mysqlUtil.queryOne("select A.*,B.groupName from XL_USER A,XL_USER_GROUP B WHERE A.groupId = B.groupId A.userId=?", [userId], callback);
}

User.findOneByUserName = function(userName, callback){
    mysqlUtil.queryOne("select * from XL_USER where userName=?", [userName], callback);
}

User.active = function(userName, password, callback){
    mysqlUtil.query("update XL_USER set state = 1,doneDate = now(),password=? where userName = ?", [password, userName], callback);
}

User.modifyPwd = function(userName, password, callback){
    mysqlUtil.query("update XL_USER set doneDate = now(),password=? where userName = ?", [password, userName], callback);
}

User.list = function(groupId, start, pageSize, callback){
    var sql = "select A.*,B.groupName from XL_USER A,XL_USER_GROUP B WHERE A.groupId=B.groupId";
    var args = [start, pageSize];
    if(groupId && groupId > 0){
        sql += " and A.groupId=?";
        args = [groupId, start, pageSize];
    }
    sql += " limit ?,?";
    mysqlUtil.query(sql, args, callback);
}



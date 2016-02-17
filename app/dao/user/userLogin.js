var mysqlUtil = require("../../../core/utils/pool/mysql/mysqlPool");
var logger = require("../../../core/utils/logger/logger")(__filename);

var UserLogin = module.exports;

UserLogin.logLogin = function(args){
    mysqlUtil.getConnection(function(err, conn){
        if(err){
            callback.apply(null, [err, null]);
        }
        conn.beginTransaction(function(err){
            if(err){
                callback.apply(null, [err, null]);
            }
        });
        var userSql = "update XL_USER set lastLoginDate=now(),lastChannelId=?,lastLoginIp=? where userId=?";
        conn.query(userSql, [args[6], args[8], args[1]], function(err, data){
            if(err){
                logger.error("修改用户登录信息失败:", err);
            }
            var sql = "insert into XL_USER_LOGIN(groupId,userId,nickName,billId,custName,loginDate,logoutDate,channelId,";
            sql += "loginSystem,source,loginIp,macAddr,createDate,doneDate) values (?,?,?,?,?,now(),null,?,?,?,?,?,now(),now())";
            conn.query(sql, args, function(err, loginData){
                if(err){
                    logger.error("记录登录日志失败:", err);
                }
                conn.commit();
                conn.release();
            });
        });
    });
}
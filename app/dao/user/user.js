var User = module.exports;
var mysqlUtil = require("../../../core/utils/pool/mysql/mysqlPool");

User.findOne = function(groupId, userName, callback){
    mysqlUtil.queryOne("select * from XL_USER where groupId=? and userName=?", [groupId, userName], callback);
}

User.findOneByUserId = function(userId, callback){
    mysqlUtil.queryOne("select A.*,B.groupName from XL_USER A,XL_USER_GROUP B WHERE A.groupId = B.groupId and A.userId=?", [userId], callback);
}

User.findOneByUserName = function(userName, callback){
    mysqlUtil.queryOne("select * from XL_USER where userName=?", [userName], callback);
}

User.save = function(args, callback){
    var sql = "insert into XL_USER(groupId,roleId,nickName,userName,userUrl,password,custName,pointNum,billId,email,gender,"
    sql += "birthday,address,token,state,createDate,doneDate,channelId) values (?,?,?,?,null,?,?,0,?,?,?,?,?,null,0,now(),now(),?)";
    mysqlUtil.query(sql, args, callback);
}

User.delete = function(userId, callback){
    mysqlUtil.query("update XL_USER set state = 2 where userId=?", [userId], callback);
}

User.update = function(obj, userId, callback){
    var sql = "update XL_USER set ";
    var args = new Array();
    for(var key in obj){
        sql += key + "=?,";
        args.push(obj[key]);
    }
    sql = sql.substr(0, sql.length - 1);
    sql += " where userId=?";
    args.push(userId);
    mysqlUtil.query(sql, args, callback);
}

User.active = function(userName, password, callback){
    mysqlUtil.query("update XL_USER set state = 1,doneDate = now(),password=? where userName = ?", [password, userName], callback);
}

User.modifyPwd = function(userName, password, callback){
    mysqlUtil.query("update XL_USER set doneDate = now(),password=? where userName = ?", [password, userName], callback);
}

User.queryNum = function(obj, callback){
    var whereSql = " 1=1 ";
    var args = new Array();
    if(obj){
        for(var key in obj){
            whereSql += " and m." + key + "=?";
            args.push(obj[key]);
        }
    }
    var countSql = "select count(*) AS total from XL_USER m,XL_USER_GROUP B WHERE m.groupId=B.groupId and " + whereSql;
    mysqlUtil.queryOne(countSql, args, callback);
}

User.queryPage = function(obj, start, pageSize, callback){
    var whereSql = " 1=1 ";
    var args = new Array();
    if(obj){
        for(var key in obj){
            whereSql += " and m." + key + "=?";
            args.push(obj[key]);
        }
    }
    var querySql = "select m.*,B.groupName from XL_USER m,XL_USER_GROUP B WHERE m.groupId=B.groupId and " + whereSql;
    querySql += " limit ?,?";
    args.push(start);
    args.push(pageSize);
    mysqlUtil.query(querySql, args, callback);
}

User.listByPage = function(obj, start, pageSize, callback){
    User.queryNum(obj, function(err, data){
        if(err){
            return callback(err);
        }
        var total = 0;
        if(data){
            total = data.total;
        }
        User.queryPage(obj, start, pageSize, function(err, users){
            if(err){
                return callback(err);
            }
            return callback(err, total, users);
        });
    });
}



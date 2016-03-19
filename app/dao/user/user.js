var User = module.exports;
var mysqlUtil = require("../../../core/utils/pool/mysql/mysqlPool");

//登录时查询用户
User.findByUserName = function(userName, callback){
    mysqlUtil.queryOne("select * from XL_USER where state !=0 and userName=?", [userName], callback);
}

User.findByUserId = function(userId, callback){
    mysqlUtil.queryOne("select B.groupName,IFNULL(C.schoolName,'无学校') schoolName,m.* from XL_USER m inner join XL_USER_GROUP B on m.groupId=B.groupId left join XL_SCHOOL C on m.schoolId=C.schoolId where m.state != 0 and m.userId=?", [userId], callback);
}

User.save = function(args, callback){
    var sql = "insert into XL_USER(groupId,roleId,schoolId,nickName,userName,userUrl,password,custName,pointNum,billId,email,gender,"
    sql += "birthday,address,installationId,state,createDate,doneDate,channelId) values (?,?,?,?,?,?,?,?,0,?,?,?,?,?,null,2,now(),now(),?)";
    mysqlUtil.query(sql, args, callback);
}

User.delete = function(userId, callback){
    mysqlUtil.query("update XL_USER set state = 0 where userId=?", [userId], callback);
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

User.active = function(userName, password, yunAccout, callback){
    mysqlUtil.query("update XL_USER set state = 1,doneDate = now(),password=?,yunAccout=? where userName = ?", [password, yunAccout, userName], callback);
}

User.modifyPwd = function(userName, password, callback){
    mysqlUtil.query("update XL_USER set doneDate = now(),password=? where userName = ?", [password, userName], callback);
}

User.queryNum = function(obj, custNameOrBillId, schoolIds, callback){
    var whereSql = " 1=1 ";
    var args = new Array();
    if(obj){
        for(var key in obj){
            whereSql += " and m." + key + "=?";
            args.push(obj[key]);
        }
    }
    if(custNameOrBillId){
        whereSql += " and (m.custName like ? or m.userName = ?)";
        args.push("%" + custNameOrBillId + "%");
        args.push(custNameOrBillId);
    }
    if(schoolIds){
        whereSql += " and m.schoolId in (";
        for(var i = 0; i < schoolIds.length; i ++){
            whereSql += "?,";
            args.push(schoolIds[i]);
        }
        whereSql = whereSql.substr(0, whereSql.length - 1) + ")";
    }
    var countSql = "select count(*) AS total from XL_USER m inner join XL_USER_GROUP B on m.groupId=B.groupId left join XL_SCHOOL C on m.userId=C.sUserId where  m.state != 0 and " + whereSql;
    mysqlUtil.queryOne(countSql, args, callback);
}

User.queryPage = function(obj, custNameOrBillId, schoolIds, start, pageSize, callback){
    var whereSql = " 1=1 ";
    var args = new Array();
    if(obj){
        for(var key in obj){
            whereSql += " and m." + key + "=?";
            args.push(obj[key]);
        }
    }
    if(custNameOrBillId){
        whereSql += " and (m.custName like ? or m.userName = ?)";
        args.push("%" + custNameOrBillId + "%");
        args.push(custNameOrBillId);
    }
    if(schoolIds){
        whereSql += " and m.schoolId in (";
        for(var i = 0; i < schoolIds.length; i ++){
            whereSql += "?,";
            args.push(schoolIds[i]);
        }
        whereSql = whereSql.substr(0, whereSql.length - 1) + ")";
    }
    var querySql = "select B.groupName,IFNULL(C.schoolName,'无学校'),m.* from XL_USER m inner join XL_USER_GROUP B on m.groupId=B.groupId left join XL_SCHOOL C on m.schoolId=C.schoolId where m.state != 0 and " + whereSql;
    querySql += " limit ?,?";
    args.push(start);
    args.push(pageSize);
    mysqlUtil.query(querySql, args, callback);
}

User.listByUserIds = function(userObj, callback){
    var sql = "select * from XL_USER where 1=1 ";
    var tempArgs = new Array();
    if(userObj){
        sql += "and userId in (";
        for(var key in userObj){
            sql += "?,";
            tempArgs.push(userObj[key]);
        }
        sql = sql.substr(0, sql.length - 1);
        sql += ")";
    }
    mysqlUtil.query(sql, tempArgs, callback);
}

User.listByPage = function(obj, custNameOrBillId, schoolIds, start, pageSize, callback){
    User.queryNum(obj, custNameOrBillId, schoolIds, function(err, data){
        if(err){
            return callback(err);
        }
        var total = 0;
        if(data){
            total = data.total;
        }
        User.queryPage(obj, custNameOrBillId, schoolIds, start, pageSize, function(err, users){
            if(err){
                return callback(err);
            }
            return callback(err, total, users);
        });
    });
}



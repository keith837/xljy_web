var User = module.exports;
var mysqlUtil = require("../../../core/utils/pool/mysql/mysqlPool");

//登录时查询用户
User.findByUserName = function(userName, callback){
    mysqlUtil.queryOne("select * from XL_USER where state !=0 and userName=?", [userName], callback);
}

User.findByGroupIdAndNullSchoolId = function(groupId, callback){
    mysqlUtil.query("select * from XL_USER WHERE state!=0 and groupId=? and schoolId is null", [groupId], callback);
}

User.findByUserId = function(userId, callback){
    mysqlUtil.queryOne("select B.groupName,IFNULL(C.schoolName,'无学校') schoolName,m.* from XL_USER m inner join XL_USER_GROUP B on m.groupId=B.groupId left join XL_SCHOOL C on m.schoolId=C.schoolId where m.state != 0 and m.userId=?", [userId], callback);
}

User.findByTeacherId = function(userId, callback){
    var sql = "select C.classId,C.className,B.jobType,A.userId,A.nickName,A.userName,A.billId,A.lastLoginDate,A.lastLoginIp,A.state,A.custName,A.gender,A.birthday,A.address,A.nation,A.provName,A.cityName,A.region,A.gradSchool from XL_USER A, ";
    sql += "XL_CLASS_TEACHER_REL B, XL_CLASS C WHERE A.userId=B.tUserId AND A.state>=1 AND B.classId=C.classId and A.groupId=20 and userId=?";
    mysqlUtil.queryOne(sql, [userId], callback);
}

User.save = function(args, callback){
    var sql = "insert into XL_USER(groupId,roleId,schoolId,nickName,userName,userUrl,password,custName,pointNum,billId,email,gender,"
    sql += "birthday,address,installationId,nation,provName,cityName,region,gradSchool,state,createDate,doneDate,channelId,remark)"
    sql += " values (?,?,?,?,?,?,?,?,0,?,?,?,?,?,null,?,?,?,?,?,2,now(),now(),?,?)";
    mysqlUtil.query(sql, args, callback);
}

User.listGroupUser = function(callback){
    var sql = "select * from XL_USER A where state != 0 and groupId = 40 and not exists(select 1 from XL_SCHOOL_BRAND B where A.userId=B.bUserId and B.state=1)";
    mysqlUtil.query(sql, [], callback);
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
    mysqlUtil.query("update XL_USER set state = 1,doneDate = now(),password=?,yunAccout=? where userName = ? and state!=0", [password, yunAccout, userName], callback);
}

User.modifyPwd = function(userName, password, callback){
    mysqlUtil.query("update XL_USER set doneDate = now(),password=? where userName = ? and state!=0", [password, userName], callback);
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
    var countSql = "select count(*) AS total from XL_USER m inner join XL_USER_GROUP B on m.groupId=B.groupId left join XL_SCHOOL C on m.schoolId=C.schoolId where  m.state != 0 and " + whereSql;
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
    var querySql = "select B.groupName,IFNULL(C.schoolName,'无学校') schoolName,m.* from XL_USER m inner join XL_USER_GROUP B on m.groupId=B.groupId left join XL_SCHOOL C on m.schoolId=C.schoolId where m.state != 0 and " + whereSql;
    querySql += " order by m.createDate desc limit ?,?";
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



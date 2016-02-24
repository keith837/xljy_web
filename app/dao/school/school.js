var mysqlUtil = require("../../../core/utils/pool/mysql/mysqlPool");

var School = module.exports;

School.listByPrincipalId = function(principalId, callback){
    mysqlUtil.query("select * from XL_SCHOOL where sUserId = ? ", [principalId], callback);
}

School.findOne = function(userId, schoolId, callback){
    mysqlUtil.queryOne("select * from XL_SCHOOL where sUserId = ? and schoolId = ?", [userId, schoolId], callback);
}

School.findBySchoolId = function(schoolId, callback){
    mysqlUtil.queryOne("select * from XL_SCHOOL where schoolId = ?", [schoolId], callback);
}

School.delete = function(schoolId, callback){
    mysqlUtil.query("delete from XL_SCHOOL where schoolId = ?", [schoolId], callback);
}

School.queryNum = function(obj, callback){
    var whereSql = " 1=1 ";
    var args = new Array();
    if(obj){
        for(var key in obj){
            whereSql += " and m." + key + "=?";
            args.push(obj[key]);
        }
    }
    var countSql = "select count(*) AS total from XL_SCHOOL m where " + whereSql;
    mysqlUtil.queryOne(countSql, args, callback);
}

School.queryPage = function(obj, start, pageSize, callback){
    var whereSql = " 1=1 ";
    var args = new Array();
    if(obj){
        for(var key in obj){
            whereSql += " and m." + key + "=?";
            args.push(obj[key]);
        }
    }
    var querySql = "select m.* from XL_SCHOOL m where " + whereSql;
    querySql += " limit ?,?";
    args.push(start);
    args.push(pageSize);
    mysqlUtil.query(querySql, args, callback);
}

School.listByPage = function(obj, start, pageSize, callback){
    School.queryNum(obj, function(err, data){
        if(err){
            return callback(err);
        }
        var total = 0;
        if(data){
            total = data.total;
        }
        School.queryPage(obj, start, pageSize, function(err, users){
            if(err){
                return callback(err);
            }
            return callback(err, total, users);
        });
    });
}

School.update = function(obj, schoolId, callback){
    var sql = "update XL_SCHOOL set ";
    var args = new Array();
    for(var key in obj){
        sql += key + "=?,";
        args.push(obj[key]);
    }
    sql = sql.substr(0, sql.length - 1);
    sql += " where schoolId=?";
    args.push(schoolId);
    mysqlUtil.query(sql, args, callback);
}

School.del = function(schoolId, callback){
    mysqlUtil.query("delete from XL_SCHOOL where schoolId=?", [schoolId], callback);
}

School.save = function(args, callback){
    var sql = "insert into XL_SCHOOL(schoolName,sUserId,address,billId,schoolDesc,schoolUrl,h5Url,h5Title,state,";
    sql += "createDate,doneDate,oUserId) values (?,?,?,?,?,?,?,?,1,now(),now(),?)";
    mysqlUtil.query(sql, args, callback);
}
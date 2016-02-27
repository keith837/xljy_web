var Class = module.exports;
var mysqlUtil = require("../../../core/utils/pool/mysql/mysqlPool");

Class.listByTeacherId = function(teacherId, callback){
    mysqlUtil.query("select * from XL_CLASS where tUserId = ?", [teacherId], callback);
}

Class.listBySchoolId = function(schoolId, callback){
    mysqlUtil.query("select * from XL_CLASS where schoolId = ?", [schoolId], callback);
}

Class.findOne = function(classId, callback){
    mysqlUtil.queryOne("select * from XL_CLASS where classId = ?", [classId], callback);
}

Class.listAllByTeacherId = function(teacherId, callback){
    mysqlUtil.query("select B.* from XL_CLASS_TEACHER_REL A,XL_CLASS B where A.classId=B.classId and A.userId=?", [teacherId], callback);
}

Class.findByClassId = function(classId, callback){
    var sql = "select A.*,B.nickName,B.custName,C.schoolName from XL_CLASS A,XL_USER B, XL_SCHOOL C where "
    sql += "A.schoolId=C.schoolId AND A.tUserId=B.userId AND classId=?";
    mysqlUtil.queryOne(sql, [classId], callback);
}

Class.delete = function(classId, callback){
    mysqlUtil.query("delete from XL_CLASS where classId = ?", [classId], callback);
}

Class.queryNum = function(obj, callback){
    var whereSql = " 1=1 ";
    var args = new Array();
    if(obj){
        for(var key in obj){
            whereSql += " and m." + key + "=?";
            args.push(obj[key]);
        }
    }
    var countSql = "select count(*) as total from XL_CLASS A,XL_USER B, XL_SCHOOL C where A.schoolId=C.schoolId AND A.tUserId=B.userId AND " + whereSql;
    mysqlUtil.queryOne(countSql, args, callback);
}

Class.queryPage = function(obj, start, pageSize, callback){
    var whereSql = " 1=1 ";
    var args = new Array();
    if(obj){
        for(var key in obj){
            whereSql += " and A." + key + "=?";
            args.push(obj[key]);
        }
    }
    var querySql = "select A.*,B.nickName,B.custName,C.schoolName from XL_CLASS A,XL_USER B, XL_SCHOOL C where A.schoolId=C.schoolId AND A.tUserId=B.userId AND " + whereSql;
    querySql += " limit ?,?";
    args.push(start);
    args.push(pageSize);
    mysqlUtil.query(querySql, args, callback);
}

Class.listByPage = function(obj, start, pageSize, callback){
    Class.queryNum(obj, function(err, data){
        if(err){
            return callback(err);
        }
        var total = 0;
        if(data){
            total = data.total;
        }
        Class.queryPage(obj, start, pageSize, function(err, users){
            if(err){
                return callback(err);
            }
            return callback(err, total, users);
        });
    });
}

Class.update = function(obj, classId, callback){
    var sql = "update XL_CLASS set ";
    var args = new Array();
    for(var key in obj){
        sql += key + "=?,";
        args.push(obj[key]);
    }
    sql = sql.substr(0, sql.length - 1);
    sql += " where classId=?";
    args.push(classId);
    mysqlUtil.query(sql, args, callback);
}

Class.save = function(args, callback){
    var sql = "insert into XL_CLASS(schoolId,gradeId,tUserId,className,classDesc,classUrl,state,";
    sql += "createDate,doneDate,oUserId) values (?,?,?,?,?,?,1,now(),now(),?)";
    mysqlUtil.query(sql, args, callback);
}
var mysqlUtil = require("../../../core/utils/pool/mysql/mysqlPool");

var Attendance = module.exports;

Attendance.save = function(args, callback){
    var sql = "insert into XL_ATTENDANCE(schoolId,classId,attendanceDate,attendanceType,objId,attendanceFlag,attendanceTime,state,createDate,doneDate,remark)";
    sql += " values(?,?,?,?,?,?,?,1,now(),now(),?)";
    mysqlUtil.query(sql, args, callback);
}

Attendance.findByAttendanceId = function(attendanceId, callback){
    var sql = "select * from XL_ATTENDANCE where attendanceId=?";
    mysqlUtil.query(sql, [attendanceId], callback);
}

Attendance.findByObjId = function(attendanceType, objId, attendanceDate, callback){
    var sql = "select * from XL_ATTENDANCE where attendanceType=? and objId=? and attendanceDate=?";
    mysqlUtil.queryOne(sql, [attendanceType, objId, attendanceDate], callback);
}

Attendance.listByCond = function(obj, callback){
    var tempArgs = new Array();
    var sql = "select * from XL_ATTENDANCE where 1=1";
    if(obj){
        for(var key in obj){
            sql += " and " + key + "=?";
            tempArgs.push(obj[key]);
        }
    }
    mysqlUtil.query(sql, tempArgs, callback);
}



Attendance.countByObjId = function(attendanceType, objId, startDate, callback){
    var sql = "select count(*) as total from XL_ATTENDANCE where attendanceType=? and objId=? and attendanceDate>=? and state=1";
    mysqlUtil.queryOne(sql, [attendanceType, objId, startDate], callback);
}

Attendance.countBySchoolId = function(attendanceType, schoolId, attendanceDate, callback){
    var sql = "select count(*) as total from XL_ATTENDANCE where attendanceType=? and schoolId=? and attendanceDate=? and state=1";
    mysqlUtil.queryOne(sql, [attendanceType, schoolId, attendanceDate], callback);
}

Attendance.update = function(obj, attendanceId, callback){
    var tempArgs = new Array();
    var sql = "update XL_ATTENDANCE set doneDate=now()";
    if(obj){
        for(var key in obj){
            sql += "," + key + "=?";
            tempArgs.push(obj[key]);
        }
    }
    sql += " where attendanceId=?";
    tempArgs.push(attendanceId);
    mysqlUtil.query(sql, tempArgs, callback);
}

Attendance.listByPage = function(obj, schoolIds, start, pageSize, callback){
    Attendance.queryNum(obj, schoolIds, function(err, data){
        if(err){
            return callback(err);
        }
        var total = 0;
        if(data){
            total = data.total;
        }
        Attendance.queryPage(obj, schoolIds, start, pageSize, function(err, attendances){
            if(err){
                return callback(err);
            }
            return callback(err, total, attendances);
        });
    });
}

Attendance.queryPage = function(obj, schoolIds, start, pageSize, callback){
    var tempArgs = new Array();
    var sql = "select * from XL_ATTENDANCE where 1=1";
    if(obj){
        for(var key in obj){
            sql += " and " + key + "=?";
            tempArgs.push(obj[key]);
        }
    }
    if(schoolIds){
        sql += " and schoolId in (";
        for(var i = 0; i < schoolIds.length; i ++){
            sql += "?,";
            tempArgs.push(schoolIds[i]);
        }
        sql = sql.substr(0, sql.length - 1) + ")";
    }
    sql += " limit ?,?";
    tempArgs.push(start);
    tempArgs.push(pageSize);
    mysqlUtil.query(sql, tempArgs, callback);
}

Attendance.queryNum = function(obj, schoolIds, callback){
    var tempArgs = new Array();
    var sql = "select count(*) as total from XL_ATTENDANCE where 1=1";
    if(obj){
        for(var key in obj){
            sql += " and " + key + "=?";
            tempArgs.push(obj[key]);
        }
    }
    if(schoolIds){
        sql += " and schoolId in (";
        for(var i = 0; i < schoolIds.length; i ++){
            sql += "?,";
            tempArgs.push(schoolIds[i]);
        }
        sql = sql.substr(0, sql.length - 1) + ")";
    }
    mysqlUtil.queryOne(sql, tempArgs, callback);
}
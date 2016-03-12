var mysqlUtil = require("../../../core/utils/pool/mysql/mysqlPool");
var StudentLeave = module.exports;

StudentLeave.save = function (args, callback) {
    var sql = "insert into XL_STUDENT_LEAVE(schoolId,classId,aUserId,studentId,tUserId,startDate,endDate,applyDate,";
    sql += "reason,state,createDate,doneDate,oUserId,remark) values (?,?,?,?,?,?,?,now(),?,1,now(),now(),?,?)";
    mysqlUtil.query(sql, args, callback);
};

StudentLeave.list = function(obj, startDate, endDate, leaveDate, callback){
    var sql = "select  A.leaveId,A.schoolId,A.classId,A.aUserId,A.tUserId,B.studentName,A.startDate,A.endDate,";
    sql += "A.applyDate,A.reason,A.state from XL_STUDENT_LEAVE A, XL_STUDENT B where A.studentId=B.studentId";
    var tempArgs = new Array();
    if(obj){
        for(var key in obj){
            sql += " and A." + key + "=?";
            tempArgs.push(obj[key]);
        }
    }
    if(startDate){
        sql += " and A.applyDate >= ?";
        tempArgs.push(startDate);
    }
    if(endDate){
        sql += " and A.applyDate <= ?";
        tempArgs.push(endDate);
    }
    if(leaveDate){
        sql += " and (A.startDate <= ? and A.endDate >= ?) and A.state > 0";
        tempArgs.push(leaveDate);
        tempArgs.push(leaveDate);
    }
    mysqlUtil.query(sql, tempArgs, callback);
}

StudentLeave.findByLeaveId = function(leaveId, callback){
    var sql = "select  A.leaveId,A.schoolId,A.classId,A.aUserId,A.tUserId,A.studentId,B.studentName,A.startDate,A.endDate,";
    sql += "A.applyDate,A.reason,A.state from XL_STUDENT_LEAVE A, XL_STUDENT B where A.studentId=B.studentId and A.leaveId = ?";
    mysqlUtil.queryOne(sql, [leaveId], callback);
}

StudentLeave.cancel = function(aUserId, leaveId, callback){
    var sql = "update XL_STUDENT_LEAVE set state=0, doneDate=now(), aUserId=? where leaveId=? and state=1";
    mysqlUtil.query(sql, [aUserId, leaveId], callback);
}

StudentLeave.approve = function(tUserId, leaveId, callback){
    var sql = "update XL_STUDENT_LEAVE set state=2, doneDate=now(), tUserId=? where leaveId =? and state=1";
    mysqlUtil.query(sql, [tUserId, leaveId], callback);
}
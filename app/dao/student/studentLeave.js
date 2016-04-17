var mysqlUtil = require("../../../core/utils/pool/mysql/mysqlPool");
var StudentLeave = module.exports;


StudentLeave.queryByCondition = function (queryCondition, callback) {
    var sql = "select studentId from XL_STUDENT_LEAVE m where 1=1 ";
    var params = [];

    var sqlCondition = "";
    if (queryCondition || queryCondition.length > 0) {
        for (var i in queryCondition) {
            var opr = queryCondition[i].opr;
            if (opr == "like") {
                sqlCondition += "and " + queryCondition[i].key + " " + opr + " ? ";
                params.push("%" + queryCondition[i].val + "%");
            } else if (opr == "in") {
                var ids = queryCondition[i].val;
                var appenderId = "";
                for (var k in ids) {
                    appenderId += "?,";
                    params.push(ids[k]);
                }
                appenderId = appenderId.substr(0, appenderId.length - 1);
                sqlCondition += "and " + queryCondition[i].key + " " + opr + " (" + appenderId + ") ";
            } else {
                sqlCondition += "and " + queryCondition[i].key + " " + opr + " ? ";
                params.push(queryCondition[i].val);
            }
        }
    }
    sql = sql + sqlCondition;
    mysqlUtil.query(sql, params, callback);
}

StudentLeave.save = function (args, callback) {
    var sql = "insert into XL_STUDENT_LEAVE(schoolId,classId,aUserId,applyPeason,studentId,tUserId,startDate,endDate,leaveDays,applyDate,";
    sql += "reason,state,createDate,doneDate,oUserId,remark) values (?,?,?,?,?,?,?,?,?,now(),?,1,now(),now(),?,?)";
    mysqlUtil.query(sql, args, callback);
};

StudentLeave.listByClassId = function(classId, leaveDate, callback){
    var sql = "select * from XL_STUDENT_LEAVE where state!=0 and startDate <= ? and endDate >= ? and classId=?"
    mysqlUtil.query(sql, [leaveDate, leaveDate, classId], callback);
}

StudentLeave.list = function(obj, startDate, endDate, leaveDate, callback){
    var sql = "select  A.leaveId,A.schoolId,A.classId,A.aUserId,A.applyPeason,A.tUserId,A.studentId,B.studentName,A.startDate,A.endDate,A.leaveDays,";
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
        sql += " and (A.startDate <= ? and A.endDate >= ?) and A.state != 0";
        tempArgs.push(leaveDate);
        tempArgs.push(leaveDate);
    }
    sql += " order by A.applyDate desc";
    mysqlUtil.query(sql, tempArgs, callback);
}

StudentLeave.findByLeaveId = function(leaveId, callback){
    var sql = "select  A.leaveId,A.schoolId,A.classId,A.aUserId,A.applyPeason,A.tUserId,A.studentId,B.studentName,A.startDate,A.endDate,A.leaveDays,";
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

StudentLeave.countByStudentId = function(studentId, startDate, callback){
    var sql = "select sum(leaveDays) as total from XL_STUDENT_LEAVE where studentId=? and startDate>=? and state!=0";
    mysqlUtil.queryOne(sql, [studentId, startDate], callback);
}

StudentLeave.countBySchoolId = function(schoolId, leaveDate, callback){
    var sql = "select count(*) as total from XL_STUDENT_LEAVE where schoolId=? and startDate<=? and endDate>? and state!=0";
    mysqlUtil.queryOne(sql, [schoolId, leaveDate, leaveDate], callback);
}
StudentLeave.validLeave = function(studentId, startDate, endDate, callback){
    var sql = "select count(*) as total from XL_STUDENT_LEAVE where state != 0 and ((startDate<=? and endDate>?) or (startDate<? and endDate>=?)) and studentId=?";
    mysqlUtil.queryOne(sql, [startDate, startDate, endDate, endDate, studentId], callback);
}
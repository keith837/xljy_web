var mysqlUtil = require("../../../core/utils/pool/mysql/mysqlPool");
var StudentLeave = module.exports;

StudentLeave.save = function (args, callback) {
    var sql = "insert into XL_STUDENT_LEAVE(schoolId,classId,aUserId,studentId,tUserId,startDate,endDate,applyDate,";
    sql += "reason,state,createDate,doneDate,oUserId,remark) values (?,?,?,?,?,?,?,now(),?,1,now(),now(),?,?)";
    mysqlUtil.query(sql, args, callback);
};


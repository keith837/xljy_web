var Student = module.exports;
var mysqlUtil = require("../../../core/utils/pool/mysql/mysqlPool");

Student.listByUserId = function (userId, callback) {
    mysqlUtil.query("select A.* from XL_STUDENT A, XL_USER_STUDENT_REL B WHERE A.studentId=B.studentId and B.userId=?", [userId], callback);
}

Student.findOne = function (userId, studentId, callback) {
    mysqlUtil.queryOne("select A.* from XL_STUDENT A, XL_USER_STUDENT_REL B WHERE A.studentId=B.studentId and B.userId=? and A.studentId=?", [userId, studentId], callback);
}
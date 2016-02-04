var Student = module.exports;
var mysqlUtil = require("../../../core/utils/pool/mysql/mysqlPool")

Student.listByUserId = function (userId, callback) {
    mysqlUtil.query("select A.* from XL_STUDENT A, XL_USER_STUDENT_REL B WHERE A.studentId=B.studentId and B.userId=?", [userId], callback);
}

Student.findOne = function (userId, studentId, callback) {
    mysqlUtil.query("select A.* from XL_STUDENT A, XL_USER_STUDENT_REL B WHERE A.studentId=B.studentId and B.userId=? and A.studentId=?", [userId, studentId], function (err, data) {
        if (err) {
            return callback.apply(null, [err, data]);
        }
        if (!data || data.length == 0) {
            return callback.apply(null, [err, null]);
        }
        if (data.length > 1) {
            return callback.apply(null, [new Error("学生数据错误"), null]);
        }
        callback.apply(null, [err, data[0]]);
    });
}
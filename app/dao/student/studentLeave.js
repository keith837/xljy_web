var mysqlUtil = require("../../../core/utils/pool/mysql/mysqlPool")
var StudentLeave = module.exports;

StudentLeave.save = function (args, callback) {
    mysqlUtil.query("insert into XL_STUDENT_LEAVE");
};
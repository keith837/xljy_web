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
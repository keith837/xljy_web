var importUtils = module.exports;
/**
 * Created by developer on 2016/4/24.
 */
var logger = require("../logger/logger")(__filename);
var db = require("../pool/mysql/mysqlPool");
var imCore = require("../alim/imCore.js");

importUtils.regUserYunAccount = function (batchId) {
    logger.info("执行方法regUserYunAccount.");

    var sql = "select b.userId,c.studentId,a.batchId,b.nickName,c.studentName ";
    sql += "from XL_BATCH_STUDENT_TMP a,XL_USER b,XL_STUDENT c,XL_SCHOOL d,XL_CLASS e ";
    sql += "where a.state=0 and a.batchId=? ";
    sql += "and c.state=1 and d.state=1 and e.state=1 and b.state=1 ";
    sql += "and a.billId=b.userName and a.schoolName=d.schoolName ";
    sql += "and a.className=e.className and d.schoolId=e.schoolId ";
    sql += "and d.schoolId=c.schoolId and a.studentName=c.studentName ";
    sql += "and c.schoolId=e.schoolId and c.classId=e.classId";

    db.query(sql, batchId, function (err, data) {
        if (err) {
            logger.error("查询数据库出错:" + err);
            return;
        }
        if (data && data.length > 0) {
            var userInfoArray = new Array();
            for (var i = 0; i < data.length; i++) {
                var student = data[i];
                var yunUser = "yunuser_" + student.userId + "_" + student.studentId;
                var yunName = student.studentName + student.nickName;
                var yunPassword = imCore.getPasswordHash(yunUser);
                userInfoArray.push({
                    userid: yunUser,
                    password: yunPassword,
                    nick: yunName
                });
            }

            logger.info("开始注册云账号:" + JSON.stringify(userInfoArray));
            imCore.regUsers(userInfoArray, function (err, yunRes) {
                if (err) {
                    logger.error("注册云账号出错:" + err);
                    return;
                }
                logger.info("云帐号返回结果:" + JSON.stringify(yunRes));
            });
        }
    });

}
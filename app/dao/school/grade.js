var mysqlUtil = require("../../../core/utils/pool/mysql/mysqlPool");

var Grade = module.exports;

/**
 * 查询年级数量
 * @param obj 查询条件
 * @param callback
 */
Grade.queryNum = function (obj, callback) {
    var whereSql = " A.state=1 ";
    var args = new Array();
    if (obj) {
        for (var key in obj) {
            whereSql += " and A." + key + "=?";
            args.push(obj[key]);
        }
    }
    var countSql = "select count(*) as total from XL_GRADE A, XL_SCHOOL B where A.schoolId=B.schoolId and " + whereSql;
    mysqlUtil.queryOne(countSql, args, callback);
}

/**
 * 分页查询年级信息
 * @param obj 查询条件
 * @param start 起始条数
 * @param pageSize 每页条数
 * @param callback
 */
Grade.queryPage = function (obj, start, pageSize, callback) {
    var whereSql = " A.state=1 ";
    var args = new Array();
    if (obj) {
        for (var key in obj) {
            whereSql += " and A." + key + "=?";
            args.push(obj[key]);
        }
    }
    var querySql = "select A.*,B.schoolName from XL_GRADE A, XL_SCHOOL B where A.schoolId=B.schoolId and " + whereSql;
    querySql += " limit ?,?";
    args.push(start);
    args.push(pageSize);
    mysqlUtil.query(querySql, args, callback);
}

Grade.listByPage = function (obj, start, pageSize, callback) {
    Grade.queryNum(obj, function (err, data) {
        if (err) {
            return callback(err);
        }
        var total = 0;
        if (data) {
            total = data.total;
        }
        Grade.queryPage(obj, start, pageSize, function (err, users) {
            if (err) {
                return callback(err);
            }
            return callback(err, total, users);
        });
    });
}

Grade.queryDetail = function (id, callback) {
    var sql = "select A.*,B.schoolName from XL_GRADE A, XL_SCHOOL B where A.schoolId=B.schoolId and A.gradeId=? and A.state=1";
    mysqlUtil.query(sql, [id], callback);
}


Grade.update = function (grade, callback) {
    mysqlUtil.queryOne("select count(*) as total from XL_GRADE where gradeId=? and state=1", [grade.gradeId], function (err, res) {
        if (err) {
            return callback(err);
        } else if (res.total !== 1) {
            return callback(new Error("无法查询到年级信息[" + grade.gradeId + "]."));
        }

        var sql = "update XL_GRADE set gradeName=?,sComeDate=?,sLeaveDate=?,tComeDate=?,tLeaveDate=?,doneDate=now(),oUserId=? where gradeId=? and state=1";
        var params = [];
        params.push(grade.gradeName);
        params.push(grade.sComeDate);
        params.push(grade.sLeaveDate);
        params.push(grade.tComeDate);
        params.push(grade.tLeaveDate);
        params.push(grade.oUserId);
        params.push(grade.gradeId);
        mysqlUtil.query(sql, params, callback);
    });
}

Grade.del = function (id, userId, callback) {
    mysqlUtil.query("update XL_GRADE set state=0,doneDate=now(),oUserId=? where gradeId=? ", [userId, id], callback);
}

Grade.listClassByGradeId = function(gradeId, callback){
    mysqlUtil.query("select * from XL_CLASS where state=1 and gradeId=?", [gradeId], callback);
}


Grade.add = function (grade, callback) {
    mysqlUtil.queryOne("select count(*) as total from XL_GRADE where gradeName=? and schoolId=? and state=1", [grade.gradeName, grade.schoolId], function (err, res) {
        if (err) {
            return callback(err);
        } else if (res.total >= 1) {
            return callback(new Error("年级[" + grade.gradeName + "]已存在，无法新建."));
        }

        var sql = "insert into XL_GRADE(schoolId,gradeName,sComeDate,sLeaveDate,tComeDate,tLeaveDate,state,createDate,doneDate,oUserId) values(?,?,?,?,?,?,1,now(),now(),?)";
        var params = [];
        params.push(grade.schoolId);
        params.push(grade.gradeName);
        params.push(grade.sComeDate);
        params.push(grade.sLeaveDate);
        params.push(grade.tComeDate);
        params.push(grade.tLeaveDate);
        params.push(grade.oUserId);
        mysqlUtil.query(sql, params, callback);
    });
}



/**
 * Created by Jerry on 3/27/2016.
 */
var Weight = module.exports;
var mysqlUtil = require("../../../core/utils/pool/mysql/mysqlPool");

Weight.queryNum = function (obj, schoolIds, callback) {
    var whereSql = "and A.state=1 ";
    var args = new Array();
    if (obj) {
        for (var key in obj) {
            var keyValue = obj[key];
            whereSql += " and A." + key;
            if (typeof keyValue == 'string') {
                if (keyValue.indexOf("%") >= 0) {
                    whereSql += " like ? ";
                    args.push(obj[key]);
                    continue;
                }
            }
            whereSql += " = ? ";
            args.push(obj[key]);
        }
    }
    if (schoolIds) {
        whereSql += " and A.schoolId in (";
        for (var i = 0; i < schoolIds.length; i++) {
            whereSql += "?,";
            args.push(schoolIds[i]);
        }
        whereSql = whereSql.substr(0, whereSql.length - 1) + ")";
    }
    var countSql = "select count(*) AS total from XL_STUDENT A,XL_STUDENT_WEIGHT B ";
    countSql += "WHERE B.state=1 and A.studentId=B.studentId " + whereSql;
    mysqlUtil.queryOne(countSql, args, callback);
}

Weight.queryPage = function (obj, schoolIds, start, pageSize, callback) {
    var whereSql = " 1=1 ";
    var args = new Array();
    if (obj) {
        for (var key in obj) {
            var keyValue = obj[key];
            whereSql += " and A." + key;
            if (typeof keyValue == 'string') {
                if (keyValue.indexOf("%") >= 0) {
                    whereSql += " like ? ";
                    args.push(obj[key]);
                    continue;
                }
            }
            whereSql += " = ? ";
            args.push(obj[key]);
        }
    }
    if (schoolIds) {
        whereSql += " and A.schoolId in (";
        for (var i = 0; i < schoolIds.length; i++) {
            whereSql += "?,";
            args.push(schoolIds[i]);
        }
        whereSql = whereSql.substr(0, whereSql.length - 1) + ")";
    }
    var querySql = "select W.*,A.studentName,A.studentAge,A.gender,B.className,C.schoolName from XL_STUDENT A, XL_CLASS B, XL_SCHOOL C,XL_STUDENT_WEIGHT W ";
    querySql += "WHERE A.studentId=W.studentId and W.state=1 and A.schoolId=C.schoolId and B.classId=A.classId and A.state=1 and " + whereSql;
    querySql += " limit ?,?";
    args.push(start);
    args.push(pageSize);
    mysqlUtil.query(querySql, args, callback);
}


Weight.listByPage = function (obj, schoolIds, start, pageSize, callback) {
    Weight.queryNum(obj, schoolIds, function (err, data) {
        if (err) {
            return callback(err);
        }
        var total = 0;
        if (data) {
            total = data.total;
        }
        if (total == 0) {
            return callback(null, 0, []);
        }
        Weight.queryPage(obj, schoolIds, start, pageSize, function (err, records) {
            if (err) {
                return callback(err);
            }
            return callback(err, total, records);
        });
    });
}


Weight.queryDetail = function (id, callback) {
    var sql = "select W.*,A.schoolId,A.classId,A.studentId,A.studentName,A.studentAge,A.gender,B.className,C.schoolName from XL_STUDENT A, XL_CLASS B, XL_SCHOOL C,XL_STUDENT_WEIGHT W ";
    sql += "WHERE A.studentId=W.studentId and W.state=1 and W.recordId=? and A.schoolId=C.schoolId and B.classId=A.classId and A.state=1";
    mysqlUtil.query(sql, [id], callback);
}


Weight.del = function (id, userId, callback) {
    mysqlUtil.query("update XL_STUDENT_WEIGHT set state=0,doneDate=now(),oUserId=? where recordId=? ", [userId, id], callback);
}


Weight.add = function (record, callback) {
    mysqlUtil.queryOne("select count(*) as total from XL_STUDENT where studentId=? and state=1", [record.studentId], function (err, res) {
        if (err) {
            return callback(err);
        } else if (res.total !== 1) {
            return callback(new Error("无法查询到学生信息[" + record.studentId + "]."));
        }
        var params = [];
        params.push(record.studentId);
        params.push(record.recordDate);
        params.push(record.weight);
        params.push(record.height);
        params.push(record.oUserId);
        mysqlUtil.query("insert into XL_STUDENT_WEIGHT(studentId,recordDate,weight,height,state,createDate,doneDate,oUserId) values(?,?,?,?,1,now(),now(),?)", params, function (err, res) {
            if (err) {
                return callback(err);
            }
            callback(err, res.insertId);
        });
    });
}


Weight.update = function (record, callback) {
    mysqlUtil.queryOne("select count(*) as count from XL_STUDENT where studentId=? and state=1", [record.studentId], function (err, res) {
        if (err) {
            return callback(err);
        } else if (res.count !== 1) {
            return callback(new Error("无法查询到学生信息[" + record.studentId + "]."));
        }

        var sql = "update XL_STUDENT_WEIGHT set recordDate=?,weight=?,height=?,doneDate=now(),oUserId=? where recordId=? and state=1 and studentId=?";
        var params = [];
        params.push(record.recordDate);
        params.push(record.weight);
        params.push(record.height);
        params.push(record.oUserId);
        params.push(record.recordId);
        params.push(record.studentId);
        mysqlUtil.query(sql, params, callback);
    });
}
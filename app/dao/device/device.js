var Device = module.exports;
var mysqlUtil = require("../../../core/utils/pool/mysql/mysqlPool")

Device.queryAllNum = function (condition, params, callback) {
    var sql = "select count(*) AS total from (select c.schoolId,c.schoolName,b.classId,b.className,a.studentName,m.* from XL_DEVICE m, XL_STUDENT a, XL_CLASS b, XL_SCHOOL c where m.studentId = a.studentId and a.classId = b.classId and a.schoolId = c.schoolId and m.state=1) m where " + condition;
    mysqlUtil.queryOne(sql, params, function (err, res) {
        if (err) {
            return callback(err);
        }
        callback(err, res.total);
    });
}

Device.queryPage = function (start, pageSize, queryCondition, callback) {
    var sqlCondition = "1=1 ";
    var sqlParams = [];

    if (queryCondition || queryCondition.length > 0) {
        for (var i in queryCondition) {
            var opr = queryCondition[i].opr;
            if (opr == "like") {
                sqlCondition += "and m." + queryCondition[i].key + " " + opr + " ? ";
                sqlParams.push("%" + queryCondition[i].val + "%");
            } else if (opr == "in") {
                var ids = queryCondition[i].val;
                var appenderId = "";
                for (var k in ids) {
                    appenderId += "?,";
                    sqlParams.push(ids[k]);
                }
                appenderId = appenderId.substr(0, appenderId.length - 1);
                sqlCondition += "and m." + queryCondition[i].key + " " + opr + " (" + appenderId + ") ";
            } else {
                sqlCondition += "and m." + queryCondition[i].key + " " + opr + " ? ";
                sqlParams.push(queryCondition[i].val);
            }
        }
    }

    Device.queryAllNum(sqlCondition, sqlParams, function (err, totalCount) {
        if (err) {
            return callback(err, null);
        }
        if (totalCount === 0) {
            return callback(err, 0, []);
        }

        sqlCondition += "limit ?,?";
        sqlParams.push(start);
        sqlParams.push(pageSize);

        var sql = "select * from (select c.schoolId,c.schoolName,b.classId,b.className,a.studentName,m.* from XL_DEVICE m, XL_STUDENT a, XL_CLASS b, XL_SCHOOL c where m.studentId = a.studentId and a.classId = b.classId and a.schoolId = c.schoolId and m.state=1) m where " + sqlCondition;
        mysqlUtil.query(sql, sqlParams, function (err, res) {
            callback(err, totalCount, res);
        });
    });
}

Device.add = function (device, callback) {
    mysqlUtil.queryOne("select count(*) as total from XL_STUDENT where studentId=? and state=1", [device.studentId], function (err, res) {
        if (err) {
            return callback(err);
        } else if (res.total !== 1) {
            return callback(new Error("无法查询到学生信息[" + device.studentId + "]."));
        }
        var params = [];
        params.push(device.deviceSign);
        params.push(device.deviceName);
        params.push(device.studentId);
        params.push(device.oUserId);
        mysqlUtil.query("insert into XL_DEVICE(deviceSign,deviceName,studentId,state,createDate,doneDate,oUserId) values(?,?,?,1,now(),now(),?)", params, function (err, res) {
            if (err) {
                return callback(err);
            }
            callback(err, res.insertId);
        });
    });
}

Device.del = function (id, callback) {
    mysqlUtil.query("update XL_DEVICE set state=0 where deviceId=? ", [id], callback);
}

Device.update = function (device, callback) {
    mysqlUtil.queryOne("select count(*) as count from XL_STUDENT where studentId=? and state=1", [device.studentId], function (err, res) {
        if (err) {
            return callback(err);
        } else if (res.count !== 1) {
            return callback(new Error("无法查询到学生信息[" + device.studentId + "]."));
        }

        var sql = "update XL_DEVICE set deviceSign=?,deviceName=?,studentId=?,doneDate=now(),oUserId=? where deviceId=?";
        var params = [];
        params.push(device.deviceSign);
        params.push(device.deviceName);
        params.push(device.studentId);
        params.push(device.oUserId);
        params.push(device.deviceId);
        mysqlUtil.query(sql, params, callback);
    });
}

Device.findByStudentId = function(studentId, callback){
    var sql = "select deviceId, deviceSign, deviceName from XL_DEVICE where studentId=?";
    mysqlUtil.queryOne(sql, [studentId], callback);
}

Device.queryDetail = function (id, callback) {
    var sql = "select c.schoolId,c.schoolName,b.classId,b.className,a.studentName,m.* from XL_DEVICE m, XL_STUDENT a, XL_CLASS b, XL_SCHOOL c where m.studentId = a.studentId and a.classId = b.classId and a.schoolId = c.schoolId and m.deviceId=?";
    mysqlUtil.query(sql, [id], callback);
}
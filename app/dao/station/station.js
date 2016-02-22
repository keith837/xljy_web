var Station = module.exports;
var mysqlUtil = require("../../../core/utils/pool/mysql/mysqlPool")

Station.queryAllNum = function (condition, params, callback) {
    var sql = "select count(*) as total from XL_STATION m where " + condition;
    mysqlUtil.queryOne(sql, params, function (err, res) {
        if (err) {
            return callback(err);
        }
        callback(err, res.total);
    });
}

Station.queryPage = function (start, pageSize, queryCondition, callback) {
    var sqlCondition = "1=1 ";
    var sqlParams = [];

    if (queryCondition) {
        for (var key in queryCondition) {
            sqlCondition += "and m." + key + "=? ";
            sqlParams.push(queryCondition[key]);
        }
    }

    Station.queryAllNum(sqlCondition, sqlParams, function (err, totalCount) {
        if (err) {
            return callback(err, null);
        }
        if (totalCount === 0) {
            return callback(err, 0, []);
        }

        sqlCondition += "limit ?,?";
        sqlParams.push(start);
        sqlParams.push(pageSize);

        var sql = "select ifnull(n.schoolName,'未知') as schoolName,m.* FROM XL_STATION m left join XL_SCHOOL n ON m.schoolId=n.schoolId where " + sqlCondition;
        mysqlUtil.query(sql, sqlParams, function (err, res) {
            callback(err, totalCount, res);
        });
    });
}

Station.add = function (station, callback) {
    mysqlUtil.queryOne("select count(*) as count from XL_SCHOOL where schoolId=?", [station.schoolId], function (err, res) {
        if (err) {
            return callback(err);
        } else if (res.count !== 1) {
            return callback(new Error("无法查询到学校信息[" + station.schoolId + "]."));
        }

        var sql = "insert into XL_STATION(stationMac,schoolId,address,stationType,state,createDate,doneDate,oUserId) values(?,?,?,?,?,now(),now(),?)";
        var params = [];
        params.push(station.stationMac);
        params.push(station.schoolId);
        params.push(station.location);
        params.push(station.type);
        params.push(station.state);
        params.push(station.oUserId);
        mysqlUtil.query(sql, params, function (err, res) {
            if (err) {
                return callback(err);
            }
            callback(err, res.insertId);
        });
    });
}

Station.del = function (id, callback) {
    mysqlUtil.query("update XL_STATION set state=0 where stationId=? ", [id], callback);
}

Station.queryDetail = function (id, callback) {
    var sql = "select ifnull(n.schoolName,'未知') as schoolName,m.* FROM XL_STATION m left join XL_SCHOOL n ON m.schoolId=n.schoolId where m.stationId=?";
    mysqlUtil.query(sql, [id], callback);
}

Station.update = function (station, callback) {
    mysqlUtil.queryOne("select count(*) as count from XL_SCHOOL where schoolId=?", [station.schoolId], function (err, res) {
        if (err) {
            return callback(err);
        } else if (res.count !== 1) {
            return callback(new Error("无法查询到学校信息[" + station.schoolId + "]."));
        }

        var sql = "update XL_STATION set stationMac=?,schoolId=?,address=?,stationType=?,state=?,doneDate=now(),oUserId=? where stationId=?";
        var params = [];
        params.push(station.stationMac);
        params.push(station.schoolId);
        params.push(station.location);
        params.push(station.type);
        params.push(station.state);
        params.push(station.oUserId);
        params.push(station.stationId);
        mysqlUtil.query(sql, params, callback);
    });
}
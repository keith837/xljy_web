var Station = module.exports;
var mysqlUtil = require("../../../core/utils/pool/mysql/mysqlPool")

Station.queryAllNum = function (condition, params, callback) {
    var sql = "select count(*) as total from XL_STATION m where m.state=1 and " + condition;
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

        var sql = "select ifnull(n.schoolName,'未知') as schoolName,m.*,case when m.activeDate is null then '离线' when date_add(m.activeDate, interval 7 minute) > now() then '在线' else '离线' end as activeState ";
        sql += "FROM XL_STATION m left join XL_SCHOOL n ON m.schoolId=n.schoolId where m.state=1 and " + sqlCondition;
        mysqlUtil.query(sql, sqlParams, function (err, res) {
            callback(err, totalCount, res);
        });
    });
}

Station.add = function (station, callback) {
    mysqlUtil.queryOne("select count(*) as count from XL_SCHOOL where schoolId=? and state=1", [station.schoolId], function (err, res) {
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

Station.queryDetailByMac = function (mac, callback) {
    var sql = "select m.* FROM XL_STATION m where m.stationMac = ?";
    mysqlUtil.query(sql, [mac], callback);
}

Station.updateActive = function (mac, temperature, battery, districtNum, callback) {
    var sql = "update XL_STATION set temperature=?,battery=?,districtNum=?,activeDate=now() where stationMac=?";
    mysqlUtil.query(sql, [temperature, battery, districtNum, mac], callback);
}

Station.queryDetail = function (id, callback) {
    var sql = "select ifnull(n.schoolName,'未知') as schoolName,m.* FROM XL_STATION m left join XL_SCHOOL n ON m.schoolId=n.schoolId where m.stationId=?";
    mysqlUtil.query(sql, [id], callback);
}

Station.update = function (station, callback) {
    mysqlUtil.queryOne("select count(*) as count from XL_SCHOOL where schoolId=? and state=1", [station.schoolId], function (err, res) {
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

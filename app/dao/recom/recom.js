var Recom = module.exports;
var mysqlUtil = require("../../../core/utils/pool/mysql/mysqlPool")

Recom.queryAllNum = function (condition, params, callback) {
    var sql = "select count(*) AS total from XL_CONSULT m where " + condition;
    mysqlUtil.queryOne(sql, params, function (err, res) {
        if (err) {
            return callback(err);
        }
        callback(err, res.total);
    });
}

Recom.querySchool = function (start, pageSize, schoolId, callback) {
    var sqlCondition = " 1=1 ";
    var sqlParams = [];
    if (schoolId && schoolId > 0) {
        sqlCondition += " and schoolId = ? ";
        sqlParams.push(schoolId);
    }

    Recom.queryAllNum(sqlCondition, sqlParams, function (err, totalCount) {
        if (err) {
            return callback(err, null);
        }
        if (totalCount === 0) {
            return callback(err, 0, []);
        }

        sqlCondition += " order by consultId desc,isMain desc limit ?,?";
        sqlParams.push(start);
        sqlParams.push(pageSize);

        var sql = "select m.*,n.schoolName from (select * from XL_CONSULT m where " + sqlCondition;
        sql += ") m left join XL_SCHOOL n on m.schoolId=n.schoolId";
        mysqlUtil.query(sql, sqlParams, function (err, res) {
            callback(err, totalCount, res);
        });
    });
}

Recom.queryPage = function (start, pageSize, consultId,consultDate,consultTitle, consultType, callback) {
    var sqlCondition = " 1=1 ";
    var sqlParams = [];
    if (consultId && consultId > 0) {
        sqlCondition += " and consultId < ? ";
        sqlParams.push(consultId);
    }
    if(consultDate){
        sqlCondition += " and consultDate = ? ";
        sqlParams.push(consultDate);
    }
    if(consultTitle){
        sqlCondition += "  and consultTitle like ? "
        sqlParams.push("%"+consultTitle+"%");
    }
    if(consultType){
        sqlCondition += "  and consultType = ? "
        sqlParams.push(consultType);
    }

    Recom.queryAllNum(sqlCondition, sqlParams, function (err, totalCount) {
        if (err) {
            return callback(err, null);
        }
        if (totalCount === 0) {
            return callback(err, 0, []);
        }

        sqlCondition += " order by consultId desc,isMain desc limit ?,?";
        sqlParams.push(start);
        sqlParams.push(pageSize);

        var sql = "select * from XL_CONSULT m where " + sqlCondition;
        mysqlUtil.query(sql, sqlParams, function (err, res) {
            callback(err, totalCount, res);
        });
    });
}

Recom.add = function (recom, callback) {
    var params = [];
    params.push(recom.schoolId);
    params.push(recom.consultTitle);
    params.push(recom.consultUrl);
    params.push(recom.consultLink);
    params.push(recom.content);
    params.push(recom.consultType);
    params.push(recom.isMain);
    params.push(recom.userId);
    var sysDate = new Date();
    var doneCode = sysDate.getTime();
    params.push(doneCode);
    mysqlUtil.query("insert into XL_CONSULT(schoolId,consultTitle,consultUrl,consultDate,consultLink,content,consultType,isMain,createDate,doneDate,userId,doneCode) values(?,?,?,now(),?,?,?,?,now(),now(),?,?)", params, function (err, res) {
        if (err) {
            return callback(err);
        }
        callback(err, res.insertId);
    });
}

Recom.batchAdd = function (recoms, callback) {
    var params = new Array()
    var sysDate = new Date();
    var doneCode = sysDate.getTime();
    var insertSql = "insert into XL_CONSULT(schoolId,consultTitle,consultUrl,consultDate,consultLink,content,consultType,isMain,createDate,doneDate,userId,doneCode) values ?";
    for (var i in recoms) {
        params.push([null, recoms[i][0], recoms[i][1], sysDate, recoms[i][2], recoms[i][3], recoms[i][4], recoms[i][5], sysDate, sysDate, recoms[i][6], doneCode]);
    }

    mysqlUtil.query(insertSql, [params], function (err, res) {
        if (err) {
            return callback(err);
        }
        callback(err, res.insertId);
    });
}

Recom.del = function (consultId, callback) {
    mysqlUtil.query("delete from XL_CONSULT where consultId=? ", [consultId], callback);
}

Recom.show = function (consultId, callback) {
    var sql = "select * from XL_CONSULT m where consultId=? " ;
    mysqlUtil.query(sql, consultId, function (err, res) {
        callback(err, res);
    });
}

Recom.update = function (recom, callback) {
    var sql = "update XL_CONSULT set consultTitle=?,consultUrl=?,consultLink=?,content=?,doneDate = now() where consultId=?";
    var params = [];
    params.push(recom.consultTitle);
    params.push(recom.consultUrl);
    params.push(recom.consultLink);
    params.push(recom.content);
    params.push(recom.consultId);
    mysqlUtil.query(sql, params, callback);
}

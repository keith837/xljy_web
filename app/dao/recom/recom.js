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

Recom.queryPage = function (start, pageSize,consultDate,consultTitle, consultType, callback) {
    var sqlCondition = " 1=1 ";
    var sqlParams = [];
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

        sqlCondition += "limit ?,?";
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
    params.push(recom.consultTitle);
    params.push(recom.consultUrl);
    params.push(recom.consultLink);
    params.push(recom.content);
    params.push(recom.consultType);
    params.push(recom.isMain);
    params.push(recom.userId);
    mysqlUtil.query("insert into XL_CONSULT(schoolId,consultTitle,consultUrl,consultDate,consultLink,content,consultType,isMain,createDate,doneDate,userId) values(null,?,?,now(),?,?,?,?,now(),now(),?)", params, function (err, res) {
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
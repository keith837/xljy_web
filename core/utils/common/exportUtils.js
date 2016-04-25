/**
 * Created by Jerry on 2/19/2016.
 */
var exportUtils = module.exports;
var db = require("../pool/mysql/mysqlPool");
var logger = require("../logger/logger")(__filename);
var async = require("async");

exportUtils.getConfig = function (bizType, operation, cb) {
    var tasks = [function (callback) {
        db.queryOne("select * from XL_EXPORT_CONFIG where bizType=? and state=1", [bizType], function (err, data) {
            if (err) {
                return callback(err);
            }
            if (!data) {
                return callback(new Error("根据业务类型[" + bizType + "]找不到配置数据"));
            } else {
                callback(err, data);
            }
        });
    }, function (query, callback) {
        var type = 1;
        if (operation == "export") {
            type = 3;
        } else if (operation == "import") {
            type = 2;
        } else {
            return callback(new Error("未知操作类型[" + operation + "]"));
        }
        var details = "select * from XL_EXPORT_CONFIG_DETAILS where state=1 and type in (1,?) and configId=? order by sortId";
        db.query(details, [type, query.id], function (err, results) {
            if (err) {
                return callback(err);
            }
            if (!results || results.length == 0) {
                return callback(new Error("未配置业务类型[" + bizType + "]对应的字段信息"));
            }
            var config = new Object();
            config.table = query.tableName;
            config.exportSQL = query.exportSQL;
            var filter = [];
            var sql = [];
            for (var i in results) {
                if (operation == "export") {
                    filter[results[i].columnName] = results[i].columnDesc;
                } else {
                    if (results[i].isImportSQL == 1) {
                        sql.push(results[i].importSQL);
                    } else {
                        filter[results[i].columnDesc] = results[i].columnName;
                    }
                }
            }
            config.filter = filter;
            config.importSQL = sql;
            config.postMethod = query.postMethod;
            callback(err, config);
        });
    }];

    async.waterfall(tasks, function (err, results) {
        if (err) {
            return cb(err);
        }
        cb.apply(null, [null, results]);
    });
}

exportUtils.execImportSQL = function (sqls, userObj, done) {
    var batchId = userObj.batchId;
    if (sqls && sqls.length > 0) {
        db.getConnection(function (err, conn) {
            if (err) {
                return done.apply(null, [err, null]);
            }

            var tasks = [function (callback) {
                conn.beginTransaction(function (err) {
                    callback(err);
                });
            }, function (callback) {
                // insert log
                var insertSQL = "insert into XL_BATCH_OPR_LOG(batchId,fileName,oprDate,oUserId,ext1) values(?,?,now(),?,?)";
                conn.query(insertSQL, [batchId, userObj.file, userObj.userId, userObj.importTbl], function (err, res) {
                    if (err) {
                        return callback(err);
                    }
                    callback(err, res.affectedRows);
                });
            }, function (res, callback) {
                multipleStatements(sqls, batchId, 0, conn, callback);
            }, function (res, callback) {
                conn.commit(function (err) {
                    callback(err, res);
                });
            }];

            async.waterfall(tasks, function (err, results) {
                if (err) {
                    conn.rollback();
                    conn.release();
                    return done(err);
                }
                conn.release();
                done.apply(null, [null, results]);
            });
        });
    } else {
        done(null, 0);
    }
}

function multipleStatements(sqls, batchId, i, conn, callback) {
    if (i < sqls.length - 1) {
        logger.info(sqls[i]);
        conn.query(sqls[i], [batchId], function (err, res) {
            if (err) {
                return callback(err);
            }
            i++;
            multipleStatements(sqls, batchId, i, conn, callback);
        });
    } else {
        logger.info(sqls[i]);
        conn.query(sqls[i], [batchId], function (err, res) {
            if (err) {
                return callback(err);
            }
            callback(err, res.affectedRows);
        });
    }
}


exportUtils.getResults = function (bizType, batchId, start, pageSize, callback) {
    db.queryOne("select * from XL_EXPORT_CONFIG where bizType=? and state=1", [bizType], function (err, data) {
        if (err) {
            return callback(err);
        }
        if (!data) {
            return callback(new Error("根据业务类型[" + bizType + "]找不到配置数据"));
        } else {
            var batchTable = data.tableName;
            var sql = "select count(*) AS total from ?? where batchId=?";
            db.queryOne(sql, [batchTable, batchId], function (err, count) {
                if (err) {
                    return callback(err);
                }
                if (count.total == 0) {
                    return callback(err, 0, []);
                }
                sql = "select * from ?? where batchId=? limit ?,?";
                db.query(sql, [batchTable, batchId, start, pageSize], function (err, res) {
                    callback(err, count.total, res);
                });
            });
        }
    });
}

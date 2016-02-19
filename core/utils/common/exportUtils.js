/**
 * Created by Jerry on 2/19/2016.
 */
var exportUtils = module.exports;
var db = require("../pool/mysql/mysqlPool");
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
            for (var i in results) {
                if (operation == "export") {
                    filter[results[i].columnName] = results[i].columnDesc;
                } else {
                    filter[results[i].columnDesc] = results[i].columnName;
                }
            }
            config.filter = filter;
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

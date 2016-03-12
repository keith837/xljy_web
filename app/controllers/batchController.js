/**
 * Created by Jerry on 2/20/2016.
 */
var basicController = require("../../core/utils/controller/basicController");
var xlsx = require('node-xlsx');
var formidable = require("formidable");
var xlsUtils = require("../../core/utils/common/xlsUtils");
var exportUtils = require("../../core/utils/common/exportUtils");
var async = require("async");
var uuid = require("node-uuid");

module.exports = new basicController(__filename).init({

    exportXls: function (req, res, next) {
        var self = this;
        var log = this.logger;
        var userId = req.user.userId;
        var bizType = req.params.bizType;
        if (!bizType) {
            return next(this.Error("没有传入业务类型参数[bizType]"));
        }
        log.info("用户[" + userId + "]开始批量下载业务[" + bizType + "]数据.");
        var conditions = req.body.conditions;
        var appendSql = "";
        var params = [];
        if (conditions && conditions.length > 0) {
            log.info("下载条件:" + JSON.stringify(conditions));
            var index = 0;
            for (var i in conditions) {
                var opr = conditions[i].opr;
                if (opr == "=" || opr == "like") {
                    if (index == 0) {
                        appendSql += conditions[i].key + " " + conditions[i].opr + " ?";
                        index = index + 1;
                    } else {
                        appendSql += " and " + conditions[i].key + " " + conditions[i].opr + " ?";
                    }
                    if (opr == "like") {
                        params.push("%" + conditions[i].val + "%");
                    } else {
                        params.push(conditions[i].val);
                    }
                } else {
                    return next(self.Error("暂时不支持查询类型[" + opr + "]"));
                }
            }
        }
        exportUtils.getConfig(bizType, "export", function (err, data) {
            if (err) {
                return next(new Error(err));
            }
            var sql = data.exportSQL;
            if (appendSql.length > 0) {
                sql = "select * from (" + sql + ") m where " + appendSql;
            }

            xlsUtils.output(data.filter, sql, params, function (err, filepath) {
                if (err) {
                    next(new Error(err));
                    return;
                }
                //流下载 或者移动到你所需要的静态目录
                res.download(filepath, "download_" + bizType + ".xlsx");

                log.info("用户[" + userId + "]完成批量下载.");
            }, true);
        });
    },

    uploadXls: function (req, res, next) {
        var self = this;
        var log = this.logger;
        var userId = req.user.userId;
        var groupId = req.user.groupId;
        if (groupId != 30) {
            return next(this.Error("用户没有权限导入数据"));
        }
        var classId = 0;
        var schoolId = req.user.schools[0].schoolId;
        var bizType = req.params.bizType;
        if (!bizType) {
            return next(this.Error("没有传入业务类型参数[bizType]"));
        }
        var batchId = uuid.v4();
        var userObj = {};
        userObj.userId = userId;
        userObj.classId = classId;
        userObj.schoolId = schoolId;
        userObj.batchId = batchId;
        log.info("batchId=[" + batchId + "],用户[" + userId + "]开始批量上传业务[" + bizType + "]数据.");
        var tasks = [function upload(callback) {
            var form = new formidable.IncomingForm();
            var savePath = self.cacheManager.getCacheValue("FILE_DIR", "EXPORT");
            form.uploadDir = savePath;
            form.keepExtensions = true;
            form.parse(req, function (error, fields, files) {
                if (error) {
                    return callback(error);
                }
                var info;
                try {
                    info = self.fileUtils.saveFormUploadsWithAutoName([files.xls], savePath);
                    info = info[0];
                    var data = (xlsx.parse(savePath + "/" + info)[0].data);
                    log.info("batchId=[" + batchId + "],上传文件保存:" + (savePath + "/" + info));
                    userObj.file = savePath + "/" + info;
                    callback(error, data);
                } catch (e) {
                    callback(e);
                }
            });
        }, function getConfig(data, callback) {
            exportUtils.getConfig(bizType, "import", function (err, configData) {
                if (err) {
                    return callback(err);
                }
                callback(err, [data, configData]);
            });
        }, function importFile(data, callback) {
            xlsUtils.input(data[1].filter, data[0], data[1].table, userObj, function (err, res) {
                if (err) {
                    return callback(err);
                }
                log.info("batchId=[" + batchId + "],导入临时表数条数" + res.affectedRows);
                callback(err, data[1].importSQL);
            });
        }, function executeSQL(sqls, callback) {
            exportUtils.execImportSQL(sqls, userObj, function (err, res) {
                if (err) {
                    return callback(err);
                }
                log.info("batchId=[" + batchId + "],更新记录条数" + res);
                callback(err, res);
            });
        }];

        async.waterfall(tasks, function (err, results) {
            if (err) {
                return next(err);
            }
            res.json({code: "00", msg: "上传成功."});
            log.info("batchId=[" + batchId + "],用户[" + userId + "]批量上传成功.");
        });
    },

    template: function (req, res, next) {
        var bizType = req.params.bizType;
        if (!bizType) {
            return next(this.Error("没有传入业务类型参数[bizType]"));
        }

        var filePath = this.cacheManager.getCacheValue("BATCH_FILE_TEMPLATE", bizType);
        if (!filePath) {
            return next(this.Error("根据业务类型参数[" + bizType + "]无法查到模板文件"));
        }

        res.download(filePath, bizType + "_template.xls");
    }


})
;
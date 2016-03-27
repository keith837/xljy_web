/**
 * Created by Jerry on 3/25/2016.
 */
var basicController = require("../../core/utils/controller/basicController");

module.exports = new basicController(__filename).init({
    list: function (req, res, next) {
        var self = this;
        var start = parseInt(req.query.iDisplayStart || this.webConfig.iDisplayStart);
        var pageSize = parseInt(req.query.iDisplayLength || this.webConfig.iDisplayLength);
        var obj = new Object;
        var schoolIds = req.query.schoolId ? [parseInt(req.query.schoolId)] : req.user.schoolIds;
        var groupId = req.user.groupId;
        if (groupId == 20) {
            obj.classId = req.user.class.classId;
        }

        var classId = req.query.classId;
        if (classId && classId > 0) {
            obj.classId = parseInt(classId);
        }
        var studentName = req.query.studentName;
        if (studentName) {
            obj.studentName = "%" + studentName + "%";
        }
        self.model["weight"].listByPage(obj, schoolIds, start, pageSize, function (err, total, records) {
            if (err) {
                return next(err);
            }
            return res.json(self.createPageData("00", total, records));
        });
    },

    show: function (req, res, next) {
        var self = this;
        var recordId = req.params.recordId;
        this.model['weight'].queryDetail(recordId, function (err, data) {
            if (err) {
                return next(err);
            } else if (data.length === 0) {
                return next(self.Error("无法查询到记录详情[" + recordId + "]."));
            }
            res.json({code: "00", data: data[0]});
        });
    },

    del: function (req, res, next) {
        var self = this;
        var id = parseInt(req.params.recordId);
        var userId = req.user.userId;
        this.model['weight'].del(id, userId, function (err, data) {
            if (err) {
                return next(err);
            } else if (data.affectedRows !== 1) {
                return next(self.Error("删除学生身高体重记录失败."));
            }
            res.json({code: "00", msg: "删除学生身高体重记录成功."});
        });
    },

    add: function (req, res, next) {
        var self = this;
        var param = {};
        param = parseRecord(req);
        if (!param.studentId || isNaN(param.studentId)) {
            return next(this.Error("没有输入学生信息."));
        }
        this.model['weight'].add(param, function (err, insertId) {
            if (err) {
                return next(err);
            } else if (!insertId) {
                return next(self.Error("新增学生身高体重记录失败."));
            } else {
                res.json({code: "00", msg: "新增学生身高体重记录成功.", data: insertId});
            }
        });
    },

    modify: function (request, response, next) {
        var self = this;
        var param = {};
        param = parseRecord(request);
        param.recordId = parseInt(request.params.recordId);
        if (!param.recordId || isNaN(param.recordId)) {
            return next(this.Error("没有输入记录ID."));
        }
        if (!param.studentId || isNaN(param.studentId)) {
            return next(this.Error("没有输入学生信息"));
        }
        this.model['weight'].update(param, function (err, data) {
            if (err) {
                return next(err);
            } else if (data.affectedRows !== 1) {
                return next(self.Error("更新记录失败."));
            } else {
                response.json({code: "00", msg: "更新记录成功."});
            }
        });
    }

});

function parseRecord(request) {
    var record = {};
    record.recordDate = request.body.recordDate;
    record.studentId = parseInt(request.body.studentId);
    record.weight = request.body.weight;
    record.height = request.body.height;
    var userId = request.user.userId;
    record.oUserId = userId;
    return record;
}
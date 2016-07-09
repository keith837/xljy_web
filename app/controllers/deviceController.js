/**
 * Created by pz on 16/1/27.
 */

var basicController = require("../../core/utils/controller/basicController");
module.exports = new basicController(__filename).init({
    list: function (request, response, next) {
        var self = this;
        var start = parseInt(request.query.iDisplayStart || this.webConfig.iDisplayStart);
        var pageSize = parseInt(request.query.iDisplayLength || this.webConfig.iDisplayLength);
        var queryCondition = [];
        var groupId = request.user.groupId;
        if (groupId === 20) {
            queryCondition.push({"key": "classId", "opr": "=", "val": request.user.class.classId});
        } else if (groupId === 30 || groupId === 40) {
            queryCondition.push({"key": "schoolId", "opr": "in", "val": request.user.schoolIds});
        } else if (groupId === 50) {
        } else {
            return next(self.Error("用户没有相应权限"))
        }

        var deviceName = request.query.deviceName;
        if (deviceName) {
            queryCondition.push({"key": "deviceName", "opr": "like", "val": deviceName});
        }
        var studentName = request.query.studentName;
        if (studentName) {
            queryCondition.push({"key": "studentName", "opr": "like", "val": studentName});
        }

        var schoolId = request.query.schoolId;
        if (schoolId) {
            queryCondition.push({"key": "schoolId", "opr": "=", "val": parseInt(schoolId)});
        }
        var classId = request.query.classId;
        if (classId) {
            queryCondition.push({"key": "classId", "opr": "=", "val": parseInt(classId)});
        }
        this.model['device'].queryPage(start, pageSize, queryCondition, function (err, totalCount, res) {
            if (err) {
                return next(err);
            }
            response.json(self.createPageData("00", totalCount, res));
        });
    },

    addDevice: function (request, response, next) {
        var self = this;
        var param = {};
        param = parseDevice(request);
        if (!param.studentId || isNaN(param.studentId)) {
            return next(this.Error("没有输入学生信息."));
        }
        this.model['device'].add(param, function (err, insertId) {
            if (err) {
                return next(err);
            } else if (!insertId) {
                return next(self.Error("添加手环记录失败."));
            } else {
                response.json({code: "00", msg: "添加手环记录成功."});
            }
        });
    },

    delDevice: function (request, response, next) {
        var self = this;
        var id = parseInt(request.params.id);
        this.model['device'].del(id, function (err, data) {
            if (err) {
                return next(err);
            } else if (data.affectedRows !== 1) {
                return next(self.Error("删除手环记录失败."));
            }
            response.json({code: "00", msg: "删除手环记录成功."});
        });
    },

    updateDevice: function (request, response, next) {
        var self = this;
        var param = {};
        param = parseDevice(request);
        param.deviceId = parseInt(request.params.id);
        if (!param.deviceId || isNaN(param.deviceId)) {
            return next(this.Error("没有输入手环ID."));
        }
        if (!param.studentId || isNaN(param.studentId)) {
            return next(this.Error("没有输入学生信息"));
        }
        this.model['device'].update(param, function (err, data) {
            if (err) {
                return next(err);
            } else if (data.affectedRows !== 1) {
                return next(self.Error("更新手环失败."));
            } else {
                response.json({code: "00", msg: "更新手环成功."});
            }
        });
    },
    detail: function (request, response, next) {
        var self = this;
        var deviceId = request.params.id;
        this.model['device'].queryDetail(deviceId, function (err, res) {
            if (err) {
                return next(err);
            } else if (res.length === 0) {
                return next(self.Error("无法查询到手环详情[" + deviceId + "]."));
            }
            response.json({code: "00", data: res});
        });
    }

});


function parseDevice(request) {
    var device = {};
    device.deviceSign = request.body.deviceSign ? request.body.deviceSign.toUpperCase() : "";
    device.deviceName = request.body.deviceName;
    device.studentId = parseInt(request.body.studentId);
    device.state = request.body.state;
    device.createDate = request.body.createDate;
    device.doneDate = request.body.doneDate;
    var userId = request.user.userId;
    device.oUserId = userId;
    return device;
}

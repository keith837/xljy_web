var basicController = require("../../core/utils/controller/basicController");

module.exports = new basicController(__filename).init({
    list: function (request, response, next) {
        var self = this;
        var start = parseInt(request.query.iDisplayStart || this.webConfig.iDisplayStart);
        var pageSize = parseInt(request.query.iDisplayLength || this.webConfig.iDisplayLength);
        var queryCondition = [];
        var userId = request.user.userId;
        var schoolId = request.query.schoolId;
        var stationMac = request.query.stationMac;

        var groupId = request.user.groupId;
        var schools = null;
        if (groupId === 20) {
            schools = {"key": "schoolId", "opr": "=", "val": request.user.class.schoolId};
        } else if (groupId === 30 || groupId === 40) {
            schools = {"key": "schoolId", "opr": "in", "val": request.user.schoolIds};
        } else if (groupId === 50) {
        } else {
            return next(self.Error("用户没有相应权限"))
        }

        if (stationMac) {
            queryCondition.push({"key": "stationMac", "opr": "like", "val": stationMac});
        }
        if (schoolId) {
            queryCondition.push({"key": "schoolId", "opr": "=", "val": parseInt(schoolId)});
        } else {
            if (schools != null) {
                queryCondition.push(schools);
            }
        }

        self.model['station'].queryPage(start, pageSize, queryCondition, function (err, totalCount, res) {
            if (err) {
                return next(err);
            }
            response.json(self.createPageData("00", totalCount, res));
        });
    },

    detail: function (request, response, next) {
        var self = this;
        var stationId = request.params.id;
        this.model['station'].queryDetail(stationId, function (err, res) {
            if (err) {
                return next(err);
            } else if (res.length === 0) {
                return next(self.Error("无法查询到基站详情[" + stationId + "]."));
            }
            response.json({code: "00", data: res});
        });
    },

    addStation: function (request, response, next) {
        var self = this;
        var param = {};
        param = parseStation(request);
        if (!param.schoolId || isNaN(param.schoolId)) {
            return next(this.Error("没有输入学校信息."));
        }

        this.model['station'].add(param, function (err, insertId) {
            if (err) {
                return next(err);
            } else if (!insertId) {
                return next(self.Error("添加基站失败."));
            } else {
                response.json({code: "00", msg: "添加基站成功."});
            }
        });
    },

    delStation: function (request, response, next) {
        var self = this;
        var id = parseInt(request.params.id);
        this.model['station'].del(id, function (err, data) {
            if (err) {
                return next(err);
            } else if (data.affectedRows !== 1) {
                return next(self.Error("删除基站失败."));
            } else {
                response.json({code: "00", msg: "删除基站成功."});
            }
        });
    },

    updateStation: function (request, response, next) {
        var self = this;
        var param = {};
        param = parseStation(request);
        param.stationId = parseInt(request.params.id);
        if (!param.schoolId || isNaN(param.schoolId)) {
            return next(this.Error("没有输入学校信息."));
        }
        if (!param.stationId || isNaN(param.stationId)) {
            return next(this.Error("没有输入基站ID"));
        }
        this.model['station'].update(param, function (err, data) {
            if (err) {
                return next(err);
            } else if (data.affectedRows !== 1) {
                return next(self.Error("更新基站失败."));
            } else {
                response.json({code: "00", msg: "更新基站成功."});
            }
        });
    }

});

function parseStation(request) {
    var station = {};
    station.stationId = parseInt(request.body.stationId);
    station.stationMac = request.body.stationMac;
    station.schoolId = parseInt(request.body.schoolId);
    station.location = request.body.location;
    station.type = request.body.type;
    station.state = request.body.state || 1;
    station.createDate = request.body.createDate;
    station.doneDate = request.body.doneDate;
    var userId = request.user.userId;
    station.oUserId = userId;
    return station;
}

var basicController = require("../../core/utils/controller/basicController");

module.exports = new basicController(__filename).init({
    list: function (request, response, next) {
        var self = this;
        var start = parseInt(request.query.iDisplayStart || 0);
        var pageSize = parseInt(request.query.iDisplayLength || 10);
        var queryCondition = {};
        var schoolId = request.query.schoolId;
        if (schoolId) {
            queryCondition.schoolId = parseInt(schoolId);
        }
        var stationMac = request.query.stationMac;
        if (stationMac) {
            queryCondition.stationMac = stationMac;
        }
        this.model['station'].queryPage(start, pageSize, queryCondition, function (err, totalCount, res) {
            if (err) {
                return next(err);
            }
            if (totalCount === 0) {
                return next(self.Error("沒有查询到基站信息."));
            } else {
                response.json(self.createPageData("00", totalCount, res));
            }
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
    station.state = request.body.state;
    station.createDate = request.body.createDate;
    station.doneDate = request.body.doneDate;
    var userId = request.user.userId;
    station.oUserId = userId;
    return station;
}
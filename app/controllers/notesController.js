/**
 * Created by Jerry on 2/11/2016.
 */

var basicController = require("../../core/utils/controller/basicController");
module.exports = new basicController(__filename).init({
    list: function (request, response, next) {
        var self = this;
        var start = parseInt(request.query.iDisplayStart || this.webConfig.iDisplayStart);
        var pageSize = parseInt(request.query.iDisplayLength || this.webConfig.iDisplayLength);

        var queryCondition = [];
        var userId = request.user.userId;
        queryCondition.push({"key": "userId", "opr": "=", "val": userId});

        var notesTypeId = null;
        if (request.user.source == 2 && request.user.channel == 4) {
            // web login
        } else {
            notesTypeId = parseInt(request.query.notesTypeId);
            if (!notesTypeId || isNaN(notesTypeId)) {
                return next(this.Error("没有输入笔记类型[notesTypeId]."));
            }
            queryCondition.push({"key": "notesTypeId", "opr": "=", "val": notesTypeId});
        }

        var effDateStart = request.query.startDate;
        if (effDateStart) {
            queryCondition.push({"key": "createDate", "opr": ">=", "val": effDateStart});
        }
        var effDateEnd = request.query.endDate;
        if (effDateEnd) {
            queryCondition.push({"key": "createDate", "opr": "<=", "val": effDateEnd});
        }
        var queryUserName = request.query.custName;
        if (queryUserName) {
            queryCondition.push({"key": "userName", "opr": "like", "val": queryUserName});
        }
        var notesTitle = request.query.notesTitle;
        if (notesTitle) {
            queryCondition.push({"key": "notesTitle", "opr": "like", "val": notesTitle});
        }
        var notesContext = request.query.notesContext;
        if (notesContext) {
            queryCondition.push({"key": "notesContext", "opr": "like", "val": notesContext});
        }
        var querySchoolId = request.query.schoolId;
        if (querySchoolId) {
            querySchoolId = parseInt(querySchoolId);
            if (!isNaN(querySchoolId)) {
                queryCondition.push({"key": "schoolId", "opr": "=", "val": querySchoolId});
            }
        }

        this.model['notes'].queryByNotesType(start, pageSize, queryCondition, function (err, totalCount, res) {
            if (err) {
                return next(err);
            }
            response.json(self.createPageData("00", totalCount, res));
        });

    },

    publish: function (request, response, next) {
        var self = this;
        var userId = request.user.userId;
        var groupId = request.user.groupId;

        var notesTypeId = parseInt(request.query.notesTypeId);
        if (!notesTypeId || isNaN(notesTypeId)) {
            return next(this.Error("没有输入笔记类型."));
        }
        if (groupId != 30) {
            return next(this.Error("用户组[" + groupId + "]没有相应的权限发布此笔记[" + notesTypeId + "]."));
        }

        var classId = 0;
        var className = null;
        var schoolId = request.user.schools[0].schoolId;
        var schoolName = request.user.schools[0].schoolName;
        var userName = request.user.custName;
        var nickName = request.user.nickName;
        var content = request.body.notesContext;
        var title = request.body.notesTitle;
        var notesParam = [notesTypeId, title, content, schoolId, classId, userId, schoolName, className, userName, nickName];

        self.model['notes'].publishNotes(notesParam, function (err, noticeId) {
            if (err) {
                return next(err);
            }
            self.model['notes'].queryDetail(noticeId, function (err, res) {
                if (err) {
                    return next(err);
                }
                response.json({code: "00", msg: "发布笔记成功", data: res});

            });
        });
    },

    del: function (request, response, next) {
        var self = this;
        var userId = request.user.userId;
        var notesId = parseInt(request.params.id);
        this.model['notes'].delete(notesId, userId, function (err, data) {
            if (err) {
                return next(err);
            } else if (data.affectedRows !== 1) {
                return next(self.Error("删除笔记失败."));
            }
            response.json({code: "00", msg: "笔记删除成功"});
        });
    },

    details: function (request, response, next) {
        var self = this;
        var notesId = parseInt(request.params.id);
        this.model['notes'].queryDetail(notesId, function (err, res) {
            if (err) {
                return next(err);
            } else if (res.length === 0) {
                return next(self.Error("无法查询到笔记详情[" + notesId + "]."));
            }
            response.json({code: "00", data: res});
        });
    },

    edit: function (request, response, next) {
        var self = this;
        var notesId = parseInt(request.params.id);
        var userId = request.user.userId;

        var content = request.body.notesContext;
        var title = request.body.notesTitle;
        var notesParam = [userId, title, content, notesId];
        self.model['notes'].editNotes(notesParam, function (err, data) {
            if (err) {
                return next(err);
            }
            self.model['notes'].queryDetail(notesId, function (err, res) {
                if (err) {
                    return next(err);
                }
                response.json({code: "00", msg: "更新笔记成功", data: res});
            });

        });
    }

});

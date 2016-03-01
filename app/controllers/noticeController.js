/**
 * Created by Jerry on 2/11/2016.
 */
var formidable = require("formidable");
var fs = require("fs");

var basicController = require("../../core/utils/controller/basicController");
module.exports = new basicController(__filename).init({
    list: function (request, response, next) {
        var self = this;
        var start = parseInt(request.query.iDisplayStart || this.webConfig.iDisplayStart);
        var pageSize = parseInt(request.query.iDisplayLength || this.webConfig.iDisplayLength);

        var queryCondition = [];
        var userId = request.user.userId;
        var groupId = request.user.groupId;

        var classId = {};
        var schoolId = {};
        if (groupId === 10) {
            classId = {"key": "classId", "opr": "=", "val": request.user.student.classId};
            schoolId = {"key": "schoolId", "opr": "=", "val": request.user.student.schoolId};
        } else if (groupId === 20) {
            classId = {"key": "classId", "opr": "=", "val": request.user.class.classId};
            schoolId = {"key": "schoolId", "opr": "=", "val": request.user.class.schoolId};
        } else if (groupId === 30 || groupId === 40) {
            var schoolIds = request.user.schoolIds;
            if (schoolIds == null || schoolIds.length <= 0) {
                return next(this.Error("园长没有对应的学校信息"));
            }
            schoolId = {"key": "schoolId", "opr": "in", "val": schoolIds};
        } else if (groupId == 50) {
        } else {
            return next(this.Error("用户没有相应权限"));
        }

        var noticeTypeId = null;
        if (request.user.source == 2 && request.user.channel == 4) {
            // web login
            noticeTypeId = -1;
            if (groupId == 50) {
                // 超级园长
            } else {
                queryCondition.push(schoolId);
            }
        } else {
            noticeTypeId = parseInt(request.query.noticeTypeId);
            if (!noticeTypeId || isNaN(noticeTypeId)) {
                return next(this.Error("没有输入通知类型."));
            }
            queryCondition.push({"key": "noticeTypeId", "opr": "=", "val": noticeTypeId});
            if (noticeTypeId == 1 || noticeTypeId == 7) {
                if (groupId == 10 || groupId == 20) {
                    queryCondition.push(classId);
                } else {
                    queryCondition.push(schoolId);
                }
            } else {
                queryCondition.push(schoolId);
            }
        }

        var effDateStart = request.query.effDateStart;
        if (effDateStart) {
            queryCondition.push({"key": "effDate", "opr": ">=", "val": effDateStart});
        }
        var effDateEnd = request.query.effDateEnd;
        if (effDateEnd) {
            queryCondition.push({"key": "effDate", "opr": "<=", "val": effDateEnd});
        }
        var queryUserName = request.query.custName;
        if (queryUserName) {
            queryCondition.push({"key": "userName", "opr": "like", "val": queryUserName});
        }
        var noticeTitle = request.query.noticeTitle;
        if (noticeTitle) {
            queryCondition.push({"key": "noticeTitle", "opr": "like", "val": noticeTitle});
        }
        var noticeContext = request.query.noticeContext;
        if (noticeContext) {
            queryCondition.push({"key": "noticeContext", "opr": "like", "val": noticeContext});
        }
        var querySchoolId = request.query.schoolId;
        if (querySchoolId) {
            querySchoolId = parseInt(querySchoolId);
            if (!isNaN(querySchoolId)) {
                queryCondition.push({"key": "schoolId", "opr": "=", "val": querySchoolId});
            }
        }

        var queryClassId = request.query.classId;
        if (queryClassId) {
            queryClassId = parseInt(queryClassId);
            if (!isNaN(queryClassId)) {
                queryCondition.push({"key": "classId", "opr": "=", "val": queryClassId});
            }
        }

        this.model['notice'].queryByNoticeType(start, pageSize, queryCondition, function (err, totalCount, res) {
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

        var noticeTypeId = parseInt(request.query.noticeTypeId);
        if (!noticeTypeId || isNaN(noticeTypeId)) {
            return next(this.Error("没有输入通知类型."));
        }
        if (!checkPermission(groupId, noticeTypeId)) {
            return next(this.Error("用户组[" + groupId + "]没有相应的权限发布此通知类型[" + noticeTypeId + "]."));
        }
        var uploadDir = self.cacheManager.getCacheValue("FILE_DIR", "PHOTOS");
        uploadDir += "user" + userId + "/";
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir);
        }
        var form = new formidable.IncomingForm();   //创建上传表单
        form.encoding = 'utf-8';		//设置编辑
        form.uploadDir = uploadDir;	 //设置上传目录
        form.keepExtensions = true;	 //保留后缀
        form.maxFieldsSize = 2 * 1024 * 1024;   //文件大小

        var classId = 0;
        var className = "";
        var schoolId = request.user.schools[0].schoolId;
        var schoolName = request.user.schools[0].schoolName;
        var userName = request.user.custName;
        var nickName = request.user.nickName;
        if (groupId == 10 || groupId == 20) {
            classId == request.user.class.classId;
            className = request.user.class.className;
        }
        form.parse(request, function (err, fields, files) {
            var content = fields.content;
            var title = fields.title;
            var effDate = fields.effDate;
            var expDate = fields.expDate;
            var noticeParam = [noticeTypeId, title, content, effDate, expDate, schoolId, classId, userId, schoolName, className, userName, nickName];
            var noticePics = new Array();
            for (var photos in files) {
                noticePics.push([files[photos].path, userId]);
            }
            self.model['notice'].publishNotice(noticeParam, noticePics, function (err, data) {
                if (err) {
                    return next(err);
                }
                response.json({code: "00", msg: "通知发布成功"});
            });
        });

    },

    del: function (request, response, next) {
        var self = this;
        var userId = request.user.userId;
        var noticeId = parseInt(request.params.id);
        this.model['notice'].delete(noticeId, userId, function (err, data) {
            if (err) {
                return next(err);
            } else if (data.affectedRows !== 1) {
                return next(self.Error("删除通知记录失败."));
            }
            response.json({code: "00", msg: "通知删除成功"});
        });
    },

    details: function (request, response, next) {
        var self = this;
        var noticeId = parseInt(request.params.id);
        this.model['notice'].queryDetail(noticeId, function (err, res) {
            if (err) {
                return next(err);
            } else if (res.length === 0) {
                return next(self.Error("无法查询到通知详情[" + noticeId + "]."));
            }
            response.json({code: "00", data: res});
        });
    },

    edit: function (request, response, next) {
        var self = this;
        var noticeId = parseInt(request.params.id);
        var userId = request.user.userId;

        var uploadDir = self.cacheManager.getCacheValue("FILE_DIR", "PHOTOS");
        uploadDir += "user" + userId + "/";
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir);
        }
        var form = new formidable.IncomingForm();   //创建上传表单
        form.encoding = 'utf-8';		//设置编辑
        form.uploadDir = uploadDir;	 //设置上传目录
        form.keepExtensions = true;	 //保留后缀
        form.maxFieldsSize = 2 * 1024 * 1024;   //文件大小

        form.parse(request, function (err, fields, files) {
            var content = fields.content;
            var title = fields.title;
            var effDate = fields.effDate;
            var expDate = fields.expDate;
            var noticeParam = [userId, title, content, effDate, expDate, noticeId];
            var noticePics = new Array();
            for (var photos in files) {
                noticePics.push([files[photos].path, userId]);
            }
            self.model['notice'].editNotice(noticeParam, noticePics, function (err, data) {
                if (err) {
                    return next(err);
                }
                response.json({code: "00", msg: "更新通知成功"});
            });
        });

    }


});


function checkPermission(groupId, noticeTypeId) {
    //家长、集团园长、超级园长无权限发布通知
    if (groupId === 10 || groupId === 40 || groupId === 50) {
        return false;
    }

    if (groupId === 20) {
        //教师可以发布 班级通知 和 今日作业
        if (noticeTypeId === 1 || noticeTypeId === 7) {
            return true;
        } else {
            return false;
        }
    }

    if (groupId === 30) {
        // 园长可以发布 教师通知、家长通知、今日食谱、工作计划、紧急通知
        if (noticeTypeId === 2 || noticeTypeId === 3 || noticeTypeId === 4 || noticeTypeId === 5 || noticeTypeId === 6) {
            return true;
        } else {
            return false;
        }
    }


}
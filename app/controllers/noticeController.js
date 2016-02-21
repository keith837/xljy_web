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

        var userId = request.user.userId;
        var groupId = request.user.groupId;

        var classId = 0;
        var schoolId = 0;
        if (groupId === 10) {
            classId = request.user.student.classId;
            schoolId = request.user.student.schoolId;
        } else if (groupId === 20) {
            classId = request.user.classInfo.classId;
            schoolId = request.user.classInfo.schoolId;
        } else if (groupId === 30 || groupId === 40) {
            schoolId = request.user.school.schoolId;
        }
        var noticeTypeId = parseInt(request.query.noticeTypeId);
        if (!noticeTypeId || isNaN(noticeTypeId)) {
            return next(this.Error("没有输入通知类型."));
        }

        this.model['notice'].queryByNoticeType(start, pageSize, noticeTypeId, groupId, schoolId, classId, function (err, totalCount, res) {
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
        var schoolId = 0;
        if (groupId == 10) {
            classId == request.user.student.classId;
            schoolId = request.user.student.schoolId;
        } else if (groupId == 20) {
            classId = request.user.classInfo.classId;
            schoolId = request.user.classInfo.schoolId;
        } else if (groupId == 30 || groupId == 40) {
            schoolId = request.user.school.schoolId;
        }
        form.parse(request, function (err, fields, files) {
            var content = fields.content;
            var title = fields.title;
            var effDate = fields.effDate;
            var expDate = fields.expDate;
            var noticeParam = [noticeTypeId, title, content, effDate, expDate, schoolId, classId, userId];
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
    if (groupId === 10) {
        return false;
    }

    if (noticeTypeId === 1) {
        //班级通知
        if (groupId === 20) {
            return true;
        } else {
            return false;
        }
    } else if (noticeTypeId === 2 || noticeTypeId === 3 || noticeTypeId === 4 || noticeTypeId === 5 || noticeTypeId === 6) {
        if (groupId === 30 || groupId === 40) {
            return true;
        } else {
            return false;
        }
    }
}
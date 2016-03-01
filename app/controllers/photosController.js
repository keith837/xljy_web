/**
 * Created by Jerry on 2/14/2016.
 */

var basicController = require("../../core/utils/controller/basicController");
var formidable = require("formidable");
var fs = require("fs");

module.exports = new basicController(__filename).init({

    publish: function (req, res, next) {
        var self = this;
        var userId = req.user.userId;
        var groupId = req.user.groupId;
        var nickName = req.user.nickName;

        var albumType = parseInt(req.query.albumType);
        //1:班级相册;2:成长点滴
        if (!albumType || isNaN(albumType)) {
            return next(this.Error("没有输入相册类型."));
        }
        if (groupId == 30 || groupId == 40 || groupId == 50) {
            return next(this.Error("园长不能发布班级相册"));
        }

        var studentId = 0;
        var studentName = '';
        var schoolId = req.user.schools[0].schoolId;
        var schoolName = req.user.schools[0].schoolName;
        var classId = req.user.class.classId;
        var className = req.user.class.className;
        var userName = req.user.custName;
        if (groupId === 10) {
            studentId = req.user.student.studentId;
            studentName = req.user.student.studentName;
            nickName = studentName + nickName;
            if (albumType !== 2) {
                return next(this.Error("家长只能发布成长点滴"));
            }
        } else if (groupId === 20) {
            if (albumType === 2) {
                return next(this.Error("教师不能发布成长点滴"));
            }
        }

        var uploadDir = self.cacheManager.getCacheValue("FILE_DIR", "PHOTOS");
        uploadDir += "class" + classId + "/";
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir);
        }

        var form = new formidable.IncomingForm();   //创建上传表单
        form.encoding = 'utf-8';		//设置编辑
        form.uploadDir = uploadDir;	 //设置上传目录
        form.keepExtensions = true;	 //保留后缀
        form.maxFieldsSize = 2 * 1024 * 1024;   //文件大小
        form.parse(req, function (err, fields, files) {
            var content = fields.content;
            var albumTitle = fields.albumTitle;
            var albumParam = [albumType, albumTitle, content, schoolId, classId, userId, nickName, studentId, studentName, schoolName, className, userName];
            var albumPics = new Array();
            for (var photos in files) {
                albumPics.push([files[photos].path, userId]);
            }
            if (albumPics.length === 0) {
                return next(self.Error("没有上传照片."));
            }
            self.model['photos'].publish(albumParam, albumPics, function (err, data) {
                if (err) {
                    return next(err);
                }
                res.json({code: "00", msg: "发布相册成功"});
            });
        });
    },

    delete: function (req, res, next) {
        var self = this;
        var userId = req.user.userId;
        var albumId = parseInt(req.params.id);
        this.model['photos'].delete(albumId, userId, function (err, data) {
            if (err) {
                return next(err);
            } else if (data.affectedRows !== 1) {
                return next(self.Error("删除相册记录失败."));
            }
            res.json({code: "00", msg: "相册删除成功"});
        });
    },

    like: function (req, res, next) {
        var self = this;

        var userId = req.user.userId;
        var groupId = req.user.groupId;
        var nickName = req.user.nickName;
        var studentId = 0;
        var studentName = '';
        if (groupId === 10) {
            studentId = req.user.student.studentId;
            studentName = req.user.student.studentName;
            nickName = studentName + nickName;
        }

        var albumId = parseInt(req.params.id);
        //handleType:1:点赞,2:评论
        this.model['photos'].findHandle(albumId, 1, userId, function (err, data) {
            if (err) {
                return next(err);
            }
            if (data && data.length > 0) {
                return next(self.Error("用户已点赞"));
            }
            self.model['photos'].addAlbumLike(albumId, userId, nickName, studentId, studentName, function (err, data) {
                if (err) {
                    return next(err);
                }
                res.json({code: "00", msg: "相册点赞成功"});
            });
        });
    },

    comment: function (req, res, next) {
        var userId = req.user.userId;
        var groupId = req.user.groupId;
        var nickName = req.user.nickName;
        var studentId = 0;
        var studentName = '';
        if (groupId === 10) {
            studentId = req.user.student.studentId;
            studentName = req.user.student.studentName;
            nickName = studentName + nickName;
        }
        var albumId = parseInt(req.params.id);
        var content = req.body.content;
        var parentHandleId = req.body.parentHandleId;
        if (!parentHandleId || isNaN(parentHandleId)) {
            parentHandleId = null;
        }
        //handleType:1:点赞,2:评论
        this.model['photos'].addAlbumComment(albumId, userId, nickName, parentHandleId, content, studentId, studentName, function (err, data) {
                if (err) {
                    return next(err);
                }
                res.json({code: "00", msg: "相册评论成功"});
            }
        );
    },

    list: function (req, res, next) {
        var self = this;
        var start = parseInt(req.query.iDisplayStart || 0);
        var pageSize = parseInt(req.query.iDisplayLength || 10);
        var userId = req.user.userId;
        var groupId = req.user.groupId;

        var queryCondition = [];
        if (groupId === 10) {
            queryCondition.push({"key": "classId", "opr": "=", "val": req.user.student.classId});
        } else if (groupId === 20) {
            queryCondition.push({"key": "classId", "opr": "=", "val": req.user.class.classId});
        } else if (groupId === 30 || groupId === 40) {
            var schoolIds = req.user.schoolIds;
            if (schoolIds == null || schoolIds.length <= 0) {
                return next(this.Error("园长没有对应的学校信息"));
            }
            queryCondition.push({"key": "schoolId", "opr": "in", "val": schoolIds});
        } else if (groupId == 50) {
        } else {
            return next(this.Error("用户没有相应权限"));
        }
        var albumType = parseInt(req.query.albumType);
        if (!albumType || isNaN(albumType)) {
            return next(this.Error("没有输入相册类型."));
        }
        queryCondition.push({"key": "albumType", "opr": "=", "val": albumType});

        var publishDateStart = req.query.publishDateStart;
        if (publishDateStart) {
            queryCondition.push({"key": "createDate", "opr": ">=", "val": publishDateStart});
        }
        var publishDateEnd = req.query.publishDateEnd;
        if (publishDateEnd) {
            queryCondition.push({"key": "createDate", "opr": "<=", "val": publishDateEnd});
        }

        var querySchoolId = req.query.schoolId;
        if (querySchoolId) {
            querySchoolId = parseInt(querySchoolId);
            if (!isNaN(querySchoolId)) {
                queryCondition.push({"key": "schoolId", "opr": "=", "val": querySchoolId});
            }
        }

        var queryClassId = req.query.classId;
        if (queryClassId) {
            queryClassId = parseInt(queryClassId);
            if (!isNaN(queryClassId)) {
                queryCondition.push({"key": "classId", "opr": "=", "val": queryClassId});
            }
        }

        this.model['photos'].queryByAlbumType(start, pageSize, queryCondition, function (err, totalCount, results) {
            if (err) {
                return next(err);
            }
            res.json(self.createPageData("00", totalCount, results));
        });
    },

    edit: function (req, res, next) {
        var self = this;
        var userId = req.user.userId;
        var groupId = req.user.groupId;
        var nickName = req.user.nickName;

        var albumId = parseInt(req.params.id);

        var classId = 0;
        var schoolId = 0;
        var studentId = 0;
        var studentName = '';
        if (groupId === 10) {
            classId = req.user.student.classId;
            schoolId = req.user.student.schoolId;
            studentId = req.user.student.studentId;
            studentName = req.user.student.studentName;
            nickName = studentName + nickName;
        } else if (groupId === 20) {
            classId = req.user.class.classId;
            schoolId = req.user.class.schoolId;
        } else if (groupId === 30 || groupId === 40) {
            schoolId = req.user.schoolIds[0];
        }

        var uploadDir = self.cacheManager.getCacheValue("FILE_DIR", "PHOTOS");
        uploadDir += "class" + classId + "/";
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir);
        }

        var form = new formidable.IncomingForm();   //创建上传表单
        form.encoding = 'utf-8';		//设置编辑
        form.uploadDir = uploadDir;	 //设置上传目录
        form.keepExtensions = true;	 //保留后缀
        form.maxFieldsSize = 2 * 1024 * 1024;   //文件大小
        form.parse(req, function (err, fields, files) {
            var content = fields.content;
            var albumTitle = fields.albumTitle;
            var albumParam = [albumTitle, content, schoolId, classId, userId, nickName, studentId, studentName, albumId];
            var albumPics = new Array();
            for (var photos in files) {
                albumPics.push([files[photos].path, userId]);
            }
            if (albumPics.length === 0) {
                return next(self.Error("没有上传照片."));
            }
            self.model['photos'].edit(albumParam, albumPics, function (err, data) {
                if (err) {
                    return next(err);
                }
                res.json({code: "00", msg: "编辑相册成功"});
            });
        });
    }
});

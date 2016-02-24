var basicController = require("../../core/utils/controller/basicController");
var formidable = require("formidable");
var fs = require("fs");

module.exports = new basicController(__filename).init({
    create: function (req, res, next) {
        var self = this;
        var userId = req.user.userId;
        var uploadDir = self.cacheManager.getCacheValue("FILE_DIR", "PHOTOS");
        uploadDir += "user" + userId + "/";
        if(!fs.existsSync(uploadDir)){
            fs.mkdirSync(uploadDir);
        }
        var groupId = req.user.groupId;
        var form = new formidable.IncomingForm();   //创建上传表单
        form.encoding = 'utf-8';		//设置编辑
        form.uploadDir = uploadDir;	 //设置上传目录
        form.keepExtensions = true;	 //保留后缀
        form.maxFieldsSize = 2 * 1024 * 1024;   //文件大小

        var classId = 0;
        var schoolId = 0;
        var studentId = 0;
        var studentName = '';
        var nickName = req.user.nickName;
        if (groupId == 10) {
            classId == req.user.student.classId;
            schoolId = req.user.student.schoolId;
            studentId = req.user.student.studentId;
            studentName = req.user.student.studentName;
            nickName = studentName + studentName;
        } else if (groupId == 20) {
            classId = req.user.classInfo.classId;
            schoolId = req.user.classInfo.schoolId;
        } else if (groupId == 30 || groupId == 40) {
            schoolId = req.user.school.schoolId;
        }
        form.parse(req, function (err, fields, files) {
            var content = fields.content;
            var isTop = fields.isTop || 0;
            var albumArg = [schoolId, classId, 3, '动态信息', content, new Date(), isTop, nickName, studentId, studentName, 0, 0, 1, req.user.userId];
            var albumPicArgs = new Array();
            for (var photos in files) {
                albumPicArgs.push([files[photos].path, 0, null, 1, req.user.userId]);
            }
            self.model['album'].create(albumArg, albumPicArgs, function (err, data) {
                if (err) {
                    return next(err);
                }
                res.json({
                    code: "00",
                    msg: "动态发布成功"
                });
            });
        });
    },

    delete: function (req, res, next) {
        var userId = req.user.uesrId;
        var trendsId = req.params.trendsId;
        self.model['album'].delete(3, trendsId, userId, function (err, data) {
            if (err) {
                return next(err);
            }
            if (data && data.affectedRows == 1) {
                res.json({
                    code: "00",
                    msg: "动态删除成功"
                });
            } else {
                return next(new Error("需删除的动态信息不存在"));
            }
        });
    },

    like: function (req, res, next) {
        var userId = req.user.userId;
        var trendsId = req.params.trendsId;
        var groupId = req.user.groupId;
        var studentId = 0;
        var studentName = '';
        var nickName = req.user.nickName;
        if (groupId == 10) {
            studentId = req.user.student.studentId;
            studentName = req.user.student.studentName;
            nickName = studentName + nickName;
        }
        self.model['album'].findHandle(trendsId, 1, userId, function (err, data) {
            if (err) {
                return next(err);
            }
            if (data && data.length > 0) {
                return next(new Error("用户已点赞"));
            }
            var handleArgs = [trendsId, userId, nickName, studentId, studentName, userId];
            self.model['album'].createAlbumLike(trendsId, handleArgs, function (err, data) {
                if (err) {
                    return next(err);
                }
                res.json({
                    code: "00",
                    msg: "点赞成功"
                });
            });
        });
    },

    comment: function (req, res, next) {
        var userId = req.user.userId;
        var trendsId = req.params.trendsId;
        var content = req.params.content;
        var groupId = req.user.groupId;
        var studentId = 0;
        var studentName = '';
        var nickName = req.user.nickName;
        if (groupId == 40) {
            studentId = req.user.student.studentId;
            studentName = req.user.student.studentName;
            nickName = studentName + nickName;
        }
        var handleArgs = [trendsId, content, userId, nickName, studentId, studentName, userId];
        self.model['album'].createAlbumComment(trendsId, handleArgs, function (err, data) {
            if (err) {
                return next(err);
            }
            res.json({
                code: "00",
                msg: "评论成功"
            });
        });
    },

    list : function(req, res, next){
        var self = this;
        var start = parseInt(req.query.iDisplayStart || this.webConfig.iDisplayStart);
        var pageSize = parseInt(req.query.iDisplayLength || this.webConfig.iDisplayLength);
        var obj = new Object();
        obj.albumType = 3;
        self.model['album'].listByPage(obj, start, pageSize, function(err, total, trends) {
            if (err) {
                return next(err);
            }
            if (!trends) {
                return res.json(self.createPageData("00", total, trends));
            }
            var trendsIds = new Array();
            for (var i = 0; i < trends.length; i ++) {
                trendsIds.push(trends[i].albumId);
            }
            self.model['album'].findPics(trendsIds, function (err, pics) {
                if (err) {
                    return next(err);
                }
                var picsObject = new Object();
                if (pics) {
                    for (var i = 0; i < pics.length; i++) {
                        var picArray = picsObject[pics[i].albumId];
                        if (!picArray) {
                            picArray = new Array();
                            picsObject[pics[i].albumId] = picArray;
                        }
                        picArray.push({
                            picId: pics[i].picId,
                            picUrl: pics[i].picUrl
                        });
                    }
                }
                var handleObj = new Object();
                handleObj.handleType = 2;
                self.model['album'].findHandles(trendsIds, handleObj, function (err, handles) {
                    if (err) {
                        return next(err);
                    }
                    var handlesObject = new Object();
                    if (handles) {
                        for (var i = 0; i < handles.length; i++) {
                            var handleArray = handlesObject[handles[i].albumId];
                            if (!handleArray) {
                                handleArray = new Array();
                                handlesObject[handles[i].albumId] = handleArray;
                            }
                            handleArray.push({
                                handleId: handles[i].handleId,
                                content: handles[i].content,
                                nickName: handles[i].nickName,
                                userId: handles[i].hUserId,
                                createDate: handles[i].createDate
                            });
                        }
                    }
                    var trendsArray = new Array();
                    for (var i = 0; i < trends.length; i++) {
                        var currTrends = {
                            trendsId: trends[i].albumId,
                            content: trends[i].content,
                            userId: trends[i].userId,
                            nickName: trends[i].nickName,
                            createDate: trends[i].createDate,
                            likesNum: trends[i].likesNum,
                            commentNum: trends[i].isComment,
                            pics: picsObject[trends[i].albumId],
                            handles: handlesObject[trends[i].albumId]
                        };
                        trendsArray.push(currTrends);
                    }
                    res.json(self.createPageData("00", total, trendsArray));
                });
            });
        });
    },

    mylist : function(req, res, next){
        var self = this;
        var start = parseInt(req.query.iDisplayStart || this.webConfig.iDisplayStart);
        var pageSize = parseInt(req.query.iDisplayLength || this.webConfig.iDisplayLength);
        var userId = parseInt(req.params.userId > 0 ? req.params.userId : req.user.userId);
        var obj = new Object();
        obj.albumType = 3;
        obj.userId = userId;
        self.model['album'].listByPage(obj, start, pageSize, function(err, total, trends) {
            if (err) {
                return next(err);
            }
            if (!trends || trends.length <= 0) {
                return res.json(self.createPageData("00", total, trends));
            }
            var trendsIds = new Array();
            for (var i = 0; i < trends.length; i ++) {
                trendsIds.push(trends[i].albumId);
            }
            self.model['album'].findPics(trendsIds, function (err, pics) {
                if (err) {
                    return next(err);
                }
                var picsObject = new Object();
                if (pics) {
                    for (var i = 0; i < pics.length; i++) {
                        var picArray = picsObject[pics[i].albumId];
                        if (!picArray) {
                            picArray = new Array();
                            picsObject[pics[i].albumId] = picArray;
                        }
                        picArray.push({
                            picId: pics[i].picId,
                            picUrl: pics[i].picUrl
                        });
                    }
                }
                var handleObj = new Object();
                handleObj.handleType = 2;
                self.model['album'].findHandles(trendsIds, handleObj, function (err, handles) {
                    if (err) {
                        return next(err);
                    }
                    var handlesObject = new Object();
                    if (handles) {
                        for (var i = 0; i < handles.length; i++) {
                            var handleArray = handlesObject[handles[i].albumId];
                            if (!handleArray) {
                                handleArray = new Array();
                                handlesObject[handles[i].albumId] = handleArray;
                            }
                            handleArray.push({
                                handleId: handles[i].handleId,
                                content: handles[i].content,
                                nickName: handles[i].nickName,
                                userId: handles[i].hUserId,
                                createDate: handles[i].createDate
                            });
                        }
                    }
                    var trendsArray = new Array();
                    for (var i = 0; i < trends.length; i++) {
                        var currTrends = {
                            trendsId: trends[i].albumId,
                            content: trends[i].content,
                            userId: trends[i].userId,
                            nickName: trends[i].nickName,
                            createDate: trends[i].createDate,
                            likesNum: trends[i].likesNum,
                            commentNum: trends[i].isComment,
                            pics: picsObject[trends[i].albumId],
                            handles: handlesObject[trends[i].albumId]
                        };
                        trendsArray.push(currTrends);
                    }
                    res.json(self.createPageData("00", total, trendsArray));
                });
            });
        });
    },

    top : function(req, res, next){
        var self = this;
        var userId = req.user.userId;
        var trendsId = req.params.trendsId;
        var isTop = req.params.isTop == 1 ? req.params.isTop : 0;
        self.model['album'].findOne(3, userId, trendsId, function(err, trends){
            if(err){
                return next(err);
            }
            if(!trends){
                return next(new Error("动态信息不存在"));
            }
            self.model['album'].top(3, userId, trendsId, isTop, function(err, data){
                if(err){
                    return next(err);
                }
                res.json({
                    code : "00",
                    msg : (isTop == 1 ? "置顶成功" : "下移成功")
                });
            });
        });
    }
});
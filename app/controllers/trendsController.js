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
        var start = req.query.start ? parseInt(req.query.start) : 0;
        var pagesize = req.query.pageSize ? parseInt(req.query.pageSize) : 100;
        self.model['album'].list(3, null, start, pagesize, function(err, trends){
            if(err){
                return next(err);
            }
            if(!trends){
                res.json({
                    code : "00",
                    data : trends
                });
            }
            var trendsArray = new Array();
            for(var i = 0; i < trends.length; i ++){
                var currTrends = {
                    trendsId : trends[i].albumId,
                    content : trends[i].content,
                    userId : trends[i].userId,
                    nickName : trends[i].nickName,
                    createDate : trends[i].createDate,
                    likesNum : trends[i].likesNum,
                    commentNum : trends[i].isComment
                };
                self.model["album"].findPic(currTrends.trendsId, function(err, pics){
                    if(err){
                        return next(err);
                    }
                    currTrends.picPaths = new Array();
                    if(pics){
                        for(var j = 0; j < pics.length; j ++){
                            currTrends.picPaths.push({
                                picId : pics[j].picId,
                                picPath : pics[j].picUrl
                            });
                        }
                    }
                    self.model["album"].findHandle(currTrends.trendsId, 2, null, function(err, handles){
                        if(err){
                            return next(err);
                        }
                        currTrends.comments = new Array();
                        if(handles){
                            for(var g = 0; g < handles.length; g ++){
                                currTrends.comments.push({
                                    commentId : handles[g].handleId,
                                    contend : handles[g].content,
                                    nickName : handles[g].nickName
                                });
                            }
                        }
                        trendsArray.push(currTrends);
                        console.log(i);
                        if(i == trends.length - 1){
                            res.json({
                                code : "00",
                                data : trendsArray
                            });
                        }
                    });
                });

            }
        });
    },

    show : function(req, res, next){
        var self = this;
        var start = req.query.start ? parseInt(req.query.start) : 0;
        var pagesize = req.query.pageSize ? parseInt(req.query.pageSize) : 100;
        var userId = req.params.userId ? parseInt(req.params.userId) : req.user.userId;
        self.model['album'].list(3, userId, start, pagesize, function(err, trends){
            if(err){
                return next(err);
            }
            res.json({
                code : "00",
                data : trends
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
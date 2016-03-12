var basicController = require("../../core/utils/controller/basicController");
var formidable = require("formidable");
var fs = require("fs");
var path = require("path");
var images = require("images");

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
            classId = req.user.student.classId;
            schoolId = req.user.student.schoolId;
            studentId = req.user.student.studentId;
            studentName = req.user.student.studentName;
            nickName = studentName + nickName;
        } else if (groupId == 20) {
            classId = req.user.class.classId;
            schoolId = req.user.class.schoolId;
        } else if (groupId == 30 || groupId == 40 || groupId == 50) {
            schoolId = req.user.schools[0].schoolId;
        }
        var schoolName = req.user.schools[0].schoolName;
        var userName = req.user.userName;
        var custName = req.user.custName;
        form.parse(req, function (err, fields, files) {
            var content = fields.content;
            if(!content){
                return next(new Error("动态内容不能为空"));
            }
            var isTop = fields.isTop || 0;
            var albumArg = [schoolId, schoolName, classId, 3, '动态信息', content, new Date(), isTop, userName, custName, nickName, studentId, studentName, 0, 0, 1, userId, userId];
            var albumPicArgs = new Array();
            for (var photos in files) {
                var width = images(files[photos].path).width();
                var height = images(files[photos].path).height();
                albumPicArgs.push([path.normalize(files[photos].path).replace(/\\/g, '/'), 0, width, height, null, 1, userId, userId]);
            }
            self.model['album'].create(albumArg, albumPicArgs, function (err, trends) {
                if (err) {
                    return next(err);
                }
                self.model['album'].findOneTrends(trends.insertId, function(err, trends) {
                    if (err) {
                        return next(err);
                    }
                    trends[0].likesNum=trends[0].likes.length;
                    trends[0].commentNum=trends[0].comments.length;
                    res.json({
                        code: "00",
                        msg: "动态发布成功",
                        data : trends[0]
                    });
                });

            });
        });
    },

    uppic : function(req, res, next){
        var self = this;
        var trendsId = req.params.trendsId;
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

        form.parse(req, function (err, fields, files) {
            var albumPicArgs = new Array();
            for (var photos in files) {
                var width = images(files[photos].path).width();
                var height = images(files[photos].path).height();
                albumPicArgs.push([path.normalize(files[photos].path).replace(/\\/g, '/'), 0, width, height, null, 1, userId, userId, trendsId]);
            }
            if(albumPicArgs.length <= 0){
                return next(new Error("上传图片信息不能为空"));
            }
            self.model['album'].saveAlbumPic(albumPicArgs, function(err, pic){
                if(err){
                    return next(err);
                }
                self.model['album'].findOneTrends(trendsId, function(err, trends) {
                    if (err) {
                        return next(err);
                    }
                    trends[0].likesNum=trends[0].likes.length;
                    trends[0].commentNum=trends[0].comments.length;
                    res.json({
                        code : "00",
                        msg : "上传图片成功",
                        data : trends[0]
                    });
                });
            });
        });
    },

    delete: function (req, res, next) {
        var self = this;
        var userId = req.user.userId;
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

    unlike : function(req, res, next){
        var self = this;
        var userId = req.user.userId;
        var trendsId = parseInt(req.params.trendsId);
        self.model['album'].cancelAlbumLike(trendsId, userId, function(err, data){
            if(err){
                return next(err);
            }
            //去掉当前用户未点赞逻辑
            /*
            else if(!data || data.affectedRows != 1){
                return next(new Error("当前用户未点赞"));
            }
            */
            res.json({
                code: "00",
                msg: "取消点赞成功"
            });
        });
    },

    like: function (req, res, next) {
        var self = this;
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
                    msg: "点赞成功",
                    data: data.insertId
                });
            });
        });
    },

    comment: function (req, res, next) {
        var self = this;
        var userId = req.user.userId;
        var trendsId = req.params.trendsId;
        var pHandleId = req.body.pHandleId ? parseInt(req.body.pHandleId) : 0;
        var content = req.body.content;
        var groupId = req.user.groupId;
        var studentId = 0;
        var studentName = '';
        var nickName = req.user.nickName;
        if (groupId == 10) {
            studentId = req.user.student.studentId;
            studentName = req.user.student.studentName;
            nickName = studentName + nickName;
        }
        var handleArgs = [trendsId, pHandleId, content, userId, nickName, studentId, studentName, userId];
        self.model['album'].createAlbumComment(trendsId, handleArgs, function (err, data) {
            if (err) {
                return next(err);
            }
            res.json({
                code: "00",
                msg: "评论成功",
                data: data.insertId
            });
        });
    },

    delComment : function(req, res, next){
        var self = this;
        var commentId = req.params.commentId;
        if(!commentId || commentId < 0){
            return next(new Error("评论编号不能为空"));
        }
    },

    applist : function(req, res, next){
        var self = this;
        var trendsId = parseInt(req.params.trendsId);
        var pageSize = parseInt(req.query.iDisplayLength || this.webConfig.iDisplayLength);
        var schoolIds = req.query.schoolId ? [parseInt(req.query.schoolId)] : req.user.schoolIds;
        var photoLength = parseInt(req.query.iDisplayPhotoLength || this.webConfig.iDisplayPhotoLength);
        var commentLength = parseInt(req.query.iDisplayCommentLength || this.webConfig.iDisplayCommentLength);
        var obj = new Object();
        obj.albumType = 3;
        self.model['album'].listByTrendsId(obj, schoolIds, trendsId, pageSize, function(err, trends){
            if(err){
                return next(err);
            }
            if (!trends || trends.length <= 0) {
                return res.json({
                    code : "00",
                    data : []
                });
            }
            self.createList(res, next, -1, trends, photoLength, commentLength);
        });
    },

    list : function(req, res, next){
        var self = this;
        var start = parseInt(req.query.iDisplayStart || this.webConfig.iDisplayStart);
        var pageSize = parseInt(req.query.iDisplayLength || this.webConfig.iDisplayLength);
        var photoLength = parseInt(req.query.iDisplayPhotoLength || this.webConfig.iDisplayPhotoLength);
        var commentLength = parseInt(req.query.iDisplayCommentLength || this.webConfig.iDisplayCommentLength);
        var schoolIds = req.query.schoolId ? [parseInt(req.query.schoolId)] : req.user.schoolIds;
        var qryObj = new Object();
        qryObj.albumType = 3;
        var userName = req.query.userName;
        if(userName){
            qryObj.userName = userName;
        }
        var custName = req.query.custName;
        if(custName){
            qryObj.custName = custName + "%";
        }
        var content = req.query.content;
        if(content){
            qryObj.content = "%" + content + "%";
        }
        var startDate = req.query.startDate;
        var endDate = req.query.endDate;
        self.model['album'].listByPage(qryObj, schoolIds, startDate, endDate, start, pageSize, function(err, total, trends) {
            if (err) {
                return next(err);
            }
            if (!trends || trends.length <= 0) {
                return res.json(self.createPageData("00", total, trends));
            }
            self.createList(res, next, total, trends, photoLength, commentLength);
        });
    },

    show : function(req, res, next){
        var self = this;

        var trendsId = parseInt(req.params.trendsId);

        self.model['album'].findOneTrends(trendsId, function(err, trends) {
            if (err) {
                return next(err);
            }
            trends[0].commentNum = trends[0].isComment;
            res.json({
                code: "00",
                data: trends[0]
            });
        });
    },

    moreComment : function(req, res, next){
        var self = this;
        var start = parseInt(req.query.iDisplayStart || this.webConfig.iDisplayStart);
        var pageSize = parseInt(req.query.iDisplayLength || this.webConfig.iDisplayLength);
        var trendsId = req.params.trendsId;
        if(!trendsId || trendsId < 0){
            return next(new Error("动态编号不能为空"));
        }
        self.model['album'].moreHandles(trendsId, 2, start, pageSize, function(err, comments){
            if(err){
                return next(err);
            }
            var commentArray = new Array();
            if(comments){
                for(var i = 0; i < comments.length; i ++){
                    commentArray.push({
                        handleId: comments[i].handleId,
                        pHandleId:comments[i].pHandleId,
                        content: comments[i].content,
                        nickName: comments[i].nickName,
                        userId: comments[i].hUserId,
                        createDate: comments[i].createDate
                    });
                }
            }
            res.json({
                code : "00",
                data : commentArray
            });
        });
    },

    morePic : function(req, res, next){
        var self = this;
        var start = parseInt(req.query.iDisplayStart || this.webConfig.iDisplayStart);
        var pageSize = parseInt(req.query.iDisplayLength || this.webConfig.iDisplayLength);
        var trendsId = req.params.trendsId;
        self.model['album'].morePics(trendsId, start, pageSize, function(err, pics){
            if(err){
                return next(err);
            }
            var picArray = new Array();
            if(pics){
                for(var i = 0; i < pics.length; i ++){
                    picArray.push({
                        picId: pics[i].picId,
                        picUrl: pics[i].picUrl,
                        width : pics[i].width,
                        height : pics[i].height,
                        createDate : pics[i].createDate
                    });
                }
            }
            res.json({
                code : "00",
                data : picArray
            });
        });
    },

    appmylist : function(req, res, next){
        var self = this;
        var userId = req.params.userId > 0 ? parseInt(req.params.userId) : req.user.userId;
        var trendsId = parseInt(req.params.trendsId);
        var pageSize = parseInt(req.query.iDisplayLength || this.webConfig.iDisplayLength);
        var photoLength = parseInt(req.query.iDisplayPhotoLength || this.webConfig.iDisplayPhotoLength);
        var commentLength = parseInt(req.query.iDisplayCommentLength || this.webConfig.iDisplayCommentLength);
        var obj = new Object();
        obj.albumType = 3;
        obj.userId = userId;
        self.model['album'].listByTrendsId(obj, null, trendsId, pageSize, function(err, trends){
            if(err){
                return next(err);
            }
            if (!trends || trends.length <= 0) {
                return res.json({
                    code : "00",
                    data : []
                });
            }
            self.createList(res, next, -1, trends, photoLength, commentLength);
        });
    },

    mylist : function(req, res, next){
        var self = this;
        var start = parseInt(req.query.iDisplayStart || this.webConfig.iDisplayStart);
        var pageSize = parseInt(req.query.iDisplayLength || this.webConfig.iDisplayLength);
        var userId = req.params.userId > 0 ? parseInt(req.params.userId) : req.user.userId;
        var photoLength = parseInt(req.query.iDisplayPhotoLength || this.webConfig.iDisplayPhotoLength);
        var commentLength = parseInt(req.query.iDisplayCommentLength || this.webConfig.iDisplayCommentLength);
        var obj = new Object();
        obj.albumType = 3;
        obj.userId = userId;
        self.model['album'].listByPage(obj, null, null, null, start, pageSize, function(err, total, trends) {
            if (err) {
                return next(err);
            }
            if (!trends || trends.length <= 0) {
                return res.json(self.createPageData("00", total, trends));
            }
            self.createList(res, next, total, trends, photoLength, commentLength);
        });
    },

    createList : function(res, next, total, trends, photoLength, commentLength){
        var self = this;
        var trendsIds = new Array();
        var userObj = new Object();
        for (var i = 0; i < trends.length; i ++) {
            trendsIds.push(trends[i].albumId);
            userObj[trends[i].userId] = trends[i].userId;
        }
        self.model['album'].findPicsByOver(trendsIds, photoLength, function (err, pics) {
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
                        picUrl: pics[i].picUrl,
                        width : pics[i].width,
                        height : pics[i].height,
                        createDate : pics[i].createDate
                    });
                }
            }
            var likeObj = new Object();
            likeObj.handleType = 1;
            self.model['album'].findHandles(trendsIds, likeObj, function (err, likes) {
                if (err) {
                    return next(err);
                }
                if (likes) {
                    for(var i = 0; i < likes.length; i ++){
                        userObj[likes[i].hUserId] = likes[i].hUserId;
                    }
                }
                var commentObj = new Object();
                commentObj.handleType = 2;
                self.model['album'].findHandlesByOver(trendsIds, commentObj, commentLength, function (err, comments) {
                    if(err){
                        return next(err);
                    }
                    if(comments){
                        for(var i = 0; i < comments.length; i ++){
                            userObj[comments[i].hUserId] = comments[i].hUserId;
                        }
                    }
                    self.model['user'].listByUserIds(userObj, function(err, users){
                        if(err){
                            return next(err);
                        }
                        if(users){
                            for(var i = 0; i < users.length; i ++){
                                userObj[users[i].userId] = users[i];
                            }
                        }
                        var likesObject = new Object();
                        if (likes) {
                            for (var i = 0; i < likes.length; i++) {
                                var likeArray = likesObject[likes[i].albumId];
                                if (!likeArray) {
                                    likeArray = new Array();
                                    likesObject[likes[i].albumId] = likeArray;
                                }
                                likeArray.push({
                                    likeId: likes[i].handleId,
                                    nickName: likes[i].nickName,
                                    userId: likes[i].hUserId,
                                    userUrl: userObj[likes[i].hUserId].userUrl,
                                    createDate: likes[i].createDate
                                });
                            }
                        }
                        var trendsObject = new Object();
                        for (var i = 0; i < trends.length; i++) {
                            trendsObject[trends[i].albumId] = trends[i];
                        }
                        var commentsObject = new Object();
                        var tempCommentObject = new Object();
                        if(comments){
                            for(var i = 0; i < comments.length; i ++){
                                var commentArray = commentsObject[comments[i].albumId];
                                if (!commentArray) {
                                    commentArray = new Array();
                                    commentsObject[comments[i].albumId] = commentArray;
                                }
                                var comment = {
                                    trendsId: comments[i].albumId,
                                    handleId: comments[i].handleId,
                                    pHandleId:comments[i].pHandleId,
                                    content: comments[i].content,
                                    nickName: comments[i].nickName,
                                    userId: comments[i].hUserId,
                                    userUrl: userObj[comments[i].hUserId].userUrl,
                                    createDate: comments[i].createDate
                                }
                                tempCommentObject[comments[i].handleId] = comment;
                                if(comments[i].pHandleId == 0){
                                    comment.cUserId = trendsObject[comment.trendsId].userId;
                                    comment.cNickName = trendsObject[comment.trendsId].nickName;
                                    comment.cUserUrl = userObj[comment.cUserId].userUrl;
                                }else{
                                    comment.cUserId = tempCommentObject[comment.pHandleId].userId;
                                    comment.cNickName = tempCommentObject[comment.pHandleId].nickName;
                                    comment.cUserUrl = tempCommentObject[comment.pHandleId].userUrl;
                                }
                                commentArray.push(comment);
                            }
                        }
                        var trendsArray = new Array();
                        for (var i = 0; i < trends.length; i++) {
                            var currTrends = {
                                trendsId: trends[i].albumId,
                                content: trends[i].content,
                                userId: trends[i].userId,
                                userUrl : userObj[trends[i].userId].userUrl,
                                nickName: trends[i].nickName,
                                userName: trends[i].userName,
                                custName: trends[i].custName,
                                schoolName: trends[i].schoolName,
                                createDate: trends[i].createDate,
                                likesNum: trends[i].likesNum,
                                commentNum: trends[i].isComment,
                                pics: picsObject[trends[i].albumId] ? picsObject[trends[i].albumId] : new Array(),
                                comments: commentsObject[trends[i].albumId] ? commentsObject[trends[i].albumId] : new Array(),
                                likes : likesObject[trends[i].albumId] ? likesObject[trends[i].albumId] : new Array()
                            };
                            trendsArray.push(currTrends);
                        }
                        if(total <= -1){
                            res.json({
                                code : "00",
                                data : trendsArray
                            });
                        }else{
                            res.json(self.createPageData("00", total, trendsArray));
                        }
                    });
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
                self.model['album'].findOneTrends(trendsId, function(err, trends) {
                    if (err) {
                        return next(err);
                    }
                    trends[0].likesNum=trends[0].likes.length;
                    trends[0].commentNum=trends[0].comments.length;
                    res.json({
                        code : "00",
                        msg : (isTop == 1 ? "置顶成功" : "下移成功"),
                        data : trends[0]
                    });
                });
            });
        });
    }
});
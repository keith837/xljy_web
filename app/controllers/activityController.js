/**
 * Created by Jerry on 2016/4/12.
 */

var basicController = require("../../core/utils/controller/basicController");
var formidable = require("formidable");
var fs = require("fs");
var path = require("path");
var images = require("images");

module.exports = new basicController(__filename).init({

    publish: function (req, res, next) {
        var self = this;
        var userId = req.user.userId;
        var groupId = req.user.groupId;
        var nickName = req.user.nickName;
        if (!(groupId == 30 || groupId == 40)) {
            return next(self.Error("用户组[" + groupId + "]没有权限发布精彩活动."));
        }

        //1:班级相册;2:成长点滴;3:精彩活动
        var albumType = 3;

        var schoolId = req.user.schools[0].schoolId;
        var schoolName = req.user.schools[0].schoolName;
        var userName = req.user.custName;

        var uploadDir = self.cacheManager.getCacheValue("FILE_DIR", "PHOTOS");
        uploadDir += "school" + schoolId + "/";
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
            var albumPics = new Array();
            for (var photos in files) {
                var width = images(files[photos].path).width();
                var height = images(files[photos].path).height();
                albumPics.push([path.normalize(files[photos].path).replace(/\\/g, '/'), userId, width, height]);
            }
            if (albumPics.length === 0) {
                return next(self.Error("没有上传照片."));
            }
            var albumParam = [albumType, albumTitle, content, schoolId, 0, userId, nickName, 0, null, schoolName, null, userName, albumPics.length];
            self.model['activity'].publish(albumParam, albumPics, function (err, activityId) {
                if (err) {
                    return next(err);
                }
                self.model['activity'].findActivityOne(activityId, function (err, data) {
                    if (err) {
                        return next(err);
                    }
                    res.json({code: "00", msg: "精彩活动发布成功", data: data[0]});
                });

            });
        });
    },

    publishPost: function (req, res, next) {
        var self = this;
        var userId = req.user.userId;
        var groupId = req.user.groupId;
        var nickName = req.user.nickName;

        var activityId = parseInt(req.params.activityId);
        if (!activityId || isNaN(activityId)) {
            return next(this.Error("没有输入活动ID."));
        }
        //1:班级相册;2:成长点滴;3:精彩瞬间
        var albumType = 3;

        var studentId = 0;
        var studentName = null;
        var schoolId = req.user.schools[0].schoolId;
        var schoolName = req.user.schools[0].schoolName;
        var classId = 0;
        var className = null;
        var userName = req.user.custName;
        if (groupId === 10) {
            studentId = req.user.student.studentId;
            studentName = req.user.student.studentName;
            nickName = studentName + nickName;
            classId = req.user.class.classId;
            className = req.user.class.className;
        } else if (groupId === 20) {
            classId = req.user.class.classId;
            className = req.user.class.className;
        }

        var uploadDir = self.cacheManager.getCacheValue("FILE_DIR", "PHOTOS");
        uploadDir += "school" + schoolId + "/";
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
            var albumPics = new Array();
            for (var photos in files) {
                var width = images(files[photos].path).width();
                var height = images(files[photos].path).height();
                albumPics.push([path.normalize(files[photos].path).replace(/\\/g, '/'), userId, width, height]);
            }
            if (albumPics.length === 0) {
                return next(self.Error("没有上传照片."));
            }
            var albumParam = [albumType, albumTitle, content, schoolId, classId, userId, nickName, studentId, studentName, schoolName, className, userName, albumPics.length];
            self.model['activity'].publishPost(activityId, albumParam, albumPics, function (err, albumId) {
                if (err) {
                    return next(err);
                }
                self.model['activity'].findOne(albumId, function (err, data) {
                    if (err) {
                        return next(err);
                    }
                    res.json({code: "00", msg: "帖子发布成功", data: data[0]});
                });

            });
        });
    },

    delete: function (req, res, next) {
        var self = this;
        var userId = req.user.userId;
        var activityId = parseInt(req.params.id);
        this.model['activity'].delete(activityId, userId, function (err, data) {
            if (err) {
                return next(err);
            } else if (data.affectedRows !== 1) {
                return next(self.Error("删除精彩活动失败."));
            }
            res.json({code: "00", msg: "精彩活动删除成功"});
        });
    },

    deletePost: function (req, res, next) {
        var self = this;
        var userId = req.user.userId;
        var activityId = parseInt(req.params.activityId);
        var albumId = parseInt(req.params.albumId);
        this.model['activity'].deletePost(activityId, albumId, userId, function (err, data) {
            if (err) {
                return next(err);
            } else if (data.affectedRows !== 1) {
                return next(self.Error("删除帖子失败."));
            }
            res.json({code: "00", msg: "帖子删除成功"});
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

        var albumId = parseInt(req.params.albumId);
        //handleType:1:点赞,2:评论
        this.model['photos'].findHandle(albumId, 1, userId, function (err, data) {
            if (err) {
                return next(err);
            }
            if (data && data.length > 0) {
                return next(self.Error("用户已点赞"));
            }
            self.model['activity'].addAlbumLike(albumId, userId, nickName, studentId, studentName, function (err, data) {
                if (err) {
                    return next(err);
                }
                res.json({code: "00", msg: "点赞成功", data: data.insertId});
            });
        });
    },

    unlike: function (req, res, next) {
        var self = this;

        var userId = req.user.userId;
        var albumId = parseInt(req.params.albumId);
        //handleType:1:点赞,2:评论
        this.model['photos'].findHandle(albumId, 1, userId, function (err, data) {
            if (err) {
                return next(err);
            }
            if (!data || data.length != 1) {
                return next(self.Error("用户没有点赞，无法取消"));
            }
            self.model['activity'].unLike(albumId, userId, data[0].handleId, function (err, data) {
                if (err) {
                    return next(err);
                }
                res.json({code: "00", msg: "取消点赞成功"});
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
        var albumId = parseInt(req.params.albumId);
        var content = req.body.content;
        var parentHandleId = req.body.parentHandleId;
        if (!parentHandleId || isNaN(parentHandleId)) {
            parentHandleId = null;
        }
        //handleType:1:点赞,2:评论
        this.model['activity'].addAlbumComment(albumId, userId, nickName, parentHandleId, content, studentId, studentName, function (err, data) {
                if (err) {
                    return next(err);
                }
                res.json({code: "00", msg: "帖子评论成功", data: data.insertId});
            }
        );
    },

    delComment: function (req, res, next) {
        var self = this;
        var commentId = req.params.commentId;
        var activityId = req.params.activityId;
        if (!commentId || commentId < 0) {
            return next(new Error("评论编号不能为空"));
        }
        if (!activityId || activityId < 0) {
            return next(new Error("活动ID不能为空"));
        }
        self.model['activity'].deleteComment(activityId, commentId, function (err, data) {
            if (err) {
                return next(err);
            }
            res.json({code: "00", msg: "评论删除成功"});
        });
    },


    list: function (req, res, next) {
        var self = this;
        var start = parseInt(req.query.iDisplayStart || this.webConfig.iDisplayStart);
        var pageSize = parseInt(req.query.iDisplayLength || this.webConfig.iDisplayLength);

        var photoLength = parseInt(req.query.iDisplayPhotoLength || this.webConfig.iDisplayPhotoLength);
        var commentLength = parseInt(req.query.iDisplayCommentLength || this.webConfig.iDisplayCommentLength);
        var userId = req.user.userId;
        var groupId = req.user.groupId;

        var activityId = 0;
        var queryActivityId = req.query.activityId;
        if (queryActivityId && !isNaN(parseInt(queryActivityId))) {
            activityId = parseInt(queryActivityId);
        }

        var queryCondition = [];
        if (groupId === 10 || groupId === 20) {
            queryCondition.push({"key": "schoolId", "opr": "=", "val": req.user.schools[0].schoolId});
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

        queryCondition.push({"key": "albumType", "opr": "=", "val": 3});


        var publishDateStart = req.query.startDate;
        if (publishDateStart) {
            queryCondition.push({"key": "createDate", "opr": ">=", "val": publishDateStart});
        }
        var publishDateEnd = req.query.endDate;
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

        var queryUserId = req.query.userId;
        if (queryUserId) {
            queryUserId = parseInt(queryUserId);
            if (!isNaN(queryUserId)) {
                queryCondition.push({"key": "userId", "opr": "=", "val": queryUserId});
            }
        }

        this.model['activity'].queryActivity(start, pageSize, activityId, queryCondition, function (err, totalCount, results) {
            if (err) {
                return next(err);
            }
            if (!results || results.length <= 0) {
                return res.json(self.createPageData("00", totalCount, results));
            }
            self.createAlbumList(res, next, totalCount, results, photoLength, commentLength);
        });
    },

    addPhoto: function (req, res, next) {
        var self = this;
        var userId = req.user.userId;
        var schoolId = req.user.schools[0].schoolId;
        var albumId = parseInt(req.params.albumId);

        var uploadDir = self.cacheManager.getCacheValue("FILE_DIR", "PHOTOS");
        uploadDir += "school" + schoolId + "/";
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir);
        }

        var form = new formidable.IncomingForm();   //创建上传表单
        form.encoding = 'utf-8';		//设置编辑
        form.uploadDir = uploadDir;	 //设置上传目录
        form.keepExtensions = true;	 //保留后缀
        form.maxFieldsSize = 2 * 1024 * 1024;   //文件大小
        form.parse(req, function (err, fields, files) {
            var albumPics = new Array();
            for (var photos in files) {
                var width = images(files[photos].path).width();
                var height = images(files[photos].path).height();
                albumPics.push([path.normalize(files[photos].path).replace(/\\/g, '/'), userId, width, height]);
            }
            if (albumPics.length === 0) {
                return next(self.Error("没有上传照片."));
            }
            self.model['photos'].addPhoto(userId, albumId, albumPics, function (err, data) {
                if (err) {
                    return next(err);
                }
                res.json({code: "00", msg: "添加照片成功", data: data.insertId});
            });
        });
    },

    delPhoto: function (req, res, next) {
        var self = this;
        var userId = req.user.userId;
        var picId = parseInt(req.params.id);
        var albumId = parseInt(req.params.albumId);
        this.model['photos'].delPhoto(albumId, picId, userId, function (err, data) {
            if (err) {
                return next(err);
            }
            res.json({code: "00", msg: "照片删除成功"});
        });
    },

    edit: function (req, res, next) {
        var self = this;
        var userId = req.user.userId;
        var groupId = req.user.groupId;
        var nickName = req.user.nickName;

        var albumId = parseInt(req.params.albumId);

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
        uploadDir += "school" + schoolId + "/";
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
                var width = images(files[photos].path).width();
                var height = images(files[photos].path).height();
                albumPics.push([path.normalize(files[photos].path).replace(/\\/g, '/'), userId, width, height]);
            }
            if (albumPics.length === 0) {
                return next(self.Error("没有上传照片."));
            }
            self.model['photos'].edit(albumParam, albumPics, function (err, data) {
                if (err) {
                    return next(err);
                }
                self.model['photos'].findOne(albumId, function (err, data) {
                    if (err) {
                        return next(err);
                    }
                    res.json({code: "00", msg: "编辑帖子成功", data: data[0]});
                });
            });
        });
    },

    createAlbumList: function (res, next, total, albums, photoLength, commentLength) {
        var self = this;
        var albumIds = new Array();
        var userObj = new Object();
        var log = self.logger;
        for (var i = 0; i < albums.length; i++) {
            albumIds.push(albums[i].albumId);
            userObj[albums[i].userId] = albums[i].userId;
        }
        self.model['photos'].findPicsByOver(albumIds, photoLength, function (err, pics) {
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
                        width: pics[i].width,
                        height: pics[i].height,
                        createDate: pics[i].createDate
                    });
                }
            }
            var likeObj = new Object();
            likeObj.handleType = 1;
            self.model['photos'].findHandles(albumIds, likeObj, function (err, likes) {
                if (err) {
                    return next(err);
                }
                if (likes) {
                    for (var i = 0; i < likes.length; i++) {
                        userObj[likes[i].oUserId] = likes[i].oUserId;
                    }
                }
                var commentObj = new Object();
                commentObj.handleType = 2;
                self.model['photos'].findHandlesByOver(albumIds, commentObj, commentLength, function (err, comments) {
                    if (err) {
                        return next(err);
                    }
                    if (comments) {
                        for (var i = 0; i < comments.length; i++) {
                            userObj[comments[i].oUserId] = comments[i].oUserId;
                        }
                    }
                    self.model['user'].listByUserIds(userObj, function (err, users) {
                        if (err) {
                            return next(err);
                        }

                        try {
                            if (users) {
                                for (var i = 0; i < users.length; i++) {
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
                                        userId: likes[i].oUserId,
                                        userUrl: userObj[likes[i].oUserId].userUrl,
                                        custName: userObj[likes[i].oUserId].custName,
                                        createDate: likes[i].createDate
                                    });
                                }
                            }
                            var ablumsObject = new Object();
                            for (var i = 0; i < albums.length; i++) {
                                ablumsObject[albums[i].albumId] = albums[i];
                            }
                            var commentsObject = new Object();
                            var tempCommentObject = new Object();
                            if (comments) {
                                for (var i = 0; i < comments.length; i++) {
                                    var commentArray = commentsObject[comments[i].albumId];
                                    if (!commentArray) {
                                        commentArray = new Array();
                                        commentsObject[comments[i].albumId] = commentArray;
                                    }
                                    var comment = {
                                        albumId: comments[i].albumId,
                                        handleId: comments[i].handleId,
                                        pHandleId: comments[i].pHandleId,
                                        content: comments[i].content,
                                        nickName: comments[i].nickName,
                                        userId: comments[i].oUserId,
                                        userUrl: userObj[comments[i].oUserId].userUrl,
                                        custName: userObj[comments[i].oUserId].custName,
                                        createDate: comments[i].createDate
                                    }
                                    tempCommentObject[comments[i].handleId] = comment;
                                    if (!comments[i].pHandleId || comments[i].pHandleId == 0) {
                                        comment.cUserId = ablumsObject[comment.albumId].userId;
                                        comment.cNickName = ablumsObject[comment.albumId].nickName;
                                        comment.cCustName = userObj[comment.cUserId].custName;
                                        comment.cUserUrl = userObj[comment.cUserId].userUrl;
                                    } else {
                                        comment.cUserId = tempCommentObject[comment.pHandleId].userId;
                                        comment.cNickName = tempCommentObject[comment.pHandleId].nickName;
                                        comment.cCustName = tempCommentObject[comment.pHandleId].custName;
                                        comment.cUserUrl = tempCommentObject[comment.pHandleId].userUrl;
                                    }
                                    commentArray.push(comment);
                                }
                            }
                            var albumsArray = new Array();
                            for (var i = 0; i < albums.length; i++) {
                                var currTrends = {
                                    activityId: albums[i].activityId,
                                    postsNum: albums[i].postsNum,
                                    albumId: albums[i].albumId,
                                    albumType: albums[i].albumType,
                                    albumTitle: albums[i].albumTitle,
                                    content: albums[i].content,
                                    userId: albums[i].userId,
                                    userUrl: userObj[albums[i].userId].userUrl,
                                    custName: userObj[albums[i].userId].custName,
                                    nickName: albums[i].nickName,
                                    userName: albums[i].userName,
                                    schoolName: albums[i].schoolName,
                                    className: albums[i].className,
                                    createDate: albums[i].createDate,
                                    likesNum: albums[i].likesNum,
                                    commentNum: albums[i].isComment,
                                    photoCount: albums[i].photoCount,
                                    picPaths: picsObject[albums[i].albumId] ? picsObject[albums[i].albumId] : new Array(),
                                    comments: commentsObject[albums[i].albumId] ? commentsObject[albums[i].albumId] : new Array(),
                                    likes: likesObject[albums[i].albumId] ? likesObject[albums[i].albumId] : new Array()
                                };
                                albumsArray.push(currTrends);
                            }
                            if (total <= -1) {
                                res.json({
                                    code: "00",
                                    data: albumsArray
                                });
                            } else {
                                res.json(self.createPageData("00", total, albumsArray));
                            }
                        } catch (e) {
                            log.error(e);
                            return next(self.Error("查询信息出错"));
                        }
                    });
                });
            });
        });
    }
});
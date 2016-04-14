/**
 * Created by Jerry on 2016/4/12.
 */
var Activity = module.exports;
var mysqlUtil = require("../../../core/utils/pool/mysql/mysqlPool");
var async = require("async");


Activity.publish = function (albumParam, albumPics, done) {
    mysqlUtil.getConnection(function (err, conn) {
        if (err) {
            return done.apply(null, [err, null]);
        }

        var tasks = [function (callback) {
            conn.beginTransaction(function (err) {
                callback(err);
            });
        }, function (callback) {
            var sql = "insert into XL_SCHOOL_ACTIVITY(postsNum,state,schoolId,userId,createDate,doneDate,nickName,userName)";
            sql += "values(1,1,?,?,now(),now(),?,?)";
            conn.query(sql, [albumParam[3], albumParam[5], albumParam[6], albumParam[11]], function (err, activity) {
                if (err) {
                    return callback(err);
                }
                callback(err, activity.insertId);
            });
        }, function (activityId, callback) {
            var sql = "insert into XL_CLASS_ALBUM(albumType,albumTitle,content,likesNum,isComment,state,schoolId,classId,userId,createDate,doneDate,nickName,studentId,studentName,schoolName,className,userName,photoCount,activityId,isTop)";
            sql += "values(?,?,?,0,0,1,?,?,?,now(),now(),?,?,?,?,?,?,?,?,1)";
            albumParam.push(activityId);
            conn.query(sql, albumParam, function (err, album) {
                if (err) {
                    return callback(err);
                }
                callback(err, [album.insertId, activityId]);
            });
        }, function (album, callback) {
            var albumPicSQL = "insert into XL_CLASS_ALBUM_PIC(albumId,picUrl,picDesc,state,createDate,doneDate,userId,width,height) values ?";
            var albumPicParam = new Array();
            var now = new Date();
            for (var pic in albumPics) {
                albumPicParam.push([album[0], albumPics[pic][0], null, 1, now, now, albumPics[pic][1], albumPics[pic][2], albumPics[pic][3]]);
            }
            conn.query(albumPicSQL, [albumPicParam], function (err, res) {
                if (err) {
                    return callback(err);
                }
                callback(err, album[1]);
            });
        }, function (activityId, callback) {
            conn.commit(function (err) {
                if (err) {
                    return callback(err);
                }
                callback(err, activityId);
            });
        }];

        async.waterfall(tasks, function (err, results) {
            if (err) {
                conn.rollback();
                conn.release();
                return done(err);
            }
            conn.release();
            done.apply(null, [null, results]);
        });
    });
}

Activity.publishPost = function (activityId, albumParam, albumPics, done) {
    mysqlUtil.getConnection(function (err, conn) {
        if (err) {
            return done.apply(null, [err, null]);
        }

        var tasks = [function (callback) {
            conn.beginTransaction(function (err) {
                callback(err);
            });
        }, function (callback) {
            var sql = "update XL_SCHOOL_ACTIVITY set postsNum=postsNum+1 where activityId=?";
            conn.query(sql, [activityId], function (err, activity) {
                if (err) {
                    return callback(err);
                }
                callback(err, activity);
            });
        }, function (res, callback) {
            var sql = "insert into XL_CLASS_ALBUM(albumType,albumTitle,content,likesNum,isComment,state,schoolId,classId,userId,createDate,doneDate,nickName,studentId,studentName,schoolName,className,userName,photoCount,activityId,isTop)";
            sql += "values(?,?,?,0,0,1,?,?,?,now(),now(),?,?,?,?,?,?,?,?,0)";
            albumParam.push(activityId);
            conn.query(sql, albumParam, function (err, album) {
                if (err) {
                    return callback(err);
                }
                callback(err, [album.insertId, activityId]);
            });
        }, function (album, callback) {
            var albumPicSQL = "insert into XL_CLASS_ALBUM_PIC(albumId,picUrl,picDesc,state,createDate,doneDate,userId,width,height) values ?";
            var albumPicParam = new Array();
            var now = new Date();
            for (var pic in albumPics) {
                albumPicParam.push([album[0], albumPics[pic][0], null, 1, now, now, albumPics[pic][1], albumPics[pic][2], albumPics[pic][3]]);
            }
            conn.query(albumPicSQL, [albumPicParam], function (err, res) {
                if (err) {
                    return callback(err);
                }
                callback(err, album[0]);
            });
        }, function (albumId, callback) {
            conn.commit(function (err) {
                if (err) {
                    return callback(err);
                }
                callback(err, albumId);
            });
        }];

        async.waterfall(tasks, function (err, results) {
            if (err) {
                conn.rollback();
                conn.release();
                return done(err);
            }
            conn.release();
            done.apply(null, [null, results]);
        });
    });
}


Activity.findActivityOne = function (activityId, cb) {
    var tasks = [function (callback) {
        var sql = "select n.*,m.albumId,m.albumTitle,m.content from XL_CLASS_ALBUM m,XL_SCHOOL_ACTIVITY n ";
        sql += "where m.state=1 and n.state=1 and m.activityId=n.activityId ";
        sql += "and n.activityId=?";
        mysqlUtil.query(sql, [activityId], function (err, res) {
            if (err) {
                return callback(err);
            }
            if (res.length != 1) {
                return callback(new Error("找不到精彩活动[" + activityId + "]"));
            } else {
                callback(err, [res[0].albumId, res]);
            }

        });
    }, function (album, callback) {
        mysqlUtil.query("select picId,picUrl,createDate from XL_CLASS_ALBUM_PIC where albumId=? and state=1 order by picId", [album[0]], function (err, res) {
            if (err) {
                return callback(err);
            }
            album[1][0].picPaths = res;
            callback(err, album);
        });
    }, function (album, callback) {
        mysqlUtil.query("select handleId,parentHandleId as pHandleId,content,nickName,oUserId as userId,createDate from XL_CLASS_ALBUM_HANDLE where albumId=? and handleType=2 and state=1 order by handleId ", [album[0]], function (err, res) {
            if (err) {
                return callback(err);
            }
            album[1][0].comments = res;
            callback(err, album);
        });
    }, function (album, callback) {
        mysqlUtil.query("select handleId as likeId,nickName,oUserId as userId,createDate from XL_CLASS_ALBUM_HANDLE where albumId=? and handleType=1 and state=1 order by handleId ", [album[0]], function (err, res) {
            if (err) {
                return callback(err);
            }
            album[1][0].likes = res;
            callback(err, album);
        });
    }];

    async.waterfall(tasks, function (err, results) {
        if (err) {
            return cb(err);
        }
        cb.apply(null, [null, results[1], null]);
    });

}

Activity.findOne = function (albumId, cb) {
    var tasks = [function (callback) {
        var sql = "select * from XL_CLASS_ALBUM m where state=1 ";
        sql = sql + " and albumId=?";
        sql = sql + " order by albumId desc  ";
        mysqlUtil.query(sql, [albumId], function (err, res) {
            if (err) {
                return callback(err);
            }
            if (res.length != 1) {
                return callback(new Error("找不到相册[" + albumId + "]"));
            } else {
                callback(err, [albumId, res]);
            }

        });
    }, function (album, callback) {
        mysqlUtil.query("select picId,picUrl,createDate from XL_CLASS_ALBUM_PIC where albumId=? and state=1 order by picId", [album[0]], function (err, res) {
            if (err) {
                return callback(err);
            }
            album[1][0].picPaths = res;
            callback(err, album);
        });
    }, function (album, callback) {
        mysqlUtil.query("select handleId,parentHandleId as pHandleId,content,nickName,oUserId as userId,createDate from XL_CLASS_ALBUM_HANDLE where albumId=? and handleType=2 and state=1 order by handleId ", [album[0]], function (err, res) {
            if (err) {
                return callback(err);
            }
            album[1][0].comments = res;
            callback(err, album);
        });
    }, function (album, callback) {
        mysqlUtil.query("select handleId as likeId,nickName,oUserId as userId,createDate from XL_CLASS_ALBUM_HANDLE where albumId=? and handleType=1 and state=1 order by handleId ", [album[0]], function (err, res) {
            if (err) {
                return callback(err);
            }
            album[1][0].likes = res;
            callback(err, album);
        });
    }];

    async.waterfall(tasks, function (err, results) {
        if (err) {
            return cb(err);
        }
        cb.apply(null, [null, results[1], null]);
    });

}


Activity.delete = function (activityId, userId, callback) {
    mysqlUtil.query("update XL_SCHOOL_ACTIVITY set state=0,userId=?,doneDate=now() where activityId=?", [userId, activityId], callback);
}

Activity.deletePost = function (activityId, albumId, userId, done) {
    mysqlUtil.query("select * from XL_CLASS_ALBUM where albumId=? and activityId=? and state=1", [albumId, activityId], function (err, album) {
        if (err) {
            return done(err);
        }
        if (album.length != 1) {
            return done(new Error("找不到帖子[" + albumId + "]"));
        }
        if (album[0].isTop == 1) {
            return done(new Error("主题帖子不能被删除."));
        }


        mysqlUtil.getConnection(function (err, conn) {
            if (err) {
                return done.apply(null, [err, null]);
            }

            var tasks = [function (callback) {
                conn.beginTransaction(function (err) {
                    callback(err);
                });
            }, function (callback) {
                var sql = "update XL_SCHOOL_ACTIVITY set postsNum=postsNum-1 where activityId=?";
                conn.query(sql, [activityId], function (err, activity) {
                    if (err) {
                        return callback(err);
                    }
                    callback(err, activity);
                });
            }, function (activity, callback) {
                conn.query("update XL_CLASS_ALBUM set state=0,doneDate=now(),userId=? where albumId=?", [userId, albumId], function (err, album) {
                    if (err) {
                        return callback(err);
                    }
                    callback(err, album);
                });
            }, function (album, callback) {
                conn.commit(function (err) {
                    if (err) {
                        return callback(err);
                    }
                    callback(err, album);
                });
            }];

            async.waterfall(tasks, function (err, results) {
                if (err) {
                    conn.rollback();
                    conn.release();
                    return done(err);
                }
                conn.release();
                done.apply(null, [null, results]);
            });
        });

    });
}


Activity.addAlbumLike = function (albumId, userId, nickName, studentId, studentName, cb) {
    mysqlUtil.getConnection(function (err, conn) {
        if (err) {
            return cb.apply(null, [err, null]);
        }

        var tasks = [function (callback) {
            conn.beginTransaction(function (err) {
                callback(err);
            });
        }, function (callback) {
            conn.query("select * from XL_CLASS_ALBUM where albumId=? and state=1", albumId, function (err, data) {
                if (err) {
                    return callback(err);
                }
                if (data.length !== 1) {
                    return callback(new Error("找不到帖子[" + albumId + "]"));
                } else {
                    if (data[0].activityId == 0) {
                        return callback(new Error("根据帖子[" + albumId + "]找不到活动ID"));
                    }
                    callback(err, data[0].activityId);
                }
            });
        }, function (activityId, callback) {
            var updateSql = "update XL_SCHOOL_ACTIVITY set likesNum=likesNum + 1,doneDate=now() where activityId=?";
            conn.query(updateSql, activityId, function (err, upd) {
                callback(err, upd);
            });
        }, function (upd, callback) {
            var updateSql = "update XL_CLASS_ALBUM set likesNum=likesNum + 1,doneDate=now() where albumId=?";
            conn.query(updateSql, albumId, function (err, upd) {
                callback(err, upd);
            });
        }, function (res, callback) {
            var likeSQL = "insert into XL_CLASS_ALBUM_HANDLE(albumId,handleType,nickName,state,createDate,doneDate,oUserId,studentId,studentName)";
            likeSQL += "values(?,1,?,1,now(),now(),?,?,?)";
            conn.query(likeSQL, [albumId, nickName, userId, studentId, studentName], function (err, res) {
                callback(err, res);
            });
        }, function (res, callback) {
            conn.commit(function (err) {
                if (err) {
                    return callback(err);
                }
                callback(null, res);
            });
        }];

        async.waterfall(tasks, function (err, results) {
            if (err) {
                conn.rollback();
                conn.release();
                return cb(err);
            }
            conn.release();
            cb.apply(null, [null, results]);
        });
    });
}


Activity.unLike = function (albumId, userId, handleId, cb) {
    mysqlUtil.getConnection(function (err, conn) {
        if (err) {
            return cb.apply(null, [err, null]);
        }

        var tasks = [function (callback) {
            conn.beginTransaction(function (err) {
                callback(err);
            });
        }, function (callback) {
            conn.query("select * from XL_CLASS_ALBUM where albumId=? and state=1", albumId, function (err, data) {
                if (err) {
                    return callback(err);
                }
                if (data.length !== 1) {
                    return callback(new Error("找不到帖子[" + albumId + "]"));
                } else {
                    if (data[0].activityId == 0) {
                        return callback(new Error("根据帖子[" + albumId + "]找不到活动ID"));
                    }
                    callback(err, data[0].activityId);
                }
            });
        }, function (activityId, callback) {
            var updateSql = "update XL_SCHOOL_ACTIVITY set likesNum=likesNum - 1,doneDate=now() where activityId=?";
            conn.query(updateSql, activityId, function (err, upd) {
                callback(err, upd);
            });
        }, function (query, callback) {
            var updateSql = "update XL_CLASS_ALBUM set likesNum=likesNum - 1,doneDate=now() where albumId=?";
            conn.query(updateSql, albumId, function (err, upd) {
                callback(err, upd);
            });
        }, function (res, callback) {
            var likeSQL = "delete from XL_CLASS_ALBUM_HANDLE where handleId=? and oUserId=?";
            conn.query(likeSQL, [handleId, userId], function (err, res) {
                callback(err, res);
            });
        }, function (res, callback) {
            conn.commit(function (err) {
                callback(err);
            });
        }];

        async.waterfall(tasks, function (err, results) {
            if (err) {
                conn.rollback();
                conn.release();
                return cb(err);
            }
            conn.release();
            cb.apply(null, [null, results]);
        });
    });
}

Activity.addAlbumComment = function (albumId, userId, nickName, parentHandleId, content, studentId, studentName, callback) {
    mysqlUtil.getConnection(function (err, conn) {
        if (err) {
            return callback.apply(null, [err, null]);
        }

        var tasks = [function (callback) {
            conn.beginTransaction(function (err) {
                callback(err);
            });
        }, function (callback) {
            conn.query("select * from XL_CLASS_ALBUM where albumId=? and state=1", albumId, function (err, data) {
                if (err) {
                    return callback(err);
                }
                if (data.length !== 1) {
                    return callback(new Error("找不到帖子[" + albumId + "]"));
                } else {
                    if (data[0].activityId == 0) {
                        return callback(new Error("根据帖子[" + albumId + "]找不到活动ID"));
                    }
                    callback(err, data[0].activityId);
                }
            });
        }, function (activityId, callback) {
            var updateSql = "update XL_SCHOOL_ACTIVITY set commentsNum=commentsNum + 1,doneDate=now() where activityId=?";
            conn.query(updateSql, activityId, function (err, upd) {
                callback(err, upd);
            });
        }, function (query, callback) {
            var updateSql = "update XL_CLASS_ALBUM set isComment=isComment + 1,doneDate=now() where albumId=?";
            conn.query(updateSql, albumId, function (err, upd) {
                callback(err, upd);
            });
        }, function (res, callback) {
            var likeSQL = "insert into XL_CLASS_ALBUM_HANDLE(albumId,handleType,parentHandleId,content,nickName,state,createDate,doneDate,oUserId,studentId,studentName)";
            likeSQL += "values(?,2,?,?,?,1,now(),now(),?,?,?)";
            conn.query(likeSQL, [albumId, parentHandleId, content, nickName, userId, studentId, studentName], function (err, res) {
                callback(err, res);
            });
        }, function (res, callback) {
            conn.commit(function (err) {
                if (err) {
                    return callback(err);
                }
                callback(null, res);
            });
        }];

        async.waterfall(tasks, function (err, results) {
            if (err) {
                conn.rollback();
                conn.release();
                return callback(err);
            }
            conn.release();
            callback.apply(null, [null, results]);
        });
    });
}


Activity.deleteComment = function (activityId, commentId, done) {
    mysqlUtil.getConnection(function (err, conn) {
        if (err) {
            return done.apply(null, [err, null]);
        }

        var tasks = [function (callback) {
            conn.beginTransaction(function (err) {
                callback(err);
            });
        }, function (callback) {
            conn.query("select handleId,albumId from XL_CLASS_ALBUM_HANDLE where FIND_IN_SET(handleId, getPhotoCommentLst(?))", [commentId], function (err, handles) {
                if (err) {
                    return callback(err);
                }
                if (!handles || handles.length <= 0) {
                    return callback(new Error("根据评论Id[" + commentId + "]无法查询到评论信息"));
                } else {
                    callback(err, handles);
                }
            });
        }, function (handles, callback) {
            var updateSql = "delete from XL_CLASS_ALBUM_HANDLE where state=1 and handleId in (";
            var handleIds = [];
            for (var i in handles) {
                updateSql += "?,";
                handleIds.push(handles[i].handleId);
            }
            updateSql += "-1)";
            conn.query(updateSql, handleIds, function (err, upd) {
                if (err) {
                    return callback(err);
                }
                callback(err, [upd.affectedRows, handles[0].albumId]);
            });
        }, function (upd, callback) {
            var countSQL = "update XL_CLASS_ALBUM set isComment=isComment-?,doneDate=now() where albumId=?";
            conn.query(countSQL, upd, function (err, res) {
                if (res.affectedRows !== 1) {
                    return callback(new Error("没有找到帖子[" + upd[1] + "]"));
                }
                callback(err, upd[0]);
            });
        }, function (comments, callback) {
            var countSQL = "update XL_SCHOOL_ACTIVITY set commentsNum=commentsNum-?,doneDate=now() where activityId=?";
            conn.query(countSQL, [comments, activityId], function (err, res) {
                if (res.affectedRows !== 1) {
                    return callback(new Error("没有找到精彩活动[" + activityId + "]"));
                }
                callback(err, res);
            });
        }, function (res, callback) {
            conn.commit(function (err) {
                callback(err);
            });
        }];

        async.waterfall(tasks, function (err, results) {
            if (err) {
                conn.rollback();
                conn.release();
                return done(err);
            }
            conn.release();
            done.apply(null, [null, results]);
        });
    });
}


Activity.queryActivity = function (start, pageSize, activityId, queryCondition, callback) {
    var sql = "select * from XL_CLASS_ALBUM m where state=1 ";
    if (activityId > 0) {
        queryCondition.push({"key": "activityId", "opr": "=", "val": activityId});
    } else {
        sql = "select n.*,n.commentsNum as isComment,m.photoCount,";
        sql += "m.albumId,m.albumTitle,m.content from XL_CLASS_ALBUM m,XL_SCHOOL_ACTIVITY n ";
        sql += "where m.state=1 and n.state=1 and m.activityId=n.activityId and m.isTop=1 ";
    }
    var params = [];
    var sqlCondition = "";
    if (queryCondition || queryCondition.length > 0) {
        for (var i in queryCondition) {
            var opr = queryCondition[i].opr;
            if (opr == "like") {
                sqlCondition += "and m." + queryCondition[i].key + " " + opr + " ? ";
                params.push("%" + queryCondition[i].val + "%");
            } else if (opr == "in") {
                var ids = queryCondition[i].val;
                var appenderId = "";
                for (var k in ids) {
                    appenderId += "?,";
                    params.push(ids[k]);
                }
                appenderId = appenderId.substr(0, appenderId.length - 1);
                sqlCondition += "and m." + queryCondition[i].key + " " + opr + " (" + appenderId + ") ";
            } else {
                sqlCondition += "and m." + queryCondition[i].key + " " + opr + " ? ";
                params.push(queryCondition[i].val);
            }
        }
    }
    sql = sql + sqlCondition;

    var countSQL = "select count(*) as total from (" + sql + ") m";
    if (activityId > 0) {
        sql = "select * from (" + sql + " order by albumId) m limit ?,?";
    } else {
        sql = "select * from (" + sql + " order by albumId desc) m limit ?,?";
    }
    mysqlUtil.queryOne(countSQL, params, function (err, res) {
        if (err) {
            return callback(err);
        }
        var totalNum = res.total;
        if (totalNum === 0) {
            return callback(err, 0, []);
        }
        params.push(start);
        params.push(pageSize);
        mysqlUtil.query(sql, params, function (err, res) {
            if (err) {
                return callback(err);
            }
            callback(err, totalNum, res);
        });
    });
}
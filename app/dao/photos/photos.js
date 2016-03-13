/**
 * Created by Jerry on 2/14/2016.
 */
var Photos = module.exports;
var mysqlUtil = require("../../../core/utils/pool/mysql/mysqlPool");
var async = require("async");

Photos.publish = function (albumParam, albumPics, callback) {
    mysqlUtil.getConnection(function (err, conn) {
        if (err) {
            return callback.apply(null, [err, null]);
        }

        conn.beginTransaction(function (err) {
            if (err) {
                return callback.apply(null, [err, null]);
            }
            var sql = "insert into XL_CLASS_ALBUM(albumType,albumTitle,content,likesNum,isComment,state,schoolId,classId,userId,createDate,doneDate,nickName,studentId,studentName,schoolName,className,userName,photoCount)";
            sql += "values(?,?,?,0,0,1,?,?,?,now(),now(),?,?,?,?,?,?,?)";

            conn.query(sql, albumParam, function (err, res) {
                if (err) {
                    conn.rollback();
                    conn.release();
                    return callback.apply(null, [err, null]);
                }
                var albumId = res.insertId;
                if (albumPics.length === 0) {
                    conn.commit(function (err) {
                        if (err) {
                            conn.rollback();
                            conn.release();
                            return callback.apply(null, [err, null]);
                        }
                        conn.release();
                        res.albumId = albumId;
                        return callback.apply(null, [null, res]);
                    });
                } else {

                    var albumPicSQL = "insert into XL_CLASS_ALBUM_PIC(albumId,picUrl,picDesc,state,createDate,doneDate,userId) values ?";
                    var albumPicParam = new Array();
                    var now = new Date();
                    for (var pic in albumPics) {
                        albumPicParam.push([albumId, albumPics[pic][0], null, 1, now, now, albumPics[pic][1]]);
                    }
                    conn.query(albumPicSQL, [albumPicParam], function (err, res) {
                        if (err) {
                            conn.rollback();
                            conn.release();
                            return callback.apply(null, [err, null]);
                        }
                        conn.commit(function (err) {
                            if (err) {
                                conn.rollback();
                                conn.release();
                                return callback.apply(null, [err, null]);
                            }
                            conn.release();
                            res.albumId = albumId;
                            return callback.apply(null, [null, res]);
                        });
                    });
                }
            });
        });
    });
}

Photos.moreComment = function (albumId, start, pageSize, done) {
    var sql = "select * from XL_CLASS_ALBUM where albumId=? and state=1";
    mysqlUtil.query(sql, albumId, function (err, album) {
        if (err) {
            return done(err);
        }
        if (album.length !== 1) {
            return done(new Error("相册[" + albumId + "]不存在"));
        }

        sql = "select * from XL_CLASS_ALBUM_HANDLE where albumId=? and handleType=2 and state=1 order by albumId limit ?,?";
        mysqlUtil.query(sql, [albumId, start, pageSize], function (err, comments) {
            done(err, album[0].isComment, comments);
        });

    });
}

Photos.morePhoto = function (albumId, start, pageSize, done) {
    var sql = "select * from XL_CLASS_ALBUM where albumId=? and state=1";
    mysqlUtil.query(sql, albumId, function (err, album) {
        if (err) {
            return done(err);
        }
        if (album.length !== 1) {
            return done(new Error("相册[" + albumId + "]不存在"));
        }

        sql = "select * from XL_CLASS_ALBUM_PIC where albumId=? and state=1 order by albumId limit ?,?";
        mysqlUtil.query(sql, [albumId, start, pageSize], function (err, comments) {
            done(err, album[0].photoCount, comments);
        });

    });
}


Photos.edit = function (albumParam, albumPics, cb) {
    mysqlUtil.getConnection(function (err, conn) {
        if (err) {
            return callback.apply(null, [err, null]);
        }

        var tasks = [function (callback) {
            conn.beginTransaction(function (err) {
                callback(err);
            });
        }, function (callback) {
            conn.query("select count(*) as total from XL_CLASS_ALBUM where albumId=? and state=1", albumParam[8], function (err, data) {
                if (err) {
                    return callback(err);
                }
                if (data[0].total !== 1) {
                    return callback(new Error("找不到相册[" + albumParam[8] + "]"));
                } else {
                    callback(err, data);
                }
            });
        }, function (query, callback) {
            var updateSQL = "update XL_CLASS_ALBUM set albumTitle=?,content=?,schoolId=?,classId=?,userId=?,nickName=?,studentId=?,studentName=?,doneDate=now() where albumId=?";
            conn.query(updateSQL, albumParam, function (err, results) {
                callback(err, results);
            });
        }, function (res, callback) {
            var delSQL = "update XL_CLASS_ALBUM_PIC set state=0,doneDate=now(),userId=? where albumId=?";
            conn.query(delSQL, [albumParam[4], albumParam[8]], function (err, results) {
                callback(err, results);
            });
        }, function (res, callback) {
            var albumPicSQL = "insert into XL_CLASS_ALBUM_PIC(albumId,picUrl,picDesc,state,createDate,doneDate,userId) values ?";
            var albumPicParam = new Array();
            var now = new Date();
            for (var pic in albumPics) {
                albumPicParam.push([albumParam[8], albumPics[pic][0], null, 1, now, now, albumPics[pic][1]]);
            }
            conn.query(albumPicSQL, [albumPicParam], function (err, results) {
                callback(err, results);
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

Photos.delete = function (albumId, userId, callback) {
    mysqlUtil.query("update XL_CLASS_ALBUM set state=0,userId=?,doneDate=now() where albumId=?", [userId, albumId], callback);
}

Photos.delPhoto = function (albumId, picId, userId, done) {
    mysqlUtil.getConnection(function (err, conn) {
        if (err) {
            return callback.apply(null, [err, null]);
        }

        var tasks = [function (callback) {
            conn.beginTransaction(function (err) {
                callback(err);
            });
        }, function (callback) {
            var updateSql = "update XL_CLASS_ALBUM set photoCount=photoCount - 1,doneDate=now() where albumId=?";
            conn.query(updateSql, albumId, function (err, upd) {
                callback(err, upd);
            });
        }, function (res, callback) {
            var picSQL = "update XL_CLASS_ALBUM_PIC set state=0,doneDate=now(),userId=? where picId=? and state=1";
            conn.query(picSQL, [userId, picId], function (err, res) {
                if (res.affectedRows !== 1) {
                    return callback(new Error("没有找到照片[" + picId + "]"));
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


Photos.addPhoto = function (userId, albumId, albumPics, cb) {
    mysqlUtil.getConnection(function (err, conn) {
        if (err) {
            return callback.apply(null, [err, null]);
        }

        var tasks = [function (callback) {
            conn.beginTransaction(function (err) {
                callback(err);
            });
        }, function (callback) {
            conn.query("select count(*) as total from XL_CLASS_ALBUM where albumId=? and state=1", albumId, function (err, data) {
                if (err) {
                    return callback(err);
                }
                if (data[0].total !== 1) {
                    return callback(new Error("没有找到相册[" + albumId + "]"));
                } else {
                    callback(err, data);
                }
            });
        }, function (query, callback) {
            var updateSQL = "update XL_CLASS_ALBUM set photoCount=photoCount+?,doneDate=now() where albumId=?";
            conn.query(updateSQL, [albumPics.length, albumId], function (err, results) {
                callback(err, results);
            });
        }, function (res, callback) {
            var albumPicSQL = "insert into XL_CLASS_ALBUM_PIC(albumId,picUrl,picDesc,state,createDate,doneDate,userId) values ?";
            var albumPicParam = new Array();
            var now = new Date();
            for (var pic in albumPics) {
                albumPicParam.push([albumId, albumPics[pic][0], null, 1, now, now, albumPics[pic][1]]);
            }
            conn.query(albumPicSQL, [albumPicParam], function (err, results) {
                callback(err, results);
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

Photos.findHandle = function (albumId, handleType, userId, callback) {
    mysqlUtil.query("select * from XL_CLASS_ALBUM_HANDLE where albumId=? and handleType=? and oUserId=? and state=1", [albumId, handleType, userId], callback);
}

Photos.addAlbumLike = function (albumId, userId, nickName, studentId, studentName, cb) {
    mysqlUtil.getConnection(function (err, conn) {
        if (err) {
            return callback.apply(null, [err, null]);
        }

        var tasks = [function (callback) {
            conn.beginTransaction(function (err) {
                callback(err);
            });
        }, function (callback) {
            conn.query("select count(*) as total from XL_CLASS_ALBUM where albumId=? and state=1", albumId, function (err, data) {
                if (err) {
                    return callback(err);
                }
                if (data[0].total !== 1) {
                    return callback(new Error("找不到相册[" + albumId + "]"));
                } else {
                    callback(err, data);
                }
            });
        }, function (query, callback) {
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

Photos.unLike = function (albumId, userId, handleId, cb) {
    mysqlUtil.getConnection(function (err, conn) {
        if (err) {
            return callback.apply(null, [err, null]);
        }

        var tasks = [function (callback) {
            conn.beginTransaction(function (err) {
                callback(err);
            });
        }, function (callback) {
            conn.query("select count(*) as total from XL_CLASS_ALBUM where albumId=? and state=1", albumId, function (err, data) {
                if (err) {
                    return callback(err);
                }
                if (data[0].total !== 1) {
                    return callback(new Error("找不到相册[" + albumId + "]"));
                } else {
                    callback(err, data);
                }
            });
        }, function (query, callback) {
            var updateSql = "update XL_CLASS_ALBUM set likesNum=likesNum - 1,doneDate=now() where albumId=?";
            conn.query(updateSql, albumId, function (err, upd) {
                callback(err, upd);
            });
        }, function (res, callback) {
            var likeSQL = "update XL_CLASS_ALBUM_HANDLE set state=0,doneDate=now(),oUserId=? where handleId=?";
            conn.query(likeSQL, [userId, handleId], function (err, res) {
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


Photos.addAlbumComment = function (albumId, userId, nickName, parentHandleId, content, studentId, studentName, callback) {
    mysqlUtil.getConnection(function (err, conn) {
        if (err) {
            return callback.apply(null, [err, null]);
        }

        var tasks = [function (callback) {
            conn.beginTransaction(function (err) {
                callback(err);
            });
        }, function (callback) {
            conn.query("select count(*) as total from XL_CLASS_ALBUM where albumId=? and state=1", albumId, function (err, data) {
                if (err) {
                    return callback(err);
                }
                if (data[0].total !== 1) {
                    return callback(new Error("找不到相册[" + albumId + "]"));
                } else {
                    callback(err, data);
                }
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
                callback(err);
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

Photos.queryByAlbumType = function (start, pageSize, photoLength, commentLength, queryCondition, cb) {
    var tasks = [function (callback) {
        var sql = "select * from XL_CLASS_ALBUM m where state=1 ";
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
        sql = "select * from (" + sql + " order by albumId desc) m limit ?,?";
        mysqlUtil.queryOne(countSQL, params, function (err, res) {
            if (err) {
                return callback(err);
            }
            var totalNum = res.total;
            if (totalNum === 0) {
                return callback(err, [0, []]);
            }
            params.push(start);
            params.push(pageSize);
            mysqlUtil.query(sql, params, function (err, res) {
                if (err) {
                    return callback(err);
                }
                callback(err, [totalNum, res, photoLength, commentLength]);
            });
        });
    }, function (album, callback) {
        findAlbumPicByArray(album[0], album[1], album[2], album[3], 0, callback);
    }, function (album, callback) {
        findAlbumCommentByArray(album[0], album[1], album[2], 0, callback);
    }, function (res, callback) {
        findAlbumLikeByArray(res[0], res[1], 0, callback);
    }];

    async.waterfall(tasks, function (err, results) {
        if (err) {
            return cb(err);
        }
        cb.apply(null, [null, results[0], results[1]]);
    });

}

Photos.findOne = function (albumId, cb) {
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
        mysqlUtil.query("select * from XL_CLASS_ALBUM_PIC where albumId=? and state=1 order by picId", [album[0]], function (err, res) {
            if (err) {
                return callback(err);
            }
            album[1][0].picPaths = res;
            callback(err, album);
        });
    }, function (album, callback) {
        mysqlUtil.query("select * from XL_CLASS_ALBUM_HANDLE where albumId=? and handleType=2 and state=1 order by handleId ", [album[0]], function (err, res) {
            if (err) {
                return callback(err);
            }
            album[1][0].comments = res;
            callback(err, album);
        });
    }, function (album, callback) {
        mysqlUtil.query("select * from XL_CLASS_ALBUM_HANDLE where albumId=? and handleType=1 and state=1 order by handleId ", [album[0]], function (err, res) {
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

Photos.findPicById = function (albumId, callback) {
    mysqlUtil.query("select * from XL_CLASS_ALBUM_PIC where albumId=? and state=1 order by albumId", [albumId], callback);
}

Photos.findLimitPicById = function (albumId, photoLength, callback) {
    mysqlUtil.query("select * from XL_CLASS_ALBUM_PIC where albumId=? and state=1 order by albumId limit ?,?", [albumId, 0, photoLength], callback);
}

Photos.findHandleById = function (albumId, handleType, callback) {
    mysqlUtil.query("select * from XL_CLASS_ALBUM_HANDLE where albumId=? and handleType=? and state=1 order by albumId", [albumId, handleType], callback);
}

Photos.findLimitHandleById = function (albumId, handleType, commentLength, callback) {
    mysqlUtil.query("select * from XL_CLASS_ALBUM_HANDLE where albumId=? and handleType=? and state=1 order by albumId limit ?,?", [albumId, handleType, 0, commentLength], callback);
}

function findAlbumLikeByArray(totalNum, album, i, callback) {
    if (totalNum == 0) {
        return callback(null, [totalNum, album]);
    }
    if (i < album.length - 1) {
        Photos.findHandleById(album[i].albumId, 1, function (err, res) {
            if (err) {
                return callback(err);
            }
            album[i].likes = new Object();
            album[i].likes = res;
            i++;
            findAlbumLikeByArray(totalNum, album, i, callback);
        });
    } else {
        Photos.findHandleById(album[i].albumId, 1, function (err, res) {
            if (err) {
                return callback(err);
            }
            album[i].likes = new Object();
            album[i].likes = res;
            callback(err, [totalNum, album]);
        });
    }
}

function findAlbumCommentByArray(totalNum, album, commentLength, i, callback) {
    if (totalNum == 0) {
        return callback(null, [totalNum, album]);
    }
    if (i < album.length - 1) {
        Photos.findLimitHandleById(album[i].albumId, 2, commentLength, function (err, res) {
            if (err) {
                return callback(err);
            }
            album[i].comments = new Object();
            album[i].comments = res;
            i++;
            findAlbumCommentByArray(totalNum, album, commentLength, i, callback);
        });
    } else {
        Photos.findLimitHandleById(album[i].albumId, 2, commentLength, function (err, res) {
            if (err) {
                return callback(err);
            }
            album[i].comments = new Object();
            album[i].comments = res;
            callback(err, [totalNum, album]);
        });
    }
}

function findAlbumPicByArray(totalNum, album, photoLength, commentLength, i, callback) {
    if (totalNum == 0) {
        return callback(null, [totalNum, album]);
    }
    if (i < album.length - 1) {
        Photos.findLimitPicById(album[i].albumId, photoLength, function (err, res) {
            if (err) {
                return callback(err);
            }
            album[i].picPaths = new Object();
            album[i].picPaths = res;
            i++;
            findAlbumPicByArray(totalNum, album, photoLength, commentLength, i, callback);
        });
    } else {
        Photos.findLimitPicById(album[i].albumId, photoLength, function (err, res) {
            if (err) {
                return callback(err);
            }
            album[i].picPaths = new Object();
            album[i].picPaths = res;
            callback(err, [totalNum, album, commentLength]);
        });
    }
}
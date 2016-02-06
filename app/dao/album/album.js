var mysqlUtil = require("../../../core/utils/pool/mysql/mysqlPool");

var Album = module.exports;

Album.delete = function(albumType, trendsId, userId, callback){
    mysqlUtil.query("update XL_ALBUM set state = 0, doneDate=now(), userId = ? where albumId = ? and albumType = ?", [userId, trendsId, albumType], callback);
}

Album.createAlbumLike = function(albumId, handleArgs, callback){
    mysqlUtil.getConnection(function(err, conn){
        if(err){
            callback.apply(null, [err, null]);
        }
        conn.beginTransaction(function(err){
            if(err){
                callback.apply(null, [err, null]);
            }
            var updateSql = "update XL_ALBUM set likesNum = likesNum + 1,doneDate=now() where albumType=3 and albumId=?";
            conn.query(updateSql, albumId, function(err, data){
                if(err){
                    conn.rollback();
                    conn.release();
                    callback.apply(null, [err, null]);
                }
                var insertSql = "insert into XL_ALBUM_HANDLE(albumId,handleType,hUserId,nickName,studentId,studentName,state,";
                insertSql += "createDate,doneDate,oUserId) values (?,1,?,?,?,?,1,now(),now(),?)";
                conn.query(insertSql, handleArgs, function(err, data){
                    if(err){
                        conn.rollback();
                        conn.release();
                        callback.apply(null, [err, null]);
                    }
                    conn.commit(function(err){
                        if(err){
                            conn.rollback();
                            conn.release();
                            callback.apply(null, [err, null]);
                        }
                        conn.release();
                        callback.apply(null, [null, data]);
                    });
                });
            });
        });
    });
}

Album.create = function(albumArg, albumPicArgs, callback){
    mysqlUtil.getConnection(function(err, conn){
        if(err){
            callback.apply(null, [err, null]);
        }
        conn.beginTransaction(function(err){
            if(err){
                callback.apply(null, [err, null]);
            }
            var albumSql = "insert into XL_ALBUM(schoolId,classId,albumType,albumTitle,content,albumDate,isTop,nickName,studentId";
            albumSql += ",studentName,likesNum,isComment,state,userId,createDate,doneDate) values (?,?,?,?,?,?,?,?,?,?,?,?,?,?,now(),now())";
            conn.query(albumSql, albumArg, function(err, data){
                if(err){
                    conn.rollback();
                    conn.release();
                    callback.apply(null, [err, data]);
                }
                var albumId = data.insertId;
                var albumPicSql = "insert into XL_ALBUM_PIC(picUrl,likesNum,createDate,picDesc,state,doneDate,userId,albumId) values (";
                albumPicSql += "?,?,now(),?,?,now(),?," + albumId + ")";
                createAlbumPic(conn, albumPicSql, albumPicArgs, 0, callback);
            });
        });
    });
}

function createAlbumPic(conn, albumPicSql, albumPicArgs, i, callback){
    if(i < (albumPicArgs.length - 1)){
        conn.query(albumPicSql,  albumPicArgs[i], function(err, data){
            if(err){
                conn.rollback();
                conn.release();
                callback.apply(null, [err, null]);
            }
            i ++;
            createAlbumPic(conn, albumPicSql, albumPicArgs, i, callback);
        });
    }else{
        conn.query(albumPicSql,  albumPicArgs[i], function(err, data){
            if(err){
                conn.rollback();
                conn.release();
                callback.apply(null, [err, data]);
            }
            conn.commit(function(err){
                if(err){
                    conn.rollback();
                    conn.release();
                    callback.apply(null, [err, null]);
                }
                conn.release();
                callback.apply(null, [null, data]);
            });
        });
    }
}

Album.findOne = function(albumType, userId, trendsId, callback){
    mysqlUtil.query("select * from XL_ALBUM where albumType=? and userId=? and albumId=?", [albumType, userId, trendsId], callback);
}

Album.list = function(albumType, userId, start, pageSize, callback){
    var sql = "select * from XL_ALBUM where albumType=?";
    var args = [albumType, start, pageSize];
    if(userId && userId > 0){
        sql += " and userId=?";
        var args = [albumType, userId, start, pageSize];
    }
    sql + " limit ?,?";
    mysqlUtil.query(sql, args, callback);
}

Album.top = function(albumType, userId, trendsId, isTop, callback){
    mysqlUtil.query("update XL_ALBUM set isTop = ?,doneDate=now() where albumType=? and userId=? and albumId=?", [isTop, albumType, userId, trendsId], callback);
}

Album.findHandle = function(albumId, handleType, hUserId, callback){
    var sql = "select * from XL_ALBUM_HANDLE where albumId=? and handleType=?";
    var args = [albumId, handleType];
    if(hUserId && hUserId > 0){
        sql += " and hUserId=?";
        args = [albumId, handleType, hUserId];
    }
    mysqlUtil.query(sql, args, callback);
}

Album.findPic = function(albumId, callback){
    mysqlUtil.query("select * from XL_ALBUM_PIC where albumId=?", [albumId], callback);
}

Album.createAlbumComment = function(albumId, handleArgs, callback){
    mysqlUtil.getConnection(function(err, conn){
        if(err){
            callback.apply(null, [err, null]);
        }
        conn.beginTransaction(function(err){
            if(err){
                callback.apply(null, [err, null]);
            }
            var updateSql = "update XL_ALBUM set isComment = isComment + 1,doneDate=now() where albumType=3 and albumId=?";
            conn.query(updateSql, albumId, function(err, data){
                if(err){
                    conn.rollback();
                    conn.release();
                    callback.apply(null, [err, null]);
                }
                var insertSql = "insert into XL_ALBUM_HANDLE(albumId,handleType,content,hUserId,nickName,studentId,studentName,state,";
                insertSql += "createDate,doneDate,oUserId) values (?,2,?,?,?,?,?,1,now(),now(),?)";
                conn.query(insertSql, handleArgs, function(err, data){
                    if(err){
                        conn.rollback();
                        conn.release();
                        callback.apply(null, [err, null]);
                    }
                    conn.commit(function(err){
                        if(err){
                            conn.rollback();
                            conn.release();
                            callback.apply(null, [err, null]);
                        }
                        conn.release();
                        callback.apply(null, [null, data]);
                    });
                });
            });
        });
    });
}
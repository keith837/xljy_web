var mysqlUtil = require("../../../core/utils/pool/mysql/mysqlPool");

var Album = module.exports;

Album.delete = function(albumType, trendsId, userId, callback){
    mysqlUtil.query("update XL_ALBUM set state = 0, doneDate=now(), userId = ? where albumId = ? and albumType = ?", [userId, trendsId, albumType], callback);
}

Album.createAlbumLike = function(albumId, handleArgs, callback){
    mysqlUtil.getConnection(function(err, conn){
        if(err){
            return callback.apply(null, [err, null]);
        }
        conn.beginTransaction(function(err){
            if(err){
                return callback.apply(null, [err, null]);
            }
            var updateSql = "update XL_ALBUM set likesNum = likesNum + 1,doneDate=now() where albumType=3 and albumId=?";
            conn.query(updateSql, albumId, function(err, data){
                if(err){
                    conn.rollback();
                    conn.release();
                    return callback.apply(null, [err, null]);
                }
                var insertSql = "insert into XL_ALBUM_HANDLE(albumId,handleType,pHandleId,hUserId,nickName,studentId,studentName,state,";
                insertSql += "createDate,doneDate,oUserId) values (?,1,0,?,?,?,?,1,now(),now(),?)";
                conn.query(insertSql, handleArgs, function(err, data){
                    if(err){
                        conn.rollback();
                        conn.release();
                        return callback.apply(null, [err, null]);
                    }
                    conn.commit(function(err){
                        if(err){
                            conn.rollback();
                            conn.release();
                            return callback.apply(null, [err, null]);
                        }
                        conn.release();
                        return callback.apply(null, [null, data]);
                    });
                });
            });
        });
    });
}

Album.create = function(albumArg, albumPicArgs, callback){
    mysqlUtil.getConnection(function(err, conn){
        if(err){
            return callback.apply(null, [err, null]);
        }
        conn.beginTransaction(function(err){
            if(err){
                return callback.apply(null, [err, null]);
            }
            var albumSql = "insert into XL_ALBUM(schoolId,classId,albumType,albumTitle,content,albumDate,isTop,nickName,studentId";
            albumSql += ",studentName,likesNum,isComment,state,userId,createDate,doneDate,oUserId) values (?,?,?,?,?,?,?,?,?,?,?,?,?,?,now(),now(),?)";
            conn.query(albumSql, albumArg, function(err, data){
                if(err){
                    conn.rollback();
                    conn.release();
                    return callback.apply(null, [err, data]);
                }
                var albumId = data.insertId;
                var albumPicSql = "insert into XL_ALBUM_PIC(picUrl,likesNum,createDate,picDesc,state,doneDate,userId,oUserId,albumId) values (";
                albumPicSql += "?,?,now(),?,?,now(),?,?," + albumId + ")";
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
                return callback.apply(null, [err, null]);
            }
            i ++;
            createAlbumPic(conn, albumPicSql, albumPicArgs, i, callback);
        });
    }else{
        conn.query(albumPicSql,  albumPicArgs[i], function(err, data){
            if(err){
                conn.rollback();
                conn.release();
                return callback.apply(null, [err, data]);
            }
            conn.commit(function(err){
                if(err){
                    conn.rollback();
                    conn.release();
                    return callback.apply(null, [err, null]);
                }
                conn.release();
                return callback.apply(null, [null, data]);
            });
        });
    }
}

Album.findOne = function(albumType, userId, trendsId, callback){
    mysqlUtil.query("select * from XL_ALBUM where albumType=? and userId=? and albumId=?", [albumType, userId, trendsId], callback);
}

Album.queryNum = function(obj, schoolIds, callback){
    var whereSql = " 1=1 and m.state = 1 ";
    var args = new Array();
    if(obj){
        for(var key in obj){
            whereSql += " and m." + key + "=?";
            args.push(obj[key]);
        }
    }
    if(schoolIds){
        whereSql += " and schoolId in (";
        for(var i = 0; i < schoolIds.length; i ++){
            whereSql += "?,";
            args.push(schoolIds[i]);
        }
        whereSql = whereSql.substr(0, whereSql.length - 1) + ")";
    }
    var countSql = "select count(*) AS total from XL_ALBUM m WHERE " + whereSql + " order by createDate desc";
    mysqlUtil.queryOne(countSql, args, callback);
}

Album.queryPage = function(obj, schoolIds, start, pageSize, callback){
    var whereSql = " 1=1 and m.state = 1 ";
    var args = new Array();
    if(obj){
        for(var key in obj){
            whereSql += " and m." + key + "=?";
            args.push(obj[key]);
        }
    }
    if(schoolIds){
        whereSql += " and schoolId in (";
        for(var i = 0; i < schoolIds.length; i ++){
            whereSql += "?,";
            args.push(schoolIds[i]);
        }
        whereSql = whereSql.substr(0, whereSql.length - 1) + ")";
    }
    var querySql = "select m.* from XL_ALBUM m WHERE " + whereSql + " order by createDate desc";
    querySql += " limit ?,?";
    args.push(start);
    args.push(pageSize);
    mysqlUtil.query(querySql, args, callback);
}

Album.listByPage = function(obj, schoolIds, start, pageSize, callback){
    Album.queryNum(obj, schoolIds, function(err, data){
        if(err){
            return callback(err);
        }
        var total = 0;
        if(data){
            total = data.total;
        }
        Album.queryPage(obj, schoolIds, start, pageSize, function(err, users){
            if(err){
                return callback(err);
            }
            return callback(err, total, users);
        });
    });
}

Album.top = function(albumType, userId, trendsId, isTop, callback){
    mysqlUtil.query("update XL_ALBUM set isTop = ?,doneDate=now() where albumType=? and userId=? and albumId=?", [isTop, albumType, userId, trendsId], callback);
}

Album.findHandles = function(albumIds, obj, callback){
    var sql = "select * from XL_ALBUM_HANDLE where albumId in(";
    for(var i = 0; i < albumIds.length; i ++){
        sql += "?,";
    }
    sql = sql.substr(0, sql.length - 1) + ") ";
    for(var key in obj){
        sql += " and " + key + "=?"
        albumIds.push(obj[key]);
    }
    mysqlUtil.query(sql + " order by createDate desc", albumIds, callback);
}

Album.findHandle = function(albumId, handleType, userId, callback){
    var sql = "select * from XL_ALBUM_HANDLE where albumId = ? and handleType = ? and hUserId = ?";
    mysqlUtil.query(sql, [albumId, handleType, userId], callback);
}

Album.findPics = function(albumIds, callback){
    var sql = "select * from XL_ALBUM_PIC where albumId in(";
    for(var i = 0; i < albumIds.length; i ++){
        sql += "?,";
    }
    sql = sql.substr(0, sql.length - 1) + ")";
    mysqlUtil.query(sql, albumIds, callback);
}

Album.createAlbumComment = function(albumId, handleArgs, callback){
    mysqlUtil.getConnection(function(err, conn){
        if(err){
            return callback.apply(null, [err, null]);
        }
        conn.beginTransaction(function(err){
            if(err){
                return callback.apply(null, [err, null]);
            }
            var updateSql = "update XL_ALBUM set isComment = isComment + 1,doneDate=now() where albumType=3 and albumId=?";
            conn.query(updateSql, albumId, function(err, data){
                if(err){
                    conn.rollback();
                    conn.release();
                    return callback.apply(null, [err, null]);
                }
                var insertSql = "insert into XL_ALBUM_HANDLE(albumId,handleType,pHandleId,content,hUserId,nickName,studentId,studentName,state,";
                insertSql += "createDate,doneDate,oUserId) values (?,2,?,?,?,?,?,?,1,now(),now(),?)";
                conn.query(insertSql, handleArgs, function(err, data){
                    if(err){
                        conn.rollback();
                        conn.release();
                        return callback.apply(null, [err, null]);
                    }
                    conn.commit(function(err){
                        if(err){
                            conn.rollback();
                            conn.release();
                            return callback.apply(null, [err, null]);
                        }
                        conn.release();
                        callback.apply(null, [null, data]);
                    });
                });
            });
        });
    });
}
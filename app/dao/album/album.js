var mysqlUtil = require("../../../core/utils/pool/mysql/mysqlPool");

var Album = module.exports;

Album.delete = function(albumType, trendsId, userId, callback){
    mysqlUtil.query("update XL_ALBUM set state = 0, doneDate=now(), userId = ? where albumId = ? and albumType = ?", [userId, trendsId, albumType], callback);
}

Album.cancelAlbumLike = function(albumId, userId, callback){
    mysqlUtil.getConnection(function(err, conn){
        if(err){
            return callback.apply(null, [err, null]);
        }
        conn.beginTransaction(function(err){
            if(err){
                return callback.apply(null, [err, null]);
            }
            var updateSql = "update XL_ALBUM set likesNum = likesNum - 1,doneDate=now() where albumType=3 and albumId=?";
            conn.query(updateSql, albumId, function(err, data){
                if(err){
                    conn.rollback();
                    conn.release();
                    return callback.apply(null, [err, null]);
                }
                var updateLikeSql = "update XL_ALBUM_HANDLE set state = 0, doneDate = now() where handleType=1 and albumId = ? and hUserId=?";
                conn.query(updateLikeSql, [albumId, userId], function(err, data){
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
            var albumSql = "insert into XL_ALBUM(schoolId,schoolName,classId,albumType,albumTitle,content,albumDate,isTop,userName,custName,nickName,studentId";
            albumSql += ",studentName,likesNum,isComment,state,userId,createDate,doneDate,oUserId) values (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,now(),now(),?)";
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
    mysqlUtil.query("select * from XL_ALBUM where state = 1 and albumType=? and userId=? and albumId=?", [albumType, userId, trendsId], callback);
}

Album.queryNum = function(obj, schoolIds, startDate, endDate, callback){
    var whereSql = " 1=1 and m.state = 1 ";
    var args = new Array();
    if(obj){
        for(var key in obj){
            var keyValue = obj[key];
            whereSql += " and m." + key;
            if(typeof keyValue == 'string'){
                if(keyValue.indexOf("%") >= 0){
                    whereSql += " like ? ";
                    args.push(obj[key]);
                    continue;
                }
            }
            whereSql += " = ? ";
            args.push(obj[key]);
        }
    }
    if(schoolIds){
        whereSql += " and m.schoolId in (";
        for(var i = 0; i < schoolIds.length; i ++){
            whereSql += "?,";
            args.push(schoolIds[i]);
        }
        whereSql = whereSql.substr(0, whereSql.length - 1) + ")";
    }
    if(startDate){
        whereSql += " and m.createDate >= ? ";
        args.push(startDate);
    }
    if(endDate){
        whereSql += " and m.createDate <= ? ";
        args.push(endDate);
    }
    var countSql = "select count(*) AS total from XL_ALBUM m WHERE " + whereSql + " order by createDate desc";
    mysqlUtil.queryOne(countSql, args, callback);
}

Album.queryPage = function(obj, schoolIds, startDate, endDate, start, pageSize, callback){
    var whereSql = " 1=1 and m.state = 1 ";
    var args = new Array();
    if(obj){
        for(var key in obj){
            var keyValue = obj[key];
            whereSql += " and m." + key;
            if(typeof keyValue == 'string'){
                if(keyValue.indexOf("%") >= 0){
                    whereSql += " like ? ";
                    args.push(obj[key]);
                    continue;
                }
            }
            whereSql += " = ? ";
            args.push(obj[key]);
        }
    }
    if(schoolIds){
        whereSql += " and m.schoolId in (";
        for(var i = 0; i < schoolIds.length; i ++){
            whereSql += "?,";
            args.push(schoolIds[i]);
        }
        whereSql = whereSql.substr(0, whereSql.length - 1) + ")";
    }
    if(startDate){
        whereSql += " and m.createDate >= ? ";
        args.push(startDate);
    }
    if(endDate){
        whereSql += " and m.createDate <= ? ";
        args.push(endDate);
    }
    var querySql = "select m.* from XL_ALBUM m WHERE " + whereSql + " order by createDate desc";
    querySql += " limit ?,?";
    args.push(start);
    args.push(pageSize);
    mysqlUtil.query(querySql, args, callback);
}

Album.listByPage = function(obj, schoolIds, startDate, endDate, start, pageSize, callback){
    Album.queryNum(obj, schoolIds, startDate, endDate, function(err, data){
        if(err){
            return callback(err);
        }
        var total = 0;
        if(data){
            total = data.total;
        }
        Album.queryPage(obj, schoolIds, startDate, endDate, start, pageSize, function(err, users){
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
    var tempArgs = new Array();
    var sql = "select * from XL_ALBUM_HANDLE where state = 1 and albumId in(";
    for(var i = 0; i < albumIds.length; i ++){
        sql += "?,";
        tempArgs.push(albumIds[i]);
    }
    sql = sql.substr(0, sql.length - 1) + ") ";
    for(var key in obj){
        sql += " and " + key + "=?"
        tempArgs.push(obj[key]);
    }
    mysqlUtil.query(sql + " order by createDate", tempArgs, callback);
}

Album.findHandlesByOver = function(albumIds, obj, length, callback){
    var tempArgs = new Array();
    var sql = "SELECT albumId, handleId, pHandleId, content, nickName, hUserId, createDate, rank FROM ( SELECT albumId, handleId, pHandleId, content, nickName, hUserId,";
    sql += "createDate, IF ( @albumId = b.albumId, @rank := @rank + 1, @rank := 1 ) AS rank ,@albumId := b.albumId FROM ( SELECT albumId, handleId, pHandleId, content, ";
    sql += "nickName, hUserId, createDate FROM XL_ALBUM_HANDLE WHERE state = 1 AND albumId in(";
    for(var i = 0; i < albumIds.length; i ++){
        sql += "?,";
        tempArgs.push(albumIds[i]);
    }
    sql = sql.substr(0, sql.length - 1) + ") ";
    for(var key in obj){
        sql += " and " + key + "=?"
        tempArgs.push(obj[key]);
    }
    sql += " ORDER BY albumId, createDate ) b, ( SELECT @NAME := NULL, @rank := 0 ) a ) result WHERE rank <= ?";
    tempArgs.push(length);
    mysqlUtil.query(sql, tempArgs, callback);
}

Album.findHandle = function(albumId, handleType, userId, callback){
    var sql = "select * from XL_ALBUM_HANDLE where state = 1 and albumId = ? and handleType = ? and hUserId = ?";
    mysqlUtil.query(sql, [albumId, handleType, userId], callback);
}

Album.findPics = function(albumIds, callback){
    var sql = "select * from XL_ALBUM_PIC where state = 1 and albumId in(";
    for(var i = 0; i < albumIds.length; i ++){
        sql += "?,";
    }
    sql = sql.substr(0, sql.length - 1) + ")";
    mysqlUtil.query(sql, albumIds, callback);
}

Album.findPicsByOver = function(albumIds, length, callback){
    var tempArgs = new Array();
    var sql = "SELECT albumId, picId, picUrl, createDate FROM ( SELECT albumId, picId, picUrl, createDate, IF ( @albumId = b.albumId, @rank := @rank + 1, @rank := 1 ) AS rank ,";
    sql += "@albumId := b.albumId FROM ( SELECT albumId, picId, picUrl, createDate FROM XL_ALBUM_PIC WHERE state = 1 AND albumId IN (";
    for(var i = 0; i < albumIds.length; i ++){
        sql += "?,";
        tempArgs.push(albumIds[i]);
    }
    sql = sql.substr(0, sql.length - 1) + ")";
    sql += " ORDER BY albumId, createDate ) b, (SELECT @NAME := NULL, @rank := 0) a ) result WHERE rank <= ?";
    tempArgs.push(length);
    mysqlUtil.query(sql, tempArgs, callback);
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
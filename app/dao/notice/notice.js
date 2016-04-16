/**
 * Created by Jerry on 2/11/2016.
 */

var Notice = module.exports;
var mysqlUtil = require("../../../core/utils/pool/mysql/mysqlPool");
var async = require("async");


Notice.countByCondition = function (queryCondition, callback) {
    var sql = "select * from XL_NOTICE m where m.state=1 ";
    var params = [];

    var sqlCondition = "";
    if (queryCondition || queryCondition.length > 0) {
        for (var i in queryCondition) {
            var opr = queryCondition[i].opr;
            if (opr == "like") {
                sqlCondition += "and " + queryCondition[i].key + " " + opr + " ? ";
                params.push("%" + queryCondition[i].val + "%");
            } else if (opr == "in") {
                var ids = queryCondition[i].val;
                var appenderId = "";
                for (var k in ids) {
                    appenderId += "?,";
                    params.push(ids[k]);
                }
                appenderId = appenderId.substr(0, appenderId.length - 1);
                sqlCondition += "and " + queryCondition[i].key + " " + opr + " (" + appenderId + ") ";
            } else {
                sqlCondition += "and " + queryCondition[i].key + " " + opr + " ? ";
                params.push(queryCondition[i].val);
            }
        }
    }
    sql = sql + sqlCondition;

    var countSQL = "select count(*) as total from (" + sql + ") m";
    mysqlUtil.queryOne(countSQL, params, function (err, res) {
        if (err) {
            return callback(err);
        }
        var totalNum = res.total;
        if (totalNum === 0) {
            return callback(err, 0);
        } else {
            callback(err, 1);
        }
    });
}


Notice.queryByNoticeType = function (start, pageSize, photoLength, queryCondition, callback) {

    var sql = "select * from XL_NOTICE m where m.state=1 ";
    var params = [];

    var sqlCondition = "";
    if (queryCondition || queryCondition.length > 0) {
        for (var i in queryCondition) {
            var opr = queryCondition[i].opr;
            if (opr == "like") {
                sqlCondition += "and " + queryCondition[i].key + " " + opr + " ? ";
                params.push("%" + queryCondition[i].val + "%");
            } else if (opr == "in") {
                var ids = queryCondition[i].val;
                var appenderId = "";
                for (var k in ids) {
                    appenderId += "?,";
                    params.push(ids[k]);
                }
                appenderId = appenderId.substr(0, appenderId.length - 1);
                sqlCondition += "and " + queryCondition[i].key + " " + opr + " (" + appenderId + ") ";
            } else {
                sqlCondition += "and " + queryCondition[i].key + " " + opr + " ? ";
                params.push(queryCondition[i].val);
            }
        }
    }
    sql = sql + sqlCondition;

    var countSQL = "select count(*) as total from (" + sql + ") m";
    sql = "select * from (" + sql + " order by noticeId desc) m limit ?,?";
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
            findPicByArray(totalNum, photoLength, res, 0, callback);
        });
    });
}

Notice.publishNotice = function (noticeParam, noticePic, callback) {
    mysqlUtil.getConnection(function (err, conn) {
        if (err) {
            return callback.apply(null, [err, null]);
        }

        conn.beginTransaction(function (err) {
            if (err) {
                return callback.apply(null, [err, null]);
            }
            var sql = "insert into XL_NOTICE(noticeTypeId,noticeTitle,noticeContext,state,createDate,doneDate,schoolId,classId,userId,schoolName,className,userName,nickName,picNum)";
            sql += "values(?,?,?,1,now(),now(),?,?,?,?,?,?,?,?)";

            conn.query(sql, noticeParam, function (err, res) {
                if (err) {
                    conn.rollback();
                    conn.release();
                    return callback.apply(null, [err, null]);
                }

                var noticeId = res.insertId;
                if (noticePic.length === 0) {
                    conn.commit(function (err) {
                        if (err) {
                            conn.rollback();
                            conn.release();
                            return callback.apply(null, [err, null]);
                        }
                        conn.release();
                        return callback.apply(null, [null, noticeId]);
                    });
                } else {
                    var noticePicSQL = "insert into XL_NOTICE_PIC(noticeId,picUrl,picDesc,state,userId,createDate,doneDate) values ?";
                    var noticePicParam = new Array();
                    var now = new Date();
                    for (var pic in noticePic) {
                        noticePicParam.push([noticeId, noticePic[pic][0], null, 1, noticePic[pic][1], now, now]);
                    }
                    conn.query(noticePicSQL, [noticePicParam], function (err, res) {
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
                            callback.apply(null, [null, noticeId]);
                        });
                    });
                }
            });
        });
    });
}

Notice.findPagedPicById = function (noticeId, photoLength, callback) {
    mysqlUtil.query("select * from XL_NOTICE_PIC where noticeId=? and state=1 order by picId limit 0,?", [noticeId, photoLength], callback);
}

Notice.findPicById = function (noticeId, callback) {
    mysqlUtil.query("select * from XL_NOTICE_PIC where noticeId=? and state=1", [noticeId], callback);
}

Notice.findPicDetails = function (picId, callback) {
    mysqlUtil.query("select * from XL_NOTICE_PIC where picId=? and state=1", [picId], callback);
}

Notice.delete = function (noticeId, userId, callback) {
    mysqlUtil.query("update XL_NOTICE set state=0,userId=?,doneDate=now() where noticeId=?", [userId, noticeId], callback);
}

Notice.queryDetail = function (noticeId, callback) {
    mysqlUtil.query("select * from XL_NOTICE where noticeId=?", [noticeId], function (err, data) {
        if (err) {
            return callback(err);
        }
        if (!data || data.length === 0) {
            return callback(err, data);
        } else {
            Notice.findPicById(noticeId, function (err, res) {
                if (err) {
                    return callback(err);
                }
                data[0].picPaths = new Object();
                data[0].picPaths = res;
                callback(err, data);
            });
        }
    });
}


Notice.editNotice = function (noticeParam, noticePic, callback) {
    mysqlUtil.query("select * from XL_NOTICE where noticeId=? and state=1", [noticeParam[4]], function (err, data) {
        if (err) {
            return callback(err);
        }
        if (!data || data.length !== 1) {
            return callback(new Error("查询不到通知[" + noticeParam[4] + "]"));
        } else {
            if (data[0].userId !== noticeParam[0]) {
                return callback(new Error("通知必须由创建者修改."));
            }
        }
        mysqlUtil.getConnection(function (err, conn) {
            if (err) {
                return callback.apply(null, [err, null]);
            }

            var tasks = [function (callback) {
                conn.beginTransaction(function (err) {
                    callback(err);
                });
            }, function (callback) {
                var updateSql = "update XL_NOTICE set picNum=?,noticeTitle=?,noticeContext=?,doneDate=now() where noticeId=?";
                conn.query(updateSql, noticeParam.slice(1), function (err, upd) {
                    callback(err, upd);
                });
            }, function (upd, callback) {
                var delSql = "delete from XL_NOTICE_PIC where noticeId=?";
                conn.query(delSql, noticeParam[4], function (err, res) {
                    callback(err, res);
                });
            }, function (res, callback) {
                var noticeId = noticeParam[4];
                var noticePicSQL = "insert into XL_NOTICE_PIC(noticeId,picUrl,picDesc,state,userId,createDate,doneDate) values ?";
                var noticePicParam = new Array();
                var now = new Date();
                for (var pic in noticePic) {
                    noticePicParam.push([noticeId, noticePic[pic][0], null, 1, noticePic[pic][1], now, now]);
                }
                conn.query(noticePicSQL, [noticePicParam], function (err, res) {
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

    });

}


Notice.addPic = function (noticeId, pics, callback) {
    mysqlUtil.query("select * from XL_NOTICE where noticeId=? and state=1", [noticeId], function (err, data) {
        if (err) {
            return callback(err);
        }
        if (!data || data.length !== 1) {
            return callback(new Error("查询不到通知[" + noticeId + "]"));
        }

        mysqlUtil.getConnection(function (err, conn) {
            if (err) {
                return callback.apply(null, [err, null]);
            }

            var tasks = [function (callback) {
                conn.beginTransaction(function (err) {
                    callback(err);
                });
            }, function (callback) {
                var updateSql = "update XL_NOTICE set picNum=picNum+?,doneDate=now() where noticeId=?";
                conn.query(updateSql, [pics.length, noticeId], function (err, upd) {
                    callback(err, upd);
                });
            }, function (upd, callback) {
                var noticePicSQL = "insert into XL_NOTICE_PIC(noticeId,picUrl,picDesc,state,userId,createDate,doneDate) values ?";
                var noticePicParam = new Array();
                var now = new Date();
                for (var pic in pics) {
                    noticePicParam.push([noticeId, pics[pic][0], null, 1, pics[pic][1], now, now]);
                }
                conn.query(noticePicSQL, [noticePicParam], function (err, res) {
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

    });

}

Notice.delPic = function (noticeId, picId, userId, callback) {
    mysqlUtil.query("select * from XL_NOTICE where noticeId=? and state=1", [noticeId], function (err, data) {
        if (err) {
            return callback(err);
        }
        if (!data || data.length !== 1) {
            return callback(new Error("查询不到通知[" + noticeId + "]"));
        } else {
            if (data[0].userId !== userId) {
                return callback(new Error("通知必须由创建者修改."));
            }
        }
        mysqlUtil.getConnection(function (err, conn) {
            if (err) {
                return callback.apply(null, [err, null]);
            }

            var tasks = [function (callback) {
                conn.beginTransaction(function (err) {
                    callback(err);
                });
            }, function (callback) {
                conn.query("delete from XL_NOTICE_PIC where picId=?", [picId], function (err, res) {
                    if (err) {
                        return callback(err);
                    }
                    callback(err, res.affectedRows);
                });
            }, function (upd, callback) {
                var updateSql = "update XL_NOTICE set picNum=picNum-?,doneDate=now() where noticeId=?";
                conn.query(updateSql, [upd, noticeId], function (err, upd) {
                    callback(err, upd);
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

    });

}

Notice.morePic = function (noticeId, start, pageSize, done) {
    var sql = "select * from XL_NOTICE where noticeId=? and state=1";
    mysqlUtil.query(sql, noticeId, function (err, notices) {
        if (err) {
            return done(err);
        }
        if (notices.length !== 1) {
            return done(new Error("通知[" + noticeId + "]不存在"));
        }

        sql = "select * from XL_NOTICE_PIC where noticeId=? and state=1 order by picId limit ?,?";
        mysqlUtil.query(sql, [noticeId, start, pageSize], function (err, pics) {
            done(err, notices[0].picNum, pics);
        });

    });
}

function findPicByArray(totalNum, photoLength, notice, i, callback) {
    if (i < notice.length - 1) {
        Notice.findPagedPicById(notice[i].noticeId, photoLength, function (err, res) {
            if (err) {
                return callback(err);
            }
            notice[i].picPaths = new Object();
            notice[i].picPaths = res;
            i++;
            findPicByArray(totalNum, photoLength, notice, i, callback);
        });
    } else {
        Notice.findPagedPicById(notice[i].noticeId, photoLength, function (err, res) {
            if (err) {
                return callback(err);
            }
            notice[i].picPaths = new Object();
            notice[i].picPaths = res;
            callback(err, totalNum, notice);
        });
    }
}
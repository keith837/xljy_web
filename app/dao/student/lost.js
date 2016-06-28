var mysqlUtil = require("../../../core/utils/pool/mysql/mysqlPool");

var Lost = module.exports;

Lost.save = function(lostArgs, lostPicArgs, callback){
    mysqlUtil.getConnection(function(err, conn){
        if(err){
            return callback.apply(null, [err, null]);
        }
        conn.beginTransaction(function(err){
            if(err){
                return callback.apply(null, [err, null]);
            }
            var lostSql = "insert into XL_STUDENT_LOST(schoolId,classId,studentId,studentName,studentAge,gender,features,lostDate,lostAddr,contactBillId,state,createDate,doneDate,";
            lostSql += "oUserId,remark) values (?,?,?,?,?,?,?,?,?,?,1,now(),now(),?,?)";
            conn.query(lostSql, lostArgs, function(err, lost){
                if(err){
                    conn.rollback();
                    conn.release();
                    return callback.apply(null, [err, null]);
                }
                var lostId = lost.insertId;
                if(!lostPicArgs || lostPicArgs.length <= 0){
                    return conn.commit(function(err){
                        if(err){
                            conn.rollback();
                            conn.release();
                            return callback.apply(null, [err, null]);
                        }
                        conn.release();
                        return callback.apply(null, [null, lostId]);
                    });
                }
                for(var i = 0; i < lostPicArgs.length; i ++){
                    lostPicArgs[i].push(lostId);
                }
                var lostPicSql = "insert into XL_STU_LOST_PIC(picUrl,width,height,picDesc,state,createDate,doneDate,oUserId,lostId) values ?";
                conn.query(lostPicSql, [lostPicArgs], function(err, trends){
                    if(err){
                        conn.rollback();
                        conn.release();
                        return callback.apply(null, [err, null]);
                    }
                    return conn.commit(function(err){
                        if(err){
                            conn.rollback();
                            conn.release();
                            return callback.apply(null, [err, null]);
                        }
                        conn.release();
                        return callback.apply(null, [null, lostId]);
                    });
                });
            });
        });
    });
}

Lost.savePics = function(picArgs, callback){
    var lostPicSql = "insert into XL_STU_LOST_PIC(picUrl,width,height,picDesc,state,createDate,doneDate,oUserId,lostId) values ?";
    mysqlUtil.query(lostPicSql, [picArgs], callback);
}

Lost.savePic = function(picArgs, callback){
    var picSql = "insert into XL_STU_LOST_PIC(lostId,picUrl,width,height,picDesc,state,createDate,doneDate,oUserId) values (?,?,?,?,?,1,now(),now(),?)";
    mysqlUtil.query(picSql, picArgs, callback);
}

Lost.nextOne = function(index, callback){
    var selectLostSql = "select * from XL_STUDENT_LOST where state=1 limit ?,1";
    mysqlUtil.queryOne(selectLostSql, [index], callback);
}

Lost.findPics = function(lostId, callback){
    var selectPicSql = "select * from XL_STU_LOST_PIC where lostId = ? order by createDate";
    mysqlUtil.query(selectPicSql, [lostId], callback);
}

Lost.delete = function(lostId, callback){
    var deleteLostSql = "delete from XL_STUDENT_LOST where lostId = ?";
    mysqlUtil.query(deleteLostSql, [lostId], callback);
}

Lost.deleteByStudentId = function(studentId, callback){
    var deleteSql = "update XL_STUDENT_LOST set state=1 where studentId = ?";
    mysqlUtil.query(deleteSql, [studentId], callback);
}

Lost.listByStudentId = function(studentId, callback){
    var selectSql = "select * from XL_STUDENT_LOST where state=1 and studentId = ?";
    mysqlUtil.query(selectSql, [studentId], callback);
}

Lost.list = function(schoolId,classId,studentId,studentName,pageNo,pageSize){
    var selectSql = "select * from XL_STUDENT_LOST where state=1";
    var tempArgs = new Array();
    if(schoolId){
        selectSql += " and schoolId=? "
        tempArgs.push(schoolId);
    }
    if(classId){
        selectSql += " and calssId=? "
        tempArgs.push(classId);
    }
    if(studentId){
        selectSql += " and studentId=? "
        tempArgs.push(studentId);
    }
    if(studentName){
        selectSql += " and studentId like ? "
        tempArgs.push("%" + studentName + "%");
    }
    if(pageNo && pageSize){
        selectSql += "limit ?, ?";
        tempArgs.push(pageNo);
        tempArgs.push(pageSize);
    }
    mysqlUtil.query(selectSql, tempArgs, callback);
}

Lost.deletePics = function(callback, lostId, picId){
    var deletePicSql = "delete from XL_STUDENT_LOST where 1 = 1";
    var tempArgs = new Array();
    if(lostId && lostId > 0){
        deletePicSql += " and lostId = ?";
        tempArgs.push(lostId);
    }
    if(picId && picId > 0){
        deletePicSql += " and picId = ?";
        tempArgs.push(picId);
    }
    mysqlUtil.query(deletePicSql, tempArgs, callback);
}

Lost.savePosition = function(positionArgs, callback){
    var positionSql = "insert into XL_STUDENT_POSITION(lostId,positionX,positionY,address,state,createDate,doneDate) values (?,?,?,?,1,now(),now())";
    mysqlUtil.query(positionSql, positionArgs, callback);
}

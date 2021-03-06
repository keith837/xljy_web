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

Lost.listPics = function(lostIds, callback){
    var lostPicQuerySql = "select * from XL_STU_LOST_PIC where lostId in(0";
    if(lostIds && lostIds.length > 0){
        for(var i = 0; i < lostIds.length; i ++){
            lostPicQuerySql += ",?";
        }
    }
    lostPicQuerySql += ") order by lostId";
    mysqlUtil.query(lostPicQuerySql, lostIds, callback);
}

Lost.savePic = function(picArgs, callback){
    var picSql = "insert into XL_STU_LOST_PIC(lostId,picUrl,width,height,picDesc,state,createDate,doneDate,oUserId) values (?,?,?,?,?,1,now(),now(),?)";
    mysqlUtil.query(picSql, picArgs, callback);
}

Lost.nextOne = function(index, callback){
    var selectLostSql = "select * from XL_STUDENT_LOST where state=1 order by lostId desc limit ?,1";
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
    var deleteSql = "update XL_STUDENT_LOST set state=0 where studentId = ?";
    mysqlUtil.query(deleteSql, [studentId], callback);
}

Lost.listByStudentId = function(studentId, callback){
    var selectSql = "select b.schoolName,c.className,a.* from XL_STUDENT_LOST a,XL_SCHOOL b,XL_CLASS c "
    +"where a.schoolId=b.schoolId and a.classId=c.classId and a.state=1 and b.state=1 and c.state=1 and a.studentId = ?";
    mysqlUtil.query(selectSql, [studentId], callback);
}

Lost.listByLostId = function(lostId, callback){
    var selectSql = "select b.schoolName,c.className,a.* from XL_STUDENT_LOST a,XL_SCHOOL b,XL_CLASS c "
        +"where a.schoolId=b.schoolId and a.classId=c.classId and a.state=1 and b.state=1 and c.state=1 and a.lostId = ?";
    mysqlUtil.query(selectSql, [lostId], callback);
}

Lost.list = function(schoolId,classId,studentId,studentName,pageNo,pageSize,callback){
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
        selectSql += " limit ?, ?";
        tempArgs.push(parseInt(pageNo));
        tempArgs.push(parseInt(pageSize));
    }
    mysqlUtil.query(selectSql, tempArgs, callback);
}

Lost.findAllLostes = function (schoolIds, schoolId, classId, studentName, pageNo, pageSize, callback) {
    var selectSql = "from XL_STUDENT_LOST a,XL_SCHOOL b,XL_CLASS c ";
    selectSql += "where a.schoolId=b.schoolId and a.classId=c.classId";
    selectSql += " and b.state=1 and c.state=1"
    var tempArgs = new Array();
    if (schoolIds && schoolIds.length > 0) {
        var appenderId = "";
        for (var k in schoolIds) {
            appenderId += "?,";
            tempArgs.push(schoolIds[k]);
        }
        appenderId = appenderId.substr(0, appenderId.length - 1);
        selectSql += " and a.schoolId in (" + appenderId + ") ";
    }
    if (schoolId) {
        selectSql += " and a.schoolId=? "
        tempArgs.push(schoolId);
    }
    if (classId) {
        selectSql += " and a.classId=? "
        tempArgs.push(classId);
    }
    if (studentName) {
        selectSql += " and a.studentName like ? "
        tempArgs.push("%" + studentName + "%");
    }

    var countSql = "select count(*) as total " + selectSql;
    mysqlUtil.queryOne(countSql, tempArgs, function (err, res) {
        if (err) {
            return callback(err);
        }
        var totalNum = res.total;
        if (totalNum === 0) {
            return callback(err, 0, []);
        }

        selectSql += " order by lostId desc";
        if (pageNo && pageSize) {
            selectSql += " limit ?, ?";
            tempArgs.push(parseInt(pageNo));
            tempArgs.push(parseInt(pageSize));
        }
        var querySql = "select a.*,b.schoolName,c.className " + selectSql;
        mysqlUtil.query(querySql, tempArgs, function (err, res) {
            if (err) {
                callback(err);
            }
            return callback(err, totalNum, res);
        });
    });
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

Lost.findPositionByStudentId = function (studentId, callback) {
    var selectSql = "SELECT * FROM XL_STUDENT_LOST a, XL_STUDENT_POSITION b "
        + "where a.state=1 and a.studentId= ? and a.lostId=b.lostId and b.state=1";
    mysqlUtil.query(selectSql, [studentId], callback);
}
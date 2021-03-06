var Class = module.exports;
var mysqlUtil = require("../../../core/utils/pool/mysql/mysqlPool");
var async = require("async");

Class.listByTeacherId = function(teacherId, callback){
    mysqlUtil.query("select * from XL_CLASS where state=1 and tUserId = ?", [teacherId], callback);
}

Class.listBySchoolId = function(schoolId, callback){
    mysqlUtil.query("select * from XL_CLASS where state=1 and schoolId = ?", [schoolId], callback);
}

Class.findOne = function(classId, callback){
    mysqlUtil.queryOne("select * from XL_CLASS where state=1 and classId = ?", [classId], callback);
}

Class.listAllByTeacherId = function(teacherId, callback){
    mysqlUtil.query("select B.* from XL_CLASS_TEACHER_REL A,XL_CLASS B where A.classId=B.classId and A.state=1 and B.state=1 and A.tUserId=?", [teacherId], callback);
}

/**
 * 班级通讯录查询
 * @param classId
 * @param callback
 */
Class.listTeacherByClassId = function(classId, callback){
    mysqlUtil.query("select A.classId,A.isMaster,A.jobType,B.nickName,B.userName,B.custName,B.userId,concat('yunuser_',B.userId) as yunAccout,B.userUrl,B.state as userState from XL_CLASS_TEACHER_REL A,XL_USER B where A.tUserId=B.userId and A.state=1 and A.classId=?", [classId], callback);
}

Class.listInstallationInfoByClassId = function(classId, callback){
    mysqlUtil.query("select B.installationId,B.deviceType from XL_CLASS_TEACHER_REL A,XL_USER B where A.tUserId=B.userId and B.installationId is not null and A.state=1 and A.classId=?", [classId], callback);
}

Class.listInstallationInfo = function(classId, notUserId, userId, callback){
    var sql = "select B.installationId,B.deviceType from XL_CLASS_TEACHER_REL A,XL_USER B where B.installationId is not null and A.tUserId=B.userId and A.state=1 and A.classId=? and A.tUserId!=?";
    sql += " union select C.installationId,C.deviceType from XL_USER C where C.installationId is not null and C.state!=0 and C.userId=?";
    mysqlUtil.query(sql, [classId, notUserId, userId], callback);
}

Class.findPrincipalByClassId = function(classId, callback){
    mysqlUtil.queryOne("select -1 as classId,-1 as isMaster,'校长' as jobType,C.nickName,C.userName,C.custName,C.userId,concat('yunuser_',C.userId) as yunAccout,C.userUrl,C.state as userState from XL_SCHOOL A, XL_CLASS B, XL_USER C where A.schoolId=B.schoolId and A.sUserId=C.userId and B.classId=?", [classId], callback);
}

Class.listTeacherByClassIds = function(classIds, callback){
    var sql = "select A.classId,A.isMaster,A.jobType,B.nickName,B.userName,B.custName,B.userId from XL_CLASS_TEACHER_REL A,XL_USER B where A.tUserId=B.userId and A.state!=0 and A.classId in (-1";
    var tempArgs = new Array();
    for(var i = 0; i < classIds.length; i ++){
        sql += ",?";
        tempArgs.push(classIds[i]);
    }
    sql += ") order by A.classId,A.isMaster desc";
    mysqlUtil.query(sql, tempArgs, callback);
}

/**
 * 班级园长查询
 * @param classId
 * @param callback
 */
Class.findPrincipalBySchoolId = function(classId, callback){
    var sql = "select C.userId,C.userName,C.custName,C.nickName,A.schoolId,A.schoolName,concat('yunuser_',C.userId) as yunAccout,C.state as userState from XL_SCHOOL A, XL_CLASS B, XL_USER C where A.schoolId=B.schoolId and A.sUserId=C.userId and B.classId=?";
    mysqlUtil.queryOne(sql, [classId], callback);
}

/**
 * 班级家长查询
 * @param classId
 * @param callback
 */
Class.listParentsByClassId = function(classId, callback){
    var sql = "select A.studentId,A.studentName,C.userId,C.userName,C.nickName,C.custName,concat('yunuser_',C.userId,'_',A.studentId) as yunAccout,C.userUrl,C.state as userState from XL_STUDENT A,XL_USER_STUDENT_REL B,XL_USER C where A.studentId=B.studentId and B.userId=C.userId and A.state=1 and B.state=1 and classId=? order by B.studentId";
    mysqlUtil.query(sql, [classId], callback);
}

/**
 * 根据班级统计非班主任老师个数，供班级删除时校验
 * @param classId
 * @param callback
 */
Class.countTeacherByClassId = function(classId, callback){
    mysqlUtil.queryOne("select count(*) as total from XL_CLASS_TEACHER_REL where state = 1 and isMaster = 0 and classId = ?", [classId], callback);
}

//查询班级年级
Class.findGradeByClassId = function(classId, callback){
    var sql = "select B.* from XL_CLASS A, XL_GRADE B where A.state=1 and B.state=1 and A.gradeId=B.gradeId and A.classId=?";
    mysqlUtil.queryOne(sql, [classId], callback);
}

Class.findRelByClassAndTeacherId = function(classId, tUserId, callback){
    mysqlUtil.queryOne("select * from XL_CLASS_TEACHER_REL where state=1 and classId=? and tUserId=?", [classId, tUserId], callback);
}

Class.findByClassId = function(classId, callback){
    var sql = "select A.*,B.nickName,B.custName,C.schoolName,D.gradeName from XL_CLASS A,XL_USER B, XL_SCHOOL C, XL_GRADE D where "
    sql += "A.schoolId=C.schoolId AND A.tUserId=B.userId AND A.gradeId=D.gradeId AND A.state=1 and classId=?";
    mysqlUtil.queryOne(sql, [classId], callback);
}

Class.delTeacher = function(relId, callback){
    var updateSql = "update XL_CLASS_TEACHER_REL set state=0 where relId = ? and state=1";
    mysqlUtil.query(updateSql, relId, callback);
}

Class.delete = function(classId, callback){
    mysqlUtil.getConnection(function(err, conn){
        if(err){
            return callback(err);
        }
        conn.beginTransaction(function(err){
            if(err){
                return callback(err);
            }
            conn.query("update XL_CLASS set state = 0 where classId=?", [classId], function(err, classData){
                if(err){
                    conn.rollback();
                    conn.release();
                    return callback(err);
                }
                conn.query("update XL_CLASS_TEACHER_REL set state = 0 where isMaster=1 and classId=? and state=1", [classId], function(err, data){
                    if(err){
                        conn.rollback();
                        conn.release();
                        return callback(err);
                    }
                    conn.commit(function(err){
                        if(err){
                            conn.rollback();
                            conn.release();
                            return callback(err);
                        }
                        conn.release();
                        return callback(err, classData);
                    });
                });
            });
        });
    });
}

Class.queryNum = function(obj, schoolIds, callback){
    var whereSql = " 1=1 and A.state=1 ";
    var args = new Array();
    if(obj){
        for(var key in obj){
            whereSql += " and A." + key + "=?";
            args.push(obj[key]);
        }
    }
    if(schoolIds){
        whereSql += " and A.schoolId in (";
        for(var i = 0; i < schoolIds.length; i ++){
            whereSql += "?,";
            args.push(schoolIds[i]);
        }
        whereSql = whereSql.substr(0, whereSql.length - 1) + ")";
    }
    var countSql = "select count(*) as total from XL_CLASS A,XL_USER B, XL_SCHOOL C, XL_GRADE D where A.schoolId=C.schoolId AND A.tUserId=B.userId AND A.gradeId=D.gradeId AND " + whereSql;
    mysqlUtil.queryOne(countSql, args, callback);
}

Class.queryPage = function(obj, schoolIds, start, pageSize, callback){
    var whereSql = " 1=1 and A.state=1 ";
    var args = new Array();
    if(obj){
        for(var key in obj){
            whereSql += " and A." + key + "=?";
            args.push(obj[key]);
        }
    }
    if(schoolIds){
        whereSql += " and A.schoolId in (";
        for(var i = 0; i < schoolIds.length; i ++){
            whereSql += "?,";
            args.push(schoolIds[i]);
        }
        whereSql = whereSql.substr(0, whereSql.length - 1) + ")";
    }
    var querySql = "select A.*,B.nickName,B.custName,C.schoolName,D.gradeName from XL_CLASS A,XL_USER B, XL_SCHOOL C,XL_GRADE D where A.schoolId=C.schoolId AND A.tUserId=B.userId AND A.gradeId=D.gradeId AND " + whereSql;
    querySql += " limit ?,?";
    args.push(start);
    args.push(pageSize);
    mysqlUtil.query(querySql, args, callback);
}

Class.listByPage = function(obj, schoolIds, start, pageSize, callback){
    Class.queryNum(obj, schoolIds, function(err, data){
        if(err){
            return callback(err);
        }
        var total = 0;
        if(data){
            total = data.total;
        }
        Class.queryPage(obj, schoolIds, start, pageSize, function(err, users){
            if(err){
                return callback(err);
            }
            return callback(err, total, users);
        });
    });
}

Class.update = function (obj, tUserId, classId, teacherId, done) {
    mysqlUtil.getConnection(function (err, conn) {
        if (err) {
            return done.apply(null, [err, null]);
        }

        var tasks = [function (callback) {
            conn.beginTransaction(function (err) {
                callback(err);
            });
        }, function (callback) {
            var updateSql = "update XL_CLASS set ";
            var args = new Array();
            for (var key in obj) {
                updateSql += key + "=?,";
                args.push(obj[key]);
            }
            updateSql = updateSql.substr(0, updateSql.length - 1);
            updateSql += " where classId=?";
            args.push(classId);
            conn.query(updateSql, args, function (err, classData) {
                if (err) {
                    return callback(err);
                }
                callback(err, classData);
            });
        }, function (classData, callback) {
            if (tUserId) {
                var updateRelSql = "update XL_CLASS_TEACHER_REL set tUserId=?,doneDate=now(),oUserId=? where isMaster=1 and classId=? and state=1";
                conn.query(updateRelSql, [tUserId, obj.oUserId, classId], function (err, data) {
                    if (err) {
                        return callback(err);
                    }
                    callback(err, classData);
                });
            } else {
                callback(err, classData);
            }
        }, function (classData, callback) {
            var deleteSql = "update XL_CLASS_TEACHER_REL set state = 0,doneDate=now() where isMaster=0 and classId=? and state=1"
            conn.query(deleteSql, classId, function (err, res) {
                callback(err, classData);
            });
        }, function (classData, callback) {
            if (teacherId) {
                var insertRelSql = "insert into XL_CLASS_TEACHER_REL(classId,tUserId,isMaster,jobType,state,createDate,doneDate,oUserId) values ?";
                var tempArgs = new Array();
                var sysDate = new Date();
                if (teacherId instanceof Array) {
                    for (var i = 0; i < teacherId.length; i++) {
                        var teacherInfo = teacherId[i].split('_');
                        tempArgs.push([classId, teacherInfo[1], 0, teacherInfo[0], 1, sysDate, sysDate, obj.oUserId]);
                    }
                } else {
                    var teacherInfo = teacherId.split('_');
                    tempArgs.push([classId, teacherInfo[1], 0, teacherInfo[0], 1, sysDate, sysDate, obj.oUserId]);
                }
                conn.query(insertRelSql, [tempArgs], function (err, data) {
                    callback(err, classData);
                });
            } else {
                callback(err, classData);
            }
        }, function (classData, callback) {
            conn.commit(function (err) {
                if (err) {
                    return callback(err);
                }
                callback(null, classData);
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

Class.saveTeacher = function(args, callback){
    var insertRelSql = "insert into XL_CLASS_TEACHER_REL(classId,tUserId,isMaster,jobType,state,createDate,doneDate,oUserId)";
    insertRelSql += " values (?,?,0,?,1,now(),now(),?)";
    mysqlUtil.query(insertRelSql, args, callback);
}

Class.listStudentByClass = function(classId, callback){
    var selectSql = "select * from XL_STUDENT where state = 1 and classId = ?";
    mysqlUtil.query(selectSql, [classId], callback);
}

Class.listStudentAndDeviceByClass = function(classId, callback){
    var selectSql = "select A.*, B.deviceId,B.deviceSign,B.deviceName from XL_STUDENT A LEFT JOIN XL_DEVICE B on A.studentId=B.studentId where A.state = 1 and (B.state=1 or B.state is null) and A.classId = ?";
    mysqlUtil.query(selectSql, [classId], callback);
}

Class.graduateClass = function(classId, userId, done){
    mysqlUtil.getConnection(function (err, conn) {
        if (err) {
            return done.apply(null, [err, null]);
        }

        var tasks = [function (callback) {
            conn.beginTransaction(function (err) {
                callback(err);
            });
        }, function (callback) {
            var updateSql ="update XL_CLASS_TEACHER_REL set state=2,doneDate=now(),oUserId=? where classId=? and state=1";
            conn.query(updateSql, [userId, classId], function (err, updateRow) {
                if (err) {
                    return callback(err);
                }
                callback(err, updateRow);
            });
        }, function (updateRow, callback) {
            var updateSql = "update XL_CLASS A set className=CONCAT(className,'_',DATE_FORMAT(NOW(),'%Y%m')),graduationFlag=1,"
                        +"doneDate=now(),oUserId=? where A.classId = ?";
            conn.query(updateSql, [userId, classId], function (err, classData) {
                if (err) {
                    return callback(err);
                }
                callback(err, classData);
            });

        }, function (classData, callback) {
            conn.commit(function (err) {
                if (err) {
                    return callback(err);
                }
                callback(null, classData);
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

Class.upgradeClass = function (classId, userId, className, gradeId, done) {
    mysqlUtil.getConnection(function (err, conn) {
        if (err) {
            return done.apply(null, [err, null]);
        }

        var tasks = [function (callback) {
            conn.beginTransaction(function (err) {
                callback(err);
            });
        }, function (callback) {
            var updateSql ="update XL_CLASS set className=?,gradeId=?,doneDate=now(),oUserId=? where classId= ? and state=1";
            conn.query(updateSql, [className, gradeId, userId, classId], function (err, updateRow) {
                if (err) {
                    return callback(err);
                }
                callback(err, updateRow);
            });
        }, function (updateRow, callback) {
            var updateSql = "update XL_STUDENT set studentAge=studentAge+1,doneDate=now(),oUserId=? where classId=? and state=1 and studentAge is not null;";
            conn.query(updateSql, [userId, classId], function (err, updateStudent) {
                if (err) {
                    return callback(err);
                }
                callback(err, updateStudent);
            });

        }, function (updateStudent, callback) {
            conn.commit(function (err) {
                if (err) {
                    return callback(err);
                }
                callback(null, updateStudent);
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

Class.listUnSyncStudentByClass = function(classId, callback){
    var selectSql = "SELECT studentId FROM XL_STUDENT a WHERE a.classId =? AND a.state=1 AND NOT EXISTS (SELECT 1 FROM XL_SPORTS b WHERE b.studentId = a.studentId and b.sportsDate>DATE_SUB(now(),INTERVAL 2 day))";
    mysqlUtil.query(selectSql, [classId], function(err, res){
        if (err) {
            return callback(err);
        }
        var studentIdObj = new Object();
        for (var i = 0; i < res.length; i++) {
            studentIdObj[res[i].studentId] = 1;
        }
        callback(err, studentIdObj);
    });
}

Class.save = function(args, teacherId, callback){
    mysqlUtil.getConnection(function(err, conn){
        if(err){
            return callback(err);
        }
        conn.beginTransaction(function(err){
            if(err){
                return callback(err);
            }
            var insertClassSql = "insert into XL_CLASS(schoolId,gradeId,tUserId,className,classDesc,classUrl,state,";
            insertClassSql += "createDate,doneDate,oUserId) values (?,?,?,?,?,?,1,now(),now(),?)";
            conn.query(insertClassSql, args, function(err, classData){
                if(err){
                    conn.rollback();
                    conn.release();
                    return callback(err);
                }
                var insertRelSql = "insert into XL_CLASS_TEACHER_REL(classId,tUserId,isMaster,jobType,state,createDate,doneDate,oUserId) values ?";
                var tempArgs = new Array();
                var sysDate = new Date();
                tempArgs.push([classData.insertId, args[2], 1, '班主任', 1, sysDate, sysDate, args[6]]);
                if(teacherId){
                    if(teacherId instanceof Array){
                        for(var i = 0; i < teacherId.length; i ++){
                            var teacherInfo = teacherId[i].split('_');
                            tempArgs.push([classData.insertId, teacherInfo[1], 0, teacherInfo[0], 1, sysDate, sysDate, args[6]]);
                        }
                    }else{
                        var teacherInfo = teacherId.split('_');
                        tempArgs.push([classData.insertId, teacherInfo[1], 0, teacherInfo[0], 1, sysDate, sysDate, args[6]]);
                    }
                }
                conn.query(insertRelSql, [tempArgs], function(err, data){
                    if(err){
                        conn.rollback();
                        conn.release();
                        return callback(err);
                    }
                    conn.commit(function(err){
                        if(err){
                            conn.rollback();
                            conn.release();
                            return callback(err);
                        }
                        conn.release();
                        return callback(err, data);;
                    });
                });
            });
        });
    });
}
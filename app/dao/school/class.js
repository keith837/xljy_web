var Class = module.exports;
var mysqlUtil = require("../../../core/utils/pool/mysql/mysqlPool");

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
    mysqlUtil.query("select A.classId,A.isMaster,A.jobType,B.nickName,B.userName,B.custName,B.userId,B.yunAccout,B.userUrl from XL_CLASS_TEACHER_REL A,XL_USER B where A.tUserId=B.userId and A.state=1 and A.classId=?", [classId], callback);
}

Class.findPrincipalByClassId = function(classId, callback){
    mysqlUtil.queryOne("select -1 as classId,-1 as isMaster,'校长' as jobType,C.nickName,C.userName,C.custName,C.userId,C.yunAccout,C.userUrl from XL_SCHOOL A, XL_CLASS B, XL_USER C where A.schoolId=B.schoolId and A.sUserId=C.userId and B.classId=?", [classId], callback);
}

Class.listTeacherByClassIds = function(classIds, callback){
    var sql = "select A.classId,A.isMaster,A.jobType,B.nickName,B.userName,B.custName,B.userId from XL_CLASS_TEACHER_REL A,XL_USER B where A.tUserId=B.userId and A.state=1 and A.classId in (-1";
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
    var sql = "select C.userId,C.userName,C.custName,C.nickName,A.schoolId,A.schoolName,C.yunAccout from XL_SCHOOL A, XL_CLASS B, XL_USER C where A.schoolId=B.schoolId and A.sUserId=C.userId and B.classId=?";
    mysqlUtil.queryOne(sql, [classId], callback);
}

/**
 * 班级家长查询
 * @param classId
 * @param callback
 */
Class.listParentsByClassId = function(classId, callback){
    var sql = "select A.studentId,A.studentName,C.userId,C.userName,C.nickName,C.custName,C.yunAccout,C.userUrl from XL_STUDENT A,XL_USER_STUDENT_REL B,XL_USER C where A.studentId=B.studentId and B.userId=C.userId and A.state=1 and B.state=1 and classId=? order by B.studentId";
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

Class.findRelByClassAndTeacherId = function(classId, tUserId, callback){
    mysqlUtil.queryOne("select * from XL_CLASS_TEACHER_REL where state=1 and classId=? and tUserId=?", [classId, tUserId], callback);
}

Class.findByClassId = function(classId, callback){
    var sql = "select A.*,B.nickName,B.custName,C.schoolName,D.gradeName from XL_CLASS A,XL_USER B, XL_SCHOOL C, XL_GRADE D where "
    sql += "A.schoolId=C.schoolId AND A.tUserId=B.userId AND A.gradeId=D.gradeId AND A.state=1 and classId=?";
    mysqlUtil.queryOne(sql, [classId], callback);
}

Class.delTeacher = function(relId, callback){
    var updateSql = "update XL_CLASS_TEACHER_REL set state=0 where relId = ?";
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
                conn.query("update XL_CLASS_TEACHER_REL set state = 0 where isMaster=1 and classId=?", [classId], function(err, data){
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

Class.update = function(obj, tUserId, classId, teacherId, callback){
    mysqlUtil.getConnection(function(err, conn){
        if(err){
            return callback(err);
        }
        conn.beginTransaction(function(err){
            if(err){
                return callback(err);
            }
            var updateSql = "update XL_CLASS set ";
            var args = new Array();
            for(var key in obj){
                updateSql += key + "=?,";
                args.push(obj[key]);
            }
            updateSql = updateSql.substr(0, updateSql.length - 1);
            updateSql += " where classId=?";
            args.push(classId);
            conn.query(updateSql, args, function(err, classData){
                if(err){
                    conn.rollback();
                    conn.release();
                    return callback(err);
                }
                if(teacherId){
                    var deleteSql = "update XL_CLASS_TEACHER_REL set state = 0 where isMaster=0 and classId=?"
                    mysqlUtil.query(deleteSql, [classId], function(err, data){
                        if(err){
                            conn.rollback();
                            conn.release();
                            return callback(err);
                        }
                        var insertRelSql = "insert into XL_CLASS_TEACHER_REL(classId,tUserId,isMaster,jobType,state,createDate,doneDate,oUserId) values ?";
                        var tempArgs = new Array();
                        var sysDate = new Date();
                        if(teacherId instanceof Array){
                            for(var i = 0; i < teacherId.length; i ++){
                                var teacherInfo = teacherId[i].split('_');
                                tempArgs.push([classId, teacherInfo[1], 0, teacherInfo[0], 1, sysDate, sysDate, obj.oUserId]);
                            }
                        }else{
                            var teacherInfo = teacherId.split('_');
                            tempArgs.push([classId, teacherInfo[1], 0, teacherInfo[0], 1, sysDate, sysDate, obj.oUserId]);
                        }
                        mysqlUtil.query(insertRelSql, [tempArgs], function(err, data){
                            if(err){
                                conn.rollback();
                                conn.release();
                                return callback(err);
                            }
                            if(tUserId){
                                var updateRelSql = "update XL_CLASS_TEACHER_REL set tUserId=?,doneDate=now(),oUserId=? where isMaster=1 and classId=?";
                                conn.query(updateRelSql, [tUserId,obj.oUserId,classId], function(err, data){
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
                                        return callback(err, classData);;
                                    });
                                });
                            }else{
                                conn.commit(function(err){
                                    if(err){
                                        conn.rollback();
                                        conn.release();
                                        return callback(err);
                                    }
                                    conn.release();
                                    return callback(err, classData);;
                                });
                            }
                        });
                    });
                }else{
                    if(tUserId){
                        var updateRelSql = "update XL_CLASS_TEACHER_REL set tUserId=?,doneDate=now(),oUserId=? where isMaster=1 and classId=?";
                        conn.query(updateRelSql, [tUserId,obj.oUserId,classId], function(err, data){
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
                                return callback(err, classData);;
                            });
                        });
                    }else{
                        conn.commit(function(err){
                            if(err){
                                conn.rollback();
                                conn.release();
                                return callback(err);
                            }
                            conn.release();
                            return callback(err, classData);;
                        });
                    }
                }
            });
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
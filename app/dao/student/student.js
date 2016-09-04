var Student = module.exports;
var mysqlUtil = require("../../../core/utils/pool/mysql/mysqlPool");

Student.queryAll = function(callback){
    mysqlUtil.query("select A.studentName,C.userId,C.nickName,A.studentId from XL_STUDENT A, XL_USER_STUDENT_REL B, XL_USER C WHERE A.studentId=B.studentId and B.userId=C.userId and A.state=1 and B.state=1 and C.state=1 and C.groupId = 10", [], callback);
}

Student.listByUserId = function (userId, callback) {
    mysqlUtil.query("select A.* from XL_STUDENT A, XL_USER_STUDENT_REL B WHERE A.studentId=B.studentId and A.state=1 and B.state=1 and B.userId=?", [userId], callback);
}

Student.findOne = function (userId, studentId, callback) {
    mysqlUtil.queryOne("select A.* from XL_STUDENT A, XL_USER_STUDENT_REL B WHERE A.studentId=B.studentId and A.state=1 and B.state=1 and B.userId=? and A.studentId=?", [userId, studentId], callback);
}

Student.findByStudentId = function(studentId, callback){
    mysqlUtil.queryOne("select b.schoolName,c.className,a.* from XL_STUDENT a,XL_SCHOOL b,XL_CLASS c "+
    "where a.schoolId=b.schoolId and a.classId=c.classId and a.state=1 and b.state=1 and c.state=1 and a.studentId = ?", [studentId], callback);
}

Student.findStudentInfo = function(studentId, callback){
    mysqlUtil.queryOne("select A.*,B.className,C.schoolName from XL_STUDENT A, XL_CLASS B, XL_SCHOOL C WHERE A.schoolId=C.schoolId and B.classId=A.classId and A.state=1 and A.studentId=?", [studentId], callback);
}

Student.findParentByStudentId = function(studentId, callback){
    var sql = "select B.*,A.smsFlag from XL_USER_STUDENT_REL A, XL_USER B where A.userId=B.userId and A.state=1 and B.state!=0 and A.studentId=?";
    mysqlUtil.query(sql, [studentId], callback);
}

Student.listDelYunUserByStudentId = function(studentId, userIds, callback){
    var sql = "select B.* from XL_USER_STUDENT_REL A, XL_USER B WHERE A.userId=B.userId and A.state=1 and B.state=1 and A.studentId=? ";
    var tempArgs = new Array();
    tempArgs.push(studentId);
    if(userIds && userIds.length > 0){
        sql += "and A.userId not in (";
        for(var i = 0; i < userIds.length; i ++){
            sql += "?,";
            tempArgs.push(userIds[i]);
        }
        sql = sql.substr(0, sql.length - 1) + ")";
    }
    mysqlUtil.query(sql, tempArgs, callback);
}

Student.listAddYunUserByStudentId = function(studentId, userIds, callback){
    if(!userIds || userIds.length <= 0){
        return callback(null, null);
    }
    var sql = "select * from XL_USER where userId not in (select userId from XL_USER_STUDENT_REL A where A.state=1 and A.studentId=?) and state=1 ";
    var tempArgs = new Array();
    tempArgs.push(studentId);
    sql += "and userId in (";
    for(var i = 0; i < userIds.length; i ++){
        sql += "?,";
        tempArgs.push(userIds[i]);
    }
    sql = sql.substr(0, sql.length - 1) + ")";
    mysqlUtil.query(sql, tempArgs, callback);
}

Student.findParents = function(studentIds, callback){
    var sql = "select A.*,B.nickName,B.custName,B.userName from XL_USER_STUDENT_REL A, XL_USER B WHERE A.userId=B.userId and ";
    sql +=  "A.state=1 and A.studentId in (";
    for(var i = 0; i < studentIds.length; i ++){
        sql += "?,";
    }
    sql = sql.substr(0, sql.length - 1) + ")";
    mysqlUtil.query(sql, studentIds, callback);
}

/**
 * 根据班级统计学生数量，删除学校时校验
 * @param classId
 * @param callback
 */
Student.countByClassId = function(classId, callback){
    var sql = "select count(*) as total from XL_STUDENT where state = 1 and classId = ?";
    mysqlUtil.queryOne(sql, [classId], callback);
}

Student.save = function(args, userId, oUserId, callback){
    mysqlUtil.getConnection(function(err, conn){
        if(err){
            return callback(err);
        }
        conn.beginTransaction(function(err){
            if(err){
                return callback(err);
            }
            var insertSql = "insert into XL_STUDENT(schoolId,classId,studentName,studentPic,studentAge,gender,cardNum,address,state,createDate,";
            insertSql += "doneDate,oUserId,remark) values (?,?,?,?,?,?,?,?,1,now(),now(),?,?)";
            conn.query(insertSql, args, function(err, student){
                if(err){
                    conn.rollback();
                    conn.release();
                    return callback(err);
                }
                var insertRelSql = "insert into XL_USER_STUDENT_REL(userId,studentId,state,createDate,doneDate,oUserId)";
                insertRelSql += " values (?,?,1,now(),now(),?)";
                var studentId = student.insertId;
                if(userId instanceof Array){
                    Student.saveUserStudentRels(conn, insertRelSql, studentId, userId, 0, oUserId, student, callback);
                }else{
                    conn.query(insertRelSql, [userId, studentId, oUserId], function(err, data){
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
                            return callback(err, student);;
                        });
                    });
                }
            });
        });
    });
}

Student.updateSmsFlag = function (flag, relId, callback) {
    mysqlUtil.query("update XL_USER_STUDENT_REL set smsFlag=?,doneDate=now() where relId=?", [flag, relId], callback);
}

Student.saveUserStudentRels = function(conn, insertRelSql, studentId, userIds, index, oUserId, student, callback){
    if(index >=  userIds.length - 1){
        conn.query(insertRelSql, [userIds[index], studentId, oUserId], function(err, data){
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
                return callback(err, student);;
            });
        });
    }else{
        conn.query(insertRelSql, [userIds[index], studentId, oUserId], function(err, data){
            if(err){
                conn.rollback();
                conn.release();
                return callback(err);
            }
            Student.saveUserStudentRels(conn, insertRelSql, studentId, userIds, index + 1, oUserId, student, callback);
        });
    }
}

Student.delete = function(studentId, callback){
    mysqlUtil.getConnection(function(err, conn){
        if(err){
            return callback(err);
        }
        conn.beginTransaction(function(err){
            if(err){
                return callback(err);
            }
            conn.query("update XL_STUDENT set state = 0 where studentId=?", [studentId], function(err, data){
                if(err){
                    conn.rollback();
                    conn.release();
                    return callback(err);
                }
                conn.query("update XL_USER_STUDENT_REL set state = 0 where studentId=?", [studentId], function(err, data){
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

Student.update = function(obj, userId, studentId, callback){
    mysqlUtil.getConnection(function(err, conn){
        if(err){
            return callback(err);
        }
        conn.beginTransaction(function(err){
            if(err){
                return callback(err);
            }
            var updateSql = "update XL_STUDENT set ";
            var args = new Array();
            for(var key in obj){
                updateSql += key + "=?,";
                args.push(obj[key]);
            }
            updateSql = updateSql.substr(0, updateSql.length - 1);
            updateSql += " where studentId=?";
            args.push(studentId);
            conn.query(updateSql, args, function(err, studentData){
                if(err){
                    conn.rollback();
                    conn.release();
                    return callback(err);
                }
                if(userId){
                    var deleteSql = "update XL_USER_STUDENT_REL set state = 0,doneDate=now(),oUserId=? where studentId=?";
                    conn.query(deleteSql, [obj.oUserId,studentId], function(err, data){
                        if(err){
                            conn.rollback();
                            conn.release();
                            return callback(err);
                        }
                        var insertRelSql = "insert into XL_USER_STUDENT_REL(userId,studentId,state,createDate,doneDate,oUserId) values (?,?,1,now(),now(),?)";
                        if(userId instanceof Array){
                            Student.saveUserStudentRels(conn, insertRelSql, studentId, userId, 0, obj.oUserId, studentData, callback);
                        }else{
                            conn.query(insertRelSql, [userId,studentId,obj.oUserId], function(err, data){
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
                                    return callback(err, studentData);
                                });
                            });
                        }
                    });

                }else{
                    conn.commit(function(err){
                        if(err){
                            conn.rollback();
                            conn.release();
                            return callback(err);
                        }
                        conn.release();
                        return callback(err, studentData);;
                    });
                }
            });
        });
    });
}

Student.queryNum = function(obj, schoolIds, callback){
    var whereSql = " 1=1 and A.state=1 ";
    var args = new Array();
    if(obj){
        for(var key in obj){
            var keyValue = obj[key];
            whereSql += " and A." + key;
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
        whereSql += " and A.schoolId in (";
        for(var i = 0; i < schoolIds.length; i ++){
            whereSql += "?,";
            args.push(schoolIds[i]);
        }
        whereSql = whereSql.substr(0, whereSql.length - 1) + ")";
    }
    var countSql = "select count(*) AS total from XL_STUDENT A WHERE " + whereSql;
    mysqlUtil.queryOne(countSql, args, callback);
}

Student.queryPage = function(obj, schoolIds, start, pageSize, callback){
    var whereSql = " 1=1 ";
    var args = new Array();
    if(obj){
        for(var key in obj){
            var keyValue = obj[key];
            whereSql += " and A." + key;
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
        whereSql += " and A.schoolId in (";
        for(var i = 0; i < schoolIds.length; i ++){
            whereSql += "?,";
            args.push(schoolIds[i]);
        }
        whereSql = whereSql.substr(0, whereSql.length - 1) + ")";
    }
    var querySql = "select A.*,B.className,C.schoolName from XL_STUDENT A, XL_CLASS B, XL_SCHOOL C WHERE A.schoolId=C.schoolId and B.classId=A.classId and A.state=1 and " + whereSql;
    querySql += " limit ?,?";
    args.push(start);
    args.push(pageSize);
    mysqlUtil.query(querySql, args, callback);
}

Student.listByStudentId = function(studentId, startDate, start, pageSize, callback){
    Student.queryNumByStudentId(studentId, startDate, function(err, data){
        if(err){
            return callback(err);
        }
        var total = 0;
        if(data){
            total = data.total;
        }
        Student.queryPageByStudentId(studentId, startDate, start, pageSize, function(err, attendances){
            if(err){
                return callback(err);
            }
            callback(null, total, attendances);
        });
    });
}

Student.queryNumByStudentId = function(studentId, startDate, callback){
    var sql = "select count(*) as total from (select A.studentId, 1 as dataType, A.startDate,A.endDate,A.state,A.leaveDays,A.applyPeason from XL_STUDENT_LEAVE A where A.state!=0 and A.startDate>=? and A.studentId=? ";
    sql += "UNION SELECT B.objId, 2 as dataType, B.comeDate,B.leaveDate,B.state,null,null FROM XL_ATTENDANCE B where B.state=1 and B.attendanceDate>=? and B.objId=? and B.attendanceType=1) C";
    mysqlUtil.queryOne(sql, [startDate, studentId, startDate, studentId], callback);
}

Student.queryPageByStudentId = function(studentId, startDate, start, pageSize, callback){
    var sql = "select * from (select A.studentId, 1 as dataType, A.leaveId, A.startDate,A.endDate,A.applyDate as createDate,A.state,A.leaveDays,A.applyPeason,A.reason, A.startDate as orderDate from XL_STUDENT_LEAVE A where A.state!=0 and A.startDate>=? and A.studentId=? ";
    sql += "UNION SELECT B.objId, 2 as dataType, B.attendanceId, B.comeDate,B.leaveDate,B.createDate,B.state,null,null,null, B.attendanceDate as orderDate FROM XL_ATTENDANCE B where B.state=1 and B.attendanceDate>=? and B.objId=? and B.attendanceType=1) C order by C.orderDate desc limit ?,?";
    mysqlUtil.query(sql, [startDate, studentId, startDate, studentId, start, pageSize], callback);
}

Student.listByPage = function(obj, schoolIds, start, pageSize, callback){
    Student.queryNum(obj, schoolIds, function(err, data){
        if(err){
            return callback(err);
        }
        var total = 0;
        if(data){
            total = data.total;
        }
        Student.queryPage(obj, schoolIds, start, pageSize, function(err, users){
            if(err){
                return callback(err);
            }
            return callback(err, total, users);
        });
    });
}
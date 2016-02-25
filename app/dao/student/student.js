var Student = module.exports;
var mysqlUtil = require("../../../core/utils/pool/mysql/mysqlPool");

Student.listByUserId = function (userId, callback) {
    mysqlUtil.query("select A.* from XL_STUDENT A, XL_USER_STUDENT_REL B WHERE A.studentId=B.studentId and B.userId=?", [userId], callback);
}

Student.findOne = function (userId, studentId, callback) {
    mysqlUtil.queryOne("select A.* from XL_STUDENT A, XL_USER_STUDENT_REL B WHERE A.studentId=B.studentId and B.userId=? and A.studentId=?", [userId, studentId], callback);
}

Student.findByStudentId = function(studentId, callback){
    mysqlUtil.queryOne("select * from XL_STUDENT where studentId = ?", [studentId], callback);
}

Student.findStudentInfo = function(studentId, callback){
    mysqlUtil.queryOne("select A.*,B.className,C.schoolName from XL_STUDENT A, XL_CLASS B, XL_SCHOOL C WHERE A.schoolId=C.schoolId and B.classId=A.classId and A.studentId=?", [studentId], callback);
}

Student.findParents = function(studentIds, callback){
    var sql = "select A.*,B.nickName,B.custName from XL_USER_STUDENT_REL A, XL_USER B WHERE A.userId=B.userId and A.studentId in (";
    for(var i = 0; i < studentIds.length; i ++){
        sql += "?,";
    }
    sql = sql.substr(0, sql.length - 1) + ")";
    mysqlUtil.query(sql, studentIds, callback);
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
            var insertSql = "insert into XL_STUDENT(schoolId,classId,studentName,studentAge,gender,cardNum,address,state,createDate,";
            insertSql += "doneDate,oUserId,remark) values (?,?,?,?,?,?,?,1,now(),now(),?,?)";
            conn.query(insertSql, args, function(err, classData){
                if(err){
                    conn.rollback();
                    conn.release();
                    return callback(err);
                }
                var insertRelSql = "insert into XL_USER_STUDENT_REL(userId,studentId,state,createDate,doneDate,oUserId)";
                insertRelSql += " values (?,?,1,now(),now(),?)";
                conn.query(insertRelSql, [userId,classData.insertId,oUserId], function(err, data){
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

Student.delete = function(studentId, callback){
    mysqlUtil.getConnection(function(err, conn){
        if(err){
            return callback(err);
        }
        conn.beginTransaction(function(err){
            if(err){
                return callback(err);
            }
            conn.query("delete from XL_STUDENT where studentId=?", [studentId], function(err, data){
                if(err){
                    conn.rollback();
                    conn.release();
                    return callback(err);
                }
                conn.query("delete from XL_USER_STUDENT_REL where studentId=?", [studentId], function(err, data){
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
            conn.query(updateSql, args, function(err, classData){
                if(err){
                    conn.rollback();
                    conn.release();
                    return callback(err);
                }
                if(userId){
                    var updateRelSql = "update XL_USER_STUDENT_REL set userId=?,doneDate=now(),oUserId=? where studentId=?";
                    conn.query(updateRelSql, [userId,obj.oUserId,studentId], function(err, data){
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
                }else{
                    conn.commit(function(err){
                        if(err){
                            conn.rollback();
                            conn.release();
                            return callback(err);
                        }
                        conn.release();
                        return callback(err, data);;
                    });
                }

            });
        });
    });
}

Student.queryNum = function(obj, callback){
    var whereSql = " 1=1 ";
    var args = new Array();
    if(obj){
        for(var key in obj){
            whereSql += " and A." + key + "=?";
            args.push(obj[key]);
        }
    }
    var countSql = "select count(*) AS total from XL_STUDENT A WHERE " + whereSql;
    mysqlUtil.queryOne(countSql, args, callback);
}

Student.queryPage = function(obj, start, pageSize, callback){
    var whereSql = " 1=1 ";
    var args = new Array();
    if(obj){
        for(var key in obj){
            whereSql += " and A." + key + "=?";
            args.push(obj[key]);
        }
    }
    var querySql = "select A.*,B.className,C.schoolName from XL_STUDENT A, XL_CLASS B, XL_SCHOOL C WHERE A.schoolId=C.schoolId and B.classId=A.classId and " + whereSql;
    querySql += " limit ?,?";
    args.push(start);
    args.push(pageSize);
    mysqlUtil.query(querySql, args, callback);
}

Student.listByPage = function(obj, start, pageSize, callback){
    Student.queryNum(obj, function(err, data){
        if(err){
            return callback(err);
        }
        var total = 0;
        if(data){
            total = data.total;
        }
        Student.queryPage(obj, start, pageSize, function(err, users){
            if(err){
                return callback(err);
            }
            return callback(err, total, users);
        });
    });
}
var Student = module.exports;
var mysqlUtil = require("../../../core/utils/pool/mysql/mysqlPool");

Student.listByUserId = function (userId, callback) {
    mysqlUtil.query("select A.* from XL_STUDENT A, XL_USER_STUDENT_REL B WHERE A.studentId=B.studentId and B.userId=?", [userId], callback);
}

Student.findOne = function (userId, studentId, callback) {
    mysqlUtil.queryOne("select A.* from XL_STUDENT A, XL_USER_STUDENT_REL B WHERE A.studentId=B.studentId and B.userId=? and A.studentId=?", [userId, studentId], callback);
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
            var insertSql = "insert into XL_CLASS(schoolId,classId,studentName,studentAge,gender,cardNum,address,state,createDate,";
            insertSql += "doneDate,oUserId) values (?,?,?,?,?,?,?,1,now(),now(),?)";
            conn.query(insertSql, args, function(err, classData){
                if(err){
                    conn.rollback();
                    conn.release();
                    callback(err);
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
    mysqlUtil.query("delete from XL_STUDENT where studentId=?", [studentId], callback);
}

Student.update = function(obj, studentId, callback){
    var sql = "update XL_STUDENT set ";
    var args = new Array();
    for(var key in obj){
        sql += key + "=?,";
        args.push(obj[key]);
    }
    sql = sql.substr(0, sql.length - 1);
    sql += " where userId=?";
    args.push(studentId);
    mysqlUtil.query(sql, args, callback);
}
var mysqlUtil = require("../../../core/utils/pool/mysql/mysqlPool");

var School = module.exports;

/**
 * 根据园长编号查询学校(园长登录时查询)
 * @param principalId 园长编号
 * @param callback
 */
School.listByPrincipalId = function(principalId, callback){
    mysqlUtil.query("select * from XL_SCHOOL where state=1 and sUserId = ? ", [principalId], callback);
}

/**
 * 根据集团园长查询学校(集团园长登录时查询)
 * @param groupId 集团园长编号
 * @param callback
 */
School.listByGroupId = function(groupId, callback){
    mysqlUtil.query("select A.* from XL_SCHOOL A left join XL_SCHOOL_BRAND B on A.brandId=B.brandId where A.state=1 and B.state=1 and B.bUserId = ? ", [groupId], callback);
}

School.listBrandByGroupId = function(groupId, callback){
    mysqlUtil.query("select * from XL_SCHOOL_BRAND where state=1 bUserId=?", [groupId], callback);
}

/**
 * 根据学校编号查询学校(家长登录选择宝贝时查询）
 * @param schoolId 学校编号
 * @param callback
 */
School.findBySchoolId = function(schoolId, callback){
    mysqlUtil.queryOne("select * from XL_SCHOOL where state=1 and schoolId = ?", [schoolId], callback);
}

School.findBySchoolName = function(schoolName, callback){
    mysqlUtil.queryOne("select * from XL_SCHOOL where state=1 and schoolName = ?", [schoolName], callback);
}

School.findBySchoolIds = function (schoolIds, callback) {
    var appenderId = "";
    var params = [];
    for (var k in schoolIds) {
        appenderId += "?,";
        params.push(schoolIds[k]);
    }
    appenderId = appenderId.substr(0, appenderId.length - 1);
    mysqlUtil.query("select * from XL_SCHOOL where state=1 and schoolId in (" + appenderId + ")", params, callback);
}

School.findByUserAndSchoolId = function(userId, schoolId, callback){
    mysqlUtil.queryOne("select * from XL_SCHOOL where state=1 and sUserId = ? and schoolId = ?", [userId, schoolId], callback);
}

School.findByGroupAndSchoolId = function(groupId, schoolId, callback){
    mysqlUtil.queryOne("select A.* from XL_SCHOOL A left join XL_SCHOOL_BRAND B on A.brandId=B.brandId where A.state=1 and B.bUserId = ? and A.schoolId = ? ", [groupId, schoolId], callback);
}

/**
 * 根据品牌查询学校
 */
School.listByBrandId = function(brandId, callback){
    mysqlUtil.query("select A.*,B.gUserId,B.brandName from XL_SCHOOL A left join XL_SCHOOL_BRAND B on A.brandId=B.brandId where A.state=1 and B.brandId = ? ", [brandId], callback);
}

School.countSchoolByBrandId = function(brandId, callback){
    var sql = "select count(*) as total from XL_SCHOOL where state =1 and brandId = ?";
    mysqlUtil.queryOne(sql, brandId, callback);
}

/**
 * 根据品牌查询学校
 */
School.findInfoByBrandId = function(schoolId, callback){
    mysqlUtil.queryOne("select A.*,B.bUserId,B.brandName,C.custName,C.nickName,C.userName from XL_SCHOOL A left join XL_SCHOOL_BRAND B on A.brandId=B.brandId join XL_USER C on A.sUserId=C.userId where A.state=1 and A.schoolId = ? ", [schoolId], callback);
}
/**
 * 查询所有学校(超级园长登录时查询所有学校)
 * @param callback
 */
School.listAllSchool = function(callback){
    mysqlUtil.query("select A.* from XL_SCHOOL A left join XL_SCHOOL_BRAND B on A.brandId=B.brandId where A.state=1", [], callback);
}

/**
 * 学校班级查询
 * @param schoolId
 * @param callback
 */
School.listClassBySchoolId = function(schoolId, callback){
    var sql = "select A.className,A.classId,A.tUserId,C.userName,C.custName,C.nickName,count(*) as studentNum from XL_CLASS A, XL_STUDENT B, XL_USER C where "
    sql += "A.classId=B.classId and A.tUserId=C.userId and A.state=1 and B.state=1 and A.schoolId=? group by A.className,A.classId,A.tUserId,C.userName,C.custName,C.nickName";
    mysqlUtil.query(sql, [schoolId], callback);
}

/**
 * 学校教师查询
 * @param schoolId
 * @param callback
 */
School.listTeacherBySchoolId = function(schoolId, callback){
    var sql = "select A.classId,A.className,B.jobType,C.userId,C.userName,C.nickName,C.custName,C.userUrl from XL_CLASS A,XL_CLASS_TEACHER_REL B,XL_USER C where A.classId=B.classId and B.tUserId=C.userId and A.state=1 and B.state=1 and A.schoolId=? order by classId";
    mysqlUtil.query(sql, [schoolId], callback);
}

/**
 * 查询学校数量
 * @param schoolBbj 学校条件
 * @param brandObj 品牌条件
 * @param callback
 */
School.queryNum = function(schoolObj, brandObj, schoolIds, callback){
    var whereSql = " A.state=1 ";
    var args = new Array();
    if(schoolObj){
        for(var key in schoolObj){
            if ("schoolName" == key) {
                whereSql += " and A." + key + " like ? ";
                args.push("%" + schoolObj[key] + "%");
            } else {
                whereSql += " and A." + key + "=?";
                args.push(schoolObj[key]);
            }
        }
    }
    if(brandObj){
        for(var key in brandObj){
            whereSql += " and B." + key + "=?";
            args.push(brandObj[key]);
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
    var countSql = "select count(*) as total from XL_SCHOOL A left join XL_SCHOOL_BRAND B on A.brandId=B.brandId join XL_USER C on A.sUserId=C.userId where " + whereSql;
    mysqlUtil.queryOne(countSql, args, callback);
}

/**
 * 分页查询学校信息
 * @param schoolObj 学校条件
 * @param brandObj 品牌条件
 * @param start 起始条数
 * @param pageSize 每页条数
 * @param callback
 */
School.queryPage = function(schoolObj, brandObj, schoolIds, start, pageSize, callback){
    var whereSql = " A.state=1 ";
    var args = new Array();
    if(schoolObj){
        for(var key in schoolObj){
            if ("schoolName" == key) {
                whereSql += " and A." + key + " like ? ";
                args.push("%" + schoolObj[key] + "%");
            } else {
                whereSql += " and A." + key + "=?";
                args.push(schoolObj[key]);
            }
        }
    }
    if(brandObj){
        for(var key in brandObj){
            whereSql += " and B." + key + "=?";
            args.push(brandObj[key]);
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
    var querySql = "select A.*,B.bUserId,B.brandName,C.custName,C.nickName,C.userName from XL_SCHOOL A left join XL_SCHOOL_BRAND B on A.brandId=B.brandId join XL_USER C on A.sUserId=C.userId where " + whereSql;
    querySql += " limit ?,?";
    args.push(start);
    args.push(pageSize);
    mysqlUtil.query(querySql, args, callback);
}

/**
 * 查询学校数量及信息
 * @param schoolObj 学校条件
 * @param brandObj 品牌条件
 * @param start 起始条数
 * @param pageSize 每页条数
 * @param callback
 */
School.listByPage = function(schoolObj, brandObj, schoolIds, start, pageSize, callback){
    School.queryNum(schoolObj, brandObj, schoolIds, function(err, data){
        if(err){
            return callback(err);
        }
        var total = 0;
        if(data){
            total = data.total;
        }
        School.queryPage(schoolObj, brandObj, schoolIds, start, pageSize, function(err, users){
            if(err){
                return callback(err);
            }
            return callback(err, total, users);
        });
    });
}

School.listTeachers = function(schoolId, callback){
    var sql = "select * from XL_USER t where t.groupId=20 and t.schoolId=? and t.state!=0 and not EXISTS (select m.tUserId from XL_CLASS_TEACHER_REL m WHERE m.tUserId=t.userId and m.state=1)";
    mysqlUtil.query(sql, [schoolId], callback);
}

/**
 * 修改学校
 * @param obj 修改内容
 * @param schoolId 学校编号
 * @param callback
 */
School.update = function(obj, schoolId, callback){
    var sql = "update XL_SCHOOL set ";
    var args = new Array();
    for(var key in obj){
        sql += key + "=?,";
        args.push(obj[key]);
    }
    sql = sql.substr(0, sql.length - 1);
    sql += " where schoolId=?";
    args.push(schoolId);
    mysqlUtil.query(sql, args, callback);
}

/**
 * 删除学校
 * @param schoolId 学校编号
 * @param callback
 */
School.del = function(oUserId, schoolId, callback){
    mysqlUtil.getConnection(function(err, conn){
        if(err){
            return callback(err, null);
        }
        conn.beginTransaction(function(err){
            if(err){
                return callback.apply(null, [err, null]);
            }
            var sql = "update XL_SCHOOL set state=0,doneDate=now(),oUserId=? where schoolId=?";
            conn.query(sql, [oUserId, schoolId], function(err, data){
                if(err){
                    conn.rollback();
                    conn.release();
                    return callback(err, null);
                }
                var updateSql = "update XL_USER set schoolId = null,doneDate=now() where schoolId = ? and groupId=30";
                conn.query(updateSql, [schoolId], function(err, data){
                    if(err){
                        conn.rollback();
                        conn.release();
                        return callback(err, null);
                    }
                    conn.commit(function(err){
                        if(err){
                            conn.rollback();
                            conn.release();
                            return callback(err, null);
                        }
                        conn.release();
                        return callback(null, data);
                    });
                });
            });
        });
    });
}

/**
 * 保存学校信息
 * @param args 参数
 * @param callback
 */
School.save = function(args, userId, callback){
    mysqlUtil.getConnection(function(err, conn){
        if(err){
            return callback(err, null);
        }
        conn.beginTransaction(function(err){
            if(err){
                return callback.apply(null, [err, null]);
            }
            var sql = "insert into XL_SCHOOL(brandId,schoolName,sUserId,address,billId,schoolDesc,schoolUrl,h5Url,h5Title,state,";
            sql += "createDate,doneDate,oUserId) values (?,?,?,?,?,?,?,?,?,1,now(),now(),?)";
            conn.query(sql, args, function(err, school){
                if(err){
                    conn.rollback();
                    conn.release();
                    return callback(err, null);
                }
                if(!school){
                    conn.rollback();
                    conn.release();
                    return callback(new Error("学校新增失败"), null);
                }
                var schoolId = school.insertId;
                var updateSql = "update XL_USER set schoolId = ?,doneDate=now() where userId = ?";
                conn.query(updateSql, [schoolId, userId], function(err, data){
                    if(err){
                        conn.rollback();
                        conn.release();
                        return callback(err, null);
                    }
                    conn.commit(function(err){
                        if(err){
                            conn.rollback();
                            conn.release();
                            return callback(err, null);
                        }
                        conn.release();
                        return callback(null, school);
                    });
                });
            });
        });
    });
}
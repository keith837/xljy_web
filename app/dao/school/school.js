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
    mysqlUtil.query("select A.* from XL_SCHOOL A left join XL_SCHOOL_BRAND B on A.brandId=B.brandId where A.state=1 and B.bUserId = ? ", [groupId], callback);
}

/**
 * 根据学校编号查询学校(家长登录选择宝贝时查询）
 * @param schoolId 学校编号
 * @param callback
 */
School.findBySchoolId = function(schoolId, callback){
    mysqlUtil.queryOne("select * from XL_SCHOOL where state=1 and schoolId = ?", [schoolId], callback);
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

/**
 * 根据品牌查询学校
 */
School.findInfoByBrandId = function(schoolId, callback){
    mysqlUtil.queryOne("select A.*,B.gUserId,B.brandName from XL_SCHOOL A left join XL_SCHOOL_BRAND B on A.brandId=B.brandId where A.state=1 and A.schoolId = ? ", [schoolId], callback);
}
/**
 * 查询所有学校(超级园长登录时查询所有学校)
 * @param callback
 */
School.listAllSchool = function(callback){
    mysqlUtil.query("select A.* from XL_SCHOOL A left join XL_SCHOOL_BRAND B on A.brandId=B.brandId where A.state=1", [], callback);
}

/**
 * 查询学校数量
 * @param schoolBbj 学校条件
 * @param brandObj 品牌条件
 * @param callback
 */
School.queryNum = function(schoolObj, brandObj, callback){
    var whereSql = " A.state=1 ";
    var args = new Array();
    if(schoolObj){
        for(var key in obj){
            whereSql += " and A." + key + "=?";
            args.push(schoolObj[key]);
        }
    }
    if(brandObj){
        for(var key in obj){
            whereSql += " and B." + key + "=?";
            args.push(brandObj[key]);
        }
    }
    var countSql = "select count(*) from XL_SCHOOL A left join XL_SCHOOL_BRAND B on A.brandId=B.brandId where " + whereSql;
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
School.queryPage = function(schoolObj, brandObj, start, pageSize, callback){
    var whereSql = " A.state=1 ";
    var args = new Array();
    if(schoolObj){
        for(var key in obj){
            whereSql += " and A." + key + "=?";
            args.push(schoolBbj[key]);
        }
    }
    if(brandObj){
        for(var key in obj){
            whereSql += " and B." + key + "=?";
            args.push(brandObj[key]);
        }
    }
    var querySql = "select A.*,B.gUserId,B.brandName from XL_SCHOOL A left join XL_SCHOOL_BRAND B on A.brandId=B.brandId where " + whereSql;
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
School.listByPage = function(schoolObj, brandObj, start, pageSize, callback){
    School.queryNum(obj, function(err, data){
        if(err){
            return callback(err);
        }
        var total = 0;
        if(data){
            total = data.total;
        }
        School.queryPage(obj, start, pageSize, function(err, users){
            if(err){
                return callback(err);
            }
            return callback(err, total, users);
        });
    });
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
School.del = function(schoolId, callback){
    mysqlUtil.query("update XL_SCHOOL set state=0 where schoolId=?", [schoolId], callback);
}

/**
 * 保存学校信息
 * @param args 参数
 * @param callback
 */
School.save = function(args, callback){
    var sql = "insert into XL_SCHOOL(brandId,schoolName,sUserId,address,billId,schoolDesc,schoolUrl,h5Url,h5Title,state,";
    sql += "createDate,doneDate,oUserId) values (?,?,?,?,?,?,?,?,?,1,now(),now(),?)";
    mysqlUtil.query(sql, args, callback);
}
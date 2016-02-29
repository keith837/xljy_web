var mysqlUtil = require("../../../core/utils/pool/mysql/mysqlPool");

var Brand = module.exports;

Brand.findByBrandId = function(brandId, callback){
    var sql = "select A.*,B.custName,B.userName,B.nickName from XL_SCHOOL_BRAND A, XL_USER B where A.bUserId=B.userId and";
    sql += " A.state = 1 and brandId = ?";
    mysqlUtil.queryOne(sql, [brandId], callback);
}

/**
 * 查询品牌数量
 * @param obj 查询条件
 * @param callback
 */
Brand.queryNum = function(obj, callback){
    var whereSql = " A.state=1 ";
    var args = new Array();
    if(obj){
        for(var key in obj){
            whereSql += " and A." + key + "=?";
            args.push(schoolObj[key]);
        }
    }
    var countSql = "select count(*) as total from XL_SCHOOL_BRAND A, XL_USER B where A.bUserId=B.userId where " + whereSql;
    mysqlUtil.queryOne(countSql, args, callback);
}

/**
 * 分页查询品牌信息
 * @param obj 查询条件
 * @param start 起始条数
 * @param pageSize 每页条数
 * @param callback
 */
Brand.queryPage = function(obj, start, pageSize, callback){
    var whereSql = " A.state=1 ";
    var args = new Array();
    if(obj){
        for(var key in obj){
            whereSql += " and A." + key + "=?";
            args.push(obj[key]);
        }
    }
    var querySql = "select A.*,B.custName,B.userName,B.nickName from XL_SCHOOL_BRAND A, XL_USER B where A.bUserId=B.userId where " + whereSql;
    querySql += " limit ?,?";
    args.push(start);
    args.push(pageSize);
    mysqlUtil.query(querySql, args, callback);
}

/**
 * 查询品牌数量及信息
 * @param obj 查询条件
 * @param start 起始条数
 * @param pageSize 每页条数
 * @param callback
 */
Brand.listByPage = function(obj, start, pageSize, callback){
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
Brand.update = function(obj, brandId, callback){
    var sql = "update XL_SCHOOL_BRAND set ";
    var args = new Array();
    for(var key in obj){
        sql += key + "=?,";
        args.push(obj[key]);
    }
    sql = sql.substr(0, sql.length - 1);
    sql += " where brandId=?";
    args.push(brandId);
    mysqlUtil.query(sql, args, callback);
}

/**
 * 删除品牌信息
 * @param schoolId 品牌编号
 * @param callback
 */
Brand.del = function(brandId, callback){
    mysqlUtil.query("update XL_SCHOOL_BRAND set state=0 where brandId=?", [brandId], callback);
}

/**
 * 保存品牌信息
 * @param args 参数
 * @param callback
 */
Brand.save = function(args, callback){
    var sql = "insert into XL_SCHOOL_BRAND(brandName,bUserId,brandDesc,state,createDate,doneDate,oUserId,remark";
    sql += ") values (?,?,?,1,now(),now(),?,?)";
    mysqlUtil.query(sql, args, callback);
}
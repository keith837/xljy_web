var mysqlUtil = require("../../../core/utils/pool/mysql/mysqlPool");

var Grade = module.exports;

/**
 * 查询年级数量
 * @param obj 查询条件
 * @param callback
 */
Grade.queryNum = function(obj, callback){
    var whereSql = " A.state=1 ";
    var args = new Array();
    if(obj){
        for(var key in obj){
            whereSql += " and A." + key + "=?";
            args.push(obj[key]);
        }
    }
    var countSql = "select count(*) as total from XL_GRADE A, XL_SCHOOL B where A.schoolId=B.schoolId and " + whereSql;
    mysqlUtil.queryOne(countSql, args, callback);
}

/**
 * 分页查询年级信息
 * @param obj 查询条件
 * @param start 起始条数
 * @param pageSize 每页条数
 * @param callback
 */
Grade.queryPage = function(obj, start, pageSize, callback){
    var whereSql = " A.state=1 ";
    var args = new Array();
    if(obj){
        for(var key in obj){
            whereSql += " and A." + key + "=?";
            args.push(obj[key]);
        }
    }
    var querySql = "select A.*,B.schoolName from XL_GRADE A, XL_SCHOOL B where A.schoolId=B.schoolId and " + whereSql;
    querySql += " limit ?,?";
    args.push(start);
    args.push(pageSize);
    mysqlUtil.query(querySql, args, callback);
}

Grade.listByPage = function(obj, start, pageSize, callback){
    Grade.queryNum(obj, function(err, data){
        if(err){
            return callback(err);
        }
        var total = 0;
        if(data){
            total = data.total;
        }
        Grade.queryPage(obj, start, pageSize, function(err, users){
            if(err){
                return callback(err);
            }
            return callback(err, total, users);
        });
    });
}




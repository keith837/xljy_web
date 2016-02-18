/**
 * Created by wenhao on 2016/2/10.
 */
var mysqlUtil = require("../../../core/utils/pool/mysql/mysqlPool");
var Point = module.exports;

Point.queryUserPoint = function(userId, callback){
    mysqlUtil.query("select * from XL_USER_POINT where userId = ? ", [userId], callback);
}

Point.listAll=function(schoolId,classId,userId,callback){
    var querySql = "select * from XL_USER_POINT where 1=1 ";
    var pointArgs = new Array();
    if(schoolId!=null){
        querySql += " and userId in (select userId from XL_CLASS_TEACHER_REL where schoolId = ? )";
        pointArgs.push(schoolId);
    }
    if(classId!=null){
        querySql += " and userId in (select userId from XL_CLASS_TEACHER_REL where classId = ? )";
        pointArgs.push(classId);
    }
    if(userId!=null){
        querySql += " and userId = ? ";
        pointArgs.push(userId);
    }
    if(pointArgs!=null){
        mysqlUtil.query(querySql, pointArgs, callback);
    }

}

Point.create = function(pointNum,userId,type, callback){
    mysqlUtil.getConnection(function(err, conn){
        if(err){
            callback.apply(null, [err, null]);
        }
        conn.beginTransaction(function(err){
            if(err){
                callback.apply(null, [err, null]);
            }
            var updateSql = "update XL_USER set pointNum = pointNum + ?,doneDate=now() where userId=?";
            if(type=="0"){
                updateSql = "update XL_USER set pointNum = pointNum - ?,doneDate=now() where userId=?";
            }
            var userArgs = new Array();
            userArgs.push(pointNum,userId);
            conn.query(updateSql, userArgs, function(err, data){
                if(err){
                    conn.rollback();
                    conn.release();
                    callback.apply(null, [err, null]);
                }
                var pointSql = "insert into XL_USER_POINT(userId,ruleId,pointNum,expDate,state,createDate,doneDate,oUserId)";
                pointSql += " values (?,'1',?,concat(YEAR(now()),'-12-31'),1,now(),now(),'99')";
                var pointArgs = new Array();
                if(type=="1"){
                    pointArgs.push(userId,pointNum);
                }
                if(type=="0"){
                    pointArgs.push(userId,-pointNum);
                }
                conn.query(pointSql, pointArgs, function(err, data){
                    if(err){
                        conn.rollback();
                        conn.release();
                        callback.apply(null, [err, null]);
                    }
                    conn.commit(function(err){
                        if(err){
                            conn.rollback();
                            conn.release();
                            callback.apply(null, [err, null]);
                        }
                        conn.release();
                        callback.apply(null, [null, data]);
                    });
                });
            });
        });
    });
}
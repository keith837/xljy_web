var Sports = module.exports;
var mysqlUtil = require("../../../core/utils/pool/mysql/mysqlPool");

Sports.countByMonth = function(whereSql, args, callback){
    var sql = "select timeMonth, sum(calValue) as calValue from XL_SPORTS where" + whereSql + " group by timeMonth order by timeMonth";
    mysqlUtil.query(sql, args, callback);
}

Sports.countByWeek = function(whereSql, args, callback){
    var sql = "select timeWeek, sum(calValue) as calValue from XL_SPORTS where" + whereSql + " group by timeWeek order by timeWeek";
    mysqlUtil.query(sql, args, callback);
}

Sports.countByDay = function(whereSql, args, callback){
    var sql = "select timeDay, sum(calValue) as calValue from XL_SPORTS where" + whereSql + " group by timeDay order by timeDay";
    mysqlUtil.query(sql, args, callback);
}

Sports.countByHour = function(whereSql, args, callback){
    var sql = "select timeHour, sum(calValue) as calValue from XL_SPORTS where" + whereSql + " group by timeHour order by timeHour";
    mysqlUtil.query(sql, args, callback);
}

Sports.countByMinute = function(whereSql, args, callback){
    var sql = "select timeMinute, sum(calValue) as calValue from XL_SPORTS where" + whereSql + " group by timeMinute order by timeMinute";
    mysqlUtil.query(sql, args, callback);
}

Sports.listByCond = function(whereSql, args, callback){
    var sql = "select * from XL_SPORTS where" + whereSql + " order by time";
    mysqlUtil.query(sql, args, callback);
}

Sports.list = function(dataType, qryObj, startTime, endTime, callback){
    var whereSql = " 1=1 ";
    var tempArgs = new Array();
    if(qryObj){
        for(var key in qryObj){
            whereSql += " and " + key + " = ?";
            tempArgs.push(qryObj[key]);
        }
    }
    if(startTime){
        whereSql += " and time >= ?";
        tempArgs.push(startTime);
    }
    if(endTime){
        whereSql += " and time <= ?";
        tempArgs.push(endTime);
    }
    if(dataType == 1){
        Sports.countByMinute(whereSql, tempArgs, callback);
    }else if(dataType == 2){
        Sports.countByHour(whereSql, tempArgs, callback);
    }else if(dataType == 3){
        Sports.countByDay(whereSql, tempArgs, callback);
    }else if(dataType == 4){
        Sports.countByWeek(whereSql, tempArgs, callback);
    }else if(dataType == 5){
        Sports.countByMonth(whereSql, tempArgs, callback);
    }else{
        Sports.listByCond(whereSql, tempArgs, callback);
    }
}


Sports.save = function(args, callback){
    var sql = "insert into XL_SPORTS(reversion,studentId,time,sportsDate,calValue,timeMonth,timeWeek,timeDay,timeHour,timeMinute,createDate) values (?,?,?,?,?,?,?,?,?,?)";
    mysqlUtil.query(sql, args, callback);
}

Sports.saveBatch = function(studentId, reversion, args, callback){
    mysqlUtil.getConnection(function(err, conn){
        if(err){
            return callback(err, null);
        }
        conn.beginTransaction(function(err){
            if(err){
                conn.release();
                return callback(err, null);
            }
            var sql = "insert into XL_SPORTS(reversion,studentId,time,sportsDate,calValue,timeMonth,timeWeek,timeDay,timeHour,timeMinute,createDate) values ?";
            conn.query(sql, [args], function(err, data){
                if(err){
                    conn.rollback();
                    conn.release();
                    return callback(err, null);
                }
                var listSql = "select reversion,identifier from XL_SPORTS where reversion=? and studentId=? order by identifier";
                conn.query(listSql, [reversion, studentId], function(err, datas) {
                    if (err) {
                        conn.rollback();
                        conn.release();
                        return callback(err, null);
                    }
                    conn.commit(function (err) {
                        if (err) {
                            conn.rollback();
                            conn.release();
                            return callback(err, null);
                        }
                        conn.release();
                        return callback(null, datas);
                    });
                });
            });
        });
    });
}
var Group = module.exports;
var mysqlUtil = require("../../../core/utils/pool/mysql/mysqlPool")

Group.queryAllNum = function (condition, params, callback) {
    var sql = "select count(*) AS total from XL_USER_GROUP m where " + condition;
    mysqlUtil.queryOne(sql, params, function (err, res) {
        if (err) {
            return callback(err);
        }
        callback(err, res.total);
    });
}

Group.mylistByGroupId = function(groupId, callback){
    var sql = "select * from XL_USER_GROUP where groupId < ?";
    mysqlUtil.query(sql, [groupId], callback);
}

Group.queryPage = function (start, pageSize, queryCondition, callback) {
    var sqlCondition = " m.state=1 ";
    var sqlParams = [];

    if (queryCondition) {
        for (var key in queryCondition) {
            if(key=="groupName"){
                sqlCondition += "and m." + key + " like ? ";
                sqlParams.push('%'+queryCondition[key]+'%');
            }else{
                sqlCondition += "and m." + key + "=? ";
                sqlParams.push(queryCondition[key]);
            }


        }
    }

    Group.queryAllNum(sqlCondition, sqlParams, function (err, totalCount) {
        if (err) {
            return callback(err, null);
        }
        if (totalCount === 0) {
            return callback(err, 0, []);
        }

        sqlCondition += "limit ?,?";
        sqlParams.push(start);
        sqlParams.push(pageSize);

        var sql = "select m.groupId,m.groupName,m.roleId,m.groupDesc,DATE_FORMAT(m.createDate,   '%Y-%m-%d %H:%i:%S') as createDate,A.custName from XL_USER_GROUP m,XL_USER A where m.oUserId=A.userId and " + sqlCondition;
        mysqlUtil.query(sql, sqlParams, function (err, res) {
            callback(err, totalCount, res);
        });
    });
}

Group.add = function (group, callback) {
    mysqlUtil.queryOne("select count(*) as total from XL_USER_GROUP where groupName=?", [group.groupName], function (err, res) {
        if (err) {
            return callback(err);
        } else if (res.total > 0) {
            return callback(new Error("用户组已经存在[" + group.groupName + "]."));
        }
        var params = [];
        params.push(group.roleId);
        params.push(group.groupName);
        params.push(group.groupDesc);
        params.push(group.oUserId);
        mysqlUtil.query("insert into XL_USER_GROUP(roleId,groupName,groupDesc,sortId,state,createDate,doneDate,oUserId) values(?,?,?,50,1,now(),now(),?)", params, function (err, res) {
            if (err) {
                return callback(err);
            }
            callback(err, res.insertId);
        });
    });
}

Group.del = function (id, callback) {
    mysqlUtil.query("update XL_USER_GROUP set state=0 where groupId=? ", [id], callback);
}


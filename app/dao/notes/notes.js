/**
 * Created by Jerry on 2/11/2016.
 */

var Notice = module.exports;
var mysqlUtil = require("../../../core/utils/pool/mysql/mysqlPool");

Notice.queryByNotesType = function (start, pageSize, queryCondition, callback) {

    var sql = "select * from XL_WORK_NOTES m where m.state=1 ";
    var params = [];

    var sqlCondition = "";
    if (queryCondition || queryCondition.length > 0) {
        for (var i in queryCondition) {
            var opr = queryCondition[i].opr;
            if (opr == "like") {
                sqlCondition += "and " + queryCondition[i].key + " " + opr + " ? ";
                params.push("%" + queryCondition[i].val + "%");
            } else if (opr == "in") {
                var ids = queryCondition[i].val;
                var appenderId = "";
                for (var k in ids) {
                    appenderId += "?,";
                    params.push(ids[k]);
                }
                appenderId = appenderId.substr(0, appenderId.length - 1);
                sqlCondition += "and " + queryCondition[i].key + " " + opr + " (" + appenderId + ") ";
            } else {
                sqlCondition += "and " + queryCondition[i].key + " " + opr + " ? ";
                params.push(queryCondition[i].val);
            }
        }
    }
    sql = sql + sqlCondition;

    var countSQL = "select count(*) as total from (" + sql + ") m";
    sql = "select a.*,b.custName as tCustName,b.nickName as tNickName,b.userUrl as tUserUrl from (select * from (" + sql + " order by notesId desc) m limit ?,?) a left join XL_USER b on a.tUserId=b.userId";
    mysqlUtil.queryOne(countSQL, params, function (err, res) {
        if (err) {
            return callback(err);
        }
        var totalNum = res.total;
        if (totalNum === 0) {
            return callback(err, 0, []);
        }
        params.push(start);
        params.push(pageSize);
        mysqlUtil.query(sql, params, function (err, res) {
            if (err) {
                return callback(err);
            }
            callback(err, totalNum, res);
        });
    });
}

Notice.publishNotes = function (notesParam, callback) {
    var sql = "insert into XL_WORK_NOTES(notesTypeId,notesTitle,notesContext,state,createDate,doneDate,schoolId,classId,userId,schoolName,className,userName,nickName,tUserId,picUrl,width,height)";
    sql += "values(?,?,?,1,now(),now(),?,?,?,?,?,?,?,?,?,?,?)";
    mysqlUtil.query(sql, notesParam, function (err, data) {
        if (err) {
            return callback(err);
        }
        return callback(err, data.insertId);
    });
}


Notice.delete = function (notesId, userId, callback) {
    mysqlUtil.query("update XL_WORK_NOTES set state=0,userId=?,doneDate=now() where notesId=?", [userId, notesId], callback);
}

Notice.queryDetail = function (notesId, callback) {
    mysqlUtil.query("select a.*,b.custName as tCustName,b.nickName as tNickName,b.userUrl as tUserUrl from XL_WORK_NOTES a left join XL_USER b on a.tUserId=b.userId where a.notesId=?", [notesId], callback);
}


Notice.editNotes = function (notesParam, callback) {
    mysqlUtil.query("select * from XL_WORK_NOTES where notesId=? and state=1", [notesParam[7]], function (err, data) {
        if (err) {
            return callback(err);
        }
        if (!data || data.length !== 1) {
            return callback(new Error("查询不到笔记[" + notesParam[7] + "]"));
        } else {
            if (data[0].userId !== notesParam[0]) {
                return callback(new Error("笔记必须由创建者修改."));
            }
        }
        var updateSql = "update XL_WORK_NOTES set tUserId=?,notesTitle=?,notesContext=?,picUrl=?,width=?,height=?,doneDate=now() where notesId=?";
        mysqlUtil.query(updateSql, notesParam.slice(1), callback);

    });

}


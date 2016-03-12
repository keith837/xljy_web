/**
 * Created by pz on 16/2/17.
 */

var xlsx = require('node-xlsx');
var fs = require("fs");
var db = require("../pool/mysql/mysqlPool")

var util = require("utility");
var timeUtils = require("./timeUtils");


var input = module.exports.input = function (filter, result, tablename, userObj, cb) {
    var title = [];

    var mapi2 = {}
    var valdata = [];
    for (var x in result) {
        if (x == 0) {
            //做出对应map
            for (var xxx in result[0]) {
                mapi2[xxx] = result[0][xxx];
            }
            for (var xxx in mapi2) {
                if (typeof filter[mapi2[xxx]] == "string") {
                    title.push(filter[mapi2[xxx]]);
                } else if (typeof filter[mapi2[xxx]] == "object") {
                    title.push(filter[mapi2[xxx]].name);
                }
            }
            //
            title.push("userId");
            title.push("classId");
            title.push("schoolId");
            title.push("batchId");

            title = title.join(",");
            continue;
        }


        var temparr = [];
        var hasData = false;
        for (var i in result[x]) {
            if (result[x][0] == "") {
                break;
            }
            if (typeof filter[mapi2[i]] == "string") {
                temparr.push(result[x][i])
            } else if (typeof filter[mapi2[i]] == "object") {
                temparr.push(filter[mapi2[i]].oper(result[x][i]))
            }
            hasData = true;
        }
        if (hasData) {
            temparr.push(userObj.userId);
            temparr.push(userObj.classId);
            temparr.push(userObj.schoolId);
            temparr.push(userObj.batchId);
            valdata.push(temparr);
        }

    }
    var sql1 = "insert into ?? (" + title + ") values ?";
    var values = [tablename, valdata];
    db.query(sql1, values, cb)
}


var output = module.exports.output = function (filter, SQL, args, cb, needTableHead) {
    needTableHead = needTableHead || true;
    db.query(SQL, args, function (err, res) {
        if (err) {
            cb(err);
            return;
        }
        var baseArr = [];
        if (needTableHead) {
            var thead = [];
            for (var x in filter) {
                if (typeof(filter[x]) == "string") {
                    thead.push(filter[x])
                } else if (typeof(filter[x]) == "object") {
                    thead.push(filter[x].name)
                }
            }
            baseArr.push(thead);
        }
        //处理表数据
        for (var i in res) {
            var rowdata = res[i];
            var row = [];
            for (var x in filter) {
                if (typeof(filter[x]) == "string") {
                    row.push(rowdata[x]);
                } else if (typeof(filter[x]) == "object") {
                    row.push(filter[x].oper(rowdata[x]));
                }
            }
            baseArr.push(row);
        }
        var buffer = xlsx.build([{name: "sheet1", data: baseArr}]); // returns a buffer
        var filename = "app/cache/xls" + timeUtils.Format("yyyy_MM_dd_hh_mm_ss") + "_" + util.md5("" + Math.random()).substr(0, 5) + ".xlsx";
        fs.writeFileSync(filename, buffer, 'binary');
        cb(null, filename);
    })
}
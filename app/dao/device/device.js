var device = module.exports;
var mysqlUtil = require("../../../core/utils/pool/mysql/mysqlPool")

device.queryAllNum = function (callback) {
    mysqlUtil.queryOne("SELECT count(*) as co FROM XL_DEVICE", [],
        function (err, res) {
            if (err) {
                callback(err);
                return;
            }
            callback(err, res.co);
        });
}
device.queryPage = function (start, pagesize, callback) {
    device.queryAllNum(function (err, allsize) {
        if (err) {
            callback(err, null);
            return;
        }
        mysqlUtil.query("SELECT * FROM XL_DEVICE LIMIT ?,?", [start, pagesize], function (err, res) {
            callback(err, allsize, res);
        })
    })
}
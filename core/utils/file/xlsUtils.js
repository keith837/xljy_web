/**
 * Created by pz on 16/2/3.
 */
var node_xj = require("xls-to-json");
var xlsutils = function () {
    node_xj({
        input: "a1.xls",  // input xls
        output: "app/cache/json/output.json", // output json
        //sheet: "sheet1",  // specific sheetname
    }, function (err, result) {
        if (err) {
            console.error(err);
        } else {
            console.log(result[0]['日狗']);
        }
    });

}
xlsutils.prototype.a = function () {

}
module.exports = xlsutils;
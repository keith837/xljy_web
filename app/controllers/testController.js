/**
 * Created by pz on 16/1/31.
 */
var formidable = require("formidable");
var basicController = require("../../core/utils/controller/basicController");
var async = require("async");
module.exports = new basicController(__filename).init({
    //xls提交页
    postXls: function (request, response) {
        response.render('test/postXls', {});
    },
    //xls上传处理页
    doUploadXls: function (request, response, next) {
        var self = this;
        var form = new formidable.IncomingForm();
        form.uploadDir = this.uploadJsonPath;
        var savepath = __dirname + "/../../app/cache/xls";

        async.waterfall([
                function (cb) {
                    form.parse(request, cb);
                },
                function (fields, files, cb) {
                    console.log(arguments);
                    var info = self.fileUtils.saveFormUploadsWithAutoName([files.xls], savepath);
                    var node_xj = require("xls-to-json");
                    node_xj({
                        input: __dirname + "/../cache/xls/" + info[0],
                        output: __dirname + "/../cache/json/" + info[0] + ".json"
                        //sheet: "sheet1",  // specific sheetname
                    }, cb);
                }
            ],
            function (err, res) {
                if (err) {
                    next(err);
                }
                console.log("执行完成");
                response.json(res);
                response.end();
            })


        form.parse(request, function (error, fields, files) {
            var info;
            try {
                info = self.fileUtils.saveFormUploadsWithAutoName([files.xls], savepath);
            } catch (e) {
            }

            var node_xj = require("xls-to-json");
            node_xj({
                input: __dirname + "/../cache/xls/" + info[0],
                output: __dirname + "/../cache/json/" + info[0] + ".json"
                //sheet: "sheet1",  // specific sheetname
            }, function (err, result) {
                if (err) {
                    next(err);
                } else {
                    //xls已经被转成了json ,进行入库处理
                    response.json(result);
                    response.end();
                }
            });
        });
    }


})

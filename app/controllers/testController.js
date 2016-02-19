/**
 * Created by pz on 16/1/31.
 */
var xlsx = require('node-xlsx');
var formidable = require("formidable");
var basicController = require("../../core/utils/controller/basicController");
var async = require("async");
var xlsUtils = require("../../core/utils/common/xlsUtils");
module.exports = new basicController(__filename).init({
    //xls提交页
    postXls: function (request, response) {
        response.render('test/postXls', {});
    },
    doUploadXls: function (request, response, next) {
        var self = this;
        var form = new formidable.IncomingForm();
        form.uploadDir = this.uploadJsonPath;
        var savepath = __dirname + "/../../app/cache/xls";
        form.parse(request, function (error, fields, files) {
            var info;
            try {
                info = self.fileUtils.saveFormUploadsWithAutoName([files.xls], savepath);
                info = info[0];
            } catch (e) {
                next(e);
                return;
            }
            var data = (xlsx.parse("app/cache/xls/" + info)[0].data);
            var filter = [];
            filter['学生'] = "stu";
            filter['设备标识'] = {
                "name": "devicetag", oper: function (v) {
                    return v + "_andin";
                }
            }
            filter['设备名称'] = "devicename";

            xlsUtils.input(filter, data, "test_xls_in", function (err, res) {
                if (err) {
                    next(err);
                    return;
                }
                response.json("上传成功");
            })

        });
    },
    exportXls: function (request, response, next) {
        var self = this;
        var filter = [];
        filter['devicename'] = "设备名称1";
        filter['devicetag'] = {
            "name": "设备标识", oper: function (v) {    //过滤器
                return v = v + "_andin";
            }
        }
        filter['stu'] = "学生";
        xlsUtils.output(filter, "SELECT * FROM test_xls_in", {}, function (err, filepath) {
            if (err) {
                next(new Error(err));
                return;
            }
            //流下载 或者移动到你所需要的静态目录
            response.download(filepath, "down.xlsx");

        }, true);

    }


})

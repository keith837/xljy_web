/**
 * Created by wenhao on 2016/2/10.
 */
var basicController = require("../../core/utils/controller/basicController");
var http = require('http');
var fs = require('fs');
var path = require('path');
var url = require('url');
var timeUtils = require("../../core/utils/common/timeUtils");

module.exports= new basicController(__filename).init({
    get: function (req, res) {
        var action = req.query.action;
        if (action == "config") {
            return this.config(req, res);
        }else if(action=="listimage"){
            return this.listimage(req,res);
        }
    },
    post: function (req, res) {
        var action = req.query.action;
        if (action == "uploadimage") {
            return this.uploadimage(req, res);
        }else if(action=="catchimage"){
            return this.catchimage(req,res);
        }
    },


    uploadimage: function (req, res) {
        var self = this;
        var fstream;
        req.pipe(req.busboy);
        req.busboy.on('file', function (fieldname, file, filename, encoding, mimetype) {
            var filesize = 0;
            var ext = path.extname(filename);
            var newFilename = (new Date() - 0) + ext;
            var uploadDir = self.cacheManager.getCacheValue("FILE_DIR", "UE_UPLOAD");
            uploadDir += timeUtils.Format("yyyy_MM_dd") + "/";
            if (!fs.existsSync(uploadDir)) {
                fs.mkdirSync(uploadDir);
            }
            fstream = fs.createWriteStream(uploadDir + newFilename);
            file.on('data', function (data) {
                filesize = data.length;
            });
            fstream.on('close', function () {
                res.send(JSON.stringify({
                    "originalName": filename,
                    "name": newFilename,
                    "url": uploadDir + newFilename,
                    "type": ext,
                    "size": filesize,
                    "state": "SUCCESS"
                }));
            });
            file.pipe(fstream);
        });
    },
    /// 获取配置文件
    config: function (req, res) {
        return res.json(require('../../static/htmls/js/ueditor/nodejs/config.js'));
    },
    /// 在线管理
    listimage: function (req, res) {
        fs.readdir(uploadsPath, function (err, files) {
            var total = 0, list = [];
            files.sort().splice(req.query.start, req.query.size).forEach(function (a, b) {
                /^.+.\..+$/.test(a) &&
                list.push({
                    url: '/uploads/' + a,
                    mtime: new Date(fs.statSync(uploadsPath + a).mtime).getTime()
                });
            });
            total = list.length;
            res.json({state: total === 0 ? 'no match file' : 'SUCCESS', list: list, total: total, start: req.query.start});
        });
    },
    /// 抓取图片（粘贴时将图片保存到服务端）
    catchimage: function (req, res) {
        var list = [];
        req.body.source.forEach(function (src, index) {
            http.get(src, function (_res) {
                var imagedata = '';
                _res.setEncoding('binary');
                _res.on('data', function (chunk) {
                    imagedata += chunk
                });
                _res.on('end', function () {
                    var pathname = url.parse(src).pathname;
                    var original = pathname.match(/[^/]+\.\w+$/g)[0];
                    var suffix = original.match(/[^\.]+$/)[0];
                    var filename = Date.now() + '.' + suffix;
                    var filepath = uploadsPath + 'catchimages/' + filename;
                    fs.writeFile(filepath, imagedata, 'binary', function (err) {
                        list.push({
                            original: original,
                            source: src,
                            state: err ? "ERROR" : "SUCCESS",
                            title: filename,
                            url: '/uploads/catchimages/' + filename
                        });
                    })
                });
            })
        });
        var f = setInterval(function () {
            if (req.body.source.length === list.length) {
                clearInterval(f);
                res.json({state: "SUCCESS", list: list});
            }
        }, 50);

    }
});
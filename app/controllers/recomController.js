/**
 * Created by zhouyl on 16/1/27.
 * 推荐管理
 */

var basicController = require("../../core/utils/controller/basicController");
var formidable = require("formidable");
var path = require("path");
module.exports = new basicController(__filename).init({
    list: function (request, response, next) {
        var self = this;
        var start = parseInt(request.query.iDisplayStart || this.webConfig.iDisplayStart);
        var pageSize = parseInt(request.query.iDisplayLength || this.webConfig.iDisplayLength);
        var consultDate = request.query.consultDate;
        var consultTitle = request.query.consultTitle;
        this.model['recom'].queryPage(start, pageSize,consultDate,consultTitle, function (err, totalCount, res) {
            if (err) {
                return next(err);
            }
            response.json(self.createPageData("00", totalCount, res));
        });
    },

    add: function (request, response, next) {
        var self = this;
        var userId = request.user.userId;
        var uploadDir = self.cacheManager.getCacheValue("FILE_DIR", "SCHOOL_URL");
        var form = new formidable.IncomingForm();   //创建上传表单
        form.encoding = 'utf-8';		//设置编辑
        form.uploadDir = uploadDir;	 //设置上传目录
        form.keepExtensions = true;	 //保留后缀
        form.maxFieldsSize = 2 * 1024 * 1024;   //文件大小
        form.parse(request, function (err, fields, files) {
            var consultUrl;
            if(files && files.consultUrl){
                consultUrl = path.normalize(files.consultUrl.path).replace(/\\/g, '/');
            }else{
                return next(new Error("推荐缩略图不能为空"));
            }
            var param = {};
            param.consultTitle = fields.consultTitle;
            param.consultUrl = consultUrl;
            param.consultLink = fields.consultLink;
            param.content = fields.consultContent;
            if(fields.isMain == null){
                param.isMain = "1";
            }else{
                param.isMain = fields.isMain;
            }
            param.userId = userId;

            //param = parseRecom(request);
            //param.schoolId = parseInt(request.body.schoolId);

            console.info(param);
            self.model['recom'].add(param, function (err, insertId) {
                if (err) {
                    return next(err);
                } else if (!insertId) {
                    return next(self.Error("添加失败."));
                } else {
                    response.json({code: "00", msg: "添加成功."});
                }
            });
        });

    },

    del: function (request, response, next) {
        var self = this;
        var consultId = parseInt(request.params.consultId);
        this.model['recom'].del(consultId, function (err, data) {
            if (err) {
                return next(err);
            } else if (data.affectedRows !== 1) {
                return next(self.Error("删除推荐信息失败."));
            }
            response.json({code: "00", msg: "删除成功."});
        });
    },
    show: function (request, response, next) {
        var self = this;
        var consultId = parseInt(request.params.consultId);

        this.model['recom'].show(consultId, function (err, data) {
            if (err) {
                return next(err);
            }
            response.json({code: "00", msg: "查询成功.","data":data});
        });
    },

    update: function (request, response, next) {
        var self = this;
        var userId = request.user.userId;
        var consultId = parseInt(request.params.consultId);
        var uploadDir = self.cacheManager.getCacheValue("FILE_DIR", "SCHOOL_URL");
        var form = new formidable.IncomingForm();   //创建上传表单
        form.encoding = 'utf-8';		//设置编辑
        form.uploadDir = uploadDir;	 //设置上传目录
        form.keepExtensions = true;	 //保留后缀
        form.maxFieldsSize = 2 * 1024 * 1024;   //文件大小
        form.parse(request, function (err, fields, files) {
            var consultUrl;
            if(files && files.consultUrl){
                consultUrl = path.normalize(files.consultUrl.path).replace(/\\/g, '/');
            }else{
                return next(new Error("推荐缩略图不能为空"));
            }
            var param = {};
            param.consultTitle = fields.consultTitle;
            param.consultUrl = consultUrl;
            param.consultLink = fields.consultLink;
            param.content = fields.consultContent;
            param.consultId = consultId;
            this.model['recom'].update(param, function (err, data) {
                if (err) {
                    return next(err);
                } else if (data.affectedRows !== 1) {
                    return next(self.Error("更新失败."));
                } else {
                    response.json({code: "00", msg: "更新成功."});
                }
            });
        });


    }

});


function parseRecom(request) {
    var recom = {};
    recom.consultTitle = request.body.consultTitle;
    recom.consultLink = request.body.consultLink;
    recom.content = request.body.consultContent;
    recom.isMain = request.body.isMain;
    var userId = request.user.userId;
    recom.userId = userId;
    return recom;
}

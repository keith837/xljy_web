/**
 * Created by zhouyl on 16/1/27.
 * 推荐管理
 */

var basicController = require("../../core/utils/controller/basicController");
var formidable = require("formidable");
var path = require("path");
module.exports = new basicController(__filename).init({
    weblist: function (request, response, next) {
        var self = this;
        var start = parseInt(request.query.iDisplayStart || this.webConfig.iDisplayStart);
        var pageSize = parseInt(request.query.iDisplayLength || this.webConfig.iDisplayLength);
        var consultDate = request.query.consultDate;
        var consultTitle = request.query.consultTitle;
        var consultType = request.query.consultType;
        this.model['recom'].queryPage(start, pageSize,null,consultDate,consultTitle,consultType, function (err, totalCount, res) {
            if (err) {
                return next(err);
            }
            response.json(self.createPageData("00", totalCount, res));
        });
    },

    list: function (request, response, next) {
        var self = this;
        var log = this.logger;
        var pageSize = parseInt(request.query.iDisplayLength || this.webConfig.iDisplayLength);
        var consultDate = request.query.consultDate;
        var consultType = request.query.consultType;
        var consultId = parseInt(request.query.consultId || "0");
        this.model['recom'].queryPage(0, pageSize * 4, consultId, consultDate, null, consultType, function (err, totalCount, data) {
            if (err) {
                return next(err);
            }
            if (totalCount == 0) {
                return response.json({code: "00", data: []});
            }
            try {
                var recomms = new Array();
                var doneCodeArr = new Array();
                var groupObject = new Object();
                for (var x in data) {
                    doneCodeArr.push(data[x].doneCode);
                    var recomm = groupObject[data[x].doneCode];
                    if (!recomm) {
                        recomm = new Array();
                        groupObject[data[x].doneCode] = recomm;
                    }
                    recomm.push(data[x]);
                }
                var preDoneCode = doneCodeArr[0];
                recomms.push(groupObject[preDoneCode]);
                for (var i = 1; i < doneCodeArr.length && recomms.length < pageSize; i++) {
                    if (preDoneCode == doneCodeArr[i]) {
                        continue;
                    } else {
                        preDoneCode = doneCodeArr[i];
                        recomms.push(groupObject[preDoneCode]);
                    }
                }
                response.json({code: "00", data: recomms});
            } catch (e) {
                log.error(e);
                return next(self.Error("查询信息出错"));
            }

        });
    },

    add: function (request, response, next) {
        var self = this;
        var multiple = request.query.multiple;
        if (multiple && multiple >= 1) {
            return self.multipleAdd(request, response, next);
        }
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
            param.consultType = fields.consultType;
            if(fields.isMain == null){
                param.isMain = "0";
            }else{
                param.isMain = "1";
            }
            param.userId = userId;
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

    multipleAdd: function (request, response, next) {
        var self = this;
        var multiple = request.query.multiple;
        var userId = request.user.userId;
        var uploadDir = self.cacheManager.getCacheValue("FILE_DIR", "SCHOOL_URL");
        var form = new formidable.IncomingForm();   //创建上传表单
        form.encoding = 'utf-8';		//设置编辑
        form.uploadDir = uploadDir;	 //设置上传目录
        form.keepExtensions = true;	 //保留后缀
        form.maxFieldsSize = 2 * 1024 * 1024;   //文件大小
        form.parse(request, function (err, fields, files) {
            var params = new Array();
            var consultUrl;
            if (files && files.consultUrl) {
                consultUrl = path.normalize(files.consultUrl.path).replace(/\\/g, '/');
            } else {
                return next(new Error("推荐缩略图不能为空"));
            }
            var isMain = "1";
            if (fields.isMain == null) {
                isMain = "0";
            } else {
                isMain = "1";
            }
            params.push([fields.consultTitle, consultUrl, fields.consultLink, fields.consultContent, fields.consultType, isMain, userId]);

            for (var i = 0; i < multiple; i++) {
                if (files && files["consultUrl" + i]) {
                    consultUrl = path.normalize(files["consultUrl" + i].path).replace(/\\/g, '/');
                } else {
                    return next(new Error("推荐缩略图不能为空"));
                }
                var isMain = "1";
                if (fields["isMain" + i] == null) {
                    isMain = "0";
                } else {
                    isMain = "1";
                }
                var consultContent = null;
                if (fields["consultContent" + i]) {
                    consultContent = fields["consultContent" + i];
                }
                params.push([fields["consultTitle" + i], consultUrl, fields["consultLink" + i], consultContent, fields["consultType" + i], isMain, userId]);
            }

            self.model['recom'].batchAdd(params, function (err, insertId) {
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
            param.consultType = fields.consultType;
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

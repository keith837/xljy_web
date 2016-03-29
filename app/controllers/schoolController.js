var basicController = require("../../core/utils/controller/basicController");
var formidable = require("formidable");
var path = require("path");
var pushCore = require("../../core/utils/alim/pushCore");

module.exports = new basicController(__filename).init({

    //选择园所
    select : function(req, res, next) {
        var self = this;
        var schoolId = parseInt(req.params.schoolId);
        var userId = req.user.userId;
        var groupId = req.user.groupId;
        if(groupId == 30){
            self.model['school'].findByUserAndSchoolId(userId, schoolId, function (err, school) {
                self.selectSchool(err, school, req, res, next);
            });
        }else if(groupId == 40){
            self.model['school'].findByGroupAndSchoolId(userId, schoolId, function (err, school) {
                self.selectSchool(err, school, req, res, next);
            });
        }else if(groupId == 50){
            self.model['school'].findBySchoolId(schoolId, function (err, school) {
                self.selectSchool(err, school, req, res, next);
            });
        }else{
            return next(new Error("非园长用户不允许选择学校"));
        }

    },

    selectSchool : function(err, school, req, res, next){
        var self = this;
        var log = this.logger;
        if (err) {
            return next(err);
        }
        if (!school) {
            return next(new Error("未查到关联的园所信息"));
        }
        var user = req.user;
        user.schools = [school];
        user.schoolIds = [school.schoolId];
        self.redis.set(user.token, JSON.stringify(user));

        pushCore.regDevice(user.deviceType, user.installationId, [], function (err, objectId) {
            if (err) {
                log.error("删除设备[" + user.installationId + "]云端token出错");
                log.error(err);
                return;
            }
            log.info("删除设备[" + user.installationId + "]云端token成功，objectId=" + objectId);

            pushCore.regDevice(user.deviceType, user.installationId, ["school_" + user.schools[0].schoolId], function (err, objectId) {
                if (err) {
                    log.error("注册设备[" + user.installationId + "]出错");
                    log.error(err);
                    return;
                }
                log.info("注册设备[" + user.installationId + "]成功，objectId=" + objectId);
            });
        });

        res.json({
            code: "00",
            msg: "园所选择成功"
        });
    },

    //查询园长下的园所
    list : function(req, res, next) {
        var self = this;
        var userId = req.user.userId;
        var groupId = req.user.groupId;
        if(groupId == 30){
            self.model['school'].listByPrincipalId(userId, function(err, schools){
                self.retSchools(err, schools, res, next);
            });
        }else if(groupId == 40){
            self.model['school'].listByGroupId(userId, function(err, schools){
                self.retSchools(err, schools, res, next);
            });
        }else if(groupId == 50){
            self.model['school'].listAllSchool(function(err, schools){
                self.retSchools(err, schools, res, next);
            });
        }
    },

    retSchools : function(err, schools, res){
        if (err) {
            return next(err);
        }
        if (!schools || schools.length <= 0) {
            return next(new Error("该园长关联的园所信息为空"));
        }
        var retSchools = new Array();
        for (var i = 0; i < schools.length; i++) {
            retSchools.push({
                schoolId: schools[i].schoolId,
                schoolName: schools[i].schoolName,
                schoolDesc: schools[i].schoolDesc,
                schoolUrl: schools[i].schoolUrl
            });
        }
        res.json({
            code: "00",
            schools: retSchools
        });
    },

    listClass : function(req, res, next) {
        var self = this;
        var schoolId = req.params.schoolId;
        self.model['class'].listBySchoolId(schoolId, function (err, classes) {
            if (err) {
                return next(err);
            }
            res.json({
                code: "00",
                classes: classes
            });
        });
    },

    listall : function(req, res, next){
        var self = this;
        var start = parseInt(req.query.iDisplayStart || this.webConfig.iDisplayStart);
        var pageSize = parseInt(req.query.iDisplayLength || this.webConfig.iDisplayLength);
        var schoolObj = new Object;
        var schoolName = req.query.schoolName;
        if(schoolName){
            schoolObj.schoolName = schoolName;
        }
        var sUserId = req.query.sUserId;
        if(sUserId){
            schoolObj.sUserId = parseInt(sUserId);
        }
        var bUserId = req.query.bUserId;
        var brandObj = new Object();
        if(bUserId){
            brandObj.bUserId = parseInt(bUserId);
        }
        var brandName = req.query.brandName;
        if(brandName){
            brandObj.brandName = brandName;
        }
        var schoolIds = req.query.schoolId ? [req.query.schoolId] : req.user.schoolIds;
        self.model['school'].listByPage(schoolObj, brandObj, schoolIds, start, pageSize, function(err, total, schools){
            if(err){
                return next(err);
            }
            res.json(self.createPageData("00", total, schools));
        });
    },

    show : function(req, res, next){
        var self = this;
        var schoolId = parseInt(req.params.schoolId);
        self.model['school'].findInfoByBrandId(schoolId, function(err, school){
            if(err){
                return next(err);
            }
            res.json({
                code : "00",
                data : school
            });
        });
    },

    add : function(req, res, next){
        var self = this;
        var oUserId = req.user.userId;
        var uploadDir = self.cacheManager.getCacheValue("FILE_DIR", "SCHOOL_URL");
        var form = new formidable.IncomingForm();   //创建上传表单
        form.encoding = 'utf-8';		//设置编辑
        form.uploadDir = uploadDir;	 //设置上传目录
        form.keepExtensions = true;	 //保留后缀
        form.maxFieldsSize = 2 * 1024 * 1024;   //文件大小
        form.parse(req, function (err, fields, files) {
            var brandId = fields.brandId ? parseInt(fields.brandId) : 0;
            var schoolName = fields.schoolName;
            var sUserId = fields.sUserId;
            var address = fields.address;
            var billId = fields.billId;
            var schoolDesc = fields.schoolDesc;
            var h5Url = fields.h5Url;
            var h5Title = fields.h5Title;
            if(!schoolName){
                return next(new Error("园所名称不能为空"));
            }
            if(!sUserId){
                return next(new Error("园长编号不能为空"));
            }
            if(!address){
                return next(new Error("园所地址不能为空"));
            }
            var schoolUrl;
            if(files && files.schoolUrl){
                schoolUrl = path.normalize(files.schoolUrl.path).replace(/\\/g, '/');
            }else{
                return next(new Error("学校平面图不能为空"));
            }
            self.model['school'].save([brandId, schoolName, sUserId, address, billId, schoolDesc, schoolUrl, h5Url, h5Title, oUserId], sUserId, function(err, data){
                if(err){
                    return next(err);
                }
                res.json({
                    code : "00",
                    msg : "园所添加成功"
                })
            });
        });
    },

    modify : function(req, res, next){
        var self = this;
        var schoolId = parseInt(req.params.schoolId);
        if(!schoolId && schoolId <= 0){
            return next(new Error("园所编号不能为空"));
        }
        var oUserId = req.user.userId;
        var uploadDir = self.cacheManager.getCacheValue("FILE_DIR", "SCHOOL_URL");
        var form = new formidable.IncomingForm();   //创建上传表单
        form.encoding = 'utf-8';		//设置编辑
        form.uploadDir = uploadDir;	 //设置上传目录
        form.keepExtensions = true;	 //保留后缀
        form.maxFieldsSize = 2 * 1024 * 1024;   //文件大小
        form.parse(req, function (err, fields, files) {
            var obj = new Object();
            var brandId = fields.brandId;
            var schoolName = fields.schoolName;
            var sUserId = fields.sUserId;
            var address = fields.address;
            var billId = fields.billId;
            var schoolDesc = fields.schoolDesc;
            var h5Url = fields.h5Url;
            var h5Title = fields.h5Title;
            if(brandId){
                obj.brandId = brandId;
            }
            if(schoolName){
                obj.schoolName = schoolName;
            }
            if(sUserId){
                obj.sUserId = sUserId;
            }
            if(address){
                obj.address = address;
            }
            if(billId){
                obj.billId = billId;
            }
            if(schoolDesc){
                obj.schoolDesc = schoolDesc;
            }
            if(h5Url){
                obj.h5Url = h5Url;
            }
            if(h5Title){
                obj.h5Title = h5Title;
            }
            if(files && files.schoolPic){
                obj.schoolUrl = path.normalize(files.schoolPic.path).replace(/\\/g, '/');
            }
            obj.oUserId = oUserId;
            obj.doneDate = new Date();
            self.model['school'].update(obj, schoolId, function(err, data){
                if(err){
                    return next(err);
                }else if(data.affectedRows != 1){
                    return next(new Error("园所修改失败"));
                }
                res.json({
                    code : "00",
                    msg : "园所修改成功"
                });
            });
        });



    },

    teachers : function(req, res, next){
        var self = this;
        var schoolId = parseInt(req.params.schoolId);
        self.model['school'].listTeacherBySchoolId(schoolId, function(err, teachers){
            if(err){
                return next(err);
            }
            res.json({
                code : "00",
                data : teachers ? teachers : new Array()
            });
        });
    },

    webTeachers : function(req, res, next){
        var self = this;
        var schoolId = parseInt(req.params.schoolId);
        self.model['school'].listTeachers(schoolId, function(err, teachers){
            if(err){
                return next(err);
            }
            res.json({
                code : "00",
                data : teachers ? teachers : new Array()
            });
        });
    },

    classes : function(req, res, next){
        var self = this;
        var schoolId = req.query.schoolId;
        if(!schoolId){
            schoolId = req.user.schools[0].schoolId;
        }else{
            schoolId = parseInt(schoolId);
        }
        self.model['school'].listClassBySchoolId(schoolId, function(err, classes){
            if(err){
                return next(err);
            }
            res.json({
                code : "00",
                data : classes ? classes : new Array()
            });
        });
    },

    del : function(req, res, next){
        var self = this;
        var schoolId = parseInt(req.params.schoolId);
        var oUserId = req.user.userId;
        self.model['class'].listBySchoolId(schoolId, function(err, classes){
            if(err){
                return next(err);
            }
            if(classes && classes.length > 0){
                return next(new Error("当前学校已关联班级，不允许删除"));
            }
            self.model['school'].del(oUserId, schoolId, function(err, data){
                if(err){
                    return next(err);
                }else if(data.affectedRows != 1){
                    return next(new Error("需删除的学校信息不存在"));
                }
                res.json({
                    code : "00",
                    msg : "学校信息删除成功"
                });
            });
        });
    }
});
var basicController = require("../../core/utils/controller/basicController");

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
        }

    },

    selectSchool : function(err, school, req, res, next){
        var self = this;
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
        var brandId = req.body.brandId ? parseInt(req.body.brandId) : 0;
        var schoolName = req.body.schoolName;
        var sUserId = req.body.sUserId;
        var address = req.body.address;
        var billId = req.body.billId;
        var schoolDesc = req.body.schoolDesc;
        var schoolUrl = req.body.schoolUrl;
        var h5Url = req.body.h5Url;
        var h5Title = req.body.h5Title;
        var oUserId = req.user.userId;
        if(!schoolName){
            return next(new Error("园所名称不能为空"));
        }
        if(!sUserId){
            return next(new Error("园长编号不能为空"));
        }
        if(!address){
            return next(new Error("园所地址不能为空"));
        }
        self.model['school'].save([brandId, schoolName, sUserId, address, billId, schoolDesc, schoolUrl, h5Url, h5Title, oUserId], function(err, data){
            if(err){
                return next(err);
            }
            res.json({
                code : "00",
                msg : "园所添加成功"
            })
        });
    },

    modify : function(req, res, next){
        var self = this;
        var schoolId = parseInt(req.params.schoolId);
        if(!schoolId && schoolId <= 0){
            return next(new Error("园所编号不能为空"));
        }
        var obj = new Object();
        var brandId = req.body.brandId;
        var schoolName = req.body.schoolName;
        var sUserId = req.body.sUserId;
        var address = req.body.address;
        var billId = req.body.billId;
        var schoolDesc = req.body.schoolDesc;
        var schoolUrl = req.body.schoolUrl;
        var h5Url = req.body.h5Url;
        var h5Title = req.body.h5Title;
        var oUserId = req.user.userId;
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
        if(schoolUrl){
            obj.schoolUrl = schoolUrl;
        }
        if(h5Url){
            obj.h5Url = h5Url;
        }
        if(h5Title){
            obj.h5Title = h5Title;
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
        self.model['class'].listBySchoolId(schoolId, function(err, classes){
            if(err){
                return next(err);
            }
            if(classes && classes.length > 0){
                return next(new Error("当前学校已关联班级，不允许删除"));
            }
            self.model['school'].del(schoolId, function(err, data){
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
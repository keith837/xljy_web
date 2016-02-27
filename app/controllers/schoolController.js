var basicController = require("../../core/utils/controller/basicController");

module.exports = new basicController(__filename).init({
    select : function(req, res, next) {
        var self = this;
        var schoolId = req.params.schoolId;
        var userId = req.user.userId;
        self.model['school'].findOne(userId, schoolId, function (err, school) {
            if (err) {
                return next(err);
            }
            if (!school) {
                return next(new Error("未查到关联的园所信息"));
            }
            var user = req.user;
            user.schools = [school];
            self.redis.set(user.token, JSON.stringify(user));
            res.json({
                code: "00",
                msg: "园所选择成功"
            });
        });
    },

    list : function(req, res, next) {
        var self = this;
        var userId = req.user.userId;
        self.model['school'].findSchool(userId, function (err, schools) {
            if (err) {
                return next(err);
            }
            if (!schools || schools.length <= 0) {
                return next(new Error("该校长未关联学校"));
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
        });
    },
    listClass : function(req, res, next) {
        var self = this;
        var schoolId = req.params.schoolId;
        self.model['class'].listBySchoolId(schoolId, function (err, classes) {
            if (err) {
                return next(err);
            }
            if (!classes || classes.length <= 0) {
                return next(new Error("该学校没有班级信息"));
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
        var obj = new Object;
        var schoolName = req.query.schoolName;
        if(schoolName){
            obj.schoolName = schoolName;
        }
        var sUserId = req.query.sUserId;
        if(sUserId){
            obj.sUserId = parseInt(sUserId);
        }
        self.model['school'].listByPage(obj, start, pageSize, function(err, total, schools){
            if(err){
                return next(err);
            }
            res.json(self.createPageData("00", total, schools));
        });
    },

    show : function(req, res, next){
        var self = this;
        var schoolId = parseInt(req.params.schoolId);
        self.model['school'].findBySchoolId(schoolId, function(err, school){
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
        self.model['school'].save([schoolName, sUserId, address, billId, schoolDesc, schoolUrl, h5Url, h5Title, oUserId], function(err, data){
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
        var schoolName = req.body.schoolName;
        var sUserId = req.body.sUserId;
        var address = req.body.address;
        var billId = req.body.billId;
        var schoolDesc = req.body.schoolDesc;
        var schoolUrl = req.body.schoolUrl;
        var h5Url = req.body.h5Url;
        var h5Title = req.body.h5Title;
        var oUserId = req.user.userId;
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

    del : function(req, res, next){
        var self = this;
        var schoolId = req.params.schoolId;
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
    }
});
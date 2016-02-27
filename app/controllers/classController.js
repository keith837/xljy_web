var basicController = require("../../core/utils/controller/basicController");

module.exports = new basicController(__filename).init({
    list : function(req, res, next){
        var self = this;
        var start = parseInt(req.query.iDisplayStart || this.webConfig.iDisplayStart);
        var pageSize = parseInt(req.query.iDisplayLength || this.webConfig.iDisplayLength);
        var obj = new Object;
        var schoolId = req.query.schoolId;
        var className = req.query.className;
        var gradeId = req.query.gradeId;
        var tUserId = req.query.tUserId;
        if(schoolId){
            obj.schoolId = parseInt(schoolId);
        }
        var sUserId = req.query.sUserId;
        if(tUserId){
            obj.tUserId = parseInt(tUserId);
        }
        if(gradeId){
            obj.gradeId = parseInt(gradeId);
        }
        if(className){
            obj.className = className;
        }
        self.model['class'].listByPage(obj, start, pageSize, function(err, total, classes){
            if(err){
                return next(err);
            }
            res.json(self.createPageData("00", total, classes));
        });
    },

    show : function(req, res, next){
        var self = this;
        var classId = parseInt(req.params.classId);
        self.model['class'].findByClassId(schoolId, function(err, classInfo){
            if(err){
                return next(err);
            }
            res.json({
                code : "00",
                data : classInfo
            });
        });
    },

    add : function(req, res, next){
        var self = this;
        var schoolId = req.body.schoolId;
        var tUserId = req.body.tUserId;
        var gradeId = req.body.gradeId;
        var className = req.body.className;
        var classDesc = req.body.classDesc;
        var classUrl = req.body.classUrl;
        var oUserId = req.user.userId;
        if(!schoolId){
            return next(new Error("班级归属学校不能为空"));
        }
        if(!tUserId){
            return next(new Error("班主任不能为空"));
        }
        if(!className){
            return next(new Error("班级名称不能为空"));
        }
        self.model['class'].save([schoolId, gradeId, tUserId, className, classDesc, classUrl, oUserId], function(err, data){
            if(err){
                return next(err);
            }
            res.json({
                code : "00",
                msg : "班级添加成功"
            })
        });
    },

    modify : function(req, res, next){
        var self = this;
        var classId = parseInt(req.params.classId);
        if(!classId && classId <= 0){
            return next(new Error("班级编号不能为空"));
        }
        var obj = new Object();
        var schoolId = req.body.schoolId;
        var tUserId = req.body.tUserId;
        var gradeId = req.body.gradeId;
        var className = req.body.className;
        var classDesc = req.body.classDesc;
        var classUrl = req.body.classUrl;
        var oUserId = req.user.userId;
        if(schoolId){
            obj.schoolId = schoolId;
        }
        if(tUserId){
            obj.tUserId = tUserId;
        }
        if(gradeId){
            obj.gradeId = gradeId;
        }
        if(className){
            obj.className = className;
        }
        if(classDesc){
            obj.classDesc = classDesc;
        }
        if(classUrl){
            obj.classUrl = classUrl;
        }
        obj.oUserId = oUserId;
        obj.doneDate = new Date();
        self.model['class'].update(obj, classId, function(err, data){
            if(err){
                return next(err);
            }else if(data.affectedRows != 1){
                return next(new Error("班级修改失败"));
            }
            res.json({
                code : "00",
                msg : "班级修改成功"
            });
        });
    },

    del : function(req, res, next){
        var self = this;
        var classId = req.params.classId;
        self.model['class'].del(classId, function(err, data){
            if(err){
                return next(err);
            }else if(data.affectedRows != 1){
                return next(new Error("需删除的班级信息不存在"));
            }
            res.json({
                code : "00",
                msg : "班级信息删除成功"
            });
        });
    },


});
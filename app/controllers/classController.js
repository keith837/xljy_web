var basicController = require("../../core/utils/controller/basicController");

module.exports = new basicController(__filename).init({

    list : function(req, res, next){
        var self = this;
        var start = parseInt(req.query.iDisplayStart || this.webConfig.iDisplayStart);
        var pageSize = parseInt(req.query.iDisplayLength || this.webConfig.iDisplayLength);
        var obj = new Object;
        var className = req.query.className;
        var gradeId = req.query.gradeId;
        var tUserId = req.query.tUserId;
        if(tUserId){
            obj.tUserId = parseInt(tUserId);
        }
        if(gradeId){
            obj.gradeId = parseInt(gradeId);
        }
        if(className){
            obj.className = className;
        }
        var schoolIds = req.query.schoolId ? [req.query.schoolId] : req.user.schoolIds;
        self.model['class'].listByPage(obj, schoolIds, start, pageSize, function(err, total, classes){
            if(err){
                return next(err);
            }
            res.json(self.createPageData("00", total, classes));
        });
    },

    show : function(req, res, next){
        var self = this;
        var classId = parseInt(req.params.classId);
        self.model['class'].findByClassId(classId, function(err, classInfo){
            if(err){
                return next(err);
            }
            res.json({
                code : "00",
                data : classInfo ? classInfo : null
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
        self.model['class'].update(obj, tUserId, classId, function(err, data){
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
        var classId = parseInt(req.params.classId);
        self.model['student'].countByClassId(classId, function(err, students){
            if(err){
                return next(err);
            }
            if(students && students.total > 0){
                return next(new Error("该班级下关联" + students.total + "个学生，不允许删除"));
            }
            self.model['class'].countTeacherByClassId(classId, function(err, teachers){
                if(err){
                    return next(err);
                }
                if(teachers && teachers.total > 0){
                    return next(new Error("该班级下关联" + teachers.total + "个老师，不允许删除"));
                }
                self.model['class'].delete(classId, function(err, data){
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
            });
        });
    },

    addTeacher : function(req, res, next){
        var self = this;
        var classId = parseInt(req.params.classId);
        var tUserId = req.body.tUserId;
        if(!tUserId){
            return next(new Error("老师编号不能为空"));
        }
        var jobType = req.body.jobType;
        if(!jobType){
            return next(new Error("老师职位不能为空"));
        }
        var oUserId = req.user.userId;
        self.model['class'].findOne(classId, function(err, classInfo){
            if(err){
                return next(err);
            }
            if(!classInfo){
                return next(new Error("班级信息不存在"));
            }
            self.model['class'].findRelByClassAndTeacherId(classId, tUserId, function(err, relData){
                if(err){
                    return next(err);
                }
                if(relData){
                    return next(new Error("班级已关联该老师"));
                }
                self.model['class'].saveTeacher([classInfo.schoolId, classId, tUserId, jobType, req.user.userId], function(err, data){
                    if(err){
                        return next(err);
                    }else if(data.affectedRows != 1){
                        return next(new Error("班级关联老师失败"));
                    }
                    res.json({
                        code : "00",
                        msg : "班级关联老师成功"
                    });
                });
            });
        });
    },

    delTeacher : function(req, res, next){
        var self = this;
        var classId = parseInt(req.params.classId);
        var tUserId = req.body.tUserId;
        self.model['class'].findRelByClassAndTeacherId(classId, tUserId, function(err, relData){
            if(err){
                return next(err);
            }
            if(!relData){
                return next(new Error("当前班级未关联该老师"));
            }
            self.model['class'].delTeacher(relData.relId, function(err, data){
                if(err){
                    return next(err);
                }else if(data.affectedRows != 1){
                    return next(new Error("班级取消老师关联关系失败"));
                }
                res.json({
                    code : "00",
                    msg : "班级取消老师关联关系成功"
                });
            });
        });
    },

    teachers : function(req, res, next){
        var self = this;
        var classId = parseInt(req.params.classId);
        self.model['class'].listTeacherByClassId(classId, function(err, teachers){
            if(err){
                return next(err);
            }
            res.json({
                code : "00",
                data : teachers
            });
        });
    },

    students : function(req, res, next){
        var self = this;
        var classId = parseInt(req.params.classId);
        self.model['class'].listStudentByClass(classId, function(err, students){
            if(err){
                return next(err);
            }
            res.json({
                code : "00",
                data : students
            });
        });
    }

});
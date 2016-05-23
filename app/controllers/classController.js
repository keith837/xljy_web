var basicController = require("../../core/utils/controller/basicController");
var moment = require("moment");
var formidable = require("formidable");
var path = require("path");

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

    weblist : function(req, res, next){
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
            if(!classes || classes.length <= 0){
                return res.json(self.createPageData("00", total, classes));
            }
            var classIds = new Array();
            for(var i = 0; i < classes.length; i ++){
                classIds.push(classes[i].classId);
            }
            var teacherObject = new Object();
            self.model['class'].listTeacherByClassIds(classIds, function(err, teachers){
                for(var i = 0; i < teachers.length; i ++){
                    var teacherArray = teacherObject[teachers[i].classId];
                    if(!teacherArray){
                        teacherArray = teacherObject[teachers[i].classId] = new Array();
                    }
                    teacherArray.push(teachers[i]);
                }
                for(var i = 0; i < classes.length; i ++){
                    classes[i].teachers = teacherObject[classes[i].classId];
                }
                res.json(self.createPageData("00", total, classes));
            });
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

    showDetail : function(req, res, next){
        var self = this;
        var classId = parseInt(req.params.classId);
        self.model['class'].findByClassId(classId, function(err, classInfo){
            if(err){
                return next(err);
            }
            if(!classInfo){
                return res.json({
                    code : "00",
                    data : null
                });
            }
            self.model['class'].listTeacherByClassId(classId, function(err, teachers){
                if(err){
                    return next(err);
                }
                classInfo.teachers = teachers;
                res.json({
                    code : "00",
                    data : classInfo ? classInfo : null
                });
            });
        });
    },

    add : function(req, res, next){
        var self = this;
        var uploadDir = self.cacheManager.getCacheValue("FILE_DIR", "CLASS_URL");
        var form = new formidable.IncomingForm();   //创建上传表单
        form.encoding = 'utf-8';		//设置编辑
        form.uploadDir = uploadDir;	 //设置上传目录
        form.keepExtensions = true;	 //保留后缀
        form.maxFieldsSize = 2 * 1024 * 1024;   //文件大小
        form.parse(req, function (err, fields, files) {
            if(err){
                return next(err);
            }
            var schoolId = fields.schoolId;
            var tUserId = fields.tUserId;
            var gradeId = fields.gradeId;
            var className = fields.className;
            var classDesc = fields.classDesc;
            var oUserId = req.user.userId;
            var teacherId = fields.teacherId;
            if(!schoolId){
                return next(new Error("班级归属学校不能为空"));
            }
            if(!tUserId){
                return next(new Error("班主任不能为空"));
            }
            if(!gradeId){
                return next(new Error("年级不能为空"));
            }
            if(!className){
                return next(new Error("班级名称不能为空"));
            }
            var classUrl;
            if(files && files.classUrl){
                classUrl = path.normalize(files.classUrl.path).replace(/\\/g, '/');
            }
            var teacherArray = new Array();
            self.model['class'].save([schoolId, gradeId, tUserId, className, classDesc, classUrl, oUserId], teacherId, function(err, data){
                if(err){
                    return next(err);
                }
                res.json({
                    code : "00",
                    msg : "班级添加成功"
                })
            });
        });
    },

    modify : function(req, res, next){
        var self = this;
        var classId = parseInt(req.params.classId);
        if(!classId && classId <= 0){
            return next(new Error("班级编号不能为空"));
        }
        var uploadDir = self.cacheManager.getCacheValue("FILE_DIR", "CLASS_URL");
        var form = new formidable.IncomingForm();   //创建上传表单
        form.encoding = 'utf-8';		//设置编辑
        form.uploadDir = uploadDir;	 //设置上传目录
        form.keepExtensions = true;	 //保留后缀
        form.maxFieldsSize = 2 * 1024 * 1024;   //文件大小
        form.parse(req, function (err, fields, files) {
            if(err){
                return next(err);
            }
            var obj = new Object();
            var schoolId = fields.schoolId;
            var tUserId = fields.tUserId;
            var gradeId = fields.gradeId;
            var className = fields.className;
            var classDesc = fields.classDesc;
            var oUserId = req.user.userId;
            var teacherId = fields.teacherId;
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
            var classUrl;
            if(files && files.classUrl){
                obj.classUrl = path.normalize(files.classUrl.path).replace(/\\/g, '/');
            }
            self.model['class'].update(obj, tUserId, classId, teacherId, function(err, data){
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
                self.model['class'].saveTeacher([classId, tUserId, jobType, oUserId], function(err, data){
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
        var classId = req.query.classId;
        if(!classId){
            var groupId = req.user.groupId;
            if(groupId == 10 || groupId == 20){
                classId = req.user.class.classId;
            }else{
                return next(new Error("请传人班级编号"));
            }
        }
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

    teacherAndPrincipal : function(req, res, next){
        var self = this;
        var classId = req.query.classId;
        if(!classId){
            var groupId = req.user.groupId;
            if(groupId == 10 || groupId == 20){
                classId = req.user.class.classId;
            }else{
                return next(new Error("请传人班级编号"));
            }
        }
        self.model['class'].listTeacherByClassId(classId, function(err, teachers){
            if(err){
                return next(err);
            }
            if(!teachers){
                teachers = new Array();
            }
            self.model['class'].findPrincipalByClassId(classId, function(err, principal){
                if(err){
                    return next(err);
                }
                if(principal){
                    teachers.push(principal);
                }
                res.json({
                    code : "00",
                    data : teachers
                });
            });
        });
    },

    students : function(req, res, next){
        var self = this;
        var classId = parseInt(req.params.classId);
        self.model['class'].listStudentAndDeviceByClass(classId, function(err, students){
            if(err){
                return next(err);
            }
            if(!students){
                return res.json({
                    code : "00",
                    studentNum: 0,
                    leaveNum : 0,
                    attendanceNum : 0,
                    sumCalValue : 0,
                    data : new Array()
                });
            }
            var dateMoment = moment();
            var currDate = dateMoment.format("YYYY-MM-DD");
            self.model['studentLeave'].listByClassId(classId, currDate, function(err, leaves){
                if(err){
                    return next(err);
                }
                var attendanceObj = new Object();
                attendanceObj.attendanceType = 1;
                attendanceObj.classId = classId;
                attendanceObj.attendanceDate = currDate;
                self.model['attendance'].listByCond(attendanceObj, function(err, attendances){
                    if(err){
                        return next(err);
                    }
                    var studentLeaveObj = new Object();
                    if(leaves){
                        for(var i = 0; i < leaves.length; i ++){
                            studentLeaveObj[leaves[i].studentId] = leaves[i];
                        }
                    }
                    var studentAttendanceObj = new Object();
                    if(attendances){
                        for(var i = 0; i < attendances.length; i ++){
                            studentAttendanceObj[attendances[i].objId] = attendances[i];
                        }
                    }
                    var attendanceNum = 0;
                    var leaveNum = 0;
                    for(var i = 0; i < students.length; i ++){
                        var studentLeave = studentLeaveObj[students[i].studentId];
                        if(studentLeave){
                            students[i].leaveInfo = studentLeave;
                            leaveNum ++;
                        }else{
                            var studentAttendance = studentAttendanceObj[students[i].studentId];
                            if(studentAttendance){
                                students[i].attendanceInfo = studentAttendance;
                                attendanceNum ++;
                            }
                        }
                    }
                    var obj = new Object();
                    obj.classId = classId;
                    obj.timeDay = dateMoment.format("YYYYMMDD");
                    self.model['sports'].sumByCond(obj, function(err, sports){
                        if(err){
                            return next(err);
                        }
                        res.json({
                            code : "00",
                            studentNum : students.length,
                            leaveNum: leaveNum,
                            attendanceNum : attendanceNum,
                            sumCalValue : sports ? sports.sumCalValue : 0,
                            data : students
                        });
                    })
                });
            });

        });
    },

    principal : function(req, res, next){
        var self = this;
        var classId = parseInt(req.params.classId);
        self.model['class'].findPrincipalBySchoolId(classId, function(err, principal){
            if(err){
                return next(err);
            }
            res.json({
                code : "00",
                principal : principal ? principal : null
            });
        });
    },

    parents : function(req, res, next){
        var self = this;
        var classId = parseInt(req.params.classId);
        self.model['class'].listParentsByClassId(classId, function(err, parents){
            if(err){
                return next(err);
            }
            res.json({
                code : "00",
                data : parents ? parents : new Array()
            });
        })
    }

});
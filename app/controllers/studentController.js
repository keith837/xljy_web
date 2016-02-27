var basicController = require("../../core/utils/controller/basicController");

module.exports = new basicController(__filename).init({
    select : function(req, res, next){
        var self = this;
        var userId = req.user.userId;
        var studentId = req.params.studentId;
        self.model['student'].findOne(userId, studentId, function(err, student){
            if(err){
                return next(err);
            }
            if(!student){
                return next(new Error("未查到关联的宝贝信息"));
            }
            var user = req.user;
            user.students = [student];
            self.model['class'].findOne(student.classId, function(err, classInfo){
                if(err){
                    return next(err);
                }
                if(!classInfo){
                    return next(new Error("未找到宝贝对应的班级信息"));
                }
                user.classes = [classInfo];
                self.model['school'].findBySchoolId(student.schoolId, function(err, school){
                    if(err){
                        return next(err);
                    }
                    if(!school){
                        return next(new Error("未找到宝贝对应的学校信息"));
                    }
                    user.schools = [school];
                    self.redis.set(user.token, JSON.stringify(user));
                    res.json({
                        code : "00",
                        msg : "宝贝选择成功"
                    });
                });
            });
        });
    },

    list : function(req, res, next){
        var self = this;
        var userId = req.user.userId;
        self.model['student'].listByUserId(userId, function(err, students) {
            if (err) {
                return next(err);
            }
            if (!students || students.length <= 0) {
                return next(new Error("该家长未关联宝贝"));
            }
            var retStudents = new Array();
            for(var i = 0; i < students.length; i ++){
                retStudents.push({
                    studentId : students[i].studentId,
                    studentName : students[i].studentName,
                    schoolId : students[i].schoolId,
                    classId : students[i].classId
                });
            }
            res.json({
                code : "00",
                students : retStudents
            });
        });
    },

    add : function(req, res, next){
        var self = this;
        var studentName = req.body.studentName;
        var classId = req.body.classId;
        var userId = req.body.userId;
        var cardNum = req.body.cardNum;
        var studentAge = req.body.studentAge;
        var gender = req.body.gender;
        var address = req.body.address;
        var remark = req.body.remark;
        var oUserId = req.user.userId;
        if(!studentName){
            return next(new Error("学生姓名不能为空"));
        }
        if(!studentAge){
            return next(new Error("学生年龄不能为空"));
        }
        if(!classId){
            return next(new Error("学生所属班级不能为空"));
        }
        if(!userId){
            return next(new Error("学生家长不能为空"));
        }
        if(!cardNum){
            return next(new Error("学生证件号码不能为空"));
        }
        if(!address){
            return next(new Error("学生联系地址不能为空"));
        }
        self.model['class'].findOne(classId, function(err, classInfo){
            if(err){
                return next(err);
            }
            if(!classInfo){
                return nrxt("学生关联的班级信息不存在");
            }
            self.model['student'].save([classInfo.schoolId,classId,studentName,studentAge,gender,cardNum,address,oUserId,remark], userId, oUserId, function(err, data){
                if(err){
                    return next(err);
                }
                res.json({
                    code : "00",
                    msg : "学生添加成功"
                });
            });
        });
    },

    modify : function(req, res, next){
        var self = this;
        var studentId = parseInt(req.params.studentId);
        if(!studentId && studentId <= 0){
            return next(new Error("学生编号不能为空"));
        }
        self.model['student'].findByStudentId(studentId, function(err, student){
            if(err){
                return next(err);
            }
            if(!student){
                return next(new Error("需修改的学生信息不存在"));
            }
            var studentName = req.body.studentName;
            var classId = req.body.classId;
            var userId = req.body.userId;
            var cardNum = req.body.cardNum;
            var studentAge = req.body.studentAge;
            var gender = req.body.gender;
            var address = req.body.address;
            var remark = req.body.remark;
            var oUserId = req.user.userId;
            var obj = new Object();
            if(studentName){
                obj.studentName = studentName;
            }
            if(cardNum){
                obj.cardNum = cardNum;
            }
            if(studentAge){
                obj.studentAge = studentAge;
            }
            if(gender){
                obj.gender = gender;
            }
            if(address){
                obj.address = address;
            }
            if(remark){
                obj.remark = remark;
            }
            obj.doneDate = new Date();
            obj.oUserId = oUserId;
            if(classId && classId != student.classId){
                obj.classId = classId;
                self.model['class'].findOne(classId, function(err, classInfo){
                    if(err){
                        return next(err);
                    }
                    if(!classInfo){
                        return nrxt("学生关联的班级信息不存在");
                    }
                    obj.schoolId = classInfo.schoolId;
                    self.model['student'].update(obj, userId, studentId, function(err, data){
                        if(err){
                            return next(err);
                        }
                        res.json({
                            code : "00",
                            msg : "学生信息修改成功"
                        });
                    });
                });
            }else{
                self.model['student'].update(obj, userId, studentId, function(err, data){
                    if(err){
                        return next(err);
                    }
                    res.json({
                        code : "00",
                        msg : "学生信息修改成功"
                    });
                });
            }
        });
    },

    del : function(req, res, next){
        var self = this;
        var studentId = req.params.studentId;
        if(!studentId){
            return next(new Error("需删除的学生编号为空"));
        }
        self.model["student"].delete(studentId, function(err, data){
            if(err){
                return next(err);
            }
            res.json({
                code : "00",
                msg : "学生信息删除成功"
            });
        });
    },

    show : function(req, res, next){
        var self = this;
        var studentId = parseInt(req.params.studentId);
        self.model['student'].findStudentInfo(studentId, function(err, student){
            if(err){
                return next(err);
            }
            if(!student){
                return next(new Error("学生信息不存在"));
            }
            student.genderName = self.cacheManager.getCacheValue("USER_GENDER", student.gender);
            student.stateName = self.cacheManager.getCacheValue("USER_STATE", student.state);
            self.model['student'].findParents([student.studentId], function(err, parents){
                if(err){
                    return next(err);
                }
                var parentsArray = new Array();
                if(parents) {
                    for (var i = 0; i < parents.length; i++) {
                        parentsArray.push({
                            nickName: parents[i].nickName,
                            userId: parents[i].userId,
                            custName: parents[i].custName
                        });
                    }
                }
                student.parents = parentsArray;
                res.json({
                    code: "00",
                    data : student
                });
            });
        });
    },

    listall : function(req, res, next){
        var self = this;
        var start = parseInt(req.query.iDisplayStart || this.webConfig.iDisplayStart);
        var pageSize = parseInt(req.query.iDisplayLength || this.webConfig.iDisplayLength);
        var obj = new Object;
        var schoolId = req.query.schoolId;
        if(schoolId && schoolId > 0){
            obj.schoolId = parseInt(schoolId);
        }
        var classId = req.query.classId;
        if(classId && classId > 0){
            obj.classId = parseInt(classId);
        }
        var studentName = req.query.studentName;
        if(studentName){
            obj.studentName = parseInt(studentName);
        }
        self.model["student"].listByPage(obj, start, pageSize, function(err, total, students){
            if(err){
                return next(err);
            }
            var studentIds = new Array();
            for(var i = 0; i < students.length; i ++){
                students[i].genderName = self.cacheManager.getCacheValue("USER_GENDER", students[i].gender);
                students[i].stateName = self.cacheManager.getCacheValue("USER_STATE", students[i].state);
                studentIds.push(students[i].studentId);
            }
            self.model['student'].findParents(studentIds, function(err, parents){
                if(err){
                    return next(err);
                }
                var parentsObj = new Object();
                for(var i = 0; i < parents.length; i ++){
                    var parentsArray = parentsObj[parents[i].studentId];
                    if(!parentsArray){
                        parentsArray = new Array();
                        parentsObj[parents[i].studentId] = parentsArray;
                    }
                    parentsArray.push({
                        nickName: parents[i].nickName,
                        userId: parents[i].userId,
                        custName: parents[i].custName
                    });
                }
                for(var i = 0; i < students.length; i ++){
                    students[i].parents = parentsObj[parents[i].studentId];
                }
                res.json(self.createPageData("00", total, students));
            });
        });
    }

});
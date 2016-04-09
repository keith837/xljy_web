var basicController = require("../../core/utils/controller/basicController");
var pushCore = require("../../core/utils/alim/pushCore");
var moment = require("moment");
var formidable = require("formidable");
var path = require("path");

module.exports = new basicController(__filename).init({
    uppic : function(req, res, next){
        var self = this;
        var userId = req.user.userId;
        var uploadDir = self.cacheManager.getCacheValue("FILE_DIR", "STUDENT_HEAD");
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
            if(files && files.studentPic){
                obj.studentPic = path.normalize(files.studentPic.path).replace(/\\/g, '/');
            }else{
                return next(new Error("学生头像不能为空"));
            }
            obj.doneDate = new Date();
            obj.oUserId = userId;
            var studentId = req.user.student.studentId;
            self.model['student'].update(obj, null, studentId, function(err, data){
                if(err){
                    return next(err);
                }
                if(data && data.affectedRows == 1){
                    res.json({
                        code : "00",
                        msg : "学生头像上传成功",
                        data : obj.studentPic
                    });
                }else{
                    return next(new Error("学生头像上传失败"));
                }
            });
        });
    },

    select : function(req, res, next){
        var self = this;
        var log = this.logger;
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
            user.student = student;
            self.model['class'].findOne(student.classId, function(err, classInfo){
                if(err){
                    return next(err);
                }
                if(!classInfo){
                    return next(new Error("未找到宝贝对应的班级信息"));
                }
                user.class = classInfo;
                self.model['school'].findBySchoolId(student.schoolId, function(err, school){
                    if(err){
                        return next(err);
                    }
                    if(!school){
                        return next(new Error("未找到宝贝对应的学校信息"));
                    }
                    user.schools = [school];
                    user.schoolIds = [school.schoolId];
                    var expireDate = self.cacheManager.getCacheValue("LOGIN", "TIMEOUT") * 60;
                    self.redis.set(user.token, JSON.stringify(user), "EX", expireDate);
                    self.redis.set(user.userId, user.token, "EX", expireDate);
                    pushCore.regDevice(user.deviceType, user.installationId, [], function (err, objectId) {
                        if (err) {
                            log.error("删除设备[" + user.installationId + "]云端token出错");
                            log.error(err);
                            return;
                        }
                        log.info("删除设备[" + user.installationId + "]云端token成功，objectId=" + objectId);


                        var channels = [];
                        channels.push("school_" + user.schools[0].schoolId + "_parent");
                        channels.push("class_" + user.class.classId);
                        pushCore.regDevice(user.deviceType, user.installationId, channels, function (err, objectId) {
                            if (err) {
                                log.error("注册设备[" + user.installationId + "]出错");
                                log.error(err);
                                return;
                            }
                            log.info("注册设备[" + user.installationId + "]成功，objectId=" + objectId);
                        });
                    });

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
                    studentPic : students[i].studentPic,
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
        if(!gender){
            return next(new Error("学生性别不能为空"));
        }
        var studentPic = self.cacheManager.getCacheValue("FILE_DIR", "DEFAULT_STUDENT_HEAD");
        self.model['class'].findOne(classId, function(err, classInfo){
            if(err){
                return next(err);
            }
            if(!classInfo){
                return next("学生关联的班级信息不存在");
            }
            self.model['student'].save([classInfo.schoolId,classId,studentName,studentPic,studentAge,gender,cardNum,address,oUserId,remark], userId, oUserId, function(err, student){
                if(err){
                    return next(err);
                }
                res.json({
                    code : "00",
                    msg : "学生添加成功",
                    data : student.insertId
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
                        return next("学生关联的班级信息不存在");
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

    parents : function(req, res, next){
        var self = this;
        var studentId = parseInt(req.params.studentId);
        self.model['student'].findParents([studentId], function(err, parents){
            if(err){
                return next(err);
            }
            var parentsArray = new Array();
            if(parents) {
                for (var i = 0; i < parents.length; i++) {
                    parentsArray.push({
                        nickName: parents[i].nickName,
                        userId: parents[i].userId,
                        custName: parents[i].custName,
                        userName: parents[i].userName
                    });
                }
            }
            res.json({
                code : "00",
                data : parentsArray
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
                            custName: parents[i].custName,
                            userName: parents[i].userName
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
        var schoolIds = req.query.schoolId ? [parseInt(req.query.schoolId)] : req.user.schoolIds;
        var classId = req.query.classId;
        if(classId && classId > 0){
            obj.classId = parseInt(classId);
        }
        var studentName = req.query.studentName;
        if(studentName){
            obj.studentName = "%" + studentName + "%";
        }
        self.model["student"].listByPage(obj, schoolIds, start, pageSize, function(err, total, students){
            if(err){
                return next(err);
            }
            if(!students || students.length <= 0){
                return res.json(self.createPageData("00", total, students));
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
                        custName: parents[i].custName,
                        userName: parents[i].userName
                    });
                }
                for(var i = 0; i < students.length; i ++){
                    students[i].parents = parentsObj[students[i].studentId];
                }
                res.json(self.createPageData("00", total, students));
            });
        });
    },

    leave : function(req, res, next){
        var self = this;
        var startDate = req.body.startDate;
        var endDate = req.body.endDate;
        var reason = req.body.reason;
        var remark = req.body.remark;
        var groupId = req.user.groupId;
        if(groupId != 10){
            return next(new Error("非家长用户不允许提交请假申请"));
        }
        if(!startDate){
            return next(new Error("请输入请假开始时间"));
        }
        if(!endDate){
            return next(new Error("请输入请假结束时间"));
        }
        if(!reason){
            return next(new Error("请输入请假原因"));
        }
        var studentId = req.user.student.studentId;
        var classId = req.user.class.classId;
        var schoolId = req.user.schools[0].schoolId;
        var userId = req.user.userId;
        var tUserId = req.user.class.tUserId;

        //计算请假天数
        var sDate = moment(startDate, "YYYY-MM-DD");
        var eDate = moment(endDate, "YYYY-MM-DD");
        var leaveDays = 0;
        while(sDate <= eDate){
            var week = sDate.day();
            if(week > 0 && week < 6){
                leaveDays += 1;
            }
            sDate.date(sDate.date() + 1);
        }
        if(leaveDays <= 0){
            return next(new Error("请假天数不能小于0"));
        }

        self.model['studentLeave'].save([schoolId, classId, userId, studentId, tUserId, startDate, endDate, leaveDays, reason, userId, remark], function(err, data){
            if(err){
                return next(err);
            }
            res.json({
                code : "00",
                msg : "请假申请提交成功",
                data : data.insertId
            });
        });
    },

    cancelLeave : function(req, res, next){
        var self = this;
        var leaveId = req.params.leaveId;
        var userId = req.user.userId;
        var studentId = req.user.student.studentId;
        var groupId = req.user.groupId;
        if(groupId != 10){
            return next(new Error("非家长用户不允许取消请假申请"));
        }
        if(!leaveId || leaveId <= 0){
            return next(new Error("请假申请编号不能为空"));
        }
        self.model['studentLeave'].findByLeaveId(leaveId, function(err, leave){
            if(err){
                return next(err);
            }
            if(!leave){
                return next(new Error("请假申请记录不存在"));
            }
            if(leave.state == 2){
                return next(new Error("请假申请记录已审批，不能取消"));
            }
            if(leave.state != 1){
                return next(new Error("请假申请记录已取消，不能再次取消"));
            }
            if(leave.studentId != studentId){
                return next(new Error("不能为其他家长名下的学生取消请假申请"));
            }
            self.model['studentLeave'].cancel(userId, leaveId, function(err, data){
                if(err){
                    return next(err);
                }
                res.json({
                    code : "00",
                    msg : "取消请假申请成功"
                });
            });
        });
    },

    approveLeave : function(req, res, next){
        var self = this;
        var leaveId = req.params.leaveId;
        var groupId = req.user.groupId;
        var userId = req.user.userId;
        var classId = req.user.class.classId;
        if(groupId != 20){
            return next(new Error("非老师用户不允许审批请假申请"));
        }
        if(!leaveId || leaveId <= 0){
            return next(new Error("请假申请编号不能为空"));
        }
        self.model['studentLeave'].findByLeaveId(leaveId, function(err, leave){
            if(err){
                return next(err);
            }
            if(!leave){
                return next(new Error("请假申请记录不存在"));
            }
            if(leave.state == 2){
                return next(new Error("请假申请记录已审批，不能再次审批"));
            }
            if(leave.state != 1){
                return next(new Error("请假申请记录已取消，不能审批"));
            }
            if(leave.classId != classId){
                return next(new Error("不能审批其他班级的请假申请"));
            }
            self.model['studentLeave'].approve(userId, leaveId, function(err, data){
                if(err){
                    return next(err);
                }
                res.json({
                    code : "00",
                    msg : "审批请假申请成功"
                });
            });
        });
    },

    showLeave : function(req, res, next){
        var self = this;
        var leaveId = req.params.leaveId;
        self.model['studentLeave'].findByLeaveId(leaveId, function(err, leave){
            if(err){
                return next(err);
            }
            if(leave){
                leave.stateName = self.cacheManager.getCacheValue("LEAVE_STATE", leave.state);
            }
            res.json({
                code : "00",
                data : leave
            });
        });
    },

    listLeaves : function(req, res, next){
        var self = this;
        var groupId = req.user.groupId;
        var state = req.query.state ? parseInt(req.query.state) : -1;
        var obj = new Object();
        var classId = req.query.classId;
        if(classId){
            obj.classId = parseInt(classId);
        }
        if(groupId == 10){
            obj.studentId = req.user.student.studentId;
        }else if(groupId == 20){
            obj.classId = req.user.class.classId;
        }else if(groupId == 30 || groupId == 40 || groupId == 50){
            obj.schoolId = req.user.schools[0].schoolId;
        }
        var startDate = req.query.startDate;
        var endDate = req.query.endDate;
        var leaveDate = req.query.leaveDate;
        self.model['studentLeave'].list(obj, startDate, endDate, leaveDate, function(err, leaves){
            if(err){
                return next(err);
            }
            if(leaves){
                for(var i = 0; i < leaves.length; i ++){
                    leaves[i].stateName = self.cacheManager.getCacheValue("LEAVE_STATE", leaves[i].state);
                }
            }
            res.json({
                code : "00",
                data : leaves
            });
        });
    },

    listAttendance : function(req, res, next){
        var self = this;
        var studentId = parseInt(req.params.studentId);
        var start = parseInt(req.query.iDisplayStart || this.webConfig.iDisplayStart);
        var pageSize = parseInt(req.query.iDisplayLength || this.webConfig.iDisplayLength);
        if(studentId <= 0){
            var groupId = req.user.groupId;
            if(groupId == 10){
                studentId = req.user.student.studentId;
            }
        }
        if(studentId <= 0){
            return next(new Error("学生编号不能为空"));
        }
        var startDate = req.query.startDate;
        if(!startDate){
            startDate = self.cacheManager.getCacheValue("TERM_INFO", "DEFAULT_START_DATE");
        }
        self.model['student'].listByStudentId(studentId, startDate, start, pageSize, function(err, total, attendances){
            if(err){
                return next(err);
            }
            res.json(self.createPageData("00", total, attendances));
        });
    },

    countAttendance : function(req, res, next){
        var self = this;
        var studentId = parseInt(req.params.studentId);
        if(studentId <= 0){
            var groupId = req.user.groupId;
            if(groupId == 10){
                studentId = req.user.student.studentId;
            }
        }
        if(studentId <= 0){
            return next(new Error("学生编号不能为空"));
        }
        var startDate = req.query.startDate;
        if(!startDate){
            startDate = self.cacheManager.getCacheValue("TERM_INFO", "DEFAULT_START_DATE");
        }
        self.model["studentLeave"].countByStudentId(studentId, startDate, function(err, leaveData){
            if(err){
                return next(err);
            }
            self.model['attendance'].countByObjId(1, studentId, startDate, function(err, attendanceData){
                if(err){
                    return next(err);
                }
                res.json({
                    code : 00,
                    data : {
                        leaveDays : (leaveData ? leaveData.total : 0),
                        attendanceDays : (attendanceData ? attendanceData.total : 0)
                    }
                });
            });
        });
    }

});
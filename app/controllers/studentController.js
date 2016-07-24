var basicController = require("../../core/utils/controller/basicController");
var pushCore = require("../../core/utils/alim/pushCore");
var moment = require("moment");
var formidable = require("formidable");
var imCore = require("../../core/utils/alim/imCore.js");
var path = require("path");
var images = require("images");
var webConfig = require("../../core/config/webConfig");

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
                    self.model['device'].findByStudentId(studentId, function(err, device){
                        if(err){
                            return next(err);
                        }
                        var retObj = new Object();
                        retObj.yunAccount = "yunuser_" + userId + "_" + studentId;
                        retObj.yunPassword = imCore.getPasswordHash("yunuser_" + userId + "_" + studentId);
                        retObj.deviceId = device ? device.deviceId : null;
                        retObj.deviceSign = device ? device.deviceSign : null;
                        retObj.deviceName = device ? device.deviceName : null;
                        res.json({
                            code : "00",
                            msg : "宝贝选择成功",
                            data : retObj
                        });
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
            self.model['user'].listByUserIdArray(userId, function(err, users){
                if(err){
                    return next(err);
                }
                self.model['student'].save([classInfo.schoolId,classId,studentName,studentPic,studentAge,gender,cardNum,address,oUserId,remark], userId, oUserId, function(err, student){
                    if(err){
                        return next(err);
                    }
                    var studentId = student.insertId;
                    if(users && users.length > 0){
                        var userInfoArray = new Array();
                        for(var i = 0; i < users.length; i ++){
                            var yunUser = "yunuser_" + users[i].userId + "_" + studentId;
                            var yunName = studentName + users[i].nickName;
                            var yunPassword = imCore.getPasswordHash(yunUser);
                            userInfoArray.push({
                                userid: yunUser,
                                password: yunPassword,
                                nick: yunName
                            });
                        }
                        imCore.regUsers(userInfoArray, function(err, yunRes) {
                            if (err) {
                                self.logger.error("注册云帐号失败：", err);
                            }
                        });
                    }
                    res.json({
                        code : "00",
                        msg : "学生添加成功",
                        data : studentId
                    });
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
            self.model['student'].listDelYunUserByStudentId(studentId, userId, function(err, delUsers){
                if(err){
                    return next(err);
                }
                self.model['student'].listAddYunUserByStudentId(studentId, userId, function(err, addUsers){
                    if(err){
                        return next(err);
                    }
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
                                self.modifyYunUser(studentId, studentName, delUsers, addUsers);
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
                            self.modifyYunUser(studentId, studentName, delUsers, addUsers);
                            res.json({
                                code : "00",
                                msg : "学生信息修改成功"
                            });
                        });
                    }
                });
            });
        });
    },

    modifyYunUser : function(studentId, studentName, delUsers, addUsers){
        var self = this;
        if(delUsers && delUsers.length > 0){
            var delYunUserArray = new Array();
            for(var i = 0; i < delUsers.length; i ++){
                delYunUserArray.push("yunuser_" + delUsers[i].userId + "_" + studentId);
            }
            imCore.delUsers(delYunUserArray.join(','), function(err, data){
                if(err){
                    self.logger.error("删除云帐号失败：", err);
                }
            });
        }
        if(addUsers && addUsers.length > 0){
            var addYunUserArray = new Array();
            for(var i = 0; i < addUsers.length; i ++){
                var yunUser = "yunuser_" + addUsers[i].userId + "_" + studentId;
                var yunName = studentName + addUsers[i].nickName;
                var yunPassword = imCore.getPasswordHash(yunUser);
                addYunUserArray.push({
                    userid: yunUser,
                    password: yunPassword,
                    nick: yunName
                });
            }
            imCore.regUsers(addYunUserArray, function(err, yunRes) {
                if (err) {
                    self.logger.error("注册云帐号失败：", err);
                }
            });
        }
    },

    del : function(req, res, next){
        var self = this;
        var studentId = req.params.studentId;
        if(!studentId || studentId <= 0){
            return next(new Error("需删除的学生编号为空"));
        }
        self.model["student"].findParentByStudentId(studentId, function(err, users){
            if(err){
                return next(err);
            }
            self.model["student"].delete(studentId, function(err, data){
                if(err){
                    return next(err);
                }
                if(users && users.length > 0){
                    var userIds = new Array();
                    for(var i = 0; i < users.length; i ++){
                        userIds.push("yunuser_" + users[i].userId + "_" + studentId);
                    }
                    imCore.delUsers(userIds.join(','), function(err, data){
                        if(err){
                            self.logger.error("删除云帐号失败：", err);
                        }
                    });
                }
                res.json({
                    code : "00",
                    msg : "学生信息删除成功"
                });
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
        while(sDate < eDate){
            var week = sDate.day();
            if(week > 0 && week < 6){
                leaveDays += 1;
            }
            sDate.date(sDate.date() + 1);
        }
        if(leaveDays <= 0){
            return next(new Error("请假天数不能小于0"));
        }
        var applyPeason =  req.user.student.studentName + req.user.nickName;
        self.model['studentLeave'].validLeave(studentId, startDate, endDate, function(err, data){
            if(err){
                return next(err);
            }
            if(data && data.total > 0){
                return next(new Error("不能重复请假"));
            }
            self.model['studentLeave'].save([schoolId, classId, userId, applyPeason, studentId, tUserId, startDate, endDate, leaveDays, reason, userId, remark], function(err, data){
                if(err){
                    return next(err);
                }
                var leaveId = data.insertId;
                self.model['class'].listInstallationInfoByClassId(classId, function(err, yunUsers){
                    if(err){
                        return self.logger.error("查询可被通知的班级老师信息失败", err);
                    }
                    if(!yunUsers || yunUsers.length <= 0){
                        return self.logger.info("查询可被通知的班级老师信息为空，不进行推送");
                    }

                    var deviceUsers = [];
                    for (var x in yunUsers) {
                        deviceUsers.push(pushCore.genUser(yunUsers[x].deviceType, yunUsers[x].installationId));
                    }
                    var noticeAction = self.cacheManager.getOneCache("LEAVE_APPLY_NOTICE");
                    var content = "请假申请通知";
                    var studentName = req.user.student.studentName;
                    var aCustName = req.user.custName;
                    var aNickName = req.user.nickName;
                    var sysDate = new Date();
                    var inData = {
                        "ios": {
                            "alert": content,
                            "category": noticeAction.codeKey,
                            "sound": "notificationCupcake.caf",
                            "studentId": studentId,
                            "studentName": studentName,
                            "startDate": startDate,
                            "endDate": endDate,
                            "leaveDays": leaveDays,
                            "reason": reason,
                            "aUserId": userId,
                            "aCustName": aCustName,
                            "aNickName": aNickName,
                            "leaveId": leaveId,
                            "doneDate": sysDate
                        },
                        "android": {
                            "alert": content,
                            "title": content,
                            "action": noticeAction.codeValue,
                            "studentId": studentId,
                            "studentName": studentName,
                            "startDate": startDate,
                            "endDate": endDate,
                            "leaveDays": leaveDays,
                            "reason": reason,
                            "aUserId": userId,
                            "aCustName": aCustName,
                            "aNickName": aNickName,
                            "leaveId": leaveId,
                            "doneDate": sysDate
                        }
                    };
                    pushCore.pushToUsers(inData, deviceUsers, function(err, objectId){
                        if(err){
                            return self.logger.error("推送请假申请通知失败", err);
                        }
                        self.logger.info("推送请假申请通知成功,objectId=" + objectId);
                    });
                });
                res.json({
                    code : "00",
                    msg : "请假申请提交成功",
                    data : leaveId
                });
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
                var classId = req.user.student.classId;
                self.model['class'].listInstallationInfoByClassId(classId, function(err, yunUsers){
                    if(err){
                        return self.logger.error("查询可被通知的班级老师信息失败", err);
                    }
                    if(!yunUsers || yunUsers.length <= 0){
                        return self.logger.info("查询可被通知的班级老师信息为空，不进行推送");
                    }

                    var deviceUsers = [];
                    for (var x in yunUsers) {
                        deviceUsers.push(pushCore.genUser(yunUsers[x].deviceType, yunUsers[x].installationId));
                    }
                    var noticeAction = self.cacheManager.getOneCache("LEAVE_CANCEL_NOTICE");
                    var content = "请假取消通知";
                    var studentName = req.user.student.studentName;
                    var aCustName = req.user.custName;
                    var aNickName = req.user.nickName;
                    var sysDate = new Date();
                    var inData = {
                        "ios": {
                            "alert": content,
                            "category": noticeAction.codeKey,
                            "sound": "notificationCupcake.caf",
                            "studentId": studentId,
                            "studentName": studentName,
                            "startDate": leave.startDate,
                            "endDate": leave.endDate,
                            "leaveDays": leave.leaveDays,
                            "reason": leave.reason,
                            "aUserId": userId,
                            "aCustName": aCustName,
                            "aNickName": aNickName,
                            "leaveId": leaveId,
                            "doneDate": sysDate
                        },
                        "android": {
                            "alert": content,
                            "title": content,
                            "action": noticeAction.codeValue,
                            "studentId": studentId,
                            "studentName": studentName,
                            "startDate": leave.startDate,
                            "endDate": leave.endDate,
                            "leaveDays": leave.leaveDays,
                            "reason": leave.reason,
                            "aUserId": userId,
                            "aCustName": aCustName,
                            "aNickName": aNickName,
                            "leaveId": leaveId,
                            "doneDate": sysDate
                        }
                    };
                    pushCore.pushToUsers(inData, deviceUsers, function(err, objectId){
                        if(err){
                            return self.logger.error("推送请假取消通知失败", err);
                        }
                        self.logger.info("推送请假取消通知成功,objectId=" + objectId);
                    });
                });
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
                self.model['class'].listInstallationInfo(classId, userId, leave.aUserId, function(err, yunUsers){
                    if(err){
                        return self.logger.error("查询被通知的老师及家长用户信息失败", err);
                    }
                    if(!yunUsers || yunUsers.length <= 0){
                        return self.logger.info("查询可被通知的老师及家长用户信息为空，不进行推送");
                    }

                    var deviceUsers = [];
                    for (var x in yunUsers) {
                        deviceUsers.push(pushCore.genUser(yunUsers[x].deviceType, yunUsers[x].installationId));
                    }
                    var noticeAction = self.cacheManager.getOneCache("LEAVE_APPROVE_NOTICE");
                    var content = "请假审批通知";
                    var tCustName = req.user.custName;
                    var tNickName = req.user.nickName;
                    var sysDate = new Date();
                    var inData = {
                        "ios": {
                            "alert": content,
                            "category": noticeAction.codeKey,
                            "sound": "notificationCupcake.caf",
                            "aUserId": leave.aUserId,
                            "studentId": leave.studentId,
                            "studentName": leave.studentName,
                            "startDate": leave.startDate,
                            "endDate": leave.endDate,
                            "leaveDays": leave.leaveDays,
                            "reason": leave.reason,
                            "tUserId": userId,
                            "tCustName": tCustName,
                            "tNickName": tNickName,
                            "leaveId": leaveId,
                            "doneDate": sysDate
                        },
                        "android": {
                            "alert": content,
                            "title": content,
                            "action": noticeAction.codeValue,
                            "aUserId": leave.aUserId,
                            "studentId": leave.studentId,
                            "studentName": leave.studentName,
                            "startDate": leave.startDate,
                            "endDate": leave.endDate,
                            "leaveDays": leave.leaveDays,
                            "reason": leave.reason,
                            "tUserId": userId,
                            "tCustName": tCustName,
                            "tNickName": tNickName,
                            "leaveId": leaveId,
                            "doneDate": sysDate
                        }
                    };
                    pushCore.pushToUsers(inData, deviceUsers, function(err, objectId){
                        if(err){
                            return self.logger.error("推送请假审批通知失败", err);
                        }
                        self.logger.info("推送请假审批通知成功,objectId=" + objectId);
                    });
                });
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
                    code : "00",
                    data : {
                        leaveDays : (leaveData ? leaveData.total : 0),
                        attendanceDays : (attendanceData ? attendanceData.total : 0)
                    }
                });
            });
        });
    },

    activities : function(req, res, next){
        var self = this;
        var studentId = parseInt(req.params.studentId);
        if(studentId <= 0){
            return next(new Error("学生编号不能为空"));
        }
        var dataType = req.query.dataType;
        if(dataType){
            dataType = parseInt(dataType);
        }else{
            dataType = 0;
        }
        var startTime = req.query.startTime;
        var timeMonth = req.query.timeMonth;
        var timeWeek = req.query.timeWeek;
        var timeDay = req.query.timeDay;
        var timeHour = req.query.timeHour;
        var endTime = req.query.endTime;
        if(!startTime && !timeMonth && !timeWeek && !timeDay && !timeHour){
            return next(new Error("传人参数不合法"));
        }
        var minStartTime = moment();
        minStartTime.year(minStartTime.year() - 1);
        var minTimes = minStartTime.toDate().getTime();
        if(startTime && startTime > minTimes){
            startTime = parseInt(startTime);
        }else{
            startTime = minTimes;
        }
        if(endTime){
            endTime = parseInt(endTime);
        }
        var qryObj = new Object();
        if(timeMonth){
            qryObj.timeMonth = timeMonth;
        }
        if(timeWeek){
            qryObj.timeWeek = timeWeek;
        }
        if(timeDay){
            qryObj.timeDay = timeDay;
        }
        if(timeHour){
            qryObj.timeHour = timeHour;
        }
        if(studentId){
            qryObj.studentId = studentId;
        }
        self.model["sports"].list(dataType, qryObj, startTime, endTime, function(err, sports){
            if(err){
                return next(err);
            }
            if(dataType <= 0 || dataType > 5){
                return res.json({
                    code : "00",
                    data : sports
                });
            }
            var keyStr;
            var intervalTime;
            var unitTime;
            var formatStr;
            var startMoment = moment(startTime);
            var endMoment = moment(endTime);
            if(dataType == 1){
                keyStr = "timeMinute";
                unitTime = "m";
                intervalTime = 30;
                if(startMoment.minute() < 30){
                    startMoment.minute(0);
                }else{
                    startMoment.minute(30);
                }
                formatStr = "YYYYMMDDHH";
            }else if(dataType == 2){
                keyStr = "timeHour";
                unitTime = "h";
                intervalTime = 1;
                formatStr = "YYYYMMDDHH";
                startMoment.minute(0);
                startMoment.second(0);
                startMoment.millisecond(0);
            }else if(dataType == 3){
                keyStr = "timeDay"
                unitTime = "d";
                intervalTime = 1;
                formatStr = "YYYYMMDD";
                startMoment.hour(0);
                startMoment.minute(0);
                startMoment.second(0);
                startMoment.millisecond(0);
            }else if(dataType == 4){
                unitTime = "d";
                intervalTime = 7;
                keyStr = "timeWeek";
                formatStr = "YYYY";
                startMoment.isoWeekday(1);
                startMoment.hour(0);
                startMoment.minute(0);
                startMoment.second(0);
                startMoment.millisecond(0);
            }else if(dataType == 5){
                unitTime = "M";
                keyStr = "timeMonth"
                intervalTime = 1
                formatStr = "YYYYMM";
                startMoment.date(1);
                startMoment.hour(0);
                startMoment.minute(0);
                startMoment.second(0);
                startMoment.millisecond(0);
            }
            var sprotObj = new Object();
            if(sports && sports.length > 0){
                for(var i = 0; i < sports.length; i ++){
                    sprotObj[sports[i][keyStr]] = sports[i];
                }
            }
            var retSports = new Array();
            while(startMoment <= endMoment){
                var formatKey = startMoment.format(formatStr);
                if(dataType == 1){
                    formatKey += (startMoment.minute() < 30 ? 1 : 2);
                }else if(dataType == 4){
                    formatKey += startMoment.week();
                }
                formatKey = parseInt(formatKey);
                var obj = sprotObj[formatKey];
                if(!obj){
                    obj = new Object();
                    obj[keyStr] = formatKey;
                    obj.calValue = -1;
                }
                retSports.push(obj);
                startMoment.add(intervalTime, unitTime);
            }
            res.json({
                code : "00",
                data : retSports
            });
        });
    },

    addSports : function(req, res, next){
        var self = this;
        var studentId = parseInt(req.params.studentId);
        if(studentId <= 0){
            return next(new Error("学生编号不能为空"));
        }
        var time = req.body.time;
        if(!time){
            return next(new Error("时间不能为空"));
        }else{
            time = parseInt(time);
        }
        var calValue = req.body.calValue;
        if(!calValue){
            return next(new Error("运动量不能为空"));
        }else{
            calValue = parseInt(calValue);
        }
        self.model["student"].findByStudentId(studentId, function(err, student){
            if(err){
                return next(err);
            }
            if(!student){
                return next(new Error("学生信息不存在"));
            }
            var currMomont = moment();
            var reversion = currMomont.format("YYMMDDHHmmss") + Math.round(Math.random() * 899999 + 100000);
            self.model["sports"].save(parseSports(reversion, studentId, time, calValue, currMomont.toDate(), student), function(err, data){
                if(err){
                    return next(err);
                }
                res.json({
                    code : "00",
                    data : {
                        identifier : data.insertId,
                        reversion : reversion
                    }
                });
            });
        });
    },

    addBatchSports : function(req, res, next){
        var self = this;
        var logger = self.logger;
        var studentId = parseInt(req.params.studentId);
        if(studentId <= 0){
            return next(new Error("学生编号不能为空"));
        }
        var datas = req.body.datas;
        self.logger.debug(req.body);
        if(!datas){
            return next(new Error("上传运动量数据不能为空"));
        }else{
            datas = JSON.parse(datas);
        }
        if(!(datas instanceof Array) || datas.length <= 0){
            return next(new Error("参数不合法"));
        }
        self.model["student"].findByStudentId(studentId, function(err, student){
            if(err){
                return next(err);
            }
            if(!student){
                return next(new Error("学生信息不存在"));
            }
            var currMomont = moment();
            var reversion = currMomont.format("YYMMDDHHmmss") + Math.round(Math.random() * 899999 + 100000);
            var sportsArray = new Array();
            for(var i = 0; i < datas.length; i++){
                var time = datas[i].time;
                var calValue = datas[i].calValue;
                if(!time || (!calValue && calValue != 0)){
                    return next(new Error("参数不合法：" + JSON.stringify(datas[i])));
                }
                sportsArray.push(parseSports(reversion, studentId, time, calValue, currMomont.toDate(), student));
            }
            self.model["sports"].saveBatch(studentId, reversion, sportsArray, function(err, data){
                if(err){
                    return next(err);
                }
                res.json({
                    code : "00",
                    data : data
                });
            });
        });
    },

    delSports : function(req, res, next){
        var self = this;
        var studentId = req.body.studentId;
        var reversion = req.body.reversion;
        var obj = new Object();
        if(studentId){
            obj.studentId = studentId;
        }
        if(reversion){
            obj.reversion = reversion;
        }
        self.model["sports"].delete(obj, function(err, data){
            if(err){
                return next(err);
            }
            res.json({
                code : "00",
                msg : "删除成功:" + JSON.stringify(data)
            });
        });
    },

    upLostPic : function(req, res, next){
        var self = this;
        var lostId = req.params.lostId;
        if(!lostId || lostId <= 0){
            return next(new Error("学生走失记录编号不能为空"));
        }
        var uploadDir = self.cacheManager.getCacheValue("FILE_DIR", "STUDENT_LOST");
        var form = new formidable.IncomingForm();   //创建上传表单
        form.encoding = 'utf-8';		//设置编辑
        form.uploadDir = uploadDir;	 //设置上传目录
        form.keepExtensions = true;	 //保留后缀
        form.maxFieldsSize = 2 * 1024 * 1024;   //文件大小
        var userId = req.user.userId;
        form.parse(req, function (err, fields, files) {
            if(err) {
                return next(err);
            }
            var sysDate = new Date();
            var userId = req.user.userId;
            var lostPicArgs = new Array();
            for (var photos in files) {
                var width = images(files[photos].path).width();
                var height = images(files[photos].path).height();
                lostPicArgs.push([path.normalize(files[photos].path).replace(/\\/g, '/'), width, height, null, 1, sysDate, sysDate, userId, lostId]);
            }
            if(lostPicArgs == null || lostPicArgs.length <= 0){
                return next(new Error("图片不能为空"));
            }
            self.model['lost'].savePics(lostPicArgs, function(err, data){
                if(err){
                    return next(err);
                }
                return res.json({
                    code : "00",
                    data : lostPicArgs,
                    msg : "图片上传成功",
                    lostId : lostId
                });
            });
        });
    },
    
    listLost : function(req, res, next){
        var self = this;
        var pageNo = req.query.pageNo;
        var pageSize = req.query.pageSize;
        var studentId = req.query.studentId;
        var schoolId = req.query.schoolId;
        var classId = req.query.classId;
        var studentName = req.query.studentName;
        self.model['lost'].list(schoolId,classId,studentId,studentName,pageNo,pageSize, function(err, lostes){
            if(err){
                return next(err);
            }
            if (!lostes || lostes.length <= 0) {
	            return res.json({
		            code : "00",
		            msg : "丢失记录查询成功",
		            data : new Array()
	            });
            }
            var lostIds = new Array();
            for (var i = 0; i < lostes.length; i++) {
	            lostIds.push(lostes[i].lostId);
            }
            self.model['lost'].listPics(lostIds, function(err, lostPics) {
	            if (err) {
		            return next(err);
	            }
	            var lostPicsObj = new Object();
	            if (lostPics && lostPics.length > 0) {
		            for (var i = 0; i < lostPics.length; i++) {
			            var lostPicArray = lostPicsObj[lostPics[i].lostId];
			            if (!lostPicArray) {
				            lostPicArray = new Array();
				            lostPicsObj[lostPics[i].lostId] = lostPicArray;
			            }
			            lostPicArray.push(lostPics[i]);
		            }
	            }
	            for (var i = 0; i < lostes.length; i++) {
	        	    var lostPicArray = lostPicsObj[lostes[i].lostId];
		            lostes[i].lostPics = lostPicArray ? lostPicArray : new Array();
	            }
	            return res.json({
		            code : "00",
		            msg : "丢失记录查询成功",
		            data : lostes
	            });
            });
        });
    },
    
    unlost : function(req, res, next){
        var self = this;
        var studentId = req.params.studentId;
        if(!studentId || studentId <= 0){
            return next(new Error("学生编号不能为空"));
        }
        self.model['lost'].listByStudentId(studentId, function(err, lostes){
            if(err){
                return next(err);
            }
            if(!lostes || lostes.length <= 0){
                return next(new Error("该学生未关联丢失记录"));
            }
            self.model['lost'].deleteByStudentId(studentId, function(err, data){
                if(err){
                    return next(err);
                }
                res.json({
                    code : "00",
                    msg : "删除丢失记录成功"
                });

                var content = lostes[0].schoolName + lostes[0].className + lostes[0].studentName + "已经找回，谢谢大家参与寻找";
                var noticeAction = self.cacheManager.getOneCache("STU_FOUND_NOTICE");
                self.pushNotification(content, noticeAction, function (err, objectId) {
                    if (err) {
                        return self.logger.error("推送宝贝[" + lostes[0].studentId + "]找回消息失败", err);
                    }
                    self.logger.info("推送宝贝[" + lostes[0].studentId + "]找回消息成功,objectId=" + objectId);
                });
            });
        });
    },

    lost : function(req, res, next){
        var self = this;
        var studentId = req.params.studentId;
        if(!studentId || studentId <= 0){
            return next(new Error("学生编号不能为空"));
        }
        self.model['student'].findByStudentId(studentId, function(err, student){
            if(err){
                return next(err);
            }
            if(!student){
                return next(new Error("学生信息不存在"));
            }

            self.model['lost'].listByStudentId(studentId, function(err, lostes) {
                if (err) {
                    return next(err);
                }
                if (lostes && lostes.length > 0) {
                    return next(new Error("此宝贝丢失信息已发布"));
                }

                var uploadDir = self.cacheManager.getCacheValue("FILE_DIR", "STUDENT_LOST");
                var form = new formidable.IncomingForm();   //创建上传表单
                form.encoding = 'utf-8';		//设置编辑
                form.uploadDir = uploadDir;	 //设置上传目录
                form.keepExtensions = true;	 //保留后缀
                form.maxFieldsSize = 2 * 1024 * 1024;   //文件大小
                var userId = req.user.userId;
                form.parse(req, function (err, fields, files) {
                    if(err){
                        return next(err);
                    }
                    var features = fields.features;
                    if(!features){
                        return next(new Error("学生特征不能为空"));
                    }
                    var lostDate = fields.lostDate;
                    if(!lostDate){
                        return next(new Error("学生走失日期不能为空"));
                    }
                    var lostAddr = fields.lostAddr;
                    if(!lostAddr){
                        return next(new Error("学生失踪地点不能为空"));
                    }
                    var contactBillId = fields.contactBillId;
                    if(!contactBillId){
                        return next(new Error("联系电话不能为空"));
                    }
                    var studentAge = fields.studentAge;
                    if(!studentAge){
                        studentAge = student.studentAge;
                    }
                    var gender = fields.gender;
                    if(!gender){
                        gender = student.gender;
                    }
                    var remark = fields.remark;
                    var lostPicArgs = new Array();
                    var sysDate = new Date();
                    for (var photos in files) {
                        var width = images(files[photos].path).width();
                        var height = images(files[photos].path).height();
                        lostPicArgs.push([path.normalize(files[photos].path).replace(/\\/g, '/'), width, height, null, 1, sysDate, sysDate, userId]);
                    }
                    var lostArgs = [student.schoolId, student.classId, studentId, student.studentName, studentAge, gender, features, lostDate, lostAddr, contactBillId, userId, remark];
                    self.model['lost'].save(lostArgs, lostPicArgs, function(err, lost){
                        if(err){
                            return next(err);
                        }
                        res.json({
                            code : "00",
                            msg : "发布宝贝丢失记录成功",
                            data : lostPicArgs,
                            lostId : lost
                        });

                        var content = student.schoolName + student.className + student.studentName + "意外走失，请大家开启志愿者版，共同寻找宝贝";
                        var noticeAction = self.cacheManager.getOneCache("STU_LOST_NOTICE");
                        self.pushNotification(content, noticeAction, function (err, objectId) {
                            if (err) {
                                return self.logger.error("推送宝贝[" + studentId + "]走失消息失败", err);
                            }
                            self.logger.info("推送宝贝[" + studentId + "]走失消息成功,objectId=" + objectId);
                        });

                        var userName = req.user.custName;
                        var nickName = req.user.nickName;
                        var noticeParam = [6, "宝贝丢失紧急通知", content, 0, 0, userId, null, null, userName, nickName, 0];
                        self.model['notice'].publishNotice(noticeParam, [], function (err, noticeId) {
                            if (err) {
                                return next(err);
                            }

                            var emergencyAction = new Object();
                            emergencyAction.codeKey = "6";
                            emergencyAction.codeValue = "om.xiangliang.notification.EMERGENCY_NOTIFY";
                            self.pushNotification(content, emergencyAction, function (err, objectId) {
                                if (err) {
                                    return self.logger.error("推送紧急通知[" + noticeId + "]消息失败", err);
                                }
                                self.logger.info("推送紧急通知[" + noticeId + "]成功,objectId=" + objectId);
                            });
                        });
                    });
                });
            });
        });
    },

    upPosition : function(req, res, next){
        var self = this;
        var lostId = req.params.lostId;
        if(!lostId || lostId <= 0){
            return next(new Error("学生走失记录编号不能为空"));
        }
        var positionX = req.body.positionX;
        var positionY = req.body.positionY;
        var address = req.body.address;
        if(!address){
            return next(new Error("上传地址不能为空"));
        }
        self.model['lost'].listByLostId(lostId, function (err, lostes) {
            if (err) {
                return next(err);
            }
            if (!lostes || lostes.length <= 0) {
                return next(new Error("该学生未关联丢失记录"));
            }

            self.model['lost'].savePosition([lostId, positionX, positionY, address], function (err, data) {
                if (err) {
                    return next(err);
                }
                res.json({
                    code: "00",
                    msg: '位置信息上传成功'
                });

                var content = lostes[0].schoolName + lostes[0].className + lostes[0].studentName + "有最新位置信息，请大家继续参与寻找";
                var noticeAction = self.cacheManager.getOneCache("STU_POSITION_NOTICE");
                self.pushNotification(content, noticeAction, function (err, objectId) {
                    if (err) {
                        return self.logger.error("推送宝贝[" + lostes[0].studentId + "]位置消息失败", err);
                    }
                    self.logger.info("推送宝贝[" + lostes[0].studentId + "]位置消息成功,objectId=" + objectId);
                });
            });
        });

    },

    nextLost : function(req, res, next){
        var self = this;
        var index = req.params.index;
        if(!index || index < 0){
            index = 0;
        }else{
            index = parseInt(index);
        }
        self.model['lost'].nextOne(index, function(err, studentLost){
            if(err){
                return next(err);
            }
            if(!studentLost && index > 0){
                index = 0;
                self.model['lost'].nextOne(index, function(err, studentLost){
                    if(err){
                        return next(err);
                    }
                    self.retLost(index, studentLost, res, next);
                });
            }else{
                self.retLost(index, studentLost, res, next);
            }
        })
    },

    retLost : function(index, studentLost, res, next){
        var self = this;
        if(!studentLost){
            if(index == 0){
                index = -1;
            }
            return res.json({
                code : "00",
                data : studentLost,
                index : index
            });
        }
        self.model['device'].findByStudentId(studentLost.studentId, function(err, device){
            if(err){
                return next(err);
            }
            self.model['lost'].findPics(studentLost.lostId, function(err, lostPics){
                if(err){
                    return next(err);
                }
                studentLost.deviceSign = device ? device.deviceSign : null;
                studentLost.lostPics = lostPics ? lostPics : [];
                studentLost.webUrl = webConfig.WEB_URL;
                res.json({
                    code : "00",
                    data : studentLost,
                    index : ++ index
                })
            });
        });
    },

    lostPosition: function (req, res, next) {
        var self = this;
        var studentId = req.params.studentId;
        self.model['lost'].findPositionByStudentId(studentId, function (err, positions) {
            if (err) {
                return next(err);
            }
            res.json({
                code: "00",
                data: positions
            })
        });
    },

    pushNotification: function (content, noticeAction, callback) {
        var inData = {
            "ios": {
                "alert": content,
                "category": noticeAction.codeKey,
                "sound": "notificationCupcake.caf"
            },
            "android": {
                "alert": content,
                "title": content,
                "action": noticeAction.codeValue
            }
        };
        pushCore.pushToAll(inData, callback);
    }

});

function parseSports(reversion, studentId, time, calValue, currDate, student) {
    var momentDate = moment(time);
    var timeMonth = parseInt(momentDate.format("YYYYMM"));
    var timeDay = parseInt(momentDate.format("YYYYMMDD"));
    var timeHourStr = momentDate.format("YYYYMMDDHH");
    var timeHour = parseInt(timeHourStr);
    var timeWeek = parseInt(momentDate.format("YYYY") + momentDate.week());
    var timeMinute = parseInt(timeHourStr + (momentDate.minute() < 30 ? 1 : 2));
    return [reversion, student.classId, student.schoolId, studentId, time, momentDate.toDate(), calValue, timeMonth, timeWeek, timeDay, timeHour, timeMinute, currDate];
}

var basicController = require("../../core/utils/controller/basicController");
var SmsSendUtil = require("../../core/utils/sms/SmsSendUtil.js");
var jwt = require("jwt-simple");
var moment = require('moment');
var formidable = require("formidable");
var path = require("path");
var imCore = require("../../core/utils/alim/imCore.js");
var pushCore = require("../../core/utils/alim/pushCore");
var webConfig = require("../../core/config/webConfig");

module.exports = new basicController(__filename).init({

    //退出登录
    logout : function(req, res, next){
        var self = this;
        var log = this.logger;
        var token = req.user.token;
        self.redis.del(token);
        self.redis.del(req.user.userId);
        var userObj = new Object();
        userObj.doneDate = new Date();
        userObj.installationId = null;
        userObj.deviceType = null;
        var userId = req.user.userId;
        self.model['user'].update(userObj, userId, function(err, data){
            if(err){
                self.logger.error("修改installationId失败", err);
            }
            pushCore.regDevice(req.user.deviceType, req.user.installationId, [], function (err, objectId) {
                if (err) {
                    log.error("删除设备[" + req.user.installationId + "]云端token出错");
                    log.error(err);
                }
                log.info("删除设备[" + req.user.installationId + "]云端token成功，objectId=" + objectId);
            });
        });
        res.json({
            code : "00",
            msg : '退出登录成功'
        });
    },

    restDevice : function(req, res, next){
        var self = this;
        var installationId = req.body.installationId;
        var deviceType = req.body.deviceType;
        var user = req.user;
        var log = self.logger;
        if(!installationId){
            return next(new Error("手机实例标识不能为空"));
        }
        if (!deviceType) {
            return next(new Error("手机设备类型不能为空"));
        }
        pushCore.regDevice(user.deviceType, user.installationId, [], function (err, objectId) {
            if (err) {
                log.error("删除原设备[" + user.installationId + "]云端token出错");
                return next(err);
            }
            log.info("删除原设备[" + user.installationId + "]云端token成功，objectId=" + objectId);
            var channels = new Array();
            var groupId = user.groupId;
            if(groupId == 10){
                channels.push("school_" + user.schools[0].schoolId + "_parent");
                channels.push("class_" + user.class.classId);
            }else if(groupId == 20){
                channels.push("school_" + user.schools[0].schoolId + "_teacher");
                channels.push("class_" + user.class.classId);
            }else{
                channels.push("school_" + user.schools[0].schoolId);
            }
            pushCore.regDevice(deviceType, installationId, channels, function (err, objectId) {
                if (err) {
                    log.error("注册新设备[" + installationId + "]出错");
                    return next(err);
                }
                log.info("注册新设备[" + installationId + "]成功，objectId=" + objectId);
                var userObj = new Object();
                userObj.doneDate = new Date();
                userObj.installationId = installationId;
                userObj.deviceType = deviceType;
                var userId = user.userId;
                self.model['user'].update(userObj, userId, function(err, data){
                    if(err){
                        return next(err);
                    }
                    user.installationId = installationId;
                    user.deviceType = deviceType;
                    var expireDate = self.cacheManager.getCacheValue("LOGIN", "TIMEOUT") * 60;
                    self.redis.set(user.token, JSON.stringify(user), "EX", expireDate);
                    self.redis.set(user.userId, user.token, "EX", expireDate);
                    res.json({
                        code : "00",
                        msg : "设备信息重置成功"
                    });
                });
            });
        });
    },

    //app端登录
    login : function(req, res, next){
        var self = this;
        var log = this.logger;
        var userName = req.body.userName;
        var password = req.body.password;
        var source = req.body.source;
        var channel = req.body.channel;
        var groupId = req.body.groupId;
        var installationId = req.body.installationId;
        var deviceType = req.body.deviceType;
        if(!userName){
            return next(new Error("登录用户名不能为空"));
        }
        if(!password){
            return next(new Error("登录密码不能为空"));
        }
        if(!source){
            return next(new Error("登入来源不能为空"));
        }
        if(!installationId){
            return next(new Error("手机实例标识不能为空"));
        }
        if (!deviceType) {
            return next(new Error("手机设备类型不能为空"));
        }
        if(!groupId){
            return next(new Error("用户组信息不能为空"));
        }
        self.model['user'].findByUserName(userName, function(err, user){
            if(err){
                return next(err);
            }
            if(!user){
                return next(new Error("用户信息不存在"));
            }
            if(user.state != 1){
                return next(new Error("该手机号码为白名单用户，未注册"));
            }
            if(!((groupId == 30 && (user.groupId == 40 || user.groupId == 50)) || user.groupId == groupId)){
                return next(new Error("用户组不一致，不允许登录"));
            }
            groupId = user.groupId;
            if(user.password != password){
                return next(new Error("登录密码错误"));
            }
            user.source = source;
            user.channel = channel;
            user.installationId = installationId;
            user.deviceType = deviceType;
            self.redis.get(user.userId, function(err, userToken){
                if(err){
                    return next(err);
                }
                if(userToken){
                    log.info("用户编号【" + user.userId + "】已登录，token：" + userToken);
                    self.redis.del(userToken, function(err, data){
                        if(err){
                            return next(err);
                        }
                        log.debug("已登录token【" + userToken + "】关联session信息删除成功");
                        self.redis.del(user.userId, function(err, data){
                            if(err){
                                return next(err);
                            }
                            log.debug("用户编号【" + user.userId + "】对应已登录token【" + userToken + "】删除成功");
                            pushCore.regDevice(user.deviceType, user.installationId, [], function (err, objectId) {
                                if (err) {
                                    log.error("删除设备[" + user.installationId + "]云端token出错");
                                    return next(err);
                                }
                                log.info("删除设备[" + user.installationId + "]云端token成功，objectId=" + objectId);
                                self.appLogin(groupId, user, req, res, next);
                            });
                        });
                    });
                }else{
                    self.appLogin(groupId, user, req, res, next);
                }
            });
        });
    },

    appLogin : function(groupId, user, req, res, next){
        var self = this;
        var log = this.logger;
        var clientId = getClientIp(req);
        var callback = function(){
            var userObj = new Object();
            userObj.doneDate = new Date();
            userObj.installationId = user.installationId;
            userObj.deviceType = user.deviceType;
            self.model['user'].update(userObj, user.userId, function (err, data) {
                if (err) {
                    log.error("修改installationId失败", err);
                }
                if (groupId == 20) {
                    var channels = [];
                    channels.push("school_" + user.schools[0].schoolId + "_teacher");
                    channels.push("class_" + user.class.classId);
                    pushCore.regDevice(user.deviceType, user.installationId, channels, function (err, objectId) {
                        if (err) {
                            log.error("注册设备[" + user.installationId + "]出错");
                            log.error(err);
                        }
                        log.info("注册设备[" + user.installationId + "]成功，objectId=" + objectId);
                    });
                }
            });
        }
        if(groupId == 10){
            self.parentLogin(user, res, next, callback);
        }else if(groupId == 20){
            self.teacherLogin(user, res, next, callback);
        }else if(groupId == 30){
            self.principalLogin(false, user, res, next, callback);
        }else if(groupId == 40){
            self.groupLogin(false, user, res, next, callback);
        }else if(groupId == 50){
            self.adminLogin(false, user, res, next, callback);
        }else{
            return next(new Error("用户组" + groupId + "信息未定义"));
        }
        self.model['userLogin'].logLogin([user.groupId,user.userId,user.nickName,user.billId,user.custName,user.channel,user.source,user.source,clientId,null]);
    },

    //家长登录
    parentLogin : function(user, res, next, callback){
        var self = this;
        self.model['student'].listByUserId(user.userId, function(err, students){
            if(err){
                return next(err);
            }
            if(!students || students.length <= 0){
                return next(new Error("该家长未关联宝贝"));
            }
            if(students.length == 1){//关联宝贝数量为不需要进行宝贝选择
                user.student = students[0];
                self.model['class'].findOne(students[0].classId, function(err, classInfo){
                    if(err){
                        return next(err);
                    }
                    if(!classInfo){
                        return next(new Error("未找到宝贝对应的班级信息"));
                    }
                    user.class = classInfo;
                    self.model['school'].findBySchoolId(students[0].schoolId, function(err, school){
                        if(err){
                            return next(err);
                        }
                        if(!school){
                            return next(new Error("未找到宝贝对应的学校信息"));
                        }
                        user.schools = [school];
                        user.schoolIds = [school.schoolId];
                        var date = new Date();
                        date.setDate(date.getDate() + 7);
                        user.token = jwt.encode({iss : user.userId, exp : date}, self.cacheManager.getCacheValue("JWT", "SECRET"));
                        var expireDate = self.cacheManager.getCacheValue("LOGIN", "TIMEOUT") * 60;
                        self.redis.set(user.token, JSON.stringify(user), "EX", expireDate);
                        self.redis.set(user.userId, user.token, "EX", expireDate);
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
                        if(callback){
                            callback();
                        }
                        res.json({
                            code : "00",
                            data : {
                                userId : user.userId,
                                billId : user.billId,
                                nickName : user.nickName,
                                custName : user.custName,
                                groupId : user.groupId,
                                pointNum : user.pointNum,
                                userUrl : user.userUrl,
                                token : user.token,
                                webUrl : webConfig.WEB_URL,
                                students : retStudents
                            }
                        });
                    });
                });
            }else{
                var date = new Date();
                date.setDate(date.getDate() + 7);
                user.token = jwt.encode({iss : user.userId, exp : date}, self.cacheManager.getCacheValue("JWT", "SECRET"));
                var expireDate = self.cacheManager.getCacheValue("LOGIN", "TIMEOUT") * 60;
                self.redis.set(user.token, JSON.stringify(user), "EX", expireDate);
                self.redis.set(user.userId, user.token, "EX", expireDate);
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
                if(callback){
                    callback();
                }
                res.json({
                    code : "00",
                    data : {
                        userId : user.userId,
                        billId : user.billId,
                        nickName : user.nickName,
                        custName : user.custName,
                        groupId : user.groupId,
                        pointNum : user.pointNum,
                        userUrl : user.userUrl,
                        token : user.token,
                        webUrl : webConfig.WEB_URL,
                        students : retStudents
                    }
                });
            }
        });
    },

    //老师登录
    teacherLogin : function(user, res, next, callback){
        var self = this;
        self.model['class'].listAllByTeacherId(user.userId, function(err, classes){
            if(err){
                return next(err);
            }
            if(!classes || classes.length <= 0){
                return next(new Error("该老师未带班"));
            }
            if(classes.length > 1){
                return next(new Error("该老师带班数量不唯一"));
            }
            user.class = classes[0];
            self.model['school'].findBySchoolId(classes[0].schoolId, function(err, school){
                if(err){
                    return next(err);
                }
                if(!school){
                    return next(new Error("未找到班级对应的学校信息"));
                }
                user.schools = [school];
                user.schoolIds = [school.schoolId];
                var date = new Date();
                date.setDate(date.getDate() + 7);
                user.token = jwt.encode({iss : user.userId, exp : date}, self.cacheManager.getCacheValue("JWT", "SECRET"));
                var expireDate = self.cacheManager.getCacheValue("LOGIN", "TIMEOUT") * 60;
                self.redis.set(user.token, JSON.stringify(user), "EX", expireDate);
                self.redis.set(user.userId, user.token, "EX", expireDate);
                if(callback){
                    callback();
                }
                res.json({
                    code : "00",
                    data : {
                        userId : user.userId,
                        billId : user.billId,
                        nickName : user.nickName,
                        custName : user.custName,
                        groupId : user.groupId,
                        pointNum : user.pointNum,
                        userUrl : user.userUrl,
                        token : user.token,
                        yunAccout : "yunuser_" + user.userId,
                        yunPassword : imCore.getPasswordHash("yunuser_" + user.userId),
                        webUrl : webConfig.WEB_URL,
                        class : {
                            classId : classes[0].classId,
                            schoolId : classes[0].schoolId,
                            gradeId : classes[0].gradeId,
                            className : classes[0].className,
                            classDesc : classes[0].classDesc
                        }
                    }
                });
            });
        });
    },

    //园长登录
    principalLogin : function(isWeb, user, res, next, callback){
        var self = this;
        self.model['school'].listByPrincipalId(user.userId, function(err, schools){
            if(err){
                return next(err);
            }
            if(!schools || schools.length <= 0){
                return next(new Error("该园长未关联园所"));
            }
            if(isWeb){
                user.schools = schools;
                var schoolIds = new Array();
                for(var i = 0; i < schools.length; i ++){
                    schoolIds.push(schools[i].schoolId);
                }
                user.schoolIds = schoolIds;
            }else{
                if(schools.length == 1){
                    user.schools = [schools[0]];
                    user.schoolIds = [schools[0].schoolId];
                }
            }
            var date = new Date();
            date.setDate(date.getDate() + 7);
            user.token = jwt.encode({iss : user.userId, exp : date}, self.cacheManager.getCacheValue("JWT", "SECRET"));
            var expireDate = self.cacheManager.getCacheValue("LOGIN", "TIMEOUT") * 60;
            self.redis.set(user.token, JSON.stringify(user), "EX", expireDate);
            self.redis.set(user.userId, user.token, "EX", expireDate);
            var retSchools = new Array();
            for(var i = 0; i < schools.length; i ++){
                retSchools.push({
                    schoolId : schools[i].schoolId,
                    schoolName : schools[i].schoolName,
                    schoolDesc : schools[i].schoolDesc,
                    schoolUrl : schools[i].schoolUrl
                });
            }
            if(callback){
                callback();
            }
            res.json({
                code : "00",
                data : {
                    userId : user.userId,
                    billId : user.billId,
                    nickName : user.nickName,
                    custName : user.custName,
                    groupId : user.groupId,
                    pointNum : user.pointNum,
                    userUrl : user.userUrl,
                    token : user.token,
                    yunAccout : "yunuser_" + user.userId,
                    yunPassword : imCore.getPasswordHash("yunuser_" + user.userId),
                    webUrl : webConfig.WEB_URL,
                    schools : retSchools
                }
            });
        });
    },

    //集团园长登录
    groupLogin : function(isWeb, user, res, next, callback){
        var self = this;
        self.model['school'].listByGroupId(user.userId, function(err, schools){
            if(err){
                return next(err);
            }
            if(!schools || schools.length <= 0){
                return next(new Error("该集团园长未关联园所"));
            }
            if(isWeb){
                user.schools = schools;
                var schoolIds = new Array();
                for(var i = 0; i < schools.length; i ++){
                    schoolIds.push(schools[i].schoolId);
                }
                user.schoolIds = schoolIds;
            }else{
                if(schools.length == 1){
                    user.schools = [schools[0]];
                    user.schoolIds = [schools[0].schoolId];
                }
            }
            var date = new Date();
            date.setDate(date.getDate() + 7);
            user.token = jwt.encode({iss : user.userId, exp : date}, self.cacheManager.getCacheValue("JWT", "SECRET"));
            var expireDate = self.cacheManager.getCacheValue("LOGIN", "TIMEOUT") * 60;
            self.redis.set(user.token, JSON.stringify(user), "EX", expireDate);
            self.redis.set(user.userId, user.token, "EX", expireDate);
            var retSchools = new Array();
            for(var i = 0; i < schools.length; i ++){
                retSchools.push({
                    schoolId : schools[i].schoolId,
                    schoolName : schools[i].schoolName,
                    schoolDesc : schools[i].schoolDesc,
                    schoolUrl : schools[i].schoolUrl
                });
            }
            if(callback){
                callback();
            }
            res.json({
                code : "00",
                data : {
                    userId : user.userId,
                    billId : user.billId,
                    nickName : user.nickName,
                    custName : user.custName,
                    groupId : user.groupId,
                    pointNum : user.pointNum,
                    userUrl : user.userUrl,
                    token : user.token,
                    yunAccout : "yunuser_" + user.userId,
                    yunPassword : imCore.getPasswordHash("yunuser_" + user.userId),
                    webUrl : webConfig.WEB_URL,
                    schools : retSchools
                }
            });
        });
    },

    //超级园长登录
    adminLogin : function(isWeb, user, res, next, callback) {
        var self = this;
        self.model['school'].listAllSchool(function(err, schools){
            if(err){
                return next(err);
            }
            if(!schools || schools.length <= 0){
                return next(new Error("园所信息为空"));
            }
            var retSchools = new Array();
            for(var i = 0; i < schools.length; i ++){
                retSchools.push({
                    schoolId : schools[i].schoolId,
                    schoolName : schools[i].schoolName,
                    schoolDesc : schools[i].schoolDesc,
                    schoolUrl : schools[i].schoolUrl
                });
            }
            var date = new Date();
            date.setDate(date.getDate() + 7);
            user.token = jwt.encode({iss : user.userId, exp : date}, self.cacheManager.getCacheValue("JWT", "SECRET"));
            var expireDate = self.cacheManager.getCacheValue("LOGIN", "TIMEOUT") * 60;
            self.redis.set(user.token, JSON.stringify(user), "EX", expireDate);
            self.redis.set(user.userId, user.token, "EX", expireDate);
            if(callback){
                callback();
            }
            res.json({
                code : "00",
                data : {
                    userId : user.userId,
                    billId : user.billId,
                    nickName : user.nickName,
                    custName : user.custName,
                    groupId : user.groupId,
                    pointNum : user.pointNum,
                    userUrl : user.userUrl,
                    token : user.token,
                    yunAccout : "yunuser_" + user.userId,
                    yunPassword : imCore.getPasswordHash("yunuser_" + user.userId),
                    webUrl : webConfig.WEB_URL,
                    schools : retSchools
                }
            });
        });
    },

    //web端登录
    weblogin : function(req, res, next){
        var self = this;
        var userName = req.body.userName;
        if(!userName){
            return next(new Error("登录用户名不能为空"));
        }
        var password = req.body.password;
        self.model['user'].findByUserName(userName, function(err, user){
            if(err){
                return next(err);
            }
            if(!user){
                return next(new Error("用户信息不存在"));
            }
            if(user.state != 1){
                return next(new Error("该手机号码为白名单用户，未注册"));
            }
            if(user.password != password){
                return next(new Error("登录密码错误"));
            }
            if(user.roleId <= 0){
                return next(new Error("当前用户无登录权限"));
            }
            if(user.groupId == 10 || user.groupId == 20){
                return next(new Error("web端不允许家长及老师用户登录"));
            }
            user.source = 2;
            user.channel = 4;
            if(user.groupId == 30){
                self.principalLogin(true, user, res, next);
            }else if(user.groupId == 40){
                self.groupLogin(true, user, res, next);
            }else if(user.groupId == 50){
                self.adminLogin(true, user, res, next);
            }
            var clientId = getClientIp(req);
            self.model['userLogin'].logLogin([user.groupId,user.userId,user.nickName,user.billId,user.custName,4,2,2,clientId,null]);
        });
    },

    uppic : function(req, res, next){
        var self = this;
        var userId = req.user.userId;
        var uploadDir = self.cacheManager.getCacheValue("FILE_DIR", "USER_HEAD");
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
            if(files && files.userPic){
                obj.userUrl = path.normalize(files.userPic.path).replace(/\\/g, '/');
            }else{
                return next(new Error("用户头像不能为空"));
            }
            obj.doneDate = new Date();
            self.model['user'].update(obj, userId, function(err, data){
                if(err){
                    return next(err);
                }
                if(data && data.affectedRows == 1){
                    var yunUser = "yunuser_" + userId;
                    var yunPassword = imCore.getPasswordHash(yunUser);
                    var realUrl = webConfig.WEB_URL + obj.userUrl;
                    var yunName = req.user.custName + req.user.nickName;
                    var groupId = req.user.groupId;
                    if(groupId == 10){
                        yunName = req.user.student.studentName + req.user.nickName;
                    }
                    imCore.changeUser(yunUser, yunName, function(err, data){
                        if(err){
                            self.logger.error(err);
                        }
                    }, realUrl);
                    res.json({
                        code : "00",
                        msg : "用户头像上传成功",
                        data : obj.userUrl
                    });
                }else{
                    return next(new Error("用户头像上传失败"));
                }
            });
        });
    },

    resetPwd : function(req, res, next){
        var self = this;
        var userName = req.body.userName;
        var password = req.body.password;
        var securityCode = req.body.securityCode;
        if(!userName){
            return next(new Error("手机号码不能为空"));
        }
        if(!securityCode){
            return next(new Error("短信验证码不能为空"));
        }
        if(!password){
            return next(new Error("密码不能为空"));
        }
        self.model['smsLog'].findOne(userName, securityCode, function(err, smsLog){
            if(err) {
                return next(err);
            }
            if(!smsLog){
                return next(new Error("短信验证码错误"));
            }
            var date = new Date();
            date.setMinutes(date.getMinutes() - 5);
            if (smsLog.sendDate < moment(date).format("YYYY-MM-DD HH:mm:ss")) {
                return next(new Error("短信验证码已过期"));
            }
            self.model['user'].modifyPwd(userName, password, function(err, data){
                if(err){
                    return next(err);
                }
                res.json({
                    code : "00",
                    msg : "重置密码成功"
                });
            });
        });
    },

    modifyPwd : function(req, res, next) {
        var self = this;
        var userName = req.body.userName;
        var password = req.body.password;
        var oldPassword = req.body.oldPassword;
        if (!userName) {
            return next(new Error("手机号码不能为空"));
        }
        if (!oldPassword) {
            return next(new Error("原密码不能为空"));
        }
        if (!password) {
            return next(new Error("新密码不能为空"));
        }
        self.model['user'].findByUserName(userName, function (err, user) {
            if (err) {
                return next(err);
            }
            if (!user) {
                return next(new Error("用户信息不存在"));
            }
            if (user.state != 1) {
                return next(new Error("用户未激活"));
            }
            if (user.password != oldPassword) {
                return next(new Error("原密码错误"));
            }
            self.model['user'].modifyPwd(userName, password, function (err, data) {
                if (err) {
                    return next(err);
                }
                res.json({
                    code: "00",
                    msg: "密码修改成功"
                });
            });
        });
    },

    getSecurityCode : function(req, res, next) {
        var self = this;
        var billId = req.params.billId;
        var securityCode = Math.round(Math.random() * 899999 + 100000);
        self.model['user'].findByUserName(billId, function(err, user){
            if(err){
                return next(err);
            }
            if(!user){
                return next(new Error('用户不存在'));
            }
            SmsSendUtil.sendSms(billId, securityCode, function (data) {
                var error = data.error;
                self.model['smsLog'].saveSmsLog([billId, securityCode, new Date(), error, data.msg], function (err, info) {
                    if (err) {
                        return next(err);
                    }
                    if(error == 0 || error == "0"){
                        return res.json({
                            code: "00",
                            msg: "短信下发成功",
                            data: securityCode
                        });
                    }else{
                        return next(new Error("短信下发失败：" + data.msg));
                    }
                });
            });
        });
    },

    whiteCheck : function(req, res, next){
        var self = this;
        var billId = req.params.billId;
        if(!billId){
            return next(new Error("手机号码不能为空"));
        }
        self.model['user'].findByUserName(billId, function(err, user){
            if(err){
                return next(err);
            }
            if(!user){
                return next(new Error("该手机号码非白名单用户"));
            }
            if(user.state == 1){
                return next(new Error("该手机号码已注册"));
            }
            res.json({
                code : "00",
                msg : "该用户可以注册"
            });
        });
    },

    register : function(req, res, next) {
        var self = this;
        var userName = req.body.userName;
        var password = req.body.password;
        var securityCode = req.body.securityCode;
        if (!userName) {
            return next(new Error("手机号码不能为空"));
        }
        if (!securityCode) {
            return next(new Error("短信验证码不能为空"));
        }
        self.model['user'].findByUserName(userName, function(err, user){
            if(err){
                return next(err);
            }
            if(!user){
                return next(new Error("该手机号码非白名单用户"));
            }
            if(user.state == 1){
                return next(new Error("该手机号码已注册"));
            }
            var groupId = user.groupId;
            var yunName = user.custName + user.nickName;
            if(groupId == 10){
                self.model['student'].listByUserId(user.userId, function(err, students){
                    if(err){
                        return next(err);
                    }
                    if(!students || students.length <= 0){
                        return next(new Error("该家长未关联宝贝，不能注册"));
                    }
                    self.activeByStudent(user, userName, students, securityCode, password, res, next);
                });
            }else if(groupId == 20){
                self.model['class'].listAllByTeacherId(user.userId, function(err, classes){
                    if(err){
                        return next(err);
                    }
                    if(!classes || classes.length <= 0){
                        return next(new Error("该老师未带班"));
                    }
                    if(classes.length > 1){
                        return next(new Error("该老师带班数量不唯一"));
                    }
                    self.active(user, userName, yunName, securityCode, password, res, next);
                });
            }else{
                self.active(user, userName, yunName, securityCode, password, res, next);
            }
        });
    },

    activeByStudent : function(user, userName, students, securityCode, password, res, next){
        var self = this;
        self.model['smsLog'].findOne(userName, securityCode, function (err, smsLog) {
            if (err) {
                return next(err);
            }
            if (!smsLog) {
                return next(new Error("短信验证码错误"));
            }
            var date = new Date();
            date.setMinutes(date.getMinutes() - 5);
            if (smsLog.sendDate < moment(date).format("YYYY-MM-DD HH:mm:ss")) {
                return next(new Error("短信验证码已过期"));
            }
            var userInfoArray = new Array();
            for(var i = 0; i < students.length; i ++){
                var student = students[i];
                var yunUser = "yunuser_" + user.userId + "_" + student.studentId;
                var yunName = student.studentName + user.nickName;
                var yunPassword = imCore.getPasswordHash(yunUser);
                userInfoArray.push({
                    userid: yunUser,
                    password: yunPassword,
                    nick: yunName
                });
            }
            imCore.regUsers(userInfoArray, function(err, yunRes){
                if(err){
                    return next(err);
                }
                self.model['user'].active(userName, password, function (err, data) {
                    if (err) {
                        return next(err);
                    }
                    res.json({
                        code: "00",
                        msg: "注册成功"
                    });
                });
            });
        });
    },

    active : function(user, userName, yunName, securityCode, password, res, next){
        var self = this;
        self.model['smsLog'].findOne(userName, securityCode, function (err, smsLog) {
            if (err) {
                return next(err);
            }
            if (!smsLog) {
                return next(new Error("短信验证码错误"));
            }
            var date = new Date();
            date.setMinutes(date.getMinutes() - 5);
            if (smsLog.sendDate < moment(date).format("YYYY-MM-DD HH:mm:ss")) {
                return next(new Error("短信验证码已过期"));
            }
            var yunUser = "yunuser_" + user.userId;
            var yunPassword = imCore.getPasswordHash(yunUser);
            imCore.regUser(yunUser, yunPassword, yunName, function(err, yunRes){
                if(err){
                    return next(err);
                }
                self.model['user'].active(userName, password, function (err, data) {
                    if (err) {
                        return next(err);
                    }
                    res.json({
                        code: "00",
                        msg: "注册成功"
                    });
                });
            });
        });
    },

    list : function(req, res, next){
        var self = this;
        var start = parseInt(req.query.iDisplayStart || this.webConfig.iDisplayStart);
        var pageSize = parseInt(req.query.iDisplayLength || this.webConfig.iDisplayLength);
        var obj = new Object;
        var groupId = req.query.groupId;
        if(groupId && groupId > 0){
            obj.groupId = parseInt(groupId);
        }
        var userName = req.query.userName;
        if(userName){
            obj.userName = userName;
        }
        var billId = req.query.billId;
        if(billId){
            obj.billId = billId;
        }
        var custName = req.query.custName;
        if(custName){
            obj.custName = custName;
        }
        var custNameOrBillId = req.query.custNameOrBillId;
        var schoolIds = req.query.schoolId ? [parseInt(req.query.schoolId)] : req.user.schoolIds;
        self.model['user'].listByPage(obj, custNameOrBillId, schoolIds, start, pageSize, function(err, total, users){
            if(err){
                return next(err);
            }
            if(users){
                for(var i = 0; i < users.length; i ++){
                    users[i].genderName = self.cacheManager.getCacheValue("USER_GENDER", users[i].gender);
                    users[i].stateName = self.cacheManager.getCacheValue("USER_STATE", users[i].state);
                }
            }
            res.json(self.createPageData("00", total, users));
        });
    },

    add : function(req, res, next){
        var self = this;
        var userName = req.body.userName;
        var roleId = req.body.roleId ? parseInt(req.body.roleId) : 0;
        var schoolId = req.body.schoolId;
        var password = req.body.password;
        var nickName = req.body.nickName;
        var groupId = req.body.groupId;
        var custName = req.body.custName;
        var billId = req.body.billId || userName;
        var email = req.body.email;
        var gender = req.body.gender;
        var address = req.body.address;
        var birthday = req.body.birthday;
        var remark = req.body.remark;
        var nation = req.body.nation;
        var provName = req.body.provName;
        var cityName = req.body.cityName;
        var region = req.body.region;
        var gradSchool = req.body.gradSchool;
        if(groupId == 30 || groupId == 40 || groupId == 50){
            schoolId = null;
        }else{
            if(!schoolId){
                return next(new Error("学校编号不能为空"));
            }
            schoolId = parseInt(schoolId);
        }
        if(!userName){
            return next(new Error("登录名不能为空"));
        }
        if(!groupId){
            return next(new Error("用户所属群组不能为空"));
        }
        if(!custName){
            return next(new Error("用户姓名不能为空"));
        }
        if(!gender){
            return next(new Error("用户性别不能为空"));
        }
        if(!nickName){
            if(groupId == 10){
                nickName = (gender == 1 ? "爸爸" : "妈妈");
            }else if(groupId == 20){
                nickName = "老师";
            }else if(groupId == 30 || groupId == 40 || groupId == 50){
                nickName = "园长";
            }
        }
        var userUrl = self.cacheManager.getCacheValue("FILE_DIR", "DEFAULT_USER_HEAD");
        self.model['user'].findByUserName(userName, function(err, user){
            if(err){
                return next(err);
            }
            if(user && user.userName == userName){
                return next("用户登录名已存在");
            }
            var tempArgs = [groupId,roleId,schoolId,nickName,userName,userUrl,password,custName,billId,email,gender,birthday,address,nation,provName,cityName,region,gradSchool,4,remark];
            self.model['user'].save(tempArgs, function(err, data){
                if(err){
                    return next(err);
                }
                res.json({
                    code : "00",
                    msg : "用户添加成功"
                });
            });
        });
    },

    principals : function(req, res, next){
        var self = this;
        var groupId = parseInt(req.params.groupId);
        self.model['user'].findByGroupIdAndNullSchoolId(groupId, function(err, users){
            if(err){
                return next(err);
            }
            res.json({
                code : "00",
                data : users
            });
        });
    },

    modify : function(req, res, next){
        var self = this;
        var userId = parseInt(req.params.userId);
        if(!userId && userId <= 0){
            return next(new Error("用户编号不能为空"));
        }
        self.model['user'].findByUserId(userId, function(err, user){
            if(err){
                return next(err);
            }
            if(!user){
                return next(new Error("需修改的用户信息不存在"));
            }
            var userName = req.body.userName;
            var groupId = req.body.groupId;
            var roleId = req.body.roleId
            var schoolId = req.body.schoolId;
            var custName = req.body.custName;
            var nickName = req.body.nickName;
            var gender = req.body.gender;
            var password = req.body.password;
            var billId = req.body.billId || userName;
            var email = req.body.email;
            var address = req.body.address;
            var birthday = req.body.birthday;
            var remark = req.body.remark;
            var nation = req.body.nation;
            var provName = req.body.provName;
            var cityName = req.body.cityName;
            var region = req.body.region;
            var gradSchool = req.body.gradSchool;
            var obj = new Object();
            if(userName){
                obj.userName = userName;
            }
            if(groupId){
                obj.groupId = groupId;
            }
            if(custName){
                obj.custName = custName;
            }
            if(roleId){
                obj.roleId = roleId;
            }
            if(schoolId){
                obj.schoolId = schoolId;
            }
            if(gender){
                obj.gender = gender;
            }
            if(!nickName){
                if(!groupId){
                    groupId = user.groupId;
                }
                if(!custName){
                    custName = user.custName;
                }
                if(groupId == 10){
                    if(!gender){
                        gender = user.gender;
                    }
                    nickName = (gender == 1 ? "爸爸" : "妈妈");
                }else if(groupId == 20){
                    nickName = "老师";
                }else if(groupId == 30 || groupId == 40 || groupId == 50){
                    nickName = "园长";
                }
            }
            obj.nickName = nickName;
            if(password){
                obj.password = password;
            }
            if(billId){
                obj.billId = billId;
            }
            if(email){
                obj.email = email;
            }
            if(address){
                obj.address = address;
            }
            if(birthday){
                obj.birthday = birthday;
            }
            if(remark){
                obj.remark = remark;
            }
            if(nation){
                obj.nation = nation;
            }
            if(provName){
                obj.provName = provName;
            }
            if(cityName){
                obj.cityName = cityName;
            }
            if(region){
                obj.region = region;
            }
            if(gradSchool){
                obj.gradSchool = gradSchool;
            }
            obj.doneDate = new Date();
            self.model['user'].update(obj, userId, function(err, data){
                if(err){
                    return next(err);
                }
                res.json({
                    code : "00",
                    msg : "修改成功"
                });
            });
        });
    },

    del : function(req, res, next){
        var self = this;
        var userId = parseInt(req.params.userId);
        if(userId <= 0){
            return next(new Error("需删除的用户编号为空"));
        }
        self.model["user"].findByKey(userId, function(err, user){
            if(err){
                return next(err);
            }
            if(!user){
                return next(new Error("删除的用户信息不存在"));
            }
            var groupId = user.groupId;
            if(groupId == 10){
                self.model['student'].listByUserId(userId, function(err, students){
                    if(err){
                        return next(err);
                    }
                    if(students && students.length > 0){
                        return next(new Error("该家长已关联宝贝，不允许删除"));
                    }
                    self.delUserAndYun(2, userId, res, next);
                });
            }else if(groupId == 20){
                self.model['class'].listAllByTeacherId(userId, function(err, classes) {
                    if (err) {
                        return next(err);
                    }
                    if (classes && classes.length > 0) {
                        return next(new Error("该老师已绑定班级，不允许删除"));
                    }
                    self.delUserAndYun(user.state, userId, res, next);
                });
            }else if(groupId == 30){
                self.model['school'].listByPrincipalId(userId, function(err, schools){
                    if(err){
                        return next(err);
                    }
                    if(schools && schools.length > 0){
                        return next(new Error("该园长已绑定园所，不允许删除"));
                    }
                    self.delUserAndYun(user.state, userId, res, next);
                });
            }else if(groupId == 40){
                self.model['school'].listBrandByGroupId(userId, function(err, brands){
                    if(err){
                        return next(err);
                    }
                    if(brands && brands.length > 0){
                        return next(new Error("该集团园长已绑定品牌，不允许删除"));
                    }
                    self.delUserAndYun(user.state, userId, res, next);
                });
            }else{
                self.delUserAndYun(user.state, userId, res, next);
            }
        });
    },

    delUserAndYun : function(state, userId, res, next){
        var self = this;
        if(state == 1){
            imCore.delUsers("yunuser_" + userId, function(err, data){
                if(err){
                    return next(err);
                }
                self.model["user"].delete(userId, function(err, data){
                    if(err){
                        return next(err);
                    }else if (data.affectedRows !== 1){
                        return next(new Error("用户删除失败"));
                    }
                    res.json({
                        code : "00",
                        msg : "用户删除成功"
                    });
                });
            });
        }else{
            self.model["user"].delete(userId, function(err, data){
                if(err){
                    return next(err);
                }else if (data.affectedRows !== 1){
                    return next(new Error("用户删除失败"));
                }
                res.json({
                    code : "00",
                    msg : "用户删除成功"
                });
            });
        }
    },

    show : function(req, res, next){
        var self = this;
        var userId = parseInt(req.params.userId);
        self.model['user'].findByUserId(userId, function(err, user){
            if(err){
                return next(err);
            }
            if(!user){
                return next(new Error("用户信息不存在"));
            }
            user.genderName = self.cacheManager.getCacheValue("USER_GENDER", user.gender);
            user.stateName = self.cacheManager.getCacheValue("USER_STATE", user.state);
            res.json({
                code: "00",
                data : user
            })
        });
    },

    listGroupUser : function(req, res, next){
        var self = this;
        self.model['user'].listGroupUser(function(err, users){
            if(err){
                return next(err);
            }
            res.json({
                code : "00",
                data : users,
            });
        });
    },

    addAttr : function(req, res, next){
        var self = this;
        var sysDate = new Date();
        var doneCode = sysDate.getTime();
        var userId = parseInt(req.params.userId);
        var attrType = req.params.attrType;
        var oUserId = req.user.userId;
        var body = req.body;
        var tempArray = new Array();
        for(var key in body){
            tempArray.push([userId, attrType, key, body[key], doneCode, 1, sysDate, sysDate, oUserId]);
        }
        if(tempArray.length <= 0){
            return next(new Error("属性信息不能为空"));
        }
        self.model['userAttr'].save(tempArray, function(err, data){
            if(err){
                return next(err);
            }
            res.json({
                code : "00",
                msg : "用户属性添加成功"
            });
        });
    },

    delAttr : function(req, res, next){
        var self = this;
        var userId = req.params.userId;
        var attrType = req.params.attrType;
        var doneCode = req.params.doneCode;
        var oUserId = req.user.userId;
        self.model['userAttr'].delete(userId, attrType, doneCode, oUserId, function(err, data){
            if(err){
                return next(err);
            }
            res.json({
                code : "00",
                msg : "用户属性删除成功"
            });
        });
    },

    showTeacher : function(req, res, next){
        var self = this;
        var teacherId = parseInt(req.params.userId);
        self.model['user'].findByTeacherId(teacherId, function(err, teacher){
            if(err){
                return next(err);
            }
            if(!teacher){
                return res.json({
                    code : "00",
                    data : null
                });
            }
            self.model['userAttr'].list(teacherId, null, function(err, attrs){
                if(err){
                    return next(err);
                }
                if(attrs && attrs.length > 0){
                    for(var i = 0; i < attrs.length; i ++){
                        var attrType = attrs[i].attrType;
                        var attrArray = teacher[attrType];
                        if(!attrArray){
                            attrArray = teacher[attrType] = new Array();
                        }
                        var doneCode = attrs[i].doneCode;
                        var attrObj = null;
                        if(attrArray.length == 0){
                            attrObj = attrArray[0] = new Object();
                            attrObj.doneCode = attrs[i].doneCode;
                            attrObj[attrs[i].attrCode] = attrs[i].attrValue;
                            continue;
                        }
                        attrObj = attrArray[attrArray.length - 1];
                        if(attrObj.doneCode == doneCode){
                            attrObj[attrs[i].attrCode] = attrs[i].attrValue;
                            continue;
                        }
                        attrObj = attrArray[attrArray.length] = new Object();
                        attrObj.doneCode = attrs[i].doneCode;
                        attrObj[attrs[i].attrCode] = attrs[i].attrValue;
                    }
                }
                teacher.genderName = self.cacheManager.getCacheValue("USER_GENDER", teacher.gender);
                res.json({
                    code : "00",
                    data : teacher
                });
            });
        });
    },

    syncYun : function(req, res, next){
        var self = this;
        var yunUser = req.params.yunUser;
        if(!yunUser){
            return next("云帐号不能为空");
        }
        var yunInfo = yunUser.split("_");
        if(yunInfo.length < 2){
            return next("云帐号格式不正确【yunuser_xx】或【yunuser_xx_xx】");
        }
        var userId = parseInt(yunInfo[1]);
        self.model['user'].findByKey(userId, function(err, user){
            if(err){
                return next(err);
            }
            if(!user){
                return next(new Error("用户信息不存在"));
            }
            var groupId = user.groupId;
            if(groupId == 10){
                if(yunInfo.length != 3){
                    return next(new Error("云帐号格式不正确，家长用户格式为【yunuser_xx_xx】"));
                }
                var studentId = parseInt(yunInfo[2]);
                self.model['student'].findByStudentId(studentId, function(err, student){
                    if(err){
                        return next(err);
                    }
                    if(!student){
                        return next(new Error("学生信息不存在"));
                    }
                    var yunName = student.studentName + user.nickName;
                    self.syncToYun(yunUser, yunName, res, next);
                });
            }else{
                var yunName = user.custName + user.nickName;
                self.syncToYun(yunUser, yunName, res, next);
            }

        })

    },

    syncToYun : function(yunUser, yunName, res, next){
        imCore.delUsers(yunUser, function(err, data){
            if(err){
                return next(err);
            }
            var yunPassword = imCore.getPasswordHash(yunUser);
            imCore.regUser(yunUser, yunPassword, yunName, function(err, data){
                if(err){
                    return next(err);
                }
                res.json({
                    code : "00",
                    data : "云帐号同步成功",
                    syncInfo : data
                });
            });
        });
    }
});

function getClientIp(req) {
    return req.headers['x-forwarded-for'] ||
        req.connection.remoteAddress ||
        req.socket.remoteAddress ||
        req.connection.socket.remoteAddress;
};
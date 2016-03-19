var basicController = require("../../core/utils/controller/basicController");
var SmsSendUtil = require("../../core/utils/sms/SmsSendUtil.js");
var jwt = require("jwt-simple");
var moment = require('moment');
var formidable = require("formidable");
var path = require("path");
var imCore = require("../../core/utils/alim/imCore.js");

module.exports = new basicController(__filename).init({

    //退出登录
    logout : function(req, res, next){
        var self = this;
        var token = req.user.token;
        self.redis.del(token);
        var userObj = new Object();
        userObj.doneDate = new Date();
        userObj.installationId = null;
        var userId = req.user.userId;
        self.model['user'].update(userObj, userId, function(err, data){
            if(err){
                self.logger.error("修改installationId失败", err);
            }
        });
        res.json({
            code : "00",
            msg : '退出登录成功'
        });
    },

    //app端登录
    login : function(req, res, next){
        var self = this;
        var userName = req.body.userName;
        var password = req.body.password;
        var source = req.body.source;
        var channel = req.body.channel;
        var groupId = req.body.groupId;
        var installationId = req.body.installationId;
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
        var clientId = getClientIp(req);
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
            if(user.groupId != groupId){
                return next(new Error("用户组不一致，不允许登录"));
            }
            if(user.password != password){
                return next(new Error("登录密码错误"));
            }
            user.source = source;
            user.channel = channel;
            user.installationId = installationId;
            var callback = function(){
                var userObj = new Object();
                userObj.doneDate = new Date();
                userObj.installationId = installationId;
                self.model['user'].update(userObj, user.userId, function(err, data){
                    if(err){
                        self.logger.error("修改installationId失败", err);
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
            self.model['userLogin'].logLogin([user.groupId,user.userId,user.nickName,user.billId,user.custName,channel,source,source,clientId,null]);
        });
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
                        self.redis.set(user.token, JSON.stringify(user), "EX", self.cacheManager.getCacheValue("LOGIN", "TIMEOUT") * 60);
                        var retStudents = new Array();
                        for(var i = 0; i < students.length; i ++){
                            retStudents.push({
                                studentId : students[i].studentId,
                                studentName : students[i].studentName,
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
                                yunAccout : user.yunAccout,
                                yunPassword : imCore.getPasswordHash(user.yunAccout),
                                webUrl : self.cacheManager.getCacheValue("WEB_URL", "WEB_URL"),
                                students : retStudents
                            }
                        });
                    });
                });
            }else{
                var date = new Date();
                date.setDate(date.getDate() + 7);
                user.token = jwt.encode({iss : user.userId, exp : date}, self.cacheManager.getCacheValue("JWT", "SECRET"));
                self.redis.set(user.token, JSON.stringify(user), "EX", self.cacheManager.getCacheValue("LOGIN", "TIMEOUT") * 60);
                var retStudents = new Array();
                for(var i = 0; i < students.length; i ++){
                    retStudents.push({
                        studentId : students[i].studentId,
                        studentName : students[i].studentName,
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
                        yunAccout : user.yunAccout,
                        yunPassword : imCore.getPasswordHash(user.yunAccout),
                        webUrl : self.cacheManager.getCacheValue("WEB_URL", "WEB_URL"),
                        students : retStudents
                    }
                });
            }
        });
    },

    //老师登录
    teacherLogin : function(user, res, next, callback){
        var self = this;
        self.model['class'].listByTeacherId(user.userId, function(err, classes){
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
                self.redis.set(user.token, JSON.stringify(user), "EX", self.cacheManager.getCacheValue("LOGIN", "TIMEOUT") * 60);
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
                        yunAccout : user.yunAccout,
                        yunPassword : imCore.getPasswordHash(user.yunAccout),
                        webUrl : self.cacheManager.getCacheValue("WEB_URL", "WEB_URL"),
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
            self.redis.set(user.token, JSON.stringify(user), "EX", self.cacheManager.getCacheValue("LOGIN", "TIMEOUT") * 60);
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
                    yunAccout : user.yunAccout,
                    yunPassword : imCore.getPasswordHash(user.yunAccout),
                    webUrl : self.cacheManager.getCacheValue("WEB_URL", "WEB_URL"),
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
            self.redis.set(user.token, JSON.stringify(user), "EX", self.cacheManager.getCacheValue("LOGIN", "TIMEOUT") * 60);
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
                    yunAccout : user.yunAccout,
                    yunPassword : imCore.getPasswordHash(user.yunAccout),
                    webUrl : self.cacheManager.getCacheValue("WEB_URL", "WEB_URL"),
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
            self.redis.set(user.token, JSON.stringify(user), "EX", self.cacheManager.getCacheValue("LOGIN", "TIMEOUT") * 60);
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
                    yunAccout : user.yunAccout,
                    yunPassword : imCore.getPasswordHash(user.yunAccout),
                    webUrl : self.cacheManager.getCacheValue("WEB_URL", "WEB_URL"),
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
                self.model['smsLog'].saveSmsLog([billId, securityCode, new Date(), 0, data.msg], function (err, info) {
                    if (err) {
                        return next(err);
                    }
                    self.model['smsLog'].findSms(billId, function (err, smsLog) {
                        if (err) {
                            return next(err);
                        }
                        if (!smsLog) {
                            return next(new Error("短信验证码错误"));
                        }
                        res.json({
                            code: "00",
                            msg: "短信下发成功",
                            data: smsLog
                        });
                    });

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
            if(groupId == 10){
                self.model['student'].listByUserId(user.userId, function(err, students){
                    if(err){
                        return next(err);
                    }
                    if(!students || students.length <= 0){
                        return next(new Error("该家长未关联宝贝，不能注册"));
                    }
                    self.active(user, userName, securityCode, password, res, next);
                });
            }else if(groupId == 20){
                self.model['class'].listByTeacherId(user, function(err, classes){
                    if(err){
                        return next(err);
                    }
                    if(!classes || classes.length <= 0){
                        return next(new Error("该老师未带班"));
                    }
                    if(classes.length > 1){
                        return next(new Error("该老师带班数量不唯一"));
                    }
                    self.active(user, userName, securityCode, password, res, next);
                });
            }else{
                self.active(user, userName, securityCode, password, res, next);
            }

        });
    },

    active : function(user, userName, securityCode, password, res, next){
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
            imCore.regUser(yunUser, yunPassword, user.custName, function(err, yunRes){
                if(err){
                    return next(err);
                }
                self.model['user'].active(userName, password, yunUser, function (err, data) {
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
                nickName = custName.substr(0, 1) + "老师";
            }else if(groupId == 30 || groupId == 40 || groupId == 50){
                nickName = custName.substr(0, 1) + "园长";
            }else if(groupId == 99){
                nickName = "超级管理员";
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
            self.model['user'].save([groupId,roleId,schoolId,nickName,userName,userUrl,password,custName,billId,email,gender,birthday,address,4], function(err, data){
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
            var billId = req.body.billId | userName;
            var email = req.body.email;
            var address = req.body.address;
            var birthday = req.body.birthday;
            var remark = req.body.remark;
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
                    nickName = custName.substr(0, 1) + "老师";
                }else if(groupId == 30 || groupId == 40 || groupId == 50){
                    nickName = custName.substr(0, 1) + "园长";
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
        var userId = req.params.userId;
        if(!userId){
            return next(new Error("需删除的用户编号为空"));
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
    }
});

function getClientIp(req) {
    return req.headers['x-forwarded-for'] ||
        req.connection.remoteAddress ||
        req.socket.remoteAddress ||
        req.connection.socket.remoteAddress;
};
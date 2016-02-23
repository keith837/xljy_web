var basicController = require("../../core/utils/controller/basicController");
var SmsSendUtil = require("../../core/utils/sms/SmsSendUtil.js");
var jwt = require("jwt-simple");

module.exports = new basicController(__filename).init({
    login : function(req, res, next){
        var self = this;
        var userName = req.body.userName;
        var password = req.body.password;
        var source = req.body.source;
        var channel = req.body.channel;
        var groupId = req.body.groupId;
        console.log(req.body);
        if(!userName){
            return next(new Error("登录用户名不能为空"));
        }
        if(!source){
            return next(new Error("登录渠道信息不能为空"));
        }
        if(!channel){
            return next(new Error("登入入口信息不能为空"));
        }
        if(!groupId){
            return next(new Error("用户组信息不能为空"));
        }
        self.model['user'].findOne(groupId, userName, function(err, user){
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
            user.source = source;
            user.channel = channel;
            if(groupId == 10){
                self.parentLogin(user, res, next);
            }else if(groupId == 20){
                self.teacherLogin(user, res, next);
            }else if(groupId == 30 || groupId == 40 || groupId == 50){
                self.principalLogin(user, res, next);
            }else if(groupId == 99){
                self.adminLogin(user, res, next);
            }else{
                return next(new Error("用户组信息未定义"));
            }
            var clientId = getClientIp(req);
            self.model['userLogin'].logLogin([user.groupId,user.userId,user.nickName,user.billId,user.custName,channel,source,source,clientId,null]);
        });
    },

    parentLogin : function(user, res, next){
        var self = this;
        self.model['student'].listByUserId(user.userId, function(err, students){
            if(err){
                return next(err);
            }
            if(!students || students.length <= 0){
                return next(new Error("该家长未关联宝贝"));
            }
            if(students.length == 1){
                user.student = students[0];
            }
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
            res.json({
                code : "00",
                data : {
                    userId : user.userId,
                    billId : user.billId,
                    nickName : user.nickName,
                    custName : user.custName,
                    groupId : user.groupId,
                    pointNum : user.pointNum,
                    token : user.token,
                    students : retStudents
                }
            });
        });
    },

    teacherLogin : function(user, res, next){
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
            user.classInfo = classes[0];
            var date = new Date();
            date.setDate(date.getDate() + 7);
            user.token = jwt.encode({iss : user.userId, exp : date}, self.cacheManager.getCacheValue("JWT", "SECRET"));
            self.redis.set(user.token, JSON.stringify(user), "EX", self.cacheManager.getCacheValue("LOGIN", "TIMEOUT") * 60);
            res.json({
                code : "00",
                data : {
                    userId : user.userId,
                    billId : user.billId,
                    nickName : user.nickName,
                    custName : user.custName,
                    groupId : user.groupId,
                    pointNum : user.pointNum,
                    token : user.token,
                    classInfo : {
                        classId : classes[0].classId,
                        schoolId : classes[0].schoolId,
                        gradeId : classes[0].gradeId,
                        className : classes[0].className,
                        classDesc : classes[0].classDesc
                    }
                }
            })
        });
    },

    principalLogin : function(user, res, next){
        var self = this;
        self.model['school'].listByPrincipalId(user.userId, function(err, schools){
            if(err){
                return next(err);
            }
            if(!schools || schools.length <= 0){
                return next(new Error("该校长未关联园所"));
            }
            if(schools.length == 1){
                user.school = schools[0];
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
            res.json({
                code : "00",
                data : {
                    userId : user.userId,
                    billId : user.billId,
                    nickName : user.nickName,
                    custName : user.custName,
                    groupId : user.groupId,
                    pointNum : user.pointNum,
                    token : user.token,
                    schools : retSchools
                }
            });
        });
    },

    weblogin : function(req, res, next){
        var self = this;
        var userName = req.body.userName;
        if(!userName){
            return next(new Error("登录用户名不能为空"));
        }
        var password = req.body.password;
        self.model['user'].findOneByUserName(userName, function(err, user){
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
            user.source = 2;
            user.channel = 4;
            self.adminLogin(user, res, next);
        });
    },

    adminLogin : function(user, res, next) {
        var self = this;
        var date = new Date();
        date.setDate(date.getDate() + 7);
        user.token = jwt.encode({iss : user.userId, exp : date}, self.cacheManager.getCacheValue("JWT", "SECRET"));
        self.redis.set(user.token, JSON.stringify(user), "EX", self.cacheManager.getCacheValue("LOGIN", "TIMEOUT") * 60);
        res.json({
            code : "00",
            data : {
                userId : user.userId,
                billId : user.billId,
                nickName : user.nickName,
                custName : user.custName,
                groupId : user.groupId,
                pointNum : user.pointNum,
                token : user.token
            }
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
            if(smsLog.sendDate < date){
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
        self.model['user'].findOneByUserName(userName, function (err, user) {
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
    },

    whiteCheck : function(req, res, next){
        var self = this;
        var billId = req.params.billId;
        if(!billId){
            return next(new Error("手机号码不能为空"));
        }
        self.model['user'].findOneByUserName(billId, function(err, user){
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
        self.model['user'].findOneByUserName(userName, function(err, user){
            if(err){
                return next(err);
            }
            if(!user){
                return next(new Error("该手机号码非白名单用户"));
            }
            if(user.state == 1){
                return next(new Error("该手机号码已注册"));
            }
            self.model['smsLog'].findOne(userName, securityCode, function (err, smsLog) {
                if (err) {
                    return next(err);
                }
                if (!smsLog) {
                    return next(new Error("短信验证码错误"));
                }
                var date = new Date();
                date.setMinutes(date.getMinutes() - 5);
                if (smsLog.sendDate < date) {
                    return next(new Error("短信验证码已过期"));
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
        var start = req.query.start ? parseInt(req.query.start) : 0;
        var pagesize = req.query.pageSize ? parseInt(req.query.pageSize) : 100;
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
        self.model['user'].listByPage(obj, start, pagesize, function(err, total, users){
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
        var password = req.body.password;
        var nickName = req.body.nickName;
        var groupId = req.body.groupId;
        var custName = req.body.custName;
        var billId = req.body.billId | userName;
        var email = req.body.email;
        var gender = req.body.gender;
        var address = req.body.address;
        var birthday = req.body.birthday;
        var remark = req.body.remark;
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
        self.model['user'].findOneByUserName(userName, function(err, user){
            if(err){
                return next(err);
            }
            if(user && user.userName == userName){
                return nrxt("登录名已存在");
            }
            self.model['user'].save([groupId,0,nickName,userName,password,custName,billId,email,gender,birthday,address,4], function(err, data){
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

    modify : function(req, res, next){
        var self = this;
        var userId = parseInt(req.params.userId);
        if(!userId && userId <= 0){
            return next(new Error("用户编号不能为空"));
        }
        self.model['user'].findOneByUserId(userId, function(err, user){
            if(err){
                return next(err);
            }
            if(!user){
                return next(new Error("修改的用户信息不存在"));
            }
            var userName = req.body.userName;
            var groupId = req.body.groupId;
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

            if(gender){
                obj.gender = gender;
            }
            if(!nickName){
                if(!groupId){
                    groupId = user.groupId;
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
                }else if(groupId == 99){
                    nickName = "超级管理员";
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
        self.model['user'].findOneByUserId(userId, function(err, user){
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

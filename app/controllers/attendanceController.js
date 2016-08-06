var basicController = require("../../core/utils/controller/basicController");
var moment = require('moment');
var SmsSendUtil = require("../../core/utils/sms/SmsSendUtil.js");
var pushCore = require("../../core/utils/alim/pushCore");

module.exports = new basicController(__filename).init({

    attendance : function(req, res, next){
        var self = this;
        var macAddr = req.params.macAddr;
        if(!macAddr || macAddr == ""){
            return next("mac地址不能为空");
        }else{
            macAddr = macAddr.toUpperCase();
        }
        var checkFlag = req.body.checkFlag;
        var checkTime = req.body.checkTime;
        var stationAddr = req.body.stationAddr;
        if(!checkFlag){
            return next("进出园标志不能为空");
        }else{
            checkFlag = parseInt(checkFlag);
        }
        if(!checkTime){
            return next("进出园时间不能为空");
        }
        var attendanceDate = moment(checkTime, "YYYYMMDDHHmmss");
        var attendanceTime = attendanceDate.toDate();
        self.logger.info("请求入参：macAddr=" + macAddr + ",checkFlag=" + checkFlag + ",checkTime=" + checkTime);
        self.model["attendance"].saveCheckTime([macAddr,checkFlag,checkTime,stationAddr], function(err, data){
            if(err){
                self.logger.error("保存出入园请求信息失败：", err);
            }
        });
        self.model["device"].findByMacAddr(macAddr, function(err, studengInfo){
            if(err){
                return next(err);
            }
            if(!studengInfo){
                return next("macAddr【" + macAddr + "】未绑定学生");
            }
            self.model["attendance"].findByObjId(1, studengInfo.studentId, attendanceDate.format("YYYY-MM-DD"), function(err, attendance){
                if(err){
                    return next(err);
                }
                if(checkFlag == 1){
                    if(attendance){
                        self.afterAttendance(res, next, studengInfo, checkFlag, checkTime, attendanceDate, attendanceTime);
                    }else{
                        self.model["attendance"].save([studengInfo.schoolId, studengInfo.classId, attendanceTime, 1, studengInfo.studentId, attendanceTime, null, null], function(err, data){
                            if(err){
                                return next(err);
                            }
                            self.afterAttendance(res, next, studengInfo, checkFlag, checkTime, attendanceDate, attendanceTime);
                        });
                    }
                }else if(checkFlag == 2){
                    if(attendance){
                        var obj = new Object();
                        obj.leaveDate = attendanceTime;
                        self.model["attendance"].update(obj, attendance.attendanceId, function(err, date){
                            if(err){
                                return next(err);
                            }
                            self.afterAttendance(res, next, studengInfo, checkFlag, checkTime, attendanceDate, attendanceTime);
                        });
                    }else{
                        self.model["attendance"].save([studengInfo.schoolId, studengInfo.classId, attendanceTime, 1, studengInfo.studentId, null, attendanceTime, null], function(err, data){
                            if(err){
                                return next(err);
                            }
                            self.afterAttendance(res, next, studengInfo, checkFlag, checkTime, attendanceDate, attendanceTime);
                        });
                    }
                }else{
                    self.logger.info("未知出入园类型checkFlag=" + checkFlag);
                }
            });

        });
    },

    afterAttendance : function(res, next, studengInfo, checkFlag, checkTime, attendanceDate, attendanceTime){
        var self = this;
        var dateStr = attendanceDate.format("YYYY-MM-DD HH:mm:ss");
        self.model["student"].findParentByStudentId(studengInfo.studentId, function(err, parentUsers){
            var allUsers = [];
            var isSendFlag = false;
            if(err){
                self.logger.error("查询学生家长失败：", err);
            }else{
                if(!parentUsers || parentUsers.length <= 0){
                    self.logger.info("未找到学生【" + studengInfo.studentName + "】关联的家长信息");
                }else{
                    for(var i = 0; i < parentUsers.length; i ++){
                        allUsers.push(parentUsers[i]);
                    }
                }
            }
            if(checkFlag == 2){
                self.model["class"].findGradeByClassId(studengInfo.classId, function(err, grade){
                    if(err){
                        self.logger.error("查询年级信息失败：", err);
                    }else{
                        if(!grade){
                            self.logger.info("未查到班级编号【" + studengInfo.classId  + "】关联的年级信息");
                        }else{
                            var attndSubTime = attendanceDate.format("HH:mm:ss");
                            if(attndSubTime > grade.sComeDate && attndSubTime < grade.sLeaveDate){
                                isSendFlag = true;
                                var redisKey = "attendance_" + studengInfo.studentId;
                                self.redis.get(redisKey, function (err, lastTimestamp) {
                                    if (err) {
                                        return next(err);
                                    }
                                    var currentTimestamp = moment().format("YYYYMMDDHHmmss");
                                    if (!lastTimestamp) {
                                        lastTimestamp = 19700101000000;
                                    }
                                    lastTimestamp = moment(lastTimestamp, "YYYYMMDDHHmmss").add(3, 'minutes').format("YYYYMMDDHHmmss");

                                    self.logger.info("[" + redisKey + "]上次异常离园时间（加3分钟）:" + lastTimestamp);
                                    if (currentTimestamp <= lastTimestamp) {
                                        self.logger.info("3分钟内不重复发短信提醒");
                                    } else {
                                        self.model["class"].listTeacherByClassId(studengInfo.classId, function(err, tUsers){
                                            if(err){
                                                self.logger.error("查询班级老师失败：", err);
                                            }else{
                                                if(!tUsers || tUsers.length <= 0){
                                                    self.logger.info("未查到需下发短信的班级老师的信息");
                                                }else{
                                                    for(var i = 0; i < tUsers.length; i ++){
                                                        self.logger.info("开始给老师【" + tUsers[i].custName + "-" + tUsers[i].userName + "】下发短信:");
                                                        SmsSendUtil.sendNoticeSms(tUsers[i].userName, "你班的" + studengInfo.studentName + "学生，正在校门口区域，请尽快核实", function(data){
                                                            self.logger.info("给老师下发短信完成：" + JSON.stringify(data));
                                                        });
                                                    }
                                                    self.redis.set(redisKey, currentTimestamp);
                                                }
                                            }
                                        });
                                        /*if(allUsers != null && allUsers.length > 0){
                                         for(var i = 0; i < allUsers.length; i ++){
                                         SmsSendUtil.sendNoticeSms(allUsers[i].userName, "你家宝宝于" + dateStr + "," + (checkFlag == 1 ? "进入" : "离开") + "学校", function(data){
                                         self.logger.info("给家长下发短信完成" + JSON.stringify(data));
                                         });
                                         }
                                         }*/
                                    }

                                });
                            }
                        }
                    }
                    if(!isSendFlag){
                        self.notice(allUsers, studengInfo, checkFlag, dateStr);
                    }
                });
            }else{
                self.notice(allUsers, studengInfo, checkFlag, dateStr);
            }
        });
        return res.json({
            code : "00",
            msg : "进出园信息录入成功"
        });
    },

    notice : function(allUsers, studengInfo, checkFlag, dateStr){
        var self = this;
        if(allUsers != null && allUsers.length > 0) {
            var deviceUsers = [];
            for (var i = 0; i < allUsers.length; i++) {
                if (allUsers[i].installationId) {
                    deviceUsers.push(pushCore.genUser(allUsers[i].deviceType, allUsers[i].installationId));
                }
            }
            if (deviceUsers != null && deviceUsers.length > 0) {
                var noticeAction = self.cacheManager.getOneCache("STU_ATTENDANCE_NOTICE");
                var content = "你家宝宝于" + dateStr + "," + (checkFlag == 1 ? "进入" : "离开") + "学校";
                var inData = {
                    "ios": {
                        "alert": content,
                        "category": noticeAction.codeKey,
                        "sound": "notificationCupcake.caf",
                        "studentId": studengInfo.studentId,
                        "studentName": studengInfo.studentName,
                        "dateStr": dateStr,
                        "checkFlag": checkFlag
                    },
                    "android": {
                        "alert": content,
                        "title": content,
                        "action": noticeAction.codeValue,
                        "studentId": studengInfo.studentId,
                        "studentName": studengInfo.studentName,
                        "dateStr": dateStr,
                        "checkFlag": checkFlag
                    }
                };
                pushCore.pushToUsers(inData, deviceUsers, function (err, objectId) {
                    if (err) {
                        return self.logger.error("推送出入园通知失败", err);
                    }
                    self.logger.info("推送出入园通知成功,objectId=" + objectId);
                });
            }else{
                self.logger.info("需消息推送的用户信息不存在");
            }
        }
    }

});
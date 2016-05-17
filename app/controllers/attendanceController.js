var basicController = require("../../core/utils/controller/basicController");
var moment = require('moment');
var SmsSendUtil = require("../../core/utils/sms/SmsSendUtil.js");

module.exports = new basicController(__filename).init({

    attendance : function(req, res, next){
        var self = this;
        var macAddr = req.params.macAddr;
        if(!macAddr || macAddr == ""){
            return next("mac地址不能为空");
        }
        var checkFlag = req.body.checkFlag;
        var checkTime = req.body.checkTime;
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
        self.model["device"].findByMacAddr(macAddr, function(err, studengInfo){
            if(err){
                return next(err);
            }
            if(!studengInfo){
                return next("macAddr【" + macAddr + "】未绑定学生");
            }
            var dateStr = attendanceDate.format("YYYY-MM-DD HH:mm:ss");
            self.model["attendance"].save([studengInfo.schoolId, studengInfo.classId, attendanceTime, 1, studengInfo.studentId, checkFlag, attendanceTime, null], function(err, data){
                if(err){
                    return next(err);
                }
                self.model["student"].findParentByStudentId(studengInfo.studentId, function(err, parentUsers){
                    if(err){
                        self.logger.error("查询学生家长失败：", err);
                    }else{
                        if(!parentUsers || parentUsers.length <= 0){
                            self.logger.info("未找到学生【" + studengInfo.studentName + "】关联的家长信息");
                        }else{
                            for(var i = 0; i < parentUsers.length; i ++){
                                console.log(JSON.stringify(parentUsers[i]));
                                SmsSendUtil.sendNoticeSms(parentUsers[i].userName, "你家宝宝于" + dateStr + "," + (checkFlag == 1 ? "进入" : "离开") + "学校", function(data){
                                    self.logger.info("给家长下发短信完成" + JSON.stringify(data));
                                });
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
                                        SmsSendUtil.sendNoticeSms(grade.userName, "你班的" + studengInfo.studentName + "学生，在非放学时间离开学校，请尽快核实", function(data){
                                            self.logger.info("给老师下发短信完成" + JSON.stringify(data));
                                        });
                                    }
                                }
                            }
                        });
                    };
                });
                return res.json({
                    code : "00",
                    msg : "进出园信息录入成功"
                });
            });
        });
    }

});
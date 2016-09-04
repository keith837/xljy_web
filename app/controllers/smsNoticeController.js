/**
 * Created by developer on 2016/9/4.
 */
var basicController = require("../../core/utils/controller/basicController");
module.exports = new basicController(__filename).init({

    list: function (req, res, next) {
        var self = this;
        var start = parseInt(req.query.iDisplayStart || this.webConfig.iDisplayStart);
        var pageSize = parseInt(req.query.iDisplayLength || this.webConfig.iDisplayLength);
        var obj = new Object;
        var schoolIds = req.query.schoolId ? [parseInt(req.query.schoolId)] : req.user.schoolIds;
        var classId = req.query.classId;
        if (classId && classId > 0) {
            obj.classId = parseInt(classId);
        }
        var studentName = req.query.studentName;
        if (studentName) {
            obj.studentName = "%" + studentName + "%";
        }
        self.model["student"].listByPage(obj, schoolIds, start, pageSize, function (err, total, students) {
            if (err) {
                return next(err);
            }
            if (!students || students.length <= 0) {
                return res.json(self.createPageData("00", total, students));
            }
            var studentIds = new Array();
            for (var i = 0; i < students.length; i++) {
                students[i].genderName = self.cacheManager.getCacheValue("USER_GENDER", students[i].gender);
                students[i].stateName = self.cacheManager.getCacheValue("USER_STATE", students[i].state);
                studentIds.push(students[i].studentId);
            }
            self.model['student'].findParents(studentIds, function (err, parents) {
                if (err) {
                    return next(err);
                }
                var parentsObj = new Object();
                for (var i = 0; i < parents.length; i++) {
                    var parentsArray = parentsObj[parents[i].studentId];
                    if (!parentsArray) {
                        parentsArray = new Array();
                        parentsObj[parents[i].studentId] = parentsArray;
                    }
                    parentsArray.push({
                        nickName: parents[i].nickName,
                        userId: parents[i].userId,
                        custName: parents[i].custName,
                        userName: parents[i].userName,
                        smsFlag: parents[i].smsFlag,
                        relId: parents[i].relId
                    });
                }

                var retStudents = new Array();
                for (var i = 0; i < students.length; i++) {
                    var p = parentsObj[students[i].studentId];
                    if (!p) {
                        retStudents.push({
                            "studentId": students[i].studentId,
                            "studentName": students[i].studentName,
                            "className": students[i].className,
                            "schoolName": students[i].schoolName,
                            "state": students[i].state,
                            "createDate": students[i].createDate,
                            "parents": "未绑定",
                            "smsFlag": -1,
                            "parentUserId": "",
                            "relId": -1
                        });
                    } else {
                        for (var j in p) {
                            retStudents.push({
                                "studentId": students[i].studentId,
                                "studentName": students[i].studentName,
                                "className": students[i].className,
                                "schoolName": students[i].schoolName,
                                "state": students[i].state,
                                "createDate": students[i].createDate,
                                "parents": p[j].nickName + " " + p[j].custName,
                                "smsFlag": p[j].smsFlag,
                                "relId": p[j].relId
                            });
                        }
                    }
                }
                res.json(self.createPageData("00", total, retStudents));
            });
        });
    },

    cancel: function (req, res, next) {
        var self = this;
        var relId = req.params.id;
        if (!relId) {
            return next(new Error("家长关系relId不能为空"));
        }

        self.model["student"].updateSmsFlag(0, relId, function (err, data) {
            if (err) {
                return next(err);
            }
            res.json({
                code: "00",
                msg: "操作成功"
            });
        });

    },

    set: function (req, res, next) {
        var self = this;
        var relId = req.params.id;
        if (!relId) {
            return next(new Error("家长关系relId不能为空"));
        }

        self.model["student"].updateSmsFlag(1, relId, function (err, data) {
            if (err) {
                return next(err);
            }
            res.json({
                code: "00",
                msg: "操作成功"
            });
        });

    }


});
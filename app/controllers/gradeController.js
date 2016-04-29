var basicController = require("../../core/utils/controller/basicController");
module.exports = new basicController(__filename).init({


    list: function (req, res, next) {
        var self = this;
        var groupId = req.user.groupId;
        if (groupId == 10 || groupId == 20) {
            return next(new Error("当前用户无查询权限"));
        }
        var start = parseInt(req.query.iDisplayStart || this.webConfig.iDisplayStart);
        var pageSize = parseInt(req.query.iDisplayLength || this.webConfig.iDisplayLength);
        var obj = new Object;
        var gradeName = req.query.gradeName;
        if (gradeName) {
            obj.gradeName = gradeName;
        }
        self.model['grade'].listByPage(obj, start, pageSize, function (err, total, brands) {
            if (err) {
                return next(err);
            }
            res.json(self.createPageData("00", total, brands));
        });
    },
    detail: function (request, response, next) {
        var self = this;
        var gradeId = request.params.id;
        this.model['grade'].queryDetail(gradeId, function (err, res) {
            if (err) {
                return next(err);
            } else if (res.length === 0) {
                return next(self.Error("无法查询到年级详情[" + gradeId + "]."));
            }
            response.json({code: "00", data: res[0]});
        });
    },

    update: function (request, response, next) {
        var self = this;
        var param = {};
        param = parseGrade(request);
        param.gradeId = parseInt(request.params.id);
        if (!param.gradeId || isNaN(param.gradeId)) {
            return next(this.Error("没有输入年级ID."));
        }
        if (!param.gradeName) {
            return next(this.Error("没有输入年级名称"));
        }
        if (!param.schoolId || isNaN(param.schoolId)) {
            return next(this.Error("没有输入所属学校"));
        }
        this.model['grade'].update(param, function (err, data) {
            if (err) {
                return next(err);
            } else if (data.affectedRows !== 1) {
                return next(self.Error("更新学校失败."));
            } else {
                response.json({code: "00", msg: "更新学校成功."});
            }
        });
    },

    add: function (request, response, next) {
        var self = this;
        var param = {};
        param = parseGrade(request);
        if (!param.gradeName) {
            return next(this.Error("没有输入年级名称"));
        }
        if (!param.schoolId || isNaN(param.schoolId)) {
            return next(this.Error("没有输入所属学校"));
        }
        this.model['grade'].add(param, function (err, insertId) {
            if (err) {
                return next(err);
            } else if (!insertId) {
                return next(self.Error("添加年级失败."));
            } else {
                response.json({code: "00", msg: "添加年级成功."});
            }
        });
    },
    del: function (request, response, next) {
        var self = this;
        var id = parseInt(request.params.id);
        var userId = request.user.userId;
        if(id <= 0){
            return next(new Error("年级编号不能为空"));
        }
        self.model["grade"].listClassByGradeId(id, function(err, classes){
            if(err){
                return next(err);
            }
            if(classes && classes.length >= 0){
                return next(new Error("该年级已绑定班级，不允许删除"));
            }
            self.model['grade'].del(id, userId, function (err, data) {
                if (err) {
                    return next(err);
                } else if (data.affectedRows !== 1) {
                    return next(self.Error("删除年级记录失败."));
                }
                response.json({code: "00", msg: "删除年级记录成功."});
            });
        });
    },
});


function parseGrade(request) {
    var grade = {};
    grade.gradeName = request.body.gradeName;
    grade.schoolId = request.body.schoolId;
    grade.sComeDate = request.body.sComeDate;
    grade.sLeaveDate = request.body.sLeaveDate;
    grade.tComeDate = request.body.tComeDate;
    grade.tLeaveDate = request.body.tLeaveDate;
    var userId = request.user.userId;
    grade.oUserId = userId;
    return grade;
}
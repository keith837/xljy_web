var basicController = require("../../core/utils/controller/basicController");

module.exports = new basicController(__filename).init({
    select : function(req, res, next) {
        var self = this;
        var schoolId = req.params.schoolId;
        var userId = req.user.userId;
        self.model['school'].findOne(userId, schoolId, function (err, school) {
            if (err) {
                return next(err);
            }
            if (!school) {
                return next(new Error("未查到关联的园所信息"));
            }
            var user = req.user;
            user.school = school;
            self.redis.set(user.token, JSON.stringify(user));
            res.json({
                code: "00",
                msg: "园所选择成功"
            });
        });
    },

    list : function(req, res, next) {
        var self = this;
        var userId = req.user.userId;
        self.model['school'].findSchool(userId, function (err, schools) {
            if (err) {
                return next(err);
            }
            if (!schools || schools.length <= 0) {
                return next(new Error("该校长未关联学校"));
            }
            var retSchools = new Array();
            for (var i = 0; i < schools.length; i++) {
                retSchools.push({
                    schoolId: schools[i].schoolId,
                    schoolName: schools[i].schoolName,
                    schoolDesc: schools[i].schoolDesc,
                    schoolUrl: schools[i].schoolUrl
                });
            }
            res.json({
                code: "00",
                schools: retSchools
            });
        });
    },
    listClass : function(req, res, next) {
        var self = this;
        var schoolId = req.params.schoolId;
        self.model['class'].listBySchoolId(schoolId, function (err, classes) {
            if (err) {
                return next(err);
            }
            if (!classes || classes.length <= 0) {
                return next(new Error("该学校没有班级信息"));
            }
            res.json({
                code: "00",
                classes: classes
            });
        });
    }
});
var basicController = require("../../core/utils/controller/basicController");

module.exports = new basicController(__filename).init({
    select : function(req, res, next){
        var self = this;
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
            self.redis.set(user.token, JSON.stringify(user));
            res.json({
                code : "00",
                msg : "宝贝选择成功"
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
                    schoolId : students[i].schoolId,
                    classId : students[i].classId
                });
            }
            res.json({
                code : "00",
                students : retStudents
            });
        });
    }
});
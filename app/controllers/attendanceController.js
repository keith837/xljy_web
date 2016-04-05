var basicController = require("../../core/utils/controller/basicController");

module.exports = new basicController(__filename).init({
    studentCome : function(req, res, next){
        var self = this;
        var studentId = req.params.studentId;
        //self.model['attendance'].save()
    },

    studentLeave : function(req, res, next){

    },

    teacherCome : function(req, res, next){

    },

    teacherLeave : function(req, res, next){

    },

    list : function(req, res, next){

    }
});
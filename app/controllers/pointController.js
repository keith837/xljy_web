/**
 * Created by wenhao on 2016/2/10.
 */
var basicController = require("../../core/utils/controller/basicController");
var url = require('url');

module.exports = new basicController(__filename).init({
        show : function(req, res, next){
            var self = this;
            var userId = req.params.userId;
            self.model['point'].queryUserPoint(userId,function(err, point){
                if(err){
                    return next(err);
                }
                if(!point){
                    return next(new Error("积分记录不存在"));
                }
                res.json({
                    code: "00",
                    data : point
                })
            });
        },
        list : function(req, res, next){
            var self = this;
            var arg = url.parse(req.url, true).query;
            var schoolId = arg.schoolId;
            var classId = arg.classId;
            var userId = arg.userId;
            self.model['point'].listAll(schoolId,classId,userId,function(err, point){
                if(err){
                    return next(err);
                }
                if(!point){
                    return next(new Error("积分记录不存在"));
                }
                res.json({
                    code: "00",
                    data : point
                })
            });
        },
        update: function(req, res, next){
            var self = this;
            res.setHeader('Content-Type', 'application/json;charset=utf-8');
            var userName = req.body.userName;
            var type = req.body.type;
            var pointNum = req.body.pointNum;
            self.model['point'].create(pointNum,userName,type,function(err, data){
                if(err){
                    return next(err);
                }
                res.send({
                    code: "00",
                    msg: "积分变更成功"
                })
            });
        }
});
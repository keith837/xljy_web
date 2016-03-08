var basicController = require("../../core/utils/controller/basicController");
module.exports = new basicController(__filename).init({


    list : function(req, res, next){
        var self = this;
        var groupId = req.user.groupId;
        if(groupId == 10 || groupId == 20 ){
            return next(new Error("当前用户无查询权限"));
        }
        var start = parseInt(req.query.iDisplayStart || this.webConfig.iDisplayStart);
        var pageSize = parseInt(req.query.iDisplayLength || this.webConfig.iDisplayLength);
        var obj = new Object;
        var gradeName = req.query.gradeName;
        if(gradeName){
            obj.gradeName = gradeName;
        }
        self.model['grade'].listByPage(obj, start, pageSize, function(err, total, brands){
            if(err){
                return next(err);
            }
            res.json(self.createPageData("00", total, brands));
        });
    }
});
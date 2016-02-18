/**
 * Created by zyl on 16/1/27.用户组管理
 */

var basicController = require("../../core/utils/controller/basicController");
module.exports = new basicController(__filename).init({
    list: function (request, response, next) {
        var self = this;
        var start = parseInt(request.query.iDisplayStart || 0);
        var pageSize = parseInt(request.query.iDisplayLength || 10);
        var queryCondition = {};
        var groupName = request.query.groupName;
        if (groupName) {
            queryCondition.groupName = groupName;
        }
        this.model['group'].queryPage(start, pageSize, queryCondition, function (err, totalCount, res) {
            if (err) {
                return next(err);
            }
            if (totalCount == 0) {
                return next(new Error("没有查询到用户组信息."));
            } else {
                response.json(self.createPageData("00",totalCount, res));
            }
        });
    },

    create: function (request, response, next) {

    },

    remove: function (request, response, next) {
        var id = parseInt(request.params.groupId);
        this.model['group'].del(id, function (err, data) {
            if (err) {
                return next(err);
            } else if (data.affectedRows !== 1) {
                return next(new Error("删除手环记录失败."));
            }
            response.json({code: "00", msg: "删除手环记录成功."});
        });
    }
});


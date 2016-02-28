var basicController = require("../../core/utils/controller/basicController");

module.exports = new basicController(__filename).init({
    list : function(req, res, next){
        var self = this;
        var roleId = req.user.roleId;
        self.model['menu'].listByRoleId(roleId, function(err, menus){
            if(err){
                return next(err);
            }
            if(!menus){
                return next(new Error("用户未关联菜单"));
            }
            var retMenus = sortMenus(1, menus);
            res.json({
                code : "00",
                data : retMenus
            });
        });
    }
});

function sortMenus(rootId, menus){
    var rootMenus = new Object();
    for(var i = 0; i < menus.length; i ++){
        rootMenus[menus[i].menuId] = menus[i];
    }
    var retMenus = new Array();
    for(var i = 0; i < menus.length; i ++){
        var parentId = menus[i].parentId;
        if(parentId == rootId){
            retMenus.push(menus[i]);
            continue;
        }
        if(parentId == 0){
            continue;
        }
        var childs = rootMenus[parentId].childs;
        if(!childs){
            childs = rootMenus[parentId].childs = new Array();
        }
        childs.push(menus[i]);
    }
    return retMenus;
}
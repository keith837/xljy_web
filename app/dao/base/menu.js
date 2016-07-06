var mysqlUtil = require("../../../core/utils/pool/mysql/mysqlPool");

var Menu = module.exports;

Menu.listAll = function(callback){
    mysqlUtil.query("select * from XL_MENU where state=1", [], callback);
}

Menu.listByRoleId = function(roleId, callback){
    mysqlUtil.query("select A.* from XL_MENU A,XL_ROLE_MENU_REL B WHERE A.menuId=B.menuId and A.state=1 and B.state=1 and B.roleId=? order by A.menuId", [roleId], callback);
}

Menu.listRoles = function(groupId,callback){
    var sql = "select * from XL_ROLE where state=1";
    if(groupId == 50){
        sql+=" and roleId = 40 ";
    }else if(groupId == 40){
        sql+=" and roleId = 30 ";
    }else{
        return callback(new Error("用户所属用户组[" + groupId + "]无此查询权限."));
    }
    mysqlUtil.query(sql, [], callback);
}
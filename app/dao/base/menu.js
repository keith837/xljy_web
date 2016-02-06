var mysqlUtil = require("../../../core/utils/pool/mysql/mysqlPool");

var Menu = module.exports;

Menu.listAll = function(callback){
    mysqlUtil.query("select * from XL_MENU", [], callback);
}

Menu.listByRoleId = function(roleId, callback){
    mysqlUtil.query("select A.* from XL_MENU A,XL_ROLE_MENU_REL B WHERE A.menuId=B.menuId and B.roleId=?", [roleId], callback);
}
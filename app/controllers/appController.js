/**
 * Created by wenhao on 2016/2/10.
 */
var basicController = require("../../core/utils/controller/basicController");

module.exports= new basicController(__filename).init({
    info : function(req, res, next){
        var self = this;
        var version = self.cacheManager.getCacheValue("APP_ABOUT", "VERSION");
        var introduce = self.cacheManager.getCacheValue("APP_ABOUT", "INTRODUCE");
        var contractName = self.cacheManager.getCacheValue("APP_ABOUT", "CONTRACTNAME");
        var moblie = self.cacheManager.getCacheValue("APP_ABOUT", "MOBILE");
        var copyright = self.cacheManager.getCacheValue("APP_ABOUT", "COPYRIGHT");
        res.json({
            code : "00",
            data : {
                version : version,
                introduce : introduce,
                contractName : contractName,
                moblie : moblie,
                copyright : copyright
            }
        });
    }
});
/**
 * Created by pz on 16/1/27.
 */
var mysqlPool = require("../pool/mysql/mysqlPool");
var redisPool = require("../pool/redis/redisPool");
var webConfig = require("../../config/webConfig");
var domain = require('domain');
var logger;
var basicController = function(filename){
    this.cacheManager = null;
    this.db = mysqlPool;
    this.logger = logger = require("../logger/logger")(filename);
    this.fileUtils = require('../common/fileUtils');
    this.redis = redisPool;
    this.webConfig = webConfig;
    this.model = {};
}
basicController.prototype.Error = function (msg, code) {
    var tempNewError = new Error(msg);
    tempNewError.isCustom = true;
    code && (tempNewError.code = code);
    return tempNewError;

}
basicController.prototype.init = function(dy){
    var self = this;
    for(var x in dy){
        if (typeof dy[x] == "function") {
            this[x] = dy[x];
            (this[x] = function () {
                //var temp = dy[x];
                var d = domain.create();

                var arug1 = arguments;
                d.on('error', function (err) {
                    logger.error(err);
                    logger.error("异步调用捕获了异常");
                    arug1[2](err);
                });
                d.run(function () {
                    /*var response = arug1[1];
                    response.oldjson = response.json;
                    response.json = function (injson) {
                        injson = JSON.stringify(injson);
                        injson = injson.replace(new RegExp(":null", "gm"), ":\"\"");
                        response.oldjson(JSON.parse(injson));
                    }
                    arug1[1] = response;*/
                    arug1.callee.cfn.apply(self, arug1);
                })

                //    console.log('211111');
                //} catch (err) {
                //    console.log(2222222222);
                //    logger.error("老子捕获了异常");
                //    console.log(arguments);
                //    arguments[2](err);
                //}
            }).cfn = dy[x];
        }
    }
    return this;
}
basicController.prototype.fillTpl =function (data,err,msg){
    var response={state:1,msg:"0",data:{}};
    if(err){
        response.state = 0;response.msg = err.toString();
    }
    if(msg) {
        response.msg = msg;
    }
    response.data = data;
    return response;
}
basicController.prototype.createPageData = function (code,allsize, res) {
    return {code: code,iTotalRecords: allsize, iTotalDisplayRecords: allsize, data: res}
}
module.exports = basicController;

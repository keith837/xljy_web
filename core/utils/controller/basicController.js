/**
 * Created by pz on 16/1/27.
 */
var mysqlPool = require("../pool/mysql/mysqlPool");
var redisPool = require("../pool/redis/redisPool");

var basicController = function(filename){
    this.db = mysqlPool;
    this.uploadPath=__dirname+"/../../../app/cache/upload/";
    this.uploadJsonPath = __dirname + "/../../../app/cache/upload/";
    this.logger = require("../logger/logger")(filename);
    this.fileUtils = require('../common/fileUtils');
    this.redis = redisPool;
    this.model = {};
}
basicController.prototype.init = function(dy){
    var self = this;
    for(var x in dy){
        if (typeof dy[x] == "function") {
            (this[x] = function () {
                //var temp = dy[x];
                try {
                    arguments.callee.cfn.apply(self, arguments);
                } catch (err) {
                    console.log(err);
                    arguments[2](err);
                }
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
module.exports = basicController;

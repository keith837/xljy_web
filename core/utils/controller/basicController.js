/**
 * Created by pz on 16/1/27.
 */
var mysqlPool = require("../pool/mysql/mysqlPool");
var redisPool = require("../pool/redis/redisPool");

var basicController = function(filename){
    this.mappping = {};
    this.db = mysqlPool;
    this.uploadPath=__dirname+"/../../../app/cache/upload/";
    this.logger = require("../logger/logger")(filename);
    this.fileUtils = require('../common/fileUtils');
    this.redis = redisPool;
}
basicController.prototype.init = function(dy){
    for(var x in dy){
        this[x] = dy[x];
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

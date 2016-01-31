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

module.exports = basicController;

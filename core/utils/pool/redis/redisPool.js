/**
 * Created by pz on 16/1/25.
 */
var redisConfig = require("../../../config/redisConfig");
var redis = require("redis"), client;

var logger = require('../../logger/logger')(__filename);
//console.log(redisConfig);
client = redis.createClient(redisConfig.PORT,redisConfig.SERVER, {});

// 密码
client.auth(redisConfig.PASSWORD);

// 选择数据库，比如第3个数据库，默认是第0个
client.select(redisConfig.DB, function() {
    logger.info('连接Redis 数据库 %s 成功 ,配置',redisConfig.DB,JSON.stringify(redisConfig))
});

client.on("error", function (err) {
    logger.info("redis client Error " + err);
});
module.exports =client;

// 设置键值
//client.set("Testing", "string val", redis.print);
//
//// 取值
//client.get("Testing", function(err, replies) {
//});
//// 其它APIx
//client.hset("hash key", "hashtest 1", "some value", redis.print);
//client.hset(["hash key", "hashtest 2", "some other value"], redis.print);
//client.hkeys("hash key", function (err, replies) {
//    console.log(replies.length + " replies:");
//    replies.forEach(function (reply, i) {
//        console.log("    " + i + ": " + reply);
//    });
//    client.quit();
//});


// 枚举趣出数据库中的所有键
//client.keys('*', function (err, keys) {
//    console.log(keys);
//});

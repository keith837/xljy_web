var startTime = new Date().getTime();
var express = require('express');
var app = express();
var bodyParser = require('body-parser')
//var routerConfig = require("./core/config/routerConfig");
var webConfig = require("./core/config/webConfig");
var log4js = require('log4js');
var loggerCall = require('./core/utils/logger/logger');
var logger = loggerCall(__filename);

var controllerEnter = require("./core/utils/controller/controllerEnter");

var mysqlPool = require("./core/utils/pool/mysql/mysqlPool");
var redisPool = require("./core/utils/pool/redis/redisPool");

logger.info("载入入口依赖库完成..");

app.engine(".html",require('ejs').__express);
app.set("view engine",'html');
app.set("views",webConfig.VIEWSPATH);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));


webConfig.PRINT_ACCESS_LOG && app.use(log4js.connectLogger(loggerCall('normal'), {
    level: log4js.levels.INFO,
    format: ':method :url'
}));
//挂载静态目录

for (var x in webConfig.STATICPATH) {
    app.use(webConfig.STATICPATH[x].webpath, express.static(webConfig.STATICPATH[x].filepath, webConfig.STATICPATH[x].option));
}
logger.info("配置中静态目录信息载入完毕..");

//for (var x in routerConfig) {
//    var tempRouter = require(routerConfig[x].jsurl);
//    app.use(routerConfig[x].routerpath, tempRouter);
//}
controllerEnter.bootControllers(app);
logger.info("载入/controllers 下控制器 完成..");



var server = app.listen(3001, function () {
    var host = server.address().address;
    var port = server.address().port;

    logger.info('Web 服务器启动监听  端口%s 启动时间:%s ms', port, Math.ceil(new Date().getTime() - startTime));
});


mysqlPool.query("show tables", {}, function (err, res) {
    if(err){
        logger.warn("MYSQL 连接异常");
    }else{
        logger.info("MYSQL 连接成功");
    }
})
/*
 测试.
 */
//redisPool.set("Testing", "string val123123123");


//批量插入
//var sql1 = "insert into user (username,password) values ?";
//var values = [[
//    ["3", 31],
//    ["2", 32],
//    ["1", 33]
//]];
//mysqlPool.query(sql1, values, function (err, res) {
//    console.log(arguments);
//})
//
//
////字段自动填充
//mysqlPool.query("update user set ?",{username:"a"},function(err,res){
//    console.log(arguments);
//})
//
////update 批量方式
//var sql2 = 'UPDATE user ' +
//    'SET username = CASE id ' +
//    'WHEN 31 THEN 3 ' +
//    'WHEN 32 THEN 2 ' +
//    'WHEN 33 THEN 1 ' +
//    'END ' +
//    'WHERE id IN (31,32,33)';
//mysqlPool.query(sql2, [], function (err, res) {
//    console.log(arguments);
//})
//console.log(mysqlPool);
//setInterval(function(){
//    mysqlPool.query("SELECT * FROM ?? WHERE ? = ?",["user","1","1"],function(err,res){
//        console.log(arguments);
//    })
//},1)
//var callback = function(err,connection){
//    connection.beginTransaction(function(err) {
//        if (err) { throw err; }
//        connection.query('INSERT INTO user SET username=?', "111", function(err, result) {
//            if (err) {
//                return connection.rollback(function() {
//                    throw err;
//                });
//            }
//
//            //var log = 'Post ' + result.insertId + ' added';
//
//            connection.query('INSERT INTO user SET username=?', "abc", function(err, result) {
//                if (err) {
//                    return connection.rollback(function() {
//                        throw err;
//                    });
//                }
//                connection.commit(function(err) {
//                    connection.rollback(function() {
//                        //throw err;
//                    });
//                    if (err) {
//                        return connection.rollback(function() {
//                            throw err;
//                        });
//                    }
//                    console.log('success!');
//                });
//            });
//        });
//    });
//}
//mysqlPool.transaction(callback);
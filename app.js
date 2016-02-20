var startTime = new Date().getTime();
var express = require('express');
var app = express();
var async = require("async");
var ejs = require('ejs');
var tplFilter = require("./app/filter/tplFilter");
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');

var loginFilter = require("./core/filter/loginFilter");
var webConfig = require("./core/config/webConfig");
var log4js = require('log4js');
var loggerCall = require('./core/utils/logger/logger');
var logger = loggerCall(__filename);
var cacheManager = require('./core/utils/cache/cacheManager');

process.on('uncaughtException', function (err) {
    //app.send("t error,process end");
    logger.error("未捕获的异常");
    logger.error('Caught exception: ', err);
});
var controllerEnter = require("./core/utils/controller/controllerEnter");
var mysqlPool = require("./core/utils/pool/mysql/mysqlPool");

logger.info("载入入口依赖库完成..");

//设置模板引擎
app.engine(".ejs", ejs.__express);
app.set("view engine", 'ejs');
app.set("views", webConfig.VIEWSPATH);
//注册过滤器
new tplFilter(ejs.filters);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());

webConfig.PRINT_ACCESS_LOG && app.use(log4js.connectLogger(loggerCall('normal'), {
    level: log4js.levels.INFO,
    format: ':method :url'
}));
//挂载静态目录

for (var x in webConfig.STATICPATH) {
    app.use(webConfig.STATICPATH[x].webpath, express.static(webConfig.STATICPATH[x].filepath, webConfig.STATICPATH[x].option));
}
logger.info("配置中静态目录信息载入完毕..");

//登录校验
app.use(loginFilter);

//控制器挂载

var server;
async.waterfall([
        function (cb) {
            mysqlPool.checkconnected(cb);
        },
        function (cb) {
            app.cacheManager = require("./core/utils/cache/cacheManager").init(cb);
        },
        function (cb) {
            controllerEnter.bootControllers(app);
            logger.info("载入/controllers 下控制器 完成..");
            //错误处理中间件
            app.use(function (err, req, res, next) {
                err.isCustom ? "" : logger.error("======错误句柄next接受错误=======", err);
                // 业务逻辑
                if (res.headersSent) {
                    return next(err);
                }
                res.json({
                    code: "99",
                    msg : err.message,
                    error: err
                });
            });
            server = app.listen(3001, cb);
        },
        function (next) {
            var host = server.address().address;
            var port = server.address().port;
            logger.info('Web 服务器启动监听  端口%s 启动时间:%s ms', port, Math.ceil(new Date().getTime() - startTime));
            next();
        }
    ],
    function (e, res) {
        if (e) {
            logger.error(e);
        }
        logger.info('启动流程结束');
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
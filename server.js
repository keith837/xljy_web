var startTime = new Date().getTime();
var express = require('express');
var app = express();
var async = require("async");
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var busboy = require('connect-busboy');

var cacheManager = require('./core/utils/cache/cacheManager');

//log4js
var log4js = require('log4js');
var log4jsConfig = require("./core/config/log4jsConfig");
log4js.configure({
    appenders: [
        {type: 'console'}, {
            type: 'file',
            filename: 'app/logs/task.log',
            maxLogSize: log4jsConfig.MAXLOGSIZE,
            backups: log4jsConfig.BACKUPS
        }
    ],
    replaceConsole: log4jsConfig.SHOWCONSOLELOG
});
var logger = log4js.getLogger(__filename);
logger.setLevel(log4jsConfig.LOGLEVEL);
//log4js


process.on('uncaughtException', function (err) {
    logger.error("未捕获的异常");
    logger.error('Caught exception: ', err);
});

//加载controller设置
var routerConfig = require("./core/config/serverConfig");
//加载controller设置


var mysqlPool = require("./core/utils/pool/mysql/mysqlPool");
logger.info("载入入口依赖库完成..");

//设置模板引擎

//注册过滤器
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());
app.use(busboy());

app.use(log4js.connectLogger(logger, {level: 'auto', format: ':method :url'}));

//挂载静态目录

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
            var routeMap = routerConfig.mapping;
            for (var x in routeMap) {
                bootController(app, x, routeMap[x]);
            }
            logger.info("载入/controllers 下控制器 完成..");
            //错误处理中间件
            app.use(function (err, req, res, next) {
                err.isCustom ? "" : logger.error("======错误句柄next接受错误=======", err);
                // 业务逻辑
                if (res.headersSent) {
                    return next(err);
                }
                res.json({
                    code: err.code || "99",
                    msg: err.message,
                    error: err
                });
            });
            server = app.listen(3002, cb);
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
    });


//解析controllers目录下所有.js文件
function bootController(app, name, map) {
    var name = name;
    var actions = require('./app/controllers/' + name + "Controller");
    actions.cacheManager = app.cacheManager;
    var mapping = map;
    for (var x in mapping) {
        var fn = actions[x];
        if (typeof(fn) === "function") {
            if ((a = mapping[x])) {
                fn = fn.bind(actions);
                switch (a.method) {
                    case 'get':
                        app.get(a.url, fn);
                        logger.info("方法:get 路径:" + a.url);
                        break;
                    case 'post':
                        app.post(a.url, fn);
                        logger.info("方法:post 路径:" + a.url);
                        break;
                    case 'put':
                        app.put(a.url, fn);
                        logger.info("方法:put 路径:" + a.url);
                        break;
                    case 'delete':
                        app.delete(a.url, fn);
                        logger.info("方法:delete 路径:" + a.url);
                        break;
                }
            } else {
                console.log("WARNING: no mapping for " + x + " defined");
            }
        } else if (x == "usedModel") {
            //载入自定义模型
            for (var i in map[x]) {
                actions.model[modelNameParse(map[x][i])] = require("./app/dao/" + map[x][i]);
            }
        }
    }
}

function modelNameParse(url) {
    if (url.indexOf("/") == -1) {
        return url;
    } else {
        var tempSplit = url.split("/");
        return tempSplit[tempSplit.length - 1];
    }
}
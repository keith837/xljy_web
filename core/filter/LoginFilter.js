var redisPool = require("../utils/pool/redis/redisPool");
var logger = require("../utils/logger/logger")(__filename);
var cacheManager = require("../utils/cache/cacheManager");

function checkLogin(req, res, next){
    var reqPath = req.path;
    var filterUrls = cacheManager.getCache("FILTER_URLS");
    for(var i = 0; i < filterUrls.length; i ++){
        if(reqPath.indexOf(filterUrls[i].codeValue) == 0){
            logger.debug("当前请求URL【" + reqPath + "】无需登录");
            return next();
        }
    }
    var token = getToken(req);
    logger.debug("从请求中获取token：" + token);
    if(!token){
        return next(new Error("用户未登录！"));
    }
    redisPool.get(token, function(err, data){
        if(err){
            logger.error("根据token【" + token + "】从redis服务器上获取登录信息失败" + err);
            return next(err);
        }
        if(data){
            logger.debug("根据token【" + token + "】从redis服务器获取登录用户信息:" + data);
            req.user = JSON.parse(data);
            return next();
        }
        return next(new Error("用户登录信息已失效，请重新登录！"));
    });
}

//从请求中获取token信息
function getToken(req){
    //token在请求url中传递
    var token = req.query.token;
    if(token){
        return token;
    }
    //token在请求报文体中传递
    token = req.body.token;
    if(token){
        return token;
    }
    //token在cookies中传递
    var cookies = req.cookies;
    token = cookies.token;
    if(token){
        return token;
    }
    //token在报文头上传递
    token = req.header("Set-Token");
    return token;
}

module.exports = checkLogin;
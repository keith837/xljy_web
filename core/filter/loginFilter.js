var redisPool = require("../utils/pool/redis/redisPool");
var logger = require("../utils/logger/logger")(__filename);
var cacheManager = require("../utils/cache/cacheManager");
var webConfig = require("../config/webConfig");

function checkLogin(req, res, next){
    var reqPath = req.path;
    var filterUrls = cacheManager.getCache("FILTER_URLS");
    //console.info(reqPath);
    //console.info(reqPath.indexOf(".html"));
    //if (reqPath == "/static/login.html" || reqPath.indexOf(".html") == -1) {
    //    return next();
    //}
    for(var i = 0; i < filterUrls.length; i ++){
        var d=reqPath.length-filterUrls[i].codeValue.length;
        if(reqPath == "/" || reqPath.indexOf(filterUrls[i].codeValue) == 0 || (d>=0&&reqPath.lastIndexOf(filterUrls[i].codeValue)==d)){
            logger.debug("当前请求URL【" + reqPath + "】无需登录");
            return next();
        }
    }
    var token = getToken(req);

    logger.debug("从请求中获取token：" + token);
    if(!token){
        var msg = "用户未登录！";
        if (reqPath.indexOf(webConfig.contextPath+"/") == 0) {
            return res.redirect(webConfig.contextPath+'/login.html?msg=' + msg);
        } else {
            return next(new Error(msg));
        }
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
        var msg = "用户未登陆或登录信息已失效，请重新登录！";
        if (reqPath.indexOf(webConfig.contextPath+"/") == 0) {
            return res.redirect(webConfig.contextPath+'/login.html?msg=' + msg);
        } else {
            var tempNewError = new Error(msg);
            tempNewError.code = "01";
            return next(tempNewError);
        }
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
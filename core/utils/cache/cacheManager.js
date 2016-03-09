var loggerCall = require('../logger/logger');
var logger = loggerCall(__filename);
var mysqlPool = require("../pool/mysql/mysqlPool");

var cacheManager = module.exports;

var cacheObj = new Object();

cacheManager.init = function (callback) {
    logger.info("开始从XL_STATIC_DATA表中加载静态配置数据");
    mysqlPool.query("select * from XL_STATIC_DATA order by codeType,sortId", null, function (err, data) {
        if (err) {
            logger.error("从XL_STATIC_DATA表中加载静态配置数据失败:", err);
        }
        if (!data && data.length <= 0) {
            logger.info("从XL_STATIC_DATA表中加载静态配置数据为空");
        }
        var count = 0;
        for (var i = 0; i < data.length; i++) {
            var codeType = data[i].codeType;
            var cacheElement = cacheObj[codeType];
            if (!cacheElement) {
                cacheElement = new Array();
                cacheObj[codeType] = cacheElement;
                count++;
            }
            cacheElement.push(data[i]);
        }
        logger.info("从XL_STATIC_DATA表中加载静态配置数据成功，缓存元素数量：" + count);
        callback();
    });
    return this;
}

function getCache(codeType, codeKey) {
    if (!codeKey && codeKey !== 0) {
        return cacheObj[codeType];
    }
    var cacheElement = cacheObj[codeType];
    if (!cacheElement) {
        return null;
    }
    console.log(JSON.stringify(cacheElement));
    for (var i = 0; i < cacheElement.length; i++) {
        if (cacheElement[i].codeKey == codeKey) {
            return cacheElement[i];
        }
    }
    return null;
}

function getCacheValue(codeType, codeKey) {
    var cacheData = getCache(codeType, codeKey);
    if (!cacheData) {
        return null;
    }
    return cacheData.codeValue;
}

cacheManager.getCache = getCache;

cacheManager.getCacheValue = getCacheValue;
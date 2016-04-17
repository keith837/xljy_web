var pushCore = function () {
    this.config = require("../../config/webConfig").PUSH_CONFIG;
}

var logger = require("../logger/logger")(__filename);

pushCore.INSTALLATIONS = "/1.1/installations";  //注册设备
pushCore.PUSH = "/1.1/push";


//注册设备
pushCore.prototype.regDevice = function (type, token, channels, cb) {

    var data = {
        deviceType: type,
        channels: channels
    }
    if (type == "ios") {
        data.deviceToken = token;
    } else if (type == "android") {
        data.installationId = token;
    }
    this.basicCall(data, pushCore.INSTALLATIONS, function (jsondata) {
        logger.info(jsondata);
        try {
            var jsondata = JSON.parse(jsondata);
            cb(null, jsondata.objectId);
        } catch (e) {
            cb(e);
        }
    })
};
//pushCore.prototype.subTopic = function(objectid,channel,cb){
//    var channel = {
//        "channels": channel
//    }
//    this.basicCall(channel,pushCore.INSTALLATIONS+"/"+objectid,cb)
//};
pushCore.prototype.pushToAll = function (indata, cb) {
    var data = {
        data: indata
    }
    this.basicCall(data, pushCore.PUSH, function (jsondata) {
        logger.info(jsondata);
        try {
            var jsondata = JSON.parse(jsondata);
            cb(null, jsondata.objectId);
        } catch (e) {
            cb(e);
        }
    })
}
pushCore.prototype.pushToChannels = function (indata, channel, cb) {
    var data = {
        data: indata,
        channels: channel
    }
    this.basicCall(data, pushCore.PUSH, function (jsondata) {
        logger.info(jsondata);
        try {
            var jsondata = JSON.parse(jsondata);
            cb(null, jsondata.objectId);
        } catch (e) {
            cb(e);
        }
    })
}
pushCore.prototype.genUser = function (type, token) {
    if (type == "android") {
        return {
            "installationId": token
        };
    } else if (type == "ios") {
        return {
            "deviceToken": token
        };
    }
}
pushCore.prototype.pushToUser = function (indata, user, cb) {
    var data = {
        data: indata,
        where: user
    }
    this.basicCall(data, pushCore.PUSH, function (jsondata) {
        logger.info(jsondata);
        try {
            var jsondata = JSON.parse(jsondata);
            cb(null, jsondata.objectId);
        } catch (e) {
            cb(e);
        }
    })
}
pushCore.prototype.pushToUsers = function (indata, users, cb) {


    var whereArray = [];
    for (var x in users) {
        for (var i in users[x]) {
            whereArray.push(i + "=" + "'" + users[x][i] + "'");
        }
    }
    var data = {
        data: indata,
        cql: "select * from _Installation where " + whereArray.join(" or ")
    };
    this.basicCall(data, pushCore.PUSH, function (jsondata) {
        logger.info(jsondata);
        try {
            var jsondata = JSON.parse(jsondata);
            cb(null, jsondata.objectId);
        } catch (e) {
            cb(e);
        }
    })

}
pushCore.prototype.basicCall = function (data, path, callback) {
    var https = require('https');
    var contents = JSON.stringify(data);
    logger.info(data);
    logger.info(path);
    var options = {
        host: "leancloud.cn",
        path: path,
        method: 'POST',
        headers: {
            "X-LC-Id": this.config.PUSH_ID,
            "X-LC-Key": this.config.PUSH_KEY,
            "Content-Type": 'application/json',
            //'Content-Length': contents.length
        }
    };

    var req = https.request(options, function (res) {
        res.setEncoding('utf8');
        res.on('data', callback);
    });

    req.write(contents);
    req.end();  //不能漏掉，结束请求，否则服务器将不会收到信息。
}
module.exports = new pushCore();
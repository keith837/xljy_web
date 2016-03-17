/**
 * Module dependencies.
 */
var util = require("utility");
var webConfig = require("../../config/webConfig");
var TopClient = require('./topClient').TopClient;

var client = new TopClient({
    'appkey': webConfig.IM_APPKEY,
    'appsecret': webConfig.IM_APPSECRET,
    'REST_URL': 'https://eco.taobao.com/router/rest'
});

//var imCore  = module.exports;
var imCore = {}
imCore.getPasswordHash = function (password) {
    return util.md5(password + "~!@#$%^&*()_+");
}
imCore.regUser = function (username, password, nick, cb) {

    client.execute('taobao.openim.users.add',
        {
            userinfos: JSON.stringify({
                userid: username,
                password: password,
                nick: nick
            })
        },
        cb)
}

imCore.changeUser = function (username, nick, cb) {

    client.execute('taobao.openim.users.update',
        {
            userinfos: JSON.stringify([{
                userid: username,
                nick: nick
            }])
        },
        cb)
}

module.exports = imCore;


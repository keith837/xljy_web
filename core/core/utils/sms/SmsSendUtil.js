var https = require('https');
var querystring = require('querystring');

module.exports.sendSms = function(billId, securityCode, callback){
    var postData = {
        mobile:billId,
        message:'随机码：' + securityCode + '。【响亮教育】'
    };
    var content = querystring.stringify(postData);
    var options = {
        host:'sms-api.luosimao.com',
        path:'/v1/send.json',
        method:'POST',
        auth:'api:key-e0f0daae8758e7db68ae162e5941cb58',
        agent:false,
        rejectUnauthorized : false,
        headers:{
            'Content-Type' : 'application/x-www-form-urlencoded',
            'Content-Length' :content.length
        }
    };
    var req = https.request(options,function(res){
        res.setEncoding('utf8');
        res.on('data', function (chunk) {
            callback.apply(null, [JSON.parse(chunk)]);
        });
    });

    req.write(content);
    req.end();
}

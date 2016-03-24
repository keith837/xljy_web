var https = require('https');
var querystring = require('querystring');

module.exports.sendSms = function(billId, securityCode, callback){
    var postData = {
        mobile:billId,
        message:'验证码：' + securityCode + '。【响亮教育】'
    };
    var content = querystring.stringify(postData);
    var options = {
        host:'sms-api.luosimao.com',
        path:'/v1/send.json',
        method:'POST',
        auth:'api:key-0503f5817effbcdd46ccb3dbd4ac0719',
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

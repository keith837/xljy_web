TopClient = require('./topClient').TopClient;

var client = new TopClient({
    'appkey':'23342138',
    'appsecret':'e85b7551ad52604565b4bf57f146c168',
    'REST_URL':'http://gw.api.taobao.com/router/rest'});

module.exports.sendSms = function(billId, securityCode, callback){
    client.execute('alibaba.aliqin.fc.sms.num.send',
        {
            sms_type:'normal',
            sms_free_sign_name:'活动验证',
            sms_param: {
                code:securityCode,
                product:'大鱼测试'
            },
            rec_num:billId,
            sms_template_code:'SMS_7455255'
        },
        function (error, response) {
            if(!error){
                console.log(response);
            } else {
                console.log(error);
                var tempData = JSON.parse(error.data);
                callback({
                    error : tempData.error_response.code,
                    msg : tempData.error_response.sub_msg
                });
            }
        }
    );
}
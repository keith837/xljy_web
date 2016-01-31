/**
 * Created by pz on 16/1/27.
 */

var basicController = require("../../core/utils/controller/basicController");
module.exports = new basicController(__filename).init({
    mapping: {
        "showlist": {
            "url": "/cm/list",
            "method": "get",
            "description": "显示文章列表",
            "auth": true
        }
    },
    showlist: function (request, response) {
        console.log("Hello world！！");
        //response.render('index/a', { title: '玄魂的测试代码' });

        this.db.query("SELECT * FROM content ORDER BY id DESC",[],function(err,res){
            console.log(res);
            response.render('index/a', { title: '玄魂的测试代码',contents:res});
        });

        //this.db.queryOne("SELECT * FROM ?? WHERE ? = ?", ["user", "1", "1"], function (err, res) {
        //    console.log(request.query);
        //    response.json(res);
        //})
        //var body = '<html>'+
        //    '<head>'+
        //    '<meta http-equiv="Content-Type" content="text/html; '+
        //    'charset=UTF-8" />'+
        //    '</head>'+
        //    '<body>'+
        //    '</body>'+
        //    '</html>';
        //response.send(body);
    }
});

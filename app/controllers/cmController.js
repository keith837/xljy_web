/**
 * Created by pz on 16/1/27.
 */

var basicController = require("../../core/utils/controller/basicController");
module.exports = new basicController(__filename).init({
    showlist: function (request, response) {
        var self = this;
        console.log(request.query);
        //response.render('index/a', { title: '玄魂的测试代码' });

        this.db.query("SELECT * FROM content ORDER BY id DESC",[],function(err,res){
            console.log(res);
            response.render('index/a', self.fillTpl({ title: '玄魂的测试代码',contents:res,fu:function(in1){
                return in1+"1aaa1";
            }}));
        });

    }
});

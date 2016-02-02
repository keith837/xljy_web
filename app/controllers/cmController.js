/**
 * Created by pz on 16/1/27.
 */

var basicController = require("../../core/utils/controller/basicController");
module.exports = new basicController(__filename).init({
    showlist: function (request, response, next) {


        ;
        var self = this;
        this.model["student"].listByUserId("1", function (err, res) {
            if (err) {
                next(err);
                return
            }
            response.render('index/a', self.fillTpl({ title: '玄魂的测试代码',contents:res,fu:function(in1){
                return in1+"1aaa1";
            }}));
        })

    }
});

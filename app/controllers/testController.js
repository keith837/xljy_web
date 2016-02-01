/**
 * Created by pz on 16/1/31.
 */
var formidable = require("formidable");
var basicController = require("../../core/utils/controller/basicController");
module.exports = new basicController(__filename).init({
    fun1:function(request,response){
        console.log('===============');
        console.log(request.body);
        response.json({a1:request.body,a2:2});
        response.end();
        //response.render('test/fun1', {});
    }
    ,
    fun2:function(request,response){
        console.log(request.body);
        response.render('test/fun1', {});
    },

})

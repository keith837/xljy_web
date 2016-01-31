/**
 * Created by pz on 16/1/27.
 */
var fs = require("fs");
var logger = require("../logger/logger")(__filename);
var mappingString = "";

function add_to_mapping_string(method, url, description, auth) {
    mappingString += "<div style='width: 400px; height: 20px; padding: 5px; background-color: " +
        "#ccc; color: #000; font-family: Arial, Verdana, sans-serif'><b>"
        + method + " " + url + "</b></div><div style='width: 400px; padding: 5px; background-color: " +
        "#eee; color: #000; font-family: Arial, Verdana, sans-serif'>"
        + description + "<br /><b>Auth:</b> " + auth + "</div><br />";
}
//解析controllers目录下所有.js文件
function bootController(app, file) {
    var name = file.replace('.js', '');
    var actions = require('../../../app/controllers/' + name);
    var mapping = actions["mapping"];
    Object.keys(actions).map(function(action){
        var fn = actions[action];
        if(typeof(fn) === "function") {
            if(a = mapping[action]) {
                fn = fn.bind(actions);
                add_to_mapping_string(a.method, a.url, a.description, a.auth);
                switch(a.method) {
                    case 'get':
                        app.get(a.url, fn);
                        logger.info("方法:get 路径:" + a.url);
                        break;
                    case 'post':
                        app.post(a.url, fn);
                        logger.info("方法:post 路径:" + a.url);
                        break;
                    case 'put':
                        app.put(a.url, fn);
                        logger.info("方法:put 路径:" + a.url);
                        break;
                    case 'delete':
                        app.del(a.url, fn);
                        logger.info("方法:delete 路径:" + a.url);
                        break;
                }
            } else {
                console.log("WARNING: no mapping for " + action + " defined");
            }
        }
    });
}

module.exports = {
    bootControllers : function(app) {
        fs.readdir(__dirname + '/../../../app/controllers', function(err, files){
            if (err) throw err;
            files.forEach(function(file){
                logger.info("Controller : %s 绑定完成  " , file);
                if(file != '.svn')
                    bootController(app, file);
                else
                    console.log("Not booting .svn controllerEnter! " );
            });
            //可查看所有接口的url：/show_available_interfaces
            app.get("/showinterfaces", function(req, res){
                res.send(mappingString);
            });
            //404页面
            app.get('*', function(req, res) {
                console.log('404 handler..') ;
                console.log(req.url);
                res.send('Page Not Found!(404)');
            });
        });
    }
};
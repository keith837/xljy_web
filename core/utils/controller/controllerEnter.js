/**
 * Created by pz on 16/1/27.
 */
var fs = require("fs");
var logger = require("../logger/logger")(__filename);
var routerConfig = require("../../config/routerConfig");
var mappingString = "";

function add_to_mapping_string(method, url, description, auth) {
    mappingString += "<div style='width: 400px; height: 20px; padding: 5px; background-color: " +
        "#ccc; color: #000; font-family: Arial, Verdana, sans-serif'><b>"
        + method + " " + url + "</b></div><div style='width: 400px; padding: 5px; background-color: " +
        "#eee; color: #000; font-family: Arial, Verdana, sans-serif'>"
        + description + "<br /><b>Auth:</b> " + auth + "</div><br />";
}
function add_to_mapping_header(name){
    mappingString +="<div style='border:1px solid #ccc;padding:10px;margin: 10px;'>";
    mappingString +="<h1>"+name+"Controller</h1>"
}
function add_to_mapping_footer(){
    mappingString +="</div>";
}
//解析controllers目录下所有.js文件
function bootController(app,name,map) {
    var name = name;
    var actions = require('../../../app/controllers/' + name+"Controller");
    actions.cacheManager = app.cacheManager;
    var mapping = map;
    add_to_mapping_header(name);
    for(var x in mapping){
        var fn =actions[x];
        if(typeof(fn) === "function") {
            if((a = mapping[x])) {
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
                        app.delete(a.url, fn);
                        logger.info("方法:delete 路径:" + a.url);
                        break;
                }
            } else {
                console.log("WARNING: no mapping for " + x + " defined");
            }
        } else if (x == "usedModel") {
            //载入自定义模型
            for (var i in map[x]) {
                actions.model[modelNameParse(map[x][i])] = require("../../../app/dao/" + map[x][i]);
            }
        }
    }
    add_to_mapping_footer();
}
function modelNameParse(url) {
    if (url.indexOf("/") == -1) {
        return url;
    } else {
        var tempSplit = url.split("/");
        return tempSplit[tempSplit.length - 1];
    }
}
module.exports = {
    bootControllers : function(app) {

        var routerConfig = require("../../config/routerConfig");
        var routemap = routerConfig.mapping;
        for(var x in routemap){
            bootController(app,x,routemap[x]);
        }
        app.get("/showinterfaces", function(req, res){
            res.send(mappingString);
        });
        //404页面
        app.get('*', function(req, res) {
            //console.log('404 handler..') ;
            //console.log(req.url);
            //res.send('Page Not Found!(404)');
            res.render("global/404", {});
        });

    }
};
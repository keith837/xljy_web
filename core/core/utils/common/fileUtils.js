/**
 * Created by pz on 16/1/28.
 */
var  fs =require("fs");
var util =require("utility");
var timeUtils = require("./timeUtils");
var fileUtils =  function(){

}
fileUtils.saveFormUploads = function(files,saves){
    var index = 0;
    for(var x in files){
        console.log(files[x]);
        fs.renameSync(files[x].path, saves[x]);
        index++;
    }
    return saves;
}
fileUtils.saveFormUploadsWithAutoName = function(files,savepath){
    var pushback = [];
    for(var x in files){
        var temphash = timeUtils.Format("yyyy_MM_dd_hh_mm_ss")+"_"+util.md5(files[x].path).substr(0,5);;
        if(fileUtils.genExtName(files[x].name)){
            fs.renameSync(files[x].path, savepath+"/"+temphash+"."+fileUtils.genExtName(files[x].name));
            pushback.push(temphash+"."+fileUtils.genExtName(files[x].name));
        }else{
            pushback.push("");
        }
    }
    return pushback;
}
fileUtils.genExtName = function(name){
    var name  = name;
    var namearr = name.split(".");
    if(namearr.length == 2){
        return namearr[1];
    }else{
        return false;
    }
}


module.exports = fileUtils;
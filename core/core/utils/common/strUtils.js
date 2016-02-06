/**
 * Created by pz on 16/1/27.
 */
var strUtils = function(){

}
strUtils.SQLGen = function(SQL,args){

    var SQLArr = SQL.split("%s");
    if(!args||SQLArr.length == 1)return SQL;
    if((SQLArr.length - 1>args.length ||SQLArr.length - 1< args.length) && SQLArr.length>1){
        throw new Error("SQL: " + SQLArr + " argments length ERROR ");
    }
    var SQLPush = [];
    for (var x in SQLArr) {
        SQLPush.push(SQLArr[x]);
        SQLPush.push(args[x]);
    }
    var genSQL = SQLPush.join("");
    console.log(genSQL);
    return genSQL
}
module.exports = strUtils ;
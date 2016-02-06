var mysql=require("mysql");var mysqlConfig=require("../../../config/mysqlConfig");var strUtils=require("../../common/strUtils");var logger=require("../../logger/logger")(__filename);var mysqlPool=function(){this.pool;this.init()};mysqlPool.prototype.init=function(){this.pool=mysql.createPool({debug:mysqlConfig.DEBUG,connectionLimit:mysqlConfig.POOLSIZE,host:mysqlConfig.HOST,port:mysqlConfig.PORT,user:mysqlConfig.USER,password:mysqlConfig.PASSWORD,charset:mysqlConfig.CHARSET,database:mysqlConfig.DATABASE});this.pool.on("connection",function(connection){console.log("连接池连接success")});this.pool.on("error",function(err){logger.error(err)})};mysqlPool.prototype.query=function(SQL,args,callback){this.pool.getConnection(function(err,connection){if(err&&err.code==="PROTOCOL_SEQUENCE_TIMEOUT"){throw new Error("too long to count table rows!")}if(!!err){callback(err,connection);return}var genSql=mysql.format(SQL,args);mysqlConfig.PRINTSQL&&logger.info(genSql);connection.query({sql:genSql,timeout:mysqlConfig.QUERYTIMEOUT},function(err,rows){connection.release();callback(err,rows)})})};mysqlPool.prototype.transaction=function(callback){this.pool.getConnection(function(err,connection){if(!!err){callback(err);return}connection.beginTransaction(function(err){callback(err,connection)})})};module.exports=new mysqlPool;
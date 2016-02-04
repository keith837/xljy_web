/**
 * Created by pz on 16/1/26.
 */
var mysql = require('mysql');
var mysqlConfig = require("../../../config/mysqlConfig");
var strUtils = require("../../common/strUtils");
var logger = require("../../logger/logger")(__filename);
var mysqlPool = function () {
    this.pool;
    this.init();
}
mysqlPool.prototype.init = function () {
    this.pool = mysql.createPool({
        debug:mysqlConfig.DEBUG,
        connectionLimit: mysqlConfig.POOLSIZE,
        host: mysqlConfig.HOST,
        port: mysqlConfig.PORT,
        user: mysqlConfig.USER,
        password: mysqlConfig.PASSWORD,
        charset: mysqlConfig.CHARSET,
        database: mysqlConfig.DATABASE
    });
    //console.log(this.pool);
    this.pool.on('connection', function (connection) {
        console.log("连接池连接success");
    });
    this.pool.on("error",function(err){
        //c
        logger.error(err)
    })
}
mysqlPool.prototype.checkconnected = function (cb) {
    this.query("show tables", {}, function (err, res) {
        if (err) {
            logger.warn("MYSQL 连接异常");
        } else {
            logger.info("MYSQL 连接成功");
        }
        cb();
    })
}
mysqlPool.prototype.query = function (SQL, args, callback) {
    this.pool.getConnection(function (err, connection) {
        if (err && err.code === 'PROTOCOL_SEQUENCE_TIMEOUT') {
            throw new Error('too long to count table rows!');
        }
        if (!!err) {
            callback(err, connection);
            return ;
        }
        var genSql = mysql.format(SQL, args);
        mysqlConfig.PRINTSQL&&logger.info(genSql);
        connection.query({sql:genSql,timeout: mysqlConfig.QUERYTIMEOUT}, function (err, rows) {
            connection.release();
            callback(err, rows);
        });
    });
}
mysqlPool.prototype.queryByPage = function (SQL, args, pagesize, page, callback) {
    this.pool.getConnection(function (err, connection) {
        if (err && err.code === 'PROTOCOL_SEQUENCE_TIMEOUT') {
            throw new Error('too long to count table rows!');
        }
        if (!!err) {
            callback(err, connection);
            return;
        }
        var genSql = mysql.format(SQL, args);
        mysqlConfig.PRINTSQL && logger.info(genSql);
        connection.query({sql: genSql, timeout: mysqlConfig.QUERYTIMEOUT}, function (err, rows) {


        });
    });
}


mysqlPool.prototype.queryOne = function (SQL, args, callback) {
    this.pool.getConnection(function (err, connection) {
        if (err && err.code === 'PROTOCOL_SEQUENCE_TIMEOUT') {
            throw new Error('too long to count table rows!');
        }
        if (!!err) {
            callback(err, connection);
            return ;
        }
        var genSql = mysql.format(SQL, args);
        mysqlConfig.PRINTSQL&&logger.info(genSql);
        connection.query({sql:genSql,timeout: mysqlConfig.QUERYTIMEOUT}, function (err, rows) {
            connection.release();
            if (err) {
                callback(err);
                return;
            }
            callback(err, rows[0]);
        });
    });
}

mysqlPool.prototype.transaction = function(callback){
    this.pool.getConnection(function (err, connection) {
        if(!!err){
            callback(err);
            return ;
        }
        connection.beginTransaction(function(err) {
            callback(err,connection);
        });

    });

}
//pool.query('SELECT 1 + 1 AS solution', function(err, rows, fields) {
//    if (err) throw err;
//
//    console.log('The solution is: ', rows[0].solution);
//});

//pool.getConnection(function(err, connection) {
//    // Use the connection
//    connection.query( 'SELECT something FROM sometable', function(err, rows) {
//        // And done with the connection.
//        connection.release();
//
//        // Don't use the connection here, it has been returned to the pool.
//    });
//});

module.exports = new mysqlPool();
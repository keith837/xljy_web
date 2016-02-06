<<<<<<< HEAD
var _poolModule = require('generic-pool');

/*
 * Create mysql connection pool.
 */
var createMysqlPool = function() {
	var mysqlConfig = require("../../../config/mysqlConfig");
	return _poolModule.Pool({
		name: 'mysql',
		create: function(callback) {
			var mysql = require('mysql');
			var client = mysql.createConnection({
				host: mysqlConfig.HOST,
				user: mysqlConfig.USER,
				password: mysqlConfig.PASSWORD,
				database: mysqlConfig.DATABASE
			});
			callback(null, client);
		},
		destroy: function(client) {
			client.end();
		},
		max: 10,
		idleTimeoutMillis : 30000,
		log : false
	});
};

exports.createMysqlPool = createMysqlPool;
=======
var _poolModule = require('generic-pool');

/*
 * Create mysql connection pool.
 */
var createMysqlPool = function() {
	var mysqlConfig = require("../../../config/mysqlConfig");
	return _poolModule.Pool({
		name: 'mysql',
		create: function(callback) {
			var mysql = require('mysql');
			var client = mysql.createConnection({
				host: mysqlConfig.HOST,
				user: mysqlConfig.USER,
				password: mysqlConfig.PASSWORD,
				database: mysqlConfig.DATABASE
			});
			callback(null, client);
		},
		destroy: function(client) {
			client.end();
		},
		max: 10,
		idleTimeoutMillis : 30000,
		log : false
	});
};

exports.createMysqlPool = createMysqlPool;
>>>>>>> remotes/origin/master

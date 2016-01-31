var mysqlConfig = {
    HOST:"localhost",
    USER:"root"     ,
    PORT:3306       ,
    PASSWORD:""     ,
    DATABASE:"game" ,
    POOLSIZE:10     ,
    CHARSET:"UTF8_GENERAL_CI",
    DEBUG:false     ,
    QUERYTIMEOUT:60000  ,
    PRINTSQL :true
}
module.exports = mysqlConfig;
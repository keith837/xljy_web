/**
 * Created by developer on 2016/7/28.
 */
var basicController = require("../../core/utils/controller/basicController");
var moment = require('moment');
var async = require("async");

module.exports = new basicController(__filename).init({
    //展示统计结果
    showStatistic: function (req, res, next) {
        var self = this;
        var log = this.logger;
        var schoolId = parseInt(req.params.schoolId);
        if (!schoolId || isNaN(schoolId)) {
            return next(this.Error("没有输入学校ID."));
        }
        var summerStart = self.cacheManager.getCacheValue("VACATION_DATE", "SUMMER_START");
        var summerEnd = self.cacheManager.getCacheValue("VACATION_DATE", "SUMMER_END");
        var winterStart = self.cacheManager.getCacheValue("VACATION_DATE", "WINTER_START");
        var winterEnd = self.cacheManager.getCacheValue("VACATION_DATE", "WINTER_END");
        var dateCond = getDateCondition(summerStart, summerEnd, winterStart, winterEnd);
        var startDate = moment(dateCond[0], 'YYYYMMDD').format("YYYY-MM-DD");
        var endDate = moment(dateCond[1], 'YYYYMMDD').format("YYYY-MM-DD");
        var current = moment(dateCond[2], 'YYYYMMDD').format("YYYY-MM-DD");
        log.info("统计日期:" + dateCond);

        var tasks = {
            classInfo: function (cb) {
                self.model['school'].listClassBySchoolId(schoolId, function (err, classes) {
                    if (err) {
                        return cb(err);
                    }
                    if (!classes || classes.length < 1) {
                        return cb(new Error("学校没有建立相应的班级."));
                    } else {
                        var classObject = new Object();
                        for (var i in classes) {
                            classObject[classes[i].classId] = [classes[i].className, classes[i].studentNum];
                        }
                        cb(err, [classes, classObject]);
                    }
                });
            },
            attends: function (cb) {
                self.model['attendance'].statisticBySchoolId(1, schoolId, current, function (err, attends) {
                    if (err) {
                        return cb(err);
                    }
                    var attendsObject = new Object();
                    for (var i in attends) {
                        attendsObject[attends[i].classId] = [attends[i].attends, attends[i].students];
                    }
                    cb(err, attendsObject);
                });
            },
            avg_attends: function (cb) {
                self.model['attendance'].avgStatisticBySchoolId(1, schoolId, startDate, endDate, function (err, avg) {
                    if (err) {
                        return cb(err);
                    }
                    if (!avg) {
                        return cb(err, 0);
                    }
                    cb(err, avg.avg_count + "%");
                });
            },
            sports: function (cb) {
                self.model['sports'].statisticBySchoolId(schoolId, dateCond[2], function (err, sportsData) {
                    if (err) {
                        return cb(err);
                    }
                    var sportsObject = new Object();
                    for (var i in sportsData) {
                        sportsObject[sportsData[i].classId] = sportsData[i].calValue;
                    }
                    cb(err, sportsObject);
                });
            },
            avg_sports: function (cb) {
                self.model['sports'].avgStatisticBySchoolId(schoolId, dateCond[0], dateCond[1], function (err, avg) {
                    if (err) {
                        return cb(err);
                    }
                    if (!avg) {
                        return cb(err, 0);
                    }
                    cb(err, avg.calValue);
                });
            }
        }
        async.parallel(tasks, function (err, results) {
            if (err) {
                return next(err);
            }

            try {
                var classInfo = results.classInfo[0];
                var classObjects = results.classInfo[1];
                log.info(classObjects);
                var attends = results.attends;
                log.info(attends);
                var avg_attends = results.avg_attends;
                log.info(avg_attends);
                var sports = results.sports;
                log.info(sports);
                var avg_sports = results.avg_sports;
                log.info(avg_sports);
                var minAttendsRate = 0, minSports = 0;
                var minAttendsClass = classInfo[0].classId, minSportsClass = classInfo[0].classId;
                var sumAttends = 0, sumStudents = 0, sumSports = 0;
                var firstAttend = true, firstSports = true;
                var sportsLength = 0;
                for (var i in classInfo) {
                    var attend = attends[classInfo[i].classId];
                    sumStudents += classObjects[classInfo[i].classId][1];
                    if (attend) {
                        if (attend[1] > 0) {
                            sumAttends += attend[0];
                            if (firstAttend) {
                                minAttendsRate = attend[0] / attend[1];
                                minAttendsClass = classInfo[i].classId;
                                firstAttend = false;
                            } else {
                                if (attend[0] / attend[1] < minAttendsRate) {
                                    minAttendsRate = attend[0] / attend[1];
                                    minAttendsClass = classInfo[i].classId;
                                }
                            }
                        }
                    } else {
                        minAttendsRate = 0;
                        minAttendsClass = classInfo[i].classId;
                        firstAttend = false;
                    }

                    var classSport = sports[classInfo[i].classId];

                    if (classSport) {
                        sportsLength++;
                        sumSports += classSport;
                        if (firstSports) {
                            minSports = classSport;
                            minSportsClass = classInfo[i].classId;
                            firstSports = false;
                        } else {
                            if (classSport < minSports) {
                                minSports = classSport;
                                minSportsClass = classInfo[i].classId;
                            }
                        }
                    }
                }
                res.json({
                    code: "00",
                    data: {
                        attendance: {
                            today: sumAttends + "/" + sumStudents,
                            todayMin: {
                                className: classObjects[minAttendsClass][0],
                                count: attends[minAttendsClass] ? attends[minAttendsClass][0] + "/" + attends[minAttendsClass][1] : 0 + "/" + 0
                            },
                            termCount: avg_attends
                        },
                        sports: {
                            today: isEmpty(sports) ? 0 : (sumSports / sportsLength).toFixed(0),
                            todayMin: {
                                className: classObjects[minSportsClass][0],
                                count: minSports
                            },
                            termCount: avg_sports
                        }
                    }
                });

            } catch (e) {
                log.error(e);
                return next(self.Error("查询信息出错"));
            }

        });

    }


});

function getDateCondition(summerStart, summerEnd, winterStart, winterEnd) {
    var start = "", end = "";
    var currentDay = moment().format("YYYYMMDD");
    var currentYear = currentDay.substring(0, 4);
    if ((currentYear + '' + summerStart) <= currentDay && currentDay <= (currentYear + '' + summerEnd)) {
        start = currentYear + '' + winterEnd;
        end = currentYear + '' + summerStart;
    } else if ((currentYear + '' + summerEnd) <= currentDay && currentDay <= (currentYear + '' + '1231')) {
        start = currentYear + '' + summerEnd;
        end = currentDay;
    } else if ((currentYear - 1 + '' + '1231') <= currentDay && currentDay <= (currentYear + '' + winterStart)) {
        start = currentYear - 1 + '' + summerEnd;
        end = currentDay;
    } else if ((currentYear + '' + winterStart) <= currentDay && currentDay <= (currentYear + '' + winterEnd)) {
        start = currentYear - 1 + '' + summerEnd;
        end = currentYear + '' + winterStart;
    } else if ((currentYear + '' + winterEnd) <= currentDay && currentDay <= (currentYear + '' + summerStart)) {
        start = currentYear + '' + winterEnd;
        end = currentDay;
    } else {
        start = currentDay;
        end = currentDay;
    }
    return [start, end, currentDay];
}


function isEmpty(obj) {
    return (Object.getOwnPropertyNames(obj).length === 0);
}


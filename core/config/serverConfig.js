var serverConfig = {
    mapping: {

        attendance: {
            "usedModel": ["device/device", "attendance/attendance", "student/student", "school/class"],
            "newAttendance": {
                "url": "/api/student/attendance/:macAddr",
                "method": "post",
                "description": "学生出入园(new)"
            }
        },
        station: {
            "usedModel": ['station/station'],
            "heartbeat": {
                "url": "/api/stations/heartbeat/:id",
                "method": "put",
                "description": "基站心跳推送"
            }
        }

    }
}

module.exports = serverConfig;

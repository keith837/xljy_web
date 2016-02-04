/**
 * Created by pz on 16/1/27.
 */

var basicController = require("../../core/utils/controller/basicController");
module.exports = new basicController(__filename).init({
    devicelist: function (request, response, next) {
        var self = this;
        var start = parseInt(request.body.iDisplayStart);
        var pagesize = parseInt(request.body.iDisplayLength);

        this.db.queryOne("SELECT count(*) as co FROM XL_DEVICE ", {}, function (err, res) {
            var allsize = res.co;
            self.db.query("SELECT * FROM XL_DEVICE LIMIT ?,?", [start, pagesize], function (err, res) {
                response.json({iTotalRecords: allsize, iTotalDisplayRecords: allsize, aaData: res});
            })
        })


    }


});

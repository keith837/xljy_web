/**
 * Created by pz on 16/1/27.
 */

var basicController = require("../../core/utils/controller/basicController");
module.exports = new basicController(__filename).init({
    devicelist: function (request, response, next) {
        var self = this;
        var start = parseInt(request.body.iDisplayStart);
        var pagesize = parseInt(request.body.iDisplayLength);


        this.model['device'].queryPage(start, pagesize, function (err, allsize, res) {
            if (err) {
                next(err);
                return;
            }
            response.json(self.createPageData(allsize, res));
        });


    }

});

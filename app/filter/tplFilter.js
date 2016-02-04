var tplFilter = function (filters) {
    for (var x in this) {
        filters[x] = this[x];
    }
}
tplFilter.prototype.str = function (obj) {
    if (typeof(obj) == "string") {
        return '"' + obj + '"';
    } else if (typeof(obj) == "object") {
        return '""';
    } else {
        return obj;
    }
}
tplFilter.prototype.jsonstr = function (obj) {
    return JSON.stringify(obj);
}
module.exports = tplFilter;
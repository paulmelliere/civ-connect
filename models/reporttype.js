var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;

var ReportType = new Schema({
    name: String
    //supported fields?
});

module.exports = mongoose.model('ReportType', ReportType);
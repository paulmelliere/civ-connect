var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;

var Report = new Schema({
    type: ObjectId, //ReportType
    typeName: String,
    timestamp: Date,
    location : {longitude:Number, latitude:Number},
    picture : String, //url
    description : String,
    status : String,
    reporterId : ObjectId, //Account
    supporterIds : [ObjectId], //Accounts
    parentReportId : ObjectId // report
});

module.exports = mongoose.model('Report', Report);
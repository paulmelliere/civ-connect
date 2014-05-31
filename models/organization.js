var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;

var Organization = new Schema({
    name: String,
    coverage: [ObjectId], //Areas
    admins: [ObjectId] //Accounts
});

module.exports = mongoose.model('Organization', Organization);
/**
 * Created by Kevin on 4/11/2016.
 */
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var Event = new Schema({
    url: String,
    map: []
});

module.exports = mongoose.model('Event', Event);
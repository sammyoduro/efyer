var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var appTokenSchema = new Schema({
  eventid     :{type:String},
  gentoken     :{type:String,},
  active        :{type:Boolean,default:false},
  createdAt     :{type: Date, default: Date.now}
});

module.exports = mongoose.model('appToken',appTokenSchema);
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var contactusSchema = new Schema({
  name     :{type:String},
  email    :{type:String,},
  message  :{type:String},
  read     :{type:Boolean,default:false},
  createdAt:{type: Date, default: Date.now}
});

module.exports = mongoose.model('contactus',contactusSchema);
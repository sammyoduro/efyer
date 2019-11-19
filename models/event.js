var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var eventSchema = new Schema({
  _userid       :{type:mongoose.Schema.Types.ObjectId,required:true, ref:'User'},
  eventid       :{type:String},
  eventname     :{type:String},
  alias         :{type:String},
  deleted       :{type:Boolean,default:false},
  start_date   :{type:String},
  end_date      :{type:String},
  createdAt     :{type: Date,default: Date.now}
});

module.exports = mongoose.model('event',eventSchema);
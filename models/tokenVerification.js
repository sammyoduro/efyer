var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var userSchema = new Schema({
  _userid       :{type:mongoose.Schema.Types.ObjectId,required:true, ref:'User'},
  token         :{type:String,required:true},
  createdAt     :{type: Date,required:true, default: Date.now, expires:1200}
});

module.exports = mongoose.model('verifiedToken',userSchema);
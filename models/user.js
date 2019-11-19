var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var bcrypt = require('bcrypt-nodejs');

var userSchema = new Schema({
  usertype           :{type:String },
  firstname           :{type:String },
  lastname            :{type:String},
  email               :{type:String,unique:true},
  brandname           :{type:String},
  isVerified          :{type:Boolean,default:false},
  password            :{type:String},
  passwordResetToken  :{type:String},
  passwordResetExpires:{type:String},
  createdAt           :{type:String},
  updatedAt           :{type:String}
});

userSchema.methods.encryptPassword = function (password) {
  return bcrypt.hashSync(password,bcrypt.genSaltSync(8),null);
};

userSchema.methods.validPassword = function (password) {
  return bcrypt.compareSync(password,this.password);
}

module.exports = mongoose.model('User',userSchema);

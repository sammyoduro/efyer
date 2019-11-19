var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var verifiedSchema = new Schema({
  eventid           :{type:String},
  verificationType  :{type:String},
  contact_number    :{type:String},
  msg               :{type:String},
  ticketpin         :{type:String},
  raw_ticketpin     :{type:String},
  verified          :{type:Boolean,default: false},
  verifiedAt        :{type: Date},
  createdAt         :{type:Date,expires:3600}
});

module.exports = mongoose.model('verificationTickets',verifiedSchema);
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var paymentSchema = new Schema({
  evenid             :{type:String},
  amount             :{type:String},
  trans_ref_no       :{type:String},
  order_id           :{type:String},
  payment_made_at    :{type: Date,default: Date.now},
  deleted            :{type: Boolean,default: false}
});

module.exports = mongoose.model('payments',paymentSchema);
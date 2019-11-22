var express = require('express');
var router = express.Router();
const sha1 = require('sha1');
const axios = require('axios');
var verifyTicket = require('../models/verificationTickets');
var Payment = require('../models/payment')

router.get('/',async function(req, res, next) {
    var charges='';
    if (req.session.qrcodes.length < 500) {
        charges = req.session.qrcodes.length * 0.70//charge 1cedis per ticket
    }else if(req.session.qrcodes.length >= 500 && req.session.qrcodes.length < 1000){
        charges = req.session.qrcodes.length * 0.50//charge 0.70 pessewas per ticket
    }else if(req.session.qrcodes.length >= 1000 && req.session.qrcodes.length < 5000){
        charges = req.session.qrcodes.length * 0.40//charge 0.50 pessewas per ticket
    }else if(req.session.qrcodes.length >= 5000 && req.session.qrcodes.length < 10000){
        charges = req.session.qrcodes.length * 0.30//charge 0.70 pessewas per ticket
    }else if(req.session.qrcodes.length >= 10000){
        charges = req.session.qrcodes.length * 0.20//charge 0.20 pessewas per ticket
    }
    
    var ref = GenRandomRef();
    var data = {};
    data.app_id     = '2452016064';
    data.app_key    = 'test';
    var URL         = 'https://test.interpayafrica.com/interapi/ProcessPayment';
    data.return_url  = 'https://efyer.herokuapp.com/paymentAuth/confirmpayment/feedback';
    
    // data.app_id    = '7453014192';
    // data.app_key    ='76716648';
    // var URL         = 'https://www.interpayafrica.com/interapi/ProcessPayment';
    // data.return_url  = 'http://localhost:3000/paymentAuth/confirmpayment/feedback';

    data.name       = req.user.brandname;
    data.email      = req.user.email;
    // data.pnumber    = req.user.phone_num;
    data.currency   = 'GHS';
    data.amount     = charges;
    data.order_id   = ref;
    data.order_desc = 'tracking tickets purchase';
    data.signature = data.app_id+data.app_key+data.order_id+data.amount+data.currency;
    
    axios.post(URL,data)
    .then((result)=>{
      if (result.data.status_code == 1) {
        res.redirect(result.data.redirect_url);

      }else if (result.data.status_code == 0) {
        req.flash('danger',result.data.status_message);
        res.redirect(req.session.oldurl);
      }
    })
    .catch((error)=>{
      console.log(error.message);
    })

})
router.get('/feedback',async function(req, res, next) {
    var status_code     = req.query.status_code;
    var status_message  = req.query.status_message;
    var trans_ref_no    = req.query.trans_ref_no;
    var order_id        = req.query.order_id;
    var signature       = req.query.signature; 
    var date = new Date(req.session.selectedevent[0].end_date);
    // var expireDate = new Date(date.setDate(date.getDate()+182));
  var expireDate = new Date(date.setDate(date.getDate()+1));
    if (status_code == 1) {
    try {
        var base = req.session.oldurl.split('/q/?id=')[1];
        var eventid = base.split('&&')[0]
        var done=0;
        req.session.qrcodes.forEach(element => {
            verifyTicket.insertMany([{
                eventid:eventid,
                verificationType:'qrcode',
                ticketpin:element,
                raw_ticketpin:element,
                createdAt :  expireDate
            }]);
            done++;
        });
        if(done === req.session.qrcodes.length){
            var payment = new Payment({
               evenid      : eventid,
               amount      :req.session.charges,
               trans_ref_no:trans_ref_no,
               order_id    :order_id
           });
               payment.save();
               req.session.qrcodes = '';
               req.session.charges = '';
       
               req.flash('success','payment recieved, tickets saved successfully!');
               res.redirect(req.session.oldurl);
           
       }

    } catch (error) {
        next(error);
    }



    
  
}else{
        req.flash('danger',status_message);
        res.redirect(req.session.oldurl);
    }

    })
module.exports = router;

function GenRandomRef() {
    var text = '';
    var posible = '01234567890123456789' ;
     for (var i = 0; i < 10; i++) {
      text += posible.charAt(Math.floor(Math.random()* posible.length));
     }
     return text;
    }
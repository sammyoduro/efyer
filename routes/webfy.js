var express = require('express');
var router = express.Router();
var csrf = require('csurf');
var csrfProtection = csrf();
router.use(csrfProtection);
var AppToken = require('../models/apptokens');
var Event = require('../models/event');
var verifytoken = require('../models/verificationTickets');

router.post('/',async (req,res)=>{
var ticket = req.body.p;

req.checkBody('p','please enter ticket pin').trim().notEmpty();
let parseErrors = req.validationErrors();

if(parseErrors){
    res.send({status:4,msg:'please enter ticket pin'})
}else{

var ticket_pin = ticket.trim();
var event_id  = req.session.app_token;

var _checkticket =  await verifytoken.find({eventid:event_id,verificationType:'pin',ticketpin:ticket_pin},(err,e)=> {if (err) throw err; return e;})

if(_checkticket.length < 1){
    res.send({status:3,msg:'ticket invalid'})
}else{
    if(_checkticket[0].verified)   {

        res.send({status:2,msg:'ticket has been used'})
    }
    else{
        var _query ={ticketpin:_checkticket[0].ticketpin}
        var _update ={$set:{verified:true,verifiedAt:Date.now()}}
        verifytoken.updateOne(_query,_update,async (err,respond)=>{
            if(err) throw err;
            res.send({status:1,msg:'ticket verified successfully!'})
        })

    }
}
    
}

});


module.exports = router;
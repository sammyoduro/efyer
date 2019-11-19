var express = require('express');
var router = express.Router();
var appToken = require('../models/apptokens');
var Event = require('../models/event');
var crypto = require('crypto');

var en = crypto.randomBytes(16).toString('hex');

router.get('/',async function(req, res, next) {
let apptoken = req.query.apptoken.toUpperCase();
if(!apptoken){
    res.send({status:4,err_msg:'Empty app token'})
}
else{

    var foundToken =  await appToken.find({gentoken:apptoken},(err,e)=> {if (err) throw err; return e;})
    

    if(foundToken.length < 1){
        res.send({status:2,err_msg:'invalid app token'})
    }

    else{
        var _event =  await Event.find({_id:foundToken[0].eventid,deleted:false},(err,e)=> {if (err) throw err; return e;})
        res.send({status:1,sucsess_msg:'success',token:_event[0]._id,event_name:_event[0].eventname})
      
            
        
        }
}
})
module.exports = router;
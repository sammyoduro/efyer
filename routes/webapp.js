var express = require('express');
var router = express.Router();
var csrf = require('csurf');
var csrfProtection = csrf();
router.use(csrfProtection);
var AppToken = require('../models/apptokens');
var Event = require('../models/event');
router.get('/',(req,res)=>{
res.render('webapplogintemplate',{
    csrfToken:req.csrfToken(),
    err:''
});
});

router.post('/',async (req,res)=>{
   
    req.checkBody('apptoken','please enter app token to login').trim().notEmpty();
    let parseErrors = req.validationErrors();

if(parseErrors){
    res.render('webapplogintemplate',{
        csrfToken:req.csrfToken(),
        err:parseErrors[0].msg
    });
}else{
    var apptoken = req.body.apptoken;
    var foundToken =  await AppToken.find({gentoken:apptoken},(err,e)=> {if (err) throw err; return e;})
    
    if(foundToken.length  < 1){

    res.render('webapplogintemplate',{
        csrfToken:req.csrfToken(),
        err:'Wrong app token'
    });
}else{
    var _event =  await Event.find({_id:foundToken[0].eventid,deleted:false},(err,e)=> {if (err) throw err; return e;})
    req.session.app_event_name = _event[0].eventname;
    req.session.app_token = _event[0]._id;
res.redirect('/app/login/user_temp');
    
 }
} 
});
router.get('/user_temp',async (req,res)=>{

    res.render('webapptemplate',{
        app_event_name:req.session.app_event_name,
        csrfToken:req.csrfToken(),
    })
    
})
module.exports = router;
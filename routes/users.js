var express         = require('express');
var router          = express.Router();
var csrf           = require('csurf');
var Event           = require('../models/event');
var appToken        = require('../models/apptokens');
var QRcode          = require('qrcode');
var crypto          = require('crypto');
const axios         = require('axios');
var verifyTicket    = require('../models/verificationTickets')
var Payment         = require('../models/payment')
var csrfProtection  = csrf();
var mongoose        = require('mongoose');
var User            = require('../models/user');
var bcrypt          = require('bcrypt-nodejs');
router.use(csrfProtection);
/* GET users listing. */
router.get('/',isLoggedIn,async function(req, res, next) {

  var eventlist = await Event.find({_userid:req.user,deleted:false},(err,e) => {
    if (err) throw err
    return e;
    
  })

  req.session.eventlist = eventlist;

  res.render('./user/dashboard',{
    user:req.user,
    csrfToken:req.csrfToken(),
    eventlist:eventlist,
    data:{},
    errors:{},
    wrdate:''
  })
});
// create events
router.post('/',isLoggedIn,async function(req, res, next) {  
  var eventlist = await Event.find({_userid:req.user,deleted:false},(err,e)=> {if (err) throw err; return e;})
req.session.eventlist = eventlist;

  req.checkBody('ename','field is required').trim().notEmpty();
  req.checkBody('alias','field must be maximum of 5 characters').trim().notEmpty().isLength({max:5});
  req.checkBody('sdate','please provide event start date').notEmpty();
  req.checkBody('edate','please provide event end date').notEmpty();
  let parseErrors = req.validationErrors();
  let errors ={}
  if (parseErrors) {
    parseErrors.forEach(element => {errors[element.param] = element.msg});   
     
    res.render('./user/dashboard',{
      user:req.user,
      csrfToken:req.csrfToken(),
      eventlist:eventlist,
      data:req.body,
      errors:errors,
      wrdate :''
    })
  }else{

    var ename = req.body.ename;
    var alias = req.body.alias.replace(/ +/g, "");
    var sdate = req.body.sdate;
    var edate = req.body.edate;

    var date1 = new Date(sdate);
    var date2 = new Date(edate);
    var Difference_In_Time = date2.getTime() - date1.getTime(); 
    
    if(Difference_In_Time < 0 ){
      res.render('./user/dashboard',{
        user:req.user,
        csrfToken:req.csrfToken(),
        eventlist:eventlist,
        data:req.body,
        errors:errors,
        wrdate :'date is not appropriate'
      })
      
    }else{

      var event = new Event({
      _userid:req.user,
      eventid:GenEventid(),
      eventname:ename,
      alias:alias.toUpperCase(),
      start_date:sdate,
      end_date:edate
    });
    event.save(function (err,results) {
      if(err) throw err;      
    req.flash('success',req.body.ename+' event successfully created');
    res.redirect('/dashboard')
    })
      
    }
   0}

});

//create app gen token
router.get('/e/',isLoggedIn,async function (req,res) {
  if(typeof(req.query.id)=='undefined' || typeof(req.query.q)=='undefined'){
    req.flash('danger','You have been logged out!?');
        req.logout();
        res.redirect('/');
  }else{
    var checkid = await Event.findOne({_userid:req.user,_id:req.query.id,deleted:false},(err,e)=> {
      if (err){ 
        req.flash('danger','You have been logged out!?');
        req.logout();
        res.redirect('/');
      }
       return e;
  
      })
  }
  
  if(!checkid){
    req.flash('danger','Sorry, event doesnt exit. Create Event');
          res.redirect('/dashboard')
  }
  else{
  let id = req.query.id;
  let alias = req.query.alias;
  
  var eventname =  await Event.find({_id:id,deleted:false},(err,e)=> {if (err) throw err; return e;})
  var GetAppToken =  await appToken.find({eventid:id},(err,e)=> {if (err) throw err; return e;})
  var get_qrcodeticket =  await verifyTicket.countDocuments({eventid:req.query.id,verificationType:'qrcode'},(err,e)=> {if (err) throw err; return e;})
  var get_pinticket =  await verifyTicket.countDocuments({eventid:req.query.id,verificationType:'pin'},(err,e)=> {if (err) throw err; return e;})
  req.session.eventURL = req.url;
  req.session.selectedevent = eventname;

  res.render('./event/event',{
    user:req.user,
    eventname:eventname,
    get_qrcodeticket:get_qrcodeticket,
    get_pinticket:get_pinticket,
    GetAppToken:GetAppToken
  })
}
})
router.get('/t/',isLoggedIn,async function (req,res) {
 
  if(typeof(req.query.id)=='undefined' || typeof(req.query.q)=='undefined'){
    req.flash('danger','You have been logged out!?');
        req.logout();
        res.redirect('/');
  }else{
    var checkid = await Event.findOne({_userid:req.user,_id:req.query.id,alias:req.query.q,deleted:false},(err,e)=> {
      if (err){ 
        req.flash('danger','You have been logged out!?');
        req.logout();
        res.redirect('/');
      }
       return e;
  
      })
  } 
if(!checkid){
  req.flash('danger','Sorry, event doesnt exit. Create Event');
          res.redirect('/dashboard')
}else{
    let genAppToken = req.query.q+randomAppToken();
    var apptoken = new appToken({
      eventid:req.query.id,
      gentoken:genAppToken.toUpperCase(),
      eventdate:req.body.sdate
    });
    apptoken.save(function (err,results) {
      if(err) throw err
      req.flash('success',' app token generated');
      res.redirect('/dashboard/e/?id='+req.query.id+'&&q='+req.query.q)
    })
}


  
})
// pinticket list
router.get('/ptickets/',isLoggedIn,async function (req,res) {
  if(typeof(req.query.id)=='undefined' || typeof(req.query.q)=='undefined'){
    req.flash('danger','You have been logged out!?');
        req.logout();
        res.redirect('/');
  }else{
    var checkid = await Event.findOne({_userid:req.user,_id:req.query.id,alias:req.query.q,deleted:false},(err,e)=> {
      if (err){ 
        req.flash('danger','You have been logged out!?');
        req.logout();
        res.redirect('/');
      }
       return e;
  
      })
  }
  if(!checkid){
    req.flash('danger','Sorry, event doesnt exit. Create Event');
          res.redirect('/dashboard')
  }
  else{
    let id = req.query.id;
    let alias = req.query.alias;

  var eventname =  await Event.findOne({_userid:req.user,_id:req.query.id,alias:req.query.q,deleted:false},(err,e)=> {if (err) throw err; return e;})
  var GetAppToken =  await appToken.find({eventid:id},(err,e)=> {if (err) throw err; return e;})
  var num_qrcodeticket =  await verifyTicket.countDocuments({eventid:req.query.id,verificationType:'qrcode'},(err,e)=> {if (err) throw err; return e;})
  var num_pinticket =  await verifyTicket.countDocuments({eventid:req.query.id,verificationType:'pin'},(err,e)=> {if (err) throw err; return e;})
  
  
  var perPage = 20;
  var page = 1; 
  verifyTicket
  .find({eventid:req.query.id,verificationType:'pin'})
  .sort({_id:-1})
  .skip((perPage * page) - perPage)
  .limit(perPage)
  .exec(function(err, get_pinticket) {
    verifyTicket.countDocuments({eventid:req.query.id,verificationType:'pin'}).exec(function(err, count) {
      verifyTicket.aggregate([{$match:{eventid:req.query.id,verificationType:'pin'} },{$sample: { size: 10 } }],function (err,Pshuffle) {
          res.render('./user/pinlist',{
          user:req.user,
          eventname:eventname,
          num_qrcodeticket:num_qrcodeticket,
          num_pinticket:num_pinticket,
          get_pinticket:get_pinticket,
          GetAppToken:GetAppToken,
          Pshuffle:Pshuffle,
          current: page,
          pages: Math.ceil(count / perPage)
        })
        
      })
      
    })

  })

  }

})
router.get('/pticket/',isLoggedIn,async function (req,res) {
var perPage = 20
var page = req.query.page || 1
let id = req.query.id;
let alias = req.query.alias;

var eventname =  await Event.findOne({_userid:req.user,_id:req.query.id,alias:req.query.q,deleted:false},(err,e)=> {if (err) throw err; return e;})
var GetAppToken =  await appToken.find({eventid:id},(err,e)=> {if (err) throw err; return e;})
var num_qrcodeticket =  await verifyTicket.countDocuments({eventid:req.query.id,verificationType:'qrcode'},(err,e)=> {if (err) throw err; return e;})
var num_pinticket =  await verifyTicket.countDocuments({eventid:req.query.id,verificationType:'pin'},(err,e)=> {if (err) throw err; return e;})
verifyTicket
.find({eventid:req.query.id,verificationType:'pin'})
.sort({_id:-1})
.skip((perPage * page) - perPage)
.limit(perPage)
.exec(function(err, get_pinticket) {
  verifyTicket.countDocuments({eventid:req.query.id,verificationType:'pin'}).exec(function(err, count) {
    verifyTicket.aggregate([{$match:{eventid:req.query.id,verificationType:'pin'} },{$sample: { size: 10 } }],function (err,Pshuffle) {
        res.render('./user/pinlist',{
        user:req.user,
        eventname:eventname,
        num_qrcodeticket:num_qrcodeticket,
        num_pinticket:num_pinticket,
        get_pinticket:get_pinticket,
        GetAppToken:GetAppToken,
        Pshuffle:Pshuffle,
        current: page,
        pages: Math.ceil(count / perPage)
      })
      
    })
    
  })

})

})
// export tickets pins
router.get('/exportpins/',isLoggedIn,async function (req,res) {

  var pinticket =  await verifyTicket.find({eventid:req.query.t,verificationType:'pin'},{_id:0,eventid:0,verifiedAt:0,__v:0},(err,e)=> {if (err) throw err; return e;})
  res.send({status:true,pinticket:pinticket})
})
// qrcode generation
router.get('/q/',isLoggedIn,async function (req,res) {

  if(typeof(req.query.id)=='undefined' || typeof(req.query.q)=='undefined'){
    req.flash('danger','You have been logged out!?');
        req.logout();
        res.redirect('/');
        
  }else{
    var checkid = await Event.findOne({_userid:req.user,_id:req.query.id,alias:req.query.q,deleted:false},(err,e)=> {
      if (err){ 
        req.flash('danger','You have been logged out!?');
        req.logout();
        res.redirect('/');
      }
       return e;
  
      })
  }  
  if(!checkid){
    req.flash('danger','Sorry, event doesnt exit. Create Event');
          res.redirect('/dashboard')
  }else{
  var eventname =  await Event.findOne({_userid:req.user,_id:req.query.id,alias:req.query.q,deleted:false},(err,e)=> {if (err) throw err; return e;})
  var get_verify_Ticket =  await verifyTicket.find({eventid:req.query.id,verificationType:'qrcode'},(err,e)=> {if (err) throw err; return e;})
  var get_qrcodeticket =  await verifyTicket.countDocuments({eventid:req.query.id,verificationType:'qrcode'},(err,e)=> {if (err) throw err; return e;})
  var get_pinticket =  await verifyTicket.countDocuments({eventid:req.query.id,verificationType:'pin'},(err,e)=> {if (err) throw err; return e;})
  
  res.render('./user/genqrcode',{
    user:req.user,
    eventname:eventname,
    get_verify_Ticket:get_verify_Ticket,
    get_qrcodeticket:get_qrcodeticket,
    get_pinticket:get_pinticket
  })
  }

  
})
// QRCODE list 
router.get('/qtickets/',isLoggedIn,async function (req,res) {
  if(typeof(req.query.id)=='undefined' || typeof(req.query.q)=='undefined'){
    req.flash('danger','You have been logged out!?');
    req.logout();
    res.redirect('/');
  }else{
    var checkid = await Event.find({_userid:req.user,_id:req.query.id,alias:req.query.q,deleted:false},(err,e)=> {
      if (err){ 
        req.flash('danger','You have been logged out!?');
        req.logout();
        res.redirect('/');
      }
       return e;
  
      })
  }
  if(!checkid){
    req.flash('danger','Sorry, event doesnt exit. Create Event');
          res.redirect('/dashboard')
  }
  else{
    let id = req.query.id;
    let alias = req.query.alias;

  var eventname =  await Event.findOne({_userid:req.user,_id:req.query.id,alias:req.query.q,deleted:false},(err,e)=> {if (err) throw err; return e;})
  var GetAppToken =  await appToken.find({eventid:id},(err,e)=> {if (err) throw err; return e;})
  var num_qrcodeticket =  await verifyTicket.countDocuments({eventid:req.query.id,verificationType:'qrcode'},(err,e)=> {if (err) throw err; return e;})
  var num_pinticket =  await verifyTicket.countDocuments({eventid:req.query.id,verificationType:'pin'},(err,e)=> {if (err) throw err; return e;})
 
  var perPage = 42;
  var page = 1; 
  verifyTicket
  .find({eventid:req.query.id,verificationType:'qrcode'})
  .sort({_id:-1})
  .skip((perPage * page) - perPage)
  .limit(perPage)
  .exec(async function(err, get_qrcodeticket) {
    var QRlist=[];
    for (let i = 0; i < get_qrcodeticket.length; i++) {   
      QRlist.push( await QRcode.toDataURL(get_qrcodeticket[i].ticketpin));
    }

    verifyTicket.countDocuments({eventid:req.query.id,verificationType:'qrcode'}).exec(function(err, count) {
        res.render('./user/qrcodelist',{
          user:req.user,
          eventname:eventname,
          num_qrcodeticket:num_qrcodeticket,
          num_pinticket:num_pinticket,
          QRlist:QRlist,
          get_qrcodeticket:get_qrcodeticket,
          GetAppToken:GetAppToken,
          current: page,
          pages: Math.ceil(count / perPage)
        })
    })



  })

  }
});

router.get('/qticket/',isLoggedIn,async function (req,res) {
  var perPage = 42
  var page = req.query.page || 1
  let id = req.query.id;
  let alias = req.query.alias;

  var eventname =  await Event.findOne({_userid:req.user,_id:req.query.id,alias:req.query.q,deleted:false},(err,e)=> {if (err) throw err; return e;})
  var GetAppToken =  await appToken.find({eventid:id},(err,e)=> {if (err) throw err; return e;})
  var num_qrcodeticket =  await verifyTicket.countDocuments({eventid:req.query.id,verificationType:'qrcode'},(err,e)=> {if (err) throw err; return e;})
  var num_pinticket =  await verifyTicket.countDocuments({eventid:req.query.id,verificationType:'pin'},(err,e)=> {if (err) throw err; return e;})
  verifyTicket
  .find({eventid:req.query.id,verificationType:'qrcode'})
  .sort({_id:-1})
  .skip((perPage * page) - perPage)
  .limit(perPage)
  .exec(async function(err, get_qrcodeticket) {
    var QRlist=[];
    for (let i = 0; i < get_qrcodeticket.length; i++) {   
      QRlist.push( await QRcode.toDataURL(get_qrcodeticket[i].ticketpin));
    }

    verifyTicket.countDocuments({eventid:req.query.id,verificationType:'qrcode'}).exec(function(err, count) {
      verifyTicket.aggregate([{$match:{eventid:req.query.id,verificationType:'qrcode'} },{$sample: { size: 10 } }],function (err,Pshuffle) {
        res.render('./user/qrcodelist',{
          user:req.user,
          eventname:eventname,
          num_qrcodeticket:num_qrcodeticket,
          num_pinticket:num_pinticket,
          QRlist:QRlist,
          GetAppToken:GetAppToken,
          Pshuffle:Pshuffle,
          current: page,
          pages: Math.ceil(count / perPage)
        })
      })
    })


  })

})
var chk = 0;
/**********************
 * QRCODE GENERATION
 **********************/
router.get('/genqrcodes',isLoggedIn,async function (req,res) {

  if(! isNaN(req.query.limit) && parseInt(req.query.limit)){
 if(parseInt(req.query.limit) < 10001){
// calculate charges
var charges=0;
if (req.query.limit < 500) {
    charges = req.query.limit * 0.70//charge 1cedis per ticket
}else if(req.query.limit >= 500 && req.query.limit < 1000){
    charges = req.query.limit * 0.50//charge 0.70 pessewas per ticket
}else if(req.query.limit >= 1000 && req.query.limit < 5000){
    charges = req.query.limit * 0.40//charge 0.50 pessewas per ticket
}else if(req.query.limit >= 5000 && req.query.limit < 10000){
    charges = req.query.limit * 0.30//charge 0.70 pessewas per ticket
}else if(req.query.limit >= 10000){
    charges = req.query.limit * 0.20//charge 0.20 pessewas per ticket
}

   var QRlist=[];
   var rawQRlist=[];
   var QRcodeQuery = {}
   for (let i = 0; i < parseInt(req.query.limit); i++) {
     var en = crypto.randomBytes(16).toString('hex');
     
     if(chk == 0){
      var u = unique();
    }
    var _q = u+en;

     rawQRlist.push(await _q);
     QRlist.push(await QRcode.toDataURL(_q)) 
     chk++;
   } 
   req.session.qrcodes = rawQRlist;
   req.session.oldurl = req.query.url;
   req.session.charges = charges;
   QRcodeQuery = {rawQRlist:rawQRlist,QRlist:QRlist,c:charges.toFixed(2)}
chk = 0;
   //@TODO DELETE AFTER SIMULATION
  //  var base = req.query.url.split('/q/?id=')[1];
  //  var eventid = base.split('&&')[0]
  //  var done=0;
  //  rawQRlist.forEach(element => {
  //      verifyTicket.insertMany([{
  //          eventid:eventid,
  //          verificationType:'qrcode',
  //          ticketpin:element
  //      }]);
  //      done++;
  //  });
  //  if(done === rawQRlist.length){
  //      req.flash('success','payment recieved, tickets saved successfully!');
  //      res.send({status:true,qrcode:QRcodeQuery});
  //  }

// END SIMULATION
   res.send({status:true,qrcode:QRcodeQuery});
 }else{
  
   res.send({status:false,errmsg:'maximum qrcodes generated per click is 10000'});
 }
  
}else{
  res.send({status:false,errmsg:'input field requires whole number'});
}
})

// export tickets pins
router.get('/exportqrcode/',isLoggedIn,async function (req,res) {
  var qrcodes =  await verifyTicket.find({eventid:req.query.t,verificationType:'qrcode'},{_id:0,eventid:0,verifiedAt:0,__v:0},(err,e)=> {if (err) throw err; return e;})

  var QRlist=[];
  for (let i = 0; i < qrcodes.length; i++) {   
    QRlist.push( await QRcode.toDataURL(qrcodes[i].ticketpin));
  }

  res.send({status:true,qrcodes:QRlist})
})
/*************************
 * GENERATE PIN TICKET
 *************************/
router.get('/p/',isLoggedIn,async function (req,res) {
  var url = '/dashboard/p/?id='+req.query.id+'&&q='+req.query.q
  req.session.oldurl = url;  

  var eventname =  await Event.find({_id:req.query.id,deleted:false},(err,e)=> {if (err) throw err; return e;})
  var get_qrcodeticket =  await verifyTicket.find({eventid:req.query.id,verificationType:'qrcode'},(err,e)=> {if (err) throw err; return e;})
  var get_pinticket =  await verifyTicket.find({eventid:req.query.id,verificationType:'pin'},(err,e)=> {if (err) throw err; return e;})
 


  res.render('./user/genpins',{
    csrfToken:req.csrfToken(),
    user:req.user,
    eventname:eventname,
    get_qrcodeticket:get_qrcodeticket,
    get_pinticket:get_pinticket
  })
  
})

router.get('/genticketpins',isLoggedIn,async function (req,res) {
  
  if(! isNaN(req.query.limit) && parseInt(req.query.limit)){
 if(parseInt(req.query.limit) <= 10000){
   var pinlist=[];


for (let i = 0; i < parseInt(req.query.limit); i++) {
  do {
    var _pin = genticketpin(); 
  } while (pinlist.find((p) => p ==_pin) != null);
  if(chk == 0){
    var u = unique();
  }
  var _p = u+_pin;
  chk++;
  pinlist.push(_p.toUpperCase());
}

chk=0;
//calculate charges
var charges=0;
if (pinlist.length < 500) {
    charges = pinlist.length * 0.70//charge 1cedis per ticket
}else if(pinlist.length >= 500 && pinlist.length < 1000){
    charges = pinlist.length * 0.50//charge 0.70 pessewas per ticket
}else if(pinlist.length >= 1000 && pinlist.length < 5000){
    charges = pinlist.length * 0.40//charge 0.50 pessewas per ticket
}else if(pinlist.length >= 5000 && pinlist.length <= 10000){
    charges = pinlist.length * 0.30//charge 0.70 pessewas per ticket
}


//@TODO DELETE AFTER SIMULATION
// var base = req.query.url.split('/p/?id=')[1];
// var eventid = base.split('&&')[0]
// var done=0;
// pinlist.forEach(element => {
//     verifyTicket.insertMany([{
//         eventid:eventid,
//         verificationType:'pin',
//         ticketpin:element
//     }]);
//     done++;
// });
// if(done === pinlist.length){
//     req.flash('success','payment recieved, tickets saved successfully!');
//     res.send({status:true,pinlist:pinlist});
// }

// END SIMULATION
req.session.tpins = pinlist;
   res.send({status:true,pinlist:pinlist,l:pinlist.length,c:charges.toFixed(2),m:'contact numbers will recieve generated Tickets via sms'});
 }else{
  
   res.send({status:false,errmsg:'maximum qrcodes generated per click is 10,000'});
 }
  
}else{
  res.send({status:false,errmsg:'input field requires a whole number'});
}
  
})
router.post('/process/genticketpins',isLoggedIn,async function (req,res) {
 req.session.ctn = req.body.ctn;
 req.session.ct = req.body.ct;
 req.session.smsmsg = req.body.smsmsg;

  var charges=0;
  if (req.session.tpins.length < 500) {
      charges = req.session.tpins.length * 0.70//charge 1cedis per ticket
  }else if(req.session.tpins.length >= 500 && req.session.tpins.length < 1000){
      charges = req.session.tpins.length * 0.50//charge 0.70 pessewas per ticket
  }else if(req.session.tpins.length >= 1000 && req.session.tpins.length < 5000){
      charges = req.session.tpins.length * 0.40//charge 0.50 pessewas per ticket
  }else if(req.session.tpins.length >= 5000 && req.session.tpins.length < 10000){
      charges = req.session.tpins.length * 0.30//charge 0.70 pessewas per ticket
  }else if(req.session.tpins.length >= 10000){
      charges = req.session.tpins.length * 0.20//charge 0.20 pessewas per ticket
  }
  var ref = GenRandomRef();
  var data = {};
  data.app_id     = '2452016064';
  data.app_key    = 'test';
  var URL         = 'https://test.interpayafrica.com/interapi/ProcessPayment';
  data.return_url  = 'http://localhost:3000/dashboard/payment/genticketpins';
  data.name       = req.user.brandname;
  data.email      = req.user.email;
  data.currency   = 'GHS';
  data.amount     = charges;
  data.order_id   = ref;
  data.order_desc = 'Event tickets';
  data.signature = data.app_id+data.app_key+data.order_id+data.amount+data.currency;
  req.session.charges = charges;

  axios.post(URL,data)
  .then((result)=>{
    if (result.data.status_code == 1) {
      res.send({'status':true,'url':result.data.redirect_url});
    }else if (result.data.status_code == 0) {
      res.send({'status':false,'errmsg':result.data.status_message});
    }
  })
  .catch((error)=>{
    throw error.message;
  })

 
})

router.get('/payment/genticketpins',isLoggedIn,async function (req,res) {

  var status_code     = req.query.status_code;
  var status_message  = req.query.status_message;
  var trans_ref_no    = req.query.trans_ref_no;
  var order_id        = req.query.order_id;
  var signature       = req.query.signature;

  var date = new Date(req.session.selectedevent[0].end_date);
  // var expireDate = new Date(date.setDate(date.getDate()+182));
  var expireDate = new Date(date.setDate(date.getDate()+1));

  var base = req.session.oldurl.split('/p/?id=')[1];
    var eventid = base.split('&&')[0];

    if (status_code == 1) {

      var done=0;

     for (let i = 0; i < req.session.tpins.length; i++) {
      if(req.session.smsmsg){
        const msg = req.session.smsmsg +'\nTicket code BTC'+ req.session.tpins[i]+'BTC';
        
        // sendsms(req.session.ct[i],msg);
      }



    verifyTicket.insertMany([{
      eventid:eventid,
      verificationType:'pin',
      contact_number: req.session.ct ? req.session.ct[i]:'',
      msg: req.session.smsmsg ? req.session.smsmsg:'',
      ticketpin:req.session.tpins[i],
      raw_ticketpin:'BTC'+req.session.tpins[i]+'BTC',
      createdAt :  expireDate
    

  }]);
  done++;
  }
  
   if(done === req.session.tpins.length){
     var iscontact = req.session.ct ? 'payment recieved, ticket sent to customers successfully via sms':'payment recieved, tickets saved successfully!'; 

  

     var payment = new Payment({
      evenid      : eventid,
      amount      :req.session.charges,
      trans_ref_no:trans_ref_no,
      order_id    :order_id
  });
      payment.save();
      req.session.tpins = '';
      req.session.smsmsg = '';
      req.session.ctn = '';
      req.session.ct = '';
      req.session.charges = '';
     req.flash('success',iscontact);
     res.redirect(req.session.oldurl);
 }
     }else{
     req.flash('danger',status_message);
      res.redirect(req.session.oldurl);
    }
})

/****************************
 *     USER settings
 ****************************/ 
router.get('/settings',isLoggedIn,async function (req,res) {
  res.render('./user/settings',{
    csrfToken:req.csrfToken(),
    user:req.user
  })

})
router.post('/settings',isLoggedIn,async function (req,res) {
  var cpword = req.body.cpword;
  var pword = req.body.pword;
  var rpword = req.body.rpword;
  var emptyfield   = "";
  var pword_err   = "";
  var rpword_err = "";

  req.checkBody('cpword','field is required').trim().notEmpty();
  req.checkBody('pword','password must not be empty / minimum 8 characters').notEmpty().isLength({min:8});
  req.checkBody('rpword','password does not match').notEmpty().equals(req.body.pword);

  let errors = req.validationErrors();
  if(errors){
    for(var i=0; i < errors.length;i++){
      if( errors[i].msg === 'field is required'){ emptyfield = errors[i].msg}
      if( errors[i].msg === 'password must not be empty / minimum 8 characters'){ pword_err = errors[i].msg}
    }
    }
    if (pword != rpword) {
      pword_err = "passwords do not match";
    }
    if (emptyfield != "" || pword_err != "" || rpword_err != "") {
      res.send({status:false,emptyfield:emptyfield,pword_err:pword_err})
  
    }else{
      User.findOne({'_id':req.user.id},function (err,user) {

        bcrypt.compare(cpword,user.password,function(err,isMatch) {
          if(err) throw err;
    
          if(isMatch){
            var hash = bcrypt.hashSync(pword,bcrypt.genSaltSync(8));

            User.update({'_id':req.user.id}, {$set: {password : hash}}, function(err, result){
              if (err) {
                throw err
              }
            });
            res.send({status:true,msg:'user password reset successful'})
          }else{
            res.send({status:false,msg:'current password is not recognized'})
          }
        })
      })

    }
})
// delete event
router.get('/delete',isLoggedIn,async function (req,res) {

  if(typeof(req.query.id)=='undefined' || typeof(req.query.q)=='undefined'){
    req.flash('danger','Sorry, page not found. Login to continue');
      res.redirect('/login')
  }else{
    var checkid = await Event.findOne({_userid:req.user,_id:req.query.id,deleted:false},(err,e)=> {
      if (err){ 
        req.flash('danger','Sorry, event doesnt exit. Create Event to generate ticket');
        res.redirect('/dashboard')
      }
       return e;
  
      })
  }
  if(!checkid){
    req.flash('danger','Sorry, event doesnt exit. Create Event');
          res.redirect('/dashboard')
  }
  else{
    let id = req.query.id;
    var _del = await verifyTicket.deleteMany({eventid:id},(err,e)=> { if (err){throw err} return e;})
    var _delt = await appToken.deleteMany({eventid:id},(err,e)=> { if (err){throw err} return e;})
    var _query ={_id:id};
    var _update ={$set:{deleted:true}}
    Event.updateOne(_query,_update,(err,respond)=>{
      if(err) throw err;
      req.flash('success','Event deleted successfully!');
      res.redirect('/dashboard');
      
    })
  }
})

router.get('/live',async (req,res)=>{

  var report =  await verifyTicket.find({eventid:req.query.id,verified:true},{_id:0,eventid:0,ticketpin:0,contact_number:0,msg:0,createdAt:0,__v:0},(err,e)=> {if (err) throw err; return e;}).sort({verifiedAt:-1})

  res.send({status:true,report:report})

})

module.exports = router;

function randomAppToken() {
  var text = '';
  var posible = '123456789123456789123456789abcdefghijklmnpqrstuvwxyzabcdefghijklmnpqrstuvwxyzabcdefghijklmnpqrstuvwxyz';
   for (var i = 0; i < 5; i++) {
    text += posible.charAt(Math.floor(Math.random()* posible.length));
   }
   return text;
  }
  function genticketpin(limit=3) {
    
    var text = '';
    var posible = '123456789123456789123456789abcdefghijklmnpqrstuvwxyzabcdefghijklmnpqrstuvwxyzabcdefghijklmnpqrstuvwxyz';
     for (var i = 0; i < limit; i++) {
      text += posible.charAt(Math.floor(Math.random()* posible.length));
     }
     return text;
    }
    function unique(limit=2) {

        var text = '';
        var posible = '123456789123456789123456789abcdefghijklmnpqrstuvwxyzabcdefghijklmnpqrstuvwxyzabcdefghijklmnpqrstuvwxyz';
         for (var i = 0; i < limit; i++) {
          text += posible.charAt(Math.floor(Math.random()* posible.length));
         }
         return text;
      }
      
    function GenRandomRef() {
      var text = '';
      var posible = '01234567890123456789' ;
       for (var i = 0; i < 10; i++) {
        text += posible.charAt(Math.floor(Math.random()* posible.length));
       }
       return text;
      }
      function GenEventid(){
        var text = '';
        var posible = '0123456789012345678912345678912345678912345678912345678912345678912345678912345678912345678912345678912' ;
         for (var i = 0; i < 6; i++) {
          text += posible.charAt(Math.floor(Math.random()* posible.length));
         }
         return text;
        }

function sendsms(to,msg,sender_id='BoticsTech') {
  var url = "https://apps.mnotify.net/smsapi"
  axios.get(url,{
    params: {
      key:'kb92faNMukRI8IJAhIGoW1RNQ',
      to:to,
      msg:msg,
      sender_id:sender_id
    }
  })
  .then((result)=>{

  })
  .catch((error)=>{
    throw error.message;
  })
}

function isLoggedIn(req,res,next) {
  if(req.isAuthenticated()){
    return next();
  }
  res.redirect('/');
}
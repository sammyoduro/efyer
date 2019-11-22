var createError           = require('http-errors');
var express               = require('express');
var path                  = require('path');
const mongoose            = require('mongoose');
const bodyParser          = require('body-parser');
const expressValidator    = require('express-validator');
const flash               = require('connect-flash');
const session             = require('express-session');
const cookieParser        = require('cookie-parser');
const passport            = require('passport');
const MongoStore          = require('connect-mongo')(session);
var logger                = require('morgan');
var socket_io             = require( "socket.io" );
var indexRouter           = require('./routes/index');
var usersRouter           = require('./routes/users');
contactusRouter           = require('./routes/contactus');
var paymentAPIRouter      = require('./routes/paymentAPI');
var verifiedtickets           = require('./models/verificationTickets');
var applogin              = require('./routes/applogin');
var webapp                = require('./routes/webapp');
var webfy                 = require('./routes/webfy');
var emailreset            = require('./routes/emailreset');
var adminlogin            = require('./routes/admin/login');
var adminhome            = require('./routes/admin/home');

// mongoose.connect('mongodb://localhost:27017/efyerdb', { useNewUrlParser: true });
mongoose.connect('mongodb://sammyoduro:pass123pass@ds063833.mlab.com:63833/heroku_p660320s', { useNewUrlParser: true });
var db = mongoose.connection;
require('./config/passport');

db.once('open',function () {
  console.log('Database online');
})
db.on('error',function (err) {
  console.log(err);
})
var app = express();
var io = socket_io();
app.io = io;

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));
app.use(logger('dev'));
app.use(cookieParser('iloveprogramming'));
app.use(bodyParser.urlencoded({extended:true, limit:'50mb', parameterLimit: 10000000}));
//app.use(bodyParser.json({limit:'50mb'}));
app.use(expressValidator());
// Express session middleware
app.use(bodyParser({limit:'50mb'}))
app.use(session({
  secret: 'internetofthings',
  name: 'key',
  resave: true,
  saveUninitialized: true,
  store: new MongoStore({mongooseConnection:mongoose.connection}),
  cookie:{ maxAge: 500 * 60 * 1000 }
}));


// catch 404 and forward to error handler
app.use(function(err,req, res, next) {
  if (err.code!== 'EBADCSRFTOKEN') return next(err)
  res.status(403)
  res.send('form tempered with')
});

// Express messages middleware
app.use(require('connect-flash')());
app.use(passport.initialize());
app.use(passport.session());

// error handler
app.use(function (req,res,next) {
  res.locals.messages = require('express-messages')(req,res);
  res.locals.user     = req.isAuthenticated();
  res.locals.session  = req.session;  
  res.set('Cache-Control','no-cache, private, no-store, must-revalidate, max-stable=0,post-check=0,pre-check=0');
  next();
  });



  

 

/***********************************
        TICKET VERIFICATION
************************************/
app.get('/efyerapi/ticketverification',async function(req, res, next) {

  var event_id = req.query.event_id;
  var ticket_pin = req.query.verify_type == 'pin' ? req.query.ticket_pin.toUpperCase():req.query.ticket_pin;
  var verify_type = req.query.verify_type;
  
  if(event_id && ticket_pin && verify_type){
      var _checkticket =  await verifiedtickets.find({eventid:event_id,verificationType:verify_type,ticketpin:ticket_pin},(err,e)=> {if (err) throw err; return e;})

      if(_checkticket.length<1){
          res.send({status:3,msg:'ticket invalid'})
      }
      else{
          if(_checkticket[0].verified)   {

              res.send({status:2,msg:'ticket has been used'})
          }
          else{

              var _query ={ticketpin:_checkticket[0].ticketpin}
              var _update ={$set:{verified:true,verifiedAt:Date.now()}}
              verifiedtickets.updateOne(_query,_update,async (err,respond)=>{
                  if(err) throw err;                  
                  io.emit('verified' , {status:true,eventid:event_id});
                  res.send({status:1,msg:'ticket verified successfully!'})
              })
          }
      }  
  }else{
      res.send({status:0,err_msg:'missing field\'s'})
  }
  
  
  });

  // live ticket dashboard
  var Event                = require('./models/event');
  app.get('/live/',function (req,res) {
 try {
       if(typeof(req.query.i)=='undefined' ){
      req.flash('danger','Sorry, event doesnt exit. Create Event');
      req.logout();
      res.render('./live',{
        eventname:'',
        ticket:'',
        Pshuffle:'',
        counter:'',
        current: '',
        pages: ''
      });
    }else{
      Event.findOne({_userid:req.user,_id:req.query.i,deleted:false},(err,e)=> {
          if (err){ 
            req.flash('danger','Sorry, event doesnt exit. Create Event');
            res.render('./live',{
              eventname:'',
              ticket:'',
              Pshuffle:'',
              counter:'',
              current: '',
              pages: ''
            });
          }else{

            if(!e){
            req.flash('danger','Sorry, event doesnt exit. Create Event');
            res.render('./live',{eventname:'',ticket:''});
          }else{
            var perPage = 20;
            var page = 1;
            verifiedtickets
            .find({eventid:req.query.i,verified: true})
            .sort({verifiedAt:-1})
            .skip((perPage * page) - perPage)
            .limit(perPage)
            .exec(function(err, t) {
              verifiedtickets.countDocuments({eventid:req.query.i,verified: true}).exec(function(err, count) {
                verifiedtickets.aggregate([{$match:{eventid:req.query.i,verified: true} },{$sample: { size: 10 } }],function (err,Pshuffle) {
                  res.render('./live',{
                    eventname:e,
                    ticket:t,
                    Pshuffle:Pshuffle,
                    counter:count,
                    current: page,
                    pages: Math.ceil(count / perPage)
                  });
                })
              })
          })
        }
          }
      })
    }
 } catch (error) {
   console.log('catch error');
   
 }

  })
  var Event                = require('./models/event');
  app.get('/live/i/',function (req,res) {
 try {
       if(typeof(req.query.i)=='undefined' ){
      req.flash('danger','Sorry, event doesnt exit. Create Event');
      req.logout();
      res.render('./live',{
        eventname:'',
        ticket:'',
        Pshuffle:'',
        counter:'',
        current: '',
        pages: ''
      });
    }else{
      Event.findOne({_userid:req.user,_id:req.query.i,deleted:false},(err,e)=> {
          if (err){ 
            req.flash('danger','Sorry, event doesnt exit. Create Event');
            res.render('./live',{
              eventname:'',
              ticket:'',
              Pshuffle:'',
              counter:'',
              current: '',
              pages: ''
            });
          }else{

            if(!e){
            req.flash('danger','Sorry, event doesnt exit. Create Event');
            res.render('./live',{eventname:'',ticket:''});
          }else{
            var perPage = 20
            var page = req.query.page || 1
            verifiedtickets
            .find({eventid:req.query.i,verified: true})
            .sort({verifiedAt:-1})
            .skip((perPage * page) - perPage)
            .limit(perPage)
            .exec(function(err, t) {
              
              verifiedtickets.countDocuments({eventid:req.query.i,verified: true}).exec(function(err, count) {
                verifiedtickets.aggregate([{$match:{eventid:req.query.i,verified: true} },{$sample: { size: 10 } }],function (err,Pshuffle) {
                  res.render('./live',{
                    eventname:e,
                    ticket:t,
                    Pshuffle:Pshuffle,
                    current: page,
                    counter:count,
                    pages: Math.ceil(count / perPage)
                  });
                })
              })
          })
        }
          }
      })
    }
 } catch (error) {
   console.log('catch error');
   
 }

  })

// generate xcel
app.get('/live/ge',async function (req,res) {
  const excel = require('node-excel-export');

  var xported =  await verifiedtickets.find({eventid:req.query.s,verified: true},(err,e)=> {if (err) throw err; return e;}).sort({verifiedAt:-1})
 console.log(xported);

  // res.send({status:true})
})

app.use('/', indexRouter);
app.use('/contactus', contactusRouter);
app.use('/dashboard', usersRouter);
app.use('/paymentAuth/confirmpayment', paymentAPIRouter);
app.use('/efyerapplogin',applogin);
app.use('/app/login',webapp);
app.use('/auth/temp',webfy);
app.use('/rst',emailreset);
// ADMINISTRATORS
app.use('/youshouldnotbehere/administrators/login',adminlogin);
app.use('/youshouldnotbehere/administrators/',adminhome)
module.exports = app;

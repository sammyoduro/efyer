var express = require('express');
var router = express.Router();
var csrf = require('csurf');
var csrfProtection = csrf();
router.use(csrfProtection);
var bcrypt = require('bcrypt-nodejs');
var User = require('../../models/user');
var Event = require('../../models/event');
var Ticket = require('../../models/verificationTickets');
var crypto = require('crypto');

/************************
 *    ADMIN HOME 
 ************************/
router.get('/home',isLoggedIn, async function(req, res) {
    
    res.render('./administrator/home',{
        user:req.user
    });
})
/*************************
 *          USER
 *************************/
router.get('/newUser',isLoggedIn, async function(req, res) {
    
    res.render('./administrator/newUser',{
        user:req.user,
        csrfToken:req.csrfToken()
    });
});
router.post('/newUser',isLoggedIn, function(req, res) {
    req.checkBody('firstname','field is required').notEmpty();
    req.checkBody('lastname','last name is required').notEmpty();
    req.checkBody('email','invalid email').notEmpty().isEmail();
    req.checkBody('password','password must not be empty / minimum 8 characters').notEmpty().isLength({min:8});
    let parseErrors = req.validationErrors();
    let errors={}
  
    if (parseErrors) {
      parseErrors.forEach(element => {errors[element.param] = element.msg});    
      res.send({status:false,errors:errors})
    }else{
        User.findOne({'email':req.body.email},function (err,user) {
            if (err) throw err;
      
            if (!user) {
                let usertype=req.body.usertype;
        let fname = req.body.firstname;
        let lname = req.body.lastname;
        let bname = req.body.brandname;
        let email = req.body.email;
        var hashpwrd = bcrypt.hashSync(req.body.pasword,bcrypt.genSaltSync(8));
        var _user = new User({
            usertype:usertype,
            firstname:fname,
            lastname:lname,
            email:email,
            brandname:bname,
            isVerified:true,
            password:hashpwrd
        })
        _user.save(function (err,results) {
            if(err) throw err; 

        res.send({status:true})
        })
            }else{
                errors['email'] = 'The email you have entered is already associated with another account ';
                res.send({status:false,errors:errors})
            }
        });
        
    }
});
router.get('/userList',isLoggedIn, async function(req, res) {
    var userlist =  await User.find({},(err,e)=> {if (err) throw err; return e;})
    res.render('./administrator/userList',{
        user:req.user,
        userlist:userlist,
    });
})

router.get('/generate_ticket',isLoggedIn,async (req,res)=>{
    var userlist =  await User.find({},(err,e)=> {if (err) throw err; return e;})
    res.render('./administrator/generate_ticket',{
        user:req.user,
        csrfToken:req.csrfToken()
    });
})
router.post('/filterticket',isLoggedIn,async (req,res)=>{
    req.checkBody('filter','empty search').trim().notEmpty();
    let parseErrors = req.validationErrors();
    let errors={}
    if (parseErrors) {
    res.send({status:false,msg:parseErrors[0].msg});
    }else{
        var filter = req.body.filter;
        var event =  await Event.findOne({eventid:filter},(err,e)=> {if (err) throw err; return e;})
        if(event){            
            res.send({status:true,event:event});
        }
        else{
            res.send({status:false,msg:'event not found'});
        }
        
    }   
})
router.post('/genticket',isLoggedIn,async (req,res)=>{
    req.checkBody('uid','search for event unique id').trim().notEmpty();
    req.checkBody('lmt','enter limit').notEmpty();
 
    let parseErrors = req.validationErrors();
    let errors={}
    var done=0;
    var ticket =[];
    if (parseErrors) {
        parseErrors.forEach(element => {errors[element.param] = element.msg});    
        res.send({status:false,msg:errors})
      }else{
        if(! isNaN(req.body.lmt) && parseInt(req.body.lmt)){
            var pinlist=[];
        if(req.body.ttype == 'pin'){
           
            
            for (let i = 0; i < parseInt(req.body.lmt); i++) {
              do {
                var _pin = genticketpin(); 
              } while (pinlist.find((p) => p ==_pin) != null);
            Ticket.insertMany([{
                    eventid:req.body.uid,
                    verificationType:req.body.ttype,
                    ticketpin:_pin.toUpperCase(),
                    raw_ticketpin:'BTC'+_pin.toUpperCase()+'BTC'
                }],(err,e)=>{
                    if (err) throw err; 
                    done++;
                    if(done == req.body.lmt){
                        res.send({status:true,msg:''});
                    }
                    
                });
            
            }

        }
        else if(req.body.ttype == 'qrcode'){
            for (let i = 0; i < parseInt(req.body.lmt); i++) {
                var en = crypto.randomBytes(16).toString('hex');
                var u = unique();
            //    ticket.push(await u+en);
            Ticket.insertMany([{
                        eventid:req.body.uid,
                        verificationType:req.body.ttype,
                        ticketpin:await u+en,
                        raw_ticketpin:await u+en,
                    }]);
            
        done++;
              } 
              if(done === ticket.length){
                ticketpin ='';
                res.send({status:true,msg:''})
            }
        }
 
              
        
        }else{
            res.send({status:false,msg:{lmt:'input field requires a whole number'}})
        }
      }
})
router.get('/logout',function (req,res) {
    req.logout();
    res.redirect('/youshouldnotbehere/administrators/login');
  });
module.exports = router;

function genticketpin(limit=4) {
    
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
      function isLoggedIn(req,res,next) {
        if(req.isAuthenticated()){
          return next();
        }
        res.redirect('/youshouldnotbehere/administrators/login');
      }
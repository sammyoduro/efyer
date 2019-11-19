var express = require('express');
var router = express.Router();
var passport = require('passport');
var csrf = require('csurf');
var Event = require('../models/event');
var validation = require('../lib/validation');
var helpers = require('../lib/helpers');
var bcrypt = require('bcrypt-nodejs');
var User = require('../models/user');
var Token = require('../models/tokenVerification');
var crypto = require('crypto');
var nodemailer = require('nodemailer');

var csrfProtection = csrf();
router.use(csrfProtection);

/* GET home page. */
router.get('/', async function(req, res) {
  var hostedevent = await Event.find({},(err,e) => {if (err) throw err; return e;})
  var users = await User.find({},(err,e) => {if (err) throw err; return e;})


  res.render('index', {
    user:req.user,
    csrfToken:req.csrfToken(),
    hostedevent:hostedevent.length,
    users:users.length
  });
});

router.get('/login', function(req, res) { 
  res.render('login',{csrfToken:req.csrfToken()});
});

router.post('/login', passport.authenticate('local.signin',{
  failureRedirect: '/login',
  failureFlash   : true
}),function (req,res,next) {
  res.redirect('/');
});

router.get('/userAuth/confirmation/Token/', function(req, res, next) {
 var accountToken = req.query.id;
   Token.findOne({token:req.query.id},function(err,token) {
     if (!token) {
      req.flash('danger','We are unable to find a valid token. Your token may have expired');
        res.render('reset_err_password');
     }
     User.findOne({_id:token._userid},function(err,user) {
       if (!user) {
        req.flash('danger','We are unable to find a user for this token');
        res.render('reset_err_password');
       }
       if (user.isVerified) {
        req.flash('danger','This user has already been verified');
        res.render('reset_err_password');
       }
       user.isVerified = true;
       user.save(function (err) {
         if(err) throw err;
         req.flash('success','The account has been verified. Please login');
        res.redirect('/login');
       })
     })
   })
});

router.get('/join',function(req, res) {
  res.render('join',{
    csrfToken:req.csrfToken(),
    data:{},
    errors:{}
  });

});
router.post('/join', function(req, res) {
  
  req.checkBody('fname','field is required').notEmpty();
  req.checkBody('lname','field is required').notEmpty();
  req.checkBody('email','invalid email').notEmpty().isEmail();
  req.checkBody('bname','field is required').notEmpty();
  req.checkBody('pword','password must not be empty / minimum 8 characters').notEmpty().isLength({min:8});
  req.checkBody('rpword','password does not match').notEmpty().equals(req.body.pword);
  let parseErrors = req.validationErrors();
  let errors ={}

  if (parseErrors) {
    parseErrors.forEach(element => {errors[element.param] = element.msg});
    
    res.render('join',{
      csrfToken:req.csrfToken(),
      data:req.body,
      errors: errors
    });
  }
  else{
    User.findOne({'email':req.body.email},function (err,user) {
      if (err) throw err;

      if (!user) {
        var hashpwrd = bcrypt.hashSync(req.body.pword,bcrypt.genSaltSync(8));
        var user = new User({
          firstname:req.body.fname,
          lastname:req.body.lname,
          email:req.body.email,
          brandname:req.body.bname,
          password:hashpwrd,
          createdAt:new Date()
        });

        user.save(function (err,results) {
          if(err) throw err;

          var token = new Token({_userid:user._id, token: crypto.randomBytes(16).toString('hex')})
          token.save(function (err) {
            if(err) throw err;
            
                    // send mail

        var transporter = nodemailer.createTransport({
          host: 'mail.privateemail.com',
          port: 465,
          secure: true,
          tls:{ rejectUnauthorized: false},
          auth: {
            user: 'project@boticstechnologies.com',
            pass: '10student@?'
          }
  
          });
          var mailOptions = {
            from: '"Botics Technologies" <project@boticstechnologies.com>',
            to: req.body.email,
            subject: 'User Account verification Token',
            text: 'Hello '+ req.body.fname +', \n\n'+'Please verify your account by clicking the link: \nhttp:\/\/'+'localhost:3000\/userAuth\/confirmation\/Token\/?id='+token.token
            };
            transporter.sendMail(mailOptions, function(error, info){
              if (error) throw error;
              req.flash('success','a confirmation message has been sent to your email,please verify to continue');
              res.redirect('/login');
            })
          })
        })
        
      }else{
        errors['email'] = 'The email address you have entered is already associated with another account ';
        console.log('email already taken ');

        res.render('join',{
          csrfToken:req.csrfToken(),
          data:req.body,
          errors: errors
        });
        
      }
      
    })
  }
  

});

// logout
router.get('/logout',function (req,res) {
  req.logout();
  res.redirect('/');
});
module.exports = router;

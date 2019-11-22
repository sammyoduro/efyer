var express = require('express');
var router = express.Router();
var csrf = require('csurf');
var csrfProtection = csrf();
router.use(csrfProtection);
var User = require('../models/user');
var nodemailer = require('nodemailer');
var crypto = require('crypto');
var Token = require('../models/tokenVerification');
var bcrypt = require('bcrypt-nodejs');

router.post('/',async (req,res)=>{

    req.checkBody('rsm','invalid email').trim().isEmail();
    let parseErrors = req.validationErrors();
    if (parseErrors) {
        res.send({status:false,msg:parseErrors[0].msg})
    }else{

        var users = await User.findOne({email:req.body.rsm},(err,e) => {if (err) throw err; return e;})
        if(!users){
            res.send({status:false,msg:'no records found'})
        }else{
            var token = new Token({_userid:users._id, token: crypto.randomBytes(16).toString('hex')})
            token.save(function (err) {
                if(err) throw err;
    
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
                to: req.body.rsm,
                subject: 'Password reset',
                text: 'Hello '+ users.firstname +', \n\n'+'Please reset your account password by clicking the link: \nhttps:\/\/'+'efyer.herokuapp.com\/rst\/?id='+token.token
                };
                transporter.sendMail(mailOptions, function(error, info){
                  if (error) throw error;
                  res.send({status:true,msg:'password reset link sent to email'});
                })
              })

        }
        
    }
});

router.get('/',async (req,res)=>{
    var accountToken = req.query.id;
    Token.findOne({token:req.query.id},function(err,token) {
        if (!token) {
            req.flash('danger','We are unable to find a valid token. Your token may have expired');
            res.render('reset_err_password');
         }
         else{
             req.session.resetuserid = token._userid;

             req.flash('info','Please set up your new password');
            res.render('resetpassword',{
                csrfToken :req.csrfToken(),
                errors:{}
            });
             
             
         }
        })
})
router.post('/tmp',async (req,res)=>{

req.checkBody('npwd','password must not be empty / minimum 8 characters').notEmpty().isLength({min:8});
req.checkBody('rnpwd','password does not match').notEmpty().equals(req.body.npwd);
let parseErrors = req.validationErrors();
let errors ={}
if (parseErrors) {
    parseErrors.forEach(element => {errors[element.param] = element.msg});
    res.render('resetpassword',{
        csrfToken:req.csrfToken(),
        errors: errors
      });
}else{
   var userid = req.session.resetuserid;
   var npwd = req.body.npwd;

    var hashpwrd = bcrypt.hashSync(npwd,bcrypt.genSaltSync(8));
      var _query ={_id:userid}
            var _update ={$set:{password:hashpwrd}}
            User.updateOne(_query,_update,(err,response)=>{
                if(err) throw err;
                req.flash('success','password reset successful! Login with your new password');
                res.redirect('/login')
            })
    
}

})
module.exports = router;
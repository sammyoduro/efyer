var express = require('express');
var router = express.Router();
var passport = require('passport');
var bcrypt        = require('bcrypt-nodejs');
var Admin          = require('../../models/user');

var csrf = require('csurf');
var csrfProtection = csrf();
router.use(csrfProtection);

/************************
 * ADMINISTRATOR LOGIN
 *************************/
router.get('/', async function(req, res) {

    res.render('./administrator/login',{
        csrfToken:req.csrfToken()
    });

  });
  router.post('/', async function(req, res,next) {
    passport.authenticate('local.signin',function (err,user,info) {
        if (err) throw err;
        if(!user){
          req.flash("danger","incorrect username or password");
          res.redirect('/youshouldnotbehere/administrators/login');
        }else{
   
    
            req.login(user,function (error) {
              if(error) return next(error);
              res.redirect('/youshouldnotbehere/administrators/home');
    
            });
             // if (user.userType) {
      //   req.login(user,function (error) {
      //     if(error) return next(error);
      //     res.redirect('/areacode97/admin/outofbound/admin/proposals');

      //   });
      // }else{
      //   res.redirect('/')
      // }
        }
    })(req, res, next);

  });
module.exports = router;
var express = require('express');
var router = express.Router();
var csrf = require('csurf');
var Contactus = require('../models/contactus')

var csrfProtection = csrf();
router.use(csrfProtection);

router.post('/',(req,res)=>{
let name = req.body.name;
let email = req.body.email;
let message = req.body.email;

var contactus = new Contactus({
    name:name,
    email:email,
    message:message
})
contactus.save((err,result)=>{
    if (err) throw err;
    res.send({status:true});
})


});

module.exports = router;
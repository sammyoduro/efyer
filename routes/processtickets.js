var express = require('express');
var router = express.Router();

router.get('/',async function(req, res, next) {
    console.log(req.query);
    console.log(req.params);
    console.log(req.body);
console.log('hello world');
res.send({status:true})
   
    })
    module.exports = router;
var express = require('express');
var router = express.Router();
const webSocket=require('ws');
const ws=new webSocket('ws://localhost:8181');

/* GET home page. */
router.get('/', function(req, res, next) {
    res.render('index');
});

router.post('/', (req, res)=> {
    // console.log(req.body.msg);//Testing that form data arrives.
    ws.send(req.body.msg);
    //An error occurs if the server is not started.
    //Handle the error.
});

module.exports = router;

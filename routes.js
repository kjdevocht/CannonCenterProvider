/**
 * Created by Kevin on 4/9/2016.
 */
var express = require('express');
var router = express.Router();
var menu = require('./controllers/menuController');



var notImplemented = function(req,res){
    res.sendStatus(501);
}

router.route('/')
    .get(function(req,res){
        res.sendFile('index.html');
        //It will find and locate index.html from View or Scripts
    });

router.route('/menu').post(menu.menu);



module.exports = router;
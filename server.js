var express = require('express');
var mongoose = require('mongoose');
var bodyParser = require('body-parser');
var server = express();
var port = 8080;
var menu = require('./controllers/menuController');



//Logging dependencies
//var morgan = require('morgan');
//var logger = require('./logging');

server.use(bodyParser.json()); // for parsing application/json
server.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded

//Mongodb dependencies
var configDB = require('./config/database.js');
mongoose.connect(configDB.url, function(err){
    if(err) {
        console.log('Mongodb connection error', err);
    } else {
        console.log('Mongodb connection successful');
    }
}); // connect to our database
server.use(express.static(__dirname + '/views'));//Store all HTML files in view folder.

var routes = require('./routes');
server.use('/', routes);


//Start the server
server.listen(port, function(){
    console.log("The Magic is happening on port " + port);
    console.log("The Server Enviroment is "+server.settings.env);
    menu.getMenuInfo();
});
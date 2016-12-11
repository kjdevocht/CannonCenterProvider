//dependencies
var express = require('express');
var bodyParser = require('body-parser');
var https = require('https');
var fs = require('fs');
var path = require('path');


var server = express();
var port = 8080;
var menu = require('./controllers/menuController');



//Logging dependencies
//var morgan = require('morgan');
//var logger = require('./logging');

server.use(bodyParser.json()); // for parsing application/json
server.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded

server.use(express.static(__dirname + '/views'));//Store all HTML files in view folder.

var routes = require('./routes');
server.use('/', routes);

var prodPath = '/etc/letsencrypt/live/api.stoutsuidae.com/';
var devPath = path.join(__dirname);

//Start the server
https.createServer({
    key: fs.readFileSync(devPath+'/key.pem'),
    cert: fs.readFileSync(devPath+'/cert.pem')
}, server).listen(port, function () { 
    console.log('app listening on port '+port+'!' );
});

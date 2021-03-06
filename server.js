// set up ======================================================================
var bodyParser = require('body-parser');
var express = require('express');
var http = require('http');
var app = express();
var server = http.createServer(app);
var path = require('path');
var favicon = require('serve-favicon');
var fs = require('fs');
var port = process.env.PORT || 8001; 				// set the port	// load the database config
var methodOverride = require('method-override');
var qt = require('quickthumb');
var db = require('./models.js');
// configuration ===============================================================
 
app.use('/public', qt.static(path.join(__dirname + '/public'), {type: 'resize'}));
app.use(bodyParser.urlencoded({'extended': 'true'})); // parse application/x-www-form-urlencoded
app.use(bodyParser.json()); // parse application/json
app.use(bodyParser.json({type: 'application/vnd.api+json'})); // parse application/vnd.api+json as json
app.use(methodOverride('X-HTTP-Method-Override')); // override with the X-HTTP-Method-Override header in the request
app.use(bodyParser.json({limit: '100mb'}));
app.use(bodyParser.urlencoded({limit: '100mb', extended: true}));
app.disable('view cache');
app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));

// db.init(function(){
//     // routes ======================================================================
//
//     // listen (start app with node server.js) ======================================
//     server.listen(port);
//
//     console.log("CYoung.art webiste listening on port " + port);
// });

require('./app/routes.js')(app);

db.init(function(err) {
    if(err) {
        console.log(err);
        return;
    }
    server.listen(port, '127.0.0.1');
    console.log("CYoung.art website listening on port " + port);
});

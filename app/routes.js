var express = require('express');
var request = require('request');
var path = require('path');
var winston = require('winston');
var clone = require('clone');
var multer  = require('multer');
var config = require('./config');
var fs = require("fs");
var reload = require('require-reload')(require);
var db = require('../models.js');
const jsonwt = require('jsonwebtoken');

var SquareConnect = require('square-connect');
var defaultClient = SquareConnect.ApiClient.instance;

// Configure OAuth2 access token for authorization: oauth2
var oauth2 = defaultClient.authentications['oauth2'];
oauth2.accessToken = config.square.token;


var logger = new winston.Logger(config.logger.winston);

var storage = multer.diskStorage({ //multers disk storage settings
    destination: function (req, file, cb) {
        var dir = './public/images/';
        if (!fs.existsSync(dir)){
            fs.mkdirSync(dir);
        }
        cb(null, dir);
    },
    filename: function (req, file, cb) {
        //var datetimestamp = Date.now();
        //cb(null, file.fieldname + '-' + datetimestamp + '.' + file.originalname.split('.')[file.originalname.split('.').length -1])
        cb(null, file.originalname);
    }
});

var upload = multer({ //multer settings
    storage: storage
}).single('file');


function issue_jwt(user, cb) {
    console.log("issuing!");
    var claim = {
        iss: config.auth.iss,
        exp: (Date.now() + config.auth.ttl)/1000,
        profile: {
            username: user,
            role: 'admin'
        }
    };
    console.log( jsonwt.sign(claim, config.auth.secret));
    cb(null, jsonwt.sign(claim, config.auth.secret));
}

function check_jwt(req, res, next) {
    if(req.query.jwt === undefined) {
        res.sendStatus("403"); //FORBIDDEN
        return;
    }

    var decoded = jsonwt.verify(req.query.jwt, config.auth.secret);

    if(decoded === undefined){
        res.sendStatus("403"); //FORBIDDEN
        return;
    } else {
        next();
    }
}

module.exports = function (app) {

    app.use('/node_modules', express.static(path.join(__dirname, '/../node_modules')));
    app.use('/js', express.static(path.join(__dirname, 'js')));
    app.use('/t', express.static(path.join(__dirname, 't')));
    app.use('/images', express.static(path.join(__dirname, 'images')));


    /** API path that will upload the files */
    app.post('/upload', function(req, res, next) {
        upload(req,res,function(err){
            if(err){
                res.json({error_code:1,err_desc:err});
                return;
            }
            console.log(req.file.filename);
            db.Image.findOneAndUpdate(
                {path: req.file.filename},
                {
                    path: req.file.filename,
                    hide: true,
                    title: "Untitled",
                    width: 0,
                    height: 0,
                    category : "Uncategorized",
                    tags: [],
                    location: "",
                    desc: "",
                    inventory: {original:1,prints:0,cards:0}
                },
                {upsert: true},
                function(err, rec){
                    if(err) return next(err);
                    console.log(rec);
                    res.json({error_code:0,err_desc:rec});
                }
            );
        });
    });

    app.post('/update', function(req, res, next) {
        console.log(req.body.image);
        db.Image.findOneAndUpdate(
            {_id: req.body.image._id},
            req.body.image,
            {upsert: false},
            function(err, rec){
                if(err) return next(err);
                console.log(rec);
                res.json({error_code:0,err_desc:rec});
            }
        );
    });

    app.get('/imagelist/:limit/:page', function(req, res, next) {
        db.Image.paginate({}, {page: parseInt(req.params.page), limit: parseInt(req.params.limit)}, function(err, recs){
            if(err) {return next(err)};
            res.json(recs);
        });
    });

    app.get('/image/:id', function(req, res, next) {
        db.Image.find({'_id': req.params.id}, function(err, img){
            if(err) {return next(err)};
            res.json(img);
        });
    });

    app.get('/imgsearch/:q/:limit/:page', function(req, res, next) {
        db.Image.paginate({ "title": { "$regex": req.params.q, "$options": "i" }}, {page: parseInt(req.params.page), limit: parseInt(req.params.limit)},
            function(err,docs) {
                if(err) return next(err);
                res.json(docs);
        });
    });

    app.delete('/image/:id', function(req, res, next) {
        db.Image.findByIdAndRemove(req.params.id, function(err, img){
            if(err) {return next(err)};
            res.json(img);
        });
    });

    app.get('/sample/:category', function(req, res, next) {
        db.Image.aggregate([
            {$match : {"category": req.params.category, "hide" : false }},
            {$sample : {size: 1}}], function(err, rec){
            if(err) {return next(err);}
            db.Image.aggregate([
                {$match : {"category": req.params.category, "hide" : false }},
                {$group : {_id: null, count: { $sum: 1 } }}], function(err, counts){
                if(err) {return next(err);}
                rec['counts'] = counts.count;
                res.json({sample: rec[0], counts : counts[0]});
            });
        });
    });

    app.get('/images/:category/:limit/:page', function(req, res, next) {
        db.Image.paginate({"category": req.params.category, "hide" : false}, {page: parseInt(req.params.page), limit: parseInt(req.params.limit)}, function(err, recs){
            if(err) {return next(err);}
            res.json(recs);
        });
    });

    app.post('/users/login', function(req, res, next) {
        if(req.body.username && req.body.password) {
            if(req.body.username == config.auth.admin_user && req.body.password == config.auth.admin_pass) {
                issue_jwt(config.auth.admin_user, function(err, token){
                    if(err) {return next(err)};
                    res.json(token);
                })
            } else {
                res.sendStatus("403"); //FORBIDDEN
            }
        } else {
            res.sendStatus("403"); //FORBIDDEN
        }
    });

    //SQUARE API
    app.get('/square/locations', function(req, res, next) {
        var api = new SquareConnect.LocationsApi();
        api.listLocations().then(function(data) {
            console.log('API called successfully. Returned data: ' + data);
            res.json(data);
        }, function(error) {
            console.error(error);
        });
    });

    app.post('/checkout', function(req, res, next) {
        console.log(req.body);
        var api = new SquareConnect.CheckoutApi();
        const idempotencyKey = require('crypto').randomBytes(32).toString('hex');
        var order = {
            reference_id: 'Cyoung.art purchase',
            line_items: req.body.line_items,
            redirectUrl: req.body.request_url,
            taxes: [
                {
                    name: 'Sales Tax',
                    type: 'ADDITIVE',
                    percentage: '7.0'
                }
            ]
        };

        const requestBody = {
            idempotency_key: idempotencyKey,
            order: order,
            ask_for_shipping_address: true,
            merchant_support_email: 'help@cyoung.art'
        };

        api.createCheckout(config.square.location, requestBody)
            .then((response) => {
                const checkout = response.checkout;
                res.json(checkout);
            }).catch((err) => {
            console.log(err);
        });

    });

    app.get('/square/testcheckout', function(req, res, next) {
        var api = new SquareConnect.CheckoutApi();
        const idempotencyKey = require('crypto').randomBytes(32).toString('hex');
        const requestBody = {
            idempotency_key: idempotencyKey,
            order: {
                reference_id: 'reference_id',
                line_items: [
                    {
                        name: 'Printed T Shirt',
                        quantity: '2',
                        base_price_money: {amount: 555, currency: 'USD'}
                    },
                    {
                        name: 'Shipping & Handling',
                        quantity: '1',
                        base_price_money: {amount: 1095, currency: 'USD'}
                    }
                    ],
                taxes: [
                    {
                        name: 'Sales Tax',
                        type: 'ADDITIVE',
                        percentage: '7.0'
                    }
                ]
            },
            ask_for_shipping_address: true,
            merchant_support_email: 'help@cyoung.art'
        };

        api.createCheckout(config.square.test_location, requestBody)
            .then((response) => {
                const checkout = response.checkout;
                res.json(checkout);
            }).catch((err) => {
            console.log(err);
        });
    });




    // application -------------------------------------------------------------
    app.get('/*', function (req, res) {
        res.sendFile(__dirname + '/index.html'); // load the single view file (angular will handle the page changes on the front-end)
    });
};

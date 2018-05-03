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

    app.get('/imagelist', function(req, res, next) {
        db.Image.find({}, function(err, recs){
            if(err) {return next(err)};
            res.json(recs);
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

    app.get('/images/:category', function(req, res, next) {
        db.Image.find({"category": req.params.category, "hide" : false}, function(err, recs){
            if(err) {return next(err);}
            res.json(recs);
        });
    });


    // application -------------------------------------------------------------
    app.get('/*', function (req, res) {
        res.sendFile(__dirname + '/index.html'); // load the single view file (angular will handle the page changes on the front-end)
    });
};

/**
 * Created by youngmd on 4/24/18.
 */
"use strict";

//contrib
var mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate');

exports.init = function(cb) {
    mongoose.connect('mongodb://localhost/cyoung', {}, function(err) {
        if(err) {return cb(err);}
        console.log("connected to mongo");
        cb();
    });
};

var imageSchema = mongoose.Schema({
    ///////////////////////////////////////////////////////////////////////////
    ///////////////////////////////////////////////////////////////////////////
    date: { type: Date, default: Date.now },

    title: String,
    width: Number,
    height: Number,
    path : String,
    category : String,
    tags: Array,
    location: String,
    medium: String,
    desc: String,
    hide: Boolean,
    inventory: mongoose.Schema.Types.Mixed
    //headers: mongoose.Schema.Types.Mixed, //HTTP header associated with this answer  - Do we really need/want this?
});

imageSchema.plugin(mongoosePaginate);

exports.Image  = mongoose.model('Image', imageSchema);
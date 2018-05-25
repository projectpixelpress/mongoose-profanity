/*
Copyright (C) 2014 Kano Computing Ltd.
License: http://www.gnu.org/licenses/gpl-2.0.txt GNU General Public License v2
*/

var profanity = require('profanity-util'),
    mongoose = require('mongoose');

var flagSchema = new mongoose.Schema({

    author: {
        type: mongoose.Schema.Types.Mixed,
        default: null
    },

    reason: String

});


function profanityPlugin (schema, options) {
    options = options || {};

    schema.pre('save', function (next) {

        var entry = this;
        var result = profanity.purify(entry._doc, options);

        next();
    });

    schema.pre('update', function (next) {
      var entry = this;
      var result = profanity.purify(entry._doc, options);

        next();
    });
}

module.exports = profanityPlugin;

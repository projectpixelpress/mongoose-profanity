/* Copyright (C) 2014 Kano Computing Ltd.
License: http://www.gnu.org/licenses/gpl-2.0.txt GNU General Public License v2 */

var mongoose = require('mongoose'),
  profanityPlugin = require('../lib/plugin.js'),
  should = require('should'),
  util = require('./util'),
  Schema = mongoose.Schema;

mongoose.Promise = global.Promise;

mongoose.connect('mongodb://localhost:27017/mongooseprofanitytest');

var db = mongoose.connection;

db.on('error', function(err) {
  console.error('Connection error: please check if mongodb is running on localhost');
  throw err;
});

//
// TEST 1
//
var TestSchema = new Schema({title: String, description: String, immune: String});

TestSchema.plugin(profanityPlugin, {
  fields: [
    'title', 'description'
  ],
  maxFlags: 5
});

var Test = mongoose.model('Test', TestSchema);

//
// TEST 2
//
var TestSchema2 = new Schema({text: String});

TestSchema2.plugin(profanityPlugin, {
  obscureSymbol: '%',
  maxFlags: 3
});

var Test2 = mongoose.model('Test2', TestSchema2);

//
// TEST 3
//
var TestSchema3 = new Schema({text: String});

TestSchema3.plugin(profanityPlugin, {
  forbiddenList: [
    'foo', 'bar', 'test'
  ],
  replacementsList: [
    'oof', 'rab', 'tset'
  ],
  replace: true,
  maxFlags: 3
});

var Test3 = mongoose.model('Test3', TestSchema3);

//
// TEST 4
//
var TestSchema4 = new Schema({text: String, name: String, phone: String});

TestSchema4.plugin(profanityPlugin, {
  replace: true,
  replacementsList: [
    'bunny'
  ],
  fields: ['text', 'name']
});

var Test4 = mongoose.model('Test4', TestSchema4);

//
// TEST 5
//
var TestSchema5 = new Schema({
  text: String,
  name: String,
  data: {
    title: String,
    otherText: String
  }
});

TestSchema5.plugin(profanityPlugin, {
  replace: true,
  replacementsList: [
    'bunny'
  ],
  fields: ['data', 'title']
});

var Test5 = mongoose.model('Test5', TestSchema5);

//
// TEST 6
//
var TestSchema6 = new Schema({
  text: String,
  name: String,
  data: [
    {
      title: String,
      otherText: String
    },
    {
      title: String,
      otherText: String
    }
  ]
});

TestSchema6.plugin(profanityPlugin, {
  replace: true,
  replacementsList: [
    'bunny'
  ]
});

var Test6 = mongoose.model('Test6', TestSchema6);

describe('Profanity plugin', function() {

  before((done) => { //Before each test we empty the database
    Test.remove().then(() => {
      Test2.remove().then(() => {
        Test3.remove().then(() => {
          Test4.remove().then(() => {
            Test5.remove().then(() => {
              Test6.remove().then(() => {
                done();
              });
            });
          });
        });
      });
    });
  });

  it('works correctly with partial replace option', function(done) {
    new Test2({text: 'testing poop something partial replace'}).save(function(err, entry) {
      if (err) {
        throw err;
      }

      entry.text.should.equal('testing p%%p something partial replace');

      done();
    });
  });

  it('correctly uses custom matches list and replacements list and blacklists with 3 flags when given the option', function(done) {
    new Test3({text: 'foo unchanged bar unchanged test unchanged'}).save(function(err, entry) {
      if (err) {
        throw err;
      }

      util.testPurified(entry.text, '[ placeholder ] unchanged [ placeholder ] unchanged [ placeholder ] unchanged', 'oof|rab|tset');

      done();
    });
  });

  it('does not add flags or blacklist when replacing found bad word and maxFlags = falsey value like "undefined" in options', (done) => {
    new Test4({text: 'testing poop something partial replace', name: "shit"}).save(function(err, entry) {

      if (err) {
        throw err;
      }

      should.not.exist(entry.flags);
      should.not.exist(entry.blackListed);

      entry.text.should.equal('testing bunny something partial replace');

      done();
    });
  })

  it('correctly updates with purified string', (done) => {
    let test4 = new Test4({text: 'testing something', name: "sup"});
    let newText = 'testing poop something partial replace';

    test4.save(function(err, entry) {
      if (err) {
        throw err;
      }
    }).then(()=>{

      test4.text = newText;

      test4.save(function(err, entry) {
        if (err) {
          throw err;
        }

        entry.text.should.equal('testing bunny something partial replace');
        done();
      })

    });
  })

  it('correctly updates only the requested fields with purified string', (done) => {
    let test4 = new Test4({text: 'testing boob classroom uranus something partial replace', name: "tit", phone: 'poop'});

    test4.save(function(err, entry) {
      if (err) {
        throw err;
      }

      entry.phone.should.equal('poop');
      entry.text.should.equal('testing bunny classroom uranus something partial replace');
      entry.name.should.equal('bunny');

      done();

    });
  })

  it('correctly updates only the requested nested fields with purified string', (done) => {
    let updateFields = {
      text: 'boob',
      data: {
        title: 'poop',
        otherText: 'butt'
      }
    };

    let test5 = new Test5(updateFields)

    test5.save(function(err, entry) {
      if (err) {
        throw err;
      }

      entry.text.should.equal('boob');
      entry.data.title.should.equal('bunny');
      entry.data.otherText.should.equal('butt');

      done();

    });
  })

  it('does not correctly update nested array fields with purified string', (done) => {
    let updateFields = {
      text: 'boob',
      data: [
        {
          title: 'poop',
          otherText: 'butt'
        },
        {
          title: 'boob',
          otherText: 'ass'
        }
      ]
    };

    let test6 = new Test6(updateFields)

    test6.save(function(err, entry) {

      err.should.have.property('message')

      done();

    });
  })

});

var should = require('should'),
    util = require('./util'),
    profanity = require('../lib/profanity');

describe('Profanity module', function () {
    describe('.validate(target)', function () {
 
        it('returns null with no swearwords found in string', function (done) {
            should(profanity.check('No swearwords here')).eql([]);
            done();
        });

        it('returns array of swearwords found in dirty string', function (done) {
            var results = profanity.check('something damn something something poo something');

            should(results).eql([
                'damn',
                'poo'
            ]);

            done();
        });

        it('works equally for objects (Recursively) and arrays', function (done) {
            var results_obj = profanity.check({
                    foo: 'something damn',
                    bar: { test: 'something poo', bar: 'crap woooh' }
                }),
                results_arr = profanity.check([
                    'something damn',
                    [ 'something poo' ],
                    { foo: [ { bar: 'something crap' } ] }
                ]);

            should(results_obj).eql([
                'damn',
                'poo',
                'crap'
            ]);

            should(results_arr).eql([
                'damn',
                'poo',
                'crap'
            ]);

            done();
        });

    });
    describe('.purify(target)', function () {

        it('works with simple string', function (done) {
            var result = profanity.purify('boob damn something poo');

            util.testPurified(result[0], '[ placeholder ] [ placeholder ] something [ placeholder ]');
            result[1].should.eql([ 'boob', 'damn', 'poo' ]);


            done();
        });

        it('works recursively with objects', function (done) {
            var result = profanity.purify({
                bar: { foo: 'something boob', bar: { foo: 'test poo' } },
                test: 'something damn'
            });

            result[0].should.have.keys('bar', 'test');
            result[0].bar.should.have.keys('foo', 'bar');
            util.testPurified(result[0].bar.foo, 'something [ placeholder ]');
            result[0].bar.bar.should.have.keys('foo');
            util.testPurified(result[0].bar.bar.foo, 'test [ placeholder ]');
            util.testPurified(result[0].bar.foo, 'something [ placeholder ]');
            util.testPurified(result[0].test, 'something [ placeholder ]');

            result[1].should.eql([ 'boob', 'poo', 'damn' ]);

            done();
        });

    });
});
const Benchmark = require('benchmark');
const Stream = require('stream');

let suite = new Benchmark.Suite("Test Benchmark Suite");

const complexObject = {
    "test": 10,
    "test2": false,
    "test3": [200, 300, null, true, true]
};
suite.add('JSON.stringify', () => {
    
})
.add('glson', () => {
	/test/.test("test");
})
.on('cycle', function(event) {
    console.log(String(event.target));
})
.on('complete', function() {
    console.log('Fastest is ' + this.filter('fastest').map('name'));
})
.run({async: true});

class DummyStream extends Stream.Writable {
    
}
var mongoose = require('mongoose');
var log = require('npmlog');

var Schema = mongoose.Schema;
module.exports.mongoose = mongoose;
module.exports.Schema = Schema;
// Connect to cloud database
var username = "sa"
var password = "123456dev";
var address = '@ds027758.mongolab.com:27758/liemqv';
connect();
// Connect to mongo
function connect() {
	var url = 'mongodb://' + username + ':' + password + address;
	//console.log(url);
	mongoose.connect(url, function (err) {
	  if (err) {
	  	log.error('MongoDB', err.message);
	  }
	  log.info('MongoDB', 'ready');
	});
}
function disconnect() {mongoose.disconnect()}
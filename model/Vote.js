var db = require('../lib/db');
require('array.prototype.find');

var VoteItemSchema = new db.Schema({
	userid: {type: String},
	votedate  :  { type: Date, default: Date.now }
})

var VoteSchema = new db.Schema({
	voteid : { type: String, index: true, unique: true },
	votename : {type: String},
	voteimage: {type: String},
	moreinfo : {type: String},
	voting: [VoteItemSchema]
})
var MyVote = db.mongoose.model('Vote', VoteSchema);
// Exports
module.exports.addBlankVote = addBlankVote;
module.exports.addVoteItem = addVoteItem;
module.exports.getAllVote = getAllVote;
module.exports.getVote = getVote;
// Add Vote to database
function addBlankVote(voteid, votename, voteimage, moreinfo, callback) {
	var instance = new MyVote();
	instance.voteid = voteid;
	instance.votename = votename;
	instance.voteimage = voteimage;
	instance.moreinfo = moreinfo;
	instance.save(function (err) {
		if (err) {
			callback(err);
			console.log("Mongo Vote Insert failed: " + err);
		}
		else {
			callback(null, instance);
			console.log("Mongo Vote Insert success");
		}
	});
}

function addVoteItem(_voteid, voteitem, callback) {
	MyVote.findOne({ 'voteid': _voteid}, 'voteid voting', function (err, _vote) {
	  	if (err) {
	  		callback(err);
	  	} else {
		  	// add a voting
		  	if(_vote.voting.length == 0 || _vote.voting.find(function(item) {return item.userid == voteitem.userid;}) === undefined) {
		  			_vote.voting.push(voteitem);
		  			_vote.save(function (err) {
						if (err) {
							callback(err);
							console.log("Mongo VoteItem Insert failed: " + err);
						}
						else {
							callback(null, this);
							console.log("Mongo VoteItem Insert success");
						}
					});
	  		} else {
	  			console.log("User " + voteitem.userid + " has voted " + _voteid);
	  			callback(null, {});
	  		}
	  	}
	});
}

function getAllVote(callback) {
	MyVote.find({}, callback);
}

function getVote(id, callback) {
	MyVote.find({voteid: id}, callback);
}
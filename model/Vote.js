var db = require('../lib/db');

var VoteItemSchema = new db.Schema({
	voteid : {type: String},
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

function addVoteItem(voteid, voteitem, callback) {
	MyVote.findOne({ voteid: voteid }).exec(function (err, vote) {
	  	if (err) {
	  		callback(err);
	  	}
	  	// add a voting
	  	vote.voting.push(voteitem);
	  	vote.save(function (err) {
			if (err) {
				callback(err);
				console.log("Mongo VoteItem Insert failed: " + err);
			}
			else {
				callback(null, instance);
				console.log("Mongo VoteItem Insert success");
			}
		});
	});
}

function getAllVote(callback) {
	MyVote.find({}, callback);
}

function getVote(id, callback) {
	MyVote.find({voteid: id}, callback);
}
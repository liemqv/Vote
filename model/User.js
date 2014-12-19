var db = require('../lib/db');
var UserSchema = new db.Schema({
	userid : { type: String, index: true, unique: true },
	username : {type: String},
	fullname : {type: String},
	regdate  :  { type: Date, default: Date.now },
	moreinfo : {type: String}
})
var MyUser = db.mongoose.model('User', UserSchema);
// Exports
module.exports.addUser = addUser;
// Add user to database
function addUser(userid, username, fullname, moreinfo, callback) {
	MyUser.findOne({ userid: userid }, function(err, user){
		if(user) {
			user.username = username;
			user.fullname = fullname;
			user.moreinfo = moreinfo;
			user.save(function (err) {
		    	if (err) callback(err);
		  	});
		} else {
			var instance = new MyUser();
			instance.userid = userid;
			instance.username = username;
			instance.fullname = fullname;
			instance.save(function (err) {
				if (err) {
					callback(err);
					console.log("Mongo user Insert failed: " + err);
				}
				else {
					callback(null, instance);
					console.log("Mongo user Insert success");
				}
			});
		}
	});
}

function getById(userid, callback) {
	MyUser.findOne({ userid: userid }).exec(function (err, user) {
	  	if (err) {
	  		callback(err);
	  	} else {
	  		callback(null, user);
	  	}
	});
}
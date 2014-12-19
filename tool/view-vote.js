'use strict';
const
  Vote = require('../model/Vote.js');
  var allVote = Vote.getAllVote(function(err, data){
  	if(err) {
  		console.log('Error: ' + err);
  	} else {
  		data.forEach(function(item) { 
  			console.log(item);
  		});
  	}
  });
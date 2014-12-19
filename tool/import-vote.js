'use strict';
const
  Vote = require('../model/Vote.js'),
  VoteData = require('../data/vote_data.json');

  for (var i = 0; i < VoteData.length; ++i) {
    Vote.addBlankVote(VoteData[i].voteid, VoteData[i].votename, VoteData[i].voteimage, VoteData[i].moreinfo, function(err, data){
      if(err) {
        console.log('Insert failed. Error: ' + err);
      } else {
        console.log('Success insert success');
      }
    });
  };

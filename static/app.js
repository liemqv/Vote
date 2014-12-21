/***
 * (copy) liemqv
***/
/**
 * app.js
 */
(function(){

var
  
  templates = {},
  
  votes,
  
  getVotes = function() {
    $.ajax({
      url: '/api/vote/'
    })
    .then(function(data, status, xhr) {
      votes = data;
      showVotes();
    }, function(xhr, status, err) {
      if (xhr.status >= 500) {
        showErr(xhr, status, err);
      }
      votes = {};
      showVotes();
    });
  },
  
  addVote = function(id, callback) {
    $.ajax({
      type: 'PUT',
      url: '/api/vote/' + id,
      data: {"id": id},
      contentType: 'application/json; charset=utf-8',
      accepts: 'application/json'
    })
    .then(function(data, status, xhr) {
      callback(null, data);
    }, function(xhr, status, err) {
      callback(err);
    });
  },
  
  showErr = function(xhr, status, err) {
    $('.alert-danger').fadeIn().find('.message').text(err);
  },

  showInfo = function(message) {
    $('.alert-info').fadeIn().find('.message').text(message);
  },
  
  showView = function(selected) {
    window.location.hash = '#' + selected;
    $('.view').hide().filter('#' + selected + '-view').show();
  },
  
  showVotes = function() {
    $.each(votes, function(i, val){
      val.count_vote = val.voting != undefined ? val.voting.length : 0;
    });
    showView('list-vote');
    $('.votes').html(templates['list-vote']({ votes: votes }));
    initEvent();
  },

  initEvent = function() {
  // edit bundle buttons
  $('.vote').click(function(event) {
    var
      $button = $(event.target).closest('button'),
      id;
    
    if (!$button.length) {
      return;
    }
    
    id = $button.closest('tr').data('id');
    name = $button.closest('tr').find('td').eq(1).text();
    
    if ($button.is('.vote')) {
      
      if (confirm('Vote "' + name + '"?')) {
        addVote(id, function(err, body) {
          if (err) {
            showErr(null, null, err);
          } else {
            showInfo('Vote ' + name +' success');
            if(!$.isEmptyObject(eval(body))) {
              var vote = $.grep(votes, function (e) { return e.voteid == id; })[0];
              if(vote != undefined) {
                vote.voting.push(vote);
                showVotes();
              }
            }
          }
        });
      }
      
    }
  });
}
  
// setup handlebars templates
$('script[type="text/x-handlebars-template"]').each(function() {
  var name = this.id.replace(/-template$/, '');
  templates[name] = Handlebars.compile($(this).html());
});

$(window).on('hashchange', function(event){
  var view = (window.location.hash || '').replace(/^#/, '');
  if ($('#' + view + '-view').length) {
    showView(view);
  }
});

// get user data, proceed to list-bundles or welcome
$.ajax({
  url: '/api/user',
  accepts: 'application/json'
})
.then(function(data, status, xhr) {
  getVotes();
}, function(xhr, status, err) {
  showView('index');
});

// setup close button
$('.alert-danger .close').click(function(event) {
  $(event.target).closest('.alert-danger').hide();
});
$('.alert-info .close').click(function(event) {
  $(event.target).closest('.alert-info').hide();
});


})();

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
  
  getBundles = function() {
    $.ajax({
      url: '/api/vote/'
    })
    .then(function(data, status, xhr) {
      votes = data;
      showBundles();
    }, function(xhr, status, err) {
      if (xhr.status >= 500) {
        showErr(xhr, status, err);
      }
      votes = {};
      showBundles();
    });
  },
  
  saveBundles = function(bundles, callback) {
    $.ajax({
      type: 'PUT',
      url: '/api/user/bundles',
      data: JSON.stringify(votes),
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
  
  showView = function(selected) {
    window.location.hash = '#' + selected;
    $('.view').hide().filter('#' + selected + '-view').show();
  },
  
  showBundles = function() {
    showView('list-vote');
    $('.votes').html(templates['list-vote']({ votes: votes }));
  },
  
  showBundle = function(bundle) {
    showView('edit-bundle');
    $('#edit-bundle-view')
      .find('h2').data('id', bundle._id).end()
      .find('h2 span').text(bundle.name).end()
      .find('.bundle-books')
        .html(templates['list-books']({ books: bundle.books }));
  };

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
  getBundles();
}, function(xhr, status, err) {
  showView('index');
});

// field search results
$('.find-book').submit(function(event) {
  event.preventDefault();
  
  var
    $form = $(this),
    field = $form.find('[name="field"]').val(),
    q = $(this).find('.search').val();
  
  $.ajax({
    url: '/api/search/book/by_' + field + '?q=' + encodeURIComponent(q),
    accepts: 'application/json'
  })
  .then(function(data, status, xhr) {
    $('.books-results').html(templates['list-books']({ books: data }));
  }, showErr);
  
});

// bundle book list results
$('.bundle-books').click(function(event) {
  
  var
    $button = $(event.target).closest('button'),
    id,
    pgid,
    title;
  
  if (!$button.length) {
    return;
  }
  
  id = $button.closest('.view').find('h2').data('id');
  pgid = $button.closest('tr').data('id');
  title = $button.closest('tr').find('a').first().text();
  
  if (confirm('Remove "' + title + '"?')) {
    $.ajax({
      type: 'DELETE',
      url: '/api/bundle/' + id + '/book/' + pgid,
      accepts: 'application/json'
    })
    .then(function(resp, status, xhr) {
      return $.ajax({
        url: '/api/bundle/' + id,
        accepts: 'application/json'
      });
    })
    .then(showBundle, showErr);
  }
  
});

// book search results
$('.books-results').click(function(event) {
  
  var
    $button = $(event.target).closest('button'),
    id,
    pgid;
  
  if (!$button.length) {
    return;
  }
  
  id = $button.closest('.view').find('h2').data('id');
  pgid = $button.closest('tr').data('id');
  
  $.ajax({
    type: 'PUT',
    url: '/api/bundle/' + id + '/book/' + pgid,
    accepts: 'application/json'
  })
  .then(function(resp, status, xhr) {
    return $.ajax({
      url: '/api/bundle/' + id,
      accepts: 'application/json'
    });
  })
  .then(showBundle, showErr);
  
});

// setup close button
$('.alert-danger .close').click(function(event) {
  $(event.target).closest('.alert-danger').hide();
});

// edit bundle buttons
$('.bundles').click(function(event) {
  
  var
    $button = $(event.target).closest('button'),
    id,
    name;
  
  if (!$button.length) {
    return;
  }
  
  id = $button.closest('tr').data('id');
  name = $button.closest('tr').find('td').eq(0).text();
  
  if ($button.is('.delete')) {
    
    if (confirm('Delete "' + name + '"?')) {
      delete bundles[id];
      saveBundles(bundles, function(err, body) {
        if (err) {
          showErr(null, null, err);
        } else {
          showBundles();
        }
      });
    }
    
  } else {
    
    $.ajax({
      url: '/api/bundle/' + id,
      accepts: 'application/json'
    })
    .then(showBundle, showErr);
    
  }
  
});



})();

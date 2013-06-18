$(function() {
    
  $('#overlay').fadeIn('fast',function(){
    $('#box').animate({'top':'160px'},500);
  });

  $('#boxclose').click(function(){ // Overlay box close
      if(currentUser != "") {
        $('#box').animate({'top':'-200px'},500,function(){ $('#overlay').fadeOut('fast'); });
      } else {
        $.msgBox({
          title:  'No Username Chosen',
          content:'You must select a username first!'
        });
      }
  });

  $('#username').click(function() { // Overlay user selectection
    currentUser = this.value;
    if(currentUser != "") {
      $('#chosen-name').text(currentUser);
      $.msgBox({
        type   : 'info',  
        title  : 'Username chosen',
        content: 'Hello ' + currentUser + ' !'
      });
    }
    $('#boxclose').click();
  });
  
});

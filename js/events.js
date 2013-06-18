$(function() {
    
  $('#overlay').fadeIn('fast',function(){
    $('#box').animate({'top':'160px'},500);
  });

  $('#boxclose').click(function(){ // Overlay box close
      $('#box').animate({'top':'-200px'},500,function(){
          $('#overlay').fadeOut('fast');
      });
  });
  
  $('#username').click(function() { // Overlay user selectection
    currentUser = this.value;    
    $.msgBox({
      title:  'Username chosen',
      content:'Hello World! ' + currentUser
    });

  });
});

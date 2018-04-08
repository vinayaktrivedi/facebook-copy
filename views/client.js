$(document).ready(function(){
  $(".love").on('click',function(){
    var id = this.id;
    $.ajax({
        url: 'http://127.0.0.1:3000',
        // dataType: "jsonp",
        data: {'id':id},
        type: 'POST',
        dataType: 'html',
        cache: false,
        success: function (data) {
            document.getElementById('final').innerHTML=data;
            console.log(data);
        },
        error: function (xhr, status, error) {
            console.log('Error: ' + error.message);

        }
    });
  });
  $("#final").on('click',function(){
    document.getElementById('final').innerHTML='';
  });
  $(".loves").on('click',function(){
    var id = this.id;
    $.ajax({
        url: 'http://127.0.0.1:3000/friend',
        // dataType: "jsonp",
        data: {'id':id},
        type: 'POST',
        dataType: 'text/html',
        cache: false,
        success: function (data) {
            console.log(data);
        },
        error: function (xhr, status, error) {
            console.log('Error: ' + error.message);

        }
    });
  });
});

$(document).ready(function(){
  $("#friend").on('click','li',function(){
    var id=this.id;
    id=id.slice(0, id.length-2);
    $.ajax({
        url: 'http://127.0.0.1:3000',
        // dataType: "jsonp",
        data: {id:id}
        type: 'POST',
        jsonpCallback: 'callback', // this is not relevant to the POST anymore
        success: function (data) {
            var ret = jQuery.parseJSON(data);
            
            console.log('Success: ')
        },
        error: function (xhr, status, error) {
            console.log('Error: ' + error.message);

        },
    });
  });
});

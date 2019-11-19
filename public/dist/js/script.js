$('#addUser').on('click',()=>{

var data ={};
data._csrf     = $('meta[name="csrf-token"]').attr('content');
data.usertype  = $('#usertype').val();
data.firstname = $('#firstname').val();
data.lastname  = $('#lastname').val();
data.brandname = $('#brandname').val();
data.email     = $('#email').val();
data.password  = $('#password').val();
$.ajax({
  type        : 'post',
  data        : data,
  dataType    : 'json',
  url         : '/youshouldnotbehere/administrators/newUser',
  success     : function(data){
    if(!data.status){
    for(var key in data.errors){
        $('.'+key+'_err').text(data.errors[key]);
    
        
    }
}else{
    $('.firstname_err').text('');
    $('.lastname_err').text('');
    $('.brandname_err').text('');
    $('.email_err').text('');
    $('.password_err').text('');
    $('#firstname').val('');
    $('#lastname').val('');
    $('#email').val('');
    $('#password').val('');
    swal("User created successfully!", "", "success");
    }
  }
})

})
/*************************
 *  GENERARTE TICKET PIN
 *************************/
var delay =(()=>{
    var timer = 0;
    return (callback,ms)=>{
        clearTimeout(timer);
        timer = setTimeout(callback,ms);
    }
})();

var filter = $('#searchticket');
var event='';
filter.on('keyup',()=>{
    delay(()=>{
var data ={};
data._csrf     = $('meta[name="csrf-token"]').attr('content');
data.filter   = filter.val();

        $.ajax({
            type        : 'post',
            data        : data,
            dataType    : 'json',
            url         : '/youshouldnotbehere/administrators/filterticket',
            success     : function(data){
                if(!data.status){
                    $('#ft').html('<option disabled>'+data.msg+'</option')
                }else{
                    event = data.event;
                    $('#ft').html('<option id="popev">'+data.event.eventname+' &nbsp;&nbsp'+data.event.start_date+'&nbsp / &nbsp'+data.event.end_date+'</option')
                }
                
            }
        })

    },1000)
    
})

$('body').on('click','#popev',()=>{
    $('#uid').val(event._id);
    
})

$('#generateticket').on('click',()=>{
    var data ={};
data._csrf     = $('meta[name="csrf-token"]').attr('content');
data.uid   = $('#uid').val();
data.ttype   = $('#ttype').val();
data.lmt   = $('#lmt').val();

$.ajax({
    type        : 'post',
    data        : data,
    dataType    : 'json',
    url         : '/youshouldnotbehere/administrators/genticket',
    success     : function(data){
       if(data.status){
           swal("Tickets generated successfully!", "", "success");
        $('.uid_err').text('');
        $('.lmt_err').text('');
       }else{
        $('.uid_err').text(data.msg.uid);
        $('.lmt_err').text(data.msg.lmt);

       }  
    }
})

})
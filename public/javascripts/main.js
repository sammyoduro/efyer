$('#smt').on('click',()=>{
    ajaxindicatorstart('loading data.. please wait..');
   $.ajax({
  type        : 'post',
  data        : {rsm:$('#rsm').val(),_csrf:$('#lgn').val()},
  dataType    : 'json',
  url         : '/rst',
  success     : function(data){
if(!data.status){
    ajaxindicatorstop();
    $('#e_r').text(data.msg);
}else{
    ajaxindicatorstop();
    $('#exampleModal').modal('hide');
    swal(data.msg, "", "success");
    $('#rsm').val()="";
}
  
  }
})

})

$('#regusr').on('click',()=>{
    ajaxindicatorstart('loading data.. please wait..');
});

var tl = false;  
var ct = []
$('#generatepin').on('click',function() {
    ajaxindicatorstart('loading data.. please wait..');
// $('#generator').modal();
var input = document.getElementById('xlfile');
var validxst = new Array("xls","xlsx")
var xst = $('#xlfile').val().split('.').pop()
var valid = false;

cln_n();
xlexplode()
.then(data=>{

var smsmsg = document.getElementById('smsmsg');
for (let i = 0; i < validxst.length; i++) {if(validxst[i]== xst){valid = true}else{valid = false}}

if(input.value){
if(!smsmsg.value){
    ajaxindicatorstop();
$('.err_2').text('please provied a message')
}
else if(valid){
    if(data.status){
        var myxlList = [];
        var list = data.pinlist
    let promise = function (list,l,c,m) {
        
        
        return new Promise((resolve,reject)=>{
            readXlsxFile(input.files[0]).then((data) => {
                
                if(data.length == list.length){
                    var txt='<div class="text-center"><p class="text-primary">'+m+'</p></div><table id="live-ticket" class=\'table table-striped table-dark table-hover display\'><thead><tr><th>TICKETS</th><th>CONTACT</th></tr></thead>';
                    data.forEach((e,k) => { 
                        var _c = "";
                        ct.push(data[k][0]);
                        if(!cln_n(data[k][0])){
                             _c = "<span class='text-danger'> "+data[k][0]+" contact should be 10 digits</span>";
                        }else{
                             _c = data[k][0];
                        }
                        txt+='<tr><td>BTC'+list[k]+'BTC </td><td>'+_c+'</td></tr>';
                    }); 
                    ajaxindicatorstop();
                    $('#generatorTitle').html(' GENERATED TICKETS ( '+l+' ) <br> charge GHS '+c)
                    txt+='</table><div class="modal-footer" style="margin-top:30px"><a class="btn-solid-reg" data-dismiss="modal" style="cursor: pointer;">CLOSE</a><a class="btn-solid-reg" onclick="SubmitTicket()" style="cursor: pointer;">SAVE</a></div>';
                    $('#generator-tag').html(txt);
                    $('.err_l').text(''); 
                    $('#generator').modal();                
                }else{
                    ajaxindicatorstop();
                    $('#generator-tag').html('');
                    $('.err_l').text('generated ticket pins is not equal to contact list')
                    
                }
                
                
            })
        })
        
    }
    promise(data.pinlist,data.l,data.c,data.m);
    }else{
        ajaxindicatorstop();
        $('#generator-tag').html('');
        $('.err_l').text(data.errmsg)
}
}else{
  
    ajaxindicatorstop();
    $('#generator-tag').html('')
    $('.err_l').text('invalid excel file');
}

}else{
if(data.status){
    ajaxindicatorstop();
    tl = true;
    

var txt='<table id="live-ticket" class=\'table table-striped table-dark table-hover display\'><thead><tr><th>TICKETS</th><th>CONTACT</th></tr></thead>';
    data.pinlist.forEach(e => {                
        txt+='<tr><td>BTC'+e+'BTC </td><td>N/A</td></tr>';
    });
    $('#generatorTitle').html(' GENERATED TICKETS ( '+data.l +' ) <br> charge GHS '+data.c)
    txt+='</table><div class="modal-footer" style="margin-top:30px"><a class="btn-solid-reg" data-dismiss="modal" style="cursor: pointer;">CLOSE</a><a class="btn-solid-reg" onclick="SubmitTicket()" style="cursor: pointer;">SAVE</a></div>';
    $('#generator-tag').html(txt);
    $('#generator').modal(); 
    $('.err_l').text('');
    
}else{
    ajaxindicatorstop();
    $('#generator-tag').html('');
    $('.err_l').text(data.errmsg)
    
}
}
})
.catch(error=>{throw error})
})

function xlexplode() {
var pinlimit = $('#pinlimit').val();
var data = {limit:pinlimit,url:window.location.href}

return new Promise((resolve,reject)=>{
$.ajax({
type        : 'get',
data        : data,
dataType    : 'json',
url         : '/dashboard/genticketpins',
success     : function(data){         
resolve(data); 
},
error:(error)=>{
  reject(error)
},
})
})
}
function SubmitTicket() {
    
ajaxindicatorstart('Payment redirecting.. please wait..');
var input = {_csrf:$('meta[name="csrf-token"]').attr('content'),tl:tl,ct:ct,smsmsg:smsmsg.value,url:window.location.href}

$.ajax({
type        : 'post',
data        : input,
dataType    : 'json',
url         : '/dashboard/process/genticketpins',
success     : function(data){
    console.log(data);
if(data.status){
window.location.href = data.url
}
   
}
})

}
function cln_n(p) {
var regex = /^\d{10}$/;
return regex.test(p); 
}

var txt = 'loading... please wait..';
$('body').on('click','#generateqrcode',function () {
    
    
    ajaxindicatorstart(txt);
    $('#generator-tag').html('');
$('.tag').html('');
    var input = $('#qrlimit').val();
    var data = {limit:input,url:window.location.href}    
    $.ajax({
      type        : 'get',
      data        : data,
      dataType    : 'json',
      url         : '/dashboard/genqrcodes',
      success     : function(data){
        ajaxindicatorstop();
       
          $('#generatorTitle').html('Generating qrCodes please wait...')         
        if(data.status) {
            
            var txt='';
            data.qrcode.QRlist.forEach(element => {
                txt+='<img src="'+element+'" alt="generated qrcode" width="100" style="margin:1px">';
            });
            
            $('#generatorTitle').html(' GENERATED TICKETS ( '+data.qrcode.QRlist.length +' ) <br> charge GHS '+data.qrcode.c)
            txt+='<div class="modal-footer" style="margin-top:30px"><a class="btn-solid-reg" data-dismiss="modal" style="cursor: pointer;">CLOSE</a><a class="btn-solid-reg" href="/paymentAuth/confirmpayment" onclick="pop()">SAVE</a></div>';
            $('#generator-tag').html(txt);
            $('#generator').modal();
            $('.err_l').text('');
        }else{
            $('.lds-roller').removeClass('cup');
            window.setTimeout(()=>{$('#generator-tag').html(''); $('#generator').modal('hide')},1000)
            $('.err_l').text(data.errmsg)
        }
        
      }
      })
    
})

function pop(){
        ajaxindicatorstart(txt);
     
    // ajaxindicatorstart('Redirecting to payment page... please wait..'); 
}
function ajaxindicatorstart(text){
if(jQuery('body').find('#resultLoading').attr('id') != 'resultLoading'){
    jQuery('body').append('<div id="resultLoading" style="display:none"><div><img src="/images/ajax-loader.gif"><div>'+text+'</div></div><div class="bg"></div></div>');
}
jQuery('#resultLoading').css({
'width':'100%',
'height':'100%',
'position':'fixed',
'z-index':'10000000',
'top':'0',
'left':'0',
'right':'0',
'bottom':'0',
'margin':'auto'
});

jQuery('#resultLoading .bg').css({
'background':'#000000',
'opacity':'0.7',
'width':'100%',
'height':'100%',
'position':'absolute',
'top':'0'
});

jQuery('#resultLoading>div:first').css({
'width': '250px',
'height':'75px',
'text-align': 'center',
'position': 'fixed',
'top':'0',
'left':'0',
'right':'0',
'bottom':'0',
'margin':'auto',
'font-size':'16px',
'z-index':'10',
'color':'#ffffff'
});

jQuery('#resultLoading .bg').height('100%');
jQuery('#resultLoading').fadeIn(300);
jQuery('body').css('cursor', 'wait');
}
function ajaxindicatorstop()
{
jQuery('#resultLoading .bg').height('100%');
jQuery('#resultLoading').fadeOut(300);
jQuery('body').css('cursor', 'default');
}
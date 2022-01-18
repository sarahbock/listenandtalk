

//GENERAL

var language="hungarian"; if(getQueryVariable("lang")){language=getQueryVariable("lang");}
//var language="hungarian";
var translation="english"; if(getQueryVariable("translation")){translation=getQueryVariable("translation");}
var versionNo="1.0.0";

var languageCap = language.toLowerCase().replace(/\b[a-z]/g, function(letter) { return letter.toUpperCase();}); //capitalises first letter of each word in string
var languageHeader = "Language";
if (language==="hungarian" ||language==="german" ||language==="ktunaxa" ||language==="chinese" ||language==="mangarrayi"){ languageHeader=languageCap; }
var translationCap = translation.toLowerCase().replace(/\b[a-z]/g, function(letter) { return letter.toUpperCase();}); //capitalises first letter of each word in string


var startscreen="launch"; //var startscreen="launch"; //for testing web version
var startpage="dashboard"; //which page to go to after launch?
var web=true;

var web_dir="https://elearnaustralia.com.au/opal/";
var apiPath=web_dir+"readandwrite/";
var languageCol="language";
var translationCol="translation";
var topicCol="topic";
var translationColsoundfilename="translationsoundfilename";
var keywordTranslationCol="keywordtranslation";
var translateNoText="No";
var translateYesText="Yes";
var appTitleShort=languageCap+" Listen and Talk";
var appTitleLong=languageCap+" Listen and Talk";
var projectInfo="<p>Information about this project.</p>";


var currentpage=""; var referrer="dashboard"; //which page to go back to?
var selectedlang="English"; var selectedAudio=0;  var selectedN=1; var selectedTopic=1; var selectedSubTopic=1; var selectedFilter;
var token="";

var selectedEntry=1;
var initialEntry=0; var initialConv=false;
if(getQueryVariable("id")){    initialEntry=getQueryVariable("id"); }
if(getQueryVariable("conv")){    initialConv=getQueryVariable("conv"); }


var audiopath=web_dir+language+"/mp3/"; //mp3 folder is inside edit activityFeedbackHolder
var audiopathServer=web_dir+language+"/mp3/"; //server folder if no local mp3 files found

var audioError=0;
var playbackspeed=1;
var imagepath=web_dir+language+"/img/";
var speakers=[]; var topics=[]; var conversations=[]; var favourites=[]; var chunkbank=[]; var chunkbankSorted=[]; var chunkbankSortedLength=[]; var chunkbankFlags=[]; var entryConversation=[];
var initialActivityWordLength=20;//maximum length of words for intial set up of Have a go activity
var maxMemoryWordLength=200;//maximum length of words memory activity

//backwards compatibility for mangarrayi app
if (language==="mangarrayi"){
    $("#launch .launchlogo").attr("src", "images/logo_jcac.png");
    audiopath="mp3/"; //mp3 and image folder is inside app folder
    imagepath="https://elearnaustralia.com.au/mangarrayi/img/";
    audiopathServer="https://elearnaustralia.com.au/mangarrayi/mp3/";
    translationColsoundfilename="kriolsoundfilename";//name of audio translation column in DB table
    translationCol="english";//name of translation column in DB
    keywordTranslationCol="keywordenglish";
    languageCol="mangarrayi"; //name of language column in DB
    topicCol="subtopic"; //name of topic column in DB
    apiPath="https://www.elearnaustralia.com.au/mangarrayi/api/"; //hardcoded path to API and web files
    web_dir="https://elearnaustralia.com.au/mangarrayi/";
    startpage="warning";//go to warning and token screens on startup
    translateNoText="dayi"; //text for yes and no buttons in language
    translateYesText="yowo";
    versionNo="2.3.4";
    appTitleShort="Warrma Mangarrayi";
    appTitleLong="Warrma Mangarrayi (Listen to Mangarrayi)";
    projectInfo='<p class="leftText">Are you interested in learning Mangarrayi? This app is to help community members learn some phrases in your own language.</p><p class="leftText">We acknowledge the Mangarrayi speakers whose voices appear in this app: <strong>Sheila Yanybarrak Conway, Jesse Garalnganyjak Roberts, Amy Dirn.gayg.</strong></p><p class="leftText">This app has been co-designed by the Jilkminggan Community with Western Sydney University and Elearn Australia.</p><a href="http://www.jcac.com.au/" target="_blank"><img src="images/logo_jcac.png" alt="Jilkminggan Community Aboriginal Corporation logo" class="aboutLogo"></a><p class="leftText">Funding from: Australian Research Council Centre of Excellence for the Dynamics of Language</p><a href="https://www.westernsydney.edu.au/" target="_blank"><img src="images/logo_wsu.png" alt="Western Sydney University logo" class="aboutLogo rectLogo"></a><a href="https://www.dynamicsoflanguage.edu.au/" target="_blank"><img src="images/logo_arc.png" alt="ARC Centre of Excellence for the Dynamics of Language" class="aboutLogo rectLogo"></a><a href="https://www.elearnaustralia.com.au" target="_blank"><img src="images/logo_ela.png" alt="Elearn Australia" class="aboutLogo rectLogo"></a><p>&nbsp;</p>';
    maxMemoryWordLength=50;
}



//=========================================================================================================================== SHOW STUFF

function showPage(page){
    "use strict";
    console.log("============SHOW PAGE "+page+". Referred by: "+referrer);
    currentpage=page;
    $(".screen, .popup, #camera, #alert").css("display","none");
    if (page==="launch"){
        $("#"+page).css("display","flex");
        setTimeout(function() {
            $("#"+page).fadeOut("slow", function() {$("#"+startpage).fadeIn("slow", function() {});});
        }, 500);
    } else if(page==="categorylist" || page==="fulllist") {
       showPopup("loading"); $(".entries").css("display","none");  $("#"+page).css("display", "block");  $(".entries").delay(10).fadeIn(10, function() {hidePopup();});
    } else{
        $("#"+page).css("display", "block");
    }
  if(page==="entry"){//language entry screen
    //show back button
    $(".menuButton img").attr("src","images/icon_left.png");
    audioOff(); $(".playAllAudioIcon").attr("src","images/icon_play_white.png");
  } else if(page==="activity" && $("#activityStart").css("display")==="none"){//activity screen active
    $(".menuButton img").attr("src","images/icon_left.png");
  } else {
    $(".menuButton img").attr("src","images/icon_menu.png");//show menu button again
  }
}

function showPopup(page){"use strict"; $("#"+page).css("display","flex"); }
function hidePopup(){"use strict"; $("#confirm, .popup, #share, #loading").css("display","none");}
function hideAlert(){"use strict"; $("#alert").css("display","none");}
function hideSearch(){"use strict";$("#headerSearchResult").css("display","none"); $(".headerCentre img").css("visibility", "hidden");}
function showAlert(message){"use strict"; $("#alertText").html(message); $("#alert").css("display","block");}




//=========================================================================================================================== GET DATA


function getDictionary(){
    "use strict";

    //$.getJSON(apiPath+"get-topics.php", function(data) {if (data!==0) {topics=data; setupTopics();}});
    console.log(apiPath+"get-language.php?table="+language);
     var getURL=apiPath+"get-language.php?table="+language; if (language==="mangarrayi"){getURL=apiPath+"get-mangarrayi.php";}
    $.getJSON(getURL, function(data) {if (data!==0) {chunkbank=data; }})
    .done(function() {
    //console.log("Dictionary: "+JSON.stringify(chunkbank));
    initialiseDictionary();
    })
    .fail(function() {console.log("Updated dictionary data could not be retrieved."); initialiseDictionary();});
}

function getConversations(){
    "use strict";
    var getURL=apiPath+"get-conversations.php?table="+language; if (language==="mangarrayi"){getURL=apiPath+"get-mangarrayi-conversations.php";}
  $.getJSON(getURL, function(data) {if (data!==0) {conversations=data; }})
    .done(function() {
        //console.log("Conversations: "+JSON.stringify(conversations));
    })
    .fail(function() {console.log("Updated conversations could not be retrieved."); });
}

function initialiseDictionary(){
    "use strict";
  console.log("============INITIALISE DICTIONARY ");
    var preloadHTML="<img src=\"images/audio_on.png\" alt=\"\"><img src=\"images/audio_off.png\" alt=\"\">";

    for (var a=0; a<chunkbank.length; a++){
        if (chunkbank[a].image!==""&&chunkbank[a].image!==null){
            preloadHTML+="<img id=\"preloadImage"+a+"\" src=\""+imagepath+""+chunkbank[a].image+"\" alt=\"\" width=\"0\" height=\"0\">";
        }//preload images
    if (chunkbank[a][translationCol]===null){chunkbank[a][translationCol]="";}
        if (chunkbank[a][languageCol]===null){chunkbank[a][languageCol]="";}
    //capitalise first letter of English
    if (chunkbank[a][translationCol]!==""){ chunkbank[a][translationCol]= chunkbank[a][translationCol].substr(0,1).toUpperCase()+chunkbank[a][translationCol].substr(1); }
    //set glossing
        //var watch="33";
        //if(chunkbank[a].id===watch){console.log("pre glossing "+chunkbank[a].mangarrayi);}
        chunkbank[a].glossing=setGlossing(chunkbank[a][languageCol]);
        chunkbank[a].explanation=setGlossing(chunkbank[a].explanation);
        //if(chunkbank[a].id===watch){console.log("with glossing "+chunkbank[a].glossing);}
        chunkbank[a][languageCol]=removeGlossing(chunkbank[a][languageCol]);
        //if(chunkbank[a].id===watch){console.log("without glossing "+chunkbank[a].mangarrayi);}
        //remove any entries that have null for both languages
        //if (chunkbank[a].english==="" && chunkbank[a].mangarrayi===""){chunkbank=chunkbank.splice(a,1);}
    }
    chunkbankSorted = [...chunkbank].sort((a,b) => (a[translationCol] > b[translationCol]) ? 1 : ((b[translationCol] > a[translationCol]) ? -1 : 0));//sort in A-Z order of english
    chunkbankSortedLength=[...chunkbank].sort((a,b) => (a[translationCol].length > b[translationCol].length) ? 1 : ((b[translationCol].length > a[translationCol].length) ? -1 : 0));//sort by length of english
    getData();
    $(".preloadContainer").html(preloadHTML);
    //if(localStorage.getItem("mang-lang")===null){  showPage(startscreen);  } else {showPage("dashboard");}

    if(parseInt(initialEntry)!==0){
        //if there is an id set in the URL then go straight to that id.
        setTimeout(function(){setEntry(initialEntry); showPage('entry'); if(initialConv==="true"){toggleConversation();}},500);
    } else {
        //otherwise go to default start screen
        showPage(startscreen);
    }

    if (localStorage.getItem(language+"-favourites")){favourites=JSON.parse(localStorage.getItem(language+"-favourites"));}
}

function setGlossing(str){
    "use strict";
    var newstr=""; var tag=""; var colour="";var startBracket=0; var lastDash=0; if(str===null){str="";}
    str=str.trim(); //e.g. dayi<col6> worlorr<col1> ga-<col2>nga-<col7>ma<col1> durdurla
    //check if chunk has been edited with editor - does it contain old mark up?
    var oldMarkUp=false;
    if (str.indexOf('<col')!==-1){ oldMarkUp=true;}
    if (oldMarkUp==false){
        //if there is no old mark up then don't do anything to the string
        newstr=str;
    } else {
        //if there is old mark up then reformat old mark up to HTML glossing
        var spacedChunks=str.split(" "); //start by separating string into chunks (by blank spaces)
        for (var a=0; a<spacedChunks.length; a++){//go through each of the chunks
            startBracket=spacedChunks[a].indexOf('<col');//check if chunk has glossing
            if (startBracket===-1){//chunk doesn't have any glossing
                newstr+=spacedChunks[a]+" ";
            } else{ //chunk has glossing
                //break chunk into array separated by >
                var subChunks=spacedChunks[a].split(">"); //sub chunks are glossed chunks within a spaced chunk (no blank space to separate them)
                for (var c=0; c<subChunks.length; c++){
                    if (subChunks[c].trim()!==""){//don't deal with empty chunks
                        startBracket=subChunks[c].indexOf('<col');
                        if (startBracket===-1){//chunk doesn't have any glossing
                            newstr+=subChunks[c];
                        } else{ //chunk has glossing
                            subChunks[c]+=">";
                            startBracket=subChunks[c].indexOf('<col');
                            tag=""; tag=subChunks[c].substring(startBracket,(subChunks[c].length-1)); //e.g. <col6>
                            colour=tag.substring(4,tag.length);//get colour
                            var glossString=removeGlossing(subChunks[c]);//remove the glossing from the core
                            lastDash=subChunks[c].lastIndexOf('-'); //see if there's a dash in the chunk
                            if (lastDash===startBracket-1){lastDash=-1;}//ignore the dash if it's right next to the chunk
                            if (lastDash!==-1){
                                //if there's a dash this means that the glossed word will start at the last dash not at the start of the array element
                                newstr+=glossString.substring(0,lastDash)+'<span class="colour'+colour+'">'+glossString.substr(lastDash)+'</span>';
                            } else {
                                newstr+='<span class="colour'+colour+'">'+glossString+'</span>';
                            }
                            //newstr+=subChunks[c]+'('+colour+") ";
                        }
                    }
                }
                newstr+=" "; //add space after array of spaced chunks
            }
        }
    }
    return newstr;
}

function removeGlossing(str){
    "use strict";
    if(str===null){str="";}
    str=str.replace(/<col[0-9]*>/g,'');
    str=stripHTML(str);
    return str;
}

function stripHTML(html){//strip HTML tags from string
    var temporalDivElement = document.createElement("div");
    temporalDivElement.innerHTML = html;
    return temporalDivElement.textContent || temporalDivElement.innerText || "";
}



function getData(){
    "use strict";
    //this function is called when dictionary is initialised or when language is changed
    console.log("============GET DATA ");

    //create full list
        var listHTML="";
    for (var a=0; a<chunkbankSorted.length; a++){ //chunkbankSorted is in A-Z order of english text
    if(chunkbankSorted[a].id!=="0" && chunkbankSorted[a][languageCol]!==""){
            listHTML+='<div class="entry"><div class="entryEnglish" onclick="setEntry(\''+chunkbankSorted[a].id+'\'); showPage(\'entry\');">'+ chunkbankSorted[a][translationCol]+'</div> <div class="entryMangarrayi audioButtonDiv active" id="fulllistaudio_'+chunkbankSorted[a].id+'" onclick="toggleAudio(\'fulllistaudio_'+chunkbankSorted[a].id+'\');"><img src="images/audio_on.png" alt="play" title="Play" class="audioIcon">'+chunkbankSorted[a][languageCol]+'</div> <div class="entryGo active" onclick="setEntry(\''+chunkbankSorted[a].id+'\');showPage(\'entry\');"><img src="images/icon_right.png" alt="arrow right"></div><div class="clearBoth"> </div> </div>';
        }
    }
    $("#fulllist .entries").html(listHTML);

    //create filter list (english key word as default)
        var filterSelectStr='';
        filterSelectStr+='<option value="keyword'+translationCol+'">Keywords ('+translationCap+')</option>';
        filterSelectStr+='<option value="keyword">Keywords ('+languageHeader+')</option>';
        filterSelectStr+='<option value="class">Words or phrases</option>';
        filterSelectStr+='<option value="function">Language function</option>';
        filterSelectStr+='<option value="keywordling">Linguistic keyword</option>';
        $("#filterEntries").html(filterSelectStr);

        selectedFilter="keyword"+translationCol;
        // selectedFilter="function";
        loadFilterEntries();

    loadFavourites();


}


function setEntry(x){
    "use strict";
    selectedEntry=parseInt(x);
  console.log("============SET ENTRY "+selectedEntry);

    //show conversation if convo button on
    if($("#entryOption5 img").hasClass("colourOn")){
        $(".conventry").css("display","none"); $("#entryOption5 img").removeClass("colourOn").addClass("colourOff");
    }
    //hide microphone entry
  $("#entry .mikeentry").css("display","none"); $("#entryOption6 img").removeClass("colourOn").addClass("colourOff");

    //get right id from dictionary
    var n=0; for (var a=0; a<chunkbank.length; a++){if(chunkbank[a].id === x.toString()){n = a; selectedN=n;}}
    console.log(JSON.stringify(chunkbank[n]));

    //set up page
    var st='<div class="entry" id="entryaudio_'+chunkbank[n].id+'">';
  st+='<div class="entryEnglish"><div class="entryEnglishText">'+chunkbank[n][translationCol];
    st+='</div>';
    //show translation audio if available
    if (chunkbank[n][translationColsoundfilename]!==""){
        st+='<div class="entryKriol active" id="kriolAudio" onclick="toggleKriolAudio(\''+chunkbank[n][translationColsoundfilename]+'\');"><img src="images/audio_on.png" alt="play" title="Play" class="audioIcon"></div>';
    }
    st+='</div>';//end entryEnglish
  st+='<div class="entryMangarrayi">';
  st+='<div class="entryOption" id="entryOption4" onclick="toggleInfo();">';
  st+='<img src="images/icon_info.png" alt="info" title="Show glossing" class="infoIcon colourOff">';
  st+='</div>';
    st+='<div class="entryNormal"><div class="entryMangarrayiText"><div class="entryProgress">'+chunkbank[n][languageCol]+'</div></div></div>';
    st+='<div class="entryGlossing">';
    st+='<div class="entryMangarrayiText"><div class="entryProgress">'+chunkbank[n].glossing+'</div></div>';
    st+='<div class="entryExplanationText">'+chunkbank[n].explanation+'</div>';
    st+='</div>';
    st+='<div class="entryOptions">';
    st+='<div class="entryOption" id="entryOption1" onclick="toggleStar(\''+chunkbank[n].id+'\');">';
    //has it been favourited?
    var favouriteClass="colourOff";  if ($.inArray(chunkbank[n].id,favourites)!==-1){favouriteClass="colourOn"; }
    st+='<img src="images/icon_star.png" alt="star" title="Add to favourites" class="starIcon '+favouriteClass+'">';
    st+='</div>';
    st+='<div class="entryOption" id="entryOption2" onclick="toggleSlow(\''+chunkbank[n].id+'\');">';
    var slowClass="colourOff"; if (playbackspeed!==1){slowClass="colourOn";}
    st+='<img src="images/icon_turtle.png" alt="turtle" title="Slow down audio" class="slowIcon '+slowClass+'">';
    st+='</div>';
    st+='<div class="entryOption" id="entryOption3" onclick="toggleEntryAudio(\''+chunkbank[n].id+'\');">';
    st+='<img src="images/icon_play.png" alt="play" title="Play/Pause" class="playIcon colourOff">';
    st+='</div>';
    st+='<div class="entryOption" id="entryOption5" onclick="toggleConversation();">';
    st+='<img src="images/icon_chat.png" alt="chat" title="Suggested conversation" class="chatIcon colourOff">';
    st+='</div>';
    st+='<div class="entryOption" id="entryOption6" onclick="toggleMike();">';
    st+='<img src="images/icon_mike.png" alt="mike" title="Open microphone" class="slowIcon colourOff">';
    st+='</div>';
    st+='<div class="clearBoth"></div>';
    st+='</div>';
    st+='</div>';
    st+='</div>';
    st+='<div class="clearBoth"></div>';
    $("#dictionaryentry").html(st);

    //set up conversations screen
    var cstr=""; var match=0; var needle=selectedEntry.toString(); entryConversation=[];
    conversations.forEach((item, i) => {
        if (needle===item.entry1||needle===item.entry2||needle===item.entry3|| needle===item.entry4||needle===item.entry5||needle===item.entry6){ match=i+1; }
    });
    if (match!==0){
        for (var c=0; c<6; c++){//number of conversation parts
            var entryid=conversations[match-1]["entry"+(c+1)];
            if (entryid!=="0"&&entryid!=="0"){
                entryConversation.push(entryid);
                var cid = chunkbank.findIndex(chunk=>chunk.id===entryid);//get the phrase's index in the chunkbank array
                //console.log("conversation x "+x+" c "+cid+" chunkbank[n].id "+chunkbank[n].id+" chunkbank[cid].id "+chunkbank[cid].id);
                if (cid!==-1){
                  var boldClass=""; if(chunkbank[n].id===chunkbank[cid].id){boldClass=' boldClass';}
                  cstr+='<div class="entry"><div class="entryEnglish'+boldClass+'" onclick="referrer=\'convolist\'; setEntry(\''+chunkbank[cid].id+'\'); showPage(\'entry\');">'+chunkbank[cid][translationCol]+'</div><div class="entryMangarrayi audioButtonDiv active" id="conversaaudio_'+chunkbank[cid].id+'" onclick="toggleAudio(\'conversaaudio_'+chunkbank[cid].id+'\');"><img src="images/audio_on.png" alt="play" title="Play" class="audioIcon">'+chunkbank[cid][languageCol]+'</div><div class="entryGo active" onclick="referrer=\'convolist\'; setEntry(\''+chunkbank[cid].id+'\'); showPage(\'entry\');"><img src="images/icon_right.png" alt="arrow right"></div><div class="clearBoth"></div></div>';
                }
            }
        }
    }
    if(language==="mangarrayi"){$(".coventryHeader").html("Having a yarn");}
    if (cstr===""){
      cstr="<p class='textLeft paddedContent note'>Nothing set for this</p><p>&nbsp;</p>";
      $("#conversationentry .playAllButtonHolder").css("display","none");
    } else {
      $("#conversationentry .playAllButtonHolder").css("display","flex");
    }
    $("#conversation").html(cstr);

    //show image if available
    var istr='';
    if (chunkbank[n].image!==""){
      if (chunkbank[n].notes!=="" && chunkbank[n].notes!==null){
        istr+='<div id="creditsentry">'+chunkbank[n].notes+'</div>';
      }
      istr+='<img src="'+imagepath+chunkbank[n].image+'" alt="">';
    }
    if (language==="mangarrayi" && istr===""){
        istr='<p class="textLeft note paddedContent">No photo! You can <a href="https://forms.gle/HQuPKzKEvY4mHEzC8" target="_blank">send in a photo</a> if you have a good one.';
    }

    $("#imageentry").html(istr);

    var istr="";
    if (chunkbank[n].info!=="" && chunkbank[n].info!==null){
      istr=chunkbank[n].info;
    }
    $("#infoentry").html(istr);

}


function toggleHide(x){
    //console.log("TOGGLE HIDE");
    if($("#hideIcon img").hasClass("colourOff")){
            //hide phrase from activity
            showAlert("<p>We won't show this phrase again.</p> ");
            $("#hideIcon img").removeClass("colourOff").addClass("colourOn");
      
    } else{
      //remove hide
      $("#hideIcon img").removeClass("colourOn").addClass("colourOff");
    }
}

function toggleMute(){
    //console.log("TOGGLE MUTE");
    if($("#muteIcon img").attr("src")===("images/icon_mute.png")){
            //mute feedback
            audioOff();
            $("#muteIcon img").attr("src", "images/icon_unmute.png");
    } else{
      //unmute feedback
      $("#muteIcon img").attr("src", "images/icon_mute.png");
    }
}

function toggleStar(x){
    "use strict";
    console.log("TOGGLE STAR");
    //var n=-1; for (var a=0; a<chunkbank.length; a++){if(chunkbank[a].id === x.toString()){n = a;}} if (n===-1){return;}
    if($("#entryOption1 img").hasClass("colourOff")){
        //star entry
        //chunkbank[n].star=1;
        if ($.inArray(x,favourites)===-1){favourites.push(x);}
        $("#entryOption1 img").removeClass("colourOff").addClass("colourOn");
        
    } else{
        //remove starred entry
        for (var f=0; f<favourites.length; f++){if (favourites[f]===x){favourites.splice(f, 1); f--;}}
        $("#entryOption1 img").removeClass("colourOn").addClass("colourOff");
    }
    //save favourites to local storage
    localStorage.setItem(language+"-favourites", JSON.stringify(favourites));
}

function toggleSlow(x){
    "use strict";
    if($("#entryOption2 img").hasClass("colourOff")){
        //show slow
        playbackspeed=0.7;
        $("#entryOption2 img").removeClass("colourOff").addClass("colourOn");
    } else{
        //hide slow
        playbackspeed=1;
        $("#entryOption2 img").removeClass("colourOn").addClass("colourOff");
    }
    //restart audio if already playing
    if ($("#entryOption3 img").attr("src")==="images/icon_pause.png") {
        var n=-1; for (var a=0; a<chunkbank.length; a++){if(chunkbank[a].id === x.toString()){n = a;}} if (n===-1){return;}
        var filename=chunkbank[n].soundfilename;
        //filename+=".mp3";
        playAudio(filename);
    }
}


function toggleEntryAudio(x){
    "use strict";
    selectedAudio=x;
    var n=-1; for (var a=0; a<chunkbank.length; a++){if(chunkbank[a].id === x.toString()){n = a;}} if (n===-1){return;}
    if ($("#entryOption3 img").attr("src")==="images/icon_play.png") {
        //play audio
        var filename=chunkbank[n].soundfilename;
        //filename+=".mp3";
        $("#kriolAudio .audioIcon").attr("src","images/audio_on.png");
        $(".iconHeadphones").attr("src", "images/icon_headphones.png");
    showEntryAudioPlayButton();
        playAudio(filename);
    } else {
        hideAudioPlayButtons();
        audioOff();
    }
}

function hideAudioPlayButtons(){
    "use strict";
    $("#entryOption3 img, #activityEntryPlayOption2 img").attr("src","images/icon_play.png");
    $("#entryOption3 img, #activityEntryPlayOption2 img").removeClass("colourOn").addClass("colourOff");
    $(".entryProgress").css("background-size", "0");
}
function showEntryAudioPlayButton(){
    "use strict";
    $("#entryOption3 img").attr("src","images/icon_pause.png");
    $("#entryOption3 img").removeClass("colourOff").addClass("colourOn");
}



function toggleInfo(){
    "use strict";
    if($("#entryOption4 img").hasClass("colourOff")){
        //show glossing
         $(".entryNormal").css("display", "none");
         $(".entryGlossing, #creditsentry").fadeIn();
         if ($("#infoentry").html()!==""){$("#infoentry").fadeIn();}
        //hide convo if showing
         //if($("#entryOption5 img").hasClass("colourOn")){ $(".conventry").css("display","none");  $("#entryOption5 img").removeClass("colourOn").addClass("colourOff");}
        $("#entryOption4 img").removeClass("colourOff").addClass("colourOn");
       
    } else{
        //hide glossing
        $(".entryGlossing, #infoentry, #creditsentry").css("display", "none"); $(".entryNormal").fadeIn();
        $("#entryOption4 img").removeClass("colourOn").addClass("colourOff");
    }
}

function toggleConversation(){
    "use strict";
    if($("#entryOption5 img").hasClass("colourOff")){
        //show conversation
        $(".conventry").slideDown();
        //hide mike if showing
        if($("#entryOption6 img").hasClass("colourOn")){ $("#entry .mikeentry").css("display","none");  $("#entryOption6 img").removeClass("colourOn").addClass("colourOff");}
        $("#entryOption5 img").removeClass("colourOff").addClass("colourOn");
       
    } else{
        //hide conversation
        $(".conventry").css("display","none");
        $("#entryOption5 img").removeClass("colourOn").addClass("colourOff");
    }
}



function checkToken(){
    "use strict";
    token=cleanUp($("#token input").val());
    if(token==="test"){
        showPage("dashboard");
         
        return false;
    }
    $.get("https://www.elearnaustralia.com.au/mangarrayi/api/check-token.php?token="+token, function(data) {
        if (data.indexOf(1)!==-1){
            audioOff();
            localStorage.setItem("mang-token", token);
            showPage("dashboard");
           
        } else {
            alert("Token is not right or has already been used");
        }
     });
}


 function cleanUp(str){
    "use strict";
    var value = str.replace(/[^ +-/(/)<>_*{}=:;@$%^&*.,|?!"'a-zA-Z0-9[u00E0-u00FF]]/g, '');
    value = str.replace(/[+]/g, '%2B'); //The plus is reserved in PHP so must be submitted to PHP as the encoded value: %2B
    return value;
}


//=========================================================================================================================== SEARCH

function searchDictionary(word){
    "use strict";

    var resultHTML="";
    var results=[]; var resultEnglish=""; var resultMang="";
    var count=0; var limit=1000;//limit number of search results

    var needle = word.replace(/-/g, '').trim().toLowerCase(); //remove dashes
    console.log("============SEARCH: "+needle);
    var length=needle.length;
    var haystack;



    //search start of mangarray words (to cater for n, ny, nya- etc)
    for (var f=0; f<chunkbank.length; f++){
        if (count<limit){
            haystack=chunkbank[f][languageCol].toLowerCase().replace(/-/g, ''); haystack=haystack.substring(0,length);
            if (haystack.indexOf(needle)!==-1){
                //console.log(haystack);
                if ($.inArray(f,results)===-1){results.push(f);count++;}//push into results if not already in results
            }
        }
    }

    //search anywhere in mangarray words
    for (var k=0; k<chunkbank.length; k++){
        if (count<limit){
            haystack=chunkbank[k][languageCol].toLowerCase().replace(/-/g, '');
            if (haystack.indexOf(needle)!==-1){
                //console.log(haystack);
                if ($.inArray(k,results)===-1){results.push(k);count++;}//push into results if not already in results
            }
        }
    }

    //then search english
    for (var d=0; d<chunkbank.length; d++){
        if (count<limit){
            haystack = chunkbank[d][translationCol].toLowerCase().replace(/-/g, ''); //haystack=haystack.substring(0,length);
            //if (chunkbank[d].id==="137"){console.log("Tag: "+haystack+" Needle: "+needle);}
            if (haystack.indexOf(needle)!==-1){
                if ($.inArray(d,results)===-1){results.push(d);count++;}//push into results if not already in results
            }
        }
    }


    //search keyword mangarray
    for (var e=0; e<chunkbank.length; e++){
        if (count<limit && chunkbank[e].keyword!==null){
            var keywordarray=chunkbank[e].keyword.split(",");
            for (var km=0; km<keywordarray.length; km++){//array of separate keywords for each entry
                haystack=keywordarray[km].toLowerCase().replace(/-/g, '').trim(); //keyword to lower case and trim
                haystack=haystack.substring(0,length);
                if (needle===haystack){ if ($.inArray(e,results)===-1){ results.push(e); count++; } }
            }
        }
    }
    //search keyword english
    for (var g=0; g<chunkbank.length; g++){
        if (count<limit && chunkbank[g][keywordTranslationCol]!==null){
            var keywordengarray=chunkbank[g][keywordTranslationCol].split(",");
            for (var ke=0; ke<keywordengarray.length; ke++){//array of separate keywords for each entry
                haystack=keywordengarray[ke].toLowerCase().replace(/-/g, '').trim(); //keyword to lower case and trim
                haystack=haystack.substring(0,length);
                if (needle===haystack){ if ($.inArray(g,results)===-1){ results.push(g); count++; } }
            }
        }
    }
//search tags
    for (var t=0; t<chunkbank.length; t++){
        if (count<limit  && chunkbank[t].tags!==null){
            var tagarray=chunkbank[t].tags.split(",");
            for (var tt=0; tt<tagarray.length; tt++){//array of separate tags for each entry
                haystack=tagarray[tt].toLowerCase().replace(/-/g, '').trim(); //keyword to lower case and trim
                //if (chunkbank[t].id==="2"){console.log("Tag: "+haystack+" Needle: "+needle);}
                haystack=haystack.substring(0,length);
                if (needle===haystack){ if ($.inArray(t,results)===-1){ results.push(t); count++; } }
            }
        }
    }

    if (count>0){
        for (var r=0; r<results.length; r++){
            var a=parseInt(results[r]);
            //console.log("============SEARCH: "+r+" needle: "+word+" haystack: "+haystack);
            //clean up haystacks
            var english=chunkbank[a][translationCol]; resultEnglish=english; var englishHaystack=english.toLowerCase().replace(/-/g, '');
            var mangarray=chunkbank[a][languageCol]; resultMang=mangarray; var mangarrayHaystack=mangarray.toLowerCase().replace(/-/g, '');

            //can we find search terms in the mangarray word?
            var yolS=mangarrayHaystack.indexOf(needle);
            if (yolS!==-1){ //make the search phrase bold if it's in the mangarray word
                resultMang=mangarrayHaystack.substr(0,yolS)+"<strong>"+needle+"</strong>"+mangarrayHaystack.substring((yolS+length));
            }

            var engS=englishHaystack.indexOf(needle);
            if (engS!==-1){ //make the search phrase bold if it's in the English word
                //if (engS===0){boldNeedle = needle.charAt(0).toUpperCase() + needle.slice(1);}
                resultEnglish=englishHaystack.substr(0,engS)+"<strong>"+needle+"</strong>"+englishHaystack.substring((engS+length));
            }
            //if (resultEnglish.length>30){resultEnglish=resultEnglish.substring(0,30)+"...";} //this breaks it because <strong> isn't always closed
            resultHTML+='<div class="entry searchresult active" onclick="showSearchResult('+chunkbank[a].id+');"><div class="entryEnglish">'+resultEnglish+'</div><div class="entryMangarrayi">'+resultMang+'</div><div class="clearBoth"></div></div>';
        }
    }


    if (resultHTML===""){resultHTML='<p class="centred">No matches found. Try using a different word.</p>';}
    $("#searchresults").html(resultHTML);
    $("#headerSearchResult").css("display","block");
    $(".headerCentre img").css("visibility", "visible");
}

function showSearchResult(id){
    "use strict";
    setEntry(id);
    showPage('entry');
    hideSearch();
}
//=========================================================================================================================== LIST TOPICS

function setupTopics(){
    var str="";
    for (var t=0; t<topics.length; t++){
        str+='<div class="topicDivContainer" id="topicContainer'+(t+1)+'" onclick="showSubTopics(\''+(t+1)+'\');"><div class="topicDivHolder">';
                var iconImage="icon_topic.png"; if (language==="mangarrayi"){ iconImage='icon_topic'+(t+1)+'.png?v=3';}
                str+='<img src="images/'+iconImage+'" alt="">';
                str+='<div class="topicDiv">'+topics[t].title+'</div></div></div>';
    }
    $("#topicsContainer").html('<div class="topicsFlexContainer">'+str+'</div>');
    if (language==="mangarrayi"){
      $("#topicsContainer").append('<a class="storiesContainer" href="https://www.jcac.com.au/library" target="_blank"><img src="images/icon_stories.png" alt="">Stories</a>');
    }
}

function showTopics(){
    selectedSubTopic=1;
    console.log("showTopics selectedTopic: "+selectedTopic+" selectedSubTopic: "+selectedSubTopic);
    hideTopicsAndSubtopics();
    referrer='dashboard';
    showPage("dashboard");
    $(".headerSubmenu").css("background","none");
    $(".headerPictureSearch").css("background-color","#FF4C00");
    $("#topicsContainer").css("display", "block");
}

function showSubTopics(x){
    hideTopicsAndSubtopics();
    selectedTopic=parseInt(x);
    console.log("showSubTopics"+x+" selectedTopic: "+selectedTopic+" selectedSubTopic: "+selectedSubTopic);
    $(".topicHeaderTitle").html(topics[(selectedTopic-1)].title);
    $(".topicHeaderIcon img").attr("src","images/icon_topic"+x+".png?v=2");
        var str="";
    for (var t=0; t<topics[(selectedTopic-1)].subtopics.length; t++){
        str+='<div class="subtopicDivContainer" id="subtopicContainer'+(t+1)+'"  onclick="showSubTopicsExpanded(\''+(t+1)+'\');"><div class="subtopicDivHolder">';
                var iconImage="icon_topic.png"; if (language==="mangarrayi"){ iconImage='icon_topic'+selectedTopic+'_'+(t+1)+'.png';}
                str+='<img src="images/'+iconImage+'" alt="">';
                str+='<div class="subtopicDiv">'+topics[(selectedTopic-1)].subtopics[t].title+'</div></div></div>';
    }
    $("#subtopicsContainer").slideDown();
    $("#subtopics").html('<div class="topicsFlexContainer">'+str+'</div>').css("display", "block");
}

function showSubTopicsExpanded(x){
    hideTopicsAndSubtopics();
    selectedSubTopic=parseInt(x);
    console.log("showSubTopicsExpanded"+x+" selectedTopic: "+selectedTopic+" selectedSubTopic: "+selectedSubTopic);

        var topicid=selectedTopic.toString();
        var subtopicid=topics[(selectedTopic-1)].subtopics[(selectedSubTopic-1)].title;
    console.log("topicid: "+topicid+" subtopicid: "+subtopicid);
    $(".topicHeaderTitle").html('');
    $(".subtopicHeaderTitle").html(subtopicid);
    $(".subtopicHeaderIcon img").attr("src","images/icon_topic"+selectedTopic+"_"+selectedSubTopic+".png");
        var str="";
        for (var a=0; a<chunkbankSorted.length; a++){
        var matchedEntry=false; //see if subtopic word is found in entry subtopics or related
        if(
            //chunkbankSorted[a].topic===topicid &&
            (chunkbankSorted[a][topicCol]!==null && chunkbankSorted[a][topicCol].toLowerCase().indexOf(subtopicid.toLowerCase())!==-1) ||
            (chunkbankSorted[a].related!==null && chunkbankSorted[a].related.toLowerCase().indexOf(subtopicid.toLowerCase())!==-1)
        ){
            matchedEntry=true;
        }
        if(matchedEntry===true){
                    str+='<div class="entry"><div class="entryEnglish" onclick="setEntry(\''+chunkbankSorted[a].id+'\'); showPage(\'entry\');">'+chunkbankSorted[a][translationCol]+'</div> <div class="entryMangarrayi audioButtonDiv active" id="subtopicsexpa_'+chunkbankSorted[a].id+'" onclick="toggleAudio(\'subtopicsexpa_'+chunkbankSorted[a].id+'\');"><img src="images/audio_on.png" alt="play" title="Play" class="audioIcon" id="">'+chunkbankSorted[a][languageCol]+'</div> <div class="entryGo active" onclick="setEntry(\''+chunkbankSorted[a].id+'\');showPage(\'entry\');"><img src="images/icon_right.png" alt="arrow right"></div><div class="clearBoth"> </div> </div>';
            }
        }
        if (str===""){str="<p class='textLeft paddedContent note'>Nothing under this topic yet.</p>";}
        $(".subtopicsexpanded").html(str);
        //$("#subtopicsExpandedContainer").css("display", "block");
        $("#subtopicsExpandedContainer").fadeIn();
}

function hideTopicsAndSubtopics(){
    "use strict";
    $("#subtopicsExpandedContainer, #subtopicsContainer, #topicsContainer, .subtopics").css("display", "none");
    //$(".topicHeaderTitle, .subtopicHeaderTitle").html('');
}

//=========================================================================================================================== LIST ALL
function showFull(){
    "use strict";
    referrer='fulllist';
    showPage("fulllist");
    $(".headerSubmenu").css("background","none");
    $(".headerListSearch").css("background-color","#FF4C00");
}

//=========================================================================================================================== ACTIVITY
async function showActivity(){
    "use strict";
    console.log("currentpage "+currentpage);
    referrer='activity';
    if (currentpage==="activity"){return;}
    showPage("activity");
    $(".headerSubmenu").css("background","none");
    $(".headerActivity").css("background-color","#FF4C00");
    await setUpFlags(); //wait for flags to be set up before setting up question set
    setUpQuestionSet();
}

function showActivityHome(){
  $("#memoryBody, #activityBody").css("display", "none");
  $(".activityReset").css("display", "block");
  $("#activityStart").css("display", "flex");
  $(".menuButton img").attr("src","images/icon_menu.png");
  referrer="activity";
}

//type of activity
var currentActivityType=0;
//set of phrases for activity
var questionSet=[];
var questionSetLength=10;//number of questions in set
var memorySet=[];
var memorySetLength=12;//number of memory tiles
var answerSetLength=3;//number of possible answers
var previousQuestionsLength=5;//how long before phrases can be repeated in the activity?
var previousQuestions=new Array(previousQuestionsLength);//container for previous questions
//current question (dictionary index)
var qI=0;
//current answer set for activity
var answerSet=[];

function setUpFlags(){
    console.log("=======SET UP FLAGS");
    chunkbankFlags=[];//reset flags array
    getFlags();//get any flags from storage

    for (var a=0; a<chunkbank.length; a++){
        //if a chunk doesn't exist in the flags array then add it (e.g. if new phrase added to dictionary)
        if (!chunkbankFlags.some(el => el.id === chunkbank[a].id)){
          chunkbankFlags.push({    id: chunkbank[a].id, fave:0,    flag:"none", count:0    });
        }
        //add indexes to entire flag array
        chunkbankFlags[a].index=a;
        //set updated favourites to flag array
        for (var f=0; f<favourites.length; f++){if(chunkbank[a].id === favourites[f].toString()){ chunkbankFlags[a].fave=1;}}
    }
    setFlags();
}

function getFlags(){
    var flagStorage=language+"-flags";
    if (localStorage.getItem(flagStorage)!==null){ chunkbankFlags=JSON.parse(localStorage.getItem(flagStorage));}
}

function setFlags(){
    var flagStorage=language+"-flags";
    localStorage.setItem(flagStorage, JSON.stringify(chunkbankFlags));
}

function updateFlags(i){


    if ($(".activityAnswers div").hasClass("correct")){//only update progress if they answered correctly
        //increment interaction count for this phrase
        chunkbankFlags[i].count++;
        //change things according to progress
        switch(chunkbankFlags[i].flag){
            //count==limit1? set flag to orange, counter reset
            case "blue": if(chunkbankFlags[i].count===3){chunkbankFlags[i].flag="orange"; chunkbankFlags[i].count=0;} break;
            //count==limit2? set flag to pink, reset counter
            case "orange": if(chunkbankFlags[i].count===3){chunkbankFlags[i].flag="pink"; chunkbankFlags[i].count=0;} break;
            //count==limit3? reset count set flag to green remove from set
            case "pink": if(chunkbankFlags[i].count===3){
                chunkbankFlags[i].flag="green"; chunkbankFlags[i].count=0;
                var index = questionSet.findIndex(question=>question.id===chunkbankFlags[i].id);//get the phrase's index in the question set array
                questionSet.splice(index,1); //remove from set
                setUpQuestionSet();//add a new phrase to the set
            } break;
        }
        setFlags();
    }
    console.log("update flags for: ");
    console.log(chunkbankFlags[i]);

    //check if they have turned the hide icon in question
    if($("#hideIcon img").hasClass("colourOn")){
        //hide the phrase from future activities
        chunkbankFlags[i].flag="red"; chunkbankFlags[i].count=0;
        var index = questionSet.findIndex(question=>question.id===chunkbankFlags[i].id);//get the phrase's index in the question set array
        questionSet.splice(index,1); //remove from set
        var qnStorage=language+"-set"; localStorage.setItem(qnStorage, JSON.stringify(questionSet));
        setUpQuestionSet();//add a new phrase to the set
        setFlags();
    }
}

function resetActivity(){
    console.log("=======RESET ACTIVITY");
    //reset question set and flags array
    questionSet=[]; var qnStorage=language+"-set"; localStorage.setItem(qnStorage, JSON.stringify(questionSet));
    chunkbankFlags.forEach((item, i) => {item.flag="none";}); setFlags();//update local storage
    //hide reset button
    $(".activityReset").css("display","none");
    //set up new question set
    setUpQuestionSet();
    showAlert("Your progress has been reset.");
}

function previousLevel(){
  console.log("=======PREVIOUS");
}


function setUpQuestionSet(){
    console.log("=======SET UP QUESTION SET");
    //get question set from Storage
    var qnStorage=language+"-set"; if (localStorage.getItem(qnStorage)!==null){ questionSet=JSON.parse(localStorage.getItem(qnStorage));}
    var initialSetUp=false; if (questionSet.length===0){initialSetUp=true;}
    if(initialSetUp){$(".activityReset").css("display","none");}//hide reset button if this is their first time
    //questionSetLength is the number of phrases to be added to the question set.
    //Check questionSetLength does not exceed the number of possible phrases (i.e. phrases that are not green or red)
    //questionSetLength=2;//testing
    //previousQuestionsLength=Math.floor(questionSetLength/2);//how long before phrases can be repeated in the activity - set to half the questionsetlength
    //previousQuestions.splice(previousQuestionsLength);
    //if(answerSetLength>questionSetLength){answerSetLength=questionSetLength;}
    //console.log(previousQuestions);

    //work out how many phrases are available
    var possiblePhraseCount=0; var possibleShortPhraseCount=0;
    chunkbankFlags.forEach((item, i) => {
        if(item.flag!=="green"&&item.flag!=="red"&&item.id!=="0"&&item.id!=="1"){possiblePhraseCount++;}
    });
    chunkbank.forEach((item, i) => {
        if(item[languageCol].length<initialActivityWordLength){possibleShortPhraseCount++;}
    });

    //if there are limited questions then reduce the length of the questionSet and previousQuestion set
    if(possiblePhraseCount<questionSetLength){
        questionSetLength=possiblePhraseCount;
        previousQuestionsLength=Math.floor(questionSetLength/2);
    }
    //remove word length requirement if there are not enough short phrases for initial set up
    if(possibleShortPhraseCount<questionSetLength){initialActivityWordLength=10;}

console.log("chunkbankFlags");
console.log(chunkbankFlags)
    console.log("possibleShortPhraseCount "+possibleShortPhraseCount);
    console.log("possiblePhraseCount "+possiblePhraseCount);
    console.log("questionSetLength "+questionSetLength);


    //check number of questions needed to be added to existing set (if any)
    var numQuestionsNeeded=questionSetLength-questionSet.length;

    if (numQuestionsNeeded>0){ //more questions needed - add to set
        console.log(questionSet);
        console.log("set not complete. Qns still needed: "+numQuestionsNeeded);
        console.log("ADD FAVES");
        console.log(chunkbankFlags);
        //first get any new favourites
        for (var f=0; f<chunkbankFlags.length; f++){
            //check phrase not already in the question set array
            if(!questionSet.some(el => el.id === chunkbankFlags[f].id)&&chunkbankFlags[f].id!=="0"){
                //check for favourite phrases that haven't already been mastered or hidden
                if (chunkbankFlags[f].fave===1 &&(chunkbankFlags[f].flag!=="green"&&chunkbankFlags[f].flag!=="red")){
                    //add all these to set - fill up set but don't go over the number of questions needed
                    if(numQuestionsNeeded>0){
                        questionSet.push({id:chunkbankFlags[f].id,index:chunkbankFlags[f].index}); //add to set
                        chunkbankFlags[f].flag="blue";//set flag in main flag array to blue
                        chunkbankFlags[f].count=0;//set count in main flag array to 0
                        numQuestionsNeeded--;
                        console.log("added "+chunkbankFlags[f].id+" - "+chunkbank[chunkbankFlags[f].index][translationCol]+". Qns still needed: "+numQuestionsNeeded);
                    }
                }
            }
        }
        console.log(questionSet.length);
        console.log("ADD RANDOMS");
        //second Fill a ⅓ of empty remaining cells with randoms not in set
        var numberRandomsNeeded=Math.round(numQuestionsNeeded/3);
        var i=0; while (i < numberRandomsNeeded) {
            var randomNo=Math.floor((Math.random() * (chunkbankFlags.length-1)));//randomly choose from chunkbank array
            //check phrase not already in the question set array, has not already been mastered (green) or hidden (red)
            if(!questionSet.some(el => el.id === chunkbankFlags[randomNo].id)&&chunkbankFlags[randomNo].id!=="0" &&(chunkbankFlags[randomNo].flag!=="green"||chunkbankFlags[randomNo].flag!=="red")){
                if(!initialSetUp||chunkbank[chunkbankFlags[randomNo].index][languageCol].length<initialActivityWordLength){//choose short words the first time round
                    questionSet.push({id:chunkbankFlags[randomNo].id,index:chunkbankFlags[randomNo].index}); //add to set
                    chunkbankFlags[randomNo].flag="blue";//set flag in main flag array to blue
                    chunkbankFlags[randomNo].count=0;//set count in main flag array to 0
                    i++;
                    numQuestionsNeeded--;
                    console.log("added "+chunkbankFlags[randomNo].id+" - "+chunkbank[chunkbankFlags[randomNo].index][translationCol]+" - "+chunkbank[chunkbankFlags[randomNo].index][languageCol]+". Qns still needed: "+numQuestionsNeeded);
                    //console.log("added "+chunkbankFlags[randomNo].id+" as random to set. Qns still needed: "+numQuestionsNeeded);
                }
            }
        }

//remove convos for now
        //if question set still not complete fill remaining cells with any related conversation phrases not in set
      /*  if (numQuestionsNeeded>0){
          console.log(questionSet.length);
            console.log("ADD CONVOS");
            for (var s=0; s<questionSet.length; s++){ //get ids from questions set
                for (var c=0; c<conversations.length; c++){ //loop through conversations
                    for (var ne=1; ne<5; ne++){//loop through number of conversation parts (4)
                        if(questionSet[s].id===conversations[c]["entry"+ne]){//check if phrase id matches entry1, entry2 etc in conversation
                            //console.log(questionSet[s].id+" - "+chunkbank[questionSet[s].index].english+" - has a related conversation");
                            //if there's a match this means question set entry has a related conversation
                            for (var oc=1; oc<5; oc++){//loop through conversation parts again
                                if (oc!==ne && numQuestionsNeeded>0 && conversations[c]["entry"+oc]!=="0"){//get other conversation parts
                                    if(!questionSet.some(el => el.id === conversations[c]["entry"+oc])){ //check phrase not already in the question set array
                                        //console.log("Add "+conversations[c]["entry"+oc]+" - has a related conversation");
                                        var n = chunkbankFlags.findIndex(question=>question.id===conversations[c]["entry"+oc]);//get the phrase's index in the flag array
                                        if (n!==-1){
                                          if (chunkbankFlags[n].flag!=="green"||chunkbankFlags[n].flag!=="red"){//check phrase has not already been mastered or hidden
                                              if(!initialSetUp||chunkbank[n][languageCol].length<initialActivityWordLength){//choose short words the first time round
                                                  questionSet.push({id:chunkbankFlags[n].id,index:chunkbankFlags[n].index}); //add to set
                                                  chunkbankFlags[n].flag="blue";//set flag in main flag array to blue
                                                  chunkbankFlags[n].count=0;//set count in main flag array to 0
                                                  numQuestionsNeeded--;
                                                  console.log("added "+chunkbank[n].id+" - "+chunkbank[n][translationCol]+" - "+chunkbank[n][languageCol]+". Qns still needed: "+numQuestionsNeeded);
                                              }
                                          }//end check flags
                                        }
                                    }//end check phrase not in set
                                }//end go through other conversation parts
                            }//end conv part loop
                        }
                    }//end conv part loop
                }//end conv loop
            }//end set loop
        }//end num qu needed
*/
        //if question set still not complete Fill remaining cells with any related topic phrases not in set
        if (numQuestionsNeeded>0){
            console.log("ADD TOPICS");
            for (var s=0; s<questionSet.length; s++){ //go through existing questions in set
                var topic=chunkbank[questionSet[s].index][topicCol];//get the topic for the question
                if(topic!=="null" && topic!==null && topic!==""){
                    for (var c=0; c<chunkbank.length; c++){ //loop through chunkbank
                        if(chunkbank[c][topicCol]===topic){//find similar topics
                            if(!questionSet.some(el => el.id === chunkbank[c].id) && numQuestionsNeeded>0 &&chunkbank[c].id!=="0" &&(chunkbankFlags[c].flag!=="green"||chunkbankFlags[c].flag!=="red")){ //check phrase not already in the question set array, mastered or hidden
                                if(!initialSetUp||chunkbank[c][languageCol].length<initialActivityWordLength){//choose short words the first time round
                                    questionSet.push({id:chunkbank[c].id,index:c}); //add to set
                                    chunkbankFlags[c].flag="blue";//set flag in main flag array to blue
                                    chunkbankFlags[c].count=0;//set count in main flag array to 0
                                    numQuestionsNeeded--;
                                    console.log("added "+chunkbank[c].id+" - "+chunkbank[c][translationCol]+" - "+chunkbank[c][languageCol]+" - from "+topic+". Qns still needed: "+numQuestionsNeeded);
                                }
                            }
                        }
                    }
                }
            }
        }

        //if question set still not complete  Fill remaining cells with random phrases not in set

        if (numQuestionsNeeded>0){
            console.log("ADD FINAL RANDOMS");
            while (numQuestionsNeeded>0) {
              //console.log("numQuestionsNeeded! "+numQuestionsNeeded+" "+initialActivityWordLength);
                randomNo=Math.floor((Math.random() * (chunkbankFlags.length-1)));//randomly choose from chunkbank array
                //check phrase not already in the question set array, mastered or hidden
                if(!questionSet.some(el => el.id === chunkbankFlags[randomNo].id)&&chunkbankFlags[randomNo].id!=="0" &&(chunkbankFlags[randomNo].flag!=="green"||chunkbankFlags[randomNo].flag!=="red")){

                    questionSet.push({id:chunkbankFlags[randomNo].id,index:chunkbankFlags[randomNo].index}); //add to set
                        chunkbankFlags[randomNo].flag="blue";//set flag in main flag array to blue
                        chunkbankFlags[randomNo].count=0;//set count in main flag array to 0
                        numQuestionsNeeded--;
                        console.log("added "+chunkbankFlags[randomNo].id+" - "+chunkbank[chunkbankFlags[randomNo].index][translationCol]+" - "+chunkbank[chunkbankFlags[randomNo].index][languageCol]+". Qns still needed: "+numQuestionsNeeded);
                        //console.log("added "+chunkbankFlags[randomNo].id+" as random to set. Qns still needed: "+numQuestionsNeeded);

                }
            }
        }

    } else if (questionSet.length>questionSetLength){
        //set is too big - remove extras from set
        questionSet.splice(questionSetLength);
    } else {
        //set is the right length but...
        for (var f=0; f<chunkbankFlags.length; f++){
            //check if there are any new faves that haven't been added to set yet, and that haven't already been mastered or hidden
            if(!questionSet.some(el => el.id === chunkbankFlags[f].id) && chunkbankFlags[f].fave===1 &&(chunkbankFlags[f].flag!=="green"||chunkbankFlags[f].flag!=="red")){
                console.log("There's a new favourite: "+chunkbankFlags[f].id);
                //remove the last non-favourite from the set
                var forRemoval; for (var qs=0; qs<questionSet.length; qs++){if(chunkbankFlags[questionSet[qs].index].fave===0){    forRemoval=qs;    }}
                //if there's any non favourites we can remove...
                if (forRemoval){
                    console.log("Replacing item "+questionSet[forRemoval].id+" with "+chunkbankFlags[f].id);
                    questionSet.splice(forRemoval,1);//remove from set
                    questionSet.push({id:chunkbankFlags[f].id,index:chunkbankFlags[f].index}); //add to set
                    chunkbankFlags[f].flag="blue";//set flag in main flag array to blue
                    chunkbankFlags[f].count=0;//set count in main flag array to 0
                }

            }
        }
    }
    //save question set and flag array to Storage
    setFlags();
    localStorage.setItem(qnStorage, JSON.stringify(questionSet));
    console.log(questionSet);
    questionSet.forEach((item, i) => {
        console.log(i+" "+item.id+" "+chunkbank[item.index][translationCol]);
    });
    //questionSet=[{id:"1204",index:"2"}];//testing for hungarian
}


function shuffle(array) {
  var currentIndex = array.length, temporaryValue, randomIndex;
  while (0 !== currentIndex) {
    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;
    // And swap it with the current element.
    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }
  return array;
}

function setUpMemorySet(){
    console.log("=======SET UP MEMORY SET");
    memorySet=[];
    var numMemoryNeeded=memorySetLength-memorySet.length;
    if (numMemoryNeeded>0){ //more questions needed - add to set
        //console.log("memory set not complete. Memory still needed: "+numMemoryNeeded);
        var attempts=0;
        var i=0; while (i < numMemoryNeeded) {
            attempts++; if (attempts >100) { break; }
            var randomNo=Math.floor((Math.random() * (chunkbankFlags.length-1)));//randomly choose from chunkbank array
            //check phrase id not already in the memory set array and is long enough
            if(!memorySet.some(el => el.id === chunkbankFlags[randomNo].id) && chunkbankFlags[randomNo].id!=="0"){
                //choose phrases with images and check image is not a duplicate
                if(chunkbank[chunkbankFlags[randomNo].index].image!=="" && !memorySet.some(el => el.image === chunkbank[chunkbankFlags[randomNo].index].image)){
                  if(chunkbank[chunkbankFlags[randomNo].index][languageCol].length<maxMemoryWordLength){//choose short phrases
                    memorySet.push({
                      id:chunkbankFlags[randomNo].id,
                      index:chunkbankFlags[randomNo].index,
                      image:chunkbank[chunkbankFlags[randomNo].index].image,
                      sound:chunkbank[chunkbankFlags[randomNo].index].soundfilename,
                      found:false
                    }); //add to set
                    numMemoryNeeded--;
                    memorySet.push({
                      id:chunkbankFlags[randomNo].id,
                      index:chunkbankFlags[randomNo].index,
                      image:chunkbank[chunkbankFlags[randomNo].index].image,
                      sound:chunkbank[chunkbankFlags[randomNo].index].soundfilename,
                      found:false
                    }); //add to set
                    numMemoryNeeded--;
                    //console.log("added "+chunkbankFlags[randomNo].id+" - "+chunkbank[chunkbankFlags[randomNo].index][translationCol]+" - "+chunkbank[chunkbankFlags[randomNo].index][languageCol]+". Memory still needed: "+numMemoryNeeded);
                  }
                }
            }
        }
    } else if (memorySet.length>memorySetLength){
        //set is too big - remove extras from set
        memorySet.splice(memorySetLength);
    }

    /*memorySet.forEach((item, i) => {
        console.log(i+" "+item.id+" "+chunkbank[item.index][translationCol]);
    });*/
}




var selectedMemoryItemA=null;
var selectedMemoryItemB=null;
async function setUpMemory(){
  $("#activityStart, .activityReset, #activityBody").css("display", "none");
  $("#memoryBody").removeClass("pyro").css("display", "flex");
  $(".menuButton img").attr("src","images/icon_left.png");
  referrer="memory";

  await setUpMemorySet();
  shuffle(memorySet);
  console.log(memorySet);
  selectedMemoryItemA=null; selectedMemoryItemB=null;

  var mstr="<div class='before'></div>";
  mstr+="<p class='memoryInstructions'>Tap or click on a card and listen, look and match</p>";
  memorySet.forEach((item, i) => {
    mstr+='<div class="memoryCardHolder">';
    //mstr+='<div class="memoryCardOff" onclick="checkMemoryCard(\''+item.index'\')"></div>';
    mstr+='<div id="memoryCard'+i+'" class="memoryCardOn" onclick="checkMemoryCard('+i+',\''+item.index+'\',\''+item.id+'\')"></div>';
    mstr+='</div>';
  });
  mstr+='<div class="memoryReset" onclick="audioOff(); setUpMemory();">Play again</div>';
  mstr+="<div class='after'></div>";
  $("#memoryBody").html(mstr);
}

function hideMemoryCard(i){
  //$("#memoryCard"+i).animate({ opacity: 0 }, { duration: 500 });
  $("#memoryCard"+i).css("background-image", "url('images/memory_square.jpg')");
  audioOff();
}



function checkMemoryCard(i, index, id){
  if ($("#memoryCard"+i).css("background-image").indexOf("memory_square.jpg")==-1) {return;}
  //see which items have been selected so far
  console.log(i+" "+memorySet[i].image+" "+memorySet[i].sound);
  //only do anything if less than two items selected
  if (selectedMemoryItemB===null) {
    //if item hasn't already been selected then do something
    if (selectedMemoryItemA===null){
      selectedMemoryItemA=i;
    } else {
      selectedMemoryItemB=i;
    }
      var imageURL=memorySet[i].image.replace(/'/g, "%27");
      $("#memoryCard"+i).css("background-image", "url('"+imagepath+imageURL+"')");
      playAudio(memorySet[i].sound);
      //check match if this is the second item to be selected
      console.log(selectedMemoryItemA+" "+selectedMemoryItemB);
      if (selectedMemoryItemA!==null && selectedMemoryItemB!==null) {
        //two cards selected
        if (memorySet[selectedMemoryItemA].id===memorySet[selectedMemoryItemB].id){
          //matched
          memorySet[selectedMemoryItemA].found=true;
          memorySet[selectedMemoryItemB].found=true;
          selectedMemoryItemA=null; selectedMemoryItemB=null;
          //check if game ended
          var stillToFind=memorySet.findIndex(item=>item.found===false);
          console.log("still to find: "+stillToFind);
          if (stillToFind===-1){
            //celebrate
            $("#memoryBody").addClass("pyro");
            playAudio("memory_cheer.mp3");
            $(".memoryReset").css("display", "block");
          }
        } else {
          //not a match
          console.log("hiding: "+selectedMemoryItemA+" "+selectedMemoryItemB);
          var a=selectedMemoryItemA; var b=selectedMemoryItemB;
          selectedMemoryItemA=null; selectedMemoryItemB=null;
          setTimeout(
            function(){
              hideMemoryCard(a);
              hideMemoryCard(b);
            },2000
          );

        }
        //console.log(memorySet);
      }

  }

  console.log(memorySet);
  //console.log(selectedMemoryItems);



}

async function setUpActivity(mode){

    var previousLevel = false; if(mode==="previousLevel"){previousLevel=true;}
    var index; //holder to store phrase index

    //set flag to previous level and reset counter if the rewind button has been pressed
    if (previousLevel){
      chunkbankFlags[qI].count=0;
      switch(chunkbankFlags[qI].flag){
        case "orange": chunkbankFlags[qI].flag="blue"; break;
        case "pink": chunkbankFlags[qI].flag="orange"; break;
      }
      setFlags();
    } else {
      //otherwise update flags for previous question before showing next question
      if(qI!==0){ await updateFlags(qI);}
    }

    //work out how many phrases have NOT been mastered or hidden
    var possiblePhraseCount=0;
    chunkbankFlags.forEach((item, i) => {
      if(item.flag!=="green"&&item.flag!=="red"&&item.id!=="0"){  possiblePhraseCount++; }
    });


    //console.log(chunkbankFlags);
    console.log("total phrases "+chunkbankFlags.length);
    console.log("possible phrase count "+possiblePhraseCount);
    if(questionSetLength>possiblePhraseCount){
        showAlert("Well done. It looks like you have mastered most of the available phrases. Your progress has been reset.");
        chunkbankFlags.forEach((item, i) => {item.flag="none";});
        setFlags();//update local storage
    }

    //don't generate new question and answer set if just reloading the same phrase at the previous level
    if (!previousLevel){

      //determine next random question phrase in set
      var rn=Math.floor((Math.random() * (questionSet.length-1)));//randomly choose from question set
      //console.log("Random question "+rn);
      //console.log("previousQuestions "+previousQuestions);

      while(previousQuestions.indexOf(rn)!==-1){ //check phrase has not been interacted with recently
          //console.log("This question has been displayed recently. Do not display");
          rn=Math.floor((Math.random() * (questionSet.length-1)));//randomly choose from question set
      }
      //console.log("Random question "+rn);
      //rn=9;
      //remove first element of previous array and push this element in
      previousQuestions.shift();
      previousQuestions.push(rn);
      //console.log("previousQuestions "+previousQuestions);

      //current question index
      //console.log("questionSet "+JSON.stringify(questionSet));
      qI=questionSet[rn].index;
      //console.log("qI "+qI);
      console.log("=============SET UP ACTIVITY "+qI);
      console.log(chunkbankFlags[qI]);

      //determine answers
      answerSet = [];
      answerSet.push({id:questionSet[rn].id, index:questionSet[rn].index});//(must include question phrase index)
      console.log("answerSet "+JSON.stringify(answerSet));
      console.log(answerSetLength-1);
      //console.log("answer set "+JSON.stringify(answerSet));
      var attempts=0;
      while(answerSet.length <= (answerSetLength-1)){ //other random answers from the question set - default = 2 other answers
        attempts++; if (attempts >10) { break; }
          var r = Math.floor((Math.random() * (questionSet.length-1)));//randomly number (between 0 and length of question set)
              if(!answerSet.some(el => el.id === questionSet[r].id)){ //add to answers if not already there
                  if(chunkbank[qI][translationCol]!==chunkbank[questionSet[r].index][translationCol]){//check if answer is the same as the question translation
                      answerSet.push({id:questionSet[r].id, index:questionSet[r].index});
                  }
              }
      }
      //console.log(answerSet);
      shuffle(answerSet);
      console.log("answerSet "+JSON.stringify(answerSet));
    }




    //currentActivityAnswerSet=[{id:"384",index:"376"},{id:"16",index:"15"},{id:"366",index:"358"}];
    //answerSet=[{id:"384",index:"10"},{id:"1204",index:"2"},{id:"366",index:"9"}];
    //if(language==="mangarrayi"){answerSet=[{id:"384",index:"376"},{id:"16",index:"15"},{id:"366",index:"358"}];}



    //determine activity type
    switch(chunkbankFlags[qI].flag){
        case "blue": currentActivityType=1; break;
        case "orange": currentActivityType=2; break;
        case "pink": currentActivityType=3; break;
        default: currentActivityType=1;
    }
    //currentActivityType=3; //testing only
    console.log("Set up activity "+currentActivityType+" for "+chunkbank[qI].id+" - "+chunkbank[qI][translationCol]);

    //var progressText="&nbsp; &nbsp; <span style='font-size: .5em; color:#505050; float: right;'>Activity "+currentActivityType+" Round "+(chunkbankFlags[qI].count+1)+"</span>";

    $(".activityProgressEgg").addClass("disabled");
    switch (currentActivityType) {
        case 2:
        $("#activity1Progress .activityProgressEgg").removeClass("disabled");//show all level 1 eggs
        break;
        case 3:
        $("#activity1Progress .activityProgressEgg, #activity2Progress .activityProgressEgg").removeClass("disabled");//show all level 1 and 2 eggs
        break;
    }
    for (var i=1; i<=3; i++){
        if ((chunkbankFlags[qI].count+1)>=i){$("#activity"+currentActivityType+"Egg"+i).removeClass("disabled");}//show eggs in current activity
    }

    //$(".consoleLog").html(progressText);

    //hide and reset things
    $(".activityEntryQuestionText img, .activityAnswerText img, #activityEntryPlayOption1, #activityEntryPlayOption2, .activity3, .activity1, .activity1or2, #infoIcon, .reloadIconDiv").css("display", "none");
    $(".activityAnswerTextPlayOption, #activityEntryPlayOption2").addClass("disabled");
    $("#infoIcon img").removeClass("colourOn").addClass("colourOff");
    $(".activityEntryGlossingText, #activityBody .mikeOption2, #activityBody .mikeOption4, #activityBody .checkActivity").addClass("invisible");
    $(".menuButton img").attr("src","images/icon_menu.png");
    $(".activityAnswer").removeClass("correct incorrect");
    $(".activityEntryQuestionText").removeClass("invisible");
    $(".activityFeedback, .mikePrompt").html("");
    //$(".activityFeedback").html(progressText);
    $(".activityEntryGlossingTextContent, .mikePrompt").html("");
    $("#hideIcon img").removeClass("colourOn").addClass("colourOff");



    switch (currentActivityType){
        case 1: //mangarrayi to english/kriol/image
            $(".activityEntryQuestionPrompt").html("What does this mean?");

            //set question text
            $(".activityEntryQuestionTextContent").html(chunkbank[qI][languageCol]);

            //set question audio
            //console.log("activity qI "+qI+" "+chunkbank[qI].soundfilename);
            if(chunkbank[qI].soundfilename){
                $("#activityEntryPlayOption2, #activityEntryPlayOption1").removeClass("disabled").css("display","block");
            }
            $(".activityEntryGlossingTextContent").html(chunkbank[qI].glossing+"<br><br>"+chunkbank[qI].explanation);
            //set Answers
            answerSet.forEach(function callback(value, index) {
              var a=parseInt(value.index);
              var i=index+1;
                $("#activityAnswerText"+i).html(chunkbank[a][translationCol]);
                //set image in answers
                if(chunkbank[a].image){
                    $("#activityAnswerImage"+i).attr("src",imagepath+chunkbank[a].image).css("display", "inline");
                }
                //set sound in answers
                if(chunkbank[a][translationColsoundfilename]){
                    $("#answerAudio"+i).removeClass("disabled");
                }
            });
            //show activity-related content
            $(".activity1, .activity1or2").css("display","flex");
            
            toggleActivityAudio(); //auto play
            break;

        case 2: //english/kriol/image to mangarrayi
            $(".activityEntryQuestionPrompt").html("How do you say this?");
            //set question image
            if(chunkbank[qI].image){
                $(".activityEntryQuestionText img").attr("src",imagepath+chunkbank[qI].image).css("display", "inline");
            }
            //set question audio
            if(chunkbank[qI][translationColsoundfilename]){
                $("#activityEntryPlayOption2").removeClass("disabled").css("display","block");
            }
            //set question text
            $(".activityEntryQuestionTextContent").html(chunkbank[qI][translationCol]);
            //set Answers
            answerSet.forEach(function callback(value, index) {
              var a=parseInt(value.index);
              var i=index+1;
                $("#activityAnswerText"+i).html(chunkbank[a][languageCol]);
                //set sound in answers
                if(chunkbank[a].soundfilename){
                    $("#answerAudio"+i).removeClass("disabled");
                }
            });
            //show activity-related content
            $(".activity1or2, .reloadIconDiv").css("display","flex");
            
            break;

        case 3: //english/kriol/image to audio
            $(".activityEntryQuestionPrompt").html('Say this in '+languageHeader);
            //set question image
            if(chunkbank[qI].image){
                $(".activityEntryQuestionText img").attr("src",imagepath+chunkbank[qI].image).css("display", "inline");
            }
            //set question audio
            if(chunkbank[qI][translationColsoundfilename]){
                $("#activityEntryPlayOption2").removeClass("disabled").css("display","block");
            }
            //set question text
            $(".activityEntryQuestionTextContent").html(chunkbank[qI][translationCol]);
            //set answer text
            $("#activity .mikeentry").css("display","flex");
            $(".mikePrompt").html("Press to open recorder");
            //set image in answers
            $(".activityAnswerText img").css("display", "inline");
            //enable answer playback
            $("#answerAudio0").removeClass("disabled");
            //show activity-related content
            $(".reloadIconDiv").css("display","flex");
            $(".activity3").css("display","block");
           
            break;

        default:
    }

    if (qI!==0){ //initialise activity page
        $("#activityStart, .activityReset").css("display", "none");
        $("#activityBody").css("display", "flex");
        $(".menuButton img").attr("src","images/icon_left.png");
        referrer="quiz";
    }



}

function toggleActivityAudio(){
    "use strict";
        if ($("#activityEntryPlayOption2").hasClass("disabled")) {return;} //don't play if no audio available
        console.log("TOGGLE ACTIVITY AUDIO ="+qI);
        selectedAudio=qI;
        var type=currentActivityType; //type of activity
        var mainAudioThumbnail="activityEntryPlayOption2";
        var playImage="icon_play.png"; //if (type===2){playImage="icon_play2.png";} //main audio is kriol
        var playImage2="icon_play.png";// if (type===2){playImage2="icon_play.png";} //answers are mangarrayi

    //var n=-1; for (var a=0; a<chunkbank.length; a++){if(chunkbank[a].id === activityQ.toString()){n = a;}} if (n===-1){return;}
        var filename=chunkbank[qI].soundfilename; if(type===2||type===3){filename=chunkbank[qI][translationColsoundfilename];}

        if ($("#"+mainAudioThumbnail+" img").attr("src")==="images/"+playImage) {
            //turn audio button to on
            $("#"+mainAudioThumbnail+" img").attr("src","images/icon_pause.png");
        $("#"+mainAudioThumbnail+" img").removeClass("colourOff").addClass("colourOn");

            //reset answer audios
            $(".activityAnswerTextPlayOption img").attr("src","images/"+playImage2);
            playAudio(filename);
        } else {
            //hideAudioPlayButtons();
            $("#activityEntryPlayOption2 img").attr("src","images/icon_play.png");
        $("#activityEntryPlayOption2 img").removeClass("colourOn").addClass("colourOff");
        $(".entryProgress").css("background-size", "0");
            audioOff();
        }
}

function toggleActivitySlow(){
    "use strict";
    if($("#activityEntryPlayOption1 img").hasClass("colourOff")){
        //show slow
        playbackspeed=0.7;
        $("#activityEntryPlayOption1 img").removeClass("colourOff").addClass("colourOn");
    } else{
        //hide slow
        playbackspeed=1;
        $("#activityEntryPlayOption1 img").removeClass("colourOn").addClass("colourOff");
    }
    //restart audio if already playing
    if ($("#activityEntryPlayOption2 img").attr("src")==="images/icon_pause.png") {
        var filename=chunkbank[qI].soundfilename;
        //filename+=".mp3";
        playAudio(filename);
    }
}

function toggleActivityAnswerAudio(id){
    if ($("#answerAudio"+id).hasClass("disabled")) {return;} //don't play if no audio available
    var type=currentActivityType; //type of activity
    var answer=""; var n=0;
    if(type===3){ //activity 3 - get index of question
        n=parseInt(qI);
    } else {//activity 1 and 2
        answer=answerSet[parseInt(id)-1].index;
        n=parseInt(answer);
    }

    var playImage="icon_play.png";
    if(type===3){playImage="icon_ear.png";}

    console.log("=============TOGGLE ANSWER AUDIO "+id+" "+n);
    selectedAudio=0;

    if ($("#answerAudio"+id+" .playIcon").attr("src")==="images/"+playImage) { //if play button is on

        //stop playing question audio
        $("#activityEntryPlayOption2 img").attr("src","images/icon_play.png").removeClass("colourOn").addClass("colourOff");

        //stop playing other answers
        $(".activityAnswerTextPlayOption .playIcon").attr("src","images/"+playImage);

        //show pause button
        $("#answerAudio"+id+" .playIcon").attr("src","images/icon_pause.png");

        //which language?
        var filename=chunkbank[n][translationColsoundfilename];
        //get mangarrayi sound file for type 2 and 3 activities
        if(type===2||type===3){filename=chunkbank[n].soundfilename;}
        playAudio(filename);
    } else {
        $("#answerAudio"+id+" .playIcon").attr("src","images/"+playImage);
        audioOff();
    }
}



function toggleActivityAnswer(id){
    var correct = false;
    if (id==="Y"||id==="N"){ //activity 3 self assessment
        //set correct to true if they answer Yes
        if (id==="Y"){correct=true;}
    } else { //activity 1 or 2
        var answer=answerSet[parseInt(id)-1].index;
        //set correct to true if they select the correct answer
        if (qI.toString()===answer.toString()){correct=true;}
    }
    console.log("=============TOGGLE ACTIVITY ANSWER "+id+" "+correct);
    var type=currentActivityType; //type of activity
    var feedbackClass="incorrect"; if (correct){feedbackClass="correct";}

    //turn off if on
    if ($("#activityAnswer"+id).hasClass("correct") || $("#activityAnswer"+id).hasClass("incorrect")){
        $(".activityAnswer").removeClass("correct incorrect");
        $(".activityFeedback").html("");
    } else {
        $(".activityAnswer").removeClass("correct incorrect");

        //get ready to play sound effect
        var effect=true;
        if($("#muteIcon img").attr("src")===("images/icon_unmute.png")){effect=false;}
        if(effect){
            //stop playing question audio
            $("#activityEntryPlayOption2 img").attr("src","images/icon_play.png").removeClass("colourOn").addClass("colourOff");
            //stop playing other answers
            $(".activityAnswerTextPlayOption .playIcon").attr("src","images/icon_play.png");
        }


        //turn on
        if (correct){
            $("#activityAnswer"+id).addClass("correct");
            $(".activityFeedback").html("Good one!");
            if (language==="mangarrayi" && effect){playAudio("yiya.mp3");}
        } else {
            $("#activityAnswer"+id).addClass("incorrect");
            $(".activityFeedback").html("Try again");
            if (language==="mangarrayi" &&effect){playAudio("dayi.mp3");}
        }
        if (type==1){$("#infoIcon").css("display", "block");}//show info button

    }
}


function toggleGlossing(){
    if($("#infoIcon img").hasClass("colourOff")){
        //turn on glossing
        $("#infoIcon img").removeClass("colourOff").addClass("colourOn");
        $(".activityEntryGlossingText").removeClass("invisible");
        $(".activityEntryQuestionText").addClass("invisible");
    } else{
        $("#infoIcon img").removeClass("colourOn").addClass("colourOff");
        $(".activityEntryGlossingText").addClass("invisible");
        $(".activityEntryQuestionText").removeClass("invisible");
    }
}



//=========================================================================================================================== RECORD MEDIA

function toggleMike(){
    "use strict";
    if (web){showAlert("<p class='centred'>Only in mobile app!</p>"); return;}
    if($("#entryOption6 img").hasClass("colourOff")){
      //show mike
      $("#entryOption6 img").removeClass("colourOff").addClass("colourOn");
      $("#entry .mikeentry").css("display","flex");
      //hide convo if showing
       if($("#entryOption5 img").hasClass("colourOn")){ $(".conventry").css("display","none");  $("#entryOption5 img").removeClass("colourOn").addClass("colourOff");}

             recordAudio();
  } else{
      //hide mike
      $("#entryOption6 img").removeClass("colourOn").addClass("colourOff");
      $("#entry .mikeentry").css("display", "none");
            $(".mikePrompt").html("");
  }
}


function recordAudio(){
    hideAudioPlayButtons();
    audioOff();
    //ACTIVITY 3 INTERFACE
    if($("#activity").css("display")==="block"){
        //show play headphone buttons and answer text
        $("#activityBody .mikeOption2, #activityBody .mikeOption4").removeClass("invisible");
        $(".mikePrompt").html(chunkbank[qI][languageCol]+"<br><br>Have a listen back. Did you get it?");
        $("#activityBody .checkActivity").removeClass("invisible");
    } else {
        $(".mikePrompt").html("Press the headphones to have a listen back");
    }
    var id=selectedEntry;

    if($("#activity").css("display")==="block"){
        //id=chunkbankFlags[qI].id; //which phrase is active in the activity
    }
    // start audio capture
    navigator.device.capture.captureAudio(captureSuccess, captureError, {limit:1});

}

//triggered from Press to record label in activity 3
function recordActivityFromLabel(id){
    if ($(".mikePrompt").html().indexOf("Press")===-1){return;} //return if pressing on activityMikePrompt later in the activity
    recordAudio();
}


//====================================================================================================================== PLAY BACK RECORDED MEDIA
function togglePlayback(){
    if (web){showAlert("<p class='centred'>Only in mobile app!</p>");return;}
    if ($(".iconHeadphones").attr("src").indexOf("headphones")!==-1){
        if(recordedAudioPath===undefined||recordedAudioPath===""||recordedAudioPath==="undefined"){
            showAlert("There is nothing to play yet. <br><br>Make sure you use tap the talking head and then press record first.");
            return;
        }
        //change interface
        $(".iconHeadphones").attr("src", "images/icon_pause.png");
        //playback recorded audio
        var id=selectedEntry;
        //ACTIVITY 3 INTERFACE
        if($("#activity").css("display")==="block"){
            id=chunkbankFlags[qI].id; //which phrase is active in the activity
        }
        console.log("playback "+recordedAudioPath);
        var audio = document.getElementById('audioPlayer');
        audio.setAttribute("src", recordedAudioPath);
        audio.load();
        hideAudioPlayButtons();
    } else {
        stopPlayback();
    }
}

function stopPlayback(){
    console.log("Stop playback");
    if (web){showAlert("<p class='centred'>Only in mobile app!</p>");return;}
    audioOff();
    $(".iconHeadphones").attr("src", "images/icon_headphones.png");
}

function resetPlaybackButton(){
    $(".iconHeadphones").attr("src", "images/icon_headphones.png");
}



//====================================================================================================================== SHARE MEDIA
function sharePlayback(){
    if (web){showAlert("<p class='centred'>Only in mobile app!</p>");return;}
    if(recordedAudioPath===undefined||recordedAudioPath===""||recordedAudioPath==="undefined"){
        showAlert("There is nothing to share yet. <br><br>Make sure you use tap the talking head and then press record first.");
        return;
    }
    //share recorded audio
    var id=selectedEntry.toString();
    var cid = chunkbank.findIndex(chunk=>chunk.id===id);//get the phrase's index in the chunkbank array
    if(cid!==-1){
        var phraseText=chunkbank[cid][languageCol];
        console.log("SHARE AUDIO FOR "+recordedAudioPath);
        window.plugins.socialsharing.share(phraseText, 'My recording', recordedAudioPath);
    }

}




//=========================================================================================================================== FAVOURITES
function showFaves(){
    "use strict";
    loadFavourites();
    referrer='favourites';
    showPage("favourites");
    $(".headerSubmenu").css("background","none");
    $(".headerFavourites").css("background-color","#FF4C00");
    audioOff(); $(".playAllAudioIcon").attr("src","images/icon_play_white.png");
}

function loadFavourites(){
    "use strict";
        console.log("============LOAD FAVOURITES "+favourites);
    var str="";
    if (favourites.length>1){
      //add play all button
      str+='<div class="playAllHolder">';
      str+='<div class="playAllButtonHolder" onclick="playAll(\'favourites\');"><img src="images/icon_play_white.png" alt="play" title="Play all" class="playAllAudioIcon" id=""> Play all</div>';
      str+='</div>';
    }
    for (var f=0; f<favourites.length; f++){//go through what they have saved
        var n=0; for (var a=0; a<chunkbank.length; a++){if(chunkbank[a].id === favourites[f].toString()){n = a;}} //get the relevant element
        str+='<div class="starRemove active" onclick="toggleStar(\''+chunkbank[n].id+'\');">X</div>';
        str+='<div class="entry"><div class="entryEnglish" onclick="setEntry(\''+chunkbank[n].id+'\'); showPage(\'entry\');">'+ chunkbank[n][translationCol]+'</div> <div class="entryMangarrayi audioButtonDiv active" id="favoriteentry_'+chunkbank[n].id+'" onclick="toggleAudio(\'favoriteentry_'+chunkbank[n].id+'\');"><img src="images/audio_on.png" alt="play" title="Play" class="audioIcon" id="">'+chunkbank[n][languageCol]+'</div> <div class="entryGo active" onclick="setEntry(\''+chunkbank[n].id+'\');showPage(\'entry\');"><img src="images/icon_right.png" alt="arrow right"></div><div class="clearBoth"></div></div>';

    }
    if (str===""){str='<p class="paddedContent note">Tap the star on any words you want to learn and they will show up here. </p><p class="paddedContent note">You will also be able to practice them in the "Have a go" part.</p>';} //default text if empty
    $("#favouritesresults").html(str);
}
//=========================================================================================================================== FILTERS
function showCategory(){
    "use strict";
    referrer='categorylist';
    showPage("categorylist");
    var catDiv = document.getElementById('categoryentriesbody'); catDiv.scrollTop = 0;
    $(".headerSubmenu").css("background","none");
    $(".headerCategorySearch").css("background-color","#FF4C00");
}
function setFilter(){
    "use strict";
    selectedFilter=$("#filterEntries").val();
    loadFilterEntries();
}

function loadFilterEntries(){
    "use strict";
    //var tempstr="";
   //console.log("selectedFilter: "+selectedFilter);
    $("#filterEntries").val(selectedFilter);
    var filterArray=[];
    for (var b=0; b<chunkbank.length; b++){
        //get all the items for that filter e.g. all the english keywords in the dictionary
        if (chunkbank[b][selectedFilter]==null){chunkbank[b][selectedFilter]="";}
        var tempFilterArray = chunkbank[b][selectedFilter].split(",");
        for (var c=0; c<tempFilterArray.length; c++){
            var newItem = tempFilterArray[c].replace(/-/g, '').trim();//replace dashes and extra space from filter item
            //fix spelling mistakes and duplicates
           if (newItem==="I am"){newItem="I'm";}
           // if (selectedFilter==="keywordenglish"){newItem=newItem.toLowerCase();}//change english items to lower case so they appear in alphabetical order
           // if (selectedFilter==="keyword"){newItem=newItem.toLowerCase();}//change mangarrayi  items to lower case
            newItem=newItem.toLowerCase();//change all filter items to lower case
            if (filterArray.indexOf(newItem) === -1 && newItem!==""){filterArray.push(newItem);} //push filter items into an array and avoid duplicates
        }
    }
    //now sort filter item list into alphabetical order
    filterArray.sort();
    //now create headings for all the filter items
    var filterListHTML="";
    for (var d=0; d<filterArray.length; d++){//loop through filter items
      // tempstr+='{"title":"'+filterArray[d]+'","id":"'+(d+1)+'"},';
        var firstLetterUpper=""; if (selectedFilter!=="keyword"){firstLetterUpper=" firstLetterUpper";}//add class to transform first letter to uppercase unless it's mang keyword
        filterListHTML+='<a name="categoryresult_'+d+'_anchor" id="categoryresult_'+d+'_anchor"></a><div class="categoryresult active" id="categoryresult_'+d+'" onclick="showCategoryResult(\''+d+'\');"><div class="entryEnglish entryCol'+firstLetterUpper+'">'+filterArray[d]+'</div><div class="clearBoth"></div></div>';
        //start the html for the filter item result entries
        filterListHTML+='<div class="categoryresultentries" id="categoryresult_'+d+'_entries">';

        //loop through the dictionary and find entries with that filter item (list in order of length of english)
        for (var e=0; e<chunkbankSortedLength.length; e++){
            var isMatch=false;
            //there may be more than one filter item for each entry so split the filter items ito array
            var entryFilterArray = chunkbankSortedLength[e][selectedFilter].split(","); //e.g. hungry
            for (var f=0; f<entryFilterArray.length; f++){
                var entryFilter=entryFilterArray[f].replace(/-/g, '').trim(); //trim filter item and remove dashes
                if (selectedFilter!=="keyword"){entryFilter=entryFilter.toLowerCase();}//change all filter items to lower case except for mangarrayi keywords
                if (entryFilter===filterArray[d]){isMatch=true;}
                // if (filterArray[d]==="talking about your body state."){  if(chunkbankSortedLength[e].english==="I'm hungry"){console.log("filterArray[d] "+filterArray[d]+" entryFilter: "+entryFilter+" isMatch "+isMatch);}}
            }
            if (isMatch){
              // if (filterArray[d]==="Talking about your body state."){  if(chunkbankSortedLength[e].english==="I'm hungry"){console.log("chunkbankSortedLength[e].english "+chunkbankSortedLength[e].english);}}
                filterListHTML+='<div class="entry"><div class="entryEnglish" onclick="referrer=\'categorylist\'; setEntry(\''+chunkbankSortedLength[e].id+'\'); showPage(\'entry\');">'+chunkbankSortedLength[e][translationCol]+'</div><div class="entryMangarrayi audioButtonDiv active" id="categoryaudio_'+chunkbankSortedLength[e].id+'" onclick="toggleAudio(\'categoryaudio_'+chunkbankSortedLength[e].id+'\');"><img src="images/audio_on.png" alt="play" title="Play" class="audioIcon">'+chunkbankSortedLength[e][languageCol]+'</div><div class="entryGo active" onclick="referrer=\'categorylist\'; setEntry(\''+chunkbankSortedLength[e].id+'\'); showPage(\'entry\');"><img src="images/icon_right.png" alt="arrow right"></div><div class="clearBoth"></div></div>';
            }
        }
        //clse the html for the filter item result
        filterListHTML+='</div>';


    }
   //console.log(tempstr);
    $("#categorylist .categoryresults").html(filterListHTML);
}

function showCategoryResult(name){
    "use strict";
    if ($("#categoryresult_"+name+"_entries").css("display")==="none"){
        $(".categoryresultentries").css("display", "none");
        $(".categoryresult").css({"background-color":"#ffffff", "color":"#000"});
        $(".categoryresult .entryCol").css("color","#000");
        $("#categoryresult_"+name).css("background-color","#131114");
        $("#categoryresult_"+name+" .entryCol").css("color","#fff");
        $("#categoryresult_"+name+"_entries").slideDown("fast");
        //var num=parseInt(name); if (num>5){scrollToAnchor("categoryresult_"+(num-1)+"_anchor");}
    } else {
        hideCategoryResult();
    }
}

function hideCategoryResult(){
    "use strict";
    $(".categoryresultentries").css("display", "none");
    $(".categoryresult").css("background-color","#ffffff");
    $(".categoryresult .entryCol").css("color","#000");
}

//=========================================================================================================================== BACK BUTTON ON ANDROID
function onBackKeyDown() {
    "use strict";
    hidePopup();
    $('input').blur();
    hideSearch();
    if (currentpage==="dashboard"){
        if ($("#subtopicsContainer").css("display")==="block"){
            showTopics();
        }else if ($("#subtopicsExpandedContainer").css("display")==="block"){
            showSubTopics(selectedTopic);
        }
    }else if(currentpage==="entry"){
         //hide glossing
        $(".entryGlossing, #infoentry, #creditsentry").css("display", "none"); $(".entryNormal").fadeIn();
        $("#entryOption4 img").removeClass("colourOn").addClass("colourOff");
         //hide conversation
        $(".conventry").css("display","none");
        $("#entryOption5 img,#entryOption6 img").removeClass("colourOn").addClass("colourOff");
        showPage(referrer);
    } else if(currentpage==="categorylist"){
        hideCategoryResult();
    } else if(currentpage==="token"){
        showPage("warning");
    } else if(currentpage==="activity"){
        //do nothing
    } else{
         showPage(referrer);
    }

}

//======================================================================================================================= AUDIO PLAYER
function toggleAudio(id){
    "use strict";
    console.log("=============TOGGLE AUDIO "+id+" "+id.substr(0,5));
    var x=id.substr(14); selectedAudio=parseInt(x);
    var n=-1; for (var a=0; a<chunkbank.length; a++){if(chunkbank[a].id === x){n = a;}} if (n===-1){return;} //get relevant id from db
    if ($("#"+id+" .audioIcon").attr("src")==="images/audio_on.png") {
        //play audio
        var filename=chunkbank[n].soundfilename;
        //if (id.substr(0,5)==="kriol"){filename=chunkbank[n].kriol;}
        //var lang=filename.substr(0,3);
        //if (lang==="Dja"){ filename="Djamb"+filename.substr(3);} //set filename to selected lang
        //if (lang==="Gum" || lang==="Dha"){ filename=selectedlang+filename.substr(3);} //set filename to selected lang
        //filename+="_M.mp3";
        $(".audioIcon").attr("src","images/audio_on.png");
        $("#"+id+" .audioIcon").attr("src","images/audio_off.png");
    //console.log("filename: "+filename);
        playAudio(filename);
    } else {
        $(".audioIcon").attr("src","images/audio_on.png");
        audioOff();
        $(".playAllAudioIcon").attr("src","images/icon_play_white.png");
    }
}
function toggleKriolAudio(id){
    "use strict";
    selectedAudio=0;
  console.log("=============TOGGLE KRIOL AUDIO "+id+" ");
    if ($("#kriolAudio .audioIcon").attr("src")==="images/audio_on.png") {
        hideAudioPlayButtons();
        $(".iconHeadphones").attr("src", "images/icon_headphones.png");
        $("#kriolAudio .audioIcon").attr("src","images/audio_off.png");
        playAudio(id);
    } else {
        $("#kriolAudio .audioIcon").attr("src","images/audio_on.png");
        audioOff();
    }
}

function checkLoadedAudio(){
    "use strict";
    var audio = document.getElementById('audioPlayer');
    //show down audio unless playing translation or own recorded audio
  if(
        (currentpage==="entry" && $("#entryOption3 img").hasClass("colourOn"))
        ||
        (currentpage==="activity"&& currentActivityType===1 && $("#activityEntryPlayOption2 img").hasClass("colourOn"))
    ){
        audio.playbackRate=playbackspeed;
        if (chunkbank[selectedN].speaker==="Amy Dirn.gayg" && playbackspeed!==1){audio.playbackRate=0.6;} //if set to slow then slow down Amy a lot more
        if(playbackspeed!==1){//write to log if they are playing it slowly
          
        }
    } else {
        audio.playbackRate=1;
    }
    audio.play();
    audioError=0;
    //console.log("============ CHECK LOADED AUDIO page: "+currentpage+" | entry: "+selectedN+" | speaker: "+chunkbank[selectedN].speaker+" | audio loaded "+$("#audioPlayer").attr("src")+" | speed: "+audio.playbackRate);
}

function playAudio(filename) {
    "use strict";
    filename=audiopath+filename;
    //console.log("play audio "+filename);
  //filename="mp3/jananggarriba_ganyamurrma.mp3"; //for testing
    var audio = document.getElementById('audioPlayer');
    audio.setAttribute("src", filename);
    audio.load();
    
 }

var playAllFCounter=0;
var playAllCCounter=0;
function playAll(scr){
  if (scr==="favourites"){
    if ($("#favouritesresults .playAllAudioIcon").attr("src")==="images/icon_play_white.png") {
      //play first favourite
      playAllFCounter=0;
      var n = chunkbank.findIndex(chunk=>chunk.id===favourites[playAllFCounter].toString());
      var filename=chunkbank[n].soundfilename;
      $(".audioIcon").attr("src","images/audio_on.png");
      $("#favouritesresults .playAllAudioIcon").attr("src","images/icon_pause_white.png");
      $("#favoriteentry_"+favourites[playAllFCounter]+" .audioIcon").attr("src","images/audio_off.png");
      playAudio(filename);
    } else {
      $("#favouritesresults .playAllAudioIcon").attr("src","images/icon_play_white.png");
      $(".audioIcon").attr("src","images/audio_on.png");
      audioOff();
    }
  } else if (scr==="conversation"){
    if ($("#entry .playAllAudioIcon").attr("src")==="images/icon_play_white.png") {
      //play first conversation
      playAllCCounter=0;
      //get the phrase's index in the chunkbank array
      var m = chunkbank.findIndex(chunk=>chunk.id===entryConversation[playAllCCounter]);
      var filename=chunkbank[m].soundfilename;
      $(".audioIcon").attr("src","images/audio_on.png");
      $("#entry .playAllAudioIcon").attr("src","images/icon_pause_white.png");
      $("#conversaaudio_"+entryConversation[playAllCCounter]+" .audioIcon").attr("src","images/audio_off.png");
      playAudio(filename);
    } else {
      $("#entry .playAllAudioIcon").attr("src","images/icon_play_white.png");
      $(".audioIcon").attr("src","images/audio_on.png");
      audioOff();
    }
  }
}


function audioOff(){
    "use strict";
    var audio = document.getElementById('audioPlayer');
    audio.pause();
}


//=========================================================================================================================== INITIALISE APP

// capture callback
var recordedAudioPath;
var captureSuccess = function(mediaFiles) {
    var i, len;
    for (i = 0, len = mediaFiles.length; i < len; i += 1) {
        recordedAudioPath = mediaFiles[i].fullPath;
                console.log("recordedAudioPath "+recordedAudioPath);///var/mobile/Containers/Data/Application/97CE8C26-726D-4EA1-BBCE-B25B09F79632/tmp/audio_026.wav
    }
};

// capture error callback
var captureError = function(error) {
    console.log('Error code: ' + error.code, null, 'Capture Error');
        if(error.code===20){
            showAlert("Sorry but we need to use a voice recording app on your phone and we can't find one. <br><br>Try downloading an recording app like Voice Recorder to your phone first. <br><br>If you still can't record then let us know and we will try and fix it.");
        }
};




var app = {
    initialize: function() {
        "use strict";
        document.addEventListener('deviceready', this.onDeviceReady.bind(this), false);
    },

   onDeviceReady: function() {
       "use strict";
        this.receivedEvent('deviceready');
    },

    receivedEvent: function() {
        "use strict";
        $(".listening").css("display","none");
        $(".received").css("display","block");

        /*Put all plugin related calls in here*/
        console.log("DEVICE READY");

    }
};


function getQueryVariable(variable){
       var query = window.location.search.substring(1);
       var vars = query.split("&");
       for (var i=0;i<vars.length;i++) {
               var pair = vars[i].split("=");
               if(pair[0] == variable){
                   var str=decodeURIComponent(pair[1]);
                   return str;
               }
       }
       return(false);
}


$(document).ready(function(){
    "use strict";

    //populate language titles
  $(".languageText").html(languageCap);
  $(".translationText").html(translationCap);
  $("title, .appTitle, .appTitleExpanded").html(languageCap+" Listen and Talk");
    $(".versionInfo").html("<strong>Version: "+versionNo+"</strong>");
    $(".aboutInfo").html(projectInfo);
    $("title, .appTitle").html(appTitleShort);
    $(".appTitleExpanded").html(appTitleLong);



    $(".translateNo").html(translateNoText);
    $(".translateYes").html(translateYesText);

    $("#confirmCancel").click(function(){$("#confirm").css("display","none");});
    $(".cancel, .OKButton, #imageClose").click(function(){hidePopup();});
    $("#alert .popupBody, #alertOK, #alertText").click(function(){hideAlert();});


    //WARNING
    $("#warning .warningButton").click(function(){
        var gotoPage="dashboard";
        if (localStorage.getItem("mang-token")===null){ //see if they have a stored token
            gotoPage="token"; //need to get token
        } else {
            token=localStorage.getItem("mang-token");
        }
        setTimeout(function(){audioOff();showPage(gotoPage);},500);

    });

    //TOKEN
    $("#token .tokenButton").click(function(){ checkToken();});

    //MENU
    $(".menuButton, .menupage").click(function(){
        //check the menu button is not acting as a back button
        if($(".menuButton img").attr("src")==="images/icon_menu.png"){
            showPopup("menu");
        } else {
            //hide entry screen if menu button is actually a back button
            console.log("GO BACK - referrer "+referrer+" current page "+currentpage);
            if (referrer==="quiz" || referrer ==="memory" || referrer ==="activity"){
              //hide entry and go back to activity screen
              if (currentpage==="entry"){
                showPage("activity");
              } else {
                //go back to main activity screen
                showActivityHome();
              }
            } else if(referrer!==""){
              showPage(referrer);
            } else{
              showPage("dashboard");
            }
        }
    });

    $(".screenHeaderTop").click(function(){hideSearch();});
    $("#menuHeaderEditMoonLink").click(function(){showPage("editmoon");});
    $(".menuHeader").click(function(){hidePopup();});

    $("#disclaimerButton").click(function(){
        if (language==="mangarrayi"){
            location.href="https://www.elearnaustralia.com.au/mangarrayi/privacy/";
        } else {
            showPage("terms");
        }
    });
    $("#feedbackButton").click(function(){
        if (language==="mangarrayi"){
            showPage("feedback");
        }
    }); //link to feedback

    $("#aboutButton").click(function(){showPage("about");});



    //HEADER
    $(".headerPictureSearch").click(function(){showTopics();});
    $(".headerListSearch").click(function(){showFull();});
    $(".headerCategorySearch").click(function(){showCategory();});
  $(".headerFavourites").click(function(){showFaves();});
  $(".headerActivity").click(function(){showActivity();});

    //TOPICS
    $(".entryBack").click(function(){showPage(referrer);});

    //search
    $("#headerSearchResult").click(function(){hideSearch();});

    //Every time they hit enter it should hide the soft keyboard
    $('.searchInput').bind('keyup', function(e) {
        var code = e.keyCode || e.which;
        if(code === 13) { $('.searchInput').blur(); }
        var val=$(this).val(); $('.searchInput').val(val);
        if(val===""){hideSearch();}else{searchDictionary(val);}

    });

    $(".searchInput").focus(function(){
        //if(device.platform==="Android"){$(".screenHeaderBottom").css("display","none");}
    });

    $(".searchInput").blur(function(){
            //if(device.platform==="Android"){$(".screenHeaderBottom").css("display","flex");}
        });

    //BACK BUTTON ON ANDROID
    document.addEventListener("backbutton", onBackKeyDown, false);

    //AUDIO
    document.getElementById('audioPlayer').addEventListener("ended",function() {
        hideAudioPlayButtons(); //reset play button in entry screen
        $(".audioIcon").attr("src","images/audio_on.png"); //reset other play buttons
        $(".activityAnswerTextPlayOption img, .activityAnswerPlayOption img, #answerAudio0 img").attr("src","images/icon_play.png");
        $("#activity .mikeOption2 img").attr("src","images/icon_ear.png");//activity 3 audio icon
        $(".iconHeadphones").attr("src", "images/icon_headphones.png");

        //check play ALL
        if (currentpage==="favourites"&&$("#favouritesresults .playAllAudioIcon").attr("src")==="images/icon_pause_white.png") {
          playAllFCounter++;
          if (playAllFCounter<favourites.length){
            var n = chunkbank.findIndex(chunk=>chunk.id===favourites[playAllFCounter].toString());
            var filename=chunkbank[n].soundfilename;
            //allow a half second break between playback
            setTimeout(function(){
              $("#favoriteentry_"+favourites[playAllFCounter]+" .audioIcon").attr("src","images/audio_off.png");
              playAudio(filename);
            }, 500);
          } else {
            $("#favouritesresults .playAllAudioIcon").attr("src","images/icon_play_white.png");
          }
        } else if (currentpage==="entry" && $("#entry .playAllAudioIcon").attr("src")==="images/icon_pause_white.png") {
          playAllCCounter++;
          if (playAllCCounter<entryConversation.length){
            var m = chunkbank.findIndex(chunk=>chunk.id===entryConversation[playAllCCounter]);
            var filename=chunkbank[m].soundfilename;
            //allow a half second break between playback
            setTimeout(function(){
              $("#conversaaudio_"+entryConversation[playAllCCounter]+" .audioIcon").attr("src","images/audio_off.png");
              playAudio(filename);
            }, 500);
          } else {
            $("#entry .playAllAudioIcon").attr("src","images/icon_play_white.png");
          }
        }
    });


     $("#audioPlayer").bind('timeupdate', function(){
         if ($("#entryOption3 img").attr("src")==="images/icon_pause.png") {
            var audio = document.getElementById('audioPlayer');
            var track_length = audio.duration;
            var secs = audio.currentTime;
            var progress = (secs/track_length) * 100;
            if (progress>=0){$('.entryProgress').css("background-size",progress+"% 100%");}
         }
     });

    //catch missing audio files
    audioError=0;
    $("#audioPlayer").on("error", function () {
        var missingaudio=$("#audioPlayer").attr("src").substr(audiopath.length);
        console.log("Missing audio "+missingaudio);
        //try looking for the file online
        if (audioError===0){
            var filename=audiopathServer+missingaudio;
            var audio = document.getElementById('audioPlayer');
            audio.setAttribute("src", filename);
            audioError++;
            audio.load();
        } else if (audioError===1){
            showAlert("<p>Sorry, but there's a problem playing the sound file. Let us know so that we can improve the app. Tell us which entry you are playing and which type of phone you have (e.g. Android 8).</p> ");
             //$("#audioPlayer").attr("src").substr(audiopathServer.length));
            $(".audioIcon").attr("src","images/audio_on.png");
      hideAudioPlayButtons();
            audioError=0;
        }
    });


    $(".audioButtonDiv").click(function(){
        //entryAudioDiv_Eng_liver_0
        //entryAudioIcon_Yol_liver_0
        toggleAudio(this.id);
    });

    //swipe on entries in favourites to show remove starRemove
    /*var swipeRemove = document.getElementById("favourites");
    var swipeRemoveDetect = new Hammer(swipeRemove);
    swipeRemoveDetect.on("swipeleft", function(ev) {  console.log("ev.target.id "+ev.target.id);  }); //
    swipeRemoveDetect.on("swiperight", function(ev) { console.log("ev.target.id "+ev.target.id);  });
    */

    $("input[type=text], input[type=email], input[type=password], textarea").click(function(){ $(this).focus();}); //this fixes text inputs sometimes not selecting on short tap

    if (language!=="mangarrayi"){
        //get customised glossing colours from the DB
        $.getJSON(apiPath+"get-glossing.php?table="+language, function(data) {
            if (data!==0) {
                var extraCSS="";
                data.forEach((item, i) => {
                    if (item.title!==""){ //only group 2 has colours
                        switch (item.id) {
                            case "1": extraCSS+=".colour1{font-weight:bold;color:inherit;}"; break;
                            case "2": extraCSS+=".colour2{font-style:italic; color:inherit;}"; break;
                            default: extraCSS+=".colour"+item.id+"{color: #"+item.colour+";} ";
                        }
                    }
                });
                $("#modifiedStyles").html(extraCSS);
                }
        });
    }


    getDictionary();
    getConversations();
  setupTopics();
    //getSpeakers();
});

//ANDROID listener when app moves to foreground - when picking contact
/*function onResume(resumeEvent) {
    "use strict";
    if(resumeEvent.pendingResult) {
        if(resumeEvent.pendingResult.pluginStatus === "OK") {
            var contact = navigator.contacts.create(resumeEvent.pendingResult.result);
            //console.log(JSON.stringify(contact));
        } else {
            //console.log("error getting contact "+resumeEvent.pendingResult.result);
        }
    }
}*/

window.addEventListener('load', function () {
        FastClick.attach(document.body);
    }, false);


$(document).click(function (e){
    "use strict";
    //if(e.target.className!=="searchresult"){hideSearch();}
});


app.initialize();

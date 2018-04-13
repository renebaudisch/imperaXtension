let loginSubmit = document.getElementById('loginSubmit');

var imperaXtension = {
    humanDate: function msToTime(duration) {
        var seconds = parseInt((duration/1000)%60)
            , minutes = parseInt((duration/(1000*60))%60)
            , hours = parseInt((duration/(1000*60*60))%24)
            , days = parseInt((duration/(1000*60*60*24))%7);

        days = (days === 0) ? "" : ((days === 1) ? days + " Tag" : days + " Tage");
        hours = (hours < 10) ? "0" + hours : hours;
        minutes = (minutes < 10) ? "0" + minutes : minutes;
        seconds = (seconds < 10) ? "0" + seconds : seconds;

        return days + " " + hours + ":" + minutes + ":" + seconds;
    },
    renderGameList: function() {
        var gameList = document.createElement('div');
        gameList.setAttribute('class', "gamelist");
        gameList.innerHTML = "<div class='headline'>Du bist in diesen " + backend.imperaXtension.gameCounter + " Spielen am Zug:</div>";
        for (var i = 0; i < backend.imperaXtension.gameList.length; i++) {
            gameList.innerHTML += "<div><a target='_blank' href='https://www.imperaonline.de/play/" + backend.imperaXtension.gameList[i].id + "'>" +
                "<div class='gameName'>" + backend.imperaXtension.gameList[i].name + "</div>" +
                "<div class='gameTime'>" + imperaXtension.humanDate(backend.imperaXtension.gameList[i].timeoutSecondsLeft * 1000) + "</div>" +
                "</a></div>";
        }
        document.getElementById('gameList').innerHTML = "";
        document.getElementById('gameList').appendChild(gameList);
    }

};
chrome.storage.sync.get('imperaOnline', function(data) {
    data = data.imperaOnline;
    if (data.user && data.pass) {
        if (!data.auth.access_token) {
            document.getElementById('loginName').value = data.user;
            document.getElementById('loginPass').value = data.pass;
        } else {
            if (window.backend) {
                if (backend.imperaXtension.gameList && backend.imperaXtension.gameList.length > 0){
                    imperaXtension.renderGameList();
                } else {
                    document.getElementById("gameList").innerHTML = "<div class='headline'>Spiel&uuml;bersicht wird geladen...</div>";
                }
            }
            document.querySelector('#loginContainer').style.display ="none";
            document.querySelector('#loggedInContainer').style.display ="block";
        }
    } else {
        document.querySelector('#loginContainer').style.display ="block";
        document.querySelector('#loggedInContainer').style.display ="none";
    }
});

var backend = chrome.extension.getBackgroundPage();
chrome.extension.getBackgroundPage().frontend = this;

loginSubmit.onclick = function() {
    var user = document.getElementById('loginName').value;
    var pass = document.getElementById('loginPass').value;
    backend.imperaXtension.login(user, pass);
};

logout.onclick = function() {
    backend.imperaXtension.logout();
    document.querySelector('#loginContainer').style.display ="block";
    document.querySelector('#loggedInContainer').style.display ="none";
};

let loginSubmit = document.getElementById('loginSubmit');

chrome.storage.sync.get('imperaOnline', function(data) {
    data = data.imperaOnline;
    if (data.user && data.pass) {
        if (!data.auth.access_token) {
            document.getElementById('loginName').value = data.user;
            document.getElementById('loginPass').value = data.pass;
        } else {
            if (backend.imperaXtension.gameCounter > 0) {
                document.getElementById("gameList").innerText = "Du bist in diesen " + backend.imperaXtension.gameCounter + " Spielen am Zug:";
            } else {
                document.getElementById("gameList").innerText = "Du bist leider in keinem Spiel am Zug :(";
            }
            document.querySelector('#loginContainer').style.display =" none";
        }
    } else {
        document.querySelector('#loginContainer').style.display =" block";
    }
});

var backend = chrome.extension.getBackgroundPage();
chrome.extension.getBackgroundPage().frontend = this;

loginSubmit.onclick = function() {
    var user = document.getElementById('loginName').value;
    var pass = document.getElementById('loginPass').value;
    backend.imperaXtension.login(user, pass);
};

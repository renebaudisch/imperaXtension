chrome.runtime.onInstalled.addListener(function() {
    chrome.storage.sync.set({
        imperaOnline: {
            user: "",
            pass: "",
            auth: {},
            gameCounter: 0,
            gameList: []
        }
    });
});

var imperaXtension = {
    login: function(user, pass) {
        imperaXtension.user = user;
        imperaXtension.pass = pass;
        let xhr = new XMLHttpRequest();
        xhr.onreadystatechange = function() {
            if (xhr.readyState === 4) {
                let imperaOnlineAuth = JSON.parse(xhr.responseText);
                imperaXtension.auth = imperaOnlineAuth;
                chrome.storage.sync.set({
                    imperaOnline: {
                        user: imperaXtension.user,
                        pass: imperaXtension.pass,
                        auth: imperaOnlineAuth
                    }
                });
                setTimeout(function() {
                    imperaXtension.login(imperaXtension.user, imperaXtension.pass);
                }, (imperaOnlineAuth.expires_in * 1000) - 1000);
                frontend.document.querySelector('#loginContainer').style.display =" none";
                imperaXtension.getSummary();
                setInterval(imperaXtension.getSummary, 5000);
            }
        };
        xhr.open("POST", "https://www.imperaonline.de/api/Account/token?", true);
        xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
        xhr.send("grant_type=password"+
            "&username=" + user +
            "&password=" + pass +
            "&scope=openid%20offline_access%20roles");
    },
    getSummary: function(){
        let xhr = new XMLHttpRequest();
        xhr.onreadystatechange = function() {
            if (xhr.readyState === 4) {
                // innerText does not let the attacker inject HTML elements.
                let summary = JSON.parse(xhr.responseText);
                imperaXtension.gameCounter = summary.numberOfGames;
                imperaXtension.messageCounter = summary.numberOfMessages;
                let logoNumber = (imperaXtension.gameCounter > 9) ? "10" : imperaXtension.gameCounter;
                if (imperaXtension.gameCounter > 0) {
                    frontend.document.getElementById("gameList").innerText = "Du bist in diesen " + imperaXtension.gameCounter + " Spielen am Zug:";
                    chrome.browserAction.setBadgeBackgroundColor({color:[255, 0, 0, 130]});
                    chrome.browserAction.setBadgeText({text: String(logoNumber)});
                } else {
                    frontend.getElementById("gameList").innerText = "Du bist leider in keinem Spiel am Zug :(";
                    chrome.browserAction.setBadgeBackgroundColor({color:[190, 190, 190, 230]});
                    chrome.browserAction.setBadgeText({text: ""});
                }
                /*chrome.browserAction.setIcon({
                    tabId: undefined,
                    path : "/assets/img/logo" + logoNumber + ".png"
                });*/
            }
        };
        xhr.open("GET", "https://www.imperaonline.de/api/notifications/summary", true);
        xhr.setRequestHeader('Authorization', imperaXtension.auth.token_type + ' ' + imperaXtension.auth.access_token);
        xhr.send();
    }
};

var imperaXtension = {
    summaryTimer: 0,
    passToken: function(){
        let imperaStorage = sessionStorage.impera;
        if (imperaStorage) {
            imperaStorage = JSON.parse(imperaStorage);
            imperaStorage.auth_token = imperaXtension.auth.access_token;
            imperaStorage.refresh_token = imperaXtension.auth.refresh_token;
            imperaStorage.isLoggedIn = true;
            imperaStorage.notifications = {
                numberOfGames: imperaXtension.gameCounter,
                numberOfMessages: imperaXtension.messageCounter
            };
            sessionStorage.setItem("impera", imperaStorage);
        }

    },
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
                imperaXtension.loginTimer = setTimeout(function() {
                    clearInterval(imperaXtension.summaryTimer);
                    imperaXtension.login(imperaXtension.user, imperaXtension.pass);
                }, (imperaOnlineAuth.expires_in * 1000) - 1000);
                if (window.frontend){
                    frontend.document.querySelector('#loginContainer').style.display ="none";
                    frontend.document.querySelector('#loggedInContainer').style.display ="block";
                }
                imperaXtension.getSummary();
                imperaXtension.summaryTimer = setInterval(imperaXtension.getSummary, 5000);
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
            if (xhr.readyState === 4  && xhr.status === 200) {
                let summary = JSON.parse(xhr.responseText);
                imperaXtension.gameCounter = summary.numberOfGames;
                imperaXtension.messageCounter = summary.numberOfMessages;
                let logoNumber = (imperaXtension.gameCounter > 9) ? "10" : imperaXtension.gameCounter;
                if (imperaXtension.gameCounter > 0) {
                    chrome.browserAction.setBadgeBackgroundColor({color:[255, 0, 0, 130]});
                    chrome.browserAction.setBadgeText({text: String(logoNumber)});
                    if (window.frontend){
                        imperaXtension.getGameList();
                    }
                } else {
                    chrome.browserAction.setBadgeBackgroundColor({color:[190, 190, 190, 230]});
                    chrome.browserAction.setBadgeText({text: ""});
                    if (window.frontend){
                        imperaXtension.gameList = [];
                        frontend.document.getElementById("gameList").innerText = "Du bist leider in keinem Spiel am Zug :(";
                    }
                }
            }
        };
        xhr.open("GET", "https://www.imperaonline.de/api/notifications/summary", true);
        xhr.setRequestHeader('Authorization', imperaXtension.auth.token_type + ' ' + imperaXtension.auth.access_token);
        xhr.send();
    },
    getGameList: function() {
        let xhr = new XMLHttpRequest();
        xhr.onreadystatechange = function() {
            if (xhr.readyState === 4) {
                imperaXtension.gameList = JSON.parse(xhr.responseText);
                frontend.imperaXtension.renderGameList();
            }
        };
        xhr.open("GET", "https://www.imperaonline.de/api/games/myturn", true);
        xhr.setRequestHeader('Authorization', imperaXtension.auth.token_type + ' ' + imperaXtension.auth.access_token);
        xhr.send();
    },
    logout: function() {
        clearInterval(imperaXtension.summaryTimer);
        chrome.storage.sync.set({
            imperaOnline: {}
        });
        imperaXtension.gameList = [];
        imperaXtension.gameCounter = 0;
        imperaXtension.messageCounter = 0;
        imperaXtension.user = "";
        imperaXtension.pass = "";
        imperaXtension.auth = {};

        chrome.browserAction.setBadgeBackgroundColor({color:[190, 190, 190, 230]});
        chrome.browserAction.setBadgeText({text: ""});
    }
};

chrome.storage.sync.get('imperaOnline', function(data) {
    data = data.imperaOnline;
    if (data.user && data.pass) {
        imperaXtension.login(data.user, data.pass);
    }
});
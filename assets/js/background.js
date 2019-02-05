chrome.runtime.onInstalled.addListener(function() {
    chrome.storage.sync.set({
        imperaOnline: {}
    });
});

var imperaXtension = {
    summaryTimer: 0,
    joinCounter: 0,
    gameCounter: 0,
    supportedLanguages: ["en", "de"],
    openTab: function(url) {
        imperaXtension.popUpUrl = url;
        chrome.tabs.create({
            url: "https://www.imperaonline.de"
        }, function(tab){
            imperaXtension.gameTabId = tab.id;
            if (imperaXtension.auth && imperaXtension.auth.access_token) {
                imperaXtension.passToken(tab);
            }
        })
    },
    passToken: function(tab){
        let imperaStorage = sessionStorage.impera || "{}";
        imperaStorage = JSON.parse(imperaStorage);
        imperaStorage.access_token = imperaXtension.auth.access_token;
        imperaStorage.refresh_token = imperaXtension.auth.refresh_token;
        imperaStorage.isLoggedIn = true;
        imperaStorage.notifications = {
            numberOfGames: String(imperaXtension.gameCounter),
            numberOfOpenGames: String(imperaXtension.joinCounter),
            numberOfMessages: String(imperaXtension.messageCounter)
        };
        imperaStorage.userInfo = imperaXtension.userInfo;
        imperaStorage.language = imperaXtension.language || "en";
        chrome.tabs.executeScript(tab.id, {code: 'sessionStorage.setItem("impera", \'' + JSON.stringify(imperaStorage) + '\');'}, function() {
            chrome.tabs.update(imperaXtension.gameTabId, {url: imperaXtension.popUpUrl})
        });
    },
    login: function(user, pass) {
        imperaXtension.user = user;
        imperaXtension.pass = pass;
        imperaXtension.language = (imperaXtension.supportedLanguages.join(",").indexOf((navigator.language.split("-"))[0]) > 1) ? (navigator.language.split("-"))[0] : "en";
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
                imperaXtension.getUserInfo();
                imperaXtension.getOpenSpringGames();
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
            if (xhr.readyState === 4 && xhr.status === 200) {
                let summary = JSON.parse(xhr.responseText);
                imperaXtension.gameCounter = summary.numberOfGames;
                imperaXtension.messageCounter = summary.numberOfMessages;
                let logoNumber = imperaXtension.gameCounter + imperaXtension.joinCounter;
                if (logoNumber > 0) {
                    chrome.browserAction.setBadgeBackgroundColor({color:[255, 0, 0, 130]});
                    chrome.browserAction.setBadgeText({text: String(logoNumber)});
                    if (imperaXtension.gameCounter > 0) {
                        imperaXtension.getGameList();
                    }
                    if (window.frontend && imperaXtension.joinCounter > 0){
                        frontend.imperaXtension.renderOpenGamesList();
                    }
                } else {
                    chrome.browserAction.setBadgeBackgroundColor({color:[190, 190, 190, 230]});
                    chrome.browserAction.setBadgeText({text: ""});
                    if (window.frontend){
                        imperaXtension.gameList = [];
                        frontend.document.getElementById("gameList").innerHTML = "<div style='text-align:center;cursor: not-allowed;'>" + frontend.imperaXtension.texts.noGame[imperaXtension.language]() + "</div>";
                    }
                }
            } else if (xhr.status === 401) {
                if (imperaXtension.userData.user && imperaXtension.userData.pass) {
                    imperaXtension.login(imperaXtension.userData.user, imperaXtension.userData.pass);
                } else {
                    imperaXtension.logout();
                }
            }
        };
        xhr.open("GET", "https://www.imperaonline.de/api/notifications/summary", true);
        xhr.setRequestHeader('Authorization', imperaXtension.auth.token_type + ' ' + imperaXtension.auth.access_token);
        xhr.send();
    },
    getUserInfo: function() {
        let xhr = new XMLHttpRequest();
        xhr.onreadystatechange = function() {
            if (xhr.readyState === 4 && xhr.status === 200) {
                imperaXtension.userInfo = JSON.parse(xhr.responseText);
            }
        };
        xhr.open("GET", "https://www.imperaonline.de/api/Account/UserInfo", true);
        xhr.setRequestHeader('Authorization', imperaXtension.auth.token_type + ' ' + imperaXtension.auth.access_token);
        xhr.send();
    },
    getGameList: function() {
        let xhr = new XMLHttpRequest();
        xhr.onreadystatechange = function() {
            if (xhr.readyState === 4 && xhr.status === 200) {
                imperaXtension.gameList = JSON.parse(xhr.responseText);
                if (window.frontend){
                    frontend.imperaXtension.renderGameList();
                }
            } else if (xhr.status === 200) {
                if (imperaXtension.userData.user && imperaXtension.userData.pass) {
                    imperaXtension.login(imperaXtension.userData.user, imperaXtension.userData.pass);
                } else {
                    imperaXtension.logout();
                }
            }
        };
        xhr.open("GET", "https://www.imperaonline.de/api/games/myturn", true);
        xhr.setRequestHeader('Authorization', imperaXtension.auth.token_type + ' ' + imperaXtension.auth.access_token);
        xhr.send();
    },
    getOpenSpringGames: function() {
        imperaXtension.joinList = [];
        imperaXtension.joinCounter = 0;

        let xhr = new XMLHttpRequest();
        xhr.onreadystatechange = function() {
            if (xhr.readyState === 4 && xhr.status === 200) {
                let allMyGames = JSON.parse(xhr.responseText);
                imperaXtension.allMyGames = {};
                for (let i=0; i < allMyGames.length; i++) {
                    imperaXtension.allMyGames[allMyGames[i].id] = true;
                }
                let xhr2 = new XMLHttpRequest();
                xhr2.onreadystatechange = function() {
                    if (xhr2.readyState === 4 && xhr2.status === 200) {
                        let openGames = JSON.parse(xhr2.responseText);
                        for (let i=0; i < openGames.length; i++) {
                            if (!imperaXtension.allMyGames[openGames[i].id] && openGames[i].createdByName.match(/^(imperator|caesarius|deefault|feuerdieb)$/i)) {
                                imperaXtension.joinList.push(openGames[i]);
                                imperaXtension.joinCounter++;
                            }
                        }
                        clearInterval(imperaXtension.summaryTimer);
                        imperaXtension.getSummary();
                        imperaXtension.summaryTimer = setInterval(imperaXtension.getSummary, 5000);
                    }
                };
                xhr2.open("GET", "https://www.imperaonline.de/api/games/open", true);
                xhr2.setRequestHeader('Authorization', imperaXtension.auth.token_type + ' ' + imperaXtension.auth.access_token);
                xhr2.send();
            }
        };
        xhr.open("GET", "https://www.imperaonline.de/api/games/my", true);
        xhr.setRequestHeader('Authorization', imperaXtension.auth.token_type + ' ' + imperaXtension.auth.access_token);
        xhr.send();
    },
    logout: function() {
        clearInterval(imperaXtension.summaryTimer);
        chrome.storage.sync.set({
            imperaOnline: {}
        });
        imperaXtension.gameList = undefined;
        imperaXtension.joinList = undefined;
        imperaXtension.gameCounter = 0;
        imperaXtension.joinCounter = 0;
        imperaXtension.messageCounter = 0;
        imperaXtension.user = "";
        imperaXtension.pass = "";
        imperaXtension.auth = {};

        chrome.browserAction.setBadgeBackgroundColor({color:[190, 190, 190, 230]});
        chrome.browserAction.setBadgeText({text: ""});
    }
};

chrome.storage.sync.get('imperaOnline', function(data) {
    imperaXtension.userData = data = data.imperaOnline;
    if (data && data.user && data.pass) {
        imperaXtension.login(data.user, data.pass);
    }
});
let loginSubmit = document.getElementById('loginSubmit');

chrome.storage.sync.get('imperaOnline', function(data) {
    data = data.imperaOnline;
    if (data.user && data.pass) {
        if (!data.auth.access_token) {
            document.getElementById('loginName').value = data.user;
            document.getElementById('loginPass').value = data.pass;
        } else {
            document.querySelector('#loginContainer').style.display =" none";
            setInterval(imperaXtension.getSummary, 5000);
        }
    } else {
        document.querySelector('#loginContainer').style.display =" block";
    }
});

let imperaXtension = {
    login: function() {
        let user = document.getElementById('loginName');
        let pass = document.getElementById('loginPass');
        let xhr = new XMLHttpRequest();
        xhr.onreadystatechange = function() {
            if (xhr.readyState === 4) {
                let imperaOnlineAuth = JSON.parse(xhr.responseText);
                chrome.storage.sync.set({
                    imperaOnline: {
                        user: document.getElementById('loginName').value,
                        pass: document.getElementById('loginPass').value,
                        auth: imperaOnlineAuth
                    }
                });
                setTimeout(imperaXtension.login, imperaOnlineAuth.expires_in - 100)
            }
        };
        xhr.open("POST", "https://www.imperaonline.de/api/Account/token?", true);
        xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
        xhr.send("grant_type=password"+
            "&username=" + user.value +
            "&password=" + pass.value +
            "&scope=openid%20offline_access%20roles");
    },
    getSummary: function(){
        let xhr = new XMLHttpRequest();
        xhr.onreadystatechange = function() {
            if (xhr.readyState === 4) {
                // innerText does not let the attacker inject HTML elements.
                let summary = JSON.parse(xhr.responseText);
                if (summary.numberOfGames > 0) {
                    document.getElementById("gameList").innerText = "Du bist in diesen " + summary.numberOfGames + " Spielen am Zug:";
                } else {
                    document.getElementById("gameList").innerText = "Du bist leider in keinem Spiel am Zug :(";
                }
            }
        };
        xhr.open("GET", "https://www.imperaonline.de/api/notifications/summary", true);
        xhr.setRequestHeader('Authorization', data.auth.token_type + ' ' + data.auth.access_token);
        xhr.send();
    }
};

loginSubmit.onclick = imperaXtension.login;

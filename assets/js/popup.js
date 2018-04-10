let loginSubmit = document.getElementById('loginSubmit');

chrome.storage.sync.get('imperaOnline', function(data) {
    data = data.imperaOnline;
    if (data.user && data.pass) {
        if (!data.auth.access_token) {
            document.getElementById('loginName').value = data.user;
            document.getElementById('loginPass').value = data.pass;
        } else {
            document.querySelector('#loginContainer').style.display =" none";
            let xhr = new XMLHttpRequest();
            xhr.onreadystatechange = function() {
                if (xhr.readyState === 4) {
                    // innerText does not let the attacker inject HTML elements.
                    document.getElementById("gameList").innerText = xhr.responseText;
                }
            };
            xhr.open("GET", "https://www.imperaonline.de/api/notifications/summary", true);
            xhr.setRequestHeader('Authorization', data.auth.token_type + ' ' + data.auth.access_token);
            xhr.send();
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
                chrome.storage.sync.set({
                    imperaOnline: {
                        user: document.getElementById('loginName').value,
                        pass: document.getElementById('loginPass').value,
                        auth: JSON.parse(xhr.responseText)
                    }
                });
            }
        };
        xhr.open("POST", "https://www.imperaonline.de/api/Account/token?", true);
        xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
        xhr.send("grant_type=password"+
            "&username=" + user.value +
            "&password=" + pass.value +
            "&scope=openid%20offline_access%20roles");
    }
};

loginSubmit.onclick = imperaXtension.login;

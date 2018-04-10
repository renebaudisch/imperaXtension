let loginSubmit = document.getElementById('loginSubmit');

chrome.storage.sync.get('imperaOnline', function(data) {
    if (!data.user && !data.pass) {
        let xhr = new XMLHttpRequest();
        xhr.onreadystatechange = function() {
            if (xhr.readyState === 4) {
                // innerText does not let the attacker inject HTML elements.
                document.getElementById("resp").innerText = xhr.responseText;
            }
        };
        xhr.url = xhr.open("GET", "https://www.imperaonline.de/api/notifications/summary", true);
        xhr.send();
    } else {
        document.querySelector('#loginContainer').style.display =" none";
    }
});

loginSubmit.onclick = function() {
    let user = document.getElementById('loginPass');
    let pass = document.getElementById('loginUser');
    let xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function(data) {
        if (xhr.readyState === 4) {
            chrome.storage.imperaOnline.user = user.value;
            chrome.storage.imperaOnline.pass = pass.value;
            chrome.storage.imperaOnline.tocken = data.token;
        }
    };
    xhr.url = xhr.open("POST", "https://www.imperaonline.de/api/Account/token?", true);
    xhr.send();
};
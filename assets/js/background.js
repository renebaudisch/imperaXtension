chrome.runtime.onInstalled.addListener(function() {
    chrome.storage.sync.set({
        imperaOnline: {
            user: "",
            pass: "",
            gameCounter: 0,
            gameList: []
        }
    });
    chrome.declarativeContent.onPageChanged.removeRules(undefined, function() {
        chrome.declarativeContent.onPageChanged.addRules([{
            conditions: [new chrome.declarativeContent.PageStateMatcher({
                pageUrl: {schemes: ['http','https']},
            })
            ],
            actions: [new chrome.declarativeContent.ShowPageAction()]
        }]);
    });
});
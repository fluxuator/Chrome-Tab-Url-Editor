chrome.tabs.onUpdated.addListener(function(id, info, tab) {
    if (tab.url) {
        chrome.pageAction.show(tab.id);
    }
});

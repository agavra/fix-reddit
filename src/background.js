browser.runtime.onInstalled.addListener(() => {
  browser.declarativeNetRequest.updateEnabledRulesets({
    enableRulesetIds: ["reddit_desktop_redirects"]
  }).catch(() => {});
});

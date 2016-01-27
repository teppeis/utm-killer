'use strict';

chrome.runtime.onInstalled.addListener(details => {
  console.log('previousVersion', details.previousVersion);
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (!changeInfo.status) {
    // only favIconUrl is changed
    return;
  }

  let queryStringIndex = tab.url.indexOf('?');
  if (tab.url.indexOf('utm_') > queryStringIndex) {
    let stripped = tab.url.replace(
      /([\?\&]utm_(source|medium|term|campaign|content|cid|reader)=[^&#]+)/ig,
      ''
    );
    if (stripped.charAt(queryStringIndex) === '&') {
      stripped = stripped.substr(0, queryStringIndex) + '?' +
        stripped.substr(queryStringIndex + 1);
    }
    if (stripped !== tab.url) {
      if (/'/.test(stripped)) {
        console.error('invalid url', stripped);
        return;
      }
      let code = `window.location.replace('${stripped}')`;
      let details = {
        code,
        runAt: 'document_start'
      };
      chrome.tabs.executeScript(tab.id, details, (result) => {
        console.log('replaced', stripped, result);
      });
    }
  }
});

'use strict';

// MIT License by Jo Liss <joliss42@gmail.com>
// https://github.com/joliss/js-string-escape
function esc(string) {
  return String(string).replace(/["'\\\n\r\u2028\u2029]/g, character => {
    // Escape all characters not included in SingleStringCharacters and
    // DoubleStringCharacters on
    // http://www.ecma-international.org/ecma-262/5.1/#sec-7.8.4
    switch (character) {
      case '"':
      case "'":
      case '\\':
        return `\\${character}`;
      // Four possible LineTerminator characters need to be escaped:
      case '\n':
        return '\\n';
      case '\r':
        return '\\r';
      case '\u2028':
        return '\\u2028';
      case '\u2029':
        return '\\u2029';
      default:
        throw new Error(`Unexpected character: ${character}`);
    }
  });
}

chrome.runtime.onInstalled.addListener(details => {
  console.log('previousVersion', details.previousVersion);
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (!changeInfo.status) {
    // only favIconUrl is changed
    return;
  }

  const url = new URL(tab.url);
  if (!url.search) {
    return;
  }

  let strippedSearch = url.search
    .replace(/^\?/, '')
    .split('&')
    .filter(param => !/^utm_/.test(param))
    // marketo
    .filter(param => !/^mkt_tok=/.test(param))
    // oreilly?
    .filter(param => !/^imm_mid=/.test(param))
    .join('&');

  if (strippedSearch) {
    strippedSearch = `?${strippedSearch}`;
  }

  if (url.search === strippedSearch) {
    return;
  }

  url.search = strippedSearch;
  const strippedUrl = url.toString();

  const code = `history.replaceState(null, null, '${esc(strippedUrl)}')`;
  const details = {
    code,
    runAt: 'document_start',
  };
  chrome.tabs.executeScript(tab.id, details, result => {
    console.log('replaced', strippedUrl, result);
  });
});

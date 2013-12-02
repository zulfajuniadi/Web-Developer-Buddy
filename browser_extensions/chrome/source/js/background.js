var activeUrls = window.localStorage.getItem('activeTabs');
var resources = window.localStorage.getItem('PERSISTANCE:Resources');
if (activeUrls === null) {
    activeUrls = [];
} else {
    activeUrls = JSON.parse(activeUrls);
}
if (resources === null) {
    resources = [];
} else {
    resources = JSON.parse(resources);
}
console.log(activeUrls)

function parseUrl(url) {
    var parser = document.createElement('a');
    parser.href = url;
    return {
        protocol: parser.protocol,
        host: parser.host,
        hostname: parser.hostname,
        port: parser.port,
        pathname: parser.pathname,
        hash: parser.hash,
        search: parser.search
    }
}

function injectScript(tab, configObj) {
    var fn = [";(function(values) {","    var scr = document.createElement('script');","    function parseUrl(url) {","        var parser = document.createElement('a');","        parser.href = url;","        return {","            protocol: parser.protocol,","            host: parser.host,","            hostname: parser.hostname,","            port: parser.port,","            pathname: parser.pathname,","            hash: parser.hash,","            search: parser.search","        };","    };","    var currentUrl = parseUrl(window.location.href);","    var config = {","        paths: values.path,","        extensions: values.filetypes,","        less: []","    };","    if (values.lessIn !== undefined) {","        values.lessIn.forEach(function(input, idx) {","            if (values.lessOut !== undefined) {","                if (values.lessOut[idx] !== undefined) {","                    var o = {};","                    o[input] = values.lessOut[idx];","                    return config.less.push(o);","                }","                var o = {};","                o[input] = input.replace('less', 'css');","                return config.less.push(o);","            }","            var o = {};","            o[input] = input.replace('less', 'css');","            return config.less.push(o);","        });","    };","  scr.src = (currentUrl.protocol) + '//localhost:8684/webdevbuddy.js';  scr.innerHTML = JSON.stringify(config);","    document.body.appendChild(scr);","    ;","})(" + JSON.stringify(configObj) + ");"].join("\r\n");
    chrome.tabs.executeScript(tab.id, {code : fn});
}

function deactivateWebDeveloperBuddy(tab) {
    var parsedUrl = parseUrl(tab.url);
    var tabUrl = parsedUrl.protocol + '//' + parsedUrl.host;

    if (activeUrls.indexOf(tabUrl) > -1) {
        activeUrls = activeUrls.filter(function(url) {
            return url !== tabUrl;
        });
        window.localStorage.setItem('activeTabs', JSON.stringify(activeUrls));
        chrome.tabs.executeScript(tab.id, {code : "window.location.reload(true)"});
    }
    chrome.browserAction.setIcon({
        tabId: tab.id,
        path: 'icons/icon19_disabled.png'
    });
}

function activateWebDeveloperBuddy(tab) {
    var parsedUrl = parseUrl(tab.url);
    var tabUrl = parsedUrl.protocol + '//' + parsedUrl.host;
    resources = window.localStorage.getItem('PERSISTANCE:Resources');
    if (resources === null) {
        resources = [];
    } else {
        resources = JSON.parse(resources);
    }
    var config = resources.filter(function(conf) {
        return conf.hosts.indexOf(tabUrl) > -1;
    });
    if (config.length === 0) {
        window.localStorage.setItem('__newUrl', tabUrl);
        var options = chrome.extension.getURL('src/options/options.html');
        chrome.tabs.create({
            url: options + '#/resources/new'
        });
    } else {
        injectScript(tab, config[0]);
    }
    if (activeUrls.indexOf(tabUrl) === -1) {
        activeUrls.push(tabUrl);
        window.localStorage.setItem('activeTabs', JSON.stringify(activeUrls));
    }
    chrome.browserAction.setIcon({
        tabId: tab.id,
        path: 'icons/icon19.png'
    });
}

function handleBrowserActionClick(tab) {
    var parsedUrl = parseUrl(tab.url);
    var tabUrl = parsedUrl.protocol + '//' + parsedUrl.host;
    if(tabUrl.indexOf('http') > -1) {
	    if (activeUrls.indexOf(tabUrl) > -1) {
	        return deactivateWebDeveloperBuddy(tab);
	    }
	    return activateWebDeveloperBuddy(tab);
    }
}

function handleBrowserLoad(tab) {
    var parsedUrl = parseUrl(tab.url);
    var tabUrl = parsedUrl.protocol + '//' + parsedUrl.host;
    if (activeUrls.indexOf(tabUrl) > -1) {
        return activateWebDeveloperBuddy(tab);
    }
    return deactivateWebDeveloperBuddy(tab);
}

chrome.tabs.onUpdated.addListener(function(tabId, info) {
    if (info.status == "complete") {
        chrome.tabs.get(tabId, function(tab) {
            handleBrowserLoad(tab);
        });
    }
});

chrome.browserAction.onClicked.addListener(function(tab) {
    handleBrowserActionClick(tab);
});
;(function(values) {
    var script = document.createElement('script');
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
        };
    };
    var currentUrl = parseUrl(window.location.href);
    var config = {
        path: values.path,
        extensions: values.filetypes,
        less: []
    };
    if (values.lessIn !== undefined) {
    	/* check if values are array, if not then make both lessIn and lessOut an array */
    	if(typeof values.lessIn.pop === 'undefined' && typeof values.lessIn.push === 'undefined') {
			values.lessIn = [values.lessIn];
			values.lessOut = [values.lessOut];
    	}
        values.lessIn.forEach(function(input, idx) {
            if (values.lessOut !== undefined) {
                if (values.lessOut[idx] !== undefined) {
                    var o = {};
                    o[input] = values.lessOut[idx];
                    return config.less.push(o);
                }
                var o = {};
                o[input] = input.replace('less', 'css');
                return config.less.push(o);
            }
            var o = {};
            o[input] = input.replace('less', 'css');
            return config.less.push(o);
        });
    };
    script.innerHTML = JSON.stringify(config);
    document.body.appendChild(script);
    script.src = currentUrl.protocol + '//localhost:8684/webdevbuddy.js';
})();
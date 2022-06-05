/**
 *  Jiji Framework HttpClient 2021
 *  Author : Jeremy Guyet
 *  Version : 0.0.5
 */
 var HttpClient = {
    get: (query, callbacks) => HttpClient.query({
        url: null,
        headers: {},
        body: null,
        method: 'GET',
        bodyParser: 'text'
    }, query, callbacks),
    post: (query, callbacks) => HttpClient.query({
        url: null,
        headers: {},
        body: null,
        method: 'POST',
        bodyParser: 'text'
    }, query, callbacks),
    patch: (query, callbacks) => HttpClient.query({
        url: null,
        headers: {},
        body: null,
        method: 'PATCH',
        bodyParser: 'text'
    }, query, callbacks),
    delete: (query, callbacks) => HttpClient.query({
        url: null,
        headers: {},
        body: null,
        method: 'DELETE',
        bodyParser: 'text'
    }, query, callbacks),
    put: (query, callbacks) => HttpClient.query({
        url: null,
        headers: {},
        body: null,
        method: 'PUT',
        bodyParser: 'text'
    }, query, callbacks),
    query: (defaultQuery, query, callbacks = [() /** Sucess */ => {}, () /** Failure */ => {}]) => {
        Object.keys(defaultQuery).forEach(x => { if (query[x] == undefined) query[x] = defaultQuery[x]; });
        var xhr = new XMLHttpRequest();
        xhr.open(query.method, query.url, true);
        Object.keys(query.headers).forEach(key => xhr.setRequestHeader(key, query.headers[key]));// Headers
        xhr.onreadystatechange = HttpClient.private_onreadystatechange[query.bodyParser](callbacks);
        xhr.send(query.body);
    },
    upload: (query, callbacks) => HttpClient.queryUpload({
        url: null,
        headers: {},
        file: null,
        formData: null,
        progress: () => {},
        bodyParser: 'json'
    }, query, callbacks),
    queryUpload: (defaultQuery, query, callbacks = [() /** Sucess */ => {}, () /** Failure */ => {}]) => {
        Object.keys(defaultQuery).forEach(x => { if (query[x] == undefined) query[x] = defaultQuery[x]; });
        var xhr = new XMLHttpRequest();
        
        function progressHandler(event) {
            var percent = (event.loaded / event.total) * 100;
            query.progress(percent);
        }

        function errorHandler(event) {
            callbacks[1](xhr.response, event);
        }

        function abortHandler(event) {
            callbacks[1]({}, event);
        }

        function completeHandler(event) {
            if (xhr.status != 200) {
                errorHandler(event);
                return ;
            }
            callbacks[0](xhr.response, event);
        }

        xhr.upload.addEventListener("progress", progressHandler, false);
        xhr.addEventListener("load", completeHandler, false);
        xhr.addEventListener("error", errorHandler, false);
        xhr.addEventListener("abort", abortHandler, false);
        xhr.open("POST", query.url);
        Object.keys(query.headers).forEach(key => xhr.setRequestHeader(key, query.headers[key]));// Headers

        if (query.formData != null) {
            xhr.send(query.formData);
        } else {
            xhr.setRequestHeader("size", query.file.size);
            xhr.send(query.file);
        }
    },
    private_onreadystatechange: {
        response: (callbacks) => {
            return function() { // XMLHttpRequest.readyState 4 DONE
                if (this.readyState === 4 && this.status >= 200 && this.status <= 299) {
                    callbacks[0](this.response);
                } else if (this.readyState === 4) {
                    callbacks[1](this);
                }
            };
        },
        text: (callbacks) => {
            return HttpClient.private_onreadystatechange["response"]([(resp) => { callbacks[0](resp)}, callbacks[1]]);
        },
        json: (callbacks) => {
            return HttpClient.private_onreadystatechange["response"]([(resp) => { callbacks[0](JSON.parse(resp))}, callbacks[1]]);
        }
    },
    utils: {
        urlEncodeFormData: (fd) => {
            var s = '';
            function encode(s){ return encodeURIComponent(s).replace(/%20/g,'+'); }
            fd.forEach((value,key) => {
                s += (s?'&':'') + encode(key)+'='+encode(value);
            });
            return s;
        }
    }
};

// [exports] HttpClient to GUI
if (typeof(document) !== 'undefined') {
    document.HttpClient = HttpClient;
}
if (typeof(window) !== "undefined") {
    window.HttpClient = HttpClient;
}
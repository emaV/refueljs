Refuel.static('ajax',
	function ajax() {
		var ajaxCounter = 0;
		var callLog = {};
		var profiler = {
			enabled: false
		}
		var config = {
		    mimeType: 'json',
		    headers: {
				'Content-Type': 'application/json'
		    },
			_genericCallback: function() {return true;},
			successCallback: function() {},
			errorCallback: function() {},
			timeoutCallback: function() {}
		};
		var timer = {};

		function setProvider(){
			var XMLHttpRequest;
			if (window.XMLHttpRequest){
				XMLHttpRequest = new window.XMLHttpRequest();
			} else {
				XMLHttpRequest = function () {
					try {
						return new ActiveXObject("Msxml2.XMLHTTP.6.0");
					} catch (e) {}
					try {
						return new ActiveXObject("Msxml2.XMLHTTP.3.0");
					} catch (e) {}
					try {
						return new ActiveXObject("Microsoft.XMLHTTP");
					} catch (e) {}

					throw new Error("This browser does not support XMLHttpRequest.");
				};
			}

			return XMLHttpRequest;
		}


		function killAjaxCall(xhr, url, options){
			xhr.onreadystatechange = null;
			xhr.abort();
			ajaxCounter--;
			clearTimeout(callLog[url].timeoutId);

			var resp = {
				url: url,
				responseText: "",
				responseJSON: {}
			};
			if (callLog[url] <= 2){
				options.timeout *= 1.5;
				ajax(url, options);
			} else {
				callLog[url].counter = 0;
				options[options.timeout ? 'timeoutCallback' : 'errorCallback'](resp, 0, xhr);
				options._genericCallback(resp, null, xhr, 'timeout');
			}
		}

		function ajax(url, options){
			options.headers = Refuel.mix(config.headers, options.headers);
			options = Refuel.mix(config, options);
			
			var xhr = setProvider();
			var method = options.method ? options.method : "GET";
			var headers, timeout;
			options.timeout = options.timeout || 60000;

			timeout = setTimeout(function(xhr, url, options){
				return function timeoutHandler(){
					killAjaxCall(xhr, url, options);
				}
			}(xhr, url, options), options.timeout);
			callLog[url] = {
				counter: callLog[url] ? callLog[url].counter + 1 : 1,
				timeoutId: timeout
			};
			xhr.onreadystatechange = function() {
				var status, resp = {};
				//console.log('XHR STATE', xhr.readyState );
				if (xhr.readyState === 4){
					callLog[url].counter = 0;
					clearTimeout(callLog[url].timeoutId);
					ajaxCounter--;
					try {
						status = xhr.status;
					} catch (e){
						status = 0;
					}
					resp = {
						url: url,
						responseXML: xhr.responseXML,
						responseText: xhr.responseText
					};
					//MIME TYPE CONVERSION
					//dataType (default: Intelligent Guess (xml, json, script, or html))
					profiler.timestart = new Date().getTime();
					if (resp.responseText) {
						try {
							switch(options.mimeType) {
								case 'json':
									resp.responseJSON = JSON.parse(resp.responseText) || {};	
								break;
							}
						}
						catch (e) {
							console.error("Parsing Error in responseText", resp);
							throw "Parsing Error [responseText] in "+url;
						}
					}
					profiler.timestop = new Date().getTime();
					if(profiler.enabled) console.log('Refuel.ajax.profiler['+url+']: ', profiler.timestop - profiler.timestart);

					var allowed = false;
					var type = 'timeout';
					if (options.allowedStatus) {
						allowed = options.allowedStatus.indexOf(status) > -1 ? true : false;
					}
					if (status >= 200 && status < 400 || status === 1224 || allowed){
						options.successCallback(resp, status, xhr);
						type = 'success';
					} else if (status >= 400){
						options.errorCallback(resp, status, xhr);
						type = 'error';
					}
					options._genericCallback(resp, status, xhr, type);
				}
			};
			var params = options.params;
			var queryString = params ? '?'+params : '';
			
			//ebugger;
			var currentTime = new Date().getTime();
			if (!timer.last) timer.last = new Date().getTime();
			var ttd = Math.max((20 - (currentTime - timer.last)), 0);
			
			setTimeout(function() {
				xhr.open(method, url+queryString);
				ajaxCounter++;
				if (headers = options.headers){
					for (var h in headers){
						if (headers.hasOwnProperty(h)){
							xhr.setRequestHeader(h, headers[h]);
						}
					}
				}
				xhr.send(method.match(/POST|PUT/) && options.body ? options.body : null);
				timer.last = new Date().getTime();
			}, ttd);
			
			return xhr;
		}
		
		return {
			haveActiveConnections: function(){
				return ajaxCounter > 0;
			},
			"get": function(url, options){
				options = Refuel.mix(config, options);
				options.method = "GET";
				return ajax(url, options);
			},
			"post": function(url, body, options){
				options = Refuel.mix(config, options);
				options.method = "POST";
				options.body = body;
				return ajax(url, options);
			},
			"put": function(url, body, options){
				options = Refuel.mix(config, options);
				options.method = "PUT";
				options.body = body;
				return ajax(url, options);
			},
			"delete": function(url, options){
				options = Refuel.mix(config, options);
				options.method = "DELETE";
				return ajax(url, options);
			}
		}
		
});

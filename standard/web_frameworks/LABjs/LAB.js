// LAB.js (LABjs :: Loading And Blocking JavaScript)
// v0.5.1 (c) Kyle Simpson
// MIT License

(function(global){		  
	global.$LAB = function() {
		var _scripts = [{}],
		doc = global.document,
		_which = "head",
		_append_to = {
			"head" : doc.getElementsByTagName("head"),
			"body" : doc.getElementsByTagName("body")
		},
		_ready = [false],
		_load_level = 0,
		_wait = [],
		publicAPI = null;
		
		if (typeof _append_to["head"] !== "undefined" && _append_to["head"] !== null && _append_to["head"].length > 0) _append_to["head"] = _append_to["head"][0];
		else _append_to["head"] = null;
		if (typeof _append_to["body"] !== "undefined" && _append_to["body"] !== null && _append_to["body"].length > 0) _append_to["body"] = _append_to["body"][0];
		else _append_to["body"] = null;
				
		function handleScriptLoad(level,scriptentry) {
			if ((this.readyState && this.readyState!=="complete" && this.readyState!=="loaded") || scriptentry.done) { return; }
			this.onload = this.onreadystatechange = null; // prevent memory leak
			scriptentry.done = true;
			for (var i in _scripts[level]) {
				if (!(_scripts[level][i].done)) {
					return false;
				}
			}
			_load_level++;
			_ready[level] = true;
			for (var j=0; j<_wait[level].length; j++) {
				_wait[level][j]();
				_wait[level][j] = false;
			}
			_wait[level] = [];
		}

		function initHashes() {
			if (typeof _scripts[_load_level] === "undefined") _scripts[_load_level] = false;
			if (typeof _wait[_load_level] === "undefined") _wait[_load_level] = [];
			if (typeof _ready[_load_level] === "undefined") _ready[_load_level] = false;
		}
		
		function loadScript(src,type,language) {
			if (typeof type == "undefined") { var type = "text/javascript"; }
			if (typeof language == "undefined") { var language = "javascript"; }
			initHashes();
			for (var i=0; i<=_load_level; i++ ) {
				if (_scripts[i] && typeof _scripts[i][src] !== "undefined") return false;
			}
			var docScripts = doc.getElementsByTagName("script"), scrRegEx = new RegExp("^(.*/)?"+src.replace(".","\\.")+"(\\?.*)?$","i");
			for (var i=0; i<docScripts.length; i++) {
				scrRegEx.lastIndex = 0; // reset the regex each time so it's reusable!
				if (typeof docScripts[i].src == "string" && docScripts[i].src.match(scrRegEx)) return false;
			}
			if (!_scripts[_load_level]) _scripts[_load_level] = {};
			_scripts[_load_level][src] = {done:false};
			(function(__which,level){
				setTimeout(function(){
					var __append = null;
					if (((__append = _append_to[__which]) === null) && ((__append = doc.getElementsByTagName(__which)[0]) === null)) {
						setTimeout(function(){arguments.callee.call(null,__which);},25);
						return;
					}
					var scriptElem = doc.createElement("script");
					scriptElem.setAttribute("type",type);
					scriptElem.setAttribute("language",language);
					scriptElem.setAttribute("src",src);
					scriptElem.onload = scriptElem.onreadystatechange = function(){handleScriptLoad.call(scriptElem,level,_scripts[level][src]);};
					__append.appendChild(scriptElem);
				},0);
			})(_which,_load_level);
			_ready[_load_level] = false;
		}
		
		publicAPI = {
			ready:function() {
				for (var i=0; i<_ready.length; i++) {
					if (_scripts[i] && !_ready[i]) return false;
				}
				return true;
			},
			script:function() {
				for (var i=0; i<arguments.length; i++) {
					if (arguments[i].constructor == Array) {
						arguments.callee.apply(null,arguments[i]);
					}
					else if (typeof arguments[i] == "object") {
						loadScript(arguments[i].src,arguments[i].type,arguments.language);
					}
					else if (typeof arguments[i] == "string") {
						loadScript(arguments[i]);
					}
				}				
				return publicAPI;
			},
			block:function(func) {
				initHashes();
				if (_scripts[_load_level] && !_ready[_load_level]) _wait[_load_level].push(func);
				else setTimeout(func,0);
				return publicAPI;
			},
			toHEAD:function(){_which="head";return publicAPI;},
			toBODY:function(){_which="body";return publicAPI;}
		};
		return publicAPI;
	}();
})(window);
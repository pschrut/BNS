/**
 * @class 
 * @description This class is used to generate XML request for HRW Engine (used by eWS SCM applications)<br><br>
 * 
 * <code><pre>
 * Example of code:<br>
 * var method_name = "Test.SayHello";<br>
 * var method_params = new Hash();<br>
 * method_params.set("YourName", "Oli");<br>
 * <br>
 * var hrw_request = new HrwRequest({<br>
 *    methodName: method_name,<br>
 *    methodParams: method_params, <br>
 *    format: "json"<br>
 * });<br>
 *<br>
 * hrw_request.toString()   --> returns a string object.<br></pre></code>
 *
 *
 * @author jonathanj & nicolasl
 * @version 2.2
 * <br/>Modified for 2.2
 * <ul>
 * <li>When encoding/decoding, return '' for empty strings</li>
 * </ul>
 * <br/>Modified for 2.1
 * <ul>
 * <li>Addition of the methods to encode/decode for the communication with HRW</li>
 * <li>Addition of a method to encode strings before putting them as attribute</li>
 * <li>Addition of a method that remove the tags</li>
 * </ul>
 */
var HrwRequest = Class.create(/** @lends HrwRequest.prototype */{
    /**
     * @type String
     * @default "hrw_engine"
     * @description Name of the SAP Caller service.
     * @since 1.0
     */
    _service: "hrw_engine",

    /**
     * @type Template
     * @description XML template of EWS requests.
     * @since 1.0
     */
    _ewsXml: null,

    /**
     * @type Template
     * @description XML template of HRW requests.
     * @since 1.0
     */
    _hrwXml: null, 

    /**
     * @type Template
     * @description XML template of HRW request parameters.
     * @since 1.0
     */
    _hrwParamsXml: null,

    /**
     * @type String
     * @description Name of the HRW Engine method.
     * @since 1.0
     */
    methodName: null,

    /**
     * @type Hash
     * @description List of HRW Engine parameters (the name of the parameter is the Key).
     * @since 1.0
     */
    methodParams: null,

    /**
     * @type String
     * @description The format of the HRW request. It could be: "json", "xml" or "encoded".
     * @since 1.0
     */
    format: null,

    /**
     * @description Constructor.
     * @param {Object} options Initialization options.
     * @since 1.0
     */
    initialize: function(options) {
        this._ewsXml = new Template("<EWS><SERVICE>#{service}</SERVICE><NOCNTX>X</NOCNTX><DEL/><PARAM><I_INPUT><![CDATA[#{input}]]></I_INPUT></PARAM></EWS>");
        this._hrwXml = new Template("<HrwRequest><Method>#{method}</Method><Parameters>#{parameters}</Parameters></HrwRequest>");
        this._hrwParamsXml = new Template("<Parameter><Name>#{name}</Name><Value>#{value}</Value></Parameter>");

        if (options) {
            this.methodName = options.methodName || "";
            this.methodParams = options.methodParams || new Hash();
            this.format = options.format || "xml";
        }
    },

    /**
     * @description Returns a HrwRequest as a JSON object.
     * @returns {JSON Object} Get the method to call and the parameters to send.
     * @since 1.0
     */
    hrwRequestAsJson: function() {
        var method_name = this.methodName;
        var method_parameters = this.buildParametersList(this.methodParams);

        return Object.toJSON({
            Method: method_name,
            Parameters: method_parameters
        });
    },

    /**
     * @description Returns an array of Parameter object
     * @param {Hash} params List of params
     * @returns {Array} Format the list of parameters
     * @since 1.0
     */
    buildParametersList: function(params) {
        var parameters = [];

        params.each(function(param) {
            var p = {
                Parameter: {
                    Name: param.key,
                    Value: param.value
                }
            }

            parameters.push(p);
        });

        return parameters;
    },

    /**
     * @description Returns a HrwRequest as XML.
     * @returns {String} XML that is to send to the backend.
     * @since 1.0
     */
    hrwRequestAsXml: function() {
        var params_as_xml = "";
        this.methodParams.each(function(methodParam) {
            params_as_xml += this._hrwParamsXml.evaluate({ name: methodParam.key, value: methodParam.value });
        }, this);

        return this._hrwXml.evaluate({ method: this.methodName, parameters: params_as_xml });
    },

    /**
     * @description Returns a HrwRequest as encoded XML.
     * @returns {String} Encoded XML to send to the backend
     * @since 1.0
     */
    hrwRequestAsEncoded: function() {
        return encodeURI(this.hrwRequestAsXml());
    },

    /**
     * @description Returns the full request as a String.
     * @returns {String} Convert the current call to a string.
     * @since 1.0
     */
    toString: function() {
        if (this.methodName.blank()) {
            alert("HrwRequest exception: 'methodName' could not be empty");
            return "";
        }
        if (this.methodName.split('.').length < 2) {
            alert("HrwRequest exception: 'methodName' is invalid");
            return "";
        }

        var hrw_request = "";
        switch (this.format) {
            case "json":
                hrw_request = this.hrwRequestAsJson();
                break;
            case "encoded":
                hrw_request = this.hrwRequestAsEncoded();
                break;
            default:    // or xml
                hrw_request = this.hrwRequestAsXml();
                break;
        }
        return this._ewsXml.evaluate({ service: this._service, input: hrw_request });
    }
});

/**
 * @param {Array} integers List of integers to convert.
 * @description Build a XML string from an array of integers.
 * @returns {String} Array of integers with XML format
 * @since 1.0
 * <br/>Modified for 1.2
 * <ul>
 * <li>Allow to have a root or not (by default, it is there)</li>
 * </ul>
 */
HrwRequest.createXmlIntArray = function(integers, withRoot) {
	if(Object.isEmpty(withRoot)) withRoot = true;
	
	if(Object.isEmpty(integers) && withRoot) return '<ArrayOfInt/>';
	else if(Object.isEmpty(integers)) return '';
	
	var xmlString = '';
	integers.each(function(integ) {
		xmlString += '<int>' + integ.toString() + '</int>';
	}.bind(this));

	if(withRoot) return '<ArrayOfInt>' + xmlString + '</ArrayOfInt>';
	else return xmlString;
};

/**
 * Method used to encode strings before sending them to the engine
 * @param {String} toEncode String to encode
 * @return {String} Encoded string
 * @since 2.1
 * <br/>Modified in 2.2
 * <ul>
 * <li>Return '' for empty strings</li>
 * </ul>
 */
HrwRequest.encode = function(toEncode) {
	//since 2.2 Return '' for empty strings
	if(Object.isEmpty(toEncode)) return '';
	var encoded; 
	
	//Remove the HTML encoding
	var ta = document.createElement("textarea");
	ta.innerHTML = toEncode.gsub(/</,'&lt;').gsub(/>/,'&gt;');
	encoded = ta.value;
	
	//Replace all the special chars by there URI conversion
	return encodeURIComponent(encoded);
};

/**
 * Method used to decode strings received from the engine
 * @param {String} toDecode String to decode
 * @return {String} Decoded string
 * @since 2.1
 * <br/>Modified in 2.2
 * <ul>
 * <li>Return '' for empty strings</li>
 * </ul>
 */
HrwRequest.decode = function(toDecode) {
	//since 2.2 Return '' for empty strings
	if(Object.isEmpty(toDecode)) return '';
	var decoded;
	
	try {
		decoded = decodeURIComponent(toDecode);
	} catch(e) {
		decoded = toDecode;
	}
	//Remove the scripts
	decoded = decoded.stripScripts();
	
	return decoded;
};

/**
 * Method used to add encode chars that can not be present in attributes
 * @param {String} toEncode Text to be displayed as an attribute
 * @return {String} Teh result text
 * @since 2.1
 */
HrwRequest.displayAsAttribute = function(toEncode) {
	return HrwRequest.removeTags(toEncode).gsub(/"/, "&quot;");
}

/**
 * Method used to remove all the script and tags from a string (also if there are like <.../>)
 * @param {String} toEncode Text with some tags that has to be cleaned
 * @return {String} The cleaned text
 * @since 2.1
 */
HrwRequest.removeTags = function(toEncode) {
	return toEncode.stripScripts().stripTags().gsub(/\<[^<>]*\/\>/, '')
}

/**
 * @class
 * @description Manage the calls to the HRW backend.
 * @author jonathanj & nicolasl
 * @version 2.0
 * <br/>Modifications for 1.1:
 * <ul>
 * <li>Store the last pending reason call</li>
 * <li>Create a standard return function for the calls to HRW</li>
 * </ul>
 * <br/>Modifications for 2.0:
 * <ul>
 * <li>Addition of a queue that allow to store calls that could be delay. 
 * This queue wait the time of the next heartbeat to do the call</li>
 * <li>Addidion of the pending reasons in the cache</li>
 * <li>If there is no heartbeat in the XML answer, avoid to have an error.</li>
 * <li>Addition of a new constant to indicate that there is no value</li>
 * </ul>
 */
var HrwEngine = Class.create(/** @lends HrwEngine.prototype */{
    /**
	 * @type String
	 * @default ''
	 * @description Identifier of the current agent.
     * @since 1.0
	 */
    scAgentId   : '',
    
    /**
	 * @type PeriodicalExecuter 
	 * @description Used to send heartBeat to the HRW engine.
     * @since 1.0
	 */
    _heartBeat  : null,
    
    /**
	 * @type Integer 
	 * @default 300
	 * @description Time between 2 heartbeats in seconds.
     * @since 1.0
	 */
    _heartbeatDelay: 300,
    
    /**
	 * @type Element 
	 * @description Application used for the login.
     * @since 1.0
	 */
    _loginParent: null,
	
	/**
	 * @type Array 
	 * @description List of the companies for the agent.
     * @since 1.0
	 */
	companies: null,
	
	/**
	 * @type Boolean 
	 * @default true
	 * @description Indicate if it is mandatory to have a selecte company or customer to select an employee.
     * @since 1.0
	 */
	custCompMandatory: true,
	
	/**
	 * @type Boolean 
	 * @description Indicate if the search is customer based (or company).
     * @since 1.0
	 */
	customerBased: null,
	
	/**
	 * @type Boolean 
	 * @default false
	 * @description Is the session Lost.
     * @since 1.0
	 */
	sessionLost: false,
	
	/**
	 * @type Boolean 
	 * @default false
	 * @description Is the login call started.
     * @since 1.0
	 */
	_underLogin: false,
	
	/**
	 * @type Hash 
	 * @description List of possible transitions from a status.
     * @since 1.0
	 */
	statusTranslations: null,
	
	/**
	 * @type scmNotification
	 * @description Object used to get and display notifications.
     * @since 1.0
	 */
	notificator: null,
	
	/**
	 * Stack with calls to do when there is time. Each entry has the parameters:
	 * <ul>
	 * <li><b>id</b>(<i>String</i>): Identifier of the asked entry generated automatically</li>
	 * <li><b>started</b>(<i>Boolean</i>): Indicate if the call is already started</li>
	 * <li><b>parent</b>(<i>Application</i>): Application that called the service</li>
	 * <li><b>methName</b>(<i>String</i>): Name of the HRW method to call</li>
	 * <li><b>params</b>(<i>Function/JSON Object</i>): List of the method parameters or a method that allow to evaluate them</li>
	 * <li><b>methods</b>(<i>JSON Objects</i>): Success, information, warning and error methods</li>
	 * <li><b>priority</b>(<i>Integer</i>): Indicate if it is better to do the call soon or not (9 = soon, 0 = not urgent)</li>
	 * </ul>
	 * @type Array
	 * @since 2.0
	 */
	callStack: $A(),
	
	/**
	 * Identifier used to create a unique Id to a request
	 * @type Integer
	 * @default 0
	 * @since 2.0
	 */
	stackId: 0,
	
	/**
	 * Indicate if it is permit to start something via the callstack in this moment
	 * @type Boolean
	 * @default true
	 * @since 2.0
	 */
	useCallStack: true,
	
	/**
	 * Table with the pending reasons for the different companies
	 * @type Hash
	 * @since 2.0
	 */
	lastPendReasons: null,
	
	/**
	 * Hash containing the user email notification preferences
	 * @type Hash
	 * @since 2.0
	 */
	emailNotificationPreferences:$H(),
	
	/**
	 * Indicate if at last one company of the user has service areas
	 * @type Boolean
	 * @since 2.0
	 */
	hasServiceArea: null,
	
	/**
     * @param {Object} parent Application that call the login
     * @description Log in HRW and set the parameters from HRW engine
     * @since 1.0
     * @see HrwEngine#loggedIn
     */
    login: function(parent) {
        if(hrwEngine.isConnected() || this._underLogin === true) return;
		this._underLogin 	= true;
        this._loginParent 	= parent;
        var timezone 		= this._convertTimeInt(global.timeDiffUTC.time, global.timeDiffUTC.sign).toString();
		//since 2.0 Initialize the list of pending reasons
		this.lastPendReasons = $H();
		
	    this.callBackend(this._loginParent, 'Session.Login', $H({
	        userName                : global.hrwLogin                               ,
	        languageCode            : global.language                               ,
	        timeZoneOffset          : timezone                                      ,
	        dateTimeFormat          : global.dateFormat + ' ' + global.hourFormat   ,
	        applicationId           : 'EWSSCM'                                      ,
	        applicationVersionId    : '1.0.0.0'
	    }), this.loggedIn.bind(this));
    },
    
    /**
     * @param {Object} jsonParams Parameters of the login answer
	 * @description Handler when the user is logged
	 * @since 1.0
	 * @see HrwEngine#login
	 */
    loggedIn: function(jsonParams) {
		var firstConnection = true;
		
		this._underLogin = false;
		if(jsonParams.EWS.HrwResponse.HrwResult.AgentLogin.LoginStatus != 'SUCCESS') {
            this.sessionLost = true;
			document.fire('EWS:scm_noMoreConnected');
					
			var loginFailurePopup = new infoPopUp({
                closeButton     : $H({'callBack': function() {loginFailurePopup.close();delete loginFailurePopup;}}),
                htmlContent     : new Element("div").insert(global.getLabel('HRW_login_error') + ': <br/>' + jsonParams.EWS.HrwResponse.HrwResult.AgentLogin.LoginStatus),
                indicatorIcon   : 'exclamation',                    
                width           : 600
            });   
            
            loginFailurePopup.create();
        }
        else {
			//For IE6, keep a bigger marge with the delay
			if(Prototype.Browser.IE&&parseInt(navigator.userAgent.substring(navigator.userAgent.indexOf("MSIE")+5))==6)
				this._heartbeatDelay    = new Number(jsonParams.EWS.HrwResponse.HrwResult.AgentLogin.HeartBeatDelay) - 15;
			else
            	this._heartbeatDelay    = new Number(jsonParams.EWS.HrwResponse.HrwResult.AgentLogin.HeartBeatDelay) - 5;
            this.scAgentId          = jsonParams.EWS.HrwResponse.HrwResult.AgentLogin.ScAgentId;
			this.resetHeartbeat(); 

			this.statusTranslations	= $H();
			
			//If the session was lost, it is a reconnection
			if(this.sessionLost === true) firstConnection = false;
			this.sessionLost = false;

			//Set the list of companies for the agent if there are present
			this.companies = $H();

			if(jsonParams.EWS.HrwResponse.HrwResult.AgentLogin.Companies 
			&&	jsonParams.EWS.HrwResponse.HrwResult.AgentLogin.Companies.Company
			&& !Object.isEmpty(jsonParams.EWS.HrwResponse.HrwResult.AgentLogin.Companies.Company)) 
				objectToArray(jsonParams.EWS.HrwResponse.HrwResult.AgentLogin.Companies.Company).each(function(company) {
					this.companies.set(company.CompanySkillId, {
						Name			: company.Name,
						EnableTakeOver	: (company.EnableTakeOverTicket === 'true'),
						EnableReOpen    : (company.EnableReOpenTicket === 'true')
					});
				}, this);

			this.customerBased = (jsonParams.EWS.HrwResponse.HrwResult.AgentLogin.UseCustomerEmployeeSearch.toLowerCase() === 'true');
			
			//since 2.0 Get if there are service area for some companies
			this.hasServiceArea = (jsonParams.EWS.HrwResponse.HrwResult.AgentLogin.EnableServiceAreaLevel.toLowerCase() === 'true');
				
			//Add the status labels in the list
			jsonParams.EWS.HrwResponse.HrwResult.AgentLogin.TicketStatuses.KeyValue.each(function (status) {
				global.labels.set('SCM_status_' + status.Key, status.Value);
			}.bind(this));
			
			//Add the action labels in the list
			jsonParams.EWS.HrwResponse.HrwResult.AgentLogin.TicketActionTypes.KeyValue.each(function(actionType) {
				global.labels.set('SCM_Action_' + actionType.Key, actionType.Value);
			}.bind(this));
			
			//Add the state transitions in the pool tables logic
			if(jsonParams.EWS.HrwResponse.HrwResult.AgentLogin.TicketStatusTransitions &&
					jsonParams.EWS.HrwResponse.HrwResult.AgentLogin.TicketStatusTransitions.TicketStatusTransition)
				
				objectToArray(jsonParams.EWS.HrwResponse.HrwResult.AgentLogin.TicketStatusTransitions.TicketStatusTransition).each(function(transistionFrom) {
					var transToTable = $A();
					
					objectToArray(transistionFrom.Transitions["int"]).each(function(transistionTo) {
						transToTable.push(transistionTo);
					}.bind(this));
					
					this.statusTranslations.set(transistionFrom.CurrentTicketStatus, transToTable);
				}.bind(this));
			// 2.0 - Email notification preferences
			if(jsonParams.EWS.HrwResponse.HrwResult.AgentLogin.EmailNotificationPreferences && 
			   jsonParams.EWS.HrwResponse.HrwResult.AgentLogin.EmailNotificationPreferences.EmailNotificationPreference)
			   
			   objectToArray(jsonParams.EWS.HrwResponse.HrwResult.AgentLogin.EmailNotificationPreferences.EmailNotificationPreference).each(function(emailNotifPreference){
			   		if(emailNotifPreference.Value == "true")
						this.emailNotificationPreferences.set(emailNotifPreference.Id, {id: emailNotifPreference.Id, name: emailNotifPreference.Name, value:true});
					else
						this.emailNotificationPreferences.set(emailNotifPreference.Id, {id: emailNotifPreference.Id, name: emailNotifPreference.Name, value:false});
			   }.bind(this))
				
			document.fire('EWS:scm_HrwConnected', firstConnection);
        }    
    },
    
	/**
     * @description Check if we are connected to HRW.
     * @returns {Boolean} Is the agent connected?
	 * @since 1.0
	 */
	isConnected: function() {
		return (!Object.isEmpty(this.scAgentId));
	},
	
    /**
     * @param {String} time Time with the SAP format HH:mm:ss
     * @param {String} sign + or - depending if the time is to add or subtract
	 * @description Convert a date and a sign into a double
	 * @returns {Integer} Convert the given time to a number of minutes 
	 * @since 1.0
	 */
    _convertTimeInt: function(time, sign) {
        timeInt = new Number(time.substr(0,2)) + (new Number(time.substr(3,2)) / 60) + (new Number(time.substr(6,2)) / 3600);
        if(sign === '-') timeInt = -1 * timeInt;
        
        return timeInt;
    },
    
	/**
	 * Add a new entry in the queue of calls to do once there is time
	 * @param {Application} parent Application that called the call
	 * @param {String} methName Name of the HRW method to call
	 * @param {Function/JSON Object} params List of parameters for the request or a function that load them
	 * @param {Function/String} Function to call in case of success of the AJAX request
	 * @param {JSON Object} methods The methods to call in case of success, information, warning or error
	 * @param {Integer} priority Priority to give to the call. The higher (9) is placed first. By default, it is 0
	 * @returns {String} Id of the generated stack entry.
	 * @since 2.0
	 * @see HrwEngine#callStack
	 */
	addInCallQueue: function(parent, methName, params, successMethod, methods, priority) {
		//Set the default value to the priority
		if(Object.isEmpty(priority)) priority = 0;

		//Generate the list of methods
		if(methods) methods.successMethod = successMethod;
		else methods = {successMethod: successMethod};
		
		//Generate the new id
		var newId = 'CallStackItem_' + this.stackId;
		this.stackId ++;
		
		//Add the call stack entry
		this.callStack.push({
			id		: newId,
			started	: false,
			parent	: parent,
			methName: methName,
			params	: params,
			methods	: methods,
			priority: priority
		});
		
		//Sort the entries by priority
		this.callStack = this.callStack.sortBy(function(entry) {
			return (-1) * entry.priority;
		});

		return newId;
	},
	
	/**
	 * Remove the entry corresponding to an id if it is still in the queue.<br/>
	 * If the element is not started and still in the list, the method return true 
	 * to indicate that the element is really removed. Otherwize, it returns false.
	 * @param {Object} id Id of the call stack item to remove
	 * @since 2.0
	 */
	removeFromCallQueue: function(id) {
		var inQueue 	= false;
		var queueIndex 	= null;
		
		//It is not permitted to use the call stack if we are removing an entry
		this.useCallStack = false;
		
		//Check if the entry with the given id is in the queue and not started
		this.callStack.each(function(callStackItem, index){
			if(callStackItem.id === id) {
				inQueue 	= !callStackItem.started;
				queueIndex 	= index + 1;
			}
		}, this);
		
		//If the element is ready to be removed, do it
		if(inQueue === true)
			this.callStack = this.callStack.splice(queueIndex, 1);
		
		//It is again possible to use the call stack items
		this.useCallStack = true;
		
		return inQueue;
	},
	/**
	 * Get if the element in the queue is :
	 * <ul>
	 * <li>{@link HrwEngine#inQueue} => Waiting in the queue</li>
	 * <li>{@link HrwEngine#inQueueStarted} => In the queue, but started</li>
	 * <li>{@link HrwEngine#notInQueue} => Not in the queue</li>
	 * </ul>
	 * @param {Object} id Identifier of the element to return
	 * @returns {Integer} The status
	 * @since 2.0
	 */
	getQueueItemStatus: function(id) {
		var index			= 0;
		var callStackItem 	= this.callStack[index];
		
		//Look for the first non started queue element
		while(!Object.isEmpty(callStackItem) && callStackItem.id !== id) {
			index ++;
			callStackItem = this.callStack[index];
		}
		if(Object.isEmpty(callStackItem)) return HrwEngine.notInQueue;
		if(callStackItem.started) return HrwEngine.inQueueStarted;
		return HrwEngine.inQueue;
	},
	
	/**
	 * Indicate if there are elements in the queue
	 * @returns {Boolean} Indicate if there is non started in the queue
	 * @since 2.0
	 */
	_hasQueue: function() {
		var hasQueue = false;
		
		//It is not permitted to use the call stack during the check
		this.useCallStack = false;
		
		this.callStack.each(function(callStackItem, index){
			if(callStackItem.started === false) 
				hasQueue = true;
		}, this);
		
		//It is again possible to use the call stack items
		this.useCallStack = true;
		
		return hasQueue;
	},
	
	/**
	 * Call the next element in the queue.
	 * @since 2.0
	 */
	_callQueue: function() {
		var index 			= 0;
		var callStackItem 	= this.callStack[index];
		var methods			= {};
		var params			= $H();
		
		//Look for the first non started queue element
		while(!Object.isEmpty(callStackItem) && callStackItem.started === true) {
			index ++;
			callStackItem = this.callStack[index];
		}
		//If there is nothing found, nothing to do
		if(Object.isEmpty(callStackItem)) return;
		
		//Start the call
		this.callStack[index].started = true;
		
		//Get the list of methods and transform strings-> methods 
		if(callStackItem.methods.errorMethod) {
			if(Object.isString(callStackItem.methods.errorMethod))
				callStackItem.methods.errorMethod = eval('callStackItem.parent.' + callStackItem.methods.errorMethod + '.bind(callStackItem.parent)');
			methods.errorMethod = this._manageCallQueueBack.bind(this, callStackItem.id, callStackItem.methods.errorMethod);
		}
		if(callStackItem.methods.infoMethod) {
			if(Object.isString(callStackItem.methods.infoMethod))
				callStackItem.methods.infoMethod = eval('callStackItem.parent.' + callStackItem.methods.infoMethod + '.bind(callStackItem.parent)');
			methods.infoMethod = this._manageCallQueueBack.bind(this, callStackItem.id, callStackItem.methods.infoMethod);
		} 	
		if (callStackItem.methods.warningMethod) {
			if(Object.isString(callStackItem.methods.warningMethod))
				callStackItem.methods.warningMethod = eval('callStackItem.parent.' + callStackItem.methods.warningMethod + '.bind(callStackItem.parent)');
			methods.warningMethod = this._manageCallQueueBack.bind(this, callStackItem.id, callStackItem.methods.warningMethod);
		}
		if(Object.isString(callStackItem.methods.successMethod))
			callStackItem.methods.successMethod = eval('callStackItem.parent.' + callStackItem.methods.successMethod + '.bind(callStackItem.parent)');
		
		//If the parameters are to retrieve via a function
		if(Object.isFunction(callStackItem.params)) 
			params = callStackItem.params();
		else
			params = callStackItem.params;
		
		//Call the backend	
		this.callBackend(callStackItem.parent, callStackItem.methName, params, this._manageCallQueueBack.bind(this, callStackItem.id, callStackItem.methods.successMethod), true, methods, false);
	},
	
	/**
	 * Method that receive the resule of the calls from the queue.
	 * @param {String} id Identifier of the queue item
	 * @param {Function} handlerMethod Handler for the result
	 * @param {JSON Object} resultJson Result of the service
	 * @since 1.1
	 */
	_manageCallQueueBack: function(id, handlerMethod, resultJson) {
		var queueIndex 	= null;

		//Get the index of the element to remove
		this.callStack.each(function(callStackItem, index){
			if(callStackItem.id === id) 
				queueIndex 	= index + 1;
		}, this);
		
		//Remove the element
		if(queueIndex !== null)
			this.callStack = this.callStack.splice(queueIndex, 1);
		
		//Call the result function
		handlerMethod(resultJson);
	},
	
    /**
	 * @description Reset the heartBeat timer
	 * @since 1.0
	 * <br/>Modified for 2.0:
	 * <ul>
	 * <li>If there is something in the queue, calt it</li>
	 * </ul>
	 * @see HrwEngine#_heartbeatDelay
	 */
    resetHeartbeat: function() {
        var parameters = $H({'scAgentId': this.scAgentId});
        
        if(this._heartBeat !== null) this._heartBeat.stop();
        this._heartBeat = new PeriodicalExecuter(function() {
			//since 2.0 If there is something in the queue and it can be used, call something
            if(this._hasQueue() && this.useCallStack) {
				this._callQueue();
				
			//If the queue is not to use, send the heartbeat
			} else {
				//Build the request
	    		var hrw_request = new HrwRequest( {
	                methodName      : 'Session.Heartbeat',
	                methodParams    : parameters
	            });
		        
		        //Do the request
		        this._loginParent.makeAJAXrequest($H( {
				    xml             : hrw_request.toString(),
			        successMethod   : this.manageHeartbeat.bind(this)
		        }));
			}
        }.bind(this), this._heartbeatDelay);
    },
    
    /**
     * @param {JSON Object} answerJson HRW engine answer for the heartbeat. This metod has to be called in each receiver methods.
	 * @description Manage the result of the heartBeat
	 * @since 1.0
	 */
    manageHeartbeat: function(answerJson) {
		//since 2.0 If there is no hearbeat in the XML, do nothing
		if(Object.isEmpty(answerJson.EWS.HrwResponse) || Object.isEmpty(answerJson.EWS.HrwResponse.Heartbeat)) return;
        var heartbeat = answerJson.EWS.HrwResponse.Heartbeat;
		var binary = this._convertToBinary(new Number(heartbeat));
		
		//If there is no more heart beat
        if(binary.substr(10,1) === '0') {
			if(this.sessionLost === false) {
				var noSessionPopup = new infoPopUp({
                    closeButton     : $H( {'callBack': function() {noSessionPopup.close(); delete noSessionPopup;}}),
                    htmlContent     : new Element("div").insert(global.getLabel('HRW_session_lost') + '<br/>' + global.getLabel('HRW_session_problem')),
                    indicatorIcon   : 'exclamation',                    
                    width           : 600
                });   
                
                noSessionPopup.create();
				
                this.scAgentId = '';  
				this._heartBeat.stop();
				this.sessionLost = true;
				document.fire('EWS:scm_noMoreConnected');

				this.login(this._loginParent);
			}
		
		//If the heart beat is correct
		} else {
			this.resetHeartbeat();
			//Check if there is a notification
			if (binary.substr(0, 9).indexOf('1') >= 0) {
				if (Object.isEmpty(this.notificator))this.notificator = new scmNotification();
				this.notificator.loadNotifications(binary);
			}
		}
    },
	
	/**
     * @param {Integer} number The number to convert
     * @param {Integer} maxExp Maximum size of the binary result (If non indicated => 10)
	 * @description Convert a positive number to its binary value
	 * @returns {String} The binary value
	 * @since 1.0
	 */
	_convertToBinary: function(number, maxExp) {
		if(Object.isEmpty(maxExp)) maxExp = 10;
		var binary 	= '';
		var dec		= 0;
		var rest	= number;
		
		for(var exp = maxExp; exp >= 0; exp--) {
			dec = Math.pow(2, exp);
			if(rest >= dec) {
				binary 	+= '1';
				rest	-= dec;
			} else
				binary 	+= '0';
		}
		
		return binary;
	},
	
    /**
     * @param {Application} parent Application that call the HRW engine
	 * @param {String} methodName Name of the backend method
	 * @param {Hash} parameters List of the parameters 
	 * @param {String} successMethod Name of a method in the parent caller to call if success
	 * @param {Boolean} forceNoCache Force to get the values from backend
	 * @param {Object} methods Information and error methods if any (errorMethod, infoMethod, warningMethod)
	 * @description Generic method to call the backend<br/>
	 * @since 1.0
	 * <br/>Modifications for 1.1
	 * <ul>
	 * <li>Redirect the success and error methods to the generic handler</li>
	 * </ul>
	 */
	callBackend : function(parent, methodName, parameters, successMethod, forceNoCache, methods) {
		var options = $H();
		
		//since 1.1 Bind the existent function if there are strings
		//since 1.1 Replace the handler method by the standard method
		//Get the list of methods and transform strings-> methods 
		if (methods) {
			if(methods.errorMethod) {
				if(Object.isString(methods.errorMethod))
					methods.errorMethod = eval('parent.' + methods.errorMethod + '.bind(parent)');
				options.set('errorMethod', hrwEngine._manageCallBack.bind(hrwEngine, methodName, parameters, methods.errorMethod));
			}
			if(methods.infoMethod) {
				if(Object.isString(methods.infoMethod))
					methods.infoMethod = eval('parent.' + methods.infoMethod + '.bind(parent)');
				options.set('infoMethod', hrwEngine._manageCallBack.bind(hrwEngine, methodName, parameters, methods.infoMethod));
			} 	
			if (methods.warningMethod) {
				if(Object.isString(methods.warningMethod))
					methods.warningMethod = eval('callStackItem.parent.' + callStackItem.methods.warningMethod + '.bind(callStackItem.parent)');
				options.set('warningMethod', hrwEngine._manageCallBack.bind(hrwEngine, methodName, parameters, methods.warningMethod));
			}
		}
		
		//since 1.1 Bind the success method
		if(Object.isString(successMethod))
			successMethod = eval('parent.' + successMethod + '.bind(parent)');

		//For the login method or if the HRW session is already created
	    if(hrwEngine.isConnected() || methodName === 'Session.Login') {
			//If the parameters was created before the login, the agent Id could be wrong
	        if(methodName != 'Session.Login')
	            parameters.set('scAgentId', hrwEngine.scAgentId);
			
			if(forceNoCache !== true && hrwEngine._useCache(parent, methodName, parameters, successMethod) === true) return;
			
	        //Build the request
    		var hrw_request = new HrwRequest( {
                methodName      : methodName,
                methodParams    : parameters
            });
			
	        //Do the request
			options.set('xml', hrw_request.toString());
			//since 1.1 Replace the success method by the default one
			options.set('successMethod', hrwEngine._manageCallBack.bind(hrwEngine, methodName, parameters, successMethod));
	        parent.makeAJAXrequest(options);
	        
	        return;
	    }
	    //If there is a request that is called before the login => wait to have it
		new PeriodicalExecuter(function(pe) {
			if(hrwEngine.isConnected()) {
				pe.stop();
		        parameters.set('scAgentId', hrwEngine.scAgentId);
				
				if(forceNoCache !== true && hrwEngine._useCache(parent, methodName, parameters, successMethod) === true) return;
		        
				//Build the request
        		var hrw_request = new HrwRequest( {
	                methodName      : methodName,
	                methodParams    : parameters
                });

		        //Do the request
		        options.set('xml', hrw_request.toString());
				//since 1.1 Replace the success method by the default one
				options.set('successMethod', hrwEngine._manageCallBack.bind(hrwEngine, methodName, parameters, successMethod));
	        	parent.makeAJAXrequest(options);
		    }
		}.bind(this), 1);
	},
	
	/**
	 * Method that manage the come back of a call to HRW
	 * @param {String} methodName Name of the backend method
	 * @param {Hash} parameters List of the parameters
	 * @param {JSON Object} resultJson Result from HRW
	 * @param {Function} handlerMethod Method to call to execute to manage the result
	 * @since 1.1
	 */
	_manageCallBack: function(methodName, parameters, handlerMethod, resultJson) {
		//Manage the heartBeat
		hrwEngine.manageHeartbeat(resultJson);
		
		//Save the result in the cache if needed
		this._saveInCache(methodName, parameters, resultJson);
		
		//Call the result function
		handlerMethod(resultJson);
	},
	
	/**
     * @param {Object} parent Application that call the HRW engine
	 * @param {String} methodName Name of the backend method
	 * @param {Hash} parameters List of the parameters 
	 * @param {String} successMethod Name of a method in the parent caller to call if success
	 * @description Get some informations from the cache
	 * @returns {Boolean} Is there a result to use from the cache
	 * @since 1.0
	 * <br/>Modifications for 1.1
	 * <ul>
	 * <li>Add the list of pending reasons in the cache</li>
	 * </ul>
	 * <br/>Modifications for 2.0
	 * <ul>
	 * <li>Add the list of all pending reasons for the different companies in the cache</li>
	 * </ul>
	 */
	_useCache: function(parent, methodName, parameters, successMethod) {
		var successMethodBinded = successMethod;
		if(Object.isString(successMethodBinded)) 
			successMethodBinded = eval('parent.' + successMethod + '.bind(parent)');

		switch (methodName) {
			case 'Admin.CollectCompanies':
				if(this.companies !== null) {
					successMethodBinded(this.companies);
					return true;
				}
			//since 2.0 Collect the pending reasons for the different companies
			case 'Admin.CollectPendingReasons':
				var reasons = this.lastPendReasons.get(parameters.get('companySkillId'));
				if(!Object.isEmpty(reasons)) {
					successMethodBinded(reasons);
					return true;
				}	
		}
		return false;
	},
	
	/**
	 * Save a result in the cache if needed
	 * @param {String} methodName Name of the backend method
	 * @param {Hash} parameters List of the parameters 
	 * @param {JSON Object} jsonResults Results of the call from HRW
	 * @returns {Boolean} Is there something saved in the cache
	 * @since 1.1
	 */
	_saveInCache: function(methodName, parameters, jsonResults) {
		switch (methodName) {
			//since 2.0 Save the pending reasons for the different companies
			case 'Admin.CollectPendingReasons':
				this.lastPendReasons.set(parameters.get('companySkillId'), jsonResults);
				return true;		
		}
		return false;
	},
	
	/**
	 * Returns the email notification preferences
	 * @returns Hash The email notification preferences
	 * @since 2.0
	 */
	getEmailNotificationPreferences:function(){
		return this.emailNotificationPreferences;
	}
});
/**
 * One of the possible status for an element in the queue.
 * Indicate that the element is waiting in the queue
 * @type Integer
 * @since 2.0
 */
HrwEngine.inQueue = 0;

/**
 * One of the possible status for an element in the queue.
 * Indicate that the element is in the queue but the execution started
 * @type Integer
 * @since 2.0
 */
HrwEngine.inQueueStarted = 1;

/**
 * One of the possible status for an element in the queue.
 * Indicate that the element is not in teh queue
 * @type Integer
 * @since 2.0
 */
HrwEngine.notInQueue = 2;

/**
 * Default value to the HRW engine that there is nothing in a field
 * @type string
 * @since 2.0
 */
HrwEngine.NO_VALUE = '-2147483648';

if(!hrwEngine)
	var hrwEngine = new HrwEngine();
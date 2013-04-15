/**
 * @class
 * @description
 * @author jonathanj & nicolasl
 * @version 1.0
 */
var scm_ticketApp = Class.create(Application, /** @lends scm_ticketApp.prototype */{
	/**
	 * @type Boolean
	 * @description Indicate if the current process is a ticket creation or display
	 * @since 1.0
	 */
	_forCreation: null,
	
	/**
	 * @type Boolean
	 * @description Indicate if the ticket to display is for edition of display
	 * @since 1.0
	 */
	_forEdition: null,
	
	/**
	 * @type String
	 * @description Indicate the currently displayed part of the screen
	 * @since 1.0
	 */
	_currentPart: null,
	
	/**
	 * @type String
	 * @description Indicate the currently displayed application
	 * @since 1.0
	 */
	_currentAppli: null,
	
	/**
	 * @type Hash
	 * @description Save the last arguments for the next display
	 * @since 1.0
	 */
	_lastArgs: null,
	
	/**
	 * @type Hash
	 * @description List of the global parameters usable by each sub-screen
	 * @since 1.0
	 */
	_globalParams: null,
	
	/**
	 * @type Object
	 * @description List of the event listeners
	 * @since 1.0
	 */
	_eventListeners: null,
	
	/**
	 * @type Boolean
	 * @since 1.0
	 */
	_firstSubCall: null,
	
	/**
	 * @param {JSON Object} appName
	 * @since 1.0
	 */
	initialize : function($super,appName) {
		$super(appName);
		this._eventListeners = {
			addParam: this.addParam.bindAsEventListener(this)
		};
	},
	
	/**	
	 * @param {Object} args Should contains the "selectedPart" that could be in the constants and "forCreation" to indicate if it is a ticket creation or a display.
	 * @since 1.0
	 */
	run : function($super, args) {
		$super(args);
		
		this._firstSubCall = true;
		
		document.observe('EWS:SCM_ticketApp_AddParam', this._eventListeners.addParam);	
		this._globalParams = $H();
		
		//Delete the content of the screen to display the new one
		this.virtualHtml.update();
		
		//There is no args if the tab is called directly
		if(args.size() === 1) {
			if(this._lastArgs === null) {
				this.virtualHtml.update('<br/>' + global.getLabel('No_selected_ticket') + '<br/>' + global.getLabel('Choose_or_create_ticket'));
				return;
			}
			else args = this._lastArgs;
		}
		
		if(args.get('selectedPart'))				this._currentPart 	= args.get('selectedPart');
		else if(this._currentPart === null)			this._currentPart 	= scm_ticketApp.PROPERTIES;
		if(!Object.isEmpty(args.get('forCreation')))this._forCreation 	= args.get('forCreation');
		if(!Object.isEmpty(args.get('forEdition')))	this._forEdition	= args.get('forEdition');
		
		//For the ticket creation, there is no other option
		if(this._forCreation === true) this._currentPart 	= scm_ticketApp.PROPERTIES;
		
		//Keep the arguments to be able to redraw the screen
		this._lastArgs = args;
		//Reset the currently displayed appli
		this._currentAppli = null;
		//Build the HTML code
		this.virtualHtml.insert(this.getScreenContent(this._currentPart, args));
		//Set the initial application
		this.changeApplication(this._currentPart, args);
		document.fire('EWS:SCM_ticketApp_allowClosing');
	},
	
	/**
	 * 
	 * @since 1.0
	 */
	close : function($super) {
		$super();
		
		document.stopObserving('EWS:SCM_ticketApp_AddParam', this._eventListeners.addParam);
		this._currentAppli = null;
		this._globalParams = null;
	},
	
	/**
	 * @param {JSON Object} args Name and value of the param
	 * @description Modify or add the given parameter value
	 * @since 1.0
	 */
	addParam: function(args) {
		var paramName 	= getArgs(args).name;
		var paramValue	= getArgs(args).value;
		
		if(Object.isEmpty(paramValue)) this._globalParams.unset(paramName);
		else this._globalParams.set(paramName, paramValue);
	},
	
	/**
	 * @param {String} selectedPart Which is the selected part in 'Properties', 'Documents' or 'Tasks'
	 * @param {JSON Object} args List of given arguments
	 * @description Get the content to display in the screen.
	 * @returns {Element}
	 * @since 1.0
	 */
	getScreenContent: function(selectedPart, args) {
		var subAppli 		= new Template('<span class="SCM_ticket_link" part="#{id}" id="SCM_ticket_#{id}">#{label}</span>')
		var screenContent 	= new Element('div', {'class': 'SCM_ticket_links'});
		var listLinks 		= $A([{id: scm_ticketApp.PROPERTIES	, label: global.getLabel('Properties')}]);
		
		if(this._forCreation !== true)
			listLinks.push({id: scm_ticketApp.DOCUMENTS	, label: global.getLabel('Documents')});
		
		//listLinks.push({id: scm_ticketApp.TASKS	, label: global.getLabel('Tasks')});
							
		listLinks.each(function(params) {
			screenContent.insert(subAppli.evaluate(params));
		}.bind(this));
		
		return screenContent;
	},
	
	/**
	 * @param {String} newSelPart Name of the part to select
	 * @param {Hash} args Arguments given during the application call
	 * @description Move the link from the current application to a new one.
	 * @since 1.0
	 */
	changeApplication: function(newSelPart, args) {
		var oldPart = this._currentPart;
		var links = this.virtualHtml.select('span.SCM_ticket_link');
		
		if(links.size() === 1 && links[0].visible() === true) links[0].hide();
		
		links.each(function(link) {
			link.stopObserving('click');
			//If it is the link to add => add and load its content
			if(link.identify() === 'SCM_ticket_' + newSelPart) {
				this._currentPart = newSelPart;
				if(link.hasClassName('application_action_link'))
					link.removeClassName('application_action_link');
				
				if (!this._firstSubCall && oldPart === scm_ticketApp.PROPERTIES) {
					document.observe('EWS:SCM_ticketApp_allowClosing', this.startApplication.bindAsEventListener(this, args, link));
					document.fire('EWS:SCM_ticketApp_askClosing', {
						newAppli: newSelPart,
						args: args
					});
				}
				else this.startApplication(null, args, link);
			}
			else this.addLink(link, args);
		}.bind(this));
		
		this._firstSubCall = false;
	},
	
	/**
	 * @param {Element} element Make the element as a link
	 * @param {Hash} args Arguments given during the application call
	 * @description Move the link from the current application to a new one.
	 * @since 1.0
	 */
	addLink: function(element, args) {
		var part = element.readAttribute('part');
		if(!element.hasClassName('application_action_link')) element.addClassName('application_action_link');
		element.observe('click', this.changeApplication.bind(this, part, args));
	},
	
	/**
	 * @param {Event} event Event with the clicked element
	 * @param {JSON Object} args List of given arguments
	 * @param {Element} element
	 * @description Get the content to display in the screen.
	 * @since 1.0
	 */
	startApplication: function(event, args, element) {
		document.stopObserving('EWS:SCM_ticketApp_allowClosing');
		//Close the previous application before starting the new one  
		if(this._currentAppli !== null) { 
			this.closeApplication(this._currentAppli);
			this._currentAppli = null;
		}
		
		// Get the parameters of the new application	
		switch(element.identify()){
			case 'SCM_ticket_' + scm_ticketApp.PROPERTIES:
				if(this._forCreation) this._currentAppli = 'scm_createTicket';
				else if(this._forEdition) this._currentAppli = 'scm_editTicket';
				else this._currentAppli = 'scm_viewTicket';
				break;
				
			case 'SCM_ticket_' + scm_ticketApp.DOCUMENTS:
				this._currentAppli = 'scm_ticketDocuments';
				break;
				
			//since 2.0 Addition of the class for tasks
			case 'SCM_ticket_' + scm_ticketApp.TASKS:
				this._currentAppli = 'scm_ticketTasks';
				break;
		}
		
		//Call the new application
		this.callApplication(this._currentAppli, args);
	},
	
	/**
	 * @param {String} appView of the application
	 * @param {JSON Object} args List of given arguments
	 * @description Call the application and display it under the current one or close it.
	 * @since 1.0
	 */
	callApplication: function(appView, args) {
		var appArgs = $H();
		var appId;

		if(args)
			args.each(function(arg) {
				if(!Object.isEmpty(arg.value))
					appArgs.set(arg.key, arg.value);
			}.bind(this));
		
		appArgs = appArgs.merge(this._globalParams);
		
		appArgs.set('editMode'	, (this._forCreation || this._forEdition));
		appArgs.set('position'	, 'bottom');
		appArgs.set('closing'	, false );
		//Wait that the create ticket event handler is finished
		
		switch(appView){
			case 'scm_createTicket'		: appId = 'CREA_TIK';	break;
			case 'scm_editTicket'		: appId = 'EDIT_TIK';	break;
			case 'scm_viewTicket'		: appId = 'VIEW_TIK';	break;
			case 'scm_ticketDocuments'	: appId = 'TIK_VDOC';	break;	
			//since 2.0 Add the task for the ticket
			case 'scm_ticketTasks'		: appId = 'TIK_TASK';	break;	
		}
		
		//Open the application
		appArgs.set('app', {
			appId		: appId		,
			tabId		: 'SUBAPP'	,
			view		: appView
		});
		
		global.open(appArgs);
	},
	
	/**
	 * @param {String} appView View linked to the applicatin to close
	 * @description Close an application
	 * @since 1.0
	 */
	closeApplication: function(appView) {
		if(global.currentSubSubApplication && global.currentSubSubApplication.view === appView)
			global.closeSubSubApplication();
		else if(global.currentSubApplication && global.currentSubApplication.view === appView)
			global.closeSubApplication();
	}
});
/**
 * @type String
 * @since 1.0
 */
scm_ticketApp.PROPERTIES = 'Properties';
/**
 * @type String
 * @since 1.0
 */
scm_ticketApp.DOCUMENTS  = 'Documents';
/**
 * @type String
 * @since 1.0
 */
scm_ticketApp.TASKS 	 = 'Tasks';
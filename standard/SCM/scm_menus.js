/**
 * @class
 * @description Display the list of tickets in processing, the notifications and 
 * allows to select a default ticket in processing and to create new tickets.
 * @augments Menu
 * @author jonathanj & nicolasl
 * @version 2.2
 * <br/>Modifications for 2.2
 * <ul>
 * <li>Load the list of processing tickets on initial loading</li>
 * </ul> 
 */
var scm_MyCurrentTicket = Class.create(Menu, /** @lends scm_MyCurrentTicket.prototype */{
    /**
	 * @type Hash
	 * @description List of the event handlers bind to this class.
	 * @since 1.0
	 */
	_listeners: null,
	
    /**
	 * @type Element
	 * @description HTML div that contains the menu.
	 * @since 1.0
	 */
    virtualHtml: null,
    
    /**
	 * @type String
	 * @description Identifier of the currently selected ticket.
	 * @since 1.0
	 */
    currentTicket: null,
    
    /**
	 * @type EmployeeSearch
	 * @description Object used to build the employees list.
	 * @since 1.0
	 */
    employeeSearch: null,
    
    /**
	 * @type Hash
	 * @description List of tickets with there Id as key.
	 * @since 1.0
	 */
    _tickets: null,
    
    /**
	 * @type {id: String, button: megaButtonDisplayer}
	 * @description The mega button displayer of the create ticket button and its id.
	 * @since 1.0
	 */
    _createTicketButton: null,
    
	/**
	 * @type String
	 * @description Indicate if the mode is:
	 * <ul>
	 * 	<li><i>scm_MyCurrentTicket.AGENT</i> if the user is in the agent or general pool,</li> 
	 * 	<li><i>scm_MyCurrentTicket.TL</i> if the agent is in the team leader pool <b>with a team selected</b> or</li> 
	 * 	<li><i>scm_MyCurrentTicket.OPM</i> if the agent is in the OPM pool</li>
	 * 	<li><i>scm_MyCurrentTicket.OFF</i> if the HRW connexion is lost</li>
	 * </ul>
	 * If the agent is not in one of these places, the last mode is kept.
	 * @since 1.0
	 */
	_mode: null,
	
	/**
	 * @type Boolean
	 * @description Indicate if there is a selected team
	 * @since 1.0
	 */
	_teamSelected: null,
	
	/**
	 * Indicate if it is the first display of the menu
	 * @default true
	 * @type Boolean
	 * @since 1.1
	 */
	_firstDisplayOfNotifs: true,
	
	/**
	 * @type String
	 * @description Indicate if the mode currently in use (the mode display in the screen now) is:
	 * <ul>
	 * 	<li><i>scm_MyCurrentTicket.AGENT</i> if the user is in the agent or general pool,</li> 
	 * 	<li><i>scm_MyCurrentTicket.TL</i> if the agent is in the team leader pool <b>with a team selected</b> or</li> 
	 * 	<li><i>scm_MyCurrentTicket.OPM</i> if the agent is in the OPM pool</li>
	 * 	<li><i>scm_MyCurrentTicket.OFF</i> if the HRW connexion is lost</li>
	 * </ul>
	 * @since 1.1
	 */
	_currentMode: null,
	
	/**
	 * Class constructor that calls the parent and sets the event listener for the class.
	 * @param {String} id
	 * @param {JSON Object} options
	 * @since 1.0
	 * <br/> Modification for 1.1:
	 * <ul>
	 * <li>Update the parameter to indicate that the notifs are not on the screen</li>
	 * </ul>
	 */
    initialize: function($super, id, options){
        $super(id, options);
        
		//since 1.1 Indicate that the notifs are not yet on the screen
		this._firstDisplayOfNotifs	= true;
		
		this._teamSelected 			= false;
		this._allowNotifRefresh		= true;
		
        this._listeners = $H({
            refreshPendList     : this.refreshPendList.bindAsEventListener(this)    	,
            employeeSelected    : this.employeeSelected.bindAsEventListener(this)   	,
            noEmployeeSelected  : this.noEmployeeSelected.bindAsEventListener(this)		,
			newNotification		: this.refreshNotifications.bindAsEventListener(this)	,
			poolOpened          : this.poolOpened.bindAsEventListener(this)            	,
			teamSelected		: this.teamSelected.bindAsEventListener(this)			,
			updateMode			: this.updateMode.bindAsEventListener(this)				,
			noMoreConnected		: this.noMoreConnected.bindAsEventListener(this)		,
			hrwConnected		: this.hrwConnected.bindAsEventListener(this)
        });
		
		document.observe('EWS:scm_poolOpened', this._listeners.get('poolOpened'));
    },
	
	/**
	 * Once the menu is to display, build its HTML content or rebuild it and start the listening of menu
	 * events.
	 * @param {Object} element
	 * @since 1.0
	 */
    show: function($super, element){
        $super(element);
		
		this.changeTitle(global.getLabel('scm_MyCurrentTicket'));
		
        //Add the main div in the screen
    	if(this.virtualHtml === null) {
    	    //Login in HRW
            hrwEngine.login(this);
            
	        this.virtualHtml = new Element('div', {'id': 'SCM_myCurrTicket'});
	        //Display the content
	        this.changeContent(this.virtualHtml);
	        //Build the main architecture of the ticket
            this.buildMainDivs(this.virtualHtml);
            
        //Display simply the content            
        } else {
	        this.changeContent(this.virtualHtml);
			if(!Object.isEmpty(this.employeeSearch)) this.employeeSearch.reload();
	    }
		
	    //List to some global event
    	document.observe('EWS:scm_refreshPendList'      , this._listeners.get('refreshPendList')    );
		document.observe('EWS:scm_employeeSearchChanged', this._listeners.get('noEmployeeSelected')	);
    	document.observe('EWS:scm_employeeSelected'     , this._listeners.get('employeeSelected')   );
    	document.observe('EWS:scm_noEmployeeSelected'   , this._listeners.get('noEmployeeSelected') );
		document.observe('EWS:scm_new_notification'		, this._listeners.get('newNotification')	);
		document.observe('EWS:scm_teamSelected' 		, this._listeners.get('teamSelected')		);
		document.observe('EWS:scm_poolItemsLoaded' 		, this._listeners.get('updateMode')			);
		document.observe('EWS:scm_noMoreConnected'		, this._listeners.get('noMoreConnected')	);
		document.observe('EWS:scm_HrwConnected'			, this._listeners.get('hrwConnected')		);
	},

	/**
	 * Disable the observing of events once the menu is closed.
	 * @since 1.0
	 */
    close: function($super){
		document.stopObserving('EWS:scm_refreshPendList'    	, this._listeners.get('refreshPendList')    );
		document.stopObserving('EWS:scm_employeeSearchChanged'	, this._listeners.get('noEmployeeSelected')	);
        document.stopObserving('EWS:scm_employeeSelected'   	, this._listeners.get('employeeSelected')   );
    	document.stopObserving('EWS:scm_noEmployeeSelected' 	, this._listeners.get('noEmployeeSelected') );
		document.stopObserving('EWS:scm_new_notification'		, this._listeners.get('newNotification')	);
		document.stopObserving('EWS:scm_teamSelected' 			, this._listeners.get('teamSelected')		);
		document.stopObserving('EWS:scm_poolItemsLoaded' 		, this._listeners.get('updateMode')			);
		document.stopObserving('EWS:scm_noMoreConnected'		, this._listeners.get('noMoreConnected')	);
		document.stopObserving('EWS:scm_HrwConnected'			, this._listeners.get('hrwConnected')		);
    },
    
    /**
     * @param {Element} parentNode Node that has to contains the divs
     * @description Build the main structure of the menu content with the different divs. 
     * This method fixes the default display. 
     * <b>Since 1.1</b>, it is not useful to load the list of notifications because 
     * the selection of the mode calls it automatically 
	 * @since 1.0
	 * <br/> Modification for 2.2:
	 * <ul>
	 * <li>Load the list of processing tickets when loading</li>
	 * </ul>
     */
    buildMainDivs: function(parentNode) {
        var divTemplate = new Template( '<div class="SCM_myCurrTicketDiv_categ" id="SCM_myCurrTicketDiv_#{id}">'
                                    +       '<div id="SCM_myCurrTicketArrow_#{id}" divext="SCM_myCurrTicketDivExt_#{id}" class="application_action_link application_down_arrow SCM_myCurrTicketArrow"></div>'
                                    +       '<span class="SCM_myCurrTicketTitle" id="SCM_myCurrTicketDivTitle_#{id}"></span>'
                                    +       '<div class="SCM_myCurrTicketDivMain_Tickets" id="SCM_myCurrTicketDivExt_#{id}"></div>'
                                    +       '<div class="application_clear_line"></div>'
                                    +   '</div>');
                         
        parentNode.insert(divTemplate.evaluate({'id': 'Mode'  		}));
		parentNode.insert(divTemplate.evaluate({'id': 'Tickets'		}));
		parentNode.insert(divTemplate.evaluate({'id': 'ActEmpl'		}));
		parentNode.insert(divTemplate.evaluate({'id': 'Requestor'	}));
		parentNode.insert(divTemplate.evaluate({'id': 'Notification'}));
        parentNode.insert(divTemplate.evaluate({'id': 'FindEmpl' 	}));
		
		//Get the default mode
		this.getDefaultMode();
		
		//Update the form to find an employee
        this.updateFindEmployee();
        
        //Call the backend to have the list of tickets in updateTickets
		//since 2.2 Load the list of processing tickets on load. It is not normal, but it happens
        this.refreshPendList();
		
		//Collapse the notifications by default
		this.collapseLine(parentNode.down('[id="SCM_myCurrTicketDiv_Notification"]'));
    },
    
	/**
	 * @param {Boolean} toCollapse (default: false)Indicate if the list of notifications is automatically to collapse.
     * @description Call the backend to get the list of notifications
	 * @since 1.0
	 * <br/> Modification for 1.1:
	 * <ul>
	 * <li>Update the parameter to indicate that the notifs are on the screen</li>
	 * </ul>
     * @see scm_MyCurrentTicket#updateNotifs
     */
	refreshNotifications: function(toCollapse) {
		if(toCollapse !== true) toCollapse = false;
		
		if(Object.isEmpty(this._mode)) {
			new PeriodicalExecuter(function(pe) {
				if (Object.isEmpty(this._mode)) return;
			    pe.stop();
				if(this._mode !== scm_MyCurrentTicket.OPM && this._mode !== scm_MyCurrentTicket.OFF)
					hrwEngine.callBackend(this, 'TicketPool.GetNotificationHistory', $H({scAgentId: hrwEngine.scAgentId}), this.updateNotifs.bind(this, toCollapse));
			}.bind(this), 1);
		} else if(this._mode !== scm_MyCurrentTicket.OPM && this._mode !== scm_MyCurrentTicket.OFF)
			hrwEngine.callBackend(this, 'TicketPool.GetNotificationHistory', $H({scAgentId: hrwEngine.scAgentId}), this.updateNotifs.bind(this, toCollapse));
		
		//since 1.1 Indicate that the notification are already on the screen
		this._firstDisplayOfNotifs = false;
	},
	
    /**
     * @description Call the backend to get the list of pending tickets.
	 * @since 1.0
     * @see scm_MyCurrentTicket#updateTickets
     */
    refreshPendList: function() {
        this.currentTicket = null;
        hrwEngine.callBackend(this, 'TicketPool.GetProcessingPool', $H({scAgentId: hrwEngine.scAgentId}), this.updateTickets.bind(this));
    },
    
	/**
     * @description Handle the opening of a pool to adapt the mode.
	 * @since 1.0
     * @see scm_MyCurrentTicket#_mode
     */
	poolOpened: function(options) {
		//If we are no more logged => no connection
		if(hrwEngine.sessionLost === true) {
			this._mode = scm_MyCurrentTicket.OFF;
			return;
		}
		
		//Determine the mode from the pool type
		switch(getArgs(options).poolType) {
			case 'MyPool':
			case 'GeneralPool':
				if(this._mode === scm_MyCurrentTicket.AGENT) return;
				this._mode = scm_MyCurrentTicket.AGENT;
				break;
			case 'TeamPool':
				if(this._mode === scm_MyCurrentTicket.TL) return;
				if(this._teamSelected === true)
					this._mode = scm_MyCurrentTicket.TL;
				break;
			case 'OPMPool':
				if(this._mode === scm_MyCurrentTicket.OPM) return;
				this._mode = scm_MyCurrentTicket.OPM;
				break;
		}
	},
    /**
     * @param {String} id Identifier to define a unique div.
     * @param {Element/String} visibleLine Line that is always visible to indicate the content of the section.
     * @param {Element} extension Content to show/hide when clicking (if empty =>not possible to extend).
     * @description Update the content of a div in the menu with the given titles and content. <br/>
     * If there is no content, the part is automatically collpased and not extendable.
     * @returns {Element} The element that contains the arrow for the collapsing/Extension
	 * @since 1.0
     */
    updateDiv: function(id, visibleLine, extension) {
        var mainDiv = this.virtualHtml.down('div#SCM_myCurrTicketDiv_' + id);
		var arrow;
		
        if(mainDiv.visible() === false) mainDiv.show();
        
        div = mainDiv.down('span#SCM_myCurrTicketDivTitle_' + id);
        if(!Object.isEmpty(div)) {
            div.update();
            div.insert(visibleLine);
        }
         
        div = mainDiv.down('div#SCM_myCurrTicketDivExt_' + id);   
        if(!Object.isEmpty(div)) {
            div.update();
            div.insert(extension);
        }  
        
        //If there is a non empty extension => add to observe the on click
        if(!Object.isEmpty(extension)) {
			arrow = mainDiv.down('div#SCM_myCurrTicketArrow_' + id);
            arrow.stopObserving();
            arrow.observe('click', function(event) {
                var element = Event.element(event);
				
                //We are in the case where we have to hide the content
                if(element.hasClassName('application_down_arrow')) this.collapseLine(element)
				
                //We are in the case where we want to extend the section
                else if(element.hasClassName('application_verticalR_arrow')) this.expandLine(element);
            }.bindAsEventListener(this));
			
        //If there is no extension => the arrow is not a link and is always extended
        } else {
            arrow = mainDiv.down('div#SCM_myCurrTicketArrow_' + id);
            if(arrow.hasClassName('application_down_arrow')) {
                arrow.removeClassName('application_action_link');
                arrow.removeClassName('application_down_arrow');
                arrow.addClassName('application_verticalR_arrow');
                mainDiv.down('div#SCM_myCurrTicketDivExt_' + id).hide();
            }
        }
		
		return arrow;
    },
    
	/**
     * @param {Element} element Element to expand
     * @description Expand manually a section
     * @returns {Boolean} Is the expension really done?
	 * @since 1.0
     */
	expandLine: function(element) {
		if(!element.hasClassName('application_verticalR_arrow')) return false;
		
        element.removeClassName('application_verticalR_arrow');
        element.addClassName('application_down_arrow');
        this.virtualHtml.down('div#'+element.readAttribute('divext')).show();
		return true;
	},
	
	/**
     * @param {Element} element Element to collapse
     * @description Collapse manually a section
     * @returns {Boolean} Is the collapsing really done?
	 * @since 1.0
     */
	collapseLine: function(element) {
		if (!element.hasClassName('application_down_arrow')) return false;
		
		element.removeClassName('application_down_arrow');
		element.addClassName('application_verticalR_arrow');
		this.virtualHtml.down('div#' + element.readAttribute('divext')).hide();
		return true;
	},
	
    /**
     * @param {String} id Identifier to define a unique div
     * @description Hide one of the submenus completely
	 * @since 1.0
     */
    hideDiv: function(id) {
        var div = this.virtualHtml.down('div#SCM_myCurrTicketDiv_' + id);
        if(div.visible() === true) div.hide();
    },
    
    /**
     * @param {JSON Object} ticketsJson Json that allows to build the list of tickets
     * @description Get the content to display in the list of tickets under processing
	 * @since 1.0
	 * <br/> For version 1.1
	 * <ul>
	 * <li>The parameter ticketsJson could be empty if we are sure there is no ticket in processing</li>
	 * <li>Remove the call to the manage heartBeat</li>
	 * </ul>
     */
    updateTickets: function(ticketsJson) {		
		var defaultTicketPos 	= 0;
		var logActionChecked	= false;
		var promptAlwaysChecked	= false;

		if(global.activateHRWLog && !Object.isEmpty(this.virtualHtml.down('div#SCM_myCurrTicketDiv_LogActions'))) {
			logActionChecked 	= this.virtualHtml.down('[id="'+SCM_SaverToTicket.DIV_LOG_ACTION+'"]').down('input[name="SCM_MyCurrTicket_LogActions"]').checked;
			promptAlwaysChecked = this.virtualHtml.down('[id="'+SCM_SaverToTicket.DIV_PROMPT_ALWAYS+'"]').down('input[name="SCM_MyCurrTicket_PromptAlways"]').checked;
		}
				
        //Create the title and the list of tickets 
        var title       = global.getLabel('tickets_in_processing_assigned_to_me');
        var extension   = new Element('div');
        
        //Get the list of tickets
		//since 1.1 It coud be that the parameter ticketsJson is empty                           
        var tickets;
		if(!Object.isEmpty(ticketsJson)) tickets = ticketsJson.EWS.HrwResponse.HrwResult.TicketPoolData.HrwPoolTickets;
        
		if (!Object.isEmpty(tickets)) tickets = objectToArray(tickets.HrwPoolTicket);
		else tickets = $A();
		    
		//Reset the list of tickets
		this._tickets = $H();
		
	    //Create the tickets objects for each ticket
		tickets.each( function(ticket, key) {
			poolTicket = SCM_Ticket.factory('MyCurrentTicket');
			poolTicket.addMainInfo(ticket);

            //Add the ticket parameters in the global list
            this._tickets.set(poolTicket.getValue('TICKET_ID'), poolTicket);
		}.bind(this));
		
		extension.insert(this.buildTicketList());
        
        //If there are some tickets, allow to select for notifications and add the selection event and set the default ticket
        if(this.hasTickets() === true) {
            this.updateActiveEmployee(this.currentTicket);
			title += '<input type="hidden" id="' + SCM_SaverToTicket.DIV_HAS_TICKETS + '" value="true"/>';                           
        } else {
            this.hideDiv('ActEmpl');
            this.hideDiv('Requestor');
			title += '<input type="hidden" id="' + SCM_SaverToTicket.DIV_HAS_TICKETS + '" value="false"/>';
		}
		
		//Add the log actions select box
		if(global.activateHRWLog)
			extension.insert(	'<div class="SCM_myCurrTicketDiv_categ" id="SCM_myCurrTicketDiv_LogActions">'
	                    +       	'<div id="SCM_myCurrTicketArrow_LogActions" divext="SCM_myCurrTicketDivExt_LogActions" class="application_action_link application_down_arrow SCM_myCurrTicketArrow"></div>'
	                    +       	'<span class="SCM_myCurrTicketTitle" id="SCM_myCurrTicketDivTitle_LogActions"></span>'
	                    +       	'<div class="SCM_myCurrTicketDivMain_Tickets" id="SCM_myCurrTicketDivExt_LogActions"></div>'
	                    +   	'</div>');				
		
       	this.updateDiv('Tickets', title, extension);
		
		//Update the list of log actions pane
		if (global.activateHRWLog) {
			var template = new Template('<div id="#{id}">'
									+		'<input #{checked} type="checkbox" name="#{name}"/>'
									+		'<span class="SCM_myCurrTicket_LogText">#{label}</span>'
									+	'</div>')
			
			this.updateDiv('LogActions', global.getLabel('LogProperties'), new Element('div').insert(template.evaluate({
				'id'	: SCM_SaverToTicket.DIV_LOG_ACTION,
				name	: 'SCM_MyCurrTicket_LogActions',
				label	: global.getLabel('log_actions_to_sel_ticket'),
				checked	: (logActionChecked) ? 'checked="checked"' : ''
			}) +
			template.evaluate({
				'id'	: SCM_SaverToTicket.DIV_PROMPT_ALWAYS,
				name	: 'SCM_MyCurrTicket_PromptAlways',
				label	: global.getLabel('AlwaysPromptBeforeUpdate'),
				checked	: (promptAlwaysChecked) ? 'checked="checked"' : ''
			})));
			
			//Collapse the actions when the tickets are updated
			this.collapseLine(extension.down('div#SCM_myCurrTicketArrow_LogActions'));
		}
    },
	
	/**
	 * @param {Boolean} toCollapse Indicate if the list of notifs is to collapse automatically.
	 * @param {JSON Object} jsonNotifs List of notifications from the backend.
     * @description Update the display of the list of notifications with a new list.
	 * @since 1.0
	 * <br/>Modified in verison 2.0
	 * <ul>
	 * <li>Manage the schedule elapsed notifications</li>
	 * </ul>
	 * <br/>Modified in version 1.1:
	 * <ul>
	 * <li>Remove the call to the manage heartBeat</li>
	 * </ul>
     */
	updateNotifs: function(toCollapse, jsonNotifs) {
		var notifTemp 	= new Template(	'<li notifid="#{NotificationId}" title="#{ToolTipMessage}">'
									+		'<div class="application_action_link application_currentSelection SCM_currTick_delNotif"> </div>'
									+		'<div class="SCM_ActionsIconSize">'
									+			'<div class="#{NotifReasonClass}"> </div>'
									+		'</div>'
									+		'#{DateTime} - '
									+		'<span withdelete="#{withDelete}" class="application_action_link">#{TicketId}</span>'
									+	'</li>');
		//since 2.0 Create a template without deletion							
		var notifNoDel	= new Template(	'<li notifid="#{NotificationId}" title="#{ToolTipMessage}">'
									+		'<div class="SCM_ActionsIconSize">'
									+			'<div class="#{NotifReasonClass}"> </div>'
									+		'</div>'
									+		'#{DateTime} - '
									+		'<span withdelete="#{withDelete}" class="application_action_link">#{TicketId}</span>'
									+	'</li>');
									
		var extCont		= '';
		var notifs 		= $A();
		var extension   = null;
		var title		= null;

		if (Object.jsonPathExists(jsonNotifs, 'EWS.HrwResponse.HrwResult.ArrayOfHrwNotification.HrwNotification') === true) {
			notifs = objectToArray(jsonNotifs.EWS.HrwResponse.HrwResult.ArrayOfHrwNotification.HrwNotification).sortBy(function(notif) {
				return (new Number(	notif.NotificationDateTime.substr(0, 4) 
						+ 	notif.NotificationDateTime.substr(5, 2) 
						+ 	notif.NotificationDateTime.substr(8, 2)
						+	notif.NotificationDateTime.substr(11, 2)
						+	notif.NotificationDateTime.substr(14, 2)
						+	notif.NotificationDateTime.substr(17, 2)) * (-1));
			});
		}
		
		//Create the title 
        title = global.getLabel('Notifications_for') + ' <span id="SCM_currTicket_notif_mode">' + global.getLabel(this._mode) + '</span> (' + notifs.size() + ')';
        
		//Get the list of notifications
		if(notifs.size() > 0) {
			extension 	= new Element('div');	
				
			// Add the notifications
			extCont = '<ul class="SCM_list_no_bullet">';

			notifs.each(function(notif) {
				//since 2.0 Add the default template
				notif.withDelete = "true";
				switch(notif.NotificationReason) {
					case '0' : notif.NotifReasonClass = 'SCM_ActionNewUserIcon SCM_ActionsIconSize'; 	break;
					//since 2.0 Add the scheduled tickets
					case '100':
						notif.withDelete = "false";
						//Don't put a break, there is also to add the schedule icon
					case '2' : 
						if(notif.ticketType === '0')
							notif.NotifReasonClass = 'SCM_DotBlueIcon SCM_DotIconsSize'; 	
						else
							notif.NotifReasonClass = 'SCM_DotBlueTicon SCM_DotIconsSize';
						break;
					case '3' : 
						if(notif.ticketType === '0')
							notif.NotifReasonClass = 'SCM_DotMauveIcon SCM_DotIconsSize'; 	
						else
							notif.NotifReasonClass = 'SCM_DotMauveTicon SCM_DotIconsSize';
						break;
					case '4' :
					case '15': 
						if(notif.ticketType === '0')
							notif.NotifReasonClass = 'SCM_DotBlackIcon SCM_DotIconsSize'; 	
						else
							notif.NotifReasonClass = 'SCM_DotBlackTicon SCM_DotIconsSize';
						break;
					case '12': notif.NotifReasonClass = 'SCM_ActionServicesIcon SCM_ActionsIconSize'; 	break;
					case '13': notif.NotifReasonClass = 'SCM_ActionNewItemIcon SCM_ActionsIconSize'; 	break;
					case '14': notif.NotifReasonClass = 'SCM_ActionOutOfSLAIcon SCM_ActionsIconSize'; 	break;
					case '16': 
						if(notif.ticketType === '0')
							notif.NotifReasonClass = 'SCM_DotBrownIcon SCM_DotIconsSize'; 	
						else
							notif.NotifReasonClass = 'SCM_DotBrownTicon SCM_DotIconsSize';
						break;
					case '17': 
						if(notif.ticketType === '0')
							notif.NotifReasonClass = 'SCM_DotMauveBlackIcon SCM_DotIconsSize'; 	
						else
							notif.NotifReasonClass = 'SCM_DotMauveBlackTicon SCM_DotIconsSize';
						break;	
					case '21': notif.NotifReasonClass = 'SCM_ActionAmberAlertIcon SCM_ActionsIconSize'; 	break;
					default  : notif.NotifReasonClass = '';												break;
				}
				notif.DateTime = SCM_Ticket.convertDateTime(notif.NotificationDateTime).truncate(23);
				//since 2.0 Use the adapted template
				if(notif.withDelete === "true") extCont += notifTemp.evaluate(notif);
				else extCont += notifNoDel.evaluate(notif);
			}.bind(this));
			extCont += '</ul>';
			extension.insert(extCont);
			extension.insert('<div class="application_action_link SCM_currTick_notifClear">' + global.getLabel('clear_notif') + '</div>');
			
			//Suppression of the given notification
			extension.select('div.SCM_currTick_delNotif').invoke('observe', 'click', function(event) {
				var notifId = event.element().up().readAttribute('notifid');
				hrwEngine.callBackend(this, 'TicketPool.RemoveHrwNotification', $H({
					scAgentId		: hrwEngine.scAgentId,
					notificationId	: notifId
				}), this.refreshNotifications.bind(this));
			}.bindAsEventListener(this));
			
			//Suppress all the notifications efore now
			extension.select('div.SCM_currTick_notifClear').invoke('observe', 'click', function() {
				hrwEngine.callBackend(this, 'TicketPool.ClearHrwNotifications', $H({
					scAgentId: hrwEngine.scAgentId
				}), this.refreshNotifications.bind(this));
			}.bindAsEventListener(this));
			
			var navigateToTicket = function(ticketId, inProcessing) {
				global.open($H({
					app: {
						appId	: 'TIK_PL',
						tabId	: 'PL_TIK',
						view	: 'scm_ticketApp'
					},
					forCreation	: false,
					forEdition	: inProcessing,
					ticketId	: ticketId
				}));
			};
			
			//since 1.1 - Allow to click on a ticket link
			extension.select('span.application_action_link').invoke('observe', 'click', function(event) {
				var ticketId 		= event.element().innerHTML;
				var withDelete		= (event.element().readAttribute('withdelete') === "true");
				var inProcessing 	= false;
				
				if($(SCM_SaverToTicket.DIV_TICKETS_LIST)) {
					$(SCM_SaverToTicket.DIV_TICKETS_LIST).select('li').each(function(listItem){
						if (ticketId === listItem.down('input').readAttribute('value')) 
							inProcessing = true;
					}, this);
				}
				
				//since 2.0 If the element is to delete, it is a normal notification
				if(withDelete) {
					navigateToTicket(ticketId, inProcessing);
				//since 2.0 If the notification is not to delete it means that the ticket is to take
				//in processing and the notification deleted
				} else {
					//Take the ticket in processing
					if(inProcessing === false) {
						hrwEngine.callBackend(this, 'Ticket.StartProcessingTicket', $H({
							'scAgentId': hrwEngine.scAgentId, 
							'ticketId': ticketId}), function(){
								this.refreshPendList();
								navigateToTicket(ticketId, true);
							}.bindAsEventListener(this));	
					} else 
						navigateToTicket(ticketId, inProcessing);
					
					//Remove the notification
					var notifId = event.element().up().readAttribute('notifid');
					hrwEngine.callBackend(this, 'TicketPool.RemoveHrwNotification', $H({
						scAgentId		: hrwEngine.scAgentId,
						notificationId	: notifId
					}), this.refreshNotifications.bind(this));
				}
				
			}.bindAsEventListener(this));
		} else {
			extension = new Element('div', {'class': 'application_main_soft_text SCM_solveNoDisplayProb'}).update(global.getLabel('No_notifications'));
		}
		
		if (!Object.isEmpty(this._mode)) {
			var notifDiv = this.updateDiv('Notification', title, extension);
			if (toCollapse === true) 
				this.collapseLine(notifDiv);
		} else {
			this.updateDiv('Notification', title, extension);
			this.hideDiv('Notification');
		} 	
	},
	
	/**
     * @description Get the default mode for the menu from the backend if there is no defined mode.
	 * @since 1.0
     * @see scm_MyCurrentTicket#getDefaultModeHandler
     * @see scm_MyCurrentTicket#_mode
     */
	getDefaultMode: function() {
		if (Object.isEmpty(this._mode) || this._mode === scm_MyCurrentTicket.OFF) {
			hrwEngine.callBackend(this, 'TicketPool.GetTicketPoolMode', $H({
				scAgentId: hrwEngine.scAgentId
			}), this.getDefaultModeHandler.bind(this));
		}
	},
	
	/**
	 * @param {JSON Object} jsonMode Mode of the current engine state
     * @description Handler that get the getDefaultMode method.
	 * @since 1.0
	 * <br/>Modified in version 1.1:
	 * <ul>
	 * <li>Remove the call to the manage heartBeat</li>
	 * </ul>
     * @see scm_MyCurrentTicket#getDefaultMode
     * @see scm_MyCurrentTicket#_mode
     */
	getDefaultModeHandler: function(jsonMode) {
		if(!Object.isEmpty(this._mode) && this._mode !== scm_MyCurrentTicket.OFF) return;
		
		switch(jsonMode.EWS.HrwResponse.HrwResult.TicketPoolMode.CurrentTicketPoolMode) {
			case '0': 
			case '1':
				this._mode = scm_MyCurrentTicket.AGENT;
				break;
			case '3':
				this._mode = scm_MyCurrentTicket.TL;
				break;
			case '4':
				this._mode = scm_MyCurrentTicket.OPM;
				break;
			default: 
				this._mode = scm_MyCurrentTicket.OFF;
				break;
		} 
		this.updateMode();
	},
	
	/**
     * @description Update the section with the current mode.
	 * @since 1.0
	 * <br/> Modification for 1.1:
	 * <ul>
	 * <li>Add in the parameters of the refresh notif if it is the first display for them</li>
	 * <li>Update the mode only if it is different that the previous one</li>
	 * </ul>
     * @see scm_MyCurrentTicket#_mode
     */
	updateMode: function() {
		//since 1.1 Do not update the mode if it is up to date
		if(this._currentMode === this._mode) return;
		
		var className;
		var mode = this._mode;
		var extension = null;
		
		switch(this._mode) {
			case scm_MyCurrentTicket.AGENT 	: 
				className = 'SCM_currTicket_mode_Agent';
				//since 1.1 Add the parameter to indicate if it is the first display of the notifs
				this.refreshNotifications(this._firstDisplayOfNotifs);
				break;
			case scm_MyCurrentTicket.TL		: 
				className = 'SCM_currTicket_mode_Tl';
				//since 1.1 Add the parameter to indicate if it is the first display of the notifs
				this.refreshNotifications(this._firstDisplayOfNotifs);
				break;
			case scm_MyCurrentTicket.OPM	: 
				className = 'SCM_currTicket_mode_Opm';
				this.hideDiv('Notification');
				break;
			case scm_MyCurrentTicket.OFF	: 
				className = 'SCM_currTicket_mode_Off';
				this.hideDiv('Notification');
				//Add a reconnection to HRW button
				extension = new Element('div');
				extension.insert('<div class="application_clear_line "> </div>');
				extension.insert(new megaButtonDisplayer({elements: $A([{
						label 			: global.getLabel('HRW_connect')				,
						handler 		: function() {hrwEngine.login(this);}.bind(this),
						type 			: 'button'										,
						idButton 		: 'SCM_Reconnect'								,
						standardButton 	: true
					}])}).getButtons());
				break;
		}

		var title 	= global.getLabel('Mode') + ': <span class="' + className + '">' + global.getLabel(this._mode) + '</span>';
		var inNotif = this.virtualHtml.down('span#SCM_currTicket_notif_mode');
		if(!Object.isEmpty(inNotif)) inNotif.innerHTML = global.getLabel(this._mode);
		
		if(this._mode === scm_MyCurrentTicket.OFF)
			this.expandLine(this.updateDiv('Mode', title, extension));
		else
			this.collapseLine(this.updateDiv('Mode', title, extension));
			
		//since 1.1 Update the mode currently on the screen
		this._currentMode = this._mode;	
	},
	
	/**
	 * @event
     * @description Indicate when a team is selected to update the mode.
	 * @since 1.0
	 * <br/>Modifications for 1.1
	 * <ul>
	 * <li>Do not call the update of the notifications because it will be done when retrieving tickets</li>
	 * </ul>
     * @see scm_MyCurrentTicket#_mode
     */
	teamSelected: function() {
		this._teamSelected 	= true;
		if(this._mode !== scm_MyCurrentTicket.TL){
			this._mode	= scm_MyCurrentTicket.TL;
			//since 1.1 This call is not needed, the call is done when the list of ticktes arrives
			//this.updateMode();
		}	
	},
    
    /**
     * @description Get the ticket that match the currenly selected ticket 
     * @returns {SCM_Ticket_MyCurrent} The selected ticket
	 * @since 1.0
     */
    getSelectedTicket: function() {
        return this._tickets.get(this.currentTicket);
    },
    
    /**
     * @description Check if there are tickets in the class.
     * @returns {Boolean} Are there tickets in the class?
	 * @since 1.0
     */
    hasTickets: function() {
        return (!Object.isEmpty(this._tickets) && this._tickets.size() > 0);
    },
    
    /**
     * @description Build the HTML code to get the list of employees 
     * @returns {Element} HTML div with the list of tickets in processing
	 * @since 1.0
     * @see SCM_SaverToTicket#DIV_TICKETS_LIST
     */
    buildTicketList: function() {
        var ticketLine;
        var input;
        var lineTemplate = new Template('<li>'
                                    +       '<input #{checked} type="radio" name="SCM_ticketsList" value="#{ticketId}"/>'
                                    +       '<span class="application_action_link">#{ticketId}</span>'
                                    +       '<span>&nbsp;&nbsp;</span>'
                                    +       '<span class="#{slaStyle}" title="#{servName}">#{servNameCont}</span>'
                                    +   '</li>');
        var list = new Element('ul', {'id': SCM_SaverToTicket.DIV_TICKETS_LIST, 'class': 'SCM_list_no_bullet'});
        
        if(this.hasTickets() === false)  
            return new Element('div', {'class': 'application_main_soft_text SCM_solveNoDisplayProb'}).update(global.getLabel('no_ticket_in_processing'));
            
        //Create the tickets objects for each ticket
		this._tickets.each( function(ticket, count) {	
		    // If there is no current ticket, set the first founded
		    if(Object.isEmpty(this.currentTicket)) this.currentTicket = ticket[0];
		    
		    var servName = ticket.value.getValue('SERV_NAME');	

			//Add the HTML line
			ticketLine = list.insert(lineTemplate.evaluate({
	            ticketId    : ticket.key			, 
	            servName    : servName			  	,
	            servNameCont: servName.truncate(20)	,
				slaStyle	: ticket.value.getOutOfSLAStyle().classStyle,
				checked		: (ticket.key === this.currentTicket)?'checked="checked"':''
	        }));
            input = ticketLine.childElements()[count].down();
            
            //Add the event handlers on the tickets
            input.observe('change', function (event) {           
                this.updateActiveEmployee(event.element().value);
            }.bindAsEventListener(this));
            
            ticketLine.childElements()[count].down(1).observe('click', function(event) {
                var ticketId = event.element().innerHTML;
				global.open($H({
					app: {
						appId: 'TIK_PL',
						tabId: 'PL_TIK',
						view : 'scm_ticketApp'
					},
					forCreation	: false,
					forEdition	: true,
					ticketId	: ticketId
				}));
            }.bindAsEventListener(this));

		}.bind(this));
		
		return list;
    },
    
    /**
     * @param {String} ticketId Id of the selected ticket
     * @description Get the content to display in the active employee field
	 * @since 1.0
	 * <br/>Modified in version 1.1:
	 * <ul>
	 * <li>Create the user actions via the factory</li>
	 * </ul>
     */
    updateActiveEmployee: function(ticketId) {
        this.currentTicket = ticketId;

        var ticket       = this._tickets.get(ticketId);
        var employeeId   = ticket.getValue('EMPLOYEE_ID');
        var employeeName = ticket.getValue('EMPLOYEE');
		var companyId		= ticket.getValue('COMPANY_ID');
        
        var title = new Element('span').update(
                        '<span class="SCM_myCurrTicket_allowDiv">'+global.getLabel('active_employee') + ':&nbsp;</span>'
                    +   '<span id="SCM_myCurrTicket_activeEmp" employeeId="'+employeeId+'">'+employeeName+'</span>');
               
        //Draw the divs for the active employee and the requestor
        this.updateDiv('ActEmpl', title, null);
        
        //Add the user action if there is an id for the employee
        if(!Object.isEmpty(employeeId)) {
			//since 1.1 Create the user actions via the factory
            var userAction = ScmUserAction.factory(ScmUserAction.DISPLAY_AS_MENU, this, 'SCM_myCurrTicket_activeEmp', $A(), this.virtualHtml, '*');
            userAction.addActionOnField(employeeId, employeeName, companyId, 2, true, false);
        } 
        
		//Update the requestor
        if(employeeId === ticket.getValue('REQUESTOR_ID'))
            this.hideDiv('Requestor');
        else
            this.updateDiv('Requestor', global.getLabel('requestor') + ':&nbsp;' + ticket.getValue('REQUESTOR'), null);
			
		//Select the log of actions
		var logActionDiv = this.virtualHtml.down('[id="' + SCM_SaverToTicket.DIV_LOG_ACTION + '"]');
		if(!Object.isEmpty(logActionDiv)) logActionDiv.down('input').checked = true;
    },
    
    /**
	 * @description Build the form to find an employee.
	 * @since 1.0
	 * @see ScmEmployeeSearch
	 */
    updateFindEmployee: function() {
        var title = global.getLabel('find_employee');
        var extension;
		
        this._createTicketButton = {'id': 'SCM_myCurrentTicket_createTicket'};
        
        //Add the create ticket button
        this._createTicketButton.button = new megaButtonDisplayer({
            elements : $A( [ 
                {
	                label 			: global.getLabel('create_ticket'),
	                handlerContext 	: null							  ,
	                handler 		: function() {						
						global.open($H({
							app: {
								appId:'TIK_PL', 
								tabId:'PL_TIK', 
								view:'scm_ticketApp'
							},
							selectedPart	: scm_ticketApp.PROPERTIES,
							empSearchVal	: this.employeeSearch.getValues(),
							forCreation		: true								
						}));
	                }.bind(this)	                                                ,
	                className 		: 'SCM_PoolTable_footerButton'	                ,
	                type 			: 'button'						                ,
	                idButton 		: this._createTicketButton.id             	    ,
	                standardButton 	: true
                }])
        });
        
		//If HRW is not connected, wait for its connection to know if customer or company based
		if(hrwEngine.isConnected()) {
			//Create the form
			this.employeeSearch = ScmEmployeeSearch.factory(this, 'myCurTickets', false, this.virtualHTML);
			extension = this.employeeSearch.getForm(true);
			//Add the form in the menu
			extension.insert(this._createTicketButton.button.getButtons());
    		this.updateDiv('FindEmpl', title, extension);
			//Initialize the form
			this.employeeSearch.setFormInitial(extension, false, hrwEngine.custCompMandatory);
		} else {
			new PeriodicalExecuter(function(pe) {
  				if (!hrwEngine.isConnected()) return;
    			pe.stop();
				//Create the form
				this.employeeSearch = ScmEmployeeSearch.factory(this, 'myCurTickets', false, this.virtualHTML);
				extension = this.employeeSearch.getForm(true);
				//Add the form in the menu
				extension.insert(this._createTicketButton.button.getButtons());
        		this.updateDiv('FindEmpl', title, extension);
				//Initialize the form
				this.employeeSearch.setFormInitial(extension, false, hrwEngine.custCompMandatory);
			}.bind(this), 1);
		}
		
    },
    
    /**
	 * @description Disable the create ticket button.
	 * @since 1.0
	 */
    disableCreateTicket: function() {
        this._createTicketButton.button.disable(this._createTicketButton.id);
    },
    
    /**
	 * @description Enable the create ticket button.
	 * @since 1.0
	 */    
    enableCreateTicket: function() {
        this._createTicketButton.button.enable(this._createTicketButton.id);
    },
    
    /**
     * @event
     * @param {JSON Object} eventArgs Contains the values of the selected employee and the identifier of the form.
	 * @description Handler for the selection of an employee via the form.
	 * @since 1.0
	 */
    employeeSelected: function(eventArgs) {
        if(getArgs(eventArgs).ident === this.employeeSearch.ident) 
            this.enableCreateTicket();
    },
    
    /**
     * @event
     * @param {Object} eventArgs Contains the values of the identifier of the form
	 * @description Handler for the deselection of an employee via the form.
	 * @since 1.0
	 */
    noEmployeeSelected: function(eventArgs) {
        if(getArgs(eventArgs) === this.employeeSearch.ident) 
            this.disableCreateTicket();
    },
	
	/**
	 * @event
	 * @description Once the HRW connection is lost => update the mode
	 * @since 1.0
	 * @see SCM_SaverToTicket#_mode
	 */
	noMoreConnected: function() {
		this._mode = scm_MyCurrentTicket.OFF;
		this.updateMode();
	},
	
	/**
	 * @event
	 * @param {Event} firstLog It is the first connection?
	 * @description HRW is again connected.
	 * @since 1.0
	 */
	hrwConnected: function(firstLog) {
		if(getArgs(firstLog) === true) return;
		this.refreshPendList();
		this.getDefaultMode();
	}
});

/**
 * Constant used to identify that the mode is <b>Agent</b>
 * @type String
 * @since 1.0
 */
scm_MyCurrentTicket.AGENT 	= 'Agent';

/**
 * Constant used to identify that the mode is <b>Team Leader</b>
 * @type String
 * @since 1.0
 */
scm_MyCurrentTicket.TL 		= 'Team_leader';

/**
 * Constant used to identify that the mode is <b>OPM</b>
 * @type String
 * @since 1.0
 */
scm_MyCurrentTicket.OPM		= 'OPM';

/**
 * Constant used to identify that the HRW connection is lost.
 * @type String
 * @since 1.0
 */
scm_MyCurrentTicket.OFF 	= 'HRW_conn_lost';

/**
 * @class
 * @description It is the ticket grouping menu item.
 * @augments Menu
 * @author jonathanj & nicolasl
 * @version 2.2
 * <br/>Modified for 2.2
 * <ul>
 * <li>Make sure the mapping between HRW and tree ids is build before using it</li>
 * </ul>
 * <br/>Modified for 2.1
 * <ul>
 * <li>Addition of a redirection that map an id generated for the tree content and the id from backend</li>
 * </ul>
 */
var scm_TicketGrouping = Class.create(Menu, /** @lends scm_TicketGrouping.prototype */{
	
	/**
	 * @type Element
	 * @description Main div in the menu that will contains all items.
	 * @since 1.0
	 */
	virtualHtml: null,
	
	/**
	 * @type JSON Object
	 * @default <ul><li>div: null</li><li>tree: null</li>
	 * @description Parameters linked to the tree with groupings.
	 * @since 1.0
	 */
	_groupingTree: null,
	
	/**
	 * @type JSON Object
	 * @default <ul><li>div: null</li><li>selected: $A()</li><li>ddId: 'SCM_TickGr_ListGrItems'</li></ul>
	 * @description Parameters linked to the list of grouping categories during there selection.
	 * @since 1.0
	 */
	_groupsList: null,
	
	/**
	 * @type JSON Object
	 * @default <ul><li>div: null</li><li>kind: null</li><li>button: null</li><li>divId: 'SCM_TicketGr_button'</li></ul>
	 * @description Parameters linked to the lbutton to navigate between edition and display.
	 * @since 1.0
	 */
	_button: null,
	
	/**
	 * @type JSON Object
	 * @default <ul><li>div: null</li><li>list: $A()</li></ul>
	 * @description Parameters linked to the display of the currently selected grouping.
	 * @since 1.0
	 */
	_selGrouping: null,
	
	/**
	 * @type Hash
	 * @description Save of the menu state by application.
	 * @since 1.0
	 */
	_appliTrees: null,
	
	/**
	 * @type Boolean
	 * @default false
	 * @description Variable to indicate that the previous application is really closed.
	 * @since 1.0
	 */
	_poolClosed: false,
	
	/**
	 * @type Hash
	 * @description List of the event handlers bind to this.
	 * @since 1.0
	 */
	_listeners: null,
	
	/**
	 * @type JSON Object
	 * @default <ul><li>TicketTreeNodes: null</li><li>TicketTreeGrouping: null</li><li>PoolType: null</li></ul>
	 * @description Json used to build the last grouping tree.
	 * @since 1.0
	 */
	_lastJson: null,
	
    /**
	 * @type String
	 * @default ""
	 * @description The currently selected node.
	 * @since 1.0
	 */
	selectedNode: '',
	
	/**
	 * Matching between the id in the tree and the id in the backend
	 * @type Hash
	 * @since 2.1
	 */
	treeIdsMatching: null,
	
	/**
	 * Class constructor that calls the parent and sets the event listener for the class
	 * @param {String} id
	 * @param {JSON Object} options
	 * @since 1.0
	 */
    initialize: function($super, id, options){
        $super(id, options);
        
        //Init parameters
        this._selGrouping 	= {div: null    , list: $A()};
        this._button		= {div: null    , kind: null    , button: null, divId: 'SCM_TicketGr_button'};
        this._groupingTree	= {div: null    , tree: null};
        this._groupsList    = {div: null    , selected: $A(), ddId: 'SCM_TickGr_ListGrItems'};
        this._appliTrees    = $H();
        this._poolClosed    = false;
        this._lastJson      = {TicketTreeNodes: null, TicketTreeGrouping: null, PoolType: null};
        
        //List of event handlers functions as event listeners
        this._listeners = $H({
        	buildGroupingSee	    : this.buildGroupingSee.bindAsEventListener(this)	    ,
        	buildGroupingEdit	    : this.buildGroupingEdit.bindAsEventListener(this)	    ,
        	poolOpened              : this.poolOpened.bindAsEventListener(this)             ,
        	poolClosed              : this.poolClosed.bindAsEventListener(this)             ,
        	noAvailableGrouping     : this.noAvailableGrouping.bindAsEventListener(this)    ,
        	setDefaultGrouping      : this.setDefaultGrouping.bindAsEventListener(this)     ,
			cleanGrouping			: this.cleanGrouping.bindAsEventListener(this)			});
    },

	/**
	 * Build the list of groups and display it in the menu. It also start to listen the events.
	 * @param {Object} element
	 * @since 1.0
	 */
    show: function($super, element){
    	$super(element);
        
		this.changeTitle(global.getLabel('scm_TicketGrouping'));
		
    	//Add the main div in the screen
    	if(this.virtualHtml === null) 
	    	this.virtualHtml = new Element('div', {'id': 'SCM_TickGr'});
	    this.changeContent(this.virtualHtml);
    	
        //List to some global event
    	document.observe('EWS:scm_groupingRefreshed'		, this._listeners.get('buildGroupingSee')	    );
    	document.observe('EWS:scm_availableGroupingLoaded'	, this._listeners.get('buildGroupingEdit')	    );
    	document.observe('EWS:scm_poolOpened'               , this._listeners.get('poolOpened')             );
    	document.observe('EWS:scm_poolClosed'               , this._listeners.get('poolClosed')             );
    	document.observe('EWS:scm_noAvailableGrouping'      , this._listeners.get('noAvailableGrouping')    );
    	document.observe('EWS:scm_setDefaultGrouping'       , this._listeners.get('setDefaultGrouping')     );
		document.observe('EWS:scm_cleanGrouping'			, this._listeners.get('cleanGrouping')			);	
    	
    	document.fire('EWS:scm_menuOpen', 'scm_TicketGrouping');
    },
	
	/**
	 * Stop observing the events for the grouping menu.
	 * @since 1.0
	 */
    close: function(){
    	if(!Object.isEmpty(this.virtualHtml) && !Object.isEmpty(this.virtualHtml.up())) 
			this.virtualHtml.remove();
    	
    	//Do not list anymore the global events
    	document.stopObserving('EWS:scm_groupingRefreshed'		    , this._listeners.get('buildGroupingSee')	    );
    	document.stopObserving('EWS:scm_availableGroupingLoaded'    , this._listeners.get('buildGroupingEdit')	    );
    	document.stopObserving('EWS:scm_poolOpened'                 , this._listeners.get('poolOpened')             );
    	document.stopObserving('EWS:scm_poolClosed'                 , this._listeners.get('poolClosed')             );
    	document.stopObserving('EWS:scm_noAvailableGrouping'        , this._listeners.get('noAvailableGrouping')    );
    	document.stopObserving('EWS:scm_setDefaultGrouping'         , this._listeners.get('setDefaultGrouping')     );
		document.stopObserving('EWS:scm_cleanGrouping'         		, this._listeners.get('cleanGrouping')    		);
    },
    
    /**
     * @event
	 * @param {Event} event Contains Json object with the parameter to build the screen with display of groupings
	 * @description Build the screen with the display of the groups and the possibility to select them.
	 * @since 1.0
	 * <br/>Modified for 1.2
	 * <ul>
	 * <li>Bug fix: Manage the possibility to select automatically the first group if there is only one</li>
	 * </ul>
	 */
	 buildGroupingSee: function(event) {
		this.removeGroupingEdit();
		
	 	var json       = {TicketTreeNodes: undefined, NodeId: null, TicketTreeGrouping: null};
        var selNode    = null;
        var toUpdate   = false;
        
        //Set the last Json object
        if(!Object.isEmpty(event)) {
            var args = getArgs(event);  
            if (args.TicketTreeNodes !== undefined) {
                json.TicketTreeNodes           = args.TicketTreeNodes;
                this._lastJson.TicketTreeNodes = args.TicketTreeNodes;
            }
            if (!Object.isEmpty(args.TicketTreeGrouping)) {
                json.TicketTreeGrouping           = args.TicketTreeGrouping;
                this._lastJson.TicketTreeGrouping = args.TicketTreeGrouping;
            }
            if (!Object.isEmpty(args.NodeId)) {
                json.NodeId       = args.NodeId;
                this.selectedNode = args.NodeId;
            } 
            if (!Object.isEmpty(args.ToUpdate)) toUpdate = args.ToUpdate; 

			if (!Object.isEmpty(args.PoolType)) this._lastJson.PoolType = Object.clone(args).PoolType;
		}
		
        // Build the building blocks if there are not already
        if(this._selGrouping.div === null)
            this._selGrouping.div   = new Element('div', {'id': 'SCM_TickGr_SelectedGr', 'class': 'SCM_TickGr_Title'});
         
        if(this._groupingTree.div === null) 
            this._groupingTree.div  = new Element('div', {'id': 'SCM_TickGr_GroupingTree'});
            
        if(this._button.div === null)
            this._button.div        = new Element('div', {'id': this._button.divId + 'Main'});
        else if(!this._button.div.visible())  
             this._button.div.show();
             
         // If there is nothing in the main DIV => build the initial one
        if(Object.isEmpty(this.virtualHtml.innerHTML)) {
             this.virtualHtml.insert(this._selGrouping.div);
             this.virtualHtml.insert(this._groupingTree.div);
             this.virtualHtml.insert(this._button.div);
             this.virtualHtml.insert('<div class="FWK_EmptyDiv"/>');
        	 
         // If there is something in the main DIV => add the grouping tree and the sel grouping			 
        } else {
            this._button.div.insert({before: this._selGrouping.div });
            this._button.div.insert({before: this._groupingTree.div });
        }

        this.buildGroupingSelection(json.TicketTreeGrouping, this._selGrouping);
        this.buildGroupingTree(json.TicketTreeNodes, this._groupingTree.div);
		/* JON */
//		debugger;
//		this.buildGroupingTree2(json.TicketTreeNodes, this._groupingTree.div);
		/* JON */
        this.buildButton('Change', this._button.div);
        
		// SELECT DEFAULT FIRST NODE IF NONE SELECTED
		if (Object.isEmpty(json.NodeId)) {
			//since 1.2 If there is only one grouping, it is not a table...
			if (!Object.isEmpty(args) && !Object.isEmpty(args.TicketTreeNodes) && !Object.isEmpty(args.TicketTreeNodes.TicketTreeNode)) {
				json.NodeId = objectToArray(args.TicketTreeNodes.TicketTreeNode)[0].UniqueKey;
				this.setDefaultGrouping({memo: {nodeId: json.NodeId,refresh: true}});
			}
		} else {
			if (toUpdate === true && !Object.isEmpty(json.NodeId)) 
				this.setDefaultGrouping({memo: {nodeId: json.NodeId, refresh: false}});
			else 
				this.setSelectedNode(json.NodeId);
		}
    },
    
    /**
     * @event
     * @param {Event} Here is the list of event parameters: <ul><li>appliName(String) Name of the application to save</li><li>saveCurrentTree(Boolean) Is the current tree to save</li></ul>
	 * @description Save the current tree in the global attribute _appliTrees
	 * @since 1.0
	 * @see scm_TicketGrouping#_appliTrees
	 */
    poolClosed: function(params) {
		this.removeGroupingSee();
        this.removeGroupingEdit();

		appliName = getArgs(params).appliName;
		
		//For the search ticket, the result is not to save
		if(getArgs(params).saveCurrentTree === true) {
	        //If the menu is created, save it
	        if ((!Object.isEmpty(this._lastJson.TicketTreeNodes) ||
			!Object.isEmpty(this._lastJson.TicketTreeGrouping)) &&
			this._lastJson.PoolType === appliName) {
				this._appliTrees.set(appliName, {
					lastJson	: Object.clone(this._lastJson)	,
					isVisible	: this._button.div.visible()	,
					selectedNode: this.selectedNode
				});
			}
		}
        this.selectedNode = '';
        this._poolClosed  = true;
    },
    
    /**
     * @event
     * @param {Event} options Here is the list of event parameters: <ul><li>poolType(String) Name of the application to load and</li><li>refreshGrouping(Boolean) if the refresh is needed?</li></ul>
	 * @description Load the current tree from the global attribute _appliTrees.
	 *              We have to wait that the previous application is closed.
	 * @since 1.0
	 * @see scm_TicketGrouping#_appliTrees
	 */
    poolOpened: function(options) {
        if(getArgs(options).refreshGrouping === false) return;
		var appliName = getArgs(options).poolType;
		
		new PeriodicalExecuter( function(pe) {
            //Do something only if the other application is closed
			if (this._poolClosed === false) return;
			this._poolClosed = false;
			pe.stop();
			var content = this._appliTrees.get(appliName);

			if(Object.isEmpty(content)) {
			    this.noAvailableGrouping();
			    return;
			}
			content.lastJson.NodeId = content.selectedNode;
            this.buildGroupingSee({memo: content.lastJson});
            //Hide the button if it was last time in this application
            if(!content.isVisible && this._button.div.visible()) 
                this._button.div.hide();
		}.bind(this), 0.5);  
    },
    
    /**
     * @event
     * @param {Event} appliName The event parameters contains only the name of the application to clean
	 * @description Remove the existant menu for the calling application.
	 * @since 1.0
	 */
	cleanGrouping: function(appliName) {
		this._appliTrees.unset(getArgs(appliName));
	},
	
    /**
     * @event
	 * @description Hide all the content of the menu
	 * @since 1.0
	 */
    noAvailableGrouping: function() {
        this._lastJson = {TicketTreeNodes: null, TicketTreeGrouping: null, PoolType: null};
        
        if(this._button.div       && this._button.div.visible() ) this._button.div.hide();
        if(this._groupingTree.div && this._groupingTree.div.up()) this._groupingTree.div.remove();
        if(this._selGrouping.div  && this._selGrouping.div.up() ) this._selGrouping.div.remove();
    },
    
    /**
     * @event
     * @param {Event} event Contains the parameters: <ul><li>nodeId(String) Identifier of the selected node </li>refresh(Boolean) Is the pool to refresh?<li></li></ul>
	 * @description Set the default value set by the recuperation of tickets.
	 * @since 1.0
	 */
    setDefaultGrouping: function(event) {
		var args        = getArgs(event);
        var nodeId      = args.nodeId;
        var refresh     = args.refresh;
        var subnodeId   = '';
        var nodeTitle   = $A();
        var node;
        var error       = false;
        
        if(!Object.isEmpty(nodeId)) {
            nodeId.split(/\$/).each(function(idSection) {
		        if(error === true) return;
		        subnodeId 	+= idSection;
		        node = this.getNodeFromId(subnodeId);
		        if(Object.isEmpty(node))
		            error = true;
		        else
		            nodeTitle.push(node.readAttribute('title'));
		        subnodeId 	+= '$';
	        }.bind(this));
    	} else error = true;
    	
    	if(error === false) {
	        document.fire('EWS:scm_groupingNodeSelected', {
		        nodeId		: nodeId                , 
		        nodeText	: nodeTitle.join(' > ') ,
		        refresh     : refresh               });
        		 
            this.setSelectedNode(nodeId);
        }
    },
    
    /**
	 * @description Remove the content of the menu if it is in the display of grouping
	 * @since 1.0
	 */
    removeGroupingSee: function() {
    	if(this._groupingTree.div && this._groupingTree.div.up() )
    	    this._groupingTree.div.remove();
    	if(this._selGrouping.div && this._selGrouping.div.up() ) 
    	    this._selGrouping.div.remove();
    },
    
    /**
	 * @param {String} kind Is it the 'Change' button or the 'Done' button that is on the screen.
	 * @description Build or update the button to set in the screen.
	 * @since 1.0
	 */
    buildButton: function(kind, parentNode) {
		 //The button is correct
		 if(this._button.kind === kind) return;
		 
		 this._button.kind = kind;
		 
		 //Create the button if needed
		 if(this._button.button === null) {
			 this._button.button = new megaButtonDisplayer({
				elements : $A( [ {
					label 			: global.getLabel(kind)					,
					handlerContext 	: null									,
					handler 		: this.navigate.bind(this, null, null)	,
					className 		: 'SCM_TickGr_button'					,
					type 			: 'button'								,
					idButton 		: this._button.divId					,
					standardButton 	: true									}])});
			 
			 parentNode.insert(this._button.button.getButtons());
		 //Update the button if it exists already
		 } else
			 this._button.button.updateLabel(this._button.divId, global.getLabel(kind)); 
    },
    
    /**
	 * @param {String} groupId Id of the group to select.
	 * @description Update the selected node.
	 * @since 1.0
	 */
    setSelectedNode: function(groupId) {
        var selNode;

        //Remove the old selected node
        if(!Object.isEmpty(this.selectedNode)) {
			this.virtualHtml.select('span.SCM_TickGr_TreeNodeSelected').each(function(selN) {
				selN.removeClassName('SCM_TickGr_TreeNodeSelected');
			}.bind(this));
	    }
	    
        //Get the new groupId to set
        if(!Object.isEmpty(groupId)) this.selectedNode = groupId;
            
        //If there is no given groupId => nothing to do
        if(Object.isEmpty(this.selectedNode)) return;

        //Expand the selected node
        this.expandNode(this.selectedNode);
        
        //Set the new selected node
         selNode = this.getNodeFromId(this.selectedNode);
         if(!Object.isEmpty(selNode)) selNode.addClassName('SCM_TickGr_TreeNodeSelected');   
    },
    
    /**
	 * @param {JSON Object} jsonGrTree Parameters to build the grouping tree.
	 * @description Build the grouping tree from its data or update it
	 * @since 1.0
	 * <br/>Modification for 2.1
	 * <ul>
	 * <li>Initialize the mapping of ids between the tree and the backend</li>
	 * </ul>
	 * <br/>Modification for 2.0
	 * <ul>
	 * <li>Do not reload if there is only one node... It is already done</li>
	 * </ul>
	 */
	 buildGroupingTree: function(jsonGrTree, parentNode) {	 
		 if(jsonGrTree === undefined) return;
		 //Remove the tree
		 if(!Object.isEmpty(this._groupingTree.tree) && !Object.isEmpty(this._groupingTree.tree.ident))
			 this._groupingTree.tree.stopObserving();
		 parentNode.update();
		 
		 if(jsonGrTree === null) return;
		 
		 //Build the XML for the tree
		 var templateLeafNode 	= new Template('<node childs="no_child"><name>#{name}</name><id>#{id}</id></node>');
		 var templateInnerNode	= new Template('<node childs="X"><name>#{name}</name><id>#{id}</id>#{subNodes}</node>');
		 var xmlTreeStr 		= '<?xml version="1.0" encoding="utf-8" ?><nodes>';
		 var nodes 				= $A();
		 
		 //since 2.1 Keep a matching between the id in the tree and the id in the backend.
		 this.treeIdsMatching	= $H();
		 
		 if(!Object.isEmpty(jsonGrTree.TicketTreeNode)) nodes = objectToArray(jsonGrTree.TicketTreeNode);

		 nodes.each(function(node) {
			 xmlTreeStr += this._buildGroupingAddNode(node, templateLeafNode, templateInnerNode);
		 }.bind(this));
		 xmlTreeStr += '</nodes>';
		 
		 //Build the tree
		 this._groupingTree.tree = new TreeHandler(parentNode.identify(), stringToXML(xmlTreeStr));
		 
		 this.groupingTreeAddLinks(parentNode);
	 },
	 
/* ******************************************************************************************** */

	 buildGroupingTree2: function(jsonGrTree, parentNode) {	 
	 
		 if(jsonGrTree === undefined) return;
		 //Remove the tree
		 if(!Object.isEmpty(this._groupingTree.tree) && !Object.isEmpty(this._groupingTree.tree.ident))
			 this._groupingTree.tree.stopObserving();
		 parentNode.update();
		 
		 if(jsonGrTree === null) return;
		 
		 var treeRepresentation = $A();
		 objectToArray(jsonGrTree.TicketTreeNode).each(function(node){
		 	
			var jsonNode = this._buildJsonForNode(node, null, true);
			
			if(node.ChildTicketTreeNodes != null){
				this._buildChildNode(objectToArray(node.ChildTicketTreeNodes.TicketTreeNode), jsonNode, true);
			}
			
			treeRepresentation.push(jsonNode);
		 }, this);

		 this._groupingTree.tree = new linedTree(parentNode.identify(), treeRepresentation, {
                    useCheckBox: false
                });
		 
//		 this.groupingTreeAddLinks(parentNode);
	 },	 
	 
	 _buildJsonForNode:function(node, parentId, open){
	 	return {
            id: node.UniqueKey.gsub('|', ''),
            title: node.Name,
            value: node.Name,
            parent: parentId,
            isOpen: open,
            isChecked: 0,
            hasChildren: false,
            children: $A()
        }
	 },
	 
	 _buildChildNode:function(arrayOfChild, parentJson, isOpen){
	 	arrayOfChild.each(function(node){
			var JSONNode = {
	            id: node.UniqueKey.gsub('|','').gsub('$', ''),
	            title: node.Name,
	            value: node.Name,
	            parent: parentJson.id,
	            isOpen: isOpen,
	            isChecked: 0,
	            hasChildren: false,
	            children: $A()
	        };
			
			while(node.ChildTicketTreeNodes != null){
				this._buildChildNode(objectToArray(node.ChildTicketTreeNodes.TicketTreeNode), JSONNode, isOpen);
			}
			
			parentJson.children.push(JSONNode);
			parentJson.hasChildren = true;
			
		}, this);
	 },
	 
/* ******************************************************************************************** */	 
	 
	 
	 /**
	  * @param {String} nodeId Id of the node to extend
	  * @description Expand the given node in the tree and all its parents
	  * @since 1.0
	  * <br/>Modified for 2.1
	  * <ul>
	  * <li>Use the id mapping to get the node form an id</li>
	  * </ul>
	  */
	 expandNode: function(nodeId) {
	    var nodes  = nodeId.split(/\$/);
	    var nodeId = '';
	    var node;

	    nodes.each(function(nodeKey, key) {
	        if(key === nodes.size() - 1) return;
			//since 2.1 No need to decode anymore
	        nodeId += nodeKey;
	        node = this.getNodeFromId(nodeId);
	        if(node && node.previous().hasClassName('application_verticalR_arrow'))
				//since 2.1 Get the id from the mapping list
	            this._groupingTree.tree.expandNodeById(this._getNodeIdFromId(nodeId));
	        nodeId += '$';
	    }.bind(this));
	 },
	 
	 /**
	  * @param {JSON Object} node Node parameters
	  * @param {Template} templateLeafNode Template to use to build leaf nodes
	  * @param {Template} templateInnerNode Template to use to build inner nodes
	  * @description Build a string that match one node in the groups tree under construction
	  * @returns {String} The XML of the tree under creation
	  * @since 1.0
	  * <br/>Modified for 2.1
	  * <ul>
	  * <li>Create a table for the mapping between the ids in the tree and the backend ids</li>
	  * </ul>
	  */
	 _buildGroupingAddNode: function(node, templateLeafNode, templateInnerNode) {
		 var childs 		= $A();
		 var childsString	= '';
		 if(node.ChildTicketTreeNodes)
			 childs= objectToArray(node.ChildTicketTreeNodes.TicketTreeNode);
		 
		 //since 2.1 Create a new id without special chars and add the backend id in the storage table
		 var newId = 'SCM_groupingNode_' + this.treeIdsMatching.size();
		 this.treeIdsMatching.set(newId, node.UniqueKey);
		 
		 // If there is no child nodes => return a child node
		 if(childs.size() === 0) {
		 	//since 2.1 Replace the node id by the generated one
			 return templateLeafNode.evaluate({name: (node.Name || '/').escapeHTML() + '(' + node.TicketCount + ')', id: newId});
			 
		 // If there are child nodes => iterate on them
		 } else {
			 childs.each(function(child) {
				 childsString += this._buildGroupingAddNode(child, templateLeafNode, templateInnerNode);
			 }.bind(this));
			 
			 //since 2.1 Replace the node id by the generated one
			 return templateInnerNode.evaluate({name: (node.Name || '/').escapeHTML() + '(' + node.TicketCount + ')', id: newId, subNodes: childsString});
		 }
	 },
	 
	 /**
	  * @param {Element} The node that contains the grouping tree
	  * @description Add the links to make each clickable node
	  * @since 1.0
	  * <br/>Modified in 2.2
	  * <ul>
	  * <li>Check first if the matching of tree ids exists</li>
	  * </ul>
	  * <br/>Modified in 2.1 
	  * <ul>
	  * <li>The ids in the tree are modified</li>
	  * </ul>
	  */
	 groupingTreeAddLinks: function(parentNode) {
	 	//since 2.2 If there is no entry in the tree, do not do the loop
		if (Object.isEmpty(this.treeIdsMatching)) return;
		
		 //since 2.1 Loop in the list of ids to avoid extra parsing of strings
		 this.treeIdsMatching.each(function(nodeId) {
			 var node 		= this.virtualHtml.down('span#treeHandler_text_' + nodeId.key + '_' + this._groupingTree.div.identify());
			 var numEntries = node.innerHTML.substring(node.innerHTML.lastIndexOf('(') + 1, node.innerHTML.lastIndexOf(')'));
			 var name		= node.innerHTML.substring(0, node.innerHTML.lastIndexOf('('));
			
			 
			 node.writeAttribute('nodeid', nodeId.value);
			 node.writeAttribute('title', name.unescapeHTML());
			 node.addClassName('SCM_TickGr_TreeNode');
			 node.innerHTML = name.truncate(25) + ' (' + numEntries + ')';
			 
			 node.observe('click', function(event) {
				 var elem = Event.element(event);
                 this.setDefaultGrouping({memo: {nodeId: elem.readAttribute('nodeid'), refresh: true}});
			 }.bind(this));
		 }.bind(this));
	 },
	 
	 /**
	  * @param {String} id Identifier of the node to search
	  * @description Get the node in the grouping tree from a given group id
	  * @returns {Element} The node that match the given id.
	  * @since 1.0
	  * <br/>Modified for 2.1 
	  * <ul>
	  * <li>Use the table with id matching to found the node from a backend key</li>
	  * </ul>
	  */
	 getNodeFromId: function(id) {
	 	//since 2.1 Look in the table with tree matching to get the node
	 	 var idInDom = this._getNodeIdFromId(id);
		 if(Object.isEmpty(idInDom)) return null;
		 return this.virtualHtml.down('span#treeHandler_text_' + idInDom + '_' + this._groupingTree.div.identify());
	 },
	 
	 /**
	  * Get the id of the node in the tree from the backend node id
	  * @param {String} id Identifier of the node to search
	  * @returns {String} The matching node id.
	  * @since 2.1
	  * <br/> Modified in 2.2
	  * <ul>
	  * <li>Add a check if the tree ids matching exists</li>
	  * </ul>
	  */
	 _getNodeIdFromId: function(id) {
		var idInDom = null;
		
		//since 2.2 If the tree id matching is empty, nothing to search
		if(!Object.isEmpty(this.treeIdsMatching)) {
			this.treeIdsMatching.each(function(idMatch) {
				if(idMatch.value === id) idInDom = idMatch.key;
			});
		}
		return idInDom;
	 },
	 
	 /**
	  * @param {JSON Object} jsonGrSel Selected grouping
	  * @param {Element, Array} selGrouping Object with grouping display parameters	  
	  * @description Build the div that contains the selected grouping or update it
	  * @since 1.0
	  */
	 buildGroupingSelection: function(jsonGrSel, selGrouping) {
	    if(Object.isEmpty(jsonGrSel)) return;
	 
	    var categories = jsonGrSel.string;
	    if(!Object.isEmpty(categories)) categories = objectToArray(categories); 
	    if(Object.isEmpty(categories) ) return;
	        
		this.updateGroupingSelection(categories, selGrouping);
	 },
	 
	 /**
	  * @param {Hash} groups Selected categories
	  * @param {JSON Object} selGrouping Grouping display parameters
	  * @description Build the div that contains the selected grouping or update it
	  * @since 1.0
	  */
	 updateGroupingSelection: function (groups, selGrouping) {
	    var groupsTxt = '';
	    
	    selGrouping.list = groups;
	    selGrouping.list.each(function(group) {
	        groupsTxt += ' > ' + group;
	    }.bind(this));
	    
		selGrouping.div.innerHTML = '<span>' + groupsTxt + '</span>';
	 },
	 
	 /**
	  * @event
	  * @param {Event} event Contains useful parameter to build the screen with edition of groupings.
	  * @description Build the screen with the edition of the groups
	  * @since 1.0
	  */
	 buildGroupingEdit: function(event) {
	 	 this.removeGroupingSee();
	     var json = getArgs(event);
		 
		 // Build the building blocks if there are not already
		 if(this._groupsList.div === null)
		    this._groupsList.div = new Element('div', {'id': 'SCM_TickGr_ListGr'});
		    
		 // If there is nothing in the main DIV => build the initial one
		 if(Object.isEmpty(this.virtualHtml.innerHTML)) {
			 this.virtualHtml.insert(this._groupsList.div);
			 this.virtualHtml.insert(this._button.div);
			 this.virtualHtml.insert('<div class="FWK_EmptyDiv"/>');
			 
         // If there is something in the main DIV => add the grouping tree and the sel grouping			 
		 } else 
		    this._button.div.insert({before: this._groupsList.div });
		 
		 this.buildGroupsList(json, this._groupsList.div);
		 this.buildButton('Done', this._button.div); 
	 },
	 
	 /**
	  * @param {JSON Object} categsJson Parameter to build the screen with edition of groupings
	  * @param {Element} perentNode Node of the document that should contains the list of categories
	  * @description Build the list of grouping categories
	  * @since 1.0
	  */
	 buildGroupsList: function(categsJson, parentNode) {
	    var divTemplate = new Template( '<li id="SCM_TickGr_ListGrItem_#{TicketTreeGroupId}" class="SCM_TickGr_ListItem">'
	                                +       '<input type="checkbox" name="#{TicketTreeGroupId}" #{checkedTxt}/>'
	                                +       '#{Name}'
	                                +   '</li>');
	                                	   
        var categs      = categsJson.EWS.HrwResponse.HrwResult.ArrayOfTicketTreeGroup;
        if(!Object.isEmpty(categs))
            categs = categs.TicketTreeGroup;
        if(!Object.isEmpty(categs))
            categs = objectToArray(categs);
        
        parentNode.update();
        
        var list = new Element('ul', {'id': this._groupsList.ddId, 'class': 'SCM_list_no_bullet'});
        parentNode.insert(list);
        
        this._groupsList.selected = $A();
        categs.each(function(group) {
            if(group.Selected === 'true') {
                this._groupsList.selected.push(group.TicketTreeGroupId);
                group.checkedTxt = ' checked="checked" ';
            } else
                group.checkedTxt = '';
            
            list.insert(divTemplate.evaluate(group));
        }.bind(this));
        
        this.groupsListAddDragDrop(list);
	 },
	 
	 /**
	  * @description Remove the content of the menu if it is in the edition of grouping
	  * @since 1.0
	  */
	 removeGroupingEdit: function() {
		 //Remove the list of groups
		 if(this._groupsList.div !== null && this._groupsList.div.up()  !== null ) this._groupsList.div.remove();
	 },
	 
	 /**
	  * @param {Element} listNode Element with the list of nodes
	  * @description Add the drag and drop to modify the categories order
	  * @since 1.0
	  */
	 groupsListAddDragDrop: function(listNode) {
	    Sortable.create(this._groupsList.ddId, { 
	        constraint: 'vertical',
	        scroll    : 'SCM_TickGr_ListGrItems',
	        hoverclass: 'SCM_TickGr_ListItemHover'
        });
        listNode.up().insert('<p class="SCM_TicketGr_ddTxt">'+global.getLabel('DragDrop_bars_to_change_order')+'</p>');
	 },
	 
	 /**
	  * @description Build a table with the categories selected for the grouping and its order
	  * @returns {Array} The selected categories
	  * @since 1.0
	  */
	 groupsListGetSelected: function() {
	    var selection = $A();
	    var position  = 1;
	    
	    this.virtualHtml.select('.SCM_TickGr_ListItem input').each(function(chkbox){
	        if(chkbox.checked) {
	            selection.push(chkbox.readAttribute('name'));
	            position ++;
	        }
	    }.bind(this));
	    return selection;
	 },
	 
	 /**
	  * @description Check if there are changes between the current selection and the initial one
	  * @returns {Boolean} Is there any change in the selection list during the user selection?
	  * @since 1.0
	  */
	 groupsListCheckChanged: function(listSel) {
	    var changed = false;
	    if(listSel.size() != this._groupsList.selected.size()) return true;
	    
	    this._groupsList.selected.each(function(selItem, key) {
	        if(selItem != listSel[key]) changed = true;
	    });
	    
	    return changed;
	 },
	 
	 /**
	  * @param {String} newPosition If this field is not null, navigate to this position if needed
	  * @param {Boolean} withUpdate Indicate of the tree has to be updated or simply display again
	  * @description Move between the 2 possible screens depending of the position
	  * @since 1.0
	  */
	 navigate: function(newPosition, withUpdate) {
		 var listSel;
         var newGrouping = '';
		 //If there is a given position that is the same as the current one => nothing to do
		 if(!Object.isEmpty(newPosition) && newPosition === this._button.kind) return;
		 
		 //If _position = 'Change' => go to the edition
		 if(this._button.kind === 'Change') {
			 //Call the service to get the list of possible categories
			 document.fire('EWS:scm_getAvailableGrouping');
			 this.removeGroupingSee();
			 
		 //If _position = 'Done' => do the modifications
		 } else if(this._button.kind === 'Done') {
		     // If there are modifications in the list of criteria, call a refresh
		     listSel = this.groupsListGetSelected();
		     
             //Build the node to send to the application
		     if (listSel.size() !== 0 && this.groupsListCheckChanged(listSel) === true) {	       
			    document.fire('EWS:scm_changeGrouping', {newGrouping: listSel.join('|')});
			    this.selectedNode = '';
			 } else
			    this.buildGroupingSee();
			    
			 this.removeGroupingEdit();
		 }
	 }
});
/**
 * @class
 * @description Class managing the menu for the ticket actions.
 * @author jonathanj & nicolasl
 * @augments Menu
 * @version 2.1
 * <br/>Modified in 2.1
 * <ul>
 * <li>Make the search in the labels list more coherent</li>
 * </ul>
 */
var scm_TicketAction = Class.create(Menu, /** @lends scm_TicketAction.prototype */{
	/**
	 * The generated HTML for the menu 
	 * @type Element
	 * @since 1.0
	 */
	_innerHTML:null,
	/**
	 * The available ticket actions
	 * @type Hash this array is composed of JSon objects
	 * @since 1.0
	 */
	_tiact:null,
	/**
	 * The different separations available in the menu (basic:3)
	 * @type Array
	 * @since 1.0
	 */
	_tables:null,
	/**
	 * The eventlisteners registered for the menu
	 * @type JSon object
	 * @since 1.0
	 */
	_eventListeners:null,
	/**
	 * The available buttons for the actions
	 * @type Array
	 * @since 1.0
	 */
	_buttons:null,
	/**
	 * Constructor for the menu object. It initialize the different attributes and registers the events.
	 * @param {Object} $super The parent class
	 * @param {Object} id The menu id
	 * @param {Object} options The options of the menu
	 * @since 1.0
	 */
	initialize: function($super, id, options){
        $super(id, options);
		this._innerHTML = null;
		this._buttons = $H();

		this._tiact = $H();
		this._eventListeners = {
			updateMenu : this.enableButtons.bindAsEventListener(this),
			enableSaveButton: this.enableSaveButton.bindAsEventListener(this),
			disableSaveButton: this.disableSaveButton.bindAsEventListener(this)
		};
	
	},
	
	/**
	 * Function displaying the menu. This method initializes the actions and the transitions between the ticket status and the available actions.
	 * @param {Object} $super The parent class
	 * @param {Object} element The element in wich the menu will be displayed.
	 * @see scm_TicketAction#_initTicketActionsAndTransitions
	 * @see scm_TicketAction#buildMenu
	 * @since 1.0
	 */
    show: function($super, element){
		$super(element);
		
		this.changeTitle(global.getLabel('scm_TicketAction'));
		
		if (this._innerHTML === null) {
			this._initTicketActionsAndTransitions();
			// create the array that will contain the 3 tables of buttons
			this._tables = $A();
			// create the main div that will contain the whole menu
			this._innerHTML = new Element('div');
			// call the method building the tables
			this.buildMenu();
			// insert the tables into the main container
			for (index = 0; index < 3; index++) {
				this._innerHTML.insert(this._tables[index].table);
			}
		}
		// set the content to the menu		
		this.changeContent(this._innerHTML);
		
		document.observe('EWS:scm_ticketStatusUpdate', this._eventListeners.updateMenu);
		document.observe('EWS:scm_enableSaveButton', this._eventListeners.enableSaveButton);
		document.observe('EWS:scm_disableSaveButton', this._eventListeners.disableSaveButton);		
    },
	/**
	 * Function closing the menu. It unregister the events.
	 * @since 1.0
	 */
    close: function(){
		document.stopObserving('EWS:scm_ticketStatusUpdate', this._eventListeners.updateMenu);
		document.stopObserving('EWS:scm_enableSaveButton', this._eventListeners.enableSaveButton);
		document.stopObserving('EWS:scm_disableSaveButton', this._eventListeners.disableSaveButton);
    },
	
	/**
	 * Function in charge of creating the hash containing the JSon objects representing the actions.<br>
	 * The JSon object representing an action is composed of:<ul>
	 * 	<li>label: the label to be displayed in the button</li>
	 * 	<li>enablingStatuses: the ticket statuses for which the button should be enabled</li></ul>
	 * @since 1.0
	 */
	_initTicketActionsAndTransitions:function(){
		this._tiact.set(0, {
			label: global.getLabel('Take_in_processing'),
			enablingStatuses: $A(["4", "6", "11", "3", "10", "8"])
		});
		this._tiact.set(1, {
			label: global.getLabel('Set_to_pending'),
			enablingStatuses: $A(["2", "4"])
		});
		this._tiact.set(2, {
			label: global.getLabel('Set_to_waiting'),
			enablingStatuses: $A(["2", "6"])
		});
		this._tiact.set(3, {
			label: global.getLabel('General_pool'),
			enablingStatuses: $A(["2"])
		});
		this._tiact.set(4, {
			label: global.getLabel('Schedule'),
			enablingStatuses: $A(["2"])
		});
		this._tiact.set(5, {
			label: global.getLabel('Send_to'),
			enablingStatuses: $A(["2"])
		});
		this._tiact.set(6, {
			label: global.getLabel('duplicate'),
			enablingStatuses: $A(["2"])
		});
		this._tiact.set(7, {
			label: global.getLabel('Add_document'),
			enablingStatuses: $A(["2"])
		});
		this._tiact.set(8, {
			label: global.getLabel('Save_and_send'),
			enablingStatuses: $A(["2"])
		});
		this._tiact.set(9, {
			label: global.getLabel('Close'),
			enablingStatuses: $A(["2", "0"])
		});		
	},
	/** 
	 * Function in charge of building the basic menu items, being the separations in the menu.
	 * There are 3 separations that groups the menu items.<br>
	 * This function also calls the buildTableOfOptions function for each separation.
	 * @see scm_TicketAction#buildTableOfOptions
	 * @since 1.0
	 */
	buildMenu:function(){
		for(index=0; index < 3; index++){
			var table = new Element('div',{'id':'table'+index});
			switch(index){
				case 0:
					table.addClassName('SCM_ticket_actions_gray_table');
					this._tables.push(this.buildTableOfOptions(index, table));
					break;
				case 1:
					table.addClassName('SCM_ticket_actions_red_table');
					this._tables.push(this.buildTableOfOptions(index, table));
					break;
				case 2:
					table.addClassName('SCM_ticket_actions_gray_table');
					this._tables.push(this.buildTableOfOptions(index, table));
					break;
			}			
		}
	},
	/**
	 * Function in charge of creating each line within a separation.<br>
	 * This function calls the buildOptionLine for each line in order to create the button that will be displayed in the line.
	 * @param {Object} index The separation of the menu
	 * @param {Dom table element} table The DOM table in which the element should be inserted.
	 * @see buildOptionLine
	 * @return {JSon} A JSon object containing the table and the option for the separation.
	 * @since 1.0
	 */
	buildTableOfOptions: function(index, table){
		var options = $A();
		var optIndex = 0;
		switch (index){
			case 0:
				for (i=0; i < 3; i++){
					options.push(this.buildOptionLine(false, i));
					optIndex = i;
					table.insert(options[optIndex].optionLine);
				}
				break;
			case 1:
				for (i=3; i < 7; i++){
					options.push(this.buildOptionLine(false, i));
					optIndex = i - 3;
					table.insert(options[optIndex].optionLine);
				}
				break;
			case 2:
				for (i=7; i < 10; i++){
					options.push(this.buildOptionLine(false, i));
					optIndex = i - 7;
					table.insert(options[optIndex].optionLine);
				}
				break;
			default:
				break;
		}
		table.insert('<div class="FWK_EmptyDiv"> </div>');
		return {table:table, options:options};
	},
	/**
	 * Function in charge of building ONE line of the table containing the buttons.<br>
	 * This function identifies the accurate class to be applied before the button in order to display the correct icon, 
	 * creates the button, and the div that will be inserted in the line of the table.
	 * @param {boolean} enable Flag to know if the button should be enabled or not
	 * @param {int} index The current line index
	 * @return {JSon} A JSon object containing the optionLine the optionIcon and the optionButton
	 * @since 1.0
	 * <br/>Modified in 2.1 
	 * <ul>
	 * <li>Do not read the button labels from global, they are already translated</li>
	 * </ul>
	 */
	buildOptionLine:function(enable, index){
		var optionLine   = new Element('div', {'id':'tiact_'+index, 'class': 'SCM_ticket_actions_line'});
		var optionIcon   = new Element('div', {'id':'tiact_icon_'+index});
		var suffix = '';
		(enable == true)?suffix='Enabled':suffix='Disabled';
		switch(index){
			case 0:	optionIcon.addClassName('SCM_ticketingProcessing'+suffix+' SCM_ticketingIconsSize SCM_ticketingIconPadding');
					break;
			case 1: optionIcon.addClassName('SCM_ticketingPending'+suffix+' SCM_ticketingIconsSize SCM_ticketingIconPadding');
					break;
			case 2: optionIcon.addClassName('SCM_ticketingWaiting'+suffix+' SCM_ticketingIconsSize SCM_ticketingIconPadding');
					break;
			case 3: optionIcon.addClassName('SCM_ticketingGeneralPool'+suffix+' SCM_ticketingIconsSize SCM_ticketingIconPadding');
					break;
			case 4: optionIcon.addClassName('SCM_ticketingSchedule'+suffix+' SCM_ticketingIconsSize SCM_ticketingIconPadding');
					break;
			case 5: optionIcon.addClassName('SCM_ticketingSendTo'+suffix+' SCM_ticketingIconsSize SCM_ticketingIconPadding');
					break;
			case 6: optionIcon.addClassName('SCM_ticketingDuplicate'+suffix+' SCM_ticketingIconsSize SCM_ticketingIconPadding');
					break;
			case 7: optionIcon.addClassName('SCM_ticketingAddDoc'+suffix+' SCM_ticketingIconsSize SCM_ticketingIconPadding');
					break;
			case 8: optionIcon.addClassName('SCM_ticketingSaveSend'+suffix+' SCM_ticketingIconsSize SCM_ticketingIconPadding');
					break;
			case 9: optionIcon.addClassName('SCM_ticketingClose'+suffix+' SCM_ticketingIconsSize SCM_ticketingIconPadding');
					break;
			default: break;
		}
		
		var optionButton = new Element('div', {'id':'tiact_button'+index});
		
		optionLine.insert(optionIcon).insert(optionButton);
		
		var json = {
			elements: []
		};
		
		var aux = {
			handlerContext: null,
			type: 'button',
			idButton: 'tiact_'+ index,
			standardButton: true,
			//className:'SCM_ticket_actions_button',
			handler: this.ticketActionPressed.bind(this, index),
			//since 2.1 The label value is already translated
			label: this._tiact.get(index).label
		};		
		
		json.elements.push(aux);	
		var button = new megaButtonDisplayer(json);

		button.updateWidth('tiact_'+ index, '150px');
		
		enable==true?button.enable('tiact_'+ index):button.disable('tiact_'+ index);
		
		optionButton.update(button.getButtons());
		
		this._buttons.set(index, button);
		
		return {optionLine:optionLine, optionIcon:optionIcon, optionButton:button};
	},
	/**
	 * Function in charge of enabling the buttons if they should be, based on the status given in parameter.<br>
	 * This function also change the button text if it should be changed ("take in processing" to "take over", "Close" to "Reopen") and the icon displayed (color if the button is enabled, grayed if the button is disabled).
	 * @param {Event} args The event parameters recieved. This args should contain status of the ticket, the agent associated to the ticket and the companyId for which the ticket is assigned.
	 * @see scm_TicketAction#_changeButtonLabel
	 * @see scm_TicketAction#_changeButtonIcon
	 * @since 1.0
	 */
	enableButtons:function(args){
		var ticketStatus = getArgs(args).status;

		//Update the label Take in processing, vs. Take over
		if(getArgs(args).agent === hrwEngine.scAgentId) 
			this._changeButtonLabel(global.getLabel('Take_in_processing'), this._tiact.get(0).label, 0);
		else
			this._changeButtonLabel(global.getLabel('Take_Over'), this._tiact.get(0).label, 0);

		if (ticketStatus == 0)
			this._changeButtonLabel(global.getLabel('reopen_ticket'), this._tiact.get(9).label, 9);
		else
			this._changeButtonLabel(global.getLabel('Close'), this._tiact.get(9).label, 9);

		//Update if the actions are enable
		this._tiact.each(function(ticketAction){
			if(ticketAction[1].enablingStatuses.indexOf(ticketStatus)!= -1){
				//Specially for take over button, check if it is editable or not
				if (ticketAction[0] === '0' &&
						ticketAction[1].label === global.getLabel('Take_Over') &&
						hrwEngine.companies.get(getArgs(args).companyId).EnableTakeOver === false) {
					this._buttons.get(ticketAction[0]).disable('tiact_'+ ticketAction[0]);
					this._changeButtonIcon('Disabled', 'Enabled', ticketAction[0]);
				} else {
					this._buttons.get(ticketAction[0]).enable('tiact_' + ticketAction[0]);
					this._changeButtonIcon('Enabled', 'Disabled', ticketAction[0]);
				}
			} else {
				this._buttons.get(ticketAction[0]).disable('tiact_'+ ticketAction[0]);
				this._changeButtonIcon('Disabled', 'Enabled', ticketAction[0]);
			}
		}.bind(this));
		
	},
	/**
	 * Function in charge of changing the button label.
	 * @param {String} newLabel The new label to be used for the button
	 * @param {String} oldLabel The old label of the button
	 * @param {int} index The index of the button
	 * @since 1.0
	 */
	_changeButtonLabel: function(newLabel, oldLabel, index) {
		if(newLabel === oldLabel) return;

		var buttonText = this._innerHTML.down('[id="tiact_'+ index +'"]').select('span.centerRoundedButton');
		if(buttonText.size() === 0) buttonText = this._innerHTML.down('[id="tiact_'+ index +'"]').select('span.centerRoundedButtonDisable');
		if(buttonText.size() === 0) return;
		
		//Update in the actions list
		var tiact = this._tiact.get(index);
		tiact.label = newLabel;
		this._tiact.set(index, tiact);
		
		//Update the HTML
		buttonText[0].innerHTML = newLabel;
	},
	/**
	 * Function in charge of changing the button icon between colored or grayed icon.
	 * @param {String} newStatus The new status for the icon
	 * @param {String} oldStatus The old status for the icon
	 * @param {int} index The index in the table
	 * @since 1.0
	 */
	_changeButtonIcon:function(newStatus, oldStatus, index){
		var lookupId = '[id="tiact_icon_'+ index +'"]';
		var optionIcon = this._innerHTML.down(lookupId);
		switch (index) {
			case "0":
				optionIcon.removeClassName('SCM_ticketingProcessing' + oldStatus);
				optionIcon.addClassName('SCM_ticketingProcessing' + newStatus);
				break;
			case "1":
				optionIcon.removeClassName('SCM_ticketingPending' + oldStatus);
				optionIcon.addClassName('SCM_ticketingPending' + newStatus);
				break;
			case "2":
				optionIcon.removeClassName('SCM_ticketingWaiting' + oldStatus);
				optionIcon.addClassName('SCM_ticketingWaiting' + newStatus);
				break;
			case "3":
				optionIcon.removeClassName('SCM_ticketingGeneralPool' + oldStatus);
				optionIcon.addClassName('SCM_ticketingGeneralPool' + newStatus);
				break;
			case "4":
				optionIcon.removeClassName('SCM_ticketingSchedule' + oldStatus);
				optionIcon.addClassName('SCM_ticketingSchedule' + newStatus);
				break;
			case "5":
				optionIcon.removeClassName('SCM_ticketingSendTo' + oldStatus);
				optionIcon.addClassName('SCM_ticketingSendTo' + newStatus);
				break;
			case "6":
				optionIcon.removeClassName('SCM_ticketingDuplicate' + oldStatus);
				optionIcon.addClassName('SCM_ticketingDuplicate' + newStatus);
				break;
			case "7":
				optionIcon.removeClassName('SCM_ticketingAddDoc' + oldStatus);
				optionIcon.addClassName('SCM_ticketingAddDoc' + newStatus);
				break;
			case "8":
				optionIcon.removeClassName('SCM_ticketingSaveSend' + oldStatus);
				optionIcon.addClassName('SCM_ticketingSaveSend' + newStatus);
				break;
			case "9":
				optionIcon.removeClassName('SCM_ticketingClose' + oldStatus);
				optionIcon.addClassName('SCM_ticketingClose' + newStatus);
				break;
			default:
				break;
		}
	},
	/**
	 * Function in charge of enabling the save button (just the button the icon doesn't change)
	 */
	enableSaveButton:function(){
		this._buttons.get(8).enable('tiact_8');
	},
	/**
	 * Function in charge of disablinf the save button (just the button, the icon doesn't change)
	 */
	disableSaveButton:function(){
		this._buttons.get(8).disable('tiact_8');
	},
	/**
	 * Function in charge of raising the event corresponding to the clicked button.
	 * @param {int} idButton The id of the button clicked.
	 * @since 1.0
	 */
	ticketActionPressed:function(idButton){
		var eventToRaise = "";
		switch(idButton){
			case 0:
				eventToRaise = 'EWS:scm_tiact_take_processing';
				break;
			case 1:
				eventToRaise = 'EWS:scm_tiact_set_pending';
				break;
			case 2:
				eventToRaise = 'EWS:scm_tiact_set_waiting';
				break;
			case 3:
				eventToRaise = 'EWS:scm_tiact_get_gen_pool';
				break;
			case 4:
				eventToRaise = 'EWS:scm_tiact_shedule_ticket';
				break;
			case 5:
				eventToRaise = 'EWS:scm_tiact_send_ticket_to';
				break;
			case 6:
				eventToRaise = 'EWS:scm_tiact_duplicate_ticket';
				break;
			case 7:
				eventToRaise = 'EWS:scm_tiact_add_doc_to_ticket';
				break;
			case 8:
				eventToRaise = 'EWS:scm_tiact_save_and_send';
				break;
			case 9:
				eventToRaise = 'EWS:scm_tiact_close_ticket';
				break;				
		}
		document.fire(eventToRaise,{action: idButton});
	}
});
/**
 * @class
 * @description
 * @author jonathanj & nicolasl
 * @version 1.0
 */
var scm_DocumentCategories = Class.create(Menu, /** @lends scm_DocumentCategories.prototype */{
    initialize: function($super, id, options){
        $super(id, options);
    },

    show: function($super, element){
        $super(element);
    },

    close: function($super){

    }
});
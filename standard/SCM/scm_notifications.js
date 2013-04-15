/**
 * @class
 * @description Class in charge of managing the notifications in SCM.<br>
 * The notifications are appearing in the bottom right part of the screen for a determined time and disapears after.<br>
 * The notifications can be either notifications that exists in HRW, company message or notification about elapsed ticket.<br>
 * The notifications are always comming from the heartbeat send back from the backend.
 * @author jonathanj & nicolasl
 * @augments origin
 * @version 1.0 Basic version
 */
var scmNotification = Class.create(origin,/** @lends scmNotification.prototype */{
	/**
	 * The defined display time of the different notifications.<br>
	 * Hash containing 3 JSon objects as entries. The form of each JSon entry is<ul>
	 * <li>displayTime: the time displayed on the screen (in milliseconds),</li>
	 * <li>waitingTime: time to wait before showing the next notification, if any (in milliseconds).</li>
	 * </ul>
	 * @type Hash 
	 * @since 1.0
	 */
	displayTimes : $H({
		1:	{displayTime: 10000, waitingTime: 1000}, // NEW NOTIFICATION
		2:	{displayTime: 10000, waitingTime: 1000}, // ELAPSED
		3:  {displayTime: 20000, waitingTime: 1000}  // COMPANY MESSAGE
	}),
	/**
	 * The different icon classes for the notification types.<br>
	 * Hash containing JSon objects as entries. The form of each JSon entry is<ul>
	 * <li>name: the type of notification,</li>
	 * <li>icon: the CSS class containing the icon associated to the notification type.</li>
	 * </ul>
	 * @type Hash
	 * @since 1.0
	 */
	notificationsIcon: $H({
		0:		{name:'Assign', 						icon:'SCM_ActionNewUserIcon SCM_ActionsIconSize'},
		1:		{name:'AssignToGroup', 					icon:''},	 	 
		5:		{name:'StopTransferRequested', 			icon:''},	 	 
		6:		{name:'StopTransferAccepted', 			icon:''},//	 	AcceptTransfer
		7:		{name:'StopTransferDenied', 			icon:''},//	 	RejectTransfer
		8:		{name:'TransferAgent', 					icon:''},//	 	Transfer
		9:		{name:'TransferPool', 					icon:''},//	 	Transfer
		10:		{name:'TransferItem', 					icon:''},//	 	NewItemOnChildParent
		11:		{name:'CloseParent', 					icon:''},//	 	Transfer
		12:		{name:'ActionNotification', 			icon:'SCM_ActionServicesIcon SCM_ActionsIconSize'},//	 	Services
		13:		{name:'ItemAdded', 						icon:'SCM_ActionNewItemIcon SCM_ActionsIconSize'},//	 	NewItem
		14:		{name:'TicketIsOutOfSLA',				icon:''},//	 	OutOfSLA
		18:		{name:'TicketForApprovalApproved',	 	icon:''},	 	 
		19:		{name:'TicketForApprovalRejected', 		icon:''},	 	 
		20:		{name:'Schedule', 						icon:'SCM_DotBlueIcon SCM_DotIconsSize'},
		21:		{name:'Schedule', 						icon:'SCM_DotBlueTicon SCM_DotIconsSize'},
		30:		{name:'ScheduleTicketToAgentPending',	icon:'SCM_DotMauveIcon SCM_DotIconsSize'},
		31:		{name:'ScheduleTicketToAgentPending',	icon:'SCM_DotMauveTicon SCM_DotIconsSize'},
		40:		{name:'SendToGeneralpool', 				icon:'SCM_DotBlackIcon SCM_DotIconsSize'},
		41:		{name:'SendToGeneralpool', 				icon:'SCM_DotBlackTicon SCM_DotIconsSize'},
		150:	{name:'Escalate', 						icon:'SCM_DotBlackIcon SCM_DotIconsSize'},
		151:	{name:'Escalate', 						icon:'SCM_DotBlackTicon SCM_DotIconsSize'},
		160:	{name:'Close', 							icon:'SCM_DotBrownIcon SCM_DotIconsSize'},
		161:	{name:'Close',							icon:'SCM_DotBrownTicon SCM_DotIconsSize'},
		170:	{name:'SendToPendingGeneralPool', 		icon:'SCM_DotMauveBlackIcon SCM_DotIconsSize'},
		171:	{name:'SendToPendingGeneralPool', 		icon:'SCM_DotMauveBlackTicon SCM_DotIconsSize'}
	}),
	/**
	 * Array of notifications to be displayed.
	 * @type Array
	 * @since 1.0
	 */
	notifications		: null,
	/**
	 * Flag meaning if the notifications are already currently showing (in that case, the new notification should just be added in the array).
	 * @type boolean
	 * @since 1.0
	 */
	alreadyShowing		: null,
	/**
	 * Flag meaning if the normal notifications should be retrieved from the backend
	 * @type boolean 
	 * @since 1.0
	 */
	forNotifications	: null,
	/**
	 * Flag meaning if the company message should be retrieved from the backend
	 * @type boolean 
	 * @since 1.0
	 */
	forCompanyMessages	: null,
	/**
	 * Flag meaning if the elapsed ticket notifications should be retrieved from the backend
	 * @type boolean 
	 * @since 1.0
	 */
	forElapsedSchedule	: null,
	/**
	 * The current displayed notification
	 * @type JSon 
	 * @since 1.0
	 */
	currentNotification : null,
	
	/**
	 * Constructor for the nofications object.
	 * @param {Object} $super The parent class.
	 * @param {Object} args The parameters of the application.
	 * @since 1.0
	 */
	initialize:function($super, args){
		$super(args);
		document.observe('EWS:scm_show_next_notification', this._showNextNotification.bindAsEventListener(this));
		document.observe('EWS:notification_take_ticket_processing', this._takeTicketInProcessing.bindAsEventListener(this));
		document.observe('EWS:notification_view_assignedTicket', this._openTicketInViewMode.bindAsEventListener(this));
		this.notifications 			= $A();
		this.alreadyShowing 		= false;
		this.forNotifications 		= false;
		this.forCompanyMessages 	= false;
		this.forElapsedSchedule 	= false;
	},
	
	/**
	 * Function making the backend call depending of the recieved heartbeat
	 * @param {string} heartBeat The heartbeat recieved from the backend
	 * @see scmNotification#forNotifications
	 * @see scmNotification#forElapsedSchedule
	 * @since 1.0
	 */
	loadNotifications:function(heartBeat){
		var heartbeat = heartBeat.toArray();
		if(heartbeat[0] == 1)
			this.forElapsedSchedule = true;
		if(heartbeat[1] == 1)
			this.forNotifications   = true;
		if(heartbeat[8] == 1)
			this.forCompanyMessages = true;
/*		if(this.forCompanyMessages){
			this._backend_getNotifications('TicketPool.GetCompanyMessages', 'createCompanyMessageListHandler');
		}*/ 
		if(this.forNotifications){
			this._backend_getNotifications('TicketPool.GetNewHrwNotifications', 'createNotificationListHandler');
		}
		if(this.forElapsedSchedule){
			this._backend_getNotifications('TicketPool.GetElapsedScheduledTicketData', 'createElapsedScheduleListHandler');
		}
	},
	
	/**
	 * Function in charge of diplaying the popups for the notifications.
	 * @since 1.0
	 */
	_buildNotification:function(){
		this.currentNotification = this.notifications.shift();
		if (Object.isUndefined(this.currentNotification)) {
			this.alreadyShowing = false;
			this.currentNotification = null;
			return;
		}
		this.alreadyShowing = true;
		var times = this.displayTimes.get(this.currentNotification.type);
		
		document.body.down('[id="scm_notifications"]').update(this.currentNotification.dom);
		if (this.currentNotification.type != 3) {
			document.body.down('[id="scm_notifications"]').down('[id="notification_view_' + this.currentNotification.ticketId + '"]').observe('click', function(){
				switch (this.currentNotification.type) {
					case 1:
						document.fire('EWS:notification_view_assignedTicket', {ticketId:this.currentNotification.ticketId})
					case 2:
						document.fire('EWS:notification_take_ticket_processing', {ticketId: this.currentNotification.ticketId});		
				}
				
			}.bindAsEventListener(this));
			if(this.currentNotification.type == 1)
				document.body.down('[id="scm_notifications"]').writeAttribute('title', this.currentNotification.values.toolTipMessage);
		}
		setTimeout(function(){
			document.body.down('[id="scm_notifications"]').update();
			document.body.down('[id="scm_notifications"]').writeAttribute('title', '', false);
			setTimeout(function(){
				document.fire('EWS:scm_show_next_notification');
			}, times.waitingTime);
		}, times.displayTime);
		
	},

	/**
	 * Function in charge of calling the _buildNotification function to show the next notification.
	 * @see scmNotification#_buildNotification
	 * @since 1.0
	 */
	_showNextNotification:function(){
		this._buildNotification();
	},
	/**
	 * Function in charge of calling the backend to take the ticket in processing.
	 * @param {Event} args The parameters of the event. This parameter should contain ticketId.
	 * @since 1.0
	 */
	_takeTicketInProcessing:function(args){
		this._backend_takeTicketInProcessing(getArgs(args).ticketId);
	},
	/**
	 * Function in charge of calling the application to display the ticket in view mode.
	 * @param {Event} args The event parameters. This parameter should contain TicketId in order to pass it to the ticketing application.
	 * @since 1.0
	 */
	_openTicketInViewMode:function(args){
		global.open($H({
			app: {appId:'TIK_PL', tabId:'PL_TIK', view:'scm_ticketApp'},
			selectedPart: scm_ticketApp.PROPERTIES	,
			forCreation	: false						,
			forEdition	: false						,
			ticketId	: getArgs(args).TicketId
		}));
	},

	/**
	 * Function in charge of creating the HTML code for a real notification.
	 * @param {JSon} notification A JSon object containing the info about the notification. This JSon object has the following structure:<ul>
	 * <li>type: Notification type,</li>
	 * <li>ticketId: The ticket id,</li>
	 * <li>values: JSon object having the following structure:<ul>
	 * 		<li>dateTime: The date and time of the notification,</li>
	 *		<li>reason: Reason of the notification,</li>
	 *		<li>showPopup: Flag if the popup should be shown,</li>
	 *		<li>ticketType:	Type of ticket,</li>
	 *		<li>toolTipMessage: tooltip text of the notification,</li>
	 *		<li>displayText: text to be displayed in the popup</li></ul>
	 *	<li>dom: the DOM object representing the notification</li>
	 * </ul>
	 * @since 1.0
	 */
	_buildNotificationPopup:function(notification){
		var html = 	'<div class="unmWidgets_titleDiv">'+
						'<div class="unmWidgets_header_text">'+global.getLabel('notification')+'</div>'+
					'</div>'+
					'<div class="unmWidgets_contentDiv scm_notificationContainer">';
		var iconIdentifier = notification.values.reason;
		if(	iconIdentifier == "2" || iconIdentifier == "3" || iconIdentifier == "4" ||
			iconIdentifier == "15" || iconIdentifier == "16" || iconIdentifier == "17" ){
			iconIdentifier = iconIdentifier + '' + notification.values.ticketType;					
		}
		html +=			'<div class="'+this.notificationsIcon.get(parseInt(iconIdentifier)).icon+' scm_notificationIcon"></div>';	
		html +=			notification.values.displayText+
					'</div>';
		
		var mainContainer = document.createElement('div');
			//mainContainer.id = 'scm_notification_'+notification.ticketId;
			mainContainer.addClassName('scm_notificationWidth');
			mainContainer.update(html);
		return mainContainer;
	},
	
	/**
	 * Function in charge of creating the HTML code for a elapsed shedule notification.
	 * @param {JSon} elapsed A JSon object containing the info about the notification. This JSon object has the following structure:<ul>
	 * <li>type	: the notification type,</li>
	 * <li>ticketId:The ticket id for which the notification should be shown,</li>
	 * <li>displayText:	text to be displayed in the popup,</li>
	 * <li>dom: the DOM object representing the notification</li>
	 * </ul>
	 * @since 1.0
	 */
	_buildElapsedPopup:function(elapsed){
		var html = '<div class="unmWidgets_titleDiv">'+
						'<div class="unmWidgets_header_text">'+global.getLabel('notification')+'</div>'+
					'</div>'+
					'<div class="unmWidgets_contentDiv scm_notificationContainer" id="scm_notification_'+elapsed.ticketId+'">'+
						elapsed.displayText+
					'</div>';
		var mainContainer = document.createElement('div');
		//	mainContainer.id = 'scm_notification_'+elapsed.ticketId;
			mainContainer.addClassName('scm_notificationWidth');
			mainContainer.update(html);
		return mainContainer;
	},
	
	/**
	 * @description Function in charge of creating the HTML code for a company message notification
	 * @param {JSon} companyMessage A JSon object representing the notification
	 * @since 1.0 but not used yet as the company message are not yet implemented in HRW backend.
	 */
	_buildCompanyMessagePopup:function(companyMessage){
		
	},
	/**
	 * Function in charge of building the text to be displayed in the popup.
	 * @param {JSon} notification JSon object representing the notification. This JSon object should have the ticketId element (and if the notification is a normal notification, values.dateTime.
	 * @since 1.0
	 */
	_buildNotificationDisplayText:function(notification){
		if(notification.type == 1)
			return SCM_Ticket.convertDateTime(notification.values.dateTime) + '' + '<div id="notification_view_'+notification.ticketId+'" class="application_action_link">' + notification.ticketId+'</div>';
		if(notification.type == 2)
			return global.getLabel('TICKET_ID') + ' '+'<div id="notification_view_'+notification.ticketId+'" class="application_action_link">' + notification.ticketId+'</div>'+' '+ global.getLabel('scheduleElapsed') + '.';
	},
//********************************************************
//**					BACKEND CALLS					**
//********************************************************
	/**
	 * Function in charge of calling the given service of the backend.
	 * @param {String} serviceToCall The service to be called in the backend.
	 * @param {String} responder The method used as responder to the AJAX request.
	 * @since 1.0
	 */
	_backend_getNotifications:function(serviceToCall, responder){
		hrwEngine.callBackend(this, serviceToCall, $H({
			scAgentId: hrwEngine.scAgentId
		}), responder);
	},
	/**
	 * Function in charge of calling the backend in order to have the info about a ticket to be taken in processing.
	 * @param {String} ticketId The ticket id.
	 * @since 1.0
	 */
	_backend_takeTicketInProcessing:function(ticketId){
		hrwEngine.callBackend(this, 'Ticket.StartProcessingTicket' , $H({
			scAgentId: hrwEngine.scAgentId,
			ticketId : ticketId
		}), 'openTicketViewerHandler');
	},
		
//********************************************************
//**				BACKEND HANDLERS					**
//********************************************************	
	/**
	 * Function in charge of creating the JSon object representing a company message notification (type 3) and adding it into the list of notification to display.<br>
	 * The JSon object create for each notification has the following components:<ul>
	 *	<li>ticketId: the ticket Id to which the notification is linked,</li>
	 *	<li>values:  a JSON object representing the values of the notification, this JSon has the following componenets:<ul>
	 *					<li>dom: The dom element (div) that will be displayed as popup (builded by calling _buildNotificationPopup)</li></ul></li></ul>
	 * This function also calls the _backend_getNotifications method in order to load the new notifications
	 * @param {JSon} json The answer from HRW
	 * @see scmNotification#_backend_getNotifications
	 * @since 1.0
	 * <br/>Modified in version 1.1:
	 * <ul>
	 * <li>Remove the call to the manage heartBeat</li>
	 * </ul>
	 */
	createCompanyMessageListHandler:function(json){
		this.forCompanyMessages 	= false;
		// Get the values from the answer
		
		// build the DOM object representing the popup for each notifications
		
		// Call the backend to load the notifications depending of the flag value
		// or start the display of the popups
		if(this.forNotifications) this._backend_getNotifications('TicketPool.GetNewHrwNotifications', 'createNotificationListHandler');
		else{ if (this.alreadyShowing == false) this._buildNotification(); }
	},
	
	/**
	 * Function in charge of creating the JSon object representing a real notification (type 1) and adding it into the list of notification to display.
	 * The JSon object create for each notification has the following components:<ul>
	 * <li>type: Notification type,</li>
	 * <li>ticketId: The ticket id,</li>
	 * <li>values: JSon object having the following structure:<ul>
	 * 		<li>dateTime: The date and time of the notification,</li>
	 *		<li>reason: Reason of the notification,</li>
	 *		<li>showPopup: Flag if the popup should be shown,</li>
	 *		<li>ticketType:	Type of ticket,</li>
	 *		<li>toolTipMessage: tooltip text of the notification,</li>
	 *		<li>displayText: text to be displayed in the popup</li></ul>
	 *	<li>dom: the DOM object representing the notification</li>
	 * </ul>
	 * The dom object of the notification will be generated by calling _buildNotificationPopup while the text of the notification will be generated by the call to _buildNotificationDisplayText.<br>
	 * The function finally calls _backend_getNotifications to load the new notifications. If the notifications are already showing, the function _buildNotification will be called.
	 * @see scmNotification#_buildNotificationDisplayText
	 * @see scmNotification#_buildNotificationPopup
	 * @see scmNotification#_backend_getNotifications
	 * @see scmNotification#_buildNotification
	 * @param {JSon} json The answer from HRW
	 * @since 1.0
	 * <br/>Modified in version 1.1:
	 * <ul>
	 * <li>Remove the call to the manage heartBeat</li>
	 * </ul>
	 */
	createNotificationListHandler:function(json){
		document.fire('EWS:scm_new_notification');
		this.forNotifications 		= false;
		// Get the values from the answer
		var notifications = objectToArray(json.EWS.HrwResponse.HrwResult.ArrayOfHrwNotification.HrwNotification);
		notifications.each(function(notification){
			var notif= {	type: 1,
							ticketId: notification.TicketId,
							values: {
								dateTime: 		notification.NotificationDateTime,
								reason: 		notification.NotificationReason,
								showPopup:		notification.ShowPopup,
								ticketType:		notification.TicketType,
								toolTipMessage:	notification.ToolTipMessage,
								displayText:	''
							},
							dom: null
						}
			if (notif.values.showPopup == 'true') {
				// build the DOM object representing the popup for each notifications
				notif.values.displayText = this._buildNotificationDisplayText(notif);
				notif.dom = this._buildNotificationPopup(notif);
				this.notifications.push(notif);
			}
		}.bind(this));
		// Call the backend to load the elapsed tickets depending of the flag value
		// or start the display of the popups
		if (this.forElapsedSchedule) this._backend_getNotifications('TicketPool.GetElapsedScheduledTicketData', 'createElapsedScheduleListHandler');
		else { if (this.alreadyShowing == false) this._buildNotification(); }
	},
	
	/**
	 * Function in charge of creating the JSon object representing an elapsed shedule notification (type 2) and adding it into the list of notification to display.<br>
	 * The JSon object create for each notification has the following components:<ul>
	 * <li>type	: the notification type,</li>
	 * <li>ticketId:The ticket id for which the notification should be shown,</li>
	 * <li>displayText:	text to be displayed in the popup,</li>
	 * <li>dom: the DOM object representing the notification</li>
	 * </ul>
	 * The dom object of the notification will be generated by calling _buildElapsedPopup while the text of the notification will be generated by the call to _buildNotificationDisplayText.<br>
	 * The function finally calls _backend_getNotifications to load the new notifications. If the notifications are already showing, the function _buildNotification will be called.
	 * @see scmNotification#_buildNotificationDisplayText
	 * @see scmNotification#_buildElapsedPopup
	 * @see scmNotification#_buildNotification
	 * @param {JSon} json The answer from HRW
	 * @since 1.0
	 * <br/>Modified in version 1.1:
	 * <ul>
	 * <li>Remove the call to the manage heartBeat</li>
	 * </ul>
	 */
	createElapsedScheduleListHandler:function(json){
		this.forElapsedSchedule 	= false;
		// Get the values from the answer
		var elapsedTickets = objectToArray(json.EWS.HrwResponse.HrwResult.ArrayOfString.string);
		elapsedTickets = elapsedTickets.uniq();
		elapsedTickets.each(function(elapsedTicket){
			var notif= {	type	: 2,
							ticketId: elapsedTicket,
							displayText:	'',
							dom		  : null
					   } 
			// build the DOM object representing the popup for each notifications
			notif.displayText = this._buildNotificationDisplayText(notif);
			notif.dom = this._buildElapsedPopup(notif);
			if(this.currentNotification != notif) this.notifications.push(notif);
			this.notifications.uniq();
		}.bind(this))
		// Start the display of the popups
		if (this.alreadyShowing == false) this._buildNotification();
	},
	
	/**
	 * Function in charge of opening the edit ticket application so that the user can work on the ticket. This function is the responder function of the _backend_takeTicketInProcessing function.
	 * @param {JSon} json The answer of the backend call.
	 * @since 1.0
	 * <br/>Modified in version 1.1:
	 * <ul>
	 * <li>Remove the call to the manage heartBeat</li>
	 * </ul>
	 * @see scmNotification#_backend_takeTicketInProcessing
	 */
	openTicketViewerHandler:function(json){
		global.open($H({
			app: {appId:'TIK_PL', tabId:'PL_TIK', view:'scm_ticketApp'},
			selectedPart: scm_ticketApp.PROPERTIES	,
			forCreation	: false						,
			forEdition	: true						,
			ticketId	: json.EWS.HrwResponse.HrwResult.StartProcessingTicketResult.HrwTicket.TicketId
		}));
	}
});
/**
 * @class
 * @description Class in charge of managing all the popups available for the SCM ticketing application. All these popups fire events when the ok or save button are closed.
 * @author jonathanj & nicolasl
 * @version 2.2
 * <br/>Modified for 2.2
 * <ul>
 * <li>In the close popup, flag the send email flag by default or not</li>
 * <li>Use the new DatePicker</li>
 * <li>When adding documents to an email, build the list in divs and no more in tables to solve IE issue</li>
 * </ul>
 * <br/>Modified for 2.1
 * <ul>
 * <li>Use the common way to encode/decode fields for the communication to the backend</li>
 * <li>Add a flag in the pending popup to allow to send to the general pool</li>
 * <li>Do not display the id when selecting a pending reason</li>
 * </ul>
 * <br/>Modified for 2.0
 * <ul>
 * <li>Use the subclass of dataPicker with translations</li>
 * </ul>
 */
var ticketActionPopupScreens = Class.create(/** @lends ticketActionPopupScreens.prototype */{
	/**
	 * The selected agent id
	 * @type int
	 * @since 1.0
	 */
	selectedAgentId: null,
	/**
	 * The selected items id for the attachments
	 * @type int
	 * @since 1.0
	 */
	selectedItemId : null,
	/**
	 * Constructor for the class initializing the attributes to null.
	 * @since 1.0
	 */
	initialize:function(){
		this.selectedAgentId = null;
		this.selectedItemId  = null;
	},

	/**
	 * @description Function in charge of displaying a popup when the user want to set the ticket in pending mode
	 * @param {Array} pendingReasonsList The list of pending reasons.
	 * @param {String} ticketId The ticket id.
	 * @since 1.0
	 * <br/>Modifications for 2.1:
	 * <ul>
	 * <li>Use the standard encoding before sending to HRW</li>
	 * <li>Add the flag to allow to send to the general pool</li>
	 * <li>Remove the id from the display</li>
	 * </ul>
	 */
	showPendingPopup:function(ticketId, pendingReasonsList){
		var container = new Element('DIV');
		var html = 	'<div class="SCM_ticketPopup_title">'+global.getLabel('setTicket')+ ' ' + ticketId + ' '+ global.getLabel('toPending')+'</div>'+
					'<div id="pendingReasonContainer">'+
							'<div id="popupPendingLabel" class="SCM_ticketPopup_label">'+ global.getLabel('Pending_reason')+':</div><div id="pendingReasonDropDown"></div>'+
							'<div id="popupPendingDescr" class="SCM_ticketPopup_description_label">'+global.getLabel('DESCR')+'</div><div class="SCM_ticketPopup_description"><textarea id="pendingReasonDescription" cols="60" rows="10"></textarea></div>'+
							//since 2.1 Add the checkbox to indicate if we have to send to the general pool
							'<input type="checkbox" id="SCM_popupPendingGenPoolValue" class="SCM_ticketPopup_input"/><div id="SCM_popupPendingGenPool" class="SCM_ticketPopup_label">'+global.getLabel('SendToGeneralPool')+'</div>'+
					'</div>';	
		container.insert(html);
		
		var buttonsJson = {
            elements: [],
            mainClass: 'moduleInfoPopUp_stdButton_div_right'
        }; 
		
		var saveButtonClicked = function() {                    
            var reason;
			if(!Object.isEmpty(autocompleter.getValue()))
				reason = autocompleter.getValue().idAdded;
			//since 2.1 Use the standard encoding
			var description = HrwRequest.encode(container.down('[id="pendingReasonDescription"]').value);
			var isOk = false;
			
			if(Object.isEmpty(reason)){
				container.down('[id="popupPendingLabel"]').addClassName('SCM_ticketCreate_elemOnError')
			}else{
				isOk = true;
				container.down('[id="popupPendingLabel"]').removeClassName('SCM_ticketCreate_elemOnError')
			}
			if(Object.isEmpty(description)){
				isOk = false;
				container.down('[id="popupPendingDescr"]').addClassName('SCM_ticketCreate_elemOnError')
			}else{
				container.down('[id="popupPendingDescr"]').removeClassName('SCM_ticketCreate_elemOnError')
			}
			if (isOk){
				popupForPending.close();
	        	delete popupForPending;
	        	//since 2.1 Add the flag to check if it is to send to the general pool
				var sendToGenPoolFlag = container.down('input[id="SCM_popupPendingGenPoolValue"]');
				document.fire('EWS:scm_pendingPopupClosed',{reason:'save', pendingReasonId: reason, pendingDescription: description, sendToGenPool: ((sendToGenPoolFlag)?sendToGenPoolFlag.checked:false)});	
			}				
        };               
		var cancelButtonClicked = function(){
							popupForPending.close();
                            delete popupForPending;
		};
		
		var aux1 = {
			idButton: 'cancel',
            label: global.getLabel('Cancel'),
            handlerContext: null,
            className: 'moduleInfoPopUp_stdButton',
            handler: cancelButtonClicked,
            type: 'button',
            standardButton: true
		};
		
        var aux2 = {
            idButton: 'save',
            label: global.getLabel('Set_to_pending'),
            handlerContext: null,
            className: 'moduleInfoPopUp_stdButton',
            handler: saveButtonClicked,
            type: 'button',
            standardButton: true
        };
		buttonsJson.elements.push(aux2);                   
        buttonsJson.elements.push(aux1);
		var ButtonObj = new megaButtonDisplayer(buttonsJson);
        var buttons = ButtonObj.getButtons();                  
        container.insert(buttons);

		var popupForPending = new infoPopUp({
			closeButton :   $H( {
                        'callBack':     function() {
							popupForPending.close();
                            delete popupForPending;
                        }
                    }),
                    htmlContent : container,
                    indicatorIcon : 'question',                    
                    width: 600
		});
		popupForPending.create();
		
		var json = {autocompleter:{
						object: pendingReasonsList,
						multilanguage:{
							no_results:'No results found',
							search:'Search'}
						}
					}
		autocompleter = new JSONAutocompleter('pendingReasonDropDown', {
			showEverythingOnButtonClick: true,
			timeout: 5000,
			templateResult: '#{text}',
			//since 2.1 Remove the id from the display
			templateOptionsList: '#{text}'
		}, json);
	},	

	/**
	 * @description Function in charge of displaying a popup when the user want to set the ticket in waiting mode
	 * @param {String} ticketId The ticket id
	 * @since 1.0
	 * <br/>Modifications for 2.1:
	 * <ul>
	 * <li>Use the standard encoding before sending to HRW</li>
	 * </ul>
	 */
	showWaitingPopup:function(ticketId){
		var container = new Element('DIV');
		var html = 	'<div class="SCM_ticketPopup_title">'+global.getLabel('setTicket')+ ' ' + ticketId + ' '+ global.getLabel('toWaiting')+'</div>'+
					'<div id="waitingReasonContainer">'+
							'<div id="popupWaitingDescr" class="SCM_ticketPopup_description_label">'+global.getLabel('DESCR')+'</div><div class="SCM_ticketPopup_description"><textarea id="waitingReasonDescription" cols="60" rows="10"></textarea></div>'+
					'</div>';	
		container.insert(html);
		
		var buttonsJson = {
                    elements: [],
                    mainClass: 'moduleInfoPopUp_stdButton_div_right'
                }; 
				
		var saveButtonClicked = function() {    
			//since 2.1 Use the standard encoding              
			var description = HrwRequest.encode(container.down('[id="waitingReasonDescription"]').value);
			
			popupForWaiting.close();
	        delete popupForWaiting;
			document.fire('EWS:scm_waitingPopupClosed',{reason:'save', waitingDescription: description});				
        };               
		var cancelButtonClicked = function(){
							popupForWaiting.close();
                            delete popupForWaiting;
		};
		
		var aux1 = {
			idButton: 'cancel',
            label: global.getLabel('Cancel'),
            handlerContext: null,
            className: 'moduleInfoPopUp_stdButton',
            handler: cancelButtonClicked,
            type: 'button',
            standardButton: true
		};
        var aux2 = {
            idButton: 'save',
            label: global.getLabel('Set_to_waiting'),
            handlerContext: null,
            className: 'moduleInfoPopUp_stdButton',
            handler: saveButtonClicked,
            type: 'button',
            standardButton: true
        };
		
		buttonsJson.elements.push(aux2);                   
        buttonsJson.elements.push(aux1);
		var ButtonObj = new megaButtonDisplayer(buttonsJson);
        var buttons = ButtonObj.getButtons();                  
        //insert buttons in div
        container.insert(buttons);

		
		var popupForWaiting = new infoPopUp({
			closeButton :   $H( {
                        'callBack': function() {
							popupForWaiting.close();
                            delete popupForWaiting;
                        }
                    }),
                    htmlContent : container,
                    indicatorIcon : 'question',                    
                    width: 600
		});
		popupForWaiting.create();
	},

	/**
	 * @description Function in charge of displaying a popup when the user want to re open a closed ticket
	 * @param {String} ticketId The ticket id
	 * @since 1.0
	 * <br/>Modifications for 2.1:
	 * <ul>
	 * <li>Use the standard encoding before sending to HRW</li>
	 * </ul>
	 */
	showReOpenPopup:function(ticketId){
		var container = new Element('DIV');
		var html = 	'<div class="SCM_ticketPopup_title">'+global.getLabel('reopen_ticket')+ ' ' + ticketId + '</div>'+
					'<div id="reOpenReasonContainer">'+
							'<div id="popupReOpenDescr" class="SCM_ticketPopup_description_label">'+global.getLabel('DESCR')+'</div><div class="SCM_ticketPopup_description"><textarea id="reOpenReasonDescription" cols="60" rows="10"></textarea></div>'+
					'</div>';	
		container.insert(html);
		
		var buttonsJson = {
                    elements: [],
                    mainClass: 'moduleInfoPopUp_stdButton_div_right'
                }; 
				
		var saveButtonClicked = function() {     
			//since 2.1 Use the standard encoding             
			var description = HrwRequest.encode(container.down('[id="reOpenReasonDescription"]').value);
			var isOk = false;
			
			if(Object.isEmpty(description)){
				container.down('[id="popupReOpenDescr"]').addClassName('SCM_ticketCreate_elemOnError')
			}else{
				isOk = true;
				container.down('[id="popupReOpenDescr"]').removeClassName('SCM_ticketCreate_elemOnError')
			}
			if (isOk){
				popupForReOpen.close();
	        	delete popupForReOpen;
				document.fire('EWS:scm_reOpenPopupClosed',{reason:'save', reOpenDescription: description});	
			}				
        };               
		var cancelButtonClicked = function(){
							popupForReOpen.close();
                            delete popupForReOpen;
		};
		
		var aux1 = {
			idButton: 'cancel',
            label: global.getLabel('Cancel'),
            handlerContext: null,
            className: 'moduleInfoPopUp_stdButton',
            handler: cancelButtonClicked,
            type: 'button',
            standardButton: true
		};
        var aux2 = {
            idButton: 'save',
            label: global.getLabel('reopen_ticket'),
            handlerContext: null,
            className: 'moduleInfoPopUp_stdButton',
            handler: saveButtonClicked,
            type: 'button',
            standardButton: true
        };
		
		buttonsJson.elements.push(aux2);                   
        buttonsJson.elements.push(aux1);
		var ButtonObj = new megaButtonDisplayer(buttonsJson);
        var buttons = ButtonObj.getButtons();                  
        //insert buttons in div
        container.insert(buttons);

		
		var popupForReOpen = new infoPopUp({
			closeButton :   $H( {
                        'callBack': function() {
							popupForReOpen.close();
                            delete popupForReOpen;
                        }
                    }),
                    htmlContent : container,
                    indicatorIcon : 'question',                    
                    width: 600
		});
		popupForReOpen.create();
	},
		
	/**
	 * @description Function in charge of showing the send to general pool popup and managing the entered info.<br>
	 * 				That means checking if the mandatory fields are present and managing the option of the popup.<br>
	 * 				It also creates the body of the popup (HTML)
	 * @param {String} ticketId the ticket id.
	 * @since 1.0
	 * <br/>Modifications for 2.1:
	 * <ul>
	 * <li>Use the standard encoding before sending to HRW</li>
	 * </ul>
	 */
	showGeneralPoolPopup:function(ticketId){
		var container = new Element('DIV');
		var html = 	'<div class="SCM_ticketPopup_title">'+global.getLabel('sendTicket')+ ' ' + ticketId + ' '+ global.getLabel('toGeneralPool')+'</div>'+
					'<div id="generalPoolReasonContainer">'+
							'<div id="popupGeneralPoolDescr" class="SCM_ticketPopup_description_label">'+global.getLabel('DESCR')+'</div><div class="SCM_ticketPopup_description"><textarea id="generalPoolReasonDescription" cols="60" rows="10"></textarea></div>'+
					'</div>';	
		container.insert(html);
		
		var buttonsJson = {
                    elements: [],
                    mainClass: 'moduleInfoPopUp_stdButton_div_right'
                }; 
		/*
		 * Function in charge of checking if the mandatory fields have been entered and performing the correct action on the ticket
		 * via an event that will be catched by the main application	
		 */		
		var saveButtonClicked = function() {         
			//since 2.1 Use the standard encoding           
			var description = HrwRequest.encode(container.down('[id="generalPoolReasonDescription"]').value);
			var isOk = false;
			
			if(Object.isEmpty(description)){
				container.down('[id="popupGeneralPoolDescr"]').addClassName('SCM_ticketCreate_elemOnError')
			}else{
				isOk = true;
				container.down('[id="popupGeneralPoolDescr"]').removeClassName('SCM_ticketCreate_elemOnError')
			}
			if (isOk){
				popupForGeneralPool.close();
	        	delete popupForGeneralPool;
				document.fire('EWS:scm_generalPoolPopupClosed',{reason:'save', generalPoolDescription: description});	
			}				
        };               
		var cancelButtonClicked = function(){
							popupForGeneralPool.close();
                            delete popupForGeneralPool;
		};
		
		var aux1 = {
			idButton: 'cancel',
            label: global.getLabel('Cancel'),
            handlerContext: null,
            className: 'moduleInfoPopUp_stdButton',
            handler: cancelButtonClicked,
            type: 'button',
            standardButton: true
		};
        var aux2 = {
            idButton: 'save',
            label: global.getLabel('General_pool'),
            handlerContext: null,
            className: 'moduleInfoPopUp_stdButton',
            handler: saveButtonClicked,
            type: 'button',
            standardButton: true
        };
		
		buttonsJson.elements.push(aux2);                   
        buttonsJson.elements.push(aux1);
		var ButtonObj = new megaButtonDisplayer(buttonsJson);
        var buttons = ButtonObj.getButtons();                  
        //insert buttons in div
        container.insert(buttons);

		
		var popupForGeneralPool = new infoPopUp({
			closeButton :   $H( {
                        'callBack': function() {
					//		document.fire('EWS:scm_generalPoolPopupClosed',{reason:'close'});
							popupForGeneralPool.close();
                            delete popupForGeneralPool;
                        }
                    }),
                    htmlContent : container,
                    indicatorIcon : 'question',                    
                    width: 600
		});
		popupForGeneralPool.create();
	},
	
	/**
	 * @description Function in charge of showing the schedule popup and managing the entered info.
	 * 				That means checking if the mandatory fields are present and managing the option of the popup.
	 * 				It also creates the body of the popup (HTML)
	 * @param {Array} pendingReasonsList The possible pending reason loaded from the company settings.
	 * @param {Array} assignedAgentsList The possible agents for the company coming from the company settings.
	 * @param {String} ticketId The ticket id.
	 * @since 1.0
	 * <br/>Modified for 2.2
	 * <ul>
	 * <li>Use the new datePicker</li>
	 * </ul>
	 * <br/>Modifications for 2.1:
	 * <ul>
	 * <li>Use the standard encoding before sending to HRW</li>
	 * <li>Correct the sorting of agents</li>
	 * <li>Set correctly the default and the start dates</li>
	 * <li>Check that the selected moment is not in the past</li>
	 * </ul>
	 * <br/>Modified for 2.0
	 * <ul>
	 * <li>Use the subclass of dataPicker with translations</li>
	 * </ul>
	 */
	showSchedulePopup:function(ticketId, pendingReasonsList, assignedAgentsList){
		var scheduledData = {service: '', description: '', scheduleTime:'', scheduleAgentId:'', pendingReasonId:''};
		
		var container = new Element('DIV');
		var html = 	'<div class="SCM_ticketPopup_title">'+global.getLabel('scheduleTicket')+ ' ' + ticketId +'</div>'+
					'<div id="scheduleReasonContainer">'+
							'<div id="popupScheduleTypeSchedulingSelection" class="SCM_ticketPopup_border SCM_ticketPopup_border_height1">'+
								'<div class="SCM_ticketPopup_label">'+global.getLabel('Schedule_method')+':</div>'+
								'<div>'+
									'<div class="SCM_ticketPopup_inputLabel">'+ global.getLabel('Duration') +'</div>'+
									'<div class="SCM_ticketPopup_input"><input id="scm_duration_check" type="checkbox" checked="X"/></div>'+
									'<div class="SCM_ticketPopup_inputLabel">'+ global.getLabel('Specific_date_time') +'</div>'+
									'<div class="SCM_ticketPopup_input"><input id="scm_specDateTime_check" type="checkbox"/></div>'+
								'</div>'+
							'</div>'+
							'<div id="popupScheduleSchedulingByDurationSelection" class="SCM_ticketPopup_border SCM_ticketPopup_border_height1">'+
								'<div class="SCM_ticketPopup_label">'+global.getLabel('Number_of')+':</div>'+
								'<div class="SCM_ticketPopup_inputLabel" id="popupNumberOfDaysLabel">'+ global.getLabel('Days') +':</div>'+
								'<div class="SCM_ticketPopup_input"><input id="popupNumberOfDays" type="text" size="5"/></div>'+ 
								'<div class="SCM_ticketPopup_inputLabel" id="popupNumberOfHoursLabel">'+ global.getLabel('Hours') +':</div>'+
								'<div class="SCM_ticketPopup_input"><input id="popupNumberOfHours" type="text" size="5"/></div>'+
							'</div>'+
							'<div id="popupScheduleSchedulingSpecificDateSelection" class="SCM_ticketPopup_border SCM_ticketPopup_border_height3">'+
								'<div class="SCM_ticketPopup_label">'+global.getLabel('Selected_date_time')+':</div>'+
								'<div>'+
									'<div class="SCM_ticketPopup_inputLabel" id="popupDateLabel">'+global.getLabel('Date')+'</div>'+
									'<div class="SCM_ticketPopup_input" id="SCM_ticketPopup_calendar"></div>'+
								'</div>'+
								'<div class="SCM_ticketPopup_timeDisplay">'+
									'<div class="SCM_ticketPopup_inputLabel" id="popupTimeLabel">'+global.getLabel('Time')+'</div>'+
									'<div class="SCM_ticketPopup_input" id="SCM_ticketPopup_time"></div>'+
								'</div>'+
							'</div>'+
							'<div id="popupScheduleSchedulingToAgentSelection" class="SCM_ticketPopup_border SCM_ticketPopup_border_height2">'+
								'<div>'+
									'<div class="SCM_ticketPopup_inputNoPadding"><input id="popupSelectAgent" type="checkbox"></input></div>'+
									'<div class="SCM_ticketPopup_inputLabel" id="popupAgentLabel">'+global.getLabel('Select_agent')+'</div>'+
									'<div id="popupAgentSelection" class="SCM_ticketPopup_borderedInput SCM_ticketPopup_overflow"></div>'+
								'</div>'+
							'</div>'+
							'<div id="popupScheduleSchedulePendingSelection" class="SCM_ticketPopup_border SCM_ticketPopup_border_height1">'+
								'<div>'+
									'<div class="SCM_ticketPopup_inputNoPadding"><input id="popupSetPending" type="checkbox" value=""/></div>'+
									'<div class="SCM_ticketPopup_inputLabel">'+global.getLabel('Set_to_pending')+'</div>'+
									'<div class="SCM_ticketPopup_inputLabel SCM_ticketPopup_schedulePendingReason" id="popupSetPendingLabel">'+global.getLabel('Pending_reason')+':</div>'+
									//since 1.2 Change the Id because it is already use in pending popup and the style is linked to the Id
									'<div id="SCM_SchPendingReasonDropDown"></div>'+
								'</div>'+
							'</div>'+
							'<div id="popupScheduleDescr" class="SCM_ticketPopup_description_label">'+global.getLabel('Scheduled_task_description')+':</div><div class="SCM_ticketPopup_description"><textarea id="scheduleDescription" cols="64" rows="3"></textarea></div>'+
					'</div>';	
		container.insert(html);
		
		var buttonsJson = {
                    elements: [],
                    mainClass: 'moduleInfoPopUp_stdButton_div_right'
                }; 
		/*
		 * @description Function in charge of checking if the mandatory fields have been entered and performing the correct action on the ticket
		 * 				via an event that will be catched by the main application	
		 */		
		var saveButtonClicked = function() {              
		
			var scheduleType = 1; // ScheduleTicket
			var pendingReasonId =''; 
			var scheduleAgentId = '';
			var scheduleTime = '';
			//since 2.1 Use the standard encoding
			var description = HrwRequest.encode(container.down('[id="scheduleDescription"]').value);			
			var isOk = false;
			if(Object.isEmpty(description)){
				container.down('[id="popupScheduleDescr"]').addClassName('SCM_ticketCreate_elemOnError')
			}else{
				isOk = true;
				container.down('[id="popupScheduleDescr"]').removeClassName('SCM_ticketCreate_elemOnError')
			}
			if(container.down('[id="scm_duration_check"]').checked == true){
				if (Object.isEmpty(container.down('[id="popupNumberOfDays"]').value) && Object.isEmpty(container.down('[id="popupNumberOfHours"]').value) ){
					isOk = false;
					container.down('[id="popupScheduleSchedulingByDurationSelection"]').addClassName('SCM_ticketCreate_elemOnError');					
				}else{
					var dayIsOk  = true;
					var hourIsOk = true;
					var nbrDays  = container.down('[id="popupNumberOfDays"]').value;
					var nbrHours = container.down('[id="popupNumberOfHours"]').value;
					if(!Object.isEmpty(nbrDays)){
						if(nbrDays.match(/\D/i) != null){
							isOk = false;
							dayIsOk = false;
							container.down('[id="popupScheduleSchedulingByDurationSelection"]').addClassName('SCM_ticketCreate_elemOnError');
						}else{
							isOk = true;
							dayIsOk = true;
							container.down('[id="popupScheduleSchedulingByDurationSelection"]').removeClassName('SCM_ticketCreate_elemOnError');
						}
					}
					
					if(!Object.isEmpty(nbrHours)){
						if(nbrHours.match(/\D/i) != null){
							isOk = false;
							hourIsOk = false;
							container.down('[id="popupScheduleSchedulingByDurationSelection"]').addClassName('SCM_ticketCreate_elemOnError');
						}else{
							isOk = true;
							hourIsOk = true;
							container.down('[id="popupScheduleSchedulingByDurationSelection"]').removeClassName('SCM_ticketCreate_elemOnError');
						}
					}
					if (hourIsOk == true && dayIsOk == true) {
						container.down('[id="popupScheduleSchedulingByDurationSelection"]').removeClassName('SCM_ticketCreate_elemOnError');
						!Object.isEmpty(nbrDays)? nbrDays = parseInt(nbrDays): nbrDays = 0;
						!Object.isEmpty(nbrHours)? nbrHours = parseInt(nbrHours): nbrHours = 0;
						var date = new Date();
						var millisecondsFromHours = nbrHours * 3600000;
						var millisecondsFromDays  = nbrDays  * 24 * 3600000;
						var millisecondsToAdd =  millisecondsFromHours + millisecondsFromDays + date.getTime();
						date.setTime(millisecondsToAdd);
						var hours = date.getHours();
						if (hours <= 9)
							hours = '0'+hours;
						var minuts = date.getMinutes();
						if (minuts <= 9)
							minuts = '0'+minuts;
						var seconds = date.getSeconds();
						if (seconds <= 9)
							seconds = '0'+seconds;
						
						scheduleTime = 	date.getFullYear()  + '-' + 
										(date.getMonth()+1) + '-' +
										date.getDate()		+ 'T' +
										hours				+ ':' +
										minuts				+ ':' +
										seconds;									
					}
				}
			}else{
				isOk = true;
				var timeChosen = time.getSapTime();
				var dateChosen = calendar.getActualDate();
				
				scheduleTime = 	dateChosen				+ 'T' +
								timeChosen.substr(0,2)	+ ':' +
								timeChosen.substr(2,2)	+ ':' +
								timeChosen.substr(4,2);
				
				//since 2.1 Check if the date/time is really after the current moment
				if(isOk) {
					if(scheduleTime.match(/[0-9]{4}-[01][0-9]-[0-3][0-9]T[0-2][0-9]:[0-5][0-9]:[0-5][0-9]/)){
						var currentMoment = new Date().addMinutes(1);
						var selectedMoment = SCM_Ticket.convertDateTimeToObjects(scheduleTime);
						if(currentMoment.compareTo(selectedMoment) >= 0) {
							isOk = false;
							container.down('[id="popupScheduleSchedulingSpecificDateSelection"]').addClassName('SCM_ticketCreate_elemOnError');
						} else {
							container.down('[id="popupScheduleSchedulingSpecificDateSelection"]').removeClassName('SCM_ticketCreate_elemOnError');
						} 
					} else {
						isOk = false;
						container.down('[id="popupScheduleSchedulingSpecificDateSelection"]').addClassName('SCM_ticketCreate_elemOnError');
					}
				}
			}
			
			if(container.down('[id="popupSelectAgent"]').checked == true){
				var scheduleType = 2; //ScheduleTicketToAgent
				var selectedAgent = container.down('[id="popupAgentSelection"]').down('.SCM_ticketAction_actionSelected');
				if(Object.isEmpty(selectedAgent)){
					isOk = false;
					container.down('[id="popupScheduleSchedulingToAgentSelection"]').addClassName('SCM_ticketCreate_elemOnError');
				}else{
					container.down('[id="popupScheduleSchedulingToAgentSelection"]').removeClassName('SCM_ticketCreate_elemOnError');
					scheduleAgentId = selectedAgent.id.gsub('ticketPopup_agentId_', '');
				}
			}
			if(container.down('[id="popupSetPending"]').checked == true){
				if(scheduleType == 1){
					scheduleType = 4; //ScheduleTicketPending	
				}else if (scheduleType == 2){
					scheduleType = 5; //ScheduleTicketToAgentPending
				}else if (scheduleType == 3){
					scheduleType = 6; //ScheduleTicketToGroupPending
				}
				if(!Object.isEmpty(autocompleter.getValue())){
					isOk = true;
					pendingReasonId = autocompleter.getValue().idAdded;
				}else{
					isOk = false;
					container.down('[id="popupScheduleSchedulePendingSelection"]').addClassName('SCM_ticketCreate_elemOnError');
				}
			}
			
			if (isOk){
				popupForSchedule.close();
	        	delete popupForSchedule;
				
				var service='';
				switch(scheduleType){
					case 1: service = 'ScheduleTicket';
							break;
					case 2: service = 'ScheduleTicketToAgent';
							break;					
					case 3: service = 'ScheduleTicketToGroup';
							break;					
					case 4: service = 'ScheduleTicketPending';
							break;					
					case 5: service = 'ScheduleTicketToAgentPending';
							break;					
					case 6: service = 'ScheduleTicketToGroupPending';
							break;					
				}
				document.fire('EWS:scm_schedulePopupClosed',{reason:'save', service: service, description: description, scheduleTime:scheduleTime , scheduleAgentId:scheduleAgentId , pendingReasonId:pendingReasonId});	
			}				
        };               
		var cancelButtonClicked = function(){
							popupForSchedule.close();
                            delete popupForSchedule;
		};
		
		var aux1 = {
			idButton: 'cancel',
            label: global.getLabel('Cancel'),
            handlerContext: null,
            className: 'moduleInfoPopUp_stdButton',
            handler: cancelButtonClicked,
            type: 'button',
            standardButton: true
		};
        var aux2 = {
            idButton: 'save',
            label: global.getLabel('Schedule'),
            handlerContext: null,
            className: 'moduleInfoPopUp_stdButton',
            handler: saveButtonClicked,
            type: 'button',
            standardButton: true
        };
		
		buttonsJson.elements.push(aux2);                   
        buttonsJson.elements.push(aux1);
		var ButtonObj = new megaButtonDisplayer(buttonsJson);
        var buttons = ButtonObj.getButtons();                  
        //insert buttons in div
        container.insert(buttons);

		
		var popupForSchedule = new infoPopUp({
			closeButton :   $H( {
                        'callBack': function() {
			//				document.fire('EWS:scm_schedulePopupClosed',{reason:'close'});
							popupForSchedule.close();
                            delete popupForSchedule;
                        }
                    }),
                    htmlContent : container,
                    indicatorIcon : 'question',                    
                    width: 600
		});
		popupForSchedule.create();
		
		// create the date picker
		//since 2.2 Use the new datePicker
		var calendar = new DatePicker('SCM_ticketPopup_calendar', {
			//since 2.1 Select the current date correctly
            defaultDate			: new Date().toString('yyyyMMdd'),
			//since 2.1 Only allow to select date in the future
            fromDate			: new Date().addDays(-1).toString('yyyyMMdd'),
            manualDateInsertion	: false,
			emptyDateValid		: false
        });
		// create the time picker
		//since 2.1 Get the hour format from global
		var time = new HourField('SCM_ticketPopup_time', {
    	    viewSecs	: (global.hourFormat.match(/s{1,2}/))	? 'yes'	: 'no',
        	format		: (global.hourFormat.match(/[tT]{1,2}/))? '12'	: '24',
			//since 2.1 Set the current time correctly
        	defaultTime	: new Date().toString('HHmmss')
	    });


		// create the autocomplete
		var json = {autocompleter:{
						object: pendingReasonsList,
						multilanguage:{
							no_results:'No results found',
							search:'Search'}
						}
					};
		//since 1.2 Change the Id because it is already use in pending popup and the style is linked to the Id
		var autocompleter = new JSONAutocompleter('SCM_SchPendingReasonDropDown', {
			showEverythingOnButtonClick: true,
			timeout: 5000,
			templateResult: '#{text}',
			templateOptionsList: '#{text}'
		}, json);
		
		//grey the options
		//since 2.1 We use now the global date format => get the list of fields to deactivate dynamically
		container.select('input.hourField_correct','input.datePicker_text_day','input.datePicker_text_month','input.datePicker_text_year', 'input[type="radio"]').invoke('disable');
		
		// add actions on checkboxes
		var checkDuration = container.down('[id="scm_duration_check"]');
		var checkSpec = container.down('[id="scm_specDateTime_check"]');
		
		checkDuration.observe('click',function(){
			checkSpec.checked = false;
			// durations options
			container.down('[id="popupNumberOfDays"]').disabled = false;
			container.down('[id="popupNumberOfHours"]').disabled = false;
			// specific options
			//since 2.1 We use now the global date format => get the list of fields to deactivate dynamically
			container.select('input.hourField_correct','input.datePicker_text_day','input.datePicker_text_month','input.datePicker_text_year', 'input[type="radio"]').invoke('disable');
		});
		checkSpec.observe('click',function(){
			checkDuration.checked=false;
			// duration options
			container.down('[id="popupNumberOfDays"]').disabled = true;
			container.down('[id="popupNumberOfHours"]').disabled = true;
			// specific options
			//since 2.1 We use now the global date format => get the list of fields to deactivate dynamically
			container.select('input.hourField_correct','input.datePicker_text_day','input.datePicker_text_month','input.datePicker_text_year', 'input[type="radio"]').invoke('enable');
		});
		//since 2.1 Correct the sorting
		assignedAgentsList = assignedAgentsList.sortBy(function(agent){ return agent.text;});
		
		var agentHTML = '<table class="SCM_ticket_screen_FullWidth">';
		assignedAgentsList.each(function(assignedAgent){
			agentHTML += '<tr><td id="ticketPopup_agentId_'+ assignedAgent.data +'">'+ assignedAgent.text +'</td></tr>';
		});
		agentHTML += '</table>';
		container.down('[id="popupAgentSelection"]').update(agentHTML);
		
		assignedAgentsList.each(function(assignedAgent){
			lookupId = '[id="ticketPopup_agentId_'+ assignedAgent.data + '"]';
			var elem = container.down(lookupId);
			elem.observe('click', function(){
				if(this.selectedAgentId != null){
					container.down('[id="ticketPopup_agentId_'+ this.selectedAgentId +'"]').removeClassName('SCM_ticketAction_actionSelected');
				}
				elem.addClassName('SCM_ticketAction_actionSelected');
				this.selectedAgentId = assignedAgent.data;
			}.bind(this));
		}.bind(this));
	},
	
	/**
	 * Function in charge of showing the send to popup and managing the entered info.<br>
	 * That means checking if the mandatory fields are present and managing the option of the popup.<br>
	 * It also creates the body of the popup (HTML).
	 * @param {String} ticketId The ticket Id.
	 * @param {Array} assignedAgentsList The possible agents for the company coming from the company settings.
	 * @param {Array} possibleGroupsList The possible groups for the company coming from the company settings.
	 * @since 1.0
	 * <br/>Modifications for 2.1:
	 * <ul>
	 * <li>Use the standard encoding before sending to HRW</li>
	 * <li>Correct the agents and groups sorting</li>
	 * </ul>
	 */
	showSendToPopup:function(ticketId, assignedAgentsList, possibleGroupsList){
		
		var container = new Element('DIV');
		var html = '';
		if(possibleGroupsList != null){
			html += '<div class="SCM_ticketPopup_title">'+global.getLabel('sendTicket')+ ' ' + ticketId +'</div>'+
					'<div id="sendToContainer">'+
								'<div class="SCM_ticketPopup_border_height3 SCM_ticketPopup_border">'+
									'<div class="SCM_ticketPopup_radioButton">'+
									'<input id="radioAgent" type="radio" name="sendTo" value="Agent" checked="X"/><span id="popupAgentLabel">'+global.getLabel('Send_ticket_to_agent')+ '</span>'+
									'</div>'+
									'<div id="popupAgentSelection" class="SCM_ticketPopup_acBorder3"></div>'+
								'</div>'+
								'<div class="SCM_ticketPopup_border_height3 SCM_ticketPopup_border">'+
									'<div class="SCM_ticketPopup_radioButton">'+
									'<input id="radioGroup" type="radio" name="sendTo" value="Group"/><span id="popupGroupLabel">'+global.getLabel('Send_ticket_to_group')+ '</span>'+
									'</div>'+
									'<div id="popupGroupSelection" class="SCM_ticketPopup_acBorder3"></div>'+
								'</div>'+
								'<div id="popupSendToDescription" class="SCM_ticketPopup_description_label">'+global.getLabel('DESCR')+':</div><div class="SCM_ticketPopup_description"><textarea id="sendToDescription" cols="60" rows="10"></textarea></div>'+
					'</div>';
		}else{
			html += '<div class="SCM_ticketPopup_title">'+global.getLabel('sendTicket')+ ' ' + ticketId +'</div>'+
					'<div id="sendToContainer">'+
								'<div id="popupAgentLabel" class="SCM_ticketPopup_label">'+global.getLabel('Send_ticket_to')+':</div>'+
							'<div>'+
								'<div class="SCM_ticketPopup_border_height1">'+
									'<div id="popupAgentSelection"></div>'+
								'</div>'+
								'<div id="popupSendToDescription" class="SCM_ticketPopup_description_label">'+global.getLabel('DESCR')+':</div><div class="SCM_ticketPopup_description"><textarea id="sendToDescription" cols="60" rows="10"></textarea></div>'+
							'</div>'+
					'</div>';	
		}
			
		container.insert(html);
		
		var buttonsJson = {
                    elements: [],
                    mainClass: 'moduleInfoPopUp_stdButton_div_right'
                }; 
/*
 * @description Function in charge of checking if the mandatory fields have been entered and performing the correct action on the ticket
 * 				via an event that will be catched by the main application	
 */		
		var saveButtonClicked = function() {
			var selection;
			var labelIdentifier;
			var serviceToCall = '';
				
			if(possibleGroupsList != null && container.down('[id="radioGroup"]').checked == true){
				if(!Object.isEmpty(autocompleterGroup.getValue()))
					selection = autocompleterGroup.getValue().idAdded;
				labelIdentifier = '[id="popupGroupLabel"]';
				serviceToCall = 'AssignTicketToGroup';
			}else{
				if(!Object.isEmpty(autocompleterAgent.getValue()))
					selection = autocompleterAgent.getValue().idAdded;
				labelIdentifier = '[id="popupAgentLabel"]';
				serviceToCall = 'AssignTicketToAgent';
			}
			//since 2.1 Use the standard encoding
			var description = HrwRequest.encode(container.down('[id="sendToDescription"]').value);
			var isOk = false;
			
			if (Object.isEmpty(selection)) {
				container.down(labelIdentifier).addClassName('SCM_ticketCreate_elemOnError');
			}else{
				container.down(labelIdentifier).removeClassName('SCM_ticketCreate_elemOnError');
				isOk = true;
			}
			if(Object.isEmpty(description)){
				isOk = false;
				container.down('[id="popupSendToDescription"]').addClassName('SCM_ticketCreate_elemOnError');
			}else{
				container.down('[id="popupSendToDescription"]').removeClassName('SCM_ticketCreate_elemOnError');
			}
			if (isOk){
				popupForSendTo.close();
	        	delete popupForSendTo;
				document.fire('EWS:scm_sendToPopupClosed',{reason:'save', serviceToCall:serviceToCall, description: description, assignedAgentId:selection });	
			}				
        }.bind(this);               
		var cancelButtonClicked = function(){
							popupForSendTo.close();
                            delete popupForSendTo;
		};
		
		var aux1 = {
			idButton: 'cancel',
            label: global.getLabel('Cancel'),
            handlerContext: null,
            className: 'moduleInfoPopUp_stdButton',
            handler: cancelButtonClicked,
            type: 'button',
            standardButton: true
		};
        var aux2 = {
            idButton: 'save',
            label: global.getLabel('Send_to'),
            handlerContext: null,
            className: 'moduleInfoPopUp_stdButton',
            handler: saveButtonClicked,
            type: 'button',
            standardButton: true
        };
		
		buttonsJson.elements.push(aux2);                   
        buttonsJson.elements.push(aux1);
		var ButtonObj = new megaButtonDisplayer(buttonsJson);
        var buttons = ButtonObj.getButtons();                  
        //insert buttons in div
        container.insert(buttons);

		
		var popupForSendTo = new infoPopUp({
			closeButton :   $H( {
                        'callBack': function() {
						//	document.fire('EWS:scm_sendToPopupClosed',{reason:'close'});
							popupForSendTo.close();
                            delete popupForSendTo;
                        }
                    }),
                    htmlContent : container,
                    indicatorIcon : 'question',                    
                    width: 600
		});
		popupForSendTo.create();
		//since 2.1 Correct the sorting of agents
		assignedAgentsList = assignedAgentsList.sortBy(function(agent){return agent.text;});
		var json = {autocompleter:{
						object: assignedAgentsList,
						multilanguage:{
							no_results:'No results found',
							search:'Search'}
						}
					};
		var autocompleterAgent = new JSONAutocompleter('popupAgentSelection', {
		//	label: global.getLabel('Select_agent'),
			showEverythingOnButtonClick: true,
			timeout: 5000,
			templateResult: '#{text}',
			templateOptionsList: '#{text}'
		}, json);
		
		if(possibleGroupsList != null){
			var groups = $A();
			possibleGroupsList.each(function(group){
				groups.push({data: group.Key, text:group.Value});
			});	
			//since 2.1 add a sorting on the group names
			possibleGroupsList = possibleGroupsList.sortBy(function(agent){return agent.text;});
			
			json = {autocompleter:{
						object: groups,
						multilanguage:{
							no_results:'No results found',
							search:'Search'}
						}
					};
			var autocompleterGroup = new JSONAutocompleter('popupGroupSelection', {
		//		label: global.getLabel('Select_group'),
				showEverythingOnButtonClick: true,
				timeout: 5000,
				templateResult: '#{text}',
				templateOptionsList: '#{text}'
			}, json);
		}
	},
	
	/**
	 * Function in charge of showing the close ticket popup and managing the entered info.<br>
	 * That means checking if the mandatory fields are present and managing the option of the popup.<br>
	 * It also creates the body of the popup (HTML).
	 * @param {String} ticketId The ticket Id
	 * @param {boolean} sendMailAfterCloseChecked Flag meaning if a mail should be checked after the ticket creation.
	 * @param {boolean} sendMailOptionVisible Flag meaning if the checkbox allowing to send email after closure should be displayed or invisible to the user
	 * @since 1.0
	 * <br/>Modified in 2.2
	 * <ul>
	 * <li>Check if the flag for the sending of the email is set</li>
	 * <li>Small refactoring</li>
	 * </ul>
	 */
	showClosePopup:function(ticketId, sendMailAfterCloseChecked, sendMailOptionVisible){
		var closeData = {ticket : '',ticketSkillIds: '' };
		var container = new Element('DIV');
		var html = 	'<div class="SCM_ticketPopup_title">'+global.getLabel('closeTicket')+ ' ' + ticketId +'</div>'+
					'<div id="closeContainer"><div class="SCM_ticketPopup_sendMailCheck">'+ global.getLabel('closeText')+ ' ' +ticketId+'?</div>';
		if (sendMailOptionVisible == "true"){
			//since 2.2 The attribute checked is not used with value "true"/"false" but is present or not
			html += '<div class="SCM_ticketPopup_mailCheckBox"><input id="sendMailAfterClose" type="checkbox" '
			if(sendMailAfterCloseChecked === "true")html += 'checked="true"';
			html += '>' + global.getLabel('sendMailClosure') + '</input></div>';
		}
		html += '</div>';	
		container.insert(html);
		
		var buttonsJson = {
                    elements: [],
                    mainClass: 'moduleInfoPopUp_stdButton_div_right'
                }; 
		/*
		 * @description Function in charge of checking if the mandatory fields have been entered and performing the correct action on the ticket
		 * 				via an event that will be catched by the main application	
		 */		
		var okButtonClicked = function() {
			popupForClose.close();
            delete popupForClose;
			//since 2.2 Small refactoring
			var withMail = ((sendMailOptionVisible === 'true') && container.down('[id="sendMailAfterClose"]').checked);

			document.fire('EWS:scm_closePopupClosed',{reason:'save', withMail: withMail});
        };               
		
		var cancelButtonClicked = function(){
			popupForClose.close();
           	delete popupForClose;
		};
		
		var aux1 = {
			idButton: 'cancel',
            label: global.getLabel('Cancel'),
            handlerContext: null,
            className: 'moduleInfoPopUp_stdButton',
            handler: cancelButtonClicked,
            type: 'button',
            standardButton: true
		};
		
        var aux2 = {
            idButton: 'ok',
            label: global.getLabel('Close'),
            handlerContext: null,
            className: 'moduleInfoPopUp_stdButton',
            handler: okButtonClicked,
            type: 'button',
            standardButton: true
        };
		
		buttonsJson.elements.push(aux2);                   
        buttonsJson.elements.push(aux1);
		var ButtonObj = new megaButtonDisplayer(buttonsJson);
        var buttons = ButtonObj.getButtons();                  
        //insert buttons in div
        container.insert(buttons);

		var popupForClose = new infoPopUp({
			closeButton :   $H( {
                        'callBack': function() {
							popupForClose.close();
                            delete popupForClose;
                        }
                    }),
                    htmlContent : container,
                    indicatorIcon : 'question',                    
                    width: 600
		});
		popupForClose.create();
	},
	/**
	 * Function in charge of displaying an email popup containing the preview of the email that will be send.
	 * @param {String} mailBody The body of the email to be displayed.
	 * @param {Array} mailFrom An array containing the list of possible from addresses
	 * @param {Array} mailTo An array containing the list of possible from addresses
	 * @param {String} buttonLabel The label that will be displayed in the button.
	 * @since 1.0
	 * <br/>Modification for 1.2
	 * <ul>
	 * <li>If there is no mail from or mail to, avoid sending emails</li>
	 * <li>Set a default email address by default and sort them by name</li>
	 * </ul>
	 */
	displayEmailPopup:function(mailBody, mailFrom, mailTo, buttonLabel){
		//since 1.2 If there is no mail From or mail To address, do not propose the screen
		if(Object.isEmpty(mailFrom) || mailFrom.compact().size() === 0 || Object.isEmpty(mailTo) || mailTo.compact().size() === 0) {
			this.displayInvalidEmailsPopup();
			return;
		}
		var mailFromSelected = '';
		var mailToSelected = '';
		var isOk = true;
		var container = new Element('DIV');
		var html = 	'<div id="mailPopup_fromContainer">'+
						'<div class="SCM_mailPopup_emailLabel" id="mailPopup_fromLabel">'+ global.getLabel('Choose_email_from') +'</div>'+
						'<div id="mailPopup_fromAutoComplete"></div>'+
					'</div>'+
					'<div class="SCM_mailPopup_toContainer" id="mailPopup_toContainer">'+
						'<div class="SCM_mailPopup_emailLabel" id="mailPopup_toLabel">'+ global.getLabel('Choose_email_to') +'</div>'+
						'<div id="mailPopup_toAutoComplete"></div>'+
					'</div>'+
					'<div class="SCM_mailPopup_toContainer" id="mailPopup_mailBodyContainer">'+
						'<div>'+ global.getLabel('Mail_body') +'</div>'+
						'<textarea id="mailPopup_mailBody" cols="57" rows="15" disabled="disabled"></textarea>'+
					'</div>';
		container.insert(html);
		
		var buttonsJson = {
                    elements: [],
                    mainClass: 'moduleInfoPopUp_stdButton_div_right'
                }; 
				
		var saveButtonClicked = function(){
			// check an entry is selected in the dropdown for the mail to and mail from
			if(!Object.isEmpty(autocompleterTo.getValue())){
				container.down('[id="mailPopup_toLabel"]').removeClassName('SCM_ticketCreate_elemOnError');
				mailToSelected = autocompleterTo.getValue().idAdded;
				isOk = true;
			}else{
				container.down('[id="mailPopup_toLabel"]').addClassName('SCM_ticketCreate_elemOnError');
				isOk = false;
			}
			if(!Object.isEmpty(autocompleterFrom.getValue())){
				container.down('[id="mailPopup_fromLabel"]').removeClassName('SCM_ticketCreate_elemOnError');
				mailFromSelected = autocompleterFrom.getValue().idAdded;
			}else{
				container.down('[id="mailPopup_fromLabel"]').addClassName('SCM_ticketCreate_elemOnError');
				isOk = false;
			}
			// call the backend to create the ticket
			if (isOk == true){
				document.fire('EWS:scm_mailPopupClosed',{mailTo: mailToSelected, mailFrom: mailFromSelected});
				popupForMail.close();
            	delete popupForMail;
			}
		};
				
		var aux2 = {
            idButton: 'ok',
            label: global.getLabel(buttonLabel),
            handlerContext: null,
            className: 'moduleInfoPopUp_stdButton',
            handler: saveButtonClicked,
            type: 'button',
            standardButton: true
        };
		
		buttonsJson.elements.push(aux2);          
        var ButtonObj = new megaButtonDisplayer(buttonsJson);
        var buttons = ButtonObj.getButtons();                  
        //insert buttons in div
        container.insert(buttons);
	
		var popupForMail = new infoPopUp({
			closeButton :   $H( {
                        'callBack': function() {
							popupForMail.close();
                            delete popupForMail;
                        }
                    }),
                    htmlContent : container,
                    indicatorIcon : 'information',                    
                    width: 600
		});
		popupForMail.create();
		
		var mailToAdd = $A();
		var mailFromAdd = $A();
		
		// create the both autocomplete
		mailTo.each(function(mail){
			mailToAdd.push({ data: mail, text: mail });
		});
		//since 1.2 Add a default value and sort the email address by value
		mailToAdd = mailToAdd.sortBy(function(item) {
			return item.text;
		});
		mailToAdd[0].def = 'X';
		
		mailFrom.each(function(mail){
			mailFromAdd.push({data:mail.Address, text:mail.Name});
		});
		//since 1.2 Add a default value and sort the email address by value
		mailFromAdd = mailFromAdd.sortBy(function(item) {
			return item.text;
		});
		mailFromAdd[0].def = 'X';
		
		var jsonTo = {autocompleter:{
						object: mailToAdd,
						multilanguage:{
							no_results:'No results found',
							search:'Search'}
						}
					};
		var autocompleterTo = new JSONAutocompleter('mailPopup_toAutoComplete', {
			showEverythingOnButtonClick: true,
			timeout: 5000,
			templateResult: '#{text}',
			templateOptionsList: '#{text}'
		}, jsonTo);
		
		container.down('[id="text_area_mailPopup_toAutoComplete"]').addClassName('SCM_mailPopup_extendAutoComplete');
		
		var jsonFrom = {autocompleter:{
						object: mailFromAdd,
						multilanguage:{
							no_results:'No results found',
							search:'Search'}
						}
					};
		var autocompleterFrom = new JSONAutocompleter('mailPopup_fromAutoComplete', {
			showEverythingOnButtonClick: true,
			timeout: 5000,
			templateResult: '#{text}',
			templateOptionsList: '#{text}'
		}, jsonFrom);
	
		container.down('[id="text_area_mailPopup_fromAutoComplete"]').addClassName('SCM_mailPopup_extendAutoComplete');

		container.down('[id="mailPopup_mailBody"]').value = mailBody;	
	},
	
	/**
	 * Function in charge to indicate that there is no valid address found when trying to send an email
	 * @since 1.2
	 */
	displayInvalidEmailsPopup: function() {
		var popupContent = new Element('div');
		popupContent.insert('<div>' + global.getLabel('No_email_address_defined_in_from_or_to') + '</div>');
		
		var continueClicked = function() {
			document.fire('EWS:scm_mailPopupClosed',{mailTo: '', mailFrom: ''});
			popup.close();
			delete popup;
		};
		var cancelClicked = function() {
			popup.close();
			delete popup;
		};
		var aux1 = {
            idButton		: 'continue',
            label			: global.getLabel('Continue'),
            className		: 'moduleInfoPopUp_stdButton',
            handler			: continueClicked,
            type			: 'button',
            standardButton	: true
        };
		
		var aux2 = {
            idButton		: 'cancel',
            label			: global.getLabel('Cancel'),
            className		: 'moduleInfoPopUp_stdButton',
            handler			: cancelClicked,
            type			: 'button',
            standardButton	: true
        };        
		                  
        //insert buttons in div
        popupContent.insert(new megaButtonDisplayer({
            elements: $A([aux1, aux2]),
            mainClass: 'moduleInfoPopUp_stdButton_div_right'
        }).getButtons());
		
		var popup = new infoPopUp({
			closeButton 	: $H({'callBack': cancelClicked}),
            htmlContent 	: popupContent,
            indicatorIcon 	: 'information',                    
            width			: 600
		});
		popup.create();
	},
	
	/**
	 * Function in charge of showing the message popup when an error occurs on the screen.
	 * @param {String} message The message to be displayed in the popup.
	 * @param {String} popupIcon The icon to be used in the popup.
	 * @since 1.0
	 */
	displayMessagePopup:function(message, popupIcon){
		var container = new Element('DIV');
		container.insert(message);
		var buttonsJson = {
                    elements: [],
                    mainClass: 'moduleInfoPopUp_stdButton_div_right'
                }; 
				
		var okButtonClicked = function() {
			popupMessage.close();
            delete popupMessage;
		};               
		
		var aux2 = {
            idButton: 'ok',
            label: global.getLabel('Ok'),
            handlerContext: null,
            className: 'moduleInfoPopUp_stdButton',
            handler: okButtonClicked,
            type: 'button',
            standardButton: true
        };
		
		buttonsJson.elements.push(aux2);                   
        var ButtonObj = new megaButtonDisplayer(buttonsJson);
        var buttons = ButtonObj.getButtons();                  
        //insert buttons in div
        container.insert(buttons);

		var popupMessage = new infoPopUp({
			closeButton :   $H( {
                        'callBack': function() {
							popupMessage.close();
                            delete popupMessage;
                        }
                    }),
                    htmlContent : container,
                    indicatorIcon : popupIcon,                    
                    width: 600
		});
		popupMessage.create();
	},
	
	/**
	 * Popup to update the due date of a ticket.
	 * @param {String} dateTime The currently assigned dateTime (in HRW format) of the ticket.
	 * @since 1.0
	 * <br/>Modified for 2.2
	 * <ul>
	 * <li>Use the new datePicker</li>
	 * </ul>
	 * <br/>Modified for 2.0
	 * <ul>
	 * <li>Use the subclass of dataPicker with translations</li>
	 * </ul>
	 */
	showDueDatePopup:function(dateTime){
		//Build the main HTML to insert in the popup
		var container = new Element('DIV');
		var html = '<div class="SCM_changeTicketDueDate_dateTime"><div class="SCM_ticketPopup_inputLabel">'+global.getLabel('Date')+'</div><div id="SCM_changeTicketDueDate_date"></div></div>'+
				   '<div class="SCM_changeTicketDueDate_dateTime"><div class="SCM_ticketPopup_inputLabel">'+global.getLabel('Time')+'</div><div id="SCM_changeTicketDueDate_time"></div></div>';
		container.insert(html);
			
		//Function to handle the click on OK in the popup	
		var okButtonClicked = function() {
			var newDate = calendar.getDateAsArray();
			var newTime = time.getSapTime();
			var newDateTime = new Date(parseInt(newDate.year), parseInt(newDate.month) - 1, parseInt(newDate.day), 
										new Number(newTime.substr(0,2)), new Number(newTime.substr(2,2)), new Number(newTime.substr(4,2)));

			var returnDate = objectToDisplay(newDateTime);
			var returnTime = objectToDisplayTime(newDateTime);

			var dateHRW 	= newDateTime.toString('yyyy-MM-dd') + 'T' + newDateTime.toString('HH:mm:ss');
			var dateForDisplay = SCM_Ticket.convertDateTime(dateHRW);
			
			document.fire('EWS:scm_duedateChanged',{
				reason		: 'save'			,
				date		: returnDate		, 
				time		: returnTime		, 
				dateDisplay	: dateForDisplay	,
				dateHRW		: dateHRW
			});
			
			dueDatePopup.close();
            delete dueDatePopup;
		};
		
		//Function to handle the click on Reset in the popup
		var resetButtonClicked = function() {
			document.fire('EWS:scm_duedateResetted', {reason: 'save'});
			dueDatePopup.close();
            delete dueDatePopup;
		};
		
		//Function to handle the click on Cancel in the popup
		var cancelButtonClicked = function() {
			dueDatePopup.close();
            delete dueDatePopup;
		};
		
		//Button OK and Cancel
		var buttonsJson = {
                    elements: [{
			            idButton		: 'SCM_ticketDynDueDateOk'	,
			            label			: global.getLabel('Ok')		,
			            handlerContext	: null						,
			            className		: 'moduleInfoPopUp_stdButton',
			            handler			: okButtonClicked			,
			            type			: 'button'					,
			            standardButton	: true
			        }, {
			            idButton		: 'SCM_ticketDynDueDateReset'	,
			            label			: global.getLabel('ResetToStatic')	,
			            handlerContext	: null						,
			            className		: 'moduleInfoPopUp_stdButton',
			            handler			: resetButtonClicked		,
			            type			: 'button'					,
			            standardButton	: true
			        }, {
			            idButton		: 'SCM_ticketDynDueDateCancel'	,
			            label			: global.getLabel('Cancel')	,
			            handlerContext	: null						,
			            className		: 'moduleInfoPopUp_stdButton',
			            handler			: cancelButtonClicked		,
			            type			: 'button'					,
			            standardButton	: true
			        }],
                    mainClass: 'moduleInfoPopUp_stdButton_div_right'
                };
		                
        //Insert buttons in div
        container.insert(new megaButtonDisplayer(buttonsJson).getButtons());
		container.insert('<div class="application_clear_line"></div>');
		
		//Create the popup
		var dueDatePopup = new infoPopUp({
			closeButton 	: $H({'callBack': cancelButtonClicked}),
			htmlContent 	: container		,
			indicatorIcon 	: 'information'	,                    
			width			: 600
		});
		dueDatePopup.create();	

		//Convert the existant due date to be usable by the datePicker and the hourField
		var defaultDate = SCM_Ticket.convertDateTimeToObjects(dateTime);
		if(Object.isEmpty(defaultDate)) defaultDate = new Date();
		var currentDate = defaultDate.toString('yyyyMMdd');
		var currentTime = defaultDate.toString('HHmmss');
		
		//since 2.2 Use the new DatePicker
		var calendar = new DatePicker('SCM_changeTicketDueDate_date', {
            defaultDate			: currentDate	,
            manualDateInsertion	: false			,
			emptyDateValid		: false
        });

		// create the time picker
		var time = new HourField('SCM_changeTicketDueDate_time', {
    	    viewSecs	: (global.hourFormat.match(/s{1,2}/))?'yes':'no'	,
        	format		: (global.hourFormat.match(/[tT]{1,2}/))?'12':'24'	,
        	defaultTime	: currentTime
	    });
	},
	
	/**
	 * Popup allowing to upload a document
	 * @param {String} ticketId Id of the current ticket
	 * @param {SCM_Ticket_docDisplayer} ticket Current ticket
	 * @param {Application} parentAppli Application that call the popup
	 * @since 1.0
	 */
	showAddItemPopup:function(ticketId, ticket, parentAppli){
		var uploadStarted = false;
		
		document.observe('EWS:DocumentUploadFinish', function(event) {
			document.stopObserving('EWS:DocumentUploadFinish');

			//If the upload is cancelled, remove the popup
			if(getArgs(event).cancelled === true) {
				hrwEngine.callBackend(parentAppli, 'Ticket.RemoveAttachment', $H({
			        scAgentId  		: hrwEngine.scAgentId,
			        ticketId 		: ticketId,
					serverFileName	: getArgs(event).fileId
			    }), cancelButtonClicked.bind(this));
				
			//If the upload is a success, close the popup and send the confirmation to HRW
			} else if (getArgs(event).success === true) {
				hrwEngine.callBackend(parentAppli, 'Ticket.AddTicketItemAttachment', $H({
			        scAgentId  	: hrwEngine.scAgentId,
			        Attachment 	: 	'<Attachment>'
								+		'<TicketId>' + ticketId + '</TicketId>'
								+		'<AttachmentFilename>' + getArgs(event).fileName + '</AttachmentFilename>'
								+		'<ServerAttachmentFilename>' + getArgs(event).fileId + '</ServerAttachmentFilename>'
								+		'<PrivacySkillId>' + getArgs(event).privacy + '</PrivacySkillId>'
								+		'<DocumentType>' + getArgs(event).docType + '</DocumentType>'
								+	'</Attachment>',
					description	: ''
			    }), cancelButtonClicked.bind(this));
				
				document.fire('EWS:SCM_ListDocumentsToUpdate');
			//If the upload failed, write it on the popup
			} else {
				uploadForm.targetDiv.update(getArgs(event).text);
				ButtonObj.enable('SCM_UploadPopupOk');
				ButtonObj.disable('SCM_UploadPopupCancel');
			}
		}.bind(this));
		
		var container = new Element('DIV');
		
		container.insert('<div class="SCM_ticketPopup_title">'+global.getLabel('addItemToTicket').sub('&1', ticketId/*ticket.getValue('TICKET_ID')*/) + '</div>');
		container.insert('<div id="popupUploadFormFile">'
						+	'<div class="SCM_ticketPopup_label SCM_ticketPopup_labelAddDoc">' + global.getLabel('File') + '</div>'
						+	'<div id="popupUploadForm"> </div>'
						+'</div>');
		container.insert('<div id="popupUploadFormDocType">'
						+	'<div class="SCM_ticketPopup_label SCM_ticketPopup_labelAddDoc">' + global.getLabel('DocumentType') + '</div>'
						+	'<div id="popupUploadFormDocTypeSelect" class="SCM_ticketPopup_input"> </div>'
						+'</div>')
		
		var buttonsJson = {
                    elements: [],
                    mainClass: 'moduleInfoPopUp_stdButton_div_right'
                }; 
		
		//Function to accept the upload	
		var okButtonClicked = function() {
			//If the upload is already started, it is to close the window
			if (uploadStarted === true) cancelButtonClicked();
			
			//If the upload is not started, it is to start the upload
			else {
				uploadStarted = true;
				//Set the selected document type in the form
				if (ticket.hasDocTypes) 
					uploadForm.addParameter('I_DOC_TYPE', docTypes.getValue().idAdded);
				else 
					uploadForm.addParameter('I_DOC_TYPE', container.down('input#popupUploadFormDocTypeSelect').value);
				
				uploadForm.addParameter('I_AGENT_ID', hrwEngine.scAgentId);
				uploadForm.addParameter('I_TICKET_ID', ticket.getValue('TICKET_ID'));
				
				//Start the upload of the document
				uploadForm.uploadHandler();
				//Remove non necessary parts
				container.down('div#popupUploadFormFile .SCM_ticketPopup_labelAddDoc').remove();
				container.down('div#popupUploadFormDocType, input#popupUploadFormDocTypeSelect').remove();
				//Disable the OK  button
				ButtonObj.disable('SCM_UploadPopupOk');
			}
        };               
		
		//Fonction to cancel the upload
		var cancelButtonClicked = function(){
			if (uploadForm) {
				document.stopObserving('EWS:DocumentUploadFinish');
				uploadForm.close();
			}
			if(popupForAttachement) {
				popupForAttachement.close();
            	delete popupForAttachement;
			}
		};
		
		var aux1 = {
			idButton: 'SCM_UploadPopupCancel',
            label: global.getLabel('Cancel'),
            handlerContext: null,
            className: 'moduleInfoPopUp_stdButton',
            handler: cancelButtonClicked,
            type: 'button',
            standardButton: true
		};
		
        var aux2 = {
            idButton: 'SCM_UploadPopupOk',
            label: global.getLabel('Ok'),
            handlerContext: null,
            className: 'moduleInfoPopUp_stdButton',
            handler: okButtonClicked,
            type: 'button',
            standardButton: true
        };
		
		buttonsJson.elements.push(aux2); 
		buttonsJson.elements.push(aux1);
		                  
        var ButtonObj = new megaButtonDisplayer(buttonsJson);
        var buttons = ButtonObj.getButtons();                  
        //insert buttons in div
        container.insert(buttons);
		ButtonObj.disable('SCM_UploadPopupOk');
		document.stopObserving('EWS:SCM_uploadDocumentSelected')
		document.observe('EWS:SCM_uploadDocumentSelected', function(event) {ButtonObj.enable('SCM_UploadPopupOk');}.bindAsEventListener(this));

		var popupForAttachement = new infoPopUp({
			closeButton 	: $H({'callBack': cancelButtonClicked}),
			htmlContent 	: container,
			indicatorIcon 	: 'question',                    
			width			: 600
		});
		popupForAttachement.create();
		
		var uploadForm	= new UploadModule_SCM('popupUploadForm', global.currentApplication.appId);
				
		if (!ticket.hasDocTypes) {
			container.down('div#popupUploadFormDocType').replace('<input type="hidden" id="popupUploadFormDocTypeSelect" value="-1"/>');
		}
		else {
			var docTypes = new JSONAutocompleter('popupUploadFormDocTypeSelect', {
				showEverythingOnButtonClick: true,
				timeout: 5000,
				templateResult: '#{text}',
				templateOptionsList: '#{text}'
			}, {autocompleter: {object: ticket.getDocumentsTypes(true)}});
		}
	},
	
	/**
	 * Popup allowing to add attachements to emails
	 * @param {String} ticketId Id of the current ticket
	 * @param {Array} ticketItems List of the ticket items
	 * @param {SCM_Ticket_docDisplayer} ticket Ticket Object
	 * @param {Array} selectedItems List of Items already in the document
	 * @param {Application} parentAppli Parent application
	 * @since 1.0
	 * <br/>Modified for 2.2
	 * <ul>
	 * <li>Put the list of existent documents in a div and no more in a table</li>
	 * </ul>
	 */
	showAttachItemPopup:function(ticketId, ticketItems, ticket, selectedItems, parentAppli){
		ticketActionPopupScreens.NUM_ATTACH_ITEM ++;

		var uploadResult 	= $H();
		//Observer when upload is done
		document.observe('EWS:DocumentUploadFinish', function(event) {
			document.stopObserving('EWS:DocumentUploadFinish');
			//If the upload is cancelled, remove the popup
			if(getArgs(event).cancelled === true) {
				hrwEngine.callBackend(parentAppli, 'Ticket.RemoveAttachment', $H({
			        scAgentId  		: hrwEngine.scAgentId,
			        ticketId 		: ticketId,
					serverFileName	: getArgs(event).fileId
			    }), cancelButtonClicked.bind(this));
				
			//If the upload is a success, close the popup and send the confirmation to HRW
			} else if (getArgs(event).success === true) {
				var iconClass = SCM_Ticket.getFilenameParams(getArgs(event).fileName).docIcon;
				uploadResult.set(ticketActionPopupScreens.NUM_ATTACH_ITEM, {
					itemID					: ticketActionPopupScreens.NUM_ATTACH_ITEM,
					itemIcon				: iconClass,
					itemName 				: getArgs(event).fileName,
					AttachmentFilename		: getArgs(event).fileName,
					ServerAttachmentFilename: getArgs(event).fileId,
					PrivacySkillId			: getArgs(event).privacy,
					DocumentType			: getArgs(event).docType
				});
				uploadForm.targetDiv.update('<input type="checkbox" id="SCM_ticketPopup_attachItem_uploadedFile" checked="checked"/><div class="' + iconClass + ' SCM_ticketDocumentsIcons"></div><span>' + getArgs(event).fileName + '</span>');
				
			//If the upload failed, write it on the popup
			} else {
				uploadForm.targetDiv.update(getArgs(event).text);
			}
		}.bind(this));
		
		var container = new Element('DIV');
		
		container.insert('<div class="SCM_ticketPopup_title">'+global.getLabel('attachItem')+'</div>');
		container.insert('<div id="popupAttachLeft" class="SCM_ticketPopup_attachItem_halfContainer SCM_ticketPopup_attachItem_leftContainer">'
						+   '<div class="SCM_ticketPopup_attachItem_halfTitle">'+ global.getLabel('uploadNewElem')+'</div>'
						+	'<div class="SCM_ticketPopup_attachItem_innerLeft">'
						+ 		'<div id="SCM_ticketPopup_attachItem_FileDiv">'
						+			'<div class="SCM_ticketPopup_attachItem_fileLabel">'+ global.getLabel('File') +':</div>'
						+			'<div id="attachUploadForm"></div>'
						+		'</div>'
						+		'<div id="SCM_ticketPopup_attachItem_DocTypeDiv" class="SCM_ticketPopup_attachItem_docType">'
						+			'<div class="SCM_ticketPopup_attachItem_label">'+global.getLabel('DocumentType')+'</div><div id="attachDocType"></div>'
						+		'</div>'
						//+		'<div id="addToEmployee" class="SCM_ticketPopup_attachItem_addToEmployee"><input type="checkbox" name="checkAddToEmployeeFile">'+global.getLabel('addToEmployeeFiles')+'</input></div>'
						//since 1.1 Remove the unused div
						//+		'<div id="SCM_ticketPopup_attachItem_uploadButton"></div>'
						+	'</div>'
						+'</div>');
		container.insert('<div id="popupAttachRight" class="SCM_ticketPopup_attachItem_halfContainer">'
						+ '<div class="SCM_ticketPopup_attachItem_halfTitle">'+ global.getLabel('selectExistingElem')+'</div>'
						+ '<div id="attachDocumentList" class="SCM_ticketPopup_attachItem_docList"></div>'
						+'</div>');
		
		//since 1.1 Remove the align right statement because IE does not like it
		var buttonsJson = {
                    elements: [],
                    mainClass: 'SCM_ticketPopup_attachItem_buttonContainer'
                }; 
		
		//Function to accept the upload	
		var okButtonClicked = function() {
			var eventObject = {newItems: $H(), existingItems: $H()};
			var existingItemsToAttach = $H();
			// if existing document
			if(ticketItems != null){
				ticketItems.each(function(ticketItem){
					if(container.down('[id="attachDocItemInput_'+ticketItem.TicketItemId+'"]').checked == true){
							existingItemsToAttach.set(ticketItem.TicketItemId,{
								itemID: ticketItem.TicketItemId,
								itemName: ticketItem.AttachmentFilename,
								itemIcon: ticketItem.icon
							});
					}
				});
			}
			
			// raise event to attach the selection to the mail
			if(existingItemsToAttach.size() > 0)
			  	eventObject.existingItems = existingItemsToAttach;
				
			
			if(uploadResult.size() > 0) {
				var fileInput = container.down('input#SCM_ticketPopup_attachItem_uploadedFile');
				if(fileInput && fileInput.checked)
					eventObject.newItems = uploadResult;
				else{
					uploadResult.each(function(uploadRes) {
						hrwEngine.callBackend(parentAppli, 'Ticket.RemoveAttachment', $H({
					        scAgentId  		: hrwEngine.scAgentId,
					        ticketId 		: ticketId,
							serverFileName	: uploadRes.value.ServerAttachmentFilename
					    }), cancelButtonClicked.bind(this));
					}, this);
					
				}
			}
			
			document.fire('EWS:scm_itemsAttachedToMail', eventObject);
			
			document.stopObserving('EWS:DocumentUploadFinish');
			if(uploadForm) uploadForm.close();
			
			//if new document to upload
			popupForAttachement.close();
            delete popupForAttachement;
			
        };               
		
		//Fonction to cancel the upload
		var cancelButtonClicked = function(){
			if(uploadResult.size() > 0) {
				uploadResult.each(function(uploadRes) {
					hrwEngine.callBackend(parentAppli, 'Ticket.RemoveAttachment', $H({
				        scAgentId  		: hrwEngine.scAgentId,
				        ticketId 		: ticketId,
						serverFileName	: uploadRes.value.ServerAttachmentFilename
				    }), function() {});
				}, this);
			}
			
			document.stopObserving('EWS:DocumentUploadFinish');
			if(uploadForm) uploadForm.close();
			
			popupForAttachement.close();
            delete popupForAttachement;
		};
		
		var uploadButtonClicked = function() {
			if(ticket.hasDocTypes) uploadForm.addParameter('I_DOC_TYPE', docTypes.getValue().idAdded);
			else uploadForm.addParameter('I_DOC_TYPE', container.down('input#attachDocTypeSelect').value);
				
			uploadForm.addParameter('I_AGENT_ID'	, hrwEngine.scAgentId);
			uploadForm.addParameter('I_TICKET_ID'	, ticket.getValue('TICKET_ID'));
				
			//Start the upload of the document
			uploadForm.uploadHandler();
			
			//Remove non necessary parts
			container.down('div#SCM_ticketPopup_attachItem_FileDiv .SCM_ticketPopup_attachItem_fileLabel').remove();
			container.down('div#SCM_ticketPopup_attachItem_DocTypeDiv, input#attachDocTypeSelect').remove();
			
			//Disable the Upload  button
			ButtonObj.disable('SCM_attachPopupUpload');
		}
		
		//since 1.1 Add the align right statement
		var aux1 = {
			idButton: 'SCM_attachPopupCancel',
            label: global.getLabel('Cancel'),
            handlerContext: null,
            className: 'moduleInfoPopUp_stdButton_right',
            handler: cancelButtonClicked,
            type: 'button',
            standardButton: true
		};
		
		//since 1.1 Add the align right statement
        var aux2 = {
            idButton: 'SCM_attachPopupOk',
            label: global.getLabel('Ok'),
            handlerContext: null,
            className: 'moduleInfoPopUp_stdButton_right',
            handler: okButtonClicked,
            type: 'button',
            standardButton: true
        };
		
		var aux3 = {
			idButton: 'SCM_attachPopupUpload',
			label: global.getLabel('Upload'),
			className: 'moduleInfoPopUp_stdButton moduleInfoPopUp_stdButton_div_right',
			handler: uploadButtonClicked,
			type: 'button',
			standardButton: true
		}
		
		buttonsJson.elements.push(aux3);
		buttonsJson.elements.push(aux1);
		buttonsJson.elements.push(aux2);
		                   
        var ButtonObj = new megaButtonDisplayer(buttonsJson);
        var buttons = ButtonObj.getButtons();                  
        //insert buttons in div
        container.insert(buttons);
		container.down('div#SCM_attachPopupUpload').remove();
		container.down('div#popupAttachLeft').insert(ButtonObj.getButton('SCM_attachPopupUpload'));
		ButtonObj.disable('SCM_attachPopupUpload');
		
		document.observe('EWS:SCM_uploadDocumentSelected', function(event) {
			ButtonObj.enable('SCM_attachPopupUpload');
		}.bindAsEventListener(this));

		var popupForAttachement = new infoPopUp({
			closeButton 	: $H({'callBack': cancelButtonClicked}),
			htmlContent 	: container,
			indicatorIcon 	: 'question',                    
			width			: 700
		});
		popupForAttachement.create();
		
		if (!ticket.hasDocTypes) {
			container.down('div#SCM_ticketPopup_attachItem_DocTypeDiv').replace('<input type="hidden" id="attachDocTypeSelect" value="-1"/>');
		}
		else {
			var docTypes = new JSONAutocompleter('attachDocType', {
				showEverythingOnButtonClick: true,
				timeout: 5000,
				templateResult: '#{text}',
				templateOptionsList: '#{text}'
			}, {autocompleter: {object: ticket.getDocumentsTypes(true)}});
		}

		var uploadForm	= new UploadModule_SCM('attachUploadForm', global.currentApplication.appId);
		
		//since 2.2 Put the list of items in divs and no more in tables
		var htmlForItems = new Element('div', {'class': 'SCM_ticket_screen_FullWidth_withScrollBar'});
		if(ticketItems != null){
			ticketItems.each(function(ticketItem){
				var extension = '';
				if(ticketItem.AttachmentType === '0') extension = 'txt';		
				var lastPoint = ticketItem.AttachmentFilename.lastIndexOf('.');
        		if(lastPoint < 0) extension = '';
        		else extension = ticketItem.AttachmentFilename.substr(lastPoint + 1).toLowerCase();
				var definition;
				var docType = SCM_Ticket.docTypes.get(ticketItem.AttachmentType);
        		//If the document type is unknow => add the default icon
        		if (Object.isEmpty(docType)) {
					definition = SCM_Ticket.docTypes.get('OTHERS');
				}else {
					if (!Object.isEmpty(docType.extensions)) {
						if (Object.isEmpty(docType.extensions.get(extension))) 
							definition = docType.extensions.get('OTHERS');
						else 
							definition = docType.extensions.get(extension);
						
					}else 
						definition = docType;
				}
				ticketItem.icon = definition.iconClass;
				//since 2.2 Put the list of items in divs and no more in tables
				var tr = new Element('div', {'id': 'attachDocItem_'+ticketItem.TicketItemId});
				var toAdd = '<div class="SCM_ticketPopup_attachItem_line"><div class="SCM_ticketPopup_attachItem_existingItem"><input type="checkbox" id="attachDocItemInput_'+ticketItem.TicketItemId+'"'
				if(!Object.isUndefined(selectedItems) && selectedItems != null && !Object.isUndefined(selectedItems.get(ticketItem.TicketItemId))){
					toAdd += ' checked="X"'
				}				
				toAdd +=		'/></div>'+
								'<div class="'+definition.iconClass+' SCM_ticketDocumentsIcons SCM_ticketPopup_attachItem_existingItem"> </div>'+
								'<div class="SCM_ticketPopup_attachItem_existingItemText SCM_ticketPopup_attachItem_existingItem">'+ ticketItem.AttachmentFilename + '</div></div>';
				tr.insert(toAdd);
				tr.observe('click', function(event){
					if(this.selectedItemId != null){
						container.down('[id="attachDocItem_'+ this.selectedItemId +'"]').removeClassName('SCM_ticketAction_actionSelected');
					}
					tr.addClassName('SCM_ticketAction_actionSelected');
					this.selectedItemId = ticketItem.TicketItemId;
				}.bind(this));
				
				htmlForItems.insert(tr);
				
			}.bind(this));
		}
		container.down('[id="attachDocumentList"]').insert(htmlForItems);
	}

});
/**
 * Fake number that will be associated to a newly attached item in order to be able to display it into the ticket screen in a scm_mailAttachObject.
 * @type int
 * @see scm_mailAttachObject
 * @since 1.0
 */
ticketActionPopupScreens.NUM_ATTACH_ITEM = 900;

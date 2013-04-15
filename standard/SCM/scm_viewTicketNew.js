/**
 * Manage the display of the ticket details
 * @version 2.1
 * <br/>Modified for 2.1
 * <ul>
 * <li>Use the common way to encode/decode fields for the communication to the backend</li>
 * <li>Use the standard method to encode attributes before display</li>
 * <li>Use the standard method to remove tags</li>
 * <li>Use SCM labels to indicate the days, hours and minutes</li>
 * </ul>
 */
var scm_viewTicket = Class.create(scm_viewEditTicket,{
	
	companyGroupingSkills:null,

	ticketHasSolution:null,
	
//-------- Standard functions --------//

	intialize:function($super, args){
		$super(args);
		
		
	},

	run: function ($super, args){
		this.SCM_mode = 'view';
		this.eventListeners.reOpenPopupClosed	= this._reOpenPopupClosedEvent.bindAsEventListener(this);
        $super(args);
		if (this.doNotReset == true){
			this.doNotReset = false;
			return;
		}
		this.mainTitle = global.getLabel('Ticket_view') + ' - <i>' + this.ticketValues.ticketId +'</i>';
		this.updateTitle(this.mainTitle);
	},
	
	close: function($super){
		$super();
		if (this.doNotReset == true) 
			return;
	},
	
//-------- Screen intialize functions --------//
	_initMiddlePanel:function($super){
		$super();
		this.screenObject.setTitleMiddlePartRightForDisplay(global.getLabel('View_action'));
		this.screenObject.hideTicketButtonsForView();
//		this._initEditor();
//		this._enlargeEditors();
	},
	
	/**
	 * 
	 * @since 2.0
	 * <br/>Modified for 2.1
	 * <ul>
	 * <li>Remove the subject encoding of " and '</li>
	 * <li>Use the default method to remove the tags</li>
	 * <li>Match labels with SCM's ones</li>
	 * </ul>
	 */
	_initMiddlePanelTop:function($super){
		$super();
		//since 2.1 Use the standard method to remove the tags and remove the encoding of " and '
		var subject = HrwRequest.removeTags(this.ticketValues.ticketSubject);
		var addTitle = false;
		if (this.ticketValues.ticketSubject.length > 50){
			addTitle = true;
			subject = subject.substr(0,50) + '...';
		}
		this.screenObject.ticketSubjectSpot.value.update(subject);
		if (addTitle == true){
			//since 2.1 Use the standard method to remove the tags
			this.screenObject.ticketSubjectSpot.value.writeAttribute('title', HrwRequest.removeTags(this.ticketValues.ticketSubject));
		}
		// Service Areas
		if (this.useAreas == 'true') {
			if (!Object.isUndefined(this.ticketValues.ticketSA)) {
				var serviceArea = {
					value: this.ticketValues.ticketSA,
					trimmedValue: this.ticketValues.ticketSA
				};
				if (serviceArea.value.length > 45) {
					serviceArea.trimmedValue = serviceArea.trimmedValue.substr(0, 45) + '...';
				}
				this.screenObject.ticketSASpot.value.update(serviceArea.trimmedValue);
				this.screenObject.ticketSASpot.value.writeAttribute('title', serviceArea.value);
			} else {
				this.screenObject.ticketSASpot.value.update();
			}
		} else{
			this.screenObject.removeServiceArea();
		}
		// Service Group
		if (!Object.isUndefined(this.ticketValues.ticketSG)) {
			var serviceGroup = {
				value: this.ticketValues.ticketSG,
				trimmedValue: this.ticketValues.ticketSG
			};
			if (serviceGroup.value.length > 45) {
				serviceGroup.trimmedValue = serviceGroup.trimmedValue.substr(0, 45) + '...';
			}
			this.screenObject.ticketSGSpot.value.update(serviceGroup.trimmedValue);
			this.screenObject.ticketSGSpot.value.writeAttribute('title', serviceGroup.value)
		}else{
			this.screenObject.ticketSGSpot.value.update();
		}
		
		// Service
		if (!Object.isUndefined(this.ticketValues.ticketService)) {
			var service = {
				value: this.ticketValues.ticketService,
				trimmedValue: this.ticketValues.ticketService
			};
			if (service.value.length > 45) {
				service.trimmedValue = service.trimmedValue.substr(0, 45) + '...';
			}
			this.screenObject.ticketSSpot.value.update(service.trimmedValue);
			this.screenObject.ticketSSpot.value.writeAttribute('title', service.value);
		}else{
			this.screenObject.ticketSSpot.value.update();
		}
		// Due date

		this.screenObject.ticketDdateSpot.value.update(this.ticketValues.ticketDDate);

		if (this.ticketValues.ticketRtime == HrwEngine.NO_VALUE) {
			this.screenObject.ticketRtimeSpot.value.remove();//addClassName('SCM_ticket_screen_hidden');
			this.screenObject.ticketRtimeSpot.label.remove();//addClassName('SCM_ticket_screen_hidden');
		} else {
			// Time remaining
			var hours = parseInt(new Number(this.ticketValues.ticketRtime) / 60);
			var minutes = new Number(this.ticketValues.ticketRtime) - (60 * hours);
			var days = parseInt(hours / 24);
			hours = hours - (days * 24);
			//since 2.1 Match labels with SCM labels
			this.screenObject.ticketRtimeSpot.value.update(days + ' ' + global.getLabel('Days') + ' ' + hours + ' ' + global.getLabel('Hours') + ' ' + minutes + ' ' + global.getLabel('Minutes'));
		}
		// solved status
		if(this.enableSolvedStatus == "false"){
			this.screenObject.ticketMarkSolvedSpot.value.addClassName('SCM_ticket_screen_hidden');
		}else{
			if (this.ticketValues.ticketSolved == 'true') {
				this.screenObject.ticketMarkSolvedSpot.value.down('[id="scm_ticket_creation_markSolved_check"]').writeAttribute('checked', 'X');
				this.updateTitle(this.mainTitle + ' - ' + global.getLabel('solvedTicket'));
				
			}
		}
		this.screenObject.ticketMarkSolvedSpot.value.down('[id="scm_ticket_creation_markSolved_check"]').writeAttribute('disabled', 'X');
	},		
	
	_initMiddlePanelRight:function($super){
		$super();
		if (this.ticketHasSolution == false){
			this.screenObject.ticketDescrSolSpot.value.addClassName('SCM_ticket_screen_hidden');
			this.screenObject.solutionLink.addClassName('SCM_ticket_screen_hidden');
		}	
		if (this.ticketValues.ticketAttributes) {
			this.screenObject.initMiddlePanelRightAttributesForDisplay(this.ticketValues.ticketAttributes);
		}
		if(this.companyGroupingSkillAssigned === "-1"){
			this.screenObject.ticketCompanyGroupingSpot.value.addClassName('SCM_ticket_screen_hidden');
		}else{
			if (this.companyGroupingSkillAssigned == "-2147483648") {
				groupingText = global.getLabel('SCM_no_subject').escapeHTML();
			} else {
				var groupingText = this.companyGroupingSkillAssigned;
				this.companyGroupingSkills.each(function(grouping){
					if (grouping.Key == this.companyGroupingSkillAssigned) {
						groupingText = grouping.Value;
						return;
					}
				}.bind(this));
			}
			this.screenObject.ticketCompanyGroupingDDSpot.value.addClassName('SCM_ticketScreen_MiddlePanel_compGroupingLabel');
			this.screenObject.ticketCompanyGroupingDDSpot.value.update(groupingText);
		}
		this._initEditors();	
	},
//-------- Backend functions --------//
	_backend_loadPendingReasons:function(){
		hrwEngine.callBackend(this, 'Admin.CollectPendingReasons', $H({
			scAgentId		: hrwEngine.scAgentId,
			CompanySkillId	: this.companySkillId
		}), 'getPendingReasonsHandler');
	},
//-------- Handler functions --------//
	getTicketValuesHandler:function($super, json){
		$super(json);
		if(json.EWS.HrwResponse.HrwResult.HrwTicketForDisplay.CompanySettings.DefaultGroupingSkillId != "-2147483648"){
			this.companyGroupingSkills = objectToArray(json.EWS.HrwResponse.HrwResult.HrwTicketForDisplay.CompanySettings.GroupingSkills.KeyValue);	
			this.companyGroupingSkillAssigned = json.EWS.HrwResponse.HrwResult.HrwTicketForDisplay.HrwTicket.GroupingSkillId;
		}else{
			this.companyGroupingSkillAssigned = "-1";
		}
		
		this.ticketHasSolution = false;
		if (!Object.isEmpty(this.ticketValues.ticketSolution)) {
			if (!Object.isEmpty(this.ticketValues.ticketSolution.stripTags().gsub('\n', '').gsub('&nbsp;', ''))) {
				this.ticketHasSolution = true;
			}
		}
		this._backend_loadPendingReasons();
		this._initPanels();

	},
	
	actionPerformedHandler:function(json){
		switch(this.actionPerformed){
			case 0:
			case 8: document.fire("EWS:scm_refreshPendList");
					global.open($H({app: {appId:'TIK_PL', tabId:'PL_TIK', view:'scm_ticketApp'},
									selectedPart	: scm_ticketApp.PROPERTIES			,
									forCreation		: false								,
									forEdition		: true								,
									ticketId		: this.ticketValues.ticketId		,
									complete		: false
					}));
					break;
			default: document.fire("EWS:scm_refreshPendList");
					 global.open($H({app: {appId:'MY_PL', tabId:'PL_MY', view:'scm_myPool'}}));
					 break;
		}
	},
	
	/**
	 * 
	 * @param {Object} json
	 * @since 2.0
	 * <br/>Modifications for 2.1:
	 * <ul>
	 * <li>Use the standard encoding before sending to HRW</li>
	 * </ul>
	 */
	getTicketItemEmailPreviewHandler:function(json){
		var textToAdd = '<div style="width;95%; border-top: 1px dotted gray;"/><br/>';
		if(json.EWS.HrwResponse.HrwResult.SendEmailPreview.DefaultFromEmail){
			textToAdd += '<b>'+global.getLabel('mailfrom') + ':</b> ' + json.EWS.HrwResponse.HrwResult.SendEmailPreview.DefaultFromEmail + '<br/>';
		}
		if(json.EWS.HrwResponse.HrwResult.SendEmailPreview.MailTo){
			textToAdd += '<b>'+global.getLabel('mailto') + ':</b> ' + json.EWS.HrwResponse.HrwResult.SendEmailPreview.MailTo + '<br/>';
		}
		if(json.EWS.HrwResponse.HrwResult.SendEmailPreview.MailCc){
			textToAdd += '<b>'+global.getLabel('mailcc') + ':</b> ' + json.EWS.HrwResponse.HrwResult.SendEmailPreview.MailCc + '<br/>';
		}
		if(json.EWS.HrwResponse.HrwResult.SendEmailPreview.MailSubject){
			//since 2.1 Use the standard encoding
			textToAdd += '<b>'+global.getLabel('Subject') + ':</b> ' + HrwRequest.decode(json.EWS.HrwResponse.HrwResult.SendEmailPreview.MailSubject) + '<br/>';
		}
		
		if (json.EWS.HrwResponse.HrwResult.SendEmailPreview.Attachments) {
			textToAdd += '<b>' + global.getLabel('Attachments') + ':</b> ';
			objectToArray(json.EWS.HrwResponse.HrwResult.SendEmailPreview.Attachments.Attachment).each(function(attachment){
				textToAdd += attachment.AttachmentFilename + '; ';
			});
			textToAdd += '<br/>';
		}		
		
		textToAdd +=  '<br/><div style="width;95%; border-top: 1px dotted gray;"/>';
		if(json.EWS.HrwResponse.HrwResult.SendEmailPreview.MailBody){
			//since 2.1 Use the standard encoding
			textToAdd += HrwRequest.decode(json.EWS.HrwResponse.HrwResult.SendEmailPreview.MailBody);
		}
		textToAdd += '<hr/>'
		
		var completeText = CKEDITOR.instances.scm_ticketViewScreenEditor.getData();
		completeText = completeText.slice(0,completeText.indexOf('<img src="css/images/autocompleter/autocompleter-ajax-loader.gif" />'));
		CKEDITOR.instances.scm_ticketViewScreenEditor.setData(completeText+textToAdd);
		
	},
	
//-------- Event functions --------//
	_defineActionAndParamsEvent:function(args){
		this.actionPerformed = getArgs(args).action;
		switch (this.actionPerformed) {
			case 0: // take in processing
				args = {serviceToCall:'StartProcessingTicket'};
				this._performActionOnTicketEvent(args);
				break;
			case 1: // set to pending
				document.observe('EWS:scm_pendingPopupClosed', this.eventListeners.pendingPopupClosed);
				new ticketActionPopupScreens().showPendingPopup(this.ticketValues.ticketId, this.pendingReasons);
				break;
			case 2: // set to waiting
				document.observe('EWS:scm_waitingPopupClosed', this.eventListeners.waitingPopupClosed);
				new ticketActionPopupScreens().showWaitingPopup(this.ticketValues.ticketId);
				break;
			case 8: //reopen
				document.observe('EWS:scm_reOpenPopupClosed', this.eventListeners.reOpenPopupClosed)
				new ticketActionPopupScreens().showReOpenPopup(this.ticketValues.ticketId);
				break;
			default: alert('action performed not authorized');
					 break;
		}
	},
	
	_reOpenPopupClosedEvent:function(args){
		params = getArgs(args);
		document.stopObserving('EWS:scm_reOpenPopupClosed');
		var callArgs = {serviceToCall:'ReopenTicket', description:params.reOpenDescription};
		this._performActionOnTicketEvent(callArgs);
	},
	
	_dynCompanyInfoEvent: function(args) {
		var objectActive;
		if (this.activeEmpSearch == 'affectedEmployee' )
			objectActive = this.employeeValues.ticketAffEmployee;
		else
			objectActive = this.employeeValues.ticketRequestor;
		
		if(objectActive.dynCompInfo){
			this.screenObject.dynCompInfoSpot.update();
			this.screenObject.dynCompInfoSpot.insert(objectActive.dynCompInfo.get(getArgs(args)));
			this.employeeValues.ticketAffEmployee.defDynCompInfo = getArgs(args);
			this.employeeValues.ticketRequestor.defDynCompInfo = getArgs(args);
		} else
			new PeriodicalExecuter(function(pe) {
  				if (!objectActive.dynCompInfo) return;
				pe.stop();
				this.screenObject.dynCompInfoSpot.update();
				this.screenObject.dynCompInfoSpot.insert(objectActive.dynCompInfo.get(getArgs(args)));
				this.employeeValues.ticketAffEmployee.defDynCompInfo = getArgs(args);
				this.employeeValues.ticketRequestor.defDynCompInfo = getArgs(args);
			}.bind(this), 1);
	},
	_setClosingFlagEvent:function(args){
		if(args.memo.args.get('forEdition') == true) return;
		this.doNotReset = true;
		document.stopObserving('EWS:SCM_ticketApp_askClosing');
		document.fire('EWS:SCM_ticketApp_allowClosing');
	},
//-------- Other functions --------//
	_displayActionInEditor: function(action){
		if (action.TicketActionId == 'description') {
			this.screenObject.descriptionLinkClicked();
		}else if (action.TicketActionId == 'solution') {
			this.screenObject.solutionLinkClicked();
		}else {
			var textToDisplay = this._buildTextForEditor(action);
			//insert the text in the CKEditor		
			CKEDITOR.instances.scm_ticketViewScreenEditor.setData(textToDisplay);
			this.screenObject.viewActionLinkClicked();
		}		
	}
});
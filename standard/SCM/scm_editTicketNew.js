/**
 * Manage the display of the ticket details
 * @verision 2.2
 * <br/>Modifications for 2.2:
 * <ul>
 * <li>Use the SCM labels for remaining time display</li>
 * <li>Avoid an error when trying to display the list of services if it is empty</li>
 * <li>During the check of skill values, get the autocompleter value from the company skills or service skills list</li>
 * <li>When loading the ticket details, add the load of the list of items</li>
 * <li>In the handler of the employee name change, check if the identifier of the get event is the good one</li>
 * <li>Always select a custom action type by default</li>
 * <li>Correct the spelling of the event on clusure popup closure</li>
 * <li>Replace the label "Subject" by "Short Description"</li>
 * <li>When opening the send email interface, select always a mail FROM by default (if defined)</li>
 * <li>Stop observing the events when leaving even if the screen is not to reinitialize</li>
 * <li>Do not reload the list of tickets in processing when opening the ticket</li>
 * <li>Do not call the update of the skills when the requestor change</li>
 * </ul>
 * <br/>Modified for 2.1
 * <ul>
 * <li>Use the common way to encode/decode fields for the communication to the backend</li>
 * <li>Bug fix: When loading the list of pending reason for attached documents, repair the call</li>
 * <li>Bug fix: do not remove the paragraph tags in descriptions and solutions</li>
 * <li>If there is only one custom action, selct it by default</li>
 * <li>In the list of custom actions, add the default one</li>
 * <li>Use the standard method to encode the string before displaying it as an attribute</li>
 * </ul>
 */
var scm_editTicket = Class.create(scm_viewEditTicket,{
	
	serviceGroups:null,

	services:null,

	selectedServiceGroup:null,

	ticketActionTypes:null,

	groupingSkills:null,

	groupingSkillAssigned:null,

	companyGroupingAC:null,

	companySkills:null,

	serviceSkills:null,

	selectedService:null,

	assignedAgents:null,

	sendMailAfterClose:null,

	hrwTicketXml: null,

	hrwTicketSkillsXml: null,

	skillsWithValues:null,

	isInInitialization:null,

	errorElements:null,

	typeSelectionDropDown:null,

	typeSelection:null,

	actionTypeSelectionDropDown:null,

	showMailPopup:null,

	saveOnly: null,

	buttonAction: null,

	ticketMailPreview:null,

	mailType:null,

	mailFromAC:null,

	mailToMS:null,

	mailCCMS:null,

	currentEditorInstance:null,

	loadedEmail:null,

	selectedPreviousAction:null,

	prefillMailFields:null,

	ticketForDocument: null,

	emailTemplates: null,

	mailActionType: null,

	lastActionClicked: null,

	existingItemAttachedToMail: null,

	newItemAttachedToMail: null,

	attachmentObject: null,

	allowDDchange:null,

	firstAttachDisplay:null,

	ticketComesFromMemory:null,

	addServiceAttributes:null,	
	
	selectedServiceArea:null,
	
	serviceAreas:null,
	
	firstServicesLoad: null,
	
//-------- Standard functions --------//

	intialize:function($super, args){
		$super(args);
		
	},
	
	/**
	 * On the opening of the application
	 * @param {Object} args Opening arguments
	 * @since 2.0
	 * <br/>Modified for 2.2:
	 * <ul>
	 * <li>Do not reload the list of ticket in processing when loading the ticket</li>
	 * </ul>
	 */
	run: function ($super, args){
		this.SCM_mode = 'edit';
		this.firstServicesLoad = true;
		
		this.eventListeners.ticketServiceAreaSelected   = this._getServicesGroupsEvent.bindAsEventListener(this);
		this.eventListeners.ticketServiceGroupSelected  = this._getServicesEvent.bindAsEventListener(this);
		this.eventListeners.ticketServiceSelected		= this._getPossibleServiceAttributesEvent.bindAsEventListener(this);

		this.eventListeners.generalPoolPopupClosed		= this._getgeneralPoolInfoFromPopupEvent.bindAsEventListener(this);			
		this.eventListeners.schedulePopupClosed     	= this._getScheduleInfoFromPopupEvent.bindAsEventListener(this);
		this.eventListeners.closePopupClosed			= this._getDataFromPopupEvent.bindAsEventListener(this);
		this.eventListeners.sendToPopupClosed			= this._getSendToInfoFromPopupEvent.bindAsEventListener(this);
		this.eventListeners.copyToSendBox				= this._copyToSendBoxEvent.bindAsEventListener(this);
		this.eventListeners.cancelModification			= this._cancelModificationEvent.bindAsEventListener(this);
		this.eventListeners.saveModification			= this._saveTicketEvent.bindAsEventListener(this);
		this.eventListeners.replyToMail					= this._replyToMailEvent.bindAsEventListener(this);
		this.eventListeners.replyAllToMail				= this._replyAllToMailEvent.bindAsEventListener(this);
		this.eventListeners.forwardMail					= this._forwardMailEvent.bindAsEventListener(this);
		this.eventListeners.resendMail					= this._resendMailEvent.bindAsEventListener(this);
		this.eventListeners.mailPopupClosed				= this._mailPopupClosedEvent.bindAsEventListener(this);
		this.eventListeners.typeSelectionChanged		= this._typeSelectionChangedEvent.bindAsEventListener(this);
		this.eventListeners.ticketNoEmployeeSelected	= this._ticketNoEmployeeSelectedEvent.bindAsEventListener(this);
		this.eventListeners.ticketEmployeeSelected		= this._ticketEmployeeSelectedEvent.bindAsEventListener(this);
		this.eventListeners.showDescriptionButton		= this._showDescriptionButtonEvent.bindAsEventListener(this);
		this.eventListeners.showNewActionButton			= this._showNewActionButtonEvent.bindAsEventListener(this);
		this.eventListeners.showSolutionButton			= this._showSolutionButtonEvent.bindAsEventListener(this);
		this.eventListeners.showViewActionButton		= this._showViewActionButtonEvent.bindAsEventListener(this);
		this.eventListeners.showTemplateSelector		= this._showCustomActionTemplateSelectorEvent.bindAsEventListener(this);
		this.eventListeners.customActionTempleSelected	= this._customActionTemplateSelectedEvent.bindAsEventListener(this);
		this.eventListeners.assignNewDate				= this._assignNewDateEvent.bindAsEventListener(this);
		this.eventListeners.resetdueDateToStatic		= this._resetdueDateToStaticEvent.bindAsEventListener(this);
		this.eventListeners.employeeSearchChanged		= this._employeeSearchChangedEvent.bindAsEventListener(this);
		this.eventListeners.signatureChosen				= this._signatureChosenEvent.bindAsEventListener(this);
		this.eventListeners.mailTemplateChosen			= this._mailTemplateChosenEvent.bindAsEventListener(this);
		this.eventListeners.fromAddressChosen			= this._fromAddressChosenEvent.bindAsEventListener(this);
		this.eventListeners.showSignatures				= this._showSignaturesEvent.bindAsEventListener(this);
		this.eventListeners.showTemplates				= this._showTemplatesEvent.bindAsEventListener(this);
		this.eventListeners.addAttachment				= this._addAttachmentEvent.bindAsEventListener(this);
		this.eventListeners.attachItem					= this._attachItemEvent.bindAsEventListener(this);
		this.eventListeners.removeAttachment			= this._removeAttachmentEvent.bindAsEventListener(this);
		$super(args);
		
		document.observe('EWS:scm_ticketEdit_serviceAreaChoosen', this.eventListeners.ticketServiceAreaSelected)
		
		document.observe('EWS:scm_ticketEdit_serviceChoosen', this.eventListeners.ticketServiceSelected);
        document.observe('EWS:scm_ticketEdit_serviceGroupChoosen', this.eventListeners.ticketServiceGroupSelected);
		document.observe('EWS:scm_ticketEdit_TypeSelectionChanged',this.eventListeners.typeSelectionChanged);
		document.observe('EWS:scm_copyToSendBox', this.eventListeners.copyToSendBox);
		document.observe('EWS:scm_duedateChanged', this.eventListeners.assignNewDate);
		document.observe('EWS:scm_duedateResetted', this.eventListeners.resetdueDateToStatic);
		document.observe('EWS:scm_mailPopupClosed', this.eventListeners.mailPopupClosed);
		document.observe('EWS:scm_noEmployeeSelected', this.eventListeners.ticketNoEmployeeSelected);
		document.observe('EWS:scm_employeeSelected', this.eventListeners.ticketEmployeeSelected);
		document.observe('EWS:scm_ticketEditSave', this.eventListeners.saveModification);
		document.observe('EWS:scm_ticketEditCancelled', this.eventListeners.cancelModification);
		document.observe('EWS:scm_ticketEditReply', this.eventListeners.replyToMail);
		document.observe('EWS:scm_ticketEditReplyAll', this.eventListeners.replyAllToMail);
		document.observe('EWS:scm_ticketEditForward', this.eventListeners.forwardMail);
		document.observe('EWS:scm_ticketEditResend', this.eventListeners.resendMail);
		document.observe('EWS:scm_tiact_get_gen_pool', this.eventListeners.performActionOnTicket);
		document.observe('EWS:scm_tiact_shedule_ticket', this.eventListeners.performActionOnTicket);
		document.observe('EWS:scm_tiact_send_ticket_to', this.eventListeners.performActionOnTicket);
		document.observe('EWS:scm_tiact_duplicate_ticket', this.eventListeners.performActionOnTicket);
		document.observe('EWS:scm_tiact_add_doc_to_ticket', this.eventListeners.performActionOnTicket);
  		document.observe('EWS:scm_tiact_save_and_send', this.eventListeners.performActionOnTicket);
		document.observe('EWS:scm_description_displayed', this.eventListeners.showDescriptionButton);
		document.observe('EWS:scm_solution_displayed', this.eventListeners.showSolutionButton);
		document.observe('EWS:scm_viewAction_displayed', this.eventListeners.showViewActionButton);
		document.observe('EWS:scm_newAction_displayed', this.eventListeners.showNewActionButton);
		document.observe('EWS:scm_showTemplateSelector', this.eventListeners.showTemplateSelector);
		document.observe('EWS:scm_customActionTemplateSelected', this.eventListeners.customActionTempleSelected);
		document.observe('EWS:scm_employeeSearchChanged', this.eventListeners.employeeSearchChanged);
		document.observe('EWS:scm_signatureChosen', this.eventListeners.signatureChosen);
		document.observe('EWS:scm_mailTemplateChosen', this.eventListeners.mailTemplateChosen);
		document.observe('EWS:scm_emailFromResultSelected', this.eventListeners.fromAddressChosen);
		document.observe('EWS:scm_showSignatures',this.eventListeners.showSignatures);
		document.observe('EWS:scm_showTemplates',this.eventListeners.showTemplates);
		document.observe('EWS:scm_addAttachment', this.eventListeners.addAttachment);
		document.observe('EWS:scm_itemsAttachedToMail', this.eventListeners.attachItem);
		document.observe('EWS:scm_removeAttachment', this.eventListeners.removeAttachment);
		
		if (this.doNotReset == true){
			this.doNotReset = false;
			return;
		}
		
		this.ticketActionTypes    = $A();				
		this.prefillMailFields = '';
		this.ticketForDocument = null;
		this.existingItemAttachedToMail = $H();
		this.newItemAttachedToMail = $H();
		this.firstAttachDisplay = true;
		
		this.mainTitle = global.getLabel('Ticket_edit') + ' - <i>' + this.ticketValues.ticketId +'</i>';
		this.updateTitle(this.mainTitle);
    },		

	/**
	 * On the closure of the application
	 * @since 2.0
	 * <br/>Modified in 2.2
	 * <ul>
	 * <li>Even if the screen content is not to reset, stop observing the events</li>
	 * </ul>
	 */
	close: function($super){
		$super();

		document.stopObserving('EWS:SCM_ListDocumentsToUpdate');
		document.stopObserving('EWS:scm_ticketEdit_serviceAreaChoosen', this.eventListeners.ticketServiceAreaSelected)
		document.stopObserving('EWS:scm_ticketEdit_serviceChoosen', this.eventListeners.ticketServiceSelected);
		document.stopObserving('EWS:scm_ticketEdit_serviceGroupChoosen', this.eventListeners.ticketServiceGroupSelected);
		document.stopObserving('EWS:scm_ticketEdit_TypeSelectionChanged', this.eventListeners.typeSelectionChanged);
		document.stopObserving('EWS:scm_copyToSendBox', this.eventListeners.copyToSendBox);
		document.stopObserving('EWS:scm_duedateChanged', this.eventListeners.assignNewDate);
		document.stopObserving('EWS:scm_duedateResetted', this.eventListeners.resetdueDateToStatic);
		document.stopObserving('EWS:scm_mailPopupClosed', this.eventListeners.mailPopupClosed);
		document.stopObserving('EWS:scm_noEmployeeSelected', this.eventListeners.ticketNoEmployeeSelected);
		document.stopObserving('EWS:scm_employeeSelected', this.eventListeners.ticketEmployeeSelected);
		document.stopObserving('EWS:scm_ticketEditSave', this.eventListeners.saveModification);
		document.stopObserving('EWS:scm_ticketEditCancelled', this.eventListeners.cancelModification);
		document.stopObserving('EWS:scm_ticketEditReply', this.eventListeners.replyToMail);
		document.stopObserving('EWS:scm_ticketEditReplyAll', this.eventListeners.replyAllToMail);
		document.stopObserving('EWS:scm_ticketEditForward', this.eventListeners.forwardMail);
		document.stopObserving('EWS:scm_ticketEditResend', this.eventListeners.resendMail);
		document.stopObserving('EWS:scm_tiact_get_gen_pool', this.eventListeners.performActionOnTicket);
		document.stopObserving('EWS:scm_tiact_shedule_ticket', this.eventListeners.performActionOnTicket);
		document.stopObserving('EWS:scm_tiact_send_ticket_to', this.eventListeners.performActionOnTicket);
		document.stopObserving('EWS:scm_tiact_duplicate_ticket', this.eventListeners.performActionOnTicket);
		document.stopObserving('EWS:scm_tiact_add_doc_to_ticket', this.eventListeners.performActionOnTicket);
		document.stopObserving('EWS:scm_tiact_save_and_send', this.eventListeners.performActionOnTicket);
		document.stopObserving('EWS:scm_description_displayed', this.eventListeners.showDescriptionButton);
		document.stopObserving('EWS:scm_solution_displayed', this.eventListeners.showSolutionButton);
		document.stopObserving('EWS:scm_viewAction_displayed', this.eventListeners.showViewActionButton);
		document.stopObserving('EWS:scm_newAction_displayed', this.eventListeners.showNewActionButton);
		document.stopObserving('EWS:scm_showTemplateSelector', this.eventListeners.showTemplateSelector);
		document.stopObserving('EWS:scm_customActionTemplateSelected', this.eventListeners.customActionTempleSelected);
		document.stopObserving('EWS:scm_employeeSearchChanged', this.eventListeners.employeeSearchChanged);
		document.stopObserving('EWS:scm_signatureChosen', this.eventListeners.signatureChosen);
		document.stopObserving('EWS:scm_mailTemplateChosen', this.eventListeners.mailTemplateChosen);
		document.stopObserving('EWS:scm_emailFromResultSelected', this.eventListeners.fromAddressChosen);
		document.stopObserving('EWS:scm_showSignatures', this.eventListeners.showSignatures);
		document.stopObserving('EWS:scm_showTemplates', this.eventListeners.showTemplates);
		document.stopObserving('EWS:scm_addAttachment', this.eventListeners.addAttachment);
		document.stopObserving('EWS:scm_itemsAttachedToMail', this.eventListeners.attachItem);
	},

//-------- Screen intialize functions --------//
	initTopPanel:function($super){
		$super();
		
	},
	
	_initMiddlePanel:function($super){
		this._disableCompanyChange();
		$super();
		if (this.groupingSkillAssigned != "-1"){
			this._buildGroupingSkillsDropDown();
		}else{
			this._hideGroupingSkills()
		}
		this.isInInitialization = true;
		this.addServiceAttributes = false;
		this._backend_getPossibleCompanyAttributes();


		this._makeDueDateChangeable();
		this._hideMailFields();
	},
	
	/**
	 * Initialize the content of the panel with the main ticket information (service, short description, status, ...)
	 * @since 2.0
	 * <br/>Modified for 2.2
	 * <ul>
	 * <li>Make the remaining time div visible when it is to display</li>
	 * </ul>
	 * <br/>Modified for 2.1
	 * <ul>
	 * <li>Use a standard method before the string display in a tag attribute</li>
	 * <li>Match labels with SCM's ones</li>
	 * </ul>
	 */
	_initMiddlePanelTop:function($super){
		$super();
		//since 2.1 Use the standard method to add slashes
		this.screenObject.ticketSubjectSpot.value.update('<input type="text" class="SCM_ticketScreen_MiddlePanelTop_ticketDescription" maxlength="128" value="'+HrwRequest.displayAsAttribute(this.ticketValues.ticketSubject)+'"></input>');
		// Due date
		if(this.ticketValues.ticketDDate === null) this.screenObject.ticketDdateSpot.value.update('');
		else this.screenObject.ticketDdateSpot.value.update(this.ticketValues.ticketDDate);
		// Time remaining
		if (this.ticketValues.ticketRtime == HrwEngine.NO_VALUE) {
			this.screenObject.ticketRtimeSpot.value.addClassName('SCM_ticket_screen_hidden');
			this.screenObject.ticketRtimeSpot.label.addClassName('SCM_ticket_screen_hidden');
		} else {
			//since 2.2 Remove the class to hide him if it was added previously
			this.screenObject.ticketRtimeSpot.value.removeClassName('SCM_ticket_screen_hidden');
			this.screenObject.ticketRtimeSpot.label.removeClassName('SCM_ticket_screen_hidden');
			
			var hours = parseInt(new Number(this.ticketValues.ticketRtime) / 60);
			var minutes = new Number(this.ticketValues.ticketRtime) - (60 * hours);
			var days = parseInt(hours / 24);
			hours = hours - (days * 24);
			//since 2.1 Match labels with SCM labels
			this.screenObject.ticketRtimeSpot.value.update(days + ' ' + global.getLabel('Days') + ' ' + hours + ' ' + global.getLabel('Hours') + ' ' + minutes + ' ' + global.getLabel('Minutes'));
		}
		if (this.enableSolvedStatus == "false") {
			this.screenObject.ticketMarkSolvedSpot.value.addClassName('SCM_ticket_screen_hidden');
		} else {
			if (this.ticketValues.ticketSolved == 'true') {
				this.screenObject.ticketMarkSolvedSpot.value.down('[id="scm_ticket_creation_markSolved_check"]').checked = true;
			} else {
				this.screenObject.ticketMarkSolvedSpot.value.down('[id="scm_ticket_creation_markSolved_check"]').checked = false;
			}
		}
	},
	
	_initMiddlePanelRight:function($super){
		$super();
		this.screenObject.ticketDescrEditSpot.value.update();
		this.screenObject.ticketDescrEditSpot.value.insert('<textarea rows="13" cols="44" name="scm_ticketEditScreenEditor"></textarea>');
		this._initTypeSelection();
		this._initEditors();
		this.screenObject.hideActionType();
		this.screenObject.hideSendButton();
		
	},
	
	_initEditors:function($super){
		$super();
		this.currentEditorInstance = {
			id: 'scm_ticketViewScreenEditor',
			object: CKEDITOR.instances.scm_ticketViewScreenEditor
		};
	},
	
	_initCompanyAttributePanel:function(){
		this.screenObject.cleanMiddlePanelRightAttributesForCreate()
		this.screenObject.initMiddlePanelRightAttributesForCreate(this.companySkills);
		this.companySkills.each(function(companySkill){
			this._initAttributeDropDown(companySkill, 'C');
		}.bind(this));
	},
	
	/**
	 * Add the services attributes to the panel on the bottom right
	 * @since 2.0
	 * <br/>Modified in 2.2
	 * <ul>
	 * <li>If there is nothing in the list of services, there is nothing to do</li>
	 * </ul>
	 */
	_addServiceAttributePanel:function(){
		var skillToAdd;
		//since 2.2 If there is no service skills defined, nothing to do
		if(Object.isEmpty(this.serviceSkills)) return;
		this.serviceSkills.each(function(serviceSkill){
			if (this.companySkills.get(serviceSkill.key) == null || Object.isUndefined(this.companySkills.get(serviceSkill.key))) {
				skillToAdd = $H();
				skillToAdd.set(serviceSkill.key, serviceSkill.value);
				this.screenObject.addMiddlePanelRightAttributesForCreate(skillToAdd);
				
				this._initAttributeDropDown(serviceSkill, 'S');
			} else
				this._initAttributeDropDown(serviceSkill, 'C');
		}.bind(this));
	},
	
//-------- Backend functions --------//
	_backend_duplicateTicket:function(){
		hrwEngine.callBackend(this, 'Ticket.DuplicateTicket', $H({
			scAgentId		: hrwEngine.scAgentId,
			ticketId		: this.ticketValues.ticketId
		}), 'actionPerformedHandler' )
	},
	
	_backend_getServiceGroups:function(){
		//since 2.0 The backend function changed of name
		hrwEngine.callBackend(this, 'Admin.CollectServiceGroups', $H({
	        scAgentId           : hrwEngine.scAgentId,
			CompanySkillId		: this.companySkillId
		}), 'getServiceGroupsHandler');
	},
	
	_backend_getServices:function(serviceGroup){
		//since 2.0 The backend function changed of name
		hrwEngine.callBackend(this, 'Admin.CollectServices', $H({
				scAgentId: hrwEngine.scAgentId,
				CompanySkillId: this.companySkillId,
				serviceGroupId: serviceGroup
			}), 'getServicesHandler');
	},
	
	_backend_getPossibleCompanyAttributes:function(){
		//since 2.0 Call the unique HRW method to get the list of skills
		hrwEngine.callBackend(this, 'Admin.CollectSkillsBySkillType', $H({
				scAgentId: hrwEngine.scAgentId,
				clientSkillId: this.employeeValues.ticketAffEmployee.compId,
				employeeId: this.employeeValues.ticketAffEmployee.id,
				serviceSkillId: (Object.isEmpty(this.selectedService) || this.selectedService <= 0)? HrwEngine.NO_VALUE : this.selectedService
			}), 'getPossibleCompanyAttributesHandler');
	},
	
	_backend_getPossibleServiceAttributes:function(){
		//since 2.0 Call the unique HRW method to get the list of skills
		hrwEngine.callBackend(this, 'Admin.CollectSkillsBySkillType', $H({
				scAgentId: hrwEngine.scAgentId,
				clientSkillId: this.employeeValues.ticketAffEmployee.compId,
				employeeId: this.employeeValues.ticketAffEmployee.id,
				serviceSkillId: this.selectedService
			}), 'getPossibleServiceAttributesHandler');
	},
	
	_backend_showMailPopupBeforeClosure:function(){
		hrwEngine.callBackend(this, 'Email.GetEmailPreviewAfterClosure', $H({
			scAgentId		: hrwEngine.scAgentId,
			ticketID		: this.ticketValues.ticketId
		}),'showMailBeforeClosurePopupHandler');
	},
	
	_backend_addCustomAction:function(action){
		hrwEngine.callBackend(this, 'Ticket.AddCustomTicketAction', $H({
			scAgentId		: hrwEngine.scAgentId,
			customTicketAction: action
		}),'addCustomActionHandler');
	},
	
	_backend_getSendMailPreview:function(){
		hrwEngine.callBackend(this, 'Email.GetSendEmailPreview', $H({
			scAgentId	: hrwEngine.scAgentId,
			ticketID	: this.ticketValues.ticketId
		}), 'getSendMailPreviewHandler')
	},
	
	_backend_sendEmail:function(xmlEmail){
		hrwEngine.callBackend(this, 'Email.SendEmail', $H({
			scAgentId		: hrwEngine.scAgentId,
			ticketID		: this.ticketValues.ticketId,
			sendEmail		: xmlEmail
		}), 'emailSentHandler');
	},
	
	/**
	 * Function in charge of calling the backend HRW in order to retrieve the company service areas.<br>
	 * This function will call getServiceAreaHandler as responder.
	 * @see scm_createTicket#getServiceAreaHandler
	 * @see HrwEngine#callBackend
	 * @since 2.0 NEW
	 */
	_backend_getServiceAreas:function(){
		hrwEngine.callBackend(this, 'Admin.CollectServiceAreas', $H({
	        scAgentId           : hrwEngine.scAgentId,
			CompanySkillId		: this.companySkillId
		}), 'getServiceAreaHandler');
	},
	
	/**
	 * Function in charge of calling the backend HRW in order to retrieve the company service groups.<br>
	 * This function will call getServiceGroupsWithAreaHandler as responder.
	 * @see scm_createTicket#getServiceGroupsHandler
	 * @see HrwEngine#callBackend
	 * @since 2.0 NEW
	 */
	_backend_getServiceGroupsWithArea:function(){
		var selectedCompId;
		//since 2.0 The backend function changed of name
		hrwEngine.callBackend(this, 'Admin.CollectServiceGroupsWithServiceAreaId', $H({
	        scAgentId           : hrwEngine.scAgentId,
			CompanySkillId		: this.companySkillId,
			serviceAreaId		: this.selectedServiceArea
		}), 'getServiceGroupsHandler');
	},
	
	
//-------- Handler functions --------//
	/**
	 * Build the screen parameters from the ticket details from HRW
	 * @param {Json} json Parameters of the ticket to display
	 * @since 2.0
	 * <br/>Modified for 2.2
	 * <ul>
	 * <li>Get also the list of items</li>
	 * </ul>
	 */
	getTicketValuesHandler:function($super, json){
		$super(json);
		var pendingReasons = objectToArray(json.EWS.HrwResponse.HrwResult.HrwTicketForDisplay.CompanySettings.PendingReasons.KeyValue);
		this.pendingReasons = $A();
		pendingReasons.each(function(pendingReason){
			this.pendingReasons.push({data: pendingReason.Key, text:pendingReason.Value});
		}.bind(this));
		
		//since 1.2 Sort the pending reasons in alphabetical order
		this.pendingReasons = this.pendingReasons.sortBy(function(item) {
			return item.text;
		});
		
		//	possible agents
		var assignedAgents = $A();
		if(json.EWS.HrwResponse.HrwResult.HrwTicketForDisplay.CompanySettings.AssignAgents)
			assignedAgents = objectToArray(json.EWS.HrwResponse.HrwResult.HrwTicketForDisplay.CompanySettings.AssignAgents.KeyValue);
		this.assignedAgents = $A();
		assignedAgents.each(function(assignedAgent){
			this.assignedAgents.push({data: assignedAgent.Key, text: assignedAgent.Value});
		}.bind(this));
		if(json.EWS.HrwResponse.HrwResult.HrwTicketForDisplay.CompanySettings.DefaultGroupingSkillId != "-2147483648"){
			this.groupingSkills = objectToArray(json.EWS.HrwResponse.HrwResult.HrwTicketForDisplay.CompanySettings.GroupingSkills.KeyValue);	
			this.groupingSkillAssigned = json.EWS.HrwResponse.HrwResult.HrwTicketForDisplay.HrwTicket.GroupingSkillId;
		}else{
			this.groupingSkillAssigned = -1;
		}
		this.sendMailAfterClose = {visible: json.EWS.HrwResponse.HrwResult.HrwTicketForDisplay.CompanySettings.SendMailAfterCloseVisible,
		    					   checked: json.EWS.HrwResponse.HrwResult.HrwTicketForDisplay.CompanySettings.SendMailAfterCloseChecked };

		this.ticketActionTypes.push({data:"3", text: global.getLabel('Send_email')});
		this.ticketActionTypes.push({data:"4", text: global.getLabel('Add_tiact')});
		
		if(this.ewsnotif === true) this.ticketActionTypes.push({data:"5", text: global.getLabel('notif_employee')});
		if(this.ewsinfo  === true) this.ticketActionTypes.push({data:"6", text: global.getLabel('info_employee')});
		//if(this.ewsdocument  === true) this.ticketActionTypes.push({data:"7", text: global.getLabel('document_employee')});
		if(this.ewsapproval  === true) this.ticketActionTypes.push({data:"8", text: global.getLabel('approval_employee')});
		
		json.EWS.HrwResponse.HrwResult.HrwTicketForDisplay.CompanySettings.EnableDueDateDyn == "false"?this.allowDDchange = false:this.allowDDchange = true;
		
		this.ticketValues.ticketStaticDDate = json.EWS.HrwResponse.HrwResult.HrwTicketForDisplay.HrwTicket.DueDate;
		this.selectedServiceGroup = this.ticketValues.ticketSGId;
		this.selectedService = this.ticketValues.ticketServiceId;
		json.EWS.HrwResponse.HrwResult.HrwTicketForDisplay.CompanySettings.EnableServiceAreaLevel == "false"? this.useAreas = false:this.useAreas = true;
		
		//Items
		//since 2.2 Add the items in the ticket value
		if (json.EWS.HrwResponse.HrwResult.HrwTicketForDisplay.HrwTicket.HrwTicketItems)
			this.ticketValues.ticketItems = objectToArray(json.EWS.HrwResponse.HrwResult.HrwTicketForDisplay.HrwTicket.HrwTicketItems.HrwTicketItem);
		
		this._initPanels();
		
		if (this.useAreas == false) {
			this.screenObject.removeServiceArea();
			this._backend_getServiceGroups();
		} else {
			this._backend_getServiceAreas();
		}

	},
	
	actionPerformedHandler:function(json){
		switch(this.actionPerformed){
			case 0: global.open($H({
							app: {
							appId: 'TIK_PL',
							tabId: 'PL_TIK'	,
							view : 'scm_ticketApp'
						}, 
						selectedPart	: scm_ticketApp.PROPERTIES			,
						forCreation		: false								,
						forEdition		: true								,
						ticketId		: this.ticketValues.ticketId		,
						complete		: false
					}));
					break;
			case 6: this.duplicateTicketHandler(json)
					document.fire("EWS:scm_refreshPendList");
					 break;
			case 7: if (this.saveOnly == false) {
						if (this.showMailPopup == true) {
							this._backend_showMailPopupBeforeClosure();
							this.showMailPopup = null;
						}else{
							this.actionPerformed = 8;
							var callArgs = {
								serviceToCall: 'CloseTicket',
								mailFrom: '',
								mailTo: ''
							};
							this._performActionOnTicketEvent(callArgs);
						}
					}else{
						this._updateScreen(json);
					}
					break;
			default: document.fire("EWS:scm_refreshPendList");
					 global.open($H({app: {appId:'MY_PL', tabId:'PL_MY', view:'scm_myPool'}}));
					 break;
		}
	},	
	/**
	 * 
	 * @param {JSON Object} json Information from HRW needed to display the preview of an email send.
	 * since 2.0
	 * <br/>Modifications for 2.1:
	 * <ul>
	 * <li>Use the standard encoding before sending to HRW</li>
	 * </ul>
	 */
	getTicketItemEmailPreviewHandler:function(json){
		if(this.mailActionType == 1 || this.mailActionType == 2 || this.mailActionType == 3 || this.mailActionType == 4){
			this.mailActionType = 0;
			this.getSendMailPreviewHandler(json);
		}else{
			this.loadedEmail = 	{ from		: '',
								  to		: '',
								  cc		: '',
								  subject	: '',
								  body		: '',
								  attachments: null
								};
			var textToAdd = '<div style="width;95%; border-top: 1px dotted gray;"/><br/>';
			if(json.EWS.HrwResponse.HrwResult.SendEmailPreview.DefaultFromEmail){
				this.loadedEmail.from = json.EWS.HrwResponse.HrwResult.SendEmailPreview.DefaultFromEmail;
				textToAdd += '<b>'+global.getLabel('From') + ':</b> ' + this.loadedEmail.from + '<br/>';
			}
			if(json.EWS.HrwResponse.HrwResult.SendEmailPreview.MailTo){
				this.loadedEmail.to = json.EWS.HrwResponse.HrwResult.SendEmailPreview.MailTo;
				textToAdd += '<b>'+global.getLabel('To') + ':</b> ' + this.loadedEmail.to + '<br/>';
			}
			if(json.EWS.HrwResponse.HrwResult.SendEmailPreview.MailCc){
				this.loadedEmail.cc = json.EWS.HrwResponse.HrwResult.SendEmailPreview.MailCc;
				textToAdd += '<b>'+global.getLabel('Cc') + ':</b> ' + this.loadedEmail.cc + '<br/>';
			}
			if(json.EWS.HrwResponse.HrwResult.SendEmailPreview.MailSubject){
				//since 2.1 Use the standard encoding
				this.loadedEmail.subject = HrwRequest.decode(json.EWS.HrwResponse.HrwResult.SendEmailPreview.MailSubject);
				textToAdd += '<b>'+global.getLabel('Subject') + ':</b> ' + this.loadedEmail.subject + '<br/>';
			}
			if (json.EWS.HrwResponse.HrwResult.SendEmailPreview.Attachments) {
				this.loadedEmail.attachments = objectToArray(json.EWS.HrwResponse.HrwResult.SendEmailPreview.Attachments.Attachment);
				textToAdd += '<b>' + global.getLabel('Attachments') + ':</b> ';
				this.loadedEmail.attachments.each(function(attachment){
					textToAdd += attachment.AttachmentFilename + '; ';
				});
				textToAdd += '<br/>';
			}
			else 
				this.loadedEmail.attachments = null;
			
			textToAdd +=  '<br/><div style="width;95%; border-top: 1px dotted gray;"/>';
			if(json.EWS.HrwResponse.HrwResult.SendEmailPreview.MailBody){
				//since 2.1 Use the standard encoding
				this.loadedEmail.body = HrwRequest.decode(json.EWS.HrwResponse.HrwResult.SendEmailPreview.MailBody);
				textToAdd += this.loadedEmail.body;
			}
			textToAdd += '<hr/>';
		
			var completeText = this.currentEditorInstance.object.getData();
			completeText = completeText.slice(0,completeText.indexOf('<img src="css/images/autocompleter/autocompleter-ajax-loader.gif" />'));
			this.currentEditorInstance.object.setData(completeText+textToAdd);
	  		this.screenObject.showMailButtons(['forward', 'resend', 'reply', 'replyAll']);
		}
	},	
	
	getServiceAreaHandler:function(json){
		this.serviceAreas = $A();
		var serviceAreas = json.EWS.HrwResponse.HrwResult.ArrayOfKeyValue;
		if (!Object.isEmpty(serviceAreas)){
			serviceAreas = objectToArray(serviceAreas.KeyValue);
		}
		serviceAreas.each( function(serviceArea) {
			if (serviceArea.Key == this.ticketValues.ticketSAId) {
				this.serviceAreas.push({
					def: 'X',
					data: serviceArea.Key,
					text: serviceArea.Value
				});
			} else {
				this.serviceAreas.push({
					data: serviceArea.Key,
					text: serviceArea.Value
				})
			};
		}.bind(this));
		
		this._initServiceAreaDropDown(this.serviceAreas);
	},
	
	getServiceGroupsHandler:function(json){
		this.serviceGroups = $A();
		var serviceGroups = json.EWS.HrwResponse.HrwResult.ArrayOfKeyValue;
		if (!Object.isEmpty(serviceGroups)){
			serviceGroups = objectToArray(serviceGroups.KeyValue);
		}
		// loop at the retrieved services groups
		serviceGroups.each( function(serviceGroup) {
			if (serviceGroup.Key == this.ticketValues.ticketSGId) {
				this.serviceGroups.push({
					def : 'X',	
					data: serviceGroup.Key,
					text: serviceGroup.Value
				});
			}
			else {
				this.serviceGroups.push({
					data: serviceGroup.Key,
					text: serviceGroup.Value
				});
			}
		}.bind(this));
		
		this._initServiceGroupDropDown(this.serviceGroups);
	},	
	
	getServicesHandler:function(json){
		this.services = $A();
		var services = json.EWS.HrwResponse.HrwResult.ArrayOfKeyValue;
		if (!Object.isEmpty(services)){
			services = objectToArray(services.KeyValue);
		}
		// loop at the retrieved services
		services.each( function(service) {
			if (service.Key == this.ticketValues.ticketServiceId) {
				this.services.push({ def: 'X', data: service.Key, text: service.Value });
			} else {
				this.services.push({ data: service.Key, text: service.Value });
			}
		}.bind(this));
		this._initServiceDropDown(this.services);
	},	
	
	getPossibleCompanyAttributesHandler:function(json){
		this.companySkills = $H();
		var skills = objectToArray(json.EWS.HrwResponse.HrwResult.ArrayOfSkillType.SkillType);
		skills.each(function(skill){
			var skillDef = {
				skillId 		: skill.DefaultSkillId,
				mandatoryOpen 	: skill.MandatoryOnCreation,
				mandatoryClose	: skill.MandatoryOnClose,
				name		 	: skill.Name,
				skillTypeId		: skill.SkillTypeId,
				skillPossValues : skill.Skills,
				autoCompleter	: null
			}
			this.companySkills.set(skill.SkillTypeId, skillDef);
		}.bind(this));
		this._initCompanyAttributePanel();
		// Test if service and service group is assigned before making the backend call
		if(this.isInInitialization == true && this.ticketValues.ticketSGId != HrwEngine.NO_VALUE && this.ticketValues.ticketServiceId != HrwEngine.NO_VALUE){
			this.isInInitialization = false;
			this._backend_getPossibleServiceAttributes();
		}
		if(this.addServiceAttributes == true){
			this.addServiceAttributes = false;
			this._addServiceAttributePanel();
		}
	},
	
	getPossibleServiceAttributesHandler:function(json){
		if (!Object.isEmpty(this.serviceSkills)) {
			var servicesToRemove = $A();
			this.serviceSkills.each(function(serviceSkill){
				servicesToRemove.push(serviceSkill.value.skillTypeId);
			}.bind(this));
			this.screenObject.removeAttributesMiddleRightPanelForCreate(servicesToRemove);
		}
		this.serviceSkills = $H();
		if (!Object.isEmpty(json.EWS.HrwResponse.HrwResult.ArrayOfSkillType)){
			var skills = objectToArray(json.EWS.HrwResponse.HrwResult.ArrayOfSkillType.SkillType);
			skills.each(function(skill){
				var skillDef = {
					skillId 		: skill.DefaultSkillId,
					mandatoryOpen 	: skill.MandatoryOnCreation,
					mandatoryClose	: skill.MandatoryOnClose,
					name		 	: skill.Name,
					skillTypeId		: skill.SkillTypeId,
					skillPossValues : skill.Skills,
					autoCompleter	: null
				}
				this.serviceSkills.set(skill.SkillTypeId, skillDef);
			}.bind(this));
		}
		this._addServiceAttributePanel();
	},
	
	showMailBeforeClosurePopupHandler:function(json){
		var mailBody = json.EWS.HrwResponse.HrwResult.EmailPreview.MailBody;
		var mailFrom = objectToArray(json.EWS.HrwResponse.HrwResult.EmailPreview.MailFromData.Email);
		var mailTo   = objectToArray(json.EWS.HrwResponse.HrwResult.EmailPreview.MailToData.string); 
		new ticketActionPopupScreens().displayEmailPopup(mailBody, mailFrom, mailTo, 'Send');
	},
	
	addCustomActionHandler:function(json){
		// actions
		if (json.EWS.HrwResponse.HrwResult.HrwTicket.HrwTicketActions)
			this.ticketValues.ticketPrevActions	= objectToArray(json.EWS.HrwResponse.HrwResult.HrwTicket.HrwTicketActions.HrwTicketAction); 
		// update actions
		this.actionsList = new scm_ticketActions(this.ticketValues.ticketDescription, this.ticketValues.ticketSolution , this.ticketValues.ticketPrevActions, true, !this.screenObject.ticketActionHideTech.value.checked, false);
		this.screenObject.ticketPrevActSpot.value.update();
		this.screenObject.ticketPrevActSpot.value.insert(this.actionsList.container);//generatedHTML);
		this.actionsList.addActionHeadersListeners(this.screenObject.ticketPrevActSpot.value);
		this.actionsList.addActionsOnTicketActions();
		
		CKEDITOR.instances.scm_ticketEditScreenEditor.setData("");
	},
	
	getSendMailPreviewHandler:function(json){
		this.ticketMailPreview = { mailSubject: null, mailFrom: null, mailTo: null, mailCC:null, mailBody:null, privacySkills:null, attachments:null};
		if(json.EWS.HrwResponse.HrwResult.SendEmailPreview.MailSubject)
			this.ticketMailPreview.mailSubject = json.EWS.HrwResponse.HrwResult.SendEmailPreview.MailSubject;
		else
			this.ticketMailPreview.mailSubject
		if(json.EWS.HrwResponse.HrwResult.SendEmailPreview.MailFromData.Email)
			this.ticketMailPreview.mailFrom    	= objectToArray(json.EWS.HrwResponse.HrwResult.SendEmailPreview.MailFromData.Email);
		else
			this.ticketMailPreview.mailFrom		= $A();
		if(json.EWS.HrwResponse.HrwResult.SendEmailPreview.MailTo)
			this.ticketMailPreview.mailTo	   = objectToArray(json.EWS.HrwResponse.HrwResult.SendEmailPreview.MailTo);
		else
			this.ticketMailPreview.mailTo	   = $A();
		if(json.EWS.HrwResponse.HrwResult.SendEmailPreview.PrivacySkills)
			this.ticketMailPreview.privacySkills = objectToArray(json.EWS.HrwResponse.HrwResult.SendEmailPreview.PrivacySkills.KeyValue);
		else	
			this.ticketMailPreview.privacySkills = $A();
		if(json.EWS.HrwResponse.HrwResult.SendEmailPreview.MailCC)
			this.ticketMailPreview.mailCC	   = objectToArray(json.EWS.HrwResponse.HrwResult.SendEmailPreview.MailCC);
		else
			this.ticketMailPreview.mailCC	   = $A();
		if(json.EWS.HrwResponse.HrwResult.SendEmailPreview.MailBody)
			this.ticketMailPreview.mailBody	   = json.EWS.HrwResponse.HrwResult.SendEmailPreview.MailBody;
		else
			this.ticketMailPreview.mailBody	   = '';
		if(json.EWS.HrwResponse.HrwResult.SendEmailPreview.Attachments)
			this.ticketMailPreview.attachments = objectToArray(json.EWS.HrwResponse.HrwResult.SendEmailPreview.Attachments.Attachment);
		else
			this.ticketMailPreview.attachments = null;
			
		this._createSubjectInput();
		this._updateSubjectInput(this.ticketMailPreview.mailSubject);
		
		CKEDITOR.instances.scm_ticketEditScreenEditor.getCommand('addAttachment').enable();
		
		if(this.mailType == 1){
			this._createToInput();
			this._createCCInput();
			this._updateFromInput(this.ticketMailPreview.mailFrom, json.EWS.HrwResponse.HrwResult.SendEmailPreview.DefaultFromEmail);
			this._updateToInput(this.ticketMailPreview.mailTo);
			this._updateCCInput(this.ticketMailPreview.mailCC);
			if (this.prefillMailFields != '')this._prefillMailValues();
			else this._displayMailSignatureOption();
		}
	},
	
	duplicateTicketHandler:function(json){
		new ticketActionPopupScreens().displayMessagePopup(global.getLabel('ticket_duplicate_to')+ ' ' + json.EWS.HrwResponse.HrwResult.HrwTicket.TicketId + '.', 'information');
	},
	
	emailSentHandler:function(json){
		CKEDITOR.instances.scm_ticketEditScreenEditor.getCommand('insertSignature').disable();
		CKEDITOR.instances.scm_ticketEditScreenEditor.getCommand('insertTemplate').disable();
		CKEDITOR.instances.scm_ticketEditScreenEditor.getCommand('addAttachment').disable();
		if (json.EWS.HrwResponse.HrwResult.HrwTicket.HrwTicketActions)
			this.ticketValues.ticketPrevActions	= objectToArray(json.EWS.HrwResponse.HrwResult.HrwTicket.HrwTicketActions.HrwTicketAction);
		if (json.EWS.HrwResponse.HrwResult.HrwTicket.HrwTicketItems)
			this.ticketValues.ticketItems	= objectToArray(json.EWS.HrwResponse.HrwResult.HrwTicket.HrwTicketItems.HrwTicketItem);
		
		this.actionsList = new scm_ticketActions(this.ticketValues.ticketDescription, this.ticketValues.ticketSolution , this.ticketValues.ticketPrevActions, true, !this.screenObject.ticketActionHideTech.value.checked, false);
		this.screenObject.ticketPrevActSpot.value.update();
		this.screenObject.ticketPrevActSpot.value.insert(this.actionsList.container);
		this.actionsList.addActionHeadersListeners(this.screenObject.ticketPrevActSpot.value);
		this.actionsList.addActionsOnTicketActions();
		
		this._hideMailFields();
		this.existingItemAttachedToMail = $H();
		this.newItemAttachedToMail = $H();
		//since 1.1 problem with attachment display
		this.firstAttachDisplay = true;
		this.attachmentObject = null;
		// reset the autocompleter data to it's original value
		this.typeSelectionDropDown.clearInput();
		
		CKEDITOR.instances.scm_ticketEditScreenEditor.setData("");
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
		if(this.mailActionType == 1 || this.mailActionType == 2 || this.mailActionType == 3 || this.mailActionType == 4){
			this.mailActionType = 0;
			this.getSendMailPreviewHandler(json);
		}else{
			this.loadedEmail = 	{ from		: '',
								  to		: '',
								  cc		: '',
								  subject	: '',
								  body		: '',
								  attachments: null
								};
			var textToAdd = '<div style="width;95%; border-top: 1px dotted gray;"/><br/>';
			if(json.EWS.HrwResponse.HrwResult.SendEmailPreview.DefaultFromEmail){
				this.loadedEmail.from = json.EWS.HrwResponse.HrwResult.SendEmailPreview.DefaultFromEmail;
				textToAdd += '<b>'+global.getLabel('From') + ':</b> ' + this.loadedEmail.from + '<br/>';
			}
			if(json.EWS.HrwResponse.HrwResult.SendEmailPreview.MailTo){
				this.loadedEmail.to = json.EWS.HrwResponse.HrwResult.SendEmailPreview.MailTo;
				textToAdd += '<b>'+global.getLabel('To') + ':</b> ' + this.loadedEmail.to + '<br/>';
			}
			if(json.EWS.HrwResponse.HrwResult.SendEmailPreview.MailCc){
				this.loadedEmail.cc = json.EWS.HrwResponse.HrwResult.SendEmailPreview.MailCc;
				textToAdd += '<b>'+global.getLabel('Cc') + ':</b> ' + this.loadedEmail.cc + '<br/>';
			}
			if(json.EWS.HrwResponse.HrwResult.SendEmailPreview.MailSubject){
				//since 2.1 Use the standard encoding
				this.loadedEmail.subject = HrwRequest.decode(json.EWS.HrwResponse.HrwResult.SendEmailPreview.MailSubject);
				textToAdd += '<b>'+global.getLabel('Subject') + ':</b> ' + this.loadedEmail.subject + '<br/>';
			}
			if (json.EWS.HrwResponse.HrwResult.SendEmailPreview.Attachments) {
				this.loadedEmail.attachments = objectToArray(json.EWS.HrwResponse.HrwResult.SendEmailPreview.Attachments.Attachment);
				textToAdd += '<b>' + global.getLabel('Attachments') + ':</b> ';
				this.loadedEmail.attachments.each(function(attachment){
					textToAdd += attachment.AttachmentFilename + '; ';
				});
				textToAdd += '<br/>';
			}
			else 
				this.loadedEmail.attachments = null;
			
			textToAdd +=  '<br/><div style="width;95%; border-top: 1px dotted gray;"/>';
			if(json.EWS.HrwResponse.HrwResult.SendEmailPreview.MailBody){
				//since 2.1 Use the standard encoding
				this.loadedEmail.body = HrwRequest.decode(json.EWS.HrwResponse.HrwResult.SendEmailPreview.MailBody);
				textToAdd += this.loadedEmail.body;
			}
			textToAdd += '<hr/>';
		
			var completeText = this.currentEditorInstance.object.getData();
			completeText = completeText.slice(0,completeText.indexOf('<img src="css/images/autocompleter/autocompleter-ajax-loader.gif" />'));
			this.currentEditorInstance.object.setData(completeText+textToAdd);
	  		this.screenObject.showMailButtons(['forward', 'resend', 'reply', 'replyAll']);
		}
	},
	
	getTicketDocumentTypesHandler: function(ticketId, showPopupAddDoc, infoJson) {
		this.ticketForDocument = SCM_Ticket.factory('DisplayDocs');
		this.ticketForDocument.serviceId = this.selectedService;
        this.ticketForDocument.companyId = this.employeeValues.ticketAffEmployee.values.get('COMPANY_ID');
		this.ticketForDocument.ticketId  = ticketId;
		this.ticketForDocument.addDocumentTypes(infoJson);
		
		if(showPopupAddDoc) {
			new ticketActionPopupScreens().showAddItemPopup(ticketId, this.ticketForDocument, this);
			//Check if the list of documents is to update
			document.observe('EWS:SCM_ListDocumentsToUpdate', function() {
				document.fire('EWS:SCM_ticketApp_AddParam', {name: 'refresDocList', value: true});
				document.stopObserving('EWS:SCM_ListDocumentsToUpdate');
			}.bindAsEventListener(this));
		} else
			new ticketActionPopupScreens().showAttachItemPopup(ticketId, this.ticketValues.ticketItems, this.ticketForDocument, null, this);
	},
//-------- Event functions --------//
	_setClosingFlagEvent:function(args){
		if(args.memo.args.get('forEdition') == false) return;
		this.doNotReset = true;
		document.stopObserving('EWS:SCM_ticketApp_askClosing');
		document.fire('EWS:SCM_ticketApp_allowClosing');
	},
	
	_viewPreviousActionEvent:function($super, args){
		$super(args);
		this.lastActionClicked = getArgs(args).action;
	},
	
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
			case 3: // set to general pool
				document.observe('EWS:scm_generalPoolPopupClosed', this.eventListeners.generalPoolPopupClosed);
				new ticketActionPopupScreens().showGeneralPoolPopup(this.ticketValues.ticketId);
				break;
			case 4: // schedule ticket
				document.observe('EWS:scm_schedulePopupClosed', this.eventListeners.schedulePopupClosed );
				new ticketActionPopupScreens().showSchedulePopup(this.ticketValues.ticketId, this.pendingReasons, this.assignedAgents);
				break;
			case 5: //send ticket to --> assign ticket
				document.observe('EWS:scm_sendToPopupClosed', this.eventListeners.sendToPopupClosed);
				new ticketActionPopupScreens().showSendToPopup(this.ticketValues.ticketId, this.assignedAgents, this.groupingSkills);
				break;
			case 6: // DUPLICATE TICKET
				this._duplicateTicket();
				break;
			case 7: // Add document to ticket
				//Call HRW to get the list of document types except if there are already loaded
				if(this.ticketForDocument && this.ticketForDocument.documentsTypesLoaded()) {
					new ticketActionPopupScreens().showAddItemPopup(this.ticketValues.ticketId, this.ticketForDocument, this);
					
					//Check if the list of documents is to update
					document.observe('EWS:SCM_ListDocumentsToUpdate', function() {
						document.fire('EWS:SCM_ticketApp_AddParam', {name: 'refresDocList', value: true});
						document.stopObserving('EWS:SCM_ListDocumentsToUpdate');
					}.bindAsEventListener(this));
				} else if(this.employeeValues.ticketAffEmployee.compId >= 0 && this.selectedService >= 0)
					hrwEngine.callBackend(this, 'Ticket.CollectDocumentTypes', $H({
				        scAgentId: hrwEngine.scAgentId,
			            CompanySkillId: this.companySkillId,
			            serviceSkillId: this.selectedService
				    }), this.getTicketDocumentTypesHandler.bind(this, this.ticketValues.ticketId, true));
				else 
					this.getTicketDocumentTypesHandler(this.ticketValues.ticketId, true, null);
				break;
			case 8: // save
				this.saveOnly = true;
				this._saveTicket();
				break;
			case 9: //close
				this.saveOnly = false;
				document.observe('EWS:scm_closePopupClosed', this.eventListeners.closePopupClosed);
				new ticketActionPopupScreens().showClosePopup( this.ticketValues.ticketId, this.sendMailAfterClose.checked, this.sendMailAfterClose.visible );
				break;
		}
	},
	
	_getServicesGroupsEvent:function(memo){
		if(memo.memo.isEmpty == true) return;
		var makeCall = true;
		if(this.selectedServiceArea)
			(this.selectedServiceArea == memo.memo.idAdded)?makeCall=false:makeCall=true;
		if (makeCall === true) {
			this.selectedServiceGroup = null;
			this.selectedServiceArea = memo.memo.idAdded;
			this._backend_getServiceGroupsWithArea(this.selectedServiceArea, this.affectedCompanyId);
		}
	},
	
	_getServicesEvent:function(memo){
		if(memo.memo.isEmpty == true) return;
		var makeCall = true;
		if (this.selectedServiceGroup)
			(this.selectedServiceGroup == memo.memo.idAdded)?makeCall=false:makeCall=true;
		if (makeCall === true) {
			this.selectedService = null;
			this.selectedServiceGroup = memo.memo.idAdded;
			this._backend_getServices(this.selectedServiceGroup);
		}
	},
	
	_getPossibleServiceAttributesEvent:function(memo){
		if(memo.memo.isEmpty == true) return;
		var makeCall = true;
		if (this.selectedService)
			(this.selectedService == memo.memo.idAdded)?makeCall=false:makeCall=true;		
		if (makeCall === true) {
			this.selectedService = memo.memo.idAdded;
			document.fire('EWS:SCM_ticketApp_AddParam', {name: 'service', value: memo.memo.idAdded});
			this._backend_getPossibleServiceAttributes(this.affectedCompanyId);
		}
	},
	
	_copyToSendBoxEvent:function(args){
		this.lastActionClicked = getArgs(args).action;
		this._displayActionInSendBox(getArgs(args).action);
	},
	
	_getgeneralPoolInfoFromPopupEvent:function(args){
		params = getArgs(args);
		document.stopObserving('EWS:scm_generalPoolPopupClosed');
			var callArgs = {serviceToCall:'SendTicketToGeneralPool', description: params.generalPoolDescription}; 
			this._performActionOnTicketEvent(callArgs);
	},
	
	_getScheduleInfoFromPopupEvent:function(args){
		params = getArgs(args);
		document.stopObserving('EWS:scm_schedulePopupClosed');
		var callArgs = {serviceToCall:params.service, description: params.description, scheduleTime:params.scheduleTime , scheduleAgentId:params.scheduleAgentId , pendingReasonId:params.pendingReasonId}; 
		this._performActionOnTicketEvent(callArgs);
	},
	
	_getSendToInfoFromPopupEvent:function(args){
		params = getArgs(args);
		document.stopObserving('EWS:scm_sendToPopupClosed');
		var callArgs = {serviceToCall:params.serviceToCall, description: params.description, assignedAgentId:params.assignedAgentId};
		this._performActionOnTicketEvent(callArgs);
	},
	
	/**
	 * Event generated once the close popup is closed and indicate if the user wants to send an email or not. 
	 * @param {Object} args Arguments that indicate if an email should be sent.
	 * @since 2.0
	 * <br/>Modified for 2.2
	 * <ul>
	 * <li>Correct the event name</li>
	 * </ul>
	 */
	_getDataFromPopupEvent:function(args){
		params = getArgs(args);
		//since 2.2 Correct the event name
		document.stopObserving('EWS:scm_closePopupClosed');
		this.showMailPopup = params.withMail;
		this._saveTicket();
	},
	
	_cancelModificationEvent:function(args){
		global.open($H({app: {appId:'MY_PL', tabId:'PL_MY', view:'scm_myPool'}}));
	},
	
	/**
	 * 
	 * @param {Object} args
	 * @since 2.0
	 * <br/>Modifications for 2.1:
	 * <ul>
	 * <li>Use the standard encoding before sending to HRW</li>
	 * </ul>
	 */
	_saveTicketEvent:function(args){
		if(this.buttonAction != null){
			switch(this.buttonAction){
				case 'save':	this.saveOnly = true;
								this._saveTicket();
								break;
				case 'sendRequest':
								var emailAddressTo = '';
								var emailAddressFrom='';
								var emailAddressCC = '';
								var mailBody ='';
								var mailSubject=this.screenObject.ticketEditorSubjectHeader.value.down('[id="scm_emailHeader_subject"]').value;
								this.typeSelection==1?emailAddressTo=this.employeeValues.ticketRequestor.employeeSearch.getValues().get('EMAIL'):emailAddressTo=this.employeeValues.ticketAffEmployee.employeeSearch.getValues().get('EMAIL');
// MANAGE EMAIL SENDING																
								break;			
				case 'sendMail':
								// get the from address
								var emailAddressFrom=this.mailFromAC.getValue().idAdded;
								// get the 'to' email addresses
								var emailAddressTo = this.mailToMS.getSelection();
								// trim the ; at the end of the addresses
								emailAddressTo = this._prepareEmailAddForSending(emailAddressTo);
								// get the CC email addresses
								var emailAddressCC = this.mailCCMS.getSelection();
								// trim the ; at the end of the addresses
								emailAddressCC = this._prepareEmailAddForSending(emailAddressCC);
								// get the mail subject
								//since 2.1 Use the standard encoding
								var mailSubject= HrwRequest.encode(this.screenObject.ticketEditorSubjectHeader.value.down('[id="scm_emailHeader_subject"]').value);
								// get the mail body
								var mailBody = CKEDITOR.instances.scm_ticketEditScreenEditor.getData();
								if(Object.isEmpty(mailBody.stripTags().gsub('\n', '').gsub('&nbsp;', '').strip())){
									new ticketActionPopupScreens().displayMessagePopup(global.getLabel('noMailBody'), 'information');
									return;
								}
								//since 2.1 Use the standard encoding
								mailBody = HrwRequest.encode(mailBody);
								// create the xml version of the version to be sent to the backend
								var emailElement = this._createMailElement(emailAddressFrom, emailAddressTo, emailAddressCC, mailSubject, mailBody);											
								// call the backend to send the email
								this._backend_sendEmail(emailElement);
								break;
				case 'addAction': 
								this._addTicketAction();
								break;
			}
		}
	},
	
	_replyToMailEvent:function(args){
		this.existingItemAttachedToMail = $H();
		this.screenObject.ticketEditorAttachmentHeader.value.update();
		this.screenObject.ticketEditorAttachmentHeader.value.addClassName('SCM_ticket_screen_hidden');
		
		// set the flag for prefill values
		this.prefillMailFields = 'reply';
		this.mailActionType = 3;
		//go to the new action panel
		this.screenObject.newActionLinkClicked(false);
		// prefill the autocomplete
		this.typeSelectionDropDown.setDefaultValue('3');
	},
	
	_replyAllToMailEvent:function(args){
		this.existingItemAttachedToMail = $H();
		this.screenObject.ticketEditorAttachmentHeader.value.update();
		this.screenObject.ticketEditorAttachmentHeader.value.addClassName('SCM_ticket_screen_hidden');
		// set the flag for prefill values
		this.prefillMailFields = 'replyAll';
		this.mailActionType = 4;
		//go to the new action panel
		this.screenObject.newActionLinkClicked(false);
		// prefill the autocomplete
		this.typeSelectionDropDown.setDefaultValue('3');
	},
	
	_forwardMailEvent:function(args){
		this.existingItemAttachedToMail = $H();
		this.screenObject.ticketEditorAttachmentHeader.value.update();
		this.screenObject.ticketEditorAttachmentHeader.value.addClassName('SCM_ticket_screen_hidden');
		// set the flag for prefill values
		this.prefillMailFields = 'forward';
		this.mailActionType = 2;
		//go to the new action panel
		this.screenObject.newActionLinkClicked(false);
		// prefill the autocomplete
		this.typeSelectionDropDown.setDefaultValue('3');
	},
	
	_resendMailEvent:function(args){
		this.existingItemAttachedToMail = $H();
		this.screenObject.ticketEditorAttachmentHeader.value.update();
		this.screenObject.ticketEditorAttachmentHeader.value.addClassName('SCM_ticket_screen_hidden');
		// set the flag for prefill values
		this.prefillMailFields = 'resend';
		this.mailActionType = 1;
		//go to the new action panel
		this.screenObject.newActionLinkClicked(false);
		// prefill the autocomplete
		this.typeSelectionDropDown.setDefaultValue('3');
	},
	
	_mailPopupClosedEvent:function(args){
		var params = getArgs(args);
		var callArgs = {serviceToCall:'CloseTicket', mailFrom:params.mailFrom, mailTo:params.mailTo};
		this.actionPerformed = 8;
		this._performActionOnTicketEvent(callArgs);
	},
	
	/**
	 * React when a new type of action is selected
	 * @param {Object} args The selected type of action
	 * @since 2.0
	 * <br/>Modified for 2.2
	 * <ul>
	 * <li>When there is a node selected by default in the custom action type, it needs to know the selection type. So, update the parmeter before taking actions</li>
	 * </ul>
	 */
	_typeSelectionChangedEvent:function(args){
		//since 2.2 Assign the type selection before building the autocomplete for action types because the information could be useful to build it
		this.typeSelection = getArgs(args).idAdded;
		switch(getArgs(args).idAdded){ 
			case '3': // send email
				// hide the action type
				this.screenObject.hideActionType();
				// change button text to "send mail"
				this.screenObject.showSendButton();
				this.screenObject.editButtonLabel('Send_email');
				// set the action linked to the button
				this.buttonAction = 'sendMail';
				// set the mail type
				this.mailType = 1;
				if(this.mailActionType == 1 || this.mailActionType == 2 || this.mailActionType == 3 || this.mailActionType == 4){
					this._backend_getTicketItemEmailPreview(this.lastActionClicked.RelatedTicketItemId);
				}else{
					this._backend_getSendMailPreview();
				}
				
				break;
			case '4': // add action
				// show action type
				CKEDITOR.instances.scm_ticketEditScreenEditor.getCommand('insertSignature').disable();
				CKEDITOR.instances.scm_ticketEditScreenEditor.getCommand('insertTemplate').disable();
				CKEDITOR.instances.scm_ticketEditScreenEditor.getCommand('addAttachment').disable();
				this.screenObject.ticketEditorToHeader.value.removeClassName('SCM_ticket_screen_hidden');
				this.screenObject.ticketEditorSubjectHeader.value.addClassName('SCM_ticket_screen_hidden');
				this.screenObject.ticketEditorCCHeader.value.addClassName('SCM_ticket_screen_hidden');
				this.screenObject.ticketEditorFromHeader.value.addClassName('SCM_ticket_screen_hidden');
				this.screenObject.ticketEditorAttachmentHeader.value.addClassName('SCM_ticket_screen_hidden');
				//this.screenObject.resetHeightCenterContainers();
				this.screenObject.ticketEditorToHeader.value.update();
				this.screenObject.showActionType();
				this._initActionTypeSelection(this.ticketAction_actionsTypes);
				// change button text to "add action"
				this.screenObject.showSendButton();
				this.screenObject.editButtonLabel('Add_tiact');
				this.buttonAction = 'addAction';
				//since 1.1 problem with attachment display
				this.existingItemAttachedToMail = $H();
				this.newItemAttachedToMail = $H();
				this.firstAttachDisplay = true;
				this.attachmentObject = null;
				break;
			case '5': // add action -- EWS Notif
				// show action type
				CKEDITOR.instances.scm_ticketEditScreenEditor.getCommand('insertSignature').disable();
				CKEDITOR.instances.scm_ticketEditScreenEditor.getCommand('insertTemplate').disable();
				CKEDITOR.instances.scm_ticketEditScreenEditor.getCommand('addAttachment').disable();
				this.screenObject.ticketEditorToHeader.value.removeClassName('SCM_ticket_screen_hidden');
				this.screenObject.ticketEditorSubjectHeader.value.addClassName('SCM_ticket_screen_hidden');
				this.screenObject.ticketEditorCCHeader.value.addClassName('SCM_ticket_screen_hidden');
				this.screenObject.ticketEditorFromHeader.value.addClassName('SCM_ticket_screen_hidden');
				this.screenObject.ticketEditorAttachmentHeader.value.addClassName('SCM_ticket_screen_hidden');
				//this.screenObject.resetHeightCenterContainers();
				this.screenObject.ticketEditorToHeader.value.update();
				this.screenObject.showActionType();
				this._initActionTypeSelection(this.ticketAction_ewsNotif);
				// change button text to "add action"
				this.screenObject.showSendButton();
				this.screenObject.editButtonLabel('Add_tiact');
				this.buttonAction = 'addAction';
				//since 1.1 problem with attachment display
				this.existingItemAttachedToMail = $H();
				this.newItemAttachedToMail = $H();
				this.firstAttachDisplay = true;
				this.attachmentObject = null;
				break;
			case '6': // add action -- EWS Info
				// show action type
				CKEDITOR.instances.scm_ticketEditScreenEditor.getCommand('insertSignature').disable();
				CKEDITOR.instances.scm_ticketEditScreenEditor.getCommand('insertTemplate').disable();
				CKEDITOR.instances.scm_ticketEditScreenEditor.getCommand('addAttachment').disable();
				this.screenObject.ticketEditorToHeader.value.removeClassName('SCM_ticket_screen_hidden');
				this.screenObject.ticketEditorSubjectHeader.value.addClassName('SCM_ticket_screen_hidden');
				this.screenObject.ticketEditorCCHeader.value.addClassName('SCM_ticket_screen_hidden');
				this.screenObject.ticketEditorFromHeader.value.addClassName('SCM_ticket_screen_hidden');
				this.screenObject.ticketEditorAttachmentHeader.value.addClassName('SCM_ticket_screen_hidden');
				//this.screenObject.resetHeightCenterContainers();
				this.screenObject.ticketEditorToHeader.value.update();
				this.screenObject.showActionType();
				this._initActionTypeSelection(this.ticketAction_ewsInfo);
				// change button text to "add action"
				this.screenObject.showSendButton();
				this.screenObject.editButtonLabel('Add_tiact');
				this.buttonAction = 'addAction';
				//since 1.1 problem with attachment display
				this.existingItemAttachedToMail = $H();
				this.newItemAttachedToMail = $H();
				this.firstAttachDisplay = true;
				this.attachmentObject = null;
				break;
			case '7': // add action -- EWS document
				// show action type
				CKEDITOR.instances.scm_ticketEditScreenEditor.getCommand('insertSignature').disable();
				CKEDITOR.instances.scm_ticketEditScreenEditor.getCommand('insertTemplate').disable();
				CKEDITOR.instances.scm_ticketEditScreenEditor.getCommand('addAttachment').disable();
				this.screenObject.ticketEditorToHeader.value.removeClassName('SCM_ticket_screen_hidden');
				this.screenObject.ticketEditorSubjectHeader.value.addClassName('SCM_ticket_screen_hidden');
				this.screenObject.ticketEditorCCHeader.value.addClassName('SCM_ticket_screen_hidden');
				this.screenObject.ticketEditorFromHeader.value.addClassName('SCM_ticket_screen_hidden');
				this.screenObject.ticketEditorAttachmentHeader.value.addClassName('SCM_ticket_screen_hidden');
				//this.screenObject.resetHeightCenterContainers();
				this.screenObject.ticketEditorToHeader.value.update();
				this.screenObject.showActionType();
				this._initActionTypeSelection(this.ticketAction_ewsDocument);
				// change button text to "add action"
				this.screenObject.showSendButton();
				this.screenObject.editButtonLabel('Add_tiact');
				this.buttonAction = 'addAction';
				//since 1.1 problem with attachment display
				this.existingItemAttachedToMail = $H();
				this.newItemAttachedToMail = $H();
				this.firstAttachDisplay = true;
				this.attachmentObject = null;
				break;
			case '8': // add action -- EWS approval
				// show action type
				CKEDITOR.instances.scm_ticketEditScreenEditor.getCommand('insertSignature').disable();
				CKEDITOR.instances.scm_ticketEditScreenEditor.getCommand('insertTemplate').disable();
				CKEDITOR.instances.scm_ticketEditScreenEditor.getCommand('addAttachment').disable();
				this.screenObject.ticketEditorToHeader.value.removeClassName('SCM_ticket_screen_hidden');
				this.screenObject.ticketEditorSubjectHeader.value.addClassName('SCM_ticket_screen_hidden');
				this.screenObject.ticketEditorCCHeader.value.addClassName('SCM_ticket_screen_hidden');
				this.screenObject.ticketEditorFromHeader.value.addClassName('SCM_ticket_screen_hidden');
				this.screenObject.ticketEditorAttachmentHeader.value.addClassName('SCM_ticket_screen_hidden');
				//this.screenObject.resetHeightCenterContainers();
				this.screenObject.ticketEditorToHeader.value.update();
				this.screenObject.showActionType();
				this._initActionTypeSelection(this.ticketAction_ewsApproval);
				// change button text to "add action"
				this.screenObject.showSendButton();
				this.screenObject.editButtonLabel('Add_tiact');
				this.buttonAction = 'addAction';
				//since 1.1 problem with attachment display
				this.existingItemAttachedToMail = $H();
				this.newItemAttachedToMail = $H();
				this.firstAttachDisplay = true;
				this.attachmentObject = null;
				break;
		}
	},
	
	_showCustomActionTemplateSelectorEvent:function(args){
		this.currentCustomActionType = getArgs(args).idAdded;
		if(this.typeSelection == "4")
			CKEDITOR.instances.scm_ticketEditScreenEditor.getCommand('insertTemplate').enable();  
	},
	
	_assignNewDateEvent:function(args){
		params = getArgs(args);
		this.screenObject.ticketDdateSpot.value.update(params.dateDisplay);
		this.ticketValues.ticketDDate = params.dateDisplay;
		this.ticketValues.ticketDDateHRWFormat = params.dateHRW;
	},
	
	_showDescriptionButtonEvent:function(){
		this.screenObject.showSendButton();
		this.screenObject.editButtonLabel('save_descr');
		this.buttonAction = 'save';
		this.currentEditorInstance = {
			id: 'scm_ticketDescrScreenEditor',
			object: CKEDITOR.instances.scm_ticketDescrScreenEditor
		};
	},
	
	_showSolutionButtonEvent:function(){
		this.screenObject.showSendButton();
		this.screenObject.editButtonLabel('save_sol');
		this.buttonAction = 'save';
		this.currentEditorInstance = {
			id: 'scm_ticketSolScreenEditor',
			object: CKEDITOR.instances.scm_ticketSolScreenEditor
		};
	},
	
	_showNewActionButtonEvent:function(memo){
		if (memo.memo.fireEvent) {
			this.screenObject.hideMailButtons();
			if (this.typeSelectionDropDown.getValue()) {
				if (Object.isEmpty(this.typeSelectionDropDown.getValue().idAdded)) {
					this.screenObject.hideSendButton();
					this.buttonAction = null;
				}else {
					var argument = {
						idAdded: this.typeSelectionDropDown.getValue().idAdded
					};
					this._typeSelectionChangedEvent(argument);
				}
			}else {
				this.screenObject.hideSendButton();
				this.buttonAction = null;
			}
		}
		this.currentEditorInstance = {
			id: 'scm_ticketEditScreenEditor',
			object: CKEDITOR.instances.scm_ticketEditScreenEditor
		};
	},
	
	_showViewActionButtonEvent:function(){
		this.screenObject.hideSendButton();
		if(this.selectedPreviousAction){
			if(this.selectedPreviousAction.Type != 10)
				this.screenObject.hideMailButtons();
			else
				this.screenObject.showMailButtons(['resend', 'forward', 'reply', 'replyAll']);
		}
		this.buttonAction = null;
		this.currentEditorInstance = {
			id: 'scm_ticketViewScreenEditor',
			object: CKEDITOR.instances.scm_ticketViewScreenEditor
		};
	},
	
	_ticketNoEmployeeSelectedEvent:function(args){
		var params = getArgs(args);
		if (!Object.isEmpty(params.match('viewTicketsRequestor'))) {
			this.employeeValues.ticketRequestor.id = '';
			if(this.employeeValues.ticketRequestor.userAction) this.employeeValues.ticketRequestor.userAction.hideActionOnField();
		}else if (!Object.isEmpty(params.match('viewTicketsAffEmployee'))){
			this.employeeValues.ticketAffEmployee.id = '';
			if(this.employeeValues.ticketAffEmployee.userAction) this.employeeValues.ticketAffEmployee.userAction.hideActionOnField();
		} else return;
		
		//Close the employee history tab
		this._cleanEmployeeHistoryPanel();
		this._cleanTopRightContainer();		
	},
	
	/**
	 * Update parameters related to the employees of the ticket
	 * @param {Object} args Parameters of the new employee
	 * @since 2.0
	 * <br/>Modified for 2.2
	 * <ul>
	 * <li>Load the list of skills only when the affected employee change</li>
	 * </ul>
	 */
	_ticketEmployeeSelectedEvent:function(args){
		var params = getArgs(args);
		var currentEmployee ="";
		if (!Object.isEmpty(params.ident.match('viewTicketsRequestor'))) {
			currentEmployee = 'requestor';
			this.employeeValues.ticketRequestor.values = params.values;
			this.employeeValues.ticketRequestor.id = params.values.get('EMP_ID');
			if(this.employeeValues.ticketRequestor.userAction) {
				this.employeeValues.ticketRequestor.userAction.showActionOnField();
				this.employeeValues.ticketRequestor.userAction.updateAction(	params.values.get('EMP_ID'),
																				params.values.get('FIRST_NAME') + ' ' + params.values.get('LAST_NAME'),
																				//since 2.2 Get the company from the last result 
																				this.employeeValues.ticketRequestor.compId);
			}
			
			//Open the employee history for new user
			//since 2.2 Get the company from the last result 
			this._initEmployeeHistoryPanel(params.values.get('EMP_ID'), params.values.get('FIRST_NAME') + ' ' + params.values.get('LAST_NAME'), this.employeeValues.ticketRequestor.compId);
		}else if (!Object.isEmpty(params.ident.match('viewTicketsAffEmployee'))){
			currentEmployee = 'affectedEmployee';
			this.employeeValues.ticketAffEmployee.values = params.values;
			this.employeeValues.ticketAffEmployee.id = params.values.get('EMP_ID');
			if(this.employeeValues.ticketAffEmployee.userAction) {
				this.employeeValues.ticketAffEmployee.userAction.showActionOnField();
				this.employeeValues.ticketAffEmployee.userAction.updateAction(	params.values.get('EMP_ID'),
																				params.values.get('FIRST_NAME') + ' ' + params.values.get('LAST_NAME'),
																				//since 2.2 Get the company from the last result 
																				this.employeeValues.ticketAffEmployee.compId);
			}

			//Open the employee history for new user
			//since 2.2 Get the company from the last result 
			this._initEmployeeHistoryPanel(params.values.get('EMP_ID'), params.values.get('FIRST_NAME') + ' ' + params.values.get('LAST_NAME'), this.employeeValues.ticketAffEmployee.compId);
		
			//since 2.2 Only for the affected employee (not the requestor)
			this.addServiceAttributes = true;
			this._backend_getPossibleCompanyAttributes();
		}
		else return;
		this.screenObject.enableEditButton();
		document.fire('EWS:scm_enableSaveButton');
		
		this._updateTopRightContainer(currentEmployee);
		this._initTopPanelTitle();
	},
	
	_fromAddressChosenEvent:function(){},
	
	_showSignaturesEvent:function(event){
		var elem = this.virtualHtml.down('.cke_button_insertSignature');
		this._buildContextMenuForSignatures({srcElement:elem});
	},
	
	_showTemplatesEvent:function(event){
		var elem = this.virtualHtml.down('.cke_button_insertTemplate');
		if (this.typeSelection == 4){
			this._customActionTemplateSelectedEvent(this.currentCustomActionType)
		} else {
			this._buildContextMenuForTemplates({
				srcElement: elem
			});
		}
	},
	
	/**
	 * @since 2.0
	 * <br/>Modified for 2.1
	 * <ul>
	 * <li>Bug fix: Replace the backend parameter clientSkillId by companySkillId
	 * </ul>
	 */
	_addAttachmentEvent:function(event){
		if(this.ticketForDocument && this.ticketForDocument.documentsTypesLoaded())
			new ticketActionPopupScreens().showAttachItemPopup(this.ticketValues.ticketId, this.ticketValues.ticketItems, this.ticketForDocument, this.existingItemAttachedToMail, this);
		
		else if(this.employeeValues.ticketAffEmployee.compId >= 0 && this.selectedService >= 0)
			hrwEngine.callBackend(this, 'Ticket.CollectDocumentTypes', $H({
		       scAgentId: hrwEngine.scAgentId,
			   //since 2.1 Replace the client skill Id by the company skill id
			   companySkillId: this.companySkillId,
			   serviceSkillId: this.selectedService
		    }), this.getTicketDocumentTypesHandler.bind(this, this.ticketValues.ticketId, false));
		
		else 
			this.getTicketDocumentTypesHandler(this.ticketValues.ticketId, false, null);
	},
	
	_customActionTemplateSelectedEvent:function(template){
		var selectedTemplate ='';
		this.ticketAction_actionsTypes.each(function(actionType){
			if(actionType.data == template){
				selectedTemplate = actionType.value;
			}
		});
		CKEDITOR.instances.scm_ticketEditScreenEditor.setData(selectedTemplate);	
	},
	
	_mailTemplateChosenEvent:function(event){
		var enteredData = this.currentEditorInstance.object.getData();
		var enteredSignature = '';
		var oldEmail = '';
		// remove the <p> and </p> added by CKEDITOR
		enteredData = enteredData.gsub('<p>', '');
		enteredData = enteredData.gsub('</p>', '');
		// extract signature if any
		if (enteredData.indexOf('<div id="HRWEMAILSIGNATURE">') != -1) {
			if (enteredData.indexOf('<div id="HRWEMAILOLD">') != -1) {
				enteredSignature = enteredData.substring(enteredData.indexOf('<div id="HRWEMAILSIGNATURE">'), enteredData.indexOf('<div id="HRWEMAILOLD">'));
				oldEmail = enteredData.substring(enteredData.indexOf('<div id="HRWEMAILOLD">'),  enteredData.length);
			}else{
				enteredSignature = enteredData.substring(enteredData.indexOf('<div id="HRWEMAILSIGNATURE">'), enteredData.length);
			}
			enteredData      = enteredData.substring(0, enteredData.indexOf('<div id="HRWEMAILSIGNATURE">'));
		}	
		// if the recognition tags are not present, add them
		if(!enteredData.startsWith('<div id="HRWEMAILBODY">')){
			enteredData = '<div id="HRWEMAILBODY"><div>' + enteredData + '</div></div>';
		}
		//replace the text with the template
		CKEDITOR.instances.scm_ticketEditScreenEditor.setData('<div id="HRWEMAILBODY"><div>' + event.memo.mailTemplate + '</div></div>' + enteredSignature + oldEmail);
	},
	
	_signatureChosenEvent:function(event){
		var enteredData = this.currentEditorInstance.object.getData();
		var enteredSignature = '';
		var oldEmail = '';
		// remove the <p> and </p> added by CKEDITOR
		enteredData = enteredData.gsub('<p>', '');
		enteredData = enteredData.gsub('</p>', '');
		
		// extract signature if any
		if (enteredData.indexOf('<div id="HRWEMAILSIGNATURE">') != -1) {
			if (enteredData.indexOf('<div id="HRWEMAILOLD">') != -1) {
				enteredSignature = enteredData.substring(enteredData.indexOf('<div id="HRWEMAILSIGNATURE">'), enteredData.indexOf('<div id="HRWEMAILOLD">'));
				oldEmail = enteredData.substring(enteredData.indexOf('<div id="HRWEMAILOLD">'),  enteredData.length);
			}else{
				enteredSignature = enteredData.substring(enteredData.indexOf('<div id="HRWEMAILSIGNATURE">'), enteredData.length);
			}
			enteredData      = enteredData.substring(0, enteredData.indexOf('<div id="HRWEMAILSIGNATURE">'));
		}
		// if the recognition tags are not present, add them
		if(!enteredData.startsWith('<div id="HRWEMAILBODY">')){
			enteredData = '<div id="HRWEMAILBODY"><div>' + enteredData + '</div></div>';
		}
				
		CKEDITOR.instances.scm_ticketEditScreenEditor.setData(enteredData + '<div id="HRWEMAILSIGNATURE"><div><br/>' + event.memo.signature + '</div></div>' + oldEmail);
	},
	
	_showDueDatePopupEvent:function(event){
		new ticketActionPopupScreens().showDueDatePopup(this.ticketValues.ticketDDate);
	},
	
	_resetdueDateToStaticEvent: function(args) {
		this.ticketValues.ticketDDate = this.ticketValues.ticketStaticDDate;
		this.screenObject.ticketDdateSpot.value.update(SCM_Ticket.convertDateTime(this.ticketValues.ticketDDate));
	},
	
	_dynCompanyInfoEvent: function(args) {
		var objectActive;
		if (this.activeEmpSearch == 'affectedEmployee' )
			objectActive = this.employeeValues.ticketAffEmployee;
		else
			objectActive = this.employeeValues.ticketRequestor;
			
		if(objectActive.dynCompInfo) {
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
	
	/**
	 * Disable the save button if the employee change
	 * @param {Object} args Arguments of teh generated event
	 * @since 2.0
	 * <br/>Modified for 2.2
	 * <ul>
	 * <li>Check that id of the generated event is correct</li>
	 * </ul>
	 */
	_employeeSearchChangedEvent:function(args){
		//since 2.2 Do the action only if the identifier is correct
		if(getArgs(args) !== 'viewTicketsRequestor' && getArgs(args) !== 'viewTicketsAffEmployee') return;
		this.screenObject.disableEditButton();
		document.fire('EWS:scm_disableSaveButton');
	},
	
	_attachItemEvent:function(event){
		this.existingItemAttachedToMail = event.memo.existingItems;
		this.newItemAttachedToMail 		= this.newItemAttachedToMail.merge(event.memo.newItems);
		
		if (this.firstAttachDisplay == true) {
			this._createAttachmentDisplay();
			this.firstAttachDisplay = false;
		}
		// merge of the new and existing one and add in the object
		var attach = this.existingItemAttachedToMail.merge(this.newItemAttachedToMail);
		this._updateAttachmentDisplay(attach);
	},
	
	_removeAttachmentEvent:function(args){
		this.existingItemAttachedToMail.unset(args.memo.attachId);
		
		if(!Object.isUndefined(this.newItemAttachedToMail.unset(args.memo.attachId))) {
			hrwEngine.callBackend(this, 'Ticket.RemoveAttachment', $H({
		        scAgentId  		: hrwEngine.scAgentId,
		        ticketId 		: this.ticketValues.ticketId,
				serverFileName	: args.memo.fileId
		    }), function() {});
		}
	},
//-------- Other functions --------//
	/**
	 * @since 2.0
	 * <br/>Modified for 2.1
	 * <ul>
	 * <li>Reset some global varaibles</li>
	 * </ul>
	 */
	resetData:function($super){
		$super();
		
		this._unsetElementsOnError();
		this.errorElements = $A();
		
		//since 2.1 Reset the global variables
		this.selectedServiceGroup	= null;
		this.selectedService		= null;
		this.selectedServiceArea	= null;
		
		if(CKEDITOR.instances.scm_ticketEditScreenEditor){
			CKEDITOR.remove(CKEDITOR.instances.scm_ticketEditScreenEditor);
		}
		if(!Object.isEmpty(this.companySkills))this.companySkills = null;
		if(!Object.isEmpty(this.serviceSkills))this.serviceSkills = null;
	},
	
	_displayActionInEditor: function(action){
		this.selectedPreviousAction = action;
		if (action.TicketActionId == 'description') {
			this.screenObject.descriptionLinkClicked();
		}
		else if (action.TicketActionId == 'solution') {
			this.screenObject.solutionLinkClicked();
		}
		else {
			var textToDisplay = this._buildTextForEditor(action, true);
			//insert the text in the CKEditor		
			CKEDITOR.instances.scm_ticketViewScreenEditor.setData(textToDisplay);
			this.currentEditorInstance = {
				id: 'scm_ticketViewScreenEditor',
				object: CKEDITOR.instances.scm_ticketViewScreenEditor
			};
			this.screenObject.viewActionLinkClicked();
		}		
	},
	
	_displayActionInSendBox:function(action){
		var textToDisplay = '';
		if (action.TicketActionId == 'description') {
			textToDisplay += '<b>'+global.getLabel('DESCR')+':</b><br/>';
			textToDisplay += this.ticketValues.ticketDescription;
			textToDisplay += '<hr/>';
		}else if (action.TicketActionId == 'solution') {
			textToDisplay += '<b>'+global.getLabel('Solution')+':</b><br/>';
			textToDisplay += this.ticketValues.ticketSolution;
			textToDisplay += '<hr/>';
		}else {
			textToDisplay = this._buildTextForEditor(action, false);
		}
				
		if(this.currentEditorInstance.id == 'scm_ticketViewScreenEditor'){
			this.currentEditorInstance = {
				id: 'scm_ticketEditScreenEditor',
				object: CKEDITOR.instances.scm_ticketEditScreenEditor
			};
			this.screenObject.newActionLinkClicked(true);
		}
		this.currentEditorInstance.object.setData(this.currentEditorInstance.object.getData()+textToDisplay);
	},
	
	/**
	 * 
	 * @param {Object} listOfServiceAreas
	 * NEW
	 */
	_initServiceAreaDropDown:function(listOfServiceAreas){
		this.screenObject.ticketSASpot.value.update();
		var json = {autocompleter:{
						object: listOfServiceAreas,
						multilanguage:{
							no_results:'No results found',
							search:'Search'}
						}
					}
		autocompleter = new JSONAutocompleter(this.screenObject.ticketSASpot.id, {
			events: $H({onResultSelected: 'EWS:scm_ticketEdit_serviceAreaChoosen'}),
			showEverythingOnButtonClick: true,
			timeout: 5000,
			templateResult: '#{text}',
			templateOptionsList: '#{text}'
		}, json);
		
		this._backend_getServiceGroups(this.ticketValues.ticketSAId);
		this.screenObject.enlargeServiceAreasAutocompleter();
	},
	
	_initServiceGroupDropDown:function(listOfServiceGroups){
		this.screenObject.ticketSSpot.value.update();
		this.screenObject.ticketSSpot.value.addClassName('SCM_ticketScreen_text_disabled');
		this.screenObject.ticketSSpot.value.insert(global.getLabel('Choose_service_group_first'));
		this.screenObject.ticketSGSpot.value.removeClassName('SCM_ticketScreen_text_disabled');
		this.screenObject.ticketSGSpot.value.update();
		var json = {autocompleter:{
						object: listOfServiceGroups,
						multilanguage:{
							no_results:'No results found',
							search:'Search'}
						}
					}
		autocompleter = new JSONAutocompleter(this.screenObject.ticketSGSpot.id, {
			events: $H({onResultSelected: 'EWS:scm_ticketEdit_serviceGroupChoosen'}),
			showEverythingOnButtonClick: true,
			timeout: 5000,
			templateResult: '#{text}',
			templateOptionsList: '#{text}' 
		}, json);
		if(this.firstServicesLoad){
			this.firstServicesLoad = false;
			this._backend_getServices(this.ticketValues.ticketSGId);	
		}
		
		this.screenObject.enlargeServiceGroupsAutocompleter();
	},
	
	_initServiceDropDown:function(listOfServices){
		this.screenObject.ticketSSpot.value.removeClassName('SCM_ticketScreen_text_disabled');
		this.screenObject.ticketSSpot.value.update('');
		var json = {autocompleter:{
						object : listOfServices,
						multilanguage:{
							no_results:'No results found',
							search:'Search'}
						}
					}
		autocompleter = new JSONAutocompleter(this.screenObject.ticketSSpot.id, {
			events: $H({onResultSelected: 'EWS:scm_ticketEdit_serviceChoosen'}),
			showEverythingOnButtonClick: true,
			timeout: 5000,
			templateResult: '#{text}',
			templateOptionsList: '#{text}' 
		}, json);
		this.screenObject.enlargeServicesAutocompleter();
	},	
	
	_disableCompanyChange:function(){
		this.employeeValues.ticketAffEmployee.employeeSearch.disableCompanySelection();
		if(this.enableRequestor === 'true')
			this.employeeValues.ticketRequestor.employeeSearch.disableCompanySelection();
	},
	
	_makeDueDateChangeable:function(){
		var dynDueDateAllowed = this.allowDDchange;
		if(dynDueDateAllowed === false) return; 
		this.screenObject.ticketDdateSpot.label.addClassName('application_action_link');
		this.screenObject.ticketDdateSpot.label.stopObserving('click');
		this.screenObject.ticketDdateSpot.label.observe('click', this._showDueDatePopupEvent.bindAsEventListener(this));
	},
	
	_getValueForSkillFromTicket:function(skill){
		var skillId = '-1';
		this.ticketValues.ticketAttributes.each(function(tAttribute){
			if (tAttribute.SkillTypeId == skill.value.skillTypeId){
				skillId = tAttribute.SkillId;
				return;
			}
		});
		return skillId;
	},
	
	_initAttributeDropDown:function(skill, skillType){
		var spotId = 'ticketAtt_'+ skillType + '_' + skill.value.skillTypeId;
		this.screenObject.ticketAttrSpot.value.down('div#' + spotId).update();
		var skillPossValues = objectToArray(skill.value.skillPossValues.KeyValue);
		if (skillPossValues.size() == 1 && skillPossValues[0].Key == skill.value.skillId) {
			this.screenObject.ticketAttrSpot.value.down('[id="' + spotId + '"]').insert(skillPossValues[0].Value);
		}
		else {
			var values = $A();
			var skillValueFromTicket = this._getValueForSkillFromTicket(skill);
			skillPossValues.each(function(skillValues){
				if (skillValues.Key == skillValueFromTicket) {
					values.push({
						def: 'X',
						data: skillValues.Key,
						text: skillValues.Value
					});
				}
				else {
					values.push({
						data: skillValues.Key,
						text: skillValues.Value
					});
				}
			}.bind(this));
			var json = {
				autocompleter: {
					object: values,
					multilanguage: {
						no_results: 'No results found',
						search: 'Search'
					}
				}
			}
			skill.value.autoCompleter = new JSONAutocompleter(spotId, {
				showEverythingOnButtonClick: true,
				timeout: 5000,
				templateResult: '#{text}',
				templateOptionsList: '#{text}'
			}, json);
		}
	},
	
	_initTypeSelection:function(){
		this.screenObject.ticketToSelectionEditSpot.value.update();
		var json = {autocompleter:{
						object: this.ticketActionTypes,
						multilanguage:{
							no_results:'No results found',
							search:'Search'}
						}
					}
		this.typeSelectionDropDown = new JSONAutocompleter(this.screenObject.ticketToSelectionEditSpot.id, {
			events: $H({onResultSelected: 'EWS:scm_ticketEdit_TypeSelectionChanged'}),
			showEverythingOnButtonClick: true,
			timeout: 5000,
			templateResult: '#{text}',
			templateOptionsList: '#{text}' 
		}, json);
	},
	
	/**
	 * Build the autocompleter with the list of action subtypes
	 * @since 2.0
	 * <br/>Modified for 2.2
	 * <ul>
	 * <li>Select always an action by default</li>
	 * </ul>
	 * <br/>Modified for 2.1
	 * <ul>
	 * <li>Add a default action for non inbox actions</li>
	 * <li>Select the action if there is only one</li>
	 * </ul>
	 */
	_initActionTypeSelection:function(arrayOfActions){
		//since 2.1 Add the default action to the list
		if((arrayOfActions.size() > 0 
			&& 	arrayOfActions[0].type !== 'I' 
			&& 	arrayOfActions[0].type !== 'M'  
			&& 	arrayOfActions[0].type !== 'D'
			&& 	arrayOfActions[0].type !== 'V'
			&& !(arrayOfActions.find(function(item) {return (item.data === HrwEngine.NO_VALUE)})))
		||  arrayOfActions.size() === 0) {
			arrayOfActions.push({
				data	: HrwEngine.NO_VALUE,
				text	: global.getLabel('NoCustomAction'),
				value	: global.getLabel('NoCustomAction'),
				type	: null
			});
		}

		this.screenObject.ticketTypeSelectionEditSpot.value.update();
		var json = {autocompleter:{
						object: arrayOfActions,
						multilanguage:{
							no_results:'No results found',
							search:'Search'}
						}
					};
		this.actionTypeSelectionDropDown = new JSONAutocompleter(this.screenObject.ticketTypeSelectionEditSpot.id, {
			events: $H({onResultSelected: 'EWS:scm_showTemplateSelector'}),
			showEverythingOnButtonClick: true,
			timeout: 5000,
			templateResult: '#{text}',
			templateOptionsList: '#{text}'
		}, json);
		
		//since 2.2 Select always the first action or the "NoCustomAction"
		if(arrayOfActions.size() > 0){
			var noValue = arrayOfActions.find(function(item) {return (item.data === HrwEngine.NO_VALUE)});
			var defValue;
			
			if(Object.isEmpty(noValue))
				defValue = arrayOfActions[0].data;
			else
				defValue = noValue.data;
			
			this.actionTypeSelectionDropDown.setDefaultValue(defValue, false, true);
		}
	},
	
	_loadPendingReasons:function(){
		var pendingReasons;
		hrwEngine.companies.each(function(company){
			if (company.Key == this.employeeValues.ticketAffEmployee.compId){
				pendingReasons = company.PendingReasons;
				return;
			}
		}.bind(this));
		this.pendingReasons = $A();
		pendingReasons.each(function(pendingReason){
			this.pendingReasons.push({data: pendingReason.Key, text:pendingReason.Value});
		}.bind(this));
		
		//since 1.2 Sort the pending reasons in alphabetical order
		this.pendingReasons = this.pendingReasons.sortBy(function(item) {
			return item.text;
		});
	},
	
	_buildGroupingSkillsDropDown:function(){
		this.screenObject.ticketCompanyGroupingSpot.value.removeClassName('SCM_ticket_screen_hidden')
		var dropdown = $A();
		this.groupingSkills.each(function(groupingSkill){
			if(groupingSkill.Key == this.groupingSkillAssigned){
				dropdown.push({data:groupingSkill.Key, text:groupingSkill.Value, def:'X'});
			}else{
				dropdown.push({data:groupingSkill.Key, text:groupingSkill.Value});	
			}
		}.bind(this));
		this.screenObject.ticketCompanyGroupingDDSpot.value.update();
		var json = {autocompleter:{
						object: dropdown,
						multilanguage:{
							no_results:'No results found',
							search:'Search'}
						}
					}
		this.companyGroupingAC = new JSONAutocompleter(this.screenObject.ticketCompanyGroupingDDSpot.id, {
			showEverythingOnButtonClick: true,
			timeout: 5000,
			templateResult: '#{text}',
			templateOptionsList: '#{text}'
		}, json);
	},
	
	_hideGroupingSkills:function(){
		this.screenObject.ticketCompanyGroupingSpot.value.addClassName('SCM_ticket_screen_hidden')
	},
	
	/**
	 * Check if all the mandatory fields are filled
	 * @sinec 2.0
	 * <br/>Modified in 2.2
	 * <ul>
	 * <li>Get the skill values in the same way as in the ticket creation</li>
	 * </ul> 
	 */
	_checkValidity:function(){
		var validityFlag = true;
		var errorEntries = $A();
		this.skillsWithValues = $A();

		// Affected employee ID
		if(this.employeeValues.ticketAffEmployee.employeeSearch.getValues('EMP_ID') === null || Object.isEmpty(this.employeeValues.ticketAffEmployee.employeeSearch.getValues('EMP_ID'))){
			errorEntries.push({element:'affectedEmployee employeeSearch'});
			validityFlag = false;
		}
		// Subject
		if(Object.isEmpty(this.screenObject.ticketSubjectSpot.value.down().value)){
			errorEntries.push({element:'subject'});
			validityFlag = false;
		}
		// Service
		//since 1.2 Check that the service is a positive number
		if(Object.isEmpty(this.selectedService) || this.selectedService < 0){
			errorEntries.push({element:'service'});
			validityFlag = false;
		}
		// Description
		var editor_data = CKEDITOR.instances.scm_ticketDescrScreenEditor.getData();
		if(Object.isEmpty(editor_data)){
			errorEntries.push({element:'description'});
			validityFlag = false;
		}
		// Solution if close ticket
		if (this.saveOnly == false) {
			editor_data = CKEDITOR.instances.scm_ticketSolScreenEditor.getData();
			if (Object.isEmpty(editor_data)) {
				errorEntries.push({element: 'solution'});
				validityFlag = false;
			}
		}
		// Grouping skill
		if (this.groupingSkillAssigned != -1) {
			if (!this.companyGroupingAC.getValue()) {
				errorEntries.push({ element: 'groupingSkill' });
				validityFlag = false;
			}
		}
		// Company skills and service skills
		//since 2.2 Copy the way of working from the creation
		if (this.serviceSkills) {
		    this.serviceSkills.each(function(skill) {
		        if (this.companySkills && this.companySkills.get(skill.key)) return;
		        var skillWValue = { skillId: null, value: null, mandatory: skill.value.mandatoryOpen, type: 'S' };
		        skillWValue.skillId = skill.value.skillTypeId;
		        var skillACValues;
		        if (skill.value.autoCompleter) {
		            var value = skill.value.autoCompleter.getValue();
		            if (value)
		                skillACValues = value.idAdded;
		        } else
		            skillACValues = skill.value.skillId;

		        if (skillACValues) skillWValue.value = skillACValues;

		        this.skillsWithValues.push(skillWValue);
		    } .bind(this));
		}
		
		if (this.companySkills) {
			this.companySkills.each(function(skill){
				var serviceSkill;
				var serviceValue;
				if (this.serviceSkills)
					serviceSkill = this.serviceSkills.get(skill.key);
				if(!Object.isEmpty(serviceSkill.autoCompleter))
					serviceValue = serviceSkill.autoCompleter.getValue();
				
				var skillWValue = {skillId: null, value:null, mandatory:skill.value.mandatoryOpen, type:'C'};
				skillWValue.skillId = skill.value.skillTypeId;
				
				var skillACValues;
				if (skill.value.autoCompleter) {
					var value = (skill.value.autoCompleter.getValue()||serviceValue);
					if (value) 
						skillACValues = value.idAdded;
				} else 
					skillACValues = skill.value.skillId;
					
				if (skillACValues) skillWValue.value = skillACValues;
				
				this.skillsWithValues.push(skillWValue);
			}.bind(this));
		}
		
		// if this is a close, the mandatory attributes on close should be filled in
		if (this.saveOnly == false) {
			this.skillsWithValues.each(function(skill){
				if (skill.mandatory == 'true' && Object.isEmpty(skill.value)) {
					errorEntries.push({
						element: 'skill',
						id: skill.skillId,
						type: skill.type
					});
					validityFlag = false;
				}
			}.bind(this));
		}
		// Return the value
		return {
			valid: validityFlag,
			errors: errorEntries
		};
	},
	
	/**
	 * Function in charge of determining the DOM element and the label associated to this element based on the name of the element on error given in parameter.<br>
	 * This element on error comes from the call to _checkCreationValidity.
	 * @param {JSon} error A JSon object containing an element in error, this JSon object should at least contain {element: the name of the element on error}.
	 * @return {JSon} A JSon element containing {domElement: the reference to the DOMElement, errorLabel: the label associated to the DOM element}
	 * @since 1.0
	 * @see scm_createTicket#_checkCreationValidity
	 * <br/>Modified in 2.2
	 * <ul>
	 * <li>Replace the label "Subject" by "Short Description"</li>
	 * </ul>
	 */
	_determineElement:function(error){
		var domElement = null;
		switch(error.element){
			case 'description': domElement = this.screenObject.descriptionLink;
								errorLabel = global.getLabel('DESCR');
								break;
			case 'solution':	domElement = this.screenObject.solutionLink;
								errorLabel = global.getLabel('Solution');
								break;		
			case 'service':		domElement = this.screenObject.ticketSSpot.label;
								errorLabel = global.getLabel('SERV_NAME');
								break;
			case 'subject':		domElement = this.screenObject.ticketSubjectSpot.label;
								//since 2.2 Use the text short description to stay coherent with HRW
								errorLabel = global.getLabel('ShortDesc');
								break;
			case 'requestor employeeSearch':
								domElement = this.screenObject.empSearchSpotReq.down('[id="SCM_FindEmpLabel_EMP_ID"]');
								errorLabel = global.getLabel('requestor');
								break;
			case 'affectedEmployee employeeSearch':
								domElement = this.screenObject.empSearchSpotAff.down('[id="SCM_FindEmpLabel_EMP_ID"]');
								errorLabel = global.getLabel('Affected_employee');
								break;
			case 'skill':		domElement = this.screenObject.getAttributeLabelElement(error.id, error.type);
								errorLabel = global.getLabel('Attributes');
								break;
			case 'groupingSkill':
								domElement = this.screenObject.ticketCompanyGroupingLabel.value;
								errorLabel = global.getLabel('compGroupingSkill');
								break;
		}
		return {
			element: domElement,
			errorLabel: errorLabel
		};
	},
	
	_saveTicket:function(){
		if (this.errorElements && !Object.isEmpty(this.errorElements)) {
			this._unsetElementsOnError();
		}
		this.errorElements = $A();
		var validity = this._checkValidity();
		if (validity.valid == true) {
			if (this.screenObject.ticketMarkSolvedSpot.value.down('[id="scm_ticket_creation_markSolved_check"]').checked == false) {
				this.ticketValues.ticketSolved = 'false';
			}else{
				this.ticketValues.ticketSolved = 'true';
			}
			this._convertTicketXML(true);
			var callArgs = {serviceToCall:'UpdateTicket'};
			this.actionPerformed = 7;
			this._performActionOnTicketEvent(callArgs);
		}else{
			var errorMessage = '<div>'+ global.getLabel('fill_in_req_fields') +'</div><div><ul>';
			validity.errors.each(function(error){
				var errorElement = this._determineElement(error);
				errorMessage += '<li>'+ errorElement.errorLabel +'</li>';
				var domElement = errorElement.element;
				this._setElementOnError(domElement);
				this.errorElements.push(domElement);
			}.bind(this));
			errorMessage += '</ul></div>';
			new ticketActionPopupScreens().displayMessagePopup(errorMessage, 'exclamation');
		}
	},
	
	/**
	 * @since 2.0
	 * <br/>Modifications for 2.1:
	 * <ul>
	 * <li>Use the standard encoding before sending to HRW</li>
	 * </ul>
	 */
	_addTicketAction:function(){
		var ok = true;
		// check if description
		var description = CKEDITOR.instances.scm_ticketEditScreenEditor.getData();
		var selectedActionType = null;
		if (this.actionTypeSelectionDropDown.getValue()){
			selectedActionType = this.actionTypeSelectionDropDown.getValue().idAdded;
		}
		
		if (Object.isEmpty(description)){
			ok = false;
			this._setElementOnError(this.screenObject.newActionLink);
		}else{
			this.screenObject.newActionLink.removeClassName('SCM_ticketCreate_elemOnError');
		}
		if (selectedActionType == null){
			ok = false;
			this._setElementOnError(this.screenObject.ticketActionTypeSelectionEditSpotLabel.value);
		}else{
			this.screenObject.ticketActionTypeSelectionEditSpotLabel.value.removeClassName('SCM_ticketCreate_elemOnError');
		}
		if(ok == true){
			var values = { 	ticketId		:this.ticketValues.ticketId,
							//since 2.1 Use the standard encoding
							description		: HrwRequest.encode(description),
							actionTypeId	: selectedActionType,
							privacySkillId	: HrwEngine.NO_VALUE,
							timeSpent		: '1'
					 	 }
			var xmlAction = new hrw_customActionsObject(values).toXml();
			this._backend_addCustomAction(xmlAction);
		}		
	},
	
	_setElementOnError:function(element){
		element.addClassName('SCM_ticketCreate_elemOnError');
	},
	
	_unsetElementsOnError:function(){
		//since 1.2 If threre are no errors, don't do the loop
		if(Object.isEmpty(this.errorElements)) return;
		this.errorElements.each(function(element){
			element.removeClassName('SCM_ticketCreate_elemOnError');
		});
	},
	/**
	 * 
	 * @param {Object} withID
	 * @since 2.0
	 * <br/>Modifications for 2.1:
	 * <ul>
	 * <li>Use the standard encoding before sending to HRW</li>
	 * <li>Do not remove the P html tags because they are used when "Copy to sendbox"</li>
	 * </ul>
	 */
	_convertTicketXML:function(withID){
		var requestorObject 		= this.employeeValues.ticketAffEmployee.employeeSearch;
			var affectedEmployeeObject 	= this.employeeValues.ticketAffEmployee.employeeSearch;
			if(this.enableRequestor == "true"){
				requestorObject 		= this.employeeValues.ticketRequestor.employeeSearch;
				affectedEmployeeObject 	= this.employeeValues.ticketAffEmployee.employeeSearch;
			}
			var groupingSkillId = "-2147483648";
			if (this.groupingSkillAssigned != "-1"){
				groupingSkillId =  this.companyGroupingAC.getValue().idAdded;
			}
			var shortDescription = this.screenObject.ticketSubjectSpot.value.down().value;
			shortDescription == global.getLabel('SCM_no_subject')?shortDescription = "":shortDescription=shortDescription; 
			// get the values
			var description = CKEDITOR.instances.scm_ticketDescrScreenEditor.getData().gsub('<br>', '<br/>');
			description = description.gsub('&nbsp;', '');
			var solution = CKEDITOR.instances.scm_ticketSolScreenEditor.getData().gsub('<br>', '<br/>');
			solution = solution.gsub('&nbsp;', '');
			var serviceAreaId = "-2147483648";
			if(this.useAreas=='true'){
				serviceAreaId = this.ticketValues.ticketSAId;
			}
			var jsonValues = {
				ticketId: this.ticketValues.ticketId,
				//since 2.1 Use the standard encoding
				description: HrwRequest.encode(description),
				//since 2.1 Use the standard encoding
				solution: HrwRequest.encode(solution),
				employeeId: affectedEmployeeObject.getValues('EMP_ID'),
				employeeFirstName: affectedEmployeeObject.getValues('FIRST_NAME'),
				employeeLastName: affectedEmployeeObject.getValues('LAST_NAME'),
				companySkillId: this.companySkillId,
				//since 2.1 Use the standard encoding
				shortDescription: HrwRequest.encode(shortDescription),
				requestorId: requestorObject.getValues('EMP_ID'),
				requestorFirstName: requestorObject.getValues('FIRST_NAME'),
				requestorLastName: requestorObject.getValues('LAST_NAME'),
				customField1: "",
				customField2: "",
				type: 0,
				serviceSkillId: this.selectedService,
				serviceGroupId: this.selectedServiceGroup,
				groupingSkillId: groupingSkillId,
				solved: this.ticketValues.ticketSolved,
				serviceAreaId : serviceAreaId
			};
			//Add the dynamic due date if it exists
			if(this.ticketValues.ticketDDateHRWFormat !== this.ticketValues.ticketStaticDDate)
				jsonValues.dueDateDyn = this.ticketValues.ticketDDateHRWFormat;
				
			this.hrwTicketXml = new hrwTicketObject(jsonValues, true).toXml(withID);
			this.hrwTicketSkillsXml = new hrw_ticketSkillsObject(this.skillsWithValues).toXml();
	},	
	
	/**
	 * 
	 * @param {Object} json
	 * @since 2.0
	 * <br/>Modifications for 2.2:
	 * <ul>
	 * <li>Use the SCM labels for remaining time display</li>
	 * </ul>
	 * <br/>Modifications for 2.1:
	 * <ul>
	 * <li>Use the standard encoding before sending to HRW</li>
	 * </ul>
	 */
	_updateScreen:function(json){
		//	Affected employee values
		this.employeeValues.ticketAffEmployee.compId = json.EWS.HrwResponse.HrwResult.HrwTicket.CompanySkillId;	
		this.employeeValues.ticketAffEmployee.values.set('COMPANY_ID'	, (json.EWS.HrwResponse.HrwResult.HrwTicket.CustomerSkillId)?json.EWS.HrwResponse.HrwResult.HrwTicket.CustomerSkillId:json.EWS.HrwResponse.HrwResult.HrwTicket.CompanySkillId);
		this.employeeValues.ticketAffEmployee.values.set('COMPANY'		, (json.EWS.HrwResponse.HrwResult.HrwTicket.CustomerName)?json.EWS.HrwResponse.HrwResult.HrwTicket.CustomerName:json.EWS.HrwResponse.HrwResult.HrwTicket.CompanyName);
		this.employeeValues.ticketAffEmployee.values.set('EMP_ID'		, json.EWS.HrwResponse.HrwResult.HrwTicket.EmployeeId);
		this.employeeValues.ticketAffEmployee.values.set('LAST_NAME'	, json.EWS.HrwResponse.HrwResult.HrwTicket.EmployeeLastName);
		this.employeeValues.ticketAffEmployee.values.set('FIRST_NAME'	, json.EWS.HrwResponse.HrwResult.HrwTicket.EmployeeFirstName);
		//since 1.2 Replace 
		document.fire('EWS:SCM_ticketApp_AddParam', {name: 'company', value: this.companySkillId});
		//	Requestor values if needed
		if (this.enableRequestor == "true"){
			this.employeeValues.ticketRequestor.compId = json.EWS.HrwResponse.HrwResult.HrwTicket.CompanySkillId;	
		    this.employeeValues.ticketRequestor.values.set('COMPANY', (json.EWS.HrwResponse.HrwResult.HrwTicket.CustomerName)?json.EWS.HrwResponse.HrwResult.HrwTicket.CustomerName:json.EWS.HrwResponse.HrwResult.HrwTicket.CompanyName);
			this.employeeValues.ticketRequestor.values.set('COMPANY_ID', (json.EWS.HrwResponse.HrwResult.HrwTicket.CustomerSkillId)?json.EWS.HrwResponse.HrwResult.HrwTicket.CustomerSkillId:json.EWS.HrwResponse.HrwResult.HrwTicket.CompanySkillId);
			this.employeeValues.ticketRequestor.values.set('EMP_ID'		, json.EWS.HrwResponse.HrwResult.HrwTicket.SecEmployeeId);
			this.employeeValues.ticketRequestor.values.set('LAST_NAME'	, json.EWS.HrwResponse.HrwResult.HrwTicket.SecEmployeeLastName);
			this.employeeValues.ticketRequestor.values.set('FIRST_NAME'	, json.EWS.HrwResponse.HrwResult.HrwTicket.SecEmployeeFirstName);
		}
		// type
		this.ticketValues.ticketType		= json.EWS.HrwResponse.HrwResult.HrwTicket.Type;
		// status
		this.ticketValues.ticketStatus 		= json.EWS.HrwResponse.HrwResult.HrwTicket.Status;
		// subject
		if (!Object.isEmpty(json.EWS.HrwResponse.HrwResult.HrwTicket.ShortDescription)){
			//since 2.1 Use the standard encoding
			this.ticketValues.ticketSubject		= HrwRequest.decode(json.EWS.HrwResponse.HrwResult.HrwTicket.ShortDescription);
		}else{
			this.ticketValues.ticketSubject		= global.getLabel('SCM_no_subject').escapeHTML();
		}
		// description
		this.ticketValues.ticketDescription = json.EWS.HrwResponse.HrwResult.HrwTicket.Description;
		// solution
		this.ticketValues.ticketSolution	= json.EWS.HrwResponse.HrwResult.HrwTicket.Solution;
		// creation date
		this.ticketValues.ticketCDate		= SCM_Ticket.convertDateTime(json.EWS.HrwResponse.HrwResult.HrwTicket.CreationDateTime); 
		// current agent
		this.ticketValues.ticketCurrAgent	= json.EWS.HrwResponse.HrwResult.HrwTicket.CurrentAgentId;
		// due date
		if(!Object.isEmpty(json.EWS.HrwResponse.HrwResult.HrwTicket.DueDateDyn) &&
		            typeof(json.EWS.HrwResponse.HrwResult.HrwTicket.DueDateDyn)!= "object"){
			this.ticketValues.ticketDDate		= SCM_Ticket.convertDateTime(json.EWS.HrwResponse.HrwResult.HrwTicket.DueDateDyn);
			this.ticketValues.ticketDDateHRWFormat = json.EWS.HrwResponse.HrwResult.HrwTicket.DueDateDyn;
		}else if(typeof(json.EWS.HrwResponse.HrwResult.HrwTicket.DueDate)!= "object"){
			this.ticketValues.ticketDDate		= SCM_Ticket.convertDateTime(json.EWS.HrwResponse.HrwResult.HrwTicket.DueDate);
			this.ticketValues.ticketDDateHRWFormat = json.EWS.HrwResponse.HrwResult.HrwTicket.DueDate;
		}
		this.ticketValues.ticketStaticDDate = json.EWS.HrwResponse.HrwResult.HrwTicket.DueDate;
		
		// Service group
		this.ticketValues.ticketSGId		= json.EWS.HrwResponse.HrwResult.HrwTicket.ServiceGroupId ;
		this.selectedServiceGroup = this.ticketValues.ticketSGId;
		// Services
		this.ticketValues.ticketServiceId	= json.EWS.HrwResponse.HrwResult.HrwTicket.ServiceSkillId ;
		this.selectedService = this.ticketValues.ticketServiceId;
		document.fire('EWS:SCM_ticketApp_AddParam', {name: 'service', value: this.ticketValues.ticketServiceId});
		// actions
		if (json.EWS.HrwResponse.HrwResult.HrwTicket.HrwTicketActions)
			this.ticketValues.ticketPrevActions	= objectToArray(json.EWS.HrwResponse.HrwResult.HrwTicket.HrwTicketActions.HrwTicketAction);
		// items
		if (json.EWS.HrwResponse.HrwResult.HrwTicket.HrwTicketItems)
			this.ticketValues.ticketItems	= objectToArray(json.EWS.HrwResponse.HrwResult.HrwTicket.HrwTicketItems.HrwTicketItem);
		// skills
		if (json.EWS.HrwResponse.HrwResult.HrwTicket.HrwTicketSkills)
			this.ticketValues.ticketAttributes	= objectToArray(json.EWS.HrwResponse.HrwResult.HrwTicket.HrwTicketSkills.HrwTicketSkill);		
		// update due date
		if(this.ticketValues.ticketDDate === null) this.screenObject.ticketDdateSpot.value.update('');
		else this.screenObject.ticketDdateSpot.value.update(this.ticketValues.ticketDDate);
		// 2.0 Retrieving the remaining time
		this.ticketValues.ticketRtime       = json.EWS.HrwResponse.HrwResult.HrwTicket.RemainingBusinessMinutes;
		// Time remaining
		if(this.ticketValues.ticketRtime == HrwEngine.NO_VALUE){
			this.screenObject.ticketRtimeSpot.value.addClassName('SCM_ticket_screen_hidden');
			this.screenObject.ticketRtimeSpot.label.addClassName('SCM_ticket_screen_hidden');
		}else{
			var hours = parseInt(new Number(this.ticketValues.ticketRtime)/60);
			var minutes = new Number(this.ticketValues.ticketRtime) -(60*hours);
			var days = parseInt(hours/24);
			hours = hours -(days*24);
			//since 2.2 Use the SCM labels
			this.screenObject.ticketRtimeSpot.value.update(days + ' ' + global.getLabel('Days')+ ' ' +hours + ' ' + global.getLabel('Hours')+ ' ' + minutes + ' ' + global.getLabel('Minutes'));
		}
		// update actions
		this.actionsList = new scm_ticketActions(this.ticketValues.ticketDescription, this.ticketValues.ticketSolution , this.ticketValues.ticketPrevActions, true, !this.screenObject.ticketActionHideTech.value.checked, false);
		this.screenObject.ticketPrevActSpot.value.update();
		this.screenObject.ticketPrevActSpot.value.insert(this.actionsList.container);//generatedHTML);
		this.actionsList.addActionHeadersListeners(this.screenObject.ticketPrevActSpot.value);
		this.actionsList.addActionsOnTicketActions();
		// update solved flag
		if(this.ticketValues.ticketSolved == 'true'){
			this.screenObject.ticketMarkSolvedSpot.value.down('[id="scm_ticket_creation_markSolved_check"]').checked = true;
		}else{
			this.screenObject.ticketMarkSolvedSpot.value.down('[id="scm_ticket_creation_markSolved_check"]').checked = false;
		}
	},
	
	_duplicateTicket:function(){
		this._backend_duplicateTicket();
	},
	
	_prepareEmailAddForSending: function(email){
		if(email.endsWith('; ')){
			email = email.substr(0, email.length - 2);	
		}else if(email.endsWith(';')){
			email = email.substr(0, email.length - 1);	
		}
		return email;
	},
	
	_createMailElement:function(mailFrom, mailTo, mailCC, mailSubject, mailBody){
		
		var xmlForEmail =   '<SendEmail>'+
                				'<MailFrom>'+ 		mailFrom 	+'</MailFrom>'+
			                	'<MailTo>'+ 		mailTo 		+'</MailTo>'+
			                	'<MailCc>'+ 		mailCC 		+'</MailCc>'+
								'<MailSubject>'+ 	mailSubject +'</MailSubject>'+
			                	'<MailBody>'+ 		mailBody 	+'</MailBody>'+
			                	'<Attachments>';
		if (!Object.isUndefined(this.existingItemAttachedToMail) && !Object.isEmpty(this.existingItemAttachedToMail)){
			this.existingItemAttachedToMail.each(function(attachment){
				xmlForEmail += 		'<Attachment>'+ 
										'<TicketId>'+ this.ticketValues.ticketId +'</TicketId>'+
										'<TicketItemId>'+ attachment.key +'</TicketItemId>'+
									'</Attachment>';
			}.bind(this));
		}
		if (!Object.isUndefined(this.newItemAttachedToMail) && !Object.isEmpty(this.newItemAttachedToMail)){
			this.newItemAttachedToMail.each(function(attachment){
				xmlForEmail += 		'<Attachment>'+ 
										'<TicketId>'+ this.ticketValues.ticketId +'</TicketId>'+
										'<AttachmentFilename>'+ attachment.value.AttachmentFilename +'</AttachmentFilename>'+
										'<ServerAttachmentFilename>'+ attachment.value.ServerAttachmentFilename + '</ServerAttachmentFilename>'+
										'<PrivacySkillId>' + attachment.value.PrivacySkillId +'</PrivacySkillId>'+
										'<DocumentType>' +attachment.value.DocumentType+'</DocumentType>'+
									'</Attachment>';
			}.bind(this));
		}
		xmlForEmail +=  	'</Attachments>'+
						'</SendEmail>';
		return xmlForEmail;
	},
	
	_prefillMailValues:function(){
		var mailTo = '';
		if(this.prefillMailFields == 'resend'){
			this.prefillMailFields = '';
			// Mail From
			this.mailFromAC.setDefaultValue(this.loadedEmail.from);
			// Mail to
			if (!Object.isUndefined(this.loadedEmail.to)) {
				mailTo += this.loadedEmail.to + '; ';
			}
			if(mailTo != '; ')	this.mailToMS.prefillInputField(mailTo);
			// Mail CC
			var mailCc = '';
			if (!Object.isUndefined(this.loadedEmail.cc)) {
				mailCc += this.loadedEmail.cc + '; ';
			}	
			if(mailCc != '; ')	this.mailCCMS.prefillInputField(mailCc);
			// Mail subject
			this.screenObject.ticketEditorSubjectHeader.value.down('[id="scm_emailHeader_subject"]').value = this.loadedEmail.subject;
			// mail body
			var mailBody = this.loadedEmail.body;
			CKEDITOR.instances.scm_ticketEditScreenEditor.setData('<DIV ID="HRWEMAILBODY"><div>'+ this.loadedEmail.body +'</div></div><div ID="HRWEMAILSIGNATURE"><div></div></div>', this._displayMailSignatureOption());			
		}else if(this.prefillMailFields == 'forward' || this.prefillMailFields == 'reply' || this.prefillMailFields == 'replyAll'){
			// MAIL FROM, TO AND SUBJECT MANAGMENT depending of the action
			if(this.prefillMailFields == 'forward'){
				// Mail From
				this.mailFromAC.setDefaultValue(this.loadedEmail.from);
				// Mail subject
				this.screenObject.ticketEditorSubjectHeader.value.down('[id="scm_emailHeader_subject"]').value = 'FW: ' + this.loadedEmail.subject;
			}else{
				if(this.prefillMailFields == 'reply'){
					// Mail to
					this.mailToMS.prefillInputField(this.loadedEmail.from);
				}else{
					if (!Object.isUndefined(this.loadedEmail.to) && !Object.isEmpty(this.loadedEmail.to)) {
						mailTo += this.loadedEmail.to + '; ';
					}else{
						mailTo = '';
					}
					var emailAddresses = this.loadedEmail.from + '; ' + mailTo;
					var mailCc = '';
					if (!Object.isUndefined(this.loadedEmail.cc) && !Object.isEmpty(this.loadedEmail.cc)) {
						mailCc += this.loadedEmail.cc + '; ';
					}else{
						mailCc = '';
					}
					emailAddresses = emailAddresses.gsub(this.mailFromAC.getValue().idAdded + '; ', '');
					this.mailToMS.prefillInputField(emailAddresses);
					this.mailCCMS.prefillInputField(mailCc);
				}
				// Mail subject
				this.screenObject.ticketEditorSubjectHeader.value.down('[id="scm_emailHeader_subject"]').value = 'RE: ' + this.loadedEmail.subject;
			}
			this.prefillMailFields = '';
			
			// mail body
			var oldMailBody = '>' + global.getLabel('From') 	+ ': ' + this.loadedEmail.from 	+ '<br/>';
			//time
			oldMailBody += '>' + global.getLabel('sent') 	+ ': ' + SCM_Ticket.convertDateTime(this.lastActionClicked.CompletedTime)     	+ '<br/>'
			
			if (!Object.isUndefined(this.loadedEmail.to))
				oldMailBody += '>' + global.getLabel('To')   	+ ': ' + this.loadedEmail.to	  	+ '<br/>';
			else
				oldMailBody += '>' + global.getLabel('To')   	+ '<br/>';
			if (!Object.isUndefined(this.loadedEmail.cc))
				oldMailBody += '>' + global.getLabel('Cc')	  	+ ': ' + this.loadedEmail.cc	  	+ '<br/>';
			else	
				oldMailBody += '>' + global.getLabel('Cc')	  	+ '<br/>';
				
			oldMailBody += '>' + global.getLabel('Subject')	+ ': ' + this.loadedEmail.subject 	+ '<br/>';
			//oldMailBody += this.loadedEmail.body;
			
			if(!Object.isEmpty(this.loadedEmail.attachments)){
				oldMailBody += '>' + global.getLabel('Attachments')	 + ': ';
				this.loadedEmail.attachments.each(function(attachment){
					oldMailBody += attachment.AttachmentFilename + '; ';
				});
				oldMailBody += '<br/><br/>';
			}else{
				oldMailBody += '<br/>';
			}
			
			var loadedMailBody = this.loadedEmail.body;
			loadedMailBody = loadedMailBody.gsub('<div id="HRWEMAILBODY">', '<div>');
			loadedMailBody = loadedMailBody.gsub('<div id="HRWEMAILSIGNATURE">', '<div>');
			loadedMailBody = loadedMailBody.gsub('<div id="HRWEMAILOLD">', '<div>');
			oldMailBody += loadedMailBody;
			CKEDITOR.instances.scm_ticketEditScreenEditor.setData('<DIV ID="HRWEMAILBODY"><div></div></div><div ID="HRWEMAILSIGNATURE"><div></div></div><DIV ID="HRWEMAILOLD"><div><hr/>' + oldMailBody +'</div></div>', this._displayMailSignatureOption());
		}		
	},
	
	_hideMailFields:function(){
		this.screenObject.ticketEditorFromHeader.value.update();
		this.screenObject.ticketEditorToHeader.value.update();
		this.screenObject.ticketEditorCCHeader.value.update();
		this.screenObject.ticketEditorSubjectHeader.value.update();
		this.screenObject.ticketEditorAttachmentHeader.value.update();
		
		this.screenObject.ticketEditorToHeader.value.removeClassName('SCM_ticket_screen_hidden');
		this.screenObject.ticketEditorSubjectHeader.value.addClassName('SCM_ticket_screen_hidden');
		this.screenObject.ticketEditorCCHeader.value.addClassName('SCM_ticket_screen_hidden');
		this.screenObject.ticketEditorFromHeader.value.addClassName('SCM_ticket_screen_hidden');
		this.screenObject.ticketEditorAttachmentHeader.value.addClassName('SCM_ticket_screen_hidden');
		
		this.screenObject.hideSendButton();
	},
	
	_createFromInput:function(){
		this.screenObject.ticketEditorFromHeader.value.update('<div class="SCM_ticketScreen_MiddlePanelRight_header_email_inputContainer">'+
															  	'<div class="SCM_ticketScreen_MiddlePanelRight_header_email_field_label">'+ global.getLabel('From') +'</div>'+
																'<div class="SCM_ticketScreen_MiddlePanelRight_header_email_field_input" id="scm_emailHeader_from"></div>'+
															  '</div>');
//		this.screenObject.ticketEditorFromHeader.value.removeClassName('SCM_ticket_screen_hidden');														  
	},
	
	_createToInput:function(){
		this.screenObject.ticketEditorToHeader.value.update('<div class="SCM_ticketScreen_MiddlePanelRight_header_email_inputContainer">'+
															  '<div class="SCM_ticketScreen_MiddlePanelRight_header_email_field_label">'+ global.getLabel('To') +'</div>'+
															  '<div class="SCM_ticketScreen_MiddlePanelRight_header_email_field_input_multiselect" id="scm_emailHeader_to"></div>'+
															'</div>');
		this.screenObject.ticketEditorToHeader.value.removeClassName('SCM_ticket_screen_hidden');
	},
	
	_createCCInput:function(){
		this.screenObject.ticketEditorCCHeader.value.update('<div class="SCM_ticketScreen_MiddlePanelRight_header_email_inputContainer">'+
															  '<div class="SCM_ticketScreen_MiddlePanelRight_header_email_field_label">'+ global.getLabel('Cc') +'</div>'+
															  '<div class="SCM_ticketScreen_MiddlePanelRight_header_email_field_input_multiselect" id="scm_emailHeader_cc"></div>'+
															'</div>');
		this.screenObject.ticketEditorCCHeader.value.removeClassName('SCM_ticket_screen_hidden');
	},
	
	_createSubjectInput:function(){
		this.screenObject.ticketEditorSubjectHeader.value.update('<div class="SCM_ticketScreen_MiddlePanelRight_header_email_inputContainer"><div class="SCM_ticketScreen_MiddlePanelRight_header_email_field_label">'+ global.getLabel('Subject') +'</div><div class="SCM_ticketScreen_MiddlePanelRight_header_email_field_input"><input id="scm_emailHeader_subject" maxlength="500" class="SCM_ticketScreen_MiddlePanelRight_header_email_input" type="text" value=""></input></div></div>');
		this.screenObject.ticketEditorSubjectHeader.value.removeClassName('SCM_ticket_screen_hidden');
	},
	
	_createAttachmentDisplay:function(){
		this.screenObject.ticketEditorAttachmentHeader.value.update('<div class="SCM_ticketScreen_MiddlePanelRight_header_email_inputContainer">'+
																	'<div class="SCM_ticketScreen_MiddlePanelRight_header_email_field_label">'+ global.getLabel('Attachments') +'</div>'+
																	'<div id="emailAttachmentContainer" class="SCM_ticketScreen_MiddlePanelRight_header_email_field_input"></div>'+
																 '</div>');
		this.screenObject.ticketEditorAttachmentHeader.value.removeClassName('SCM_ticket_screen_hidden');
		
	},
	
	/**
	 * Display the form to enter mail header
	 * @param {Array} from List of possible From addresses
	 * @param {String} defaultAddress Default address
	 * @since 2.0
	 * <br/>Modified for 2.2
	 * <ul>
	 * <li>Make sure there is always a selected from address</li>
	 * <li>Refactoring of the code</li>
	 * </ul>
	 */
	_updateFromInput:function(from, defaultAddress){
		this._createFromInput();
		if(!Object.isUndefined(this.screenObject.ticketEditorFromHeader.value.down('[id="scm_emailHeader_from"]')))
			this.screenObject.ticketEditorFromHeader.value.down('[id="scm_emailHeader_from"]').update();
		
		var fromAddresses = $A();
		this.emailTemplates = $H();
		
		// If only one email address, no need to display the field
		if(from.size() <= 1)
			this.screenObject.ticketEditorFromHeader.value.removeClassName('SCM_ticket_screen_hidden'); 
		
		var hasDef = false;
		from.each(function(value){
			if (!Object.isEmpty(defaultAddress) && value.Address === defaultAddress) {
				fromAddresses.push({ data: value.Address, text: value.Name, def:'X'});
				hasDef = true;
			} else 
				fromAddresses.push({ data: value.Address, text: value.Name});	
			
			if(value.EmailTemplates && value.EmailTemplates.EmailTemplate)
				this.emailTemplates.set(value.Address, value.EmailTemplates.EmailTemplate);
			else
				this.emailTemplates.set(value.Address, $A());
		}.bind(this));
		
		//If there is no default value, put the first one
		if(!hasDef && fromAddresses.size() > 0) fromAddresses[0].def = 'X';
		
		var json = {autocompleter: {object: fromAddresses}};
		
		this.mailFromAC = new JSONAutocompleter(this.screenObject.ticketEditorFromHeader.value.down('[id="scm_emailHeader_from"]'), {
			events: $H({onResultSelected: 'EWS:scm_emailFromResultSelected'}),
			showEverythingOnButtonClick: true,
			timeout: 5000,
			templateResult: '#{text}',
			templateOptionsList: '#{text}'
		}, json);
		var element = this.screenObject.ticketEditorFromHeader.value.down('[id="scm_emailHeader_from"]');
		element.down('.autocompleter_form_container').addClassName('SCM_ticket_screen_FullWidth');
		element.down('[id="text_area_scm_emailHeader_from"]').addClassName('SCM_ticketScreen_MiddlePanelRight_header_email_acInput');
	},
	
	_updateToInput:function(to){
		var toAddresses = $A();
		to.each(function(value){	
			toAddresses.push({data:value, text:value});	
		}.bind(this));
		var options = 	{className: '', id: 'toAddMSAC'};
		this.mailToMS = new multiselectAutoComplete(this.screenObject.ticketEditorToHeader.value.down('[id="scm_emailHeader_to"]'), options, toAddresses);
	},
	
	_updateCCInput:function(cc){
		var ccAddresses = $A();
		if (!Object.isUndefined(cc)) {
			cc.each(function(value){
				ccAddresses.push({ data: value, text: value });
			}.bind(this));
		}
		var options = 	{className: '', id: 'ccAddMSAC'};
		this.mailCCMS = new multiselectAutoComplete(this.screenObject.ticketEditorCCHeader.value.down('[id="scm_emailHeader_cc"]'), options, ccAddresses);		
	},
	
	_updateSubjectInput:function(subject){
		this.screenObject.ticketEditorSubjectHeader.value.down('[id="scm_emailHeader_subject"]').value = subject;
	},
	
	_updateAttachmentDisplay:function(attachments){
		if (!this.attachmentObject) {
			this.attachmentObject = new scm_mailAttachObject({
				target: this.virtualHtml.down('[id="emailAttachmentContainer"]'),
				idObject: 'emailAttachmentObject'
			});
		}else{
			this.attachmentObject.clean();
		}
		
		attachments.each(function(attach){
			this.attachmentObject.addAttachment({
				idAttach: attach.value.itemID,
				classIconAttach: attach.value.itemIcon,
				textAttach: attach.value.itemName,
				fileId:attach.value.ServerAttachmentFilename
			})
		}.bind(this));
	},
	
	_cleanTopRightContainer:function(){
		if(this.screenObject.dynCompInfoSpot)
			this.screenObject.dynCompInfoSpot.update();
	},

	_displayMailSignatureOption:function(){
		CKEDITOR.instances.scm_ticketEditScreenEditor.getCommand('insertSignature').enable();
		CKEDITOR.instances.scm_ticketEditScreenEditor.getCommand('insertTemplate').enable();

		
		var templates = this.emailTemplates.get(this.mailFromAC.getValue().idAdded);
		if (templates.size() === 0){
			return
		}
		var nbrSignature = 0;
		var nbrTemplate = 0;
		var signature = '';
		templates.each(function(template){
			if (template.Type == '2'){
				nbrSignature++;
				signature = template.Template
			}else if(template.Type == '1'){
				nbrTemplate++;
			}
		}.bind(this));
		
		if(nbrSignature > 0){
			if(nbrSignature == 1){
				this._signatureChosenEvent({memo:{signature:signature}});
			}
		}
	},

	_buildContextMenuForSignatures:function(event){
		var nbrSignature = 0;
		var menuItems = $A();
		if (Object.isUndefined(this.emailTemplates) || Object.isEmpty(this.emailTemplates)) {
			menuItems.push({
					name: global.getLabel('noSignature'),
					callback: function(event){}
			});
		} else {
			var templates = this.emailTemplates.get(this.mailFromAC.getValue().idAdded);
			
			templates.each(function(template){
				if (template.Type == '2') 
					nbrSignature++;
			}.bind(this));
			
			if (nbrSignature == 0) {
				menuItems.push({ name: global.getLabel('noSignature'),	callback: function(event){}});
			}else {
				// mail signatures
				templates.each(function(template){
					if (template.Type != '2') 
						return;
					menuItems.push({ name: template.Name,
						callback: function(event){
							document.fire('EWS:scm_signatureChosen', {
								signature: template.Template
							});
						}
					})
				}.bind(this));
			}
		}
		new Proto.Menu({menuItems: menuItems}).show(event, true); 
	},

	_buildContextMenuForTemplates:function(event){
		var nbrTemplate = 0;
		var menuItems = $A();
		if (Object.isUndefined(this.emailTemplates) || Object.isEmpty(this.emailTemplates)) {
			menuItems.push({
				name: global.getLabel('noTemplate'),
				callback: function(event){
				}
			});
		}
		else {
			var templates = this.emailTemplates.get(this.mailFromAC.getValue().idAdded);
			templates.each(function(template){
				if (template.Type == '1') 
					nbrTemplate++;
			}.bind(this));
			
			// mail body templates
			if (nbrTemplate == 0) {
				menuItems.push({
					name: global.getLabel('noTemplate'),
					callback: function(event){
					}
				});
			}
			else {
				templates.each(function(template){
					if (template.Type != '1') 
						return;
					menuItems.push({
						name: template.Name,
						callback: function(event){
							document.fire('EWS:scm_mailTemplateChosen', {
								mailTemplate: template.Template
							});
						}
					})
				}.bind(this));
			}
		}
		new Proto.Menu({menuItems: menuItems}).show(event, true); 
	},

	_updateTopRightContainer:function(currentEmployee){
		this._backend_getTopRightContent(currentEmployee);
	}
});
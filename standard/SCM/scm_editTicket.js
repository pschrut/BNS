/**
 * @class
 * @description Class in charge of managing the application allowing the user to edit a ticket.
 * @author jonathanj & nicolasl
 * @version 2.1 
 * <br/>Modifications for 2.1
 * <ul>
 * <li>Use the common way to encode/decode fields for the communication to the backend</li>
 * <li>Deacrtivate the spell checker</li>
 * </ul>
 * <br/>Changes for version 2.0:
 * <ul>
 * 	<li>Name of some backend function changed</li>
 *	<li>The employee id is added in the selection of services to show</li>
 *  <li>Introduction of a new flag to know if the service attributes should be redisplayed after a call to the company attributes. (see <a href=scm_editTicket.html#_ticketEmployeeSelectedEvent>_ticketEmployeeSelectedEvent</a> for more details).</li> 
 *  <li>Add of the possibility to have read only attributes.</li>
 *  <li>Retrieve and display of the remaining time to close the ticket</li>
 *  <li>Implementation of the service areas, first level of service grouping</li>
 * <li>Use a constant for empty HRW values</li>
 * </ul>
 */

var scm_editTicket = Class.create(Application, /** @lends scm_editTicket.prototype */{
	/**
	 * @description Title of the application
	 * @type String
	 * @since 1.0
	 */
	mainTitle : '',
	/**
	 * @description Object representing the ticket screen
	 * @type scm_ticketScreen_standard_new
	 * @since 1.0
	 */
	screenObject:null,
	/**
	 * @description The possible events for the class
	 * @type JSON
	 * @since 1.0
	 */
	eventListeners:null,
	/**
	 * The values of the ticket coming from the backend. <br>
	 * These values are stored with the following format:
	 * <ul>
	 * 	<li>ticketId: The ticket id,</li>
	 *	<li>ticketType: The ticket type (internal or external),</li>
	 *	<li>ticketStatus: The ticket status,</li>
	 *	<li>ticketSubject: The ticket subkect,</li>
	 *	<li>ticketDescription: The ticket description,</li>
	 *	<li>ticketSolution: The ticket solution,</li>
	 *	<li>ticketCDate: The ticket creation date,</li>
	 *	<li>ticketDDate: The ticket due date,</li>
	 *	<li>ticketSG: The ticket service group,</li>
	 *	<li>ticketSGId: The ticket service group id,</li>
	 *	<li>ticketRtime: The remaining time before closing the ticket,</li>
	 *	<li>ticketService: The ticket service,</li>
	 *	<li>ticketServiceId: The ticket service id,</li>
	 *	<li>ticketPrevActions: The list of previous actions on the ticket,</li>
	 *	<li>ticketPrevTechAct: The list of previous technical actions on the ticket,</li>
	 *	<li>ticketAttributes: The list of ticket attributes</li>
	 *	<li>ticketCurrAgent: The current agent of the ticket.</li>
	 *  <li>ticketSolved: The solved flag (since 2.0)</li>
	 * </ul>
	 * @type JSon
	 * @since 1.0<br>
	 * Modified in version 2.0:<ul>
	 * 	<li>Add of the solved flag</li>
	 * </ul>
	 */
	ticketValues:null,
	/**
	 * @since 1.0
	 */
	employeeValues:null,
	/**
	 * @since 1.0
	 */
	listOfSG: null,
	/**
	 * @since 1.0
	 */
	listOfServices: null,
	/**
	 * @since 1.0
	 */
	enableRequestor: null,
	/**
	 * @since 1.0
	 */
	activeEmpSearch:null,
	/**
	 * @since 1.0
	 */
	actionsList:null,
	/**
	 * @since 1.0
	 */
	pendingReasons:null,
	/**
	 * @since 1.0
	 */
	actionPerformed:null,
	/**
	 * @since 1.0
	 */
	employeeHistLaunched:null,
	/**
	 * @since 1.0
	 */
	serviceGroups:null,
	/**
	 * @since 1.0
	 */
	services:null,
	/**
	 * @since 1.0
	 */
	selectedServiceGroup:null,
	/**
	 * @since 1.0
	 */
	ticketAction_actionsTypes:null,
	/**
	 * @since 1.0
	 */
	ticketAction_ewsInfo : null,
	/**
	 * @since 1.0
	 */
	ticketAction_ewsNotif: null,
	/**
	 * @since 1.0
	 */
	ticketAction_ewsDocument: null,
	/**
	 * @since 1.0
	 */
	ticketAction_ewsApproval: null,
	/**
	 * @since 1.0
	 */
	ticketActionTypes:null,
	/**
	 * @since 1.0
	 */
	groupingSkills:null,
	/**
	 * @since 1.0
	 */
	groupingSkillAssigned:null,
	/**
	 * @since 1.0
	 */
	companyGroupingAC:null,
	/**
	 * @since 1.0
	 */
	companySkills:null,
	/**
	 * @since 1.0
	 */
	serviceSkills:null,
	/**
	 * @since 1.0
	 */
	selectedService:null,
	/**
	 * @since 1.0
	 */
	assignedAgents:null,
	/**
	 * @since 1.0
	 */
	sendMailAfterClose:null,
	/**
	 * @since 1.0
	 */
	hrwTicketXml: null,
	/**
	 * @since 1.0
	 */
	hrwTicketSkillsXml: null,
	/**
	 * @since 1.0
	 */
	skillsWithValues:null,
	/**
	 * @since 1.0
	 */
	isInInitialization:null,
	/**
	 * @since 1.0
	 */
	errorElements:null,
	/**
	 * @since 1.0
	 */
	typeSelectionDropDown:null,
	/**
	 * @since 1.0
	 */
	typeSelection:null,
	/**
	 * @since 1.0
	 */
	actionTypeSelectionDropDown:null,
	/**
	 * @since 1.0
	 */
	showMailPopup:null,
	/**
	 * @since 1.0
	 */
	saveOnly: null,
	/**
	 * @since 1.0
	 */
	buttonAction: null,
	/**
	 * @since 1.0
	 */
	ticketMailPreview:null,
	/**
	 * @since 1.0
	 */
	mailType:null,
	/**
	 * @since 1.0
	 */
	mailFromAC:null,
	/**
	 * @since 1.0
	 */
	mailToMS:null,
	/**
	 * @since 1.0
	 */
	mailCCMS:null,
	/**
	 * @since 1.0
	 */
	currentEditorInstance:null,
	/**
	 * @since 1.0
	 */
	loadedEmail:null,
	/**
	 * @since 1.0
	 */
	selectedPreviousAction:null,
	/**
	 * @since 1.0
	 */
	prefillMailFields:null,
	/**
	 * @since 1.0
	 */
	ticketForDocument: null,
	/**
	 * @since 1.0
	 */
	emailTemplates: null,
	/**
	 * @since 1.0
	 */
	mailActionType: null,
	/**
	 * @since 1.0
	 */
	lastActionClicked: null,
	/**
	 * @since 1.0
	 */
	existingItemAttachedToMail: null,
	/**
	 * @since 1.0
	 */
	newItemAttachedToMail: null,
	/**
	 * @since 1.0
	 */
	attachmentObject: null,
	/**
	 * @since 1.0
	 */
	allowDDchange:null,
	/**
	 * @since 1.0
	 */
	firstAttachDisplay:null,
	/**
	 * @since 1.0
	 */
	ticketComesFromMemory:null,
	/**
	 * @since 1.0
	 */
	doNotReset:null,
	/**
	 * Flag meaning if the service attributes should be added in the attributes panel
	 * @type boolean
	 * @since 2.0
	 */
	 addServiceAttributes:null,
	 
	 /**
	 * Indicate the company skill Id of the displayed ticket
	 * @type String
	 * @since 1.2
	 */
	 companySkillId: null,
/*----------------------------------------------------------------------------------------------
 * 									STANDART CLASS FUNCTIONS 
 *--------------------------------------------------------------------------------------------*/    		
	/**
	 * 
	 * @param {Object} $super
	 * @param {Object} args
	 * @since 1.0
	 */
	initialize: function($super, args){
		$super(args);
		
		this.eventListeners = {
			viewPreviousAction	  		: this._viewPreviousActionEvent.bindAsEventListener(this),
			technicalActionsChanged 	: this._filterActionsEvent.bindAsEventListener(this),
			ticketServiceGroupSelected  : this._getServicesEvent.bindAsEventListener(this),
			ticketServiceSelected		: this._getPossibleServiceAttributesEvent.bindAsEventListener(this),
			performActionOnTicket		: this._defineActionAndParamsEvent.bindAsEventListener(this),
			pendingPopupClosed			: this._getPendingInfoFromPopupEvent.bindAsEventListener(this),
			waitingPopupClosed			: this._getWaitingInfoFromPopupEvent.bindAsEventListener(this),
			generalPoolPopupClosed		: this._getgeneralPoolInfoFromPopupEvent.bindAsEventListener(this),			
			schedulePopupClosed     	: this._getScheduleInfoFromPopupEvent.bindAsEventListener(this),
			closePopupClosed			: this._getDataFromPopupEvent.bindAsEventListener(this),
			sendToPopupClosed			: this._getSendToInfoFromPopupEvent.bindAsEventListener(this),
			dynCompanyInfoClicked		: this._dynCompanyInfoEvent.bindAsEventListener(this),
			affectedEmployeeLinkClicked	: this._affectedEmployeeLinkClicked.bindAsEventListener(this),
			requestorLinkClicked		: this._requestorLinkClicked.bindAsEventListener(this),
			copyToSendBox				: this._copyToSendBoxEvent.bindAsEventListener(this),
			cancelModification			: this._cancelModificationEvent.bindAsEventListener(this),
			saveModification			: this._saveTicketEvent.bindAsEventListener(this),
			replyToMail					: this._replyToMailEvent.bindAsEventListener(this),
			replyAllToMail				: this._replyAllToMailEvent.bindAsEventListener(this),
			forwardMail					: this._forwardMailEvent.bindAsEventListener(this),
			resendMail					: this._resendMailEvent.bindAsEventListener(this),
			mailPopupClosed				: this._mailPopupClosedEvent.bindAsEventListener(this),
			typeSelectionChanged		: this._typeSelectionChangedEvent.bindAsEventListener(this),
			ticketNoEmployeeSelected	: this._ticketNoEmployeeSelectedEvent.bindAsEventListener(this),
			ticketEmployeeSelected		: this._ticketEmployeeSelectedEvent.bindAsEventListener(this),
			showDescriptionButton		: this._showDescriptionButtonEvent.bindAsEventListener(this),
			showNewActionButton			: this._showNewActionButtonEvent.bindAsEventListener(this),
			showSolutionButton			: this._showSolutionButtonEvent.bindAsEventListener(this),
			showViewActionButton		: this._showViewActionButtonEvent.bindAsEventListener(this),
			showTemplateSelector		: this._showCustomActionTemplateSelectorEvent.bindAsEventListener(this),
			customActionTempleSelected	: this._customActionTemplateSelectedEvent.bindAsEventListener(this),
			assignNewDate				: this._assignNewDateEvent.bindAsEventListener(this),
			resetdueDateToStatic		: this._resetdueDateToStaticEvent.bindAsEventListener(this),
			employeeSearchChanged		: this._employeeSearchChangedEvent.bindAsEventListener(this),
			signatureChosen				: this._signatureChosenEvent.bindAsEventListener(this),
			mailTemplateChosen			: this._mailTemplateChosenEvent.bindAsEventListener(this),
			fromAddressChosen			: this._fromAddressChosenEvent.bindAsEventListener(this),
			showSignatures				: this._showSignaturesEvent.bindAsEventListener(this),
			showTemplates				: this._showTemplatesEvent.bindAsEventListener(this),
			addAttachment				: this._addAttachmentEvent.bindAsEventListener(this),
			attachItem					: this._attachItemEvent.bindAsEventListener(this),
			removeAttachment			: this._removeAttachmentEvent.bindAsEventListener(this),
			setClosingFlag				: this._setClosingFlagEvent.bindAsEventListener(this)
		};			
	},
	/**
	 * 
	 * @param {Object} $super
	 * @param {Object} args
	 * @since 1.0
	 */
	run: function ($super, args){
        $super(args);
		
		document.observe('EWS:SCM_ticketApp_askClosing', this.eventListeners.setClosingFlag);
		
		document.observe('EWS:scm_affectedEmployeeLinkClicked', this.eventListeners.affectedEmployeeLinkClicked);
		document.observe('EWS:scm_requestorLinkClicked', this.eventListeners.requestorLinkClicked);
		document.observe('EWS:scm_ticketEdit_serviceChoosen', this.eventListeners.ticketServiceSelected);
        document.observe('EWS:scm_ticketEdit_serviceGroupChoosen', this.eventListeners.ticketServiceGroupSelected);
		document.observe('EWS:scm_ticketEdit_TypeSelectionChanged',this.eventListeners.typeSelectionChanged);
		
		document.observe('EWS:scm_viewPreviousAction', this.eventListeners.viewPreviousAction);
		document.observe('EWS:scm_copyToSendBox', this.eventListeners.copyToSendBox);
		document.observe('EWS:scm_ticketActionCheckBoxChange', this.eventListeners.technicalActionsChanged);
		
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
		
		document.observe('EWS:scm_tiact_take_processing', this.eventListeners.performActionOnTicket);
		document.observe('EWS:scm_tiact_set_pending', this.eventListeners.performActionOnTicket);
		document.observe('EWS:scm_tiact_set_waiting', this.eventListeners.performActionOnTicket);
		document.observe('EWS:scm_tiact_get_gen_pool', this.eventListeners.performActionOnTicket);
		document.observe('EWS:scm_tiact_shedule_ticket', this.eventListeners.performActionOnTicket);
		document.observe('EWS:scm_tiact_send_ticket_to', this.eventListeners.performActionOnTicket);
		document.observe('EWS:scm_tiact_duplicate_ticket', this.eventListeners.performActionOnTicket);
		document.observe('EWS:scm_tiact_add_doc_to_ticket', this.eventListeners.performActionOnTicket);
  		document.observe('EWS:scm_tiact_save_and_send', this.eventListeners.performActionOnTicket);
		document.observe('EWS:scm_tiact_close_ticket', this.eventListeners.performActionOnTicket);

		document.observe('EWS:scm_description_displayed', this.eventListeners.showDescriptionButton);
		document.observe('EWS:scm_solution_displayed', this.eventListeners.showSolutionButton);
		document.observe('EWS:scm_viewAction_displayed', this.eventListeners.showViewActionButton);
		document.observe('EWS:scm_newAction_displayed', this.eventListeners.showNewActionButton);
		
		document.observe('EWS:scm_showTemplateSelector', this.eventListeners.showTemplateSelector);
		document.observe('EWS:scm_customActionTemplateSelected', this.eventListeners.customActionTempleSelected);
		document.observe('EWS:scm_dynCompanyInfoClicked', this.eventListeners.dynCompanyInfoClicked);
		
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
		
		// Ticket specific values
		this.ticketValues = {
			ticketId		 	: getArgs(args).get('ticketId'),
			ticketType			: null,
			ticketStatus	 	: null,
			ticketSubject  		: null,
			ticketDescription	: null,
			ticketSolution		: null,
			ticketCDate			: null,
			ticketDDate			: null,
			ticketStaticDDate	: null,
			ticketSG			: null,
			ticketSGId			: null,
			ticketRtime			: null,
			ticketService		: null,
			ticketServiceId		: null,
			ticketPrevActions	: null,
			ticketItems			: null,
			ticketAttributes	: null,
			ticketCurrAgent		: null,
			ticketDocuments		: null,
			ticketSolved		: null			
		};
		// Employee/Company specific values
		this.employeeValues = {
			ticketRequestor		: {
									builded			: false,
									employeeSearch	: null,
									extension	  	: null,
									values		  	: $H({
															COMPANY_ID : null,
															COMPANY	   : null,
															EMP_ID     : null,
															FIRST_NAME : null,
															LAST_NAME  : null,
															EMAIL      : null
														}),
									userAction		: null,
									id				: null,
									compId			: null,
									dynCompInfo		: null,
									defDynCompInfo	: null
								  },
			ticketAffEmployee	: {
									builded			: false,
									employeeSearch	: null,
									extension	  	: null,
									values		  	: $H({
															COMPANY_ID : null,
															COMPANY	   : null,
															EMP_ID     : null,
															FIRST_NAME : null,
															LAST_NAME  : null,
															EMAIL      : null
														}),
									userAction		: null,
									id				: null,
									compId			: null,
									dynCompInfo		: null,
									defDynCompInfo	: null
								  },
								  
			ticketCompanyDetails: null
		};
		
		this.ticketAction_actionsTypes = $A();
		this.ticketActionTypes    = $A();				
		this.prefillMailFields = '';
		this.ticketForDocument = null;
		this.existingItemAttachedToMail = $H();
		this.newItemAttachedToMail = $H();
		this.firstAttachDisplay = true;
		if (this.firstRun == true) {
			this.firstRun = false;
		}else{
			this.resetData();
		}
		this.screenInitialize();
		this.mainTitle = global.getLabel('Ticket_edit') + ' - <i>' + this.ticketValues.ticketId +'</i>';
		this.updateTitle(this.mainTitle);
		document.fire("EWS:scm_refreshPendList");
    },
	/**
	 * 
	 * @param {Object} $super
	 * @since 1.0
	 */
	close: function ($super){
		$super();
		
		this._cleanEmployeeHistoryPanel();
		document.stopObserving('EWS:SCM_ListDocumentsToUpdate');
		if(this.doNotReset == true) return;
		this.resetData();
			
		document.stopObserving('EWS:scm_affectedEmployeeLinkClicked', this.eventListeners.affectedEmployeeLinkClicked);
		document.stopObserving('EWS:scm_requestorLinkClicked', this.eventListeners.requestorLinkClicked);
		document.stopObserving('EWS:scm_ticketEdit_serviceChoosen', this.eventListeners.ticketServiceSelected);
        document.stopObserving('EWS:scm_ticketEdit_serviceGroupChoosen', this.eventListeners.ticketServiceGroupSelected);
		document.stopObserving('EWS:scm_ticketEdit_TypeSelectionChanged',this.eventListeners.typeSelectionChanged);
		
		document.stopObserving('EWS:scm_viewPreviousAction', this.eventListeners.viewPreviousAction);
		document.stopObserving('EWS:scm_copyToSendBox', this.eventListeners.copyToSendBox);
		document.stopObserving('EWS:scm_ticketActionCheckBoxChange', this.eventListeners.technicalActionsChanged);
		
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
		
		document.stopObserving('EWS:scm_tiact_take_processing', this.eventListeners.performActionOnTicket);
		document.stopObserving('EWS:scm_tiact_set_pending', this.eventListeners.performActionOnTicket);
		document.stopObserving('EWS:scm_tiact_set_waiting', this.eventListeners.performActionOnTicket);
		document.stopObserving('EWS:scm_tiact_get_gen_pool', this.eventListeners.performActionOnTicket);
		document.stopObserving('EWS:scm_tiact_shedule_ticket', this.eventListeners.performActionOnTicket);
		document.stopObserving('EWS:scm_tiact_send_ticket_to', this.eventListeners.performActionOnTicket);
		document.stopObserving('EWS:scm_tiact_duplicate_ticket', this.eventListeners.performActionOnTicket);
		document.stopObserving('EWS:scm_tiact_add_doc_to_ticket', this.eventListeners.performActionOnTicket);
  		document.stopObserving('EWS:scm_tiact_save_and_send', this.eventListeners.performActionOnTicket);
		document.stopObserving('EWS:scm_tiact_close_ticket', this.eventListeners.performActionOnTicket);

		document.stopObserving('EWS:scm_description_displayed', this.eventListeners.showDescriptionButton);
		document.stopObserving('EWS:scm_solution_displayed', this.eventListeners.showSolutionButton);
		document.stopObserving('EWS:scm_viewAction_displayed', this.eventListeners.showViewActionButton);
		document.stopObserving('EWS:scm_newAction_displayed', this.eventListeners.showNewActionButton);
		
		document.stopObserving('EWS:scm_showTemplateSelector', this.eventListeners.showTemplateSelector);
		document.stopObserving('EWS:scm_customActionTemplateSelected', this.eventListeners.customActionTempleSelected);
		document.stopObserving('EWS:scm_dynCompanyInfoClicked', this.eventListeners.dynCompanyInfoClicked);
		
		document.stopObserving('EWS:scm_employeeSearchChanged', this.eventListeners.employeeSearchChanged);
		document.stopObserving('EWS:scm_signatureChosen', this.eventListeners.signatureChosen);
		document.stopObserving('EWS:scm_mailTemplateChosen', this.eventListeners.mailTemplateChosen);
		document.stopObserving('EWS:scm_emailFromResultSelected', this.eventListeners.fromAddressChosen);
		
		document.stopObserving('EWS:scm_showSignatures',this.eventListeners.showSignatures);
		document.stopObserving('EWS:scm_showTemplates',this.eventListeners.showTemplates);
		document.stopObserving('EWS:scm_addAttachment', this.eventListeners.addAttachment);
		
		document.stopObserving('EWS:scm_itemsAttachedToMail', this.eventListeners.attachItem);
		
    },
/*----------------------------------------------------------------------------------------------
 * 									INITIALIZATION FUNCTIONS 
 *--------------------------------------------------------------------------------------------*/    	
 	/**
 	 * 
 	 * @param {Object} args
 	 * @since 1.0
 	 */
	_setClosingFlagEvent:function(args){
		if(args.memo.args.get('forEdition') == false) return;
		this.doNotReset = true;
		document.stopObserving('EWS:SCM_ticketApp_askClosing');
		document.fire('EWS:SCM_ticketApp_allowClosing');
	},
 
	/**
	 * @since 1.0
	 * <br/>Modification for 1.2:
	 * <ul>
	 * <li>Remove the errors on the screen when leaving</li>
	 * </ul>
	 */
	resetData:function(){
		this.modifiedFields = $H();
		this.ticketIsModified = false;
		
		//since 1.2 Remove the errors in the screen
		this._unsetElementsOnError();
		this.errorElements = $A();
		
		if(!Object.isEmpty(this.screenObject)) this.screenObject.resetData();
		if(CKEDITOR.instances.scm_ticketViewScreenEditor){
			CKEDITOR.remove(CKEDITOR.instances.scm_ticketViewScreenEditor)
		}
		if(CKEDITOR.instances.scm_ticketEditScreenEditor){
			CKEDITOR.remove(CKEDITOR.instances.scm_ticketEditScreenEditor)
		}
		if(CKEDITOR.instances.scm_ticketDescrScreenEditor){
			CKEDITOR.remove(CKEDITOR.instances.scm_ticketDescrScreenEditor)
		}
		if(CKEDITOR.instances.scm_ticketSolScreenEditor){
			CKEDITOR.remove(CKEDITOR.instances.scm_ticketSolScreenEditor)
		}
		if(!Object.isEmpty(this.companySkills))this.companySkills = null;
		if(!Object.isEmpty(this.serviceSkills))this.serviceSkills = null;
	},
	
	/**
	 * @description Initialize the screen: Backend call to get the ticket values, the initialization will be
	 * done by the handler. 
	 * @since 1.0
	 */
	screenInitialize:function(){
		this._backend_getTicketValues();
	},
	/**
	 * @description Initialize the panels (top & middle) of the screen + employee history
	 * @since 1.0
	 */
	_initPanels:function(){
		if(Object.isEmpty(this.screenObject))
		this.screenObject = new scm_ticketScreen_standard_new(this.virtualHtml, 2);
		this._initTopPanel();
		this._initMiddlePanel();
		this.screenObject.addEventOnActionCheckbox();	
		var testNumber = 0;
		if (this.activeEmpSearch === 'affectedEmployee') {
			new PeriodicalExecuter(function(pe){
				testNumber++;
				if (testNumber === 10 || 'scm_ticketApp' !== global.currentApplication.view) {
					pe.stop();
					return;
				}
				if (this.employeeValues.ticketAffEmployee.id === null) 
					return;
				pe.stop();
				this._initEmployeeHistoryPanel(this.employeeValues.ticketAffEmployee.values.get('EMP_ID'), this.employeeValues.ticketAffEmployee.values.get('FIRST_NAME') + ' ' + this.employeeValues.ticketAffEmployee.values.get('LAST_NAME'), this.employeeValues.ticketAffEmployee.values.get('COMPANY_ID'));
			}.bind(this), 1);	
		}else if (this.activeEmpSearch === 'requestor') {
			new PeriodicalExecuter(function(pe){
				testNumber++;
			if (testNumber === 10 || 'scm_ticketApp' !== global.currentApplication.view) {
					pe.stop();
					return;
				}
				if (this.employeeValues.ticketRequestor.id === null) 
					return;
				pe.stop();
				this._initEmployeeHistoryPanel(this.employeeValues.ticketRequestor.values.get('EMP_ID'), this.employeeValues.ticketRequestor.values.get('FIRST_NAME') + ' ' + this.employeeValues.ticketRequestor.values.get('LAST_NAME'), this.employeeValues.ticketRequestor.values.get('COMPANY_ID'));
			}.bind(this), 1);
		}
	},
	/**
	 * @description initialize the top panel of the screen containing the employee search and employee external data
	 * @since 1.0
	 * <br/>Modified in version 1.1:
	 * <ul>
	 * <li>Create the user actions via the factory</li>
	 * </ul>
	 */
	_initTopPanel:function(){
		if(this.enableRequestor == "true"){
			this.employeeValues.ticketRequestor.employeeSearch = ScmEmployeeSearch.factory(this, 'viewTicketsRequestor', false);
			this.employeeValues.ticketRequestor.extension	   = this.employeeValues.ticketRequestor.employeeSearch.getFormDisabled();
			
			this.screenObject.empSearchSpotReq.update();
			this.screenObject.empSearchSpotReq.insert(this.employeeValues.ticketRequestor.extension);				
			this.employeeValues.ticketRequestor.employeeSearch.setFormInitial(this.employeeValues.ticketRequestor.extension, true, hrwEngine.custCompMandatory);
			//since 1.1 Create the user actions via the factory
			this.employeeValues.ticketRequestor.userAction 	   = ScmUserAction.factory(ScmUserAction.DISPLAY_AS_APPLI, this, 'SCM_FindEmpl_viewTicketsRequestor_EMP_ID', $A(['scm_employeeHistory', 'scm_ticketApp', 'scm_editTicket']));
	        this.employeeValues.ticketRequestor.userAction.addActionOnField(this.employeeValues.ticketRequestor.values.get('EMP_ID'), 
																			this.employeeValues.ticketRequestor.values.get('FIRST_NAME') + ' ' + this.employeeValues.ticketRequestor.values.get('LAST_NAME'), 
																			this.employeeValues.ticketRequestor.values.get('COMPANY_ID'), 
																			5, false);
			this.employeeValues.ticketRequestor.builded		   = true;
			this.employeeValues.ticketRequestor.employeeSearch.setValues(this.employeeValues.ticketRequestor.values);
			this.activeEmpSearch = 'requestor';
			this._backend_getRequestorValues();
		}else{
			// HIDE REQUESTOR PANEL AND REQUESTOR LINK
			this.screenObject.empSearchSpotReq.addClassName('SCM_ticket_screen_hidden');
			this.screenObject.requestorLink.addClassName('SCM_ticket_screen_hidden');
			this.screenObject.empSearchSpotAff.removeClassName('SCM_ticket_screen_hidden');
			this.screenObject.affEmployeeLink.removeClassName('application_action_link');
			this.screenObject.affEmployeeLink.stopObserving('click');
			this.activeEmpSearch = 'affectedEmployee';
		}
		this.employeeValues.ticketAffEmployee.employeeSearch = ScmEmployeeSearch.factory(this, 'viewTicketsAffEmployee', false);
		this.employeeValues.ticketAffEmployee.extension	   = this.employeeValues.ticketAffEmployee.employeeSearch.getForm();
		this.screenObject.empSearchSpotAff.update();
		this.screenObject.empSearchSpotAff.insert(this.employeeValues.ticketAffEmployee.extension);				
		this.employeeValues.ticketAffEmployee.employeeSearch.setFormInitial(this.employeeValues.ticketAffEmployee.extension, false, hrwEngine.custCompMandatory);
		//since 1.1 Create the user actions via the factory
		this.employeeValues.ticketAffEmployee.userAction = ScmUserAction.factory(ScmUserAction.DISPLAY_AS_APPLI, this, 'SCM_FindEmpl_viewTicketsAffEmployee_EMP_ID', $A(['scm_employeeHistory', 'scm_ticketApp', 'scm_editTicket']));
        this.employeeValues.ticketAffEmployee.userAction.addActionOnField(	this.employeeValues.ticketAffEmployee.values.get('EMP_ID'), 
																			this.employeeValues.ticketAffEmployee.values.get('FIRST_NAME') + ' ' + this.employeeValues.ticketAffEmployee.values.get('LAST_NAME'), 
																			this.employeeValues.ticketAffEmployee.values.get('COMPANY_ID'),
																			5, false);
		this.employeeValues.ticketAffEmployee.builded		   = true;
		this.employeeValues.ticketAffEmployee.employeeSearch.setValues(this.employeeValues.ticketAffEmployee.values);
		this._backend_getAffEmployeeValues();
		this._disableCompanyChange();
		this._initTopPanelTitle();
	},
	/**
	 * @since 1.0
	 */
	_initTopPanelTitle:function(){
		var widgetTitle = global.getLabel('Employee_details') + ' (';
		if (this.enableRequestor == "true"){
			if (this.employeeValues.ticketRequestor.values.get('COMPANY_ID') == this.employeeValues.ticketAffEmployee.values.get('COMPANY_ID')){
				if (this.employeeValues.ticketRequestor.values.get('EMP_ID') == this.employeeValues.ticketAffEmployee.values.get('EMP_ID')){
					widgetTitle += global.getLabel('requestor') + '/' +global.getLabel('Affected_employee') +':';
					widgetTitle += this.employeeValues.ticketAffEmployee.values.get('FIRST_NAME') + this.employeeValues.ticketAffEmployee.values.get('LAST_NAME');
				}else{
					widgetTitle += global.getLabel('requestor') + ': ';
					widgetTitle += this.employeeValues.ticketRequestor.values.get('FIRST_NAME') + this.employeeValues.ticketRequestor.values.get('LAST_NAME');
					widgetTitle += '/'
					widgetTitle += global.getLabel('Affected_employee') + ': ';
					widgetTitle += this.employeeValues.ticketAffEmployee.values.get('FIRST_NAME') + this.employeeValues.ticketAffEmployee.values.get('LAST_NAME');
				}
			}
		}else{
			widgetTitle += global.getLabel('Affected_employee')+ ': ' + this.employeeValues.ticketAffEmployee.values.get('FIRST_NAME') + ' ' + this.employeeValues.ticketAffEmployee.values.get('LAST_NAME')
		}
		widgetTitle += ')';
		var completeTitle = widgetTitle;
		if(widgetTitle.length > 90){
			widgetTitle = widgetTitle.subsrt(0, 87);
			widgetTitle += '...';
		}
		this.screenObject.updateTopWidgetTitle(widgetTitle, completeTitle);
	},
	
	/**
	 * @description Disbale the field customer of the employee search as the company cannot be changed
	 * @since 1.0
	 */
	_disableCompanyChange:function(){
		this.employeeValues.ticketAffEmployee.employeeSearch.disableCompanySelection();
		if(this.enableRequestor === 'true')
			this.employeeValues.ticketRequestor.employeeSearch.disableCompanySelection();
	},
	/**
	 * @description Calls the methods to initialize the middle panel containing 
	 * 				the ticket values, the previous actions and the editors.
	 * 				This function also calls the backend in order to get the company attributes displayed in the attribute panel
	 * @since 1.0<br>Modified in version 2.0:<ul><li>The flag <i>addServiceAttributes</i> is set to flase. As this flag has been introduce in version 2.0 and should be false for all existing calls before 2.0.</li</ul>
	 */
	_initMiddlePanel:function(){
		this.screenObject.updateMiddleWidgetTitle(global.getLabel('Ticket_details')+ ' (<b>'+this.ticketValues.ticketId+'</b>)');
		this._initMiddlePanelTop();
		this._initMiddlePanelLeft();
		this._initMiddlePanelRight();
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
	 * @description Assign the values of the "top" panel of the middle panel. This is the one containing the ticket values
	 * @since 1.0<br>
	 * Modified in version 2.0:<ul>
	 * 	<li>Add the computation and the display of the remaining time</li>
	 * 	<li>Add the managment of the solved flag</li>
	 * </ul>
	 * <br/> Modified in 1.2:
	 * <ul>
	 * <li>Set encodage for special chars in HTML tags and attributes</li>
	 * </ul>
	 */
	_initMiddlePanelTop:function(){
		// ticket ID
		//this.screenObject.ticketIDSpot.value.update(this.ticketValues.ticketId);
		// creation date
		this.screenObject.ticketCdateSpot.value.update(this.ticketValues.ticketCDate);
		// Subject
		//since 1.2 Set encodage for special chars in HTML tags and attributes
		this.screenObject.ticketSubjectSpot.value.update('<input type="text" class="SCM_ticketScreen_MiddlePanelTop_ticketDescription" value="'+this.ticketValues.ticketSubject.gsub('\"', '&quot;').gsub('\'', '&apos;')+'"></input>');
		// status
		this.screenObject.setTicketStatus(this.ticketValues.ticketStatus, this.ticketValues.ticketType);//ticketStatusSpot.value.update(this.ticketValues.ticketStatus);
		// Due date
		if(this.ticketValues.ticketDDate === null) this.screenObject.ticketDdateSpot.value.update('');
		else this.screenObject.ticketDdateSpot.value.update(SCM_Ticket.convertDateTime(this.ticketValues.ticketDDate));
		// Time remaining
		//since 2.0 Use a constant for the absence of value
		if (this.ticketValues.ticketRtime == HrwEngine.NO_VALUE) {
			this.screenObject.ticketRtimeSpot.value.addClassName('SCM_ticket_screen_hidden');
			this.screenObject.ticketRtimeSpot.label.addClassName('SCM_ticket_screen_hidden');
		} else {
			var hours = parseInt(new Number(this.ticketValues.ticketRtime) / 60);
			var minutes = new Number(this.ticketValues.ticketRtime) - (60 * hours);
			var days = parseInt(hours / 24);
			hours = hours - (days * 24);
			this.screenObject.ticketRtimeSpot.value.update(days + ' ' + global.getLabel('days') + ' ' + hours + ' ' + global.getLabel('hours') + ' ' + minutes + ' ' + global.getLabel('minutes'));
		}
		if(this.ticketValues.ticketSolved == 'true'){
			this.screenObject.ticketMarkSolvedSpot.value.down('[id="scm_ticket_creation_markSolved_check"]').checked = true;
		}else{
			this.screenObject.ticketMarkSolvedSpot.value.down('[id="scm_ticket_creation_markSolved_check"]').checked = false;
		}
	},
	/**
	 * @description This function is in charge of creating the autocompleter of the possible service groups
	 * @param {Array} listOfServiceGroups
	 * @since 1.0
	 */	
	_initServiceGroupDropDown:function(listOfServiceGroups){
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
		
		this._backend_getServices(this.ticketValues.ticketSGId);
		this.screenObject.enlargeServiceGroupsAutocompleter();
	},
	/**
	 * @description This function is in charge of creating the autocompleter of the possible services (depending of the service group selected)
	 * @param {Array} listOfServices
	 * @since 1.0
	 */
	_initServiceDropDown:function(listOfServices){
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
	/**
	 * @description Inintialize the left middle panel containing the previous actions
	 * @since 1.0
	 */
	_initMiddlePanelLeft:function(){
		this._initMiddlePanelLeftPrevActions();
	},
	
	/**
	 * @description Initialize the previous actions panel by creating the object in charge of the previous actions
	 * @since 1.0
	 * <br/>Reviewed in version 1.2:
	 * <ul>
	 * <li>Show all the actions if the "Hide technical actions" is not checked by default
	 * </ul>
	 */
	_initMiddlePanelLeftPrevActions:function(){
		//since 1.2 If the all actions flag is unticked, load all the actions
		this.actionsList = new scm_ticketActions(this.ticketValues.ticketDescription, this.ticketValues.ticketSolution , this.ticketValues.ticketPrevActions, true, !this.screenObject.ticketActionHideTech.value.checked, false);
		this.screenObject.ticketPrevActSpot.value.update();
		this.screenObject.ticketPrevActSpot.value.insert(this.actionsList.container);
		this.actionsList.addActionHeadersListeners(this.screenObject.ticketPrevActSpot.value);
		this.actionsList.addActionsOnTicketActions();
	},
	/**
	 * @description Initialize the right part of the middle panel containing the different editors
	 * @since 1.0
	 */
	_initMiddlePanelRight:function(){
		this._initTypeSelection();
		
		this.screenObject.ticketDescrSpot.value.update();
		this.screenObject.ticketDescrSpot.value.insert('<textarea rows="13" cols="44" name="scm_ticketViewScreenEditor"></textarea>');
		this.screenObject.ticketDescrEditSpot.value.update();
		this.screenObject.ticketDescrEditSpot.value.insert('<textarea rows="13" cols="44" name="scm_ticketEditScreenEditor"></textarea>');
		this.screenObject.ticketDescrDescrSpot.value.update();
		this.screenObject.ticketDescrDescrSpot.value.insert('<textarea rows="13" cols="44" name="scm_ticketDescrScreenEditor"></textarea>');
		this.screenObject.ticketDescrSolSpot.value.update();
		this.screenObject.ticketDescrSolSpot.value.insert('<textarea rows="13" cols="44" name="scm_ticketSolScreenEditor"></textarea>');
		
		this._initEditors();
		this.screenObject.ticketAttrSpot.value.update();
		this.screenObject.hideActionType();
		this.screenObject.hideSendButton();
	},
	/**
	 * @description Initialize the editors using CKEDITOR to replace the different text areas 
	 * @since 1.0
	 * <br/>Modified for 2.1
	 * <ul>
	 * <li>Deactivate the spell checker</li>
	 * </ul>
	 */
	_initEditors:function(){
		CKEDITOR.replace('scm_ticketViewScreenEditor',
			{  	toolbar : [],
				height: '260px',
				resize_enabled: false,
				removePlugins : 'elementspath',
				uiColor: '#dcd2ce',
				toolbarCanCollapse:false  
	    	});
	    //since 2.1 Deactivate the spell checker
		CKEDITOR.replace('scm_ticketEditScreenEditor',
			{ 	toolbar : [['Bold','Italic','Underline','Strike','Format'], ['NumberedList','BulletedList','-','Undo','Redo','-','SelectAll','RemoveFormat'], ['InsertTemplate','InsertSignature', 'AddAttachment','Link','Unlink']/*,['Scayt']*/],
				resize_enabled: false,
				removePlugins : 'elementspath',
				uiColor: '#dcd2ce'/*,
				scayt_autoStartup: true*/
	    	});
		CKEDITOR.replace('scm_ticketDescrScreenEditor',
			{
	        	toolbar : [['Bold','Italic','Underline','Strike','-','Format'], ['Undo','Redo','-','SelectAll','RemoveFormat'], ['NumberedList','BulletedList'],['Link','Unlink'],['Image','HorizontalRule']/*, ['Scayt']*/],
				resize_enabled: false ,
				removePlugins : 'elementspath',
				uiColor: '#dcd2ce'/*,
				scayt_autoStartup: true*/
	    	});
		CKEDITOR.replace('scm_ticketSolScreenEditor',
			{
	        	toolbar : [['Bold','Italic','Underline','Strike','-','Format'],['Undo','Redo','-','SelectAll','RemoveFormat'], ['NumberedList','BulletedList'],['Link','Unlink'],['Image','HorizontalRule']/*,['Scayt']*/],  
				resize_enabled: false,
				removePlugins : 'elementspath',
				uiColor: '#dcd2ce'/*,
				scayt_autoStartup: true*/
	    	});
		CKEDITOR.instances.scm_ticketDescrScreenEditor.setData(this.ticketValues.ticketDescription);
		CKEDITOR.instances.scm_ticketSolScreenEditor.setData(this.ticketValues.ticketSolution);
		
		CKEDITOR.instances.scm_ticketEditScreenEditor.on('instanceReady', function(ev) {
   			CKEDITOR.instances.scm_ticketEditScreenEditor.getCommand('insertSignature').disable();
			CKEDITOR.instances.scm_ticketEditScreenEditor.getCommand('insertTemplate').disable();
			CKEDITOR.instances.scm_ticketEditScreenEditor.getCommand('addAttachment').disable();
		}, this);
		
		CKEDITOR.instances.scm_ticketViewScreenEditor.on('instanceReady', function(ev) {
			CKEDITOR.instances.scm_ticketViewScreenEditor.readOnly(true);
		}, this);
		
		this.currentEditorInstance = {
			id: 'scm_ticketViewScreenEditor',
			object: CKEDITOR.instances.scm_ticketViewScreenEditor
		};
	},
	/**
	 * @description Initialize the attributes panels, the initialization is only done for the company attributes, we'll add the attributes for the service in the created container.
	 * @since 1.0
	 */
	_initCompanyAttributePanel:function(){
		this.screenObject.cleanMiddlePanelRightAttributesForCreate()
		this.screenObject.initMiddlePanelRightAttributesForCreate(this.companySkills);
		this.companySkills.each(function(companySkill){
			this._initAttributeDropDown(companySkill, 'C');
		}.bind(this));
	},
	/**
	 * @description add the service related attributes in the attributes panel
	 * @since 1.0
	 */
	_addServiceAttributePanel:function(){
		this.screenObject.addMiddlePanelRightAttributesForCreate(this.serviceSkills);
		this.serviceSkills.each(function(serviceSkill){
			this._initAttributeDropDown(serviceSkill, 'S');
		}.bind(this));
	},
	/**
	 * 
	 * @since 1.0
	 */
	_makeDueDateChangeable:function(){
		var dynDueDateAllowed = this.allowDDchange;
		if(dynDueDateAllowed === false) return; 
		this.screenObject.ticketDdateSpot.label.addClassName('application_action_link');
		this.screenObject.ticketDdateSpot.label.stopObserving('click');
		this.screenObject.ticketDdateSpot.label.observe('click', this._showDueDatePopupEvent.bindAsEventListener(this));
	},
	/**
	 * @description Function in charge of getting the assigned value of the ticket for a specific attribute id
	 * @param {json} skill
	 * @returns skillId the value of the skill in the ticket
	 * @since 1.0
	 */
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
	/**
	 * @description initialize the attribute drop down with the default skill value (coming from ticket or default value)
	 * @param {json} skill
	 * @param {char} skillType - 'C' for company attribute, 'S' for service attribute
	 * @since 1.0
	 * <br/>Modified in 1.2
	 * <ul>
	 * <li>Remove the old drop down if it exists</li>
	 * </ul>
	 * <br>Modified in version 2.0:<ul><li>Add of the possibility to have read only attributes.</li></ul>
	 */
	_initAttributeDropDown:function(skill, skillType){
		var spotId = 'ticketAtt_'+ skillType + '_' + skill.value.skillTypeId;
		//since 1.2 Overwrite the entry
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
	/**
	 * @description initialize the type of action that will be performed on the ticket in an autocompleter. 
	 * @since 1.0
	 */
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
	 * @description intialize the list of possible custom actions when the user wants to add an action to the ticket
	 * @since 1.0
	 */
	_initActionTypeSelection:function(arrayOfActions){
		this.screenObject.ticketTypeSelectionEditSpot.value.update();
		var json = {autocompleter:{
						object: arrayOfActions,
						multilanguage:{
							no_results:'No results found',
							search:'Search'}
						}
					}
		this.actionTypeSelectionDropDown = new JSONAutocompleter(this.screenObject.ticketTypeSelectionEditSpot.id, {
			events: $H({onResultSelected: 'EWS:scm_showTemplateSelector'}),
			showEverythingOnButtonClick: true,
			timeout: 5000,
			templateResult: '#{text}',
			templateOptionsList: '#{text}'
		}, json);
	},
		
	/**
	 * @param {Object} Id of the employee to display
	 * @param {Object} Name of the employee to display
	 * @description Start the employee history panel if it is not yet for the given employee
	 * @since 1.0
	 */
	_initEmployeeHistoryPanel: function(employeeId, employeeName, employeeCompany) {
		if (Object.isEmpty(employeeId) || employeeId === '') {
			this._cleanEmployeeHistoryPanel();
			return;
		}
		if(this.employeeHistLaunched !== null && this.employeeHistLaunched !== employeeId)
			this._cleanEmployeeHistoryPanel();
		else if(this.employeeHistLaunched !== null)
			return;
		
		//Add the employee history
		global.open($H({
			app: {
				appId: 'HIST_PL',
				tabId: 'SUBAPP'	,
				view : 'scm_employeeHistory'
			},
			keepSubOpened	: true			,
			position		: 'bottom'		,
			closing			: false			,
			withTitle		: false			,
			inWidget		: true			,
			employeeId		: employeeId	,
			employeeName	: employeeName	,
			employeeCompany	: employeeCompany	
		}));
		this.employeeHistLaunched = employeeId;
	},
	
	/**
	 * @description Remove the employee history panel
	 * @since 1.0
	 */
	_cleanEmployeeHistoryPanel: function() {
		if(this.employeeHistLaunched === null) return;
		
		//Remove the employee history
		if(global.currentSubSubApplication && global.currentSubSubApplication.view === 'scm_employeeHistory')
			global.closeSubSubApplication();
		else if(global.currentSubApplication && global.currentSubApplication.view === 'scm_employeeHistory')
			global.closeSubApplication();
		
		this.employeeHistLaunched = null;
	},
	
	/**
	 * @description show the external data in the right container of the top panel
	 * @since 1.0 
	 */
	_showTopRightContainerValue:function(){
		var objectActive;
		if (this.activeEmpSearch == 'affectedEmployee'){
			objectActive = this.employeeValues.ticketAffEmployee;
		}else{
			objectActive = this.employeeValues.ticketRequestor;
		}

		this.screenObject.dynCompInfoSpot.update();
		this.screenObject.dynCompInfoSpot.insert(objectActive.dynCompInfo.get(objectActive.defDynCompInfo));
	},
	/**
	 * 
	 * 
	 * @param {Object} action
	 * @param {Object} withButtons
	 * @returns {String} textToDisplay
	 * @since 1.0
	 * <br/>Modifications for 2.1:
	 * <ul>
	 * <li>Use the standard encoding before sending to HRW</li>
	 * </ul>
	 */
	_buildTextForEditor:function(action, withButtons){
		var textToDisplay='';
		var addDescr = true;
		textToDisplay += '<b>' + global.getLabel('Action') + ' ' + action.TicketActionId + '</b><br/>';
		var dateTime;
		typeof(action.DueDate) != 'object' ? dateTime = SCM_Ticket.convertDateTime(action.DueDate) : dateTime = SCM_Ticket.convertDateTime(action.CompletedTime);
		textToDisplay += dateTime + '<br/>';
		textToDisplay += '<b>' + global.getLabel('Action_Type') + ':</b> ' + global.getLabel('SCM_Action_' + action.Type);
		if (action.Type == 12) {
			textToDisplay += ' -->' + this._determineCustomActionText(action.CustomActionType) + '';
		}else if(action.Type == 10){
			addDescr = false;
			textToDisplay += '<br/><br/><img src="css/images/autocompleter/autocompleter-ajax-loader.gif"/> Loading mail';
			this._backend_getTicketItemEmailPreview(action.RelatedTicketItemId);
		}
		if (addDescr) {
			textToDisplay += '<br/>';
			if (action.Description) {
				//since 2.1 Use the standard encoding
				textToDisplay += HrwRequest.decode(action.Description) + '<br/>';
			}
		}
		return textToDisplay;
	},
	/**
	 * @description display the content of an action in the appropriate editor and switch to this editor
	 * @param {json} action
	 * @since 1.0
	 */
	_displayActionInEditor:function(action){
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
	/**
	 * @description display the content of an action in the appropriate editor and switch to this editor
	 * @param {json} action
	 * @since 1.0
	 */
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
	 * @description Function in charge of returning the text associated to the custom action type id given in parameter
	 * @param {int} customActionId
	 * @returns {string} value the text associated to the custom action type
	 * @since 1.0
	 */
	_determineCustomActionText:function(customActionId){
		var value = '';
		this.ticketAction_actionsTypes.each(function(actionType){
			if(actionType.data == customActionId){
				value = actionType.text;
				return;
			}
		}.bind(this));
		if (value == ''){
			this.ticketAction_ewsInfo.each(function(actionType){
				if(actionType.data == customActionId){
					value = actionType.text;
					return;
				}
			}.bind(this));
		}
		if (value == ''){
			this.ticketAction_ewsNotif.each(function(actionType){
				if(actionType.data == customActionId){
					value = actionType.text;
					return;
				}
			}.bind(this));
		}
		if (value == ''){
			this.ticketAction_ewsDocument.each(function(actionType){
				if(actionType.data == customActionId){
					value = actionType.text;
					return;
				}
			}.bind(this));
		}
		if (value == ''){
			this.ticketAction_ewsApproval.each(function(actionType){
				if(actionType.data == customActionId){
					value = actionType.text;
					return;
				}
			}.bind(this));
		}
		return value;
	},
	
	/**
	 * @description Function that builds the array used for the pending reasons. These reasons are in the hrwEngine object and loaded at login.
	 * @since 1.0
	 */
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
	},
	
	/**
	 * @description Function in charge of building the autocompleter containing the possible grouping skills for the company  
	 * @since 1.0
	 */
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
	/**
	 * @description hide the grouping skill container if the company does not use the grouping skill (based on company settings)
	 * @since 1.0
	 */
	_hideGroupingSkills:function(){
		this.screenObject.ticketCompanyGroupingSpot.value.addClassName('SCM_ticket_screen_hidden')
	},
	/**
	 * @description Check the validity of the ticket depending of the action performed (close or save)
	 * @returns {json} a Json object conatining: the validity flag (true or false) and the list of element in error
	 * @since 1.0
	 * <br/>Modified for version 1.2:
	 * <ul>
	 * <li>If the service is a negative number, set it as an error</li>
	 * <li>If a skill is in the company skills and the services skill, it stay only once</li>
	 * <li>If a skill value is a read only field, get its default value</li>
	 * </ul>
	 */
	_checkValidity:function(){
		var validityFlag = true;
		var errorEntries = $A();
		this.skillsWithValues = $A();
		if (this.enableRequestor == "true") {
			// requestor ID
			if (this.employeeValues.ticketRequestor.employeeSearch.getValues('EMP_ID') == null || Object.isEmpty(this.employeeValues.ticketRequestor.employeeSearch.getValues('EMP_ID'))) {
				errorEntries.push({
					element: 'requestor employeeSearch'
				});
				validityFlag = false;
			}
		}
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
		if(Object.isEmpty(this.selectedService) && this.selectedService < 0){
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
		if (this.companySkills) {
			this.companySkills.each(function(skill){
				//since 1.2 If the field is also in service skills, nothing to check here
				if(this.serviceSkills.get(skill.key)) return;
				var skillWValue = {skillId: null, value:null, mandatory:skill.value.mandatoryOpen, type:'C'};
				skillWValue.skillId = skill.value.skillTypeId;
				//since 1.2 If there is a single value, indicate it
				var skillACValues;
				if(skill.value.autoCompleter) {
					if(skill.value.autoCompleter.getValue())
						skillACValues = skill.value.autoCompleter.getValue().idAdded;
				} else 
					skillACValues = skill.value.skillId;
					
				if (skillACValues) skillWValue.value = skillACValues;
				this.skillsWithValues.push(skillWValue);
			}.bind(this));
		}
		if (this.serviceSkills) {
			this.serviceSkills.each(function(skill){
				var skillWValue = {skillId: null, value:null, mandatory:skill.value.mandatoryOpen, type:'S'};
				skillWValue.skillId = skill.value.skillTypeId;
				//since 1.2 If there is a single value, indicate it
				var skillACValues;
				if(skill.value.autoCompleter) {
					if(skill.value.autoCompleter.getValue())
						skillACValues = skill.value.autoCompleter.getValue().idAdded;
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
	 * @desription Function in charge of determining the DOM element of the screen corresponding to the error 
	 * @param {json} error the error element
	 * @returns {json} a json object containing the DOM element and the label to display in the popup corresponding to that element
	 * @since 1.0
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
	
	/**
	 * @description Function in charge of calling the backend in order to save the ticket. 
	 * 				It first check if the required fields are filled in before saving the ticket.
	 * 				If a required field is missing, it is added in a HTML string that will be displayed in a popup.
	 * @since 1.0<br>
	 * Modified in version 2.0:<ul>
	 * 	<li>Managment of the solved flag</li>
	 * </ul>
	 */
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
	 * @description Add a custom action to a ticket.
	 * @since 1.0
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
							//since 2.0 Use a constant for the absence of value
							privacySkillId	: HrwEngine.NO_VALUE,
							timeSpent		: '1'
					 	 }
			var xmlAction = new hrw_customActionsObject(values).toXml();
			this._backend_addCustomAction(xmlAction);
		}		
	},
	/**
	 * @description Apply a class to a given element that displays teh element in red.
	 * @param {DOM Object} element
	 * @since 1.0
	 */
	_setElementOnError:function(element){
		element.addClassName('SCM_ticketCreate_elemOnError');
	},
	/**
	 * @description Loops at the list of error elements and remove the class that display the said element in red
	 * @since 1.0
	 * <br/>Modified for 1.2
	 * <ul>
	 * <li>If there is no error, nothing to do.</li>
	 * </ul>
	 */
	_unsetElementsOnError:function(){
		//since 1.2 If threre are no errors, don't do the loop
		if(Object.isEmpty(this.errorElements)) return;
		this.errorElements.each(function(element){
			element.removeClassName('SCM_ticketCreate_elemOnError');
		});
	},
	/**
	 * @description Convert the ticket object into an XML that can be understood by the backend
	 * @since 1.0
	 * <br/>Modifications for 2.1:
	 * <ul>
	 * <li>Use the standard encoding before sending to HRW</li>
	 * </ul>
	 * <br/>Modified in version 2.0:<ul>
	 * 	<li>Add of the solved flag in the json object with the ticket values used for XML generation</li>
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
			description = description.gsub('<p>', '');
			description = description.gsub('</p>', '');
			description = description.gsub('&nbsp;', '');
			var solution = CKEDITOR.instances.scm_ticketSolScreenEditor.getData().gsub('<br>', '<br/>');
			solution = solution.gsub('<p>', '');
			solution = solution.gsub('</p>', '');
			solution = solution.gsub('&nbsp;', '');
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
				solved: this.ticketValues.ticketSolved
			};
			//Add the dynamic due date if it exists
			if(this.ticketValues.ticketDDate !== this.ticketValues.ticketStaticDDate)
				jsonValues.dueDateDyn = this.ticketValues.ticketDDate;
				
			this.hrwTicketXml = new hrwTicketObject(jsonValues, true).toXml(withID);
			this.hrwTicketSkillsXml = new hrw_ticketSkillsObject(this.skillsWithValues).toXml();
	},
	/**
	 * @description function called when a service group is changed in order to reload the list of associated services.
	 * @param {Object} memo
	 * @since 1.0
	 */
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
	/**
	 * @description Function called when a service has been chosen in order to load the associated attributes
	 * @param {Object} memo
	 * @since 1.0
	 */
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
	/**
	 * @description Function in charge of performing the desired action on a ticket (take in processing, set to pending, ...)
	 * 				This method determines which service should be called (and which parameters should be set) for the desired action
	 * @param {json} args
	 * @since 1.0
	 */
	_performActionOnTicketEvent:function(args){
		var callParameters = $H({
			scAgentId: hrwEngine.scAgentId
		});
		switch(this.actionPerformed){
			case 1:	// set to pending
						callParameters.set('ticketId', this.ticketValues.ticketId);
						callParameters.set('description', args.description);
						callParameters.set('pendingReasonId', args.pendingReasonId);
						break;
			case 2:	// set to waiting
						callParameters.set('ticketId', this.ticketValues.ticketId);
						callParameters.set('description', args.description);
						break;
						
			case 3:	// set to general pool
						callParameters.set('ticketId', this.ticketValues.ticketId);
						callParameters.set('description', args.description);
						break;
			case 4:	// schedule ticket
						callParameters.set('ticketId', this.ticketValues.ticketId);
						callParameters.set('scheduleTime', args.scheduleTime);
						callParameters.set('description', args.description)
						switch(args.serviceToCall){
							case 'ScheduleTicket':	break;
							case 'ScheduleTicketToAgent':	
													callParameters.set('scheduleAgentId', args.scheduleAgentId);
													break;
							case 'ScheduleTicketPending':
													callParameters.set('pendingReasonId', args.pendingReasonId);
													break;
							case 'ScheduleTicketToAgentPending':
													callParameters.set('scheduleAgentId', args.scheduleAgentId);
													callParameters.set('pendingReasonId', args.pendingReasonId);
													break;	
						}
						break;
			case 5:	//send ticket to --> assign ticket
						callParameters.set('ticketId', this.ticketValues.ticketId);
						callParameters.set('description', args.description)
						if (args.serviceToCall == 'AssignTicketToAgent'){
							callParameters.set('assignedAgentId', args.assignedAgentId);
						}else{
							callParameters.set('groupingSkillId', args.assignedAgentId);
						}
						break;
			case 6:	// Add document to ticket
						
						
			
			
						break;
			case 7:	// save
						callParameters.set('ticket', this.hrwTicketXml);
						callParameters.set('ticketSkillIds', this.hrwTicketSkillsXml)
						break;
			case 8:	// close
						callParameters.set('ticketId', this.ticketValues.ticketId);
						callParameters.set('mailFrom', args.mailFrom);
						callParameters.set('mailTo', args.mailTo);
						break;
		};
		this._backend_performActionOnTicket(args.serviceToCall, callParameters);
	},
	/**
	 * @description Function in charge of reloading the tickets values after saving and
	 * 				updating the parts of the screen that can be changed (previous actions, due date,...).
	 * @param {json} json
	 * @since 1.0
	 * <br/>Modifications for 2.1:
	 * <ul>
	 * <li>Use the standard encoding before sending to HRW</li>
	 * </ul>
 	 * <br/>Modified in version 2.0:
 	 * <ul><li>Retrieve the remaining time to close the ticket</li>
 	 * <li>Management of the solved flag</li>
 	 * </ul>
	 */
	_updateScreen:function(json){
		//	Affected employee values
		//since 1.2 The company to display could be the customer or the company
		this.employeeValues.ticketAffEmployee.compId = json.EWS.HrwResponse.HrwResult.HrwTicket.CompanySkillId;	
		this.employeeValues.ticketAffEmployee.values.set('COMPANY_ID'	, (json.EWS.HrwResponse.HrwResult.HrwTicket.CustomerSkillId)?json.EWS.HrwResponse.HrwResult.HrwTicket.CustomerSkillId:json.EWS.HrwResponse.HrwResult.HrwTicket.CompanySkillId);
		this.employeeValues.ticketAffEmployee.values.set('COMPANY'		, (json.EWS.HrwResponse.HrwResult.HrwTicket.CustomerName)?json.EWS.HrwResponse.HrwResult.HrwTicket.CustomerName:json.EWS.HrwResponse.HrwResult.HrwTicket.CompanyName);
		this.employeeValues.ticketAffEmployee.values.set('EMP_ID'		, json.EWS.HrwResponse.HrwResult.HrwTicket.EmployeeId);
		this.employeeValues.ticketAffEmployee.values.set('LAST_NAME'	, json.EWS.HrwResponse.HrwResult.HrwTicket.EmployeeLastName);
		this.employeeValues.ticketAffEmployee.values.set('FIRST_NAME'	, json.EWS.HrwResponse.HrwResult.HrwTicket.EmployeeFirstName);
		//since 1.2 Replace the user client by the main company
		document.fire('EWS:SCM_ticketApp_AddParam', {name: 'company', value: this.companySkillId});
		//	Requestor values if needed
		if (this.enableRequestor == "true"){
			//since 1.2 The company to display could be the customer or the company
			this.employeeValues.ticketRequestor.compId = json.EWS.HrwResponse.HrwResult.HrwTicket.CompanySkillId;	
		   	this.employeeValues.ticketRequestor.values.set('COMPANY_ID'	, (json.EWS.HrwResponse.HrwResult.HrwTicket.CustomerSkillId)?json.EWS.HrwResponse.HrwResult.HrwTicket.CustomerSkillId:json.EWS.HrwResponse.HrwResult.HrwTicket.CompanySkillId);
			this.employeeValues.ticketRequestor.values.set('COMPANY'		, (json.EWS.HrwResponse.HrwResult.HrwTicket.CustomerName)?json.EWS.HrwResponse.HrwResult.HrwTicket.CustomerName:json.EWS.HrwResponse.HrwResult.HrwTicket.CompanyName);
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
			this.ticketValues.ticketDDate		= json.EWS.HrwResponse.HrwResult.HrwTicket.DueDateDyn;
		}else if(typeof(json.EWS.HrwResponse.HrwResult.HrwTicket.DueDate)!= "object"){
			this.ticketValues.ticketDDate		= json.EWS.HrwResponse.HrwResult.HrwTicket.DueDate;
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
		else this.screenObject.ticketDdateSpot.value.update(SCM_Ticket.convertDateTime(this.ticketValues.ticketDDate));
		// 2.0 Retrieving the remaining time
		this.ticketValues.ticketRtime       = json.EWS.HrwResponse.HrwResult.HrwTicket.RemainingBusinessMinutes;
		// Time remaining
		//since 2.0 Use a constant for the absence of value
		if(this.ticketValues.ticketRtime == HrwEngine.NO_VALUE){
			this.screenObject.ticketRtimeSpot.value.addClassName('SCM_ticket_screen_hidden');
			this.screenObject.ticketRtimeSpot.label.addClassName('SCM_ticket_screen_hidden');
		}else{
			var hours = parseInt(new Number(this.ticketValues.ticketRtime)/60);
			var minutes = new Number(this.ticketValues.ticketRtime) -(60*hours);
			var days = parseInt(hours/24);
			hours = hours -(days*24);
			this.screenObject.ticketRtimeSpot.value.update(days + ' ' + global.getLabel('days')+ ' ' +hours + ' ' + global.getLabel('hours')+ ' ' + minutes + ' ' + global.getLabel('minutes'));
		}
		// update actions
		//since 1.2 If the all actions flag is unticked, load all the actions
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
	/**
	 * @since 1.0
	 */
	_duplicateTicket:function(){
		this._backend_duplicateTicket();
	},
		
/*----------------------------------------------------------------------------------------------
 * 								BACKEND CALLS FUNCTIONS 
 *--------------------------------------------------------------------------------------------*/    	
	/**
	 * @description Function performing a backend call to get the ticket values
	 * @since 1.0
	 */
	_backend_getTicketValues:function(){
		hrwEngine.callBackend(this, 'Ticket.GetTicketByIdForDisplay', $H({
	        scAgentId : hrwEngine.scAgentId,
	        ticketId  : this.ticketValues.ticketId
	    }), 'getTicketValuesHandler');
	},
	/**
	 * @description Function performing a backend call to get the affected employee values
	 * @since 1.0
	 */
	_backend_getAffEmployeeValues:function(){
		hrwEngine.callBackend(this, 'Backend.SearchByEmployeeId', $H({
				scAgentId 		: hrwEngine.scAgentId,
				onExistingTicket: true,
				employeeId		: this.employeeValues.ticketAffEmployee.values.get('EMP_ID'),
				clientSkillId	: this.employeeValues.ticketAffEmployee.compId
			}), 'getAffEmployeeValuesHandler');
	},
	/**
	 * @description Function performing a backend call to get the requestor values
	 * @since 1.0
	 */
	_backend_getRequestorValues:function(){
		hrwEngine.callBackend(this, 'Backend.SearchByEmployeeId', $H({
				scAgentId 		: hrwEngine.scAgentId,
				onExistingTicket: true,
				employeeId		: this.employeeValues.ticketRequestor.values.get('EMP_ID'),
				clientSkillId	: this.employeeValues.ticketRequestor.compId
			}), 'getRequestorValuesHandler');
	},
	/**
	 * @description Function performing a backend call to get the external data about an employee
	 * @since 1.0
	 */
	_backend_getTopRightContent:function(currentEmployee){
		var selectedCompId;
		var employeeId;
		if (currentEmployee == 'affectedEmployee' ){
			selectedCompId = this.employeeValues.ticketAffEmployee.compId;
			employeeId = this.employeeValues.ticketAffEmployee.id;
		}else{
			selectedCompId = this.employeeValues.ticketRequestor.compId;
			employeeId = this.employeeValues.ticketRequestor.id;
		}
		hrwEngine.callBackend(this, 'Backend.GetDynamicCompanyInfo', $H({
				scAgentId		: hrwEngine.scAgentId,
				clientSkillId	: selectedCompId,
				employeeId		: employeeId,
				onExistingTicket: true
			}), this.getTopRightContentHandler.bind(this, currentEmployee));
	},
	/**
	 * @description Function performing a backend call to perform an action on a ticket
	 * @since 1.0
	 */
	_backend_performActionOnTicket:function(service, parameters){
		hrwEngine.callBackend(this, 'Ticket.'+service , parameters, 'actionPerformedHandler');
	},
	/**
	 * @since 1.0
	 */
	_backend_duplicateTicket:function(){
		hrwEngine.callBackend(this, 'Ticket.DuplicateTicket', $H({
			scAgentId		: hrwEngine.scAgentId,
			ticketId		: this.ticketValues.ticketId
		}), 'actionPerformedHandler' )
	},
	/**
	 * @description Function performing a backend call to get the list of service groups
	 * @since 1.0
	 */
	_backend_getServiceGroups:function(){
		//since 2.0 The backend function changed of name
		hrwEngine.callBackend(this, 'Admin.CollectServiceGroups', $H({
	        scAgentId           : hrwEngine.scAgentId,
			CompanySkillId		: this.companySkillId
		}), 'getServiceGroupsHandler');
	},
	/**
	 * @description Function performing a backend call to get the list of services
	 * @since 1.0
	 */
	_backend_getServices:function(serviceGroup){
		//since 2.0 The backend function changed of name
		hrwEngine.callBackend(this, 'Admin.CollectServices', $H({
				scAgentId: hrwEngine.scAgentId,
				CompanySkillId: this.companySkillId,
				serviceGroupId: serviceGroup
			}), 'getServicesHandler');
	},
	/**
	 * @description Function performing a backend call to get the attributes linked to the company
	 * @since 1.0
	 * <br/>Modified in 1.2:
	 * <ul>
	 * <li>Call the service to get the list of all services in any case (no more the dependant or independant services)</li>
	 * </ul>
	 */
	_backend_getPossibleCompanyAttributes:function(){
		//since 1.2 Call the unique HRW method to get the list of skills
		hrwEngine.callBackend(this, 'Admin.CollectSkillsBySkillType', $H({
			scAgentId		: hrwEngine.scAgentId,
			clientSkillId	: this.employeeValues.ticketAffEmployee.compId,
			employeeId		: this.employeeValues.ticketAffEmployee.id,
			//since 2.0 Use a constant for the absence of value
			serviceSkillId	: (Object.isEmpty(this.selectedService) || this.selectedService <= 0)? HrwEngine.NO_VALUE : this.selectedService
		}), 'getPossibleCompanyAttributesHandler');
	},
	/**
	 * @description Function performing a backend call to get the attributes linked to the selected service
	 * @since 1.0
	 * <br/>Modified in 1.2:
	 * <ul>
	 * <li>Call the service to get the list of all services in any case (no more the dependant or independant services)</li>
	 * </ul>
	 */
	_backend_getPossibleServiceAttributes:function(){
		//since 1.2 Call the unique HRW method to get the list of skills
		hrwEngine.callBackend(this, 'Admin.CollectSkillsBySkillType', $H({
			scAgentId		: hrwEngine.scAgentId,
			clientSkillId	: this.employeeValues.ticketAffEmployee.compId,
			employeeId		: this.employeeValues.ticketAffEmployee.id,
			serviceSkillId	: this.selectedService
		}), 'getPossibleServiceAttributesHandler');
	},
	/**
	 * @description Function performing a backend call to get the mail content when a mail should be sent on closure
	 * @since 1.0
	 */
	_backend_showMailPopupBeforeClosure:function(){
		hrwEngine.callBackend(this, 'Email.GetEmailPreviewAfterClosure', $H({
			scAgentId		: hrwEngine.scAgentId,
			ticketID		: this.ticketValues.ticketId
		}),'showMailBeforeClosurePopupHandler');
	},
	/**
	 * @description Function performing a backend call to add a custom action
	 * @param {Object} action
	 * @since 1.0
	 */
	_backend_addCustomAction:function(action){
		hrwEngine.callBackend(this, 'Ticket.AddCustomTicketAction', $H({
			scAgentId		: hrwEngine.scAgentId,
			customTicketAction: action
		}),'addCustomActionHandler');
	},
	
	/**
	 * @description Function performing a backend call to get the mail preview when a mail has to be sent
	 * @since 1.0
	 */
	_backend_getSendMailPreview:function(){
		hrwEngine.callBackend(this, 'Email.GetSendEmailPreview', $H({
			scAgentId	: hrwEngine.scAgentId,
			ticketID	: this.ticketValues.ticketId
		}), 'getSendMailPreviewHandler')
	},
	/**
	 * 
	 * @param {Object} xmlEmail
	 * @since 1.0
	 */
	_backend_sendEmail:function(xmlEmail){
		hrwEngine.callBackend(this, 'Email.SendEmail', $H({
			scAgentId		: hrwEngine.scAgentId,
			ticketID		: this.ticketValues.ticketId,
			sendEmail		: xmlEmail
		}), 'emailSentHandler');
	},
	/**
	 * 
	 * @param {Object} actionItemId
	 * @since 1.0
	 */
	_backend_getTicketItemEmailPreview:function(actionItemId){
		hrwEngine.callBackend(this, 'Email.GetTicketItemEmailPreview', $H({
			scAgentId		: hrwEngine.scAgentId,
			ticketID		: this.ticketValues.ticketId,
			ticketItemId	: actionItemId
		}), 'getTicketItemEmailPreviewHandler');
	},


/*----------------------------------------------------------------------------------------------
 * 								CALLS RESPONDER FUNCTIONS 
 *--------------------------------------------------------------------------------------------*/    
	/**
	 * @description Handler function for the backend call to get the values.
	 * 				it initialize the ticket values of the class and calls the intialization of the panels
	 * @param {json} json
	 * @since 1.0
	 * <br/>Modifications for 2.1:
	 * <ul>
	 * <li>Use the standard encoding before sending to HRW</li>
	 * </ul>
 	 * <br/>Modified in version 2.0:
 	 * <ul><li>Retrieve the remaining time to close the ticket</li>
 	 * <li>Retrieve the solved flag</li></ul>
	 */
 	getTicketValuesHandler:function(json){
		//------> COMPANY SETTINGS	
		//	pending reasons
		var pendingReasons = objectToArray(json.EWS.HrwResponse.HrwResult.HrwTicketForDisplay.CompanySettings.PendingReasons.KeyValue);
		this.pendingReasons = $A();
		pendingReasons.each(function(pendingReason){
			this.pendingReasons.push({data: pendingReason.Key, text:pendingReason.Value});
		}.bind(this));
		
		//since 1.2 Load the company id
		this.companySkillId = json.EWS.HrwResponse.HrwResult.HrwTicketForDisplay.CompanySettings.CompanySkillId;
		
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
		var ewsnotif    = false;
		var ewsinfo     = false;
		var ewsdocument = false;
		var ewsapproval = false;
		//since 1.2 Avoid dump if there is no custom action types
		var customActionTypes = $A();
		if(json.EWS.HrwResponse.HrwResult.HrwTicketForDisplay.CompanySettings.CustomActionTypes && json.EWS.HrwResponse.HrwResult.HrwTicketForDisplay.CompanySettings.CustomActionTypes.CustomActionType)
			customActionTypes = objectToArray(json.EWS.HrwResponse.HrwResult.HrwTicketForDisplay.CompanySettings.CustomActionTypes.CustomActionType);
		this.ticketAction_actionsTypes = $A();
		this.ticketAction_ewsInfo = $A();
		this.ticketAction_ewsNotif = $A();
		this.ticketAction_ewsDocument = $A();
		this.ticketAction_ewsApproval = $A();
		customActionTypes.each(function(actionType){
			if (Object.isEmpty(actionType.EwsInboxActionType)) {
				this.ticketAction_actionsTypes.push({
					data: actionType.CustomActionTypeId,
					text: actionType.CustomActionName,
					value: actionType.PredefinedText,
					type: actionType.EwsInboxActionType
				});
			}else{
				if (actionType.EwsInboxActionType === 'I') {
					this.ticketAction_ewsInfo.push({
						data: actionType.CustomActionTypeId,
						text: actionType.CustomActionName,
						value: actionType.PredefinedText,
						type: actionType.EwsInboxActionType
					});
					ewsinfo = true;
				}else if (actionType.EwsInboxActionType === 'M') {
					this.ticketAction_ewsNotif.push({
						data: actionType.CustomActionTypeId,
						text: actionType.CustomActionName,
						value: actionType.PredefinedText,
						type: actionType.EwsInboxActionType
					});
					ewsnotif = true;
				}else if (actionType.EwsInboxActionType === 'D') {
					this.ticketAction_ewsDocument.push({
						data: actionType.CustomActionTypeId,
						text: actionType.CustomActionName,
						value: actionType.PredefinedText,
						type: actionType.EwsInboxActionType
					});
					ewsdocument = true;
				}else if (actionType.EwsInboxActionType === 'V') {
					this.ticketAction_ewsApproval.push({
						data: actionType.CustomActionTypeId,
						text: actionType.CustomActionName,
						value: actionType.PredefinedText,
						type: actionType.EwsInboxActionType
					});
					ewsapproval = true;
				}
			}
		}.bind(this));
		//	mail options
		this.sendMailAfterClose = {visible: json.EWS.HrwResponse.HrwResult.HrwTicketForDisplay.CompanySettings.SendMailAfterCloseVisible,
		    					   checked: json.EWS.HrwResponse.HrwResult.HrwTicketForDisplay.CompanySettings.SendMailAfterCloseChecked };
		//	Grouping options
		if(json.EWS.HrwResponse.HrwResult.HrwTicketForDisplay.CompanySettings.DefaultGroupingSkillId != "-2147483648"){
			this.groupingSkills = objectToArray(json.EWS.HrwResponse.HrwResult.HrwTicketForDisplay.CompanySettings.GroupingSkills.KeyValue);	
			this.groupingSkillAssigned = json.EWS.HrwResponse.HrwResult.HrwTicketForDisplay.HrwTicket.GroupingSkillId;
		}else{
			this.groupingSkillAssigned = "-1";
		}
		//	Enable requestor
		this.enableRequestor = json.EWS.HrwResponse.HrwResult.HrwTicketForDisplay.CompanySettings.EnableSecondaryEmployeeField;

//		if (this.enableRequestor == "true") 
//			this.ticketActionTypes.push({data: "1", text: global.getLabel('Send_Req_to_req_inbox')});
		
//		this.ticketActionTypes.push({data:"2", text: global.getLabel('Send_Req_to_emp_inbox')});
		this.ticketActionTypes.push({data:"3", text: global.getLabel('Send_email')});
		this.ticketActionTypes.push({data:"4", text: global.getLabel('Add_tiact')});
		if(ewsnotif === true) this.ticketActionTypes.push({data:"5", text: global.getLabel('notif_employee')});
		if(ewsinfo  === true) this.ticketActionTypes.push({data:"6", text: global.getLabel('info_employee')});
		//if(ewsdocument  === true) this.ticketActionTypes.push({data:"7", text: global.getLabel('document_employee')});
		if(ewsapproval  === true) this.ticketActionTypes.push({data:"8", text: global.getLabel('approval_employee')});
		
		// DUE DATE CHANGE
		json.EWS.HrwResponse.HrwResult.HrwTicketForDisplay.CompanySettings.EnableDueDateDyn == "false"?this.allowDDchange = false:this.allowDDchange = true;
		
		//------> TICKETS VALUES
		//	Affected employee values
		this.employeeValues.ticketAffEmployee.compId = json.EWS.HrwResponse.HrwResult.HrwTicketForDisplay.HrwTicket.CompanySkillId;
		//since 1.2 The company to display could be the customer or the company	
		this.employeeValues.ticketAffEmployee.values.set('COMPANY_ID'	, (json.EWS.HrwResponse.HrwResult.HrwTicketForDisplay.CompanySettings.IsCustomerConfiguration === "true")?json.EWS.HrwResponse.HrwResult.HrwTicketForDisplay.HrwTicket.CustomerSkillId:json.EWS.HrwResponse.HrwResult.HrwTicketForDisplay.HrwTicket.CompanySkillId);
		this.employeeValues.ticketAffEmployee.values.set('COMPANY'		, (json.EWS.HrwResponse.HrwResult.HrwTicketForDisplay.CompanySettings.IsCustomerConfiguration === "true")?json.EWS.HrwResponse.HrwResult.HrwTicketForDisplay.HrwTicket.CustomerName:json.EWS.HrwResponse.HrwResult.HrwTicketForDisplay.HrwTicket.CompanyName);
		this.employeeValues.ticketAffEmployee.values.set('EMP_ID'		, json.EWS.HrwResponse.HrwResult.HrwTicketForDisplay.HrwTicket.EmployeeId);
		this.employeeValues.ticketAffEmployee.values.set('LAST_NAME'	, json.EWS.HrwResponse.HrwResult.HrwTicketForDisplay.HrwTicket.EmployeeLastName);
		this.employeeValues.ticketAffEmployee.values.set('FIRST_NAME'	, json.EWS.HrwResponse.HrwResult.HrwTicketForDisplay.HrwTicket.EmployeeFirstName);
		//since 1.2 Replace the user customer by the company
		document.fire('EWS:SCM_ticketApp_AddParam', {name: 'company', value: this.companySkillId});
		//	Requestor values if needed
		if (this.enableRequestor == "true"){
			this.employeeValues.ticketRequestor.compId = json.EWS.HrwResponse.HrwResult.HrwTicketForDisplay.HrwTicket.CompanySkillId;
			//since 1.2 The company to display could be the customer or the company	
		    this.employeeValues.ticketRequestor.values.set('COMPANY_ID'	, (json.EWS.HrwResponse.HrwResult.HrwTicketForDisplay.CompanySettings.IsCustomerConfiguration === "true")?json.EWS.HrwResponse.HrwResult.HrwTicketForDisplay.HrwTicket.CustomerSkillId:json.EWS.HrwResponse.HrwResult.HrwTicketForDisplay.HrwTicket.CompanySkillId);
		    this.employeeValues.ticketRequestor.values.set('COMPANY', (json.EWS.HrwResponse.HrwResult.HrwTicketForDisplay.CompanySettings.IsCustomerConfiguration === "true")?json.EWS.HrwResponse.HrwResult.HrwTicketForDisplay.HrwTicket.CustomerName:json.EWS.HrwResponse.HrwResult.HrwTicketForDisplay.HrwTicket.CompanyName);
			this.employeeValues.ticketRequestor.values.set('EMP_ID', json.EWS.HrwResponse.HrwResult.HrwTicketForDisplay.HrwTicket.SecEmployeeId);
			this.employeeValues.ticketRequestor.values.set('LAST_NAME', json.EWS.HrwResponse.HrwResult.HrwTicketForDisplay.HrwTicket.SecEmployeeLastName);
			this.employeeValues.ticketRequestor.values.set('FIRST_NAME', json.EWS.HrwResponse.HrwResult.HrwTicketForDisplay.HrwTicket.SecEmployeeFirstName);
		}
		// type
		this.ticketValues.ticketType		= json.EWS.HrwResponse.HrwResult.HrwTicketForDisplay.HrwTicket.Type;
		// status
		this.ticketValues.ticketStatus 		= json.EWS.HrwResponse.HrwResult.HrwTicketForDisplay.HrwTicket.Status;
		// subject
		if (!Object.isEmpty(json.EWS.HrwResponse.HrwResult.HrwTicketForDisplay.HrwTicket.ShortDescription)){
			//since 2.1 Use the standard encoding
			this.ticketValues.ticketSubject		= HrwRequest.decode(json.EWS.HrwResponse.HrwResult.HrwTicketForDisplay.HrwTicket.ShortDescription);
		}else{
			this.ticketValues.ticketSubject		= global.getLabel('SCM_no_subject').escapeHTML();
		}
		// description
		this.ticketValues.ticketDescription = json.EWS.HrwResponse.HrwResult.HrwTicketForDisplay.HrwTicket.Description;
		// solution
		this.ticketValues.ticketSolution	= json.EWS.HrwResponse.HrwResult.HrwTicketForDisplay.HrwTicket.Solution;
		// creation date
		this.ticketValues.ticketCDate		= SCM_Ticket.convertDateTime(json.EWS.HrwResponse.HrwResult.HrwTicketForDisplay.HrwTicket.CreationDateTime); 
		// current agent
		this.ticketValues.ticketCurrAgent	= json.EWS.HrwResponse.HrwResult.HrwTicketForDisplay.HrwTicket.CurrentAgentId;
		// due date
		if(!Object.isEmpty(json.EWS.HrwResponse.HrwResult.HrwTicketForDisplay.HrwTicket.DueDateDyn) &&
		            typeof(json.EWS.HrwResponse.HrwResult.HrwTicketForDisplay.HrwTicket.DueDateDyn)!= "object"){
			this.ticketValues.ticketDDate		= json.EWS.HrwResponse.HrwResult.HrwTicketForDisplay.HrwTicket.DueDateDyn;
		}else if(typeof(json.EWS.HrwResponse.HrwResult.HrwTicketForDisplay.HrwTicket.DueDate)!= "object"){
			this.ticketValues.ticketDDate		= json.EWS.HrwResponse.HrwResult.HrwTicketForDisplay.HrwTicket.DueDate;
		}
		// 2.0 Retrieving the remaining time
		this.ticketValues.ticketRtime       = json.EWS.HrwResponse.HrwResult.HrwTicketForDisplay.HrwTicket.RemainingBusinessMinutes;
		
		this.ticketValues.ticketStaticDDate = json.EWS.HrwResponse.HrwResult.HrwTicketForDisplay.HrwTicket.DueDate;
		// Service group
		this.ticketValues.ticketSGId		= json.EWS.HrwResponse.HrwResult.HrwTicketForDisplay.HrwTicket.ServiceGroupId ;
		var serviceGroups 					= $A();
		if(json.EWS.HrwResponse.HrwResult.HrwTicketForDisplay.ServiceGroups)
			serviceGroups = objectToArray(json.EWS.HrwResponse.HrwResult.HrwTicketForDisplay.ServiceGroups.KeyValue);// Service
		this.selectedServiceGroup = this.ticketValues.ticketSGId;
		this.listOfSG = $H();
		serviceGroups.each(function(serviceGroup){
			this.listOfSG.set(serviceGroup.Key, serviceGroup.Value);			
		}.bind(this));
		// Services
		this.ticketValues.ticketServiceId	= json.EWS.HrwResponse.HrwResult.HrwTicketForDisplay.HrwTicket.ServiceSkillId ;
		var services 	  					= $A();
		if(json.EWS.HrwResponse.HrwResult.HrwTicketForDisplay.Services)
			services = objectToArray(json.EWS.HrwResponse.HrwResult.HrwTicketForDisplay.Services.KeyValue);
		this.selectedService = this.ticketValues.ticketServiceId;
		document.fire('EWS:SCM_ticketApp_AddParam', {name: 'service', value: this.ticketValues.ticketServiceId});
		this.listOfServices = $H();
		services.each(function(service){
			this.listOfServices.set(service.Key, service.Value);
		}.bind(this));
		// actions
		if (json.EWS.HrwResponse.HrwResult.HrwTicketForDisplay.HrwTicket.HrwTicketActions)
			this.ticketValues.ticketPrevActions	= objectToArray(json.EWS.HrwResponse.HrwResult.HrwTicketForDisplay.HrwTicket.HrwTicketActions.HrwTicketAction);
		// items
		if (json.EWS.HrwResponse.HrwResult.HrwTicketForDisplay.HrwTicket.HrwTicketItems)
			this.ticketValues.ticketItems	= objectToArray(json.EWS.HrwResponse.HrwResult.HrwTicketForDisplay.HrwTicket.HrwTicketItems.HrwTicketItem);
		// skills
		if (json.EWS.HrwResponse.HrwResult.HrwTicketForDisplay.HrwTicket.HrwTicketSkills)
			this.ticketValues.ticketAttributes	= objectToArray(json.EWS.HrwResponse.HrwResult.HrwTicketForDisplay.HrwTicket.HrwTicketSkills.HrwTicketSkill);

		this.ticketValues.ticketSG = this.listOfSG.get(this.ticketValues.ticketSGId);
		this.ticketValues.ticketService = this.listOfServices.get(this.ticketValues.ticketServiceId);
		
		this.ticketValues.ticketSolved = json.EWS.HrwResponse.HrwResult.HrwTicketForDisplay.HrwTicket.Solved;

		// Load service groups		
		this._backend_getServiceGroups();	
		
		document.fire('EWS:scm_ticketStatusUpdate', {
			status		: this.ticketValues.ticketStatus				,
			agent		: this.ticketValues.ticketCurrAgent				,
			companyId	: this.employeeValues.ticketAffEmployee.compId	});
		
		this._initPanels();
	},
	/**
	 * @description Handler function for the backend call to get the employee values.
	 * 				It assign the values from the call to the corresponding class attributes and calls the backend to get the external data linked to the employee
	 * @param {json} json
	 * @since 1.0
	 * <br/>Modified in version 1.1:
	 * <ul>
	 * <li>Remove the call to the manage heartBeat</li>
	 * </ul>
	 */
	getAffEmployeeValuesHandler:function(json){
		var arrayOfValues = objectToArray(json.EWS.HrwResponse.HrwResult.Employees.EmployeeData.Field);
		arrayOfValues.each(function(value){
			switch(value['@name']){
				case 'employeeid':	this.employeeValues.ticketAffEmployee.values.set('EMP_ID', value['@value']);
									this.employeeValues.ticketAffEmployee.id = value['@value'];
									break;
				case 'firstname':	this.employeeValues.ticketAffEmployee.values.set('FIRST_NAME', value['@value']);
									break;
				case 'lastname':	this.employeeValues.ticketAffEmployee.values.set('LAST_NAME', value['@value']);
									break;
				case 'email':	this.employeeValues.ticketAffEmployee.values.set('EMAIL', value['@value']);
								break;
			}
		}.bind(this));
		
		this.employeeValues.ticketAffEmployee.employeeSearch.setValues(this.employeeValues.ticketAffEmployee.values);
		this._backend_getTopRightContent('affectedEmployee');
	},
	/**
	 * @description Handler function for the backend call to get the requestor values.
	 * 				It assign the values from the call to the corresponding class attributes and calls the backend to get the external data linked to the requestor.
	 * @param {json} json
	 * @since 1.0
	 * <br/>Modified in version 1.1:
	 * <ul>
	 * <li>Remove the call to the manage heartBeat</li>
	 * </ul>
	 */
	getRequestorValuesHandler:function(json){
		var arrayOfValues = objectToArray(json.EWS.HrwResponse.HrwResult.Employees.EmployeeData.Field);
		arrayOfValues.each(function(value){
			switch(value['@name']){
				case 'employeeid':	this.employeeValues.ticketRequestor.values.set('EMP_ID', value['@value']);
									this.employeeValues.ticketRequestor.id = value['@value'];
									break;
				case 'firstname':	this.employeeValues.ticketRequestor.values.set('FIRST_NAME', value['@value']);
									break;
				case 'lastname':	this.employeeValues.ticketRequestor.values.set('LAST_NAME', value['@value']);
									break;
				case 'email':	this.employeeValues.ticketRequestor.values.set('EMAIL', value['@value']);
								break;
			}
		}.bind(this));
		
		this.employeeValues.ticketRequestor.employeeSearch.setValues(this.employeeValues.ticketRequestor.values);
		this._backend_getTopRightContent('requestor');	
	},
	/**
	 * @description Handler function for the backend call getting the external data linked to an employee.
	 * @param {json} json
	 * @since 1.0
	 * <br/>Modified in version 1.1:
	 * <ul>
	 * <li>Remove the call to the manage heartBeat</li>
	 * </ul>
	 */
	getTopRightContentHandler:function(currentEmployee, json){
		var objectActive;
		if (currentEmployee == 'affectedEmployee' ){
			objectActive = this.employeeValues.ticketAffEmployee;
		}else{
			objectActive = this.employeeValues.ticketRequestor;
		}

		objectActive.dynCompInfo = $H();

		var webForms = objectToArray(json.EWS.HrwResponse.HrwResult.ArrayOfWebForm.WebForm);
		webForms.each(function(webForm){
			if(webForm.WebFormType === 'SecurityQuestions') return;
			objectActive.dynCompInfo.set(webForm.WebFormType, webForm.HtmlForm);
		}.bind(this));

		this.screenObject.dynCompInfoList = objectActive.dynCompInfo.keys();
		if(!objectActive.defDynCompInfo)
			objectActive.defDynCompInfo = this.screenObject.dynCompInfoList[0];

		this._showTopRightContainerValue();
	},
	/**
	 * @description Handler function for the backend call getting the available service groups for the company.
	 * 				It also create the array used to create the autocompleter for the service groups
	 * @param {json} json
	 * @since 1.0
	 * <br/>Modified in version 1.1:
	 * <ul>
	 * <li>Remove the call to the manage heartBeat</li>
	 * </ul>
	 */
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
	/**
	 * @description Handler function for the backend call getting the available services for the selected service group.
	 * 				It also create the array that will be used to create the autocompleter for the services.
	 * @param {json} json
	 * @since 1.0
	 * <br/>Modified in version 1.1:
	 * <ul>
	 * <li>Remove the call to the manage heartBeat</li>
	 * </ul>
	 */
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
	/**
	 * @description Handler function for the backend call performing an action on a ticket.
	 * 				Depending of the action, the correct application is launched (back to the ticket pool, go into edit mode, refresh screen)
	 * @param {json} json
	 * @since 1.0
	 * <br/>Modified in version 1.1:
	 * <ul>
	 * <li>Remove the call to the manage heartBeat</li>
	 * </ul>
	 */
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
	 * @description Handler function for the backend call getting the pending reason configured for the company.
	 * 				It also creates the array that will be used to create the autocompleter for the pending reasons
	 * @param {json} json
	 * @since 1.0
	 * <br/>Modified in version 1.2:
	 * <ul>
	 * <li>Pending reasons are sorted before display</li>
	 * </ul>
	 * <br/>Modified in version 1.1:
	 * <ul>
	 * <li>Remove the call to the manage heartBeat</li>
	 * </ul>
	 */
	getPendingReasonsHandler:function(json){
		var pendingReasons = objectToArray(json.EWS.HrwResponse.HrwResult.ArrayOfKeyValue.KeyValue);
		
		this.pendingReasons = $A();
		pendingReasons.each(function(pendingReason){
			this.pendingReasons.push({data: pendingReason.Key, text:pendingReason.Value});
		}.bind(this));
		
		//since 1.2 Sort the pending reasons in alphabetical order
		this.pendingReasons = this.pendingReasons.sortBy(function(item) {
			return item.text;
		});
	},
	/**
	 * @description Handler function for the backend call getting the attributes linked to the company and creates the attributes panel
	 * <b>In version 2.0</b>, a test is added in order to know if the service related attributes should be added in the display.
	 * This is due to the modification of the way the company attributes are retrieved. As they are now linked to the employee id too, 
	 * the company attributes might change if the selected employee is in another company but the selected service might not be changed.
	 * That means that the existing retrieved service attributes should also be display. If the flag is set to true, that means the service attributes
	 * should also be display. * @param {json} json
	 * @since 1.0
	 * <br>Modified in version 2.0:<ul><li>Add of the test if the service attributes should be added in the panel.</li></ul>
	 * <br/>Modified in version 1.1:
	 * <ul>
	 * <li>Remove the call to the manage heartBeat</li>
	 * </ul>
	 */
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
		//since 2.0 Use a constant for the absence of value
		if(this.isInInitialization == true && this.ticketValues.ticketSGId != HrwEngine.NO_VALUE && this.ticketValues.ticketServiceId != HrwEngine.NO_VALUE){
			this.isInInitialization = false;
			this._backend_getPossibleServiceAttributes();
		}
		if(this.addServiceAttributes == true){
			this.addServiceAttributes = false;
			this._addServiceAttributePanel();
		}
	},
	/**
	 * @description Handler function for the backend call getting the attributes linked to the selected service and add these attributes in the panel
	 * @param {json} json
	 * @since 1.0
	 * <br/>Modified in version 1.1:
	 * <ul>
	 * <li>Remove the call to the manage heartBeat</li>
	 * </ul>
	 */
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
				this.serviceSkills.set(skill.DefaultSkillId, skillDef);
			}.bind(this));
		}
		this._addServiceAttributePanel();
	},
	/**
	 * @description Handler function for the backend call getting the mail values to be displayed in a popup after closure.
	 * 				This function also calls the method displaying the popup.
	 * @param {json} json
	 * @since 1.0
	 * <br/>Modified in version 1.1:
	 * <ul>
	 * <li>Remove the call to the manage heartBeat</li>
	 * </ul>
	 */
	showMailBeforeClosurePopupHandler:function(json){
		var mailBody = json.EWS.HrwResponse.HrwResult.EmailPreview.MailBody;
		var mailFrom = objectToArray(json.EWS.HrwResponse.HrwResult.EmailPreview.MailFromData.Email);
		var mailTo   = objectToArray(json.EWS.HrwResponse.HrwResult.EmailPreview.MailToData.string); 
		new ticketActionPopupScreens().displayEmailPopup(mailBody, mailFrom, mailTo, 'Send');
	},
	/**
	 * @description Handler function for the backend call adding a custom action to a ticket.
	 * 				It also refresh the list of actions so that the added action can direclty be seen by the user.
	 * @param {json} json
	 * @since 1.0
	 * <br/>Modified in version 1.1:
	 * <ul>
	 * <li>Remove the call to the manage heartBeat</li>
	 * </ul>
	 * <br/>Reviewed in version 1.2:
	 * <ul>
	 * <li>Show all the actions if the "Hide technical actions" is not checked by default
	 * </ul>
	 */
	addCustomActionHandler:function(json){
		// actions
		if (json.EWS.HrwResponse.HrwResult.HrwTicket.HrwTicketActions)
			this.ticketValues.ticketPrevActions	= objectToArray(json.EWS.HrwResponse.HrwResult.HrwTicket.HrwTicketActions.HrwTicketAction); 
		// update actions
		//since 1.2 If the all actions flag is unticked, load all the actions
		this.actionsList = new scm_ticketActions(this.ticketValues.ticketDescription, this.ticketValues.ticketSolution , this.ticketValues.ticketPrevActions, true, !this.screenObject.ticketActionHideTech.value.checked, false);
		this.screenObject.ticketPrevActSpot.value.update();
		this.screenObject.ticketPrevActSpot.value.insert(this.actionsList.container);//generatedHTML);
		this.actionsList.addActionHeadersListeners(this.screenObject.ticketPrevActSpot.value);
		this.actionsList.addActionsOnTicketActions();
		
		CKEDITOR.instances.scm_ticketEditScreenEditor.setData("");
	},
	/**
	 * @description Handler function for the backend call getting the send mail preview info.
	 * @param {Object} json
	 * @since 1.0
	 */
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
	/**
	 * 
	 * @param {Object} json
	 * @since 1.0
	 */
	duplicateTicketHandler:function(json){
		new ticketActionPopupScreens().displayMessagePopup(global.getLabel('ticket_duplicate_to')+ ' ' + json.EWS.HrwResponse.HrwResult.HrwTicket.TicketId + '.', 'information');
	},
	/**
	 * 
	 * @param {Object} json
	 * @since 1.0
	 * <br/>Reviewed in version 1.1:<ul><li>Correction for the attachment display, reset of the firstAttachDisplay and the attachmentObject attributes.</li></ul>
	 * <br/>Reviewed in version 1.2:
	 * <ul>
	 * <li>Show all the actions if the "Hide technical actions" is not checked by default
	 * </ul>
	 */
	emailSentHandler:function(json){
		CKEDITOR.instances.scm_ticketEditScreenEditor.getCommand('insertSignature').disable();
		CKEDITOR.instances.scm_ticketEditScreenEditor.getCommand('insertTemplate').disable();
		CKEDITOR.instances.scm_ticketEditScreenEditor.getCommand('addAttachment').disable();
		if (json.EWS.HrwResponse.HrwResult.HrwTicket.HrwTicketActions)
			this.ticketValues.ticketPrevActions	= objectToArray(json.EWS.HrwResponse.HrwResult.HrwTicket.HrwTicketActions.HrwTicketAction);
		if (json.EWS.HrwResponse.HrwResult.HrwTicket.HrwTicketItems)
			this.ticketValues.ticketItems	= objectToArray(json.EWS.HrwResponse.HrwResult.HrwTicket.HrwTicketItems.HrwTicketItem);
		
		//since 1.2 If the all actions flag is unticked, load all the actions
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
	 * @since 1.0
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
	/**
	 * @param {Object} ticketId
	 * @param {Object} showPopupAddDoc
	 * @param {Object} infoJson
	 * @since 1.0
	 * <br/>Modified in version 1.1:
	 * <ul>
	 * <li>Remove the call to the manage heartBeat</li>
	 * </ul>
	 */
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
/*----------------------------------------------------------------------------------------------
 * 						EVENT HANDLERS FUNCTION
 *--------------------------------------------------------------------------------------------*/
	/**
	 * @description Function that manages the click on a previous action and calls the method to display it in the editor 
	 * @param {Object} args
	 * @since 1.0
	 */
	_viewPreviousActionEvent:function(args){
		this.lastActionClicked = getArgs(args).action;
		this._displayActionInEditor(getArgs(args).action);
	},
	/**
	 * @description Function that manages the click on the "copy to send box" link and calls the method to display it in the editor 
	 * @param {Object} args
	 * @since 1.0
	 */
	_copyToSendBoxEvent:function(args){
		this.lastActionClicked = getArgs(args).action;
		this._displayActionInSendBox(getArgs(args).action);
	},
	/**
	 * @description Function that manages the click on the check box filtering the previous actions 
	 * @param {Object} args
	 * @since 1.0
	 */
	_filterActionsEvent:function(args){
		this.actionsList.filterActions(!(getArgs(args).value));
		this.actionsList.addActionHeadersListeners(this.screenObject.ticketPrevActSpot.value);
		this.actionsList.addActionsOnTicketActions();
		CKEDITOR.instances.scm_ticketViewScreenEditor.setData("");
	},
	/**
	 * @description Function that manages the click on the menu for actions on ticket and that define which popup should be displayed according to the action 
	 * @param {Object} args
	 * @since 1.0
	 */
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
	/**
	 * @description Function that manages the closing of the "set to pending" popup in order to gatter the correct info before calling the backend
	 * @param {Object} args
	 * @since 1.0
	 */
	_getPendingInfoFromPopupEvent:function(args){
		params = getArgs(args);
		document.stopObserving('EWS:scm_pendingPopupClosed');
			var callArgs = {serviceToCall:'SwitchTicketToPending', description: params.pendingDescription, pendingReasonId: params.pendingReasonId};
			this._performActionOnTicketEvent(callArgs);

	},
	/**
	 * @description Function that manages the closing of the "set to waiting" popup in order to gatter the correct info before calling the backend
	 * @param {Object} args
	 * @since 1.0
	 */
	_getWaitingInfoFromPopupEvent:function(args){
		params = getArgs(args);
		document.stopObserving('EWS:scm_waitingPopupClosed');
			var callArgs = {serviceToCall:'SendTicketToAgentPool', description: params.waitingDescription}; 
			this._performActionOnTicketEvent(callArgs);
	},
	/**
	 * @description Function that manages the closing of the "send to general pool" popup in order to gatter the correct info before calling the backend
	 * @param {Object} args
	 * @since 1.0
	 */
	_getgeneralPoolInfoFromPopupEvent:function(args){
		params = getArgs(args);
		document.stopObserving('EWS:scm_generalPoolPopupClosed');
			var callArgs = {serviceToCall:'SendTicketToGeneralPool', description: params.generalPoolDescription}; 
			this._performActionOnTicketEvent(callArgs);
	},
	/**
	 * @description Function that manages the closing of the "schedule" popup in order to gatter the correct info before calling the backend
	 * @param {Object} args
	 * @since 1.0
	 */
	_getScheduleInfoFromPopupEvent:function(args){
		params = getArgs(args);
		document.stopObserving('EWS:scm_schedulePopupClosed');
		var callArgs = {serviceToCall:params.service, description: params.description, scheduleTime:params.scheduleTime , scheduleAgentId:params.scheduleAgentId , pendingReasonId:params.pendingReasonId}; 
		this._performActionOnTicketEvent(callArgs);
	},
	/**
	 * @description Function that manages the closing of the "send to" popup in order to gatter the correct info before calling the backend
	 * @param {Object} args
	 * @since 1.0
	 */
	_getSendToInfoFromPopupEvent:function(args){
		params = getArgs(args);
		document.stopObserving('EWS:scm_sendToPopupClosed');
		var callArgs = {serviceToCall:params.serviceToCall, description: params.description, assignedAgentId:params.assignedAgentId};
		this._performActionOnTicketEvent(callArgs);
	},
	/**
	 * @description Function that manages the closing of the "close" popup in order to gatter the correct info before calling the backend
	 * @param {Object} args
	 * @since 1.0
	 */
	_getDataFromPopupEvent:function(args){
		params = getArgs(args);
		document.stopObserving('scm_closePopupClosed');
		params.withMail == true? this.showMailPopup = true:this.showMailPopup = false;	
		this._saveTicket();
	},
	/**
	 * @description Function that manages the click on the cancel button and that reset the application to its original state
	 * @param {Object} args
	 * @since 1.0
	 */	
	_cancelModificationEvent:function(args){
		global.open($H({app: {appId:'MY_PL', tabId:'PL_MY', view:'scm_myPool'}}));
	},
	
	/**
	 * @description Function that manages the click on the button displayed under the editor that can perform several actions
	 * @param {Object} args
	 * @since 1.0
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
	/**
	 * 
	 * @param {String} email
	 * @returns {String} email
	 * @since 1.0
	 */
	_prepareEmailAddForSending: function(email){
		if(email.endsWith('; ')){
			email = email.substr(0, email.length - 2);	
		}else if(email.endsWith(';')){
			email = email.substr(0, email.length - 1);	
		}
		return email;
	},
	/**
	 * 
	 * @param {Object} mailFrom
	 * @param {Object} mailTo
	 * @param {Object} mailCC
	 * @param {Object} mailSubject
	 * @param {Object} mailBody
	 * @returns {String} xmlForEmail
	 * @since 1.0
	 */
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
	/**
	 * 
	 * @param {Object} args
	 * @since 1.0
	 */
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
	/**
	 * 
	 * @param {Object} args
	 * @since 1.0
	 */
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
	/**
	 * 
	 * @param {Object} args
	 * @since 1.0
	 */
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
	/**
	 * 
	 * @param {Object} args
	 * @since 1.0
	 */
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
	/**
	 * @since 1.0
	 */
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
	
	/**
	 * @description Function that manages the closing of the "email" popup in order to gatter the correct info before calling the backend
	 * @param {Object} args
	 * @since 1.0
	 */
	_mailPopupClosedEvent:function(args){
		var params = getArgs(args);
		var callArgs = {serviceToCall:'CloseTicket', mailFrom:params.mailFrom, mailTo:params.mailTo};
		this.actionPerformed = 8;
		this._performActionOnTicketEvent(callArgs);
	},
	/**
	 * @description Function that manages the change of the selected value when the user wants to add an action on the ticket
	 * @param {Object} args
	 * @since 1.0
	 */
	_typeSelectionChangedEvent:function(args){
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
		this.typeSelection = getArgs(args).idAdded;
	},
	/**
	 * @since 1.0
	 */
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
	/**
	 * @since 1.0
	 */
	_createFromInput:function(){
		this.screenObject.ticketEditorFromHeader.value.update('<div class="SCM_ticketScreen_MiddlePanelRight_header_email_inputContainer">'+
															  	'<div class="SCM_ticketScreen_MiddlePanelRight_header_email_field_label">'+ global.getLabel('From') +'</div>'+
																'<div class="SCM_ticketScreen_MiddlePanelRight_header_email_field_input" id="scm_emailHeader_from"></div>'+
															  '</div>');
//		this.screenObject.ticketEditorFromHeader.value.removeClassName('SCM_ticket_screen_hidden');														  
	},
	/**
	 * @since 1.0
	 */
	_createToInput:function(){
		this.screenObject.ticketEditorToHeader.value.update('<div class="SCM_ticketScreen_MiddlePanelRight_header_email_inputContainer">'+
															  '<div class="SCM_ticketScreen_MiddlePanelRight_header_email_field_label">'+ global.getLabel('To') +'</div>'+
															  '<div class="SCM_ticketScreen_MiddlePanelRight_header_email_field_input_multiselect" id="scm_emailHeader_to"></div>'+
															'</div>');
		this.screenObject.ticketEditorToHeader.value.removeClassName('SCM_ticket_screen_hidden');
	},
	/**
	 * @since 1.0
	 */
	_createCCInput:function(){
		this.screenObject.ticketEditorCCHeader.value.update('<div class="SCM_ticketScreen_MiddlePanelRight_header_email_inputContainer">'+
															  '<div class="SCM_ticketScreen_MiddlePanelRight_header_email_field_label">'+ global.getLabel('Cc') +'</div>'+
															  '<div class="SCM_ticketScreen_MiddlePanelRight_header_email_field_input_multiselect" id="scm_emailHeader_cc"></div>'+
															'</div>');
		this.screenObject.ticketEditorCCHeader.value.removeClassName('SCM_ticket_screen_hidden');
	},
	/**
	 * @since 1.0
	 */
	_createSubjectInput:function(){
		this.screenObject.ticketEditorSubjectHeader.value.update('<div class="SCM_ticketScreen_MiddlePanelRight_header_email_inputContainer"><div class="SCM_ticketScreen_MiddlePanelRight_header_email_field_label">'+ global.getLabel('Subject') +'</div><div class="SCM_ticketScreen_MiddlePanelRight_header_email_field_input"><input id="scm_emailHeader_subject" class="SCM_ticketScreen_MiddlePanelRight_header_email_input" type="text" value=""></input></div></div>');
		this.screenObject.ticketEditorSubjectHeader.value.removeClassName('SCM_ticket_screen_hidden');
	},
	/**
	 * @since 1.0
	 */
	_createAttachmentDisplay:function(){
		this.screenObject.ticketEditorAttachmentHeader.value.update('<div class="SCM_ticketScreen_MiddlePanelRight_header_email_inputContainer">'+
																	'<div class="SCM_ticketScreen_MiddlePanelRight_header_email_field_label">'+ global.getLabel('Attachments') +'</div>'+
																	'<div id="emailAttachmentContainer" class="SCM_ticketScreen_MiddlePanelRight_header_email_field_input"></div>'+
																 '</div>');
		this.screenObject.ticketEditorAttachmentHeader.value.removeClassName('SCM_ticket_screen_hidden');
		
	},
	/**
	 * 
	 * @param {Object} from
	 * @param {Object} defaultAddress
	 * @since 1.0
	 */
	_updateFromInput:function(from, defaultAddress){
		this._createFromInput();
		if(!Object.isUndefined(this.screenObject.ticketEditorFromHeader.value.down('[id="scm_emailHeader_from"]')))
			this.screenObject.ticketEditorFromHeader.value.down('[id="scm_emailHeader_from"]').update();
		var fromAddresses = $A();
// test if a default address should be used, if not put the first one		
		this.emailTemplates = $H();
		var defaulting = false;
		if (defaultAddress != null){
			defaulting=true;
		}
		var defaultingFirst = false;
		from.size()>1?defaultingFirst = false:defaultingFirst=true;
// to change for the only one email address		
		if(defaultingFirst == false){this.screenObject.ticketEditorFromHeader.value.removeClassName('SCM_ticket_screen_hidden'); }
		
		from.each(function(value){
			if(defaultingFirst){
				fromAddresses.push({data:value.Address, text:value.Name, def:'X'});
			}else{
				if (defaulting && value.Address == defaultAddress) {
					fromAddresses.push({ data: value.Address, text: value.Name, def:'X'});
				}else {
					fromAddresses.push({ data: value.Address, text: value.Name});
				}	
			}
			if(value.EmailTemplates && value.EmailTemplates.EmailTemplate)
				this.emailTemplates.set(value.Address,value.EmailTemplates.EmailTemplate);
			else
				this.emailTemplates.set(value.Address,$A());
		}.bind(this));
		
		var json = {
			autocompleter: {
				object: fromAddresses,
				multilanguage: {
					no_results: 'No results found',
					search: 'Search'
				}
			}
		}
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
	/**
	 *
	 * @param {Object} to
	 * @since 1.0
	 */
	_updateToInput:function(to){
		var toAddresses = $A();
		to.each(function(value){	
			toAddresses.push({data:value, text:value});	
		}.bind(this));
		var options = 	{className: '', id: 'toAddMSAC'};
		this.mailToMS = new multiselectAutoComplete(this.screenObject.ticketEditorToHeader.value.down('[id="scm_emailHeader_to"]'), options, toAddresses);
	},
	/**
	 * 
	 * @param {Object} cc
	 * @since 1.0
	 */
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
	/**
	 * 
	 * @param {Object} subject
	 * @since 1.0
	 */
	_updateSubjectInput:function(subject){
		this.screenObject.ticketEditorSubjectHeader.value.down('[id="scm_emailHeader_subject"]').value = subject;
	},
	/**
	 * 
	 * @param {Object} attachments
	 * @since 1.0
	 */
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
	/**
	 * 
	 * @param {Object} args
	 * @since 1.0
	 */
	_showCustomActionTemplateSelectorEvent:function(args){
		this.currentCustomActionType = getArgs(args).idAdded;
		if(this.typeSelection == "4")
			CKEDITOR.instances.scm_ticketEditScreenEditor.getCommand('insertTemplate').enable();  
	},	
	/**
	 * 
	 * @param {Object} args
	 * @since 1.0
	 */
	_assignNewDateEvent:function(args){
		params = getArgs(args);
		this.screenObject.ticketDdateSpot.value.update(params.dateDisplay);
		this.ticketValues.ticketDDate = params.dateHRW;
	},
	
	/**
	 * @description Function that change the button text to "save" when the user display the editor for description
	 * @since 1.0
	 */
	_showDescriptionButtonEvent:function(){
		this.screenObject.showSendButton();
		this.screenObject.editButtonLabel('save_descr');
		this.buttonAction = 'save';
		this.currentEditorInstance = {
			id: 'scm_ticketDescrScreenEditor',
			object: CKEDITOR.instances.scm_ticketDescrScreenEditor
		};
	},
	/**
	 * @description Function that change the button text to "save" when the user display the editor for description
	 * @since 1.0
	 */
	_showSolutionButtonEvent:function(){
		this.screenObject.showSendButton();
		this.screenObject.editButtonLabel('save_sol');
		this.buttonAction = 'save';
		this.currentEditorInstance = {
			id: 'scm_ticketSolScreenEditor',
			object: CKEDITOR.instances.scm_ticketSolScreenEditor
		};
	},
	/**
	 * @description Function that hides the button when the user display the editor for new action depending of its choice of action to be performed
	 * @param {Object} memo
	 * @since 1.0
	 */
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
	/**
	 * @description Function that hides the button displayed under the editor when the user is just in action display mode
	 * @since 1.0
	 */
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
	/**
	 * @description Function that intialize the employee history for the affected employee when the affected employee is chosen
	 * @param {Object} event
	 * @since 1.0
	 */
	_affectedEmployeeLinkClicked: function(event) {
		this.activeEmpSearch = 'affectedEmployee';
		if(this.employeeValues.ticketAffEmployee.dynCompInfo)
			this._showTopRightContainerValue();
		else
			this._backend_getTopRightContent(this.activeEmpSearch);
			
		this._initEmployeeHistoryPanel(this.employeeValues.ticketAffEmployee.values.get('EMP_ID'), this.employeeValues.ticketAffEmployee.values.get('FIRST_NAME') + ' ' + this.employeeValues.ticketAffEmployee.values.get('LAST_NAME'), this.employeeValues.ticketAffEmployee.values.get('COMPANY_ID'));
	},
	/**
	 * @description Function that intialize the employee history for the requestor when the requester is chosen
	 * @param {Object} event
	 * @since 1.0
	 */
	_requestorLinkClicked: function(event) {
		this.activeEmpSearch = 'requestor';
		if(this.employeeValues.ticketRequestor.dynCompInfo)
			this._showTopRightContainerValue();
		else
			this._backend_getTopRightContent(this.activeEmpSearch);
			
		this._initEmployeeHistoryPanel(this.employeeValues.ticketRequestor.values.get('EMP_ID'), this.employeeValues.ticketRequestor.values.get('FIRST_NAME') + ' ' + this.employeeValues.ticketRequestor.values.get('LAST_NAME'), this.employeeValues.ticketRequestor.values.get('COMPANY_ID'));
	},
	/**
	 * @description Event handler when the user changes the employee or the requestor and that no value is found.
	 * 				It closes the employee history and resets the external data panel
	 * @param {Object} args
	 * @since 1.0
	 */
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
	 * @description Function resetting the external data panel top a white panel.
	 * @since 1.0
	 */
	_cleanTopRightContainer:function(){
		if(this.screenObject.dynCompInfoSpot)
			this.screenObject.dynCompInfoSpot.update();
	},
	/**
	 * @description Event handler when the user changes the employee or requestor and a new value is found.
	 * 				It opens the employee history for the user and refresh the external data to match the new user.
	 * @param {Object} args
	 * @since 1.0<br>Modified in 2.0:<ul><li>Reload the attributes as it's now linked to the employee Id (call to <a href=scm_editTicket.html#_backend_getPossibleCompanyAttributes>_backend_getPossibleCompanyAttributes</a>)</li></ul>
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
																				params.values.get('COMPANY_ID'));
			}
			
			//Open the employee history for new user
			this._initEmployeeHistoryPanel(params.values.get('EMP_ID'), params.values.get('FIRST_NAME') + ' ' + params.values.get('LAST_NAME'), params.values.get('COMPANY_ID'));
		}else if (!Object.isEmpty(params.ident.match('viewTicketsAffEmployee'))){
			currentEmployee = 'affectedEmployee';
			this.employeeValues.ticketAffEmployee.values = params.values;
			this.employeeValues.ticketAffEmployee.id = params.values.get('EMP_ID');
			if(this.employeeValues.ticketAffEmployee.userAction) {
				this.employeeValues.ticketAffEmployee.userAction.showActionOnField();
				this.employeeValues.ticketAffEmployee.userAction.updateAction(	params.values.get('EMP_ID'),
																				params.values.get('FIRST_NAME') + ' ' + params.values.get('LAST_NAME'),
																				params.values.get('COMPANY_ID'));
			}

			//Open the employee history for new user
			this._initEmployeeHistoryPanel(params.values.get('EMP_ID'), params.values.get('FIRST_NAME') + ' ' + params.values.get('LAST_NAME'), params.values.get('COMPANY_ID'));
		}
		else return;
		this.screenObject.enableEditButton();
		document.fire('EWS:scm_enableSaveButton');
		
		this._updateTopRightContainer(currentEmployee);
		this._initTopPanelTitle();
		this.addServiceAttributes = true;
		this._backend_getPossibleCompanyAttributes();
	},
	/**
	 * @since 1.0
	 */
	_fromAddressChosenEvent:function(){
	},
	/**
	 * @since 1.0
	 */
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
	/**
	 * 
	 * @param {Object} event
	 * @since 1.0
	 */
	_showSignaturesEvent:function(event){
		var elem = this.virtualHtml.down('.cke_button_insertSignature');
		this._buildContextMenuForSignatures({srcElement:elem});
	},
	/**
	 * 
	 * @param {Object} event
	 * @since 1.0
	 */
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
	 * 
	 * @param {Object} event
	 * @since 1.0
	 */
	_addAttachmentEvent:function(event){
		if(this.ticketForDocument && this.ticketForDocument.documentsTypesLoaded())
			new ticketActionPopupScreens().showAttachItemPopup(this.ticketValues.ticketId, this.ticketValues.ticketItems, this.ticketForDocument, this.existingItemAttachedToMail, this);
		
		else if(this.employeeValues.ticketAffEmployee.compId >= 0 && this.selectedService >= 0)
			hrwEngine.callBackend(this, 'Ticket.CollectDocumentTypes', $H({
		       scAgentId: hrwEngine.scAgentId,
			   CompanySkillId: this.companySkillId,
			   serviceSkillId: this.selectedService
		    }), this.getTicketDocumentTypesHandler.bind(this, this.ticketValues.ticketId, false));
		
		else 
			this.getTicketDocumentTypesHandler(this.ticketValues.ticketId, false, null);
	},
	/**
	 * 
	 * @param {Object} event
	 * @since 1.0
	 */
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
	/**
	 * 
	 * @param {Object} event
	 * @since 1.0
	 */
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
	/**
	 * 
	 * @param {Object} template
	 * @since 1.0
	 */
	_customActionTemplateSelectedEvent:function(template){
		var selectedTemplate ='';
		this.ticketAction_actionsTypes.each(function(actionType){
			if(actionType.data == template){
				selectedTemplate = actionType.value;
			}
		});
		CKEDITOR.instances.scm_ticketEditScreenEditor.setData(selectedTemplate);	
	},
	/**
	 * 
	 * @param {Object} event
	 * @since 1.0
	 */
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
	/**
	 * 
	 * @param {Object} event
	 * @since 1.0
	 */
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
	
	/**
	 * @description Function in charge of updating the external data container when the employee or the requestor changes.
	 * 				It calls the backend in order to get the accurate data.
	 * @param {Object} currentEmployee
	 * @since 1.0
	 */
	_updateTopRightContainer:function(currentEmployee){
		this._backend_getTopRightContent(currentEmployee);
	},
	/**
	 * 
	 * @param {Object} event
	 * @since 1.0
	 */
	_showDueDatePopupEvent:function(event){
		new ticketActionPopupScreens().showDueDatePopup(this.ticketValues.ticketDDate);
	},
	/**
	 * 
	 * @param {Object} args
	 * @since 1.0
	 */
	_resetdueDateToStaticEvent: function(args) {
		this.ticketValues.ticketDDate = this.ticketValues.ticketStaticDDate;
		this.screenObject.ticketDdateSpot.value.update(SCM_Ticket.convertDateTime(this.ticketValues.ticketDDate));
	},
	/**
	 * 
	 * @param {Object} args
	 * @since 1.0
	 */
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
	 * 
	 * @param {Object} args
	 * @since 1.0
	 */
	_employeeSearchChangedEvent:function(args){
// disable save button
		this.screenObject.disableEditButton();
		document.fire('EWS:scm_disableSaveButton');
	},
	/**
	 * 
	 * @param {Object} event
	 * @since 1.0
	 */
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
	/**
	 * 
	 * @param {Object} args
	 * @since 1.0
	 */
	_removeAttachmentEvent:function(args){
		this.existingItemAttachedToMail.unset(args.memo.attachId);
		
		if(!Object.isUndefined(this.newItemAttachedToMail.unset(args.memo.attachId))) {
			hrwEngine.callBackend(this, 'Ticket.RemoveAttachment', $H({
		        scAgentId  		: hrwEngine.scAgentId,
		        ticketId 		: this.ticketValues.ticketId,
				serverFileName	: args.memo.fileId
		    }), function() {});
		}
	}
});
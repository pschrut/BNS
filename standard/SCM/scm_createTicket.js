/** 
 * @class 
 * @author jonathanj & nicolasl
 * @description Class in charge of creating the screen to allow the user to create a HRW ticket.
 * @version 2.2
 * <br/>Changes for version 2.2:
 * <ul>
 * <li>In the list of skills, if a skill is company and service based, it is overwritten</li>
 * <li>The autocompleter that contains skill value could be in the company or service skills list => read both values</li>
 * <li>Replace the label "Subject" by "Short Description"</li>
 * <li>If there is no dynamic webforms tables created, do it before using it</li>
 * <li>Avoid calling the update of the list of skills when changing of requestor</li>
 * <li>Call the refresh of the pending tickets list once the ticket is created</li>
 * <li>Do not react to the change of employee if it is not for the correct form</li>
 * </ul>
 * <br/>Changes for version 2.1:
 * <ul>
 * <li>There is a new field in the form to indicate for when a ticket is scheduled. We have to remove this field for the ticket creation</li>
 * <li>Use the common way to encode/decode fields for the communication to the backend</li>
 * <li>Bug fix if there is a skill without value</li>
 * <li>Deactivate the text editor spell check</li>
 * </ul>
 * <br/>Changes for version 2.0:
 * <ul>
 * 	<li>Name of some backend function changed</li>
 *	<li>The employee id is added in the selection of services to show</li>
 *  <li>Introduction of a new flag to know if the service attributes should be redisplayed after a call to the company attributes (see <a href=scm_createTicket.html#_ticketEmployeeSelectedEvent>_ticketEmployeeSelectedEvent</a> for more details).</li>
 *  <li>Add of the possibility to have read only attributes.</li>
 *  <li>Add of the service area clicked event</li>
 *  <li>Add of the service group text "Choose service area first"</li>
 *  <li>Implementation of the service areas, first level of service grouping</li>
 * <li>Use a constant for empty HRW values</li>
 * </ul>
 */
var scm_createTicket = Class.create(Application, /** @lends scm_createTicket.prototype */{
	/**
	 * Title of the application
	 * @type String
	 * @since 1.0
	 */
	mainTitle : '',
	/**
	 * Object representing the ticket screen
	 * @type scm_ticketScreen_standard_new
	 * @since 1.0
	 */
	screenObject: null,
	/**
	 * The employee search for the requestor of the ticket with the options
	 * @type Hash
	 * @since 1.0
	 */
	requestor: null,
	/**
	 * The employee search for the affected employee of the ticket with the options
	 * @type Hash
	 * @since 1.0
	 */
	affectedEmployee: null,
	/**
	 * The possible events for the class
	 * @type JSON
	 * @since 1.0
	 */
	eventListeners:null,
	/**
	 * The last serviceGroup id selected
	 * @type int
	 * @since 1.0
	 */
	selectedServiceGroup:null,
	/**
	 * The last service selected
	 * @type int
	 * @since 1.0
	 */
	selectedService:null,
	/**
	 * The list of available serviceGroups for the companySkillId
	 * @type Array
	 * @since 1.0
	 */
	serviceGroups:null,
	/**
	 * The list of available service for the selected serviceGroup
	 * @type Array
	 * @since 1.0
	 */
	services:null,
	/**
	 * The list of company dependant skills (loaded when the company changes)
	 * @type Hash
	 * @since 1.0
	 */
	companySkills:null,
	/**
	 * The list of service dependant skills (loaded when the service changes)
	 * @type Hash
	 * @since 1.0
	 */
	serviceSkills: null,
	/**
	 * The current active employee search object (can be requestor or affected employee)
	 * @type String
	 * @since 1.0
	 */
	activeEmpSearch:null,
	/**
	 * The requestor company Id
	 * @type int
	 * @since 1.0
	 */
	requestorCompanyId:null,
	/**
	 * The requestor Id
	 * @type int
	 * @since 1.0
	 */
	requestorId: null,
	/**
	 * The affected employee compnay Id
	 * @type int
	 * @since 1.0
	 */
	affectedCompanyId:null,
	/**
	 * The affected employee Id
	 * @type int
	 * @since 1.0
	 */
	affectedId: null,
	/**
	 * The elements on error on the creation screen
	 * @type Array
	 * @since 1.0
	 */
	errorElements:null,
	/**
	 * Flag meaning if the employee history is launched
	 * @type boolean
	 * @since 1.0
	 */
	employeeHistLaunched: null,
	/**
	 * The ticket to create (with all data) in an XML format
	 * @type string
	 * @since 1.0
	 */
	hrwTicketXml: null,
	/**
	 * The ticket skills of the ticket to create (with all data) in an XML format
	 * @type string
	 * @since 1.0
	 */
	hrwTicketSkillsXml:null,
	/**
	 * Dynamic due date with HRW format if the user fixed it
	 * @type string
	 * @since 1.0
	 */
	dynDueDate: null,
	/**
	 * Flag meaning if there is a requestor field
	 * @type boolean
	 * @since 1.0
	 */
	enableRequestor: null,
	/**
	 * Flag to says if the grouping skills are used for the customer/company
	 * @type boolean
	 * @since 1.0
	 */
	useGroupingSkills:null,
	/**
	 * The grouping skills defined for the customer/company
	 * @type Array
	 * @since 1.0
	 */
	groupingSkills: null,
	/**
	 * The default grouping skill
	 * @type int
	 * @since 1.0
	 */
	defaultGroupingSkill:null,
	/** 
	 * The autocompleter object for the grouping skills
	 * @type autoCompleter object
	 * @since 1.0
	 */
	companyGroupingAC:null,
	/**
	 * Flag to know if the due date of the ticket can be changed
	 * @type boolean
	 * @since 1.0
	 */
	allowDDchange:null,
	/**
	 * Flag meaning if the process is in the initialization phase
	 * @type boolean
	 * @since 1.0
	 */
	inInitialize:null,
	/**
	 * Result of the security question states
	 * @type String
	 * @default "3"
	 * @since 1.1
	 */
	securityQuestionsResult: '3',
	/**
	 * List of the elements that are flagged in the security questions
	 * @type Array
	 * @since 1.1
	 */
	securityQuestionFlags: null,
	/**
	 * Flag meaning if the service attributes should be added in the attributes panel
	 * @type boolean
	 * @since 2.0
	 */
	 addServiceAttributes:null,
	 /**
	  * Flag meaning if the company uses the Area level in the services
	  * @type boolean
	  * @since 2.0 NEW
	  */
	 useAreas: null,
	 /**
	  * Selected service area
	  * @type int
	  * @since 2.0 NEW
	  */
	 selectedServiceArea:null,
	 /**
	  * @since 2.0 NEW
	  */
	 serviceAreas:null,
	 
	 
	 companySkillId:null,
	
/*----------------------------------------------------------------------------------------------
 * 									STANDART CLASS FUNCTIONS 
 *--------------------------------------------------------------------------------------------*/    	
	/**
	 * Class constructor that calls the parent and sets the event listener for the class
	 * @param {Object} args The arguments given when to constructor is called
	 * @since 1.0<br>
	 * Modified in 2.0:<ul>
	 * 	<li>Add of the service area clicked event</li>
	 * </ul>
	 */
    initialize: function ($super, args){
        $super(args);

		// register the events
		this.eventListeners = {
			affectedEmployeeLinkClicked	  : this._showAffectedEmployeeSearchEvent.bindAsEventListener(this),
			requestorLinkClicked		  : this._showRequestorSearchEvent.bindAsEventListener(this),
			ticketServiceAreaSelected 	  : this._getServicesGroupsEvent.bindAsEventListener(this),
			ticketServiceGroupSelected    : this._getServicesEvent.bindAsEventListener(this),
			ticketServiceSelected		  : this._getPossibleServiceAttributesEvent.bindAsEventListener(this),
			viewCompanyDetailsLinkClicked : this._showCompanyDetailsEvent.bindAsEventListener(this),
			ticketCreationCancelled		  : this._cancelTicketCreationEvent.bindAsEventListener(this),
			ticketCreateClicked			  : this._createTicketEvent.bindAsEventListener(this),
			ticketNoEmployeeSelected	  : this._ticketNoEmployeeSelectedEvent.bindAsEventListener(this),
			ticketCompanySelected		  : this._companySelectedEvent.bindAsEventListener(this),
			dynCompanyInfoClicked		  : this._dynCompanyInfoEvent.bindAsEventListener(this),
			ticketEmployeeSelected		  : this._ticketEmployeeSelectedEvent.bindAsEventListener(this),
			mailPopupClosed				  : this._mailPopupClosedEvent.bindAsEventListener(this),
			assignNewDate				  : this._assignNewDateEvent.bindAsEventListener(this),
			resetdueDateToStatic		  : this._resetdueDateToStaticEvent.bindAsEventListener(this),
			employeeSearchChanged		  : this._employeeSearchChangedEvent.bindAsEventListener(this)
//			companySetted				  : this._companySettedEvent.bindAsEventListener(this)
		};
    },
	/**
	 * Function that is called when the application is displayed. This function also initialize the variable for the class
	 * @param {Object} $super The parent class
	 * @param {Object} args The arguments given during the call
	 * @since 1.0
	 */
    run: function ($super, args){
        $super(args);
		this.requestor = $H({
			builded			: false,
			employeeSearch	: null,
			extension	  	: null,
			values		  	: null,
			userAction		: null,
			dynCompInfo		: null,
			defDynCompInfo	: null
		});
		this.affectedEmployee = $H({
			builded			: false,
			employeeSearch	: null,
			extension	  	: null,
			values		  	: null,
			userAction		: null,
			dynCompInfo		: null,
			defDynCompInfo	: null
		});
		this.requestor.values = getArgs(args).get('empSearchVal');
		this.affectedEmployee.values = this.requestor.values;
		
		//since 1.1 - Addition of the 2 flags definition
		this.securityQuestionFlags 		= $A();
		this.securityQuestionsResult	= '3';
		
		document.observe('EWS:scm_affectedEmployeeLinkClicked', this.eventListeners.affectedEmployeeLinkClicked);
		document.observe('EWS:scm_requestorLinkClicked', this.eventListeners.requestorLinkClicked);
		document.observe('EWS:scm_ticketCreate_serviceAreaChoosen', this.eventListeners.ticketServiceAreaSelected)
		document.observe('EWS:scm_ticketCreate_serviceGroupChoosen', this.eventListeners.ticketServiceGroupSelected);
		document.observe('EWS:scm_ticketCreate_serviceChoosen', this.eventListeners.ticketServiceSelected);
        document.observe('EWS:scm_ticketCreationCancelled', this.eventListeners.ticketCreationCancelled);
		document.observe('EWS:scm_ticketCreateClicked', this.eventListeners.ticketCreateClicked);
		document.observe('EWS:scm_noEmployeeSelected', this.eventListeners.ticketNoEmployeeSelected);
		document.observe('EWS:scm_custCompSelected', this.eventListeners.ticketCompanySelected);
		document.observe('EWS:scm_employeeSelected', this.eventListeners.ticketEmployeeSelected);
		document.observe('EWS:scm_dynCompanyInfoClicked', this.eventListeners.dynCompanyInfoClicked);
		document.observe('EWS:scm_mailPopupClosed', this.eventListeners.mailPopupClosed);
		document.observe('EWS:scm_duedateChanged', this.eventListeners.assignNewDate);
		document.observe('EWS:scm_duedateResetted', this.eventListeners.resetdueDateToStatic);
		document.observe('EWS:scm_employeeSearchChanged', this.eventListeners.employeeSearchChanged);
//		document.observe('EWS:scm_companySetted', this.eventListeners.companySetted);
		if (this.firstRun) {
			this.firstRun = false;
		}else{
			this.resetData();
		}
		this.mainTitle = global.getLabel('Ticket_properties');
		this.updateTitle(this.mainTitle);
		this.screenInitialize();
    },
	/**
	 * Function that calls the function close on the parent class given in parameter and removes the observers of the class
	 * @param {Object} $super The parent class
	 * @since 1.0
	 */
    close: function ($super){
        $super();
		this._cleanEmployeeHistoryPanel();
		this.resetData();
		
		document.stopObserving('EWS:scm_affectedEmployeeLinkClicked', this.eventListeners.affectedEmployeeLinkClicked);
		document.stopObserving('EWS:scm_requestorLinkClicked', this.eventListeners.requestorLinkClicked);
		document.stopObserving('EWS:scm_ticketCreate_serviceAreaChoosen', this.eventListeners.ticketServiceAreaSelected)
		document.stopObserving('EWS:scm_ticketCreate_serviceGroupChoosen', this.eventListeners.ticketServiceGroupSelected);
		document.stopObserving('EWS:scm_ticketCreate_serviceChoosen', this.eventListeners.ticketServiceSelected);
        document.stopObserving('EWS:scm_ticketCreationCancelled', this.eventListeners.ticketCreationCancelled);
		document.stopObserving('EWS:scm_ticketCreateClicked', this.eventListeners.ticketCreateClicked);
		document.stopObserving('EWS:scm_noEmployeeSelected', this.eventListeners.ticketNoEmployeeSelected);
		document.stopObserving('EWS:scm_custCompSelected', this.eventListeners.ticketCompanySelected);
		document.stopObserving('EWS:scm_employeeSelected', this.eventListeners.ticketEmployeeSelected);
		document.stopObserving('EWS:scm_dynCompanyInfoClicked', this.eventListeners.dynCompanyInfoClicked);
		document.stopObserving('EWS:scm_mailPopupClosed', this.eventListeners.mailPopupClosed);
		document.stopObserving('EWS:scm_duedateChanged', this.eventListeners.assignNewDate);
		document.stopObserving('EWS:scm_duedateResetted', this.eventListeners.resetdueDateToStatic);
		document.stopObserving('EWS:scm_employeeSearchChanged', this.eventListeners.employeeSearchChanged);
    },
/*----------------------------------------------------------------------------------------------
 * 									CLASS FUNCTIONS 
 *--------------------------------------------------------------------------------------------*/    	
 	/**
 	 * Function that resets the data used for the application in order to have a clean class instance
 	 * @since 1.0
 	 * <br/>Modification for 2.1:
	 * <ul>
	 * <li>Reset some data in the screen</li>
	 * </ul>
 	 */
	resetData:function(){
		this._unsetElementsOnError();
		this.errorElements = $A();
		
		//since 2.1 Reset the ticket values
		this.selectedServiceArea	= null;
		this.selectedServiceGroup 	= null;
		this.selectedService		= null;
		this.dynDueDate				= null;
		this.companyGroupingAC		= null;
		
		if(!Object.isEmpty(this.screenObject)) this.screenObject.resetData();
		if(CKEDITOR.instances.scm_ticketCreateScreenEditor){
			CKEDITOR.remove(CKEDITOR.instances.scm_ticketCreateScreenEditor);
		}
	},
	
 	/**
 	 * Function that initialize the screen and calls the _initTopPanel function, the _initMiddlePanelTop function and _initMiddlePanelLeft.
 	 * This function also fires an event in order to update the list of ticket in processing displayed in the left widget.
 	 * @see scm_createTicket#_initTopPanel
 	 * @see scm_createTicket#_initMiddlePanelTop
 	 * @see scm_createTicket#_initMiddlePanelLeft
 	 * @since 1.0
 	 */
 	screenInitialize:function(){
		if(Object.isEmpty(this.screenObject))
			this.screenObject = new scm_ticketScreen_standard_new(this.virtualHtml, 1);
		document.fire('EWS:scm_ticketStatusUpdate', {
			status		: "-1"					,
			agent		: hrwEngine.scAgentId	,
			companyId	: ''					});
		this._initTopPanel();
		this._initMiddlePanelTop();	
		this._initMiddlePanelLeft();
	},
	/**
	 * Function that disable to possibility to change the company in the employee search on the emploeeSearch objects.
	 * @see ScmEmployeeSearch#disableCompanySelection
	 * @since 1.0
	 */
	_disableCompanyChange:function(){
		this.affectedEmployee.employeeSearch.disableCompanySelection();
		if(this.enableRequestor === true)
			this.requestor.employeeSearch.disableCompanySelection();
	},
	/**
	 * Function that enables the possibility to change the due date of the ticket. 
	 * This is based on the company settings retrieved from HRW.
	 * @since 1.0
	 */
	_makeDueDateChangeable:function(){
		var dynDueDateAllowed = this.allowDDchange;
		if(dynDueDateAllowed === false) return;
		this.screenObject.ticketDdateSpot.label.addClassName('application_action_link');
		this.screenObject.ticketDdateSpot.label.observe('click', this._showDueDatePopupEvent.bindAsEventListener(this));
		this.screenObject.ticketDdateSpot.value.removeClassName('SCM_ticketScreen_text_disabled');
	},
	
	/**
	 * Start the employee history panel if it is not yet for the given employee.
	 * If ever the the employee id is empty or blank, it calls the function _cleanEmployeeHistoryPanel to clean the employee history.
	 * @param {JSON Object} objectActive (optional) It is the object {@link scm_createTicket#affectedEmployee} or {@link scm_createTicket#requestor}
	 * Save the values for the security questions. The values are: <ul><li>the security questions result {@link scm_createTicket#securityQuestionsResult}</li><li>the list of questions that are flagged {@link scm_createTicket#securityQuestionFlags}</li></ul>
	 * @since 1.1
	 */
	_saveSecurityQuestions: function(objectActive) {
		//If the object active is not given, get it
		if (Object.isEmpty(objectActive)) {
			if (this.activeEmpSearch == 'affectedEmployee') 
				objectActive = this.affectedEmployee;
			else 
				objectActive = this.requestor;
		}
		
		//If the current company info is not the security question, nothing to do.
		if(objectActive.defDynCompInfo !== 'SecurityQuestions') return;
		
		//Check the security question result
		this.securityQuestionFlags = $A();
		if(Object.isFunction(scm_IsSecurityQuestionsChecked) 
				&& scm_IsSecurityQuestionsChecked())
			this.securityQuestionsResult = '1';
		else this.securityQuestionsResult = '3';
		
		//Get the list of checked input fields	
		this.screenObject.dynCompInfoSpot.select('input').each(function(inputElem){
			var elem = {id: inputElem.identify()};
			elem.checked 	= inputElem.checked;
			elem.disabled 	= inputElem.disabled;
			if(elem.checked || elem.disabled)
				this.securityQuestionFlags.push(elem);
		}, this);
	},
	
	/**
	 * If the security question screen is found, set the flagged items
	 * @since 1.1
	 */
	_applySecurityQuestions: function() {
		if(Object.isEmpty(this.securityQuestionFlags) || this.securityQuestionFlags.size() === 0) return;
		if(Object.isEmpty(this.screenObject.dynCompInfoSpot)) return;
		
		this.securityQuestionFlags.each(function(flags) {
			var input = this.screenObject.dynCompInfoSpot.down('input#' + flags.id);
			if(Object.isEmpty(input)) return;
			if(flags.checked) 	input.checked 	= true;
			if(flags.disabled) 	input.disabled 	= true;
		}, this);
	},
	
	/**
	 * @param {Object} Id of the employee to display
	 * @param {Object} Name of the employee to display
	 * Start the employee history panel if it is not yet for the given employee
	 * @since 1.0
	 * @see scm_createTicket#_cleanEmployeeHistoryPanel
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
	 * Function in charge of closing the employee history application.
	 * @since 1.0
	 */
	_cleanEmployeeHistoryPanel: function() {
		if(this.employeeHistLaunched === null) return;

		//Remove the employee history
		if(global.currentSubSubApplication && global.currentSubSubApplication.view === 'scm_employeeHistory') {
			global.closeSubSubApplication();
			this.employeeHistLaunched = null;
		} else if(global.currentSubApplication && global.currentSubApplication.view === 'scm_employeeHistory') {
			global.closeSubApplication();
			this.employeeHistLaunched = null;
		}
	},
	
	/**
	 * function that initialize the top panel of the screen (employee details).
	 * This function assignes the value of the company ID entered as the affected employee company id
	 * and calls the function _backend_loadCompanySettings in order to load the company settings for this specific company
	 * @since 1.0
	 * @see scm_createTicket#_backend_loadCompanySettings
	 */
	_initTopPanel:function(){
		this.affectedCompanyId = this.affectedEmployee.values.get('COMPANY_ID');
		this._backend_loadCompanySettings(true);
	},
		
	/**
	 * Fucntion in charge of intializing the middle panel (ticket details)
	 * This will do all the move between the internal variables values retrieved by the backend calls to the
	 * screen object in order to be displayed
	 * @since 1.0
	 * <br/>Modified in version 2.0:<ul>
	 * <li>Hide the remaining time label</li>
	 * <li>Hide the solved check box at creation</li>
	 * <li>Add of the service group text "Choose service area first"</li>
	 * </ul>
	 * <br/>Modified in version 2.1:<ul>
	 * <li>Remove the schedule to field for ticket creation</li>
	 * </ul>
	 */
	_initMiddlePanelTop:function(){
		// Ticket Creation Date
		this.screenObject.ticketCdateSpot.value.update(global.getLabel('SCM_no_subject').escapeHTML());
		this.screenObject.ticketCdateSpot.value.addClassName('SCM_ticketScreen_text_disabled');
		// Ticket Due Date
		this.screenObject.ticketDdateSpot.value.update(global.getLabel('SCM_no_subject').escapeHTML());
		this.screenObject.ticketDdateSpot.value.addClassName('SCM_ticketScreen_text_disabled');
		// Ticket Subject
		this.screenObject.ticketSubjectSpot.value.update(new Element('input',{ 'type':'text', 'class':'application_autocompleter_box SCM_ticketScreen_MiddlePanelTop_ticketDescription' }));
		// Ticket status --> default in processing (orange)
		this.screenObject.ticketStatusSpot.value.update(global.getLabel('SCM_no_subject').escapeHTML());
		this.screenObject.ticketStatusSpot.value.addClassName('SCM_ticketScreen_text_disabled');
		// Ticket Service Group
		this.screenObject.ticketSGSpot.value.update(global.getLabel('Choose_service_area_first'));
		this.screenObject.ticketSGSpot.value.addClassName('SCM_ticketScreen_text_disabled');
		// Automatically updated by the calls
		// Ticket service
		this.screenObject.ticketSSpot.value.update(global.getLabel('Choose_service_group_first'));
		this.screenObject.ticketSSpot.value.addClassName('SCM_ticketScreen_text_disabled');
		// Ticket attributes
		// Automatically updated by the calls
		if(this.screenObject.ticketRtimeSpot.value.up())
			this.screenObject.ticketRtimeSpot.value.remove();//addClassName('SCM_ticket_screen_hidden');
		if(this.screenObject.ticketRtimeSpot.label.up())
			this.screenObject.ticketRtimeSpot.label.remove();//addClassName('SCM_ticket_screen_hidden');
//		this.screenObject.hideFreeSpots();
		// Ticket internal
		this.screenObject.ticketMarkSolvedSpot.value.update('<div style="float:left; width:40%; text-align:left;"><input type="checkbox" id="scm_ticket_creation_internal_check">'+ global.getLabel('ticketInternal')+'</input></div>');
		//since 2.1 Schedule time is not defined for creation
		this.screenObject.ticketScheduledTimeSpot.label.update();
	},
	/**
	 * Function in charge of preparing the left part of the middle widget (ticket details).
	 * This left part is the RTE that will contain the ticket description. After creating the textarea corresponding to that part,
	 * it will call the _initEditor function in order to replace the textarea with the CKEditor object
	 * @since 1.0
	 * @see scm_createTicket#_initEditor
	 */
	_initMiddlePanelLeft:function(){
		this.screenObject.ticketDescrSpot.value.update();
		this.screenObject.ticketDescrSpot.value.insert('<textarea rows="13" cols="44" name="scm_ticketCreateScreenEditor"></textarea>');
		this._initEditor();
	},
	/**
	 * Function in charge of replacing the textarea for the ticket description with the CKEditor instance as defined by CKEditor.
	 * @since 1.0
	 * <br/>Modified for 2.1
	 * <ul>
	 * <li>Deactivate the spell checker</li>
	 * </ul>
	 * @see The <a href='http://docs.cksource.com/CKEditor_3.x/Developers_Guide' target='_new'>CKEditor developper guide</a>
	 */
	_initEditor:function(){
		//since 2.1 Deactivate the spell checker
		CKEDITOR.replace('scm_ticketCreateScreenEditor',
			{
	        	toolbar :
					[
						['Bold','Italic','Underline','Strike','Format','Undo','Redo','RemoveFormat'],
					    ['NumberedList','BulletedList','Outdent','Indent'],
					    ['Link','Image','HorizontalRule']/*,['Scayt']*/
					],
				resize_enabled: false,
				removePlugins : 'elementspath',
				uiColor: '#dcd2ce'/*,
				scayt_autoStartup: true*/
	    	});
	},
	/**
	 * Function in charge of creating the service area drop down list.
	 * @param {Array} listOfServiceAreas
	 * @since 2.0
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
			events: $H({onResultSelected: 'EWS:scm_ticketCreate_serviceAreaChoosen'}),
			showEverythingOnButtonClick: true,
			timeout: 5000,
			templateResult: '#{text}',
			templateOptionsList: '#{text}'
		}, json);
		
		this.screenObject.enlargeServiceAreasAutocompleter();
	},
	
	/**
	 * Function in charge of the initialization of the service groups drop down. Once the drop down is displayed, it calls the enlargeServiceGroupsAutocompleter in order to enlarge the drop down in order to match the desired display.
	 * @param {Array} listOfServiceGroups
	 * @see scm_createTicket#enlargeServiceGroupsAutocompleter
	 * @since 1.0
	 */
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
			events: $H({onResultSelected: 'EWS:scm_ticketCreate_serviceGroupChoosen'}),
			showEverythingOnButtonClick: true,
			timeout: 5000,
			templateResult: '#{text}',
			templateOptionsList: '#{text}'
		}, json);
		
		this.screenObject.enlargeServiceGroupsAutocompleter();
	},
	/**
	 * Function in charge of the initialization of the services drop down. Once the drop down is displayed, it calls the enlargeServicesAutocompleter in order to enlarge the drop down in order to match the desired display.
	 * @param {Array} listOfServiceGroups
	 * @see scm_createTicket#enlargeServicesAutocompleter
	 * @since 1.0
	 */
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
			events: $H({onResultSelected: 'EWS:scm_ticketCreate_serviceChoosen'}),
			showEverythingOnButtonClick: true,
			timeout: 5000,
			templateResult: '#{text}',
			templateOptionsList: '#{text}'
		}, json);
		
		this.screenObject.enlargeServicesAutocompleter();
	},	
	/**
	 * Function in charge of the initialization of the ticket attribute panel, for the company attributes.
	 * This list will be completed with the selected service attributes if any.
	 * This function will call the _initAttributeDropDown in order to display these attributes.
	 * @see scm_createTicket#_initAttributeDropDown
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
	 * Function in charge of the initialization of the ticket attribute panel, for the service attributes.
	 * This function will call the _initAttributeDropDown in order to display these attributes.
	 * @see scm_createTicket#_initAttributeDropDown
	 * @since 1.0
	 * <br/>Modified for 2.2
	 * <ul>
	 * <li>In the case of company skill with new values, overwrite with service data</li>
	 * </ul>
	 */
	_addServiceAttributePanel:function(){
		var skillToAdd;
		this.serviceSkills.each(function(serviceSkill){
			if (this.companySkills.get(serviceSkill.key) == null || Object.isUndefined(this.companySkills.get(serviceSkill.key))) {
				//Since 1.2 Add the line only if the drop down is to add
				skillToAdd = $H();
				skillToAdd.set(serviceSkill.key, serviceSkill.value);
				this.screenObject.addMiddlePanelRightAttributesForCreate(skillToAdd);
				
				this._initAttributeDropDown(serviceSkill, 'S');
			} else
				//since 2.2 Use service data
				this._initAttributeDropDown(serviceSkill, 'C');
		}.bind(this));		
	},
	/**
	 * Function in charge of the creation of the autocompleter objects for the ticket attributes.
	 * @param {JSon} skill A JSon object representing the skill with all it's properties
	 * @param {String} skillType "C" if the attribute is a company attribute, "S" if the attribute comes from a service
	 * @since 1.0
	 * <br/>Modified in version 2.0:<ul><li>Add of the possibility to have read only attributes.</li></ul>
	 * <br/>Modified in 1.2:
	 * <ul>
	 * <li>Remove the content of the cell to overwrite it</li>
	 * </ul>
	 */
	_initAttributeDropDown:function(skill, skillType){
		var spotId = 'ticketAtt_'+ skillType + '_' + skill.value.skillTypeId;
		//since 1.2 If the field already exist, remove it
		this.screenObject.ticketAttrSpot.value.down('div#'+spotId).update();
		var skillPossValues = objectToArray(skill.value.skillPossValues.KeyValue);
		if (skillPossValues.size() == 1 && skillPossValues[0].Key == skill.value.skillId) {
			this.screenObject.ticketAttrSpot.value.down('[id="'+spotId+'"]').insert(skillPossValues[0].Value);
		} else {
			var values = $A();
			skillPossValues.each(function(skillValues){
				//since 2.0 Use a constant for the absence of value
				if (skill.value.skillId != HrwEngine.NO_VALUE) {
					if (skillValues.Key == skill.value.skillId) {
						values.push({def: 'X', data: skillValues.Key, text: skillValues.Value});
					} else {
						values.push({data: skillValues.Key, text: skillValues.Value });
					}
				} else {
					values.push({data: skillValues.Key, text: skillValues.Value});
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
	 * Function in charge of clearing the top right container (dynamic company infos)
	 * @since 1.0
	 */
	_cleanTopRightContainer:function(){
		//since 1.1 Reset the security question result
		this.securityQuestionsResult = '3';
		this.securityQuestionFlags	 = $A();
		
		if(this.screenObject.dynCompInfoSpot)
			this.screenObject.dynCompInfoSpot.update();
	},
	/**
	 * Function in charge of updating the top right container (dynamic company infos).
	 * This update will be done by calling the backend in order to get accurate data via the function _backend_getTopRightContent.
	 * @see scm_createTicket#_backend_getTopRightContent
	 * @since 1.0
	 */
	_updateTopRightContainer:function(){
		this._backend_getTopRightContent();
	},
	/**
	 * Function in charge of updating the service groups display. As no service group is selected, the drop down for service should be removed and the appropriate text should be displayed.
	 * @since 1.0<br>
	 * Modified in 2.0:<ul>
	 * 	<li>Add of the text "Choose service area first as default content for the service groups div</li>
	 * </ul>
	 */
	_updateServiceGroups:function(){
		this.screenObject.ticketSGSpot.value.update();
		this.screenObject.ticketSSpot.value.update();
		this.screenObject.ticketSGSpot.value.insert(global.getLabel('Choose_service_area_first'));
		this.screenObject.ticketSSpot.value.insert(global.getLabel('Choose_service_group_first'));
	},
	/**
	 * Function in charge of emptying the panel containing the attributes of the ticket
	 * @since 1.0
	 */
	_updateCompanyAttributes:function(){
		this.screenObject.cleanMiddlePanelRightAttributesForCreate();
	},
	/**
	 * @deprecated since 1.0
	 * @since 1.0
	 */
	_defineAttributePossibleValues:function(memo){
		var clickedAttribute = getArgs(memo).attributeId;
		this.companySkills.each(function(ticketAttribute){
			if (ticketAttribute.skillId == clickedAttribute){
				this._showAttributePossibleValues(ticketAttribute.skillPossValues);
			}
		}.bind(this));
	},
	/**
	 * @deprecated since 1.0
	 * @since 1.0
	 */
	_showAttributePossibleValues:function(possibleValues){
		var values = objectToArray(possibleValues.KeyValue);
	},
	/**
	 * Function in charge of showing the top right container (employee details -> security questions, employee data,...) depending of the selected employee (requestor or affected employee).
	 * @since 1.0
	 */
	_showTopRightContainerValue:function(){
		var objectActive;
		if (this.activeEmpSearch == 'affectedEmployee'){
			objectActive = this.affectedEmployee;
		}else{
			objectActive = this.requestor;
		}

		//Addition of the load script
		//since 1.2 If there are security questions, update the form
		if(objectActive.dynCompInfo.get('SecurityQuestions')) {
			var head = $('fwk_head');
			var script = head.down('script#SCM_SQ_Functions');
			if (!Object.isEmpty(script)) script.remove();
			script = new Element('script', {
				type: 'text/javascript',
				id	: 'SCM_SQ_Functions'
			});
			head.insert(script);
			
			var startIndex = objectActive.dynCompInfo.get('SecurityQuestions').indexOf('<script');
			startIndex = objectActive.dynCompInfo.get('SecurityQuestions').indexOf('>', startIndex) + 1;
			var endIndex   = objectActive.dynCompInfo.get('SecurityQuestions').indexOf('</script>');
			script.update(objectActive.dynCompInfo.get('SecurityQuestions').substring(startIndex,endIndex));
		}
		
		//Change the document
		this.screenObject.dynCompInfoSpot.update();
		this.screenObject.dynCompInfoSpot.insert(objectActive.dynCompInfo.get(objectActive.defDynCompInfo));

		//since 1.1 Replace the checked flags in the security questions
		this._applySecurityQuestions();
	},
	/**
	 * Function in charge of checking if all mandatory fields are filled in before creating the ticket.
	 * This function will create an Array with the wrong entries in order to be able to display then in the screen.
	 * @return {JSon} A JSon object containing the wrong entries and a flag which will be true if no wrong entries are found, flase otherwise.
	 * @since 1.0
	 * <br/>Modified for version 2.2:
	 * <ul>
	 * <li>The value could be in the autocompleter in the service or company skill => read both values</li>
	 * </ul>
	 * <br/>Modified for version 2.1:
	 * <ul>
	 * <li>If there is no value for a skill, skip it</li>
	 * </ul>
	 */
	_checkCreationValidity:function(){
		var validityFlag = true;
		var errorEntries = $A();
		this.skillsWithValues = $A();
		// requestor ID
		if(this.enableRequestor && (this.requestor.employeeSearch.getValues('EMP_ID') == null || Object.isEmpty(this.requestor.employeeSearch.getValues('EMP_ID')))){
			errorEntries.push({element:'requestor employeeSearch'});
			validityFlag = false;
		}
		// Affected employee ID
		if(this.affectedEmployee.employeeSearch.getValues('EMP_ID') === null || Object.isEmpty(this.affectedEmployee.employeeSearch.getValues('EMP_ID'))){
			errorEntries.push({element:'affectedEmployee employeeSearch'});
			validityFlag = false;
		}
		// Subject
		if(Object.isEmpty(this.screenObject.ticketSubjectSpot.value.down().value)){
			errorEntries.push({element:'subject'});
			validityFlag = false;
		}
		// Service
		if(Object.isEmpty(this.selectedService) || this.selectedService <= 0){
			errorEntries.push({element:'service'});
			validityFlag = false;
		}
		// Description
		var editor_data = CKEDITOR.instances.scm_ticketCreateScreenEditor.getData();
		if(Object.isEmpty(editor_data)){
			errorEntries.push({element:'description'});
			validityFlag = false;
		}
		// Grouping skill
		if (this.useGroupingSkills) {
			if (!this.companyGroupingAC.getValue()) {
				errorEntries.push({ element: 'groupingSkill' });
				validityFlag = false;
			}
		}
		
		// Company skills and service skills
		//since 2.1 If a skill is company and service based, get it from the company
		if (this.serviceSkills) {
		    this.serviceSkills.each(function(skill) {
		        //since 1.2 If the field is also in company skills, nothing to check here
		        if (this.companySkills && this.companySkills.get(skill.key)) return;
		        var skillWValue = { skillId: null, value: null, mandatory: skill.value.mandatoryOpen, type: 'S' };
		        skillWValue.skillId = skill.value.skillTypeId;
		        var skillACValues;
		        if (skill.value.autoCompleter) {
		            //since 2.1 If there is no value in the autocomplete, skip it
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
				//since 2.2 Check in the service list to see if the value is not there
				var serviceSkill;
				var serviceValue;
				if (this.serviceSkills) {
					serviceSkill = this.serviceSkills.get(skill.key);
					if (!Object.isEmpty(serviceSkill.autoCompleter)) 
						serviceValue = serviceSkill.autoCompleter.getValue();
				}	
				
				var skillWValue = {skillId: null, value:null, mandatory:skill.value.mandatoryOpen, type:'C'};
				skillWValue.skillId = skill.value.skillTypeId;
				
				var skillACValues;
				if (skill.value.autoCompleter) {
					//since 2.1 If there is no value in the autocomplete, skip it
					//since 2.2 Get the value of the service skill or of the company skill
					var value = (skill.value.autoCompleter.getValue()||serviceValue);
					if (value) 
						skillACValues = value.idAdded;
				} else 
					skillACValues = skill.value.skillId;
					
				if (skillACValues) skillWValue.value = skillACValues;
				
				this.skillsWithValues.push(skillWValue);
			}.bind(this));
		}
		this.skillsWithValues.each(function(skill){
			if(skill.mandatory == 'true' && Object.isEmpty(skill.value)){
				errorEntries.push({element:'skill', id:skill.skillId, type:skill.type});
				validityFlag = false;
			}	
		}.bind(this));
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
			case 'description': domElement = this.screenObject.ticketDescrSpot.label;
								errorLabel = global.getLabel('DESCR');
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
								errorLabel = global.getLabel('Attributes') + ' ' + domElement.innerHTML.stripTags();
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
	 * Function in charge of appliying the error class on a given DOM element.
	 * @param {DOMElement} element The element on which the error class should be applied.
	 * @since 1.0
	 */
	_setElementOnError:function(element){
		element.addClassName('SCM_ticketCreate_elemOnError');
	},
	/**
	 * Function in charge of removing the error class on ALL elements on error.<br>
	 * This function will loop at the errorElements attributes and remove the error classname.
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
	 * Function in charge of displaying the grouping skill dropdown based on the grouping skills retrieved from the backend HRW.
	 * @since 1.0
	 */
	_buildGroupingSkillsDropDown:function(){
		this.screenObject.ticketCompanyGroupingSpot.value.removeClassName('SCM_ticket_screen_hidden')
		var dropdown = $A();
		this.groupingSkills.each(function(groupingSkill){
			if(groupingSkill.Key == this.defaultGroupingSkill){
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
	 * Function in charge of hiding the grouping skills container if it is not used by the company (based on the company settings).
	 * @since 1.0
	 */
	_hideGroupingSkills:function(){
		this.screenObject.ticketCompanyGroupingSpot.value.addClassName('SCM_ticket_screen_hidden')
	},
/*----------------------------------------------------------------------------------------------
 * 								BACKEND CALLS FUNCTIONS 
 *--------------------------------------------------------------------------------------------*/    	
	/**
	 * Function in charge of calling the backend HRW in order to retrieve the company settings.<br>
	 * This function calls either loadCompanySettingsHandler as responder or reloadCompanySettingsHandler if this is not the first call to this function.<br>
	 * This is determined by the firstLoad flag given in parameter.
	 * @param {boolean} firstLoad Flag representing if this is the first call to this function.
	 * @since 1.0
	 * <br/>Modified for 1.2
	 * <ul>
	 * <li>Addition of a new HRW parameter</li>
	 * </ul>
	 * @see scm_createTicket#loadCompanySettingsHandler
	 * @see scm_createTicket#reloadCompanySettingsHandler
	 * @see HrwEngine#callBackend
	 */
	_backend_loadCompanySettings:function(firstLoad){
		var functionName = 'loadCompanySettingsHandler';
		if(firstLoad !== true) functionName = 'reloadCompanySettingsHandler';
		//since 1.2 Add the parameter employee id
		hrwEngine.callBackend(this, 'Admin.GetCompanySettings', $H({
	        scAgentId           : hrwEngine.scAgentId,
			clientSkillId		: this.affectedCompanyId,
			employeeId			: this.affectedEmployee.values.get('EMP_ID')
		}), functionName);
	},
	/**
	 * Function in charge of calling the backend HRW in order to retrieve the company service groups.<br>
	 * This function will call getServiceGroupsHandler as responder.
	 * @see scm_createTicket#getServiceGroupsHandler
	 * @see HrwEngine#callBackend
	 * @since 1.0 <br>Modified in 2.0:<ul><li>New backend function name</li></ul>
	 */
	_backend_getServiceGroups:function(){
		//since 2.0 The backend function changed of name
		hrwEngine.callBackend(this, 'Admin.CollectServiceGroups', $H({
	        scAgentId           : hrwEngine.scAgentId,
			CompanySkillId		: this.companySkillId
		}), 'getServiceGroupsHandler');
	},
	
	/**
	 * Function in charge of calling the backend HRW in order to retrieve the company service areas.<br>
	 * This function will call getServiceAreaHandler as responder.
	 * @see scm_createTicket#getServiceAreaHandler
	 * @see HrwEngine#callBackend
	 * @since 2.0
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
	 * @since 2.0
	 */
	_backend_getServiceGroupsWithArea:function(){
		//since 2.0 The backend function changed of name
		hrwEngine.callBackend(this, 'Admin.CollectServiceGroupsWithServiceAreaId', $H({
	        scAgentId           : hrwEngine.scAgentId,
			CompanySkillId		: this.companySkillId,
			serviceAreaId		: this.selectedServiceArea
		}), 'getServiceGroupsHandler');
	},
	
	/**
	 * Function in charge of calling the backend HRW in order to retrieve the company services.<br>
	 * This function will call getServicesHandler as responder.
	 * @see scm_createTicket#getServicesHandler
	 * @see HrwEngine#callBackend
	 * @param {int} serviceGroup The selected service group
	 * @param {int} companyId The company id
	 * @since 1.0 <br>Modified in 2.0:<ul><li>New backend function name</li></ul>
	 */
	_backend_getServices:function(serviceGroup, companyId){
		//since 2.0 The backend function changed of name
		hrwEngine.callBackend(this, 'Admin.CollectServices', $H({
				scAgentId: hrwEngine.scAgentId,
				CompanySkillId: companyId,
				serviceGroupId: serviceGroup
			}), 'getServicesHandler');
	},
	/**
	 * Function in charge of calling the backend HRW in order to retrieve the company based attributes.<br>
	 * This function will call getPossibleCompanyAttributesHandler as responder.
	 * @see scm_createTicket#getPossibleCompanyAttributesHandler
	 * @see HrwEngine#callBackend
	 * @since 1.0
	 * <br/>Modified in 1.2:
	 * <ul>
	 * <li>Call the service to get the list of all services in any case (no more the dependant or independant services)</li>
	 * </ul>
	 */
	_backend_getPossibleCompanyAttributes:function(){
		//since 1.2 Call the unique HRW method to get the list of skills
		hrwEngine.callBackend(this, 'Admin.CollectSkillsBySkillType', $H({
			scAgentId: hrwEngine.scAgentId,
			clientSkillId: this.affectedCompanyId,
			employeeId: this.affectedId,
			//since 1.2 Use a constant for the absence of value
			serviceSkillId: (Object.isEmpty(this.selectedService) || this.selectedService <= 0)? HrwEngine.NO_VALUE : this.selectedService
		}), 'getPossibleCompanyAttributesHandler');
	},
	/**
	 * Function in charge of calling the backend HRW in order to retrieve the service based attributes depending of the selected service.<br>
	 * This function will call getPossibleServiceAttributesHandler as responder.
	 * @see scm_createTicket#getPossibleServiceAttributesHandler
	 * @see HrwEngine#callBackend
	 * @since 1.0
	 * <br/>Modified for 1.2
	 * <ul>
	 * <li>Call the service to get the list of all services in any case (no more the dependant or independant services)</li>
	 * </ul>
	 * @param {int} selectedCompId The id of the company Id
	 */
	_backend_getPossibleServiceAttributes:function(selectedCompId){
		//since 1.2 Call the unique HRW method to get the list of skills
		hrwEngine.callBackend(this, 'Admin.CollectSkillsBySkillType', $H({
			scAgentId: hrwEngine.scAgentId,
			clientSkillId: selectedCompId,
			employeeId: this.affectedId,
			//since 1.2 Use a constant for the absence of value
			serviceSkillId: (Object.isEmpty(this.selectedService) || this.selectedService <= 0)? HrwEngine.NO_VALUE : this.selectedService
		}), 'getPossibleServiceAttributesHandler');
	},
	/**
	 * Function in charge of calling the backend HRW in order to retrieve the top right content (Html page coming fron HRW) depending of the selected employee (requestor or affected employee).<br>
	 * This function will call getTopRightContentHandler as responder.
	 * @see scm_createTicket#getTopRightContentHandler
	 * @see HrwEngine#callBackend
	 * @since 1.0
	 */
	_backend_getTopRightContent:function(){
		var selectedCompId;
		var employeeId;
		if (this.activeEmpSearch == 'affectedEmployee' ){
			selectedCompId = this.affectedCompanyId;
			employeeId = this.affectedId;
		}else{
			selectedCompId = this.requestorCompanyId;
			employeeId = this.requestorId;
		}

		hrwEngine.callBackend(this, 'Backend.GetDynamicCompanyInfo', $H({
				scAgentId		: hrwEngine.scAgentId,
				clientSkillId	: selectedCompId,
				employeeId		: employeeId,
				onExistingTicket: false
			}), this.getTopRightContentHandler.bind(this, this.activeEmpSearch));
	},
	/**
	 * Function in charge of calling the backend HRW in order to create a ticket. This method uses an XML version of the ticket in order to send to info to the backend<br>
	 * This function will call createTicketHandler as responder.
	 * @see scm_createTicket#createTicketHandler
	 * @see HrwEngine#callBackend
	 * @param {String} mailTo The email address to who a confirmation should be send be email <i>might be empty if no mail confirmation</i>.
	 * @param {String} mailFrom The email address from which the confirmation is sent <i>might be empty if no mail confirmation</i>.
	 * @since 1.0
	 */
	_backend_createTicket:function(mailTo, mailFrom){
		hrwEngine.callBackend(this, 'Ticket.CreateTicket', $H({
			scAgentId		: hrwEngine.scAgentId,
			ticket			: this.hrwTicketXml,
			ticketSkillIds 	: this.hrwTicketSkillsXml,
			mailTo			: mailTo,
			mailFrom		: mailFrom
		}), 'createTicketHandler');
	},
	/**
	 * Function in charge of calling the backend HRW in order to create get the email preview of the confirmation mail (if choosen to send, or if defined as default behaviour in the company settings)<br>
	 * This function will call showMailBeforeCreationPopupHandler as responder.
	 * @see scm_createTicket#showMailBeforeCreationPopupHandler
	 * @see HrwEngine#callBackend
	 * @since 1.0
	 */
	_backend_showMailPopupBeforeCreation:function(){
		hrwEngine.callBackend(this, 'Email.GetEmailPreviewAfterCreation', $H({
			scAgentId		: hrwEngine.scAgentId,
			ticket			: this.hrwTicketXml
		}),'showMailBeforeCreationPopupHandler');
	},
/*----------------------------------------------------------------------------------------------
 * 								CALLS HANDLER FUNCTIONS 
 *--------------------------------------------------------------------------------------------*/    	
	/**
	 * Function in charge of reloading the company settings.<br>
	 * That means:
	 * <ul>
	 * 	<li>update the service groups (_updateServiceGroups function),</li>
	 * 	<li>update the company attributes (_updateCompanyAttributes function),</li>
	 * 	<li>reload the service groups (_backend_getServiceGroups function) and</li>
	 * 	<li>reload the company service groups (_backend_getPossibleCompanyAttributes function).</li>
	 * </ul>
	 * @see scm_createTicket#_updateServiceGroups
	 * @see scm_createTicket#_updateCompanyAttributes
	 * @see scm_createTicket#_backend_getServiceGroups
	 * @see scm_createTicket#_backend_getPossibleCompanyAttributes
	 * @since 1.0<br>Modified in version 2.0:<ul><li>The flag <i>addServiceAttributes</i> is set to flase. As this flag has been introduce in version 2.0 and should be false for all existing calls before 2.0.</li</ul>
	 */
	reloadCompanySettingsHandler: function() {
		this.addServiceAttributes = false;
		this._updateServiceGroups();
		this._updateCompanyAttributes();
		this._backend_getServiceGroups();
		this._backend_getPossibleCompanyAttributes();
	},
	/**
	 * Function in charge of assigning the company setting loaded by the backend call.<br>
	 * It also call the backend to check if the connection has not been lost and if there is notifications for the current logged agent.<br>
	 * After assigning the values loaded by the bakend call, this function will call:
	 * <ul>
	 * 	<li>_disableCompanyChange in order to avoid that the user changes the company selected,</li>
	 * 	<li>_updateServiceGroups in order to update the list of services groups,</li>
	 * 	<li>_updateCompanyAttributes in order to update the company based attributes,</li>
	 * 	<li>_backend_getServiceGroups in order to load the services groups,</li>
	 * 	<li>_backend_getPossibleCompanyAttributes in order to load the company based attributes,</li>
	 * 	<li>_makeDueDateChangeable in order to allow the user to change the due date if permitted by the company settings and</li>
	 * 	<li>_buildGroupingSkillsDropDown or _hideGroupingSkills if the company is using or not the grouping skills</li>
	 * </ul>
	 * @param {JSon} json The answer of the backend call.
	 * @see scm_createTicket#_disableCompanyChange
	 * @see scm_createTicket#_updateServiceGroups
	 * @see scm_createTicket#_updateCompanyAttributes
	 * @see scm_createTicket#_backend_getServiceGroups
	 * @see scm_createTicket#_backend_getPossibleCompanyAttributes
	 * @see scm_createTicket#_makeDueDateChangeable
	 * @see scm_createTicket#_buildGroupingSkillsDropDown
	 * @see scm_createTicket#_hideGroupingSkills
	 * @since 1.0
	 * <br/>Modified in version 2.0:<ul><li>The flag <i>addServiceAttributes</i> is set to flase. As this flag has been introduce in version 2.0 and should be false for all existing calls before 2.0.</li</ul>
	 * <br/>Modified in version 1.1:
	 * <ul>
	 * <li>Remove the call to the manage heartBeat</li>
	 * <li>Create the user actions via the factory</li>
	 * </ul>
	 */
	loadCompanySettingsHandler:function(json){
		this.enableRequestor = (json.EWS.HrwResponse.HrwResult.CompanySettings.EnableSecondaryEmployeeField.toLowerCase() === "true");
		
		this.companySkillId = json.EWS.HrwResponse.HrwResult.CompanySettings.CompanySkillId;
		
		// Affected employee part
		this.activeEmpSearch = 'affectedEmployee';
		this.affectedEmployee.employeeSearch = ScmEmployeeSearch.factory(this, 'createTicketsAffEmployee', false);		
		this.affectedEmployee.extension	     = this.affectedEmployee.employeeSearch.getForm(false);
		this.screenObject.empSearchSpotAff.update();
		this.screenObject.empSearchSpotAff.insert(this.affectedEmployee.extension);				
		this.affectedEmployee.employeeSearch.setFormInitial(this.affectedEmployee.extension, false, hrwEngine.custCompMandatory);
		//since 1.1 Create the user actions via the factory
		this.affectedEmployee.userAction = ScmUserAction.factory(ScmUserAction.DISPLAY_AS_APPLI, this, 'SCM_FindEmpl_createTicketsAffEmployee_EMP_ID', $A(['scm_employeeHistory', 'scm_ticketApp', 'scm_createTicket']));
        this.affectedEmployee.userAction.addActionOnField(	this.affectedEmployee.values.get('EMP_ID'), this.affectedEmployee.values.get('FIRST_NAME') + ' ' + this.affectedEmployee.values.get('LAST_NAME'), this.affectedEmployee.values.get('COMPANY_ID'), 5, false);
		this.affectedEmployee.builded 		 = true;
		this.affectedCompanyId = this.affectedEmployee.values.get('COMPANY_ID');
		this.affectedEmployee.employeeSearch.setValues(this.affectedEmployee.values);
		
		// Requestor part
		if(this.enableRequestor === true) {
			this.activeEmpSearch = 'requestor';
			this.requestor.employeeSearch  = ScmEmployeeSearch.factory(this, 'createTicketsRequestor', false);
	        this.requestor.extension	   = this.requestor.employeeSearch.getForm(false);
			this.screenObject.empSearchSpotReq.update();
			this.screenObject.empSearchSpotReq.insert(this.requestor.extension);				
			this.requestor.employeeSearch.setFormInitial(this.requestor.extension, false, hrwEngine.custCompMandatory);
			//since 1.1 Create the user actions via the factory
			this.requestor.userAction = ScmUserAction.factory(ScmUserAction.DISPLAY_AS_APPLI, this, 'SCM_FindEmpl_createTicketsRequestor_EMP_ID', $A(['scm_employeeHistory', 'scm_ticketApp', 'scm_createTicket']));
	        this.requestor.userAction.addActionOnField(	this.requestor.values.get('EMP_ID'), this.requestor.values.get('FIRST_NAME') + ' ' + this.requestor.values.get('LAST_NAME'), this.requestor.values.get('COMPANY_ID'), 5, false);
			this.requestor.builded	= true;
			this.requestorCompanyId	= this.requestor.values.get('COMPANY_ID');
			this.requestor.employeeSearch.setValues(this.requestor.values);
		}

		this._disableCompanyChange();
		this.addServiceAttributes = false;
		this._updateServiceGroups();
		this._updateCompanyAttributes();
		/** NEW */
		json.EWS.HrwResponse.HrwResult.CompanySettings.EnableServiceAreaLevel == "false"? this.useAreas = false:this.useAreas = true;
		if (this.useAreas == false) {
			this.screenObject.removeServiceArea();
			this._backend_getServiceGroups();
		} else {
			this._backend_getServiceAreas();
		}
		this._backend_getPossibleCompanyAttributes();
		
		if (this.enableRequestor === false) {
			this.screenObject.empSearchSpotReq.addClassName('SCM_ticket_screen_hidden');
			this.screenObject.requestorLink.addClassName('SCM_ticket_screen_hidden');
			this.screenObject.empSearchSpotAff.removeClassName('SCM_ticket_screen_hidden');
			this.screenObject.affEmployeeLink.removeClassName('application_action_link');
			this.screenObject.affEmployeeLink.stopObserving('click');
			this.activeEmpSearch = 'affectedEmployee';
		}
		// since 1.1 correction for the flag testing to know if it should be displayed
		if(json.EWS.HrwResponse.HrwResult.CompanySettings.SendMailAfterCreationVisible){
			if(json.EWS.HrwResponse.HrwResult.CompanySettings.SendMailAfterCreationVisible == "true"){
				if(json.EWS.HrwResponse.HrwResult.CompanySettings.SendMailAfterCreationChecked == "true")
					this.screenObject.ticketMailCheckBox.value.checked = true;	
				else
					this.screenObject.ticketMailCheckBox.value.checked = false;	
			}else{
				this.screenObject.ticketMailCheckboxDiv.value.addClassName('SCM_ticket_screen_hidden');
			}
		}
		
		if(!Object.isEmpty(json.EWS.HrwResponse.HrwResult.CompanySettings.GroupingSkills)){
			this.useGroupingSkills 		= true;
			this.defaultGroupingSkill 	= json.EWS.HrwResponse.HrwResult.CompanySettings.DefaultGroupingSkillId;
			this.groupingSkills 		= objectToArray(json.EWS.HrwResponse.HrwResult.CompanySettings.GroupingSkills.KeyValue);
			this._buildGroupingSkillsDropDown();
		}else{
			this.useGroupingSkills 		= false;
			this._hideGroupingSkills();
		}
		
		json.EWS.HrwResponse.HrwResult.CompanySettings.EnableDueDateDyn == "false"?this.allowDDchange = false:this.allowDDchange=true;
		
			
		this._makeDueDateChangeable();
	},
	
	/**
	 * Function in charge of managing the service area retrieved from the backend call.<br>
	 * After having retrived the service areas from the JSon object, it will create the Array in the correct format for the autocompleter module.
	 * Once this is done, it will call the _initServiceAreaDropDown in order to display the dropdown on the screen.
	 * @see scm_createTicket#_initServiceAreaDropDown
	 * @param {JSon} json
	 * @since 2.0 
	 */
	getServiceAreaHandler:function(json){
		this.serviceAreas = $A();
		var serviceAreas = json.EWS.HrwResponse.HrwResult.ArrayOfKeyValue;
		if (!Object.isEmpty(serviceAreas)){
			serviceAreas = objectToArray(serviceAreas.KeyValue);
		}
		serviceAreas.each( function(serviceArea) {
			this.serviceAreas.push({ data: serviceArea.Key, text:serviceArea.Value});
		}.bind(this));
		
		this._initServiceAreaDropDown(this.serviceAreas);
	},
	
	
	/**
	 * Function in charge of managing the services groups retrieved from the backend call.<br>
	 * After having retrived the service groups from the JSon object, it will create the Array in the correct format for the autocompleter module.
	 * Once this is done, it will call the _initServiceGroupDropDown in order to display the dropdown on the screen.
	 * @see scm_createTicket#_initServiceGroupDropDown
	 * @param {JSon} json The answer of the backend call.
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
			this.serviceGroups.push({ data: serviceGroup.Key, text:serviceGroup.Value});
		}.bind(this));
		this._initServiceGroupDropDown(this.serviceGroups);
	},	
	/**
	 * Function in charge of managing the services retrieved from the backend call.<br>
	 * After having retrived the services from the JSon object, it will create the Array in the correct format for the autocompleter module.
	 * Once this is done, it will call the _initServiceDropDown in order to display the dropdown on the screen.
	 * @see scm_createTicket#_initServiceDropDown
	 * @param {JSon} json The answer of the backend call.
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
			this.services.push({ data: service.Key, text:service.Value});
		}.bind(this));
		this._initServiceDropDown(this.services);
	},	
	/**
	 * Function in charge of managing the company attributes retrieved from the backend call.<br>
	 * After having retrived the company attributes from the JSon object, it will create an Hash with these attributes.
	 * Once this is done, it will call the _initCompanyAttributePanel in order to display the attributes on the screen.<br><br>
	 * <b>In version 2.0</b>, a test is added in order to know if the service related attributes should be added in the display.
	 * This is due to the modification of the way the company attributes are retrieved. As they are now linked to the employee id too, 
	 * the company attributes might change if the selected employee is in another company but the selected service might not be changed.
	 * That means that the existing retrieved service attributes should also be display. If the flag is set to true, that means the service attributes
	 * should also be display.
	 * @see scm_createTicket#_initCompanyAttributePanel
	 * @see scm_createTicket#_addServiceAttributePanel
	 * @param {JSon} json The answer of the backend call.
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
		if(this.addServiceAttributes == true){
			this.addServiceAttributes = false;
			this._addServiceAttributePanel();
		}
	},
	/**
	 * Function in charge of managing the service attributes retrieved from the backend call.<br>
	 * It will first create a Array with the attributes that should be removed (if any) as these attributes are service depended and thus, the previous service attributes should be removed.
	 * After having retrived the service attributes from the JSon object, it will create an Hash with these attributes.
	 * Once this is done, it will call the _addServiceAttributePanel in order to display the attributes on the screen.
	 * @see scm_createTicket#_addServiceAttributePanel
	 * @param {JSon} json The answer of the backend call.
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
				this.serviceSkills.set(skill.SkillTypeId, skillDef);
			}.bind(this));
		}
		this._addServiceAttributePanel();
	},
	
	/**
	 * Function in charge of managing the html form retrieved from the backend call.<br>
	 * It will first define which employee is currently handled.
	 * After having retrived the HTML forms (employee data, security questions,...) from the JSon object, it will create an Hash with these HTML forms.
	 * Once this is done, it will call the _showTopRightContainerValue in order to display the top right content of the screen.
	 * @see scm_createTicket#_showTopRightContainerValue
	 * @param {JSon} json The answer of the backend call.
	 * @since 1.0
	 * <br/>Modified in version 2.2:
	 * <ul>
	 * <li>If there is no dynamic webforms created, do it</li>
	 * </ul>
	 * <br/>Modified in version 1.1:
	 * <ul>
	 * <li>Remove the call to the manage heartBeat</li>
	 * </ul>
	 */
	getTopRightContentHandler:function(currentEmployee, json){
		var objectActive;
		
		//since 2.2 Make sure that both Hash tables exists before working with them
		 if(!Object.isHash(this.affectedEmployee.dynCompInfo)) 	this.affectedEmployee.dynCompInfo 	= $H();
		 if(!Object.isHash(this.requestor.dynCompInfo)) 		this.requestor.dynCompInfo 			= $H();
		
		if(currentEmployee == 'affectedEmployee') objectActive = this.affectedEmployee;
		else objectActive = this.requestor;

		var webForms = objectToArray(json.EWS.HrwResponse.HrwResult.ArrayOfWebForm.WebForm);
		webForms.each(function(webForm){
			objectActive.dynCompInfo.set(webForm.WebFormType, webForm.HtmlForm);
		}.bind(this));
		
		//since 1.1 Have the same security question for requestor and affected employee. The requestor if any or the affected employee.
		if(this.enableRequestor === true && !Object.isEmpty(objectActive.dynCompInfo.get('SecurityQuestions')))
			this.affectedEmployee.dynCompInfo.set('SecurityQuestions', this.requestor.dynCompInfo.get('SecurityQuestions'));
		
		this.screenObject.dynCompInfoList = objectActive.dynCompInfo.keys();

		if(!objectActive.defDynCompInfo)
			objectActive.defDynCompInfo = this.screenObject.dynCompInfoList[0];

		this._showTopRightContainerValue();		
	},
	/**
	 * Function in charge of the process after the ticket has been created.
	 * That means opening the edition application for the created ticket.
	 * @param {JSon} json The answer of the backend call.
	 * @since 1.0
	 * <br/>Modified in 2.2:
	 * <ul>
	 * <li>Call the refresh of the pending tickets list</li>
	 * </ul>
	 */
	createTicketHandler:function(json){
		//since 2.2 Reload the list of tickets in processing
		document.fire('EWS:scm_refreshPendList');
		
		global.open($H({
			app: {
				appId: 'TIK_PL',
				tabId: 'PL_TIK'	,
				view : 'scm_ticketApp'
			},
			selectedPart: scm_ticketApp.PROPERTIES	,
			forCreation	: false						,
			forEdition	: true						,
			ticketId	: json.EWS.HrwResponse.HrwResult.HrwTicket.TicketId	
		}));
	},
	/**
	 * Function in charge of showing the email preview when the agent request an email to be sent to the requestor of the ticket.
	 * It might be configured in the company settings that this option is either optional, mandatory or not available.<br>
	 * It calls the method displayEmailPopup on a newly created ticketActionPopupScreens object.
	 * @see ticketActionPopupScreens#displayEmailPopup
	 * @param {JSon} json The answer of the backend call.
	 * @since 1.0
	 */
	showMailBeforeCreationPopupHandler:function(json){
		var mailBody = json.EWS.HrwResponse.HrwResult.EmailPreview.MailBody;
		var mailFrom = objectToArray(json.EWS.HrwResponse.HrwResult.EmailPreview.MailFromData.Email);
		var mailTo   = objectToArray(json.EWS.HrwResponse.HrwResult.EmailPreview.MailToData.string);
		new ticketActionPopupScreens().displayEmailPopup(mailBody, mailFrom, mailTo, 'Send');
	},
/*----------------------------------------------------------------------------------------------
 * 								EVENTS RESPONDER FUNCTIONS 
 *--------------------------------------------------------------------------------------------*/    	
	/**
	 * Function in charge of managing the click on the affected employee link.
	 * It has to show the affected employee search and the HTML forms associated to the selected employee.
	 * If the affected employee is a newly entered one, the backend will be called in order to retrieve the HTML Forms associated (_backend_getTopRightContent),
	 * if the employee is empty or not found with the search, the top right container should be empty (_cleanTopRightContainer) and if the employee did not changed, the associated HTML forms should be displayed (_showTopRightContainerValue).
	 * @param {Event} memo The event parameters.
	 * @see scm_createTicket#_backend_getTopRightContent
	 * @see scm_createTicket#_cleanTopRightContainer 
	 * @see scm_createTicket#_showTopRightContainerValue
	 * @since 1.0
	 * <br/>Modified in version 1.1:
	 * <ul>
	 * <li>Create the user actions via the factory</li>
	 * </ul>
	 */
	_showAffectedEmployeeSearchEvent:function(memo){
		//since 1.1 Save the security questions results
		this._saveSecurityQuestions(this.requestor);
		
		this.requestor.values = this.requestor.employeeSearch.getValues();
		if (this.affectedEmployee.builded == false) {
			this.screenObject.empSearchSpotAff.insert(this.affectedEmployee.extension);
			this.affectedEmployee.employeeSearch.setFormInitial(this.affectedEmployee.extension, false, hrwEngine.custCompMandatory);
			//since 1.1 Create the user actions via the factory
			this.affectedEmployee.userAction = ScmUserAction.factory(ScmUserAction.DISPLAY_AS_APPLI, this, 'SCM_FindEmpl_createTicketsAffEmployee_EMP_ID', $A(['scm_employeeHistory', 'scm_ticketApp', 'scm_createTicket']));
            this.affectedEmployee.userAction.addActionOnField(	this.affectedEmployee.employeeSearch.getValues('EMP_ID'), 
																this.affectedEmployee.employeeSearch.getValues('FIRST_NAME') + ' ' + this.affectedEmployee.employeeSearch.getValues('LAST_NAME'), 
																this.affectedEmployee.employeeSearch.getValues('COMPANY_ID'), 
																5, false);
			this.affectedEmployee.builded = true;
		}
		this.activeEmpSearch = 'affectedEmployee';
		
		//Display the employee history for the requestor
		this._initEmployeeHistoryPanel(this.affectedEmployee.employeeSearch.getValues('EMP_ID'), 
										this.affectedEmployee.employeeSearch.getValues('FIRST_NAME')+' '+this.affectedEmployee.employeeSearch.getValues('LAST_NAME'),
										this.affectedEmployee.employeeSearch.getValues('COMPANY_ID'));
					
		if (Object.isEmpty(this.affectedEmployee.defDynCompInfo) || Object.isEmpty(this.affectedEmployee.dynCompInfo)){
			if (this.affectedEmployee.employeeSearch.getValues('EMP_ID') != "") {
				this._backend_getTopRightContent();
			}else{
				this._cleanTopRightContainer();
			}
		}else{
			this._showTopRightContainerValue();
		}
	},
	/**
	 * Function in charge of managing the click on the requestor link.
	 * It has to show the requestor search and the HTML forms associated to the selected employee.
	 * If the requestor is a newly entered one, the backend will be called in order to retrieve the HTML Forms associated (_backend_getTopRightContent),
	 * if the employee is empty or not found with the search, the top right container should be empty (_cleanTopRightContainer) and if the employee did not changed, the associated HTML forms should be displayed (_showTopRightContainerValue).
	 * @param {Event} memo The event parameters.
	 * @see scm_createTicket#_backend_getTopRightContent
	 * @see scm_createTicket#_cleanTopRightContainer 
	 * @see scm_createTicket#_showTopRightContainerValue
	 * @since 1.0
	 * <br/>Modified in version 1.1:
	 * <ul>
	 * <li>Create the user actions via the factory</li>
	 * </ul>
	 */
	_showRequestorSearchEvent:function(memo){
		//since 1.1 Save the security questions results
		this._saveSecurityQuestions(this.affectedEmployee);
		
		this.affectedEmployee.values = this.affectedEmployee.employeeSearch.getValues();
		if (this.requestor.builded == false) {
			this.screenObject.empSearchSpotReq.insert(this.requestor.extension);
			this.requestor.employeeSearch.setFormInitial(this.requestor.extension, false, hrwEngine.custCompMandatory);
			//since 1.1 Create the user actions via the factory
			this.requestor.userAction = ScmUserAction.factory(ScmUserAction.DISPLAY_AS_APPLI, this, 'SCM_FindEmpl_createTicketsRequestor_EMP_ID', $A(['scm_employeeHistory', 'scm_ticketApp', 'scm_createTicket']));
            this.requestor.userAction.addActionOnField(	this.requestor.employeeSearch.getValues('EMP_ID'), 
														this.requestor.employeeSearch.getValues('FIRST_NAME') + ' ' + this.affectedEmployee.employeeSearch.getValues('LAST_NAME'), 
														this.requestor.employeeSearch.getValues('COMPANY_ID'), 
														5, false);
			this.requestor.builded = true;
		}
		this.activeEmpSearch = 'requestor';

		//Display the employee history for the requestor
		this._initEmployeeHistoryPanel(this.requestor.employeeSearch.getValues('EMP_ID'), 
										this.requestor.employeeSearch.getValues('FIRST_NAME')+' '+this.requestor.employeeSearch.getValues('LAST_NAME'),
										this.requestor.employeeSearch.getValues('COMPANY_ID'));
		if (Object.isEmpty(this.requestor.defDynCompInfo) || Object.isEmpty(this.requestor.dynCompInfo)){
			if (this.requestor.employeeSearch.getValues('EMP_ID') != "") {
				this._backend_getTopRightContent();
			}else{
				this._cleanTopRightContainer();
			}
		}else{
			this._showTopRightContainerValue();
		}
	},
	
	/** 
	 * Function in charge of managing the change of the service area.<br>
	 * Each time a service area is chosen, the backend needs to be called in order to retrieve the service groups associated to the service are.
	 * @see scm_createTicket#_backend_getServiceGroupsWithArea
	 * @param {Event} memo
	 */
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
	
	/**
	 * Function in charge of getting the service when a service group is selected in the dropdown.
	 * It will first test if the service group has changed (if not, no need to make the call to the backend).
	 * If the call should be done, it will call the backend in order to retrieve the services associated to the service group selected.
	 * @param {Event} memo The event parameters.
	 * @see scm_createTicket#_backend_getServices
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
			this._backend_getServices(this.selectedServiceGroup, this.companySkillId);
		}
	},
	/**
	 * Function in charge of getting the service attributes when a service is selected in the dropdown.
	 * It will first test if the service group has changed (if not, no need to make the call to the backend).
	 * If the call should be done, it will call the backend in order to retrieve the attributes associated to the service selected.
	 * @param {Event} memo The event parameters.
	 * @see scm_createTicket#_backend_getPossibleServiceAttributes
	 * @since 1.0
	 */
	_getPossibleServiceAttributesEvent:function(memo){
		if(memo.memo.isEmpty == true) return;
		var makeCall = true;
		if (this.selectedService)
			(this.selectedService == memo.memo.idAdded)?makeCall=false:makeCall=true;

		if (makeCall === true) {
			this.selectedService = memo.memo.idAdded;
			this._backend_getPossibleServiceAttributes(this.affectedCompanyId);
		}
	},
	/**
	 * Function in charge of displaying the company details when the link is clicked.
	 * It will create a popup to display the HTML form coming from the backend.
	 * @param {Event} memo The event parameters.
	 * @since 1.0 but not available in the front end yet.
	 */
	_showCompanyDetailsEvent:function(memo){
		var html = "Here are the company details...";
		
		var companyDetailsPopUp = new infoPopUp({
                    closeButton :   $H( {
                        'callBack': function() {
                            companyDetailsPopUp.close();
                            delete companyDetailsPopUp;
                        }
                    }),
                    htmlContent : html,
                    indicatorIcon : 'information',                    
                    width: 600
             });
		companyDetailsPopUp.create();
	},
	/**
	 * Function in charge canceling a ticket creation.
	 * It will go back the the "my pool" application.
	 * @param {Event} memo The event parameters.
	 * @since 1.0.
	 */
	_cancelTicketCreationEvent:function(){
		 global.open($H({app: {appId:'MY_PL', tabId:'PL_MY', view:'scm_myPool'}}));
	},
	/**
	 * Function in charge cleaning the employee history and the employee associated HTML forms when the employee is changed and no employee is selected.
	 * @param {Event} args The event parameters.
	 * @see scm_createTicket#_cleanEmployeeHistoryPanel
	 * @see scm_createTicket#_cleanTopRightContainer
	 * @since 1.0
	 */
	_ticketNoEmployeeSelectedEvent:function(args){
		var params = getArgs(args);
		if (!Object.isEmpty(params.match('createTicketsRequestor'))) {
			this.requestorId = '';
			if(this.requestor.userAction) this.requestor.userAction.hideActionOnField();
		}else if (!Object.isEmpty(params.match('createTicketsAffEmployee'))){
			this.affectedId = '';
			if(this.affectedEmployee.userAction) this.affectedEmployee.userAction.hideActionOnField();
		} else return;
		//Close the employee history tab
		this._cleanEmployeeHistoryPanel();
		this._cleanTopRightContainer();	
	},
	/**
	 * Function in charge of displaying the employee history and the accurate HTML forms on the top right of the ticket screen after an employee has been selected.
	 * @param {Event} args The event parameters.
	 * @see scm_createTicket#_updateTopRightContainer
	 * @see scm_createTicket#_initEmployeeHistoryPanel
	 * <br/>Modified in 2.2:
	 * <ul>
	 * <li>Update the list of skills only when the affected employee change, not the requestor</li>
	 * </ul>
	 * <br/>Modified in 2.0:<ul><li>Reload the attributes as it's now linked to the employee Id (call to <a href=scm_createTicket.html#_backend_getPossibleCompanyAttributes>_backend_getPossibleCompanyAttributes</a>)</li></ul>
	 */
	_ticketEmployeeSelectedEvent:function(args){
		var params = getArgs(args);
		if (!Object.isEmpty(params.ident.match('createTicketsRequestor'))) {
			this.requestorId = params.values.get('EMP_ID');
			if(this.requestor.userAction) {
				this.requestor.userAction.showActionOnField();
				this.requestor.userAction.updateAction(	params.values.get('EMP_ID'),
														params.values.get('FIRST_NAME') + ' ' + params.values.get('LAST_NAME'),
														//since 2.2 Get the company from the last result 
														this.requestorCompanyId);
			}
			//Open the employee history for new user
			//since 2.2 Get the company from the last result 
			this._initEmployeeHistoryPanel(params.values.get('EMP_ID'), params.values.get('FIRST_NAME') + ' ' + params.values.get('LAST_NAME'), this.requestorCompanyId);
		}else if (!Object.isEmpty(params.ident.match('createTicketsAffEmployee'))){
			this.affectedId = params.values.get('EMP_ID');
			if(this.affectedEmployee.userAction) {
				this.affectedEmployee.userAction.showActionOnField();
				this.affectedEmployee.userAction.updateAction(	params.values.get('EMP_ID'),
																params.values.get('FIRST_NAME') + ' ' + params.values.get('LAST_NAME'),
																//since 2.2 Get the company from the last result 
																this.affectedCompanyId);
			}
			//since 2.0 Reload the attributes as the employee ID is part of the parameters of the backend call.
			//since 2.2 Only for the affected employee (not the requestor)
			this.addServiceAttributes = true;
			this._backend_getPossibleCompanyAttributes();
			
			//Open the employee history for new user
			//since 2.2 Get the company from the last result 
			this._initEmployeeHistoryPanel(params.values.get('EMP_ID'), params.values.get('FIRST_NAME') + ' ' + params.values.get('LAST_NAME'), this.affectedCompanyId);
		} else return;
		
		this._updateTopRightContainer();
		this.screenObject.enableCreateButton();
	},
	/**
	 * Fucntion in charge of disabling the save button when a change occured in the employee search and an incorrect employee entry is found.
	 * @param {Event} args The event parameters.
	 * @since 1.0
	 * <br/>Modified in 2.2
	 * <ul>
	 * <li>Do the action only if the event id is for this screen</li>
	 * </ul>
	 */
	_employeeSearchChangedEvent:function(args){
		if(getArgs(args) === "createTicketsRequestor" || getArgs(args) === "createTicketsAffEmployee")
			this.screenObject.disableCreateButton();
	},
	/**
	 * Function in charge of reloading the company settings when a new company is selected in the employee search.
	 * @param {Event} args The event parameters.
	 * @see scm_createTicket#_backend_loadCompanySettings
	 * @since 1.0
	 */
	_companySelectedEvent:function(args){
		var params = getArgs(args);
		
		if (!Object.isEmpty(params.idAutocompleter.match('createTicketsRequestor'))){
			this.requestorCompanyId = params.idAdded;
			this.requestor.defDynCompInfo = null;
			this.requestor.dynCompInfo = null;
			
		}else if (!Object.isEmpty(params.idAutocompleter.match('createTicketsAffEmployee')) && this.affectedCompanyId != params.idAdded){
			// change the affected employee			
			this.affectedCompanyId = params.idAdded;
			this.affectedEmployee.defDynCompInfo = null;
			this.affectedEmployee.dynCompInfo = null;
			
			this._backend_loadCompanySettings(false);
		}
	},
	/**
	 * Function in charge of switching the display of the top right container depending of the selected employee after saving the entered values for the security questions.
	 * @see scm_createTicket#_applySecurityQuestions
	 * @since 1.0
	 */
	_dynCompanyInfoEvent: function(args) {
		var objectActive;
		if (this.activeEmpSearch == 'affectedEmployee' )
			objectActive = this.affectedEmployee;
		else
			objectActive = this.requestor;
		
		//since 1.1 Save the security questions results
		this._saveSecurityQuestions(objectActive);
		
		if(objectActive.dynCompInfo) {
			this.screenObject.dynCompInfoSpot.update();
			this.screenObject.dynCompInfoSpot.insert(objectActive.dynCompInfo.get(getArgs(args)));
			//since 1.1 Place the saved content for the security questions
			this._applySecurityQuestions();
			this.affectedEmployee.defDynCompInfo = getArgs(args);
			if(this.enableRequestor === true)
				this.requestor.defDynCompInfo = getArgs(args);
		} else 
			new PeriodicalExecuter(function(pe) {
  				if (!objectActive.dynCompInfo) return;
				pe.stop();
				this.screenObject.dynCompInfoSpot.update();
				this.screenObject.dynCompInfoSpot.insert(objectActive.dynCompInfo.get(getArgs(args)));
				//since 1.1 Place the saved content for the security questions
				this._applySecurityQuestions();
				this.affectedEmployee.defDynCompInfo = getArgs(args);
				if(this.enableRequestor === true)
					this.requestor.defDynCompInfo = getArgs(args);
			}.bind(this), 1);
	},
	/**
	 * Function in charge of managing the click on the save button to save the ticket.<br>
	 * It will first remove the previous elements in error (if any) before checking if all mandatory fields for creation have been entered.<br>
	 * If the ticket is valid for creation, the security questions values will be saved and an XML verison of the ticket will be created in order to send it to the backend.<br>
	 * If the agent sneds an email for the creation to the requestor, the call will not save the ticket directly but will first display the email preview popup.
	 * If not all the mandatory fields are filed in and the ticket cannot be created, a popup will be displayed in order to notify the agent of the wrong entries.
	 * @see scm_createTicket#_unsetElementsOnError
	 * @see scm_createTicket#_checkCreationValidity
	 * @see scm_createTicket#_saveSecurityQuestions
	 * @see scm_createTicket#_backend_showMailPopupBeforeCreation
	 * @see scm_createTicket#_backend_createTicket
	 * @since 1.0
	 * <br/>Modifications for 2.1:
	 * <ul>
	 * <li>Use the standard encoding before sending to HRW</li>
	 * </ul>
	 */
	_createTicketEvent: function(){
		var mailFrom = "";
		var mailTo = "";
		if (this.errorElements && !Object.isEmpty(this.errorElements)) {
			this._unsetElementsOnError();
		}
		this.errorElements = $A();

		var validity = this._checkCreationValidity();
		if (validity.valid == true) {
			//since 1.1 Save the security questions results
			this._saveSecurityQuestions();
			
			// call the ticket creation
			var groupingSkillId = '';
			if(this.useGroupingSkills){
				groupingSkillId = this.companyGroupingAC.getValue().idAdded;
			}
			
			var editor_data = CKEDITOR.instances.scm_ticketCreateScreenEditor.getData();
		
			var description = editor_data.gsub('<br>', '<br/>');
			description = description.gsub('<p>', '');
			description = description.gsub('</p>', '');
			description = description.gsub('&nbsp;', '');
			var ticketType;
			this.screenObject.ticketMarkSolvedSpot.value.down('[id="scm_ticket_creation_internal_check"]').checked == true?ticketType = 1:ticketType=0 ;
			var serviceAreaId = "-2147483648";
			if(this.useAreas=='true'){
				serviceAreaId = this.ticketValues.ticketSAId;
			}
			if (this.useGroupingSkills) {
				var jsonValues = {
					//since 2.1 Use the standard encoding
					description			: HrwRequest.encode(description),
					solution			: "",
					employeeId			: this.affectedId,
					employeeFirstName	: this.affectedEmployee.employeeSearch.getValues('FIRST_NAME'),
					employeeLastName	: this.affectedEmployee.employeeSearch.getValues('LAST_NAME'),
					companySkillId		: this.companySkillId,
					//since 2.1 Use the standard encoding
					shortDescription	: HrwRequest.encode(this.screenObject.ticketSubjectSpot.value.down().value),
					requestorId			: (this.enableRequestor)?this.requestorId:'',
					requestorFirstName	: (this.enableRequestor)?this.requestor.employeeSearch.getValues('FIRST_NAME'):'',
					requestorLastName	: (this.enableRequestor)?this.requestor.employeeSearch.getValues('LAST_NAME'):'',
					customField1		: "",
					customField2		: "",
					type				: ticketType,
					serviceSkillId		: this.selectedService,
					serviceGroupId		: this.selectedServiceGroup,
					groupingSkillId		: this.companyGroupingAC.getValue().idAdded,
					serviceAreaId		: serviceAreaId,
					securityQuestionsState: this.securityQuestionsResult
				};
			}
			else {
				var jsonValues = {
					//since 2.1 Use the standard encoding
					description			: HrwRequest.encode(description),
					solution			: "",
					employeeId			: this.affectedId,
					employeeFirstName	: this.affectedEmployee.employeeSearch.getValues('FIRST_NAME'),
					employeeLastName	: this.affectedEmployee.employeeSearch.getValues('LAST_NAME'),
					companySkillId		: this.companySkillId,
					//since 2.1 Use the standard encoding
					shortDescription	: HrwRequest.encode(this.screenObject.ticketSubjectSpot.value.down().value),
					requestorId			: (this.enableRequestor)?this.requestorId:'',
					requestorFirstName	: (this.enableRequestor)?this.requestor.employeeSearch.getValues('FIRST_NAME'):'',
					requestorLastName	: (this.enableRequestor)?this.requestor.employeeSearch.getValues('LAST_NAME'):'',
					customField1		: "",
					customField2		: "",
					type				: ticketType,
					serviceSkillId		: this.selectedService,
					serviceGroupId		: this.selectedServiceGroup,
					groupingSkillId		: HrwEngine.NO_VALUE,
					serviceAreaId		: serviceAreaId,				
					securityQuestionsState: this.securityQuestionsResult
				};
			}
			
			//Add the due date if it is defined
			if(this.dynDueDate)
				jsonValues.dueDateDyn = this.dynDueDate;
			
			this.hrwTicketXml = new hrwTicketObject(jsonValues).toXml();
			this.hrwTicketSkillsXml = new hrw_ticketSkillsObject(this.skillsWithValues).toXml();
			if(this.screenObject.ticketMailCheckBox.value.checked == true){
				this._backend_showMailPopupBeforeCreation();
			}else{
				this._backend_createTicket('', '');	
			}
		} else {
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
	 * Function in charge of managing the closing of the mail popup and create the ticket by calling the backend.
	 * @see scm_createTicket#_backend_createTicket
	 * @param {Event} args The event parameters. 
	 * @since 1.0
	 */
	_mailPopupClosedEvent:function(args){
		var params = getArgs(args);
		this._backend_createTicket(params.mailTo, params.mailFrom);
	},
	/**
	 * Function in charge of showing the popup allowing the agent to change the due date of the ticket.
	 * @param {Event} event The event parameters. 
	 * @since 1.0
	 */
	_showDueDatePopupEvent:function(event){
		new ticketActionPopupScreens().showDueDatePopup(this.dynDueDate);
	},
	/**
	 * Function in charge of assigning the new due date to the ticket. The new due date is found in the event parameters.
	 * @param {Event} args The event parameters.
	 * @since 1.0
	 */
	_assignNewDateEvent:function(args){
		params = getArgs(args);
		this.screenObject.ticketDdateSpot.value.update(params.dateDisplay);
		this.dynDueDate = params.dateHRW;
	},
	/**
	 * Function in charge of reseting the due date top it's original value.
	 * @param {Event} args The event parameters.
	 * @since 1.0
	 */
	_resetdueDateToStaticEvent: function(args) {
		this.dynDueDate = null;
		this.screenObject.ticketDdateSpot.value.update(global.getLabel('SCM_no_subject').escapeHTML());
	}
});


/**
 * @class
 * @description Class in charge of managing the display of a ticket and all possible actions when a ticket is in display mode.
 * @author jonathanj & nicolasl
 * @version 2.1
 * <br/>Change for version 2.1:
 * <ul>
 * <li>Use the common way to encode/decode fields for the communication to the backend</li>
 * </ul>
 * <br/>Change for version 2.0:
 * <ul>
 * <li>Retrieve the remaining time to close the ticket</li>
 * <li>Add the managment of the solved flag</li>
 * <li>Use a constant for empty HRW values</li>
 * </ul>
 */
var scm_viewTicket = Class.create(Application, /** @lends scm_viewTicket.prototype */{
	/**
	 * The title of the application.
	 * @type String
	 * @since 1.0
	 */
	mainTitle : '',
	/**
	 * The ticket screen object.
	 * @type scm_ticketScreen_standard_new
	 * @since 1.0
	 */
	screenObject:null,
	/**
	 * The registered event of the application.
	 * @type Hash
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
	 * The values of the employees (requestor and affected employee).<br>
	 * These values are stored with the following structure:
	 * <ul>
	 * 	<li>ticketRequestor
	 * 		<ul>
	 * 			<li>builded: Flag to know if the employee search has already been builded</li>
	 * 			<li>employeeSearch: The employee search object associated to the requestor</li>
	 * 			<li>extension: The employee search extention</li>
	 * 			<li>values: A Hash containing:<ul>
	 * 				<li>COMPANY_ID</li>
	 * 				<li>COMPANY</li>
	 * 				<li>EMP_ID</li>
	 * 				<li>FIRST_NAME</li>
	 * 				<li>LAST_NAME</li>
	 * 				<li>EMAIL</li></ul>
	 * 			</li>
	 * 			<li>userAction: The user action object</li>
	 * 			<li>id: The employee Id</li>
	 * 			<li>compId: The company id of the employee</li>
	 * 			<li>dynCompInfo: The dynamic company information</li>
	 * 			<li>defDynCompInfo: The default dynamic company information</li>
	 * 		</ul>
	 * 	</li>
	 * 	<li>ticketAffEmployee
	 * 		<ul>
	 * 			<li>builded: Flag to know if the employee search has already been builded</li>
	 * 			<li>employeeSearch: The employee search object associated to the affected employee</li>
	 * 			<li>extension: The employee search extention</li>
	 * 			<li>values: A Hash containing:<ul>
	 * 				<li>COMPANY_ID</li>
	 * 				<li>COMPANY</li>
	 * 				<li>EMP_ID</li>
	 * 				<li>FIRST_NAME</li>
	 * 				<li>LAST_NAME</li>
	 * 				<li>EMAIL</li></ul>
	 * 			</li>
	 * 			<li>userAction: The user action object</li>
	 * 			<li>id: The employee Id</li>
	 * 			<li>compId: The company id of the employee</li>
	 * 			<li>dynCompInfo: The dynamic company information</li>
	 * 			<li>defDynCompInfo: The default dynamic company information</li>
	 * 		</ul>
	 *	</li>
	 * 	<li>ticketCompanyDetails: The company details</li>
	 * </ul>
	 * @type JSon
	 * @since 1.0
	 */
	employeeValues:null,
	/**
	 * The list of service groups.
	 * @type Hash
	 * @since 1.0
	 */
	listOfSG: null,
	/**
	 * The list of service.
	 * @type Hash
	 * @since 1.0
	 */
	listOfServices: null,
	/**
	 * Flag meaning if the requestor is enabled for the company.
	 * @type boolean
	 * @since 1.0
	 */
	enableRequestor: null,
	/**
	 * The active employee search. It can be: affectedEmployee or requestor.
	 * @type String
	 * @since 1.0
	 */
	activeEmpSearch:null,
	/**
	 * An scm_ticketActions object that will manage the display of the previous actions.
	 * @type scm_ticketActions
	 * @since 1.0
	 */
	actionsList:null,
	/**
	 * The list of pending reasons.
	 * @type Array
	 * @since 1.0
	 */
	pendingReasons:null,
	/**
	 * Action performed on the ticket from the left menu.
	 * @type int
	 * @since 1.0
	 */
	actionPerformed:null,
	/**
	 * Flag meaning if the employee history is launched.
	 * @type boolean
	 * @since 1.0
	 */	
	employeeHistLaunched:null,
	/**
	 * The company grouping if used by the company.
	 * @type Array
	 * @since 1.0
	 */
	companyGroupingSkills:null,
	/**
	 * Flag meaning if the ticket has a solution.
	 * @type boolean
	 * @since 1.0
	 */
	ticketHasSolution:null,
	/**
	 * Lsit of action types
	 * @since 1.0
	 */
	ticketAction_actionsTypes:null,
	/**
	 * List of action types linked to an information request
	 * @type Array
	 * @since 1.0
	 */
	ticketAction_ewsInfo : null,
	/**
	 * List of action types linked to a notification request
	 * @type Array
	 * @since 1.0
	 */
	ticketAction_ewsNotif: null,
	/**
	 * List of action types linked to a document request
	 * @type Array
	 * @since 1.0
	 */
	ticketAction_ewsDocument: null,
	/**
	 * List of action types linked to an approval request
	 * @type Array
	 * @since 1.0
	 */
	ticketAction_ewsApproval: null,
	/**
	 * Flag meaning that the application screen shouldn't be cleared.
	 * @type boolean
	 * @since 1.0
	 */
	doNotReset:null,

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
	 * Constructor for the object.<br>
	 * This function initialize the available events of the object.
	 * @param {JSon} args The arguments of the class.
	 * @since 1.0
	 */
	initialize: function($super, args){
		$super(args);
		
		this.eventListeners = {
			viewPreviousAction	  		: this._viewPreviousActionEvent.bindAsEventListener(this),
			technicalActionsChanged 	: this._filterActionsEvent.bindAsEventListener(this),
			performActionOnTicket		: this._defineActionAndParamsEvent.bindAsEventListener(this),
			pendingPopupClosed			: this._getPendingInfoFromPopupEvent.bindAsEventListener(this),
			waitingPopupClosed			: this._getWaitingInfoFromPopupEvent.bindAsEventListener(this),
			reOpenPopupClosed			: this._reOpenPopupClosedEvent.bindAsEventListener(this),			
			dynCompanyInfoClicked		: this._dynCompanyInfoEvent.bindAsEventListener(this),
			affectedEmployeeLinkClicked	: this._affectedEmployeeLinkClicked.bindAsEventListener(this),
			requestorLinkClicked		: this._requestorLinkClicked.bindAsEventListener(this),
			setClosingFlag				: this._setClosingFlagEvent.bindAsEventListener(this)		
		};			
	},
	/**
	 * Function called when the appilcation is displayed on the screen.<br>
	 * This function sets the observer of the class and initialize the class attributes.<br>
	 * Once the attribute initialization is done, it calls the screenInitialize function to initialize the display.
	 * @param {JSon} args The arguments of the application.
	 * @see scm_viewTicket#screenInitialize
	 * @since 1.0
	 */
	run: function ($super, args){
        $super(args);
		
		document.observe('EWS:SCM_ticketApp_askClosing', this.eventListeners.setClosingFlag);
		
		document.observe('EWS:scm_affectedEmployeeLinkClicked', this.eventListeners.affectedEmployeeLinkClicked);
		document.observe('EWS:scm_requestorLinkClicked', this.eventListeners.requestorLinkClicked);
		
		document.observe('EWS:scm_viewPreviousAction', this.eventListeners.viewPreviousAction);
		document.observe('EWS:scm_ticketActionCheckBoxChange', this.eventListeners.technicalActionsChanged);
		
		document.observe('EWS:scm_tiact_take_processing', this.eventListeners.performActionOnTicket);
		document.observe('EWS:scm_tiact_set_pending', this.eventListeners.performActionOnTicket);
		document.observe('EWS:scm_tiact_set_waiting', this.eventListeners.performActionOnTicket);
		document.observe('EWS:scm_tiact_close_ticket', this.eventListeners.performActionOnTicket);
		
		document.observe('EWS:scm_dynCompanyInfoClicked', this.eventListeners.dynCompanyInfoClicked);
		
		
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
			ticketSG			: null,
			ticketSGId			: null,
			ticketRtime			: null,
			ticketService		: null,
			ticketServiceId		: null,
			ticketPrevActions	: null,
			ticketPrevTechAct	: null,
			ticketAttributes	: null,
			ticketCurrAgent		: null,
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
		
		this.ticketAction_actionsTypes=$A();
		
		
		this.firstRun==true?this.firstRun=false:this.resetData();

		this.mainTitle = global.getLabel('Ticket_view') + ' - <i>' + this.ticketValues.ticketId +'</i>';
		this.updateTitle(this.mainTitle);
		this.screenInitialize();

    },
	/**
	 * Function called when the user leaves the application.<br>
	 * This function calls the _cleanEmployeeHistoryPanel function in order to close the employee history and, if the flag doNotReset is not true,
	 * stops the observers and calls the resetData function in order to clean the display.
	 * @since 1.0
	 */
	close: function ($super){
        $super();
		
		this._cleanEmployeeHistoryPanel();
		if(this.doNotReset == true) return;
		
		this.resetData();
		
		document.stopObserving('EWS:scm_affectedEmployeeLinkClicked', this.eventListeners.affectedEmployeeLinkClicked);
		document.stopObserving('EWS:scm_requestorLinkClicked', this.eventListeners.requestorLinkClicked);
		
		document.stopObserving('EWS:scm_viewPreviousAction', this.eventListeners.viewPreviousAction);
		document.stopObserving('EWS:scm_ticketActionCheckBoxChange', this.eventListeners.technicalActionsChanged);
		
		document.stopObserving('EWS:scm_tiact_take_processing', this.eventListeners.performActionOnTicket);
		document.stopObserving('EWS:scm_tiact_set_pending', this.eventListeners.performActionOnTicket);
		document.stopObserving('EWS:scm_tiact_set_waiting', this.eventListeners.performActionOnTicket);
		document.stopObserving('EWS:scm_tiact_close_ticket', this.eventListeners.performActionOnTicket);
		
		document.stopObserving('EWS:scm_dynCompanyInfoClicked', this.eventListeners.dynCompanyInfoClicked);
    },	
	/**
	 * Function in charge of deciding if the application can be reset or not.<br>
	 * The application doesn't have to be reseted if the user is coming from the ticket screen and going to the documents of the ticket.
	 * @param {Event} args The event object.
	 * @since 1.0
	 */
	_setClosingFlagEvent:function(args){
		if(args.memo.args.get('forEdition') == true) return;
		this.doNotReset = true;
		document.stopObserving('EWS:SCM_ticketApp_askClosing');
		document.fire('EWS:SCM_ticketApp_allowClosing');
	},
/*----------------------------------------------------------------------------------------------
 * 									INITIALIZATION FUNCTIONS 
 *--------------------------------------------------------------------------------------------*/    	
	/**
	 * Function in charge of reseting the application screen.<br>
	 * This function calls the resetData on the screen object if it exists and then destroy the different editors used by the application.
	 * @see scm_ticketScreen_standard_new#resetData
	 * @since 1.0
	 */
	resetData:function(){
		if(!Object.isEmpty(this.screenObject)) this.screenObject.resetData();
		if(CKEDITOR.instances.scm_ticketViewScreenEditor){
			CKEDITOR.remove(CKEDITOR.instances.scm_ticketViewScreenEditor);
		}
		if(CKEDITOR.instances.scm_ticketDescrScreenEditor){
			CKEDITOR.remove(CKEDITOR.instances.scm_ticketDescrScreenEditor);
		}
		if(CKEDITOR.instances.scm_ticketSolScreenEditor){
			CKEDITOR.remove(CKEDITOR.instances.scm_ticketSolScreenEditor);
		}
	},
	/**
	 * First function called by the application, this function calls the _backend_getTicketValues function loading the values from the backend.
	 * @see scm_viewTicket#_backend_getTicketValues
	 * @since 1.0
	 */
	screenInitialize:function(){
		this._backend_getTicketValues();
	},
	/**
	 * Function in charge of building the display of the application screen.<br>
	 * This function instanciate the <a href=scm_ticketScreen_standard_new>screen object</a> and calls:
	 * <ul>
	 * 	<li>_initTopPanel</li>
	 * 	<li>_initMiddlePanel</li>
	 * 	<li>addEventOnActionCheckbox on the ticket screen object</li>
	 * 	<li>try to initialize the employee history panel (_initEmployeeHistoryPanel)</li>
	 * </ul>
	 * @see scm_viewTicket#_initTopPanel
	 * @see scm_viewTicket#_initMiddlePanel
	 * @see scm_ticketScreen_standard_new#addEventOnActionCheckbox
	 * @see scm_viewTicket#_initEmployeeHistoryPanel
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
			
		}
		else if (this.activeEmpSearch === 'requestor') {
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
	 * Function in charge of initializing the top panel values.<br>
	 * It creates the ScmEmployeeSearch object for the requestor (if used) and for the affected employee,
	 * @since 1.0
	 * <br/>Modified in version 1.1:
	 * <ul>
	 * <li>Create the user actions via the factory</li>
	 * </ul>
	 */
	_initTopPanel:function(){
		if(this.enableRequestor == "true"){
			this.employeeValues.ticketRequestor.employeeSearch = ScmEmployeeSearch.factory(this, 'viewTicketsRequestor', true);
			this.employeeValues.ticketRequestor.extension	   = this.employeeValues.ticketRequestor.employeeSearch.getFormDisabled();
			
			this.screenObject.empSearchSpotReq.update();
			this.screenObject.empSearchSpotReq.insert(this.employeeValues.ticketRequestor.extension);				
			this.employeeValues.ticketRequestor.employeeSearch.setFormInitial(this.employeeValues.ticketRequestor.extension, true, hrwEngine.custCompMandatory);
			//since 1.1 Create the user actions via the factory
			this.employeeValues.ticketRequestor.userAction 	   = ScmUserAction.factory(ScmUserAction.DISPLAY_AS_APPLI, this, 'SCM_FindEmpl_viewTicketsRequestor_EMP_ID', $A(['scm_employeeHistory', 'scm_ticketApp', 'scm_viewTicket']));
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
		
		this.employeeValues.ticketAffEmployee.employeeSearch = ScmEmployeeSearch.factory(this, 'viewTicketsAffEmployee', true);
		this.employeeValues.ticketAffEmployee.extension	   = this.employeeValues.ticketAffEmployee.employeeSearch.getFormDisabled();
		
		
		this.screenObject.empSearchSpotAff.update();
		this.screenObject.empSearchSpotAff.insert(this.employeeValues.ticketAffEmployee.extension);				
		this.employeeValues.ticketAffEmployee.employeeSearch.setFormInitial(this.employeeValues.ticketAffEmployee.extension, true, hrwEngine.custCompMandatory);
		//since 1.1 Create the user actions via the factory
		this.employeeValues.ticketAffEmployee.userAction = ScmUserAction.factory(ScmUserAction.DISPLAY_AS_APPLI, this, 'SCM_FindEmpl_viewTicketsAffEmployee_EMP_ID', $A(['scm_employeeHistory', 'scm_ticketApp', 'scm_viewTicket']));
        this.employeeValues.ticketAffEmployee.userAction.addActionOnField(	this.employeeValues.ticketAffEmployee.values.get('EMP_ID'), 
																			this.employeeValues.ticketAffEmployee.values.get('FIRST_NAME') + ' ' + this.employeeValues.ticketAffEmployee.values.get('LAST_NAME'), 
																			this.employeeValues.ticketAffEmployee.values.get('COMPANY_ID'),
																			5, false);
		this.employeeValues.ticketAffEmployee.builded		   = true;

		this.employeeValues.ticketAffEmployee.employeeSearch.setValues(this.employeeValues.ticketAffEmployee.values);
		this._backend_getAffEmployeeValues();
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
	 * @since 1.0
	 */
	_initMiddlePanel:function(){
		this.screenObject.updateMiddleWidgetTitle(global.getLabel('Ticket_details')+ ' (<b>'+this.ticketValues.ticketId+'</b>)');
		this._initMiddlePanelTop();
		this._initMiddlePanelLeft();
		this._initMiddlePanelRight();
		this.screenObject.setTitleMiddlePartRightForDisplay(global.getLabel('View_action'));
		this.screenObject.hideTicketButtonsForView();
		this._initEditor();
//		this._enlargeEditors();
	},
	/**
	 * @since 1.0
	 */
	_initEditor:function(){
		
		
		CKEDITOR.replace('scm_ticketViewScreenEditor',
			{
	        	toolbar :[],
				height: '260px',
				resize_enabled: false,
				removePlugins : 'elementspath',
				uiColor: '#dcd2ce',
				toolbarCanCollapse:false//,
				//toolbarStartupExpanded :false
	    	});
		CKEDITOR.replace('scm_ticketDescrScreenEditor',
			{
	        	toolbar :[],
				height: '260px',
				resize_enabled: false ,
				removePlugins : 'elementspath',
				uiColor: '#dcd2ce',
				toolbarCanCollapse:false//,
				//toolbarStartupExpanded :false  
	    	});
		CKEDITOR.replace('scm_ticketSolScreenEditor',
			{
	        	toolbar :[],
				height: '260px',
				resize_enabled: false ,
				removePlugins : 'elementspath',
				uiColor: '#dcd2ce',
				toolbarCanCollapse:false//,
				//toolbarStartupExpanded :false  
	    	});
		CKEDITOR.instances.scm_ticketDescrScreenEditor.setData(this.ticketValues.ticketDescription);
		CKEDITOR.instances.scm_ticketSolScreenEditor.setData(this.ticketValues.ticketSolution);		
		CKEDITOR.instances.scm_ticketViewScreenEditor.on('instanceReady', function(ev) {
			CKEDITOR.instances.scm_ticketViewScreenEditor.readOnly(true);
		}, this);
		CKEDITOR.instances.scm_ticketDescrScreenEditor.on('instanceReady', function(ev) {
			CKEDITOR.instances.scm_ticketDescrScreenEditor.readOnly(true);
		}, this);
		CKEDITOR.instances.scm_ticketSolScreenEditor.on('instanceReady', function(ev) {
			CKEDITOR.instances.scm_ticketSolScreenEditor.readOnly(true);
		}, this);
	},
	/**
	 * @since 1.0
	 */
	_enlargeEditors:function(){
		this.screenObject.enlargeEditor('scm_ticketViewScreenEditor', 260);
	},
	/**
	 * @since 1.0<br>
	 * Modified in version 2.0:<ul>
	 * 	<li>Add the computation and the display of the remaining time</li>
	 *  <li>Add the managment of the solved flag</li>
	 *  <li>Update the title depending of the solved flag</li>
	 * </ul>
	 * <br/>Modified in 1.2:
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
		//since 1.2 Resolve encodage problem
		var subject = this.ticketValues.ticketSubject.stripScripts().stripTags().gsub(/\<[^<>]*\/\>/, '').gsub('\"', '&quot;').gsub('\'', '&apos;');
		var addTitle = false;
		if (this.ticketValues.ticketSubject.length > 50){
			addTitle = true;
			subject = this.ticketValues.ticketSubject.substr(0,50) + '...';
		}
		this.screenObject.ticketSubjectSpot.value.update(subject);
		if (addTitle == true){
			//since 1.2 Remove tags from the title
			this.screenObject.ticketSubjectSpot.value.writeAttribute('title', this.ticketValues.ticketSubject.stripScripts().stripTags().gsub(/\<[^<>]*\/\>/, ''));
		}
		// status
		this.screenObject.setTicketStatus(this.ticketValues.ticketStatus, this.ticketValues.ticketType);//ticketStatusSpot.value.update(this.ticketValues.ticketStatus);
		// Service Group
		if (!Object.isUndefined(this.ticketValues.ticketSG)) {
			var serviceGroup = {value:this.ticketValues.ticketSG , trimmedValue:this.ticketValues.ticketSG};
			if (serviceGroup.value.length > 45) {
				serviceGroup.trimmedValue = serviceGroup.trimmedValue.substr(0, 45) + '...';
			}
			this.screenObject.ticketSGSpot.value.update(serviceGroup.trimmedValue);
			this.screenObject.ticketSGSpot.value.writeAttribute('title', serviceGroup.value)
		}else{
			this.screenObject.ticketSGSpot.value.update();
		}
		if (!Object.isUndefined(this.ticketValues.ticketService)) {
			// Service
			var service = {	value: this.ticketValues.ticketService,	trimmedValue: this.ticketValues.ticketService};
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
		//since 2.0 Use a constant for the absence of value
		if (this.ticketValues.ticketRtime == HrwEngine.NO_VALUE) {
			this.screenObject.ticketRtimeSpot.value.remove();//addClassName('SCM_ticket_screen_hidden');
			this.screenObject.ticketRtimeSpot.label.remove();//addClassName('SCM_ticket_screen_hidden');
		} else {
			// Time remaining
			var hours = parseInt(new Number(this.ticketValues.ticketRtime) / 60);
			var minutes = new Number(this.ticketValues.ticketRtime) - (60 * hours);
			var days = parseInt(hours / 24);
			hours = hours - (days * 24);
			this.screenObject.ticketRtimeSpot.value.update(days + ' ' + global.getLabel('days') + ' ' + hours + ' ' + global.getLabel('hours') + ' ' + minutes + ' ' + global.getLabel('minutes'));
		}
		// solved status
		if(this.ticketValues.ticketSolved == 'true'){
			this.screenObject.ticketMarkSolvedSpot.value.down('[id="scm_ticket_creation_markSolved_check"]').writeAttribute('checked', 'X');
			this.updateTitle(this.mainTitle + ' - ' + global.getLabel('solvedTicket'));
		}
		this.screenObject.ticketMarkSolvedSpot.value.down('[id="scm_ticket_creation_markSolved_check"]').writeAttribute('disabled', 'X');
	},
	/**
	 * @since 1.0
	 */
	_initMiddlePanelLeft:function(){
		this._initMiddlePanelLeftPrevActions();
	},
	/**
	 * @since 1.0
	 * <br/>Reviewed in version 1.2:
	 * <ul>
	 * <li>Show all the actions if the "Hide technical actions" is not checked by default
	 * </ul>
	 */
	_initMiddlePanelLeftPrevActions:function(){
		//since 1.2 If the all actions flag is unticked, load all the actions
		this.actionsList = new scm_ticketActions(this.ticketValues.ticketDescription, this.ticketValues.ticketSolution , this.ticketValues.ticketPrevActions, true, !this.screenObject.ticketActionHideTech.value.checked, true);
		this.screenObject.ticketPrevActSpot.value.update();
		this.screenObject.ticketPrevActSpot.value.insert(this.actionsList.container);//generatedHTML);
		this.actionsList.addActionHeadersListeners(this.screenObject.ticketPrevActSpot.value);
		this.actionsList.addActionsOnTicketActions();
	},
	/**
	 * @since 1.0
	 */
	_initMiddlePanelRight:function(){
		this.screenObject.ticketDescrSpot.value.update();
		this.screenObject.ticketDescrSpot.value.insert('<textarea rows="14" cols="44" name="scm_ticketViewScreenEditor"></textarea>');
		
		this.screenObject.ticketDescrDescrSpot.value.update();
		this.screenObject.ticketDescrDescrSpot.value.insert('<textarea rows="14" cols="44" name="scm_ticketDescrScreenEditor"></textarea>');
		
		this.screenObject.ticketDescrSolSpot.value.update();
		this.screenObject.ticketDescrSolSpot.value.insert('<textarea rows="14" cols="44" name="scm_ticketSolScreenEditor"></textarea>');
		
		if (this.ticketHasSolution == false){
			this.screenObject.ticketDescrSolSpot.value.addClassName('SCM_ticket_screen_hidden');
			this.screenObject.solutionLink.addClassName('SCM_ticket_screen_hidden');
		}
		
		this.screenObject.ticketAttrSpot.value.update();
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
	 * @param {Object} action
	 * @param {Object} withButtons
	 * @return {String} textToDisplay
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
	 * 
	 * @param {Object} customActionId
	 * @return value
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
	 * 
	 * @param {Object} action
	 * @since 1.0
	 */
	_displayActionInEditor:function(action){
		var textToDisplay = '';
		if (action.TicketActionId == 'description') {
			this.screenObject.descriptionLinkClicked();
		}else if (action.TicketActionId == 'solution') {
			this.screenObject.solutionLinkClicked();
		}else {
			textToDisplay = this._buildTextForEditor(action);
			//insert the text in the CKEditor		
			CKEDITOR.instances.scm_ticketViewScreenEditor.setData(textToDisplay);
			this.screenObject.viewActionLinkClicked();
		}
	},
	/**
	 * 
	 * @param {Object} args
	 * @since 1.0
	 */
	_performActionOnTicketEvent:function(args){
		var callParameters = $H({
			scAgentId: hrwEngine.scAgentId
		});
		switch(this.actionPerformed){
			case 0:	// take in processing
						callParameters.set('ticketId', this.ticketValues.ticketId);
						break;
			case 1:	// set to pending
						callParameters.set('ticketId', this.ticketValues.ticketId);
						callParameters.set('description', args.description);
						callParameters.set('pendingReasonId', args.pendingReasonId);
						break;
			case 2:	// set to waiting
						callParameters.set('ticketId', this.ticketValues.ticketId);
						callParameters.set('description', args.description);
						break;
			case 8: // reopen
						callParameters.set('ticketId', this.ticketValues.ticketId);
						callParameters.set('description', args.description);
						break;
			default: alert("Something wrong happened");
		};
		this._backend_performActionOnTicket(args.serviceToCall, callParameters);
	},

		
/*----------------------------------------------------------------------------------------------
 * 								BACKEND CALLS FUNCTIONS 
 *--------------------------------------------------------------------------------------------*/    	
	/**
	 * @since 1.0
	 */
	_backend_getTicketValues:function(){
		hrwEngine.callBackend(this, 'Ticket.GetTicketByIdForDisplay', $H({
	        scAgentId : hrwEngine.scAgentId,
	        ticketId  : this.ticketValues.ticketId
	    }), 'getTicketValuesHandler');
	},
	/**
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
	 * 
	 * @param {Object} currentEmployee
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
	 * 
	 * @param {Object} service
	 * @param {Object} parameters
	 * @since 1.0
	 */
	_backend_performActionOnTicket:function(service, parameters){
		hrwEngine.callBackend(this, 'Ticket.'+service , parameters, 'actionPerformedHandler');
	},
	
	/**
	 * @since 1.0
	 * <br/>Modified for 1.2
	 * <ul>
	 * <li>Update company vs client skill</li>
	 * </ul>
	 */
	_backend_loadPendingReasons:function(){
		//since 1.2 Update company vs client skillId
		hrwEngine.callBackend(this, 'Admin.CollectPendingReasons', $H({
			scAgentId		: hrwEngine.scAgentId,
			companySkillId	: this.companySkillId
		}), 'getPendingReasonsHandler');
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
 	 * Function in charge of managing the answer to the _backend_getTicketValues call.<br>
 	 * This function assign all the company settings and ticket values retrieved from the JSon answer.
 	 * Once these values are retrieved, it calls the _backend_loadPendingReasons and the _initPanels functions in order to build the screen.
 	 * @param {JSon} json The answer of the backend call.
 	 * @see scm_viewTicket#_backend_getTicketValues
 	 * @see scm_viewTicket#_backend_loadPendingReasons
 	 * @see scm_viewTicket#_initPanels
 	 * @since 1.0
 	 * <br/>Modifications for 2.1:
	 * <ul>
	 * <li>Use the standard encoding before sending to HRW</li>
	 * </ul>
 	 * <br/>Modified in version 2.0:
 	 * <ul><li>Retrieve the remaining time to close the ticket</li>
 	 * <li>Retrieve the solved flag</li>
 	 * </ul>
 	 */
	getTicketValuesHandler:function(json){
		if(json.EWS.HrwResponse.HrwResult.HrwTicketForDisplay.CompanySettings.DefaultGroupingSkillId != "-2147483648"){
			this.companyGroupingSkills = objectToArray(json.EWS.HrwResponse.HrwResult.HrwTicketForDisplay.CompanySettings.GroupingSkills.KeyValue);	
//			this.companyGroupingSkillAssigned = json.EWS.HrwResponse.HrwResult.HrwTicketForDisplay.CompanySettings.DefaultGroupingSkillId;
			this.companyGroupingSkillAssigned = json.EWS.HrwResponse.HrwResult.HrwTicketForDisplay.HrwTicket.GroupingSkillId;
		}else{
			this.companyGroupingSkillAssigned = "-1";
		}
		var ewsnotif    = false;
		var ewsinfo     = false;
		var ewsdocument = false;
		var ewsapproval = false;
		
		//since 1.2 Store the company id in a field
		this.companySkillId = json.EWS.HrwResponse.HrwResult.HrwTicketForDisplay.CompanySettings.CompanySkillId;
		
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
		this.enableRequestor = json.EWS.HrwResponse.HrwResult.HrwTicketForDisplay.CompanySettings.EnableSecondaryEmployeeField;
		this.employeeValues.ticketAffEmployee.compId = json.EWS.HrwResponse.HrwResult.HrwTicketForDisplay.HrwTicket.CompanySkillId;
		//since 1.2 The company to display could be the customer or the company	
		this.employeeValues.ticketAffEmployee.values.set('COMPANY_ID'	, (json.EWS.HrwResponse.HrwResult.HrwTicketForDisplay.CompanySettings.IsCustomerConfiguration === "true")?json.EWS.HrwResponse.HrwResult.HrwTicketForDisplay.HrwTicket.CustomerSkillId:json.EWS.HrwResponse.HrwResult.HrwTicketForDisplay.HrwTicket.CompanySkillId);
		this.employeeValues.ticketAffEmployee.values.set('COMPANY'		, (json.EWS.HrwResponse.HrwResult.HrwTicketForDisplay.CompanySettings.IsCustomerConfiguration === "true")?json.EWS.HrwResponse.HrwResult.HrwTicketForDisplay.HrwTicket.CustomerName:json.EWS.HrwResponse.HrwResult.HrwTicketForDisplay.HrwTicket.CompanyName);
		this.employeeValues.ticketAffEmployee.values.set('EMP_ID'		, json.EWS.HrwResponse.HrwResult.HrwTicketForDisplay.HrwTicket.EmployeeId);
		this.employeeValues.ticketAffEmployee.values.set('LAST_NAME'	, json.EWS.HrwResponse.HrwResult.HrwTicketForDisplay.HrwTicket.EmployeeLastName);
		this.employeeValues.ticketAffEmployee.values.set('FIRST_NAME'	, json.EWS.HrwResponse.HrwResult.HrwTicketForDisplay.HrwTicket.EmployeeFirstName);
		document.fire('EWS:SCM_ticketApp_AddParam', {name: 'company', value: this.companySkillId});
		
		if (this.enableRequestor == "true"){
			this.employeeValues.ticketRequestor.compId = json.EWS.HrwResponse.HrwResult.HrwTicketForDisplay.HrwTicket.CompanySkillId;
			//since 1.2 The company to display could be the customer or the company	
		    this.employeeValues.ticketRequestor.values.set('COMPANY', (json.EWS.HrwResponse.HrwResult.HrwTicketForDisplay.CompanySettings.IsCustomerConfiguration === "true")?json.EWS.HrwResponse.HrwResult.HrwTicketForDisplay.HrwTicket.CustomerName:json.EWS.HrwResponse.HrwResult.HrwTicketForDisplay.HrwTicket.CompanyName);
			this.employeeValues.ticketRequestor.values.set('COMPANY_ID', (json.EWS.HrwResponse.HrwResult.HrwTicketForDisplay.CompanySettings.IsCustomerConfiguration === "true")?json.EWS.HrwResponse.HrwResult.HrwTicketForDisplay.HrwTicket.CustomerSkillId:json.EWS.HrwResponse.HrwResult.HrwTicketForDisplay.HrwTicket.CompanySkillId);
			this.employeeValues.ticketRequestor.values.set('EMP_ID', json.EWS.HrwResponse.HrwResult.HrwTicketForDisplay.HrwTicket.SecEmployeeId);
			this.employeeValues.ticketRequestor.values.set('LAST_NAME', json.EWS.HrwResponse.HrwResult.HrwTicketForDisplay.HrwTicket.SecEmployeeLastName);
			this.employeeValues.ticketRequestor.values.set('FIRST_NAME', json.EWS.HrwResponse.HrwResult.HrwTicketForDisplay.HrwTicket.SecEmployeeFirstName);
		}

		this.ticketValues.ticketType		= json.EWS.HrwResponse.HrwResult.HrwTicketForDisplay.HrwTicket.Type;
		this.ticketValues.ticketStatus 		= json.EWS.HrwResponse.HrwResult.HrwTicketForDisplay.HrwTicket.Status;
		if (!Object.isEmpty(json.EWS.HrwResponse.HrwResult.HrwTicketForDisplay.HrwTicket.ShortDescription)){
			//since 2.1 Use the standard encoding
			this.ticketValues.ticketSubject		= HrwRequest.decode(json.EWS.HrwResponse.HrwResult.HrwTicketForDisplay.HrwTicket.ShortDescription);
		}else{
			this.ticketValues.ticketSubject		= global.getLabel('SCM_no_subject').escapeHTML();
		}
		this.ticketValues.ticketDescription = json.EWS.HrwResponse.HrwResult.HrwTicketForDisplay.HrwTicket.Description;
		this.ticketValues.ticketSolution	= json.EWS.HrwResponse.HrwResult.HrwTicketForDisplay.HrwTicket.Solution;
		this.ticketHasSolution = false;
		if(!Object.isEmpty(this.ticketValues.ticketSolution)){
			if(!Object.isEmpty(this.ticketValues.ticketSolution.stripTags().gsub('\n','').gsub('&nbsp;',''))){
				this.ticketHasSolution = true;
			}	
		}
		this.ticketValues.ticketCDate		= SCM_Ticket.convertDateTime(json.EWS.HrwResponse.HrwResult.HrwTicketForDisplay.HrwTicket.CreationDateTime);
		this.ticketValues.ticketCurrAgent	= json.EWS.HrwResponse.HrwResult.HrwTicketForDisplay.HrwTicket.CurrentAgentId;
		// 2.0 Retrieving the remaining time
		this.ticketValues.ticketRtime       = json.EWS.HrwResponse.HrwResult.HrwTicketForDisplay.HrwTicket.RemainingBusinessMinutes;
		if(!Object.isEmpty(json.EWS.HrwResponse.HrwResult.HrwTicketForDisplay.HrwTicket.DueDateDyn) &&
		            typeof(json.EWS.HrwResponse.HrwResult.HrwTicketForDisplay.HrwTicket.DueDateDyn)!= "object"){
			this.ticketValues.ticketDDate		= SCM_Ticket.convertDateTime(json.EWS.HrwResponse.HrwResult.HrwTicketForDisplay.HrwTicket.DueDateDyn);
		}else if(typeof(json.EWS.HrwResponse.HrwResult.HrwTicketForDisplay.HrwTicket.DueDate)!= "object"){
			this.ticketValues.ticketDDate		= SCM_Ticket.convertDateTime(json.EWS.HrwResponse.HrwResult.HrwTicketForDisplay.HrwTicket.DueDate);
		}else{
			this.ticketValues.ticketDDate = '';
		}
		this.ticketValues.ticketSGId		= json.EWS.HrwResponse.HrwResult.HrwTicketForDisplay.HrwTicket.ServiceGroupId ;
		this.ticketValues.ticketServiceId	= json.EWS.HrwResponse.HrwResult.HrwTicketForDisplay.HrwTicket.ServiceSkillId ;
		document.fire('EWS:SCM_ticketApp_AddParam', {name: 'service', value: this.ticketValues.ticketServiceId});
		
		if (json.EWS.HrwResponse.HrwResult.HrwTicketForDisplay.HrwTicket.HrwTicketActions)
			this.ticketValues.ticketPrevActions	= objectToArray(json.EWS.HrwResponse.HrwResult.HrwTicketForDisplay.HrwTicket.HrwTicketActions.HrwTicketAction);
		if (json.EWS.HrwResponse.HrwResult.HrwTicketForDisplay.HrwTicket.HrwTicketItems)
			this.ticketValues.ticketPrevTechAct	= objectToArray(json.EWS.HrwResponse.HrwResult.HrwTicketForDisplay.HrwTicket.HrwTicketItems.HrwTicketItem);
		if (json.EWS.HrwResponse.HrwResult.HrwTicketForDisplay.HrwTicket.HrwTicketSkills)
			this.ticketValues.ticketAttributes	= objectToArray(json.EWS.HrwResponse.HrwResult.HrwTicketForDisplay.HrwTicket.HrwTicketSkills.HrwTicketSkill);
		var serviceGroups = $A();
		if(json.EWS.HrwResponse.HrwResult.HrwTicketForDisplay.ServiceGroups)
			serviceGroups = objectToArray(json.EWS.HrwResponse.HrwResult.HrwTicketForDisplay.ServiceGroups.KeyValue);
		var services 	  = $A();
		if(json.EWS.HrwResponse.HrwResult.HrwTicketForDisplay.Services)
			services = objectToArray(json.EWS.HrwResponse.HrwResult.HrwTicketForDisplay.Services.KeyValue);
		this.listOfSG = $H();
		this.listOfServices = $H();
		serviceGroups.each(function(serviceGroup){
			this.listOfSG.set(serviceGroup.Key, serviceGroup.Value);			
		}.bind(this));
		services.each(function(service){
			this.listOfServices.set(service.Key, service.Value);
		}.bind(this));
		
		this.ticketValues.ticketSG = this.listOfSG.get(this.ticketValues.ticketSGId);
		this.ticketValues.ticketService = this.listOfServices.get(this.ticketValues.ticketServiceId);
		
		this.ticketValues.ticketSolved = json.EWS.HrwResponse.HrwResult.HrwTicketForDisplay.HrwTicket.Solved;
		
		this._backend_loadPendingReasons(); //_loadPendingReasons();
			
		document.fire('EWS:scm_ticketStatusUpdate', {
			status		: this.ticketValues.ticketStatus				,
			agent		: this.ticketValues.ticketCurrAgent				,
			companyId	: this.employeeValues.ticketAffEmployee.compId	});
		
		this._initPanels();
	},
	/**
	 * 
	 * @param {Object} json
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
	 * 
	 * @param {Object} json
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
	 * 
	 * @param {Object} currentEmployee
	 * @param {Object} json
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
	 * 
	 * @param {Object} json
	 * @since 1.0
	 * <br/>Modified in version 1.1:
	 * <ul>
	 * <li>Remove the call to the manage heartBeat</li>
	 * </ul>
	 */
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
	 * 
	 * @param {Object} json
	 * @since 1.0
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

/*----------------------------------------------------------------------------------------------
 * 						EVENT HANDLERS FUNCTION
 *--------------------------------------------------------------------------------------------*/
	/**
	 * 
	 * @param {Object} args
	 * @since 1.0
	 */
	_viewPreviousActionEvent:function(args){
		this._displayActionInEditor(getArgs(args).action);
	},
	/**
	 * 
	 * @param {Object} args
	 * @since 1.0
	 */
	_filterActionsEvent:function(args){
		this.actionsList.filterActions(!(getArgs(args).value));
		this.actionsList.addActionHeadersListeners(this.screenObject.ticketPrevActSpot.value);
		this.actionsList.addActionsOnTicketActions();
		CKEDITOR.instances.scm_ticketViewScreenEditor.setData('');
	},
	/**
	 * 
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
			case 8: //reopen
				document.observe('EWS:scm_reOpenPopupClosed', this.eventListeners.reOpenPopupClosed)
				new ticketActionPopupScreens().showReOpenPopup(this.ticketValues.ticketId);
				break;
			default: alert('action performed not authorized');
					 break;
		}
	},
	/**
	 * 
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
	 * 
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
	 * 
	 * @param {Object} args
	 * @since 1.0
	 */
	_reOpenPopupClosedEvent:function(args){
		params = getArgs(args);
		document.stopObserving('EWS:scm_reOpenPopupClosed');
		var callArgs = {serviceToCall:'ReopenTicket', description:params.reOpenDescription};
		this._performActionOnTicketEvent(callArgs);
	},
	/**
	 * 
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
	 * 
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
	}
});
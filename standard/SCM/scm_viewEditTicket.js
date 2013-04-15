/**
 * Common class to manage the viewing and the edition of a ticket
 * @version 2.2
 * <br/>Modified in 2.2
 * <ul>
 * <li>Keep the content of the CKEDITOR instances to show them when display the screen without reload</li>
 * <li>Truncate the title of the widget for employee details properly</li>
 * </ul>
 * <br/>Modified in 2.1
 * <ul>
 * <li>Get the value of the Scheduled date</li>
 * <li>Use the common way to encode/decode fields for the communication to the backend</li>
 * <li>If we come from documents but the ticket id changed, reload the screen.</li>
 * <li>Add the possibility to send a tcket to pending and to the general pool</li>
 * <li>Deactivate teh spell checker</li>
 * </ul>
 */
var scm_viewEditTicket = Class.create(Application,{
	mainTitle : '',

	screenObject:null,

	eventListeners:null,

	ticketValues:null,

	employeeValues:null,
	
	listOfSA :null,

	listOfSG: null,

	listOfServices: null,

	enableRequestor: null,

	activeEmpSearch:null,

	actionsList:null,

	pendingReasons:null,

	actionPerformed:null,

	employeeHistLaunched:null,
	
	ewsnotif    : null,
	
	ewsinfo     : null,
	
	ewsdocument : null,
	
	ewsapproval : null,

	ticketAction_actionsTypes:null,

	ticketAction_ewsInfo : null,

	ticketAction_ewsNotif: null,

	ticketAction_ewsDocument: null,

	ticketAction_ewsApproval: null,

	doNotReset:null,
	
	SCM_mode:null,
	
	enableSolvedStatus:null,
	
	useAreas: null,
	
	companySkillId: null,
	
	/**
	 * Date of the end of the scheduling 
	 * @type Date
	 * @since 2.1
	 */
	scheduleDate: null,
	
	/**
	 * Save the content of CKEDITOR for the display of actions
	 * @type String
	 * @since 2.2
	 */
	viewCkScreenForReload: '',
	
	/**
	 * Save the content of CKEDITOR for the ediont of email/actions
	 * @type String
	 * @since 2.2
	 */
	editCkScreenForReload: '',
	
//-------- Standard functions --------//

	initialize: function($super, args){
		$super(args);
		
		this.eventListeners = {
			viewPreviousAction	  		: this._viewPreviousActionEvent.bindAsEventListener(this),
			technicalActionsChanged 	: this._filterActionsEvent.bindAsEventListener(this),
			performActionOnTicket		: this._defineActionAndParamsEvent.bindAsEventListener(this),
			pendingPopupClosed			: this._getPendingInfoFromPopupEvent.bindAsEventListener(this),
			waitingPopupClosed			: this._getWaitingInfoFromPopupEvent.bindAsEventListener(this),
			dynCompanyInfoClicked		: this._dynCompanyInfoEvent.bindAsEventListener(this),
			affectedEmployeeLinkClicked	: this._affectedEmployeeLinkClicked.bindAsEventListener(this),
			requestorLinkClicked		: this._requestorLinkClicked.bindAsEventListener(this),
			setClosingFlag				: this._setClosingFlagEvent.bindAsEventListener(this)		
		};			
	},
	/**
	 * Whne loading the application
	 * @since 2.0
	 * <br/>Modification for 2.2
	 * <ul>
	 * <li>Reset the CKEDITOR content to its previous value if the screen is not to reload</li>
	 * <li>The event handlers of hte class are also reloaded if the screen is not to reload</li>
	 * </ul>
	 * <br/>Modification for 2.1
	 * <ul>
	 * <li>If we come from documents but the ticket id changed, reload the screen.</li>
	 * </ul>
	 */
	run: function($super, args){
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
		
		//since 2.1 If the ticket id changed, reset the screen content
		if(this.doNotReset && this.ticketValues && this.ticketValues.ticketId !== getArgs(args).get('ticketId')) {
			this.doNotReset = false;
			this.resetData();
		}
		
		if (this.doNotReset == true) {
			if (CKEDITOR && CKEDITOR.instances) {
				if(CKEDITOR.instances.scm_ticketViewScreenEditor) 	CKEDITOR.instances.scm_ticketViewScreenEditor.setData(this.viewCkScreenForReload);
				if(CKEDITOR.instances.scm_ticketDescrScreenEditor)	CKEDITOR.instances.scm_ticketDescrScreenEditor.setData(this.ticketValues.ticketDescription);
				if(CKEDITOR.instances.scm_ticketSolScreenEditor)	CKEDITOR.instances.scm_ticketSolScreenEditor.setData(this.ticketValues.ticketSolution);
				if(CKEDITOR.instances.scm_ticketEditScreenEditor) 	CKEDITOR.instances.scm_ticketEditScreenEditor.setData(this.editCkScreenForReload);
				this.viewCkScreenForReload = '';
				this.editCkScreenForReload = '';
			}
			return;
		}
		
		// Ticket specific values
		this.ticketValues = {
			ticketId: getArgs(args).get('ticketId'),
			ticketType: null,
			ticketStatus: null,
			ticketSubject: null,
			ticketDescription: null,
			ticketSolution: null,
			ticketCDate: null,
			ticketDDate: null,
			ticketDDateHRWFormat:null,
			ticketStaticDDate: null,
			ticketSAId:null,
			ticketSA: null,
			ticketSG: null,
			ticketSGId: null,
			ticketRtime: null,
			ticketService: null,
			ticketServiceId: null,
			ticketPrevActions: null,
			ticketPrevTechAct: null,
			ticketItems: null,
			ticketAttributes: null,
			ticketCurrAgent: null,
			ticketDocuments: null,
			ticketSolved: null
		};
		
		this.employeeValues = {
			ticketRequestor: {
				builded: false,
				employeeSearch: null,
				extension: null,
				values: $H({
					COMPANY_ID: null,
					COMPANY: null,
					EMP_ID: null,
					FIRST_NAME: null,
					LAST_NAME: null,
					EMAIL: null
				}),
				userAction: null,
				id: null,
				compId: null,
				dynCompInfo: null,
				defDynCompInfo: null
			},
			ticketAffEmployee: {
				builded: false,
				employeeSearch: null,
				extension: null,
				values: $H({
					COMPANY_ID: null,
					COMPANY: null,
					EMP_ID: null,
					FIRST_NAME: null,
					LAST_NAME: null,
					EMAIL: null
				}),
				userAction: null,
				id: null,
				compId: null,
				dynCompInfo: null,
				defDynCompInfo: null
			},
			
			ticketCompanyDetails: null
		};
		
		this.ticketAction_actionsTypes = $A();
		
		this.firstRun == true ? this.firstRun = false : this.resetData();
		
		this.screenInitialize();
	},
	
	/**
	 * On application closure
	 * @since 2.0
	 * <br/>Modified for 2.2 
	 * <ul>
	 * <li>Always stop the observing of the events</li>
	 * <li>Get the value of the CKEDITOR content for next screen display if no reload</li>
	 * </ul>
	 */
	close: function($super){
		//since 2.2 Keep the CKEDITOR values
		if (this.doNotReset == true) {
			if (CKEDITOR && CKEDITOR.instances) {
				if (CKEDITOR.instances.scm_ticketViewScreenEditor) 
					this.viewCkScreenForReload = CKEDITOR.instances.scm_ticketViewScreenEditor.getData();
				if (CKEDITOR.instances.scm_ticketEditScreenEditor) 
					this.editCkScreenForReload = CKEDITOR.instances.scm_ticketEditScreenEditor.getData();
			}
		}
		
		$super();
		
		this._cleanEmployeeHistoryPanel();

		document.stopObserving('EWS:scm_affectedEmployeeLinkClicked', this.eventListeners.affectedEmployeeLinkClicked);
		document.stopObserving('EWS:scm_requestorLinkClicked', this.eventListeners.requestorLinkClicked);
		document.stopObserving('EWS:scm_viewPreviousAction', this.eventListeners.viewPreviousAction);
		document.stopObserving('EWS:scm_ticketActionCheckBoxChange', this.eventListeners.technicalActionsChanged);
		document.stopObserving('EWS:scm_tiact_take_processing', this.eventListeners.performActionOnTicket);
		document.stopObserving('EWS:scm_tiact_set_pending', this.eventListeners.performActionOnTicket);
		document.stopObserving('EWS:scm_tiact_set_waiting', this.eventListeners.performActionOnTicket);
		document.stopObserving('EWS:scm_tiact_close_ticket', this.eventListeners.performActionOnTicket);
		document.stopObserving('EWS:scm_dynCompanyInfoClicked', this.eventListeners.dynCompanyInfoClicked);
				
		if (this.doNotReset == true) return;
			
		this.resetData();
	},		

//-------- Screen intialize functions --------//
	screenInitialize:function(){
		this._backend_getTicketValues();
	},

	_initPanels:function(){
		if(Object.isEmpty(this.screenObject))
			this.screenObject = new scm_ticketScreen_standard_new(this.virtualHtml, 2);
		else
			this.screenObject.hideMailButtons();
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
	
	_initTopPanel:function(){
		var flag = true;
		var app = '';
		if (this.SCM_mode == 'view') {
			flag = true;
			app  = 'scm_viewTicket';
		}else {
			flag=false;
			app  = 'scm_editTicket';
		}
		if(this.enableRequestor == "true"){
			this.employeeValues.ticketRequestor.employeeSearch = ScmEmployeeSearch.factory(this, 'viewTicketsRequestor', flag);
			this.employeeValues.ticketRequestor.extension	   = this.employeeValues.ticketRequestor.employeeSearch.getFormDisabled();
			
			this.screenObject.empSearchSpotReq.update();
			this.screenObject.empSearchSpotReq.insert(this.employeeValues.ticketRequestor.extension);				
			this.employeeValues.ticketRequestor.employeeSearch.setFormInitial(this.employeeValues.ticketRequestor.extension, true, hrwEngine.custCompMandatory);
			
			this.employeeValues.ticketRequestor.userAction 	   = ScmUserAction.factory(ScmUserAction.DISPLAY_AS_APPLI, this, 'SCM_FindEmpl_viewTicketsRequestor_EMP_ID', $A(['scm_employeeHistory', 'scm_ticketApp', app]));
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
		
		this.employeeValues.ticketAffEmployee.employeeSearch = ScmEmployeeSearch.factory(this, 'viewTicketsAffEmployee', flag);
		if(this.SCM_mode == 'view'){
			this.employeeValues.ticketAffEmployee.extension	   = this.employeeValues.ticketAffEmployee.employeeSearch.getFormDisabled();			
		}else{
			this.employeeValues.ticketAffEmployee.extension	   = this.employeeValues.ticketAffEmployee.employeeSearch.getForm();			
		}
		
		
		this.screenObject.empSearchSpotAff.update();
		this.screenObject.empSearchSpotAff.insert(this.employeeValues.ticketAffEmployee.extension);				
		this.employeeValues.ticketAffEmployee.employeeSearch.setFormInitial(this.employeeValues.ticketAffEmployee.extension, flag, hrwEngine.custCompMandatory);
		
		this.employeeValues.ticketAffEmployee.userAction = ScmUserAction.factory(ScmUserAction.DISPLAY_AS_APPLI, this, 'SCM_FindEmpl_viewTicketsAffEmployee_EMP_ID', $A(['scm_employeeHistory', 'scm_ticketApp', app]));
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
	 * Update the widget title for the employee details
	 * @since 2.0
	 * <br/>Modified for 2.2
	 * <ul>
	 * <li>Correct the truncate of the widget title</li>
	 * </ul>
	 */
	_initTopPanelTitle:function(){
		var widgetTitle = global.getLabel('Employee_details') + ' (';
		if (this.enableRequestor == "true"){
			if (this.employeeValues.ticketRequestor.values.get('COMPANY_ID') == this.employeeValues.ticketAffEmployee.values.get('COMPANY_ID')){
				if (this.employeeValues.ticketRequestor.values.get('EMP_ID') == this.employeeValues.ticketAffEmployee.values.get('EMP_ID')){
					widgetTitle += global.getLabel('requestor') + '/' +global.getLabel('Affected_employee') +':';
					widgetTitle += this.employeeValues.ticketAffEmployee.values.get('FIRST_NAME') + ' ' + this.employeeValues.ticketAffEmployee.values.get('LAST_NAME');
				}else{
					widgetTitle += global.getLabel('requestor') + ': ';
					widgetTitle += this.employeeValues.ticketRequestor.values.get('FIRST_NAME') + ' ' + this.employeeValues.ticketRequestor.values.get('LAST_NAME');
					widgetTitle += '/'
					widgetTitle += global.getLabel('Affected_employee') + ': ';
					widgetTitle += this.employeeValues.ticketAffEmployee.values.get('FIRST_NAME') + ' ' + this.employeeValues.ticketAffEmployee.values.get('LAST_NAME');
				}
			}
		}else{
			widgetTitle += global.getLabel('Affected_employee')+ ': ' + this.employeeValues.ticketAffEmployee.values.get('FIRST_NAME') + ' ' + this.employeeValues.ticketAffEmployee.values.get('LAST_NAME')
		}
		widgetTitle += ')';
		var completeTitle = widgetTitle;
		//since 2.2 Use the standard truncate method
		widgetTitle = widgetTitle.truncate(87);
		
		this.screenObject.updateTopWidgetTitle(widgetTitle, completeTitle);
	},
	
	_initMiddlePanel:function(){
		this.screenObject.updateMiddleWidgetTitle(global.getLabel('Ticket_details')+ ' (<b>'+this.ticketValues.ticketId+'</b>)');
		this._initMiddlePanelTop();
		this._initMiddlePanelLeft();
		this._initMiddlePanelRight();
	},
	
	/**
	 * @since 2.0
	 * <br/>Modified in 2.1
	 * <ul>
	 * <li>Get the Schedule date of the ticket if it has the status "Scheduled"</li>
	 * </ul>
	 */
	_initMiddlePanelTop:function(){
		// ticket ID
		//this.screenObject.ticketIDSpot.value.update(this.ticketValues.ticketId);
		// creation date
		this.screenObject.ticketCdateSpot.value.update(this.ticketValues.ticketCDate);
		// status
		this.screenObject.setTicketStatus(this.ticketValues.ticketStatus, this.ticketValues.ticketType);//ticketStatusSpot.value.update(this.ticketValues.ticketStatus);
		
		//since 2.1 If there is no schedule date, remove it. Otherwise, display it
		if(this.scheduleDate === null) 
			this.screenObject.ticketScheduledTimeSpot.label.update();
		else {
			this.screenObject.ticketScheduledTimeSpot.label.update(global.getLabel('ScheduledToDate'));
			this.screenObject.ticketScheduledTimeSpot.value.update(objectToDisplay(this.scheduleDate) + ' ' + objectToDisplayTime(this.scheduleDate));
		}
			
	},

	_initMiddlePanelLeft:function(){
		this._initMiddlePanelLeftPrevActions();
	},
	
	_initMiddlePanelLeftPrevActions:function(){
		var flag;
		this.SCM_mode == 'view'?flag = true:flag = false;
		this.actionsList = new scm_ticketActions(this.ticketValues.ticketDescription, this.ticketValues.ticketSolution , this.ticketValues.ticketPrevActions, true, !this.screenObject.ticketActionHideTech.value.checked, flag);
		this.screenObject.ticketPrevActSpot.value.update();
		this.screenObject.ticketPrevActSpot.value.insert(this.actionsList.container);
		this.actionsList.addActionHeadersListeners(this.screenObject.ticketPrevActSpot.value);
		this.actionsList.addActionsOnTicketActions();
	},

	_initMiddlePanelRight:function(){
		this.screenObject.ticketDescrSpot.value.update();
		this.screenObject.ticketDescrSpot.value.insert('<textarea rows="13" cols="44" name="scm_ticketViewScreenEditor"></textarea>');

		this.screenObject.ticketDescrDescrSpot.value.update();
		this.screenObject.ticketDescrDescrSpot.value.insert('<textarea rows="13" cols="44" name="scm_ticketDescrScreenEditor"></textarea>');

		this.screenObject.ticketDescrSolSpot.value.update();
		this.screenObject.ticketDescrSolSpot.value.insert('<textarea rows="13" cols="44" name="scm_ticketSolScreenEditor"></textarea>');
		this.screenObject.ticketAttrSpot.value.update();
	},
	
	/**
	 * @since 2.0
	 * <br/>Modified in 2.1
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
		if(this.SCM_mode == 'view'){
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
		}else{
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
		}
	},	
	
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

	_cleanEmployeeHistoryPanel: function() {
		if(this.employeeHistLaunched === null) return;
		
		//Remove the employee history
		if(global.currentSubSubApplication && global.currentSubSubApplication.view === 'scm_employeeHistory')
			global.closeSubSubApplication();
		else if(global.currentSubApplication && global.currentSubApplication.view === 'scm_employeeHistory')
			global.closeSubApplication();
		
		this.employeeHistLaunched = null;
	},
	
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
//-------- Backend functions --------//
	_backend_getTicketValues:function(){
		hrwEngine.callBackend(this, 'Ticket.GetTicketByIdForDisplay', $H({
	        scAgentId : hrwEngine.scAgentId,
	        ticketId  : this.ticketValues.ticketId
	    }), 'getTicketValuesHandler');
	},
	
	_backend_getAffEmployeeValues:function(){
		hrwEngine.callBackend(this, 'Backend.SearchByEmployeeId', $H({
				scAgentId 		: hrwEngine.scAgentId,
				onExistingTicket: true,
				employeeId		: this.employeeValues.ticketAffEmployee.values.get('EMP_ID'),
				clientSkillId	: this.employeeValues.ticketAffEmployee.compId
			}), 'getAffEmployeeValuesHandler');
	},
	
	_backend_getRequestorValues:function(){
		hrwEngine.callBackend(this, 'Backend.SearchByEmployeeId', $H({
				scAgentId 		: hrwEngine.scAgentId,
				onExistingTicket: true,
				employeeId		: this.employeeValues.ticketRequestor.values.get('EMP_ID'),
				clientSkillId	: this.employeeValues.ticketRequestor.compId
			}), 'getRequestorValuesHandler');
	},

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
	
	_backend_performActionOnTicket:function(service, parameters){
		hrwEngine.callBackend(this, 'Ticket.'+service , parameters, 'actionPerformedHandler');
	},
	
	_backend_getTicketItemEmailPreview:function(actionItemId){
		hrwEngine.callBackend(this, 'Email.GetTicketItemEmailPreview', $H({
			scAgentId		: hrwEngine.scAgentId,
			ticketID		: this.ticketValues.ticketId,
			ticketItemId	: actionItemId
		}), 'getTicketItemEmailPreviewHandler');
	},

//-------- Handler functions --------//
	/**
	 * 
	 * @param {Object} json
	 * @since 2.0
	 * <br/>Modifications for 2.1:
	 * <ul>
	 * <li>Use the standard encoding before sending to HRW</li>
	 * <li>Get the schedule date if the ticket has the status "Scheduled"</li>
	 * </ul>
	 */
	getTicketValuesHandler:function(json){
		this.ewsnotif    = false;
		this.ewsinfo     = false;
		this.ewsdocument = false;
		this.ewsapproval = false;
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
					this.ewsinfo = true;
				}else if (actionType.EwsInboxActionType === 'M') {
					this.ticketAction_ewsNotif.push({
						data: actionType.CustomActionTypeId,
						text: actionType.CustomActionName,
						value: actionType.PredefinedText,
						type: actionType.EwsInboxActionType
					});
					this.ewsnotif = true;
				}else if (actionType.EwsInboxActionType === 'D') {
					this.ticketAction_ewsDocument.push({
						data: actionType.CustomActionTypeId,
						text: actionType.CustomActionName,
						value: actionType.PredefinedText,
						type: actionType.EwsInboxActionType
					});
					this.ewsdocument = true;
				}else if (actionType.EwsInboxActionType === 'V') {
					this.ticketAction_ewsApproval.push({
						data: actionType.CustomActionTypeId,
						text: actionType.CustomActionName,
						value: actionType.PredefinedText,
						type: actionType.EwsInboxActionType
					});
					this.ewsapproval = true;
				}
			}
		}.bind(this));
		
		this.enableSolvedStatus = json.EWS.HrwResponse.HrwResult.HrwTicketForDisplay.CompanySettings.EnableSolvedStatus;
		this.enableRequestor 	= json.EWS.HrwResponse.HrwResult.HrwTicketForDisplay.CompanySettings.EnableSecondaryEmployeeField;
		
		//since 2.1 Addition of the scheduling time if the ticket if the status is scheduled
		this.scheduleDate	= null;
		if(json.EWS.HrwResponse.HrwResult.HrwTicketForDisplay.HrwTicket.Status === '3')
			this.scheduleDate = SCM_Ticket.convertDateTimeToObjects(json.EWS.HrwResponse.HrwResult.HrwTicketForDisplay.HrwTicket.ScheduleTime);
		
		this.companySkillId = json.EWS.HrwResponse.HrwResult.HrwTicketForDisplay.CompanySettings.CompanySkillId;
		this.useAreas 		= json.EWS.HrwResponse.HrwResult.HrwTicketForDisplay.CompanySettings.EnableServiceAreaLevel;
		this.employeeValues.ticketAffEmployee.compId = json.EWS.HrwResponse.HrwResult.HrwTicketForDisplay.HrwTicket.CompanySkillId;	
		this.employeeValues.ticketAffEmployee.values.set('COMPANY_ID'	, (json.EWS.HrwResponse.HrwResult.HrwTicketForDisplay.CompanySettings.IsCustomerConfiguration === "true")?json.EWS.HrwResponse.HrwResult.HrwTicketForDisplay.HrwTicket.CustomerSkillId:json.EWS.HrwResponse.HrwResult.HrwTicketForDisplay.HrwTicket.CompanySkillId);
		this.employeeValues.ticketAffEmployee.values.set('COMPANY'		, (json.EWS.HrwResponse.HrwResult.HrwTicketForDisplay.CompanySettings.IsCustomerConfiguration === "true")?json.EWS.HrwResponse.HrwResult.HrwTicketForDisplay.HrwTicket.CustomerName:json.EWS.HrwResponse.HrwResult.HrwTicketForDisplay.HrwTicket.CompanyName);
		this.employeeValues.ticketAffEmployee.values.set('EMP_ID'		, json.EWS.HrwResponse.HrwResult.HrwTicketForDisplay.HrwTicket.EmployeeId);
		this.employeeValues.ticketAffEmployee.values.set('LAST_NAME'	, json.EWS.HrwResponse.HrwResult.HrwTicketForDisplay.HrwTicket.EmployeeLastName);
		this.employeeValues.ticketAffEmployee.values.set('FIRST_NAME'	, json.EWS.HrwResponse.HrwResult.HrwTicketForDisplay.HrwTicket.EmployeeFirstName);
		document.fire('EWS:SCM_ticketApp_AddParam', {name: 'company', value: this.companySkillId});
		
		if (this.enableRequestor == "true"){
			this.employeeValues.ticketRequestor.compId = json.EWS.HrwResponse.HrwResult.HrwTicketForDisplay.HrwTicket.CompanySkillId;	
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
		
		this.ticketValues.ticketCDate		= SCM_Ticket.convertDateTime(json.EWS.HrwResponse.HrwResult.HrwTicketForDisplay.HrwTicket.CreationDateTime);
		this.ticketValues.ticketCurrAgent	= json.EWS.HrwResponse.HrwResult.HrwTicketForDisplay.HrwTicket.CurrentAgentId;
		
		this.ticketValues.ticketRtime       = json.EWS.HrwResponse.HrwResult.HrwTicketForDisplay.HrwTicket.RemainingBusinessMinutes;
		
		if(!Object.isEmpty(json.EWS.HrwResponse.HrwResult.HrwTicketForDisplay.HrwTicket.DueDateDyn) &&
		            typeof(json.EWS.HrwResponse.HrwResult.HrwTicketForDisplay.HrwTicket.DueDateDyn)!= "object"){
			this.ticketValues.ticketDDateHRWFormat = json.EWS.HrwResponse.HrwResult.HrwTicketForDisplay.HrwTicket.DueDateDyn;
			this.ticketValues.ticketDDate		= SCM_Ticket.convertDateTime(json.EWS.HrwResponse.HrwResult.HrwTicketForDisplay.HrwTicket.DueDateDyn);
		}else if(typeof(json.EWS.HrwResponse.HrwResult.HrwTicketForDisplay.HrwTicket.DueDate)!= "object"){
			this.ticketValues.ticketDDateHRWFormat = json.EWS.HrwResponse.HrwResult.HrwTicketForDisplay.HrwTicket.DueDate;
			this.ticketValues.ticketDDate		= SCM_Ticket.convertDateTime(json.EWS.HrwResponse.HrwResult.HrwTicketForDisplay.HrwTicket.DueDate);
		}else{
			this.ticketValues.ticketDDate = '';
			this.ticketValues.ticketDDateHRWFormat = '';
			
		}
		this.ticketValues.ticketSAId		= json.EWS.HrwResponse.HrwResult.HrwTicketForDisplay.HrwTicket.ServiceAreaId;
		this.ticketValues.ticketSGId		= json.EWS.HrwResponse.HrwResult.HrwTicketForDisplay.HrwTicket.ServiceGroupId ;
		this.ticketValues.ticketServiceId	= json.EWS.HrwResponse.HrwResult.HrwTicketForDisplay.HrwTicket.ServiceSkillId ;
		document.fire('EWS:SCM_ticketApp_AddParam', {name: 'service', value: this.ticketValues.ticketServiceId});
		
		if (json.EWS.HrwResponse.HrwResult.HrwTicketForDisplay.HrwTicket.HrwTicketActions)
			this.ticketValues.ticketPrevActions	= objectToArray(json.EWS.HrwResponse.HrwResult.HrwTicketForDisplay.HrwTicket.HrwTicketActions.HrwTicketAction);
		if (json.EWS.HrwResponse.HrwResult.HrwTicketForDisplay.HrwTicket.HrwTicketItems)
			this.ticketValues.ticketPrevTechAct	= objectToArray(json.EWS.HrwResponse.HrwResult.HrwTicketForDisplay.HrwTicket.HrwTicketItems.HrwTicketItem);
		if (json.EWS.HrwResponse.HrwResult.HrwTicketForDisplay.HrwTicket.HrwTicketSkills)
			this.ticketValues.ticketAttributes	= objectToArray(json.EWS.HrwResponse.HrwResult.HrwTicketForDisplay.HrwTicket.HrwTicketSkills.HrwTicketSkill);
		
		var serviceAreas = $A();
		if(this.useAreas == "true"){
			var serviceAreas = $A();
			if(json.EWS.HrwResponse.HrwResult.HrwTicketForDisplay.ServiceAreas)
				serviceAreas = objectToArray(json.EWS.HrwResponse.HrwResult.HrwTicketForDisplay.ServiceAreas.KeyValue);
		}
		var serviceGroups = $A();
		if(json.EWS.HrwResponse.HrwResult.HrwTicketForDisplay.ServiceGroups)
			serviceGroups = objectToArray(json.EWS.HrwResponse.HrwResult.HrwTicketForDisplay.ServiceGroups.KeyValue);
		var services 	  = $A();
		if(json.EWS.HrwResponse.HrwResult.HrwTicketForDisplay.Services)
			services = objectToArray(json.EWS.HrwResponse.HrwResult.HrwTicketForDisplay.Services.KeyValue);
		this.listOfSA = $H();
		serviceAreas.each(function(sa){
			this.listOfSA.set(sa.Key, sa.Value);		
		}, this);
		this.listOfSG = $H();
		serviceGroups.each(function(serviceGroup){
			this.listOfSG.set(serviceGroup.Key, serviceGroup.Value);			
		}.bind(this));
		this.listOfServices = $H();
		services.each(function(service){
			this.listOfServices.set(service.Key, service.Value);
		}.bind(this));
		
		this.ticketValues.ticketSG = this.listOfSG.get(this.ticketValues.ticketSGId);
		this.ticketValues.ticketService = this.listOfServices.get(this.ticketValues.ticketServiceId);
		this.ticketValues.ticketSA = this.listOfSA.get(this.ticketValues.ticketSAId);
		
		this.ticketValues.ticketSolved = json.EWS.HrwResponse.HrwResult.HrwTicketForDisplay.HrwTicket.Solved;

		document.fire('EWS:scm_ticketStatusUpdate', {
			status		: this.ticketValues.ticketStatus				,
			agent		: this.ticketValues.ticketCurrAgent				,
			companyId	: this.employeeValues.ticketAffEmployee.compId	});
		
	},
	
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
	
	getPendingReasonsHandler:function(json){
		var pendingReasons = objectToArray(json.EWS.HrwResponse.HrwResult.ArrayOfKeyValue.KeyValue);
		
		this.pendingReasons = $A();
		pendingReasons.each(function(pendingReason){
			this.pendingReasons.push({data: pendingReason.Key, text:pendingReason.Value});
		}.bind(this));
	},
	
	actionPerformedHandler:function(json){},
	
	getTicketItemEmailPreviewHandler:function(json){},
	
//-------- Event functions --------//
	_setClosingFlagEvent: function(args){},
	
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
			case 8:
					if (this.SCM_mode == 'view') {
						callParameters.set('ticketId', this.ticketValues.ticketId);
						callParameters.set('description', args.description);
					}else{
						callParameters.set('ticketId', this.ticketValues.ticketId);
						callParameters.set('mailFrom', args.mailFrom);
						callParameters.set('mailTo', args.mailTo);
					}
					break;
		};
		this._backend_performActionOnTicket(args.serviceToCall, callParameters);
	},
	
	_filterActionsEvent:function(args){
		this.actionsList.filterActions(!(getArgs(args).value));
		this.actionsList.addActionHeadersListeners(this.screenObject.ticketPrevActSpot.value);
		this.actionsList.addActionsOnTicketActions();
		CKEDITOR.instances.scm_ticketViewScreenEditor.setData("");
	},
	
	_viewPreviousActionEvent:function(args){
		this._displayActionInEditor(getArgs(args).action);
	},
	
	/**
	 * @since 2.0
	 * <br/>Modified for 2.1 
	 * <ul>
	 * <li>Add the possibility to send also to the general pool</li>
	 * </ul>
	 */
	_getPendingInfoFromPopupEvent:function(args){
		var params = getArgs(args);
		document.stopObserving('EWS:scm_pendingPopupClosed');
		//since 2.1 If the ticket is to send to the general pool, change the method to call
		var callArgs = {description: params.pendingDescription, pendingReasonId: params.pendingReasonId};
		if(params.sendToGenPool) 
			callArgs.serviceToCall = 'SendTicketToGeneralPoolPending';
		else 
			callArgs.serviceToCall = 'SwitchTicketToPending';
		
		this._performActionOnTicketEvent(callArgs);

	},
	
	_getWaitingInfoFromPopupEvent:function(args){
		params = getArgs(args);
		document.stopObserving('EWS:scm_waitingPopupClosed');
		var callArgs = {serviceToCall:'SendTicketToAgentPool', description: params.waitingDescription}; 
		this._performActionOnTicketEvent(callArgs);
	},
	
	_affectedEmployeeLinkClicked: function(event) {
		this.activeEmpSearch = 'affectedEmployee';
		if(this.employeeValues.ticketAffEmployee.dynCompInfo)
			this._showTopRightContainerValue();
		else
			this._backend_getTopRightContent(this.activeEmpSearch);
			
		this._initEmployeeHistoryPanel(this.employeeValues.ticketAffEmployee.values.get('EMP_ID'), this.employeeValues.ticketAffEmployee.values.get('FIRST_NAME') + ' ' + this.employeeValues.ticketAffEmployee.values.get('LAST_NAME'), this.employeeValues.ticketAffEmployee.values.get('COMPANY_ID'));
	},
	
	_requestorLinkClicked: function(event) {
		this.activeEmpSearch = 'requestor';
		if(this.employeeValues.ticketRequestor.dynCompInfo)
			this._showTopRightContainerValue();
		else
			this._backend_getTopRightContent(this.activeEmpSearch);
			
		this._initEmployeeHistoryPanel(this.employeeValues.ticketRequestor.values.get('EMP_ID'), this.employeeValues.ticketRequestor.values.get('FIRST_NAME') + ' ' + this.employeeValues.ticketRequestor.values.get('LAST_NAME'), this.employeeValues.ticketRequestor.values.get('COMPANY_ID'));
	},
//-------- Other functions --------//
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
	 * 
	 * @param {Object} action
	 * @param {Object} withButtons
	 * @since 2.0
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
	
	_displayActionInEditor: function(action){}

});
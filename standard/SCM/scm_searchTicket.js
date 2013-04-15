/**
 * @class
 * @description
 * @author jonathanj & nicolasl
 * @version 2.2
 * <br/>Modification for 2.2:
 * <ul>
 * <li>When the user select a redio button that is not property, always disable it</li>
 * <li>Adapt to the new version of the datePicker</li>
 * <li>When sending a search request, use the default method to build skills list for the search by property</li>
 * <li>Replace the label "Subject" by "Short Description"</li>
 * </ul>
 * <br/>Changes for version 2.0
 * <ul>
 * <li>Addition of the version</li>
 * <li>Use the new call stack in the engine to load the list of property types</li>
 * <li>Modification of some calls to the backend (change of method name and of parameters)</li>
 * <li>Addition of the service area </li>
 * <li>Use the subclass of dataPicker with translations</li>
 * <li>Use the dedicated method to get the date value from the date pickers</li>
 * <li>Use a constant for empty HRW values</li>
 * </ul>
 */
var scm_searchTicket = Class.create(scm_pool, /** @lends scm_searchTicket.prototype */{
    
	/**
	 * @type String
	 * Id of the selected company/customer
	 * @since 1.0
	 */
	_companyId: null,
	
	/**
	 * @type Hash
	 * List of the skill values by skill type
	 * @since 1.0
	 */
	_skillValues: null,
	
	/**
	 * @type Hash
	 * List of the services, services groups and service area in the screen
	 * @since 1.0
	 */
	_services: null,
	
	/**
	 * @type infoPopUp
	 * @description Popup to contains the list of possible choices.
	 * @since 1.0
	 */
    _popup: null,
	
	/**
	 * @type JSONAutocompleter
	 * AutoCompleters used on the screen
	 * @since 1.0
	 */
	_autoCompletePropertyType	: null,
	/**
	 * @type JSONAutocompleter
	 * AutoCompleters used on the screen
	 * @since 1.0
	 */
	_autoCompletePropertyValue	: null,
	/**
	 * @type JSONAutocompleter
	 * AutoCompleters used on the screen
	 * @since 1.0
	 */
	_autoCompleteServiceArea	: null,
	/**
	 * @type JSONAutocompleter
	 * AutoCompleters used on the screen
	 * @since 1.0
	 */
	_autoCompleteServiceGroup	: null,
	/**
	 * @type JSONAutocompleter
	 * AutoCompleters used on the screen
	 * @since 1.0
	 */
	_autoCompleteService		: null,
	
	/**
	 * @type megaButtonDisplayer
	 * Button to start the search
	 * @since 1.0
	 */
	_buttonSearch: null,
	
	/**
	 * @type DatePicker
	 * Date pickers to contains the from dates
	 * @since 1.0
	 */
	_fromDate	: null,
	/**
	 * @type DatePicker
	 * Date pickers to contains the to dates
	 * @since 1.0
	 */
	_toDate		: null,
	
	/**
	 * @type HourField
	 * Hour fields to contains the from times
	 * @since 1.0
	 */
	_fromTime	: null,
	
	/**
	 * @type HourField
	 * Hour fields to contains the to times
	 * @since 1.0
	 */
	_toTime		: null,
	
	/**
	 * @type Boolean
	 * Indicate if the list of loading types is loading
	 * @since 1.0
	 */
	_propTypeLoading: null,
	
	/**
	 * Id used to identify the element in the engine stack
	 * @type String
	 * @sine 2.0
	 */
	_propTypeStackId: null,
	
	/**
	 * @type Srting
	 * Id of the last selected property type
	 * @since 1.0
	 */
	_lastPropertyType: null,
	
	/**
	 * @type Srting
	 * Id of the last selected group area
	 * @since 1.0
	 */
	_lastSelectedArea: null,
	
	/**
	 * @type Srting
	 * Id of the last selected service group
	 * @since 1.0
	 */
	_lastSelectedGroup: null,
	
	/**
	 * @type Template
	 * Template used to build labels in the form
	 * @since 1.0
	 */
	_labelTemplate: new Template('<span id="SCM_searchTicket_Label#{ident}" class="SCM_searchTicket_FormLabel">#{label}</span>'),
	
	/**
	 * @type String
	 * Constants used to identify a mode when calling the HRW service to get list of service area
	 * @since 1.0
	 */
	_MODE_AREA		: 'SERV_AREA',
	
	/**
	 * @type String
	 * Constants used to identify a mode when calling the HRW service to get list of service groups
	 * @since 1.0
	 */
	_MODE_GROUP		: 'SERV_GROUP',
	
	/**
	 * @type String
	 * Constants used to identify a mode when calling the HRW service to get list of services
	 * @since 1.0
	 */
	_MODE_SERVICE	: 'SERV_NAME',
	
	/**
	 * @type int
	 * Indicate if the date is :
	 * <ul>
	 * <li><b>scm_searchTicket.DATE_VALID</b>: the date is valid</li>
	 * <li><b>scm_searchTicket.DATE_INVALID</b>: the begin or end date is not valid</li>
	 * </ul>
	 */
	_dateValidity: 0,
	
	/**
	 * 
	 * @param {Object} args
	 * @since 1.0
	 * <br/>Changes for version 2.2
	 * <ul>
	 * <li>Remove the event listener for the out of range</li>
	 * </ul>
	 */
	initialize: function ($super, args){
        $super(args);
		
		this._listeners.set('menuOpened'				, this.menuOpened.bindAsEventListener(this)					);
		this._listeners.set('companySelectedHandler'	, this._companySelectedHandler.bindAsEventListener(this)	);
		this._listeners.set('propertySelectedHandler'	, this._propertySelectedHandler.bindAsEventListener(this)	);
		this._listeners.set('serviceSelectedHandler'		, this._serviceSelectedHandler.bindAsEventListener(this, this._MODE_SERVICE)	);
		this._listeners.set('serviceGroupSelectedHandler'	, this._serviceSelectedHandler.bindAsEventListener(this, this._MODE_GROUP)		);
		this._listeners.set('serviceAreaSelectedHandler'	, this._serviceSelectedHandler.bindAsEventListener(this, this._MODE_AREA)		);
        
		//since 2.0 Add the listeners to activate/desactivate the search button
		this._listeners.set('validDates'	, this._changeDateStatus.bindAsEventListener(this, scm_searchTicket.DATE_VALID));
		this._listeners.set('invalidDates'	, this._changeDateStatus.bindAsEventListener(this, scm_searchTicket.DATE_INVALID));
		
		this.poolType = 'SearchTicket';
		this.onDemandTicketPoolMode = '0';
    },
	
	/**
	 * Initalize the global parameters and open the observers
	 * @param {Object} args
	 * @since 1.0
	 * <br/>Changes for version 2.2
	 * <ul>
	 * <li>Remove the event listener for the out of range</li>
	 * </ul>
	 */
	run: function($super, args) {
		args.set('forceRun', true);
		$super(args);
        document.observe('EWS:scm_menuOpen'							, this._listeners.get('menuOpened')				);
		document.observe('EWS:SCM_searchTicket_companySelected'		, this._listeners.get('companySelectedHandler')	);
		document.observe('EWS:SCM_searchTicket_PropertyTypeSelected', this._listeners.get('propertySelectedHandler'));
		document.observe('EWS:SCM_searchTicket_' + this._MODE_AREA + 'Selected'		, this._listeners.get('serviceAreaSelectedHandler')	);
		document.observe('EWS:SCM_searchTicket_' + this._MODE_GROUP + 'Selected'	, this._listeners.get('serviceGroupSelectedHandler'));
		document.observe('EWS:SCM_searchTicket_' + this._MODE_SERVICE + 'Selected'	, this._listeners.get('serviceSelectedHandler')		);
		//since 2.0 Add the observers to activate/desactivate the search button
		document.observe('EWS:SCM_empHist_correctDate'		, this._listeners.get('validDates'));
		document.observe('EWS:SCM_empHist_wrongDate'		, this._listeners.get('invalidDates'));
		
		this._services			= $H();
		this._propTypeLoading 	= false;
    },
    
	/**
	 * Close the observers and reset the screen
	 * @since 1.0
	 * <br/>Changes for version 2.2
	 * <ul>
	 * <li>Remove the event listener for the out of range</li>
	 * </ul>
	 */
    close: function($super) {
		$super(false);

        document.stopObserving('EWS:scm_menuOpen'							, this._listeners.get('menuOpened')				);
		document.stopObserving('EWS:SCM_searchTicket_companySelected'		, this._listeners.get('companySelectedHandler')	);
		document.stopObserving('EWS:SCM_searchTicket_PropertyTypeSelected'	, this._listeners.get('propertySelectedHandler'));
		document.stopObserving('EWS:SCM_searchTicket_' + this._MODE_AREA + 'Selected'	, this._listeners.get('serviceAreaSelectedHandler')	);
		document.stopObserving('EWS:SCM_searchTicket_' + this._MODE_GROUP + 'Selected'	, this._listeners.get('serviceGroupSelectedHandler'));
		document.stopObserving('EWS:SCM_searchTicket_' + this._MODE_SERVICE + 'Selected', this._listeners.get('serviceSelectedHandler')		);
		
		//since 2.0 Remove the observers to activate/desactivate search button
		document.stopObserving('EWS:SCM_empHist_correctDate'		, this._listeners.get('validDates'));
		document.stopObserving('EWS:SCM_empHist_wrongDate'			, this._listeners.get('invalidDates'));
		
		//since 2.0 Remove the call to get the list of properties
		if(this._propTypeStackId != null)
			hrwEngine.removeFromCallQueue(this._propTypeStackId);
			
		this._services = null;
		
		//Remove the search button
		var button = this.virtualHtml.down('div#SCM_searchTicket_searchButton');
		if(button) button.remove();
		this._buttonSearch = null;
		
		//Remove all the steps
		this._removeStep(1);
		this._removeStep(2);
		this._removeStep(3);
		
		//Remove the result table
		this.ticketsPool = null;
		var poolTable = this.virtualHtml.down('div.SCM_PoolTable');
		if(poolTable) poolTable.remove();
		
		//Remove the leaving HTML
		this._getSearchForm().remove();
	},
	
	/**
	 * @event
	 * @param {Event} event
     * @description Indicate that the left menu has to be initial
	 * @since 1.0
     */
    menuOpened: function(event) {
        //Indicate to the menu that there is no selection currently
        if(getArgs(event) === 'scm_TicketGrouping' && ( Object.isEmpty(this.ticketsPool) || this.ticketsPool.isEmpty()))
            document.fire('EWS:scm_noAvailableGrouping');
    },
	
	/**
	 * @param {JSON Object} json Initial information to start the display
	 * @description Build the application screen
	 * @since 1.0
	 */
	buildScreenHandler: function(json) {
	    var headers = this.getHeaders(json);
	    var footers = this.getFooters(json);
        //Indicate to the menu that there is no selection currently
        document.fire('EWS:scm_noAvailableGrouping');
        
        //Build the form with search criteria
		this._buildInitialSearchForm();

		// Create the pool table and add it in the HTML of the page
		this.ticketsPool = new SCM_PoolTable(headers, footers, this, global.getLabel('No_ticket_for_search'));
		this.virtualHtml.insert(this.ticketsPool.getPoolTable());
			            
		// Set the title
		this.mainTitle = global.getLabel(this.poolType + '_title');
		this.subtitle  = '';
		this.updateTitle();
	},

	/**
	 * @param {JSON Object} json
	 * @description Get the list of mandatory footers
	 * @returns {Hash}
	 * @since 1.0
	 */
	getFooters: function($super, json) {
	    var footers = $super(json);
		
		if(global.hasHRWEditRole()) {
			footers.set('WAIT'		, {type: 'button', active  : false,visible : false, position: 1});	
			footers.set('PEND'		, {type: 'button', active  : false,visible : false, position: 2});	
	        footers.set('PROCESS'	, {type: 'button', active  : false,visible : true , position: 3});
			footers.set('TAKE_OVER'	, {type: 'button', active  : false,visible : false, position: 4});
			footers.set('RE_OPEN'	, {type: 'button', active  : false,visible : true , position: 5});
		}
	    return footers;
	},
	
   /**
	* @param {Integer} paging Number of the current page
	* @param {Integer} numPageItems Number of items by page
	* @param {String} sorting Key used to indicate the sorting (columId ASC|DESC)
	* @param {Boolean} forRefresh Indicate if we are in the case we want to see if there are changes in the ticket list
	* @param {Boolean} force Force the refresh to update cache
	* @description Call the back-end service to get the list of tickets
	* @since 1.0
	*/
	getTicketList : function(paging, numPageItems, sorting, forRefresh, force) {
		var handlerMeth = 'getTicketListHandler';
	    if(forRefresh === true) handlerMeth = 'getTicketListRefreshHandler';
	    
	    this.callGetTicketPool(hrwEngine.callBackend.bind(this, this, 'OnDemandTicketPool.GetOnDemandTicketPool', $H({
			scAgentId               : hrwEngine.scAgentId          ,
			onDemandTicketPoolMode  : this.onDemandTicketPoolMode   ,
			nodeId                  : this.selectedGroup            ,
			pageIndex               : paging                        ,
			sorting                 : sorting
		}), handlerMeth));
	},
	
	/**
	 * @description Get the main div with the form
	 * @returns {Element}
	 * @since 1.0
	 * <br/>Modified for 1.2
	 * <ul>
	 * <li>Replace the "form" tag by a "div" to avoid to reload the page on ENTER</li>
	 * </ul>
	 */
	_getSearchForm: function() {
		var searchForm;
		
		//If there is already a search form, return it
		//since 1.2 Replace the form tag by a div to avoid to reload the page on ENTER
		searchForm = this.virtualHtml.down('div#SCM_searchTicket_steps');
		if(!Object.isEmpty(searchForm)) return searchForm;
		
		//If there is no search form, create it
		//since 1.2 Replace the form tag by a div to avoid to reload the page on ENTER
		searchForm = new Element('div', {'id': 'SCM_searchTicket_steps'});
		this.virtualHtml.insert(searchForm);
		
		return searchForm;
	},
	
	/**
	 * @param {Boolean} withMessage Indicate if the message are to display (false by default)
	 * @description Check that the form is correctly filled.
	 * @returns {Boolean}
	 * @since 1.0
	 */
	checkForm: function(withMessage) {
		withMessage = (withMessage === true);
		//Check the company is selected
		if(this._companyId === null) return false;
		
		//Check if there is a selected radio button in the criteria form
		var divList = this._getSearchForm().select('div.SCM_searchTicket_CritFormItem');
		if(Object.isEmpty(divList)) return false;
		
		//Check if the dates are valid
		if(this._dateValidity !== scm_searchTicket.DATE_VALID) return false;
		
		//Check if the corresponding input field is selected
		var hasValue = null;
		divList.each(function(bloc) {
			if(hasValue !== null) return;
			var ident = bloc.identify().substr(29);
			var radio = bloc.down('input#SCM_searchTicket_CritFormRadio' + ident);
			if(radio.checked) {
				//For the property, there is to check the property types and values
				switch (ident) {
					case 'Property':
						hasValue = (this.getValue('PropertyType') !== '' && this.getValue('PropertyValue') !== '');
						break;
					
					case 'Agent':
						if(withMessage) {
							//If the agent Id is not 4 chars, it is not valid
							if(!this.getValue(ident).match(/^[0-9]{4}$/)) {
								hasValue = false;
							
								//Create an error popup
						        var errorPopup = new infoPopUp({
						            closeButton     : $H({'callBack': function() {
										errorPopup.close();
										delete errorPopup;
									}.bind(this)}),
						            htmlContent     : '<p>' + global.getLabel('AgentIdInvalidFormat') + '</p>',
						            indicatorIcon   : 'exclamation',                    
						            width           : 400
						        }); 
								errorPopup.create();
								break;
							}
						}
						hasValue =(this.getValue(ident) !== '');
						break;
						
					case 'TicketId':
						if(withMessage) {
							//If the ticket Id does not follow the pattern, it is not valid
							if(!this.getValue(ident).match(/^[0-9a-fA-F]{3}-[0-9]{7}$/)) {
								hasValue = false;
							
								//Create an error popup
						        var errorPopup = new infoPopUp({
						            closeButton     : $H({'callBack': function() {
										errorPopup.close();
										delete errorPopup;
									}.bind(this)}),
						            htmlContent     : '<p>' + global.getLabel('TicketIdInvalidFormat').gsub('&1', 'XXXX-XXXXXXX') + '</p>',
						            indicatorIcon   : 'exclamation',                    
						            width           : 400
						        }); 
								errorPopup.create();
								break;
							}
						}
						hasValue =(this.getValue(ident) !== '');
						break;
						
					//For all the other fields, check they have a value
					default:
						hasValue =(this.getValue(ident) !== '');
						break;
				}
			}
		}.bind(this));
		//If there is no value in the criteria, error!
		if(hasValue === false || hasValue === null) return false;
			
		checkbox = this._getSearchForm().down('input#SCM_searchTicket_CritFormCheck' + this._MODE_GROUP);
		if(checkbox && checkbox.checked && this.getValue(this._MODE_GROUP) === '')
			return false;
			
		checkbox = this._getSearchForm().down('input#SCM_searchTicket_CritFormCheck' + this._MODE_SERVICE);	
		if(checkbox && checkbox.checked && this.getValue(this._MODE_SERVICE) === '')
			return false;
			
		return true;
	},
	
	/**
	 * @description Enable or disable the button search
	 * @since 1.0
	 */
	_updateSearchButtonStatus: function() {
		if(this._buttonSearch === null) return;
		
		var formValid 	= this.checkForm();
		var isEnable	= this._buttonSearch.isEnabled('SCM_searchTicket_searchButton');
		
		if(formValid && !isEnable)
			this._buttonSearch.enable('SCM_searchTicket_searchButton');
		else if(!formValid && isEnable)
			this._buttonSearch.disable('SCM_searchTicket_searchButton');
	},
	
	/**
	 * @description Get the value assigned to an ident.
	 * @return {String}
	 * @since 1.0
	 */
	getValue: function(ident) {
		var autocomplete;
		var date;
		var time;
		
		switch(ident) {
			case 'TicketId':
			case 'Subject':
			case 'Agent':
			case 'Descr':
			case 'Employee':
			case 'Sol':
				var input = this._getSearchForm().down('input#SCM_searchTicket_CritFormInput' + ident);
				if(input.value === global.getLabel('SCM_no_subject')) return '';
				else return input.value;

			case 'PropertyType':
				if(this._autoCompletePropertyType === null) return '';
				var value = this._autoCompletePropertyType.getValue();
				if(Object.isEmpty(value) || value.isEmpty === true) return '';
				else return value.idAdded;
				
			case 'PropertyValue':
				if(this._autoCompletePropertyValue === null) return '';
				var value = this._autoCompletePropertyValue.getValue();
				if(Object.isEmpty(value) || value.isEmpty === true) return '';
				else return value.idAdded;
				
			case this._MODE_AREA:
				if(this._autoCompleteServiceArea === null) return '';
				var value = this._autoCompleteServiceArea.getValue();
				if(Object.isEmpty(value) || value.isEmpty === true) return '';
				else return value.idAdded;
				
			case this._MODE_GROUP:
				if(this._autoCompleteServiceGroup === null) return '';
				var value = this._autoCompleteServiceGroup.getValue();
				if(Object.isEmpty(value) || value.isEmpty === true) return '';
				else return value.idAdded;
				
			case this._MODE_SERVICE:
				if(this._autoCompleteService === null) return '';
				var value = this._autoCompleteService.getValue();
				if(Object.isEmpty(value) || value.isEmpty === true) return '';
				else return value.idAdded;
				
			case 'FromDateTime':
				if(this._fromDate === null || this._fromTime === null) return '';
				this._fromTime.addZero();
				sapTime = this._fromTime.getSapTime();
				//since 2.0 Use the dedicated method to get the date value
				return this._fromDate.getActualDate() + 'T' + sapTime.substr(0,2) + ':' + sapTime.substr(2,2) + ':' + sapTime.substring(4,2);
				
			case 'ToDateTime':
				if(this._toDate === null || this._toTime === null) return '';
				this._toTime.addZero();
				sapTime = this._toTime.getSapTime();
				//since 2.0 Use the dedicated method to get the date value
				return this._toDate.getActualDate() + 'T' + sapTime.substr(0,2) + ':' + sapTime.substr(2,2) + ':' + sapTime.substring(4,2);
				
			case 'CreateCloseDate':
				var radio = this._getSearchForm().down('input#SCM_searchTicket_PeriodFormRadioCreate');
				if(!radio) return '';
				if(radio.checked) return radio.value;
				else {
					radio = this._getSearchForm().down('input#SCM_searchTicket_PeriodFormRadioClose');
					if(!radio) return '';
					if(radio.checked) return radio.value;
				}
				
			case 'OnlyOpen':
				var checkbox = this._getSearchForm().down('input#SCM_searchTicket_CustoFormOnlyOpen');
				if(checkbox.checked) return '1';
				else return '0';
		}
		
	},
	
	/**
	 * @description Send the values in HRW
	 * @since 1.0
	 * <br/>Modified for 2.2
	 * <ul>
	 * <li>Build the list of skills via the standard method in hrw_request</li>
	 * </ul>
	 */
	sendForm: function() {
		if(this.checkForm(true) === false) return;
		
		//Reset the table content
		this.ticketsPool.clearTable(false, true, true);
		
		var ticketId = this.getValue('TicketId');
		if(!ticketId.blank() && !this._getSearchForm().down('input#SCM_searchTicket_CritFormRadioTicketId').checked) ticketId = '';
		
		
		var agentId = this.getValue('Agent');
		//since 2.0 Use a constant for the absence of value
		if(agentId.blank() || !this._getSearchForm().down('input#SCM_searchTicket_CritFormRadioAgent').checked)	agentId = HrwEngine.NO_VALUE;
		
		var propertyValue = this.getValue('PropertyValue');
		//since 2.2 Put the skills in a table 
		var skills = $A();
		if(propertyValue && this._getSearchForm().down('input#SCM_searchTicket_CritFormRadioProperty').checked)
			skills.push(propertyValue);
		
		var serviceSkills = $A();
		var service = this.getValue(this._MODE_SERVICE);	
		//If there is a selected service => use it
		if(service && this._getSearchForm().down('input#SCM_searchTicket_CritFormCheck' + this._MODE_SERVICE).checked)
			serviceSkills.push(service);
		//If there is no selected service
		else {
			var group = this.getValue(this._MODE_GROUP);
			//If there is no service but a selected group => select all its services 
			if(group && this._getSearchForm().down('input#SCM_searchTicket_CritFormCheck' + this._MODE_GROUP).checked)
				this._services.get(this._MODE_SERVICE).each(function(service) {
					serviceSkills.push(service.data);
				}.bind(this));
		}
			
		var description 	= this.getValue('Descr');
		if(!description.blank() && !this._getSearchForm().down('input#SCM_searchTicket_CritFormRadioDescr').checked) description = '';
		var subject 		= this.getValue('Subject');
		if(!subject.blank() && !this._getSearchForm().down('input#SCM_searchTicket_CritFormRadioSubject').checked) subject = '';
		var solution		= this.getValue('Sol');
		if(!solution.blank() && !this._getSearchForm().down('input#SCM_searchTicket_CritFormRadioSol').checked) solution = '';
		var actionDescr		= '';
		var employee		= this.getValue('Employee');
		if(!employee.blank() && !this._getSearchForm().down('input#SCM_searchTicket_CritFormRadioEmployee').checked) employee = '';
		var thirdParty		= '';
		var startDate		= this.getValue('FromDateTime');
		var endDate			= this.getValue('ToDateTime');
		var createCloseDate	= this.getValue('CreateCloseDate');
		var onlyOpen		= this.getValue('OnlyOpen');
		
		new PeriodicalExecuter( function(pe) {
			if (this._getTicketListRunning === false) {
				pe.stop();
				this._getTicketListRunning = true;
				hrwEngine.callBackend(this, 'OnDemandTicketPool.DemandTicketSearchPool', 
					$H({
						scAgentId				: hrwEngine.scAgentId,
						TicketSearchArguments	: 
										'<TicketSearchArguments>'
									+		'<TicketId>' 				+ ticketId 			+ '</TicketId>'
									+		'<ScAgentId>' 				+ agentId 			+ '</ScAgentId>'
									+		'<ClientSkillIds>'			+ HrwRequest.createXmlIntArray($A([this._companyId]), false)	+ '</ClientSkillIds>'
									//since 2.2 Use the standard method to build the list of skills
									+		'<SkillIds>'				+ HrwRequest.createXmlIntArray(skills) + '</SkillIds>'
									+		'<ServiceSkillIds>'			+ HrwRequest.createXmlIntArray(serviceSkills, false)			+ '</ServiceSkillIds>'
									+		'<TicketDescription>'		+ description		+ '</TicketDescription>'
									+		'<TicketShortDescription>'	+ subject			+ '</TicketShortDescription>'
									+		'<TicketSolution>'			+ solution			+ '</TicketSolution>'
									+		'<TicketActionDescription>'	+ actionDescr		+ '</TicketActionDescription>'
									+		'<EmployeeId>'				+ employee			+ '</EmployeeId>'
									+		'<ThirdPartyReference>'		+ thirdParty		+ '</ThirdPartyReference>'
									+		'<StartDate>'				+ startDate			+ '</StartDate>'
		  							+		'<EndDate>'					+ endDate			+ '</EndDate>'
									+		'<TicketSearchIntervalMode>'+ createCloseDate	+ '</TicketSearchIntervalMode>'
									+		'<TicketSearchType>'		+ onlyOpen			+ '</TicketSearchType>'
									+	'</TicketSearchArguments>'
				}), this.getTicketListRefreshHandler.bind(this), true, {
					errorMethod		: function(args) {
						document.fire('EWS:scm_noAvailableGrouping');
						this._getTicketListRunning = false; 
						this._errorMethod(args);
					}.bind(this),
					infoMethod		: function(args) {
						document.fire('EWS:scm_noAvailableGrouping');
						this._getTicketListRunning = false; 
						this._infoMethod(args);
					}.bind(this),
					warningMethod	: function(args) {
						document.fire('EWS:scm_noAvailableGrouping');
						this._getTicketListRunning = false; 
						this._warningMethod(args);
					}.bind(this)
				});
			}
		}.bind(this));
	},
	
	/**
	 * @description Build the initial form
	 * @returns {Element}
	 * @since 1.0
	 */
	_buildInitialSearchForm: function() {
		//Add the first step
		this._addStep1();

		this._buttonSearch = new megaButtonDisplayer({
			elements: [{
				idButton		: 'SCM_searchTicket_searchButton',
	            label			: global.getLabel('Search'),
	            className		: 'SCM_searchTicket_SearchButton',
	            handler			: this.sendForm.bindAsEventListener(this),
	            type			: 'button',
	            standardButton	: true
			}],
			mainClass: 'moduleInfoPopUp_stdButton_div_right'
        });
		
		this._getSearchForm().insert({after: this._buttonSearch.getButton('SCM_searchTicket_searchButton')});
		this._updateSearchButtonStatus();
	},
	
	/**
	 * @description Check if the area is to use in the search
	 * @returns {Boolean}
	 * @since 1.0
	 * <br/>Modified for 2.0
	 * <ul>
	 * <li>The value is now dynamic</li>
	 * </ul>
	 */
	checkIfArea: function() {
		return hrwEngine.hasServiceArea;
	},
	
	/**
	 * @param {Integer/String} stepNr Number of the step
	 * @description Check if a step is on the screen
	 * @returns {Boolean}
	 * @since 1.0
	 */
	_checkStepExist: function(stepNr) {
		return (!Object.isEmpty(this._getSearchForm().down('div#SCM_searchTicket_step' + stepNr)));
	},
	
	/**
	 * @param {Integer/String} stepNr Number of the step to add
	 * @param {String} title Title of the step
	 * @param {Element/String} content Content to place in the step
	 * @description Add a step in the search form
	 * @since 1.0
	 */
	_addStep: function(stepNr, title, content) {
		var stepTemplate = new Template(
				'<div id="SCM_searchTicket_step#{stepNr}" class="SCM_searchTicket_step">'
			+		'<div id="SCM_searchTicket_stepTitle#{stepNr}" class="SCM_searchTicket_stepTitle">'
			+			'<span>' + global.getLabel('Step') + '#{stepNr}</span><span> - </span><span>#{title}</span>'
			+		'</div>'
			+		'<div id="SCM_searchTicket_stepContent#{stepNr}" class="SCM_searchTicket_stepContent"> </div>'
			+	'</div>');
		
		var searchForm  = this._getSearchForm();
		searchForm.insert(stepTemplate.evaluate({stepNr: '' + stepNr, title: global.getLabel(title)}));
		searchForm.down('div#SCM_searchTicket_stepContent' + stepNr).insert(content);
	},
	
	/**
	 * @param {Integer/String} stepNr Number of the step to remove
	 * @description Remove a step from the search form
	 * @since 1.0
	 */
	_removeStep: function(stepNr) {
		var step = this._getSearchForm().down('div#SCM_searchTicket_step' + stepNr);
		if(!Object.isEmpty(step)) step.remove();
		
		switch(parseInt(stepNr)) {
			case 1: 
				this._companyId = null;
				break;
			case 2:
				this._autoCompletePropertyType	= null;
				this._autoCompletePropertyValue	= null;
				this._autoCompleteServiceArea	= null;
				this._autoCompleteServiceGroup	= null;
				this._autoCompleteService		= null;
				this._lastPropertyType			= null;
				this._lastSelectedArea			= null;
				this._lastSelectedGroup			= null;
				this._propTypeLoading 			= false;
				this._skillValues				= null;
				break;
				
			case 3: 
				this._fromDate					= null;
				this._toDate					= null;
				this._fromTime					= null;
				this._toTime					= null;
				break;
		}
	},
	
	/**
	 * @description Add the first step in the screen
	 * @since 1.0
	 */
	_addStep1: function() {
		if(this._checkStepExist(1)) return;

		//If the companies are not ready, wait them
		if(hrwEngine.customerBased === null) 
			new PeriodicalExecuter(function(pe) {
				if(hrwEngine.customerBased === null) return;
				pe.stop();
				this._addStep(1, 'SelectCustomer', this.getCustomerForm());
				this.addCustomerFormEvents();
			}.bind(this), 1);
			
		//If the companies are ready, execute	
		else {
			this._addStep(1, 'SelectCustomer', this.getCustomerForm());
			this.addCustomerFormEvents();
		}
		
	},
	
	/**
	 * @description Add the second step in the screen
	 * @since 1.0
	 */
	_addStep2: function() {
		if(this._checkStepExist(2)) return;
		this._addStep(2, 'SelectSearchCriteria', this.getCriteriaForm());
		this.addCriteriaFormEvents();

		//If there is no service area, create only the other fields
		if(this.checkIfArea() === true) {
			this._addServiceList(this._MODE_AREA);
			this._addServiceList(this._MODE_GROUP);
			this._addServiceList(this._MODE_SERVICE);
			
			this._serviceListCall(this._MODE_AREA);
		//since 2.0 Differenciate the cases where there is no area for the company 
		//			and the case when there is still no value
		} else if(this.checkIfArea() === false) {
			this._addServiceList(this._MODE_GROUP);
			this._addServiceList(this._MODE_SERVICE);
			
			this._serviceListCall(this._MODE_GROUP);
			
		//since 2.0 If there is no area, wait for an answer
		} else if(Object.isEmpty(this.checkIfArea())) {
			new PeriodicalExecuter(function(pe) {
				if(Object.isEmpty(this.checkIfArea())) return;
				pe.stop();
				
				if (this.checkIfArea() === true) {
					this._addServiceList(this._MODE_AREA);
					this._addServiceList(this._MODE_GROUP);
					this._addServiceList(this._MODE_SERVICE);
					
					this._serviceListCall(this._MODE_AREA);
				} else if (this.checkIfArea() === false) {
					this._addServiceList(this._MODE_GROUP);
					this._addServiceList(this._MODE_SERVICE);
					
					this._serviceListCall(this._MODE_GROUP);
				}
			}.bind(this), 1);

		}
	},
	
	/**
	 * @description Add the third step in the screen
	 * @since 1.0
	 */
	_addStep3: function() {
		if(this._checkStepExist(3)) return;
		this._addStep(3, 'PeriodSelection', this._getPeriodForm());
		
		this.addPeriodFormEvents();
	},
	
	/**
	 * @description Build the form to ask the customer
	 * @returns {Element}
	 * @since 1.0
	 */
	getCustomerForm: function() {		
		var custoForm = new Element('div', {'id': 'SCM_searchTicket_CustoForm'});
		
		custoForm.insert(this._labelTemplate.evaluate({
			ident: 'CustoFormCustomer',
			label: global.getLabel('Customer') + ':'}));
		
		
		if(hrwEngine.customerBased)
			custoForm.insert('<input type="text" id="SCM_searchTicket_CustoFormSelect" class="SCM_searchTicket_FormInput application_autocompleter_box"/>');
		else
			custoForm.insert('<div id="SCM_searchTicket_CustoFormSelect"> </div>');
			
		custoForm.insert('<input type="checkbox" id="SCM_searchTicket_CustoFormOnlyOpen" checked="checked"/>');
		custoForm.insert('<span id="SCM_searchTicket_LabelOnlyOpen">' + global.getLabel('ReturnOpenTicketsOnly') + '</span>');
		custoForm.insert('<p id="SCM_searchTicket_CustoFormNoRes" class="SCM_TicketGr_noResult">' + global.getLabel('No_founded_results') + '</p>');

		return custoForm;
	},
	
	/**
	 * @description Build the form to ask the different criteria
	 * @returns {Element}
	 * @since 1.0
	 * <br/>Modified in 2.2
	 * <ul>
	 * <li>Replace the label "Subject" by "Short Description"</li>
	 * </ul>
	 */
	getCriteriaForm: function() {
		var fieldTemplate = new Template(
					'<div id="SCM_searchTicket_CritFormItem#{ident}" class="SCM_searchTicket_CritFormItem #{className}">'
				+		'<input type="radio" name="SCM_searchTicket_CritFormRadio" lastchecked="false" class="SCM_searchTicket_FormInput SCM_searchTicket_FormRadio" id="SCM_searchTicket_CritFormRadio#{ident}" disabled="disabled"/>'
				+		this._labelTemplate.evaluate({
							ident: 'CritForm#{ident}'	,
							label: '#{label}:'			})
				+		'<input type="text" disabled="disabled" id="SCM_searchTicket_CritFormInput#{ident}" class="SCM_searchTicket_FormInput application_autocompleter_box" value="' + global.getLabel('SCM_no_subject') + '"/>'
				+	'</div>');
				
		var searchForm = new Element('div', {'id': 'SCM_searchTicket_CriteriaForm'});
		
		searchForm.insert(fieldTemplate.evaluate({ident: 'TicketId'	, label: global.getLabel('TICKET_ID')	, className: 'SCM_searchTicket_CritFormItemFirst'	}));
		//since 2.2 Use the text short description to stay coherent with HRW
		searchForm.insert(fieldTemplate.evaluate({ident: 'Subject'	, label: global.getLabel('ShortDesc')	, className: 'SCM_searchTicket_CritFormItemRight'	}));
		searchForm.insert(fieldTemplate.evaluate({ident: 'Agent'	, label: global.getLabel('ASSIGNED_TO')	, className: 'SCM_searchTicket_CritFormItemLeft'	}));
		searchForm.insert(fieldTemplate.evaluate({ident: 'Descr'	, label: global.getLabel('DESCR')		, className: 'SCM_searchTicket_CritFormItemRight'	}));
		searchForm.insert(fieldTemplate.evaluate({ident: 'Employee'	, label: global.getLabel('EMPLOYEE_ID')	, className: 'SCM_searchTicket_CritFormItemLeft'	}));
		searchForm.insert(fieldTemplate.evaluate({ident: 'Sol'		, label: global.getLabel('Solution')	, className: 'SCM_searchTicket_CritFormItemRight'	}));
		
		searchForm.insert(	'<div id="SCM_searchTicket_CritFormItemProperty" class="SCM_searchTicket_CritFormItem SCM_searchTicket_CritFormItemLeft SCM_searchTicket_CritFormItemRight">'
						+		'<input type="radio" name="SCM_searchTicket_CritFormRadio" class="SCM_searchTicket_FormInput SCM_searchTicket_FormRadio" id="SCM_searchTicket_CritFormRadioProperty" disabled="disabled"/>'
						+		this._labelTemplate.evaluate({
									ident: 'CritFormPropertyType'				,
									label: global.getLabel('PropertyType') + ':'})
						+		'<div id="SCM_searchTicket_CritFormInputPropertyType"></div>'
						+		'<div class="SCM_searchTicket_NoRadio SCM_searchTicket_FormRadio SCM_searchTicket_FormInput"> </div>'
						+		this._labelTemplate.evaluate({
									ident: 'CritFormPropertyValue'					,
									label: global.getLabel('PropertyValue') + ':'	})
						+		'<div id="SCM_searchTicket_CritFormInputPropertyValue"></div>'
						+	'</div>');
		searchForm.insert('<div id="SCM_searchTicket_CritForm' + this._MODE_AREA + '" class="SCM_searchTicket_CritFormItemLeft SCM_searchTicket_CritFormItemRight"> </div>');	
		searchForm.insert('<div id="SCM_searchTicket_CritForm' + this._MODE_GROUP + '" class="SCM_searchTicket_CritFormItemLeft"> </div>');
		searchForm.insert('<div id="SCM_searchTicket_CritForm' + this._MODE_SERVICE + '" class="SCM_searchTicket_CritFormItemRight"> </div>');	
		
		//Select the ticket Id by default
		var radio 		= searchForm.down('input#SCM_searchTicket_CritFormRadioTicketId');
		radio.checked 	= true;
		radio.writeAttribute('lastchecked', 'true');
		
		var input 		= searchForm.down('input#SCM_searchTicket_CritFormInputTicketId');
		input.writeAttribute('maxlength', 11); 
		input.disabled 	= false;
		input.value 	= '';
		
		return searchForm;
	},
	
	/**
	 * @description Build the form for the selection of a period
	 * @returns {Element}
	 * @since 1.0 
	 */
	_getPeriodForm: function() {
		var periodForm = new Element('div', {'id': 'SCM_searchTicket_PeriodForm'});
		periodForm.insert(	'<div id="SCM_searchTicket_PeriodFormFromTo">'
						+		'<div class="application_clear_line"> </div>'
						+		this._labelTemplate.evaluate({
									ident: 'PeriodFormFrom',
									label: global.getLabel('From') + ':'
								})
						+		'<div id="SCM_searchTicket_PeriodFormFromDate"> </div>'
						+		'<div id="SCM_searchTicket_PeriodFormFromTime"> </div>'
						+		'<div class="application_clear_line"> </div>'
						+		this._labelTemplate.evaluate({
									ident: 'PeriodFormTo',
									label: global.getLabel('To') + ':'
								})
						+		'<div id="SCM_searchTicket_PeriodFormToDate"> </div>'
						+		'<div id="SCM_searchTicket_PeriodFormToTime"> </div>'
						+	'</div>');
		
		periodForm.insert(	'<div id="SCM_searchTicket_PeriodFormRadios">'
						+		'<div><input type="radio" name="SCM_searchTicket_PeriodFormRadio" id="SCM_searchTicket_PeriodFormRadioCreate" value="1" checked="checked"/><span>' + global.getLabel('SearchOnCreationDate') + '</span></div>'
						+		'<div><input type="radio" name="SCM_searchTicket_PeriodFormRadio" id="SCM_searchTicket_PeriodFormRadioClose" value="2"/><span>' + global.getLabel('SearchOnCloseDate') + '</span></div>'
						+	'</div>')
		return periodForm;
	},
	
	/**
	 * @param {String} mode Indicate if the getted list is for service, service Area or service Group
	 * @description Add the checkbox, the label and the autocomplete 
	 * @returns {Boolean}
	 * @since 1.0
	 * <br/>Modified for 2.0
	 * <ul>
	 * <li>Manage the cases where there is no checkbox before the field</li>
	 * </ul>
	 */
	_addServiceList: function(mode) {
		var parentId	 = 'SCM_searchTicket_CritForm' + mode;
		var autoComplete;
		
		var mainDiv = this._getSearchForm().down('div#' + parentId);
		
		if(!mainDiv.innerHTML.blank()) return false;

		//There is no select box for the area
		if(mode === this._MODE_AREA) 
			mainDiv.insert('<div class="SCM_searchTicket_NoRadio SCM_searchTicket_FormRadio SCM_searchTicket_FormInput"> </div>');
		else
			mainDiv.insert('<input type="checkbox" id="SCM_searchTicket_CritFormCheck' + mode + '" class="SCM_searchTicket_FormInput SCM_searchTicket_FormRadio"/>');
		
		mainDiv.insert(this._labelTemplate.evaluate({
							ident: 'CritForm' + mode			,
							label: global.getLabel(mode) + ':'	}));
		mainDiv.insert('<div id="SCM_searchTicket_CritFormInput' + mode + '"/>');
		
		//Add the autocomplete field
		autoComplete = new JSONAutocompleter('SCM_searchTicket_CritFormInput' + mode , {
			events						: $H({
				onResultSelected: 'EWS:SCM_searchTicket_' + mode + 'Selected'
			}),
			showEverythingOnButtonClick	: true		,
			timeout						: 5000		,
			templateResult				: '#{text}'	,
			templateOptionsList			: '#{text}'
		}, {autocompleter: {object: []}});
		autoComplete.disable();
		
		//Add the observe on the checkbox
		//since 2.0 It is possible that the checkboxw does not exist in the case of the Area
		var input = mainDiv.down('input#SCM_searchTicket_CritFormCheck' + mode);
		if(input)
			input.observe('click', this._updateSearchButtonStatus.bindAsEventListener(this));
		
		//Set the right autocomplete box
		switch(mode) {
			case this._MODE_AREA:
				this._autoCompleteServiceArea = autoComplete;
				break;
			case this._MODE_GROUP:
				this._autoCompleteServiceGroup = autoComplete;
				break;
			case this._MODE_SERVICE:
				this._autoCompleteService = autoComplete;
				break;
		}
		return true;
	},
	
	/**
	 * @param {String} mode Indicate if the getted list is for service, service Area or service Group
	 * @description Call the backend service to retrieve the list of service, service group or service area
	 * @since 1.0
	 * <br/>Modifications for 2.0
	 * <ul>
	 * <li>Some backend funtion names changed</li>
	 * <li>The parmeter to fix the company bacame a list of companies</li>
	 * <li>Add the calls related to the service areas</li>
	 * <li>Add the selection of the list of service groups for a given service area</li>
	 * </ul>
	 */
	_serviceListCall: function(mode) {
		//since 2.0 The skill ids become a list of integers
		var params 	= $H({
			scAgentId		: hrwEngine.scAgentId	, 
			clientSkillIds	: HrwRequest.createXmlIntArray($A([this._companyId]))
		});
			
		var service;
		var autocomplete;
		
		switch(mode) {
			case this._MODE_AREA:
				autocomplete = this._autoCompleteServiceArea;
				service = 'Admin.CollectTicketSearchServiceAreas';
				break;
			case this._MODE_GROUP:
				autocomplete = this._autoCompleteServiceGroup;
				//since 2.0 The backend function changed of name and the call could be limited by the service area
				if(this._lastSelectedArea === null)
					service = 'Admin.CollectTicketSearchServiceGroups';
				else {
					service = 'Admin.CollectTicketSearchServiceGroupsWithServiceAreaId';
					params.set('serviceAreaId', this._lastSelectedArea);
				}
				
				break;
			case this._MODE_SERVICE:
				autocomplete = this._autoCompleteService;
				params.set('serviceGroupId', this._autoCompleteServiceGroup.getValue().idAdded);
				//since 2.0 The backend function changed of name
				service = 'Admin.CollectTicketSearchServices';
				break;
		}
		autocomplete.loading();
		hrwEngine.callBackend(this, service, params, this._serviceListBackend.bind(this, mode));
	},
	
	/**
	 * @description Add the events on the Customer form 
	 * @since 1.0
	 */
	addCustomerFormEvents: function() {
		//Remove the no result
		this._getSearchForm().down('p#SCM_searchTicket_CustoFormNoRes').hide();
		
		//If the companies are not ready, restart
		if(hrwEngine.customerBased === null || hrwEngine.companies === null) {
			new PeriodicalExecuter(function(pe) {
				pe.stop();
				this.addCustomerFormEvents();
			}.bind(this), 1);
			return;
		}
		
		//Add the autoComplete field
		if(hrwEngine.customerBased === false) {
			var companies = $A();
			
			hrwEngine.companies.each(function(company) {
				companies.push({data: company.key, text: company.value.Name});
			}.bind(this));
			
			//If there is only one customer, display it in a disabled input field 
			if(companies.size() === 1) {
				this._getSearchForm().down('div#SCM_searchTicket_CustoFormSelect').replace('<input type="text" id="SCM_searchTicket_CustoFormSelect" class="SCM_searchTicket_FormInput" disabled="disabled"/>');
				this._companySelectedHandler({
					idAdded			: companies[0].data,
					textAdded		: companies[0].text,
					idAutocompleter	: 'SCM_searchTicket_CustoFormSelect',
					isEmpty			: false
				});
				
			//If there are several companies
			} else {	
				var customers = new JSONAutocompleter('SCM_searchTicket_CustoFormSelect', {
					events						: $H({
						onResultSelected: 'EWS:SCM_searchTicket_companySelected'
					}),
					showEverythingOnButtonClick	: true		,
					timeout						: 5000		,
					templateResult				: '#{text}'	,
					templateOptionsList			: '#{text}'
				}, {autocompleter: {object: companies}});
			}
			
			
		//Add the click on ENTER on the input field  
		//since 1.2 Replace the keypress by keydown
		} else if(hrwEngine.customerBased === true) 
			this._getSearchForm().down('input#SCM_searchTicket_CustoFormSelect').observe('keydown', this._inputKeyPressedHandler.bindAsEventListener(this));
			
		//Add the event on the only onpen tickets
		this._getSearchForm().down('input#SCM_searchTicket_CustoFormOnlyOpen').observe('change', function(event) {
			var radio;
			
			if(event.element().checked) {
				radio = this._getSearchForm().down('input#SCM_searchTicket_PeriodFormRadioCreate');
				if(radio) radio.checked = true;
				radio = this._getSearchForm().down('input#SCM_searchTicket_PeriodFormRadioClose');
				if(radio) radio.disabled = true;
			} else {
				radio = this._getSearchForm().down('input#SCM_searchTicket_PeriodFormRadioClose');
				if(radio) radio.disabled = false;	
			}
					
		}.bindAsEventListener(this));
		
	},
	
	/**
	 * 
	 * @param {Event} event
	 * @since 1.0
	 * <br/>Modifications for 2.0:
	 * <ul>
	 * <li>Call the load of the list of types in the engine queue</li>
	 * </ul>
	 */
	addCriteriaFormEvents: function(event) {
		 //Create the autocomplete with property types
		 this._autoCompletePropertyType = new JSONAutocompleter('SCM_searchTicket_CritFormInputPropertyType', {
			events						: $H({
				onResultSelected: 'EWS:SCM_searchTicket_PropertyTypeSelected'
			}),
			showEverythingOnButtonClick	: true		,
			timeout						: 5000		,
			templateResult				: '#{text}'	,
			templateOptionsList			: '#{text}'
		}, {autocompleter: {object: []}});
		this._autoCompletePropertyType.disable();
		
		//Add the property values 
		this._autoCompletePropertyValue = new JSONAutocompleter('SCM_searchTicket_CritFormInputPropertyValue', {
			events						: $H({
				onResultSelected: 'EWS:SCM_searchTicket_PropertyTypeSelected'
			}),
			showEverythingOnButtonClick	: true		,
			timeout						: 5000		,
			templateResult				: '#{text}'	,
			templateOptionsList			: '#{text}'
		}, {autocompleter: {object: []}});
		this._autoCompletePropertyValue.disable();
		
		var inputValue;
		//Add the event handler on the radio button
		
		this._getSearchForm().select('div.SCM_searchTicket_CritFormItem').each(function(bloc) {
			var ident = bloc.identify().substr(29);
			
			var radio = bloc.down('input#SCM_searchTicket_CritFormRadio' + ident);
			radio.disabled = false;
			radio.observe('click', this.radioClickedHandler.bindAsEventListener(this));
			
			var input = bloc.down('input#SCM_searchTicket_CritFormInput' + ident);
			if (input) {
				input.observe('keyup', function(event){
					if((event.element().value.length === 0 || (event.element().value.length === 1 && event.keyCode !== 8)) || event.keyCode === 13 || event.keyCode === 14)
						this._updateSearchButtonStatus();
				}.bindAsEventListener(this));
				input.observe('blur', this._updateSearchButtonStatus.bindAsEventListener(this));
			}
			
		}.bind(this));
		
		//since 1.2 Use a new method to get the list of skills
		//since 2.0 Use the queue of the hrwEngine to delay this call. If there is already a call, replace it.
		if(this._propTypeStackId != null)
			hrwEngine.removeFromCallQueue(this._propTypeStackId);
			
		this._propTypeStackId = hrwEngine.addInCallQueue(
				this, 'Admin.CollectAllSkillsBySkillType', $H({
					scAgentId		: hrwEngine.scAgentId,
					clientSkillIds	: HrwRequest.createXmlIntArray($A([this._companyId]))
				}), this._collectPropertyTypesBackend.bind(this, true), {}, 5);
	},
	
	/**
	 * @description Add the time and date pickers 
	 * @since 1.0
	 * <br/>Modified for 2.2
	 * <ul>
	 * <li>Adaptation to the new datePicker</li>
	 * </ul>
	 */
	addPeriodFormEvents: function() {
		//Add the dates and link them
		//since 2.2 Use the new datePicker
		//since 2.0 set the events to call to make sure to have correct range of dates
		this._fromDate	= new DatePicker('SCM_searchTicket_PeriodFormFromDate'	, {
			defaultDate			: new Date().addWeeks(-1).toString('yyyyMMdd'),
			emptyDateValid      : false ,
			events				: $H({
				correctDate : 'EWS:SCM_empHist_correctDate',
				wrongDate	: 'EWS:SCM_empHist_wrongDate'
			})
		});
		//since 2.2 Use the new datePicker
		//since 2.0 set the events to call to make sure to have correct range of dates
		this._toDate	= new DatePicker('SCM_searchTicket_PeriodFormToDate'	, {
			defaultDate			: new Date().toString('yyyyMMdd'),
			emptyDateValid      : false ,
			events				: $H({
				correctDate	: 'EWS:SCM_empHist_correctDate',
				wrongDate	: 'EWS:SCM_empHist_wrongDate'
			})
		});
		
		this._fromDate.linkCalendar(this._toDate);
		
		//Add the times
		this._fromTime	= new HourField('SCM_searchTicket_PeriodFormFromTime', {
			defaultTime	: '000001',
			viewSecs	: global.hourFormat.match(/s{1,2}/)? 'yes' : 'no',
			format		: global.hourFormat.match(/[tT]{1,2}/)? '12' : '24'
		});
		this._toTime	= new HourField('SCM_searchTicket_PeriodFormToTime', {
			defaultTime	: '235959',
			viewSecs	: global.hourFormat.match(/s{1,2}/)? 'yes' : 'no',
			format		: global.hourFormat.match(/[tT]{1,2}/)? '12' : '24'
		});
		
		//Set the default state of the buttons depening on the flag that return open tickets only
		if(this._getSearchForm().down('input#SCM_searchTicket_CustoFormOnlyOpen').checked) {
			this._getSearchForm().down('input#SCM_searchTicket_PeriodFormRadioCreate').checked = true;
			this._getSearchForm().down('input#SCM_searchTicket_PeriodFormRadioClose').disabled = true;
		} else 
			this._getSearchForm().down('input#SCM_searchTicket_PeriodFormRadioClose').disabled = false;	
		
	},
	
	/**
	 * @param {Event} event Generated event
	 * @description Select the current radio button
	 * @since 1.0
	 * <br/>Modification for 2.2:
	 * <ul>
	 * <li>Always disable the properties if the user unselect the radio</li>
	 * </ul>
	 * <br/>Modification for 2.0:
	 * <ul>
	 * <li>The call to load the list of properties is added in a queue for later call</li>
	 * </ul>
	 */
	radioClickedHandler: function(event) {
		//If the user select the same node => nothing to do
		if(event.element().readAttribute('lastchecked') === 'true') return;
		
		//Loop on the radio buttons to update there content/events
		this._getSearchForm().select('div.SCM_searchTicket_CritFormItem').each(function(bloc) {
			var ident = bloc.identify().substr(29);
			var radio = bloc.down('input#SCM_searchTicket_CritFormRadio' + ident);
			//For a selected radio, open it
			if(radio.checked) {
				radio.writeAttribute('lastchecked', 'true');
				switch(ident) {
					case 'TicketId':
					case 'Subject':
					case 'Agent':
					case 'Descr':
					case 'Employee':
					case 'Sol':
						var input = bloc.down('input#SCM_searchTicket_CritFormInput' + ident);
						input.disabled = false;
						if(input.value === global.getLabel('SCM_no_subject')) input.value = '';
						break;
					case 'Property':
						//since 2.0 This call is in the engine queue 
						//If there are no elements in the autocomplete => load its list
						if(hrwEngine.removeFromCallQueue(this._propTypeStackId)) {
							this._propTypeLoading = true;
							//since 1.2 Change the method to collect the list of skills
							hrwEngine.callBackend(this, 'Admin.CollectAllSkillsBySkillType', $H({
								scAgentId		: hrwEngine.scAgentId,
								clientSkillIds	: HrwRequest.createXmlIntArray($A([this._companyId]))
							}), this._collectPropertyTypesBackend.bind(this, false));
							this._autoCompletePropertyType.loading();
							break;
						}
						//since 2.0 Get the status from teh engine queue of calls
						if(hrwEngine.getQueueItemStatus(this._propTypeStackId) !== HrwEngine.inQueueStarted && this._propTypeLoading === false) {
							if(!this._autoCompletePropertyType.enabled)  this._autoCompletePropertyType.enable();
							if(!this._autoCompletePropertyValue.enabled && this._autoCompletePropertyType.options.array.size() > 0) 
								this._autoCompletePropertyValue.enable();
						}
						
						break;
				}
				
			//For a non selected radio, close it
			} else {
				if(radio.readAttribute('lastchecked') === 'false') return;
				radio.writeAttribute('lastchecked', 'false');
				switch(ident) {
					case 'TicketId':
					case 'Subject':
					case 'Agent':
					case 'Descr':
					case 'Employee':
					case 'Sol':
						var input = bloc.down('input#SCM_searchTicket_CritFormInput' + ident);
						input.disabled = true;
						if(input.value === '') input.value = global.getLabel('SCM_no_subject');
						break;
					case 'Property':
						//since 2.2 Always disable the properties if the user unselect the radio
						if (this._autoCompletePropertyType.enabled) this._autoCompletePropertyType.disable();
						if (this._autoCompletePropertyValue.enabled) this._autoCompletePropertyValue.disable();
						break;
				}
			}
		}.bind(this));
		
		this._updateSearchButtonStatus();
	}, 
	
	/**
	 * @param {String} mode Indicate if the getted list is for service, service Area or service Group
	 * @param {JSON Object} jsonList Answer from HRW
	 * @description Manage the call to the list of services
	 * @since 1.0
	 * <br/>Modified in version 1.1:
	 * <ul>
	 * <li>Remove the call to the manage heartBeat</li>
	 * </ul>
	 */
	_serviceListBackend: function(mode, jsonList) {
		var selectFirst = false;
		var autocomplete;
		var parentId;
		var services = $A();

		switch(mode) {
			case this._MODE_AREA:
				autocomplete 	= this._autoCompleteServiceArea;
				parentId 		= 'SCM_searchTicket_CritFormServiceArea';
				break;
			case this._MODE_GROUP:
				if(this.checkIfArea() === true) selectFirst = true;
				autocomplete 	= this._autoCompleteServiceGroup;
				parentId 		= 'SCM_searchTicket_CritFormServiceGroup';
				break;
			case this._MODE_SERVICE:
				autocomplete 	= this._autoCompleteService;
				parentId 		= 'SCM_searchTicket_CritFormService';
				break;
		}

		//Get the list of items
		if(jsonList.EWS.HrwResponse.HrwResult.ArrayOfKeyValue)
			objectToArray(jsonList.EWS.HrwResponse.HrwResult.ArrayOfKeyValue.KeyValue).each(function(servGroup) {
				services.push({data: servGroup.Key, text: servGroup.Value});
			}.bind(this));
		
		//Update the autoComplete and the list of values
		this._services.set(mode, services);
		autocomplete.updateInput({autocompleter: {object: services}});
		autocomplete.clearInput();
		autocomplete.stopLoading();
		
		//Select the first element if needed
		if(selectFirst === true) 
			autocomplete.setDefaultValue(services[0].data, false, true);
			
		this._updateSearchButtonStatus();	
	},
	
	/**
	 * @param {Boolean} disableAfter Is the autocomplete to disable once loaded
	 * @param {JSON Object} jsonList Answer from HRW
	 * @description Update the list of property types
	 * @since 1.0
	 * <br/>Modified in version 1.1:
	 * <ul>
	 * <li>Remove the call to the manage heartBeat</li>
	 * </ul>
	 */
	_collectPropertyTypesBackend: function(disableAfter, jsonList) {
		var companySkillTypes 	= $A();
		this._skillValues 		= $H();

		objectToArray(jsonList.EWS.HrwResponse.HrwResult.ArrayOfSkillType.SkillType).each(function(skill){
			var skillValues = $A();
			
			//Add the skill type in the list 
			companySkillTypes.push({
				data: skill.SkillTypeId ,
				text: skill.Name
			});
			
			//Add the skills in the global list
			objectToArray(skill.Skills.KeyValue).each(function(skillValue) {
				//If it is the default value
				//since 2.0 Use a constant for the absence of value
				if(skill.DefaultSkillId !== HrwEngine.NO_VALUE && skill.DefaultSkillId === skillValue.Key)
					skillValues.push({
						data: skillValue.Key	,
						text: skillValue.Value	,
						def	: 'X'				});
				else
					skillValues.push({
						data: skillValue.Key	,
						text: skillValue.Value	});
			}.bind(this));
			
			this._skillValues.set(skill.SkillTypeId, skillValues);
		}.bind(this));
		
		//Update the autocompleter
		this._autoCompletePropertyType.updateInput({autocompleter: {object: companySkillTypes}});
		this._autoCompletePropertyType.clearInput();
		this._autoCompletePropertyType.stopLoading();
		if(disableAfter === true) {
			this._getSearchForm().down('input#SCM_searchTicket_CritFormRadioProperty').disabled = false;
			this._autoCompletePropertyType.disable();
		}
	
		this._propTypeLoading = false;
	},
	
	/**
	 * @param {JSON Object} jsonList Answer from HRW
	 * @description Collect the list of companies send back by HRW
	 * @since 1.0
	 * <br/>Modified in version 1.1:
	 * <ul>
	 * <li>Remove the call to the manage heartBeat</li>
	 * </ul>
	 */
	_collectCompaniesBackend: function(jsonList) {
		var companyTemplate = new Template('<tr>'
                                        +       '<td><input type="radio" name="empSel" value="#{id}"/></td>'
                                        +       '<td><span id="SCM_#{id}_custCompName">#{Value}</span></td>'
										+       '<td><span id="SCM_#{id}_custCompId">#{Key}</span></td>'
                                        +   '</tr>');
										
		var noResult 	= this._getSearchForm().down('p#SCM_searchTicket_CustoFormNoRes');							
		var companies 	= $A();
		
		//Get the list of companies
		if(jsonList.EWS.HrwResponse.HrwResult.ArrayOfKeyValue)
			companies = objectToArray(jsonList.EWS.HrwResponse.HrwResult.ArrayOfKeyValue.KeyValue);
		
		//Depending on the number of companies:
		switch(companies.size()) {
			//Display the no result item
            case 0:
				this._companySelectedHandler({
					idAdded			: '',
					textAdded		: '',
					idAutocompleter	: 'SCM_searchTicket_CustoFormSelect',
					isEmpty			: true
				});
                break;
                
			//Select the own company
            case 1:
				this._companySelectedHandler({
					idAdded			: companies[0].Key,
					textAdded		: companies[0].Value,
					idAutocompleter	: 'SCM_searchTicket_CustoFormSelect',
					isEmpty			: false
				});
                break;
            
			//Create the selection popup
            default:
				//Create the table with the list of employees
                var popup = new Element('div', {'id': 'SCM_searchTicket_CompSearch'});
                
                var table = new Element('table', {'id': 'SCM_searchTicket_SearchTable', 'class': 'sortable'});
                popup.insert(table);

                table.insert(	'<tr>'
                            +       '<th/>'
                            +       '<th>' + global.getLabel('Customer_Name')	+ '</th>'
                            +       '<th>' + global.getLabel('Customer_Id')   	+ '</th>'
                            +   '</tr>');
                            
                companies.each(function(custComp, key) { 
					custComp.id = key;                       
                    table.down(0).insert(companyTemplate.evaluate(custComp));
                }.bind(this));
                

                //Add a reaction on the line click
                table.down(0).childElements().each(function (line) {
                    //Add the onclick for non header lines
                    if(line.down(0).tagName !== 'TD') return;
                    
                    line.observe('click', function(clickedEv) {
                        var element = clickedEv.element();
                        if(element.tagName === 'TR') element = element.down('input');
                        else element = element.up(1).down('input');
                        element.checked = true;
                    }.bindAsEventListener(this));
                    
                    line.observe('dblclick', function(clickedEv) {
                        this._selectLineHandler(table.identify());
                    }.bindAsEventListener(this));
                }.bind(this));
                
                //Create the button to validate the choice or cancel
		        buttons = new megaButtonDisplayer({
			        elements : $A( [ 
			            {
				            label 			: global.getLabel('Select_company')	,
				            className 		: 'SCM_PoolTable_footerButton'	    ,
				            type 			: 'button'						    ,
				            idButton 		: 'SCM_searchTicket_SelectCompany'   ,
				            standardButton 	: true
			            },
			            {
				            label 			: global.getLabel('Cancel')			,
				            className 		: 'SCM_PoolTable_footerButton'		,
				            type 			: 'button'							,
				            idButton 		: 'SCM_searchTicket_NoSelectCompany',
				            standardButton 	: true
			            }])
		        });
                popup.insert(buttons.getButtons());
                this.displayPopup(buttons, popup, table.identify());
				this.addLastSearchButton(popup, buttons, table.identify());
                break;
		}
	},
	
	/**
	 * @param {megaButtonDisplayer} buttons Button in the popup
	 * @param {Element} htmlContent Content to display in the popup 
	 * @param {String} tableId Id of the table to display in the popup
	 * @description Display the popup with results
	 * @since 1.0
	 */
    displayPopup: function(buttons, htmlContent, tableId) {
        //Create the popup
        this._popup = new infoPopUp({
            closeButton     : $H({'callBack': function() {
                TableKit.unloadTable(tableId); 
                this._popup.close();
            }.bind(this)}) ,
            htmlContent     : htmlContent ,
            indicatorIcon   : 'question'  ,
            width           : 730
        }); 
        
        buttons.updateHandler('SCM_searchTicket_SelectCompany', this._selectLineHandler.bind(this, tableId));
        
        buttons.updateHandler('SCM_searchTicket_NoSelectCompany', function() {
            TableKit.unloadTable(tableId);
            this._popup.close();
			delete this._popup;
        }.bind(this));
        
        this._popup.create(); 
        TableKit.Sortable.init(tableId);  
    },
	
	/**
	 * @param {Element} result Popup to display when reload 
	 * @param {megaButtonDisplayer} buttons Button in the popup
	 * @param {String} tableId Id of the table to display in the popup
	 * @description Add the button to get back the last result
	 * @since 1.0
	 */
    addLastSearchButton: function(result, buttons, tableId) {
		if(Object.isEmpty(result)) return;
		
        this.removeLastSearchButton();
		
		var field = this._getSearchForm().down('input#SCM_searchTicket_CustoFormSelect');
		
        var reload = new Element('div', {'id': 'SCM_searchTicket_companyLastSearch', 'class': 'SCM_reload_lastEmployee'});
        field.addClassName('SCM_PoolTable_actions_before');
        field.insert({after: reload});
        
        reload.observe('click', function(event){ 
            this.displayPopup(buttons, result, tableId);
        }.bindAsEventListener(this));
    },
	
	/**
	 * @description Remove the button to access the last search result 
	 * @since 1.0
	 */
	removeLastSearchButton: function() {
		var reload = this._getSearchForm().down('[id="SCM_searchTicket_companyLastSearch"]');
        if(!Object.isEmpty(reload)) {
            reload.previous().removeClassName('SCM_PoolTable_actions_before');
            reload.remove();
        }
	},
	/**
	 * @param {JSON Object} args Parameters of the selected company (textAdded, idAdded, idAutocompleter, isEmpty)
	 * @description Event handler to manage the selection of a company
	 * @returns {Element}
	 * @since 1.0
	 * <br/>Modification for 1.1
	 * <ul>
	 * <li>Even if the selected company stay the same, replace its name when it is selected</li>
	 * </ul>
	 * <br/>Modification for 2.0
	 * <ul>
	 * <li>Get the settings of the selected company to get if there are area for it</li>
	 * </ul>
	 */
	_companySelectedHandler: function(args) {
		if(getArgs(args).idAutocompleter !== 'SCM_searchTicket_CustoFormSelect') return;
		var noResult 	= this._getSearchForm().down('p#SCM_searchTicket_CustoFormNoRes');
		var input 		= this._getSearchForm().down('input#SCM_searchTicket_CustoFormSelect');
		
		//If there is no selected value => display the no result label
		if(getArgs(args).isEmpty) {
			this._companyId = null;
			if(input) input.value = '';
			this._removeStep(2);
			this._removeStep(3);
			if(!noResult.visible()) noResult.show();
		} else {
			//since 1.1 Place the name in the input field even if the company id stay the same 
			if(input) input.value = getArgs(args).textAdded;
			if(this._companyId === getArgs(args).idAdded) return;
			this._companyId		 = getArgs(args).idAdded;
			
			this._removeStep(2);
			this._removeStep(3);
			this._addStep2();
			this._addStep3();
			if(noResult.visible()) noResult.hide();
		}
		//Update the Search button status
		this._updateSearchButtonStatus();
	},
	
	/**
	 * @param {String} tableId Id of the calling table
	 * @description Manage the selection of a company from the list of possible values
	 * @since 1.0
	 */
	_selectLineHandler: function(tableId) {
		var popupHtml 	= this._popup.obHtmlContent
		var selectedId 	= '';

        popupHtml.select('#'+tableId+' input').each(function(input) {
            if(input.checked) selectedId = input.value;
        }.bind(this));
        if(selectedId === '') return;
		
		this._companySelectedHandler({
			idAdded			: popupHtml.down('[id="SCM_'+selectedId+'_custCompId"]').innerHTML,
			textAdded		: popupHtml.down('[id="SCM_'+selectedId+'_custCompName"]').innerHTML,
			idAutocompleter	: 'SCM_searchTicket_CustoFormSelect',
			isEmpty			: false
		});
		
		TableKit.unloadTable(tableId);
		this._popup.close();
		delete this._popup;		
	},
	
	/**
	 * @param {Event} event Generated event
	 * @description React when the user change a value in the company field
	 * @since 1.0
	 */
	_inputKeyPressedHandler: function(event) {
		//Only for the click on ENTER
		if(event.keyCode !== 13 && event.keyCode !== 14) return true;
		
		hrwEngine.callBackend(this, 'Admin.SearchCustomersByName', $H({
			scAgentId	: hrwEngine.scAgentId		,
			name		: event.element().value
		}), this._collectCompaniesBackend.bind(this), true);
		
		return false;
	},
	
	/**
	 * @param {JSON Object} args Parameters of the selected property
	 * @description Catch the event fired when the user select a property type
	 * @since 1.0
	 */
	_propertySelectedHandler: function(args) {
		if(getArgs(args).idAutocompleter === 'SCM_searchTicket_CritFormInputPropertyValue') {
			this._updateSearchButtonStatus();
			return;
		}
		var idAdded = getArgs(args).idAdded;
		if(!this._autoCompletePropertyValue.enabled)
			this._autoCompletePropertyValue.enable();
		
		if(this._lastPropertyType === idAdded) return;
		
		this._lastPropertyType = idAdded;
		this._autoCompletePropertyValue.updateInput({autocompleter: {object: this._skillValues.get(idAdded)}});
		this._autoCompletePropertyValue.clearInput();
		
		this._updateSearchButtonStatus();
	},
	
	/**
	 * @param {JSON Object} args Parameters of the selected property
	 * @param {String} mode Which is the selected mode
	 * @description Catch the event fired when the user select a service, a service group or a service area
	 * @since 1.0
	 * <br/>Modified for 2.0
	 * <ul>
	 * <li>For the service area, there is no flag to check. But if there is a flag, check it when a value is selected</li>
	 * </ul>
	 */
	_serviceSelectedHandler: function(args, mode) {
		var autocomplete;
		//since 2.0 In the case of the service area, there is no checkbox, then, flag it only if it exists
		var checkBox = this._getSearchForm().down('input#SCM_searchTicket_CritFormCheck' + mode);
		if(checkBox) checkBox.checked = true;

		switch(mode) {
			case this._MODE_AREA:
				if(this._lastSelectedArea === getArgs(args).idAdded) return;
				this._lastSelectedArea = getArgs(args).idAdded;
				this._serviceListCall(this._MODE_GROUP);
				break;
				
			case this._MODE_GROUP:
				if(this._lastSelectedGroup === getArgs(args).idAdded) return;
				this._lastSelectedGroup = getArgs(args).idAdded;
				this._serviceListCall(this._MODE_SERVICE);
				break;
		}
	},
	
	/**
	 * Allow to activate or desctivate the search button
	 * @param {Event} event The generated event
	 * @param {Boolean} activate Indicate if the button is to activate or desactivate
	 * @since 2.0
	 */
	_changeDateStatus: function(event, newValue) {
		this._dateValidity = newValue;
		this._updateSearchButtonStatus();
	}
});
/**
 * Indicate that the dates are valid
 * @type Integer
 * @since 2.0
 */
scm_searchTicket.DATE_VALID = 0;
/**
 * Indicate that the begin or the end date is not valid
 * @type Integer
 * @since 2.0
 */
scm_searchTicket.DATE_INVALID = 1;
/**
 * Indicate that the begin date is higher than the low date
 * @type Integer
 * @since 2.0
 */

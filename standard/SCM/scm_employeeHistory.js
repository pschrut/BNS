/**
 * @class
 * @description Pool that contains the tickets assigned to a given agent. <br/>
 * It is possible to select the period for which the history has to be retrieved.
 * @augments scm_pool
 * @author jonathanj & nicolasl
 * @version 2.2
 * <br/>Changes for version 2.2
 * <ul>
 * <li>Use the new version of the datePicker</li>
 * <li>Avoid an error when trying to activate the button search before creating it</li>
 * <li>Add a cache on the list of columns</li>
 * </ul>
 * <br/>Changes for version 2.0
 * <ul>
 * <li>Addition of the version</li>
 * <li>Use the subclass of dataPicker with translations</li>
 * <li>Make sure that it is not possible to search if the low date is higher than the high date</li>
 * </ul>
 * <br/>Changes for version 1.2
 * <ul>
 * <li>Add the filter to don't allow to select ticket processed by other employees</li>
 * </ul>
 */

var scm_employeeHistory = Class.create(scm_pool,/** @lends scm_employeeHistory.prototype */ {   
    /**
	 * @type DatePicker
	 * @description Date picker for the begin date selection.
 	 * @since 1.0
	 */
    _beginDateSelector: null,
    
    /**
	 * @type DatePicker
	 * @description Date picker for the end date selection.
 	 * @since 1.0
	 */
    _endDateSelector: null,
    
    /**
	 * @type String
	 * @description Mode of the employee history pool.
 	 * @since 1.0
	 */
    onDemandTicketPoolMode: null,
    
    /**
	 * @type Boolean
	 * @description Is the title to display on the page.
 	 * @since 1.0
	 */
    withTitle: null,
    
    /**
	 * @type Boolean
	 * @description Is the application content to set in a widget.
 	 * @since 1.0
	 */
    inWidget: null,
    
    /**
	 * @type {Object}
	 * @description Employee to display in the screen with its id and its company.
 	 * @since 1.0
	 */
    employee: null,
    
	/**
	 * Button to search in the selected period
	 * @type MegaButtonDisplayer
	 * @since 2.0
	 */
	_searchButton: null,
	
	/**
	 * List of columns with a json format
	 * @type {Json}
	 * @since 2.2
	 */
	_columnsJson: null,
	
	/**
	 * Class constructor that calls the parent and sets the event listener for the class
	 * @param {Object} args The arguments given when to constructor is called
	 * @since 1.0
	 * <br/>Changes for version 2.0
	 * <ul>
	 * 	<li>Addition of the version</li>
	 * </ul>
	 */
    initialize: function ($super, args){
        $super(args);
        this.employee               = {id: '', name: '', company: ''};
        this.poolType               = 'EmpHistory';
        this.onDemandTicketPoolMode = '2';
        this.withTitle              = true;
        this.inWidget               = false;
		
		this._listeners.set('menuOpened'		, this.menuOpened.bindAsEventListener(this));
		//since 2.0 Add the listeners to activate/desactivate the search button
		this._listeners.set('activateSearch'	, this._activateSearch.bindAsEventListener(this, true));
		this._listeners.set('desactivateSearch'	, this._activateSearch.bindAsEventListener(this, false));
		
		//since 2.0 Initialize the version number
		this.version = '2.0';
	},
	
	/**
	 * Function that is called when the application is displayed. 
	 * This function also initialize the variable for the class.
	 * @param {JSON Object} args The arguments given during the call
	 * @since 1.0
	 * <br/>Modification for 1.1
	 * <ul>
	 * <li>Redirect to General Pool if My Pool is not authorized for the user</li>
	 * </ul>
	 */
    run: function ($super, args){ 
		var mainHTML = this.virtualHtml.down('[id="SCM_empHist"]');
         
        var arguments = $H();
        var changed   = false;

        if(!Object.isEmpty(args)) arguments = getArgs(args);
		
		if(arguments.get('closing') === true) return;
		
        if(!Object.isEmpty(arguments.get('withTitle'))) {
            if(this.withTitle !== arguments.get('withTitle')) changed = true;
            this.withTitle = arguments.get('withTitle'); 
        } else {
            if(this.withTitle === false) changed = true;
            this.withTitle = true; 
        }
        
        if(!Object.isEmpty(arguments.get('inWidget'))) {
            if(this.inWidget !== arguments.get('inWidget')) changed = true;
            this.inWidget = arguments.get('inWidget');
        } else {
            if(this.inWidget === true) changed = true;
            this.inWidget = false; 
        }
        
        if(arguments.get('employeeId')) {
            if(this.employee.id  !== arguments.get('employeeId')) changed = true;
            this.employee.id = arguments.get('employeeId');
        } else {
            if(!Object.isEmpty(this.employee.id)) changed = true;
            this.employee.id = '';
        }
        
        if(arguments.get('employeeName'))
            this.employee.name = arguments.get('employeeName');
        else {
            if(!Object.isEmpty(this.employee.name)) changed = true;
            this.employee.name = '';
        }
		
		if(arguments.get('employeeCompany'))
            this.employee.company = arguments.get('employeeCompany');
        else {
            if(!Object.isEmpty(this.employee.company)) changed = true;
            this.employee.company = '';
        }
        
		//If there is a change on the object => remove the content and the grouping
        if (!Object.isEmpty(mainHTML) && changed === true) {
			mainHTML.remove();
			document.fire('EWS:scm_cleanGrouping', this.poolType);
		} 
		
		if(!Object.isEmpty(args)) args.set('forceRun', true);
		else args = $H({'forceRun': true});
        $super(args);
		document.observe('EWS:scm_menuOpen'						, this._listeners.get('menuOpened'));
		//since 2.0 Add the observers to activate/desactivate the search button
		document.observe('EWS:SCM_empHist_correctRangeOfDate'	, this._listeners.get('activateSearch'));
		document.observe('EWS:SCM_empHist_wrongRangeOfDate'		, this._listeners.get('desactivateSearch'));
		
        //If there is no selected employee
        if(this.employee.id === '') {
			//since 1.1 Check if my pool is present, otherwise, get the parameters of the general pool
			var appId;
			var tabId;
			var view;
			var redirectLabel;
			global.allApps.each(function(app) {
				if(app === 'MY_PL') {
					appId 			= 'MY_PL';
					tabId 			= 'PL_MY';
					view 	 		= 'scm_myPool';
					redirectLabel 	= 'Redirected_to_mypool';
				} else if(app === 'GNR_PL' && Object.isEmpty(appId)) {
					appId 			= 'GNR_PL';
					tabId 			= 'PL_GNR';
					view  			= 'scm_generalPool';
					redirectLabel 	= 'Redirected_to_genpool';
				}
			}, this);
				
            var empHistFailurePopup = new infoPopUp({
                closeButton :   $H( {
                    'callBack':     function() {
                        empHistFailurePopup.close();
                        delete empHistFailurePopup;
                    }
                }),
				//since 1.1 The error message indicate that will be redirected to My Pool or General Pool
                htmlContent : new Element("div").insert(global.getLabel('No_selected_employee') + '<br/>' 
                                                        + global.getLabel('Start_from_user_action') + '<br/>'
                                                        + global.getLabel(redirectLabel)),
                indicatorIcon : 'exclamation',                    
                width: 500
            });   
            
			new PeriodicalExecuter(function(pe) {
  				if (Object.isEmpty(Framework_stb.semitrans)) return;
				pe.stop();
				empHistFailurePopup.create();
				//since 1.1 Redirect to My pool or to general pool
				global.open($H({app: {
					appId	: appId,
					tabId	: tabId,
					view	: view
				}}));
			}, 1);
        }
    },

	/**
	 * Function that calls the function close on the parent class given 
	 * in parameter and removes the observers of the class.
	 * @since 1.0
	 */
    close: function ($super){
        $super();
		document.stopObserving('EWS:scm_menuOpen', this._listeners.get('menuOpened'));
		//since 2.0 Remove the observers to activate/desactivate search button
		document.stopObserving('EWS:SCM_empHist_correctRangeOfDate'	, this._listeners.get('activateSearch'));
		document.stopObserving('EWS:SCM_empHist_wrongRangeOfDate'		, this._listeners.get('desactivateSearch'));
    },
    
	/**
	 * Add the usage of a cache to the standard method that get the list of columns
	 * @since 2.2
	 */
	_getColumnsFromSAP: function($super) {
		if(Object.isEmpty(this._columnsJson)) $super()
		else this.buildScreenHandler(this._columnsJson);
	},
	
    /**
     * @event
     * @param {Event} event Event catched when a menu is open
     * @description When a new menu is open, indicate that 
     * the left menu has to be initial if there is no data in the pool.
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
	 * <br/>Modified for 2.2:
	 * <ul>
	 * <li>Store the result in a variable</li>
	 * </ul>
	 */
	buildScreenHandler: function(json) {
		//since 2.2 Store the list of columns in a variable
		this._columnsJson = json;
		
	    var mainHTML = this.virtualHtml.down('[id="SCM_empHist"]');
	    if(!Object.isEmpty(mainHTML)) return;
	    
	    var headers = this.getHeaders(json);
	    var footers = this.getFooters(json);
        var mainHTML;
        //Indicate to the menu that there is no selection currently
        document.fire('EWS:scm_noAvailableGrouping');
        
        mainHTML = new Element('div', {'id': 'SCM_empHist'});
        this.virtualHtml.insert(mainHTML);
        
        if(this.inWidget === true) 
            mainHTML = this.addWidget(mainHTML);
        
        //Build the form for tickets selection
		this.buildSelectionForm(mainHTML);
		
		// Create the pool table and add it in the HTML of the page
		this.ticketsPool = new SCM_PoolTable(headers, footers, this, global.getLabel('No_ticket_sel_dates_employee'));
		mainHTML.insert(this.ticketsPool.getPoolTable());
			            
		// Set the title
		this.mainTitle = global.getLabel(this.poolType + '_title') + ' (' + this.employee.name + ')';
		this.subtitle  = '';
		this.updateTitle();
	},

   	/**
   	 * @param {JSON Object} json List of the columns to display
	 * @description Get the list of mandatory footers
	 * @returns {Hash} List of the footers elements to display
	 * @since 1.0
	 * @see scm_pool#getFooters
	 */
	getFooters: function($super, json) {
	    var footers = $super(json);
		
		if(global.hasHRWEditRole()) {
			footers.set('WAIT'		, {type: 'button', active  : false,visible : false, position: 1});	
			footers.set('PEND'		, {type: 'button', active  : false,visible : false, position: 2});	
	        footers.set('PROCESS'	, {type: 'button', active  : false,visible : false, position: 3});
			footers.set('TAKE_OVER'	, {type: 'button', active  : false,visible : true , position: 4});
			footers.set('RE_OPEN'	, {type: 'button', active  : false,visible : true , position: 5});
		}
	    return footers;
	},
		
    /**
     * @param {Element} parentNode Node that should contains the selection form.
	 * @description Add the form to select the periods and the status. The parent node 
	 *                  has to be in the DOM of the screen.
	 * @since 1.0
	 * <br/>Modified for 2.2
	 * <ul>
	 * <li>Use the new DatePicker Module</li>
	 * </ul>
	 * <br/>Modified for 2.0
	 * <ul>
	 * <li>Use the subclass of dataPicker with translations</li>
	 * </ul>
	 */
	buildSelectionForm: function(parentNode) {
	    var dateBeginDivId  = 'SCM_empHistBegDate';
	    var dateEndDivId    = 'SCM_empHistEndDate';
	    var searchDivId     = 'SCM_empHistSearch';
	    
	    var searchButton;
	    
	    var beginDate;
	    var endDate;
	    
	    //Add the divs to  contains the autocompletes
	    parentNode.insert(  '<div id="SCM_myActivityForm">'
	                    +       '<span class="application_main_text SCM_myActivityFormLabel">'+global.getLabel('From')+': </span>'
	                    +       '<div id="'+dateBeginDivId+'" class="SCM_myActivityFormItem"></div>'
                        +       '<span class="application_main_text SCM_myActivityFormLabel">'+global.getLabel('To')+': </span>'	                    
	                    +       '<div id="'+dateEndDivId+'" class="SCM_myActivityFormItem"></div>'
						+       '<div id="'+searchDivId+'" class="SCM_myActivityFormItem"></div>'
	                    +   '</div>');
		
		//Add the begin and the end date	        
        beginDate = new Date();
        beginDate.addMonths(-1);	  
        endDate   = new Date();

		//since 2.2 Use the new DatePicker
		//since 2.0 Set the events to call to make sure to have correct range of dates
	    this._beginDateSelector = new DatePicker(dateBeginDivId, {
			emptyDateValid		: false,
			defaultDate         : beginDate.toString('yyyyMMdd'),
			events				: $H({
				correctDate	: 'EWS:SCM_empHist_correctRangeOfDate',
				wrongDate	: 'EWS:SCM_empHist_wrongRangeOfDate'
			})
        });
		
		//since 2.2 Use the new DatePicker
		//since 2.0 Set the events to call to make sure to have correct range of dates
		this._endDateSelector = new DatePicker(dateEndDivId, {
			emptyDateValid		: false,
            defaultDate         : endDate.toString('yyyyMMdd'),
			events				: $H({
				correctDate	: 'EWS:SCM_empHist_correctRangeOfDate',
				wrongDate	: 'EWS:SCM_empHist_wrongRangeOfDate'
			})
        });
		
        this._beginDateSelector.linkCalendar(this._endDateSelector);
		
        //Add the button to update the list of tickets
        this._searchButton = new megaButtonDisplayer({elements : $A([{
			label 			: global.getLabel('Search')	,
			handlerContext 	: null						,
			handler 		: this.getNewTicketList.bindAsEventListener(this),
			className 		: ''						,
			type 			: 'button'					,
			idButton 		: searchDivId       		,
			standardButton 	: true						}])});
	    
	    this.virtualHtml.down('[id="'+searchDivId+'"]').insert(this._searchButton.getButtons());
	},
	
    /**
	 * @description Call the back-end service to get the list of available grouping categories
	 * @since 1.0
	 * @see scm_pool#getAvailableGroupingsHandler
	 */
	getAvailableGroupings: function() {
	    hrwEngine.callBackend(this, 'OnDemandTicketPool.GetTicketTreeGrouping', $H({
	        scAgentId               : hrwEngine.scAgentId  ,
	        onDemandTicketPoolMode  : this.onDemandTicketPoolMode
	    }), this.getAvailableGroupingsHandler.bind(this));
	},
	
	/**
	 * @event
	 * @param {Event} event Parameters of the event 
	 * @description Event handler when grouping categories are selected. 
	 * @since 1.0
	 * @see scm_pool#changeTicketTreeGroupingHandler
	 */
	changeGrouping: function(event) {
	    var newGrouping = getArgs(event);
	    hrwEngine.callBackend(this, 'OnDemandTicketPool.ChangeTicketTreeGrouping', $H({
	        scAgentId               : hrwEngine.scAgentId           ,
	        onDemandTicketPoolMode  : this.onDemandTicketPoolMode   ,
	        ticketTreeGrouping      : newGrouping.newGrouping
	    }), 'changeTicketTreeGroupingHandler');
	},
    
    /**
	 * @param {Element} parent HTML Element to contains the widget
	 * @description Add a widget around the application
	 * @returns {Element} The element that should contains the widget content
	 * @since 1.0
	 */
    addWidget: function(parent) {
        var id = 'SCM_employeeHistory';       
        var content;
        new unmWidget($H({
            title           : global.getLabel(this.poolType + '_title') ,
            collapseBut     : true                                      ,
            showByDefault   : true                                      ,
            contentHTML     : '<div id="'+id+'"/>'                      ,
            onLoadCollapse  : true                                     	,
            targetDiv       : parent.identify()
        }));
        content = this.virtualHtml.down('[id="'+id+'"]');
        content.up().previous().insert({before: '<div class="FWK_EmptyDiv"/>'});
        content.insert({after: '<div class="FWK_EmptyDiv"/>'});
        return content;
    },
    
    /**
     * @event
	 * @param {Event} event Event generated by the search button
	 * @description Indicate the form parameters to the pool
	 * @since 1.0
	 * <br/>Modified for 2.0
	 * <ul>
	 * <li>Get the date from the date picker via the method getActualDate</li>
	 * </ul>
	 * @see scm_pool#getTicketListHandler
	 */
    getNewTicketList: function(event) {
		//since 2.0 Use the standard way to retrieve date picker values
        var startDate = this._beginDateSelector.getActualDate() + 'T00:00:00';
        var endDate   = this._endDateSelector.getActualDate() + 'T23:59:59';

        this.ticketsPool.clearTable(false, true, true);
        new PeriodicalExecuter( function(pe) {
			if (this._getTicketListRunning === false) {
				pe.stop();
				this._getTicketListRunning = true;
				hrwEngine.callBackend(this, 'OnDemandTicketPool.DemandEmployeeHistoryPool', $H( {
					scAgentId       : hrwEngine.scAgentId 	,
					ClientSkillId  	: this.employee.company	,
					employeeId      : this.employee.id		,
					startDate       : startDate       		,
					endDate         : endDate      			,
					openTicketsOnly : 'false'
				}), 'getTicketListHandler');
			}
		}.bind(this), 1);  
    },
    
   /**
	 * @param {Integer} paging Number of the current page
	 * @param {Integer} numPageItems Number of items by page
	 * @param {String} sorting Key used to indicate the sorting (columId ASC|DESC)
	 * @param {Boolean} forRefresh Indicate if we are in the case we want to see if there are changes in the ticket list
	 * @param {Boolean} force Force the refresh to update cache
	 * @description Call the back-end service to get the list of tickets
	 * @since 1.0
	 * @see scm_pool#getTicketListHandler
	 * @see scm_pool#getTicketListRefreshHandler
	 */
	getTicketList : function(paging, numPageItems, sorting, forRefresh, force) {
	    var handlerMeth = 'getTicketListHandler';
	    if(forRefresh === true) handlerMeth = 'getTicketListRefreshHandler';
	    
	    this.callGetTicketPool(hrwEngine.callBackend.bind(this, this, 'OnDemandTicketPool.GetOnDemandTicketPool', $H( {
			scAgentId               : hrwEngine.scAgentId          ,
			onDemandTicketPoolMode  : this.onDemandTicketPoolMode   ,
			nodeId                  : this.selectedGroup            ,
			pageIndex               : paging                        ,
			sorting                 : sorting
		}), handlerMeth)); 
	},
	
	/**
	 * @param {JSON Object} json The list of tickets
	 * @description Add a call to apply the checkbox conditions
	 * @since 1.2
	 */
	getTicketListHandler: function($super, json) {
		$super(json);
		
		//Set the rule that it is only possible to select tickets if it is owner
		if(hrwEngine.isConnected()) {
			this.ticketsPool.addCheckboxCond('notInProcByOtherAgent');
			this.ticketsPool.applyCheckboxCond();
		} else
			new PeriodicalExecuter(function(pe) {
				if(!hrwEngine.isConnected()) return;
				pe.stop();
				this.ticketsPool.addCheckboxCond('notInProcByOtherAgent');
				this.ticketsPool.applyCheckboxCond();
			}.bind(this), 1);
	},
	
	/**
	 * @description Update the title and the subtitle of the application.
	 * @since 1.0
	 */
	updateTitle : function($super) {
	    if(this.withTitle === true) $super();
		else if(!Object.isEmpty(this.title)) {
			this.title.remove();
			this.title = null;
		}
		if(this.inWidget === true) {
			var widgetTitle = this.virtualHtml.down('[id="unmWidgetTitleHTML_SCM_empHist"]');
			if(!Object.isEmpty(widgetTitle)) 
				widgetTitle.down().innerHTML = this.mainTitle;
		}
	} ,
	
	/**
	 * Allow to activate or desctivate the search button
	 * @param {Event} event The generated event
	 * @param {Boolean} activate Indicate if the button is to activate or desactivate
	 * @since 2.0
	 * <br/>Modified in 2.2
	 * <ul>
	 * <li>If there is no search button, avoid the error</li>
	 * </ul>
	 */
	_activateSearch: function(event, activate) {
		//since 2.2 If there no searh button, nothing to do
		if(Object.isEmpty(this._searchButton)) return;
		//Get the first and the own button id
		var buttonId = this._searchButton.getButtonsArray().keys()[0];
		//If the search button is enable and to activate or is disable and to desactivate, 
		//	there is nothing to do 
		if(this._searchButton.isEnabled(buttonId) === activate) return;
		
		if(activate)
			this._searchButton.enable(buttonId);
		else
			this._searchButton.disable(buttonId);
	}
});
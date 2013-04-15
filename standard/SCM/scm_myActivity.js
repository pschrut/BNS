/**
 * @class
 * @description Display on demand the list of tickets manipulated by the agent in a given period.
 * @augments scm_pool
 * @author jonathanj & nicolasl
 * @version 2.0
 * <br/>Changes for version 2.0
 * <ul>
 * 	<li>Addition of the version</li>
 * </ul>
 * <br/>Changes for version 1.2
 * <ul>
 * <li>Add the filter to don't allow to select ticket processed by other employees</li>
 * </ul>
 */

var scm_myActivity = Class.create(scm_pool, /** @lends scm_myActivity.prototype */{
	/**
	 * @type JSONAutocompleter
	 * @description Autocompleter with the list of statuses.
	 * @since 1.0
	 */
    _statusSelector: null,
    
    /**
	 * @type JSONAutocompleter
	 * @description Autocompleter with the list of dates.
	 * @since 1.0
	 */
    _dateSelector: null,
	
    /**
	 * @type String
	 * @description Mode of the My activity pool.
	 * @since 1.0
	 */
    onDemandTicketPoolMode: null,
	
	/**
     * @description Constructor.
     * @param {JSON Object} args Initialization options.
     * @since 1.0
	 * <br/>Changes for version 2.0
	 * <ul>
	 * 	<li>Addition of the version</li>
	 * </ul>
     */
    initialize: function ($super, args){
        $super(args);
        
        this._listeners.set('menuOpened', this.menuOpened.bindAsEventListener(this));
        this.poolType               = 'MyActivity';
        this.onDemandTicketPoolMode = '1';
		
		//since 2.0 Initialize the version number
		this.version = '2.0';
    },
    /**
	 * Function that is called when the application is displayed to add an event
	 * @param {Object} args The arguments given during the call
	 * @since 1.0
	 */
    run: function($super, args) {
        $super(args);
        document.observe('EWS:scm_menuOpen', this._listeners.get('menuOpened'));
    },
	
    /**
	 * Function that calls the function close on the parent class given 
	 * in parameter and removes the observers of the class.
	 * @since 1.0
	 */
    close: function($super) {
        $super();
        document.stopObserving('EWS:scm_menuOpen', this._listeners.get('menuOpened'));
    },
    
    /**
     * @event
     * @param {Event} event Event generated by the opening of the grouping menu
     * @description Indicate that the left menu has to be initial
	 * @since 1.0
     */
    menuOpened: function(event) {
        //Indicate to the menu that there is no selection currently
        if(getArgs(event) === 'scm_TicketGrouping' && ( Object.isEmpty(this.ticketsPool) || this.ticketsPool.isEmpty()))
            document.fire('EWS:scm_noAvailableGrouping');
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
	    
	    this.callGetTicketPool(hrwEngine.callBackend.bind(this, this, 'OnDemandTicketPool.GetOnDemandTicketPool', $H({
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
	* @param {String} dateValue Indicate the selecte range of time
	* @param {String} statusValue Indicate if only the open tickets should be display or all
	* @description Call the back-end service to indicate the parameters to the on demand pool
	* @since 1.0
	* @see scm_pool#getTicketListRefreshHandler
	*/
	setSearchParameters: function(dateValue, statusValue) {    
	    var date      = new Date();
	    date.addMinutes(date.getTimezoneOffset());
	    var startDate = '';
	    var endDate   = '';
	    var onlyOpen  = 'true';

	    switch(dateValue) {
	        case 'TODAY' :
	            date.clearTime();
	            startDate   = objectToSap(date) + 'T00:00:00';
	            endDate     = objectToSap(date.addDays(1).addSeconds(-1)) + 'T23:59:59';
	            break;
	        case 'WEEK'  :
	            date.clearTime();
	            startDate   = objectToSap(date.moveToDayOfWeek(global.calendarsStartDay, -1)) + 'T00:00:00';
	            endDate     = objectToSap(date.moveToDayOfWeek(global.calendarsStartDay, +1).addSeconds(-1)) + 'T23:59:59';
	            break;
	        case 'MONTH' :
	            date.clearTime();
	            startDate   = objectToSap(date.moveToFirstDayOfMonth()) + 'T00:00:00';
	            endDate     = objectToSap(date.addMonths(1).addSeconds(-1)) + 'T23:59:59';
	            break;
	        case '30DAYS':
	            date.clearTime();
	            startDate   = objectToSap(date.addDays(-30)) + 'T00:00:00';
	            endDate     = objectToSap(date.addDays(31).addSeconds(-1)) + 'T23:59:59';
	            break;
	    }           
	    if(statusValue === 'OPEN_CLOSED') onlyOpen = 'false';
	        
		new PeriodicalExecuter( function(pe) {
			if (this._getTicketListRunning === false) {
				pe.stop();
				this._getTicketListRunning = true;
				hrwEngine.callBackend(this, 'OnDemandTicketPool.DemandActivityReportPool', $H( {
					scAgentId       : hrwEngine.scAgentId,
					startDate       : startDate          ,
					endDate         : endDate            ,
					openTicketsOnly : onlyOpen
				}), this.getTicketListRefreshHandler.bind(this), true, {
					errorMethod		: function(args) {this._getTicketListRunning = false; this._errorMethod(args)}.bind(this),
					infoMethod		: function(args) {this._getTicketListRunning = false; this._infoMethod(args)}.bind(this),
					warningMethod	: function(args) {this._getTicketListRunning = false; this._warningMethod(args)}.bind(this)
				});
			}
		}.bind(this), 1);  
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
        
        //Build the form for tickets selection
		this.buildSelectionForm(this.virtualHtml);
			
		// Create the pool table and add it in the HTML of the page
		this.ticketsPool = new SCM_PoolTable(headers, footers, this, global.getLabel('No_ticket_found_for_period'));
		this.virtualHtml.insert(this.ticketsPool.getPoolTable());
		// Set the title
		this.mainTitle = global.getLabel(this.poolType + '_title');
		this.subtitle  = '';
		this.updateTitle();
	},
	
	/**
	 * @param {JSON Object} json The parameters from SAP.
	* @description Get the list of mandatory footers
	* @return {Hash} The list of footer items
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
	* @description Call the back-end service to get the list of available grouping categories
	* @since 1.0
	* @see scm_pool#getAvailableGroupingsHandler
	*/
	getAvailableGroupings: function() {
	    hrwEngine.callBackend(this, 'OnDemandTicketPool.GetTicketTreeGrouping', $H({
	        scAgentId               : hrwEngine.scAgentId  ,
	        onDemandTicketPoolMode  : this.onDemandTicketPoolMode
	    }), 'getAvailableGroupingsHandler');
	},
	
	/**
	 * @event
	 * @param {Event} event Event generated when a group is selected 
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
	 * @param {Element} parentNode The HTML element that should contains the form.
	 * @description Add the form to select the periods and the status. The parent node 
	 *                  has to be in the DOM of the screen.
	 * @since 1.0
	 * @see scm_myActivity#getNewTicketList
	 */
	buildSelectionForm: function(parentNode) {
	    var statusDivId     = 'SCM_myActivityStatus';
	    var dateDivId       = 'SCM_myActivityDate';
	    var searchDivId     = 'SCM_myActivitiesSearch';
	    
	    var searchButton;
	    var json;
	    
	    //Add the divs to  contains the autocompletes
	    parentNode.insert(  '<div id="SCM_myActivityForm">'
	                    +       '<span class="application_main_text SCM_myActivityFormLabel">'+global.getLabel('Status')+': </span>'
	                    +       '<div id="'+statusDivId+'" class="SCM_myActivityFormItem"></div>'
                        +       '<span class="application_main_text SCM_myActivityFormLabel">'+global.getLabel('Period')+': </span>'	                    
	                    +       '<div id="'+dateDivId+'" class="SCM_myActivityFormItem"></div>'
	                    +       '<div id="'+searchDivId+'" class="SCM_myActivityFormItem"></div>'
	                    +   '</div>');
	        
	    //Add the autocomplete with possible statuses
	    json = {autocompleter: {object: $A([
	        {data: 'OPEN'           , text: global.getLabel('Only_open')   , def: 'X'},
	        {data: 'OPEN_CLOSED'    , text: global.getLabel('Open_closed')           }])}};
	        
	    this._statusSelector = new JSONAutocompleter(statusDivId, {
            timeout                     : 500       ,
            showEverythingOnButtonClick : true      ,
            templateResult              : '#{text}' ,
            templateOptionsList         : '#{text}'
        }, json);
        
        this.virtualHtml.down('[id="text_area_' + statusDivId + '"]').setStyle({'width': '105px'});
        
        //Add the autocomplete with possible dates
	    json = {autocompleter: {object: $A([
	        {data: 'TODAY'      , text: global.getLabel('Today')      , def: 'X'   	},
	        {data: 'WEEK'       , text: global.getLabel('This_week')                },
	        {data: 'MONTH'      , text: global.getLabel('This_month')               },
	        {data: '30DAYS'     , text: global.getLabel('Last_30_days')				}])}};
	        
	    this._dateSelector = new JSONAutocompleter(dateDivId, {
            timeout                     : 500       ,
            showEverythingOnButtonClick : true      ,
            templateResult              : '#{text}' ,
            templateOptionsList         : '#{text}'
        }, json);
        this.virtualHtml.down('[id="text_area_' + dateDivId + '"]').setStyle({'width': '105px'});
        
        json = {
			label 			: global.getLabel('Search')				,
			handlerContext 	: null									,
			handler 		: this.getNewTicketList.bindAsEventListener(this),
			className 		: ''					,
			type 			: 'button'								,
			idButton 		: searchDivId       					,
			standardButton 	: true									};
			
        //Add the button to update the list of tickets
        searchButton = new megaButtonDisplayer({elements : $A([json])});
	    
	    this.virtualHtml.down('[id="' + searchDivId + '"]').insert(searchButton.getButtons());
	},
	
	/**
	 * @event
	 * Get the list of tickets for the selected form content. 
	 * @since 1.0
	 */
	getNewTicketList: function() {
        this.ticketsPool.clearTable(false, true, true);
        this.setSearchParameters(this._dateSelector.getValue().idAdded, this._statusSelector.getValue().idAdded);
	}	                            
});
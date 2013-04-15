/**
 * @class
 * @description
 * @author jonathanj & nicolasl
 * @version 2.0
 * <br/>Changes for version 2.0
 * <ul>
 * <li>Addition of the version</li>
 * </ul>
 * <br/>Changes for version 1.2
 * <ul>
 * <li>Solve an issue problem with the display of the list of possible teams</li>
 * <li>Change the message if the table is empty</li>
 * </ul>
 */
var scm_teamPool = Class.create(scm_pool, /** @lends scm_teamPool.prototype */{   
    /**
	 * @type String
	 * @description Identifier of the div with the team selection.
	 * @since 1.0
	 */
    _listTeamsId: null,
    
    /**
	 * @type String
	 * @description Id of the currently selected team.
	 * @since 1.0
	 */
    workingTeam: null,
    
	/**
	 * Set the global variables
	 * @param {Object} args
	 * @since 1.0
	 * <br/>Changes for version 2.0
	 * <ul>
	 * 	<li>Addition of the version</li>
	 * </ul>
	 */
    initialize: function ($super, args){
        $super(args);
        
        this._listeners.set('teamSelected', this.teamSelected.bindAsEventListener(this));
        this._listeners.set('menuOpened', this.menuOpened.bindAsEventListener(this));
        
        this.currentTeam    = null;
        this._listTeamsId   = 'SCM_listTeam';
        this.poolType       = 'TeamPool';
        this._mustCleanMenu = false;
		
		//since 2.0 Initialize the version number
		this.version = '2.0';
    },
    
	/**
	 * Start observing opening of the menu and the team selection
	 * @param {Object} args
	 * @since 1.0
	 */
    run: function($super, args) {
        $super(args);
        document.observe('EWS:scm_teamSelected' , this._listeners.get('teamSelected'));
        document.observe('EWS:scm_menuOpen'     , this._listeners.get('menuOpened'));
    },
    
	/**
	 * Stop observing opening of the menu and the team selection
	 * @since 1.0
	 */
    close : function($super) {
        $super();
        document.stopObserving('EWS:scm_teamSelected'   , this._listeners.get('teamSelected'));
        document.stopObserving('EWS:scm_menuOpen'       , this._listeners.get('menuOpened'));
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
	    var handlerMeth = this.getTicketListHandler.bind(this);
	    if(forRefresh === true) handlerMeth = this.getTicketListRefreshHandler.bind(this);
	    
	    var funcName = 'TicketPool.GetTeamPool';
	    if(force === true) funcName = 'TicketPool.ForceGetTeamPool';
	    
        this.callGetTicketPool(hrwEngine.callBackend.bind(this, this, funcName, $H( {
			scAgentId : hrwEngine.scAgentId  ,
			nodeId    : this.selectedGroup   ,
			teamId    : this.workingTeam     ,
			pageIndex : paging               ,
			sorting   : sorting
		}), handlerMeth)); 
	},
	
	/**
	 * @param {JSON Object} json The list of tickets
	 * @description Add a call to apply the checkbox conditions
	 * @since 1.0
	 */
	getTicketListHandler: function($super, json) {
		$super(json);
		
		//Set the rule that it is only possible to select tickets if it is owner
		if(hrwEngine.isConnected()) {
			if(this.ticketsPool.addCheckboxCond('notInProcByOtherAgent'))
				this.ticketsPool.applyCheckboxCond();
		} else
			new PeriodicalExecuter(function(pe) {
				if(!hrwEngine.isConnected()) return;
				pe.stop();
				if(this.ticketsPool.addCheckboxCond('notInProcByOtherAgent'))
					this.ticketsPool.applyCheckboxCond();
			}.bind(this), 1);
	},
	
	/**
	 * @description Call the back-end service to get the list of teams for the agent
	 * @since 1.0
	 */
	collectAvailableTeams: function() {
	    hrwEngine.callBackend(this,'TicketPool.CollectAvailableTeams', $H({scAgentId   : hrwEngine.agentId}), this.buildAvailableTeams.bind(this));
	},
	
	/**
     * @description Indicate that the left menu has to be initial
	 * @since 1.0
     */
    menuOpened: function(event) {
        //Indicate to the menu that there is no selection currently
        if(getArgs(event) === 'scm_TicketGrouping' && (Object.isEmpty(this.ticketsPool) || this.ticketsPool.isEmpty()))
            document.fire('EWS:scm_noAvailableGrouping');
    },
    
	/**
	 * @param {JSON Object} jsonListTeams List of the team of the agent as a json object
	 * @description Build the select box to select team in a list
	 * @since 1.0
	 * <br/>Modified in version 1.2:
	 * <ul>
	 * <li>Surround the list of team by a div to contains the drop down box</li>
	 * </ul>
	 * <br/>Modified in version 1.1:
	 * <ul>
	 * <li>Remove the call to the manage heartBeat</li>
	 * </ul>
	 */
	buildAvailableTeams: function(jsonListTeams) {
	    var listTeams = $A();
	    var json;
	    
	    if(jsonListTeams.EWS.HrwResponse.HrwResult && jsonListTeams.EWS.HrwResponse.HrwResult.ArrayOfKeyValue && jsonListTeams.EWS.HrwResponse.HrwResult.ArrayOfKeyValue.KeyValue)
	        listTeams = objectToArray(jsonListTeams.EWS.HrwResponse.HrwResult.ArrayOfKeyValue.KeyValue);

	    if(listTeams.size() === 0)
	        this.virtualHtml.down('div#' + this._listTeamsId).innerHTML = '<span class="application_main_text">'+global.getLabel('No_selectable_team')+'</span>';
	    else {
	        // Build the list of possible teams
	        json = {autocompleter: {object: $A()}};

	        listTeams.each(function(team) {
	            json.autocompleter.object.push({
	                text: team.Value,
	                data: team.Key
	            });
	        }.bind(this));
	        
	        // Build the autocompleter
			//since 1.2 Add a div to contain the team selector
			var teamSelector = new Element('div', {'id': this._listTeamsId + 'Selector'});
			this.virtualHtml.down('div#' + this._listTeamsId).insert(teamSelector);
			
	        var teamSelector = new JSONAutocompleter(this._listTeamsId + 'Selector', {
                timeout                     : 500       ,
                showEverythingOnButtonClick : true      ,
                templateResult              : '#{text}' ,
                templateOptionsList         : '#{text}' ,
                autoWidth                   : false     ,
                events                      : $H({'onResultSelected': 'EWS:scm_teamSelected'})
            }, json);
            
            // If there is only one team => select it automatically
            if (listTeams.size() === 1) {
                teamSelector.disable();
                teamSelector.setDefaultValue(listTeams[0].Key, false, true);
            }
	    }
	},
	
	/**
	 * @param {Event} event Parameters of the team selection event
	 * @description Build the application screen
	 * @since 1.0
	 */
	teamSelected: function(event) {
	    if(this.workingTeam === getArgs(event).idAdded) return;
	    
	    this.ticketsPool.clearTable(false, true, true);
        this.workingTeam = getArgs(event).idAdded;
        this.ticketsPool.ticketsToLoad();
	},
	
	/**
	 * @param {JSON Object} json Initial information to start the display
	 * @description Build the application screen
	 * @since 1.0
	 * <br/>Modification for 1.2 
	 * <ul>
	 * <li>Change the message if the table is empty</li>
	 * </ul>
	 */
	buildScreenHandler: function(json) {
	    var headers = this.getHeaders(json);
	    var footers = this.getFooters(json);

		// Create the pool table and add it in the HTML of the page
		//since 1.2 Change the message if there is no result
		this.ticketsPool = new SCM_PoolTable(headers, footers, this, global.getLabel('NoTicketFound'));
		this.virtualHtml.insert('<div id="' + this._listTeamsId + '"><span class="application_main_text">' + global.getLabel('Select_working_team') + ': </span></div>');
		this.collectAvailableTeams();
		this.virtualHtml.insert(this.ticketsPool.getPoolTable());
		
		// Set the title
		this.mainTitle              = global.getLabel(this.poolType + '_title');
		this.subtitle               = '';
		this.updateTitle();
	},
	
	/**
	 * @description Get the list of mandatory footers
	 * @returns {Hash}
	 * @since 1.0
	 */
	getFooters: function($super, json) {
	    var footers = $super(json);
		
		if(global.hasHRWEditRole()) {
			footers.set('WAIT'		, {type: 'button', active  : false,visible : false, position: 1});	
			footers.set('PEND'		, {type: 'button', active  : false,visible : false, position: 2});	
	        footers.set('PROCESS'	, {type: 'button', active  : false,visible : false, position: 3});
			footers.set('TAKE_OVER'	, {type: 'button', active  : false,visible : true , position: 4});
			footers.set('RE_OPEN'	, {type: 'button', active  : false,visible : false, position: 5});
		}
	    return footers;
	}
});
/**
 * @class
 * @description Display the list of tickets in the OPM pool.
 * @augments scm_pool
 * @author jonathanj & nicolasl
 * @version 2.0
 * <br/>Changes for version 2.0
 * <ul>
 * 	<li>Addition of the version</li>
 * </ul>
 */

var scm_opmPool = Class.create(scm_pool, /** @lends scm_opmPool.prototype */{
    /**
     * Initialize the application
     * @param {JSON Object} args Creation arguments
     * @since 1.0
	 * <br/>Changes for version 2.0
	 * <ul>
	 * 	<li>Addition of the version</li>
	 * </ul>
     */
	initialize: function ($super, args){
        $super(args);
        
        this.poolType  = 'OPMPool';
		
		//since 2.0 Initialize the version number
		this.version = '2.0';
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
	    
	    var funcName = 'TicketPool.GetOpmPool';
	    if(force === true) funcName = 'TicketPool.ForceGetOpmPool';
        
        this.callGetTicketPool(hrwEngine.callBackend.bind(this, this, funcName, $H( {
					scAgentId : hrwEngine.scAgentId  ,
					nodeId    : this.selectedGroup   ,
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
	 * @param {JSON Object} json List of footers from the backend
	 * @description Get the list of mandatory footers
	 * @returns {Hash} The list of footers
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
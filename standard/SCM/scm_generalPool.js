/**
 * @class
 * @description Manage the display of the pool with non assigned tickets
 * @augments scm_pool 
 * @author jonathanj & nicolasl
 * @version 2.0
 * <br/>Changes for version 2.0
 * <ul>
 * <li>Addition of the version</li>
 * <li>Extend directly scm_pool and no more MyPool</li>
 * <li>Rmove the class name attribute</li>
 * </ul>
 */
var scm_generalPool = Class.create(scm_pool, /** @lends scm_generalPool.prototype */{
	
	/**
     * @description Constructor.
     * @param {JSON Object} args Initialization options.
	 * @since 1.0
	 * <br/>Changes for version 2.0
	 * <ul>
	 * <li>Addition of the version</li>
	 * <li>Remove the class name</li>
	 * </ul>
     */
	initialize : function($super, args) {
		$super(args);
		this.poolType   = 'GeneralPool';
		
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
	 * @see scm_pool#getTicketListHandler
	 * @see scm_pool#getTicketListRefreshHandler
	 */
	getTicketList : function(paging, numPageItems, sorting, forRefresh, force) {
	    var handlerMeth = 'getTicketListHandler';
	    if(forRefresh === true) handlerMeth = 'getTicketListRefreshHandler';
	    
	    var funcName = 'TicketPool.GetGeneralPool';
	    if(force === true) funcName = 'TicketPool.ForceGetGeneralPool';

	    this.callGetTicketPool(hrwEngine.callBackend.bind(this, this, funcName, $H( {
			scAgentId : hrwEngine.agentId   ,
			nodeId    : this.selectedGroup  ,
			pageIndex : paging              ,
			sorting   : sorting
		}), handlerMeth));
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
	        footers.set('PROCESS'	, {type: 'button', active  : false,visible : true , position: 3});
			footers.set('TAKE_OVER'	, {type: 'button', active  : false,visible : false, position: 4});
			footers.set('RE_OPEN'	, {type: 'button', active  : false,visible : false, position: 5});
		}
	    return footers;
	}
});
/**
 * @class
 * @description Parent class for all pools
 * @augments Application
 * @author jonathanj & nicolasl
 * @version 2.2
 * <br/>Changes for version 2.2
 * <ul>
 * <li>When the user do an action, reset the comment under the pool</li>
 * <li>Add a method for the call to SAP to get the list of columns. In this way, it is possible to overwrite the method to add a cache</li>
 * </ul>
 * <br/>Changes for version 2.1
 * <ul>
 * <li>Correct the sorting by status</li>
 * </ul>
 * <br/>Changes for version 2.0
 * <ul>
 * 	<li>Addition of the version</li>
 * </ul>
 */
var scm_pool = Class.create(Application, /** @lends scm_pool.prototype */{   
	/**
	 * @type String
	 * @description Identifier of the type for the pool.
	 * @since 1.0
	 */
	poolType: null,
	
	/**
	 * @type String
	 * @default ""
	 * @description Title of the pool.
	 * @since 1.0
	 */
	 mainTitle : '',

	/**
	 * @type String
	 * @default ""
	 * @description Subtitle of the pool.
	 * @since 1.0
	 */
	subtitle : '',
	
	/**
	 * @type Hash
	 * @description List of the event handlers bind to this.
	 * @since 1.0
	 */
	_listeners: null,
	
	/**
	 * @type SCM_PoolTable
	 * @description Pool used to display tickets.
	 * @since 1.0
	 */
	ticketsPool : null,	
	
	/**
	 * @type Boolean
	 * @default false
	 * @description Indicate if there is already a launched request.
	 * @since 1.0
	 */
	_getTicketListRunning : false,
	
	/**
	 * @type Hash
	 * @description List of possible categories with there number of items.
	 * @since 1.0
	 */
	_numByIds: $H(),
	
	/**
	 * @type String
	 * @default ""
	 * @description Identifier of the selected group.
	 * @since 1.0
	 */
	selectedGroup: '',
	
	/**
	 * @type Boolean
	 * @default false
	 * @Description Is the pool opened
	 * @since 1.0
	 */
	isOpen: false,
	
	/**
	 * Class constructor that calls the parent and sets the event listener for the class
	 * @param {Object} args The arguments given when to constructor is called
	 * @since 1.0
	 */
	initialize : function($super, args) {
		$super(args);
		
		this.isOpen     = false;
		
		this._listeners = $H({
        	groupingNodeSelected    : this.groupingNodeSelected.bindAsEventListener(this)	,
        	getAvailableGroupings   : this.getAvailableGroupings.bindAsEventListener(this)  ,
        	changeGrouping          : this.changeGrouping.bindAsEventListener(this)         ,
			noMoreConnected			: this.noMoreConnected.bindAsEventListener(this)		,
			hrwConnected			: this.hrwConnected.bindAsEventListener(this)			});
	},
    
	/**
	 * Function that is called when the application is displayed. 
	 * This function also initialize the variable for the class and start the events observers.
	 * @param {Object} args The arguments given during the call
	 * @since 1.0
	 * <br/>Modified for version 2.0:
	 * <ul>
	 * 	<li>Addition of the version</li>
	 * </ul>
	 */
	run : function($super, args) {
		$super(args);       
		
		document.observe('EWS:scm_groupingNodeSelected' , this._listeners.get('groupingNodeSelected')	);
		document.observe('EWS:scm_getAvailableGrouping' , this._listeners.get('getAvailableGroupings')	);
		document.observe('EWS:scm_changeGrouping'       , this._listeners.get('changeGrouping')			);
		document.observe('EWS:scm_noMoreConnected'		, this._listeners.get('noMoreConnected')		);
		document.observe('EWS:scm_HrwConnected'			, this._listeners.get('hrwConnected')			);
		
		//Log in HRW
		hrwEngine.login(this);

		this.isOpen = true;
		
		if (!this.firstRun && (!args || args.get('forceRun') !== true)) {
		    document.fire('EWS:scm_poolOpened', {
				poolType		: this.poolType,
				refreshGrouping	: true
			});

		    if(!Object.isEmpty(this.ticketsPool) && this.ticketsPool.isEmpty() === false)
		        this.ticketsPool.ticketsToUpdate(false);
			
			this.mainTitle = global.getLabel(this.poolType + '_title');
			if(hrwEngine.sessionLost) this.noMoreConnected(true);
			this.updateTitle();
			
		    return;	
		} else if(!this.firstRun && args && args.get('forceRun') === true)
			document.fire('EWS:scm_poolOpened', {
				poolType		: this.poolType,
				refreshGrouping	: true
			});
		else
			document.fire('EWS:scm_poolOpened', {
				poolType		: this.poolType,
				refreshGrouping	: false
			});
		
		this._getTicketListRunning  = false;
		
		if(hrwEngine.sessionLost) {
			this.mainTitle = global.getLabel(this.poolType + '_title');
			this.noMoreConnected(true); 
			this.subtitle = '';
			this.updateTitle();
		} else 
			//Since 2.2 Make the call in a separated method to enable overwrite it when you wants a cache
			this._getColumnsFromSAP();
	},
	
	/**
	 * Function that calls the function close on the parent class given 
	 * in parameter and removes the observers of the class.
	 * @since 1.0
	 * <br/>Modified for version 2.0:
	 * <ul>
	 * 	<li>Addition of the version</li>
	 * </ul>
	 */
	close : function($super, saveGrTree) {
		$super();
		
		saveGrTree = (saveGrTree !== false);
		
		//since 1.1 Remove the iframe to store th edownload of the file
		var iframe = this.virtualHtml.down('[id="SCM_docOpener"]');
		if(iframe) iframe.remove();
		
        if(this.isOpen === true) {
            //Indicate to the menu that the current application is closed
            document.fire('EWS:scm_poolClosed', {appliName: this.poolType, saveCurrentTree: saveGrTree});
        
            //Stop listening global events
		    document.stopObserving('EWS:scm_groupingNodeSelected'   , this._listeners.get('groupingNodeSelected')	);
		    document.stopObserving('EWS:scm_getAvailableGrouping'   , this._listeners.get('getAvailableGroupings')	);
		    document.stopObserving('EWS:scm_changeGrouping'         , this._listeners.get('changeGrouping')			);
		    document.stopObserving('EWS:scm_HrwConnected'			, this._listeners.get('hrwConnected')			);
			
		    this.isOpen = false;
		}
	},
	
	/**
	 * Call the backend to get the list of columns for this pool.
	 * @since 2.2
	 */
	_getColumnsFromSAP: function() {
		//Make an ajaxCall to get the initial parameters
		this.makeAJAXrequest($H( {
			xml : 	'<EWS>'
				+		'<SERVICE>SCM_GET_COLMNS</SERVICE>'
				+		'<PARAM>'
				+			'<I_POOL_TYPE>' + this.poolType.toUpperCase() + '</I_POOL_TYPE>'
				+		'</PARAM>'
				+	'</EWS>',
			successMethod : this.buildScreenHandler.bind(this)
		}));
	},
		
	/**
	 * @param {JSON Object} json Initial information to start the display
	 * @description Build the application screen
	 * @since 1.0
	 * <br/>Modification for 1.2 
	 * <ul>
	 * <li>Change the error message if the table is empty</li>
	 * </ul>
	 */
	buildScreenHandler: function(json) {
	    var headers = this.getHeaders(json);
	    var footers = this.getFooters(json);

		// Create the pool table and add it in the HTML of the page
		//since 1.2 Change the message if there is no result
		this.ticketsPool = new SCM_PoolTable(headers, footers, this, global.getLabel('NoTicketFound'));
		this.ticketsPool.ticketsToLoad();
		this.virtualHtml.insert(this.ticketsPool.getPoolTable());
		// Set the title
		this.mainTitle = global.getLabel(this.poolType + '_title');
		this.subtitle = '';
		this.updateTitle();
	},
	
	
	/**
	 * @param {JSON Object} List of parameters from SAP. 
 	 * @description Get the list of headers for the pool from backend
	 * @return {Hash} List of headers in the pool
	 * @since 1.0
	 * <br/>Modified for 2.1 
	 * <ul>
	 * <li>Correct the sorting on status by changing Status->StatusName</li>
	 * </ul>
	 */
	getHeaders: function(json) {
	    var headers;
		var params;
        var colName;
		var position;
		
		if(global.hasHRWEditRole())
			headers = $H({
		        Chk        	: {position: -4  , type : 'CHK'      , sortable : false , label: ''			},
		        Icon       	: {position: -3  , type : 'ICON'     , sortable : false	, label: ''			},
				//Since 2.1 Change Status to StatusName
		        StatusName  : {position: -2  , type : 'SHRT_TXT' , sortable : ''    , label: 'STATUS'	},
		        TicketId   	: {position: -1  , type : 'TICKET_ID', sortable : ''    , label: 'TICKET_ID'}
	        });
		else 
			headers = $H({
		        Icon       	: {position: -3  , type : 'ICON'     , sortable : false	, label: ''			},
				//Since 2.1 Change Status to StatusName
		        StatusName  : {position: -2  , type : 'SHRT_TXT' , sortable : ''    , label: 'STATUS'	},
		        TicketId   	: {position: -1  , type : 'TICKET_ID', sortable : ''    , label: 'TICKET_ID'}
	        });

        if(json.EWS.o_columns && json.EWS.o_columns.yglui_str_scm_columns) {
			objectToArray(json.EWS.o_columns.yglui_str_scm_columns).each(function(column) {
				//Convert something like DUE_DATE -> DueDate
	            colName = column['@column_id'].toLowerCase().capitalize().dasherize().camelize();
	            position = parseInt(column['@col_order']);
				
				if(position === 0) return;
				
	            params = {
	                position: position,
	                type    : column['@data_format'],
					label	: column['@tag']
	            };
	                
	            if (column['@sorting'] === 'X') 
	                params.sortable = '';
	            else 
	                params.sortable = false;
	            
	            headers.set(colName, params);
			}.bind(this));
		}
       
       return headers;
	},
	
	/**
	 * @param {JSON Object} json Parameters of the footers from SAP
	 * @description Get the list of mandatory footers
	 * @return {Hash} The list of footers of the table
	 * @since 1.0
	 */
	getFooters: function(json) {
	    if(global.hasHRWEditRole())
			return $H({
		        REASON   : {position: 98  , type : 'text'     , active : false    , visible : true },
		        REFRESH  : {position: 99  , type : 'button'   , active : true     , visible : true }
	        });
		else
			return $H({
		        REFRESH  : {position: 99  , type : 'button'   , active : true     , visible : true }
	        });
	},	
	
	/**
	 * @description Call the back-end service to get the list of available grouping categories
	 * @since 1.0
	 * @see scm_pool#getAvailableGroupingsHandler
	 */
	getAvailableGroupings: function() {
	    hrwEngine.callBackend(this, 'TicketPool.GetTicketTreeGrouping', $H({
	        scAgentId           : hrwEngine.scAgentId
	    }), 'getAvailableGroupingsHandler');
	},
	
    /**
	 * @param {String} action Action selected by the user
	 * @param {Array} listTickets List of tickets
	 * @param {String} comment Comment associated to the action
	 * @param {String} reason Peandong reason associated to the action (if it is a set to pending)
	 * @description Call the back-end service to indicate a user action and load the updated list of tickets
	 * @since 1.0
	 * @see scm_pool#actionPerformed
	 */
	sendAction: function(action, listTickets, comment, reason) {
	    var servName;
	    
	    listTickets.each(function(ticket) {
			var ticketId = ticket.getValue('TICKET_ID');
	        var params = $H({'scAgentId': hrwEngine.scAgentId, 'ticketId': ticketId});
	        switch(action) {
    	        case 'Take_in_processing':
    	        case 'Take_Over':  
    	            servName = 'Ticket.StartProcessingTicket';
    	            break;
    	        
    	        case 'Re_Open':  
    	            servName = 'Ticket.ReopenTicket';
    	            params.set('description', comment);
    	            break;
    	            
    	        case 'Set_to_pending':
    	            servName = 'Ticket.SwitchTicketToPending';
    	            params.set('description', comment);
    	            params.set('pendingReasonId', reason);
    	            break;
    	            
    	        case 'Set_to_waiting': 
    	            servName = 'Ticket.SendTicketToAgentPool';
    	            params.set('description', comment);
    	            break;  
	        }
    	    
	        hrwEngine.callBackend(this, servName, params, this.actionPerformed.bind(this, ticketId));
	    
	    }.bind(this));
	},
	
	/**
	* @param {String} ticketId Id of the ticket concerned by the action
	* @param {JSON Object} actionResult Result of the backend call 
	* @description Unselect the treated ticket and if all the tickets are treated => refresh the pool
	* @since 1.0
	* <br/>Modified in version 2.2:
	* <ul>
	* <li>After the last action, reset the action comment</li>
	* </ul>
	* @see scm_pool#sendAction
	*/
	actionPerformed: function(ticketId, actionResult) {
	    var ticketRow = this.ticketsPool.getTicketFromId(ticketId).index;
	    this.ticketsPool.rowSelected(ticketRow, false, true);

	    if (this.ticketsPool.getSelectedNumber() === 0) {
			//since 2.2 Reset the reason value
			this.ticketsPool.resetReasonText();
			this.ticketsPool.buttonPushed('Refresh');
		}
	},
	
	/**
	* @param {JSON Object} ticketsJson List of tickets from the backend
	* @description Get the list of tickets to add in the pool and detect if there
	* 				are modifications to send to the Ticket grouping menu.
	* @since 1.0
	* <br/>Modified in version 1.2:
	* <ul>
 	* <li>Indicate to the pool if there are groups or not as result</li>
	* </ul>
	* <br/>Modified in version 1.1:
	* <ul>
	* <li>Remove the call to the manage heartBeat</li>
	* </ul>
	*/
	getTicketListHandler : function(ticketsJson) {
		document.fire('EWS:scm_poolItemsLoaded');
		var poolTicket;

		// Add the tickets in the list
		var tickets = ticketsJson.EWS.HrwResponse.HrwResult.TicketPoolData.HrwPoolTickets;
		if (!Object.isEmpty(tickets))
			tickets = objectToArray(tickets.HrwPoolTicket);
		else 
		    tickets = $A();
	
		tickets.each( function(ticket) {
			poolTicket = SCM_Ticket.factory(this.poolType);
			poolTicket.addMainInfo(ticket);
	        
			this.ticketsPool.addEntry(poolTicket, $H({
			    outOfSLA        : poolTicket.getOutOfSLA(),
			    outOfSLAStyle   : poolTicket.getOutOfSLAStyle().classStyle
			}));
		}.bind(this));
		
		//Update the list of number of items by category and the number for the current category
		this._numByIds = this.updateNumByIds(ticketsJson.EWS.HrwResponse.HrwResult.TicketPoolData.TicketTreeNodes);	
			
		//Get the selected node if it is in the answer
		var selGroup = ticketsJson.EWS.HrwResponse.HrwResult.TicketPoolData.NodeId;
	    
	    // Build the table if it is not there
	    this.ticketsPool.totalNumTickets = new Number(this._numByIds.get(selGroup));
	        
	    this.ticketsPool.numPages        = new Number(ticketsJson.EWS.HrwResponse.HrwResult.TicketPoolData.PageCount);
	    this.ticketsPool.setSorting(ticketsJson.EWS.HrwResponse.HrwResult.TicketPoolData.Sorting);
		//since 1.2 Check if there are defined entries for the searched elements
		this.ticketsPool.hasGroups		 = (!Object.isEmpty(ticketsJson.EWS.HrwResponse.HrwResult.TicketPoolData.TicketTreeNodes)
											&& !Object.isEmpty(ticketsJson.EWS.HrwResponse.HrwResult.TicketPoolData.TicketTreeNodes.TicketTreeNode)
											&& objectToArray(ticketsJson.EWS.HrwResponse.HrwResult.TicketPoolData.TicketTreeNodes.TicketTreeNode).size() > 0);

		this.ticketsPool.buildTable();

        //Refresh the tree - do it after the build table because it could cause a clear of the table
		document.fire('EWS:scm_groupingRefreshed', {
		    TicketTreeNodes     : ticketsJson.EWS.HrwResponse.HrwResult.TicketPoolData.TicketTreeNodes    ,
		    NodeId              : ticketsJson.EWS.HrwResponse.HrwResult.TicketPoolData.NodeId             ,
		    TicketTreeGrouping  : ticketsJson.EWS.HrwResponse.HrwResult.TicketPoolData.TicketTreeGrouping ,
		    ToUpdate            : (this.selectedGroup === '' && !Object.isEmpty(selGroup))                	,
			PoolType			: this.poolType																});
		    
		this._getTicketListRunning = false;
	},
	
   /**
	* @param {JSON Object} ticketsJson List of tickets from the backend
	* @description Check if the pool is to reset before doing the usual ticket list handling.
	* @since 1.0
	*/
	getTicketListRefreshHandler: function(ticketsJson) {
	    //Refresh the list of tickets if there are new ones
		var tickets = ticketsJson.EWS.HrwResponse.HrwResult.TicketPoolData.HrwPoolTickets;
		if (!Object.isEmpty(tickets))
			this.ticketsPool.clearTable(false, true, false);
		    
		this.getTicketListHandler(ticketsJson);
	},
	
	/**
	 * @param {JSON Object} groupsJson List of available groupings from the backend
	 * @description Load the list of possible grouping categories from the backend answer.
	 * @since 1.0
	 * <br/>Modified in version 1.1:
	 * <ul>
	 * <li>Remove the call to the manage heartBeat</li>
	 * </ul>
	 */
	getAvailableGroupingsHandler: function(groupsJson) {  
	    document.fire('EWS:scm_availableGroupingLoaded', groupsJson);          
	},
	
	/**
	 * @param {JSON Object} json List of the tickets in the grouping and its tree
	 * @description Load the list of possible grouping categories from the backend answer.
	 * @since 1.0
	 * <br/>Modified in version 1.1:
	 * <ul>
	 * <li>Remove the call to the manage heartBeat</li>
	 * </ul>
	 */
	changeTicketTreeGroupingHandler: function(json) {
		//There are 2 cases: the old group is still valid => it is indicated as NodeId
		// If there is no correspondance => the nodeId is empty => refresh the pool
		if(Object.isEmpty(json.EWS.HrwResponse.HrwResult.TicketPoolData.NodeId)) {
		    //Refresh the list of tickets if there are new ones
		    this.ticketsPool.clearTable(true, true, false);
		    // Indicate that there is no selected node
		    this.groupingNodeSelected({memo: {nodeText: '', nodeId: '', refresh: false}});
		}
	    //Update the table content
	    this.getTicketListHandler(json);
	},
	
	/**
	 * @event
	 * @param {Event} event Event generated when a group is selected
	 * @description Event handler when a grouping node is selected. 
	 * @since 1.0
	 */
	groupingNodeSelected: function(event) {
		var params = getArgs(event); 

		//Update the number of elements in the group
		this.ticketsPool.totalNumTickets = this._numByIds.get(params.nodeId);
		this.selectedGroup               = params.nodeId;
		
		if(params.refresh === true)
		    this.ticketsPool.groupingNodeSelected(params.nodeId);

		//Update of the title with new Selection
		this.subtitle      = params.nodeText;
		this.updateTitle();
	},
	
	/**
	 * @event
	 * @param {Event} event Event generated when the group definition is updated
	 * @description Event handler when grouping categories are selected. 
	 * @since 1.0
	 * @see scm_pool#changeTicketTreeGroupingHandler
	 */
	changeGrouping: function(event) {
	    var newGrouping = getArgs(event);
	    hrwEngine.callBackend(this, 'TicketPool.ChangeTicketTreeGrouping', $H({
	        scAgentId           : hrwEngine.scAgentId,
	        ticketTreeGrouping  : newGrouping.newGrouping
	    }), this.changeTicketTreeGroupingHandler.bind(this));
	},
	
	/**
	 * @param {Array} listTickets List of tickets
	 * @description Get from the backend the list of reasons that could
	 *                  lead to a set to Pending. 
	 * @since 1.0
	 * @see scm_pool#getPendingReasonsHandler
	 */
	getPendingReasons: function(listTickets) {
		var companyId = listTickets[0].getValue('COMPANY_ID');
		
		hrwEngine.callBackend(this, 'Admin.CollectPendingReasons', $H({
	        scAgentId		: hrwEngine.scAgentId,
			companySkillId	: companyId
	    }), this.getPendingReasonsHandler.bind(this));
	},
	
	/**
	 * @param {JSON Object} json List of possible pending reasons.
	 * @description Set the list of possible pending reasons to the pool table. 
	 * @since 1.0
	 * <br/>Modifications for 1.1
	 * <ul>
	 * <li>Remove the call to the manage heartBeat</li>
	 * <li>Place the error message in a standard error message</li>
	 * </ul>
	 * @see scm_pool#getPendingReasons
	 */
	getPendingReasonsHandler: function(json) {
		var reasonsList = $H();
		
		objectToArray(json.EWS.HrwResponse.HrwResult.ArrayOfKeyValue.KeyValue).each(function(pendReason) {
			reasonsList.set(pendReason.Key, pendReason.Value);
		}.bind(this));

		if(reasonsList.size() === 0) {
			//since 1.1 Create the popup
        	var popup = new infoPopUp({
	            closeButton     : $H({'callBack': function() {
	                popup.close();
					delete popup;
	            }.bind(this)}) ,
	            htmlContent     : global.getLabel('No_pending_reason') + '<br/>' + global.getLabel('Check_settings') ,
	            indicatorIcon   : 'exclamation'  ,
	            width           : 500
	        });
			popup.create();
			return;
		}
		
	   this.ticketsPool.buildGetPendingReason(reasonsList);
	},
	
	/**
	 * @param {Boolean} noUpdate Indicate if the page title has to be updated
	 * @description Indicate in the title if the connection is lost or not. 
	 * @since 1.0
	 */
	noMoreConnected: function(noUpdate) {
		this.mainTitle += ' ' + global.getLabel('No_more_connection');
		if(noUpdate !== true) this.updateTitle();
	},
	
	/**
	* @description Update the title and the subtitle of the application.
	* @since 1.0
	*/
	updateTitle : function($super) {
		var subtitleId = 'application_main_subtitle';
		var appliSubtitle = this.virtualHtml.down('[id="' + subtitleId + '"]');
	
		// Update the title
		$super(this.mainTitle);
		
		// Delete the subtitle
		if (!Object.isEmpty(appliSubtitle))
			appliSubtitle.remove();
		
		// Add the new subtitle after the title
		if (!Object.isEmpty(this.subtitle)) {
			this.virtualHtml.select('.application_main_title_div')[0].insert( {
				after : '<div class="application_main_title2 SCM_Subtitle" id="' + subtitleId + '">'
							+ this.subtitle
						+ '</div>'
			});
		}
	},
    
   /**
	* @param {String} ticketId Id of the ticket that need informations
	* @description Call the back-end service to get additional info on the ticket
	* @since 1.0
	* @see scm_pool#getTicketLastActionsHandler
	*/
    getTicketLastActions : function(ticketId) {
	    hrwEngine.callBackend(this, 'Ticket.GetTicketById', $H({
	        scAgentId : hrwEngine.scAgentId,
	        ticketId  : ticketId
	    }), this.getTicketLastActionsHandler.bind(this));
	},
	
	/**
	 * @param {JSON Object} infoJson List of ticket info from the backend
	 * @description Get the list of additional informations for a ticket and
	 * 					display it on the screen.
	 * @since 1.0
	 * <br/>Modified in version 1.1:
	 * <ul>
	 * <li>Remove the call to the manage heartBeat</li>
	 * </ul>
	 */
	getTicketLastActionsHandler : function(infoJson) {
	    var ticketId    = infoJson.EWS.HrwResponse.HrwResult.HrwTicket.TicketId;
		var ticket      = this.ticketsPool.getTicketFromId(ticketId, true);
		if(ticket) {
		    ticket.ticket.addLastDocs(infoJson.EWS.HrwResponse.HrwResult.HrwTicket.HrwTicketItems);
		    ticket.ticket.addLastActions(infoJson.EWS.HrwResponse.HrwResult.HrwTicket.HrwTicketActions);
		    this.ticketsPool.buildBodyLineExtension(ticket.index);
		    this.ticketsPool.updateSize();
		}
	},
	
	/**
	* @param {JSON Object} grJson Json with the groupings and there number of items 
	* @description Get the list of entry numbers by id from the tree of categories
	* @return {Hash} The number of items by group
	* @since 1.0
	*/
    updateNumByIds: function(grJson) {
        var numIds   = $H();
        var subNumId = $H();
        var treeNodes;
        
        if(Object.isEmpty(grJson)) return this._numByIds;
        
        treeNodes = objectToArray(grJson.TicketTreeNode);
        
        treeNodes.each(function(ticketNode){
            numIds.set(ticketNode.UniqueKey, ticketNode.TicketCount);
            
            if(!Object.isEmpty(ticketNode.ChildTicketTreeNodes)) {
                subNumId = this.updateNumByIds(ticketNode.ChildTicketTreeNodes);  
                if(subNumId != null) numIds = numIds.merge(subNumId);
            }
        }.bind(this));
        return numIds; 
    },
    
    /**
	* @param {Function} callBackend Function with parameters to call the backend 
	* @description Generic method to call the list of tickets
	* @since 1.0
	*/
    callGetTicketPool: function(callBackend) {
        if(this._getTicketListRunning === false) {
            this._getTicketListRunning = true;
            callBackend();
		    return;
        }
        
		new PeriodicalExecuter( function(pe) {
			if (this._getTicketListRunning === false) {
				pe.stop();
				this._getTicketListRunning = true;
				callBackend();
			}
		}.bind(this), 0.1);  
    },
	
	/**
	 * @event
	 * @param {Event} firstConnection Contains if it is the first connection 
	 * @description Refresh the pool and the title once it is reconnected
	 * @since 1.0
	 */
	hrwConnected: function(firstConnection) {
		if(getArgs(firstConnection) === true) return;
		
		//Update the title
		this.mainTitle = global.getLabel(this.poolType + '_title');
		this.updateTitle();
		
		//Update the pool content
		if(!Object.isEmpty(this.ticketsPool)) this.ticketsPool.ticketsToUpdate();
	}
});
/**
 * @class
 * @description Display the list of tickets for the current agent
 * @augment scm_pool
 * @author jonathanj & nicolasl
 * @version 2.0
 * <br/>Changes for version 2.0
 * <ul>
 * <li>Addition of the version</li>
 * <li>Remove the class name</li>
 * <li>Add a table with the companies that are already in the cache of pending reasons</li>
 * </ul>
 */
var scm_myPool = Class.create(scm_pool, /** @lends scm_myPool.prototype */{
	
	/**
	 * List of the companies which have a loaded pending reason with the id of the lazy load generated
	 * @type Hash
	 * @since 2.0
	 */
	_pendingCompanies: null,
	
	/**
	 * Class constructor
	 * @param {JSON Object} args The arguments given when to constructor is called
	 * @since 1.0
	 * <br/>Changes for version 2.0
	 * <ul>
	 * <li>Addition of the version</li>
	 * <li>Remove the class name</li>
	 * <li>Initialize the list of companies for the pending reasons</li>
	 * </ul>
	 */
	initialize : function($super, args) {
		$super(args);
		this.poolType   		= 'MyPool';
		//since 2.0 Maintain the list of loaded companies - This list has not absolutely to be up to date
		this._pendingCompanies	= $H();
		//since 2.0 Initialize the version number
		this.version = '2.0';
	},
	
	/**
	 * Call the main run method and get the list of pending reasons in a lazy way
	 * @param {JSON Object} args List of the application start parameters
	 * @since 2.0
	 */
	run: function($super, args) {
		$super(args);
		
		//Get the pending reasons for the employee companies
		if(hrwEngine.companies !== null) {
			hrwEngine.companies.each(function(company) {
				if(!Object.isEmpty(this._pendingCompanies.get(company.key))) return;
				
				this._pendingCompanies.set(company.key, 
					hrwEngine.addInCallQueue(this, 'Admin.CollectPendingReasons', $H({
				        scAgentId		: hrwEngine.scAgentId,
						CompanySkillId	: company.key
				    }), this.pendingReasonsLoaded.bind(this, company.key))
				);
			}, this);
		}
		else {
			new PeriodicalExecuter(function(pe) {
  				if(hrwEngine.companies === null) return;
    			pe.stop();
				
				hrwEngine.companies.each(function(company) {
					if(!Object.isEmpty(this._pendingCompanies.get(company.key))) return;
					
					this._pendingCompanies.set(company.key, 
						hrwEngine.addInCallQueue(this, 'Admin.CollectPendingReasons', $H({
					        scAgentId		: hrwEngine.scAgentId,
							CompanySkillId	: company.key
					    }), this.pendingReasonsLoaded.bind(this, company.key))
					);
				}, this);
			}.bind(this), 2);

		}
		
	},
	
	/**
	 * Close the application and the list of lazy loading items 
	 * @since 2.0
	 */
	close: function($super) {
		$super();
		//Remove the lazy calls not yet done
		this._pendingCompanies.each(function(company) {
			if(hrwEngine.removeFromCallQueue(company.value))
				this._pendingCompanies.unset(company.key);
		}, this);
	},
	
	/**
	 * Manage the lazy load of the pending reasons. There is nothing to do with 
	 * the result, it is only to place it in the cache. But to avoid calling several times
	 * the lazy load of pending reason for the same company, update a list with loaded companies
	 * @param {Object} companyId Id of the loaded company
	 * @param {Object} loadedPendReasons List of the pending reasons
	 * @since 2.0
	 */
	pendingReasonsLoaded: function(companyId, loadedPendReasons) {},
	
	/**
	* @description Get the list of footers
	* @return {Hash} Footers
	* @since 1.0
	*/
	getFooters: function($super, json) {
	    var footers = $super(json);
		
		if(global.hasHRWEditRole()) {
			footers.set('WAIT'		, {type: 'button', active  : false,visible : true , position: 1});	
			footers.set('PEND'		, {type: 'button', active  : false,visible : true , position: 2});	
	        footers.set('PROCESS'	, {type: 'button', active  : false,visible : true , position: 3});
			footers.set('TAKE_OVER'	, {type: 'button', active  : false,visible : false, position: 4});
			footers.set('RE_OPEN'	, {type: 'button', active  : false,visible : false, position: 5});
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
	 * @see scm_pool#getTicketListHandler
	 * @see scm_pool#getTicketListRefreshHandler
	 */
	getTicketList : function(paging, numPageItems, sorting, forRefresh, force) {
	    var handlerMeth = 'getTicketListHandler';
	    if(forRefresh === true) handlerMeth = 'getTicketListRefreshHandler';
	    
	    var funcName = 'TicketPool.GetMyPool';
	    if(force === true) funcName = 'TicketPool.ForceGetMyPool';

        this.callGetTicketPool(hrwEngine.callBackend.bind(this, this, funcName, $H( {
			scAgentId : hrwEngine.scAgentId,
			nodeId    : this.selectedGroup  ,
			pageIndex : paging              ,
			sorting   : sorting
		}), handlerMeth));
	}
});
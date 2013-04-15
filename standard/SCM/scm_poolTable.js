/**
 * @class
 * @description Definition of a table to show the pools
 * @author jonathanj & nicolasl
 * @version 2.2
 * <br/>Modification in 2.2
 * <ul>
 * <li>When putting tickets to pending, set the default comment in the popup correctly</li>
 * <li>Make sure that there is no scollbar in the pool when there is less tickets that the number to show on the screen</li>
 * <li>Add a method to reset the comment field</li>
 * </ul>
 * <br/>Modification for 2.1
 * <ul>
 * <li>Use the common way to encode/decode fields for the communication to the backend</li>
 * <li>Correct the sorting by status</li>
 * <li>Use the standard method to encode attributes before display</li>
 * <li>Use the standard method to remove tags</li>
 * </ul>
 * <br/>Modification for version 2.0
 * <ul>
 * <li>Allow to have items that are hyperlinks</li>
 * <li>Addition of the service area</li>
 * </ul>
 */
var SCM_PoolTable = Class.create( /** @lends SCM_PoolTable.prototype */ {
	/**
	 * @type Boolean
	 * Indicate if there are groups that could be displayed in the pool
	 * @since 1.2
	 */
	hasGroups: false,
	
	/**
	 * @type Integer
	 * @default 10
	 * @description Number of entries that are displayed on the screen.
	 * @since 1.0
	 */
	pagingNumber: 10, 
    
    /**
	 * @type Integer
	 * @description Number of pages that are for the table.
	 * @since 1.0
	 */
    numPages: null,
    
    /**
	 * @type Integer
	 * @default 0
	 * @description Total number of tickets.
	 * @since 1.0
	 */
    totalNumTickets: 0,
    
    /**
	 * @type Integer
	 * @default 0
	 * @description Last computed empty div size.
	 * @since 1.0
	 */
    _emptyDivSize: 0,
    
	/**
	 * @type Hash
	 * @description List of conditions that the check boxes have to follow to be disable.
	 * @since 1.0
	 */
	chkCond : null,
	
	/**
	 * @type scm_pool
	 * @description Interface with the backend.
	 * @since 1.0
	 */
	_poolInterface : null,

	/**
	 * @type Integer
	 * @default 0
	 * @description Number of entries that are not yet displayed.
	 * @since 1.0
	 */
	_nonDisplayedNum : 0,

	/**
	 * @type Integer
	 * @default 0
	 * @description Index of the first displayed line.
	 * @since 1.0
	 */
	_firstDispLine : 0,

	/**
	 * @type Integer
	 * @default 0
	 * @description Index of the last displayed line.
	 * @since 1.0
	 */
	_lastDispLine : 0,

	/**
	 * @type Boolean
	 * @default false
	 * @description Indicate if the table is build.
	 * @since 1.0
	 */
	_tableIsBuild : false,

	/**
	 * @type Hash
	 * @description List of headers to have in the table with there labels and width. <br/>
	 * Each entry is identified by the <b>header id</b> and has the fields:
	 * 	<ul>
	 * 		<li><b>originalName</b>(<i>String</i>): Name of the column from SAP</li>
	 * 		<li><b>label</b>(<i>String</i>): The label of the column</li>
	 * 		<li><b>type</b>(<i>String</i>): Is the column for 'CHK'(internal), 'ICON'(internal), 'TICKET_ID'(internal), 'SHRT_TXT'(small text), 'LONG_TXT'(long text), 'DATE_TIME'(date+time), 'DATE'(only date), 'TIME'(only time)</li>
	 * 		<li><b>width</b>(<i>Integer</i>): the width allocated for the column</li>
	 * 		<li><b>sortable</b>(<i>Boolean</i>): Indicate if the column is sortable</li>
	 * 		<li><b>sort</b>(<i>String</i>): Default sorting on the column</li>
	 * 		<li><b>grouped</b>(<i>Boolean</i>): not used</li>
	 *	</ul>
	 * @since 1.0
	 */
	_headers : null,

	/**
	 * @type Array
	 * @description List of content entries where each line is an object with:
	 * <ul>
	 * 	<li><b>values</b>(<i>SCM_Ticket</i>): Ticket object with all its parameters</li>
	 * 	<li><b>options</b>(<i>JSON Object</i>): Some options of the ticket</li>
	 * 	<li><b>HTMLElement</b>(<i>Element</i>): HTML div that contains the content line in the table</li>
	 * 	<li><b>extended</b>(<i>Boolean</i>): Are the details for detailed view loaded(last actions and documents)</li>
	 * 	<li><b>addedLines</b>(<i>Integer</i>): Number of lines added for the last actions and documents</li>
	 * 	<li><b>HTMLAddedLines</b>(<i>Element</i>): HTML div with the last document and actions</li>
	 * 	<li><b>selected</b>(<i>Boolean</i>): Is the content line checked</li>
	 * </ul>
	 * @since 1.0
	 */
	_content : null,

	/**
	 * @type Hash
	 * @description List of the items in the footer identified with a footer key and with parameters:
	 * <ul>
	 * 	<li><b>key</b>(<i>String</i>): Name of the button from SAP</li>
	 * 	<li><b>label</b>(<i>String</i>): Label to display on the button</li>
	 * 	<li><b>type</b>(<i>String</i>): Is it a 'button' or a 'text'</li>
	 * 	<li><b>newStatus</b>(<i>String</i>): Status to join if the user push on the button</li>
	 * 	<li><b>active</b>(<i>Boolean</i>): Is the button able to be clicked?</li>
	 * 	<li><b>visible</b>(<i>Boolean</i>): Is the button visible?</li>
	 * 	<li><b>enable</b>(<i>Function</i>): Function that allow to enable the button</li>
	 * 	<li><b>disable</b>(<i>Function</i>): Function that allow to disable the button</li>
	 * 	<li><b>reset</b>(<i>Function</i>): Function to reset the content of an input field</li>
	 * 	<li><b>value</b>(<i>Element</i>): The input field</li>
	 * </ul>
	 * @since 1.0
	 */
	_footerItems : null,
    
    /**
	 * @type megaButtonDisplayer
	 * @description Displayer for the footer buttons
	 * @since 1.0
	 */
    _footerButtons: null,
    
    /**
	 * @type Integer
	 * @description Current position of the scroll bar
	 * @default 0
	 * @since 1.0
	 */
    _scroll: 0,
    
    /**
	 * @type Integer
	 * @description Last loaded page
	 * @default 0
	 * @since 1.0
	 */
    _paging: 0,
    
    /**
	 * @type String
	 * @description Message to display for empty table
	 * @since 1.0
	 */
    emptyMessage: null,
    
	/**
	 * @type Element
	 * @description HTML of the table body.
	 * @since 1.0
	 */
	_HTMLBody : null,

	/**
	 * @type Element
	 * @description HTML of the table.
	 * @since 1.0
	 */
	_HTMLTable : null,

	/**
	 * @type Element
	 * @description HTML of the table header.
	 * @since 1.0
	 */
	_HTMLHeader : null,

	/**
	 * @type Integer
	 * @description Indicate the row in px of a table line.
	 * @since 1.0
	 */
	TOTAL_WIDTH : null,

	/**
	 * @type Integer
	 * @description Indicate the height in px of a single line.
	 * @since 1.0
	 */
	LINE_HEIGHT : null,
	    
	/**
	 * @type Hash
	 * @description List of names of the fields to display  
	 *              (Name in the coming params => Name in the front-end).
	 * @since 1.0
	 * <br/>Modified for 2.1 
	 * <ul>
	 * <li>Correct the sorting on status by changing Status->StatusName</li>
	 * </ul>
	 */
	COLUMNS : $H( {
		Chk 			    : 'CHK'         , 		//Checkbox to select the line
		StatusId		    : 'STATUS'      ,		//Status of the ticket
		Icon 			    : 'ICON'        , 		//The status Icon represents the ticket status
		//since 2.1 Replace the Status by the StatusName to solve the sorting problem
		StatusName		    : 'STATUS_TXT'  , 		//Static text representing the status
		TicketId 		    : 'TICKET_ID'   , 		//Ticket unique ID
		DueDate             : 'DUE_DATE'    ,       //Due date of the ticket
		ServiceName         : 'SERV_NAME'   , 		//Name of the service
		Description 	    : 'DESCR'       , 		//Description of the ticket
		CreationDateTime    : 'CREATE_DATE' , 		//Creation date of the ticket
		EmployeeId 		    : 'EMPLOYEE_ID' , 	    //Id of the employee that created the ticket
		EmployeeLastName    : 'EMPLOYEE'    ,       //Name of the person for which the ticket has been created (Also called affected employee / Agent / Contact).
		CurrentAgentName    : 'ASSIGNED_TO' ,       //Name of the person assigned to the ticket
		SecEmployeeLastName : 'REQUESTOR'   ,       //Name of the second person for which the ticket has been created (Also called requestor / Agent / Contact).
		SecEmployeeId       : 'REQUESTOR_ID',       //Id of the requestor
		LastActionDateTime  : 'LAST_ACT'    , 		//Last action date performed on the ticket
		PriorityName        : 'PRIORITY'    ,       //Ticket priority currently assigned.
		CompanyName         : 'COMPANY'     ,       //Company/Customer assigned to the ticket
		ServiceGroupName    : 'SERV_GROUP'  ,       //Service group
		//since 2.0 Addition of the service area
		ServiceAreaName		: 'SERV_AREA'			//Service area
	}),

    /**
	 * @type Hash
	 * @description List of names of the footers to display.
	 *              (Name in the coming params => Name in the front-end and the status that will have the ticket if the user execute the button action on it).    
	 * @since 1.0          
	 */
	FOOTERS : $H( {
		PROCESS			: {name: 'Take_in_processing'	, newStatus: '2'	}, 	//Take in processing
		PEND 			: {name: 'Set_to_pending'		, newStatus: '6'	}, 	//Set to pending
		WAIT 			: {name: 'Set_to_waiting'		, newStatus: '4'	}, 	//Set to waiting
		REASON 			: {name: 'Scm_Reason'			, newStatus: '-1'	}, 	//Reason of the action
		REFRESH 		: {name: 'Refresh'				, newStatus: '-1'	}, 	//Refresh the pool
		TAKE_OVER		: {name: 'Take_Over'			, newStatus: '2'	}, 	//Take a ticket over
		RE_OPEN         : {name: 'Re_Open'				, newStatus: '1'	}	//Re open a closed ticket
	}),
    
	/**
	 * @param {Hash} headers List of headers to use in the table identified by an id and with the parameters:
	 * 	<ul>
	 * 		<li><b>label</b>(<i>String</i>): The label of the column</li>
	 * 		<li><b>type</b>(<i>String</i>): Is the column for 'CHK'(internal), 'ICON'(internal), 'TICKET_ID'(internal), 'SHRT_TXT'(small text), 'LONG_TXT'(long text), 'DATE_TIME'(date+time), 'DATE'(only date), 'TIME'(only time)</li>
	 * 		<li><b>sortable</b>(<i>String</i>): The default column and the direction or false</li>
	 *	</ul> 
	 * @param {Hash} footerItems List of buttons/input fields identified by an id and with the parameters
	 * <ul>
	 * 	<li><b>position</b>(<i>Integer</i>): Position of the button in the footer</li>
	 * 	<li><b>type</b>(<i>String</i>): Is it a 'button' or a 'text'</li>
	 * 	<li><b>active</b>(<i>Boolean</i>): Is the button able to be clicked?</li>
	 * 	<li><b>visible</b>(<i>Boolean</i>): Is the button visible?</li>
	 * </ul>
	 * @param {scm_pool} poolInterface Interface with the back end
	 * @param {String} emptyMessage (optional) Message to show in the table if there is no entry
	 * @description Initialize the headers and the footers for the table. From these data, it is possible to fill
	 * the attributes {@link SCM_PoolTable#_headers} and {@link SCM_PoolTable#_footerItems}. 
	 * @since 1.0
	 */
	initialize : function(headers, footerItems, poolInterface, emptyMessage) {
		// Build global attributes
		this.chkCond 		= $H();
		this._content 		= $A();
		this._headers 		= $H();
		this._footerItems 	= $H();
		this._firstDispLine = 0;
		this._lastDispLine 	= 0;
		this.TOTAL_WIDTH 	= 700;
		this.LINE_HEIGHT 	= 19;
		this._poolInterface = poolInterface;
		this._tableIsBuild 	= false;
		this.numPages       = 1;
		var sortable;
		var sort;
		var label;
		var itemKey;
		
		if(navigator.appVersion.match('MSIE 6.0')) this.LINE_HEIGHT = 20;

		// Compute the lengths for columns
		var cellWidths = this.computeWidths(headers);

		// Assign the headers to the table
		headers = headers.sortBy(function(header) {
		    return header[1].position;
		});
		headers.each( function(header) {
		    itemKey = this.COLUMNS.get(header.key);
		    
		    //Check if the column is sortable / sorted
		    if(header.value.sortable === false) {
		        sortable = false;
		        sort     = '';
		    } else {
		        sortable = true;
		        sort     = header.value.sortable;
		    }

		    //Get the header label
		    if(itemKey === 'CHK' || itemKey === 'ICON') label = '';
		    else label = global.getLabel(header.value.label);
		    
		    // Add the header entry
			this._headers.set(itemKey, {
			    originalName    : header.key,
				label 		    : label                             ,  //Label to display in the header
				type 		    : header.value.type                 ,  //Is it a date, a short texr, a long text, ...
				width 		    : cellWidths.get(header.value.type) ,  //Width of the column
				sortable 	    : sortable                          ,  //Is it permitted to sort on this column?
				sort 		    : sort                              ,  //By default there is no sorting on the column
				grouped 	    : false			                    });//By default, the header is not part of the grouping
					
		}.bind(this));
			
		footerItems = footerItems.sortBy(function(footer) {
		    return (-1) * footer[1].position;
		});	
		// Assign the buttons to the grid
		footerItems.each( function(footerItem) {
		    itemKey = this.FOOTERS.get(footerItem.key);
		    
			this._footerItems.set(itemKey.name, {
				key			: itemKey.name					,  //Original key of the footer
				label 		: global.getLabel(itemKey.name) ,  //Label to set on the button or in the input field
				type 		: footerItem.value.type    		,  //Is it a button or an input field
				newStatus	: itemKey.newStatus				,  //Status after the pûsh on the button
				active 		: footerItem.value.active  		,  //Is the item active
				visible 	: footerItem.value.visible 		,  //Is the item to display
				enable 		: null                     		,  //Method to enable the item
				disable 	: null                     		,  //Method to displable the item
				reset 		: null                     		,  //Method to reset the content of an input field
				value 		: null                     		});//Input field
		}.bind(this));

        (Object.isEmpty(emptyMessage))? this.emptyMessage = global.getLabel('No_ticket_found'): this.emptyMessage = emptyMessage;
			
	},

	/**
	 * @param {Hash} headers List of headers to use in the table identified by an id and with the parameters:
	 * 	<ul>
	 * 		<li><b>label</b>(<i>String</i>): The label of the column</li>
	 * 		<li><b>type</b>(<i>String</i>): Is the column for 'CHK'(internal), 'ICON'(internal), 'TICKET_ID'(internal), 'SHRT_TXT'(small text), 'LONG_TXT'(long text), 'DATE_TIME'(date+time), 'DATE'(only date), 'TIME'(only time)</li>
	 * 		<li><b>sortable</b>(<i>String</i>): The default column and the direction or false</li>
	 *	</ul> 
	 * @description Compute the width of the different columns in the table
	 * @returns {JSON Object} The different kind of columns with there widths
	 * @since 1.0
	 */
	computeWidths : function(headers) {
		var numCols 	= headers.size();
		var totalWidth 	= this.TOTAL_WIDTH;

		var numLong 	= 0;
		var numShort 	= 0;

		var shortWidth 	= 0;
		var longWidth 	= 0;

		headers.each( function(header) {
		    if(header[1].grouped === true) return;
		    
			switch (header[1].type) {
			case 'CHK':
				totalWidth -= 30;
				break;

			case 'TICKET_ID':
				totalWidth -= 90;
				break;

			case 'ICON':
				totalWidth -= 30;
				break;
				
			case 'DATE_TIME':
			case 'LONG_TXT':
				numLong++;
				break;

			case 'DATE':
			case 'TIME':
			case 'SHRT_TXT':
				numShort++;
				break;
			}
		}.bind(this));

		shortWidth = Math.floor(totalWidth / (numShort + (1.5 * numLong)));
		longWidth = 1.5 * shortWidth;

		return $H( {
			'CHK'       : '30',
			'ICON'      : '30',
			'TICKET_ID' : '90',
			'SHRT_TXT'  : shortWidth.toString(),
			'LONG_TXT'  : longWidth.toString(),
			'DATE_TIME' : longWidth.toString(),
			'DATE'      : shortWidth.toString(),
			'TIME'      : shortWidth.toString()
		});
	},
	
	/**
	 * @param {Boolean} onlyContent Check only if there is a content or if the table exists
	 * @description Check if the table contains elements or is built
	 * @since 1.0
	 */
	isEmpty: function(onlyContent) {
	    if(Object.isEmpty(onlyContent)) onlyContent = false;
	    if(onlyContent)
	        return (this._content.size() === 0);
	    else
	        return Object.isEmpty(this._HTMLHeader);
	},
	/**
	 * @param {Boolean} forScroll Indicate if the calculation is to determine the position of the scroll bar
	 * @description Compute the total heigth for the list of items. So we could
	 * 				use this heigth to add or not the scrollbar.
	 * @since 1.0
	 */
	computeHeight : function(forScroll) {
	    var currHeight          = 0;
	    var height              = 0;
	    var visibleHeight       = 0;
	    var intoAccount         = this.totalNumTickets - 1;
	    var firstVisible        = Math.max(0, this._lastDispLine - this.pagingNumber + 1);
	    var lastVisible         = this._lastDispLine;
	    
	    if(forScroll)
	        intoAccount = firstVisible - 1;
        
        if (intoAccount < 0) return {totalHeight: 0, visibleHeight: 0}; 
        
		for ( var i = intoAccount; i >= 0; i--) {
			if (this._content[i] && this._content[i].extended)
				currHeight = this.LINE_HEIGHT * (2 + this._content[i].addedLines);
			else
				currHeight = this.LINE_HEIGHT * 2;
	        
	        height += currHeight;
	        
            if(i >= firstVisible && i <= lastVisible) visibleHeight += currHeight;		
		}
        if(visibleHeight === 0) visibleHeight = this.LINE_HEIGHT;
        if(height === 0)        height        = this.LINE_HEIGHT;
        
		return {totalHeight: height, visibleHeight: visibleHeight};
	},

	/**
	 * @description Update the height and the width of the table body 
	 * 				to ensure the presence or absence of the scrollbar
	 * @since 1.0
	 * <br/>Modified in 2.2
	 * <ul>
	 * <li>Make sure there is no unwanted scrollbar by setting the overflow-y style manually</li>
	 * </ul>
	 */
	updateSize : function() {
		var height       = this.computeHeight(false);
		var outerWidth   = this.TOTAL_WIDTH;
		var innerWidth   = this.TOTAL_WIDTH;
		
		//since 2.2 Update the overflow property to make sure it appears when necessary
		// If there are more entries that the paging number, make sure
		// there is a scroll bar
		if (this.totalNumTickets > this.pagingNumber) {
			outerWidth += 20;
			this._HTMLBody.up().setStyle({'overflowY': 'auto'});
			this._HTMLBody.setStyle({'overflowY': 'auto'});
		} else {
			this._HTMLBody.up().setStyle({'overflowY': 'hidden'});
			this._HTMLBody.setStyle({'overflowY': 'hidden'});
		}

		if(navigator.appVersion.match('MSIE 6.0')) {
			 this._HTMLBody.up().setStyle( {
				'height' : height.visibleHeight.toString() + 'px',
				'width'  : outerWidth.toString() + 'px'
			});
		} else {
	        this._HTMLBody.up().setStyle( {
				'maxHeight' : height.visibleHeight.toString() + 'px',
				'width'     : outerWidth.toString() + 'px'
			});
		}
		this._HTMLBody.setStyle( {
			'height'    : height.totalHeight.toString() + 'px',
			'width'     : innerWidth.toString() + 'px'
		});
	},
    
	/**
	 * @param {Boolean} clearHeader Is the header also to clean?
	 * @param {Boolean} clearContent Is the list of items to clean?
	 * @param {Boolean} clearPaging Is the paging to clean? 
	 *                  Should be <i>true</i> if the clean is made before the call to the backend and <i>false</i> 
	 *                  if the clean is made when we already have the list of tickets. 
	 * @description Clear the table body and optionaly the header and the list of tickets
	 *		After this call, it is possible to call again the method
	 *		{@link SCM_PoolTable#buildInitialTable}.
	 * @since 1.0
	 */
	clearTable : function(clearHeader, clearContent, clearPaging) {
		if (this._HTMLBody) {
			this._scroll = 0;
			this._HTMLBody.up().scrollTop = 0;
			this._HTMLBody.update();
		}
		
		this._firstDispLine     = 0;
		this._lastDispLine      = 0;
		this._nonDisplayedNum   = 0;
		this._tableIsBuild      = false;
		this.chkCond            = $H();
		
		if (clearHeader && this._HTMLHeader)
			this._HTMLHeader.update();
		
		if (clearPaging)
			this._paging  = 0;
			
		if (clearContent) {
			this._content = $A();
			this.numPages = 1;
	    }
	},

	/**
	 * @description Get the table element to add it somewhere. Once the table is added, it is 
	 * 				cleared to allow building it with data.
	 * @returns {Element} The HTML table
	 * @since 1.0
	 * @see SCM_PoolTable#_HTMLTable
	 */
	getPoolTable : function() {
		if (Object.isEmpty(this._HTMLTable))
			this._HTMLTable = new Element('div', {'class' : 'SCM_PoolTable'});
		
		return this._HTMLTable;
	},

	/**
	 * @description Build the HTML code for the table. If there is already
	 * 				a table content, replace its content with first entries.<br/>
	 *				The table could only be build if it was cleaned.
	 * @since 1.0
	 * @see SCM_PoolTable#clearTable
	 */
	buildTable : function() {
	    var HTMLtable = this.getPoolTable();
	    if (this._tableIsBuild === true) return HTMLtable;
			
	    //Create the table header global node
	    if (Object.isEmpty(this._HTMLHeader))
			// There is a +2 in the width because there is a border ni
			// the bottom table content
			this._HTMLHeader = new Element('div', {
				'class' : 'SCM_PoolTable_Header',
				'style' : 'width: ' + (this.TOTAL_WIDTH + 2) + 'px;'
			});
			
        // Create the table body global node			
	    if (Object.isEmpty(this._HTMLBody)) {
			var HTMLBody = new Element('div', {
				'class' : 'SCM_PoolTable_Body SCM_PoolTable_Body_outer'
			}).insert('<div class="SCM_PoolTable_Body"/>');
			HTMLBody.observe('scroll', function(event) {
				var elem = Event.element(event);
				if(elem.scrollTop === this._scroll)
				    return; 
				else if (elem.scrollTop > this._scroll) 
					this.navigDown();
				else if (elem.scrollTop < this._scroll)
					this.navigUp();  
   				    	
			    this._scroll    = this.computeHeight(true).totalHeight;
			    if(this._lastDispLine != this._content.size() - 1)
			        elem.scrollTop  = this._scroll;
				
			}.bindAsEventListener(this));
			
			this._HTMLBody = HTMLBody.down();
		}
		
		//If there is nothing in the table content => set it
		if (Object.isEmpty(HTMLtable.innerHTML)) {
			HTMLtable.insert(this._HTMLHeader);
			HTMLtable.insert(this._HTMLBody.up());
			HTMLtable.insert(this.buildFooter(this._footerItems));
		}
	    
	    //Build the table header content
	    if (Object.isEmpty(this._HTMLHeader.innerHTML))
	        this.buildHeader(this._HTMLHeader);
        
        // Build the table body content
	    this.fillInitTable(this._HTMLBody);
	    
	    this._tableIsBuild = true;
	},
    
    /**
     * @param {Element} tableBody HTML elment that contains the content.
     * @description Fill in the table with initial paging entries.
     * @since 1.0
     * <br/>Modified for 1.2:
     * <ul>
     * <li>Change the message to display if there are groups for the search </li>
     * </ul>
     */
    fillInitTable: function(tableBody) {
        var bodyline; 
        var message;
		
        for ( var i = this.pagingNumber; i > 0; i--) {
			bodyLine = this.buildBodyLine(this._lastDispLine, true);
			if (bodyLine) {
				this._lastDispLine++;
				tableBody.insert(bodyLine);
			}
		}
		// The last line is not added
		this._lastDispLine--;
		
        //Update the size to add eventual scroll bar
		this.updateSize();
		
		//Set a div to indicate that there is no entry if needed
		var emptyDiv = this._poolInterface.virtualHtml.down('div#SCM_PoolTableEmpty');
		if(!Object.isEmpty(emptyDiv)) emptyDiv.remove();
		//since 1.2 If there are groups but nothing in the table, indicate to select a group
		if(this._lastDispLine === -1) {
			if(this.hasGroups) 
				message = global.getLabel('No_ticket_found_select_left');
			else 
				message = this.emptyMessage;
			tableBody.insert('<div id="SCM_PoolTableEmpty" class="application_main_soft_text">' + message + '</div><div class="application_clear_line"/>');
		}
    },
    
	/**
	 * @param {Element} headerElem HTML element with the header of the table
	 * @description Build the HTML code for the table header
	 * @since 1.0
	 */
	buildHeader : function(headerElem) {
		var htmlHeaderCell	= null;
		var additionalStyle = '';
		var width;
		var title;

		this._headers.each( function(header) {
			if (header[1].grouped === true) return;
			
		    // If the column is sortable, remove 12px for the sort icon
			if (header[1].sortable)
				width = Number(header[1].width) - 12;
			else
				width = Number(header[1].width);

			title = header[1].label;
			value = title.truncate(Math.round(Number(header[1].width) / 8));

			htmlHeaderCell = new Element('span', {
				'class' : 'SCM_PoolTable_HeaderCell',
				'style' : 'width:' + width.toString() + 'px;',
				'id'    : 'header_' + header[0],
				'title' : title
			});
			htmlHeaderCell.innerHTML = value;

			if (header[1].sortable) {
				htmlHeaderCell.observe('click', function() {
					this.columnSorted(header[0]);
				}.bindAsEventListener(this));
				htmlHeaderCell.addClassName('SCM_PoolTable_HeaderSortCell');
			
			    if(header[1].sort === 'ASC')
			        htmlHeaderCell.addClassName('table_sortColAsc');
			    else if(header[1].sort === 'DESC')
			        htmlHeaderCell.addClassName('table_sortColDesc');
			}
			
			headerElem.insert(htmlHeaderCell);
		}.bind(this));
	},

	/**
	 * @param {Hash} values List of values to place in the columns
	 * @param {Hash} options List of options that could be set for the line
	 * @description Add the new line in the content list
	 * @since 1.0
	 */
	addEntry : function(values, options) {
		this._content.push( {
			values 			: values, 		//Object with tickets parameters
			options 		: options, 		//Options of the ticket
			HTMLElement 	: null, 		//HTML Element for the line
			extended 		: false, 		//Is the line extended
			addedLines 		: 0, 			//Number of lines added (if extended)
			HTMLAddedLines 	: null, 		//HTML Element with extension
			selected 		: false	});		// Is the row selected

		this._nonDisplayedNum++;
	},

	/**
	 * @param {Integer} counter Index in the cache of the lines to display
	 * @param {Boolean} forceGet Force to have the HTML even if it is already build
	 * @description Build the HTML content of one table line. If it is already loaded, use it again
	 * @returns {Element} The builded content
	 * @since 1.0
	 */
	buildBodyLine : function(counter, forceGet) {
		var content = this._content[counter];
		if (Object.isEmpty(content)) return false;

		if (Object.isEmpty(content.HTMLElement)) {
			// It is the main div to contains the all row
			content.HTMLElement = new Element('div', {
				'class' : 'SCM_PoolTable_BodyRow',
				'style' : 'width: ' + this.TOTAL_WIDTH + 'px;',
				'id' 	: 'row_' + counter
			});

			// Add the CSS classes for even or odd lines
			if (counter % 2 == 0)
				content.HTMLElement.addClassName('SCM_PoolTable_OddRow');
			else
				content.HTMLElement.addClassName('SCM_PoolTable_EvenRow');

			// Build the first line of the cell with the different
			// columns
			content.HTMLElement.insert(this.buildBodyLineInfo(content.options, counter));

			// Build the second line of the cell with the description
			content.HTMLElement.insert(this.buildBodyLineDescr(content.options, counter));

			// Replace the element updated
			this._content[counter] = content;

			// Update the number of entries not yet displayed from the
			// cache
			this._nonDisplayedNum--;
			this.checkNumLoaded();
			
			return content.HTMLElement;
		}
		else if(forceGet === true)
		    return content.HTMLElement;
		else
		    return null;
	},

	/**
	 * @param {Hash} options List of options to use for the line drawing (Out of SLA settings)
	 * @param {Integer} counter Index of the entry in {@link SCM_PoolTable#_content}
	 * @description Build the HTML content of the first part of a table row.
	 * @returns {Element} The HTML div with the asked column content.
	 * @since 1.0
	 * <br/>Modified in version 1.1:
	 * <ul>
	 * <li>Create the user actions via the factory</li>
	 * </ul>
	 */
	buildBodyLineInfo : function(options, counter) {
		//It is the container for the first part of the row
		var htmlLine = new Element('div', {
			'class' : 'SCM_PoolTable_BodyRow_Items',
			'id' : 'row_' + counter + '_1'
		});
		// It is only one cell
		var htmlCell = null;
		// It is the content of the cell if it is needed
		var htmlCellCnt = null
		var value       = '';
		var title       = '';
		var className   = '';
		
		this._headers.each( function(header) {
			// Create the cell with the correct width
            htmlCell = new Element('span', {
				'class' : 'SCM_PoolTable_BodyRowCell',
				'style' : 'width: ' + header[1].width + 'px;',
				'id'    : 'cell_' + counter + '_' + header[0]
			});

			// For the ticket id, make the cell a link
			if (header[0] === 'TICKET_ID') {
				htmlCellCnt = new Element('span', {
					'class' : 'application_action_link'
				});
				htmlCellCnt.innerHTML = this.getValue(counter, header[0]);
				htmlCellCnt.observe('click', function(event) {
					this.ticketDetailsAsked(Event.element(event).innerHTML);
				}.bindAsEventListener(this));
				htmlCell.insert(htmlCellCnt);

			} else {
				switch (header[1].type) {
				    //Display a check box with the ticket id as id
				    case 'CHK':
					    htmlCellCnt = new Element('input', {
						    'type' : 'checkbox',
						    'id'   : 'SCM_chkBox_' + this.getValue(counter, 'TICKET_ID')
					    });

					    htmlCellCnt.observe('click', function(event) {
						    this.rowSelected(counter, Event.element(event).checked);
					    }.bindAsEventListener(this));
					    htmlCell.insert(htmlCellCnt);
					    break;

				    // Display the icon that match the status
				    case 'ICON':
					    value = this.getValue(counter, header[0]);
					    value = '<div class="' + value + ' SCM_PoolTable_div" title="'+this.getValue(counter, 'STATUS_TXT')+'"> </div>';
					    htmlCell.observe('click', function(event) {
						    this.rowExtended(counter, this.getValue(counter, 'TICKET_ID'));
					    }.bindAsEventListener(this));
					    htmlCell.innerHTML = value;
					    break;

				    // Add the Test with or without the outOfSLA style
				    default:
				        if(header[1].grouped === true) return;

					    title = this.getValue(counter, header[0]);
					    if (Object.isEmpty(title)) {
						    value = '/';
						    title = '';
					    } else 
						    value = this.prepareForDisplay(title, Math.round(Number(header[1].width) / 7), (header[0] === 'EMPLOYEE' || header[0] === 'REQUESTOR'));
						
						if (header[0] == 'STATUS_TXT' || header[0] == 'DUE_DATE') {
							htmlCellCnt = new Element('span', {
								'title': title,
								'class': options.get('outOfSLAStyle')
							}).update(value);
							htmlCell.insert(htmlCellCnt);
						}
						else {
							htmlCellCnt = new Element('span', {
								'title': title
							}).update(value);
							htmlCell.insert(htmlCellCnt);
						}
						
						//For the fields without particularity, the click open ticket larger summary
					    if ((header[0] !== 'EMPLOYEE' && header[0] !== 'REQUESTOR') || title === '')
						    htmlCell.observe('click',function(event) {
							    this.rowExtended(counter, this.getValue(counter, 'TICKET_ID'));
						    }.bind(this));
    						
					    //For the fields with action => open the navigation popup
					    else if(header[0] === 'EMPLOYEE'){
					        //since 1.1 Add the user action via the factory
                            var userAction = ScmUserAction.factory(ScmUserAction.DISPLAY_AS_APPLI, this._poolInterface, htmlCellCnt.identify(), $A([this._poolInterface.appName]), htmlCell);
                            userAction.addActionOnField(
								this.getValue(counter, 'EMPLOYEE_ID')	, 
								this.getValue(counter, 'EMPLOYEE')		, 
								this.getValue(counter, 'COMPANY_ID')		,
								2, true);
					    }
						else if (header[0] !== 'REQUESTOR'){
					        //Add the user action
                            var userAction = ScmUserAction.factory(ScmUserAction.DISPLAY_AS_APPLI, this._poolInterface, htmlCellCnt.identify(), $A([this._poolInterface.appName]), htmlCell);
                            userAction.addActionOnField(
								this.getValue(counter, 'REQUESTOR_ID')	, 
								this.getValue(counter, 'REQUESTOR')		, 
								this.getValue(counter, 'COMPANY_ID')	,
								2, true);
					    }
					}
				}
				htmlLine.insert(htmlCell);
			}.bind(this));

		return htmlLine;
	},

	/**
	 * @param {Hash} options List of options to use for the line drawing (Out of SLA settings)
	 * @param {Integer} counter Index of the entry in {@link SCM_PoolTable#_content}
	 * @description Build the HTML content of the second part of a table row.
	 * @returns {Element} The HTML div with the ticket short description and the service.
	 * @since 1.0
	 * <br/>Modified for 2.1
	 * <ul>
	 * <li>Encode the title attribute with the standard method for attributes</li>
	 * </ul>
	 */
	buildBodyLineDescr : function(options, counter) {
		var width = 0;
		var htmlLine = new Element('div', {
			'class' : 'SCM_PoolTable_BodyRow_Items',
			'id' : 'row_' + counter + '_2'
		});
		var chkWidth 	= this._headers.get('CHK')?Number(this._headers.get('CHK').width):0;
		var width 		= chkWidth;
		var value;
		var title;
		
		// Add the event handler when clicking on the row
		htmlLine.observe('click', function(event) {
			this.rowExtended(counter, this.getValue(counter, 'TICKET_ID'));
		}.bind(this));

		// Insert a space before the begining of the text of the checkbox width
		htmlLine.insert('<span class="SCM_PoolTable_BodyRowCell" style="width: ' + width + 'px;" id="cell_' + counter + '_SPACE">&nbsp;</span>');
		
		// Insert the first cell of the line
		width = + Number(this._headers.get('ICON').width) + Number(this._headers.get('STATUS_TXT').width);
		title = this.getValue(counter, 'SERV_NAME');
		if (Object.isEmpty(title)) {
			value = '/';
			title = '';
		} else 
			value = this.prepareForDisplay(title, Math.round(width / 7));	
		htmlLine.insert('<span class="SCM_PoolTable_BodyRowCell" style="width: ' + width + 'px;" id="cell_' + counter + '_SERV_NAME"><span title="' + title + '">' + value + '</span></span>');
		
		// Insert the second cell of the line
		width = this.TOTAL_WIDTH - width - chkWidth;

		title = this.getValue(counter, 'DESCR');
		if (Object.isEmpty(title)) {
			value = '/';
			title = '';
		} else {
			value = this.prepareForDisplay(title, Math.round(width / 6));
			//since 2.1 Use the standard method to add slashes
			title = HrwRequest.displayAsAttribute(title);
		}
		htmlLine.insert('<span class="SCM_PoolTable_BodyRowCell" style="width: ' + width + 'px;" id="cell_' + counter + '_DESCR"><span title="' + title + '">' + value + '</span></span>');

		return htmlLine;
	},

	/**
	 * @param {Integer} counter Index of the entry in {@link SCM_PoolTable#_content}
	 * @description Build the HTML content of the third part of the table row and add it in the table line.
	 * @returns {Element} The list of 4 last documents/items
	 * @since 1.0
	 * <br/>Modification for version 2.0
	 * <ul>
	 * <li>Add the possibility to add hyperlinks as items</li>
	 * </ul>
	 */
	buildBodyLineExtension : function(counter) {
		var lineTemplate = new Template('<div class="SCM_PoolTable_BodyRow_Items">'
		                            +       '<div title="#{actionDate} ~ #{actionTitle} ~ #{actionAgent} ~ #{actionDescr}" class="SCM_PoolTable_lastAction">'
									+			'<div class="#{actionIcon}"> </div>'
									+			'<span class="SCM_ActionDate #{actionContStyle}">[#{actionDate}]</span>'
									+			'<span class="SCM_ActionTitle #{actionContStyle}">#{actionTitleTrunc}</span>'
									+			'<span class="#{actionContStyle}">'+global.getLabel('by')+'</span>'
									+			'<span class="SCM_ActionAgent #{actionContStyle}">#{actionAgentTrunc}</span>'
									+		'</div>'
		                            +       '<div title="#{lastDoc}" class="SCM_PoolTable_lastDoc application_action_link" mimetype="#{mimeType}" extension="#{extension}" itemid="#{itemId}"><div class="#{docTypeIcon}"> </div>#{lastDocCont}</div>'
		                            +   '</div>');
									
		//since 2.0 For the links, use another template
		var linkTemplate = new Template('<div class="SCM_PoolTable_BodyRow_Items">'
		                            +       '<div title="#{actionDate} ~ #{actionTitle} ~ #{actionAgent} ~ #{actionDescr}" class="SCM_PoolTable_lastAction">'
									+			'<div class="#{actionIcon}"> </div>'
									+			'<span class="SCM_ActionDate #{actionContStyle}">[#{actionDate}]</span>'
									+			'<span class="SCM_ActionTitle #{actionContStyle}">#{actionTitleTrunc}</span>'
									+			'<span class="#{actionContStyle}">'+global.getLabel('by')+'</span>'
									+			'<span class="SCM_ActionAgent #{actionContStyle}">#{actionAgentTrunc}</span>'
									+		'</div>'
		                            +       '<a title="#{lastDoc}" href="#{lastDoc}" target="_blank" class="SCM_PoolTable_lastDoc application_action_link" mimetype="#{mimeType}" extension="#{extension}" itemid="#{itemId}"><div class="#{docTypeIcon}"> </div>#{lastDocCont}</a>'
		                            +   '</div>');
																		
		var lastDoc;
		var lastAction;
		var content     = this._content[counter];
		var count       = 0;
		var slaStatus;
		//since 2.0 Store the template to use for one line
		var templateToUse;

		// If there is no additional lines => build them
		if (Object.isEmpty(content.HTMLAddedLines)) {
			content.HTMLAddedLines = new Element('div');

			for (var i = 0; i < 4; i++) {
			    lastDoc     = this.getValue(counter, 'LAST_DOC', i);
			    lastAction  = this.getValue(counter, 'LAST_ACTION', i);
			    
				var agentWidth = Math.max(13, 32 - lastAction.title.length);
				//since 2.0 Use the links template if it is a link
				if(lastDoc.mimeType === 'hyperlink') templateToUse = linkTemplate;
				else templateToUse = lineTemplate;
				
			    if(lastDoc.id != '' || lastAction.title != '') {
			    	//since 2.0 There are several templates that could be used
			        content.HTMLAddedLines.insert(templateToUse.evaluate({
			            actionDate      : lastAction.date                    	,//YYYY-MM-DD HH:mm:SS TT => 21 chars max
						actionTitle		: lastAction.title						,
						actionTitleTrunc: lastAction.title.truncate(19)			,
						actionAgent		: lastAction.agent						,
						actionAgentTrunc: lastAction.agent.truncate(agentWidth)	,
						actionDescr		: lastAction.descr						,
						actionIcon		: lastAction.icon						,
						actionContStyle	: lastAction.style						,
			            lastDoc         : lastDoc.name                          , 
			            lastDocCont     : lastDoc.name.truncate(30)             ,
			            docTypeIcon     : lastDoc.iconType                      ,
			            itemId          : lastDoc.id							,
						extension		: lastDoc.extension						,
						mimeType		: lastDoc.mimeType
			        }));
			        content.addedLines ++;
			    
			        var childs = content.HTMLAddedLines.childElements()[count].childElements();
                    childs[0].observe('click', function(event) {
				        this.rowExtended(counter, this.getValue(counter, 'TICKET_ID'));
			        }.bindAsEventListener(this));
			    
			        if(!Object.isEmpty(childs[1].readAttribute('itemid')))
			            childs[1].observe('click', function(event) {
							var element 	= event.element();
				            var ticketId    = this.getValue(counter, 'TICKET_ID');
				            var ticketNumId = element.readAttribute('itemid');
				            this.openDocument(ticketId, ticketNumId, element.readAttribute('title'), element.readAttribute('extension'), element.readAttribute('mimetype'));
			        }.bindAsEventListener(this));
			        
			        count ++;
			    }
			}
		}
		content.extended = true;
		content.HTMLElement.insert(content.HTMLAddedLines);

		this._content[counter] = content;

		return content.HTMLAddedLines
	},
    
	/**
	 * @param {String} ticketId Id of the concerned ticket
	 * @param {String} ticketNumId Id of the item in the ticket
	 * @param {String} title The title of the document
	 * @param {String} docExtension Extension of the document
	 * @param {String} mimeType Mime type of the document to open
	 * @description Download the document
	 * @since 1.0
	 */
    openDocument: function(ticketId, ticketNumId, title, docExtension, mimeType) {
		//Build the request to send
		var request = 	'<EWS>'
            		+		'<SERVICE>HRW_ATTGET</SERVICE>'
					+		'<PARAM>'
            		+			'<I_AGENTID>' + hrwEngine.scAgentId + '</I_AGENTID>'
            		+			'<I_TICKETID>' + ticketId + '</I_TICKETID>'
					+			'<I_ITEMID>' + ticketNumId + '</I_ITEMID>'	
					+			'<I_FILENAME>' + title + '</I_FILENAME>'
					+			'<I_MIMETYPE>' + mimeType + '</I_MIMETYPE>'
					+		'</PARAM>'
					+	'</EWS>';
		
		
		if(Object.isEmpty(this._poolInterface.virtualHtml.down('[id="SCM_docOpener"]')))
			this._poolInterface.virtualHtml.insert('<iframe id="SCM_docOpener" style="display:none;"></iframe>');
		
		//Build the URL to call
		var url = this._poolInterface.url;  
        while(('url' in url.toQueryParams())){url = url.toQueryParams().url;} 
        url = (Object.isEmpty(Object.values(((url).toQueryParams()))[0]))?url+'?xml_in=':url+'&xml_in='; 
		
		//Place the document in the created iframe
		this._poolInterface.virtualHtml.down('[id="SCM_docOpener"]').src = url + request;
    },
    
	/**
	 * @param {Integer} counter Index of the entry in {@link SCM_PoolTable#_content}
	 * @description Remove the additional informations from a line.
	 * @since 1.0
	 */
	removeTicketAddedLines : function(counter) {
		var content = this._content[counter];

		content.HTMLAddedLines.remove();
		content.extended = false;

		this._content[counter] = content;
	},

	/**
	 * @param {Hash} footerItems List of the items in the footer like {@link SCM_PoolTable#_footerItems} identified with a footer key and with parameters:
	 * <ul>
	 * 	<li><b>key</b>(<i>String</i>): Name of the button from SAP</li>
	 * 	<li><b>label</b>(<i>String</i>): Label to display on the button</li>
	 * 	<li><b>type</b>(<i>String</i>): Is it a 'button' or a 'text'</li>
	 * 	<li><b>newStatus</b>(<i>String</i>): Status to join if the user push on the button</li>
	 * 	<li><b>active</b>(<i>Boolean</i>): Is the button able to be clicked?</li>
	 * 	<li><b>visible</b>(<i>Boolean</i>): Is the button visible?</li>
	 * 	<li><b>enable</b>(<i>Function</i>): Function that allow to enable the button</li>
	 * 	<li><b>disable</b>(<i>Function</i>): Function that allow to disable the button</li>
	 * 	<li><b>reset</b>(<i>Function</i>): Function to reset the content of an input field</li>
	 * 	<li><b>value</b>(<i>Element</i>): The input field</li>
	 * </ul>
	 * @description Build the HTML content of the table footer with form items.
	 * @returns {Element} The footer with the the list of buttons
	 * @since 1.0
	 */
	buildFooter : function(footerItems) {
		var htmlButtons = new Element('div', {
			'class' : 'SCM_PoolTable_footer'
		});
		var json = {elements: $A()};
		var footerElem;

		footerItems.each( function(footerItem) {
			if (footerItem[1].visible === false)
				return;

			switch (footerItem[1].type) {
			// Add a button in the form
				case 'button':
					json.elements.push({
						label 			: footerItem[1].label							,
						handlerContext 	: null											,
						handler 		: this.buttonPushed.bind(this, footerItem[0])	,
						className 		: 'SCM_PoolTable_footerButton'					,
						type 			: 'button'										,
						idButton 		: 'SCM_foot_' + footerItem[0]					,
						standardButton 	: true
					});
					
					// Set the access methods
					footerItem[1].disable = /** @ignore */function(id) {
						this._footerButtons.disable('SCM_foot_' + footerItem[0]);
					}.bind(this);
					
					footerItem[1].enable = /** @ignore */function(id) {
						this._footerButtons.enable('SCM_foot_' + footerItem[0]);
					}.bind(this);
					
					footerItem[1].reset = /** @ignore */function(id) {
					};

					// Update the footer and the HTML
					this._footerItems.set(footerItem[0], footerItem[1]);
					break;

				case 'text':
					// Create the value
					footerItem[1].input = new Element('input', {
						'type' 	: 'text',
						'id' 	: 'SCM_foot_' + footerItem[0],
						'class' : 'SCM_PoolTable_footerText application_autocompleter_box',
						'value' : footerItem[1].label,
						'colId'	: footerItem[0]
					});
					
					//If there is the default value => keep it and 
					//if there is nothing => set the default label 
					footerItem[1].input.observe('click', function(event) {
						var elem = Event.element(event);
						if(elem.value === this._footerItems.get(elem.readAttribute('colId')).label)
							elem.value = '';	
					}.bindAsEventListener(this));
					footerItem[1].input.observe('blur', function(event) {
						var elem = Event.element(event);
						if(elem.value === '')
							elem.value = this._footerItems.get(elem.readAttribute('colId')).label;	
					}.bindAsEventListener(this));
					
					// Set the access methods
					footerItem[1].disable = /** @ignore */function(id) {
						if (!Object.isEmpty(footerItem[1].input))
							footerItem[1].input.writeAttribute('disabled', true);
						else
							this._poolInterface.virtualHTML.down('div#SCM_foot_' + id).writeAttribute('disabled', true);
					}.bind(this);
					
					footerItem[1].enable = /** @ignore */function(id) {
						if (!Object.isEmpty(footerItem[1].input))
							footerItem[1].input.removeAttribute('disabled');
						else
							this._poolInterface.virtualHTML.down('div#SCM_foot_' + id).removeAttribute('disabled');
					}.bind(this);
					
					footerItem[1].reset = /** @ignore */function(id) {
						if (!Object.isEmpty(footerItem[1].input))
							footerItem[1].input.value = footerItem[1].label;
						else
							this._poolInterface.virtualHTML.down('div#SCM_foot_' + id).value = footerItem[1].label;
					}.bind(this);

					// Update the footer and the HTML
					this._footerItems.set(footerItem[0], footerItem[1]);
					break;
				}
			}.bind(this));
            
            //Create the mega button displayer
            this._footerButtons = new megaButtonDisplayer(json);
            
            //Create the buttons display
            footerItems.each( function(footerItem) {
                if (footerItem[1].visible === false) return;
				
                // Add a element in the form
			    switch (footerItem[1].type) {
				    case 'button':
                        htmlButtons.insert(this._footerButtons.getButton('SCM_foot_' + footerItem[0]));
                        break;
                    case 'text':
                        htmlButtons.insert(footerItem[1].input);
                        break;
                }
                
                //Disable if needed
                if (footerItem[1].active === false)
				    footerItem[1].disable(footerItem[0]);
    				
            }.bind(this));
		return htmlButtons;
	},
	/**
	 * @param {Integer} index index of the element to remove in {@link SCM_PoolTable#_content}
	 * @description Remove a line of the table from the display.
	 * @since 1.0
	 */
	removeBodyLine : function(index) {
		var content = this._content[index];
		content.HTMLElement.remove();
	},

	/**
	 * @param {String} ticketId Identifier of teh ticket to search
	 * @param {Boolean} onlyVisible Limit to the field in the display table.
	 * @description Get the index of the ticket with a given row and its ticket value. The search
	 * 			could be limited to visible rows
	 * @returns {JSON Object} The ticket content and its index or false if not founded
	 * @since 1.0
	 */
	getTicketFromId : function(ticketId, onlyVisible) {
		var startIndex;
		var endIndex;

		if (onlyVisible) {
			startIndex = this._firstDispLine;
			endIndex = this._lastDispLine;
		} else {
			startIndex = 0;
			endIndex = this._content.size() - 1;
		}

		for ( var i = endIndex; i >= startIndex; i--) {
			if (this.getValue(i, 'TICKET_ID') === ticketId)
				return {ticket: this._content[i].values, index: i};
		}
		return false;
	},

	/**
	 * @description Update the table display to navigate to tickets up.
	 * @since 1.0
	 */
	navigUp : function() {
		if (this._firstDispLine === 0)
			return;

		this._firstDispLine--;
		this._lastDispLine--;
        
        if(this._content[this._firstDispLine].addedLines != this._content[this._lastDispLine + 1].addedLines)
		    this.updateSize(); 
	},

	/**
	 * @description Update the table display to navigate to tickets down.
	 * @since 1.0
	 */
	navigDown : function() {
	    var childs;
		if (this._content.size() - 1 < this._lastDispLine)
			return;

		this._lastDispLine++;
		if (Object.isEmpty(this._content[this._lastDispLine])) {
			this._lastDispLine--;
			return;
		}

        var newLine = this.buildBodyLine(this._lastDispLine, false);
        if(newLine != null) {
            childs = this._HTMLBody.childElements();
		    childs[childs.size() - 1].insert({after: newLine});
		    // Check if the new line is editable or not
		    this.applyCheckboxCond(this._lastDispLine);
		    
		    //Place the fakeline at the end
		    var fakeLine = this._poolInterface.virtualHtml.down('[id="SCM_table_fakeLine"]');
		    if (fakeLine) {
			    fakeLine.remove();
			    this._HTMLBody.insert(fakeLine);
			}
        }
        
		this._firstDispLine++;

		if(newLine != null || 
		   this._content[this._firstDispLine - 1].addedLines != this._content[this._lastDispLine].addedLines)
		    this.updateSize(); 
	},

	/**
	 * @description Check if maximum the half of the paging number
	 *			is display. If it is the case, fire an event.
	 * @since 1.0
	 */
	checkNumLoaded : function() {
		var maxNonDisp = Math.round(2 * (this.pagingNumber/3));
		if (maxNonDisp === this._nonDisplayedNum)
			this.ticketsToLoad(false);
	},
	
    /**
     * @param {Array} grpCols List of the columns that are grouped
	 * @description Update the list of invisible columns.
	 * @since 1.0
	 */
    changeGroupedHeader: function(grpCols) {
        this._headers.each(function(header) {
            if(grpCols.indexOf(header[0]) >= 0)
                header[1].grouped = true;
            else
                header[1].grouped = false;
        }.bind(this));
        
        var cellWidths = this.computeWidths(this._headers);

		// Assign the headers to the table
		this._headers.each( function(header) {
		    header[1].width = cellWidths.get(header[1].type);
		}.bind(this));
    },
    
	/**
	 * Reset the text in the reason text box
	 * @since 2.2
	 */
	resetReasonText: function() {
		var reasonFootItem = this._footerItems.get('Scm_Reason');
		reasonFootItem.reset('Scm_Reason');
	},
	
	/**
	 * @param {Array} footers List of the buttons/text fields to update with there new active status
	 * @description Update the active status of buttons to a given value.
	 * @since 1.0
	 */
	changeActiveFooters : function(footers) {
		var footItem = null;

		footers.each( function(footer) {
			footItem = this._footerItems.get(footer.name);
			if(Object.isEmpty(footItem)) return;
			if(footItem.visible === false) return;
			if(footItem.active === footer.active) return;
			
			footItem.active = footer.active;
			if (footer.active === false)
				footItem.disable(footer.name);
			else
				footItem.enable(footer.name);

			this._footerItems.set(footer.name, footItem);
		}.bind(this));
	},
	
	/**
	 * @param {Integer} index Index of the checked line
	 * @param {Boolean} checked Is the element checked or unchecked?
	 * @description Rules to indicate which footer elements are to enable/disable
	 * @since 1.0
	 * <br/>Modified for 1.2
	 * <ul>
	 * <li>If there is no defined transition, nothing to change in the bouttons list</li>
	 * </ul>
	 */
	updateFooter: function(index, checked) {
		var transitions	= $A();
		var footers		= $A();
		var status;
		
		// If there are no selected items => allow only the refresh button
		if(this.getSelectedNumber() === 0) {
			footers.push({name: 'Refresh'			, active: true  });
			footers.push({name: 'Take_in_processing', active: false });
			footers.push({name: 'Set_to_pending'	, active: false });
			footers.push({name: 'Set_to_waiting'	, active: false });
			footers.push({name: 'Scm_Reason'		, active: false });
			footers.push({name: 'Take_Over'			, active: false });
			footers.push({name: 'Re_Open'			, active: false });
			
		// If there is one selected item, and if it is a first checked
		// => update the buttons depending on the status
		} else if(checked === true) {
			status 		= this.getValue(index, 'STATUS');
			transitions = hrwEngine.statusTranslations.get(status);
			//since 1.2 If there is no defined transition, there is nothing to do
			if(Object.isEmpty(transitions)) return;
			
			//If there is no possible futur transition => nothing possible 
			if(transitions.size() === 0) {
				footers.push({name: 'Refresh'			, active: false });
				footers.push({name: 'Take_in_processing', active: false });
				footers.push({name: 'Set_to_pending'	, active: false });
				footers.push({name: 'Set_to_waiting'	, active: false });
				footers.push({name: 'Scm_Reason'		, active: false });
				footers.push({name: 'Take_Over'			, active: false });
				footers.push({name: 'Re_Open'			, active: false });
			 
			//If there are possible transitions, determine them
			} else {
				//Update the visibility of Take over and Take in processing depending on the selected agent
				var takeInProc 	= this._footerItems.get('Take_in_processing');
				var takeOver	= this._footerItems.get('Take_Over');
				var label		= null;
				var enable		= null;

				if(takeInProc && takeOver) {
					if((hrwEngine.scAgentId === this.getValue(index, 'ASSIGNED_TO_ID') || this.getValue(index, 'ASSIGNED_TO_ID') === '' || this.getValue(index, 'ASSIGNED_TO_ID') === '-1') && takeInProc.visible === false && takeOver.visible === true)
						label 	= global.getLabel('Take_in_processing');
					else if(hrwEngine.scAgentId !== this.getValue(index, 'ASSIGNED_TO_ID') && this.getValue(index, 'ASSIGNED_TO_ID') !== '' && this.getValue(index, 'ASSIGNED_TO_ID') !== '-1' && takeInProc.visible === true && takeOver.visible === false)
						label = global.getLabel('Take_Over');
				}

				//If there is a new label to display, set it
				if(label !== null) {
					this._footerItems.set('Take_Over', takeInProc);
					this._footerItems.set('Take_in_processing', takeOver);
					
					if(!Object.isEmpty(this._footerButtons.getButtonsArray().get('SCM_foot_Take_Over')))
						this._footerButtons.updateLabel('SCM_foot_Take_Over', label);
					else if(!Object.isEmpty(this._footerButtons.getButtonsArray().get('SCM_foot_Take_in_processing')))
						this._footerButtons.updateLabel('SCM_foot_Take_in_processing', label);
				}
				
				this._footerItems.each(function(footerItem) {
					var setActive = true;
					
					//This 2 mandatory items are not treated here because there is no linked action
					if(footerItem.value.newStatus === '-1') return;
					//If the footer is not visible => nothing to do
					if(footerItem.value.visible === false) return;
				
					//For some ticket items, there is to force to keep the button inactive 
					switch(footerItem.key) {
						case 'Re_Open':
							if(	hrwEngine.companies.get(this.getValue(index, 'COMPANY_ID')).EnableReOpen === false
								&& this._poolInterface.poolType !== 'OPMPool' 
								&& this._poolInterface.poolType !== 'TeamPool')
								setActive = false;
							break;
						case 'Take_in_processing':
							if(hrwEngine.scAgentId !== this.getValue(index, 'ASSIGNED_TO_ID') && this.getValue(index, 'ASSIGNED_TO_ID') !== '' && this.getValue(index, 'ASSIGNED_TO_ID') !== '-1')
								setActive = false;
							break;
						case 'Take_Over':
							if(	hrwEngine.scAgentId === this.getValue(index, 'ASSIGNED_TO_ID') 
								|| 	(hrwEngine.companies.get(this.getValue(index, 'COMPANY_ID')).EnableTakeOver === false 
									&& this._poolInterface.poolType !== 'OPMPool' 
									&& this._poolInterface.poolType !== 'TeamPool'))
								setActive = false;
							break;
					}
					
					if(setActive === true) 
						setActive = (transitions.indexOf(footerItem.value.newStatus) >= 0);
						
					//Check if there is a defined transition between the current state and the
					//action related to the button
					footers.push({
						name 	: footerItem.key, 
						active 	: setActive
					});
					
				}.bind(this));
				
				//Set that it is possible to set a reason but there is no more refresh
				footers.push({name : 'Scm_Reason'	, active : true});
		    	footers.push({name : 'Refresh'		, active : false});
			}
		}
		
		//Set the modifications
		this.changeActiveFooters(footers);
	},
	
	/**
	 * @param {String} conditionName Name of the condition to apply
	 * @param {String} value Value to set in the condition
	 * @description Update if each ticket could be selected from some informations 
	 * @returns {Boolean} Indicate if there is a change really made.
	 * @since 1.0
	 */
	addCheckboxCond : function(conditionName, value) {
		var condition = this.chkCond.get(conditionName);
		if (!Object.isEmpty(condition)) {
			if (condition.active === true)
				return false;
			if (condition.value === value)
				return false;

			condition.active = true;
			condition.value = value;
			this.chkCond.set(conditionName, condition);
			return true;
		}
		switch (conditionName) {		
			case 'notInProcByOtherAgent':
				condition = {
					colId       : 'STATUS',
					operation   : '!=',
					value       : '9',
					active      : true,
					deleteFunc  : /** @ignore */function() {
						return false; //If activeted, it is always valid
					}.bind(this)
				};
				this.chkCond.set(conditionName, condition);
				break;
					
			case 'TicketOwner':
				condition = {
					colId       : 'ASSIGNED_TO_ID',
					operation   : '==',
					value       : value,
					active      : true,
					deleteFunc  : /** @ignore */function() {
						return (this.getSelectedNumber() === 0); //If no more selected ticket
					}.bind(this)
				};
				this.chkCond.set(conditionName, condition);
				break;
				
			case 'TicketNotOwner':
				condition = {
					colId       : 'ASSIGNED_TO_ID',
					operation   : '!=',
					value       : value,
					active      : true,
					deleteFunc  : /** @ignore */function() {
						return (this.getSelectedNumber() === 0); //If no more selected ticket
					}.bind(this)
				};
				this.chkCond.set(conditionName, condition);
				break;	
				
			default:
				condition = {
					colId       : conditionName,
					operation   : '==',
					value       : value,
					active      : true,
					deleteFunc  : /** @ignore */function() {
						return (this.getSelectedNumber() === 0); //If no more selected ticket
					}.bind(this)
				};
				this.chkCond.set(conditionName, condition);
				break;
		}
		return true;
	},

	/**
	 * @description Loop on the conditions to check if there are still valid 
	 * @returns {Boolean} Is there really something removed
	 * @since 1.0
	 */
	removeCheckboxCond : function() {
		var removed = false;
		this.chkCond.each( function(condition) {
			// If the condition is not active => nothing to do
				if (condition[1].active === false)
					return;

				// If the condition is to delete => disable it
				if (condition[1].deleteFunc() === true) {
					condition[1].active = false;
					condition[1].value = null;
					this.chkCond.set(condition[0], condition[1]);
					removed = true;
				}
			}.bind(this));

		return removed;
	},
	/**
	 * @param {Integer} index (optional) Make the check on the ticket with the given index
	 * @description Loop on the tickets to update there check state 
	 * @since 1.0
	 */
	applyCheckboxCond : function(index) {
		var content;
		var editable;
		var lastIndex  = this._content.size() - 1;
		var firstIndex = 0;
		if (!Object.isEmpty(index)) {
			lastIndex = index;
			firstIndex = index;
		}
		
		for ( var i = lastIndex; i >= firstIndex; i--) {
			var content = this._content[i];
			if (Object.isEmpty(content.HTMLElement)) continue;
			
			editable = this.checkCheckboxCond(i);
			if (editable != content.options.editable) {
				var chkBox = this._poolInterface.virtualHtml.down('input#SCM_chkBox_' + this.getValue(i, 'TICKET_ID'));
				if(!Object.isEmpty(chkBox)) {
					if (editable === true)
						chkBox.removeAttribute('disabled');
					else
						chkBox.writeAttribute('disabled', true);
				
				}
				this._content[i].options.editable = editable;
			}
		}
	},
	
	/**
	 * @param {Integer} index Index of the content in {@link SCM_PoolTable#_content}
	 * @description Check if a checkbox follow all the active conditions 
	 * @returns {Boolean} Is the condition followed
	 * @since 1.0
	 */
	checkCheckboxCond : function(index) {
		var valid = true;

		this.chkCond.each( function(condition) {
			// If the condition is not active => nothing to do
				if (condition[1].active === false) return;

				// If the condition is not followed => return false
				if ((condition[1].operation 	=== '==' && this.getValue(index, condition[1].colId) !== condition[1].value)
					|| (condition[1].operation 	=== '!=' && this.getValue(index, condition[1].colId) === condition[1].value))
					valid = false;
				
			}.bind(this));

		return valid;
	},

	/**
	 * @description Get the number of selected items
	 * @returns {Integer} The number of selected items
	 * @since 1.0
	 */
	getSelectedNumber: function() {
		var selNumber = 0;
		this._content.each( function(content) {
			if (content.selected === true)
				selNumber ++;
		});
		
		return selNumber;
	},
	
	/**
	 * @param {Integer} index Index of the item in the content
	 * @param {String} columnId Identifier of the column to get
	 * @param {Integer} itemNum (OPTIONAL) Number of the element
	 * @description Simple method that get the value of a ticket parameters.
	 * @returns {String} The ticket parameter value
	 * @since 1.0
	 */
	getValue: function(index, columnId, itemNum) {
		return this._content[index].values.getValue(columnId, itemNum);
	},
	
	/**
	 * @param {Boolean} force Force the refresh to reset the cache
	 * @description Load a list of tickets.
	 * @since 1.0
	 */
	ticketsToLoad: function(force) {
	    var sorting = '';

	    //Check if there are new tables to get
	    if(this._paging >= this.numPages) return;
	    
	    //Get the sorting
	    this._headers.each(function(header) {
	        if (header[1].sort != '')
	            sorting = header[1].originalName + ' ' + header[1].sort;
	    }.bind(this));

		this._poolInterface.getTicketList(this._paging.toString(), this.pagingNumber.toString(), sorting, false, force);
		
		//Update the paging
	    this._paging ++;
	},
	
	/**
	 * @param {Boolean} force Force the refresh to reset the cache
	 * @description Check if the list of tickets is still valid. The difference with {@link SCM_PoolTable#ticketsToLoad} is that
	 *                  we always look for the page '0' and there is a refresh only if there are tickets back.
	 * @since 1.0
	 */
	ticketsToUpdate: function(force) {
	    var sorting = '';
	    
	    //Get the sorting
	    this._headers.each(function(header) {
	        if (header[1].sort != '')
	            sorting = header[1].originalName + ' ' + header[1].sort;
	    }.bind(this));

		this._poolInterface.getTicketList('0', this.pagingNumber.toString(), sorting, true, force);

		//Update the paging
	    this._paging = 1;
	},
	
	/**
	 * @param {String} footerId Id of the clicked button
	 * @description Do the action when the user click on a footer button.
	 * @since 1.0
	 * <br/>Modifications for 2.1:
	 * <ul>
	 * <li>Use the standard encoding before sending to HRW</li>
	 * </ul>
	 */
	buttonPushed: function(footerId) {	 
		switch (footerId) {
		case 'Take_in_processing':
		case 'Set_to_waiting':
		case 'Take_Over':	    
		case 'Re_Open':	    
		    this.updateFooter(0, false);
		    //since 2.1 Use the standard encoding
		    this._poolInterface.sendAction(footerId, this.getSelectedTickets(), HrwRequest.encode(this.getReason()));
			break;
			
		case 'Set_to_pending':
			this._poolInterface.getPendingReasons(this.getSelectedTickets());
			break;
		
		case 'Refresh':
			this.ticketsToUpdate(true);
			document.fire('EWS:scm_refreshPendList');
		}
	},
	
	/**
	 * @param {Hash} reasonsList List of possible reasons for a set to pending
	 * @description Build the popup to ask the reason for a set to pending.
	 * @since 1.0
	 * <br/>Modifications for 2.2:
	 * <ul>
	 * <li>Bug fix for IE: Set the default comment in the text area</li>
	 * </ul>
	 * <br/>Modifications for 2.1:
	 * <ul>
	 * <li>Use the standard encoding before sending to HRW</li>
	 * </ul>
	 */
	buildGetPendingReason: function(reasonsList) {
	    var popup = new Element('div', {'id': 'SCM_popupPending'});
	    var newLine;
	    var json;
	    var reasonAutoc;
	    var counter = 0;
	    
	    //Create the popup
        var ourPopup = new infoPopUp({
            closeButton     : $H({'callBack': function() {ourPopup.close();}}),
            htmlContent     : popup         ,
            indicatorIcon   : 'confirmation',                    
            width           : 800
        }); 
        
	    var table = new Element('div', {'class': 'SCM_PoolTable_Body SCM_PopupTable', 'style': 'width:' + this.TOTAL_WIDTH + 'px;'});
	    popup.insert(table);
	    
	    //Build the list of selected tickets
	    this._content.each(function (content, key) {
	        if(content.selected === false || Object.isEmpty(content.HTMLElement))
	            return;
	        if((counter % 2) === 0)
	            newLine = new Element('div', {'class': 'SCM_PoolTable_BodyRow SCM_PoolTable_OddRow'});
	        else
	            newLine = new Element('div', {'class': 'SCM_PoolTable_BodyRow SCM_PoolTable_EvenRow'});
	            
	        newLine.innerHTML = content.HTMLElement.innerHTML;
	        newLine.down('input').remove();
	        if(newLine.childElements()[2]) newLine.childElements()[2].remove();
	        table.insert(newLine);
	        
	        counter ++;
	    }.bind(this));
	    
        // Add the autocompleter
        popup.insert('<div class="application_clear_line"></div><div><span class="application_main_text SCM_popupText">' + global.getLabel('Pending_reason') + ' : </span><div id="SCM_popupPendingReason"/></div>');
        
	    //Build the comment field
	    var div = new Element('div');
	    //since 2.2 The value is not taken into account in IE
	    var comment = new Element('textarea', {'id': 'SCM_popupFootComment'});
	    comment.value = this.getReason();
	    if (comment.value === '') comment.value = this._footerItems.get('Scm_Reason').label;
	    
		//If there is the default value => reset the field and 
		//if there is nothing => set the 
		comment.observe('click', function(event) {
			var elem = Event.element(event);
			if(elem.value === this._footerItems.get('Scm_Reason').label)
				elem.value = '';	
		}.bindAsEventListener(this));
		
		comment.observe('blur', function(event) {
			var elem = Event.element(event);
			if(elem.value === '')
				elem.value = this._footerItems.get('Scm_Reason').label;	
		}.bindAsEventListener(this));
		
		div.insert('<div class="application_clear_line"></div><div><span class="application_main_text SCM_popupText">'+global.getLabel('Comment')+' :</span></div>');
		div.insert(comment);
		popup.insert(div);
		
	    //Add the buttons to cancel and to set to pending
	    popup.insert('<div class="application_clear_line"></div><div><div id="SCM_popupPendingCancel"/><div id="SCM_popupPendingDone"/></div>');
	    
	    //Build the list of buttons
	    json = {
			elements : $A( [ 
			{
				label 			: global.getLabel('Done')						,
				handlerContext 	: null											,
				handler 		: function() {
        		    var reason  = reasonAutoc.getValue().idAdded;
        		    if(Object.isEmpty(reason)) return;
					//since 2.1 Use the standard encoding
		            this._poolInterface.sendAction('Set_to_pending', this.getSelectedTickets(), HrwRequest.encode(this.getReason()), reason);
		            ourPopup.close();
				}.bind(this)	    ,
				className 		: 'SCM_PoolTable_footerButton'	                ,
				type 			: 'button'						                ,
				idButton 		: 'SCM_popupPendingDone'      	                ,
				standardButton 	: true
			},
			{
				label 			: global.getLabel('Cancel')						,
				handlerContext 	: null											,
				handler 		: function() {ourPopup.close();}.bind(this)	    ,
				className 		: 'SCM_PoolTable_footerButton'					,
				type 			: 'button'										,
				idButton 		: 'SCM_popupPendingCancel'      				,
				standardButton 	: true
			}])
		};
		
		// Create the buttons
		var buttons = new megaButtonDisplayer(json);
        popup.insert(buttons.getButtons());

        ourPopup.create();  
        
        //Build the autoCompleter
	    json = {autocompleter: {object: $A()}};
		
        reasonsList.each(function(reason) {
            json.autocompleter.object.push({
                text: reason.value,
                data: reason.key
            });
        }.bind(this));
        
        //since 1.2 Sort the pending reasons
		json.autocompleter.object = json.autocompleter.object.sortBy(function(item) {
			return item.text;
		});
		
		json.autocompleter.object[0].def = 'X';
        
        reasonAutoc = new JSONAutocompleter('SCM_popupPendingReason', {
            timeout                     : 500       ,
            showEverythingOnButtonClick : true      ,
            templateResult              : '#{text}' ,
            templateOptionsList         : '#{text}' 
        }, json);
	},
	
	/**
	 * @param {Integer} rowIndex Index of the ticket in the content list
	 * @param {Boolean} checked Indicate if the ticket was selected or unselected
	 * @param {Boolean} updateCheckbox is the checkbox to update?
	 * @description Do the actions needed when the user select/unselect a ticket in the list.
	 * @since 1.0
	 */
	rowSelected: function(rowIndex, checked, updateCheckbox) {
		var content = this._content[rowIndex];
		var toApply;
		content.selected = checked;
		if(updateCheckbox) content.HTMLElement.down('input').checked = checked;
		
		this.updateFooter(rowIndex, checked);
		
		if (checked === true) {
			toApply = false;
			
			if (this._poolInterface.poolType !== 'OPMPool' && this._poolInterface.poolType !== 'TeamPool') {
				toApply = (this.addCheckboxCond('STATUS', this.getValue(rowIndex, 'STATUS')) || toApply);
				toApply = (this.addCheckboxCond('COMPANY_ID', this.getValue(rowIndex, 'COMPANY_ID')) || toApply);
			}
			
			if(this.getValue(rowIndex, 'ASSIGNED_TO_ID') === hrwEngine.scAgentId)
				toApply = (this.addCheckboxCond('TicketOwner', hrwEngine.scAgentId) || toApply);
			else 
				toApply = (this.addCheckboxCond('TicketNotOwner', hrwEngine.scAgentId) || toApply);
				
			if (toApply) this.applyCheckboxCond(null);	
		} else if (this.removeCheckboxCond() === true)
				this.applyCheckboxCond(null);
	},
	
	/**
	 * @param {Integer} rowIndex Index of the ticket in the content list
	 * @param {String} ticketId Id of the extended ticket
	 * @description Action to do when the user extended a row.
	 * @since 1.0
	 */
	rowExtended: function(rowIndex, ticketId) {
		// If the line is extended => collapse it
		if (this._content[rowIndex].extended) {
			this.removeTicketAddedLines(rowIndex);
			this.updateSize();
			// If the line is collapsed but the HTML content already
			// exist => use it
		} else if (!Object.isEmpty(this._content[rowIndex].HTMLAddedLines)) {
		    this.buildBodyLineExtension(rowIndex);
			this.updateSize();  
		} else	
			this._poolInterface.getTicketLastActions(ticketId);
	},
	
	/**
	 * @param {String} ticketId Id of the extended ticket
	 * @description Action to do when the user asked to see the details of a ticket.
	 * @since 1.0
	 */
	ticketDetailsAsked: function(ticketId) {
		var ticket = this.getTicketFromId(ticketId, true);
		if(ticket === false) return;
		global.open($H({ 
			app: {
				appId		: 'TIK_PL'			,
				tabId		: 'PL_TIK'			,
				view		: 'scm_ticketApp'
			},
			selectedPart: scm_ticketApp.PROPERTIES	,
			forCreation	: false						,
			forEdition	: (this.getValue(ticket.index, 'STATUS') === '2')	,
			ticketId	: ticketId
		}));
	},
	
	/**
	 * @param {String} colIdOrder Id of the column to sort and is the sorting ASC(ending) or (DESC)ending
	 * @description Set the default sorting to set in the table for the next display.
	 * @since 1.0
	 */
	setSorting: function(colIdOrder) {
	    if(!Object.isEmpty(this._HTMLHeader)) return;
	    if(Object.isEmpty(colIdOrder)) return;
	    var sort = colIdOrder.split(' ');
	    
	    var header = this._headers.get(this.COLUMNS.get(sort[0]));
	    if(header && header.sort != sort[1]) {
	        header.sort = sort[1];
	        this._headers.set(this.COLUMNS.get(sort[0]), header);
	    }
	},
	/**
	 * @param {String} colId Id of the column to sort
	 * @description Action to do when the user changed the sort of a column.
	 * @since 1.0
	 */
	columnSorted: function(colId) {
		var cell;
		
		this.clearTable(false, true, true);
		
		this._headers.each(function(header) {
		    cell = this._poolInterface.virtualHtml.down('span#header_' + header[0]);
		    
		    if(header[0] === colId) {
		        switch (header[1].sort) {
		        case 'ASC':
		        case '':
			        header[1].sort = 'DESC';
			        cell.addClassName('table_sortColDesc');
			        break;
		        case 'DESC':
			        header[1].sort = 'ASC';
			        cell.removeClassName('table_sortColDesc');
			        cell.addClassName('table_sortColAsc');
			        break;
		        }
            } else if(header[1].sort != '') {
                header[1].sort = '';
			    cell.removeClassName('table_sortColAsc');
			    cell.removeClassName('table_sortColDesc');
            } else
                return;
		    
		    this._headers.set(header[0], header[1]);
		}.bind(this));
		
		this.ticketsToLoad(false);
	},
	
	/**
	 * @param {String} nodeId Id of the selected node
	 * @description Action to do when the user selected a new grouping.
	 * @since 1.0
	 */
	groupingNodeSelected: function(nodeId) {
		this.clearTable(false, true, true);
		this.ticketsToLoad(false);
	},
	
	/**
	 * @description Get the list of selected tickets in the pool table.
	 * @returns {Array} List of {@link SCM_Ticket}
	 * @since 1.0
	 */
	getSelectedTickets: function() {
	    var selectedTickets 	= $A();
	    this._content.each(function(content) {
	        if(content.selected)
				selectedTickets.push(content.values);
	    }.bind(this));
	    return selectedTickets;
	},
	
	/**
	 * @description Get the reason to a modification of status.
	 * @returns {String} The reason selected by the user
	 * @since 1.0
	 */
	getReason: function() {
	    var footer = this._footerItems.get('Scm_Reason');
		// Get the reason from the pool footer
	    var reason = footer.input.value;
		// Get the comment from the popup
		var popupContainer = $('idModuleInfoPopUp_container');
	    var pendingReason;
		if(popupContainer) pendingReason = popupContainer.down('textarea#SCM_popupFootComment');
		
	    if(pendingReason)
	        reason = pendingReason.value.stripScripts().stripTags();
	    if (reason === footer.label)
	        return '';	
	    else 
	        return reason;
	},
	
	/**
	 * @param {String} toDisplay The string to display
	 * @param {Integer} maxLength The maximum place that can take the string (in number of caracters)
	 * @param {Boolean} hasAction Indicate if there is an action (a blue square to set after the string) for the field
	 * @description Prepare a string for its display by removing all javascript instructions, all tags and all autoclosed tags.
	 * @returns {String} The prepared string
	 * @since 1.0
	 * <br/>Modified for 2.1
	 * <ul>
	 * <li>Remove the transformation of " and '</li>
	 * <li>Use the default method to remove the tags</li>
	 * </ul>
	 */
	prepareForDisplay: function(toDisplay, maxLength, hasAction) {
		if(hasAction) maxLength -= 1;
		//since 2.1 Use the standard method to remove the tags and remove the encoding of " and '
		return HrwRequest.removeTags(toDisplay).truncate(maxLength);
	}
});

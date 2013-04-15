var Url = {

    // public method for url encoding
    encode : function (string) {
        return escape(this._utf8_encode(string));
    },

    // public method for url decoding
    decode : function (string) {
		 return this._utf8_decode(unescape(string)).replace(/\+/g," ");
    },

    // private method for UTF-8 encoding
    _utf8_encode : function (string) {
        string = string.replace(/\r\n/g,"\n");
        var utftext = "";

        for (var n = 0; n < string.length; n++) {

            var c = string.charCodeAt(n);

            if (c < 128) {
                utftext += String.fromCharCode(c);
            }
            else if((c > 127) && (c < 2048)) {
                utftext += String.fromCharCode((c >> 6) | 192);
                utftext += String.fromCharCode((c & 63) | 128);
            }
            else {
                utftext += String.fromCharCode((c >> 12) | 224);
                utftext += String.fromCharCode(((c >> 6) & 63) | 128);
                utftext += String.fromCharCode((c & 63) | 128);
            }

        }

        return utftext;
    },

    // private method for UTF-8 decoding
    _utf8_decode : function (utftext) {
        var string = "";
        var i = 0;
        var c = c1 = c2 = 0;

        while ( i < utftext.length ) {

            c = utftext.charCodeAt(i);

            if (c < 128) {
                string += String.fromCharCode(c);
                i++;
            }
            else if((c > 191) && (c < 224)) {
                c2 = utftext.charCodeAt(i+1);
                string += String.fromCharCode(((c & 31) << 6) | (c2 & 63));
                i += 2;
            }
            else {
                c2 = utftext.charCodeAt(i+1);
                c3 = utftext.charCodeAt(i+2);
                string += String.fromCharCode(((c & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63));
                i += 3;
            }

        }

        return string;
    }

};

var HRW = Class.create(Application,{
    
	version: '090918', 
	/**
	 *@type String
	 *@description Div around the application.
	 */
	mainDivId : "ticketing_main_div",
	
	/**
	 *@type Element
	 *@description Div around the application.
	 */
	mainDiv : null,
	
	/**
	 *@type String
	 *@description Div around the filter form to limit ticket list.
	 */
	filterDivId : "ticketing_filter_div",
	
	/**
	 *@type Element
	 *@description Div around the filter form to limit ticket list.
	 */
	filterDiv: null, 
	
	/**
	 *@type String
	 *@description Div around the link to add a new ticket.
	 */
	addTicketDivId : "ticketing_addTicket_div",
	
	/**
	 *@type Element
	 *@description Div around the link to add a new ticket.
	 */
	 addTicketDiv: null,
	
	/**
	 *@type String
	 *@description Div around the list of tickets.
	 */
	ticketListDivId : "ticketing_ticketList_div",
	
	/**
	 *@type Element
	 *@description Table with the list of tickets.
	 */
	ticketListTable: null,
	
	/**
	 *@type Element
	 *@description Div around the tickets list.
	 */
	ticketListDiv: null,
	
	/**
	 *@type Integer
	 *@description Maximum number of tickets by page.
	 */
	maxTickets: 5,
	
	/**
	 *@type String
	 *@description Identifier of the DIV element with ticket details.
	 */
	ticketDivId: "ticketing_ticketView_div",
	
	/**
	 *@type Element
	 *@description DIV element that contains the ticket details.
	 */
	ticketDiv: null,
	
	/**
	 *@type String
	 *@description Identifier of the currently displayed ticket.
	 */
	currentTicketId: null,
	
	/**
	 *@type TicketView
	 *@description Instance of the ticket currently displayed.
	 */
	detailsView: null,
	
	/**
	 *@type DateParser
	 *@description Object that manage actions on times.
	 */
	dateParser: null,
	
	/**
	 * @type Element 
	 * @description Div with the list of documents to add to the ticket.
	 */
    addDocumentsDiv: null,
    
    /**
	 * @type String 
	 * @description Identifier of the div with the list of documents to add to the ticket.
	 */
    addDocumentsDivId : 'ticketing_add_document_div',
    
    /**
	 * @type JSONAutocompleter 
	 * @description AutoCompleter with the selected value for the service group.
	 */
    serviceGroupAutoComp: null,
    
    /**
	 * @type String 
	 * @description Identifier of the div with the service group selection.
	 */
    serviceGroupAutoCompId: 'ticketing_add_service_group_sel',
    
    /**
	 * @type JSONAutocompleter 
	 * @description AutoCompleter with the selected value for the service.
	 */
    serviceAutoComp: null,
    
    /**
	 * @type String 
	 * @description Identifier of the div with the service selection.
	 */
    serviceAutoCompId: 'ticketing_add_service_sel',
    
    /**
	 * @type Element 
	 * @description Text area with the ticket description.
	 */
    descriptionArea: null,
    
    /**
	 * @type String 
	 * @description Identifier of the div with the ticket description.
	 */
    descriptionAreaId : 'ticketing_add_description',
    
    /**
	 * @type Hash 
	 * @description For each service group id, list of the possible services.
	 */
    serviceGroupsFromSap: null,
    
    /**
	 * @type String 
	 * @description Id of the last selected service group.
	 */
    lastServiceGroup: null,
    
    /**
	 * @type Element
	 * @description The "Back" link of the application
	 */
	backSpan: null,

	/**
	 * @type integer
	 * @description The HRW company Id corresponding to the SAP company Id
	 */
	hrwCompanyId: null,
	
	addTicketLink:null,
	
	initialize: function($super) {
	    $super('HRW'); 
    
		this.maxTickets = 5;
	},
	
	run : function($super){
	    $super();
		
	    this.serviceGroupsFromSap = $A();
		this.lastServiceGroup = null;
		
	    if (this.firstRun){
			this.dateParser = new TicketingDateParser()
			this.updateTitle(global.getLabel("My Tickets"));
			
			this.buildScreenObjects();
			this.buildMainScreen(null, null, null);
			this.getHRWCompanyId();
		}
		Event.observe(document, 'keypress', function(event){ 
														if (event.shiftKey == true && event.keyCode === Event.KEY_HOME) {
															this.showVersion();
														}
													}.bind(this));

		// Set the handler to listen the click on an attachement
		document.observe('EWS:ticketing_download_document', function (event){
			try{
				this.virtualHtml.down('[id=iframeFile]').remove();
			}catch(e){}
		
			var args = getArgs(event);
			this.getActionAttachements(args.get('itemId'));
		}.bindAsEventListener(this));
		
		document.observe('EWS:Ticketing_ticket_create', this.createTicket.bindAsEventListener(this));	
		document.observe('EWS:Ticketing_createNewTicket', this.newTicketCreationScreen.bindAsEventListener(this));
	},
	
	close : function($super) {
		this.closeTicketsList();
		this.closeTicketView();
		this.resetMainScreen();
		document.stopObserving('EWS:ticketing_download_document');
		document.stopObserving('EWS:Ticketing_createNewTicket');
		document.stopObserving('EWS:Ticketing_ticket_create');
		
		$super();
	},
	
	//--------------------------------------------------------------------------------------------------------------------------
	//					SERVICES CALLERS
	//--------------------------------------------------------------------------------------------------------------------------
	
	getHRWCompanyId: function(){
		var servXml = 	'<EWS>'
        			    +	'<SERVICE>TKT_GET_COMPID</SERVICE>' 
        			    + '<PARAM></PARAM>' 
					  + '</EWS>';	
					  
		this.makeAJAXrequest($H({
			xml: servXml,
			successMethod: 'assignCompanyId'
		}));	
	},
	
	/**
	 *@description Call the service get_ticket_list to get the list of existent tickets
	 *				that match some given filter data.
	 *@param {Date} beginDate Begin date filter value.
	 *@param {Date} endDate End date filter value.
	 *@param {String} status Status filter value
	 */
	getTicketsList : function(beginDate, endDate, status) {
		if(!beginDate) beginDate = new Date(1901, 1, 1, 0, 0, 0, 0);
		if(!endDate) endDate = new Date(9998, 12, 31, 0, 0, 0, 0);
		var servXml = 	'<EWS>'
						+	'<SERVICE>TKT_GET_TLIST</SERVICE>'
						+	'<DEL/>'
						+	'<PARAM>'
						+		'<I_COMPANYID>' + this.hrwCompanyId + '</I_COMPANYID>'
						+		'<I_BEGIN_DATE>' + objectToSap(beginDate) + '</I_BEGIN_DATE>'
						+		'<I_END_DATE>' + objectToSap(endDate) + '</I_END_DATE>'
						+		'<I_STATUS>' + status + '</I_STATUS>'
						+	'</PARAM>'
						+ '</EWS>';
		
		this.makeAJAXrequest($H({
			xml: servXml,
			successMethod: 'buildTicketList'
		}));
	},	
	
	/**
	 *@description Call the service get_ticket to get the details of a the current ticket.
	 */
	getTicket : function() {
		var servXml = 	'<EWS>'
						+	'<SERVICE>TKT_GET_TKT</SERVICE>'
						+	'<DEL/>'
						+	'<PARAM>'
						+		'<I_TICKETID>' + this.currentTicketId + '</I_TICKETID>'
						+		'<I_COMPANYID>' + this.hrwCompanyId + '</I_COMPANYID>'
						+	'</PARAM>'
						+ '</EWS>';

		this.makeAJAXrequest($H({
			xml: servXml,
			successMethod: 'drawTicketView'
		}));
	},
	
	
		
	/**
	 *@description Call the service get_action_attachements to get the list 
	 *				of documents attached to an action in the current ticket.
	 *@param {String} actionId Identifier of the action to load.
	 */
	getActionAttachements : function(itemId) {
		var servXml = 	'<EWS>'
						+	'<SERVICE>TKT_GET_TITEM</SERVICE>'
						+	'<DEL/>'
						+	'<PARAM>'
						+		'<I_COMPANYID>' + this.hrwCompanyId + '</I_COMPANYID>'
						+		'<I_TICKETID>' + this.currentTicketId + '</I_TICKETID>'
						+		'<I_ITEMID>' + itemId + '</I_ITEMID>'
						+	'</PARAM>'
						+ '</EWS>';
		
		this.downloadDocument(servXml);
	},
	
    /**
  	 *@description Call the AJAX request to get the list of service groups and services.
  	 */
    createNewTicket : function () {
		var servXml = 	'<EWS>'
						+	'<SERVICE>TKT_GET_SG</SERVICE>'
						+	'<DEL/>'
						+	'<PARAM>'
						+	'<I_COMPANYID>' + this.hrwCompanyId + '</I_COMPANYID>'
						+	'</PARAM>'
						+ '</EWS>';

		this.makeAJAXrequest($H({
			xml: servXml,
			successMethod: 'drawServiceGroupList'
		}));
    },
	    
    addTicket : function (serviceGroup, service, description){
    	var servXml = 	'<EWS>'
    					+	'<SERVICE>TKT_CREATE_NEW</SERVICE>'
    					+	'<DEL/>'
    					+	'<PARAM>'
    					+		'<I_SERVICE_GROUPID>' + serviceGroup + '</I_SERVICE_GROUPID>'
    					+		'<I_SERVICEID>' + service + '</I_SERVICEID>'
    					+		'<I_DESCRIPTION>' + description + '</I_DESCRIPTION>'
						+       '<I_COMPANYID>'+ this.hrwCompanyId +'</I_COMPANYID>'
    					+	'</PARAM>'
    					+'</EWS>';
		this.makeAJAXrequest($H({
			xml: servXml,
			successMethod: 'ticketCreationCompleted'
		}));
    },
	//--------------------------------------------------------------------------------------------------------------------------
	//					MAIN SCREEN
	//--------------------------------------------------------------------------------------------------------------------------
	/**
	 *@description Create the main screen part in the ticketing application.
	 */
	buildScreenObjects : function(){
    	this.mainDiv = this.virtualHtml.down('[id=' + this.mainDivId + ']');
    	
    	if (this.mainDiv) this.mainDiv.remove();
    	
		this.mainDiv = new Element("div",{
			"class" : "ticketing_content",
			"id"    : this.mainDivId
		})
		
		this.virtualHtml.insert(this.mainDiv);
		
		this.addTicketDiv = new Element("div", {
			"class" : "ticketing_content_div",
			"id"    : this.addTicketDivId
		});
		this.mainDiv.insert(this.addTicketDiv);
		
		this.filterDiv = new Element("div", {
			"class" : "ticketing_content_div",
			"id"    : this.filterDivId
		});
		this.mainDiv.insert(this.filterDiv);
		
		this.ticketListDiv = new Element("div", {
			"class" : "ticketing_content_div",
			"id"    : this.ticketListDivId
		});
		this.mainDiv.insert(this.ticketListDiv);
		
		this.ticketDiv = new Element("div", {
			"class" : "ticketing_content_div",
			"id"    : this.ticketDivId
		});
		this.mainDiv.insert(this.ticketDiv);
	},
	
	/**
	 *@description Build the HTML code of the main screen and add the datePickers
	 *				in the filter and the autoCompleter for the status selection.
	 */
	buildMainScreen : function(oldStartDate, oldEndDate, oldOpenClose){
		var options = {};
		// Draw the "Add Ticket" link.
		this.drawAddTicket();
		
		// Draw the filter content
		this.drawFilterContent();
		
		// Add the datePickers in the filter
		var lastMonthDates = this.dateParser.getCurrentMonthDates();

		if(Object.isEmpty(oldStartDate)) 
			options.defaultDate = lastMonthDates.beginDate.toString('yyyyMMdd');
		else
			options.defaultDate = oldStartDate.toString('yyyyMMdd');
		this.filterStartDate = new DatePicker('ticketing_filterBegda', options);
		
		if(Object.isEmpty(oldEndDate)) 
			options.defaultDate = lastMonthDates.endDate.toString('yyyyMMdd');
		else
			options.defaultDate = oldEndDate.toString('yyyyMMdd');
		this.filterEndDate   = new DatePicker('ticketing_filterEndda', options);
		
		this.filterStartDate.linkCalendar(this.filterEndDate);
		
		var json = {
				autocompleter : {
				object : [
				          {
				        	  text: global.getLabel('Closed'), 
				        	  data: 'closed'
				          },
				          {
				        	  text: global.getLabel('Open'), 
				        	  data: 'open', 
				        	  def: 'X'
				          }]
				}
		};
		if(oldOpenClose === 'closed') {
			json.autocompleter.object[0].def = 'X';
			json.autocompleter.object[1].def = '';
		}
		
		options = {
			timeout : 500,
			showEverythingOnButtonClick : true,
			templateResult : '#{text}',
			templateOptionsList : '#{text}'
		};
		
		// Add the selection field in the filter
		this.filterStatus = new JSONAutocompleter('ticketing_filterStatus', options, json);
	},
	
	/**
	 *@description Add the HTML code for the add Ticket DIV.
	 */
	drawAddTicket : function() {
		if (this.hrwCompanyId){
			this.addTicketLink = new Element('span', {
			'class' : 'application_action_link'
			}).update(global.getLabel('Add Ticket'));
			
			this.addTicketLink.observe('click', function(event){
				try{
					this.virtualHtml.down('[id=iframeFile]').remove();
				}catch(e){}
			
				document.fire('EWS:Ticketing_createNewTicket');
			}.bindAsEventListener(this));
		}else{
			this.addTicketLink = new Element('span').update(global.getLabel('Add Ticket'));
		}

		this.addTicketDiv.insert(this.addTicketLink);
		
	},
	
	/**
	 *@description Add the HTML code for the filter DIV.
	 */
	drawFilterContent: function(){
		var innerDiv = new Element("div");
		this.filterDiv.insert(innerDiv);
		
		// Add the period filter
		innerDiv.insert(new Element('div',{
			'class' : 'ticketing_filter_text'
		}).update(global.getLabel('Period')));
		
		innerDiv.insert(new Element('div',{
			'id'    : 'ticketing_filterBegda',
			'style' : 'float:left;'
		}));
		
		innerDiv.insert(new Element('div',{
			'class' : 'ticketing_filter_text'
		}).update(global.getLabel("to")));
		
		innerDiv.insert(new Element("div",{
			'id'    : 'ticketing_filterEndda',
			'style' : 'float:left;'
		}));
		
		// Add the close/open filter
		innerDiv.insert(new Element('div',{
			'class' : 'ticketing_filter_text'
		}).update(global.getLabel("Open/Closed")));
		
		innerDiv.insert(new Element('div',{
			'id'    : 'ticketing_filterStatus',
			'style' : 'float:left; padding-top: 5px;'
		}));
		
		
// Add the search button
		var json = {
                    elements:[]
                };
        var auxSearch =   {
                label: global.getLabel('Search'),
                idButton:'HRWsearchButton',
                handlerContext: null,
                className:'ticketing_searchButton',
                handler: this.clickingOnSearch.bind(this),
                type: 'button',
                standardButton:true
              };                 
        json.elements.push(auxSearch);     
		this.ButtonSearch=new megaButtonDisplayer(json);
		
		
		this.filterDiv.insert(this.ButtonSearch.getButtons());
		
		if (!this.hrwCompanyId){
			this.ButtonSearch.disable("HRWsearchButton");
		}else{
			this.ButtonSearch.enable("HRWsearchButton");
		}
	},
	clickingOnSearch:function(){
	    try{
			this.virtualHtml.down('[id=iframeFile]').remove();
		}catch(e){}
				
		var selected = this.filterStatus.options.array[this.filterStatus.lastSelected];
		var status = '';
		if (selected) {
			if (Object.isEmpty(selected.get('data')))
				status =  selected.get('text');
			else
				status =  selected.get('data');
		}
		this.getTicketsList(this.filterStartDate.actualDate, this.filterEndDate.actualDate, status);
	},
	
	resetMainScreen : function() {
		if(this.filterStartDate) this.filterStartDate.reloadDefaultDate();
		if(this.filterEndDate)  this.filterEndDate.reloadDefaultDate();
	},
	
	assignCompanyId:function(json){
		this.hrwCompanyId = json.EWS.o_companyid;
		
		if (!this.hrwCompanyId){
			this.ButtonSearch.disable("HRWsearchButton");
		}else{
			this.ButtonSearch.enable("HRWsearchButton");
			this.addTicketLink.addClassName('application_action_link')
			this.addTicketLink.observe('click', function(event){
			try{
				this.virtualHtml.down('[id=iframeFile]').remove();
			}catch(e){}
		
			document.fire('EWS:Ticketing_createNewTicket');
		}.bindAsEventListener(this));
		}
		
		this.filterDiv.insert(ButtonSearch.getButtons());
	},
	
	//--------------------------------------------------------------------------------------------------------------------------
	//					TICKET LIST
	//--------------------------------------------------------------------------------------------------------------------------	
	/**
	 *@description Build the HTML code and the objects to display the list of tickets. 
	 *				It created the TableKit object with a limited number of lines and a 
	 *				new sort for dates. It also close the details of ticket if one is open.
	 *@param {Object} json Answer of the service get_tickets_list().
	 */
	buildTicketList: function(json) {	
		// Close the displayed ticket if any and the list of tickets
		this.closeTicketView();
		this.closeTicketsList();
		
		if (!Object.isEmpty(json)) {
			// If the list is a new one => kill the existant details 
			this.detailsView = null;
			// Add the new list of tickets in the screen 
			this.ticketListTable = this.drawTicketsList(json);
		}
		
		this.ticketListDiv.insert(this.ticketListTable);
		
		// 	Create the Sort on the dates
		this.dateParser.addSortDateType();
			
		// Add the table kit for the list of tickets
		TableKit.Sortable.init(this.ticketListTable, {pages: this.maxTickets});
		TableKit.Sortable.sort(this.ticketListTable, 1, -1);
		TableKit.Resizable.init(this.ticketListTable);
	},
	
	/**
	 *@description Draw the list of tickets. 
	 *@param {Object} json Answer of the service get_tickets_list().
	 *@param {Element} footer Footer of the table that is already buid by TableKit.
	 *@returns Element
	 */
	drawTicketsList: function(json) {
		var tickets = $A();
		if (!Object.isEmpty(json.EWS.o_ticket_list))
			 tickets = objectToArray(json.EWS.o_ticket_list.yglui_str_hw_o_ticketlist);
		else {
			var table =  new Element("div",{
				"style": "clear:both; padding-top:10px"				
			}).insert(new Element("span", {
        		"class" : "application_main_title2"
        	}).update(global.getLabel("No result for selected period")));
        	return table;
		}
		
		var table = new Element('table', {
			 'class' : 'sortable resizable',
			 'id' : 'ticketing_filterTable',
			 'style' : 'margin-top: 20px; width:100%;'
		 });
		
		 var thead = new Element('thead');
		 table.insert(thead);
		 
		 var tr = new Element('tr');
		 thead.insert(tr);
		 
		 tr.insert(new Element('th').update(global.getLabel('Ticket ID')));
		 
		 tr.insert(new Element('th', {
			 'class' : 'table_sortfirstasc'
		 }).update(global.getLabel('Service Name')));
		 
		 tr.insert(new Element('th').update(global.getLabel('Description')));
		 
		 tr.insert(new Element('th', {
			 'class' : 'table_sortfirstasc'
		 }).update(global.getLabel('Ticket Status')));
		 
		 tr.insert(new Element('th', {
			 'class' : 'dateTickets'
		 }).update(global.getLabel('Date')));
		 
		 
		 var tbody = new Element('tbody'); 
		 table.insert(tbody);
		 
		 tickets.each( function(ticket){		 
		 	 tr = new Element('tr');
			 tbody.insert(tr);
			 
			 var td = new Element('td');
			 td.insert( new Element('span', { 'class' : 'application_action_link' }).update(ticket['@ticket_id']));
			 td.observe('click', this.getTicketView.bindAsEventListener(this));
			 tr.insert(td);
			 // trim on 30 characters if longer
			 var service = global.getLabel(ticket['@service']);
			 if (service.length > 30){
			 	service  = service.substring(0,27) + '...';
			 }
			 tr.insert(new Element('td').update(service));
			 // trim on 50 characters if longer
			 // DECODE
			 var description = Url.decode(ticket['@description']);
//			 var description = decodeURI(ticket['@description']);
			 
			 description = this.extractContentFromHtml(description);	
			 			 		 
			 if (description.length > 50){
			 	description  = description.substring(0,47) + '...';
			 }
			 tr.insert(new Element('td').update(description));
			 
			 
			 tr.insert(new Element('td').update(global.getLabel(ticket['@status'])));
			 tr.insert(new Element('td').update(this.dateParser.buildDate(ticket['@creation_date'], ticket['@creation_time'])));
		 
		 }.bind(this));
		 
		 return table;
	},
	
	extractContentFromHtml:function(description){
		return description.stripScripts().stripTags();
	},
	
	/**
	 *@description Remove the content of the list of tickets and unload the tableKit.
	 *				To avoid to duplicate the table footer to navigate between parts of the tables => delete it.
	 */
	closeTicketsList : function() {
		// Do something only if there is a current table
		if (Object.isEmpty(this.ticketListDiv) || Object.isEmpty(this.ticketListDiv.down())) return;
		
		TableKit.unloadTable(this.ticketListTable);
		var tfoot = this.ticketListTable.down('tfoot');
		if(tfoot) tfoot.remove();
		this.ticketListDiv.down().remove();
		TableKit.Sortable.tFoot = null;
	},
	
	//--------------------------------------------------------------------------------------------------------------------------
	//					TICKET DETAILS
	//--------------------------------------------------------------------------------------------------------------------------
	/**
	 *@description Get the viewer for the details of the ticket. 
	 *@param {Object} json Answer of the service get_ticket().
	 */
	getTicketView: function(event) {
		
		try{
			this.virtualHtml.down('[id=iframeFile]').remove();
		}catch(e){}
		
		var newTicketId = Event.element(event).innerHTML.stripScripts().stripTags();
		
		// If old and new tickets are the same => nothing to do
		if (newTicketId == this.currentTicketId) return;
		
		// Close the previous ticket view and create a new one
		this.closeTicketView()
		this.currentTicketId = newTicketId;
		
		this.getTicket();
	},
	
	/**
	 *@description Draw the content of the ticket details view and add it in the DIV element this.ticketDiv.
	 *@param {Object} json Answer of the service get_ticket().
	 */
	drawTicketView: function(json) {
		this.detailsView = new TicketView(this.currentTicketId, this.dateParser);
		this.detailsView.drawTicketView(this.ticketDiv,json);
	},
	
	/**
	 *@description Close the ticket details view.
	 */
	closeTicketView: function() {
		// Do something only if there is an open ticket details
		if (Object.isEmpty(this.currentTicketId)) return;
		this.currentTicketId = null;
		if(!Object.isEmpty(this.detailsView)) this.detailsView.close();
		if(!Object.isEmpty(this.ticketDiv)) this.ticketDiv.descendants().collect(function(child) {child.remove()});
	},
	
	//--------------------------------------------------------------------------------------------------------------------------
	//					ACTION ATTACHEMENTS
	//--------------------------------------------------------------------------------------------------------------------------
	/**
	 *@description Download the list of documents attached to an action
	 *@param {Object} json Answer of the service get_action_attachements.
	 */
	downloadDocument: function(servXml) {
		var file = "<iframe id='iframeFile' style='display:none;'></iframe>";
		this.virtualHtml.insert(file);
		// DECODE
		var documentUrl = Url.decode(__hostName.split("=")[1]);
		//var documentUrl = decodeURI(__hostName.split("=")[1]);
		this.virtualHtml.down('[id=iframeFile]').src = documentUrl + "&xml_in=" + servXml;
	},
	
	//--------------------------------------------------------------------------------------------------------------------------
	//					NEW TICKET CREATION
	//--------------------------------------------------------------------------------------------------------------------------
	/**
  	 *@description Call the creation of a new ticket screen.
  	 */
	newTicketCreationScreen : function () {	
		this.goForward();
		
		this.upload = false;
        this.uploadFiles = $H();
        this.updateTitle(global.getLabel("New ticket creation"));
        this.currentFiles = 0;
        this.buildNewTicketsScreenObjects();

        this.virtualHtml.insert(this.mainDiv);
        
        this.mainDiv.insert(this.backSpan);
        
        this.addTicketDiv.insert(this.buildTicketParamsForm());
    	//removed for the moment till a solution to store documents is found
		//    this.addTicketDiv.insert(this.addDocumentLink);
        this.addTicketDiv.insert(this.hiddenIFrame);
        this.addTicketDiv.insert(this.addDocumentsDiv);
		
        this.addTicketDiv.insert(new Element('div', {
        	'class' : 'ticketing_createButton'
        }).insert(this.ButtonCreate.getButtons()));
        
        this.mainDiv.insert(this.addTicketDiv);
        
        this.createNewTicket();
        
        /*
		this.addDocumentLink.observe('click', function(){
            document.fire("EWS:Ticketing_add_document");
        });
		
		
        this.hiddenIFrame.observe('load', function(){
            document.fire("EWS:Ticketing_upload_finished");
        });
        */
        
	},
	
	/**
  	 *@description Build the main components in the HTML document.
  	 */
     buildNewTicketsScreenObjects: function(){
    	// Build the main div
    	this.mainDiv = new Element("div", {
            "id": this.mainDivId,
            "class": ""
        });
        
    	// Build the div with the ticket form content
        this.addTicketDiv = new Element("div", {
            "id": this.addTicketDivId,
            "style": "clear:both; float:left; text-align: left;width: 100%;"
        });
        
        // Add the link to add documents
        this.addDocumentLink = new Element("span", {
            "class": "application_action_link",
            "id": this.addDocumentLinkId
        }).update(global.getLabel("Add Document"));
        
        // Add the div to contains the list of documents to add to the ticket       
        this.addDocumentsDiv = new Element('div', {
        	'id' : this.addDocumentsDivId
        });
        
        // Add the hidden frame for the fields management
        this.hiddenIFrame = new Element("frame", {
            "id": "uploadFrame",
            "style": "display:none",
            "name": "uploadFrame"
        });
        // Add the button to create the ticket
        var json = {
            elements:[],
            defaultEventOrHandler:true
        };
        var auxCreate =   {
            label: global.getLabel('Create Ticket'),
            event:'EWS:Ticketing_ticket_create',
            className:'ticketing_alignCreate',
            type: 'button',
            standardButton:true
        };                 
        json.elements.push(auxCreate);
        this.ButtonCreate=new megaButtonDisplayer(json);    
        /* The backspan */
		this.backSpan = new Element('div', {
			'class': 'application_action_link Rept_go_back'
		}).update(global.getLabel('<< Back'));
		
		this.backSpan.observe('click', function(){
			this.goBack(false);
		}.bindAsEventListener(this));
    },
    
    /**
 	 *@description Build the HTML code to allow the user to fill in the parameters of the ticket.
 	 */
    buildTicketParamsForm : function () {
    	var formDiv = new Element('div');
    	
    	// Add the Service group line
    	var formLine = new Element('div', {
    		'class' : 'ticketing_formLine'
    	});
    	formDiv.insert(formLine);
    	
    	formLine.insert(new Element('div', {
    		'id' : this.serviceGroupAutoCompId + 'Label',
    		'class' : 'ticketing_addTicketLabel'
    	}).update(global.getLabel('Service group')));
    	
    	formLine.insert(new Element('div', {
    		'id' : this.serviceGroupAutoCompId
    	}));
    	
    	// Add the Service line
    	formLine = new Element('div', {
    		'class' : 'ticketing_formLine'
    	});
    	formDiv.insert(formLine);
    	
    	formLine.insert(new Element('div', {
    		'id' : this.serviceAutoCompId + 'Label',
    		'class' : 'ticketing_addTicketLabel'
    	}).update(global.getLabel('Service')));
    	
    	formLine.insert(new Element('div', {
    		'id' : this.serviceAutoCompId
    	}));
    	
    	// Add the description line
    	formLine = new Element('div', {
    		'class' : 'ticketing_formLine',
			'style' : 'height:200px;'
    	});
    	formDiv.insert(formLine);
    	
    	formLine.insert(new Element('div', {
    		'id' : this.descriptionAreaId + 'Label',
    		'class' : 'ticketing_addTicketLabel',
    		'style' : 'height: 170px;'
    	}).update(global.getLabel('Description')));
    	
    	this.descriptionArea = new Element('textArea', {
    		'id' : this.descriptionAreaId,
    		'cols' : '70',
			'rows' : '10'
    	}).update(global.getLabel('Description'));
    	formLine.insert(this.descriptionArea);
    	
    	// Add an empty line
    	/*
formLine = new Element('div', {
    		'class' : 'ticketing_formLine'
    	});
*/
    	formDiv.insert(formLine);
    	return formDiv;
    },
    
    /**
 	 *@description Draw the autocomplete field to select in the list of service groups.
 	 *@param {Object} json Answer from SAP to the service create_new_ticket.
 	 */
    drawServiceGroupList : function (json) {
 		var options = {
			timeout : 500,
			showEverythingOnButtonClick : true,
			templateResult : '#{text}',
			templateOptionsList : '#{text}',
			events: $H({'onResultSelected' : 'EWS:ticketing_group_list_selected'})
 		};
 		
 		var autoCompJson = {
 			autocompleter : {
 				object : $A()
 			}
 		};
 		
 		this.serviceGroupsFromSap = $H();
 		var serviceGroups = $A();
 		if(!Object.isEmpty(json.EWS.o_servicegroup))
 			serviceGroups = objectToArray(json.EWS.o_servicegroup.yglui_str_hw_o_servicegroup);
 		
 		serviceGroups.each(function(serviceGroup) {
 			var object = {
 				text: serviceGroup['@name'], 
		        data: serviceGroup['@service_group_id']
 			}
 			autoCompJson.autocompleter.object.push(object);
 			this.serviceGroupsFromSap.set(serviceGroup['@service_group_id'], serviceGroup.service_list);
 		}.bind(this));
 		
    	this.serviceGroupAutoComp = new JSONAutocompleter(this.serviceGroupAutoCompId, options, autoCompJson);
    	$('options_' + this.serviceGroupAutoCompId).setStyle({'marginLeft': '100px'});
    	
    	// Observe the value modification
    	document.observe('EWS:ticketing_group_list_selected', function(event) {
			try{
				this.virtualHtml.down('[id=iframeFile]').remove();
			}catch(e){}
		
			
    		var args = getArgs(event);
    		// Do nothing if the new value is empty
    		if (args.isEmpty === true) return;
    		
    		// If the user select again the same service group
    		if (this.lastServiceGroup === args.idAdded) return;
    		
    		this.lastServiceGroup = args.idAdded;
    		var services = this.serviceGroupsFromSap.get(args.idAdded);
        	
    		this.closeServiceList();
			this.drawServiceList(objectToArray(services.yglui_str_hw_o_service));
    	}.bindAsEventListener(this));
    },

    /**
 	 *@description Draw the autocomplete field to select in the list of service in a group.
 	 *@param {Array} List of services with the form as in the answer of the service create_new_ticket.
 	 */
    drawServiceList : function (services) {
    	var options = {
			timeout : 500,
			showEverythingOnButtonClick : true,
			templateResult : '#{text}',
			templateOptionsList : '#{text}'
 		};
     		
     	var json = {
 			autocompleter : {
 				object : $A()
 			}
 		};
		if (services.length > 0) {
			services.each(function(service){
				var object = {
					text: service['@name'],
					data: service['@service_id']
				}
				json.autocompleter.object.push(object);
			}.bind(this));
		}
    	this.serviceAutoComp = new JSONAutocompleter(this.serviceAutoCompId, options, json);
    	$('options_' + this.serviceAutoCompId).setStyle({'marginLeft': '100px'});
    },
    
    /**
 	 *@description Delete the auto complete field for the list of services.
 	 */
    closeServiceList : function () {
    	var serviceElem = $(this.serviceAutoCompId);
    	if(!Object.isEmpty(serviceElem.down())) {
    		serviceElem.descendants().collect(function(child) {child.remove()});
    	}
    	this.serviceAutoComp = null;
    },
    
    /**
 	 *@description Delete the auto complete field for the list of service groups.
 	 */
    closeServiceGroupsList : function () {
    	var serviceGrElem = $(this.serviceGroupAutoCompId);
    	if(!Object.isEmpty(serviceGrElem.down())){
    		serviceGrElem.descendants().collect(function(child) {child.remove()});
    	}
    	this.serviceGroupAutoComp = null;
    },
    
    resetNewTicketScreen : function () {
    	this.closeServiceList();
    	this.closeServiceGroupsList();
    	this.descriptionArea.update(global.getLabel('Description'));
    	this.createNewTicket();
    },
    
    /**
 	 *@description Close the screen with New ticket addition.
 	 */
    closeNewTicketScreen : function() {
    	this.closeServiceList();
    	this.closeServiceGroupsList();
    	this.serviceGroupsFromSap = null;
    	this.lastServiceGroup = null;
    	this.descriptionArea.remove();
    	this.addDocumentsDiv.remove();
    	this.backSpan.remove();
    	this.mainDiv.remove();

 //       document.stopObserving('EWS:Ticketing_ticket_create', this.createTicket);
    },
    
    /**
 	 *@description Navigate from the addition of a ticket screen to the tickets display.
 	 */
    goBack : function(refresh) {
    	// Close the screen for the new ticket creation
    	this.closeNewTicketScreen();
    	
    	// Build the filter with previous values
    	this.buildScreenObjects();
		//reset application Title
		this.updateTitle(global.getLabel("My Tickets"));
		
    	this.buildMainScreen(
    			this.filterStartDate.actualDate, 
    			this.filterEndDate.actualDate, 
    			this.filterStatus.options.array[this.filterStatus.lastSelected].get('data'));
    	
    	// If there is a founded list of tickets, build it again
		if (refresh == false) {
			if (!Object.isEmpty(this.ticketListTable)) 
				this.buildTicketList(null);
		}else{
			var selected = this.filterStatus.options.array[this.filterStatus.lastSelected];
			var status = '';
			if (selected) {
				if (Object.isEmpty(selected.get('data')))
					status =  selected.get('text');
				else
					status =  selected.get('data');
			}
			this.getTicketsList(this.filterStartDate.actualDate, this.filterEndDate.actualDate, status);
		}
    	// If there is a founded ticket, display it again
    	if(!Object.isEmpty(this.detailsView)) {
    		this.currentTicketId = this.detailsView.ticketId;
    		this.detailsView.reloadHTMLContent(this.ticketDiv);
    	}
    },
    
    /**
 	 *@description Navigate from the ticket display to the addition of a ticket screen.
 	 */
    goForward : function() {
		// Close the content of the current screen
		this.closeTicketView();
		this.closeTicketsList();
		
		this.mainDiv = this.virtualHtml.down('[id=' + this.mainDivId + ']');
    	if (this.mainDiv) this.mainDiv.remove();
    },
    
    /**
 	 *@description Call the creation of the ticket.
 	 */
    createTicket: function(event){
		try{
			this.virtualHtml.down('[id=iframeFile]').remove();
		}catch(e){}
				
    	var valid = true;
    	var serviceGroup = '';
    	var service = '';
    	var element = null;
    	
    	// Get the service group
    	if(this.serviceGroupAutoComp && !Object.isEmpty(this.serviceGroupAutoComp.lastSelected))
    		serviceGroup = this.serviceGroupAutoComp.options.array[this.serviceGroupAutoComp.lastSelected].get('data');	
    	
    	element = $(this.serviceGroupAutoCompId + 'Label');
    	
    	if(Object.isEmpty(serviceGroup)){
    		valid = false;
    		if(!element.hasClassName('application_main_error_text')) 
    			element.addClassName('application_main_error_text');
    	}
    	else if(element.hasClassName('application_main_error_text'))
    		element.removeClassName('application_main_error_text');
    	
    	
    	// Get the service
    	if(this.serviceAutoComp && !Object.isEmpty(this.serviceAutoComp.lastSelected))
    		service = this.serviceAutoComp.options.array[this.serviceAutoComp.lastSelected].get('data');
    	
    	element = $(this.serviceAutoCompId + 'Label');
    	if(Object.isEmpty(service)){
    		valid = false;
    		if(!element.hasClassName('application_main_error_text')) 
    			element.addClassName('application_main_error_text');
    	}
    	else if(element.hasClassName('application_main_error_text'))
    		element.removeClassName('application_main_error_text');
    	
    	// Get the description
		var description = this.descriptionArea.value.stripScripts().stripTags();
    	
    	element = $(this.descriptionAreaId + 'Label');
    	if(Object.isEmpty(description)) {
    		valid = false;
    		if(!element.hasClassName('application_main_error_text')) 
    			element.addClassName('application_main_error_text');
    	}
    	else if(element.hasClassName('application_main_error_text'))
    		element.removeClassName('application_main_error_text');
    	
    	// Get the list of files
    	var files = $A();
    	if(valid){
			this.addTicket(serviceGroup, service, encodeURIComponent(description));
		}
    },
	
    /**
 	 *@description Success method after the addition of a new ticket.
 	 */
    ticketCreationCompleted : function (json) {
		json.EWS.webmessage_text = global.getLabel("Your ticket was successfully created with ID") + ' ' + objectToArray(json.EWS.o_ticketid)[0];
		json.EWS.webmessage_type = "i";
		this._infoMethod(json);
    	this.goBack(true);
    },
	
	showVersion:function(){
		var versionPopUp = new infoPopUp({
                    closeButton :   $H( {
                        'callBack': function() {
                            versionPopUp.close();
                            delete versionPopUp;
                        }
                    }),
                    htmlContent : 'Version: ' + this.version,
                    indicatorIcon : 'information',                    
                    width: 300
             });
		
		versionPopUp.create();
	}
    	
});

/*------------------------------------------------------------------------------------------------
TICKET DETAILS VIEWER
------------------------------------------------------------------------------------------------*/

/**
*@constructor
*@description Allow the construction of a Ticket details view
*/
var TicketView = Class.create({
	/**
	*@type Element
	*@description Element with the content of the HTML used to display the ticket content.
	*/
	htmlContent: null,
	
	/**
	*@type String
	*@description Identifier of the DIV that contains the description of the ticket.
	*/
	descriptionDivId: 'ticketing_ticketViewDescr_Div',
	
	/**
	*@type String
	*@description Identifier of the DIV that contains the actions of the ticket.
	*/
	actionsDivId: 'ticketing_ticketViewActions_Div',
	
	/**
	*@type String
	*@description Identifier of the DIV that contains the items of the ticket.
	*/
	itemsDivId: 'ticketing_ticketViewItems_Div',
	
	/**
	*@type String
	*@description Id of the expanded ticket.
	*/
	ticketId: null,
	
	/**
	*@type DateParser
	*@description Allow to perform date computations.
	*/
	dateParser: null,
	
	/**
	*@type Object
	*@description Last result used to build the result of ticket details.
	*/
	lastJson: null,
	
	open: false,
	
	/**
	* Initialize the Ticket view.
	*/
	initialize: function(ticketId, dateParser){
		this.ticketId = ticketId;
		this.dateParser = dateParser;
	},
	
	/**
	*@description Methode to call when leaving a ticket view to unload the tableKit.
	*/
	close: function() {
		if(this.open === false) return;
		var table = $(this.ticketId + this.actionsDivId + 'Table');
		if(!Object.isEmpty(table)) 
		TableKit.unloadTable(table);
		if(!Object.isEmpty(this.htmlContent))
		this.htmlContent.remove();
		this.open = false;
	},
	
	/**
	*@description Add the HTML for the ticket view from the last saved result.
	*@param {Element} parentDiv Div to place the HTML content.
	*/
	reloadHTMLContent : function(parentDiv) {
		if(this.open === true) return;
		this.drawTicketView(parentDiv, this.lastJson);
	},
	
	/**
	*@description Add the HTML for the ticket view in the given parent and create the widgets.
	*@param {Element} parentDiv Div to place the HTML content.
	*@param {Object} json Answer of the service get_ticket().
	*/
	drawTicketView: function (parentDiv, json) {
		this.open = true;
		this.lastJson = json;
		
		var options = $H();
		
		this.htmlContent = new Element('div');
		parentDiv.insert(this.htmlContent);
		
		this.buildHTMLContent(json);
		
		// Build the widget to store descriptions
		var widgetTitle = global.getLabel('Ticket') + ' ' + this.ticketId + ': ' + global.getLabel('Detailed View');
		options.set('title', widgetTitle);
		options.set('collapseBut', true);
		options.set('targetDiv', this.descriptionDivId);
		options.set('contentHTML', '');
		
		var descrWidget = new unmWidget(options);
		
		// Add the descriptions inside
		var descriptionWidgetContent = this.htmlContent.down('[id='+this.descriptionDivId+']').down('[id=unmWidgetContent_'+this.descriptionDivId+']');
		descriptionWidgetContent.insert(this.buildDescription(json.EWS.o_ticket));
		descriptionWidgetContent.insert(new Element('div', { 'id' : this.actionsDivId }));
		descriptionWidgetContent.insert(new Element('div', { 'id' : this.itemsDivId }));
				
		// Build the widget to store actions
		options.set('title', global.getLabel('Actions'));
		options.set('targetDiv', this.actionsDivId);
		options.set('onLoadCollapse', true);
		
		var actionsWidget = new unmWidget(options);
		// Add the actions inside
		var actions = $A();
		if(!Object.isEmpty(json.EWS.o_ticket.ticket_action))
			actions = objectToArray(json.EWS.o_ticket.ticket_action.yglui_str_hw_o_action);

		descriptionWidgetContent.down('[id='+this.actionsDivId+']').down('[id=unmWidgetContent_'+this.actionsDivId+']').insert(this.buildActions(actions));
		descriptionWidgetContent.down('[id='+this.actionsDivId+']').insert({before: new Element('span', {'style': 'height:10px;'}).insert("&nbsp;")});
		
		// Build the widget to store actions
		options.set('title', global.getLabel('Items'));
		options.set('targetDiv', this.itemsDivId);
		options.set('onLoadCollapse', true);
		
		var itemsWidget = new unmWidget(options);
		
		var items = $A();
		if(!Object.isEmpty(json.EWS.o_ticket.ticket_item))
			items = objectToArray(json.EWS.o_ticket.ticket_item.yglui_str_hw_o_ticket_item);
		
		descriptionWidgetContent.down('[id='+this.itemsDivId+']').down('[id=unmWidgetContent_'+this.itemsDivId+']').insert(this.buildTktItems(items));
		descriptionWidgetContent.down('[id='+this.itemsDivId+']').insert({before: new Element('span', {'style': 'height:10px;'}).insert("&nbsp;")});
		
		// Create the Sort on the dates
		this.dateParser.addSortDateType();
		
		// Add the table kit for actions
		//var tableKit = TableKit.Sortable.init($(this.ticketId + this.actionsDivId + 'Table'));
	
	},
	
	/**
	*@description Build the HTML for the current ticket view. The generated element
	*				is added in the attribute htmlContent.
	*@param {Object} json Answer of the service get_ticket().
	*/
	buildHTMLContent: function(json) {
		this.htmlContent.insert(this.buildTitle(this.ticketId));
		this.htmlContent.insert(new Element('div', {
			'id' : this.descriptionDivId
		}));
	},
	
	/**
	*@description Build the HTML for the display of the ticket detail title.
	*				The created div is returned to the caller.
	*@param {String} ticketId Id of the ticket to display.
	*@returns Element
	*/	
	buildTitle: function(ticketId) {
		var title = new Element('div', {
			'class' : 'ticketing_ticketViewTitle application_main_title2'
		}).update(' ');
		return title;
	},
	
	/**
	*@description Build the HTML for the display of the ticket detail descriptions.
	*				The created widget div is returned to the caller.
	*@param {Object} jsonDescr Part of the answer of the service get_ticket() with descriptions.
	*@returns Element
	*/	
	buildDescription: function(jsonDescr) {	
		var parentDiv = new Element('div');
		
		parentDiv.insert(this.buildItem(global.getLabel('Ticket ID'), jsonDescr['@ticket_id'], false));
		parentDiv.insert(this.buildItem(global.getLabel('Company'), jsonDescr['@company_name'], false));
		parentDiv.insert(this.buildItem(global.getLabel('Creation date'), this.dateParser.buildDate(jsonDescr['@creation_date'], jsonDescr['@creation_time']), false));
		parentDiv.insert(this.buildItem(global.getLabel('Service group'), jsonDescr['@service_group'], false));
		parentDiv.insert(this.buildItem(global.getLabel('Status'), jsonDescr['@status'], false));
		parentDiv.insert(this.buildItem(global.getLabel('Service'), jsonDescr['@service'], false));
		parentDiv.insert(new Element('div', {'style': 'clear:both; padding-top:10px;'}));
		// DECODE
		parentDiv.insert(this.buildTrimmedDisplayer(global.getLabel('Description'), Url.decode(jsonDescr['@description']).stripScripts().stripTags(), true));
		parentDiv.insert(this.buildTrimmedDisplayer(global.getLabel('Solution'), Url.decode(jsonDescr['@solution']).stripScripts().stripTags(), true));
		//parentDiv.insert(this.buildTrimmedDisplayer(global.getLabel('Description'), decodeURI(jsonDescr['@description']).stripScripts().stripTags(), true));
		//parentDiv.insert(this.buildTrimmedDisplayer(global.getLabel('Solution'), decodeURI(jsonDescr['@solution']).stripScripts().stripTags(), true));
		
		parentDiv.insert(new Element('div', {'style': 'clear:both; padding:5px'}));
		
		return parentDiv;
	},
	
	/**
	*@description Build a field in the description of the ticket view.
	*@param {String} label Label to display as title line.
	*@param {String} value Value of the element to add in the screen.
	*@param {Boolean} allLine Is the item to display on the all line width.
	*@returns Element
	*/	
	buildItem: function(label, value, allLine) {
		var valueClass = 'ticketing_ticketViewItemValue';
		var itemClass  = 'ticketing_ticketViewItemsLabel';
		var itemDiv = new Element('div');
		
		if (allLine) 
			itemDiv.setStyle({'width': '100%'});
		else {
			itemDiv.setStyle({'width': '50%', 'float' : 'left'});
			valueClass += ' ticketing_ticketViewItemValueShort';
			itemClass += ' ticketing_ticketViewItemNameShort';
		}
		
		if(Object.isEmpty(label) && Object.isEmpty(value))
			itemDiv.setStyle({'height': '10px'});
		if (!Object.isEmpty(label)) {
			itemDiv.insert(new Element('div', {
				'class': itemClass
			}).update((global.getLabel(label) + ":")));
		}else{
			itemDiv.insert(new Element('div', {
				'class' : itemClass
			}).update((global.getLabel(label)+ ":")));
		}
		if (!Object.isEmpty(value) && value != 'null' ) {
			itemDiv.insert(new Element('div', {
				'class': valueClass
			}).update(value));
		}else{
			itemDiv.insert(new Element('div', {
				'class': valueClass
			}).update(' '));
		}
		
		return itemDiv;
	},
	
	buildTrimmedDisplayer:function(label, value, trimed){
		var valueClass = 'ticketing_ticketViewItemValue';
		var itemClass  = 'ticketing_ticketViewItemsLabel';
		var itemDiv = new Element('div');
		
		itemDiv.setStyle({'width': '100%'});
		
		if(Object.isEmpty(label) && Object.isEmpty(value))
			itemDiv.setStyle({'height': '10px'});
		if (!Object.isEmpty(label)) {
			itemDiv.insert(new Element('div', {
				'class': itemClass
			}).update((global.getLabel(label) + ":")));
		}else{
			itemDiv.insert(new Element('div', {
				'class' : itemClass
			}).update((global.getLabel(label)+ ":")));
		}
		if (!Object.isEmpty(value) && value != 'null' ) {
			if (trimed && value.length > 500){
				var displayedValue = value.substring(0,500)+ "...";
				itemDiv.insert(new Element('div', {
					'class': valueClass
				}).update(displayedValue));
				
				var viewMore = new Element('div',{
					'class': 'application_action_link',
					'style': 'float:right; width:100%; text-align:right;'
				}).update(global.getLabel("Show More"));
				
				itemDiv.down('[class='+ valueClass +']').insert({after: viewMore});
				
				viewMore.observe('click', function(){
						this.showFullDescription(value, itemDiv);
					}.bindAsEventListener(this));
		
				
			}else{
				itemDiv.insert(new Element('div', {
					'class': valueClass
				}).update(value));
				
				
				if (value.length > 500) {
					var viewLess = new Element('div',{
						'class': 'application_action_link',
						'style': 'float:right; width:100%; text-align:right;'
					}).update(global.getLabel("Show Less"));
				
					itemDiv.down('[class=' + valueClass + ']').insert({
						after: viewLess
					});
					
					viewLess.observe('click', function(){
						this.showTrimedDescription(value, itemDiv);
					}.bindAsEventListener(this));
				}
			}
		}else{
			itemDiv.insert(new Element('div', {
				'class': valueClass
			}).update(' '));
		}
		return itemDiv;
	},
	
	showFullDescription: function(description, container){
		container.update(this.buildTrimmedDisplayer(global.getLabel('Description'), description, false));
	},
	
	showTrimedDescription:function(description, container){
		container.update(this.buildTrimmedDisplayer(global.getLabel('Description'), description, true));
	},
	
	/**
	*@description Build the HTML for the display of the ticket detail actions.
	*				The created widget div is returned to the caller.
	*@param {Array} actions List of the actions returned by the service get_ticket().
	*@returns Element
	*/	
	buildActions: function(actions) {
		var table = new Element('table', {
			'id' : this.ticketId + this.actionsDivId + 'Table',
			'style' : 'width:100%;',
			'cellSpacing' : '0px;'			
		});
		
		var thead = new Element('thead');
		table.insert(thead);
		var tr = new Element('tr');
		thead.insert(tr);
		tr.insert(new Element('th').update(global.getLabel('Creator')));
		tr.insert(new Element('th').update(global.getLabel('Date')));
		tr.insert(new Element('th').update(global.getLabel('Description')));

		
		var tbody = new Element('tbody'); 
		table.insert(tbody);
		
		actions.each(function(action){
			tr = new Element('tr');
			tbody.insert(tr);
			tr.insert(new Element('td').update(action['@sc_agent_name']));
			tr.insert(new Element('td').update(this.dateParser.buildDate(action['@action_date'], action['@action_time'])));
			// DECODE
			tr.insert(new Element('td').update(Url.decode(action['@description'])));
			//tr.insert(new Element('td').update(decodeURI(action['@description'])));

			var td = new Element('td', { 'actionId' : action['@action_id']});
			tr.insert(td);


		}.bind(this));
		
		return table;
	},
	
	
	buildTktItems:function(items){
		if (!Object.isEmpty(items) && items.size() > 0) {
			var table = new Element('table', {
				'id': this.ticketId + this.itemsDivId + 'Table',
				'style': 'width:100%;'
			});
			var thead = new Element('thead');
			table.insert(thead);
			var tr = new Element('tr');
			thead.insert(tr);
			tr.insert(new Element('th').update(global.getLabel('Filename')));
			tr.insert(new Element('th').update(global.getLabel('Description')));
			
			var tbody = new Element('tbody');
			table.insert(tbody);
			var itemDescription;
			items.each(function(item){
				tr = new Element('tr');
				tbody.insert(tr);
				var td = new Element('td', { 'itemId': item['@ticket_item_id']});
				td.insert( new Element('span', { 'class' : 'application_action_link', 'itemId': item['@ticket_item_id']}).update(item['@filename']));
			  	td.observe('click', this.openDocument.bindAsEventListener(this));
				tr.insert(td);
				// DECODE
				itemDescription = Url.decode(item['@description']);
				//itemDescription = decodeURI(item['@description']);
				if (itemDescription == 'null'){
					itemDescription = '';
				}else if (itemDescription.length > 50){
					itemDescription = itemDescription.substring(0,47) + '...';
				}
				tr.insert(new Element('td').update(itemDescription));
			}.bind(this));
			
			return table;
		}
		else
			return global.getLabel("No item found");
	},
	
	openDocument: function(event) {
		
		try{
			this.virtualHtml.down('[id=iframeFile]').remove();
		}catch(e){}
		
		
		var element = Event.element(event);
		var itemId = element.readAttribute('itemId');
		
		document.fire('EWS:ticketing_download_document', $H({
			'ticketId' : this.ticketId,
			'itemId' : itemId
		}));
	}
});
	
/**
*@constructor
*@description Manage the dates and times parameters.
*/
	
var TicketingDateParser = Class.create({ 
	
	initialize: function() {},
	
	/**
	*@description Get the text to display time in a text fields
	*@param {String} sapTime Time with the SAP format.
	*@returns String
	*/
	buildTime : function (sapTime) {
		var date = new Date();
		
		var offset = date.getUTCOffset();
		var offsetSign = offset.substring(0,1);
		var offsetHour = parseInt(offset.substring(1,3), 10);
		var offsetMin  = parseInt(offset.substring(3,5), 10);
		
		var hour; 
		var min;
		var dayOffset = 0;
		
		if (offsetSign == '+'){
			min = parseInt(sapTime.substr(3, 2),10) + offsetMin;
			if (min%60 != min){
				offsetHour += 1;
				min -= 60;
			}
			hour = parseInt(sapTime.substr(0, 2),10) + offsetHour;
			if (hour%24 != hour){
				dayOffset = 1;
				hour -= 24;
			}
		}else{
			min = parseInt(sapTime.substr(3, 2),10) - offsetMin;
			if (min%60 != min){
				offsetHour -= 1;
				min += 60;
			}
			hour = parseInt(sapTime.substr(0, 2),10) - offsetHour;
			if (hour%24 != hour){
				dayOffset = -1;
				hour += 24;
			}
		}
		
		date.setHours(hour);
		date.setMinutes(min);
		date.setSeconds(sapTime.substr(6, 2));
		
		
		return { date: date.toString(global.hourFormat),
			   	 dayOffset : dayOffset,
				 offsetSign : offsetSign
			   };
	},
	
	/**
	*@description Get the text to display date and time in a text fields
	*@param {String} sapDate Date with the SAP format.
	*@param {String} sapTime Time with the SAP format.
	*@returns String
	*/
	buildDate: function(sapDate, sapTime) {	
		var formattedTime = this.buildTime(sapTime);
		var datum;
		
		if (formattedTime.dayOffset != 0){
				datum = Date.parseExact(sapDate, "yyyy-MM-dd");
				datum.addDays(formattedTime.dayOffset);
				sapDate = objectToSap(datum);
		}
		return sapToDisplayFormat(sapDate) + ' ' + formattedTime.date;	
	},
	
	addSortDateType: function() {
		// If there is already the type, nothing to do
		if (!Object.isEmpty(TableKit.Sortable.types.dateTickets)) return;
		
		// Build the pattern;
		var pattern = global.dateFormat.gsub(/(\.{1}|\\{1})/, function(match) {
		return '\\' + match[0]
		}).gsub(/[dDmMyY]{1}/, '\\d');
		pattern += '\\s';
		pattern += global.hourFormat.gsub(/[HhMs]{2}/, '\\d{2}').gsub(/[HhMs]{1}/, '\\d').gsub(/[tT]{1,2}/, '(AM|PM|am|pm|a|p|A|P)');
		pattern = '^' + pattern + '$';
		
		TableKit.Sortable.addSortType(
			new TableKit.Sortable.Type('dateTickets', {
				pattern : new RegExp(pattern),
				normal : function(value) {
					var dateFormat = global.dateFormat.toUpperCase();
					
					var position = dateFormat.indexOf('YYYY');
					var year = value.substr(position, 4);
					position = dateFormat.indexOf('MM');
					var month = value.substr(position, 2);
					position = dateFormat.indexOf('DD');
					var day = value.substr(position, 2);
					
					var offsetPosition = new Number(value.indexOf(' ') + 1);
					
					var hourFormat = global.hourFormat.toUpperCase();
					
					position = hourFormat.indexOf('HH');
					var hour =  value.substr(offsetPosition + position, 2);
					position = hourFormat.indexOf('MM');
					var min =  value.substr(offsetPosition + position, 2);
					position = hourFormat.indexOf('SS');
					var sec =  value.substr(offsetPosition + position, 2);
					
					if(global.hourFormat.match(/h{1,2}/)) {
						position = hourFormat.indexOf('TT');
						if(position)
							var ampm = value.substr(offsetPosition + position, 2);
						else {
							position = hourFormat.indexOf('T');
							var ampm = value.substr(offsetPosition + position, 1);
						}
							if(ampm.match(/pm|PM|p|P/) && hour < 12 && hour > 0)
								hour = (new Number(hour) + 12).toString();
					}
					
					return new Date(year, month, day, hour, min, sec, 0).valueOf();
				}
			})
		);
	},
	
	getLastMonthDates: function() {
		var lastMontDates = { beginDate: new Date(), endDate: new Date()};

		var date = Date.today().addMonths(-1);
		lastMontDates.beginDate = date.moveToFirstDayOfMonth().clone();
		lastMontDates.endDate = date.moveToLastDayOfMonth().clone();
		
		return lastMontDates;
	},
	
	getCurrentMonthDates: function() {
		var MonthDates = { beginDate: new Date(), endDate: new Date()};

		var date = Date.today();
		MonthDates.beginDate = date.moveToFirstDayOfMonth().clone();
		MonthDates.endDate = date.moveToLastDayOfMonth().clone();
		
		return MonthDates;
	}
});
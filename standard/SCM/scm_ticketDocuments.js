/**
 * @class
 * @description Manage the display of the list of documents in a ticket
 * @augments Application
 * @author jonathanj & nicolasl
 * @version 1.1
 * <br/>Changes for version 1.1:<br/>
 * <ul>
 * <li>Remove the iframe used to upload documents when close</li>
 * <li>Format the title as in the ticket properties</li>
 * </ul>
 */
var scm_ticketDocuments = Class.create(Application, /** @lends scm_ticketDocuments.prototype */{

    /**
     * @type SCM_Ticket 
     * Parameters of the ticket under display
     * @since 1.0
     */
    _ticket: null,

    /**
     * @type Hash
     * Store the removed items from the left menu by the application
     * @since 1.0
     */
    _toAddToMenu: null,

    /**
     * @type Boolean
     * Is the ticket currently in edit or view mode
     * @since 1.0
     */
    _editMode: null,
	
	/**
     * @description Constructor.
     * @param {JSON Object} args Initialization options.
     * @since 1.0
     */
    initialize: function($super, args) {
        $super(args);

        this._editMode = false;
        this._toAddToMenu = $H();
    },

    /**
	 * Function that is called when the application is displayed to update the left menu, 
	 * collect the global information and build the display of the screen. 
	 * @param {Object} args The arguments given during the call
	 * @since 1.0
	 * <br/> Modified for 1.1:
	 * <ul>
	 * <li>Format the title as in the ticket properties</li>
	 * </ul>
	 */
    run: function($super, args) {
        $super(args);

        this._toAddToMenu = $H();
        if (global.tabid_leftmenus.get('PL_TIK').get('TIACT'))
            this._toAddToMenu.set('TIACT', global.tabid_leftmenus.get('PL_TIK').unset('TIACT'));
        if (global.tabid_leftmenus.get('PL_TIK').get('TIGROU'))
            this._toAddToMenu.set('TIGROU', global.tabid_leftmenus.get('PL_TIK').unset('TIGROU'));

        this._editMode = getArgs(args).get('editMode');
        var newTicketId = getArgs(args).get('ticketId');

        //Get the loaded ticket
        var oldTicketId = '';
        if (this._ticket) oldTicketId = this._ticket.getValue('TICKET_ID');
		if (getArgs(args).get('refresDocList') === true) {
			oldTicketId = '';
			document.fire('EWS:SCM_ticketApp_AddParam', {name: 'refresDocList', value: null});
		}
		
        var newService = getArgs(args).get('service');
        var newCompany = getArgs(args).get('company');

        //If the ticket changed => update the screen content
        if (oldTicketId !== newTicketId) {
            this._ticket = SCM_Ticket.factory('DisplayDocs');
            this._ticket.serviceId = newService;
            this._ticket.companyId = newCompany;
            //Update the title
			//since 1.1 Modify the title to match the ticket properties
            this.updateTitle(global.getLabel('Docs_for_ticket') + ' - <i>' + newTicketId + '</i>');

            //Remove the undesired elements
            this.getMainDiv().update();
            this._ticket.removeDocumentTypes();

            //Update the list of documents
            this.getTicketLastActions(newTicketId);

            //Update the list of document types
            this.getTicketListDocumentTypes();
        } else if (this._ticket.companyId !== newCompany || this._ticket.serviceId !== newService) {
            this._ticket.serviceId = newService;
            this._ticket.companyId = newCompany;

            //Remove the undesired elements
            this._ticket.removeDocumentTypes();
            this.getMainDiv().update();

            //Update the list of document types and display again
            this.getTicketListDocumentTypes();
            this.getTicketLastActionsHandler();
        } else if (this._editMode === true) {
            this.addAddDocumentButton();
            this.addDocTypeEditLinks();
        } else {
            this.removeAddDocumentButton();
            this.removeDocTypeEditLinks();
        }
    },

    /**
	 * Reset the parameters created in run.
	 * @since 1.0
	 */
    close: function($super) {
        $super();
        global.tabid_leftmenus.set('PL_TIK', global.tabid_leftmenus.get('PL_TIK').merge(this._toAddToMenu));
        this._toAddToMenu = $H();
		document.stopObserving('EWS:SCM_ListDocumentsToUpdate');
		//since 1.1 Remove the iframe that display documents
		var iframe = this.virtualHtml.down('iframe#SCM_ticketDocOpener');
		if(iframe) iframe.remove();
    },

    /**
     * @param {String} ticketId Id of the ticket we are looking for.
     * @description Get the list of additional informations for a ticket and display it on the screen.
     * @since 1.0
     * @see scm_pool#getTicketLastActionsHandler
     */
    getTicketLastActions: function(ticketId) {
        hrwEngine.callBackend(this, 'Ticket.GetTicketById', $H({
            scAgentId: hrwEngine.scAgentId,
            ticketId: ticketId
        }), this.getTicketLastActionsHandler.bind(this));
    },

    /**
     * @description Get the list of document types that are available for the ticket.
     * @since 1.0
     * @see scm_ticketDocuments#getTicketLastActionsHandler
     */
    getTicketListDocumentTypes: function() {
        if(this._ticket.companyId >= 0 && this._ticket.serviceId >= 0)
			hrwEngine.callBackend(this, 'Ticket.CollectDocumentTypes', $H({
	            scAgentId		: hrwEngine.scAgentId,
	            companyskillid	: this._ticket.companyId,
	            serviceSkillId	: this._ticket.serviceId
	        }), this.getTicketDocumentTypesHandler.bind(this));
		else	
			this._ticket.addDocumentTypes();
    },

    /**
     * @param {String} ticketId Id of the ticket we would like to modify.
     * @param {String} itemId Id to identify the document in the ticket
     * @param {String} docTypeId Id of the new document type
     * @param {String} docType Textual description of the document type
     * @param {String} docTypeElemId Id of the clicked element
     * @description Get the list of document types that are available for the ticket.
     * @since 1.0
     * @see scm_ticketDocuments#saveNewDocumentTypeHandler
     */
    saveNewDocumentType: function(ticketId, itemId, docTypeId, docType, docTypeElemId) {
        hrwEngine.callBackend(this, 'Ticket.ChangeTicketItemDocumentType', $H({
            scAgentId: hrwEngine.scAgentId,
            ticketId: ticketId,
            ticketItemId: itemId,
            documentType: docTypeId
        }), this.saveNewDocumentTypeHandler.bind(this, ticketId, itemId, docTypeId, docType, docTypeElemId));
    },

    /**
     * @param {JSON Object} infoJson List of ticket info from the backend
     * @description Get the list of additional informations for a ticket and display it on the screen.
     * @since 1.0
     * <br/>Modified in version 1.1:
	 * <ul>
	 * <li>Remove the call to the manage heartBeat</li>
	 * </ul>
     */
    getTicketLastActionsHandler: function(infoJson) {
		if (!Object.isEmpty(infoJson)) {
            this._ticket.ticketId = infoJson.EWS.HrwResponse.HrwResult.HrwTicket.TicketId;
            this._ticket.addLastDocs(infoJson.EWS.HrwResponse.HrwResult.HrwTicket.HrwTicketItems);
        }

        if (this._ticket.documentsTypesLoaded())
            this.updateDocumentList();
        else
            new PeriodicalExecuter(function(pe) {
                if (!this._ticket.documentsTypesLoaded()) return
                pe.stop();
                this.updateDocumentList();
            } .bind(this), 1);

    },

    /**
     * @param {JSON Object} infoJson List of ticket document types from the backend
     * @description Get the list of document types for a ticket and display it on the screen.
     * @since 1.0
     * <br/>Modified in version 1.1:
	 * <ul>
	 * <li>Remove the call to the manage heartBeat</li>
	 * </ul>
     * @see scm_ticketDocuments#getTicketListDocumentTypes
     */
    getTicketDocumentTypesHandler: function(infoJson) {
        this._ticket.addDocumentTypes(infoJson);
    },

    /**
     * @param {Object} infoJson List of ticket document types from the backend
     * @description Update the document type in the display.
     * @since 1.0
     * <br/>Modified in version 1.1:
	 * <ul>
	 * <li>Remove the call to the manage heartBeat</li>
	 * </ul>
     * @see scm_ticketDocuments#saveNewDocumentType
     */
    saveNewDocumentTypeHandler: function(ticketId, itemId, docTypeId, docType, docTypeElemId, infoJson) {
        var item = this.virtualHtml.down('span#' + docTypeElemId);
        if (Object.isEmpty(item)) return;

        //Update the document type in the list
        item.writeAttribute('doctypeid', docTypeId);
        item.writeAttribute('title', docType);
        item.update(docType.truncate(20));

        //Update the related event
        item.stopObserving('click');
        item.observe('click',
			this.updateDocumentType.bind(this,
						item.readAttribute('ticketid'),
						item.readAttribute('itemid'),
						item.readAttribute('doctypeid'),
						item.readAttribute('title'),
						docTypeElemId));
    },

    /**
     * @description Get the div used to store documents list
     * @return {Element} HTML div that contains the list of documents
     * @since 1.0
     */
    getMainDiv: function() {
        var mainDiv = this.virtualHtml.down('[id="SCM_ticketDocumentsShow"]');
        if (Object.isEmpty(mainDiv)) {
            this.virtualHtml.insert('<div class="application_clear_line"> </div>'
								+ '<div id="SCM_ticketDocumentsShow"> </div>'
								+ '<div class="application_clear_line"> </div>');
            mainDiv = this.virtualHtml.down('[id="SCM_ticketDocumentsShow"]');
        }
        return mainDiv;
    },

    /**
     * @description Remove the add document button
     * @since 1.0
     */
    removeAddDocumentButton: function() {
        var addDocButton = this.getMainDiv().down('[id="SCM_ticketDocs_AddDocument"]');
        if (addDocButton) addDocButton.remove();
    },

    /**
     * @description Add the add document button for display
     * @returns {Boolean} Is there a change for the button
     * @since 1.0
     */
    addAddDocumentButton: function() {
        //Check if the button is there
        if (this.getMainDiv().down('[id="SCM_ticketDocs_AddDocument"]'))
            return false;
        //Set the button to add in the document
        var buttons = new megaButtonDisplayer({ elements: $A([{
	            label: global.getLabel('Add_document'),
	            handler: this.addDocument.bind(this),
	            type: 'button',
	            idButton: 'SCM_ticketDocs_AddDocument',
	            standardButton: true
			}])
        });

        this.getMainDiv().insert(buttons.getButtons());
        return true;
    },
	
	/**
     * @description Add the refresh buttons For the list of documents
     * @returns {Boolean} Is there a change for the button?
     * @since 1.0
     */
	addRefreshButton: function() {
		//Check if the button is there
        if (this.getMainDiv().down('[id="SCM_ticketDocs_Refresh"]'))
            return false;
		
		//Set the button to add in the document
        var buttons = new megaButtonDisplayer({ elements: $A([{
	            label: global.getLabel('Refresh'),
	            handler: function() {
					//Remove the screen content
            		this.getMainDiv().update();
		            //Update the list of documents
		            this.getTicketLastActions(this._ticket.getValue('TICKET_ID'));
				}.bind(this),
	            type: 'button',
	            idButton: 'SCM_ticketDocs_Refresh',
	            standardButton: true
			}])
        });

        this.getMainDiv().insert(buttons.getButtons());
        return true;
	},
	
    /**
     * @description Add the links to edit the document types.
     * @since 1.0
     */
    addDocTypeEditLinks: function() {
        if (this._ticket.noDocumentTypes()) return;
        this.virtualHtml.select('span.SCM_ticketDocumentsDocType').each(function(item) {
            if (!item.hasClassName('application_action_link'))
                item.addClassName('application_action_link')
            item.stopObserving('click');
            item.observe('click',
				this.updateDocumentType.bind(this,
						item.readAttribute('ticketid'),
						item.readAttribute('itemid'),
						item.readAttribute('doctypeid'),
						item.readAttribute('title'),
						item.identify()));
        } .bind(this));
    },

    /**
     * @description Remove the links to edit the document types.
     * @since 1.0
     */
    removeDocTypeEditLinks: function() {
        this.virtualHtml.select('span.SCM_ticketDocumentsDocType').each(function(item) {
            item.removeClassName('application_action_link');
            item.stopObserving('click');
        } .bind(this));
    },

    /**
     * @description Build the grid with the list of documents.
     * @since 1.0
     */
    updateDocumentList: function() {
        var mainDiv = this.getMainDiv();
        var num = 1;
        var documents = $A();
        var currTicket = this._ticket._getLastDoc(0);
        var ticketLink;

        //If there is no documents => write it.
        if (currTicket.id === '') {
            mainDiv.insert('<div class="application_main_soft_text">' + global.getLabel('No_documents') + '</div>');
            if (this._editMode === true)
                this.addAddDocumentButton();
            this.addRefreshButton();
			return;
        }

        //Update the list of documents
        while (currTicket.id !== '') {
            var columns;
            if (this._ticket.noDocumentTypes() === true)
                columns = [
					{ fieldId: 'date_' + currTicket.id, value: currTicket.date }
				];
            else
                columns = [
					{ fieldId: 'docType_' + currTicket.id, value: '<span ticketid="' + this._ticket.getValue('TICKET_ID') + '" itemid="' + currTicket.id + '" title="' + currTicket.docType + '" doctypeid="' + currTicket.docTypeId + '" class="SCM_ticketDocumentsDocType">' + currTicket.docType.truncate(20) + '</span>' },
					{ fieldId: 'date_' + currTicket.id, value: currTicket.date }
				];

            //Add the document in the list
            documents.push({
                id		: (currTicket.parent === '-1') ? currTicket.id : currTicket.parent + '_' + currTicket.id,
                groupBy	: currTicket.parent,
                value	: '<div mimetype="' + currTicket.mimeType + '" ext="' + currTicket.extension + '" ticketid="' + this._ticket.getValue('TICKET_ID') + '" itemid="' + currTicket.id + '" title="' + currTicket.name + '" class="application_action_link SCM_ticketDocumentsTitle">' + currTicket.name.truncate(60) + '</div>',
                icon	: currTicket.iconType,
                columns	: columns
            });
            //Go to the next ticket
            currTicket = this._ticket._getLastDoc(num++);
        }
        var sortedDoc = $A();

        //Check the root and leaf nodes
        var elems = this._getLevel(documents);

        //Add the root nodes
        documents.each(function(docElem) {
            if (elems.roots.indexOf(docElem.id) >= 0)
                sortedDoc.push(docElem);
        } .bind(this));

        //Add the leaf nodes
        documents.each(function(docElem) {
            if (elems.leafs.indexOf(docElem.id) >= 0)
                sortedDoc.push(docElem);
        } .bind(this));

        //Create the list of documents
        var header;
        if (this._ticket.noDocumentTypes() === true)
            header = [
				{ column: global.getLabel('Name') },
				{ column: global.getLabel('Date') }
			];
        else
            header = [
				{ column: global.getLabel('Name') },
				{ column: global.getLabel('DocumentType') },
				{ column: global.getLabel('Date') }
			];

        var table = new groupedLayout({
            headers: header,
            elements: sortedDoc,
            parentUseCols: true
        }, mainDiv);

        table.buildGroupLayout();
        this.addEvents();
        if (this._editMode === true)
            this.addAddDocumentButton();
		this.addRefreshButton();
    },

    /**
     * @param {Array} elements List of elements to sort
     * @description Give the elements of each element root of leaf
     * @returns {JSON Object} List of roots and leaf nodes
     * @since 1.0
     */
    _getLevel: function(elements) {
        var roots = $A();
        var leafs = $A();

        elements.each(function(element) {
            if (element.groupBy >= 0) {
                roots.push(element.groupBy);
                roots = roots.without(element.id);
                leafs.push(element.id);
            } else
                roots.push(element.id);
        } .bind(this));

        return {roots: roots.uniq(), leafs: leafs.uniq()};
    },

    /**
     * @description Add a new document in HRW
     * @since 1.0
     * @see ticketActionPopupScreens#showAddItemPopup
     */
    addDocument: function() {
        new ticketActionPopupScreens().showAddItemPopup(this._ticket.getValue('TICKET_ID'), this._ticket, this);

		//Check if the list of documents is to update
		document.observe('EWS:SCM_ListDocumentsToUpdate', function() {
			//Reset the list of documents
        	this.getMainDiv().update();
        	//Update the list of documents
        	this.getTicketLastActions(this._ticket.getValue('TICKET_ID'));
			
			document.stopObserving('EWS:SCM_ListDocumentsToUpdate');
		}.bindAsEventListener(this));
    },

    /**
    * @description Add the events associated to the display of the document.
    * @since 1.0
    */
    addEvents: function() {
        this.getMainDiv().select('tr').each(function(line) {
            var item = line.down('div.SCM_ticketDocumentsTitle');
            if (Object.isEmpty(item)) return;

            item.observe('click',
				this.openDocument.bind(this,
							item.readAttribute('ticketid'),
							item.readAttribute('itemid'),
							item.readAttribute('title'),
							item.readAttribute('ext'),
							item.readAttribute('mimetype')));

            if (this._editMode === true && !this._ticket.noDocumentTypes() && item.innerHTML !== '') {
                item = line.down('span.SCM_ticketDocumentsDocType');

                item.addClassName('application_action_link')
                item.observe('click',
					this.updateDocumentType.bind(this,
								item.readAttribute('ticketid'),
								item.readAttribute('itemid'),
								item.readAttribute('doctypeid'),
								item.readAttribute('title'),
								item.identify()));
            }

        } .bind(this));
    },

    /**
    * @param {String} ticketId Id of the concerned ticket
    * @param {String} ticketNumId Id of the item in the ticket
    * @param {String} title Title of the document
    * @param {String} docExtension Extension of the document
    * @param {String} mimeType Mime type of the document to open
    * @description Build the HTML content to download a document
    * @since 1.0
    */
    openDocument: function(ticketId, ticketNumId, title, docExtension, mimeType) {
        //Build the request to send
        var request = '<EWS>'
            		+ 	'<SERVICE>HRW_ATTGET</SERVICE>'
					+ 	'<PARAM>'
            		+ 		'<I_AGENTID>' 	+ hrwEngine.scAgentId 	+ '</I_AGENTID>'
            		+ 		'<I_TICKETID>' 	+ ticketId 				+ '</I_TICKETID>'
					+		'<I_ITEMID>' 	+ ticketNumId 			+ '</I_ITEMID>'
					+		'<I_FILENAME>' 	+ title 				+ '</I_FILENAME>'
					+ 		'<I_MIMETYPE>' 	+ mimeType 				+ '</I_MIMETYPE>'
					+ 	'</PARAM>'
					+ '</EWS>';

        if (Object.isEmpty(this.getMainDiv().down('[id="SCM_ticketDocOpener"]')))
            this.getMainDiv().insert('<iframe id="SCM_ticketDocOpener" style="display:none;"></iframe>');

        //Build the URL to call
        var url = this.url;
        while (('url' in url.toQueryParams())) { url = url.toQueryParams().url; }
        url = (Object.isEmpty(Object.values(((url).toQueryParams()))[0])) ? url + '?xml_in=' : url + '&xml_in=';
        //Place the document in the created iframe
        this.getMainDiv().down('[id="SCM_ticketDocOpener"]').src = url + request;
    },

    /**
    * @param {String} ticketId Id of the concerned ticket
    * @param {String} ticketNumId Id of the item in the ticket
    * @param {String} docTypeId Current ID of the document type
    * @param {String} docTypeText Description of the current document type
    * @param {String} docTypeElemId Id of the element with the doc type
    * @description Build the popup to allow modifing the document type.
    * @since 1.0
    */
    updateDocumentType: function(ticketId, itemId, docTypeId, docTypeText, docTypeElemId) {
        //Function if the user cancelled
        var cancelFunction = function() {
            updateDocTypePopup.close();
            delete updateDocTypePopup;
        };

        //Function if the user approved
        var updateFunction = function() {
            var selectedItem = selectionBox.getSelection();
            var selectedDocTypeId = selectedItem.keys()[0];
            if (selectedDocTypeId !== docTypeId)
                this.saveNewDocumentType(ticketId, itemId, selectedDocTypeId, selectedItem.get(selectedDocTypeId), docTypeElemId);
            cancelFunction();
        } .bind(this);

        //Set the main popup schema
        var popupContent = new Element('div', { 'id': 'SCM_ticketDocumentsModDocType' }).update(
				'<span id="SCM_ticketDocumentsModDocTypeLabel" class="SCM_ticketPopup_title">' + global.getLabel('DocumentType') + '</span>'
			+ '<div id="SCM_ticketDocumentsModDocTypeValues"> </div>'
			+ '<div id="SCM_ticketDocumentsModDocTypeButtons"> </div>'
		);

        //Add the buttons in the popup
        popupContent.down('[id="SCM_ticketDocumentsModDocTypeButtons"]').insert(
			new megaButtonDisplayer({
			    elements: [
					{
					    idButton: 'SCM_ticketDocumentsModDocTypeButtonCancel',
					    label: global.getLabel('Cancel'),
					    className: 'moduleInfoPopUp_stdButton',
					    handler: cancelFunction,
					    type: 'button',
					    standardButton: true
					}, {
					    idButton: 'SCM_ticketDocumentsModDocTypeButtonSave',
					    label: global.getLabel('UpdateDocType'),
					    className: 'moduleInfoPopUp_stdButton',
					    handler: updateFunction,
					    type: 'button',
					    standardButton: true
					}
				],
			    mainClass: ''
			}).getButtons());

        //Add the selection box
        var selectionBox = new SCM_SelectionBox({
            width: 300,
            height: 150,
            selectSingle: true,
            fitToSize: true
        });

        if (docTypeId.blank())
            selectionBox.setValues(this._ticket.getDocumentsTypes(true));
        else
            selectionBox.setValues(this._ticket.getDocumentsTypes(), docTypeId);

        popupContent.down('[id="SCM_ticketDocumentsModDocTypeValues"]').insert(selectionBox.getBox());

        //Create the popup
        var updateDocTypePopup = new infoPopUp({
            closeButton: $H({ 'callBack': cancelFunction }),
            htmlContent: popupContent,
            indicatorIcon: 'question',
            width: 400
        });
        updateDocTypePopup.create();

    }
});

/**
 * @class
 * @description Subclass of the upload module to integrate the notion of cancel
 * @author jonathanj & nicolasl
 * @version 2.0
 * <br/>Changed for 2.0:
 * <ul>
 * <li>Use a constant for empty HRW values</li>
 * </ul>
 * <br/>Changes from version 1.0:
 * <ul>
 * <li>Manage new error code 4 and any other new one</li>
 * </ul>
 */

var UploadModule_SCM = new Class.create(UploadModule, /** @lends UploadModule_SCM.prototype */{
	
	/**
     * @type Boolean
     * @default false
     * Is the upload cancelled
     * @since 1.0
     */
	_cancelled: null,
	
	/**
     * @type String
     * Name of the file to upload on the local disk
     * @since 1.0
     */	
	_fileName: null,
	
	/**
     * @type String
     * The privacy parameter of the document
     * @since 1.0
     */
	_privacy: null,
	
	/**
     * @type String
     * Name of the file in HRW
     * @since 1.0
     */	
	_fileId: null,
	
	/**
     * @type String
     * Doc type of the uploaded document
     * @since 1.0
     */	
	_docType: null,
	
	/**
	 * Class constructor that calls the parent
	 * @param {Object} $super The parent class
	 * @param {Object} args The arguments given when to constructor is called
	 * @since 1.0
	 */	
	initialize: function($super, target, app_id){
		$super(target, app_id, 'SCM_UPLOAD_DOC', true, this.confirmSend.bind(this), {
			I_V_APPID		: app_id			,
			I_V_PERSNO		: global.objectId	});		
	},
	
	/**
	 * Extend the parent method by adding an observ on the file selection
	 * @param {String} javaSession The java session number
	 * @since 1.0
	 */
	buildUpload: function($super, javaSession) {
		$super(javaSession);
		
		this._cancelled = false;
		this.targetDiv.down('input[type="file"]').observe('change', function(event) {
			document.fire('EWS:SCM_uploadDocumentSelected', event);
		});
	},
	
	/**
	 * Fill in the file parameters from the upload confirmation message
	 * @param {String} xmlStringItem XML string with the parameters of the uploaded file
	 * @since 1.0
	 */
	confirmSend: function(xmlStringItem) {
		//Parsing of the XML
		var xml = new XML.ObjTree();
        xml.attr_prefix = '@';
        var jsonItem = xml.parseXML(xmlStringItem);
        
		//since 2.0 Use a constant for the absence of value
		this._privacy	= HrwEngine.NO_VALUE;
		this._fileName 	= jsonItem.EWS.o_client_filename;
		this._fileId	= jsonItem.EWS.o_filename;
		this._docType	= jsonItem.EWS.o_doc_type;
	},
	
	/**
	 * Close the upload module
	 * @since 1.0
	 */
	close: function() {
		this.targetDiv.update();
		delete upload_module_store[this.targetDivId];
	},
	
	/**
	 * Replace the standard reaction when an upload is finish. It generate events to indicate if the upload passed
	 * or the error message if any.
	 * @param {String} code The result code
	 * @since 1.0
	 */
	uploadDone: function(code) {
		if(this._cancelled === true) {
			new PeriodicalExecuter(function(pe) {
				if (this._fileId === null) return;
				pe.stop();
				document.fire('EWS:DocumentUploadFinish', {
					cancelled	: true	,
					success		: false	, 
					text		: 'UploadCancelled',
					fileName	: this._fileName,
					privacy		: this._privacy,
					fileId		: this._fileId,
					docType		: this._docType
				});
			}.bind(this), 1);
		}
		
		switch(code) {
			case '0': 
				new PeriodicalExecuter(function(pe) {
					if (this._fileId === null) return;
					pe.stop();
					document.fire('EWS:DocumentUploadFinish', {
						cancelled	: false	,
						success		: true	, 
						text		: 'upload successful',
						fileName	: this._fileName,
						privacy		: this._privacy,
						fileId		: this._fileId,
						docType		: this._docType
					});
				}.bind(this), 1);

				
				break;
			case '1': 
				document.fire('EWS:DocumentUploadFinish', {
					cancelled	: false	,
					success		: false	, 
					text		: 'max file size exceeded'
				});
				break;
			case '2': 
				document.fire('EWS:DocumentUploadFinish', {
					cancelled	: false	,
					success		: false	, 
					text		: 'error during upload'
				});
				break;
			case '3':
				document.fire('EWS:DocumentUploadFinish', {
					cancelled	: false	,
					success		: false	, 
					text		: 'error moving to store'
				});
			//since 1.1 Management of the error code 4.
			case '4':
				document.fire('EWS:DocumentUploadFinish', {
					cancelled	: false	,
					success		: false	, 
					text		: 'file type not allowed'
				});	
				break;	
			//since 1.1 This should manage all non foreseen errors
			default:
				document.fire('EWS:DocumentUploadFinish', {
					cancelled	: false	,
					success		: false	, 
					text		: 'UploadError'
				});	
				break;	
		} 	
	},
	
	/**
	 * Set that the upload is cancelled
	 * @since 1.0
	 */
	cancel: function() {
		this._cancelled = true;
	}
	
});
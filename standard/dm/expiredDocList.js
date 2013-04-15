
var MyDocuments = new Class.create(Application, {

    curDocumentID: null,
    prevDocumentID: null,
	scroll:true,
	
    initialize: function($super) {
        $super("MyDocuments");

        this.toggleFilterHandlerBinding = this.toggleFilterHandler.bindAsEventListener(this);
        this.docTypeSlctChangeHandlerBinding = this.docTypeSlctChangeHandler.bindAsEventListener(this);
        this.dateHandlerBinding = this.dateHandler.bindAsEventListener(this);
        this.searchFocusHandlerBinding = this.searchFocusHandler.bindAsEventListener(this);
        this.searchBlurHandlerBinding = this.searchBlurHandler.bindAsEventListener(this);
        this.searchKeyupHandlerBinding = this.searchKeyupHandler.bindAsEventListener(this);
		this.scrollHandlerBinding = this.scrollHandler.bindAsEventListener(this);
    },

    run: function($super, args) {
        $super(args);

        this.employeeID = '12345';
        this.employeeName = 'Burns Jodie';
        this.area = 'AREA';
        this.subarea = 'SUBAREA';
        this.page = '0';

        if (this.firstRun) {
            this.getMyDocuments();
        }

    },

    close: function($super) {
        $super();
    },
	
	scrollHandler: function(evt){
		
		
		var div = evt.element();
		
		
		  if(div){
		   var scrollTop = div.scrollTop;
		   var clientHeight = div.clientHeight;
		   var scrollHeight = div.scrollHeight;

		   
		   var offset=scrollHeight-(scrollTop+clientHeight);
		   if(offset<26 && this.scroll){
		   this.scroll=false;
				this.getNextPage();
		   }
		  
		  }
				
		
	},
	
	getNextPage: function(){
		var xmlin = ''
        + ' <EWS>'
        + '     <SERVICE>ECM_GET_DOC_LIST</SERVICE>'
        + '     <OBJECT TYPE=""/>'
        + '     <DEL/>'
        + '     <GCC/>'
        + '     <LCC/>'
        + '     <PARAM>'
        + '         <EmployeeID>' + this.employeeID + '</EmployeeID>'
		+ '         <Area>' + this.area + '</Area>'
		+ '         <Subarea>' + this.subarea + '</Subarea>'
		+ '         <Page>' + this.page + '</Page>'
        + '     </PARAM>'
        + ' </EWS>';

        this.method = 'GET';
        this.url = 'standard/dm/tests/xmls/getDocList.xml';
        this.makeAJAXrequest($H({ xml: xmlin,
            successMethod: 'updateDocumentsList',
            xmlFormat: false
        }));
	},
	
	updateDocumentsList: function(json){
		var documents = json.EWS.Documents.Document;
		this.documents=this.documents.concat(documents);
		$('myDocuments_ListContainer').update(this.buildDocumentsTable(this.documents));
		this.scroll=true;
		TableKit.Sortable.init($('myDocuments_ListContainer').down('table'), {
            /*pages: 10,*/
            marginL: 10,
            autoLoad: false,
            resizable: false
        });
		//scroll event
		if (Prototype.Browser.IE){
			$('myDocuments_ListContainer').observe('scroll', this.scrollHandlerBinding);
		}else{
			$('myDocuments_ListContainer').down('tbody',0).observe('scroll', this.scrollHandlerBinding);
		}
	},
	
    searchFocusHandler: function() {
        $('myDocuments_Search').value = '';
        this.filterValues.search = '';
        this.filterDocumentsList();
    },

    searchBlurHandler: function() {
        if ($('myDocuments_Search').value == '') {
            $('myDocuments_Search').value = global.getLabel('Search');
        }
    },

    searchKeyupHandler: function() {
        this.filterValues.search = $('myDocuments_Search').value;
        this.filterDocumentsList();
    },

    filterValues: {
        search: '',
        from: '',
        to: '',
        docType: ''

    },

    dateHandler: function() {

        if (this.fromDatePicker.actualDate && this.toDatePicker.actualDate) {
            this.filterValues.from = this.fromDatePicker.actualDate;
            this.filterValues.to = this.toDatePicker.actualDate;
            this.filterDocumentsList();
        }
    },

    toggleFilterHandler: function() {
        $('myDocuments_filterOptions').toggle();
    },

    docTypeSlctChangeHandler: function() {
        var docType = '';
        if ($('myDocuments_DocumentType').options[$('myDocuments_DocumentType').selectedIndex].index) {
            docType = $('myDocuments_DocumentType').options[$('myDocuments_DocumentType').selectedIndex].text;
        }
        this.filterValues.docType = docType;
        this.filterDocumentsList();
    },

    getDocTypeList: function() {
        var xmlin = ''
        + ' <EWS>'
        + '     <SERVICE>ECM_GET_DOC_TYPE_LIST</SERVICE>'
        + '     <OBJECT TYPE=""/>'
        + '     <DEL/>'
        + '     <GCC/>'
        + '     <LCC/>'
        + ' </EWS>';

        this.method = 'GET';
        this.url = 'standard/dm/tests/xmls/getDocTypeList.xml';
        this.makeAJAXrequest($H({ xml: xmlin,
            successMethod: 'buildDocumentsTypeList',
            xmlFormat: false
        }));
    },

    buildDocumentsTypeList: function(json) {
        var options = '<option value="null">' + global.getLabel('Choose document type') + '</option>';
        var items = json.EWS.DocumentTypes.DocumentType;
        items.each(function(item) {
            options += '<option value="' + item.TypeID + '">' + item.TypeLabel + '</option>';
        } .bind(this));

        $('myDocuments_DocumentType').update(options);
    },

    getMyDocuments: function() {

        var xmlin = ''
        + ' <EWS>'
        + '     <SERVICE>ECM_GET_DOC_LIST</SERVICE>'
        + '     <OBJECT TYPE=""/>'
        + '     <DEL/>'
        + '     <GCC/>'
        + '     <LCC/>'
        + '     <PARAM>'
        + '         <EmployeeID>' + this.employeeID + '</EmployeeID>'
		+ '         <Area>' + this.area + '</Area>'
		+ '         <Subarea>' + this.subarea + '</Subarea>'
		+ '         <Page>' + this.page + '</Page>'
        + '     </PARAM>'
        + ' </EWS>';

        this.method = 'GET';
        this.url = 'standard/dm/tests/xmls/getDocList.xml';
        this.makeAJAXrequest($H({ xml: xmlin,
            successMethod: 'buildDocumentsList',
            xmlFormat: false
        }));
    },

    buildDocumentsList: function(json) {

        this.json = json;
        var documents = json.EWS.Documents.Document;
		this.documents=documents;
		
        var container = new Element("div", { style: 'text-align:left;' });
        var listContainer = new Element("div", { id: 'myDocuments_ListContainer', style: 'float:left;width:100%' });


        container.insert(this.buildHeader());
        container.insert(this.buildFilterForm());
        listContainer.update(this.buildDocumentsTable(documents));
        container.insert(listContainer);
        container.insert(this.buildFooter());

        this.virtualHtml.update(container);

        TableKit.Sortable.init($('myDocuments_ListContainer').down('table'), {
            /*pages: 10,*/
            marginL: 10,
            autoLoad: false,
            resizable: false
        });

        this.fromDatePicker = new DatePicker('myDocuments_DateFrom', {
            draggable: true,
            events: $H({ correctDate: 'EWS:dateChanged' })
        });
        this.toDatePicker = new DatePicker('myDocuments_DateTo', {
            draggable: true,
            events: $H({ correctDate: 'EWS:dateChanged' })
        });
        this.fromDatePicker.linkCalendar(this.toDatePicker);
        document.observe('EWS:dateChanged', this.dateHandlerBinding);

        $('myDocuments_ToggleFilterOptions').observe('click', this.toggleFilterHandlerBinding);
        $('myDocuments_filterOptions').hide();

        //doc type select on change
        $('myDocuments_DocumentType').observe('change', this.docTypeSlctChangeHandlerBinding);

        //search field focus
        $('myDocuments_Search').observe('focus', this.searchFocusHandlerBinding);

        //search field blur
        $('myDocuments_Search').observe('blur', this.searchBlurHandlerBinding);

        //search field keyup
        $('myDocuments_Search').observe('keyup', this.searchKeyupHandlerBinding);
		
		//scroll event
		if (Prototype.Browser.IE){
			$('myDocuments_ListContainer').observe('scroll', this.scrollHandlerBinding);
		}else{
			$('myDocuments_ListContainer').down('tbody',0).observe('scroll', this.scrollHandlerBinding);
		}
		

        this.getDocTypeList();
        this.registerEvents(documents);

    },

    filterDocumentsList: function() {

        eval('var json=' + Object.toJSON(this.json));

        var documents = this.documents;
		var filtredDocuments=new Array();
		
		
		
        var date = '';
        for (var i = 0; i < documents.length; i++) {
            //doc type
            if (this.filterValues.docType) {
                if (documents[i].DocumentType.include(this.filterValues.docType)) {
                    filtredDocuments.push(documents[i]);
					continue;
                }
            }
            //date
            if (this.filterValues.from && this.filterValues.to && documents[i]) {
                date = Date.parseExact(documents[i].CreationDate, "yyyy/MM/dd");
                if (date.between(this.filterValues.from, this.filterValues.to)) {
                    filtredDocuments.push(documents[i]);
					continue;
                }
            }
            //search
            if (this.filterValues.search && documents[i]) {

                if (documents[i].DocumentName.include(this.filterValues.search)
				|| documents[i].DocumentType.include(this.filterValues.search)
				|| documents[i].CreationDate.include(this.filterValues.search)
				) {
                    filtredDocuments.push(documents[i]);
					continue;
                }

            }

        }

        $('myDocuments_ListContainer').update(this.buildDocumentsTable(filtredDocuments));

        TableKit.Sortable.init($('myDocuments_ListContainer').down('table'), {
            pages: 10,
            marginL: 10,
            autoLoad: false,
            resizable: false
        });

        this.registerEvents(documents);

    },

    buildHeader: function() {

        var html = ''
        + '<div> '
        + '<div style="margin-bottom:10px;float:left;width:100%;">'
        + '     <div style="float:left;">' + global.getLabel('Currently showing documents from : ' + this.employeeName) + '</div>'
        + '     <div style="float:right;"><img src="standard/dm/views.jpg"/></div>'
        + ' </div>'

        + ' <div style="margin-bottom:6px;float:left;width:100%;">'
        + '     <div style="margin-bottom:6px;padding-left:1px;float:left;">'
        + '         <input id="myDocuments_SelectAll" type="checkbox" / > ' + global.getLabel('Select/Unselect All')
        + '     </div>'
        + '     <div style="margin-bottom:6px;float:right;">'
        + '         <span id="myDocuments_ToggleFilterOptions" class="application_action_link" style="margin-right: 10px;">' + global.getLabel('Filter Options') + '</span>'
        + '         <input type="text" id="myDocuments_Search" value="' + global.getLabel('Search') + '" class="application_autocompleter_box"/>'
        + '     </div>'
        + '</div>'
        + '</div>';

        return html;
    },


    buildFilterForm: function() {

        var html = ''
        + ' <div id="myDocuments_filterOptions" style="float:right;width:96%;margin-top:20px;margin-bottom:10px">'
        + '     <span style="float: left;">' + global.getLabel('From') + ': &nbsp;</span>'
        + '     <div id="myDocuments_DateFrom"></div>'
        + '     <span style="float:left;">' + global.getLabel('To') + ': &nbsp;</span>'
        + '     <div id="myDocuments_DateTo"></div>'
        + '     <div style="float: right;">'
        + '         <span>' + global.getLabel('Document Type') + ': &nbsp;</span>'
        + '         <select id="myDocuments_DocumentType"><option>' + global.getLabel('Choose document type') + '...</option></select>'
        + '     </div>'
        + ' </div>';

        return html;
    },

    buildDocumentsTable: function(documents) {

        var html = ''
        + ' <table class="sortable resizable">'
	    + '     <thead>'
	    + '         <tr>'
	    + '             <th class="table_sortfirstdesc" id="Th1">' + global.getLabel('Name') + '</th>'
        + '             <th id="Th2">' + global.getLabel('Date') + '</th>'
        + '             <th id="Th3">' + global.getLabel('Type') + '</th>'
        + '             <th id="Th4">' + global.getLabel('Format') + '</th>'
        + '         </tr>'
        + '     </thead>'
        + '     <tbody>';

        documents.each(function(document) {
            if (document) {
                html += ''
                + '         <tr id="myDocuments_TrDocument' + document.DocumentID + '" style="cursor:pointer;">'
                + '             <td><div class="urg5"><input id="myDocuments_check' + document.DocumentID + '" type="checkbox" />' + document.DocumentName + '</div></td>'
                + '             <td>' + document.CreationDate + '</td>'
                + '             <td>' + document.DocumentType + '</td>'
                + '             <td>' + document.DocumentFormat + '</td>'
                + '         </tr>'
                + '';
            }
        } .bind(this));

        html += ''
        + '     </tbody>'
        + ' </table>';

        return html;
    },

    getDocumentMetaData: function(documentID) {

        this.curDocumentID = documentID;

        var xmlin = ''
        + ' <EWS>'
        + '     <SERVICE>ECM_GET_DOC_METADATA</SERVICE>'
        + '     <OBJECT TYPE=""/>'
        + '     <DEL/>'
        + '     <GCC/>'
        + '     <LCC/>'
        + '     <PARAM>'
        + '         <DocumentID>' + documentID + '</DocumentID>'
        + '     </PARAM>'
        + ' </EWS>';

        this.method = 'GET';
        this.url = 'standard/dm/tests/xmls/getDocMetaData.xml';
        this.makeAJAXrequest($H({ xml: xmlin,
            successMethod: 'buildDocumentMetaData',
            xmlFormat: false
        }));
    },

    buildDocumentMetaData: function(json) {

        var documentID = json.EWS.Document.DocumentID;
        var documentName = json.EWS.Document.DocumentName;
        var employeeName = json.EWS.Document.EmployeeName;
        var employeeID = json.EWS.Document.EmployeeID;
        var documentType = json.EWS.Document.DocumentType;
        var fileSize = json.EWS.Document.FileSize;
        var status = json.EWS.Document.Status;
        var source = json.EWS.Document.Source;
        var creationDate = json.EWS.Document.CreationDate;
        var modificationData = json.EWS.Document.ModificationData;
        var lastModifiedBy = json.EWS.Document.LastModifiedBy;
        var comments = json.EWS.Document.Comments;
        var imgLink = json.EWS.Document.ImgLink;
        var numberOfPages = json.EWS.Document.NumberOfPages;


        var html = ''
        + ' <div>'
        + '     <table style="width:100%;border:1px solid #DCD2CE;">'
        + '         <tr>'
        + '             <td style="padding:4px;text-align:center;vertical-align:middle;width:20%">'
        + '                 <img style="width:100px;height:128px;" src="' + imgLink + '" /><br/>'
        + '                 ' + global.getLabel('page') + ' 1 ' + global.getLabel('of') + ' ' + numberOfPages
        + '             </td>'
        + '             <td style="padding:4px;text-align:left;vertical-align:middle;width:35%">'
        + '                 <span><b>' + global.getLabel('Document Properties') + '</b></span><br/>'
        + '                 <span>' + global.getLabel('Type') + ' : ' + documentType + '</span><br/>'
        + '                 <span>' + global.getLabel('File Size') + ' : ' + fileSize + '</span><br/>'
        + '                 <span>' + global.getLabel('Status') + ' : ' + status + '</span><br/>'
        + '                 <span>' + global.getLabel('Source') + ' : ' + source + '</span><br/>'
        + '                 <span>' + global.getLabel('Creation Date') + ' : ' + creationDate + '</span><br/>'
        + '                 <span>' + global.getLabel('Modification Date') + ' : ' + modificationData + '</span><br/>'
        + '                 <span>' + global.getLabel('Last modified by') + ' : ' + lastModifiedBy + '</span><br/>'
        + '             </td>'
        + '             <td style="padding:4px;text-align:left;vertical-align:middle;width:45%">'
        + '                 ' + global.getLabel('Comments') + ':<br/>'
        + '                 <textarea style="width:98%;height:80px;font-size:11px;" class="application_autocompleter_box">' + comments + '</textarea><br>'
        + '                 <div style="float:right;margin-top:2px;" id="myDocuments_SaveChanges">'
        + '                     <div class="leftRoundedCorner">'
        + '                         <span class="centerRoundedButton">' + global.getLabel('Save Comments') + '</span>'
        + '                         <span class="rightRoundedCorner"></span>'
        + '                     </div>'
        + '                 </div>'
        + '             </td>'
        + '         </tr>'
        + '     </table>'
        + ' </div>'
        + '';

        var row = ''
        + ' <tr id="myDocuments_TrMetaData' + this.curDocumentID + '">'
        + '     <td colspan="4"> ' + html + ' </td>'
        + ' </tr>'
        + '';

        if (this.prevDocumentID && $('myDocuments_TrMetaData' + this.prevDocumentID)) {
            $('myDocuments_TrMetaData' + this.prevDocumentID).remove();
        }

        if (this.prevDocumentID != this.curDocumentID) {
            new Insertion.After($('myDocuments_TrDocument' + this.curDocumentID), row);
        } else {
            this.curDocumentID = null;
        }

        this.prevDocumentID = this.curDocumentID;

        // Save Changes (buuton)
        $('myDocuments_SaveChanges').observe('click', this.saveChanges.bind(this));

    },

    buildFooter: function() {

        var html = ''
        + ' <div id="myDocuments_Download" class="leftRoundedCorner" style="float:left;margin-top:4px;">'
        + '     <span class="centerRoundedButton">' + global.getLabel('Download') + '</span>'
        + '     <span class="rightRoundedCorner"></span>'
        + ' </div>'
        + ' <div style="float:right;">'
        + this.json.EWS.Documents.Document.length + ' ' + global.getLabel("documents availables")
        + '</div>';


        return html;
    },

    registerEvents: function(documents) {

        // Document List Items Click (div)
        documents.each(function(document) {
            if ($('myDocuments_TrDocument' + document.DocumentID)) {
                $('myDocuments_TrDocument' + document.DocumentID).observe('click',
                    this.getDocumentMetaData.bind(this, document.DocumentID)
                );
            }
        } .bind(this));


        var onsort = function() {
            if (this.prevDocumentID && $('myDocuments_TrMetaData' + this.prevDocumentID)) {
                $('myDocuments_TrMetaData' + this.prevDocumentID).remove();
                this.prevDocumentID = null;
            }
        }
        $('Th1').observe('click', onsort.bind(this));
        $('Th2').observe('click', onsort.bind(this));
        $('Th3').observe('click', onsort.bind(this));
        $('Th4').observe('click', onsort.bind(this));

        // Select/Unselect All (checkbox)
        $('myDocuments_SelectAll').observe('click', function() {
            var checked = $('myDocuments_SelectAll').checked;
            documents.each(function(document) {
                if ($('myDocuments_check' + document.DocumentID)) {
                    $('myDocuments_check' + document.DocumentID).checked = checked;
                }
            } .bind(this));
        });

        // Download (buuton)
        $('myDocuments_Download').observe('click', this.downloadDocuments.bind(this, documents, 0));

        // View Details (buuton)
        var that = this;
        $('myDocuments_ViewDetails').observe('click', function() {

            for (i = 0; i < documents.length; i++) {
                if ($('myDocuments_check' + documents[i].DocumentID).checked) {
                    that.getDocumentMetaData(documents[i].DocumentID);
                    break;
                }
            }
        });
    },

    saveChanges: function() {

        var documentID = '';
        var documentComment = '';

        var xmlin = ''
        + ' <EWS>'
        + '     <SERVICE>ECM_SAVE_DOC_METADATA</SERVICE>'
        + '     <OBJECT TYPE=""/>'
        + '     <DEL/>'
        + '     <GCC/>'
        + '     <LCC/>'
        + '     <PARAM>'
        + '         <DocumentID>' + documentID + '</DocumentID>'
		+ '         <DocumentComment>' + documentComment + '</DocumentComment>'
        + '     </PARAM>'
        + ' </EWS>';

        this.makeAJAXrequest($H({ xml: xmlin,
            successMethod: 'onSuccess',
            xmlFormat: false
        }));
    },

    onSuccess: function(json) {
        ;
    },


    downloadDocuments: function(documents, index) {
        if (documents[index]) {
            var that = this;
            var checkbox = $('myDocuments_check' + documents[index].DocumentID);
            if (checkbox.checked) {
                window.location.href = documents[index].DocumentLink;
                setTimeout(function() { that.downloadDocuments(documents, ++index) }, 1000);
            } else {
                this.downloadDocuments(documents, ++index);
            }
        }
    }

});
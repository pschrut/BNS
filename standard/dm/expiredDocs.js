var ExpiredDocuments = new Class.create(Application, {

    curDocumentID: null,
    prevDocumentID: null,
    mainContainer: null,
    listContainer: null,
    view: 0,
    currentScrollTop: 0,
    timer: null,

    initialize: function($super, args) {
        $super(args);
    },

    run: function($super, args) {
        $super(args);

        this.area = this.options.mnmid,
		this.subarea = this.options.sbmid
        this.page = 1;
        this.sortDirection = "DESC";
        this.sortField = "DOC_NAME";

        switch (global.currentApplication.appId) {
            case 'EDO_C_MA': this.view = this.viewValues.Catalog; break;
            case 'EDO_L_MA': this.view = this.viewValues.List; break;
            default:
                this.view = this.viewValues.Catalog; break;
        }
        this.buildUI();

    },

    close: function($super) {
        $super();
    },
    viewValues: {
        Catalog: 0,
        List: 1
    },
    /* Filter data and methods *****************************/
    /*******************************************************/
    filterValues: {
        search: '',
        from: '',
        to: '',
        docType: ''

    },

    searchFocusHandler: function() {
        $('myDocuments_Search').value = '';
        this.filterValues.search = '';
        this.filterDocumentsList();
        this.toggleClearFilter();
    },

    searchBlurHandler: function() {
        if ($('myDocuments_Search').value == '') {
            $('myDocuments_Search').value = global.getLabel('DM_SEARCH');
        }
        this.toggleClearFilter();
    },

    searchKeyupHandler: function() {
        this.filterValues.search = $('myDocuments_Search').value;
        this.filterDocumentsList();
        this.toggleClearFilter();
    },

    dateHandler: function() {

        if (this.fromDatePicker.actualDate && this.toDatePicker.actualDate) {
            this.filterValues.from = this.fromDatePicker.actualDate;
            this.filterValues.to = this.toDatePicker.actualDate;
            this.filterDocumentsList();
            this.toggleClearFilter();
        }
    },

    toggleFilterHandler: function() {
        $('myDocuments_filterOptions').toggle();
    },

    clearFilterHandler: function() {
        $('myDocuments_Search').value = global.getLabel('DM_SEARCH');
        $('myDocuments_DocumentType').selectedIndex = 0;
        this.fromDatePicker.clearFields();
        this.toDatePicker.clearFields();

        this.filterValues.from = '';
        this.filterValues.to = '';
        this.filterValues.search = '';
        this.filterValues.docType = '';
        this.filterDocumentsList();
        this.toggleClearFilter();
    },

    docTypeSlctChangeHandler: function() {
        var docType = '';
        if ($('myDocuments_DocumentType').options[$('myDocuments_DocumentType').selectedIndex].index) {
            docType = $('myDocuments_DocumentType').options[$('myDocuments_DocumentType').selectedIndex].text;
        }
        this.filterValues.docType = docType;
        this.filterDocumentsList();
        this.toggleClearFilter();
    },

    toggleClearFilter: function() {
        if ((this.filterValues.search)
        || ((this.filterValues.from) || (this.filterValues.to))
        || (this.filterValues.docType)) {
            $('myDocuments_ClearFilter').show();
        } else {
            $('myDocuments_ClearFilter').hide();
        }
    },

    getDocTypeList: function() {
        var xmlin = ''
        + ' <EWS>'
        + '     <SERVICE>DM_GET_TYPES</SERVICE>'
        + ' </EWS>';

        this.makeAJAXrequest($H({ xml: xmlin,
            successMethod: 'buildDocumentsTypeList',
            xmlFormat: false
        }));
    },

    buildDocumentsTypeList: function(json) {
        var options = '<option value="">' + global.getLabel('DML_CHOOSE_DOCUMENT_TYPE') + '</option>';
        var items = json.EWS.o_i_doc_type_list.yglui_str_ecm_doc_type_list;
        items.each(function(item) {
            if (this.filterValues.docType == item['@doc_type_name']) {
                options += '<option value="' + item['@doc_type_id'] + '" selected="selected">' + item['@doc_type_name'] + '</option>';
            } else {
                options += '<option value="' + item['@doc_type_id'] + '">' + item['@doc_type_name'] + '</option>';
            }
        } .bind(this));

        $('myDocuments_DocumentType').update(options);
    },

    buildFilterForm: function() {

        var html = ''
        + ' <div id="myDocuments_filterOptions" style="float:right;width:96%;margin-top:20px;margin-bottom:10px">'
        + '     <span style="float: left;">' + global.getLabel('DML_FROM') + ': &nbsp;</span>'
        + '     <div id="myDocuments_DateFrom"></div>'
        + '     <span style="float:left;">' + global.getLabel('DML_TO') + ': &nbsp;</span>'
        + '     <div id="myDocuments_DateTo"></div>'
        + '     <div style="float: right;">'
        + '         <span>' + global.getLabel('DML_DOCUMENT_TYPE') + ': &nbsp;</span>'
        + '         <select id="myDocuments_DocumentType"><option>' + global.getLabel('DML_CHOOSE_DOCUMENT_TYPE') + '...</option></select>'
        + '     </div>'
        + ' </div>';

        this.mainContainer.insert(html);

        this.fromDatePicker = new DatePicker('myDocuments_DateFrom', {
            draggable: true,
            events: $H({ correctDate: 'EWS:dateChanged' })
        });
        this.toDatePicker = new DatePicker('myDocuments_DateTo', {
            draggable: true,
            events: $H({ correctDate: 'EWS:dateChanged' })
        });
        this.fromDatePicker.linkCalendar(this.toDatePicker);
        document.observe('EWS:dateChanged', this.dateHandler.bind(this));

        $('myDocuments_ToggleFilterOptions').observe('click', this.toggleFilterHandler.bind(this));
        $('myDocuments_ClearFilter').observe('click', this.clearFilterHandler.bind(this));
        $('myDocuments_DocumentType').observe('change', this.docTypeSlctChangeHandler.bind(this));
        $('myDocuments_Search').observe('focus', this.searchFocusHandler.bind(this));
        $('myDocuments_Search').observe('blur', this.searchBlurHandler.bind(this));
        $('myDocuments_Search').observe('keyup', this.searchKeyupHandler.bind(this));

        $('myDocuments_filterOptions').hide();

        this.getDocTypeList();
    },

    /* Filter data and methods ************************/
    /********************************************************/


    ////////////////////////////////////////////////////////////////////////////////////
    sortByName: function() {
        this.sortDirection = (this.sortDirection == 'DESC') ? 'ASC' : 'DESC';
        this.sortField = 'DOC_NAME';
        this.getMyDocuments();
    },
    sortByDate: function() {
        this.sortDirection = (this.sortDirection == 'DESC') ? 'ASC' : 'DESC';
        this.sortField = 'EXP_DATE';
        this.getMyDocuments();
    },
    sortByEmp: function() {
        this.sortDirection = (this.sortDirection == 'DESC') ? 'ASC' : 'DESC';
        this.sortField = 'EE_NAME';
        this.getMyDocuments();
    },

    sortByType: function() {
        this.sortDirection = (this.sortDirection == 'DESC') ? 'ASC' : 'DESC';
        this.sortField = 'DOC_TYPE';
        this.getMyDocuments();
    },

    sortByFormat: function() {
        this.sortDirection = (this.sortDirection == 'DESC') ? 'ASC' : 'DESC';
        this.sortField = 'DOC_FORMAT';
        this.getMyDocuments();
    },
    ///////////////////////////////////////////////////////////////////////////////////////

    buildUI: function() {

        this.mainContainer = new Element("div", { style: 'text-align:left;width:100%' });
        this.listContainer = new Element("div", {
            id: 'expiredDoc_ListContainer',
            'class': 'expiredDoc_ListContainer',
            style: 'text-align:left;float:left;width:100%;border:1px solid #DCD2CE;'
        }).update('<span style="padding:2px;">' + global.getLabel('DML_NO_DOCUMENTS_AVAILABLE') + '.</span>');
        this.catalogContainer = new Element("div", {
            id: 'myDocuments_CatalogContainer',
            'class': 'myDocuments_CatalogContainer',
            style: 'float:left;width:100%'
        }).update('<span style="padding:2px;">' + global.getLabel('DML_NO_DOCUMENTS_AVAILABLE') + '.</span>');
        this.virtualHtml.update(this.mainContainer);

        var html = ''
        + ' <table class="sortable resizable header" style="border:1px solid #DCD2CE;">'
        + '     <thead>'
        + '         <tr>'
        + '             <th class="table_sortcol table_sortColDesc text" width="40%" id="Th_DOC_NAME">' + global.getLabel('DML_NAME') + '</th>'
        + '             <th class="table_sortcol text" width="20%" id="Th_EE_NAME">' + global.getLabel('DML_EMPLOYEE') + '</th>'
        + '             <th class="table_sortcol date-iso" width="5%" id="Th_EXP_DATE">' + global.getLabel('DML_EXPIRATION_DATE') + '</th>'
		+ '             <th class="table_sortcol text" width="30%" id="Th_DOC_TYPE">' + global.getLabel('DML_TYPE') + '</th>'
        + '             <th class="table_sortcol text" width="5%" id="Th_DOC_FORMAT">' + global.getLabel('DML_FORMAT') + '</th>'
        + '         </tr>'
        + '     </thead><tbody></tbody></table>';

        this.listHeader = new Element("div", {
            style: 'text-align:left;float:left;width:100%;border:1px solid #DCD2CE;";'
        }).update(html);

        this.buildHeader();
        this.buildFilterForm();
        this.mainContainer.insert(this.listHeader);
        this.mainContainer.insert(this.listContainer);
        this.mainContainer.insert(this.catalogContainer);
        this.listHeader.hide();
        this.listContainer.hide();
        this.catalogContainer.hide('');

        this.buildFooter();

        this.getMyDocuments();

    },

    getMyDocuments: function() {

        this.currentScrollTop = 0;
        this.listContainer.stopObserving('scroll');
        this.listContainer.observe('scroll', this.scrollHandler.bind(this));

        this.page = 1;
        var docTypeId = $('myDocuments_DocumentType').options[$('myDocuments_DocumentType').selectedIndex].value;
        var service = '';
        if (this.view == this.viewValues.Catalog) {
            service = 'DM_GET_EXP_CATA';
        } else {
            service = 'DM_GET_EXP_ALL';
        }
        var xmlin = ''
        + ' <EWS>'
        + '     <SERVICE>' + service + '</SERVICE>'
        + '     <OBJECT TYPE=""/>'
        + '     <DEL/><GCC/><LCC/>'
        + '     <PARAM>'
        + '         <I_V_PAGE>' + this.page + '</I_V_PAGE>';
        if ($('myDocuments_DocumentType').selectedIndex > 0) {
            xmlin += '         <I_V_DOC_TYPE>' + docTypeId + '</I_V_DOC_TYPE>';
        }
        xmlin += '         <I_V_DATE_FROM>' + this.filterValues.from.toString('yyyyMMdd') + '</I_V_DATE_FROM>'
        + '         <I_V_DATE_TO>' + this.filterValues.to.toString('yyyyMMdd') + '</I_V_DATE_TO>'
        + '         <I_V_SRCH_PATTERN>' + this.filterValues.search + '</I_V_SRCH_PATTERN>'
		+ '			<I_V_SORT_FIELD>' + this.sortField + '</I_V_SORT_FIELD>'
		+ '			<I_V_SORT_DIRECTION>' + this.sortDirection + '</I_V_SORT_DIRECTION>'

        + '     </PARAM>'
        + ' </EWS>';

        this.makeAJAXrequest($H({ xml: xmlin,
            successMethod: 'buildDocumentsList',
            xmlFormat: false
        }));
    },

    buildDocumentsList: function(json) {
        this.json = json;
        $('myDocuments_Footer').hide();
        $('myDocuments_Download').hide();
        $('myDocuments_Delete').hide();
        $('myDocuments_filterOptions').hide();
        $('myDocuments_FooterMsg').hide();

        if (this.view == this.viewValues.Catalog) {

            this.listContainer.setStyle({ 'max-height': '100%' });

            $('myDocuments_Filter').hide();

            this.listContainer.update('<span style="padding:2px;">' + global.getLabel('DML_NO_DOCUMENTS_AVAILABLE') + '.</span>');
            this.listHeader.hide();
            this.listContainer.hide();
            this.catalogContainer.show('');

            var html = this.buildEmployees(this.json.EWS.o_w_exp_catalog.employee.yglui_str_ecm_employee);

            this.catalogContainer.update('<div id="dm_expired_docs_catalog_p' + this.page + '"></div>');
            $('dm_expired_docs_catalog_p' + this.page).update(html);
            var expNodes = $('dm_expired_docs_catalog_p' + this.page).select('span.application_down_arrow');
            for (var i = 0; i < expNodes.length; i++) {
                expNodes[i].observe('click', this.toggleHandler.bindAsEventListener(this));
            }

            var showMore = new Element('span', { 'class': 'dm_exp_show_more_p' + this.page, 'style': 'margin-top:10px;' }).update(this.json.EWS.o_w_exp_catalog['@empl_left'] + ' more employee files with expired documents available. ');
            var showMoreLink = new Element('span', { 'class': 'application_action_link' }).update("show 10 more");
            showMoreLink.observe('click', this.showMoreHandler.bind(this));

            var av = parseInt(this.json.EWS.o_w_exp_catalog['@empl_left']);
            if (av > 0) {
                showMore.insert(showMoreLink);
                this.listContainer.insert(showMore);
            }

            var deleteAll = $('dm_expired_docs_catalog_p' + this.page).select('span.dm_exp_dlt_all');
            for (var i = 0; i < deleteAll.length; i++) {
                deleteAll[i].observe('click', this.deleteDocsByEmp.bindAsEventListener(this, deleteAll[i].getAttribute('emp')));
            }

            var viewDetails = $('dm_expired_docs_catalog_p' + this.page).select('span.dm_exp_view_details');
            for (var i = 0; i < viewDetails.length; i++) {
                viewDetails[i].observe('click', this.getDocumentMetaData.bindAsEventListener(this, viewDetails[i].getAttribute('docid')));
            }

            var deleteDocs = $('dm_expired_docs_catalog_p' + this.page).select('span.dm_exp_dlt_doc');
            for (var i = 0; i < deleteDocs.length; i++) {
                deleteDocs[i].observe('click', this.deleteDocsById.bindAsEventListener(this, deleteDocs[i].getAttribute('docid')));
            }

        } else {
            this.listContainer.setStyle({ 'max-height': '385px' });

            $('myDocuments_Filter').show();

            this.catalogContainer.update('<span style="padding:2px;">' + global.getLabel('DML_NO_DOCUMENTS_AVAILABLE') + '.</span>');
            this.catalogContainer.hide();
            this.listHeader.show();
            this.listContainer.show();

            if (!json.EWS.o_i_expired_list || !json.EWS.o_i_expired_list.yglui_str_ecm_expired_list) {
                this.listContainer.update('<span style="padding:2px;">' + global.getLabel('DML_NO_DOCUMENTS_AVAILABLE') + '.</span>');
                return;
            }
            this.documents = json.EWS.o_i_expired_list.yglui_str_ecm_expired_list;

            if (!this.documents.length) {
                this.documents = new Array(this.documents);
            }
            this.buildDocumentsTable(this.documents);
            this.listContainer.stopObserving('scroll');
            this.listContainer.observe('scroll', this.scrollHandler.bind(this));
            $('myDocuments_Footer').show();
            $('myDocuments_FooterMsg').show();

        }
    },

    filterDocumentsList: function() {
        this.getMyDocuments();
        this.toggleClearFilter();
    },

    toogleViews: function() {

        var views =
		[
			{ id: 1, name: 'List' },
			{ id: 0, name: 'Catalog' }
		];

        var viewsCSS =
		[
			{ id: 1, name: 'ListLeft' },
			{ id: 0, name: 'TreeRight' }
		];

        for (var i = 0; i < views.length; i++) {
            if (this.view == views[i].id) {
                $('myDocuments_' + views[i].name + 'View').removeClassName('PM_view' + viewsCSS[i].name);
                $('myDocuments_' + views[i].name + 'View').addClassName('PM_view' + viewsCSS[i].name + 'Selected');
            } else {
                $('myDocuments_' + views[i].name + 'View').addClassName('PM_view' + viewsCSS[i].name);
                $('myDocuments_' + views[i].name + 'View').removeClassName('PM_view' + viewsCSS[i].name + 'Selected');
            }
        }

    },

    buildHeader: function() {


        var html = '<div id="myDocuments_Header">'
        + '<div style="margin-bottom:10px;float:left;width:100%;">'
        + '     <div style="float:left;" class="application_main_title">' + global.getLabel('DML_EXPIRED_DOCUMENTS') + '</div>'
        + '     <div style="text-align:center;float:right;margin-right:220px;width:80px;">'
		+ global.getLabel('DML_SELECT_VIEW') + '<br/>'
        + '         <div id="myDocuments_CatalogView" class="PM_viewTreeRight" style="float:right;"></div>'
		+ '         <div id="myDocuments_ListView" class="PM_viewListLeft" style="float:right;"></div>'
		+ '			<br style="clear:both" />'
        + '     </div>'
        + ' </div>'
        + ' <div style="margin-bottom:6px;float:left;width:100%;" id="myDocuments_Filter">'
        + '     <div style="margin-bottom:6px;padding-left:1px;float:left;">'
        + '         <input id="myDocuments_SelectAll" type="checkbox" / > ' + global.getLabel('DML_SELECT_UNSELECT_ALL')
        + '     </div>'
        + '     <div style="margin-bottom:6px;float:right;">'
        + '         <span id="myDocuments_ToggleFilterOptions" class="application_action_link" style="float:left;margin-right: 10px;">' + global.getLabel('DML_FILTER_OPTIONS') + '</span>'
        + '         <input type="text" id="myDocuments_Search" value="' + ((this.filterValues.search) ? this.filterValues.search : global.getLabel('DM_SEARCH')) + '" class="application_autocompleter_box"/>'
		+ '			<span id="myDocuments_ClearFilter" class="application_action_link" style="margin-left: 10px;">' + global.getLabel('DML_CLEAR_FILTER') + '</span>'
        + '     </div>'
        + '</div>'
        + '</div>'
		+ '<br style="clear:both" />';

        this.mainContainer.insert(html);
        $('myDocuments_ClearFilter').hide();

        var view = 'ExpiredDocuments';
        var tabId = global.currentApplication.tabId;
        $('myDocuments_CatalogView').observe('click', function() {
            global.open($H({
                app: {
                    tabId: tabId,
                    appId: "EDO_C_MA",
                    view: view
                }
            }));
        } .bind(this));
        $('myDocuments_ListView').observe('click', function() {
            global.open($H({
                app: {
                    tabId: tabId,
                    appId: "EDO_L_MA",
                    view: view
                }
            }));

        } .bind(this));

        this.toogleViews();
    },


    buildDocumentsTable: function(documents) {

        var j = 0;
        documents.each(function(document) {
            if (document) {
                j++;
            }
        });

        if (j > 0) {
            $('myDocuments_Download').show();
            $('myDocuments_Delete').show();
            $('myDocuments_FooterMsg').show();
        } else {
            $('myDocuments_Download').hide();
            $('myDocuments_Delete').hide();
            $('myDocuments_FooterMsg').hide();

        }

        if (this.view == this.viewValues.List) {


            var html = ''
            + ' <table class="sortable resizable body">'
            + '     <tbody>';

            documents.each(function(document) {
                if (document) {
                    html += ''
                    + '         <tr id="myDocuments_TrDocument' + document['@doc_id'] + '" style="cursor:pointer;">'
                    + '             <td width="40%"><div><input id="myDocuments_check' + document['@doc_id'] + '" type="checkbox" />' + underlineSearch((document['@doc_name'] || ''), this.filterValues.search, 'applicationInbox_textMatch') + '</div></td>'
                    + '             <td width="20%"><div>' + underlineSearch((document['@ee_name'] || ''), this.filterValues.search, 'applicationInbox_textMatch') + '</div></td>'
                    + '             <td width="5%"><div>' + underlineSearch((document['@exp_date'] || ''), this.filterValues.search, 'applicationInbox_textMatch') + '</div></td>'
					+ '             <td width="30%"><div>' + underlineSearch((document['@doc_type'] || ''), this.filterValues.search, 'applicationInbox_textMatch') + '</div></td>'
                    + '             <td width="5%" style="padding:2px;"><div>' + underlineSearch((document['@doc_format'] || ''), this.filterValues.search, 'applicationInbox_textMatch') + '</div></td>'
                    + '         </tr>'
                    + '';
                }
            } .bind(this));

            if (j == 0) {
                html += '<tr><td><span style="padding:2px;">' + global.getLabel('DML_NO_DOCUMENTS_FOUND') + '.</span></td><td></td><td></td><td></td></tr>';
            }

            html += ''
            + '     </tbody>'
            + ' </table>';
            this.listContainer.update(html);
            this.registerEvents(documents);
            var table = new TableKit(this.listContainer.down('table.body'), {
                marginL: 10,
                autoLoad: false,
                resizable: false,
                sortable: false,
                stripe: true
            });
            TableKit.Rows.stripe(this.listContainer.down('table.body'));
        }


        var th = ['Th_DOC_NAME', 'Th_EE_NAME', 'Th_EXP_DATE', 'Th_DOC_TYPE', 'Th_DOC_FORMAT'];
        if (this.sortDirection == 'ASC') {
            for (i = 0; i < th.length; i++) {
                $(th[i]).removeClassName('table_sortColDesc');
                $(th[i]).removeClassName('table_sortColAsc');
                $(th[i]).addClassName('table_sortcol');
            }
            $('Th_' + this.sortField).removeClassName('table_sortColAsc');
            $('Th_' + this.sortField).addClassName('table_sortColDesc');
        } else if (this.sortDirection == 'DESC') {
            for (i = 0; i < th.length; i++) {
                $(th[i]).removeClassName('table_sortColAsc');
                $(th[i]).removeClassName('table_sortColDesc');
                $(th[i]).addClassName('table_sortcol');
            }
            $('Th_' + this.sortField).removeClassName('table_sortColDesc');
            $('Th_' + this.sortField).addClassName('table_sortColAsc');
        }
        $('myDocuments_DocumentCount').update(j);

        this.curDocumentID = null;
        this.prevDocumentID = null;

    },

    buildFooter: function() {

        var html = '<div id="myDocuments_Footer">'
        + ' <div id="myDocuments_Download" class="leftRoundedCorner" style="float:left;margin-top:4px;">'
        + '     <span class="centerRoundedButton">' + global.getLabel('DML_DOWNLOAD') + '</span>'
        + '     <span class="rightRoundedCorner"></span>'
        + ' </div>'
        + ' <div id="myDocuments_Delete" class="leftRoundedCorner" style="float:left;margin-top:4px;">'
        + '     <span class="centerRoundedButton">' + global.getLabel('DML_DELETE') + '</span>'
        + '     <span class="rightRoundedCorner"></span>'
        + ' </div>'
        + ' <div id="myDocuments_FooterMsg" style="float:right;">'
        + '<span id="myDocuments_DocumentCount">0</span> ' + global.getLabel("DML_DOCUMENTS_AVAILABLES")
        + ' </div></div>';

        this.mainContainer.insert(html);
        $('myDocuments_Footer').hide();
    },

    getDocumentMetaData: function(event, documentID) {

        if ((this.view == this.viewValues.List) && event && (event.element().tagName != 'DIV')) return;

        this.curDocumentID = documentID;

        var xmlin = ''
        + ' <EWS>'
        + '     <SERVICE>DM_GET_DETAILS</SERVICE>'
        + '     <OBJECT TYPE=""/><DEL/><GCC/><LCC/>'
        + '     <PARAM>'
        + '         <I_V_DOC_ID>' + documentID + '</I_V_DOC_ID>'
        + '     </PARAM>'
        + ' </EWS>';

        this.makeAJAXrequest($H({ xml: xmlin,
            successMethod: 'buildDocumentMetaData',
            xmlFormat: false
        }));
    },

    buildDocumentMetaData: function(json) {

        var documentID = this.curDocumentID;
        var documentName = json.EWS.o_w_details['@doc_name'] || '';
        var documentNameOrig = json.EWS.o_w_details['@doc_name_orig'] || '';
        var documentTrackId = json.EWS.o_w_details['@doc_track_id'];
        var employeeName = "";  //json.EWS.o_w_details['@EmployeeName'];
        var employeeID = ""; //json.EWS.o_w_details['@EmployeeID'];
        var documentType = json.EWS.o_w_details['@doc_type'];
        var fileSize = json.EWS.o_w_details['@doc_size'];
        var status = json.EWS.o_w_details['@doc_status'] || '';
        var source = json.EWS.o_w_details['@doc_source'] || '';
        var creationDate = json.EWS.o_w_details['@doc_cdate'] + ' ' + json.EWS.o_w_details['@doc_ctime'];
        var modificationData = json.EWS.o_w_details['@doc_udate'] + ' ' + json.EWS.o_w_details['@doc_utime'];
        var lastModifiedBy = json.EWS.o_w_details['@LastModifiedBy'] || '';
        var comments = json.EWS.o_w_details['@doc_comment'] || '';
        var numberOfPages = json.EWS.o_w_details['@doc_pages'];

        var xmlin = ""
        + "<EWS>"
            + "<SERVICE>DM_GET_THUMB</SERVICE>"
            + "<OBJECT TYPE=''/>"
            + "<DEL/><GCC/><LCC/>"
            + "<PARAM>"
                + "<I_V_CONTENT_ID>" + documentID + "</I_V_CONTENT_ID>"
            + "</PARAM>"
        + "</EWS>";

        var url = this.url;
        while (('url' in url.toQueryParams())) {
            url = url.toQueryParams().url;
        }
        url = (Object.isEmpty(Object.values(((url).toQueryParams()))[0])) ? url + '?xml_in=' : url + '&xml_in=';

        var html = ''
        + ' <div id="myDocuments_Details" style="width:100%;height:226px;' + (((this.view == this.viewValues.List)) ? 'border:1px solid #DCD2CE;' : '') + '">'
        + '             <div style="padding:4px;text-align:center;vertical-align:middle;width:22%;float:left;">'
        + '                 <img id="myDocuments_Thumbnail" style="cursor:pointer;width:150px;height:200px;" src="' + url + xmlin + '&nocach=' + Math.floor(Math.random() * 100001) + '" /><br/>'
        + '                 ' + global.getLabel('DML_PAGE') + ' 1 ' + global.getLabel('DML_OF') + ' ' + numberOfPages
        + '             </div>'
        + '             <div>'
        + '             <div style="padding:4px;text-align:left;vertical-align:middle;float:left;width:30%;">'
        + '                 <span><b>' + global.getLabel('DML_DOCUMENT_PROPERTIES') + ':</b></span><br/><br/>'
        + '                 <span>' + global.getLabel('DML_TYPE') + ' : ' + documentType + '</span><br/>'
        + '                 <span>' + global.getLabel('DML_FILE_SIZE') + ' : ' + fileSize + '</span><br/>'
        + '                 <span>' + global.getLabel('DML_STATUS') + ' : ' + status + '</span><br/>'
        + '                 <span>' + global.getLabel('DML_SOURCE') + ' : ' + source + '</span><br/>'
        + '                 <span>' + global.getLabel('DML_CREATION_DATE') + ' : ' + creationDate + '</span><br/>'
        + '                 <span>' + global.getLabel('DML_MODIFICATION_DATE') + ' : ' + modificationData + '</span><br/>'
        + '                 <span>' + global.getLabel('DML_LAST_MODIFIED_BY') + ' : ' + lastModifiedBy + '</span><br/>'
		+ '                 <span>' + global.getLabel('DML_ORIGNAL_FILE_NAME') + ' : ' + documentNameOrig + '</span><br/>'
		+ '                 <span>' + global.getLabel('DML_TRACKING_ID') + ' : ' + documentTrackId + '</span><br/>'
        + '             </div>'
        + '             <div style="padding:4px;padding-right:20px;text-align:left;vertical-align:middle;width:40%;float:right;">'
        + '                 ' + global.getLabel('DML_COMMENTS') + ':<br/>'
        + '                 <textarea id="myDocuments_Comments" style="width:98%;height:80px;font-size:11px;" class="application_autocompleter_box">' + comments + '</textarea><br>'
	    + '					<input type="hidden" id="myDocuments_DocumentID" value="' + documentID + '">'
	                        + '<div style="float:right;margin-top:2px;" id="myDocuments_SaveChanges">'
                                + '<div class="leftRoundedCorner">'
                                    + '<span class="centerRoundedButton">' + global.getLabel('DML_SAVE_COMMENTS') + '</span>'
                                    + '<span class="rightRoundedCorner"></span>'
                                + '</div>'
                            + '</div>'
        + '             </div>'
        + '             </div>'
        + ' </div>'
        + '';

        if (this.view == this.viewValues.Catalog) {
            var popUp = new infoPopUp({
                closeButton: $H({
                    'callBack': function() {
                        popUp.close();
                        delete popUp;
                    }
                }),
                htmlContent: html,
                indicatorIcon: 'void',
                width: 800
            });
            popUp.create();

        } else if (this.view == this.viewValues.List) {
            var row = ''
            + ' <tr id="myDocuments_TrMetaData' + this.curDocumentID + '">'
            + '     <td colspan="5" style="padding-left:0px;"> ' + html + ' </td>'
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
        }

        $('myDocuments_SaveChanges').observe('click', this.saveChanges.bind(this));
        
        $('myDocuments_Thumbnail').observe('click', function() {
            var xmlin = ''
			+ '<EWS>'
				+ '<SERVICE>DM_GET_FILE</SERVICE>'
				+ '<OBJECT TYPE=""/>'
				+ '<DEL/><GCC/><LCC/>'
				+ '<PARAM>'
					+ '<I_V_DOC_ID>' + documentID + '</I_V_DOC_ID>'
				+ '</PARAM>'
			+ '</EWS>';

            var url = this.url;
            while (('url' in url.toQueryParams())) {
                url = url.toQueryParams().url;
            }
            url = (Object.isEmpty(Object.values(((url).toQueryParams()))[0])) ? url + '?xml_in=' : url + '&xml_in=';
            window.location.href = url + xmlin;
        } .bind(this));

    },

    registerEvents: function(documents) {

        // Document List Items Click (div)
        documents.each(function(document) {
            if (document) {
                if ($('myDocuments_TrDocument' + document['@doc_id'])) {
                    $('myDocuments_TrDocument' + document['@doc_id']).stopObserving('click');
                    $('myDocuments_TrDocument' + document['@doc_id']).observe('click',
                        this.getDocumentMetaData.bindAsEventListener(this, document['@doc_id']));
                }
            }
        } .bind(this));

        if (this.view == this.viewValues.List) {

            $('Th_DOC_NAME').stopObserving('click');
            $('Th_EE_NAME').stopObserving('click');
            $('Th_EXP_DATE').stopObserving('click');
            $('Th_DOC_TYPE').stopObserving('click');
            $('Th_DOC_FORMAT').stopObserving('click');

            $('Th_DOC_NAME').observe('click', this.sortByName.bind(this));
            $('Th_EE_NAME').observe('click', this.sortByEmp.bind(this));
            $('Th_EXP_DATE').observe('click', this.sortByDate.bind(this));
            $('Th_DOC_TYPE').observe('click', this.sortByType.bind(this));
            $('Th_DOC_FORMAT').observe('click', this.sortByFormat.bind(this));
        }

        // Select/Unselect All (checkbox)
        $('myDocuments_SelectAll').observe('click', function() {
            var checked = $('myDocuments_SelectAll').checked;
            documents.each(function(document) {
                if (document) {
                    if ($('myDocuments_check' + document['@doc_id'])) {
                        $('myDocuments_check' + document['@doc_id']).checked = checked;
                    }
                }
            } .bind(this));
        });

        $('myDocuments_Download').stopObserving('click');
        $('myDocuments_Download').observe('click', this.downloadDocuments.bind(this, documents));

        $('myDocuments_Delete').stopObserving('click');
        $('myDocuments_Delete').observe('click', this.deleteDocsById.bindAsEventListener(this, documents));

    },

    saveChanges: function() {

        var documentID = $('myDocuments_DocumentID').value;
        var documentComment = $('myDocuments_Comments').value;

        var xmlin = ''
            + ' <EWS>'
            + '     <SERVICE>DM_UPD_COMMENTS</SERVICE>'
            + '     <PARAM>'
            + '         <I_V_CONTENT_ID>' + documentID + '</I_V_CONTENT_ID>'
	        + '         <I_V_COMMENT>' + documentComment + '</I_V_COMMENT>'
            + '     </PARAM>'
            + ' </EWS>';

        this.makeAJAXrequest($H({ xml: xmlin,
            successMethod: 'onSuccess',
            xmlFormat: false
        }));
    },

    downloadDocuments: function(documents) {

        for (i = 0; i < documents.length; i++) {
            if (documents[i]) {
                var checkbox = $('myDocuments_check' + documents[i]['@doc_id']);
                if (checkbox && checkbox.checked) {
                    var xmlin = ''
                    + '<EWS>'
                        + '<SERVICE>DM_GET_FILE</SERVICE>'
                        + '<OBJECT TYPE=""/>'
                        + '<DEL/><GCC/><LCC/>'
                        + '<PARAM>'
                            + '<I_V_DOC_ID>' + documents[i]['@doc_id'] + '</I_V_DOC_ID>'
                        + '</PARAM>'
                    + '</EWS>';

                    var url = this.url;
                    while (('url' in url.toQueryParams())) {
                        url = url.toQueryParams().url;
                    }
                    url = (Object.isEmpty(Object.values(((url).toQueryParams()))[0])) ? url + '?xml_in=' : url + '&xml_in=';
                    window.open(url + xmlin, '', 'width=300,height=300,resizable=yes,scrollbars=yes,toolbar=no,location=no');
                }
            }
        }
    },


    deleteDocsById: function(event, documents) {

        if (!Object.isString(documents) && Object.isArray(documents)) {
            documents.each(function(document) {
                var checkbox = $('myDocuments_check' + document['@doc_id']);
                if (checkbox && checkbox.checked) {
                    var xmlin = ''
				    + ' <EWS>'
				    + '     <SERVICE>DM_DEL_DOC_BYID</SERVICE>'
				    + '     <OBJECT TYPE=""/>'
				    + '     <DEL/><GCC/><LCC/>'
				    + '     <PARAM>'
				    + '         <I_V_DOC_ID>' + document['@doc_id'] + '</I_V_DOC_ID>'
				    + '     </PARAM>'
				    + ' </EWS>';
                    this.makeAJAXrequest($H({ xml: xmlin,
                        successMethod: 'deleteCallback',
                        xmlFormat: false
                    }));
                }
            } .bind(this));
        } else {
            var xmlin = ''
				+ ' <EWS>'
				+ '     <SERVICE>DM_DEL_DOC_BYID</SERVICE>'
				+ '     <OBJECT TYPE=""/>'
				+ '     <DEL/><GCC/><LCC/>'
				+ '     <PARAM>'
				+ '         <I_V_DOC_ID>' + documents + '</I_V_DOC_ID>'
				+ '     </PARAM>'
				+ ' </EWS>';

            this.makeAJAXrequest($H({ xml: xmlin,
                successMethod: 'deleteCallback',
                xmlFormat: false
            }));
        }
    },

    deleteDocsByEmp: function(event, emp) {
        var xmlin = ''
		+ ' <EWS>'
		+ '     <SERVICE>DM_DEL_DOC_PERN</SERVICE>'
		+ '     <OBJECT TYPE="P">' + emp + '</OBJECT>'
		+ '     <DEL/><GCC/><LCC/>'
		+ ' </EWS>';

        this.makeAJAXrequest($H({ xml: xmlin,
            successMethod: 'deleteCallback',
            xmlFormat: false
        }));
    },

    deleteCallback: function(json) {
        this.getMyDocuments();
    },

    onSuccess: function(json) {
        //this.getMyDocuments();
    },

    /************************************************************************************/
    /********************************* Catalog view *************************************/
    buildEmployees: function(items) {
        var arrow = '';
        var html = '';
        if (!items.length) {
            items = new Array(items);
        }
        for (var i = 0; i < items.length; i++) {
            if (items[i].documents) {
                arrow = 'dm_treeHandler_align_verticalArrow  application_down_arrow';
            } else {
                arrow = 'treeHandler_align_emptyArrow';
            }
            html +=
		    '<div class="treeHandler_node">' +
			'	<span class=" ' + arrow + ' "> </span>' +
			'	<span class="treeHandler_pointer">' +
			'		<table class="genCat_alignSpanInTree">' +
			'			<tbody>' +
			'				<tr>' +
			'					<td>' +
			'						<div class="treeHandler_text_node_content application_jobFamily genCat_iconInTree"/>' +
			'					</td>' +
			'					<td>' +
			'						<div class="treeHandler_text_node_content">' + items[i]['@ee_name'] + ' (' + items[i]['@exp_doc_number'] + ' ' + global.getLabel('DML_EXPIRED_DOCUMENTS') + ') <span emp="' + items[i]['@ee_id'] + '" class="application_action_link dm_exp_dlt_all">' + global.getLabel('DML_DELETE_ALL_EXPIRED_DOCS') + '</span> </div>' +
			'					</td>' +
			'				</tr>' +
			'			</tbody>' +
			'		</table>' +
			'	</span>';
            if (items[i].documents) {
                html += this.buildDocuments(items[i].documents);
            }
        }
        return html;

    },

    buildDocuments: function(item) {
        var arrow = '';
        var html = '';

        if (item.yglui_str_ecm_exp_doc) {
            var items = item.yglui_str_ecm_exp_doc;
            if (!items.length) {
                items = new Array(items);
            }
            for (var i = 0; i < items.length; i++) {
                arrow = 'treeHandler_align_emptyArrow';
                html +=
		        '	<div class="treeHandler_node">' +
		        '		<span class=" ' + arrow + ' "> </span>' +
		        '		<span class=" treeHandler_pointer">' +
		        '			<table class="genCat_alignSpanInTree">' +
		        '				<tbody>' +
		        '					<tr>' +
		        '						<td>' +
		        '							<div class="treeHandler_text_node_content myDocuments_' + ((items[i]['@extension']) ? items[i]['@extension'].toLowerCase() : '') + 'Icon genCat_iconInTree"/>' +
		        '						</td>' +
		        '						<td>' +
		        '							<div class="treeHandler_text_node_content">' + items[i]['@doc_name'] + ' (' + global.getLabel('DML_EXPIRED') + ' ' + items[i]['@expiration_date'] + ') <span  docid="' + items[i]['@doc_id'] + '" class="application_action_link dm_exp_view_details">' + global.getLabel('DML_VIEW_DETAILS') + '</span>  <span docid="' + items[i]['@doc_id'] + '" class="application_action_link dm_exp_dlt_doc">' + global.getLabel('DML_DELETE') + '</span> </div>' +
		        '						</td>' +
		        '					</tr>' +
		        '				</tbody>' +
		        '			</table>' +
		        '		</span></div>';
            }
        }
        html += '</div>';
        return html;

    },

    toggleHandler: function(evt) {

        var span = evt.element();
        if (span.hasClassName('application_down_arrow')) {
            span.removeClassName('application_down_arrow');
            span.addClassName('application_verticalR_arrow');
        } else {
            span.removeClassName('application_verticalR_arrow');
            span.addClassName('application_down_arrow');
        }

        var divs = span.up().select('div.treeHandler_node');

        divs.each(function(div) {
            div.toggle();
        } .bind(this));

    },

    showMoreHandler: function() {
        if ($$('span.dm_exp_show_more_p' + this.page)) {
            var e = $$('span.dm_exp_show_more_p' + this.page);
            e[0].remove();
        }
        this.page++;
        this.getMyDocuments();
    },

    scrollHandler: function() {

        var div = this.listContainer;

        var scrollTop = div.scrollTop;
        var clientHeight = div.clientHeight;
        var scrollHeight = div.scrollHeight;
        if ((scrollTop > this.currentScrollTop) && (Math.abs(scrollTop - ((scrollHeight - clientHeight))) < 5)) {
            this.currentScrollTop = scrollTop;
            this.getNextPage();
        }

    },

    getNextPage: function() {
        this.page++;
        var docTypeId = $('myDocuments_DocumentType').options[$('myDocuments_DocumentType').selectedIndex].value;
        var xmlin = ''
        + ' <EWS>'
        + '     <SERVICE>DM_GET_EXP_ALL</SERVICE>'
        + '     <OBJECT TYPE=""/>'
        + '     <DEL/><GCC/><LCC/>'
        + '     <PARAM>'
        + '         <I_V_PAGE>' + this.page + '</I_V_PAGE>';
        if ($('myDocuments_DocumentType').selectedIndex > 0) {
            xmlin += '         <I_V_DOC_TYPE>' + docTypeId + '</I_V_DOC_TYPE>';
        }
        xmlin += '         <I_V_DATE_FROM>' + this.filterValues.from.toString('yyyyMMdd') + '</I_V_DATE_FROM>'
        + '         <I_V_DATE_TO>' + this.filterValues.to.toString('yyyyMMdd') + '</I_V_DATE_TO>'
        + '         <I_V_SRCH_PATTERN>' + this.filterValues.search + '</I_V_SRCH_PATTERN>'
		+ '			<I_V_SORT_FIELD>' + this.sortField + '</I_V_SORT_FIELD>'
		+ '			<I_V_SORT_DIRECTION>' + this.sortDirection + '</I_V_SORT_DIRECTION>'

        + '     </PARAM>'
        + ' </EWS>';

        this.makeAJAXrequest($H({ xml: xmlin,
            successMethod: 'updateDocumentsList',
            xmlFormat: false
        }));
    },

    updateDocumentsList: function(json) {
        if (!json.EWS.o_i_expired_list || !json.EWS.o_i_expired_list.yglui_str_ecm_expired_list) {
            this.currentScrollTop = 0;
            this.page--;
            return;
        }
        var documents = json.EWS.o_i_expired_list.yglui_str_ecm_expired_list;

        if (!documents.length) {
            documents = new Array(documents);
        }
        this.documents = this.documents.concat(documents);
        this.buildDocumentsTable(this.documents);

        this.listContainer.stopObserving('scroll');
        this.listContainer.observe('scroll', this.scrollHandler.bind(this));
    }

});
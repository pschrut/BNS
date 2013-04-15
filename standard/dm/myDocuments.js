

var MyDocuments = new Class.create(Application, {

    curDocumentID: null,
    prevDocumentID: null,
    mainContainer: null,
    listContainer: null,
    view: 0,
    keyboardNavigation: true,

    initialize: function($super, args) {
        $super(args);
        this.keyboardBinding = this.keyboard.bindAsEventListener(this);
        this.menuSyncBinding = this.menuSync.bindAsEventListener(this);
    },

    keyboard: function(e) {
        var element = Event.element(e);
        if (element.tagName == 'TEXTAREA' || element.tagName == 'INPUT') {
            return;
        }
        if (this.curDocumentID) {
            Event.stop(e);
        }
        if (e.keyCode == 32 && this.view == this.viewValues.List && this.curDocumentID && this.keyboardNavigation) {
            this.keyboardNavigation = false;
            Event.stop(e);
            var nextTr = $('myDocuments_TrDocument' + this.curDocumentID).next(1);
            if (nextTr) {
                this.getDocumentMetaData(false, nextTr.id.sub('myDocuments_TrDocument', ''));
            } else {
                nextTr = $('myDocuments_ListContainer').down(1).next().down().id;
                this.getDocumentMetaData(false, nextTr.sub('myDocuments_TrDocument', ''));
            }

        }
    },

    run: function($super, args) {
        $super(args);

        var selectedEmp = global.getSelectedEmployees();
        this.emp = (selectedEmp && selectedEmp[0]) || args.get("emp") || global.objectId;

        var ee = global.getEmployee(this.emp);
        var empName;
        if (ee) {
            empName = ee.name;
        }
        this.empName = empName || args.get("empName") || global.name;

        if (args.get("fromOut") && (args.get("fromOut") == true)) {
            this.emp = args.get("emp");
            this.empName = args.get("empName");
            this.stopMenuSync = true;

            global.setEmployeeSelected(this.emp, true, false);

        } else {
            this.stopMenuSync = false;
        }

        this.area = this.options.mnmid;
        this.subarea = this.options.sbmid;
        this.page = 1;

        switch (global.currentApplication.appId) {
            case 'DOC_C_MA': this.view = this.viewValues.Catalog; break;
            case 'DOC_L_MA': this.view = this.viewValues.List; break;
            case 'DOC_G_MA': this.view = this.viewValues.Grid; break;
            case 'DOC_F_MA': this.view = this.viewValues.CoverFlow; break;
            default:
                this.view = this.viewValues.List; break;
        }

        document.observe("EWS:employeeMenuSync", this.menuSyncBinding);
        this.buildUI();
        document.observe('keydown', this.keyboardBinding);


    },

    close: function($super) {
        $super();
        cFlow.stop();
        document.stopObserving("EWS:employeeMenuSync", this.menuSyncBinding);
        document.stopObserving('keydown', this.keyboardBinding);
    },

    menuSync: function(event) {

        if (this.stopMenuSync) {
            this.stopMenuSync = false;
            return;
        }

        var args = getArgs(event);
        var employeeId = args.employeeId;
        var employeeName = args.name;
        var selected = args.selected;

        if (selected) {

            this.emp = employeeId;
            this.empName = employeeName;
            this.buildUI();
        }

    },

    viewValues: {
        Catalog: 0,
        List: 1,
        Grid: 2,
        CoverFlow: 3
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
        var options = '<option value="null">' + global.getLabel('DML_CHOOSE_DOCUMENT_TYPE') + '</option>';
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
        + ' <div id="myDocuments_filterOptions" style="float:right;width:96%;margin-top:10px;margin-bottom:6px">'
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
        this.filteredDocuments = this.filteredDocuments.sort(function(o1, o2) {
            var order = ($('myDocuments_SortByName').hasClassName('table_sortColDesc')) ? 1 : -1;
            var a = o1['@doc_name'].toLowerCase();
            var b = o2['@doc_name'].toLowerCase();
            return order * (a < b ? -1 : a === b ? 0 : 1);
        });
        this.buildDocumentsTable(this.filteredDocuments);
    },
    sortByDate: function() {
        this.filteredDocuments = this.filteredDocuments.sort(function(o1, o2) {
            var order = ($('myDocuments_SortByDate').hasClassName('table_sortColDesc')) ? 1 : -1;
            var a = o1['@cdate'].toLowerCase();
            var b = o2['@cdate'].toLowerCase();
            return order * (a < b ? -1 : a === b ? 0 : 1);
        });
        this.buildDocumentsTable(this.filteredDocuments);
    },
    sortByType: function() {
        this.filteredDocuments = this.filteredDocuments.sort(function(o1, o2) {
            var order = ($('myDocuments_SortByType').hasClassName('table_sortColDesc')) ? 1 : -1;
            var a = o1['@doc_type'].toLowerCase();
            var b = o2['@doc_type'].toLowerCase();
            return order * (a < b ? -1 : a === b ? 0 : 1);
        });
        this.buildDocumentsTable(this.filteredDocuments);
    },
    sortByFormat: function() {
        this.filteredDocuments = this.filteredDocuments.sort(function(o1, o2) {
            var order = ($('myDocuments_SortByFormat').hasClassName('table_sortColDesc')) ? 1 : -1;
            var a = o1['@doc_format'].toLowerCase();
            var b = o2['@doc_format'].toLowerCase();
            return order * (a < b ? -1 : a === b ? 0 : 1);
        });
        this.buildDocumentsTable(this.filteredDocuments);
    },
    ///////////////////////////////////////////////////////////////////////////////////////

    buildUI: function() {

        this.mainContainer = new Element("div", { style: 'text-align:left;width:100%;' }).update('');
        this.listContainer = new Element("div", {
            id: 'myDocuments_ListContainer',
            'class': 'myDocuments_ListContainer',
            style: 'text-align:left;float:left;width:100%;border:1px solid #DCD2CE;'
        }).update('<span style="padding:2px;">' + global.getLabel('DML_NO_DOCUMENTS_AVAILABLE') + '.</span>');
        this.catalogContainer = new Element("div", {
            id: 'myDocuments_CatalogContainer',
            'class': 'myDocuments_CatalogContainer',
            style: 'float:left;width:100%'
        }).update('<span style="padding:2px;">' + global.getLabel('DML_NO_DOCUMENTS_AVAILABLE') + '.</span>');
        this.virtualHtml.update(this.mainContainer);

        this.buildHeader();
        this.buildFilterForm();
        var html = ''
        + ' <div id="myDocuments_gridViewHeader" style="float:left;width:100%;"><table class="resizable sortable">'
	    + '     <thead>'
	    + '         <tr>'
	    + '             <th class="table_sortfirstdesc text" id="myDocuments_SortByName">' + global.getLabel('DML_NAME') + '</th>'
        + '             <th id="myDocuments_SortByDate" class="date-iso">' + global.getLabel('DML_DATE') + '</th>'
        + '             <th id="myDocuments_SortByType" class="text">' + global.getLabel('DML_TYPE') + '</th>'
        + '             <th id="myDocuments_SortByFormat" class="text">' + global.getLabel('DML_FORMAT') + '</th>'
        + '         </tr>'
        + '     </thead>'
        + '     <tbody></tbody></table></div>';
        this.mainContainer.insert(html);
        this.mainContainer.insert(this.listContainer);
        this.mainContainer.insert(this.catalogContainer);

        this.listContainer.hide();
        this.catalogContainer.hide('');

        this.buildFooter();

        TableKit.Sortable.init($('myDocuments_gridViewHeader').down('table'), {});
        $('myDocuments_gridViewHeader').hide();
        $('myDocuments_SortByName').observe('click', this.sortByName.bind(this));
        $('myDocuments_SortByDate').observe('click', this.sortByDate.bind(this));
        $('myDocuments_SortByType').observe('click', this.sortByType.bind(this));
        $('myDocuments_SortByFormat').observe('click', this.sortByFormat.bind(this));

        this.getMyDocuments();
    },

    getMyDocuments: function() {

        $('myDocuments_Footer').hide();
        var service = '';
        if (this.view == this.viewValues.Catalog) {
            service = 'DM_GET_CATALOG';
        } else {
            service = 'DM_GET_LIST';
        }
        var xmlin = ''
        + ' <EWS>'
        + '     <SERVICE>' + service + '</SERVICE>'
		+ '		<OBJECT TYPE="P" >' + this.emp + '</OBJECT>'
        + '     <PARAM>'
		+ '         <I_V_AREA_ID>' + this.area + '</I_V_AREA_ID>'
		+ '         <I_V_SUB_AREA_ID>' + this.subarea + '</I_V_SUB_AREA_ID>'
        + '     </PARAM>'
        + ' </EWS>';

        this.makeAJAXrequest($H({ xml: xmlin,
            successMethod: 'buildDocumentsList',
            xmlFormat: false
        }));
    },

    buildDocumentsList: function(json) {
        this.json = json;
        $('myDocuments_gridViewHeader').hide();
        $('myDocuments_coverFlowContainer').hide();
        $('myDocuments_Download').hide();
        $('myDocuments_ViewDetails').hide();
        $('myDocuments_filterOptions').hide();
        $('myDocuments_FooterMsg').hide();

        if (this.view == this.viewValues.Catalog) {

            $('myDocuments_Filter').hide();

            this.listContainer.update('<span style="padding:2px;">' + global.getLabel('DML_NO_DOCUMENTS_AVAILABLE') + '.</span>');
            this.listContainer.hide();
            this.catalogContainer.show('');

            this.catalogDocIDs = new Array();
            var html = '<div id="myDocuments_Catalog">';
            html += this.buildAreas(this.json.EWS.o_i_catalog.yglui_str_ecm_catalog);
            html += '</div>';

            this.catalogContainer.update(html);
            var expNodes = $('myDocuments_Catalog').select('span.application_down_arrow');
            for (var i = 0; i < expNodes.length; i++) {
                expNodes[i].observe('click', this.toggleHandler.bindAsEventListener(this));
            }

            for (var i = 0; i < this.catalogDocIDs.length; i++) {
                $('myDocuments_Cat_ViewDetails' + this.catalogDocIDs[i]).stopObserving('click');
                $('myDocuments_Cat_ViewDetails' + this.catalogDocIDs[i]).observe('click', this.getDocumentMetaData.bindAsEventListener(this, this.catalogDocIDs[i]));
            }

        } else {

            $('myDocuments_Filter').show();

            this.catalogContainer.update('');
            this.catalogContainer.hide('<span style="padding:2px;">' + global.getLabel('DML_NO_DOCUMENTS_AVAILABLE') + '.</span>');
            this.listContainer.show();
            this.filterDocumentsList();
            $('myDocuments_Footer').show();
        }
    },

    filterDocumentsList: function() {

        eval('var json=' + Object.toJSON(this.json));
        if (!json.EWS.o_i_documents || !json.EWS.o_i_documents.yglui_str_ecm_doc_list) {
            this.listContainer.update('<span style="padding:2px;">' + global.getLabel('DML_NO_DOCUMENTS_AVAILABLE') + '.</span>');
            return;
        }
        var documents = json.EWS.o_i_documents.yglui_str_ecm_doc_list;

        if (!documents.length) {
            documents = new Array(documents);
        }
        this.documents = documents;
        documents = documents.sort(function(o1, o2) {
            return (o1['@doc_name'] > o2['@doc_name']);
        });
        var date = '';
        for (var i = 0; i < documents.length; i++) {
            //doc type
            if (this.filterValues.docType && documents[i] && documents[i]['@doc_type']) {
                if (!documents[i]['@doc_type'].toLowerCase().include(this.filterValues.docType.toLowerCase())) {
                    delete documents[i];
                }
            }
            //date
            if (this.filterValues.from && this.filterValues.to && documents[i] && documents[i]['@cdate']) {
                date = Date.parseExact(documents[i]['@cdate'], "yyyy-MM-dd");
                if (!date.between(this.filterValues.from, this.filterValues.to)) {
                    delete documents[i];
                }
            }
            //search
            if (this.filterValues.search && documents[i]) {
                this.filterValues.search = this.filterValues.search.toLowerCase();
                if ((documents[i]['@doc_name'] && !documents[i]['@doc_name'].toLowerCase().include(this.filterValues.search))
				&& (documents[i]['@doc_type'] && !documents[i]['@doc_type'].toLowerCase().include(this.filterValues.search))
				&& (documents[i]['@cdate'] && !documents[i]['@cdate'].toLowerCase().include(this.filterValues.search))
				&& (documents[i]['@doc_format'] && !documents[i]['@doc_format'].toLowerCase().include(this.filterValues.search))
				) {
                    delete documents[i];
                }
            }

        }

        if ($('myDocuments_ListContainer').down('table')) {
            $('myDocuments_ListContainer').down('table').remove();
        }

        this.filteredDocuments = documents;

        this.toggleClearFilter();
        this.buildDocumentsTable(documents);

    },

    toogleViews: function() {

        var views =
		[
			{ id: 3, name: 'Coverflow' },
			{ id: 1, name: 'List' },
			{ id: 0, name: 'Catalog' },
			{ id: 2, name: 'Grid' }
		];

        var viewsCSS =
		[
			{ id: 3, name: 'CoverflowRight' },
			{ id: 1, name: 'ListCenter' },
			{ id: 0, name: 'TreeCenter' },
			{ id: 2, name: 'ThumbnailsLeft' }
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


        var html = '<div id="myDocuments_Header" style="position:relative;height:58px;">'
        + '     <div style="margin-bottom:10px;float:left;width:100%;">'
        + '         <div style="float:left;">' + global.getLabel('DML_CURRENTLY_SHOWING_DOCUMENTS_FROM') + ' : ' + this.empName + '</div>'
        + ((this.subarea != 'SC_DOC') ? '         <div style="text-align:center;float:right;margin-right:2px;margin-left:46px;" class="application_action_link" id="ViewCompleteFiles">' + global.getLabel('DML_VIEW_COMPLETE_EMPLOYEE_FILES') + '</div>' : '')
        + '         <div style="text-align:center;float:right;width:160px;margin-right:220px;">'
		+ global.getLabel('DML_SELECT_VIEW') + '<br/>'
		+ '             <div id="myDocuments_CoverflowView" class="PM_viewCoverflowRight" style="float:right;"></div>'
		+ '             <div id="myDocuments_ListView" class="PM_viewListCenter" style="float:right;"></div>'
        + '             <div id="myDocuments_CatalogView" class="PM_viewTreeCenter" style="float:right;"></div>'
		+ '             <div id="myDocuments_GridView" class="PM_viewThumbnailsLeft" style="float:right;"></div>'
        + '         </div>'
        + ' </div></div>'
        + ' <div id="myDocuments_coverFlowContainer" style="position:relative;width:100%;height:500px;">'
        + '     <div id="coverFlow" style="height:98%;top:0%;position: absolute;width: 100%;left: 0%;overflow: hidden;"> </div>'
	    + ' </div>'
        + ' <div style="float:left;width:100%;" id="myDocuments_Filter">'
        + '     <div style="margin-bottom:6px;padding-left:1px;float:left;">'
        + '         <input id="myDocuments_SelectAll" type="checkbox" / > ' + global.getLabel('DML_SELECT_UNSELECT_ALL')
        + '     </div>'
        + '     <div style="margin-bottom:6px;float:right;">'
        + '         <span id="myDocuments_ToggleFilterOptions" class="application_action_link" style="float:left;margin-right: 10px;">' + global.getLabel('DML_FILTER_OPTIONS') + '</span>'
        + '         <input type="text" id="myDocuments_Search" value="' + ((this.filterValues.search) ? this.filterValues.search : global.getLabel('DM_SEARCH')) + '" class="application_autocompleter_box"/>'
		+ '			<span id="myDocuments_ClearFilter" class="application_action_link" style="margin-left: 10px;">' + global.getLabel('DML_CLEAR_FILTER') + '</span>'
        + '     </div>'
        + '</div>';

        this.mainContainer.insert(html);
        $('myDocuments_coverFlowContainer').hide();
        $('myDocuments_ClearFilter').hide();

        var view = global.currentApplication.view;
        var tabId = global.currentApplication.tabId;
        emp = this.emp;
        empName = this.empName;

        if (this.subarea != 'SC_DOC') {
            $('ViewCompleteFiles').observe('click', function() {
                global.open($H({
                    app: {
                        tabId: 'SC_DOCU',
                        appId: "DOC_L_MA",
                        view: 'MyDocuments'
                    },
                    emp: emp,
                    empName: empName,
                    fromOut: true
                }));
            } .bind(this));
        }


        $('myDocuments_CatalogView').observe('click', function() {
            global.open($H({
                app: {
                    tabId: tabId,
                    appId: "DOC_C_MA",
                    view: view,
                    emp: emp,
                    empName: empName
                }
            }));
        } .bind(this));
        $('myDocuments_ListView').observe('click', function() {
            global.open($H({
                app: {
                    tabId: tabId,
                    appId: "DOC_L_MA",
                    view: view,
                    emp: emp,
                    empName: empName
                }
            }));

        } .bind(this));
        $('myDocuments_GridView').observe('click', function() {
            global.open($H({
                app: {
                    tabId: tabId,
                    appId: "DOC_G_MA",
                    view: view,
                    emp: emp,
                    empName: empName
                }
            }));
        } .bind(this));
        $('myDocuments_CoverflowView').observe('click', function() {
            global.open($H({
                app: {
                    tabId: tabId,
                    appId: "DOC_F_MA",
                    view: view,
                    emp: emp,
                    empName: empName
                }
            }));
        } .bind(this));

        this.toogleViews();
    },


    buildDocumentsTable: function(documents) {

        $('myDocuments_gridViewHeader').hide();
        $('myDocuments_coverFlowContainer').hide();
        $('myDocuments_ViewDetails').hide();



        var j = 0;
        documents.each(function(document) {
            if (document) {
                j++;
            }
        });

        if (j > 0) {
            $('myDocuments_Download').show();
            $('myDocuments_FooterMsg').show();
        } else {
            $('myDocuments_Download').hide();
            $('myDocuments_FooterMsg').hide();

        }
        if ((this.view == this.viewValues.List) || (this.view == this.viewValues.CoverFlow)) {
            var html = ''
            + ' <table class="sortable resizable">'
	        + '     <thead>'
	        + '         <tr>'
	        + '             <th class="table_sortfirstdesc text" id="Th1" field="doc_name">' + global.getLabel('DML_NAME') + '</th>'
            + '             <th id="Th2" field="cdate" class="date-iso">' + global.getLabel('DML_DATE') + '</th>'
            + '             <th id="Th3" field="doc_type" class="text">' + global.getLabel('DML_TYPE') + '</th>'
            + '             <th id="Th4" field="doc_format" class="text">' + global.getLabel('DML_FORMAT') + '</th>'
            + '         </tr>'
            + '     </thead>'
            + '     <tbody ' + ((!Prototype.Browser.IE) ? 'style="height:' + ((j > 16) ? '480px' : '100%') + '"' : '') + '>';

            documents.each(function(document) {
                if (document) {
                    html += ''
                    + '<tr id="myDocuments_TrDocument' + document['@doc_id'] + '" style="cursor:pointer;">'
					+ '				<td><div><input id="myDocuments_check' + document['@doc_id'] + '" type="checkbox" />' + underlineSearch((document['@doc_name'] || ''), this.filterValues.search, 'applicationInbox_textMatch') + '</div></td>'
					+ '             <td><div>' + underlineSearch((document['@cdate'] || ''), this.filterValues.search, 'applicationInbox_textMatch') + '</div></td>'
					+ '             <td><div>' + underlineSearch((document['@doc_type'] || ''), this.filterValues.search, 'applicationInbox_textMatch') + '</div></td>'
					+ '             <td><div>' + underlineSearch((document['@doc_format'] || ''), this.filterValues.search, 'applicationInbox_textMatch') + '</div></td>'
                    + ' </tr>';
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
            TableKit.Sortable.init(this.listContainer.down('table'), {
                marginL: 10,
                autoLoad: false,
                resizable: false
            });
            if (this.view == this.viewValues.CoverFlow) {
                $('myDocuments_ViewDetails').show();
            }
        } else if (this.view == this.viewValues.Grid) {
            $('myDocuments_gridViewHeader').show();
            $('myDocuments_ViewDetails').show();

            var html = '';
            html += ' <table class="resizable" CELLPADDING="2" CELLSPACING="6" style="width:100%;border:1px solid #DCD2CE;">'
            html += '<tbody ' + ((!Prototype.Browser.IE) ? 'style="height:' + ((j > 20) ? '480px' : '100%') + '"' : '') + '><tr>';
            var i = 0;
            documents.each(function(document) {

                if (document) {

                    var xmlin = ""
					+ "<EWS>"
						+ "<SERVICE>DM_GET_THUMB</SERVICE>"
						+ "<OBJECT TYPE=''/>"
						+ "<DEL/><GCC/><LCC/>"
						+ "<PARAM>"
							+ "<I_V_CONTENT_ID>" + document['@doc_id'] + "</I_V_CONTENT_ID>"
						+ "</PARAM>"
					+ "</EWS>";

                    var url = this.url;
                    while (('url' in url.toQueryParams())) {
                        url = url.toQueryParams().url;
                    }
                    url = (Object.isEmpty(Object.values(((url).toQueryParams()))[0])) ? url + '?xml_in=' : url + '&xml_in=';

                    html += '<td id="myDocuments_TdDocument' + document['@doc_id'] + '" style="background-color:#DCD2CE;text- align:center;vertical-align:top;width:' + ((((++i) % 4 == 0)) ? '27' : '24') + '%">'
					+ '	<div style="text-align:center;width:' + ((((i) % 4 == 0) && Prototype.Browser.IE) ? '90' : '100') + '%;">'
					+ '		<div style="float:right;" class="myDocuments_' + document['@doc_format'].toLowerCase() + 'Icon"></div>'
					+ '		<img style="width:144px;height:192px;margin-top:1px;" src="' + url + xmlin + '&nocach=' + Math.floor(Math.random() * 100001) + '" /><br/>' + underlineSearch((document['@doc_name'] || ''), this.filterValues.search, 'applicationInbox_textMatch')
					+ '		<div style="float:left;"><input id="myDocuments_check' + document['@doc_id'] + '" type="checkbox" /></div>'
					+ '	</div></td>';

                    if ((i) % 4 == 0) {
                        html += '</tr><tr>';
                    }
                }
            } .bind(this));

            if (j == 0) {
                html += '<td colspan="4" style="background-color:#DCD2CE;"><span style="padding:2px;">' + global.getLabel('DML_NO_DOCUMENTS_FOUND') + '.</span></td>'
            }

            if (((i) % 4 != 0) && !Prototype.Browser.IE) {
                html += '<td>&nbsp;</td>';
            }
            html += '</tr>'
            + '     </tbody>'
            + ' </table>';
            this.listContainer.update(html);
            this.registerEvents(documents);
        }

        $('myDocuments_DocumentCount').update(j);

        if (this.view == this.viewValues.CoverFlow) {
            $('myDocuments_coverFlowContainer').show();
            cFlow.create(this, "coverFlow", documents, 0.75, 0.15, 1.8, 10, 8, 4);
        }

    },

    buildFooter: function() {

        var html = '<div id="myDocuments_Footer">'
        + ' <div id="myDocuments_Download" class="leftRoundedCorner" style="float:left;margin-top:4px;">'
        + '     <span class="centerRoundedButton">' + global.getLabel('DML_DOWNLOAD') + '</span>'
        + '     <span class="rightRoundedCorner"></span>'
        + ' </div>'
        + ' <div id="myDocuments_ViewDetails" class="leftRoundedCorner" style="float:left;margin-top:4px;">'
        + '     <span class="centerRoundedButton">' + global.getLabel('DML_VIEW_DETAILS') + '</span>'
        + '     <span class="rightRoundedCorner"></span>'
        + ' </div>'
        + ' <div style="float:right;" id="myDocuments_FooterMsg">'
        + '<span id="myDocuments_DocumentCount">0</span> ' + global.getLabel("DML_DOCUMENTS_FOUND")
        + ' </div></div>';

        this.mainContainer.insert(html);
        $('myDocuments_ViewDetails').hide();
    },

    getDocumentMetaData: function(event, documentID) {

        if (event && (event.element().tagName != 'DIV')) return;
        if (event) {
            this.mouse = true;
        } else {
            this.mouse = false;
        }
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
         + '<div id="myDocuments_Details" style="width:100%;height:226px;' + (((this.view == this.viewValues.List)) ? 'border:1px solid #DCD2CE;' : '') + '">'
            + '<div style="padding:4px;text-align:center;vertical-align:middle;width:22%;float:left;">'
                + '<img id="myDocuments_Thumbnail" style="cursor:pointer;width:150px;height:200px;" src="' + url + xmlin + '&nocach=' + Math.floor(Math.random() * 100001) + '" /><br/>'
                        + '' + global.getLabel('DML_PAGE') + ' 1 ' + global.getLabel('DML_OF') + ' ' + numberOfPages
            + '</div>'
            + '<div>'
                + '<div style="padding:4px;text-align:left;vertical-align:middle;float:left;width:30%;">'
                    + '<span><b>' + global.getLabel('DML_DOCUMENT_PROPERTIES') + ':</b></span><br/><br/>'
                    + '<span>' + global.getLabel('DML_TYPE') + ' : ' + documentType + '</span><br/>'
                    + '<span>' + global.getLabel('DML_FILE_SIZE') + ' : ' + fileSize + '</span><br/>'
                    + '<span>' + global.getLabel('DML_STATUS') + ' : ' + status + '</span><br/>'
                    + '<span>' + global.getLabel('DML_SOURCE') + ' : ' + source + '</span><br/>'
                    + '<span>' + global.getLabel('DML_CREATION_DATE') + ' : ' + creationDate + '</span><br/>'
                    + '<span>' + global.getLabel('DML_MODIFICATION_DATE') + ' : ' + modificationData + '</span><br/>'
                    + '<span>' + global.getLabel('DML_LAST_MODIFIED_BY') + ' : ' + lastModifiedBy + '</span><br/>'
		            + '<span>' + global.getLabel('DML_ORIGNAL_FILE_NAME') + ' : ' + documentNameOrig + '</span><br/>'
		            + '<span>' + global.getLabel('DML_TRACKING_ID') + ' : ' + documentTrackId + '</span><br/>'
                + '</div>'
                + '<div style="padding:4px;padding-right:20px;text-align:left;vertical-align:middle;width:36%;float:right;">'
                        + '' + global.getLabel('DML_COMMENTS') + ':<br/>'
                    + '<textarea id="myDocuments_Comments" style="width:98%;height:80px;font-size:11px;" class="application_autocompleter_box">' + comments + '</textarea><br>'
	                + '<input type="hidden" id="myDocuments_DocumentID" value="' + documentID + '">'
                    + '<div style="float:right;margin-top:2px;" id="myDocuments_SaveChanges">'
                        + '<div class="leftRoundedCorner">'
                            + '<span class="centerRoundedButton">' + global.getLabel('DML_SAVE_COMMENTS') + '</span>'
                            + '<span class="rightRoundedCorner"></span>'
                        + '</div>'
                    + '</div>'
                + '</div>'
            + '</div>'
        + '</div>'
        + '';

        if ((this.view == this.viewValues.Grid) || (this.view == this.viewValues.Catalog) || (this.view == this.viewValues.CoverFlow)) {
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
            + '     <td colspan="4" style="padding-left:0px;"> ' + html + ' </td>'
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
            if (!this.mouse) {
                if (Prototype.Browser.IE) {
                    $('myDocuments_ListContainer').scrollTop = $('myDocuments_TrDocument' + this.curDocumentID).offsetTop - 20;
                } else {
                    $('myDocuments_ListContainer').down('tbody').scrollTop = $('myDocuments_TrDocument' + this.curDocumentID).offsetTop - 20;
                }
            }
            this.keyboardNavigation = true;
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
                    if (this.view == this.viewValues.CoverFlow) {
                        $('myDocuments_TrDocument' + document['@doc_id']).observe('click',
                        cFlow.update.bind(this, document['@doc_id']));
                    } else {
                        $('myDocuments_TrDocument' + document['@doc_id']).observe('click',
                        this.getDocumentMetaData.bindAsEventListener(this, document['@doc_id']));
                    }
                }
                if (this.view == this.viewValues.Grid && $('myDocuments_TdDocument' + document['@doc_id'])) {
                    var checkbox = $('myDocuments_check' + document['@doc_id']);
                    checkbox.observe('click', function(e, id) {
                        if (checkbox.checked) {
                            $('myDocuments_TdDocument' + id).setStyle({ 'backgroundColor': '#0099CC' });
                        } else {
                            $('myDocuments_TdDocument' + id).setStyle({ 'backgroundColor': '#DCD2CE' });
                        }
                    } .bindAsEventListener(this, document['@doc_id']));
                }
            }
        } .bind(this));

        if ((this.view == this.viewValues.List) || (this.view == this.viewValues.CoverFlow)) {
            var onsort = function(event) {
                if (this.prevDocumentID && $('myDocuments_TrMetaData' + this.prevDocumentID)) {
                    $('myDocuments_TrMetaData' + this.prevDocumentID).remove();
                    this.prevDocumentID = null;
                }
                if (this.view == this.viewValues.CoverFlow) {
                    var cell = event.element();
                    var table = this.listContainer.down('table');
                    var index = TableKit.getCellIndex(cell);
                    var order = cell.hasClassName('table_sortColDesc') ? 1 : -1;
                    var datatype = TableKit.Sortable.getDataType(cell, index, table);
                    var tkst = TableKit.Sortable.types;
                    this.documents = this.documents.sort(function(a, b) {
                        return order * tkst[datatype].compare(a['@' + cell.getAttribute('field')], b['@' + cell.getAttribute('field')]);
                    });
                    cFlow.create(this, "coverFlow", this.documents, 0.75, 0.15, 1.8, 10, 8, 4);
                }
            }
            $('Th1').observe('click', onsort.bindAsEventListener(this));
            $('Th2').observe('click', onsort.bindAsEventListener(this));
            $('Th3').observe('click', onsort.bindAsEventListener(this));
            $('Th4').observe('click', onsort.bindAsEventListener(this));
        }

        $('myDocuments_SelectAll').observe('click', function() {
            var checked = $('myDocuments_SelectAll').checked;
            documents.each(function(document) {
                if (document) {
                    if ($('myDocuments_check' + document['@doc_id'])) {
                        $('myDocuments_check' + document['@doc_id']).checked = checked;
                        if (this.view == this.viewValues.Grid) {
                            $('myDocuments_TdDocument' + document['@doc_id']).setStyle({ 'backgroundColor': ((checked) ? '#0099CC' : '#DCD2CE') });
                        }
                    }
                }
            } .bind(this));
        } .bind(this));

        $('myDocuments_Download').stopObserving('click');
        $('myDocuments_Download').observe('click', this.downloadDocuments.bind(this, documents));

        if ((this.view == this.viewValues.Grid) || (this.view == this.viewValues.CoverFlow)) {
            var that = this;
            $('myDocuments_ViewDetails').stopObserving('click');
            $('myDocuments_ViewDetails').observe('click', function() {

                for (i = 0; i < documents.length; i++) {
                    if (documents[i]) {
                        if ($('myDocuments_check' + documents[i]['@doc_id']).checked) {
                            that.getDocumentMetaData(null, documents[i]['@doc_id']);
                            return;
                        }
                    }
                }
            } .bind(this));
        }

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

    onSuccess: function(json) {
        //this.getMyDocuments();
    },


    /************************************************************************************/
    /********************************* Catalog view *************************************/
    buildAreas: function(items) {
        var arrow = '';
        var html = '';
        if (!items.length) {
            items = new Array(items);
        }
        for (var i = 0; i < items.length; i++) {
            if (items[i].sub_area && items[i].sub_area.yglui_str_ecm_sub_area) {
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
		    '						<div class="treeHandler_text_node_content">' + items[i]['@area_label'] + '</div>' +
		    '					</td>' +
		    '				</tr>' +
		    '			</tbody>' +
		    '		</table>' +
		    '	</span>';
            html += this.buildSubareas(items[i]);
        }
        return html;

    },

    buildSubareas: function(item) {
        var arrow = '';
        var html = '';
        if (item.sub_area && item.sub_area.yglui_str_ecm_sub_area) {
            var items = item.sub_area.yglui_str_ecm_sub_area;
            if (!items.length) {
                items = new Array(items);
            }
            for (var i = 0; i < items.length; i++) {
                if (items[i].application && items[i].application.yglui_str_ecm_application) {
                    arrow = 'dm_treeHandler_align_verticalArrow  application_down_arrow';
                } else {
                    arrow = 'treeHandler_align_emptyArrow';
                }
                html +=
		        '	<div class="treeHandler_node">' +
		        '		<span class=" ' + arrow + ' "> </span>' +
		        '		<span class=" treeHandler_pointer">' +
		        '			<table class="genCat_alignSpanInTree">' +
		        '				<tbody>' +
		        '					<tr>' +
		        '						<td>' +
		        '							<div class="treeHandler_text_node_content application_jobFamily genCat_iconInTree"/>' +
		        '						</td>' +
		        '						<td>' +
		        '							<div class="treeHandler_text_node_content">' + items[i]['@sub_area_label'] + '</div>' +
		        '						</td>' +
		        '					</tr>' +
		        '				</tbody>' +
		        '			</table>' +
		        '		</span>';
                html += this.buildApplications(items[i]);
            }
        }
        html += '</div>';
        return html;

    },

    buildApplications: function(item) {
        var arrow = '';
        var html = '';
        if (item.application && item.application.yglui_str_ecm_application) {
            var items = item.application.yglui_str_ecm_application;
            if (!items.length) {
                items = new Array(items);
            }
            for (var i = 0; i < items.length; i++) {
                if (items[i].documents && items[i].documents.yglui_str_ecm_doc_list) {
                    arrow = 'dm_treeHandler_align_verticalArrow  application_down_arrow';
                } else {
                    arrow = 'treeHandler_align_emptyArrow';
                }
                html +=
		        '	<div class="treeHandler_node">' +
		        '		<span class=" ' + arrow + ' "> </span>' +
		        '		<span class=" treeHandler_pointer">' +
		        '			<table class="genCat_alignSpanInTree">' +
		        '				<tbody>' +
		        '					<tr>' +
		        '						<td>' +
		        '							<div class="treeHandler_text_node_content application_jobFamily genCat_iconInTree"/>' +
		        '						</td>' +
		        '						<td>' +
		        '							<div class="treeHandler_text_node_content">' + items[i]['@node_label'] + '</div>' +
		        '						</td>' +
		        '					</tr>' +
		        '				</tbody>' +
		        '			</table>' +
		        '		</span>';
                html += this.buildDocs(items[i]);
            }
        }

        html += '</div>';
        return html;
    },

    buildDocs: function(item) {
        var html = '';
        if (item.documents && item.documents.yglui_str_ecm_doc_list) {
            var items = item.documents.yglui_str_ecm_doc_list;
            if (!items.length) {
                items = new Array(items);
            }

            var url = this.url;
            while (('url' in url.toQueryParams())) {
                url = url.toQueryParams().url;
            }
            url = (Object.isEmpty(Object.values(((url).toQueryParams()))[0])) ? url + '?xml_in=' : url + '&xml_in=';

            for (var i = 0; i < items.length; i++) {
                var xmlin = ""
				+ "<EWS>"
					+ "<SERVICE>DM_GET_FILE</SERVICE>"
					+ "<OBJECT TYPE=''/>"
					+ "<DEL/><GCC/><LCC/>"
					+ "<PARAM>"
						+ "<I_V_DOC_ID>" + items[i]['@doc_id'] + "</I_V_DOC_ID>"
					+ "</PARAM>"
				+ "</EWS>";

                html +=
		        '	<div class="treeHandler_node">' +
		        '		<span class="treeHandler_align_emptyArrow"> </span>' +
		        '		<span class=" treeHandler_pointer">' +
		        '			<table class="genCat_alignSpanInTree">' +
		        '				<tbody>' +
		        '					<tr>' +
		        '						<td>' +
		        '							<div class="treeHandler_text_node_content myDocuments_' + items[i]['@doc_format'].toLowerCase() + 'Icon genCat_iconInTree"/>' +
		        '						</td>' +
		        '						<td>' +
		        '							<div class="treeHandler_text_node_content"><a style="color:#000000" href="' + url + xmlin + '">' + items[i]['@doc_name'] + '</a></div>' +
		        '						</td>' +
		        '						<td>' +
		        '							<div class="application_action_link" id="myDocuments_Cat_ViewDetails' + items[i]['@doc_id'] + '">' + global.getLabel('DML_VIEW_DETAILS') + '</div>' +
		        '						</td>' +
		        '					</tr>' +
		        '				</tbody>' +
		        '			</table>' +
		        '		</span>' +
		        '	</div>';
                this.catalogDocIDs.push(items[i]['@doc_id']);
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

    }
});
/*************************************************************
*
* @Author: Ezequiel Bozzetti
* @Date: 09/09  
* @Details: this object creates a list of employees containing 
*           the details for the diferent compensation plans
*
*************************************************************/

var _thiss = null;

var ExcelTable = Class.create(origin, {

    /**
    *@type Element
    *@description Table with the list of employees.
    */
    employeeListTable: null,

    /**
    *@type String
    *@description Div around the list of employees.
    */
    employeeListDivId: "employee_List_div",

    /**
    *@type Element
    *@description Div around the employee list.
    */
    employeeListDiv: null,

    /**
    *@type String
    *@description Div around the application.
    */
    mainDivId: "excel_table_div",

    /**
    *@type json
    *@description stores initial values in case of undo.
    */
    initialJson: null,

    /**
    *@type hash
    *@description list of plans to be display in apply guidelines or others.
    */
    planList: null,

    /**
    *@type hash
    *@description list of plans Names to be display in apply guidelines or others.
    */
    planListNames: null,

    /**
    *@type hash
    *@description stores the max row number.
    */
    max_row_number: null,

    /**
    *@type hash
    *@description stores plans and amounts for those plans.
    */
    plans_amounts: null,

    /**
    *@type hash
    *@description stores plans and amounts for those plans.
    */
    changed_rows: null,
    /**
    * @Description Property to know the name of the caller object
    * @type String
    */
    caller_name: null,

    /**
    * @Description Temporary stores the old value of an amount before an onChange event
    * @type String
    */
    old_value: 0,

    /**
    * Property to know if the table with planned requests have been shown already
    * @type Boolean
    */
    tablePlannedShowed: false,

    /**
    * @type Hash
    * @description List of labels added dynamically
    */
    dynLabels: null,

    /**
    * @type Object
    * @description List of notes from each employee
    */
    notes: new Notes(),

    rv_per_id: null,

    rv_per_begda: null,

    rv_per_endda: null,

    org_unit_id: null,

    args: null,

    initialize: function($super, options) {
        $super('excelTable');
        this.options = options;
        this.empListDiv = new Element("div", {
            "class": "",
            "id": this.employeeListDivId,
            'style': 'overflow:auto; overflow-y:hidden'
        });
        _thiss = this;
        this.dynLabels = $H();
        this.planList = new Array();
        this.planListNames = new Array();
        this.noteUpdatedBinding = this.noteUpdated.bindAsEventListener(this);
        this.compensationReviewPeriodSelectedBinding = this.compensationReviewPeriodSelected.bind(this);
        this.onOrgUnitSelectedBinding = this.onOrgUnitSelected.bindAsEventListener(this);
        document.observe('EWS:compensation_noteUpdated', this.noteUpdatedBinding);
        document.observe('EWS:compensationReviewPeriodSelected', this.compensationReviewPeriodSelectedBinding);
        document.observe('EWS:compensationOrgUnitSelected', this.onOrgUnitSelectedBinding);
    },

    run: function() {

    },

    close: function($super) {
        if (!Object.isEmpty($("bodyTable")))
            TableKit.unloadTable("bodyTable");
        if (this.employeeListDiv) this.employeeListDiv.remove();
    },

    //--------------------------------------------------------------------------------------------------------------------------
    //					GETTERS & LISTENERS
    //--------------------------------------------------------------------------------------------------------------------------
    getEmpTable: function() { return this.employeeListTable },

    noteUpdated: function(event) {
        if (!Object.isEmpty(this.initialJson)) {
            var cellId = 'TD_' + event.memo.cellId;
            var cell = $(cellId);
            while (cell.hasChildNodes()) {
                cell.removeChild(cell.firstChild);
            }
            //var stickyImage = new Element('img', { 'src': 'css/images/stickyNoteRed.png', "updatedMode": "X", 'id': event.memo.cellId, 'pernr': cell.readAttribute('pernr') });
            var stickyImage = new Element('div', { 'class': 'application_stickyNoteRed', "updatedMode": "X", 'id': event.memo.cellId, 'pernr': cell.readAttribute('pernr') });
            stickyImage.observe('click', this.notes.displayInfoPopUp.bind(this, this.initialJson));
            cell.insert(stickyImage);
            stickyImage.observe('mouseover', function(event) {
                event.findElement().style.cursor = 'hand';
            });
            stickyImage.observe('mouseout', function(event) {
                event.findElement().style.cursor = 'pointer';
            });
            cell.writeAttribute('updatedMode', 'X');
        }
    },

    //--------------------------------------------------------------------------------------------------------------------------
    //					TABLE METHODS
    //--------------------------------------------------------------------------------------------------------------------------	
    /**
    *@description Build the HTML code and the objects to display the list of employees. 
    *				It creates the TableKit object.
    *@param {Object} json Answer of the service COM_EMP_LIST().
    */
    buildEmployeeList: function(json, caller_name, extraArgs) {
        if (Object.isEmpty(this.caller_name) || (!Object.isEmpty(caller_name) && (caller_name != this.caller_name)))
            this.caller_name = caller_name;
        this.args = extraArgs;
        this.initialJson = json;
        this.changed_rows = {
            elements: []
        };
        // If a table is already open, close it.
        this.closeEmployeeList();

        var orgUnitDetail = $A();
        if (!Object.isEmpty(json.EWS.o_org_unit))
            orgUnitDetail = objectToArray(json.EWS.o_org_unit);

        var canSave = '';
        orgUnitDetail.each(function(orgUnit) {
            if (orgUnit['@can_save'] != null)
                canSave = orgUnit['@can_save'];
        });

        if (!Object.isEmpty(json)) {
            // If the list is a new one => kill the existant details 
            this.detailsView = null;
            // Add the new list in the screen
            this.drawEmployeeList(json, '', canSave);
        }
        // Fires the event to let the caller know that the table is ready to be shown                
        document.fire('EWS:compensation_empTableReady', null);
    },

    /**
    *@description Draw the list of employees. 
    *@param {Object} json Answer of the service COM_EMP_LIST.
    *@param {Element} footer Footer of the table that is already buid by TableKit.
    *@returns Element
    */
    drawEmployeeList: function(json, drawAll, enableInputs) {
        this.planList = new Array(); //Reinitialize the plans list
        this.planListNames = new Array(); //Reinitialize the plan names list 
        this.max_row_number = 0;
        var plansListNotFilled = true; //To only fill the planList Once
        //        if (this.employeeListDiv) this.employeeListDiv.remove();
        this.employeeListDiv = new Element("div", {
            "id": this.employeeListDivId,
            'class': 'COM_holder'
        });
        var employees = $A();
        if (!Object.isEmpty(json.EWS.o_records))
            employees = objectToArray(json.EWS.o_records.yglui_str_com_rec);
        else {
            var table = new Element("div", {
                "style": "clear:both; padding-top:10px"
            }).insert(new Element("span", {
                "class": "application_main_title2"
            }).update("No result for selected period"));
            this.employeeListDiv.insert(table);
            this.employeeListTable = this.employeeListDiv;
            document.fire('EWS:compensation_hidebuttons');
            return;
        }
        var orgUnitDetail = $A();
        if (!Object.isEmpty(json.EWS.o_org_unit))
            orgUnitDetail = objectToArray(json.EWS.o_org_unit);
        var ouName = '';
        var canSave = '';
        orgUnitDetail.each(function(orgUnit) {
            ouName = orgUnit['@org_text'];
            canSave = orgUnit['@can_save'];
        });

        this.addToLabels(json);

        var headerDiv = new Element('div', {
            'style': 'width:100%;padding-left:2px;'
        });

        var Div1 = new Element('div', { 'style': 'width:13%;float:left;' });
        Div1.insert(new Element('span', {
            'class': 'application_main_title2', 'id': 'empl_list_main_title', 'width': '100%', 'align': 'left', 'style': 'white-space:nowrap;'
        }).update(this.getDynLabels('employee_list')));
        headerDiv.insert(Div1);
        var Div2 = new Element('div', { 'style': 'width:15%;float:left;' });
        if ((enableInputs == 'X') && (this.caller_name == "SalaryReview")) {
            Div2.insert(new Element('span', {
                'class': 'application_action_link', 'id': 'actions_link_emp_list', 'style': 'white-space:nowrap;'
            }).update('Actions'));
            Div2.observe('click', this.displayActionsBalloon.bind(this));
        }
        headerDiv.insert(Div2);

        var DivInt = new Element('div', { 'style': 'width:40%;float:left;' });
        DivInt.insert(new Element('div').update('&nbsp;&nbsp;&nbsp;'));
        headerDiv.insert(DivInt);

        var Div3 = new Element('div', { 'style': 'width:15%;float:left;' });
        Div3.insert(new Element('div', {
            'class': 'application_action_link', 'id': 'export_excel_link'
        }).update(this.getDynLabels('export2excel')));
        Div3.observe('click', this.launchExcelEvent.bind(this));
        headerDiv.insert(Div3);

        DivInt = new Element('div', { 'style': 'width:15%;float:left;' });
        DivInt.insert(new Element('div').update('&nbsp;&nbsp;&nbsp;'));
        headerDiv.insert(DivInt);

        var Div4 = new Element('div', { 'style': 'float:center;' });
        Div4.insert(new Element('div', { 'class': 'application_verticalR_arrow' }));
        Div4.observe('click', this.displayInfoPopUp.bind(this));
        Div4.observe('mouseover', function(event) {
            event.findElement().style.cursor = 'hand';
        });
        Div4.observe('mouseout', function(event) {
            event.findElement().style.cursor = 'pointer';
        });
        headerDiv.insert(Div4);

        this.employeeListDiv.insert(headerDiv);

        var mainTable = new Element('table', {
            'cellspacing': '1',
            'id': 'mainEmployeeTable',
            'class': 'data-table',
            'width': '100%'
        });
        this.employeeListDiv.insert(mainTable);

        var tbody = new Element('tbody');
        mainTable.insert(tbody);


        /**************************INSERT BODY TABLE*********************************/
        var tr = new Element('tr');
        tbody.insert(tr);

        var td = new Element('td', { 'colspan': '300', 'id': 'bodyTableTd' });
        tr.insert(td);

        var bodyTable = new Element('table', {
            'cellspacing': '1',
            'id': 'bodyTable',
            'style': 'width:100%;',
            'class': 'data-table'
        });

        td.insert(bodyTable);

        var bodyThead = new Element('thead');
        bodyTable.insert(bodyThead);

        // Row 1 with colspan
        var bodyTr2 = new Element('tr', { 'class': 'table_sortcol table_doubleHeaderUpper', 'id': 'headerTr2' });
        bodyThead.insert(bodyTr2);

        var bodyTr = new Element('tr', { 'class': 'table_doubleHeaderLower', 'id': 'headerTr' });
        bodyThead.insert(bodyTr);

        var settings = $A();
        if (!Object.isEmpty(json.EWS.o_record_settings))
            settings = objectToArray(json.EWS.o_record_settings.yglui_str_com_caf);

        var body2Td = new Element('th', { 'style': 'display: ""', 'att_collapsed': 'X', 'att_hidden': '', 'id': 'thName2', 'class': 'table_sortcol table_doubleHeaderUpper' });
        body2Td.insert(new Element('span').update(' '));
        bodyTr2.insert(body2Td);

        var bodyTd = new Element('th', { 'style': 'display: ""', 'att_collapsed': 'X', 'att_hidden': '', 'id': 'thName', 'class': 'table_doubleHeaderLower' });
        bodyTd.insert(new Element('span', { 'id': 'thSpanId' }).update('Name'));
        bodyTr.insert(bodyTd);

        var bodyTd = new Element('th', { 'note': 'X', 'style': 'display: ""', 'att_collapsed': 'X', 'att_hidden': '', 'id': 'thNote', 'class': 'table_doubleHeaderLower' });
        bodyTd.insert(new Element('div').update(' '));
        bodyTr.insert(bodyTd);

        var bodyTd = new Element('th', { 'note': 'X', 'style': 'display: ""', 'att_collapsed': 'X', 'att_hidden': '', 'id': 'thNote2', 'class': 'table_sortcol table_doubleHeaderUpper' });
        bodyTd.insert(new Element('div').update(' '));
        bodyTr2.insert(bodyTd);

        var oldgroup = '';
        var colspan = '1';

        settings.each(function(yglui_str_com_caf) {
            var curgroup = yglui_str_com_caf['@field_group'];
            var newspan = yglui_str_com_caf['@group_span'];

            if (curgroup != null || newspan != '00') {
                if (curgroup != oldgroup) {
                    oldgroup = curgroup;
                    colspan = newspan;
                }
                else {
                    colspan = 'XXX';
                }
            }
            else {
                colspan = '1';
            }

            var bodyTd = null;
            var body2Td = null;
            if (null != yglui_str_com_caf['@hidden'] || (drawAll == '' && (null == yglui_str_com_caf['@collapsed'] || '' == yglui_str_com_caf['@collapsed']))) {
                bodyTd = new Element('th', { 'style': 'display: none', 'att_collapsed': yglui_str_com_caf['@collapsed'], 'att_hidden': yglui_str_com_caf['@hidden'], 'id': 'th' + yglui_str_com_caf['@field'] });
                body2Td = new Element('th', { 'style': 'display: none', 'att_collapsed': yglui_str_com_caf['@collapsed'], 'att_hidden': yglui_str_com_caf['@hidden'], 'id': 'th' + yglui_str_com_caf['@field'], 'colspan': colspan, 'class': 'table_sortcol' });
            }
            else {
                bodyTd = new Element('th', { 'style': 'display: ""', 'att_collapsed': yglui_str_com_caf['@collapsed'], 'att_hidden': yglui_str_com_caf['@hidden'], 'id': 'th' + yglui_str_com_caf['@field'] });
                body2Td = new Element('th', { 'style': 'display: ""', 'att_collapsed': yglui_str_com_caf['@collapsed'], 'att_hidden': yglui_str_com_caf['@hidden'], 'id': 'th' + yglui_str_com_caf['@field'], 'colspan': colspan, 'class': 'table_sortcol' });
            }

            if ((yglui_str_com_caf['@header_hover'] != '')) {
                bodyTd.addClassName('table_doubleHeaderLower');
                body2Td.addClassName('table_doubleHeaderUpper');
            } else {
                bodyTd.addClassName('table_doubleHeaderUpper');
                body2Td.addClassName('table_doubleHeaderUpper');
            }

            if (Object.isEmpty(yglui_str_com_caf['@plan_title'])) {
                bodyTd.insert(new Element('span', { 'id': 'span_' + yglui_str_com_caf['@field'], 'style': 'white-space:nowrap;', 'title': yglui_str_com_caf['@header_hover'], 'class': 'table_doubleHeaderLower' }).update(yglui_str_com_caf['@description']));
                body2Td.insert(new Element('span', { 'id': 'span_' + yglui_str_com_caf['@field'], 'style': 'white-space:nowrap;', 'title': yglui_str_com_caf['@header_hover'], 'class': 'table_doubleHeaderLower' }).update(' '));
            }
            else {
                bodyTd.insert(new Element('span', { 'id': 'span_' + yglui_str_com_caf['@field'], 'style': 'white-space:nowrap;', 'title': yglui_str_com_caf['@header_hover'], 'class': 'table_doubleHeaderLower' }).update(yglui_str_com_caf['@description']));
            }

            bodyTr.insert(bodyTd);

            if (colspan !== 'XXX') {
                body2Td.insert(new Element('span', { 'id': 'span_' + yglui_str_com_caf['@field'], 'style': 'white-space:nowrap;', 'title': yglui_str_com_caf['@header_hover'] }).update(yglui_str_com_caf['@plan_title']));
                bodyTr2.insert(body2Td);
            }
        } .bind(this));

        /**************************INSERT BODY***************************************/
        var bodyTbody = new Element('tbody');
        bodyTable.insert(bodyTbody);

        i = 1;
        employees.each(function(y_glui_str_com_rec) {
            rowClass = 'table_rowodd';
            if (i == 1) {
                bodyTr = new Element('tr', { 'class': rowClass, 'id': i + '_empty' });
                bodyTbody.insert(bodyTr);
                //var bodyTd = new Element('td', { 'i': i, 'style': 'display: "hidden"', 'att_collapsed': 'X', 'att_hidden': '' });
                //bodyTr.insert(bodyTd);

            }
            if (i % 2 == 0)
                rowClass = '';
            i++;
            //Add employee cell
            bodyTr = new Element('tr', { 'class': rowClass, 'id': i + '_' + y_glui_str_com_rec.fields.yglui_str_com_fie[0]['@f_pernr'] });
            var limitpct = y_glui_str_com_rec['@limitpct'];
            bodyTbody.insert(bodyTr);
            var bodyTd = new Element('td', { 'i': i, 'style': 'display: ""', 'att_collapsed': 'X', 'att_hidden': '' });
            var elemSpan = new Element('span', { 'class': 'application_action_link', 'i': i, 'id': 'NAME_' + y_glui_str_com_rec['@pernr'] + '_' + i, 'pernr': y_glui_str_com_rec['@pernr'], 'name': y_glui_str_com_rec['@name'], 'completed': '' }).update(y_glui_str_com_rec['@name']);
            elemSpan.observe('click', this.displayBalloon.bind(this));
            bodyTd.insert(elemSpan);
            bodyTr.insert(bodyTd);
            //Add notes cell
            var notes = null;
            var notesLen = 0;
            if (!Object.isEmpty(y_glui_str_com_rec.comments)) {
                notes = objectToArray(y_glui_str_com_rec.comments);
                notesLen = notes.length;
            }
            var bodyTd = null;
            if (notesLen > 0) {
                bodyTd = new Element('td', { "width": "5%", "note": "X", "updatedMode": "", 'id': 'TD_Note_' + i + '_' + y_glui_str_com_rec.fields.yglui_str_com_fie[0]['@f_pernr'], 'width': '10%', 'style': 'vertical-align: "top"; display: "";float: left;height: 12px;width: 12px', 'att_collapsed': 'X', 'att_hidden': '', 'pernr': y_glui_str_com_rec.fields.yglui_str_com_fie[0]['@f_pernr'], 'f_citem': y_glui_str_com_rec.fields.yglui_str_com_fie[0]['@f_citem'] }).update('&nbsp;&nbsp;&nbsp;');
                //var stickyImage = new Element('img', { 'src': 'css/images/stickyNoteRed.png', "updatedMode": "", 'id': 'Note_' + i + '_' + y_glui_str_com_rec.fields.yglui_str_com_fie[0]['@f_pernr'], 'pernr': y_glui_str_com_rec.fields.yglui_str_com_fie[0]['@f_pernr'] });
                var stickyImage = new Element('div', { 'class': 'application_stickyNoteRed', "updatedMode": "", 'id': 'Note_' + i + '_' + y_glui_str_com_rec.fields.yglui_str_com_fie[0]['@f_pernr'], 'pernr': y_glui_str_com_rec.fields.yglui_str_com_fie[0]['@f_pernr'] });
                stickyImage.observe('click', this.notes.displayInfoPopUp.bind(this, this.initialJson));
                bodyTd.insert(stickyImage);
            }
            else {
                bodyTd = new Element('td', { "width": "5%", "note": "X", "updatedMode": "", 'id': 'TD_Note_' + i + '_' + y_glui_str_com_rec.fields.yglui_str_com_fie[0]['@f_pernr'], 'width': '10%', 'style': 'vertical-align: "top"; display: "";float: left;height: 12px;width: 12px', 'att_collapsed': 'X', 'att_hidden': '', 'pernr': y_glui_str_com_rec.fields.yglui_str_com_fie[0]['@f_pernr'], 'f_citem': y_glui_str_com_rec.fields.yglui_str_com_fie[0]['@f_citem'] }).update('&nbsp;&nbsp;&nbsp;');
                //var stickyImage = new Element('img', { 'src': 'css/images/stickyNote.png', "updatedMode": "", 'id': 'Note_' + i + '_' + y_glui_str_com_rec.fields.yglui_str_com_fie[0]['@f_pernr'], 'pernr': y_glui_str_com_rec.fields.yglui_str_com_fie[0]['@f_pernr'] });
                var stickyImage = new Element('div', { 'class': 'application_stickyNote', "updatedMode": "", 'id': 'Note_' + i + '_' + y_glui_str_com_rec.fields.yglui_str_com_fie[0]['@f_pernr'], 'pernr': y_glui_str_com_rec.fields.yglui_str_com_fie[0]['@f_pernr'] });
                stickyImage.observe('click', this.notes.displayInfoPopUp.bind(this, this.initialJson));
                bodyTd.insert(stickyImage);
            }
            stickyImage.observe('mouseover', function(event) {
                event.findElement().style.cursor = 'hand';
            });
            stickyImage.observe('mouseout', function(event) {
                event.findElement().style.cursor = 'pointer';
            });
            bodyTr.insert(bodyTd);
            // Loop and add the rest of customizable cells
            y_glui_str_com_rec.fields.yglui_str_com_fie.each(function(yglui_str_com_fie) {
                var completed = 'X';
                var myElement = null;
                var hidden = '';
                var bodyTd = null;
                var reAlignField = false;
                if (null != yglui_str_com_fie['@hidden'] || (drawAll == '' && (null == yglui_str_com_fie['@collapsed'] || '' == yglui_str_com_fie['@collapsed'])))
                    bodyTd = new Element('td', { 'style': 'display:none', 'att_collapsed': yglui_str_com_fie['@collapsed'], 'att_hidden': yglui_str_com_fie['@hidden'] });
                else
                    bodyTd = new Element('td', { 'style': 'display:""', 'att_collapsed': yglui_str_com_fie['@collapsed'], 'att_hidden': yglui_str_com_fie['@hidden'] });
                var field = yglui_str_com_fie['@field'].split('_', 2)[1];
                if ((removeCommas(yglui_str_com_fie['@input_size']) - 0) > 0 && (canSave == 'X') && (enableInputs == 'X') && (!Object.isEmpty(yglui_str_com_fie['@eligible']))) {
                    //If the value of the field is empty-> the plan is not complete
                    if ((field == 'CPAMT') && (null == yglui_str_com_fie['@value']))
                        completed = '';
                    if (!Object.isEmpty(yglui_str_com_fie['@value']))
                        switch (yglui_str_com_fie['@type']) {
                        case 'text':
                            myElement = new Element("input", { "type": "text", 'size': yglui_str_com_fie['@input_size'], 'compcat': yglui_str_com_fie['@compcat'], 'event_fired': yglui_str_com_fie['@event_fired'], 'linked_plan': yglui_str_com_fie['@linked_plan'], 'f_citem': yglui_str_com_fie['@f_citem'], 'update_method': yglui_str_com_fie['@update_method'], 'update_ns_method': yglui_str_com_fie['@update_ns_method'], 'class': 'COM_app_input_box', 'id': yglui_str_com_fie['@field'] + '_' + yglui_str_com_fie['@f_pernr'] + '_' + i, 'currValue': yglui_str_com_fie['@value'], 'oldValue': yglui_str_com_fie['@value'], 'budget': yglui_str_com_fie['@f_budget'], 'itkey': yglui_str_com_fie['@itkey'], 'ex_rate': yglui_str_com_fie['@f_ex_rate'], 'f_stkun': yglui_str_com_fie['@f_stkun'], 'f_perner': yglui_str_com_fie['@f_pernr'], 'plan': yglui_str_com_fie['@f_plan'], 'i': i, 'completed': completed, 'style': 'font-family=Trebuchet MS; font-size= 9pt;', 'limitpct': limitpct, 'value': longToDisplay(parseFloat(yglui_str_com_fie['@value'])) });
                            break;
                        case 'currency':
                            var custValue = "0";
                            if (!Object.isEmpty(yglui_str_com_fie['@value']))
                                custValue = yglui_str_com_fie['@value'];
                            myElement = new Element("input", { "type": "text", 'size': yglui_str_com_fie['@input_size'], 'compcat': yglui_str_com_fie['@compcat'], 'event_fired': yglui_str_com_fie['@event_fired'], 'linked_plan': yglui_str_com_fie['@linked_plan'], 'f_citem': yglui_str_com_fie['@f_citem'], 'update_method': yglui_str_com_fie['@update_method'], 'update_ns_method': yglui_str_com_fie['@update_ns_method'], 'class': 'COM_app_input_box', 'id': yglui_str_com_fie['@field'] + '_' + yglui_str_com_fie['@f_pernr'] + '_' + i, 'currValue': yglui_str_com_fie['@value'], 'oldValue': yglui_str_com_fie['@value'], 'budget': yglui_str_com_fie['@f_budget'], 'itkey': yglui_str_com_fie['@itkey'], 'ex_rate': yglui_str_com_fie['@f_ex_rate'], 'f_perner': yglui_str_com_fie['@f_pernr'], 'plan': yglui_str_com_fie['@f_plan'], 'i': i, 'completed': completed, 'style': 'font-family=Trebuchet MS; font-size= 9pt;', 'limitpct': limitpct, 'value': longToDisplay(parseFloat(custValue)) });
                            break;
                        case 'date':
                            myElement = new Element("input", { "type": "text", 'size': yglui_str_com_fie['@input_size'], 'compcat': yglui_str_com_fie['@compcat'], 'event_fired': yglui_str_com_fie['@event_fired'], 'linked_plan': yglui_str_com_fie['@linked_plan'], 'f_citem': yglui_str_com_fie['@f_citem'], 'update_method': yglui_str_com_fie['@update_method'], 'update_ns_method': yglui_str_com_fie['@update_ns_method'], 'class': 'COM_app_input_box', 'id': yglui_str_com_fie['@field'] + '_' + yglui_str_com_fie['@f_pernr'] + '_' + i, 'currValue': yglui_str_com_fie['@value'], 'oldValue': yglui_str_com_fie['@value'], 'budget': yglui_str_com_fie['@f_budget'], 'itkey': yglui_str_com_fie['@itkey'], 'ex_rate': yglui_str_com_fie['@f_ex_rate'], 'f_perner': yglui_str_com_fie['@f_pernr'], 'plan': yglui_str_com_fie['@f_plan'], 'i': i, 'completed': completed, 'style': 'font-family=Trebuchet MS; font-size= 9pt;', 'limitpct': limitpct, 'value': objectToDisplay(yglui_str_com_fie['@value']) });
                            break;
                        default:
                            myElement = new Element("input", { "type": "text", 'size': yglui_str_com_fie['@input_size'], 'compcat': yglui_str_com_fie['@compcat'], 'event_fired': yglui_str_com_fie['@event_fired'], 'linked_plan': yglui_str_com_fie['@linked_plan'], 'f_citem': yglui_str_com_fie['@f_citem'], 'update_method': yglui_str_com_fie['@update_method'], 'update_ns_method': yglui_str_com_fie['@update_ns_method'], 'class': 'COM_app_input_box', 'id': yglui_str_com_fie['@field'] + '_' + yglui_str_com_fie['@f_pernr'] + '_' + i, 'currValue': yglui_str_com_fie['@value'], 'oldValue': yglui_str_com_fie['@value'], 'budget': yglui_str_com_fie['@f_budget'], 'itkey': yglui_str_com_fie['@itkey'], 'ex_rate': yglui_str_com_fie['@f_ex_rate'], 'f_stkun': yglui_str_com_fie['@f_stkun'], 'f_perner': yglui_str_com_fie['@f_pernr'], 'plan': yglui_str_com_fie['@f_plan'], 'i': i, 'completed': completed, 'style': 'font-family=Trebuchet MS; font-size= 9pt;', 'limitpct': limitpct, 'value': longToDisplay(parseFloat(parseFloat(yglui_str_com_fie['@value']).toFixed(2))) });
                            break;
                    }
                    else
                        switch (yglui_str_com_fie['@type']) {
                        case 'text':
                            myElement = new Element("input", { "type": "text", 'size': yglui_str_com_fie['@input_size'], 'compcat': yglui_str_com_fie['@compcat'], 'event_fired': yglui_str_com_fie['@event_fired'], 'linked_plan': yglui_str_com_fie['@linked_plan'], 'f_citem': yglui_str_com_fie['@f_citem'], 'update_method': yglui_str_com_fie['@update_method'], 'update_ns_method': yglui_str_com_fie['@update_ns_method'], 'class': 'COM_app_input_box', 'id': yglui_str_com_fie['@field'] + '_' + yglui_str_com_fie['@f_pernr'] + '_' + i, 'currValue': '', 'oldValue': '', 'budget': yglui_str_com_fie['@f_budget'], 'itkey': yglui_str_com_fie['@itkey'], 'ex_rate': yglui_str_com_fie['@f_ex_rate'], 'f_stkun': yglui_str_com_fie['@f_stkun'], 'f_perner': yglui_str_com_fie['@f_pernr'], 'plan': yglui_str_com_fie['@f_plan'], 'i': i, 'completed': completed, 'style': 'font-family=Trebuchet MS; font-size= 9pt;', 'limitpct': limitpct, 'value': '' });
                            break;
                        case 'currency':
                            myElement = new Element("input", { "type": "text", 'size': yglui_str_com_fie['@input_size'], 'compcat': yglui_str_com_fie['@compcat'], 'event_fired': yglui_str_com_fie['@event_fired'], 'linked_plan': yglui_str_com_fie['@linked_plan'], 'f_citem': yglui_str_com_fie['@f_citem'], 'update_method': yglui_str_com_fie['@update_method'], 'update_ns_method': yglui_str_com_fie['@update_ns_method'], 'class': 'COM_app_input_box', 'id': yglui_str_com_fie['@field'] + '_' + yglui_str_com_fie['@f_pernr'] + '_' + i, 'currValue': '', 'oldValue': '', 'budget': yglui_str_com_fie['@f_budget'], 'itkey': yglui_str_com_fie['@itkey'], 'ex_rate': yglui_str_com_fie['@f_ex_rate'], 'f_perner': yglui_str_com_fie['@f_pernr'], 'plan': yglui_str_com_fie['@f_plan'], 'i': i, 'completed': completed, 'style': 'font-family=Trebuchet MS; font-size= 9pt;', 'limitpct': limitpct, 'value': '' });
                            break;
                        case 'date':
                            myElement = new Element("input", { "type": "text", 'size': yglui_str_com_fie['@input_size'], 'compcat': yglui_str_com_fie['@compcat'], 'event_fired': yglui_str_com_fie['@event_fired'], 'linked_plan': yglui_str_com_fie['@linked_plan'], 'f_citem': yglui_str_com_fie['@f_citem'], 'update_method': yglui_str_com_fie['@update_method'], 'update_ns_method': yglui_str_com_fie['@update_ns_method'], 'class': 'COM_app_input_box', 'id': yglui_str_com_fie['@field'] + '_' + yglui_str_com_fie['@f_pernr'] + '_' + i, 'currValue': '', 'oldValue': '', 'budget': yglui_str_com_fie['@f_budget'], 'itkey': yglui_str_com_fie['@itkey'], 'ex_rate': yglui_str_com_fie['@f_ex_rate'], 'f_perner': yglui_str_com_fie['@f_pernr'], 'plan': yglui_str_com_fie['@f_plan'], 'i': i, 'completed': completed, 'style': 'font-family=Trebuchet MS; font-size= 9pt;', 'limitpct': limitpct, 'value': '' });
                            break;
                        default:
                            myElement = new Element("input", { "type": "text", 'size': yglui_str_com_fie['@input_size'], 'compcat': yglui_str_com_fie['@compcat'], 'event_fired': yglui_str_com_fie['@event_fired'], 'linked_plan': yglui_str_com_fie['@linked_plan'], 'f_citem': yglui_str_com_fie['@f_citem'], 'update_method': yglui_str_com_fie['@update_method'], 'update_ns_method': yglui_str_com_fie['@update_ns_method'], 'class': 'COM_app_input_box', 'id': yglui_str_com_fie['@field'] + '_' + yglui_str_com_fie['@f_pernr'] + '_' + i, 'currValue': '', 'oldValue': '', 'budget': yglui_str_com_fie['@f_budget'], 'itkey': yglui_str_com_fie['@itkey'], 'ex_rate': yglui_str_com_fie['@f_ex_rate'], 'f_stkun': yglui_str_com_fie['@f_stkun'], 'f_perner': yglui_str_com_fie['@f_pernr'], 'plan': yglui_str_com_fie['@f_plan'], 'i': i, 'completed': completed, 'style': 'font-family=Trebuchet MS; font-size= 9pt;', 'limitpct': limitpct, 'value': '' });
                            break;
                    }
                    myElement.observe('keyup', this.lookKey.bind(this));

                    if (yglui_str_com_fie['@value'] == null) {
                        yglui_str_com_fie['@value'] = '';
                    }

                    // Fill plans list
                    if (yglui_str_com_fie['@linked_plan'] != null && plansListNotFilled) {
                        this.planList.push(yglui_str_com_fie['@linked_plan']);
                        this.planListNames.push(yglui_str_com_fie['@f_plan_text']);
                    }
                }
                else {
                    switch (yglui_str_com_fie['@type']) {
                        case 'text':
                            myElement = new Element('span', { 'id': yglui_str_com_fie['@field'] + '_' + yglui_str_com_fie['@f_pernr'] + '_' + i, 'size': yglui_str_com_fie['@input_size'], 'compcat': yglui_str_com_fie['@compcat'], 'linked_plan': yglui_str_com_fie['@linked_plan'], 'value': trim(yglui_str_com_fie['@value']), 'f_citem': yglui_str_com_fie['@f_citem'], 'budget': yglui_str_com_fie['@f_budget'], 'f_perner': yglui_str_com_fie['@f_pernr'], 'plan': yglui_str_com_fie['@f_plan'], 'i': i }).update(yglui_str_com_fie['@value']);
                            break;
                        case 'currency':
                            var custValue = "0";
                            if (!Object.isEmpty(yglui_str_com_fie['@value']))
                                custValue = yglui_str_com_fie['@value'];
                            myElement = new Element('span', { 'id': yglui_str_com_fie['@field'] + '_' + yglui_str_com_fie['@f_pernr'] + '_' + i, 'size': yglui_str_com_fie['@input_size'], 'compcat': yglui_str_com_fie['@compcat'], 'linked_plan': yglui_str_com_fie['@linked_plan'], 'value': format_amount(yglui_str_com_fie['@value']), 'f_citem': yglui_str_com_fie['@f_citem'], 'budget': yglui_str_com_fie['@f_budget'], 'f_perner': yglui_str_com_fie['@f_pernr'], 'plan': yglui_str_com_fie['@f_plan'], 'i': i }).update(format_amount(custValue));
                            break;
                        case 'date':
                            myElement = new Element('span', { 'id': yglui_str_com_fie['@field'] + '_' + yglui_str_com_fie['@f_pernr'] + '_' + i, 'size': yglui_str_com_fie['@input_size'], 'compcat': yglui_str_com_fie['@compcat'], 'linked_plan': yglui_str_com_fie['@linked_plan'], 'value': trim(yglui_str_com_fie['@value']), 'f_citem': yglui_str_com_fie['@f_citem'], 'budget': yglui_str_com_fie['@f_budget'], 'f_perner': yglui_str_com_fie['@f_pernr'], 'plan': yglui_str_com_fie['@f_plan'], 'i': i }).update(objectToDisplay(yglui_str_com_fie['@value']));
                            break;
                        case 'number':
                            myElement = new Element('span', { 'id': yglui_str_com_fie['@field'] + '_' + yglui_str_com_fie['@f_pernr'] + '_' + i, 'size': yglui_str_com_fie['@input_size'], 'compcat': yglui_str_com_fie['@compcat'], 'linked_plan': yglui_str_com_fie['@linked_plan'], 'value': format_amount(yglui_str_com_fie['@value']), 'f_citem': yglui_str_com_fie['@f_citem'], 'budget': yglui_str_com_fie['@f_budget'], 'f_perner': yglui_str_com_fie['@f_pernr'], 'plan': yglui_str_com_fie['@f_plan'], 'i': i }).update(format_amount(yglui_str_com_fie['@value']));
                            break;
                        default:
                            myElement = new Element('span', { 'id': yglui_str_com_fie['@field'] + '_' + yglui_str_com_fie['@f_pernr'] + '_' + i, 'size': yglui_str_com_fie['@input_size'], 'compcat': yglui_str_com_fie['@compcat'], 'linked_plan': yglui_str_com_fie['@linked_plan'], 'value': trim(yglui_str_com_fie['@value']), 'f_citem': yglui_str_com_fie['@f_citem'], 'budget': yglui_str_com_fie['@f_budget'], 'f_perner': yglui_str_com_fie['@f_pernr'], 'plan': yglui_str_com_fie['@f_plan'], 'i': i }).update(yglui_str_com_fie['@value']);
                            break;
                    }
                    if (isDecimal(removeCommas(trim(yglui_str_com_fie['@value']))))
                        reAlignField = true;
                    if (!Object.isEmpty(yglui_str_com_fie['@hover_text'])) {
                        myElement.writeAttribute("title", yglui_str_com_fie['@hover_text']);
                    }
                }

                // If we're on SalaryReview and the field is an amount, and it has a value and the updateMethod is not null, then update the new base salary and compa-ratio
                if ((this.caller_name == "SalaryReview") && (field == 'CPAMT') && (null != yglui_str_com_fie['@update_method']) && ("updatedLumpSum" != yglui_str_com_fie['@update_method']) && ("updatedLumpSum" != yglui_str_com_fie['@update_method'])) { //This is a amount field and the updateMethod is not null, so procede.
                    var BS_id = 'SALRY' + '_' + yglui_str_com_fie['@f_pernr'] + '_' + i;
                    var CR_id = 'CPRAT' + '_' + yglui_str_com_fie['@f_pernr'] + '_' + i;
                    var newBS_id = 'NEW_SALRY' + '_' + yglui_str_com_fie['@f_pernr'] + '_' + i;
                    var newCR_id = 'NEW_CPRAT' + '_' + yglui_str_com_fie['@f_pernr'] + '_' + i;

                    var BS = bodyTr.parentNode.down('[id=' + BS_id + ']');
                    var CR = bodyTr.parentNode.down('[id=' + CR_id + ']');
                    var newBS = bodyTr.parentNode.down('[id=' + newBS_id + ']');
                    var newCR = bodyTr.parentNode.down('[id=' + newCR_id + ']');

                    // New Base Salary calculation, as at this point no change is made, the first time I took the BS value as base, If it's a second amount to update the BS, I take the newBS as base
                    if ((newBS.readAttribute('value') + "").indexOf('.') != -1 || (newBS.readAttribute('value') + "").indexOf(',') != -1) {
                        if (displayToLong(newBS.readAttribute('value')) == 0)
                            newBSvalue = parseFloat(displayToLong(BS.readAttribute('value'))) + (yglui_str_com_fie['@value'] - 0);
                        else
                            newBSvalue = parseFloat(displayToLong(newBS.readAttribute('value'))) + (yglui_str_com_fie['@value'] - 0);
                    }
                    else {
                        if (newBS.readAttribute('value') == 0)
                            newBSvalue = parseFloat(displayToLong(BS.readAttribute('value'))) + (yglui_str_com_fie['@value'] - 0);
                        else
                            newBSvalue = newBS.readAttribute('value') + (yglui_str_com_fie['@value'] - 0);
                    }


                    newBS.writeAttribute('value', newBSvalue);
                    newBS.innerHTML = format_amount(newBSvalue);
                    // Compa-ratio calculation
                    var compa_id = 'NEW_CPRAT' + '_' + yglui_str_com_fie['@f_pernr'] + '_' + i;
                    var avgSal_id = 'AVG_SALRY' + '_' + yglui_str_com_fie['@f_pernr'] + '_' + i;
                    var compaRatio = bodyTr.parentNode.down('[id=' + compa_id + ']');
                    var avgSal = bodyTr.parentNode.down('[id=' + avgSal_id + ']');
                    var newCompaVal = newBSvalue / displayToLong(avgSal.readAttribute('value'));
                    newCompaVal = Math.round(newCompaVal * 100) / 100;
                    compaRatio.innerHTML = format_amount(newCompaVal);
                }

                // Add observers to events and fire custom events and methods
                if (!Object.isEmpty(yglui_str_com_fie['@event_fired'])) {
                    args = $H({ 'field': yglui_str_com_fie['@field'], 'pernr': yglui_str_com_fie['@f_pernr'], 'plan': yglui_str_com_fie['@f_plan'], 'i': i, 'budget': yglui_str_com_fie['@f_budget'] });
                    myElement.observe('change', this.onChangeFieldEv.bindAsEventListener(this, yglui_str_com_fie['@event_fired'], args));
                }
                if (!Object.isEmpty(yglui_str_com_fie['@update_method'])) {
                    args = $H({ 'field': yglui_str_com_fie['@field'], 'pernr': yglui_str_com_fie['@f_pernr'], 'plan': yglui_str_com_fie['@f_plan'], 'i': i, 'budget': yglui_str_com_fie['@f_budget'] });
                    myElement.observe('change', eval('this.' + yglui_str_com_fie['@update_method']).bindAsEventListener(this, args, ''));
                }
                if (!Object.isEmpty(yglui_str_com_fie['@update_ns_method'])) {
                    args = $H({ 'field': yglui_str_com_fie['@field'], 'pernr': yglui_str_com_fie['@f_pernr'], 'plan': yglui_str_com_fie['@f_plan'], 'i': i, 'budget': yglui_str_com_fie['@f_budget'] });
                    myElement.observe('change', eval('this.' + yglui_str_com_fie['@update_ns_method']).bindAsEventListener(this, args, ''));
                }
                bodyTd.insert(myElement);
                bodyTr.insert(bodyTd);
                if (reAlignField) {
                    bodyTd.align = 'right';
                }
            } .bind(this));
            plansListNotFilled = false;
        } .bind(this));
        //Add a br element to prevent IE hide last row with the scrollbar
        var brTr = new Element('tr');
        brTr.insert(new Element('td', { 'colspan': '300' }).insert(new Element('br')));
        tbody.insert(brTr);
        this.max_row_number = i;
        _thiss.planList = this.planList;
        _thiss.planListNames = this.planListNames;
        _thiss.initialJson = this.initialJson;
        _thiss.caller_name = this.caller_name;
        _thiss.dynLabels = this.dynLabels;
        TableKit.Sortable.init('bodyTable');
        this.employeeListTable = this.employeeListDiv;
        // If its readonly mode, hidde save/undo buttons
        if (enableInputs != 'X') {
            document.fire('EWS:compensation_hidebuttons');
        }
        else { document.fire('EWS:compensation_showbuttons'); }
    },

    /**
    *@description Remove the content of the list of employees and unload the tableKit.
    *			  
    */
    closeEmployeeList: function() {
        // Do something only if there is a current table
        if (Object.isEmpty($("bodyTable"))) return;
        TableKit.unloadTable("bodyTable");
    },

    /**
    *@description Catch onChange events from cells, and if any event is declared, this method fires these events
    *				
    */
    onChangeFieldEv: function(obj, eventName, args) {
        var originalTarget = getEventSrc(obj);
        var currVal = originalTarget.readAttribute('currValue');
        var oldVal = originalTarget.readAttribute('oldValue');
        var ex_rate = originalTarget.readAttribute('ex_rate');
        var diff = 0;
        //Check due to diff in event call order between IE and FF
        if ((currVal - 0) == (oldVal - 0)) {
            originalTarget.writeAttribute('oldValue', this.old_value);
            oldVal = this.old_value;
        }
        if (Object.isEmpty(this.old_value)) { oldVal = 0; }
        // Calculate diff between new amount and old amount
        diff = (parseFloat(currVal) - parseFloat(oldVal)) * ex_rate;
        diff = Math.round(diff * 100) / 100;
        args = args.toArray();
        args.push({ 'oldvalue': Math.round((oldVal * ex_rate) * 100) / 100 });
        args.push({ 'diff': diff });
        document.fire('EWS:compensation_' + eventName, { 'value': currVal, 'args': args });
        originalTarget.writeAttribute('oldValue', currVal);
    },

    //--------------------------------------------------------------------------------------------------------------------------
    //					UPDATE METHODS
    //--------------------------------------------------------------------------------------------------------------------------	

    /**
    *@description Updates Base salary and compa-ratio fields. 
    *				
    */

    updateBSalaryAndCR: function(obj, args, value) {
        // debugger;
        var originalTarget = null;
        var ex_rate = null;
        if (Object.isEmpty(value)) {
            originalTarget = getEventSrc(obj);
            ex_rate = originalTarget.readAttribute('ex_rate');
            if (Object.isEmpty(originalTarget.value))
                value = "0";
            else {
                value = originalTarget.value;
                if (value.indexOf('.') == -1 && value.indexOf(',') == -1)
                    value = longToDisplay(parseFloat(originalTarget.value));
                else
                    value = longToDisplay(parseFloat(displayToLong(originalTarget.value)));
            }
            value = displayToLong(value);
            originalTarget.writeAttribute('currValue', value);
        }
        var BS_id = 'SALRY' + '_' + args._object.pernr + '_' + args._object.i;
        var CR_id = 'CPRAT' + '_' + args._object.pernr + '_' + args._object.i;
        var newBS_id = 'NEW_SALRY' + '_' + args._object.pernr + '_' + args._object.i;
        var newCR_id = 'NEW_CPRAT' + '_' + args._object.pernr + '_' + args._object.i;
        var field_id = args._object.field.split('_', 1);
        var Amount_id = field_id + '_CPAMT' + '_' + args._object.pernr + '_' + args._object.i;
        var amount = $(Amount_id);
        var BS = $(BS_id);
        var CR = $(CR_id);
        var newBS = $(newBS_id);
        var newCR = $(newCR_id);
        this.old_value = amount.readAttribute('oldValue');
        amount.writeAttribute('oldValue', value);

        // New Base Salary calculation
        // modified miguelg - 20100224 begin : Firefox did not transform value into number, so calculation was not correct
        //newBSvalue = newBS.readAttribute('value') + (value - this.old_value);
        newBSvalue = parseFloat(newBS.readAttribute('value')) + (value - this.old_value);
        newBS.writeAttribute('value', newBSvalue);
        newBS.innerHTML = format_amount(newBSvalue);

        // Compa-ratio calculation
        var compa_id = 'NEW_CPRAT' + '_' + args._object.pernr + '_' + args._object.i;
        var avgSal_id = 'AVG_SALRY' + '_' + args._object.pernr + '_' + args._object.i;
        var compaRatio = $(compa_id);
        var avgSal = $(avgSal_id);
        var newCompaVal = newBSvalue / displayToLong(avgSal.readAttribute('value'));
        compaRatio.innerHTML = format_amount(newCompaVal);

        // Update percentage field value
        var field_id = args._object.field.split('_', 1);
        var perct_id = field_id + '_CPPCT' + '_' + args._object.pernr + '_' + args._object.i;
        var perct = $(perct_id);
        if (displayToLong(BS.readAttribute('value')) > 0 && ((!Object.isEmpty(perct.value)) || (!Object.isEmpty(value))))
            perct.value = format_amount(Math.round((value * 100) / displayToLong(BS.readAttribute('value')) * 100) / 100);
        if (Object.isEmpty(perct.value))
            perct.value = '0';
        perct.currValue = Math.round((value * 100) / displayToLong(BS.readAttribute('value')) * 100) / 100;
        // Whenever an amount is updated, update the changed_rows hash
        var count = 0;
        var found = -1;
        this.changed_rows.elements.each(function(row) {
            var row_id = field_id + '_CPAMT' + '_' + args._object.pernr + '_' + args._object.i;
            if (row.id == row_id)
                found = count;
            count++;
        });

        var row_id = field_id + '_CPAMT' + '_' + args._object.pernr + '_' + args._object.i;
        $('saveChangesNote').style.display = '';
        if (found >= 0) {
            if (!Object.isEmpty(value))
                this.changed_rows.elements[found].amount = (value - 0);
            else {
                this.changed_rows.elements[found].amount = "";
            }
        }
        else {
            if (!Object.isEmpty(value))
                this.changed_rows.elements.push({ 'id': row_id, 'amount': value, 'itkey': amount.readAttribute('itkey') });
            else
                this.changed_rows.elements.push({ 'id': row_id, 'amount': '', 'itkey': amount.readAttribute('itkey') });
        }
        // When an amount is updated, check if the number of updated plans needs to be changed
        var completedInit = amount.readAttribute('completed');
        var completed = 'X';
        if (Object.isEmpty(perct.value))
            completed = '';
        if (completed == '' && completedInit == 'X') {
            amount.writeAttribute('completed', completed);
            document.fire('EWS:compensation_updateEE', { 'value': 1 });
        }
        if (completed == 'X' && completedInit == '') {
            amount.writeAttribute('completed', completed);
            document.fire('EWS:compensation_updateEE', { 'value': -1 });
        }
        if (!Object.isEmpty(value)) {
            amount.value = format_amount(Math.round(value * 100) / 100);
        }
    },
    /**
    *@description Updates Amount field and calls it's update method.
    *				
    */
    updateAmount: function(obj, args) {
        var originalTarget = getEventSrc(obj);
        var ex_rate = originalTarget.readAttribute('ex_rate');
        // Get actual values
        var BS_id = 'SALRY' + '_' + args._object.pernr + '_' + args._object.i;
        var field_id = args._object.field.split('_', 1);
        var Amount_id = field_id + '_CPAMT' + '_' + args._object.pernr + '_' + args._object.i;
        if (Object.isEmpty(originalTarget.value))
            myVal = 0;
        else {
            value = originalTarget.value;
            if (value.indexOf('.') == -1 && value.indexOf(',') == -1)
                value = longToDisplay(parseFloat(originalTarget.value));
            else
                value = longToDisplay(parseFloat(displayToLong(originalTarget.value)));
        }
        //calculate new values
        var BS = $(BS_id);
        var amount = $(Amount_id);
        // Number formating to support EU and US formats
        if (!Object.isNumber(amount.value) && (amount.value.indexOf('.') != -1 || amount.value.indexOf(',') != -1))
            amount.value = displayToLong(amount.value);
        if (!Object.isNumber(originalTarget.value) && (originalTarget.value.indexOf('.') != -1 || originalTarget.value.indexOf(',') != -1))
            originalTarget.value = displayToLong(originalTarget.value);
        this.old_value = amount.readAttribute('oldValue');
        amount.writeAttribute('oldValue', amount.readAttribute('currValue'));

        var oldVal = amount.value;
        newAmountValue = (displayToLong(BS.readAttribute('value')) * originalTarget.value) / 100;
        amount.value = format_amount(Math.round(newAmountValue * 100) / 100);
        amount.writeAttribute('currValue', newAmountValue);
        if (!Object.isEmpty(originalTarget.value))
            originalTarget.value = Math.round(newAmountValue * 100) / 100;
        // launch update method
        if (!Object.isEmpty(amount.readAttribute('update_method')))
            if (!Object.isEmpty(originalTarget.value))
            eval('this.' + amount.readAttribute('update_method') + '(obj, args,' + newAmountValue + ')');
        else
            eval('this.' + amount.readAttribute('update_method') + '(obj, args,"")');
        // originalTarget.value = myVal;
        // Fire event to update orgSummary and left widgets.
        if (oldVal == '')
            oldVal = 0;
        var diff = (newAmountValue - oldVal) / ex_rate;
        var realAmountValue = newAmountValue / ex_rate;
        args = args.toArray();
        args.push({ 'oldvalue': oldVal });
        args.push({ 'diff': diff });
        if ((null != amount.readAttribute('event_fired')) && (diff != 0))
            document.fire('EWS:compensation_' + amount.readAttribute('event_fired'), { 'value': realAmountValue, 'args': args });
    },

    /**
    *@description Updates Lump Sum Amount field and calls it's update method.
    *				
    */
    updatedLumpSum: function(obj, args, value) {
        var originalTarget = null;
        if (Object.isEmpty(value)) {
            originalTarget = getEventSrc(obj)

            if (Object.isEmpty(originalTarget.value))
                value = "0";
            else {
                value = originalTarget.value;
                if (value.indexOf('.') == -1 || value.indexOf(',') == -1)
                    value = longToDisplay(parseFloat(originalTarget.value));
            }

            value = displayToLong(value);
            originalTarget.writeAttribute('currValue', value);
        }
        var field_id = args._object.field.split('_', 1);
        // Whenever an amount is updated, update the changed_rows hash
        var count = 0;
        var found = -1;
        this.changed_rows.elements.each(function(row) {
            var row_id = field_id + '_CPAMT' + '_' + args._object.pernr + '_' + args._object.i;
            if (row.id == row_id)
                found = count;
            count++;
        });
        var oldVal = 0;

        var row_id = field_id + '_CPAMT' + '_' + args._object.pernr + '_' + args._object.i;
        var ls = $(row_id);
        if (!Object.isEmpty(ls.readAttribute('oldValue')))
            oldVal = ls.readAttribute('oldValue');
        this.old_value = oldVal;
        ls.writeAttribute('oldValue', value);
        $('saveChangesNote').style.display = '';
        if (found >= 0) {
            if (!Object.isEmpty(value))
                this.changed_rows.elements[found].amount = (value - 0);
            else { this.changed_rows.elements.splice(found, 1) }
        }
        else {
            if (!Object.isEmpty(value))
                this.changed_rows.elements.push({ 'id': row_id, 'amount': (value - 0), 'itkey': ls.readAttribute('itkey') });
            else
                this.changed_rows.elements.push({ 'id': row_id, 'amount': '', 'itkey': ls.readAttribute('itkey') });
        }
        // When an amount is updated, loop through the row, and if all amounts are completed, update the Employees OK field in the summary
        var trRow = $(args._object.i + '_' + args._object.pernr);
        var inputArr = trRow.getElementsByTagName('input');
        var arLen = inputArr.length;
        var completedInit = ls.readAttribute('completed');
        var completed = 'X';
        if (value == '')
            completed = '';
        if (completed == 'X' && completedInit == '') {
            ls.writeAttribute('completed', completed);
            document.fire('EWS:compensation_updateEE', { 'value': -1 });
        }
        originalTarget.value = longToDisplay(parseFloat(value));
    },

    /**
    *@description Updates result Amount and percentage.
    *				
    */
    updatePayout: function(obj, args, value) {
        var originalTarget = null;
        if (Object.isEmpty(value)) {
            originalTarget = getEventSrc(obj)
            if (Object.isEmpty(originalTarget.value))
                value = "0";
            else {
                value = originalTarget.value;
                if (value.indexOf('.') == -1 || value.indexOf(',') == -1)
                    value = longToDisplay(parseFloat(originalTarget.value));
            }
            originalTarget.writeAttribute('currValue', displayToLong(value));
        }
        // Get actual values
        var RES_AMT_id = 'PLAN_CPAMT' + '_' + args._object.pernr + '_' + args._object.i;
        var RES_PCT_id = 'TOTAL_PCT' + '_' + args._object.pernr + '_' + args._object.i;
        var RES_AMT = $(RES_AMT_id);
        var RES_PCT = $(RES_PCT_id);
        var field_id = args._object.field.split('_', 1);
        var Amount_id = field_id + '_CPAMT' + '_' + args._object.pernr + '_' + args._object.i;
        var PCT_id = field_id + '_CPPCT' + '_' + args._object.pernr + '_' + args._object.i;
        var PCT = $(PCT_id);
        var disc_amt = parseFloat(displayToLong(value));
        var nonDisc_id = 'COMPANY_AMT' + '_' + args._object.pernr + '_' + args._object.i;
        var nonDisc_amt = parseFloat(displayToLong($(nonDisc_id).value));
        var payout_id = 'FIN_PAYOUT_AMT' + '_' + args._object.pernr + '_' + args._object.i;
        var payout_amt = parseFloat(displayToLong($(payout_id).value));
        var db_id = 'DISC_BASE' + '_' + args._object.pernr + '_' + args._object.i;
        var db_amt = parseFloat(displayToLong($(db_id).value));
        //calculate new values
        this.old_value = $(Amount_id).readAttribute('oldValue');
        $(Amount_id).writeAttribute('oldValue', displayToLong(value));

        // New Result Amount calculation
        var RES_AMT_value = disc_amt + nonDisc_amt;
        RES_AMT.writeAttribute('value', RES_AMT_value);
        RES_AMT.innerHTML = format_amount(RES_AMT_value);

        // New result % calculation
        var temp_perc = ((disc_amt + nonDisc_amt) / (nonDisc_amt + db_amt)) * 100;
        RES_PCT.value = Math.round(temp_perc * 100) / 100;
        RES_PCT.writeAttribute('value', RES_PCT.value);
        RES_PCT.innerHTML = format_amount(RES_PCT.value);

        // Update percentage field value
        if (Object.isEmpty(originalTarget.value)) {
            PCT.value = '';
            PCT.writeAttribute('value', '');
        }
        else {
            newVal = Math.round((disc_amt / db_amt) * 10000) / 100;
            PCT.value = newVal;
            PCT.writeAttribute('value', format_amount(newVal));
            //PCT.innerHTML = format_amount(newVal);
        }
        // Whenever an amount is updated, update the changed_rows hash
        var count = 0;
        var found = -1;
        this.changed_rows.elements.each(function(row) {
            var row_id = 'PLAN_CPAMT' + '_' + args._object.pernr + '_' + args._object.i;
            if (row.id == row_id)
                found = count;
            count++;
        });
        var row_id = 'PLAN_CPAMT' + '_' + args._object.pernr + '_' + args._object.i;
        $('saveChangesNote').style.display = '';
        if (found >= 0) {
            if (!Object.isEmpty(value))
                this.changed_rows.elements[found].amount = RES_AMT_value;
            else { this.changed_rows.elements.splice(found, 1) }
        }
        else {
            if (!Object.isEmpty(value))
                this.changed_rows.elements.push({ 'id': row_id, 'amount': RES_AMT_value, 'itkey': $(Amount_id).readAttribute('itkey') });
        }
        // When an amount is updated, check if the number of updated plans needs to be changed
        var completedInit = $(Amount_id).readAttribute('completed');
        var completed = 'X';
        if (value == '')
            completed = '';
        if (completed == 'X' && completedInit == '') {
            $(Amount_id).writeAttribute('completed', completed);
            document.fire('EWS:compensation_updateEE', { 'value': -1 });
        }
        originalTarget.value = value;
    },

    /**
    *@description Updates discretionary percentage field and calls it's update mehotd
    *				
    */
    updateDiscAmount: function(obj, args, value) {
        var originalTarget = getEventSrc(obj);
        // Get actual values
        var RES_id = 'PLAN_CPAMT' + '_' + args._object.pernr + '_' + args._object.i;
        var comp_id = 'COMPANY_AMT' + '_' + args._object.pernr + '_' + args._object.i;
        var field_id = args._object.field.split('_', 1);
        var Amount_id = field_id + '_CPAMT' + '_' + args._object.pernr + '_' + args._object.i;
        var db_id = 'DISC_BASE' + '_' + args._object.pernr + '_' + args._object.i;
        var db_amt = displayToLong($(db_id).value);
        var RES = $(RES_id);
        var amount = $(Amount_id);
        var comp_amt = displayToLong($(comp_id).value);

        try {
            if (RES.value.indexOf('.') == -1 || RES.value.indexOf(',') == -1)
                RES.value = displayToLong(RES.value);
        } catch (e) { }
        try {
            if (amount.value.indexOf('.') == -1 || amount.value.indexOf(',') == -1)
                amount.value = displayToLong(amount.value);
        } catch (e1) { }

        var original_value = ((parseFloat((RES.value)) * 100) / 100) - ((parseFloat((amount.value)) * 100) / 100);

        //calculate new values
        var myVal;
        if (Object.isEmpty(originalTarget.value))
            myVal = "0";
        else {
            myVal = originalTarget.value;
            if (myVal.indexOf('.') == -1 || myVal.indexOf(',') == -1)
                myVal = longToDisplay(parseFloat(displayToLong(originalTarget.value))); //longToDisplay(parseFloat(originalTarget.value));
        }
        this.old_value = amount.readAttribute('oldValue');
        amount.writeAttribute('oldValue', amount.value);
        var oldVal = 0;
        if (amount.value.indexOf('.') == -1 || amount.value.indexOf(',') == -1)
            oldVal = parseFloat(amount.value);
        else
            oldVal = parseFloat(displayToLong(amount.value));
        newAmountValue = ((db_amt * displayToLong(myVal)) / 100);
        amount.value = format_amount(Math.round(newAmountValue * 100) / 100);
        originalTarget.value = newAmountValue //format_amount(Math.round(newAmountValue * 100) / 100);
        // launch update method
        if (!Object.isEmpty(amount.readAttribute('update_method')))
            eval('this.' + amount.readAttribute('update_method') + '(obj, args)');
        originalTarget.value = myVal;

        // Fire event to update orgSummary and left widgets.
        if (oldVal == '')
            oldVal = 0;
        var diff = newAmountValue - oldVal;
        args = args.toArray();
        args.push({ 'oldvalue': oldVal });
        args.push({ 'diff': diff });
        if ((!Object.isEmpty(amount.readAttribute('event_fired'))) && (diff != 0))
            document.fire('EWS:compensation_' + amount.readAttribute('event_fired'), { 'value': newAmountValue, 'args': args });
    },

    //--------------------------------------------------------------------------------------------------------------------------
    //					CUSTOM UPDATE METHODS
    //--------------------------------------------------------------------------------------------------------------------------


    updateLTI: function(obj, args, value) {
        var originalTarget = null;
        if (Object.isEmpty(value)) {
            originalTarget = getEventSrc(obj)
            if (Object.isEmpty(originalTarget.value))
                value = "0";
            else {
                value = originalTarget.value;
                if (value.indexOf('.') == -1 || value.indexOf(',') == -1)
                    value = longToDisplay(parseFloat(originalTarget.value));
            }
            originalTarget.writeAttribute('currValue', displayToLong(value));
        }
        // Whenever an amount is updated, update the changed_rows hash
        var count = 0;
        var found = -1;
        var field_id = args._object.field.split('_', 1);
        this.changed_rows.elements.each(function(row) {
            var row_id = 'PLAN_CPNUM' + '_' + args._object.pernr + '_' + args._object.i;
            if (row.id == row_id)
                found = count;
            count++;
        });

        var row_id = 'PLAN_CPNUM' + '_' + args._object.pernr + '_' + args._object.i;
        var amount = $('PLAN_CPNUM' + '_' + args._object.pernr + '_' + args._object.i);
        this.old_value = amount.readAttribute('oldValue');
        amount.writeAttribute('oldValue', amount.value);
        $('saveChangesNote').style.display = '';
        if (found >= 0) {
            if (!Object.isEmpty(value))
                this.changed_rows.elements[found].amount = (value - 0);
            else { this.changed_rows.elements.splice(found, 1) }
        }
        else {
            if (!Object.isEmpty(value))
                this.changed_rows.elements.push({ 'id': row_id, 'amount': (displayToLong(value) - 0), 'itkey': amount.readAttribute('itkey') });
        }
        // When an amount is updated, check if the number of updated plans needs to be changed
        var completedInit = amount.readAttribute('completed');
        var completed = 'X';
        if (value == '')
            completed = '';
        if (completed == '' && completedInit == 'X') {
            amount.writeAttribute('completed', completed);
            document.fire('EWS:compensation_updateEE', { 'value': 1 });
        }
        if (completed == 'X' && completedInit == '') {
            amount.writeAttribute('completed', completed);
            document.fire('EWS:compensation_updateEE', { 'value': -1 });
        }
        originalTarget.value = value;
    },

    //--------------------------------------------------------------------------------------------------------------------------
    //					BALLOON METHODS
    //--------------------------------------------------------------------------------------------------------------------------	

    /**
    *@description Displays the balloon when a User name is clicked.
    *				
    */
    displayBalloon: function(ev) {
        var actionsList = new Element("ul");
        var originalTarget = getEventSrc(ev);
        var param_i = originalTarget.getAttribute('i');
        var pernr = originalTarget.getAttribute('pernr');

        var orgUnitDetail = $A();
        if (!Object.isEmpty(this.initialJson.EWS.o_org_unit))
            orgUnitDetail = objectToArray(this.initialJson.EWS.o_org_unit);

        var ouName = '';
        var canSave = '';
        orgUnitDetail.each(function(orgUnit) {
            canSave = orgUnit['@can_save'];
        });
        var option1 = this.getDynLabels('viewDetail');
        var listElement1 = new Element("li", {
            'class': 'application_action_link',
            'onclick': '_thiss.buttonClicked(event, "EMP_VIEW_DET", "actions_link_emp_list", "' + pernr + '", "' + param_i + '");'
        }).update(option1);
        actionsList.insert(listElement1);

        if (this.caller_name == "SalaryReview") {
            var option2 = this.getDynLabels('viewGuideline');
            var listElement2 = new Element("li", {
                'class': 'application_action_link',
                'onclick': '_thiss.buttonClicked(event, "EMP_VIEW_GUIDDET", "actions_link_emp_list", "' + pernr + '", "' + param_i + '");'
            }).update(option2);
            actionsList.insert(listElement2);
            if (canSave == 'X') {
                var option3 = this.getDynLabels('applyGuideline');
                var listElement3 = new Element("li", {
                    'class': 'application_action_link',
                    'onclick': '_thiss.buttonClicked(event, "APP_GUIDE", "actions_link_emp_list", "' + pernr + '", "' + param_i + ' ");'
                }).update(option3);
                actionsList.insert(listElement3);
            }
        }

        var originalTarget = getEventSrc(ev);
        balloon.showOptions($H({
            domId: 'NAME_' + pernr + '_' + originalTarget.readAttribute('i'),
            content: actionsList.innerHTML,
            dimensions: [200, 100]
        }));
        balloon.show();
    },

    /**
    *@description Displays the balloon when actions link is clicked.
    *				
    */
    displayActionsBalloon: function(ev) {
        var actionsList = new Element("ul");
        var option1 = this.getDynLabels('applyPercentage');

        var listElement1 = new Element("li", {
            'class': 'application_action_link',
            'onclick': '_thiss.buttonClicked(event, "APP_PERC", "actions_link_emp_list");'
        }).update(option1);
        actionsList.insert(listElement1);

        var orgUnitDetail = $A();
        if (!Object.isEmpty(this.initialJson.EWS.o_org_unit))
            orgUnitDetail = objectToArray(this.initialJson.EWS.o_org_unit);

        var canSave = '';
        orgUnitDetail.each(function(orgUnit) {
            canSave = orgUnit['@can_save'];
        });

        if ((this.caller_name == "SalaryReview") && (canSave == 'X')) {
            var option2 = this.getDynLabels('applyGuideline');
            var listElement2 = new Element("li", {
                'class': 'application_action_link',
                'onclick': '_thiss.buttonClicked(event, "APP_ACT_GUIDE", "actions_link_emp_list");'
            }).update(option2);
            actionsList.insert(listElement2);
        }

        balloon.showOptions($H({
            domId: 'actions_link_emp_list',
            content: actionsList.innerHTML,
            dimensions: [150, 30]
        }));
        balloon.show();
    },

    /**
    *@description Actions to excecute when a link in a balloon is clicked.
    *				
    */
    buttonClicked: function(ev, mod, bal_id, pernr, param_i) {
        balloon.hide();
        switch (mod) {
            case 'APP_PERC':
                var mainDiv = new Element('div', { 'style': 'width:100%;' });
                var table = new Element('table', {
                    'cellspacing': '1',
                    'id': 'ballTable',
                    'style': 'width:100%;'
                });
                mainDiv.insert(table);
                var tr = new Element('tr');
                table.insert(tr);
                var td = new Element('td');
                tr.insert(td);
                td.insert(new Element('span', {
                    'class': 'application_main_text'
                }).update('Select Plan:'));
                var td = new Element('td');
                tr.insert(td);
                var selectBox = new Element('select', {
                    'class': 'fieldDisplayer_select',
                    'id': 'plan_select'
                });
                td.insert(selectBox);
                var oldPlan = '';
                var arLen = this.planList.length;
                // Generic application displays a drop down list by default.
                // modified miguelg - 20100426 begin: Display only the first plan. This applies for Salary Review, to only
                // display the Merit plan. If Bonus or LTI need to implement this functionality, this code will need to be
                // reviewed
                //for (var it = 0, len = arLen; it < len; ++it) {
                for (var it = 0, len = 1; it < len; ++it) {
                    if (oldPlan != this.planList[it]) {
                        oldPlan = this.planList[it];
                        selectBox.insert(new Element('option', { 'value': oldPlan }).update(this.planListNames[it]));

                    }
                }

                var tr = new Element('tr');
                table.insert(tr);
                var td = new Element('td', { 'style': 'width:100%;' });
                tr.insert(td);
                td.insert(new Element('span', {
                    'class': 'application_main_text'
                }).update('Enter Percentage:'));
                var td = new Element('td');
                tr.insert(td);
                var myInput = new Element("input", { "type": "text", 'onkeyup': '_thiss.lookKey(event);', 'size': '4', 'class': 'COM_app_input_box', 'id': 'action_percent_id' });
                td.insert(myInput);

                var tr = new Element('tr');
                table.insert(tr);

                var td = new Element('td');
                tr.insert(td);
                var td = new Element('td');
                tr.insert(td);
                //create the button
                var span = new Element('div', {
                    'id': 'applyButton',
                    'class': 'centerRoundedButton',
                    'style': 'clear:both;float:left;cursor: pointer;',
                    'onclick': '_thiss.actionUpdatePercentage2(event);'
                }).update("Apply");
                td.insert(span);
                span = new Element('div', { 'class': 'rightRoundedCorner', 'style': 'float:left' });
                td.insert(span);

                balloon.showOptions($H({
                    domId: bal_id,
                    content: mainDiv.innerHTML,
                    dimensions: [250, 120]
                }));
                balloon.show();
                break;
            case 'EMP_VIEW_DET':
                this.displayDetailsPopUp(pernr, param_i);
                break;

            case 'EMP_VIEW_GUIDDET':
                this.actionDisplayDetail2(pernr, param_i);
                break;

            case 'APP_ACT_GUIDE':
                this.applyActGuideline2();
                break;
            case 'APP_GUIDE':
                this.applyGuideline2(pernr, param_i);
                break;
        }

    },

    /**
    *@description Recalls the original object apply guideline
    *				
    */
    applyGuideline2: function(pernr, param_i) {
        eval(this.caller_name + '.prototype.excelTable.applyGuideline(pernr, param_i);');
    },

    /**
    *@description Recalls the original object apply guideline
    *				
    */
    applyActGuideline2: function() {
        eval(this.caller_name + '.prototype.excelTable.applyActGuideline();');
    },

    /**
    *@description Apply guideline to all employees.
    *				
    */
    applyActGuideline: function() {
        var employees = $A();
        //To apply the guideline, I loop through the whole initial structure and select ONLY the merit percentage field.
        if (!Object.isEmpty(this.initialJson.EWS.o_records))
            employees = objectToArray(this.initialJson.EWS.o_records.yglui_str_com_rec);
        var i = 1;
        employees.each(function(y_glui_str_com_rec) {
            i++;
            // Get actual values
            var BS_id = 'SALRY' + '_' + y_glui_str_com_rec['@pernr'] + '_' + i;
            var Amount_id = 'PLAN1' + '_CPAMT' + '_' + y_glui_str_com_rec['@pernr'] + '_' + i;
            var incentive_id = 'PLAN1_DFPCT' + '_' + y_glui_str_com_rec['@pernr'] + '_' + i;
            //calculate new values
            var BS = $(BS_id);
            var amount = $(Amount_id);
            var inc = $(incentive_id).value;
            if (inc != 'NA') {
                var pct_id = 'PLAN1' + '_CPPCT' + '_' + y_glui_str_com_rec['@pernr'] + '_' + i;
                var perct = $(pct_id);
                if (Object.isEmpty(perct.value)) {
                    amount.writeAttribute('completed', 'X');
                    document.fire('EWS:compensation_updateEE', { 'value': -1 });
                }
                perct.value = inc;
                newAmountValue = (displayToLong(BS.readAttribute('value')) * displayToLong(inc)) / 100;
                amount.value = newAmountValue;
                var oldVal = 0;
                if (!Object.isEmpty(amount.readAttribute('oldValue')))
                    oldVal = removeCommas(amount.readAttribute('oldValue'));
                amount.writeAttribute('oldValue', newAmountValue);
                args = $H({ 'field': 'PLAN1_CPAMT', 'pernr': y_glui_str_com_rec['@pernr'], 'plan': amount.readAttribute('plan'), 'i': i, 'budget': amount.readAttribute('budget') });

                var newBS_id = 'NEW_SALRY' + '_' + y_glui_str_com_rec['@pernr'] + '_' + i;
                var newCR_id = 'NEW_CPRAT' + '_' + y_glui_str_com_rec['@pernr'] + '_' + i;
                var newBS = $(newBS_id);
                var newCR = $(newCR_id);

                // New Base Salary calculation
                newBSvalue = newBS.readAttribute('value') + (amount.value - oldVal);
                newBS.writeAttribute('value', newBSvalue);
                newBS.innerHTML = format_amount(newBSvalue);

                // Compa-ratio calculation
                var compa_id = 'NEW_CPRAT' + '_' + y_glui_str_com_rec['@pernr'] + '_' + i;
                var avgSal_id = 'AVG_SALRY' + '_' + y_glui_str_com_rec['@pernr'] + '_' + i;
                var compaRatio = $(compa_id);
                var avgSal = $(avgSal_id);
                var newCompaVal = newBSvalue / (removeCommas(avgSal.readAttribute('value')) - 0);
                compaRatio.innerHTML = format_amount(newCompaVal);

                // Fire event to update orgSummary and left widgets.
                var diff = 0;
                if (!Object.isEmpty(oldVal))
                    diff = (removeCommas(newAmountValue) - 0) - (removeCommas(oldVal) - 0);
                else
                    diff = (removeCommas(newAmountValue) - 0);
                args2 = args.toArray();
                args2.push({ 'oldvalue': oldVal });
                args2.push({ 'diff': diff });
                if (!Object.isEmpty(amount.readAttribute('event_fired')))
                    document.fire('EWS:compensation_' + amount.readAttribute('event_fired'), { 'value': newAmountValue, 'args': args2 });
                if (!Object.isEmpty(amount.readAttribute('update_method')))
                    eval('this.' + amount.readAttribute('update_method') + '(null, args, newAmountValue)');
            }
        } .bind(this));
    },

    /**
    *@description Apply guideline to one employee.
    *				
    */
    applyGuideline: function(pernr, i) {
        // Get actual values
        i = trim(i);
        var BS_id = trim('SALRY' + '_' + pernr + '_' + i);
        var Amount_id = trim('PLAN1' + '_CPAMT' + '_' + pernr + '_' + i);
        var incentive_id = trim('PLAN1_DFPCT' + '_' + pernr + '_' + i);
        //calculate new values
        var BS = $(BS_id);
        var amount = $(Amount_id);
        var inc = $(incentive_id).readAttribute('value');
        if (inc != 'NA') {
            var pct_id = 'PLAN1' + '_CPPCT' + '_' + pernr + '_' + i;
            var perct = $(pct_id);
            if (Object.isEmpty(perct.value)) {
                amount.writeAttribute('completed', 'X');
                document.fire('EWS:compensation_updateEE', { 'value': -1 });
            }
            perct.value = inc;
            newAmountValue = (displayToLong(BS.readAttribute('value')) * displayToLong(inc)) / 100;
            amount.value = newAmountValue;
            var oldVal = 0;
            if (!Object.isEmpty(amount.readAttribute('oldValue')))
                oldVal = amount.readAttribute('oldValue');
            amount.writeAttribute('oldValue', newAmountValue);
            args = $H({ 'field': 'PLAN1_CPAMT', 'pernr': pernr, 'plan': amount.readAttribute('plan'), 'i': trim(i), 'budget': amount.readAttribute('budget') });

            var newBS_id = 'NEW_SALRY' + '_' + pernr + '_' + i;
            var newCR_id = 'NEW_CPRAT' + '_' + pernr + '_' + i;
            var newBS = $(newBS_id);
            var newCR = $(newCR_id);

            // New Base Salary calculation
            newBSvalue = newBS.readAttribute('value') + (amount.value - oldVal);
            newBS.writeAttribute('value', newBSvalue);
            newBS.innerHTML = format_amount(newBSvalue);

            // Compa-ratio calculation
            var compa_id = 'NEW_CPRAT' + '_' + pernr + '_' + i;
            var avgSal_id = 'AVG_SALRY' + '_' + pernr + '_' + i;
            var compaRatio = $(compa_id);
            var avgSal = $(avgSal_id);
            var newCompaVal = newBSvalue / displayToLong(avgSal.readAttribute('value'));
            compaRatio.innerHTML = format_amount(newCompaVal);

            // Fire event to update orgSummary and left widgets.
            var diff = 0;
            if (oldVal != '' && (null != oldVal))
                diff = newAmountValue - oldVal;
            else
                diff = newAmountValue;
            args2 = args.toArray();
            args2.push({ 'oldvalue': oldVal });
            args2.push({ 'diff': diff });
            if (!Object.isEmpty(amount.readAttribute('event_fired')))
                document.fire('EWS:compensation_' + amount.readAttribute('event_fired'), { 'value': newAmountValue, 'args': args2 });
            if (!Object.isEmpty(amount.readAttribute('update_method')))
                eval('this.' + amount.readAttribute('update_method') + '(null, args, newAmountValue)');
        }
    },


    /**
    *@description Recalls the original object update percentage
    *				
    */
    actionUpdatePercentage2: function(ev) {
        eval(this.caller_name + '.prototype.excelTable.actionUpdatePercentage(ev);');
        balloon.hide();
    },

    /**
    *@description Recalls the original object display detail
    *				
    */
    actionDisplayDetail2: function(pernr, param_i) {
        eval(this.caller_name + '.prototype.excelTable.actionDisplayDetail("' + pernr + '", "' + param_i + '");');
    },

    /**
    *@description Display employee detail.
    *				
    */
    actionDisplayDetail: function(pernr, param_i) {
        var v_citem = $('PLAN1_CPAMT_' + pernr + '_' + param_i).readAttribute('f_citem');
        this.displayGuidelinesPopUp(pernr, v_citem, param_i);
    },

    /**
    *@description Updates all percentages fields for the selected plan
    *				
    */
    actionUpdatePercentage: function(ev) {
        var percent = $('action_percent_id').value;
        if (validateNumber(percent - 0)) {
            var plan = $('plan_select').options[$('plan_select').selectedIndex].value;

            var employees = $A();
            //To apply the percentage, I loop through the whole initial structure and select ONLY the percentages fields related to the selected plan
            if (!Object.isEmpty(this.initialJson.EWS.o_records))
                employees = objectToArray(this.initialJson.EWS.o_records.yglui_str_com_rec);
            i = 1;
            employees.each(function(y_glui_str_com_rec) {
                i++;
                y_glui_str_com_rec.fields.yglui_str_com_fie.each(function(yglui_str_com_fie) {
                    if (yglui_str_com_fie['@linked_plan'] == plan && (removeCommas(yglui_str_com_fie['@input_size']) - 0) > 0) {
                        var field = yglui_str_com_fie['@field'].split('_', 2)[1];
                        if (field == 'CPPCT') { //This is a percentage field, so procede.
                            // Get actual values                       
                            var field_id = yglui_str_com_fie['@field'].split('_', 1);
                            var pctg_id = field_id + '_CPPCT' + '_' + yglui_str_com_fie['@f_pernr'] + '_' + i;
                            var BS_id = 'SALRY' + '_' + yglui_str_com_fie['@f_pernr'] + '_' + i;
                            var Amount_id = field_id + '_CPAMT' + '_' + yglui_str_com_fie['@f_pernr'] + '_' + i;
                            myVal = percent;
                            //calculate new values
                            var BS = $(BS_id);
                            var amount = $(Amount_id);
                            var pctg = $(pctg_id);
                            pctg.value = longToDisplay(parseFloat(displayToLong(percent)));
                            newAmountValue = (displayToLong(BS.readAttribute('value')) * parseFloat(displayToLong(percent))) / 100;
                            amount.value = longToDisplay(newAmountValue);
                            var oldVal = 0;
                            if (!Object.isEmpty(amount.readAttribute('oldValue')))
                                oldVal = amount.readAttribute('oldValue');
                            amount.writeAttribute('oldValue', newAmountValue);
                            args = $H({ 'field': yglui_str_com_fie['@field'], 'pernr': yglui_str_com_fie['@f_pernr'], 'plan': yglui_str_com_fie['@f_plan'], 'i': i, 'budget': yglui_str_com_fie['@f_budget'] });
                            // Fire event to update orgSummary and left widgets.
                            var diff = 0;
                            if (oldVal != '' && (null != oldVal))
                                diff = newAmountValue - oldVal;
                            else
                                diff = newAmountValue;
                            args2 = args.toArray();
                            args2.push({ 'oldvalue': oldVal });
                            args2.push({ 'diff': diff });
                            if (!Object.isEmpty(amount.readAttribute('event_fired')))
                                document.fire('EWS:compensation_' + amount.readAttribute('event_fired'), { 'value': newAmountValue, 'args': args2 });
                            if (!Object.isEmpty(amount.readAttribute('update_method')))
                                eval('this.' + amount.readAttribute('update_method') + '(null, args, newAmountValue)');

                            // New Base Salary calculation
                            var pernr = yglui_str_com_fie['@f_pernr'];
                            var newBS_id = 'NEW_SALRY' + '_' + pernr + '_' + i;
                            var newCR_id = 'NEW_CPRAT' + '_' + pernr + '_' + i;
                            var newBS = $(newBS_id);
                            var newCR = $(newCR_id);
                            // modified miguelg - 20100302 begin: Calculation was returning NaN
                            //newBSvalue = newBS.value + displayToLong(amount.value) - oldVal;
                            newBSvalue = parseFloat(newBS.readAttribute('value')) + parseFloat(displayToLong(amount.value)) - oldVal;
                            newBS.writeAttribute('value', newBSvalue);
                            newBS.innerHTML = format_amount(newBSvalue);

                            // Compa-ratio calculation
                            var compa_id = 'NEW_CPRAT' + '_' + pernr + '_' + i;
                            var avgSal_id = 'AVG_SALRY' + '_' + pernr + '_' + i;
                            var compaRatio = $(compa_id);
                            var avgSal = $(avgSal_id);
                            // modified miguelg - 20100302 begin: Calculation was returning NaN
                            //var newCompaVal = newBSvalue / displayToLong(avgSal.readAttribute('value'));
                            var newCompaVal = newBSvalue / parseFloat(displayToLong(avgSal.readAttribute('value')));
                            compaRatio.innerHTML = format_amount(newCompaVal);
                        }
                        else {
                            if (field == 'LUMPSUM') { //This is the lump sum, proceede with this special case.
                                // Get actual values
                                var BS_id = 'SALRY' + '_' + yglui_str_com_fie['@f_pernr'] + '_' + i;
                                var field_id = yglui_str_com_fie['@field'].split('_', 1);
                                var LS_id = field_id + '_CPAMT' + '_' + yglui_str_com_fie['@f_pernr'] + '_' + i;
                                myVal = percent;
                                //calculate new values
                                var BS = $(BS_id);
                                var LS = $(LS_id);
                                newAmountValue = ((removeCommas(BS.readAttribute('value')) - 0) * (removeCommas(percent) - 0)) / 100;
                                var oldVal = 0;
                                if (!Object.isEmpty(LS.readAttribute('oldValue')))
                                    oldVal = LS.readAttribute('oldValue');
                                LS.writeAttribute('oldValue', newAmountValue);
                                LS.value = newAmountValue;
                                args = $H({ 'field': yglui_str_com_fie['@field'], 'pernr': yglui_str_com_fie['@f_pernr'], 'plan': yglui_str_com_fie['@f_plan'], 'i': i, 'budget': yglui_str_com_fie['@f_budget'] });
                                // Fire event to update orgSummary and left widgets.
                                var diff = (removeCommas(newAmountValue) - 0) - (removeCommas(oldVal) - 0);
                                args2 = args.toArray();
                                args2.push({ 'oldvalue': oldVal });
                                args2.push({ 'diff': diff });
                                // Fire event to update orgSUmmary and left widgets.
                                if (!Object.isEmpty(LS.readAttribute('update_method')))
                                    eval('this.' + LS.readAttribute('update_method') + '(null, args, newAmountValue)');
                                if (!Object.isEmpty(LS.readAttribute('event_fired')))
                                    document.fire('EWS:compensation_' + LS.readAttribute('event_fired'), { 'value': newAmountValue, 'args': args2 });
                            }
                        }
                    }
                } .bind(this));
            } .bind(this));
        }
        else {
            alert('Wrong value on percent field') //Ver como se lanzan los errores en EWS
            return;
        }
    },
    //--------------------------------------------------------------------------------------------------------------------------
    //					INFOPOPUP METHODS
    //--------------------------------------------------------------------------------------------------------------------------
    /**
    *@description Displays the infoPopUp object with the complete table when the right arrow is clicked
    *				
    */
    displayInfoPopUp: function(event) {
        // Create object just in time.

        var orgUnitDetail = $A();
        if (!Object.isEmpty(this.initialJson.EWS.o_org_unit))
            orgUnitDetail = objectToArray(this.initialJson.EWS.o_org_unit);

        var ouName = '';
        var canSave = '';
        orgUnitDetail.each(function(orgUnit) {
            ouName = orgUnit['@org_text'];
            canSave = orgUnit['@can_save'];
        });

        var hash = $H({
            title: ouName
        });

        var content = new Element('table', { 'width': '100%' });
        var tbody = new Element('tbody');
        content.insert(tbody);
        var tr = new Element('tr');
        tbody.insert(tr);
        var td = new Element('td', { 'class': 'application_main_title2' })
        tr.insert(td);
        td.insert(hashToHtml(hash));
        var mainContent = new Element('div', { 'id': 'mainContent', 'style': 'padding-top:20px;margin-right:10px;width:100%;' });
        var contentHTML = new Element('div', { 'style': 'width:100%;height:400px;margin-right:20px;overflow:auto;overflow-x:auto;overflow-y:auto;' });
        contentHTML.insert(content);

        var contentDiv = new Element('div', { 'id': 'tableContentDiv' });


        var clonedTable = $('bodyTable');
        $('bodyTable').remove();

        var thArr = clonedTable.getElementsByTagName('th');
        var arLen = thArr.length;
        for (var it = 0, len = arLen; it < len; ++it) {
            try {
                var att_coll = thArr[it].readAttribute('att_collapsed');
                var att_hid = thArr[it].readAttribute('att_hidden');
                if ((att_coll == '' || null == att_coll) && (att_hid == '' || null == att_hid)) {
                    thArr[it].style.display = '';
                }
                if (thArr[it].readAttribute('note') == 'X') {
                    thArr[it].style.display = 'none';
                }
            }
            catch (e) {
            }
        }

        var tdArr = clonedTable.getElementsByTagName('td');
        var arLen = tdArr.length;
        for (var it = 0, len = arLen; it < len; ++it) {
            try {
                var att_coll = tdArr[it].readAttribute('att_collapsed');
                var att_hid = tdArr[it].readAttribute('att_hidden');
                if ((att_coll == '' || null == att_coll) && (att_hid == '' || null == att_hid)) {
                    tdArr[it].style.display = '';
                }
                if (tdArr[it].readAttribute('note') == 'X')
                    tdArr[it].style.display = 'none';
            }
            catch (e) {
            }
        }
        contentDiv.insert(clonedTable);

        //Add a br element to prevent IE hide last row with the scrollbar
        contentDiv.insert(new Element('br'));

        contentHTML.insert(contentDiv);

        var ok = function() {
            var originalTable = $('bodyTable');
            $('bodyTable').remove();
            excelTablePopUp.close();
            delete excelTablePopUp;

            var thArr = originalTable.getElementsByTagName('th')
            var arLen = thArr.length;
            for (var it = 0, len = arLen; it < len; ++it) {
                try {
                    var att_coll = thArr[it].readAttribute('att_collapsed');
                    var att_hid = thArr[it].readAttribute('att_hidden');
                    if ((att_coll == '' || null == att_coll) && (att_hid == '' || null == att_hid)) {
                        thArr[it].style.display = 'none';
                    }
                    if (thArr[it].readAttribute('note') == 'X')
                        thArr[it].style.display = '';
                }
                catch (e) {
                }
            }

            var tdArr = originalTable.getElementsByTagName('td')
            var arLen = tdArr.length;
            for (var it = 0, len = arLen; it < len; ++it) {
                try {
                    var att_coll = tdArr[it].readAttribute('att_collapsed');
                    var att_hid = tdArr[it].readAttribute('att_hidden');
                    if ((att_coll == '' || null == att_coll) && (att_hid == '' || null == att_hid)) {
                        tdArr[it].writeAttribute('style', 'display: none');
                    }
                    if (tdArr[it].readAttribute('note') == 'X')
                        tdArr[it].writeAttribute('style', 'display: ""');
                }
                catch (e) {
                }
            }
            $('bodyTableTd').insert(originalTable);
        }

        var undo = function() {
            this.restoreInfoPopUp();
        }

        var save = function() {
            var originalTable = $('bodyTable');
            $('bodyTable').remove();
            excelTablePopUp.close();
            delete excelTablePopUp;

            var thArr = originalTable.getElementsByTagName('th')
            var arLen = thArr.length;
            for (var it = 0, len = arLen; it < len; ++it) {
                try {
                    var att_coll = thArr[it].readAttribute('att_collapsed');
                    var att_hid = thArr[it].readAttribute('att_hidden');
                    if ((att_coll == '' || null == att_coll) && (att_hid == '' || null == att_hid)) {
                        thArr[it].style.display = 'none';
                    }
                    if (thArr[it].readAttribute('note') == 'X')
                        thArr[it].style.display = '';
                }
                catch (e) {
                }
            }

            var tdArr = originalTable.getElementsByTagName('td')
            var arLen = tdArr.length;
            for (var it = 0, len = arLen; it < len; ++it) {
                try {
                    var att_coll = tdArr[it].readAttribute('att_collapsed');
                    var att_hid = tdArr[it].readAttribute('att_hidden');
                    if ((att_coll == '' || null == att_coll) && (att_hid == '' || null == att_hid)) {
                        tdArr[it].style.display = 'none';
                    }
                    if (tdArr[it].readAttribute('note') == 'X')
                        tdArr[it].style.display = '';

                }
                catch (e) {
                }
            }
            $('bodyTableTd').insert(originalTable);

            eval(this.caller_name + '.prototype.buttonClicked("", "SAVE", "");');
        }
        //buttons
        var buttonsJson = {
            elements: []
        };
        var aux1 = {
            idButton: 'ok',
            label: 'OK',
            handlerContext: null,
            className: 'moduleInfoPopUp_stdButton',
            handler: ok.bind(this),
            type: 'button',
            standardButton: true
        };
        buttonsJson.elements.push(aux1);
        var ButtonObj = new megaButtonDisplayer(buttonsJson);
        var buttons = ButtonObj.getButtons();
        var buttonsTable = new Element('table', { 'id': 'InfoPopUpbuttonsTable', 'align': 'right', 'width': '400px' });
        var buttonsThead = new Element('thead');
        var buttonsTr = new Element('tr');
        buttonsTable.insert(buttonsThead);
        buttonsThead.insert(buttonsTr);
        var buttonsTd = new Element('td');
        buttonsTr.insert(buttonsTd);
        var buttonsDiv = new Element('div', { 'style': 'float: right' });
        //insert buttons in div
        buttonsDiv.insert(buttons);
        buttonsTd.insert(buttonsDiv);
        //Add a br element to prevent IE hide last row with the scrollbar
        var brTr = new Element('div').insert(new Element('br'));
        contentHTML.insert(brTr);
        mainContent.insert(contentHTML);
        mainContent.insert(buttonsTable);
        var excelTablePopUp = new infoPopUp2({

            closeButton: $H({
                'textContent': 'Close',
                'callBack': function() {
                    var originalTable = $('bodyTable');
                    $('bodyTable').remove();
                    excelTablePopUp.close();
                    delete excelTablePopUp;

                    var thArr = originalTable.getElementsByTagName('th')
                    var arLen = thArr.length;
                    for (var it = 0, len = arLen; it < len; ++it) {
                        try {
                            var att_coll = thArr[it].readAttribute('att_collapsed');
                            var att_hid = thArr[it].readAttribute('att_hidden');
                            if ((att_coll == '' || null == att_coll) && (att_hid == '' || null == att_hid)) {
                                thArr[it].style.display = 'none';
                            }
                            if (thArr[it].readAttribute('note') == 'X')
                                thArr[it].style.display = '';
                        }
                        catch (e) {
                        }
                    }

                    var tdArr = originalTable.getElementsByTagName('td')
                    var arLen = tdArr.length;
                    for (var it = 0, len = arLen; it < len; ++it) {
                        try {
                            var att_coll = tdArr[it].readAttribute('att_collapsed');
                            var att_hid = tdArr[it].readAttribute('att_hidden');
                            if ((att_coll == '' || null == att_coll) && (att_hid == '' || null == att_hid)) {
                                tdArr[it].writeAttribute('style', 'display: none');
                            }
                            if (tdArr[it].readAttribute('note') == 'X')
                                tdArr[it].writeAttribute('style', 'display: ""');
                        }
                        catch (e) {
                        }
                    }
                    $('bodyTableTd').insert(originalTable);
                }
            }),
            htmlContent: mainContent,
            indicatorIcon: '',
            width: 937,
            height: 450,
            marginTop: 195
        });
        excelTablePopUp.create();
    },

    /**
    *@description Restores the table with the initial Json object on the infoPopUp.
    *				
    */
    restoreInfoPopUp: function() {
        var orgUnitDetail = $A();
        if (!Object.isEmpty(this.initialJson.EWS.o_org_unit))
            orgUnitDetail = objectToArray(this.initialJson.EWS.o_org_unit);
        var canSave = '';
        orgUnitDetail.each(function(orgUnit) {
            canSave = orgUnit['@can_save'];
        });

        this.buildEmployeeListInfoPopUp(this.initialJson, 'X', canSave);
        document.fire('EWS:undoSelectedCOM');

        // Add the table kit for the list of employees
        try {
            //reload the tablekit 
            TableKit.reloadTable("bodyTable");
        }

        catch (e) { }
    },

    /**
    *@description Build the HTML code and the objects to display the list of employees in the infoPopUp. 
    *			It creates the TableKit object.
    *@param {Object} json Answer of the service COM_EMP_LIST().
    */
    buildEmployeeListInfoPopUp: function(json, drawAll, enableInputs) {
        this.max_row_number = 0;
        if ($('bodyTable')) $('bodyTable').remove();

        /**************************INSERT BODY TABLE*********************************/

        var bodyTable = new Element('table', {
            'cellspacing': '1',
            'id': 'bodyTable',
            'style': 'width:100%;',
            'class': 'data-table'
        });

        var employees = $A();
        if (!Object.isEmpty(json.EWS.o_records))
            employees = objectToArray(json.EWS.o_records.yglui_str_com_rec);

        var orgUnitDetail = $A();
        if (!Object.isEmpty(json.EWS.o_org_unit))
            orgUnitDetail = objectToArray(json.EWS.o_org_unit);

        var ouName = '';
        var canSave = '';
        orgUnitDetail.each(function(orgUnit) {
            ouName = orgUnit['@org_text'];
            canSave = orgUnit['@can_save'];
        });
        var bodyThead = new Element('thead');
        bodyTable.insert(bodyThead);

        // Row 1 with colspan
        var bodyTr2 = new Element('tr', { 'bgColor': '#DCD2CE', 'id': 'headerTr2' });
        bodyThead.insert(bodyTr2);

        var bodyTr = new Element('tr', { 'bgColor': '#DCD2CE', 'id': 'headerTr' });
        bodyThead.insert(bodyTr);

        var settings = $A();
        if (!Object.isEmpty(json.EWS.o_record_settings))
            settings = objectToArray(json.EWS.o_record_settings.yglui_str_com_caf);

        var body2Td = new Element('th', { 'style': 'display: ""', 'att_collapsed': 'X', 'att_hidden': '', 'id': 'thName2' });
        body2Td.insert(new Element('span').update(' '));
        bodyTr2.insert(body2Td);

        var bodyTd = new Element('th', { 'style': 'display: ""', 'att_collapsed': 'X', 'att_hidden': '', 'id': 'thName' });
        bodyTd.insert(new Element('span').update('Name'));
        bodyTr.insert(bodyTd);

        var bodyTd = new Element('th', { 'note': 'X', 'style': 'display: "none"', 'att_collapsed': 'X', 'att_hidden': '', 'id': 'thNote' });
        bodyTd.insert(new Element('div').update(' '));
        bodyTr.insert(bodyTd);

        var bodyTd = new Element('th', { 'note': 'X', 'style': 'display: "none"', 'att_collapsed': 'X', 'att_hidden': '', 'id': 'thNote2' });
        bodyTd.insert(new Element('div').update(' '));
        bodyTr2.insert(bodyTd);

        var oldgroup = '';
        var colspan = '1';

        settings.each(function(yglui_str_com_caf) {

            var curgroup = yglui_str_com_caf['@field_group'];
            var newspan = yglui_str_com_caf['@group_span'];

            if (curgroup != null || newspan != '00') {
                if (curgroup != oldgroup) {
                    oldgroup = curgroup;
                    colspan = newspan;
                }
                else colspan = '';
            }
            else colspan = '1';

            var bodyTd = null;
            var body2Td = null;

            if (null != yglui_str_com_caf['@hidden'] || (drawAll == '' && (null == yglui_str_com_caf['@collapsed'] || '' == yglui_str_com_caf['@collapsed']))) {
                bodyTd = new Element('th', { 'style': 'display: none', 'att_collapsed': yglui_str_com_caf['@collapsed'], 'att_hidden': yglui_str_com_caf['@hidden'], 'id': 'th' + yglui_str_com_caf['@field'] });
                body2Td = new Element('th', { 'style': 'display: none', 'att_collapsed': yglui_str_com_caf['@collapsed'], 'att_hidden': yglui_str_com_caf['@hidden'], 'id': 'th' + yglui_str_com_caf['@field'], 'colspan': colspan });
            }
            else {
                bodyTd = new Element('th', { 'style': 'display: ""', 'att_collapsed': yglui_str_com_caf['@collapsed'], 'att_hidden': yglui_str_com_caf['@hidden'], 'id': 'th' + yglui_str_com_caf['@field'] });
                body2Td = new Element('th', { 'style': 'display: ""', 'att_collapsed': yglui_str_com_caf['@collapsed'], 'att_hidden': yglui_str_com_caf['@hidden'], 'id': 'th' + yglui_str_com_caf['@field'], 'colspan': colspan });
            }

            if (Object.isEmpty(yglui_str_com_caf['@plan_title'])) {
                bodyTd.insert(new Element('span', { 'id': 'span_' + +yglui_str_com_caf['@field'], 'style': 'white-space:nowrap;', 'title': yglui_str_com_caf['@header_hover'] }).update(yglui_str_com_caf['@description']));
                bodyTr.insert(bodyTd);
                // Row 1
                body2Td.insert(new Element('span', { 'id': 'span_' + +yglui_str_com_caf['@field'], 'style': 'white-space:nowrap;', 'title': yglui_str_com_caf['@header_hover'] }).update(' '));
                bodyTr2.insert(body2Td);
            }
            else {
                bodyTd.insert(new Element('span', { 'id': 'span_' + +yglui_str_com_caf['@field'], 'style': 'white-space:nowrap;', 'title': yglui_str_com_caf['@header_hover'] }).update(yglui_str_com_caf['@description']));
                bodyTr.insert(bodyTd);
                // Row 1
                if (colspan != '') {
                    body2Td.insert(new Element('span', { 'id': 'span_' + +yglui_str_com_caf['@field'], 'style': 'white-space:nowrap;', 'title': yglui_str_com_caf['@header_hover'] }).update(yglui_str_com_caf['@plan_title']));
                    bodyTr2.insert(body2Td);
                }
            }
        } .bind(this));


        /**************************INSERT BODY***************************************/
        var bodyTbody = new Element('tbody');
        bodyTable.insert(bodyTbody);
        i = 1;
        employees.each(function(y_glui_str_com_rec) {
            rowClass = 'table_rowodd';
            if (i % 2 == 0)
                rowClass = '';
            i++;
            var limitpct = y_glui_str_com_rec['@limitpct'];
            bodyTr = new Element('tr', { 'class': rowClass, 'id': i + '_' + y_glui_str_com_rec.fields.yglui_str_com_fie[0]['@f_pernr'] });
            bodyTbody.insert(bodyTr);
            var bodyTd = new Element('td', { 'i': i, 'style': 'display: ""', 'att_collapsed': 'X', 'att_hidden': '' });
            bodyTd.insert(new Element('span', { 'class': 'application_action_link', 'i': i, 'id': 'NAME_' + y_glui_str_com_rec['@pernr'] + '_' + i, 'pernr': y_glui_str_com_rec['@pernr'], 'name': y_glui_str_com_rec['@name'], 'completed': '' }).update(y_glui_str_com_rec['@name']));
            bodyTd.observe('click', this.displayBalloon.bind(this));
            bodyTr.insert(bodyTd);

            var notes = null;
            var notesLen = 0;
            if (!Object.isEmpty(y_glui_str_com_rec.comments)) {
                notes = objectToArray(y_glui_str_com_rec.comments);
                notesLen = notes.length;
            }
            var bodyTd = null;
            if (notesLen > 0) {
                bodyTd = new Element('td', { "width": "5%", "note": "X", "updatedMode": "", 'id': 'TD_Note_' + i + '_' + y_glui_str_com_rec.fields.yglui_str_com_fie[0]['@f_pernr'], 'width': '10%', 'style': 'vertical-align: "top"; display: "none";float: left;height: 12px;width: 12px;', 'att_collapsed': 'X', 'att_hidden': '', 'pernr': y_glui_str_com_rec.fields.yglui_str_com_fie[0]['@f_pernr'], 'f_citem': y_glui_str_com_rec.fields.yglui_str_com_fie[0]['@f_citem'] }).update('&nbsp;&nbsp;&nbsp;');
                //var stickyImage = new Element('img', { 'src': 'customer/MCD/stickyNoteRed.png', "updatedMode": "", 'id': 'Note_' + i + '_' + y_glui_str_com_rec.fields.yglui_str_com_fie[0]['@f_pernr'], 'pernr': y_glui_str_com_rec.fields.yglui_str_com_fie[0]['@f_pernr'] });
                var stickyImage = new Element('div', { 'class': 'application_stickyNoteRed', "updatedMode": "", 'id': 'Note_' + i + '_' + y_glui_str_com_rec.fields.yglui_str_com_fie[0]['@f_pernr'], 'pernr': y_glui_str_com_rec.fields.yglui_str_com_fie[0]['@f_pernr'] });
                stickyImage.observe('click', this.notes.displayInfoPopUp.bind(this, this.initialJson));
                bodyTd.insert(stickyImage);
            }
            else {
                bodyTd = new Element('td', { "width": "5%", "note": "X", "updatedMode": "", 'id': 'TD_Note_' + i + '_' + y_glui_str_com_rec.fields.yglui_str_com_fie[0]['@f_pernr'], 'width': '10%', 'style': 'vertical-align: "top"; display: "none";float: left;height: 12px;width: 12px;', 'att_collapsed': 'X', 'att_hidden': '', 'pernr': y_glui_str_com_rec.fields.yglui_str_com_fie[0]['@f_pernr'], 'f_citem': y_glui_str_com_rec.fields.yglui_str_com_fie[0]['@f_citem'] }).update('&nbsp;&nbsp;&nbsp;');
                //var stickyImage = new Element('img', { 'src': 'customer/MCD/stickyNote.png', "updatedMode": "", 'id': 'Note_' + i + '_' + y_glui_str_com_rec.fields.yglui_str_com_fie[0]['@f_pernr'], 'pernr': y_glui_str_com_rec.fields.yglui_str_com_fie[0]['@f_pernr'] });
                var stickyImage = new Element('div', { 'class': 'application_stickyNote', "updatedMode": "", 'id': 'Note_' + i + '_' + y_glui_str_com_rec.fields.yglui_str_com_fie[0]['@f_pernr'], 'pernr': y_glui_str_com_rec.fields.yglui_str_com_fie[0]['@f_pernr'] });
                stickyImage.observe('click', this.notes.displayInfoPopUp.bind(this, this.initialJson));
                bodyTd.insert(stickyImage);
            }
            stickyImage.observe('mouseover', function(event) {
                event.findElement().style.cursor = 'hand';
            });
            stickyImage.observe('mouseout', function(event) {
                event.findElement().style.cursor = 'pointer';
            });
            bodyTd.insert(new Element('span').update('&nbsp;&nbsp;&nbsp;'));
            bodyTr.insert(bodyTd);
            y_glui_str_com_rec.fields.yglui_str_com_fie.each(function(yglui_str_com_fie) {
                var completed = 'X';
                var myElement = null;
                var hidden = '';
                var bodyTd = null;
                if (null != yglui_str_com_fie['@hidden'] || (drawAll == '' && (null == yglui_str_com_fie['@collapsed'] || '' == yglui_str_com_fie['@collapsed'])))
                    bodyTd = new Element('td', { 'style': 'display:none', 'att_collapsed': yglui_str_com_fie['@collapsed'], 'att_hidden': yglui_str_com_fie['@hidden'] });
                else
                    bodyTd = new Element('td', { 'style': 'display:""', 'att_collapsed': yglui_str_com_fie['@collapsed'], 'att_hidden': yglui_str_com_fie['@hidden'] });
                var field = yglui_str_com_fie['@field'].split('_', 2)[1];
                if ((removeCommas(yglui_str_com_fie['@input_size']) - 0) > 0 && (canSave == 'X') && (enableInputs == 'X') && (!Object.isEmpty(yglui_str_com_fie['@eligible']))) {
                    //If the value of the field is empty-> the plan is not complete

                    if ((field == 'CPAMT') && (null == yglui_str_com_fie['@value']))
                        completed = '';
                    if (!Object.isEmpty(yglui_str_com_fie['@value']))
                        switch (yglui_str_com_fie['@type']) {
                        case 'text':
                            myElement = new Element("input", { "type": "text", 'size': yglui_str_com_fie['@input_size'], 'compcat': yglui_str_com_fie['@compcat'], 'event_fired': yglui_str_com_fie['@event_fired'], 'linked_plan': yglui_str_com_fie['@linked_plan'], 'f_citem': yglui_str_com_fie['@f_citem'], 'update_method': yglui_str_com_fie['@update_method'], 'update_ns_method': yglui_str_com_fie['@update_ns_method'], 'class': 'COM_app_input_box', 'id': yglui_str_com_fie['@field'] + '_' + yglui_str_com_fie['@f_pernr'] + '_' + i, 'currValue': yglui_str_com_fie['@value'], 'oldValue': yglui_str_com_fie['@value'], 'budget': yglui_str_com_fie['@f_budget'], 'itkey': yglui_str_com_fie['@itkey'], 'ex_rate': yglui_str_com_fie['@f_ex_rate'], 'f_perner': yglui_str_com_fie['@f_pernr'], 'plan': yglui_str_com_fie['@f_plan'], 'i': i, 'completed': completed, 'style': 'font-family=Trebuchet MS; font-size= 9pt;', 'limitpct': limitpct, 'value': longToDisplay(parseFloat(yglui_str_com_fie['@value'])) });
                            break;
                        case 'currency':
                            var custValue = "0";
                            if (!Object.isEmpty(yglui_str_com_fie['@value']))
                                custValue = yglui_str_com_fie['@value'];
                            myElement = new Element("input", { "type": "text", 'size': yglui_str_com_fie['@input_size'], 'compcat': yglui_str_com_fie['@compcat'], 'event_fired': yglui_str_com_fie['@event_fired'], 'linked_plan': yglui_str_com_fie['@linked_plan'], 'f_citem': yglui_str_com_fie['@f_citem'], 'update_method': yglui_str_com_fie['@update_method'], 'update_ns_method': yglui_str_com_fie['@update_ns_method'], 'class': 'COM_app_input_box', 'id': yglui_str_com_fie['@field'] + '_' + yglui_str_com_fie['@f_pernr'] + '_' + i, 'currValue': yglui_str_com_fie['@value'], 'oldValue': yglui_str_com_fie['@value'], 'budget': yglui_str_com_fie['@f_budget'], 'itkey': yglui_str_com_fie['@itkey'], 'ex_rate': yglui_str_com_fie['@f_ex_rate'], 'f_perner': yglui_str_com_fie['@f_pernr'], 'plan': yglui_str_com_fie['@f_plan'], 'i': i, 'completed': completed, 'style': 'font-family=Trebuchet MS; font-size= 9pt;', 'limitpct': limitpct, 'value': longToDisplay(custValue) });
                            break;
                        case 'date':
                            myElement = new Element("input", { "type": "text", 'size': yglui_str_com_fie['@input_size'], 'compcat': yglui_str_com_fie['@compcat'], 'event_fired': yglui_str_com_fie['@event_fired'], 'linked_plan': yglui_str_com_fie['@linked_plan'], 'f_citem': yglui_str_com_fie['@f_citem'], 'update_method': yglui_str_com_fie['@update_method'], 'update_ns_method': yglui_str_com_fie['@update_ns_method'], 'class': 'COM_app_input_box', 'id': yglui_str_com_fie['@field'] + '_' + yglui_str_com_fie['@f_pernr'] + '_' + i, 'currValue': yglui_str_com_fie['@value'], 'oldValue': yglui_str_com_fie['@value'], 'budget': yglui_str_com_fie['@f_budget'], 'itkey': yglui_str_com_fie['@itkey'], 'ex_rate': yglui_str_com_fie['@f_ex_rate'], 'f_perner': yglui_str_com_fie['@f_pernr'], 'plan': yglui_str_com_fie['@f_plan'], 'i': i, 'completed': completed, 'style': 'font-family=Trebuchet MS; font-size= 9pt;', 'limitpct': limitpct, 'value': objectToDisplay(yglui_str_com_fie['@value']) });
                            break;
                        default:
                            myElement = new Element("input", { "type": "text", 'size': yglui_str_com_fie['@input_size'], 'compcat': yglui_str_com_fie['@compcat'], 'event_fired': yglui_str_com_fie['@event_fired'], 'linked_plan': yglui_str_com_fie['@linked_plan'], 'f_citem': yglui_str_com_fie['@f_citem'], 'update_method': yglui_str_com_fie['@update_method'], 'update_ns_method': yglui_str_com_fie['@update_ns_method'], 'class': 'COM_app_input_box', 'id': yglui_str_com_fie['@field'] + '_' + yglui_str_com_fie['@f_pernr'] + '_' + i, 'currValue': yglui_str_com_fie['@value'], 'oldValue': yglui_str_com_fie['@value'], 'budget': yglui_str_com_fie['@f_budget'], 'itkey': yglui_str_com_fie['@itkey'], 'ex_rate': yglui_str_com_fie['@f_ex_rate'], 'f_perner': yglui_str_com_fie['@f_pernr'], 'plan': yglui_str_com_fie['@f_plan'], 'i': i, 'completed': completed, 'style': 'font-family=Trebuchet MS; font-size= 9pt;', 'limitpct': limitpct, 'value': longToDisplay(parseFloat(yglui_str_com_fie['@value'])) });
                            break;
                    }
                    else
                        switch (yglui_str_com_fie['@type']) {
                        case 'text':
                            myElement = new Element("input", { "type": "text", 'size': yglui_str_com_fie['@input_size'], 'compcat': yglui_str_com_fie['@compcat'], 'event_fired': yglui_str_com_fie['@event_fired'], 'linked_plan': yglui_str_com_fie['@linked_plan'], 'f_citem': yglui_str_com_fie['@f_citem'], 'update_method': yglui_str_com_fie['@update_method'], 'update_ns_method': yglui_str_com_fie['@update_ns_method'], 'class': 'COM_app_input_box', 'id': yglui_str_com_fie['@field'] + '_' + yglui_str_com_fie['@f_pernr'] + '_' + i, 'currValue': '', 'oldValue': '', 'budget': yglui_str_com_fie['@f_budget'], 'itkey': yglui_str_com_fie['@itkey'], 'ex_rate': yglui_str_com_fie['@f_ex_rate'], 'f_perner': yglui_str_com_fie['@f_pernr'], 'plan': yglui_str_com_fie['@f_plan'], 'i': i, 'completed': completed, 'style': 'font-family=Trebuchet MS; font-size= 9pt;', 'limitpct': limitpct, 'value': '' });
                            break;
                        case 'currency':
                            myElement = new Element("input", { "type": "text", 'size': yglui_str_com_fie['@input_size'], 'compcat': yglui_str_com_fie['@compcat'], 'event_fired': yglui_str_com_fie['@event_fired'], 'linked_plan': yglui_str_com_fie['@linked_plan'], 'f_citem': yglui_str_com_fie['@f_citem'], 'update_method': yglui_str_com_fie['@update_method'], 'update_ns_method': yglui_str_com_fie['@update_ns_method'], 'class': 'COM_app_input_box', 'id': yglui_str_com_fie['@field'] + '_' + yglui_str_com_fie['@f_pernr'] + '_' + i, 'currValue': '', 'oldValue': '', 'budget': yglui_str_com_fie['@f_budget'], 'itkey': yglui_str_com_fie['@itkey'], 'ex_rate': yglui_str_com_fie['@f_ex_rate'], 'f_perner': yglui_str_com_fie['@f_pernr'], 'plan': yglui_str_com_fie['@f_plan'], 'i': i, 'completed': completed, 'style': 'font-family=Trebuchet MS; font-size= 9pt;', 'limitpct': limitpct, 'value': '' });
                            break;
                        case 'date':
                            myElement = new Element("input", { "type": "text", 'size': yglui_str_com_fie['@input_size'], 'compcat': yglui_str_com_fie['@compcat'], 'event_fired': yglui_str_com_fie['@event_fired'], 'linked_plan': yglui_str_com_fie['@linked_plan'], 'f_citem': yglui_str_com_fie['@f_citem'], 'update_method': yglui_str_com_fie['@update_method'], 'update_ns_method': yglui_str_com_fie['@update_ns_method'], 'class': 'COM_app_input_box', 'id': yglui_str_com_fie['@field'] + '_' + yglui_str_com_fie['@f_pernr'] + '_' + i, 'currValue': '', 'oldValue': '', 'budget': yglui_str_com_fie['@f_budget'], 'itkey': yglui_str_com_fie['@itkey'], 'ex_rate': yglui_str_com_fie['@f_ex_rate'], 'f_perner': yglui_str_com_fie['@f_pernr'], 'plan': yglui_str_com_fie['@f_plan'], 'i': i, 'completed': completed, 'style': 'font-family=Trebuchet MS; font-size= 9pt;', 'limitpct': limitpct, 'value': '' });
                            break;
                        default:
                            myElement = new Element("input", { "type": "text", 'size': yglui_str_com_fie['@input_size'], 'compcat': yglui_str_com_fie['@compcat'], 'event_fired': yglui_str_com_fie['@event_fired'], 'linked_plan': yglui_str_com_fie['@linked_plan'], 'f_citem': yglui_str_com_fie['@f_citem'], 'update_method': yglui_str_com_fie['@update_method'], 'update_ns_method': yglui_str_com_fie['@update_ns_method'], 'class': 'COM_app_input_box', 'id': yglui_str_com_fie['@field'] + '_' + yglui_str_com_fie['@f_pernr'] + '_' + i, 'currValue': '', 'oldValue': '', 'budget': yglui_str_com_fie['@f_budget'], 'itkey': yglui_str_com_fie['@itkey'], 'ex_rate': yglui_str_com_fie['@f_ex_rate'], 'f_perner': yglui_str_com_fie['@f_pernr'], 'plan': yglui_str_com_fie['@f_plan'], 'i': i, 'completed': completed, 'style': 'font-family=Trebuchet MS; font-size= 9pt;', 'limitpct': limitpct, 'value': '' });
                            break;
                    }
                    myElement.observe('keyup', this.lookKey.bind(this));
                    if (yglui_str_com_fie['@value'] == null) {
                        yglui_str_com_fie['@value'] = '';
                    }
                }
                else {
                    switch (yglui_str_com_fie['@type']) {
                        case 'text':
                            myElement = new Element('span', { 'id': yglui_str_com_fie['@field'] + '_' + yglui_str_com_fie['@f_pernr'] + '_' + i, 'size': yglui_str_com_fie['@input_size'], 'compcat': yglui_str_com_fie['@compcat'], 'linked_plan': yglui_str_com_fie['@linked_plan'], 'value': trim(yglui_str_com_fie['@value']), 'f_citem': yglui_str_com_fie['@f_citem'], 'budget': yglui_str_com_fie['@f_budget'], 'f_plan_text': yglui_str_com_fie['@f_plan_text'] }).update(yglui_str_com_fie['@value']);
                            break;
                        case 'currency':
                            myElement = new Element('span', { 'id': yglui_str_com_fie['@field'] + '_' + yglui_str_com_fie['@f_pernr'] + '_' + i, 'size': yglui_str_com_fie['@input_size'], 'compcat': yglui_str_com_fie['@compcat'], 'linked_plan': yglui_str_com_fie['@linked_plan'], 'value': format_amount(trim(yglui_str_com_fie['@value'])), 'f_citem': yglui_str_com_fie['@f_citem'], 'budget': yglui_str_com_fie['@f_budget'], 'f_perner': yglui_str_com_fie['@f_pernr'], 'plan': yglui_str_com_fie['@f_plan'], 'i': i }).update(format_amount(yglui_str_com_fie['@value']));
                            break;
                        case 'date':
                            myElement = new Element('span', { 'id': yglui_str_com_fie['@field'] + '_' + yglui_str_com_fie['@f_pernr'] + '_' + i, 'size': yglui_str_com_fie['@input_size'], 'compcat': yglui_str_com_fie['@compcat'], 'linked_plan': yglui_str_com_fie['@linked_plan'], 'value': trim(yglui_str_com_fie['@value']), 'f_citem': yglui_str_com_fie['@f_citem'], 'budget': yglui_str_com_fie['@f_budget'], 'f_perner': yglui_str_com_fie['@f_pernr'], 'plan': yglui_str_com_fie['@f_plan'], 'i': i }).update(yglui_str_com_fie['@value']);
                            break;
                        case 'number':
                            myElement = new Element('span', { 'id': yglui_str_com_fie['@field'] + '_' + yglui_str_com_fie['@f_pernr'] + '_' + i, 'size': yglui_str_com_fie['@input_size'], 'compcat': yglui_str_com_fie['@compcat'], 'linked_plan': yglui_str_com_fie['@linked_plan'], 'value': format_amount(trim(yglui_str_com_fie['@value'])), 'f_citem': yglui_str_com_fie['@f_citem'], 'budget': yglui_str_com_fie['@f_budget'], 'f_perner': yglui_str_com_fie['@f_pernr'], 'plan': yglui_str_com_fie['@f_plan'], 'i': i }).update(format_amount(yglui_str_com_fie['@value']));
                            break;
                        default:
                            myElement = new Element('span', { 'id': yglui_str_com_fie['@field'] + '_' + yglui_str_com_fie['@f_pernr'] + '_' + i, 'size': yglui_str_com_fie['@input_size'], 'compcat': yglui_str_com_fie['@compcat'], 'linked_plan': yglui_str_com_fie['@linked_plan'], 'value': trim(yglui_str_com_fie['@value']), 'f_citem': yglui_str_com_fie['@f_citem'], 'budget': yglui_str_com_fie['@f_budget'], 'f_perner': yglui_str_com_fie['@f_pernr'], 'plan': yglui_str_com_fie['@f_plan'], 'i': i }).update(yglui_str_com_fie['@value']);
                            break;
                    }
                    if (!Object.isEmpty(yglui_str_com_fie['@hover_text'])) {
                        myElement.writeAttribute("title", yglui_str_com_fie['@hover_text']);
                    }
                }
                // If the field is an amount, and it has a value and the updateMethod is not null, then update the new base salary and compa-ratio
                var field = yglui_str_com_fie['@field'].split('_', 2)[1];
                if ((field == 'CPAMT') && (null != yglui_str_com_fie['@update_method'])) { //This is a amount field and the updateMethod is not null, so procede.
                    var BS_id = 'SALRY' + '_' + yglui_str_com_fie['@f_pernr'] + '_' + i;
                    var CR_id = 'CPRAT' + '_' + yglui_str_com_fie['@f_pernr'] + '_' + i;
                    var newBS_id = 'NEW_SALRY' + '_' + yglui_str_com_fie['@f_pernr'] + '_' + i;
                    var newCR_id = 'NEW_CPRAT' + '_' + yglui_str_com_fie['@f_pernr'] + '_' + i;

                    var BS = bodyTr.parentNode.down('[id=' + BS_id + ']');
                    var CR = bodyTr.parentNode.down('[id=' + CR_id + ']');
                    var newBS = bodyTr.parentNode.down('[id=' + newBS_id + ']');
                    var newCR = bodyTr.parentNode.down('[id=' + newCR_id + ']');

                    // New Base Salary calculation, as at this point no change is made, the first time I took the BS value as base, If it's a second amount to update the BS, I take the newBS as base
                    if ((newBS.readAttribute('value') + "").indexOf('.') != -1 && (newBS.readAttribute('value') + "").indexOf(',') != -1) {
                        if (displayToLong(newBS.readAttribute('value')) == 0)
                            newBSvalue = displayToLong(BS.readAttribute('value')) + (yglui_str_com_fie['@value'] - 0);
                        else
                            newBSvalue = displayToLong(newBS.readAttribute('value')) + (yglui_str_com_fie['@value'] - 0);
                    }
                    else {
                        if (newBS.readAttribute('value') == 0)
                            newBSvalue = displayToLong(BS.readAttribute('value')) + (yglui_str_com_fie['@value'] - 0);
                        else
                            newBSvalue = newBS.readAttribute('value') + (yglui_str_com_fie['@value'] - 0);
                    }
                    newBS.writeAttribute('value', newBSvalue);
                    newBS.innerHTML = format_amount(newBSvalue);
                    // Compa-ratio calculation
                    var compa_id = 'NEW_CPRAT' + '_' + yglui_str_com_fie['@f_pernr'] + '_' + i;
                    var avgSal_id = 'AVG_SALRY' + '_' + yglui_str_com_fie['@f_pernr'] + '_' + i;
                    var compaRatio = bodyTr.parentNode.down('[id=' + compa_id + ']');
                    var avgSal = bodyTr.parentNode.down('[id=' + avgSal_id + ']');

                    var newCompaVal = newBSvalue / (removeCommas(avgSal.readAttribute('value')) - 0);

                    compaRatio.innerHTML = format_amount(newCompaVal);

                }
                // Add observers to events and fire custom events and methods
                if (!Object.isEmpty(yglui_str_com_fie['@event_fired'])) {
                    args = $H({ 'field': yglui_str_com_fie['@field'], 'pernr': yglui_str_com_fie['@f_pernr'], 'plan': yglui_str_com_fie['@f_plan'], 'i': i, 'budget': yglui_str_com_fie['@f_budget'] });
                    myElement.observe('change', this.onChangeFieldEv.bindAsEventListener(this, yglui_str_com_fie['@event_fired'], args));
                }
                if (!Object.isEmpty(yglui_str_com_fie['@update_method'])) {
                    args = $H({ 'field': yglui_str_com_fie['@field'], 'pernr': yglui_str_com_fie['@f_pernr'], 'plan': yglui_str_com_fie['@f_plan'], 'i': i, 'budget': yglui_str_com_fie['@f_budget'] });
                    myElement.observe('change', eval('this.' + yglui_str_com_fie['@update_method']).bindAsEventListener(this, args, ''));
                }
                if (!Object.isEmpty(yglui_str_com_fie['@update_ns_method'])) {
                    args = $H({ 'field': yglui_str_com_fie['@field'], 'pernr': yglui_str_com_fie['@f_pernr'], 'plan': yglui_str_com_fie['@f_plan'], 'i': i, 'budget': yglui_str_com_fie['@f_budget'] });
                    myElement.observe('change', eval('this.' + yglui_str_com_fie['@update_ns_method']).bindAsEventListener(this, args, ''));
                }
                bodyTd.insert(myElement)
                bodyTr.insert(bodyTd);
            } .bind(this));
        } .bind(this));


        $('tableContentDiv').insert(bodyTable);
        //Add a br element to prevent IE hide last row with the scrollbar
        var brTr = new Element('tr');
        brTr.insert(new Element('td', { 'colspan': '300' }).insert(new Element('br')));
        $('tableContentDiv').insert(brTr);
        // If its readonly mode, hidde save/undo buttons
        if (enableInputs != 'X') { document.fire('EWS:compensation_hidebuttons'); }
    },

    /**
    *@description Displays the infoPopUp object with the complete table when the right arrow is clicked
    *				
    */
    displayGuidelinesPopUp: function(empid, plan, param_i) {
        // Create object just in time.
        var hash = $H({
            title: this.getDynLabels('guidelineDetails')
        });

        var content = new Element('table');
        var tbody = new Element('tbody');
        content.insert(tbody);
        var tr = new Element('tr');
        tbody.insert(tr);
        var td = new Element('td', { 'class': 'application_main_title2' })
        tr.insert(td);
        td.insert(hashToHtml(hash));
        var tr = new Element('tr');
        tbody.insert(tr);
        var td = new Element('td', { 'class': 'application_main_title3' })
        tr.insert(td);
        td.insert($('NAME_' + empid + '_' + param_i).innerHTML);

        var contentHTML = new Element('div', { 'style': 'float:left;width: 100%;padding-top:20px;' });
        var contentDiv = new Element('div', { 'id': 'guidContentDiv' });
        contentHTML.insert(new Element('br'));
        contentDiv.insert(content);
        contentHTML.insert(contentDiv);

        contentDiv.insert(this.parseWidgetsContent('COM_GLDT', empid, plan));

        var guidelinesTablePopUp = new infoPopUp2({

            closeButton: $H({
                'textContent': 'Close',
                'callBack': function() {
                    guidelinesTablePopUp.close();
                    delete guidelinesTablePopUp;
                }
            }),
            htmlContent: contentHTML,
            indicatorIcon: '',
            width: 800,
            height: 550
        });
        guidelinesTablePopUp.create();
    },

    /**
    * @description Parses the widget content service
    * @param xml The XML out
    * @param appId The identificator of the AJAX call
    */
    parseWidgetsContent: function(appId, empId, planId) {
        var wo = new WidgetsOverview();
        return wo.getContent(appId, empId, planId);

    },

    /**
    *@description Displays Employee Details infoPopUp object 
    *				
    */
    displayDetailsPopUp: function(empid, param_i) {
        // Create object just in time.
        var hash = $H({
            title: this.getDynLabels('employeeDetails')
        });

        var content = new Element('table');
        var tbody = new Element('tbody');
        content.insert(tbody);
        var tr = new Element('tr');
        tbody.insert(tr);
        var td = new Element('td', { 'class': 'application_main_title2' })
        tr.insert(td);
        td.insert(hashToHtml(hash));
        var tr = new Element('tr');
        tbody.insert(tr);
        var td = new Element('td', { 'class': 'application_main_title3' })
        tr.insert(td);
        td.insert($('NAME_' + empid + '_' + param_i).innerHTML);


        var contentHTML = new Element('div', { 'style': 'float:left;width: 100%;' });
        var contentDiv = new Element('div', { 'style': 'overflow:auto; overflow-y:hidden', 'id': 'guidContentDiv' });
        contentHTML.insert(new Element('br'));
        contentHTML.insert(new Element('br'));
        contentDiv.insert(content);
        contentHTML.insert(contentDiv);

        contentHTML.insert(this.parseWidgetsContent('COM_HIST', empid, ''));

        var detailsTablePopUp = new infoPopUp2({

            closeButton: $H({
                'textContent': 'Close',
                'callBack': function() {
                    detailsTablePopUp.close();
                    delete detailsTablePopUp;
                }
            }),
            htmlContent: contentHTML,
            indicatorIcon: '',
            width: 800,
            height: 650
        });
        detailsTablePopUp.create();
    },

    //--------------------------------------------------------------------------------------------------------------------------
    //					SAVE / RESTORE METHODS
    //--------------------------------------------------------------------------------------------------------------------------	

    /**
    *@description Call the service com_save to save changed data to SAP.
    *
    */
    save: function() {
        var o_records = '';
        this.changed_rows.elements.each(function(row) {
            var crrRow = $(row.id);
            o_records += '<yglui_str_com_rec ';
            o_records += ' id="' + row.id + '"';
            o_records += ' itkey="' + row.itkey + '"';
            o_records += ' value="' + row.amount + '"';
            o_records += ' f_pernr="' + crrRow.readAttribute('f_perner') + '"';
            try {
                var curRow = $("CURRENCY_" + crrRow.readAttribute('f_perner') + '_' + crrRow.readAttribute('i'));
                o_records += ' f_currency="' + curRow.readAttribute('value') + '"';
            }
            catch (e) { }

            o_records += ' f_plan="' + crrRow.readAttribute('plan') + '"';
            o_records += ' f_citem="' + crrRow.readAttribute('f_citem') + '"';
	    o_records += ' f_stkun="' + crrRow.readAttribute('f_stkun') + '"';
            o_records += ' />';
        });
        var o_notes = '';
        this.notes.getChangedRows().elements.each(function(row) {
            //parse date format
            if (row.date.length < 10) {
                x = row.date.split('-');
                if (x[1].length < 2)
                    x[1] = "0" + x[1];
                if (x[2].length < 2)
                    x[2] = "0" + x[2];
                row.date = x[0] + "-" + x[1] + "-" + x[2];
            }
            o_notes += '<yglui_str_com_com ';
            o_notes += ' author="' + row.manager + '"';
            o_notes += ' c_date="' + row.date + '"';
            o_notes += ' pernr="' + row.pernr + '"';
            o_notes += ' value="' + row.comment + '"';
            if (Object.isEmpty(row.f_citem))
                o_notes += ' citem=""';
            else
                o_notes += ' citem="' + row.f_citem + '"';
            o_notes += ' />';
        });
        var saveService = 'COM_SAVE';

        var servXml = '<EWS>'
						+ '<SERVICE>' + saveService + '</SERVICE>'
						+ '<OBJECT TYPE="O">' + this.org_unit_id + '</OBJECT>'
						+ '<PARAM>'
						+ '<records>' + o_records + '</records>'
						+ '<comments>' + o_notes + '</comments>'
                        + '<review_period>' + this.rv_per_id + '</review_period>'
						+ '</PARAM>'
						+ '</EWS>';
        this.makeAJAXrequest($H({
            xml: servXml,
            successMethod: 'saveSuccessMethod',
            warningMethod: 'saveWarningMethod'
        }));
    },

    /**
    *@description Method called when the save is ok.
    *
    */
    saveSuccessMethod: function(json) {
        this.changed_rows = {
            elements: []
        };
        this.notes.resetChangedRows();
        var appClass = this.caller_name;
        document.fire('EWS:CompCategoryUpdated');
        var appId = "";
        switch (appClass) {
            case 'SalaryReview':
                appId = 'COM_SALR';
                break;
            case 'BonusPayment':
                appId = 'COM_BOPA';
                break;
            case 'LTI':
                appId = 'COM_LTI';
                break;
        }

        global.open($H({
            app: {
                appId: appId,
                view: this.args
            }
        })
        );

        document.fire('EWS:savedTab');
    },

    saveWarningMethod: function(json) {
        var warningPopUp = new infoPopUp({
            closeButton: $H({
                'textContent': 'Close',
                'callBack': function() {
                    warningPopUp.close();
                    delete warningPopUp;
                }
            }),
            htmlContent: 'Error',
            indicatorIcon: 'information',
            width: 300,
            height: 100
        });
        warningPopUp.create();
    },

    /**
    *@description Restores the table with the initial Json object.
    *				
    */
    restore: function() {
        this.buildEmployeeList(this.initialJson);
        document.fire('EWS:undoSelectedCOM');
        // Add the table kit for the list of employees
        try {
            //reload the tablekit 
            TableKit.reloadTable("bodyTable");
        }

        catch (e) { }
    },
    //--------------------------------------------------------------------------------------------------------------------------
    //					OTHER METHODS
    //--------------------------------------------------------------------------------------------------------------------------

    compensationReviewPeriodSelected: function(ev) {
        this.rv_per_id = ev.memo.period;
        this.rv_per_begda = ev.memo.begda;
        this.rv_per_endda = ev.memo.endda;
    },

    onOrgUnitSelected: function(ev) {
        this.org_unit_id = ev.memo.orgunit;
    },

    launchExcelEvent: function() {
        document.fire("EWS:compensationExportToExcel", {});
    },

    showPctWarning: function() {
        // Create object just in time.
        var content = new Element('table');
        var tbody = new Element('tbody');
        content.insert(tbody);
        var tr = new Element('tr');
        tbody.insert(tr);
        var td = new Element('td', { 'class': 'application_main_title2' })
        tr.insert(td);
        var labelTxt = new Element('label').update('Award percent has exceeded maximum for the plan. It requires manager approval.');
        td.insert(labelTxt);
        var contentDiv = new Element('div', { 'style': 'overflow:auto; overflow-y:hidden', 'id': 'guidContentDiv' });
        contentDiv.insert(content);

        var warningPopUp = new infoPopUp({
            closeButton: $H({
                'textContent': 'Close',
                'callBack': function() {
                    warningPopUp.close();
                    delete warningPopUp;
                }
            }),
            htmlContent: contentDiv,
            indicatorIcon: 'information',
            width: 300,
            height: 100
        });
        warningPopUp.create();
    },

    /**
    *@description Internal number validation function
    *				
    */
    lookKey: function(e) {
        var code;
        if (!e) var e = window.event;
        if (e.keyCode) code = e.keyCode;
        else if (e.which) code = e.which;
        var IsNumber = true;
        var srcElem = getEventSrc(e)
        var temp = '';
        var oneDot = false;
        var lnt = srcElem.value.length;
        for (it = 0; it < lnt; it++) {
            var ValidChars = "0123456789,";
            if (!oneDot)
                ValidChars = "0123456789.,";
            if (ValidChars.indexOf(srcElem.value.charAt(it)) == -1) {
                srcElem.value = srcElem.value.split(srcElem.value.charAt(it), 1)[0] + srcElem.value.split(srcElem.value.charAt(it), 2)[1];
                IsNumber = false;
            }
            if (srcElem.value.charAt(it) == ".")
                oneDot = true;
        }
        return IsNumber;

    },
    /**
    * @description Add the dynamic labels from the received XML to a global list
    * @param {Object} json the received XML with Json format
    */
    addToLabels: function(json) {
        if (Object.isEmpty(json.EWS.labels)) return;
        objectToArray(json.EWS.labels.item).each(function(label) {
            if (!Object.isEmpty(label['@id']) && !Object.isEmpty(label['@value']))
                this.dynLabels.set(label['@id'], label['@value']);
        } .bind(this));
    },
    /**
    * @description Get the label associated to an Id
    * @param {String} labelId Id of the label to get
    */
    getDynLabels: function(labelId) {
        if (Object.isEmpty(labelId)) return '';
        var label = this.dynLabels.get(labelId);
        if (Object.isEmpty(label)) label = labelId;
        return label;
    }
});

/**
*@description deletes custom chars from the beggining and end of the string
*				
*/

function trim(str, chars) {
    if (null != str)
        return ltrim(rtrim(str, chars), chars);
    else
        return '';
}

/**
*@description deletes custom chars from the beggining of the string
*				
*/

function ltrim(str, chars) {
    chars = chars || "\\s";
    return str.replace(new RegExp("^[" + chars + "]+", "g"), "");
}

/**
*@description deletes custom chars from the end of the string
*				
*/

function rtrim(str, chars) {
    chars = chars || "\\s";
    return str.replace(new RegExp("[" + chars + "]+$", "g"), "");
}

/**
*@description Format amounts with $ symbol and commas
*				
*/

function format_amount(value) {
    value = trim(value + "");
    if (Object.isEmpty(value))
        return '';
    var strValidChars = "0123456789.,-";
    var blnResult = true;

    for (it = 0; it < value.length && blnResult == true; it++) {
        strChar = value.charAt(it);
        if (strValidChars.indexOf(strChar) == -1) {
            blnResult = false;
        }
    }
    if (!blnResult)
        return value;
    return longToDisplay((parseFloat(value)).toFixed(2) - 0);
}

function validateNumber(strValue) {
    var objRegExp = /[-+]?(?:\d\,?){0,}(?:\.\d*)?/;

    //check for numeric characters
    return objRegExp.test(strValue);

}

function getEventSrc(e) {
    if (!e) e = window.event;

    if (e.originalTarget)
        return e.originalTarget;
    else if (e.srcElement)
        return e.srcElement;
}

/**
*@description Remove commas 
*				
*/
function removeCommas(nStr) {
    nStr = nStr + "";
    if (Object.isEmpty(nStr))
        return '';
    var newval = nStr.replace(/\,/g, "");
    // Remove all commas
    return newval;
}


function isDecimal (s) {
    var isDecimal_re= /^\s*(\+|-)?((\d+(\.\d+)?)|(\.\d+))\s*$/;
    return String(s).search(isDecimal_re) != -1
}

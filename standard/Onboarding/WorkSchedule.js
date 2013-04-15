/** 
* @fileOverview WorkSchedulePool.js 
* @description File containing class ONB. This application is responsible of 
* showing WorkSchedule details (Add or Modif).
*/

/**
*@constructor
*@description Class CARPAGE. Shows CAR Details.
*@augments Application 
*/
var WSR_ACTIONS = Class.create(Application,
{
    /*
    Service
    */
    getTime: 'GET_WORK_TIME',
    getNewWorkSchedule: 'GET_WSRULE',
    getPerwsService: 'GET_PERWS',
    SaveService: 'SAVE_WSRULE',
    getAreaService: 'GET_AREAS',
    getGroupService: 'GET_EEGRPS',

    /* if we open the application, reload details
    * @type Boolean
    */
    firstRun: true,

    /**
    *@param $super The superclass (Application)
    *@description Instantiates the app
    */
    initialize: function($super, args) {
        $super(args);
        this.bindings = {};
        /*this.submitStatus = new Hash();
        this.workscheduleEntryEmployeeSelectedBinding = this._employeeSelected.bindAsEventListener(this);*/
        //this.employeeColorChangedHandlerBinding = this.employeeColorChangedHandler.bindAsEventListener(this);
        //this.cancelBookingConfBoxButtonBinding = this.cancelBookingConfBoxButton.bindAsEventListener(this);
    },
    /**
    *@param $super The superclass: Application
    *@param args Arguments coming from previous application
    *@description 
    */
    run: function($super, args) {
        $super();
        // document.observe('EWS:DaySelected', this._selectRadioBinding);
        this.area = args.get('area');
        this.reqId = args.get('reqId');
        this.PSG_DWS = args.get('PSG_DWS');
        this.ESG_WSR = args.get('ESG_WSR');
        this.labelGroup = args.get('labelGroup');
        this.getContentWorkSchedule = args.get('contentWork');

        if (this.firstRun) {
            this.firstRun = false;
            var header = args.get('header');
            var html = "<table class='Onb'>"
            + "<tr><td><div id='company_name' class='Onb_Title application_main_title2'>"
            + global.getCompanyName() + "</div></td></tr>"
            // + "<tr><td><div id='loadingMessage' class='Onb_Text'>" + global.getLabel('Loading') + "</div></td></tr>"
            + "<tr><td><div id='header'>" + header + "</div></td></tr>"
            + "<tr><td><div id='header'><FIELDSET class='Onb_column0' id='Onb_fieldSet_1_WorkSchedule'></FIELDSET></div></td></tr>"
            //+ "<tr><td><div id='header'><FIELDSET class='Onb_column0' id='Onb_fieldSet_2'><div id='loadingMessage' class='Onb_Text'>" + global.getLabel('Loading') + "</div></FIELDSET></div></td></tr>"
            + "<tr><td><div id='header'><FIELDSET class='Onb_column0' id='Onb_fieldSet_2'></FIELDSET></div></td></tr>"
            + "<tr><td><div id='workschedule_button'></div></td></tr>"
            + "</table>";
            this.virtualHtml.insert(html);

        }

        //Area
        this.virtualHtml.down('[id = Onb_fieldSet_1_WorkSchedule]').update("");
        var legend = new Element('span', { 'class': 'PCR_legend' }).insert(this.labelGroup);
        var container_1 = new Element('div', { 'id': 'Onb_fieldSet_container_1' });
        this.virtualHtml.down('[id=Onb_fieldSet_1_WorkSchedule]').insert(legend);
        this.virtualHtml.down('[id=Onb_fieldSet_1_WorkSchedule]').insert(container_1);
        this.virtualHtml.down('[id=Onb_fieldSet_1_WorkSchedule]').addClassName('Onb_columnBorder');

        //Workschedule
        if (Object.isEmpty(this.getContentWorkSchedule)) {
            //New
            this.virtualHtml.down('[id = Onb_fieldSet_2]').update("");
            var legend_2 = new Element('span', { 'class': 'PCR_legend' }).insert(global.getLabel('New_Work_schedule_rule'));
            var container_2 = new Element('div', { 'id': 'Onb_fieldSet_container_2' });
            this.virtualHtml.down('[id=Onb_fieldSet_2]').insert(legend_2);
            this.virtualHtml.down('[id=Onb_fieldSet_2]').insert("<div id='loadingMessage' class='Onb_Text'>" + global.getLabel('Loading') + "</div>");
            this.loadingMessageDiv = this.virtualHtml.down('[id=loadingMessage]');
            this.virtualHtml.down('[id=Onb_fieldSet_2]').insert(container_2);
            this.virtualHtml.down('[id=Onb_fieldSet_2]').addClassName('Onb_columnBorder');
            this._getNewWorkSchedule();
        } else {
            //Modify 
            this.virtualHtml.down('[id = Onb_fieldSet_2]').update("");
            var legend_2 = new Element('span', { 'class': 'PCR_legend' }).insert(global.getLabel('Modify_Work_schedule_rule'));
            var container_2 = new Element('div', { 'id': 'Onb_fieldSet_container_2' });
            this.virtualHtml.down('[id=Onb_fieldSet_2]').insert(legend_2);
            this.virtualHtml.down('[id=Onb_fieldSet_2]').insert("<div id='loadingMessage' class='Onb_Text'>" + global.getLabel('Loading') + "</div>");
            this.loadingMessageDiv = this.virtualHtml.down('[id=loadingMessage]');
            this.virtualHtml.down('[id=Onb_fieldSet_2]').insert(container_2);
            this.virtualHtml.down('[id=Onb_fieldSet_2]').addClassName('Onb_columnBorder');
            this._getWorkSchedule();
        }



    },

    /**
    *@description 
    */
    _getWorkSchedule: function() {

        this.setLabels(this.getContentWorkSchedule);
        this.loadingMessageDiv.hide();
        this.virtualHtml.down('[id = Onb_fieldSet_container_2]').update("");
        this.virtualHtml.down('[id = Onb_fieldSet_container_1]').update("");
        /*//first
        this.virtualHtml.down('[id = Onb_fieldSet_1_WorkSchedule]').update("");
        var legend = new Element('span', { 'class': 'PCR_legend' }).insert(global.getLabel('Area'));
        this.virtualHtml.down('[id=Onb_fieldSet_1_WorkSchedule]').insert(legend);
        this.virtualHtml.down('[id=Onb_fieldSet_1_WorkSchedule]').addClassName('Onb_columnBorder');
        //second
        //this.virtualHtml.down('[id = Onb_fieldSet_2]').update("");
        this.virtualHtml.down('[id = Onb_fieldSet_2]').update("<div id='loadingMessage' class='Onb_Text'>" + global.getLabel('Loading') + "</div>");
        this.loadingMessageDiv = this.virtualHtml.down('[id=loadingMessage]');
        
        var legend_2 = new Element('span', { 'class': 'PCR_legend' }).insert(global.getLabel('Work_schedule_rule'));
        this.virtualHtml.down('[id=Onb_fieldSet_2]').insert(legend_2);
        this.virtualHtml.down('[id=Onb_fieldSet_2]').addClassName('Onb_columnBorder');
        */
        this.fieldPanel_Area = new getContentModule({
            mode: 'display', //mode,
            json: this.area,
            appId: global.currentApplication.appId, //this.appId,
            //showCancelButton: true,
            showLoadingPAI: false,
            //buttonsHandlers: this.hashToSaveButtons,
            cssClasses: $H({ fieldDispHalfSize: 'fieldDispQuarterSize', fieldDispGroupDiv: 'applicationtimeEntryScreen_alignGroupDiv', fieldDispClearBoth: 'fieldPanelMarginPrevElmnt' })
        });
        this.virtualHtml.down('[id = Onb_fieldSet_container_1]').insert(this.fieldPanel_Area.getHtml());

        //Process Link
        if (this.virtualHtml.down('[id$=MOWSR]')) {
            this.virtualHtml.down('[id$=MOWSR]').update("");
            var group2 = this.PSG_DWS.item['@id'].substring(0, 2);
            var subgroup2 = this.PSG_DWS.item['@id'].substring(2, 4); ;
            if (!Object.isEmpty(group2)) {
                this.virtualHtml.down('[id$=MOWSR]').insert("<span class='application_action_link' id='link_group_2'></span>");
                this.virtualHtml.down('[id=link_group_2]').update(this.labels.get(this.PSG_DWS.item['@value']));
                this.virtualHtml.down('[id=link_group_2]').observe('click', this._showGroup.bind(this, group2, subgroup2));
            }
        }
        //Process Link
        if (this.virtualHtml.down('[id$=ZEITY]')) {
            this.virtualHtml.down('[id$=ZEITY]').update("");
            var group3 = this.ESG_WSR.item['@id'];
            if (!Object.isEmpty(group3)) {
                this.virtualHtml.down('[id$=ZEITY]').insert("<span class='application_action_link' id='link_group_3'></span>");
                this.virtualHtml.down('[id=link_group_3]').update(this.labels.get(this.ESG_WSR.item['@value']));
                this.virtualHtml.down('[id=link_group_3]').observe('click', this._showGroup3.bind(this, group3));
            }
        }

        /*var loadingMessages = this.virtualHtml.select('[id^=loadingMessage]');
        for (var h = 0; h < loadingMessages.length; h++) {
        loadingMessages[h].hide();
        }*/

        var json = {
            elements: [],
            defaultButtonClassName: ''
        };
        var exit = {
            label: global.getLabel('exit'),
            idButton: 'exit_button',
            handlerContext: null,
            handler: this._exit.bind(this),
            type: 'button',
            standardButton: true,
            className: 'fieldDispFloatRight Onb_button'
        };
        var save = {
            label: global.getLabel('Save'),
            idButton: 'save_button',
            handlerContext: null,
            handler: this._save.bind(this, 'MOD'),
            type: 'button',
            standardButton: true,
            className: 'fieldDispFloatRight Onb_button'
        };
        /* var delete_ = {
        label: global.getLabel('Delete'),
        idButton: 'delete_button',
        handlerContext: null,
        handler: this._save.bind(this, 'DEL'),
        type: 'button',
        standardButton: true,
        className: 'fieldDispFloatRight Onb_button'
        };*/
        json.elements.push(exit);
        json.elements.push(save);
        // json.elements.push(delete_);
        this.Button_footer_WorkSchedule = new megaButtonDisplayer(json);
        this.virtualHtml.down('[id=workschedule_button]').update('');
        this.virtualHtml.down('[id=workschedule_button]').insert(this.Button_footer_WorkSchedule.getButtons());

        this.fieldPanel = new getContentModule({
            mode: 'edit', //mode,
            json: this.getContentWorkSchedule,
            appId: global.currentApplication.appId, //this.appId,
            //showCancelButton: true,
            showLoadingPAI: false,
            //buttonsHandlers: this.hashToSaveButtons,
            cssClasses: $H({ fieldDispHalfSize: 'fieldDispQuarterSize', fieldDispGroupDiv: 'applicationtimeEntryScreen_alignGroupDiv', fieldDispClearBoth: 'fieldPanelMarginPrevElmnt' })
        });
        this.virtualHtml.down('[id=Onb_fieldSet_container_2]').insert(this.fieldPanel.getHtml());
        //this.bindings.buttonClicked = this.buttonClicked.bind(this);
        this.virtualHtml.down('[id$=ZMODN]').update("");
        var div_input = new Element("div", { "id": "ZMODN_div", "align": "left" });
        var contents_area = objectToArray(this.getContentWorkSchedule.EWS.o_field_values.yglui_str_wid_record.contents.yglui_str_wid_content.fields.yglui_str_wid_field);
        for (var k = 0; k < contents_area.length; k++) {
            if (contents_area[k]['@fieldid'] == 'ZMODN') {
                var value = contents_area[k]['@value'];
            }
        }
        var input = new Element("input", { "style": "width:40px;", "type": "text", "disabled": "true", "class": "Onb_application_autocompleter_box", "size": "0", "value": value });
        input.id = "ZMODN_text";
        var input2 = new Element("input", { "type": "button", "class": "Onb_autocompleter_button_showall", "value": "" });
        input2.id = "ZMODN_button";
        div_input.insert(input);
        div_input.insert(input2);
        this.virtualHtml.down('[id$=ZMODN]').insert(div_input);
        this.bindings.buttonClicked = this.buttonClicked.bind(this); //bindAsEventListener(this, nb, t);
        input2.observe('click', this.bindings.buttonClicked);
        //  this.getWorkTime('');

    },

    buttonClicked: function(event) {

        this.loadingMessageDiv.show();
        this.virtualHtml.down('[id^=ZMODN]').removeClassName('fieldError');
        var jsonToSend = {
            EWS: {
                SERVICE: this.getPerwsService,
                PARAM: {
                    REQID: this.reqId,
                    RECORDS: { yglui_str_wid_field: $A() }
                }
            }
        };

        var contents_area = objectToArray(this.area.EWS.o_field_values.yglui_str_wid_record.contents.yglui_str_wid_content.fields.yglui_str_wid_field);
        for (var k = 0; k < contents_area.length; k++) {
            jsonToSend.EWS.PARAM.RECORDS.yglui_str_wid_field.push(contents_area[k]);
        }

        //transform the xml
        var json2xml = new XML.ObjTree();
        json2xml.attr_prefix = '@';

        //this.method = 'GET';
        //this.url = 'standard/Onboarding/XMLOUT_GET_PERWS.xml';
        this.makeAJAXrequest($H({
            xml: json2xml.writeXML(jsonToSend),
            successMethod: 'PopupDisplay'
            //ajaxID: row + '%' + column
        }));
    },

    /**
    *@description 
    */
    PopupDisplay: function(req, data) {
        /*data = data.split('%');
        var row = data[0];
        var column = data[1];*/
        this.setLabels(req);
        this.PopupHTML = new Element('div');
        //  this.PeriodRecords = req;

        var html = '';
        if (Object.isEmpty(req.EWS.o_tabvalues)) {
            html = '<div>' + global.getLabel('no_result') + '</div>'
            this.PopupHTML.insert(html);
        } else {
            html = '<table style= "margin-top : 10 px" class="sortable" id="Popup_resultsTable">'
                  + '<thead>'
                  + '<tr>';
            var sort = '';
            objectToArray(req.EWS.o_columns.yglui_str_wid_column).each(function(fieldSettings) {
                var label = this.labels.get((fieldSettings['@columnid']));
                if (sort == '') {
                    html = html + '<th class="table_nosort" id="' + fieldSettings['@columnid'] + '">' + label + '</th>';
                    sort = 'X';
                } else {
                    html = html + '<th id="' + fieldSettings['@columnid'] + '">' + label + '</th>';
                }
            } .bind(this));
            html = html + '</tr>'
                            + '</thead>'
                            + '<tbody id="results_tbody"></tbody></table>';

            this.PopupHTML.insert(html);
            var k = 1;
            objectToArray(req.EWS.o_tabvalues.yglui_str_wid_pwsval).each(function(fieldValues) {
                //debugger;
                var first = '';
                if (fieldValues['@nbrweeks'] != '1') {
                    var nb = "rowspan=" + fieldValues['@nbrweeks'];
                } else {
                    var nb = "";
                }
                var line = '';
                var id = '';
                var description = '';

                objectToArray(fieldValues.weeks.yglui_str_wid_pwsweek).each(function(week) {
                    line = line + '<tr>';
                    if (first == '') {
                        line = line
                            + '<td ' + nb + '><span id= "' + k + '" class="application_action_link">' + fieldValues['@pwsid'] + '</span ></td>'
                            + '<td ' + nb + ' >' + fieldValues['@pwsdesc'] + '</td>';
                        id = fieldValues['@pwsid'];
                        description = fieldValues['@pwsdesc'];
                        first = 'X';
                    }
                    line = line + '<td>' + week['@weeknbr'] + '</td>'
                           + '<td>' + week['@day1'] + '</td>'
                           + '<td>' + week['@day2'] + '</td>'
                           + '<td>' + week['@day3'] + '</td>'
                           + '<td>' + week['@day4'] + '</td>'
                           + '<td>' + week['@day5'] + '</td>'
                           + '<td>' + week['@day6'] + '</td>'
                           + '<td>' + week['@day7'] + '</td></tr>';
                } .bind(this));

                this.PopupHTML.down('[id=results_tbody]').insert(line);
                this.PopupHTML.down('[id=' + k + ']').observe('click', this._showValue.bind(this, id, description));
                k++;

            } .bind(this));


            //if (!this.tablePeriodShowed) {
            SortableTable.init($(this.PopupHTML).down("[id=Popup_resultsTable]"));
            SortableTable.sort($(this.PopupHTML).down("[id=Popup_resultsTable]"), 4, 1);
            this.tablePeriodShowed = true;
            /* } else {
            SortableTable.load($(this.PopupHTML).down("[id=Popup_resultsTable]"));
            SortableTable.sort($(this.PopupHTML).down("[id=Popup_resultsTable]"), 4, 1);
            }*/
        }
        //this.PopupHTML.insert(this.TableHtml);
        // Buttons
        var buttonsJson = {
            elements: [],
            mainClass: 'moduleInfoPopUp_stdButton_div_left'
        };
        var callBack = function() {
            this.PeriodPopUp.close();
            delete this.PeriodPopUp;
        } .bind(this);
        var closeButton = {
            idButton: 'close',
            label: global.getLabel('Close'),
            handlerContext: null,
            className: 'moduleInfoPopUp_stdButton',
            handler: callBack,
            type: 'button',
            standardButton: true
        };
        buttonsJson.elements.push(closeButton);

        var ButtonObj = new megaButtonDisplayer(buttonsJson);
        var buttons = ButtonObj.getButtons();
        this.PopupHTML.insert(buttons);
        // infoPopUp creation
        this.PeriodPopUp = new infoPopUp({
            closeButton: $H({
                'textContent': global.getLabel('cancel'),
                'callBack': callBack
            }),
            htmlContent: this.PopupHTML,
            indicatorIcon: 'void',
            width: 720 //530
        });
        this.PeriodPopUp.create();

    },

    _getNewWorkSchedule: function() {

        var jsonToSend = {
            EWS: { SERVICE: this.getNewWorkSchedule,
                PARAM: {
                    APPID: 'WSRULE',
                    WID_SCREEN: '*',
                    OKCODE: 'NEW',
                    REQID: this.reqId,
                    RECORDS: { yglui_str_wid_field: $A() }
                }
            }
        };

        var contents_area = objectToArray(this.area.EWS.o_field_values.yglui_str_wid_record.contents.yglui_str_wid_content.fields.yglui_str_wid_field);
        for (var k = 0; k < contents_area.length; k++) {
            jsonToSend.EWS.PARAM.RECORDS.yglui_str_wid_field.push(contents_area[k]);
        }
        //transform the xml
        var json2xml = new XML.ObjTree();
        json2xml.attr_prefix = '@';

        //this.method = 'GET';
        //this.url = 'standard/Onboarding/XMLOUT_GET_WSRULE.xml';
        this.makeAJAXrequest($H({ xml: json2xml.writeXML(jsonToSend), successMethod: '_displayNewWorkSchedule' }));

    },


    /**
    *@description Displays all neccesary fields to create a new workschedule
    *@param {JSON} json Information from GET_CONTENT2 service
    */
    _displayNewWorkSchedule: function(req) {

        this.getContentWorkSchedule = req;
        this.loadingMessageDiv.hide();
        this.virtualHtml.down('[id = Onb_fieldSet_container_2]').update("");
        this.virtualHtml.down('[id = Onb_fieldSet_container_1]').update("");

        //first
        /*    this.virtualHtml.down('[id = Onb_fieldSet_1_WorkSchedule]').update("");
        var legend = new Element('span', { 'class': 'PCR_legend' }).insert(global.getLabel('Area'));
        this.virtualHtml.down('[id=Onb_fieldSet_1_WorkSchedule]').insert(legend);
        this.virtualHtml.down('[id=Onb_fieldSet_1_WorkSchedule]').addClassName('Onb_columnBorder');
        //second
        //this.virtualHtml.down('[id = Onb_fieldSet_2]').update("");
        this.virtualHtml.down('[id = Onb_fieldSet_2]').update("<div id='loadingMessage' class='Onb_Text'>" + global.getLabel('Loading') + "</div>");
        this.loadingMessageDiv = this.virtualHtml.down('[id=loadingMessage]');
        this.loadingMessageDiv.hide();
        var legend_2 = new Element('span', { 'class': 'PCR_legend' }).insert(global.getLabel('Work_schedule_rule'));
        this.virtualHtml.down('[id=Onb_fieldSet_2]').insert(legend_2);
        this.virtualHtml.down('[id=Onb_fieldSet_2]').addClassName('Onb_columnBorder');
        */

        this.fieldPanel_Area = new getContentModule({
            mode: 'display', //mode,
            json: this.area,
            appId: global.currentApplication.appId, //this.appId,
            //showCancelButton: true,
            showLoadingPAI: false,
            //buttonsHandlers: this.hashToSaveButtons,
            cssClasses: $H({ fieldDispHalfSize: 'fieldDispQuarterSize', fieldDispGroupDiv: 'applicationtimeEntryScreen_alignGroupDiv', fieldDispClearBoth: 'fieldPanelMarginPrevElmnt' })
        });
        this.virtualHtml.down('[id = Onb_fieldSet_container_1]').insert(this.fieldPanel_Area.getHtml());

        //Process Link
        if (this.virtualHtml.down('[id$=MOWSR]')) {
            this.virtualHtml.down('[id$=MOWSR]').update("");
            var group2 = this.PSG_DWS.item['@id'].substring(0, 2);
            var subgroup2 = this.PSG_DWS.item['@id'].substring(2, 4); ;
            if (!Object.isEmpty(group2)) {
                this.virtualHtml.down('[id$=MOWSR]').insert("<span class='application_action_link' id='link_group_2'></span>");
                this.virtualHtml.down('[id=link_group_2]').update(this.labels.get(this.PSG_DWS.item['@value']));
                this.virtualHtml.down('[id=link_group_2]').observe('click', this._showGroup.bind(this, group2, subgroup2));
            }
        }
        //Process Link
        if (this.virtualHtml.down('[id$=ZEITY]')) {
            this.virtualHtml.down('[id$=ZEITY]').update("");
            var group3 = this.ESG_WSR.item['@id'];
            if (!Object.isEmpty(group3)) {
                this.virtualHtml.down('[id$=ZEITY]').insert("<span class='application_action_link' id='link_group_3'></span>");
                this.virtualHtml.down('[id=link_group_3]').update(this.labels.get(this.ESG_WSR.item['@value']));
                this.virtualHtml.down('[id=link_group_3]').observe('click', this._showGroup3.bind(this, group3));
            }
        }

        /*  var loadingMessages = this.virtualHtml.select('[id^=loadingMessage]');
        for (var h = 0; h < loadingMessages.length; h++) {
        loadingMessages[h].hide();
        }*/
        var json = {
            elements: [],
            defaultButtonClassName: ''
        };
        var exit = {
            label: global.getLabel('exit'),
            idButton: 'exit_button',
            handlerContext: null,
            handler: this._exit.bind(this),
            type: 'button',
            standardButton: true,
            className: 'fieldDispFloatRight Onb_button'
        };
        var save = {
            label: global.getLabel('Save'),
            idButton: 'save_button',
            handlerContext: null,
            handler: this._save.bind(this, 'NEW'),
            type: 'button',
            standardButton: true,
            className: 'fieldDispFloatRight Onb_button'
        };

        json.elements.push(exit);
        json.elements.push(save);

        this.Button_footer_WorkSchedule = new megaButtonDisplayer(json);
        this.virtualHtml.down('[id=workschedule_button]').update('');
        this.virtualHtml.down('[id=workschedule_button]').insert(this.Button_footer_WorkSchedule.getButtons());
        delete req.EWS.o_widget_screens;
        this.fieldPanel = new getContentModule({
            mode: 'create', //mode,
            json: req,
            appId: 'WSRULE', //global.currentApplication.appId, //this.appId,
            //showCancelButton: true,
            showLoadingPAI: false,
            //buttonsHandlers: this.hashToSaveButtons,
            cssClasses: $H({ fieldDispHalfSize: 'fieldDispQuarterSize', fieldDispGroupDiv: 'applicationtimeEntryScreen_alignGroupDiv', fieldDispClearBoth: 'fieldPanelMarginPrevElmnt' })
        });
        this.virtualHtml.down('[id=Onb_fieldSet_container_2]').insert(this.fieldPanel.getHtml());
        //var i;
        // this.getWorkTime('NEW');
        //this.bindings.buttonClicked = this.buttonClicked.bind(this);
        this.virtualHtml.down('[id$=ZMODN]').update("");
        var div_input = new Element("div", { "id": "ZMODN_div", "align": "left" });
        var contents_area = objectToArray(this.getContentWorkSchedule.EWS.o_field_values.yglui_str_wid_record.contents.yglui_str_wid_content.fields.yglui_str_wid_field);
        for (var k = 0; k < contents_area.length; k++) {
            if (contents_area[k]['@fieldid'] == 'ZMODN') {
                var value = contents_area[k]['@value'];
            }
        }
        var input = new Element("input", { "style": "width:40px;", "type": "text", "disabled": "true", "class": "Onb_application_autocompleter_box", "size": "2", "value": value });
        input.id = "ZMODN_text";
        var input2 = new Element("input", { "type": "button", "class": "Onb_autocompleter_button_showall", "value": "" });
        input2.id = "ZMODN_button";
        div_input.insert(input);
        div_input.insert(input2);
        this.virtualHtml.down('[id$=ZMODN]').insert(div_input);
        this.bindings.buttonClicked = this.buttonClicked.bind(this); //bindAsEventListener(this, nb, t);
        input2.observe('click', this.bindings.buttonClicked);
        //  this.getWorkTime('');

    },

    getWorkTime: function(value, description) {

        var contents = objectToArray(this.getContentWorkSchedule.EWS.o_field_values.yglui_str_wid_record.contents.yglui_str_wid_content.fields.yglui_str_wid_field);
        for (var i = 0; i < contents.length; i++) {
            if (contents[i]['@fieldid'] == 'ZMODN')
                contents[i]['@value'] = value;
            if (contents[i]['@fieldid'] == 'ZTEXT') {
                contents[i]['#text'] = description;
                contents[i]['@value'] = description;
            }
            //this.getContentWorkSchedule.EWS.o_field_values.yglui_str_wid_record.contents.yglui_str_wid_content.fields.yglui_str_wid_field[i]['#text'] = description;
            //this.getContentWorkSchedule.EWS.o_field_values.yglui_str_wid_record.contents.yglui_str_wid_content.fields.yglui_str_wid_field[i]['@value'] = description;
        }

        var jsonToSend = {
            EWS: { SERVICE: this.getTime,
                PARAM: {
                    APPID: 'WORKTIME',
                    WID_SCREEN: '*',
                    REQID: this.reqId,
                    o_field_settings: this.getContentWorkSchedule.EWS.o_field_settings,
                    o_field_values: this.getContentWorkSchedule.EWS.o_field_values,
                    RECORDS: { yglui_str_wid_field: $A() }
                }
            }
        };

        var contents_area = objectToArray(this.area.EWS.o_field_values.yglui_str_wid_record.contents.yglui_str_wid_content.fields.yglui_str_wid_field);
        for (var k = 0; k < contents_area.length; k++) {
            jsonToSend.EWS.PARAM.RECORDS.yglui_str_wid_field.push(contents_area[k]);
        }
        //transform the xml
        var json2xml = new XML.ObjTree();
        json2xml.attr_prefix = '@';

        //this.method = 'GET';
        //this.url = 'standard/Onboarding/XMLOUT_GET_WORK_TIME.xml';
        this.makeAJAXrequest($H({ xml: json2xml.writeXML(jsonToSend), successMethod: '_displayWorkTime' }));

    },


    /**
    *@description Displays all neccesary fields to create a new workschedule
    *@param {JSON} json Information from GET_CONTENT2 service
    */
    _displayWorkTime: function(req) {

        this.getContentWorkSchedule = req;
        this.loadingMessageDiv.hide();
        this.virtualHtml.down('[id = Onb_fieldSet_container_2]').update("");
        //this.virtualHtml.down('[id = Onb_fieldSet_2]').update("");
        /*    this.virtualHtml.down('[id = Onb_fieldSet_2]').update("<div id='loadingMessage' class='Onb_Text'>" + global.getLabel('Loading') + "</div>");
        this.loadingMessageDiv.hide();
        this.loadingMessageDiv = this.virtualHtml.down('[id=loadingMessage]');
        var legend_2 = new Element('span', { 'class': 'PCR_legend' }).insert(global.getLabel('Work_schedule_rule'));
        this.virtualHtml.down('[id=Onb_fieldSet_2]').insert(legend_2);
        this.virtualHtml.down('[id=Onb_fieldSet_2]').addClassName('Onb_columnBorder');
        */
        delete req.EWS.o_widget_screens;
        this.fieldPanel_Time = new getContentModule({
            mode: 'edit', //mode,
            json: this.getContentWorkSchedule, ///??????????????????????
            appId: 'WSRULE', //global.currentApplication.appId, //this.appId,
            showLoadingPAI: false,
            cssClasses: $H({ fieldDispHalfSize: 'fieldDispQuarterSize', fieldDispGroupDiv: 'applicationtimeEntryScreen_alignGroupDiv', fieldDispClearBoth: 'fieldPanelMarginPrevElmnt' })
        });

        this.virtualHtml.down('[id = Onb_fieldSet_container_2]').insert(this.fieldPanel_Time.getHtml());
        /*var loadingMessages = this.virtualHtml.select('[id^=loadingMessage]');
        for (var h = 0; h < loadingMessages.length; h++) {
        loadingMessages[h].hide();
        }*/
        this.virtualHtml.down('[id$=ZMODN]').update("");
        var div_input = new Element("div", { "id": "ZMODN_div", "align": "left" });
        var contents_area = objectToArray(this.getContentWorkSchedule.EWS.o_field_values.yglui_str_wid_record.contents.yglui_str_wid_content.fields.yglui_str_wid_field);
        for (var k = 0; k < contents_area.length; k++) {
            if (contents_area[k]['@fieldid'] == 'ZMODN') {
                var value = contents_area[k]['@value'];
            }
        }
        var input = new Element("input", { "style": "width:40px;", "type": "text", "disabled": "true", "class": "Onb_application_autocompleter_box", "size": "0", "value": value });
        input.id = "ZMODN_text";
        var input2 = new Element("input", { "type": "button", "class": "Onb_autocompleter_button_showall", "value": "" });
        input2.id = "ZMODN_button";
        div_input.insert(input);
        div_input.insert(input2);
        this.virtualHtml.down('[id$=ZMODN]').insert(div_input);
        this.bindings.buttonClicked = this.buttonClicked.bind(this); //bindAsEventListener(this, nb, t);
        input2.observe('click', this.bindings.buttonClicked);

        this.loadingMessageDiv.hide();
    },

    /**
    *@description Displays all neccesary fields to create a new workschedule
    *@param {JSON} json Information from GET_CONTENT2 service
    */
    setLabels: function(jsonIn) {
        if (!Object.isEmpty(jsonIn) && !Object.isEmpty(jsonIn.EWS.labels) && !Object.isEmpty(jsonIn.EWS.labels.item)) {
            objectToArray(jsonIn.EWS.labels.item).each(function(label) {
                if (!Object.isEmpty(label['@id']))
                    this.labels.set(label['@id'], label['@value']);
            } .bind(this));
        }
    },

    /**
    *@description Toggles the recurrence pattern
    *@param {string} pattern Daily ('D'), Weekly ('W') or Monthly ('M')
    */
    _showValue: function(value, description) {

        this.PeriodPopUp.close();
        delete this.PeriodPopUp;
        this.getWorkTime(value, description);

    },

    /**
    * Method called when the Pending Xml is received.
    * @param {HTTPResponse} req Response of the AJAX call
    */
    _showGroup3: function(group) {

        var jsonToSend = {
            EWS: {
                SERVICE: this.getGroupService,
                PARAM: {
                    RECORDS: { yglui_str_wid_field: $A() }
                }
            }
        };

        var area = objectToArray(this.area.EWS.o_field_values.yglui_str_wid_record.contents.yglui_str_wid_content.fields.yglui_str_wid_field);
        //insert the records
        for (var k = 0; k < area.length; k++) {
            if (area[k]['@fieldid'] == 'ZEITY') {
                area[k]['@value'] = group;
            }
            jsonToSend.EWS.PARAM.RECORDS.yglui_str_wid_field.push(area[k]);
        }
        //transform the xml
        var json2xml = new XML.ObjTree();
        json2xml.attr_prefix = '@';

        this.makeAJAXrequest($H({
            xml: json2xml.writeXML(jsonToSend),
            successMethod: 'DisplayGroup2'
        }));
    },

    /**
    * Method called when the Pending Xml is received.
    * @param {HTTPResponse} req Response of the AJAX call
    */
    _showGroup: function(group, subgroup) {

        var jsonToSend = {
            EWS: {
                SERVICE: this.getAreaService,
                PARAM: {
                    RECORDS: { yglui_str_wid_field: $A() }
                }
            }
        };

        var area = objectToArray(this.area.EWS.o_field_values.yglui_str_wid_record.contents.yglui_str_wid_content.fields.yglui_str_wid_field);
        //insert the records
        for (var k = 0; k < area.length; k++) {
            if (area[k]['@fieldid'] == 'MOFID') {
                area[k]['@value'] = group;
            }
            if (area[k]['@fieldid'] == 'MOSID') {
                area[k]['@value'] = subgroup;
            }
            jsonToSend.EWS.PARAM.RECORDS.yglui_str_wid_field.push(area[k]);
        }
        //transform the xml
        var json2xml = new XML.ObjTree();
        json2xml.attr_prefix = '@';

        this.makeAJAXrequest($H({
            xml: json2xml.writeXML(jsonToSend),
            successMethod: 'DisplayGroup'
        }));
    },

    /**
    * Method called when the Pending Xml is received.
    * @param {HTTPResponse} req Response of the AJAX call
    */
    DisplayGroup: function(req, data) {

        this.setLabels(req);
        this.GroupHTML = new Element('div');
        this.TableHtml = new Element('table', { id: 'Area_resultsTable', style: 'margin-left:15px ;width:90%', className: 'sortable' });
        html = "<thead><tr>"
            + "<th>" + global.getLabel('area') + "</th>"
            + "<th>" + global.getLabel('subarea') + "</th>"
            + "</tr></thead><tbody id='area_results'></tbody>";
        this.TableHtml.insert(html);
        this.GroupHTML.insert(this.TableHtml);

        objectToArray(req.EWS.o_areas.yglui_str_wid_area).each(function(fieldValues) {
            //debugger;
            var line = '<tr>'
                    + "<td>" + fieldValues['@area'] + "</td>"
                    + "<td>" + fieldValues['@subarea'] + "</td>"
                    + "</tr>";
            this.GroupHTML.down('[id=area_results]').insert(line);
        } .bind(this));

        //this.GroupHTML.insert(this.TableHtml);
        // Buttons
        var buttonsJson = {
            elements: [],
            mainClass: 'Onb_moduleInfoPopUp_stdButton_div_left'
        };
        var callBack = function() {
            this.GroupPopUp.close();
            delete this.GroupPopUp;
        } .bind(this);
        var closeButton = {
            idButton: 'close',
            label: global.getLabel('Close'),
            handlerContext: null,
            className: 'moduleInfoPopUp_stdButton',
            handler: callBack,
            type: 'button',
            standardButton: true
        };
        buttonsJson.elements.push(closeButton);

        var ButtonObj = new megaButtonDisplayer(buttonsJson);
        var buttons = ButtonObj.getButtons();
        this.GroupHTML.insert(buttons);
        // infoPopUp creation
        this.GroupPopUp = new infoPopUp({
            closeButton: $H({
                'textContent': global.getLabel('cancel'),
                'callBack': callBack
            }),
            htmlContent: this.GroupHTML,
            indicatorIcon: 'void',
            width: 350
        });
        this.GroupPopUp.create();
        // this.tableGroup = new tableKitWithSearch(this.GroupHTML.down('table#Area_resultsTable'), { pages: global.paginationLimit, marginL: 100, searchLabel: global.getLabel('search'), noResultsLabel: global.getLabel('noResults'), webSearch: false });
        if (!this.tableGroupShowed) {
            this.tableGroupShowed = true;
            this.tableGroup = new tableKitWithSearch(this.GroupHTML.down('table#Area_resultsTable'), { pages: global.paginationLimit, marginL: 100, searchLabel: global.getLabel('search'), noResultsLabel: global.getLabel('noResults') });
        } else {
            this.tableGroup.reloadTable(this.GroupHTML.down('table#Area_resultsTable'));
        }
        if (this.GroupHTML.down('div#Area_resultsTable_searchBoxDiv'))
            this.GroupHTML.down('div#Area_resultsTable_searchBoxDiv').addClassName('Onb_search');


    },

    /**
    * Method called when the Pending Xml is received.
    * @param {HTTPResponse} req Response of the AJAX call
    */
    DisplayGroup2: function(req, data) {

        this.setLabels(req);
        this.GroupHTML = new Element('div');
        this.TableHtml = new Element('table', { id: 'Area_resultsTable2', style: 'margin-left:15px ;width:90%', className: 'sortable' });
        html = "<thead><tr>"
            + "<th>" + global.getLabel('eegroup') + "</th>"
            + "<th>" + global.getLabel('eesubgroup') + "</th>"
            + "</tr></thead><tbody id='area_results'></tbody>";
        this.TableHtml.insert(html);
        this.GroupHTML.insert(this.TableHtml);

        objectToArray(req.EWS.o_eegrps.yglui_str_wid_eegrp).each(function(fieldValues) {
            //debugger;
            var line = '<tr>'
                    + "<td>" + fieldValues['@eegroup'] + "</td>"
                    + "<td>" + fieldValues['@eesubgroup'] + "</td>"
                    + "</tr>";
            this.GroupHTML.down('[id=area_results]').insert(line);
        } .bind(this));

        // Buttons
        var buttonsJson = {
            elements: [],
            mainClass: 'Onb_moduleInfoPopUp_stdButton_div_left'
        };
        var callBack = function() {
            this.GroupPopUp.close();
            delete this.GroupPopUp;
        } .bind(this);
        var closeButton = {
            idButton: 'close',
            label: global.getLabel('Close'),
            handlerContext: null,
            className: 'moduleInfoPopUp_stdButton',
            handler: callBack,
            type: 'button',
            standardButton: true
        };
        buttonsJson.elements.push(closeButton);

        var ButtonObj = new megaButtonDisplayer(buttonsJson);
        var buttons = ButtonObj.getButtons();
        this.GroupHTML.insert(buttons);
        // infoPopUp creation
        this.GroupPopUp = new infoPopUp({
            closeButton: $H({
                'textContent': global.getLabel('cancel'),
                'callBack': callBack
            }),
            htmlContent: this.GroupHTML,
            indicatorIcon: 'void',
            width: 350
        });
        this.GroupPopUp.create();
        if (!this.tableGroup2Showed) {
            this.tableGroup2Showed = true;
            this.tableGroup2 = new tableKitWithSearch(this.GroupHTML.down('table#Area_resultsTable2'), { pages: global.paginationLimit, marginL: 100, searchLabel: global.getLabel('search'), noResultsLabel: global.getLabel('noResults') });
        } else {
            this.tableGroup2.reloadTable(this.GroupHTML.down('table#Area_resultsTable2'));
        }
        if (this.GroupHTML.down('div#Area_resultsTable_searchBoxDiv'))
            this.GroupHTML.down('div#Area_resultsTable_searchBoxDiv').addClassName('Onb_search');

        

    },

    /**
    *@description Exits the application and open the previous one
    *@param {JSON} json Information from SAVE_EVENTS service
    *@param {number} ID Request ID
    */
    _exit: function(json, ID) {
        //global.goToPreviousApp();
        global.open($H({
            app: {
                appId: global.previousApplication.appId,
                tabId: global.previousApplication.tabId,
                view: global.previousApplication.view
            },
            reqId: this.reqId
        }));
    },


    _save: function(buttonType) {

        //Check, if nothing empty
        /* this.virtualHtml.down('[id=error]').update('');
        var values = this.virtualHtml.select('[id^=text]');
        var all_ok = '';
        for (i = 0; i < values.length && all_ok == ''; i++) {
        if (values[i].value == '') {
        this.virtualHtml.down('[id=error]').update(global.getLabel('fill_all'));
        all_ok = 'X';
        }
        }*/
        var value = this.virtualHtml.down('[id=ZMODN_text]').value;
        if (!Object.isEmpty(value)) {
            //no_error
            this.error = '';
            this.virtualHtml.down('[id^=ZMODN]').removeClassName('fieldError');
        } else {
            this.error = 'X';
            this.virtualHtml.down('[id^=ZMODN]').addClassName('fieldError');
        }


        //  if (Object.isEmpty(this.error) && Object.isEmpty(all_ok)) {
        // fieldPanel validation
        var fpvalidaton = null;
        if (this.fieldPanel_Time)
            fpvalidation = this.fieldPanel_Time.validateForm();
        else
            fpvalidation = this.fieldPanel.validateForm();
        var correctfp = fpvalidation.correctForm;
        if (correctfp && this.error == '') {

            var jsonToSend = {
                EWS: { SERVICE: this.SaveService,
                    PARAM: {
                        APPID: 'EOB_TIME',//global.currentApplication.appId,
                        WID_SCREEN: '*',
                        RECORDS: this.getContentWorkSchedule.EWS.o_field_values,
                        PSG_WSR: this.PSG_DWS,
                        ESG_WSR: this.ESG_WSR,
                        REQID: this.reqId,
                        OKCODE: buttonType

                    }
                }
            };

            //transform the xml
            var json2xml = new XML.ObjTree();
            json2xml.attr_prefix = '@';

            //this.method = 'GET';
            //this.url = 'standard/Onboarding/XMLOUT_GET_DAYWS.xml';
            this.makeAJAXrequest($H({
                xml: json2xml.writeXML(jsonToSend),
                successMethod: '_processExit',
                failureMethod: '_processExit',
                errorMethod: '_processExit',
                informationMethod: '_processExit'

            }));
        }

    },


    /**
    * @description Shows the status of the booking after calling SAP
    * @param req Result of the AJAX request
    */
    _processExit: function(req) {
        var i = 0;
        if (!Object.isEmpty(req.EWS.o_reqid)) {
            this.reqId = req.EWS.o_reqid;
        }
        var icon = '';
        var status = "<table id='application_workschedule_contain_status'>";
        //+ "<h2 id='application_workschedule_status_title' class='application_workschedule_status'>" + global.getLabel('status') + "</h2>";
        if (Object.isEmpty(req.EWS.webmessage_type)) {
            if (Object.isEmpty(req.EWS.messages)) {
                status += "<tr class='application_workschedule_status_line'><td class='application_workschedule_status_label'>" + global.getLabel('Success_WorkSchedule') + "</td></tr>";
                icon = 'confirmation';
            } else {
                var message = req.EWS.messages.item['#text'];
                status += "<tr class='application_workschedule_status_line'><td class='application_workschedule_status_label'>" + message + "</td></tr>";
                icon = 'confirmation';
            }
        }
        else {
            var message = req.EWS.webmessage_text;
            var type = req.EWS.webmessage_type
            if (type == 'E') {
                icon = 'exclamation';
                status += "<tr class='application_book_status_line'><td class='application_workschedule_status_label'>" + message + "</td></tr>";
            }
            else {
                icon = 'confirmation';
                status += "<tr class='application_book_status_line'><td class='application_workschedule_status_label'>" + global.getLabel('Success_WorkSchedule') + "</td></tr>";
            }

        }
        status += "</table>";
        var _this = this;
        var contentHTML = new Element('div', { 'class': 'Onb_popUp' });
        contentHTML.update('');
        contentHTML.insert(status);
        //buttons
        var buttonsJson = {
            elements: [],
            mainClass: 'moduleInfoPopUp_stdButton_div_left'
        };
        var callBack = function() {
            workscheduleStatusPopUp.close();
            delete workscheduleStatusPopUp;
            if (type == 'E') {
            } else {
                document.fire('EWS:refreshWorkSchedulePool');
                global.open($H({
                    app: {
                        appId: global.previousApplication.appId,
                        tabId: global.previousApplication.tabId,
                        view: global.previousApplication.view
                    },
                    reqId: _this.reqId
                }));
            }
        };
        var aux2 = {
            idButton: 'goTo',
            label: global.getLabel('ok'),
            handlerContext: null,
            className: 'moduleInfoPopUp_stdButton',
            handler: callBack,
            type: 'button',
            standardButton: true
        };

        buttonsJson.elements.push(aux2);
        var ButtonObj = new megaButtonDisplayer(buttonsJson);
        var buttons = ButtonObj.getButtons();
        //insert buttons in div
        contentHTML.insert(buttons);
        var workscheduleStatusPopUp = new infoPopUp({

            closeButton: $H({
                'textContent': 'Close',
                'callBack': callBack
            }),
            htmlContent: contentHTML,
            indicatorIcon: icon,
            width: 350
        });
        workscheduleStatusPopUp.create();

    },

    close: function($super) {
        $super();
        if (this.fieldPanel)
            this.fieldPanel.destroy();

        if (this.fieldPanel_Area)
            this.fieldPanel_Area.destroy();

    }

});



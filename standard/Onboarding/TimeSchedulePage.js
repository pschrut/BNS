/** 
* @fileOverview PeriodPool.js 
* @description File containing class ONB. This application is responsible of 
* showing Period details (Add or Modif).
*/

/**
*@constructor
*@description Class CARPAGE. Shows CAR Details.
*@augments Application 
*/
var PWS_ACTIONS = Class.create(Application,
{
    /*
    Service
    */
    getContentService: 'GET_PERWS',
    getDays: 'GET_DAYWS',
    SaveService: 'SAVE_PERWS',
    getAreaService: 'GET_AREAS',


    /* if we open the application, reload details
    * @type Boolean
    */
    firstRun: true,
    registeredValue: '',
    error: '',
    /**
    *@param $super The superclass (Application)
    *@description Instantiates the app
    */
    initialize: function($super, args) {
        $super(args);
        this.bindings = {};

    },
    
    /**
    *@param $super The superclass: Application
    *@param args Arguments coming from previous application
    *@description 
    */
    run: function($super, args) {
        $super();
        // document.observe('EWS:DaySelected', this._selectRadioBinding);

        var header = args.get('header');
        // this.fieldset = args.get('fieldset');
        this.area = args.get('area');
        this.buttonType = args.get('buttonType');
        this.reqId = args.get('reqId');
        this.PSG_DWS = args.get('PSG_DWS');
        this.labelGroup = args.get('labelGroup');
        this.autoClicked('', '', '');
        if (this.firstRun) {
            this.firstRun = false;

            var html = "<table id='PeriodTable' class='Onb'>" +
            "<tr><td><div id='company_name' class='Onb_Title application_main_title2'>"
            + global.getCompanyName() + "</div></td></tr>"
            + "<tr><td><div id='loadingMessage' class='Onb_Text'>" + global.getLabel('Loading') + "</div></td></tr>"
            + "<tr><td><div id='header'></div></td></tr>"
            + "<tr><td><div class='Onb_column0' id='Onb_fieldSet_1_Period'></div></td></tr>"
            + "<tr><td><div id='period_detail_body'></div></td></tr>"
            + "<tr><td><div class='application_main_error_text' id='error'></div><div id='period_button'></div></td></tr>"
            + "</table>";
            this.virtualHtml.insert(html);

            this.loadingMessageDiv = this.virtualHtml.down('[id=loadingMessage]');
            this.loadingMessageDiv.hide();
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
                idButton: 'exit_button',
                handlerContext: null,
                handler: this._save.bind(this, ''),
                type: 'button',
                standardButton: true,
                className: 'fieldDispFloatRight Onb_button'
            };
            json.elements.push(exit);
            json.elements.push(save);
            this.Button_footer = new megaButtonDisplayer(json);
            this.virtualHtml.down('[id=period_button]').insert(this.Button_footer.getButtons());
        }
        else
            this.virtualHtml.down('div#period_detail_body').update("");

        this.virtualHtml.down('div#header').update(header);
        this.virtualHtml.down('[id = Onb_fieldSet_1_Period]').update("");
        var legend = new Element('span', { 'class': 'Onb_legend' }).insert(this.labelGroup);
        this.virtualHtml.down('[id=Onb_fieldSet_1_Period]').insert(legend);
        this.virtualHtml.down('[id=Onb_fieldSet_1_Period]').addClassName('Onb_columnBorder');

        this.fieldPanel = new getContentModule({
            mode: 'display', //mode,
            json: this.area,
            appId: global.currentApplication.appId, //this.appId,
            //showCancelButton: true,
            showLoadingPAI: false,
            //buttonsHandlers: this.hashToSaveButtons,
            cssClasses: $H({
            fieldDispHalfSize: 'fieldDispQuarterSize',
            fieldDispGroupDiv: 'applicationtimeEntryScreen_alignGroupDiv', 
            fieldDispClearBoth: 'fieldPanelMarginPrevElmnt'})
        });
        this.virtualHtml.down('[id = Onb_fieldSet_1_Period]').insert(this.fieldPanel.getHtml());

        //Process Period
        this.getContentPeriod = args.get('period');
        this.periodId = Object.isEmpty(this.getContentPeriod.EWS) ? "" : this.getContentPeriod.EWS.o_tabvalues.yglui_str_wid_pwsval['@pwsid']; // key_str
        this.periodKey = this.periodId; // rec_key
        this._getPeriod();
        //document.observe('EWS:autocompleterResultSelected_applicationperiodEntryScreen_employeeSelection', this.periodEntryEmployeeSelectedBinding);

        //Show group - Process Link
        if (this.virtualHtml.down('[id$=MOTPR]')) {
            this.virtualHtml.down('[id$=MOTPR]').update("");
            var group = this.PSG_DWS.item['@value'];
            if (!Object.isEmpty(group)) {
                this.virtualHtml.down('[id$=MOTPR]').insert("<span class='application_action_link' id='link_group'></span>");
                this.virtualHtml.down('[id=link_group]').update(this.labels.get(group));
                this.virtualHtml.down('[id=link_group]').observe('click', this._showGroup.bind(this, group));
            }
        }


    },

    /**
    *@description 
    */
    _getPeriod: function() {
        // New period
        if (!Object.isEmpty(this.periodId)) {
            this._displayPeriod();
            var successMethod = '_SaveNewPeriod';
        } else {
            var successMethod = '_displayNewPeriod';
        }

        var jsonToSend = {
            EWS: { SERVICE: this.getContentService,
                PARAM: {
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
        //this.url = 'standard/Onboarding/XMLOUT_GET_PERWS1.xml';
        this.makeAJAXrequest($H({ xml: json2xml.writeXML(jsonToSend), successMethod: successMethod }));

    },

    _SaveNewPeriod: function(req) {

        this.simpleRow = deepCopy(req.EWS.o_tabvalues.yglui_str_wid_pwsval.weeks.yglui_str_wid_pwsweek);
    },

    /**
    *@description Displays all neccesary fields to create a new period
    *@param {JSON} json Information from GET_CONTENT2 service
    */
    _displayNewPeriod: function(req) {

        this.getContentPeriod = req;
        this.simpleRow = deepCopy(this.getContentPeriod.EWS.o_tabvalues.yglui_str_wid_pwsval.weeks.yglui_str_wid_pwsweek);
        //this.getContentPeriod = req;
        this.getContentPeriod.EWS.o_tabvalues.yglui_str_wid_pwsval['@nbrweeks'] = (parseInt(1, 10)).toPaddedString(3);
        this._displayPeriod();

    },

    /**
    *@description Displays all neccesary fields to create a new period
    *@param {JSON} json Information from GET_CONTENT2 service
    */
    valueChanged: function(event, name) {

        if (name == 'id') {
            var value = this.virtualHtml.down('[id=text_id]').value;
            this.getContentPeriod.EWS.o_tabvalues.yglui_str_wid_pwsval['@pwsid'] = value;
        } else {
            var value = this.virtualHtml.down('[id=text_description]').value;
            this.getContentPeriod.EWS.o_tabvalues.yglui_str_wid_pwsval['@pwsdesc'] = value;
        }
        this.virtualHtml.down('[id=error]').update('');

    },

    /**
    *@description Displays all neccesary fields to create a new period
    *@param {JSON} json Information from GET_CONTENT2 service
    */
    addButtonClicked: function(event, row) {

        //this.getContentPeriod;
        var jsonNew = { yglui_str_wid_pwsweek: $A() };

        var contents = objectToArray(this.getContentPeriod.EWS.o_tabvalues.yglui_str_wid_pwsval.weeks.yglui_str_wid_pwsweek);
        //insert the records
        for (var i = 1; i <= contents.length; i++) {

            if (i < row) {
                jsonNew.yglui_str_wid_pwsweek.push(contents[i - 1]);
            }
            if (i == row) {
                jsonNew.yglui_str_wid_pwsweek.push(contents[i - 1]);
                //this.simpleRow['@weeknbr'] = contents[i - 1]['@weeknbr'] + 1;
                this.simpleRow['@weeknbr'] = (parseInt(contents[i - 1]['@weeknbr'], 10) + 1).toPaddedString(3);
                jsonNew.yglui_str_wid_pwsweek.push(this.simpleRow);
            }
            if (i > row) {
                //contents[i - 1]['@weeknbr'] = contents[i - 1]['@weeknbr'] + 1;
                contents[i - 1]['@weeknbr'] = (parseInt(contents[i - 1]['@weeknbr'], 10) + 1).toPaddedString(3);
                jsonNew.yglui_str_wid_pwsweek.push(contents[i - 1]);
            }

        }
        this.getContentPeriod.EWS.o_tabvalues.yglui_str_wid_pwsval.weeks = jsonNew;
        this.getContentPeriod.EWS.o_tabvalues.yglui_str_wid_pwsval['@nbrweeks'] = (parseInt(this.getContentPeriod.EWS.o_tabvalues.yglui_str_wid_pwsval['@nbrweeks'], 10) + 1).toPaddedString(3);

        this._displayPeriod();
    },

    /**
    *@description Displays all neccesary fields to create a new period
    *@param {JSON} json Information from GET_CONTENT2 service
    */
    copyButtonClicked: function(event, row) {
        this.copyRow = row;
    },
    /**
    *@description Displays all neccesary fields to create a new period
    *@param {JSON} json Information from GET_CONTENT2 service
    */
    deleteButtonClicked: function(event, row) {

        var jsonNew = { yglui_str_wid_pwsweek: $A() };

        var contents = objectToArray(this.getContentPeriod.EWS.o_tabvalues.yglui_str_wid_pwsval.weeks.yglui_str_wid_pwsweek);
        //insert the records
        for (var i = 1; i <= contents.length; i++) {

            if (i < row) {
                jsonNew.yglui_str_wid_pwsweek.push(contents[i - 1]);
            }
            if (i == row) {
            }

            if (i > row) {
                //contents[i - 1]['@weeknbr'] = contents[i - 1]['@weeknbr']-1;
                contents[i - 1]['@weeknbr'] = (parseInt(contents[i - 1]['@weeknbr'], 10) - 1).toPaddedString(3);
                jsonNew.yglui_str_wid_pwsweek.push(contents[i - 1]);

            }

        }

        this.getContentPeriod.EWS.o_tabvalues.yglui_str_wid_pwsval['@nbrweeks'] = (parseInt(this.getContentPeriod.EWS.o_tabvalues.yglui_str_wid_pwsval['@nbrweeks'], 10) - 1).toPaddedString(3);
        this.getContentPeriod.EWS.o_tabvalues.yglui_str_wid_pwsval.weeks = jsonNew;
        this._displayPeriod();
    },

    /**
    *@description Displays all neccesary fields to create a new period
    *@param {JSON} json Information from GET_CONTENT2 service
    */
    pasteButtonClicked: function(event, row) {

        var jsonNew = { yglui_str_wid_pwsweek: $A() };
        var contents = objectToArray(this.getContentPeriod.EWS.o_tabvalues.yglui_str_wid_pwsval.weeks.yglui_str_wid_pwsweek);
        var copy = deepCopy(contents[this.copyRow - 1]);
        //insert the records
        for (var i = 1; i <= contents.length; i++) {


            if (i == row) {
                copy['@weeknbr'] = contents[i - 1]['@weeknbr'];
                jsonNew.yglui_str_wid_pwsweek.push(copy);
            } else {
                jsonNew.yglui_str_wid_pwsweek.push(contents[i - 1]);
            }

        }

        // this.getContentPeriod = jsonNew;
        this.getContentPeriod.EWS.o_tabvalues.yglui_str_wid_pwsval.weeks = jsonNew;
        this._displayPeriod();
    },

    checkFormat: function(row, column, event) {

        var value = this.virtualHtml.down('[id=text_' + row + '_' + column + ']').value;
        if (this.getContentPeriod.EWS.o_tabvalues.yglui_str_wid_pwsval.weeks.yglui_str_wid_pwsweek[row - 1]) {
            this.getContentPeriod.EWS.o_tabvalues.yglui_str_wid_pwsval.weeks.yglui_str_wid_pwsweek[row - 1]['@day' + column + ''] = value;
        } else {
            this.getContentPeriod.EWS.o_tabvalues.yglui_str_wid_pwsval.weeks.yglui_str_wid_pwsweek['@day' + column + ''] = value;
        }
        if (this.registeredValue.include('-' + value + '-')) {
            //no_error
            this.error = '';
            this.virtualHtml.down('[id=error]').update('');
            this.virtualHtml.down('[id=td_' + row + '_' + column + ']').removeClassName('fieldError');
        } else {
            this.error = 'X';
            this.virtualHtml.down('[id=td_' + row + '_' + column + ']').addClassName('fieldError');
        }

    },

    /**
    *@description Displays all neccesary fields to create a new period
    *@param {JSON} json Information from GET_CONTENT2 service
    */
    autoClicked: function(row, column, event) {

        var jsonToSend = {
            EWS: { SERVICE: this.getDays,
                PARAM: {
                    APPID: 'DAYWS',
                    WID_SCREEN: '*',
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

        if (Object.isEmpty(row)) {
            var successMethod = 'Register';
        } else {
            var successMethod = 'PopupDisplay';
        }
        //this.method = 'GET';
        //this.url = 'standard/Onboarding/XMLOUT_GET_DAYWS.xml';
        this.makeAJAXrequest($H({
            xml: json2xml.writeXML(jsonToSend),
            successMethod: successMethod,
            ajaxID: row + '%' + column
        }));

    },

    /**
    *@description Displays an existing period
    */
    _displayPeriod: function() {

        req = deepCopy(this.getContentPeriod);
        this.getContentPeriod = req;

        if (Object.isEmpty(this.virtualHtml.down('div#divInside'))) {
            if ((this.buttonType == 'MOD')) {
                var legend_label = global.getLabel('Mod_Period')
            } else {
                var legend_label = global.getLabel('New_Period')
            }
            var legend = new Element('span', { 'class': 'Onb_legend' }).insert(legend_label);
            var bc = new Element('div', { 'id': 'Onb_fieldSet_2', 'class': 'Onb_column0' }).insert(legend);
            //legend.addClassName('Onb_complete_border');
            bc.addClassName('Onb_columnBorder');
            var divInside = new Element('div', { 'id': 'divInside', 'class': 'Onb_inside_fieldset' });
            bc.insert(divInside);


        } else {
            // exist already
            this.virtualHtml.down('div#divInside').update('');
        }


        var table = new Element("table", { "width": "100%" }); //var
        var tbody = new Element("tbody");
        table.insert(tbody);
        var tr = new Element("tr");
        tbody.insert(tr);
        var label = "<span class='application_main_soft_text'>" + global.getLabel('Period_work') + "</span>"
        var td = new Element("td", { "colspan": "12", "align": "left" }).update(label);
        if (this.buttonType == 'NEW') {
            input = new Element("input", { "style": "margin-left:10px; margin-right:10px; width:35px;", "type": "text", "size": "2", "class": "fde_application_autocompleter_box"});
            //input = new Element("input", { "style": "text-align:center; width:35px;", "type": "text", "size": "2", "class": "fde_application_autocompleter_box" });
            input.id = "text_id";
            input2 = new Element("input", { "style": "margin-left:10px; margin-right:10px; width:160px;", "type": "text", "size": "10", "class": "fde_application_autocompleter_box" });
            input2.id = "text_description";
            td.insert(input);
            td.insert(input2);
            this.bindings.id = this.valueChanged.bindAsEventListener(this, "id");
            Event.observe(input, "change", this.bindings.id);
            this.bindings.text = this.valueChanged.bindAsEventListener(this, "description");
            Event.observe(input2, "change", this.bindings.text);
        } else {
            span = new Element("span", { "style": "margin-left:10px; margin-right:10px; width:35px;" });
            span.id = "id";
            input2 = new Element("input", { "style": "margin-left:10px; margin-right:10px; width:160px;", "type": "text", "size": "10", "class": "fde_application_autocompleter_box", "value": "" });
            input2.id = "text_description";
            //span2 = new Element("span", { "style": "margin-left:10px; margin-right:10px; width:160px;" });
            //span2.id = "description";
            //td.insert(span2);
            td.insert(span);
            td.insert(input2);
            this.bindings.text = this.valueChanged.bindAsEventListener(this, "description");
            Event.observe(input2, "change", this.bindings.text);

        }
        tr.insert(td);

        var tr_header = new Element("tr");
        var header = "<td class='application_main_soft_text'>" + global.getLabel('week') + "</td>"
        + "<td class='application_main_soft_text'>" + '01' + "</td>"
        + "<td class='application_main_soft_text'>" + '02' + "</td>"
        + "<td class='application_main_soft_text'>" + '03' + "</td>"
        + "<td class='application_main_soft_text'>" + '04' + "</td>"
        + "<td class='application_main_soft_text'>" + '05' + "</td>"
        + "<td class='application_main_soft_text'>" + '06' + "</td>"
        + "<td class='application_main_soft_text'>" + '07' + "</td>"
        + "<td colspan=4></td>";
        tr_header.insert(header);
        tbody.insert(tr_header);

        objectToArray(req.EWS.o_tabvalues.yglui_str_wid_pwsval).each(function(fieldValues) {

            var nb = 1; //fieldValues['@nbrweeks'];
            if ((this.buttonType == 'MOD')) {
                span.update(fieldValues['@pwsid']);
                input2.value = fieldValues['@pwsdesc'];
            } else {
                if (fieldValues['@pwsid'])
                    input.value = fieldValues['@pwsid'];
                if (fieldValues['@pwsdesc'])
                    input2.value = fieldValues['@pwsdesc'];
            }

            objectToArray(fieldValues.weeks.yglui_str_wid_pwsweek).each(function(week) {

                //  objectToArray(req.EWS.o_tabvalues.yglui_str_wid_pwsval.weeks.yglui_str_wid_pwsweek).each(function(week) {
                var tr3 = new Element("tr", { "id": "tr_" + nb });
                var td_week = new Element("td", { "id": nb, "align": "left" }).update(week['@weeknbr']);
                tr3.insert(td_week);
                for (var t = 1; t < 8; t++) {
                    var value = week['@day' + t + ''];
                    if (Object.isEmpty(value)) {
                        value = '';
                    }
                    var td_input = new Element("td", { "id": "td_" + nb + "_" + t, "align": "left" });
                    input = new Element("input", { "style": "width:35px;", "size": "0", "type": "text", "class": "Onb_application_autocompleter_box", "value": value });
                    input.id = "text_" + nb + "_" + t;
                    input2 = new Element("input", { "type": "button", "class": "Onb_autocompleter_button_showall", "value": "" });
                    input2.id = "button_" + nb + "_" + t;
                    td_input.insert(input);
                    td_input.insert(input2);
                    tr3.insert(td_input);
                    this.bindings.autoClicked = this.autoClicked.bind(this, nb, t); //bindAsEventListener(this, nb, t);
                    this.bindings.checkFormat = this.checkFormat.bind(this, nb, t); //bindAsEventListener(this, nb, t);
                    input2.observe('click', this.bindings.autoClicked);
                    input.observe('change', this.bindings.checkFormat);

                }
                var td_add = new Element("td", { "cursor": "pointer", "align": "left" });
                var td_copy = new Element("td", { "align": "left" });
                var td_paste = new Element("td", { "align": "left" });
                var td_del = new Element("td", { "align": "left" });
                var add_butt = new Element("div", { "class": "Onb_addIcon" }).update('+'); //'src': 'customer/SCX/images/add_button.png',
                var copy_butt = new Element("div", { "class": "Onb_copyIcon" }); //'src': 'customer/SCX/images/split_button.png',
                var paste_butt = new Element("div", { "class": "Onb_pasteIcon" }); //'src': 'customer/SCX/images/delete_button.png',
                var del_butt = new Element("div", { "class": "Onb_deleteIcon" }).update('-'); //'src': 'customer/SCX/images/split_button.png',
                this.bindings.addButtClicked = this.addButtonClicked.bindAsEventListener(this, nb);
                this.bindings.copyButtClicked = this.copyButtonClicked.bindAsEventListener(this, nb);
                this.bindings.pasteButtClicked = this.pasteButtonClicked.bindAsEventListener(this, nb);
                this.bindings.delButtClicked = this.deleteButtonClicked.bindAsEventListener(this, nb);
                add_butt.observe('click', this.bindings.addButtClicked);
                copy_butt.observe('click', this.bindings.copyButtClicked);
                paste_butt.observe('click', this.bindings.pasteButtClicked);
                del_butt.observe('click', this.bindings.delButtClicked);
                td_add.insert(add_butt);
                td_copy.insert(copy_butt);
                td_paste.insert(paste_butt);
                if (parseInt(fieldValues['@nbrweeks'], 10) > 1) {
                    td_del.insert(del_butt);
                }
                tr3.insert(td_add);
                tr3.insert(td_copy);
                tr3.insert(td_paste);
                tr3.insert(td_del);
                tbody.insert(tr3);
                nb = nb + 1;
            } .bind(this));

        } .bind(this));

        this.virtualHtml.down('div#period_detail_body').insert(bc);
        this.virtualHtml.down('div#divInside').insert(table);


    },

    /**
    *@description Creates, modifies or removes a period
    *@param {String} action Requested action
    *@param {String} okcode Ok Code
    *@param {String} type Type
    *@param {String} label Label
    */
    _save: function(confirm) {

        //Check, if nothing empty
        this.virtualHtml.down('[id=error]').update('');
        var values = this.virtualHtml.select('[id^=text]');
        var all_ok = '';
        for (i = 0; i < values.length && all_ok == ''; i++) {
            if (values[i].value == '') {
                this.virtualHtml.down('[id=error]').update(global.getLabel('fill_all'));
                all_ok = 'X';
            }
        }


        if (Object.isEmpty(this.error) && Object.isEmpty(all_ok)) {
            // fieldPanel validation
            /* var fpvalidation = this.fieldPanel.validateForm();
            var correctfp = fpvalidation.correctForm;
            if (correctfp) {*/

            // var action = "<yglui_vie_tty_ac actio='' actiot='' busid='' bustx='' class='' disma='' filter_param='' mandt='' methd='' okcod='" + this.buttonType + "' status='' tarap='' tartb='' tarty='' views=''/>";

            var action = new Object();
            action['#text'] = "";
            action['@actio'] = "";
            action['@okcod'] = this.buttonType;

            var jsonToSend = {
                EWS: { SERVICE: this.SaveService,
                    PARAM: {
                        APPID: global.currentApplication.appId,
                        WID_SCREEN: '*',
                        RECORDS: this.getContentPeriod.EWS.o_tabvalues,
                        PSG_DWS: this.PSG_DWS,
                        CONFIRM: confirm,
                        REQID: this.reqId,
                        ACTIONS: { yglui_vie_tty_ac: action }

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
    *@description Displays all neccesary fields to create a new period
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
    *@description 
    **/
    Register: function(req, data) {
        this.registeredValue = '-';
        objectToArray(req.EWS.o_field_values.yglui_str_wid_record).each(function(fieldValues) {
            if (!Object.isEmpty(fieldValues['@rec_key'])) {
                objectToArray(fieldValues.contents.yglui_str_wid_content.fields.yglui_str_wid_field).each(function(field) {

                    var valueToShow = !Object.isEmpty(field['#text']) ? field['#text'] : field['@value'];
                    if (field['@fieldid'] == 'TPROG') {
                        this.registeredValue = this.registeredValue + valueToShow + '-';
                    }

                } .bind(this));

            }
        } .bind(this));

    },

    /**
    *@description 
    */
    PopupDisplay: function(req, data) {
        data = data.split('%');
        var row = data[0];
        var column = data[1];
        this.setLabels(req);
        this.PopupHTML = new Element('div');
        var fieldSet = req.EWS.o_field_settings.yglui_str_wid_fs_record.fs_fields.yglui_str_wid_fs_field;
        var fieldVal = req.EWS.o_field_values;
        var tableHeaders = [];
        var headers = [];
        objectToArray(fieldSet).each(function(fieldSettings) {//setting the table headers
            if (fieldSettings['@fieldtype'] && fieldSettings['@fieldtype'].toLowerCase() == 'h') {
                //this field is a column header
                var seqnr = parseInt(fieldSettings['@seqnr'], 10);
                tableHeaders[seqnr] = fieldSettings['@fieldid'];
            }
        } .bind(this));

        var j = 0;
        for (i = 0; i < tableHeaders.length; i++) {
            if (tableHeaders[i]) {
                headers[j] = tableHeaders[i].toLowerCase();
                j++;
            }
        }
        this.TableHtml = new Element('table', { id: 'Period_resultsTable_popup', className: 'sortable' });
        html = "<thead><tr>";
        var sort = '';
        for (i = 0; i < headers.length; i++) {
            objectToArray(fieldSet).each(function(fieldSettings) {
                if (fieldSettings['@fieldid'].toLowerCase() == headers[i]) {
                    var label = !Object.isEmpty(fieldSettings['@fieldlabel']) ? fieldSettings['@fieldlabel'] : global.getLabel(headers[i]);
                    if (sort == '') {
                        html = html + "<th class='table_nosort' id='" + fieldSettings['@fieldid'] + "'>" + label + "</th>";
                        sort = 'X';
                    } else {
                        html = html + "<th id='" + fieldSettings['@fieldid'] + "'>" + label + "</th>";
                    }
                }
            } .bind(this));
        }

        html = html + "</tr></thead><tbody id='day_results'></tbody>";
        this.TableHtml.insert(html);
        this.PopupHTML.insert(this.TableHtml);
        var t = 1;
        objectToArray(fieldVal.yglui_str_wid_record).each(function(fieldValues) {
            //debugger;
            if (!Object.isEmpty(fieldValues['@rec_key'])) {
                var line = '<tr>';
                var TPROG = '';
                for (i = 0; i < headers.length; i++) {
                    objectToArray(fieldValues.contents.yglui_str_wid_content.fields.yglui_str_wid_field).each(function(field) {
                        if (field['@fieldid'] && field['@fieldid'].toLowerCase() == headers[i]) {
                            var valueToShow = !Object.isEmpty(field['#text']) ? field['#text'] : field['@value'];
                            if (Object.isEmpty(valueToShow)) {
                                valueToShow = '';
                            }

                            var valueToHash = !Object.isEmpty(sapToObject(valueToShow)) ? sapToDisplayFormat(valueToShow) : valueToShow;
                            if (field['@fieldid'] == 'TPROG') {
                                line = line + "<td  id = '" + t + "' >"
                                + "<span class='application_action_link'>" + valueToHash + "</span ></td>";
                                TPROG = field['@value'];

                            } else {
                                line = line + "<td class='Onb_list' >" + valueToHash + "</td>";
                            }

                        }
                    } .bind(this));
                }
                line = line + "</tr>";
                //  this.TableHtml.down('tbody').insert(line);
                this.PopupHTML.down('[id=day_results]').insert(line);
                this.PopupHTML.down('[id=' + t + ']').observe('click', this._showValue.bind(this, TPROG, row, column));
                t++
            }
        } .bind(this));

        if (!this.tablePeriodShowed) {
            TableKit.Sortable.init($(this.PopupHTML).down("[id=Period_resultsTable_popup]"), { pages: global.paginationLimit, marginL: 100, searchLabel: global.getLabel('search'), noResultsLabel: global.getLabel('noResults') });
            //TableKit.options.autoLoad = false;
            this.tablePeriodShowed = true;
        }
        else {
            TableKit.reloadTable($(this.PopupHTML).down("[id=Period_resultsTable_popup]"));
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
            width: 1030 //530
        });
        this.PeriodPopUp.create();

    },

    /**
    *@description Toggles the recurrence pattern
    *@param {string} pattern Daily ('D'), Weekly ('W') or Monthly ('M')
    */
    _showValue: function(value, row, column) {
        this.PeriodPopUp.close();
        delete this.PeriodPopUp;
        this.virtualHtml.down('[id=text_' + row + '_' + column + ']').setValue(value);
        this.virtualHtml.down('[id=td_' + row + '_' + column + ']').removeClassName('fieldError');
        if (this.getContentPeriod.EWS.o_tabvalues.yglui_str_wid_pwsval.weeks.yglui_str_wid_pwsweek[row - 1]) {
            this.getContentPeriod.EWS.o_tabvalues.yglui_str_wid_pwsval.weeks.yglui_str_wid_pwsweek[row - 1]['@day' + column + ''] = value;
        } else {
            this.getContentPeriod.EWS.o_tabvalues.yglui_str_wid_pwsval.weeks.yglui_str_wid_pwsweek['@day' + column + ''] = value;
        }
        this.virtualHtml.down('[id=error]').update('');
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

    /**
    * Method called when the Pending Xml is received.
    * @param {HTTPResponse} req Response of the AJAX call
    */
    _showGroup: function(group) {

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
            if (area[k]['@fieldid'] == 'MOTPR') {
                area[k]['@value'] = group;
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


    _processExit: function(req) {
        var i = 0;
        //this.loadingMessageDiv.hide();
        if (!Object.isEmpty(req.EWS.o_reqid)) {
            this.reqId = req.EWS.o_reqid;
        }
        var icon = '';
        var status = "<table id='application_period_contain_status'>";
        if (Object.isEmpty(req.EWS.webmessage_type)) {
            if (Object.isEmpty(req.EWS.messages)) {
                var type = '';
                status += "<tr class='application_period_status_line'><td class='application_period_status_label'>" + global.getLabel('Success_Period') + "</td></tr>";
                icon = 'confirmation';
            } else {
                var type = req.EWS.messages.item['@msgty'];
                var message = req.EWS.messages.item['#text'];
                if (type == 'W') {
                    status += "<tr class='application_period_status_line'><td class='application_period_status_label'>" + message + "</td></tr>";
                    icon = 'information';
                } else {
                    status += "<tr class='application_period_status_line'><td class='application_period_status_label'>" + message + "</td></tr>";
                    icon = 'confirmation';
                }
            }
        }
        else {
            var message = req.EWS.webmessage_text;
            var type = req.EWS.webmessage_type
            if (type == 'E') {
                icon = 'exclamation';
                status += "<tr class='application_book_status_line'><td class='application_period_status_label'>" + message + "</td></tr>";
            } else {
                icon = 'confirmation';
                status += "<tr class='application_book_status_line'><td class='application_period_status_label'>" + global.getLabel('Success_Period') + "</td></tr>";
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
        if (type == 'W') {
            var callBack = function() {
                periodStatusPopUp.close();
                delete periodStatusPopUp;

            };
            var callBack2 = function() {
                if (_this) {
                    _this._save('X');
                }
                periodStatusPopUp.close();
                delete periodStatusPopUp;
            };
            var aux2 = {
                idButton: 'Yes',
                label: global.getLabel('yes'),
                handlerContext: null,
                className: 'moduleInfoPopUp_stdButton',
                handler: callBack2,
                type: 'button',
                standardButton: true
            };
            var aux3 = {
                idButton: 'No',
                label: global.getLabel('no'),
                handlerContext: null,
                className: 'moduleInfoPopUp_stdButton',
                handler: callBack,
                type: 'button',
                standardButton: true
            };
            buttonsJson.elements.push(aux2);
            buttonsJson.elements.push(aux3);

        } else {
            var callBack = function() {
                periodStatusPopUp.close();
                delete periodStatusPopUp;
                if (type == 'E') {
                } else {
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
        }

        var ButtonObj = new megaButtonDisplayer(buttonsJson);
        var buttons = ButtonObj.getButtons();
        //insert buttons in div
        contentHTML.insert(buttons);
        var periodStatusPopUp = new infoPopUp({

            closeButton: $H({
                'textContent': 'Close',
                'callBack': callBack

            }),
            htmlContent: contentHTML,
            indicatorIcon: icon,
            width: 350
        });
        periodStatusPopUp.create();


    },

    close: function($super) {
        $super();
        //document.stopObserving('EWS:myCompanies_companySelected', this.onCompanySelected.bindAsEventListener(this)); 

        if (this.fieldPanel)
            this.fieldPanel.destroy();

        /*document.stopObserving('EWS:autocompleterResultSelected_applicationperiodEntryScreen_employeeSelection', this.periodEntryEmployeeSelectedBinding);
        if (this.fieldPanel)
        this.fieldPanel.destroy();*/
        //this.emptyTrainingsIds.clear();
        //this.emptySessionsIds.clear();
        //unattach event handlers
        //document.stopObserving('EWS:employeeColorChanged', this.employeeColorChangedHandlerBinding);
        //document.stopObserving('EWS:cancelperiodingReasonAutocompleter_resultSelected', this.cancelBookingConfBoxButtonBinding);
    }

});



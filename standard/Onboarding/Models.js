/** 
* @fileOverview ModelPool.js 
* @description File containing class ONB. This application is responsible of 
* showing Models.
*/

/**
*@constructor
*@description Class Models. Shows Onboarding Models.
*@augments Application 
*/
var Models = Class.create(Application,
{
    ping: '',
    pingMessage: '',
    letter: 'A',
    letters: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    /**
    * Property to call the service providing the trainings
    * @type XmlDoc
    */
    xmlGetModels: XmlDoc.create(),
    /**
    * Service
    */
    getModelsService: 'GET_MODELS',
    getPingService: 'EOB_PING_DEV',

    initialize: function($super, args) {
        $super(args);
        this._selectRadioBinding = this._selectRadio.bind(this);
        this._modelsLoaded = new Hash();
        this.refreshModelPoolBinding = this._refreshModelPool.bindAsEventListener(this);

    },
    /**
    *@param $super The superclass: Application
    *@param args Arguments coming from previous application
    *@description When the user clicks on the app tag, load the html structure and sets the event observers
    * which have changed.
    */
    run: function($super, args) {
        $super();
        document.observe('EWS:ModelSelected', this._selectRadioBinding);
        document.observe('EWS:refreshModelPool', this.refreshModelPoolBinding);
        //document.observe('EWS:myCompanies_companySelected', this.onCompanySelected.bindAsEventListener(this));
        if (Object.isEmpty(this.Button_footer_model)) { // firstRun

            this.prevApp = args.get('prevApp');
            this.prevTab = args.get('prevTab');
            this.prevView = args.get('prevView');

            var html =
           "<table class='Onb'>"
                    + "<tr><td><div id='company_name' class='Onb_Title application_main_title2'><span>"
                    + global.getCompanyName() + "</span><span class='application_main_soft_text'> "
                    + global.getLabel(global.currentApplication.appId) + "</span></div></td></tr>"
                    + "<tr><td><div id='applicationlistModel_results' style='display: block;'></div></td></tr>"
                    + "<tr><td><div id='alphabet'></div></td></tr>"
                    + "<tr><td><div id='Modelsbutton'></div></td></tr>";
            "</table>"
            this.virtualHtml.insert(html);
            this.virtualHtml.down('[id=applicationlistModel_results]').update('');
            this._displayAlphabet();
            this.ping();
        }
        if (Object.isEmpty(args.get('norefresh'))) {
            this.getModels(this.letter);
        }
    },

    ping: function() {
        // ping 
        var xml = "<EWS>"
                  + "<SERVICE>" + this.getPingService + "</SERVICE>"
                  + "<PARAM/>"
                  + "</EWS>";

        this.makeAJAXrequest($H({ xml: xml,
            successMethod: 'showPing',
            failureMethod: 'showPing', errorMethod: 'showPing', informationMethod: 'showPing'
        }));
    },

    showPing: function(Json) {
        this.ping = Json.EWS.o_ping_ok;
        this.pingMessage = Json.EWS.messages.item['#text'];
    },

    getModels: function() {
        this.xmlGetModels = '<EWS>'
                                    + "<SERVICE>" + this.getModelsService + "</SERVICE>"
                                    + "<OBJECT TYPE=''></OBJECT>"
                                    + "<PARAM>"
                                    + "<ALFA>" + this.letter + "</ALFA>"
                                    + "<APPID>" + global.currentApplication.appId + "</APPID>"
                                    + "<WID_SCREEN>*</WID_SCREEN>"
                                    + "</PARAM>"
                                    + '</EWS>';

        //off line
        //this.method = 'GET';
        //this.url = 'standard/Onboarding/GET_CARS.xml';
        this.makeAJAXrequest($H({ xml: this.xmlGetModels, successMethod: 'processList' }));
    },

    /**
    * Method called when the options Xml is received.
    * @param {HTTPResponse} req Response of the AJAX call
    */
    processList: function(req, id) {
        var html = '';
        //create table
        this._displayTable(req.EWS.o_field_values, req.EWS.o_field_settings.yglui_str_wid_fs_record.fs_fields.yglui_str_wid_fs_field);

        //add buttons
        //first delete old button and add exit
        this.virtualHtml.down('[id=Modelsbutton]').update('');
        var json = {
            elements: [],
            defaultButtonClassName: ''
        };
        var exit = {
            label: global.getLabel('exit'),
            idButton: 'exit_button',
            handlerContext: null,
            handler: this._back.bind(this),
            type: 'button',
            standardButton: true,
            className: 'fieldDispFloatRight Onb_button'
        };
        json.elements.push(exit);
        this.Button_footer_model = new megaButtonDisplayer(json);
        this.virtualHtml.down('[id=Modelsbutton]').insert(this.Button_footer_model.getButtons());
        this.buttonsJson = {
            elements: [],
            defaultButtonClassName: ''
        };
        var className = '';
        var buttonsScreen = req.EWS.o_screen_buttons.yglui_str_wid_button;
        buttonsScreen.each(function(but) {
            if (but) { // && (but['@screen'] == '*' || Object.isEmpty(but['@screen']))) {
                className = 'fieldDispFloatLeft Onb_button';
                if ((but['@okcode'] == 'MOD' || but['@okcode'] == 'COP') && Object.isEmpty(this.key)) {
                    // don't show button
                } else {
                    var aux = {
                        idButton: 'applicationsLayer_button_' + but['@action'],
                        label: but['@label_tag'],
                        className: className,
                        type: 'button',
                        handlerContext: null,
                        standardButton: true,
                        handler: this._openDetails.bind(this, req, but['@tarap'], but['@tartb'], but['@views'], but['@okcode'])
                    };
                    this.buttonsJson.elements.push(aux);
                }
            }
        } .bind(this));
        var buttonsDiv = new megaButtonDisplayer(this.buttonsJson).getButtons();
        this.virtualHtml.down('[id=Modelsbutton]').insert(buttonsDiv);
        if (this.buttonsJson.elements.length == 0)
            buttonsDivContainer.hide();

    },

    /**    
    *@description Goes back to the previous application
    */
    _back: function() {
        global.open($H({ app: { appId: this.prevApp, tabId: this.prevTab, view: this.prevView} }));
    },
    /**    
    *@description Display all models in a table
    */
    _displayTable: function(fieldVal, fieldSet) {
        this.virtualHtml.down('div#applicationlistModel_results').update();
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

        this.TableHtml = new Element('table', { id: 'listModel_resultsTable', className: 'sortable' });
        html = "<thead><tr><th id='Select'>" + global.getLabel('select') + "</th>";
        var sort = '';
        for (i = 0; i < headers.length; i++) {
            objectToArray(fieldSet).each(function(fieldSettings) {
                if (fieldSettings['@fieldid'].toLowerCase() == headers[i]) {
                    var label = !Object.isEmpty(fieldSettings['@fieldlabel']) ? fieldSettings['@fieldlabel'] : global.getLabel(headers[i]);

                    /*if (fieldSettings['@fieldid'].toLowerCase() == 'facto') {
                    html = html + "<th class='table_sortfirstdesc' id='" + headers[i] + "'>" + label + "</th>";
                    } else {
                    html = html + "<th id='" + headers[i] + "'>" + label + "</th>";
                    }*/
                    if (sort == '') {
                        html = html + "<th class='table_sortfirstdesc' id='" + fieldSettings['@fieldid'] + "'>" + label + "</th>";
                        sort = 'X';
                    } else {
                        html = html + "<th id='" + fieldSettings['@fieldid'] + "'>" + label + "</th>";
                    }
                }
            } .bind(this));
        }

        html = html + "</tr></thead><tbody></tbody>";
        this.TableHtml.insert(html);

        var k = 0;
        var checked;
        var max = fieldVal.yglui_str_wid_record.length;
        objectToArray(fieldVal.yglui_str_wid_record).each(function(fieldValues) {
            //debugger;
            if (!Object.isEmpty(fieldValues['@rec_key'])) {
                var onclick = "javascript:document.fire('EWS:ModelSelected', '" + fieldValues['@rec_key'] + "');";
                var selected = fieldValues.contents.yglui_str_wid_content['@selected'];
                if (selected == 'X') {
                    checked = k;
                    this.key = fieldValues['@rec_key'];
                }
                html = '<tr><td class="Onb_list"><input id="radio' + k + '" TYPE="radio" NAME="group" VALUE="Title" onClick ="' + onclick + '" ></input></td>';
                for (i = 0; i < headers.length; i++) {
                    objectToArray(fieldValues.contents.yglui_str_wid_content.fields.yglui_str_wid_field).each(function(field) {
                        if (field['@fieldid'] && field['@fieldid'].toLowerCase() == headers[i]) {
                            var valueToShow = !Object.isEmpty(field['#text']) ? field['#text'] : field['@value'];
                            if (Object.isEmpty(valueToShow)) {
                                valueToShow = '';
                            }
                            var valueToHash = !Object.isEmpty(sapToObject(valueToShow)) ? sapToDisplayFormat(valueToShow) : valueToShow;
                            html = html + "<td class='Onb_list'>" + valueToHash + "</td>";
                        }
                    } .bind(this));
                }
                html = html + "</tr>";
                this.TableHtml.down('tbody').insert(html);

            }
            k++;

        } .bind(this));

        this.virtualHtml.down('div#applicationlistModel_results').insert(this.TableHtml);
        if (!this.tableModelShowed) {
           this.tableModelShowed = true;
            this.tableModelObject = new tableKitWithSearch(this.virtualHtml.down('table#listModel_resultsTable'), { pages: global.paginationLimit, marginL: 100, searchLabel: global.getLabel('search'), noResultsLabel: global.getLabel('noResults') });
       } else {
           this.tableModelObject.reloadTable(this.virtualHtml.down('table#listModel_resultsTable'));
        }
        this.virtualHtml.down('div#listModel_resultsTable_searchBoxDiv').addClassName('Onb');
        if (!Object.isEmpty(checked)) {
            $('radio' + checked).checked = true;
        }
    },

    /**  
    * Save the key of the selected model 
    *@param key, 
    */
    _selectRadio: function(arg) {
        this.key = getArgs(arg);
    },

    /**
    *@description Launches the details app for the selected model
    *@param {JSON} model Object that contains all model info
    */
    _openDetails: function(req, appId, tabId, view, okcode) {
        if (Object.isEmpty(this.ping)) {

            this._pingMessage();

        } else {
            if ((okcode == 'MOD' || okcode == 'COD') && this.key == '') {
                this._notificationMessage(); //information message   
            } else {
                var model;
                if (okcode == 'NEW') {
                    model = '';
                } else {
                    if (Object.isEmpty(this._modelsLoaded.get(this.key))) {
                        model = this._getModel(req, this.key, appId);
                        this._modelsLoaded.set(this.key, model);
                    } else {
                        model = this._modelsLoaded.get(this.key)
                    }

                }
                global.open($H({
                    app: {
                        appId: appId,
                        tabId: tabId,
                        view: view
                    },
                    model: model
                }));
            }
        }
    },

    /**
    * @description Returns an existing event json 
    * @param {JSON} json Model list
    * @param {String} id model's id
    * @returns {Hash} model hash
    */
    _getModel: function(json, id, appId) {
        // Searching model index
        var models = objectToArray(json.EWS.o_field_values.yglui_str_wid_record);
        var modelFound = -1;
        for (var i = 0; (i < models.length) && (modelFound < 0); i++) {
            if (models[i].contents.yglui_str_wid_content['@key_str'] == id)
                modelFound = i;
        }

        // Getting model key
        this.modelKey = models[modelFound]['@rec_key'];
        // Saving event into a hash
        var model = models[modelFound].contents.yglui_str_wid_content.fields.yglui_str_wid_field;
        var modelHash = new Hash();
        for (var i = 0; i < model.length; i++) {
            var index = Object.isEmpty(model[i]['@fieldtechname']) ? model[i]['@fieldid'] : model[i]['@fieldtechname'];
            modelHash.set(index, model[i]);
        }

        // Building screen
        var titleObject = new Object();
        titleObject['#text'] = "";
        titleObject['@all_modifiable'] = "";
        titleObject['@appid'] = appId;
        titleObject['@list_mode'] = "";
        titleObject['@screen'] = 1;
        titleObject['@selected'] = "X";
        titleObject['@label_tag'] = appId + 'Title';
        // Adding buttons
        var recButtonsObject = !Object.isEmpty(models[modelFound].contents.yglui_str_wid_content.buttons) ? models[modelFound].contents.yglui_str_wid_content.buttons.yglui_str_wid_button : new Array();
        //var buttonsObject = [recButtonsObject, appButtonsObject].flatten();
        var buttonsObject = [recButtonsObject].flatten();

        // Adding labels
        var labelsObject = json.EWS.labels;
        // Creating "GET_CONTENT" event
        var contentModel = { o_field_settings: { yglui_str_wid_fs_record: json.EWS.o_field_settings.yglui_str_wid_fs_record }, //appids[appidFound]
            o_field_values: { yglui_str_wid_record: models[modelFound] },
            o_widget_screens: { yglui_str_wid_screen: { yglui_str_wid_screen: titleObject} },
            o_screen_buttons: { yglui_str_wid_button: buttonsObject },
            labels: labelsObject
        };
        contentModel.o_field_settings.yglui_str_wid_fs_record['@screen'] = 1;
        contentModel.o_field_values.yglui_str_wid_record['@screen'] = 1;
        var result = { EWS: contentModel };
        delete result.EWS.o_field_values.yglui_str_wid_record.contents.yglui_str_wid_content.buttons;
        return result;
    },

    _displayAlphabet: function() {
        this.link = {
            elements: []
        };
        var line = '';
        for (var i = 0; i < 26; i++) {
            if (this.letters.substring(i, i + 1) == this.letter) {
                var className = 'getContentLinks megaButtonDisplayer_floatLeft';
            } else {
                var className = 'getContentLinks application_action_link megaButtonDisplayer_floatLeft';
            }
            var aux = {
                label: this.letters.substring(i, i + 1),
                handler: this._getModels.bind(this, i),
                type: 'link',
                idButton: 'alphabet_' + i,
                handlerContext: null,
                className: className
            };
            this.link.elements.push(aux);
        }
        var links = new megaButtonDisplayer(this.link);
        this.virtualHtml.down('div#alphabet').insert(links.getButtons());
    },

    _getModels: function(alfa) {

        this.letter = this.letters.substring(alfa, alfa + 1);
        for (var i = 0; i < 26; i++) {
            this.virtualHtml.down('[id = alphabet_' + i + ']').className = 'getContentLinks application_action_link megaButtonDisplayer_floatLeft';
        }
        this.virtualHtml.down('[id = alphabet_' + alfa + ']').className = 'getContentLinks megaButtonDisplayer_floatLeft';
        this.getModels();
    },

    _refreshModelPool: function() {
        this._modelsLoaded = new Hash();
    },

    _pingMessage: function() {

        var icon = '';
        var status = "<table id='application_car_contain_status'>";
        icon = 'exclamation';
        status += "<tr class='application_book_status_line'><td class='application_car_status_label'>" + this.pingMessage + "</td></tr>";
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
            carStatusPopUp.close();
            delete carStatusPopUp;
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
        var carStatusPopUp = new infoPopUp({

            closeButton: $H({
                'textContent': 'Close',
                'callBack': callBack
            }),
            htmlContent: contentHTML,
            indicatorIcon: icon,
            width: 350
        });
        carStatusPopUp.create();

    },

    close: function($super) {
        $super();
        //document.stopObserving('EWS:myCompanies_companySelected', this.onCompanySelected.bindAsEventListener(this)); 
    }

});


                    
     

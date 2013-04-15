/** 
 * @fileOverview CarPool.js 
 * @description File containing class ONB. This application is responsible of 
 * showing Onboarding choices.
*/

/**
 *@constructor
 *@description Class CARPOOL. Shows Onboarding CAR POOL.
 *@augments Application 
*/
var CARPOOL = Class.create(Application,
{

    /* if we open the application from book/prebook, reload all tables
    * @type Boolean
    */
    //reload: false,

    /* if we select a car we update the key
    * @type Boolean
    */
    key: '',
    vide: null,
    /**
    * Property to call the service providing the trainings
    * @type XmlDoc
    */
    xmlGetList: XmlDoc.create(),
    /**
    * json object with selected object
    * @type json object
    */
    //jsonCar: null,

    /**
    *@param $super The superclass (Application)
    *@description Instantiates the app
    */
    /**
    * Service
    */
    getCarsService: 'GET_CONTENT2',

    initialize: function($super, args) {
        $super(args);
        this._selectRadioBinding = this._selectRadio.bind(this);
        this._carsLoaded = new Hash();
        this.refreshCarPoolBinding = this._refreshCarPool.bindAsEventListener(this);
        //this.employeeColorChangedHandlerBinding = this.employeeColorChangedHandler.bindAsEventListener(this);

    },
    /**
    *@param $super The superclass: Application
    *@param args Arguments coming from previous application
    *@description When the user clicks on the app tag, load the html structure and sets the car observers
    * which have changed.
    */
    run: function($super, args) {
        $super();
        document.observe('EWS:CarSelected', this._selectRadioBinding);
        document.observe('EWS:refreshCarPool', this.refreshCarPoolBinding);
        //document.observe('EWS:myCompanies_companySelected', this.onCompanySelected.bindAsCarListener(this));
        if (Object.isEmpty(this.Button_footer)) { // firstRun

            this.prevApp = args.get('prevApp');
            this.prevTab = args.get('prevTab');
            this.prevView = args.get('prevView');

            var html = "<div id='company_name' class='Onb_Title application_main_title2'><span>"
                    + global.getCompanyName() + "</span><span class='application_main_soft_text'> "
                     + global.getLabel(global.currentApplication.appId) + "</span><br /></div>"
                    + "<div id='applicationlistCar_results' style='display: block;'></div></br>"
                    + "<div id='button'></div>";

            this.virtualHtml.insert(html);
        }

        if (Object.isEmpty(args.get('norefresh'))) {

            this.virtualHtml.down('[id=button]').update('');
            this.virtualHtml.down('[id=applicationlistCar_results]').update('');
            var json = {
                elements: [],
                defaultButtonClassName: ''
            };
            var exit = {
                label: global.getLabel('exit'),
                //label :this.xmlSessions.getElementsByTagName('button')[4].getAttribute('text'),
                idButton: 'exit_button',
                handlerContext: null,
                handler: this._back.bind(this),
                type: 'button',
                standardButton: true,
                className: 'fieldDispFloatRight Onb_button'
            };
            json.elements.push(exit);
            this.Button_footer = new megaButtonDisplayer(json);
            this.virtualHtml.down('[id=button]').insert(this.Button_footer.getButtons());
            this.xmlGetList = '<EWS>'
                                + "<SERVICE>" + this.getCarsService + "</SERVICE>"
                                + "<OBJECT TYPE=''></OBJECT>"
                                + "<PARAM>"
                                + "<APPID>" + global.currentApplication.appId + "</APPID>"
                                + "<WID_SCREEN>*</WID_SCREEN>"
                                + "</PARAM>"
                                + '</EWS>';

            //off line
            //this.method = 'GET';
            //this.url = 'standard/Onboarding/GET_CARS.xml';
            this.makeAJAXrequest($H({ xml: this.xmlGetList, successMethod: 'processList' }));
        }
    },


    /**
    * Method called when the options Xml is received.
    * @param {HTTPResponse} req Response of the AJAX call
    */
    processList: function(req, id) {
        //this.jsonHash = this._getCarHash(req);
        var html = '';
        //var message = req.EWS.messages; 

        //find settings
        /*  var appids = objectToArray(req.EWS.o_field_settings.yglui_str_wid_fs_record);
        var appidFound = -1;
        for (var i = 0; (i < appids.length) && (appidFound < 0); i++) {
        var atribs = objectToArray(appids[i].fs_fields.yglui_str_wid_fs_field);
        for (var j = 0; (j < atribs.length) && (appidFound < 0); j++) {
        if (atribs[j]['@fieldid'] == 'APPID') {
        if (atribs[j]['@default_value'] == 'CARPOOL')
        appidFound = i;
        j = atribs.length;
        }
        }
        }*/
        //create table
        //this._displayTable(req.EWS.o_field_values, appids[appidFound].fs_fields.yglui_str_wid_fs_field);
        this._displayTable(req.EWS.o_field_values, req.EWS.o_field_settings.yglui_str_wid_fs_record.fs_fields.yglui_str_wid_fs_field);

        //add buttons 
        this.buttonsJson = {
            elements: [],
            defaultButtonClassName: ''
        };
        var className = '';
        var buttonsScreen = req.EWS.o_screen_buttons.yglui_str_wid_button;
        buttonsScreen.each(function(but) {
            if (but) { // && (but['@screen'] == '*' || Object.isEmpty(but['@screen']))) {
                if (but['@action'].include('MODEL')) {
                    className = 'fieldDispFloatRight Onb_button';
                    var aux = {
                        idButton: 'applicationsLayer_button_' + but['@action'],
                        label: but['@label_tag'],
                        className: className,
                        type: 'button',
                        handlerContext: null,
                        standardButton: true,
                        handler: this._openModels.bind(this, req, but['@tarap'], but['@tartb'], but['@views'], but['@okcode'])
                    };
                    this.buttonsJson.elements.push(aux);
                } else {
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
            }
        } .bind(this));
        var buttonsDiv = new megaButtonDisplayer(this.buttonsJson).getButtons();
        //var buttonsDivContainer = new Element('div', { 'id': 'applicationsLayer', 'class': 'fieldDispTotalWidth fieldDispFloatRight' });
        //buttonsDivContainer.insert(buttonsDiv);
        //this.virtualHtml.down('[id=button]').insert(buttonsDivContainer);
        this.virtualHtml.down('[id=button]').insert(buttonsDiv);
        if (this.buttonsJson.elements.length == 0)
            buttonsDivContainer.hide();

    },


    /**    
    *@description Goes back to the previous application
    */
    _back: function() {
        global.open($H({ app: { appId: this.prevApp, tabId: this.prevTab, view: this.prevView} }));
    },

    _displayTable: function(fieldVal, fieldSet) {
        this.virtualHtml.down('div#applicationlistCar_results').update('');
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

        this.TableHtml = new Element('table', { id: 'listCar_resultsTable', className: 'sortable' });
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
                var onclick = "javascript:document.fire('EWS:CarSelected', '" + fieldValues['@rec_key'] + "');";
                var selected = fieldValues.contents.yglui_str_wid_content['@selected'];
                if (selected == 'X') {
                    checked = k;
                    this.key = fieldValues['@rec_key'];
                }
                html = '<tr><td class="Onb_list"><input id="radio' + k + '" TYPE="radio" NAME="group" VALUE="Title" onClick ="' + onclick + '" ></input></td>';
                //onClick='this._selectRadio("+ fieldValues['@rec_key']+")'
                for (i = 0; i < headers.length; i++) {
                    objectToArray(fieldValues.contents.yglui_str_wid_content.fields.yglui_str_wid_field).each(function(field) {
                        if (field['@fieldid'] && field['@fieldid'].toLowerCase() == headers[i]) {
                            var valueToShow = !Object.isEmpty(field['#text']) ? field['#text'] : field['@value'];
                            if (Object.isEmpty(valueToShow)) {
                                valueToShow = '';
                            }
                            var valueToHash = !Object.isEmpty(sapToObject(valueToShow)) ? sapToDisplayFormat(valueToShow) : valueToShow;
                            html = html + "<td class='Onb_list' >" + valueToHash + "</td>";
                        }
                    } .bind(this));
                }
                html = html + "</tr>";
                this.TableHtml.down('tbody').insert(html);

            }
            k++;

        } .bind(this));

        this.virtualHtml.down('div#applicationlistCar_results').insert(this.TableHtml);
        if (!this.tableCarShowed) {
            this.tableCarShowed = true;
            this.tableCarObject = new tableKitWithSearch(this.virtualHtml.down('table#listCar_resultsTable'), { pages: global.paginationLimit, marginL: 100, searchLabel: global.getLabel('search'), noResultsLabel: global.getLabel('noResults') });
        } else {
            this.tableCarObject.reloadTable(this.virtualHtml.down('table#listCar_resultsTable'));
        }
        //var search = this.virtualHtml.down('div#listCar_resultsTable_searchBoxDiv').innerHTML;
        //search = "<span class='Onb_search'>" + global.getLabel('Search') + "  </span>" + search;
        //this.virtualHtml.down('div#listCar_resultsTable_searchBoxDiv').update(search);
        this.virtualHtml.down('div#listCar_resultsTable_searchBoxDiv').addClassName('Onb');
        if (!Object.isEmpty(checked)) {
            //this.TableHtml.down('[id=radio' + checked + ']').checked = true;
            $('radio' + checked).checked = true;
            //this.TableHtml.down('[id=radio' + checked + ']').selected = true;
        }
    },

    /**  
    *@param key, 
    */
    _selectRadio: function(arg) {
        this.key = getArgs(arg);
    },

    /**
    *@description Shows an information box when we are going to change a car
    */
    _notificationMessage: function() {
        var contentHTML = new Element('div');
        contentHTML.insert(global.getLabel("not_selected "));
        // Buttons
        var buttonsJson = {
            elements: [],
            mainClass: 'moduleInfoPopUp_stdButton_div_left'
        };
        var callBack = function() {
            CarPoolPopUp.close();
            delete CarPoolPopUp;
        };
        var aux = {
            idButton: 'Ok',
            label: global.getLabel('ok'),
            handlerContext: null,
            className: 'moduleInfoPopUp_stdButton',
            handler: callBack,
            type: 'button',
            standardButton: true
        };
        buttonsJson.elements.push(aux);
        var ButtonObj = new megaButtonDisplayer(buttonsJson);
        var buttons = ButtonObj.getButtons();
        // Insert buttons in div
        contentHTML.insert(buttons);
        var CarPoolPopUp = new infoPopUp({
            closeButton: $H({
                'textContent': 'Close',
                'callBack': function() {
                    CarPoolPopUp.close();
                    delete CarPoolPopUp;
                }
            }),
            htmlContent: contentHTML,
            indicatorIcon: 'information',
            width: 350
        });
        CarPoolPopUp.create();
    },
    /**
    *@description Launches the details app for the selected car
    *@param {JSON} car Object that contains all car info
    */
    _openDetails: function(req, appId, tabId, view, okcode) {

        if ((okcode == 'MOD' || okcode == 'COD') && this.key == '') {
            this._notificationMessage(); //information message   
        } else {
            var car;
            if (okcode == 'NEW') {
                car = '';
            } else {
                if (Object.isEmpty(this._carsLoaded.get(this.key))) {
                    car = this._getCar(req, this.key, appId);
                    this._carsLoaded.set(this.key, car);
                } else {
                    car = this._carsLoaded.get(this.key)
                }

            }
            global.open($H({
                app: {
                    appId: appId,
                    tabId: tabId,
                    view: view
                },
                car: car
                //carCodes: this.carCodes
            }));
        }
    },

    /**
    *@description Launches the details app for the selected car
    *@param {JSON} car Object that contains all car info
    */
    _openModels: function(req, appId, tabId, view, okcode) {

        global.open($H({
            app: {
                appId: appId,
                tabId: tabId,
                view: view
            },
            prevApp: global.currentApplication.appId,
            prevTab: global.currentApplication.tabId,
            prevView: global.currentApplication.view
        }));
    },
    /**
    * @description Returns an existing car json (used by timeEntryScreen app)
    * @param {JSON} json Car list
    * @param {String} id Car's id
    * @returns {Hash} Car hash
    */
    _getCar: function(json, id, appId) {
        // Searching car index
        var cars = objectToArray(json.EWS.o_field_values.yglui_str_wid_record);
        var carFound = -1;
        for (var i = 0; (i < cars.length) && (carFound < 0); i++) {
            if (cars[i].contents.yglui_str_wid_content['@key_str'] == id)
                carFound = i;
        }

        // Getting car key
        this.carKey = cars[carFound]['@rec_key'];
        // Saving car into a hash
        var car = cars[carFound].contents.yglui_str_wid_content.fields.yglui_str_wid_field;
        var carHash = new Hash();
        for (var i = 0; i < car.length; i++) {
            var index = Object.isEmpty(car[i]['@fieldtechname']) ? car[i]['@fieldid'] : car[i]['@fieldtechname'];
            carHash.set(index, car[i]);
        }

        // its structure
        /*  var appids = objectToArray(json.EWS.o_field_settings.yglui_str_wid_fs_record);
        var appidFound = -1;
        for (var i = 0; (i < appids.length) && (appidFound < 0); i++) {
        var atribs = objectToArray(appids[i].fs_fields.yglui_str_wid_fs_field);
        for (var j = 0; (j < atribs.length) && (appidFound < 0); j++) {
        if (atribs[j]['@fieldid'] == 'APPID') {
        if (atribs[j]['@default_value'] == appId)
        appidFound = i;
        j = atribs.length;
        }
        }
        }*/
        // Changing hour format/value (if needed)
        /*   if (carHash.get('BEGUZ')) {
        if (Object.isEmpty(carHash.get('BEGUZ')['@value']))
        carHash.get('BEGUZ')['@value'] = '00:00:00';
        }
        if (carHash.get('ENDUZ')) {
        if (Object.isEmpty(carHash.get('ENDUZ')['@value']))
        carHash.get('ENDUZ')['@value'] = '00:00:00';
        }*/

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
        var recButtonsObject = !Object.isEmpty(cars[carFound].contents.yglui_str_wid_content.buttons) ? cars[carFound].contents.yglui_str_wid_content.buttons.yglui_str_wid_button : new Array();
        /* for (var i = 0; i < recButtonsObject.length; i++) {
        if (Object.isEmpty(recButtonsObject[i]['@screen']))
        recButtonsObject[i]['@screen'] = '*';
        }*/
        /* var appButtonsObject = new Array();
        if (recButtonsObject.length == '0') {
        if (json.EWS.o_screen_buttons) {
        var appButtons = objectToArray(json.EWS.o_screen_buttons.yglui_str_wid_button);
        for (var l = 0; l < appButtons.length; l++) {
        if (appButtons[l]['@tarap'] == appId) {
        appButtonsObject.push(appButtons[l]);
        //appButtons[l]['@label_tag'] = global.getLabel('SAVE');
        }
        }
        }
        }*/
        //var buttonsObject = [recButtonsObject, appButtonsObject].flatten();
        var buttonsObject = [recButtonsObject].flatten();
        //var buttonsObject = [appButtonsObject].flatten();

        // Adding labels
        var labelsObject = json.EWS.labels;
        // Creating "GET_CONTENT" car
        var contentCar = { o_field_settings: { yglui_str_wid_fs_record: json.EWS.o_field_settings.yglui_str_wid_fs_record }, //appids[appidFound]
            o_field_values: { yglui_str_wid_record: cars[carFound] },
            o_widget_screens: { yglui_str_wid_screen: { yglui_str_wid_screen: titleObject} },
            o_screen_buttons: { yglui_str_wid_button: buttonsObject },
            labels: labelsObject
        };
        contentCar.o_field_settings.yglui_str_wid_fs_record['@screen'] = 1;
        contentCar.o_field_values.yglui_str_wid_record['@screen'] = 1;
        var result = { EWS: contentCar };
        delete result.EWS.o_field_values.yglui_str_wid_record.contents.yglui_str_wid_content.buttons;
        return result;
    },

    _refreshCarPool: function() {
        this._carsLoaded = new Hash();
    },

    close: function($super) {
        $super();
        //document.stopObserving('EWS:myCompanies_companySelected', this.onCompanySelected.bindAsCarListener(this)); 
    }

});


                    
     
/**
 *@fileOverview widgets_Overview.js
 *@description It contains the PCR overview class and its methods
 */
/**
 *@constructor
 *@description Class with general functionality for the PCR Overview class
 *@augments Application
 */
var _this = null;

var WidgetsOverview = Class.create(origin,
{
    /** 
    * Service used to get the widgets
    * @type String
    */
    widgetsService: 'GET_WIDGETS',

    /** 
    * Id of the tab.
    * @type String
    */
    tabId: '',

    empId: '',

    planId: '',

    virtualHtml: null,
    widgetsStructure: null,
    firstRun: null,

    _elementsStorage: null,
    _addButtons: null,
    _globalButtonsContainer: null,

    /**
    *@param $super The superclass
    *@param args The app
    *@description Instantiates the app
    */
    initialize: function($super, args) {

        $super('widgetsOverview');
        _this = this;
    },

    run: function() {
    },

    /**
    * @param args The app
    * @param $super The superclass run method
    * @description Executes the super class run method    
    */
    getContent: function(appid, pernr, plan) {
        this.tabId = appid;
        this.empId = pernr;
        this.planId = plan;
        
        this.virtualHtml = new Element('div', { 'id': 'sitePageScreen_div',
            'class': 'applications_container_div'
        });
        this.createHtml();

        this._elementsStorage = new Hash();
        this._addButtons = new Hash();
        this._selectedScreens = $H();


        this.widgetsReadyBinding = this.fillWidgets.bind(this);
        document.observe('WO:widgetsReady' + this.tabId, this.widgetsReadyBinding);

        this.loadWidgets();

        return this.virtualHtml;
    },

    /**
    *@description creates the general sctructure and calls to the module which load the widgets
    */
    createHtml: function() {
        //alert('createHtml');

        var mainPElement = new Element('div', {
            'id': 'WO_widgets_' + this.tabId,
            'class': 'WO_widgetsDiv',
            'width': '800px'
        });

       $(mainPElement).setStyle({
         width: '750px'
       });
           
        this.virtualHtml.insert(mainPElement)

        // This does not work in IE6,7,8 - outside of DOM, style is picked just ones.
        //this.virtualHtml.insert(new Element('div', {
        //    'id': 'WO_widgets_' + this.tabId,
        //    'class': 'WO_widgetsDiv'
        //}));


        /******* Select user ********/
        this.warningmsg = new Element('div', {
            id: 'WO_noESS_' + this.tabId,
            'class': 'WO_infoMessage'
        }).update(global.getLabel('noESSselected'));
        this.virtualHtml.insert(this.warningmsg);
        this._globalButtonsContainer = new Element('div');
        this.virtualHtml.insert(this._globalButtonsContainer);
    },

    fillWidgets: function() {
        //alert('fillWidgets');
        this.warningmsg.hide();

        this.hashOfWidgets = this.widgetsStructure.widgets;
        //get the appId of Pending Request widget
        var appIdPendReq = '';
        var data = this.widgetsStructure.widgetsInfo;

        //fill each widget
        this.hashOfWidgets.each(function(pair) {
            //Pending Request widget
            if (pair[0] == appIdPendReq)
                new PendingRequestContent(this.virtualHtml, this.hashOfWidgets, this.empId, pair[0], this.tabId, this.firstRun);
            else
                if (appIdPendReq == 'KPI')
                new frame(this.virtualHtml, this.hashOfWidgets, pair[0], this.firstRun)
            else
                this.fillGenericWidget(pair);
        } .bind(this));
        this.firstRun = false;
    },

    /**
    *@description Method which call the GetWidgets module
    */
    loadWidgets: function() {
        if (this.widgetsStructure == null) {
            this.widgetsStructure = new GetWidgets({
                eventName: 'WO:widgetsReady' + this.tabId,
                service: this.widgetsService,
                tabId: this.tabId,
                objectType: global.objectType, //this.objectType,
                objectId: this.empId,
                target: this.virtualHtml.down('div#WO_widgets_' + this.tabId)
            });
        }
        else if (!Object.isEmpty(this.virtualHtml) && !Object.isEmpty(this.widgetsStructure) && !Object.isEmpty(this.widgetsStructure.virtualHtml)) {
            this.widgetsStructure.reloadWidgets({
                objectType: this.objectType,
                objectId: this.empId
            });
            this.virtualHtml.down('div#WO_widgets_' + this.tabId).show();
        }
    },
    
    /**
    *@description Method to fill the Pending Request Widget
    */
    fillGenericWidget: function(pair) {
        //alert('fillGenericWidget...' + pair.key);
        pair.value.setContent('Loading...');
        this._getWidgetContent(pair.key);
    },


    /**
    * @description Gets the widgets content
    * @param appId The widget ID
    */
    _getWidgetContent: function(appId, widScreen, selectedIndex) {

        if (!widScreen)
            widScreen = '1';

        var xml = '';
        if (appId == 'COM_GLDT') {
            xml = "<EWS>"
        + "<SERVICE>GET_CONTENT_B</SERVICE>"
        + "<OBJECT TYPE='P'>" + this.empId + "</OBJECT>"
        + "<PARAM>"
        + "<APPID>" + appId + "</APPID>"
        + "<WID_SCREEN>1</WID_SCREEN>" +
        "<SUBTYPE>" + this.planId + "</SUBTYPE>"
        + "</PARAM>"
        + "</EWS>";
        }
// SARH does not need additional parameters - TODELETE
//        else {
//            if (appId == 'COM_SARH') {
//                xml = "<EWS>"
//                + "<SERVICE>GET_CONTENT_B</SERVICE>"
//                + "<OBJECT TYPE='P'>" + this.empId + "</OBJECT>"
//                + "<PARAM>"
//                + "<APPID>" + appId + "</APPID>"
//                + "<WID_SCREEN>1</WID_SCREEN>"
//                + "<SUBTYPE>1</SUBTYPE>"
//                + "</PARAM>"
//                + "</EWS>";
//            }
            else {
            // For other widgets use GET_CONTENT
            xml = "<EWS>"
        + "<SERVICE>GET_CONTENT</SERVICE>"
        + "<OBJECT TYPE='P'>" + this.empId + "</OBJECT>"
        + "<PARAM>"
        + "<APPID>" + appId + "</APPID>"
        + "<WID_SCREEN>1</WID_SCREEN>"
        + "</PARAM>"
        + "</EWS>";
        }
//        }
        //Requesting the data
        this.makeAJAXrequest($H({
            xml: xml,
            successMethod: '_parseWidgetContent',
            ajaxID: widScreen + ' ' + appId + ' ' + (selectedIndex ? selectedIndex : '')
        }));
    },

    _actionButtonPressed: function() {

    },

    /**
    * @description Parses the widget content service
    * @param xml The XML out
    * @param appId The identificator of the AJAX call
    */
    _parseWidgetContent: function(JSON, data) {
        //alert('_parseWidgetContent');
        data = data.split(' ');
        var appId = data[1];

        var widScreen = data[0];
        var selectedPanel = data[2];
        this._selectedScreens = $H();
        if (this._elementsStorage.get(appId + '_' + widScreen))
            this._elementsStorage.unset(appId + '_' + widScreen);
        if (!this._elementsStorage.get(appId + '_' + widScreen)) {
            this._elementsStorage.set(appId + '_' + widScreen, $H({
                fieldPanel: null,
                screenNavigation: null,
                contentContainer: null,
                json: null,
                records: new Array()
            }));
        }
        this._elementsStorage.get(appId + '_' + widScreen).set('json', deepCopy(JSON));
        var listMode = false;
        if (JSON.EWS.o_widget_screens)
            objectToArray(JSON.EWS.o_widget_screens.yglui_str_wid_screen).each(function(item) {
                if ((item['@screen'] == widScreen) && (item['@list_mode'] == 'X')) listMode = true;
            });
        document.stopObserving('EWS:woChange_' + this.tabId + '_' + appId);
        //Creating the fieldsPanel
        var panel;
        if (!listMode) {
            panel = new fieldsPanel({
                appId: appId,
                mode: 'display',
                json: this._elementsStorage.get(appId + '_' + widScreen).get('json'),
                event: 'EWS:woChange_' + this.tabId + '_' + appId,
                noResultsHtml: '<span class="application_main_soft_text">' + global.getLabel('noRecords') + '</span>',
                paiEvent: 'EWS:paiEvent_' + appId + '_' + widScreen,
                validForm: 'EWS:validFormHandler_' + appId + '_' + widScreen
            });
            if (selectedPanel != "" && selectedPanel != "undefined" && selectedPanel != 0)
                panel.goTo(selectedPanel);
        }
        else 
            panel = new GenericMultipleRecordsFieldsPanel({
                appId: appId,
                json: this._elementsStorage.get(appId + '_' + widScreen).get('json'),
                event: 'EWS:woChange_' + this.tabId + '_' + appId,
                noResultsHtml: '<span class="application_main_soft_text">' + global.getLabel('noRecords') + '</span>'
            }, this, selectedPanel, widScreen);
                       
            //Creating the widget screens
            var widgetScreens;
            //Going througt all the record and storing them on an array
            if (JSON.EWS.o_field_values) {
                var reg = JSON.EWS.o_field_values.yglui_str_wid_record;
                reg = objectToArray(reg);
                $A(reg).each(function(item) {
                    $A(item.contents.yglui_str_wid_content).each(function(record) {
                        this._elementsStorage.get(appId + '_' + widScreen).get('records').push(record);
                    } .bind(this));
                } .bind(this));
            }

            //Setting the generated content on the widget
            var widgetContentContainer = new Element('div', {
                'class': 'WO_contentContainer'
            });

            this.hashOfWidgets.get(appId).setContent('');
            if (widgetScreens)
                this.hashOfWidgets.get(appId).getContentElement().insert(widgetScreens);
            this.hashOfWidgets.get(appId).getContentElement().insert(panel.getElement());

            this._elementsStorage.get(appId + '_' + widScreen).set('contentContainer', this.hashOfWidgets.get(appId).getContentElement());
            //Storing the panel for this widget
            this._elementsStorage.get(appId + '_' + widScreen).set('fieldPanel', panel);
    },

    _actionButtonPressed: function() {

    },

    /**
    * @description Creates the widgets screens
    * @param json The JSON
    */
    _generateWidgetScreens: function(json, appId, widScreen) {

        //alert('_generateWidgetScreens');
        var tmpLabelsHash = new Hash();
        if (json.EWS.labels)
            objectToArray(json.EWS.labels.item).each(function(item) {
                tmpLabelsHash.set(item['@id'], item['@value']);
            });
        var navigationContainer = new Element('div');
        //Getting the widget screens
        var screens = json.EWS.o_widget_screens;

        if (!Object.isEmpty(screens)) {
            //Iterating over the screens array
            $A(screens.yglui_str_wid_screen).each(function(pair, i) {
                var element = new Element('div', {
                    'class': 'applicationmyData_navigationMenuItem'
                });
                element.insert('<span class="application_action_link">' + (tmpLabelsHash.get(pair['@label_tag']) != undefined ? tmpLabelsHash.get(pair['@label_tag']) : pair['@label_tag']) + '</span>');
                pair['@element'] = element;
                element.observe('click', this._refreshWidgetScreens.bind(this, screens, i, appId));
                navigationContainer.insert(element);
                if (pair['@selected'] == 'X' && !this._selectedScreens.get(appId + widScreen, i)) {
                    element.down().removeClassName('application_action_link');
                    element.down().addClassName('application_text_bolder');
                } else if (pair['@selected'] == 'X' && this._selectedScreens.get(appId + widScreen, i) && (i == this._selectedScreens.get(appId + widScreen, i))) {
                    element.down().removeClassName('application_action_link');
                    element.down().addClassName('application_text_bolder');
                }

            } .bind(this));
            this._elementsStorage.get(appId + '_' + widScreen).set('screenNavigation', navigationContainer);
            return navigationContainer;
        }
        else
            return null;
    },

    /**
    * @description Refresh the widget screen
    */
    _refreshWidgetScreens: function() {
        var args = $A(arguments);
        var screens = args[0];
        var i = args[1];
        var appId = args[2];
        $A(screens.yglui_str_wid_screen).each(function(pair, iteration) {
            if (pair['@element'] != null) {
                if (iteration == i) {
                    this._selectedScreens.set(appId + pair['@screen'], iteration);
                    if (pair['@element'].down() != null) {
                        this._getWidgetContent(pair['@appid'], pair['@screen']);
                    }
                }
            }
        } .bind(this));
    },
    /**
    *@param $super The superclass: Application
    *@description Closes the application
    */
    close: function($super) {
        $super();
        document.stopObserving('WO:widgetsReady' + this.tabId, this.widgetsReadyBinding);
    }
});

var GenericMultipleRecordsFieldsPanel = Class.create(SimpleTable, {
    _json: null,
    _appId: null,
    _event: null,
    _element: null,
    _parentClass: null,
    _fieldsPanels: null,
    _selectedPanel: null,
    currentlySelected: 0,
    initialize: function($super, options, parentClass, selectedPanel, widScreen) {
        this._selectedPanel = selectedPanel;
        this._json = options.json;
        this._appId = options.appId;
        this._fieldsPanels = new Hash();
        this._widScreen = widScreen;
        //$super();
        this._parentClass = parentClass;
        if (this._json.EWS.o_field_values)
            $super(this.createContent(), {
                typeLink: true
            });
        else
            this._element = '<div style="clear:both;"></div><span>' + options.noResultsHtml + '</span>';
    },

    createContent: function() {
        //alert('createContent');
        var tableData = {
            header: [],
            rows: $H()
        };
        var tmpHeader = [];
        var headerIds = new Hash();
        //Getting the header
        this.setLabels();
        $A(this._json.EWS.o_field_settings.yglui_str_wid_fs_record.fs_fields.yglui_str_wid_fs_field).each(function(item) {
            if (item['@fieldtype'] == 'H') {
                tmpHeader.push({
                    text: item['@fieldlabel'] == null ? this.labels.get(item['@fieldid']) : item['@fieldlabel'],
                    id: item['@fieldid'],
                    seqnr: item['@seqnr']
                });
                headerIds.set(item['@fieldid'], item['@seqnr']);
            }
        } .bind(this));

        //Sorting the header by seqnr
        this._sortArray(tmpHeader);
        tableData.header = tmpHeader;
        $A(objectToArray(this._json.EWS.o_field_values.yglui_str_wid_record)).each(function(record, i) {
            var tmpData = [];
            if (this._selectedPanel === i)
                record.contents.yglui_str_wid_content['@selected'] = 'X';
            else
                record.contents.yglui_str_wid_content['@selected'] = '';
            var tmpJson = deepCopy(this._json);
            tmpJson.EWS.o_field_values.yglui_str_wid_record = objectToArray(tmpJson.EWS.o_field_values.yglui_str_wid_record)[i];
            this._sortArray(tmpData);
            var panel = new fieldsPanel({
                appId: this._appId,
                mode: 'display',
                json: tmpJson,
                event: 'EWS:owChange_' + this._parentClass.tabId + '_' + this._appId,
                noResultsHtml: '<span class="application_main_soft_text">' + global.getLabel('noRecords') + '</span>',
                paiEvent: 'EWS:paiEvent_' + this._appId + '_' + this._widScreen,
                validForm: 'EWS:validFormHandler_' + this._appId + '_' + this._widScreen
            });
            objectToArray(record.contents.yglui_str_wid_content).last().fields.yglui_str_wid_field.each(function(content, j) {
             if (headerIds.get(content['@fieldid']) != undefined) {
                var auxText = (!Object.isEmpty(content['#text'])) ? content['#text'] : content['@value'];
                
                if (!Object.isEmpty(panel.getFieldInfo(content['@fieldid'])) && (panel.getFieldInfo(content['@fieldid'])['@type'] == 'DATS')) {   
                    auxText = (!Object.isEmpty(auxText)) ? sapToDisplayFormat(auxText) : '';
                }
                tmpData.push({
                    text: auxText != null ? auxText : '',
                    id: '',
                    seqnr: headerIds.get(content['@fieldid'])
                });   
                } 
            } .bind(this));
            
            this._sortArray(tmpData);
            if (!Object.isEmpty(tmpData[0]) && (tmpData[0].text == ''))
                tmpData[0].text = global.getLabel('viewDetails');
            tableData.rows.set('row' + i, {
                data: tmpData,
                element: panel.getElement()
            });
            var index = objectToArray(record.contents.yglui_str_wid_content).last()['@rec_index'];

            this._fieldsPanels.set(index, panel);
            if (!this.currentlySelected)
                this.currentlySelected = index;
        } .bind(this));

        return tableData;
    },
    setLabels: function() {
        this.labels = new Hash();
        if (!Object.isEmpty(this._json) && !Object.isEmpty(this._json.EWS.labels) && !Object.isEmpty(this._json.EWS.labels.item)) {
            objectToArray(this._json.EWS.labels.item).each(function(label) {
                if (!Object.isEmpty(label['@id']))
                    this.labels.set(label['@id'], label['@value']);
            } .bind(this));
        }
    },
    changeToEditMode: function(panel) {
        this._fieldsPanels.get(panel).changeToEditMode();
        this.currentlySelected = panel;
        return this._fieldsPanels.get(panel);
    },
    getCurrentPanel: function(panel) {
        this.currentlySelected = panel;
        return this._fieldsPanels.get(panel);
    },
    getFieldPanels: function() {
        return this._fieldsPanels;
    },
    _sortArray: function(array) {
        var k;
        for (var i = 0; i < array.length; i++) {
            k = i;
            for (var j = i + 1; j < array.length; j++) {
                if (parseInt(array[j].seqnr, 10) < parseInt(array[k].seqnr, 10)) {
                    var tmp = array[k];
                    array[k] = array[j];
                    array[j] = tmp;
                    k = j - 1;
                }

            }
        }
        return array;
    },
    _toggleContentElement: function() {
        var args = $A(arguments);
        args[0].toggle();
        if (args[1].hasClassName('application_verticalR_arrow')) {
            args[1].removeClassName('application_verticalR_arrow');
            args[1].addClassName('application_down_arrow');
        }
        else {
            args[1].removeClassName('application_down_arrow');
            args[1].addClassName('application_verticalR_arrow');
        }
    },
    destroy: function() {
    }
});

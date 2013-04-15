/** 
 * @fileOverview PFM_Dashboard.js 
 * @description File containing class APPR. This class is the one used to run PFM_Dashboard application
 * This application shows the user dashboard, where the user can navigate to specific screens.
*/ 

/**
 *@constructor
 *@description Class PFM_Dashboard.
 *@augments PFM_parent 
*/
var PFM_Dashboard = Class.create(PFM_parent,
/** 
*@lends PFM_Dashboard
*/
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
    tabId: 'PFM_IOV', 
    /**
    * Service used to get the content
    * @type String
    */
    getContentService: 'GET_CONTENT2',
    /**
    * Service used to get save the widget
    * @type String
    */
    saveRequestService: 'SAVE_REQUEST',
    
    _elementsStorage: null,
    /**
     *@param $super The superclass (Application)
     *@description Instantiates the app
     */       
    initialize: function($super, args) {
	    $super(args);	
	    this._elementsStorage = new Hash();
		this.widgetsReadyBinding = this.widgetsReady.bind(this);
	},
    /**
     *@param $super The superclass: Application
     *@description when the user clicks on the app tag, load the html structure and sets the event listeners
     */		
    run:function($super, args){
	    $super(args);       
        if (this.firstRun) {
			this.createHtml();
		}	
        if (args) {
            if (args.get('refresh') == 'X'){
            this.empId = this.getSelectedEmployees().keys()[0];
            this.loadWidgets();
            }	
        }  			
		document.observe('PFM:DashBoardWidgetsReady',this.widgetsReadyBinding); 	    
	},
    /**
     *@param $super The superclass: Application
     *@description Closes the application
     */		
	close:function($super){
	    $super();  
	    document.stopObserving('PFM:DashBoardWidgetsReady',this.widgetsReadyBinding); 	    
	},
     /**   
     *@description creates the general sctructure and calls to he module which load the widgets
     */		
	createHtml: function(){	
	    //create the div for the LEGEND
        var PFM_DashboardLegend = new Element('div', {
            'id': 'PFM_Dashboard_LegendDiv',
            'class': 'PFM_DashboardLegend'          
        });
        //we create the legend                                     
	    var legendJSON = { 
            legend: [
                { img: "application_emptyBubble", text: global.getLabel('notDone') },
                { img: "application_icon_green", text: global.getLabel('completed') },
                { img: "application_icon_orange", text: global.getLabel('warning') },
                { img: "application_icon_red", text: global.getLabel('GAP_ANAL') }
                
            ],
            showLabel: global.getLabel('showLgnd'),
            hideLabel: global.getLabel('closeLgnd')
        };
        var legendHTML = getLegend(legendJSON);
        this.virtualHtml.insert(PFM_DashboardLegend);
        PFM_DashboardLegend.update(legendHTML);
        this.virtualHtml.down('div#PFM_Dashboard_LegendDiv').hide();
		this.virtualHtml.insert(new Element('div',{'id':'PFM_widgets','class':'PFM_widgetsDiv'}));
		/******* Select user ********/ 
	    this.warningmsg = new Element ('div',{
            id: 'PFM_noESS',
            'class': 'PFM_infoMessage'
        }).update(global.getLabel('noESSselected'));
        this.virtualHtml.insert(this.warningmsg);	  		
	},
     /**   
     *@description Method which call the GetWidgets module
     */		
    loadWidgets: function(){
		document.stopObserving('EWS:widgetInformationChanged_' + this.tabId);
		if(this.widgetsStructure == null && (this.firstRun)){
		    this.widgetsStructure = new GetWidgets({
			    eventName: 'PFM:DashBoardWidgetsReady',
			    service: this.widgetsService,
			    tabId: this.tabId,
		        objectType: this.objectType,
			    objectId: this.empId,				
			    target: this.virtualHtml.down('div#PFM_widgets')
		    });	
		}
		else if (!Object.isEmpty(this.virtualHtml) && !Object.isEmpty(this.widgetsStructure) && !Object.isEmpty(this.widgetsStructure.virtualHtml)) { 
		        this.widgetsStructure.reloadWidgets ({
		        objectType: this.objectType,
			    objectId: this.empId				
		});
		
		this.virtualHtml.down('div#PFM_widgets').show();

		}	
		this.virtualHtml.down('div#PFM_Dashboard_LegendDiv').show();			    
    }, 	
     /**  
     *@param event The event 'DashBoardWidgetsReady'
     *@description When the event is launched, meaning that we have received the widgets, we start working with them
     */	    
	widgetsReady: function(event){
        //create a widget structure to manage them
		this.hashOfWidgets = this.widgetsStructure.widgets;
	    this.hashOfWidgets.each(function(widget){ 
	    widget.value.setTitle(global.getLabel(widget.key));
        this.callToGetContent(widget.key);
	    }.bind(this)); 		
	},
     /**  
     *@param appId The appId of a certaing widget
     *@description Calls SAP to get the content of a widget
     */	  	
	callToGetContent: function(appId,  widScreen, selectedIndex){
	    if (!widScreen)
        widScreen = '1';
        var xml="<EWS>"
                    +"<SERVICE>" +this.getContentService +"</SERVICE>"
                    +"<OBJECT TYPE='" + this.objectType + "'>"+this.empId+"</OBJECT>"
                    +"<PARAM>"
                        +"<APPID>"+appId+"</APPID>"
                        +"<WID_SCREEN>*</WID_SCREEN>"
                    +"</PARAM>"
                +"</EWS>";
                                                        
        this.makeAJAXrequest($H({
                xml: xml,
                successMethod: 'drawWidget',
                //ajaxID: appId
                ajaxID: widScreen + ' ' + appId + ' ' + (selectedIndex ? selectedIndex : '')
            }));	
	},  

     /**  
     *@param appId The appId of a certaing widget
     *@param json The json received from get_content 
     *@description Takes the json (content of the widget) and see how to draw it
     */		  
	drawWidget: function(json, appId){
	    //depends on the layout
        if(json.EWS.o_widget_screens.yglui_str_wid_screen.yglui_str_wid_screen){
            json.EWS.o_widget_screens.yglui_str_wid_screen = json.EWS.o_widget_screens.yglui_str_wid_screen.yglui_str_wid_screen;
        }	            
        if(json.EWS.o_widget_screens.yglui_str_wid_screen['@table_mode'] == 'X'){        
            this.drawWidgetGroupedTable(json, appId);
        }else{
            this.drawWidgetAsPdc(json,appId);   
        }
	},

	/**
* @description Parses the widget content service
* @param xml The XML out
* @param appId The identificator of the AJAX call
*/
drawWidgetAsPdc: function(JSON, data, fromPai) {
    var dataArgument = data;
    data = data.split(' '); //Spliting the data
    var appId = data[1];         //Stores the AppId
    var widScreen = data[0];         //Stores the widget screen
    var selectedPanel = data[2];         //Currently selected panel
    var fromServicePai = data[3] === "true" || fromPai === true ? true : false;
    this._selectedScreens = $H();            //The selected screens
    var listMode = false;           //List mode indicator
    var panel = null;            //Stores the panel
    var widgetScreens = null;            //Widget screens
    if (!fromServicePai)
        this.newRecord = undefined;
    if (JSON.EWS.o_widget_screens)
        objectToArray(JSON.EWS.o_widget_screens.yglui_str_wid_screen.yglui_str_wid_screen ?
                JSON.EWS.o_widget_screens.yglui_str_wid_screen.yglui_str_wid_screen :
                JSON.EWS.o_widget_screens.yglui_str_wid_screen).each(function(item) {
                    var select;
                    if (this._elementsStorage.get(appId + '_' + widScreen))
                        select = this._elementsStorage.get(appId + '_' + widScreen).get('fieldPanel').currentSelected;
                    if (item.yglui_str_wid_screen)
                        item = item.yglui_str_wid_screen;
                    if ((item['@screen'] == widScreen) && (item['@list_mode'] == 'X')) listMode = true;
                    if (select) {
                        if (item['@screen'] == select)
                            item['@selected'] = 'X';
                        else
                            item['@selected'] = '';
                    }

                } .bind(this));
    //Deleting the previous generated panel in case that it was created
    if (this._elementsStorage.get(appId + '_' + widScreen))
        this._elementsStorage.unset(appId + '_' + widScreen);
    //Creating the structure to store the information of the new panel
    if (!this._elementsStorage.get(appId + '_' + widScreen)) {
        this._elementsStorage.set(appId + '_' + widScreen, $H({
            fieldPanel: null, 	        //Stores the fielPanel
            screenNavigation: null,         //Stores information about the screen navigation
            contentContainer: null,         //The prototype element that contains the panel
            json: null, 			//The JSON information
            records: new Array(),           //The screen records
            fromServicePai: fromServicePai
        }));
    }
    //Making a copy of the JSON so the modifications on it will not affect the copy on the cache
    this._elementsStorage.get(appId + '_' + widScreen).set('json', deepCopy(JSON));
    if (JSON.EWS.o_widget_screens)
        objectToArray(JSON.EWS.o_widget_screens.yglui_str_wid_screen).each(function(item) {
            if (item.yglui_str_wid_screen)
                item = item.yglui_str_wid_screen;
            if ((item['@screen'] == widScreen) && (item['@list_mode'] == 'X')) listMode = true;
        });
    document.stopObserving('EWS:pdcChange_' + this.tabId + '_' + appId);
    var panelMode = fromServicePai ? 'edit' : 'display';
    //Creating the fieldsPanel
    try {
        var a = 0;
        document.stopObserving("EWS:pdChangeFieldChange_" + widScreen + '_' + appId + '_' + this.empId);
        panel = new getContentModule({
            appId: appId,
            mode: panelMode,
            json: this._elementsStorage.get(appId + '_' + widScreen).get('json'),
            //jsonCreateMode: this.createModeJson,
            showCancelButton: false,
            buttonsHandlers: $H({
                DEFAULT_EVENT_THROW: 'EWS:pdcChange_' + this.tabId + '_' + appId,
                paiEvent: function(args) {
                    document.fire('EWS:paiEvent_' + appId + '_' + widScreen, getArgs(args));
                }
            }),
            cssClasses: $H({
                tcontentSimpleTable: 'PDC_stepsWithTable',
                fieldDispAlignBoxFields: 'fieldDispTotalWidth'
            }),
            showButtons: $H({
                edit: false,
                display: true,
                create: false
            }),
            fieldDisplayerModified: "EWS:pdChangeFieldChange_" + widScreen + '_' + appId + '_' + this.empId
        });
    }
    catch (e) {
        alert(e);
    }
    //Creating the observers for the fieldPanel
    document.observe('EWS:pdcChange_' + this.tabId + '_' + appId, this._actionButtonPressed.bind(this, appId, widScreen, listMode));
    document.stopObserving('EWS:paiEvent_' + appId + '_' + widScreen);
    this.paiEventUpdateBind = this._paiEventUpdate.bind(this, appId, widScreen, listMode, panel);
    document.observe('EWS:paiEvent_' + appId + '_' + widScreen, this.paiEventUpdateBind);
    //Creating the widget screens
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
    var widgetContentContainer = new Element('div', {
        'class': 'PDC_contentContainer'
    });
    this.hashOfWidgets.get(appId).setContent('');
    if (widgetScreens)
        this.hashOfWidgets.get(appId).getContentElement().insert(widgetScreens);
    var loadingContainer = new Element('div', {
        'id': 'loadingContainer'
    });
    this.hashOfWidgets.get(appId).getContentElement().insert(loadingContainer);
    this.hashOfWidgets.get(appId).getContentElement().insert(panel.getHtml());
    this._elementsStorage.get(appId + '_' + widScreen).set('contentContainer', this.hashOfWidgets.get(appId).getContentElement());
    //Storing the panel for this widget
    this._elementsStorage.get(appId + '_' + widScreen).set('fieldPanel', panel);
    this._elementsStorage.get(appId + '_' + widScreen).set('arguments', dataArgument);
    this._elementsStorage.get(appId + '_' + widScreen).set('loadingContainer', loadingContainer);
    this._elementsStorage.get(appId + '_' + widScreen).set('fromServicePai', fromServicePai)
},

/**
* This function is called every time we click on an action button. For example
* clickin on add or change or delete.
*/
_actionButtonPressed: function() {
    //Variables declarations
    var args = $A(arguments);
    var appId = args[0];
    var data = getArgs(args[3]);
    var listMode = args[2];
    var widScreen = args[1];
    var panel = this._elementsStorage.get(appId + '_' + widScreen).get('fieldPanel');
    switch (data.okcode) {
        //Modify a record              
        case 'COP':
        case 'MOD':
            panel.cssClasses = $H({
                tcontentSimpleTable: 'PDC_stepsWithTable',
                fieldDispAlignBoxFields: 'fieldDispTotalWidth'
            });
            if (data.noToggle !== true)
                panel.toggleMode('edit', panel.appId, data.screen, data.recKey);
            this._createFormControlButtons(panel, this.hashOfWidgets.get(appId).getContentElement(), appId, widScreen, false, listMode);
            break;
        //Delete a recor              
        case 'DEL':
            var subPanel;
            subPanel = panel;
            var callback = this._saveForm.bind(this, appId, widScreen, false, !Object.isEmpty(subPanel), 'DEL', data.recKey);
            this._deleteRecord(callback);
            break;
        //Insert a new record              
        case 'INS':
            this._newRecordCreation(appId, widScreen, args[4], listMode);
            break;
        case 'PAI':
            if (data.noToggle !== true)
                var subPanel = panel.toggleMode('edit', appId, 1, data.record);
            if (subPanel)
                this.hashOfWidgets.get(appId).getContentElement().update(subPanel.getElement().remove());
            this._createFormControlButtons(panel, this.hashOfWidgets.get(appId).getContentElement(), appId, widScreen, false, listMode);
            break;
    }
	},

    /**
    * This function is called to delete a record. It takes care of showing the popup
    * and calling the appropiated callbacks
    * @callback {function} Callback function
    */
    _deleteRecord: function(callback) {
        var contentHTML = new Element('div').insert(global.getLabel('areYouSureRecord'));
        //buttons
        var buttonsJson = {
            elements: [],
            mainClass: 'moduleInfoPopUp_stdButton_div_left'
        };
        var callBackfunct = function() {
            question.close();
            delete question;
            callback();
        };
        var callBack3 = function() {
            question.close();
            delete question;
        };
        var aux2 = {
            idButton: 'Yes',
            label: global.getLabel('yes'),
            handlerContext: null,
            className: 'moduleInfoPopUp_stdButton',
            handler: callBackfunct,
            type: 'button',
            standardButton: true
        };
        var aux3 = {
            idButton: 'No',
            label: global.getLabel('no'),
            handlerContext: null,
            className: 'moduleInfoPopUp_stdButton',
            handler: callBack3,
            type: 'button',
            standardButton: true
        };
        buttonsJson.elements.push(aux2);
        buttonsJson.elements.push(aux3);
        var ButtonObj = new megaButtonDisplayer(buttonsJson);
        var buttons = ButtonObj.getButtons();
        //insert buttons in div
        contentHTML.insert(buttons);
        var question = new infoPopUp({

            closeButton: $H({
                'textContent': 'Close',
                'callBack': function() {

                    question.close();
                    delete question;
                }
            }),
            htmlContent: contentHTML,
            indicatorIcon: 'information',
            width: 350
        });
        question.create();
    },

/**  
* This function is called when we click on Add a new record
* @param appId The appId
* @param widScreen The widget screen
* @buttons Button information
     */		
_newRecordCreation: function(appId, widScreen, buttons) {
    //This flag will indicate if we are creating a new record
    this.newRecord = true;
    var strXml = "<EWS>"
                 + "<SERVICE>"+ this.getContentService +"</SERVICE>"
                 + "<OBJECT TYPE='" + this.objectType + "'>" + this.empId + "</OBJECT>"
                 //+ "<OBJECT TYPE='P'>" + this.empId + "</OBJECT>"
                 + "<PARAM>"
                 + "<APPID>" + appId + "</APPID>"
                 + "<WID_SCREEN>" + this._elementsStorage.get(appId + '_' + widScreen).get('fieldPanel').currentSelected + "</WID_SCREEN>"
                 + "<OKCODE>NEW</OKCODE>"
                 + "</PARAM>"
                 + "</EWS>";

    this.makeAJAXrequest($H({
        xml: strXml,
        successMethod: '_newRecordStartTemplate',
        ajaxID: appId + ' ' + widScreen
    }));
},

/**
* If the call for creating a new record was a success we procees to create the new panel
* @json The returned JSON
* @data The AJAX CALL id
*/
_newRecordStartTemplate: function(json, data) {
    data = data.split(' ');
    var appId = data[0];
    var widScreen = data[1];
    var panel = null;
    var content = null;
    var select = null;
    if (this._elementsStorage.get(appId + '_' + widScreen))
        select = this._elementsStorage.get(appId + '_' + widScreen).get('fieldPanel').currentSelected;
    if (json.EWS.o_widget_screens)
        objectToArray(json.EWS.o_widget_screens.yglui_str_wid_screen.yglui_str_wid_screen ?
                json.EWS.o_widget_screens.yglui_str_wid_screen.yglui_str_wid_screen :
                json.EWS.o_widget_screens.yglui_str_wid_screen).each(function(item) {

                    if (select) {
                        if (item['@screen'] == select)
                            item['@selected'] = 'X';
                        else
                            item['@selected'] = '';
                    }

                } .bind(this));
    this._elementsStorage.get(appId + '_' + widScreen).unset('json');
    this._elementsStorage.get(appId + '_' + widScreen).set('json', deepCopy(json));
    var jsonElement = this._elementsStorage.get(appId + '_' + widScreen).get('json');
    if (jsonElement.EWS.o_field_values)
        if (jsonElement.EWS.o_field_values.yglui_str_wid_record) {
        objectToArray(objectToArray(jsonElement.EWS.o_field_values.yglui_str_wid_record)[0].contents.yglui_str_wid_content)[0]['@selected'] = 'X';
        objectToArray(objectToArray(jsonElement.EWS.o_field_values.yglui_str_wid_record)[0].contents.yglui_str_wid_content)[0]['buttons'] = null;
    }
    json = this._elementsStorage.get(appId + '_' + widScreen).get('json');
    if (Object.jsonPathExists(json, 'EWS.o_widget_screens.yglui_str_wid_screen.yglui_str_wid_screen')) {
        objectToArray(json.EWS.o_widget_screens.yglui_str_wid_screen.yglui_str_wid_screen).each(function(item) {
            item['@list_mode'] = "";
        });
    }
    try {
        panel = new getContentModule({
            appId: appId,
            mode: 'create',
            json: this._elementsStorage.get(appId + '_' + widScreen).get('json'),
            showCancelButton: false,
            buttonsHandlers: $H({
                DEFAULT_EVENT_THROW: 'EWS:pdcChange_' + this.tabId + '_' + appId,
                paiEvent: function(args) {
                    document.fire('EWS:paiEvent_' + appId + '_' + widScreen, getArgs(args));
                }
            }),
            cssClasses: $H({
                tcontentSimpleTable: 'PDC_stepsWithTable',
                fieldPanelSimpleTableDiv: 'simpleTable_table',
                fieldDispAlignBoxFields: 'fieldDispTotalWidth'
            }),
            showButtons: $H({
                edit: false,
                display: true,
                create: false
            })
        });
    }
    catch (err) {
        alert(err);
    }
    content = this._elementsStorage.get(appId + '_' + widScreen).get('contentContainer');
    if (this._elementsStorage.get(appId + '_' + widScreen).get('fieldPanel')) {
        this._elementsStorage.get(appId + '_' + widScreen).get('fieldPanel').destroy();
        this._elementsStorage.get(appId + '_' + widScreen).unset('fieldPanel');
    }
    this._elementsStorage.get(appId + '_' + widScreen).set('fieldPanel', panel);
    content.update();
    content.insert(panel.getHtml());
    this._createFormControlButtons(panel, content, appId, widScreen, true);
	},

     /**  
* Creates the form buttons like Save and Cancel and set the appropiated callbacks for them
* @param panel Panel to make the insertion
* @param container The panel container
* @param appId The application id
* @param screen The widget screen
* @param newRecord Indicates whether this is a new record or not
* @param listMode Indicates whether this is in list mode or not
*/
_createFormControlButtons: function(panel, container, appId, screen, newRecord, listMode) {
    if (newRecord == undefined)
        newRecord = false;
    var mainButtonsJson = {
        elements: [],
        mainClass: 'PDC_buttonsContainer'
    };
    var saveHandler = null;
    if (newRecord) {
        saveHandler = this._saveForm.bind(this, appId, screen, true, listMode, panel);
    }
    else {
        saveHandler = this._saveForm.bind(this, appId, screen, undefined, listMode);
    }
    var aux = {
        idButton: 'save',
        label: global.getLabel('save'),
        handlerContext: null,
        handler: saveHandler,
        className: 'PMF_showDocsButton',
        type: 'button',
        standardButton: true
    };
    var aux2 = {
        idButton: 'cancel',
        label: global.getLabel('cancel'),
        handlerContext: null,
        handler: this.callToGetContent.bind(this, appId, screen, panel ? panel.currentSelected : undefined),
        className: 'PMF_showDocsButton',
        type: 'button',
        standardButton: true
    };
    mainButtonsJson.elements.push(aux2);
    mainButtonsJson.elements.push(aux);
    var ButtonsPDC = new megaButtonDisplayer(mainButtonsJson);
    document.stopObserving('EWS:validFormHandler_' + appId + '_' + screen);
    document.observe('EWS:validFormHandler_' + appId + '_' + screen, function(args) {
        if (args.memo === '0')
            ButtonsPDC.disable('save');
        else if (args.memo === '1')
            ButtonsPDC.enable('save');
    });
    var errorCaption = new Element('div', {
        id: 'errorTextCaption',
        'class': 'application_main_error_text '
    }).hide();
    this._elementsStorage.get(appId + '_' + screen).set('errorCaption', errorCaption);
    if (container) {
        container.insert(errorCaption);
        container.insert('<div style="clear:both;"></div>');
        container.insert(ButtonsPDC.getButtons());
    }
    else if (panel)
        if (!Object.isEmpty(panel.currentSelected)) {
        var parentContainer = panel.getFieldPanels().get(panel.currentSelected).virtualHtml;
        parentContainer.insert(errorCaption);
        parentContainer.insert('<div style="clear:both;"></div>');
        parentContainer.insert(ButtonsPDC.getButtons());
    }
},

/**
* Gets a certain node that matchs the rec_index
* @param json The JSON to search in
* @param recIndex The rec_index to match
*/
_getRecord: function(json, screen, recIndex, notMakeNull) {
    var returnValue = null;
    if (json.EWS.o_field_values)
    //Going throught all the recors to find the one matching with the screen number
        objectToArray(json.EWS.o_field_values.yglui_str_wid_record).each(function(item) {
            if (Object.jsonPathExists(item, 'contents.yglui_str_wid_content'))
                if (item['@screen'] == screen && item.contents.yglui_str_wid_content['@rec_index'] == recIndex) {
                returnValue = item;
                if (!notMakeNull)
                    item.contents.yglui_str_wid_content['buttons'] = null;
            }
        });
    return returnValue;
},

/**
* Gets a screen from a JSON based on a screen number
* @param json The JSON to get the screen from
* @param screen The screen to get
*/
_getScreen: function(json, screen, selected) {
    var returnValue = null;
    var oArray = objectToArray(json.EWS.o_field_values.yglui_str_wid_record);
    if (json.EWS.o_field_values) {
        if (objectToArray(json.EWS.o_field_values.yglui_str_wid_record).length == 1) {
            if (json.EWS.o_field_values.yglui_str_wid_record['@screen'] == screen)
                returnValue = json.EWS.o_field_values.yglui_str_wid_record;

        }
        else {
            objectToArray(json.EWS.o_field_values.yglui_str_wid_record).each(function(item) {
                if (selected) {
                    if (item['@screen'] == screen && objectToArray(item.contents.yglui_str_wid_content)[0]['@rec_index'] == selected && objectToArray(item.contents.yglui_str_wid_content).length == 1)
                        returnValue = item;
                    else if (item['@screen'] == screen && objectToArray(item.contents.yglui_str_wid_content).length > 1) {
                        item.contents.yglui_str_wid_content = objectToArray(item.contents.yglui_str_wid_content).reject(function(subItem) {
                            return subItem['@rec_index'] != selected;
                        });
                        returnValue = item;
                    }
                }
                else if (item['@screen'] == screen)
                    returnValue = item;
            });
        }
    }
    if (selected)
        if (Object.jsonPathExists(returnValue, 'contents.yglui_str_wid_content'))
        returnValue.contents['yglui_str_wid_content'] = objectToArray(returnValue.contents.yglui_str_wid_content).reject(function(content) {
            return content['@rec_index'] != selected.toString();
        });
    return returnValue;
},
/**
* This function is call every time we call on save on a form that is being edit
* or when deleting a recordData
* @param data Event data
*/
_saveForm: function(data) {
    var args = $A(arguments);
    var appId = args[0];
    var screen = args[1];
    var originalScreen = screen;
    var newReg = args[2] ? args[2] : this.newRecord;
    var listMode = args[3];
    var panelToValidate = args[4];
    var selected = args[5] ? args[5] : 0;
    var json = deepCopy(this._elementsStorage.get(appId + '_' + screen).get('json'));
    var buttons = '';
    var fieldPanel = this._elementsStorage.get(appId + '_' + screen).get('fieldPanel');
    var panel = fieldPanel ? fieldPanel : panelToValidate;
    var widScreen = screen;
    //If it's list mode we get the current selected from the list
    //Checking the form format
    var validForm = panel.validateForm(screen);
    screen = panel.currentSelected;
    //If it's a new register we empty up the buttons node
    if (newReg) {
        //this._getScreen(json,screen).contents.yglui_str_wid_content['buttons'] = null;
        buttons = objectToArray(json.EWS.o_screen_buttons.yglui_str_wid_button);
        buttons = {
            BUTTON: buttons[0]
        };
    }
    else {
        //Getting the OKCODE
        if (fieldPanel.currentRecordIndex)
            selected = parseInt(fieldPanel.currentRecordIndex, 10);
        else if (panel)
            if (panel.currentRecordIndex)
            selected = panel.currentRecordIndex;
        var buttonsNode = this._getScreen(json, screen).contents.yglui_str_wid_content;
        if (fieldPanel.currentRecordIndex || (panel && panel.currentRecordIndex) || args[5]) {
            if ($A(buttonsNode).length > 1)
                buttonsNode = $A(buttonsNode).reject(function(item) {
                    return item['@rec_index'] != selected;
                })[0];
        }
        else
            buttonsNode = objectToArray(buttonsNode)[0];
        this._getScreen(json, screen).contents['yglui_str_wid_content'] = buttonsNode;
        var changeButton;
        var action = args[4] ? args[4] : 'MOD';
        if (this.newRecord) {
            action = 'INS';
            if (json.EWS.o_screen_buttons) {
                objectToArray(json.EWS.o_screen_buttons.yglui_str_wid_button).each(function(button) {
                    if (button['@type'] == action)
                        changeButton = button;
                });
                buttonsNode['buttons'] = null;
            }

        }
        else {
            if (buttonsNode.buttons)
                objectToArray(buttonsNode.buttons.yglui_str_wid_button).each(function(button) {
                    if (button['@type'] == action)
                        changeButton = button;
                });
            buttonsNode['buttons'] = null;
            buttons = {
                BUTTON: json.EWS.o_changeButton
            };
            objectToArray(this._getScreen(json, screen).contents.yglui_str_wid_content).each(function(item) {
                item['buttons'] = null;
            });
        }
        buttons = {
            BUTTON: changeButton
        };
    }
    //Defining the variables that are gonna need to be recovered on the XML
    json.EWS['SERVICE'] = this.saveRequestService;
    var xmlIn = new XML.ObjTree();
    xmlIn.attr_prefix = '@';
    var screenPanel = this._elementsStorage.get(appId + '_' + screen) ? this._elementsStorage.get(appId + '_' + screen) : this._elementsStorage.get(appId + '_' + originalScreen);
    var reg = listMode && screenPanel.get("fromServicePai") !== true ?
        { yglui_str_wid_record: this._getRecord(json, screen, selected)} :
        { yglui_str_wid_record: this._getScreen(json, screen, selected) };
    fieldValues = xmlIn.writeXML(reg, true);
    buttons = xmlIn.writeXML(buttons, true);
    //Defining the XML in
    xmlIn = '<EWS>' +
            '<SERVICE>' + this.saveRequestService + '</SERVICE>' +
            '<OBJECT TYPE="' + this.objectType + '">'+this.empId+'</OBJECT>' +
            '<PARAM>' +
            '<APPID>' + appId + '</APPID>' +
            '<RECORDS>' + fieldValues + '</RECORDS>' +
            buttons +
            '</PARAM>' +
            '</EWS>';
    //If there is no erros on the XMl we proceed to make the AJAX call
    if (validForm.correctForm == true) {
        this.makeAJAXrequest($H({
            xml: xmlIn,
            successMethod: '_saveFormSuccess',
            ajaxID: appId + ' ' + widScreen + ' ' + action
        }));
    }
},

/**
* This function will be called in case that the backend doesn't send back an error message
* and the saving process succed.
* @param json The JSON information of the reply
* @param data AJAX id information
*/
_saveFormSuccess: function(json, data) {
    //Update pending requests
    data = data.split(' ');
    var appId = data[0];
    var widgetScreen = data[1];
    var selectedIndex;
    if (this._elementsStorage.get(appId + '_' + widgetScreen).get('fieldPanel')) {
        this._elementsStorage.get(appId + '_' + widgetScreen).get('fieldPanel').destroy();
        selectedIndex = this._elementsStorage.get(appId + '_' + widgetScreen).get('fieldPanel').currentSelected;
    }
    var contentContainer = this._elementsStorage.get(appId + '_' + widgetScreen).get('contentContainer');
    contentContainer.update();
    if (data[2] == 'DEL') {
        this._elementsStorage.get(appId + '_' + widgetScreen).get('fieldPanel').destroy();
        this.callToGetContent(appId);
    }
    else {
        this.callToGetContent(appId, widgetScreen, selectedIndex);
    }
    document.fire('EWS:widgetInformationChanged_' + this.tabId, null);
    global.reloadApplication();
},
/**
* This function is called every time the service PAI event is fired by getContentModule
*/
_paiEventUpdate: function() {
    //Declarations
    var args = $A(arguments);
    var data = args[4].memo;
    var panel = this._elementsStorage.get(args[0] + '_' + args[1]).get('fieldPanel');
    var json = null;
    var jsonToSend = null;
    var xml = new XML.ObjTree();
    json = panel.json;
    var reg = {
        yglui_str_wid_record: this._getScreen(json, panel.currentSelected, panel.currentRecordIndex)
    };
    var settings = null;
    if (objectToArray(json.EWS.o_field_settings.yglui_str_wid_fs_record).length == 1)
        settings = {
            yglui_str_wid_fs_record: json.EWS.o_field_settings.yglui_str_wid_fs_record
        };
    else
        settings = {
            yglui_str_wid_fs_record: $A(json.EWS.o_field_settings.yglui_str_wid_fs_record).reject(function(item) {
                return item["@screen"] != panel.currentSelected;
            })
        };
    var screenMode = json.EWS.o_widget_screens['@screenmode'];
    delete json.EWS.o_widget_screens['@screenmode'];
    jsonToSend = {
        EWS: {
            SERVICE: data.servicePai,
            OBJECT: {
                TYPE: this.objectType,
                TEXT: this.empId
            },
            PARAM: {
                APPID: args[0],
                o_field_settings: settings,
                o_field_values: reg,
                o_screen_buttons: json.EWS.o_screen_buttons,
                o_widget_screens: {
                    '@screenmode': screenMode,
                    yglui_str_wid_screen: json.EWS.o_widget_screens
                }
            }
        }
    };
    document.stopObserving('EWS:paiEvent_' + args[0] + '_' + args[1]);
    //Converting the JSON to XML
    xml.attr_prefix = '@';
    xml = xml.writeXML(jsonToSend, true);
    if (!this._elementsStorage.get(args[0] + '_' + args[1]).get('fromServicePai'))
        this._elementsStorage.get(args[0] + '_' + args[1]).get('loadingContainer').insert('<span class="loading_caption" style="float: left">Loading...</span>');
    this.makeAJAXrequest($H({
        xml: xml,
        successMethod: '_updatePaiEventSuccess',
        errorMethod: '_updatePaiEventFailure',
        ajaxID: args[0] + ' ' + args[1] + ' ' + (panel.currentSelected ? '1' : '0') + ' ' + data.record
    }));
},
	
//    drawWidgetAsPdc: function(json,appId){

//        var aux = new getContentModule({mode:'display',json:json, appId:appId, showCancelButton:false});
//        this.hashOfWidgets.get(appId).setContent(aux.getHtml());
//    },  
 
     /**  
     *@param appId The appId of a certaing widget
     *@param json The json received from get_content 
     *@description Draws a grouped layout content
     */		
	drawWidgetGroupedTable: function(json, data){
     var dataArgument = data;
     data = data.split(' '); //Spliting the data
     var appId = data[1];         //Stores the AppId
        if(json.EWS.o_screen_buttons){
            var buttonsToDisplay=json.EWS.o_screen_buttons.yglui_str_wid_button;            
            var buttonJson = {
                elements:[],
                mainClass: 'PFM_Dashboard_buttonClass'
            }; 
            if(appId=='PFM_OBJ'){
                var idDoc = '';
                if("o_field_values" in json.EWS){
                    var allRows;
                    if(json.EWS.o_field_values != null){
                        allRows = objectToArray(json.EWS.o_field_values.yglui_str_wid_record);                
                        idDoc=allRows[0]['@rec_key'];
                    }
                }
                var handler = global.open.bind(global, $H({
                    app: {
                        appId: buttonsToDisplay['@tarap'],	
                        tabId: buttonsToDisplay['@tartb'],	                        
                        view: buttonsToDisplay['@views']
                    },
                    idOfDoc:idDoc,
                    previousApp:this.options.appId,
                    previousView:this.options.view
                }));                                
            }else{
                var handler = global.open.bind(global, $H({
                    app: {
                        appId: buttonsToDisplay['@tarap'],	
                        tabId: buttonsToDisplay['@tartb'],	                        
                        view: buttonsToDisplay['@views']
                    },
                    empId:this.empId,
                    previousApp:this.options.appId,
                    previousView:this.options.view
                }));                 
            }
            var aux =   {
                idButton: buttonsToDisplay['@action'],
                label: buttonsToDisplay['@label_tag'],
                className: 'application_action_link',
                type: 'link',
                eventOrHandler: false,
                handlerContext: null,
                handler: handler                         
            }; 
            buttonJson.elements.push(aux);
            var ButtonPfmObj=new megaButtonDisplayer(buttonJson);
            //create a div, and then insert the table in it
            this.hashOfWidgets.get(appId).setContent("<div id='"+appId+"_table'></div><div id='PFM_Dashboard_buttonObj_"+appId+"'></div>"); 
            this.hashOfWidgets.get(appId)._contentDiv.down('div#PFM_Dashboard_buttonObj_'+appId).update(ButtonPfmObj.getButtons());
        }
        else
            this.hashOfWidgets.get(appId).setContent("<div id='"+appId+"_table'></div>");              
        //separate record 	
        var screensStructure = splitInScreensGL(json);              
        //transform to groupedLayout json
        for(var a=0;a<screensStructure.keys().length;a++){
            var isGroupedArray = objectToArray(screensStructure.get(screensStructure.keys()[a]).headers.fs_fields.yglui_str_wid_fs_field);
            this.isGrouped = false;
            for(var b=0;b< isGroupedArray.length && !this.isGrouped; b++){
                if(isGroupedArray[b]['@fieldtype'] == 'G') 
                  this.isGrouped = true;
            }
            var newJson = this.getContentToGroupedLayout(screensStructure.get(screensStructure.keys()[a]),this.isGrouped,a);
            var gr3= new groupedLayout(newJson,this.virtualHtml.down('div#'+appId+'_table'),this.isGrouped);
            var html = gr3.buildGroupLayout();
        }	
	
	},
	
     /**  
     *@param args Args received when an employee is selected
     *@description Loads the selected user widgets
     */		
    onEmployeeSelected: function(args) {
        this.empId = args.id;
        this.objectType = args.oType;
        this.warningmsg.hide();
        this.loadWidgets();
    },
    
     /**  
     *@param args Args received when an employee is unselected
     *@description If no employee is selected, then hides the widgets
     */	
    onEmployeeUnselected: function(args) {
          		
		if(this.getSelectedEmployees().size() == 0){
		    this.virtualHtml.down('div#PFM_Dashboard_LegendDiv').hide();
            this.virtualHtml.down('div#PFM_widgets').hide();
            this.warningmsg.show();
		}            
    }		   
});
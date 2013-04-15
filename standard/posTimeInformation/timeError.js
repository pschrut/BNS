/* 
 * Contains all the functionalities for displaying the clockin errors
 * @fileoverview timeError.js
 */

/**
 * Displays the time error and the actions to solve the errors
 * @constructs
 * @inherit Application
 */
var TimeError = Class.create(Application,
/**
 * @lends PosTimeEvent
 */
 {
    //ATTRIBUTES
    /**
     * Contains the information of the event we are gonna show the information
     * @type Object
     */
    _eventInformation:    null,
    
    /**
     * Contains the information of the employee the XML call is gonna be made for
     * @type Object
     */
    _employeeInformation: null,
    
    /**
     * Stores information of the application that need to be called
     * @type Object
     */
    _appInformation:      null,
    
    /**
     * Stores the retrieved JSON to be used by all the functions of the class
     * @type Object
     */
    _retrievedJSON:       null,
    
    /**
     * Stores the retrieved JSON to be used by all the functions of the class
     * @type Object
     */
    _retrievedJSONLinks:  null,
    
    /**
     * Stores the date of the last Time Error event the user clicked on
     * @type Object
     */
    _lastDateClicked: null,
    
    /**
     * It contents the json fields of the event (screen 1 of the get_events).
     */
    _eventHash: null,
    
    /**
     * Class constructor
     * @param $super The parent class intializator
     * @param options The initialization options
     */
    initialize: function($super,options) {
        $super(options);
    },
    
   
    /**
     * This function is called every time the application is initialized
     * @param $super The parent class run method
     */
    run: function($super, args) {
        $super(args);
        //Recovering the information fired on global.open from calendars
        this._appInformation = args.get('app');
        this._contentEvent = args.get('event');
        this._eventCodes = args.get('eventCodes');
        this._eventInformation = args.get('eventInformation');
        this._employeeInformation = args.get('employee');
        // teamCalendar sends a JSON instead a Hash
        if (!Object.isHash(this._eventCodes)) {
            this._eventCodes = new Hash(this._eventCodes);
            this._eventCodes.each(function(eventCode) {
                this._eventCodes.set(eventCode.key, new Hash(eventCode.value));
            }.bind(this));
        }
        if (balloon.isVisible())
            balloon.hide();  
        //The goal of this 'if' statement is filling the _eventHast structure to get the begda in that structure if needed 
        this._eventHash = null;
        var fpjson = null, yglui_str_wid_field = null;
        if(!Object.isEmpty(this._contentEvent.EWS)){
            fpjson = deepCopy(this._contentEvent);
            yglui_str_wid_field = fpjson.EWS.o_field_values.yglui_str_wid_record.contents.yglui_str_wid_content.fields.yglui_str_wid_field;
            this._eventHash = new Hash();
            for (var i = 0; i < yglui_str_wid_field.length; i++) {
                if (!Object.isEmpty(yglui_str_wid_field[i]['@fieldtechname']))
                    this._eventHash.set(yglui_str_wid_field[i]['@fieldtechname'], yglui_str_wid_field[i]);
                else
                    this._eventHash.set(yglui_str_wid_field[i]['@fieldid'], yglui_str_wid_field[i]);
            }
        }
        var currentBegda;
        if (!Object.isEmpty(this._eventInformation))
            currentBegda = Object.isString(this._eventInformation.begDate) ? sapToObject(this._eventInformation.begDate.substring(0,10)) : this._eventInformation.begDate;
        else
            currentBegda = sapToObject(this._eventHash.get('BEGDA')['@value']);    
        if(this.firstRun || currentBegda != this._lastDateClicked){
            this.virtualHtml.update();
            this._lastDateClicked = currentBegda;
            this._callTimeErrorEventInformation(); //Calling the JSON
        }           
    },
     
    /**
     * This function is called every time the application is closed
     * @param $super The parent class close method
     */
    close: function($super) {
        $super("TimeError");
    },
    
    
    // PRIVATE METHODS
    /**
     * This function does the SAP call to retrieve the content of the event selected
     */
    _callTimeErrorEventInformation: function(){
        //The XML in template (See Prototype documentation)
        var __xmlTemplate = new Template("<EWS>"+
            "<SERVICE>#{serviceName}</SERVICE>"+
            "<OBJECT TYPE=\"#{objectType}\">#{objectNumber}</OBJECT>"+
            "<PARAM>"+
             "<APPID>#{appId}</APPID>"+
             "<PERIOD_BEGDA>#{begda}</PERIOD_BEGDA>"+
             "<PERIOD_ENDDA>#{endda}</PERIOD_ENDDA>"+
             "<WID_SCREEN>*</WID_SCREEN>"+
            "</PARAM>"+
             "<DEL/>"+
            "</EWS>");
        
        //BEGDA 
        var _begda;
        if(!Object.isEmpty(this._eventInformation)) //this._eventInformation is not empty when user clicks on monthly calendar event
            _begda = Object.isString(this._eventInformation.begDate) ? this._eventInformation.begDate.substring(0,10) : this._eventInformation.begDate.toString('yyyy-MM-dd');
        else if(!Object.isEmpty(this._eventHash)) //It's not empty when the user click on 'view details' in list calendar
            _begda = this._eventHash.get('BEGDA')['@value'];   
     
        //ENDDA
        var _endda;
        if(!Object.isEmpty(this._eventInformation))
            _endda = Object.isString(this._eventInformation.endDate) ? this._eventInformation.endDate.substring(0,10) : this._eventInformation.endDate.toString('yyyy-MM-dd');
        else if(!Object.isEmpty(this._eventHash))
            _endda = this._eventHash.get('BEGDA')['@value']; //We get the begda as well   
             
        //Evaluating the template
        var __xmlIn = __xmlTemplate.evaluate({
            serviceName: 'GET_CONTENT2', //The service name
            objectType: 'P', //The object type
            objectNumber: this._employeeInformation, //The object ID
            appId: this._appInformation.appId, //The application ID
            begda: _begda, //The beginning date
            endda: _endda //The end date
        });
        
        //Making the AJAX request
        this.makeAJAXrequest($H({
            xml: __xmlIn,
            successMethod: '_retrieveTimeErrorEventInformationSuccess'
        }));
    },
    
    
    /**
     * This function is called if the AJAX call to retrieve data has been successful
     * @param json The information to parse
     */
    _retrieveTimeErrorEventInformationSuccess: function(json){
        //Storing the JSON on a class attribute
        this._retrievedJSON = json;
        this.virtualHtml.update().insert(this._createVisualErrorDescription());
        this._callTimeErrorEventLinks();
    },
    
    
    /**
     * This function does the SAP call to retrieve the action links related to the Time Error event
     */
    _callTimeErrorEventLinks: function(){
        //The XML in template (See Prototype documentation)
        var __xmlTemplate = new Template("<EWS>"+
            "<SERVICE>#{serviceName}</SERVICE>"+
            "<OBJECT TYPE=\"#{objectType}\">#{objectNumber}</OBJECT>"+
            "<PARAM>"+
             "<CONTAINER>#{container}</CONTAINER>"+
             "<MENU_TYPE>#{mType}</MENU_TYPE>"+
            "</PARAM>"+
             "<DEL/>"+
            "</EWS>");
            
        //Evaluating the template
        var __xmlIn = __xmlTemplate.evaluate({
            serviceName:  'GET_CON_ACTIO', //The service name
            objectType: 'P', //The object type
            objectNumber: this._employeeInformation, //The object ID
            container: 'CAL_TER', //The container id
            mType: 'N' //The menu type
        });
        
        //Making the AJAX request
        this.makeAJAXrequest($H({
            xml: __xmlIn,
            successMethod: '_retrieveTimeErrorEventLinksSuccess'
        }));   
    },
    
    
    /**
     * This function is called if the AJAX call to retrieve data has been successful
     * @param json The information to parse
     */
    _retrieveTimeErrorEventLinksSuccess: function(json){
        if(!this._retrievedJSONLinks)
            this._retrievedJSONLinks = json.EWS.o_actions;
        this._createVisualErrorLinks();
    },
    
    
     /**
     * This function builds the list whit action links
     */
    _createVisualErrorLinks: function(){
        var _content = this.virtualHtml.down('div#timeError_links');
	    var actions = new Element("ul", {
	        "class": "FastEntryMenu_optionList"
	    });
	    objectToArray(this._retrievedJSONLinks.yglui_vie_tty_ac).each( function(action) {
	        var actionArray = action["@actiot"].split('((L))');
		    var actionText = actionArray[0] + "<span class='application_action_link'>" + actionArray[1] + "</span>" + actionArray[2];
		    var listElement = new Element("li").update(actionText);
		    
		    //BEGDA 
            var _begda;
            if(!Object.isEmpty(this._eventInformation)) //this._eventInformation is not empty when user clicks on monthly calendar event
                _begda = Object.isString(this._eventInformation.begDate) ? this._eventInformation.begDate.substring(0,10) : this._eventInformation.begDate.toString('yyyy-MM-dd');
            else if(!Object.isEmpty(this._eventHash)) //It's not empty when the user click on 'view details' in list calendar
                _begda = this._eventHash.get('BEGDA')['@value']; 
		      
		    listElement.down('span').observe("click", function() {
		       global.open( $H({
	                app: {
	                    appId: action['@tarap'],
	                    tabId: this._appInformation.tabId,
	                    view: action['@views']
	                },
	                event: this._getEmptyEvent("", "", action['@tarap'], _begda),
	                eventCodes: this._eventCodes,
	                TEemployee: this._employeeInformation,
	                TEeventInformation: this._eventInformation,
	                TEappInformation: this._appInformation,
	                TEcontentEvent: this._contentEvent
	            }));
		    }.bind(this));
		    actions.insert(listElement);
        }.bind(this));
        _content.insert(actions);
    },
    
    
    /**
     * This function creates the main container, retrieves the main data of json object and calls other functions to render the event
     */
     _createVisualErrorDescription: function(){
        var _container = new Element('div', {
            'class': 'timeError_maxWidth'
        });
        
        //Getting the needed screen
        var _info = objectToArray(this._retrievedJSON.EWS.o_field_values.yglui_str_wid_record).select(function(item) {
            return item['@screen'] == 2;
        });
     
        //Rendering the HTML information (error description)
        this._renderErrorDescriptionHtml(_container,_info[0]);
           
        return _container;
     },
     
     
     /**
     * Renders the JSON info inside the container
     * @param container Container which will have the html code of Time Error event
     * @param info Info to be rendered
     * @return The rendered html
     */
     _renderErrorDescriptionHtml: function(container, info){
        //Creating the template
        var _template = new Template("<div>"+
            "<div style=\"clear: both;\"><div class=\"application_main_title2\">"+global.getLabel('TimeErrorOn')+"</div><div class=\"application_main_title2 timeError_CaptionDate\">#{date}</div></div>"+
            "<div style=\"clear: both;\"><div class=\"#{borderClass}\">"+
             "<div style=\"clear: both; margin-bottom:10px\"><div class=\"fieldCaption fieldDispHeight fieldDispLabel fieldDispFloatLeft fieldDispNoWrap application_main_soft_text\">"+global.getLabel('ErrorDescrp')+"</div><div class=\"fieldCaption application_main_error_text\">#{txt}</div></div>"+
             "<div style=\"clear: both; margin-bottom:10px\"><div class=\"fieldCaption fieldDispHeight fieldDispFloatLeft fieldDispNoWrap application_main_soft_text\">"+global.getLabel('ErrorActionText')+"</div></div>"+
             "<div style=\"clear: both;\"><div id=\"timeError_links\"></div></div></div>"+
            "</div></div>"
        );   
  
       //BEGDA for the title 
        var _begda;
        if(!Object.isEmpty(this._eventInformation))
            _begda = Object.isString(this._eventInformation.begDate) ? this._eventInformation.begDate.substring(0,10) : this._eventInformation.begDate.toString('yyyy-MM-dd');
            
        else if(!Object.isEmpty(this._eventHash))
            _begda = this._eventHash.get('BEGDA')['@value'];   
                   
        //Evaluating the template
        var _html = _template.evaluate({
            date:        sapToDisplayFormat(_begda),
            borderClass: ('timeError_border'+objectToArray(this._retrievedJSON.EWS.o_wid_pos.yglui_str_wid_attributes)[0]['@color']),
            txt:         this._getField(info.contents.yglui_str_wid_content.fields.yglui_str_wid_field, 'ETEXT')["@value"]
        });
        //Setting the HTML inside the container
        container.insert(_html); 
          
        //Create the cancel button 
        var buttonsJson = {
            elements: [],
            mainClass: 'timeError_stdButton_div_right'
        };     
        var cancelButton = {
            idButton: 'TE_CANCEL',
            label: global.getLabel('cancel'),
            handlerContext: null,
            className: 'moduleInfoPopUp_stdButton',
            type: 'button',
            standardButton: true,
            handler: function(){
                //Open CAL_MNM app
                global.open($H({
                    app: {
                        tabId: this.options.tabId,
                        appId: global.tabid_applicationData.get(this.options.tabId).applications[0].appId,
                        view: global.tabid_applicationData.get(this.options.tabId).applications[0].view
                    }
                }));
            }.bind(this)
        };
        buttonsJson.elements.push(cancelButton);
        var ButtonObj = new megaButtonDisplayer(buttonsJson);
        var buttons = ButtonObj.getButtons();
        container.insert(buttons);
     },
     
     
     /**
     * Gets a given field by ID from a yglui_str_wid_field list
     * @param list The list of fields
     * @param fieldId the field ID to filter
     */
     _getField: function(list,fieldId) {
        var ret;
        list.each(function(item) {
            if(item['@fieldid'] == fieldId) {
                ret = item;
                $break;
            }
        });
        return ret;
     },
    
    
     /**
     * @description Returns an event json with essential information
     * @param {String} appId Event's type
     * @param {String} date Event's date
     * @returns {Hash} Event hash
     */
     _getEmptyEvent: function(empId, empName, appId, date) {
        var eventProperties = new Hash();
        eventProperties.set('PERNR', {
            'text': empName,
            'value': empId
        });
        eventProperties.set('APPID', {
            'text': appId
        });
        eventProperties.set('BEGDA', {
            'value': date
        });
        eventProperties.set('ENDDA', {
            'value': date
        });
        return eventProperties;
     }
});


/* 
 * This file contains all the functionalities to display information of a positive time event
 * @authors JoseFer
 */
/**
 * This class displays information of an event on the screen. It extends PDChange
 * @extends PDChange
 */
var PosTimeEvent = Class.create(Application,
/**
 * @lends PosTimeEvent
 */{
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
     */
    _appInformation:      null,
    /**
     * Stores the retrieved JSON to be used by all the functions of the class
     * @type Object
     */
    _retrievedJSON:       null,
    /**
     * Indicates if to load the time information component
     */
    _showTimeInformationComponent: null,
    /**
     * Screens ids that identifies the pannels
     */
    PANELS_IDS: {
        TIME_INFO: 2, //Time information panel
        COUNTERS:  4, //counter panel
        WS_INFO:   3, //Work schedule information
        WS_GRAPH:  5  //work schedule graphic
    },
    /**
     * A basic 16 colors list
     */
    WS_COLORS: ["#FF0000", "#00FF00", "#0000FF","#FFFF00",
    "#00FFFF","#FF00FF","#800000","#800080",
    "#008000","#808000","#000080","#008080",
    "#000000","#C0C0C0","#808080","#FFFFFF"],
    /**
     * Fix the numbers of the applications as in some APPs the numbers changes.
     */
    _screenNumberCorrector: null, 
    /**
     * It contents the json fields of the event (screen 1 of the get_events).
     */
    _eventHash: null,
    /**
     * Class constructor
     */
    initialize: function($super,args) {
        //Calling the parent function
        $super(args);
    },
    run: function($super,args) {    
        $super(args);
        // Recovering the information fired on global.open from calendars
        this._appInformation = args.get('app');
        this._contentEvent = args.get('event');
        this._eventInformation = args.get('eventInformation');
        this._employeeInformation = args.get('employee');
        //Show the time information component
        this._showTimeInformationComponent = true;
        // Fix the screen numbers
        this._screenNumberCorrector = this._appInformation.appId == "HRS_RLZ" ? 1 : 0;
        // Closing calendar's balloon
        if (balloon.isVisible())
            balloon.hide();    
        // Clean up the virtualHtml div
        this.virtualHtml.update();
        this._callTimeEventInformation(); //Calling the JSON
    },
    /**
     * This method is called everytime the application is closed. Overrides the parent function
     * @param $super The parent close function
     */
    close: function($super) {
        //Calling the parent function
        $super();
    },
    // PRIVATE METHODS
    /**
     * Calls to SAP to retrieve an event information in JSON
     */
    _callTimeEventInformation: function() {
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
        //BEGDA 
        var _begda;
        if(!Object.isEmpty(this._eventInformation)) //this._eventInformation is not empty when user clicks on monthly calendar event
            _begda = Object.isString(this._eventInformation.begDate) ? this._eventInformation.begDate.substring(0,10) : this._eventInformation.begDate.toString('yyyy-MM-dd');
        else if(this._contentEvent.BEGDA)
            _begda = this._contentEvent.BEGDA.value;
        else if(!Object.isEmpty(this._eventHash)) //It's not empty when the user click on 'view details' in list calendar
            _begda = this._eventHash.get('BEGDA')['@value'];   
        else
            _begda = this._contentEvent.get('BEGDA').value; //It's not empty when the user click to create a new event
        //ENDDA
        var _endda;
        if(!Object.isEmpty(this._eventInformation))
            _endda = Object.isString(this._eventInformation.endDate) ? this._eventInformation.endDate.substring(0,10) : this._eventInformation.endDate.toString('yyyy-MM-dd');
        else if(this._contentEvent.ENDDA)
            _endda = this._contentEvent.ENDDA.value;
        else if(!Object.isEmpty(this._eventHash))
            _endda = this._eventHash.get('BEGDA')['@value']; //We get the begda as well   
        else 
            _endda = this._contentEvent.get('ENDDA').value;      
        //Evaluating the template
        var __xmlIn = __xmlTemplate.evaluate({
            serviceName: 'GET_CONTENT2', //The service name
            objectType: 'P', //The object type
            objectNumber: !Object.isEmpty(this._employeeInformation) ? this._employeeInformation : global.objectId, //The object ID
            appId: this._appInformation.appId, //The application ID
            begda: _begda, //The beginning date
            endda: _endda //The end date
        });
        //Making the AJAX request
        this.makeAJAXrequest($H({
            xml: __xmlIn,
            successMethod: '_retrieveTimeEventInformationSuccess'
        }));
    },
    /**
     * This function is called if the AJAX call to retrieve the event information success
     * @param json The retrieved JSON data
     * @param data The event attached data
     */
    _retrieveTimeEventInformationSuccess: function(json) {
        //Storing the JSON on a class attribute
        this._retrievedJSON = json;
        //Crating the panels => Visual components
        this._createVisualComponents();
        

        //Create the cancel button 
        var buttonsJson = {
            elements: [],
            mainClass: 'timeInformation_stdButton_div_right'
        };     
        var cancelButton = {
            idButton: 'TE_CANCEL',
            label: global.getLabel('cancel'),
            handlerContext: null,
            className: 'timeError_moduleInfoPopUp_stdButton',
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
        this.virtualHtml.insert(buttons);
    
    },
    /**
     * Create the visual components. It will be module-like as some panels will be shown or nor depending of the APP_ID
     */
    _createVisualComponents: function() {
        //clean up the virtualHtml div
        this.virtualHtml.update();

        //Title
        var _template = new Template("<div class=\"timeInformation_maxWidth timeInformation_CaptionDateContainer\">"+
            "<div style=\"clear: both;\"><div class=\"application_main_title2\">"+global.getLabel("TimeInformationOn")+"</div><div class=\"application_main_title2 timeInformation_CaptionDate\">#{date}</div></div>"+
            "<div style=\"clear: both;\"></div>"+
        "</div>"
        );
          
        //BEGDA for the title 
        var _begda;
        if(!Object.isEmpty(this._eventInformation))
            _begda = Object.isString(this._eventInformation.begDate) ? this._eventInformation.begDate.substring(0,10) : this._eventInformation.begDate.toString('yyyy-MM-dd');
        else if(this._contentEvent.BEGDA)
            _begda = this._contentEvent.BEGDA.value;
        else if(!Object.isEmpty(this._eventHash))
            _begda = this._eventHash.get('BEGDA')['@value'];   
        else
            _begda = this._contentEvent.get('BEGDA').value;
            
        var _html = _template.evaluate({
            date: _begda ? sapToDisplayFormat(_begda) : ''
        });
        this.virtualHtml.insert(_html);
                 
        
        //References the componets, so It can be instantiated dynamically
        var components = {
            "TIME_INFO":    this._componentTimeInformation, //Time information component
            "WORKSCHEDULE": this._componentWorkSchedule,    //Work schedule component
            "COUNTERS":     this._componentCounters         //Components component
        };
         
        //Time information specific component
        if(this._appInformation.appId == "TIM_INF")
            this.virtualHtml.insert(components["TIME_INFO"].bind(this)());
        //Generic components 
        this.virtualHtml.insert(components["WORKSCHEDULE"].bind(this)());
        this.virtualHtml.insert(components["COUNTERS"].bind(this)());

    },
    //PANEL COMPONENTS
    /**
     * Takes care of creating the time information component
     */
    _componentTimeInformation: function() {
        //Creating the component container
        var _container = new Element('div',{
            'class': 'timeInformation_maxWidth'
        });
        //Creating the panel container
        var panel = new TitledPanel($H({
            label:''
        }));
        //Getting the information
        var info        = this._filterRecordsByScreen(this._retrievedJSON, this.PANELS_IDS.TIME_INFO);
        //Retrieving the settings
        var settings    = this._filterSettingsByScreen(this._retrievedJSON, this.PANELS_IDS.TIME_INFO);
        //Transforming the JSON in a understandable format to getContentModule
        var timeContentjson = this._formTimeJSON(this._retrievedJSON);
        _container.insert(panel.getHtml());
        //Rendering the HTML information
        this._renderTimeInformationHtml(panel,info,settings,timeContentjson);
        //Return the container
        return _container;
    },
    /**
     * Transform the JSON into a format that getContentModule can interpretate
     * @param json The JSON to transform
     * @return The transformed JSON
     */
    _formTimeJSON: function(json) {
        var copy     = deepCopy(json);
               
        //Getting the needed screen  
        for(var i=0; i<copy.EWS.o_field_settings.yglui_str_wid_fs_record.length; i++){
            if( copy.EWS.o_field_settings.yglui_str_wid_fs_record[i]['@screen']!=this.PANELS_IDS.TIME_INFO)
                delete copy.EWS.o_field_settings.yglui_str_wid_fs_record[i];   
        }
        copy.EWS.o_field_settings.yglui_str_wid_fs_record = copy.EWS.o_field_settings.yglui_str_wid_fs_record.compact();

        for(var j=0; j<copy.EWS.o_field_values.yglui_str_wid_record.length; j++){
            if( copy.EWS.o_field_values.yglui_str_wid_record[j]['@screen']!=this.PANELS_IDS.TIME_INFO)
                delete copy.EWS.o_field_values.yglui_str_wid_record[j];   
        }
        copy.EWS.o_field_values.yglui_str_wid_record = copy.EWS.o_field_values.yglui_str_wid_record.compact();
          
        for(var k=0; k<copy.EWS.o_widget_screens.yglui_str_wid_screen.yglui_str_wid_screen.length; k++){
            if(copy.EWS.o_widget_screens.yglui_str_wid_screen.yglui_str_wid_screen[k]['@screen']!=this.PANELS_IDS.TIME_INFO)
                delete copy.EWS.o_widget_screens.yglui_str_wid_screen.yglui_str_wid_screen[k];
        }
        copy.EWS.o_widget_screens.yglui_str_wid_screen.yglui_str_wid_screen = copy.EWS.o_widget_screens.yglui_str_wid_screen.yglui_str_wid_screen.compact();

        delete copy.EWS.o_wid_pos;
        //delete copy.EWS.labels;
        delete copy.EWS.messages;
        delete copy.EWS.webmessage_type;
        delete copy.EWS.webmessage_text;

        return copy; 
    },
    /**
     * Renders the final HTML code for the component based on the generated information
     * @param panel Panel to insert the rendered information
     */
    _renderTimeInformationHtml: function(panel,info,settings,timeContentjson) {
        if(!Object.isEmpty(info[0])){
            //Getting the fields
            var fields     = objectToArray(info[0].contents.yglui_str_wid_content.fields.yglui_str_wid_field);
            
            //Creating the time information
            var _top = new Template("<div>"+
                                        "<div style=\"clear: both;\"><div class=\"fieldCaption fieldDispHeight fieldDispLabel fieldDispFloatLeft fieldDispNoWrap application_main_soft_text\">"+global.getLabel("for")+"</div><div class=\"fieldCaption\">#{fo}</div></div>"+
                                        "<div style=\"clear: both;\"></div>"+
                                    "</div><div>"+
                                        "<div id=\"posTimeFpContainer\" style=\"clear: both;\"></div>"+
                                        "<div style=\""+(Prototype.Browser.Gecko?"clear: both;\"":"\"")+"></div>"+
                                    "</div>");
                                
            //Evaluating templates
            var _topHtml = _top.evaluate({
                fo: this._getField(fields,"PERNR")["#text"],  //For field
                st: this._getField(fields,"STATUS")["@value"] //Status field
            });
            
            //Inserting the generated content into the panel
            panel.insertContent(_topHtml);
            
            try {
                var _panel = null;
                _panel = new getContentModule({
                    appId: this._appInformation.appId,
                    mode: 'display',
                    json: timeContentjson,
                    showCancelButton: false,
                    /*cssClasses: $H({
                        tcontentSimpleTable: 'PDC_stepsWithTable',
                        fieldDispAlignBoxFields: 'fieldDispTotalWidth'
                    }),*/
                    showButtons: $H({
                        edit: false,
                        display: true,
                        create: false
                    })
                });
            }
            catch (e) {
                alert(e.name+": "+e.description);
            }
            if(!Object.isEmpty(_panel)) {  
                panel._content.down("[id=posTimeFpContainer]").insert(_panel.getHtml());
            }           
        }
        else
            panel.insertContent(new Element('div', { 'class': 'timeInformation_main_soft_text' }).update(global.getLabel('noResults')));
    },
    /**
     * Takes care of creating the work schedule component
     */
    _componentWorkSchedule: function() {
        //Creating the component container
        var _container = new Element('div',{
            'class': 'timeInformation_halfWidth'
        });
        //Creating the panel container
        var panel = new TitledPanel($H({
            label: 'Work Schedule'
        }));
        _container.insert(panel.getHtml());
        //Getting the screen
        var info     = this._filterRecordsByScreen(this._retrievedJSON, this.PANELS_IDS.WS_INFO - this._screenNumberCorrector);
        //Work schedule graphic information
        var ws       = this._filterRecordsByScreen(this._retrievedJSON, this.PANELS_IDS.WS_GRAPH - this._screenNumberCorrector);
        //Retrieving the settings
        var settings = this._filterSettingsByScreen(this._retrievedJSON, this.PANELS_IDS.WS_GRAPH - this._screenNumberCorrector);
        //Processing the work schedule information
        ws           = this._convertWorkScheduleGraphicInformation(ws,settings);
        //Rendering the HTML information
        this._renderWorkScheduleHtml(panel,info,ws);
        //Returning the generated content
        return _container;
    },
    /**
     * Converts the JSON information into information that the work schedule visualize can parse
     * @param info The information to parse
     * @param settings The record settings
     * @return an JSON with the parsed information
     */
    _convertWorkScheduleGraphicInformation: function(info,settings) {
        info = info[0];
        //Extracting the fields node
        var fields     = objectToArray(info.contents.yglui_str_wid_content.fields.yglui_str_wid_field);
        //Filtering the BEG events from the whole events list
        var begTimes   = fields.reject(function(item) {
            return !item["@fieldid"].include("BEG") || item['@value'].gsub(" ","") == "::";
        });
        var timeClocks = fields.reject(function(item) {
            return !item["@fieldid"].include("LTIME") || item['@value'] == "00:00:00";
        });
        //It will store the time blocks that will be displayed in the graphic
        var wsObject  = $A();
        //Points to the actual color being used for the block
        var colorIncrease = 0;
        var sobeg, soend;               //It will store information of the full working schedule
        var minDelimiter, maxDelimiter; //It will store the min value and the max one
        //Creating the time periods and inserting them into wsObject
        //Stores the color assignations for each type of events
        
        var eventsColors = $H({
            TOLERANCE: '#0033CC', //blue
            CORE:      '#FF0000', //red
            BREAK:     '#FFFF00', //yellow
            FILL:      '#009933'  //green  
        });
        begTimes.each(function(item) {
            if(item["@fieldid"] != "SOBEG") {
                //Getting the max and min value
                var date = Date.parseExact(item["@value"],"HH:mm:ss")
                if(!minDelimiter) minDelimiter = {date: date, item: item}; //Setting the minDelimiter
                if(!maxDelimiter) maxDelimiter = {date: date, item: item}; //Settings the maxDelimiter
                if(date < minDelimiter.date) //In case the actual date is smalled that the other we update it
                    minDelimiter = {date: date,item: item};
                if(date > maxDelimiter.date) //In case the actual date is bigger than the other one we update it's value
                    maxDelimiter = {date: date,item: item};
                //Determining the time block length
                var length  = this._getGraphicTimeLength(item,fields);
                //Retrieving the WS settings
                var setting = this._getField(settings[0].fs_fields.yglui_str_wid_fs_field, item["@fieldid"]);
                var color;
                if(!eventsColors.get(setting["@display_group"])) {
                    color   = this.WS_COLORS[colorIncrease];
                    colorIncrease++;
                    eventsColors.set(setting["@display_group"], color);
                }
                else
                    color = eventsColors.get(setting["@display_group"]);
                //Storing the processed time block
                wsObject.push({
                    time: item["@value"],
                    type:   "TYPE_TIME_BLOCK",
                    color: color,
                    length: length //Calculating the event length by calling this function
                });
            }
        }.bind(this));
           
        //Processing the core time
        sobeg = this._getField(fields,"SOBEG"); //Beg core time
        soend = this._getField(fields,"SOEND"); //Eng core time
              
        //Parsing the FILL time in a different function as the process is quite different of the actual one
        this._processFillTime(wsObject /*Passed by reference*/, eventsColors, sobeg, soend,minDelimiter,maxDelimiter,settings,fields);
        
        this._sortBlocksByTime(wsObject /*Passed by reference*/);
        wsObject = this._fillTheGaps(wsObject, eventsColors);
             
        //Process the clockins
        this._processClockIns(wsObject /*Passed by reference*/, timeClocks);
        
        //Returning the generated information
        return {ws: wsObject, colors: eventsColors};
    },
    /**
     * Process the clocking to transform them into graphic visualizer format
     * @param wsObject The object that will store all the generated data
     * @param settings the WSG settings
     * @param fields The whole WS fields
     */
    _processClockIns: function(wsObject, timeClocks) {
        for(var n = 0; n <= timeClocks.size()-1; n++) {
             wsObject.push({
                type:   "TYPE_TIME_CLOCKIN",
                time:   timeClocks[n]["@value"],
                color:  null
            });
        }
    },
    /**
     * Process the fill time and split it, as it should be done by the first and last event of normal time events
     * @param wsObject The object that stores the TimeScheduleVisualized formatted time events
     * @param eventsColors This hash has in a list all the color that has been used on the time events
     * @param sobeg The SO time block begining
     * @param soend The SO time block ending
     * @param minDelimiter The first time event that appears on the workschedule
     * @param maxDelimiter The last time event that appears on the workschedule
     * @param color The actual color to be used
     * @param settings The workschedule settings
     * @param fields A list with the fields
     */
    _processFillTime: function(wsObject,eventsColors,sobeg,soend,minDelimiter,maxDelimiter,settings,fields) {
        //In case we have core beg time we determine whether to paint it or not
        if(sobeg && Date.parseExact(sobeg["@value"],"HH:mm:ss") < minDelimiter.date) {
            length = minDelimiter.date.getTime() - Date.parseExact(sobeg["@value"],"HH:mm:ss").getTime();
            wsObject.push({
                time: sobeg["@value"],
                type:   "TYPE_TIME_BLOCK",
                color: eventsColors.get('FILL'),
                length: length/(1000*60) //Calculating the event length by calling this function
            });
        }
        if(soend) {
            var lastDelimiter = maxDelimiter.item["@fieldid"].gsub("BEG","END");
            lastDelimiter = this._getField(fields, lastDelimiter);
            var lastDate  = Date.parseExact(lastDelimiter["@value"],"HH:mm:ss");
            var soendTime = Date.parseExact(soend["@value"],"HH:mm:ss");
            var length = soendTime.getTime() - lastDate.getTime();
            if(lastDate < Date.parseExact(soend["@value"],"HH:mm:ss")) {
                wsObject.push({
                    time: lastDelimiter["@value"],
                    type:   "TYPE_TIME_BLOCK",
                    color: eventsColors.get('FILL'),
                    length: length/(1000*60) //Calculating the event length by calling this function
                });
            }
        }
    },
    /**
     * Calculates the time length for a graphic time period
     * @param block Time event information
     * @param info Workschedule fields
     */
    _getGraphicTimeLength: function(block,info) {
        //Generating the end time we have to search for
        var searchFor = block["@fieldid"].gsub("BEG","END");
        //Getting the end time
        var endTime   = this._getField(info, searchFor)["@value"];
        var timeDiff = Date.parseExact(endTime, "HH:mm:ss").getTime() - Date.parseExact(block["@value"],"HH:mm:ss").getTime();
        timeDiff /= (1000*60); //Reducing milliseconds to minutes
        return timeDiff;
    },
    /**
     * Renders the final HTML code for the component based on the generated information
     * @param panel Panel to insert the rendered information
     * @param info The information to display on the screen
     */
    _renderWorkScheduleHtml: function(panel,info,ws) {
        info = info[0];
        if(!Object.isEmpty(info)){
            //Extracting the fields node
            var fields = objectToArray(info.contents.yglui_str_wid_content.fields.yglui_str_wid_field);
            //Creating the template
            var _template = new Template("<div>"+
                "<div style=\"clear: both;\"><div class=\"fieldCaption fieldDispHeight fieldDispLabel fieldDispFloatLeft fieldDispNoWrap application_main_soft_text\">"+global.getLabel("workSchedule")+"</div><div class=\"fieldCaption\">#{ws}</div></div>"+
                "<div style=\"clear: both;\"><div class=\"fieldCaption fieldDispHeight fieldDispLabel fieldDispFloatLeft fieldDispNoWrap application_main_soft_text\">"+global.getLabel("plannedHours")+"</div><div class=\"fieldCaption\">#{ph}</div></div>"+
                "<div style=\"clear: both;\"><div class=\"fieldCaption fieldDispHeight fieldDispLabel fieldDispFloatLeft fieldDispNoWrap application_main_soft_text\">"+global.getLabel("plannedTime")+"</div><div class=\"fieldCaption\">#{pt}</div></div>"+
                "<div style=\"clear: both;\"></div></div>");
            //Evaluating the template
            var _html = _template.evaluate({
                ws: this._getField(fields, "TPROG")["@value"],
                ph: this._getField(fields, "STDAZ")["@value"],
                pt: this._getField(fields, "BEGUZ")["@value"] + " - " + this._getField(fields, "ENDUZ")["@value"]
            });
            //Creating the legend text and legend div
            this._legendText = new Element("span",{"class": "application_action_link fieldDispFloatLeft"}).update(global.getLabel("showLegend"));
            this._legendDiv  = new Element("div", {"class": "fieldClearBoth"});
            this._legendDiv.hide(); //Hidding the legned by default
            this._legendVisible = false; //Controls if the legend is visible or not
            //This function observes the click over the legend text to display the legend
            this._legendText.observe("click", function(event) {
                this._legendDiv.toggle();
                this._legendText.update()
                if(!this._legendVisible) {
                    this._legendText.update(global.getLabel("hideLegend"));
                    this._legendVisible = true;
                } else  {
                    this._legendText.update(global.getLabel("showLegend"));
                    this._legendVisible = false;
                }
            }.bind(this));
            var tsv = new TimeScheduleVisualizer($H({
                fitInto:  300,
                timeData: ws.ws
            }));
            this._createLegend(ws.colors);
            //Setting the HTML inside the panel
            panel.setContent(_html);
            //Inserting the work schedule graphic
            panel.insertContent(this._legendText);
            panel.insertContent(this._legendDiv);
            panel.insertContent(tsv.getHtml());
            panel.insertContent("<div style=\"clear: both;\"></div>");  
        }
        else
            panel.setContent(new Element('div', { 'class': 'timeInformation_main_soft_text' }).update(global.getLabel('noResults')));
    }, 
    _createLegend: function(ws) {
        ws.each(function(item) {
            this._legendDiv.insert("<div class=\"fieldDispFloatLeft timeInformation_captionBlock\"><span class=\"application_main_soft_text\">"+(global.getLabel(item.key))+"</span><div class=\"timeInformation_captionColor fieldDispFloatLeft\" style=\"background-color: "+item.value+";\"></div></div>")
        }.bind(this));
        return "";
    },
    /**
     * Takes care of creating the counters component
     */
    _componentCounters: function() {
        //Creating the component container
        var _container = new Element('div',{
            'class': 'timeInformation_halfWidth'
        });
        //Creating the panel container
        var panel = new TitledPanel($H({
            label: 'Counters'
        }));
        _container.insert(panel.getHtml());
        //As when loading the HRS_RLZ app there will be one screen less we have to fix the screns numbers
        //Getting the screen
        var info = this._filterRecordsByScreen(this._retrievedJSON, this.PANELS_IDS.COUNTERS - this._screenNumberCorrector);
        //Rendering the panel HTML information
        this._renderCountersHtml(panel,info);
        //Returning the generated content
        return _container;
    },
    /**
     * Renders the final HTML code for the component based on the generated information
     * @param panel Panel to insert the rendered information
     * @param info The information to be rendered
     */
    _renderCountersHtml: function(panel,info) {
        info = info[0];
        if(!Object.isEmpty(info)){
            //Extracting the fields node
            var fields = objectToArray(info.contents.yglui_str_wid_content.fields.yglui_str_wid_field);
            //Creating the template
            var _template = new Template("<div>"+
                "<div class=\"application_text_bolder fieldCaption timeInformation_panelCaption\">"+global.getLabel("dailyCounter")+"</div>"+
                "<div style=\"clear: both;\"><div class=\"fieldCaption fieldDispHeight fieldDispLabel fieldDispFloatLeft fieldDispNoWrap application_main_soft_text\">"+global.getLabel("workingHours")+"</div><div class=\"fieldCaption\">#{wh}</div></div>"+
                "<div style=\"clear: both;\"><div class=\"fieldCaption fieldDispHeight fieldDispLabel fieldDispFloatLeft fieldDispNoWrap application_main_soft_text\">"+global.getLabel("balance")+"</div><div class=\"fieldCaption\">#{bl}</div></div>"+
                "<div class=\"application_text_bolder fieldCaption timeInformation_panelCaption\">"+global.getLabel("otherCounters")+"</div>"+
                "<div style=\"clear: both;\"><div class=\"fieldCaption fieldDispHeight fieldDispLabel fieldDispFloatLeft fieldDispNoWrap application_main_soft_text\">"+global.getLabel("weekly")+"</div><div class=\"fieldCaption\">#{wk}</div></div>"+
                "<div style=\"clear: both;\"><div class=\"fieldCaption fieldDispHeight fieldDispLabel fieldDispFloatLeft fieldDispNoWrap application_main_soft_text\">"+global.getLabel("monthly")+"</div><div class=\"fieldCaption\">#{mt}</div></div>"+
                "<div style=\"clear: both;\"></div></div>");
            //Evaluating the template
            var _html = _template.evaluate({
                wh: this._getField(fields, "STDAZ")["@value"],
                bl: this._getField(fields, "BALANCE")["@value"],
                wk: this._getField(fields, "WEEKLY")["@value"],
                mt: this._getField(fields, "MONTHLY")["@value"]
            });
            //Setting the HTML inside the panel
            panel.setContent(_html);
         }
         else
            panel.setContent(new Element('div', { 'class': 'timeInformation_main_soft_text' }).update(global.getLabel('noResults')));
    },
    // JSON MANIPULATION FUNCTIONS
    /**
     * Filters the records by a given screen number
     * @param json The JSON to search in
     * @param screen The screen number we want to filter
     */
    _filterRecordsByScreen: function(json,screen) {
        var _records = objectToArray(json.EWS.o_field_values.yglui_str_wid_record);
        return _records.reject(function(item) {
            return item['@screen'] != screen;
        });
    },
    /**
     * Filters the settings by a given screen number
     * @param json The JSON to search in
     * @param screen The screen number we want to filter
     */
    _filterSettingsByScreen: function(json,screen) {
        var _records = objectToArray(json.EWS.o_field_settings.yglui_str_wid_fs_record);
        return _records.reject(function(item) {
            return item['@screen'] != screen;
        });
    },
    /**
     * Gets a given field by ID from a yglui_str_wid_field list
     * @param list The list of fields
     * @param fieldId the field ID to filter
     * @param returnObject Indicates if to return the whole node or just the field value
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
    _fillTheGaps: function(wsObject, eventsColors){
        var aux = $A();
        for(var i=0; i<wsObject.size()-1; i++){
            aux.push(wsObject[i]);
            if(Date.parseExact(wsObject[i].time,"HH:mm:ss").addMinutes(wsObject[i].length).getTime() == Date.parseExact(wsObject[i+1].time,"HH:mm:ss").getTime()){
                continue;    
            }
            else{
                var length = Date.parseExact(wsObject[i+1].time,"HH:mm:ss").getTime() - Date.parseExact(wsObject[i].time,"HH:mm:ss").addMinutes(wsObject[i].length).getTime();
                aux.push({
                    time: Date.parseExact(wsObject[i].time,"HH:mm:ss").addMinutes(wsObject[i].length).toString("HH:mm:ss"),
                    type: "TYPE_TIME_BLOCK",
                    color: eventsColors.get('FILL'),
                    length: length / (1000*60)
                });
            }
        }
        aux.push(wsObject[wsObject.size()-1]);
        return aux;
    },
   /**
     * Sort an array of time blocks from the lower to the higher
     * @param timeTypeBlocks The array with blocks
     * @return A sorted array
     */
    _sortBlocksByTime: function(timeTypeBlocks) {
        while(true) {
            var changes = false;
            for(var i = 0; i <= timeTypeBlocks.size()-2; i++) {
                if(timeTypeBlocks[i+1].time < timeTypeBlocks[i].time) {
                    var aux = timeTypeBlocks[i];
                    timeTypeBlocks[i] = timeTypeBlocks[i+1];
                    timeTypeBlocks[i+1] = aux;
                    changes = true;
                }
            }
            if(changes)
                continue;
            else
                break;
        }
    }
});

/**
 * This class extends the getContentModule functionality to add the extra needed
 * functionalities for positive time
 * @extends getContentModule
 */
var getContentTime = Class.create(getContentModule,
/**
 * @lends getContentTime
 */{
    /**
     * The class constructor
     * @param $super The parent class function
     * @param options The initialization options
     */
    initialize: function($super,options) {

    }
});
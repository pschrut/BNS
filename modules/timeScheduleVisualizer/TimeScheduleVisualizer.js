/* 
 * This module takes care of show visually a time schedule. Showing the different
 * type of time events that form a time schedule as well as the time the user
 * clocked in and clocked out
 * @version 1.0
 */

/**
 *                   TIME SCHEDULE DATA JSON EXAMPLE
 *
 * This document describes the time schedule data input format to be provided
 * to the module in order it can process it properly and generate the schema
 * The information will be stored into a Array of objects each object will have
 * information about the time the time block starts, the type of event and the
 * colour.
 * About the type we have TYPE_TIME_BLOCK which is a normal time block and
 * TYPE_TIME_CLOCKIN wich is the clockin time and TYPE_TYPE_CLOCKOUT which is
 * the clockout time.
 *
 *                      CODE EXAMPLE OF THE DATA
 *
 * var timeObject = [
 *      {
 *          time:   "07:00:00",
 *          type:   "TYPE_TIME_BLOCK",
 *          colour: "#ff0000",
 *      },{
 *          time:   "15:00:00",
 *          type:   "TYPE_TIME_BLOCK",
 *          colour: "#ff0000",
 *      }
 * ];
 *
 *                             CODE EXPLANATION
 *
 * As you can see the colour is pass as an exadecimal code in a string as well
 * as the type that is setted up on a string.
 *
 */


/**
 * The class Module provides a skeleton to create new modules. It ensures that
 * all the modules has the same structure and common methods for common tasks.
 * Such as getting the generated element, get the value, etc... It also integrates
 * a way of parsing the data and check for mandatory options attributes.
 */
var Module = Class.create(
/**
 * @lends Module
 */{

    //Public methods

    /**
     * Constructor of the class
     */
    initialize: function(options) {
        this.registeredEvents = $A();
        //Checking options validity
        this._checkOptionsValid(options);
    },
    /**
     * Returns the main element generated for the module to be inserted lately
     * in the DOM document.
     */
    getHtml: function() {
        return this._element;
    },
    /**
     * Destroyes the instance
     */
    destroy: function() {
        //Unregistering all the events
        this._unregisterAllEvents();
        //Removing the HTML
        if(this._element)
            this._element.remove();
        //Deleting the instance
        delete this;
    },

    //Private methods

    /**
     * It will store the module options into a hash
     */
    _options: null,
    /**
     * Contains the main container for the module. That's where all the HTML
     * should be inserted and lately it will returned with getHtml to retrieve
     * the element.
     */
    _element: null,
    /**
     * Stores an string with mandatory attributes that should be check in the
     * options hash.
     * @type String
     */
    _OPTIONS_MANDATORY_ATTRIBUTES: null,
    /**
     * Stores the module name
     * @type String
     */
    _MODULE_NAME: "UNDEFINED_MODULE_NAME",
    /**
     * Stores the registered events to be unregistered when destroying the object
     * @type Prototype.Enumerable
     */
    _registeredEvents: null,
    /**
     * Checks few aspects on the options. Such as if the options are a hash or
     * if the mandatory attributes are included in the options
     * @param {Prototype.Hash} options
     */
    _checkOptionsValid: function(options) {
        var splitMandatoryAttributes = this._OPTIONS_MANDATORY_ATTRIBUTES ? this._OPTIONS_MANDATORY_ATTRIBUTES.split(',') : [];
        //Checking if there is options and if the options are a hash
        try {
            if(options) {
                var a = 0;
                //In case that the options is a hash we go through it to check the mandatory attributes
                $A(splitMandatoryAttributes).each(function(attribute) {
                    if(!options.get(attribute)) {
                        throw "Module Error: Mandatory attribute '"+attribute+"'"+" is not included in the options hash";
                    }
                });
            }
         }
         catch(e) {
            alert(e);
         }
    },
    /**
     * Register an event over an element and keeps this registration on memory
     * to lately unregister all the events when destroying the Module object.
     * @param element Elemen where we are applying the observer
     * @param eventName Event we are listening to
     * @param callback The callback function
     */
    _registerEvent: function(element,eventName,callback) {
        //Storing the event information
        this.registeredEvents.push({
            element:    element,
            eventName:  eventName,
            callback:   callback
        });
        //Registering the event
        element.observe(eventName,callback);
    },
    /**
     * Unregister an event over an element
     * @param element Elemen where we are applying the observer
     * @param eventName Event we are listening to
     * @param callback The callback function
     */
    _unregisterEvent: function(element,eventName,callback) {
        element.stopObserving(eventName,callback)
    },
    /**
     * Stop observing all the created event for the module
     */
    _unregisterAllEvents: function() {
        this.registeredEvents.each(function(event) {
            event.element.stopObserving(event.eventName,event.callback);
        });
    },
    /**
     * Throws an error formated indicating the module where the error is being thrown
     * @param errorMsg The error message
     */
    _error: function(errorMsg) {
        throw "Error on '"+this._MODULE_NAME+"': "+errorMsg;
    }
});


/**
 * The main class to create a time schedule schema from some data input
 * @constructor
 * @see TimeScheduleData module example
 */
var TimeScheduleVisualizer = Class.create(Module,{
    /**
     * Defines the mandatory attributes on the options
     */
    _OPTIONS_MANDATORY_ATTRIBUTES: "fitInto,timeData",
    /**
     * Indicated the module name
     */
    _MODULE_NAME: "TimeScheduleVisualizer",
    /**
     * Stores the reduction factor
     * @type Integer
     */
    _REDUCTION_FACTOR: null,
    /**
     * Sets the width that the graphic should fit into
     * @type Integer
     */
    _FIT_INTO: null,
    /**
     * Stores the element that will form the time line
     * @type Prototype.Element
     */
    _timeLine: null,
    /**
     * Stores the template for the time blocks
     * @type Prototype.Template
     */
    _blockTemplate: new Template('<div class="#{className}" style="#{style}"></div>'),
    /**
     * Stores the label template
     * @type Prototype.Template
     */
    _labelTemplate: new Template('<td class="#{className}" style="#{style}">#{label}</td>'),
    /**
     * Content template for the labels
     * @type Prototype.Template
     */
    _textTemplate: new Template('<div class="#{className}" style="#{style}">#{label}</div>'),
    /**
     * The size of the hours label. If you want to change the letter size you must change this parameter
     * @type Integer
     */
    _labelSize: 28,
    /**
     * Constructor of the class
     */
    initialize: function($super,options) {
        $super(options);
        this._timeLine = $A();
        //Parsing the options
        this._parseOptions(options);
        //Creating the main visual elements. +46 to have space enough due to margin left and righ and because each clocking adds 1px more
        this._createVisible(this._FIT_INTO+50);
        //Evaluate the data and parse it to generate the graphic
        this._evaluateData(options.get("timeData"));
    },
    
    // Private functions
    
    /**
     * Parses the options to store them into the class variables
     * @param options The options hash
     */
    _parseOptions: function(options) {
        if(typeof options.get("fitInto") != "number")
            this._error("The reductionFactor should be a number");
        this._FIT_INTO = options.get("fitInto");
    },
    /**
     * Parses the data to generate the graphical information
     */
    _evaluateData: function(data) {
        var clockInTime     = new Array(); //Stores the clockin time object
        var clockOutTime    = new Array(); //Stores the clockout time object
        var totalWidth      = null;        //Stores the max width
        var timeTypeBlocks  = $A(data).reject(function(timeBlock) {
            //Parsing the time
            timeBlock.time = Date.parseExact(timeBlock.time,"HH:mm:ss");
            var reject = true;
            switch (timeBlock.type) {
                //Conventional time block
                case "TYPE_TIME_BLOCK":
                    totalWidth += timeBlock.length;
                    reject = false;
                    break;
                //Clock-in time event
                case "TYPE_TIME_CLOCKIN":
                    clockInTime.push(timeBlock);
                    break;
                default:
                    this._error("Not valid time type '"+timeBlock.type+"'");
                    break;
            }
            return reject;
        }.bind(this));
        this._REDUCTION_FACTOR = this._FIT_INTO / totalWidth;
        //Sorting the time blocks
        this._sortBlocksByTime(timeTypeBlocks);
        this._sortBlocksByTime(clockInTime);
        //Drawing the parsed information
        this._drawTimeSchedule(timeTypeBlocks,clockInTime);
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
    },
    /**
     * Draws the time schedule
     * @param timeTypeBlocks The time block
     * @param clockInTime The clock-in time
     * @param clockOutTime The clock-out time
     */
    _drawTimeSchedule: function(timeTypeBlocks,clockInTime) {
        var timeLine         = new String();   //Stores the time blocks
        var labelLine        = new String();   //Stores the blocks labels 
        
        var labelClockLine   = new String();
        var initTime         = timeTypeBlocks[0].time.clone();
        
        
        var onClockinTime    = null;           //Indicates if the current blocks are on the clockIn - clockOut time
        var actualClockIn    = clockInTime[0]; //Points to the actual clockInTime that is being painted
        var clocksPointer    = 0;              //Marks wich clockIn/Out are we parsing
        var originalBlocks   = this._cloneArrayOfObjects(timeTypeBlocks); //To clone array of objects
        var clocksAfterTime  = $A();           //Stores clockIn/Out which have been done after work time
        var acum             = 0;              //Stores how many pixels we've got to add to the columns of the table of labelBlocks   
        var arrLenPadBlocks  = $A();           //Stores the real width and padding applied to each label blocks
        var arrLenPadClockin = $A();           //Stores the real width and padding applied to each label clockin
        
        for(var i = 0; i <= timeTypeBlocks.size()-1; i++) {
            var auxDate         = timeTypeBlocks[i].time.clone();        //Stores the auxiliar date
            var splitAt         = null;                                  //Indicates where the time block should be splited up
           
            auxDate.add({
                minutes: timeTypeBlocks[i].length
            });
            //Check if there is clockins out of range and draw it
            if((i == 0 || i == timeTypeBlocks.size()-1) && actualClockIn) {
                var first = (i == 0);
                var loopCheck = function(first,at,tb) {
                    if(!at || !tb)
                        return false;
                    if(first)
                        return at.time < tb.time;
                    else
                        //We clone the tb.time to this object doesn't affect by addMinutes function
                        return at.time > tb.time.clone().addMinutes(tb.length);
                }
                while(loopCheck(first,actualClockIn,timeTypeBlocks[i])) {
                    if(first){
                        acum+=1;
                        timeLine         += '<div class="timeScheduleVisualizer_clocking"></div>';
                        clocksPointer++;
                        actualClockIn = clockInTime[clocksPointer];
                    }
                    else{
                        clocksAfterTime.push('<div class="timeScheduleVisualizer_clocking"></div>');
                        clocksPointer++;
                        actualClockIn = clockInTime[clocksPointer];    
                    }
                }
            }
          
            //Checking if the checkIn is inside of this time block
            if(actualClockIn && this._isInsideRange(timeTypeBlocks[i].time,auxDate,actualClockIn.time)) { 
                splitAt = this._getTimeDifference(timeTypeBlocks[i].time, actualClockIn.time);    
            }
            
            //In case we have a checkIn or checkOut we split the block to insert the checkIn div
            if(!Object.isEmpty(splitAt)) {
                acum+=1;
            
                auxDate        = this._cloneBlock(timeTypeBlocks[i]);
                auxDate.length = splitAt;
                timeTypeBlocks[i].length -= splitAt;
                timeTypeBlocks[i].time.add({
                    minutes: splitAt
                });
                //to draw the block until clockin time
                timeLine       += this._drawTimeBlock(auxDate);
                timeLine       += '<div class="timeScheduleVisualizer_clocking"></div>';

                //to draw the clockin label
                labelClockLine += this._drawLabelClockin(initTime, actualClockIn.time, clockInTime[(clocksPointer-1)], arrLenPadClockin, clocksPointer);
                initTime = actualClockIn.time;
                  
                i--;
                clocksPointer++;
                actualClockIn = clockInTime[clocksPointer];
            }
            else {
                //to draw the end of the block
                timeLine       += this._drawTimeBlock(timeTypeBlocks[i]);
                //to draw the block label
                labelLine      += this._drawLabelBlock(originalBlocks[i], i, acum, arrLenPadBlocks, false);
                acum = 0;
                
                //If it's the last block, we have to draw the final block label and final clocking label as well
                if(i == timeTypeBlocks.size()-1){
                    var endTime = originalBlocks[i].time.clone().addMinutes(originalBlocks[i].length)
                    var tmp={
                        time:   endTime,
                        length: this._labelSize
                    };
                    
                    //to draw the last block label
                    labelLine        += this._drawLabelBlock(tmp, (i+1), acum, arrLenPadBlocks, true); 
                    
                    //to draw the last clockin
                    //to point at the last valid clockin inside work schedule
                    if(clockInTime.size()!=0){
                        //to eliminate problems with millisecond           
                        while(Date.parseExact(clockInTime[(clocksPointer-1)].time.toString("HH.mm.ss"), "HH.mm.ss") > endTime){
                            clocksPointer--;       
                        }
                    }  
                    labelClockLine   += this._drawLabelClockin(initTime, endTime, clockInTime[(clocksPointer-1)], arrLenPadClockin, clocksPointer);                 
                }  
            }
        }

        //We loop the clockIn/Out which have been done after work time and added a new stripe for each one
        if(clocksAfterTime.size()>0) {
            clocksAfterTime.each(function(record){
                timeLine += record;    
            }); 
            
            labelClockLine  += this._drawLabelClockin(endTime, endTime.clone().addMinutes(this._labelSize), clockInTime[clocksPointer], arrLenPadClockin, (clocksPointer+1));  
        }
           
        //Making the element insertions on the main container
        this._element.insert('<div class="timeScheduleVisualizer_labelsClockin">'+labelClockLine+'</div>');
        this._element.insert('<div class="timeScheduleVisualizer_graphic">'+timeLine+'</div>');
        this._element.insert('<div class="timeScheduleVisualizer_labelsBlock">'+labelLine+'</div>');
        
    },
    /**
     * Draws a time block and returns an HTML element
     * @param timeTypeBlock The time block information
     * @param blockWidth The block width
     */
    _drawTimeBlock: function(timeTypeBlock, blockWidth) {
        var length  = timeTypeBlock.length * this._REDUCTION_FACTOR;
        length      = Math.round(length);
        return this._blockTemplate.evaluate({
            className:  "timeScheduleVisualizer_timeBlock",
            style:      "width: "+length+"px; background-color: "+timeTypeBlock.color+";"
        });
    },  
    /**
     * Draws the labels that appear together with the time blocks and clockins
     */
    _drawLabelBlock: function(labelBlock, i, acum, arrLenPadBlocks, lastBlock) {
        //This ml (margin-left) is to fix problems in IE
        var ml=0;

        //Adding a padding to not overlap the label if the block is too small 
        var width,pad=0;
        width = ( lastBlock ? labelBlock.length : labelBlock.length * this._REDUCTION_FACTOR + acum);
        if(!Object.isEmpty(arrLenPadBlocks[i-1]) && arrLenPadBlocks[i-1].width <= this._labelSize){
            pad = (arrLenPadBlocks[i-1].padding == 0 ? 10 : 0);             
            //ml  = (Prototype.Browser.IE ? (arrLenPadBlocks[i-1].width-this._labelSize) : 0); 
        }
        arrLenPadBlocks.push({
            width:   width,
            padding: pad
        });
            
        //Generating the label
        return this._textTemplate.evaluate({
            label : labelBlock.time ? labelBlock.time.toString("HH:mm") : '',
            className: "timeScheduleVisualizer_timeBlock",
            style:     "padding-top:"+pad+"px; width: "+width+"px;margin-left:"+ml+"px;"
        });

    },  
   /**
     * Draws the labels that appear together with the time blocks and clockins
     */  
    _drawLabelClockin: function(iTime, clockinTime, previousClockin, arrLenPadClockin, i) {   
        var diff = this._getTimeDifference(iTime, clockinTime);
        var acum = 1;
        var ml = 0; //This ml (margin-left) is to fix problems in IE. in FF it will always be 0
        
        //Adding a padding to not overlap the label if the block is too small 
        var width,pad=0;
        width = diff * this._REDUCTION_FACTOR + acum;
        //In next if statement we use i-1!=0 condition because first clockin label will never have padding-top and margin-left  
        if(!Object.isEmpty(arrLenPadClockin[i-1]) && (i-1!=0) && arrLenPadClockin[i-1].width <= this._labelSize){
            pad = (arrLenPadClockin[i-1].padding == 0 ? 10 : 0); 
            //ml  = (Prototype.Browser.IE ? (arrLenPadClockin[i-1].width-this._labelSize) : 0);                     
        }
        arrLenPadClockin[i]={
            width:   width,
            padding: pad
        };
        
        //Generating the label
        return this._textTemplate.evaluate({
            label : previousClockin ? previousClockin.time.toString("HH:mm") : '',
            className: "timeScheduleVisualizer_timeBlock",
            style:     "padding-top:"+pad+"px; width: "+width+"px;margin-left:"+ml+"px;"
        });
    },
     /**
     * Clones a time block object
     * @param block The time block object
     * @return {object} The cloned object
     */
    _cloneBlock: function(block) {
        return {
            type:   block.type,
            time:   block.time.clone(),
            length: block.length,
            color:  block.color
        }
    },
    /**
     * Clones an array of time block objects
     * @param source The array with time block objects
     * @return {array} The cloned array
     */
    _cloneArrayOfObjects: function(source) {
        var destination = $A();
        for (var i=0; i<source.size(); i++)
            destination.push(this._cloneBlock(source[i]));
        return destination;
    },
    /**
     * Checks if a certain hour is inside a range
     * @param timeStart The range starting time
     * @param timeEnd The range ending time
     * @param date The date to check if is inside of the range
     * @return A boolean value indicating if whether the value is inside of the
     *          range or not
     */
    _isInsideRange: function(timeStart,timeEnd,date) {
        return (date >= timeStart && date <= timeEnd);
    },
    /**
     * Gets the difference between two times
     * @param {Date} startTime The start time
     * @param {Date} endTime The end time
     * @return {Integer} The time difference in minutes
     */
    _getTimeDifference: function(startTime, endTime) {
        var milliseconds = startTime > endTime ? (startTime.milliseconds() - endTime.milliseconds()) :
        endTime.milliseconds() - startTime.milliseconds();
        return Math.round((milliseconds/1000)/60);
    },
    /**
     * Creates the visble elements that will be visible on the screen
     */
    _createVisible: function(maxWith) {
        this._element = new Element("div", {
            "style": "width:"+maxWith+"px"
        });
    }
});
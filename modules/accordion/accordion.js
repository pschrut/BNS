/*
 * @fileoverview accordion.js
 * Contains the definition and implementation of accordion, This module show and hide divs using another div
 * as a toggle
 */


/*
 * if the scriptaculous modules are not loaded the system throws an error
 */
if (typeof Effect == 'undefined') 
	throw("accordion.js requires including script.aculo.us' effects.js library!");

/*
 * @class accordion
 * @desc This class takes few divs and make them look like an accordion
 */
var Accordion = Class.create({

    /*
    * @name showAccordion
    * @type Element
    * @desc Used to know wich accordion is currently being opened
    */
    showAccordion: null,
    /*
    * @name currentAccordion
    * @type Element
    * @desc Used to know wich accordion is currently being changed
    */
    currentAccordion: null,
    /*
    * @name duration
    * @type Integer
    * @desc Variable to control the duration of the animations applied to the accordion
    */
    duration: null,
    /*
    * @name effects
    * @type Array
    * @desc It will contain the Effect objects to apply to the accordion's Elements
    */
    effects: [],
    /*
    * @name animating
    * @type boolean
    * @desc used to avoid double animating the accordion
    */
    animating: false,

    /*
    * @method initialize
    * @desc Creates the accordion, and adds the events for the divs
    * @param container {String} The div which contain the accordion divs
    * @param options {JSON} The accordion options
    */
    initialize: function(container, options) {
        // If the container is not defined the system thows and error 
        if (!$(container)) {
            throw (container + " doesn't exist!");
            return false;
        }
        /*
        * @name options
        * @type JSON
        * @desc JSON object containing the default options or the user defined ones.
        */
        this.options = Object.extend({
            /*
            * @name options.resizeSpeed
            * @type Integer
            * @desc used to calculate the speed on resizing the accordion
            */
            resizeSpeed: 8,
            /*
            * @name options.classNames
            * @type JSON 
            * @desc JSON object containing the names of the classes to be applied to
            * 		 the accordion elements
            */
            classNames: {
                /*
                * @name options.classNames.toggle
                * @type String
                * @desc class to be applied to the closed accordions
                */
                toggle: 'accordion_toggle',
                /*
                * @name options.classNames.toggleActive
                * @type String
                * @desc class to be applied to the opened accordions
                */
                toggleActive: 'accordion_toggle_active',
                /*
                * @name options.classNames.content
                * @type String
                * @desc class to be applied to the content of the accordion
                */
                content: 'accordion_content'
            },
            /*
            * @name options.defaultSize
            * @type JSON
            * @desc JSON object containing default height and width for the accordion
            */
            defaultSize: {
                height: null,
                width: null
            },
            /*
            * @name direction
            * @type String
            * @desc Wether the accordion will expand on width or height
            */
            direction: 'vertical',
            /*
            * @name onEvent
            * @type String
            * @desc name of the event that will activate the accordion.
            */
            onEvent: 'click',
            /*
            * @name actionCallback
            * @type function
            * @desc This callback function every time a click event happens
            */
            actionCallback: function() { },
            table: false
        }, options || {});
        // Defining the duration of the effects 
        this.duration = ((11 - this.options.resizeSpeed) * 0.15);
        // Get the main accordions(elements with class "according_toggle")
        var accordions = $$('#' + container + ' .' + this.options.classNames.toggle);
        var maxHeight=0;
        //for every accordion, create an event and change options
        accordions.each(function(accordion) {
            //if the user clicks on an accordion, the accordion behaviour is modified
            accordion.observe(this.options.onEvent, this.activate.bindAsEventListener(this, accordion), false);
            if (this.options.onEvent == 'click') {
                accordion.onclick = function() { return false; };
            }
            //specify size of the accordion in accordance with the direction accordion
            if (this.options.direction == 'horizontal') {
                var options = { width: '0px' };
                var oldHTML = accordion.innerHTML.gsub("\n","").gsub("  ","");
                accordion.innerHTML = toVerticalString(oldHTML);               
                if(accordion.clientHeight > maxHeight)
                    maxHeight = accordion.clientHeight;
            } else {
                var options = { height: '0px' };
            }
            //add the options
            Object.extend(options, { display: 'none' });
            //apply the options to the accordion
            if (accordion.next(0))
                this.currentAccordion = $(accordion.next(0)).setStyle(options);
        } .bind(this));
        if (this.options.direction == 'horizontal') {
            accordions.each(function(accordion) {
                $(accordion).setStyle({height: maxHeight+'px'});
            } .bind(this));
        }    
    },

    /*
    * @method activate
    * @desc This method activates the accordion behaviour
    * @param accordion {Element} The accordion to be activated
    */
    activate: function(event, accordion) {
        if (this.animating) {
            return false;
        }
        //initialize the array that is going to contain effect objects to apply to the accordion elements
        this.effects = [];
        //get the object with the content of the first accordion
        this.currentAccordion = $(accordion.next(0));

        if (this.options.table) {
            if (Prototype.Browser.IE)
                this.currentAccordion.style.display = '';
            else
                this.currentAccordion.setStyle({
                    display: 'table-row'
                });
        }
        else
            this.currentAccordion.setStyle({
                display: 'block'
            });
        //change the class of the main accordion	
        this.currentAccordion.previous(0).addClassName(this.options.classNames.toggleActive);
        //change the scale in accordding with the direction accordion
        if (this.options.direction == 'horizontal') {
            this.scaling = {
                scaleX: true,
                scaleY: false
            };
        } else {
            this.scaling = {
                scaleX: false,
                scaleY: true
            }
        }
        if (!this.options.multiple) {
            //if the content of the accordion clicked is shown, hide it
            if (this.currentAccordion == this.showAccordion) {
                this.deactivate();
                //if the content of the accordion clicked isn't shown, show it  
            } else {
                this._handleAccordion();
            }
        }
        else {
            if (this.options.direction != 'horizontal') {
                //if the content of the accordion clicked is shown, hide it
                if (event.findElement().next(0).getHeight() > 0) {
                    this.deactivate(event);
                    //if the content of the accordion clicked isn't shown, show it  
                } else {
                    this._handleAccordion(event);
                }
            }
            else {
                if (event.findElement().next(0).getWidth() > 0) {
                    this.deactivate(event);
                    //if the content of the accordion clicked isn't shown, show it  
                } else {
                    this._handleAccordion(event);
                }
            }
        }
    },
    /*
    * @method deactivate
    * @desc deactivates the accordion
    */
    deactivate: function(event) {
        if(!Object.isEmpty(event))
            this.eventElement = event.findElement().next(0);
        else    
            this.eventElement = null;
        var options = {
            duration: this.duration,
            scaleContent: false,
            transition: Effect.Transitions.sinoidal,
            queue: {
                position: 'end',
                scope: 'accordionAnimation'
            },
            scaleMode: {
                originalHeight: this.options.defaultSize.height ? this.options.defaultSize.height : this.currentAccordion.scrollHeight,
                originalWidth: this.options.defaultSize.width ? this.options.defaultSize.width : this.currentAccordion.scrollWidth
            },
            afterFinish: function() {
                if (!this.options.multiple) {
                    this.showAccordion.setStyle({
                        height: '0px',
                        display: 'none'
                    });
                    this.showAccordion = null;
                }
                else {
                    if(!Object.isEmpty(this.eventElement))
                        this.eventElement.setStyle({
                            height: '0px',
                            display: 'none'
                        });
                }
                this.animating = false;
                this.options.actionCallback();
            } .bind(this)
        }
        Object.extend(options, this.scaling);
        if (!this.options.multiple) {
            this.showAccordion.previous(0).removeClassName(this.options.classNames.toggleActive);
            new Effect.Scale(this.showAccordion, 0, options);
        }
        else {
            event.findElement().removeClassName(this.options.classNames.toggleActive);
            new Effect.Scale(event.findElement().next(0), 0, options);
        }
    },
    /*
    * @method handleAccordion
    * @desc Handle the open/close actions of the accordion
    */
    _handleAccordion: function(event) {
        //initialize options of the accordion 
        if(!Object.isEmpty(event))
            this.eventElement = event.findElement().next(0);
        else    
            this.eventElement = null;
        var options = {
            sync: true,
            scaleFrom: 0,
            scaleContent: false,
            transition: Effect.Transitions.sinoidal,
            scaleMode: {
                originalHeight: this.options.defaultSize.height ? this.options.defaultSize.height : this.currentAccordion.scrollHeight,
                originalWidth: this.options.defaultSize.width ? this.options.defaultSize.width : this.currentAccordion.scrollWidth
            },
            afterFinish: this.options.actionCallback
        };
        Object.extend(options, this.scaling);
        this.effects.push(
			new Effect.Scale(this.currentAccordion, 100, options)
		);
        if (!this.options.multiple) {
            //if there is other accordion opened
            if (this.showAccordion) {
                //change the style of the accordion that was opened
                this.showAccordion.previous(0).removeClassName(this.options.classNames.toggleActive);
                options = {
                    sync: true,
                    scaleContent: false,
                    transition: Effect.Transitions.sinoidal
                };
                Object.extend(options, this.scaling);
                this.effects.push(
				new Effect.Scale(this.showAccordion, 0, options)
			);
            }
        }
        // Creating the effect parallel
        new Effect.Parallel(this.effects, {
            duration: this.duration,
            queue: {
                position: 'end',
                scope: 'accordionAnimation'
            },
            beforeStart: function() {
                this.animating = true;
                if (this.options.direction == 'horizontal') {
                    var horizontalHeight = this.currentAccordion.previous().clientHeight;
                    $(this.currentAccordion).setStyle({
                        height: horizontalHeight+'px'
                    });
                }
            } .bind(this),
            afterFinish: function() {
                if (!this.options.multiple) {
                    if (this.showAccordion) {
                        this.showAccordion.setStyle({
                            display: 'none'
                        });
                    }
                }
                else {
                    if(!Object.isEmpty(this.eventElement))
                        this.eventElement.setStyle({
                            display: 'block'
                        });
                }
                if (this.options.direction != 'horizontal') {    
                    $(this.currentAccordion).setStyle({
                        height: 'auto'
                    });
                }    
                this.showAccordion = this.currentAccordion;
                this.animating = false;
            } .bind(this)
        });
    }
});
	
	
	
/* ******************************************************************* */
/* ******************************************************************* */
/* ******************************************************************* */
/* ******************************************************************* */
/* ******************************************************************* */
/* ******************************************************************* */
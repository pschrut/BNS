/**
 * @fileoverview menus.js
 * @description here are defined two new classes: menus and menuItem, that will handle
 * 		 		the left menus issues 
 */
/**
 * @constructor MenusHandler
 * @description Handles the left menus hiding and showing when needing.
 */
var MenusHandler = Class.create( {
    /**
     * @lends menus
     */
    
    /**
     * @type {Hash} 
     * @description relationships among left menu items ids and their classes names
     */
    menusClassNames : $H( {
        DETAIL : "MyDetails2",
        COMPAN : "MyCompanies",
        SELECT : "MySelections2",
        RELATE : "Related",
        CURTI  : "scm_MyCurrentTicket",
        TIGROU : "scm_TicketGrouping",
        TIACT : "scm_TicketAction",
        PLANS : "MyBenefits",
        KMMENU : "KMMENU",
        PERIOD: "ReviewPeriods",
        BUDGET: "Budgets" ,
        APPOUS: "OrgStatus",
        RESOPT: "ResultOptions",
        TAXSUG: "TaxonomySugestions",
        COMORG: "CompOrgUnits",
        FASTEN: "FastEntryMenu",
		PM_PGROU: "PM_processGrouping"
    }),
    /**
     * @type {Integer}
     * @description max number of menus.
     */
    maxMenuNumber : null,
    /**
     * @type {Hash}
     * @description A hash containing an instance for each menu object. 
     */
    menusInstances : $H(),
    /**
     * @type {Array}
     * @description An array containing a group of containers which will contain each one
     * 				of the menus.
     */
    menusContainers : $A(),
    
    initialize : function() {
        this.maxMenuNumber = this.menusClassNames.size() + 1;
        this.initializeContainers();
        this.initializeMenus();
        //this will change the menus according to the application just opened.
        document.observe("EWS:openApplication_menus", this.onOpenApplication.bindAsEventListener(this));
    },
	
    /**
	 * @description Handles when an EWS:openApplication is fired. The way the MenusHandler class
	 * 				reacts to this EWS:openApplication depends on the "mode" argument passed to 
	 * 				the event firing.
	 * 				<ul>
	 * 					<li><code>mode: "popUp"</code> (Pop up mode: no menus)</li>
	 * 					<li><code>mode: "sub"</code> (Sub application mode: original application menus plus the sub application ones</li>
	 * 				</ul>
	 * 				if no mode specified the default one is shown.
	 * @param 		{Event}
	 */
    onOpenApplication : function(app) {
        if (app.tabId != "POPUP") {
            this.numberOfMenus = global.fixedLeftMenus.size();
            this.selectMenuItems(app);
        }
    },
	
    /**
	 * Creates an instance for each one of the menus.
	 */
    initializeMenus : function() {
        this.menusClassNames.each(function(menu) {
            if (global.leftMenusList.get(menu.key)) {
                var collapsed = global.leftMenusList.get(menu.key).get("collapsed") ? true : false;
                var options = {
                    title : menu.value,
                    collapseBut : true,
                    showByDefault : false,
                    onLoadCollapse : collapsed
                };
                if(window[menu.value]){
                    this.menusInstances.set(menu.key, new window[menu.value](menu.key, options));
                }
            } else if (global.fixedLeftMenus.include(menu.key)) {
                var container = global.fixedLeftMenus.indexOf(menu.key);
                var containerElement = this.menusContainers[container];
                containerElement.addClassName("menus_item_container");
                var options = {
                    title : menu.value,
                    collapseBut : true,
                    showByDefault : true,
                    onLoadCollapse : false,
                    targetDiv : containerElement
                };
                if(window[menu.value]){
                    this.menusInstances.set(menu.key, new window[menu.value](menu.key, options));
                }
            }
        }.bind(this));
    },
    /**
	 * Creates the needed containers inside the left menus area
	 */
    initializeContainers : function() {
        $A($R(0, this.maxMenuNumber - 1)).each(function(index) {
            this.menusContainers.push(new Element("div", {
                id : "fwk_menu_" + index
            }));
            $("menus").insert(this.menusContainers[index]);
        }.bind(this));
    },

    /**
	 *	@param application {String} The current application
	 *	@param mode {String} the mode in which the application will work
	 *	@description shows only the proper menus for the application chosen
	 */
    selectMenuItems: function(app) {
        //Open all menus related to this application
    	var tabId = global.getTabIdByAppId(app.appId);
    	if(tabId == "SUBAPP"){
    		tabId = global.getTabIdByAppId(global.currentApplication.appId);
    	}
        var menus = global.tabid_leftmenus.get(tabId) ? global.tabid_leftmenus.get(tabId) : null;
        
        document.fire("EWS:openMenu", $H( {
            menus : menus,
            app : app
        }));
    }
});

/**
 *	@constructor Menu
 *	@description represents every item to be showed in the menus
 *	@augments origin
 */
var Menu = Class.create(origin,
/**
* @lends Menu
*/
{
    /**
     * @type {Element}
     * @description the element representing the icon, will handle the minimize of the menu.
     */
    icon : null,
    /**
     * @type {Boolean}
     * @description Whether the menu is inserted in the DOM or not
     */
    inserted : false,
    /**
     * @type {unmWidget}
     * @description a widget which will handle the "menu" behaviors like max/minimize, contextual
     * 				menu, etc.
     */
    widget : null,
    /**
     * @type {Object}
     * @description Default widget options 
     */
    widgetOptions : {
        collapseBut : true,
        onLoadCollapse : false
    },
    /**
     *@type Integer
     *@description position for the left menu.
     */
    position : null,
    /**
     * @type {String}
     * @description In which application is the menu been executed.
     */
    application : null,
    /**
     * Initializes the menu object
     * @param {origin} $super a super class reference for the super class initialization
     * @param {String} id The menu ID
     * @param {Object} widgetOptions The options to initialize the widget as defined in the
     * 				   unmovable widget class. Should be extended when inheriting the menu
     * 				   class.
     */
    initialize : function($super, id, widgetOptions) {
        $super();
        this.widget = new unmWidget($H(widgetOptions));
        this.menuId = id;
        if (global.leftMenusList.get(id)) {
            this.position = global.leftMenusList.get(id).get("widRow");
        }
        if (widgetOptions.showByDefault) {
            this.show();
        } else {
            document.observe('EWS:openMenu', this.onOpenMenu.bindAsEventListener(this));
        }
    },
    /**
     * Function handler for the EWS:openMenu event
     * @param {Event} event
     */
    onOpenMenu : function(event) {
        var args = getArgs(event);
        //get the current opened application
        var app = args.get("app");
        if(app.tabId == "SUBAPP"){
        	app = global.currentApplication;
        }
        //menus to be opened
        var menus = args.get("menus");
        //get the position number for the menu (if any)
        var position = this.position - 1;
        
        var menuContainer = global.leftMenu.menusContainers[position];
        
        //if not menu container, exit to avoid fails
        if(!menuContainer){
        	return;
        }
        //if the menu has to be shown
        if(menus && menus.keys().include(this.menuId) || global.fixedLeftMenus.include(this.menuId)){
        	this.application = app;
        	//first close it
        	this.widget.close();
        	//and then open it again with it's layout prepared for the new application
        	menuContainer.addClassName("menus_item_container");
        	this.show(menuContainer, menus.get(this.menuId));
        	
        } else if(!menus || !global.fixedLeftMenus.include(this.menuId)) {
        	this.application = null;
        	this.inserted = false;
        	menuContainer.removeClassName("menus_item_container");
        	this.widget.close();
        }
    },
    /**
     * Changes the title to a menu
     * @param {String} newTitle
     */
    changeTitle : function(newTitle) {
        this.widget.refreshTitle(newTitle);
    },
    /**
     * Changes the content to a menu. Can receive both a String or an Element
     * @param {Object} content
     */
    changeContent : function(content) {
        this.widget.refreshContent(content);
    },
    /**
     * The class which wants to create a new menu has to override this
     * method and draw everything down the $super(element) call in order to be
     * sure that it's being shown in the screen;
     * @param {Element} element Where will the menu be shown
     * @param args The arguments for the menu showing
     */
    show : function(element, args) {
        this.widget.show(element);
    },
    
    addEmployeeColor: function(color) {
        var colorClass = 'eeColor' + color;
        var containerDiv = new Element('div');
        var html = "<div id='Up_border' class='upBorder_css " + colorClass + "'></div>"
        + "<div id='centralDiv' class='central_css " + colorClass + "'></div>"
        + "<div id='down_border' class='upBorder_css " + colorClass + "'></div>";
        containerDiv.insert(html);
        return containerDiv;
    },
	    
    removeEmployeeColor: function(colorDiv, color) {
        var colorClass = 'eeColor' + color;
        var up_border = colorDiv.down('[id=Up_border]');
        var central = colorDiv.down('[id=centralDiv]');
        var down_border = colorDiv.down('[id=down_border]');
        up_border.removeClassName(colorClass);
        up_border.addClassName('eeColor00');
        central.removeClassName(colorClass);
        central.addClassName('eeColor00');
        down_border.removeClassName(colorClass);
        down_border.addClassName('eeColor00');
    }
});

/**
 * @constructor EmployeeMenu
 * @description Parent class for menus which handle employee related data and events.
 */

var EmployeeMenu = Class.create(Menu, 
/**
 * @lends EmployeeMenu
 */
{
	/**
	 * Indexed list of all the color squares HTML elements for each one of the object ids
	 * @type Hash
	 */
	_colorElements: null,
	
	/**
	 * Indexed list for all the names HTML elements for each one of the object ids
	 * @type Hash
	 */
	_nameElements: null,
	
	/**
	 * Indexed list for all the selection elements for each one of the oject ids (both types,
	 * check box and radio button)
	 * @type Hash
	 */
	_selectElements: null,
	
	/**
	 * The html content for the menu
	 * @type Element
	 */
	_content: null,
	
	initialize: function($super,id, options){
		$super(id, options);
		this._content = new Element("div");
		this._colorElements = $H();
		this._selectElements = $H();
		this._nameElements = $H();
		//keeps all the menus inheriting from here synchronized about the employees selection
		document.observe("EWS:employeeMenuSync", this.menuSync.bind(this));
	},
	
	/**
	 * Initializes all the HTML elements needed for a list of employee ids.
	 */
	initializeElements: function(employeeIdList){
		employeeIdList.each(function(employeeId){
			this._initializeColorElement(employeeId);
			this._initializeSelectElement(employeeId);
			this._initializeNameElement(employeeId);	
		}.bind(this));
	},
	/**
	 * Initializes the color square for the given user
	 * @param {String} employeeId the employee to find its color
	 */
	_initializeColorElement: function(employeeId){
		
		//don't create an element twice
		if(this._colorElements.get(employeeId)){
			if(this._colorElements.get(employeeId).single.parentNode){
				this._colorElements.get(employeeId).single.remove();
			}
			if(this._colorElements.get(employeeId).multi.parentNode){
				this._colorElements.get(employeeId).multi.remove();
			}
			if(this._colorElements.get(employeeId).none.parentNode){
				this._colorElements.get(employeeId).none.remove();
			}
		}
		
		//initialize the element for the color square and store it
    var colorElementSingle = new Element("div", {
        id: 'my_details_single_' + employeeId + '_contextMenu'
    });
		colorElementSingle.insert(
				"<div class='eeColor00 upBorder_css'></div>" +
				"<div class='eeColor00 central_css'></div>" + 
				"<div class='eeColor00 upBorder_css'></div>"
		);
    //<elemento>.observe('click', this.<nombrefuncion>.bindAsEventListener(this));
    var selectionType = 'single';
    colorElementSingle.observe('click', this.contextLeftMenu.bindAsEventListener(this, employeeId, selectionType, colorElementSingle));

    var colorElementMulti = new Element("div", {
        id: 'my_details_multi_' + employeeId + '_contextMenu'
    });
		colorElementMulti.insert(
				"<div class='eeColor00 upBorder_css'></div>" +
				"<div class='eeColor00 central_css'></div>" + 
				"<div class='eeColor00 upBorder_css'></div>"
		);
    var selectionType = 'multi';
    colorElementMulti.observe('click', this.contextLeftMenu.bindAsEventListener(this, employeeId, selectionType, colorElementMulti));

    var colorElementNone = new Element("div", {
        id: 'my_details_none_' + employeeId + '_contextMenu'
    });
		colorElementNone.insert(
				"<div class='eeColor00 upBorder_css'></div>" +
				"<div class='eeColor00 central_css'></div>" + 
				"<div class='eeColor00 upBorder_css'></div>"
		);
    var selectionType = 'none';
    colorElementNone.observe('click', this.contextLeftMenu.bindAsEventListener(this, employeeId, selectionType, colorElementNone));

		//different for single and multiselection since it makes things easier
		this._colorElements.set(employeeId, {
			single: colorElementSingle,
			multi: colorElementMulti,
			none: colorElementNone
		});
	},
	/**
* Method to show the ballon of the contextLeftmenu
* @param employeeId the employeeId to identify the button clicked
selectionType is the type of selection to identify de button clicked
* @return 
*/
contextLeftMenu: function(evt, employeeId, selectionType, element) {


    //make ajax request sending the inxml

    var xmlOverview = "<EWS>"
                        + "<SERVICE>GET_CON_ACTIO</SERVICE>"
                        + "<OBJECT TYPE='P'>" + employeeId + "</OBJECT>" //example of employeeId = 30000634
                        + "<PARAM>"
                            + "<CONTAINER>DETAILS</CONTAINER>"
                            + "<MENU_TYPE>L</MENU_TYPE>"
                            + "<A_SCREEN>*</A_SCREEN>"
                        + "</PARAM>"
                        + "<DEL/>"
                        + "</EWS>";
                        /*
    this.makeAJAXrequest($H({
        xml: xmlOverview,
        //successMethod: this.fillBalloon.bind(this, employeeId, selectionType)
        successMethod: this.fillContextMenu.bind(this, employeeId, selectionType, evt, element)
    }));
*/
},

/**
* Method to fill the contextLeftmenu with the Json(SaP)info
* @param employeeId the employeeId to identify the person 
json is the json object with the info to fill the ballon
* @return 
*/
fillContextMenu: function(employeeId, selectionType, myevent, element, json) {
    var counter = 0;
    var mArray=[];
    if (json.EWS.o_actions) {
        objectToArray(json.EWS.o_actions.yglui_vie_tty_ac).each(function(action) {
            var actionArray = action["@actiot"].split('((L))');
            //if action[1] is not defined, we label the hole text as a link. some actions are not labeled.
            var actionText;
            if (!actionArray[1]) {
                var actionText =  actionArray[0] ;
            }
            else {
                var actionText = actionArray[0] +  actionArray[1] +  actionArray[2];
            }
            var mfunction = function() {
                global.open($H({
                    app: {
                        appId: action['@tarap'],
                        tabId: action['@tartb'],
                        view: action['@views']
                    }
                }));
            } .bind(this)
            var h1 = new Hash({ id: counter + 1, text: actionText, children: null, callback: mfunction });
            if (h1) {
                mArray[counter] = h1;
                counter += 1;
            }

        } .bind(this));
    }
    if (mArray[0]) {
        mContextMenu.setContent(mArray);

        //show the main menu
        mContextMenu.showMainMenu(myevent);
    }
},

/**
	 * Method to be overwritten returning the right HTML element with the employee name
	 * @param {String} employeeId the employeeId to get its name 
	 * @return the right HTML element with the employee
	 */
	_initializeNameElement: function(employeeId){
	},
	
	_initializeSelectElement: function(employeeId){
		
		//don't create the elements twice.
		if(this._selectElements.get(employeeId)){
			if(this._selectElements.get(employeeId).radio.parentNode){
				this._selectElements.get(employeeId).radio.remove();
			}
			if(this._selectElements.get(employeeId).checkbox.parentNode){
				this._selectElements.get(employeeId).checkbox.remove();
			}
		}
		
		//initialize the elements for the selection (both radio and check box)
		var checkbox = new Element("input", {
			"type": "checkbox",
			"value": employeeId
		});
		
		checkbox.observe("click", this.onClickSelect.bindAsEventListener(this, employeeId));
		
		var radio = new Element("input", {
			"type": "radio",
			"name": "ews_employeeSelection",
			"value": employeeId
		});
		
		radio.observe("click", this.onClickSelect.bindAsEventListener(this, employeeId));
		
		//store the radio button and the checkbox
		this._selectElements.set(employeeId, {
			radio: radio,
			checkbox: checkbox
		});
	},
	
	/**
	 * Provides the basic synchronization mechanism between the menus
	 */
	menuSync: function(event){		
		
	},
	
	/**
	 * Function to handle clicks on employee selection menus
	 */
	onClickSelect: function(event, employeeId){
		
		var selectedStatus = $F(event.element()) != null;
		
		if(global.employeeIsSelected(employeeId) && !selectedStatus){
			global.setEmployeeSelected(employeeId, false);
		}else if(!global.employeeIsSelected(employeeId) && selectedStatus){
			global.setEmployeeSelected(employeeId, true);
		}
		
	},
	
	/**
	 * Puts the menu content inside the widget
	 */
	renderMenu: function(){
		this.changeContent(this._content);
	},
	
	/**
	 * Selects an employee
	 * @param {String} employeeId the object id for the employee that is going to be selected
	 */
	select: function(event, employeeId){
		if(!employeeId){
			employeeId = event;
		}
		
		//update the menus
		this.toggleColor(employeeId);
		if(event == employeeId){
			if(global.getSelectionType(this.application) == "multi"){
				this._selectElements.get(employeeId).checkbox.checked = true;
			}else if(global.getSelectionType(this.application) == "single"){
				this._selectElements.get(employeeId).radio.defaultChecked = true;
				this._selectElements.get(employeeId).radio.checked = true;
			}
		}
	},
	
	/**
	 * Shows the menu on the proper location
	 * @param {Element} element the HTML element where the menu has to be shown.
	 */
	show: function($super, element){
		$super(element);
	},
	
	/**
	 * Renders a little square by the employee name with the proper color
	 * @param {String} employeeId The id for the employee
	 */
	toggleColor: function(employeeId){
		var color = global.getColor(employeeId);
		var elements = this._colorElements.get(employeeId)[global.getSelectionType(this.application)].select("div");
		
		elements.each(function(e){
			if(global.employeeIsSelected(employeeId)){
				e.removeClassName("eeColor00");
				e.addClassName("eeColor" + color.toPaddedString(2));
			}else{
				e.addClassName("eeColor00");
				e.removeClassName("eeColor" + color.toPaddedString(2));
			}
		});
	},
	
	/**
	 * Unselects an employee
	 * @param {String} employeeId the object id for the employee that is going to be unselected
	 */
	unselect: function(event, employeeId){
		
		if(!employeeId){
			employeeId = event;
		}
		//update the menus.
		this.toggleColor(employeeId);
		if(event == employeeId){
			if(global.getSelectionType(this.application) == "multi"){
				this._selectElements.get(employeeId).checkbox.checked = false;
			}else if(global.getSelectionType(this.application) == "single"){
				this._selectElements.get(employeeId).radio.defaultChecked = false;
				this._selectElements.get(employeeId).radio.checked = false;
			}
		}
	}
});
/**
 * Contains all the functionalities for creating the top navigation
 * menus. It takes the list of menus, subMenus, topLeftMenus and tabs and draws
 * it on the screen letting the user to click on those buttons and navigate
 * through the applications.
 * @fileOverview appNavigation.js
 */
/**
 * Contains all the functionalities for creating the applications
 * navigation menu. It takes the Applications structure and generates the buttons,
 * and creates the navigation process.
 * @constructor
 * @augments origin
 */
var appNavigation = Class.create(origin,
/**
* @lends appNavigation
*/
{
tabsContainer: $('fwk_5_bottom'),
/**
* Stores the current application button selected
*/
activeApp: null,
/**
* Stores the current sub application button selected
*/
activeSubApp: null,
/**
* Stores the current active tabs
*/
activeTabs: null,
/**
* Current active submenu
*/
activeSubMenu: null,
/**
* Stores the navigation element indexed by the application name
*/
appList: $H(),
/**
* initializes the class functionalities. Creates the top menu,
* the standard menu and start listening to the openApplication event
*/
initialize: function () {
    this.navigationData = global.navigationData;
    //Creating the topMenu
    this.createTopMenu();
    //Creating the navigation menu
    this.openApplication = true;
    //coment by SC
    this.createStandardMenu();
    //end of comment

    //Listen to the open application event to modify the tabs and menus
    //status when required
    //this.applicationOpenBinded = this.applicationOpen.bind(this);
    //document.observe('EWS:openApplication', this.applicationOpenBinded);
    //Listen to the appNavTabClicked to open the required application
    document.observe('EWS:appNavTabClicked', this.makeOpenApplication.bind(this));
},
/**
* Creates the top left menu
*/
createTopMenu: function () {
    //Getting the topMenu items from the hash
    this.navigationData.get('topMenu').each(function (item) {
        var aux = new rightTopNavigationElement({
            type: 'rightTop',
            app: item.value.get("tabs") ? item.value.get("tabs").keys().first() : item.key,
            id: 'topMenu_rightTopLevel_' + item.key,
            text: item.value.get('name'),
            className: 'topMenu_rightTopMenu_text'
        }, this);
        //Get the tabs data for this navigation element
        var tabs = item.value.get('tabs');
        var path = {
            topMenuApp: item.key
        };
        //Create the tabs module for this navigation element
        if (tabs != undefined) {
            var auxTabs = this.createTabs(item, tabs, path);
            //Assign the menu element the just created tabs and ids.
            item.value.set('tabsElement', auxTabs.tabs);
            item.value.set('tabsIds', auxTabs.ids);
            aux.notFireEvent = true;
        }
        //define the callback function for the navigation element click event
        aux.clickCallback = this.topMenuCallback.bind(this, item);
        aux.menuElement.setStyle({
            cursor: 'pointer'
        });
        item.value.set('navigationElement', aux);
        //Inserting the generated element on the document
        $('banner').insert(aux.element);
    } .bind(this));
},
/**
* Callback function called when the user clicks on the top menu
*/
topMenuCallback: function () {
    var args = $A(arguments);
    //    if (args[0][0] == "LOGOFF") {
    //        var location = window.location.protocol + "//";
    //        location += window.location.host + "/";
    //        location += "sap/bc/bsp/sap/system/logoff.htm";
    //        window.location = location;
    //    }
    //Hide the actual tabs
    if (args[0][0] != "LOGOFF") {
        if (this.activeTabs)
            this.activeTabs.hide();
        if (args[1] !== false)
            this.launchTab(args[0]);



        //show the tabs if they're inserted
        var tabsContainer = $('floatingTabs' + args[0].key);
        if (tabsContainer) {
            this.activeTabs = tabsContainer.show();
        }
        //set the current opened app as active so it can be clicked
        //again
        if (this.activeApp) {
            this.activeApp.enable();
            this.activeApp.unSelected();
        }
        //Hide the submenu for the current area
        if (this.activeSubMenu)
            this.hideSubMenu(this.activeSubMenu);
    }
    else {
        global.open($H({
            app: {
                appId: "LOGOFF"
            }
        }));
    }
},
/**
* Creates the standard applications menu
*/
createStandardMenu: function () {
    //Creating the applications container
    this.leftMenu = new Element('div', {
        id: 'topMenu_left_menu_div',
        className: 'topMenu_left_menu_div'
    });
    //Creating the sub applications container
    this.rightMenu = new Element('div', {
        id: 'topMenu_right_menu_div',
        className: 'topMenu_right_menu_div'
    });
    $('top').insert(this.leftMenu).insert(this.rightMenu);
    
    //added by SC, 2012-04-16
    this.leftMenu.hide()
    this.rightMenu.hide()
    //end

    //Creating the left menu (Main navigation menu)
    this.createLeftMenu();
},
/**
*
*/
createLeftMenu: function () {
    if (!this.navigationData.get('mainMenu')) {
        return
    }
    //Creating each of the buttons
    this.navigationData.get('mainMenu').each(function (item) {
        var aux = new navigationElement({
            className: 'topMenu_application_' + item.key,
            text: item.value.get('name'),
            target: 'topMenu_right_menu_div',
            id: 'topMenu_application_' + item.key,
            type: 'high',
            app: item.key
        }, this);
        //Hiding the button text (It will be displayed on hover on when the element is selected)
        aux.hideText();
        //Adding extra functionalities to the click action
        aux.clickCallback = function () {
            var args = $A(arguments);
            //Deselecting the last selected application
            if (this.activeApp) {
                //Make it clickable again
                this.activeApp.enable();
                //Hides the text and sets the default className
                this.activeApp.unSelected();
            }
            //Setting the current app as the active
            this.activeApp = args[0].value.get('navigationElement');
            if (args[0].value.get('appId') == undefined)
            //Displaying contained sub menus
                this.displaySubMenu(args[0].value.get('subMenu'), true);
        } .bind(this, item);
        //Storing the generated button on the menus structure
        item.value.set('navigationElement', aux);
        //Inserting the button on the document
        this.rightMenu.insert(aux.element);
        //Generating the sub menu for this item
        var subMenu = item.value.get('subMenu');
        if (subMenu != undefined) {
            aux.launchApp = false;
            //Going through all the sub applications and painting it
            subMenu.each(function (subItem) {
                //Generating the navigation button
                var id = subItem.value.get('appId') ? subItem.value.get('appId') : subItem.key;
                var aux = new navigationElement({
                    className: 'topMenu_application_' + subItem.key,
                    text: subItem.value.get('name'),
                    target: 'topMenu_left_menu_div',
                    id: 'topMenu_application_' + subItem.key,
                    type: 'low',
                    parent: item.key,
                    app: id
                }, this);
                //Getting the item path on the applications structure
                var path = $H({
                    mainApp: item.key,
                    subApp: id
                });
                //Storing the reference to the element by appId as index
                if (subItem.value.get('appId') != undefined)
                    this.appList.set(subItem.value.get('appId'), path);
                //Hidding the element (Will be shown when clicking on the application containing it)
                aux.element.hide();
                //Hidding the text
                aux.hideText();
                //Storing the button object on the applications structure
                subItem.value.set('navigationElement', aux);
                //Setting extra functionality on the click action
                aux.clickCallback = this.standardMenuCallback.bind(this, aux);
                var tabs = subItem.value.get('tabs');
                if (tabs != undefined) {
                    var auxTabs = this.createTabs(subItem, tabs, path);
                    subItem.value.set('tabsElement', auxTabs.tabs);
                    subItem.value.set('tabsIds', auxTabs.ids);
                    aux.notFireEvent = true;
                }
            } .bind(this));
        }
    } .bind(this));
},
/**
* Callback function called when the user clicks on a standar menu button
*/
standardMenuCallback: function () {
    var args = $A(arguments);
    //Enabling and hidding the text of the last selected application
    if (this.activeSubApp) {
        if (args[0].app == this.activeSubApp.app)
            return;
        this.activeSubApp.enable();
        this.activeSubApp.unSelected();
    }
    //Hidding the last active tabs
    var notLaunchTabs = false;
    if (this.activeTabs) {
        if ('floatingTabs' + args[0].app == this.activeTabs.id)
            notLaunchTabs = true;
        else
            this.activeTabs.hide();
    }
    //Showing the current application tabs (If exists)
    if ($('floatingTabs' + args[0].app) && !notLaunchTabs) {
        this.activeTabs = $('floatingTabs' + args[0].app).show();
        //var path = this.appList.get(args[0].app);
        var subMenu = this.navigationData.get('mainMenu').get(args[0].parent).get('subMenu').get(args[0].app);
        //Calling the application corresponding to the selected tab
        this.launchTab({
            value: subMenu
        });
    }
    //Setting the current application as the selected one
    this.activeSubApp = args[0];
},

/**
* Executed when a new application is opened.
* @param {} args
*/
applicationOpen: function (args) {
    var appId = args.app;
    var mode = args.mode;
    var path = this.appList.get(appId);
    //stop if the application isn't opened on normal mode or if there's no
    //path to it (which means no changes in the menus are needed)
    if (Object.isUndefined(path) || mode)
        return;

    //Handle if it's a top menu application (the one with the logoff)
    if (!Object.isUndefined(path.topMenuApp)) {
        //document.stopObserving('EWS:openApplication', this.applicationOpenBinded);
        var aux = this.navigationData.get('topMenu').get(path.topMenuApp).get('navigationElement');
        aux.clickCallback(false);
        //document.stopObserving('EWS:openApplication', this.applicationOpenBinded);
        //this.makeOpenApplication(appId);
        this.launchTab({
            value: this.navigationData.get('topMenu').get(path.topMenuApp)
        }, appId, true);
        //document.observe('EWS:openApplication', this.applicationOpenBinded);
    }
    //Handle if it's a right menu application (the on with the different areas)
    else {
        var subMenu = this.navigationData.get('mainMenu').get(path.get('mainApp')).get('subMenu');
        if (this.activeApp) {
            //Make it clickable again
            this.activeApp.enable();
            //Hides the text and sets the default className
            this.activeApp.unSelected();
        }
        this.activeApp = this.navigationData.get('mainMenu').get(path.get('mainApp')).get('navigationElement');
        this.activeApp.disable();
        this.activeApp.selected();
        this.displaySubMenu(subMenu, true, path.get('subApp'), true, appId);
    }
    if (!this.openApplication)
        this.openApplication = true;
},
/**
*
* @param {} subMenu
* @param {} notFireOpenApp
* @param {} app
* @param {} fromOpenApp
* @param {} appId
*/
displaySubMenu: function (subMenu, notFireOpenApp, app, fromOpenApp, appId) {
    if (this.activeSubMenu)
        this.hideSubMenu(this.activeSubMenu);
    var defaultSubMenu;
    subMenu.each(function (item) {
        if (!defaultSubMenu)
            defaultSubMenu = item;
        item.value.get('navigationElement').show();
    });
    if (app)
        defaultSubMenu = {
            value: subMenu.get(app)
        };
    if (defaultSubMenu.value == undefined)
        return;

    if (notFireOpenApp)
        defaultSubMenu.value.get('navigationElement').launchApp = false;
    if (defaultSubMenu.value.get('tabsElement') != undefined) {
        if (this.activeTabs)
            this.activeTabs.hide();
        this.activeTabs = $('floatingTabs' + defaultSubMenu.value.get('navigationElement').app).show();
        this.launchTab(defaultSubMenu, appId, fromOpenApp);
    }
    else {
        this.activeTabs.hide();
    }
    defaultSubMenu.value.get('navigationElement').clicked();
    defaultSubMenu.value.get('navigationElement').launchApp = true;
    this.activeSubMenu = subMenu;
},
/**
*
* @param {} defaultSubMenu
* @param {} switchTo
* @param {} fromOpenApp
*/
launchTab: function (defaultSubMenu, switchTo, fromOpenApp) {
    if (defaultSubMenu.value.get('tabsElement') == undefined)
        return;
    var index = defaultSubMenu.value.get('tabsElement').currentSelected;
    if (index == undefined || index == -1 || isNaN(index))
        index = 0;
    //document.stopObserving('EWS:openApplication', this.applicationOpenBinded);
    var id = (defaultSubMenu.value.get('tabsIds') ? defaultSubMenu.value.get('tabsIds') : defaultSubMenu.value.get('ids'))[index];
    if (switchTo)
        var toShow;

    var _iterator = function (item, index) {
        if (item == switchTo)
            toShow = index;
    };
    //get the tab to which it will switch
    if (defaultSubMenu.value.get('tabsIds')) {
        defaultSubMenu.value.get('tabsIds').each(_iterator);
    } else {
        defaultSubMenu.value.get('ids').each(_iterator);
    }

    if (toShow > -1) {
        //Switch to the proper tab unless is the same as the current one
        var tabId = (defaultSubMenu.value.get('tabsIds') ? defaultSubMenu.value.get('tabsIds') : defaultSubMenu.value.get('ids'))[toShow];
        //if(id != tabId)
        defaultSubMenu.value.get('tabsElement').openTab(tabId);

    }
    //if there's not a tab to switch to, go the the default one
    else {
        defaultSubMenu.value.get('tabsElement').goTo(id);

    }

    //Open the application if needed
    if (!fromOpenApp)
        this.makeOpenApplication(tabId ? tabId : id);
    //document.observe('EWS:openApplication', this.applicationOpenBinded);
},
/**
* Opens the required aplication when a tab has been clicked
* @param {String|Event} app The name of the app to be opened or an event
*          containing this name on its memo attribute
*/
makeOpenApplication: function (app) {
    //Open the application if it's not the current one
    app = getArgs(app);
    if (this.openApplication && global.currentApplication.appId != app) {
        global.open($H({
            app: {
                appId: app
            }
        }));
    }
},
/**
* Hides a submenu
* @param {Hash} subMenu the submenu that will be hidden
*/
hideSubMenu: function (subMenu) {
    if (this.activeSubMenu)
        subMenu.each(function (item) {
            item.value.get('navigationElement').hide();
        });
},
/**
* @description Creates the tabs structure
* @param {Hash} element
* @param {Hash} tabs
* @param {String} path
* @return {JSON} gives back the Tabs object that has been created and an
*          Array with the appIds which react to this tabs.
*/
createTabs: function (element, tabs, path) {
    var labels = [];
    var ids = [];
    //put the tabs in the proper format to be used by the tabs module
    tabs.each(function (tab) {
        labels.push(tab.value.get('name'));
        ids.push(tab.value.get('appId'));
        this.appList.set(tab.value.get('appId'), path);
    } .bind(this));
    //Create the container for the tabs and insert it into the document
    var floatingTabs = new Element('div', {
        className: 'appNavigation_floatingTab',
        name: 'floating',
        id: 'floatingTabs' + element.key
    });
    this.tabsContainer.insert(floatingTabs, {
        position: 'top'
    });
    //Create an object containing the options for the tabs and create the
    //tabs object which will be inserted in the previous container. Then
    //the tabs are hidden
    var options = $H({
        labels: labels,
        ids: ids,
        events: $H({
            onTabClicked: 'EWS:appNavTabClicked'
        }),
        active: 1,
        firstRun: 'n',
        mode: 'normal',
        target: 'floatingTabs' + element.key,
        callback: Prototype.emptyFunction
    });
    var appNavtab = new Tabs(options);
    floatingTabs.hide();
    this.tabsContainer.insert(floatingTabs, {
        position: 'top'
    });
    //Return the Tabs object created and the ids of the applications
    return {
        tabs: appNavtab,
        ids: ids
    };
}
});

/**
 * This class represents a right navigation element
 * @constructor rightTopNavigationElement
 */
var rightTopNavigationElement = Class.create(
/**
 * @lends rightTopNavigationElement
 */
{
    /**
     * Where the navigation element has to be inserted
     * @type String 
     */
    targetDiv: 'banner',
    /**
     * The Element object that keeps the navigation element html
     * @type Element
     */
    element: null,
    /**
     * Template object to easily create the navigation element html
     * @type Template
     */
    html: new Template("<button class='link application_main_text #{className}'>#{text}</button>"),
    /*
     * Navigation element type, in this case: 'rightTop'
     * @type String
     */
    type: null,
    /**
     * Navigation element type, in this case: 'rightTop'
     * @type String
     */
    app: null,
    /**
     * Root html element id related to the element navigation element
     * @type String
     */
    id: null,
    /**
     * Function which will be called when the user performs a click over the
     * menu element
     * @type Function
     */
    clickCallback: null,
    /*
     * The menu element itself
     * @type Element
     */
    menuElement: null,
    /**
     * rightTopNavigationElement constructor
     * @param {JSON} options
     * @param {Object} parentObject
     */
    initialize: function(options,parentObject){
        //Initialize options
        this.parentObject = parentObject;
        this.type = options.type;
        this.app = options.app;
        this.id = options.id;
        //create the container for the menu element.
        this.element = new Element('div',{
            id: this.id,
            className: 'topMenu_rightTopNavigationElement'
        });
        //insert the menu element inside the container
        this.element.update(this.html.evaluate(options));

        this.obj = {
            fx: function() {
                this.unSelected();
            }.bind(this)
        };
        this.obj.bfx = this.obj.fx.bindAsEventListener(this.obj);
        this.clk = {
            fx: function() {
                this.clicked();
            }.bind(this)
        };
        //observe the needed events
        this.clk.bfx = this.clk.fx.bindAsEventListener(this.clk);
        this.menuElement = this.element.down();
        this.menuElement.observe('click',this.clk.bfx);
        this.menuElement.observe('mouseover',this.selected.bind(this));
        this.menuElement.observe('mouseout',this.obj.bfx);
    },
    /**
     * Sets the navigation element�s activated skin
     */
    selected: function(){
        this.menuElement.addClassName('topMenu_text_selected');
    },
    /**
     * Sets the navigation element�s deactivated skin
     */
    unSelected: function(){
        this.menuElement.removeClassName('topMenu_text_selected');
    },
    /**
     * The navigation element has been clicked, so the
     * appNavigation selectElement class method has to be run(this event
     * makes it run)
     */
    clicked: function(){
        if(typeof this.clickCallback == "function"){
            this.clickCallback();
        }
        /*if (this.app) {
            //When the log off application is clicked just close the browser
            if(this.app == 'LOGOFF') {
            	var location = window.location.protocol + "//";
            	location += window.location.host + "/";
            	location += "sap/bc/bsp/sap/system/logoff.htm";
            	window.location = location;
            }
    }*/
        this.selected();
    }
});

/**
 * 
 * @constructor navigationElement
 */

var navigationElement = Class.create(
/**
 * @lends navigationElement
 */
{
    /**
     * The Element object that keeps the navigation element html
     * @type Element
     */
    element: null,
    /**
     * Template object to easily create the navigation element html
     * @type Template
     */
    html: new Template(  "<div class='topMenu_navigationElement_div_up #{className}'></div>" +
        "<div class='topMenu_navigationElement_div_down'><span class='application_main_text topMenu_text'>#{text}</span></div>"),
    /**
     * The class name for the inactive menu item
     * @type {String}
     */
    skinActive: null,
    /**
     * The class name for the inactive menu item
     * @type {String}
     */
    skinInactive: null,
    /*
     * Navigation element type, in this case: 'rightTop'
     * @type String
     */
    type: null,
    /**
     * Root html element id related to the element navigation element
     * @type String
     */
    id: null,
    /**
     * Menu containing this submenu
     * @type {String}
     */
    parent: null,
    /**
     * Navigation element type, in this case: 'rightTop'
     * @type String
     */
    app: null,
    /**
     * The menu type
     * @type {String}
     */
    active: null,
    /**
     * Function which will be called when the user performs a click over the
     * menu element
     * @type Function
     */
    clickCallback: null,
    /*
     * The menu element itself
     * @type Element
     */
    menuElement: null,
    /**
     * Initializes the navigation element with the proper options
     * @param {JSON} options the options for the navigation element
     * @param {appNavigation} parentObject the appNavigation object from which
     *        this object is being created.
     */
    initialize: function(options, parentObject){
        this.parentObject = parentObject;
        this.app = options.app;
        this.id = options.id;
        this.launchApp = options.launchApp == undefined ? true : options.launchApp;
        this.active = false;
        this.notFireEvent = false;
        this.element = new Element('div',{
            id:this.id,
            className:'topMenu_navigationElement'
        });
        this.element.update(this.html.evaluate(options));
        $(options.target).insert(this.element);
        this.skinInactive = options.className;
        this.skinActive = this.skinInactive + '_active';
        this.type = options.type;
        this.parent = options.parent;
        this.obj = {
            fx: function() {
                this.unSelected();
            }.bind(this)
        };
        this.obj.bfx = this.obj.fx.bindAsEventListener(this.obj);
        this.clk = {
            fx: function() {
                this.clicked();
            }.bind(this)
        };
        this.clk.bfx = this.clk.fx.bindAsEventListener(this.clk);
        //observe the needed events
        this.menuElement = this.element.down();
        this.menuElement.observe('click',this.clk.bfx);
        this.menuElement.observe('mouseover',this.selected.bind(this));
        this.menuElement.observe('mouseout',this.obj.bfx);
    },
    /**
     * Sets a menu's style as selected
     */
    selected: function(){
        this.menuElement.removeClassName(this.skinInactive);
        this.menuElement.addClassName(this.skinActive);
        this.showText();
    },
    /**
     * Sets a menu's style as unselected
     */
    unSelected: function(){
        this.menuElement.removeClassName(this.skinActive);
        this.menuElement.addClassName(this.skinInactive);
        this.hideText();
    },
    /**
     * enables a menu so it can be clicked
     */
    enable: function() {
        this.menuElement.observe('click',this.clk.bfx);
        this.menuElement.observe('mouseout',this.obj.bfx);
    },
    /**
     * disables a menu so it can't be clicked
     */
    disable: function() {
        this.menuElement.stopObserving('click',this.clk.bfx);
        this.menuElement.stopObserving('mouseout',this.obj.bfx);
    },
    /**
     * Function which reat's to the clicking event
     */
    clicked: function(){
        if(this.launchApp && !this.notFireEvent)
            this.parentObject.makeOpenApplication(this.app);
        this.disable();
        this.selected();
        if(typeof this.clickCallback == 'function')
            this.clickCallback();
    },
    /**
     * Hides the navigation element
     */
    hide: function(){
        this.element.hide();
    },
    /**
     * Hides a submenu
     */
    show: function(){
        this.element.show();
    },
    /**
     * Hides the text
     */
    hideText: function(){
        if (this.element.down('button'))  //added by SC, 2012-04-16
            this.element.down('button').hide();
    },
    /**
     * Shows the text
     */
    showText: function () {
        if (this.element.down('button'))  //added by SC, 2012-04-16
            this.element.down('button').show();
    }
});


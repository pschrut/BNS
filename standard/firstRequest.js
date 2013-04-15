/**
 *@fileoverview firstRequest.js
 *@desc GET_USER_OPTIONS asked in advanced, and when DOM ready and the SAP respond too, we create
 *all the applications objects, plus topMenu, leftMenus, and takeRoleOf
 */
var Start = Class.create(origin, {
    /**
    * @lends Start
    */
    initialize: function ($super) {
        $super();
        //Load the customer URL before loading GET_USETTINGS if there's a customer
        document.observe("dom:loaded", this.load.bindAsEventListener(this));

        if (Object.isEmpty(getURLParam("customer"))) {
            this.getUSettings();
        }
    },

    getUSettings: function () {
        var usettingsJSON = {
            EWS: {
                SERVICE: "GET_USETTINGS",
                LABELS: {
                    item: ['FWK', 'SC', 'TM', 'PFM', 'WA', 'SCM', 'REPT', 'REP']
                }
            }
        };
        var xotree = new XML.ObjTree();
        var xml = xotree.writeXML(usettingsJSON);
        this.makeAJAXrequest($H({
            xml: xml,
            successMethod: this.load.bind(this)
        }));
        //Stop observing the window load so we don't ask get_usettings more than once
        this.getUSettingsBinding = Prototype.emptyFunction();
    },
    /**
    * Waits for userOptions and DOM to be ready to be
    * able to create all the EWS needed objects
    * @param data {event} event caught by this function
    */
    load: function (data) {
        if (!data.eventName) {
            //setting the user option
            global = new Global(data);
            this.json = data;
            this.userOptionsReady = true;
        } else if (data.eventName == 'dom:loaded') {
            this.domLoaded = true;

            //will happen only with the customer configuration
            if (!Object.isEmpty(getURLParam("customer"))) {
                this.getUSettingsBinding = this.getUSettings.bind(this);
                var customer = getURLParam("customer");
                $LAB.script({ src: "customer/" + customer + "/url.js", type: "text/javascript" }).block(this.getUSettingsBinding);
            }
            else //load the log out solution via close window, BNS does not use customer in parameter.
            {
                $LAB.script({ src: "customer/BNS/logOutBNS.js", type: "text/javascript" }).block(function () { /*document.fire("EWS:customerFilesLoaded"); */ });
//                CUSTOMER_FILES = $H({
//                    PAY: ["customer/BNS/payslipBNS.js"]
//                });
                //                CLASS_VIEW.merge(CUSTOMER_FILES)
                CLASS_VIEW.get('PAY').push("customer/BNS/payslipBNS.js")
            }
        }
        //if DOM is ready and the user options set, we can continue creating the applications objects
        if (this.userOptionsReady && this.domLoaded && Object.isEmpty(getURLParam("customer"))) {
            this.createObjects();
        } else if (this.userOptionsReady && this.domLoaded) {
            var customer = getURLParam("customer");
            $LAB
                .toBODY()
                .script({ src: "customer/" + customer + "/customer.js", type: "text/javascript" })
                .block(global.mergeFiles.bind(this));
        }
    },
    /**
    * Creates all EWS needed objects
    */
    createObjects: function () {
        $('loadingDiv').update('&nbsp;&nbsp;' + global.getLabel('loading') + '&nbsp;&nbsp;');
        global.topMenu = new appNavigation(); //Navigation Menu handler Object
        global.leftMenu = new MenusHandler(); //Left Menus Handler Object
        global.takeRoleApplication = new takeRoleOf(); //takeRoleOf Application                              
        global.historyManager = new historyManager(); // the history manager will take care of the app in the URL -> this solves a bug

        //Launch the init apps, they are stored in global.INIT_APPS,
        //and its .js files must have been loaded in index.html
        var initAppKeys = global.INIT_APPS.keys();
        for (var i = 0; i < initAppKeys.size(); i++) {
            global.initializeApplicationByAppId(initAppKeys[i]);
        }
        this.createObjectsBinding = Prototype.emptyFunction();
    }
});
//Load CSS
function loadCSS(href) {
    var CSS = new Element("link", {
        "rel": "stylesheet",
        "type": "text/css",
        "href": href
    });

    $$("head")[0].insert(CSS);
}
loadCSS("css/CSS2.css");
if (Prototype.Browser.IE && parseInt(navigator.userAgent.substring(navigator.userAgent.indexOf("MSIE") + 5)) == 6) {
    loadCSS("css/CSS2_IE6.css");
} else if (Prototype.Browser.IE && parseInt(navigator.userAgent.substring(navigator.userAgent.indexOf("MSIE") + 5)) == 7) {
    loadCSS("css/CSS2_IE7.css");
}

//Load customer CSS
var customer = getURLParam("customer");
if (!Object.isEmpty(customer)) {
    var hrefCssCustomer = "customer/" + customer + "/customer.css";
    loadCSS(hrefCssCustomer); 
}


var starter = new Start();

document.observe("EWS:customerFilesLoaded", function(){
    starter.createObjects();
});

document.observe("dom:loaded", function(){
	var banner = $("fwk_4");
	var customer = getURLParam("customer");
	var URL = document.location.protocol + "//";
	URL += document.location.host;
	URL += document.location.pathname;
	if(customer){
		URL += "?customer="+customer;
	}
	if(banner){
		banner.observe("click", function(){
			document.location.href = URL;
		});
	}
});
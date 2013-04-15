/*
 *@fileoverview firstRequest.js
 *@desc GET_USER_OPTIONS asked in advanced, and when DOM ready and the SAP respond too, we create
 *all the applications objects, plus topMenu, leftMenus, and takeRoleOf
 */
var Start = Class.create(origin,{
    initialize: function($super){
		$super();
		var usettingsJSON = {
			EWS: {
				SERVICE: "GET_USETTINGS",
                LABELS: {
                    item: ['FWK','SC','TM']
                }
			}
		};
		var xotree = new XML.ObjTree();
		var xml = xotree.writeXML(usettingsJSON);
		this.makeAJAXrequest($H({xml: xml,successMethod:'load'}));
		
		
	},
    /*
	 * @method load
	 * @desc waits for userOptions and DOM to be ready to be 
	 * able to create all the EWS needed objects
	 * @param data {event} event caught by this function
	 */	
   load: function(data){
        if (!data.eventName) {
            //setting the user option
            global = new Global(data);
            this.json = data;
            this.userOptionsReady = true;
        } else if (data.eventName == 'dom:loaded') {
            this.domLoaded = true;
        }
        //if DOM is ready and the user options set, we can continue creating the applications objects
        if (this.userOptionsReady && this.domLoaded) {
            $('loadingDiv').update('&nbsp;&nbsp;' + global.getLabel('loading') + '&nbsp;&nbsp;');
            //in this case this is not the Start.load function, but the event passed as a
            //parameter, due to .bindAsEventListener()
            createObjects();
        }
    }
});
var starter = new Start();
//when the DOM is ready
document.observe("dom:loaded",starter.load.bindAsEventListener(starter));

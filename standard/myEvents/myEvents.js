
var WEBFORM2 = Class.create(Application,{
    
	initialize: function($super) {
	    $super('WEBFORM2');   
	},
	run:function($super){
	    $super();	
	    this.virtualHtml.update("<span class='application_main_title'>Application Name - My Events</span>");
	    
	    
	}
	
});
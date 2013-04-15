var APPR = Class.create(Application,{    
	initialize: function($super) {	   
	    $super('APPR'); 	    	       
	},
	run:function($super){
	    $super();	
	    this.virtualHtml.update("<span class='application_main_title'>Application Name - My Performance</span>");
	}
    
});

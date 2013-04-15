
var skill_standard = Class.create(Application,
{   
	initialize: function($super, args) {	    
	    $super(args);
	}, 
    run: function($super) {        
        $super();
        if(this.firstRun){
        
          var div = new Element('div');
          div.setStyle({'float':'left','width':'100%','height':'500px','overflow':'hidden'});
          div.update("<iframe scrolling='no' border='no' marginwidth='0' marginheight='0' style='border:0px;overflow:hidden' width='100%' height='100%' src='http://eval2.skillport.com/skillportfe/login.action'/>");
	      this.virtualHtml.insert(div);
	      this.virtualHtml.insert("<div style='clear:both'>&nbsp;</div>");
	    }                      
    },   
    close: function($super) {
        $super();
    }       
});

var skill = Class.create(skill_standard , {
    initialize: function($super) {
        $super('skill');
    },
    run: function($super) {
        $super();
    },
    close: function($super) {
        $super();
    }
});
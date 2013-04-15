var KMMENU = Class.create(Menu,
{
    
    initialize : function($super, id, options) {
		    $super(id, options);
    },
    show : function($super, element) {
    	//$super(element);
        this.changeTitle(global.getLabel("KM Menu"));
        
        var content = new Element("div").insert("Hello menu");
        
        this.changeContent(content);
    }
});
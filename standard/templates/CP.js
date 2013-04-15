var CPExample = Class.create(Application, {

    initialize: function($super) {

        $super('CPExample');
    },
    
    /**
     * 
     */
    run: function($super) {

        $super();

        // We create a main container that will be used to place the (get)content on
        var objContainer = new Element('<div id="XidWidgetContainer" style="background-color: lime;width:500px;height: 600px;"></div>');
        
        // We already attach this container (which is still empty) to the current page
		$('idTemporary').insert(objContainer);
		
		// We set some data although this is not really trivial
        var objParameters = {
            secondaryDataCollapsed: true,
            panelName: 'Panel_PD_DATA'  //PD_FAMI contains a table
        };

        // We instantiate the ContentPanel class and pass the previous parameters PLUS the empty container where the (get)content will be placed on
		var objNewContentPanel = new ContentPanelGeneric(objParameters, objContainer);

        // Finally we call the methode getContent that will retrieve the mandatory data from the requested get_content service to fill the panel
        objNewContentPanel.getContent('PD_DATA');

    },
    
    /**
     * 
     */
    close: function($super) {
    

    }
});

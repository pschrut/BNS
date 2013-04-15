var PFM_MaintainGoals = Class.create(getContentDisplayer, {
    
//PFM_MAGL
    /*
    *@method initialize
    *@param $super: the superclass: GenericCatalog
    *@desc instantiates the app
    */
    initialize: function($super,args) {
        $super(args);
        this.populateShortTextBinding = this.populateShortText.bindAsEventListener(this);
    },

    /*
    *@method run
    *@param $super: the superclass: GenericCatalog
    * which have changed.
    */
    run: function($super, args) {
		this.goalType = getArgs(args).get('goalType');
        var buttonsHandlers = $H({
            APP_PFM_ADDGOAL: function() { this.saveRequest('APP_PFM_ADDGOAL') } .bind(this),
            APP_PFM_DELGOAL: function() { this.saveRequest('APP_PFM_DELGOAL') } .bind(this),     
            cancel: function() {
                global.goToPreviousApp()
            },
            paiEvent: this.paiEventRequest.bind(this) 
        });
        args.set('buttonsHandlers', buttonsHandlers);
        $super(args);

        document.observe('EWS:PFM_MAGL_'+this.options.view, this.populateShortTextBinding);
    },

    /*
    * @method setContent
    * @desc it receives the answer from the getContent service, from SAP
    */
    setContent: function($super, answer, refresh) {
		if (this.goalType){
			if (answer.EWS.o_field_values){
				var values = answer.EWS.o_field_values;
                    objectToArray(values.yglui_str_wid_record).each(function(record) {
                        objectToArray(record.contents.yglui_str_wid_content.fields.yglui_str_wid_field).each(function(field) {        
                            if (field['@fieldid']=="GOALTYPE")
									field['@value']=this.goalType;
                        } .bind(this))        
                    } .bind(this))
			}	
		}
		$super(answer, refresh);
	},
    /*
    * @method close
    * @desc called when the application is not shown.
    */
    close: function($super) {
        $super();
        //document.stopObserving('EWS:returnSelected', this.addElementFromCatBindingJP);
    },
	
	populateShortText: function(event){
//	    var lydia = 0;
//		var titleShort = this.fp.fieldDisplayers.get('PFM_MAGL'+this.mode+'10').get('TITLE').getValue().text;
//		if (titleShort){
//			this.fp.fieldDisplayers.get('PFM_MAGL'+this.mode+'10').get('ABBREVIATION').updateJSON(titleShort);
//			//this.fp.fieldDisplayers.get('PFM_MAGL'+this.mode+'10').get('ABBREVIATION')._object._valueInserted();
//		}		
//	    var lydia = 0;
	}
});

var locationAdmin=Class.create(getContentDisplayer,{
    saveRequestService: 'SAVE_LEARN',
    getContentService: 'GET_LEARN',
    /*
    *@method initialize
    *@param $super
    *@desc instantiates the app
    */
    initialize: function($super,args) {
        $super(args);
    },

    /*
    *@method run
    *@param $super
    */
    run: function($super,args) {
        //buttons 
        var buttonsHandlers=$H({
            APP_LSOSAVEF: function() { this.saveRequest('APP_LSOSAVEF') } .bind(this),
            cancel: function() {
                global.goToPreviousApp()
            },
            paiEvent: this.paiEventRequest.bind(this)
        });
        args.set('buttonsHandlers',buttonsHandlers);
        $super(args);
        //buttons 
        this.buttonsHandlers=$H({
            APP_LSOSAVEF: function() { this.saveRequest('APP_LSOSAVEF') } .bind(this),
            cancel: function() {
                global.goToPreviousApp()
            },
            paiEvent: this.paiEventRequest.bind(this)
        });
    },
    /*
    * @method setTitle
    * @desc puts title 
    */    
    setTitle: function(){
        var label;
        if(this.mode == 'edit')
            label = global.getLabel('maintLOC');
        else if (this.mode == 'create')
            label = global.getLabel('createLOC');
        else if (this.mode == 'display')        
            label = global.getLabel('displayLOC');        
        this.updateTitle(label,"application_main_title getContentDisplayerTitle");
    },
    /*
    * @method setContent
    * @desc it receives the answer from the getContent service, from SAP
    */
    setContent: function(answer,refresh) {
        //showing message if there are no results in view actions in a pop up.
        if(this.tarty=='P'&&!answer.EWS.o_field_values) {
            //show message 'No results found'
            var noResultsHtml="<span class='fieldDispFloatLeft application_main_soft_text'>"+global.getLabel('noResults')+"</span>";
            this.virtualHtml.insert(noResultsHtml);
        } else {
            var groupedLayoutDiv=null;
            if(Object.isEmpty(refresh)) {
                this.answer=answer;
            } else {
                this.fp.destroy();
                this.answer.EWS.o_field_settings=answer.EWS.o_field_settings;
                this.answer.EWS.o_field_values=answer.EWS.o_field_values;
            }
            if(!Object.isEmpty(this.virtualHtml.down('[id='+this.appName+'saveMessage]')))
                this.virtualHtml.down('[id='+this.appName+'saveMessage]').remove();
            if(this.answer.EWS.o_widget_screens.yglui_str_wid_screen.yglui_str_wid_screen) {
                this.answer.EWS.o_widget_screens.yglui_str_wid_screen=this.answer.EWS.o_widget_screens.yglui_str_wid_screen.yglui_str_wid_screen;
            }
            this.splittedJson=splitBothViews(this.answer);
            this.json=this.answer;
            this.widgetsTotal=this.splittedJson.size();
            for(var i=0;i<this.widgetsTotal;i++) {
                this.widgetsFlag=this.splittedJson.keys()[i];
                if(!Object.isEmpty(objectToArray(this.answer.EWS.o_widget_screens.yglui_str_wid_screen)[i]['@table_mode'])) {
                    // table mode                
                    if(this.mode!='create') {
                        groupedLayoutDiv=this.drawTable();
                        this.linkButtonsTable();
                    }
                    this.answer.EWS.o_widget_screens.yglui_str_wid_screen[i]['@secondary']='hiddenTM';
                }
            }
            this.fp=new getContentModule({
                mode: this.mode,
                json: this.json,
                appId: this.appName,
                jsonCreateMode: this.jsonEmptyScreens,
                showCancelButton: this.showCancelButton,
                buttonsHandlers: this.buttonsHandlers,
                cssClasses: this.cssClasses,
                showButtons: $H({
                    edit: true,
                    display: false,
                    create: true
                })
            });
            this.virtualHtml.insert(this.fp.getHtml());
            if(this.virtualHtml.down("[id=applicationsLayerButtons]"))
                this.virtualHtml.down("[id=applicationsLayerButtons]").insert({ before: groupedLayoutDiv });
            else
                this.virtualHtml.insert(groupedLayoutDiv);
            this.virtualHtml.insert("<div id='"+this.appName+"saveMessage' class='application_main_soft_text PFM_ShowDocsSaveChanges'>"+global.getLabel('saveMessage')+"</div>");
            //hide the message
            this.toggleSaveChangesMessage(false);
            //this.linkButtons();
        }
    },
    /*
    * @method close
    * @desc called when the application is not shown.
    */
    close: function($super) {
        $super();
    }

});

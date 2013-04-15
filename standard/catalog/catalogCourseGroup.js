var CATL_CG = Class.create(getContentDisplayer, {
    saveRequestService: 'SAVE_LEARN',
    getContentService: 'GET_LEARN',
    /*
    *@method initialize
    *@param $super
    *@desc instantiates the app
    */
    initialize: function($super, args) {
        $super(args);
    },
    /*
    * @method setTitle
    * @desc puts title
    */    
    setTitle: function(){
        var label;
        if(this.mode == 'edit')
            label = global.getLabel('maintCG');
        else if (this.mode == 'create')
            label = global.getLabel('createCG');
        else if (this.mode == 'display')        
            label = global.getLabel('displayCG');        
        this.updateTitle(label,"application_main_title getContentDisplayerTitle");
    },
    /*
    *@method run
    *@param $super
    */
    run: function($super,args) {
        //buttons 
        var buttonsHandlers = $H({
            APP_LSOSAVECG: function() { this.saveRequest('APP_LSOSAVECG') } .bind(this),
            SCR_LSOCGCONTENT: function() { this.fp.displaySecondaryScreens("2"); } .bind(this),
            cancel: function() { 
                global.goToPreviousApp()
            },
            paiEvent: this.paiEventRequest.bind(this)
        });
        args.set('buttonsHandlers', buttonsHandlers);
        $super(args);
        //buttons 
        this.buttonsHandlers = $H({
            APP_LSOSAVECG: function() { this.saveRequest('APP_LSOSAVECG') }.bind(this),
            SCR_LSOCGCONTENT: function() {this.fp.displaySecondaryScreens("2");}.bind(this),
            cancel: function() { 
                global.goToPreviousApp()
            },
            paiEvent: this.paiEventRequest.bind(this)
        });
    },
    /*
    * @method saveRequest
    * @desc called when the user clicks on create or modify button
    */
    saveRequest: function(action, labelTag) {
        //validate Form
        var status = this.fp.validateForm();
        if (status.correctForm == true) {
            var jsonParameter = this.json;
            var action = (!Object.isEmpty(action)) ? action : "";
            var labelTag = (!Object.isEmpty(labelTag)) ? labelTag : "";
            var fieldsRequest = '';            
            if (this.mode.toLowerCase() == 'create' || this.modeChanged) {//new object
                var values = jsonParameter.EWS.o_field_values;                
                objectToArray(values.yglui_str_wid_record).each(function(record) {
                    objectToArray(record.contents.yglui_str_wid_content.fields.yglui_str_wid_field).each(function(field) {
                        var fieldValue = field['@value'];
                        if (! Object.isEmpty(field['@value']) && Object.isString(field['@value']) ) 
                            field['@value'].gsub(" ", "");                         
                        if (Object.isEmpty(fieldValue) && field['@fieldtechname'] && field['@fieldtechname'].toLowerCase() == 'endda') {
                            field['@value'] = '9999-12-31';
                        }                            
                    } .bind(this))
                } .bind(this))                
                var objectTree = new XML.ObjTree();
                objectTree.attr_prefix = '@';
                fieldsInput = objectTree.writeXML(values);
                if (fieldsInput.indexOf('?>') > -1) {
                    fieldsRequest += fieldsInput.substr(fieldsInput.indexOf('?>') + 3);
                }
            } else {
                if (Object.isEmpty(jsonParameter.tableMode) && (Object.isEmpty(jsonParameter.EWS.o_field_values) || !jsonParameter.EWS.o_field_values.yglui_str_wid_record))
                    jsonParameter.EWS.o_field_values = jsonParameterEmptyScreens.EWS.o_field_values;
                if (Object.isEmpty(jsonParameter.tableMode) && !Object.isEmpty(jsonParameter.EWS.o_field_values) && jsonParameter.EWS.o_field_values.yglui_str_wid_record) {
                    for (var i = 0; i < objectToArray(jsonParameter.EWS.o_field_values.yglui_str_wid_record).length; i++) {
                        var record = objectToArray(jsonParameter.EWS.o_field_values.yglui_str_wid_record);
                        var recKey = !Object.isEmpty(record[i]['@rec_key']) ? record[i]['@rec_key'] : "";
                        var keyStr = !Object.isEmpty(record[i].contents.yglui_str_wid_content['@key_str']) ? record[i].contents.yglui_str_wid_content['@key_str'] : "";
                        //if (record[i]["@rec_key"] == recKey || Object.isEmpty(recKey)) {
                        var screen = record[i]["@screen"];
                        var tcontentsXml = "";
                        var tcontents = "";
                        for (var j = 0; j < objectToArray(objectToArray(jsonParameter.EWS.o_field_values.yglui_str_wid_record)[i].contents.yglui_str_wid_content).length; j++) {
                            if (objectToArray(objectToArray(jsonParameter.EWS.o_field_values.yglui_str_wid_record)[i].contents.yglui_str_wid_content)[j]["@key_str"] == keyStr || Object.isEmpty(keyStr)) {
                                rec = objectToArray(objectToArray(jsonParameter.EWS.o_field_values.yglui_str_wid_record)[i].contents.yglui_str_wid_content)[j]["@rec_index"];
                                var contentFields = objectToArray(objectToArray(jsonParameter.EWS.o_field_values.yglui_str_wid_record)[i].contents.yglui_str_wid_content)[j].fields;
                                var tcontentFields = objectToArray(objectToArray(jsonParameter.EWS.o_field_values.yglui_str_wid_record)[i].contents.yglui_str_wid_content)[j].tcontents
                                //just for learning, we check if the record is for deletion
                                var delButton = false;
                                var insButton = false;                                                                      
                                if('buttonsDyn' in objectToArray(jsonParameter.EWS.o_field_values.yglui_str_wid_record)[i].contents.yglui_str_wid_content){
                                    if(jsonParameter.EWS.o_field_values.yglui_str_wid_record[i].contents.yglui_str_wid_content.buttonsDyn.yglui_str_wid_button){
                                        if(jsonParameter.EWS.o_field_values.yglui_str_wid_record[i].contents.yglui_str_wid_content.buttonsDyn.yglui_str_wid_button.okcode == 'DEL'){
                                            delButton = true;
                                        }else if(jsonParameter.EWS.o_field_values.yglui_str_wid_record[i].contents.yglui_str_wid_content.buttonsDyn.yglui_str_wid_button.okcode == 'INS'){
                                            insButton = true;
                                        }
                                    }
                                }                                                                           
                                if (!Object.isEmpty(tcontentFields) && tcontentFields.yglui_str_wid_tcontent) {
                                    var tcontents_tcontent = objectToArray(tcontentFields)
                                    tcontents_tcontent.each(function(oneTcontent) {
                                        if (!Object.isEmpty(oneTcontent.yglui_str_wid_tcontent)) {
                                            var objTree = new XML.ObjTree();
                                            objTree.attr_prefix = '@';
                                            var oneTcontentFields = objTree.writeXML(oneTcontent);
                                            tcontentsXml += oneTcontentFields.substr(oneTcontentFields.indexOf('?>') + 3);
                                        }
                                    } .bind(this));
                                }
                                var objTree = new XML.ObjTree();
                                objTree.attr_prefix = '@';
                                var fields = objTree.writeXML(contentFields);
                                if (!Object.isEmpty(tcontentsXml))
                                    tcontentsXml = "<TCONTENTS>" + tcontentsXml + "</TCONTENTS>";
                                if (fields.indexOf('?>') > -1) {
                                    fieldsRequest += '<YGLUI_STR_WID_RECORD REC_KEY="' + recKey + '" SCREEN="' + screen + '">' +
                                                            '<CONTENTS>' +
                                                                '<YGLUI_STR_WID_CONTENT KEY_STR="' + keyStr + '" REC_INDEX="' + rec + '" SELECTED="" TCONTENTS="">' +
                                                                    '<FIELDS>' +
                                                                        fields.substr(fields.indexOf('?>') + 3) +
                                                                    '</FIELDS>' +
                                                                    tcontentsXml;
                                                //just for learning, we check if the record is for deletion
                                                if(delButton)
                                                    fieldsRequest += '<BUTTONS><YGLUI_STR_WID_BUTTON  OKCODE = "DEL" /></BUTTONS>';
                                                if(insButton)
                                                    fieldsRequest += '<BUTTONS><YGLUI_STR_WID_BUTTON  OKCODE = "INS" /></BUTTONS>';
                                                fieldsRequest +='</YGLUI_STR_WID_CONTENT>' +
                                                            '</CONTENTS>' +
                                                        '</YGLUI_STR_WID_RECORD>';                                                          
                                }
                            }
                        }
                        //}
                    }
                }
            }            
            if (Object.isEmpty(this.objectIdRequest)) {
                if (this.mode.toLowerCase() == 'create' || this.modeChanged) {//new object
                    this.objectIdRequest = '';
                } else {
                    this.objectIdRequest = this.objectId;
                }
            }
            if (fieldsRequest.length > 0) {
                var xml = '<EWS>' +
                            '<SERVICE>' + this.saveRequestService + '</SERVICE>' +
                            '<OBJECT TYPE="' + this.oType + '">' + this.objectIdRequest + '</OBJECT>' +
                            '<PARAM>' +
                                '<APPID>' + this.tarapId + '</APPID>';                                    
                                xml += '<RECORDS>' +
                                    fieldsRequest +
                                '</RECORDS>' +
                                '<BUTTON ACTION="' + action + '" LABEL_TAG="' + labelTag + '" OKCODE="' + this.okCode + '" />' +
                            '</PARAM>' +
                            '<DEL></DEL>' +
                         '</EWS>';
                this.makeAJAXrequest($H({ xml: xml, successMethod: 'saveRequestAnswer' }));
            }
        }
    },    
    linkButtons: function() {
        if(!Object.isEmpty(this.virtualHtml.down("[id="+ this.appName+"_SCR_LSOCGCONTENT]"))){
            this.virtualHtml.down("[id="+ this.appName+"_SCR_LSOCGCONTENT]").stopObserving('click');	
            this.virtualHtml.down("[id="+ this.appName+"_SCR_LSOCGCONTENT]").observe('click',function(){this.displaySecondaryScreens(1);}.bind(this));	
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

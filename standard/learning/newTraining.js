var learningNewRequest = Class.create(getContentDisplayer, {
    getContentService: 'GET_LEARN',
    saveRequestService: 'REQ_TRAIN',
    initialize: function($super, options) {
        $super(options);
        //this.changeDatePickersHandlerBinding = this.changeDatePickers.bind(this);
    },

    run: function($super, args) {
        //adding buttons handler in args
        var buttonsHandlers = $H({
            APP_LSOSETRA: function() { this.saveRequest('APP_LSOSETRA'); } .bind(this),
            cancel: function() {
                global.goToPreviousApp({ refresh: false });
            } .bind(this)
        });
        args.set('buttonsHandlers', buttonsHandlers);
        //adding classes in args
        var cssClasses = $H({
            fieldDispField: 'jobCat_emptyWidth',          
            fieldDisplayer_textArea: 'jobCat_textAreaWidth',
            fieldDispWidth: 'jobCat_textWidth'
        });
        args.set('objectId', global.objectId);
        args.set('cssClasses', cssClasses);
        args.set('parentType', global.objectType);
        args.set('okCode', getArgs(args).get('okcode'));
        $super(args);        
    },
    /*
    * @method setTitle
    * @desc puts title 
    */    
    setTitle: function(){
        var label;
        label = global.getLabel('reqTrain');      
        this.updateTitle(label,"application_main_title getContentDisplayerTitle");
    },  
    /*
    * @method saveRequest
    * @desc called when the user clicks on create or modify button
    */
    saveRequest: function(action, labelTag, jsonParameter, recIndex, screen) {
        //relatPRemove.js is a popup to remove an assignment in resourceCat
        if (this.view != "relatPRemove") {
            var status = this.fp.validateForm(screen, recIndex);
        } else {
            var status = {};
            status.correctForm = true;
        }
        if (status.correctForm == true) {
            if (Object.isEmpty(jsonParameter))
                jsonParameter = this.json;
            var action = (!Object.isEmpty(action)) ? action : "";
            var labelTag = (!Object.isEmpty(labelTag)) ? labelTag : "";
            var fieldsRequest = '';
            if (Object.isEmpty(jsonParameter.tableMode)) {//not table mode
                if (this.mode.toLowerCase() == 'create' || this.modeChanged) {//new object
                    var values = jsonParameter.EWS.o_field_values;

                    objectToArray(values.yglui_str_wid_record).each(function(record) {
                        objectToArray(record.contents.yglui_str_wid_content.fields.yglui_str_wid_field).each(function(field) {
                            var fieldValue = field['@value'];
                            if (!Object.isEmpty(field['@value']) && Object.isString(field['@value']))
                                field['@value'].gsub(" ", "");
                            if (Object.isEmpty(fieldValue) && field['@fieldtechname'] && field['@fieldtechname'].toLowerCase() == 'endda') {
                                field['@value'] = '9999-12-31';
                            }
                            if (this.saveRequestService != "SAVE_LEARN") {
                                if (Object.isEmpty(fieldValue) && !Object.isEmpty(this.objectId) && field['@fieldtechname'] && (field['@fieldtechname'].toLowerCase() == 'sobid') && field['@fieldid'] != 'COSTCENTER' && field['@fieldid'] != 'SOBID_O_HEAD' && field['@fieldid'] != 'JOB') {
                                    field['@value'] = this.objectId;
                                }
                                if (Object.isEmpty(fieldValue) && !Object.isEmpty(this.parentType) && field['@fieldtechname'] && (field['@fieldtechname'].toLowerCase() == 'sclas')) {
                                    field['@value'] = this.parentType;
                                }
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
                                        fieldsRequest += '</YGLUI_STR_WID_CONTENT>' +
                                                                '</CONTENTS>' +
                                                            '</YGLUI_STR_WID_RECORD>';
                                    }
                                }
                            }
                            //}
                        }
                    }
                }
            }
            if (this.recordsToSave.length > 0) {//table mode
                this.saveRequestTableMode();
            } else {
                var ans = '';
                this.saveRequestTableModeAnswer(ans);
            }
            this.objectIdRequest = global.objectId;
            this.oType = global.objectType;
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
    /*
    * @method close
    * @desc called when the application is not shown.
    */
    close: function($super) {
        $super();
    }
});
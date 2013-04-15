/**
*@constructor
*@description Class relatUAdmin.
*@augments getContentDisplayer 
*/
var relatPRemove=Class.create(getContentDisplayer,{
    showCancelButton: false,
    saveRequestService: 'SAVE_LEARN',
    getContentService: 'GET_LEARN',
    /*
    *@method initialize
    *@param $super: the superclass: getContentDisplayer
    *@desc instantiates the app
    */
    initialize: function($super,args) {
        $super(args);
    },

    /*
    *@method run
    *@param $super: the superclass: getContentDisplayer
    */
    run: function($super,args) {
        //buttons
        var buttonsHandlers=$H({
            APP_LSOSAVERELATP: function() { this.action='APP_LSOSAVERELATP',this.okContent(); } .bind(this)
        });
        args.set('buttonsHandlers',buttonsHandlers);
        $super(args);
    },
    okContent: function() {
        this.jsonAssign=deepCopy(this.fp.json);
        this.getContent();
    },
    getContent: function() {
        var messageFrom;
        if(this.okCode=='CUT') { messageFrom=global.getLabel('delimitFrom') } else { messageFrom=global.getLabel('deleteFrom') }
        var genericDeleteHtml="<div>"
                             +"<div class='fwk_info_logo'></div>"
                             +"<div class='moduleInfoPopUp_textMessagePart'><span>"+global.getLabel('deleteAssignP')+"</span></div>"
                             +"</div>";
        var _this=this;
        var contentHTML=new Element('div');
        contentHTML.insert(genericDeleteHtml);
        //buttons
        var buttonsJson={
            elements: [],
            mainClass: 'moduleInfoPopUp_stdButton_div_right'
        };
        var callBack=function() {
            if(_this)
                _this.callToGetLearn();
        };
        var callBack3=function() {
            _this.close();
        };
        var aux2={
            idButton: 'Yes',
            label: global.getLabel('yes'),
            handlerContext: null,
            className: 'moduleInfoPopUp_stdButton',
            handler: callBack,
            type: 'button',
            standardButton: true
        };
        var aux3={
            idButton: 'No',
            label: global.getLabel('no'),
            handlerContext: null,
            className: 'moduleInfoPopUp_stdButton',
            handler: callBack3,
            type: 'button',
            standardButton: true
        };
        buttonsJson.elements.push(aux2);
        buttonsJson.elements.push(aux3);
        var ButtonObj=new megaButtonDisplayer(buttonsJson);
        var buttons=ButtonObj.getButtons();
        //insert buttons in div
        contentHTML.insert(buttons);
        this.virtualHtml.insert(contentHTML);
    },
    callToGetLearn: function(){
        var xml="<EWS>"
            +"<SERVICE>"+this.getContentService+"</SERVICE>"
            +"<OBJECT TYPE='"+this.parentType+"'>"+this.objectId+"</OBJECT>"
            +"<PARAM>"
            +"<APPID>"+this.tarapId+"</APPID>"
            +"<WID_SCREEN>*</WID_SCREEN>"
            +"<PERIOD_BEGDA>"+this.begda+"</PERIOD_BEGDA>"
            +"<PERIOD_ENDDA>"+this.endda+"</PERIOD_ENDDA>"
            +"<OKCODE>"+this.okCode+"</OKCODE>"
            +"</PARAM>"
            +"</EWS>";
        this.makeAJAXrequest($H({ xml: xml,successMethod: 'processContent' }));

    },

    processContent: function(answer) {
        //harcoding okCode
        this.okCode='DEL';
        //save
        this.saveRequest("","",answer);
    },
    /*
    * @method saveRequest
    * @desc called when the user clicks on create or modify button
    */
    saveRequest: function(action, labelTag, jsonParameter) {
        //relatPRemove.js is a popup to remove an assignment in resourceCat
        var status = {};
        status.correctForm = true;
        if (status.correctForm == true) {
           if (Object.isEmpty(jsonParameter))
                var jsonParameter = this.json;
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
    saveRequestAnswer: function() {
        this.close();
        global.open($H({
            app: {
                appId: 'TM_L_CTE',
                tabId: 'LRN_RES',
                view: 'resCatTeacher'
            },
            refresh: true
        }));
    },

    /*
    * @method close
    * @desc called when the application is not shown.
    */
    close: function($super) {
        this.popUpApplication.close();
        $super();
    }
});
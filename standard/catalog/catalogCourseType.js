﻿var CATL_CT = Class.create(getContentDisplayer, {
    scheduleDetailsService: 'GET_SCHED_DET',
    saveRequestService: 'SAVE_LEARN',
    getContentService: 'GET_LEARN',    
    /*
    *@param $super
    *@description instantiates the app
    */
    initialize: function($super, args) {
        $super(args);
        this.scheduleDetailsHash = $H({});
    },
     /**
    * @param args The app data
    * @param $super The superclass run method
    * @description Executes the super class run method    
    */
    run: function($super, args) {
        //buttons 
        this.app = args.get('app').appId;
        var buttonsHandlers = $H({
            APP_LSOSAVECT: function() { this.saveRequest('APP_LSOSAVECT') } .bind(this),
            SCR_LSOCTCONTENT: function() { this.fp.displaySecondaryScreens("2"); } .bind(this),
            SCR_L_ADDITION: function() { 
                //adition button in the first Qualification widget
                var button_add = objectToArray(this.json.EWS.o_screen_buttons.yglui_str_wid_button);
                for(i=0;i< button_add.length;i++){
                    if(button_add[i]['@action'] == 'SCR_L_ADDITION' ){
                        var tarapBut = button_add[i]['@tarap'];
                        var screenBut = button_add[i]['@screen'];
                        var okCodeBut = button_add[i]['@okcode'];
                    }
                }              
                this.callToGetRecordXml(tarapBut,screenBut,okCodeBut); 
            } .bind(this),
            SCR_L_ADDITION2: function() { 
                //adition button in the first Qualification widget
                var button_add = objectToArray(this.json.EWS.o_screen_buttons.yglui_str_wid_button);
                for(i=0;i< button_add.length;i++){
                    if(button_add[i]['@action'] == 'SCR_L_ADDITION2' ){
                        var tarapBut = button_add[i]['@tarap'];
                        var screenBut = button_add[i]['@screen'];
                        var okCodeBut = button_add[i]['@okcode'];
                    }
                }              
                this.callToGetRecordXml(tarapBut,screenBut,okCodeBut); 
            } .bind(this),            
            cancel: function() {
                global.goToPreviousApp()
            },
            paiEvent: this.paiEventRequest.bind(this),
            DEFAULT_EVENT_THROW: 'EWS:learning_recordButtons_' + this.app        
        });
        args.set('buttonsHandlers', buttonsHandlers);
        $super(args);
        this.hashOfQualifs = $H();
        this.hashOfQualifsFP = $H();
        this.qualiAdd = $H();
        this.qualiIndex = 0;        
        //buttons event
        this.onButtonBinding = this.recordButtonPressed.bindAsEventListener(this);
        document.observe('EWS:learning_recordButtons_' + this.app, this.onButtonBinding);
    },
    /*
    * @method setTitle
    * @desc puts title 
    */    
    setTitle: function(){
        var label;
        if(this.mode == 'edit')
            label = global.getLabel('maintCT');
        else if (this.mode == 'create')
            label = global.getLabel('createCT');
        else if (this.mode == 'display')        
            label = global.getLabel('displayCT');        
        this.updateTitle(label,"application_main_title getContentDisplayerTitle");
    },    
     /**
    * @param tarap appId to pass in the getContent service
    * @param screen id of the screen where the user clicked
    * @param okCode okCode needed to call the getContent service
    * @description Calls SAP to get a mini fieldset with the template record
    */
    callToGetRecordXml: function(tarap,screen,okCode){       
        var xml = "<EWS>"
                  + "<SERVICE>" + this.getContentService + "</SERVICE>"
                  + "<OBJECT TYPE='" + this.parentType + "'>" + this.objectId + "</OBJECT>"
                  + "<PARAM>"
                    + "<APPID>" + tarap + "</APPID>"
                    + "<WID_SCREEN>*</WID_SCREEN>"
                    + "<PERIOD_BEGDA>" + this.begda + "</PERIOD_BEGDA>"
                    + "<PERIOD_ENDDA>" + this.endda + "</PERIOD_ENDDA>"
                    + "<OKCODE>" + okCode + "</OKCODE>"
                  + "</PARAM>"
                + "</EWS>";                         
        this.makeAJAXrequest($H({ xml: xml, successMethod: this.addQualification.bind(this, screen,okCode,tarap) }));
    },
     /**
    * @param screen id of the screen where the user clicked
    * @param okCode okCode needed to call the getContent service
    * @param appId appId of the mini fielset
    * @param json xml_out with the information about the record template
    * @description Creates a popup with a getContentModule to fill in the info of the new row
    */    
    addQualification: function(screen,okCode,appId,json){
        //look for bigger index and update it
        var records = objectToArray(this.json.EWS.o_field_values.yglui_str_wid_record);
        for(var i=0;i<records.length;i++){
            if(records[i]['@screen'] == screen)
                if(records[i].contents.yglui_str_wid_content['@rec_index'] > this.qualiIndex)
                    this.qualiIndex =  records[i].contents.yglui_str_wid_content['@rec_index'];  
        
        }
        this.qualiIndex++;
        //compose rowId and save it in a hash with its xml
        var newQId =  'row' + this.qualiIndex;
        this.hashOfQualifs.set(newQId, json);        
        //create the mini fieldsPanel
        var newQFP = new getContentModule({
            appId: appId,
            mode: 'create',
            displayActionsOnEdit: true,
            json: deepCopy(this.hashOfQualifs.get(newQId)),
            showCancelButton: false,            
            showButtons: $H({
                edit: false,
                display: false,
                create: false
            })  
        });        
        //save in a hash the fieldPanel for the new row
        this.hashOfQualifsFP.set(newQId, newQFP);
        this.hashOfQualifs.get(newQId).EWS = this.hashOfQualifsFP.get(newQId).json.EWS;  
        var fieldsPanelNewQ = newQFP.getHtml();        
        //create several divs to hold all info: fielpanel, buttons..        
        var contentHTML = new Element('div',{'id': 'Learning_addQMainCont','class': 'PCR_columns_container'});    
        var addQDiv = new Element('div',{'id':appId+'_addQ'});
        var addQButtons = new Element('div',{'id':appId+'_addQButtons','class':'PCR_ContainerdinamicButtons'});
        contentHTML.insert(addQDiv);
        contentHTML.insert(addQButtons);                 
        addQDiv.update(fieldsPanelNewQ);
        //create buttons 'Create' and 'Cancel'
        var jsonButtons = {
            elements: [],
            mainClass: 'moduleInfoPopUp_stdButton_div_right' 
        };
        // Creation
        var doneButton = {
            label: global.getLabel('done'),
            idButton: 'done',
            className: 'moduleInfoPopUp_stdButton',
            handlerContext: null,
            handler: this.doneQAdded.bind(this, this.hashOfQualifs.get(newQId),this.hashOfQualifsFP.get(newQId),newQId,screen),
            type: 'button',
            standardButton: true
        };
        //Cancel
        var cancelButton = {
            label: global.getLabel('cancel'),
            idButton: 'cancel',
            className: 'moduleInfoPopUp_stdButton',
            handlerContext: null,
            handler: this.cancelledQAdded.bind(this, newQId),
            type: 'button',
            standardButton: true
        };
        jsonButtons.elements.push(doneButton);
        jsonButtons.elements.push(cancelButton);
        var ButtonNewQ = new megaButtonDisplayer(jsonButtons);
        addQButtons.update(ButtonNewQ.getButtons());
        //Create a pop up to place the mini fieldPanel
        var _this = this;
        this.addQPopup = new infoPopUp({
            closeButton: $H({                
                'callBack': function() {
                    _this.addQPopup.close();
                    delete _this.addQPopup;
                }
            }),           
            htmlContent: contentHTML,
            width: 700,
            height: 800
        });
        this.addQPopup.create();                
    },
     /**    
    * @param json xml_out with the information about the record template
    * @param fieldsPanel getContentModule object with the new row to be added
    * @param rowId Id of the new row to be created
    * @param screenId id of the screen where the user clicked
    * @description Closes the popup and add the info as a new row
    */     
    doneQAdded: function(json,fieldsPanel,rowId,screenId){
        //add xml of the new row to the hash that will be inspected when calling the save_learn service
        var newRow = Object.isEmpty(this.qualiAdd.get(rowId));
        if (newRow) {
            fieldsPanel.json.EWS.o_field_values.yglui_str_wid_record.contents.yglui_str_wid_content['@rec_index'] = this.qualiIndex;
            fieldsPanel.json.EWS.o_field_values.yglui_str_wid_record['@screen'] = screenId;
            this.qualiAdd.set('row' + this.qualiIndex, {
                xml: fieldsPanel.json
            });
        } 
        //create html for the new row
        var textContainer = $A();
        var fields = objectToArray(fieldsPanel.json.EWS.o_field_values.yglui_str_wid_record.contents.yglui_str_wid_content.fields.yglui_str_wid_field);
        var fieldSettings = objectToArray(fieldsPanel.json.EWS.o_field_settings.yglui_str_wid_fs_record.fs_fields.yglui_str_wid_fs_field);
        for (var i = 0; i < fieldSettings.length; i++) {
            if (fieldSettings[i]['@fieldtype'] == 'H') {
                var fieldId = fieldSettings[i]['@fieldid'];
                var seqnr = fieldSettings[i]['@seqnr'];
                for (var j = 0; j < fields.length; j++) {
                    if (fieldId == fields[j]['@fieldid']) {
                        var fieldDisplayers = fieldsPanel.fieldDisplayers;
                        var fieldType = fieldsPanel.fieldDisplayers.get(fieldsPanel.fieldDisplayers.keys().first()).get(fieldId).options.fieldType;
                        var text = fieldsPanel.fieldDisplayers.get(fieldsPanel.fieldDisplayers.keys().first()).get(fieldId).jsonInsertion.get(fieldType).text;
                        textContainer[parseInt(seqnr)] = fields[j][text];
                    }
                }
            }
        }
        textContainer = textContainer.compact();
        var dataTable = $H();
        var detailsDiv = new Element('div', { id: rowId });
        detailsDiv.update(fieldsPanel.getHtml());                
        //create buttons for the new row
        if('buttons' in fieldsPanel.json.EWS.o_field_values.yglui_str_wid_record.contents.yglui_str_wid_content){
            var buttonsJson = {
                elements: []
            };              
            var buttons = objectToArray(fieldsPanel.json.EWS.o_field_values.yglui_str_wid_record.contents.yglui_str_wid_content.buttons.yglui_str_wid_button);
            for(var i=0;i<buttons.length;i++){
                if(buttons[i]['@action'] == 'REC_L_DELETION'){
                    //Creation of delete button
                    var deleteB = {
                        idButton: 'getContent_'+buttons[i]['@label_tag']+this.qualiIndex,//getContent_REC_L_DELETION
                        label: buttons[i]['@label_tag'],
                        handler: this.recordButtonPressed.bind(this,"",rowId,screenId),
                        className: 'getContentLinks fieldDispFloatLeft application_action_link megaButtonDisplayer_floatLeft',//getContentLinks fieldDispFloatLeft application_action_link megaButtonDisplayer_floatLeft
                        type: 'link'
                    };
                    buttonsJson.elements.push(deleteB);                                   
                }
            }    
            var buttonUpdate = new megaButtonDisplayer(buttonsJson);
            detailsDiv.insert(buttonUpdate.getButtons());                            
        }        
        //updating table with the new row
        dataTable.set(rowId, { data: [], element: detailsDiv });    
        for (var a = 0; a < textContainer.length; a++) {
            dataTable.get(rowId).data.push({ text: textContainer[a] });
        }
        //insert row in the listMode table
        var listModeTable = this.fp.getListModeTable(screenId);
        if (newRow) {
            listModeTable.addRow(dataTable);
            this.fp.getListModeTableElement(screenId).show();
            this.fp.getListModeTableNoResultsDiv(screenId).hide();            
        }
        else
            listModeTable.updateRow(rowId, dataTable);      
        //close popup
        this.addQPopup.close();
        delete this.addQPopup;            
                              
    },
   /**    
    * @param rowId Id of the row that was gone to be created
    * @description Closes the popup and discards the info  
    */       
    cancelledQAdded: function(rowId){
        this.hashOfQualifs.unset(rowId);
        this.addQPopup.close();
        delete this.addQPopup;  
    },
     /**    
    * @param event Information about screen and row as parameters or through an event
    * @param rowId Id of the new row to be created
    * @param screenId id of the screen where the user clicked
    * @description Take button pressed, normally 'delete', and does the proper operation
    */    
    recordButtonPressed: function(event,rowId,screenId){
        //if coming from oldQ button --> event
        if(!Object.isEmpty(event)){
            var action = getArgs(event).action;
            switch (action) {
                case 'REC_L_DELETION':                 
                    var rowIndex = getArgs(event).recKey;
                    var screen = getArgs(event).screen;
                    //remove row from layout 
                    var records = objectToArray(this.json.EWS.o_field_values.yglui_str_wid_record);     
                    var recordToDelete;       
                    for(var i=0;i<records.length;i++){
                        if(records[i]['@screen'] == screen)
                            if(records[i].contents.yglui_str_wid_content['@rec_index'] == rowIndex){
                                recordToDelete = records[i];
                                var fields = objectToArray(recordToDelete.contents.yglui_str_wid_content.fields.yglui_str_wid_field);
                                for(var j=0;j<fields.length;j++)
                                    if(fields[j]['@fieldid'].toLowerCase() == 'sobid')
                                        rowId = fields[j]['#text'];
                            }
                    }
                    //remove row from layout
                    this.fp.getListModeTable(screen).removeRow(rowId);                 
                    //put DEL button in json
                    var deleteButton = { yglui_str_wid_button: [] };        
                    //insert the DEL button so SAP knows this record is to be deleted
                    recordToDelete.contents.yglui_str_wid_content.buttonsDyn = deleteButton;
                    recordToDelete.contents.yglui_str_wid_content.buttonsDyn.yglui_str_wid_button.okcode = 'DEL';                                         
                break;                
            }        
        }else{
        //If coming from newQ button --> button handler        
            var screen = screenId;                   
            //remove row from layout
            this.fp.getListModeTable(screen).removeRow(rowId);        
            //if newQ, remove row from hash
            this.qualiAdd.unset(rowId);                     
        }                                                         
    }, 
    /*
    * @method saveRequest
    * @desc called when the user clicks on create or modify button
    */
    saveRequest: function(action, labelTag) {
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
            if(this.qualiAdd && this.qualiAdd.keys().length>0){
                //if there are children, we insert them
                var yglui = {YGLUI_STR_WID_RECORD: $A()};
                var jsonSave = {records: yglui};
                if (this.qualiAdd.keys().length != 0) {
                    var keys = this.qualiAdd.keys();
                    for (var j = 0; j < keys.length; j++) {
                        var record = this.qualiAdd.get(keys[j]).xml.EWS.o_field_values.yglui_str_wid_record;
                        if('buttons' in record.contents.yglui_str_wid_content){
                            //delete record.contents.yglui_str_wid_content.buttons;  
                            record.contents.yglui_str_wid_content.buttons.yglui_str_wid_button['@okcode'] = 'INS';
                        }  
                        jsonSave.records.YGLUI_STR_WID_RECORD.push(record);
                    }
                } 
                //transform the xml
                var json2xml = new XML.ObjTree();
                json2xml.attr_prefix = '@';  
                var transformingXml = json2xml.writeXML(jsonSave);  
                transformingXml = transformingXml.split("<");
                var transformedXml = $A();
                for(var q=3;q<transformingXml.length -1;q++){
                    transformedXml.push(transformingXml[q]);
                }
                transformedXml = "<" + transformedXml.join("<");
                fieldsRequest += transformedXml;                       
            
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
        var editMode = false;
        if (!Object.isEmpty(this.virtualHtml.down("[id=" + this.appName + "_SCR_LSOCTCONTENT]"))) {
            this.virtualHtml.down("[id=" + this.appName + "_SCR_LSOCTCONTENT]").stopObserving('click');
            this.virtualHtml.down("[id=" + this.appName + "_SCR_LSOCTCONTENT]").observe('click', function() { this.displaySecondaryScreens(1); } .bind(this));
        }
        this.virtualHtml.select("[class=fieldDisplayer_select]").each(function(selectBox) {
            var id = selectBox.identify();
            if (id.toLowerCase().endsWith('ctschedule')) {
                editMode = true;
                this.virtualHtml.down("[id=" + id + "]").observe('mouseover', function() { this.displayScheduleDetailsInitialize(id); } .bind(this));
            }
        } .bind(this));
        if (editMode == false) {
            if (!Object.isEmpty(this.virtualHtml.down("[id=1TM_L_CTSCHEDULE]"))) {
                this.virtualHtml.down("[id=1TM_L_CTSCHEDULE]").stopObserving('mouseover');
                this.virtualHtml.down("[id=1TM_L_CTSCHEDULE]").observe('mouseover', function() { this.displayScheduleDetailsRequestDisplayMode("1TM_L_CTSCHEDULE", this.virtualHtml.down("[id=1TM_L_CTSCHEDULE]").readAttribute('value')); } .bind(this));
            }
        }
    },
    displayScheduleDetailsInitialize: function(element) {
        if (this.scheduleDetailsInitialized != true) {
            var options = this.virtualHtml.down("[id=" + element + "]").options;
            if (options.length > 0)
                this.scheduleDetailsInitialized = true;
            for (var i = 0; i < options.length; i++) {
                var option = options[i];
                if (!Prototype.Browser.IE)
                    option.observe('mouseover', function(option) { this.displayScheduleDetailsRequest(element, option.value); } .bind(this, option));
                else
                    this.getOptionTitle(option, element);
            }
        } else {
            this.virtualHtml.down("[id=" + element + "]").stopObserving('mouseover');
            //this.virtualHtml.down("[id="+ element +"]").observe('mouseover',function(){this.displayScheduleDetailsRequest(element, this.virtualHtml.down("[id="+ element +"]").value);}.bind(this));
        }
    },
    displayScheduleDetailsRequest: function(element, value) {
        this.element = element;
        if (!Object.isEmpty(value) && value.toLowerCase() != "null" && Object.isEmpty(this.scheduleDetailsHash.get(value))) {
            var xml = "<EWS>"
                        + "<SERVICE>" + this.scheduleDetailsService + "</SERVICE>"
                        + "<DEL></DEL>"
                        + "<PARAM>"
                            + "<O_TSCHD>" + value + "</O_TSCHD>"
                        + "</PARAM>"
                     + "</EWS>";
            this.makeAJAXrequest($H({ xml: xml, successMethod: 'displayScheduleDetails', ajaxID: value }));
        } else {
            if (!Object.isEmpty(value) && !Object.isEmpty(this.scheduleDetailsHash.get(value)))
                this.displayScheduleDetails(null, value);
        }
    },
    displayScheduleDetails: function(answer, value) {
        if (Object.isEmpty(answer) && !Object.isEmpty(this.scheduleDetailsHash.get(value)))
            answer = this.scheduleDetailsHash.get(value);
        if (answer && answer.EWS && answer.EWS.o_schedule_details && answer.EWS.o_schedule_details.yglui_str_schedule_det) {
            this.scheduleDetailsHash.set(value, answer)
            scheduleDet = objectToArray(answer.EWS.o_schedule_details.yglui_str_schedule_det);
            var html = global.getLabel('scheduleDetails') + "<table>";
            scheduleDet.each(function(row) {
                if (row['@bblk1'] != '00:00:00' && row['@eblk1'] != '00:00:00') {
                    while (row['@tagnr'].startsWith('0')) {
                        row['@tagnr'] = row['@tagnr'].sub('0', '');
                    }
                    html += "<tr><td>" + global.getLabel('day') + "&nbsp;" + row['@tagnr'] + "</td><td>" + row['@bblk1'] + "</td><td>-</td><td>" + row['@eblk1'] + "</td></tr>";
                }
            } .bind(this));
            html += "</table>";
            balloon.showOptions($H({
                domId: this.element,
                content: html
            }));
        }
    },
    getOptionTitle: function(option, element) {
        if (!Object.isEmpty(option.value) && option.value.toLowerCase() != "null") {
            var xml = "<EWS>"
                        + "<SERVICE>" + this.scheduleDetailsService + "</SERVICE>"
                        + "<DEL></DEL>"
                        + "<PARAM>"
                            + "<O_TSCHD>" + option.value + "</O_TSCHD>"
                        + "</PARAM>"
                     + "</EWS>";
            this.makeAJAXrequest($H({ xml: xml, successMethod: 'setOptionTitle', ajaxID: option }));
            this.virtualHtml.down("[id=" + element + "]").stopObserving('mouseover');
        }
    },
    setOptionTitle: function(answer, option) {
        if (answer && answer.EWS && answer.EWS.o_schedule_details && answer.EWS.o_schedule_details.yglui_str_schedule_det) {
            scheduleDet = objectToArray(answer.EWS.o_schedule_details.yglui_str_schedule_det);
            var text = global.getLabel('scheduleDetails') + "\n";
            scheduleDet.each(function(row) {
                if (row['@bblk1'] != '00:00:00' && row['@eblk1'] != '00:00:00') {
                    while (row['@tagnr'].startsWith('0')) {
                        row['@tagnr'] = row['@tagnr'].sub('0', '');
                    }
                    text += global.getLabel('day') + " " + row['@tagnr'] + "\t" + row['@bblk1'] + " - " + row['@eblk1'] + "\n";
                }
            } .bind(this));
            option.setAttribute('title', text);
        }
    },
    displayScheduleDetailsRequestDisplayMode: function(element, value) {
        this.element = element;
        if (!Object.isEmpty(value) && value.toLowerCase() != "null" && Object.isEmpty(this.scheduleDetailsHash.get(value))) {
            var xml = "<EWS>"
                        + "<SERVICE>" + this.scheduleDetailsService + "</SERVICE>"
                        + "<DEL></DEL>"
                        + "<PARAM>"
                            + "<O_TSCHD>" + value + "</O_TSCHD>"
                        + "</PARAM>"
                     + "</EWS>";
            this.makeAJAXrequest($H({ xml: xml, successMethod: 'displayScheduleDetails', ajaxID: value }));
        } else {
            if (!Object.isEmpty(value) && !Object.isEmpty(this.scheduleDetailsHash.get(value)))
                this.displayScheduleDetails(null, value);
        }
    },
    /*
    * @method close
    * @desc called when the application is not shown.
    */
    close: function($super) {
        $super();
        this.qualiAdd = $H();
        this.qualiIndex = 0;
         document.stopObserving('EWS:learning_recordButtons_' + this.app, this.onButtonBinding);
    }

});

var fieldsPanel = Class.create(origin,
    /**
*@lends fieldsPanel
*/
    {
        /**General fieldsPanel documentation
	* ---------------------------------
	*These are all the parameters fieldsPanel accepts and their meanings/use, plus the methods
	*that are accesible by calling them via the fieldsPanelObject.methodName() (fieldsPanel API):
	*
	* fieldsPanel parameters
	* ----------------------
	* - mode .::. String attribute -> 'display' || 'edit' || 'create'
	* - appId .::. String attribute -> your widget or application Id.
	* - paiEvent .::. String attribute -> the event you have to observe to get the service PAI name and send it with the already modified JSON you passed to the fieldsPanel constructor.
	* - noResultsHtml .::. String/Element attribute -> the html/Element you want the fieldsPanel object display in case there are not fields returned in the get_content json received.
	* - json .::. Object attribute -> The get_content service JSON object returned by SAP.
	* - newTranslation .::. Object attribute -> Empty translation reg value.
	* - fieldDisplayerModified .::. String attribute -> Event you have to observe if you need to know when a fieldDisplayer object has been modified by the user.
	* - fireEventWhenDefaultValueSet .::. Hash attribute -> 'true' or 'false' for each key (fieldId) to set if the related fieldDisplayer object should throw the fieldDisplayerModified event when its default value has been set.
	* - assignDefaultValue .::. Hash attribute -> 'true' or 'false' for each key (fieldId) to set if the related fieldDisplayer object should use its default value.
	* - predefinedXmls .::. Hash attribute -> xml_in for each specific fieldId (hash key).
	* - event .::. String event -> Event name you have to observe to know what action should be performed when the user clicks on any fieldsPanel generated links (add, create etc.).
	* 
	* fieldsPanel API
	* ---------------
	* - validateForm() .::. it returns new Object(correctForm: true || false,errorMessage: "message"). Use this method to validate your fieldsPanel form when the user clicks on the Save button.
	* - getFieldInfo(fieldId) .::. it returns the field settings related to the fieldId passed as the method argument.
	* - goTo(regId) .::. it makes appear the fieldsPanel register related to the regId passed as the method argument.
	* - getElement() .::. it returns the fieldsPanel object container html Element. The application should insert it where is needed.
	* - destroy() .::. It deletes all the fieldDisplayer objects and their events(that's the point).
	*
	* IMPORTANT NOTES
	* ---------------
	* 
	* - fieldsPanel modes 'edit' and 'display' are compatible .::. you can change between them using the
	* 	API methods:  changeToEditMode() and changeToDisplayMode().
	* 
	* - fieldsPanel 'create' mode IS NOT COMPATIBLE WITH ANY OTHER .::. there's no method to turn a 
	*   fieldsPanel object in 'create' mode into 'edit' or 'display' modes. And there's no method to turn 
	*   a fieldsPanel object in 'edit' or 'display' modes into 'create' mode. So if you need to have
	*	a fieldsPanel object in 'create' mode, you have to create a new one.
	*
	* - forms Validation .::. if you need your application to validate the current fieldsPanel object, you
	*   just have to call the fieldsPanelObject.validateForm() method, and this will return the form state
	*   and the error message you have to show. You must do that only when the user tries to save the 
	*   current changes via Save button.
	*
	* - Don't use any method that is not specified in the fieldsPanel API(above), and don't modified any
	*	fieldsPanel attribute, you should communicate with the fieldsPanel object you've created only via
	*   calling fieldsPanel API methods, and for sure, passing the proper parameters to its constructor.
	*/
        initialize: function($super,options) {
            $super();
            /**
		*@type String
		*@description User language.
		*/
            this.language = global.language;
            /**
		*@type Hash
		*@description User available languages.
		*/
            this.allTranslations = global.translations;
            /**
		*@type String
		*@description View details label.
		*/
            this.viewDetails = global.getLabel('viewDetails');
            /**
		*@type String
		*@description Hide details label.
		*/
            this.hideDetails = global.getLabel('hideDetails');
            /**
		*@type String
		*@description User left id separator.
		*/
            this.idSeparatorLeft = global.idSeparatorLeft;
            /**
		*@type String
		*@description User right id separator.
		*/
            this.idSeparatorRight = global.idSeparatorRight;
            /**
		*@type Html Element
		*@description FieldsPanel main content Div Element.
		*/   
            this.virtualHtml = new Element('div',{
                'class':'fieldPanel fieldDispTotalWidth'
            });
            /**
		*@type Hash
		*@description List of services that shouldn't be called with different parameters
		*from the standard ones, when populating a fieldDisplayer.
		*/   
            this.blackList = $H({
                'get_field_val': true,
                'get_field_val2': true,
                'get_field_val5': true,
                'get_learn_val': true,
                'get_subtypes2': true,
                'get_branch': true,
                'get_certif': true,
                'get_bnk_key': true,
                'get_time_unit': true,
                'get_payscale': true,
                'get_ws_rule': true,
                'get_field_val0': true,
                'get_costcenter': true,
                'get_pcr_val': true,
                'get_paymentmod': true,
                'get_lgart': true,
                'get_nat_val': true,
                'get_time' : true
                
            });
            /**
		*@type Boolean
		*@description It controls if the edit mode fieldsPanel html code had been 
		*already created and if the current fieldsPanel state is 'edit mode'.
		*/
            this.editMode = false;
            /**
		*@type Boolean 
		*@description It controls if the current fieldsPanel state is 'display mode'.
		*/
            this.displayMode = false;
            /**
		*@type Object
		*@description It keeps the fieldsPanel fields data when tableMode is enabled.
		*/
            this.tableData = {
                header: [],
                rows: $H()
            };
            //That's a way to initialize all the hashes in one line.
            this.multipleInit(['fieldsInfo','translations','fieldsDiplayDependencies','radioButtonsOrder','labels','fieldsValues','tcontentFields','data','fields','regHtml','buttonDis','radioButtonsFields'],this,'Hash');
            //Tha's a way to initialize all the fieldsPanel constructor parameters in one line.
            this.setOptions(['name', 'newTranslation', 'fieldDisplayerModified', 'fireEventWhenDefaultValueSet', 'assignDefaultValue', 'predefinedXmls', 'event', 'mode', 'appId', 'paiEvent', 'noResultsHtml'], options);
            if(options && options.json)
                /**
			*@type Object
			*@description JSON object got from the backend using the get_content service.
			*/
                this.jsonIn = options.json;
            if(options && options.displayActionsOnEdit === true)
                this._displayActionsOnEdit = true;
            if(this.mode == 'create')
                /**
			*@type boolean
			*@description It sets if the fields value should be set to their default one.
			*/
                this.defaultValue = true;
            /**
		*@type String
		*@description Widget screen: needed parameter for the fieldDisplayers services. 
		*/
            this.widScreen = this.jsonIn.EWS.o_field_settings.yglui_str_wid_fs_record['@screen'];
            this.setLabels();
            /**
		*@type Date
		*@description It identifies the fieldsPanel as unique
		*/
            this.creationTime = (new Date()).getTime();
            document.observe(['FP:translation_',this.appId,this.widScreen,this.creationTime].join(''),this.changeLanguage.bindAsEventListener(this));
            document.observe(['FP:translation_',this.appId].join(''),this.changeLanguage.bindAsEventListener(this));
            //this method will handle the fieldsPanel data kept
            this.handleData();
        },
        /**It has to be called by the application that created the fieldsPanel object to
    * validate the form validation state     
	*@return Object 
	*/
        validateForm: function(){
            var state = true;
            var message = '';
            //looping over all fieldDisplayer objects
            if(Object.isEmpty(this.currentSelected)) {
                this.fields.each(function(item) {
                    item.each(function(field){
                        //To avoid crashing because of any fieldDisplayer type without checkFormat() method
                        try{
                            //calling each fieldDisplayer checkFormat() method
                            if(field.value)
                                if(!field.value.checkFormat()){
                                    state = false;
                                    if(field.value && field.value.options)
                                        message += '<br/>'+field.value.options.fieldLabel+': '+global.getLabel('fieldError');
                                }
                        }catch(e){}
                    }.bind(this));
                }.bind(this));    
            }
            else {
                this.fields.get(this.currentSelected).each(function(field){
                    //To avoid crashing because of any fieldDisplayer type without checkFormat() method
                    try{
                        //calling each fieldDisplayer checkFormat() method
                        if(!field.value.checkFormat()){
                            state = false;
                            if(field.value && field.value.options)
                                message += '<br/>'+field.value.options.fieldLabel+': '+global.getLabel('fieldError');
                        }
                    }catch(e){}
                }.bind(this));
            }
            //state= 'true' || 'false' and erroMessage:"field1Label: globalErrorMessage + field2Label: globalErrorMessage etc."
            return {
                correctForm:state,
                errorMessage:message
            };
        },
        /**It returns a fieldDisplayer settings
	*@param fieldId {String} fieldDisplayer object id
	*@return Object 
	*/
        getFieldInfo: function(fieldId){
            //fieldsInfo attribute keeps all the fields settings
            var ret = (!Object.isEmpty(this.fieldsInfo)&&!Object.isEmpty(this.fieldsInfo.get(fieldId)))?this.fieldsInfo.get(fieldId):'';
            return ret;
        },
        //COLLECTING THE DATA
        //*************************************************************************************
        /**It structures the fieldsPanel fields info in the proper way, deciding
    * among the different modes we can have.    
	*/
        handleData: function(){
            //Depending on the mode
            if(this.isTableMode()){
                this.handleDataTableMode();
            }else if(!Object.isEmpty(this.jsonIn.EWS.o_field_values)){
                this.handleDataNormalMode();
            }else{
                //If no fields were found
                this.virtualHtml.insert(this.noResultsHtml);
            }
        },
        /**It structures the fieldsPanel fields info in the proper way when the tableMode is enabled.
	*/
        handleDataTableMode: function(){
            this.setTableModeHtml();
            objectToArray(this.jsonIn.EWS.o_field_settings.yglui_str_wid_fs_record.fs_fields.yglui_str_wid_fs_field).each(function(setting){
                this.data.set(setting['@fieldid'],setting);
                if(!Object.isEmpty(setting['@fieldid']) && (setting['@fieldid'] != 'TRANSLATION')){
                    var label = this.chooseLabel(setting['@fieldid'],setting['@label_type'],setting['@fieldlabel']);
                    this.tableData.header.push({
                        text:label,
                        id:[setting['@fieldid'],setting['@seqnr']].join('')
                    });
                }
            }.bind(this));
            //*****************************************************************************
            var iter = 0;
            objectToArray(this.jsonIn.EWS.o_field_values.yglui_str_wid_record).each(function(row){
                this.translations.set(iter,{
                    settings:null,
                    values:null
                });
                this.tableData.rows.set(['row',iter].join(''),{
                    data: []
                });
                this.fields.set(iter,$H());
                if(this.checkEmpty([row.contents,row.contents.yglui_str_wid_content,row.contents.yglui_str_wid_content.fields.yglui_str_wid_field]))
                    objectToArray(row.contents.yglui_str_wid_content.fields.yglui_str_wid_field).each(function(field){
                        if(!Object.isEmpty(field['@fieldid']) && (field['@fieldid'] != 'TRANSLATION')){
                            this.fields.get(iter).set(field['@fieldid'],field);
                        }
                    }.bind(this));
                if(this.checkEmpty([row.contents,row.contents.yglui_str_wid_content,row.contents.yglui_str_wid_content.fields,row.contents.yglui_str_wid_content.fields.yglui_str_wid_field])){
                    objectToArray(row.contents.yglui_str_wid_content.fields.yglui_str_wid_field).each(function(column){
                        var auxField = this.data.get(column['@fieldid']);
                        if(!Object.isEmpty(column['@fieldid']) && (column['@fieldid'] != 'TRANSLATION')){
                            var strKey = (!Object.isEmpty(row.contents.yglui_str_wid_content['@key_str']))?row.contents.yglui_str_wid_content['@key_str']:'';
                            var displayer = this.getDisplayerOptions(auxField,column,strKey,null,true,iter,false);
                            this.tableData.rows.get(['row',iter].join('')).data.push({
                                text: displayer,
                                id: ['fieldsPanelTd_',this.appId,'_',iter,column['@fieldid']].join('')
                            });
                        }else if(column['@fieldid'] == 'TRANSLATION'){
                            this.translations.get(iter).settings = auxField;
                            this.translations.get(iter).values = column;
	                        
                        }
                    }.bind(this));
                }
                iter++;
            }.bind(this));
            if(!Object.isEmpty(this.translations) && !Object.isEmpty(this.translations.get(0)) &&!Object.isEmpty(this.translations.get(0).settings))
                this.createTranslationsNavigation();
            if((this.mode == 'edit') || (this.mode == 'create')){
                this.createTableFieldsEdit(); 
            }else if(this.mode == 'display'){
                this.createTableFieldsDisplay();
            }     
            this.translations.each(function(row){
                if(row && row.value && row.value.values && row.value.values['@value'] == this.language){
                    this.changeLanguage(row.key);
                    return;
                }
            }.bind(this));                
        //*****************************************************************************
        },
        /**It adds a new row to the fieldsPanel object when the edit and table modes are enabled.
	*@param rowId {String} table row id.
	*/
        addRowTableFieldsEdit: function(rowId){
            var rowName = ['row',rowId].join('');
            objectToArray(this.tableData.rows.get(rowName).data).each(function(field){
                var aux = new FieldDisplayer(field.text,this.fields.get(rowId).get(field.text.sapId));
                field.text = aux.getElement();
            }.bind(this));
            var auxData = $H();
            auxData.set(rowName,this.tableData.rows.get(rowName));
            this.tableEdit.addRow(auxData);
        },
        /**It adds a new row to the fieldsPanel object when the display and table modes are enabled.
	*@param rowId {String} table row id.
	*/
        addRowTableFieldsDisplay: function(rowId){
            var rowName = ['row',rowId].join('');
            objectToArray(this.tableData.rows.get(rowName).data).each(function(field){
                if(!Object.isEmpty(field.text.defaultValue))
                    field.text = field.text.defaultValue.text;
                else
                    field.text = '';
            }.bind(this));
            var auxData = $H();
            auxData.set(rowName,this.tableData.rows.get(rowName));
            this.tableDisplay.addRow(auxData);
        },
        /**It adds a new row to the fieldsPanel object when the table mode is enabled.
	*@param rowId {String} table row id.
	*/
        addRow: function(rowId){
            var row = this.newTranslation;
            var rowName = ['row',rowId].join('');
            if(!Object.isEmpty(row)){
                this.tableData.rows.set(rowName,{
                    data: []
                });
                this.fields.set(rowId,$H());
                if(this.checkEmpty([row.contents,row.contents.yglui_str_wid_content,row.contents.yglui_str_wid_content.fields.yglui_str_wid_field]))
                    objectToArray(row.contents.yglui_str_wid_content.fields.yglui_str_wid_field).each(function(field){
                        if(!Object.isEmpty(field['@fieldid']) && (field['@fieldid'] != 'TRANSLATION')){
                            this.fields.get(rowId).set(field['@fieldid'],field);
                        }
                    }.bind(this));
                if(this.checkEmpty([row.contents,row.contents.yglui_str_wid_content,row.contents.yglui_str_wid_content.fields,row.contents.yglui_str_wid_content.fields.yglui_str_wid_field])){
                    objectToArray(row.contents.yglui_str_wid_content.fields.yglui_str_wid_field).each(function(column){
                        var auxField = this.data.get(column['@fieldid']);
                        if(!Object.isEmpty(column['@fieldid']) && (column['@fieldid'] != 'TRANSLATION')){
                            var strKey = (!Object.isEmpty(row.contents.yglui_str_wid_content['@key_str']))?row.contents.yglui_str_wid_content['@key_str']:'';
                            var displayer = this.getDisplayerOptions(auxField,column,strKey,null,false,rowId,false);
                            this.tableData.rows.get(rowName).data.push({
                                text: displayer,
                                id: ['fieldsPanelTd_',this.appId,'_',rowId,column['@fieldid']].join('')
                            });
                        }
                    }.bind(this));
                }
            }
            if((this.mode == 'edit') || (this.mode == 'create')){
                this.addRowTableFieldsEdit(rowId);
            }else if(this.mode == 'display'){
                this.addRowTableFieldsDisplay(rowId);
            }
        },
        /**It switches among the different translation regs the fieldsPanel has.
	*@param event {Event Object} it keeps the selected translation.
	*/
        changeLanguage: function(event){
            var rowId = getArgs(event);
            var rowName = ['row',rowId].join('');
            if((this.mode == 'edit') || (this.mode == 'create')){
                if(Object.isEmpty(this.tableData.rows.get(rowName))){
                    this.addRow(rowId);
                }
                this.tableData.rows.each(function(row){
                    this.tableEdit.hideRow(row.key);
                }.bind(this));
                this.tableEdit.showRow(rowName);
            }else if(this.mode == 'display'){
                if(!Object.isEmpty(this.tableData.rows.get(rowName))){
                    this.tableData.rows.each(function(row){
                        this.tableDisplay.hideRow(row.key);
                    }.bind(this));
                    this.tableDisplay.showRow(rowName);
                }
            }
            if(Object.isString(rowId)){
                this.translationButtons.getButtonsArray().each(function(button){
                    if(!Object.isEmpty(button.value[0].data) && (rowId == button.value[0].data)){
                        button.value[1].addClassName('fieldsPanel_linkSelected');
                    }else if(!Object.isEmpty(button.value[0].data)){
                        button.value[1].removeClassName('fieldsPanel_linkSelected');
                    }
                }.bind(this));
            }
        },
        /**It creates the translations top menu (above the fields) html code.
	*/
        createTranslationsNavigation: function(){
            var json = {
                elements:[],
                mainClass: 'fieldsPanel_translation_container'
            };
            var divTranslations = new Element('div',{
                'class':'fieldsPanel_translationMenu fieldsPanel_margin'
            });
            if(!Object.isEmpty(this.translations) && !Object.isEmpty(this.translations.get(0)) &&!Object.isEmpty(this.translations.get(0).settings))
                divTranslations.insert(["<span class='application_main_title2 fieldsPanel_marginRight'>",this.translations.get(0).settings['@fieldlabel'],"</span>"].join(''));
            if(this.isTableMode()){
                var translationsShown = [];
                this.translations.each(function(row){
                    translationsShown.push(row.value.values['@value']);
                    var aux =   {
                        idButton: row.value.values['@value'],
                        action: row.value.values['@value'],
                        label: row.value.values['#text'],
                        data:row.key,
                        className: 'application_action_link fieldsPanel_button',
                        event: ['FP:translation_',this.appId,this.widScreen,this.creationTime].join(''),
                        type: 'link',
                        eventOrHandler: true
                    };
                    json.elements.push(aux);
                }.bind(this));
                this.allTranslations.each(function(translation){
                    if(!translationsShown.include(translation.key)){
                        var linkData = (this.mode != 'display')?parseInt(this.tableData.rows.keys().invoke('gsub','row','').max(),10)+1:'';
                        var cName = (this.mode != 'display')?'application_action_link fieldsPanel_button':'fieldsPanel_deactivatedLink';
                        var aux =   {
                            idButton: translation.key,
                            action: translation.key,
                            label: global.getLabel(translation.key),
                            data: linkData,
                            className: cName,
                            event: ['FP:translation_',this.appId,this.widScreen,this.creationTime].join(''),
                            type: 'link',
                            eventOrHandler: true
                        };
                        json.elements.push(aux);
                    }
                }.bind(this));
                this.translationButtons = new megaButtonDisplayer(json);
                divTranslations.insert(this.translationButtons.getButtons());
                if((this.mode == 'edit') || (this.mode == 'create')){
                    this.regHtml.get(0)[0].insert(divTranslations);
                }else if(this.mode == 'display'){
                    this.regHtml.get(0)[1].insert(divTranslations);
                }
            }
        },
        /**It structures the fieldsPanel fields info in the proper way when the tableMode is disabled.
	*/
        handleDataNormalMode: function(){
            if(Object.isEmpty(this.jsonIn.EWS.o_field_values.yglui_str_wid_record))
                return;
            var contents = objectToArray(this.jsonIn.EWS.o_field_values.yglui_str_wid_record.contents.yglui_str_wid_content);
            var regDefault = false;
            for(var it = (contents.size()-1);it>=0;it--){
                var regD = contents[it];
                if((regD['@selected'] && (regD['@selected'].toLowerCase() == 'x'))){
                    regDefault = true;
                }                
            }
            if(!regDefault)
                $A(contents).first()['@selected'] = 'X';
            for(var iterContents = (contents.size()-1);iterContents>=0;iterContents--)
            {
                var reg = contents[iterContents];
                var recIndex = reg['@rec_index'];
                this.setHtml(reg);
                this.fields.set(recIndex,$H());
                this.fieldsValues.set(recIndex,$H());
                this.fieldsDiplayDependencies.set(recIndex,$H());
                var but = [];
                if(reg.buttons && reg.buttons.yglui_str_wid_button)
                    but = objectToArray(reg.buttons.yglui_str_wid_button);
                var tableContents = [];
                if(reg.tcontents && reg.tcontents.yglui_str_wid_tcontent){
                    var r = deepCopy(reg);
                    tableContents = objectToArray(r.tcontents.yglui_str_wid_tcontent);
                }
                this.data.set(recIndex,{
                    fields:[],
                    keyStr:reg['@key_str'],
                    selected:(reg['@selected'] && (reg['@selected'].toLowerCase() == 'x'))?true:false,
                    buttons: but,
                    tcontents: tableContents
                });
                var values = $H();
                if(!Object.isEmpty(reg.fields)){
                    var valuesContent = objectToArray(reg.fields.yglui_str_wid_field);
                    for(var iterValues = (valuesContent.size()-1);iterValues>=0;iterValues--){
                        var field = valuesContent[iterValues];
                        values.set(field['@fieldid'],field);
                        this.fieldsValues.get(recIndex).set(field['@fieldid'],field);
                    }
                }
                if(!Object.isEmpty(reg.tcontents) && !Object.isEmpty(reg.tcontents.yglui_str_wid_tcontent)){
                    var tContentArray = objectToArray(reg.tcontents.yglui_str_wid_tcontent);
                    for(var iterTcontent = (tContentArray.size()-1);iterTcontent>=0;iterTcontent--){
                        var table = tContentArray[iterTcontent];
                        if(!Object.isEmpty(table.fields) && !Object.isEmpty(table.fields.yglui_str_wid_field)){
                            var tContentFieldsArray = objectToArray(table.fields.yglui_str_wid_field);
                            for(var iterTcontentField = (tContentFieldsArray.size()-1);iterTcontentField>=0;iterTcontentField--){
                                var tableRow = tContentFieldsArray[iterTcontentField];
                                this.fieldsValues.get(recIndex).set([tableRow['@fieldid'],table['@seqnr']].join(''),tableRow);
                            }
                        }
                    }
                }
                this.radioButtonsOrder.set(recIndex,$H());
                this.radioButtonsFields.set(recIndex,$H());
                this.tcontentFields.set(recIndex,$H({
                    row:$H()
                }));
                this.translations.set(recIndex,{
                    settings:null,
                    values:null
                });
                objectToArray(this.jsonIn.EWS.o_field_settings.yglui_str_wid_fs_record.fs_fields.yglui_str_wid_fs_field).each(function(oneField){
                    var field = deepCopy(oneField);
                    if(!Object.isEmpty(values.get(field['@fieldid'])) && (field['@fieldid'] == 'TRANSLATION')){
                        this.translations.get(recIndex).settings = field;
                        this.translations.get(recIndex).values = values.get(field['@fieldid']);
                    }else{
                        if(!Object.isEmpty(values.get(field['@fieldid']))){
                            field['@fieldtechname'] = values.get(field['@fieldid'])['@fieldtechname'];
                            field['@value'] = values.get(field['@fieldid'])['@value'];
                            field['#text'] = values.get(field['@fieldid'])['#text'];
                            if(!field['@label_type'] || (field['@label_type'].toLowerCase() == 'n')){
                                field['@fieldlabel'] = '';
                            }else if(field['@label_type'] && (field['@label_type'].toLowerCase() != 'v')){
                                field['@fieldlabel'] = values.get(field['@fieldid'])['@fieldlabel'];
                            }
                            if(!Object.isEmpty(field['@fieldid']) && ((field['@fieldid'].split('_')[0]).toLowerCase() == 'opt')){
                                var auxHash = $H();
                                if(this.radioButtonsFields.get(recIndex).get(field['@fieldid'].split('_')[1])){
                                    auxHash.set(field['@fieldid'],field);
                                    var hashCopy = this.radioButtonsFields.get(recIndex).get(field['@fieldid'].split('_')[1]);
                                    this.radioButtonsFields.get(recIndex).set(field['@fieldid'].split('_')[1],hashCopy.merge(auxHash));
                                }else{
                                    auxHash.set(field['@fieldid'],field);
                                    this.radioButtonsFields.get(recIndex).set(field['@fieldid'].split('_')[1],auxHash);
                                }
                            }else{
                                if(!Object.isEmpty(field['@display_group'])){
                                    if((field['@display_group'].split('_')[0] == 'RADIO') && (field['@display_group'].split('_')[2] == 1)){
                                        this.radioButtonsOrder.get(recIndex).set(field['@display_group'].split('_')[1],field['@seqnr']);
                                    }
                                }
                                this.data.get(recIndex).fields[new Number(field['@seqnr'])] = field;
                                this.fieldsInfo.set(field['@fieldid'],field);
                            }
                        }else if(oneField['@fieldsource'] && (oneField['@fieldsource'].toLowerCase() == 't')){
                            this.tcontentFields.get(recIndex).get('row').set(field['@fieldid'],field);
                        }
                    }
                }.bind(this));
                this.data.get(recIndex).fields = this.data.get(recIndex).fields.compact();
            }
            if((this.mode == 'edit') || (this.mode == 'create'))
                this.createFieldsEdit();
            else if(this.mode == 'display')
                this.createFieldsDisplay();
        },
        /**It builds the specific html code for a given fieldsPanel register.
	*@param reg {Object} fieldsPanel register info
	*/
        setHtml: function(reg){
            var auxRegEditDiv = new Element('div',{
                'class':'fieldPanel fieldDispTotalWidth',
                'id':[reg['@rec_index'],'_fieldsPanel_regDivEdit'].join('')
            });
            var auxRegDisplayDiv = new Element('div',{
                'class':'fieldPanel fieldDispTotalWidth',
                'id':[reg['@rec_index'],'_fieldsPanel_regDivDisplay'].join('')
            });
            var editViewMore = new Element('div',{
                'class':'fieldPanel fieldDispTotalWidth',
                'id':[reg['@rec_index'],'_',this.widScreen,'_',this.appId,'_FPviewMoreEdit'].join('')
            });
            var displayViewMore = new Element('div',{
                'class':'fieldPanel fieldDispTotalWidth',
                'id':[reg['@rec_index'],'_',this.widScreen,'_',this.appId,'_FPviewMoreDisplay'].join('')
            });
            auxRegEditDiv.insert(editViewMore.hide());
            auxRegDisplayDiv.insert(displayViewMore.hide());
            this.virtualHtml.insert(auxRegEditDiv.hide());
            this.virtualHtml.insert(auxRegDisplayDiv.hide());
            if((reg['@selected'] && (reg['@selected'].toLowerCase() == 'x')) || (objectToArray(this.jsonIn.EWS.o_field_values.yglui_str_wid_record.contents.yglui_str_wid_content).size() == 1) ){
                this.currentSelected = reg['@rec_index'];
                if((this.mode == 'edit')||(this.mode == 'create'))
                    auxRegEditDiv.show();
                else if(this.mode == 'display')
                    auxRegDisplayDiv.show();
            }
            this.regHtml.set(reg['@rec_index'],[auxRegEditDiv,auxRegDisplayDiv]);
        },
        //EDIT MODE
        //******************************************************************************************
        /**It creates the fieldDisplayer objects that are not in a tcontent field.
	*@param reg {Object} fieldsPanel register info.
	*/
        createEditFields: function(reg){
            objectToArray(reg.value.fields).each(function(oneField){
                var auxRadioGroupDiv = this.radioButtonsOrder.get(reg.key).get(parseInt(oneField['@seqnr'],10)+1);
                if(!Object.isEmpty(auxRadioGroupDiv)){
                    this.regHtml.get(reg.key)[0].insert(auxRadioGroupDiv);
                }
                var strKey = (!Object.isEmpty(reg.value.keyStr))?reg.value.keyStr:'';
                this.fields.get(reg.key).set(oneField['@fieldid'],
                    new FieldDisplayer(
                        this.getDisplayerOptions(oneField,null,strKey,reg,false,null,false),
                        this.fieldsValues.get(reg.key).get(oneField['@fieldid']))
                    );
                if(((!Object.isEmpty(oneField['@display_group'])) && (oneField['@display_group'].split('_')[0].toLowerCase() == 'radio'))){
                    this.fields.get(reg.key).get(oneField['@fieldid']).getElement();
                }
                if((oneField['@display_group']) && (oneField['@display_group'] != '')){
                    var aux = this.regHtml.get(reg.key)[0].down(['[id=group_',reg.key,'_',oneField['@display_group'],']'].join(''));
                    if(aux)
                    {
                        aux.insert(this.fields.get(reg.key).get(oneField['@fieldid']).getElement());
                    }else{
                        var div = new Element('div',{
                            'class':'fieldPanel fieldDispTotalWidth',
                            'id':['group_',reg.key,'_',oneField['@display_group']].join('')
                        });
                        if(!Object.isEmpty(this.labels.get(oneField['@display_group'])))
                            div.insert(["<div class='fieldsPanel_groupLabel'><span class='application_main_title3 fieldsPanel_groupLabelText'>",this.labels.get(oneField['@display_group']),"</span><hr/></div>"].join(''));
                        var fieldHtml = this.fields.get(reg.key).get(oneField['@fieldid']).getElement();
                        if(oneField['@display_group'].split('_')[0].toLowerCase() != 'radio'){
                            if(oneField['@fieldtype'] &&  (oneField['@fieldtype'].toLowerCase() == 's')){
                                this.regHtml.get(reg.key)[0].down(['[id=',reg.key,'_',this.widScreen,'_',this.appId,'_FPviewMoreEdit]'].join('')).insert(div);
                            }else{
                                this.regHtml.get(reg.key)[0].insert(div);
                            }
                        }else{
                            this.regHtml.get(reg.key)[0].down(['[id=fieldsPanel_',this.appId,'_',reg.key,'_',oneField['@display_group']].join('').gsub('RADIO','OPT')+']').down('[class=fieldsPanel_DisplayRadioContent]').insert(div);
                        }
                        div.insert(fieldHtml);
                    }
                }else{
                    if(oneField['@fieldtype'] &&  (oneField['@fieldtype'].toLowerCase() == 's')){
                        this.regHtml.get(reg.key)[0].down(['[id=',reg.key,'_',this.widScreen,'_',this.appId,'_FPviewMoreEdit]'].join('')).insert(this.fields.get(reg.key).get(oneField['@fieldid']).getElement());
                    }else{
                        if(oneField['@fieldid']){
                            this.regHtml.get(reg.key)[0].insert( this.fields.get(reg.key).get(oneField['@fieldid']).getElement() );
                        }
                    }
                }
            }.bind(this));
        },
        createActionButtons: function(reg) {
            var json = {
                elements: new Array()
            };
            var jsonNav = {
                elements: new Array()
            };
            objectToArray(reg.value.buttons).each(function(button){
                if((button['@action'] != 'NEXT') && (button['@action'] != 'PREVIOUS')) {
                    var auxLabel = (!Object.isEmpty(button['@label_tag']))?button['@label_tag']:button['@action'];
                    //If tarty = W --> it's a PCR, and we need more parameters
                    var data =  (button['@tarty'] == 'W') ? [reg.key ,'_',button['@type'], '_',button['@tarty'], '/',button['@tarap']].join('') :  [reg.key ,'_',button['@type']].join('');
                    aux =   {
                        action: button['@action'],
                        label: auxLabel,
                        data: data,
                        className: 'application_action_link fieldsPanel_button',
                        event: this.event,
                        type: 'link',
                        eventOrHandler: true
                    };
                    json.elements.push(aux);
                }

            }.bind(this));
            var auxButtonDis = new megaButtonDisplayer(json);
            if(!Object.isEmpty(json.elements) && (json.elements.size() > 0))
                this.regHtml.get(reg.key)[0].insert(new Element('div', {
                    style: 'clear: both;'
                }).insert(auxButtonDis.getButtons()));
        },
        /**It creates the fieldDisplayer radio buttons and fieldDisplayer objects and html structure.
	*@param reg {Object} fieldsPanel register info. 
	*/
        createEditRadioFields: function(reg){
            this.radioButtonsFields.get(reg.key).each(function(radioGroup){
                var auxDiv = new Element('div',{
                    'id':['fieldsPanel_',this.appId,'_',reg.key,'_',radioGroup.key].join(''),
                    'class':'fieldsPanel_mainRadioGroup'
                });
                var position = parseInt(this.radioButtonsOrder.get(reg.key).get(radioGroup.key),10);
                this.radioButtonsOrder.get(reg.key).unset(radioGroup.key);
                this.radioButtonsOrder.get(reg.key).set(position,auxDiv);
                var someChecked = false;
                objectToArray(radioGroup.value).each(function(radioButton){
                    var radioElement = this.fieldsValues.get(reg.key).get(radioButton.key);
                    if(!Object.isEmpty(radioElement['@value']) && (radioElement['@value'].toLowerCase() == 'x'))
                    {
                        someChecked = true;
                        return;
                    }
                }.bind(this));
                var radioCount = 0;
                objectToArray(radioGroup.value).each(function(radioButton){
                    var auxDivRadioButton = new Element('div',{
                        'id':['fieldsPanel_',this.appId,'_',reg.key,'_',radioButton.key].join(''),
                        'class':'fieldsPanel_radioGroup'
                    });
                    var radioButtonCopy = this.fieldsValues.get(reg.key).get(radioButton.key);
                    var checked = (!Object.isEmpty(radioButtonCopy['@value']) && (radioButtonCopy['@value'].toLowerCase() == 'x'))?'checked':'';
                    if(!someChecked && (radioCount == 0)){
                        checked = 'checked';
                        radioButtonCopy['@value'] = 'X';
                    }
                    var radio = ["<input class='fieldsPanel_radioButton' ",checked," type='radio' id='fieldsPanel-",this.appId,"-",reg.key,"-",radioButton.key,"-RadioButton' name='fieldsPanel_",this.appId,"_",reg.key,"_",radioGroup.key,"_Group'/>"].join('');
                    auxDivRadioButton.insert("<div class='fieldsPanel_DisplayRadio'></div><div class='fieldsPanel_DisplayRadioContent'></div>");
                    auxDivRadioButton.down('div.fieldsPanel_DisplayRadio').insert(radio);
                    auxDivRadioButton.down('[type=radio]').observe('click',function(radioButton){
                        var id = radioButton.element().identify().split('-')[3];
                        var group = id.split('_')[1];
                        this.fieldsValues.get(arguments[0].element().identify().split('-')[2]).each(function(field){
                            if(field.key == id)
                            {
                                field.value['@value'] = 'X';
                            }else if(field.key.split('_')[1] == group){
                                field.value['@value'] = null;
                            }
                        });
                        if(!Object.isEmpty(this.fieldDisplayerModified)){
                            document.fire(this.fieldDisplayerModified);
                        }
                    }.bind(this));
                    auxDiv.insert(auxDivRadioButton).insert("<div style='clear:both;font-size:1px;'>&nbsp;</div>");
                    radioCount++;
                }.bind(this));
            }.bind(this));
        },
        /**It returns an empty tcontent field row.
	*@param regKey {String} the current fieldsPanel register id.
	*/
        getEmptyTcontentRow: function(regKey){
            var emptyObject = null;
            var auxEmpty = null;
            if(!Object.isEmpty(this.data.get(regKey)) && !Object.isEmpty(this.data.get(regKey).tcontents)){
                auxEmpty = deepCopy(this.jsonIn.EWS.o_field_settings.yglui_str_wid_fs_record.tcontent_empty);			    
                var max = 0;
                this.data.get(regKey).tcontents.each(function(row){
                    if(parseInt(row['@seqnr'],10)>max){
                        max = parseInt(row['@seqnr'],10);
                    }
                });
                var next = parseInt(max,10)+1;
                auxEmpty.yglui_str_wid_field.each(function(emptyField){
                    emptyField['@fieldtseqnr'] = next;
                }.bind(this));
                emptyObject =deepCopy({
                    fields: auxEmpty
                });
                emptyObject['@seqnr'] = next;
            }
            return emptyObject;
        },
        /**It inserts a tcontent row related data into the general fieldsPanel data structures.
	*@param regKey {String} the current fieldsPanel register id.
	*@param row {Object} row data to be inserted.
	*/
        addTcontentRowToJson: function(regKey,row){
            var reg = null;
            if(!Object.isEmpty(this.jsonIn.EWS.o_field_values) && !Object.isEmpty(this.jsonIn.EWS.o_field_values.yglui_str_wid_record) && !Object.isEmpty(this.jsonIn.EWS.o_field_values.yglui_str_wid_record.contents) && !Object.isEmpty(this.jsonIn.EWS.o_field_values.yglui_str_wid_record.contents.yglui_str_wid_content)){
                objectToArray(this.jsonIn.EWS.o_field_values.yglui_str_wid_record.contents.yglui_str_wid_content).each(function(element){
                    if(parseInt(element['@rec_index'],10) == parseInt(regKey,10)){
                        reg = element;
                        return;
                    }
                });
            }
            if(!Object.isEmpty(reg) && !Object.isEmpty(reg.tcontents)){
                if(!Object.isEmpty(reg.tcontents.yglui_str_wid_tcontent) && Object.isArray(reg.tcontents.yglui_str_wid_tcontent)){
                    this.data.get(regKey).tcontents.push(row);
                    reg.tcontents.yglui_str_wid_tcontent.push(row);
                }else if(!Object.isEmpty(reg.tcontents.yglui_str_wid_tcontent)){
                    this.data.get(regKey).tcontents = objectToArray(reg.tcontents.yglui_str_wid_tcontent);
                    this.data.get(regKey).tcontents.push(row);
                    reg.tcontents.yglui_str_wid_tcontent = objectToArray(reg.tcontents.yglui_str_wid_tcontent);
                    reg.tcontents.yglui_str_wid_tcontent.push(row);
                }else{
                    this.data.get(regKey).tcontents = row;
                    reg.tcontents.yglui_str_wid_tcontent = row;
                }
            }
	    
        },
        /**It builds a tcontent row html and inserts it into the tcontent field html.
	*@param regKey {String} the current fieldsPanel register id.
	*@param row {Object} row data from which it is got the info to build the tcontent row html.
	*/
        addRowToTable: function(regKey,row){
            var tableDataEdit ={
                header: [],
                rows: $H()
            };
            var reg = this.data.get(regKey);
            tableDataEdit.rows.set(['row',row['@seqnr']].join(''),{
                data: []
            });
            var dataArray = [];
            objectToArray(row.fields.yglui_str_wid_field).each(function(column){
                this.fieldsValues.get(regKey).set([column['@fieldid'],row['@seqnr']].join(''),column);
                var auxField = this.tcontentFields.get(regKey).get('row').get(column['@fieldid']);
                var strKey = (!Object.isEmpty(reg.keyStr))?reg.keyStr:'';
                var displayer = new FieldDisplayer(
                    this.getDisplayerOptions(auxField,column,strKey,{
                        key:regKey
                    },true,row['@seqnr'],true),
                    this.fieldsValues.get(regKey).get([auxField['@fieldid'],row['@seqnr']].join('')));
                this.fields.get(regKey).set([column['@fieldid'],row['@seqnr']].join(''),displayer);
                tableDataEdit.rows.get(['row',row['@seqnr']].join('')).data[parseInt(auxField['@seqnr'],10)] = {
                    text: displayer.getElement(),
                    id: ['fieldsPanelTd_',regKey,'_',this.appId,'_',row['@seqnr'],column['@fieldid']].join('')
                };
            }.bind(this));
            /***********************************************/
            var mainButtonsJson = {
                elements: [],
                mainClass: 'applicationDEL_deleteButton'
            };
            var aux = {
                idButton: 'deleteButton_' + row['@seqnr'],
                label: '',
                handlerContext: null,
                handler: this.deleteRowTcontent.bind(this, [regKey, row]),
                className: 'application_currentSelection fieldsPanel_deleteButton PFM_delete_cross',
                type: 'button'
            };
            mainButtonsJson.elements.push(aux);
            var button = new megaButtonDisplayer(mainButtonsJson);
        
            /***********************************************/
            tableDataEdit.rows.get(['row',row['@seqnr']].join('')).data.unshift({
                text:button.getButtons(),
                id:[regKey,'_',row['@seqnr'],'_fieldsPanel_tcontentHeader_deleteButton_',this.appId].join('')
            });
            tableDataEdit.rows.get(['row',row['@seqnr']].join('')).data = tableDataEdit.rows.get(['row',row['@seqnr']].join('')).data.compact();
            this.tableDataEditTcontent.get('table').addRow(tableDataEdit.rows);
        },
        /**It builds a tcontent row html (from an empty tcontent row data object) and inserts it into the tcontent field html and
	* inserts a tcontent row related data into the general fieldsPanel data structures.    
	*@param regKey {String} the current fieldsPanel register id.
	*@param event {Event Object} event thrown when clicking on a tcontent field add button.
	*/
        addRowTcontent: function(regKey,event){
            var row = this.getEmptyTcontentRow(regKey);
            if(!Object.isEmpty(row)){
                this.addTcontentRowToJson(regKey,row);
                this.addRowToTable(regKey,row);
            }
        },
        /**It removes a tcontent row html from the tcontent field html and
	* deletes the tcontent row related data rom the general fieldsPanel data structures.     
	*@param event {Event Object} event thrown when clicking on a tcontent field row delete button.
	*/
        deleteRowTcontent: function(event){
            var regKey = event[0];
            var row = event[1];
            this.tableDataEditTcontent.get('table').removeRow(['row',row['@seqnr']].join(''));
            var reg = null;
            if(!Object.isEmpty(this.jsonIn.EWS.o_field_values) && !Object.isEmpty(this.jsonIn.EWS.o_field_values.yglui_str_wid_record) && !Object.isEmpty(this.jsonIn.EWS.o_field_values.yglui_str_wid_record.contents) && !Object.isEmpty(this.jsonIn.EWS.o_field_values.yglui_str_wid_record.contents.yglui_str_wid_content)){
                objectToArray(this.jsonIn.EWS.o_field_values.yglui_str_wid_record.contents.yglui_str_wid_content).each(function(element){
                    if(parseInt(element['@rec_index'],10) == parseInt(regKey,10)){
                        reg = element;
                        return;
                    }
                });
            }
            
            
            
            if(!Object.isEmpty(reg) && !Object.isEmpty(reg.tcontents)){
                if(!Object.isEmpty(reg.tcontents.yglui_str_wid_tcontent) && Object.isArray(reg.tcontents.yglui_str_wid_tcontent)){
                    var regRow = null;
                    reg.tcontents.yglui_str_wid_tcontent.each(function(rowAux){
                        if(rowAux['@seqnr'] == row['@seqnr']){
                            regRow = rowAux;
                            return;
                        }                        
                    }.bind(this));                    
                    this.data.get(regKey).tcontents = this.data.get(regKey).tcontents.without(row);
                    reg.tcontents.yglui_str_wid_tcontent = reg.tcontents.yglui_str_wid_tcontent.without(regRow);
                }else {
                    this.data.get(regKey).tcontents = [];
                    reg.tcontents.yglui_str_wid_tcontent = null;
                }
            }
	    reg.tcontents.yglui_str_wid_tcontent[regKey].fields.yglui_str_wid_field.each(function(iter) {
                this.fields.get(regKey).get(iter['@fieldid']+row['@seqnr']).destroy();
                this.fields.get(regKey).unset(iter['@fieldid']+row['@seqnr']);
            }.bind(this));
        },
        /**It creates the fieldDisplayer objects that belong to a tcontent field.
	*@param reg {Object} fieldsPanel register info.
	*/
        createEditTableFields: function(reg){
            if(this.tcontentFields.get(reg.key).get('row').size() > 0){
                var tableDataEdit ={
                    header: [],
                    rows: $H()
                };
                var headerArray = [];
                this.tcontentFields.get(reg.key).each(function(tableFieldsSettings){
                    tableFieldsSettings.value.keys().each(function(key){
                        var oneField = this.tcontentFields.get(reg.key).get('row').get(key);
                        var label = this.chooseLabel(oneField['@fieldid'],oneField['@label_type'],oneField['@fieldlabel']);
                        if(oneField['@display_attrib'] == 'MAN'){
                            label = label+"(*)";
                        }
                        tableDataEdit.header[parseInt(oneField['@seqnr'],10)]={
                            text:label,
                            id: [key,'_fieldsPanel_',reg.key,'_',this.appId,'_',tableFieldsSettings.value.keys().indexOf(key)].join('')
                        };
                    }.bind(this));
                    objectToArray(reg.value.tcontents).each(function(row){
                        tableDataEdit.rows.set(['row',row['@seqnr']].join(''),{
                            data: []
                        });
                        var dataArray = [];
                        objectToArray(row.fields.yglui_str_wid_field).each(function(column){
                            var auxField = tableFieldsSettings.value.get(column['@fieldid']); 
                            var strKey = (!Object.isEmpty(reg.value.keyStr))?reg.value.keyStr:'';
                            var displayer = new FieldDisplayer(
                                this.getDisplayerOptions(auxField,column,strKey,reg,true,row['@seqnr'],true),
                                this.fieldsValues.get(reg.key).get([auxField['@fieldid'],row['@seqnr']].join(''))); 
                            this.fields.get(reg.key).set([column['@fieldid'],row['@seqnr']].join(''),displayer);               
                            tableDataEdit.rows.get(['row',row['@seqnr']].join('')).data[parseInt(auxField['@seqnr'],10)] = {
                                text: displayer.getElement(),
                                id: ['fieldsPanelTd_',reg.key,'_',this.appId,'_',row['@seqnr'],column['@fieldid']].join('')
                            };
                        }.bind(this)); 
                        /***********************************************/
                        var mainButtonsJson = {
                            elements: [],
                            mainClass: 'applicationDEL_deleteButton'                           
                        };
                        var aux = {
                            idButton: 'deleteButton_' + row['@seqnr'],
                            label: '',
                            handlerContext: null,
                            handler: this.deleteRowTcontent.bind(this,[reg.key, row]),
                            className: 'application_currentSelection fieldsPanel_deleteButton PFM_delete_cross',
                            type: 'button'
                        };
                        mainButtonsJson.elements.push(aux);
                        var button = new megaButtonDisplayer(mainButtonsJson);
                        
                        /***********************************************/
                        tableDataEdit.rows.get(['row',row['@seqnr']].join('')).data.unshift({
                            text:button.getButtons(),
                            id:[reg.key,'_',row['@seqnr'],'_fieldsPanel_tcontentHeader_deleteButton_',this.appId].join('')
                        });
                        tableDataEdit.rows.get(['row',row['@seqnr']].join('')).data = tableDataEdit.rows.get(['row',row['@seqnr']].join('')).data.compact();                         
                    }.bind(this));
                }.bind(this));
                tableDataEdit.header.unshift({
                    text:"<span class='application_action_link'>"+global.getLabel('add')+"</span>",
                    id:['fieldsPanel_tcontentHeader_',this.appId,reg.key].join(''),
                    pointer:true
                });
                tableDataEdit.header = tableDataEdit.header.compact();
                var tableEdit = new SimpleTable(tableDataEdit,{});
                this.regHtml.get(reg.key)[0].insert(tableEdit.getElement());
                this.regHtml.get(reg.key)[0].down('[id='+['fieldsPanel_tcontentHeader_',this.appId,reg.key].join('')+']').observe('click',this.addRowTcontent.bind(this,reg.key));
                this.tableDataEditTcontent = $H({
                    data: tableDataEdit,
                    table: tableEdit
                });
		            
            }
        },
        /**It creates all the fieldsPanel fieldDisplayer objects and creates the rest of the
	* edit mode screen html.    
	*/
        createFieldsEdit: function(){
            this.editMode = true;
            this.data.each(function(reg){
                this.createEditRadioFields(reg);
                this.createEditFields(reg);
                this.createEditTableFields(reg);
                var editViewMore =  this.regHtml.get(reg.key)[0].down(['[id=', reg.key,'_',this.widScreen,'_',this.appId,'_FPviewMoreEdit]'].join(''));
                if(editViewMore.childElements().size()>0){
                    var linkEdit = new Element('span',{
                        'class':'application_action_link fieldsPanel_clear'
                    });
                    linkEdit.update(this.viewDetails);
                    linkEdit.observe('click',function(){
                        if(linkEdit.innerHTML == this.viewDetails){
                            linkEdit.update(this.hideDetails);
                        }else{
                            linkEdit.update(this.viewDetails);
                        }
                        editViewMore.toggle();
                    }.bind(this));
                    this.regHtml.get(reg.key)[0].insert(linkEdit);
                }
                editViewMore.remove();
                this.regHtml.get(reg.key)[0].insert(editViewMore);
                if(this._displayActionsOnEdit)
                    this.createActionButtons(reg);
            }.bind(this));
            this.setDependencies();
        },
        /**It sets all the fieldDisplayer objects visual dependencies.
	*/
        setDependencies: function(){
            if((this.mode == 'edit') || (this.mode == 'create')){
                this.fields.each(function(reg){
                    objectToArray(reg.value).each(function(dfield){
                        var field = this.fieldsInfo.get(dfield.value.options.sapId);
                        if( (!Object.isEmpty(field)) && (field['@depend_type'] != 'X') && !Object.isEmpty(field['@depend_field']) && !Object.isEmpty(this.fields.get(reg.key).get(field['@depend_field'])) )
                            this._setCascadeDependencies(field,reg);
                        if( (!Object.isEmpty(field)) && ((field['@depend_type'] == 'X')||(field['@depend_type'] == 'B')) && !Object.isEmpty(field['@depend_field']) && !Object.isEmpty(this.fields.get(reg.key).get(field['@depend_field']))){
                            var mainDiv = this.fields.get(reg.key).get(field['@depend_field']).getElement();
                            var wrapper = null;
                            if(!Object.isEmpty(mainDiv.up()) && (mainDiv.up().tagName.toLowerCase() == 'td')){
                                wrapper = new Element('td');
                                wrapper.insert(dfield.value.getElement().remove());
                                mainDiv.up().up().insert(wrapper);
                            }else{
                                wrapper = new Element('table',{
                                    'class':'fieldClearBoth'
                                });
                                wrapper.insert('<tr><td></td><td></td></tr>');
                                Element.insert(mainDiv,{
                                    before:wrapper
                                });
                                wrapper.select('td')[0].insert(mainDiv);
                                wrapper.select('td')[1].insert(dfield.value.getElement().remove());
                            }
					   				   
                        }
                    }.bind(this));
                }.bind(this));
                this.fields.each(function(reg){
                    objectToArray(reg.value).each(function(dfield){
                        if(!Object.isEmpty(dfield.value.dependenciesSet))
                            dfield.value.dependenciesSet();
                    });
                });
            }else{
                this.fieldsDiplayDependencies.each(function(reg){
                    objectToArray(reg.value).each(function(dfield){
                        var htmlElement = dfield[1][0];
                        var settings = dfield[1][1];
                        if(!Object.isEmpty(settings['@depend_field']) && ((settings['@depend_type'] == 'B')||(settings['@depend_type'] == 'X'))){
                            if(this.fieldsDiplayDependencies.get(reg.key).get(settings['@depend_field']) && this.fieldsDiplayDependencies.get(reg.key).get(settings['@depend_field'])[0]){
                                var mainDiv = this.fieldsDiplayDependencies.get(reg.key).get(settings['@depend_field'])[0];
                                var wrapper = null;
                                if(!Object.isEmpty(mainDiv.up()) && (mainDiv.up().tagName.toLowerCase() == 'td')){
                                    wrapper = new Element('td');
                                    wrapper.insert(htmlElement.remove());
                                    mainDiv.up().up().insert(wrapper);
                                }else{
                                    wrapper = new Element('table',{
                                        'class':'fieldClearBoth'
                                    });
                                    wrapper.insert('<tr><td></td><td></td></tr>');
                                    Element.insert(mainDiv,{
                                        before:wrapper
                                    });
                                    wrapper.select('td')[0].insert(mainDiv);
                                    wrapper.select('td')[1].insert(htmlElement.remove());
                                }
                            }
                        }
                    }.bind(this));
                }.bind(this));
            }
        },
        _setCascadeDependencies: function(field,reg) {
                var dependField;
                var dependencyCascade = new Array();
                var lastId;
                dependencyCascade.push(this.fields.get(reg.key).get(field['@fieldid']));
                if((!Object.isEmpty(field)) && (field['@depend_type'] != 'X') && !Object.isEmpty(field['@depend_field']) && !Object.isEmpty(this.fields.get(reg.key).get(field['@depend_field']))) {
                    dependField = this.fields.get(reg.key).get(field['@depend_field']);
                    lastId = field['@depend_field'];
                    dependencyCascade.push(dependField);
                    field = this.fieldsInfo.get(lastId);
                    //Going throught the depencency cascade
                    while((!Object.isEmpty(field)) && (field['@depend_type'] != 'X') && !Object.isEmpty(field['@depend_field']) && !Object.isEmpty(this.fields.get(reg.key).get(field['@depend_field']))) {
                        dependField = this.fields.get(reg.key).get(field['@depend_field']);
                        dependencyCascade.push(dependField);
                        field = this.fieldsInfo.get(field['@depend_field']);
                    }
                    //Reverting the array
                    dependencyCascade = $A(dependencyCascade).reverse();
                    //Creating the dependencies in order
                    for(var i = 0; i <= dependencyCascade.length-1; i++) {
                        if(dependencyCascade.length != i+1)
                            dependencyCascade[i+1].setDependObject(dependencyCascade[i]);
                    }
                }
        },
        //DISPLAY MODE
        //******************************************************************************************
        /**It builds the fieldsPanel fields html in display mode.
	*@param reg {Object} fieldsPanel register info.
	*/
        createDisplayFields: function(reg){
            objectToArray(reg.value.fields).each(function(oneField){
                if(Object.isEmpty(oneField['@display_attrib']) || (oneField['@display_attrib'].toLowerCase() != 'hid')){
                    if((oneField['@display_group']) && (oneField['@display_group'] != '')){
                        var auxDisplay = this.regHtml.get(reg.key)[1].down(['[id=groupDisplay_',reg.key,'_',oneField['@display_group'],']'].join(''));
                        if(auxDisplay)
                        {
                            var newFieldDivAux = new Element('div',{
                                'class':'fieldWrap fieldClearBoth fieldDispFloatLeft fieldDispTotalWidth'
                            });
                            newFieldDivAux.update(this.getFormatDisplay(oneField));
                            auxDisplay.insert(newFieldDivAux);
                            this.fieldsDiplayDependencies.get(reg.key).set(oneField['@fieldid'],[newFieldDivAux,oneField]);
                        }else{
                            var divDisplay = new Element('div',{
                                'class':'fieldsPanel_group',
                                'id':['groupDisplay_',reg.key,'_',oneField['@display_group']].join('')
                            });
                            if(!Object.isEmpty(this.labels.get(oneField['@display_group'])))
                                divDisplay.insert(["<div class='fieldsPanel_groupLabel'><span class='application_main_title3 fieldsPanel_groupLabelText'>",this.labels.get(oneField['@display_group']),"</span><hr/></div>"].join(''));
                            var newFieldDivAux = new Element('div',{
                                'class':'fieldWrap fieldClearBoth fieldDispFloatLeft fieldDispTotalWidth'
                            });
                            newFieldDivAux.update(this.getFormatDisplay(oneField));
                            divDisplay.insert(newFieldDivAux);
                            this.fieldsDiplayDependencies.get(reg.key).set(oneField['@fieldid'],[newFieldDivAux,oneField]);
                            if(oneField['@fieldtype'] &&  (oneField['@fieldtype'].toLowerCase() == 's')){
                                this.regHtml.get(reg.key)[1].down(['[id=',reg.key,'_',this.widScreen,'_',this.appId,'_FPviewMoreDisplay]'].join('')).insert(divDisplay);
                            }else{
                                this.regHtml.get(reg.key)[1].insert(divDisplay);
                            }
                        }
                    }else{
                        if(oneField['@fieldtype'] &&  (oneField['@fieldtype'].toLowerCase() == 's')){
                            var newFieldDiv = new Element('div',{
                                'class':'fieldWrap fieldClearBoth fieldDispFloatLeft fieldDispTotalWidth'
                            });
                            newFieldDiv.update(this.getFormatDisplay(oneField));
                            this.regHtml.get(reg.key)[1].down(['[id=',reg.key,'_',this.widScreen,'_',this.appId,'_FPviewMoreDisplay]'].join('')).insert(newFieldDiv);
                            this.fieldsDiplayDependencies.get(reg.key).set(oneField['@fieldid'],[newFieldDiv,oneField]);
                        }else{
                            if(oneField['@fieldid'] && (oneField['@fieldid'] != 'ENDDA') && (oneField['@fieldid'] != 'BEGDA')){
                                var newFieldDiv = new Element('div',{
                                    'class':'fieldWrap fieldClearBoth fieldDispFloatLeft fieldDispTotalWidth'
                                });
                                newFieldDiv.update(this.getFormatDisplay(oneField));
                                this.regHtml.get(reg.key)[1].insert(newFieldDiv);
                                this.fieldsDiplayDependencies.get(reg.key).set(oneField['@fieldid'],[newFieldDiv,oneField]);
                            }else if(oneField['@fieldid'] == 'ENDDA'){
                                this.auxEndDa = oneField;
                            }else if(oneField['@fieldid'] == 'BEGDA'){
                                this.auxBegDa = oneField;
                            }
                        }
                    }
                }
            }.bind(this));
		     
        },
        /**It builds the fieldsPanel tcontent fields html in display mode.
	*@param reg {Object} fieldsPanel register info.
	*/
        createDisplayTableFields: function(reg){
            var tableData ={
                header: [],
                rows: $H()
            };
            this.tcontentFields.get(reg.key).each(function(tableFieldsSettings){
                tableFieldsSettings.value.keys().each(function(key){
                    var oneField = this.tcontentFields.get(reg.key).get('row').get(key);
                    var label = this.chooseLabel(oneField['@fieldid'],oneField['@label_type'],oneField['@fieldlabel'])
                    tableData.header[parseInt(oneField['@seqnr'],10)] = {
                        text:label,
                        id: [key,'_fieldsPanel_',reg.key,'_',this.appId,'_',tableFieldsSettings.value.keys().indexOf(key)].join('')
                    };
                }.bind(this));
                objectToArray(reg.value.tcontents).each(function(row){
                    tableData.rows.set(['row',row['@seqnr']].join(''),{
                        data: []
                    });
                    objectToArray(row.fields.yglui_str_wid_field).each(function(column){
                        var auxField = tableFieldsSettings.value.get(column['@fieldid']);
                        var value = this.chooseValue(column['@value'], column['#text'], auxField['@show_text']).strip();
                        tableData.rows.get(['row',row['@seqnr']].join('')).data[parseInt(auxField['@seqnr'],10)] = {
                            text: value,
                            id: ['fieldsPanelTd_',reg.key,'_',this.appId,'_',row['@seqnr'],column['@fieldid']].join('')
                        };
                    }.bind(this));
                    tableData.rows.get(['row',row['@seqnr']].join('')).data = tableData.rows.get(['row',row['@seqnr']].join('')).data.compact();
                }.bind(this));
            }.bind(this));
            tableData.header = tableData.header.compact();
            if(tableData.rows.size() > 0){
                var table = new SimpleTable(tableData,{});
                this.regHtml.get(reg.key)[1].insert(table.getElement());
            }
        },
        /**It builds all the fieldsPanel fields html plus the rest of the display mode screen html.
	*/
        createFieldsDisplay: function(){
            this.displayMode = true;
            this.data.each(function(reg){
                this.createDisplayFields(reg);
                this.createDisplayTableFields(reg);
                var jsonNav = {
                    elements:[],
                    mainClass: 'buttonDisplayer_navigationContainer'
                };
                var json = {
                    elements:[],
                    mainClass: 'buttonDisplayer_container'
                };
                var aux = null;
                objectToArray(reg.value.buttons).each(function(button){
                    if((button['@action'] == 'NEXT') || (button['@action'] == 'PREVIOUS')){
                        var className = (button['@action'] == 'NEXT')?'application_verticalR_arrow fieldsPanel_button_next':'application_verticalL_arrow fieldsPanel_button_previous';
                        aux =   {
                            action: button['@action'],
                            handlerContext: null,
                            handler: this.navigateTo.bind(this,[reg.key ,'_',button['@action']].join('')),
                            className: className,
                            type: 'button'
                        };
                        jsonNav.elements.push(aux);
                    }else{
                        var auxLabel = (!Object.isEmpty(button['@label_tag']))?button['@label_tag']:button['@action']; 
                        //If tarty = W --> it's a PCR, and we need more parameters
                        var data =  (button['@tarty'] == 'W') ? [reg.key ,'_',button['@type'], '_',button['@tarty'], '/',button['@tarap']].join('') :  [reg.key ,'_',button['@type']].join('');                    
                        aux =   {
                            action: button['@action'],
                            label: auxLabel,
                            data: data,
                            className: 'application_action_link fieldsPanel_button',
                            event: this.event,
                            type: 'link',
                            eventOrHandler: true
                        };
                        json.elements.push(aux);      
                    }
                  
                }.bind(this));
                if((!Object.isEmpty(jsonNav.elements[0])) && (jsonNav.elements[0].action == 'NEXT'))
                {
                    jsonNav.elements = jsonNav.elements.reverse();
                }
                var auxButtonDisNav = new megaButtonDisplayer(jsonNav);
                var auxButtonDis = new megaButtonDisplayer(json);
                var displayViewMore =  this.regHtml.get(reg.key)[1].down(['[id=', reg.key,'_',this.widScreen,'_',this.appId,'_FPviewMoreDisplay]'].join(''));
                if(displayViewMore.childElements().size()>0){
                    var linkDisplay = new Element('span',{
                        'class':'application_action_link fieldsPanel_clear'
                    });
                    linkDisplay.update(this.viewDetails);
                    linkDisplay.observe('click',function(){
                        if(linkDisplay.innerHTML == this.viewDetails){
                            linkDisplay.update(this.hideDetails);
                        }else{
                            linkDisplay.update(this.viewDetails);
                        }
                        displayViewMore.toggle();
                    }.bind(this));
                    this.regHtml.get(reg.key)[1].insert(linkDisplay);
                }
                displayViewMore.remove();
                this.regHtml.get(reg.key)[1].insert(displayViewMore);
                if ((!Object.isEmpty(this.auxBegDa) && !Object.isEmpty(this.auxBegDa['@value'])) || (!Object.isEmpty(this.auxEndDa) && !Object.isEmpty(this.auxEndDa['@value']))) {
                    var aEnd = (!Object.isEmpty(this.auxEndDa))?this.auxEndDa['@value']:'';
                    var aBeg = (!Object.isEmpty(this.auxBegDa))?this.auxBegDa['@value']:'';
                    this.regHtml.get(reg.key)[1].insert(this.getFormatDisplayDates(aBeg,aEnd));
                }
                if(!Object.isEmpty(jsonNav.elements) && (jsonNav.elements.size() > 0))
                    this.regHtml.get(reg.key)[1].insert(auxButtonDisNav.getButtons());
                if(!Object.isEmpty(json.elements) && (json.elements.size() > 0))
                    this.regHtml.get(reg.key)[1].insert(auxButtonDis.getButtons());
            }.bind(this));
            this.setDependencies();
        },
        /**It returns the proper display format html code for each fieldsPanel field.
	*@param field {Object} the field data needed to build its html.
	*@param iterNumber {String} row id needed to uniquely identify the field 
	*in case the passed field belongs to a tcontent field.
	*/
        getFormatDisplay: function(field,iterNumber){
            var complexId = (!Object.isEmpty(this.currentSelected))?[this.currentSelected,this.appId].join(''):this.appId;
            var fieldId = (!Object.isEmpty(field['@fieldid']))?[complexId,field['@fieldid'].strip()].join(''):'';
            var htmlId = (!Object.isEmpty(iterNumber))?[fieldId,'_',iterNumber].join(''):fieldId;
            var value = this.chooseValue(field['@value'],field['#text'],field['@show_text']);
            value = (!Object.isEmpty(field['@type']) && (field['@type'] == 'DATS') && value)?sapToDisplayFormat(value):value;
            value = (!Object.isEmpty(field['@type']) && (field['@type'] == 'TIMS') && value && (value.gsub(' ','') != '::'))?sapToDisplayFormatTime(value):value;
            var label = this.chooseLabel(field['@fieldid'],field['@label_type'],field['@fieldlabel']);
            if(!Object.isEmpty(label))
                label = ["<label for='",htmlId,"'><abbr title='",label,"'>",label,"</abbr></label>"].join('');
            if(!Object.isEmpty(value))
                value = ["<span id='",htmlId,"' value='",field['@value'],"'>",value,"</span>"].join('');
            if(!Object.isEmpty(field['@fieldformat']) && ((field['@fieldformat'].toLowerCase() == 'b')||(field['@fieldformat'].toLowerCase() == 'm'))){
                var fieldDisplayer = new FieldDisplayer(this.getDisplayerOptions(field,null,null,null,false,null,false));
                return fieldDisplayer.getElement();
            }else{
                if(!Object.isEmpty(value) || !Object.isEmpty(label)){
                    return  [label,value].join('');
                }else{
                    return '';
                }
            }
        },
        /**It returns the proper display format html code for the fieldsPanel begda and endda Dates fields.
	*@param begda {String} begda field String representation.
	*@param endda {String} endda field String representation. 
	*/
        getFormatDisplayDates: function(begda,endda){
            var beg = (!Object.isEmpty(begda))?sapToDisplayFormat(begda):'';
            var end = (!Object.isEmpty(endda))?sapToDisplayFormat(endda):'';
            if(!Object.isEmpty(beg) && !Object.isEmpty(end)){
                end = ['&nbsp;-&nbsp;',end].join('');
            }
            if(!Object.isEmpty(begda) || !Object.isEmpty(endda)){
                return  ["<div class='fieldsPanel_DisplayRowDates'><div class='fieldsPanel_dateImage'></div><span class='application_main_text fieldsPanel_noWrap'>",beg,end,"</span></div>"].join('');
            }else{
                return '';
            }
        },
        getJson: function() {
            return this.jsonIn;
        },
        //NAVIGATION AND MODE CHANGE TOOLS
        //******************************************************************************************
        /**It turns the fieldsPanel object into edit mode. If the fieldDiplayer objects were previously created
	 * it will just show the edit screen, if not it will create them.    
	 */
        changeToEditMode: function(){
            if(this.isTableMode() && (this.mode != 'create')){
                if(!this.editMode){
                    this.createTableFieldsEdit();
                }
                this.regHtml.get(0)[0].show();
                this.regHtml.get(0)[1].hide();
            }else if(this.mode != 'create'){
                this.mode = 'edit';
                if(!this.editMode){
                    this.createFieldsEdit();
                }
                this.regHtml.each(function(regs){
                    if(regs.value[1].visible()){
                        regs.value[0].show();
                    }
                    regs.value[1].hide();
                }.bind(this));
            }
        },
        /**It turns the fieldsPanel object into display mode.
	 */
        changeToDisplayMode: function(){
            if(this.isTableMode() && (this.mode != 'create')){
                this.regHtml.get(0)[0].hide();
                this.regHtml.get(0)[1].show();
                if(!this.displayMode){
                    this.createTableFieldsDisplay();
                }
            }else if(this.mode != 'create'){
                this.mode = 'display';
                if(!this.displayMode){
                    this.createFieldsDisplay();
                }
                this.regHtml.each(function(regs){
                    if(regs.value[0].visible()){
                        regs.value[1].show();
                    }
                    regs.value[0].hide();
                }.bind(this));
            }
        },
        /**Internal navigation among registers method.
	*@param info {String} fieldsPanel register id related to the register that has to appear.
	*/
        navigateTo: function(info){
            var regId = info.split('_')[0];
            var action = info.split('_')[1];
            var keys = this.regHtml.keys();
            var index =  new Number(keys.indexOf(regId));
            this.regHtml.get(regId)[0].hide();
            this.regHtml.get(regId)[1].hide();
            if(action && (action == 'PREVIOUS')){
                index++;
                if(index == this.regHtml.size())index = 0;
            }else{
                index--;
                if(index < 0)index = this.regHtml.size()-1;
            }
            this.currentSelected = keys[index];
            //Every time we navigate, the selected reg is updated
            if(!Object.isEmpty(this.jsonIn.EWS) &&!Object.isEmpty(this.jsonIn.EWS.o_field_values) &&!Object.isEmpty(this.jsonIn.EWS.o_field_values.yglui_str_wid_record) &&!Object.isEmpty(this.jsonIn.EWS.o_field_values.yglui_str_wid_record.contents) &&!Object.isEmpty(this.jsonIn.EWS.o_field_values.yglui_str_wid_record.contents.yglui_str_wid_content)){
                objectToArray(this.jsonIn.EWS.o_field_values.yglui_str_wid_record.contents.yglui_str_wid_content).each(function(reg){
                    if(this.currentSelected == reg['@rec_index'])
                    {
                        reg['@selected'] = 'X';
                    }else{
                        reg['@selected'] = '';
                    }                
                }.bind(this));       
            }     
            if((this.mode == 'edit')||(this.mode == 'create')){
                this.regHtml.get(keys[index])[0].show();
                this.regHtml.get(keys[index])[1].hide();
            }else if(this.mode == 'display'){
                this.regHtml.get(keys[index])[0].hide();
                this.regHtml.get(keys[index])[1].show();
            }
	    
        },
        /**External navigation among registers method.
	  *@param info {String} fieldsPanel register id related to the register that has to appear.
	  */
        goTo: function(regId){
            this.regHtml.each(function(reg){
                reg.value[0].hide();
                reg.value[1].hide();
            }.bind(this));
            if((!Object.isEmpty(this.regHtml.get(regId)))&&((this.mode == 'edit')||(this.mode == 'create'))){
                this.regHtml.get(regId)[0].show();
                this.regHtml.get(regId)[1].hide();
            }else if((!Object.isEmpty(this.regHtml.get(regId)))&&(this.mode == 'display')){
                this.regHtml.get(regId)[0].hide();
                this.regHtml.get(regId)[1].show();
            }
            this.currentSelected = regId;
        },
        //TABLE MODE
        //*****************************************************************************************
        /**It creates the fieldsPanel fields objects when the table mode is enabled.
	*/
        createTableFieldsEdit: function(){
            this.editMode = true;
            var auxTable = deepCopy(this.tableData);
            auxTable.rows = $H(auxTable.rows);
            $H(auxTable.rows).each(function(row){
                objectToArray(row.value.data).each(function(field){
                    var aux = new FieldDisplayer(field.text,this.fields.get(row.key.gsub('row','')).get(field.text.sapId));
                    field.text = aux.getElement();
                }.bind(this));
            }.bind(this));
            this.tableEdit = new SimpleTable(auxTable,{});
            this.regHtml.get(0)[0].insert(this.tableEdit.getElement());
        },
        /**
	*It creates the fieldsPanel fields html code in display mode when the table mode is
	*enabled.
	*/
        createTableFieldsDisplay: function(){
            this.displayMode = true;
            var auxTable = deepCopy(this.tableData);
            auxTable.rows = $H(auxTable.rows);
            $H(auxTable.rows).each(function(row){
                objectToArray(row.value.data).each(function(field){
                    if(!Object.isEmpty(field.text.defaultValue))
                        field.text = field.text.defaultValue.text;
                    else
                        field.text = '';
                }.bind(this));
            }.bind(this));
            this.tableDisplay = new SimpleTable(auxTable,{});
            this.regHtml.get(0)[1].insert(this.tableDisplay.getElement());
        },
        /**It builds the fieldsPanel html code when the table mode is enabled.
	*/
        setTableModeHtml: function(){
            var auxRegEditDiv = new Element('div',{
                'id':[this.appId,'_fieldsPanel_regDivEdit'].join(''),
                'class':'fieldPanel fieldDispTotalWidth'
            });
            var auxRegDisplayDiv = new Element('div',{
                'id':[this.appId,'_fieldsPanel_regDivDisplay'].join(''),
                'class':'fieldPanel fieldDispTotalWidth'
            });
            var editViewMore = new Element('div',{
                'id':[this.widScreen,'_',this.appId,'_FPviewMoreEdit']
            });
            var displayViewMore = new Element('div',{
                'id':[this.widScreen,'_',this.appId,'_FPviewMoreDisplay']
            });
            auxRegEditDiv.insert(editViewMore.hide());
            auxRegDisplayDiv.insert(displayViewMore.hide());
            this.virtualHtml.insert(auxRegEditDiv.hide());
            this.virtualHtml.insert(auxRegDisplayDiv.hide());
            if((this.mode == 'edit')||(this.mode == 'create'))
                auxRegEditDiv.show();
            else if(this.mode == 'display')
                auxRegDisplayDiv.show();
            this.regHtml.set(0,[auxRegEditDiv,auxRegDisplayDiv]);
        },
        //OBJECT ACCESS
        //*****************************************************************************************
        /**It returns the fieldsPanel html parent container element.
	*@returns HTML Element
	*/
        getElement: function(){
            return this.virtualHtml;
        },
        //DECISION TOOLS
        //*****************************************************************************************
        /**It returns the proper field label text, depending on the field settings.
	*@param fieldId {String} field id.
	*@param labelType {String} field label type.
	*@param labelValue {String} field label text.
	*/
        chooseLabel: function(fieldId,labelType,labelValue){
            var ret = '';
            if(!Object.isEmpty(global.labels.get(fieldId))){
                ret = global.labels.get(fieldId);
            }else{
                if(!Object.isEmpty(labelType)){
                    if(labelType.toLowerCase() == 'v')
                        ret = (!Object.isEmpty(labelValue))?labelValue:'';
                    else if(labelType.toLowerCase() == 'n')
                        ret = '';
                }else{
                    ret = (!Object.isEmpty(this.labels.get(fieldId)))?this.labels.get(fieldId):'';
                }
            }
            if(Object.isEmpty(ret)){
                if(!Object.isEmpty(labelValue)){
                    ret = labelValue;
                }else if(!Object.isEmpty(this.labels.get(fieldId))){
                    ret = this.labels.get(fieldId);
                }
            }
            return ret;
        },
        /**It returns the proper field value, depending on the field settings.
	*@param value {String} field value.
	*@param text {String} field text.
	*@param showText {String} field showText settings attribute.
	*/
        chooseValue: function(value,text,showText){
            if(!Object.isEmpty(showText) && (showText.toLowerCase() == 'x')){
                return (!Object.isEmpty(text))?text:'';
            }else if(!Object.isEmpty(showText) && (showText.toLowerCase() == 'b')){
                value = (!Object.isEmpty(value))?value:'';
                var auxValue = (!Object.isEmpty(value))?[this.idSeparatorLeft,value,this.idSeparatorRight].join(''):'';
                return [(!Object.isEmpty(text))?text:'',' ',auxValue].join('');
            }else if(!Object.isEmpty(showText) && (showText.toLowerCase() == 'i')){
                return (!Object.isEmpty(text))?text:'';
            }else{
                return (!Object.isEmpty(value))?value:'';
            }
        },
        /**It returns true if the table mode is enabled, false in any other case.
	*@returns Boolean
	*/
        isTableMode: function(){
            try{
                var bool = this.checkEmpty([
                    this.jsonIn.EWS.o_field_settings.yglui_str_wid_fs_record.fs_fields.yglui_str_wid_fs_field,
                    this.jsonIn.EWS.o_field_values.yglui_str_wid_record,
                    ]) && (objectToArray(this.jsonIn.EWS.o_field_values.yglui_str_wid_record).size() > 1);
                return bool;
            }catch(e){
                return false;
            }
        },
        //TOOLS
        //*****************************************************************************************
        /**It returns a fieldDisplayer initialize options parameter object from the field settings, values and parameters.
	*@param oneField {Object} field settings object.
	*@param column {Object} field values object.
	*@param strK {String} field register strKey property, needed for SAP internal logic.
	*@param reg {Object} field register data.
	*@param avoidLabel {Boolean} to force the field showing its label, (even if in its settings is not set like this).
	*@param iterNumber {Integer} field row number.
	*@param notDisplayMandatory {Boolean} to force the field not showing its '*' if it's a mandatory one.	
	*/
        getDisplayerOptions: function(oneField,column,strK,reg,avoidLabel,iterNumber,notDisplayMandatory){
            var def = null;
            var dValue = null;
            var auxObject = null;
            if(!Object.isEmpty(column)){
                def = (this.defaultValue)? this.chooseValue(oneField['@default_value'],oneField['@default_text'],oneField['@show_text']): this.chooseValue(column['@value'],column['#text'],oneField['@show_text']);
                dValue = (this.defaultValue)?oneField['@default_value']:column['@value'];
            }else{
                def = (this.defaultValue)?this.chooseValue(oneField['@default_value'],oneField['@default_text'],oneField['@show_text']): this.chooseValue(oneField['@value'],oneField['#text'],oneField['@show_text']);
                dValue = (this.defaultValue)?oneField['@default_value']:oneField['@value'];
            }
            if(!Object.isEmpty(def) || !Object.isEmpty(dValue))
                auxObject = {
                    id: dValue,
                    text: def
                };
            var fieldLabel = this.chooseLabel(oneField['@fieldid'],oneField['@label_type'],oneField['@fieldlabel']);
            var auxEvent = (!Object.isEmpty(oneField['@service_pai']))?this.paiEvent:'';
            var auxPredefined = null;
            if(!Object.isEmpty(oneField['@service_values']) && (oneField['@service_values'] != 'SEARCH'))
                auxPredefined = ['<EWS><SERVICE>',oneField['@service_values'].strip(),'</SERVICE></EWS>'].join('');
            if(!Object.isEmpty(this.predefinedXmls) && !Object.isEmpty(this.predefinedXmls.get(oneField['@fieldid']))){
                auxPredefined = this.predefinedXmls.get(oneField['@fieldid']);
            }
            var complexId = (!Object.isEmpty(reg))?[reg.key,this.appId].join(''):this.appId;
            var modifyValue = false;
            if(!Object.isEmpty(this.assignDefaultValue) && (this.assignDefaultValue.keys().indexOf(oneField['@fieldid']) > -1   )){
                modifyValue = this.assignDefaultValue.get(oneField['@fieldid']);
            }else{
                modifyValue = (!Object.isEmpty(this.mode) && (this.mode == 'create'))?true:false;
            }
            var fieldId = (!Object.isEmpty(oneField['@fieldid']))?[complexId,oneField['@fieldid'].strip()].join(''):'';
            var htmlId = (!Object.isEmpty(oneField) && !Object.isEmpty(iterNumber)) ? [fieldId, '_', iterNumber, '_', this.name].join('') : [fieldId,'_', this.name].join('');
            var auxTech = (!Object.isEmpty(column) && !Object.isEmpty(column['@fieldtechname']))?column['@fieldtechname']:'';
            var fieldTechName = (!Object.isEmpty(oneField['@fieldtechname']))?oneField['@fieldtechname'].strip():auxTech;
            var ret = {
                fieldTechName: (!Object.isEmpty(fieldTechName))?fieldTechName.strip():'',
                fieldFormat: (!Object.isEmpty(oneField['@fieldformat']))?oneField['@fieldformat'].strip():'',
                fieldId: fieldId,
                sapId: (!Object.isEmpty(oneField['@fieldid']))?oneField['@fieldid'].strip():'',
                displayAttrib: (!Object.isEmpty(oneField['@display_attrib']))?oneField['@display_attrib'].strip():'',
                fieldLabel: (!avoidLabel)?fieldLabel:'',
                type: (!Object.isEmpty(oneField['@type']))?oneField['@type'].strip():'',
                dependField:(!Object.isEmpty(oneField['@depend_field']) && (oneField['@depend_type'] != 'X'))?[complexId,oneField['@depend_field'].strip()].join(''):'',
                serviceValues: (!Object.isEmpty(oneField['@service_values']))?oneField['@service_values'].strip():'',
                predefinedXmlIn: (!Object.isEmpty(oneField['@service_values']) && (  !this.blackList.get(oneField['@service_values'].toLowerCase())  ))?auxPredefined:null,
                maxLength: (!Object.isEmpty(oneField['@length']))?oneField['@length'].strip():'',
                defaultValue: auxObject,
                servicePai: (!Object.isEmpty(oneField['@service_pai']))?oneField['@service_pai'].strip():'',
                widScreen:this.widScreen,
                strKey:strK,
                appId:this.appId,
                events:$H({
                    valueInserted:auxEvent,
                    formFieldModified:this.fieldDisplayerModified
                }),
                assignDefaultValue: modifyValue,
                showText: (!Object.isEmpty(oneField['@show_text']))?oneField['@show_text']:'',
                htmlId: htmlId,
                notDisplayMandatory: notDisplayMandatory,
                mode: this.mode
            };
            if(!Object.isEmpty(this.fireEventWhenDefaultValueSet) && (this.fireEventWhenDefaultValueSet.keys().indexOf(oneField['@fieldid']) > -1   )){
                ret.fireEventWhenDefaultValueSet = this.fireEventWhenDefaultValueSet.get(oneField['@fieldid']);
            }
            if(!Object.isEmpty(oneField['@fieldformat']) && (oneField['@fieldformat'].toLowerCase() == 'o'))
            {
                ret.fieldFormat = 'V';
                ret.serviceValues = '';
                ret.type = 'CHAR';
                ret.defaultValue = null;
            }
            return ret;
        },
        /**It gets the fieldsPanel dynamic labels from the get_content json object, since
	 * fieldsPanel didn't call the service so the labels couldn't be automatically saved in the 
	 * object by the framework.  
	 */
        setLabels: function(){
            if(!Object.isEmpty(this.jsonIn) && !Object.isEmpty(this.jsonIn.EWS.labels)&& !Object.isEmpty(this.jsonIn.EWS.labels.item)){
                objectToArray(this.jsonIn.EWS.labels.item).each(function(label){
                    if(!Object.isEmpty(label['@id']))
                        this.labels.set(label['@id'],label['@value']);
                }.bind(this));
            }
        },
        /**It creates a class attribute with the same name, type and value as the argument passed to the initialize() method.
	*@param array {Array} class attributes names to be initialized.
	*@param options {Object} fieldsPanel initialize() parameters.
	*/
        setOptions: function(array,options){
            if(!Object.isEmpty(options))
                array.each(function(element){
                    if(!Object.isEmpty(options[element]))
                        this[element] = options[element];
                }.bind(this));
        },
        /**It checks if there's any empty array element.
	*@param array {Array} variables array to be checked.
	*/
        checkEmpty: function(array){
            array.each(function(element){
                if(Object.isEmpty(element))
                    return false;
            });
            return true;
        },
        /** It destroies all the fieldDisplayer objects
	*/
        destroy: function(){
            this.fields.each(function(reg){
                reg.value.each(function(field){
                    field.value.destroy();
                }.bind(this));
            }.bind(this));
            if(this.virtualHtml && !Object.isEmpty(this.virtualHtml.up()))
                this.virtualHtml.remove();
        },
        /**
	*@param array {Array} variables names to be initialized.
	*@param context {Object} scope.
	*@param type {String} initializing type.
	*/
        multipleInit: function(array,context,type){
            array.each(function(element){
                switch(type){
                    case 'Hash': context[element] = $H(); break;
                    case 'Array': context[element] = []; break;
                    case 'String': context[element] = ''; break;
                    case 'Boolean': context[element] = false; break;
                    default: context[element] = $H(); break;
                }
            });
        }
    });

var getContentModule = Class.create(PFM_parent,
/**
* @lends getContentModule
*/
    {
    /**
    * 8 layers can be found, and each of them have:
    *
    *    nameLayer: function() method         --> this method will be called by the layer above.
    *    getDataNameLayer: function() method  --> this method will split the related json into the needed pieces.
    *    getHtmlNameLayer: function() medthod --> this method will build the layer HTML joining the layers below results.
    *       
    */

    /*
    *   PARAMETERS AVAILABLE:
    *              (*)=mandatory
    *
    *   (*)appId: appId of the application, used naming elements
    *   (*)json: json object, answer of a get_content request
    *   jsonCreateMode: in some cases, if we are in edit mode and a record is empty, it is necessary to show
    *                   a record in create mode. For this purpose, we pass the same json in create mode (normally an answer of calling to
    *                   get_content with okcode='NEW'
    *   mode: create, edit or display(default)
    *   showCancelButton: false by default, if true, a cancel button is added, even if it's not included on the xml.
    *   showLoadingPAI: true by default, if true, a loading message will appear at the top of the page when a PAI event is triggered.
    *   buttonsHandlers: a hash where we define the function executed when a button is clicked.
    *                   We have two special names:
    *                      DEFAULT_EVENT_THROW: If defined, it will be fired when a buttons is not defined with its exact button action.
    *                      paiEvent: If defined, this callback function will be executed when the user changes a field with a service_pai defined.
    *                   Example:
    *                   buttonsHandlers: $H({
    *                       REC_ADCHANGEPERMADDR : function(){alert('example of button handler')},
    *                       DEFAULT_EVENT_THROW  : 'EWS:buttonClickedIn'+this.appId,
    *                       paiEvent: function(){alert('PAI event fired')}
    *                   })
    *   cssClasses: Used in order to get css flexibility for each stream. Here we can change a standard css class used on the fieldsPanel.
    *               So, if a css class appears here, all elements with this css class in the fieldsPanel will have the customized class instead of the standard one.
    *               Example where we change all elements with float left into float right:
    *                  cssClasses: $H({
    *                       fieldDispFloatLeft : 'fieldDispFloatRight'
    *                  })
    *  fieldDisplayerModified: Event launched when a fieldDisplayer has changed.
    *  predefinedXmls: Hash with custom xmls. If defined, the fieldDisplayer with this fieldid, will use this xml in order to retrieve the possible values
    *                  predefinedXmls: $H({
    *                       fieldDisplayerId : '<EWS>...</EWS>'
    *                  })
    *  linkTypeHandlers: Hash with handlers executed when a fieldDisplayer is linkToHandler (field_format = 'E')
    *                      This handler will be fired when the user clicks on this link.
    *                  linkTypeHandlers: $H({
    *                       fieldDisplayerId : function(){alert('you clicked the link with fieldid '+ fieldDisplayerId)}
    *                  })
    * getFieldValueAppend: 	Hash that contains pieces of XML that should be appended to the XMLS sent to get_field_values
    * 						The key for each element will be be the field id, or "*" if we want to apply it for every field.
    * 						In case the * is  defined, and a xml for a field is also defined, the second one will be used.
    * hideButtonsOnEdit:	Boolean that indicates if we should disable the screen navigation buttons in edit mode. 
    * hideButtonsOnCreate:	Boolean that indicates if we should disable the screen navigation buttons in create mode. 
    */
    initialize: function($super, options) {
        $super(options);
        /**
        * The module dynamic layers Hash.
        */
        this.labels = $H();
        /**
        * Hash to keep the buttons handlers of all the layers.
        */
        this.buttonsHandlers = $H();
        /**
        * Boolean variable, if true (default), a cancel button will be shown.
        *In the future, it will be desirable to delete this attribute, since all buttons, including cancel,
        *should come in the xml.
        */
        this.showCancelButton = false;
        /**
        * Boolean variable, if true (default), when a PAI event is triggered, the page will be updated with a loading message.
        */
        this.showLoadingPAI = true;
        /**        
        * Boolean variable, if false (default), there are no optional screens configured.
        */
        this.on_nodefault = false;
        /**
        * Hahs to keep the booleans that says if the buttons are shown or not.
        */
        this.defaultShowButtons = $H({
            edit: true,
            display: false,
            create: true
        });
        /**
        * Default buttons handlers Hash.
        */
        this.defaultButtonsHandlers = $H({
            paiEvent: function(args) {
                alert('Please set a custom paiEvent handler');
            }
        });
        /**
        * Sencondary screens Hash.
        */
        this.secondaryScreens = $H();

        /**
        * Hash that contains pieces of XML that should be appended to the XMLS sent to get_field_values
        * The key for each element will be be the field id, or "*" if we want to apply it for every field.
        * In case the * is  defined, and a xml for a field is also defined, the second one will be used.
        */
        this.getFieldValueAppend = $H();

        /**
        * Boolean that indicates if we should hide the screen navigation buttons in edit mode.
        */
        this.hideButtonsOnEdit = true;
        /**
        * Boolean that indicates if we should hide the screen navigation buttons in create mode.
        */
        this.hideButtonsOnCreate = true;

        this.variant = $H();
        /**
        * The sepOptions method will initialize and get the module main options. For example:
        * this.json will keep the JSON object argument got from SAP(by a get_content service call).
        */
        this.setOptions(options);
        this.optionalsScreens = $H();
        this.setOptionalScreens();
        this.getVariant();
        /**
        * Random id to avoid equal event names in getContentModules in the same application, screen and record.
        */
        this.randomId = Math.floor(Math.random() * 100000) + "";
        /**
        * this hashes below will keep the layers related data(all the info should be kept so as the rest
        * of the layers can access it)
        */
        /**
        * this.tables keeps all the tcontents simpleTable objects related. Accessed by screenId,regId and appId.
        */
        this.tables = $H();

        /** Structures for screen mode layer **/
        // currentScreen -> screen being built at the moment

        this.currentScreen = null;

        /** Structures for list mode layer **/
        // listModeTable -> last list mode layer added
        // listModeTableHash -> all list mode layers, to be accessed by screen id

        this.listModeTable = null;
        this.listModeTableHash = new Hash();
        this.listModeTableElementHash = new Hash();
        this.listModeTableNoResultsDivHash = new Hash();

        /**
        * this.tcontent_empty stores the tcontent node per screen which are used when we add a new row
        */
        this.tcontent_empty = $H();
        /**
        * Layers Hashes. 
        */
        this.applicationLayerData = $A();
        this.screensNavigationLayerData = $H();
        this.translationsLayerData = $H();
        this.listModeLayerData = $H();
        this.registersNavigationLayerData = $H();
        this.uiModeLayerData = $H();
        this.subModulesLayerData = $H();
        this.groupingLayerData = $H();
        this.fieldDisplayerData = $H();
        this.subModulesInstances = $H();
        this.currentMode = $H();
        //Keeps track of the fields that have other fields depending on them
        this.visualDependencyCat = $H();
        this.visualDependencies = $H();
        this.groupVisualDependencies = $H();
        this.groupNoDependents = $H();
        this.screensInformation = $H();
        /**
        * All the fieldDisplayer objects that have been created. Used in destroy() method.
        */
        this.fieldDisplayers = $H();
        /**
        * Hash that stores info about every tContent in the getContent
        * Keys will be <screen>_<record>
        * Each object insidee will have:
        *    - jsonRowContainer: the json element that has the row elements 
        *    - jsonRows: a hash containing each row in the json. key will be rowId
        *    - simpleTableObject: the simpleTable object used to display the table
        *    - simpleTableData: the simpleData to create it the first time
        *    - originalValues: stores the values we had before editing a row, in case we hit cancel 
        *    - settings: the settings for the fields inside
        *    - rowPAI: pai to call when changing a full row(if it exists)
        */
        this.tContent = $H();
        /**
        * Class attribute used to keep the screenMode got from the screen config under <o_widget_screens>
        */
        this.screenMode = null;
        /**
        * Getting the resulting HTML from the layer on top.
        */
        this.applicationLayer();

        /**
        * Here a default handler is assigned to manage the different fieldDisplayers paiEvents. 
        */
        this.paiHandler = function(args) {
            if (this.showLoadingPAI && this.mode != 'display') {
                this.loadingMessage.update(global.getLabel('loading') + '...');
                //The following 2 lines are a replacement of show() in order to correct an IE6 bug
                //The visual effect is the same as with show()
                //However in order to use show() in a later version, the corresponding parts need to be
                //changed to hide() as well.
                this.loadingMessage.style.overflow = 'visible';
                this.loadingMessage.style.height = '22px';
            }
            this.getButtonHandler('paiEvent').bind(this, args).call();
        } .bind(this)
        /**
        * Observing the paiEvent.
        */
        document.observe('EWS:getContentModule_paiEvent_' + this.appId + this.name + this.randomId, this.paiHandler);
        document.observe('EWS:getContentModule_tContentPaiEvent_' + this.appId + this.name + this.randomId, this.paiHandlerTContent.bindAsEventListener(this));
        if (!Object.isEmpty(this.fieldDisplayerModified)) {
            this.screenChangesbinding = this.screenChanges.bindAsEventListener(this);
            document.observe(this.fieldDisplayerModified, this.screenChangesbinding);
        }
    },
    //****************************************************************
    //TOOLS
    //****************************************************************
    /**It returns the button handler function, looking for it in the hash that the developer will provide.
    * @param buttonAction {String} button action generally provided by SAP
    */
    getButtonHandler: function(buttonAction, okcode, screen, recKey, label_tag, tarap, tarty, type) {
        var handler = null;
        if (this.buttonsHandlers.get(buttonAction)) {
            //button handler defined in the hash by the developer
            handler = this.buttonsHandlers.get(buttonAction);
        } else {
            if (this.defaultButtonsHandlers.get(buttonAction)) {
                //button handler defined in the default handlers hash
                handler = this.defaultButtonsHandlers.get(buttonAction);
            } else {
                //no handler defined for this button, empty function applied
                if (this.buttonsHandlers.get('DEFAULT_EVENT_THROW')) {
                    handler = function() {
                        document.fire(this.buttonsHandlers.get('DEFAULT_EVENT_THROW'), { action: buttonAction, okcode: okcode, screen: screen, recKey: recKey, label_tag: label_tag, tarap: tarap, tarty: tarty, type: type });
                    } .bind(this);
                } else {
                    //while migrating, we show an alert
                    handler = function() {
                        alert('Please, set a buttonHandler for ' + buttonAction);
                    } .bind(this);
                }
            }
        }
        return handler;
    },
    /**Changes the focus of the html document to the field which fired a PAI event and has put
    * its data in global in order to restore focus after a PAI event reloads the field panel
    */
    setFocus: function() {
        if (!Object.isEmpty(global.focusFieldID)) {
            //We need to search in both "edit" and "create", because the first time the getContent is created in "create" mode,
            //so the focusField contains "create" mode, but after creating the new getContent, it will be in "edit" mode
            var focusFieldGroup = this.fieldDisplayers.get(global.focusFieldID.appId + "create" + global.focusFieldID.screen + global.focusFieldID.record);
            if (Object.isEmpty(focusFieldGroup))
                focusFieldGroup = this.fieldDisplayers.get(global.focusFieldID.appId + "edit" + global.focusFieldID.screen + global.focusFieldID.record);
            if (!Object.isEmpty(focusFieldGroup))
                var focusField = focusFieldGroup.get(global.focusFieldID.id);
            if (!Object.isEmpty(focusField))
                focusField.setFocus();
            global.focusFieldID = null;
        }
    },
    /**It returns the proper field label text, depending on the field settings.
    * @param fieldId {String} field id.
    * @param labelType {String} field label type.
    * @param labelValue {String} field label text.
    */
    chooseLabel: function(fieldId, labelType, labelValue) {
        var ret = '';
        if (!Object.isEmpty(labelType))
            labelType = labelType.toLowerCase();
        switch (labelType) {
            //If the @label_type setting is 'N' --> No label.                        
            case 'n':
                ret = "";
                break;
            //If the @label_type setting is 'V' --> Label from the settings                        
            case 'v':
                ret = (!Object.isEmpty(labelValue)) ? labelValue : '';
                break;
            //If no @label_type setting --> Label from the get_content JSON labels node, and if that does not exist, then from global                        
            case "":
            default:
                ret = (!Object.isEmpty(this.labels.get(fieldId))) ? this.labels.get(fieldId) : global.getLabel(fieldId);
                break;
        }
        return ret;
    },
    /**It creates a class attribute with the same name, type and value as the argument passed to the initialize() method.
    * @param options {Object} getContentModule initialize() parameters.
    */
    setOptions: function(options) {
        this.mode = 'display';
        if (!Object.isEmpty(options)) {
            for (option in options) {
                if (!Object.isEmpty(options[option]))
                    this[option] = options[option];
            }
        }
        //setting labels
        if (this.json.EWS.labels && this.json.EWS.labels.item) {
            objectToArray(this.json.EWS.labels.item).each(function(label) {
                this.labels.set(label['@id'], label['@value']);
            } .bind(this));
        }
        //hash that represents if the buttons are shown or not
        if (this.showButtons) {
            if (Object.isEmpty(this.showButtons.get('edit')))
                this.showButtons.set('edit', this.defaultShowButtons.get('edit'));
            if (Object.isEmpty(this.showButtons.get('create')))
                this.showButtons.set('create', this.defaultShowButtons.get('create'));
            if (Object.isEmpty(this.showButtons.get('display')))
                this.showButtons.set('display', this.defaultShowButtons.get('display'));
        } else {
            this.showButtons = this.defaultShowButtons;
        }
        this.eventPopUp = options.eventPopUp;
    },
    /**It returns the module HTML element (result of properly join all the layers HTML generated).
    * @return HTML element
    */
    getHtml: function() {
        this.fixCss();
        return this.element;
    },
    /**It applies the defined css contained in the hash cssClasses (parameter)
    */
    fixCss: function() {
        //hash with css classes that we want to overwrite
        if (this.cssClasses) {
            this.cssClasses.each(function(cssClass) {
                this.element.descendants().each(function(element) {
                    if (element.hasClassName(cssClass.key)) {
                        element.removeClassName(cssClass.key);
                        element.addClassName(cssClass.value);
                    }
                } .bind(this));
            } .bind(this));
        }
    },

    /**
    * Updates the data of a field. It can receive a xml text to use it as service call, instead of the default get_values service
    * @param {Object} fieldId The id of the field
    * @param {Object} screen The screen of the field ("1" by default)
    * @param {Object} record The record of the field ("0" by default)
    * @param {Object} xmlin If set, uses this XML to call the service to get the values of the fields.
    */
    refreshField: function(fieldId, screen, record, xmlin) {
        if (Object.isEmpty(fieldId)) {
            return;
        }
        var mode = this.mode;
        var appId = this.appId;
        if (Object.isEmpty(screen)) {
            screen = "1";
        }
        if (Object.isEmpty(record)) {
            record = "0";
        }

        if (!Object.isEmpty(this.fieldDisplayers.get(appId + mode + screen + record))) {
            //If we have the fields for this scenario stored
            var fieldDisplayer = this.fieldDisplayers.get(appId + mode + screen + record).get(fieldId);
            if (!Object.isEmpty(fieldDisplayer)) {
                fieldDisplayer._getFieldValues(null, xmlin);
            }
        }
    },
    /**
    * Returns the XML to append for the field when it calls to its GET_FIELD_VALUES 
    * @param {Object} fieldId
    */
    getXMLToAppendForField: function(fieldId) {
        if (Object.isEmpty(this.getFieldValueAppend) || Object.isEmpty(fieldId)) {
            return null;
        }
        //First we try to use a defined XML for this field
        var result = this.getFieldValueAppend.get(fieldId);
        if (Object.isEmpty(result)) {
            //If there's no XML defined for the field, we try with a XML defined for all fields
            result = this.getFieldValueAppend.get("*");
        }
        return result;
    },
    /**
    * Get the data related with the variant
    */
    getVariant: function() {
        var settingsScreens = objectToArray(this.options.json.EWS.o_field_settings.yglui_str_wid_fs_record);
        this.possibleVariants = $H();
        for (var j = 0; j < settingsScreens.length; j++) {
            var variantId = settingsScreens[j]['@variant_fieldid'];
            if (!Object.isEmpty(variantId)) {
                this.variant.set(this.options.appId + '_' + settingsScreens[j]['@screen'], {
                    'variantId': variantId,
                    'variantType': settingsScreens[j]['@variant_type'],
                    'defaultVariant': settingsScreens[j]['@default_variant'],
                    'records': [],
                    'screen': settingsScreens[j]['@screen']
                });
                if (this.options.mode != 'create') {
                    if (!Object.isEmpty(this.options.json.EWS.o_field_values)) {
                        var records = objectToArray(this.options.json.EWS.o_field_values.yglui_str_wid_record);
                        for (var i = 0; i < records.length; i++) {
                            if (records[i]['@screen'] == settingsScreens[j]['@screen']) {
                                var contents = objectToArray(records[i].contents.yglui_str_wid_content);
                                for (var h = 0; h < contents.length; h++) {
                                    var recordVariant = contents[h]['@rec_variant'];
                                    var recIndex = parseInt(contents[h]['@rec_index'], 10);
                                    this.variant.get(this.options.appId + '_' + settingsScreens[j]['@screen']).records[recIndex] = recordVariant;
                                }
                            }
                        }
                    }
                }
                var fields = objectToArray(settingsScreens[j].fs_fields.yglui_str_wid_fs_field);
                this.possibleVariants.set(settingsScreens[j]['@screen'], { 'values': [] })
                for (var a = 0; a < fields.length; a++) {
                    if (!Object.isEmpty(fields[a]['@fs_variant'])) {
                        if (!this.possibleVariants.get(settingsScreens[j]['@screen']).values.include(fields[a]['@fs_variant']))
                            this.possibleVariants.get(settingsScreens[j]['@screen']).values.push(fields[a]['@fs_variant']);
                    }
                }
            }
        }
    },

    screenChanges: function(event) {
        var fieldName = getArgs(event).fieldName;
        var firstTime = getArgs(event).first;
        var record = getArgs(event).record;
        var screen = getArgs(event).screen;
        var value = getArgs(event).value;
        var field = getArgs(event).field;
        if (Object.isEmpty(this.screensInformation.get(screen))) {
            this.screensInformation.set(screen, { record: $H() });
            this.screensInformation.get(screen).record.set(record, { fields: $H() });
            this.screensInformation.get(screen).record.get(record).fields.set(fieldName, { oldValue: {}, newValue: {} });
        }
        else if (Object.isEmpty(this.screensInformation.get(screen).record.get(record))) {
            this.screensInformation.get(screen).record.set(record, { fields: $H() });
            this.screensInformation.get(screen).record.get(record).fields.set(fieldName, { oldValue: {}, newValue: {} });
        }
        else if (Object.isEmpty(this.screensInformation.get(screen).record.get(record).fields.get(fieldName))) {
            this.screensInformation.get(screen).record.get(record).fields.set(fieldName, { oldValue: {}, newValue: {} });
        }
        if (!firstTime) {
            if (Object.isEmpty(field.options.stored)) {
                if (!Object.isEmpty(field.options.value))
                    this.screensInformation.get(screen).record.get(record).fields.get(fieldName).oldValue.value = field.options.value;
                else
                    this.screensInformation.get(screen).record.get(record).fields.get(fieldName).oldValue.value = "";
                if (!Object.isEmpty(field.options.text))
                    this.screensInformation.get(screen).record.get(record).fields.get(fieldName).oldValue.text = field.options.text;
                else
                    this.screensInformation.get(screen).record.get(record).fields.get(fieldName).oldValue.text = "";
                if (!Object.isEmpty(value.id))
                    this.screensInformation.get(screen).record.get(record).fields.get(fieldName).newValue.value = value.id;
                else
                    this.screensInformation.get(screen).record.get(record).fields.get(fieldName).newValue.value = "";
                if (!Object.isEmpty(value.text))
                    this.screensInformation.get(screen).record.get(record).fields.get(fieldName).newValue.text = value.text;
                else
                    this.screensInformation.get(screen).record.get(record).fields.get(fieldName).newValue.text = "";
                field.options.stored = true;
                this.changeToMandatory(screen, record, field.options.mode);
            }
            else {
                if (!Object.isEmpty(value.id))
                    this.screensInformation.get(screen).record.get(record).fields.get(fieldName).newValue.value = value.id;
                else
                    this.screensInformation.get(screen).record.get(record).fields.get(fieldName).newValue.value = "";
                if (!Object.isEmpty(value.text))
                    this.screensInformation.get(screen).record.get(record).fields.get(fieldName).newValue.text = value.text;
                else
                    this.screensInformation.get(screen).record.get(record).fields.get(fieldName).newValue.text = "";
                this.changeToMandatory(screen, record, field.options.mode);
            }
        }
    },
    getScreenChange: function(screen, record) {
        if (!Object.isEmpty(this.screensInformation.get(screen))) {
            var fields = this.screensInformation.get(screen).record.get(record).fields;
            for (var i = 0; i < fields.keys().length; i++) {
                var field = fields.get(fields.keys()[i]);
                if ((field.oldValue.text != field.newValue.text) || (field.oldValue.value != field.newValue.value)) {
                    return true;
                }
            }
            return false;
        }
        else {
            return false;
        }
    },
    setOptionalScreens: function() {
        if (!Object.isEmpty(this.json.EWS.o_widget_screens)) {
            var screens = objectToArray(this.json.EWS.o_widget_screens.yglui_str_wid_screen);
            for (var i = 0; i < screens.length; i++) {
                if (!Object.isEmpty(screens[0].yglui_str_wid_screen)) {
                    var records = objectToArray(screens[i].yglui_str_wid_screen);
                    if (records.first()['@onsave_nodefault'] == 'X') {
                        this.on_nodefault = true;
                        this.optionalsScreens.set(records.first()['@screen'], { fields: $A(), mandatory: false });
                        var settings = objectToArray(this.json.EWS.o_field_settings.yglui_str_wid_fs_record);
                        var fields = objectToArray(settings[i].fs_fields.yglui_str_wid_fs_field);
                        for (var k = 0; k < fields.length; k++) {
                            if (fields[k]['@display_attrib'] == 'MAN') {
                                fields[k].visualOpt = true;
                                this.optionalsScreens.get(records.first()['@screen']).fields.push(fields[k]['@fieldid']);
                            }
                        }
                    }
                }
                else {
                    if (screens[i]['@onsave_nodefault'] == 'X') {
                        this.on_nodefault = true;
                        this.optionalsScreens.set(screens[i]['@screen'], { fields: $A(), mandatory: false });
                        var settings = objectToArray(this.json.EWS.o_field_settings.yglui_str_wid_fs_record);
                        var fields = objectToArray(settings[i].fs_fields.yglui_str_wid_fs_field);
                        for (var k = 0; k < fields.length; k++) {
                            if (fields[k]['@display_attrib'] == 'MAN') {
                                fields[k].visualOpt = true;
                                this.optionalsScreens.get(screens[i]['@screen']).fields.push(fields[k]['@fieldid']);
                            }
                        }
                    }
                }
            }
        }
    },
    changeToMandatory: function(screen, record, mode) {
        if (this.on_nodefault) {
            var change = this.getScreenChange(screen, record);
            var fieldContainerId = this.appId + mode + screen + record;
            var screenFields = this.fieldDisplayers.get(fieldContainerId);
            for (var i = 0; i < screenFields.keys().length; i++) {
                if (this.optionalsScreens.get(screen).fields.include(screenFields.keys()[i])) {
                    var field = screenFields.get(screenFields.keys()[i]);
                    if (change) {
                        field.options.visualOpt = false;
                        if (field.options.outputOnly) {
                            field._labelElement.update("  (*)");
                        }
                        else {
                            if (!Object.isEmpty(field.mandatoryIndicator)) {
                                field.mandatoryIndicator.update('*');
                                field._element.insert(field.mandatoryIndicator);
                            }
                            else {
                                field.mandatoryIndicator = new Element('span', {
                                    'class': 'fieldDispMandatoryIndicator application_main_soft_text fieldDispFloatLeft pepe'
                                })
                                field.mandatoryIndicator.update('*');
                                field._element.insert(field.mandatoryIndicator);
                            }
                        }
                    }
                    else {
                        field.options.visualOpt = true;
                        if (field.options.outputOnly) {
                            field._labelElement.update("");
                        }
                        else {
                            if (!Object.isEmpty(field.mandatoryIndicator)) {
                                field.mandatoryIndicator.update('');
                                field._element.insert(field.mandatoryIndicator);
                            }
                        }
                        field.setValid();
                    }
                }
            }
        }
    },
    manageVariantService: function(args) {
        var parameters = getArgs(args);
        var records = objectToArray(this.json.EWS.o_field_values.yglui_str_wid_record);
        for (var i = 0; i < records.length; i++) {
            if (records[i]['@screen'] == parameters.screen) {
                var recIndex = records[i].contents.yglui_str_wid_content['@rec_index'];
                if (recIndex == parameters.record) {
                    var fields = records[i].contents.yglui_str_wid_content.fields;
                }
            }
        }
        var jsonin = {
            EWS: {
                SERVICE: "GET_FSVAR_VAL",
                OBJ: {
                    "#text": parameters.objId,
                    "@TYPE": parameters.objType
                },
                PARAM: {
                    APPID: this.appId,
                    WID_SCREEN: parameters.screen,
                    REQID: parameters.record,
                    STR_KEY: parameters.keyStr,
                    fields: fields
                }
            }
        };
        //convert it to XML and send
        var conversor = new XML.ObjTree();
        conversor.attr_prefix = '@';
        var xmlin = conversor.writeXML(jsonin);
        this.makeAJAXrequest($H({
            xml: xmlin,
            successMethod: this.manageVariantValue.bind(this, parameters.record, parameters.screen, parameters.mode, parameters.keyStr)
        }));
    },
    manageVariantValue: function(record, screen, mode, keyStr, json, value) {
        if (!Object.isEmpty(json))
            var variant = json.EWS.o_rec_variant;
        if (!Object.isEmpty(value))
            var variant = value;
        if (!this.possibleVariants.get(screen).values.include(variant))
            variant = null;
        var recordValues = objectToArray(this.json.EWS.o_field_values.yglui_str_wid_record);
        for (var i = 0; i < recordValues.length; i++) {
            if (recordValues[i]['@screen'] == screen) {
                var contents = objectToArray(recordValues[i].contents.yglui_str_wid_content);
                for (var j = 0; j < contents.length; j++) {
                    var recindex = contents[j]['@rec_index'];
                    if (recindex == record)
                        contents[j]['@rec_variant'] = variant;
                }
            }
        }
        var fieldsToCall = $A();
        var displayerString = this.appId + mode + screen + record;
        var displayer = this.fieldDisplayers.get(displayerString);
        var settingsScreens = objectToArray(this.json.EWS.o_field_settings.yglui_str_wid_fs_record);
        for (var i = 0; i < settingsScreens.length; i++) {
            if (settingsScreens[i]['@screen'] == screen) {
                var fields = objectToArray(settingsScreens[i].fs_fields.yglui_str_wid_fs_field);
                for (var j = 0; j < fields.length; j++) {
                    if (fields[j]['@fs_variant'] == variant) {
                        var fieldId = fields[j]['@fieldid'];
                        var displayerObject = displayer.get(fieldId);
                        //Check if the variant has changed.
                        if (displayerObject.options.optionsJSON.settings['@fs_variant'] != variant) {
                            displayer.unset(fieldId);
                            var getFieldValueAppend = this.getXMLToAppendForField(fieldId);
                            var displayerHTML = this.fieldDisplayer({
                                settings: fields[j],
                                values: displayerObject.options.optionsJSON.values,
                                screen: screen,
                                record: record,
                                key_str: keyStr,
                                getFieldValueAppend: getFieldValueAppend,
                                randomId: displayerObject.options.randomId
                            }, true, null, mode);
                            if (!displayerHTML.options.hidden)
                                fieldsToCall.push(displayerHTML);
                            displayerObject.destroy(displayerHTML.getHtml());

                        }
                    }
                }
                this.setFieldDependencies(this.fieldDisplayers.get(displayerString), true);
                for (var a = 0; a < fieldsToCall.length; a++) {
                    fieldsToCall[a].getFieldValues();
                }
            }
        }

    },
    //***************************************************************
    //APPLICATION LAYER
    //***************************************************************
    /**Main Application layer method, where the info got from the get_content xml is splitted
    * depending on whether we get fieldSets related to different applications or not (like if we got
    * several old get_content service xmls all in one).   	
    */
    applicationLayer: function() {
        var html = [];
        /**
        * Looping over the different applications content.
        */
        this.getDataApplicationLayer().each(function(element) {
            /**
            * Getting the HTML from the layer below.
            */
            html.push(this.screensNavigationLayer(element));
        } .bind(this));
        /**
        * Here we get the whole module HTML.
        */
        this.element = this.getHtmlApplicationLayer(html);
        if (!Object.isEmpty(global.editingGetContent)) {

            // In position 3, the popUp is stored itself

            if (!Object.isEmpty(global.editingGetContent[3])) {
                global.editingGetContent[3].close();
                delete global.editingGetContent[3];
            }
            this.alreadyCopied = true;
            this.editRowTcontent(null, null, null, global.editingGetContent[0], global.editingGetContent[1], global.editingGetContent[2], null, true);

        }
    },
    /**
    * It returns the get_content xml different applications content.
    * @return Array
    */
    getDataApplicationLayer: function() {
        /**
        * Now we just return the whole get_content xml content.
        */
        this.applicationLayerData = [this.json.EWS];
        return this.applicationLayerData;
    },
    /**It builds the Application layer HTML (takes care of the application level buttons).
    * @param html {Array} HTML Elements returned by the screensNavigation layer.
    */
    getHtmlApplicationLayer: function(html) {
        //used in toggleMode
        this.oldApplicationDiv = null;
        this.applicationDiv = new Element('div', {
            'id': 'applicationLayer',
            'class': 'fieldPanel'
        });
        html.each(function(screen) {
            this.applicationDiv.insert(screen);
        } .bind(this));
        //inserting the application buttons
        this.applicationLayerData.each(function(data) {
            if (data.o_widget_screens && data.o_widget_screens.yglui_str_wid_screen.yglui_str_wid_screen)
                data.o_widget_screens.yglui_str_wid_screen = data.o_widget_screens.yglui_str_wid_screen.yglui_str_wid_screen;
            this.buttonsJson = {
                elements: [],
                defaultButtonClassName: ''
            };
            if (this.showCancelButton) {
                var aux = {
                    idButton: 'applicationsLayer_button_cancel',
                    label: global.getLabel('cancel'),
                    className: 'fieldDispFloatRight',
                    type: 'button',
                    handlerContext: null,
                    standardButton: true,
                    handler: function() {
                        this.destroy();
                        this.getButtonHandler('cancel').call();
                    } .bind(this)
                };
                this.buttonsJson.elements.push(aux);
            }
            if (data && data.o_screen_buttons && data.o_screen_buttons.yglui_str_wid_button) {
                objectToArray(data.o_screen_buttons.yglui_str_wid_button).each(function(button) {
                    //See if we have to show or not this button for this mode. This will override the showButtons parameter (if present)
                    var showInDisplay = false;
                    if (!Object.isEmpty(button['@showindisplay']) && (button['@showindisplay']).toLowerCase() == "x") {
                        showInDisplay = true;
                    }
                    var showInCreate = false;
                    if (!Object.isEmpty(button['@showincreate']) && (button['@showincreate']).toLowerCase() == "x") {
                        showInCreate = true;
                    }
                    var showInEdit = false;
                    if (!Object.isEmpty(button['@showinedit']) && (button['@showinedit']).toLowerCase() == "x") {
                        showInEdit = true;
                    }
                    var forceShow = (this.mode == "display" && showInDisplay) || (this.mode == "create" && showInCreate) || (this.mode == "edit" && showInEdit);
                    if (this.showButtons.get(this.mode) == true || forceShow) {
                        if (button && (button['@screen'] == '*' || Object.isEmpty(button['@screen']))) {
                            var aux = {
                                idButton: 'applicationsLayer_button_' + button['@action'],
                                label: this.chooseLabel(button['@label_tag']),
                                className: 'fieldDispFloatRight',
                                type: 'button',
                                handlerContext: null,
                                standardButton: true,
                                handler: this.getButtonHandler(button['@action'], button['@okcode'], button['@screen'], null, button['@label_tag'], button['@tarap'], button['@tarty'], button['@type'])
                            };
                            this.buttonsJson.elements.push(aux);
                        }
                    }
                } .bind(this));
            }
            var buttonsDiv = new megaButtonDisplayer(this.buttonsJson).getButtons();
            var buttonsDivContainer = new Element('div', { 'id': 'applicationsLayerButtons', 'class': 'fieldDispTotalWidth fieldDispFloatRight' });
            buttonsDivContainer.insert(buttonsDiv);
            this.applicationDiv.insert(buttonsDivContainer);
            if (this.buttonsJson.elements.length == 0)
                buttonsDivContainer.hide();
            this.errorsDiv = new Element('div', {
                'id': 'fieldErrorMessage_' + this.appId,
                'class': 'fieldClearBoth application_main_error_text fieldDispTotalWidth fieldPanel'
            });
            this.applicationDiv.insert(this.errorsDiv);
        } .bind(this));
        return this.applicationDiv;
    },
    //***************************************************************
    //SCREENS NAVIGATION LAYER
    //***************************************************************
    /**It handles and returns the proper HTML related to the several screens we could get from get_content xml.
    * @param severalScreens {JSON Object} get_content xml content where there could be several screens.
    */
    screensNavigationLayer: function(severalScreens) {
        var html = $H();
        /**
        * Here we keep and split the get_content xml content, setting a key for each screen in the 
        * this.screensNavigationLayerData Hash.
        */
        this.getDataScreensNavigationLayer(severalScreens);
        /**
        * Looping over each screen.
        */
        this.screensNavigationLayerData.each(function(element) {

            this.currentScreen = element.key;

            /**
            * Retrieving the layer below HTML.
            */
            if (element.value.get('settings')) {
                if (element.value.get('config') && element.value.get('config')['@secondary'] && !Object.isEmpty(element.value.get('config')['@secondary'])) {
                    //secondary
                    this.secondaryScreens.set(element.key, this.translationsLayer(element.value));
                } else {
                    // not secondary
                    html.set(element.key, this.translationsLayer(element.value));
                }
            } else {
                html.set(element.key, new Element('div'));
            }
        } .bind(this));
        /**
        * Mixing the HTML retrieved from the layer below and adding navigation and needed buttons.
        */
        return this.getHtmlScreensNavigationLayer(html);
    },
    /**It keeps the get_content xml content in a Hash (1 Hash key per screen).
    * @param severalScreens {JSON Object} get_content xml content where there could be several screens.
    */
    getDataScreensNavigationLayer: function(severalScreens) {
        /**
        * We set this attribute to decide how to build the screenNavigation layer HTML (in the getHtmlScreensNavigationLayer() method):
        *       - returning several widgets (one widget per screen).
        *       - or setting the navigation bar (one navigation link per screen)
        */
        this.screenMode = null;
        if (severalScreens.o_widget_screens && severalScreens.o_widget_screens['@screenmode'])
            this.screenMode = severalScreens.o_widget_screens['@screenmode']
        if (severalScreens.o_widget_screens && severalScreens.o_widget_screens.yglui_str_wid_screen) {
            /**
            * Looping over the different screens to set the structure is going to keep its related data.
            */
            if (severalScreens.o_widget_screens.yglui_str_wid_screen.yglui_str_wid_screen) {
                objectToArray(severalScreens.o_widget_screens.yglui_str_wid_screen.yglui_str_wid_screen)
                    .each(function(screen) {
                        this.screensNavigationLayerData.set(screen['@screen'], $H({
                            config: null,
                            buttons: [],
                            settings: null,
                            values: []
                        }));
                        this.screensNavigationLayerData.get(screen['@screen']).set(
                            'config', screen
                            );
                    } .bind(this));
            } else {
                objectToArray(severalScreens.o_widget_screens.yglui_str_wid_screen)
                    .each(function(screen) {
                        this.screensNavigationLayerData.set(screen['@screen'], $H({
                            config: null,
                            buttons: [],
                            settings: null,
                            values: []
                        }));
                        this.screensNavigationLayerData.get(screen['@screen']).set(
                            'config', screen
                            );
                    } .bind(this));
            }
        } else {
            if (severalScreens.o_field_settings.yglui_str_wid_fs_record) {
                //if no screens in o_widget_screens
                var i = 1;
                var selected = 'X';
                objectToArray(severalScreens.o_field_settings.yglui_str_wid_fs_record).each(function(setting) {
                    if (Object.isEmpty(setting['@screen']))
                        setting['@screen'] = i.toString();
                    if (Object.isEmpty(setting['@selected']))
                        setting['@selected'] = selected;
                    this.screensNavigationLayerData.set(i, $H({
                        config: { '@screen': setting['@screen'],
                            '@selected': setting['@selected']
                        },
                        buttons: [],
                        settings: null,
                        values: []
                    }));
                    selected = '';
                    i++;
                } .bind(this));
                selected = '';
            }
        }
        /**
        * Getting the screen related fields settings.
        */
        if (severalScreens.o_screen_buttons && severalScreens.o_screen_buttons.yglui_str_wid_button) {
            objectToArray(severalScreens.o_screen_buttons.yglui_str_wid_button)
                .each(function(button) {
                    if (button && button['@screen'] != '*' && this.screensNavigationLayerData.get(button['@screen'])) {
                        if (this.screensNavigationLayerData.get(button['@screen']).get('config'))
                            this.screensNavigationLayerData.get(button['@screen']).get('buttons').push(button);
                    }
                } .bind(this));
        }
        objectToArray(severalScreens.o_field_settings.yglui_str_wid_fs_record)
            .each(function(setting) {
                if (this.screensNavigationLayerData.get(setting['@screen'])) {
                    var fields = (setting.fs_fields.yglui_str_wid_fs_field) ? setting.fs_fields.yglui_str_wid_fs_field : null;
                    this.screensNavigationLayerData.get(setting['@screen']).set('settings', fields);
                }
                if (setting.tcontent_empty) {
                    this.tcontent_empty.set(setting['@screen'], setting.tcontent_empty);
                }
            } .bind(this));
        /**
        * Getting the screen related fields values (We could have several record nodes per screen in case
        * there are translations for instance).
        */
        if (severalScreens.o_field_values && severalScreens.o_field_values.yglui_str_wid_record) {
            var i = 1;
            objectToArray(severalScreens.o_field_values.yglui_str_wid_record)
                .each(function(values) {
                    if (Object.isEmpty(values['@screen']))
                        values['@screen'] = i.toString();
                    if (this.screensNavigationLayerData.get(values['@screen']))
                        this.screensNavigationLayerData.get(values['@screen']).get('values').push(values.contents);
                    i++;
                } .bind(this));
        }

    },
    /** It builds the screenNavigation layer HTML depending on the @screenmode value
    * @param html {Array} the different screens HTML elements.
    */
    getHtmlScreensNavigationLayer: function(html) {
        if (!Object.isEmpty(this.screenMode)) {
            //screenMode set, several widgets
            this.screensNavigationDiv = new Element('div', {
                'id': 'screensNavigationLayer',
                'class': 'getContentWidget fieldDispTotalWidth fieldClearBoth'
            });
            if (this.mode != 'display') {
                this.loadingMessage = new Element('div', { 'class': 'fieldDispHeight fieldDispClearBoth fieldDispTotalWidth' });
                this.loadingMessage.update(" ");
                //The following 2 lines are a replacement of hide() in order to correct an IE6 bug
                //The visual effect is the same as with hide()
                //However in order to use hide() in a later version, the corresponding parts need to be
                //changed to show() as well.
                this.loadingMessage.style.overflow = 'hidden';
                this.loadingMessage.style.height = '0px';
                this.screensNavigationDiv.insert(this.loadingMessage);
            }
            var column = new Element('div', {
                'id': 'screensNavigationLayer_widgetsColumn',
                'class': 'portal_column'
            });
            this.screensNavigationDiv.insert(column);
            var screensNavigationPortal = new Widgets.Portal([column], this.screensNavigationDiv.identify(), {});
            var data = this.screensNavigationLayerData;
            html.each(function(translation) {
                var title = this.chooseLabel(data.get(translation.key).get('config')['@label_tag']);
                var content = (translation.value[0]) ? translation.value[0] : translation.value;
                content.addClassName("fieldClearBoth");
                //showing screen-specific buttons
                this.screenNavigationButtonsJson = {
                    elements: [],
                    defaultButtonClassName: ''
                };
                objectToArray(data.get(translation.key).get('buttons')).each(function(button) {

                    //See if we have to show or not this button for this mode. This will override the showButtons parameter (if present)
                    var showInDisplay = false;
                    if (!Object.isEmpty(button['@showindisplay']) && (button['@showindisplay']).toLowerCase() == "x") {
                        showInDisplay = true;
                    }
                    var showInCreate = false;
                    if (!Object.isEmpty(button['@showincreate']) && (button['@showincreate']).toLowerCase() == "x") {
                        showInCreate = true;
                    }
                    var showInEdit = false;
                    if (!Object.isEmpty(button['@showinedit']) && (button['@showinedit']).toLowerCase() == "x") {
                        showInEdit = true;
                    }
                    var forceShow = (this.mode == "display" && showInDisplay) || (this.mode == "create" && showInCreate) || (this.mode == "edit" && showInEdit);
                    if ((this.showButtons.get(this.mode) == true) || forceShow) {
                        var aux = {
                            idButton: 'screensNavigation_button_' + translation.key + '_' + button['@action'],
                            label: this.chooseLabel(button['@label_tag']),
                            className: 'getContentLinks fieldDispClearBoth application_action_link',
                            type: 'link',
                            handlerContext: null,
                            handler: this.getButtonHandler(button['@action'], button['@okcode'], button['@screen'], null, button['@label_tag'], button['@tarap'], button['@tarty'], button['@type'])
                        };
                        this.screenNavigationButtonsJson.elements.push(aux);
                    }
                } .bind(this));
                this.screenNavigationButtons = new megaButtonDisplayer(this.screenNavigationButtonsJson);
                content.insert(this.screenNavigationButtons.getButtons());

                screensNavigationPortal.add(new Widgets.Widget('screensNavigationLayer_widget_' + translation.key, {
                    optionsButton: false,
                    closeButton: false
                }).setContent(content).setTitle(title), 0);
            } .bind(this));
            //Disable the edit buttons so we don't change the screen while editing or creating
            if ((this.mode == "edit" && this.hideButtonsOnEdit) || (this.mode == "create" && this.hideButtonsOnCreate)) {
                this.hideScreensButtons();
            } else {
                this.showScreensButtons();
            }
            return this.screensNavigationDiv;
        } else {
            //screenMode is empty, several links, when clicking on it, the related screen is shown
            this.screensNavigationDiv = new Element('div', {
                'id': 'screensNavigationLayer',
                'class': 'fieldClearBoth'
            });
            if (this.screensNavigationLayerData.keys().length > 1) {//if just one screen, no links are needed
                //link using megabutton
                this.screenNavigationButtonsJson = {
                    elements: [],
                    mainClass: 'fieldPanel fieldDispFloatLeft',
                    defaultButtonClassName: ''
                };
                var links = null;
                this.screensNavigationLayerData.each(function(screen) {
                    var a = 0;
                    if (Object.isEmpty(screen.value.get('config')['@secondary'])) {//not secondary
                        var aux = {
                            idButton: 'screensNavigationLayer_link_' + screen.key,
                            label: !Object.isEmpty(this.chooseLabel(screen.value.get('config')['@label_tag'])) ? this.chooseLabel(screen.value.get('config')['@label_tag']) : 'null',
                            className: 'getContentLinks fieldDispFloatLeft application_action_link',
                            type: 'link',
                            eventOrHandler: false,
                            handler: function(screensNavigationDiv, screen) {
                                this.currentSelected = screen.key;
                                screensNavigationDiv.select('[class=screensNavigationLayer_screen fieldDispTotalWidth fieldDispFloatLeft]').each(function(screenDiv) {
                                    screenDiv.hide();
                                } .bind(this));
                                screensNavigationDiv.down('[id=screensNavigationLayer_screen_' + screen.key + ']').show();
                                this.screenNavigationButtons.hash.each(function(button) {
                                    this.screenNavigationButtons.enable(button.key);
                                } .bind(this));
                                this.screenNavigationButtons.setActive('screensNavigationLayer_link_' + screen.key);
                                document.fire('EWS:screensNavigationLinksClicked');
                            } .bind(this, this.screensNavigationDiv, screen)
                        };
                        this.screenNavigationButtonsJson.elements.push(aux);
                    }
                } .bind(this));
                this.screenNavigationButtons = new megaButtonDisplayer(this.screenNavigationButtonsJson);
                this.screensNavigationDiv.insert(this.screenNavigationButtons.getButtons());
                //end of link using megabutton
            }
            this.loadingMessage = new Element('div', { id: 'loadingMessage_' + this.name, 'class': 'fieldDispHeight fieldDispClearBoth fieldDispTotalWidth' });
            this.loadingMessage.update(" ");
            //The following 2 lines are a replacement of hide() in order to correct an IE6 bug
            //The visual effect is the same as with hide()
            //However in order to use hide() in a later version, the corresponding parts need to be
            //changed to show() as well.
            this.loadingMessage.style.overflow = 'hidden';
            this.loadingMessage.style.height = '0px';
            this.screensNavigationDiv.insert(this.loadingMessage);
            var data = this.screensNavigationLayerData;
            html.each(function(translation) {
                var selected = data.get(translation.key).get('config')['@selected'];
                var screenDiv = new Element('div', {
                    'id': 'screensNavigationLayer_screen_' + translation.key,
                    'class': 'screensNavigationLayer_screen fieldDispTotalWidth fieldDispFloatLeft'
                });
                var content = (translation.value[0]) ? translation.value[0] : translation.value;
                var buttons;
                if (this.showButtons.get(this.mode) == true) {
                    //showing screen-specific buttons
                    this.buttonsJson = {
                        elements: [],
                        defaultButtonClassName: ''
                    };
                    objectToArray(data.get(translation.key).get('buttons')).each(function(button) {
                        var aux = {
                            idButton: 'screensNavigation_button_' + translation.key + '_' + button['@action'],
                            label: this.chooseLabel(button['@label_tag']),
                            className: 'getContentLinks fieldDispClearBoth application_action_link',
                            type: 'link',
                            handlerContext: null,
                            handler: this.getButtonHandler(button['@action'], button['@okcode'], translation.key, null, button['@label_tag'], button['@tarap'], button['@tarty'], button['@type'])
                        };
                        this.buttonsJson.elements.push(aux);
                    } .bind(this));
                    buttons = new megaButtonDisplayer(this.buttonsJson);
                }
                screenDiv.insert(content);
                if (buttons) {
                    var buttonContainer = buttons.getButtons();
                    buttonContainer.addClassName('getContent_screenNavigationButtonsContainer');
                    screenDiv.insert(buttonContainer);
                }
                this.screensNavigationDiv.insert(screenDiv);
                if (data.keys().length > 1) {
                    if (Object.isEmpty(selected)) {//not selected, screen hidden
                        screenDiv.hide();
                    } else {
                        this.currentSelected = translation.key;
                        if (this.screenNavigationButtons)
                            this.screenNavigationButtons.setActive('screensNavigationLayer_link_' + translation.key);
                    }
                } else {
                    this.currentSelected = translation.key;
                }
            } .bind(this));
            //Disable the edit buttons so we don't change the screen while editing
            if ((this.mode == "edit" && this.hideButtonsOnEdit) || (this.mode == "create" && this.hideButtonsOnCreate)) {
                this.hideScreensButtons();
            }
            else {
                this.showScreensButtons();
            }
            return this.screensNavigationDiv;
        }
    },
    /*
    * @method displaySecondaryScreens
    * @desc it displays a popup window with the secondary screens associated with the screenId
    */
    displaySecondaryScreens: function(screenId) {
        var contentElement = this.secondaryScreens.get(screenId);
        var contentHTML = new Element('div', {
            'id': 'getContentDisplayerSecondaryScreen',
            'style': 'overflow:hidden'
        });
        contentHTML.insert(contentElement);
        var secondaryScreenPopUp = new infoPopUp({
            closeButton: $H({
                'textContent': 'Close',
                'callBack': function() {

                    secondaryScreenPopUp.close();
                    delete secondaryScreenPopUp;
                }
            }),
            htmlContent: contentHTML,
            indicatorIcon: 'information',
            width: 800
        });
        secondaryScreenPopUp.create();
    },

    /**
    * Shows the buttons that select the screen 
    */
    showScreensButtons: function() {
        if (!Object.isEmpty(this.screenNavigationButtons)) {
            for (var i = 0; i < this.screenNavigationButtonsJson.elements.size(); i++) {
                if (this.screenNavigationButtonsJson.elements[i].idButton == ("screensNavigationLayer_link_" + this.currentSelected)) {
                    //If it's the active link;
                    this.screenNavigationButtons.setActive(this.screenNavigationButtonsJson.elements[i].idButton);
                } else {
                    //If it's not the active link;
                    this.screenNavigationButtons.enable(this.screenNavigationButtonsJson.elements[i].idButton);
                }
            }
        }
    },
    /**
    * Hides the buttons that select the screen
    */
    hideScreensButtons: function() {
        if (!Object.isEmpty(this.screenNavigationButtons)) {
            for (var i = 0; i < this.screenNavigationButtonsJson.elements.size(); i++) {
                if (this.screenNavigationButtonsJson.elements[i].idButton == ("screensNavigationLayer_link_" + this.currentSelected)) {
                    //If it's the active link;
                    this.screenNavigationButtons.setActive(this.screenNavigationButtonsJson.elements[i].idButton);
                } else {
                    //If it's not the active link;
                    this.screenNavigationButtons.disable(this.screenNavigationButtonsJson.elements[i].idButton);
                }
            }
        }
    },

    //***************************************************************
    //TRANSLATIONS LAYER
    //***************************************************************
    /**It handles the translations layer logic, returning each translation HTML.
    * @param severalTranslations {Hash} screen Hash info and contents.
    */
    translationsLayer: function(severalTranslations) {
        /**
        * We'll know if there are tranlations for the current screen depending on this attribute.
        */
        var translations = null;
        if (severalTranslations.get('config'))
            translations = (!Object.isEmpty(severalTranslations.get('config')['@translation']) && (severalTranslations.get('config')['@translation'].toLowerCase() == 'x'));
        if (translations) {
            this.translationsLayerData = $H();
            var html = $H();
            this.getDataTranslationsLayer(severalTranslations).each(function(element) {
                severalTranslations.set('values', [element.value]);
                html.set(element.key, this.listModeLayer(severalTranslations));
            } .bind(this));
            return this.getHtmlTranslationsLayer(html);
        } else {
            return this.listModeLayer(severalTranslations);
        }
    },
    /** This method organizes the info in the needed way for the translations layer to work.
    * @param severalTranslations {Hash} screen related data.
    */
    getDataTranslationsLayer: function(severalTranslations) {
        var data = objectToArray(severalTranslations.get('values'));
        data.each(function(translation) {
            if (translation.yglui_str_wid_content && translation.yglui_str_wid_content.fields && translation.yglui_str_wid_content.fields.yglui_str_wid_field) {
                //we need to look for the translation info in a lower layer level
                objectToArray(translation.yglui_str_wid_content.fields.yglui_str_wid_field).each(function(field) {
                    if (field['@fieldid'].toLowerCase() == 'translation') {
                        var translationId = field['@value'];
                        this.translationsLayerData.set(translationId, translation);
                    }
                } .bind(this));
            }
        } .bind(this));
        return this.translationsLayerData;
    },
    /**
    * @param options {Object} getContentModule initialize() parameters.
    */
    getHtmlTranslationsLayer: function(html) {
        var translationsDiv = new Element('div', {
            'id': 'translationsLayer',
            'class': 'fieldClearBoth'
        });
        //link using megabutton
        this.buttonsJson = {
            elements: [],
            defaultButtonClassName: '',
            defaultDisabledClass: 'application_text_bolder'
        };
        var links = null;
        this.translationsLayerData.each(function(translation) {
            var title = '';
            if (translation.value.yglui_str_wid_content && translation.value.yglui_str_wid_content.fields && translation.value.yglui_str_wid_content.fields.yglui_str_wid_field) {
                //we need to look for the translation info in a lower layer level
                objectToArray(translation.value.yglui_str_wid_content.fields.yglui_str_wid_field).each(function(field) {
                    if (field['@fieldid'].toLowerCase() == 'translation') {
                        title = !Object.isEmpty(field['#text']) ? field['#text'] : global.getLabel(translation.key);
                        var key = translation.key;
                        var aux = {
                            idButton: 'translationsLayer_link_' + field['@value'],
                            label: title,
                            className: 'getContentLinks fieldDispFloatLeft application_action_link',
                            type: 'link',
                            eventOrHandler: false,
                            handler: function(translationsDiv, key) {
                                this.currentRecordIndex = translation.value.yglui_str_wid_content['@rec_index'];
                                translationsDiv.select('[class=translationsLayer_screen]').each(function(translationDiv) {
                                    translationDiv.hide();
                                } .bind(this));
                                translationsDiv.down("[id=translationsLayer_screen_" + key + "]").show();
                                links.hash.each(function(button) {
                                    links.enable(button.key);
                                } .bind(this));
                                links.disable('translationsLayer_link_' + key);
                            } .bind(this, translationsDiv, key)
                        };
                        this.buttonsJson.elements.push(aux);
                    }
                } .bind(this));
            }
        } .bind(this));
        links = new megaButtonDisplayer(this.buttonsJson);
        translationsDiv.insert(links.getButtons());
        //end of link using megabutton
        var data = this.translationsLayerData;
        this.translationSelected = null;
        html.each(function(translation) {
            var selected = data.get(translation.key).yglui_str_wid_content['@selected'];
            var translationDiv = new Element('div', {
                'id': 'translationsLayer_screen_' + translation.key,
                'class': 'translationsLayer_screen'
            });
            var translationHtml = (!Object.isEmpty(translation.value[0]) ? translation.value[0] : translation.value);
            translationDiv.insert(translationHtml);
            translationsDiv.insert(translationDiv);
            if (Object.isEmpty(selected)) {//not selected, screen hidden
                translationDiv.hide();
            } else {
                if (Object.isEmpty(this.translationSelected)) {//translation selected empty
                    this.translationSelected = data.get(translation.key).yglui_str_wid_content['@rec_index'];
                    links.disable('translationsLayer_link_' + translation.key);
                } else {
                    translationDiv.hide();
                }
            }
        } .bind(this));
        if ((this.translationSelected == null) && (html.keys().size() != 0)) {
            translationsDiv.down('[id=translationsLayer_screen_' + html.keys()[0] + ']').show();
            this.translationSelected = data.get(html.keys()[0]).yglui_str_wid_content['@rec_index'];
            links.disable('translationsLayer_link_' + html.keys()[0]);
        }
        return translationsDiv;
    },
    //***************************************************************
    //LIST MODE LAYER
    //***************************************************************
    /**It handles the listMode layer logic, returning several screen <contents> nodes HTML formatted as a list.
    * @param severalRows {Hash} screen specific translation Hash info and contents.
    */
    listModeLayer: function(severalRows) {
        var listMode = null;
        if (severalRows.get('config'))
            listMode = (!Object.isEmpty(severalRows.get('config')['@list_mode']) && (severalRows.get('config')['@list_mode'].toLowerCase() == 'x'));
        if (listMode) {
            this.listMode = true;
            var html = $H();
            this.getDataListModeLayer(severalRows).each(function(element) {
                html.set(element.key, this.registersNavigationLayer([element.value, severalRows.get('settings')], severalRows.get('config')));
            } .bind(this));
            return this.getHtmlListModeLayer(html, severalRows.get('settings'));
        } else {
            return this.registersNavigationLayer([severalRows.get('values')[0], severalRows.get('settings')], severalRows.get('config'));
        }
    },
    /**It returns the screen specific translation info splitted in the different rows the list
    * mode layer must display.  	
    * @param severalRows {Hash} screen specific translation Hash info and contents.
    */
    getDataListModeLayer: function(severalRows) {
        this.rowHeader = '';
        this.minSeqnr = null;
        objectToArray(severalRows.get('settings')).each(function(fieldSettings) {
            var a = 0;
            if (fieldSettings['@fieldtype'] && fieldSettings['@fieldtype'].toLowerCase() == 'h') {
                if (!Object.isEmpty(this.minSeqnr)) {
                    if (parseInt(fieldSettings['@seqnr'], 10) < this.minSeqnr) {
                        //this field is the row header
                        this.rowHeader = fieldSettings['@fieldid'].toLowerCase();
                        this.minSeqnr = parseInt(fieldSettings['@seqnr'], 10);
                    }
                } else {
                    //this field is the row header
                    this.rowHeader = fieldSettings['@fieldid'].toLowerCase();
                    this.minSeqnr = parseInt(fieldSettings['@seqnr'], 10);
                }
            }
        } .bind(this));
        this.listModeLayerData = $H();
        this.hasToSaveShowText = $H({});
        objectToArray(severalRows.get('values')).each(function(fieldValues) {
            objectToArray(objectToArray(fieldValues.yglui_str_wid_content)[0].fields.yglui_str_wid_field).each(function(field, index) {
                var settings = objectToArray(severalRows.get('settings'));
                for (var i = 0; i < settings.length; i++) {
                    if (settings[i]['@fieldid'] == field['@fieldid']) {
                        var showText = settings[i]['@show_text'];
                        if (Object.isEmpty(showText)) {
                            showText = '';
                        }
                    }
                }
                if (field['@fieldid'] && field['@fieldid'].toLowerCase() == this.rowHeader) {
                    var valueToShow = !Object.isEmpty(field['#text']) ? field['#text'] : field['@value'];
                    if (Object.isEmpty(valueToShow))
                        valueToShow = global.labels.get('viewDetails');

                    var valueToHash = !Object.isEmpty(sapToObject(valueToShow)) ? sapToDisplayFormat(valueToShow) : valueToShow;
                    if (this.listModeLayerData.get(valueToHash)) {
                        var i = 2;
                        while (this.listModeLayerData.get(valueToHash + ' (' + i + ')')) {
                            i++;
                        }
                        this.listModeLayerData.set(valueToHash + ' (' + i + ')', fieldValues);
                    } else {
                        this.listModeLayerData.set(valueToHash, fieldValues);
                    }
                    //this.listModeLayerData.get(valueToShow).yglui_str_wid_content.showText=showText;
                }
                this.hasToSaveShowText.set(field['@fieldid'], showText);
            } .bind(this));
        } .bind(this));
        return this.listModeLayerData;
    },
    /**
    * Here it is built the list mode HTML, each row will show the returned HTML by the layer below.
    * @param html {Array} registersNavigation layer HTML elements.
    */
    getHtmlListModeLayer: function(html, settings) {
        var tableHeaders = [];
        var elementToReturn = new Element('div', {});
        this.listModeTableNoResultsDiv = new Element('div', { 'class': 'fieldDispTotalWidth fieldDispFloatLeft pdcPendReq_emptyTableDataPart application_main_soft_text' }).update(global.getLabel('noResults'));
        this.listModeTableNoResultsDivHash.set(this.currentScreen, this.listModeTableNoResultsDiv);

        elementToReturn.insert(this.listModeTableNoResultsDiv);
        var listModeTable = {
            header: $A([]),
            rows: $H()
        };
        var headers = [];
        objectToArray(settings).each(function(fieldSettings) {//setting the table headers
            var a = 0;
            if (fieldSettings['@fieldtype'] && fieldSettings['@fieldtype'].toLowerCase() == 'h') {
                //this field is a column header
                var seqnr = parseInt(fieldSettings['@seqnr'], 10);
                tableHeaders[seqnr] = fieldSettings['@fieldid'];
            }
        } .bind(this));
        tableHeaders.each(function(headerId) {//printing the listmode headers
            objectToArray(settings).each(function(fieldSettings) {
                if (fieldSettings['@fieldid'] == headerId) {
                    var seqnr = parseInt(fieldSettings['@seqnr'], 10);
                    var label = !Object.isEmpty(fieldSettings['@fieldlabel']) ? fieldSettings['@fieldlabel'] : this.chooseLabel(headerId);
                    headers[parseInt(seqnr)] = { text: label, id: 'listModeTableHeader_' + headerId };
                }
            } .bind(this));
        } .bind(this));
        headers.each(function(item) {
            if (item) {
                listModeTable.header.push(item);
            }
        } .bind(this));
        this.listModeLayerData.each(function(data) {//printing the headers values for this row
            listModeTable.rows.set(data.key, { data: [], element: '' });
            var first;
            var rowsData = [];
            objectToArray(objectToArray(data.value.yglui_str_wid_content)[0].fields.yglui_str_wid_field).each(function(fieldSettings) {
                for (var i = 0; i < tableHeaders.length; i++) {
                    if (tableHeaders[i] && tableHeaders[i] == fieldSettings['@fieldid']) {
                        var valueOfShowText = this.hasToSaveShowText.get(fieldSettings['@fieldid']);
                        first = (Object.isEmpty(first)) ? i : first;
                        first = (i < first) ? i : first; //getting the rowNumber that will contain the link with the listMode behaviour
                        if (!Object.isEmpty(fieldSettings['@value']) && !Object.isEmpty(sapToObject(fieldSettings['@value'])))
                            var dataToHeader = sapToDisplayFormat(fieldSettings['@value']);
                        else
                            var dataToHeader = fieldSettings['@value'];
                        if (valueOfShowText == 'I' || valueOfShowText == 'X')
                            var label = fieldSettings['#text'];
                        else if (valueOfShowText == '')
                            var label = dataToHeader;
                        else if (valueOfShowText == 'B')
                            var label = fieldSettings['#text'] + ' [' + dataToHeader + ']';
                        rowsData[i] = { text: label, id: 'listModeTableField_row_' + i + '_' + fieldSettings['@fieldid'] };
                    }
                }
            } .bind(this));
            rowsData[first] = { text: data.key, id: 'listModeTableField_row_' + first + '_link' };
            var element = (!Object.isEmpty(html.get(data.key)[0]) ? html.get(data.key)[0] : html.get(data.key));
            listModeTable.rows.get(data.key).element = element;
            rowsData.each(function(item) {
                if (item) {
                    listModeTable.rows.get(data.key).data.push(item);
                }
            } .bind(this));
        } .bind(this));

        this.listModeTable = new SimpleTable(listModeTable, { typeLink: true });
        this.listModeTableHash.set(this.currentScreen, this.listModeTable);

        this.listModeTableElement = this.listModeTable.getElement();
        this.listModeTableElementHash.set(this.currentScreen, this.listModeTableElement);

        elementToReturn.insert(this.listModeTableElement);
        if (this.listModeLayerData.keys().length == 0)
            this.listModeTableElement.hide();
        else
            this.listModeTableNoResultsDiv.hide();
        return elementToReturn;
    },

    /**
    * @method getListModeTable
    * @desc Gets the list mode given by screen
    * @param screenId screen Id
    * @returns the list mode in the given screen
    */

    getListModeTable: function(screenId) {
        return this.listModeTableHash.get(screenId);
    },

    /**
    * @method getListModeTableElement
    * @desc Gets the list mode table element by screen
    * @param screenId screen Id
    * @returns the table element in the given screen
    */

    getListModeTableElement: function(screenId) {
        return this.listModeTableElementHash.get(screenId);
    },

    /**
    * @method getListModeTableNoResultsDiv
    * @desc Gets the list mode no results div by screen
    * @param screenId screen Id
    * @returns the no-results div in the given screen
    */

    getListModeTableNoResultsDiv: function(screenId) {
        return this.listModeTableNoResultsDivHash.get(screenId);
    },

    //***************************************************************
    //REGISTERS NAVIGATION LAYER
    //***************************************************************
    /**   	
    * @param severalRegisters {Object} getContentModule initialize() parameters.
    * @param screenConfig {Object} getContentModule initialize() parameters.
    */
    registersNavigationLayer: function(severalRegisters, screenConfig) {
        if (Object.isEmpty(severalRegisters[0])) {
            //no values to show
            if (this.mode == 'display' || Object.isEmpty(this.jsonCreateMode)) {
                var noValuesElement = new Element('div');
                noValuesElement.insert('<span class="fieldDispTotalWidth fieldDispFloatLeft application_main_soft_text pdcPendReq_emptyTableDataPart">' + global.getLabel('noResults') + '</span>')
                return noValuesElement;
            } else {
                objectToArray(this.jsonCreateMode.EWS.o_field_values.yglui_str_wid_record).each(function(record) {
                    if (record['@screen'] == screenConfig['@screen']) {
                        severalRegisters[0] = record.contents;
                    }
                } .bind(this));
            }
        } else {
            //there are values to show
            if (objectToArray(severalRegisters[0].yglui_str_wid_content).length > 1) {
                //several registers
                var html = $H();
                this.getDataRegistersNavigationLayer(severalRegisters[0]).each(function(element) {
                    html.set(element.key, this.uiModeLayer([element.value, severalRegisters[1]], screenConfig));
                } .bind(this));
                return this.getHtmlRegistersNavigationLayer(html);
            } else {
                //just one register
                return this.uiModeLayer([severalRegisters[0].yglui_str_wid_content, severalRegisters[1]], screenConfig);
            }
        }
    },
    /**
    * @param options {Object} getContentModule initialize() parameters.
    */
    getDataRegistersNavigationLayer: function(severalRegisters) {
        objectToArray(severalRegisters.yglui_str_wid_content).each(function(content) {
            this.registersNavigationLayerData.set(content['@rec_index'], content);
        } .bind(this));
        return this.registersNavigationLayerData;

    },
    /**
    * @param options {Object} getContentModule initialize() parameters.
    */
    getHtmlRegistersNavigationLayer: function(html) {
        var registersNavigationDiv = new Element('div', {
            'id': 'registersNavigationLayer'
        });
        this.registersNavigationLayerData.each(function(register) {
            var registerDiv = new Element('div', {
                'id': 'registersNavigationLayer_' + register.key
            });
            registerDiv.insert(html.get(register.key));
            if (Object.isEmpty(register.value['@selected'])) {
                registerDiv.hide();
            } else {
                this.shownRegister = register.key;
            }
            registersNavigationDiv.insert(registerDiv);
        } .bind(this));
        //inserting arrows in order to handle the registers
        var registersNavigationLeftButton = new Element('button', {
            'id': 'registersNavigationLayer_leftButton',
            'class': 'application_verticalL_arrow fieldsPanel_button_previous'
        });
        var registersNavigationButtonsSeparator = new Element('div', {
            'class': 'fieldsPanel_buttons_separator'
        });
        var registersNavigationRightButton = new Element('button', {
            'id': 'registersNavigationLayer_rightButton',
            'class': 'application_verticalR_arrow fieldsPanel_button_previous'
        });
        var registersNavigationButtonsDiv = new Element('div', {
            'id': 'registersNavigationLayer_buttonsDiv',
            'class': 'getContentRegistersNavDiv'
        });
        registersNavigationButtonsDiv.insert(registersNavigationLeftButton);
        registersNavigationButtonsDiv.insert(registersNavigationButtonsSeparator);
        registersNavigationButtonsDiv.insert(registersNavigationRightButton);
        registersNavigationDiv.insert(registersNavigationButtonsDiv);
        if (this.registersNavigationLayerData.keys().first() == this.shownRegister) {//disable left arrow
            registersNavigationLeftButton.hide();
        }
        if (this.registersNavigationLayerData.keys().last() == this.shownRegister) {//disable right arrow
            registersNavigationRightButton.hide();
        } else {
            //emptyDiv, it is shown in order to avoid that the right arrow 'jumps' when the left arrow is hidden
            registersNavigationButtonsSeparator.hide();
        }
        //defining left arrow behaviour
        registersNavigationLeftButton.onclick = function(registerNavigationDiv, registersNavigationRightButton) {
            //hiding current register
            registerNavigationDiv.down('[id=registersNavigationLayer_' + this.shownRegister + ']').hide();
			//unset "selected" attribute for the previous record
			this.registersNavigationLayerData.get(this.shownRegister)['@selected'] = null;
            //decreasing shownRegister
            this.shownRegister = this.registersNavigationLayerData.keys()[this.registersNavigationLayerData.keys().indexOf(this.shownRegister) - 1];
			//set "selected" attribute for the new record
            this.registersNavigationLayerData.get(this.shownRegister)['@selected'] = "X";
            //showing new current register
            registerNavigationDiv.down('[id=registersNavigationLayer_' + this.shownRegister + ']').show();
            registersNavigationButtonsSeparator.hide();
            registersNavigationRightButton.show();
            if (this.registersNavigationLayerData.keys().first() == this.shownRegister) {
                //the new shown register is the first one, hiding left arrow
                registersNavigationLeftButton.hide();
            }
        } .bind(this, registersNavigationDiv, registersNavigationRightButton);
        //right arrow behaviour
        registersNavigationRightButton.onclick = function(registerNavigationDiv, registersNavigationLeftButton) {
            //hiding current register
            registerNavigationDiv.down('[id=registersNavigationLayer_' + this.shownRegister + ']').hide();
			//unset "selected" attribute for the previous record
            this.registersNavigationLayerData.get(this.shownRegister)['@selected'] = null;
            //increasing shownRegister
            this.shownRegister = this.registersNavigationLayerData.keys()[this.registersNavigationLayerData.keys().indexOf(this.shownRegister) + 1];
            //set "selected" attribute for the new record
            this.registersNavigationLayerData.get(this.shownRegister)['@selected'] = "X";
            //showing new current register
            registerNavigationDiv.down('[id=registersNavigationLayer_' + this.shownRegister + ']').show();
            registersNavigationLeftButton.show();
            if (this.registersNavigationLayerData.keys().last() == this.shownRegister) {
                //the new shown register is the last one, hiding right arrow
                registersNavigationRightButton.hide();
                registersNavigationButtonsSeparator.show();
            }
        } .bind(this, registersNavigationDiv, registersNavigationLeftButton);
        return registersNavigationDiv;
    },
    //***************************************************************
    //UI MODE LAYER
    //***************************************************************
    /**
    * @param options {Object} getContentModule initialize() parameters.
    */
    uiModeLayer: function(register, screenConfig) {
        var html = null;
        if (register[0] && register[0].buttons && register[0].buttons.yglui_str_wid_button)
            var buttons = register[0].buttons.yglui_str_wid_button;
        else
            var buttons = null;
        html = this.subModulesLayer(register, screenConfig);
        return this.getHtmlUiModeLayer(html, buttons, screenConfig, register[0]);
    },
    /**
    * @param options {Object} getContentModule initialize() parameters.
    */
    getHtmlUiModeLayer: function(html, buttonsData, screenConfig, register) {
        if (!Object.isEmpty(buttonsData)) {
            var uiDiv = new Element('div', {
                'id': 'uiLayer'
            });
            var buttonsJson = {
                elements: [],
                defaultButtonClassName: ''
            };
            objectToArray(buttonsData).each(function(button) {
                //See if we have to show or not this button for this mode. This will override the showButtons parameter (if present)
                var showInDisplay = false;
                if (!Object.isEmpty(button['@showindisplay']) && (button['@showindisplay']).toLowerCase() == "x") {
                    showInDisplay = true;
                }
                var showInCreate = false;
                if (!Object.isEmpty(button['@showincreate']) && (button['@showincreate']).toLowerCase() == "x") {
                    showInCreate = true;
                }
                var showInEdit = false;
                if (!Object.isEmpty(button['@showinedit']) && (button['@showinedit']).toLowerCase() == "x") {
                    showInEdit = true;
                }
                var forceShow = (this.mode == "display" && showInDisplay) || (this.mode == "create" && showInCreate) || (this.mode == "edit" && showInEdit);
                if ((this.showButtons.get(this.mode) || forceShow) == true && button['@action'] && button['@action'].toLowerCase() != 'previous' && button['@action'].toLowerCase() != 'next') {
                    var handler = this.getButtonHandler(button['@action'], button['@okcode'], screenConfig['@screen'], register['@rec_index'], button['@label_tag'], button['@tarap'], button['@tarty'], button['@type']);
                    var aux = {
                        idButton: 'getContent_' + button['@action'],
                        label: this.chooseLabel(button['@label_tag']),
                        handlerContext: this,
                        handler: handler,
                        className: 'getContentLinks fieldDispFloatLeft application_action_link',
                        type: 'link'
                    };
                    buttonsJson.elements.push(aux);
                }
            } .bind(this));
            var buttons = new megaButtonDisplayer(buttonsJson);
            uiDiv.insert(html);
            var buttonsElement = buttons.getButtons();
            buttonsElement.addClassName('fieldClearBoth');
            uiDiv.insert(buttonsElement);
            return uiDiv;
        } else {
            return html;
        }
    },
    //***************************************************************
    //SUBMODULES LAYER
    //***************************************************************
    /**
    * @param options {Object} getContentModule initialize() parameters.
    */
    subModulesLayer: function(register, screenConfig) {
        var html = null;
        if (!Object.isEmpty(screenConfig['@dyn_panel']) && (screenConfig['@dyn_panel'] != 'H') && (screenConfig['@dyn_panel'] != 'O') && (screenConfig['@dyn_panel'] != '3')) {
            //take the language for each translation screen
            var language = '';
            for (var i = 0; i < register[0].fields.yglui_str_wid_field.length; i++) {
                if (register[0].fields.yglui_str_wid_field[i]['@fieldtechname'] == 'LANGU')
                    language = register[0].fields.yglui_str_wid_field[i]['@value'];
            }
            //dynamicFieldsPanel, all the html from this layer below is generated by the dynamicFieldsPanel module
            html = new dynamicFieldsPanel({
                mode: this.mode,
                json: this.json,
                appId: this.appId,
                screenConfig: screenConfig,
                language: language,
                typeOfScreen: screenConfig['@dyn_panel'],
                //noResultsHtml: ,
                objectType: this.objectType,
                objectId: this.objectId
                //fireEventWhenDefaultValueSet : ,
                //paiEvent : 
            }).getElement();
        } else {
            if (!Object.isEmpty(this.subModule) && !Object.isEmpty(this[this.subModule])) {
                html = this[this.subModule](register, screenConfig);
            } else {//default submodule
                html = this.fieldsPanel(register, screenConfig);
                this.subModulesInstances.set(this.appId + screenConfig['@screen'] + register[0]['@rec_index'], [register, screenConfig, $H()]);
                this.subModulesInstances.get(this.appId + screenConfig['@screen'] + register[0]['@rec_index'])[2].set(this.mode, html);
            }
        }
        //****************************************************
        return html;
    },
    /**
    * Changes the mode of a panel speficiying the part of the panel you want to switch
    * @mode The mode you want to change to
    * @appId the Application ID
    * @screen The screen to switch to
    */
    toggleMode: function(mode, appId, screen, recIndex) {
        this.currentRecordIndex = recIndex;
        this.currentScreenIndex = screen;
        this.currentAppId = appId;
        var html;
        var previousMode;
        var key = appId + screen + recIndex;
        if (this.subModulesInstances.get(key) == undefined && this.subModulesInstances.keys().size() == 1)
            key = $A(this.subModulesInstances.keys()).first();
        if (this.currentMode.get(key)) {
            previousMode = this.currentMode.get(key)
            this.currentMode.set(key, mode);
        } else {
            previousMode = this.mode;
            this.currentMode.set(key, mode);
        }
        this.mode = mode;
        if (this.subModulesInstances.get(key)[2].get(mode)) {
            var aux = this.subModulesInstances.get(key)[2].get(previousMode);
            this.subModulesInstances.get(key)[2].get(previousMode).replace(this.subModulesInstances.get(key)[2].get(mode));
            if (Object.isEmpty(this.oldApplicationDiv)) {
                this.oldApplicationDiv = this.applicationDiv;
                this.applicationDiv.update(this.subModulesInstances.get(key)[2].get(mode));
                this.applicationDiv.insert(this.errorsDiv);
            } else {
                this.applicationDiv = this.oldApplicationDiv;
                this.oldApplicationDiv = null;
            }
        } else {
            if (!Object.isEmpty(this.subModule) && !Object.isEmpty(this[this.subModule])) {
                html = this[this.subModule](this.subModulesInstances.get(key)[0], this.subModulesInstances.get(key)[1]);
            } else {//default submodule
                html = this.fieldsPanel(this.subModulesInstances.get(key)[0], this.subModulesInstances.get(key)[1]);
            }
            this.subModulesInstances.get(key)[2].set(mode, html);
            var childs = new Array();
            $A(this.subModulesInstances.get(key)[2].get(previousMode).childNodes).each(function(item) {
                var a = 0;
                childs.push(item.remove());
            });
            this.subModulesInstances.get(key)[2].get(previousMode).insert(html);
            if (Object.isEmpty(this.oldApplicationDiv)) {
                var tmpChilds = new Array();
                $A(this.applicationDiv.childNodes).each(function(item) {
                    var a = 0;
                    var i = 0;
                    while (i < item.childNodes.length) {
                        if (item.childNodes[i] != item.firstChild)
                            item.removeChild(item.childNodes[i]);
                        else
                            i++;
                    }
                    tmpChilds.push(item);
                });
                this.oldApplicationDiv = this.applicationDiv;
                tmpChilds = tmpChilds[0].insert(html);
                this.applicationDiv.insert(tmpChilds);
                this.applicationDiv.insert(this.errorsDiv);
            } else {
                this.applicationDiv = this.oldApplicationDiv;
                this.oldApplicationDiv = null;
            }
        }
        //Disable the edit buttons so we don't change the screen while editing
        if ((this.mode == "edit" && this.hideButtonsOnEdit) || (this.mode == "create" && this.hideButtonsOnCreate)) {
            this.hideScreensButtons();
        } else {
            this.showScreensButtons();
        }
        this.fixCss();
        this.mode = previousMode;

    },
    /**
    * @param options {Object} getContentModule initialize() parameters.
    */
    fieldsPanel: function(info, screenConfig) {
        objectToArray(info[1]).each(function(field) {
            if (field['@depend_type'] == 'X' || field['@depend_type'] == 'B') {
                this.visualDependencyCat.set(field['@depend_field'], true);
            }
        } .bind(this));
        this.subModulesLayerData.set('fields', []);
        this.subModulesLayerData.set('groups', this.groupingLayer(info, screenConfig));
        this.begDate = null;
        this.endDate = null;
        this.getDataSubModulesLayer(info, screenConfig).each(function(field) {
            if (this.mode == 'display' && field.values['@fieldid'] == 'BEGDA')
                this.begDate = field.values['@value'];
            else {
                if (this.mode == 'display' && field.values['@fieldid'] == 'ENDDA')
                    this.endDate = field.values['@value'];
                else {
                    var getFieldValueAppend = this.getXMLToAppendForField(field.settings['@fieldid']);
                    var displayer = this.fieldDisplayer({
                        settings: field.settings,
                        values: field.values,
                        screen: screenConfig['@screen'],
                        record: info[0]['@rec_index'],
                        key_str: info[0]['@key_str'],
                        getFieldValueAppend: getFieldValueAppend,
                        randomId: this.randomId
                    }, true);
                    //if (!displayer.options.hidden) {
                    this.subModulesLayerData.get('fields').push([field.settings, displayer.getHtml(), field.values]);
                    //}
                }
            }
        } .bind(this));

        //Once we have all the fields, we initialize their values:
        var fields = this.fieldDisplayers.get(this.appId + this.mode + screenConfig['@screen'] + info[0]['@rec_index']);
        this.setDateLinks(fields);
        this.setFieldDependencies(fields);

        return this.getHtmlSubModulesLayer();
    },

    /**
    * Sets the link between dates
    * @param {Object} fields
    */
    setDateLinks: function(fields) {
        if (!Object.isEmpty(fields)) {
            var begDate = fields.get("BEGDA");
            var endDate = fields.get("ENDDA");
            if (!Object.isEmpty(begDate) && !Object.isEmpty(endDate) &&
                !Object.isEmpty(begDate._moduleInstance) && !Object.isEmpty(endDate._moduleInstance))
                begDate._moduleInstance.linkCalendar(endDate._moduleInstance);
        }
    },
    /**
    * Sets the dependencies between fields
    * @param {Object} fields
    */
    setFieldDependencies: function(fields, dontCall) {
        if (!Object.isEmpty(fields)) {
            var fieldsKeys = fields.keys();
            for (var i = 0; i < fieldsKeys.size(); i++) {
                var field = fields.get(fieldsKeys[i]);
                //Set the dependant fields for each one of them:
                var dependantFields = $H();
                for (var j = 0; j < fieldsKeys.size(); j++) {
                    //Check against all other field to see if they're dependent
                    if (j != i) {
                        var otherField = fields.get(fieldsKeys[j]);
                        if (!Object.isEmpty(otherField.options.dependency.field) //If it has a dependency
							&& !(otherField.options.dependency.field == "")
							&& (otherField.options.dependency.field == field.options.id) //And it's a dependency to this field 
							&& (Object.isEmpty(otherField.options.dependency.type) //And the type of dependency is logical
								|| otherField.options.dependency.type == ""
								|| otherField.options.dependency.type == "B")) {
                            dependantFields.set(fieldsKeys[j], otherField);
                        }
                    }
                }
                field.setDependantFields(dependantFields);
                //If this field depends on other (we'll call it parent)
                if (!Object.isEmpty(field.options.dependency.field) //If it has a dependency
							&& !(field.options.dependency.field == "")
							&& (Object.isEmpty(field.options.dependency.type) //And the type of dependency is logical
								|| field.options.dependency.type == ""
								|| field.options.dependency.type == "B")) {
                    field.setParentField(fields.get(field.options.dependency.field));
                } else {
                    field.setParentField(null);
                }
            }
            if (!dontCall) {
                //Now that we've created every field, and the structures to control their dependencies: 
                for (var i = 0; i < fieldsKeys.size(); i++) {
                    //Only call it for the fields that don't depend logically on others.
                    //These fields will call the getValues methods for the fields that depend on them
                    var field = fields.get(fieldsKeys[i]);
                    if (Object.isEmpty(field.parentField)) {
                        field.getFieldValues();
                    } else {
                        if (field.parentField.options.fieldType == "fieldTypeHidden") {
                            field.getFieldValues();
                        }
                    }
                }
            }
        }
    },
    displayDatesWithImage: function(begDate, endDate) {
        var beg = (!Object.isEmpty(begDate)) ? sapToDisplayFormat(begDate) : '';
        var end = (!Object.isEmpty(endDate)) ? sapToDisplayFormat(endDate) : '';
        if (!Object.isEmpty(beg) && !Object.isEmpty(end))
            end = ['&nbsp;-&nbsp;', end].join('');
        if (!Object.isEmpty(begDate) || !Object.isEmpty(endDate)) {
            var myMainElement = new Element('div', { 'class': 'fieldsPanel_DisplayRowDates' });
            var mySecElement = new Element('div', { 'class': 'fieldsPanel_dateImage' });
            myMainElement.insert(mySecElement);
            var mySpanElem = new Element('span', { 'class': 'application_main_text fieldsPanel_noWrap' }).update(beg + end);
            myMainElement.insert(mySpanElem);
            return myMainElement;
        }
        else {
            return '';
        }
    },
    /**
    * @param options {Object} getContentModule initialize() parameters.
    */
    getDataSubModulesLayer: function(info, screenConfig) {
        var normalFields = [];
        var auxSettings = $H();
        var recIndex = info[0]['@rec_index'];
        var screen = screenConfig['@screen'];
        objectToArray(info[1]).each(function(field) {
            if (!Object.isEmpty(field['@fieldid']) && !field['@fieldid'].startsWith('OPT_') && Object.isEmpty(field['@display_group']) && (field['@fieldsource'] != 'T') && (field['@fieldtype'] != 'S')) {
                if (!auxSettings.keys().include(field['@fieldid'])) {
                    auxSettings.set(field['@fieldid'], field);
                }
                else {
                    if (!Object.isEmpty(this.variant.get(this.options.appId + '_' + screen))) {
                        if (this.mode != 'create')
                            var recordVariant = this.variant.get(this.options.appId + '_' + screen).records[recIndex];
                        else
                            var recordVariant = this.variant.get(this.options.appId + '_' + screen).defaultVariant;
                        if (field['@fs_variant'] == recordVariant)
                            auxSettings.set(field['@fieldid'], field);
                    }
                }
            }
        } .bind(this));
        objectToArray(info[0]).each(function(reg) {
            objectToArray(reg.fields.yglui_str_wid_field).each(function(field) {
                if (!Object.isEmpty(auxSettings.get(field['@fieldid']))) {
                    normalFields.push({
                        settings: auxSettings.get(field['@fieldid']),
                        values: field
                    });
                }
            } .bind(this));
        } .bind(this));
        return normalFields;
    },
    /**
    * @param options {Object} getContentModule initialize() parameters.
    */
    getHtmlSubModulesLayer: function() {
        var div = new Element('div');
        var arrayBySeqNr = [];
        this.subModulesLayerData.get('fields').each(function(field) {
            if (!Object.isEmpty(field[0]['@depend_type']) && (field[0]['@depend_type'] == 'X' || field[0]['@depend_type'] == 'B')) {
                this.visualDependencies.set(field[0]['@depend_field'], [field[0]['@fieldid'], field[1]]);
                if (!Object.isEmpty(field[1])) {
                    field[1].removeClassName('fieldDispTotalWidth');
                    field[1].removeClassName('fieldClearBoth');
                    //field[1].addClassName('fieldDispAlignBoxFields');
                }
                if (!Object.isEmpty(field[1]) && field[1].down()) {
                    field[1].down().removeClassName('fieldDispHalfSize');
                    //field[1].down().addClassName('fieldDispAlignFieldRight');
                }
            }
        } .bind(this));
        //looking for third level dependencies
        this.visualDependencies.each(function(dep1) {
            this.visualDependencies.each(function(dep2) {
                if (dep1.key == dep2.value[0]) {
                    if (dep2.value[1].identify() != dep1.value[1].identify())
                        dep2.value[1].insert(dep1.value[1]);
                }
            } .bind(this));
        } .bind(this));
        //switching fieldtechname into fieldid for dependent fields
        this.visualDependencies.each(function(dep) {
            this.subModulesLayerData.get('fields').each(function(field) {
                if (field[2]['@fieldtechname'] == dep.key) {
                    this.visualDependencies.unset(dep.key);
                    this.visualDependencies.set(field[2]['@fieldid'], dep.value);
                }
            } .bind(this));
        } .bind(this));
        this.subModulesLayerData.get('fields').each(function(field) {
            if (field[0]['@fieldid'] != 'TRANSLATION') {
                if (field[0]['@depend_type'] != 'X' && field[0]['@depend_type'] != 'B') {
                    if (this.visualDependencyCat.get(field[0]['@fieldid'])) {
                        var extraDiv = new Element('div', { 'id': 'rounderDiv_' + field[2]['@fieldid'], 'class': 'fieldClearBoth fieldDispTotalWidth getContentModule_rounderDiv fieldPanelVisualDep' }).insert(field[1])
                    } else {
                        var extraDiv = new Element('div', { 'id': 'rounderDiv_' + field[2]['@fieldid'], 'class': 'fieldClearBoth fieldDispTotalWidth getContentModule_rounderDiv' }).insert(field[1])
                    }
                    arrayBySeqNr[parseInt(field[0]['@seqnr'], 10)] = extraDiv;
                    if (this.visualDependencies.get(field[0]['@fieldid'])) {
                        //arrayBySeqNr[parseInt(field[0]['@seqnr'], 10)].down().removeClassName('fieldDispHalfSize');
                        //arrayBySeqNr[parseInt(field[0]['@seqnr'], 10)].down().addClassName('fieldDispQuarterSize');
                        arrayBySeqNr[parseInt(field[0]['@seqnr'], 10)].insert(this.visualDependencies.get(field[0]['@fieldid'])[1]);
                    }
                }
            }
        } .bind(this));
        arrayBySeqNr[this.subModulesLayerData.get('groups').get('tcontent')[0]] = this.subModulesLayerData.get('groups').get('tcontent')[1];
        objectToArray(this.subModulesLayerData.get('groups').get('group')).each(function(group) {
            arrayBySeqNr[group.value[0]] = group.value[1];
        } .bind(this));
        objectToArray(this.subModulesLayerData.get('groups').get('radioGroup')).each(function(group) {
            arrayBySeqNr[group.value[0]] = group.value[1];
        } .bind(this));
        arrayBySeqNr = arrayBySeqNr.compact();
        arrayBySeqNr.each(function(section) {
            div.insert(section);
        } .bind(this));
        if (this.subModulesLayerData.get('groups').get('viewMore'))
            div.insert(this.subModulesLayerData.get('groups').get('viewMore'));
        if ((!Object.isEmpty(this.begDate) || !Object.isEmpty(this.endDate)) && this.mode == 'display') {
            div.insert(this.displayDatesWithImage(this.begDate, this.endDate))
        }
        return div;
    },
    //***************************************************************
    //GROUPING LAYER
    //***************************************************************
    /**
    * @param options {Object} getContentModule initialize() parameters.
    */
    groupingLayer: function(info, screenConfig) {
        var html = $H({
            group: null,
            tcontent: null,
            radioGroup: null
        });
        var dataGroupingLayer = this.getDataGroupingLayer(info, screenConfig);
        dataGroupingLayer.each(function(element) {
            switch (element.key) {
                case 'group': html.set('group', this.getGroupHtml(element, screenConfig, info[0])); break;
                case 'tcontent': html.set('tcontent', this.getTcontentHtml(element, screenConfig, info[0])); break;
                case 'radioGroup': html.set('radioGroup', this.getRadioGroupHtml(element, screenConfig, info[0])); break;
                case 'viewMore': html.set('viewMore', this.getViewMoreGroupHtml(element, dataGroupingLayer.get('viewMoreRadioGroup'), dataGroupingLayer.get('viewMoreGroup'), screenConfig, info[0])); break;
            }
        } .bind(this));
        return this.getHtmlGroupingLayer(html);
    },
    /**
    * @param options {Object} getContentModule initialize() parameters.
    */
    getDataGroupingLayer: function(info) {
        var aux = $H({
            group: {
                settings: [],
                values: []
            },
            //for the radio buttons that are within another group
            radioInGroup: $H(),
            tcontent: {
                settings: [],
                values: info[0].tcontents
            },
            radioGroup: {
                settings: [],
                values: []
            },
            viewMore: {
                settings: [],
                values: []
            },
            viewMoreRadioGroup: {
                settings: [],
                values: []
            },
            viewMoreGroup: {
                settings: [],
                values: []
            }
        });
        var radioFields = [];
        var radioInGroup = $H();
        var groupFields = [];
        var viewMoreFields = [];
        var viewMoreRadioFields = [];
        var viewMoreGroupFields = [];

        //For every radio button group that is to be displayed in another group, we create a hash entry
        objectToArray(info[1]).each(function(field) {
            if (!Object.isEmpty(field['@display_group']) && !Object.isEmpty(field['@fieldid']) && field['@fieldid'].startsWith('OPT_')) {
                if (Object.isEmpty(aux.get('radioInGroup').get(field['@fieldid'].split('_')[1]))) {
                    aux.get('radioInGroup').set(field['@fieldid'].split('_')[1],
                        {
                            settings: [],
                            values: []
                        });
                    radioInGroup.set(field['@fieldid'].split('_')[1], $A());
                }
            }
        } .bind(this));
        objectToArray(info[1]).each(function(field) {
            var isRadioField = (!Object.isEmpty(field['@display_group']) && (field['@display_group'].startsWith('RADIO_'))) || (Object.isEmpty(field['@display_group']) && !Object.isEmpty(field['@fieldid']) && field['@fieldid'].startsWith('OPT_'));
            var isGroupField = !Object.isEmpty(field['@display_group']);
            var isTContentField = !Object.isEmpty(field['@fieldsource']) && (field['@fieldsource'].toLowerCase() == 't');
            var isViewMoreField = !Object.isEmpty(field['@fieldtype']) && (field['@fieldtype'].toLowerCase() == 's');

            //If it's a radio button whose radio group is to be displayed within another group, then we put it in the radioInGroup hash
            //Typically the @display_group = "RADIO_X_Y" fields
            if (isRadioField && !Object.isEmpty(field['@display_group']) && !Object.isEmpty(aux.get('radioInGroup').get(field['@display_group'].split('_')[1]))) {
                aux.get('radioInGroup').get(field['@display_group'].split('_')[1]).settings.push(field);
                radioInGroup.get(field['@display_group'].split('_')[1]).push(field['@fieldid']);
                //If it's a radio button field (typically with @fieldid = "OPT_X_Y") that is to be displayed in a group
                //then we put it in the radioInGroup hash
            } else if (isGroupField && !Object.isEmpty(field['@fieldid']) && field['@fieldid'].startsWith('OPT_')) {
                aux.get('radioInGroup').get(field['@fieldid'].split('_')[1]).settings.push(field);
                radioInGroup.get(field['@fieldid'].split('_')[1]).push(field['@fieldid']);
                //if it needs to be inside viewMore, then we also put it in the viewMoreGroup
                if (isViewMoreField) {
                    aux.get('viewMoreGroup').settings.push(field);
                    viewMoreGroupFields.push(field['@fieldid']);
                    //otherwise in the group
                } else {
                    aux.get('group').settings.push(field);
                    groupFields.push(field['@fieldid']);
                }
                //If it's radio button, that's is supposed to be inside a viewMore group
            } else if (isViewMoreField && isRadioField) {
                aux.get('viewMoreRadioGroup').settings.push(field);
                viewMoreRadioFields.push(field['@fieldid']);
            } else if (isViewMoreField && isGroupField) {	//Grouped fields that are supposed to be inside a viewMore group
                aux.get('viewMoreGroup').settings.push(field);
                viewMoreGroupFields.push(field['@fieldid']);
            } else if (isRadioField) {
                aux.get('radioGroup').settings.push(field);
                radioFields.push(field['@fieldid']);
            } else if (isGroupField) {
                aux.get('group').settings.push(field);
                groupFields.push(field['@fieldid']);
            } else if (isTContentField) {
                aux.get('tcontent').settings.push(field);
            } else if (isViewMoreField) {
                aux.get('viewMore').settings.push(field);
                viewMoreFields.push(field['@fieldid']);
            }
        } .bind(this));
        objectToArray(info[0]).each(function(reg) {
            objectToArray(reg.fields.yglui_str_wid_field).each(function(field) {
                if (radioFields.include(field['@fieldid'])) {
                    aux.get('radioGroup').values.push(field);
                } else if (viewMoreGroupFields.include(field['@fieldid'])) {
                    aux.get('viewMoreGroup').values.push(field);
                    //Putting the values part of the field in the corresponding radioInGroup values part,
                    //if it is a radio button field that is to be displayed in a group
                    radioInGroup.each(function(radioGroup) {
                        if (radioGroup.value.include(field['@fieldid']))
                            aux.get('radioInGroup').get(radioGroup.key).values.push(field);
                    } .bind(this));
                } else if (groupFields.include(field['@fieldid'])) {
                    aux.get('group').values.push(field);
                    //Putting the values part of the field in the corresponding radioInGroup values part,
                    //if it is a radio button field that is to be displayed in a group
                    radioInGroup.each(function(radioGroup) {
                        if (radioGroup.value.include(field['@fieldid']))
                            aux.get('radioInGroup').get(radioGroup.key).values.push(field);
                    } .bind(this));
                } else if (viewMoreFields.include(field['@fieldid'])) {
                    aux.get('viewMore').values.push(field);
                } else if (viewMoreRadioFields.include(field['@fieldid'])) {
                    aux.get('viewMoreRadioGroup').values.push(field);
                } else {
                    //Putting the values part of the field in the corresponding radioInGroup values part,
                    //if it is a radio button field that is to be displayed in a group
                    radioInGroup.each(function(radioGroup) {
                        if (radioGroup.value.include(field['@fieldid']))
                            aux.get('radioInGroup').get(radioGroup.key).values.push(field);
                    } .bind(this));
                }
            } .bind(this));
        } .bind(this));
        //we have to put it in a global variable because otherwise we cannot access it from getGroupHtml
        this.radioInGroup = aux.get('radioInGroup');
        return aux;
    },
    /**
    * @param 
    */
    getHtmlGroupingLayer: function(html) {
        return html;
    },
    /**
    * Gets the HTML for the fields inside the "View More" group.
    * @param {Object} group
    * @param {Object} radioGroups
    * @param {Object} groupedGroups
    * @param {Object} screenConfig
    * @param {Object} info
    */
    getViewMoreGroupHtml: function(group, radioGroups, groupedGroups, screenConfig, info) {
        var element = new Element('div', { 'id': 'viewMore_' + this.appId + '_' + screenConfig['@screen'] + '_' + info['@rec_index'] });
        if (group.value.settings.length > 0
            || (!Object.isEmpty(radioGroups) && !Object.isEmpty(radioGroups.settings) && radioGroups.settings.size() > 0)
            || (!Object.isEmpty(groupedGroups) && !Object.isEmpty(groupedGroups.settings) && groupedGroups.settings.size() > 0)) {

            //This will be the key that identifies this link and div in the hash of links and divs for viewMore
            this.viewMoreHashKey = screenConfig['@appid'] + "_" + screenConfig['@screen'] + "_" + info['@rec_index'];

            if (Object.isEmpty(this.buttonsJsonViewMore)) {
                this.buttonsJsonViewMore = $H();
            }

            this.buttonsJsonViewMore.set(this.viewMoreHashKey, {
                elements: [],
                defaultButtonClassName: ''
            });
            var idButtons = ['viewMore_link_' + this.appId + '_' + screenConfig['@screen'] + '_' + info['@rec_index'],
                                 'hideMore_link_' + this.appId + '_' + screenConfig['@screen'] + '_' + info['@rec_index']];

            var aux = {
                idButton: idButtons[0],
                label: global.getLabel('viewDetails'),
                className: 'getContentLinks fieldDispClearBoth application_action_link',
                type: 'link',
                handlerContext: null,
                handler: this.hideDetails.bind(this, this.viewMoreHashKey, idButtons)
            };
            this.buttonsJsonViewMore.get(this.viewMoreHashKey).elements.push(aux);
            var aux = {
                idButton: idButtons[1],
                label: global.getLabel('hideDetails'),
                className: 'getContentLinks fieldDispClearBoth application_action_link',
                type: 'link',
                handlerContext: null,
                handler: this.showDetails.bind(this, this.viewMoreHashKey, idButtons)
            };
            this.buttonsJsonViewMore.get(this.viewMoreHashKey).elements.push(aux);
            //The links will be stored in a hash with key APP + SCREEN + RECORD
            if (Object.isEmpty(this.viewMoreLink)) {
                this.viewMoreLink = $H();
            }

            this.viewMoreLink.set(this.viewMoreHashKey, new megaButtonDisplayer(this.buttonsJsonViewMore.get(this.viewMoreHashKey)));
            this.viewMoreLink.get(this.viewMoreHashKey).hash.get(idButtons[1])[1].hide();
            element.insert(this.viewMoreLink.get(this.viewMoreHashKey).getButtons());


            //The fields will be stored in a hash with key APP + SCREEN + RECORD
            if (Object.isEmpty(this.viewMoreFields)) {
                this.viewMoreFields = $H();
            }

            this.viewMoreFields.set(this.viewMoreHashKey, new Element('div', {
                'class': 'fieldDispFloatLeft fieldDispTotalWidth fieldDispTotalHeight fieldPanel_displayGroupDiv'
            }).insert("<span class='fieldPanelAlignTitleGroupDiv fieldDispFloatLeft application_text_bolder'></span>"));

            //Add the HTML for the normal secondary fields
            //we use the getGroupHtml to create the whole HTML, including normal fields,
            //radio groups, and groups
            //this is needed because otherwise we do not have complete control over the order of the
            //fields, radio buttons, groups
            var displayers = this.getGroupHtml(group, screenConfig, info, radioGroups, groupedGroups)
            this.viewMoreFields.set(this.viewMoreHashKey, displayers.get(displayers.keys()[0])[1]);  //TODO:REFACTOR: They would be at the beggining, no matter the seqnr, that may be corrected

            if (!Object.isEmpty(global.GCdetailsOpened.get(this.viewMoreHashKey))) {
                if (!global.GCdetailsOpened.get(this.viewMoreHashKey).showed) {
                    this.viewMoreFields.get(this.viewMoreHashKey).hide();
                }
                else {
                    this.viewMoreLink.get(this.viewMoreHashKey).hash.get(idButtons[0])[1].hide();
                    this.viewMoreLink.get(this.viewMoreHashKey).hash.get(idButtons[1])[1].show();
                }
            }
            else {
                this.viewMoreFields.get(this.viewMoreHashKey).hide();
            }
            element.insert(this.viewMoreFields.get(this.viewMoreHashKey));
        }
        return element;
    },

    /**
    * Shows the details part for this getContent
    * @param {Object} key
    */
    showDetails: function(key, idButtons) {
        this.viewMoreLink.get(key).hash.get(idButtons[1])[1].hide();
        this.viewMoreLink.get(key).hash.get(idButtons[0])[1].show();
        this.viewMoreFields.get(key).hide();
        if (!Object.isEmpty(global.GCdetailsOpened.get(key))) {
            global.GCdetailsOpened.get(key).showed = false;
        }
        else {
            global.GCdetailsOpened.set(key, { showed: false });
        }
    },
    /**
    * Hides the details part for this getContent
    * @param {Object} key
    */
    hideDetails: function(key, idButtons) {
        this.viewMoreLink.get(key).hash.get(idButtons[0])[1].hide();
        this.viewMoreLink.get(key).hash.get(idButtons[1])[1].show();
        this.viewMoreFields.get(key).show();
        if (!Object.isEmpty(global.GCdetailsOpened.get(key))) {
            global.GCdetailsOpened.get(key).showed = true;
        }
        else {
            global.GCdetailsOpened.set(key, { showed: true });
        }
    },
    /**
    * @param options {Object} getContentModule initialize() parameters.
    */
    getRadioGroupHtml: function(group, screenConfig, info) {
        var groups = $H();
        var selected = $H();
        var byOption = $H();
        var options = $H();
        var ret = $H();
        var groupsArray = $A();
        objectToArray(group.value.settings).each(function(field) {
            if (!Object.isEmpty(field['@display_group'])) {
                var groupName = field['@display_group'].split('_')[1];
                if (!field['@fieldid'].startsWith('OPT_') && !groups.get(groupName)) {
                    groups.set(groupName, $H());
                }
            }
            objectToArray(group.value.values).each(function(fieldValue) {
                if (fieldValue['@fieldid'] == field['@fieldid']) {
                    if (field['@fieldid'].startsWith('OPT_')) {
                        if (!options.get(fieldValue['@fieldid'].split('_')[1])) {
                            options.set(fieldValue['@fieldid'].split('_')[1], $H());
                        }
                        options.get(fieldValue['@fieldid'].split('_')[1]).set(fieldValue['@fieldid'], fieldValue);
                        if (!Object.isEmpty(field['@service_pai'])) {
                            //If the radio group has a pai service:
                            options.get(fieldValue['@fieldid'].split('_')[1]).get(fieldValue['@fieldid'])['@service_pai'] = field['@service_pai'];
                        }
                        if (fieldValue['@value'] == 'X') {
                            selected.set(fieldValue['@fieldid'].split('_')[1], fieldValue['@fieldid'].split('_')[2]);
                        }
                    } else {
                        groups.get(groupName).set(field['@fieldid'], $H({
                            settings: field,
                            values: fieldValue
                        }));
                        return;
                    }
                }
            } .bind(this));
        } .bind(this));
        groups.each(function(groupElement) {
            groupsArray.clear();
            var groupDiv = new Element('div', {
                'id': this.appId + "_" + groupElement.key,
                'class': 'fieldDispFloatLeft fieldDispClearBoth fieldDispTotalWidth fieldDispTotalHeight fieldDispGroupDiv'
            });
            byOption.set(groupElement.key, $H());
            var minSeqnr = Number.MAX_VALUE;
            groupElement.value.each(function(field) {
                if (field.value.get('settings')['@display_attrib'] != 'HID') {
                    if (!byOption.get(groupElement.key).get(field.value.get('settings')['@display_group'])) {
                        byOption.get(groupElement.key).set(field.value.get('settings')['@display_group'], []);
                    }
                    byOption.get(groupElement.key)
                        .get(field.value.get('settings')['@display_group'])[parseInt(field.value
                            .get('settings')['@seqnr'], 10)] = field.value;
                    if (parseInt(field.value.get('settings')['@seqnr'], 10) < minSeqnr)
                        minSeqnr = parseInt(field.value.get('settings')['@seqnr'], 10);
                }
            } .bind(this));
            byOption.get(groupElement.key).each(function(option, index) {
                var radioRow = new Element('div', {
                    'class': 'fieldDispFloatLeft fieldClearBoth fieldDispTotalWidth'
                });
                var seqnr = parseInt(option.value.compact().first().get('settings')['@seqnr'], 10);
                var checked = '';
                var disabled = '';
                if (this.mode == 'display')
                    disabled = 'disabled';
                if ((selected.size() == 0) && (index == 0)) {
                    checked = 'checked';
                    options.get(groupElement.key).get(option.key.gsub('RADIO', 'OPT'))['@value'] = 'X';
                } else {
                    checked = (selected.get(groupElement.key) == option.key.split('_')[2]) ? 'checked' : '';
                }
                radioRow.update("<input " + checked + " " + disabled + " class='fieldDispAlignInput fieldDispFloatLeft' type='radio' name='" + this.appId + "_" + screenConfig['@screen'] + "_" + info['@rec_index'] + "_" + groupElement.key + "' />");
                radioRow.down().observe('click', this.radioButtonClicked.bindAsEventListener(this, options, option, byOption, groupElement, screenConfig));
                var auxArray = option.value.compact();
                for (var i = 0; i < auxArray.size(); i++) {
                    var changed = false;
                    //since it's a radioGroup, the X in the OUO fieldDisplayer will draw an X as value, next to the text, and this is not desired
                    if (auxArray[i].get('values')['@value'] == 'X') {
                        auxArray[i].get('values')['@value'] = "";
                        changed = true;
                    }
                    var getFieldValueAppend = this.getXMLToAppendForField(auxArray[i].get('settings')['@fieldid']);
                    var displayer = this.fieldDisplayer({
                        settings: auxArray[i].get('settings'),
                        values: auxArray[i].get('values'),
                        screen: screenConfig['@screen'],
                        record: info['@rec_index'],
                        key_str: info['@key_str'],
                        getFieldValueAppend: getFieldValueAppend,
                        randomId: this.randomId
                    }, true);
                    //Only show it if it's not hidden
                    //if (!displayer.options.hidden) {
                    displayer = displayer.getHtml();
                    if (changed)
                        auxArray[i].get('values')['@value'] = "X";
                    displayer.removeClassName('fieldDispTotalWidth');
                    displayer.removeClassName('fieldClearBoth');
                    if (displayer.down())
                        displayer.down().removeClassName('fieldDispHalfSize');
                    //displayer.down().addClassName('fieldDispAlignFieldRight');
                    radioRow.insert(displayer);
                    groupsArray[seqnr] = radioRow;
                    //}
                }
                groupDiv.insert(radioRow);
            } .bind(this));
            groupsArrayCom = groupsArray.compact()
            for (var i = 0; i < groupsArrayCom.length; i++) {
                groupDiv.insert(groupsArrayCom[i]);
            }
            ret.set(groupElement.key, [minSeqnr, groupDiv]);
        } .bind(this));
        return ret;
    },

    /**
    * Function called when a radio button from a group of radio buttons is clicked
    * @param {Object} event
    * @param {Object} options
    * @param {Object} option
    * @param {Object} byOption
    * @param {Object} groupElement
    * @param {Object} screenConfig
    */
    radioButtonClicked: function(event, options, option, byOption, groupElement, screenConfig) {
        options.get(groupElement.key).each(function(opt) {
            if (option.key.split('_')[2] == opt.key.split('_')[2]) {
                if (opt.value['@value'] != 'X') {
                    //If we have really changed the radio button:
                    opt.value['@value'] = 'X';
                    objectToArray(byOption.get(groupElement.key)).each(function(optionField) {
                        if (option.key == optionField.key) {
                            optionField.value.compact().each(function(field) {
                                if (field.get('settings')['@fieldformat'] == 'O') {
                                    field.get('values')['@value'] = 'X';
                                }
                            } .bind(this));
                        } else {
                            optionField.value.compact().each(function(field) {
                                if (field.get('settings')['@fieldformat'] == 'O') {
                                    field.get('values')['@value'] = '';
                                    field.get('values')['#text'] = '';
                                }
                            } .bind(this));
                        }
                    } .bind(this));
                    //If there's a paiEvent associated:
                    if (!Object.isEmpty(opt.value['@service_pai'])) {
                        var obj = {
                            appId: this.appId,
                            screen: screenConfig['@screen'],
                            record: "",
                            servicePai: opt.value['@service_pai'],
                            currentValue: "X",
                            fieldId: opt.value['@fieldid']
                        };
                        document.fire('EWS:getContentModule_paiEvent_' + this.appId + this.name + this.randomId, obj);
                    }
                }
            } else {
                opt.value['@value'] = '';
            }
        } .bind(this));
    },

    /**
    * @param group {Object} The fields that the group has
    * @param screenConfig {Object} 
    * @param info {Object}
    * @param radioGroups {Object} Radio groups to be displayed. Only used for viewMore
    * @param groupedGroups {Object} Groups to be displayed. Only used for viewMore
    *        as it calls recursively getGroupHtml
    */
    getGroupHtml: function(group, screenConfig, info, radioGroups, groupedGroups) {
        var ret = $H();
        var groups = $H();
        var aux = [];
        var auxRet = $H();
        objectToArray(group.value.settings).each(function(field) {
            if (!groups.get(field['@display_group'])) {
                groups.set(field['@display_group'], $H());
            }
            objectToArray(group.value.values).each(function(fieldValue) {
                if (fieldValue['@fieldid'] == field['@fieldid']) {
                    groups.get(field['@display_group']).set(field['@fieldid'], $H({
                        settings: field,
                        values: fieldValue
                    }));
                    return;
                }
            } .bind(this));
        } .bind(this));
        //If we are in viewDetails, but without normal fields, only groups, then we need to
        //create a dummy group in order to insert the radio buttons and the groups in it
        if (groups.keys().length == 0 &&
            ((!Object.isEmpty(radioGroups) && radioGroups.values.length != 0) ||
            (!Object.isEmpty(groupedGroups) && groupedGroups.values.length != 0))) {
            groups.set("group", $H());
        }
        groups.each(function(groupElement) {
            var label = !Object.isEmpty(this.labels.get(groupElement.key)) ? this.labels.get(groupElement.key) : '';
            var groupDiv = new Element('div', {
                'class': 'fieldDispFloatLeft fieldDispTotalWidth fieldDispTotalHeight fieldPanel_displayGroupDiv'
            }).insert("<span class='fieldPanelAlignTitleGroupDiv fieldDispFloatLeft application_text_bolder'>" + label + "</span>");
            aux.clear();
            //variable to store the lowest sequence number of the fields of the group
            //it is used for the ordering of the groups
            var groupIndex = Number.MAX_VALUE;
            groupElement.value.each(function(field) {
                //We do not create the fieldDisplayer if it is a radio button inside a group, as those are created later
                if (!field.value.get('settings')['@fieldid'].startsWith('OPT_') || Object.isEmpty(field.value.get('settings')['@display_group'])) {
                    if (!ret.get(groupElement.key) || (groupElement.key, parseInt(field.value.get('settings')['@seqnr'], 10) < ret.get(groupElement.key)))
                        ret.set(groupElement.key, parseInt(field.value.get('settings')['@seqnr'], 10));
                    var getFieldValueAppend = this.getXMLToAppendForField(field.value.get('settings')['@fieldid']);
                    var displayer = this.fieldDisplayer({
                        settings: field.value.get('settings'),
                        values: field.value.get('values'),
                        screen: screenConfig['@screen'],
                        record: info['@rec_index'],
                        key_str: info['@key_str'],
                        getFieldValueAppend: getFieldValueAppend,
                        randomId: this.randomId
                    }, true);
                    //if (!displayer.options.hidden) {
                    displayer = displayer.getHtml();
                    if (field.value.get('settings')['@depend_type'] == 'X' || field.value.get('settings')['@depend_type'] == 'V') {
                        this.groupVisualDependencies.set(field.value.get('settings')['@depend_field'], displayer);
                        var index = parseInt(field.value.get('settings')['@seqnr'], 10);
                        if (index < groupIndex)
                            groupIndex = index;
                        aux[index] = displayer;
                    } else {
                        var index = parseInt(field.value.get('settings')['@seqnr'], 10);
                        if (this.visualDependencyCat.get(field.value.get('settings')['@fieldid'])) {
                            var roundDiv = new Element("div", { "id": "roundDiv_" + field.value.get('settings')['@fieldid'], "class": "fieldDispTotalWidth fieldDispClearBoth fieldDispFloatLeft fieldPanelVisualDep" }).insert(displayer);
                        } else {
                            var roundDiv = new Element("div", { "id": "roundDiv_" + field.value.get('settings')['@fieldid'], "class": "fieldDispTotalWidth fieldDispClearBoth fieldDispFloatLeft" }).insert(displayer);
                        }
                        if (index < groupIndex)
                            groupIndex = index;
                        aux[index] = roundDiv;
                        this.groupNoDependents.set(field.value.get('settings')['@fieldid'], index);
                    }
                    //}
                }
            } .bind(this));
            //switching fieldtechname into fieldid for dependent fields
            this.groupVisualDependencies.each(function(dep) {
                groupElement.value.each(function(field) {
                    if (field.value.get('values')['@fieldtechname'] == dep.key) {
                        this.groupVisualDependencies.unset(dep.key);
                        this.groupVisualDependencies.set(field.value.get('values')['@fieldid'], dep.value);
                    }
                } .bind(this));
            } .bind(this));
            /*this.groupVisualDependencies.each(function(depField) {
            if (aux[this.groupNoDependents.get(depField.key)]) {
            aux[this.groupNoDependents.get(depField.key)].insert(depField.value);
            if (this.mode != 'display') {
            aux[this.groupNoDependents.get(depField.key)].down().removeClassName('fieldDispHalfSize');
            aux[this.groupNoDependents.get(depField.key)].down().addClassName('fieldDispQuarterSize');
            }
            }
            } .bind(this));*/
            //Based on the name of the current group, checking the radioInGroup hash to see if there are
            //radio button groups to be displayed within this group
            if (!Object.isEmpty(this.radioInGroup)) {
                //Checking every radio button group within the hash
                this.radioInGroup.each(function(radioGroup) {
                    var insert = false;
                    //If the radio button group contains a field that has the same display group as this group,
                    //then we should insert it (and delete from the hash to be sure it will not inserted more times)
                    radioGroup.value.settings.each(function(radioField) {
                        if (!groupElement.key.startsWith('RADIO_') && radioField['@display_group'] == groupElement.key)
                            insert = true;
                        //setting the correct sequence number for the group
                        else {
                            if (!ret.get(groupElement.key) || (groupElement.key, parseInt(radioField['@seqnr'], 10) < ret.get(groupElement.key)))
                                ret.set(groupElement.key, parseInt(radioField['@seqnr'], 10));
                        }
                    } .bind(this));
                    //In order to insert the radio button group first we obtain the html
                    if (insert) {
                        var radioGroupFieldHTML = this.getRadioGroupHtml(radioGroup, screenConfig, info);
                        //We insert the radio group html in the html of the group
                        radioGroupFieldHTML.each(function(eachField) {
                            if (eachField.value[0] < groupIndex)
                                groupIndex = eachField.value[0];
                            aux[eachField.value[0]] = new Element("div").insert(eachField.value[1]);
                        } .bind(this));
                        //Deleting the radio button group from the hash
                        this.radioInGroup.unset(radioGroup.key);
                    }
                } .bind(this));
            }
            //Add the html for the radio button group, if there's any:
            if (!Object.isEmpty(radioGroups)) {// <-- Fix to emulate the each behaviour
                $H({ '1': radioGroups }).each(function(hashField) {
                    var viewMoreFieldsHTML = this.getRadioGroupHtml(hashField, screenConfig, info);
                    viewMoreFieldsHTML.each(function(eachField) {
                        //in order to have the smallest seq number for the group
                        if (eachField.value[0] < groupIndex)
                            groupIndex = eachField.value[0];
                        aux[eachField.value[0]] = new Element("div").insert(eachField.value[1]);
                    } .bind(this));
                } .bind(this));
            }
            //Add the html for the grouped fields, if there's any:
            if (!Object.isEmpty(groupedGroups)) {// <-- Fix to emulate the each behaviour
                $H({ '1': groupedGroups }).each(function(hashField) {
                    var viewMoreFieldsHTML = this.getGroupHtml(hashField, screenConfig, info);
                    var viewMoreKeys = viewMoreFieldsHTML.keys();
                    for (var i = 0; i < viewMoreKeys.size(); i++) {
                        //in order to have the smallest seq number for the group
                        if (viewMoreKeys[i] < groupIndex)
                            groupIndex = viewMoreKeys[i];
                        aux[viewMoreKeys[i]] = viewMoreFieldsHTML.get(viewMoreKeys[i])[1];
                    }
                } .bind(this));
            }
            aux.compact();
            for (var i = 0; i < aux.size(); i++) {
                if (aux[i]) {
                    groupDiv.insert(aux[i]);
                }
            }
            this.groupVisualDependencies.each(function(depField) {
                if (!Object.isEmpty(groupDiv.down('[id=roundDiv_' + depField.key + ']'))) {
                    groupDiv.down('[id=roundDiv_' + depField.key + ']').insert(depField.value);
                }
            } .bind(this));
            auxRet.set(groupIndex, [ret.get(groupElement.key), groupDiv]);

        } .bind(this));
        //Reconstructing the hash of groups to put it in the correct order based on the seq numbers of their fields
        var groupKeys = auxRet.keys().sortBy(function(s) { return parseInt(s); });
        var auxRetSorted = $H();
        for (var i = 0; i < groupKeys.length; i++) {
            auxRetSorted.set(groupKeys[i], auxRet.get(groupKeys[i]));
        }
        return auxRetSorted;

    },
    /**
    * @param options {Object} getContentModule initialize() parameters.
    */
    getTcontentHtml: function(tcontent, screenConfig, recordConfig) {
        //Create a hash for the settings of the fields in a tContent
        var settingsArray = objectToArray(tcontent.value.settings);
        var settings = $H();
        for (var i = 0; i < settingsArray.size(); i++) {
            settings.set(settingsArray[i]['@fieldid'], settingsArray[i]);
        }
        var values = (!Object.isEmpty(tcontent.value.values)) ? tcontent.value.values.yglui_str_wid_tcontent : null;
        if (Object.isEmpty(values) && (!this.tcontent_empty.get(screenConfig['@screen']) || this.mode == 'display'))
            return "";
        //Creating the tContent hash element
        if (Object.isEmpty(this.tContent)) {
            this.tContent = $H();
        }
        var rowPAI = this.getRowPai(screenConfig['@screen']);
        var isEditable = this.isTContentEditable(screenConfig['@screen']);
        this.tContent.set(screenConfig['@screen'] + "_" + recordConfig['@rec_index'],
		  {
		      jsonRowContainer: this.getJSONRowContainer(screenConfig, recordConfig['@rec_index']), //tcontent.value.values.yglui_str_wid_tcontent,
		      jsonRows: $H(),
		      simpleTableObject: null,
		      simpleTableData: null,
		      settings: settings,
		      rowPAI: rowPAI
		  }
		);
        var tContentElement = this.tContent.get(screenConfig['@screen'] + "_" + recordConfig['@rec_index']);
        //Changing the mode to display, so the fieldDisplayers are created in display mode
        var mode = this.mode;
        this.mode = 'display';
        //Creating table headers
        var firstSeq = 0;
        tContentElement.simpleTableData = {
            header: [],
            rows: $H()
        };
        var count = 0;
        var auxSettings = $H();

        var settingsKeys = settings.keys();
        for (var i = 0; i < settingsKeys.size(); i++) {
            var field = settings.get(settingsKeys[i]);
            if (count == 0)
                firstSeq = parseInt(field['@seqnr'], 10);
            var label = this.chooseLabel(field['@fieldid'], field['@label_type'], field['@fieldlabel']);
            label = this.addAsterisk(label, field['@display_attrib']);
            //Only add it to the table if it's not hidden
            if (Object.isEmpty(field['@display_attrib']) || field['@display_attrib'] != "HID") {
                tContentElement.simpleTableData.header[parseInt(field['@seqnr'], 10)] = {
                    text: label,
                    id: 'tcontentHeader_' + count
                };
            }
            auxSettings.set(field['@fieldid'], field);
            count++;
        }
        //Adding rows
        if (!Object.isEmpty(values)) {
            objectToArray(values).each(function(row) {
                var rowId = row['@seqnr'];
                var showRow = true;
                if ((!Object.isEmpty(row['@noshow']) && row['@noshow'].toLowerCase() == "x") || Object.isEmpty(row.fields)) {
                    showRow = false;
                }
                //Adding the json row to tContent hash:
                this.tContent.get(screenConfig['@screen'] + "_" + recordConfig['@rec_index']).jsonRows.set(rowId, row);
                //Adding row to table:
                if (showRow) {
                    this.addRowToTContentTable(rowId, row, auxSettings, screenConfig, recordConfig, mode, true);
                }
            } .bind(this));
        }

        //If we are not in display mode and table is editable, we add a header for the column containing edit and delete buttons
        if (mode != 'display' && isEditable) {// not taken into account this.showButtons for tcontent, after latest requirements
            tContentElement.simpleTableData.header.unshift({
                text: "<span id='addButton_" + this.appId + screenConfig['@screen'] + recordConfig['@rec_index'] + "' class='application_action_link'>" + global.getLabel('add') + "</span>",
                id: ['fieldsPanel_tcontentHeader_', this.appId, screenConfig['@screen'], recordConfig['@rec_index']].join(''),
                pointer: true
            });
        }
        //Create simpleTable object
        tContentElement.simpleTableData.header = tContentElement.simpleTableData.header.compact();
        tContentElement.simpleTableObject = new SimpleTable(tContentElement.simpleTableData, { rowsClassName: "tdPaddingSpace" });
        //Adding the table to the hash with all the tables in the getContent 
        this.tables.set(screenConfig['@screen'] + '_' + recordConfig['@rec_index'] + '_' + this.appId, tContentElement.simpleTableObject);
        //Updating the CSS classes we are going to use
        var ele = tContentElement.simpleTableObject.getElement();
        ele.removeClassName('simpleTable_table');
        ele.addClassName('tcontentSimpleTable fieldPanel_whiteSpaceTable');
        var elementDivTable = new Element('div', {
            'class': 'fieldDispFloatLeft fieldPanelSimpleTableDiv fieldClearBoth fieldDispTotalWidth'
        });
        elementDivTable.insert(ele);
        if (mode != 'display' && isEditable)
            ele.down("[id=addButton_" + this.appId + screenConfig['@screen'] + recordConfig['@rec_index'] + "]").observe('click', this.openPopupTContent.bind(this, "create", screenConfig, recordConfig, null, settings, false));
        //Restoring the orginal mode
        this.mode = mode;
        return [firstSeq, elementDivTable];
    },
    /**
    * Returns the service pai for the tContent rows of the screen
    * @param {Object} screen the screen id
    * @return the name of the service pai for the tContent rows of the screen, or null if isn't defined
    */
    getRowPai: function(screen) {
        var settingsForScreens = objectToArray(this.json.EWS.o_field_settings.yglui_str_wid_fs_record);
        for (var i = 0; i < settingsForScreens.size(); i++) {
            if (settingsForScreens[i]['@screen'] == screen) {
                //These are the settings for our screen
                if (!Object.isEmpty(settingsForScreens[i].tcontent_pai) && !Object.isEmpty(settingsForScreens[i].tcontent_pai['@tcontent_pai'])) {
                    return settingsForScreens[i].tcontent_pai['@tcontent_pai'];
                } else {
                    return null;
                }
            }
        }
        return null;
    },
    /**
    * Tells if the tContent for this screen is editable. if the "tcontent_edit" attribute 
    * in tcontent_pai tag is set to "x" or is not set it will be editable. If it's set to "" or any 
    * other value it won't be editable 
    * @param {Object} screen
    */
    isTContentEditable: function(screen) {
        var settingsForScreens = objectToArray(this.json.EWS.o_field_settings.yglui_str_wid_fs_record);
        for (var i = 0; i < settingsForScreens.size(); i++) {
            if (settingsForScreens[i]['@screen'] == screen) {
                //These are the settings for our screen
                if (!Object.isEmpty(settingsForScreens[i].tcontent_pai) && !Object.isEmpty(settingsForScreens[i].tcontent_pai['@tcontent_edit'])) {
                    if (settingsForScreens[i].tcontent_pai['@tcontent_edit'].toLowerCase() == "x") {
                        return true;
                    }
                    else {
                        return false;
                    }
                } else {
                    return false;
                }
            }
        }
        return false;
    },
    /**
    * Gets the Json node that has the tContent information for a record
    * @param {Object} screenConfig the screen id
    * @param {Object} record the record index
    */
    getJSONRowContainer: function(screenConfig, record) {
        var screen = screenConfig['@screen'];
        if (!Object.isEmpty(this.json.EWS.o_field_values.yglui_str_wid_record)) {

            //We store in ourScreen the json part of our screen, taking into acount that if there's only one, the structure is different
            if (Object.isArray(this.json.EWS.o_field_values.yglui_str_wid_record)) {
                var screens = objectToArray(this.json.EWS.o_field_values.yglui_str_wid_record);
                for (var i = 0; i < screens.size(); i++) {
                    if (screens[i]['@screen'] == screen) {
                        ourScreenNumber = i;
                        var ourScreen = this.json.EWS.o_field_values.yglui_str_wid_record[ourScreenNumber];
                        //See if there is a record inside our screen that has the rec_index:
                        var records = objectToArray(ourScreen.contents.yglui_str_wid_content);
                        var found = false;
                        for (var j = 0; j < records.size(); j++) {
                            if (records[j]['@rec_index'] == record) {
                                found = true;
                                break;
                            }
                        }
                        //If it has the record, this is our screen
                        if (found)
                            break;
                    }
                }
                var ourScreen = this.json.EWS.o_field_values.yglui_str_wid_record[ourScreenNumber];
            } else {
                var ourScreen = this.json.EWS.o_field_values.yglui_str_wid_record;
            }
            //We store in ourRecord the json part of our record, taking into acount that if there's only one, the structure is different
            if (Object.isArray(ourScreen.contents.yglui_str_wid_content)) {
                var records = objectToArray(ourScreen.contents.yglui_str_wid_content);
                for (var i = 0; i < records.size(); i++) {
                    if (records[i]['@rec_index'] == record) {
                        ourRecordNumber = i;
                        break;
                    }
                }
                var ourRecord = ourScreen.contents.yglui_str_wid_content[ourRecordNumber];
            } else {
                var ourRecord = ourScreen.contents.yglui_str_wid_content;
            }
            if (Object.isEmpty(ourRecord.tcontents)) {
                //If it doesn't have tContent yet, add it
                ourRecord.tcontents = { yglui_str_wid_tcontent: $A() };
                //And remove the tag that indicates it's null:
                if (!Object.isEmpty(ourRecord['@tcontents'])) {
                    ourRecord['@tcontents'] = undefined;
                }
            }

            return ourRecord.tcontents.yglui_str_wid_tcontent;
        }
        return null;
    },
    /**
    * Sets the Json node that has the tContent information for a record 
    * @param {Object} screen
    * @param {Object} record
    * @param {Object} content
    */
    setJSONRowContainer: function(screenConfig, record, content) {
        var screen = screenConfig['@screen'];
        if (!Object.isEmpty(this.json.EWS.o_field_values.yglui_str_wid_record)) {
            //We're not in list mode
            //We store in ourScreen the json part of our screen, taking into acount that if there's only one, the structure is different
            if (Object.isArray(this.json.EWS.o_field_values.yglui_str_wid_record)) {
                var screens = objectToArray(this.json.EWS.o_field_values.yglui_str_wid_record);
                for (var i = 0; i < screens.size(); i++) {
                    if (screens[i]['@screen'] == screen) {
                        ourScreenNumber = i;
                        var ourScreen = this.json.EWS.o_field_values.yglui_str_wid_record[ourScreenNumber];
                        //See if there is a record inside our screen that has the rec_index:
                        var records = objectToArray(ourScreen.contents.yglui_str_wid_content);
                        var found = false;
                        for (var j = 0; j < records.size(); j++) {
                            if (records[j]['@rec_index'] == record) {
                                found = true;
                                break;
                            }
                        }
                        //If it has the record, this is our screen
                        if (found)
                            break;
                    }
                }
                var ourScreen = this.json.EWS.o_field_values.yglui_str_wid_record[ourScreenNumber];
            } else {
                var ourScreen = this.json.EWS.o_field_values.yglui_str_wid_record;
            }

            //We store in ourRecord the json part of our record, taking into acount that if there's only one, the structure is different 
            if (Object.isArray(ourScreen.contents.yglui_str_wid_content)) {
                var records = objectToArray(ourScreen.contents.yglui_str_wid_content);
                for (var i = 0; i < records.size(); i++) {
                    if (records[i]['@rec_index'] == record) {
                        ourRecordNumber = i;
                        break;
                    }
                }
                var ourRecord = ourScreen.contents.yglui_str_wid_content[ourRecordNumber];
            } else {
                var ourRecord = ourScreen.contents.yglui_str_wid_content;
            }
            if (Object.isEmpty(ourRecord.tcontents)) {
                //If it doesn't have tContent yet, add it
                ourRecord.tcontents = { yglui_str_wid_tcontent: $A() };
                //And remove the tag that indicates it's null:
                if (!Object.isEmpty(ourRecord['@tcontents'])) {
                    ourRecord['@tcontents'] = undefined;
                }
            }
            ourRecord.tcontents.yglui_str_wid_tcontent = content;
            this.tContent.get(screenConfig['@screen'] + "_" + record).jsonRowContainer = content;
        }
    },
    /**
    * Opens a popup to add, edit or confirm the deletion of a row of a tContent.
    * @param {Object} mode “create”, “edit” or “delete”.
    * @param {Object} screenConfig the config for the screen.
    * @param {Object} recordConfig the config for the record.
    * @param {Object} rowId the rowId if we are in edit or delete mode, so we can identify the row.
    * @param {Object} settings the settings for the fields in tContent.
    * @param {Object} updating true if we are just updating the popup after a paiEvent. This way we won't overwrite the originalValues that we have stored in case we need them.
    */
    openPopupTContent: function(mode, screenConfig, recordConfig, rowId, settings, updating) {
        this.originalMode = mode;
        if (Object.isEmpty(updating) || updating != true) {
            updating = false;
        }
        //If we are in create mode we’ll add a new row to the JSON, using addRowToJson function that will return the rowId for the new row.
        if (mode == "create" && !updating) {
            rowId = this.addRowToJson(screenConfig, recordConfig);
        }
        //We change the mode to create the fieldDisplayers (will restore it later)
        var modeBackup = this.mode;
        switch (mode) {
            case "delete":
                this.mode = "display"; break;
            case "create":
                if (updating) {
                    //We will create the fields as edit mode, because we have to get the values,
                    //not the default values for them, since it's after a PAI
                    this.mode = "edit";
                } else {
                    this.mode = "create";
                }
                break;
            case "edit":
                this.mode = "edit"; break;
            default: break;
        }
        var contentHTML = new Element('div');
        this.loadingMessageTContent = new Element("div", { "class": "getContent_tContentLoading" }).insert(global.getLabel("loading") + "...");
        this.loadingMessageTContent.hide();
        contentHTML.insert(this.loadingMessageTContent);
        var buttonsJson = {
            elements: [],
            mainClass: 'getContent_tContentButtonsContainer'
        };
        this.tContentSaveButtonId = 'getContent_saveButtonPopUp';
        this.tContentCancelButtonId = 'getContent_cancelButtonPopUp';

        //Cancel button
        var optionsCancelButton = {
            idButton: this.tContentCancelButtonId,
            label: global.getLabel('cancel'),
            handlerContext: null,
            className: 'getContent_tContentButton',
            handler: this.discardChangesTContentRow.bind(this, this.originalMode, rowId, screenConfig, recordConfig, settings),
            type: 'button',
            standardButton: true
        };
        buttonsJson.elements.push(optionsCancelButton);
        //Save button
        var labelForSaveButton = global.getLabel('save');
        if (mode == "delete") {
            labelForSaveButton = global.getLabel('delete');
        }

        var optionsSaveButton = {
            idButton: this.tContentSaveButtonId,
            label: labelForSaveButton,
            handlerContext: null,
            className: 'getContent_tContentButton',
            handler: this.saveTContentRow.bind(this, this.originalMode, rowId, screenConfig, recordConfig, settings),
            type: 'button',
            standardButton: true
        };
        buttonsJson.elements.push(optionsSaveButton);
        this.tContentButtonDisplayer = new megaButtonDisplayer(buttonsJson);
        var buttons = this.tContentButtonDisplayer.getButtons();
        var values = this.tContent.get(screenConfig['@screen'] + "_" + recordConfig['@rec_index']).jsonRows.get(rowId).fields.yglui_str_wid_field;
        //If we are in edit mode, store the original values, to restore them if we hit cancel
        if (mode == "edit" && !updating) {
            this.tContent.get(screenConfig['@screen'] + "_" + recordConfig['@rec_index']).originalValues = deepCopy(this.tContent.get(screenConfig['@screen'] + "_" + recordConfig['@rec_index']).jsonRows.get(rowId));
        }
        values = objectToArray(values);
        var createdDisplayers = $H();
        var arrayBySeqNr = [];
        for (var i = 0; i < values.length; i++) {
            var getFieldValueAppend = this.getXMLToAppendForField(values[i]['@fieldid']);
            var displayer = this.fieldDisplayer({
                settings: settings.get(values[i]['@fieldid']),
                values: values[i],
                screen: screenConfig['@screen'],
                record: recordConfig['@rec_index'],
                key_str: recordConfig['@key_str'],
                getFieldValueAppend: getFieldValueAppend,
                randomId: this.randomId
            }, true, rowId);
            createdDisplayers.set(values[i]['@fieldid'], displayer);
            //if (!displayer.options.hidden) {
            //Only show it if it's not hidden
            var seqnr = parseInt(settings.get(values[i]['@fieldid'])['@seqnr'], 10);
            arrayBySeqNr[seqnr] = displayer.getHtml();
            //}
        }
        this.setFieldDependencies(createdDisplayers);
        //Insert fields in order
        arrayBySeqNr = arrayBySeqNr.compact();
        /*arrayBySeqNr.each(function(section) {
        var aroundDiv = new Element('div', { 'class': 'getContent_aroundFD' });
        aroundDiv.insert(section);
        contentHTML.insert(section);
        } .bind(this));*/
        for (var i = 0; i < arrayBySeqNr.size(); i++) {
            var aroundDiv = new Element('div', { 'class': 'getContent_aroundFD' });
            aroundDiv.insert(arrayBySeqNr[i]);
            contentHTML.insert(aroundDiv);
        }

        //insert buttons in div
        contentHTML.insert(buttons);

        //Insert div for error:
        this.errorInTContentPopup = new Element("div", { "class": "application_main_error_text" });
        this.errorInTContentPopup.hide();
        contentHTML.insert(this.errorInTContentPopup);
        this.tContentPopUp = new infoPopUp({
            closeButton: $H({
                'textContent': 'Close',
                'callBack': this.discardChangesTContentRow.bind(this, mode, rowId, screenConfig, recordConfig)
            }),
            htmlContent: contentHTML,
            width: 500,
            height: 800
        });
        this.tContentPopUp.create();

        this.mode = modeBackup;
    },

    /**
    * Adds a row to the json and returns the rowId for it.
    * @param {Object} screenConfig the config for the screen.
    * @param {Object} recordConfig the config for the record.
    * @return The rowId for the added row.
    */
    addRowToJson: function(screenConfig, recordConfig) {
        //This is the place where all the other rtows are in the JSON:
        var jsonRowContainer = this.tContent.get(screenConfig['@screen'] + "_" + recordConfig['@rec_index']).jsonRowContainer;
        //Create a new row:
        var rowId = null;
        var emptyObject = null;
        var auxEmpty = null;
        if (this.tcontent_empty.get(screenConfig['@screen'])) {
            emptyObject = {
                fields: deepCopy(this.tcontent_empty.get(screenConfig['@screen'])),
                '@seqnr': 0
            };
            var max = 0;
            if (!Object.isEmpty(jsonRowContainer)) {
                var rows = objectToArray(jsonRowContainer);
                for (var i = 0; i < rows.size(); i++) {
                    if (parseInt(rows[i]['@seqnr'], 10) > max) {
                        max = parseInt(rows[i]['@seqnr'], 10);
                    }
                }
            }
            var next = parseInt(max, 10) + 1;

            var emptyRow = objectToArray(emptyObject.fields.yglui_str_wid_field);
            for (var i = 0; i < emptyRow.size(); i++) {
                emptyRow[i]['@fieldtseqnr'] = next;
            }
            rowId = next.toPaddedString(6, 10);  //Add 0s to fill the seqnr
            emptyObject['@seqnr'] = rowId;

            //Add it to the JSON:			
            //Depending on how many rows there are: 
            if (!Object.isEmpty(jsonRowContainer) && Object.isArray(jsonRowContainer)) {
                //If there are more than one, just add it
                jsonRowContainer.push(emptyObject);
            } else if (!Object.isEmpty(jsonRowContainer)) {
                //If there is only one, convert it to array and add it
                jsonRowContainer = objectToArray(jsonRowContainer);
                jsonRowContainer.push(emptyObject);
            } else {
                //If there aren't any, just add it
                jsonRowContainer = emptyObject;
            }
            this.tContent.get(screenConfig['@screen'] + "_" + recordConfig['@rec_index']).jsonRowContainer = jsonRowContainer;
            this.setJSONRowContainer(screenConfig, recordConfig['@rec_index'], jsonRowContainer);

            //Add to tContent hash:
            this.tContent.get(screenConfig['@screen'] + "_" + recordConfig['@rec_index']).jsonRows.set(rowId, emptyObject);
        }
        return rowId;
    },
    /**
    * Adds a row to the HTML tContent table.
    * @param {Object} rowId the id for the row
    * @param {Object} values the values for the row we want to insert in the table.
    * @param {Object} settings the settings for the fields
    * @param {Object} screen the id or name of the screen.
    * @param {Object} record the id for the record.
    * @param {Object} mode mode used for creating
    * @param {Object} creatingTable true if this is the first creating table.
    */
    addRowToTContentTable: function(rowId, values, settings, screenConfig, recordConfig, mode, creatingTable) {
        if (Object.isEmpty(creatingTable)) {
            creatingTable = false;
        }
        var newColumns = this.getColumnsForTContentRow(values, settings, screenConfig, recordConfig, mode, rowId);

        //If we are adding just one row, add it now to the table      
        if (!creatingTable) {
            var newRow = $H();
            newRow.set("row" + rowId, {
                data: newColumns.compact()
            });
            this.tContent.get(screenConfig['@screen'] + "_" + recordConfig['@rec_index']).simpleTableObject.addRow(newRow);
        } else {
            //If this is the first time creating the whole table, add it tContent.simpleTableData
            var tContent = this.tContent.get(screenConfig['@screen'] + "_" + recordConfig['@rec_index']);
            tContent.simpleTableData.rows.set(['row', values['@seqnr']].join(''), {
                data: []
            });
            tContent.simpleTableData.rows.get(['row', values['@seqnr']].join('')).data = newColumns.compact();
        }
    },


    /**
    * It takes the XML that has the error message and shows it underneath the actual popup.
    * @param {Object} htmlMessage The HTML that will be shown in the error message
    * @param {Object} containerDiv The div where we want to place the error message
    * @return The element for the div that contains the error message, so it can be hided afterwards if we want.
    */
    showErrorInPopup: function(htmlMessage, containerDiv) {
        if (!Object.isEmpty(containerDiv)) {
            containerDiv.insert(htmlMessage);
        } else {
            if (!Object.isEmpty(this.errorInTContentPopup)) {
                this.errorInTContentPopup.update(htmlMessage);
                this.errorInTContentPopup.show();
                //this.errorInTContentPopup.blindUp({ duration: 1.0, delay: 3.0 });
            }
        }
    },

    /**
    * Deletes a row from the json
    * @param {Object} rowId the id for the row
    * @param {Object} screen the id or name of the screen.
    * @param {Object} record the id for the record.
    */
    deleteRowFromJson: function(rowId, screenConfig, recordConfig) {
        //This is the place where all the other rows are in the JSON:
        var jsonRowContainer = this.tContent.get(screenConfig['@screen'] + "_" + recordConfig['@rec_index']).jsonRowContainer;

        var jsonRowContainer = objectToArray(jsonRowContainer);
        for (var i = 0; i < jsonRowContainer.length; i++) {
            if (jsonRowContainer[i]['@seqnr'] == rowId) {
                //jsonRowContainer = jsonRowContainer.without(jsonRowContainer[i]);
                delete jsonRowContainer[i].fields;
                this.tContent.get(screenConfig['@screen'] + "_" + recordConfig['@rec_index']).jsonRows.unset(rowId);
                break;
            }
        }
        //If there is just one left we set it as an object instead of an array
        if (jsonRowContainer.size() == 1) {
            jsonRowContainer = jsonRowContainer[0];
        }
        this.tContent.get(screenConfig['@screen'] + "_" + recordConfig['@rec_index']).jsonRowContainer = jsonRowContainer;
        this.setJSONRowContainer(screenConfig, recordConfig['@rec_index'], jsonRowContainer);
    },
    /**
    * Gets the columns for a tContent row
    * @param {Object} values
    * @param {Object} settings
    * @param {Object} screenConfig
    * @param {Object} recordConfig
    * @param {Object} mode
    * @param {Object} rowId
    */
    getColumnsForTContentRow: function(values, settings, screenConfig, recordConfig, mode, rowId) {
        if (!Object.isEmpty(values.fields)) {
            var modeBackup = this.mode;
            var isEditable = this.isTContentEditable(screenConfig['@screen']);
            this.mode = "display";
            var newColumns = [];
            //Create fieldDisplayers for each field
            objectToArray(values.fields.yglui_str_wid_field).each(function(field) {
                var getFieldValueAppend = this.getXMLToAppendForField(field['@fieldid']);
                var displayer = this.fieldDisplayer({
                    settings: settings.get(field['@fieldid']),
                    values: field,
                    screen: screenConfig['@screen'],
                    record: recordConfig['@rec_index'],
                    key_str: recordConfig['@key_str'],
                    getFieldValueAppend: getFieldValueAppend,
                    randomId: this.randomId
                }, true, rowId);
                //displayer.getFieldValues();
                var value = displayer.getValue();
                var changed = displayer.updateJSON(value);
                displayer = (Object.isElement(displayer.getHtml()) && (!Object.isEmpty(displayer.getHtml().childElements()[1]))) ? (displayer.getHtml().childElements()[1]).remove() : displayer.getHtml();
                //Only add it to the table if it's not hidden
                if (Object.isEmpty(settings.get(field['@fieldid'])['@display_attrib']) || settings.get(field['@fieldid'])['@display_attrib'] != "HID") {
                    //If we are just adding a row:
                    newColumns[parseInt(settings.get(field['@fieldid'])['@seqnr'], 10)] = {
                        text: displayer,
                        id: 'tcontentField_row_' + values['@seqnr'] + '_' + field['@fieldid']
                    };
                }
            } .bind(this));

            //Create the buttons for each row
            if (mode != 'display' && isEditable) {// not taken into account this.showButtons for tcontent, after latest requirements
                var mainButtonsJson = {
                    elements: []
                };
                var aux = {
                    idButton: 'tContent_deleteButton_' + values['@seqnr'],
                    label: '',
                    handlerContext: null,
                    handler: this.openPopupTContent.bind(this, "delete", screenConfig, recordConfig, rowId, settings, false),
                    className: 'application_currentSelection fieldsPanel_deleteButton',
                    type: 'button'
                };
                var aux1 = {
                    idButton: 'tContent_editButton_' + values['@seqnr'],
                    label: '',
                    handlerContext: null,
                    handler: this.openPopupTContent.bind(this, "edit", screenConfig, recordConfig, rowId, settings, false),
                    className: 'application_editSelection fieldsPanel_deleteButton',
                    type: 'button'
                };
                mainButtonsJson.elements.push(aux);
                mainButtonsJson.elements.push(aux1);
                var button = new megaButtonDisplayer(mainButtonsJson);
                newColumns.unshift({
                    text: button.getButtons(),
                    id: [recordConfig['@rec_index'], '_', screenConfig['@screen'], '_', values['@seqnr'], '_fieldsPanel_tcontentHeader_deleteButton_', this.appId].join('')
                });
            }
            return newColumns;
            this.mode = modeBackup;
        } else {
            return null;
        }
    },


    /**
    * Updates the values in a row of the JSON.
    * @param {Object} rowId the id for the row
    * @param {Object} values the new values for the screen
    * @param {Object} screen the id or name of the screen.
    * @param {Object} record the id for the record.
    */
    updateRowInJson: function(rowId, values, screenConfig, recordConfig) {
        //This is the place where all the other rows are in the JSON:
        var jsonRowContainer = this.tContent.get(screenConfig['@screen'] + "_" + recordConfig['@rec_index']).jsonRowContainer;
        var jsonRowContainer = objectToArray(jsonRowContainer);
        for (var i = 0; i < jsonRowContainer.length; i++) {
            if (jsonRowContainer[i]['@seqnr'] == rowId) {
                jsonRowContainer[i] = values;
                this.tContent.get(screenConfig['@screen'] + "_" + recordConfig['@rec_index']).jsonRows.set(rowId, values);
                break;
            }
        }
        this.tContent.get(screenConfig['@screen'] + "_" + recordConfig['@rec_index']).jsonRowContainer = jsonRowContainer;
        this.setJSONRowContainer(screenConfig, recordConfig['@rec_index'], jsonRowContainer);
    },

    /**
    * Updates a row from the tContent table
    * @param {Object} rowId the id for the row
    * @param {Object} values the new values for the screen
    * @param {Object} screen the id or name of the screen.
    * @param {Object} record the id for the record.
    * @param {Object} settings the settings for the fields
    * @param {Object} mode create, edit or display
    */
    updateRowInTContentTable: function(rowId, values, screenConfig, recordConfig, settings, mode) {
        newColumns = this.getColumnsForTContentRow(values, settings, screenConfig, recordConfig, mode, rowId);
        var newRow = $H();
        newRow.set("row" + rowId, {
            data: newColumns.compact()
        });
        this.tContent.get(screenConfig['@screen'] + "_" + recordConfig['@rec_index']).simpleTableObject.updateRow("row" + rowId, newRow);

    },

    /**
    * Deletes a row from the tContent table
    * @param {Object} rowId  the id for the row.
    * @param {Object} screen the id or name of the screen.
    * @param {Object} record the id for the record.
    */
    deleteRowFromTContentTable: function(rowId, screenConfig, recordConfig) {
        this.tContent.get(screenConfig['@screen'] + "_" + recordConfig['@rec_index']).simpleTableObject.removeRow("row" + rowId);
    },

    /**
    * Fires a PAI event related to a whole row
    * @param {Object} paiName the name of the service we should call.
    * @param {Object} rowId the id for the row.
    * @param {Object} screen the id or name of the screen.
    * @param {Object} record the id for the record.
    */
    firePaiTContent: function(paiName, rowId, screenConfig, recordConfig) {
        var obj = {
            appId: this.appId,
            screen: screenConfig['@screen'],
            record: recordConfig['@rec_index'],
            servicePai: paiName,
            currentValue: "",
            fieldId: ""
        };
        document.fire('EWS:getContentModule_paiEvent_' + this.appId + this.name + this.randomId, obj);
    },

    /**
    * This function will add, update or delete a chosen row calling other functions.
    * It will also call functions to update de HTML table. It’s called when the user clicks on Save or Delete buttons.
    * @param {Object} mode create, edit or display
    * @param {Object} rowId the id for the row.
    * @param {Object} screen the id or name of the screen.
    * @param {Object} record the id for the record.
    * @param {Object} settings the settings for the fields
    */
    saveTContentRow: function(mode, rowId, screenConfig, recordConfig, settings) {
        //Check mandatory fields
        if (!this.checkMandatoryFieldsTContent(screenConfig, recordConfig, rowId, mode)) {
            //Put error messages?
            return;
        }

        //Depending on the mode it will call functions to update, add or delete the row both in html and json.
        if (mode == "create") {
            //The row is already in the JSON, we just have to add it to the table
            var values = this.tContent.get(screenConfig['@screen'] + "_" + recordConfig['@rec_index']).jsonRows.get(rowId);
            this.addRowToTContentTable(rowId, values, settings, screenConfig, recordConfig, mode, false);
        } else if (mode == "edit") {
            //JSON is already updated, we just have to update the tContent table
            var values = this.tContent.get(screenConfig['@screen'] + "_" + recordConfig['@rec_index']).jsonRows.get(rowId);
            this.updateRowInTContentTable(rowId, values, screenConfig, recordConfig, settings, mode);
        } else if (mode == "delete") {
            //If we are deleting: delete it from JSON and table
            this.deleteRowFromJson(rowId, screenConfig, recordConfig);
            this.deleteRowFromTContentTable(rowId, screenConfig, recordConfig);
        }
        //Close the popup and delete the created fieldDisplayers
        this.closeTContentPopUp(mode, rowId, screenConfig, recordConfig);
        //Fire paiEvent associated with the row
        var rowPAI = this.tContent.get(screenConfig['@screen'] + "_" + recordConfig['@rec_index']).rowPAI;
        if (!Object.isEmpty(rowPAI)) {
            this.firePaiTContent(rowPAI, rowId, screenConfig, recordConfig);
        }
    },
    /**
    * This function is called when the cancel button is pressed.
    * It will get the getContent back to the state it was in before opening the popup.
    * @param {Object} mode create, edit or display
    * @param {Object} rowId the id for the row.
    * @param {Object} screen the id or name of the screen.
    * @param {Object} record the id for the record.
    * @param {Object} settings the settings for the fields
    */
    discardChangesTContentRow: function(mode, rowId, screenConfig, recordConfig, settings) {
        //If it’s in “create” mode, it will delete the row from json.
        if (mode == "create") {
            this.deleteRowFromJson(rowId, screenConfig, recordConfig);
        } else if (mode == "edit") {
            //If it’s “edit” mode it will restore the original copy of the json.
            var originalValues = this.tContent.get(screenConfig['@screen'] + "_" + recordConfig['@rec_index']).originalValues;
            this.updateRowInJson(rowId, originalValues, screenConfig, recordConfig);
        } else if (mode == "delete") {
            //If it’s “delete” mode it will do nothing but closing the popup.
        }
        //Close the popup and delete the created fieldDisplayers
        this.closeTContentPopUp(mode, rowId, screenConfig, recordConfig);
    },
    /**
    * Function called when a paiEvent has been fired from a field within tContent
    * @param {Object} args
    */
    paiHandlerTContent: function(args) {
        //Create the PAI xmlIn 
        var arguments = getArgs(args);
        var servicePai = arguments.servicePai;
        var requestIdToSend = "";
        if (!Object.isEmpty(this.requestId)) {
            requestIdToSend = this.requestId;
        }
        var objectId = this.objectId;
        if (Object.isEmpty(objectId)) {
            objectId = "";
        }
        var settings = this.json.EWS.o_field_settings;
        var values = this.json.EWS.o_field_values;
        var jsonToSend = {
            EWS: {
                SERVICE: servicePai,
                OBJECT: {
                    TYPE: 'P',
                    TEXT: objectId
                },
                PARAM: {
                    o_field_settings: settings,
                    o_field_values: values,
                    req_id: requestIdToSend
                }
            }
        };
        var json2xml = new XML.ObjTree();
        var screens = objectToArray(jsonToSend.EWS.PARAM.o_field_values.yglui_str_wid_record);
        for (var i = 0; i < screens.length; i++) {
            if (screens[i].contents.yglui_str_wid_content.fields) {
                var fields = objectToArray(screens[i].contents.yglui_str_wid_content.fields.yglui_str_wid_field);
                for (var a = 0; a < fields.length; a++) {
                    if (!Object.isEmpty(fields[a]['#text']))
                        fields[a]['#text'] = unescape(fields[a]['#text']);
                }
            } else {
                var records = objectToArray(screens[i].contents.yglui_str_wid_content);
                for (var b = 0; b < records.length; b++) {
                    var fields = objectToArray(records[b].fields.yglui_str_wid_field);
                    for (var a = 0; a < fields.length; a++) {
                        if (!Object.isEmpty(fields[a]['#text']))
                            fields[a]['#text'] = unescape(fields[a]['#text']);
                    }
                }
            }
        }
        json2xml.attr_prefix = '@';
        this.showLoadingMessageTContent();
        this.makeAJAXrequest($H({
            xml: json2xml.writeXML(jsonToSend),
            successMethod: this.paiSuccessTContent.bind(this, this.originalMode, arguments.screen, arguments.record, arguments.rowSeqnr)
        }));
    },
    /**
    * Method called when the PAI service
    * @param {Object} $super
    */
    _failureMethod: function($super) {
        $super();
        this.hideLoadingMessageTContent();
        //Disable save button:
        this.tContentButtonDisplayer.disable(this.tContentSaveButtonId);

    },
    /**
    * Gets all the info about one screen
    * @param {Object} screen The screen number
    */
    getScreenInfo: function(screen) {
        if (!Object.isEmpty(this.json.EWS.o_widget_screens.yglui_str_wid_screen)) {
            var screensInfo = objectToArray(this.json.EWS.o_widget_screens.yglui_str_wid_screen);
            for (var i = 0; i < screensInfo.size(); i++) {
                if (screensInfo[i]['@screen'] == screen) {
                    return screensInfo[i];
                }
            }
            return null;
        } else {
            return null;
        }
    },
    /**
    * Function called when a paiEvent associated with a field inside tContent is successful
    * @param {Object} mode the mode
    * @param {Object} screen the screen number
    * @param {Object} record the record index
    * @param {Object} rowId the id for the row
    * @param {Object} json th json received after the pai call
    */
    paiSuccessTContent: function(mode, screen, record, rowId, json) {
        //Locate the values for this tContent row
        var updated = false;
        screenConfig = this.getScreenInfo(screen);
        var recordConfig = {};
        recordConfig['@rec_index'] = record;


        if (Object.isArray(json.EWS.o_field_values.yglui_str_wid_record)) {
            var screens = objectToArray(json.EWS.o_field_values.yglui_str_wid_record);
            for (var i = 0; i < screens.size(); i++) {
                if (screens[i]['@screen'] == screen) {
                    ourScreenNumber = i;
                    var receivedScreen = json.EWS.o_field_values.yglui_str_wid_record[ourScreenNumber];
                    //See if there is a record inside our screen that has the rec_index:
                    var records = objectToArray(receivedScreen.contents.yglui_str_wid_content);
                    var found = false;
                    for (var j = 0; j < records.size(); j++) {
                        if (records[j]['@rec_index'] == record) {
                            found = true;
                            break;
                        }
                    }
                    //If it has the record, this is our screen
                    if (found)
                        break;
                }
            }
            var receivedScreen = json.EWS.o_field_values.yglui_str_wid_record[ourScreenNumber];
        } else {
            var receivedScreen = json.EWS.o_field_values.yglui_str_wid_record;
        }
        //Look for the received row that has the same rowId, store it in receivedRow

        //We store in ourRecord the json part of our record, taking into acount that if there's only one, the structure is different
        if (Object.isArray(receivedScreen.contents.yglui_str_wid_content)) {
            var records = objectToArray(receivedScreen.contents.yglui_str_wid_content);
            for (var i = 0; i < records.size(); i++) {
                if (records[i]['@rec_index'] == record) {
                    ourRecordNumber = i;
                    break;
                }
            }
            var receivedRecord = receivedScreen.contents.yglui_str_wid_content[ourRecordNumber];
        } else {
            var receivedRecord = receivedScreen.contents.yglui_str_wid_content;
        }
        //Search for the row in received record
        var rows = objectToArray(receivedRecord.tcontents.yglui_str_wid_tcontent);
        for (var i = 0; i < rows.size(); i++) {
            if (rows[i]['@seqnr'] == rowId) {
                var receivedRow = rows[i];
                break;
            }
        }
        //Update our row using it:
        //First the rows
        this.tContent.get(screenConfig['@screen'] + "_" + recordConfig['@rec_index']).jsonRows.set(rowId, receivedRow);
        //Then the jsonRowContainer:
        this.setJSONRowContainer(screenConfig, recordConfig['@rec_index'], receivedRecord.tcontents.yglui_str_wid_tcontent);
        //We close the popup and open it again with the new values
        var settings = this.tContent.get(screenConfig['@screen'] + "_" + recordConfig['@rec_index']).settings;
        this.closeTContentPopUp(mode, rowId, screenConfig, recordConfig);
        this.openPopupTContent(mode, screenConfig, recordConfig, rowId, settings, true);
        //If we receive a warning, we show it.
        if (json.EWS && json.EWS.messages && json.EWS.messages.item && json.EWS.messages.item['@msgty'] == 'W') {
            var errorText = json.EWS.messages.item['#text'];
            this.warningMethodTContent(errorText);
        }
    },
    warningMethodTContent: function(errorText) {
        if (Object.isEmpty($("idDivInfoPopUpContainer").down('[id=idModuleInfoPopUp_container]').down('[id=moduleInfoPopUp_content]').down('[id=idModuleInfoPopUp_textMessagePart]').down('[id=popUpErrorDiv]'))) {
            var errorDiv = new Element('div', { 'id': 'popUpErrorDiv', 'class': 'fieldError genCat_balloon_span FWK_errorMessages' });
            this.buttonsJson = {
                elements: [],
                defaultButtonClassName: 'genCat_balloon_span'
            };
            var aux = {
                idButton: 'showHideError',
                label: global.getLabel('hideAllMessages'),
                className: 'getContentLinks fieldDispClearBoth application_action_link',
                type: 'link',
                handlerContext: null,
                handler: this.showHideButtons.bind(this, errorDiv)
            };
            this.buttonsJson.elements.push(aux);
            this.showHidebuttons = new megaButtonDisplayer(this.buttonsJson);
            $("idDivInfoPopUpContainer").down('[id=idModuleInfoPopUp_container]').down('[id=moduleInfoPopUp_content]').down('[id=idModuleInfoPopUp_textMessagePart]').insert(this.showHidebuttons.getButtons());
            $("idDivInfoPopUpContainer").down('[id=idModuleInfoPopUp_container]').down('[id=moduleInfoPopUp_content]').down('[id=idModuleInfoPopUp_textMessagePart]').insert(errorDiv);
        }
        else {
            var errorDiv = $("idDivInfoPopUpContainer").down('[id=idModuleInfoPopUp_container]').down('[id=moduleInfoPopUp_content]').down('[id=idModuleInfoPopUp_textMessagePart]').down('[id=popUpErrorDiv]');
        }
        errorDiv.insert("<div class ='fieldWarning'>" + errorText + "</div>");
    },
    /**
    * Function called when a paiEvent associated with a field inside tContent is not successful
    * @param {Object} mode the mode
    * @param {Object} screen the screen number
    * @param {Object} record the record index
    * @param {Object} rowId the id for the row
    * @param {Object} json th json received after the pai call
    * @param {Object} motive the motive for the error: "error" or "failure"
    */
    paiErrorTContent: function(mode, screen, record, rowId, json) {
        this.hideLoadingMessageTContent();
        //Disable save button:
        this.tContentButtonDisplayer.disable(this.tContentSaveButtonId);
        //Calling the origin methods to handle that
        if (!Object.isEmpty(motive)) {
            if (motive == "error") {
                this._errorMethod(json);
            } else if (motive == "failure") {
                this._failureMethod(json);
            }
        } else {
            var text = json.EWS.webmessage_text;
            this.showErrorInPopup(text);
        }
    },
    /**
    * Closes the popup and deletes the created fieldDisplayers for it
    * @param {Object} mode
    * @param {Object} rowId
    * @param {Object} screenConfig
    * @param {Object} recordConfig
    */
    closeTContentPopUp: function(mode, rowId, screenConfig, recordConfig) {
        //Delete created fieldDisplayers. When deleting a field displayer remember to update their dependency info
        if (mode != "display" && mode != "delete") {
            var keyForRecord = this.appId + mode + screenConfig['@screen'] + recordConfig['@rec_index'];
            var fieldsForRecord = this.fieldDisplayers.get(keyForRecord);
            if (!Object.isEmpty(fieldsForRecord)) {
                var settings = this.tContent.get(screenConfig['@screen'] + "_" + recordConfig['@rec_index']).settings;
                var settingsKeys = settings.keys();
                for (var i = 0; i < settingsKeys.size(); i++) {
                    var fieldKey = settings.get(settingsKeys[i])['@fieldid'] + "_trow_" + rowId;
                    var fieldToDelete = fieldsForRecord.get(fieldKey);
                    if (!Object.isEmpty(fieldToDelete)) {
                        fieldToDelete.destroy(fieldToDelete);
                        fieldsForRecord.unset(fieldKey);
                    }
                }
            }
        }
        //Close the popup:
        this.tContentPopUp.close();
        delete this.tContentPopUp;
    },
    /**
    * Checks the fields that are mandatory in a tContent poup
    * @param {Object} screenConfig
    * @param {Object} recordConfig
    * @param {Object} rowId
    * @param {Object} mode
    */
    checkMandatoryFieldsTContent: function(screenConfig, recordConfig, rowId, mode) {
        if (mode == "delete" || mode == "display") {
            return true;
        }
        var keyForRecord = this.appId + mode + screenConfig['@screen'] + recordConfig['@rec_index'];
        var fieldsForRecord = this.fieldDisplayers.get(keyForRecord);
        if (Object.isEmpty(fieldsForRecord)) {
            return true;
        }
        var settings = this.tContent.get(screenConfig['@screen'] + "_" + recordConfig['@rec_index']).settings;
        var settingsKeys = settings.keys();
        var allCorrect = true;
        var message = new Element('div', { 'id': 'errorDiv_' + this.appId + screenConfig['@screen'] + recordConfig['@rec_index'] + "row" + rowId });
        for (var i = 0; i < settingsKeys.size(); i++) {
            var fieldKey = settings.get(settingsKeys[i])['@fieldid'] + "_trow_" + rowId;
            var fieldtoCheck = fieldsForRecord.get(fieldKey);
            if (!Object.isEmpty(fieldtoCheck) && fieldtoCheck.isValid) {//the method exists
                if (fieldtoCheck && fieldtoCheck.options) {
                    //Adding try catch because the method setInvalid sometimes fails
                    try {
                        if (!fieldtoCheck.isValid()) {// if invalid
                            var label = !Object.isEmpty(fieldtoCheck.options.label) ? fieldtoCheck.options.label : fieldtoCheck.key;
                            message.insert(new Element("p").insert(label + ': ' + global.getLabel('fieldError')));
                            fieldtoCheck.setInvalid();
                            allCorrect = false;
                        }
                    } catch (e) { }
                }
            }
        }
        if (!allCorrect) {
            this.showErrorInPopup(message);
        }
        return allCorrect;
    },
    showLoadingMessageTContent: function() {
        if (!Object.isEmpty(this.loadingMessageTContent)) {
            this.loadingMessageTContent.show();
        }
    },
    hideLoadingMessageTContent: function() {
        if (!Object.isEmpty(this.loadingMessageTContent)) {
            this.loadingMessageTContent.hide();
        }
    },
    //***************************************************************
    //FIELDDISPLAYER LAYER
    //***************************************************************
    /**
    * Creates a fieldDisplayer, stores it in fieldDisplayers hash, and returns its HTML
    * @param {Object} fieldInfo Settings of the field to create:
    * 						- settings: the settings coming from JSON
    * 						- values: the values coming from JSON
    * 						- screen: the screen that contains the field
    * 						- record: the record that contains the field
    * 						- key_str
    * 						- getFieldValueAppend: XML to append when creating the XML to get field values
    * @param returnObject: boolean (optional), if set to true, the fieldDisplayer Object is returned instead of the HTML 
    */
    fieldDisplayer: function(fieldInfo, returnObject, rowSeqnr, mode) {
        if (mode)
            var dispMode = mode;
        else
            var dispMode = this.mode;
        if (Object.isEmpty(rowSeqnr)) {
            rowSeqnr = null;
        }
        var f = $FD(
			{ settings: fieldInfo.settings,
			    values: fieldInfo.values
			},
			fieldInfo.screen,
			fieldInfo.record,
			fieldInfo.key_str,
			this.appId,
			dispMode,
			this.labels,
			this.fieldDisplayerModified,
			this.cssClasses,
			this.predefinedXmls,
			this.linkTypeHandlers,
			this.name,
			fieldInfo.getFieldValueAppend,
			fieldInfo.randomId,
			rowSeqnr,
			this.variant,
			this
		);
        var fieldContainerId = this.appId + dispMode + fieldInfo.screen + fieldInfo.record;
        //Should store every t_row field, now we are just overwriting the same everytime.
        //Moreover, we won't be able to use dependant fields with this code
        var fieldId = fieldInfo.settings['@fieldid']
        if (f._isTContent(f.options)) {
            fieldId += "_trow_" + f.options.rowSeqnr;
        }
        if (Object.isEmpty(this.fieldDisplayers.get(fieldContainerId))) {
            this.fieldDisplayers.set(fieldContainerId, $H());
        }
        //Add the field to the fieldDisplayers hash
        if (Object.isEmpty(this.fieldDisplayers.get(fieldContainerId).get(fieldId))) {
            this.fieldDisplayers.get(fieldContainerId).set(fieldId, f);
        }
        if (Object.isEmpty(returnObject) || !returnObject) {
            //We want the HTML
            return f.getHtml();
        } else {
            //We want the object
            return f;
        }
    },
    destroy: function() {
        this.fieldDisplayers.each(function(reg) {
            reg.value.each(function(field) {
                if (!Object.isEmpty(field.value.destroy))
                    field.value.destroy();
                delete field.value;
            } .bind(this));
        } .bind(this));
        document.stopObserving('EWS:getContentModule_paiEvent_' + this.appId + this.name + this.randomId, this.paiHandler);
        document.stopObserving('EWS:getContentModule_tContentPaiEvent_' + this.appId + this.name + this.randomId, this.paiHandlerTContent);
        if (this.element.parentNode) {
            this.element.remove();
        }
        if (!Object.isEmpty(this.editRowPopup)) {
            this.editRowPopup.close();
            delete this.editRowPopup;
        }
        if (!Object.isEmpty(this.fieldDisplayerModified))
            document.stopObserving(this.fieldDisplayerModified, this.screenChangesbinding);
    },
    validateForm: function(screen, record) {
        var state = true;
        var messages = new Element('div');
        var fieldsToCheck = $H();
        var changed = false;
        var firstTranslationRecordKey;
        var firstTranslationRecord;
        var noTranslations = true;
        for (var i = 0; i < this.fieldDisplayers.keys().length; i++) {
            var records = this.fieldDisplayers.get(this.fieldDisplayers.keys()[i]);
            var conti = true;
            if (records.keys().include('TRANSLATION')) {
                noTranslations = false;
                if (Object.isEmpty(firstTranslationRecordKey)) {
                    firstTranslationRecordKey = this.fieldDisplayers.keys()[i];
                    firstTranslationRecord = records;
                }
                for (var j = 0; j < records.keys().length && conti; j++) {
                    var field = records.get(records.keys()[j]);
                    field.setValid();
                    var actualValue = field.getValue();
                    if (Object.isEmpty(actualValue.id))
                        actualValue.id = null;
                    if (Object.isEmpty(actualValue.text))
                        actualValue.text = null;
                    if ((field.options.text != actualValue.text) || (field.options.value != actualValue.id)) {
                        fieldsToCheck.set(this.fieldDisplayers.keys()[i], records);
                        changed = true;
                        conti = false;
                    }
                }
            }
            else {
                fieldsToCheck.set(this.fieldDisplayers.keys()[i], records);
            }
        }
        if (!changed && !noTranslations)
            fieldsToCheck.set(firstTranslationRecordKey, firstTranslationRecord);
        //looping over all fieldDisplayer objects
        /*if (!screen || !record) {
        if (this.currentSelected)
        screen = this.currentSelected.toString();
        record = this.currentRecordIndex ? this.currentRecordIndex.toString() : "0";
        }*/
        fieldsToCheck.each(function(reg) {
            if (reg.key.endsWith(screen + record) || Object.isEmpty(screen) || Object.isEmpty(record)) {
                reg.value.each(function(field) {
                    //To avoid crashing because of any fieldDisplayer type without checkFormat() method
                    try {
                        //calling each fieldDisplayer checkFormat() method
                        if (field.value.isValid) {//the method exists
                            if (field.value && field.value.options && field.value.options.mode != 'display') {
                                var label = !Object.isEmpty(field.value.options.label) ? field.value.options.label : field.key;
                                var message = new Element('div', { 'id': 'errorDiv_' + field.value.options.id + field.value.options.appId + field.value.options.screen + field.value.options.record });
                                if (!Object.isEmpty(field.value.correctDate)) {
                                    message.insert(label + ': ' + global.getLabel('wrongDate'));
                                } else {
                                    message.insert(label + ': ' + global.getLabel('fieldError'));
                                }
                                messages.insert(message); //we insert it even if correct, because we need further dynamic checks
                                message.hide();
                                if (!field.value.isValid()) {// if invalid
                                    message.show();
                                    state = false;
                                    field.value.setInvalid();
                                }
                            }
                        }
                    } catch (e) { }
                } .bind(this));
            }
        } .bind(this));
        this.errorsDiv.update(messages);
        return {
            correctForm: state,
            errorMessage: ''
        };
    },

    /*
    * @method addAsterisk
    * @desc Adds an asterisk to label if mandatory field
    * @param origLabel Original label to be modified
    * @param display Display mode for the attribute
    * @return if the field is mandatory, the original label plus an asterisk, otherwise, the original label
    */

    addAsterisk: function(origLabel, display) {
        var retLabel = origLabel;
        // Mandatory field -> a * should appear in header
        if (!Object.isEmpty(display)) {
            if ((this.mode != 'display') && (display.toLowerCase() == 'man'))
                retLabel += " *";
        }
        return retLabel;
    }
});

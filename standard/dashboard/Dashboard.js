var Dashboard = Class.create(Application, {
    /**
    * @type Array to keep the radiobuttons nodes in the tree to group them
    */
    radioButtons: null,
    /**
    * @type Object the infoPopUp
    */
    objTestInfoPopUp: null,
    /**
    * @type Object the portal of widgets 
    */
    myPortal: null,
    /**
    * @type Boolean the column in which the new widget are going to be added
    */
    flagColumn: null, 
    /**
    * @description initializer function
    * @param {Object} $super Parent object
    */
    initialize: function($super, args) {
        $super(args);
        this.widgetsReadyBinding = this.widgetsReady.bind(this);
        this.flagColumn = true;
    },
    /**
    * @description execution function
    * @param {Object} $super Parent object
    */
    run: function($super, args) {
        $super(args);
        this.createHtml();
        document.observe('DASHBOARD:WIDGETSover', this.widgetsReadyBinding);
        document.observe('EWS:InfoPopUpClose', this.infoPopUpClosed.bindAsEventListener(this));
    },

    /**
    * @description create the main divs application: menu and widgets
    */
    createHtml: function() {
        this.virtualHtml.update("");
        var divMenu = new Element('div', { 'id': 'containerMenu', 'class': 'fieldPanel fieldDispFloatRight' });
        var ico = new Element('div', { 'class': 'application_rounded_maximize_blue' });
        ico.setStyle({
            float: 'right',
            margin: '2 5 0 0'
        });

        var AddWidgetSpan = new Element('span', { 'class': 'application_action_link' }).update(global.getLabel('add_kpi'));
        AddWidgetSpan.setStyle({
            float: 'right',
            margin: '0 10 0 0'
        });
        AddWidgetSpan.observe('click', this.getKpiList.bindAsEventListener(this));
        divMenu.insert(AddWidgetSpan);
        divMenu.insert(ico);
        this.virtualHtml.insert(divMenu);
        var div = new Element('div', { 'id': 'containerWidgets', 'class': 'containerWidgetsCss' });
        this.virtualHtml.insert(div);
        this.widgetsStructure = new GetWidgets({
            optionsButton: true,
            eventName: 'DASHBOARD:WIDGETSover',
            service: 'GET_WIDGETS',            
            tabId: global.currentApplication.tabId,
            objectType: global.objectType,
            objectId: global.objectId,
            target: div
        });
    },
    /**
    * @description function raised when the widgets are ready (GET_widgets)    
    */
    widgetsReady: function() {
        //we are going to fill the info on each widget
        var myWidgets = this.widgetsStructure.widgets;

        myWidgets.each(function(widget) {
            var key = widget.key;
            var value = widget.value;
            this.callToFillOver2(key);
        } .bind(this));

        //This is harcoded!! we have to save the new kpis with a service in sap! :)
        this.myPortal = this.widgetsStructure.portalHalf;
    },
    /**
    * @description function which call the service get_kpi to obtain the content of each widget
    * @param {string} wizardId is the appid
    * @param 
    */
    callToFillOver: function(wizardId, widget) {
        var xmlOverview = "<EWS>"
             	                + "<SERVICE>GET_KPI</SERVICE>"
                                + "<PARAM>"
                                    + "<I_APPID>" + wizardId + "</I_APPID>"
                                + "</PARAM>"
                                + "<DEL/>"
                            + "</EWS>";


        this.makeAJAXrequest($H({
            xml: xmlOverview,
            successMethod: this.drawWidget.bind(this, wizardId, widget)
        }));
    },
    /**
    * @description function which call the service get_kpi to obtain the content of each widget
    * @param {string} wizardId is the appid
    */
    callToFillOver2: function(wizardId) {
        var xmlOverview = "<EWS>"
             	            + "<SERVICE>GET_KPI</SERVICE>"
                            + "<PARAM>"
                                + "<I_APPID>" + wizardId + "</I_APPID>"
                            + "</PARAM>"
                            + "<DEL/>"
                        + "</EWS>";


        this.makeAJAXrequest($H({
            xml: xmlOverview,
            successMethod: this.drawWidget2.bind(this, wizardId)
        }));
    },

    drawWidget: function(wizardId, widget, json) {
        var containerActions = new Element('div', { 'id': 'containerAct', 'class': 'contAct' });
        var div = new Element('div', { 'id': 'containerAdHocReporting', 'class': 'containerAdHocReporting' });
        var myIframe = new Element('iframe', { 'src': json.EWS.o_link, 'width': '100%', 'height': '250' });
        div.insert(myIframe);
        containerActions.insert(div);
        //change the content of the widget
        widget.setContent(containerActions);
    },

    drawWidget2: function(wizardId, json) {
        var containerActions = new Element('div', { 'id': 'containerAct', 'class': 'contAct' });
        var div = new Element('div', { 'id': 'containerAdHocReporting', 'class': 'containerAdHocReporting' });
        var myIframe = new Element('iframe', { 'src': json.EWS.o_link, 'width': '100%', 'height': '250' });
        div.insert(myIframe);
        containerActions.insert(div);
        //at last we insert into the widgetStructure
        this.widgetsStructure.widgets.get(wizardId).setContent(containerActions);
    },

    getKpiList: function() {
        //retriving the info for the list of kpis
        var xmlOverview = "<EWS>"
                            + "<SERVICE>GET_KPI_LIST</SERVICE>"
                            + "<DEL/>"
                            + "<PARAM>"
                            + "<I_APPID>" + global.currentApplication.appId + "</I_APPID>"
                            + "</PARAM>"
                          + "</EWS>";

        this.makeAJAXrequest($H({
            xml: xmlOverview,
            successMethod: this.newWidgetPopUp.bind(this)
        }));
    },

    newWidgetPopUp: function(json) {
        this.radioButtons = new Array();
        //create the HTML groupedLayout with the json
        var items = new Array();
        json.EWS.o_kpi_tree.yglui_str_an_kpi_tree.each(function(item, index) {
            //getting the label
            var textLabel = this.labels.get(item['@tag']);
            if (textLabel == item['@tag'] || !textLabel)
                textLabel = global.getLabel(item['@tag']);
            if (item['@is_folder']) {
                var obj = { id: item['@node_id'],
                    groupBy: item['@parent_id'] ? item['@parent_id'] : -1,
                    value: textLabel
                }
                items.push(obj);
            }
            else {
                var node = new Element('div');
                var myRadio = new Element('input', ({ 'type': 'radio', 'name': item['@node_id'], 'id': item['@appid'], 'value': item['@tag'] }));
                myRadio.observe('click', this.checkRadioButtons.bind(this, item['@node_id']));
                //add the radiobutton to my struct needed for grouping all the radiobuttons
                this.radioButtons.push(myRadio);
                node.insert(myRadio).insert("<span>" + textLabel + "</span>");
                var obj = { id: item['@node_id'],
                    groupBy: item['@parent_id'] ? item['@parent_id'] : -1,
                    value: node
                };
                items.push(obj);
            }
        } .bind(this));

        var grouped = { headers: [{ column: global.getLabel("kpi_list")}], elements: items };
        var popupContent = new Element('div', { 'id': 'popupContainer', 'class': 'dashboard_popupContainer' });
        var treeContent = new Element('div', { 'id': 'treeContainer', 'class': 'dashboard_treeContainer' });
        popupContent.insert(treeContent);
        var gr3 = new groupedLayout(grouped, treeContent);
        var html = gr3.buildGroupLayout();

        //Adding Save and Cancel Button
        var saveButtonContent = new Element('div');
        var json = {
            elements: []
        };
        var aux = {
            label: global.getLabel('save'),
            handlerContext: null,
            handler: this.saveKpi.bindAsEventListener(this),
            className: 'Rept_execButton',
            type: 'button',
            idButton: 'saveButton',
            standardButton: true
        };
        json.elements.push(aux);
        var saveButton = new megaButtonDisplayer(json);
        //}
        saveButtonContent.insert(saveButton.getButtons());
        popupContent.insert(saveButtonContent);
        var cancelButtonContent = new Element('div');
        var json = {
            elements: []
        };
        aux = {
            label: global.getLabel('cancel'),
            handlerContext: null,
            handler: this.cancelKpi.bindAsEventListener(this),
            className: 'Rept_execButton',
            type: 'button',
            idButton: 'cancelButton',
            standardButton: true
        };
        json.elements.push(aux);
        var cancelButton = new megaButtonDisplayer(json);
        //}
        cancelButtonContent.insert(cancelButton.getButtons());
        popupContent.insert(cancelButtonContent);

        //create infoPopup
        this.objTestInfoPopUp = new infoPopUp({
            closeButton: $H({
                'callBack': function() {
                    this.objTestInfoPopUp.close();
                    delete this.objTestInfoPopUp;
                } .bind(this)
            }),
            events: $H({ onClose: 'EWS:InfoPopUpClose' }),
            htmlContent: popupContent,
            indicatorIcon: 'void',
            height: 250,
            width: 600
        });

        this.objTestInfoPopUp.create();

    },

    saveKpi: function() {
        var key = 'FAIL';
        var text = '';
        //lets get the key of the widget selected (radiobutton)
        this.radioButtons.each(function(item, index) {
            if (item.checked) {
                key = item.id;
                text = item.value;
            }
        } .bind(this));

        if (!(key == 'FAIL')) {
            //Creation of a new widget
            var auxWidget = null;
            auxWidget = new Widgets.Widget(key, { minimizeButton: true, closeButton: false, optionsButton: false, semitrans: false, events: $H({ onMaximize: 'EWS:myMaximize', onMinimize: 'EWS:myMinimize', onClose: 'EWS:myClose' }) }).setTitle(this.labels.get(text));
            this.callToFillOver(key, auxWidget);
            //Add a new widget to the global structure
            this.widgetsStructure.widgets.set(key, auxWidget);
            this.myPortal.add(auxWidget, this.flagColumn ? 1 : 0);
            this.flagColumn ? this.flagColumn = false : this.flagColumn = true;
        }
        this.objTestInfoPopUp.close();
        delete this.objTestInfoPopUp;
    },

    cancelKpi: function() {
        this.objTestInfoPopUp.close();
        delete this.objTestInfoPopUp;
    },

    checkRadioButtons: function(name) {
        //for each radioButton
        this.radioButtons.each(function(item, index) {
            if (item.name == name) {
                item.checked = true;
            }
            else {
                item.checked = false;
            }
        } .bind(this));
    },

    infoPopUpClosed: function() {
        //alert("Info pop up closed: Refresh widgets but not when was cancel");
    },

    /**
    * @description Closing function
    * @param {Object} $super Parent object
    */
    close: function($super) {
        $super();
        document.stopObserving('DASHBOARD:WIDGETSover', this.widgetsReadyBinding);
        document.stopObserving('EWS:InfoPopUpClose', this.infoPopUpClosed.bindAsEventListener(this));
    }
});
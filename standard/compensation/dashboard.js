var COM_Dashboard = Class.create(PDChange,
{
    initialize: function($super, args) {
        $super(args);
    },

    run: function($super, args) {
        $super(args);
        this.compensationReviewPeriodSelectedBinding = this.onCompensationReviewPeriodSelected.bind(this);
        document.observe('EWS:compensationReviewPeriodSelected', this.compensationReviewPeriodSelectedBinding);
        this.currentPeriod = "";
    },

    close: function($super) {
        $super();
        //document.stopObserving('EWS:compensationReviewPeriodSelected', this.compensationReviewPeriodSelectedBinding);
    },

    /**
    * @description Called when the review period changes
    * @param event - Contains the period selected
    */
    onCompensationReviewPeriodSelected: function(event) {
    		if (this.currentPeriod == "" || event.memo.period != this.currentPeriod) {
            this.currentPeriod = event.memo.period;
				// modified miguelg - 20100604 begin. There is a bug in the FWK. If GET_WIDGETS is called twice too quickly, the
				// widgets content crashes and display several colored table headers instead        
				// Change reloads the widget only when the user clicks to change the review period, but not when first loading    
        //if (this.running) {
        if (event.memo.clicked) {
                this.loadWidgets('onCompensationReviewPeriodSelected');
            }
        // modified miguelg - 20100604 end
        }
    },

    /**
    * @description Parses the widget content service
    * @param xml The XML out
    * @param appId The identificator of the AJAX call
    */
    _parseWidgetContent: function(JSON, data) {

        data = data.split(' ');
        var appId = data[1];

        var widScreen = data[0];
        var selectedPanel = data[2];
        this._selectedScreens = $H();
        if (this._elementsStorage.get(appId + '_' + widScreen))
            this._elementsStorage.unset(appId + '_' + widScreen);
        if (!this._elementsStorage.get(appId + '_' + widScreen)) {
            this._elementsStorage.set(appId + '_' + widScreen, $H({
                fieldPanel: null,
                screenNavigation: null,
                contentContainer: null,
                json: null,
                records: new Array()
            }));
        }
        this._elementsStorage.get(appId + '_' + widScreen).set('json', deepCopy(JSON));
        var listMode = false;
        if (JSON.EWS.o_widget_screens)
            objectToArray(JSON.EWS.o_widget_screens.yglui_str_wid_screen).each(function(item) {
                if ((item['@screen'] == widScreen) && (item['@list_mode'] == 'X')) listMode = true;
            });
        //Creating the fieldsPanel
        var panel;
        if (!listMode) {
            panel = new fieldsPanel({
                appId: appId,
                mode: 'display',
                json: this._elementsStorage.get(appId + '_' + widScreen).get('json'),
                event: 'EWS:woChange_' + this.tabId + '_' + appId,
                noResultsHtml: '<span class="application_main_soft_text">' + global.getLabel('noRecords') + '</span>',
                paiEvent: 'EWS:paiEvent_' + appId + '_' + widScreen,
                validForm: 'EWS:validFormHandler_' + appId + '_' + widScreen
            });
            if (selectedPanel != "" && selectedPanel != "undefined" && selectedPanel != 0)
                panel.goTo(selectedPanel);
        }
        else
            panel = new GenericMultipleRecordsFieldsPanel({
                appId: appId,
                json: this._elementsStorage.get(appId + '_' + widScreen).get('json'),
                event: 'EWS:woChange_' + this.tabId + '_' + appId,
                noResultsHtml: '<span class="application_main_soft_text">' + global.getLabel('noRecords') + '</span>'
            }, this, selectedPanel, widScreen);
        //Creating the widget screens
        var widgetScreens;
        //Going througt all the record and storing them on an array
        if (JSON.EWS.o_field_values) {
            var reg = JSON.EWS.o_field_values.yglui_str_wid_record;
            reg = objectToArray(reg);
            $A(reg).each(function(item) {
                $A(item.contents.yglui_str_wid_content).each(function(record) {
                    this._elementsStorage.get(appId + '_' + widScreen).get('records').push(record);
                } .bind(this));
            } .bind(this));
        }

        //Setting the generated content on the widget
        var widgetContentContainer = new Element('div', {
            'class': 'WO_contentContainer'
        });

        this.hashOfWidgets.get(appId).setContent('');
        if (widgetScreens)
            this.hashOfWidgets.get(appId).getContentElement().insert(widgetScreens);
        var labelArr = panel.getElement().getElementsByTagName('label');
        var arLen = labelArr.length;
        for (var it = 0, len = arLen; it < len; ++it) {
            if (appId == 'COM_INCD' || appId=='10_ORG')
                labelArr[it].style.width = '110px';
            else
            labelArr[it].style.width = '100px';
        }
				// commented miguelg - 20100224 begin : Applied format does not provide expected result
        //if (appId == 'COM_SUMM' || appId == 'COM_ASSN') {
        //    var labelArr = panel.getElement().getElementsByTagName('div');
        //    var arLen = labelArr.length;
        //    for (var it = 0, len = arLen; it < len; ++it) {
        //        labelArr[it].style.width = 'auto';
        //    }
        //}
        // commented miguelg - 20100224 end
        this.hashOfWidgets.get(appId).getContentElement().insert(panel.getElement());

        this._elementsStorage.get(appId + '_' + widScreen).set('contentContainer', this.hashOfWidgets.get(appId).getContentElement());
        //Storing the panel for this widget
        this._elementsStorage.get(appId + '_' + widScreen).set('fieldPanel', panel);
    },

    /**
    * @description Gets the widgets content
    * @param appId The widget ID
    */
    _getWidgetContent: function(appId, widScreen, selectedIndex) {
        if (!widScreen)
            widScreen = '1';
        var xml = '';
        if ("" + this.currentPeriod != "undefined")
        {
	        // Use GET_CONTENT XML for Basic data widget
	        //if (appId == 'COM_ASSN' || appId == 'COM_SUMM' || appId == '10_BASIC' || appId == '10_ORG') {
	        if (appId == 'COM_ASSN' || appId == 'COM_SUMM') {
	            //Forming the XML in
	            xml = "<EWS>"
	            + "<SERVICE>GET_CONTENT</SERVICE>"
	            + "<OBJECT TYPE='P'>" + this.empId + "</OBJECT>"
	            + "<PARAM>"
	            + "<APPID>" + appId + "</APPID>"
	            + "<WID_SCREEN>" + widScreen + "</WID_SCREEN>"
	            + "</PARAM>"
	            + "</EWS>";
	        }
	        else {
	            xml = "<EWS>"
	            + "<SERVICE>GET_CONTENT_B</SERVICE>"
	            + "<OBJECT TYPE='P'>" + this.empId + "</OBJECT>"
	            + "<PARAM>"
	            + "<APPID>" + appId + "</APPID>"
	            + "<WID_SCREEN>" + widScreen + "</WID_SCREEN>" 
	            + "<SUBTYPE>" + this.currentPeriod + "</SUBTYPE>"
	            + "</PARAM>"
	            + "</EWS>";
	        }
	        //Requesting the data
	        this.makeAJAXrequest($H({
	            xml: xml,
	            successMethod: '_parseWidgetContent',
	            ajaxID: widScreen + ' ' + appId + ' ' + (selectedIndex ? selectedIndex : '')
	        }));
      	}
    }
});
﻿var SendDocument = new Class.create(Application,

{
    initialize: function($super, args) {
        $super(args);

        this.coversheetTicketIDClickHandlerBinding = this.coversheetTicketIDClickHandler.bindAsEventListener(this);
        this.addDoc2EmpFileClickHandlerBinding = this.addDoc2EmpFileClickHandler.bindAsEventListener(this);
        this.uploadOptionClickHandlerBinding = this.uploadOptionClickHandler.bindAsEventListener(this);
        this.coversheetOptionClickHandlerBinding = this.coversheetOptionClickHandler.bindAsEventListener(this);
        this.confirmSendDocClickHandlerBinding = this.confirmSendDocClickHandler.bindAsEventListener(this);
        this.removeFromSendListClickHandlerBinding = this.removeFromSendListClickHandler.bindAsEventListener(this);
        this.downloadCoverSheetHandlerBinding = this.downloadCoverSheetClickHandler.bindAsEventListener(this);
        this.gotoSentDocHandlerBinding = this.gotoSentDocHandler.bindAsEventListener(this);
        this.sendDocTypeSelectedHandlerBinding = this.sendDocTypeSelectedHandler.bindAsEventListener(this);
        this.optionHandlerBinding = this.optionHandler.bindAsEventListener(this);

        document.observe('EWS:sendDocTypeSelected', this.sendDocTypeSelectedHandlerBinding);

        this.menuSyncBinding = this.menuSync.bindAsEventListener(this);

    },

    menuSync: function(event) {

        var args = getArgs(event);
        var employeeId = args.employeeId;
        var employeeName = args.name;
        var selected = args.selected;

        if (selected) {

            this.emp = employeeId;
            this.empName = employeeName;

            this.virtualHtml.select('b').first().update(this.empName);
        }


        this.docTypeAutocompleter.clearInput();
        if ($('upload_bottons')) {
            $('upload_bottons').remove();
        }
        $("send_doc_container").update();
        $('upload_doc_radio').checked = false;
        $('send_doc_radio').checked = false;
    },

    optionHandler: function(evt) {

        if (!this.docTypeAutocompleter.getValue() || !this.emp) {
            return;
        }

        if (evt.element().value == 'upload') {
            this.uploadOptionClickHandler();
        } else {
            this.coversheetOptionClickHandler();
        }
    },

    coversheetTicketIDClickHandler: function() {
        alert('coversheetTicketIDClickHandler');
    },

    addDoc2EmpFileClickHandler: function(evt) {
        alert('checked : ' + evt.element().checked);
    },

    uploadOptionClickHandler: function() {

        if ($('upload_bottons')) {
            $('upload_bottons').remove();
        }

        $("send_doc_container").update('<div style="float:left;" id="upload_container"></div>');
        this.uploadModule = new UploadModule('upload_container', global.currentApplication.appId, 'DM_UPLOAD_DOC', true, this.docId.bind(this),
			{
			    I_V_DOC_TYPE: this.docTypeAutocompleter.getValue().idAdded,
			    I_V_PERSNO: this.emp,
			    I_V_APPID: global.currentApplication.appId
			});
		if(!this.virtualHtml.down('div#upload_bottons')){
			this.virtualHtml.insert(
				'<div id="upload_bottons" style="float:left;width=100%;">' +

					'<div class="leftRoundedCorner upload_method" style="float:left;">' +
						'<span class="centerRoundedButton">' + global.getLabel('DML_UPLOAD') + '</span>' +
						'<span class="rightRoundedCorner"></span>' +
					'</div>' +

					'<div class="leftRoundedCorner cancel_method" style="float:left;">' +
						'<span class="centerRoundedButton">' + global.getLabel('DML_CANCEL') + '</span>' +
						'<span class="rightRoundedCorner"></span>' +
					'</div>' +

					'</div>'
				);
			this.uploadMethodBinding = this.uploadMethod.bindAsEventListener(this);
			this.cancelMethodBinding = this.cancelMethod.bindAsEventListener(this);

			this.virtualHtml.select('div.upload_method').first().observe('click', this.uploadMethodBinding);
			this.virtualHtml.select('div.cancel_method').first().observe('click', this.cancelMethodBinding);
		}
        
    },

    docId: function(json) {
        //alert('uploadTest::json : ' + json);
        this.docTypeAutocompleter.clearInput();
        if ($('upload_bottons')) {
            $('upload_bottons').remove();
        }
        //$("send_doc_container").update();
        $('upload_doc_radio').checked = false;
        $('send_doc_radio').checked = false;
        //$("send_doc_container").update(this.uploadModule.notification);
    },

    uploadMethod: function(evt) {

        this.uploadModule.uploadHandler();
    },

    cancelMethod: function(evt) {
        //this.uploadModule.uploadHandler();
        //this.uploadModule.test();
		this.uploadModule.cancel();
        this.docTypeAutocompleter.clearInput();
        if ($('upload_bottons')) {
            $('upload_bottons').remove();
        }
        $("send_doc_container").update();

        $('upload_doc_radio').checked = false;
        $('send_doc_radio').checked = false;




    },

    gotoSentDocHandler: function() {

        global.open($H({
            app: {
                appId: 'ST_DOCH',
                tabId: 'SC_DOCU',
                view: 'SendDocumentHistory'
            }
        }));

    },

    coversheetOptionClickHandler: function() {

        if ($('upload_bottons')) {
            $('upload_bottons').remove();
        }




        var xmlin = ''
        + ' <EWS>'
        + '     <SERVICE>DM_GET_CS_PREV</SERVICE>'
        + '     <PARAM>'
        + '     </PARAM>'
        + ' </EWS>';

        this.makeAJAXrequest($H({ xml: xmlin,
            successMethod: 'buildCoversheet',
            xmlFormat: false
        }));

        //$("send_doc_container").update();

        /*
        $('confirm_send_doc').observe('click', this.confirmSendDocClickHandlerBinding);
        $('goto_sent_doc').observe('click', this.gotoSentDocHandlerBinding);
        $('download_coversheet').observe('click', this.downloadCoverSheetHandlerBinding);
        */
    },

    buildCoversheet: function(json) {

        new CoversheetSD(
		$("send_doc_container"),
		this.docTypeAutocompleter.getValue().textAdded,
		this.docTypeAutocompleter.getValue().idAdded,
		json.EWS.o_v_yygcc,
		json.EWS.o_v_yylcc,
		global.name,
		global.objectId,
		this.empName,
		this.emp,
		false,
		'ticket',
		this
		);
    },

    downloadCoverSheetClickHandler: function() {
        var xmlin = ''
        + '<EWS>'
            + '<SERVICE>DM_GET_COVER</SERVICE>'
            + '<OBJECT TYPE=""/>'
            + '<DEL/><GCC/><LCC/>'
            + '<PARAM>'
                + '<I_V_DOC_TYPE>' + this.docTypeAutocompleter.getValue().idAdded + '</I_V_DOC_TYPE>'
                + '<I_V_REQUESTOR_EE>' + global.objectId + '</I_V_REQUESTOR_EE>'
                + '<I_V_AFFECTED_EE>' + this.emp + '</I_V_AFFECTED_EE>'
                + '<I_V_APPID>' + global.currentApplication.appId + '</I_V_APPID>'
                + '<I_V_TRACK_ID>' + this.docTrackId + '</I_V_TRACK_ID>'
            + '</PARAM>'
        + '</EWS>';

        var url = this.url;
        while (('url' in url.toQueryParams())) {
            url = url.toQueryParams().url;
        }
        url = (Object.isEmpty(Object.values(((url).toQueryParams()))[0])) ? url + '?xml_in=' : url + '&xml_in=';
        $('download_coversheet').href = url + xmlin;
    },

    confirmSendDocClickHandler: function(evt) {

        if (this.docTypeAutocompleter.getValue()) {
            var xmlin = ''
            + ' <EWS>'
            + '     <SERVICE>DM_SEND_DOC</SERVICE>'
            + '     <OBJECT TYPE="P">' + this.emp + '</OBJECT>'
            + '     <DEL/><GCC/><LCC/>'
            + '     <PARAM>'
            + '         <I_V_DOC_TYPE>' + this.docTypeAutocompleter.getValue().idAdded + '</I_V_DOC_TYPE>'
            + '         <I_V_APPID>' + global.currentApplication.appId + '</I_V_APPID>'
            + '         <I_V_APP_FIELD/>'
            + '     </PARAM>'
            + ' </EWS>';

            this.makeAJAXrequest($H({ xml: xmlin,
                successMethod: 'confirmSendDocCallback',
                xmlFormat: false
            }));
        }

    },

    confirmSendDocCallback: function(json) {

        if (json.EWS.o_v_track_id) {
            this.docTrackId = json.EWS.o_v_track_id;
        } else {
            return;
        }
        if ($('confirm_send_doc').previous('span')) {
            $('confirm_send_doc').down().update(global.getLabel('DML_CONFIRM_SEND_DOC'));
            $('confirm_send_doc').previous().remove();
        } else {
            $('confirm_send_doc').down().update(global.getLabel('DML_REMOVE_FROM_SEND_LIST'));
            new Insertion.Before('confirm_send_doc', '<span style="font-weight: bold; color: red;float:left;margin:5px;">' + global.getLabel('DML_DOCUMENT_CONFIRMED_FOR_SENDING_TASK_') + '</span>');
            $('confirm_send_doc').stopObserving('click', this.confirmSendDocClickHandlerBinding);
            $('confirm_send_doc').observe('click', this.removeFromSendListClickHandlerBinding);
        }
    },

    removeFromSendListClickHandler: function(evt) {

        if (this.docTypeAutocompleter.getValue()) {
            var xmlin = ''
            + ' <EWS>'
            + '     <SERVICE>DM_RMV_SEND_DOC</SERVICE>'
            + '     <OBJECT TYPE=""/>'
            + '     <DEL/><GCC/><LCC/>'
            + '     <PARAM>'
            + '         <I_V_TRACK_ID>' + this.docTrackId + '</I_V_TRACK_ID>'
            + '     </PARAM>'
            + ' </EWS>';

            this.makeAJAXrequest($H({ xml: xmlin,
                successMethod: 'removeFromSendListCallback',
                xmlFormat: false
            }));
        }

    },

    removeFromSendListCallback: function(json) {
        if ($('confirm_send_doc').previous('span')) {
            $('confirm_send_doc').down().update(global.getLabel('DML_CONFIRM_SEND_DOC'));
            $('confirm_send_doc').previous().remove();
            $('confirm_send_doc').stopObserving('click', this.removeFromSendListClickHandlerBinding);
            $('confirm_send_doc').observe('click', this.confirmSendDocClickHandlerBinding);
        } else {
            $('confirm_send_doc').down().update(global.getLabel('DML_REMOVE_FROM_SEND_LIST'));
            new Insertion.Before('confirm_send_doc', '<span style="font-weight: bold; color: red;float:left;margin:5px;">' + global.getLabel('DML_DOCUMENT_CONFIRMED_FOR_SENDING_TASK_') + '</span>');
        }
    },

    sendDocTypeSelectedHandler: function(evt) {
        if (evt.memo.idAdded) {
            this.uploadOptionClickHandler();
            if ($('upload_doc_radio')) {
                $('upload_doc_radio').checked = true;
            }
        }
    },

    getDocTypeList: function() {
        var xmlin = ''
        + ' <EWS>'
        + '     <SERVICE>DM_GET_TYPES</SERVICE>'
        + '     <OBJECT TYPE=""/>'
        + '     <DEL/>'
        + '     <GCC/>'
        + '     <LCC/>'
        + ' </EWS>';

        this.makeAJAXrequest($H({ xml: xmlin,
            successMethod: 'buildDocumentsTypeList',
            xmlFormat: false
        }));
    },

    buildDocumentsTypeList: function(json) {
        var jsonObject = {
            autocompleter: {
                object: [],
                multilanguage: {
                    no_results: global.getLabel('DML_NO_RESULTS'),
                    search: global.getLabel('DML_SEARCH')
                }
            }
        }
        if (json.EWS.o_i_doc_type_list) {
            var items = objectToArray(json.EWS.o_i_doc_type_list.yglui_str_ecm_doc_type_list);
            for (var i = 0; i < items.length; i++) {
                jsonObject.autocompleter.object.push({
                    data: items[i]['@doc_type_id'],
                    text: items[i]['@doc_type_name']
                })
            }
        }
        this.docTypeAutocompleter.updateInput(jsonObject);
    },


    buildScreen: function() {
        var html =
		'<div style="width:99%;float:left;text-align:left;margin-bottom:10px">' +
			global.getLabel('DML_CURRENTLY_SELECTED_EMPLOYEE') + ' : <b>' + this.empName + '</b>' +
		'</div>' +

		'<div class="fieldDispFloatLeft">' +
			global.getLabel('DML_DOCUMENT_TYPE') + ' : ' +
		'</div>' +
		'<div id="send_document_autocompleter" style="margin-left:10px;"></div>';



        if (global.dmc == 'Y') {
            html +=
			'<div style="width:99%;float:left;text-align:left;margin-bottom:10px;margin-top:10px">' +
				'<span class="fieldDispFloatLeft">' + global.getLabel('DML_CHOOSE_TO') + ' : </span>' +
				'<input id="upload_doc_radio" type="radio" name="send_doc_radio" value="upload">' + global.getLabel('DML_UPLOAD_ELECTRONICALLY') +
				'<input id="send_doc_radio" type="radio" name="send_doc_radio" value="coversheet">' + global.getLabel('DML_SEND_WITH_COVERSHEET_FOR_SCANNING_PR') +
			'</div>';
        }


        html +=
		'<br/>' +
		'<br/>';
        this.virtualHtml.insert(html);
        this.virtualHtml.insert('<div style="text-align:left;float:left;width:99%;" id="send_doc_container"></div>');

        var json = {
            autocompleter: {
                object: [],
                multilanguage: {
                    no_results: global.getLabel('DML_NO_RESULTS'),
                    search: global.getLabel('DML_SEARCH')
                }
            }
        }
        this.docTypeAutocompleter = new JSONAutocompleter('send_document_autocompleter', {
            showEverythingOnButtonClick: true,
            timeout: 5000,
            templateResult: '#{text}',
            templateOptionsList: '#{text}',
            minChars: 1,

            events: $H({ onResultSelected: 'EWS:sendDocTypeSelected' })
        }, json);

        this.getDocTypeList();


        if (global.dmc == 'Y') {
            this.virtualHtml.select('input[type="radio"]').first().observe('click', this.optionHandlerBinding);
            this.virtualHtml.select('input[type="radio"]').last().observe('click', this.optionHandlerBinding);
        }
    },


    run: function($super, args) {
        $super(args);

        var selectedEmp = global.getSelectedEmployees();
        this.emp = (selectedEmp && selectedEmp[0]) || args.get("emp") || global.objectId;
        var ee = global.getEmployee(this.emp);
        var empName;
        if (ee) {
            empName = ee.name;
        }

        this.empName = empName || args.get("empName") || global.name;

        document.observe("EWS:employeeMenuSync", this.menuSyncBinding);

        if (this.firstRun) {
            this.buildScreen();
        }

    },

    getCurrentTicket: function() {
        return '1001756';
    },

    close: function($super) {
        $super();
        document.stopObserving("EWS:employeeMenuSync", this.menuSyncBinding);
    }

});
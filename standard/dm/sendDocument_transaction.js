var CoversheetSD  = new Class.create(origin,
{
    	
	initialize: function(target,docTypeLabel,docTypeId,gcc,lcc,requestorName,requestorId,
	
	affectedName,affectedId,process,ticket,parentApp){
			
			this.downloadCoversheetHandlerBinding = this.downloadCoversheetHandler.bindAsEventListener(this);
			this.confirmSendHandlerBinding = this.confirmSendHandler.bindAsEventListener(this);
			this.gotoSentDocHandlerBinding = this.gotoSentDocHandler.bindAsEventListener(this);
			this.removeFromSendListHandlerBinding = this.removeFromSendListHandler.bindAsEventListener(this);
			
			
			this.target = $(target);
			this.targetId=this.target.identify();
			
			this.docTypeLabel=docTypeLabel;
			this.docTypeId=docTypeId;
			this.gcc=gcc;
			this.lcc=lcc;
			this.requestorName=requestorName;
			this.requestorId=requestorId;
			this.affectedName=affectedName;
			this.affectedId=affectedId;
			this.process=process;
			this.ticket=ticket;
			this.parentApp=parentApp;
			this.build();
	},
	
	downloadCoversheetHandler:function(evt){
		if(!this.docTrackId)
			return;
			
		var xmlin = ''
        + '<EWS>'
            + '<SERVICE>DM_GET_COVER</SERVICE>'
            + '<OBJECT TYPE=""/>'
            + '<DEL/><GCC/><LCC/>'
            + '<PARAM>'
                + '<I_V_DOC_TYPE>' + this.docTypeId + '</I_V_DOC_TYPE>'
                + '<I_V_REQUESTOR_EE>' + this.requestorId + '</I_V_REQUESTOR_EE>'
                + '<I_V_AFFECTED_EE>' + this.affectedId + '</I_V_AFFECTED_EE>'
                + '<I_V_APPID>' + global.currentApplication.appId + '</I_V_APPID>'
                + '<I_V_TRACK_ID>' + this.docTrackId + '</I_V_TRACK_ID>'
            + '</PARAM>'
        + '</EWS>';

        var url = this.parentApp.url;
        while (('url' in url.toQueryParams())) {
            url = url.toQueryParams().url;
        }
        url = (Object.isEmpty(Object.values(((url).toQueryParams()))[0])) ? url + '?xml_in=' : url + '&xml_in=';
        evt.element().href = url + xmlin;
	},
	
	confirmSendHandler:function(evt){
	


		var xmlin = ''
		+ ' <EWS>'
		+ '     <SERVICE>DM_SEND_DOC</SERVICE>'
		+ '     <OBJECT TYPE="P">' + this.affectedId + '</OBJECT>'
		+ '     <DEL/><GCC/><LCC/>'
		+ '     <PARAM>'
		+ '         <I_V_DOC_TYPE>' + this.docTypeId + '</I_V_DOC_TYPE>'
		+ '         <I_V_APPID>' + global.currentApplication.appId + '</I_V_APPID>'
		+ '         <I_V_TRANSACTION>transaction</I_V_TRANSACTION>'
		+ '         <I_V_MANDATORY>N</I_V_MANDATORY>'
		+ '         <I_V_APP_FIELD/>'
		+ '     </PARAM>'
		+ ' </EWS>';
		this.method = 'POST';
		this.url=this.parentApp.url;
		this.makeAJAXrequest($H({ xml: xmlin,
            successMethod: 'confirmSendCallback',
            xmlFormat: false
        }));
        
	},
	
	removeFromSendListHandler:function(evt){
		var xmlin = ''
		+ ' <EWS>'
		+ '     <SERVICE>DM_RMV_SEND_DOC</SERVICE>'
		+ '     <OBJECT TYPE=""/>'
		+ '     <DEL/><GCC/><LCC/>'
		+ '     <PARAM>'
		+ '         <I_V_TRACK_ID>' + this.docTrackId + '</I_V_TRACK_ID>'
		+ '     </PARAM>'
		+ ' </EWS>';
		this.method = 'POST';
		this.url=this.parentApp.url;
		this.makeAJAXrequest($H({ xml: xmlin,
			successMethod: 'removeFromSendListCallback',
			xmlFormat: false
		}));
        
	},
	
	removeFromSendListCallback: function(json) {
		var button=this.target.down('div.leftRoundedCorner');		
        if (button.previous('span')) {
            button.down().update(global.getLabel('DML_CONFIRM_SEND_DOC'));
            button.previous().remove();
            button.stopObserving('click', this.removeFromSendListHandlerBinding);
            button.observe('click', this.confirmSendHandlerBinding);
        } else {
            button.down().update(global.getLabel('DML_REMOVE_FROM_SEND_LIST'));
            new Insertion.Before(button, '<span style="font-weight: bold; color: red;float:left;margin:5px;">'+global.getLabel('DML_DOCUMENT_CONFIRMED_FOR_SENDING_TASK_')+'</span>');
        }
		var aLink=this.target.down('a');
		aLink.removeClassName('application_action_link');
		aLink.addClassName('application_main_soft_text');
		aLink.removeAttribute('href');
		this.docTrackId=null;
    },
	
	confirmSendCallback: function(json){
		if (json.EWS.o_v_track_id) {
            this.docTrackId = json.EWS.o_v_track_id;
        } else {
            return;
        }
		
		
		var button=this.target.down('div.leftRoundedCorner');
		if (button.previous('span')) {
			button.down().update(global.getLabel('DML_CONFIRM_SEND_DOC'));
			button.previous().remove();
		} else {
			button.down().update(global.getLabel('DML_REMOVE_FROM_SEND_LIST'));
			new Insertion.Before(button, '<span style="font-weight: bold; color: red;float:left;margin:5px;">'+global.getLabel('DML_DOCUMENT_CONFIRMED_FOR_SENDING_TASK_')+'</span>');
			button.stopObserving('click', this.confirmSendHandlerBinding);
			button.observe('click', this.removeFromSendListHandlerBinding);
		}
		var aLink=this.target.down('a');
		aLink.removeClassName('application_main_soft_text');
		aLink.addClassName('application_action_link');
	},
	
	gotoSentDocHandler:function(evt){
		this.parentApp.gotoSentDocHandler();
	},
	
	
	getAddress:function(){
		
		
		var xmlin = ''
        + ' <EWS>'
        + '     <SERVICE>DM_GET_CS_PREV</SERVICE>'
        + '     <PARAM>'
        + '     </PARAM>'
        + ' </EWS>';
		this.method = 'POST';
		this.url=this.parentApp.url;

        this.makeAJAXrequest($H({ xml: xmlin,
            successMethod: 'buildAddress',
            xmlFormat: false
        }));
	},
	
	buildAddress:function(json){
		this.target.down('span.cs_fax').update(json.EWS.o_w_mail_info['@fax']);
		var contact=
		json.EWS.o_w_mail_info['@contact_name']+'<br/>'+
		json.EWS.o_w_mail_info['@post_code']+'<br/>'+
		json.EWS.o_w_mail_info['@street_line1']+'<br/>'+
		json.EWS.o_w_mail_info['@street_line2']+'<br/>'+
		json.EWS.o_w_mail_info['@city']+', '+json.EWS.o_w_mail_info['@country'];
		this.target.down('span.cs_address').update(contact);
	},
	
	
	build: function(){
		var html='<div style="width:100%;">' +

			'<a style="text-decoration:underline;" class="getContentLinks fieldDispFloatLeft application_main_soft_text" target="_blank">' + global.getLabel('DML_DOWNLOAD_COVERSHEET') + '</a>'+
			
			
			
			'<div class="leftRoundedCorner" style="float:left;">' +
				'<span class="centerRoundedButton">' + global.getLabel('DML_CONFIRM_SEND_DOC') + '</span>' +
				'<span class="rightRoundedCorner"></span>' +
			'</div>' +
			
			
			'<p style="text-align:left;margin-top:10px;float:left;width:99%;">' +
				'('+global.getLabel('DML_REQUIRE_PDF_READER')+' <a class="application_action_link" href="'+global.getLabel('DML_PDF_READER_LINK')+'" target="_blank">'+global.getLabel('DML_PDF_READER_LINK')+'</a>)' +
			'</p>' +

			'<p style="text-align:left;margin-top:10px;float:left;width:99%;">' +
				global.getLabel('DML_NOTE_THAT')+
				'<span class="application_action_link">'+global.getLabel('DML_SENT_DOCUMENT_HISTORY')+'</span>' +
				'" '+global.getLabel('DML_YOU_CAN_VIEW_ALL') +
			'.</p>' +
			
			
			'<span style="text-align:left;margin-top:10px;float:left;width:99%;">' +
				global.getLabel('DML_THE_PDF_COVERSHEET') +
			'</span>' +

			'<span style="text-align:left;margin-top:5px;margin-left:10px;float:left;width:99%;">' +
				'- '+global.getLabel('DML_TYPE_OF_DOCUMENT')+' : <b>'+this.docTypeLabel+'</b>' +
			'</span>' +

			

			'<span style="text-align:left;margin-top:5px;margin-left:10px;float:left;width:99%;">' +
				'- '+global.getLabel('DML_REQUESTOR_INFORMATION')+' : <br/>' +
				'<span style="text-align:left;margin-top:3px;margin-left:20px;float:left;width:99%;">' +
					global.getLabel('DML_EMPLOYEE_ID')+' : <b>'+this.requestorId+'</b>   '+global.getLabel('DML_GCC')+' : <b>'+this.gcc+'</b>   '+global.getLabel('DML_LCC')+' : <b>'+this.lcc+'</b>' +
				'</span>' +
				'<span style="text-align:left;margin-top:3px;margin-left:20px;float:left;width:99%;">' +
					global.getLabel('DML_EMPLOYEE_NAME')+' : <b>'+this.requestorName+'</b>' +
				'</span>' +
			'</span>' +

			'<span style="text-align:left;margin-top:5px;margin-left:10px;float:left;width:99%;">' +
				'- '+global.getLabel('DML_AFFECTED_PERSON_DIFFERENT_FROM_REQUE')+' : <b>';
				
				if(this.requestorId==this.affectedId){
					html+=global.getLabel('DML_NO');
				}else{
					html+=global.getLabel('DML_YES');
				}
				
				html+='</b>';
				
				
				if(this.requestorId!=this.affectedId){
					html+=
					'<span style="text-align:left;margin-top:3px;margin-left:20px;float:left;width:99%;">' +
						global.getLabel('DML_EMPLOYEE_ID')+' : <b>'+this.affectedId+'</b>   '+global.getLabel('DML_GCC')+' : <b>'+this.gcc+'</b>   '+global.getLabel('DML_LCC')+' : <b>'+this.lcc+'</b>' +
					'</span>' +
					'<span style="text-align:left;margin-top:3px;margin-left:20px;float:left;width:99%;">' +
						global.getLabel('DML_EMPLOYEE_NAME')+' : <b>'+this.affectedName+'</b>' +
					'</span>';
				}
				
				
			html+=
			'</span>' +

			'<span style="text-align:left;margin-top:5px;margin-left:10px;float:left;width:99%;">' +
				'- '+global.getLabel('DML_PROCESS_FOR_WHICH_DOCUMENTS_ARE_SENT')+' : <b>';
				if(this.process){
					html+=this.process;
				}else{
					html+=global.getLabel('DML_NONE');
				}
				
				html+='</b>' +
			'</span>' +

			'<span style="text-align:left;margin-top:5px;margin-left:10px;float:left;width:99%;">' +
				'- '+global.getLabel('DML_TICKET_SERVICE_FOR_DOCUMENT_PROCESSI')+' : <b>'+this.ticket+'</b><br/>' +
				
			'</span>' +

			'<span style="text-align:left;margin-top:10px;float:left;width:99%;">' +
				global.getLabel('DML_PLEASE_PRINT_THE_COVERSHEET') +
			'</span>' +

			'<span style="text-align:left;margin-top:5px;margin-left:10px;float:left;width:99%;">' +
				'- '+global.getLabel('DML_IF_YOU_HAVE_A_MAIL_ROOM_IN_YOUR_OFFI') +
			'</span>' +

			'<span style="text-align:left;margin-top:5px;margin-left:10px;float:left;width:99%;">' +
				'- '+global.getLabel('DML_VIA')+' <b>'+global.getLabel('DML_FAX')+'</b> '+global.getLabel('DML_ON_THIS_NUMBER')+' : <span class="cs_fax" style="font-weight:bold;color:red;"></span>' +
			'</span>' +

			'<span style="text-align:left;margin-top:5px;margin-left:10px;float:left;width:40%;">' +
				'<span style="float:left;">- '+global.getLabel('DML_VIA')+' <b>'+global.getLabel('DML_POSTAL_MAIL')+'</b> '+global.getLabel('DML_TO')+' : </span>' +
				'<span class="cs_address" style="font-weight:bold;color:red;float:left;margin-left:5px;">' +
					
				'</span>' +
			'</span>' +

			'<p style="text-align:left;margin-top:10px;float:left;width:99%;">' +
				global.getLabel('DML_USING_A_COVERSHEET_TO_SEND_IN_DOCUME') +
			'</p>' +

		'</div>';
		
		this.target.update(html);
		this.getAddress();
		this.target.select('a').first().observe('click',this.downloadCoversheetHandlerBinding);
		this.target.select('div.leftRoundedCorner').first().observe('click',this.confirmSendHandlerBinding);
		this.target.select('span.application_action_link').first().observe('click',this.gotoSentDocHandlerBinding);
		
	}
});








/***************************************/



var Coversheet  = new Class.create(origin,
{
    	
	initialize: function(target,isMandatory,docTypeLabel,docTypeId,gcc,lcc,requestorName,requestorId,
	
	affectedName,affectedId,process,ticket,docTrackId,parentApp){
			
			this.downloadCoversheetHandlerBinding = this.downloadCoversheetHandler.bindAsEventListener(this);
			this.confirmSendHandlerBinding = this.confirmSendHandler.bindAsEventListener(this);
			this.gotoSentDocHandlerBinding = this.gotoSentDocHandler.bindAsEventListener(this);
			this.removeFromSendListHandlerBinding = this.removeFromSendListHandler.bindAsEventListener(this);
			
			
			this.target = $(target);
			this.targetId=this.target.identify();
			this.isMandatory=isMandatory;
			this.docTypeLabel=docTypeLabel;
			this.docTypeId=docTypeId;
			this.gcc=gcc;
			this.lcc=lcc;
			this.requestorName=requestorName;
			this.requestorId=requestorId;
			this.affectedName=affectedName;
			this.affectedId=affectedId;
			this.process=process;
			this.ticket=ticket;
			this.docTrackId=docTrackId;
			this.parentApp=parentApp;
			this.build();
	},
	
	downloadCoversheetHandler:function(evt){
		if(!this.docTrackId)
			return;
			
		var xmlin = ''
        + '<EWS>'
            + '<SERVICE>DM_GET_COVER</SERVICE>'
            + '<OBJECT TYPE=""/>'
            + '<DEL/><GCC/><LCC/>'
            + '<PARAM>'
                + '<I_V_DOC_TYPE>' + this.docTypeId + '</I_V_DOC_TYPE>'
                + '<I_V_REQUESTOR_EE>' + this.requestorId + '</I_V_REQUESTOR_EE>'
                + '<I_V_AFFECTED_EE>' + this.affectedId + '</I_V_AFFECTED_EE>'
                + '<I_V_APPID>' + global.currentApplication.appId + '</I_V_APPID>'
                + '<I_V_TRACK_ID>' + this.docTrackId + '</I_V_TRACK_ID>'
            + '</PARAM>'
        + '</EWS>';

        var url = this.parentApp.url;
        while (('url' in url.toQueryParams())) {
            url = url.toQueryParams().url;
        }
        url = (Object.isEmpty(Object.values(((url).toQueryParams()))[0])) ? url + '?xml_in=' : url + '&xml_in=';
        evt.element().href = url + xmlin;
	},
	
	confirmSendHandler:function(evt){
		
		var xmlin = ''
		+ ' <EWS>'
		+ '     <SERVICE>DM_SEND_DOC</SERVICE>'
		+ '     <OBJECT TYPE="P">' + this.affectedId + '</OBJECT>'
		+ '     <DEL/><GCC/><LCC/>'
		+ '     <PARAM>'
		+ '         <I_V_DOC_TYPE>' + this.docTypeId + '</I_V_DOC_TYPE>'
		//+ '         <I_V_DOC_TYPE>001</I_V_DOC_TYPE>'
		+ '         <I_V_APPID>' + global.currentApplication.appId + '</I_V_APPID>'
		+ '         <I_V_APP_FIELD/>'
		+ '     </PARAM>'
		+ ' </EWS>';
		this.method = 'POST';
		this.url=this.parentApp.url;
		this.makeAJAXrequest($H({ xml: xmlin,
            successMethod: 'confirmSendCallback',
            xmlFormat: false
        }));
        
	},
	
	removeFromSendListHandler:function(evt){
		var xmlin = ''
		+ ' <EWS>'
		+ '     <SERVICE>DM_RMV_SEND_DOC</SERVICE>'
		+ '     <OBJECT TYPE=""/>'
		+ '     <DEL/><GCC/><LCC/>'
		+ '     <PARAM>'
		+ '         <I_V_TRACK_ID>' + this.docTrackId + '</I_V_TRACK_ID>'
		+ '     </PARAM>'
		+ ' </EWS>';
		this.method = 'POST';
		this.url=this.parentApp.url;
		this.makeAJAXrequest($H({ xml: xmlin,
			successMethod: 'removeFromSendListCallback',
			xmlFormat: false
		}));
        
	},
	
	removeFromSendListCallback: function(json) {
		/*var button=this.target.down('div.leftRoundedCorner');		
        if (button.previous('span')) {
            button.down().update(global.getLabel('DML_CONFIRM_SEND_DOC'));
            button.previous().remove();
            button.stopObserving('click', this.removeFromSendListHandlerBinding);
            button.observe('click', this.confirmSendHandlerBinding);
        } else {
            button.down().update(global.getLabel('DML_REMOVE_FROM_SEND_LIST'));
            new Insertion.Before(button, '<span style="font-weight: bold; color: red;float:left;margin:5px;">'+global.getLabel('DML_DOCUMENT_CONFIRMED_FOR_SENDING_TASK_')+'</span>');
        }
		var aLink=this.target.down('a');
		aLink.removeClassName('application_action_link');
		aLink.addClassName('application_main_soft_text');
		aLink.removeAttribute('href');*/
		this.docTrackId=null;
		this.target.update('<span style="font-weight: bold; color: red;float:left;margin:5px;">'+global.getLabel('DML_DOCUMENT_TRACKING_HAS_BEEN_REMOVED')+'</span>');
    },
	
	confirmSendCallback: function(json){
		if (json.EWS.o_v_track_id) {
            this.docTrackId = json.EWS.o_v_track_id;
        } else {
            return;
        }
		
		
		var button=this.target.down('div.leftRoundedCorner');
		if (button.previous('span')) {
			button.down().update(global.getLabel('DML_CONFIRM_SEND_DOC'));
			button.previous().remove();
		} else {
			button.down().update(global.getLabel('DML_REMOVE_FROM_SEND_LIST'));
			new Insertion.Before(button, '<span style="font-weight: bold; color: red;float:left;margin:5px;">'+global.getLabel('DML_DOCUMENT_CONFIRMED_FOR_SENDING_TASK_')+'</span>');
			button.stopObserving('click', this.confirmSendHandlerBinding);
			button.observe('click', this.removeFromSendListHandlerBinding);
		}
		var aLink=this.target.down('a');
		aLink.removeClassName('application_main_soft_text');
		aLink.addClassName('application_action_link');
	},
	
	gotoSentDocHandler:function(evt){
		this.parentApp.gotoSentDocHandler();
	},
	
	
	getAddress:function(){
		
		
		var xmlin = ''
        + ' <EWS>'
        + '     <SERVICE>DM_GET_CS_PREV</SERVICE>'
        + '     <PARAM>'
        + '     </PARAM>'
        + ' </EWS>';
		this.method = 'POST';
		this.url=this.parentApp.url;

        this.makeAJAXrequest($H({ xml: xmlin,
            successMethod: 'buildAddress',
            xmlFormat: false
        }));
	},
	
	buildAddress:function(json){
		this.target.down('span.cs_fax').update(json.EWS.o_w_mail_info['@fax']);
		var contact=
		json.EWS.o_w_mail_info['@contact_name']+'<br/>'+
		json.EWS.o_w_mail_info['@post_code']+'<br/>'+
		json.EWS.o_w_mail_info['@street_line1']+'<br/>'+
		json.EWS.o_w_mail_info['@street_line2']+'<br/>'+
		json.EWS.o_w_mail_info['@city']+', '+json.EWS.o_w_mail_info['@country'];
		this.target.down('span.cs_address').update(contact);
	},
	
	
	build: function(){
		var html='<div style="width:100%;">' +

			'<a style="text-decoration:underline;" class="getContentLinks fieldDispFloatLeft application_action_link" target="_blank">' + global.getLabel('DML_DOWNLOAD_COVERSHEET') + '</a>'+
			
			'<span style="font-weight: bold; color: red;float:left;margin:5px;">'+
				global.getLabel('DML_DOCUMENT_CONFIRMED_FOR_SENDING_TASK_')+
			'</span>';
			
			if(!this.isMandatory){
				html+=
				'<div class="leftRoundedCorner" style="float:left;">' +
					'<span class="centerRoundedButton">' + global.getLabel('DML_REMOVE_FROM_SEND_LIST') + '</span>' +
					'<span class="rightRoundedCorner"></span>' +
				'</div>';
			}
			
			/*
			'<div class="leftRoundedCorner" style="float:left;">' +
				'<span class="centerRoundedButton">' + global.getLabel('confirm_send_doc') + '</span>' +
				'<span class="rightRoundedCorner"></span>' +
			'</div>' +
			*/
			html+=
			'<p style="text-align:left;margin-top:10px;float:left;width:99%;">' +
				'('+global.getLabel('DML_REQUIRE_PDF_READER')+' <a class="application_action_link" href="'+global.getLabel('DML_PDF_READER_LINK')+'" target="_blank">'+global.getLabel('DML_PDF_READER_LINK')+'</a>)' +
			'</p>' +

			'<p style="text-align:left;margin-top:10px;float:left;width:99%;">' +
				global.getLabel('DML_NOTE_THAT')+
				'<span class="application_action_link">'+global.getLabel('DML_SENT_DOCUMENT_HISTORY')+'</span>' +
				'" '+global.getLabel('DML_YOU_CAN_VIEW_ALL') +
			'.</p>' +
			
			
			'<span style="text-align:left;margin-top:10px;float:left;width:99%;">' +
				global.getLabel('DML_THE_PDF_COVERSHEET') +
			'</span>' +

			'<span style="text-align:left;margin-top:5px;margin-left:10px;float:left;width:99%;">' +
				'- '+global.getLabel('DML_TYPE_OF_DOCUMENT')+' : <b>'+this.docTypeLabel+'</b>' +
			'</span>' +

			

			'<span style="text-align:left;margin-top:5px;margin-left:10px;float:left;width:99%;">' +
				'- '+global.getLabel('DML_REQUESTOR_INFORMATION')+' : <br/>' +
				'<span style="text-align:left;margin-top:3px;margin-left:20px;float:left;width:99%;">' +
					global.getLabel('DML_EMPLOYEE_ID')+' : <b>'+this.requestorId+'</b>   '+global.getLabel('DML_GCC')+' : <b>'+this.gcc+'</b>   '+global.getLabel('DML_LCC')+' : <b>'+this.lcc+'</b>' +
				'</span>' +
				'<span style="text-align:left;margin-top:3px;margin-left:20px;float:left;width:99%;">' +
					global.getLabel('DML_EMPLOYEE_NAME')+' : <b>'+this.requestorName+'</b>' +
				'</span>' +
			'</span>' +

			'<span style="text-align:left;margin-top:5px;margin-left:10px;float:left;width:99%;">' +
				'- '+global.getLabel('DML_AFFECTED_PERSON_DIFFERENT_FROM_REQUE')+' : <b>';
				
				if(this.requestorId==this.affectedId){
					html+=global.getLabel('DML_NO');
				}else{
					html+=global.getLabel('DML_YES');
				}
				
				html+='</b>';
				
				
				if(this.requestorId!=this.affectedId){
					html+=
					'<span style="text-align:left;margin-top:3px;margin-left:20px;float:left;width:99%;">' +
						global.getLabel('DML_EMPLOYEE_ID')+' : <b>'+this.affectedId+'</b>   '+global.getLabel('DML_GCC')+' : <b>'+this.gcc+'</b>   '+global.getLabel('DML_LCC')+' : <b>'+this.lcc+'</b>' +
					'</span>' +
					'<span style="text-align:left;margin-top:3px;margin-left:20px;float:left;width:99%;">' +
						global.getLabel('DML_EMPLOYEE_NAME')+' : <b>'+this.affectedName+'</b>' +
					'</span>';
				}
				
				
			html+=
			'</span>' +

			'<span style="text-align:left;margin-top:5px;margin-left:10px;float:left;width:99%;">' +
				'- '+global.getLabel('DML_PROCESS_FOR_WHICH_DOCUMENTS_ARE_SENT')+' : <b>';
				if(this.process){
					html+=this.process;
				}else{
					html+=global.getLabel('DML_NONE');
				}
				
				html+='</b>' +
			'</span>' +

			'<span style="text-align:left;margin-top:5px;margin-left:10px;float:left;width:99%;">' +
				'- '+global.getLabel('DML_TICKET_SERVICE_FOR_DOCUMENT_PROCESSI')+' : <b>'+this.ticket+'</b><br/>' +
				
			'</span>' +

			'<span style="text-align:left;margin-top:10px;float:left;width:99%;">' +
				global.getLabel('DML_PLEASE_PRINT_THE_COVERSHEET') +
			'</span>' +

			'<span style="text-align:left;margin-top:5px;margin-left:10px;float:left;width:99%;">' +
				'- '+global.getLabel('DML_IF_YOU_HAVE_A_MAIL_ROOM_IN_YOUR_OFFI') +
			'</span>' +

			'<span style="text-align:left;margin-top:5px;margin-left:10px;float:left;width:99%;">' +
				'- '+global.getLabel('DML_VIA')+' <b>'+global.getLabel('DML_FAX')+'</b> '+global.getLabel('DML_ON_THIS_NUMBER')+' : <span class="cs_fax" style="font-weight:bold;color:red;">+800 5432 754</span>' +
			'</span>' +

			'<span style="text-align:left;margin-top:5px;margin-left:10px;float:left;width:40%;">' +
				'<span style="float:left;">- '+global.getLabel('DML_VIA')+' <b>'+global.getLabel('DML_POSTAL_MAIL')+'</b> '+global.getLabel('DML_TO')+' : </span>' +
				'<span class="cs_address" style="font-weight:bold;color:red;float:left;margin-left:5px;">' +
					
				'</span>' +
			'</span>' +

			'<p style="text-align:left;margin-top:10px;float:left;width:99%;">' +
				global.getLabel('DML_USING_A_COVERSHEET_TO_SEND_IN_DOCUME') +
			'</p>' +

		'</div>';
		
		this.target.update(html);
		if(!this.isMandatory){
			this.target.select('div.leftRoundedCorner').first().observe('click',this.removeFromSendListHandlerBinding);
		}
		this.getAddress();
		this.target.select('a').first().observe('click',this.downloadCoversheetHandlerBinding);
		//this.target.select('div.leftRoundedCorner').first().observe('click',this.confirmSendHandlerBinding);
		this.target.select('span.application_action_link').first().observe('click',this.gotoSentDocHandlerBinding);
		
	}
});



var SendDocument_Transaction = new Class.create(Application,

{
    
	required:false,
	uploadModules:{},
	
	initialize: function($super, args) {
			$super(args);
			this.transaction_name='Absence Entry';
			this.docs={'Medical Certificate':true,'Insurrance Claim':false};
			this.arrowClickHandlerBinding = this.arrowClickHandler.bindAsEventListener(this);
			this.uploadClickHandlerBinding = this.uploadClickHandler.bindAsEventListener(this);
			this.coversheetClickHandlerBinding = this.coversheetClickHandler.bindAsEventListener(this);
			this.uploadButtonClickHandlerBinding = this.uploadButtonClickHandler.bindAsEventListener(this);
			this.gotoSentDocHandlerBinding = this.gotoSentDocHandler.bindAsEventListener(this);
			
			this.confirmSendDocClickHandlerBinding = this.confirmSendDocClickHandler.bindAsEventListener(this);
	},
	
	confirmSendDocClickHandler: function(evt) {

            var xmlin = ''
            + ' <EWS>'
            + '     <SERVICE>DM_SEND_DOC</SERVICE>'
            + '     <OBJECT TYPE="P">' + global.objectId + '</OBJECT>'
            + '     <DEL/><GCC/><LCC/>'
            + '     <PARAM>'
            //+ '         <I_V_DOC_TYPE>' + evt.element().up().readAttribute('docType') + '</I_V_DOC_TYPE>'
			+ '         <I_V_DOC_TYPE>001</I_V_DOC_TYPE>'
            + '         <I_V_APPID>' + global.currentApplication.appId + '</I_V_APPID>'
            + '         <I_V_APP_FIELD/>'
            + '     </PARAM>'
            + ' </EWS>';

            this.makeAJAXrequest($H({ xml: xmlin,
                successMethod: 'confirmSendDocCallback',
                xmlFormat: false
            }));
    },
	
	confirmSendDocCallback: function(json) {

        if (json.EWS.o_v_track_id) {
            this.docTrackId = json.EWS.o_v_track_id;
			alert(this.docTrackId);
        } else {
            return;
        }
		/*
        if ($('confirm_send_doc').previous('span')) {
            $('confirm_send_doc').down().update(global.getLabel('confirm_send_doc'));
            $('confirm_send_doc').previous().remove();
        } else {
            $('confirm_send_doc').down().update('Remove From Send List');
            new Insertion.Before('confirm_send_doc', '<span style="font-weight: bold; color: red;float:left;margin:5px;">Document confirmed for sending, task created</span>');
            $('confirm_send_doc').stopObserving('click', this.confirmSendDocClickHandlerBinding);
            $('confirm_send_doc').observe('click', this.removeFromSendListClickHandlerBinding);
        }*/
    },
	
	gotoSentDocHandler: function(evt){
		
		this.close();
		global.open($H({
            app: {
                appId: 'ST_DOCH',
                tabId: 'SC_DOCU',
                view: 'SendDocumentHistory'
            }
        }));
	},
	
	run: function($super, args) {
        $super(args);
		if (this.firstRun) {
			this.buildPopup();
		}
	},
	
	uploadButtonClickHandler:function(evt){
		this.uploadModules[evt.element().readAttribute('docType')].uploadHandler();
	},
	
	uploadClickHandler:function(evt){
		var div=evt.element().up().next();
		div.update();
		
		this.uploadModules[div.readAttribute('docType')] = new UploadModule(div, 'ST_DOC', 'DM_UPLOAD_DOC', false, null,
			{
			    I_V_DOC_TYPE: '01',
			    I_V_PERSNO: '12345678',
			    I_V_APPID: 'ST_DOC'
			});
		div.next().show();	
			
	},
	
	coversheetClickHandler:function(evt){
		this.buildCoversheet(evt.element().up().next());
	},
	
	buildCoversheet:function(container){
	
		container.update();
		container.next().hide();
		new Coversheet(container,'docTypeLabel','docTypeId',this);
		
	},	
	
	arrowClickHandler:function(evt){
		var span= evt.element();
		span.up().next().toggle();
		if(span.hasClassName('application_verticalR_arrow')){
			span.removeClassName('application_verticalR_arrow');
			span.addClassName('application_down_arrow');
		}else{
			span.removeClassName('application_down_arrow');
			span.addClassName('application_verticalR_arrow');
		}
	},
	
	close: function($super) {
		if(this.required){
			var error=new Element('span',{style: 'width:100%;color:red' }).
		update('ERROR: You cannot close the dialog without choosing an option to send your mandatory document!');
			this.virtualHtml.insert({top:error});
			alert('insert before');
		}
		this.popUpApplication.close();
		delete this.popUpApplication;
        $super();
	},
	
		
	buildDocUpload: function(doc_type_label,required){
		var div=new Element('div',{style: 'width:100%;float:left;' });
		
		var div1 = new Element('div',{style: 'width:100%;float:left;margin-top:10px;' });
		var arrow= new Element('span',{'class': 'dm_treeHandler_align_verticalArrow application_verticalR_arrow'}).update('&nbsp;');
		arrow.observe('click', this.arrowClickHandlerBinding);
		var doc_option_label=new Element('span');
		if(required){
			doc_option_label.update('Required document : ');
		}else{
			doc_option_label.update('Optional document : ');
		}
		var doc_type=new Element('span').update(doc_type_label);
		div1.insert(arrow);
		div1.insert(doc_option_label);
		div1.insert(doc_type);
		div.insert(div1);
		
		var div2 = new Element('div',{style: 'width: 100%; float: left; text-align: left;' });
		var choose_to=new Element('span',{'class': 'fieldDispFloatLeft'}).update('Choose to : ');
		var upload=new Element('input',{type: 'radio',value: 'upload',name: doc_type_label+'_send_doc_radio'});
		upload.observe('click', this.uploadClickHandlerBinding);
		var coversheet=new Element('input',{type: 'radio',value: 'coversheet',name: doc_type_label+'_send_doc_radio'});
		coversheet.observe('click', this.coversheetClickHandlerBinding);
		div2.insert(choose_to);
		div2.insert(upload);
		div2.insert('Upload electronically  ');
		div2.insert(coversheet);
		div2.insert('Send with coversheet for scanning processing');
		
		var div3 = new Element('div',{'class':'upload_transaction_container', docType:doc_type_label, style: 'width: 100%; float: left; text-align: left; margin-top: 10px;' });
		
		var div4 = new Element('div',{style: 'width: 100%; float: left; text-align: left; margin-top: 10px;' });
		div4.insert(div2);
		div4.insert(div3);
		
		
		var div5 = new Element('div',{style: 'width: 100%; float: left; text-align: left;' });
		var upload_button=new Element('input',{style:'float:left;',type:'button',value:'Upload',docType:doc_type_label});
		upload_button.observe('click', this.uploadButtonClickHandlerBinding);
		div5.insert(upload_button);
		div5.hide();
		div4.insert(div5);
		
		div4.hide();
		
		div.insert(div4);
		return div;
	},
	
	
	buildPopup: function(){
	
		var contentHTML = new Element('div');

		var title = new Element('span',{'class': 'application_main_title', style: 'width:100%' }).
		update('Send documents for transaction '+this.transaction_name);
		
		this.virtualHtml.insert(title);
		
		for(var i in this.docs){
			this.virtualHtml.insert(this.buildDocUpload(i,this.docs[i]));
			if(this.docs[i])
				this.required=true;
		}
		
	}

	

	
	
	
});

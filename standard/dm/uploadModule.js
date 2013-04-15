var upload_module_store={};

var UploadModule = new Class.create(origin,

{

    targetDiv: null,
    targetDivId: null,
    app_id: null,
    hrw: null,
    service_backend: null,
    doc_id: null,
    isDocId: null,
    callback: null,

    initialize: function(target, app_id, service_backend, isDocId, callback, hrw) {

        this.client = global.client;

        this.app_id = app_id;
        this.hrw = hrw;
        this.service_backend = service_backend;

        this.targetDiv = $(target);
        this.targetDivId = this.targetDiv.identify();
        upload_module_store[this.targetDivId] = this;
        this.isDocId = isDocId;
        this.callback = callback;
        this.uploadHandlerBinding = this.uploadHandler.bindAsEventListener(this);
        var map =
			{
			    edn: '51400',
			    edm: '50400',
			    eds: '51400',
			    edc: '50400',
			    etc: '51400',
			    ed5: '50100',
			    et5: '50200',
			    ep5: '50300'
			};
		
		if(window.location.hostname.endsWith('.com')){
			this.hn = window.location.hostname+'/java';
		}else{
			var port = '';
			var hn = '';
			if (window.location.hostname == 'localhost') {
				hn = 'eu2r3edc.euhreka.erp';
			} else {
				hn = window.location.hostname;
			};

			for (var i in map) {
				if (hn.include(i)) {
					port = map[i];
					break;
				}
			}
			hn += ':' + port;
			this.hn = hn+'/java';
		}
		
		
        
        //this.buildUpload();
        this.initializeSession();
    },

    call: function(url) {

        url = url + '&sap-client=' + this.client;

        var a = document.getElementsByTagName("head")[0];
        var d = a.getElementsByTagName("script").length;

        var b = a.getElementsByTagName("script")[d - 1];
        if (b.getAttribute("src").startsWith('http://')) {
            //a.removeChild(b);
            $(b).remove();
        }
        var c = document.createElement("script");
        c.setAttribute("type", "text/javascript");
        c.setAttribute("src", url + '&_=' + (new Date()).getTime());
        a.appendChild(c);

    },

    initializeSession: function() {

        this.call(window.location.protocol+'//' + this.hn + '/EuHRekaWS05/km?mod=upload&service=createSession&target=' + this.targetDivId);
        //this.call('http://eu2r3edn.euhreka.erp:51400/EuHRekaWS05/km?mod=upload&service=createSes&target='+this.targetDivId);

        //this.call.bind(this,'http://eu2r3edn.euhreka.erp:51400/EuHRekaWS05/km?mod=upload&service=createSes&target='+this.targetDivId).delay(2);

        //this.call('./createSession.js?target='+this.targetDivId);
    },

    uploadHandler: function(evt) {
        var notification = this.targetDiv.down('div.upload_notification');
        if (notification) {
            notification.remove();
        }
        this.targetDiv.select('form').first().submit();
        this.targetDiv.select('table').first().hide();
        this.targetDiv.select('table').last().show();
        this.getProgress();
        //this.getProgress.bind(this).delay(3);
    },



    getProgress: function() {


        this.call(window.location.protocol+'//' + this.hn + '/EuHRekaWS05/km?mod=upload&service=getProgress&target=' + this.targetDivId + '&sessionId=' + this.javaSession);
        //this.call('./getProgress.js?target='+this.targetDivId);


    },

	cancel: function() {
		this.cancelled=true;
	},

    buildProgress: function(percentage, bytesRead, totalLength, rate, unitTime, completed) {
	
		if(this.cancelled)
			return;
		
        this.targetDiv.select('div.uploadModule_progressBarBoxContent').first().setStyle({
            width: parseInt(percentage * 3.5) + 'px'
        });


        this.targetDiv.select('div.uploadModule_progressBarBoxContent').first().update(percentage + '%');
        this.targetDiv.select('td.um_progress').first().update(bytesRead + ' out of ' + totalLength);
        this.targetDiv.select('td.um_rate').first().update('Transfer Rate: ' + rate);
        this.targetDiv.select('td.um_remaining').first().update('Estimated remaining time: ' + unitTime + ' remaining');
        if (completed == 'false') {
            this.getProgress.bind(this).delay(3);
        } else {
            this.uploadDone(completed);
            //if (this.isDocId && completed == '0') {
                this.getDocId();
            //}
        }
    },


    getDocId: function() {

        //this.call('http://eu2r3edn.euhreka.erp:51400/EuHRekaWS05/km?mod=upload&service=getDocId');

        this.call(window.location.protocol+'//' + this.hn + '/EuHRekaWS05/km?mod=upload&service=getDocId&target=' + this.targetDivId + '&sessionId=' + this.javaSession);

        //this.call('./getDocId.js?target='+this.targetDivId);

    },


    buildDocId: function(json) {
        if (json) {
            this.doc_id = json;
            this.callback.call(null, json);
        }
    },


    uploadDone: function(code) {
        var html = '';
        switch (code) {
            case '0':
                html = global.getLabel('upload successful');
                break;
            case '1':
                html = global.getLabel('max file size exceeded');
                break;
            case '2':
                html = global.getLabel('error during upload');
                break;
            case '3':
                html = global.getLabel('error moving to store');
                break;
            case '4':
                html = global.getLabel('file type not allowed');
                break;
        }

        //this.targetDiv.select('table').first().show();
        //this.targetDiv.select('table').last().hide();

        var notification = new Element('div', { 'class': 'upload_notification', style: 'width:100%;float:left;margin:5px;' });
        notification.update(html);
        //this.targetDiv.insert({ 'bottom': notification });
        this.targetDiv.update(notification);
        //this.targetDiv.select('form').first().reset();

    },


    buildUpload: function(javaSession) {

        this.javaSession = javaSession;
        var html =
		'<table>' +
		'<tr>' +
		'<td>' +
        '<form id="form_' + this.targetDivId + '" class="um_form" enctype="multipart/form-data" target="um_iframe_' + this.targetDivId + '" action="'+window.location.protocol+'//' + this.hn + '/EuHRekaWS05/km?mod=upload&service=uploadDocument&appId=' + this.app_id + '&sessionId=' + this.javaSession + '" method="post">' +

			'<input type="hidden" name="servicebackend" value="' + this.service_backend + '">' +
			'<input type="hidden" name="docIdFlag" value="' + this.isDocId + '">';

        if (this.hrw) {
            for (var i in this.hrw) {
                html += '<input type="hidden" name="' + i + '" value="' + this.hrw[i] + '">';
            }
        }

        html +=
			'<input type="file" name="datafile" size="40"/>' +
		'</form>' +
		'</td>' +
		'<td>' +
		'<iframe name="um_iframe_' + this.targetDivId + '" src="javascript:false;" style="width:0;height:0;border:0px solid #fff;"></iframe>' +
		'</td>' +
		'</tr>' +
		'</table>' +

		'<table id="table_' + this.targetDivId + '" width="400" style="display:none;">' +

			'<tr>' +
				'<td>File Upload In Progress</td>' +
			'</tr>' +
			'<tr>' +
				'<td style="text-align: left;">' +
					'<div class="uploadModule_progressBarBox">' +
						'<div id="uploadModule_progressBarBoxContent_' + this.targetDivId + '" align="left" style="width: 0px;" class="uploadModule_progressBarBoxContent"></div>' +
					'</div>' +
				'</td>' +
			'</tr>' +
			'<tr>' +
				'<td id="um_progress_' + this.targetDivId + '" class="um_progress"></td>' +
			'</tr>' +
			'<tr>' +
				'<td id="um_rate_' + this.targetDivId + '" class="um_rate"></td>' +
			'</tr>' +
			'<tr>' +
				'<td id="um_remaining_' + this.targetDivId + '" class="um_remaining"></td>' +
			'</tr>' +

		'</table>';

        this.targetDiv.update(html);

    },

    addParameter: function(pName, pValue) {
        if (pName && pValue) {
            this.targetDiv.select('form').first().insert('<input type="hidden" name="' + pName + '" value="' + pValue + '">');
        }
    },

    removeParameter: function(pName) {
        var elt;
        if (pName) {
            elt = this.targetDiv.select('form').first().select('input[name="' + pName + '"]');
            if (elt) {
                elt.first().remove();
            }
        }
    }
});

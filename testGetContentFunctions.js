// EDN //
        //var __hostNameLogin = "proxy.aspx?url=" + escape("http://eu2r3edn.euhreka.erp:8003/sap/bc/yglui_req_sso?sap-client=300");
        //var __hostNameServices = "proxy.aspx?url=" + escape("http://eu2r3edn.euhreka.erp:8003/sap/bc/yglui_httpentry?sap-client=300");
        // EDC //
        var __hostNameLogin = "proxy.aspx?url=" + escape("http://eu2r3edc.euhreka.erp:8002/sap/bc/yglui_req_sso?sap-client=300");
        var __hostNameServices = "proxy.aspx?url=" + escape("http://eu2r3edc.euhreka.erp:8002/sap/bc/yglui_httpentry?sap-client=300");
        
        var global;
        var getContentInstance;
        
        function callxdoc() {
            $('gct_message').update("Requesting Logon...");
            var form = $('gct_form');
            if (Prototype.Browser.Gecko) {
                form[form.disabled ? 'enable' : 'disable']();
                form.disabled = 'disable';
            }
            else
                form.disabled = true;
            var xml = "<EWS>" +
                          "<SERVICE>CHECK</SERVICE>" +
                          "<PARAM></PARAM>" +
                      "</EWS>";
            new Ajax.Request(__hostNameLogin, {
                method: 'post',
                postBody: xml,
                onSuccess: function() {
                    getUsettings();
                },
                onFailure: function() {
                    $('gct_message').update("Logon failed");
                    $('gct_message').insert("<br />" + __hostName);
                }
            });
        }
    
        function getUsettings() {
            $('gct_message').update("Calling GET_USETTINGS...");
            var xml = "<EWS>" +
                          "<SERVICE>GET_USETTINGS</SERVICE>" +
                          "<LABELS></LABELS>" +
                      "</EWS>";
            new Ajax.Request(__hostNameServices, {
                method: 'post',
                postBody: xml,
                onSuccess: function(data) {
                    $('gct_message').update("Request OK");
                    $('gct_message').insert("<br />" + data.getAllHeaders());
                    var xmlParser = new XML.ObjTree();
                    xmlParser.attr_prefix = '@';
                    var json = xmlParser.parseXML(data.responseText);
                    global = new Global(json);
                    var form = $('gct_form');
                    if (Prototype.Browser.Gecko) {
                        form[form.disabled ? 'enable' : 'disable']();
                        form.disabled = 'enable';
                    }
                    else
                        form.disabled = false;
                },
                onFailure: function() {
                    $('gct_message').update("Request failed");
                    $('gct_message').insert("<br />" + __hostName);
                }
            });
        }
    
        function clearContent() {
            $('gct_content').update("");
            $('gct_xml').value = "";
            $('gct_fieldRefresh').hide();
        }
        
        function loadContent() {
            var xml = $('gct_xml').value;
            if (!Object.isEmpty(xml)) {
                var xmlParser = new XML.ObjTree();
                xmlParser.attr_prefix = '@';
                this.json = xmlParser.parseXML(xml);
                var appId = getAppIdFromJson(this.json);
                global.currentApplication = { appId: appId };
                getContentInstance = new getContentModule({
                    json: this.json,
                    appId: appId,
                    name: "test app name",
                    mode: $('gct_mode').value,
                    fireEventWhenDefaultValueSet: "fireEventWhenDefaultValueSet",
                    paiEvent: "EWS:paiEvent",
                    noResultsHtml: "No results",
                    showCancelButton: false,
                    //showLoadingPAI: loadingPAImsg,
                    showButtons: $H({
                        edit: true,
                        display: true,
                        create: true
                    }),
                    buttonsHandlers: $H({
                        DEFAULT_EVENT_THROW: 'EWS:det',
                        paiEvent: function(args) {
                            alert("paiEvent, args: " + args)
                        }
                    }),
                    cssClasses: $H({})
                });
                $('gct_content').update(getContentInstance.getHtml());
                $('gct_fieldRefresh').show();
				showTableOfFields();
            }
        }
        
        function getAppIdFromJson(json) {
            if (!Object.isEmpty(json.EWS.o_widget_screens) 
            && !Object.isEmpty(json.EWS.o_widget_screens.yglui_str_wid_screen)
		    && !Object.isEmpty(json.EWS.o_widget_screens.yglui_str_wid_screen.yglui_str_wid_screen)) {
			    var screens = objectToArray(json.EWS.o_widget_screens.yglui_str_wid_screen.yglui_str_wid_screen);
			    for (var i = 0; i < screens.size(); i++) {
				    if (!Object.isEmpty(screens[i]) && !Object.isEmpty(screens[i]['@appid']))
					    return screens[i]['@appid'];
			    }
		    }	
		    return "NO_APPID"; 
        }
        
        function refreshField() {
            getContentInstance.refreshField($('gct_field').value);
        }
		
		/**
		 * Shows a table with the fields in the getContent
		 */
		function showTableOfFields() {
            if (!Object.isEmpty(this.json)) {
				var json = this.json;
				if(!Object.isEmpty(json) && !Object.isEmpty(json.EWS) && !Object.isEmpty(json.EWS.o_field_settings) && !Object.isEmpty(json.EWS.o_field_settings.yglui_str_wid_fs_record)){
					var records = objectToArray(json.EWS.o_field_settings.yglui_str_wid_fs_record);
					//TODO: Only for the first screen for now:
					if(!Object.isEmpty(records[0].fs_fields) && !Object.isEmpty(records[0].fs_fields.yglui_str_wid_fs_field)){
						var fields = objectToArray(records[0].fs_fields.yglui_str_wid_fs_field);
						var tableElement = new Element("table");
						var tableHeadElement = tableElement.down("thead");
						if(Object.isEmpty(tableHeadElement)){
							tableHeadElement = new Element("thead");	
						}
						var tableBodyElement = tableElement.down("tbody");
						if(Object.isEmpty(tableBodyElement)){
							tableBodyElement = new Element("tbody");	
						}
						
						tableElement.insert(tableHeadElement);
						tableElement.insert(tableBodyElement);
						tableHeadElement.insert("<tr>"
							+ "<th class='table_sortfirstdesc' id='tgc_th01'>seqnr</th>"
							+ "<th id='tgc_th02'>Id</th>" 
							+ "<th id='tgc_th03'>Label</th>"
							+ "<th id='tgc_th04'>Label type</th>"
							+ "<th id='tgc_th05'>Default text</th>"
							+ "<th id='tgc_th06'>Default value</th>"
							+ "<th id='tgc_th07'>Depend field</th>"
							+ "<th id='tgc_th08'>Depend type</th>"
							+ "<th id='tgc_th09'>Display attrib</th>"
							+ "<th id='tgc_th10'>Display group</th>"
							+ "<th id='tgc_th11'>Field format</th>"
							+ "<th id='tgc_th12'>Field source</th>"
							+ "<th id='tgc_th13'>Field type</th>"
							+ "<th id='tgc_th14'>Length</th>"
							+ "<th id='tgc_th15'>sadv_id</th>"
							+ "<th id='tgc_th16'>Pai service</th>"
							+ "<th id='tgc_th17'>GetValues service</th>"
							+ "<th id='tgc_th18'>Show text</th>"
							+ "<th id='tgc_th19'>Type</th>" 
							+ "</tr>"
						);
						for(var i=0; i<fields.size();i++){
							var rowForField = new Element("tr", {"id": "tgc_tr"+i});
							rowForField.insert(new Element("td").insert("<input type='text' value='" + fields[i]['@seqnr']+ "'/>"));
							rowForField.insert(new Element("td").insert("<input type='text' value='" + fields[i]['@fieldid']+ "'/>"));
							rowForField.insert(new Element("td").insert("<input type='text' value='" + fields[i]['@fieldlabel']+ "'/>"));
							rowForField.insert(new Element("td").insert("<input type='text' value='" + fields[i]['@label_type']+ "'/>"));
							rowForField.insert(new Element("td").insert("<input type='text' value='" + fields[i]['@default_text']+ "'/>"));
							rowForField.insert(new Element("td").insert("<input type='text' value='" + fields[i]['@default_value']+ "'/>"));
							rowForField.insert(new Element("td").insert("<input type='text' value='" + fields[i]['@depend_field']+ "'/>"));
							rowForField.insert(new Element("td").insert("<input type='text' value='" + fields[i]['@depend_type']+ "'/>"));
							rowForField.insert(new Element("td").insert("<input type='text' value='" + fields[i]['@display_attrib']+ "'/>"));
							rowForField.insert(new Element("td").insert("<input type='text' value='" + fields[i]['@display_group']+ "'/>"));
							rowForField.insert(new Element("td").insert("<input type='text' value='" + fields[i]['@fieldformat']+ "'/>"));
							rowForField.insert(new Element("td").insert("<input type='text' value='" + fields[i]['@fieldsource']+ "'/>"));
							rowForField.insert(new Element("td").insert("<input type='text' value='" + fields[i]['@fieldtype']+ "'/>"));
							rowForField.insert(new Element("td").insert("<input type='text' value='" + fields[i]['@length']+ "'/>"));
							rowForField.insert(new Element("td").insert("<input type='text' value='" + fields[i]['@sadv_id']+ "'/>"));
							rowForField.insert(new Element("td").insert("<input type='text' value='" + fields[i]['@service_pai']+ "'/>"));
							rowForField.insert(new Element("td").insert("<input type='text' value='" + fields[i]['@service_values']+ "'/>"));
							rowForField.insert(new Element("td").insert("<input type='text' value='" + fields[i]['@show_text']+ "'/>"));
							rowForField.insert(new Element("td").insert("<input type='text' value='" + fields[i]['@type']+ "'/>"));
							tableBodyElement.insert(rowForField);	
						}
						$('gct_tableOfFieldsInner').update(tableElement);
						TableKit.Sortable.init(tableElement, { pages: 40 });
						TableKit.options.autoLoad = false;
					}
				}				
			}
        }        function refreshContent() {
            if(!Object.isEmpty(this.json)) {
                var table = $('gct_tableOfFieldsInner').down();
                for(var i=0; i<table.tBodies[0].rows.length; i++) {
                    this.json.EWS.o_field_settings.yglui_str_wid_fs_record[0].fs_fields.yglui_str_wid_fs_field[i]['@seqnr'] = table.tBodies[0].rows[i].cells[0].childNodes[0].value;
                    this.json.EWS.o_field_settings.yglui_str_wid_fs_record[0].fs_fields.yglui_str_wid_fs_field[i]['@fieldid'] = table.tBodies[0].rows[i].cells[1].childNodes[0].value;
                    this.json.EWS.o_field_settings.yglui_str_wid_fs_record[0].fs_fields.yglui_str_wid_fs_field[i]['@fieldlabel'] = table.tBodies[0].rows[i].cells[2].childNodes[0].value;
                    this.json.EWS.o_field_settings.yglui_str_wid_fs_record[0].fs_fields.yglui_str_wid_fs_field[i]['@label_type'] = table.tBodies[0].rows[i].cells[3].childNodes[0].value;
                    this.json.EWS.o_field_settings.yglui_str_wid_fs_record[0].fs_fields.yglui_str_wid_fs_field[i]['@default_text'] = table.tBodies[0].rows[i].cells[4].childNodes[0].value;
                    this.json.EWS.o_field_settings.yglui_str_wid_fs_record[0].fs_fields.yglui_str_wid_fs_field[i]['@default_value'] = table.tBodies[0].rows[i].cells[5].childNodes[0].value;
                    this.json.EWS.o_field_settings.yglui_str_wid_fs_record[0].fs_fields.yglui_str_wid_fs_field[i]['@depend_field'] = table.tBodies[0].rows[i].cells[6].childNodes[0].value;
                    this.json.EWS.o_field_settings.yglui_str_wid_fs_record[0].fs_fields.yglui_str_wid_fs_field[i]['@depend_type'] = table.tBodies[0].rows[i].cells[7].childNodes[0].value;
                    this.json.EWS.o_field_settings.yglui_str_wid_fs_record[0].fs_fields.yglui_str_wid_fs_field[i]['@display_attrib'] = table.tBodies[0].rows[i].cells[8].childNodes[0].value;
                    this.json.EWS.o_field_settings.yglui_str_wid_fs_record[0].fs_fields.yglui_str_wid_fs_field[i]['@display_group'] = table.tBodies[0].rows[i].cells[9].childNodes[0].value;
                    this.json.EWS.o_field_settings.yglui_str_wid_fs_record[0].fs_fields.yglui_str_wid_fs_field[i]['@fieldformat'] = table.tBodies[0].rows[i].cells[10].childNodes[0].value;
                    this.json.EWS.o_field_settings.yglui_str_wid_fs_record[0].fs_fields.yglui_str_wid_fs_field[i]['@fieldsource'] = table.tBodies[0].rows[i].cells[11].childNodes[0].value;
                    this.json.EWS.o_field_settings.yglui_str_wid_fs_record[0].fs_fields.yglui_str_wid_fs_field[i]['@fieldtype'] = table.tBodies[0].rows[i].cells[12].childNodes[0].value;
                    this.json.EWS.o_field_settings.yglui_str_wid_fs_record[0].fs_fields.yglui_str_wid_fs_field[i]['@length'] = table.tBodies[0].rows[i].cells[13].childNodes[0].value;
                    this.json.EWS.o_field_settings.yglui_str_wid_fs_record[0].fs_fields.yglui_str_wid_fs_field[i]['@sadv_id'] = table.tBodies[0].rows[i].cells[14].childNodes[0].value;
                    this.json.EWS.o_field_settings.yglui_str_wid_fs_record[0].fs_fields.yglui_str_wid_fs_field[i]['@service_pai'] = table.tBodies[0].rows[i].cells[15].childNodes[0].value;
                    this.json.EWS.o_field_settings.yglui_str_wid_fs_record[0].fs_fields.yglui_str_wid_fs_field[i]['@service_values'] = table.tBodies[0].rows[i].cells[16].childNodes[0].value;
                    this.json.EWS.o_field_settings.yglui_str_wid_fs_record[0].fs_fields.yglui_str_wid_fs_field[i]['@show_text'] = table.tBodies[0].rows[i].cells[17].childNodes[0].value;
                    this.json.EWS.o_field_settings.yglui_str_wid_fs_record[0].fs_fields.yglui_str_wid_fs_field[i]['@type'] = table.tBodies[0].rows[i].cells[18].childNodes[0].value;
                }
                var appId = getAppIdFromJson(this.json);
                    getContentInstance = new getContentModule({
                        json: this.json,
                        appId: appId,
                        name: "test app name",
                        mode: $('gct_mode').value,
                        fireEventWhenDefaultValueSet: "fireEventWhenDefaultValueSet",
                        paiEvent: "EWS:paiEvent",
                        noResultsHtml: "No results",
                        showCancelButton: false,
                        //showLoadingPAI: loadingPAImsg,
                        showButtons: $H({
                            edit: true,
                            display: true,
                            create: true
                        }),
                        buttonsHandlers: $H({
                            DEFAULT_EVENT_THROW: 'EWS:det',
                            paiEvent: function(args) {
                                alert("paiEvent, args: " + args)
                            }
                        }),
                        cssClasses: $H({})
                    });
                    $('gct_content').update(getContentInstance.getHtml());
                    $('gct_fieldRefresh').show();
				    showTableOfFields();
				    var xml = new XML.ObjTree();
                    xml.attr_prefix = '@';
                    xml = xml.writeXML(this.json,true);
                    $('gct_xml').value = xml;
			}
        }
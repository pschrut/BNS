/**
 *@fileOverview PFM_TeamOv.js
 *@description It contains a class with functionality for team documents.
 */
/**
 *@constructor
 *@description Class with functionality for team documents.
 *@augments Application
 */
var PFM_TeamOv = Class.create(Application,{
    /**
     *@type Boolean
     *@description Tells if the table is initialized
     */
    tableShowed: false,
    /**
     *@type String
     *@description Service used to load the team documents
     */
    getPFMTeamService : "SEARCH_DOCS",
    /**
     *Constructor of the class PFM_TeamOv
     */
    initialize: function($super, args) {
	    $super(args); 
	},
	/**
     *@description Starts PFM_TeamOv
     */
	run:function($super, args){
	    $super(args);	
	    this.PFM_TeamOvContainer = this.virtualHtml;
	    if (args) {
            if (args.get('refresh') == 'X')
                this.reload = true;	
        }   
        else
            this.reload = false;     	
	    if(this.firstRun){
            this.createHtml();
        }
        if (this.reload){ 
            this.headerInserted=false;
            this.PFM_TeamOvContainer.down('tr#PFM_headDocTable').update("");
            this.PFM_TeamOvContainer.down('tbody#PFMteamOv_Body').update("");            
            for(var i=0;i<this.getSelectedEmployees().keys().length;i++){
                this.callToGetDocuments(this.getSelectedEmployees().keys()[i]);
            }
        }
	    
	    
	    /*
	    if(this.firstRun){ 
	        this.createHtml();
        }
        if(this.PFM_TeamOvContainer)
            this.PFM_TeamOvContainer.show();*/ 
	},
	/*
     * @method createHtml
     * @desc create the first screen with the empty team docs table
     */ 
	createHtml: function(){
	    this.headerInserted=false;
        //we create the empty table od the individual docs            
        var html = "<div id='teamDocsLegend' class='PFM_teamDocsLegend'></div>" +
                   "<div id='virtualDocs_tableTeamOv' class='PFM_sizeTableDocs'></div>" +
                   "<div id='virtualDocs_NoTableDoc' class='PFM_NoOpenOwnDocs application_main_soft_text'></div>";
        this.PFM_TeamOvContainer.update(html); 
         //we create the legend                                     
	    var legendJSON = { 
            legend: [
                { img: "application_icon_green", text: global.getLabel('completed') },
                { img: "application_icon_orange", text: global.getLabel('warning') },
                { img: "application_icon_red", text: global.getLabel('overdue') }
                
            ],
            showLabel: global.getLabel('showLgnd'),
            hideLabel: global.getLabel('closeLgnd')
        };
        var legendHTML = getLegend(legendJSON);
        this.PFM_TeamOvContainer.down('div#teamDocsLegend').insert(legendHTML);
        var table = "<table class='sortable PFM_subSizeTableDocs' id='PFM_teamOvTable'>" +
                        "<thead>" +
                            "<tr id='PFM_headDocTable'>" +
                            "</tr>" +
                        "</thead>" +
                        "<tbody id='PFMteamOv_Body'></tbody>" +
                    "</table>";
        this.PFM_TeamOvContainer.down('div#virtualDocs_tableTeamOv').insert(table);
        this.PFM_TeamOvContainer.down('div#teamDocsLegend').hide();
        this.PFM_TeamOvContainer.down('div#virtualDocs_tableTeamOv').hide();
        this.PFM_TeamOvContainer.down('div#virtualDocs_NoTableDoc').insert("<span>"+global.getLabel('noTeamDocs')+"</span>")
        //we make the table sortable
        if(!this.tableShowed){
            TableKit.Sortable.init('PFM_teamOvTable');
            this.tableShowed=true;
            TableKit.options.autoLoad = false;
        }
        else
            TableKit.reloadTable('PFM_teamOvTable');
     },
    /*
     * @method callToGetDocuments
     * @desc call service to fill the table
     */ 
    callToGetDocuments: function(empId){    
	    //call to sap 
	    if(empId && (empId != global.objectId))
	        var appraisees="<HAP_T_HRSOBID plvar='01' SOBID='"+empId+"' OTYPE='P'></HAP_T_HRSOBID>";
	    else{
	        var appraisees="";
	        empId=global.objectId;
	    }
        var xmlToGetAssign = "<EWS>"+
                                    "<SERVICE>"+this.getPFMTeamService+"</SERVICE>"+
                                    "<OBJECT TYPE='P'>"+global.objectId+"</OBJECT>"+   
                                    "<PARAM>"+
                                        "<TABID>PFM_TOV</TABID>"+
                                        "<APPRAISEES>" +appraisees+"</APPRAISEES>" +
                                    "</PARAM>"+
                                    ""+
                             "</EWS>";
        this.makeAJAXrequest($H({xml:xmlToGetAssign, successMethod:'processCallToGetDocs', ajaxID:empId})); 
	},
	/*
     * @method processCallToGetDocs
     * @param json {json} The JSON object retrieved from the service
     * @desc call service to fill the table
     */ 
	processCallToGetDocs:function(json, empId){
	    //variable used to save the values in json
	    var testIfDocsTeam=json.EWS.o_team_docs;
	    if(testIfDocsTeam){
	        var getDocsTeam=objectToArray(json.EWS.o_team_docs.yglui_str_search_document);
	        var classColumn="";
	        var classOfBubble="";
	        var hashDocsTeam;
	        var _this=this;
	        var html ='', valueInsideTable;
	        var linkOfDocument="";
	        var tableSortFirst=false;
	        var classOfLink, idOfDocument, idOfLink;
	        //for every document related to a member in the team, we loop to enter a row in the table
	        for(var i=0;i<getDocsTeam.length;i++){
	            hashDocsTeam=$H(getDocsTeam[i]);
	            html += "<tr id='PFMrow_"+empId+"_"+i+"'>"; 
	            //we read every field that is going to be a column in the table
	            hashDocsTeam.each(function(pair){
	                if((pair.key != '@tartb') && (pair.key != '@views') && (pair.key != '@appid')){
	                    classColumn="";
	                    classOfBubble="";
	                    classOfLink="";
	                    idOfLink="";
	                    if(pair.key=='@s_bubble')
	                        classColumn='PFM_bubbleColumn'; 
	                    if(pair.value=='Y')
	                        classOfBubble='application_icon_orange';
                        else if(pair.value=='G')    
                            classOfBubble='application_icon_green';
                        else if(pair.value=='R')
                            classOfBubble='application_icon_red';
                        if(pair.key=='@s_bubble'){
	                        pair.value="";
	                        pair.key="";
	                    }
	                    if(pair.key=='@doc_id')
	                        idOfDocument="TeamDoc_"+pair.value;
	                    if(pair.key=='@w_document'){
	                        classOfLink='application_action_link';
	                        idOfLink=idOfDocument;
	                    }
	                    if(pair.key=='@y_due_date')
	                        pair.value=Date.parseExact(pair.value,'yyyy-MM-dd').toString(global.dateFormat);
	                    //if the value is not the id of the document and is not #text, we insert it in the table
                        if(pair.key!='@doc_id' && pair.key!='#text'){
                                //we insert the header only one time
                                if(i==0 && _this.headerInserted==false){
                                    if(pair.key!="" && !tableSortFirst){
	                                _this.PFM_TeamOvContainer.down('tr#PFM_headDocTable').insert(
	                                    "<th class='table_sortfirstdesc "+classColumn+"'>"+global.getLabel(pair.key.gsub('@', ''))+"</th>"
	                                    ); 
	                                    tableSortFirst=true;
	                                }
	                                else
	                                    _this.PFM_TeamOvContainer.down('tr#PFM_headDocTable').insert(
	                                    "<th class='"+classColumn+"'>"+global.getLabel(pair.key.gsub('@', ''))+"</th>"
	                                );
	                                if(_this.PFM_TeamOvContainer.down('tr#PFM_headDocTable').cells.length==6)
	                                    _this.headerInserted=true;
	                            }
                                //we insert every row in the table
                                var pairValue = !Object.isEmpty(pair.value) ? pair.value.strip(): '';
	                            html += "<td class='"+classColumn+"'><div id='"+idOfLink+"' class='"+classOfBubble+" "+classOfLink+"'>"+pairValue+"</div></td>";
	                    }
	                }//end if (pair.key != '@tartb') && (pair.key != '@views')
	            });
	            html += "</tr>";
	            
	        }
	        //we insert all in the table and reload it
	        if(_this.PFM_TeamOvContainer.down('tbody#PFMteamOv_Body').rows.length==0)
	            this.PFM_TeamOvContainer.down('tbody#PFMteamOv_Body').update(html);
	        else
	            this.PFM_TeamOvContainer.down('tbody#PFMteamOv_Body').insert(html);
	        if(!this.tableShowed){
                TableKit.Sortable.init('PFM_teamOvTable');
                this.tableShowed=true;
                TableKit.options.autoLoad = false;
            }
            else
                TableKit.reloadTable('PFM_teamOvTable');
            this.PFM_TeamOvContainer.down('div#virtualDocs_NoTableDoc').hide();
            this.PFM_TeamOvContainer.down('div#teamDocsLegend').show();
            this.PFM_TeamOvContainer.down('div#virtualDocs_tableTeamOv').show();
        }
	    this.arrayOfInputs=this.PFM_TeamOvContainer.select('div.application_action_link');
       if(Object.jsonPathExists(json, 'EWS.o_team_docs.yglui_str_search_document')){
            this.openAppInfoView = objectToArray(json.EWS.o_team_docs.yglui_str_search_document)[0]['@views'];
            this.openAppInfoTab = objectToArray(json.EWS.o_team_docs.yglui_str_search_document)[0]['@tartb'];
            this.openAppInfoAppId = objectToArray(json.EWS.o_team_docs.yglui_str_search_document)[0]['@appid'];
       } 	    
        this.testandObserveLinks();
    },
     /*
     * @method testandObserveLinks
     * @desc asign onclick to the link
     */
     testandObserveLinks:function(event){
         for(var i=0;i<this.arrayOfInputs.length;i++)
            if(this.arrayOfInputs[i].id.include('TeamDoc'))
                this.arrayOfInputs[i].observe('click', this.clickingOnDocument.bind(this));
    },
    /*
     * @method clickingOnDocument
     * @param event {Object} object that has the link with the id of the document
     * @desc we get the id of the doc clicked
     */
    clickingOnDocument:function(event){
        var idOfLink=event.element().identify().split('_')[1];
        //this.PFM_TeamOvContainer.down('div#app_PFM_IndividualDocs').hide();
        global.open($H({
            app:{
                appId: this.openAppInfoAppId,
                view: this.openAppInfoView,
                tabId: this.openAppInfoTab 
            },   
            idOfDoc :idOfLink,
            previousApp:this.options.appId,
            previousView: this.options.view
        }));
        //document.fire('EWS:openApplication',$H({app:'PFM_ShowDocs', idOfDoc:idOfLink, previousApp:'PFM_TOV'}));
        
    },
    /*
     * @method onEmployeeSelected
     * @param args {Object} object that has the information about the user selected
     * @desc we get the id of the user selected and we call to load the documents
     */
    onEmployeeSelected: function(args) {
        this.empId = args.id;
        if(this.empId==global.objectId && this.PFM_TeamOvContainer){
            this.empId="";
            this.PFM_TeamOvContainer.down('tbody#PFMteamOv_Body').update("");
        }
        else{
            var i=0;
             while(this.PFM_TeamOvContainer.down('tr#PFMrow_'+global.objectId+'_'+i)){
	            this.PFM_TeamOvContainer.down('tr#PFMrow_'+global.objectId+'_'+i).remove();
	            i++;
	        }    
        }
        this.callToGetDocuments(this.empId);
        
    },
    /*
     * @method onEmployeeUnselected
     * @param args {Object} object that has the information about the user unselected
     * @desc we get the id of the user unselected and we call to remove it from the table
     */
    onEmployeeUnselected: function(args) {	
        var i=0;
        while(this.PFM_TeamOvContainer.down('tr#PFMrow_'+args.id+'_'+i)){
            //this.PFM_TeamOvContainer.down('tr#PFM_headDocTable').update("");	
	        this.PFM_TeamOvContainer.down('tr#PFMrow_'+args.id+'_'+i).remove();
	        i++;
	    }
	    //we make the table sortable
        if(!this.tableShowed){
            TableKit.Sortable.init('PFM_teamOvTable');
            this.tableShowed=true;
            TableKit.options.autoLoad = false;
        }
        else
            TableKit.reloadTable('PFM_teamOvTable');
	    if(this.getSelectedEmployees().size() == 0 || this.PFM_TeamOvContainer.down('tbody#PFMteamOv_Body').rows.length==0){
	        this.PFM_TeamOvContainer.down('div#teamDocsLegend').hide();
		    this.PFM_TeamOvContainer.down('div#virtualDocs_tableTeamOv').hide();
		    this.PFM_TeamOvContainer.down('div#virtualDocs_NoTableDoc').show(); 
		}         
    }

});
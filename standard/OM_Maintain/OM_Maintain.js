/** 
 * @fileOverview OM_Maintain.js 
 * @description File containing class OM_Maintain This class is the one used to run OM_Maintain application
 * This application gives the user the possibility to maintain his Organizational structure.
*/ 

/**
 *@constructor
 *@description Class OM_Maintain.
 *@augments Application 
*/
var OM_Maintain_standard = Class.create(Application, 
/** 
*@lends OM_Maintain
*/
{
    /*** SERVICES ***/
    /** 
    * Service used to get the OM structure.
    * @type String
    */
    getOMService : "GET_OM",
    /** 
    * Service used to get the OM structure.
    * @type String
    */
    getActionsService : "GET_ACTIONS",
    /** 
    * Service used to get the options that autocompleter object is going to show
    * @type String
    */
    getOptionsACService: "SEARCH_OBJECTS",
    
    /*** VARIABLES ***/
    /**
     * Container of all html div
     * @type DOM
     */    
    OM_MaintainContainer: null,
     /**
     * @type Date
     * @description set the format of the date
     */
    dateFormat: null,
    /**
     * @type DatePicker
     * @description start date in the datePicker
     */
    begDate: null,
    /**
     * @type DatePicker
     * @description end date in the datePicker
     */
    endDate: null,
    /**
     * @type Object
     * @description Text entered to perform the search with
     */
    searchTextAutocompleter: null,
    /**
     * @type String
     * @description Value introduced in the autocompleter
     */
    searchTextAutocompleterValue: "",
    /**
     * @type DOM
     * @description Org. Unit checkbox
     */
    org_unit_CB: null,
    /**
     * @type DOM
     * @description position checkbox
     */
    position_CB: null,
    /**
     * @type DOM
     * @description moreResults checkbox
     */
    moreResults_CB: null,    
    /**
     * @type TreeHandler
     * @description the organizational structure, in a tree shape
     */
    orgTree: null,
    /**
     * @type hash
     * @description hash that has all the elements received from the search
     */
    hashAC: new Hash(),
    /**
     * @type String
     * @description save the value to know if we have selected O checkbox
     */
    searchByO: null,
     /**
     * @type String
     * @description save the value to know if we have selected S checkbox
     */
    searchByS: null,
     /**
     * @type String
     * @description save the value to know if we have selected All languages checkbox
     */    
    searchByMore: null,
     /**
     * @type String
     * @description Id of the root of the tree
     */
    rootID: null,
     /**
     * @type Hash
     * @description Hash containing all objects' dates
     */
    objectDates: new Hash(),
     /**
     * @type Hash
     * @description Hash containing all objects' org. unit name
     */
    objectNames: new Hash(),
     /**
     * @type Hash
     * @description Hash containing all action labels
     */
    actionLabels: null,
     /**
     * @type String
     * @description Last root org. unit visited
     */
    lastOrgUnit: null,
    /**
     * @type Hash  / Date
     * @description variable to send to deleteDelimit Aplication
     */
    hashToSend:null,
    /**
     *@type String
     *@description Logged user's org. unit (id)
     */
    loggedUserOrgUnit: "",
    /**
     *@param $super The superclass (Application)
     *@description Instantiates the app
     */  
    initialize: function($super,args) {
        $super(args);
        //event listeners binding
        this.clickOnNodeBinding = this.clickOnNode.bindAsEventListener(this);
        this.callToGetActionsBinding = this.callToGetActions.bindAsEventListener(this);
        this.changeDatePickersBinding = this.changeDatePickers.bindAsEventListener(this);
        this.makeSimpleSearchBinding = this.makeSimpleSearch.bindAsEventListener(this);
        this.setSearchTextBinding = this.setSearchText.bindAsEventListener(this);
    },
    /**
     *@param $super The superclass: Application
     *@description when the user clicks on the app tag, load the html structure and sets the event observers
     * which have changed.
     *@param refresh {Boolean} Tells if it is neccesary to refresh the tree
     */	
    run: function($super, args) {
        $super();
        
        var refresh = false;
        if (args)
            refresh = args.get('refresh');
        
        this.OM_MaintainContainer = this.virtualHtml;           
        
        if(this.firstRun){
            this.createHtml();
            //call to GET_OM
            this.callToGetOM();
        }
        else{
            if (args && (refresh == true))
                this.callToGetOM("", this.lastOrgUnit);
        }
        document.observe("EWS:treeHandler_GiveMeXml", this.clickOnNodeBinding);
        document.observe('EWS:treeHandler_textClicked', this.callToGetActionsBinding);
        document.observe("EWS:datepicker_CorrectDate", this.changeDatePickersBinding);
        document.observe("EWS:datepicker_WrongDate", this.changeDatePickersBinding);   
        document.observe("EWS:autocompleterResultSelected",this.makeSimpleSearchBinding);  
        document.observe("EWS:autocompleterGetNewXml",this.setSearchTextBinding);     
    },
    /**
     *@description we call search_objects service to get the list of options in the autocompleter box
     */	
    callToGetOptionsSearch: function(){
        if (Object.isEmpty(this.searchTextAutocompleterValue)) {
            this.searchTextAutocompleterValue = '*';
        }
        //variables to test if we pass Y or N for Org. Unit and position Checkboxes
        var orgUnitChecked;
        var posChecked;
        var allObjects;
        //we test if we have selected Org units 
        if(this.searchByO)
            orgUnitChecked='Y';
        else
            orgUnitChecked='N';
        //we test if we have selected positions
        if(this.searchByS)
            posChecked='Y';
        else  
            posChecked='N';
        //test if we have selected to see all objetcs in all languages
        if(this.searchByMore)
            allObjects='Y';
        else 
            allObjects='N';
        //we parse the date with "yyyy-MM-dd" to pass to the service
        var parsedBDate = this.begDatePicker.actualDate.toString(this.dateFormat);
        var parsedEDate = this.endDatePicker.actualDate.toString(this.dateFormat);
        //we call search_objects service with the previous values
        var json="<EWS>"
                    +"<SERVICE>"+this.getOptionsACService+"</SERVICE>"
                    +"<DEL/>"
                    +"<PARAM>"
                        +"<ORG_UNIT>"+orgUnitChecked+"</ORG_UNIT>"
                        +"<POSITION>"+posChecked+"</POSITION>"
                        +"<COSTCENT>N</COSTCENT>"
                        +"<PERSON>N</PERSON>"
                        +"<LANGU>"+allObjects+"</LANGU>"
                        +"<O_BEGDA>"+parsedBDate+"</O_BEGDA>"
                        +"<O_ENDDA>"+parsedEDate+"</O_ENDDA>"
                        +"<TEXT>"+this.searchTextAutocompleterValue+"</TEXT>"
                        +"<MAX>20</MAX>"
                    +"</PARAM>"
                +"</EWS>"
        this.makeAJAXrequest($H({
                xml: json,
                successMethod: 'buildAutocompleterXML'
            }));
    },
     /**
     *@param jsonObject {json} The JSON object retrieved from the service
     *@description When the user clicks on the app tag, load the html structure and sets the event observers
     * which have changed.
     */	
    buildAutocompleterXML: function(jsonObject) {
        
        //hash that is going to contains all the elements we show in the autocompleter list
        this.hashAC = $H({});
        //we make a json object that is going to contain the fields that the autocompleter needs (data, text) 
        var json = {
               autocompleter:{
                        object:[],
                        multilanguage:{
                                no_results: global.getLabel('noResults'),
                                search: global.getLabel('search')
                        }
               }
        }
        //if we receive a json with results..
        if(jsonObject.EWS.o_objects){
            //we make an array with all the results to show
            var array = objectToArray(jsonObject.EWS.o_objects.yglui_tab_objects);
            for(var i=0; i<array.length; i++){
                //id of the object
                var idObject= array[i]["@objid"];
                //type maybe S or O
                var type=array[i]["@otype"];
                //name and id of the O (if the element has, if not we receive null)
                var oName= array[i]["@orgtext"];
                var id= array[i]["@orgid"];
                //text to show in autocompleter list
                var text =array[i]["@stext"];
                var text = Object.isEmpty(array[i]["@stext"]) ? array[i]["@short"] : array[i]["@stext"];
                //begin and end dates of the object
                var bDate= array[i]["@begda"];
                var eDate= array[i]["@endda"];
                //we insert all values in the hash to have all values in autocompleter list saved
                this.hashAC.set(idObject, {type:type,idObject:idObject,id:id, text:text, oName:oName, bDate:bDate, eDate:eDate});
            }
            //for each object in the hash, we update the json object (data+text)
            this.hashAC.each(function(pair){
                var text=Object.isEmpty(pair.value['oName']) ? "" : " - ("+pair.value['oName']+")";
                json.autocompleter.object.push({
                    data: pair.key,
                    text: pair.value['text']+" ["+pair.value['idObject']+"] "+text
                })
            });
        }
        //update the autocompleter's content
        this.searchTextAutocompleter.updateInput(json);
        if (jsonObject.EWS.webmessage_text)
            this._infoMethod(jsonObject);
    },
     /**
     *@description make the html DOM, the legend, the divs to make a simple search...
     */	
    createHtml: function(){
        //div that contains all DOM element of OM_maintain screen
        this.div_mainOM = new Element('div', {
            'id': 'OM_maintain_mainDiv',
            'class': 'OM_maindiv'
        }); 
        //div that is going to have the search menu (datePickers, autocompleter, chexBoxes and advanced search link)
        this.div_top_search = new Element('div',{
            'class': 'OM_searchMenu',
            'id': 'OM_maintain_searchMenu'  
        });
        //we insert the main div in the targetDiv
        this.OM_MaintainContainer.insert(this.div_mainOM);
        //div that contains the tree
        this.treeStructure = new Element('div',{
            'class': 'OM_treeStructure',
            'id': 'OM_maintainTree'  
        });
        //we insert the div that contains all elements to make a search inside main div
        this.div_mainOM.insert(this.div_top_search);
         // DatePickers definition
        this.begDate = Date.today();
        //the endDate is going to be 3 months later from the beginDate
        this.endDate = Date.today().addMonths(3).toString('yyyyMMdd');
        this.begDate = this.begDate.toString('yyyyMMdd')
        //we insert the labels for datePickers
        this.div_top_search.insert(
            "<div class='OM_FromLabel'>"+global.getLabel('from')+"</div>" +
            "<div id='OM_maintain_searchMenu_begdate' class='OM_maintain_searchMenu_datePickers'></div>"
        );
        //we create datePickers for begin and end Dates
        this.begDatePicker = new DatePicker('OM_maintain_searchMenu_begdate', {
            defaultDate: this.begDate,
            draggable: true,
            manualDateInsertion: false,
            events: $H({dateSelected: 'EWS:datepicker_CorrectDate'})
        });
        this.div_top_search.insert(
            "<div class='OM_ToLabel'>"+global.getLabel('to')+"</div>" +
            "<div id='OM_maintain_searchMenu_enddate' class='OM_maintain_searchMenu_datePickers'></div>"
        );
        this.endDatePicker = new DatePicker('OM_maintain_searchMenu_enddate', {
            defaultDate: this.endDate,
            draggable: true,
            manualDateInsertion: false,
            events: $H({dateSelected: 'EWS:datepicker_CorrectDate'})
        });
        this.begDatePicker.linkCalendar(this.endDatePicker);
        //we create json object for autocompleter
        var json = {
            autocompleter:{
                object:[],
                    multilanguage:{
                        no_results: global.getLabel('noResults'),
                        search: global.getLabel('search')
                    }
                }
            }
        //div that contains autocompleter object (observing for when the user clicks to show the options)
        this.maintainAutocompleter = new Element ('div',{
            'class': 'OM_autocompleterMaintain',
            'id': 'OM_maintain_autocompleterMaintain'  
        });//.observe('click', this.callToGetOptionsSearch.bind(this));
        //we insert autocompleter in the top menu
        this.div_top_search.insert(this.maintainAutocompleter);
        //we pass json object with No results to autocompleter
        this.searchTextAutocompleter = new JSONAutocompleter('OM_maintain_autocompleterMaintain', {
            events: $H({onGetNewXml: 'EWS:autocompleterGetNewXml',
                        onResultSelected: 'EWS:autocompleterResultSelected'}),        
            timeout: 0,
            templateResult: '#{text}',
            templateOptionsList: '#{text}',
            minChars: 1,
            noFilter: true
        }, json);
        // Arrow in autocompleter
        this.OM_MaintainContainer.down('input#button_OM_maintain_autocompleterMaintain').observe('click', function() {
            this.searchTextAutocompleter.clearInput();
        }.bind(this));
//        //we insert the link for advanced search in top menu
//        this.div_top_search.insert(
//            "<div class='application_action_link OM_AdvSearch' id='OM_Maintain_AS'><span>"+global.getLabel('advSearch')+"</span></div>"
//        );
        //searching options (checkboxes)
        this.searchingCB = new Element ('div',{
            'class': 'OM_searchingOptions',
            'id': 'OM_maintain_searchingOptions'  
        });
        this.div_top_search.insert(this.searchingCB);     
        //we create the checkbox for Org. Unit (oberving to the click of the user)
        this.org_unit_CB = new Element('input', {
                'type': 'checkbox',
                'id': 'OM_maintain_orgUnitCB',
                'value': 'false',
                'checked' : true,//FF
                'class': 'OM_CB'
            }).observe('click', this.setCheckBoxes.bind(this)); 
        //to check the checkBox in IE
        this.org_unit_CB.defaultChecked = true;
        this.searchByO=true;
        //we insert checkbox and the label in top menu
        this.searchingCB.insert(this.org_unit_CB);
        this.searchingCB.insert(
            "<div class='OM_divCB'>"+global.getLabel('ORGEH')+"</div>"
        );
        //we create the checkbox for Position
        this.position_CB = new Element('input', {
                'type': 'checkbox',
                'id': 'OM_maintain_positionCB',
                'value': 'false',
                'class': 'OM_CB'
            }).observe('click', this.setCheckBoxes.bind(this)); 
        //we insert checkbox and the label in top menu
        this.searchingCB.insert(this.position_CB);
        this.searchingCB.insert(
            "<div class='OM_divCB'>"+global.getLabel('PLANS')+"</div>"
        );
        //we create the checkbox for More results
        this.moreResults_CB = new Element('input', {
                'type': 'checkbox',
                'id': 'OM_maintain_moreResultsCB',
                'value': 'false',
                'class': 'OM_CB'
            }).observe('click', this.setCheckBoxes.bind(this)); 
        //we insert checkbox and the label in top menu
        this.searchingCB.insert(this.moreResults_CB);
        this.searchingCB.insert(
            "<div class='OM_divCB'>"+global.getLabel('allLang')+"</div>"
        );        

        //creating the legend and inserting in main div
        this.div_mainOM.insert(
            "<div id='OM_Maintain_Legend'></div>"
        );
        var legendJSON = { 
            legend: [
                { img: "applicationOM_manager", text: global.getLabel('manager') },
                { img: "applicationOM_staff", text: global.getLabel('staff') },
                { img: "applicationOM_person", text: global.getLabel('PLANS') },
                { img: "applicationOM_folder", text: global.getLabel('ORGEH') }
            ],
            showLabel: global.getLabel('showLgnd'),
            hideLabel: global.getLabel('closeLgnd')
        };
        var legendHTML = getLegend(legendJSON);
        this.OM_MaintainContainer.down('div#OM_Maintain_Legend').update(legendHTML); 
        // Back to root
        this.backToRoot = new Element ('div',{
            'class': 'application_action_link OMdisplay_hideElement OM_backToRoot',
            'id': 'OM_maintain_backToRoot'  
        });
        this.div_mainOM.insert(this.backToRoot);
        this.backToRoot.insert(global.getLabel('backtoroot')); 
        if (this.OM_MaintainContainer.down('div#OM_maintain_backToRoot')) {
            this.OM_MaintainContainer.down('div#OM_maintain_backToRoot').observe('click', this._goToRoot.bind(this));
        }
        //we insert the tree div in main div
        this.div_mainOM.insert(this.treeStructure);
        this.firstRun=false;
    },       
    /**  
    * @param successMethod The method where we want to go after the request
    * @param id Id of the AJAX call
    * @description Method called to retrieve the org structure below a given object
    */    
    callToGetOM: function(successMethod,id){
        //retrive or create necessary values to send to the service
        this.dateFormat = "yyyy-MM-dd"; // when ready, read this format from global
        var parsedDate = this.begDatePicker.actualDate.toString(this.dateFormat);
        var succMethod = Object.isEmpty(successMethod)?"createTree":successMethod; 
        var requestID = null;
        var objectID = null;
        //check if it's a O or a P
        if(Object.isEmpty(id)){
            //is the root
            objectID="";
        }
		else if(id.include('_S_')){
		    //is a P
		    var id_orgUnit = id.split('_')[2];
		    requestID = id;
		    objectID = id_orgUnit;
		}else{
		    // is an O
		    requestID = id;
		    objectID = id;
		}       
        var type = Object.isEmpty(id)?"":"O";
        //create the xml_in of the service
        var xmlGetOM = "<EWS>"
                           + "<SERVICE>"+this.getOMService+"</SERVICE>"
                           + "<OBJECT TYPE='"+type+"'>"+objectID+"</OBJECT> "
                           + "<DEL></DEL>"
                           + "<PARAM>"
                             + "<O_DATE>"+parsedDate+"</O_DATE>"
                             + "<O_DEPTH>2</O_DEPTH>"
                             + "<o_mode>M</o_mode>"
                           + "</PARAM>"
                        + "</EWS>";
        //call the service                        
        this.makeAJAXrequest($H({xml:xmlGetOM, successMethod:succMethod, ajaxID: id})); 		         
    },
    /**  
    * @param event Selected date when we have clicked
    * @description Change the date of two datePickers (beginDate and endDate)
    */    
    changeDatePickers:function (event){
        this.callToGetOM("",this.rootID);
    }, 
    /**  
    * @param args Text entered in autocompleter box
    * @description set the value of the text entered in autocompleter object box and calls to callToGetOptionsSearch function to call search_objects service
    */  
    setSearchText: function(args){    
        //save the text entered    
        this.searchTextAutocompleterValue = this.searchTextAutocompleter.element.value; 
        if (this.searchTextAutocompleterValue.include("["))
            this.searchTextAutocompleterValue = this.searchTextAutocompleterValue.split(" ")[0];
        // Service restriction
        if (this.searchTextAutocompleterValue.length > 12)
            this.searchTextAutocompleterValue = this.searchTextAutocompleterValue.substring(0,12);
        this.callToGetOptionsSearch();
    },
    /**  
    * @param event Element clicked
    * @description set the value checkboxes if change
    */  
    setCheckBoxes:function(event){
        var element = Event.element(event)
        var checked = element.getValue();
        //id of the checkbox clicked
        var id = element.id;
            //if is an O checkbox and is checked we put true, otherwise false
            if(id=="OM_maintain_orgUnitCB"){
                if(checked)
                    this.searchByO=true;
                else  
                    this.searchByO=false; 
            } 
            //if is an S checkbox and is checked we put true, otherwise false
            if(id=="OM_maintain_positionCB"){
                if(checked)
                    this.searchByS=true;
                else    
                    this.searchByS=false;      
            }
            if(id=="OM_maintain_moreResultsCB"){
                if(checked)
                    this.searchByMore=true;
                else    
                    this.searchByMore=false;      
            }            
    }, 
    /**  
    * @param args Object id and id of Dom element
    * @description get the elements for the object selected and call to callToGetOM function to update the tree
    */
    makeSimpleSearch:function(args){
        //this.selected=true;
        if(!Object.isEmpty(getArgs(args)) && (getArgs(args).isEmpty == false)){
            //we look for the element in the hash to get all element for that object
            var elementChosen = this.hashAC.get(getArgs(args).idAdded);
            //if the element is a position the id id different from if is an org. unit
            var orgUnitId = elementChosen.type=='S' ? elementChosen.id : elementChosen.idObject;
            this.searchTextAutocompleterValue=elementChosen.text;
            this.callToGetOM("",orgUnitId);
        }
        else
            this.searchTextAutocompleterValue="";
    },
    goToAdvSearch:function(){
    },
    makeAdvsSearch:function(O_id){
    },
    /**   
    * @param json {json} Object returned from the AJAX call
    * @description Method used to draw the root of the tree, instantiating the treeHandler object
    */      
    createTree:function (json){
        //create just the root of the tree
        var root = null;
        var name = "<![CDATA[<table class='OM_Maintain_alignSpanInTree'>]]>";
        name += "<![CDATA[<tr><td><div class='treeHandler_text_node_content applicationOM_folder OM_iconInTree'></div></td>]]>";
        var type = null;
        var treeXML = null;
        var nodes = json.EWS.o_orgunits.yglui_tab_orginfo;
        nodes = objectToArray(nodes);  // now we have always an Array here        
        //we look for the root node in the json               
        root = nodes[0]["@orgunitid"];
        this.lastOrgUnit = root;
        this.rootID = root;
        if (Object.isEmpty(this.loggedUserOrgUnit))
            this.loggedUserOrgUnit = root;
        if (this.loggedUserOrgUnit == this.rootID) {
            if (this.OM_MaintainContainer.down('div#OM_maintain_backToRoot').hasClassName('OMdisplay_showElement')) {
                this.OM_MaintainContainer.down('div#OM_maintain_backToRoot').removeClassName('OMdisplay_showElement');
                this.OM_MaintainContainer.down('div#OM_maintain_backToRoot').addClassName('OMdisplay_hideElement');
            }
        }
        else {
            if (this.OM_MaintainContainer.down('div#OM_maintain_backToRoot').hasClassName('OMdisplay_hideElement')) {
                this.OM_MaintainContainer.down('div#OM_maintain_backToRoot').removeClassName('OMdisplay_hideElement');
                this.OM_MaintainContainer.down('div#OM_maintain_backToRoot').addClassName('OMdisplay_showElement');
            }
        }
        this.objectDates.set(root, {begdate: Date.parseExact(nodes[0]['@orgbegda'], "yyyy-MM-dd"), enddate: Date.parseExact(nodes[0]['@orgendda'], "yyyy-MM-dd")});
        this.objectNames.set(this.rootID, nodes[0]['@orgunitname']);
        name += "<![CDATA[<td><div class='treeHandler_text_node_content'>"+nodes[0]["@orgunitname"]+ "</tr></table>]]>";
        type = "O";
        //set the header for the XML
        var treeXMLText = '<?xml version="1.0" encoding="utf-8" ?><nodes>';
        var templateNodes = new Template('<node childs="X"><name>#{name}</name><id>#{id}</id><type>#{type}</type></node></nodes>');
        //create the root        
        treeXMLText = treeXMLText.concat(templateNodes.evaluate({
            name: name,
            id: root,
            type: type
        }));
        // creating the XML Document in FF and IE from text
        if (Prototype.Browser.IE) {
            treeXML = XmlDoc.create();
            treeXML.loadXML(treeXMLText);
        }
        else {
            var parser = new DOMParser();
            treeXML = parser.parseFromString(treeXMLText, "text/xml");
        } 
        //creating new TreeHandler
        //we have to stop observing the click of the old tree
        this.treeStructure.stopObserving("click");
		if (this.orgTree) {
			this.orgTree.unbindGetNewXml();
			this.treeStructure.down().remove();
			delete this.orgTree;
		}
        this.orgTree = new TreeHandler('OM_maintainTree', treeXML);
        // Expanding root node
        this.orgTree.clickedParent = this.OM_MaintainContainer.down('[id=OM_maintainTree]').down().identify();
        this.orgTree.elementClicked = this.OM_MaintainContainer.down('[id=OM_maintainTree]').down().down();
        this.clickOnNode("", this.OM_MaintainContainer.down('[id=OM_maintainTree]').down().identify());
    },
    /**   
    * @param event Information about the event
    * @param id Clicked node's id
    * @description Method used to get the id of the node where the used clicked, and call to get the OM structure of it
    */       
    clickOnNode:function(event, id){
        //retrieve id from event info, and call callToGetOM in order to expand the tree
		var clickedId = Object.isEmpty(id) ? getArgs(event) : id;
		if(!clickedId.include('OM_maintainTree')) return;
		var id = clickedId.sub('_' + 'OM_maintainTree', '');
		//call to the service, specifying the success method
        this.callToGetOM("expandTree",id);
    },
    /**   
    * @param json Object returned from the AJAX call
    * @param parentID Id of the AJAX call    
    * @description Method used to draw the children of the parentID object
    */     
    expandTree:function (json, parentID){
        //start building the xml
        var newXmlDoc = '<?xml version="1.0" encoding="utf-8" ?><nodes>';
        var templateNewNode = new Template('<node childs="#{hasChilds}"><name>#{name}</name><id>#{id}</id><type>#{type}</type></node>');
        //check if it's a position --> the parent tree is already drawn, we just have to show the employee name
        if(! parentID.include('_S_')){
            //It's a O --> draw the tree
            //variables for each node of the tree
            var name = null;
            var id = null;
            var nodeHasChilds = null; 
            //now, we retrieve the Ps, from the json
            if (!Object.isEmpty(json.EWS.o_positions)) {
                var nodesS = objectToArray(json.EWS.o_positions.yglui_tab_posinfo);          
                //loop in S        
                for (var i = 0; i < nodesS.length; i++) {
                    var node = nodesS[i];
                    if (node["@managerflag"] == "X") {
                        id = node["@positionid"];
                        var root = node["@orgunitid"];
                        var objname = Object.isEmpty(node["@positionname"]) ? "" : this.getRigthText(node["@positionname"]);
                        this.objectDates.set(id, {begdate: Date.parseExact(node['@posbegda'], "yyyy-MM-dd"), enddate: Date.parseExact(node['@posendda'], "yyyy-MM-dd")});
                        this.objectNames.set(id, this.objectNames.get(node['@orgunitid']));
                        //check that his parent is the node we want to expand
                        if(root == parentID){
                            name = "<![CDATA[<table class='OM_Maintain_alignSpanInTree'>]]>";
                            name += "<![CDATA[<tr><td><div class='applicationOM_manager treeHandler_text_node_content OM_iconInTree'></div></td>]]>";
                            name += "<![CDATA[<td><div class='treeHandler_text_node_content'>"+objname+ "</tr></table>]]>";          
                            nodeHasChilds = Object.isEmpty(node["@employeename"])? "": "X";
                            var newNodeXml = templateNewNode.evaluate({
                                name: name,
                                id: id+"_S_"+root+"_"+objname.gsub(' ','--'),
                                type: "S",
                                hasChilds: nodeHasChilds
                            });
                            newXmlDoc += newNodeXml;
                        }
                    }
                }  
                for (var i = 0; i < nodesS.length; i++) {
                    var node = nodesS[i];
                    if (node["@managerflag"] != "X") {
                        id = node["@positionid"];
                        var root = node["@orgunitid"];
                        var objname = Object.isEmpty(node["@positionname"]) ? "" : this.getRigthText(node["@positionname"]);
                        this.objectDates.set(id, {begdate: Date.parseExact(node['@posbegda'], "yyyy-MM-dd"), enddate: Date.parseExact(node['@posendda'], "yyyy-MM-dd")});
                        this.objectNames.set(id, this.objectNames.get(node['@orgunitid']));
                        //check that his parent is the node we want to expand
                        if(root == parentID){
                            name = "<![CDATA[<table class='OM_Maintain_alignSpanInTree'>]]>";
                            name += "<![CDATA[<tr><td><div class='applicationOM_person treeHandler_text_node_content OM_iconInTree'></div></td>]]>";
                            name += "<![CDATA[<td><div class='treeHandler_text_node_content'>"+objname+ "</tr></table>]]>";          
                            nodeHasChilds = Object.isEmpty(node["@employeename"])? "": "X";
                            var newNodeXml = templateNewNode.evaluate({
                                name: name,
                                id: id+"_S_"+root+"_"+objname.gsub(' ','--'),
                                type: "S",
                                hasChilds: nodeHasChilds
                            });
                            newXmlDoc += newNodeXml;
                        }
                    }
                } 
            }        
            //first, we retrieve the Os, from the json  
            var nodesO = json.EWS.o_orgunits.yglui_tab_orginfo;
            nodesO = objectToArray(nodesO);  // now we have always an Array here                      
            //loop in O        
            for (var i = 0; i < nodesO.length; i++) {
                var node = nodesO[i];
                id = node["@orgunitid"];
                var root = node["@orgunitrootid"];
                var objname = Object.isEmpty(node['@orgunitname']) ? "" : this.getRigthText(node['@orgunitname']);
                this.objectDates.set(id, {begdate: Date.parseExact(node['@orgbegda'], "yyyy-MM-dd"), enddate: Date.parseExact(node['@orgendda'], "yyyy-MM-dd")});
                this.objectNames.set(id, objname);
                //check that is not the root, and his parent is the node we want to expand
                if((id != root) && (root == parentID)){
                    var cssIcon = node["@staffflag"] == "X"? "applicationOM_staff" : "applicationOM_folder";
                    name = "<![CDATA[<table class='OM_Maintain_alignSpanInTree'>]]>";
                    name += "<![CDATA[<tr><td><div class='treeHandler_text_node_content "+cssIcon+" OM_iconInTree'></div></td>]]>";
                    name += "<![CDATA[<td><div class='treeHandler_text_node_content'>"+objname+ "</tr></table>]]>";        
                    nodeHasChilds = (node["@totalpositions"]>0 || node["@hasorgunitchild"]=="X")? "X": "";
                    var newNodeXml = templateNewNode.evaluate({
                        name: name,
                        id: id,
                        type: "O",
                        hasChilds: nodeHasChilds
                    });
                    newXmlDoc += newNodeXml;
                }
            }      
            newXmlDoc += '</nodes>';            		                  
        }else{        
            //is a P
            var id_orgUnit = parentID.split('_')[2]; 
            var id_position = parentID.split('_')[0];
            //now, we retrieve the Ps, from the json
            var nodesP = json.EWS.o_positions.yglui_tab_posinfo;
            nodesP = objectToArray(nodesP);             
            var name = null;
            var id = null;                        
            //loop in P      
            for (var i = 0; i < nodesP.length; i++) {
                //we have to find the position where the user clicked, and show the employee name below it in the tree
                var node = nodesP[i];
                var objname = Object.isEmpty(node["@employeename"]) ? "" : this.getRigthText(node["@employeename"]);
                name = "<![CDATA[<table class='OM_Maintain_alignSpanInTree'>]]>";
                name += "<![CDATA[<tr><td><div class='treeHandler_text_node_content'></div></td>]]>";
                name += "<![CDATA[<td><div class='treeHandler_text_node_content'>"+objname+ "</tr></table>]]>";  
                id = node["@positionid"];
                var root = node["@orgunitid"];
                var empId = node["@employeeid"];
                var nodeHasChilds = "";
                this.objectDates.set(empId, {begdate: Date.parseExact(node['@empbegda'], "yyyy-MM-dd"), enddate: Date.parseExact(node['@empendda'], "yyyy-MM-dd")});
                this.objectNames.set(empId, id);
                if((id == id_position) && (root == id_orgUnit)){ 
                    var newNodeXml = templateNewNode.evaluate({
                        name: name,
                        id: empId,
                        type: "P",
                        hasChilds: nodeHasChilds
                    });
                    newXmlDoc += newNodeXml;                
                }              
            } 
            newXmlDoc += '</nodes>';                    
        }
        //creating the new nodes with the XML created on top
        var newTreeXML;
        if (Prototype.Browser.IE) {
            newTreeXML = XmlDoc.create();
            newTreeXML.loadXML(newXmlDoc);
        }
        else {
            var parser = new DOMParser();
            newTreeXML = parser.parseFromString(newXmlDoc, "text/xml");
        }
        var xmlNodeId = parentID;
        var parentOrganisationalUnitId = parentID + '_' + 'OM_maintainTree';
        var leafNodeRequesting = selectSingleNodeCrossBrowser(this.orgTree.xmlDoc, "/nodes//node[id='" + xmlNodeId + "']");
        var newChilds = selectNodesCrossBrowser(newTreeXML, "/nodes//node");
        for (var i = 0; i < newChilds.length; i++) {
            newChildsCopy = newChilds[i].cloneNode(true);
            leafNodeRequesting.appendChild(newChildsCopy);
        }
        //fire the tree event indicating that we have the childs
        document.fire('EWS:treeHandler_GiveMeXml_done', {
            xml: newTreeXML,
            clicked: parentOrganisationalUnitId
        });       
    },
    /**   
    * @param event Information about the event  
    * @description Used to call the service which gives the possible actiosn for a given object, taking into account the user's role
    */      
    callToGetActions:function(event){
        //retrieve id from event info, and call callToGetOM in order to expand the tree
		var clickedId = getArgs(event);
		var nodeName = clickedId._object.nodeName;
		var parsedDate = this.begDatePicker.actualDate.toString(this.dateFormat);
		var type = null;
        var objectID = null;
        var divId_aux = null;
        var divId = null;	
        var name = null;
        //now we have to get the id, type, and div where the text of the node is.	
		if(nodeName.include('_S')){
		//position
		    type = "S";
		    objectID = nodeName.split('_')[0];
		    divId_aux = nodeName.split('_')[0]+"_S_"+nodeName.split('_')[2]+"_"+nodeName.split('_')[3]+"_"+clickedId._object.treeName;	
		    name = 	nodeName.split('_')[3];
		}else if(nodeName.include('_P')){
		//person
		    type = "P";
		    objectID = nodeName.split('_')[0];
		    divId_aux = nodeName.split('_')[0]+"_"+clickedId._object.treeName;	
		}else if(nodeName.include('_O')){
		//org. unit
		    type = "O";
		    objectID = nodeName.split('_')[0];
		    divId_aux = nodeName.split('_')[0]+"_"+clickedId._object.treeName;	
		}
		divId = ($(divId_aux).select('.treeHandler_pointer')[0]).identify();

		//create the xml_in
        var xmlGetActions = "<EWS>"
                           +" <SERVICE>"+this.getActionsService+"</SERVICE>"
                           +" <OBJECT TYPE='"+type+"'>"+objectID+"</OBJECT> "
                           +" <DEL></DEL>"
                           +" <PARAM>"
                             +" <O_DATE>"+parsedDate+"</O_DATE>"
                           +" </PARAM>"
                        +"</EWS>";		    
        //call the service                        
        this.makeAJAXrequest($H({xml:xmlGetActions, successMethod:"createActionsBalloon", ajaxID: $H({div: divId, param: this.objectNames.get(objectID), name: name})}));    
    },
    /**   
    * @param json Object returned from the AJAX call
    * @param params Parameters needed
    * @description Creates the balloon with the actions
    */     
    createActionsBalloon:function(json,params){
        //creating variables to read the json
        var clickedId = params.get('div');   
        var param = params.get('param');
        var name = params.get('name');
        var actions =  objectToArray(json.EWS.o_actions.yglui_tab_act);
        if (Object.isEmpty(this.actionLabels)) {
            this.actionLabels = new Hash();
            var labels = objectToArray(json.EWS.labels.item);
            for (var i = 0; i < labels.length; i++) {
                this.actionLabels.set(labels[i]['@id'].toUpperCase(), labels[i]['@value']);
            }
        }
        var parsedDate = this.begDate.toString(this.dateFormat);
        //loop in the actions
        var cssClass = "application_action_link";
        var title = global.getLabel('possibleActions');  
        var balloon_content = "<p><div><b>"+title+"</b></div><br />";   
        for (var i = 0; i < actions.length; i++) {
            var node = actions[i];
            var action = node["@mess_cod"];
            var title = node;
            cssClass = "application_action_link";          
            if (action.include('DEL') && Object.isEmpty(json.EWS.o_delete)){               
                cssClass = "application_main_soft_text";
            }
            if (action.include('LIM') && Object.isEmpty(json.EWS.o_delete)){               
                cssClass = "application_main_soft_text";
            }
            var objectType = action.split('_')[1];
            var objectId = clickedId.split('_')[2];
            if(action=='ACT_O_DEL' || action=='ACT_P_DEL' || action=='ACT_S_DEL')
                this.hashToSend=this.objectDates.get(objectId).begdate.toString("yyyy-MM-dd");
            else if(action=='ACT_O_LIM' || action=='ACT_P_LIM' || action=='ACT_S_LIM'){
                this.hashToSend=new Array();
                this.hashToSend.push(this.objectDates.get(objectId).begdate.toString("yyyy-MM-dd"));
                this.hashToSend.push(this.objectDates.get(objectId).enddate.toString("yyyy-MM-dd"));
            }
            
            switch (action) {
                case 'ACT_O_POS':
                    objectType = 'S';
                case 'ACT_O_CREA':
                    var app = "OM_MaintObjCreate";
                    var line = "<div><span id='OM_action" + action + "' class='"+cssClass+"' onClick='javascript:document.fire(\"EWS:openApplication\", $H({app:\"" + app + "\", node:\""+objectId+"\", objectType:\""+objectType+"\", date:\""+parsedDate+"\", root:\"" + param + "\"}))'>"+this.actionLabels.get(action)+"</span></div>";    
                    break;
                case 'ACT_O_EDI':
                case 'ACT_S_EDI':
                    var app = "OM_MaintObjModify";
                    var line = "<div><span id='OM_action" + action + "' class='"+cssClass+"' onClick='javascript:document.fire(\"EWS:openApplication\", $H({app:\"" + app + "\", node:\""+objectId+"\", objectType:\""+objectType+"\", begdate:\""+ this.objectDates.get(objectId).begdate.toString("yyyy-MM-dd") + "\", enddate:\""+ this.objectDates.get(objectId).enddate.toString("yyyy-MM-dd") +"\", date:\""+parsedDate+"\", root:\"" + param + "\", parentId:\"" + this.rootID + "\"}))'>"+this.actionLabels.get(action)+"</span></div>";    
                    break;       
                case 'ACT_O_VIE':
                case 'ACT_S_VIE':
                    var app = "OM_MaintObjView";
                    var line = "<div><span id='OM_action" + action + "' class='"+cssClass+"' onClick='javascript:document.fire(\"EWS:openApplication\", $H({mode:\"popUp\", app:\"" + app + "\", node:\""+objectId+"\", objectType:\""+objectType+"\", begdate:\""+ this.objectDates.get(this.rootID).begdate.toString("yyyy-MM-dd") + "\", enddate:\""+ this.objectDates.get(this.rootID).enddate.toString("yyyy-MM-dd") +"\", root:\"" + param + "\"}))'>"+this.actionLabels.get(action)+"</span></div>";    
                    break;
                case 'ACT_P_VIE':
                    var app = "OM_MaintObjView";
                    var line = "<div><span id='OM_action" + action + "' class='"+cssClass+"' onClick='javascript:document.fire(\"EWS:openApplication\", $H({mode:\"popUp\", app:\"" + app + "\", node:\""+objectId+"\", objectType:\""+objectType+"\", begdate: \"" + this.begDatePicker.actualDate.toString(this.dateFormat) + "\", position: \"" + param + "\"}))'>"+this.actionLabels.get(action)+"</span></div>";    
                    break;
                case 'ACT_O_DEL':
                    var app = "OM_DeleteDelimit";
                    if(cssClass!='application_main_soft_text')
                        var onClickDeleteDelimit= "'javascript:document.fire(\"EWS:openApplication\", $H({mode:\"popUp\", app:\"" + app + "\", appToOpen: \"OM_DeleteDelimitObject\" ,action:\"D\", node:\""+objectId+"\", objectType:\""+objectType+"\", hash:\""+this.hashToSend+"\"}))'";
                    else
                        var onClickDeleteDelimit='""';
                    var line = "<div><span id='OM_action" + action + "' class='"+cssClass+"' onClick="+onClickDeleteDelimit+">"+this.actionLabels.get(action)+"</span></div>";    
                    break;
                 case 'ACT_P_DEL':
                    var app = "OM_DeleteDelimit";
                    if(cssClass!='application_main_soft_text')
                        var onClickDeleteDelimit= "'javascript:document.fire(\"EWS:openApplication\", $H({mode:\"popUp\", app:\"" + app + "\", appToOpen: \"OM_DeleteDelimitObject\" ,action:\"D\", node:\""+objectId+"\", objectType:\""+objectType+"\", hash:\""+this.hashToSend+"\"}))'";
                    else
                        var onClickDeleteDelimit='""';
                    var line = "<div><span id='OM_action" + action + "' class='"+cssClass+"' onClick="+onClickDeleteDelimit+">"+this.actionLabels.get(action)+"</span></div>";    
                    break;
                case 'ACT_S_DEL':
                     var app = "OM_DeleteDelimit";
                    if(cssClass!='application_main_soft_text')
                        var onClickDeleteDelimit= "'javascript:document.fire(\"EWS:openApplication\", $H({mode:\"popUp\", app:\"" + app + "\", appToOpen: \"OM_DeleteDelimitObject\" ,action:\"D\", node:\""+objectId+"\", objectType:\""+objectType+"\", hash:\""+this.hashToSend+"\"}))'";
                    else
                        var onClickDeleteDelimit='""';
                    var line = "<div><span id='OM_action" + action + "' class='"+cssClass+"' onClick="+onClickDeleteDelimit+">"+this.actionLabels.get(action)+"</span></div>";    
                    break;
                case 'ACT_S_LIM':
                    var app = "OM_DeleteDelimit";
                    if(cssClass!='application_main_soft_text')
                        var onClickDeleteDelimit= "'javascript:document.fire(\"EWS:openApplication\", $H({mode:\"popUp\", app:\"" + app + "\", appToOpen: \"OM_DeleteDelimitObject\" ,action:\"L\", node:\""+objectId+"\", objectType:\""+objectType+"\", hash:\""+this.hashToSend+"\"}))'";
                    else
                        var onClickDeleteDelimit='""';
                    var line = "<div><span id='OM_action" + action + "' class='"+cssClass+"' onClick="+onClickDeleteDelimit+">"+this.actionLabels.get(action)+"</span></div>";    
                    break;
                case 'ACT_P_LIM':
                    var app = "OM_DeleteDelimit";
                    if(cssClass!='application_main_soft_text')
                        var onClickDeleteDelimit= "'javascript:document.fire(\"EWS:openApplication\", $H({mode:\"popUp\", app:\"" + app + "\", appToOpen: \"OM_DeleteDelimitObject\" ,action:\"L\", node:\""+objectId+"\", objectType:\""+objectType+"\", hash:\""+this.hashToSend+"\"}))'";
                    else
                        var onClickDeleteDelimit='""';
                    var line = "<div><span id='OM_action" + action + "' class='"+cssClass+"' onClick="+onClickDeleteDelimit+">"+this.actionLabels.get(action)+"</span></div>";    
                    break;
                case 'ACT_O_LIM':
                    var app = "OM_DeleteDelimit";
                    if(cssClass!='application_main_soft_text')
                        var onClickDeleteDelimit= "'javascript:document.fire(\"EWS:openApplication\", $H({mode:\"popUp\", app:\"" + app + "\", appToOpen: \"OM_DeleteDelimitObject\" ,action:\"L\", node:\""+objectId+"\", objectType:\""+objectType+"\", hash:\""+this.hashToSend+"\"}))'";
                    else
                        var onClickDeleteDelimit='""';
                    var line = "<div><span id='OM_action" + action + "' class='"+cssClass+"' onClick="+onClickDeleteDelimit+">"+this.actionLabels.get(action)+"</span></div>";    
                    break;
                case 'ACT_P_ASS':   
                    var app = "OM_ManageHolderAssign";
                    var line = "<div><span id='OM_action" + action + "' class='"+cssClass+"' onClick='javascript:document.fire(\"EWS:openApplication\", $H({app:\"" + app + "\", node:\""+objectId+"\", objectType:\""+objectType+"\", root:\"" + param + "\" , begdate:\""+ this.objectDates.get(this.rootID).begdate.toString("yyyy-MM-dd") + "\", enddate:\""+ this.objectDates.get(this.rootID).enddate.toString("yyyy-MM-dd") +"\"}))'>"+this.actionLabels.get(action)+"</span></div>";    
                    break;
                case 'ACT_S_ASS':
                    var app = "OM_HolderAssign";
                    var line = "<div><span id='OM_action" + action + "' class='"+cssClass+"' onClick='javascript:document.fire(\"EWS:openApplication\", $H({app:\"" + app + "\", node:\""+objectId+"\", name:\"" + name + "\", objectType:\""+objectType+"\", date:\""+parsedDate+"\", root:\"" + param + "\"}))'>"+this.actionLabels.get(action)+"</span></div>";    
                    break;
                case 'ACT_S_CHA':
                    var app = "OM_PosAssign";
                    var line = "<div><span id='OM_action" + action + "' class='"+cssClass+"' onClick='javascript:document.fire(\"EWS:openApplication\", $H({app:\"" + app + "\", node:\""+objectId+"\"}))'>"+this.actionLabels.get(action)+"</span></div>";    
                    break;
                default:
                    var line = "<div><span id='OM_action" + action + "' class='"+cssClass+"'>"+this.actionLabels.get(action)+"</span></div>";
                    break;
            }
            balloon_content += line; 
        }
        if (this.rootID == clickedId.split("_")[2]){
            var action = global.getLabel('MassTrans');
            var massTransApp = "OM_MassTrans";
            var line = "<div><span id='OM_action" + action + "' class='"+cssClass+"' onClick='javascript:document.fire(\"EWS:openApplication\", $H({app:\"" + massTransApp + "\", node:\""+this.rootID+"\", date:\""+parsedDate+"\"}))'>"+action+"</span></div>";
            balloon_content += line;           
        } 
        balloon_content += "</p>";
        //instantiate the balloon
        balloon.showOptions($H({domId: clickedId, content: balloon_content}));
    },
    /**
    * @param $super Superclass
    * @description called when the application is not shown.
    */       
    close: function($super) {
        $super();
        document.stopObserving("EWS:treeHandler_GiveMeXml", this.clickOnNodeBinding);
        document.stopObserving("EWS:treeHandler_textClicked", this.callToGetActionsBinding);
        document.stopObserving("EWS:autocompleterResultSelected", this.makeSimpleSearchBinding);
        document.stopObserving("EWS:datepicker_WrongDate", this.changeDatePickersBinding); 
        document.stopObserving("EWS:datepicker_CorrectDate", this.changeDatePickersBinding); 
        document.stopObserving("EWS:autocompleterGetNewXml", this.setSearchTextBinding); 
    },
    /**
     *@description Shows the root node
     */
    _goToRoot: function() {
        this.searchTextAutocompleter.clearInput();
        this.callToGetOM("", this.loggedUserOrgUnit);
    },
        /**
    *@description Method to treat special characters 
    */
    getRigthText: function(text) {
        if (text.include('&'))
            text = text.gsub('&', '&amp;');
        if (text.include('<'))
            text = text.gsub('<', '&lt;');
        if (text.include('>'))
            text = text.gsub('<', '&gt;');
        if (text.include('"'))
            text = text.gsub('"', '&quot;');
        if (text.include("'"))
            text = text.gsub("'", '&apos;');
        return text;
    }
});


var OM_Maintain = Class.create(OM_Maintain_standard, {
    initialize: function($super) {
        $super('OM_Maintain');
    },
    run: function($super,args) {
        $super(args);
    },
    close: function($super) {
        $super();
    }
});
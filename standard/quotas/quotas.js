/*
 *@fileoverview quotas.js
 *@desc  contains definition and implementation of quota's application
 */
/*
 *@class QOT
 *@desc class with implementation of a sortabletable that is going to contains negative time counters of one or several employees.
        This class inherits from Application's super class.
 */
var QOT = Class.create(Application,{
    /*
     * @method initialize
     * @param $super {Class} Quota calls the constructor of the super class Application
     * @param appName {String} Name of the application selected, quota in this case
     * @desc It creates a new quota instance
     */
	initialize: function($super) {
	    //we call the constructor of the superclass, with the name of the application
	    $super('QOT'); 
	    //name of the service to get the labels of negative counters table
	    this.labelService = "GET_QUOTAS_LABELS";
	    //name of the service with the information of the negative counters of one employee
	    this.quotaService = "GET_QUOTAS";
	    //name of the method we are going to call when the first service is done
	    this.successlabelService = 'getQuotaLabels';
	    //name of the method we are going to call when an employee had been selected
	    this.successquotaService = 'fillNegativeQuotas';
	    //array that is going to contain each employee we select in left menu
		this.number_employees = new Array();
		//event bindings
		this.employeeSelectedHandlerBinding = this.employeeSelectedHandler.bindAsEventListener(this);
        this.employeeUnselectedHandlerBinding = this.employeeUnselectedHandler.bindAsEventListener(this);
	    this.employeeColorChangedHandlerBinding = this.employeeColorChangedHandler.bindAsEventListener(this);
	 },
    
	/*
     * @method run
     * @param $super {Class} Quota calls super class Application
     * @desc Quota calls to the run method of the super class and calls the method to get the labels of the negative counters table
     */
	run:function($super){
	    $super();	
	    //we attach the events fired when we select an employee from the left menu, we unselect an employee or we change the color of the name of an employee 
	    document.observe("EWS:employeeSelected",this.employeeSelectedHandlerBinding);
		document.observe("EWS:employeeUnselected",this.employeeUnselectedHandlerBinding);
		document.observe("EWS:employeeColorChanged", this.employeeColorChangedHandlerBinding);
	    //if it's the first time we enter in the application
	    if(this.firstRun){
	        //we make an empty table
	        this.makeEmptyTable();
	        //we make "GET_QUOTAS_LABELS" service and after that we call 'getQuotaLabels' method
	        this.firstCallSap_negative(this.labelService,this.successlabelService);  
	    }
	    else{
	        //if it's not the first time, we test if the user is a manager or not
	        this.testIfManager();
	    }
	},
	/*
     * @method close
     * @param $super {Class} Quota calls super class Application
     * @desc stop listening the events that we put inside, to react to them only when we run our application
     */
	close:function($super){
          $super();  
          document.stopObserving("EWS:employeeSelected", this.employeeSelectedHandlerBinding);
          document.stopObserving("EWS:employeeUnselected", this.employeeUnselectedHandlerBinding);
          document.stopObserving("EWS:employeeColorChanged", this.employeeColorChangedHandlerBinding);  
      },
	/*
     * @method makeEmptyTable
     * @desc Makes an empty table
     */
	makeEmptyTable: function(){
        //we create the title we insert in quota's content
        this.virtualHtml.insert(
            "<div  id='quota_date' class='application_main_title2 quota_alignDate'></div>"+
            "<div class='quota_alignDivNegative'><span id='quota_negativeTitle' class='application_main_title3 quota_alignTitleTable'></div>"
        );
	},
	/*
     * @method testIfManager
     * @desc Test if the employee is manager or not, if is manager we can show several employees in the table by selecting in 
        left menu, and if in not a manager, we can show only the quota's negative time for this employee.
     */
	testIfManager: function(){
	    //is an employee, we have to show only the quota for this employee, and he can not see the left menu
	    if(!global.getLoggedUser().isManager){
	        //i test if i have introduced the employee in the table, by testing the number of employees in the array, 
	        //if the employee is in the table and i go to other application and go back, this code don't execute again
	        if(this.number_employees.length==0){   
	            //we get the id and we call the function to add an employee in the negative counters table
	            //this.employee = global.getLoggedUser().id;
	            this.employeeSelectedHandler(global.getLoggedUser().id);
	        }
	    }
	    //is a manager, he can see the left menu and select several employees
	    else{
	        //in the case we have employees in the left menu that they are not in the table	        
	        global.getSelectedEmployees().each(function(pair) {
	            var callSAP = true;
	            var i=0;
	            //we loop over our array
	            while(i<this.number_employees.length){
                    if(pair.key==this.number_employees[i].split('_')[1]){
                        callSAP = false; 
                        //we change the color is changes
                        this.employeeColorChangedHandler(this.number_employees[i].split('_')[1]); 
                        break;
                    }
                    i++;
                }
                //we call to add an employee if there is someone that he has been selected and is not in the table yet
                if (callSAP) {
                    this.employeeSelectedHandler(pair.key);
                }
                
            }.bind(this));  
            //if the number of employees in the left menu is less than in the table 
            var j=0;                
            while(j<this.number_employees.length){
                var keepEmp=false;
                //we do a loop over global.getSelectedEmployees to see if the number of the employees in my array is the same as the left menu
                global.getSelectedEmployees().each(function(pair){                  
                    if((!keepEmp)&&(this.number_employees[j].split('_')[1]==pair.key)){keepEmp = true; j++;}
                }.bind(this));
                if(!keepEmp){
                    //then we delete the employees that they have not to be in the table
                    this.employeeUnselectedHandler(this.number_employees[j].split('_')[1]); 
                    j=0;                        
                }                    
            }
            //if we have not selected employees in the left menu, we delete all the employees in the table
            if(global.getSelectedEmployees().size()== 0 && this.number_employees.length!=0){
                for(var k=0; k<this.number_employees.length; k++){
                    this.employeeUnselectedHandler(this.number_employees[k].split('_')[1]);
                }
            }
            //if we have selected no employees and nothing has to be shown we hide the table and show the quota_info text
            if(global.getSelectedEmployees().size()== 0 && this.number_employees.length==0){this.virtualHtml.down('[id=quota_table]').hide(); this.virtualHtml.down('[id=quota_info]').show();}       
	    }    
	},
	/*
     * @method firstCallSap_negative
     * @param service {Service} we need this service to get the labels we're going to show in the table of negative time counters
     * @param method {function} when the service is done we call getQuotaLabels method
     * @desc It make a service to SAP to get the negative time counters labels, and then it calls getQuotaLabels method
     */
	firstCallSap_negative: function(service,method){
	    this.xml = "<OpenHR><SERVICE>"+service+"</SERVICE><ToSAP><employee id='"+global.getLoggedUser().id+"'/></ToSAP></OpenHR>";		
	    this.makeAJAXrequest($H({xml:this.xml, successMethod: method}));
	},
	/*
     * @method getQuotaLabels
     * @param json {json} json we get after make "GET_QUOTAS_LABELS" service to SAP
     * @desc Get the labels we need to show in the table from json 
     */
	getQuotaLabels: function(json){
        //we call this method to create the table with the appropiate labels
	    this.buildHtmlTable(json);
	    //we call testIfManager
	    this.testIfManager();
	},
	/*
     * @method buildHtmlTable
     * @param json {json} json that we get after doing "GET_QUOTAS_LABELS" service 
     * @desc Make the the table that is going to contain the negative counters 
     */
	buildHtmlTable : function(json){
	    //we get the date from the json
	    var quotaDate = json.OpenHR.date["#text"];
	    //date formatted
	    var date=(Date.parseExact(quotaDate,'yyyyMd')).toString('dd.MM.yyyy');
	    //we put the title of the applicaction
	    this.virtualHtml.down('[id=quota_date]').update(this.labels.get('title')+"  "+date);
	    //this.updateTitle(this.labels.get('title')+"  "+date);
	    //we create the div that is going to contains the empty table
	    this.negative_quota = new Element('div', {
            'id': 'quota_negative_time',
            'class': 'quota_positionDivTable'
        });
	    //we put the title of the table
	    this.virtualHtml.down('[id=quota_negativeTitle]').update(this.labels.get('Negative_Time'));
	    var quota_noQuotaMessage = this.labels.get("no_quota_found").gsub('for', '').strip();
        this.negative_quota.update( 
            "<table id='quota_table' class='sortable resizable quota_alignTable'>"
                +"<thead>"
                    +"<tr>"
                        +"<th class='table_sortfirstdesc quota_headerName'>"+ this.labels.get('name') +"</th>"
                        +"<th class='quota_headerType'>"+ this.labels.get('quota_type')+ "</th>"
                        +"<th class='quota_headerUnit'>" +this.labels.get('unit')+ "</th>"
                        +"<th class='quota_headerUntill'>" +this.labels.get('valid_untill')+ "</th>"
                        +"<th>" +this.labels.get('initial')+ "</th>"
                        +"<th class='quota_headerRemaining'>"+ this.labels.get('remaining')+ "</th>"
                        +"<th>"+this.labels.get('pending')+"</th>"
                        +"<th class='quota_headerAlrApp'>"+this.labels.get('approved')+"</th>"
                    +"</tr>"
                +"</thead>"
                +"<tbody id='quota_negative_counters'>"
                    +"<tr id='quota_blank_line'>"
                        +"<td></td>"
                        +"<td></td>"
                        +"<td></td>"
                        +"<td></td>"
                        +"<td></td>"
                        +"<td></td>"
                        +"<td></td>"
                        +"<td></td>"
                    +"</tr>"
	            +"</tbody>"
	         +"</table>"
	         +"<div id='quota_info' class='application_main_soft_text quota_alignText'>"+ global.getLabel("selectEmployeePlease") +"</div>"
	         +"<div id='quota_noQuotas' class='application_main_soft_text quota_alignText'>"+ quota_noQuotaMessage + "</div>");
	         
	     //we insert th table in the quota content
	     this.virtualHtml.insert(this.negative_quota);
	     //we hide the information that at the beginning is not nedded
	     this.virtualHtml.down('[id=quota_info]').hide();
	     this.virtualHtml.down('[id=quota_noQuotas]').hide();
	     //we create an object of the tableKit class
	     TableKit.Sortable.init("quota_table");
	     //we hide the table until we select an employee
	     this.virtualHtml.down('[id=quota_table]').hide();
	},
	/*
     * @method employeeSelectedHandler
     * @param xmlMessage {String} Message we get when attach the event after selecting an employee
     * @param callerObj {Long} Id of the selected employee
     * @desc Makes a service to SAP to get the information about the negative counter of an employee 
     */
	employeeSelectedHandler: function(event) {
		
		var callerObj = getArgs(event);
	    //we do a loop over the array that has the json from sap  
        this.xml = "<OpenHR><SERVICE>"+this.quotaService+"</SERVICE><ToSAP><employee id='"+callerObj+"'/></ToSAP></OpenHR>";		
        this.makeAJAXrequest($H({xml:this.xml, successMethod: this.successquotaService,informationMethod: this.successquotaService}));  
        
	},
	/*
     * @method employeeUnselectedHandler
     * @param xmlMessage {String} Message we get when attach the event after unselecting an employee
     * @param callerObj {Long} Id of the unselected employee
     * @desc Delete from the table the employee that is unselected in the left menu
     */
	employeeUnselectedHandler: function(event){
		var callerObj = getArgs(event);
	    var i=0, j=0;
	    //id of the employee
	    var employeeId = callerObj;
	    //if the employee exits in the table
	    while(this.virtualHtml.down("[id=quota_"+employeeId+"_"+i+"]")){
	        //we remove it
	        this.virtualHtml.down("[id=quota_"+employeeId+"_"+i+"]").remove();
	        //we remove the employee from the Array too
	        this.number_employees=this.number_employees.without("quota_"+employeeId+"_"+i);
	        i++;
	    }    
	    //if i have unselected an employee that has no quotas
	    while(j<this.number_employees.length){
	        if(this.number_employees[j]== "quota_"+employeeId+"_x"){
	            //we delete from the array
	            this.number_employees=this.number_employees.without("quota_"+employeeId+"_x");
	            break;
	        }
	        j++;
	    }
	    //if we have no employees to show with quotas, we hide the table
	    if(this.virtualHtml.down('[id=quota_negative_counters]').rows.length==0){
	        this.virtualHtml.down('[id=quota_negative_counters]').insert("<tr id='quota_blank_line'><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td></tr>");
	        this.virtualHtml.down('[id=quota_table]').hide();
	        this.testIfOnlyNoQuotas();
	    }
	    //if we have selected no employees, we show "Select an employee"
	    if(this.number_employees.length==0){
	        this.virtualHtml.down('[id=quota_info]').show();
	        this.virtualHtml.down('[id=quota_noQuotas]').hide();
	    }  
	    //we reload the table
	    TableKit.reloadTable("quota_table");
	},
	/*
     * @method fillNegativeQuotas
     * @param json {json} json that we get after doing "GET_QUOTAS" service or after get the json from the array of the readed xmls
     * @desc fill a row of the table with the information about negative counters of the employee selected in the left menu
     */
	fillNegativeQuotas: function(json){
	    var employeeId;
	    //we get the id of the employee from the json if has quotas
	    if(json.OpenHR.message.type !='I')
	        employeeId= json.OpenHR.quotas.quota.employee['@id'];
	    //or if the enployee has no quotas
	    else{employeeId = json.OpenHR.employee;}
	    //if the employee is selected in the left menu otherwise i do nothing
	    if(!global.getLoggedUser().isManager || global.getEmployee(employeeId).selected){
	        //we get the date format from global
	        var format = global.getOption('dateFormat').strip();
	        //If the employee has quota's time, the type is different from 'I'
	        if(json.OpenHR.message.type !='I'){ 
	            //we remove the blank_line if exists
	            if(this.virtualHtml.down('[id=quota_blank_line]')){
	                this.virtualHtml.down('[id=quota_blank_line]').remove();
	                this.virtualHtml.down('[id=quota_info]').hide();
	            }
	            //we get all the information from the json for each quota
	            var nodes = json.OpenHR.quotas.quota;
	            nodes = objectToArray(nodes);  // now we have always an Array here
	            for(var i=0; i<nodes.length; i++){
	                var node = nodes[i];
	                name = node.employee["#text"]; //getText(xmlDoc.getElementsByTagName('employee')[i]);	                
	                type = node["@text"];//getText(xmlDoc.getElementsByTagName('quota')[i].attributes[1]);
	                unit = node.unit["@id"];//getText(xmlDoc.getElementsByTagName('unit')[i].attributes[0]);
	                valid_untill = node.endDate["#text"];//getText(xmlDoc.getElementsByTagName('endDate')[0]);
	                //change 'dd.MM.yyyy' to format when is ok
	                //we put the date with the correct format
	                var date = (Date.parseExact(valid_untill,'yyyyMd')).toString(format);
	                initial = node["initial"];//getText(xmlDoc.getElementsByTagName('initial')[i]);
	                remaining = node["remaining"];//getText(xmlDoc.getElementsByTagName('remaining')[i]);
	                pending = node["pending"];//getText(xmlDoc.getElementsByTagName('pending')[i]);
	                already_app = node["approved"];//getText(xmlDoc.getElementsByTagName('approved')[i]);
                    //we insert all the information in the table (the id of the row is going to b quota_idEmployee)
	                 this.virtualHtml.down('[id=quota_negative_counters]').insert(
	                        "<tr id='quota_"+employeeId+"_"+i+"'>"
	                            +"<td><div id='quota_name_"+employeeId+"_"+i+"'>"+ name +"</div></td>"
	                            +"<td>"+ type +"</td>"
	                            +"<td>"+ unit +"</td>"
	                            +"<td>"+ date +"</td>"
	                            +"<td>"+ initial +"</td>"
	                            +"<td>"+ remaining +"</td>"
	                            +"<td>"+ pending +"</td>"
	                            +"<td>"+ already_app +"</td>"
	                        +"</tr>");
	                  //we add the new employee in the Array      
	                  this.number_employees[this.number_employees.length]="quota_"+employeeId+"_"+i;
	                  //we apply the color of the employee selected
	                  this.virtualHtml.down('[id=quota_name_'+employeeId+'_'+i+']').addClassName('application_color_'+global.getEmployee(employeeId).color.strip());   
	             }
	             //we hide the no_quotas text
	             this.virtualHtml.down('[id=quota_noQuotas]').hide();
	             //we show the table
	             this.virtualHtml.down('[id=quota_table]').show();
	         } 
	         //if we have selected an employee with no quotas we add to the array and we show the information about no quotas for this employee
	         else{
                this.number_employees[this.number_employees.length]="quota_"+employeeId+"_x";
                //i hide the information "select an employee"
                this.virtualHtml.down('[id=quota_info]').hide();
                this.testIfOnlyNoQuotas();
                //i call the default method to show the information's message 'no_quota_found' too
                this._infoMethod(json);
	            }
	     }
	      //we reload the table
	     TableKit.reloadTable("quota_table");
	},
	/*
     * @method colorCangedHandler
     * @param args {ID} id of the selected color
     * @desc Change the color of the selected employee
     */
	employeeColorChangedHandler : function(ar){
		var args = getArgs(ar);
	    var employeeId = args;
	    //iterator for to loop over the elements that have quotas 
	    var i=0;
	    //we save the element in the dom that has the name of the employee (in color)
	    var domElement = this.virtualHtml.down('[id=quota_name_'+employeeId+'_'+i+']');
	    //if we have the employee not in te table or if we have change the color of one employee, we have not to change the color
	    if(!domElement || domElement.className.split('_')[2]!=global.getEmployee(employeeId).color.strip()) {
	        //an Array that is going to contain the classes we apply to the div of the employee's name
	        var classes=new Array();
	        //if the element with this id exists and there is no blank line
	        if(this.virtualHtml.down('[id=quota_'+employeeId+'_'+i+']') && !this.virtualHtml.down('[id=quota_blank_line]')){
	            while(this.virtualHtml.down('[id=quota_name_'+employeeId+'_'+i+']')){
	                //we get the classes of the actual employee selected
	                classes.push($w(this.virtualHtml.down('[id=quota_name_'+employeeId+'_'+i+']').className));
	                //we remove all the classes that the element has and we apply the new one
	                  for(var c=0; c<classes.length;c++){
	                    this.virtualHtml.down('[id=quota_name_'+employeeId+'_'+i+']').removeClassName(classes[c]);
	                  }
                      this.virtualHtml.down('[id=quota_name_'+employeeId+'_'+i+']').addClassName('application_color_'+global.getEmployee(employeeId).color.strip());
	                  i++;
	            } 
	        }
	    }
	}, 
	/*
     * @method testIfOnlyNoQuotas
     * @desc test if i have employees with no quotas only
     */
	testIfOnlyNoQuotas: function(){
	    var showNoQuotas=true;
	    for(var j=0; j<this.number_employees.length; j++) 
                    if(this.number_employees[j].split('_')[2]!='x'){showNoQuotas=false; break;}
        if(showNoQuotas){this.virtualHtml.down('[id=quota_noQuotas]').show();}
    }
	    
});
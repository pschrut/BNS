/**
 *@fileoverview payslip.js
 *@description Here there is the class PAY. This class models payslip form. It allows the user 
 * to select the year and payroll period, and then displays the payslip in pfd formt in IFRAME
 */
 
 /**
 *@constructor
 *@description Class PAY, gives a PDF with the payslip.
 *@augments Application 
*/
var PAY = Class.create(Application,
/** 
*@lends OM_Maintain
*/
{
    /*** SERVICES ***/

    /** 
    * Service used to get the labels.
    * @type String
    */
    formService : "getPayslipForm",
    /** 
    * Service used to get the years.
    * @type String
    */
    yearsService : "getPayslipYears",    
    /** 
    * Service used to get the periods.
    * @type String
    */
    periodsService : "getPayslipPeriod",    
    /** 
    * Service used to get the Payslip.
    * @type String
    */
    getPayslipService : "getPayslip",     

    /**
    * Currently selected year ID.
    * @type String
    */
    year : '',
    /**
    * Currently selected period ID.
    * @type String
    */	        
    period : '', 
    /**
    * If there is a payslip recorded in the system.
    * @type Boolean
    */	    
    existsPayslip: true,
    /**
    * If we loaded the PDF before.
    * @type Boolean
    */    
    pdfLoadedBefore: false,    
    /**
    * current loaded period: last viewed PDF period
    * @type String
    */    
    currentPeriod: '',
       
    /**
     *@param $super The superclass (Application)
     *@description Creates the html structure calling a SAP service
     */   
	initialize: function($super) {
	    //get the name of the app
	    $super('PAY');
        
	},
    /**
     *@param $super: the superclass: Application
     *@description When the user clicks on "payslip" tag, call to the service to load the years.
     */
    run: function($super) {
        //call to run method of the superclass
        $super();
        alert('pay');
        if(this.firstRun){
            //we create the html
	        this.createrHtml();
            //create the xml request for the call to service getPayslipForm. This service provides the data to create the html structure 
            this.xmlGetForm = '<OpenHR>'
                        + "<SERVICE>"+this.formService+"</SERVICE>"
                        + '<ToSAP>'
                        + "<employee id='" + this.pernr + "'/>"
                        + "<language>"+global.getOption("__language")+"</language>"
                        + '</ToSAP></OpenHR>';
            //create the xml request for the call to service getPayslipYears
            this.xmlGetYears = '<OpenHR>'
                        + "<SERVICE>"+this.yearsService+"</SERVICE>"
                        + '<ToSAP>'
                        + '<searchPattern></searchPattern>'
                        + '<searchId></searchId>'
                        + "<param1>" + this.pernr + "</param1>"
                        + "<language>"+global.getOption("__language")+"</language>"
                        + '</ToSAP></OpenHR>';               
            //call to service to get the form content.             
            this.makeAJAXrequest($H({xml:this.xmlGetForm, successMethod:'processPayslipForm', failureMethod:'failedFormRequest'}));
            //From 'processPayslipForm' we´ll start calling methods with all the functionality of the app.
            this.ranBefore = true; 
        }        
    },
    /**
     *@description Creates the html structure of the application
     */    
    createrHtml: function(){
        //creation of the initial html, with the structure: title, content,footer,iframe(pdf with the payslip)
	        var html = "<div id='PAY_outer'>"	    	                
	                    + "<div id='"+this.appName+"_content2' class='applicationPAY_content'>"
	                    + "<div id='"+this.appName+"_content_year' class='applicationPAY_content_year'></div>"
	                    + "<div id='"+this.appName+"_content_period' class='applicationPAY_content_period'></div></div>"
	                    + "<div id='"+this.appName+"_footer' class='applicationPAY_footer'>"
	                    + "<div id='"+this.appName+"_footer_helpText' class='applicationPAY_footer_helpText application_main_soft_text'></div>"
	                    + "<div id='"+this.appName+"_footer_button' class='applicationPAY_footer_button'>"
	                    + "</div></div>"
	                    + "<div id='"+this.appName+"_iframe'></div></div>";
            //insert the html code in target_div-->content	                
            this.virtualHtml.insert(html);
            //get the employee id
            this.pernr = global.getLoggedUser().id;
    },
    /**
     *@description When the form is already loaded, and the user has payslips, we call a service to get the periods.
     */    
    completeLoadingFormWithYears: function(){
        //now that we know that the user has payslips, we call a service to get the the years available
        if(this.existsPayslip){           
            //call to service getPayslipYears, that provide us with the years with payroll
            this.makeAJAXrequest($H({xml:this.xmlGetYears, successMethod:'processPayslipYears'}));
            //if the user clicks in the button, he´ll get a pdf with the payslip
            this.virtualHtml.down('[id=displayButton]').observe('click',this.getPDF.bind(this));  
            //every time the year changes, we have to call the service which give us the periods for the selected year
            this.virtualHtml.down('[id='+this.appName+'_formYear]').observe('change', this.reloadPeriods.bind(this));            
        }        
    },    
    /**
     *@description When the years are already loaded, we call a service to get the periods. We´ll also use this method 
     * to load new periods when the year changes to a new one (not seen before)
     */    
    completeLoadingFormWithPeriods: function(){
        //create the xml request for the call to service getPayslipPeriod. 
        this.xmlGetPeriod = '<OpenHR>'
                + "<SERVICE>"+this.periodsService+"</SERVICE>"
                + '<ToSAP>'
                + '<searchPattern></searchPattern>'
                + '<searchId></searchId>'
                + "<param1>" + this.pernr + "</param1>"
                + "<param2>" + this.year + "</param2>"
                + "<language>"+global.getOption("__language")+"</language>"
                + '</ToSAP></OpenHR>';                 
        this.makeAJAXrequest($H({xml:this.xmlGetPeriod, successMethod:'processPayslipPeriod'}));    
    },
    /**
     *@param json Json given by the  service getPayslipForm
     *@description Shows an empty page with the error
     */     
    failedFormRequest: function(json) {
	    //get the error message
	    this.name = json.OpenHR.employeeName['#text'];	
        this.labelTitle = this.labels.get('title');		
        var htmlTitle = this.name +' - '+ this.labelTitle;
        this.updateTitle(htmlTitle);		 	            
	    var html_error = json.OpenHR.message.text;
	    this.virtualHtml.down('[id='+this.appName+'_content2]').update('<div>'+html_error+'</div>');
	    this.virtualHtml.down('[id='+this.appName+'_footer]').update('');
	    this.existsPayslip = false;
    }, 
    /**
     *@param json Json given by a certain service 
     *@description Parse the json resulting from call to service getPayslipForm. This service provides the data to create the html structure 
     */     
    processPayslipForm: function(json) {
	    //keep every needed value in a local or class attribute
        this.name = json.OpenHR.employeeName['#text'];
        this.year = json.OpenHR.defaultYear['#text'];
	    //period
        this.period = json.OpenHR.defaultPeriod['#text'];
	    this.labelDisplay = this.labels.get('display');	
	    this.labelHelpText = this.labels.get('helptext');	
	    this.labelPeriod = this.labels.get('period');	
	    this.labelTitle = this.labels.get('title');	
	    this.labelYear = this.labels.get('year');	            	     	       	    
        //now we have the employee data, labels, and last payroll run data keeped
        //complete the html with the proper values
        var htmlTitle = this.name +' - '+ this.labelTitle;
        this.updateTitle(htmlTitle);  
        this.virtualHtml.down('[id='+this.appName+'_footer_helpText]').update(this.labelHelpText);
        //creation of the button "display". we create it here instead that at the beginning because it the user
        //doesnt have any payslip recorded to aviod creating it (and viewing how it dissapears)
        this.virtualHtml.down('[id='+this.appName+'_footer_button]').update("<input type='button' id='displayButton'/>"); 
        this.virtualHtml.down('[id=displayButton]').value = this.labelDisplay;
        //create the deployable lists: years and periods. Now they´ll just have the default value.
        var htmlFormYear = "<div>"+this.labelYear+"</div><div><form name='formYear' action='' method='post' >"
                            + "<select id='"+this.appName+"_formYear' name='year' >"
                            + "<option value='"+this.year+"'>"+this.year+"</option>"
                            + "</select></form></div>";
        this.virtualHtml.down('[id='+this.appName+'_content_year]').update(htmlFormYear);
        var htmlFormPeriod = "<div>"+this.labelPeriod+"</div><div><form name='formPeriod' action='' method='post'>"
                            + "<select id='"+this.appName+"_formPeriod' name='period' class='applicationPAY_selectboxPeriod'>"
                            + "<option value='"+this.period+"'>"+this.period+"</option>"
                            + "</select></form></div>";                           
        this.virtualHtml.down('[id='+this.appName+'_content_period]').update(htmlFormPeriod); 
	    //once the form have been loaded, we can load the years       
        this.completeLoadingFormWithYears();         
    },
    /**
     *@param json: json given by a certain service 
     *@description Parse the json resulting from call to service getPayslipYears. This service 
     * provides the years with payroll available for the user
     */      
    processPayslipYears: function(json) {
	    //keep every needed value in a local or class attribute
	    var years = json.OpenHR.list.line; 
	    years = objectToArray(years); 
	    //if there is at least one year 	
	    if(years.length != 0){
	        //create an array with the values, inserting a hash (id and text) in each cell of the array
	        var arrayYears = [];
	        for(var i=0;i<years.length;i++){
	            var countHast = new Hash();
	            countHast.set('id',years[i].column.id);
	            countHast.set('text',years[i].column.text);
	            arrayYears[i] = countHast;	    
	        }
	    }
	    //remove default value from the list
	    this.virtualHtml.down('[id='+this.appName+'_formYear]').childElements()[0].remove();
	    var string = '';
	    //insert the new values in the list
	    for(var j=arrayYears.length;j>0;j--){
	          string += "<option value='"+arrayYears[j-1].get('id')+"'>"+arrayYears[j-1].get('text')+"</option>";
	    }
	    this.virtualHtml.down('[id='+this.appName+'_formYear]').update(string); 
	    //once the years have been loaded, we can load the period for the year selected
	    this.completeLoadingFormWithPeriods();       
    },
    /**
     *@param json Json given by a certain service 
     *@description Parse the json resulting from call to service getPayslipPeriod. 
     * This service provides the periods with payroll available for the selected year
     */
    processPayslipPeriod: function(json) {
	    //keep every needed value in a local or class attribute
	    var periods = json.OpenHR.list.line; 
	    periods = objectToArray(periods);	    
	    //if there is at least one period 
	    if(periods.length != 0){ 
	        //create an array with the values, inserting a hash (id and text) in each cell of the array
	        var arrayPeriods = [];
	        for(var i=0;i<periods.length;i++){
	            var countHast = new Hash();
	            countHast.set('id',periods[i].column.id);
	            countHast.set('text',periods[i].column.text);
	            arrayPeriods[i] = countHast;	    
	        }
	    }
	    //remove old or default values from the list
        this.virtualHtml.down('[id='+this.appName+'_formPeriod]').update("");
	    var string = '';
	    //insert the new values in the list
	    for(var j=arrayPeriods.length;j>0;j--){
            string += "<option value='"+arrayPeriods[j-1].get('id')+"'>"+arrayPeriods[j-1].get('text')+"</option>";
	    }
	    this.virtualHtml.down('[id='+this.appName+'_formPeriod]').update(string); 	    	    
    },
    /**
     *@description If the year selected changes, load the periods available for that year
     */
    reloadPeriods: function(){
            //get the selected year 
    	    this.year = this.virtualHtml.down('[id='+this.appName+'_formYear]').options[this.virtualHtml.down('[id='+this.appName+'_formYear]').selectedIndex].value;   
            //we´ll just made another SAP call if it´s a new year, not loaded before   	        
            this.completeLoadingFormWithPeriods();               
    },
    /**
     *@description Gives a PDF with the payslip for the year and period selected
     */    
     getPDF: function(){
        //get the selected period. We dont need the year because the value of the period contains the year
    	this.period = this.virtualHtml.down('[id='+this.appName+'_formPeriod]').options[this.virtualHtml.down('[id='+this.appName+'_formPeriod]').selectedIndex].value;
    	if(this.period != this.currentPeriod){
    	    this.currentPeriod = this.period;
	        //get the url from default.js
	        this.url = __hostName;    	
	        //xml_in to put in the url 
            this.xmlGetPayslip = '<OpenHR>'
                    + "<SERVICE>"+this.getPayslipService+"</SERVICE>"
                    + '<ToSAP>'
                    + "<employee id=\"" + this.pernr + "\"></employee>"
                    + "<period id=\"" + this.period + "\"></period>"
                    + "<language>"+global.getOption("__language")+"</language>"
                    + '</ToSAP></OpenHR>';    	
            //create the iframe to hold the pdf. First we insert a loading gif                            
            var html_iframe = "<iframe id='iframePDF' width='100%' height='500' frameborder='0'></iframe> ";
            //insert the iframe with the loading gif in the document
            this.virtualHtml.down('[id='+this.appName+'_iframe]').update(html_iframe);
            //we´ll change the src to the PDF when the estate is complete
            this.virtualHtml.down('[id=iframePDF]').onreadystatechange=function(){ //IE
                if (this.virtualHtml.down('[id=iframePDF]').src.include('loading_payslip.htm') && (this.virtualHtml.down('[id=iframePDF]').readyState=="loaded" || this.virtualHtml.down('[id=iframePDF]').readyState=="complete" )){          
                    this.virtualHtml.down('[id=iframePDF]').src = this.url+"&xml_in="+this.xmlGetPayslip;                                
                }
            }.bind(this);       
            this.virtualHtml.down('[id=iframePDF]').onload=function(){ //FF       
                if ( this.virtualHtml.down('[id=iframePDF]').src.include('loading_payslip.htm')){          
                    this.virtualHtml.down('[id=iframePDF]').src = this.url+"&xml_in="+this.xmlGetPayslip;                                
                }                                          
            }.bind(this);   
            //insert the initial source: the loading gif        
            this.virtualHtml.down('[id=iframePDF]').src ='standard/payslip/loading_payslip.htm';
        } 
    }
});

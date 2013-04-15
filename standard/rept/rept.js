


var REPT = Class.create(Application,{
    
	initialize: function($super) {
	    $super('REPT'); 
        //___________________________
	    this.employee = global.getLoggedUser().id;	 
	    this.sapService = "GET_EMP_DETAILS"; 
		this.employeeSelectedReactionHandlerBinding = this.employeeSelectedReaction.bind(this);
	   
	},
	run:function($super){
	    $super();	
	    //___________________________
	    this.virtualHtml.update("the ID of logged user is: "+global.getLoggedUser().id);
	    //make call to sap
	    var xml1 = "<OpenHR><SERVICE>"+this.sapService+"</SERVICE><ToSAP><appId></appId><employee id='"+this.employee+"'/></ToSAP></OpenHR>"
        this.makeAJAXrequest($H({xml:xml1, successMethod:'printresults'}));
        //register
		document.observe('EWS:employeeSelected', this.employeeSelectedReactionHandlerBinding);
	},
	printresults:function(xml) {
	   this.virtualHtml.insert("<br/>OK, anser from SAP");
	   this.name = getText(selectSingleNodeCrossBrowser(xml,'/OpenHR/fields/field[@id="ENAME"]'));
	   this.virtualHtml.insert("<br/>"+this.labels.get("ENAME")+": "+this.name);
	   Framework_stb.showSemitransparent();

	   
	},
	employeeSelectedReaction:function(empId) {
		var employeeId = getArgs(empId);
        alert('employeeId');
	},	
	close:function($super){
	    $super();	
	    //___________________________
	    document.stopObserving('EWS:employeeSelected', this.employeeSelectedReactionHandlerBinding);
	}
	
    
});

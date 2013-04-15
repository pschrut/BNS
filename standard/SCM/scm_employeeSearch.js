/**
 * @class
 * @description Abstract class for the management of search employee forms
 * @author jonathanj & nicolasl
 * @version 2.2
 * <br/>Changes for 2.2:
 * <ul>
 * <li>When the user disable the company field manually, do not reactive it automatically</li>
 * <li>Change the event keyPress to keyDown to manage the delete char</li>
 * </ul>
 * <br/>Changes for version 2.1:
 * <ul>
 * <li>Use the common way to encode/decode fields for the communication to the backend</li>
 * </ul>
 */
var ScmEmployeeSearch = Class.create(/** @lends ScmEmployeeSearch.prototype */{
    /**
	 * @type Application
	 * @description Application that create the form.
	 * @since 1.0
	 */
    parentApp: null,
    
    /**
	 * @type String
	 * @default ""
	 * @description Unique identifier of the form.
	 * @since 1.0
	 */
	ident: '',
    
    /**
	 * @type Integer
	 * @default 3
	 * @description The search of employees need at last this number of chars before a star.
	 * @since 1.0
	 */
    minCharsSearch: 3,
    
    /**
	 * @type String
	 * @default "*"
	 * @description String used as a wildcart for employee search.
	 * @since 1.0
	 */
    wildcartSearch: '*',
    
    /**
	 * @type Element
	 * @description Element with the HTML with the last employee selection.
	 * @since 1.0
	 */
    _lastSearchedField: null,
    
    /**
	 * @type infoPopUp
	 * @description Popup to contains the list of possible choices.
	 * @since 1.0
	 */
    _popup: null,
	
	/**
	 * @type String
	 * @description Display mode for the list of customer or the company. It could be:
	 * <ul>
	 * 	<li>'AUTOCOMPLETE' if the list of customer has to be a select box or</li>
	 * 	<li> 'INPUT' if the field is an input field.</li>
	 * </ul>
	 * @since 1.0
	 */
	displayCustComp: null,
    
	/**
	 * @type JSONAutocompleter
	 * @description Auto completer for the list of customers / companies.
	 * @since 1.0
	 */
	_custCompAutoComp: null,
	
	/**
	 * @type String
	 * @description Id used for the autocompleter to be able to identify it.
	 * @since 1.0
	 */
	_custCompAutoCompId: null,
	
	/**
	 * @type Hash
	 * @description List of handlers for methods.
	 * @since 1.0
	 */
	_listeners: null,
	
	/**
	 * @type {JSON Object}
	 * @description Indicate the fields names for the company name and id.
	 * @since 1.0
	 */
	custCompCriteria: null,
	
	/**
	 * @type {String}
	 * @description Identifier of the selected company or customer.
	 * @since 1.0
	 */
	custCompId: null,
	
	/**
	 * @type Boolean
	 * @description The search is limited on existant tickets.
	 * @since 1.0
	 */
	onExistingTicket: null,
	
	/**
	 * @type Boolean
	 * @description Is the customer or the company mandatory before employee search.
	 * @since 1.0
	 */
	custCompMandatory: null,
	
	/**
	 * @type Element
	 * @description Node on the top of the form.
	 * @since 1.0
	 */
	parentNode: null,
	
	/**
	 * @type Boolean
	 * @description Is the form dedicated to be disabled.
	 * @since 1.0
	 */
	formDisabled: null,
	
	/**
	 * @type Boolean
	 * @description Is the field for the company selection to make uneditable.
	 * @since 2.2
	 */
	companySelectionDisabled: null,
	
	/**
	 * Class constructor that calls the parent and sets the event listener for the class
	 * @param {Application} parent Caller application
	 * @param {String} ident Name used to identify the search employee form
	 * @param {Boolean} onExistingTicket Parameter to send to HRW for backend searches
	 * @param {Element} parentNode HTML element that shoudl contains the form.
	 * @since 1.0
	 * <br/>Modified for 2.2:
	 * <ul>
	 * <li>Set a default value to {@link ScmEmployeeSearch#companySelectionDisabled}</li>
	 * </ul>
	 */
    initialize: function(parent, ident, onExistingTicket, parentNode) {
        this._listeners 		= $H({
			'custCompSelected': this.custCompSelected.bind(this)
		});
		
		document.observe('EWS:scm_custCompSelected', this._listeners.get('custCompSelected'));

		this.parentApp          = parent;
		this.parentNode			= parentNode;
		this.ident              = ident;
		this._lastSearchedField = null;
		this.onExistingTicket	= onExistingTicket;	
		//since 2.2 Set that the company is not disabled by default	
		this.companySelectionDisabled = false;
    },
	
	/**
	 * @description Reset the event handlers and the form events. 
	 * @since 1.0
	 */
	reload: function() {
		//If there is an event handler, stop it 
		document.stopObserving('EWS:scm_custCompSelected', this._listeners.get('custCompSelected'));
		//Start the event handler
		document.observe('EWS:scm_custCompSelected', this._listeners.get('custCompSelected'));	
	},
	
	/**
	 * @param {Boolean} withDetails Is the text at bottom of the form?
	 * @description Get the content of the form for employee search. 
	 * @return {Element} HTML element that contains the form
	 * @since 1.0
	 */
    getForm: function(withDetails) { 
		this.formDisabled = false;
		      
        //Build the form
        var extension = this.getFormContent(new Template( '<div class="SCM_FindEmpLine">'
                                          +     '<div id="SCM_FindEmpLabel_#{criteria}" class="SCM_FindEmpLabel">#{label}: </div>'
                                          +     '<input maxlength="100" class="application_autocompleter_box SCM_FindEmpText" type="text" id="SCM_FindEmpl_'+this.ident+'_#{criteria}" value="#{defValue}"/>'
                                          + '</div>'));
										  
        extension.insert('<p id="SCM_FindEmp_noResult_'+ this.ident +'" class="SCM_TicketGr_noResult">'+global.getLabel('No_founded_results')+'</p>');
        if (withDetails === true)
			extension.insert('<p class="SCM_TicketGr_ddTxt">' + global.getLabel('Push_enter_to_search').sub('%', this.minCharsSearch).sub('+', this.wildcartSearch) + '</p>');
        return extension;
    },
    
	/**
	 * @description Get the content of the form with all the fields disabled. 
	 * @return {Element} HTML element that contains the form
	 * @since 1.0
	 */
	getFormDisabled: function() {    
		this.formDisabled = true;
		
        return this.getFormContent(new Template( '<div id="SCM_FindEmpLabel_#{criteria}" class="SCM_FindEmpLine">'
                                         	 	+     '<div class="SCM_FindEmpLabel">#{label}: </div>'
                                          		+     '<input class="application_autocompleter_box SCM_FindEmpText" type="text" disabled="true" id="SCM_FindEmpl_'+this.ident+'_#{criteria}" value="#{defValue}"/>'
			                             		+ '</div>'));
    },
	
	/**
	 * @param {Template} formTemplate Template to use for the form lines.
	 * @description Build the content of the form for employee search form.
	 * @return {Element} HTML element with the form content
	 * @since 1.0
	 */
	getFormContent: function(formTemplate) {
		var divId = 'SCM_FindEmp_' + this.ident;
        var extension   = new Element('div', {'id': divId});
		
		extension.insert(formTemplate.evaluate({label: global.getLabel('Customer')		, criteria: this.custCompCriteria.name }));
        extension.insert(formTemplate.evaluate({label: global.getLabel('Employee_id')  	, criteria: 'EMP_ID'    }));
        extension.insert(formTemplate.evaluate({label: global.getLabel('First_name')	, criteria: 'FIRST_NAME'}));
        extension.insert(formTemplate.evaluate({label: global.getLabel('Last_name') 	, criteria: 'LAST_NAME' }));
        extension.insert(formTemplate.evaluate({label: global.getLabel('Email')     	, criteria: 'EMAIL'     }));
		
		return extension;
	},
	
    /**
	 * @description Display the no result element. 
	 * @since 1.0
	 */
    displayNoResult: function() {
        var elem = this.parentNode.down('p#SCM_FindEmp_noResult_'+this.ident);
        if(!elem.visible()) elem.show();
    },
    
    /**
	 * @description Hide the no result element. 
	 * @since 1.0
	 */
    hideNoResult: function() {
		var elem = this.parentNode.down('p#SCM_FindEmp_noResult_'+this.ident);
        if(elem && elem.visible()) elem.hide();
    },
	
	/**
	 * @param {Boolean} withCompCust allow to select or not the customer/company fields 
	 * @param {String} field Name of a field to enable (optional)
	 * @description Enable one or several fields of the form. 
	 * @since 1.0
	 * <br/>Modified for 2.2 
	 * <ul>
	 * <li>Do not enable the company if it was deactivated manually</li>
	 * </ul>
	 */
	formEnable: function(withCompCust, field) {
		if(this.formDisabled === true) return;
		
		var fields = $A();
		var element;
		
		//If there is a given field => enable it
		if(field)
			fields.push(field);
		//If there is no given field => enable all fields with or without company/customer fields
		else if(withCompCust === true)
			fields = $A([this.custCompCriteria.name, 'EMP_ID', 'FIRST_NAME', 'LAST_NAME', 'EMAIL']);
		else			
			fields = $A(['EMP_ID', 'FIRST_NAME', 'LAST_NAME', 'EMAIL']);
			
		fields.each(function(fieldName) {
			//since 2.2 Do not enable the company if it is disabled manually
			if(fieldName === this.custCompCriteria.name && this.companySelectionDisabled) return;
			
			element = this.parentNode.down('input#SCM_FindEmpl_' + this.ident + '_'+fieldName);
			if(!Object.isEmpty(element)) {
				if(element.disabled === true) element.enable();
				element.stopObserving('keydown');
				if(fieldName === this.custCompCriteria.name) 
					element.observe('keydown', this.inputKeyPressed.bindAsEventListener(this, 'nonStandard'));
				else
					element.observe('keydown', this.inputKeyPressed.bindAsEventListener(this, 'standard'));
			}
		}.bind(this));
	},
	
	/**
	 * @param {Boolean} withCompCust allow to select or not the customer/company fields
	 * @param {String} field Name of a field to disable (optional) 
	 * @description Disable one or several fields of the form. 
	 * @since 1.0
	 */
	formDisable: function(withCompCust, field) {
		if(this.formDisabled === true) return;
		
		var fields = $A();
		var element;
		
		//If there is a given field => enable it
		if(field)
			fields.push(field);
		//If there is no given field => enable all fields with or without company/customer fields
		else if(withCompCust === true)
			fields = $A([this.custCompCriteria.name, 'EMP_ID', 'FIRST_NAME', 'LAST_NAME', 'EMAIL']);
		else			
			fields = $A(['EMP_ID', 'FIRST_NAME', 'LAST_NAME', 'EMAIL']);
			
		fields.each(function(fieldName) {
			element = this.parentNode.down('input#SCM_FindEmpl_' + this.ident + '_'+fieldName);
			if(!Object.isEmpty(element)) {
				if(element.disabled === false) element.disable();
				element.stopObserving('keydown');
			}
		}.bind(this));
	},
	
	/**
	 * @event
	 * @param {Event} event Event geenrated when a company is selected
	 * @description Handler for the selection of a company via the autocomplete button
	 * @since 1.0
	 */
	custCompSelected: function(event) {
		var args = getArgs(event);

		if(args.idAutocompleter === undefined) args.idAutocompleter = args.idAutoCompleter; 
		if(args.idAutocompleter !== this._custCompAutoCompId) return;
		if(args.isEmpty === true) return;
		if(this.getValues(this.custCompCriteria.id) === args.idAdded) return;
		
		var values = $H({
            EMP_ID      : '',
            FIRST_NAME  : '',
            LAST_NAME   : '',
            EMAIL       : ''
        });
		values.set(this.custCompCriteria.name	, args.textAdded);
		values.set(this.custCompCriteria.id	, args.idAdded	);
		
		this.setValues(values);
		
		this.hideNoResult();

		if(!args.idAutocompleter.endsWith(this.custCompCriteria.name) || this.displayCustComp === 'AUTOCOMPLETE') 
			this.removeLastSearchButton();
		this.formEnable(false);
		document.fire('EWS:scm_noEmployeeSelected', this.ident);
	},
	
	/**
	 * @param {Event} event Generated event
	 * @param {String} accessType Is the calling input field: 
	 * <ul>
	 * 	<li>a '<b>standard</b>' input field, </li>
	 * 	<li>a '<b>customer</b>' field,</li>
	 * 	<li>a '<b>company</b>' field or </li>
	 * 	<li>an '<b>unauthorized</b>' field.</li>
	 * </ul>
	 * @description (Abstract) Handler for the selection of a field as input text.
	 * @since 1.0
	 */ 
	inputKeyPressed: function(event, accessType)  {
		alert('This method is abstract!');
	},
	
	/**
	 * @param {String} fieldValue Value given by the user in the form field
	 * @param {String} criteria Is it the company, the employee id, the name or the email that is the criteria?
	 * @description Get from the back end the list of users that match the given informations.
	 * @since 1.0
	 * <br/>Modifications for 2.1:
	 * <ul>
	 * <li>Use the standard encoding before sending to HRW</li>
	 * </ul>
	 * @see ScmEmployeeSearch#employeeSearchResultList 
	 */
	searchEmployee: function(fieldValue, criteria) {
		var methodName;
		var onExistingTicket;
		if(this.onExistingTicket) onExistingTicket = 'True';
		else onExistingTicket = 'False';
		
        var params = $H({scAgentId: hrwEngine.scAgentId, onExistingTicket: onExistingTicket});

		//since 2.1 Use the standard encoding
		var safeFieldValue = HrwRequest.encode(fieldValue);
		
        switch(criteria) {
            case 'EMP_ID':
                methodName  = 'SearchByEmployeeId';
                params.set('employeeId', safeFieldValue);
				params.set('ClientSkillId', this.getValues(this.custCompCriteria.id));
                break;
            case 'FIRST_NAME':
                methodName = 'SearchByFirstName';
                params.set('firstName', safeFieldValue);
				params.set('ClientSkillId', this.getValues(this.custCompCriteria.id));
                break;
            case 'LAST_NAME':   
                methodName = 'SearchByLastName';
                params.set('lastName', safeFieldValue);
				params.set('ClientSkillId', this.getValues(this.custCompCriteria.id));
                break;
            case 'EMAIL':
				methodName = 'SearchByEmailAddress';
				params.set('emailAddress', safeFieldValue);
				params.set('ClientSkillId', this.getValues(this.custCompCriteria.id));
                break;
			default:
				return;
        }
        
        //Do the request
        hrwEngine.callBackend(this.parentApp, 'Backend.' + methodName, params, this.employeeSearchResultList.bind(this));
	},
	/**
	 * @param {String} value Value with the content to check.
	 * @description Check if a form entry is valid as a search pattern. 
	 * @return {Boolean} The check result.
	 * @since 1.0
	 * <br/>Modification for 1.1 
	 * <ul>
	 * <li>Replace the alert by a standard popup</li>
	 * </ul>
	 */
	checkFormEntry: function(value) {
		// Get the values of the selected field fields
		var starIndex = value.indexOf(this.wildcartSearch);
		if (starIndex >= 0 && starIndex < this.minCharsSearch) {
			//since 1.1 Create the popup
        	var popup = new infoPopUp({
	            closeButton     : $H({'callBack': function() {
	                popup.close();
					delete popup;
	            }.bind(this)}) ,
	            htmlContent     : global.getLabel('Only_after_%_chars').sub('%', this.minCharsSearch) ,
	            indicatorIcon   : 'exclamation'  ,
	            width           : 500
	        });
			popup.create();
			
			return false;
		} else if (value.length === 0) {
			//since 1.1 Create the popup
        	var popup = new infoPopUp({
	            closeButton     : $H({'callBack': function() {
	                popup.close();
					delete popup;
	            }.bind(this)}) ,
	            htmlContent     : global.getLabel('Give_value') ,
	            indicatorIcon   : 'exclamation'  ,
	            width           : 500
	        });
			popup.create();
			
			return false;
		}
		
		return true;
	},
	
    /**
	 * @param {JSON Object} jsonListEmployees List of founded employees
	 * @description Depending on the number of results:<ul>
	 *                  <li>If several results => display the list of result,</li>
	 *                  <li>If 1 result        => propagate the result in the form,</li>
	 *                  <li>If 0 results       => send an error. </li>
	 *                </ul>
	 * @since 1.0
	 */
    employeeSearchResultList: function(jsonListEmployees) {
        var employeeTemplate = new Template('<tr>'
                                        +       '<td><input type="radio" name="empSel" value="#{id}"/></td>'
                                        +       '<td><span id="SCM_#{id}_fname">#{fname}</span></td>'
                                        +       '<td><span id="SCM_#{id}_lname">#{lname}</span></td>'
                                        +       '<td><span id="SCM_#{id}_id">#{empId}</span></td>'
                                        +       '<td><span id="SCM_#{id}_customer" custcompid="#{customerId}">#{customer}</span></td>'
                                        +       '<td><span id="SCM_#{id}_email">#{email}</span></td>'
                                        +   '</tr>');                                        
        var popup;
        var table;
        var buttons;
        var employeeList = $A();
        var employeeItem;
        var jsonEmpl = jsonListEmployees.EWS.HrwResponse.HrwResult.Employees;

        if(!Object.isEmpty(jsonEmpl)) jsonEmpl = jsonEmpl.EmployeeData;
        if(!Object.isEmpty(jsonEmpl)) {
            objectToArray(jsonEmpl).each(function(employee, key) {
                employeeItem = {fname: '/'  , lname: '/' , empId: '/', customer: '/', customerId: '/', email:'/', id: key};
                objectToArray(employee.Field).each(function(emplField) {
                    switch(emplField['@name']) {
                        case 'company'      : 
                        case 'customer'     : employeeItem.customer 	= emplField['@value']; break;
						case 'companyId'    : 
                        case 'customerId'   : employeeItem.customerId 	= emplField['@value']; break;
                        case 'employeeid'   : employeeItem.empId    	= emplField['@value']; break;
                        case 'firstname'    : employeeItem.fname    	= emplField['@value']; break;
                        case 'lastname'     : employeeItem.lname    	= emplField['@value']; break;
                        case 'email'        : employeeItem.email    	= emplField['@value']; break;
                    }
                }.bind(this));
                
                employeeList.push(employeeItem);
            }.bind(this));
        }
        
        this.hideNoResult(); 
            
        switch(employeeList.size()) {
            case 0:
				var values = $H({
                    EMP_ID      : '',
                    FIRST_NAME  : '',
                    LAST_NAME   : '',
                    EMAIL       : ''   
                })

				if(this.custCompMandatory === false) {
					values.set(this.custCompCriteria.name	, '');
					values.set(this.custCompCriteria.id	, '');
				}
				
				this.setValues(values);
				
                this.displayNoResult();
                document.fire('EWS:scm_noEmployeeSelected', this.ident);
                break;
                
            case 1:
                var values = $H({
                    EMP_ID      : employeeList[0].empId   	,
                    FIRST_NAME  : employeeList[0].fname   	,
                    LAST_NAME   : employeeList[0].lname   	,
                    EMAIL       : employeeList[0].email		
                });
				
				if(this.custCompMandatory === false) {
					values.set(this.custCompCriteria.name	, employeeList[0].customer	);
					values.set(this.custCompCriteria.id	, employeeList[0].customerId);
				}
				
                this.setValues(values);
                break;
                
            default:
                //Create the table with the list of employees
                popup = new Element('div', {'id': 'SCM_popupEmployeeSearch'});
                
                table = new Element('table', {'id': 'SCM_popupEmployeeSearchTable', 'class': 'sortable'});
                popup.insert(table);

                table.insert(    '<tr>'
                            +       '<th/>'
                            +       '<th>' + global.getLabel('First_name')  + '</th>'
                            +       '<th>' + global.getLabel('Last_name')   + '</th>'
                            +       '<th>' + global.getLabel('EMPLOYEE_ID') + '</th>'
                            +       '<th>' + global.getLabel('Customer') 	+ '</th>'
                            +       '<th>' + global.getLabel('Email')       + '</th>'
                            +   '</tr>');
                            
                employeeList.each(function(employee, key) {                        
                    table.down(0).insert(employeeTemplate.evaluate(employee));
                }.bind(this));
                

                //Add a reaction on the line click
                table.down(0).childElements().each(function (line) {
                    //Add the onclick for non header lines
                    if(line.down(0).tagName !== 'TD') return;
                    
                    line.observe('click', function(clickedEv) {
                        var element = clickedEv.element();
                        if(element.tagName === 'TR') element = element.down('input');
                        else element = element.up(1).down('input');
                        element.checked = true;
                    }.bindAsEventListener(this));
                    
                    line.observe('dblclick', function(clickedEv) {
                        this.selectLine(table.identify());
                    }.bindAsEventListener(this));
                }.bind(this));
                
                //Create the button to validate the choice or cancel
		        buttons = new megaButtonDisplayer({
			        elements : $A( [ 
			            {
				            label 			: global.getLabel('Select_employee')			,
				            className 		: 'SCM_PoolTable_footerButton'	                ,
				            type 			: 'button'						                ,
				            idButton 		: 'SCM_popupPendingDone'      	                ,
				            standardButton 	: true
			            },
			            {
				            label 			: global.getLabel('Cancel')						,
				            className 		: 'SCM_PoolTable_footerButton'					,
				            type 			: 'button'										,
				            idButton 		: 'SCM_popupPendingCancel'      				,
				            standardButton 	: true
			            }])
		        });
                popup.insert(buttons.getButtons());
                this.displayPopup(buttons, popup, table.identify());
                this.addLastSearchButton(this._lastSearchedField, popup, buttons, table.identify());
                break;
        }
    },
	
			
	/**
	 * @param {JSON Object} jsonListCompanies List of the companies from SAP
	 * @description Display the list of companies from SAP
	 * @since 1.0
	 */
	custCompSearchResultList: function(jsonListCompanies) {
		var companyTemplate = new Template('<tr>'
                                        +       '<td><input type="radio" name="empSel" value="#{id}"/></td>'
                                        +       '<td><span id="SCM_#{id}_custCompName">#{Value}</span></td>'
										+       '<td><span id="SCM_#{id}_custCompId">#{Key}</span></td>'
                                        +   '</tr>');
		var popup;
		var table;			
		var listCustComps = this.getListCustComps(jsonListCompanies);
		
		this.hideNoResult(); 
		
		switch(listCustComps.size()) {
            case 0:
				values = $H({
                    EMP_ID      : '',
                    FIRST_NAME  : '',
                    LAST_NAME   : '',
                    EMAIL       : ''   
                });
				values.set(this.custCompCriteria.name	, '');
				values.set(this.custCompCriteria.id		, '');
				
                this.setValues(values);
				
                this.displayNoResult();
				if(this.custCompMandatory === true) this.formDisable(false);
                document.fire('EWS:scm_noEmployeeSelected', this.ident);
                break;
                
            case 1:
				//If the company is the same as the previous one => set its name again
				if(this.getValues(this.custCompCriteria.id) === listCustComps[0].Key) {
					values = $H();
					values.set(this.custCompCriteria.name, listCustComps[0].Value);
					this.setValues(values);
					return;
				}
					
                var values = $H({
					EMP_ID      : '',
                    FIRST_NAME  : '',
                    LAST_NAME   : '',
                    EMAIL       : ''
				});
 				values.set(this.custCompCriteria.name	, listCustComps[0].Value);
				values.set(this.custCompCriteria.id		, listCustComps[0].Key);
				
                document.fire('EWS:scm_custCompSelected', {
					isEmpty			: false										,
					idAdded			: values.get(this.custCompCriteria.id)		,
					textAdded		: values.get(this.custCompCriteria.name)	,
					idAutocompleter	: this._custCompAutoCompId
				});
                break;
                
            default:
				//Create the table with the list of employees
                popup = new Element('div', {'id': 'SCM_popupCustCompSearch'});
                
                table = new Element('table', {'id': 'SCM_popupCustCompSearchTable', 'class': 'sortable'});
                popup.insert(table);

                table.insert(    '<tr>'
                            +       '<th/>'
                            +       '<th>' + global.getLabel('Customer_Name')	+ '</th>'
                            +       '<th>' + global.getLabel('Customer_Id')   	+ '</th>'
                            +   '</tr>');
                            
                listCustComps.each(function(custComp, key) { 
					custComp.id = key;                       
                    table.down(0).insert(companyTemplate.evaluate(custComp));
                }.bind(this));
                

                //Add a reaction on the line click
                table.down(0).childElements().each(function (line) {
                    //Add the onclick for non header lines
                    if(line.down(0).tagName !== 'TD') return;
                    
                    line.observe('click', function(clickedEv) {
                        var element = clickedEv.element();
                        if(element.tagName === 'TR') element = element.down('input');
                        else element = element.up(1).down('input');
                        element.checked = true;
                    }.bindAsEventListener(this));
                    
                    line.observe('dblclick', function(clickedEv) {
                        this.selectLine(table.identify());
                    }.bindAsEventListener(this));
                }.bind(this));
                
                //Create the button to validate the choice or cancel
		        buttons = new megaButtonDisplayer({
			        elements : $A( [ 
			            {
				            label 			: global.getLabel('Select_company')	,
				            className 		: 'SCM_PoolTable_footerButton'	    ,
				            type 			: 'button'						    ,
				            idButton 		: 'SCM_popupPendingDone'      	    ,
				            standardButton 	: true
			            },
			            {
				            label 			: global.getLabel('Cancel')			,
				            className 		: 'SCM_PoolTable_footerButton'		,
				            type 			: 'button'							,
				            idButton 		: 'SCM_popupPendingCancel'      	,
				            standardButton 	: true
			            }])
		        });
                popup.insert(buttons.getButtons());
                this.displayPopup(buttons, popup, table.identify());
				this.addLastSearchButton(this._lastSearchedField, popup, buttons, table.identify());
                break;
		}
	},
	
		
	/**
	 * @param {Element} custCompField Element with the company value in the form
	 * @param {JSON Object} jsonListCustComp List of the companies from SAP
	 * @description Display the autocompleter for the company selection
	 * @since 1.0
	 * <br/>Modification for 1.1 
	 * <ul>
	 * <li>Replace the alert by a standard popup</li>
	 * </ul>
	 */
	custCompBuildAutoComplete: function(custCompField, jsonListCustComp) {
		// Build the list of possible teams
        var json 			= {autocompleter: {object: $A()}};
		var divClass		= custCompField.readAttribute('class');
		var listCustComp 	= this.getListCustComps(jsonListCustComp);

        listCustComp.each(function(cust) {
            json.autocompleter.object.push({
                text: cust.Value,
                data: cust.Key
            });
        }.bind(this));
        
		if(json.autocompleter.object.size() === 0) {
			//since 1.1 Create the popup
        	var popup = new infoPopUp({
	            closeButton     : $H({'callBack': function() {
	                popup.close();
					delete popup;
	            }.bind(this)}) ,
	            htmlContent     : global.getLabel('SCM_NoCustomerConf') + '<br/>' + global.getLabel('Check_settings'),
	            indicatorIcon   : 'exclamation'  ,
	            width           : 500
	        });
			popup.create();
			
			document.fire('EWS:scm_noEmployeeSelected', this.ident);
			this.formDisable(true);
			return;
		}
		
		json.autocompleter.object[0].def = 'X';

		document.fire('EWS:scm_custCompSelected', {
			isEmpty			: false								,
			idAdded			: json.autocompleter.object[0].data	,
			textAdded		: json.autocompleter.object[0].text	,
			idAutocompleter	: this._custCompAutoCompId
		});
		
        // Build the autocompleter
		custCompField.replace('<div id="'+this._custCompAutoCompId+'"/>');
		
        this._custCompAutoComp = new JSONAutocompleter(this._custCompAutoCompId, {
            timeout                     : 500       ,
            showEverythingOnButtonClick : true      ,
            templateResult              : '#{text}' ,
            templateOptionsList         : '#{text}' ,
            autoWidth                   : false		,
			events						: $H({'onResultSelected': 'EWS:scm_custCompSelected'})
        }, json);
		this.parentNode.down('[id="text_area_' + this._custCompAutoCompId + '"]').addClassName(divClass);
	},
	
	/**
     * @description Disable the company field
	 * @since 1.0
	 * <br/>Modification for 2.2
	 * <ul>
	 * <li>Set the global variable to indicate that the company is to disable to TRUE</li>
	 * </ul>
     */
	disableCompanySelection: function() {
		//since 2.2 Set the global variable to indicate that the company is not to update
		this.companySelectionDisabled = true;
		
		if(this._custCompAutoComp !== null) {
			if(this._custCompAutoComp.enabled === true)
				this._custCompAutoComp.disable();
		} else {
			//since 1.1 The element is an input field, not a div
			var input = this.parentNode.down('input#' + this._custCompAutoCompId);
			if(input && !input.disabled)
				input.disabled = true;
		}
	},
	
	/**
     * @param {JSON Object or Array} listCustComp List of the customers or companies
     * @description (Abstract) Build a standardized list of customers or employees to use elsewhere.
	 * @since 1.0
     */
	getListCustComps: function(listCustComp) {alert('This method is abstract!');},
	
	/**
     * @param {String} tableId Id of the table to search
     * @description Get the selected line from a list of result and close the popup that contains them.
	 * @since 1.0
     */
    selectLine: function(tableId) {
		var popupHTML	= this._popup.obHtmlContent;
        var selectedId 	= '';
		
        popupHTML.select('#'+tableId+' input').each(function(input) {
            if(input.checked) selectedId = input.value;
        }.bind(this));
        if(selectedId === '') return;
		
        var values;
		var form;
		
		//For the selection of an employee
		if(tableId === 'SCM_popupEmployeeSearchTable') {
			formRow = popupHTML.down('[id="SCM_'+selectedId+'_id"]').up(1);
			values = $H({
	            EMP_ID      : formRow.down('[id="SCM_'+selectedId+'_id"]').innerHTML     ,
	            FIRST_NAME  : formRow.down('[id="SCM_'+selectedId+'_fname"]').innerHTML  ,
	            LAST_NAME   : formRow.down('[id="SCM_'+selectedId+'_lname"]').innerHTML  ,
	            EMAIL       : formRow.down('[id="SCM_'+selectedId+'_email"]').innerHTML
	        });
			
			if(this.custCompMandatory === false) {
				values.set(this.custCompCriteria.name	, formRow.down('[id="SCM_'+selectedId+'_customer"]').innerHTML	);
				values.set(this.custCompCriteria.id	, formRow.down('[id="SCM_'+selectedId+'_customer"]').readAttribute('custcompid'));
			}

			this.setValues(values);		
			
		//For the selection of a company				
		} else {
			formRow = popupHTML.down('[id="SCM_'+selectedId+'_custCompId"]').up(1);
			values = $H({
	            EMP_ID      : '',
	            FIRST_NAME  : '',
	            LAST_NAME   : '',
	            EMAIL       : ''
	        });
			
			values.set(this.custCompCriteria.name	, formRow.down('[id="SCM_'+selectedId+'_custCompName"]').innerHTML	);
			values.set(this.custCompCriteria.id		, formRow.down('[id="SCM_'+selectedId+'_custCompId"]').innerHTML	);
			
			if(this.getValues(this.custCompCriteria.id) !== values.get(this.custCompCriteria.id)) {
				document.fire('EWS:scm_custCompSelected', {
					isEmpty			: false										,
					idAdded			: values.get(this.custCompCriteria.id)		,
					textAdded		: values.get(this.custCompCriteria.name)	,
					idAutocompleter	: this._custCompAutoCompId
				});
			} else {
				values = $H();
				values.set(this.custCompCriteria.name, formRow.down('[id="SCM_'+selectedId+'_custCompName"]').innerHTML);
				this.setValues(values);
			}
		}     

        TableKit.unloadTable(tableId);
        this._popup.close();
    },
	
    /**
	 * @param {Element} field Value given by the user in the form field
	 * @param {Element} result Popup to display when reload 
	 * @param {megaButtonDisplayer} buttons Button in the popup
	 * @param {String} tableId Id of the table to display in the popup
	 * @description Add the button to get back the last result
	 * @since 1.0
	 */
    addLastSearchButton: function(field, result, buttons, tableId) {
        if(Object.isEmpty(field) || Object.isEmpty(result)) return;
        
        this.removeLastSearchButton();
		
        var reload = new Element('div', {'id': 'SCM_FindEmp_'+this.ident+'_lastSearch', 'class': 'SCM_reload_lastEmployee'});
        field.addClassName('SCM_PoolTable_actions_before');
        field.insert({after: reload});
        
        reload.observe('click', function(event){ 
            this.displayPopup(buttons, result, tableId);
        }.bindAsEventListener(this));
    },
	
	/**
	 * @param {String} ifThisId (optional)Remove the last search button if it has this id (since 1.1)
	 * @description Remove the button to access the last search result 
	 * @since 1.0 
	 * <br/> Modification for 1.1
	 * <ul>
	 * <li>Add the possiblity to check if the field with the last search has a specified id</li>
	 * </ul>
	 */
	removeLastSearchButton: function(ifThisId) {
		var reload = this.parentNode.down('[id="SCM_FindEmp_'+this.ident+'_lastSearch"]');
		if(!Object.isEmpty(reload)) {
			//since 1.1 Allow to check that the main field has a given id to remove.
			var mainDiv = reload.previous();
			if(ifThisId && mainDiv.identify() !== ifThisId) return;
            mainDiv.removeClassName('SCM_PoolTable_actions_before');
            reload.remove();
        }
	},
    
    /**
     * @param {megaButtonDisplayer} buttons Button in the popup
	 * @param {Element} htmlContent Content to display in the popup 
	 * @param {String} tableId Id of the table to display in the popup
	 * @description Display the popup with the list of possible results
	 * @since 1.0
	 */
    displayPopup: function(buttons, htmlContent, tableId) {
        //Create the popup
        this._popup = new infoPopUp({
            closeButton     : $H({'callBack': function() {
                TableKit.unloadTable(tableId); 
                this._popup.close();
            }.bind(this)}) ,
            htmlContent     : htmlContent ,
            indicatorIcon   : 'question'  ,
            width           : 730
        }); 
        
        buttons.updateHandler('SCM_popupPendingDone', this.selectLine.bind(this, tableId));
        
        buttons.updateHandler('SCM_popupPendingCancel', function() {
            TableKit.unloadTable(tableId);
            this._popup.close();
        }.bind(this));
        
        this._popup.create(); 
        TableKit.Sortable.init(tableId);  
    },
    
	/**
     * @param {String} criteria (Optional) Field to get in COMPANY(_ID), EMP_ID, FIRST_NAME, LAST_NAME, EMAIL
     * @description Get a value from the form if there is no field => all are returned
     * @return {String/Hash} The value or the list of values.
	 * @since 1.0
     */
    getValues: function(criteria) {
        var values = $H({});
        var form;
		
		if(criteria === this.custCompCriteria.id)
			return this.custCompId;
		else if(criteria === this.custCompCriteria.name && this._custCompAutoComp !== null)
			return this._custCompAutoComp.getValue().idAdded;
		else if(criteria)
            return this.parentNode.down('input#SCM_FindEmpl_'+this.ident+'_'+criteria).value;
        else {
			formRow = this.parentNode.down('input#SCM_FindEmpl_'+this.ident+'_EMP_ID').up(1);
            $A(['EMP_ID', 'FIRST_NAME', 'LAST_NAME', 'EMAIL']).each(function(criter) {
                values.set(criter, formRow.down('input#SCM_FindEmpl_'+this.ident+'_' + criter).value);
            }.bind(this));
			
			//Add the customer or company id
			if(this._custCompAutoComp !== null)
				values.set(this.custCompCriteria.name, this._custCompAutoComp.getValue().textAdded)
			else
				values.set(this.custCompCriteria.name, formRow.down('input#SCM_FindEmpl_'+this.ident+'_' + this.custCompCriteria.name).value);
			
			//Add the customer or company name
			values.set(this.custCompCriteria.id, this.custCompId);
			
            return values;
        }
    },
	
    /**
     * @param {Hash} values Object with values for fields in COMPANY(_ID), EMP_ID, FIRST_NAME, LAST_NAME, EMAIL
     * @description Set a value from the form if there is no field => all the precised fields are updated.
	 * @since 1.0
     */
    setValues: function(values) {
        if(Object.isEmpty(values)) return;
		
		values.each(function(val) {
			if(val.key === this.custCompCriteria.id) {
				this.custCompId = val.value;
				if(!Object.isEmpty(this._custCompAutoComp)) 
					this._custCompAutoComp.setDefaultValue(val.value, false, false);
			} else {
				var field = this.parentNode.down('input#SCM_FindEmpl_' + this.ident + '_' + val.key);
				if (!Object.isEmpty(field)) 
					field.value = val.value;
			}
        }.bind(this));
		
		if(!Object.isEmpty(values.get('EMP_ID')) && !Object.isEmpty(values.get(this.custCompCriteria.name)) && this.formDisabled === false)
			this.formEnable(true);

		if(!Object.isEmpty(values.get('EMP_ID')) && this.formDisabled === false)
			document.fire('EWS:scm_employeeSelected', {values: values, ident: this.ident} );	
    }
});
/**
 * @class
 * @description In this class, search forms have a customer search via input field
 * @augments ScmEmployeeSearch
 * @author jonathanj & nicolasl
 * @version 1.0
 */
var ScmEmployeeSearchCustomerBased = Class.create(ScmEmployeeSearch, /** @lends ScmEmployeeSearchCustomerBased.prototype */{
	/**
	 * Class constructor that initialize that the search of company is done via input field.
	 * @param {Application} parent Caller application
	 * @param {String} ident Name used to identify the search employee form
	 * @param {Boolean} onExistingTicket Parameter to send to HRW for backend searches
	 * @param {Element} parentNode HTML element that shoudl contains the form.
	 * @since 1.0
	 */
    initialize: function($super, parent, ident, onExistingTicket, parentNode) {
		this.custCompCriteria	= {name: 'COMPANY', id: 'COMPANY_ID'};
		this.displayCustComp 	= 'INPUT';
		$super(parent, ident, onExistingTicket, parentNode);
	},
	
	/**
	 * @param {Element} form The form object once it was added in the HTML content
	 * @param {Boolean} disabled Is the form to disabled?
	 * @param {Boolean} customerMandatory (optional) Is the customer field mandatory as first field  
	 * @description Add the event to manage the search of en employee
	 * @since 1.0
	 */    
    setFormInitial: function(form, disabled, customerMandatory) {
		this.custCompMandatory = customerMandatory;
		
		//If there is no action on the field
		if (disabled === true) {
			this.hideNoResult();
			return;
		}

		this._custCompAutoCompId = 'SCM_FindEmpl_' + this.ident + '_' + this.custCompCriteria.name;
		
		//If the field customer is mandatory
		if (customerMandatory === true) {
			var params = $H({scAgentId: hrwEngine.scAgentId});
			var type;

			var customerField = form.down('[id="'+this._custCompAutoCompId+'"]');
			
			//Disable all fields except the customer
			this.formDisable(false);
			
			if(this.displayCustComp !== null) {
				//For the autocomplete, load the list of customers
				if(this.displayCustComp === 'AUTOCOMPLETE')
					hrwEngine.callBackend(this.parentApp, 'Admin.Bhou', params, this.custCompBuildAutoComplete.bind(this, customerField));
				
				//Add the event handlers on ENTER key
				else if (this.displayCustComp === 'INPUT')
					customerField.observe('keydown', this.inputKeyPressed.bindAsEventListener(this, 'customer'));
			} else {
				new PeriodicalExecuter(function(pe) {
					if(this.displayCustComp === null) return;
					pe.stop();
					//For the autocomplete, load the list of customers
					if(this.displayCustComp === 'AUTOCOMPLETE')
						hrwEngine.callBackend(this.parentApp, 'Admin.Bhou', params, this.custCompBuildAutoComplete.bind(this, customerField));
					
					//Add the event handlers on ENTER key
					else if (this.displayCustComp === 'INPUT')
						customerField.observe('keydown', this.inputKeyPressed.bindAsEventListener(this, 'customer'));
				}, 1);
			}
			
			this.hideNoResult();
			document.fire('EWS:scm_noEmployeeSelected', this.ident);
			return;
		}

		//Add the event handlers on ENTER key
		form.childElements().each(function(formItem){
			var input = formItem.down('input');
			if (Object.isEmpty(input)) return;

			input.observe('keydown', this.inputKeyPressed.bindAsEventListener(this, 'standard'));
		}.bind(this));
		
		this.hideNoResult();
    },
	
	/**
	 * @event
	 * @param {Event} event Generated event
	 * @param {String} accessType Is the calling input field: 
	 * <ul>
	 * 	<li>a '<b>standard</b>' input field, </li>
	 * 	<li>a '<b>customer</b>' field,</li>
	 * 	<li>a '<b>company</b>' field or </li>
	 * 	<li>an '<b>unauthorized</b>' field.</li>
	 * </ul>
	 * @description (Abstract) Handler for the selection of a field as input text.
	 * @since 1.0
	 * <br/>Modifications for 2.1:
	 * <ul>
	 * <li>Use the standard encoding before sending to HRW</li>
	 * </ul>
	 */ 
	inputKeyPressed: function(event, accessType) {				
		//Do only something if the key is ENTER
		if(event.keyCode !== 13 && event.keyCode !== 14) {
			//since 1.1 Remove the list of old results if the value change
			this.removeLastSearchButton(event.element().identify());
			document.fire('EWS:scm_employeeSearchChanged', this.ident);
			return false;
		}
		
		if(this.checkFormEntry(event.element().value) === false) {
			if(accessType !== 'standard') {
				values = $H({
                    EMP_ID      : '',
                    FIRST_NAME  : '',
                    LAST_NAME   : '',
                    EMAIL       : ''   
                });
				values.set(this.custCompCriteria.name	, '');
				values.set(this.custCompCriteria.id		, '');
				
                this.setValues(values);
				
                this.displayNoResult();
				if(this.custCompMandatory === true) this.formDisable(false);
                document.fire('EWS:scm_noEmployeeSelected', this.ident);	
			}
			return;
		}
		
		this._lastSearchedField = event.element();
		//For all common fields, use the standard way
		if (accessType === 'standard')
			this.searchEmployee(this._lastSearchedField.value, this._lastSearchedField.identify().substr(14 + this.ident.length));
			
		//For the customer field, call the method that allow to search company with a pattern
		else
			hrwEngine.callBackend(	this.parentApp							, 
									'Admin.SearchCustomersByName'			, 
									$H({
										scAgentId	: hrwEngine.scAgentId		,
										//since 2.1 Use the standard encoding
										name		: HrwRequest.encode(event.element().value)
									})										, 
									this.custCompSearchResultList.bind(this), 
									true									);
	},
	
	/**
	 * @param {String} fieldValue Value given by the user in the form field
	 * @param {String} criteria Is it the customer, the employee id, the name or the email that is the criteria 
	 * @description Get from the back end the list of users that match teh given informations. 
	 * @since 1.0
	 * @see ScmEmployeeSearch#employeeSearchResultList
	 */
    searchEmployee: function($super, fieldValue, criteria) {
     	if(criteria === this.custCompCriteria.name)
        	hrwEngine.callBackend(this.parentApp, 'Admin.Bhou', $H({scAgentId: hrwEngine.scAgentId}), this.employeeSearchResultList.bind(this));
		else
			$super(fieldValue, criteria);

    },
	/**
     * @param {JSON Object or Array} listCustomer List of the customers
     * @description Build a standardized list of customers to use elsewhere.
     * @return {Array} The list of customers.
	 * @since 1.0
     */
	getListCustComps: function(listCustomer) {
		var listCustomerArray = $A();
		
		if(!Object.isHash(listCustomer)) {
			if(listCustomer.EWS.HrwResponse.HrwResult.ArrayOfKeyValue)
				listCustomerArray = objectToArray(listCustomer.EWS.HrwResponse.HrwResult.ArrayOfKeyValue.KeyValue);
		} else 
			listCustomer.each(function(customer) {
				listCustomerArray.push({Key: customer.key, Value: customer.value.Name});
			}.bind(this));
		
		return listCustomerArray;
	}
});
/**
 * @class
 * @description In this class, search forms have a customer search via select box
 * @augments ScmEmployeeSearch
 * @author jonathanj & nicolasl
 * @version 1.0
 */
var ScmEmployeeSearchCompanyBased = Class.create(ScmEmployeeSearch, /** @lends ScmEmployeeSearchCompanyBased.prototype */{
	/**
	 * Class constructor that initialize that the search of company is done via input field.
	 * @param {Application} parent Caller application
	 * @param {String} ident Name used to identify the search employee form
	 * @param {Boolean} onExistingTicket Parameter to send to HRW for backend searches
	 * @param {Element} parentNode HTML element that shoudl contains the form.
	 * @since 1.0
	 */	
    initialize: function($super, parent, ident, onExistingTicket, parentNode) {
		this.custCompCriteria	= {name: 'COMPANY', id: 'COMPANY_ID'};	
		this.displayCustComp 	= 'AUTOCOMPLETE';
		$super(parent, ident, onExistingTicket, parentNode);
	},
	
	/**
	 * @param {Element} form The form object once it was added in the HTML content
	 * @param {Boolean} disabled Is the form to disabled?
	 * @param {Boolean} customerMandatory (optional) Is the customer field mandatory as first field  
	 * @description Add the event to manage the search of en employee
	 * @since 1.0
	 */   
    setFormInitial: function(form, disabled, companyMandatory) {
		this.custCompMandatory = companyMandatory;
		
		//If there is no action on the field
		if (disabled === true) {
			this.formDisable(true);
			this.hideNoResult();
			return;
		}
		
		this._custCompAutoCompId = 'SCM_FindEmpl_' + this.ident + '_' + this.custCompCriteria.name;
		
		//If the field company is mandatory
		if (companyMandatory === true) {
			var params = $H({scAgentId: hrwEngine.scAgentId});
			var type;
			var companyField = form.down('[id="'+this._custCompAutoCompId+'"]');

			//Disable all fields except the company
			this.formDisable(false);

			if(this.displayCustComp !== null) {
				//For the autocomplete, load the list of companies
				if(this.displayCustComp === 'AUTOCOMPLETE')
					hrwEngine.callBackend(this.parentApp, 'Admin.CollectCompanies', params, this.custCompBuildAutoComplete.bind(this, companyField));
				
				//Add the event handlers on ENTER key	
				else if (this.displayCustComp === 'INPUT')
					companyField.observe('keydown', this.inputKeyPressed.bindAsEventListener(this, 'company'));
			} else {
				new PeriodicalExecuter(function(pe) {
					if(this.displayCustComp === null) return;
					pe.stop();
					//For the autocomplete, load the list of companies
					if(this.displayCustComp === 'AUTOCOMPLETE')
						hrwEngine.callBackend(this.parentApp, 'Admin.CollectCompanies', params, this.custCompBuildAutoComplete.bind(this, companyField));
					
					//Add the event handlers on ENTER key	
					else if (this.displayCustComp === 'INPUT')
						companyField.observe('keydown', this.inputKeyPressed.bindAsEventListener(this, 'company'));
				}.bind(this), 1);
			}
			
			this.hideNoResult();
			document.fire('EWS:scm_noEmployeeSelected', this.ident);
			return;
		}

		//Add the event handlers on ENTER key
		form.childElements().each(function(formItem){
			var input = formItem.down('input');
			if (Object.isEmpty(input)) return;

			input.observe('keydown', this.inputKeyPressed.bindAsEventListener(this, 'standard'));
		}.bind(this));
		
		this.hideNoResult();
    },
	
	/**
	 * @event
	 * @param {Event} event Generated event
	 * @param {String} accessType Is the calling input field: 
	 * <ul>
	 * 	<li>a '<b>standard</b>' input field, </li>
	 * 	<li>a '<b>customer</b>' field,</li>
	 * 	<li>a '<b>company</b>' field or </li>
	 * 	<li>an '<b>unauthorized</b>' field.</li>
	 * </ul>
	 * @description (Abstract) Handler for the selection of a field as input text.
	 * @since 1.0
	 * <br/>Modification for 1.1
	 * <ul>
	 * <li>If there is a change in a field, remove the list of last result if there exist</li>
	 * </ul>
	 */ 
	inputKeyPressed: function(event, accessType) {			
		//Do only something if the key is ENTER
		if(event.keyCode !== 13 && event.keyCode !== 14) {
			//since 1.1 Remove the list of old results if the value change
			this.removeLastSearchButton(event.element().identify());
			document.fire('EWS:scm_employeeSearchChanged', this.ident);
			return false;
		}
		
		if(this.checkFormEntry(event.element().value) === false) {
			if(accessType !== 'standard') {
				values = $H({
                    EMP_ID      : '',
                    FIRST_NAME  : '',
                    LAST_NAME   : '',
                    EMAIL       : ''   
                });
				values.set(this.custCompCriteria.name	, '');
				values.set(this.custCompCriteria.id		, '');
				
                this.setValues(values);
				
                this.displayNoResult();
                document.fire('EWS:scm_noEmployeeSelected', this.ident);	
			}
			return;
		}
		
		this._lastSearchedField = event.element();
		
		//For all common fields, use the standard way
		if(accessType === 'standard') 
			this.searchEmployee(this._lastSearchedField.value, this._lastSearchedField.identify().substr(14 + this.ident.length));
			
		//For the customer field, call the method that allow to search company with a pattern
		else 
			hrwEngine.callBackend(	this.parentApp							, 
									'Admin.CollectCompanies'				, 
									$H({scAgentId: hrwEngine.scAgentId})	, 
									this.custCompSearchResultList.bind(this), 
									true									);	
	},
	
	/**
	 * @param {String} fieldValue Value given by the user in the form field
	 * @param {String} criteria Is it the customer, the employee id, the name or the email that is the criteria 
	 * @description Get from the back end the list of users that match teh given informations. 
	 * @since 1.0
	 * @see ScmEmployeeSearch#employeeSearchResultList
	 */
    searchEmployee: function($super, fieldValue, criteria) {
        if(criteria === this.custCompCriteria.name)
        	hrwEngine.callBackend(this.parentApp, 'Admin.Bhou', $H({scAgentId: hrwEngine.scAgentId}), this.employeeSearchResultList.bind(this));
		else
			$super(fieldValue, criteria);
	},
	
	/**
     * @param {JSON Object or Array} listCompanies List of the companies
     * @description Build a standardized list of companies to use elsewhere.
     * @return {Array} List of the companies.
	 * @since 1.0
     */
	getListCustComps: function(listCompanies) {
		var listCompaniesArray = $A();
		
		if(!Object.isHash(listCompanies)) {
			if(listCompanies.EWS.HrwResponse.HrwResult.ArrayOfKeyValue)
				listCompaniesArray = objectToArray(listCompanies.EWS.HrwResponse.HrwResult.ArrayOfKeyValue.KeyValue);
		} else
			listCompanies.each(function(company) {
				listCompaniesArray.push({Key: company.key, Value: company.value.Name});
			}.bind(this));
		
		return listCompaniesArray;
	}

});

/**
 * @param {Application} parent Caller application
 * @param {String} ident Name used to identify the search employee form
 * @param {Boolean} onExistingTicket Parameter to send to HRW for backend searches
 * @param {Element} parentNode HTML element that shoudl contains the form.
 * @description Choose the kind of employee search to create depending on the HRW login information.
 * @return {ScmEmployeeSearch} The employee search with the correct subtype.
 * @since 1.0
 */
ScmEmployeeSearch.factory = function(parent, ident, onExistingTicket, parentNode) {
	var employeeSearch;
	
	if(Object.isEmpty(parentNode)) parentNode = parent.virtualHtml;

	if(hrwEngine.customerBased === true)
		employeeSearch = new ScmEmployeeSearchCustomerBased(parent, ident, onExistingTicket, parentNode);
	else
		employeeSearch = new ScmEmployeeSearchCompanyBased(parent, ident, onExistingTicket, parentNode);
	
	return employeeSearch;
};
/**
 * @class
 * @description Class representing an HRW ticket in XML format. This object is used to generate the xml ticket
 * used when saving a ticket.
 * @author jonathanj & nicolasl
 * @version 2.0
 * <br>
 * Change for version 2.0<ul>
 * <li>Add of the solved flag in the XML generation</li>
 * <li>Add of the service area in the XML generation</li>
 * </ul>
 */
var hrwTicketObject = Class.create( /** @lends hrwTicketObject.prototype */{
	/**
	 * ticket identifier.
	 * @default ""
	 * @type int
	 * @since 1.0
	 */
	ticketId: "",
	/**
	 * ticket description.
	 * @default ""
	 * @type String
	 * @since 1.0
	 */
    description: "",
	/**
	 * ticket solution.
	 * @default ""
	 * @type String
	 * @since 1.0
	 */
    solution: "",
	/**
	 * Affected employee Id.
	 * @default ""
	 * @type int
	 * @since 1.0
	 */
    employeeId: "",
	/**
	 * Affected employee first name.
	 * @default ""
	 * @type String
	 * @since 1.0
	 */
    employeeFirstName: "",
	/**
	 * Affected employee last name.
	 * @default ""
	 * @type String
	 * @since 1.0
	 */
    employeeLastName: "",
	/**
	 * Company Skill Id.
	 * @default -1
	 * @type int
	 * @since 1.0
	 */
    companySkillId: -1,
	/**
	 * Ticket subject.
	 * @default ""
	 * @type String
	 * @since 1.0
	 */
    shortDescription: "",
	/**
	 * Requestor id.
	 * @default ""
	 * @type int
	 * @since 1.0
	 */
    requestorId: "",
	/**
	 * Requestor first name.
	 * @default ""
	 * @type String
	 * @since 1.0
	 */
    requestorFirstName: "",
	/**
	 * Requestor last name.
	 * @default ""
	 * @type String
	 * @since 1.0
	 */
    requestorLastName: "",
	/**
	 * Custom field 1.
	 * @default ""
	 * @type String
	 * @deprecated
	 * @since 1.0
	 */
    customField1: "",
	/**
	 * Custom field 2.
	 * @default ""
	 * @type String
	 * @deprecated
	 * @since 1.0
	 */
    customField2: "",
	/**
	 * Ticket type (1 = internal, 0 = external).
	 * @default 0
	 * @type int
	 * @since 1.0
	 */
    type: 0,
	/**
	 * Ticket service Id.
	 * @default -1
	 * @type int
	 * @since 1.0
	 */
    serviceSkillId: -1,
	/**
	 * Ticket service group Id.
	 * @default -2147483648 (default value for HRW)
	 * @type int
	 * @since 1.0
	 */
    serviceGroupId: -2147483648,
	/**
	 * Ticket service area Id.
	 * @default -2147483648 (default value for HRW)
	 * @type int
	 * @since 2.0
	 */
	serviceAreaId: -2147483648,
	/**
	 * Ticket grouping Id.
	 * @default -2147483648 (default value for HRW)
	 * @type int
	 * @since 1.0
	 */
    groupingSkillId: -2147483648,
	/**
	 * Ticket skills values (with the values, HRW can retrieve the skill Id associated).
	 * @default -2147483648 (default value for HRW)
	 * @type Array
	 * @deprecated
	 * @since 1.0
	 */
    hrwTicketSkills: null,
	/**
	 * Assigned dynamic due date if any.
	 * @default null
	 * @type String
	 * @since 1.0
	 */
	dueDateDyn: null,
	/**
	 * Flag to check if the ticket is internal or external.
	 * @default null
	 * @type boolean
	 * @deprecated
	 * @since 1.0
	 */
	isInternal: null,
	/**
	 * State of the security questions. They might be skipped that's why we have the status here.
	 * @default null
	 * @type String
	 * @since 1.0
	 */
	securityQuestionsState: null,
	/**
	 * Solved flag of the ticket
	 * @default 'false'
	 * @type String
	 * @since 2.0
	 */
	solved: 'false',
	
	/**
	 * Constructor for the object. It initialize the object attributes.
	 * @param {JSon} values
	 * @param {boolean} withId Flag to know if the ticket ID should be part of the XML generation.<br>
	 * For the creation, the ticket ID is unknown so it cannot be part of the generated XML.
	 * @since 1.0<br>
	 * Modified in version 2.0<ul>
	 * 	<li>Add of the solved flag in the XML generation</li>
	 * 	<li>Add of the service area in the XML generation</li>
	 * </ul>
	 */
	initialize:function(values, withId){
		if (withId == true){
			this.ticketId = values.ticketId;	
		}
		
		this.description 		= values.description;
		this.solution 			= values.solution;
		this.employeeId 		= values.employeeId;
		this.employeeFirstName 	= values.employeeFirstName;
		this.employeeLastName 	= values.employeeLastName;
		this.companySkillId 	= values.companySkillId;
		this.shortDescription 	= values.shortDescription;
		this.requestorId 		= values.requestorId;        		// SecEmployeeId
		this.requestorFirstName = values.requestorFirstName; 		// SecEmployeeFirstName
		this.requestorLastName	= values.requestorLastName;  		// SecEmployeeLastName
		this.customField1		= values.customField1;
		this.customField2		= values.customField2;
		this.isInternal			= values.type; 						// 1 = Internal, 0 = External
		this.serviceSkillId		= values.serviceSkillId;
		this.serviceAreaId		= values.serviceAreaId;
		this.serviceGroupId		= values.serviceGroupId;
		this.groupingSkillId	= values.groupingSkillId;
		this.hrwTicketSkills	= values.hrwTicketSkills;
		if (values.solved) this.solved = values.solved;
		if(values.securityQuestionsState)
			this.securityQuestionsState = values.securityQuestionsState;
		if(values.dueDateDyn)
			this.dueDateDyn		= values.dueDateDyn;

	},
	/**
	 * Function building the XML version of the object to be used to be sent to the HRW backend in order to create/update the ticket
	 * @param {boolean} withId Flag to know if the ticket ID should be part of the XML generation.<br>
	 * For the creation, the ticket ID is unknown so it cannot be part of the generated XML.
	 * @return {String} The XML version of the ticket object.
	 * @since 1.0<br>
	 * Modified in version 2.0<ul>
	 * <li>Add of the solved flag in the XML generation</li>
	 * <li>Add of the service area in the XML generation</li>
	 * </ul>
	 */
	toXml:function(withId){
		var xml ='<HrwTicket>';
		
		if (withId == true)
			xml +=	'<TicketId>'+ 				this.ticketId 				+'</TicketId>';
		
		if(this.dueDateDyn !== null)
			xml +=	'<DueDateDyn>'+ 			this.dueDateDyn 			+'</DueDateDyn>';
		
		if(this.securityQuestionsState !== null)
			xml += '<SecurityQuestionsState>'+	this.securityQuestionsState	+'</SecurityQuestionsState>';
		
		xml += 		'<CompanySkillId>'+			this.companySkillId			+'</CompanySkillId>'+
					'<ServiceSkillId>'+			this.serviceSkillId			+'</ServiceSkillId>'+
					'<Description>' + 			this.description 			+'</Description>'+
					'<Solution>'+ 				this.solution 				+'</Solution>'+
					'<EmployeeId>'+				this.employeeId				+'</EmployeeId>'+
					'<EmployeeFirstName>'+		this.employeeFirstName		+'</EmployeeFirstName>'+
					'<EmployeeLastName>'+		this.employeeLastName		+'</EmployeeLastName>'+
					'<ShortDescription>'+	 	this.shortDescription		+'</ShortDescription>'+
					'<SecEmployeeId>'+			this.requestorId			+'</SecEmployeeId>'+
					'<SecEmployeeFirstName>'+ 	this.requestorFirstName 	+'</SecEmployeeFirstName>'+
					'<SecEmployeeLastName>'+	this.requestorLastName		+'</SecEmployeeLastName>'+
					'<CustomField1>'+			this.customField1			+'</CustomField1>'+
					'<CustomField2>'+			this.customField2			+'</CustomField2>'+
					'<Type>'+					this.isInternal				+'</Type>'+
					'<ServiceGroupId>'+ 		this.serviceGroupId			+'</ServiceGroupId>'+
					'<GroupingSkillId>'+		this.groupingSkillId		+'</GroupingSkillId>'+
					'<ServiceAreaId>'+			this.serviceAreaId			+'</ServiceAreaId>'+
					'<Solved>'+					this.solved					+'</Solved>'+
				'</HrwTicket>';
		return xml;
	}
});
/**
 * @class
 * @description Class in charge of creating the XML version of the ticket skills to be used when creating/updating the HRW ticket
 * @author jonathanj & nicolasl
 * @version 1.0
 */
var hrw_ticketSkillsObject = Class.create(/** @lends hrw_ticketSkillsObject.prototype */{
	/**
	 * Ticket skills values (with the values, HRW can retrieve the skill Id associated).
	 * @default null
	 * @type Array
	 * @since 1.0
	 */
	hrwTicketSkills:null,
	/**
	 * Constructor for the object, it initialize the array of skills.
	 * @param {Array} arraySkills
	 * @since 1.0
	 */
	initialize:function(arraySkills){
		this.hrwTicketSkills = arraySkills;
	},
	/**
	 * Function in charge of building the XML version of the ticket skills.
	 * @return {String} The XML version of the ticket skills.
	 * @since 1.0
	 */
	toXml: function() {
    	var xml = "";

        if (this.hrwTicketSkills.length > 0) {
            xml += "<ArrayOfInt>";
            this.hrwTicketSkills.each(function(skill) {
				if(skill.value)
                	xml += "<int>" + skill.value + "</int>";
            });
            xml += "</ArrayOfInt>";
        }
        else {
            xml += "<ArrayOfInt />";
        }

        return xml;
    }
});

/**
 * @class
 * @description Class in charge of generating the XML version of the custom actions done on a ticket.
 * @author jonathanj & nicolasl
 * @version 1.0
 */
var hrw_customActionsObject = Class.create(/** @lends hrw_customActionsObject.prototype */{
	/**
	 * The ticket identifier.
	 * @type int
	 * @default null
	 * @since 1.0
	 */
	ticketId		:null,
	/**
	 * The custom action description.
	 * @type String
	 * @default null
	 * @since 1.0
	 */
	description		:null,
	/**
	 * The action type identifier.
	 * @type int
	 * @default null
	 * @since 1.0
	 */
	actionTypeId	:null,
	/**
	 * The privacy identifier.
	 * @type int
	 * @default null
	 * @since 1.0
	 */
	privacySkillId	:null,
	/**
	 * The time spent on the custom action.
	 * @type String
	 * @default null
	 * @since 1.0
	 */
	timeSpent		:null,
	/**
	 * Constructor for the object, it initialize the attributes of the object.
	 * @param {JSon} values
	 * @since 1.0
	 */
	initialize:function(values){
		this.ticketId		= values.ticketId;
		this.description	= values.description;
		this.actionTypeId	= values.actionTypeId;
		this.privacySkillId	= values.privacySkillId;
		this.timeSpent		= values.timeSpent;
	},
	/**
	 * Function in charge of building the XML version of the ticket custom actions.
	 * @return {String} The XML version of the ticket custom actions.
	 * @since 1.0
	 */
	toXml: function() {
    	var xml = 	'<CustomTicketAction>' +
						'<TicketId>'+ this.ticketId +'</TicketId>'+
						'<Description>'+ this.description + '</Description>'+
						'<CustomActionTypeId>'+ this.actionTypeId +'</CustomActionTypeId>'+
						'<PrivacySkillId>'+ this.privacySkillId +'</PrivacySkillId>'+
						'<TimeSpent>'+ this.timeSpent +'</TimeSpent>'+
					'</CustomTicketAction>';
        return xml;
    }
});

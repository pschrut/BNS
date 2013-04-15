/**
 * @class
 * @description Class in charge of drawing and creating the element needed for the ticket screen.<br>
 * These screens are to one used to create, view and edit the tickets. The screen will be rendered differently depending the view mode.
 * For the tree screens, there are only two templates:
 * <ul>
 * 	<li>one used for creation,</li>
 * 	<li>one for the edit and the view.</li>
 * </ul>
 * This is because the creation screen is very different compared to the one used for viewing or editing a ticket.<br>
 * The view and edit are almost the same except some componant that are only hiddden. For the rest, the design is the same. 
 * @author jonathanj & nicolasl
 * @version 2.1
 * <br/>Modified in 2.2
 * <ul>
 * <li>Replace the label "Subject" by "Short Description"</li>
 * </ul>
 * <br/>Change for version 2.1:
 * <ul>
 * <li>The new field "Schedule To" is managed (display or not)</li>
 * <li>Do not read the status label from global. This values comes from HRW</li>
 * </ul>
 * <br/>Change for version 2.0:
 * <ul>
 * 	<li>Add of the read only possibility in the attribute display</li>
 * 	<li>Add of the remaining business hours</li>
 * 	<li>Add of the mark as solved checkbox</li>
 * </ul>
 */
var scm_ticketScreen_standard_new = Class.create(/** @lends scm_ticketScreen_standard_new.prototype */{
	
	/**
	 * The container where the screen will be inserted. This is the virtuall HTML of the application creating the screen object.
	 * @type DOM Div
	 * @since 1.0
	 */
	_applicationContainer					:null,
	/**
	 * The mode of the screen, this can be:<ul>
	 * 	<li> 1 - Ticket creation</li>
	 * 	<li> 2 - View or edit ticket.</li>
	 * </ul>
	 * @type int
	 * @since 1.0
	 */
	_mode									:null,
	/**
	 * Hash containing a JSon object with the following element:
	 * <ul><li>content: the reference to the content of an unvovable widget</li>
	 * <li>title: the reference to the title of an unvovable widget.</li></ul>
	 * @type Hash
	 * @since 1.0
	 */
	_topWidget    							:null,
	/**
	 * Hash containing a JSon object with the following element:
	 * <ul><li>content: the reference to the content of an unvovable widget</li>
	 * <li>title: the reference to the title of an unvovable widget.</li></ul>
	 * @type Hash
	 * @since 1.0
	 */
	_middleWidget 							:null,
//	_bottomWidget 							:null,
	/**
	 * Reference to the DOM Div that contains the requestor employee search.
	 * @type DOM Div
	 * @since 1.0
	 */
	empSearchSpotReq						:null,
	/**
	 * ID of the div containing the requestor employee search.
	 * @type String
	 * @since 1.0
	 */
	empSearchReqId							:null,
	/**
	 * Reference to the DOM Div that contains the affected employee employee search.
	 * @type DOM Div
	 * @since 1.0
	 */
	empSearchSpotAff						:null,
	/**
	 * ID of the div containing the affected employee employee search.
	 * @type String
	 * @since 1.0
	 */
	empSearchAffId							:null,
	/**
	 * Reference to the DOM Div that contains the dynamic company information.
	 * @type DOM Div
	 * @since 1.0
	 */
	dynCompInfoSpot							:null,
	/**
	 * Array of possible info concerning the mployee. These info are directly coming from the HRW backend.
	 * @type Array
	 * @since 1.0
	 */
	dynCompInfoList							:null,
	/**
	 * 
	 */
//	ticketIDSpot							:null,
	/**
	 * JSon object containing:<ul>
	 * <li>value: reference to the div containing the value of the ticket creation date,</li>
	 * <li>label: reference to the div containing the label associated to the ticket creation date.</li>
	 * @type JSon
	 * @since 1.0
	 */
	ticketCdateSpot							:null,
	/**
	 * JSon object containing:<ul>
	 * <li>value: reference to the div containing the value of the ticket subject,</li>
	 * <li>label: reference to the div containing the label associated to the ticket subject,</li>
	 * <li>id: id of the div containing the ticket subject.</li>
	 * @type JSon
	 * @since 1.0
	 */
	ticketSubjectSpot						:null,
	/**
	 * JSon object containing:<ul>
	 * <li>value: reference to the div containing the value of the ticket status,</li>
	 * <li>label: reference to the div containing the label associated to the ticket status.</li>
	 * @type JSon
	 * @since 1.0
	 */
	ticketStatusSpot						:null,
	/**
	 * JSon object containing:<ul>
	 * <li>value: reference to the div containing the ticket service groups,</li>
	 * <li>label: reference to the div containing the label associated to the ticket service groups,</li>
	 * <li>id: id of the div containing the ticket service groups.</li>
	 * @type JSon
	 * @since 1.0
	 */
	ticketSGSpot							:null,
	/**
	 * JSon object containing:<ul>
	 * <li>value: reference to the div containing the ticket services,</li>
	 * <li>label: reference to the div containing the label associated to the ticket services,</li>
	 * <li>id: id of the div containing the ticket services.</li>
	 * @type JSon
	 * @since 1.0
	 */
	ticketSSpot								:null,
	/**
	 * JSon object containing:<ul>
	 * <li>value: reference to the div containing the ticket service areas,</li>
	 * <li>label: reference to the div containing the label associated to the ticket service areas,</li>
	 * <li>id: id of the div containing the ticket service areas.</li>
	 * @type JSon
	 * @since 1.0
	 */
	ticketSASpot							:null,
//	ticketSSpotId							:null,
	/**
	 * JSon object containing:<ul>
	 * <li>value: reference to the div containing the ticket due date,</li>
	 * <li>label: reference to the div containing the label associated to the ticket due date.</li>
	 * @type JSon
	 * @since 1.0
	 */
	ticketDdateSpot							:null,
	/**
	 * JSon object containing:<ul>
	 * <li>value: reference to the div containing the ticket description,</li>
	 * <li>label: reference to the div containing the label associated to the ticket description,</li>
	 * <li>id: id of the div containing the ticket description (creation only not available in view/edit).</li>
	 * @type JSon
	 * @since 1.0
	 */
	ticketDescrSpot							:null,
	/**
	 * JSon object containing:<ul>
	 * <li>value: reference to the div containing the new action editor,</li>
	 * <li>id: id of the div containing the new action editor div.</li>
	 * @type JSon
	 * @since 1.0
	 */
	ticketDescrEditSpot						:null,
	/**
	 * JSon object containing:<ul>
	 * <li>value: reference to the div containing the description editor,</li>
	 * <li>id: id of the div containing the description editor div.</li>
	 * @type JSon
	 * @since 1.0
	 */
	ticketDescrDescrSpot					:null,
	/**
	 * JSon object containing:<ul>
	 * <li>value: reference to the div containing the solution editor,</li>
	 * <li>id: id of the div containing the solution editor div.</li>
	 * @type JSon
	 * @since 1.0
	 */
	ticketDescrSolSpot						:null,
	/**
	 * JSon object containing:<ul>
	 * <li>value: reference to the div containing the ticket attributes,</li>
	 * <li>id: id of the div containing the ticket attributes div.</li>
	 * @type JSon
	 * @since 1.0
	 */
	ticketAttrSpot							:null,
	/**
	 * JSon object containing:<ul>
	 * <li>value: reference to the div containing the checkbox for email sending.</li>
	 * @type JSon
	 * @since 1.0
	 */
	ticketCheckSpot							:null,
	/**
	 * JSon object containing:<ul>
	 * <li>value: reference to the div containing the ticket remaining business hours,</li>
	 * <li>label: reference to the div containing the label linked to the ticket remaining business hours.</li>
	 * @type JSon
	 * @since 1.0
	 */
	ticketRtimeSpot							:null,
	/**
	 * JSon object containing:<ul>
	 * <li>value: reference to the div containing the previous actions.</li>
	 * @type JSon
	 * @since 1.0
	 */
	ticketPrevActSpot						:null,
	/**
	 * JSon object containing:<ul>
	 * 	<li>value: reference to the div containing the checkbox to mark the ticket as solved</li>
	 * </ul>
	 * @type JSon
	 * @since 2.0
	 */
	ticketMarkSolvedSpot					:null,
	
//	ticketToSelectionSpot					:null,
//	ticketTypeSelectionSpot					:null,
//	companyAttributesAC 					:null,
//	serviceAttributesAC 					:null,
	/**
	 * JSon object containing:<ul>
	 * <li>value: reference to the div containing the checkbox for email option,</li>
	 * <li>id: id of the div containing the label linked to the ticket remaining business hours.</li>
	 * @type JSon
	 * @since 1.0
	 */
	ticketMailCheckBox						:null,

//	ticketMailCheckBoxDiv					:null,
	/**
	 * JSon object containing:<ul>
	 * <li>value: reference to the div containing the ticket company grouping,</li>
	 * <li>id: id of the div containing the label linked to the ticket company grouping.</li>
	 * @type JSon
	 * @since 1.0
	 */
	ticketCompanyGroupingSpot 				:null,
	/**
	 * JSon object containing:<ul>
	 * <li>value: reference to the div containing the ticket company grouping drop down,</li>
	 * <li>id: id of the div containing the label linked to the ticket company grouping drop down.</li>
	 * @type JSon
	 * @since 1.0
	 */
	ticketCompanyGroupingDDSpot				:null,
	/**
	 * JSon object containing:<ul>
	 * <li>value: reference to the div containing the hide technical fields flag,</li>
	 * <li>id: id of the div containing the label linked to the hide technical fields flag.</li>
	 * @type JSon
	 * @since 1.2
	 */
	ticketActionHideTech					: null,
	/**
	 * JSon object containing:<ul>
	 * <li>value: reference to the div containing the label of ticket company grouping drop down div,</li>
	 * <li>id: id of the div containing the label linked to the ticket company grouping drop down.</li>
	 * @type JSon
	 * @since 1.0
	 */
	ticketCompanyGroupingLabel 				:null,
	/**
	 * JSon object containing:<ul>
	 * <li>value: reference to the div containing the new action type,</li>
	 * <li>id: id of the div containing the label linked to the new action type.</li>
	 * @type JSon
	 * @since 1.0
	 */
	ticketActionTypeSelectionEditSpotLabel	:null,
	/**
	 * JSon object containing:<ul>
	 * <li>value: reference to the div containing the "to" field on the top of the editor when sending an email,</li>
	 * <li>id: id of the div containing the "to" field on the top of the editor when sending an email.</li>
	 * @type JSon
	 * @since 1.0
	 */
	ticketEditorToHeader					:null,
	/**
	 * JSon object containing:<ul>
	 * <li>value: reference to the div containing the attachments on the top of the editor when sending an email,</li>
	 * <li>id: id of the div containing the attachments field on the top of the editor when sending an email.</li>
	 * @type JSon
	 * @since 1.0
	 */
	ticketEditorAttachmentHeader			:null,
	/**
	 * JSon object containing:<ul>
	 * <li>value: reference to the div containing the subject on the top of the editor when sending an email,</li>
	 * <li>id: id of the div containing the subject field on the top of the editor when sending an email.</li>
	 * @type JSon
	 * @since 1.0
	 */
	ticketEditorSubjectHeader				:null,
	/**
	 * JSon object containing:<ul>
	 * <li>value: reference to the div containing the "CC" field on the top of the editor when sending an email,</li>
	 * <li>id: id of the div containing the "CC" field on the top of the editor when sending an email.</li>
	 * @type JSon
	 * @since 1.0
	 */
	ticketEditorCCHeader					:null,
	/**
	 * JSon object containing:<ul>
	 * <li>value: reference to the div containing the From on the top of the editor when sending an email,</li>
	 * <li>id: id of the div containing the From field on the top of the editor when sending an email.</li>
	 * @type JSon
	 * @since 1.0
	 */
	ticketEditorFromHeader					:null,
	/**
	 * JSon object containing:<ul>
	 * <li>value: reference to the div containing the button at the bottom of the editor,</li>
	 * <li>id: id of the div containing the buttons at the bottom of the editor.</li>
	 * @type JSon
	 * @since 1.0
	 */
	leftButtonPart							:null,
	/**
	 * Reference to the div containing the requestor link.
	 * @type DOM Div
	 * @since 1.0
	 */
	requestorLink							:null,
	/**
	 * Reference to the div containing the affected employee link.
	 * @type DOM Div
	 * @since 1.0
	 */
	affEmployeeLink							:null,
	/**
	 * Reference to the div containing the links to the different company info retrieved from the HRW backend.
	 * @type DOM Div
	 * @since 1.0
	 */
	dynCompInfoLinks						:null,
	/**
	 * HTML generated for the ticket attributes.
	 * @type HTML
	 * @since 1.0
	 */
	attributesHtml							:null,
	/**
	 * Reference to the div containing the "View Action" link.
	 * @type DOM Div
	 * @since 1.0
	 */
	viewActionLink							:null,
	/**
	 * Reference to the div containing the "New Action" link.
	 * @type DOM Div
	 * @since 1.0
	 */
	newActionLink							:null,
	/**
	 * Reference to the div containing the "Description" link.
	 * @type DOM Div
	 * @since 1.0
	 */
	descriptionLink							:null,
	/**
	 * Reference to the div containing the "Solution" link.
	 * @type DOM Div
	 * @since 1.0
	 */
	solutionLink							:null,
	/**
	 * Buttons available for creation.
	 * @type megaButtonDisplayer
	 * @since 1.0
	 */
	_creationButtons						:null,
	/**
	 * Button available for edition or view.
	 * @type megaButtonDisplayer
	 * @since 1.0
	 */
	_viewEditButtons						:null,
	
	/**
	 * Class constructor.<br> 
	 * This function initializes the attributes _applicationContainer and _mode and calling the function _mainPanelsInit in order to create the different panels of the screen.
	 * @param {Html Div} applicationContainer The container in witch the created Html should be inserted
	 * @param {int} mode The mode of the ticket screen. This can be: 1 for ticket creation, 2 for ticket view
	 * @see scm_ticketScreen_standard_new#_mainPanelsInit
	 * @since 1.0
	 */
	initialize:function(applicationContainer, mode){
		this._applicationContainer = applicationContainer;
		this._mode = mode;
		
		this._mainPanelsInit();	
		
		this.statuses = $H( {
			11 : {id: 'NotAssign'    , label: 'Not assigned'		, classNameExt: 'SCM_DotBlackIcon SCM_DotIconsSize'		, classNameInt: 'SCM_DotBlackTicon SCM_DotIconsSize' 	},
			4  : {id: 'Wait'         , label: 'Waiting'				, classNameExt: 'SCM_DotGreenIcon SCM_DotIconsSize'		, classNameInt: 'SCM_DotGreenTicon SCM_DotIconsSize' 	},
			3  : {id: 'Sched'        , label: 'Scheduled'			, classNameExt: 'SCM_DotBlueIcon SCM_DotIconsSize'		, classNameInt: 'SCM_DotBlueTicon SCM_DotIconsSize' 	},
			0  : {id: 'Closed'       , label: 'Closed'				, classNameExt: 'SCM_DotBrownIcon SCM_DotIconsSize'		, classNameInt: 'SCM_DotBrownTicon SCM_DotIconsSize' 	},
			7  : {id: 'Ext'          , label: 'External'		    , classNameExt: 'SCM_DotGrayIcon SCM_DotIconsSize'		, classNameInt: 'SCM_DotGrayTicon SCM_DotIconsSize' 	},
			2  : {id: 'Proc'         , label: 'Processing'			, classNameExt: 'SCM_DotOrangeIcon SCM_DotIconsSize'	, classNameInt: 'SCM_DotOrangeTicon SCM_DotIconsSize' 	},
			6  : {id: 'Pend'         , label: 'Pending'				, classNameExt: 'SCM_DotMauveIcon SCM_DotIconsSize'		, classNameInt: 'SCM_DotMauveTicon SCM_DotIconsSize' 	},
			8  : {id: 'PendSched'    , label: 'Pending-Scheduled'	, classNameExt: 'SCM_DotMauveBlueIcon SCM_DotIconsSize'	, classNameInt: 'SCM_DotMauveBlueTicon SCM_DotIconsSize' 	},
			10 : {id: 'PendNotAssign', label: 'Pending-Not assigned', classNameExt: 'SCM_DotMauveBlackIcon SCM_DotIconsSize', classNameInt: 'SCM_DotMauveBlackTicon SCM_DotIconsSize' 	},
			9  : {id: 'ProcOth'      , label: 'Processing By Other'	, classNameExt: 'SCM_DotRedIcon SCM_DotIconsSize'       , classNameInt: 'SCM_DotRedTicon SCM_DotIconsSize' 	}
		});
		
	},
	/**
	 * Function in charge of initializing the different panels of the ticket screen.<br>
	 * The screen is always divided in 3 parts:<ul>
	 * <li>Top part (will contain the employee details widget),</li>
	 * <li>Middle part (will contain the ticket details widget),</li>
	 * <li>Bottom part (not used for now).</li>
	 * The function _widgetCreate will be called to create the top widget and the the _topPanelInit is called to create the internal panels of the top part.<br>
	 * Once this is done, the same function is called in order to create the middle widget and the _middlePanelInit is called to create the internal panels of the middle part.<br>
	 * Now that all the panels are created, the function _assignContainers can be called in order to create all the references to the different panels of the screen.
	 * @see scm_ticketScreen_standard_new#_widgetCreate
	 * @see scm_ticketScreen_standard_new#_topPanelInit
	 * @see scm_ticketScreen_standard_new#_middlePanelInit
	 * @see scm_ticketScreen_standard_new#_assignContainers
	 * @since 1.0 
	 */
	_mainPanelsInit:function(){
		var mainDiv = new Element('div',{	className:"SCM_ticket_screen_mainDiv", 
											id		 :"scm_ticket_screen_mainDiv"});

		var html = '<div id="ticketScreenTopPart" class="SCM_ticket_screen_FullWidth"></div>' +
				   '<div id="ticketScreenMiddlePart" class="SCM_ticket_screen_Spacer SCM_ticket_screen_FullWidth"></div>'+
				   '<div id="ticketScreenBottomPart" class="SCM_ticket_screen_Spacer SCM_ticket_screen_FullWidth"></div>';	

		mainDiv.update(html);
		this._applicationContainer.insert(mainDiv);

		var widgetCollapse = false;

		// TOP PART CREATION
		if (this._mode == 2){
			widgetCollapse = true;
		}
		var widgetComponents = $H({
			divId	  	  :	'ticketScreenTopPart',
			container 	  : this._applicationContainer.down('[id="ticketScreenTopPart"]'),
			widgetCollapse: widgetCollapse
		});
		
		this._topWidget = this._widgetCreate(widgetComponents);
		this._topPanelInit();
		
		
		// MIDDLE PART CREATION
		widgetCollapse = false;
		widgetComponents = $H({
			divId	  	  :	'ticketScreenMiddlePart',
			container 	  : this._applicationContainer.down('[id="ticketScreenMiddlePart"]'),
			widgetCollapse: widgetCollapse
		});
		
		this._middleWidget = this._widgetCreate(widgetComponents);
		this._middlePanelInit();
		
		this._assignContainers();
	},
	
	/**
	 * Function in charge of creating all the needed panels for the top part of the ticket screen.<br>
	 * It creates the HTML that represents the two parts of the top part and insert it in the widget.<br>
	 * In order to create the panels inside the left and right part of the widget, it calls the functions _topLeftPanelInit and _topRightPanelInit giving the corresponding container reference.
	 * @see scm_ticketScreen_standard_new#_topLeftPanelInit
	 * @see scm_ticketScreen_standard_new#_topRightPanelInit
	 * @since 1.0
	 */
	_topPanelInit:function(){
		var html = 	'<table class="SCM_ticket_screen_FullWidth"><tr><td>'+
						'<div id="ticketScreenTopLeftPart" class="SCM_ticket_screen_TopLeftPart"></div>'+
						'<div id="ticketScreenTopRightPart" class="SCM_ticket_screen_TopRightPart"></div>'+
					'</td></tr></table>';
					
		this._topWidget.get('content').update(html);
		this._topWidget.get('title').update(global.getLabel('Employee_details'));
		
		this._topLeftPanelInit(this._topWidget.get('content').down('[id="ticketScreenTopLeftPart"]'));
		this._topRightPanelInit(this._topWidget.get('content').down('[id="ticketScreenTopRightPart"]'));
		
	},
	/**
	 * Function in charge of creating the left part contained in the top widget.<br>
	 * This function generates the HTML and insert it in the given container before assigning the created links to the attributes of the class.<br>
	 * This function also creates the button that will allow to create a new employee directly form the application (not available yet, for a further EMR).<br>
	 * A click on one of the link (requestor/affecte employee) will call the function _empDetailsAffectedEmployeeLinkClicked.
	 * @param {DOM Div} container The left container of the top wiget containing the employee details.
	 * @see scm_ticketScreen_standard_new#_empDetailsAffectedEmployeeLinkClicked
	 * @since 1.0
	 */
	_topLeftPanelInit:function(container){
		var html = 	'<div id="topLeftPanelRequestorLink" class="SCM_ticket_screen_Requestor">'+global.getLabel('requestor')+'</div>'+
					'<div id="topLeftPanelAffEmployeeLink" class="SCM_ticket_screen_FloatLeft application_action_link">'+global.getLabel('Affected_employee')+'</div>'+
					'<div id="topLeftPanelContainerReq" class="SCM_ticket_screen_TopLeftPanel"></div>'+
					'<div id="topLeftPanelContainerAff" class="SCM_ticket_screen_TopLeftPanel SCM_ticket_screen_hidden"></div>'+
					'<div id="topLeftPanelButton" class="SCM_ticket_screen_TopLeftPanelButton"></div>';
		container.update(html);
		
		
		this.requestorLink = container.down('[id="topLeftPanelRequestorLink"]');
		this.affEmployeeLink = container.down('[id="topLeftPanelAffEmployeeLink"]');
		this.affEmployeeLink.observe('click', this._empDetailsAffectedEmployeeLinkClicked.bindAsEventListener(this));
		
		// CREATE THE BUTTON FOR THE NEW EMPLOYEE
		var json = {
			elements: []
		};
		var aux = {
			handlerContext: null,
			type: 'button',
			idButton: 'SCM_newEmployeeButton',
			standardButton: true,
			className:'SCM_ticket_screen_NewEmpButton',
			label: global.getLabel('New_employee')
		};
		
		json.elements.push(aux);	
		var button = new megaButtonDisplayer(json);
		
// 		Implemented in next EFR		
//		container.down('[id="topLeftPanelButton"]').update(button.getButtons());
	},
	/**
	 * Function in charge of creating the content of the right part of the top widget.<br>
	 * This function creates a div that will contain the HTML recieved from the HRW backend.<br>
	 * This function calls the dynCompInfoClicked in order to display the first panel retreived from the backend.
	 * @param {DOM Div} container The right container of the top widget containing the employee details.
	 * @see scm_ticketScreen_standard_new#dynCompInfoClicked
	 * @since 1.0
	 */
	_topRightPanelInit:function(container){
		//Add the main div
		container.insert('<div id="topRightPanelContainer" class="SCM_ticket_screen_TopRightPanel"></div>');
		var topRightPanel = container.down('[id="topRightPanelContainer"]');
		this.dynCompInfoLinks = $H();
		var loopLimit = 0;
		//Add the different links
		new PeriodicalExecuter(function(pe) {
			if(loopLimit === 10){pe.stop();return;}
			if (Object.isEmpty(this.dynCompInfoList)) {loopLimit += 1;return;}

			pe.stop();
			this.dynCompInfoList.each(function(dynInfoName) {
				topRightPanel.insert({
					before: '<div id="topRightDynInfo_' + dynInfoName + '" dyninfoname="' + dynInfoName + '" class="SCM_ticket_screen_dynCompInfo">' + global.getLabel(dynInfoName) + '</div>'
				});
				this.dynCompInfoLinks.set(dynInfoName, container.down('[id="topRightDynInfo_'+dynInfoName+'"]'));
			}.bind(this));
			
//			container.insert('<div id="topRightPanelLink" class="SCM_ticket_screen_TopRightPanelLink application_action_link">'+global.getLabel('View company details') +'</div>');
//			container.down('[id="topRightPanelLink"]').observe('click', function(){document.fire('EWS:scm_viewCompanyDetailsLinkClicked');}.bindAsEventListener(this));
			this.dynCompInfoClicked(this.dynCompInfoList[0]);
		    
		}.bind(this), 1);
	},
	/**
	 * Function in charge of managing the click on one of the available forms recieved from the backend.<br>
	 * The function dynCompInfoClicked will be called each time the user clicks on one of the links displayed on the top of the info themselves.<br>
	 * It also fires an event that will be observed by the application using the screen object.
	 * @param {int} selectedInfoId The clicked information Id.
	 * @param {Event} event The event object (not used).
	 * @see scm_ticketScreen_standard_new#dynCompInfoClicked
	 * @since 1.0
	 */
	dynCompInfoClicked: function(selectedInfoId, event) {
		this.dynCompInfoList.each(function(dynInfoName) {
			var link = this.dynCompInfoLinks.get(dynInfoName);
			if(Object.isEmpty(link)) return;
			link.stopObserving('click');
			link.removeClassName('application_action_link');
			if (dynInfoName === selectedInfoId) {
				document.fire('EWS:scm_dynCompanyInfoClicked', dynInfoName);
			} else {
				link.addClassName('application_action_link');
				link.observe('click', this.dynCompInfoClicked.bind(this, dynInfoName));
			}
		}.bind(this));
	},
	/**
	 * Function called when the user clicks on the affected employee link.<br>
	 * It will hide the Requestor linked information and display the one linked to the affected employee.<br>
	 * It also fires an event that will be observed by the application using the screen object.
	 * @param {Event} event The event object (not used).
	 * @since 1.0
	 */
	_empDetailsAffectedEmployeeLinkClicked:function(event){
		this.affEmployeeLink.stopObserving('click');
		this.affEmployeeLink.removeClassName('application_action_link');
		
		this.empSearchSpotReq.addClassName('SCM_ticket_screen_hidden');
		this.empSearchSpotAff.removeClassName('SCM_ticket_screen_hidden');
		
		this.requestorLink.addClassName('application_action_link');
		this.requestorLink.observe('click', this._empDetailsRequestorLinkClicked.bindAsEventListener(this));
		
		document.fire('EWS:scm_affectedEmployeeLinkClicked');
	},
	/**
	 * Function called when the user clicks on the requestor link.<br>
	 * It will hide the affected employee linked information and display the one linked to the requestor.<br>
	 * It also fires an event that will be observed by the application using the screen object.
	 * @param {Event} event The event object (not used).
	 * @since 1.0
	 */
	_empDetailsRequestorLinkClicked:function(event){
		this.requestorLink.stopObserving('click');
		this.requestorLink.removeClassName('application_action_link');
		
		this.empSearchSpotReq.removeClassName('SCM_ticket_screen_hidden');
		this.empSearchSpotAff.addClassName('SCM_ticket_screen_hidden');
		
		this.affEmployeeLink.addClassName('application_action_link');
		this.affEmployeeLink.observe('click', this._empDetailsAffectedEmployeeLinkClicked.bindAsEventListener(this));
	
		document.fire('EWS:scm_requestorLinkClicked');
	},
	
/*
	_compDetailsLinkClicked:function(event){
		document.fire('EWS:viewCompanyDetailsLinkClicked');
	},
*/


	/**
	 * Function in charge of creating all the containers needed for the middle panel.<br>
	 * The display of the middle panel is different depending of the mode of the screen object.<br>
	 * This function calls the _middlePanelTopPartInit2, _middlePanelLeftPartInit and _middlePanelRightPartInit functions for both mode.
	 * If the screen is used for edit/view of the ticket, the _middlePanelLeftPart_ticketView_addActions function will also be called.
	 * @see scm_ticketScreen_standard_new#_middlePanelTopPartInit2
	 * @see scm_ticketScreen_standard_new#_middlePanelLeftPartInit
	 * @see scm_ticketScreen_standard_new#_middlePanelRightPartInit
	 * @see scm_ticketScreen_standard_new#_middlePanelLeftPart_ticketView_addActions
	 * @since 1.0
	 */
	_middlePanelInit:function(){
		var html = '';
		if (this._mode == 1){
			html = '<table class="SCM_ticket_screen_FullWidth"><tr><td>'+
						'<div id="ticketScreenMiddleTopPart"></div>'+
						'<div id="ticketScreenMiddleLeftPart" class="SCM_ticket_screen_Spacer SCM_ticketScreen_MiddlePart SCM_ticketScreen_MiddlePanelLeft_creation"></div>'+
						'<div id="ticketScreenMiddleRightPart" class="SCM_ticket_screen_Spacer SCM_ticketScreen_MiddlePart SCM_ticketScreen_MiddlePanelRight_creation"></div>'+
					'</td></tr></table>';
		}else if(this._mode == 2){
			html = '<table class="SCM_ticket_screen_FullWidth"><tr><td>'+
						'<div id="ticketScreenMiddleTopPart"></div>'+
						'<div id="ticketScreenMiddleLeftPart" class="SCM_ticket_screen_Spacer SCM_ticketScreen_MiddlePart SCM_ticketScreen_MiddlePanelLeft_display"></div>'+
						'<div id="ticketScreenMiddleRightPart" class="SCM_ticket_screen_Spacer SCM_ticketScreen_MiddlePart SCM_ticketScreen_MiddlePanelRight_display"></div>'+
					'</td></tr></table>';
		}
		this._middleWidget.get('content').update(html);
		this._middleWidget.get('title').update(global.getLabel('Ticket_details'));
		this._middlePanelTopPartInit2(this._middleWidget.get('content').down('[id="ticketScreenMiddleTopPart"]'));
		this._middlePanelLeftPartInit(this._middleWidget.get('content').down('[id="ticketScreenMiddleLeftPart"]'));
		//since 1.1 Small bug fix
		this._middlePanelRightPartInit(this._middleWidget.get('content').down('[id="ticketScreenMiddleRightPart"]'));
		if (this._mode == 2){
			this._middlePanelLeftPart_ticketView_addActions(this._middleWidget.get('content').down('[id="ticketScreenMiddleLeftPart"]'), this._middleWidget.get('content').down('[id="ticketScreenMiddleRightPart"]'));
		}
	},

	/**
	 * Function in charge of creating the HTML code representing the top part of the middle widget.
	 * @param {DOM Div} container The DIV representing the top part of the middle widget.
	 * @deprecated since 1.0, use <a href=scm_ticketScreen_standard_new.html#_middlePanelTopPartInit2>_middlePanelTopPartInit2</a> instead.
	 * @since 1.0
	 * <br/>Modified in 2.2
	 * <ul>
	 * <li>Replace the label "Subject" by "Short Description"</li>
	 * </ul>
	 */
	_middlePanelTopPartInit:function(container){
		var html = 	'<table class="SCM_ticket_screen_FullWidth"><tr><td>'+
					'<div class="SCM_ticketScreen_MiddlePanelTop_FieldDiv SCM_ticket_screen_FullWidth">'+
						'<div class="SCM_ticketScreen_MiddlePanelTop_fieldLabel" id="ticketScreen_ticketID_label">'+global.getLabel('TICKET_ID')+'</div>'+
						'<div class="SCM_ticketScreen_MiddlePanelTop_fieldValLeft" id="ticketScreen_ticketID_value"></div>'+
						'<div class="SCM_ticketScreen_MiddlePanelTop_fieldLabel" id="ticketScreen_ticketSG_label">'+global.getLabel('SERV_GROUP')+'</div>'+
						'<div class="SCM_ticketScreen_MiddlePanelTop_fieldValRight" id="ticketScreen_ticketSG_value"></div>'+
					'</div>'+
					'<div class="SCM_ticketScreen_MiddlePanelTop_FieldDiv SCM_ticket_screen_FullWidth">'+
						'<div class="SCM_ticketScreen_MiddlePanelTop_fieldLabel" id="ticketScreen_ticketCdate_label">'+global.getLabel('CREATE_DATE')+'</div>'+
						'<div class="SCM_ticketScreen_MiddlePanelTop_fieldValLeft" id="ticketScreen_ticketCdate_value"></div>'+
						'<div class="SCM_ticketScreen_MiddlePanelTop_fieldLabel" id="ticketScreen_ticketS_label">'+global.getLabel('SERV_NAME')+'</div>'+
						'<div class="SCM_ticketScreen_MiddlePanelTop_fieldValRight" id="ticketScreen_ticketS_value"></div>'+
					'</div>'+
					'<div class="SCM_ticketScreen_MiddlePanelTop_FieldDiv SCM_ticket_screen_FullWidth">'+
						//since 2.2 Use the text short description to stay coherent with HRW
						'<div class="SCM_ticketScreen_MiddlePanelTop_fieldLabel" id="ticketScreen_ticketSubject_label">'+global.getLabel('ShortDesc')+'</div>'+
						'<div class="SCM_ticketScreen_MiddlePanelTop_fieldValLeft" id="ticketScreen_ticketSubject_value"></div>'+
						'<div class="SCM_ticketScreen_MiddlePanelTop_fieldLabel" id="ticketScreen_ticketDdate_label">'
						+	global.getLabel('DUE_DATE')
						+	'<div class="application_currentSelection"></div>'
						+'</div>'+
						'<div class="SCM_ticketScreen_MiddlePanelTop_fieldValRight" id="ticketScreen_ticketDdate_value"></div>'+
					'</div>'+
					'<div class="SCM_ticketScreen_MiddlePanelTop_FieldDiv SCM_ticket_screen_FullWidth">'+
						'<div class="SCM_ticketScreen_MiddlePanelTop_fieldLabel" id="ticketScreen_ticketStatus_label">'+global.getLabel('STATUS_TXT')+'</div>'+
						'<div class="SCM_ticketScreen_MiddlePanelTop_fieldValLeft" id="ticketScreen_ticketStatus_value"></div>'+
						'<div class="SCM_ticketScreen_MiddlePanelTop_fieldLabel" id="ticketScreen_ticketRtime_label">'+global.getLabel('RemTime')+'</div>'+
						'<div class="SCM_ticketScreen_MiddlePanelTop_fieldValRight"  id="ticketScreen_ticketRtime_value"></div>'+
					'</div>'+
					'</td></tr></table>';
	
		container.update(html);
	},
	
	/**
	 * Function in charge of creating the HTML code representing the top part of the middle widget.
	 * The top of the middle widget looks like:<br>
	 * <code><pre>
	 * ----------------------------------------------------------
	 * | Service Group     				|   Creation date       |
	 * | Service           				|   Due Date            |
	 * | Subject           				|   Status              |
	 * | empty (for later) 				|   Remaining time      |
	 * | empty			   				|   Checkbox solved	    | (since 2.0)
	 * ----------------------------------------------------------
	 * </pre></code>
	 * @param {DOM Div} container The DIV representing the top part of the middle widget.
	 * @since 1.0
	 * <br/>Modified in version 2.0:<ul>
	 * <li>Add of the div to display the checkbox to mark the ticket as solved</li>
	 * </ul>
	 * <br/>Modified in version 2.1:<ul>
	 * <li>Addition of a field "Scheduled to" in the display of the ticket</li>
	 * </ul>
	 * <br/>Modified in 2.2
	 * <ul>
	 * <li>Replace the label "Subject" by "Short Description"</li>
	 * </ul>
	 */
	_middlePanelTopPartInit2:function(container){
		var html = 	'<table class="SCM_ticket_screen_FullWidth"><tr><td>'+
					'<div class="SCM_ticketScreen_MiddlePanelTop_FieldDiv SCM_ticket_screen_FullWidth" id="ticketScreen_topMiddle_line1">'+
						'<div class="SCM_ticketScreen_MiddlePanelTop_fieldLabel" id="ticketScreen_ticketSA_label">'+
							'<div class="SCM_ticketScreen_MiddlePanelTop_fieldLabel_content">'+global.getLabel('SERV_AREA')+'</div>'+
						'</div>'+
						'<div class="SCM_ticketScreen_MiddlePanelTop_fieldValLeft" id="ticketScreen_ticketSA_value"></div>'+
						'<div class="SCM_ticketScreen_MiddlePanelTop_fieldLabel" id="ticketScreen_ticketCdate_label">'+global.getLabel('CREATE_DATE')+'</div>'+
						'<div class="SCM_ticketScreen_MiddlePanelTop_fieldValRight" id="ticketScreen_ticketCdate_value"></div>'+
					'</div>'+
					'<div class="SCM_ticketScreen_MiddlePanelTop_FieldDiv SCM_ticket_screen_FullWidth" id="ticketScreen_topMiddle_line2">'+
						'<div class="SCM_ticketScreen_MiddlePanelTop_fieldLabel" id="ticketScreen_ticketSG_label">'+
							'<div class="SCM_ticketScreen_MiddlePanelTop_fieldLabel_content">'+global.getLabel('SERV_GROUP')+'</div>'+
						'</div>'+
						'<div class="SCM_ticketScreen_MiddlePanelTop_fieldValLeft" id="ticketScreen_ticketSG_value"></div>'+
						'<div class="SCM_ticketScreen_MiddlePanelTop_fieldLabel" id="ticketScreen_ticketDdate_label">'+global.getLabel('DUE_DATE')+'</div>'+
						'<div class="SCM_ticketScreen_MiddlePanelTop_fieldValRight" id="ticketScreen_ticketDdate_value"></div>'+
					'</div>'+
					'<div class="SCM_ticketScreen_MiddlePanelTop_FieldDiv SCM_ticket_screen_FullWidth" id="ticketScreen_topMiddle_line3">'+
						'<div class="SCM_ticketScreen_MiddlePanelTop_fieldLabel" id="ticketScreen_ticketS_label">'+
							'<div class="SCM_ticketScreen_MiddlePanelTop_fieldLabel_content">'+global.getLabel('SERV_NAME')+'</div>'+
						'</div>'+
						'<div class="SCM_ticketScreen_MiddlePanelTop_fieldValLeft" id="ticketScreen_ticketS_value"></div>'+
						'<div class="SCM_ticketScreen_MiddlePanelTop_fieldLabel" id="ticketScreen_ticketStatus_label">'+global.getLabel('STATUS_TXT')+'</div>'+
						'<div class="SCM_ticketScreen_MiddlePanelTop_fieldValRight" id="ticketScreen_ticketStatus_value"></div>'+
					'</div>'+
					'<div class="SCM_ticketScreen_MiddlePanelTop_FieldDiv SCM_ticket_screen_FullWidth" id="ticketScreen_topMiddle_line4">'+
						'<div class="SCM_ticketScreen_MiddlePanelTop_fieldLabel" id="ticketScreen_ticketSubject_label">'+
							//since 2.2 Use the text short description to stay coherent with HRW
							'<div class="SCM_ticketScreen_MiddlePanelTop_fieldLabel_content">'+global.getLabel('ShortDesc')+'</div>'+
						'</div>'+
						'<div class="SCM_ticketScreen_MiddlePanelTop_fieldValLeft" id="ticketScreen_ticketSubject_value"></div>'+
						'<div class="SCM_ticketScreen_MiddlePanelTop_fieldLabel" id="ticketScreen_ticketRtime_label">'+global.getLabel('RemTime')+'</div>'+
						'<div class="SCM_ticketScreen_MiddlePanelTop_fieldValRight"  id="ticketScreen_ticketRtime_value"></div>'+
					'</div>'+
					//since 2.1 Add the schedule date
					'<div class="SCM_ticketScreen_MiddlePanelTop_FieldDiv SCM_ticket_screen_FullWidth" id="ticketScreen_topMiddle_line5">'+
						'<div class="SCM_ticketScreen_MiddlePanelTop_fieldLabel" id="scm_ticketScreen_schedule_label">'+
							'<div class="SCM_ticketScreen_MiddlePanelTop_fieldLabel_content">'+global.getLabel('ScheduledToDate')+'</div>'+
						'</div>'+
						'<div class="SCM_ticketScreen_MiddlePanelTop_fieldValLeft" id="scm_ticketScreen_schedule_value"></div>'+
						'<div id="scm_ticket_creation_markSolved"><div style="float:left; width:40%; text-align:left;"><input type="checkbox" id="scm_ticket_creation_markSolved_check">'+ global.getLabel('solved')+'</input></div></div>'+
					'</div>'+
					'</td></tr></table>';
	
		container.update(html);
	},
	/**
	 * Function in charge of creating the left part of the middle widget.<br>
	 * This part is different depending of the mode of the ticket screen.<br>
	 * In <i>creation mode</i> it contains the editor to enter the description of the ticket.<br>
	 * In <i>edit/view mode</i> it contains the actions history panel.<br>
	 * In creation mode it calls the _middlePanel_creation_ButtonInit function in order to create the available buttons.
	 * @param {DOM Div} container The DIV representing the left part of the middle widget.
	 * @see scm_ticketScreen_standard_new#_middlePanel_creation_ButtonInit
	 * @since 1.0
	 */
	_middlePanelLeftPartInit:function(container){
		var html = '';
		if (this._mode == 1){
		// CREATION
			html = 	'<table class="SCM_ticket_screen_FullWidth"><tr><td>'+
						'<div>'+
							'<div id="ticketScreen_ticketDescr_label">'+global.getLabel('DESCR')+'</div>'+
							'<div class="SCM_ticketScreen_MiddlePanelLeft_description_creation" id="ticketScreen_ticketDescr_value"></div>'+
							'<div class="SCM_ticketScreen_MiddlePanel_footer" id="ticketCreation_buttonContainer"></div>'+
						'</div>'+
					'</td></tr></table>';
			container.update(html);	
			this._middlePanel_creation_ButtonInit(container.down('[id="ticketCreation_buttonContainer"]'));
		}else if(this._mode == 2){
		// VIEW/EDIT
			html = 	'<table class="SCM_ticket_screen_FullWidth SCM_ticketScreen_MiddlePanelLeft_table_display" id="SCM_ticket_screen_previous_actions_table"><tr><td class="SCM_ticketScreen_MiddlePanelLeft_valignTop">'+
						'<div id="SCM_ticket_screen_previous_actions_hidden" class="SCM_ticket_screen_hidden">'+
							'<div class="SCM_ticketScreen_MiddlePanelLeft_collapseBut_left" id="ticket_screen_expand_ticketActions" title="'+ global.getLabel('Show_ticket_actions')+'">&gt;&gt;</div>'+
						'</div>'+
						'<div id="SCM_ticket_screen_previous_actions">'+
							'<div class="SCM_ticketScreen_MiddlePanel_title SCM_ticketScreen_MiddlePanelLeft_previousActionsTitle">'+global.getLabel('Previous_actions')+'</div>'+
							'<div class="SCM_ticketScreen_MiddlePanelLeft_collapseBut_right" id="ticket_screen_collapse_ticketActions" title="'+ global.getLabel('Hide_ticket_actions')+'">&lt;&lt;</div>'+
							'<div class="SCM_ticketScreen_MiddlePanelLeft_action_display" id="SCM_ticket_screen_previousActionsPanel"></div>'+
							'<div class="SCM_ticketScreen_MiddlePanel_footer SCM_ticketScreen_MiddlePanelLeft_action_check"><input id="ticketActions_showTechnicalAction" type="checkbox" checked="X">'+ global.getLabel('Hide_tech_actions')+'</input></div>'+
						'</div>'+
					'</td></tr></table>';
			container.insert(html);
		}
		
	},
	/**
	 * Function in charge of creating the right part of the middle widget.<br>
	 * This part is different depending of the mode of the ticket screen.<br>
	 * In <i>creation mode</i> it contains the attributes of the ticket.<br>
	 * In <i>edit/view mode</i> it contains the different editor to magane the actions, sending email, change description or enter a solution.<br>
	 * In the edit mode, this function calls the _middlePanel_ticketView_ButtonInit function in order to build the buttons available.
	 * @param {DOM Div} container The DIV representing the left part of the middle widget.
	 * @see scm_ticketScreen_standard_new#_middlePanel_ticketView_ButtonInit
	 * @since 1.0
	 */
	_middlePanelRightPartInit:function(container){
		var html = '';
		if (this._mode == 1){
		// CREATION
			html = 	'<table class="SCM_ticket_screen_FullWidth"><tr><td>'+
						'<div>'+
							'<div>'+global.getLabel('Attributes')+'</div>'+
							'<div class="unmWidgets_titleDiv">'+
								'<table class="SCM_ticketScreen_MiddlePanelRight_ticketAtt_title_tab">'+
									'<tr>'+
										'<td class="SCM_ticketScreen_attributeTitleType">'+global.getLabel('Type')+'</td>'+
										'<td>'+global.getLabel('Value')+'</td>'+
									'</tr>'+
								'</table>'+
							'</div>'+
							'<div class="unmWidgets_contentDiv SCM_ticketScreen_MiddlePanelRight_ticketAttContainer" id="ticketScreen_ticketAttributesContent"></div>'+
							'<div class="SCM_ticketScreen_MiddlePanel_footer" id="scm_ticket_creation_companyGroupingSkill"><div class="SCM_ticketScreen_MiddlePanel_compGroupingLabel" id="scm_ticket_creation_compGroupingLabel">'+ global.getLabel('compGroupingSkill') +'</div><div id="scm_ticket_creation_compGroupingDropDown"></div></div>'+
//							'<div class="SCM_ticketScreen_MiddlePanel_footer" id="scm_ticket_creation_markSolved"><input type="checkbox" id="scm_ticket_creation_markSolved_check">'+ global.getLabel('solved')+'</input></div>'+
						//	'<div class="SCM_ticketScreen_MiddlePanel_footer" id="scm_ticket_creation_mail_opt"><input type="checkbox" id="ticketScreen_mailOption" class="SCM_ticketScreen_MiddlePanelRight_createTicket_checkbox"/>'+ global.getLabel('Send_email_after_ticket_creat')+ '</div>'+
						'</div>'+
					'</td></tr>'+
					'</table>';
			container.update(html);
		}else if (this._mode == 2){
		// VIEW/EDIT
			html = 	'<table class="SCM_ticket_screen_FullWidth_padding"><tr><td>'+
						'<div id="SCM_ticketScreen_MiddlePanel_actionDetails">'+
							'<div class="SCM_ticketScreen_MiddlePanel_title" id="SCM_ticketScreen_MiddlePanelRight_title">'+ global.getLabel('View_action')  +'</div>'+
							'<div class="SCM_ticketScreen_MiddlePanel_title application_action_link" id="SCM_ticketScreen_MiddlePanelRight_title2">'+ global.getLabel('New_action')  +'</div>'+
							'<div class="SCM_ticketScreen_MiddlePanel_title application_action_link" id="SCM_ticketScreen_MiddlePanelRight_title3">'+ global.getLabel('DESCR')  +'</div>'+
							'<div class="SCM_ticketScreen_MiddlePanel_title application_action_link" id="SCM_ticketScreen_MiddlePanelRight_title4">'+ global.getLabel('Solution')  +'</div>'+
							'<div id="SCM_ticketScreen_MiddlePanelRight_header" class="SCM_ticketScreen_MiddlePanelRight_header">'+
//								'<div id="SCM_ticketScreen_MiddlePanelRight_header_to_label" class="SCM_ticketScreen_MiddlePanelRight_header_tolabel_edit">'+ global.getLabel('Type') +'</div>'+
//								'<div id="SCM_ticketScreen_MiddlePanelRight_header_to_selection" class="SCM_ticketScreen_MiddlePanelRight_header_selection"></div>'+
//								'<div id="SCM_ticketScreen_MiddlePanelRight_header_type_label" class="SCM_ticketScreen_MiddlePanelRight_header_typelabel_edit">'+ global.getLabel('Action_Type') +'</div>'+
//								'<div id="SCM_ticketScreen_MiddlePanelRight_header_type_selection" class="SCM_ticketScreen_MiddlePanelRight_header_selection"></div>'+
//								'<div id="SCM_ticketScreen_MiddlePanelRight_header_icon1" class="inbox_ticketAction_attachedFile SCM_ticketScreen_MiddlePanelRight_header_icon"></div>'+
//								'<div id="SCM_ticketScreen_MiddlePanelRight_header_icon2" class="inbox_ticketAction_attachedFile SCM_ticketScreen_MiddlePanelRight_header_icon"></div>'+
								'<div id="SCM_ticketScreen_MiddlePanelRight_header_infos" class="SCM_ticketScreen_MiddlePanelRight_header_infos"></div>'+
								'<div id="SCM_ticketScreen_MiddlePanelRight_header_email_to" class="SCM_ticketScreen_MiddlePanelRight_header_email_to"></div>'+ /*class="SCM_ticket_screen_hidden"*/
							'</div>'+
							'<div id="SCM_ticketScreen_MiddlePanelRight_header_edit" class="SCM_ticketScreen_MiddlePanelRight_header SCM_ticket_screen_hidden">'+
								'<div id="SCM_ticketScreen_MiddlePanelRight_header_edit_to_label" class="SCM_ticketScreen_MiddlePanelRight_header_tolabel_edit">'+ global.getLabel('Type') +'</div>'+
								'<div id="SCM_ticketScreen_MiddlePanelRight_header_edit_to_selection" class="SCM_ticketScreen_MiddlePanelRight_header_selection"></div>'+
								'<div id="SCM_ticketScreen_MiddlePanelRight_header_edit_type_label" class="SCM_ticketScreen_MiddlePanelRight_header_typelabel_edit">'+ global.getLabel('Action_Type') +'</div>'+
								'<div id="SCM_ticketScreen_MiddlePanelRight_header_edit_type_selection" class="SCM_ticketScreen_MiddlePanelRight_header_selection"></div>'+
								'<div id="SCM_ticketScreen_MiddlePanelRight_header_edit_infos" class="SCM_ticketScreen_MiddlePanelRight_header_infos"></div>'+
//								'<div id="SCM_ticketScreen_MiddlePanelRight_header_edit_icon1" class="inbox_ticketAction_attachedFile SCM_ticketScreen_MiddlePanelRight_header_icon"></div>'+
//								'<div id="SCM_ticketScreen_MiddlePanelRight_header_edit_icon2" class="inbox_ticketAction_attachedFile SCM_ticketScreen_MiddlePanelRight_header_icon"></div>'+
								'<div id="SCM_ticketScreen_MiddlePanelRight_header_edit_email_from" class="SCM_ticketScreen_MiddlePanelRight_header_line_email SCM_ticket_screen_hidden"></div>'+ /*class="SCM_ticket_screen_hidden"*/
								'<div id="SCM_ticketScreen_MiddlePanelRight_header_edit_email_to" class="SCM_ticketScreen_MiddlePanelRight_header_line_email"></div>'+ /*class="SCM_ticket_screen_hidden"*/
								'<div id="SCM_ticketScreen_MiddlePanelRight_header_edit_email_cc" class="SCM_ticketScreen_MiddlePanelRight_header_line_email SCM_ticket_screen_hidden"></div>'+ /*class="SCM_ticket_screen_hidden"*/
								'<div id="SCM_ticketScreen_MiddlePanelRight_header_edit_email_subject" class="SCM_ticketScreen_MiddlePanelRight_header_line_email SCM_ticket_screen_hidden"></div>'+ /*class="SCM_ticket_screen_hidden"*/
								'<div id="SCM_ticketScreen_MiddlePanelRight_header_edit_email_attachment" class="SCM_ticketScreen_MiddlePanelRight_header_line_email SCM_ticket_screen_hidden"></div>'+ /*class="SCM_ticket_screen_hidden"*/
							'</div>'+
							'<div id="SCM_ticketScreen_MiddlePanelRight_header_description" class="SCM_ticketScreen_MiddlePanelRight_header SCM_ticket_screen_hidden">'+
								'<div id="SCM_ticketScreen_MiddlePanelRight_header_edit_infos" class="SCM_ticketScreen_MiddlePanelRight_header_infos"></div>'+
								'<div id="SCM_ticketScreen_MiddlePanelRight_header_edit_email_to" class="SCM_ticketScreen_MiddlePanelRight_header_email_to"></div>'+ /*class="SCM_ticket_screen_hidden"*/
							'</div>'+
							'<div id="SCM_ticketScreen_MiddlePanelRight_header_solution" class="SCM_ticketScreen_MiddlePanelRight_header SCM_ticket_screen_hidden">'+
								'<div id="SCM_ticketScreen_MiddlePanelRight_header_edit_infos" class="SCM_ticketScreen_MiddlePanelRight_header_infos"></div>'+
								'<div id="SCM_ticketScreen_MiddlePanelRight_header_edit_email_to" class="SCM_ticketScreen_MiddlePanelRight_header_email_to"></div>'+ /*class="SCM_ticket_screen_hidden"*/
							'</div>'+
							'<div id="SCM_ticketScreen_MiddlePanelRight_textEditor" class="SCM_ticketScreen_MiddlePanelRight_textEditor"></div>'+
							'<div id="SCM_ticketScreen_MiddlePanelRight_textEditor2" class="SCM_ticketScreen_MiddlePanelRight_textEditor SCM_ticket_screen_hidden"></div>'+
							'<div id="SCM_ticketScreen_MiddlePanelRight_textEditor3" class="SCM_ticketScreen_MiddlePanelRight_textEditor SCM_ticket_screen_hidden"></div>'+
							'<div id="SCM_ticketScreen_MiddlePanelRight_textEditor4" class="SCM_ticketScreen_MiddlePanelRight_textEditor SCM_ticket_screen_hidden"></div>'+
							'<div id="SCM_ticketScreen_MiddlePanelRight_buttons" class="SCM_ticketScreen_MiddlePanelRight_buttons">'+
								'<div id="SCM_ticketScreen_MiddlePanelRight_buttonLeft" class="SCM_ticketScreen_MiddlePanelRight_buttonLeft"></div>'+
								'<div id="SCM_ticketScreen_MiddlePanelRight_button2" class="SCM_ticketScreen_MiddlePanelRight_buttonRight"></div>'+
								'<div id="SCM_ticketScreen_MiddlePanelRight_button1" class="SCM_ticketScreen_MiddlePanelRight_buttonRight"></div>'+
							'</div>'+
							'<div id="SCM_ticketScreen_MiddlePanelRight_attributes" class="SCM_ticketScreen_MiddlePanelRight_attributes">'+
								'<div id="SCM_ticketScreen_MiddlePanelRight_attributes_title" class="SCM_ticketScreen_MiddlePanel_title">Attributes</div>'+
								'<div id="SCM_ticketScreen_MiddlePanelRight_attributes_panel" class="SCM_ticketScreen_MiddlePanelRight_attributes_panel"></div>'+								
							'</div>'+
							'<div class="SCM_ticketScreen_MiddlePanel_footer_display" id="scm_ticket_creation_companyGroupingSkill"><div class="SCM_ticketScreen_MiddlePanel_compGroupingLabel" id="scm_ticket_creation_compGroupingLabel">'+ global.getLabel('compGroupingSkill') +'</div><div id="scm_ticket_creation_compGroupingDropDown"></div></div>'+
//							'<div class="SCM_ticketScreen_MiddlePanel_footer" id="scm_ticket_creation_markSolved"><input type="checkbox" id="scm_ticket_creation_markSolved_check">'+ global.getLabel('solved')+'</input></div>'+
						'</div>'+
					'</tr></td></table>';
			container.update(html);
			
			this.viewActionLink 	= container.down('[id="SCM_ticketScreen_MiddlePanelRight_title"]');
			this.newActionLink  	= container.down('[id="SCM_ticketScreen_MiddlePanelRight_title2"]');
			this.descriptionLink 	= container.down('[id="SCM_ticketScreen_MiddlePanelRight_title3"]');
			this.solutionLink		= container.down('[id="SCM_ticketScreen_MiddlePanelRight_title4"]');
			
			this.newActionLink.observe('click', this.newActionLinkClicked.bindAsEventListener(this));
			this.descriptionLink.observe('click', this.descriptionLinkClicked.bindAsEventListener(this));
			this.solutionLink.observe('click', this.solutionLinkClicked.bindAsEventListener(this));
						
			this._middlePanel_ticketView_ButtonInit(container.down('[id="SCM_ticketScreen_MiddlePanelRight_button2"]'), container.down('[id="SCM_ticketScreen_MiddlePanelRight_button1"]'));
		}
	},
	/**
	 * Function in charge of managing the click on the "new action" link.<br>
	 * That means:<ul>
	 * <li>stop the observers on this link,</li>
	 * <li>display the correct editor,</li>
	 * <li>set the observers on the other links,</li>
	 * <li>hide the other editors,</li>
	 * <li>fire the appropriate event.</li>
	 * </ul>
	 * @param {Event} fireEvent The event object.
	 * @since 1.0
	 */
	newActionLinkClicked:function(fireEvent){
		this.hideSignatureLink();
		// Editor
		this.newActionLink.stopObserving('click');
		this.newActionLink.removeClassName('application_action_link');
		this.ticketDescrEditSpot.value.removeClassName('SCM_ticket_screen_hidden');
		this.ticketActionHeaderEdit.value.removeClassName('SCM_ticket_screen_hidden');
		// Displayer
		this.ticketActionHeaderView.value.addClassName('SCM_ticket_screen_hidden');
		this.ticketDescrSpot.value.addClassName('SCM_ticket_screen_hidden');
		this.viewActionLink.addClassName('application_action_link');
		this.viewActionLink.observe('click', this.viewActionLinkClicked.bindAsEventListener(this));
		// Description
		this.ticketActionHeaderDesc.value.addClassName('SCM_ticket_screen_hidden');
		this.ticketDescrDescrSpot.value.addClassName('SCM_ticket_screen_hidden');
		this.descriptionLink.addClassName('application_action_link');
		this.descriptionLink.observe('click', this.descriptionLinkClicked.bindAsEventListener(this));
		// Solution
		this.ticketActionHeaderSol.value.addClassName('SCM_ticket_screen_hidden');
		this.ticketDescrSolSpot.value.addClassName('SCM_ticket_screen_hidden');
		this.solutionLink.addClassName('application_action_link');
		this.solutionLink.observe('click', this.solutionLinkClicked.bindAsEventListener(this));
		document.fire('EWS:scm_newAction_displayed', {fireEvent:fireEvent});
	},
	/**
	 * Function in charge of managing the click on the "view action" link.<br>
	 * That means:<ul>
	 * <li>stop the observers on this link,</li>
	 * <li>display the correct editor,</li>
	 * <li>set the observers on the other links,</li>
	 * <li>hide the other editors,</li>
	 * <li>fire the appropriate event.</li>
	 * </ul>
	 * @param {Event} fireEvent The event object.
	 * @since 1.0
	 */
	viewActionLinkClicked:function(){
		this.hideSignatureLink();
		// Displayer
		this.viewActionLink.stopObserving('click');
		this.viewActionLink.removeClassName('application_action_link');
		this.ticketDescrSpot.value.removeClassName('SCM_ticket_screen_hidden');
		this.ticketActionHeaderView.value.removeClassName('SCM_ticket_screen_hidden');
		// Editor
		this.ticketActionHeaderEdit.value.addClassName('SCM_ticket_screen_hidden');
		this.ticketDescrEditSpot.value.addClassName('SCM_ticket_screen_hidden');
		this.newActionLink.addClassName('application_action_link');
		this.newActionLink.observe('click', this.newActionLinkClicked.bindAsEventListener(this));
		// Description
		this.ticketActionHeaderDesc.value.addClassName('SCM_ticket_screen_hidden');
		this.ticketDescrDescrSpot.value.addClassName('SCM_ticket_screen_hidden');				
		this.descriptionLink.addClassName('application_action_link');
		this.descriptionLink.observe('click', this.descriptionLinkClicked.bindAsEventListener(this));
		// Solution
		this.ticketActionHeaderSol.value.addClassName('SCM_ticket_screen_hidden');
		this.ticketDescrSolSpot.value.addClassName('SCM_ticket_screen_hidden');
		this.solutionLink.addClassName('application_action_link');
		this.solutionLink.observe('click', this.solutionLinkClicked.bindAsEventListener(this));
		document.fire('EWS:scm_viewAction_displayed');
	},
	/**
	 * Function in charge of managing the click on the "Description" link.<br>
	 * That means:<ul>
	 * <li>stop the observers on this link,</li>
	 * <li>display the correct editor,</li>
	 * <li>set the observers on the other links,</li>
	 * <li>hide the other editors,</li>
	 * <li>fire the appropriate event.</li>
	 * </ul>
	 * @param {Event} fireEvent The event object.
	 * @since 1.0
	 */
	descriptionLinkClicked:function(){
		this.hideSignatureLink();
		// Description
		this.descriptionLink.stopObserving('click');
		this.descriptionLink.removeClassName('application_action_link');
		this.ticketDescrDescrSpot.value.removeClassName('SCM_ticket_screen_hidden');
		this.ticketActionHeaderDesc.value.removeClassName('SCM_ticket_screen_hidden');
		// Editor
		this.ticketActionHeaderEdit.value.addClassName('SCM_ticket_screen_hidden');
		this.ticketDescrEditSpot.value.addClassName('SCM_ticket_screen_hidden');
		this.newActionLink.addClassName('application_action_link');
		this.newActionLink.observe('click', this.newActionLinkClicked.bindAsEventListener(this));
		// Displayer
		this.ticketActionHeaderView.value.addClassName('SCM_ticket_screen_hidden');
		this.ticketDescrSpot.value.addClassName('SCM_ticket_screen_hidden');
		this.viewActionLink.addClassName('application_action_link');
		this.viewActionLink.observe('click', this.viewActionLinkClicked.bindAsEventListener(this));
		// Solution
		this.ticketActionHeaderSol.value.addClassName('SCM_ticket_screen_hidden');
		this.ticketDescrSolSpot.value.addClassName('SCM_ticket_screen_hidden');
		this.solutionLink.addClassName('application_action_link');
		this.solutionLink.observe('click', this.solutionLinkClicked.bindAsEventListener(this));
		document.fire('EWS:scm_description_displayed');
	},
	/**
	 * Function in charge of managing the click on the "Solution" link.<br>
	 * That means:<ul>
	 * <li>stop the observers on this link,</li>
	 * <li>display the correct editor,</li>
	 * <li>set the observers on the other links,</li>
	 * <li>hide the other editors,</li>
	 * <li>fire the appropriate event.</li>
	 * </ul>
	 * @param {Event} fireEvent The event object.
	 * @since 1.0
	 */
	solutionLinkClicked:function(){
		this.hideSignatureLink();
		// Solution
		this.solutionLink.stopObserving('click');
		this.solutionLink.removeClassName('application_action_link');
		this.ticketDescrSolSpot.value.removeClassName('SCM_ticket_screen_hidden');
		this.ticketActionHeaderSol.value.removeClassName('SCM_ticket_screen_hidden');
		// Editor
		this.ticketActionHeaderEdit.value.addClassName('SCM_ticket_screen_hidden');
		this.ticketDescrEditSpot.value.addClassName('SCM_ticket_screen_hidden');
		this.newActionLink.addClassName('application_action_link');
		this.newActionLink.observe('click', this.newActionLinkClicked.bindAsEventListener(this));
		// Displayer
		this.ticketActionHeaderView.value.addClassName('SCM_ticket_screen_hidden');
		this.ticketDescrSpot.value.addClassName('SCM_ticket_screen_hidden');
		this.viewActionLink.addClassName('application_action_link');
		this.viewActionLink.observe('click', this.viewActionLinkClicked.bindAsEventListener(this));
		// Description
		this.ticketActionHeaderDesc.value.addClassName('SCM_ticket_screen_hidden');
		this.ticketDescrDescrSpot.value.addClassName('SCM_ticket_screen_hidden');				
		this.descriptionLink.addClassName('application_action_link');
		this.descriptionLink.observe('click', this.descriptionLinkClicked.bindAsEventListener(this));
		document.fire('EWS:scm_solution_displayed');
	},

	/**
	 * Function in charge of creating the buttons available for ticket creation.<br>
	 * These buttons are "Cancel" and "Save".
	 * @param {DOM Div} buttonContainer The container for the buttons.
	 * @since 1.0
	 */
	_middlePanel_creation_ButtonInit:function(buttonContainer){
		var json = {
			elements: []
		};
		
		aux = {
			handlerContext: null,
			type: 'button',
			className:'SCM_ticketScreen_MiddlePanel_creation_button',
			idButton: 'ticketScreen_CancelButton',
			standardButton: true,
			handler: this.ticketActionPressed.bind(this, 'ticketScreen_CancelButton'),//'cancelCreation'),
			label: global.getLabel('Cancel')
		};	
		json.elements.push(aux);
		
		var aux = {
			handlerContext: null,
			type: 'button',
			className: 'SCM_ticketScreen_MiddlePanel_creation_button',
			idButton: 'ticketScreen_SaveAndSendButton',
			standardButton: true,
			handler: this.ticketActionPressed.bind(this, 'ticketScreen_SaveAndSendButton'),//'saveTicket'),
			label: global.getLabel('Save_and_send')
		};
		json.elements.push(aux);
		
		this._creationButtons = new megaButtonDisplayer(json);
		buttonContainer.update(this._creationButtons.getButtons());
		
		buttonContainer.insert('<div id="scm_ticket_creation_mail_opt"><input type="checkbox" id="ticketScreen_mailOption" class="SCM_ticketScreen_MiddlePanelRight_createTicket_checkbox"/>'+ global.getLabel('Send_email_after_ticket_creat')+ '</div>')
	},
	
/*
	_middlePanel_ticketCreation_addActions:function(){
		
	},
*/
	/**
	 * Function in charge of disabling the save button if the employee is changed in the employee search.
	 * @since 1.0
	 */
	disableCreateButton:function(){
		this._creationButtons.disable('ticketScreen_SaveAndSendButton');
	},
	/**
	 * Function in charge of enabling the save button when an employee is selected in the employee search.
	 * @since 1.0
	 */
	enableCreateButton:function(){
		this._creationButtons.enable('ticketScreen_SaveAndSendButton');
	},
	/**
	 * Function in charge of creating the display for ONE attribute of the ticklet in creation mode.
	 * @param {String} attMandatory String containing "true" or "flase" and representing if the attribute is mandatory for the ticket creation.
	 * @param {String} attText The text of the attribute (name).
	 * @param {int} attId The id of the attribute.
	 * @param {boolean} readOnly Flag to know if the attribute is read only. (since 2.0)
	 * @param {char} attType One character to know if the attribute is a company attribute ('C') or linked to the selected service ('S').
	 * @returns {DOM TR} A DOM Table line (tr) containing the info about the attribute.
	 * @since 1.0<br>Modified in version 2.0:<ul><li>Add od the test if the attribute is read only in order to display the correct icon.</li></ul>
	 */
	_initAttributeLineForCreate:function(attMandatory, attText, attId, attType, readOnly){
		var lineTemplate = new Template('<tr id="attribute_#{attType}_#{attId}">'+
											'<td class="#{classname} SCM_ticketScreen_skillMandatorySize"></td>'+
											'<td id="SCM_ticketScreen_attributeDescription_#{attType}_#{attId}" class="SCM_ticketScreen_attributeDescription" title="#{attCompleteText}">#{attText}</td>'+
											'<td><div id="ticketAtt_#{attType}_#{attId}"></div></td>'+
										'</tr>');
		// version 2.0
		var classname;
		if (readOnly == true){
			classname = '';
		}else{
			classname = (attMandatory=='true')?'SCM_ticketScreen_skillMandatoryOnCreate':'SCM_ticketScreen_skillMandatoryOnClose';
		}
		var attributeText = attText;
		
		if (attributeText.length > 17){
			attributeText = attributeText.substr(0, 14) + '...';
		}
		
		return lineTemplate.evaluate({
			classname		:	classname,
			attText	 		:	attributeText,
			attCompleteText	:	attText,
			attId	 		:  	attId,
			attType		    :   attType
		});
	},

	/**
	 * Function in charge of creating the display of the company linked attributes.<br>
	 * This function calls the _initAttributeLineForCreate function in order to build the complete display.
	 * @see scm_ticketScreen_standard_new#_initAttributeLineForCreate
	 * @param {Array} ticketAttributes The ticket attributes retrieved from the HRW backend.
	 * @since 1.0<br>Modified in version 2.0:<ul><li>Determine if the attribute is read only in order to display the correct icon.</li></ul>
	 */
	initMiddlePanelRightAttributesForCreate:function(ticketAttributes){
		var attributesHtml = 	'<div><table class="SCM_ticket_screen_FullWidth" id="ticketAttributeTable">';
		ticketAttributes.each(function(ticketAttribute){
			var readOnly = false;
			// version 2.0
			var values = objectToArray(ticketAttribute.value.skillPossValues.KeyValue);
			if(values.size()==1 && values[0].Key==ticketAttribute.value.skillId){
				readOnly = true;
			}
			attributesHtml += this._initAttributeLineForCreate(ticketAttribute.value.mandatoryOpen, ticketAttribute.value.name, ticketAttribute.value.skillTypeId, 'C', readOnly);
		}.bind(this));
		
		attributesHtml +=   	'</table></div>';
		this.ticketAttrSpot.value.insert(attributesHtml);
	},
	/**
	 * Function in charge of cleaning the attribute panel of the screen.
	 * @since 1.0
	 */
	cleanMiddlePanelRightAttributesForCreate:function(){
		this.ticketAttrSpot.value.update();
	},
	/**
	 * Function in charge of adding the service dependant attributes in the attribute panel of the screen.<br>
	 * It calls the _initAttributeLineForCreate to create the line for each attribute.
	 * @see scm_ticketScreen_standard_new#_initAttributeLineForCreate
	 * @param {Array} ticketAttributes The ticket attributes retrieved from the HRW backend.
	 * @since 1.0
	 */
	addMiddlePanelRightAttributesForCreate:function(ticketAttributes){
		var attributesHtml = '';
		ticketAttributes.each(function(ticketAttribute){
			attributesHtml += this._initAttributeLineForCreate(ticketAttribute.value.mandatoryOpen, ticketAttribute.value.name, ticketAttribute.value.skillTypeId, 'S');
		}.bind(this));
		this.ticketAttrSpot.value.down('[id="ticketAttributeTable"]').down().insert(attributesHtml);
	},
	/**
	 * Function in charge of removing all service dependant attributes from the attribute panel.
	 * @param {Array} attIds Array of the company dependant attributes Id's.
	 * @since 1.0
	 * <br/>Modified for 1.2
	 * <ul>
	 * <li>Bug fix: Problem when there is a missing service</li>
	 * </ul>
	 */
	removeAttributesMiddleRightPanelForCreate:function(attIds){
		var toRemove;
		attIds.each(function(attId){
			toRemove = this.ticketAttrSpot.value.down('div#attribute_S_'+attId);
			if(toRemove) toRemove.remove();
		}.bind(this));
	},	
	/**
	 * Function in charge of retrieving the attribute label (name) given the input parameters.
	 * @param {int} attId The attribute Id.
	 * @param {char} attType The attribute type ('S' or 'C').
	 * @returns {DOM Div} The reference to the attribute label div.
	 * @since 1.0
	 */
	getAttributeLabelElement:function(attId, attType){
		var lookupId = '[id="SCM_ticketScreen_attributeDescription_'+attType+'_'+attId+'"]';
		return this.ticketAttrSpot.value.down(lookupId);
	},

	/**
	 * Function in charge of creating the buttons that will be displayed under the editor while editing of viewing a ticket.
	 * @param {DOM Div} containerLeft The div on the left under the editor.
	 * @param {DOM Div} containerRight The div on the right under the editor.
	 * @since 1.0
	 */
	_middlePanel_ticketView_ButtonInit:function(containerLeft, containerRight){
		var json = {
			elements: []
		};
		
		var aux = {
			handlerContext: null,
			type: 'button',
			idButton: 'ticketScreen_SaveAndAddButton',
			standardButton: true,
			className: 'SCM_ticketScreen_MiddlePanelRight_saveAndAddButton',
			handler: this.ticketActionPressed.bind(this, 'ticketScreen_SaveAndAddButton'),//'editSaveTicket'),
			label: global.getLabel('Save_and_add')
		};
		json.elements.push(aux);
		
		aux = {
			handlerContext: null,
			type: 'button',
			idButton: 'ticketScreen_reply',
			standardButton: true,
			className: 'SCM_ticketScreen_MiddlePanelRight_saveAndAddButton',
			handler: this.ticketActionPressed.bind(this, 'ticketScreen_reply'),//'editSaveTicket'),
			label: global.getLabel('reply')
		};
		json.elements.push(aux);
		
		aux = {
			handlerContext: null,
			type: 'button',
			idButton: 'ticketScreen_replyAll',
			standardButton: true,
			className: 'SCM_ticketScreen_MiddlePanelRight_saveAndAddButton',
			handler: this.ticketActionPressed.bind(this, 'ticketScreen_replyAll'),//'editSaveTicket'),
			label: global.getLabel('replyAll')
		};
		json.elements.push(aux);
		
		aux = {
			handlerContext: null,
			type: 'button',
			idButton: 'ticketScreen_forward',
			standardButton: true,
			className: 'SCM_ticketScreen_MiddlePanelRight_saveAndAddButton',
			handler: this.ticketActionPressed.bind(this, 'ticketScreen_forward'),//'editSaveTicket'),
			label: global.getLabel('forward')
		};
		json.elements.push(aux);
		
		aux = {
			handlerContext: null,
			type: 'button',
			idButton: 'ticketScreen_resend',
			standardButton: true,
			className: 'SCM_ticketScreen_MiddlePanelRight_saveAndAddButton',
			handler: this.ticketActionPressed.bind(this, 'ticketScreen_resend'),//'editSaveTicket'),
			label: global.getLabel('resend')
		};
		json.elements.push(aux);
		/*
		aux = {
			handlerContext: null,
			type: 'button',
			idButton: 'ticketScreen_CancelButton',
			standardButton: true,
			handler: this.ticketActionPressed.bind(this, 'editCancelChange'),
			label: global.getLabel('Cancel')
		};	
		json.elements.push(aux);
*/
		
		this._viewEditButtons = new megaButtonDisplayer(json);
//		containerLeft.update(this._viewEditButtons.getButton('ticketScreen_CancelButton'));
		containerRight.update(this._viewEditButtons.getButton('ticketScreen_SaveAndAddButton'));
	},
	/**
	 * Function in charge of adding the action on the blue square allowing to open and close the view of the action history.
	 * @param {DOM Div} container The left part of the middle widget.
	 * @param {DOM Div} rightContainer The right part of the middle widget.
	 * @since 1.0
	 */
	_middlePanelLeftPart_ticketView_addActions: function(container, rightContainer){
		container.down('[id="ticket_screen_collapse_ticketActions"]').observe('click', function(){
			container.down('[id="SCM_ticket_screen_previous_actions"]').addClassName('SCM_ticket_screen_hidden');
			container.down('[id="SCM_ticket_screen_previous_actions_table"]').removeClassName('SCM_ticket_screen_FullWidth');
			container.down('[id="SCM_ticket_screen_previous_actions_table"]').removeClassName('SCM_ticketScreen_MiddlePanelLeft_table_display');
			container.down('[id="SCM_ticket_screen_previous_actions_table"]').addClassName('SCM_ticketScreen_MiddlePanelLeft_table_display_hidden');
			container.removeClassName('SCM_ticketScreen_MiddlePanelLeft_display');
			container.addClassName('SCM_ticketScreen_MiddlePanelLeft_display_flat');
			container.down('[id="SCM_ticket_screen_previous_actions_hidden"]').removeClassName('SCM_ticket_screen_hidden');
			rightContainer.removeClassName('SCM_ticketScreen_MiddlePanelRight_display');
			rightContainer.addClassName('SCM_ticketScreen_MiddlePanelRight_display_full');
		});
		
		container.down('[id="ticket_screen_expand_ticketActions"]').observe('click', function(){
			container.down('[id="SCM_ticket_screen_previous_actions"]').removeClassName('SCM_ticket_screen_hidden');
			container.down('[id="SCM_ticket_screen_previous_actions_table"]').addClassName('SCM_ticket_screen_FullWidth');
			container.down('[id="SCM_ticket_screen_previous_actions_table"]').addClassName('SCM_ticketScreen_MiddlePanelLeft_table_display');
			container.down('[id="SCM_ticket_screen_previous_actions_table"]').removeClassName('SCM_ticketScreen_MiddlePanelLeft_table_display_hidden');
			container.addClassName('SCM_ticketScreen_MiddlePanelLeft_display');
			container.removeClassName('SCM_ticketScreen_MiddlePanelLeft_display_flat');
			container.down('[id="SCM_ticket_screen_previous_actions_hidden"]').addClassName('SCM_ticket_screen_hidden');
			rightContainer.addClassName('SCM_ticketScreen_MiddlePanelRight_display');
			rightContainer.removeClassName('SCM_ticketScreen_MiddlePanelRight_display_full');
		});
	},
	/**
	 * Function in charge of creating the attributes didplay for a view ticket. <br>
	 * The change compared to a ticket create or edit is that no drop down will be displayed for this mode. Only the attribute name and the selected value.
	 * @param {Array} ticketAttributes The attributes of the ticket.
	 * @since 1.0<br>Modified in version 2.0:<ul><li>Determine if the attribute is read only in order to display the correct icon.</li></ul>
	 */
	initMiddlePanelRightAttributesForDisplay:function(ticketAttributes){
		this.attributesHtml = 	'<div><table class="SCM_ticket_screen_FullWidth"><tr><td colspan="2">Type</td><td>Value</tr>';
		ticketAttributes.each(function(ticketAttribute){
			var readOnly = false;
			// version 2.0
//			var values = objectToArray(ticketAttribute.value.skillPossValues.KeyValue);
//			if(values.size()==1 && values[0].Key==ticketAttribute.skillId){
//				readOnly = true;
//			}
			this.attributesHtml += this._initAttributeLineForDisplay(ticketAttribute.PoolMandatory, ticketAttribute.SkillTypeName, ticketAttribute.SkillName, ticketAttribute.skillId, readOnly);
		}.bind(this));
		
		this.attributesHtml +=   	'</table></div>';
		this.ticketAttrSpot.value.update();
		this.ticketAttrSpot.value.insert(this.attributesHtml);
	},
	/**
	 * Function in charge of creating one line of the ticket attribute display for a view ticket.
	 * @param {String} attMandatory String containing true or false and meaning the attribute is mandatory.
	 * @param {String} attText The text associated to the attribute
	 * @param {String} attValue The chosen value for the attribute
	 * @param {boolean} readOnly Flag to know if the attribute is read only. (since 2.0)
	 * @param {int} attId The attribute id used to generate the unic DOM Div id.
	 * @since 1.0<br>Modified in version 2.0:<ul><li>Add od the test if the attribute is read only in order to display the correct icon.</li></ul>
	 */
	_initAttributeLineForDisplay:function(attMandatory, attText, attValue, attId, readOnly){
		var lineTemplate = new Template('<tr>'+
											'<td class="#{classname} SCM_ticketScreen_skillMandatorySize"></td>'+
											'<td id="SCM_ticketScreen_attributeDescription_#{attId}" class="SCM_ticketScreen_attributeDescription" title="#{attCompleteText}">#{attText}</td>'+
											'<td><span id="ticketAtt_#{attId}">#{attValue}</span></td>'+
										'</tr>');
		// version 2.0
		var classname;
		if (readOnly == true){
			classname = '';
		}else{
			classname = (attMandatory=='true')?'SCM_ticketScreen_skillMandatoryOnCreate':'SCM_ticketScreen_skillMandatoryOnClose';
		}
		//var classname = (attMandatory=='true')?'SCM_ticketScreen_skillMandatoryOnCreate':'SCM_ticketScreen_skillMandatoryOnClose';
		
		var attributeText = attText;
		
		if (attributeText.length > 17){
			attributeText = attributeText.substr(0, 14) + '...';
		}
		
		return lineTemplate.evaluate({
			classname		:	classname,
			attText	 		:	attributeText,
			attCompleteText	:	attText,
			attValue 		: 	attValue,
			attId	 		:  	attId
		});
	},
	/**
	 * Function in charge of registering the event on the "Hide technical action" checkbox from the action history.<br>
	 * The click on the checkbox will trigger an event that will be caught by the class using the screen object.
	 * @since 1.0
	 */
	addEventOnActionCheckbox:function(){
		var elem = this._middleWidget.get('content').down('[id="ticketScreenMiddleLeftPart"]').down('[id="ticketActions_showTechnicalAction"]');
		elem.observe('click', function(){
			elem.checked == ''?document.fire('EWS:scm_ticketActionCheckBoxChange',{value:false}):document.fire('EWS:scm_ticketActionCheckBoxChange',{value:true});
		});
	},
	/**
	 * Function in charge of creating an unvovable widget (unmWidget object) based on the Hash given in parameter.
	 * @param {Hash} components Hash containing:<ul>
	 * 								<li>widgetCollapse: flag meaning if the widget should be collapsed,</li>
	 * 								<li>divId: The target dom element in which the widget should be inserted</li></ul>
	 * @returns {Hash} Hash containing:<ul>
	 * 								<li>content: a reference to the DOM Div which is the body of the widget,</li>
	 * 								<li>title: a reference to the DOM Div which is the title of the widget.</li></ul>
	 * @since 1.0
	 */
	_widgetCreate:function(components){
		// widget creation
		var widgetHash = $H({
			title			: 'title',
			collapseBut 	: true,
			onLoadCollapse	: components.get('widgetCollapse'),
			targetDiv		: components.get('divId')
		});	
		
		var widget = new unmWidget(widgetHash);
		return $H({
			content : components.get('container').down('[id="unmWidgetContent_'+ components.get('divId') + '"]'),
			title	: components.get('container').down('[id="unmWidgetTitleHTML_'+ components.get('divId') +'"]').down()
		});
	},
	/**
	 * Function in charge of assigning the different containers of the screen so that they can easily be addressed by the class using the screen object.<br>
	 * This function is called at the end of the screen component creation. Some contianers are particular for creation, some other for view\edit.
	 * @since 1.0
	 * <br/>Modification for version 2.1
	 * <ul>
	 * <li>Addition of the field to manage the "Schedule to" field</li>
	 * </ul>
	 */
	_assignContainers:function(){
		this.empSearchSpotReq  		= this._topWidget.get('content').down('[id="topLeftPanelContainerReq"]');
		this.empSearchReqId 		= 'topLeftPanelContainerReq';
		
		this.empSearchSpotAff 		= this._topWidget.get('content').down('[id="topLeftPanelContainerAff"]');  
		this.empSearchAffId 		= 'topLeftPanelContainerAff';

		this.dynCompInfoSpot		= this._topWidget.get('content').down('[id="topRightPanelContainer"]');

/*
		this.ticketIDSpot			= {	label: this._middleWidget.get('content').down('[id="ticketScreen_ticketID_label"]'),
							  			value: this._middleWidget.get('content').down('[id="ticketScreen_ticketID_value"]')};
*/
		this.ticketCdateSpot 		= { label: this._middleWidget.get('content').down('[id="ticketScreen_ticketCdate_label"]'),
							  	  		value: this._middleWidget.get('content').down('[id="ticketScreen_ticketCdate_value"]')};
		this.ticketSubjectSpot 		= { label: this._middleWidget.get('content').down('[id="ticketScreen_ticketSubject_label"]'),
							       		value: this._middleWidget.get('content').down('[id="ticketScreen_ticketSubject_value"]'),
								   		id	 : 'ticketScreen_ticketSubject_value'};
		this.ticketStatusSpot 		= { label: this._middleWidget.get('content').down('[id="ticketScreen_ticketStatus_label"]'),
							  	  		value: this._middleWidget.get('content').down('[id="ticketScreen_ticketStatus_value"]')};
		this.ticketSGSpot 			= { label: this._middleWidget.get('content').down('[id="ticketScreen_ticketSG_label"]'),
							  			value: this._middleWidget.get('content').down('[id="ticketScreen_ticketSG_value"]'),
							  			id	 : 'ticketScreen_ticketSG_value'};
		this.ticketSASpot 			= { label: this._middleWidget.get('content').down('[id="ticketScreen_ticketSA_label"]'),
							  			value: this._middleWidget.get('content').down('[id="ticketScreen_ticketSA_value"]'),
							  			id	 : 'ticketScreen_ticketSA_value'};
		this.ticketSSpot 			= { label: this._middleWidget.get('content').down('[id="ticketScreen_ticketS_label"]'),
							 			value: this._middleWidget.get('content').down('[id="ticketScreen_ticketS_value"]'),
							 			id	 : 'ticketScreen_ticketS_value'};
		this.ticketDdateSpot 		= { label: this._middleWidget.get('content').down('[id="ticketScreen_ticketDdate_label"]'),
							  	 		value: this._middleWidget.get('content').down('[id="ticketScreen_ticketDdate_value"]')};
		this.ticketRtimeSpot 		= { label: this._middleWidget.get('content').down('[id="ticketScreen_ticketRtime_label"]'),
							 			value: this._middleWidget.get('content').down('[id="ticketScreen_ticketRtime_value"]')};
		this.ticketCompanyGroupingSpot = {	value: this._middleWidget.get('content').down('[id="scm_ticket_creation_companyGroupingSkill"]'),
											id	 : 'scm_ticket_creation_companyGroupingSkill'};
		this.ticketCompanyGroupingLabel= {	value	:this._middleWidget.get('content').down('[id="scm_ticket_creation_compGroupingLabel"]'),
											id		: 'scm_ticket_creation_compGroupingLabel'};
		this.ticketCompanyGroupingDDSpot={ value: this._middleWidget.get('content').down('[id="scm_ticket_creation_compGroupingDropDown"]'),
										   id	: 'scm_ticket_creation_compGroupingDropDown'};				
		this.ticketMarkSolvedSpot = {
				value: this._middleWidget.get('content').down('[id="scm_ticket_creation_markSolved"]'),
				check: this._middleWidget.get('content').down('[id="scm_ticket_creation_markSolved_check"]')
			}
		//since 2.1 Add the schedule time in the screen
		this.ticketScheduledTimeSpot = { label	: this._middleWidget.get('content').down('div#scm_ticketScreen_schedule_label'),
							 			 value	: this._middleWidget.get('content').down('div#scm_ticketScreen_schedule_value')};
								   
		if (this._mode == 1){
			this.ticketDescrSpot = { label: this._middleWidget.get('content').down('[id="ticketScreen_ticketDescr_label"]'),
							  	 value: this._middleWidget.get('content').down('[id="ticketScreen_ticketDescr_value"]'),
								 id: 'ticketScreen_ticketDescr_value'
							   };
			this.ticketCheckSpot = { value: this._middleWidget.get('content').down('[id="scm_ticket_creation_mail_opt"]')
								   };	
			this.ticketAttrSpot = { value: this._middleWidget.get('content').down('[id="ticketScreen_ticketAttributesContent"]'),
								 	id: 'ticketScreen_ticketAttributesContent'
							  };
			this.ticketMailCheckboxDiv = { value: this._middleWidget.get('content').down('[id="scm_ticket_creation_mail_opt"]'),
										  id:'scm_ticket_creation_mail_opt'
										};
			this.ticketMailCheckBox = { value: this._middleWidget.get('content').down('[id="ticketScreen_mailOption"]'),
										id: 'ticketScreen_mailOption'
									  };
							 
		}
		
		if (this._mode == 2){
			this.ticketAttrSpot 		= { value	: this._middleWidget.get('content').down('[id="SCM_ticketScreen_MiddlePanelRight_attributes_panel"]')};
			this.ticketPrevActSpot 		= { value	: this._middleWidget.get('content').down('[id="SCM_ticket_screen_previousActionsPanel"]')};
			this.ticketDescrSpot 		= { value	: this._middleWidget.get('content').down('[id="SCM_ticketScreen_MiddlePanelRight_textEditor"]'),
									 	  	id		: 'SCM_ticketScreen_MiddlePanelRight_textEditor'};
			this.ticketDescrEditSpot 	= { value	: this._middleWidget.get('content').down('[id="SCM_ticketScreen_MiddlePanelRight_textEditor2"]'),
									 		id		: 'SCM_ticketScreen_MiddlePanelRight_textEditor2'};
			this.ticketDescrDescrSpot   = { value	: this._middleWidget.get('content').down('[id="SCM_ticketScreen_MiddlePanelRight_textEditor3"]'),
									 		id		: 'SCM_ticketScreen_MiddlePanelRight_textEditor3'};
			this.ticketDescrSolSpot		= { value	: this._middleWidget.get('content').down('[id="SCM_ticketScreen_MiddlePanelRight_textEditor4"]'),
									 		id		: 'SCM_ticketScreen_MiddlePanelRight_textEditor4'};
			this.ticketActionHeaderView = { value	: this._middleWidget.get('content').down('[id="SCM_ticketScreen_MiddlePanelRight_header"]'),
											id		: 'SCM_ticketScreen_MiddlePanelRight_header'};
			this.ticketActionHeaderEdit = {	value	: this._middleWidget.get('content').down('[id="SCM_ticketScreen_MiddlePanelRight_header_edit"]'),
											id		: 'SCM_ticketScreen_MiddlePanelRight_header_edit'};
			this.ticketActionHeaderDesc = {	value	: this._middleWidget.get('content').down('[id="SCM_ticketScreen_MiddlePanelRight_header_description"]'),
											id		: 'SCM_ticketScreen_MiddlePanelRight_header_description'};
			this.ticketActionHeaderSol  = {	value	: this._middleWidget.get('content').down('[id="SCM_ticketScreen_MiddlePanelRight_header_solution"]'),
											id		: 'SCM_ticketScreen_MiddlePanelRight_header_solution'};
			//since 1.2 Keep the item with the technical fields flag item
			this.ticketActionHideTech	= { value	: this._middleWidget.get('content').down('[id="ticketScreenMiddleLeftPart"]').down('[id="ticketActions_showTechnicalAction"]'),
											id		: 'ticketActions_showTechnicalAction'};
/*
			this.ticketToSelectionSpot 	= { value	: this._middleWidget.get('content').down('[id="SCM_ticketScreen_MiddlePanelRight_header_to_selection"]'),
									  		id		: 'SCM_ticketScreen_MiddlePanelRight_header_to_selection'};
			this.ticketTypeSelectionSpot= { value	: this._middleWidget.get('content').down('[id="SCM_ticketScreen_MiddlePanelRight_header_type_selection"]'),
											id		: 'SCM_ticketScreen_MiddlePanelRight_header_type_selection'};


			this.ticketActionHeaderIcons= {icon1: { value 	: this._middleWidget.get('content').down('[id="SCM_ticketScreen_MiddlePanelRight_header_icon1"]'),
												    id		: 'SCM_ticketScreen_MiddlePanelRight_header_icon1'},
										   icon2: { value 	: this._middleWidget.get('content').down('[id="SCM_ticketScreen_MiddlePanelRight_header_icon2"]'),
												  	id		: 'SCM_ticketScreen_MiddlePanelRight_header_icon2'}};		

*/			this.ticketToSelectionEditSpot = { value: this._middleWidget.get('content').down('[id="SCM_ticketScreen_MiddlePanelRight_header_edit_to_selection"]'),
									  		   id	: 'SCM_ticketScreen_MiddlePanelRight_header_edit_to_selection'};
			this.ticketActionTypeSelectionEditSpotLabel = { value: this._middleWidget.get('content').down('[id="SCM_ticketScreen_MiddlePanelRight_header_edit_type_label"]'),
															id   : 'SCM_ticketScreen_MiddlePanelRight_header_edit_type_label'
												  		  }
			
			this.ticketTypeSelectionEditSpot={ value: this._middleWidget.get('content').down('[id="SCM_ticketScreen_MiddlePanelRight_header_edit_type_selection"]'),
											   id	: 'SCM_ticketScreen_MiddlePanelRight_header_edit_type_selection'};
/*
			this.ticketActionHeaderEditIcons={icon1: { value 	: this._middleWidget.get('content').down('[id="SCM_ticketScreen_MiddlePanelRight_header_edit_icon1"]'),
												  	   id		: 'SCM_ticketScreen_MiddlePanelRight_header_edit_icon1'},
										  	  icon2: { value 	: this._middleWidget.get('content').down('[id="SCM_ticketScreen_MiddlePanelRight_header_edit_icon2"]'),
												  	   id		: 'SCM_ticketScreen_MiddlePanelRight_header_edit_icon2'}};
*/			
			this.ticketEditorToHeader = {	value: 	this._middleWidget.get('content').down('[id="SCM_ticketScreen_MiddlePanelRight_header_edit_email_to"]'),
												id:		'SCM_ticketScreen_MiddlePanelRight_header_edit_email_to'
											};	
			this.ticketEditorSubjectHeader = {	value: 	this._middleWidget.get('content').down('[id="SCM_ticketScreen_MiddlePanelRight_header_edit_email_subject"]'),
												id:		'SCM_ticketScreen_MiddlePanelRight_header_edit_email_subject'
											};		
			this.ticketEditorCCHeader = {	value: 	this._middleWidget.get('content').down('[id="SCM_ticketScreen_MiddlePanelRight_header_edit_email_cc"]'),
												id:		'SCM_ticketScreen_MiddlePanelRight_header_edit_email_cc'
											};					
			this.ticketEditorFromHeader = {	value: 	this._middleWidget.get('content').down('[id="SCM_ticketScreen_MiddlePanelRight_header_edit_email_from"]'),
											id:		'SCM_ticketScreen_MiddlePanelRight_header_edit_email_from'
										  };	
			this.ticketEditorAttachmentHeader = { value: 	this._middleWidget.get('content').down('[id="SCM_ticketScreen_MiddlePanelRight_header_edit_email_attachment"]'),
												  id:		'SCM_ticketScreen_MiddlePanelRight_header_edit_email_attachment'
											}; 
			this.leftButtonPart			= { value: this._middleWidget.get('content').down('[id="SCM_ticketScreen_MiddlePanelRight_buttonLeft"]'),
											id: 'SCM_ticketScreen_MiddlePanelRight_buttonLeft'
										  };
			
			
			this.ticketMarkSolvedSpot.check.observe('click',function(){
				if(!Object.isEmpty(this.ticketMarkSolvedSpot.check.readAttribute('checked'))){
					this.ticketMarkSolvedSpot.check.writeAttribute('checked', 'X');
				}else{
					if (this.ticketMarkSolvedSpot.check.readAttribute('checked') == 'X') {
						this.ticketMarkSolvedSpot.check.writeAttribute('checked','');
					}else{
						this.ticketMarkSolvedSpot.check.writeAttribute('checked','X');
					}
				}
			}.bind(this));
		}
	},
	/**
	 * Function in charge of changing the title of top unmovable widget.
	 * @param {String} title The title that will be display in the top container.
	 * @param {String} completeTitle The complete title of the widget, in case the complete title is too long, this complete title will be used as tooltip.
	 * @since 1.0
	 */
	updateTopWidgetTitle:function(title, completeTitle){
		this._topWidget.get('title').update(title);
		this._topWidget.get('title').writeAttribute('title', completeTitle)
	},
	/**
	 * Function in charge of changing the middle widget title.
	 * @param {String} title The title that will be displayed in the middle container.
	 * @since 1.0
	 */
	updateMiddleWidgetTitle:function(title){
		this._middleWidget.get('title').update(title);
	},
	
/*
	hideTicketNewActionIcons:function(){
		this.ticketActionHeaderIcons.icon1.value.addClassName('SCM_ticket_screen_hidden');
		this.ticketActionHeaderIcons.icon2.value.addClassName('SCM_ticket_screen_hidden');
	},
*/
	/**
	 * Function in charge of building the status text with icon. The icon will depend of the status
	 * @param {int} statusId The status id (defined in the statuses table.
	 * @param {int} type The type of ticket (1 = internal, 2 is external).
	 * @since 1.0
	 * <br/>Modified in 2.1 
	 * <ul>
	 * <li>Do not read the status label from global. This values comes from HRW</li>
	 * </ul>
	 */
	setTicketStatus:function(statusId, type){
		var statusDef = this.statuses.get(statusId);
		var html = '<div id="ticketStatusIcon" class="SCM_DotIconsSize SCM_ticketScreen_StatusIcon ';
		(type == 1)? html+= statusDef.classNameInt:html += statusDef.classNameExt;
		//since 2.1 Remove the label around the status definition. This labels comes from HRW
		html += '"></div>'+
				'<div class="SCM_ticketScreen_statusText">'+ statusDef.label +'</div>';
		
		this.ticketStatusSpot.value.update('');
		this.ticketStatusSpot.value.insert(html);
	},
	/**
	 * Function in charge of hiding the button in view mode as no buttons should be displayed.
	 * @since 1.0
	 */
	hideTicketButtonsForView:function(){
		this._middleWidget.get('content').down('[id="SCM_ticketScreen_MiddlePanelRight_buttons"]').addClassName('SCM_ticket_screen_hidden');
	},
	/**
	 * Function in charge of changing the title of the right part of the middle widget (View Action,...) in display mode.
	 * @param {String} title The title to be displayed.
	 * @since 1.0
	 */
	setTitleMiddlePartRightForDisplay:function(title){
		this._middleWidget.get('content').down('[id="SCM_ticketScreen_MiddlePanelRight_title"]').update();
		this._middleWidget.get('content').down('[id="SCM_ticketScreen_MiddlePanelRight_title"]').insert(title);
		this._middleWidget.get('content').down('[id="SCM_ticketScreen_MiddlePanelRight_title2"]').addClassName('SCM_ticket_screen_hidden');
	},
	
	
	/**
	 * Function managing the click on the buttons of the ticket screen.<br>
	 * This function triggers different events depending of the clicked button. These events will be caught be the class using the screen object.
	 * @param {String} button The string associated to the button pressed.
	 * @since 1.0
	 */
	ticketActionPressed:function(button){
		if (button == 'ticketScreen_SaveAndSendButton'){
			document.fire('EWS:scm_ticketCreateClicked');
		}else if (button == 'ticketScreen_CancelButton'){
			document.fire('EWS:scm_ticketCreationCancelled');
		}else if (button == 'ticketScreen_SaveAndAddButton'){
			document.fire('EWS:scm_ticketEditSave');
		}else if (button == 'ticketScreen_reply'){
			document.fire('EWS:scm_ticketEditReply');
		}else if (button == 'ticketScreen_replyAll'){
			document.fire('EWS:scm_ticketEditReplyAll');
		}else if (button == 'ticketScreen_forward'){
			document.fire('EWS:scm_ticketEditForward');
		}else if (button == 'ticketScreen_resend'){
			document.fire('EWS:scm_ticketEditResend');
		}
/*
else if (button == 'editCancelChange'){
			document.fire('EWS:scm_ticketEditCancelled');
		}
*/
	},
	/**
	 * Function in charge of hiding the action type displayed on top of the New Action editor.
	 * @since 1.0
	 */
	hideActionType:function(){
		this.ticketActionTypeSelectionEditSpotLabel.value.addClassName('SCM_ticket_screen_hidden');
		this.ticketTypeSelectionEditSpot.value.addClassName('SCM_ticket_screen_hidden');
	},
	/**
	 * Function in charge of showing the action type displayed on top of the New Action editor.
	 * @since 1.0
	 */
	showActionType:function(){
		this.ticketActionTypeSelectionEditSpotLabel.value.removeClassName('SCM_ticket_screen_hidden');
		this.ticketTypeSelectionEditSpot.value.removeClassName('SCM_ticket_screen_hidden');
	},
	/**
	 * Function in charge of hiding the send buttons displayed at the bottom of the New Action editor when the email send is chosen.
	 * @since 1.0
	 */
	hideSendButton:function(){
		this._middleWidget.get('content').down('[id="SCM_ticketScreen_MiddlePanelRight_button1"]').addClassName('SCM_ticket_screen_hidden');
		this._middleWidget.get('content').down('[id="SCM_ticketScreen_MiddlePanelRight_buttonLeft"]').addClassName('SCM_ticket_screen_hidden');
	},
	/**
	 * Function in charge of hiding the container at the left bottom of the New Action editor. 
	 * @since 1.0
	 */
	hideSignatureLink:function(){
		this._middleWidget.get('content').down('[id="SCM_ticketScreen_MiddlePanelRight_buttonLeft"]').update();
	},
	/**
	 * Function in charge of displaying the send buttons displayed at the bottom of the New Action editor when the email send is chosen.
	 * @since 1.0
	 */
	showSendButton:function(){
		this._middleWidget.get('content').down('[id="SCM_ticketScreen_MiddlePanelRight_button2"]').addClassName('SCM_ticket_screen_hidden');
		this._middleWidget.get('content').down('[id="SCM_ticketScreen_MiddlePanelRight_button1"]').removeClassName('SCM_ticket_screen_hidden');
		this._middleWidget.get('content').down('[id="SCM_ticketScreen_MiddlePanelRight_buttonLeft"]').removeClassName('SCM_ticket_screen_hidden');
	},
	/**
	 * Functiono in charge of displaying the correct buttons depending of the list of button to display given in parameter.
	 * @param {String} buttonsToShow A string containing the name of the button that should be shown for the email. This string can contain one or more values defined as:
	 * <ul><li>replyAll</li><li>reply</li><li>forward</li><li>resend</li></ul> in any order.
	 * @since 1.0
	 */
	showMailButtons:function(buttonsToShow){
		this._middleWidget.get('content').down('[id="SCM_ticketScreen_MiddlePanelRight_button2"]').update();
		if(buttonsToShow.indexOf('replyAll')!= -1)
			this._middleWidget.get('content').down('[id="SCM_ticketScreen_MiddlePanelRight_button2"]').insert(this._viewEditButtons.getButton('ticketScreen_replyAll'));
		if(buttonsToShow.indexOf('reply')!= -1)
			this._middleWidget.get('content').down('[id="SCM_ticketScreen_MiddlePanelRight_button2"]').insert(this._viewEditButtons.getButton('ticketScreen_reply'));
		if(buttonsToShow.indexOf('forward')!= -1)
			this._middleWidget.get('content').down('[id="SCM_ticketScreen_MiddlePanelRight_button2"]').insert(this._viewEditButtons.getButton('ticketScreen_forward'));
		if(buttonsToShow.indexOf('resend')!= -1)
			this._middleWidget.get('content').down('[id="SCM_ticketScreen_MiddlePanelRight_button2"]').insert(this._viewEditButtons.getButton('ticketScreen_resend'));
		this._middleWidget.get('content').down('[id="SCM_ticketScreen_MiddlePanelRight_button1"]').addClassName('SCM_ticket_screen_hidden');
		this._middleWidget.get('content').down('[id="SCM_ticketScreen_MiddlePanelRight_button2"]').removeClassName('SCM_ticket_screen_hidden');
	},
	/**
	 * Function in charge of hiding all the mail buttons displayed.
	 * @since 1.0
	 */
	hideMailButtons:function(){
		this._middleWidget.get('content').down('[id="SCM_ticketScreen_MiddlePanelRight_button2"]').addClassName('SCM_ticket_screen_hidden');
	},
	/**
	 * Function in charge of changing the text diplayed in the save button.
	 * @param {String} label The text that should be displayed in the button.
	 * @since 1.0
	 */
	editButtonLabel:function(label){
		this._viewEditButtons.updateLabel('ticketScreen_SaveAndAddButton', global.getLabel(label));
	},
// new functions to enable and disable the edit button save, send request to requestor,...	
	/**
	 * Function in charge of disabling the save button in the case of the employee has been changed as the ticket cannot be saved or created if the employee is not retrieved by the employee search.
	 * @since 1.0
	 */
	disableEditButton:function(){
		this._viewEditButtons.disable('ticketScreen_SaveAndAddButton');
	},
	/**
	 * Function in charge of enabling the save button in the case of the employee has been retrieved by the employee search.
	 * @since 1.0
	 */
	enableEditButton:function(){
		this._viewEditButtons.enable('ticketScreen_SaveAndAddButton');
	},
// new functions
	
	enlargeServiceAreasAutocompleter:function(){
		var mainContainer = this._middleWidget.get('content').down('[id="ticketScreenMiddleTopPart"]');
		mainContainer.down('[id="text_area_ticketScreen_ticketSA_value"]').addClassName('SCM_ticketScreen_MiddlePanelTop_longAutoComplete_input');
	},
	
	/**
	 * Function in charge of changing the size of the Service groups autocompleter to match the desired size.
	 * @since 1.0
	 */
	enlargeServiceGroupsAutocompleter:function(){
		var mainContainer = this._middleWidget.get('content').down('[id="ticketScreenMiddleTopPart"]');
		mainContainer.down('[id="text_area_ticketScreen_ticketSG_value"]').addClassName('SCM_ticketScreen_MiddlePanelTop_longAutoComplete_input');
	},
	/**
	 * Function in charge of changing the size of the Services autocompleter to match the desired size.
	 * @since 1.0
	 */
	enlargeServicesAutocompleter:function(){
		var mainContainer = this._middleWidget.get('content').down('[id="ticketScreenMiddleTopPart"]');
		mainContainer.down('[id="text_area_ticketScreen_ticketS_value"]').addClassName('SCM_ticketScreen_MiddlePanelTop_longAutoComplete_input');
	},
	/**
	 * Function in charge of changing the height of the containers within the middle widget
	 * @since 1.0
	 * @deprecated since 1.0
	 */
	enheightCenterContainers:function(){
		this._middleWidget.get('content').down('[id="ticketScreenMiddleLeftPart"]').addClassName('SCM_centerContainerEnheight');
		this._middleWidget.get('content').down('[id="ticketScreenMiddleRightPart"]').addClassName('SCM_centerContainerEnheight');
		this._middleWidget.get('content').down('[id="SCM_ticket_screen_previousActionsPanel"]').addClassName('SCM_ticketScreen_MiddlePanelLeft_action_display_enheight');
	},
	/**
	 * Function in charge of reseting the height of the containers within the middle widget
	 * @since 1.0
	 * @deprecated since 1.0
	 */
	resetHeightCenterContainers:function(){
		this._middleWidget.get('content').down('[id="ticketScreenMiddleLeftPart"]').removeClassName('SCM_centerContainerEnheight');
		this._middleWidget.get('content').down('[id="ticketScreenMiddleRightPart"]').removeClassName('SCM_centerContainerEnheight');
		this._middleWidget.get('content').down('[id="SCM_ticket_screen_previousActionsPanel"]').removeClassName('SCM_ticketScreen_MiddlePanelLeft_action_display_enheight');
	},
	
	/**
	 * @since 2.0
	 */
	hideFreeSpots:function(){
		this._middleWidget.get('content').down('[id="ticketScreen_free1_label"]').addClassName('SCM_ticket_screen_hidden');
		this._middleWidget.get('content').down('[id="ticketScreen_free1_value"]').addClassName('SCM_ticket_screen_hidden');
	},
	
	/**
	 * 
	 * @since 2.0
	 * <br/>Modified in 2.1 
	 * <ul>
	 * <li>Add the shift of the schedule field</li>
	 * <li>Check if some fields are already removed before doing it</li>
	 * </ul>
	 */
	removeServiceArea:function(){
		//since 2.1 Add one level because the up alway exist
		if(this.ticketSASpot.label.up(2))
			this.ticketSASpot.label.remove();
		if(this.ticketSASpot.value.up(2))	
			this.ticketSASpot.value.remove();
		
		this.ticketCdateSpot.label.insert({
			before: this.ticketSGSpot.label
		});
		this.ticketCdateSpot.label.insert({
			before: this.ticketSGSpot.value
		});
		this.ticketDdateSpot.label.insert({
			before: this.ticketSSpot.label
		});
		this.ticketDdateSpot.label.insert({
			before: this.ticketSSpot.value
		});
		this.ticketStatusSpot.label.insert({
			before: this.ticketSubjectSpot.label
		});
		this.ticketStatusSpot.label.insert({
			before: this.ticketSubjectSpot.value
		});
		//since 2.1 Move also the new field with schedule 
		//since 2.1 Add one level because the up alway exist
		if(this.ticketRtimeSpot.label.up(2)) {
			this.ticketRtimeSpot.label.insert({
				before: '<div id="SCM_MiddlePanel_BlanckField_1" style="width:60%; float:left;">&nbsp;</div>'
			});
		}
		if(this.ticketMarkSolvedSpot.value.up(2)) {
			this.ticketMarkSolvedSpot.value.insert({
				before: this.ticketScheduledTimeSpot.label
			});
			this.ticketMarkSolvedSpot.value.insert({
				before: this.ticketScheduledTimeSpot.value
			});
		}
	},
	
	/**
	 * Function in charge of clearing the containers of the screen objects.
	 * @since 1.0
	 * <br/>Modified in 2.1
	 * <ul>
	 * <li>Add the reset of the fields related to the "schedule to"</li>
	 * </ul>
	 */
	resetData:function(){
		this.empSearchSpotReq.update();
		this.empSearchReqId = null;
		this.empSearchSpotAff.update();  
		this.empSearchAffId = null;
		this.dynCompInfoSpot.update();
		if(this.dynCompInfoList)
			this.dynCompInfoClicked(this.dynCompInfoList[0]);
//		this.ticketIDSpot.value.update();
		this.ticketCdateSpot.value.update();
		this.ticketSubjectSpot.value.update();
		this.ticketStatusSpot.value.update();
		this.ticketSGSpot.value.update();
		this.ticketSSpot.value.update();
		this.ticketDdateSpot.value.update();
		this.ticketRtimeSpot.value.update();
		this.ticketCompanyGroupingDDSpot.value.update();
		this.ticketDescrSpot.value.update();
		this.ticketAttrSpot.value.update();
		//since 2.1 Remove the schedule time from the screen as the blanck field before the runtime
		this.ticketScheduledTimeSpot.value.update();
		var blanckField = $('SCM_MiddlePanel_BlanckField_1');
		if(blanckField)blanckField.remove();
		
		if (this._mode == 1){
//			this.ticketCheckSpot.value.update();	
//			this.ticketMailCheckboxDiv.value.update();
//			this.ticketMailCheckBox.value.update();
		}
		if (this._mode == 2){
			this.ticketPrevActSpot.value.update();
//			this.ticketToSelectionSpot.value.update();
//			this.ticketTypeSelectionSpot.value.update();
//			this.ticketActionHeaderIcons.icon1.value.update();
//			this.ticketActionHeaderIcons.icon2.value.update();		
		}
	}
	
});
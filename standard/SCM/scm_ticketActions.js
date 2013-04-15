/**
 * @class
 * @description Class in charge of generating and managing the display of the action history (middle left part of the view\edit screens.<br>
 * This class will generate a view with grouping of the action depending of their date. The groups will be:<ul>
 * 	<li>today</li>
 *	<li>yesterday</li>
 *  <li>thisweek</li>
 *  <li>lastweek</li>
 *  <li>thismonth</li>
 *  <li>lastmonth</li>
 *  <li>older</li>
 *  <li>description</li>
 *  <li>solution</li>
 * </ul>
 * @author jonathanj & nicolasl
 * @version 2.2
 * <br/>Modified for 2.2:
 * <ul>
 * <li>Remove the bottom border to cells that are last one in a group to avoid display problem</li>
 * </ul>
 * <br/>Modified for 2.0:
 * <ul>
 * <li>Addidion of the acitons for the inbox integration</li>
 * </ul>
 * <br/>Modified for 1.2:
 * <ul>
 * <li>Do not show the collapse button for solution and description in the actions history</li>
 * <li>Once the user select an action, get the selected action from its id and not fro its index</li>
 * </ul>
 */
var scm_ticketActions = Class.create(/** @lends scm_ticketActions.prototype */{
	/**
	 * The Array of action to be displayed in the history
	 * @type Array
	 * @since 1.0
	 */
	actionsList:null,
	/**
	 * JSon object containing JSon objects for each groups. The group JSon has the following structure:<ul>
	 * 	<li>title: the title of the group of actions,</li>
	 *  <li>actions: the actions part of the group,</li>
	 *  <li>open: flag meaning if the group is displayed colapsed or expanded,</li>
	 *  <li>displayed: flag meaning if the group is displayed on the screen.</li>
	 * </ul>
	 * @type JSon
	 * @since 1.0
	 */
	actionGroups:null,
	/**
	 * The generated HTML representing the action history.
	 * @type HTML
	 * @since 1.0
	 */
	generatedHTML : null,
	/**
	 * Dom element containing the action history HTML.
	 * @type Dom DIV Element object
	 * @since 1.0
	 */
	container: null,
	/**
	 * The id of the selected action.
	 * @type int
	 * @since 1.0
	 */
	selectedAction: null,
	/**
	 * The ticket description as it's part of the groups.
	 * @type String
	 * @since 1.0
	 */
	ticketDescription: null,
	/**
	 * The ticket solution as it's part of the groups.
	 * @type String
	 * @since 1.0
	 */
	ticketSolution: null,
	/**
	 * Flag meaning if the action history should be displayed in view only mode (ticket view) or with the links to copy the action (ticket edit).
	 * @type boolean
	 * @since 1.0
	 */
	viewOnly:null,
	/**
	 * Constructor of the action history object. It initialize the attributes of the class and create the JSon for the action groups.<br> 
	 * After the initialization phase, it calls the _createActionsGroups function and the _initMainContainer function.
	 * @param {String} ticketDescription The ticket description.
	 * @param {String} ticketSolution The ticket solution.
	 * @param {Array} actionsList The list of action on the ticket.
	 * @param {boolean} withGrouping Flag nmeaning if the actions should be grouped or not (true = with grouping, false = no grouping).
	 * @param {boolean} technical Flag meaning if the technical actions should be displayed or not (true = display the technical actions, flase = don't display the technical actions).
	 * @param {boolean} viewOnly Flag meaning if the list of action is to display in read only (without links) or not.
	 * @since 1.0
	 */	
	initialize:function(ticketDescription, ticketSolution, actionsList, withGrouping, technical, viewOnly){
		this.actionsList = actionsList;
		this.ticketDescription = ticketDescription;
		this.ticketSolution = ticketSolution;
		this.viewOnly = viewOnly;
		
		this.actionGroups = {
			today		:{ title: global.getLabel('Today')		, actions: $A(), open: true, displayed:true},
			yesterday	:{ title: global.getLabel('Yesterday')	, actions: $A(), open: true, displayed:true },
			thisweek	:{ title: global.getLabel('This_week')	, actions: $A(), open: true, displayed:true },
			lastweek	:{ title: global.getLabel('Last_week')	, actions: $A(), open: true, displayed:true },
			thismonth	:{ title: global.getLabel('This_month')	, actions: $A(), open: true, displayed:true },
			lastmonth	:{ title: global.getLabel('Last_month')	, actions: $A(), open: true, displayed:true },
			older		:{ title: global.getLabel('Older')		, actions: $A(), open: true, displayed:true },
			description	:{ title: global.getLabel('DESCR')		, actions: $A(), open: true, displayed:true },
			solution	:{ title: global.getLabel('Solution')	, actions: $A(), open: true, displayed:true }
		};
		this._createActionsGroups();
		this._initMainContainer(withGrouping, technical);
	},
	/**
	 * Function in charge of setting the actions in the correct groups.<br>
	 * This function calls the _computeTimeDifference function in order to determine in which group the action should be placed.<br>
	 * Once the group has been retrieved it will call the _addActionInGroup function in order to build the array containing the actions for the group.
	 * @see scm_ticketActions#_computeTimeDifference
	 * @see scm_ticketActions#_addActionInGroup
	 * @since 1.0
	 */
	_createActionsGroups:function(){
		this.container = new Element('DIV');
		// description and solution initialize
		this.actionGroups.description.actions.push({ description: this.ticketDescription, technical:false, displayed:true });
		if (!Object.isEmpty(this.ticketSolution)){
			if(!Object.isEmpty(this.ticketSolution.stripTags().gsub('\n','').gsub('&nbsp;','')))
				this.actionGroups.solution.actions.push({ description: this.ticketSolution, technical:false, displayed:true });
		}
		// other groups initialize
		this.actionsList.each(function(action){
			if (!Object.isEmpty(action.CompletedTime) && Object.isString(action.CompletedTime)) {
				var group = this._computeTimeDifference(action.CompletedTime);
				this._addActionInGroup(action, group);
			}else if(!Object.isEmpty(action.DueDate) && Object.isString(action.DueDate)){
				var group = this._computeTimeDifference(action.DueDate);
				this._addActionInGroup(action, group);
			}
		}.bind(this));	
	},
	
	/**
	 * Function in charge of computing the time difference between the current date and the actions date.
	 * @param {Object} dateTime The date and time of an action.
	 * @returns {int} The id of the group where the action should be placed.
	 * @since 1.0
	 */
	_computeTimeDifference:function(dateTime){
		var currentDate = new Date();
		var currentDay = currentDate.getDate();
		var currentMonth = currentDate.getMonth() + 1;
		var currentYear = currentDate.getFullYear();
		var currentDayOfWeek = currentDate.getDay();
		var actionDay = dateTime.substr(8, 2);
		var actionMonth = dateTime.substr(5, 2);
		var actionYear = dateTime.substr(0, 4);
		var yearDiff  = currentYear - actionYear;
		var monthDiff = currentMonth - actionMonth;
		var dayDiff   = currentDay - actionDay;
		if (yearDiff == 0){
			if (monthDiff == 0){
				if (dayDiff == 0){
					// today
					return 0;
				}else if(dayDiff == 1){
					// yesterday
					return 1;
				}else if(dayDiff > 1 && dayDiff < currentDayOfWeek){
					// this week
					return 2;
				}else if(dayDiff > currentDayOfWeek && dayDiff < (currentDayOfWeek + 7)){
					// last week
					return 3;
				}else{
					// this month
					return 4;
				}
			}else if (monthDiff == 1){
				// last month
				return 5;
			}else{
				// older
				return 6;
			}
		}else{
			// older
			return 6;
		}
		
	},
	/**
	 * Function in charge of adding the action in the correct group.<br>
	 * The action will be inserted in the array using unshift in order to have the actions in the reverse order (newest on top).
	 * @param {JSon} action The JSon representing the array.
	 * @param {int} group The id of the group in which the action should be inserted.
	 * @since 1.0
	 * <br/>Modified for 2.0 
	 * <ul>
	 * <li>Add some non technical actions for the inbox integration</li>
	 * </ul>
	 */
	_addActionInGroup:function(action, group){
		var groupAction;
		switch(group){
					case 0: groupAction = this.actionGroups.today.actions;
							break;
					case 1:	groupAction = this.actionGroups.yesterday.actions;
							break;
					case 2:	groupAction = this.actionGroups.thisweek.actions;
							break;					
					case 3:	groupAction = this.actionGroups.lastweek.actions;
							break;					
					case 4:	groupAction = this.actionGroups.thismonth.actions;
							break;					
					case 5:	groupAction = this.actionGroups.lastmonth.actions;
							break;					
					case 6:	groupAction = this.actionGroups.older.actions;
							break;					
				}
		var actionDate = action.CompletedTime;	
		if (action.Type == '13'){
			actionDate = action.DueDate;
		}
		
		var techFlag = false;
		//since 2.0 Add the values 77, 78 and 98 for inbox integration
		if (action.Type != 0 &&action.Type != 1 && action.Type != 4 && action.Type != 9 && action.Type != 10 && action.Type != 12 && action.Type != 22 && action.Type != 38 && action.Type != 39 && action.Type != 77 && action.Type != 78 && action.Type != 98) {
			techFlag = true;
		}
		var displayedFlag = !techFlag;
		
		groupAction.unshift({	ticketId 		: action.TicketId, 
								status			: action.Status, 
								scAgentId		: action.ScAgentId, 
								scAgentName		: action.ScAgentName,
								description		: action.Description,
								completedTime 	: actionDate,
								actionId 		: action.TicketActionId,
								totalTime		: action.TotalTime,
								timeSpent		: action.TimeSpent,
								type			: action.Type,
								dueDate			: action.DueDate,
								technical		: techFlag,
								displayed		: displayedFlag
							});
	},
	/**
	 * Function in charge of counting the actions in each group in order to display it in the group header.<br>
	 * This count will depend if the technical actions should be showed or not.
	 * @param {boolean} technical Flag to say if the technical action should be counted.
	 * @param {JSon} actionGroup The JSon object representing the group of actions.
	 * @since 1.0
	 */
	_countActions:function(technical, actionGroup){
		var counter = 0;
		actionGroup.actions.each(function(action){
			if (technical == true){
				counter++;
				action.displayed = true;
			}else{
				action.displayed = false;
				if (action.technical == false){
					counter++;
					action.displayed = true;
				}	
			}
		});
		return counter;
	},
	/**
	 * Function in charge of building the display for the main container.<br>
	 * This function will call the _initActionContainer for each group in order to create the "outlook" like display.
	 * @param {boolean} withGrouping Flag meaning if the "outlook" like grouping should be used (default comportment)
	 * @param {boolean} technical Flag meaning if the technical actions should be displayed (default the technical actions are hidden)
	 * @see scm_ticketActions#_initActionContainer
	 * @since 1.0
	 */
	_initMainContainer:function(withGrouping, technical){
		
		this.container.update();
		this._initActionContainer(this.actionGroups.description, 0, 'description', withGrouping, technical);
		this._initActionContainer(this.actionGroups.solution, 0, 'solution', withGrouping,technical);
		this._initActionContainer(this.actionGroups.today, 1, 'today', withGrouping,technical);
		this._initActionContainer(this.actionGroups.yesterday, 1, 'yesterday', withGrouping,technical);
		this._initActionContainer(this.actionGroups.thisweek, 1, 'thisweek', withGrouping,technical);
		this._initActionContainer(this.actionGroups.lastweek, 1, 'lastweek', withGrouping,technical);
		this._initActionContainer(this.actionGroups.thismonth, 1, 'thismonth', withGrouping,technical);
		this._initActionContainer(this.actionGroups.lastmonth, 1, 'lastmonth', withGrouping,technical);
		this._initActionContainer(this.actionGroups.older, 1, 'older', withGrouping,technical);
	},
	/**
	 * Function in charge of building the display for a group of actions.<br>
	 * The dislpay of the group may vary depending of the parameters given to the function.<br>
	 * Before building the display, it counts the number of actions by calling the _countActions function as if the group doesn't contains any actions, it will not be displayed.
	 * In order to build the header, it calls the _initActionGroupHeader function before calling the _initActionGroup function in order to build the display of the group.<br>
	 * As description and solutin are a bit different, it calls the _initDescription or _initSolution function to build this specific display.
	 * @param {JSon} actionGroup The action goup.
	 * @param {int} count Int used as a flag meaning if the count should be display in the group title (0 no count, 1 display count).
	 * @param {String} actionDescriptor The group id (needed to know if the group is the description or solution, or if a normal group).
	 * @param {boolean} withGrouping Flag meaning if the grouping is used (if no grouping, the header of the group will not be generated).
	 * @param {boolean} technical Flag meaning if the technical actions should be displayed or hidden.
	 * @see scm_ticketActions#_countActions
	 * @see scm_ticketActions#_initActionGroupHeader
	 * @see scm_ticketActions#_initDescription
	 * @see scm_ticketActions#_initSolution
	 * @see scm_ticketActions#_initActionGroup
	 * @since 1.0
	 * <br/>Modified in 2.2
	 * <ul>
	 * <li>Add the indication that an action is the last one of a group</li>
	 * </ul>
	 */
	_initActionContainer:function(actionGroup, count, actionDescriptor, withGrouping,technical){
		var numberOfActions = this._countActions(technical, actionGroup);
		//since 2.2 Addition of a parameter to indicate if an action is the last one
		var lastAction;
		
		actionGroup.displayed = true;
		if (numberOfActions > 0) {
			if (withGrouping===true){
				this.container.insert( this._initActionGroupHeader(actionGroup, numberOfActions, count, actionDescriptor));	
			}
			var actionGroupObject = new Element('div',{
				'id': 'ticketActionGroup_'+actionDescriptor
			});
			actionGroup.actions.each(function(action, key){
				if (actionDescriptor == 'description') {
					actionGroupObject.insert(this._initDescription(actionDescriptor));
					
				}else if(actionDescriptor == 'solution'){
					actionGroupObject.insert(this._initSolution(actionDescriptor));
				}else{	
					if (action.displayed == true) {
						//since 2.2 Indicate if this action is the last one of the group
						lastAction = (actionGroup.actions.length === (key + 1));
						actionGroupObject.insert(this._initActionGroup(action, count, lastAction));
					}
				}
			}.bind(this));
			this.container.insert(actionGroupObject);
		}else{
			actionGroup.displayed = false;
		}
	},
	/**
	 * Function in charge of building the display of the group header.<br>
	 * The header is composed of different elements and looks like:<br>
	 * Expand/colapse icon | Group title (nbr actions)<br>
	 * The clcik on the expand/colape button will call the _openCloseTicketActionGroup function.
	 * @param {JSon} actionGroup The action group.
	 * @param {int} nbrElement The number of actions in the group.
	 * @param {int} count Int used as a flag meaning if the count should be display in the group title (0 no count, 1 display count).
	 * @param {String} actionDescriptor The group id (needed to know if the group is the description or solution, or if a normal group). 
	 * @see scm_ticketActions#_openCloseTicketActionGroup
	 * @since 1.0
	 * <br/>Modified for 1.2:
	 * <ul>
	 * <li>Do not show the collapse button for solution and description</li>
	 * </ul>
	 */
	_initActionGroupHeader:function(actionGroup, nbrElement, count, actionDescriptor){
		var header = new Element('div',{
			'class' : 'SCM_ticketAction_header',
			'id': 'ticketAction_header_' + actionDescriptor
		});
		
		if(actionDescriptor != 'description' && actionDescriptor != 'solution'){
			//since 1.2 Do not display the minimize button if it is not possible to minimize
			var headerButton = new Element('div',{
				'class' : 'application_rounded_minimize SCM_ticketAction_headerIcon',
				'id'	: 'ticketAction_'+ actionDescriptor
			});
		
			headerButton.observe('click', function(){
				this._openCloseTicketActionGroup(actionDescriptor, actionGroup);
			}.bind(this));
			
			header.insert(headerButton);
		}
		
		if (count == 0) {
			header.insert(actionGroup.title);
		} else {
			header.insert(actionGroup.title + ' (' + nbrElement + ')');
		}
		return header;
	},
	
	/**
	 * Function in charge of building the display of the description of the ticket.<br>
	 * This group is always visible and cannot be colapsed.<br>
	 * In case the description is too long, the _trimText function is apllied on the description text in order to limit the text length displayed in the group.<br>
	 * If the display of the action is not read only, a link will be displayed in the group in order to copy the content in the editor by calling the _copyToEvent function.<br>
	 * A click on the action itself will have the effect to display it in the "view action" editor by calling the function _actionSelectedEvent.
	 * @param {String} descriptor The group id (needed to know if the group is the description or solution, or if a normal group). This descriptor will be used to generate a unique id for the div containing the group.
	 * @see scm_ticketActions#_trimText
	 * @see scm_ticketActions#_actionSelectedEvent
	 * @see scm_ticketActions#_copyToEvent
	 * @returns {DOM Div} The div representing the content of the group.
	 * @since 1.0
	 */
	_initDescription:function(descriptor){
		var description = new Element('div',{
			'class':'SCM_ticketAction_contentItem',
			'id':'SCM_ticketAction_id_'+descriptor
		});
		var clickableElement = new Element('div',{
			'class':'SCM_ticketAction_description SCM_ticketAction_clickable_item',
			'id':'SCM_ticketAction_click_description'
		});
		var ticketDescription = this._trimText(this.ticketDescription.stripScripts().stripTags(), 55);
		clickableElement.insert(ticketDescription.trimmedValue);
		
		description.insert(clickableElement);
		
		clickableElement.observe('click', function(){
					this._actionSelectedEvent({
						TicketActionId: 'description'
					});
				}.bind(this));
		
		if(this.viewOnly == false){
			var sendLink = new Element('div',{
				'class':'application_action_link SCM_ticketAction_copyLink',
				'id' :'copy_to_description'
			});
			sendLink.insert(global.getLabel('Copy_to_sendbox'));
			description.insert(sendLink);
			sendLink.observe('click', function(){
					this._copyToEvent({
						TicketActionId: 'description'
					});
				}.bind(this));
		}
		return description;
	},
	/**
	 * Function in charge of building the display of the solution of the ticket (if any, otherwize this group will not be visible).<br>
	 * This group cannot be colapsed.<br>
	 * In case the solution is too long, the _trimText function is apllied on the solution text in order to limit the text length displayed in the group.<br>
	 * If the display of the action is not read only, a link will be displayed in the group in order to copy the content in the editor by calling the _copyToEvent function.<br>
	 * A click on the action itself will have the effect to display it in the "view action" editor by calling the function _actionSelectedEvent.
	 * @param {String} descriptor The group id (needed to know if the group is the description or solution, or if a normal group). This descriptor will be used to generate a unique id for the div containing the group.
	 * @see scm_ticketActions#_trimText
	 * @see scm_ticketActions#_actionSelectedEvent
	 * @see scm_ticketActions#_copyToEvent
	 * @returns {DOM Div} The div representing the content of the group.
	 * @since 1.0
	 */
	_initSolution:function(descriptor){
		var solution = new Element('div',{
			'class':'SCM_ticketAction_contentItem',
			'id':'SCM_ticketAction_id_'+descriptor
		});
		var clickableElement = new Element('div',{
			'class':'SCM_ticketAction_description SCM_ticketAction_clickable_item',
			'id':'SCM_ticketAction_click_solution'
		});
		var ticketSolution = this._trimText(this.ticketSolution.stripScripts().stripTags(), 55);
		clickableElement.insert(ticketSolution.trimmedValue);
		
		solution.insert(clickableElement);
		
		clickableElement.observe('click', function(){
				this._actionSelectedEvent({
					TicketActionId: 'solution'
				});
			}.bind(this));
		
		if(this.viewOnly == false){
			var sendLink = new Element('div',{
				'class':'application_action_link SCM_ticketAction_copyLink',
				'id' :'copy_to_solution'
			});
			sendLink.insert(global.getLabel('Copy_to_sendbox'));
			solution.insert(sendLink);
			sendLink.observe('click', function(){
					this._copyToEvent({
						TicketActionId: 'solution'
					});
				}.bind(this));
		}
		return solution;
	},
	/**
	 * Function in charge of building the display of an action of the ticket.<br>
	 * This group can be colapsed.<br>
	 * In case the agent name or the action description is too long, the _trimText function is apllied on the text in order to limit the text length displayed in the group.<br>
	 * If the display of the action is not read only, a link will be displayed in the group in order to copy the content in the editor by calling the _copyToEvent function.<br>
	 * A click on the action itself will have the effect to display it in the "view action" editor by calling the function _actionSelectedEvent.
	 * @param {JSon} action The action for which the display should be build.
	 * @param {int} count Not used
	 * @param {Boolean} lastAction Indicate if this action is the last one in a list
	 * @see scm_ticketActions#_trimText
	 * @see scm_ticketActions#_actionSelectedEvent
	 * @see scm_ticketActions#_copyToEvent
	 * @returns {DOM Div} The div representing the content of the group.
	 * @since 1.0
	 * <br/>Modification for 2.2
	 * <ul>
	 * <li>Do not display any bottom border for the last cells of the groups</li>
	 * </ul>
	 * <br/>Modification for 1.2
	 * <ul>
	 * <li>The selection of the action does not use the postulate that all the actions are displayed</li>
	 * </ul>
	 */
	_initActionGroup: function(action, count, lastAction){
		var agentName = this._trimText(action.scAgentName, 25);
		var description = this._trimText(global.getLabel('SCM_Action_'+ action.type), 13);	
		
		//since 2.2 Add the bottom border for all items except the last one in the group
		var actionDescr = new Element('div',{
			'class'	: (lastAction)?'SCM_ticketAction_contentItem':'SCM_ticketAction_contentItem SCM_ticketAction_innerContentItem',
			'id'	:'SCM_ticketAction_id_'+ action.actionId
		});

		// MAIL ICON
		if (action.type == 10 || action.type == 24 || action.type == 25 || action.type == 75){
			actionDescr.insert(new Element('div',{'class':'SCM_ticketAction_contentLeft SCM_ItemMail SCM_itemSize'}));
		}
		// START ICON
		else if (action.type == 8 || action.type == 29){
			actionDescr.insert(new Element('div',{'class':'SCM_ticketAction_contentLeft SCM_ticketingPlayIcon SCM_ticketingPausePlayIconSize'}));
		}
		// PAUSE ICON
		else if (action.type == 7 || action.type == 30){
			actionDescr.insert(new Element('div',{'class':'SCM_ticketAction_contentLeft SCM_ticketingPauseIcon SCM_ticketingPausePlayIconSize'}));
		}
		// ATTACHMENT ICON
		else if(action.type == 9 || action.type == 11){
			actionDescr.insert(new Element('div',{'class':'SCM_ticketAction_contentLeft inbox_ticketAction_attachedFile SCM_ticketingPausePlayIconSize'}));
		}
		// OUT OF SLA ICON
		else if(action.type == 58){
			actionDescr.insert(new Element('div',{'class':'SCM_ticketAction_contentLeft SCM_ActionOutOfSLAIcon SCM_ActionsIconSize'}));
		}
		// CREATION ICON
		else if(action.type == 0){
			actionDescr.insert(new Element('div',{'class':'SCM_ticketAction_contentLeft SCM_ActionServicesIcon SCM_ActionsIconSize'}));
		}
		
		var clickableSpot = new Element('div',{
			'class':'SCM_ticketAction_contentLeft SCM_ticketAction_clickable_item',
			'id':'SCM_ticketAction_click_'+ action.actionId
		});
		clickableSpot.insert(action.actionId);
		actionDescr.insert(clickableSpot);

		var agentDiv = new Element('div',{'class':'SCM_ticketAction_contentLeft SCM_ticketAction_clickable_item', 'title':agentName.origValue}).insert('<b>'+agentName.trimmedValue+'</b>');
		agentDiv.observe('click', function(){
			//since 1.2 The ticket item is not always the array order
			this._actionSelectedEvent(this.actionsList.find(function(item) {
				return (item.TicketActionId == action.actionId);
			}));
		}.bind(this));
		actionDescr.insert(agentDiv);
		dateDiv = new Element('div',{'class':'SCM_ticketAction_contentRight SCM_ticketAction_clickable_item'}).insert(this._convertDate(action.completedTime).date);
		dateDiv.observe('click', function(){
			//since 1.2 The ticket item is not always the array order
			this._actionSelectedEvent(this.actionsList.find(function(item) {
				return (item.TicketActionId == action.actionId);
			}));
		}.bind(this));
		actionDescr.insert(dateDiv);
		var descriptDiv = new Element('div',{'class':'SCM_ticketAction_clickable_item','title':description.origValue}).insert('Description: ' + description.trimmedValue);
		descriptDiv.observe('click', function(){
			//since 1.2 The ticket item is not always the array order
			this._actionSelectedEvent(this.actionsList.find(function(item) {
				return (item.TicketActionId == action.actionId);
			}));
		}.bind(this));
		actionDescr.insert(descriptDiv);
		
		if(this.viewOnly == false){
			var sendLink = new Element('div',{
				'class':'application_action_link SCM_ticketAction_copyLink',
				'id' :'copy_to_'+ action.actionId
			});
			sendLink.insert(global.getLabel('Copy_to_sendbox'));
			actionDescr.insert(sendLink);
			sendLink.observe('click', function(){
						this._copyToEvent(this.actionsList[action.actionId-1]);
					}.bind(this));
		}
		return actionDescr;
	},
	/**
	 * Function in charge of converting the HRW date into the format of the user.
	 * @param {String} dateTime The date and time of the action.
	 * @returns {JSon} A JSon object whose format is:<ul>
	 * 	<li>date: the retrieved date and</li>
	 * 	<li>time: The retrived time.</li>
	 * </ul>
	 * @since 1.0
	 */
	_convertDate:function(dateTime){
		if(!Object.isString(dateTime)) return '';
	    var date = sapToObject(dateTime.substr(0, 10), dateTime.substr(11, 8));
	    return {
			date: objectToDisplay(date),
			time: objectToDisplayTime(date)
		};
	},
	/**
	 * @ignore
	 * @param {Object} container
	 */
	addActionHeadersListeners:function(container){},
	/**
	 * @ignore
	 */
	addActionsOnTicketActions:function(){},

	/**
	 * Function in charge of filter the actions. This function is called when the user changes the value of the checkbox displayed under the action history list.<br>
	 * This function calls the updateHeaders function in order to rebuild the display depending of the flag.
	 * @param {boolean} showTechnical Value of the check box used in order to know if the technical actions should be displayed.
	 * @see scm_ticketActions#updateHeaders
	 * @since 1.0
	 */
	filterActions:function(showTechnical){
		this.updateHeaders(showTechnical);
	},
	/**
	 * Function in charge of updating the display of the actions.<br>
	 * The update of the actions is done by calling the _initMainContainer function.
	 * @param {boolean} technical Flag meaning if the technical actions should be showed or not.
	 * @see scm_ticketActions#_initMainContainer
	 * @since 1.0
	 */
	updateHeaders:function(technical){
		this._initMainContainer(true, technical);
	},
	/**
	 * Function called when the user clicks on tan action.<br>
	 * This function will change the background color of the selected action and fire an event that will be observed by the main application.
	 * @param {JSon} action The clicked action.
	 * @since 1.0
	 */
	_actionSelectedEvent:function(action){
		var lookupId;
		if (this.selectedAction){
			lookupId = '[id="SCM_ticketAction_id_'+ this.selectedAction +'"]';	
			if(this.container.down(lookupId))
				this.container.down(lookupId).removeClassName('SCM_ticketAction_actionSelected');
			this.selectedAction = action.TicketActionId;	
		}
		this.selectedAction = action.TicketActionId;
		lookupId = '[id="SCM_ticketAction_id_'+ this.selectedAction +'"]';
		var element = this.container.down(lookupId).addClassName('SCM_ticketAction_actionSelected');
		
		document.fire('EWS:scm_viewPreviousAction', {action:action});
	},
	/**
	 * Function called when the user clicks on the "Send to sent box" link (only available if not read only).<br>
	 * This function just fire an event that will be observed by the main application.
	 * @param {JSon} action The clicked action.
	 * @since 1.0
	 */
	_copyToEvent:function(action){
		document.fire('EWS:scm_copyToSendBox', {action:action});
	},
	/**
	 * Function in charge of showing/hiding the content of an action group.<br>
	 * This function use a class to hide the group content. The header will still be visible.
	 * @param {String} groupName The group id (needed to know if the group is the description or solution, or if a normal group). This descriptor will be used to retrieve the group content div as it was used to generate a unique id for the div containing the group. 
	 * @param {JSon} actionGroup The action group.
	 * @param {String} iconContainer not used anymore, based on the "open" value of the JSon object representing the group.
	 * @since 1.0
	 */
	_openCloseTicketActionGroup:function(groupName, actionGroup, iconContainer){
		var iconContainer = this.container.down('[id="ticketAction_'+ groupName +'"]');
		var linkedContainer = this.container.down('[id="ticketActionGroup_'+ groupName +'"]');
		var headerContainer = this.container.down('[id="ticketAction_header_'+ groupName +'"]');
		if (actionGroup.open == true){
			headerContainer.addClassName('SCM_ticketAction_header_closed');
			iconContainer.removeClassName('application_rounded_minimize');
			iconContainer.addClassName('application_rounded_maximize');
			actionGroup.open = false;
			linkedContainer.addClassName('SCM_ticket_screen_hidden');
			return;
		}
		if (actionGroup.open == false){
			headerContainer.removeClassName('SCM_ticketAction_header_closed');
			iconContainer.addClassName('application_rounded_minimize');
			iconContainer.removeClassName('application_rounded_maximize');
			actionGroup.open = true;
			linkedContainer.removeClassName('SCM_ticket_screen_hidden');
			return;

		}
	},
	/**
	 * Function in charge of limiting the length of a string and add "..." if the text is longer.
	 * @param {String} originalValue The text to trim.
	 * @param {int} maxLen The maximum length of the text desired.
	 * @return {JSon} A JSon object containing:<ul>
	 * 	<li>origValue: the original text</li>
	 * 	<li>trimmedValue: The trimmed value of the text (might be same as the original one if the text is not longer that the maximum authorized lenght)</li>
	 * </ul>
	 * @since 1.0
	 */
	_trimText:function(originalValue, maxLen){
		if (!Object.isEmpty(originalValue)) {
			var trimmedLen = maxLen - 3;
			var values = {
				origValue: originalValue,
				trimmedValue: ''
			};
			
			originalValue.length > maxLen ? values.trimmedValue = originalValue.stripScripts().stripTags().substr(0, trimmedLen) + '...' : values.trimmedValue = originalValue;
			return values;
		}
		return 	{
					origValue	: '',
					trimmedValue: ''
				};
	}
});
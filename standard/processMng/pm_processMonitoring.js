/**
 * @author JONATHANJ
 */
var PM_processMonitoring = Class.create(CAL, /** @lends PM_processMonitoring.prototype*/{
	
	_eventListeners: null,
	
	_currentView: null,
	
	_processesList: null,
	
	_selectedIds: null,
	
	_treeViewContainer: null,
	
	_treeViewInstanceContainer: null,
	
	_calendarViewContainer: null,
	
	_listViewContainer: null,
	
	_ganttViewContainer:null,
	
	_processColorHash:null,
	
	_idToRemove:null,
	
	_unselectedIds:null,
	
	_filterContainer:null,
	
	_filterOptions: null,
	
	_filterText: null,
	
	_filterIsShowed: null,
	
	_realRun: null,
	
	_filteringHash:null,
	
	_arrayOfSelection:null,
	
	_treeObject: null,
	
	_treeInstanceObject:null,
	
	_legendValues: null,
	
	_clickedProcess:null,
	
	_isInstanceDisplay:null,
	
	_JSONOtherViews: null,
	
	initialize: function($super, args){
		$super(args);
		
		//this._currentView = PM_processMonitoring.CALENDARVIEW;
		if(this._realRun == null)
			this._realRun = true;
		
		this._eventListeners = {
			treeSelectionChanged: this._treeSelectionChangedListener.bindAsEventListener(this),
			treeSearchChanged	: this._treeSearchChangedListener.bindAsEventListener(this)
		};
	},
	
	run: function($super, args){
		$super(args);	
		
		this.updateTitle('<h2>'+global.getLabel('PM_MONITORING')+'</h2>');	
		
		this._calendarViewContainer = this.virtualHtml.down('[id="CAL_table"]');
		
		this.controls.setStyle({
			marginTop: '55px'
		});
		
		this._isInstanceDisplay = false;	
		this._JSONOtherViews = {valid:false};
		
		
		if (this._realRun) {
			this._calendarViewContainer.addClassName('PM_hidden');
			this._backend_getPreference();			
		}
		
		if(this.calendarContainer.down('[id="applicationCAL_filterDiv"]')){
			this.calendarContainer.down('[id="applicationCAL_filterDiv"]').remove();
		}
		
		//Prepare listeners
		document.observe('EWS:PM_treeSelectionChanged', this._eventListeners.treeSelectionChanged);
		document.observe('EWS:PM_treeSearchChanged', this._eventListeners.treeSearchChanged);
	},
	
	close: function($super){
		$super();
	},
	



/*---------------------------------------------------------------------------------------------
 * CALENDAR RELATED FUNCTIONS
 *--------------------------------------------------------------------------------------------*/

/* -- BACKEND CALLS -- */

	_backend_getPreference:function(){
		var xml = '<EWS><SERVICE>PM_GET_PREF</SERVICE><PARAM></PARAM><DEL></DEL></EWS>';		
		this.makeAJAXrequest($H( {
			xml             : xml,
			successMethod   : this.retrievePreferences.bind(this)
		}));		
	},
	
	_backend_getProcesses:function(arrayOfIds){
		if(arrayOfIds == null) return;
		if(arrayOfIds.size() == 0) return;
		
		var makeCall = true;
		this._buildFilterOptions();
		
		var begda = this.cal.calendarBounds.begda.toString('yyyy-MM-dd');
		var endda = this.cal.calendarBounds.endda.toString('yyyy-MM-dd');
		
		var serviceToCall = '';
		var callBackMethod = '';
		switch(this._currentView){
			case PM_processMonitoring.CALENDARVIEW:
				serviceToCall = 'PM_GET_CALD';
				callBackMethod = this.retrieveProcessesForCalendar;
				break;
			case PM_processMonitoring.TREEVIEW:
			
				if (this._JSONOtherViews != null && this._JSONOtherViews.valid == true) {
					makeCall = false;
					this.retrieveProcessesForTree(this._JSONOtherViews.json, false);
				} else {
					var dataMonth = this.selectMonths.selectedIndex;
					var dataYear = this.selectYears.value;
					
					var tempDate = new Date();
					tempDate.setMonth(dataMonth);
					tempDate.setYear(dataYear);
					
					tempDate.moveToFirstDayOfMonth();
					begda = tempDate.toString('yyyy-MM-dd');
					tempDate.moveToLastDayOfMonth();
					endda = tempDate.toString('yyyy-MM-dd');
					
					serviceToCall = 'PM_GET_TREE';
					callBackMethod = this.retrieveProcessesForTree;
				}
				break;
			case PM_processMonitoring.LISTVIEW:
				if (this._JSONOtherViews != null && this._JSONOtherViews.valid == true) {
					makeCall = false;
					this.retrieveProcessesForList(this._JSONOtherViews.json, false);
				} else {
				
					var dataMonth = this.selectMonths.selectedIndex;
					var dataYear = this.selectYears.value;
					
					var tempDate = new Date();
					tempDate.setMonth(dataMonth);
					tempDate.setYear(dataYear);
					
					tempDate.moveToFirstDayOfMonth();
					begda = tempDate.toString('yyyy-MM-dd');
					tempDate.moveToLastDayOfMonth();
					endda = tempDate.toString('yyyy-MM-dd');
					
					serviceToCall = 'PM_GET_TREE';
					callBackMethod = this.retrieveProcessesForList;
				}
				break;
			case PM_processMonitoring.GANTVIEW:
				if (this._JSONOtherViews != null && this._JSONOtherViews.valid == true) {
					makeCall = false;
					this.retrieveProcessesForGant(this._JSONOtherViews.json, false);
				} else {
				
					var dataMonth = this.selectMonths.selectedIndex;
					var dataYear = this.selectYears.value;
					
					var tempDate = new Date();
					tempDate.setMonth(dataMonth);
					tempDate.setYear(dataYear);
					
					tempDate.moveToFirstDayOfMonth();
					begda = tempDate.toString('yyyy-MM-dd');
					tempDate.moveToLastDayOfMonth();
					endda = tempDate.toString('yyyy-MM-dd');
					
					serviceToCall = 'PM_GET_TREE';
					callBackMethod = this.retrieveProcessesForGant;
				}
				break;
		}
		if (makeCall) {
			var xml = '<EWS>' +'<SERVICE>' +serviceToCall +'</SERVICE>' +
						'<PARAM>' +
							'<I_START_DATE>' +begda +'</I_START_DATE>' +
							'<I_END_DATE>' +endda +'</I_END_DATE>' +
							'<I_T_ATTRIBUTE>';
			
			var arrayOfXML = $A();
			arrayOfIds.each(function(select){
				if (select.att_parent_val == null) {
					select.att_parent_val = '';
				}
				arrayOfXML.push('<yglui_str_pm_attribute_in att_id="' + select.att_id + '" att_level="' + select.att_level + '" att_param="' + select.att_param + '" att_parent_val="' + select.att_parent_val + '" att_parent_id="' + select.att_parentId + '" att_value="' + select.att_value + '" />');
			});
			
			var arrayOfXML = arrayOfXML.uniq();
			
			arrayOfXML.each(function(arrayElem){
				xml += arrayElem;
			})
			xml += '</I_T_ATTRIBUTE>' +
			'<I_T_FILTER>';
			this._filteringHash.each(function(filter){
				xml += '<yglui_str_pm_filter fieldname="' + filter.key + '" filter_tag="" seqnr="">' +
				'<filter_val>'
				filter.value.each(function(filterVal){
					xml += '<yglui_str_pm_filter_value checked="" filter_tag="" seqnr="" value="' + filterVal + '"></yglui_str_pm_filter_value>'
				})
				xml += '</filter_val>' +
				'</yglui_str_pm_filter>'
			}, this);
			
			xml += '</I_T_FILTER>' +'</PARAM>' +'<DEL/>' +'</EWS>';
			
			this.makeAJAXrequest($H({
				xml: xml,
				successMethod: callBackMethod.bind(this)
			}));
		}
	},
	
	_backend_getFilterForCalendar:function(){
		var xml = '<EWS><SERVICE>PM_GET_FILTER</SERVICE><PARAM></PARAM><DEL></DEL></EWS>';

		this.makeAJAXrequest($H( {
			xml             : xml,
			successMethod   : this.retrieveFilterOptions.bind(this)
		}));		
	},
	
	_backend_setView:function(){
		var xml = '<EWS><SERVICE>PM_SET_VIEW</SERVICE><PARAM><I_VIEW>'+ this._currentView +'</I_VIEW></PARAM><DEL></DEL></EWS>';
		
		this.makeAJAXrequest($H( {
			xml             : xml,
			successMethod   : this.viewSet.bind(this)
		}));	
	},
	
	_backend_getLegendList:function(){
		var xml = '<EWS><SERVICE>PM_GET_LEGEND</SERVICE><PARAM></PARAM><DEL/></EWS>';
		
		this.makeAJAXrequest($H( {
			xml             : xml,
			successMethod   : this.retrieveLegendList.bind(this)
		}));		
	},
	
	_backend_getDetails:function(){
		this._clickedProcess = $A(arguments)[1].event;
		var xml = '<EWS>'+
 					'<SERVICE>GET_CON_ACTIO</SERVICE>'+
 					'<PARAM>'+
  						'<CONTAINER>PM_MONIT</CONTAINER>'+
  						'<MENU_TYPE>N</MENU_TYPE>'+
   						'<A_SCREEN></A_SCREEN>'+
 					'</PARAM>'+
 					'<DEL/>'+
				  '</EWS>';
		this.makeAJAXrequest($H( {
					xml             : xml,
					successMethod   : this.showContextualAction.bind(this)
				}));	
	},
	
	_backend_getInstanceTree:function(id){
		var xml = '<EWS>' +
				  	'<SERVICE>PM_GET_TREE</SERVICE>' +
				 	'<PARAM>' +
				  		'<I_START_DATE></I_START_DATE>' +
				  		'<I_END_DATE></I_END_DATE>' +
				  		'<I_T_ATTRIBUTE>' +
				 		'</I_T_ATTRIBUTE>' +
				 		'<I_T_FILTER>' +
				 		'</I_T_FILTER>' +
				 		'<I_T_INSTANCE_LIST>' +
				   			'<YGLUI_STR_PM_INSTANCE_ID instance_id="'+id+'" />' +    
						'</I_T_INSTANCE_LIST>' +
				 	'</PARAM>' +
				 	'<DEL/>' +
				  '</EWS>';
				  
		this.makeAJAXrequest($H( {
					xml             : xml,
					successMethod   : this._buildInstanceTree.bind(this)
				}));	
	},	
	

	
/*-- RESPONDER FUNCTIONS -- */

	_buildInstanceTree:function(JSON){	
	
		this._isInstanceDisplay = true;
		
		if(this.virtualHtml.down('[id="PM_spoolDiv"]')){
			this.virtualHtml.down('[id="PM_spoolDiv"]').remove();
		}
				
		if (JSON.EWS.o_t_treeview == null) {
			this._treeViewInstanceContainer.update('<div class="PM_treeEmptyText">'+global.getLabel('PM_TREE_EMPTY')+'</div>');
			return;
		}
				
		if (JSON.EWS.o_t_treeview && JSON.EWS.o_t_treeview.yglui_str_pm_data_treeview) {
			JSON.EWS.o_t_treeview.yglui_str_pm_data_treeview['@att_id'] = this._clickedProcess.readAttribute('group');
			var treeInstanceDataArray = objectToArray(JSON.EWS.o_t_treeview.yglui_str_pm_data_treeview);
			this._treeInstanceObject = new PM_processMonitoringTree(this, this._treeViewInstanceContainer);
			
			this._treeInstanceObject._buildLinedTreeLayout(treeInstanceDataArray, JSON.EWS.o_max_level, true);
		}

		 var json = {
            elements:[],
            defaultButtonClassName:'PM_grouping_button'            
        };
        var btnClose =   {
            label: global.getLabel('PM_CLOSE'),
            idButton:'PM_button_close',
            className:'PM_grouping_button',
            handlerContext: null,
            handler: this.closeInstanceView.bind(this),
            type: 'button',
            standardButton:true
        };
		json.elements.push(btnClose);
		
		this._treeViewInstanceContainer.insert(new megaButtonDisplayer(json).getButton('PM_button_close'));
	},
	
	
	retrievePreferences:function(JSON){
		this.initializeApplication(JSON.EWS.o_view);	
	},
	
	retrieveProcessesForCalendar:function(JSON){
		if(JSON.EWS.o_instance_list && JSON.EWS.o_instance_list.yglui_str_pm_instance_list){
			this._processesList = objectToArray(JSON.EWS.o_instance_list.yglui_str_pm_instance_list);
			if(Object.isUndefined(this._hashOfProcess) || this._hashOfProcess == null)
				this._hashOfProcess = $H();
			this._buildDisplayOfProcesses();
		}
	},
	
	retrieveFilterOptions:function(JSON){
		var filterOptions = objectToArray(JSON.EWS.o_i_filter.yglui_str_pm_filter);
		this._createFilterOptions(filterOptions);
		this._createFilterDisplay();
	},
	
	retrieveLegendList:function(JSON){
		var legendList = objectToArray(JSON.EWS.o_i_legend.yglui_str_pm_legend);
		this._addLegendView(legendList);
	},
	
	retrieveProcessesForTree:function(JSON, storeJson){	
		if (storeJson != false) {
			this._JSONOtherViews = {
				json: JSON,
				time: new Date(),
				valid: true
			};
		}
		
		if (JSON.EWS.o_t_treeview == null) {
			this._treeViewContainer.update('<div class="PM_treeEmptyText">'+global.getLabel('PM_TREE_EMPTY')+'</div>');
			return;
		}

		if (JSON.EWS.o_t_treeview && JSON.EWS.o_t_treeview.yglui_str_pm_data_treeview) {
			var treeGroupDataArray = objectToArray(JSON.EWS.o_t_treeview.yglui_str_pm_data_treeview);
		}
		this._treeObject = new PM_processMonitoringTree(this, this._treeViewContainer);

		this._treeObject._buildLinedTreeLayout(treeGroupDataArray, JSON.EWS.o_max_level, false);//_buildTreeGroupLayout(treeGroupDataArray);	//	

//		this._treeObject._buildTreeGroupLayout(treeGroupDataArray);//	_buildLinedTreeLayout(treeGroupDataArray);	//

		
	},
	
	retrieveProcessesForList:function(JSON, storeJson){	
		if (storeJson != false) {
			this._JSONOtherViews = {
				json: JSON,
				time: new Date(),
				valid: true
			};
		}	
		
		if (JSON.EWS.o_t_treeview == null) {
			this._listViewContainer.update('<div class="PM_treeEmptyText">'+global.getLabel('PM_TREE_EMPTY')+'</div>');
			return;
		}
		if (JSON.EWS.o_t_treeview && JSON.EWS.o_t_treeview.yglui_str_pm_data_treeview) {
			var treeGroupDataArray = objectToArray(JSON.EWS.o_t_treeview.yglui_str_pm_data_treeview);
		}
		this._treeInstanceObject = new PM_processMonitoringList(this, this._listViewContainer);
		this._treeInstanceObject._buildListView(treeGroupDataArray);
	
	},
	
	retrieveProcessesForGant:function(JSON, storeJson){
		if (storeJson != false) {
			this._JSONOtherViews = {
				json: JSON,
				time: new Date(),
				valid: true
			};
		}
		if (JSON.EWS.o_t_treeview == null) {
			this._ganttViewContainer.removeClassName('PM_processGantViewContainer');
			this._ganttViewContainer.update('<div class="PM_treeEmptyText">'+global.getLabel('PM_TREE_EMPTY')+'</div>');
		} else {
			this._ganttViewContainer.update('');
			this._ganttViewContainer.addClassName('PM_processGantViewContainer');
			var gantt = new PM_processMonitoringGantt(this, this._ganttViewContainer);
			if (JSON.EWS.o_t_treeview && JSON.EWS.o_t_treeview.yglui_str_pm_data_treeview) {
				gantt.buildGantt(objectToArray(JSON.EWS.o_t_treeview.yglui_str_pm_data_treeview))
				if(this._ganttViewContainer.down('.panelErrors').getStyle('display') != 'none'){
					this._ganttViewContainer.removeClassName('PM_processGantViewContainer');
					this._ganttViewContainer.update('Error while generating the Gantt');
				}
			}
		}
	},
	
	showContextualAction:function(JSON){
		var baloonContent = new Element('div');
		objectToArray(JSON.EWS.o_actions).each(function(action){
			var link = new Element('div',{'class':'application_action_link'}).update(action.yglui_vie_tty_ac['@actiot']);			
			baloonContent.insert(link);
			link.observe('click', this._contextualActionListener.bindAsEventListener(this,{id:parseInt(this._clickedProcess.readAttribute('instance'),10)}));
		},this)
		this._balloon = new Balloon();
		//this._clickedProcess.id
		this._balloon.setOptions($H({
                    domId: this._clickedProcess.id,
                    content: baloonContent,
                    dinamicWidth: 200
                }));

        this._balloon.show();
	},
	
	viewSet:function(JSON){
		
	},
/*-- EVENT LISTENERS --*/

	_contextualActionListener:function(args){
		this._balloon.hide();
		if ($A(arguments)[1].id) {
			this._backend_getInstanceTree($A(arguments)[1].id);
			this._calendarViewContainer.addClassName('PM_hidden');
			this._treeViewInstanceContainer.removeClassName('PM_hidden');
		}
	},
	_treeSelectionChangedListener:function(args){
		this._JSONOtherViews.valid = false;

		this._selectedIds = args.memo.selection;
		var leavesLevel   = args.memo.leavesLevel;
		
		this._arrayOfSelection = $A();
		if(this._selectedIds.size() > 0){
			switch(this._currentView){
				case PM_processMonitoring.CALENDARVIEW:
					
					this._selectedIds.each(function(select){
						this._arrayOfSelection = this._arrayOfSelection.concat(select.value);
					}, this);
					if(this._arrayOfSelection.size() > 0)
						this._backend_getProcesses(this._arrayOfSelection);	
					break;
				case PM_processMonitoring.TREEVIEW:
					this._arrayOfSelection = $A();
					this._selectedIds.each(function(select){
						this._arrayOfSelection = this._arrayOfSelection.concat(select.value);
					}, this);
					this._treeViewContainer.update('<div class="PM_treeEmptyText"><img src="css/images/autocompleter/autocompleter-ajax-loader.gif" /><span style="padding-left:10px;">'+global.getLabel('PM_LOADING')+'</span></div>');
					this._backend_getProcesses(this._arrayOfSelection);
					break;
				case PM_processMonitoring.LISTVIEW:
					this._arrayOfSelection = $A();
					this._selectedIds.each(function(select){
						this._arrayOfSelection = this._arrayOfSelection.concat(select.value);
					}, this);
					this._listViewContainer.update('<div class="PM_treeEmptyText"><img src="css/images/autocompleter/autocompleter-ajax-loader.gif" /><span style="padding-left:10px;">'+global.getLabel('PM_LOADING')+'</span></div>');
					this._backend_getProcesses(this._arrayOfSelection);
					break;			
				case PM_processMonitoring.GANTVIEW:
					this._arrayOfSelection = $A();
					this._selectedIds.each(function(select){
						this._arrayOfSelection = this._arrayOfSelection.concat(select.value);
					}, this);
					this._ganttViewContainer.update('<div class="PM_treeEmptyText"><img src="css/images/autocompleter/autocompleter-ajax-loader.gif" /><span style="padding-left:10px;">'+global.getLabel('PM_LOADING')+'</span></div>');
					this._backend_getProcesses(this._arrayOfSelection);
					break;					
			}
			this._showFilter();
		}else{
			this._treeViewContainer.update('<div class="PM_treeEmptyText">'+global.getLabel('PM_TREE_EMPTY')+'</div>');
			this._listViewContainer.update('<div class="PM_treeEmptyText">'+global.getLabel('PM_TREE_EMPTY')+'</div>');
			this._ganttViewContainer.update('<div class="PM_treeEmptyText">'+global.getLabel('PM_TREE_EMPTY')+'</div>');
			this._hideFilter();
		}
		this._removeProcessesFromCalendar(args.memo.unselection);

//        this.resizeSelectionDiv();
        		
		this._treeViewInstanceContainer.update('<div class="PM_treeEmptyText"><img src="css/images/autocompleter/autocompleter-ajax-loader.gif" /><span style="padding-left:10px;">'+global.getLabel('PM_LOADING')+'</span></div>');
        this._treeViewInstanceContainer.addClassName('PM_hidden');
		
		if(this._currentView == PM_processMonitoring.CALENDARVIEW){
			this._calendarViewContainer.removeClassName('PM_hidden');
		}else if(this._currentView == PM_processMonitoring.TREEVIEW){
			this._treeViewContainer.removeClassName('PM_hidden');
		}else if(this._currentView == PM_processMonitoring.LISTVIEW){
			this._listViewContainer.removeClassName('PM_hidden');
		}else if(this._currentView == PM_processMonitoring.GANTVIEW){
			this._ganttViewContainer.removeClassName('PM_hidden');
		}
		
		if(this.virtualHtml.down('[id="PM_spoolDiv"]')){
			this.virtualHtml.down('[id="PM_spoolDiv"]').remove();
		}
		//this.resizeSelectionDiv();
		//this.updateRenderedEvents();				
				
	},
	
	_treeSearchChangedListener:function(args){
		if (args.memo.groupingChanged) {	
			
			this._JSONOtherViews.valid = false;
			
			this.eventsReceived = new Hash();
		
			this.renderEmpty();
			this.initCalendarMatrix();
			
			this._hashOfProcess = $H();
			if(this._treeViewContainer)
				this._treeViewContainer.update('<div class="PM_treeEmptyText">'+global.getLabel('PM_TREE_EMPTY')+'</div>');
			if(this._listViewContainer)
				this._listViewContainer.update('<div class="PM_treeEmptyText">'+global.getLabel('PM_TREE_EMPTY')+'</div>');
				
			
		}
	},

	closeInstanceView:function(event){
		this._isInstanceDisplay = false;
		this._calendarViewContainer.removeClassName('PM_hidden');
		this._treeViewInstanceContainer.addClassName('PM_hidden');
		this._treeViewInstanceContainer.update('<div class="PM_treeEmptyText"><img src="css/images/autocompleter/autocompleter-ajax-loader.gif" /><span style="padding-left:10px;">'+global.getLabel('PM_LOADING')+'</span></div>');
		if(this.virtualHtml.down('[id="PM_spoolDiv"]')){
			this.virtualHtml.down('[id="PM_spoolDiv"]').remove();
		}
	},
/*-- Other functions --*/

	initializeApplication:function(pref){	
		
		this._currentView = pref;
		//this._currentView = 'L';
		
		this._selectedIds = $A();
		this._idToRemove = $A();
		this._filterOptions = $H();
		this._filterIsShowed = false;
		
		this._addChangeView();
		this._addFilterContainer();
		
		this._addTreeViewDiv();
		this._addListViewDiv();
		this._addGantViewDiv();
		this._addLegendViewDiv();
		
		if (this.virtualHtml.down('[id="CAL_infoText"]')) 
			this.virtualHtml.down('[id="CAL_infoText"]').update(global.getLabel('PM_CALTEXT'));
			
		this._realRun = false;
					
		switch(this._currentView){
			case PM_processMonitoring.CALENDARVIEW:
				this._changeView({view:(PM_processMonitoring.CALENDARVIEW)});
				break;
			case PM_processMonitoring.TREEVIEW:
				this._changeView({view:(PM_processMonitoring.TREEVIEW)});
				break;
			case PM_processMonitoring.LISTVIEW:
				this._changeView({view:(PM_processMonitoring.LISTVIEW)});
				break;	
			case PM_processMonitoring.GANTVIEW:
				this._changeView({view:(PM_processMonitoring.GANTVIEW)});
				break;				
		}	
		
	},
	
	_addListViewDiv:function(){
		this._listViewContainer = new Element('div',{'id':'PM_processListViewContainer', 'class':'PM_hidden PM_processListViewContainer'});
		this.virtualHtml.down('[id="CAL_tableContainer"]').insert({after:this._listViewContainer});
		this._listViewContainer.insert(global.getLabel('PM_TREE_EMPTY'));
	},
	
	_addGantViewDiv:function(){
		this._ganttViewContainer = new Element('div',{'id':'PM_processListGantContainer', 'class':'PM_hidden'});
		this._calendarViewContainer.insert({after:this._ganttViewContainer});
		this._ganttViewContainer.insert(global.getLabel('PM_TREE_EMPTY'));
	},

	_removeExistingId:function(hash){
		hash.keys().each(function(key){
			if(!Object.isUndefined(this._hashOfProcess) && !Object.isUndefined(this._hashOfProcess.get(key)))
				this._selectedIds.unset(parseInt(key,10));
		},this);
	},

	_createFilterOptions:function(options){
		options.each(function(option){
			var opt ={
				fieldname: option['@fieldname'],
				filter_tag: option['@filter_tag'],
				seqnr: option['@seqnr'],
				values: objectToArray(option.filter_val.yglui_str_pm_filter_value).sortBy(function(s){return parseInt(s['@seqnr'],10)})
			}
			this._filterOptions.set(parseInt(option['@seqnr'],10), opt);	
		}, this);
	},
	
	_createFilterDisplay:function(){
		var filterTable = new Element('table', {'id':'PM_filterTable', 'cellspacing':'0', 'cellpadding':'0'});
		var nbrOfColumns = 0;
		nbrOfColumns = parseInt(this._filterOptions.keys().sort()[this._filterOptions.keys().size()-1], 10);
		var nbrOfLines = 0;
		
		this._filterOptions.each(function(filterOpt){
			var nbrOpt =  filterOpt.value.values.size();
			if(nbrOpt > nbrOfLines)
				nbrOfLines = nbrOpt;
		}, this);
		
		var headerLine = new Element('thead');
		
		var header = '<tr>';
		for (j = 0; j < nbrOfColumns; j++) {
			value = global.getLabel(this._filterOptions.get(j+1).filter_tag);
			header+= '<th class="PM_filterHeaderText">'+ value +'</th>';
		}
		header += '</tr>';
		
		headerLine.insert(header);
		
		var tableBody = new Element('tbody');
		for(i=0; i < nbrOfLines; i++){
			var tr = new Element('tr');
			for(j=0; j<nbrOfColumns; j++){
				var value = '';
				var checkbox = '';
				try{
					value = global.getLabel(this._filterOptions.get(j+1).values[i]['@filter_tag']);
					checkbox = '<input type="checkbox" id="filterCheckBox_'+ this._filterOptions.get(j+1).values[i]['@value'] + '"';
						
					if(this._filterOptions.get(j+1).values[i]['@checked'] != ''){
						checkbox += ' checked="X"';
					}
					
					checkbox +=  '/>'
				}catch(e){}
				var td = '<td>'+ checkbox + value +'</td>'
				tr.insert(td);
			}
			tableBody.insert(tr);
		}	
		filterTable.insert(headerLine);
		filterTable.insert(tableBody);
		
		this._filterContainer.insert(filterTable);
		
		 var json = {
            elements:[],
            defaultButtonClassName:'PM_grouping_button'            
        };
        var btnRefresh =   {
            label: global.getLabel('PM_REFRESH'),
            idButton:'PM_button_refresh',
            className:'PM_grouping_button',
            handlerContext: null,
            handler: this.handlerButtonRefresh.bind(this),
            type: 'button',
            standardButton:true
        };
		json.elements.push(btnRefresh);
		
		this._filterContainer.insert(new megaButtonDisplayer(json).getButton('PM_button_refresh'));
	},
	
	handlerButtonRefresh:function(event){
		this._JSONOtherViews.valid = false;
		
		this.eventsReceived = new Hash();
		this.renderEmpty();
		this.initCalendarMatrix();
		
		this._hashOfProcess = $H();
		this._backend_getProcesses(this._arrayOfSelection);
	},
	
	_buildFilterOptions:function(){
		this._filteringHash = $H();
		var nbrOfColumns = 0;
		nbrOfColumns = parseInt(this._filterOptions.keys().sort()[this._filterOptions.keys().size()-1], 10);
		var nbrOfLines = 0;
		
		this._filterOptions.each(function(filterOpt){
			var nbrOpt =  filterOpt.value.values.size();
			if(nbrOpt > nbrOfLines)
				nbrOfLines = nbrOpt;
		}, this);
		
		for (i = 0; i < nbrOfLines; i++) {
			for (j = 0; j < nbrOfColumns; j++) {
				if(Object.isUndefined(this._filteringHash.get(this._filterOptions.get(j+1).fieldname)))
					this._filteringHash.set(this._filterOptions.get(j+1).fieldname, $A());
				try {
					var check = this._filterContainer.down('[id="filterCheckBox_' + this._filterOptions.get(j + 1).values[i]['@value'] + '"]');
					if (!Object.isUndefined(check)) {
						if (check.checked == true) {
							this._filteringHash.get(this._filterOptions.get(j + 1).fieldname).push(this._filterOptions.get(j + 1).values[i]['@value']);
						}
					}
				}catch(e){}
			}
		}
	},
	
	_addChangeView:function(){
		var calendarClass;
		var treeClass;
		var listClass
		var gantViewClass;
		switch(this._currentView){
			case PM_processMonitoring.CALENDARVIEW:
				calendarClass = 'PM_viewCalendarLeftSelected';
				treeClass = 'PM_viewTreeRight';
				listClass = 'PM_viewListCenter';
				gantViewClass = 'PM_viewGanttCenter';
				break;
			case PM_processMonitoring.TREEVIEW:
				calendarClass = 'PM_viewCalendarLeft';
				treeClass = 'PM_viewTreeRightSelected';
				listClass = 'PM_viewListCenter';
				gantViewClass = 'PM_viewGanttCenter';
				break;
			case PM_processMonitoring.LISTVIEW:
				calendarClass = 'PM_viewCalendarLeft';
				treeClass = 'PM_viewTreeRight';
				listClass = 'PM_viewListCenterSelected';
				gantViewClass =  'PM_viewGanttCenter';
				break;
			case PM_processMonitoring.GANTVIEW:
				calendarClass = 'PM_viewCalendarLeft';
				treeClass = 'PM_viewTreeRight';
				listClass = 'PM_viewListCenter';
				gantViewClass = 'PM_viewGanttCenterSelected';
				break;
		}	
		
		if (Object.isUndefined(this.virtualHtml.down('[id="PM_changeView"]'))) {
			var changeDiv = new Element('div', {
				'class': 'PM_changeViewDiv',
				'id': 'PM_changeView'
			});
			changeDiv.insert(global.getLabel('PM_SELVIEW') + '<br/>');
			
			this._calendarViewButton = new Element('div', {
				'class': calendarClass+ ' PM_viewSwitcher',
				'id': 'PM_calendarView'
			});
			this._calendarViewButton.observe('click', this._changeView.bindAsEventListener(this, {view:(PM_processMonitoring.CALENDARVIEW)}));
		

			this._gridViewButton = new Element('div', {
				'class': listClass+ ' PM_viewSwitcher',
				'id': 'PM_gridView'
			});
			
			this._gridViewButton.observe('click', this._changeView.bindAsEventListener(this, {view:(PM_processMonitoring.LISTVIEW)}));
		
			this._gantViewButton = new Element('div', {
				'class': gantViewClass + ' PM_viewSwitcher',
				'id': 'PM_gantView'
			});

			this._gantViewButton.observe('click', this._changeView.bindAsEventListener(this, {view:(PM_processMonitoring.GANTVIEW)}));
		
			this._treeViewButton = new Element('div', {
				'class': treeClass+' PM_viewSwitcher',
				'id': 'PM_treeView'
			});
			
			this._treeViewButton.observe('click', this._changeView.bindAsEventListener(this, {view:(PM_processMonitoring.TREEVIEW)}));
			
			
			changeDiv.insert(this._treeViewButton);
			changeDiv.insert(this._gantViewButton);			
			changeDiv.insert(this._gridViewButton);
			changeDiv.insert(this._calendarViewButton);
			
			this.virtualHtml.down('.application_main_title_div',0).insert({
				after: changeDiv
			});
		}
	},
	
	_changeView:function(args){
		var view;
		try {
			view = $A(arguments)[1].view;
		} catch (e) {
			view = args.view;
		}
		this._changeViewIcons(this._currentView, view);
		this._changeDisplayedView(this._currentView, view);
		this._currentView = view;
		this._backend_setView();
		this._backend_getProcesses(this._arrayOfSelection);
	},
	
	_changeDisplayedView:function(oldView, newView){
		if(this.virtualHtml.down('[id="PM_spoolDiv"]')){
			this.virtualHtml.down('[id="PM_spoolDiv"]').remove();
		}		
		switch(oldView){
			case PM_processMonitoring.CALENDARVIEW:
				this._calendarViewContainer.addClassName('PM_hidden');
				this._treeViewInstanceContainer.addClassName('PM_hidden');
				break;
			case PM_processMonitoring.TREEVIEW:
				this._treeViewContainer.addClassName('PM_hidden');				
				break;
			case PM_processMonitoring.LISTVIEW:
				this._listViewContainer.addClassName('PM_hidden');				
				break;
			case PM_processMonitoring.GANTVIEW:
				this._ganttViewContainer.addClassName('PM_hidden');				
				break;				
		}
		switch(newView){
			case PM_processMonitoring.CALENDARVIEW:
				if(this._isInstanceDisplay == false)
					this._calendarViewContainer.removeClassName('PM_hidden');
				else
					this._treeViewInstanceContainer.removeClassName('PM_hidden');
				break;
			case PM_processMonitoring.TREEVIEW:
				this._treeViewContainer.removeClassName('PM_hidden');
				break;
			case PM_processMonitoring.LISTVIEW:
				this._listViewContainer.removeClassName('PM_hidden');				
				break;		
			case PM_processMonitoring.GANTVIEW:
				this._ganttViewContainer.removeClassName('PM_hidden');				
				break;			
		}
	},
	
	_changeViewIcons:function(oldView, newView){
		switch(oldView){
			case PM_processMonitoring.CALENDARVIEW:
				this._calendarViewButton.addClassName('PM_viewCalendarLeft');
				this._calendarViewButton.removeClassName('PM_viewCalendarLeftSelected');
				break;
			case PM_processMonitoring.TREEVIEW:
				this._treeViewButton.addClassName('PM_viewTreeRight');
				this._treeViewButton.removeClassName('PM_viewTreeRightSelected');
				break;
			case PM_processMonitoring.LISTVIEW:
				this._gridViewButton.addClassName('PM_viewListCenter');
				this._gridViewButton.removeClassName('PM_viewListCenterSelected');
				break;
			case PM_processMonitoring.GANTVIEW:
				this._gantViewButton.addClassName('PM_viewGanttCenter');
				this._gantViewButton.removeClassName('PM_viewGanttCenterSelected');
				break;
		}
		switch(newView){
			case PM_processMonitoring.CALENDARVIEW:
				this._calendarViewButton.addClassName('PM_viewCalendarLeftSelected');
				this._calendarViewButton.removeClassName('PM_viewCalendarLeft');
				break;
			case PM_processMonitoring.TREEVIEW:
				this._treeViewButton.addClassName('PM_viewTreeRightSelected');
				this._treeViewButton.removeClassName('PM_viewTreeRight');
				break;
			case PM_processMonitoring.LISTVIEW:
				this._gridViewButton.addClassName('PM_viewListCenterSelected');
				this._gridViewButton.removeClassName('PM_viewListCenter');
				break;
			case PM_processMonitoring.GANTVIEW:
				this._gantViewButton.addClassName('PM_viewGanttCenterSelected');
				this._gantViewButton.removeClassName('PM_viewGanttCenter');
				break;
		}
	},
	
	
	_addLegendViewDiv: function(){		
		this._backend_getLegendList();
	},
	
	_addLegendView:function(legendList){
		this._legendValues = $H();
		var myJSONObject = {};
	 	myJSONObject.legend = $A();
		legendList.each(function(item){	
				this._legendValues.set(parseInt(item['@status']), item['@class_used']);
				var tempLine = {};   
				tempLine.img = item['@class_used'];
				tempLine.text = global.getLabel(item['@tag']);	
				myJSONObject.legend.push(tempLine);
		}, this);		    
		myJSONObject.showLabel = global.getLabel('PM_SHOWLEG');
		myJSONObject.hideLabel = global.getLabel('PM_HIDELEG');
		this.virtualHtml.down('[id="PM_processListViewContainer"]').insert({			
			after: getLegend(myJSONObject, 1)
		});		
		this.virtualHtml.down('[id="legend_module_contain"]').addClassName('PM_legend_view_override');
		var legendRows = this.virtualHtml.down('[id="legend_module_containRows"]').select('tr');
		legendRows.each(function(item){
			item.children[0].addClassName('iconPadding');
		});
				
	},
	
	_addTreeViewDiv:function(){
		if(this._treeViewContainer != null)
			return;
		this._treeViewContainer = new Element('div',{'id':'PM_processTreeViewContainer', 'class':'PM_hidden PM_treeViewContainer'});
		this._calendarViewContainer.insert({after:this._treeViewContainer});
		this._treeViewContainer.update('<div class="PM_treeEmptyText">'+global.getLabel('PM_TREE_EMPTY')+'</div>');
		
		this._treeViewInstanceContainer = new Element('div',{'id':'PM_processTreeViewInstanceContainer', 'class':'PM_treeViewContainer PM_hidden'});
		this._calendarViewContainer.insert({after:this._treeViewInstanceContainer});
		this._treeViewInstanceContainer.update('<div class="PM_treeEmptyText"><img src="css/images/autocompleter/autocompleter-ajax-loader.gif" /><span style="padding-left:10px;">'+global.getLabel('PM_LOADING')+'</span></div>');
	},
	
	_addFilterContainer:function(){
		if(this._filterContainer != null)
			return;
		this._filterText = new Element('p', {'class':'application_action_link PM_applicationCAL_filterOptions PM_hidden' }).insert(global.getLabel('PM_SHOWFILTER'));
		this.calendarContainer.down('[id="CAL_controlsContainer"]').insert(this._filterText);
		this._filterText.observe('click', function(){
			if(this._filterIsShowed){
				this._filterContainer.addClassName('PM_hidden');
				this._filterText.update(global.getLabel('PM_SHOWFILTER'));
				this._filterIsShowed = false;
			}else{
				this._filterContainer.removeClassName('PM_hidden');
				this._filterText.update(global.getLabel('PM_HIDEFILTER'));
				this._filterIsShowed = true;
			}
		}.bind(this));
		this._filterContainer = new Element('div', {'id':'calendarFilter', 'class':'PM_hidden PM_filterContainer'});
		this.virtualHtml.down('[id="CAL_table"]').insert({before:this._filterContainer});
		this._backend_getFilterForCalendar();
	},
	
	_showFilter:function(){
		this._filterText.removeClassName('PM_hidden');
	},
	
	_hideFilter:function(){
		this._filterText.addClassName('PM_hidden');
	},
	
	_removeProcessesFromCalendar:function(array){
		array.each(function(elem){
			if( !Object.isUndefined(this._hashOfProcess) && this._hashOfProcess!= null && !Object.isUndefined(this._hashOfProcess.get(elem))){
				this._removeProcessesView(this._hashOfProcess.get(elem));
				this._hashOfProcess.unset(elem);
			}
		},this);

	},
	
	_removeProcessesView:function(array){
		array.each(function(process){
			this.removeEventFromDraw(process);
		}, this);
	},

	_buildDisplayOfProcesses:function(){
		this._processesList.each(function(process){
			if(Object.isUndefined(this._hashOfProcess.get(parseInt(process['@att_id'],10))))
				this._hashOfProcess.set(parseInt(process['@att_id'],10), $A());
			this._buildProcessDisplay(process);
		},this);
	},
	
	_buildProcessDisplay:function($super,process){
		var begda = new Date();
		var begDateArray = process['@start_date'].split('-');
		begda.setFullYear(begDateArray[0],begDateArray[1]-1,begDateArray[2]);
		var endda = new Date();
		var processEndda =''
		if(process['@end_date'] == '0000-00-00'){
			processEndda = process['@start_date']
		}else{
			processEndda = process['@end_date']
		}
		var endDateArray = processEndda.split('-');
		endda.setFullYear(endDateArray[0],endDateArray[1]-1,endDateArray[2]);
		
		var processDefinition = {
			allDay: true,
			begDate: begda,
			endDate: endda,
			text: process['@process_temptag'],
			pernr: parseInt(process['@att_id'],10),
			appId: '',
			view: '',
			id: process['@instance_id'],
			status: parseInt(process['@status'],10),
			displayed: true
		}
		
		if (!this._processIsAlreadyInHash(this._hashOfProcess.get(parseInt(process['@att_id'], 10)), processDefinition)) {
			this._hashOfProcess.get(parseInt(process['@att_id'], 10)).push(processDefinition);
		}
		

		this.addEventToDraw(processDefinition);
		this.updateRenderedEvents();		
	},
	
	_processIsAlreadyInHash:function(array, process){
		var isInArray = false;
		array.each(function(elem){
			if(elem.id == process.id){
				isInArray = true;
			}
		});
		return isInArray;
	},

/*-- REDEFINED FUNCTIONS --*/
	renderSelectionDiv:function(){
		return;
	},
	
	onMouseDownSelection: function(event){
		return;
	},
	
	
	resizeSelectionDiv: function(){
		return;
		var datesHeadersLength = this.datesHeaders.size();
        var weeksHeights = new Array();
        var tbodyHeight = this.tbody.getHeight();
        if(tbodyHeight == 0) return;
        for (var i = 0; i < datesHeadersLength; i++) {
            if (i == datesHeadersLength - 1) {
                height = tbodyHeight;
                weeksHeights.push(height);
            } else {
                var position = this.datesHeaders[i].cumulativeOffset();
                var positionNext = this.datesHeaders[i + 1].cumulativeOffset();
                var height = positionNext.top - position.top;
                weeksHeights.push(height);
                tbodyHeight -= height;
            }
        }
        var fullWidth = this.tbody.getWidth() + (Prototype.Browser.IE ? 4 : -1);		
    },

	
	getEmployee:function(id){
		return {color:global.getColor(id)};
	},
	
	renderSelectedEmployees: function(){
		this._JSONOtherViews.valid = false;
		this._backend_getProcesses(this._arrayOfSelection);
	},
	
	newEventGraphicObject: function(event) {
        var begDate = event.begDate.clone();
        var endDate = event.endDate.clone();
        //we check the event to see if it starts and ends inside te current calendar
        //as drawing will depend on it.
        var startsInThisCalendar = begDate.clone().clearTime().between(this.cal.calendarBounds.begda, this.cal.calendarBounds.endda);
        var endsInThisCalendar = endDate.clone().clearTime().isBefore(this.cal.calendarBounds.endda);
		
        var startingWeek;
        var endingWeek;
		
        if(startsInThisCalendar){
            var begda = this.cal.calendarBounds.begda.clone();
            var nextWeek = begda.clone();
            var weeksCounter = 0;
            while(!begDate.isBefore(nextWeek.add(7).days())){
                weeksCounter++;
                if(weeksCounter > this.cal.weeksNumber) {
                    weeksCounter = this.cal.weeksNumber;
                    break;
                }
            }
            startingWeek = weeksCounter;
        }else{
            startingWeek = 0;
        }
		
        if(endsInThisCalendar){
            var begda = this.cal.calendarBounds.begda.clone();
            var nextWeek = begda.clone();
            var weeksCounter = 0;
            while(!endDate.isBefore(nextWeek.add(7).days())){
                weeksCounter++;
                if(weeksCounter > this.cal.weeksNumber) {
                    weeksCounter = this.cal.weeksNumber;
                    break;
                }
            }
            //nextWeek.add(1).days();
            endingWeek = weeksCounter;
        }else{
            endingWeek = this.cal.numberOfWeeks;
        }
		
        //how many rows does this event will be drawn into
        var numberOfWeeks = endingWeek - startingWeek + 1;
        //to store all the different segments for this event.
        var eventSegments = $H();
        var eventText = event.text;
        var drawBeginning, drawEnding;
        //If the event has to be drawn in more than a calendar view, we do not get the segments
        //belonging to the previous or the next calendar view.
        if (startsInThisCalendar) {
        
            drawBeginning = event.begDate.clone();
        } else {
        
            drawBeginning = this.cal.calendarBounds.begda.clone();
        }
        if (endsInThisCalendar) {
        
            drawEnding = event.endDate.clone();
        } else {
        
            drawEnding = this.cal.calendarBounds.endda.clone();
        }
        //we get as many segments as needed for the current event, e.g. if it's 2 weeks long we get
        //2 segments.
		
        for (var i = 0; i < numberOfWeeks; i++) {
        
            var leftOff, rightOff;
            //adapt events for weeks starting on monday or sunday
            if (drawBeginning.getDay() == this.cal.firstDayOfWeek) {
            
                leftOff = 0;
            } else {
            
                leftOff = drawBeginning.getOrdinalNumber() - drawBeginning.clone().moveToDayOfWeek(this.cal.firstDayOfWeek, -1).getOrdinalNumber();
                if(leftOff < 0 ) leftOff += (Date.isLeapYear(this.cal.calendarBounds.begda.clone().getFullYear()) ? 366 : 365);
            }
            //We get how many days is the event segment far from the end of the week and how far the
            //event is from it's ending. keep the smaller one and it will be the event segment 
            //length
            var farFromEndOfWeek;
            if (drawBeginning.getDay() == this.cal.lastDayOfWeek)
                farFromEndOfWeek = 0;
            else
                farFromEndOfWeek = drawBeginning.clone().moveToDayOfWeek(this.cal.lastDayOfWeek).getOrdinalNumber() - drawBeginning.getOrdinalNumber();
            var farFromEndOfEvent = drawEnding.getOrdinalNumber() - drawBeginning.getOrdinalNumber();
            if (farFromEndOfWeek < 0) 
                farFromEndOfWeek = farFromEndOfWeek + 365;
            if (farFromEndOfEvent < 0) 
                farFromEndOfEvent = farFromEndOfEvent + 365;
            var segmentLength = farFromEndOfEvent < farFromEndOfWeek ? farFromEndOfEvent : farFromEndOfWeek;
            rightOff = 7 - segmentLength - leftOff;
            //if starts and ends in the same day, the segment length is 1, not 0	 
            segmentLength = parseInt(segmentLength) + 1;
            var color;
            if (this.getEmployee(event.pernr)) {
                color = this.getEmployee(event.pernr).color;
            }
            if(Object.isUndefined(color)) color = 0;
            if(!Object.isNumber(color)) color = 0;
            color = "eeColor" + color.toPaddedString(2);
			var eventSegment = new Element("div", {'id':'PM_cal_proc_' + event.id, 'group':event.pernr, 'instance': event.id, 'grouping':parseInt(event.status,10)});
            eventSegment.observe("click", this._backend_getDetails.bindAsEventListener(this,{event:eventSegment}));
            var pixelsWidth = 101;
            if (segmentLength > 1) {
                pixelsWidth++;
                pixelsWidth *= segmentLength;
            }
            
            if (event.allDay) {
                eventSegment.addClassName("CAL_wholeDayEventContainer");
				eventSegment.setStyle({
                    "width": pixelsWidth + "px"
                });
                var eventSegmentText = '<div class="CAL_wholeDayEventBorder ' + color + '"></div>';
                eventSegmentText += '<div class="CAL_wholeDayEventBody ' + color + '">';
                eventSegmentText += '<div class="CAL_wholeDayEventText ' + color + '">';
                var approvalClass = "";
				
				approvalClass = this._legendValues.get(parseInt(event.status,10))+ ' CAL_wholeDayEvent_icon';
														
                if(!Object.isEmpty(approvalClass))
                    //eventSegmentText += '<div class="' + approvalClass + '">&nbsp;</div>';
					eventSegmentText += '<div style="width:10px;float:left;display:block;margin-right:3px;"><div class="' + approvalClass + '">&nbsp;</div></div>';
                eventSegmentText += '<div class="CAL_acronymWrapper"><acronym title="';
                eventSegmentText += eventText;
                eventSegmentText += '" class="';
                if ((event.status == 4) || (event.status == 5) || (event.status == 6))
                    eventSegmentText += 'application_text_italic ';
                eventSegmentText += color + '">';
                eventSegmentText += eventText;
                eventSegmentText += '</acronym></div>';
                eventSegmentText += '</div>';
                eventSegmentText += '</div>';
                eventSegmentText += '<div class="CAL_wholeDayEventBorder ' + color + '">';
                eventSegment.update(eventSegmentText);
            } else if(begDate.clone().clearTime().compareTo(endDate.clone().clearTime()) != 0){
				
                eventSegment.addClassName("CAL_wholeDayEventContainer");
                eventSegment.setStyle({
                    "width": pixelsWidth + "px"
                });
                var eventSegmentText = '<div class="CAL_wholeDayEventBorder ' + color + '"></div>';
                eventSegmentText += '<div class="CAL_wholeDayEventBody CAL_nonWholeDayEventBorders application_border_color_' + color + '">';
                eventSegmentText += '<div class="CAL_wholeDayEventText">';
                var approvalClass = "";
				
				approvalClass = this._legendValues.get(parseInt(event.status,10))+ ' CAL_IE6_event';
										
                if(!Object.isEmpty(approvalClass))
                    eventSegmentText += '<div class="CAL_event_icon"><div class="' + color + ' ' + approvalClass + '">&nbsp;</div></div>';
                eventSegmentText += '<div style="float: left;">' + event.begDate.toString('HH:mm') + '&nbsp;</div>';
                eventSegmentText += '<div class="CAL_acronymWrapper"><acronym ';
                if ((event.status == 4) || (event.status == 5) || (event.status == 6))
                    eventSegmentText += 'class="application_text_italic" ';
                eventSegmentText += 'title="' + eventText + '">';
                eventSegmentText += eventText;
                eventSegmentText += '</acronym></div>';
                eventSegmentText += '</div>';
                eventSegmentText += '</div>';
                eventSegmentText += '<div class="CAL_wholeDayEventBorder ' + color + '">';
                eventSegment.update(eventSegmentText);
            }else{
                eventSegment.addClassName("CAL_eventContainer");
                eventSegment.setStyle({
                    "width": "101px"
                });
                var eventSegmentText = '<div class="CAL_eventText application_color_' + color + '">';
                var approvalClass = "";
				approvalClass = this._legendValues.get(parseInt(event.status,10))+ ' CAL_IE6_event';
				
                if(!Object.isEmpty(approvalClass))
                    eventSegmentText += '<div class="CAL_event_icon"><div class="' + color + ' ' + approvalClass + '">&nbsp;</div></div>';
                if(begDate.clone().compareTo(endDate.clone()) != 0)
                    eventText = event.begDate.toString('HH:mm') + " " + eventText;
                eventSegmentText += '<acronym ';
                if ((event.status == 4) || (event.status == 5) || (event.status == 6))
                    eventSegmentText += 'class="application_text_italic" ';
                eventSegmentText += 'title="' + eventText + '">';
                eventSegmentText += eventText;
                eventSegmentText += '</acronym>';
                eventSegmentText += '</div>';
                eventSegment.update(eventSegmentText);
            }
            //go to the next beginning of a week so we can get the next segment
            drawBeginning.moveToDayOfWeek(this.cal.firstDayOfWeek);
            var segment = $H({
                segment: eventSegment,
                length: segmentLength,
                leftOffset: leftOff,
                rightOffset: rightOff - 1,
                startWeek: startingWeek,
                endWeek: endingWeek
            });
            //we set a Hash for the event segments. each hash position has the week in which it's 
            //drawn as a Hash
            eventSegments.set(startingWeek + i, segment);
        }
        return eventSegments;
    },
	
	removeEventFromDraw: function(event) {

		var thisCalendarMatrix = this.calendarMatrix;
        //we get info about the event segments to remove them in the matrix.
        var eventSegments = this.newEventGraphicObject(event);
        var firstSegment = eventSegments.values()[0];
        var startingWeek = firstSegment.get('startWeek');
        var endingWeek = firstSegment.get('endWeek');
        if (endingWeek >= this.cal.numberOfWeeks) 
            endingWeek = this.cal.numberOfWeeks - 1;
        //search for the event just in the weeks it must appear.
        for(var week = startingWeek; week <= endingWeek; week++){
        
            var rowsInThisWeek = thisCalendarMatrix[week];
            var numberOfRowsInThisWeek = rowsInThisWeek.length;
            //true when the row has been marked to be removed
            var possibleGaps = false;
            for (var i = 0; i < numberOfRowsInThisWeek; i++) {
                var leftOffset;
                var currentSegment = eventSegments.get(week);
                leftOffset = currentSegment.get('leftOffset');
                //we look for the event in this week's rows. If we find it we delete it from
                //the matrix.
                var removed = false;
                if (!possibleGaps) {
                    for (var day = leftOffset; day < leftOffset + currentSegment.get('length'); day++) {
                        if (rowsInThisWeek[i][day]) {
                            var eventIsHere = rowsInThisWeek[i][day].id == event.id;
                            if (eventIsHere) {
                                if(rowsInThisWeek[i][day].graphic.get(week).get("segment").parentNode){
                                    rowsInThisWeek[i][day].graphic.get(week).get("segment").remove();
                                }
                                rowsInThisWeek[i][day] = null;
                                //mark it for redrawing and as a candidate to be removed.
                                rowsInThisWeek[i][7] = 3;
                                removed = true;
                            }
                        }
                    }
                }
                if (removed || possibleGaps) {
                
                    //after removing the event we look whether we can fill the gap with info from 
                    //the next rows
                    for (var gapDay = leftOffset; gapDay < leftOffset + currentSegment.get('length'); gapDay++) {
                        for (var row = i + 1; row < numberOfRowsInThisWeek; row++) {
                            if (thisCalendarMatrix[week][row][gapDay]) {
                                //candidate event length
                                var eventLength = 1;
                                //candidate event start
                                var eventStart = null;
                                //candidate event end
                                var eventEnd = null;
                                var counter = 1;
                                //if there's an event in this row and it's a candidate to be moved,
                                //loop to see how long is it and to calculate it's binding so we can calculate
                                //if there's enough space for it.
                                do {
                                    //look at this event's left to see how long is and find it's beginning
                                    if (gapDay - counter >= 0 && thisCalendarMatrix[week][row][gapDay - counter] &&
                                        thisCalendarMatrix[week][row][gapDay - counter].id ==
                                        thisCalendarMatrix[week][row][gapDay].id) {
                                        eventLength++;
                                    } else if (Object.isEmpty(eventStart)) {
                                        eventStart = gapDay - counter + 1;
                                    }
                                    //look at this event's right to see how long is and find it's end
                                    if (gapDay + counter <= 6 && thisCalendarMatrix[week][row][gapDay + counter] &&
                                        thisCalendarMatrix[week][row][gapDay + counter].id ==
                                        thisCalendarMatrix[week][row][gapDay].id) {
                                        eventLength++;
                                    } else if (Object.isEmpty(eventEnd)) {
                                        eventEnd = gapDay + counter - 1;
                                    }
                                    counter++;
                                } while (Object.isEmpty(eventStart) || Object.isEmpty(eventEnd));
                                //now, once there's info about the event we look if it fits in the gap
                                var fits = true;
                                for (var day = eventStart; day <= eventEnd; day++) {
                                    fits = fits && Object.isEmpty(thisCalendarMatrix[week][i][day]);
                                }
                                if (fits) {
                                    var moved = false;
                                    for (var day = eventStart; day <= eventEnd; day++) {
                                        thisCalendarMatrix[week][i][day] = thisCalendarMatrix[week][row][day];
                                        if(!moved){
                                            var offset = row - i;
                                            var top = thisCalendarMatrix[week][i][day].graphic.get(week).get("segment").getStyle("top");
                                            top = parseInt(top.gsub("px", ""));
                                            top = top - 20*offset;
                                            thisCalendarMatrix[week][i][day].graphic.get(week).get("segment").setStyle({
                                                "top": top + "px"
                                            });
                                            moved = true;
                                        }

/*
                                        if(thisCalendarMatrix[week][row][day].graphic.get(week).get("segment").parentNode){
                                            thisCalendarMatrix[week][row][day].graphic.get(week).get("segment").remove();
                                        }
*/

                                        thisCalendarMatrix[week][row][day] = null;
                                        thisCalendarMatrix[week][row][7] = 3;
                                        thisCalendarMatrix[week][i][7] = 1;
                                    }
                                    fits = false;
                                    //this event may have left more gaps, so now look for new events to refill those gaps
                                    possibleGaps = true;
                                }
                            }
                        }
                    }
                    removed = false;
                    if (!possibleGaps) {
                    
                        break;
                    }
                }
            }
        }

    },
	
	onChangeDate:function($super, e){
		this._JSONOtherViews.valid = false;
		$super(e);
	},
	
	onGoToToday:function($super, e){
		this._JSONOtherViews.valid = false;
		$super(e);
	}
});

PM_processMonitoring.CALENDARVIEW = 'C';
PM_processMonitoring.TREEVIEW = 'T';
PM_processMonitoring.LISTVIEW = 'L';
PM_processMonitoring.GANTVIEW = 'G';


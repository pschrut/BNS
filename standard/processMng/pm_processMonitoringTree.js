/**
 * @author JONATHANJ
 */
var PM_processMonitoringTree = Class.create({
	_parent 			: null,
	_target 			: null,
	_targetId 			: null,
	_data				: null,
	_treeRepresentation	: null,
	_currentStepId		: null,
	_maxLevel			: null,
	_levelOfSubProcess	: null,
	_parentElem			: null,
	_steps				: null,
	_subParentElem		: null,
	_subProcLevel		: null,
	_skipFirstLevel		: null,
	
	initialize:function(parent, target){
		this._parent = parent;
		this._target = target;
		this._targetId = target.identify();
		this._currentStepId = 0;
		this._treeRepresentation = $A();
	},
	
	_buildLinedTreeLayout:function(treeGroupDataArray, levelOfSubProcess, skipFirstLevel){
		
		this._skipFirstLevel = skipFirstLevel;
		
		this._parentElem = null;
		this._steps = $H();
		this._maxLevel = 0;
		this._levelOfSubProcess = parseInt(levelOfSubProcess,10) + 1;
		this._sortData(treeGroupDataArray);
		
		this._target.update('<div style="clear:both;"></div>');
		this._target.insert(this._buildHeader());
		this._target.insert('<div style="clear:both; width:100%; border-bottom:1px solid;"></div>');
		
		this._data.each(function(instanceData){
			if(instanceData['@att_level']=='0000'){
				var JsonNode = {
					id: 'att_id_' + parseInt(instanceData['@att_id'],10),
					title: parseInt(instanceData['@att_id'],10),
					value: global.getLabel(instanceData['@att_val_descr']) + ' (' + parseInt(instanceData['@att_instance_cnt'],10) + ')',
					parent: null,
					isOpen: true,
					isChecked: 0,
					hasChildren: false,
					children: $A()
				}
				if(parseInt(instanceData['@att_level'],10)==this._maxLevel){
					this._getLinedTreeViewProcesses(JsonNode, instanceData);
					JsonNode.hasChildren = true;
				}
				this._treeRepresentation.push(JsonNode);
			}else{
				this._getParentNode(this._treeRepresentation,instanceData, true);
				var JsonNode = {
					id: 'att_id_' + parseInt(instanceData['@att_id'],10),
					title: parseInt(instanceData['@att_id'],10),
					value: global.getLabel(instanceData['@att_val_descr']) + ' (' + parseInt(instanceData['@att_instance_cnt'],10) + ')',
					parent: this._parentElem.id,
					isOpen: true,
					isChecked: 0,
					hasChildren: false,
					children: $A()
				}
				this._parentElem.children.push(JsonNode);
				if(parseInt(instanceData['@att_level'],10)==this._maxLevel){
					this._getLinedTreeViewProcesses(JsonNode, instanceData);
				}
				//this._parentElem.children.push(JsonNode);
				this._parentElem.hasChildren = true;
				this._parentElem = null;
				
			}
		},this);
		
		if(this._skipFirstLevel == true){
			this._treeRepresentation = this._treeRepresentation[0].children;
			this._treeRepresentation[0].parent = null;
			this._treeRepresentation[0].isOpen = true;
		}
			
		
		this._tree = new linedTree(this._targetId, this._treeRepresentation);
		this._addStepLogInTree();
		this._addActionOnStep();
	},
	
	_sortData:function(array){
		this._data = array.sortBy(function(elem){
			if(parseInt(elem['@att_level'], 10) > this._maxLevel){
				this._maxLevel = parseInt(elem['@att_level'], 10);
			}
			return parseInt(elem['@att_level'], 10);
		}.bind(this));
	},
	
	_getParentNode:function(array,data, byAttParentid){
		if(this._subProcLevel == null)
			this._subProcLevel = 0;
		array.each(function(elem){
			if (byAttParentid) {
				if ('att_id_' + elem.id == data['@att_parent_id']) {
					this._parentElem = elem;
					return;
				} else {
					this._getParentNode(elem.children, data, byAttParentid);
				}
			}else{
				if (elem.realId == data['@step_id_parent']) {
					this._subParentElem = elem;
					return;
				} else {
					this._subProcLevel++;
					this._getParentNode(elem.children, data, byAttParentid);
				}
			}
		},this);
	},
	
	_getLinedTreeViewProcesses:function(parent, data){
		if (!Object.isUndefined(data.processdetail)) {
			if (!Object.isUndefined(data.processdetail.yglui_str_pm_processdetail) || data.processdetail.yglui_str_pm_processdetail != null) {
				objectToArray(data.processdetail.yglui_str_pm_processdetail).each(function(process){
					var values = this._buildProcessValues(global.getLabel(process['@process_temptag']), process['@status'], process['@start_date'], process['@end_date'], process['@instance_id'],parent.id);
					var JsonNode = {
						id: parseInt(process['@instance_id'], 10),
						title: values.title,
						value: values.text,
						parent: parent.id,
						isOpen: false,
						isChecked: 0,
						hasChildren: false,
						children: $A()
					}
					parent.children.push(JsonNode);
					this._getLinedTreeViewSteps(JsonNode, process);
					
					//parent.children.push(JsonNode);
				}, this);
				parent.hasChildren = true;
			}
		}
	},
	
	_getLinedTreeViewSteps:function(parent, data){
		if (!Object.isUndefined(data.stepdetail)) {
			if (!Object.isUndefined(data.stepdetail.yglui_str_pm_stepdetail) || data.stepdetail.yglui_str_pm_stepdetail != null) {
				objectToArray(data.stepdetail.yglui_str_pm_stepdetail).each(function(step){
					
					this._currentStepId++;
					
					
					if (parseInt(step['@step_id_parent'],10) == 0) {
						var values = this._buildStepValues(global.getLabel(step['@step_descr']), step['@status'], step['@start_date'], step['@end_date'], step['@duration'], step['@jobname'], step['@spool'], step['@type'], this._levelOfSubProcess-1)
						var JsonNode = {
							id: 'genId_' + this._currentStepId,
							title: values.title,
							value: values.text,
							parent: parent.id,
							isOpen: true,
							isChecked: 0,
							hasChildren: false,
							children: $A(),
							realId: step['@step_id']
						}
						parent.children.push(JsonNode);
						parent.hasChildren = true;
						this._steps.set('genId_' + this._currentStepId, {
							text: this._getStepLog(step, data),
							spool: step['@spool']
						});
					}else{
						this._getParentNode(parent.children, step, false);
						
						var values = this._buildStepValues(global.getLabel(step['@step_descr']), step['@status'], step['@start_date'], step['@end_date'], step['@duration'], step['@jobname'], step['@spool'], step['@type'], (this._levelOfSubProcess - this._subProcLevel)-2)
						var JsonNode = {
							id: 'genId_' + this._currentStepId,
							title: values.title,
							value: values.text,
							parent: this._subParentElem.id,
							isOpen: true,
							isChecked: 0,
							hasChildren: false,
							children: $A(),
							realId: step['@step_id']
						}
						this._subParentElem.children.push(JsonNode);
						this._subParentElem.hasChildren = true;
						this._steps.set('genId_' + this._currentStepId, {
							text: this._getStepLog(step, data),
							spool: step['@spool']
						});
					}
					
					

				}, this);
				
			}
		}
	},
	
	_getStepLog:function(step, data){
		var stepLogText = '';
		if (!Object.isUndefined(data.steplog)) {
			if (data.steplog.yglui_tab_pm_log) {
				objectToArray(data.steplog.yglui_tab_pm_log).each(function(stepLog){
					if (stepLog['@step_id'] == step['@step_id']) {
						stepLogText = stepLog['#text']
					}
				}, this);
			}
		}
		return stepLogText;
	},
	
	_addStepLogInTree:function(){
		this._steps.each(function(step){
			if(step.value.text == ""){
				return;
			}
			var texts = PM_processGrouping.trimText(step.value.text, 90 - (this._levelOfSubProcess*3));
			var line = this._target.down('[id="'+this._targetId+'_linedTreeNode_'+ step.key + '"]');//PM_processTreeViewContainer_linedTreeNode_
			var newLine = line.clone(true);
			newLine.id = this._targetId+'_linedTreeNode_'+ step.key + '_log';
			newLine.down('[id="'+this._targetId+'_linedTreeTxt_'+ step.key + '"]').update(texts.trimText);
			newLine.down('[id="'+this._targetId+'_linedTreeTxt_'+ step.key + '"]').setAttribute('title', texts.text);
			newLine.down('[id="'+this._targetId+'_linedTreeTxt_'+ step.key + '"]').addClassName('PM_treeStepLogText');
			var icon = newLine.down('[id="'+this._targetId+'_linedTreeIco_'+ step.key + '"]');
			if(icon.hasClassName('linedTree_line3')){
				icon.removeClassName('linedTree_line3');
				icon.addClassName('linedTree_spacer');
			}else if(icon.hasClassName('linedTree_line2')){
				icon.removeClassName('linedTree_line2');
				icon.addClassName('linedTree_whiteSpacer');
			}
			
			var tempElement = newLine.down('[id="'+this._targetId+'_linedTreeIco_'+ step.key + '"]');
			tempElement.id = this._targetId+'_linedTreeIco_'+ step.key + '_log';
			tempElement = newLine.down('[id="'+this._targetId+'_linedTreeTxt_'+ step.key + '"]');
			tempElement.id = this._targetId+'_linedTreeTxt_'+ step.key + '_log';
			tempElement = newLine.down('[id="'+this._targetId+'_linedTreeDesc_'+ step.key + '"]');
			tempElement.id = this._targetId+'_linedTreeDesc_'+ step.key + '_log';
			
			line.insert(newLine);
		},this);
	},
	
	_addActionOnStep:function(){		
		this._steps.each(function(step){
			if(parseInt(step.value.spool,10)){
				var elem = this._target.down('[id="PM_jobStep_'+ step.value.spool + '"]');
				elem.observe('click', this._backend_getSpoolData.bindAsEventListener(this, {spool:step.value.spool}));
			}
		}, this);
	},
	
	_backend_getSpoolData:function(args){

		if(!$A(arguments)[1].spool)
			alert('no spool');
		xml = '<EWS>'+
				'<SERVICE>PM_DISP_SPOOL</SERVICE>'+
				'<PARAM>'+
					'<I_SPOOLID>'+ $A(arguments)[1].spool +'</I_SPOOLID>'+
					'<I_OUTPUT_TYPE>HTM</I_OUTPUT_TYPE>'+
					'<I_DOWNLOAD>C</I_DOWNLOAD>'+
				'</PARAM>'+
				'<DEL/>'+
			  '</EWS>';	


		
		this._parent.makeAJAXrequest($H( {
			xml             : xml,
			successMethod   : this._retrieveSpoolData.bind(this)
		}));			
	},
	
	_retrieveSpoolData:function(JSON){
		if(this._parent.virtualHtml.down('[id="PM_spoolDiv"]')){
			this._parent.virtualHtml.down('[id="PM_spoolDiv"]').remove();
		}
		var spoolDiv = new Element('div', {'id':'PM_spoolDiv', 'class':'PM_spoolDiv'});
		this._parent.virtualHtml.down('[id="legend_module_contain"]').insert({after: spoolDiv});
		
		var spoolContent = JSON.EWS.o_content;
		spoolContent = spoolContent.gsub('<![CDATA[', '');
		spoolContent = spoolContent.substring(0, spoolContent.length-3);
		
		var title = new Element('div',{'id':'PM_spoolTitle', 'class':'PM_spoolTitleContainer'});
		var close = new Element('span', {'class':'application_action_link PM_spoolDisplayClose'}).update(global.getLabel('PM_CLOSE'));
		title.insert(new Element('span',{'class':'PM_spoolTitle'}).update(''));
		title.insert(close);
		close.observe('click', function(){
			this._parent.virtualHtml.down('[id="PM_spoolDiv"]').remove();
		}.bind(this));
		var content = new Element('div',{'class':'PM_spoolContent'}).update(spoolContent);
		spoolDiv.update(title);
		spoolDiv.insert(content);
	},
	
	_buildHeader:function(){
		var html = 	'<div style="float:left; width:220px; font-weight:bold;">'+global.getLabel('PM_TREEVIEW_DESCR')+'</div>'+
					'<div style="float:left; width:15px;  font-weight:bold;">&nbsp;</div>'+
					'<div style="float:left; width:75px;  font-weight:bold; padding-left:'+ ((this._maxLevel + this._levelOfSubProcess + 2)*18) +'px;">'+global.getLabel('PM_TREEVIEW_BEGDA')+'</div>'+
					'<div style="float:left; width:75px; font-weight:bold; padding-left:5px;">'+global.getLabel('PM_TREEVIEW_ENDDA')+'</div>'+
					'<div style="float:left; font-weight:bold; padding-left:5px;">'+global.getLabel('PM_DURATION')+'</div>';
		return html;
	},
	
	
	
	_buildProcessValues: function(text, status, begda, endda, instance, group){
		var texts = PM_processGrouping.trimText(text, 35);
		var colorId = global.getColor(group);	
		var colorClass = 'eeColor';
		if(colorId < 10){
			colorClass += '0'+colorId;
		}else{
			colorClass += colorId;
		}
		return values = {
			text : 	'<div style="width:10px;float:left;display:block;"><div class="'+ this._parent._legendValues.get(parseInt(status,10)) +' PM_inLinedTreeIcon"></div></div>'+
					'<div class="PM_inLinedTreeStepText">'+ texts.trimText +'</div>'+
					
					'<div style="float:left; width:10px; height:10px; margin-top:4px; margin-left:5px; overflow:hidden; padding-left:'+ ((this._levelOfSubProcess - 1) *18) +'px;"><div class="upBorder_css ' + colorClass + '"></div>' +
        		   	'<div class="central_css ' + colorClass + '"></div>' +
        		   	'<div class="upBorder_css ' + colorClass + '"></div></div>' +
					
					
					'<div class="PM_inLinedTreeStepDate" style="">'+sapToDisplayFormat(begda)+'</div>'+
					'<div class="PM_inLinedTreeStepDate">'+sapToDisplayFormat(endda)+'</div>' +
					'<div style="clear:both;"></div>',
			title : texts.text
		};
	},
	
	_buildStepValues: function(text, status, begda, endda, duration, jobname, spool, step_type, level){
		var texts = PM_processGrouping.trimText(text, 35);
		var durationText = '';
		if(parseInt(duration,10) != 0){
			durationText = parseInt(duration,10);
			if(durationText == 1){
				durationText += ' '+global.getLabel('PM_SECOND');
			}else{
				durationText += ' '+global.getLabel('PM_SECONDS');
			}
		}else{
			durationText = '&nbsp;'
		}
		if (parseInt(spool, 10) == 0) { 
			return values = {
				text: 	'<div class="' + this._parent._legendValues.get(parseInt(status, 10)) + ' PM_inLinedTreeIcon"></div>' +
						'<div class="PM_inLinedTreeStepText">' + texts.trimText + '</div>' +
						'<div style="float:left; width:12px;">&nbsp;</div>'+
						'<div class="PM_inLinedTreeStepDate" style="padding-left:'+ ((level-1) *18) +'px;">' + sapToDisplayFormat(begda) + '</div>' +
						'<div class="PM_inLinedTreeStepDate">' + sapToDisplayFormat(endda) + '</div>' +
						'<div style="float:left; padding-left:5px;">'+ durationText +'</div>'+
						'<div style="clear:both;"></div>',
				title: texts.text
			}; 
		}else{
			return values = {
				text: 	'<div class="' + this._parent._legendValues.get(parseInt(status, 10)) + ' PM_inLinedTreeIcon"></div>' +
						'<div class="PM_inLinedTreeStepText application_action_link" id="PM_jobStep_'+ spool +'">' + texts.trimText + '</div>' +
						'<div style="float:left; width:12px;">&nbsp;</div>'+
						'<div class="PM_inLinedTreeStepDate" style="padding-left:'+ ((level-1) *18) +'px;">' + sapToDisplayFormat(begda) + '</div>' +
						'<div class="PM_inLinedTreeStepDate">' + sapToDisplayFormat(endda) + '</div>' +
						'<div style="float:left; padding-left:5px;">'+ durationText +'</div>'+
						'<div style="clear:both;"></div>',
				title: texts.text
			}; 
		}
	}
});
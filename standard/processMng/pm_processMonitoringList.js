var PM_processMonitoringList = Class.create({
	_parent: null,
	_target: null,
	_targetId: null,
	
	initialize: function(parent, target){
		this._parent = parent;
		this._target = target;
		this._targetId = target.identify();
	},
	
	_buildListView:function(treeInstanceObject){
		if(treeInstanceObject == null || Object.isUndefined(treeInstanceObject.size)){
			this._target.update();
			return;
		}
		
/*
		var colWidthArray = [
			19, //col1
			15, //col2
			240, //col3
			75, //col4
			75, //col5
			74, //col6
			114  //col7
		];	
*/	
		
		var treeProcesses = $A();
		
		treeInstanceObject.each(function(item){
			if (Object.isUndefined(item['@processdetail']) && item['processdetail']) {
				treeProcesses.push({
					item: item["processdetail"].yglui_str_pm_processdetail,
					color: parseInt(item['@att_id'], 10)
				});
			}				
		});

		
		var elemTable = new Element('table', {'id':'PM_listViewTable','cellspacing':'0', 'cellpadding':'0','class':'sortable'});
		var elemThead = new Element('thead');
		var elemTbody = new Element('tbody');
		elemThead.insert(

		'<tr>'+
			'<th id="Th1" class="table_sortfirstdesc table_sortcol" style="width:10px">&nbsp;</th>'+
			'<th id="Th3" class="table_sortcol" style="width:10px">'+global.getLabel('PM_COLOR')+'</th>'+
			'<th id="Th2" class="table_sortcol" style="width:300px">'+global.getLabel('PM_TREEVIEW_DESCR')+'</th>'+
			'<th id="Th4" class="table_sortcol" style="width:80px">'+global.getLabel('PM_TREEVIEW_BEGDA')+'</th>'+
			'<th id="Th5" class="table_sortcol" style="width:80px">'+global.getLabel('PM_TREEVIEW_ENDDA')+'</th>'+
			'<th id="Th6" class="table_sortcol" style="width:70px">'+global.getLabel('PM_DURATION')+'</th>'+
			'<th id="Th7" class="table_sortcol">'+global.getLabel('PM_ATT_PROCESS_TYPE')+'</th>'+
		'</tr>'		
		);
		var ctr = 1;

		
		treeProcesses.each(function(instance){
			

					
			objectToArray(instance.item).each(function(process){
				var oddrow = '';
				if((ctr % 2) == 0){
					oddrow = 'oddrow';
				}
				
				
				var color = global.getColor(instance.color);
				if(color < 10)
					color = '0'+color;
				var colorContainer = '<div class="PM_leafColorContainer" style="margin-right:3px;">'+
									'<div class="upBorder_css eeColor'+color+'"></div>'+
									'<div class="central_css eeColor'+color+'"></div>'+
									'<div class="upBorder_css eeColor'+color+'"></div>'+
									'</div>';		
				
				var duration = process["@duration"];
				var durationText = null;
				if(parseInt(duration,10) != 0){
					durationText = parseInt(duration,10);
					if (durationText > 59) {
						durationText = parseInt(durationText / 60,10);
						if (durationText > 59) {
							durationText = parseInt(durationText / 60,10);
							durationText = durationText + '&nbsp;';
							durationText += global.getLabel((durationText == 1) ? 'PM_HOUR' : 'PM_HOURS');
						}
						else {
							durationText = durationText + '&nbsp;';
							durationText += global.getLabel((durationText == 1) ? 'PM_MINUTE' : 'PM_MINUTES');
						}													
					}
					else {
						durationText = durationText + '&nbsp;';
						durationText += global.getLabel((durationText == 1)?'PM_SECOND':'PM_SECONDS');
					}
				}else{
						durationText = '&nbsp;';
				}
				

				
				//'<div class="'+ this._parent._legendValues.get(parseInt(status,10)) +' PM_inLinedTreeIcon"></div>'		
				//var tempTR = new Element('tr',{'id':'Tr'+ctr, 'class':oddrow});
				
				var tempTR = new Element('tr', {'valign':'top'});
				var tempTD = new Element('td');
				
				var abscon = new Element('div', {'class':'detail_abscon'});
				
				
				
				
				var stepDetails = $A();
				var stepType = $A();
				var processType = '';
				
				if (Object.isUndefined(process['@stepdetail']) && process['stepdetail']) {
					stepDetails = process['stepdetail'].yglui_str_pm_stepdetail;
				}

				if (Object.isUndefined(process['@att_list']) && process['att_list']) {
					
					stepType = process['att_list'].yglui_str_pm_instance_att_list;
					objectToArray(stepType).each(function(type){
						if (type['@att_param'] == 'PROCESS_TYPE') {
							processType = global.getLabel(type['@att_tag']);
							if(processType == null)
								processType = '';
						}
					});
				}
				
				var stepCtr = 0;
				
				objectToArray(stepDetails).each(function(step){
					
						
					var durationText = null;
					if(parseInt(step["@duration"],10) != 0){
						durationText = parseInt(step["@duration"],10);
						if (durationText > 59) {
							durationText = parseInt(durationText / 60, 10);
							if (durationText > 59) {
								durationText = parseInt(durationText / 60, 10);
								durationText = durationText + '&nbsp;';
								durationText += global.getLabel((durationText == 1) ? 'PM_HOUR' : 'PM_HOURS');
							}
							else {
								durationText = durationText + '&nbsp;';
								durationText += global.getLabel((durationText == 1) ? 'PM_MINUTE' : 'PM_MINUTES');
							}													
						}
						else {
							durationText = durationText + '&nbsp;';
							durationText += global.getLabel((durationText == 1)?'PM_SECOND':'PM_SECONDS');
						}
					}else{
						durationText = '&nbsp';
					}
									
					var format = '<div class="detail_spacer">&nbsp;</div>'+
					'<div style="float:left; margin-left:3px;" class="'+this._parent._legendValues.get(parseInt(step["@status"],10))+'">&nbsp;</div>'+
					'<div style="padding-left:14px;" class="detail_text">'+step["@step_descr"]+'</div>'+
					'<div class="detail_stadate">'+sapToDisplayFormat(step["@start_date"])+'</div>'+
					'<div class="detail_enddate">'+sapToDisplayFormat(step["@end_date"])+'</div>'+
					'<div style="float:left; width:80px; padding-left:9px;">' + durationText+ '</div>'+
					//'<div class="detail_processtype">'+processType+'</div>'+
					'<div class="clearing"></div>';				
					abscon.insert(format);
					stepCtr++;
				}, this);
				
				var container_height = (stepCtr * (Prototype.Browser.IE ? 18 : 15)) + 11;
				
				var relcon = new Element('div', {'class':'detail_relcon PM_hidden','id':'detail_'+ctr, 'style':'height:'+container_height+'px'});
				relcon.insert(abscon);			
				
				tempTD.insert('<div style="margin-top:4px;" class="'+ this._parent._legendValues.get(parseInt(process["@status"],10)) +'"><div style="line-height:0px;height:0px;width:0px;overflow:hidden;">'+parseInt(process["@status"],10)+'</div></div>');

				tempTD.insert(relcon);
				
				tempTD.setStyle({
					'width': '10px'
				});
				
				var temp = '<td style="width:10px">'+colorContainer+'</td>'+
				'<td style="width:300px">'+process["@process_temptag"]+'</td>'+				
				'<td style="width:80px">'+sapToDisplayFormat(process["@start_date"])+'</td>'+
				'<td style="width:80px">'+sapToDisplayFormat(process["@end_date"])+'</td>'+
				'<td style="width:70px">'+durationText+'</td>'+
				'<td>'+processType+'</td>';
				
				
				tempTR.insert(tempTD);
				tempTR.insert(temp);
				
				tempTR.observe('click', function(){
					if(relcon.hasClassName('PM_hidden')){
						relcon.removeClassName('PM_hidden');
					}else{
						relcon.addClassName('PM_hidden')
					}
				}.bind(this));
								
				elemTbody.insert(tempTR);
				
				ctr++;	
							
			},this);
		},this);
		
	
		
		elemTable.insert(elemThead);
		elemTable.insert(elemTbody);
		
		this._target.update(elemTable);
		TableKit.unloadTable($('PM_listViewTable'));
		TableKit.Sortable.init($('PM_listViewTable'));
		
		
	}
	
});
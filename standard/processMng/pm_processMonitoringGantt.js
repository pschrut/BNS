/**
 * @author JONATHANJ
 */
var PM_processMonitoringGantt = Class.create({
	
	_ganttObject:null,
	_target:null,
	_maxLevel:null,
	_data:null,
	_tasks:null,
	_generatedId:null,
	_parent:null,
	_projectStartDate:null,
	_projectEndDate: null,
	
	
	initialize:function(parent, target){
		this._target = target;	
		this._parent = parent;
		this._target.update('');
	},
	
	buildGantt:function(arrayOfData){
		this._generatedId= 0;
		this._maxLevel = 0;
		this._data = $A();
		this._tasks = $H();
		
		this._sortData(arrayOfData);
		this._ganttObject = new GanttChart();
		this._ganttObject.setImagePath("css/images/dhtmlxgantt/");
		
		this._buildGanttProjects();
		this._ganttObject.showDescTask(false, '');
		this._ganttObject.showContextMenu(false);
		this._ganttObject.showDescProject(false, '');
		this._ganttObject.create(this._target.identify());
		this._addPredecessors();
	},
	
	_sortData:function(array){
		this._data = array.sortBy(function(elem){
			if(parseInt(elem['@att_level'], 10) > this._maxLevel){
				this._maxLevel = parseInt(elem['@att_level'], 10);
			}
			return parseInt(elem['@att_level'], 10);
		}.bind(this));
	},
	
	
	_buildGanttProjects:function(){
		var dataMonth = this._parent.selectMonths.selectedIndex;
		var dataYear  = this._parent.selectYears.value;
				
		var tempDate = new Date();
		tempDate.setMilliseconds(0);
		tempDate.setSeconds(0);
		tempDate.setMinutes(0);
		tempDate.setHours(0);
		tempDate.setMonth(dataMonth);
		tempDate.setYear(dataYear);
		
		tempDate.moveToLastDayOfMonth();
		this._projectEndDate = tempDate;
		tempDate.moveToFirstDayOfMonth();
		this._projectStartDate = tempDate;
		
		this._data.each(function(data){
			if(parseInt(data['@att_level'],10) == this._maxLevel){
				var colorId = global.getColor(parseInt(data['@att_id'],10));	
				var colorClass = 'eeColor';
				if(colorId < 10){
					colorClass += '0'+colorId;
				}else{
					colorClass += colorId;
				}
				var projectDescription = '<div style="float:left; width:10px; height:10px; margin-top:3px; margin-right:5px; overflow:hidden;">'+
					'<div class="upBorder_css ' + colorClass + '"></div>' +
        		   	'<div class="central_css ' + colorClass + '"></div>' +
        		   	'<div class="upBorder_css ' + colorClass + '"></div>'+
					'</div>' + data['@att_val_descr'];
				
				
				var project = new GanttProjectInfo(parseInt(data['@att_id'],10), projectDescription, tempDate);
				this._buildGanttTasks(project, data);

				this._ganttObject.addProject(project);
//				this._addPredecessors(project, data);
			}
		}, this);
	},
	
	
	
	

	_buildGanttTasks:function(project, data){
		if (data.processdetail && data.processdetail.yglui_str_pm_processdetail) {
			objectToArray(data.processdetail.yglui_str_pm_processdetail).each(function(processDetails){
				
				if(processDetails['@end_date'] == '0000-00-00')
					processDetails['@end_date'] = processDetails['@start_date'];
					
					
				var begda = sapToObject(processDetails['@start_date']);
				var endda = sapToObject(processDetails['@end_date']);
				
				var realBegda = begda;
				var realEndda = endda;
				if(Date.compare ( begda, this._projectStartDate ) == -1){
					begda = this._projectStartDate;
				}		
				if(Date.compare ( endda, this._projectEndDate ) == -1){
					endda = this._projectEndDate;
				}	
				var duration = '';
				duration = endda.getTime() - begda.getTime();
				
				duration > 0 ? duration = (duration / 3600000)/3 : duration = 8;
				//duration = (duration+1)*8;
		
				//var text = '<div class="'+ this._parent._legendValues.get(parseInt(processDetails['@status'],10)) +' PM_inLinedTreeIcon"></div>'+ global.getLabel(processDetails['@process_temptag']);
				var text = global.getLabel(processDetails['@process_temptag']);
				var parentTask = new GanttTaskInfo(parseInt(processDetails['@instance_id'],10), text , begda, duration, this._determineProgress(parseInt(processDetails['@status'],10)), "", endda, realBegda, realEndda, parseInt(processDetails['@status'],10));
				this._buildGanttSteps(project,parentTask, processDetails);
				project.addTask(parentTask);

			}, this);
		}
	},


	_buildGanttSteps:function(project, parentTask, data){
		if(data.stepdetail && data.stepdetail.yglui_str_pm_stepdetail){
			
			var stepsArray = objectToArray(data.stepdetail.yglui_str_pm_stepdetail)
			var totalSteps = stepsArray.size();
			
			
			stepsArray.each(function(step){
				
				var taskObject = parentTask;
				
				if (parseInt(step['@step_id_parent'],10) != 0) {
					taskObject = this._tasks.get(step['@step_id_parent']);
				}

				if(step['@end_date'] == '0000-00-00')
					step['@end_date'] = step['@start_date'];
				var duration = '';
				var begda = sapToObject(step['@start_date']);
				var endda = sapToObject(step['@end_date']);
				
				var realBegda = begda;
				var realEndda = endda;
				if(Date.compare ( begda, this._projectStartDate ) == -1){
					begda = this._projectStartDate;
				}		
				if(Date.compare ( endda, this._projectEndDate ) == -1){
					endda = this._projectEndDate;
				}	
				
				
				duration = endda.getTime() - begda.getTime();
				
				duration > 0 ? duration = (duration / 3600000)/3 : duration = 8;
				//duration = (duration+1)*8;
				var predecessor = '';
				
				//var text = '<div class="'+ this._parent._legendValues.get(parseInt(step['@status'],10)) +' PM_inLinedTreeIcon"></div>'+ global.getLabel(step['@step_descr']);
				var text = global.getLabel(step['@step_descr']);
				var task = new GanttTaskInfo(step['@step_id'], text, begda, duration, this._determineProgress(parseInt(step['@status'],10)), predecessor, endda, realBegda, realEndda, parseInt(step['@status'],10));
				this._tasks.set(step['@step_id'],task);
				taskObject.addChildTask(task);
				
			},this);
			
		}	
	},
	
	_addPredecessors:function(){
		try {
			this._data.each(function(data){
				if (parseInt(data['@att_level'], 10) == this._maxLevel) {
					var project = this._ganttObject.getProjectById(parseInt(data['@att_id'], 10));
					if (data.processdetail && data.processdetail.yglui_str_pm_processdetail) {
						objectToArray(data.processdetail.yglui_str_pm_processdetail).each(function(processDetails){
							if (processDetails.stepdetail && processDetails.stepdetail.yglui_str_pm_stepdetail) {
							
								var sortedArray = objectToArray(processDetails.stepdetail.yglui_str_pm_stepdetail).sortBy(function(step){
									return step['@step_id_pre'];
								});
								
								sortedArray.reverse();
								sortedArray.each(function(step){
									if (step['@step_id_pre'] == null) { return; } else {
										var task = project.getTaskById(step['@step_id']);
										task.setPredecessor(step['@step_id_pre']);
									}
								}, this);
							}
						}, this);
					}
				}
			}, this);
		}catch(e){};
	},
	
	_determineProgress: function(status){
		var progress = 0;
		switch(status){
			case 2: // in progress
			case 6: // pending
			case 7: // pending
						progess = 50;
						break;
			case 3: // success
			case 5: // failed
						progress = 100;
						break;
			case 1: // planned
			case 4: // cancelled
						progress = 0;
						break;
		}
		return progress;
	},
	
	_determineDate: function(date){
		var dateObj = sapToObject(step['@start_date']);
	}
});

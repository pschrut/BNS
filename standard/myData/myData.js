
var EMP3 = Class.create(Application,{
    initialize: function($super) {
        //Calling to parent class constructor
        $super('EMP3');
        /*
		 * @name employeeId
		 * @desc Stores the employee id got from global
		 * @type Integer
		 */
        this.employeeId = global.getLoggedUser().id;
        /*
		 * @name language
		 * @desc Stores the default language got from global
		 * @type String
		 */
        this.language	= global.getOption('__language');
        /*
		 * @name groupsData
		 * @desc Stores the parsed XML for the groups (Tabs))
		 * @type Hash
		 */
        this.groupsData = new Array();
        /*
		 * @name navigationMenuData
		 * @desc Contains information about the screens navigation
		 * @type Array
		 */
        this.navigationMenuData = new Hash();
        /*
		  * @name widgetsPositionStack
		  * @desc Stacks the changes on the widgets position to be processed later
		  * @type Hash
		  */
        this.widgetsPositionStack = new Hash();
        /*
		  * @name employeeSelectedStack
		  * @desc Stacks the employeeSelected event fired to be processed later
		  * @type Array
		  */
        this.employeeSelectedStack = new Array();
        /*
		  * @name contentDiv
		  * @desc This element contais all the personal information
		  * @type Prototype.Element
		  */
        this.contentDiv = new Element('div');
        /*
		  * @name employeeName
		  * @desc Stores the employees name
		  * @type Hash
		  */
        this.employeeName = new Hash();
        /*
		  * @name cachedData
		  * @desc Indicates if the data is going to be load is currently stored or not
		  * @type Boolean
		  */
        this.cachedData = false;
        /*
		  * @name data
		  * @desc Stores the employee data to not request it to the backend for this information when needed
		  * @type Hahs
		  */
        this.data = $H({});
		 
        this.widgets_widgetNewPositionHandlerBinding = function(event) {
            //console.log(args.id+" "+args.position.column+" - "+args.position.row);
            var args = getArgs(event);
            this.widgetsPositionStack.set(args.id,args);
        }.bind(this);
        this.widgets_positionStackReadyHandlerBinding = function() {
            this._parsePositionStack(null);
            this.widgetsPositionStack = new Hash();
        }.bind(this);
        this.employeeSelectedHandlerBinding = function(event) {
            var args = getArgs(event);
            this.employeeSelectedStack.push(args);
            //if(this.loaded)
            this._processEmployeeSelectedStack();
        }.bind(this);
        this.widgets_widgetMinimizedHandlerBinding = function(event) {
            var args = getArgs(event).split('_');
            try {
                this.data.get(this.employeeId).get(args[1]).get('widgets').each(function(item) {
                    if(item.get('service').get('id') == args[3]) {
                        item.get('graphical').set('collapse','X');
                    }
                });
                this._parsePositionStack(args[1]);
            }
            catch(e) {
//                if(log){
//                    log.warn('My Data: problem minimizing widget');
//                }
            }
        }.bind(this);
        this.widgets_widgetMaximizedHandlerBinding = function(event) {
            var args = getArgs(event).split('_');
            try {
                this.data.get(this.employeeId).get(args[1]).get('widgets').each(function(item) {
                    if(item.get('service').get('id') == args[3]) {
                        item.get('graphical').set('collapse',null);
                    }
                });
                this._parsePositionStack(args[1]);
            }
            catch(e) {
//                if(log){
//                    log.warn('My Data: problem minimizing widget');
//                }
            }
        }.bind(this);
    },
    /*
	 * @method run
	 * @desc This method will be called every time the user clicks on myData icon
	 */
    run:function($super){
        $super();
        if(this.firstRun) {
            this.virtualHtml.insert(this.contentDiv);
            //Requesting the information and creating the structure
            this.getMyDataGroups();
        }
        else {
            var selectedUser = null;
            if (global.getLoggedUser().isManager) {
                global.getOption('employeesArray').each(function(employee) {
                    if(employee.value.selected)
                        selectedUser = employee.key;
                });
            }
            else
                selectedUser = global.getLoggedUser().id;
            if(this.employeeId != selectedUser && !Object.isEmpty(selectedUser)) {
                this.employeeSelectedStack.push(selectedUser);
                if(this.loaded)
                    this._processEmployeeSelectedStack();
            }
            try {
                this.data.get(this.employeeId).each(function(group) {
                    if (group.value.get('selected') == 'X') group.value.get('portal').updateColumnsHeight();
                }.bind(this));
            } catch (err) {
                if (log) {
                    log.warn('My Data: error in run function');
                }
            }
        }
        //Starting the events listeners
        this._startEventListeners();
        if(!Object.isEmpty($('myDataTabs')))
            $('myDataTabs').show();
    },
    /*
	 * @method close
	 * @desc This method is executed when moving to other application
	 */
    close: function($super) {
        $super();
        document.fire('EWS:myteam1_multipleEmployeeSelected', 'myData');
        this._stopEventListeners();
        if(!Object.isEmpty($('myDataTabs')))
            $('myDataTabs').hide();
    },
    /*
	 * @method _startEventsListener
	 * @desc Starts all the event listeners
	 */
    _startEventListeners: function() {
        //Listening for widget new position
        document.observe('EWS:widgets_widgetNewPosition',this.widgets_widgetNewPositionHandlerBinding);
        //Listening for all widget position changed
        document.observe('EWS:widgets_positionStackReady',this.widgets_positionStackReadyHandlerBinding);
        //Listening to employeeSelected
        document.observe('EWS:employeeSelected',this.employeeSelectedHandlerBinding);
        document.observe('EWS:widgets_widgetMinimized', this.widgets_widgetMinimizedHandlerBinding);
        document.observe('EWS:widgets_widgetMaximized', this.widgets_widgetMaximizedHandlerBinding);

    },
    /*
	 * @method _stopEventListeners
	 * @desc Stops the event listener to not listen while de application is hide
	 */
    _stopEventListeners: function() {
        document.stopObserving('EWS:widgets_widgetNewPosition',this.widgets_widgetNewPositionHandlerBinding);
        document.stopObserving('EWS:widgets_positionStackReady',this.widgets_positionStackReadyHandlerBinding);
        document.stopObserving('EWS:employeeSelected',this.employeeSelectedHandlerBinding);
    },
    /*
	 * @method _processEmployeeSelectedStack
	 * @desc Parses the stack of selected employee, the last employee will be selected and will get its information
	 */
    _processEmployeeSelectedStack: function() {
        var lastSelected = this.employeeSelectedStack.last();
        //Destroying the current user HTML
        if(lastSelected != undefined) {
            this.tabs.destroy();
            //Removing the tabs
            if(!Object.isEmpty($('myDataTabs')))
                $('myDataTabs').remove();
            if(!Object.isUndefined(this.data.get(this.employeeId)))
                this.data.get(this.employeeId).each(function(group) {
                    group.value.get('widgets').each(function(widget) {
                        if(!Object.isEmpty(widget.widget)) {
                            if(!Object.isEmpty(widget.widget.getContent().parentNode))
                                widget.set('widgetContent',widget.widget.getContent().remove());
                            if(!Object.isUndefined(widget.widget.draggable))
                                widget.widget.draggable.destroy();
                            group.value.get('portal').remove(widget.widget);
                            delete widget.widget;
                        }
                        group.value.get('portal').destroy();
                    });
                    group.value.set('printed', false);
                });
            document.stopObserving('EWS:myData_showContent',this.myData_showContentHandlerBinding);
            //this.updateTitle('<div class="applicationmyData_widgetAjaxLoad">'+global.labels.get('loading')+'</div>');
            this.employeeId = lastSelected;
            this.contentDiv.descendants().each(function(element) {
                element.remove()
            });
            try {
                this.getMyDataGroups();
            } catch (err) {
                if (log) {
                    log.warn('My Data: in function _processEmployeeSelectedStack');
                }
            }
        }
        this.employeeSelectedStack.clear();
    },
    _parsePositionStack: function(groupName) {
        var group;
        if(!Object.isEmpty(groupName)) group = groupName;
        this.widgetsPositionStack.each(function(position) {
            var data = this.widgetsPositionStack.get(position.key).id.split('_');
            var position = this.widgetsPositionStack.get(position.key);
            group = data[1];
            var widgetId = data[2];
            position.position.row++;
            position.position.column++;
            this.data.get(this.employeeId).get(group).get('widgets')[parseInt(widgetId,10)].get('graphical').set('row',position.position.row)
            this.data.get(this.employeeId).get(group).get('widgets')[parseInt(widgetId,10)].get('graphical').set('col',position.position.column);
        }.bind(this));
        var xml = '<OpenHR>'+
        '<SERVICE>SET_WIDGETS</SERVICE>'+
        '<application>EMPLOYEE_DATA2</application>'+
        '<group>'+group+'</group>'+
        '<employee id="'+this.employeeId+'"/>'+
        '<ToSAP>'+
        '<origin>'+
        '<widgets>';
		
        for(var i = 0; i < this.data.get(this.employeeId).get(group).get('widgets').length; i++) {
            position = this.data.get(this.employeeId).get(group).get('widgets')[i].get('graphical');
            var collapse = position.get('collapse') == 'X' ? '<collapse>X</collapse>' : '<collapse/>';
            var widgetNode = '<widget id="'+this.data.get(this.employeeId).get(group).get('widgets')[i].get('id')+'">'+
            '<graphical>'+
            '<row>'+position.get('row')+'</row>'+
            '<col>'+position.get('col')+'</col>'+
            collapse+
            '<style>7</style>'+
            '</graphical>'+
            '<service id="employeeData">'+
            '<options>'+
            '<content id="'+this.data.get(this.employeeId).get(group).get('widgets')[i].get('service').get('id')+'" screen="'+this.data.get(this.employeeId).get(group).get('widgets')[i].get('service').get('screen')+'"/>'+
            '</options>'+
            '</service>'+
            '</widget>';
            xml += widgetNode;
        }
        xml += '</widgets></origin><language>EN</language></ToSAP></OpenHR>';
        this.makeAJAXrequest($H({
            xml: xml,
            successMethod: '_widgetServiceNewPosition',
            failureMethod: '_widgetServiceNewPosition'
        }));
    },
    _widgetServiceNewPosition: function(xml) {
    },
    /*
	 * @method _parseGroupsXml
	 * @desc This method is called when the ajax request of GET_MY_DATA_GROUPS is successful, this function parses the XML
	 * @param XML The XML object
	 */
    _parseGroupsXml: function(xml, empId) {
        //Getting the groups from the XML
        var groups = xml.OpenHR.group;
        var name = xml.OpenHR.employee;
        this.employeeName.set(empId, name);
        //Parsing each node
        this.data.set(empId, $H({}));
        for(var i = 0; i < groups.length; i++) {
            //New
			
            this.data.get(empId).set(groups[i]['@id'], $H({
                selected: groups[i]['#text'],
                text: this.labels.get(groups[i]['@id']),
                portal: null,
                loaded: false,
                widgets: new Array(),
                printed: false
            }));
        }
        if(empId == this.employeeId)
            this.createMyDataGroups();
    },
    /*
	 * @method getMyDataGroups
	 * @desc This method calls to GET_MY_DATA_GROUPS and parses all it information storing it on a hash
	 */
    getMyDataGroups: function() {
        //XML In
        this.loaded = false;
        //if(this.data.get(this.employeeId) == undefined) {
        this.cachedData = false;
        var xmlRequest = '<OpenHR><SERVICE>GET_MY_DATA_GROUPS</SERVICE><ToSAP><employee id="'+this.employeeId+'"/><language>EN</language></ToSAP></OpenHR>';
        this.makeAJAXrequest($H({
            xml: xmlRequest,
            successMethod: '_parseGroupsXml',
            ajaxID: this.employeeId
        }));
    //}
    //else {
    //	this.cachedData = true;
    //	this.createMyDataGroups();
    //}
    },
    /*
	 * @method _createPortalStructure
	 * @desc Creates the Widgets.Portal HTML structuree
	 * @param Id {String} Portal Id
	 * @return {String} Portal HTML Structure
	 */
    _createPortalStructure: function(id) {
        return '<div id="'+id+'" class="applicationmyData_portal '+id+'">'+
        '<div id="portal_column_0" class="applicationmyData_portalColumn"></div>'+
        '<div id="portal_column_1" class="applicationmyData_portalColumn"></div>'+
        '</div>';
    },
    /*
	 * @method createMyDataGroups
	 * @desc Creates the groups using the parsed information from the service GET_MY_DATA_GROUPS
	 */
    createMyDataGroups: function() {
        //Provisional hardcoded TAB this block will be replaced for a creation of a tabs module
        var dataGroupsHTML = '';
        var i = 0;
        var labelsArray = new Array();
        var idsArray = new Array();
        var active = 0;
        $('fwk_5_bottom').insert('<div id="myDataTabs" class="appNavigation_floatingTab" style="display: block;">');
        this.data.get(this.employeeId).each(function(group) {
            labelsArray.push(group.value.get('text'));
            idsArray.push(group.key);
            if(group.value.get('selected') == 'X')
                active = i;
            i++;
        }.bind(this));
        var options = $H({
            labels: labelsArray,
            ids: idsArray,
            events: $H({
                onTabClicked: 'EWS:myDataTabClicked'
            }),
            active: active+1,
            //width: 500,
            mode: 'normal',
            target: 'myDataTabs',
            callback: function(args) {
                document.fire('EWS:myData_showContent',args);
            },
            firstRun: 'n'
        });
        this.data.get(this.employeeId).each(function(group) {
            if(group.value.get('selected') == 'X') {
                //this.updateTitle(group.value.get('text')+' - '+this.employeeName.get(this.employeeId));
                dataGroupsHTML += '<div class="applicationmyData_content" id="myData_content_'+group.key+'" style="display: block;">'+this._createPortalStructure('myData_portal_'+group.key)+'</div>';
            }
            else
                dataGroupsHTML += '<div class="applicationmyData_content" id="myData_content_'+group.key+'" style="display: none;">'+this._createPortalStructure('myData_portal_'+group.key)+'</div>';
        //Creating the portal
        }.bind(this));
        this.contentDiv.insert(dataGroupsHTML);
        this.tabs = new Tabs(options);
        this.data.get(this.employeeId).each(function(group) {
            group.value.set('portal', new Widgets.Portal('#myData_portal_'+group.key+' div', group.key, {
                startDragDrop: false
            }));
            if(group.value.get('selected') == 'X')
                group.value.get('portal').startDragDrop();
        }.bind(this));
		
        this.myData_showContentHandlerBinding = function(event) {
            var args = getArgs(event);
            var selectedPortal = null;
            this.data.get(this.employeeId).each(function(group) {
                if(group.key != args) {
                    this.virtualHtml.down('[id=myData_content_'+group.key+']').hide();
                    group.value.set('selected', "");
                    if(group.value.get('portal') != undefined)
                        group.value.get('portal').stopDragDrop();
                }
                else
                {
                    this.virtualHtml.down('[id=myData_content_'+group.key+']').show();
                    //this.updateTitle(group.value.get('text')+' - '+this.employeeName.get(this.employeeId));
                    group.value.set('selected',"X");
                    this.loaded = false;
                    if(group.value.get('widgets').length > 0)
                        this.createWidgets(group.key);
                    if(group.value.get('portal') != undefined)
                        group.value.get('portal').updateColumnsHeight();
                    selectedPortal = group.value.get('portal');
                }
            }.bind(this));
													
            if(!Object.isEmpty(selectedPortal))
                selectedPortal.startDragDrop();
        }.bind(this);
        document.observe('EWS:myData_showContent', this.myData_showContentHandlerBinding);
        //Getting the widgets
        this.getWidgets();
    },
    /*
	 * @method _sortWidgetsArray
	 * @desc This method sort the array of widgets by row position using the bubble sorting method
	 * @return {Array} The sort array
	 */
    _sortWidgetsArray: function(array,id){
        var k;
        for(var i = 0; i < array.length; i++) {
            k = i;
            for(var j = i+1; j < array.length; j++) {
                if(array[j].get('graphical').get('row') < array[k].get('graphical').get('row')) {
                    var tmp = array[k];
                    array[k] = array[j];
                    array[j] = tmp;
                    k = j;
                }
            }
        }
        return array;
    },
    /*
	 * @method createWidgets
	 * @desc Creates the widgets using the information parsed on getWidgets
	 */
    createWidgets: function(id) {
        // NEW
        //If the group is not loaded generates the widgets and get its content
        if(this.data.get(this.employeeId).get(id).get('loaded'))
            this.loaded = true;
        if(this.data.get(this.employeeId).get(id).get('selected') == "X" && !this.data.get(this.employeeId).get(id).get('printed')) {
            portal = this.data.get(this.employeeId).get(id).get('portal');
            var widgetsArray = this.data.get(this.employeeId).get(id).get('widgets');
            widgetsArray = this._sortWidgetsArray(widgetsArray,id);
            var i;
            this.currentlyLoaded = 0;
            this.lastToBeLoaded = widgetsArray.length-1;
            for(i = 0; i < widgetsArray.length; i++) {
                //if(!this.cachedData) {
                widgetsArray[i].widget = new Widgets.Widget({ divId: 'widget_'+id+'_'+i+'_'+widgetsArray[i].get('service').get('id'),
                    optionsButton: false,
                    closeButton: false
                });
                widgetsArray[i].widget.setTitle('<div class="applicationmyData_widgetAjaxLoad">'+global.labels.get('loading')+'</div>');
                //}
                if(this.cachedData || widgetsArray[i].get('contentCreated')) {
                    widgetsArray[i].widget.setContent(widgetsArray[i].get('widgetContent'));
                    if(widgetsArray[i].get('title') != undefined)
                        widgetsArray[i].widget.setTitle(widgetsArray[i].get('title'));
                }
                widgetsArray[i].widget.updateHeight();
                portal.add(widgetsArray[i].widget,parseInt(widgetsArray[i].get('graphical').get('col'),10)-1);
                if(widgetsArray[i].get('graphical').get('collapse') == 'X')
                    widgetsArray[i].widget.minimizeButtonAction(null,true);
                widgetsArray[i].widget.updateHeight();
                widgetsArray[i].widget.portal.updateColumnsHeight();
                !widgetsArray[i].get('contentCreated') ? this.getWidgetsContent(id,i) : this.loaded = true;
                widgetsArray[i].widget.windowResizedAction();
            }
            this.data.get(this.employeeId).get(id).set('printed', true);
        }
        this.data.get(this.employeeId).get(id).set('loaded', true);
    },
    /*
	 * @method getWidgets
	 * @desc Parses the GET_WIDGETS for each data group and stores the information on an array
	 */
    getWidgets: function() {
        //Calling GET_WIDGETS for each group
        this.data.get(this.employeeId).each(function(group) {
            //Making the XML In
            if (!group.value.get('loaded')) {
                var xmlIn = '<OpenHR><SERVICE>GET_WIDGETS</SERVICE><ToSAP><application>EMPLOYEE_DATA2</application>' +
                '<group>' +
                group.key +
                '</group><employee id="' +
                this.employeeId +
                '"/><language>EN</language></ToSAP></OpenHR>';
                //Making the ajax request
                this.makeAJAXrequest($H({
                    xml: xmlIn,
                    successMethod: '_parseWidgets',
                    failureMethod: '',
                    ajaxID: group.key
                }));
            }
            else {
                this.createWidgets(group.key);
            }
        }.bind(this));
    },
    /*
	 * @method getWidgetsContent
	 * @desc Gets the content of the widgets
	 * @param service {Object} XML Service parameters (id, screen)
	 */
    getWidgetsContent: function(id,i) {
        var xmlIn = '<OpenHR><SERVICE>GET_WIDGET</SERVICE><ToSAP><employee id="'+this.employeeId+'"/>'
        +'<content id="'+this.data.get(this.employeeId).get(id).get('widgets')[i].get('service').get('id')+'" screen="'+this.data.get(this.employeeId).get(id).get('widgets')[i].get('service').get('screen')+'"></content><language>EN</language></ToSAP></OpenHR>';
        this.makeAJAXrequest($H({
            xml: xmlIn,
            successMethod: '_parseWidgetsContent',
            failureMethod: '_parseWidgetsContentFailure',
            ajaxID: 'var id="'+id+'"; var i='+i+'; var panel=null; var employeeId="'+this.employeeId+'";'
        }));
    },
    /*
	 * @method loadWidgetsScreenContent
	 * @desc Loads a widget screen content. E.g. in the module family legal partner
	 * @param i {Int} Widget index
	 * @param id {String} Group ID
	 * @param panel {Prototype.Element} DIV to insert the generated data
	 */
    loadWidgetsScreenContent: function(i,id,panel) {
        var service = this.data.get(this.employeeId).get(id).get('widgets')[i].get('navigationMenu')[panel].service;
        var xmlIn = '<OpenHR><SERVICE>GET_WIDGET</SERVICE><ToSAP><employee id="'+this.employeeId+'"/>'
        +'<content id="'+service.id+'" screen="'+service.screen+'"></content><language>EN</language></ToSAP></OpenHR>';
        this.makeAJAXrequest($H({
            xml: xmlIn,
            successMethod: '_parseWidgetsContent',
            failureMethod: '_parseWidgetsContentFailure',
            ajaxID: 'var id="'+id+'"; var i='+i+'; var panel='+panel+'; var employeeId="'+this.employeeId+'";'
        }));
    },
    /*
	 * @method _parseWidgetsContentFailure
	 * @desc This method is triggered when SAP returns an exception
	 * @param xml {XMLDoc} The XML Document with the error and the labels
	 * @param ajaxID {String} AJAX Request ID
	 */
    _parseWidgetsContentFailure: function(xml,ajaxID) {
        //Getting the error
        var message = selectSingleNodeCrossBrowser(xml,'//OpenHR/message/text');
        //Mapping the labels
        //this.mapLabels(xml);
        eval(ajaxID);
        this.data.get(this.employeeId).get(id).get('widgets')[i].widget.setContent('<div class="applicationmyData_widgetMainContainer"><span class="application_main_soft_text">'+this.labels.get(getText(message))+'</span></div>');
        var title = selectSingleNodeCrossBrowser(xml,'//OpenHR/title');
        this.data.get(this.employeeId).get(id).get('widgets')[i].widget.setTitle(this.labels.get(getText(title)));
        this.currentlyLoaded++;
        if(this.lastToBeLoaded+1 == this.currentlyLoaded) {
            //this._processEmployeeSelectedStack();
            this.loaded = true;
        }
    },
    /*
	 * @method _parseWidgetsContent
	 * @desc This method parses the XML information and stores it into a hash
	 * @xml {XMLObject} The XML information
	 * @ajaxID {String} The AJAX request identificator
	 */
    _parseWidgetsContent: function(xml,ajaxID) {
        //Evaluating the ID for getting the variables
        eval(ajaxID);
        //Trying to get the multipleRecord node
        var record = xml.OpenHR.multirecord;
        //This variable will store the kind for record its being parsed
        if(Object.isEmpty(panel)) {
            this.createWidgetsContent(xml,this.data.get(employeeId).get(id).get('widgets')[i].widget, this.data.get(employeeId).get(id).get('widgets')[i]);
            this._createScreenNavigation(id,i,xml);
        }
        var multipleRecord;
        //Checking for single or multiple record content
        record != undefined ? multipleRecord = true : multipleRecord = false;
        //this.mapLabels(xml);
        var labels = this.labels;
        //This variable stores the default selected panel
        var selectedPanel = -1;
        var nav = this.data.get(employeeId).get(id).get('widgets')[i].get('navigationMenu');
        for(var a = 0; a < nav.length; a++)
            if(this.data.get(employeeId).get(id).get('widgets')[i].get('navigationMenu')[a].selected == 'X')
                selectedPanel = a;
        if(!Object.isEmpty(panel))
            selectedPanel = panel;
        if(!multipleRecord) {
            try {
                var record = new singleDataRecord(xml, labels);
            }
            catch(err) {
                alert(err);
            }
            if(selectedPanel != -1)
                this.data.get(employeeId).get(id).get('widgets')[i].get('navigationMenu')[selectedPanel].screenContent.insert(record.getStructure());
            else
                this.data.get(employeeId).get(id).get('widgets')[i].widget.setContent(record.getStructure());
            this.data.get(employeeId).get(id).get('widgets')[i].widget.updateHeight();
            this.data.get(employeeId).get(id).get('widgets')[i].widget.portal.updateColumnsHeight();
        }
        else {
            try {
                var record = new multipleDataRecord(xml, labels, this.data.get(employeeId).get(id).get('widgets')[i].widget,this.virtualHtml);
            }
            catch(err) {
                alert(err);
            }
            if(selectedPanel != -1)
                this.data.get(employeeId).get(id).get('widgets')[i].get('navigationMenu')[selectedPanel].screenContent.insert(record.getStructure());
            else
                this.data.get(employeeId).get(id).get('widgets')[i].widget.setContent(record.getStructure());
            if(record.accordion)
                record.initAccordion();
            this.data.get(employeeId).get(id).get('widgets')[i].widget.updateHeight();
            this.data.get(employeeId).get(id).get('widgets')[i].widget.portal.updateColumnsHeight();
        }
        this.data.get(employeeId).get(id).get('widgets')[i].widget.windowResizedAction();
        this.data.get(employeeId).get(id).get('widgets')[i].set('contentCreated',true);
        this.currentlyLoaded++;
        if(this.lastToBeLoaded+1 == this.currentlyLoaded) {
            //this._processEmployeeSelectedStack();
            this.loaded = true;
        }
    },
    /*
	 * @method createWidgetsContent
	 * @desc Creates the widgets content using the parsed information
	 */
    createWidgetsContent: function(xml,widget,widgetData) {
        //Setting the title
        var widgetTitle = xml.OpenHR.title['#text'];
        //this.mapLabels(xml);
        widget.setTitle(this.labels.get(widgetTitle));
        var navigationContainer = new Element('div',{
            'class': 'applicationmyData_navContainer'
        });
        var regsContainer = new Element('div', {
            'class': 'applicationmyData_navContainer'
        });
        widget.setContent(new Element('div').insert(navigationContainer).insert(regsContainer));
        widgetData.set('contentElement', {
            navigation: navigationContainer,
            regs: regsContainer
        });
        widgetData.set('title', this.labels.get(widgetTitle));
    },
    /*
	 * @method _parseWidgets
	 * @desc This method process the XML
	 * @param XML {XMLObject} The XML to process
	 */
    _parseWidgets: function(xml, ID) {
        //Getting the widget elements
        var widget = xml.OpenHR.origin.widgets.widget;
        var tmpArray = new Array();
        //Parsing each widget tag
        for(var i = 0; i < widget.length; i++) {
            //Getting the graphical information (Position)
            var graphical = widget[i].graphical;
            //Getting the content service information
            var service = undefined;
            if(widget[i].service.options != undefined)
                service = widget[i].service.options.content;
            //Storing the information on a hash
            if(service != undefined) {
                tmpArray[i] = $H({
                    graphical: $H({
                        row: graphical.row,
                        col: graphical.col,
                        collapse: graphical.collapse
                    }),
                    service: $H({
                        id: service['@id'],
                        screen: service['@screen']
                    }),
                    navigationMenu: null,
                    contentCreated: false,
                    id: widget[i]['@id']
                });
            }
        }
		
        //Sorting the array
        tmpArray = this._sortWidgetsArray(tmpArray,ID);
        this.data.get(this.employeeId).get(ID).set('widgets',tmpArray);
        this.createWidgets(ID);
    },
    /*
	 * @method _createScreenNavigation
	 * @desc Parses de navigation section on the XML and generates the navigation menu to see the different screens on a widget
	 * @param id {String} Current TAB is being processed
	 * @param i {Int} Current widget is being processed
	 */
    _createScreenNavigation: function(id,i,xml) {
        //Getting the widget object
        var widget = this.data.get(this.employeeId).get(id).get('widgets')[i].widget;
        //Getting the navigation node
        var navigation;
        if(xml.OpenHR.navigation != undefined)
            navigation = xml.OpenHR.navigation.content;
        else
            navigation = [];
        //Temporary array
        var tmpArray  = new Array();
        //Parsing each navigation item
        var noSelectedPanel = true;
        for(var a = 0; a < navigation.length; a++) {
            tmpArray[a] = {
                title: navigation[a]["#text"],
                selected: navigation[a]['@selected'],
                service: {
                    id: navigation[a]['@id'],
                    screen: navigation[a]['@screen']
                },
                loaded: false,
                navigationButtonElement: new Element('div', {
                    'class': 'applicationmyData_navigationMenuItem'
                }),
                screenContent: new Element('div', {
                    'class': 'applicationmyData_screen'
                }).hide(),
                visible: false
            };
            if(navigation[a]['@selected'] == 'X')
                noSelectedPanel = false;
            //Applying the proper className depending if its selected or not
            var className = '';
            tmpArray[a].selected ? className = 'application_text_bolder' : className = 'application_action_link';
            tmpArray[a].navigationButtonElement.update('<div class="'+className+'">'+this.labels.get(tmpArray[a].title)+'</div>');
            //Inserting the navigation item on the container
            this.data.get(this.employeeId).get(id).get('widgets')[i].get('contentElement').navigation.insert(tmpArray[a].navigationButtonElement);
            //Inserting the div for the item content
            this.data.get(this.employeeId).get(id).get('widgets')[i].get('contentElement').regs.insert(tmpArray[a].screenContent);
            if(tmpArray[a].selected) {
                tmpArray[a].screenContent.show();
                tmpArray[a].visible = true;
                tmpArray[a].loaded = true;
            }
            tmpArray[a].navigationButtonElement.observe('click', this._navigationButtonClick.bindAsEventListener(this,tmpArray,a,i,id));
        }
        if(noSelectedPanel && tmpArray.length > 0) {
            tmpArray[0].selected = 'X';
            tmpArray[0].screenContent.show();
            tmpArray[0].navigationButtonElement.down().removeClassName('application_action_link').addClassName('application_text_bolder');
            tmpArray[0].visible = true;
            tmpArray[0].loaded = true;
        }
        this.data.get(this.employeeId).get(id).get('widgets')[i].set('navigationMenu',tmpArray);
    },
    _navigationButtonClick: function() {
        //Getting the arguments passed using bindAsEventListener
        var args = $A(arguments);
        //Getting the navigation buttons array
        var navigation = args[1];
        //Getting the item the clicks has been done on
        var clickedElement = args[2];
        //Getting the widgets data
        var i = args[3];
        var id = args[4];
        this.data.get(this.employeeId).get(id).get('widgets')[i].get('service').set('screen',this.data.get(this.employeeId).get(id).get('widgets')[i].get('navigationMenu')[clickedElement].service.screen);
        this._parsePositionStack(id);
        if(!this.data.get(this.employeeId).get(id).get('widgets')[i].get('navigationMenu')[clickedElement].loaded) {
            this.loadWidgetsScreenContent(i,id,clickedElement);
            this.data.get(this.employeeId).get(id).get('widgets')[i].get('navigationMenu')[clickedElement].loaded = true;
        }
        //Set the unselected className to the previous selected item and hide its content panel
        for(var j = 0; j < navigation.length; j++) {
            if(clickedElement != j) {
                if(navigation[j].visible) {
                    navigation[j].navigationButtonElement.down().removeClassName('application_text_bolder').addClassName('application_action_link');
                    navigation[j].screenContent.hide();
                    navigation[j].visible = false;
                }
            }
        }
        navigation[clickedElement].visible = true;
        //Showing its contentp panel
        navigation[clickedElement].screenContent.show();
        //Setting the selected className to the selected item
        navigation[clickedElement].navigationButtonElement.down().addClassName('application_text_bolder').removeClassName('application_action_link');
        this.data.get(this.employeeId).get(id).get('widgets')[i].widget.updateHeight();
        this.data.get(this.employeeId).get(id).get('widgets')[i].widget.portal.updateColumnsHeight();
        this.data.get(this.employeeId).get(id).get('widgets')[i].widget.windowResizedAction();
    }
});
/*
 * @class singleDataRecord
 * @desc This class fill the content of the widgets for single record data (Address, Personal Data)
 * @extends Widgets.Widget
 */
var singleDataRecord = Class.create({
    initialize: function(xml,labels,fromMultiple) {
        /*
		 * @name xml
		 * @type XMLDoc
		 * @desc Stores the xml to be parsed
		 */
        this.xml = xml;
        /*
		 * @name regPanels
		 * @type Array
		 * @desc Stores the panels for the records
		 */
        this.regPanels = new Array();
        /*
		 * @name mainContainer
		 * @type Prototype.Element
		 * @desc Contains all the panels with the personal information
		 */
        this.mainContainer = new Element('div', {
            'class': 'applicationmyData_widgetMainContainer'
        });
        /*
		 * @name currentVisiblePanel
		 * @type Int
		 * @desc Indicates the panel is currently being visualized
		 */
        this.currentVisiblePanel = 0;
        this.labels = labels;
        this.fromMultiple = fromMultiple;
        //Create the content
        this._createContent();
    },
    /*
	 * @method _createContent
	 * @desc Creates all the HTML of the widget with the parsed data from the XML
	 */
    _createContent: function() {
        var regs;
        var empty;
        if(this.fromMultiple)
            regs = this.xml;
        else
            regs = this.xml.OpenHR.record;
        if(regs != undefined) {
            if(regs.length == undefined) {
                this.regPanels = new Element('div');
                this.mainContainer.insert(this.regPanels);
                this._createRecord(regs, this.regPanels);
            }
            else
                for(var i = 0; i < regs.length; i++) {
                    this.regPanels[i] = new Element('div');
                    this.mainContainer.insert(this.regPanels[i]);
                    this._createRecord(regs[i], this.regPanels[i]);
                }
            empty = false;
            if(regs.length == 0)
                empty = true;
        }
        else {
            empty = true;
        }
        if(empty)
            this.mainContainer.insert('<span class="applicationmyData_informationText application_main_soft_text">'+this.labels.get('empty')+'</div>');
        this._showCurrentPanel();
        var a = 1;
    },
    /*
	 * @method _createRecord
	 * @desc This methods creates the div for each record on the time (Same information changing on time)
	 * @param reg {XMlObject} The record to be parsed
	 * @param panel {Prototype.Element} The panel to insert the information
	 */
    _createRecord: function(reg, panel) {
        //Getting the fields
        reg = reg.content;
        var fields = reg.fields;
        //Getting the field tags
        var field  = fields.field;
        //Generating the HTML using the fields information
        var viewMoreFields = $A();
        var noData = true;
        if(field.length == undefined)
            field = [field];
        for(var i = 0; i < field.length; i++) {
            noData = false;
            var fieldText;
            field[i]['@formattype'] == 'D' && field[i]['#text'] != null ? fieldText = sapToDisplayFormat(field[i]['#text']) : fieldText = field[i]['#text'];
            if(fieldText == null) fieldText = '&nbsp;';
            if(field[i]['@fieldtype'] != 'H')
                if(field[i]['@fieldtype'] == 'S')
                    viewMoreFields.push({
                        id: field[i]['@id'],
                        value: fieldText
                    });
                else
                    panel.insert('<div class="applicationmyData_lineContainer"><div class="applicationmyData_textTitle application_main_soft_text">'+this.labels.get(field[i]['@id'])+'</div>'
                        +'<div class="applicationmyData_textContent application_main_text">'+fieldText+'</div></div>');
        }
        //Getting the footer information
        if(viewMoreFields.length > 0) {
            var viewMore = new Element('span', {
                'class': 'applicationmyData_viewMore application_action_link'
            }).update(this.labels.get('more'));
            panel.insert(viewMore);
            var viewMoreDiv = new Element('div');
            for(var i = 0; i < viewMoreFields.length; i++)
                viewMoreDiv.insert('<div class="applicationmyData_lineContainer"><div class="applicationmyData_textTitle application_main_soft_text">'+this.labels.get(viewMoreFields[i].id)+'</div>'
                    +'<div class="applicationmyData_textContent application_main_text">'+viewMoreFields[i].value+'</div></div>')
            panel.insert(viewMoreDiv);
            viewMoreDiv.hide();
            viewMore.observe('click', function() {
                if(viewMoreDiv.style.display == 'none') {
                    viewMoreDiv.show();
                    viewMore.update(this.labels.get('less'));
                }
                else {
                    viewMoreDiv.hide();
                    viewMore.update(this.labels.get('more'));
                }
            }.bind(this));
        }
        var validity = '<div class="applicationmyData_validity"><span class="application_text_bolder">Validity date: </span>'+this._getDate(reg['@from'])+' - '+this._getDate(reg['@to'])+'</div>';
        panel.insert(validity);
        var footer = reg.footer;
        var links;
        if(!Object.isEmpty(footer))
            links = footer.link;
        else
            links = [];
        //Storing the information
        var linksData = new Hash();
        for(var i = 0; i < links.length; i++)
            linksData.set(links[i]['action'], links[i]);
        //Footer container
        var footerElement = new Element('div',{
            'class': 'applicationmyData_footer'
        });
        // PROVISIONAL !
        var noData = true;
        //Creating the previous button if needed
        if(linksData.get('previo')) {
            var arrow = new Element('div',{
                'class': 'application_verticalL_arrow applicationmyData_arrow'
            }).update('&nbsp;');
            arrow.observe('click', function() {
                this.currentVisiblePanel--;
                this._showCurrentPanel();
            }.bind(this));
            footerElement.insert(arrow);
            noData = false;
        }
        //Creating the next button if needed
        if(linksData.get('next')) {
            var arrow = new Element('div',{
                'class': 'application_verticalR_arrow applicationmyData_arrowRight'
            }).update('&nbsp;');
            arrow.observe('click', function() {
                this.currentVisiblePanel++;
                this._showCurrentPanel();
            }.bind(this));
            footerElement.insert(arrow);
            noData = false;
        }
        if(links.length > 0 && !noData)
            panel.insert(footerElement);
        var labels = this.labels;
    /*
		 * This by the moment will be disabled
		 */
    /*
		linksData.each(function(link) {
			var args = $A(arguments);
			if(link.key != 'next' && link.key != 'previo') {
				footerElement.insert(new Element('div', {'class': 'applicationmyData_footerAction'}).update(labels.get(link.value)));
			}
		}.bind(this.labels));
		*/
    },
    /*
	 * @method _showCurrentPanel
	 * @desc Shows the current selected panel
	 */
    _showCurrentPanel: function() {
        for(var i = 0; i < this.regPanels.length; i++) {
            if(this.currentVisiblePanel == i)
                this.regPanels[i].show();
            else
                this.regPanels[i].hide();
        }
    },
    /*
	 * @method getStructure
	 * @desc Gets the generated structure
	 * @return {Prorotype.Element} The container of the structuree
	 */
    getStructure: function() {
        return this.mainContainer;
    },
    /*
	 * @method _getDate
	 * @desc Convert a date in SAP format YYYYMMDD into dd.MM.yyyy
	 * @param dateStr Date to be converted
	 * @return Converted date string
	 */
    _getDate: function(dateStr) {
        var date = Date.parseExact(dateStr,'yyyyMMdd');
        if(Object.isEmpty(date))
            return '';
        else
            return date.toString('dd.MM.yyyy');
    }
});
/*
 * @class multipleDataRecord
 * @desc This class fill the content of the widgets for multiple data record (Bank details)
 */
var multipleDataRecord = Class.create({
    /*
	 * @method initialize
	 * @desc Initializes the multipleDataRecord class functionalities. Stores the XML and the labels hash and calls to the
			 funtion to create the structure
	   @param XML {XMLDocument} The xml document
	   @param labels {Hash} The labels hash
	 */
    initialize: function(xml,labels,widget,virtualHtml) {
        /*
		 * @name xml
		 * @desc XML Object with the data
		 * @type XMLDocument
		 */
        this.xml = xml;
        /*
		 * @name labels
		 * @desc Labels hash
		 * @type Prototype.Hash
		 */
        this.labels = labels;
        /*
		 * @name mainContainer
		 * @desc This element contains all the structure
		 * @type Prototype.Element
		 */
        this.mainContainer = new Element('div', {
            'class': 'applicationmyData_widgetMainContainer',
            id: 'myData_multipleRegsContainer'
        });
        /*
		 * @name widget
		 * @desc Widget object where the data is going to be generated is contain
		 * @type Widgets.Widget
		 */
        this.widget = widget;
        this.virtualHtml = virtualHtml;
        this.accordion = true;
        this._createMultipleRecords();
    },
    /*
	 * @method createMultipleRecords
	 * @desc Creates the multiple record content structure
	 */
    _createMultipleRecords: function() {
        //Getting the header tag
        var header = this.xml.OpenHR.multirecord.header;
        //Getting the footer taf
        var mainFooter = this.xml.OpenHR.multirecord.footer;
        //Getting the records
        var regs;
        if(this.xml.OpenHR.multirecord.body != undefined)
            regs = this.xml.OpenHR.multirecord.body.record;
        else
            regs = [];
        this.accordionId = Math.random().toString();
        this.accordionId = this.accordionId.gsub('\\.','');
        //var html = '<div class="applicationmyData_accordionContainer" id="myData_accordion_'+this.accordionId+'">';
        var html;
        if(regs.length == 0) {
            html = '<table><tbody>';
            this.accordion = false;
        }
        else
            html = this._generateHeader(header)+'<tbody>';
        var noData = true;
        for(var i = 0; i < regs.length; i++) {
            noData = false;
            var field;
            if(regs[i].content.fields != undefined)
                field = regs[i].content.fields.field;
            else
                field = [];
            html += '<tr class="applicationmyData_accordionToggle" style="">';
            var firstHeader = true;
            for(var j = 0; j < field.length; j++) {
                if(field[j]['@fieldtype'] == 'H') {
                    if(firstHeader)
                        html += '<td><span class="application_action_link">'+field[j]['#text'].gsub(' ','&nbsp;')+'</span></td>';
                    else
                        html += '<td>'+field[j]['#text'].gsub(' ','&nbsp;')+'</td>';
                    if(firstHeader)
                        firstHeader = false;
                }
					
            }
            var record = new singleDataRecord(regs[i],this.labels,true);
            html += '</tr><tr class="applicationmyData_accordionContent"><td colspan='+field.length+'><div class="applicationmyData_accordionContent">'+record.getStructure().innerHTML+'</div></td></tr>';
        }
        html += '</tbody></table>';
        if(noData)
            html += '<span class="applicationmyData_informationText application_main_soft_text">'+this.labels.get('empty')+'</div>';
        this.mainContainer.insert(html);
    },
    /*
	 * @method _generateHeader
	 * @desc Generates the data table header
	 * @param header Header node
	 */
    _generateHeader: function(header) {
        var field = header.field;
        var html = '<table class="applicationmyData_accordionContainer" id="myData_accordion_'+this.accordionId+'"><thead class="applicationmyData_headerContainer"><tr>';
        for(var i = 0; i < field.length; i++) {
            html += '<td class="application_main_text">'+this.labels.get(field[i]['@id']).gsub(' ','&nbsp;')+'</td>';
        }
        html += '</tr><tr><td colspan="'+field.length+'"><hr></td></tr></thead>';
        return html;
    },
    /*
	 * @method initAccordion
	 * @desc Initializes the accordion functionality, this function is called when the multiple regs data is inserted on the document
	 */
    initAccordion: function() {
        var element = this.virtualHtml.select('#myData_accordion_'+this.accordionId);
        var accordion = new Accordion('myData_accordion_'+this.accordionId,{
            classNames: {
                toggle:  'applicationmyData_accordionToggle',
                toggleActive: 'applicationmyData_accordionToggle_active',
                content: 'applicationmyData_accordionContent'
            },
            actionCallback: function() {
                this.widget.portal.updateColumnsHeight();
            //document.fire('EWS:widgets_portalUpdateHeight_' + this.widget.portal.uniqueId);
            }.bind(this),
            table: true
        });
        accordion.duration = 0;
        a = 1;
    },
    getStructure: function() {
        return this.mainContainer;
    }
});


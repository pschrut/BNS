var appNavigation  = Class.create(origin,{
    getTopMenuService: 'Get_Navigation_Menu',
    getTopMenuSuccessMethod: 'buildTopMenu',
    top: $H({}),
    createdElements: $H({}),
    tabs: $H({
        TimeData: [],
        Inbox:    [],
        Learning: [],
        OM:       []
    }),
    AppsNavigationElement:$H({
        EMP3: 'EMP3',
        CAL: 'TimeData',
        teamCalendar: 'TimeData',
        QOT: 'TimeData',
        listCalendar: 'TimeData',
        PAY: 'PAY',
        LMS: 'Learning',
        CATL: 'Learning',
        HIS: 'Learning',
        INBOX: 'Inbox',
        DEL: 'Inbox',
        LOGOFF: 'LOGOFF',
        OM_Maintain: 'OM',
        OMcostCenter: 'OM',
        OM_Display:'OM'
    }),
    tabsIndex: $H({}),
    firstApplication: null,
    activeApplications:$H({
        TimeData: '',
        Inbox:    '',
        Learning: '',
        OM: ''
    }),
    initialize: function($super){
        $super();
        document.observe( "EWS:openApplication", this.configureTopMenu.bindAsEventListener(this));
        document.observe( 'EWS:topMenu_elementClicked', this.openProperApplication.bindAsEventListener(this));
        this.createTopMenu();
    },
    createTopMenu: function(){
        var xml = "<OpenHR><SERVICE>"+this.getTopMenuService+"</SERVICE><ToSAP><language>"+global.getOption('__language')+"</language></ToSAP></OpenHR>";
        this.makeAJAXrequest($H({
            xml:xml,
            successMethod: this.getTopMenuSuccessMethod
        }));
    //this.buildTopMenu(readXmlFile('xmlOffline/GET_TOP_MENU1.xml'));

    },
    buildTopMenu: function(xmlDoc){
        //getting the applications from SAP
        var leftMenu = new Element('div', {
            id:'topMenu_left_menu_div',
            className: 'topMenu_left_menu_div'
        });
        var rightMenu = new Element('div', {
            id:'topMenu_right_menu_div',
            className: 'topMenu_right_menu_div'
        });
        $('top').insert(leftMenu);
        $('top').insert(rightMenu);
        var links = $A(xmlDoc.OpenHR.links.link);
        links.each(function(element){
            var id = element.appId;
            this.top.set(id,element["@id"]);
            if(element.select && element.select.toLowerCase() == 'x'){
                this.firstApplication = id;
            }
        }.bind(this));
        this.top.each(function(element){
            switch(element.key){
                case 'CAL':
                    if(!this.createdElements.get('TimeData'))
                    {
                        new navigationElement({
                            className: 'topMenu_application_CAL',
                            text: this.labels.get('TimeData'),
                            target: 'topMenu_left_menu_div',
                            id: 'topMenu_application_TimeData',
                            app: 'CAL'
                        });
                        this.activeApplications.set(this.AppsNavigationElement.get('CAL'),'CAL');
                        this.createdElements.set('TimeData',true);
                    }
                    this.tabs.get('TimeData').push('CAL');
                    this.tabs.get('TimeData').push('teamCalendar');
                    this.tabs.get('TimeData').push('listCalendar');
                    break;
                case 'INBOX':
                    if(!this.createdElements.get('Inbox'))
                    {
                        new rightTopNavigationElement({
                            app: element.key,
                            id: 'topMenu_rightTopLevel_Inbox',
                            text: this.labels.get(element.value),
                            className: 'topMenu_rightTopMenu_text'
                        });
                        this.createdElements.set('Inbox',true);
                        this.activeApplications.set(this.AppsNavigationElement.get('INBOX'),'INBOX');
                    }
                    this.tabs.get('Inbox').push('INBOX');
            
                    break;
                case 'QOT':
                    if(!this.createdElements.get('TimeData'))
                    {
                        new navigationElement({
                            className: 'topMenu_application_CAL',
                            text: this.labels.get('TimeData'),
                            target: 'topMenu_left_menu_div',
                            id: 'topMenu_application_TimeData',
                            app: element.key
                        });
                        this.createdElements.set('TimeData',true);
                        this.activeApplications.set(this.AppsNavigationElement.get('QOT'),'QOT');
                    }
                    this.tabs.get('TimeData').push('QOT');
                    break;
                case 'PAY':
            
                    new navigationElement({
                        className: 'topMenu_application_'+element.key,
                        text: this.labels.get(element.value),
                        target: 'topMenu_left_menu_div',
                        id: 'topMenu_application_'+element.key,
                        app: element.key
                    });
                    this.activeApplications.set(this.AppsNavigationElement.get('PAY'),'PAY');
            
            
                    break;
                case 'EMP3':
                    new navigationElement({
                        className: 'topMenu_application_'+element.key,
                        text: this.labels.get(element.value),
                        target: 'topMenu_left_menu_div',
                        id: 'topMenu_application_'+element.key,
                        app: element.key
                    });
                    this.activeApplications.set(this.AppsNavigationElement.get('EMP3'),'EMP3');
            
                    break;
                case 'LMS':
                    if(!this.createdElements.get('Learning'))
                    {
                        new navigationElement({
                            className: 'topMenu_application_'+element.key,
                            text: this.labels.get(element.value),
                            target: 'topMenu_left_menu_div',
                            id: 'topMenu_application_Learning',
                            app: element.key
                        });
                        this.createdElements.set('Learning',true);
                        this.activeApplications.set(this.AppsNavigationElement.get('LMS'),'LMS');
                    }
                    this.tabs.get('Learning').push('LMS');
                    this.tabs.get('Learning').push('CATL');
                    this.tabs.get('Learning').push('HIS');
            
                    break;
                case 'DEL':
                    if(!this.createdElements.get('Inbox'))
                    {
                        new rightTopNavigationElement({
                            app: element.key,
                            id: 'topMenu_rightTopLevel_Inbox',
                            text: this.labels.get('INBOX'),
                            className: 'topMenu_rightTopMenu_text'
                        });
                        this.createdElements.set('Inbox',true);
                        this.activeApplications.set(this.AppsNavigationElement.get('DEL'),'DEL');
                    }
                    this.tabs.get('Inbox').push('DEL');
                    break;
            }
        }.bind(this));
        new rightTopNavigationElement({
            app: 'LOGOFF',
            id: 'topMenu_rightTopLevel_LOGOFF',
            text: this.labels.get('LOGOFF'),
            className: 'topMenu_rightTopMenu_text'          
        });
        this.activeApplications.set(this.AppsNavigationElement.get('LOGOFF'),'LOGOFF');
    
        // --------------------------
        // --- OM Icon & Tabs -------
        // --------------------------
        new navigationElement({
            className: 'topMenu_application_OM',
            text: 'Org. Management',
            target: 'topMenu_left_menu_div',
            id: 'topMenu_application_OM',
            app: 'OM_Display'       
        });
        this.activeApplications.set(this.AppsNavigationElement.get('OM_Display'),'OM_Display');
        this.tabs.get('OM').push('OM_Display');
        this.tabs.get('OM').push('OM_Maintain');
        this.tabs.get('OM').push('OMcostCenter');
        this.labels.set('OM_Display', 'Display');
        this.labels.set('OM_Maintain', 'Maintain');
        this.labels.set('OMcostCenter', 'Cost Center');
        // --------------------------

        //Creating the tabs
        this.tabs.each(function(app){
            if(app.value.size()>0){
                var labels = [];
                var ids = [];
                var index = 1;
                $A(app.value).each(function(element){
                    labels.push(this.labels.get(element));
                    ids.push(element);
                    this.tabsIndex.set(element,index);
                    index++;         
                }.bind(this));
                var floatingTabs = new Element('div',{
                    className:'appNavigation_floatingTab',
                    name:'floating',
                    id:'floatingTabs'+app.key
                });
                $('fwk_5_bottom').insert(floatingTabs,{
                    position:'top'
                });
                var options = $H({
                    labels         : labels,
                    ids            : ids,
                    events         : $H({
                        onTabClicked: 'EWS:appNavTabClicked_'+app.key
                    }),
                    active         : 1,
                    firstRun       : 'n',
                    mode           : 'normal',
                    target         : 'floatingTabs'+app.key
                });
                var appNavtab = new Tabs(options);
                floatingTabs.hide();
            }
    
        }.bind(this));
    
        var url_app = getURLParam('app');
        if(global.applicationMap.get(url_app) && this.top.get(global.applicationMap.get(url_app))){
            this.firstApplication = global.applicationMap.get(url_app);
        }
        if(this.firstApplication){
            this.activeApplications.set(this.AppsNavigationElement.get(this.firstApplication),this.firstApplication);
        }
        //done in firstRequest.js file
        //document.fire('EWS:openApplication',$H({app:this.firstApplication}));
        this.configureTopMenu($H({
            app:'CAL'
        }));
        //hard coded for the moment
        $('fwk_print').observe('click', function() {
            window.print();return false;
        });
    },

    configureTopMenu: function(event){

        var args = getArgs(event);

        if(!args.get('mode')){
            
            if((args.get('app')=="BOOK") || (args.get('app')=="PREB") || (args.get('app')=="CUR") || (args.get('app')=="ADVS")){
                document.fire('EWS:navigationElementClicked','Learning');
                var tabs_set_aux = $$('div[name="floating"]');
                tabs_set_aux.each(function(pair){
                    pair.hide();
                });
            }else{
    
                var parent = this.AppsNavigationElement.get(args.get('app'));
                this.activeApplications.set(parent,args.get('app'));
                document.fire('EWS:navigationElementClicked',parent);
                var id = args.get("app");
                var tabs_set = $$('div[name="floating"]');
                tabs_set.each(function(pair){
                    pair.hide();
                });
                if($('floatingTabs'+parent)){
                    document.fire('EWS:selectTab',{
                        target:'floatingTabs'+parent,
                        number:this.tabsIndex.get(args.get('app'))
                    });
                    $('floatingTabs'+parent).show();
                }
            }
        }
    },
    openProperApplication: function(event){
        var args = getArgs(event);
        if(args != 'LOGOFF')
            document.fire('EWS:openApplication',$H({
                app:this.activeApplications.get(args)
            }));
        else
            document.fire('EWS:openApplication',$H({
                mode:'popUp',
                app:this.activeApplications.get(args)
            }));
    }

});
/*
 *@class navigationElement
 *@desc <short description>
 */
var navigationElement = Class.create({    
    element: null,    
    html: new Template(  "<div class='topMenu_navigationElement_div_up #{className}'></div>" +
        "<div class='topMenu_navigationElement_div_down'><span class='application_main_text topMenu_text'>#{text}</span></div>"
        ),
    skinActive: null,   
    skinInactive: null,    
    type: null,    
    id: null,    
    app: null,    
    initialize: function(options){//className,text,target
        document.observe('EWS:navigationElementClicked',this.someClicked.bindAsEventListener(this));
        this.app = options.app;
        this.id = options.id;
        this.element = new Element('div',{
            id:this.id,
            className:'topMenu_navigationElement'
        });
        this.element.update(this.html.evaluate(options));
        $(options.target).insert(this.element);
        this.skinInactive = options.className;
        this.skinActive = this.skinInactive + '_active';
        this.mout = {
            fx: function() {
                this.mouseOut();
            }.bind(this)
        };
        this.mout.bfx = this.mout.fx.bindAsEventListener(this.mout);
        this.mover = {
            fx: function() {
                this.mouseOver();
            }.bind(this)
        };
        this.mover.bfx = this.mover.fx.bindAsEventListener(this.mover);
        this.clk = {
            fx: function() {
                this.clicked();
            }.bind(this)
        };
        this.clk.bfx = this.clk.fx.bindAsEventListener(this.clk);
        this.eventsOn();
        this.hideText();
        this.id = this.id.gsub('topMenu_application_','');
    },    
    mouseOver: function(){
        this.element.down().removeClassName(this.skinInactive);
        this.element.down().addClassName(this.skinActive); 
        this.showText();
    },
    mouseOut: function(){
        this.element.down().removeClassName(this.skinActive);
        this.element.down().addClassName(this.skinInactive);
        this.hideText();    
    },
    selected: function(){    
        this.mouseOver();
        this.eventsOff();
        this.element.down('span').addClassName('topMenu_text_selected');
        this.element.setStyle({
            cursor:'default'
        });
    },    
    unSelected: function(){
        this.mouseOut();
        this.eventsOn();
        this.element.down('span').removeClassName('topMenu_text_selected');
        this.element.setStyle({
            cursor:'pointer'
        });
    },
    eventsOn: function(){
        this.element.down().observe('click',this.clk.bfx);
        this.element.down().observe('mouseover',this.mover.bfx);
        this.element.down().observe('mouseout',this.mout.bfx);    
    },
    eventsOff: function(){
        this.element.down().stopObserving('click',this.clk.bfx);
        this.element.down().stopObserving('mouseover',this.mover.bfx);
        this.element.down().stopObserving('mouseout',this.mout.bfx);    
    },        
    clicked: function(){       
        document.fire('EWS:topMenu_elementClicked',this.id);        
    },
    someClicked: function(event){
       
        var id = getArgs(event);
	   
        if(id != this.id){
            this.unSelected();
        }else{
            this.selected();
        }
    },    
    hide: function(){
        this.element.hide();
    },    
    show: function(){
        this.element.show();
    },   
    hideText: function(){
        this.element.down('span').hide();        
    },    
    showText: function(){
        this.element.down('span').show();
    }
});
var rightTopNavigationElement = Class.create({
    targetDiv: 'banner',
    element: null,
    html: new Template("<span class='application_main_text #{className}'>#{text}</span>"),
    type: null,
    app: null,
    id: null,
    initialize: function(options){
        document.observe('EWS:navigationElementClicked',this.someClicked.bindAsEventListener(this));
        this.app = options.app;
        this.id = options.id;
        this.element = new Element('div',{
            id:this.id,
            className:'topMenu_rightTopNavigationElement'
        });
        this.element.update(this.html.evaluate(options));
        $(this.targetDiv).insert(this.element);
        this.mout = {
            fx: function() {
                this.mouseOut();
            }.bind(this)
        };
        this.mout.bfx = this.mout.fx.bindAsEventListener(this.mout);
        this.mover = {
            fx: function() {
                this.mouseOver();
            }.bind(this)
        };
        this.mover.bfx = this.mover.fx.bindAsEventListener(this.mover);
        this.clk = {
            fx: function() {
                this.clicked();
            }.bind(this)
        };
        this.clk.bfx = this.clk.fx.bindAsEventListener(this.clk);
        this.eventsOn();
        this.id = this.id.gsub('topMenu_rightTopLevel_','');
    },
    someClicked: function(event){
		
        var id = getArgs(event);
		      
        if(id != this.id){
            this.unSelected();
        }else{
            if(this.id != 'LOGOFF'){
                this.selected();
            }
        }
    },
    mouseOver: function(){        
        this.element.down().addClassName('topMenu_text_selected');
    },
    mouseOut: function(){        
        this.element.down().removeClassName('topMenu_text_selected');  
    },
    selected: function(){    
        this.mouseOver();
        this.eventsOff(); 
        this.element.setStyle({
            cursor:'default'
        });
    },    
    unSelected: function(){
        this.mouseOut();
        this.eventsOn(); 
        this.element.setStyle({
            cursor:'pointer'
        });
    },
    eventsOn: function(){
        this.element.down().observe('click',this.clk.bfx);
        this.element.down().observe('mouseover',this.mover.bfx);
        this.element.down().observe('mouseout',this.mout.bfx);    
    },
    eventsOff: function(){
        this.element.down().stopObserving('click',this.clk.bfx);
        this.element.down().stopObserving('mouseover',this.mover.bfx);
        this.element.down().stopObserving('mouseout',this.mout.bfx);    
    },
    clicked: function(){  
        document.fire('EWS:topMenu_elementClicked',this.id);             
    }
});
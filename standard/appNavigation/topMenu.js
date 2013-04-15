/*
 *@fileoverview topMenu.js
 *@desc the navigation topMenu is handled by the classes defined here
 */


/*
 *@class appNavigation
 *@desc the topMenu global object instantiates this class 
 *@inherit origin
 */

var appNavigation  = Class.create(origin,{

    oldFirstApplication: null,/*go live 20th January*/ 
    oldAppLabels: $H({}),/*go live 20th January*/ 
    oldXML: null,
    /*
     *@name xml
     *@type xmlDoc 
     *@desc This variable keeps the xml got from the back-end
     */
    xml: null,
    /*
     *@name tabsWidth
     *@type Long 
     *@desc Individual tab width
     */
    tabsWidth: 121,
    /*
     *@name tabsStructure
     *@type Hash
     *@desc All the application tabs structure is kept here
     */
    tabsStructure: $H({}),
    /*
     *@name applicationsStructure
     *@type Hash 
     *@desc All the right-left part navigation elements relationships
     *are kept here
     */
    applicationsStructure: $H({}),//will be deleted perhaps
    /*
     *@name activeSubLinks
     *@type Hash
     *@desc To keep all the right navigation elements active left elements
     */
    activeSubLinks: $H({}),//active lowLevelElement id 
    /*
     *@name activeTabs
     *@type Hash 
     *@desc To keep all the left navigation elements active tabs
     */
    activeTabs: $H({}),
    /*
     *@name topMenu
     *@type Hash 
     *@desc To keep all the left and right navigation elements(their html related objects)
     */
    topMenu: $H({}),
    /*
     *@name rightTopMenu
     *@type Hash 
     *@desc To keep all the right top Menu navigation elements(Inbox, settings and logoff)
     */ 
    rightTopMenu: $H({}),
    /*
     *@name firstApplication
     *@type String 
     *@desc To keep the first application id that has to be run
     */  
    firstApplication: null,
    initialize: function($super){
        $super();
        if(getURLParam ('topMenu') == 'false')$('top').hide();
        //this.isOffline = true;  
        this.buildTopMenu();
    },
    /*
     *@method buildTopMenu
     *@param xmlDoc {xmlDoc} xml got from the back-end
     *@desc Creates, initializes and inserts the Navigation Menu html 
     *into the framework html
     */ 
    buildTopMenu: function(xmlDoc){
        this.xml = xmlDoc;
        this.readTopMenuStructure();
        //this.createTabs();
        //main divs    
        var leftMenu = new Element('div', {id:'topMenu_left_menu_div',className: 'topMenu_left_menu_div'});        
        var rightMenu = new Element('div', {id:'topMenu_right_menu_div',className: 'topMenu_right_menu_div'});                     
        $('top').insert(leftMenu);  
        $('top').insert(rightMenu);       
        //*************go live 20th January********************/
            this.activeSubLinks.each(function(element){
                if(!this.oldAppLabels.get(element.value)){
                    this.activeSubLinks.unset(element.key);
                }
            }.bind(this));
            this.activeTabs.each(function(element){
                if((!this.oldAppLabels.get(element.value))||(!this.oldAppLabels.get(element.key))){
                    this.activeTabs.unset(element.key);
                }            
            }.bind(this));
            this.applicationsStructure.get('workforceAdministration').each(function(element){
                if(!this.oldAppLabels.get(element.key)){
                    this.applicationsStructure.get('workforceAdministration').unset(element.key);
                }
            
            }.bind(this));
        //*****************************************************/         
        //Creating topMenu elements
        this.applicationsStructure.each(function(link){
            var aux = new navigationElement({
                        className: 'topMenu_application_'+link.key,
                        text: this.labels.get(link.key),
                        target: 'topMenu_right_menu_div',
                        id: 'topMenu_application_'+link.key,
                        type: 'high',
                        app: link.key         
            });
            this.topMenu.set(link.key,aux);
            aux.hideText();
            link.each(function(sublink){
                  var auxLow = new navigationElement({
                        className: 'topMenu_application_'+sublink.key,
                        text: this.labels.get(sublink.key),//sublink.value in fact--> go live 20th Jan
                        target: 'topMenu_left_menu_div',
                        id: 'topMenu_application_'+sublink.key,
                        type: 'low',
                        parent: link.key,
                        app: sublink.key
                  });
                  this.topMenu.set(sublink.key,auxLow);
                  auxLow.hide();
                  auxLow.hideText();
            }.bind(this));
        }.bind(this));    
       this.navigationData.get('topMenu').each(function(element){
            var app = element.value.get('appId');
            //*************go live 20th January********************/
                var rightTopElement = new rightTopNavigationElement({
                        type: 'rightTop',
                        app: app,
                        id: 'topMenu_rightTopLevel_' + element.value.get('appId'),
                        text: element.value.get('name'),//should be get...('label') --> go live 20th Jan
                        className: 'topMenu_rightTopMenu_text'          
                });              
                this.rightTopMenu.set(app,rightTopElement);
                $('banner').insert(rightTopElement.element);
                if(element.value.get('active')&&(element.value.get('active').toLowerCase() == 'x') && !this.firstApplication)
                    this.firstApplication = app;
        
        }.bind(this));   
        
        
        /*go live 20th January*/
        //*****************************************************************************************
        //here reading the active application from the old xml        
        
        var oldXml_app = this.oldFirstApplication;       
        this.firstApplication = oldXml_app;
        if(this.topMenu.get(this.firstApplication) && (this.topMenu.get(this.firstApplication).type == 'low')){
                this.activeSubLinks.set(this.topMenu.get(this.firstApplication).parent,this.firstApplication);
        }else{
                this.activeTabs.set(this.searchAppSecondLevel(this.firstApplication).get('parent'),this.firstApplication);
        }
              
            
        //*****************************************************************************************    
            
        var url_app = getURLParam('app');       
        if(global.applicationMap.get(url_app)){
            this.firstApplication = global.applicationMap.get(url_app);
            if(this.topMenu.get(this.firstApplication) && (this.topMenu.get(this.firstApplication).type == 'low')){
                this.activeSubLinks.set(this.topMenu.get(this.firstApplication).parent,this.firstApplication);
            }else{
                this.activeTabs.set(this.searchAppSecondLevel(this.firstApplication).get('parent'),this.firstApplication);
            }
        }  
        document.fire('EWS:openApplication',$H({app:this.firstApplication}));
    },
    /*
     *@method selectElement
     *@param app {String} the navigation element clicked id
     *@desc Sets the proper Navigation menu configuration depending 
     *on the navigation element clicked (depending on its type), and
     *if it´s the case, opens the convenient application
     */ 
    selectElement: function(app){ 
                var id = app.get('app');                
                if(this.rightTopMenu.get(id)||this.rightTopMenu.get(this.searchAppSecondLevel(id).get('parent'))){
                        
                        if(id.toLowerCase() != 'logoff'){
                            this.resetTopMenu();
                            if(this.rightTopMenu.get(id)){
                                var aux = this.rightTopMenu.get(id);
                                aux.selected();
                                aux.element.down().setStyle({cursor:'default'});
                                aux.element.down().stopObserving('mouseout',aux.obj.bfx);
                                aux.element.down().stopObserving('click',aux.clk.bfx);
                                
                            }else{
                                var parent = this.rightTopMenu.get(this.searchAppSecondLevel(id).get('parent'));
                                parent.selected();
                                parent.element.down().setStyle({cursor:'default'});
                                parent.element.down().stopObserving('mouseout',parent.obj.bfx);
                                parent.element.down().stopObserving('click',parent.clk.bfx);
                            }                        
                        }
                        
                        if(this.activeTabs.get(id)){
                            this.setTabsConfiguration($H({app:this.activeTabs.get(id)}));
                        }else{                            
                            var mode = (id.toLowerCase() == 'logoff')?'popUp':null;                                                    
                            this.setTabsConfiguration($H({app:id,mode:mode}));
                        }
                }else{  
                        this.resetTopMenu();    
                        this.showProperLeftElements(id);                    
                        //if the element belongs to the right menu(High level elements)    
                        if( this.topMenu.get(id) && (this.topMenu.get(id).type == 'high') ){             
                            this.elementSelected(id);            
                            if(id == 'strategy' || id == 'analyticalInsight')
                            {                               
                                this.setTabsConfiguration($H({app:id}));           
                            }else{
                                //the active left element(low level element) related to the right clicked one selected
                                var son = this.topMenu.get(this.activeSubLinks.get(id));
                                this.elementSelected(son.app);                       
                                var appId = this.activeSubLinks.get(id);                            
                                if(this.activeTabs.get(appId)){
                                    this.setTabsConfiguration($H({app:this.activeTabs.get(appId)}));                        
                                }else{
                                    this.setTabsConfiguration($H({app:appId}));  
                                }                    
                            }              
                        //if the element belongs to the left menu(Low level elements-->applications itselves)          
                        }else if( this.topMenu.get(id) && (this.topMenu.get(id).type == 'low')){
                            
                            this.elementSelected(id);
                            var aux = this.topMenu.get(id);
                            this.elementSelected(aux.parent);                    
                            this.activeSubLinks.set(aux.parent,id);                                 
                            if(this.activeTabs.get(id)){
                                this.setTabsConfiguration($H({app:this.activeTabs.get(id)}));                        
                            }else{
                                this.setTabsConfiguration($H({app:id}));  
                            }                        
                        }else{                           
                            var leftParent = this.topMenu.get(this.searchAppSecondLevel(id).get('parent'));
                            var rightParent = this.topMenu.get(leftParent.parent);                
                            this.elementSelected(leftParent.app);
                            this.elementSelected(rightParent.app);                  
                            this.activeSubLinks.set(rightParent.app,leftParent.app);
                            this.setTabsConfiguration($H({app:id})); 
                        }
                        
                }    
     },    
     setTabsConfiguration: function(args){
              var a = 0;    
              if(!args.get('mode')){  
                var id = args.get("app");            
                var tabs_set = $$('div[name="floating"]');
                tabs_set.each(function(pair){
                      pair.hide();
                });
                var hash = this.searchAppSecondLevel(id);
                var parent = hash.get('parent');
                var bool = hash.get('isThere');           
                if(bool){
                    var index = hash.get('index');
                    document.fire('EWS:selectTab',{target:'floatingTabs'+parent,number:index});
                    this.activeTabs.set(parent,id);     
                    $('floatingTabs'+parent).show();                
                }  
              }
    },   
    /*
     *@method elementSelected
     *@param id {String} navigation element selected id
     *@desc set the proper interface configuration for a single 
     *selected navigation element
     */ 
    elementSelected: function(id){
                var navElement = this.topMenu.get(id);                
                navElement.selected();                    
                navElement.element.down().setStyle({cursor:'default'});
                navElement.element.down().stopObserving('mouseout',navElement.obj.bfx);
                navElement.element.down().stopObserving('click',navElement.clk.bfx);               
                navElement.element.down('span').addClassName('topMenu_text_selected');    
    }, 
    /*
     *@method resetTopMenu
     *@desc sets the initial interface whole Navigation Menu configuration
     */    
    resetTopMenu: function(){    
            this.topMenu.each(function(element){
               var el = element.value;                       
               
               /*go live 20th January*/
               
               el.unSelected();//unselected
               el.element.down().setStyle({cursor:'pointer'});
               el.element.down().observe('mouseout',el.obj.bfx);//mouseout activated
               el.element.down().observe('click',el.clk.bfx);
               el.element.down('span').removeClassName('topMenu_text_selected');
               el.show();
               /*
               //if the element belongs to the left menu, we hide it 
               if(el.type == 'low'){
                    el.hide(); 
               //if not, it is a high level element, so should be unselected and deactivated
               }else{
                    el.unSelected();//unselected
                    el.element.down().setStyle({cursor:'pointer'});
                    el.element.down().observe('mouseout',el.obj.bfx);//mouseout activated
                    el.element.down().observe('click',el.clk.bfx);
                    el.element.down('span').removeClassName('topMenu_text_selected');
               }*/
            }.bind(this));
            this.rightTopMenu.each(function(element){
                var el = element.value;
                el.unSelected();
                el.element.down().setStyle({cursor:'pointer'});
                el.element.down().observe('mouseout',el.obj.bfx);
                el.element.down().observe('click',el.clk.bfx);                                   
            }.bind(this));    
    },   
    /*
     *@method showProperLeftElements
     *@param id {String} right navigation element id
     *@desc Shows and sets the proper configuration for the left navigation
     *elements related to the right navigation element which id has been
     *passed as a parameter to the function
     */  
    showProperLeftElements: function(id){                  
                 var aux = '';                
                 if( this.topMenu.get(id) && (this.topMenu.get(id).type == 'high')){                 
                    aux = id;                 
                 }else if( this.topMenu.get(id) && (this.topMenu.get(id).type == 'low')){
                    aux = this.topMenu.get(id).parent;
                 }else{
                    var leftParent = this.topMenu.get(this.searchAppSecondLevel(id).get('parent'));
                    var rightParent = this.topMenu.get(leftParent.parent);
                    aux = rightParent.app;                 
                 }                
                 this.applicationsStructure.get(aux).each(function(element){
                       var el = this.topMenu.get(element.key);
                       el.show();//shown
                       el.unSelected();//unSelected
                       el.element.down().setStyle({cursor:'pointer'});
                       el.element.down().observe('mouseout',el.obj.bfx);//mouseout activated
                       el.element.down().observe('click',el.clk.bfx);
                       el.element.down('span').removeClassName('topMenu_text_selected');
                 }.bind(this));
    },
    /*
     *@method searchAppSecondLevel
     *@param appName {String} application id to look for into the
     *tabsStructure class attribute
     *@desc returns if the application id passed to it, it has tabs related
     *to itself, and if it´s the parent tab application or not(if not,
     *returns the parent tab application as well)
     *@return Hash
     */ 
    searchAppSecondLevel: function(appName){
        var bool = false;
        var parent_application = null;
        var appIndex = -1;
        this.tabsStructure.find(function(app){
            if(app.value.get('appsIds').include(appName)){
                bool = true;
                parent_application = app.value.get('appsIds')[0];
                appIndex = app.value.get('appsIds').indexOf(appName)+1;
                return true;
            }
        });
        return $H({isThere:bool,parent:parent_application,index:appIndex});
    },
    /*
     *@method createTabs
     *@desc Creates all the tabs objects depending on the tab configuration
     *set on the xml got from the back-end (and keeps it into the 
     *tabsStructure class attribute)
     */ 
    createTabs: function(){
        var tabsHandlers = selectNodesCrossBrowser(this.xml,'//tabs');
        for(var iterHandler = 0;iterHandler<tabsHandlers.length;iterHandler++){
            var applicationId = tabsHandlers[iterHandler].parentNode.getAttribute('app');
            var arrayLabels = [];
            var arrayIds = [];
            var appHash = $H({});
            var tabs = tabsHandlers[iterHandler].getElementsByTagName('tab');
            for(var iterTab = 0;iterTab<tabs.length;iterTab++){
                arrayIds.push(tabs[iterTab].getAttribute('app'));
                arrayLabels.push(this.labels.get(tabs[iterTab].getAttribute('app'))); //getAttribute('label') in fact --> go live 20th Jan
                var activeTab = tabs[iterTab].getAttribute('active');
                if(activeTab && (activeTab.toLowerCase()=='x')){
                       var parent = tabsHandlers[iterHandler].parentNode.parentNode.getAttribute('label');
                       var activeLeft = tabsHandlers[iterHandler].parentNode.getAttribute('app');                       
                       this.activeTabs.set(activeLeft,tabs[iterTab].getAttribute('app'));
                       this.activeSubLinks.set(parent,activeLeft);
                       this.firstApplication = tabs[iterTab].getAttribute('app');
                       
                }
            }
            appHash.set('labels',arrayLabels);
            appHash.set('appsIds',arrayIds);                     
            this.tabsStructure.set(applicationId,appHash);
        }
        
        this.tabsStructure.each(function(element){
                
                if(!this.oldAppLabels.get(element.key)){
                    this.tabsStructure.unset(element.key);
                }else{
                    
                    for(var iter = 0;iter<element.value.get('appsIds').size();iter++){
                        if(!this.oldAppLabels.get(element.value.get('appsIds')[iter]) 
                                && (element.value.get('appsIds')[iter] != 'listCalendar')
                                && (element.value.get('appsIds')[iter] != 'CATL')
                                && (element.value.get('appsIds')[iter] != 'HIS')
                                && (element.value.get('appsIds')[iter] != 'teamCalendar')){
                            element.value.set('appsIds',element.value.get('appsIds').without(element.value.get('appsIds')[iter]));
                            element.value.set('labels',element.value.get('labels').without(element.value.get('labels')[iter]));
                        }
                    }
                }
            
        }.bind(this));
        
        //Creating tabs handlers with the previous information
        this.tabsStructure.each(function(app){
             var floatingTabs = new Element('div',{className:'appNavigation_floatingTab',name:'floating',id:'floatingTabs'+app.key}); 
             $('fwk_5_bottom').insert(floatingTabs,{position:'top'});
             //var size = app[1].get('appsIds').size() * this.tabsWidth;
             var options = $H({
                    labels         : app.value.get('labels'),
                    ids            : app.value.get('appsIds'),
                    events         : $H({onTabClicked: 'EWS:appNavTabClicked_'+app.key}),
                    active         : 1,
                  //callback       :  ,
                    firstRun       : 'n',
                    mode           : 'normal',
                  //width          : ,                   
                    target         : 'floatingTabs'+app.key
                });
             var appNavtab = new Tabs(options);
             floatingTabs.hide();
        }.bind(this));
    
    },
    /*
     *@method readTopMenuStructure
     *@desc initializes the applicationsStructure class attribute
     *that represents the relationships among the different right
     *navigation elements and their related left navigation elements
     */ 
    readTopMenuStructure: function(){
        this.navigationData.get('mainMenu').each(function(link){
              var subLinks = $H({});  
              var linkLabel = link.key;
              link.value.get('subMenu').each(function(sublink){
                    var subLinkLabel = sublink.key;
                    var subLinkApp = sublink.value.get('appId');
                    subLinks.set(subLinkApp,subLinkLabel);
                    if(sublink.value.get('active') && (sublink.value.get('active').toLowerCase() == 'x')){
                        this.activeSubLinks.set(linkLabel,subLinkApp);
                        if(!this.firstApplication)
                            this.firstApplication = subLinkApp;
                    }else{
                        if(!this.activeSubLinks.get(linkLabel)){
                            this.activeSubLinks.set(linkLabel,subLinkApp);
                        }
                    }
              }.bind(this));                 
              this.applicationsStructure.set(linkLabel,subLinks);                  
        }.bind(this));        
    }
});

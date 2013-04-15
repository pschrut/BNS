/*
 *@fileoverview tabs.js
 *@desc tab handler class implemented here, a component to manage a number of different
 *contents using tabs.
 */

/*
 *@class Tabs
 *@desc this class represents the tab handler
 */
var Tabs = Class.create({
    /*
    *@method initialize
    *@param options {Hash} keeps the whole options we need to create the tab handler:
    *ids,callback function, target, labels, active tab, mode and total width.
    *@desc creates every div part of the tab handler, with the proper attributes
    */
    initialize: function(options){            
        //GETTING THE OPTIONS TO BUILD THE TAB HANDLER
        /*
         *@name ids
         *@type String 
         *@desc the id of the tab (not the label) 
         */ 
         this.ids = options.get('ids');
         /*
         *@name active
         *@type Long 
         *@desc the first active tab
         */
        this.active = options.get('active');
        if(!this.active ||!Object.isNumber(this.active))this.active = 0;
        /*
         *@name callback
         *@type function 
         *@desc if defined, it is the function that is executed when the tab is clicked
         */ 
        //Here it is defined a default callback function
        this.callback = function() {}
        if(options.get('callback')){
            var callbackDefined = true;
            this.callback = options.get('callback'); 
        }       
        /*
         *@name target
         *@type String 
         *@desc the html element id where we have to set the tab handler 
         */     
        this.target = options.get('target');
        /*
         *@name labels
         *@type Array 
         *@desc labels array used to identify every tab, every field of this array is set as the 
         *related tab title
         */
        this.labels = options.get('labels'); 
        /*
        *@name events
        *@type hash 
        *@desc hash with the events id
        */
        this.events = options.get('events');        
        /*
         *@name mode
         *@type String
         *@desc the way we have to create the tab handler(setting the default 
         *width in the framework, or being able to choose the width)
         */
        this.mode = options.get('mode');
        if(!this.mode||(this.mode!='normal'&&this.mode!='max'))this.mode = 'normal';
        /*
         *@name firstRun
         *@type String
         *@desc with this parameter is defined if the callback function is executed for the default active tab 
         */
        var firstRun = false;
        this.firstRun = options.get('firstRun');
        if(this.firstRun == 'y' || this.firstRun == 'Y' || this.firstRun == 'yes' || this.firstRun == 'YES') {
            firstRun = true;
        }
        /*
         *@name total_width
         *@type Long 
         *@desc in 'max' mode represents the width to be set, in 'normal' mode it is not used
         */
        this.total_width = options.get('width');
        //default width
        if(!this.total_width||!Object.isNumber(this.total_width))this.total_width = screen.width/2;                  
        //CREATING ADDITIONAL PARAMETERS  
        /*
         *@name number
         *@type Long 
         *@desc it calculates the number of tabs to create
         */  
        if(this.labels){      
            this.number = this.labels.length;
        }else{
            // default configuration for labels, only if there are not labels defined.
            this.labels = ['1','2','3','4'];
            this.number = 4;
        }
        /*
         *@name tabs_array
         *@type Array 
         *@desc to keep here all the tab elements we´re going to create
         */     
        this.tabs_array = [];
      
        //CHECKING OPTIONS
        if(($(this.target)) && this.number > 0 && this.number <= 20 && this.active >= 0 && this.active <= this.number){
            //WE HAVE TWO MODES, THE NORMAL MODE: THE MAIN DIV ALWAYS HAVE THE SAME WIDTH,
            //IN FACT THE SAME WIDTH AS THE APPLICATIONS CONTAINER, ONLY CAN SET THE NUMBER
            //OF TABS.
            //THE MAX MODE: YOU CAN SET THE WIDTH AND THE NUMBER OF TABS
            if(this.mode == 'normal'){
              //GETTING THE PROPER width FOR THE DIVS IN NORMAL MODE
              var maxLength = 0;
              var labelLength;
              for (var i = 0; i < this.labels.length ; i++){
                 if(Object.isString(this.labels[i])){   // defined letter
                    labelLength = this.labels[i].stripTags().replace('.','').replace(' ','').length;    //for calculating the width, '.' and ' '
                 }else{                                                                 //make the tab too long
                    labelLength = 9; // undefined (9 letters)
                 }   
                 if(labelLength > maxLength)maxLength = labelLength;
              }            
              var cssRuleTabs;
              var cssRule;
              var fontSize = 12;    //default value, in case of .tabs_title_active property not defined in CSS2.css
              if (document.all){    //IE
                var cssRule = document.styleSheets[0].rules;
              }else{    //FIREFOX
                var cssRule = document.styleSheets[0].cssRules;
              }  
              for (i=0; cssRuleTabs=cssRule[i]; i++){
                if (cssRuleTabs.selectorText.toLowerCase() == '.tabs_title_active' )
                    fontSize = cssRuleTabs.style.fontSize.substr(0,cssRuleTabs.style.fontSize.length - 2);
              }
              this.container_width = parseInt((fontSize-3) * maxLength);
              this.container_width += 24;   //beginning and ending of the tab
              this.total_width = this.container_width * this.number;
              this.center_width = this.container_width - 24;
              this.out = 0;       
            }else if(this.mode == 'max'){
              //GETTING THE PROPER width FOR THE DIVS IN MAX MODE
              this.container_width = parseInt(this.total_width/this.number);
              this.center_width = this.container_width - 24;
              this.out =(this.total_width)-(this.container_width*this.number); 
            }
        }
        else{ alert('Tabs Options invalid'); return;}             
        
        //it is defined the event for changing the tabs interface
        this.obj = {
              fx: function(event) {
                  this.throwEventClicked(event.element().identify());
              }.bind(this)       
        };
        this.obj.bfx = this.obj.fx.bindAsEventListener(this.obj);
        //INITIALIZING OF EVENTS 
        if(this.events && this.events.get('onTabClicked')){
            document.observe(this.events.get('onTabClicked'), function(event) {
                var args = getArgs(event);
                var throwEvent = true;
                this.manageTabs(args, throwEvent, callbackDefined);
            }.bindAsEventListener(this));
        }    
		
        document.observe('EWS:selectTab', function(event) {
            var args = getArgs(event);
            var tar = args.target;
            var num = args.number;
            if (this.target == tar) {
                this.currentSelected = num;
                this.openTab('num_' + num);
            }
        }.bindAsEventListener(this));          
        
        //*************************************************************************
        //TOTAL DIV INIT
        //*************************************************************************
        var aux_size; 
        /*
         *@name total
         *@type DispHTMLDivElement
         *@desc the main div, that contains the whole tabs handler
         */        
        this.total = new Element('div',{className: ''});
        if(this.mode == 'max'){
            aux_size = this.total_width + 'px';
            this.total.setStyle({width:aux_size});
        }    
        //*************************************************************************
        //TABS DIVS INIT
        //*************************************************************************
        var tabs_id = this.target + 'all_tabs';   
        /*
         *@name tabs
         *@type DispHTMLDivElement 
         *@desc the div that keeps all the tab div elements
         */        
        this.tabs = new Element('div',{id:tabs_id, className:'tabs_tabs'});
        if(this.mode == 'max'){
            aux_size = this.total_width + 'px';
            this.tabs.setStyle({width:aux_size});
        }                  
        this.menuTabsItems = [];
        this.lastTabShown = -1;
        for(var iter = 1; iter <= this.number; iter++){
            var id_aux = this.target + 'num_' + iter;
            var tab = new Element('div',{id:id_aux , className:'tabs_tabs_container'});
            this.tabs_array.push(tab);
            var itIsActive = (iter == this.active)?'_active':'';
            var itIsHash = this.chooseInterface(iter, this.number, this.active);
            var itIsActiveLeft = itIsHash.get('left');
            var itIsActiveRight = itIsHash.get('right');
            var html_aux = "<div id='el1_"+iter+"' class='tabs_tabs_content_left"+itIsActiveLeft+"'></div>"
	                      +"<div id='el2_"+iter+"' class='tabs_tabs_content_center"+itIsActive+"'>"
	                      + "<span id='el3_" + iter + "' style='font-size:3px'><br /></span><button id='el4_" + iter + "' class='tabs_title" + itIsActive + "'>" + this.labels[iter - 1] + "</button>"
	                      +"</div>"
	                      +"<div id='el5_"+iter+"' class='tabs_tabs_content_right"+itIsActiveRight+"'></div>";
            this.tabs_array[iter-1].update(html_aux);
            var out_var = (iter == this.number)?this.out:0;
            aux_size = (this.container_width+out_var) + 'px';
            this.tabs_array[iter-1].setStyle({width:aux_size});
            aux_size = (this.center_width+out_var) + 'px';
            if((this.container_width+out_var)*iter < 620){
                this.lastTabShown = iter;
            }else{
                var tabId = this.tabs_array[iter-1].id; 
                this.tabs_array[iter-1].hide();//hiding tabs after the third
                this.menuTabsItems.push({name: this.labels[iter-1], callback: this.swapTabs.bind(this, iter)});
                var showContextMenu = true;
            }    
            this.tabs_array[iter-1].childElements()[1].setStyle({width:aux_size});
            this.tabs_array[iter-1].observe('click',this.obj.bfx);    
            this.tabs.insert(this.tabs_array[iter-1]);
        }   
               
        //*************************************************************************
        //INSERT THE REST OF THE DIVS INTO THE MAIN ONE  
        this.total.insert(this.tabs);
        //AND THIS INTO THE STATIC DIV IN THE DOCUMENT
        $(this.target).update(this.total);
        //*************************************************************************
        if(showContextMenu){
            $(this.total).insert("<div id='"+this.target+"_moreIcon' class='application_MoreTabs'></div>"); 
            this.menuTabs = new Proto.Menu({
                  menuItems: this.menuTabsItems
            }) 
            $(this.target+"_moreIcon").observe('click', function(evt) { this.menuTabs.show(evt); }.bind(this)); 
        }    
        //if it is defined by the programmer, it is executed the code related to the active tab on initialization
        if(firstRun){
            if(this.events && this.events.get('onTabClicked')){
			    document.fire(this.events.get('onTabClicked'),this.ids[this.active -1]);
			}
		}	    
    },
    swapTabs: function(clickedIndex){
         $(this.tabs_array[this.lastTabShown-1].id).hide();
         this.menuTabsItems.push({name: this.labels[this.lastTabShown-1], callback: this.swapTabs.bind(this, this.lastTabShown)});
         this.lastTabShown = clickedIndex;
         $(this.tabs_array[clickedIndex-1].id).show();
         for(var i=0;i<this.menuTabsItems.length;i++){
            var item=this.menuTabsItems[i];
            if(item.name == this.labels[this.lastTabShown-1]){                
                    this.menuTabsItems[this.menuTabsItems.indexOf(item)] = this.menuTabsItems[this.menuTabsItems.length-1];
                    delete this.menuTabsItems[this.menuTabsItems.length-1];
                    this.menuTabsItems.length--;
            }    
         }
         document.fire(this.events.get('onTabClicked'),this.ids[clickedIndex-1]);
         this.menuTabs = new Proto.Menu({
                  menuItems: this.menuTabsItems
         })
         $(this.target+"_moreIcon").stopObserving('click');    
         $(this.target+"_moreIcon").observe('click', function(evt) { this.menuTabs.show(evt); }.bind(this));
    },
    goTo: function(tabName){
        var index;
        var label = "";
        var inContextMenu = false;
        for(var i=0;i<this.ids.length;i++){
            if(this.ids[i] == tabName){
                label = this.labels[i];
                index= i+1;
            }    
        }
        this.menuTabsItems.each(function(tab){
            if(!Object.isEmpty(index) && tab.name && tab.name == label){
                this.swapTabs(index);
                inContextMenu = true;
            }
        }.bind(this));
        //if(!inContextMenu)
        //    document.fire(this.events.get('onTabClicked'),tabName);
    },
	destroy: function() {
		this.tabs_array.each(function(tab) {
			tab.stopObserving('click',this.obj.bfx);
			if(!Object.isEmpty(tab.parentNode))
				tab.remove();
		}.bind(this));
		if(this.events && this.events.get('onTabClicked'))
		    document.stopObserving(this.events.get('onTabClicked'));
	},
    chooseInterface: function(iter, number, active){//the active tab has different css properties than others
    
        var itIsActiveLeft = '';
        var itIsActiveRight = '';
            if(number == 1){
               itIsActiveLeft = '_initial_s';
               itIsActiveRight = '_final_s';
            }else if(iter == active){//if it is the ACTIVE
                    if(iter == number){
                        itIsActiveLeft = '_d_s';
                        itIsActiveRight = '_final_s';
                    }else if(iter == 1){
                        itIsActiveLeft = '_initial_s';
                        itIsActiveRight = '_s_d';
                    }else{
                        itIsActiveLeft = '_d_s';
                        itIsActiveRight = '_s_d';
                    }
            }else{//if it is INACTIVE
                if(iter == 1){
                    itIsActiveLeft = '_initial_d';
                    if(active == (iter + 1)){
                        itIsActiveRight = '_d_s';
                    }else{
                        itIsActiveRight = '_d_d';
                    }
                }else if( iter == number){
                    itIsActiveRight = '_final_d';
                    if(active == (iter - 1)){
                        itIsActiveLeft = '_s_d';
                    }else{
                        itIsActiveLeft = '_d_d';
                    }
                }else{
                    if(active == (iter - 1)){
                        itIsActiveLeft = '_s_d';
                        itIsActiveRight = '_d_d';
                    }else if(active == (iter + 1)){
                        itIsActiveLeft = '_d_d';
                        itIsActiveRight = '_d_s';
                    }else{
                        itIsActiveLeft = '_d_d';
                        itIsActiveRight = '_d_d';
                    }
                }
            }
        return $H({left:itIsActiveLeft,right:itIsActiveRight});
    },
    openTab: function(tab){
         var throwEvent = false;  
         this.manageTabs(tab,throwEvent);
    },

    /*
     *@method manageTabs
     *@param args {String} the tab we have clicked, throwEvent (boolean) and callbackDefined (if we execute the callback or not)
     *@desc handle the tab_cliked event, changing the tabs css properties to set the active and the inactive ones
     */
    manageTabs: function(args,throwEvent, callbackDefined){
       if(typeof args == "string")
       var index = args.gsub(args.truncate(args.indexOf('_')+1,''),'');
	   if(index == "undefined")
			return;
       var tar = this.target;
       var v = $(tar+'all_tabs').childElements();
       for ( var iter = 0; iter<v.length; iter++){
        if (this.ids[iter] == args) index = iter+1;
       }
       this.currentSelected = index-1;
       for(var iter = 0; iter<v.length; iter++)
       {
            var itIsActive = ((iter +1) == index)?'_active':'';
            var itIsHash = this.chooseInterface(iter +1, this.number, index);
            var itIsActiveLeft = itIsHash.get('left');
            var itIsActiveRight = itIsHash.get('right');
            var aux_array = $A(v[iter].childElements());
            aux_array[0].className = 'tabs_tabs_content_left'+itIsActiveLeft;
            aux_array[2].className = 'tabs_tabs_content_right'+itIsActiveRight;
            aux_array[1].className = 'tabs_tabs_content_center'+itIsActive;
            aux_array[1].childElements()[1].className = 'tabs_title'+itIsActive;
            if((iter+1) == index){
                v[iter].stopObserving('click',this.obj.bfx);
                v[iter].setStyle({cursor:'default'});
                this.goTo(args);
            }else{
                v[iter].observe('click',this.obj.bfx);
                v[iter].setStyle({cursor:'pointer'});
            }       
       }
        this.callback(args,this);
       //Throwing the event openApplication if callback is not defined
       if(throwEvent && !callbackDefined){
            document.fire('EWS:openApplication',$H({app:args}));
       }
                 
    },

    /*
     *@method throwEventClicked
     *@param id {String} the element id inside the tab has been clicked
     *@desc throws the event indicating one tab has been clicked
     */
    throwEventClicked: function(id){
        var aux = id.gsub(id.truncate(id.indexOf('_')+1,''),'');
        var tar = this.target;
        if(this.events && this.events.get('onTabClicked'))
            document.fire(this.events.get('onTabClicked'),this.ids[aux-1]);
    }
});



/* ******************************************************************* */
/* ******************************************************************* */
/* ******************************************************************* */
/* ******************************************************************* */
/* ******************************************************************* */
/* ******************************************************************* */

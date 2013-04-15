var GWExample = Class.create(Application,{
    gw: null,
    initialize: function($super){
        $super('GWExample');
        this.widgetsReadyBinding = this.widgetsReady.bind(this);        
    },
    run: function($super){
        $super();    
        //this.virtualHtml.insert("<input id='buttonRe' type='button' value='reLoad'/>"); 
        var json = {
            elements:[]
        };
        var auxReload =   {
            label: global.getLabel('reload'),
            idButton:'buttonRe',
            handlerContext: null,
            handler: this.clikingOnReload.bind(this),
            type: 'button',
            standardButton:true
        };                 
        json.elements.push(auxReload);  
        this.ButtonGW=new megaButtonDisplayer(json);
        this.virtualHtml.insert(ButtonGW.getButtons());
        /*this.virtualHtml.down("input#buttonRe").observe('click',function(){
            this.gw.reloadWidgets({
                        tabId: 'ED_PD'            
            });
        }.bind(this)); */
		this.gw = new GetWidgets({
			    objectType: 'P',
				objectId: '30000429',
				service: 'GET_WIDGETS',
				tabId: 'ED_PD',
				target: this.virtualHtml.identify()			
		});	
		document.observe('EWS:widgetsReady',this.widgetsReadyBinding); 
    },
    clikingOnReload:function(){
        this.gw.reloadWidgets({
                        tabId: 'ED_PD'            
            });
    },
    widgetsReady: function(){        
        //this.gw.widgets.get('PD_ADDR').setContent('<span class="application_main_text">Hello!</span>');        
    
    },   
    close: function($super){
    	$super();
    }
});
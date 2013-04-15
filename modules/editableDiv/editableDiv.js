/**
 *@fileOverview editableDiv.js
 *@description In this file it has been implemented the Editable Div Module
 */
 
/**
 *@constructor
 *@description class that describes the Editable Div instances features and behavior
 */
var EditDiv = Class.create(
/**
 * @lends EditDiv
 */
{
    /**
	 *@type HTML Element
	 *@description Div that has to become editable
	 */
	targetDiv: null,
	/**
	 *@type HTML Textarea Element
	 *@description The textarea HTML element that makes the target Div to seem editable
	 */
	input: null, 
	initialize: function(target){		
		if(Object.isString(target))//if we have the targetDiv id(String)
		{
			if($(target)){//if the targetDiv elements exists
				this.targetDiv = $(target);							
			}else{
//				if(log)
//					log.warning('The div:' + target + 'does not exists');
				return;
			}			
		}else if(Object.isElement(target)){//if we have the targetDiv element
			this.targetDiv = target;
			
		}else{
//			if(log)
//				log.warning('editableDiv module failed, target: '+target.toString()+' is neither String nor HTML Element');
			return;
		}		
		this.makeEditable();	
	},
	/*
     *@description Replaces the this.input element with the targetDiv and vice versa, making it look like an
     *editable div. It makes the this.input and this.targetDiv elements observe the onclick and onblur events,
     *to replace them properly.
     */
	makeEditable: function(){
	    this.targetDiv.setStyle({cursor:'pointer'});
	    //Creating the textarea HTML element	    
		this.input = new Element('textarea',{
				id:this.targetDiv.identify()+'_editableInput',
				className:'editableDivInput'				
		});	
		//Margin property copied
		this.input.setStyle({margin:this.targetDiv.getStyle('margin')});
		//if click when div normal mode is being shown
		this.targetDiv.observe('click',function(event){      
		        //the textarea has to include the div text if it has any                       
                this.input.update(this.targetDiv.innerHTML.stripTags());   
                //there has to be at the same position  
                Element.clonePosition(this.input,this.targetDiv);
                //and then, we replace it
                this.targetDiv.replace(this.input);
                //with the text cursor on it
                this.input.focus();
                  
        }.bind(this));  
        //if click when div editable mode is being shown     
        this.input.observe('blur',function(){        
                //we've clicked outside of the textarea, so div get the textarea text   
                this.targetDiv.update(this.input.value);     
                //copied the position           
                Element.clonePosition(this.targetDiv,this.input);
                //and then it replaces the textarea
                this.input.replace(this.targetDiv);                                             
        }.bind(this));                
	}		
});

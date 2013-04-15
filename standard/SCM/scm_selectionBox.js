/**
 * @class
 * @description Manage a box with multiple displayed values and one could or several be selected.
 * To build a such box:
 * <ol>
 * <li> var selectionBox = new SCM_SelectionBox({width: 120, height: 120, selectSingle: true});</li>
 * <li> selectionBox.setValues($A([{data: 'val1', text: 'Value 1'}, {data: 'val2', text: 'Value 2'}]), val1);</li>
 * <li> element.insert(selectionBox.getBox());</li>
 * <li> selectionBox.getSelection() => Get the list of selected items as a Hash 'val1' => 'Value 1'</li>
 * <li> selectionBox.remove() => Remove the selection box</li>
 * </ol>
 * @author jonathanj & nicolasl
 * @version 1.0
 */

var SCM_SelectionBox = Class.create(/** @lends SCM_SelectionBox.prototype */{
	/**
	 * @type Hash
	 * @description List of  id with there associate labels
	 * @since 1.0
	 */
	_values: null,

	/**
	 * @type Array
	 * @description Id of the currently selected items
	 * @since 1.0
	 */
	_selectIds: null, 

	/**
	 * @type Number 
	 * @description Id used to identify the box
	 * @since 1.0
	 */
	boxId: null,
	
	/**
	 * @type Object 
	 * @description List of options
	 * @since 1.0
	 */
	_options: null,
	
	/**
	 * @param {Element} parentNode Node that should contains the box
	 * @param {Object} options Contains display options as the box width, height and the select single  
	 * @since 1.0
	 */
	initialize: function(options) {
		this._options = {
			width			: 120	,
			height			: 120	,
			selectSingle	: true	,
			title			: ''	,
			style			: ''	,
			fitToSize		: false	};
		
		//Determine the box Id
		this.boxId = SCM_SelectionBox.lastBoxNumber;
		SCM_SelectionBox.lastBoxNumber++;
		
		this._values 	= $H();
		this._selectIds = $A();
		
		//If there are some options, take them into account
		if (!Object.isEmpty(options)) {
			//By default it is only possible to select 1 value from the box
			if (!Object.isEmpty(options.selectSingle)) 
				this._options.selectSingle = options.selectSingle;
			
			//Set the height and the width of the box
			if (!Object.isEmpty(options.width)) 
				this._options.width = options.width;
			if (!Object.isEmpty(options.height)) 
				this._options.height = options.height;
			if (!Object.isEmpty(options.title)) 
				this._options.title = options.title;
			if (!Object.isEmpty(options.style)) 
				this._options.style = options.style;
			if (!Object.isEmpty(options.fitToSize))	
				this._options.fitToSize = options.fitToSize;	
		}
	},
	
	/**
	 * @param {Array} values List of the values to set in the box as objects with 'data' and 'text' elements. 
	 * 							The element 'def' can also be there in place of the other parameter
	 * @param {String/Array} defIds Ids of the elements to set as default values
	 * @description Set the given values as the list of values
	 * @since 1.0
	 */
	setValues: function(values, defIds) {
		var text;
		this._selectIds = $A();
		this._values 	= $H();
		
		this.addValues(values, defIds);
	},
	
	/**
	 * @param {Array} values List of the values to set in the box as objects with 'data' and 'text' elements. 
	 * 							The element 'def' can also be there in place of the other parameter
	 * @param {String/Array} defIds Ids of the elements to set as default values
	 * @description Add the given values in the list of values
	 * @since 1.0
	 */
	addValues: function(values, defIds) {
		//Add the values in the object
		values.each(function(value) {
			(value.text) ? text = value.text : text = value.data
			this._values.set(value.data + '', text);
			if(value.def === true || value.def === 'X') this._selectIds.push(value.data + '');
		}.bind(this));
		
		//Add the default values in the object
		if (!Object.isEmpty(defIds)) {
			objectToArray(defIds).each(function(defId){
				this._selectIds.push(defId + '');
			}.bind(this));
		}
		this._selectIds = this._selectIds.uniq();
	},
	
	/**
	 * @param {Array} values List of the values to set in the box as objects with 'data' and 'text' elements. 
	 * @description Add the given values in the list of values
	 * @since 1.0
	 */
	removeValues: function(values) {
		//Remove the values from the object
		values.each(function(value) {
			this._values.unset(value.data + '');
		}.bind(this));
	},
	
	/**
	 * @description Get the list of selected values
	 * @returns {Hash}
	 * @since 1.0
	 */
	getSelection: function() {
		var selection = $H();
		this._values.each(function(value) {
			if(this._selectIds.indexOf(value.key) >= 0) selection.set(value.key, value.value);
		}.bind(this));
		return selection;
	},
	
	/**
	 * @description Build a box that can be set in the screen
	 * @returns {Element}
	 * @since 1.0
	 */
	getBox: function() {
		var boxId = 'selectionBox_' + this.boxId;
		var num = 0;
		var className;
		var attribWidth;
		var attribHeight;
		if (this._options.fitToSize === true) {
			if (Prototype.Browser.IE && parseInt(navigator.userAgent.substring(navigator.userAgent.indexOf("MSIE") + 5)) == 6) {
				attribWidth = 'width: expression( this.scrollHeight > ' + this._options.width.toString() + ' ? "' + this._options.width.toString() + 'px" : "auto" )';
				attribHeight = 'height: expression( this.scrollHeight > ' + this._options.height.toString() + ' ? "' + this._options.height.toString() + 'px" : "auto" )';
			}
			else {
				attribWidth = 'max-width: ' + this._options.width.toString() + 'px;';
				attribHeight = 'max-height: ' + this._options.height.toString() + 'px;';
			}
		}
		else {
			attribWidth = 'width: ' + this._options.width.toString() + 'px;';
			attribHeight = 'height: ' + this._options.height.toString() + 'px;';
		}
			
		var boxParent = new Element('div', {'class': 'selectionBox_main ' + this._options.style});
		
		if(this._options.title !== '')
			boxParent.insert('<div id="' + boxId + '_title" class="selectionBox_title">' + this._options.title + '</div>')
		
		//Create the main box
		var boxDiv = new Element('div', {
			'id'	: boxId									,
			'class'	: 'selectionBox'						,
			'style'	: 	attribWidth + ' ' + attribHeight	});
		
		boxParent.insert(boxDiv);
		
		//Add the list of elements
		var listItemsTxt = '<ul>';	
		this._values.each(function(value){
			if(this._selectIds.indexOf(value.key) >= 0) className = 'selectionBox_SelectedItem';
			else className = 'selectionBox_UnselectedItem';
			listItemsTxt += '<li id="' + boxId + '_' + num + '" class="' + className + '" value="' + value.key + '" title="' + value.value + '">' + value.value + '</li>';
			num ++;
		}.bind(this));
		listItemsTxt += '</ul>';
		boxDiv.insert(listItemsTxt);
		
		//Add the event to select or unselect the item
		boxDiv.select('li').each(function(item){
			this._addEvent(item);
		}.bind(this));
		return boxParent;
	},
	
	/**
	 * @description Get the element that contains the box
	 * @returns {Element}
	 * @since 1.0
	 */
	_getExistantBox: function() {
		return $('selectionBox_' + this.boxId);
	},
	
	/**
	 * @param {Boolean}
	 * @description Remove the box from the screen
	 * @since 1.0
	 */
	removeBox: function(onlyContent) {
		if(Object.isEmpty(onlyContent)) onlyContent = false;
		
		var boxElement = this._getExistantBox();
		if (!Object.isEmpty(boxElement)) {
			boxElement.select('li').each(function(item){
				this._removeEvent(item);
				if(onlyContent === true) item.remove();
			}.bind(this));
			
			if(onlyContent === false) boxElement.up().remove();	
		}
	},
	
	/**
	 * @description Unable to select the items anymore
	 * @since 1.0
	 */
	disable: function() {
		var boxElement = this._getExistantBox();
		if (!Object.isEmpty(boxElement) && !boxElement.hasClassName('selectionBox_disable')) {
			boxElement.addClassName('selectionBox_disable');
			boxElement.select('li').each(function(item){
				this._removeEvent(item);
			}.bind(this));
		}
	},
	
	/**
	 * @description Enable to select the items again
	 * @since 1.0
	 */
	enable: function() {
		var boxElement = this._getExistantBox();
		if (!Object.isEmpty(boxElement) && boxElement.hasClassName('selectionBox_disable')) {
			boxElement.removeClassName('selectionBox_disable');
			boxElement.select('li').each(function(item){
				this._addEvent(item);
			}.bind(this));
		}
	},
	
	/**
	 * @description Replace the box element with a new one
	 * @since 1.0
	 */
	refreshBox: function() {
		var boxElement = this._getExistantBox();
		if (!Object.isEmpty(boxElement)) {
			boxElement.select('li').each(function(item){
				this._removeEvent(item);
			}.bind(this));
			boxElement.up().replace(this.getBox());
		}
	},
	
	/**
	 * @param {Element} element Element that could be selected or unselected
	 * @description Check if an element is selected
	 * @return {Boolean or null}
	 * @since 1.0
	 */
	isSelected: function(element) {
		if(element.hasClassName('selectionBox_SelectedItem'))
			return true;
		else if(element.hasClassName('selectionBox_UnselectedItem'))
			return false;
		
		return null;
	},
	
	/**
	 * @description Add the events for the element
	 * @param {Element} item The item that need an event.
	 * @since 1.0
	 */
	_addEvent: function(item) {
		this._removeEvent(item);
		//If the element is selected, allow to unselect in multi select mode
		if(this.isSelected(item) === true && this._options.selectSingle === false) 
			item.observe('click', this._unselectItem.bindAsEventListener(this));
		//If the element is not selected and it is possible to select multiple entries	
		else if(this.isSelected(item) === false && this._options.selectSingle === false)
			item.observe('click', this._selectItem.bindAsEventListener(this));
		//If the element is not selected and it is only possible to select single enties	
		else if(this.isSelected(item) === false && this._options.selectSingle === true)
			item.observe('click', this._updateItem.bindAsEventListener(this));
	},
	
	/**
	 * @description Removed the events for the element
	 * @param {Element} item The item that need an event.
	 * @since 1.0
	 */
	_removeEvent: function(item) {
		item.stopObserving('click');
	},
	
	/**
	 * @param {String} id String that is the id of the element to search in the box
	 * @description Get the element that have the given id in this box
	 * @returns {Element}
	 * @since 1.0
	 */
	_getElementFromId: function(id) {
		var boxElement = this._getExistantBox();
		if(Object.isEmpty(boxElement)) return null;
		
		var listElems = boxElement.select('li[value="' + id + '"]');
		if(listElems.size() > 0) return listElems[0];
		else return null;
	},
	
	/**
	 * @param {Event} event Event that contains the clicked element
	 * @description Add an element to the selection
	 * @since 1.0
	 */
	_selectItem: function(event) {
		this._selectElement(event.element());
	},
	
	/**
	 * @param {Element} element Element to select
	 * @description Add an element to the selection
	 * @since 1.0
	 */
	_selectElement: function(element) {
		if(this.isSelected(element) === true) return;
		
		//Update the display
		element.removeClassName('selectionBox_UnselectedItem');
		element.addClassName('selectionBox_SelectedItem');
		
		//Add the new selected value
		this._selectIds.push(element.readAttribute('value')+'');
		
		//Update the event on the element
		this._addEvent(element);
		
		//Send the selection event
		document.fire('EWS:SelectionBox_ElementSelected', {
			boxId	: this.boxId					,
			data	: element.readAttribute('value'),
			text	: element.innerHTML
		});
	},
	
	/**
	 * @param {Event} event Event that contains the clicked element
	 * @description Remove an element from the selection
	 * @since 1.0
	 */
	_unselectItem: function(event) {
		this._unselectElement(event.element());	
	},
	
	/**
	 * @param {Element} element Element to unselect
	 * @description Remove an element from the selection
	 * @since 1.0
	 */
	_unselectElement: function(element) {
		if(this.isSelected(element) === false) return;
		
		//Update the display
		element.removeClassName('selectionBox_SelectedItem');
		element.addClassName('selectionBox_UnselectedItem');
		
		//Remove the old value
		this._selectIds = this._selectIds.without(element.readAttribute('value')+'');
		
		//Update the event on the element
		this._addEvent(element);
		
		//Send the unselection event in multi select mode
		if(this._options.selectSingle === false) 
			document.fire('EWS:SelectionBox_ElementUnselected', {
				boxId	: this.boxId					,
				data	: element.readAttribute('value'),
				text	: element.innerHTML
			});
	},
	/**
	 * @param {Event} event Event that contains the clicked element
	 * @description Update the selected element to the clicked one
	 * @since 1.0
	 */
	_updateItem: function(event) {
		var element;
		//Unselect previous elements
		this._selectIds.each(function(selectId) {
			element = this._getElementFromId(selectId);
			if(Object.isEmpty(element)) return;
			this._unselectElement(element);
		}.bind(this));
		
		this._selectElement(event.element());
	},
	
	/**
     * @description Remove the content the box and replace it with the loading icon
	 * @since 1.0
     */
    loading: function() {
		var boxElement = this._getExistantBox();
		this.removeBox(true);
		if(!Object.isEmpty(boxElement))
        	boxElement.addClassName('selectionBox_loading');
    },
	
    /**
     * @description Remove the loading div from the box.
	 * @since 1.0
     */
    stopLoading: function() {
        var boxElement = this._getExistantBox();
		if(!Object.isEmpty(boxElement))
			boxElement.removeClassName('selectionBox_loading');
    },
	
	/**
	 * @param {String} message Message to indicate
	 * @param {String} kind (default = 'E') Indicate if the message is an E(rror), a, I(nformation) or a W(arning)
	 * @param {String} position (default = 'after') Set the message 'after', 'before', on 'top' or on the 'bottom' of the box.
	 * @description Add a message around the box
	 * @since 1.0
     */
	addMessage: function(message, kind, position) {
		var box = this._getExistantBox();
		if(Object.isEmpty(box)) return;
		
		if(Object.isEmpty(kind)) kind = 'E';
		if(Object.isEmpty(position)) position = 'after';
		var className = '';
		
		switch(kind) {
			case 'E': className = 'selectionBox_error';		break;
			case 'I': className = 'selectionBox_info';		break;
			case 'W': className = 'selectionBox_warning';	break;
		}
		
		eval('box.up().insert({' + position + ': \'<div id="selectionBox_' + this.boxId + '_error" class="' + className + '">' + message + '</div>\'})');
	},
	
	/**
	 * @description Remove the message setted around the box.
	 * @since 1.0
     */
	removeMessage: function() {
		//Get the main box 
		var boxElement = this._getExistantBox();
		if(Object.isEmpty(boxElement)) return;
		//Get the error message
		var error = boxElement.up().down('[id="selectionBox_' + this.boxId + '_error"]');
		if(Object.isEmpty(error)) return;
		//Remove the error
		error.remove();
	}
});
/**
 * @type Integer
 * @since 1.0
 */
SCM_SelectionBox.lastBoxNumber = 0;
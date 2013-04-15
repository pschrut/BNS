/**
 * @class
 * @description Class representing a mail Input object. The specificity of this object is that it's working as the normal autocompleter but you can also freely enter data.,br>
 * This module allows to enter several values separated by '; ' as in MS outlook.
 * @author jonathanj & nicolasl
 * @version 1.0 Basic version
 */
var multiselectAutoComplete = Class.create(/** @lends multiselectAutoComplete.prototype */{
	/**
	 * The div id where the autocompleter should be inserted.
	 * @type String
	 * @since 1.0
	 */
	_targetDiv			: null,
	/**
	 * The options of the object (number of characters before displying the proposition list, ...).
	 * @type Array
	 * @since 1.0
	 */
	_options			: null,
	/**
	 * The list of possible values to be used for the propositions.
	 * @type Array
	 * @since 1.0
	 */
	_listValues			: null,
	/**
	 * The hidden input field behing the object.
	 * @type DOMInput
	 * @since 1.0
	 */
	_inputField			: null,
	/**
	 * The list of entries that will be used to build the proposals. This is based on the listValue attribute.
	 * @see multiselectAutoComplete#_listValues
	 * @type Hash
	 * @since 1.0
	 */
	_identifiedValues	: null,
	/**
	 * The minimum nuber of characters to be entered before displaying the porpositions.
	 * @type int
	 * @since 1.0
	 */
	_minCharNumber		: null,
	/**
	 * List of the lines that are part of the proposals.
	 * @type Hash
	 * @since 1.0
	 */
	_proposalsLines		: null,
	/**
	 * Flag set to true if the proposals are displayed on the screen.
	 * @type boolean
	 * @since 1.0
	 */
	_proposalsShown		: null,
	/**
	 * Number of proposals displayed on the screen.
	 * @type int
	 * @since 1.0
	 */
	_nbrProposalsShown	: null,
	
	/**
	 * Constructor for the object. It initialize the attributes, calls the function _setOptions in order to set the desired options and
	 * calls the function _buildDisplay in order to build the basic display of the module
	 * @param {DOMDiv} targetDiv The div in which the module should be inserted
	 * @param {JSon} options The options of the object
	 * @param {Array} listValues The list of possible values to be used as proposal
	 * @since 1.0
	 * @see multiselectAutoComplete#_setOptions
	 * @see multiselectAutoComplete#_buildDisplay
	 */
	initialize:function(targetDiv, options, listValues){
		this._targetDiv = targetDiv;
		this._options = options;
		this._listValues = listValues;
		this._proposalsShown = false;
		this._nbrProposalsShown = 0;
		this._proposalLines = $H();
		this._identifiedValues = $H();
		this._listValues.each(function(value, index){
			this._identifiedValues.set(value.text, {index: index, data: value.data});
		}.bind(this));
		// set the selected option in the needed variables
		this._setOptions();
		// build the display of the multiselect autocompleter
		this._buildDisplay();
		
	},
	/**
	 * Function in charge of assigning the options of the object. If the specific option cannot be found in the JSon object, default values will be set.
	 * @since 1.0
	 */
	_setOptions:function(){
		// ------ number of character entered ------
		if(!Object.isUndefined(this._options.minChar) && !(Object.isEmpty(this._options.minChar)))
			this._minCharNumber = this._options.minChar;
		else
			this._minCharNumber = 1;
	},
	/**
	 * Function in charge of building the basic display of the object.<br>
	 * The basic display is composed of a DomDiv object with a DOMInput object inside. 
	 * It also set the observers for the events on the input field in order to catch when a change is done in the input field.<br>
	 * It calls the _setObserversOnInupt function in order to do that after calling the _buildPropositions function.
	 * @since 1.0
	 * @see multiselectAutoComplete#_buildPropositions
	 * @see multiselectAutoComplete#_setObserversOnInupt
	 */
	_buildDisplay: function(){
		this._inputField = new Element('input',
													{'type'	: 'text',
													 'class': 'SCM_MSAC_input',
													 'id'	: this._options.id });
		this._entryProposal = new Element('div',
													{'class': 'SCM_MSAC_proposals SCM_MSAC_proposal_line_hidden',
													 'id'	: 'multiSelectAutoComplete_proposals'});
		this._targetDiv.update(this._inputField);
		this._targetDiv.insert(this._entryProposal);
		
		this._buildPropositions();
		this._setObserversOnInupt();
	},
	/**
	 * Function in charge of setting the observers on the input field.<br>
	 * These observers are:
	 * <ul>
	 * 	<li> keyup (event processed after a keybord entry</li>
	 * </ul> 
	 * Based on the length of the entered characters, the event observer will call the _hideProposals function or the _filterProposals function.
	 * @since 1.0
	 * @see multiselectAutoComplete#_hideProposals
	 * @see multiselectAutoComplete#_filterProposals
	 */
	_setObserversOnInupt:function(){
		// ----- Key up --> processed after a keybord entry
		this._inputField.observe('keyup', function(event){
			var enteredValues = this._inputField.value.split(';');
			var lookupValue = enteredValues[enteredValues.size()-1].strip();
			
/*
			var keyID = (window.event) ? event.keyCode : event.which;

			if(keyID == 13){
				if(this._proposalsShown){
					value = this._getValueFromProposals();
					this._hideProposals();
					this._manageEnteredData('add', value);
				}
			}
*/
			
			if(lookupValue.length < this._minCharNumber){
				this._hideProposals();
			} else
				this._filterProposals(lookupValue);
		}.bind(this));

	},
	/**
	 * Function in charge of building the proposal lines corresponding to each possible values from the value list.
	 * These lines will all have 3 observers:
	 * <ul>
	 * 	<li>mouseover - This observer will change to color of the line to highlight the current line pointed</li>
	 * 	<li>mouseout  - This observer will change to color of the line to remove the highlight the previous line pointed</li>
	 * 	<li>click     - This observer will manage the click on a proposition. It will call the _manageEnteredData to add the selected data in the input field and the calls the _hideProposals function to hide the proposition list</li>
	 * </ul>
	 * @since 1.0
	 * @see multiselectAutoComplete#_manageEnteredData
	 * @see multiselectAutoComplete#_hideProposals
	 */
	_buildPropositions:function(){
		this._identifiedValues.each(function(identifiedValue){
			var proposalLine = new Element('DIV',{'id':'MSAC_proposal_'+identifiedValue.value.index,
							   'class': 'SCM_MSAC_proposal_line SCM_MSAC_proposal_line_hidden'});
			proposalLine.insert(identifiedValue.key);
			this._entryProposal.insert(proposalLine);
			this._proposalLines.set(identifiedValue.key, {dom: proposalLine, selected: false});
			var addedLine = this._entryProposal.down('[id="MSAC_proposal_'+ identifiedValue.value.index +'"]');
			
			addedLine.observe('mouseover', function(event){
				this._proposalLines.each(function(key){
					key.value.dom.removeClassName('SCM_MSAC_selected_proposal');
				}.bind(this));
				addedLine.addClassName('SCM_MSAC_selected_proposal');
			}.bind(this));
			
			addedLine.observe('mouseout', function(event){
				addedLine.removeClassName('SCM_MSAC_selected_proposal');
			});
			addedLine.observe('click', function(event){
				this._manageEnteredData('add',identifiedValue.key);
				this._hideProposals();
			}.bind(this));
			
		}.bind(this));	
	},
	/**
	 * Function in charge of hiding the proposals of the screen.<br>
	 * It will also reset the flag meaning that the propositions are shown and reset the number of displayed propositions to 0.
	 * @since 1.0
	 */
	_hideProposals:function(){
		// Hide the proposal div
		this._entryProposal.addClassName('SCM_MSAC_proposal_line_hidden');
		// hide the propositions
		this._proposalLines.each(function(key){
			key.value.dom.removeClassName('SCM_MSAC_selected_proposal');
			key.value.dom.addClassName('SCM_MSAC_proposal_line_hidden');
		}.bind(this));
		this._proposalsShown = false;
		this._nbrProposalsShown = 0;
	},
	/**
	 * Function in charge of filtering the propositions displayed to match the entered data in the input field.<br>
	 * This method will split the entered value of the input field at each ";" in order to extract the last element.<br>
	 * This last element will then we compared with the proposals in order to display the one that are matching this value.<br>
	 * @param {String} pattern the entered data of the input field.
	 * @since 1.0
	 */
	_filterProposals:function(pattern){
		var enteredValues = pattern.split(';');
		var lookupValue = '';
		var isFirst = true;
		lookupValue = enteredValues[enteredValues.size()-1].strip();
		
		// Hide the proposal div
		this._hideProposals();
		// look for the proposal that can match the pattern
		this._proposalLines.keys().each(function(key){
			if(key.capitalize().startsWith(lookupValue.capitalize())){
				this._nbrProposalsShown++;
				// make the correct one visibles
				if(isFirst == true){
					isFirst = false;
					this._proposalLines.get(key).dom.addClassName('SCM_MSAC_selected_proposal');
				}
				this._proposalLines.get(key).dom.removeClassName('SCM_MSAC_proposal_line_hidden');
				this._entryProposal.removeClassName('SCM_MSAC_proposal_line_hidden');
				this._proposalsShown = true;
			}
		}.bind(this));
	},

	/**
	 * This method in the responder to the click event on a proposition line. It will recreate the entered values in order to add the "; " after each entry and add the selected one.
	 * @param {String} action "add" if the selected entry should be added, nothing else for now.
	 * @param {String} value The value to add in the input field.
	 * @since 1.0
	 */
	_manageEnteredData:function(action, value){
		var chosenValues = this._inputField.value.split(';');
		chosenValues[chosenValues.size()-1] = value;
		this._inputField.value = '';
		chosenValues.each(function(addValue){
			addValue = addValue.strip();
			this._inputField.value += addValue + '; ';
		}.bind(this));
		this._inputField.focus();
	},
	/**
	 * This function is in charge of returning the value of the input field.
	 * @return {String} The value of the input field
	 * @since 1.0
	 */
	getSelection:function(){
		return this._inputField.value;
	},
	/**
	 * This function is in charge of setting a predefined value in the input field.
	 * @param {String} prefillValue The value to be set in the input field.
	 * @since 1.0
	 */
	prefillInputField:function(prefillValue){
		this._inputField.value = prefillValue;
	}

});
/**
 * @class 
 * @description This class is in charge of managing the user preferences screen<br><br>
 *
 * @author jonathanj & nicolasl
 * @version 2.0 Basic version
 */
scm_agentPreferences = Class.create(Application,/** @lends scm_agentPreferences*/{
	
	preferences: null,
	
	title: null,
	
	preferenceHTML: '',
	
	preferenceScreen:null,
	
	initialize:function(){
		this.title = global.getLabel('userPreferences');
		this.getPreferences();
		this.displayPreferences();
	},
	
	getPreferences:function(){
		this.preferences = hrwEngine.getEmailNotificationPreferences().clone();
	},
	
	buildPreferences:function(){
		var preferencesHTML = '';
		this.preferences.each(function(preference){
			preferencesHTML +=	this.buildPreference(preference.value);
		}.bind(this));
		return preferencesHTML;
	},
	
	buildPreference:function(pref){
		return '<div id="preference_'+ pref.id + '">' +
				 	'<div class="SCM_userPreferences_check"><input id="check_preference_'+ pref.id + '" type="checkbox"></input></div>'+
					'<div class="SCM_userPreferences_text">'+ pref.name +'</div>'+
				 '</div>';
	},
	
	displayPreferences:function(){
		this.preferenceScreen = new Element('div').insert(new Element('div',{'class': 'SCM_ticketPopup_title'}).insert(this.title)).insert(this.buildPreferences());
		
		var buttonsJson = {
                    elements: [],
                    mainClass: 'moduleInfoPopUp_stdButton_div_right'
                }; 
		var saveButtonClicked = function() { 
			this.savePreferences();                 
        }.bind(this);               
		var cancelButtonClicked = function(){
				popupPreferences.close();
                delete popupPreferences;
		};
		
		var aux1 = {
			idButton: 'cancel',
            label: global.getLabel('Close'),
            handlerContext: null,
            className: 'moduleInfoPopUp_stdButton',
            handler: cancelButtonClicked,
            type: 'button',
            standardButton: true
		};
		
        var aux2 = {
            idButton: 'save',
            label: global.getLabel('Save'),
            handlerContext: null,
            className: 'moduleInfoPopUp_stdButton',
            handler: saveButtonClicked,
            type: 'button',
            standardButton: true
        };
		buttonsJson.elements.push(aux2);                   
        buttonsJson.elements.push(aux1);
		var ButtonObj = new megaButtonDisplayer(buttonsJson);
        var buttons = ButtonObj.getButtons();                  
        this.preferenceScreen.insert(buttons);
		
		var popupPreferences = new infoPopUp({
			closeButton :   $H( {
                        'callBack':     function() {
							popupPreferences.close();
                            delete popupPreferences;
                        }
                    }),
                    htmlContent : this.preferenceScreen,
                    indicatorIcon : 'information',                    
                    width: 600
		});
		popupPreferences.create();
		this.preferences.each(function(pref){
			var check = this.preferenceScreen.down('[id="check_preference_'+ pref.value.id +'"]');
			check.checked = pref.value.value;
		}.bind(this));
	},
	
	savePreferences:function(){
		
/*
		this.preferences.each(function(pref){
			var check = this.preferenceScreen.down('[id="check_preference_'+ pref.value.id +'"]').checked;
			hrwEngine.callBackend(this, 'Session.ChangeEmailNotificationPreferences', $H({
				scAgentId 		: hrwEngine.scAgentId,
				id				: pref.value.id,
				value			: check
			}), 'preferenceSaved');
		}.bind(this));
*/

	},
	
	preferenceSaved:function(json){
		
	}
	
});

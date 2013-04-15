/*
*@fileoverview passwordReset.js
*@desc It contains a class with functionality for resetting users' password in SAP
*/
/*
*@class passwordReset
*@desc Class with functionality for resetting users' password in SAP
*/
var PasswordReset = Class.create(origin, {

    PASSWORD_RESET_CONTAINER_IDENTIFIER: 'idPasswordReset', /* @type String @desc Determines the identifier name with what the reset box will be identified throughout the code. @name PASSWORD_RESET_CONTAINER_IDENTIFIER */
    LOADING_CONTAINER_IDENTIFIER: 'idLoadingContainer',  /* @type String @desc Determines the identifier name with what the loading box will be identified throughout the code. @name LOADING_CONTAINER_IDENTIFIER */
    PASSWORD_RESET_BUTTON_STATE_STYLE: $H({ '0': 'passwordResetBox_buttonStyleInactive', '1': 'passwordResetBox_buttonStyleActive' }), /* @type Hash map @desc This contains the CSS class names of the submit button styles. @name PASSWORD_RESET_BUTTON_STATE_STYLE */
    MESSAGES: $H({                      /* @type Hash map @desc This contains all the messages that can be presented to the user. @name MESSAGES */
        'welcome_message': 'Please fill in the details below and press the button to perform a password reset',
        'success_request': 'You password reset request was successfully processed and you will receive an e-mail within minutes.<br>You will be redirect in the main page in 5 secondes...',
        'error_request': 'An error occurred while trying to perform a password reset for user $user with client $client on system $system. The user, system or client does not exist, or the user $user has no email associated.',
        'success_perform': 'Your password reset was successfull. You will receive an e-mail shortly containing your new password.',
        'error_perform': 'An error occured while resetting your password. If this problem persists, contact a local administrator.'
    }),
    MESSAGE_STYLES: $H({ 'normal': 'application_main_text', 'error_request': 'application_main_error_text' }), /* @type Hash map @desc This contains the CSS class names of the available text styles. @name MESSAGE_STYLES */

    boCua: true,                        /* @type boolean @desc Contains cua that will be passed to the hyperlink. @name boCua */
    boDebug: false,                     /* @type boolean @desc Decided whether the debug code should be shown or not. This value is determined by the presence of log. @name boDebug */
    boPasswordResetButtonActive: false, /* @type boolean @desc This value is used to determine the actual state of the submit button. Without this, multiple identical observers would be added to the same button. @name boPasswordResetButtonActive */
    url: null,                          /* @type String @desc This is used by the method makeAJAXrequest(). @name url */

    /**
    * @method (public) initialize
    * @param args
    *      (origin) origin class: The origin class
    * @desc Will check if debug messages should be shown, call the super class and initiate the whole password reset process
    */
    initialize: function($super) {

        if (!Object.isEmpty(log)) {

            this.boDebug = true;
        }

        //        if(this.boDebug) log.debug('Executing method initialize()');

        $super();

        this.virtualHtml = $('passwordReset_body');
        // this.url is used by the method makeAJAXrequest()
        //this.url =   "http://euhr3glo.euhreka.erp:8001/sap/bc/SSW_PUBSAPCALL?sap-client=100";
        //this.url = "../../../proxy.aspx?url="+escape("http://eu2r3edn.euhreka.erp:8003/sap/bc/yglui_httppub?sap-client=300");
        this.url = "http://eu2r3edn.euhreka.erp:8003/sap/bc/yglui_httppub?sap-client=300";
        //this.url = "http://eu2r3edn.euhreka.erp:8003/sap/public/bc/yglui_httppub?sap-client=300";
        this._initiatePasswordReset();
    },

    /**
    *@method (private) _initiatePasswordReset
    *@desc This method will figure out if a password request is to be performed or an actual reset
    */
    _initiatePasswordReset: function() {
        //        if(this.boDebug) log.debug('Executing method _initiatePasswordReset()');

        // Hash will only be used if the user already iniated a password reset request and received a hyperlink containing the hash
        var stHash = getURLParam('hash');

        // Present the password reset screen if the user will start with the passward reset request
        if (Object.isEmpty(stHash)) {

            this._showScreenRequestPasswordReset(stHash);
            //this._drawTransparentLayer();
            //this._drawLoadingScreen();
        }
        // If the password reset has already been requested, the user will have received an e-mail with a hyperlink
        // in it so (s)he'll end up in this part
        else {

            this._showScreenPerformPasswordReset(stHash);
        }
    },

    /**
    *@method (private) _showScreenRequestPasswordReset
    *@desc This method will build the screen the user will see
    */
    _showScreenRequestPasswordReset: function() {
        //        if(this.boDebug) log.debug('Executing method _showScreenRequestPasswordReset()');

        // Draw the password reset screen and als set the title
        document.title = "euHReka Workspace - Password Reset";
        this._drawPasswordResetContainer();
        this.virtualHtml.down('[id=idInputUserId]').focus();

        // Fill in the the password reset container with labels and information
        this.virtualHtml.down('[id=idPasswordResetBox_textMessage]').innerHTML = this.MESSAGES.get('welcome_message');
        this.virtualHtml.down('[id=idPasswordResetBox_textMessage]').className = this.MESSAGE_STYLES.get('normal');
        this.virtualHtml.down('[id=idLabelUserId]').innerHTML = 'User ID';
        this.virtualHtml.down('[id=idLabelClient]').innerHTML = 'Client';
        this.virtualHtml.down('[id=idLabelSystemId]').innerHTML = 'System ID';
        this.virtualHtml.down('[id=idInputUserId]').value = '';
        this.virtualHtml.down('[id=idInputClient]').value = '';
        this.virtualHtml.down('[id=idInputSystemId]').value = '';
        this.virtualHtml.down('[id=idPasswordResetBox_button]').value = 'Reset password';

        // Add observers to the three input fields
        Event.observe(this.virtualHtml.down('[id=idInputUserId]'), 'keyup', this._observeFields.bindAsEventListener(this));
        Event.observe(this.virtualHtml.down('[id=idInputClient]'), 'keyup', this._observeFields.bindAsEventListener(this));
        Event.observe(this.virtualHtml.down('[id=idInputSystemId]'), 'keyup', this._observeFields.bindAsEventListener(this));

        // Depending on the flag (boPasswordResetButtonActive), the submit button will be made active or inactive
        this._setSubmitButtonState();
    },

    /**
    *@method (private) _drawPasswordResetContainer
    *@desc This method will draw the password reset box
    */
    _drawPasswordResetContainer: function() {
        //        if(this.boDebug) log.debug('Executing method _drawPasswordResetContainer()');

        var stHtmlCode = ''
            + '<div id="idPasswordResetBox_container">'
            + '    <div id="idPasswordResetBox_border" class="passwordResetBox_border">'
            + '        <div id="idPasswordResetBox_emptyAreaIEMarginSolutionTop" class="passwordResetBox_emptyAreaIEMarginSolution"></div>'
            + '            <div id="idPasswordResetBox_innerPart" class="passwordResetBox_innerPart">'
            + '                <div style="background-image: url(&quot;/SAP/PUBLIC/BC/Icons/logon.png&quot;); height: 108px; text-align: center;></div>'
            + '                <div class="application_Banner passwordResetBox_euhrekaBanner"></div>'
            + '                <div id="idPasswordResetBox_textMessagePart" class="passwordResetBox_textMessagePart">'
            + '                    <span id="idPasswordResetBox_textMessage"></span>'
            + '                </div>'
            + '                <div id="idPasswordResetBox_formFieldsPart" class="passwordResetBox_formFieldsPart">'
            + '                    <div class="passwordResetBox_formFieldsLabels">'
            + '                        <div class="passwordResetBox_formFieldsLabelsText"><label id="idLabelUserId"></label></div>'
            + '                        <div class="passwordResetBox_formFieldsLabelsText"><label id="idLabelSystemId"></label></div>'
            + '                        <div class="passwordResetBox_formFieldsLabelsText"><label id="idLabelClient"></label></div>'
            + '                    </div>'
            + '                    <div class="passwordResetBox_formFieldsInputs">'
            + '                        <div class="passwordResetBox_formFieldsLabelsField"><input id="idInputUserId" class="content_input" value="" /></div>'
            + '                        <div class="passwordResetBox_formFieldsLabelsField"><input id="idInputSystemId" class="content_input" value="" /></div>'
            + '                        <div class="passwordResetBox_formFieldsLabelsField"><input id="idInputClient" class="content_input" value="" /></div>'
            + '                    </div>'
            + '                </div>'
            + '                <div id="idPasswordResetBox_buttonPart" class="passwordResetBox_buttonPart">'
            + '                    <table border="0" cellspacing="0" cellpadding="0">'
            + '                        <tr id="idPasswordResetBox_buttonRow">'
            + '                            <td class="passwordResetBox_emptySide">&nbsp;</td>'
            + '                            <td class="passwordResetBox_buttonStyle"><input id="idPasswordResetBox_button" type="button" value=""></td>'
            + '                            <td class="passwordResetBox_emptySide">&nbsp;</td>'
            + '                        </tr>'
            + '                    </table>'
            + '                </div>'
            + '            </div>'
            + '        <div id="idPasswordResetBox_emptyAreaIEMarginSolutionBottom" class="passwordResetBox_emptyAreaIEMarginSolution"></div>'
            + '    </div>'
            + '</div>';

        // Creating the container and adding it to the document body so it'll appear
        var obPasswordResetBoxContainer = new Element('div');
        obPasswordResetBoxContainer.writeAttribute('id', this.PASSWORD_RESET_CONTAINER_IDENTIFIER);
        obPasswordResetBoxContainer.writeAttribute('class', 'alignMiddle');
        obPasswordResetBoxContainer.innerHTML = stHtmlCode;

        obPasswordResetBoxContainer.setStyle({
            position: 'fixed',   //absolutize(this.obPasswordResetBoxContainer); Doesn't work?
            zIndex: 5001
        });

        this.virtualHtml.insert(obPasswordResetBoxContainer);

        // Make sure the container is centered
        centerContainer(this.PASSWORD_RESET_CONTAINER_IDENTIFIER, 'idPasswordResetBox_container', true);
    },

    /**
    *@method (private) _observeFields
    *@desc This method when called will activate or deactivate the submit button depending on the date in the input fields
    */
    _observeFields: function() {
        //        if(this.boDebug) log.debug('Executing method _observeFields()');

        // Obtaining the user id from the form in the password reset container
        var boSubmitButtonState = false;
        this.user = this.virtualHtml.down('[id=idInputUserId]').value;

        if (this.user != '' && this.virtualHtml.down('[id=idInputClient]').value != '' && this.virtualHtml.down('[id=idInputSystemId]').value != '') {

            this.client = this.virtualHtml.down('[id=idInputClient]').value;
            this.system = this.virtualHtml.down('[id=idInputSystemId]').value;

            boSubmitButtonState = true;
        }
        else {

            boSubmitButtonState = false;
        }

        // Making sure that the submit is aligned to the form content
        this._setSubmitButtonState(boSubmitButtonState);
    },

    /**
    *@method (private) _setSubmitButtonState
    * @param args
    *      (boolean) status: True will activate the button and false inactivate it
    *@desc This method will activate or deactivate the submit button depending on the value it receives
    */
    _setSubmitButtonState: function(_boState) {
        //        if(this.boDebug) log.debug('Executing method _setSubmitButtonState()');

        // boPasswordResetButtonActive is necessary because otherwise more than one observer will be created!
        if (Object.isEmpty(this.boPasswordResetButtonActive)) {

            this.boPasswordResetButtonActive = false;
        }

        // Activate button
        if (_boState) {

            if (!this.boPasswordResetButtonActive) {

                Event.observe(this.virtualHtml.down('[id=idPasswordResetBox_container]'), 'keypress', this._onKeyPress.bindAsEventListener(this));
                Event.observe(this.virtualHtml.down('[id=idPasswordResetBox_button]'), 'click', this._initiateRequestPasswordReset.bindAsEventListener(this));
                this.virtualHtml.down('[id=idPasswordResetBox_button]').disabled = false;
            }

            this.boPasswordResetButtonActive = true;

        }
        // Deactivate button
        else {

            Event.stopObserving(this.virtualHtml.down('[id=idPasswordResetBox_container]'));
            Event.stopObserving(this.virtualHtml.down('[id=idPasswordResetBox_button]'));
            this.boPasswordResetButtonActive = false;
            this.virtualHtml.down('[id=idPasswordResetBox_button]').disabled = true;
        }
    },

    /**
    *@method (private) _onKeyPress
    * @param args
    *      (event) key pressed: The key that was pressed by the user
    *@desc This method will call the method _initiateRequestPasswordReset when <Enter> was pressed and the submit button was active
    */
    _onKeyPress: function(event) {

        // If the enter button was pressed, initiate the password reset request
        if (event.keyCode == Event.KEY_RETURN) {

            this._initiateRequestPasswordReset();
        }
    },

    /*
    *@method _initiateRequestPasswordReset
    *@desc Resets user's password
    */
    _initiateRequestPasswordReset: function() {
        //        if(this.boDebug) log.debug('Executing method _initiateRequestPasswordReset()');

        // Present the loading screen to the user so (s)he has a clue that h(is/er) request is being processed
        this._drawTransparentLayer();
        this._drawLoadingScreen();
        this._setSubmitButtonState(false);

        // Complete the hyperlink that will eventually be included in the e-mail
        var stUrl = window.location.href;
        stUrl = stUrl.substring(0, stUrl.lastIndexOf('/')) + '/default.htm?cua=' + String(this.boCua);
        // If & is used instead of &amp; than a Prototype XML parse error will be thrown
        stUrl += '&amp;fwk=true';

        var xmlResetRequest = '' +
                                '<EWS>' +
                                '    <SERVICE>RESET_PASSWORD</SERVICE>' +
                                '    <PARAM>' +
                                '        <I_ACTION>I</I_ACTION>' +
                                '        <I_UNAME>' + this.virtualHtml.down('[id=idInputUserId]').value + '</I_UNAME>' +
                                '        <I_SYSID>' + this.virtualHtml.down('[id=idInputSystemId]').value + '</I_SYSID>' +
                                '        <I_CLIENT>' + this.virtualHtml.down('[id=idInputClient]').value + '</I_CLIENT>' +
                                '        <I_URL>' + stUrl + '</I_URL>' +
                                '    </PARAM>' +
                                '    <NOCNTX>X</NOCNTX>' +
                                '</EWS>';

        //        if(this.boDebug) log.debug('Going the call makeAJAXrequest()....');
        this.makeAJAXrequest($H({ xml: xmlResetRequest, successMethod: '_requestPasswordResetSuccess', failureMethod: '_requestPasswordResetFailure' }));

    },

    /**
    *@method (private) _requestPasswordResetSuccess
    * @param args
    *      (Object) xml object: This is not used right now
    *@desc This method will display the success message if the request for a password reset was successful
    */
    _requestPasswordResetSuccess: function(xml) {
        //        if(this.boDebug) log.debug('Executing method _requestPasswordResetSuccess()');

        // Put a success message, the associated color and re-center the container
        this.virtualHtml.down('[id=idPasswordResetBox_textMessage]').innerHTML = this.MESSAGES.get('success_request');
        this.virtualHtml.down('[id=idPasswordResetBox_textMessage]').className = this.MESSAGE_STYLES.get('normal');

        // Removing some parts of container
        this.virtualHtml.down('[id=idPasswordResetBox_formFieldsPart]').remove();
        this.virtualHtml.down('[id=idPasswordResetBox_buttonPart]').remove();

        // Remove the waiting screen
        this.virtualHtml.down('[id=idTransparantLayer]').remove();
        this.virtualHtml.down('[id=' + this.LOADING_CONTAINER_IDENTIFIER + ']').remove();

        // Log off
        this._logOff();
    },

    /**
    *@method (private) _requestPasswordResetFailure
    * @param args
    *      (Object) xml object: This is not used right now
    *@desc This method will display the error message if the request for a password reset was unsuccessful
    */
    _requestPasswordResetFailure: function(xml) {
        //        if(this.boDebug) log.debug('Executing method _requestPasswordResetFailure()');

        // Construct an error message with the provided information in it
        var stMessage = this.MESSAGES.get('error_request');
        stMessage = stMessage.replace("$user", this.virtualHtml.down('[id=idInputUserId]').value);
        stMessage = stMessage.replace("$user", this.virtualHtml.down('[id=idInputUserId]').value);
        stMessage = stMessage.replace("$client", this.virtualHtml.down('[id=idInputClient]').value);
        stMessage = stMessage.replace("$system", this.virtualHtml.down('[id=idInputSystemId]').value);

        // Put the error message, the associated color and re-center the container
        this.virtualHtml.down('[id=idPasswordResetBox_textMessage]').innerHTML = stMessage;
        this.virtualHtml.down('[id=idPasswordResetBox_textMessage]').className = this.MESSAGE_STYLES.get('error_request');

        // Make the submit button active again
        this._setSubmitButtonState(true);

        // Remove the waiting screen
        this.virtualHtml.down('[id=idTransparantLayer]').remove();
        this.virtualHtml.down('[id=' + this.LOADING_CONTAINER_IDENTIFIER + ']').remove();

    },

    /**
    *@method (private) _showScreenPerformPasswordReset
    * @param args
    *      (String) hash: This will be used at backend to identify the password reset request
    *@desc This method will display the screen that actually does the password reset. It will first to it and than show the result though.
    */
    _showScreenPerformPasswordReset: function(_stHash) {
        //        if(this.boDebug) log.debug('Executing method _showScreenPerformPasswordReset()');

        // Present the loading screen to the user so (s)he has a clue that h(is/er) request is being processed
        this._drawTransparentLayer();
        this._drawLoadingScreen();

        var stUrl = window.location.href;
        stUrl = stUrl.substring(0, stUrl.lastIndexOf("?")) + "&" + stUrl.substring(stUrl.lastIndexOf("?") + 1, stUrl.length);

        // Get the parameters from the URL
        var ststParams = stUrl.toQueryParams();

        if (ststParams.cua) {

            var stCua = ststParams.cua;

            if (stCua.toLowerCase() == 'false') {

                this.boCua = false;
            }
        }

        var xmlResetRequest = '' +
                            '<EWS>' +
                            '    <SERVICE>RESET_PASSWORD</SERVICE>' +
                            '    <PARAM>' +
                            '        <I_ACTION>C</I_ACTION>' +
                            '        <I_UNAME>' + ststParams.user + '</I_UNAME>' +
                            '        <I_SYSID>' + ststParams.system + '</I_SYSID>' +
                            '        <I_CLIENT>' + ststParams.client + '</I_CLIENT>' +
                            '        <I_CUA>' + this.boCua + '</I_CUA>' +
                            '        <I_HASH>' + _stHash + '</I_HASH>' +
                            '    </PARAM>' +
                            '    <NOCNTX>X</NOCNTX>' +
                            '</EWS>';

        this.makeAJAXrequest($H({ xml: xmlResetRequest, successMethod: '_performPasswordResettedSuccess', failureMethod: '_performPasswordResettedFailure' }));

    },

    /**
    *@method (private) _performPasswordResettedSuccess
    *@desc This method will display the success message if the actual password reset was successful
    */
    _performPasswordResettedSuccess: function() {
        //        if(this.boDebug) log.debug('Executing method _performPasswordResettedSuccess()');

        this._drawPasswordResetContainerSimplified(this.MESSAGES.get('success_perform'), this.MESSAGE_STYLES.get('normal'));
    },

    /**
    *@method (private) _performPasswordResettedFailure
    *@desc This method will display the error message if the actual password reset was unsuccessful
    */
    _performPasswordResettedFailure: function() {
        //        if(this.boDebug) log.debug('Executing method _performPasswordResettedFailure()');

        this._drawPasswordResetContainerSimplified(this.MESSAGES.get('error_perform'), this.MESSAGE_STYLES.get('error_request'));
    },

    /**
    *@method (private) _drawPasswordResetContainerSimplified
    * @param args
    *      (String) message: This is the message the will be shown in the box
    *      (String) style: This is the style of the message in the box
    *@desc This method will display the the box with the provided message
    */
    _drawPasswordResetContainerSimplified: function(_stMessage, _stMessageStyle) {
        //        if(this.boDebug) log.debug('Executing method _drawPasswordResetContainerSimplified()');

        document.title = "euHReka Workspace - Password Reset";

        // Reusing the the initial password reset container
        this._drawPasswordResetContainer();

        // Removing some parts of it
        this.virtualHtml.down('[id=idPasswordResetBox_formFieldsPart]').remove();
        this.virtualHtml.down('[id=idPasswordResetBox_buttonPart]').remove();

        // Set some content
        this.virtualHtml.down('[id=idPasswordResetBox_textMessage]').innerHTML = _stMessage;
        this.virtualHtml.down('[id=idPasswordResetBox_textMessage]').className = _stMessageStyle;

        // If the loader screen exists, remove it
        if (!Object.isEmpty(this.virtualHtml.down('[id=idTransparantLayer]')) && !Object.isEmpty(this.virtualHtml.down('[id=' + this.LOADING_CONTAINER_IDENTIFIER + ']'))) {

            this.virtualHtml.down('[id=idTransparantLayer]').remove();
            this.virtualHtml.down('[id=' + this.LOADING_CONTAINER_IDENTIFIER + ']').remove();
        }
    },

    /**
    *@method (private) _drawTransparentLayer
    *@desc This method will draw the transparant layer
    */
    _drawTransparentLayer: function() {
        //        if(this.boDebug) log.debug('Executing method _drawTransparentLayer()');

        // Create the elements
        var obTransparantLayer = new Element('div');
        obTransparantLayer.writeAttribute('id', 'idTransparantLayer');

        // Set some properties
        //this.virtualHtml.down('[id='+obTransparantLayer+']').setStyle({
        $(obTransparantLayer).setStyle({
            position: 'absolute',   //absolutize(this.obPasswordResetBoxContainer); Doesn't work?
            zIndex: 5002,
            opacity: 0.8, // This doesn't work in IE 6!
            height: String(document.viewport.getDimensions().height) + 'px',
            width: String(document.viewport.getDimensions().width) + 'px',
            top: String(0) + 'px',
            left: String(0) + 'px',
            backgroundColor: '#FFF'
        });

        // Add the transparant layer to the document body
        document.body.appendChild(obTransparantLayer);
    },

    /**
    *@method (private) _removePxFromPosition
    * @param args
    *      (String) position: The position probably containing "px"
    *@desc This method will remove the "px" from the position and turn it into an integer
    */
    _removePxFromPosition: function(_stPosition) {
        //        if(this.boDebug) log.debug('Executing method _removePxFromPosition()');

        var stPosition = String(_stPosition);

        if (stPosition.length > 2) {

            if (stPosition.substring(stPosition.length - 2, stPosition.length) == 'px') {

                return parseInt(stPosition.substring(0, stPosition.length - 2));

            } else {

                return parseInt(_stPosition);
            }

        } else {

            return parseInt(_stPosition);
        }
    },

    /**
    *@method (private) _drawLoadingScreen
    *@desc This method draws the loader and the small text underneath it
    */
    _drawLoadingScreen: function() {
        //        if(this.boDebug) log.debug('Executing method _drawLoadingScreen()');

        stHtmlCode = ''
            + '<div id="idPasswordResetBox_loadingContainer">'
            + '    <div class="passwordResetBox_loadingSquare"></div>'
            + '    <div class="passwordResetBox_loadingSperator"></div>'
            + '    <div class="passwordResetBox_loadingTekst"><span class="passwordResetBox_message">Processing your password reset request....</span></div>'
            + '</div>';

        // Create the elements
        var obLoadingBoxContainer = new Element('div');
        obLoadingBoxContainer.writeAttribute('id', this.LOADING_CONTAINER_IDENTIFIER);
        obLoadingBoxContainer.writeAttribute('class', 'alignMiddle');
        obLoadingBoxContainer.innerHTML = stHtmlCode;
        //this.virtualHtml.down('[id='+obLoadingBoxContainer+']').setStyle({
        $(obLoadingBoxContainer).setStyle({
            position: 'fixed',
            zIndex: 5003
        });

        // Add the transparant layer to the document body
        document.body.appendChild(obLoadingBoxContainer);

        // Make sure the loading container is centered
        centerContainer(this.LOADING_CONTAINER_IDENTIFIER, "idPasswordResetBox_loadingContainer", true);

        //this.virtualHtml.down('[id='+this.LOADING_CONTAINER_IDENTIFIER+']').focus();
        $(this.LOADING_CONTAINER_IDENTIFIER).focus();
    },

    _logOff: function() {
        var logOffXml = "<EWS><SERVICE>CLEAR_SESSION</SERVICE><PARAM><SSO>CLEAR</SSO><AREA/></PARAM></EWS>";
        this.url = "http://eu2r3edn.euhreka.erp:8003/sap/bc/yglui_httppub?sap-client=300";
        this.makeAJAXrequest($H({ xml: logOffXml, successMethod: '_redirectToHome', failureMethod: '_redirectToHome' }));
    },

    _redirectToHome: function() {
        var url = document.referrer;

        if (Object.isEmpty(url)) {
            url = __logOnUrl;
        }

        //window.location = url;
        window.setTimeout("location=('" + url + "');", 6000);
    }
});
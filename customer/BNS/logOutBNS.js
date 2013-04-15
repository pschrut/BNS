﻿var logOutAvo = Class.create(origin, {
    initialPath: null,
    goingOut: false,
    currPath: null,
    notResetFlag: false,
    letItGo: false,

    initialize: function($super) {
        $super('logOutAvo');
        this.onchangeRefreshFlagBinding = this.onchangeRefreshFlag.bindAsEventListener(this);
        this.onchangeURLBinding = this.onchangeURL.bindAsEventListener(this);
        this.onchangeLogoBinding = this.onchangeLogo.bindAsEventListener(this);
        document.observe('EWS:changeLogo', this.onchangeLogoBinding);
        document.observe('EWS:changeRefreshFlag', this.onchangeRefreshFlagBinding);
        document.observe('EWS:changeURL', this.onchangeURLBinding);

        /*Event.observe(window, 'beforeunload', function(event) {
            if (this.notResetFlag)
                setTimeout('this.notResetFlag = false;', 7000);
            else {
                if (!this.goingOut) {
                    var logOffXml = "<EWS><SERVICE>CLEAR_SESSION</SERVICE><PARAM><SSO>CLEAR</SSO><AREA/></PARAM></EWS>";
                    this.makeAJAXrequest($H({
                        xml: logOffXml,
                        successMethod: this.showLoggedOffScreen.bind(this),
                        errorMethod: this.showLoggedOffScreen.bind(this),
                        warningMethod: this.showLoggedOffScreen.bind(this),
                        infoMethod: this.showLoggedOffScreen.bind(this)
                    }));
                    this.goingOut = true;
                    alert(global.getLabel('ZZ_LOGOFF'));
                }
            }

        } .bind(this));

        Event.observe(window, 'unload', function(event) {
            if (!this.notResetFlag) {
                var cont = 0;
                while (!this.letItGo) {
                    var logOffXml = "<EWS><SERVICE>CLEAR_SESSION</SERVICE><PARAM><SSO>CLEAR</SSO><AREA/></PARAM></EWS>";
                    this.makeAJAXrequest($H({
                        xml: logOffXml,
                        successMethod: this.showLoggedOffScreen.bind(this),
                        errorMethod: this.showLoggedOffScreen.bind(this),
                        warningMethod: this.showLoggedOffScreen.bind(this),
                        infoMethod: this.showLoggedOffScreen.bind(this)
                    }));
                    //wait
                    var date = new Date();
                    var curDate = null;
                    do { curDate = new Date(); }
                    while (curDate - date < 3000);
                    cont++;
                    if (cont == 3)
                        this.letItGo = true; //prevent infite loop
                }
            }
        } .bind(this));
        setTimeout('document.fire("EWS:changeLogo");', 5000);*/
    },

    onchangeURL: function() {
        var customer = getURLParam("customer");
        var URL = document.location.protocol + "//";
        URL += document.location.host;
        URL += document.location.pathname;
        if (customer) {
            URL += "?customer=" + customer;
        }
        document.location.href = URL;
    },

    onchangeRefreshFlag: function() { this.notResetFlag = true },

    onchangeLogo: function() {
        try {
            var logoButton = document.getElementById('logoButton');
            if (Object.isEmpty(logoButton))
                var logoButton = document.getElementById('fwk_4');
            logoButton.stopObserving("click");
            logoButton.observe("click", function() {
                document.fire("EWS:changeRefreshFlag");
                document.fire("EWS:changeURL");
            });
        } catch (e) { setTimeout('document.fire("EWS:changeLogo");', 5000); }
    },

    /**
    * Redirects to home page
    */
    redirectToHome: function() {
        var url = __logOnUrl;
        if (!Object.isEmpty(global.redirectURL)) {
            var protocol = window.location.protocol;
            url = protocol + '//' + global.redirectURL;
        }
        window.location = url;
    },

    showLoggedOffScreen: function(args) {
        this.letItGo = true;
    }

});

var logOutAvo = new logOutAvo();
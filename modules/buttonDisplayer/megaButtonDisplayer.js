var megaButtonDisplayer = Class.create({
    hash: null,
    buttons: null,
    mainClass: null,
    standardButton: false,
    defaultType: 'button',
    defaultidButton: '',
    defaultLabel: null,
    defaultDelimit: null,
    defaultData: null,
    defaultButtonClassName: null,
    defaultLinkClassName: null,
    defaultHandler: null,
    defaultHandlerContext: null,
    defaultEvent: null,
    defaultEventOrHandler: false,
    defaultDisabledClass: 'megaButtonDisplayer_disabled',
    defaultActiveClass: 'megaButtonDisplayer_active',
    initialize: function(json) {
        if (!Object.isEmpty(json.defaultEventOrHandler)) this.defaultEventOrHandler = json.defaultEventOrHandler;
        if (!Object.isEmpty(json.defaultDisabledClass)) this.defaultDisabledClass = json.defaultDisabledClass;
        if (!Object.isEmpty(json.defaultActiveClass)) this.defaultActiveClass = json.defaultActiveClass;
        if (!Object.isEmpty(json.defaultType)) this.defaultType = json.defaultType;
        if (!Object.isEmpty(json.standardButton)) this.standardButton = json.standardButon;
        if (!Object.isEmpty(json.defaultidButton)) this.defaultidButton = json.defaultidButton;
        if (!Object.isEmpty(json.defaultLabel)) this.defaultLabel = json.defaultLabel;
        if (!Object.isEmpty(json.defaultDelimit)) this.defaultDelimit = json.defaultDelimit;
        if (!Object.isEmpty(json.defaultData)) this.defaultData = json.defaultData;
        if (!Object.isEmpty(json.defaultButtonClassName)) this.defaultButtonClassName = json.defaultButtonClassName;
        if (!Object.isEmpty(json.defaultLinkClassName)) this.defaultLinkClassName = json.defaultLinkClassName;
        if (!Object.isEmpty(json.defaultHandler)) this.defaultHandler = json.defaultHandler;
        if (!Object.isEmpty(json.defaultHandlerContext)) this.defaultHandlerContext = json.defaultHandlerContext;
        if (!Object.isEmpty(json.defaultEvent)) this.defaultEvent = json.defaultEvent;
        if (!Object.isEmpty(json.mainClass)) this.mainClass = json.mainClass;
        this.buttons = new Element('div', { 'class': this.mainClass });
        this.hash = $H({});
        this.buildButtons(json);
    },
    buildButtons: function(json) {
        var iter = 0;
        json.elements.each(function(button) {
            var aux = new Object();
            aux.disabledClass = (!Object.isEmpty(button.disabledClass)) ? button.disabledClass : this.defaultDisabledClass;
            aux.activeClass = (!Object.isEmpty(button.defaultActiveClass)) ? button.defaultActiveClass : this.defaultActiveClass;
            aux.eventOrHandler = (!Object.isEmpty(button.eventOrHandler)) ? button.eventOrHandler : this.defaultEventOrHandler;
            aux.isStandard = (!Object.isEmpty(button.standardButton)) ? button.standardButton : this.standardButton;
            aux.type = (!Object.isEmpty(button.type)) ? button.type : this.defaultType;
            aux.idButton = (!Object.isEmpty(button.idButton)) ? button.idButton : this.defaultidButton;
            aux.label = (!Object.isEmpty(button.label)) ? button.label : this.defaultLabel;
            aux.delimit = (!Object.isEmpty(button.delimit)) ? button.delimit : this.defaultDelimit;
            aux.data = (!Object.isEmpty(button.data)) ? button.data : this.defaultData;
            var auxClass = (aux.type == 'button') ? this.defaultButtonClassName : this.defaultLinkClassName;
            aux.className = (!Object.isEmpty(button.className)) ? button.className : auxClass;
            //************* Function is going to react to click *************
            aux.handler = (!Object.isEmpty(button.handler)) ? button.handler : this.defaultHandler;
            aux.handlerContext = (!Object.isEmpty(button.handlerContext)) ? button.handlerContext : this.defaultHandlerContext;
            //************* An event is going to be thrown when clicking ************* 
            aux.event = (!Object.isEmpty(button.event)) ? button.event : this.defaultEvent;
            aux.enabled = true;
            this.hash.set(aux.idButton, [aux]);
            this.createButton(aux, iter);
            iter++;
        } .bind(this));
        if (!Object.isEmpty(global.currentApplication)) {
            if (Object.isEmpty(global.buttonsByAppid.get(global.currentApplication.className))) {
                global.buttonsByAppid.set(global.currentApplication.className, { 'array': [this.hash] });
            }
            else {
                global.buttonsByAppid.get(global.currentApplication.className).array.push(this.hash);
            }
        }
    },
    createButton: function(button, index) {
        var aux = null;
        if (button.type == 'button') {
            if (button.isStandard == true) {

                aux = new Element('div', {
                    'class': button.className,
                    'id': button.idButton
                });
                var auxLeft = new Element('div', {
                    'class': 'leftRoundedCorner'
                });
                var auxCenter = new Element('span', {
                    'class': 'centerRoundedButton'
                });
                var auxRight = new Element('span', {
                    'class': 'rightRoundedCorner'
                });

                auxCenter.update(button.label);
                auxLeft.insert(auxCenter);
                auxLeft.insert(auxRight);
                aux.insert(auxLeft);
            }
            else
                aux = new Element('input', {
                    'type': button.type,
                    'class': button.className,
                    'value': button.label
                });
        } else {
            if (Object.isEmpty(button.delimit)) {
                aux = new Element('div', {
                    'class': button.className,
                    'id': button.idButton
                });
                aux.update(button.label);
                aux.addClassName('megaButtonDisplayer_floatLeft');
            }
            else {
                var className = button.className.gsub('application_action_link ', '');
                var html = button.label.replace(button.delimit, "<span class='application_action_link'>").replace(button.delimit, "</span>");
                aux = new Element('div', {
                    'class': className
                });
                aux.update(html);
            }
        }
        var observeHandler = null;
        if (!button.eventOrHandler) {
            observeHandler =
            function() {
                try {
                    if (!Object.isEmpty(this.handlerContext))
                        this.handler.call(this.handlerContext, this.data);
                    else
                        this.handler.call();
                } catch (e) {
                    //                    if(log)
                    //                        log.info('No handler has been defined for the button '+button.idButton);
                };
            } .bind(button);
            aux.observe('click', observeHandler);
        } else if (!Object.isEmpty(button.event)) {
            observeHandler =
            function() {
                document.fire(this.event, this.data);
            } .bind(button);
            aux.observe('click', observeHandler);
        }
        this.buttons.insert(aux);
        this.hash.get(button.idButton).push(aux);
        this.hash.get(button.idButton).push(observeHandler);
    },
    enable: function(idButton) {
        this.hash.get(idButton)[0].enabled = true;
        if ((this.hash.get(idButton)[0].isStandard)) {
            if (!Object.isEmpty(this.hash.get(idButton)[1].down('[class=leftRoundedCornerDisable]'))) {
                this.hash.get(idButton)[1].down('[class=leftRoundedCornerDisable]').className = 'leftRoundedCorner';
                this.hash.get(idButton)[1].down('[class=centerRoundedButtonDisable]').className = 'centerRoundedButton';
                this.hash.get(idButton)[1].down('[class=rightRoundedCornerDisable]').className = 'rightRoundedCorner';
            }
        } else {
            this.hash.get(idButton)[1].removeClassName(this.hash.get(idButton)[0].disabledClass);
            this.hash.get(idButton)[1].removeClassName(this.hash.get(idButton)[0].activeClass);
            this.hash.get(idButton)[1].addClassName('application_action_link');
        }
        this.hash.get(idButton)[1].observe('click', this.hash.get(idButton)[2]);
    },
    disable: function(idButton) {
        this.hash.get(idButton)[0].enabled = false;
        if ((this.hash.get(idButton)[0].isStandard)) {
            if (!Object.isEmpty(this.hash.get(idButton)[1].down('[class=leftRoundedCorner]'))) {
                this.hash.get(idButton)[1].down('[class=leftRoundedCorner]').className = 'leftRoundedCornerDisable';
                this.hash.get(idButton)[1].down('[class=centerRoundedButton]').className = 'centerRoundedButtonDisable';
                this.hash.get(idButton)[1].down('[class=rightRoundedCorner]').className = 'rightRoundedCornerDisable';
            }
        } else {
            this.hash.get(idButton)[1].addClassName(this.hash.get(idButton)[0].disabledClass);
            this.hash.get(idButton)[1].removeClassName('application_action_link');
            this.hash.get(idButton)[1].removeClassName(this.hash.get(idButton)[0].activeClass);
        }
        this.hash.get(idButton)[1].stopObserving('click', this.hash.get(idButton)[2]);
    },
    setActive: function(idButton) {
        this.hash.get(idButton)[0].enabled = false;
        if ((this.hash.get(idButton)[0].isStandard)) {
            if (!Object.isEmpty(this.hash.get(idButton)[1].down('[class=leftRoundedCorner]'))) {
                this.hash.get(idButton)[1].down('[class=leftRoundedCorner]').className = 'leftRoundedCornerDisable';
                this.hash.get(idButton)[1].down('[class=centerRoundedButton]').className = 'centerRoundedButtonDisable';
                this.hash.get(idButton)[1].down('[class=rightRoundedCorner]').className = 'rightRoundedCornerDisable';
            }
        } else {
            this.hash.get(idButton)[1].addClassName(this.hash.get(idButton)[0].activeClass);
            this.hash.get(idButton)[1].removeClassName('application_action_link');
            this.hash.get(idButton)[1].removeClassName(this.hash.get(idButton)[0].disabledClass);
        }
        this.hash.get(idButton)[1].stopObserving('click', this.hash.get(idButton)[2]);
    },
    isEnabled: function(idButton) {
        return this.hash.get(idButton)[0].enabled;
    },
    getButtons: function() {
        return this.buttons;
    },
    getButton: function(idButton) {
        return this.hash.get(idButton)[1];
    },
    getButtonsArray: function() {
        return this.hash;
    },
    updateHandler: function(idButton, handler) {
        this.hash.get(idButton)[0].handler = handler;
    },
    updateHandlerContext: function(idButton, context) {
        this.hash.get(idButton)[0].handlerContext = context;
    },
    updateEvent: function(idButton, event) {
        this.hash.get(idButton)[0].event = event;
    },
    updateData: function(idButton, data) {
        this.hash.get(idButton)[0].data = data;
    },
    updateLabel: function(idButton, label) {
        if (this.hash.get(idButton)[1].down('[class=centerRoundedButton]'))
            this.hash.get(idButton)[1].down('[class=centerRoundedButton]').update(label);
        else if (this.hash.get(idButton)[1].down('[class=centerRoundedButtonDisable]'))
            this.hash.get(idButton)[1].down('[class=centerRoundedButtonDisable]').update(label);
        else if ((!Object.isEmpty(this.hash.get(idButton)[0].className)) && (this.hash.get(idButton)[1].down('[class=' + this.hash.get(idButton)[0].className + ']')))
            this.hash.get(idButton)[1].down('[class=' + this.hash.get(idButton)[0].className + ']').update(label);
        else
            this.hash.get(idButton)[1].update(label);
    },
    updateWidth: function(idButton, width) {
        if (this.hash.get(idButton)[1].down('[class=centerRoundedButton]'))
            this.hash.get(idButton)[1].down('[class=centerRoundedButton]').setStyle({ width: width });
        else if ((!Object.isEmpty(this.hash.get(idButton)[0].className)) && (this.hash.get(idButton)[1].down('[class=' + this.hash.get(idButton)[0].className + ']')))
            this.hash.get(idButton)[1].down('[class=' + this.hash.get(idButton)[0].className + ']').setStyle({ width: width });
        else
            this.hash.get(idButton)[1].setStyle({ width: width });
    }
});
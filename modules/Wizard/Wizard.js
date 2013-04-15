var Wizard = Class.create({
    /*
    *@param 
    *@desc 
    */
    initialize: function(options) {
        this.options = options;
        this.topButtons = options.topButtons;
        this.normalButtons = options.normalButtons;
        this.targetDiv = options.container;
        if (!Object.isEmpty(options.clickable))
            this.clickable = options.clickable;
        else
            this.clickable = false;
        // First step number
        this.firstStepNumber = Object.isEmpty(options.firstStepNumber) ? 1 : options.firstStepNumber;
        this.sortTopButtonsByOrder();
        //check where do we have to start, from the beginning, or from a given step
        if (!Object.isEmpty(options.startStep))
            this.start = options.startStep;
        else
            this.start = this.sortedButtons[0];
        this.createHtml();
    },
    /*
    *@desc it creates an array (sortedButtons) which containes the wizard keys ordered. If the order is not defined, it takes the current order
    */
    sortTopButtonsByOrder: function() {
        if (this.topButtons.keys()[0] && this.topButtons.get(this.topButtons.keys()[0]) && this.topButtons.get(this.topButtons.keys()[0]).order) {
            this.sortedButtons = new Array();
            var ordersArray = new Array();
            this.topButtons.each(function(button) {
                ordersArray.push(button.value.order);
            } .bind(this));
            //bubbleSort
            for (var i = 1; i < ordersArray.length; i++) {
                for (var j = 0; j < ordersArray.length - 1; j++) {
                    if (ordersArray[j] > ordersArray[j + 1]) {
                        var temp = ordersArray[j];
                        ordersArray[j] = ordersArray[j + 1];
                        ordersArray[j + 1] = temp;
                    }
                }
            }
            ordersArray.each(function(order) {
                this.topButtons.each(function(button) {
                    if (button.value.order == order)
                        this.sortedButtons.push(button.key);
                } .bind(this));
            } .bind(this));
        } else {
            this.sortedButtons = this.topButtons.keys();
        }
    },
    /*
    *@desc It creates the first screen, the buttons, and the logic structure
    */
    createHtml: function() {
        this.currentStep = this.start;
        var stepsTitleContainer = new Element('div', { 'id': 'wizard_stepsTitlecontainer', 'class': 'wizard_stepTitlesingle_container' });
        this.containerTopButtons = new Element('div', { 'id': 'wizard_TB_cont', 'class': 'wizard_TB_class' });
        this.stepsContainer = new Element('div', { 'id': 'wizard_container', 'class': 'wizard_container_class' });
        // Storing all megaButtons (module instances) in a hash
        this.moduleNormalButtons = new Hash();
        this.containerNormalButtons = new Element('div', { 'id': 'wizard_NB_cont', 'class': 'wizard_NB_class' });
        this.targetDiv.insert(stepsTitleContainer);
        this.targetDiv.insert(this.containerTopButtons);
        this.targetDiv.insert(this.stepsContainer);
        this.targetDiv.insert(this.containerNormalButtons);
        var topKeys = this.sortedButtons;
        var anyPreviousMandatory = false;
        for (var i = 0; i < topKeys.length; i++) {
            var from = topKeys[i].length - 2;
            this.stepsContainer.insert("<div id='step_" + topKeys[i] + "' class='wizard_single_container'></div>");
            stepsTitleContainer.insert("<div id='stepTitle_" + topKeys[i] + "'></div>");
            if (topKeys[i] != this.start) {
                this.stepsContainer.down('[id=step_' + topKeys[i] + ']').hide();
                stepsTitleContainer.down('[id=stepTitle_' + topKeys[i] + ']').hide();
            }
            if (this.topButtons.get(topKeys[i]).mandatory == true) {
                this.containerTopButtons.insert("<div id='topButton_" + topKeys[i] + "'><div class='wizard_number'>" + parseInt(i + this.firstStepNumber) + "</div><div class='wizard_mandatory'></div></div>");
                if (anyPreviousMandatory == true)
                    this.containerTopButtons.down('[id=topButton_' + topKeys[i] + ']').addClassName('wizard_step_disabled');
                else {
                    this.containerTopButtons.down('[id=topButton_' + topKeys[i] + ']').addClassName('wizard_step');
                    if (this.clickable) {
                        this.containerTopButtons.down('[id=topButton_' + topKeys[i] + ']').addClassName('wizard_cursorHand');
                        this.containerTopButtons.down('[id=topButton_' + topKeys[i] + ']').observe('click', this.stepClicked.bind(this, topKeys[i]));
                    }
                }
                anyPreviousMandatory = true;
            } else {
                this.containerTopButtons.insert("<div id='topButton_" + topKeys[i] + "'><div class='wizard_number'>" + parseInt(i + this.firstStepNumber) + "</div></div>");
                if (anyPreviousMandatory == true)
                    this.containerTopButtons.down('[id=topButton_' + topKeys[i] + ']').addClassName('wizard_step_disabled');
                else {
                    this.containerTopButtons.down('[id=topButton_' + topKeys[i] + ']').addClassName('wizard_step');
                    if (this.clickable) {
                        this.containerTopButtons.down('[id=topButton_' + topKeys[i] + ']').addClassName('wizard_cursorHand');
                        this.containerTopButtons.down('[id=topButton_' + topKeys[i] + ']').observe('click', this.stepClicked.bind(this, topKeys[i]));
                    }
                }
            }
            if (topKeys[i] == this.currentStep) {
                this.containerTopButtons.down('[id=topButton_' + topKeys[i] + ']').addClassName('wizard_selected');
                this.containerTopButtons.down('[id=topButton_' + topKeys[i] + ']').addClassName('wizard_step');
                this.topButtons.get(topKeys[i]).visited = true;
            }
        }
        this.normalButtons.keys().each(function(button) {
            var data = this.normalButtons.get(button).data;
            var id = button + '_' + data.action;
            var json = {
                elements: []
            };
            var aux = {
                label: data.label_tag,
                idButton: id,
                handlerContext: null,
                handler: this.buttonClicked.bind(this, data.action),
                className: 'getContentButtons fieldDispFloatRight',
                type: 'button',
                standardButton: true
            };
            json.elements.push(aux);
            var buttons = new megaButtonDisplayer(json);
            this.containerNormalButtons.insert(buttons.getButtons());
            this.moduleNormalButtons.set(id, buttons);
        } .bind(this))
    },
    /*
    *@param html {html} The html code that we are inserting
    *@param title {html} The html code for the step title
    *@param id_step {string} Id of the step where we want to insert the html
    *@desc It inserts the html in the step
    */
    insertHtml: function(html, id_step, title) {
        this.targetDiv.down('[id=step_' + this.currentStep + ']').hide();
        this.targetDiv.down('[id=stepTitle_' + this.currentStep + ']').hide();
        if (this.targetDiv.down('[id=topButton_' + this.currentStep + ']') && this.targetDiv.down('[id=topButton_' + this.currentStep + ']').hasClassName('wizard_selected'))
            this.targetDiv.down('[id=topButton_' + this.currentStep + ']').removeClassName('wizard_selected');
        this.currentStep = id_step;
        if (this.targetDiv.down('[id=topButton_' + this.currentStep + ']')) {
            this.targetDiv.down('[id=topButton_' + this.currentStep + ']').addClassName('wizard_selected');
            this.targetDiv.down('[id=topButton_' + this.currentStep + ']').removeClassName('wizard_step_disabled');
            this.targetDiv.down('[id=topButton_' + this.currentStep + ']').addClassName('wizard_step');
        }
        this.targetDiv.down('[id=step_' + this.currentStep + ']').update(html);
        this.targetDiv.down('[id=stepTitle_' + this.currentStep + ']').update(title);
        this.targetDiv.down('[id=step_' + this.currentStep + ']').show();
        this.targetDiv.down('[id=stepTitle_' + this.currentStep + ']').show();
        this.topButtons.get(this.currentStep).visited = true;
        this.updateTopButtonsToRight(this.currentStep);
    },
    getContainer: function() {
        return this.stepsContainer;
    },
    getNormalButtons: function() {
        return this.containerNormalButtons;
    },
    /*
    *@param step {string} Step id that where we have already inserted html
    *@desc  The next buttons to the right till next mandatory one, will be available
    */
    updateTopButtonsToRight: function(step) {
        var mandatory = false;
        var auxStep = step;
        // Old Code
        //        while (this.getNextStep(auxStep) != auxStep && !mandatory) {
        //            auxStep = this.getNextStep(auxStep);
        //            this.targetDiv.down('[id=topButton_' + auxStep + ']').removeClassName('wizard_step_disabled');
        //            this.targetDiv.down('[id=topButton_' + auxStep + ']').addClassName('wizard_step');
        //            this.targetDiv.down('[id=topButton_' + auxStep + ']').stopObserving('click');
        //            this.targetDiv.down('[id=topButton_' + auxStep + ']').observe('click', this.stepClicked.bind(this, auxStep));
        //            if (this.topButtons.get(auxStep).mandatory == true)
        //                mandatory = true;
        //        }
        // New Code --> Allow to click only in actual step, next step and previous ones
        while (this.getNextStep(auxStep) != auxStep) {
            auxStep = this.getNextStep(auxStep);
            if (!mandatory) {
                this.targetDiv.down('[id=topButton_' + auxStep + ']').removeClassName('wizard_step_disabled');
                this.targetDiv.down('[id=topButton_' + auxStep + ']').addClassName('wizard_step');
                if (this.clickable) {
                    this.targetDiv.down('[id=topButton_' + auxStep + ']').addClassName('wizard_cursorHand');
                    this.targetDiv.down('[id=topButton_' + auxStep + ']').stopObserving('click');
                    this.targetDiv.down('[id=topButton_' + auxStep + ']').observe('click', this.stepClicked.bind(this, auxStep));
                }
                mandatory = true;
            }
            else {
                this.targetDiv.down('[id=topButton_' + auxStep + ']').addClassName('wizard_step_disabled');
                this.targetDiv.down('[id=topButton_' + auxStep + ']').removeClassName('wizard_step');
                if (this.clickable) {
                    this.targetDiv.down('[id=topButton_' + auxStep + ']').addClassName('wizard_cursorHand');
                    this.targetDiv.down('[id=topButton_' + auxStep + ']').stopObserving('click');
                }
            }
        }
    },
    /*
    *@param step {string} Step id that the user has clicked
    *@desc It fires the related event
    */
    stepClicked: function(step) {
        var parameters = { currentStep: this.currentStep, nextStep: step };
        if (this.currentStep != step) {
            if (!Object.isEmpty(this.options.events.get('onClicked')))
                document.fire(this.options.events.get('onClicked'), parameters);
        }
    },
    /*
    *@param action {string} Action related to the bottom button clicked
    *@desc It fires the related event
    */
    buttonClicked: function(action) {
        var parameters = { currentStep: this.currentStep, action: action };
        if (!Object.isEmpty(this.options.events.get('onClicked')))
            document.fire(this.options.events.get('onClicked'), parameters);
    },
    /*
    *@param step {string} Step id where we want to navigate
    *@desc It shows the step in the screen
    */
    goToStep: function(step) {
        if (this.topButtons.get(step) && this.isVisited(step)) {
            this.targetDiv.down('[id=step_' + this.currentStep + ']').hide();
            this.targetDiv.down('[id=stepTitle_' + this.currentStep + ']').hide();
            if (this.targetDiv.down('[id=topButton_' + this.currentStep + ']') && this.targetDiv.down('[id=topButton_' + this.currentStep + ']').hasClassName('wizard_selected'))
                this.targetDiv.down('[id=topButton_' + this.currentStep + ']').removeClassName('wizard_selected');
            this.currentStep = step;
            this.targetDiv.down('[id=topButton_' + this.currentStep + ']').addClassName('wizard_selected');
            this.targetDiv.down('[id=step_' + this.currentStep + ']').show();
            this.targetDiv.down('[id=stepTitle_' + this.currentStep + ']').show();
            this.updateTopButtonsToRight(step);
        }
    },
    /*
    *@param currentStep {string} The step which is currently shown
    *@desc It returns the next step to the right
    */
    getNextStep: function(currentStep) {
        var end = false;
        var length = this.sortedButtons.length;
        for (var i = 0; i < length && !end; i++) {
            if (this.sortedButtons[i] == currentStep) {
                end = true;
                if (i + 1 < length)
                    return this.sortedButtons[i + 1];
                else
                    return this.sortedButtons[i];
            }
        }
    },
    /*
    *@param currentStep {string} The step which is currently shown
    *@desc It returns the next step to the left
    */
    getPreviousStep: function(currentStep) {
        var end = false;
        var length = this.sortedButtons.length;
        for (var i = 0; i < length && !end; i++) {
            if (this.sortedButtons[i] == currentStep) {
                end = true;
                if (i > 0)
                    return this.sortedButtons[i - 1];
                else
                    return this.sortedButtons[0];
            }
        }
    },
    /*
    *@param stepId {string} Step id which we want to know if is visited or not
    *@desc It returns a boolean value, depending if the step has been created or not
    */
    isVisited: function(stepId) {
        if (this.topButtons.get(stepId) && this.topButtons.get(stepId).visited) {
            if (this.topButtons.get(stepId).visited == true)
                return true;
            else
                return false;
        } else
            return false;
    },
    /*
    *@param buttonsHtml (html)
    *@desc add buttons to the normalButtons container
    */
    addButtons: function(buttonsHtml) {
        var containerButtons;
        if (Object.isEmpty(this.containerNormalButtons.down('[id=WizardExtraButtons]')))
            containerButtons = new Element('div', { 'id': 'WizardExtraButtons' });
        else
            containerButtons = this.containerNormalButtons.down('[id=WizardExtraButtons]');

        containerButtons.update(buttonsHtml);
        Element.insert(this.containerNormalButtons, { top: containerButtons });
    }
});
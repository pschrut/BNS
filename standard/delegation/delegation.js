/**
 *@fileoverview delegation.js
 *@description It contains the classes needed for the Delegations application to work.
 */
/**
 *Implements the Delegations application
 *@constructor
 *@augments Application
 */
var DELE = Class.create(Application, {
    /**
     * @lends DEL
     */
    /**
     * Initializes the application
     * @param $super super class constructor
     */
    initialize: function($super, args){
        $super(args);
        global.initializeApplicationByAppId("DE_EDIT");
    },
    /**
     * @param $super Superclass run method
     */
    run: function($super){
        $super();
        if(this.firstRun){
            this.myCurrentContainer = new Element("div");
            this.peopleWhoContainer = new Element("div");

            this.virtualHtml.insert(this.myCurrentContainer);
            this.virtualHtml.insert(this.peopleWhoContainer);

            var myCurrentTitle = new Element("div", {
                "class": "applicationDEL_alignLeft applicationDEL_title"
            }).insert(new Element("span", {
                "class": "application_main_title applicationDEL_alignLeft applicationDEL_nofloat"
            }).update(global.getLabel("myCurrentDelegations")));

            var peopleWhoTitle = new Element("div", {
                "class": "applicationDEL_alignLeft applicationDEL_title"
            }).insert(new Element("span", {
                "class": "application_main_title applicationDEL_alignLeft applicationDEL_nofloat"
            }).update(global.getLabel("peopleWhoDelegatesMe")));

            var buttonsContainer = new Element("div", {
                "class": "applicationDEL_buttonsContainer"
            });
            var json = {
                    elements:[],
                    defaultEventOrHandler:true
                };
            var auxDelete =   {
                    idButton:'applicationDEL_buttonDelete',
                    event: "EWS:applicationDEL_delete",    
                    label: global.getLabel("delete"),
                    type: 'button',
                    standardButton:true
                  };                 
            json.elements.push(auxDelete);        
            this.ButtonDeleteDelegation=new megaButtonDisplayer(json);
            this.deleteButton = new Element("div", {
                "class": "applicationDEL_floatLeft applicationDEL_deleteButton"
            }).insert(this.ButtonDeleteDelegation.getButtons());
            this.ButtonDeleteDelegation.disable('applicationDEL_buttonDelete');
            this.notifyCheck = new Element("div", {
                "class": "applicationDEL_floatLeft applicationDEL_notify"
            }).insert(new Element("input", {
                type: "checkbox",
                "name": "applicationDEL_notifyCheckbox",
                "id": "applicationDEL_notifyCheckbox"
            }));
            var notifyText = new Element("label",{
                "for": "applicationDEL_notifyCheckbox"
            }).update(new Element("span", {
                "class": "application_main_soft_text"
            }).update(global.getLabel("notifyByEmail")));
            this.notifyCheck.insert(notifyText);
            var addNewText = new Element("div", {
                "class": "applicationDEL_addNew"
            }).insert(new Element("span", {
                "class": "application_action_link"
            }).update(global.getLabel("addNewDelegation")).observe("click", this.addNewDelegation.bind(this)));
            this.hideDeleteAndNotify();
            $A([this.deleteButton, this.notifyCheck, addNewText, "<div style='clear: both;'></div>"]).each(function(elem){
                buttonsContainer.insert(elem);
            });

            this.myCurrentContainer.insert({
                after: buttonsContainer
            });

            this.myCurrentContainer.insert({before: myCurrentTitle});
            this.peopleWhoContainer.insert({before: peopleWhoTitle});
        }
        this.getDelegations();
    },
    /**
     * @param $super Superclass close method
     */
    close: function($super){
        $super();
        document.stopObserving("EWS:applicationDEL_delete");
    },
    /**
     * Gets the delegations for the current user
     */
    getDelegations: function(){
        var json_UPD_DELEGATION = {
            EWS: {
                SERVICE: "UPD_DELEGATION",
                OBJECT: {
                    "#text": global.objectId,
                    "-TYPE": global.objectType
                }
            }
        };

        var jsonConverter = new XML.ObjTree();
        this.makeAJAXrequest($H({
            xml: jsonConverter.writeXML(json_UPD_DELEGATION),
            successMethod: "getDelegationsSuccess"
        }));
    },
    /**
     * Shows the delegations for the current user in case they exist
     * @param json data coming from the service with the delegations
     */
    getDelegationsSuccess: function(json){
        if(json.EWS.o_profile){
            var profiles = objectToArray(json.EWS.o_profile.yglui_str_delegation_profile);
        }else{
            return;
        }
        if(json.EWS.o_delegation){
            this.showDeleteAndNotify();
            var delegations = objectToArray(json.EWS.o_delegation.yglui_str_delegated);
            var delegationsTable = new DelegationTable("applicationDEL_delegations", delegations, profiles, false, this);
            var table = this.myCurrentContainer.down("table");
            if(table){
                table.remove();
            }
            this.myCurrentContainer.update(delegationsTable.element);
        }else{
            this.hideDeleteAndNotify();
            this.myCurrentContainer.update(new Element("span", {
                "class": "application_main_soft_text applicationDEL_nofloat"
            }).update(global.getLabel("noDelegations")));
            this.myCurrentContainer.addClassName("applicationDEL_alignLeft");
        }

        if(json.EWS.o_substitution){

            var substitution = objectToArray(json.EWS.o_substitution.yglui_str_delegated);
            var substitutionTable = new DelegationTable("applicationDEL_substitution", substitution, profiles, true, this);
            var table = this.peopleWhoContainer.down("table");
            if(table){
                table.remove();
            }
            this.peopleWhoContainer.update(substitutionTable.element);
        }else{
            this.peopleWhoContainer.update(new Element("span", {
                "class": "application_main_soft_text applicationDEL_nofloat"
            }).update(global.getLabel("noSubstitutions")));
            this.peopleWhoContainer.addClassName("applicationDEL_alignLeft");
        }

        if(json.EWS.o_users){
            this.users = objectToArray(json.EWS.o_users.yglui_str_uname);
        }

        document.fire("EWS:applicationDEL_delegationsReady", {
            users: this.users,
            profiles: profiles
        });
    },
    /**
     * Opens the application to add a new delegation to the list
     */
    addNewDelegation: function(){
        global.open($H({
        	app: {
        		tabId: "INBOX_DE",
				appId: "DE_EDIT",
				view: "DelegationEditor"
			},
            action: "C"
        }));
        
    },
    hideDeleteAndNotify: function(){
        this.deleteButton.hide();
        this.notifyCheck.hide();
    },
    showDeleteAndNotify: function(){
        this.deleteButton.show();
        this.notifyCheck.show();
    }
});
/**
 * Class to create the delegations or substitutions table
 * @constructor
 * @augments origin
 */
var DelegationTable = Class.create(origin, {
    /**
    * @lends DelegationTable
    */

    /**
    * Array with the checkboxes in the table to select them in a fast way
    * @type Array
    */
    checkboxes: null,
    /**
    *  Table element. It will contain all the table elements
    * @type Element
    */
    element: null,

    /**
    * Initializes the table. It's different whether it's a delegations or
    * substitutions table and all the related variables, events, etc.
    * @param $super Superclass initializer
    * @param tableId {String} id that will be used for the table
    * @param delegations {Array} the list with the delegations or substitutions
    *          as coming from SAP
    * @param profiles {Array} The list with the actions profiles
    * @param toMe {boolean} Wheter it will be a delegations or substitutions
    *          table. when true it's substitutions, false otherwise.
    */
    initialize: function($super, tableId, delegations, profiles, toMe, callerInstance) {
        $super();
        this.tableId = tableId;
        this.toMe = toMe;
        this.initializeTable(delegations, profiles);
        if (!toMe && !this.onDeleteClickedBinding) {
            this.onDeleteClickedBinding = this.onDeleteClicked.bind(this);
            document.observe("EWS:applicationDEL_delete", this.onDeleteClickedBinding);
        }
        this.callerInstance = callerInstance;
    },
    /**
    * Initializes the table itself
    * @param delegations {Array} the list with the delegations or substitutions
    *          as coming from SAP
    * @param profiles {Array} The list with the actions profiles
    */
    initializeTable: function(delegations, profiles) {
        this.checkboxes = $A();
        if (!this.element) {
            this.element = new Element("table", {
                id: this.tableId + "_" + Math.random(),
                "class": "sortable resizable applicationDEL_table"
            });
        } else if (!delegations) {
            var parent = this.element.up();
            parent.update(new Element("span", {
                "class": "application_main_soft_text applicationDEL_nofloat"
            }).update(global.getLabel("noDelegations")));
            this.callerInstance.hideDeleteAndNotify();
            parent.addClassName("applicationDEL_alignLeft");
            return;
        } else {
            var parent = this.element.up();
            this.element = new Element("table", {
                id: this.tableId + "_" + Math.random(),
                "class": "sortable resizable applicationDEL_table"
            });
            parent.update(this.element);
            this.callerInstance.showDeleteAndNotify();
        }
        var checkAllTh = this.toMe ? "" : ("<th class='applicationDEL_thCheckbox' id='" + this.tableId + "_checkAllCell'></th>");
        var thead =
        "<thead>" +
        "<tr>" +
        checkAllTh +
        "<th>" + global.getLabel("to") + "</th>" +
        "<th>" + global.getLabel("delegation") + "</th>" +
        "<th>" + global.getLabel("validityPeriod") + "</th>" +
        "<th class='applicationDEL_thActivity'>" + global.getLabel("activity") + "</th>" +
        "</tr>" +
        "</thead>";

        this.element.update(thead);
        var selectAll = new Element("input", {
            type: "checkbox"
        });

        selectAll.observe("click", function(event) {
            this.onCheckAll(event);
            this.enableDelete();
        } .bindAsEventListener(this));
        selectAll.observe("mousedown", function(event) {
            event.stop();
        });

        if (!this.toMe) {
            this.element.down("[id=" + this.tableId + "_checkAllCell]").insert(selectAll);
        }
        var tbody = this.element.down("tbody");
        if (!tbody) {
            tbody = new Element("tbody");
            this.element.insert(tbody);
        }
        delegations.each(function(del) {
            var tr = new Element("tr");
            tbody.insert(tr);
            var select;
            if (!this.toMe) {
                select = new Element("td");
                var checkbox = new Element("input", {
                    type: "checkbox"
                });
                checkbox.observe("click", this.enableDelete.bindAsEventListener(this));
                this.checkboxes.push({
                    element: checkbox,
                    delegation: del
                });
                select.insert(checkbox.wrap(new Element("div", {
                    "class": "applicationDEL_tableCheckbox"
                })));
            }
            if (!this.toMe) {
                var detailsLink = new Element("span", {
                    "class": "application_action_link"
                }).observe("click", global.open.bind(global, $H({
                    app: {
                		tabId: "INBOX_DE",
                		appId: "DE_EDIT",
                		view: "DelegationEditor"
                	},
                    viewDetails: true,
                    delegation: del
                })));
                detailsLink.update(del["@ename"]);
                var to = new Element("td").update(detailsLink);
            } else {
                var to = new Element("td").update(del["@ename"]);
            }

            var profile = profiles.find(function(prof) {
                return prof["@reppr"] == del["@reppr"];
            });
            var delegation = new Element("td").update(profile["@rtext"]);

            var validityPeriod = new Element("td").update(sapToDisplayFormat(del["@begda"]) + " - " + sapToDisplayFormat(del["@endda"]));

            var activity = new Element("td");
            var activityIcon = new Element("div", {
                "class": "applicationDEL_activityIcon"
            });
            if (del["@active"] == "X") {
                activityIcon.addClassName("application_icon_green");
            } else {
                activityIcon.addClassName("application_icon_red");
            }
            activityIcon.observe("click", this.onActivityChange.bindAsEventListener(this, del));
            activity.insert(activityIcon);

            if (this.toMe) {
                $A([to, delegation, validityPeriod, activity]).each(function(elem) {
                    tr.insert(elem);
                });
            } else {
                $A([select, to, delegation, validityPeriod, activity]).each(function(elem) {
                    tr.insert(elem);
                });
            }
        } .bind(this));
        TableKit.Sortable.init(this.element, {
            pages: global.paginationLimit
        });
        TableKit.options.autoLoad = false;
    },
    /**
    * Enables the delete button
    * @param event {Event} the DOM Event causing this function to run.
    */
    enableDelete: function(event) {
        var buttonDisplayer = this.callerInstance.ButtonDeleteDelegation;
        var buttonEnabled = buttonDisplayer.isEnabled("applicationDEL_buttonDelete");
        var enableButton = false;
        this.checkboxes.each(function(checkbox) {
            if (buttonEnabled) {
                enableButton = $F(checkbox.element) == "on" || enableButton;
            } else {
                enableButton = $F(checkbox.element) == "on" || buttonEnabled || enableButton;
            }
        });
        if (enableButton) {
            buttonDisplayer.enable("applicationDEL_buttonDelete");
            //            button.addClassName("applicationDEL_deleteButtonEnabled");
        } else {
            buttonDisplayer.disable("applicationDEL_buttonDelete");
            //            button.removeClassName("applicationDEL_deleteButtonEnabled");
        }
    },
    /**
    * It will show a confirmation box asking to delete the delegation or not
    */
    onDeleteClicked: function() {
        var toDelete = $A();
        var delegationsToDelete = $A();
        this.checkboxes.each(function(checkbox) {
            if ($F(checkbox.element) == "on") {
                toDelete.push(checkbox);
                delegationsToDelete.push(checkbox.delegation);
            }
        });


        var _this = this;
        var contentHTML = new Element('div');
        contentHTML.insert(global.getLabel("areYouSureDelegation"));
        //buttons
        var buttonsJson = {
            elements: [],
            mainClass: 'moduleInfoPopUp_stdButton_div_left'
        };
        var callBack = function() {
            var json_UPD_DELEGATION = {
                EWS: {
                    SERVICE: "UPD_DELEGATION",
                    PARAM: {
                        I_ACTION: "D",
                        I_PARAMETER: {
                            YGLUI_STR_DELEGATION_ACTION: delegationsToDelete
                        },
                        I_MAIL: $F("applicationDEL_notifyCheckbox") == "on" ? "X" : " "
                    }
                }
            };

            var jsonConverter = new XML.ObjTree();
            jsonConverter.attr_prefix = '@';
            _this.makeAJAXrequest($H({
                xml: jsonConverter.writeXML(json_UPD_DELEGATION),
                successMethod: "onDelectionSuccess"
            }));
            delegationPopUp.close();
            delete delegationPopUp;

        };
        var callBack3 = function() {
            delegationPopUp.close();
            delete delegationPopUp;
        };         
        var aux2 = {
            idButton: 'Yes',
            label: global.getLabel('yes'),
            handlerContext: null,
            className: 'moduleInfoPopUp_stdButton',
            handler: callBack,
            type: 'button',
            standardButton: true
        };
        var aux3 = {
            idButton: 'No',
            label: global.getLabel('no'),
            handlerContext: null,
            className: 'moduleInfoPopUp_stdButton',
            handler: callBack3,
            type: 'button',
            standardButton: true
        };         

        buttonsJson.elements.push(aux2);
        buttonsJson.elements.push(aux3);
        var ButtonObj = new megaButtonDisplayer(buttonsJson);
        var buttons = ButtonObj.getButtons();
        //insert buttons in div
        contentHTML.insert(buttons);

        var delegationPopUp = new infoPopUp({

            closeButton: $H({
                'textContent': 'Close',
                'callBack': function() {

                    delegationPopUp.close();
                    delete delegationPopUp;
                }
            }),
            htmlContent: contentHTML,
            indicatorIcon: 'information',
            width: 350
        });
        delegationPopUp.create();
    },
    /**
    * It will refresh the table when a delegation has been deleted
    * @param json {JSON} The data coming from SAP after the deletion.
    */
    onDelectionSuccess: function(json) {
        if (json.EWS.o_delegation)
            var delegations = objectToArray(json.EWS.o_delegation.yglui_str_delegated);
        var profiles = objectToArray(json.EWS.o_profile.yglui_str_delegation_profile);
        this.initializeTable(delegations, profiles);
    },
    /**
    * It will handle the "check all" checkbox selection
    * @param event {Event} The DOM Event caused by the check all checkbox selection
    */
    onCheckAll: function(event) {
        var checkAll = event.element().checked;
        this.checkboxes.each(function(checkbox) {
            checkbox.element.checked = checkAll;
        });
    },
    /**
    * It will change the Active/Inactive flag for the delegation
    * @param event {Event} The DOM Event caused by the click to change the
    *          status
    * @param del {JSON} The delegation which will be enabled/disabled
    */
    onActivityChange: function(event, del) {
        var element = event.element();
        if (del["@active"] == "X") {
            del["@active"] = "";
        } else {
            del["@active"] = "X";
        }

        var json_UPD_DELEGATION = {
            EWS: {
                SERVICE: "UPD_DELEGATION",
                PARAM: {
                    I_ACTION: del["@active"] == "X" ? "A" : "U",
                    I_PARAMETER: {
                        YGLUI_STR_DELEGATION_ACTION: {
                            "-PERNR": del["@pernr"],
                            "-UNAME": del["@uname"],
                            "-BEGDA": del["@begda"],
                            "-ENDDA": del["@endda"],
                            "-REPPR": del["@reppr"],
                            "-ACTIVE": del["@active"],
                            "-SMAIL": ""
                        }
                    }
                }
            }
        };

        var jsonConverter = new XML.ObjTree();
        this.makeAJAXrequest($H({
            xml: jsonConverter.writeXML(json_UPD_DELEGATION),
            successMethod: "changeDelegationStatus",
            ajaxID: element.identify()
        }));
    },
    /**
    * Empty function.
    */
    changeDelegationStatus: function(json, ajaxId) {
        var elementClicked = this.element.down("div#" + ajaxId);
        elementClicked.toggleClassName("application_icon_green");
        elementClicked.toggleClassName("application_icon_red");
        return;
    }
});
/**
 *Implements the Delegations edition or details vewing application
 *@constructor
 *@augments Application
 */
var DelegationEditor = Class.create(Application,{
    /**
     * @lends DelegationEditor
     */
    /**
     * Initializes the application
     * @param $super Superclass initializer
     */
    initialize: function($super, options){
        $super(options);
        document.observe("EWS:applicationDEL_delegationsReady", this.delegationsReady.bindAsEventListener(this));
    },
    /**
     * Runs the application
     * @param $super Superclass run method
     * @param args {Hash} Params given to the application
     */
    run: function($super, args){
        $super(args);
        this.viewDetails = args.get("viewDetails");
        var delegation = args.get("delegation");
        var titleText, enterNameText, selectedActionsText, selectDatesText, selectStatusText;
        if(this.viewDetails){
            titleText = global.getLabel("deleteDelegation");
            enterNameText = global.getLabel("personYouDelegate");
            selectedActionsText = global.getLabel("selectedActions");
            selectDatesText = global.getLabel("validityPeriod");
            selectStatusText = global.getLabel("activityStatus");
        }else{
            titleText = global.getLabel("addNewDelegation");
            enterNameText = global.getLabel("enterNameDelegation");
            selectedActionsText = global.getLabel("selectActionDelegation");
            selectDatesText = global.getLabel("selectDatesDelegation");
            selectStatusText = global.getLabel("selectStatusDelegation");
        }
        var title = new Element("div", {
            "class": "applicationDEL_alignLeft applicationDEL_title"
        }).insert(new Element("span", {
            "class": "applicationDEL_alignLeft applicationDEL_title application_main_title applicationDEL_nofloat"
        }).insert(titleText));
        this.virtualHtml.update(title);

       
        var divClasses = {
            "class": "applicationDEL_nofloat applicationDEL_alignLeft applicationDEL_title"
        };
        var spanClasses = {
            "class": "applicationDEL_nofloat application_text_bolder"
        };

        this.enterNameContainer = new Element("div", {
            "class": "applicationDEL_alignLeft"
        });
        var enterName = new Element("div", divClasses ).insert(new Element("span", spanClasses).update(enterNameText));
        this.enterNameContainer.insert(enterName);

        this.selectActionsContainer = new Element("div");
        var selectAction = new Element("div", divClasses).insert(new Element("span", spanClasses).update(selectedActionsText));
        this.selectActionsContainer.insert(selectAction);

        this.selectDatesContainer = new Element("div");
        var selectDates = new Element("div", divClasses).insert(new Element("span", spanClasses).update(selectDatesText));
        this.selectDatesContainer.insert(selectDates);

        this.statusContainer = new Element("div");
        var status = new Element("div", divClasses).insert(new Element("span", spanClasses).update(selectStatusText));
        this.statusContainer.insert(status);

        this.buttonsContainer = new Element("div", {});

        $A([this.enterNameContainer,
            this.selectActionsContainer,
            this.selectDatesContainer,
            this.statusContainer,
            this.buttonsContainer]).each(function(element){
            this.virtualHtml.insert(element);
        }.bind(this));

        this.setAutocompleter(delegation);
        this.setNotifyByMail(delegation);
        this.setActions(delegation);
        this.setDatePickers(delegation);
        this.setStatus(delegation);
        this.setButtons(delegation);

        if(!this.viewDetails){
            this.autoCompleterSelectedBinding = this.autocompleterSelected.bindAsEventListener(this);
            document.observe("EWS:applicationDEL_nameSelected", this.autoCompleterSelectedBinding);
            this.dateSelectedBinding = this.dateSelected.bind(this);
            document.observe("EWS:applicationDEL_fromSelected", this.dateSelectedBinding);
            document.observe("EWS:applicationDEL_toSelected", this.dateSelectedBinding);
        }
    },
    /**
     * Closes the current application
     * @param $super Ssuperclass close method
     */
    close: function($super){
        $super();
        if(!this.viewDetails){
            document.stopObserving("EWS:applicationDEL_nameSelected", this.autoCompleterSelectedBinding);
            document.stopObserving("EWS:applicationDEL_fromSelected", this.dateSelectedBinding);
            document.stopObserving("EWS:applicationDEL_toSelected", this.dateSelectedBinding);
        }
    },
    /**
     * Initializes the autocompleter if its a new delegation editor or shows
     * the name if it's a vew details
     * @param delegation {JSON} The delegation data
     */
    setAutocompleter: function(delegation){
        if(this.viewDetails){
            this.enterNameContainer.insert(delegation["@ename"]);
        }else{
            var autocompleterContainer = new Element("div", {
                id: "applicationDEL_autocompleter"
            });
            this.enterNameContainer.insert(autocompleterContainer);
            var namesArray = $A();
            this.users.each(function(user){
                namesArray.push({
                    text: user["@ename"],
                    data: user["@pernr"]
                });
            });
            var autocompleterJson = {
                autocompleter: {
                    object: namesArray
                }
            };
            var delegationsAutocompleter = new JSONAutocompleter(autocompleterContainer.identify(),{
                showEverythingOnButtonClick: true,
                templateOptionsList: "#{text}",
                events: $H({
                    onResultSelected: "EWS:applicationDEL_nameSelected"
                })
            }, autocompleterJson);
        }
    },
    /**
     * Function to be runned when an option is selected in the autocompleter
     */
    autocompleterSelected: function(event){
        var args = getArgs(event);
        this.selectedUser = this.users.find(function(user){
            return user["@pernr"] == args.idAdded;
        });
        this.ButtonAddDelegation.enable('addDelegationButton');
    },
    /**
     * Sets the notify by mail checkbox
     */
    setNotifyByMail: function(){
        this.notifyByMailCheckbox = new Element("input", {
            name: "applicationDEL_notifyByMail",
            id: "applicationDEL_notifyByMail",
            type: "checkbox"
        });
        var notifyByMailContainer = new Element("div", {
            "class": "applicationDEL_nofloat applicationDEL_alignLeft"
        }).insert(this.notifyByMailCheckbox).insert(new Element("label",{
            "for": "applicationDEL_notifyByMail"
        }).update(new Element("span", {
            "class": "application_main_soft_text"
        }).update(global.getLabel("notifyByEmail"))));

        this.enterNameContainer.insert(notifyByMailContainer);
    },
    /**
     * Sets the action list, enabled if it's to create a new delegation or
     * disabled if it's just to show the info
     * @param delegation {JSON} The delegation data
     */
    setActions: function(delegation){
        this.allInput = new Element("input", {
            type: "radio",
            name: "applicationDEL_action",
            id: "applicationDEL_action_all"
        });
        if(!this.viewDetails || delegation["@reppr"] == "ALL"){
            this.allInput.defaultChecked = true;
            this.allInput.checked = true;
            this.allInput.writeAttribute("checked", true);
            this.allInput.writeAttribute("defaultChecked", true);
        }
        if(this.viewDetails){
            this.allInput.disable();
        }else{
            this.allInput.observe("click", this.specificSelected.bindAsEventListener(this));
        }
        var all = new Element("div", {
            "class": "applicationDEL_alignLeft applicationDEL_nofloat"
        }).insert(this.allInput).insert(new Element("label", {
            "for": "applicationDEL_action_all"
        }).update(global.getLabel("all")));

        this.selectActionsContainer.insert(all);

        var specific = new Element("div", {
            "class": "applicationDEL_alignLeft applicationDEL_specificContainer"
        });
        var specificInput = new Element("input", {
            type: "radio",
            name: "applicationDEL_action",
            id: "applicationDEL_action_specific"
        });
        if(this.viewDetails){
            specificInput.disable();
        }else{
            specificInput.observe("click", this.specificSelected.bindAsEventListener(this));
        }
        var specificLabel = new Element("label", {
            "for": "applicationDEL_action_specific"
        }).update(global.getLabel("specific"));
        specific.insert(specificInput).insert(specificLabel);

        var specificTypes = new Element("div", {
            "class": "applicationDEL_alignLeft applicationDEL_specificTypesContainer"
        });
        this.typesRadio = $A();
        this.profiles.each(function(profile){
            if(profile["@reppr"] == "ALL" || profile["@displ"] != "X") return;
            var optionContainer = new Element("div", {
                "class": "applicationDEL_alignLeft applicationDEL_nofloat"
            });
            var checkbox = new Element("input", {
                type: "checkbox",
                value: profile["@reppr"],
                id: profile["@reppr"],
                name: "applicationDEL_radioSpecific"
            }).disable();
            if(this.viewDetails && delegation["@reppr"] == profile["@reppr"]){
                checkbox.defaultChecked = true;
                checkbox.checked = true;
            }else if(this.viewDetails && "reppd" in delegation){
                objectToArray(delegation.reppd.yglui_str_delegation_profiled).each(function(prof){
                    if(prof["@reppr"] == profile["@reppr"]){
                        checkbox.defaultChecked = true;
                        checkbox.checked = true;
                    }
                }.bind(this));
            }
            this.typesRadio.push(checkbox);
            optionContainer.insert(checkbox);
            var label = new Element("label", {
                "class": "applicationDEL_alignLeft",
                "for": profile["@reppr"]
            }).update(profile["@rtext"]);
            optionContainer.insert(label);
            specificTypes.insert(optionContainer);
        }.bind(this));

        this.selectActionsContainer.insert(specific);
        this.selectActionsContainer.insert(specificTypes);

    },
    /**
     * Method to activate the specific actions checkbox buttons.
     * @param event {Event} DOM Event coming from the click
     */
    specificSelected: function(event){
        if(event.element().identify() == "applicationDEL_action_specific"){
            this.typesRadio.each(function(element, index){
                element.enable();
                if(index == 0){
                    element.defaultChecked = true;
                    element.checked = true;
                }
            });
        }else{
            this.typesRadio.each(function(element){
                if($F(element)){
                    element.defaultChecked = false;
                    element.checked = false;
                }
                element.disable();
            });
        }
    },
    /**
     * Get's the selected profile
     */
    getProfile: function(){
        var onInputs = $A();
        if($F(this.allInput) == "on"){
            return "ALL";
        }else{
            this.typesRadio.each(function(checkbox){
                if($F(checkbox)){
                    onInputs.push($F(checkbox));
                }
            });
            return onInputs;
        }
    },
    /**
     * Sets the date pickers for the delegation validity date or shows that
     * dates according to the format specified in global
     * @param delegation {JSON} The delegation data
     */
    setDatePickers: function(delegation){
        var textFrom = new Element("span", {
            "class": "applicationDEL_floatLeft applicationDEL_fromTo application_main_soft_text"
        }).update(global.getLabel("from"));
        var calendarFrom = new Element("div", {
            id: "applicationDEL_datePickerFrom"
        });
        var textTo = new Element("span", {
            "class": "applicationDEL_floatLeft applicationDEL_fromTo application_main_soft_text"
        }).update(global.getLabel("to"));
        var calendarTo = new Element("div",{
            id: "applicationDEL_datePickerTo"
        });
        this.selectDatesContainer.insert(textFrom);
        this.selectDatesContainer.insert(calendarFrom);
        this.selectDatesContainer.insert(textTo);
        this.selectDatesContainer.insert(calendarTo);
        if(this.viewDetails){
            calendarFrom.insert(sapToDisplayFormat(delegation["@begda"]));
            calendarTo.insert(sapToDisplayFormat(delegation["@endda"]));
            calendarFrom.addClassName("applicationDEL_floatLeft");
            calendarTo.addClassName("applicationDEL_floatLeft");
            calendarFrom.addClassName("applicationDEL_calendarFromToText");
            calendarTo.addClassName("applicationDEL_calendarFromToText");
            calendarTo.insert({
                after: "<div style='clear:both;'></div>"
            });
        }else{
            this.datePickerFrom = new DatePicker('applicationDEL_datePickerFrom', {
                manualDateInsertion: true,
                emptyDateValid: true,
                defaultDate: Date.today().toString("yyyyMMdd"),
                events: $H({
                    correctDay: "EWS:applicationDEL_fromSelected",
                    dateSelected: "EWS:applicationDEL_fromSelected"
                })
            });
            this.datePickerTo = new DatePicker('applicationDEL_datePickerTo', {
                manualDateInsertion: true,
                defaultDate: Date.today().toString("yyyyMMdd"),
                events: $H({
                    correctDay: "EWS:applicationDEL_toSelected",
                    dateSelected: "EWS:applicationDEL_toSelected"
                })
            });
            this.datePickerFrom.linkCalendar(this.datePickerTo);
            this.selectedDateFrom = Date.today().toString("yyyy-MM-dd");
            this.selectedDateTo = Date.today().toString("yyyy-MM-dd");
            this.selectDatesContainer.insert("<div style='clear:both;'></div>");
        }
    },
    /**
     * Method called when a new date has been selected
     * @param event {Event} DOM Event object given by the date selection
     */
    dateSelected: function(event){
        if(event.eventName == "EWS:applicationDEL_fromSelected"){
            this.selectedDateFrom = this.datePickerFrom.getDateAsArray();
            var dateObjectFrom = Date.parseExact("#{year}-#{month}-#{day}".interpolate(this.selectedDateFrom), "yyyy-M-d");
            this.selectedDateFrom = objectToSap(dateObjectFrom);
        }else{
            this.selectedDateTo = this.datePickerTo.getDateAsArray();
            var dateObjectTo = Date.parseExact("#{year}-#{month}-#{day}".interpolate(this.selectedDateTo), "yyyy-M-d");
            this.selectedDateTo = objectToSap(dateObjectTo);
        }
    },
    /**
     * Sets the delegation status
     * @param delegation {JSON} The delegation data
     */
    setStatus: function(delegation){
        this.statusCheckbox = new Element("input", {
            name: "applicationDEL_status",
            id: "applicationDEL_status",
            type: "checkbox"
        });
        if(this.viewDetails){
            if(delegation["@active"] == "X"){
               this.statusCheckbox.checked = true;
               this.statusCheckbox.defaultChecked = true;
               this.statusCheckbox.writeAttribute("checked", true);
            }
            this.statusCheckbox.disable();
        }else{
            this.statusCheckbox.checked = true;
            this.statusCheckbox.defaultChecked = true;
            this.statusCheckbox.writeAttribute("checked", true);
        }
        
        var statusContainer = new Element("div", {
            "class": "applicationDEL_nofloat applicationDEL_alignLeft"
        }).insert(this.statusCheckbox).insert(new Element("label",{
            "for": "applicationDEL_status"
        }).update(new Element("span", {
            "class": "application_main_soft_text"
        }).update(global.getLabel("activateDelegationInmediately"))));
        this.statusContainer.insert(statusContainer);
    },
    /**
     * Sets the buttons, they're different when just showing data or when
     * creating a new delegation
     */
    setButtons: function(delegation){
        if(this.viewDetails){
            var json = {
                    elements:[]
            };
            var auxDelete =   {
                    label: global.getLabel("deleteDelegation"),
                    handlerContext: null,
                    className:'applicationDEL_Buttons',
                    handler: this.editDelegation.bind(this, delegation),
                    type: 'button',
                    standardButton:true
            };                 
            json.elements.push(auxDelete);   
            this.ButtonDelegation=new megaButtonDisplayer(json);
            this.buttonsContainer.insert(this.ButtonDelegation.getButtons());
        } else {
            var json = {
                    elements:[]
            };
            var auxAdd =   {
                    label: global.getLabel("addDelegation"),
                    handlerContext: null,
                    idButton:'addDelegationButton',
                    handler: this.editDelegation.bind(this),
                    className:'applicationDEL_Buttons',
                    type: 'button',
                    standardButton:true
            };                 
            json.elements.push(auxAdd);   
            this.ButtonAddDelegation=new megaButtonDisplayer(json);
            this.ButtonAddDelegation.disable('addDelegationButton');
            this.buttonsContainer.insert(this.ButtonAddDelegation.getButtons());
        }
        
        var json = {
            elements:[]
        };
        var auxExit =   {
            label: global.getLabel("exit"),
            className:'applicationDEL_Buttons',
            handlerContext: null,
            handler: global.open.bind(global, $H({
            	app: {
            		appId: "DE_LIST",
            		tabId: "INBOX_DE",
            		view: "DEL"
            	}
            })),
            type: 'button',
            standardButton:true   
        };                 
        json.elements.push(auxExit);   
        this.ButtonExitDelegation=new megaButtonDisplayer(json);
        this.buttonsContainer.insert(this.ButtonExitDelegation.getButtons());
    },
    /**
     * Updates the users and profiles data when the delegations info has
     * changed
     * @param event {Event} DOM Event object given by the delegations updating
     */
    delegationsReady: function(event){
        var args = getArgs(event);
        this.users = args.users;
        this.profiles = args.profiles;
    },
    /**
     * Adds the delegation or deletes
     * @param delegation {JSON} The delegation data
     * @param event {Event} DOM Event object given by the button click
     */
    editDelegation: function(delegation){
        var action = this.viewDetails ? "D" : "C";
        var del = delegation ? delegation : this.getDelegationData();
        var json_UPD_DELEGATION = {
            EWS: {
                SERVICE: "UPD_DELEGATION",
                PARAM: {
                    I_ACTION: action,
                    I_PARAMETER: {
                        YGLUI_STR_DELEGATION_ACTION: del
                    },
                    I_MAIL: $F(this.notifyByMailCheckbox) == "on" ? "X" : " "
                }
            }
        };

        var jsonConverter = new XML.ObjTree();
        if("@pernr" in del){
        	jsonConverter.attr_prefix = '@';
        }
        this.makeAJAXrequest($H({
            xml: jsonConverter.writeXML(json_UPD_DELEGATION),
            successMethod: "successEditDelegation"
        }));
    },
    /**
     * Goes back to the Delegations application
     */
    successEditDelegation: function(){
    	global.goToPreviousApp();
    },
    /**
     * Get the data from the currently displayed delegation
     * @returns {Array} an array wich contains the info for the delegation but
     *          with all it's different selected actions (it can be more than
     *          one)
     */
    getDelegationData: function(){
        var delegation = [];
        objectToArray(this.getProfile()).each(function(profile){
            delegation.push({
                "-PERNR": this.selectedUser["@pernr"],
                "-UNAME": this.selectedUser["@uname"],
                "-BEGDA": this.selectedDateFrom,
                "-ENDDA": this.selectedDateTo,
                "-REPPR": profile,
                "-ACTIVE": $F(this.statusCheckbox) == "on" ? "X" : "",
                "-SMAIL":$F(this.notifyByMailCheckbox) == "on" ? "X": ""

            });
        }.bind(this));
        return delegation;
    }
});
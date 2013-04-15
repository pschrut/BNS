/** 
* @fileOverview massTransNew.js 
* @description File containing class massTransNew. 
* Application for Mass Translation in OM.
*/

/**
*@constructor
*@description Class massTransNew_standard.
*@augments Application 
*/
var massTransNew = Class.create(Application,
/** 
*@lends OM_MassTrans_standard 
*/
    {

    /**
    *@type String
    *@description Service used to get objects.
    */
    getMassTransService: "MAINT_TRANS",
    /**
    *@type String
    *@description Service used to get the subtypes
    */
    getSubtypesService: "GET_MTRA_COLS",
    /**
    *@type Boolean
    *@description Property to know if the first table has been drawn.
    */
    firstTableShowed: false,
    /**
    *@type String
    *@description Date in which the translation is wanted.
    */
    date: "",
    /**
    *@type String
    *@description Mother object.
    */
    objectID: "",
    /**
    *@type Date
    *@description Set the format of the date.
    */
    dateFormat: null,
    /**
    *@type Boolean
    *@description Property to know if the second table has been drawn.
    */
    secondTableShowed: false,
    /*
    * @method initialize 
    * @param $super The superclass (Application) 
    * @desc Constructor of the class OM_MassTrans_standard
    */
    initialize: function($super, args) {
        $super(args);
        //hash to save the subtypes for the header of the table in the first screen
        this.subtypesHash = $H({});
        this.arrayofXmlIn = new Array();
        this.languageOfUser = global.language;
        this.firstTime = true;
    },
    /*
    * @method run  
    * @desc Starts OM_MassTrans_standard
    */
    run: function($super, args) {
        $super();
        this.OM_MassTransContainer = this.virtualHtml;
        //read args and values from global
        this.dateFormat = "yyyyMMdd";
        this.objectID = args.get('objectId');
        var parsedDate = objectToSap(new Date()).gsub('-', '');
        this.userLanguage = global.language;
        this.date = Date.parseExact(parsedDate, this.dateFormat).toString('yyyy-MM-dd');
        this.numberRows = global.paginationLimit;
        //hash to save the data from the first screen table
        this.arrayResults = new Array();
        //hide balloons
        if (balloon.isVisible())
            balloon.hide();
        if (this.firstRun) {
            //create the html structure of the application
            this.createHtml();
            //draw the TITLE
            this.drawTitle();
            //draw the LEGEND
            this.drawLegend();
            //call to GET_SUBTYPE
            this.callToGetSubtypes();
        } else {
            this.callToGetMassTrans();
        }
    },
    /*
    * @method createHtml  
    * @desc Builds the initial HTML code
    */
    createHtml: function() {
        //create the div for the TITLE
        this.massTransTitleDiv = new Element('div', {
            'id': 'OM_MassTrans_TitleDiv',
            'class': 'OM_MassTrans_TitleDiv'
        });
        //insert the html structure
        this.virtualHtml.insert(this.massTransTitleDiv);
        //create the div for the LEGEND
        this.massTransLegendDiv = new Element('div', {
            'id': 'OM_MassTrans_LegendDiv',
            'class': 'OM_MassTrans_LegendDiv'
        });
        //insert the html structure
        this.virtualHtml.insert(this.massTransLegendDiv);
        //create the div for the FIRST SCREEN
        this.massTransFirstScreenDiv = new Element('div', {
            'id': 'OM_MassTrans_FirstScreenDiv',
            'class': 'OM_MassTrans_FirstScreenDiv'
        });
        //insert the html structure
        this.virtualHtml.insert(this.massTransFirstScreenDiv);
        //create the div for the TABLE in the first screen
        this.massTransTableFirstScreenDiv = new Element('div', {
            'id': 'massTransTableFirstScreenDiv',
            'class': 'massTransTableFirstScreenDiv'
        });
        //insert the html structure in the first screen div
        this.massTransFirstScreenDiv.insert(this.massTransTableFirstScreenDiv);
        //create the div for the BUTTONS in the first screen
        this.massTransButtonsFirstScreenDiv = new Element('div', {
            'id': 'OM_MassTrans_ButtonsFirstScreenDiv',
            'class': 'OM_MassTrans_ButtonsFirstScreenDiv'
        });
        //insert the html structure in the first screen div
        this.massTransFirstScreenDiv.insert(this.massTransButtonsFirstScreenDiv);
        //create the div for the SECOND SCREEN
        this.massTransSecondScreenDiv = new Element('div', {
            'id': 'OM_MassTrans_SecondScreenDiv',
            'class': 'OM_MassTrans_SecondScreenDiv'
        });
        //insert the html structure
        this.virtualHtml.insert(this.massTransSecondScreenDiv);
        this.searchBox = new Element('div',
            {
                'class': 'OM_MassTrans_searchDiv'
            })/*.observe('click', this.callToGetMassTrans.bind(this,"drawSecondTable"))*/;
        this.searchBox.insert(
                "<span class='OM_MassTrans_spanSearch application_text_bolder'>" + global.getLabel('search') + "</span>"
                );
        this.searchInput = new Element('input',
            {
                name: "OM_MassTrans_search",
                type: "text"
            });
        this.searchBox.insert(this.searchInput);
        this.massTransSecondScreenDiv.insert(this.searchBox);
        //create the div for the TABLE in the second screen
        this.massTransTableSecondScreen = new Element('div', {
            'id': 'massTransTableSecondScreenDiv',
            'class': 'OM_MassTrans_SecondScreenTable'
        });
        //insert the html structure in the second screen div
        this.massTransSecondScreenDiv.insert(this.massTransTableSecondScreen);
        //create the div for the BUTTONS in the second screen
        this.massTransButtonsSecondScreenDiv = new Element('div', {
            'id': 'OM_MassTrans_ButtonsSecondScreenDiv',
            'class': 'OM_MassTrans_ButtonsSecondScreenDiv'
        });
        var json = {
            elements: []
        };
        var auxCancel = {
            label: global.getLabel('cancel'),
            idButton: 'OM_MassTrans_cancel',
            className: 'OM_MassTrans_buttonsSecond',
            handlerContext: null,
            handler: this.cancelButtonSecondScreen.bind(this),
            type: 'button',
            standardButton: true
        };
        json.elements.push(auxCancel);
        var auxSave = {
            label: global.getLabel('save'),
            idButton: 'OM_MassTrans_save',
            handlerContext: null,
            handler: this.saveButtonSecondScreen.bind(this),
            type: 'button',
            standardButton: true
        };
        json.elements.push(auxSave);
        this.ButtonMassTransFS = new megaButtonDisplayer(json);
        this.massTransButtonsSecondScreenDiv.insert(this.ButtonMassTransFS.getButtons());
        //insert the html structure in the second screen div
        this.massTransSecondScreenDiv.insert(this.massTransButtonsSecondScreenDiv);
        this.ButtonMassTransFS.disable('OM_MassTrans_save');
        //at the moment we only show the first screen
        this.massTransSecondScreenDiv.hide();
        //define the height of the div that contains the table, depending of the number of entries
        var heightRow = 22;
        var margin = 25;
        var numberEntries = (parseInt(this.numberRows)) + 2;
        var heightTable = (heightRow * numberEntries) + margin;
        Element.setStyle($('massTransTableFirstScreenDiv'), {
            'height': heightTable + 'px'
        });

    },
    /*
    * @method callToGetSubtypes  
    * @desc Method to call to sap to get the subtypes
    */
    callToGetSubtypes: function() {
        //call to sap
        this.xmlToGetSubtypes = "<EWS>" +
                                    "<SERVICE>" + this.getSubtypesService + "</SERVICE>" +
                                    "<OBJECT TYPE=''></OBJECT>" +
                                    "<PARAM>" +
                                        "<APPID>OM_MTR</APPID>" +
                                        "<WID_SCREEN>1</WID_SCREEN>" +
                                        "<STR_KEY></STR_KEY>" +
                                        "<FIELD FIELDID='LGART' FIELDTECHNAME='LGART' VALUE=''/>" +
                                        "<DEP_FIELDS/>" +
                                        "<SEARCH_PATTERN/>" +
                                    "</PARAM>" +
                                "</EWS>";
        this.makeAJAXrequest($H({ xml: this.xmlToGetSubtypes, successMethod: 'getSubtypes' }));
    },
    /*
    * @method getSubtypes  
    * @param {JSON} json Object from the backend that contains the information of the subtypes.
    * @desc Method to get the subtypes obtained from sap.
    */
    getSubtypes: function(json) {
        //get the information
        this.subtypesNodes = json.EWS.o_values.item;
        this.numberOfSubtypesNodes = this.subtypesNodes.length;
        //create a hash to store the information of the subtypes (id,name) for the header of the table
        var subtypeName, subtypeId;
        for (var i = 0; i < this.numberOfSubtypesNodes; i++) {
            subtypeName = this.subtypesNodes[i]["@value"];
            subtypeId = this.subtypesNodes[i]["@id"];
            this.subtypesHash.set(subtypeId, subtypeName);
        }
        //initialize variables
        var headerTable = "";
        var subtypeName = "";
        var subtypeId = "";
        var checkedElem = "";
        var col = 1;
        var div, table, thead, tr, th, tbody;
        this.arrayCheckboxes = [];
        //create the html structure of an empty TABLE
        table = new Element('table', {
            id: 'OM_MassTrans_resultsFirstTable',
            className: 'sortable OM_MassTrans_widthTable'
        });
        thead = new Element('thead', {
            className: 'application_header_barTable'
        });
        tr = new Element('tr');
        //FIRST COLUMN IN HEADER
        //create html elements
        th = new Element('th', {
            id: 'OM_MassTrans_LabelTitle',
            className: 'table_sortfirstdesc OM_massTransWidthTitle'
        });
        check = new Element('input', {
            id: 'OM_MassTrans_checkAllButton_Title',
            type: 'checkbox',
            row: '0',
            col: '0',
            className: 'OM_MassTrans_checkButton'
        });
        divTitle = new Element('div', {
            id: 'OM_MassTrans_titleHeader'
        });
        divTitle.insert("<acronym title=" + global.getLabel('title') + ">" + this.subtypesHash.get('STEXT') + "</acronym>");
        //stop the event to sort the table when the user clicks on the checkbox for the mass selection
        check.observe('mousedown', function(event) {
            event.stop();
        } .bindAsEventListener(check));
        //insert the elements
        th.insert(check);
        th.insert(divTitle);
        tr.insert(th);
        thead.insert(tr);
        table.insert(thead);
        //add the checkbox in the array
        this.arrayCheckboxes[0] = [];
        this.arrayCheckboxes[0][0] = check;
        //get the subtypes to create the header
        this.subtypesHash.each(function(pair) {
            subtypeId = pair[0];
            subtypeName = pair[1];
            //create the html structure for each SUBTYPE COLUMN IN HEADER
            th = new Element('th', {
                className: 'OM_MassTrans_widthLabels table_nosort'
            });
            check = new Element('input', {
                id: 'OM_MassTrans_checkAllButtonSubtype_' + subtypeId,
                type: 'checkbox',
                row: '0',
                col: col,
                className: 'OM_MassTrans_checkButton'
            });
            divTitle = new Element('div', {
                id: 'OM_MassTrans_checkAllButton_Subtype'
            }).insert("<acronym title=" + subtypeName.gsub(' ', '&nbsp;') + ">" + subtypeName.gsub(' ', '&nbsp;') + "</acronym>");
            //insert the elements
            var span = new Element('span', {
                'style': 'white-space: nowrap;'
            });
            span.insert(check);
            span.insert(divTitle);
            th.insert(span);
            tr.insert(th);
            thead.insert(tr);
            table.insert(thead);
            //add the checkbox in the array
            this.arrayCheckboxes[0][col] = check;
            //inc the number of column
            col = col + 1;
        } .bind(this));
        //save the number of columns in the table
        this.numberOfColumns = col;
        //create the structure of the body of the table
        tbody = new Element('tbody', {
            id: 'OM_MassTrans_tbody_massTrans'
        });
        //insert the body in the table
        table.insert(tbody);
        //insert the html structure in the div of the first screen
        this.massTransTableFirstScreenDiv.insert(table);
        //create an event in the table
        this.massTransTableFirstScreenDiv.down("[id=OM_MassTrans_resultsFirstTable]").observe("click", this.controlCheckboxClicked.bindAsEventListener(this));
        //call the service to get the information of the information of the table
        this.callToGetMassTrans();
    },
    /*
    * @method callToGetMassTrans  
    * @param {String} successMethod Parameter to define the method in the successMethod.
    * @desc Method to call to sap with the MAINT_TRANS service.
    */
    callToGetMassTrans: function(successMethod) {
        var succMethod = Object.isEmpty(successMethod) ? "drawFirstTable" : successMethod;
        var action = (succMethod == "drawFirstTable") || (successMethod == "drawSecondTable") ? "V" : "M";
        //objectID given from the previous app
        var parsedDate = this.date.toString(this.dateFormat);
        //initialize values of the table
        var langu = "";
        var infty = "";
        var fld_sbty = "";
        var otype = "";
        var objid = "";
        var plvar = "";
        var istat = "";
        var begda = "";
        var endda = "";
        var descr = "";
        var manager = "";
        var staff = "";
        var fake = "";
        //if the action is modify, we have to make an xml in different from the one for view
        if (action == 'M') {
            var xmlGetMassTrans = "<EWS>"
                + "<SERVICE>" + this.getMassTransService + "</SERVICE>"
                + "<PARAM>"
                + "<O_DATE>" + parsedDate + "</O_DATE>"
                + "<o_action>" + action + "</o_action>"
                + "<o_translations>";
            var _this = this;
            //loop over the main hash to get the new translations
            this.hashOfElementsInXml.each(function(pair) {
                pair.value.each(function(pair2) {
                    pair2.value.each(function(pair3) {
                        var dataInsidesubtypes = _this.hashOfElementsInXml.get(pair.key).get(pair2.key).get(pair3.key);
                        //if the desc has changed, I get tthe new translation to pass it to the xml to modify
                        if (dataInsidesubtypes['@changed']) {
                            descr = dataInsidesubtypes['@descrChanged'];
                            //we take into account the special characters
                            if (descr.include('&'))
                                descr = descr.gsub('&', '&amp;');
                            if (descr.include('<'))
                                descr = descr.gsub('<', '&lt;');
                            if (descr.include('>'))
                                descr = descr.gsub('<', '&gt;');
                            if (descr.include('"'))
                                descr = descr.gsub('"', '&quot;');
                            if (descr.include("'"))
                                descr = descr.gsub("'", '&apos;');
                            manager = Object.isEmpty(dataInsidesubtypes['@manager']) ? "" : dataInsidesubtypes['@manager'];
                            staff = Object.isEmpty(dataInsidesubtypes['@staff']) ? "" : dataInsidesubtypes['@staff'];
                            fake = Object.isEmpty(dataInsidesubtypes['@fake']) ? "" : dataInsidesubtypes['@fake'];
                            xmlGetMassTrans += "<yglui_tab_trans langu=\"" + dataInsidesubtypes['@langu'] + "\" infty=\"" + dataInsidesubtypes['@infty'] + "\" fld_sbty=\"" + dataInsidesubtypes['@fld_sbty'] + "\" otype=\"" + dataInsidesubtypes['@otype'] + "\" objid=\"" + dataInsidesubtypes['@objid'] + "\" plvar=\"" + dataInsidesubtypes['@plvar'] + "\" istat=\"" + dataInsidesubtypes['@istat'] + "\" begda=\"" + dataInsidesubtypes['@begda'] + "\" endda=\"" + dataInsidesubtypes['@endda'] + "\" manager=\"" + manager + "\" staff=\"" + staff + "\" descr=\"" + descr + "\" fake=\"" + fake + "\"/>"
                        }
                    });
                });
            });
        }
        //if the action is View
        else {
            var xmlGetMassTrans = "<EWS>"
                + "<SERVICE>" + this.getMassTransService + "</SERVICE>"
                + "<OBJECT TYPE='O'>" + this.objectID + "</OBJECT> "
                + "<DEL></DEL>"
                + "<PARAM>"
                + "<O_DATE>" + parsedDate + "</O_DATE>"
                + "<o_action>" + action + "</o_action>"
                + "<o_translations>";
            xmlGetMassTrans += "<yglui_tab_trans langu=\"" + langu + "\" infty=\"" + infty + "\" fld_sbty=\"" + fld_sbty + "\" otype=\"" + otype + "\" objid=\"" + objid + "\" plvar=\"" + plvar + "\" istat=\"" + istat + "\" begda=\"" + begda + "\" endda=\"" + endda + "\" manager=\"" + manager + "\" staff=\"" + staff + "\" descr=\"" + descr + "\" fake=\"" + fake + "\"/>"

        }
        xmlGetMassTrans += "</o_translations>"
            + "</PARAM>"
            + "</EWS>";


        //call the service
        if (successMethod == 'drawSecondTable')
            this.drawSecondEmptyTable();
        this.makeAJAXrequest($H({
            xml: xmlGetMassTrans,
            successMethod: succMethod
        }));

    },
    /*
    * @method drawFirstTable  
    * @param {JSON} jsonObject Object from the backend that contain the information of each object.
    * @desc Method to draw the first table.
    */
    drawFirstTable: function(jsonObject) {
        //draw the TABLE
        this.drawTable(jsonObject);
        //draw the BUTTONS
        this.drawFirstScreenButtons();
    },
    /*
    * @method drawTitle  
    * @desc Method to draw the title of the application.
    */
    drawTitle: function() {
        //insert the title in the div
        this.massTransTitleDiv.update("<span class='application_main_title'>" + global.getLabel('massDataTrans') + "</span>");
    },
    /*
    * @method drawLegend  
    * @desc Method to draw the legend of the tables of the application.
    */
    drawLegend: function() {
        var legendJSON = {
            legend: [
                {
                    img: "applicationOM_manager",
                    text: global.getLabel('manager')
                },
                {
                    img: "applicationOM_staff",
                    text: global.getLabel('staff')
                },
                {
                    img: "applicationOM_person",
                    text: global.getLabel('PLANS')
                },
                {
                    img: "applicationOM_folder",
                    text: global.getLabel('ORGEH')
                }
            ],
            showLabel: global.getLabel('showLgnd'),
            hideLabel: global.getLabel('closeLgnd')
        };
        var legendHTML = getLegend(legendJSON);
        this.virtualHtml.down('[id=OM_MassTrans_LegendDiv]').update(legendHTML);
    },
    /*
    * @method drawTable
    * @param {JSON} jsonObject Object from the backend that contain the information of each object.  
    * @desc Method to draw the first table (first screen).
    */
    drawTable: function(jsonObject) {
        //if second table was loaded, it will be hidden before to draw the first table
        if (this.secondTableShowed) {
            this.massTransSecondScreenDiv.hide();
            this.massTransFirstScreenDiv.show();
            this.firstTableShowed = false;
        }
        //remove the contain of the table
        this.virtualHtml.down('tbody#OM_MassTrans_tbody_massTrans').update("");
        //remove the foot of the table shown
        if (this.virtualHtml.down('tfoot#tFoot_OM_MassTrans_resultsFirstTable'))
            $('tFoot_OM_MassTrans_resultsFirstTable').remove();
        //fill the table
        this.html = "";
        this.fillFirstTable(jsonObject);
        //make the table sortable
        if (this.virtualHtml.down("[id='OM_MassTrans_secondTable']"))
            TableKit.unloadTable("OM_MassTrans_secondTable");
        if (!this.firstTableShowed) {
            //update variables about the table shown
            this.firstTableShowed = true;
            this.secondTableShowed = false;
            //make the sortable table with pagination
            TableKit.Sortable.init(this.virtualHtml.down('table#OM_MassTrans_resultsFirstTable'), { pages: this.numberRows });
        } else {
            TableKit.reloadTable("OM_MassTrans_resultsFirstTable");
        }
    },
    /*
    * @method fillFirstTable
    * @param {JSON} jsonObject Object from the backend that contain the information of each object. 
    * @desc Method to fill the first table (first screen).
    */
    fillFirstTable: function(jsonObject) {
        //initialize variables
        var title, abrev, idObj, typeObj, manObj, staffObj;
        var tr, td, ckeck, divTitle, text;
        var idSubtype = "";
        var row = 1;
        var column;
        var classIcon = "";
        this.html = "";
        this.titleHash = new Hash();
        //get the number of nodes
        this.numberOfNodes = jsonObject.EWS.o_translations.yglui_tab_trans.length;
        //save all the short descriptions in a hash
        for (var i = 0; i < this.numberOfNodes; i++) {
            if (jsonObject.EWS.o_translations.yglui_tab_trans[i]["@infty"] == '1000' && jsonObject.EWS.o_translations.yglui_tab_trans[i]["@fld_sbty"] == 'STEXT' && jsonObject.EWS.o_translations.yglui_tab_trans[i]["@langu"] == this.userLanguage) {
                title = jsonObject.EWS.o_translations.yglui_tab_trans[i]["@descr"];
                if (Object.isEmpty(title)) {
                    title = ""
                };
                idObj = jsonObject.EWS.o_translations.yglui_tab_trans[i]["@objid"];
                this.titleHash.set(idObj, title);
            }
        }
        for (var i = 0; i < this.numberOfNodes; i++) {
            if (jsonObject.EWS.o_translations.yglui_tab_trans[i]["@infty"] == '1000' && jsonObject.EWS.o_translations.yglui_tab_trans[i]["@fld_sbty"] == 'SHORT' && jsonObject.EWS.o_translations.yglui_tab_trans[i]["@langu"] == this.userLanguage) {
                abrev = jsonObject.EWS.o_translations.yglui_tab_trans[i]["@descr"];
                idObj = jsonObject.EWS.o_translations.yglui_tab_trans[i]["@objid"];
                typeObj = jsonObject.EWS.o_translations.yglui_tab_trans[i]["@otype"];
                manObj = jsonObject.EWS.o_translations.yglui_tab_trans[i]["@manager"];
                staffObj = jsonObject.EWS.o_translations.yglui_tab_trans[i]["@staff"];
                //check the object to add the icon
                if (typeObj == 'O') {
                    classIcon = 'applicationOM_folder';
                } else if (typeObj == 'S') {
                    if (manObj == 'X') {
                        classIcon = 'applicationOM_manager';
                    } else if (staffObj == 'X') {
                        classIcon = 'applicationOM_staff';
                    } else {
                        classIcon = 'applicationOM_person';
                    }
                }
                //if the title is empty, we will use the short description
                if (Object.isEmpty(this.titleHash.get(idObj))) {
                    title = abrev
                } else {
                    title = this.titleHash.get(idObj)
                };
                //create html structure for each row
                tr = new Element('tr');
                //first column
                td = new Element('td');
                div = new Element('div', {
                    id: 'OM_MassTrans_title'
                });
                check = new Element('input', {
                    id: 'OM_MassTrans_checkAllButton_Title_' + idObj,
                    type: 'checkbox',
                    row: row,
                    col: '0',
                    className: 'OM_MassTrans_checkButton'
                });
                divIcon = new Element('div', {
                    id: 'OM_MassTrans_icon',
                    className: classIcon + ' OM_MassTrans_icon'
                });
                divTitle = new Element('div', {
            }).insert("<acronym title=" + title.gsub(' ', '&nbsp;') + ">" + title.gsub(' ', '&nbsp;') + "</acronym>");
            div.insert(check);
            div.insert(divIcon);
            div.insert(divTitle);
            td.insert(div);
            tr.insert(td);
            //add the checkbox in the array
            this.arrayCheckboxes[row] = [];
            this.arrayCheckboxes[row][0] = check;
            //initialize the first column of subtypes
            column = 1;
            this.subtypesHash.each(function(pair) {
                idSubtype = pair[0];
                //create the column html structure
                td = new Element('td');
                div = new Element('div', {
                    id: 'OM_MassTrans_check',
                    className: 'OM_MassTrans_widthLabels'
                });
                check = new Element('input', {
                    id: 'OM_MassTrans_checkButton_' + idObj + '_' + idSubtype,
                    type: 'checkbox',
                    row: row,
                    col: column,
                    className: 'OM_MassTrans_checkButton'
                });
                div.insert(check);
                td.insert(div);
                tr.insert(td);
                //add the checkbox in the array
                this.arrayCheckboxes[row][column] = check;
                column = column + 1;
            } .bind(this));
            //insert the row in the body of the table
            this.virtualHtml.down('tbody#OM_MassTrans_tbody_massTrans').insert(tr);
            row = row + 1;
        }
    }
    //save the number of rows of the table
    this.numberOfRows = row;
},
/*
* @method controlCheckboxClicked
* @param {Object} event Information to know if the user has clicked on the table in the first screen
* @desc Method to select or unselect checkbox. It depends of the checkboxes clicked.
*/
controlCheckboxClicked: function(event) {
    //get the elem clicked
    var element = event.element();
    //if the table is clicked on a checkbox
    if (element.match('input.OM_MassTrans_checkButton')) {
        //get its position (column and row)
        var col = element.getAttribute('col');
        var row = element.getAttribute('row');
        //if the checkbox selected is one of the header of the table
        if (row == 0) {
            //if the checkbox is not the first checkbox to select all the table
            if (col != 0) {
                //select or unselect, save or remove from the array (the elements of the column)
                this.controlColumnMassSelection(row, col);
            } else {
                //select all the table
                this.massSelection();
            }
        } else {
            //if the checkbox clicked is in the first column
            if (col == 0) {
                //select or unselect, save or remove from the array (the elements of the row)
                this.controlRowMassSelection(row);
            } else {
                //save or remove the element from the array
                this.controlSelection(row, col);
            }
        }
    }
},
/*
* @method controlSelection
* @param {String} row Row clicked
* @param {String} col Column clicked
* @desc Method called when a checbox of an element to translate is selected.
*/
controlSelection: function(row, col) {
    //get the elem ("idObject_idSubtype")
    var elem = this.arrayCheckboxes[row][col].identify().sub("OM_MassTrans_checkButton_", "");
    //if the checkbox is selected
    if (this.arrayCheckboxes[row][col].checked) {
        //add the elem in the array
        this.arrayResults[this.arrayResults.length] = elem;
        //if the checkbox selected isn't SHORT
        if (col != '2') {
            //the SHORT checkbox of this element is checked and added in the array
            this.arrayCheckboxes[row][2].checked = true;
            this.arrayResults = this.arrayResults.without(elem.split('_')[0] + '_SHORT');
            this.arrayResults[this.arrayResults.length] = elem.split('_')[0] + '_SHORT';
        }
        //if the checkbox is unselected    
    } else {
        //remove the elem in the array
        this.arrayResults = this.arrayResults.without(elem);
        //unselect the checkbox of the header of that elem
        this.arrayCheckboxes[0][col].checked = false;
        //unselect the checkbox in the object title (first column) of that elem
        this.arrayCheckboxes[row][0].checked = false;
        if (col != '2') {
            //if there isn't any subtype selected in this row
            var anySubtypeSelected = false;
            for (var i = 1; i < this.numberOfColumns; i++) {
                if ((this.arrayCheckboxes[row][i].checked) && (i != '2')) {
                    anySubtypeSelected = true;
                }
            }
            if (!anySubtypeSelected) {
                //the SHORT checkbox of this element is unchecked and removes in the array
                this.arrayCheckboxes[row][2].checked = false;
                this.arrayResults = this.arrayResults.without(elem.split('_')[0] + '_SHORT');
                //unselect the checkbox of the header of SHORT
                this.arrayCheckboxes[0][2].checked = false;
            }
        }
    }
    //check if there is any checkbox selected to enable or disable the button
    this.controlButton();
},
/*
* @method controlColumnMassSelection
*@param {String} row Row clicked
*@param {String} col Column clicked
* @desc Method to select or unselect a column.
*/
controlColumnMassSelection: function(row, col) {
    //if the checkbox of the header is selected
    if (this.virtualHtml.down('[row=' + row + '][col=' + col + ']').checked) {
        //select all the column and add the elem's in the array
        this.selectAllColumn(col);
        //if the checkbox of the header is unselected  
    } else {
        //unselect all the column and remove the elem's in the array
        this.unselectAllColumn(col);
    }
    //check if there is any checkbox selected to enable or disable the button
    this.controlButton();
},
/*
* @method selectAllColumn
* @param {String} col Column clicked
* @desc Method to select a column and save the elements in the array.
*/
selectAllColumn: function(col) {
    for (var i = 1; i < this.numberOfRows; i++) {
        //select every checkbox
        this.arrayCheckboxes[i][col].checked = true;
        //add the elem in the array
        elem = this.arrayCheckboxes[i][col].identify().sub("OM_MassTrans_checkButton_", "");
        this.arrayResults = this.arrayResults.without(elem);
        this.arrayResults[this.arrayResults.length] = elem;
        //if the checkbox selected isn't SHORT
        if (col != '2') {
            //the SHORT checkbox of this element is checked and added in the array/////
            this.arrayCheckboxes[i][2].checked = true;
            this.arrayResults = this.arrayResults.without(elem.split('_')[0] + '_SHORT');
            this.arrayResults[this.arrayResults.length] = elem.split('_')[0] + '_SHORT';
        }
    }
    //the SHORT header is checked too
    if (col != '2') {
        this.arrayCheckboxes[0][2].checked = true;
    }
},
/*
* @method unselectAllColumn
* @param {String} col Column clicked
* @desc Method to unselect a column and remove the elements in the array.
*/
unselectAllColumn: function(col) {
    for (var i = 0; i < this.numberOfRows; i++) {
        //unselect every checkbox in this column
        this.arrayCheckboxes[i][col].checked = false;
        //remove the elem in the array
        elem = this.arrayCheckboxes[i][col].identify().sub("OM_MassTrans_checkButton_", "");
        this.arrayResults = this.arrayResults.without(elem);
        //unselect every checkbox in the first column
        this.arrayCheckboxes[i][0].checked = false;
        //unselect the checkbox in the first column and first row(mass selection checkbox)
        this.arrayCheckboxes[0][0].checked = false;
        if (col != '2') {
            //if there isn't any subtype selected in this row
            var anySubtypeSelected = false;
            for (var j = 1; j < this.numberOfColumns; j++) {
                if ((this.arrayCheckboxes[i][j].checked) && (j != '2')) {
                    anySubtypeSelected = true;
                }
            }
            if (!anySubtypeSelected) {
                //the SHORT checkbox of this element is unchecked and removes in the array
                this.arrayCheckboxes[i][2].checked = false;
                this.arrayResults = this.arrayResults.without(elem.split('_')[0] + '_SHORT');
            }
        }
    }
},
/*
* @method controlRowMassSelection
* @param {String} row Row clicked
* @desc Method to select or unselect a row.
*/
controlRowMassSelection: function(row) {
    //if the checkbox of the first column is selected
    if (this.virtualHtml.down('[row=' + row + '][col=0]').checked) {
        //select all the row and add the elem's in the array
        this.selectAllRow(row);
        //if the checkbox of the first column is unselected  
    } else {
        //unselect all the row and remove the elem's in the array
        this.unselectAllRow(row);
    }
    //check if there is any checkbox selected to enable or disable the button
    this.controlButton();
},
/*
* @method selectAllRow
* @param {String} row Row clicked
* @desc Method to select a row and save the elements in the array.
*/
selectAllRow: function(row) {
    for (var i = 1; i < this.numberOfColumns; i++) {
        //select every checkbox
        this.arrayCheckboxes[row][i].checked = true;
        //add the elem in the array
        elem = this.arrayCheckboxes[row][i].identify().sub("OM_MassTrans_checkButton_", "");
        this.arrayResults = this.arrayResults.without(elem);
        this.arrayResults[this.arrayResults.length] = elem;
    }
},
/*
* @method unselectAllRow
* @param {String} row Row clicked
* @desc Method to unselect a row and remove the elements in the array.
*/
unselectAllRow: function(row) {
    for (var i = 1; i < this.numberOfColumns; i++) {
        //unselect every checkbox in that row
        this.arrayCheckboxes[row][i].checked = false;
        //remove the elem in the array
        elem = this.arrayCheckboxes[row][i].identify().sub("OM_MassTrans_checkButton_", "");
        this.arrayResults = this.arrayResults.without(elem);
        //unselect every checkbox in the first row
        this.arrayCheckboxes[0][i].checked = false;
        //unselect the checkbox in the first column and first row(mass selection checkbox)
        this.arrayCheckboxes[0][0].checked = false;
    }
},
/*
* @method massSelection
* @desc Method to select all the ckeckboxes in the table.
*/
massSelection: function() {
    //initialize the array
    this.arrayResults = [];
    //if the checkbox is selected
    if (this.arrayCheckboxes[0][0].checked) {
        //select all the table
        for (var col = 0; col < this.numberOfColumns; col++) {
            for (var row = 0; row < this.numberOfRows; row++) {
                //select every checkbox
                this.arrayCheckboxes[row][col].checked = true;
                //add the elem in the array, except the first elem(row=0 and col=0)
                if (row != 0 && col != 0) {
                    elem = this.arrayCheckboxes[row][col].identify().sub("OM_MassTrans_checkButton_", "");
                    this.arrayResults[this.arrayResults.length] = elem;
                }
            }
        }
        //if the checkbox is unselected  
    } else {
        //unselect all the table
        for (var col = 0; col < this.numberOfColumns; col++) {
            for (var row = 0; row < this.numberOfRows; row++) {
                //select every checkbox
                this.arrayCheckboxes[row][col].checked = false;
            }
        }
    }
    //check if there is any checkbox selected to enable or disable the button
    this.controlButton();
},
/*
* @method controlButton
* @desc Method to enable or disable the Select button.
*/
controlButton: function() {
    //if there isn't any checkbox selected, the array is empty and the Select button is disabled
    if (this.arrayResults.length == 0) {
        this.ButtonMassTransSS.disable('OM_MassTrans_selectButton');
        //if there is any checkbox selected, the Select button is enable   
    } else {
        this.ButtonMassTransSS.enable('OM_MassTrans_selectButton');
    }
},
/*
* @method drawFirstScreenButtons
* @desc Method draw the buttons for the first screen.
*/
drawFirstScreenButtons: function() {
    //create div for buttons
    var buttonsFirstScreenDiv = "<div id='OM_MassTrans_Buttons' class='OM_MassTrans_ButtonsPart'></div>";
    var json = {
        elements: []
    };
    var auxCancel = {
        label: global.getLabel('cancel'),
        idButton: 'OM_MassTrans_cancelButton',
        handlerContext: null,
        handler: this.cancelButtonFirstScreen.bind(this),
        type: 'button',
        standardButton: true
    };
    json.elements.push(auxCancel);
    var auxSelect = {
        label: global.getLabel('select'),
        idButton: 'OM_MassTrans_selectButton',
        className: 'OM_MassTrans_selectButton',
        handlerContext: null,
        handler: this.callToGetMassTrans.bind(this, "drawSecondTable"),
        type: 'button',
        standardButton: true
    };
    json.elements.push(auxSelect);
    this.ButtonMassTransSS = new megaButtonDisplayer(json);
    this.virtualHtml.down('div#OM_MassTrans_ButtonsFirstScreenDiv').update(buttonsFirstScreenDiv);
    this.virtualHtml.down('div#OM_MassTrans_Buttons').insert(this.ButtonMassTransSS.getButtons());
    //disable the Select button the first time
    this.ButtonMassTransSS.disable('OM_MassTrans_selectButton');
},
/*
* @method cancelButtonFirstScreen
* @desc Method to redirect the flow to OM_Maintain.
*/
cancelButtonFirstScreen: function() {
    //initialize the array
    this.arrayResults = new Array();
    //unselect all the table
    for (var col = 0; col < this.numberOfColumns; col++) {
        for (var row = 0; row < this.numberOfRows; row++) {
            //select every checkbox
            this.arrayCheckboxes[row][col].checked = false;
        }
    }
    //open the OM_Maintain app
    document.fire('EWS:openApplication', $H({
        app: 'maintainNew',
        refresh: true
    }));
},
/*
* @method drawSecondEmptyTable
* @desc Method to make the empty table for the second screen 
*/
drawSecondEmptyTable: function() {
    //variable for labels in header bar of the table
    var titleLabel = global.getLabel('title');
    var subtypeLabel = global.getLabel('subtype');
    var languageLabel = global.getLabel('languageLabel');
    var translationLabel = global.getLabel('translation');
    //create header
    var html = "<table id='OM_MassTrans_secondTable' class='sortable resizable'>"
            + "<thead>"
            + "<tr><th class='table_sortfirstdesc OM_massTransWidthTitle'><acronym title=" + titleLabel + ">" + titleLabel + "</acronym>"
            + "<th class='application_history_table_colPrice OM_massTransWidthLanSubtype'><acronym title=" + languageLabel + ">" + languageLabel + "</acronym></th>"
            + "</th><th class ='application_history_table_colTraining_withPrice OM_massTransWidthLanSubtype'><acronym title=" + subtypeLabel + ">" + subtypeLabel + "</acronym></th>"
            + "<th class='application_history_results_table_colDate_withPrice'><acronym title=" + translationLabel + ">" + translationLabel + "</acronym></input></th></tr>"
            + "</thead>"
            + "<tbody id='tableKit_body'>"
            + "<tr>"
            + "<td></td>"
            + "<td class='application_text_bolder OM_massTransAlignLoading'>" + global.getLabel('languagesLoading') + "</td>"
            + "<td></td>"
            + "<td></td>"
            + "</tr>"
            + "</tbody></table>";
    this.virtualHtml.down('[id=massTransTableSecondScreenDiv]').update(html);
    //at fisrt time we hide the search box until the module was done
    this.searchBox.hide();
    //when we show the second table, we hide the first screen and show the second
    this.massTransFirstScreenDiv.hide();
    this.massTransSecondScreenDiv.show();
    //we reload the table
    if (!this.secondTableShowed) {
        TableKit.unloadTable("OM_MassTrans_resultsFirstTable");
        TableKit.Sortable.init(this.virtualHtml.down("[id='OM_MassTrans_secondTable']"), {
            pages: this.numberRows
        });
        TableKit.options.autoLoad = false;
        //update variables about table shown
        this.secondTableShowed = true;
        this.firstTableShowed = false;
    }
    else
        TableKit.reloadTable("OM_MassTrans_secondTable");
},
/*
* @method recursiveMerge
* @param mhash1 {Hash}: object that has the main hash
* @param mhash1 {Hash}: object that has the hash that we want to merge with the main hash
* @desc Method to merge several hash mixed in one
*/
recursiveMerge: function(mhash1, mhash2) {
    var itHasHashInside = false;
    var hashes = $H({});
    var ret = mhash1.clone();
    mhash1.each(function(field) {
        if (Object.isHash(field.value) && mhash2.get(field.key)) {
            hashes.set(field.key, this.recursiveMerge(mhash1.get(field.key), mhash2.get(field.key)));
            itHasHashInside = true;
        }
    } .bind(this));
    if (itHasHashInside) {
        hashes.each(function(field) {
            ret.set(field.key, field.value);
        });
        return ret;
    }
    else {
        return mhash1.merge(mhash2);
    }
},
/*
* @method drawSecondTable
* @param jsonObject {json}: object returned from the AJAX call 
* @desc Method to build main hash
*/
drawSecondTable: function(jsonObject) {
    this.hashOfElementsInXml = new Hash();
    this.arrayTrans = jsonObject.EWS.o_translations.yglui_tab_trans;
    var idObjectAux = "";
    var equal = true;
    var firstTime = true;
    //we read xml out, to build the structure
    for (var i = 0; i < this.arrayTrans.length; i++) {
        var hashOfSubtypes = $H({});
        var hashOfLanguages = $H({});
        var Mainhash = $H({});
        var idObject = this.arrayTrans[i]['@objid'];
        var subtype = this.arrayTrans[i]['@fld_sbty'];
        var langu = this.arrayTrans[i]['@langu'];
        hashOfLanguages.set(langu, this.arrayTrans[i]);
        hashOfSubtypes.set(subtype, hashOfLanguages);
        Mainhash.set(idObject, hashOfSubtypes);
        //we call this method to maerge the three hashes in one
        this.hashOfElementsInXml = this.recursiveMerge(this.hashOfElementsInXml, Mainhash);
    }
    this.drawSecondTable2();
},
/*
* @method drawSecondTable
* @desc draw the table with the results selected in the first screen
*/
drawSecondTable2: function() {
    var html = "", objId, sbty, objectInfo, titleByStext, titleByShort, title, getAllData, languToShow, language, subtype, classObj, OType;
    //we make a loop over the array that we get with the elements clicked in the frist screen
    for (var j = 0; j < this.arrayResults.size(); j++) {
        //we save the values for the object id and the subtype selected in the first screen
        objId = this.arrayResults[j].split('_')[0];
        sbty = this.arrayResults[j].split('_')[1];
        objectInfo = this.hashOfElementsInXml.get(objId);
        //we find the title in the language of the user
        titleByStext = objectInfo.get('STEXT').get(this.languageOfUser)['@descr'];
        titleByShort = objectInfo.get('SHORT').get(this.languageOfUser)['@descr'];
        title = Object.isEmpty(titleByStext) ? titleByShort : titleByStext;
        var objectAllLangu = objectInfo.get(sbty);
        var _this = this;
        objectAllLangu.each(function(pair) {
            getAllData = pair.value;
            languToShow = getAllData['@langu'];
            translation = Object.isEmpty(getAllData['@descr']) ? "" : getAllData['@descr'];
            //we test the language
            language = getAllData['@langu_text'];
            //                //We show Title or Abbr depending on the subtype
            //                if (isNaN(sbty)) {
            //                    if (sbty == 'STEXT')
            //                        subtype = 'Title';
            //                    else if (sbty == 'SHORT')
            //                        subtype = 'Abbr';
            //                    else
            //                        subtype = getAllData['@fld_sbty'];
            //                }
            //                //if is different from the before ones, we take from the hash of subtypes
            //                else
            //                    subtype = getAllData['@fld_sbty'];
            subtype = this.subtypesHash.get(getAllData['@fld_sbty']);
            if (getAllData['@fake'] == 'X')
                translation = "";
            idFakedOrNot = 'OM_MassTrans_input_' + objId + '_' + sbty + '_' + languToShow;
            OType = getAllData['@otype'];
            //depending of the type of the object we show an image or other
            if (OType == 'S') {
                if (getAllData['@manager'] == 'X')
                    classObj = 'applicationOM_manager';
                else if (getAllData['@staff'] == 'X')
                    classObj = 'applicationOM_staff';
                else
                    classObj = 'applicationOM_person';
            }
            else if (OType == 'O')
                classObj = 'applicationOM_folder';
            //we insert the elements in the table
            html += "<tr class='' id='OM_MassTrans_secondTable_row_" + j + "'>"
                    + "<td><div class='" + classObj + "'></div><div style='margin-left:20px; width:auto'>" + title + "</div></td>"
                    + "<td><div>" + language + "</div></td>"
                    + "<td><div>" + subtype + "</div></td>"
                    + "<td><div class=''><input id=" + idFakedOrNot + " class='OM_MassTrans_textInput' type='text' value='" + translation + "'></input></div></td></tr>";


        } .bind(this));
    }
    //we insert the table in the DOM
    this.virtualHtml.down('[id=massTransTableSecondScreenDiv]').down('[id=tableKit_body]').update(html);
    this.arrayOfInputs = this.virtualHtml.select('input.OM_MassTrans_textInput');
    this.testandObserveInputs();
    TableKit.reloadTable('OM_MassTrans_secondTable');
},
/*
* @method testandObserveInputs
* @desc for all the inputs in the table, we put an observe of focus
*/
testandObserveInputs: function() {
    var a = 0;
    for (var i = 0; i < this.arrayOfInputs.length; i++) {
        this.arrayOfInputs[i].observe('focus', this.disableSaveFocus.bind(this));

    }
},
/*
* @method disableSaveFocus
* @param event: input clicked
* @desc for all the inputs in the table, we put an observe of keyup
*/
disableSaveFocus: function(event) {
    for (var i = 0; i < this.arrayOfInputs.length; i++) {
        if (this.arrayOfInputs[i].identify().include('OM_MassTrans_input')) {
            this.arrayOfInputs[i].stopObserving('keyup');
        }
    }
    event.element().observe('keyup', this.disableSaveBlur.bind(this));
},
/*
* @method disableSaveBlur
* @param event: text we have written
* @desc draw the table with the results selected in the first screen
*/
disableSaveBlur: function(event) {
    var id = event.element().identify();
    var obId = id.split('_')[3];
    var type = id.split('_')[4];
    var lang = id.split('_')[5];
    //we get the data from the translation changed
    var valueOfHashChanged = this.hashOfElementsInXml.get(obId).get(type).get(lang);
    //if the traslation is different from the first one, we enable the save button and we save the new description
    if (this.virtualHtml.down('input#' + id).value != valueOfHashChanged['@descr']) {
        this.ButtonMassTransFS.enable('OM_MassTrans_save');
        valueOfHashChanged['@descrChanged'] = this.virtualHtml.down('input#' + id).value;
        valueOfHashChanged['@changed'] = true;
    }
    //otherwise we disable the save button
    else {
        this.ButtonMassTransFS.disable('OM_MassTrans_save');
        valueOfHashChanged['@descrChanged'] = this.virtualHtml.down('input#' + id).value;
        valueOfHashChanged['@changed'] = false;
    }
    //if we leave the translation in blank, we disable save button
    if (this.virtualHtml.down('input#' + id).value == "")
        this.ButtonMassTransFS.disable('OM_MassTrans_save');
},
/*
* @method cancelButtonSecondScreen
* @desc redirect the flow to first screen
*/
cancelButtonSecondScreen: function() {
    this.massTransSecondScreenDiv.hide();
    this.massTransFirstScreenDiv.show();
},
/*
* @method saveButtonSecondScreen
* @desc we call the service to Modify teh translations
*/
saveButtonSecondScreen: function() {
    this.callToGetMassTrans("confirmChanges");
},
/*
* @method confirmChanges
* @param jsonObject: {json} contains the xmlOut after making the ajex request
* @desc redirect the flow to OM_Maintain application or OM_MassTrans_standard depending on the answer
*/
confirmChanges: function(jsonObject) {
    //we get the message or messages received from sap
    var message = jsonObject.EWS.messages.item;
    var success = true;
    //if there are more than one message
    if (message.length > 1) {
        for (var i = 0; i < message.length; i++) {
            if (message[i]['@msgty'] == 'S')
                success = true;
            else {
                success = false;
                break;
            }
        }
    }
    //if a message is 'S' the response was succesfull, so we go to OM_Maintain
    if (success) {
        this.massTransSecondScreenDiv.hide();
        this.massTransFirstScreenDiv.show();
        //initialize the array
        this.arrayResults = new Array();
        //unselect all the table
        for (var col = 0; col < this.numberOfColumns; col++) {
            for (var row = 0; row < this.numberOfRows; row++) {
                //select every checkbox
                this.arrayCheckboxes[row][col].checked = false;
            }
        }
        //open the OM_Maintain app
        document.fire('EWS:openApplication', $H({
            app: 'maintainNew',
            refresh: true
        }));
    }
    //Otherwise we go to the second screen again
    else {
        this.massTransSecondScreenDiv.hide();
        this.massTransFirstScreenDiv.show();
    }
},
/*
* @method close
* @desc called when the application is not shown.
*/
close: function($super) {
    $super();

}
});
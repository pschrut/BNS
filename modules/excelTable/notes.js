/*************************************************************
*
* @Author: Ezequiel Bozzetti
* @Date: 09/09  
* @Details: this object creates a list of notes containing 
*           the details added by managers for the diferent 
*           compensation plans for each employee
*
*************************************************************/

var _thiss = null;

var Notes = Class.create(origin, {

    /**
    *@type Element
    *@description Table with the list of notes.
    */
    notesTable: null,

    /**
    *@type String
    *@description Div around the list of notes.
    */
    notesListDivId: "notes_List_div",

    /**
    *@type Element
    *@description Div around the notes list.
    */
    notesListDiv: null,

    /**
    *@type String
    *@description Div around the application.
    */
    mainDivId: "notes_div",

    /**
    *@type json
    *@description stores initial values in case of undo.
    */
    initialJson: null,

    /**
    *@type hash
    *@description stores plans and amounts for those plans.
    */
    changedRows: null,

    /**
    * @type Hash
    * @description List of labels added dynamically
    */
    dynLabels: null,

    /**
    * @type Hash
    * @description Id of the sticky Note cell
    */
    cellId: null,

    newText: '',

    initialize: function($super, options) {
        $super('notes');
        this.options = options;
        this.notesListDiv = new Element("div", {
            "class": "",
            "id": this.employeeListDivId
        });
        _thiss = this;
        this.dynLabels = $H();
        this.changedRows = {
            elements: []
        };
        this.undoSelectedCOMBinding = this.undoSelectedCOM.bindAsEventListener(this);
        document.observe('EWS:undoSelectedCOM', this.undoSelectedCOMBinding);
    },

    run: function() {
    },

    close: function($super) {
        this.closeTable();
    },

    //--------------------------------------------------------------------------------------------------------------------------
    //					GETTERS & LISTENERS
    //--------------------------------------------------------------------------------------------------------------------------
    getNotesTable: function() { return this.notesListTable },

    getChangedRows: function() { return this.changedRows },

    undoSelectedCOM: function() {
        this.changedRows = {
            elements: []
        };
    },

    //--------------------------------------------------------------------------------------------------------------------------
    //					INFOPOPUP METHODS
    //--------------------------------------------------------------------------------------------------------------------------
    /**
    *@description Displays the infoPopUp object with the complete table when the right arrow is clicked
    *				
    */
    displayInfoPopUp: function(json, event) {
        // Create object just in time.
        this.addToLabels(json);
        var originaltarget = getEventSrc(event);
        this.cellId = originaltarget.id;
        var orgUnitDetail = $A();
        if (!Object.isEmpty(this.initialJson.EWS.o_org_unit))
            orgUnitDetail = objectToArray(this.initialJson.EWS.o_org_unit);

        var canSave = '';
        orgUnitDetail.each(function(orgUnit) {
            canSave = orgUnit['@can_save'];
        });

        var hash = $H({
            title: this.getDynLabels('NOTES')
        });

        var content = new Element('table', { 'width': '100%' });
        var tbody = new Element('tbody');
        content.insert(tbody);
        var tr = new Element('tr');
        tbody.insert(tr);
        var td = new Element('td', { 'class': 'application_main_title2' })
        tr.insert(td);
        td.insert(hashToHtml(hash));

        var contentHTML = new Element('div', { 'style': 'padding-right=100px;' });
        contentHTML.insert(content);

        var contentDiv = new Element('div', { 'style': 'overflow:auto; overflow-y:hidden', 'id': 'tableContentDiv' });

        var recs = $A();
        if (!Object.isEmpty(json.EWS.o_records.yglui_str_com_rec))
            recs = objectToArray(json.EWS.o_records.yglui_str_com_rec);

        var notesTable = new Element('table', {
            'cellspacing': '1',
            'id': 'notesTable',
            'style': 'width:100%;'
        });

        contentDiv.insert(notesTable);

        var notesThead = new Element('thead', { "id": "notesThead" });
        notesTable.insert(notesThead);

        var notesTr = new Element('tr', { 'bgColor': '#DCD2CE', 'id': 'notesHeaderTr' });
        notesThead.insert(notesTr);

        var notesTd = new Element('th', { 'style': 'display: ""', 'att_collapsed': 'X', 'att_hidden': '', 'id': 'thNoteAuthor', 'width': '25%' });
        notesTd.insert(new Element('span').update('Author'));
        notesTr.insert(notesTd);

        notesTd = new Element('th', { 'style': 'display: ""', 'att_collapsed': 'X', 'att_hidden': '', 'id': 'thNoteDate', 'width': '25%' });
        notesTd.insert(new Element('span').update('Date'));
        notesTr.insert(notesTd);

        var notesTd = new Element('th', { 'style': 'display: ""', 'att_collapsed': 'X', 'att_hidden': '', 'id': 'thNoteTxt', 'width': '50%' });
        notesTd.insert(new Element('span').update('Description'));
        notesTr.insert(notesTd);

        var notesTbody = new Element('tbody', { "id": "notesTbody" });
        notesTable.insert(notesTbody);
        var i = 2;
        recs.each(function(yglui_str_com_rec) {
            var notes = $A();
            if (!Object.isEmpty(yglui_str_com_rec.comments)) {
                notes = objectToArray(yglui_str_com_rec.comments.yglui_str_com_com);
                notes.each(function(yglui_str_com_com) {
                    if (('Note_' + i + '_' + yglui_str_com_com['@pernr']) == this.cellId) {
                        var elemTr = new Element('tr');
                        var elemTd = new Element('td');
                        elemTr.insert(elemTd);
                        elemTd.insert(new Element('span').update(yglui_str_com_com['@author']));

                        elemTd = new Element('td');
                        elemTd.insert(new Element('span').update(convertdateFormat(yglui_str_com_com['@c_date'])));
                        elemTr.insert(elemTd);

                        elemTd = new Element('td');
                        elemTd.insert(new Element('span').update(yglui_str_com_com['@value']));
                        elemTr.insert(elemTd);
                        notesTbody.insert(elemTr);
                    }

                } .bind(this));
            }
            i++;
        } .bind(this));

        var replaceCurrent = function() {
            var newText = $("newCommentArea").value;
            var elemTr = new Element('tr');
            var elemTd = new Element('td');
            elemTr.insert(elemTd);
            elemTd.insert(new Element('span').update($('my_details_username').childNodes[0].innerHTML));

            var currentTime = new Date()
            var month = currentTime.getMonth() + 1
            var day = currentTime.getDate()
            var year = currentTime.getFullYear();
            elemTd = new Element('td');
            elemTd.insert(new Element('span').update(year + "-" + month + "-" + day));
            elemTr.insert(elemTd);

            elemTd = new Element('td');
            elemTd.insert(new Element('span').update(newText));
            elemTr.insert(elemTd);
            var count = 0;
            var found = -1;
            this.newText = newText;
            this.notes.changedRows.elements.each(function(row) {
                found = -1
                var row_id = this.cellId;
                if (row.id == row_id)
                    found = count;
                count++;
                if (found >= 0)
                    row.comment = this.newText;
            } .bind(this));

            $("notesTbody").appendChild(elemTr);
            $("mainTitle2").style.display = 'none';
            $("newCommentArea").style.display = 'none';
            $("Notesbuttonstable").style.display = 'none';
            document.fire('EWS:compensation_noteUpdated', { 'cellId': this.cellId });
            notesPopUp.close();
        };

        var addAnother = function() {
            var newText = $("newCommentArea").value;
            var newPernr = $("newCommentArea").readAttribute('pernr');
            var elemTr = new Element('tr');
            var elemTd = new Element('td');
            elemTr.insert(elemTd);
            elemTd.insert(new Element('span').update($('my_details_username').childNodes[0].innerHTML));

            var currentTime = new Date()
            var month = currentTime.getMonth() + 1
            var day = currentTime.getDate()
            var year = currentTime.getFullYear();
            elemTd = new Element('td');
            elemTd.insert(new Element('span').update(year + "-" + month + "-" + day));
            elemTr.insert(elemTd);
            elemTd = new Element('td');
            elemTd.insert(new Element('span').update(newText));
            elemTr.insert(elemTd);
            this.notes.changedRows.elements.push({ 'id': this.cellId, 'manager': $('my_details_username').childNodes[0].innerHTML, 'comment': newText, 'date': (year + "-" + month + "-" + day), 'pernr': newPernr, 'f_citem': $(this.cellId).parentElement.readAttribute('f_citem') });
            $('saveChangesNote').style.display = '';
            $("notesTbody").appendChild(elemTr);
            $("mainTitle2").style.display = 'none';
            $("newCommentArea").style.display = 'none';
            $("Notesbuttonstable").style.display = 'none';
            document.fire('EWS:compensation_noteUpdated', { 'cellId': this.cellId });
            notesPopUp.close();
        }
        contentHTML.insert(contentDiv);
        var updatedMode = originaltarget.readAttribute('updatedMode');
        if (canSave == 'X') {
            var title = new Element('p', { "id": "mainTitle2" }).update(this.getDynLabels('newText'));
            var textarea = null;
            if (Object.isEmpty(updatedMode)) {
                textarea = new Element("textarea", { "id": "newCommentArea", "rows": "4", "cols": "50", "max-length": "5", 'pernr': originaltarget.readAttribute('pernr') });
            }
            else {
                var count = 0;
                var found = -1;
                this.notes.changedRows.elements.each(function(row) {
                    var row_id = this.cellId;
                    if (row.id == row_id)
                        found = count;
                    count++;
                } .bind(this));

                textarea = new Element("textarea", { "id": "newCommentArea", "rows": "4", "cols": "50", "max-length": "5", 'value': this.notes.changedRows.elements[found].comment, 'pernr': originaltarget.readAttribute('pernr') });
            }
            contentDiv.insert(title);
            contentDiv.insert(textarea);
            //buttons
            var buttonsJson = {
                elements: []
            };
            var aux1 = null;
            if (updatedMode == '') {
                aux1 = {
                    idButton: 'addAnother',
                    label: 'ADD',
                    handlerContext: null,
                    className: 'moduleInfoPopUp_stdButton',
                    handler: addAnother.bind(this),
                    type: 'button',
                    standardButton: true
                };
            }
            else {
                aux1 = {
                    idButton: 'replaceNote',
                    label: 'REPLACE',
                    handlerContext: null,
                    className: 'moduleInfoPopUp_stdButton',
                    handler: replaceCurrent.bind(this),
                    type: 'button',
                    standardButton: true
                };
            }
            buttonsJson.elements.push(aux1);

            var ButtonObj = new megaButtonDisplayer(buttonsJson);
            var buttons = ButtonObj.getButtons();
            var buttonsTable = new Element('table', { 'id': 'Notesbuttonstable', 'width': '100%' });
            var buttonsTbody = new Element('tbody');
            buttonsTable.insert(buttonsTbody);
            var buttonsTr = new Element('tr');
            buttonsTbody.insert(buttonsTr);
            var buttonsTd = new Element('td');
            buttonsTr.insert(buttonsTd);
            //insert buttons in div
            buttonsTd.insert(buttons);
            contentHTML.insert(buttonsTable);
        }
        var notesPopUp = new infoPopUp({

            closeButton: $H({
                'textContent': 'Close',
                'callBack': function() {
                    notesPopUp.close();
                    delete notesPopUp;
                }
            }),
            htmlContent: contentHTML,
            indicatorIcon: '',
            width: 700,
            heiht: 400
        });
        notesPopUp.create();
    },


    //--------------------------------------------------------------------------------------------------------------------------
    //					RESTORE METHOD
    //--------------------------------------------------------------------------------------------------------------------------
    resetChangedRows: function() {
        this.changedRows = {
            elements: []
        };

    },
    //--------------------------------------------------------------------------------------------------------------------------
    //					OTHER METHODS
    //--------------------------------------------------------------------------------------------------------------------------	

    /**
    * @description Add the dynamic labels from the received XML to a global list
    * @param {Object} json the received XML with Json format
    */
    addToLabels: function(json) {
        if (Object.isEmpty(json.EWS.labels)) return;
        objectToArray(json.EWS.labels.item).each(function(label) {
            if (!Object.isEmpty(label['@id']) && !Object.isEmpty(label['@value']))
                this.dynLabels.set(label['@id'], label['@value']);
        } .bind(this));
    },
    /**
    * @description Get the label associated to an Id
    * @param {String} labelId Id of the label to get
    */
    getDynLabels: function(labelId) {
        if (Object.isEmpty(labelId)) return '';
        var label = this.dynLabels.get(labelId);
        if (Object.isEmpty(label)) label = labelId;
        return label;
    }
});

function convertdateFormat(dateObj) {
    var dateArr = dateObj.split('-');
    return trim(dateArr[1]) + '/' + trim(dateArr[2]) + '/' + trim(dateArr[0]);
}
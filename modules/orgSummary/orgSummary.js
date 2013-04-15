/*************************************************************
*
* @Author: Inna Vinokurova
* @Date: 21/09/2009  
* @Details: this object creates a top summary for for the diferent compensation plans 
*           based on list of employees for a specific maganger
*           
*************************************************************/

var OrgSummary = Class.create(origin, {

    /**
    *@type Element
    *@description Table with the org summary.
    */
    ogrSummaryTable: null,

    /**
    *@type String
    *@description Id of the Div around the org summary.
    */
    ogrSummaryDivId: "ogrSummary_div",

    /**
    *@type Element
    *@description Div around the org summary.
    */
    ogrSummaryDiv: null,

    /**
    *@type String
    *@description Div around the application.
    */
    mainDivId: "ogr_summary_div",

    /**
    * @type Hash
    * @description List of labels added dynamically
    */
    dynLabels: null,

    /**
    *@type json
    *@description stores initial values in case of undo.
    */
    initialJson: null,

    initialize: function($super, options) {
        $super('orgSummary');
        this.options = options;

        this.ticketListDiv = new Element("div", {
            "id": this.ogrSummaryDivId,
            "style": "overflow:auto; overflow-y:hidden"
        });

        this.planList = new Array();
        this.dynLabels = $H();
    },

    run: function() {
    },

    close: function($super) {
        if (this.ogrSummaryDiv) this.ogrSummaryDiv.innerHTML="";
    },

    //--------------------------------------------------------------------------------------------------------------------------
    //					SERVICES CALLERS
    //--------------------------------------------------------------------------------------------------------------------------
    getSumTable: function() { return this.ogrSummaryTable },

    //--------------------------------------------------------------------------------------------------------------------------
    //					EMPLOYEE LIST
    //--------------------------------------------------------------------------------------------------------------------------	
    /**
    *@description Builds the HTML code and the objects to display the org summary table. 
    *				It created the TableKit object with a limited number of lines and a 
    *				new sort for dates. It also close the details of ticket if one is open.
    *@param {Object} json Answer of the service get_tickets_list().
    */
    buildOrgSummary: function(json) {

        this.initialJson = json;

        // Close the displayed ticket if any and the list of tickets
        this.closeTable();

        if (!Object.isEmpty(json)) {
            this.drawSummaryTable(json, '', '');
        }

        document.fire('EWS:compensation_summaryTableReady', null);
    },

    /**
    *@description Draw the summary table. 
    *@param {Object} json Answer of the service COM_EMP_LIST.
    *@param {Element} footer Footer of the table that is already buid by TableKit.
    *@returns Element
    */
    drawSummaryTable: function(json, newSpent, updatePlan) {
        this.planList = new Array(); //Reinitialize the plans list
        var plansListNotFilled = true; //To only fill the planList Once

        if (this.ogrSummaryDiv) this.ogrSummaryDiv.remove();

        this.ogrSummaryDiv = new Element("div", {
            'id': this.ogrSummaryDivId,
            'style': 'overflow:auto; overflow-y:hidden'
        });

        var orgUnitDetail = $A();
        if (!Object.isEmpty(json.EWS.o_org_unit))
            orgUnitDetail = objectToArray(json.EWS.o_org_unit);
        var ouName = '';
        var canSave = '';
        orgUnitDetail.each(function(orgUnit) {
            ouName = orgUnit['@org_text'];
            canSave = orgUnit['@can_save'];
        });

        this.addToLabels(json);

        var budgets = $A();

        if (Object.isEmpty(json.EWS.o_summary)) {
            var table = new Element("div", {
                "style": "clear:both; padding-top:10px"
            }).insert(new Element("span", {
                "class": "application_main_title2"
            }).update(global.getLabel("No result for selected period")));

            this.ogrSummaryDiv.insert(table);
            this.ogrSummaryTable = this.ogrSummaryDiv;

            return;
        }
        var manager = json.EWS.o_summary['@manager'];
        var pending = json.EWS.o_summary['@pending_ees'];
        var totalee = json.EWS.o_summary['@total_ees'];

        var table = new Element('table', {
            'cellspacing': '1',
            'id': 'summTable',
            'width': '100%;'
        });

        var tbody = new Element('tbody');
        table.insert(tbody);

        /**************************INSERT TABLE HEADER*************************************/

        var tr = new Element('tr');
        tbody.insert(tr);

        var td = new Element('td', { 'colspan': '50' });
        tr.insert(td);

        td.insert(new Element('span', { 'class': 'application_main_title', 'id': 'org_sum_title'
        }).update(ouName));
        td.insert(new Element('span', { 'id': 'saveChangesNote', 'class': 'COM_save_warn', 'style': 'display:none; float:right' }).update('Please save your changes'));

        tr.insert(td);

        /**************************INSERT ROW HEADER*********************************/
        // First header row
        var tr = new Element('tr', { 'class': 'table_doubleHeaderUpper' });
        tbody.insert(tr);

        var td = new Element('th', { 'colspan': '1' });
        tr.insert(td);
        var td = new Element('th', { 'colspan': '1' });
        td.insert(new Element('span').update(this.getDynLabels('employees')));
        tr.insert(td);

        var plans = $A();

        if (!Object.isEmpty(json.EWS.o_summary.budgets)) {
            plans = objectToArray(json.EWS.o_summary.budgets.yglui_str_com_bud);

            plans.each(function(yglui_str_com_bud) {

                var col_counter = 0;

                // Fimd out how many columns the table has for a particular plan
                if (yglui_str_com_bud['@remaining'] != undefined) {
                    col_counter++;
                }
                if (yglui_str_com_bud['@spent'] != undefined) {
                    col_counter++;
                }
                if (yglui_str_com_bud['@total'] != undefined) {
                    col_counter++;
                }
                if (yglui_str_com_bud['@percentage'] != undefined) {
                    col_counter++;
                }

                if (col_counter == 0) {
                    // No data send for this plan.
                    // Add one column to show the message.
                    col_counter++;
                }

                var td = new Element('th', { 'colspan': col_counter, 'class': 'table_doubleHeaderUpper' });
                td.insert(new Element('span').update(yglui_str_com_bud['@name']));
                tr.insert(td);
            } .bind(this));
        }

        // Second header row
        var tr = new Element('tr', { 'class': 'table_doubleHeaderLower' });
        tbody.insert(tr);

        var td = new Element('th', { 'colspan': '1', 'class': 'table_doubleHeaderLower' });
        td.insert(new Element('span').update(this.getDynLabels('manager')));
        tr.insert(td);

        var td = new Element('th', { 'colspan': '1', 'class': 'table_doubleHeaderLower' });
        td.insert(new Element('span').update(this.getDynLabels('pending_ees')));
        tr.insert(td);

        if (plans.length > 0) {
            // Add standard columns for each plan is column in question is present...
            for (var ii = 0, len = plans.length; ii < len; ++ii) {

                var remaining = plans[ii]['@remaining'];
                var spent = plans[ii]['@spent'];
                var pc = plans[ii]['@percentage'];
                var total = plans[ii]['@total'];

                // Check if % value is present
                if (pc != undefined) {
                    var td = new Element('th', { 'colspan': '1', 'class': 'table_doubleHeaderLower' });
                    td.insert(new Element('span').update('%'));
                    tr.insert(td);
                }

                // Check if Budget value is present  
                if (total != undefined) {
                    var td = new Element('th', { 'colspan': '1', 'class': 'table_doubleHeaderLower' });
                    td.insert(new Element('span').update(this.getDynLabels('budget')));
                    tr.insert(td);
                }
                // Check if Spent value is present
                if (spent != null) {
                    var td = new Element('th', { 'colspan': '1', 'class': 'table_doubleHeaderLower' });
                    td.insert(new Element('span').update(this.getDynLabels('spent')));
                    tr.insert(td);
                }
                // Check if remaining value is present
                if (remaining != null) {
                    var td = new Element('th', { 'colspan': '1', 'class': 'table_doubleHeaderLower' });
                    td.insert(new Element('span').update(this.getDynLabels('remaining')));
                    tr.insert(td);
                }
            } //for
        } // budgets
        /**************************INSERT VALUES ***************************************/

        var tr = new Element('tr', { 'class': '' });
        tbody.insert(tr);

        // Manager
        var td = new Element('td', { 'colspan': '1',
            'class': 'application_text_bolder'
        });
        td.insert(new Element('span').update(manager));
        tr.insert(td);
        /*
        var td = new Element('td', { 'colspan': '1', 'id': 'totalee' });
        td.insert(new Element('span').update(totalee));
        tr.insert(td);
        */
        var td = new Element('td', { 'colspan': '1', 'id': 'pendingee' });
        td.insert(new Element('span').update(pending));
        tr.insert(td);

        plans.each(function(yglui_str_com_bud) {
            var planid = yglui_str_com_bud['@id'];
            var arem = "";
            var aspent = "";
            var a_color = "";
            var aperc = yglui_str_com_bud['@percentage'];
            var atot = yglui_str_com_bud['@total'];

            if (planid == updatePlan && newSpent != '') {

                var sp = parseFloat(yglui_str_com_bud['@spent']);
                var rm = parseFloat(yglui_str_com_bud['@remaining']);
                var nsp = parseFloat(newSpent);
            }
            else {
                arem = yglui_str_com_bud['@remaining'];
                aspent = yglui_str_com_bud['@spent'];
            }
            if (aspent != undefined && atot != undefined && Math.min(atot, aspent) == atot && (atot - aspent) != 0) {
                a_color = "COM_fontRed";
            }
            else {
                a_color = "COM_fontBlack";
            }

            aspent = Math.round((aspent) * 100) / 100;
            arem = Math.round((arem) * 100) / 100;

            // Find out how many columns the table has for a particular plan
            if (aperc != undefined) {
                var td_id = 'td_' + planid + '_%';
                var sp_id = planid + '_%';

                var td = new Element('td', { 'id': td_id, 'colspan': '1' });
                td.insert(new Element('span', { 'id': sp_id }).update(aperc));
                tr.insert(td);
            }

            if (atot != undefined) {
                var sp_id = planid + '_tot';
                var td_id = 'td_' + planid + '_tot';

                var td = new Element('td', { 'id': td_id, 'colspan': '1' });

                td.insert(new Element('span', { 'id': sp_id }).update(longToDisplay(parseFloat(atot))));
                tr.insert(td);
            }

            if (aspent != undefined) {
                var sp_id = planid + '_spent';
                var td_id = 'td_' + planid + '_spent';

                var td = new Element('td', { 'id': td_id, 'colspan': '1' });

                td.insert(new Element('span', { 'id': sp_id }).update(longToDisplay(parseFloat(aspent))));
                tr.insert(td);
            }
            if (arem != undefined) {
                var sp_id = planid + '_rem';
                var td_id = 'td_' + planid + '_rem';

                var td = new Element('td', { 'id': td_id, 'colspan': '1', "class": a_color });

                td.insert(new Element('span', { 'id': sp_id }).update(longToDisplay(parseFloat(arem))));
                tr.insert(td);
            }
        } .bind(this));

        this.ogrSummaryDiv.insert(table);
        this.ogrSummaryTable = this.ogrSummaryDiv;

    },

    /**
    *@description Restores the table with the initial Json object.
    *				
    */
    restore: function() {
        this.buildOrgSummary(this.initialJson);
    },

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
    },

    /**
    *@description Updates the number of completed employees
    *				
    */
    updateEE: function(eeChanged) {
        var ee_amount = eeChanged.memo.value;
        var td = $('pendingee');
        td.firstChild.innerHTML = (td.firstChild.innerHTML - 0) + (ee_amount - 0);

    },

    /**
    *@description Restores the table with new changes
    *				
    */
    rebuild: function(amountChanged) {
        var diff = amountChanged.memo.args[6].diff;
        var plan_id = amountChanged.memo.args[4].value;
        var ch_amount = amountChanged.memo.value;

        if (null == plan_id) //nothing to update
            return
        var current_budget = $(plan_id + '_tot');
        var budgethtml = current_budget.innerHTML;
        var flbudget = parseFloat(displayToLong(budgethtml));

        var current_spent = $(plan_id + '_spent');
        var spenthtml = displayToLong(current_spent.innerHTML);

        var current_rem = $(plan_id + '_rem');
        var remhtml = displayToLong(current_rem.innerHTML);

        var sp = Math.round(spenthtml * 100) / 100;
        var rm = Math.round(remhtml * 100) / 100;
        var nsp = Math.round((diff - 0) * 100) / 100;
        var new_spent;
        var td_class = 'application_color_eeColor09';

        new_spent = sp + nsp;
        var newNum = Math.round(new_spent * 100) / 100;

        current_spent.innerHTML = longToDisplay(newNum);

        newNum = Math.round((rm - nsp) * 100) / 100;
        current_rem.innerHTML = longToDisplay(newNum);

        // Update colors
        var plbudget = $('td_' + plan_id + '_tot');

        if (plbudget != null) {
            var percent = $('td_' + plan_id + +'_%');
            if ((rm - nsp) < 0) {
                $('td_' + plan_id + '_rem').className = "";
                $('td_' + plan_id + '_rem').addClassName('COM_fontRed');
            }
            else {
                $('td_' + plan_id + '_rem').className = "";
                $('td_' + plan_id + '_rem').addClassName('COM_fontBlack');
            }
        }
    },

    /**
    *@description Remove the content of the list 
    */
    closeTable: function() {
        // Do something only if there is a current table
        if (Object.isEmpty(this.ogrSummaryDiv) || Object.isEmpty(this.ogrSummaryDiv.down())) return;
    }
});



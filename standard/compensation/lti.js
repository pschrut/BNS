var LTI = Class.create(CompensationTab, {

    initialize: function($super, args) {
        $super(args, { 'obj_name': 'LTI', 'COMP_CATEGORY': '4', 'SERVICE_NAME': 'COM_EMP_PLANS' });
    },

    run: function($super, args) {
        $super(args);
    },

    close: function($super, args) {
        $super();
        //document.stopObserving('EWS:compensation_empDetailSelected');
        /*
        document.stopObserving('EWS:compensationReviewPeriodSelected', this.compensationReviewPeriodSelectedBinding);
        document.stopObserving('EWS: compensationOrgUnitSelected', this.onOrgUnitSelectedBinding);
        document.stopObserving('EWS:compensation_updatedAmount', this.onAmountUpdatedBinding);        
        */
        document.stopObserving('EWS:compensation_empTableReady', this.onEmpTableReadyBinding);
        document.stopObserving('EWS:compensationExportToExcel', this.exportToExcelBinding);
        document.stopObserving('EWS:compensation_summaryTableReady', this.onOrgSummaryTableReadyBinding);
        document.stopObserving('EWS:compensation_hidebuttons', this.onHiddeButtonsBinding);
        this.firstRun = true;
    }

});
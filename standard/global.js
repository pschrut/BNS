
/**
* Map between classnames and files needed to make them run
*/
CLASS_VIEW = $H({
	//WA - Time
	CAL: ["standard/parentCalendar/parentCalendar.js", "standard/calendar/calendar.js","modules/balloon/balloon.js", "standard/fastEntry/fastEntryMenu.js"],
	listCalendar: ["standard/parentCalendar/parentCalendar.js", "standard/listCalendar/listCalendar.js"],
	teamCalendar: ["standard/parentCalendar/parentCalendar.js", "standard/teamCalendar/teamCalendar.js","modules/balloon/balloon.js"],
	timeSheet: ["standard/timeSheet/timeSheet.js"],
	timeEntryScreen: ["standard/timeEntryScreen/timeEntryScreen.js","modules/progressBar/progressBar.js","modules/multiSelect/multiSelect.js", "standard/fastEntry/fastEntryMenu.js"],
	
    //Fast entry
	fastEntryScreen: ["standard/fastEntry/fastEntryScreen.js","modules/progressBar/progressBar.js","modules/multiSelect/multiSelect.js", "standard/fastEntry/fastEntryMenu.js"],
	//PCR
	PCR_overview: ["standard/PCR/PCR_Overview.js","modules/tablekit/tablekitWithSearch.js"],
	PCR_Steps: ["standard/PCR/PCR_Steps.js","modules/Wizard/Wizard.js"],
	// Payslip
	PAY: ["standard/payslip/payslip.js", "modules/tablekit/tablekitWithSearch.js"],
	// Canadian tax forms
	YCA_TAXF: ["countries/CA/ca_TaxForms.js", "modules/tablekit/tablekitWithSearch.js"],
	// Quotas
	QOT: ["standard/quotas/quotas.js"],
	//Framework
	AdvancedSearch: ["standard/advancedSearch/advancedSearch.js"],
	LOGOFF: ["standard/logOff/logOff.js"],
	getContentDisplayer: ["standard/PFM/parentPFM.js", "standard/GenericApplications/getContentDisplayer.js","modules/fieldDisplayer/fieldDisplayer.js"],
	INBOX: ["standard/inbox/inbox.js"],
	DELE: ["standard/delegation/delegation.js"],
	StartPage: ["standard/help/startPage.js"],
	KMMENU: ["standard/help/startPagesMenu.js"],
	//PFM
	//PFM_BoxGrid: ["standard/PFM/parentPFM.js","standard/PFM/PFM_BoxGrid.js"],
	XBoxGrid: ["standard/PFM/parentPFM.js","standard/reporting/XBoxGrid.js","modules/groupedLayout/groupedLayout.js","modules/boxGrid/boxGrid.js"],
	PFM_Dashboard: ["standard/PFM/parentPFM.js","standard/PFM/PFM_Dashboard.js","modules/groupedLayout/groupedLayout.js","modules/fieldDisplayer/fieldDisplayer.js"],
	PFM_DevPlan: ["standard/PFM/parentPFM.js","standard/PFM/PFM_DevPlan.js","modules/groupedLayout/groupedLayout.js","modules/fieldDisplayer/fieldDisplayer.js"],
	PFM_JobProfileMatchUp: ["standard/PFM/parentPFM.js","standard/PFM/PFM_JobProfileMatchUp.js","modules/groupedLayout/groupedLayout.js","modules/fieldDisplayer/fieldDisplayer.js"],
	PFM_IndividualDocs: ["standard/PFM/PFM_IndividualDocs.js","modules/tablekit/tablekitWithSearch.js"],
	PFM_TeamOv: ["standard/PFM/PFM_TeamOv.js","modules/tablekit/tablekitWithSearch.js"],
	PFM_ShowDocs: ["standard/PFM/parentPFM.js","standard/PFM/PFM_ShowDocs.js","modules/groupedLayout/groupedLayout.js","modules/simpleTable/simpleTable.js","modules/fieldDisplayer/fieldDisplayer.js"],
	PFM_RatingDistribution: ["standard/PFM/parentPFM.js","standard/PFM/PFM_RatingDistribution.js","modules/groupedLayout/groupedLayout.js","modules/fieldDisplayer/fieldDisplayer.js"],
	PFM_TeamGoals: ["standard/GenericCatalog/GenericCatalog.js","standard/PFM/PFM_TeamGoals.js","modules/treeHandler/treeHandler.js","modules/balloon/balloon.js"],
	PFM_MaintainGoals : ["standard/GenericApplications/getContentDisplayer.js","standard/PFM/PFM_MaintainGoals.js"],
	PFM_CloseDocs: ["standard/PFM/PFM_CloseDocs.js","modules/tablekit/tablekitWithSearch.js"],
	COMPCATL: ["standard/GenericCatalog/GenericCatalog.js","standard/compCatl/compCatl.js","modules/balloon/balloon.js","modules/treeHandler/treeHandler.js"],
	COMP_CATL_ACG: ["standard/fieldsPanel/dynamicFieldsPanel.js","modules/multiSelect/multiSelect.js","standard/GenericApplications/getContentDisplayer.js","standard/compCatl/compCatAddGrp.js"],
	COMP_CATL_AC: ["standard/fieldsPanel/dynamicFieldsPanel.js","modules/multiSelect/multiSelect.js","standard/GenericApplications/getContentDisplayer.js","standard/compCatl/compCatlAddComp.js"],
	//Learning
	CATL: ["standard/GenericCatalog/GenericCatalog.js", "standard/catalog/catalog.js", "modules/balloon/balloon.js", "modules/treeHandler/treeHandler.js"],
	CATLMAINTVIEW: ["standard/GenericCatalog/GenericCatalog.js", "standard/catalog/catalogMaintView.js", "modules/balloon/balloon.js", "modules/treeHandler/treeHandler.js"],
	CATL_CG: ["standard/GenericApplications/getContentDisplayer.js", "standard/catalog/catalogCourseGroup.js", "standard/fieldsPanel/dynamicFieldsPanel.js", "modules/multiSelect/multiSelect.js"],
	CATL_C: ["standard/GenericApplications/getContentDisplayer.js", "standard/catalog/catalogCourseSessionDetails.js", "standard/fieldsPanel/dynamicFieldsPanel.js", "modules/multiSelect/multiSelect.js"],
	CATL_CT: ["standard/GenericApplications/getContentDisplayer.js", "standard/catalog/catalogCourseType.js", "standard/fieldsPanel/dynamicFieldsPanel.js", "modules/multiSelect/multiSelect.js"],
	CATL_CUT: ["standard/GenericApplications/getContentDisplayer.js", "standard/catalog/catalogCurrDetails.js", "standard/fieldsPanel/dynamicFieldsPanel.js", "modules/multiSelect/multiSelect.js"],
	CATL_CUR: ["standard/GenericApplications/getContentDisplayer.js", "standard/catalog/catalogCurrSessionDetails.js", "standard/fieldsPanel/dynamicFieldsPanel.js", "modules/multiSelect/multiSelect.js"],
	CATLFollowUp: ["standard/catalog/catalogFollowUp.js", "modules/multiSelect/multiSelect.js"],
	BOOK: ["standard/book/book.js", "modules/multiSelect/multiSelect.js"],
	CUR: ["standard/bookCurriculum/bookCurriculum.js", "modules/multiSelect/multiSelect.js"],
	HIS: ["standard/history/history.js"],
	LMS: ["standard/myDevelopment/myDevelopment.js"],
	PREB: ["standard/prebook/prebook.js", "modules/multiSelect/multiSelect.js"],
	learningNewRequest: ["standard/learning/newTraining.js"],
	TEACH: ["standard/teacher/teacher.js"],
	resCatRoom: ["standard/GenericCatalog/GenericCatalog.js", "standard/resourceCat/resCatRoom.js", "modules/balloon/balloon.js", "modules/treeHandler/treeHandler.js"],
	resCatTeacher: ["standard/GenericCatalog/GenericCatalog.js", "standard/resourceCat/resCatTeacher.js", "modules/balloon/balloon.js", "modules/treeHandler/treeHandler.js"],
	resCatCompany: ["standard/GenericCatalog/GenericCatalog.js", "standard/resourceCat/resCatCompany.js", "modules/balloon/balloon.js", "modules/treeHandler/treeHandler.js"],
	resCatLocation: ["standard/GenericCatalog/GenericCatalog.js", "standard/resourceCat/resCatLocation.js", "modules/balloon/balloon.js", "modules/treeHandler/treeHandler.js"],
	roomAdmin: ["standard/GenericApplications/getContentDisplayer.js","standard/resourceCat/roomAdmin.js"],
	locationAdmin: ["standard/GenericApplications/getContentDisplayer.js", "standard/resourceCat/locationAdmin.js"],
	relatUAdmin: ["standard/GenericApplications/getContentDisplayer.js", "Standard/resourceCat/relatUAdmin.js"],
	companyAdmin: ["standard/GenericApplications/getContentDisplayer.js", "standard/resourceCat/companyAdmin.js"],
	teacherAdmin: ["standard/GenericApplications/getContentDisplayer.js", "standard/resourceCat/teacherAdmin.js"],
	relatPAdmin: ["standard/GenericApplications/getContentDisplayer.js", "Standard/resourceCat/relatPAdmin.js"],
	relatPRemove: ["standard/GenericApplications/getContentDisplayer.js", "standard/resourceCat/relatPRemove.js"],
	relatHAsign: ["standard/GenericApplications/getContentDisplayer.js", "standard/resourceCat/relatHAsign.js"],
	//OM
	DisplayTree: ["standard/GenericCatalog/GenericCatalog.js", "standard/new OM_Display/displayTree.js", "modules/balloon/balloon.js", "modules/treeHandler/treeHandler.js", "modules/drawTree/drawTree.js"],
	OM_CostCenter: ["standard/OM_CostCenter/OM_CostCenter.js"],
	MaintainTree: ["standard/GenericCatalog/GenericCatalog.js", "standard/new OM_Maintain/maintainTree.js", "modules/balloon/balloon.js", "modules/treeHandler/treeHandler.js"],
	MassTrans: ["standard/new OM_Maintain/massTrans.js"],
	CreateOrgUnit: ["standard/GenericApplications/getContentDisplayer.js", "standard/new OM_Maintain/createOrgUnit.js", "standard/fieldsPanel/dynamicFieldsPanel.js", "modules/multiSelect/multiSelect.js"],
	UpdateOrgUnit: ["standard/GenericApplications/getContentDisplayer.js", "standard/new OM_Maintain/updateOrgUnit.js", "standard/fieldsPanel/dynamicFieldsPanel.js", "modules/multiSelect/multiSelect.js"],
	changeAssignOrg: ["standard/GenericApplications/getContentDisplayer.js", "standard/new OM_Maintain/changeAssignOrg.js"],
	CreatePosition: ["standard/GenericApplications/getContentDisplayer.js", "standard/new OM_Maintain/createPosition.js", "standard/fieldsPanel/dynamicFieldsPanel.js", "modules/multiSelect/multiSelect.js"],
	UpdatePosition: ["standard/GenericApplications/getContentDisplayer.js", "standard/new OM_Maintain/updatePosition.js", "modules/groupedLayout/groupedLayout.js", "standard/fieldsPanel/dynamicFieldsPanel.js", "modules/multiSelect/multiSelect.js"],
	NewAssign: ["standard/GenericApplications/getContentDisplayer.js", "standard/new OM_Maintain/newAssign.js"],
	AssignSuccNew: ["standard/GenericApplications/getContentDisplayer.js", "standard/new OM_Maintain/newSuccessor.js"],
	AssignHolder: ["standard/GenericApplications/getContentDisplayer.js", "standard/new OM_Maintain/assignHolder.js"],
	AssignSucc: ["standard/GenericApplications/getContentDisplayer.js", "standard/new OM_Maintain/assignSuccessor.js"],
	AssignHolderAddOcc: ["standard/GenericApplications/getContentDisplayer.js", "standard/new OM_Maintain/assignHolderAddOcc.js"],
	ChangeAssign: ["standard/GenericApplications/getContentDisplayer.js", "standard/new OM_Maintain/changeAssign.js"],
	ManageHolderAssign: ["standard/GenericApplications/getContentDisplayer.js", "standard/new OM_Maintain/manageHolderAssign.js"],
	DisplayOrgUnit: ["standard/GenericApplications/getContentDisplayer.js", "standard/new OM_Maintain/displayOrgUnit.js"],
	DisplayPosition: ["standard/GenericApplications/getContentDisplayer.js", "standard/new OM_Maintain/displayPosition.js"],
	DisplayPerson: ["standard/GenericApplications/getContentDisplayer.js", "standard/new OM_Maintain/displayPerson.js"],
	JCAT: ["standard/GenericCatalog/GenericCatalog.js","standard/jobCatalogue/jobCatalogue.js", "modules/balloon/balloon.js", "modules/treeHandler/treeHandler.js"],
	MaintainJob: ["standard/GenericApplications/getContentDisplayer.js", "standard/jobCatalogue/maintainJob.js", "modules/groupedLayout/groupedLayout.js"],
	JobAddData: ["standard/GenericApplications/getContentDisplayer.js", "standard/jobCatalogue/JobAddData.js"],
	AddEvalRes: ["standard/GenericApplications/getContentDisplayer.js", "standard/jobCatalogue/AddEvalRes.js"],
	AddSurvRes: ["standard/GenericApplications/getContentDisplayer.js", "standard/jobCatalogue/AddSurvRes.js"],
	AddPlanComp: ["standard/GenericApplications/getContentDisplayer.js", "standard/jobCatalogue/AddPlanComp.js"],
	JobAddDataDisplay: ["standard/GenericApplications/getContentDisplayer.js", "standard/jobCatalogue/JobAddDataDisplay.js"],
	CreateJob: ["standard/GenericApplications/getContentDisplayer.js", "standard/jobCatalogue/createJob.js"],
	MaintainJobFam: ["standard/GenericApplications/getContentDisplayer.js", "standard/jobCatalogue/maintainJobFam.js"],
	MaintainJobDisplay: ["standard/GenericApplications/getContentDisplayer.js", "standard/jobCatalogue/maintainJobDisplay.js"],
	MaintainJobFamDisplay: ["standard/GenericApplications/getContentDisplayer.js", "standard/jobCatalogue/maintainJobFamDisplay.js"],
	changeAssignJobFam: ["standard/GenericApplications/getContentDisplayer.js", "standard/jobCatalogue/changeAssignJobFam.js"],
	changeAssignJob: ["standard/GenericApplications/getContentDisplayer.js", "standard/jobCatalogue/changeAssignJob.js"],
	WhoIsWho: ["standard/whoIsWho/covFlow.js", "standard/whoIsWho/WhoIsWho.js", "modules/treeHandler/treeHandler.js"],
	WhoIsWhoChart: ["standard/whoIsWho/WhoIsWhoChart.js", "modules/drawTree/drawTree.js"],   		
	/*Compensation module */
	COM_Dashboard: ["standard/compensation/orgStatus.js", "standard/compensation/CompOrgUnits.js", "standard/compensation/budgets.js", "modules/balloon/balloon.js", "standard/compensation/reviewPeriods.js", "standard/personalDataChange/PDChange.js", "standard/personalDataChange/pendingRequestContent.js", "standard/compensation/dashboard.js", "standard/fieldsPanel/fieldsPanel.js"],
	BonusPayment:  [ "standard/compensation/infoPopUp2.js", "standard/compensation/widgetsOverview.js", "standard/personalDataChange/pendingRequestContent.js", "modules/excelTable/notes.js", "modules/excelTable/excelTable.js", "modules/orgSummary/orgSummary.js", "standard/compensation/compensationTab.js", "standard/compensation/bonusPayment.js"],
	SalaryReview:  [ "standard/compensation/infoPopUp2.js", "standard/compensation/widgetsOverview.js", "standard/personalDataChange/pendingRequestContent.js", "modules/excelTable/notes.js", "modules/excelTable/excelTable.js", "modules/orgSummary/orgSummary.js", "standard/compensation/compensationTab.js", "standard/compensation/salaryReview.js"],
	LTI: [ "standard/compensation/infoPopUp2.js", "standard/compensation/widgetsOverview.js", "standard/personalDataChange/pendingRequestContent.js", "modules/excelTable/notes.js", "modules/excelTable/excelTable.js", "modules/orgSummary/orgSummary.js", "standard/compensation/compensationTab.js", "standard/compensation/lti.js"],
    Comp_Reporting: ["standard/compensation/compReporting.js"],
    Compensation_Statement: ["standard/compensation/compStatement.js"],
    //Tax Form
    TaxForm: ["standard/taxForm/taxForm.js"],


	//SCM
	scm_myActivity		: ["modules/balloon/balloon.js", "modules/treeHandler/treeHandler.js", "standard/SCM/scm_ticketGrouping.js", "standard/SCM/scm_myPool.js", "standard/SCM/scm_myActivity.js", "standard/SCM/scm_poolTable.js"],
	scm_generalPool		: ["modules/balloon/balloon.js", "modules/treeHandler/treeHandler.js", "standard/SCM/scm_ticketGrouping.js", "standard/SCM/scm_myPool.js", "standard/SCM/scm_generalPool.js", "standard/SCM/scm_poolTable.js"],
	scm_myPool			: ["modules/balloon/balloon.js", "modules/treeHandler/treeHandler.js", "standard/SCM/scm_ticketGrouping.js", "standard/SCM/scm_myPool.js", "standard/SCM/scm_poolTable.js"],
	scm_opmPool			: ["modules/balloon/balloon.js", "modules/treeHandler/treeHandler.js", "standard/SCM/scm_ticketGrouping.js", "standard/SCM/scm_myPool.js", "standard/SCM/scm_opmPool.js", "standard/SCM/scm_poolTable.js"],
	scm_teamPool		: ["modules/balloon/balloon.js", "modules/treeHandler/treeHandler.js", "standard/SCM/scm_ticketGrouping.js", "standard/SCM/scm_myPool.js", "standard/SCM/scm_teamPool.js", "standard/SCM/scm_poolTable.js"],
	scm_createTicket	: ["modules/balloon/balloon.js", "modules/ckeditor/ckeditor.js", "standard/dm/uploadModule.js", "modules/treeHandler/treeHandler.js", "standard/SCM/scm_datePicker.js", "standard/SCM/scm_ticketGrouping.js", "standard/SCM/scm_createTicket.js", "standard/SCM/scm_ticketScreen.js", "standard/SCM/scm_popupScreens.js", "modules/groupedLayout/groupedLayout.js", "standard/SCM/scm_ticketDocuments.js", "standard/SCM/scm_selectionBox.js", "standard/SCM/scm_hrwTicketObject.js"],
	scm_editTicket		: ["modules/balloon/balloon.js", "modules/ckeditor/ckeditor.js", "standard/dm/uploadModule.js", "modules/treeHandler/treeHandler.js", "standard/SCM/scm_datePicker.js", "standard/SCM/scm_ticketAction.js", "standard/SCM/scm_ticketGrouping.js", "standard/SCM/scm_viewEditTicket.js", "standard/SCM/scm_editTicketNew.js", "standard/SCM/scm_ticketScreen.js", "standard/SCM/scm_ticketActions.js", "standard/SCM/scm_popupScreens.js", "modules/groupedLayout/groupedLayout.js", "standard/SCM/scm_ticketDocuments.js", "standard/SCM/scm_selectionBox.js", "standard/SCM/scm_hrwTicketObject.js", "standard/SCM/scm_mailAttachObject.js", "standard/SCM/scm_mailInputObject.js"],
	scm_ticketApp		: ["standard/SCM/scm_ticketAction.js", "standard/SCM/scm_ticketApp.js"],
	scm_ticketDocuments	: ["standard/dm/uploadModule.js", "modules/groupedLayout/groupedLayout.js", "standard/SCM/scm_datePicker.js", "standard/SCM/scm_ticketDocuments.js", "standard/SCM/scm_popupScreens.js", "standard/SCM/scm_selectionBox.js"],
	scm_viewTicket		: ["modules/balloon/balloon.js", "modules/ckeditor/ckeditor.js", "standard/dm/uploadModule.js", "modules/treeHandler/treeHandler.js", "standard/SCM/scm_datePicker.js", "standard/SCM/scm_ticketAction.js", "standard/SCM/scm_ticketGrouping.js", "standard/SCM/scm_viewEditTicket.js", "standard/SCM/scm_viewTicketNew.js", "standard/SCM/scm_ticketScreen.js", "standard/SCM/scm_ticketActions.js", "standard/SCM/scm_popupScreens.js"],
	scm_searchTicket	: ["modules/treeHandler/treeHandler.js", "standard/SCM/scm_ticketGrouping.js", "standard/SCM/scm_datePicker.js", "standard/SCM/scm_myPool.js", "standard/SCM/scm_searchTicket.js", "standard/SCM/scm_poolTable.js"],
	scm_employeeHistory	: ["modules/balloon/balloon.js", "modules/treeHandler/treeHandler.js", "standard/SCM/scm_ticketGrouping.js", "standard/SCM/scm_datePicker.js", "standard/SCM/scm_myPool.js", "standard/SCM/scm_employeeHistory.js", "standard/SCM/scm_poolTable.js"],
	scm_ticketTasks		: ["standard/SCM/scm_ticketTasks.js"],
	scm_agentPreferences: ["standard/SCM/scm_agentPreferences.js"],
	
	PM_processMonitoring: ["modules/viewSelector/viewSelector.js", "modules/dhtmlxgantt/dhtmlxcommon.js", "modules/dhtmlxgantt/dhtmlxgantt.js", "modules/balloon/balloon.js", "modules/linedTree/linedTree.js", "standard/processMng/pm_processMonitoringManager.js","standard/processMng/pm_processMonitoringInstanceView.js","standard/parentCalendar/parentCalendar.js","standard/calendar/calendar.js","standard/processMng/pm_menus.js", "standard/processMng/pm_processMonitoringTree.js", "standard/processMng/pm_processMonitoringList.js", "standard/processMng/pm_processMonitoringGantt.js", "standard/processMng/pm_processMonitoring.js", "standard/fastEntry/fastEntryMenu.js"],
	PM_processScheduling: ["modules/multiSelect/multiSelect.js", "modules/selectionScreenGenerator/selScreenGenerator.js", "modules/Wizard/Wizard.js", "standard/processMng/pm_processScheduling.js"],
	
	SM_DashBoard: ["modules/balloon/balloon.js", "modules/linedTree/linedTree.js", "standard/SCM_Main/scm_main_processes.js", "standard/SCM_Main/scm_main_dashboard.js"],

    /*Onboarding*/
    Onboarding : ["standard/Onboarding/Onboarding.js","modules/tablekit/tablekitWithSearch.js"],
    CARPOOL: ["standard/Onboarding/CarPool.js","modules/tablekit/tablekitWithSearch.js"],
    CARPAGE: ["standard/Onboarding/CarPage.js" ],
    Models: ["standard/Onboarding/Models.js","modules/tablekit/tablekitWithSearch.js"],
    modelPage: ["standard/Onboarding/PageModel.js"],
    PARAMEOB: ["standard/Onboarding/Parameters.js"],
    //TimeSchedule: ["standard/Onboarding/fastinit.js","standard/Onboarding/tablesort.js","standard/Onboarding/TimeSchedule.js" ],
    TimeSchedule: ["standard/Onboarding/tablesort.js","standard/Onboarding/TimeSchedule.js" ],
    PWS_ACTIONS: ["standard/Onboarding/TimeSchedulePage.js","modules/tablekit/tablekitWithSearch.js"],
    WSR_ACTIONS: ["standard/Onboarding/WorkSchedule.js"],
    //PDChange
    PDChange:            ["standard/personalDataChange/PDChange.js","standard/personalDataChange/pendingRequestContent.js"],
    QuotaManagement:     ["standard/personalDataChange/PDChange.js","standard/personalDataChange/pendingRequestContent.js","standard/personalDataChange/personalDataChange.js"],
    PayRelatedData:      ["standard/personalDataChange/PDChange.js","standard/personalDataChange/pendingRequestContent.js","standard/personalDataChange/personalDataChange.js"],
    PersonalDevelopment: ["standard/personalDataChange/PDChange.js","standard/personalDataChange/pendingRequestContent.js","standard/personalDataChange/personalDataChange.js"],
    CorporateData:       ["standard/personalDataChange/PDChange.js","standard/personalDataChange/pendingRequestContent.js","standard/personalDataChange/personalDataChange.js"],
    KPI_temp:            ["standard/personalDataChange/PDChange.js","standard/personalDataChange/pendingRequestContent.js","standard/personalDataChange/personalDataChange.js"],
    PersonalDetails:     ["standard/personalDataChange/PDChange.js","standard/personalDataChange/pendingRequestContent.js","standard/personalDataChange/personalDataChange.js"],
    Dependents: ["standard/personalDataChange/PDChange.js", "standard/benefits/dependents.js"],
    HealthPlanScreen2: ["standard/personalDataChange/PDChange.js", "standard/benefits/benefitsScreens.js"],
    SuppLifeScreen: ["standard/personalDataChange/PDChange.js", "standard/benefits/benefitsScreens.js"],
    BeneficiariesPanel: ["standard/personalDataChange/PDChange.js", "standard/benefits/benefitsScreens.js"],
    DependentsPanel: ["standard/personalDataChange/PDChange.js", "standard/benefits/benefitsScreens.js"],
    SendAndReviewPanel:  ["standard/personalDataChange/PDChange.js","standard/personalDataChange/pendingRequestContent.js" ,"standard/compensation/reviewAndSend.js"],
    ReviewAndSend:       ["standard/personalDataChange/PDChange.js","standard/personalDataChange/pendingRequestContent.js" ,"standard/compensation/reviewAndSend.js"],
    PosTimeEvent:        ["standard/personalDataChange/PDChange.js","standard/personalDataChange/pendingRequestContent.js" , "standard/posTimeInformation/posTimeInformation.js","modules/titledPanel/titledPanel.js","modules/timeScheduleVisualizer/TimeScheduleVisualizer.js"],
    TimeError: ["standard/posTimeInformation/timeError.js"],
    AdHocReporting: ["standard/adHocReporting/adHocReporting.js"],
	Dashboard:           ["standard/dashboard/Dashboard.js","modules/infoPopUp/infoPopUp.js","modules/semitransparentBuilder/semitransparentBuilder.js","modules/groupedLayout/groupedLayout.js"],
    Reporting:           ["standard/reporting/reporting.js","modules/balloon/balloon.js","modules/treeHandler/treeHandler.js" ,"modules/tablekit/tablekitWithSearch.js","modules/multiSelect/multiSelect.js","modules/progressBar/progressBar.js"],
    Enrollement: ["standard/benefits/mybenefits.js", "standard/personalDataChange/PDChange.js", "standard/personalDataChange/pendingRequestContent.js", "standard/personalDataChange/personalDataChange.js", "standard/benefits/dependents.js", "standard/benefits/enrollement.js", "standard/benefits/benefitsScreens.js"],
    BenefitStatement: ["standard/benefits/benefitStatement.js"],
	
    //DM
    MyDocuments: [ "modules/tablekit/tablekitWithSearch.js","standard/dm/coverflow.js","standard/dm/myDocuments.js"],
    MyDocuments_admin: [ "modules/tablekit/tablekitWithSearch.js","standard/dm/coverflow.js","standard/dm/myDocuments_admin.js"],
    SendDocumentHistory: [ "modules/tablekit/tablekitWithSearch.js","standard/dm/sendDocument_transaction.js","standard/dm/sendDocumentHistory.js"],
    SendDocumentHistory_admin: [ "modules/tablekit/tablekitWithSearch.js","standard/dm/sendDocument_transaction.js","standard/dm/sendDocumentHistory_admin.js"],
    LegalHolds: [ "modules/tablekit/tablekitWithSearch.js","standard/dm/legalHoldList.js"],
    //UploadModule: ["standard/dm/uploadModule.js"],
    CoversheetSD: ["standard/dm/sendDocument_transaction.js"],
    SendDocument: ["standard/dm/sendDocument_transaction.js","standard/dm/uploadModule.js","standard/dm/sendDocument.js"],
    SendDocument_admin: ["standard/dm/sendDocument_transaction.js","standard/dm/uploadModule.js","standard/dm/sendDocument_admin.js"],
    ExpiredDocuments: [ "modules/tablekit/tablekitWithSearch.js","standard/dm/expiredDocs.js"],
    // Canadian tax forms
    YCA_TAXF: ["countries/CA/ca_TaxForms.js", "modules/tablekit/tablekitWithSearch.js"]


});

CUSTOMER_FILES = $H();


/**
* @fileOverview global.js
*@description the global object keeps all the useful information
*for the applications and rest of the objects created by the EWS Framework
*/

/**
* @description global object variable
*/
var global;

/**
* @constructor
* @description class that describes the global object features and behavior
*/
var Global = Class.create(origin,
/**
* @lends Global
*/
	{
	usettingsJson: null,
	/**
	* @type Long
	* @description EWS Framework log off time in milliseconds
	*/
	logOffTime: 1800,
	validDateFormats:
	    ['DD.MM.YYYY',
	    'MM/DD/YYYY',
	    'MM-DD-YYYY',
	    'YYYY.MM.DD',
	    'YYYY/MM/DD',
	    'YYYY-MM-DD',
	    'YYYY/MM/DD'],
	nullDate: '0000-00-00',
	/**
	* boolean true if EWS should be reloaded and false in other way
	* @type boolena
	*/
	reloadEWS: false,

	GCdetailsOpened: $H(),
	/**
	* @type bool
	* @description to know in the getContent if a PAI service has been fired
	*/
	PAIfired: false,
	/**
	* @type string
	* @description user date display format
	*/
	dateFormat: 'dd.MM.yyyy',

	buttonsByAppid: $H(),

	validNumberFormats:
	    ['1.234.567,89',
	    '1,234,567.89',
	    '1 234 567,89'],
	/**
	* @type String
	* @description the hour format to use with datejs Date objects.
	*/
	hourFormat: "HH:mm",
	/**
	* @type string
	* @description user number display format
	*/
	numberFormat: '1.234.567,89',
	/**
	* Separator for thousands in number format
	* @type string
	*/
	thousandsSeparator: '.',
	/**
	* Separator for decimals in number format
	* @type String
	*/
	commaSeparator: ',',
	/**
	* @type string
	* @description user id separators
	*/
	idSeparators: '[]',
	/**
	* @type string
	* @description user id separator for the left
	*/
	idSeparatorLeft: '[',
	/**
	* @type string
	* @description user id separator for the right
	*/
	idSeparatorRight: ']',
	/**
	* @type Long
	* @description user maximum number of items shown on a table in the EWS Framework
	*/
	paginationLimit: 20,
	/**
	* @type Long
	* @description user maximum number of employees selected on the left menus
	*/
	maxSelectedEmployees: 10,
	/**
	* @type Long
	* @description user maximum number of employees shown on my Selections left menu
	*/
	maxEmployeesShown: 20,
	/**
	* @type Long
	* @description user calendars start day of week
	*/
	calendarsStartDay: 1,
	/**
	* @type boolean
	* @description whether to show the Ids in My Selections or not
	*/
	showId: null,
	/**
	* @type Boolean
	* @description user topMenu configuration; if should it be shown or not
	*/
	showTopMenu: true,
	/**
	* @type string
	* @description user language
	*/
	language: 'EN',
	/**
	* @type String
	* @description Difference in hours between local time and UTC
	*/
	timeDiffUTC: null,

	/**
	* @type String
	* @description Login used for HRW
	*/
	hrwLogin: null,
	/**
	* @type Boolean
	* @description Indicate if the log actions are to display
	*/
	activateHRWLog: null,
	/**
	* @type Hash
	* @description the list of translations
	*/
	translations: null,
	/**
	* @type Hash
	* @description a hash with the info about the different companies for the user.
	*/
	companies: null,
	/**
	* @type Hash
	* @description every instantiable application will be kept here
	*/
	applications: [],
	/**
	* @type String
	* @description ID of the current application being run
	*/
	currentApplication: null,
	/**
	* @type Hash
	* @description topMenu structure is kept in this global attribute
	*/
	navigationData: $H({
	    topMenu: $H({}),
	    mainMenu: $H({})
	}),
	/**
	* tabid - main areas relationships
	* @type Hash
	*/
	tabid_mnmid: $H({}),
	kmAuthModeEnabled: true,
	kmAuthSimulationEnabled: true,
	kmAuthStatus: "DRAFT",
	/**
	* Tabids - subareas relationships
	* @type Hash
	*/
	tabid_sbmid: $H({}),
	/**
	* Different left menus lists indexed by tabId
	* @type Hash
	*/
	leftMenusList: $H({}),
	/**
	* @type Hash
	*/
	populations: $H({}),
	/**
	* @type Hash
	* @description a Hash with another Hash for each one of the populations.
	* 				This second Hash will contain the selected employees.
	*/
	populationsSelected: $H({}),
	/**
	* @type Array
	* @description an Array containing all the applications that need a popUp before open the next one
	*/
	popUpBeforeClose: ['timeSheet'],
	/**
	* Whether the current selection type is single, multiple or none
	* @type String
	*/
	currentSelectionType: null,
	/**
	* @type Hash
	* @description user applications roles are kept in this global attribute
	*/
	sbmid_roles: $H({}),
	/**
	* @type Hash
	*/
	delegations: $H({}),
	/**
	* @type Hash
	* @description Framework labels
	*/
	labels: $H({}),
	/**
	* topMenu application object
	*/
	topMenu: null,
	/**
	* leftMenu application object
	*/
	leftMenu: null,
	/**
	* Maximum number of left menus.
	* @type Integer
	*/
	maxLeftMenusNumber: null,
	/**
	* @type Application
	* @description takeRoleOf application object
	*/
	takeRoleApplication: null,
	/**
	* @type Hash
	* @description store all the applications with tabId, appId and view
	*/
	tabid_applicationData: $H(),

	/**
	* Keeps the relationship between an application ID and it's parent tab
	*/
	appid_tabid: $H({}),

	/**
	* It keeps a count on how many times is a view being used (to know whether
	* to use child classes or not)
	*/

	viewsCount: $H(),

	/**
	* @type ServicesCache
	* @description here we keep all the already called services xmlJSON data
	*/
	servicesCache: new ServicesCache(),
	/**
	* 
	*/
	labelsCache: $H({}),
	/**
	* 
	*/
	hisMan: null,
	/**
	* A Hash with a black list, if the developer wants to avoid some applications, should add it here.
	* @type Hash
	*/
	blacklist: $H({
	    mnmid: [],
	    sbmid: [],
	    tbmid: [],
	    tpmid: [],
	    appid: [],
	    view: []
	}),

	/**
	* A Hash with the color list for each one of the employee IDs
	* @type Hash
	*/
	colors: null,

	/**
	* The HTML element containing the colors CSS classes
	* @type Element
	*/
	colorsStyle: null,

	/**
	* URL to redirect when logoff 
	*/
	redirectURL: null,
	showLoadingMsg: true,
	//Hash to keep track of currently pending AJAX calls
	pendingCalls: $H({}),

	// LEFT MENUS
	// ***********************************************************************************
	/**
	* An array of left menus which are always shown (hardcoded)
	* @type Array
	*/
	fixedLeftMenus: [],
	/**
	* Contains the menus that has to be loaded for each application.
	* @type Hash
	*/
	tabid_leftmenus: $H({}),
	/**
	* If one appId have a tabId associated is true, else false.
	* @type boolean
	*/
	hasTab: false,
	/**
	* Applications that will be loaded from the begining.
	* They have their id as value.
	* This data should be loaded from SAP, instead of hard coding it!
	*/
	INIT_APPS: $H({
	    LOGOFF: "LOGOFF"
	}),
	/**
	* All the applications valid for a user.
	* 
	*/
	allApps: $A(),

	/**
	* Hash containing the information about groups for each population.
	* The key for this hash is the populationId.
	* Each population will have this data:
	* - defaultGroup: the id for the default group in that population
	* - groups: hash containing the groups for that population.
	* The key for this hash is the groupId
	* For each group we will have the following data:
	* 	- id: id for the group
	*  - name: name of the group
	*  - members: a hash containing the ids of the members of the group.
	*  - loaded: boolean, useful to know if we have to call SAP for the data
	*  - isDefault: true if it's the default group  
	*/
	groups: $H(),

	/**
	*boolean to know if we have to highline the labels if they are missing
	*/
	redLabels: false,

	/**
	* Hash that stores for each object the views that should be reloaded 
	*/
	refreshObjects: $H(),
	initialize: function (usettingsJSON) {
	    if (!Object.isEmpty(usettingsJSON)) {
	        this.usettingsJson = usettingsJSON;
	    }

	    // Parse FWK labels
	    if (usettingsJSON.EWS.labels) {
	        this.parseLabels(usettingsJSON.EWS.labels, 'FWK');
	    }

	    if (usettingsJSON.EWS.o_population) {
	        this.totalEmployees = this.getPopPagination(usettingsJSON);
	    }

	    if (usettingsJSON.EWS.o_max_rec) {
	        this.maximumRecurrences = usettingsJSON.EWS.o_max_rec;
	    }
	    if (usettingsJSON.EWS.o_logoff) {
	        this.logOffTime = usettingsJSON.EWS.o_logoff;
	    }
	    if (usettingsJSON.EWS.o_99lan) {
	        this.userLanguage = usettingsJSON.EWS.o_99lan;
	    }
	    if (usettingsJSON.EWS.o_language) {
	        this.o_language = usettingsJSON.EWS.o_language;
	    }	    

	    //Detecting Language Settings to change application banner - Kevin
	    if (usettingsJSON.EWS.o_laiso) {
	        var o_laiso = usettingsJSON.EWS.o_laiso;
	        if (o_laiso == 'FR' && $("fwk_4")) {
	            $("fwk_4").addClassName('logo_scotia');
	        }
	    }

	    // Setting global attributes up
	    if (usettingsJSON.EWS.o_object) {
	        this.objectType = usettingsJSON.EWS.o_object['@otype'];
	    }
	    if (usettingsJSON.EWS.o_dmc) {
	        this.dmc = usettingsJSON.EWS.o_dmc;
	    }
	    // Get the object id
	    if (usettingsJSON.EWS.o_object) {
	        this.objectId = usettingsJSON.EWS.o_object['@objid'];
	    }
	    // get the object type
	    if (usettingsJSON.EWS.o_object) {
	        this.name = usettingsJSON.EWS.o_object["@name"];
	    }
	    // get the date format and convert it to make datejs compatible
	    if (usettingsJSON.EWS.o_date) {
	        this.dateFormat = (this.validDateFormats.indexOf(usettingsJSON.EWS.o_date)) ? usettingsJSON.EWS.o_date : this.validDateFormats[0];
	        this.dateFormat = this.dateFormat.gsub("DD", "dd").gsub("YYYY", "yyyy");
	    }
	    // get the number format and extract separators for comma and thousand
	    if (usettingsJSON.EWS.o_decimal) {
	        this.numberFormat = (this.validNumberFormats.indexOf(usettingsJSON.EWS.o_decimal)) ? usettingsJSON.EWS.o_decimal : this.validNumberFormats[0];
	        this.millionsSeparator = this.numberFormat.charAt(5);
	        this.thousandsSeparator = this.numberFormat.charAt(1);
	        this.commaSeparator = this.numberFormat.charAt(9);
	    }
	    // Get the id separators and split them
	    if (usettingsJSON.EWS.o_sepid) {
	        this.idSeparators = usettingsJSON.EWS.o_sepid;
	        this.idSeparatorLeft = this.idSeparators.charAt(0);
	        this.idSeparatorRight = this.idSeparators.charAt(1);
	    }
	    // Get the showId indicator (whether to show ids on left menus or not)
	    if (usettingsJSON.EWS.o_showid) {
	        this.showId = true;
	    } else {
	        this.showId = false;
	    }
	    // Get the pagination limit
	    if (usettingsJSON.EWS.o_pag) {
	        this.paginationLimit = usettingsJSON.EWS.o_pag;
	    }
	    // Get the default company
	    if (usettingsJSON.EWS.o_def_comp) {
	        this.defaultCompany = usettingsJSON.EWS.o_def_comp;
	    }
	    // Get the maximum number of selected employees
	    if (usettingsJSON.EWS.o_maxsel) {
	        this.maxSelectedEmployees = parseInt(usettingsJSON.EWS.o_maxsel, 10);
	    } else {
	        this.maxSelectedEmployees = 10;
	    }
	    // Get the maximum number of employees shown
	    if (usettingsJSON.EWS.o_sel) {
	        this.maxEmployeesShown = usettingsJSON.EWS.o_sel;
	    }
	    // Get the calendar start day (Monday or Sunday)
	    if (usettingsJSON.EWS.o_start) {
	        this.calendarsStartDay = usettingsJSON.EWS.o_start;
	    }
	    // Get whether to show the top menu or not
	    if (usettingsJSON.EWS.o_showtop) {
	        this.showTopMenu = usettingsJSON.EWS.o_showtop.toLowerCase() == 'x';
	    }
	    // Get the companies list
	    if (usettingsJSON.EWS.o_companies) {
	        this.setCompanies(usettingsJSON);
	    }
	    // Gets the delegations if they exists to show the takeRoleOf application
	    if (usettingsJSON.EWS.o_substitution) {
	        this.setDelegations(usettingsJSON);
	    }
	    // Get the translations
	    if (usettingsJSON.EWS.o_translations) {
	        this.setTranslations(usettingsJSON);
	    }

	    //Get the groups:
	    if (usettingsJSON.EWS.o_population) {
	        this.setGroups(usettingsJSON.EWS.o_population);
	    }
	    //Get the URL for redirecting after logoff
	    if (usettingsJSON.EWS.o_redirect_url) {
	        this.redirectURL = usettingsJSON.EWS.o_redirect_url
	    }
	    if (usettingsJSON.EWS.o_utcdiff) {
	        this.timeDiffUTC = {
	            time: usettingsJSON.EWS.o_utcdiff,
	            sign: (usettingsJSON.EWS.o_utcsign === '-') ? '-' : '+'
	        };
	    }

	    if (usettingsJSON.EWS.o_hrwlogin)
	        this.hrwLogin = usettingsJSON.EWS.o_hrwlogin;

	    this.activateHRWLog = false;

	    if (usettingsJSON.EWS.o_laiso)
	        this.language = usettingsJSON.EWS.o_laiso;
	    if (usettingsJSON.EWS.o_missing_labels)
	        if (usettingsJSON.EWS.o_missing_labels == 'Y')
	            this.redLabels = true;
	    if (usettingsJSON.EWS.o_sap_client)
	        this.client = usettingsJSON.EWS.o_sap_client;

	    if (usettingsJSON.EWS.o_maxonl)
	        this.maxOnline = parseInt(usettingsJSON.EWS.o_maxonl);
	    this.setPopulations(usettingsJSON);
	    this.setAppsNavigation(usettingsJSON);
	    this.setMenus(usettingsJSON);
	},

	/**
	* Check if the user has the edit rights for HRW
	*/
	hasHRWEditRole: function () {
	    if (this.groups.get('SCM_AG')) return true;
	    if (this.groups.get('SCM_TE')) return true;
	    if (this.groups.get('SCM_OE')) return true;
	    return false;
	},

	getPopPagination: function (usettingsJSON) {
	    var auxHash = $H();
	    var populations = objectToArray(usettingsJSON.EWS.o_population.yglui_str_population);
	    for (var i = 0; i < populations.length; i++) {
	        if (populations[i]['@population_pag'] == 'X') {
	            auxHash.set(populations[i]['@population_id'], populations[i]['@population_rec']);
	        }
	    }
	    return auxHash;
	},

	/**
	* sets the delegations from GET_USETTINGS
	* @param usettingsJSON {JSON} User settings JSON object
	*/
	setDelegations: function (usettingsJSON) {
	    objectToArray(usettingsJSON.EWS.o_substitution.yglui_str_delegated).each(function (delegation) {
	        this.delegations.set(delegation["@pernr"], {
	            begDate: delegation["@begda"],
	            endDate: delegation["@endda"],
	            employeeName: delegation["@ename"],
	            userName: delegation["@uname"],
	            active: delegation["@active"].toLowerCase() == "x",
	            reppr: delegation["@reppr"],
	            rtext: delegation["@rtext"]
	        });
	    } .bind(this));
	},
	/**
	* Set the list of companies for this user (if any)
	* @param usettingsJSON (JSON) User settings JSON object
	*/
	setCompanies: function (usettingsJSON) {
	    this.companies = $H({});
	    objectToArray(usettingsJSON.EWS.o_companies.yglui_str_company).each(function (company) {
	        var companyID = company["@yygcc"] + company["@yylcc"];
	        var companyName = company["@yylcct"] ? company["@yylcct"] : company["@yylcc"];

	        this.companies.set(companyID, {
	            gcc: company["@yygcc"],
	            lcc: company["@yylcc"],
	            name: companyName
	        });
	    } .bind(this));
	},
	/**
	* Parses the labels and stores it on the labelsCache
	* @param labels Labels node
	* @param area Labels scope
	*/
	parseLabels: function (labels, area) {
	    labels = objectToArray(labels.item);
	    this.labelsCache.set(area, $H());
	    var labelsSize = labels.size();
	    for (var i = 0; i < labelsSize; i++) {
	        this.labels.set(labels[i]['@id'], labels[i]['@value']);
	    }
	},
	/**
	* @description merges (recursively in every hash level) 
	* two given hashes returning the result
	* @param mhash1 {Hash} first hash to be merged
	* @param mhash2 {Hash} second hash to be merged
	* @return the merged version of the hashes given as argument
	*/
	recursiveMerge: function (mhash1, mhash2) {
	    var itHasHashInside = false;
	    var hashes = $H({});
	    var ret = mhash1.clone();
	    mhash1.each(function (field) {
	        if (Object.isHash(field.value) && mhash2.get(field.key)) {
	            hashes.set(field.key, this.recursiveMerge(mhash1.get(field.key), mhash2.get(field.key)));
	            itHasHashInside = true;
	        }
	    } .bind(this));
	    if (itHasHashInside) {
	        hashes.each(function (field) {
	            ret.set(field.key, field.value);
	        });
	        return ret;
	    }
	    else {
	        return mhash1.merge(mhash2);
	    }
	},
	/**
	* Sets the proper topMenu configuration hash handling the data
	* got from SAP
	* @param {JSON} xmlJson User settings JSON object
	*/
	setAppsNavigation: function (xmlJson) {
	    var aux = $H({
	        navigation: null,
	        top: null
	    });
	    objectToArray(xmlJson.EWS.o_get_menu.yglui_str_get_appl).each(function (app) {

	        //ignore the application if it's in the black list
	        if (this.blacklist.get("mnmid").include(app["@mnmid"]) ||
	    			this.blacklist.get("sbmid").include(app["@sbmid"]) ||
	    			this.blacklist.get("appid").include(app["@appid"]) ||
	    			this.blacklist.get("tbmid").include(app["@tbmid"]) ||
	    			this.blacklist.get("tpmid").include(app["@tpmid"]) ||
	    			this.blacklist.get("view").include(app["@views"])) {

	            return;
	        }
	        this.allApps.push(app['@appid']);
	        //Add only applications coming with a view
	        if (!Object.isEmpty(app['@views'])) {

	            //increase in 1 the number of uses of this view.
	            if (!this.viewsCount.get(app["@views"])) {
	                this.viewsCount.set(app["@views"], 1);
	            } else {
	                this.viewsCount.set(app["@views"], this.viewsCount.get(app["@views"]) + 1);
	            }

	            var applicationData = {
	                tpmid: app["@tpmid"],
	                mnmid: app["@mnmid"],
	                sbmid: app["@sbmid"],
	                appId: app['@appid'],
	                view: app['@views'],
	                tabId: app["@tbmid"],
	                "default": app['@viewd'] ? true : false,
	                loaded: false,
	                population: $H()
	            };

	            //Set this application area and subarea
	            this.setAreaAndSubarea(applicationData);
	            //fills in the population for the application.
	            this.fillPopulationForApp(applicationData);

	            //fill in the appid-tabid table
	            if (!this.appid_tabid.get(applicationData.appId)) {
	                this.appid_tabid.set(applicationData.appId, applicationData.tabId);
	            }

	            //If the tab is not added yet, it's added
	            if (Object.isEmpty(this.tabid_applicationData.get(app["@tbmid"]))) {

	                this.tabid_applicationData.set(app["@tbmid"], {
	                    "applications": $A([applicationData])
	                });
	            }
	            //when the tab added already
	            else {
	                //it's enqueued
	                if (Object.isEmpty(app['@viewd'])) {
	                    this.tabid_applicationData.get(app['@tbmid']).applications.push(applicationData);
	                    //or set as the first one if it's the default application for the tab
	                } else {
	                    this.tabid_applicationData.get(app['@tbmid']).applications.unshift(applicationData);
	                }
	            }
	        }
	        // Main menu applications
	        // they have mnmid and not tpmid
	        if (Object.isEmpty(app["@tpmid"]) && app["@mnmid"] && this.tabid_applicationData.get(app["@tbmid"])) {
	            // Set this application as the default one
	            if (app['@dfmid'] && app['@dfmid'].toLowerCase() == 'x') {
	                this.firstApp = this.tabid_applicationData.get(app['@tbmid']).applications[0];
	            }

	            // Set the tab label and the correspondent appId
	            var tabHash = $H({
	                name: this.getLabel(app['@tbmid']),
	                appId: this.tabid_applicationData.get(app['@tbmid']).applications[0].appId
	            });
	            var subHash = $H({});
	            // Se the submenu label
	            subHash.set(app['@sbmid'], $H({
	                name: this.getLabel(app['@sbmid']),
	                tabs: $H({})
	            }));
	            // And set the data for each one of the tabs in the submenu
	            subHash.get(app['@sbmid']).get('tabs').set(app['@tbmid'], tabHash);
	            var hash = $H({});
	            hash.set(app['@mnmid'], $H({
	                name: this.getLabel(app['@mnmid']),
	                subMenu: $H({})
	            }));
	            // Put the submenu in the main menu hash
	            hash.get(app['@mnmid']).set('subMenu', subHash);
	            if (!aux.get('navigation')) {
	                aux.set('navigation', hash);
	            } else {
	                aux.set('navigation', this.recursiveMerge(aux.get('navigation'), hash));
	            }
	        }
	        //if it's a top menu application with tabs (like the inbox or delegations)
	        else if (app['@tpmid'] && app['@tbmid'] && this.tabid_applicationData.get(app["@tbmid"])) {
	            // set as the default application if it's the case.
	            if (app['@dfmid'] && app['@dfmid'].toLowerCase() == 'x') {
	                this.firstApp = this.tabid_applicationData.get(app['@tbmid']).applications[0];
	            }
	            // Set the tab properties for this application
	            var topTabHash = $H({
	                name: this.getLabel(app['@tbmid']),
	                appId: this.tabid_applicationData.get(app['@tbmid']).applications[0].appId
	            });
	            // Set the top menu hash for this application (including tabs)
	            var topSubHash = $H({});
	            topSubHash.set(app['@tpmid'], $H({
	                name: this.getLabel(app['@tpmid']),
	                tabs: $H({})
	            }));
	            topSubHash.get(app['@tpmid']).get('tabs').set(app['@tbmid'], topTabHash);
	            // set this Hash inside the appNavigation's top menu section
	            var topHash = $H({
	                topMenu: $H({})
	            });
	            topHash.set('topMenu', topSubHash);
	            if (!aux.get('top')) {
	                aux.set('top', topHash);
	            }
	            else {
	                aux.set('top', this.recursiveMerge(aux.get('top'), topHash));
	            }

	        }
	    } .bind(this));
	    this.navigationData.set('mainMenu', aux.get('navigation'));
	    if (aux.get("top")) {
	        this.navigationData.set('topMenu', aux.get('top').get('topMenu'));
	    }
	},
	/**
	* It fills the application data with its own copy of the employee selection
	* so it can handle the delta with other applications
	* @param {JSON} applicationData the application's data coming from SAP
	*/
	fillPopulationForApp: function (applicationData) {
	    if (this.getPopulationName(applicationData.tabId)) {
	        var populationName = this.getPopulationName(applicationData.tabId);
	        this.populations.get(populationName).each(function (employee) {
	            applicationData.population.set(employee.key, {
	                multiSelected: false,
	                singleSelected: false
	            });
	        });
	    }
	},
	/**
	* Sets an application area and subarea
	* @param {JSON} app is the application data as coming from GET_USETTINGS
	*/
	setAreaAndSubarea: function (app) {
	    var mainArea;
	    var subArea;
	    if (!app.mnmid) {
	        mainArea = "FWK";
	        subArea = "FWK";
	    } else {
	        mainArea = app.mnmid;
	        subArea = app.sbmid;
	    }
	    //add to the application sub area list
	    this.tabid_sbmid.set(app.tabId, subArea);
	    //add to the application main area list
	    this.tabid_mnmid.set(app.tabId, mainArea);
	},
	/**
	* Gets all the data for an application depending on its tabId
	* @param {String} tabId The desired application tabId
	* @returns an structure with the application's data
	*/
	getApplicationByTabId: function (tabId) {
	    var applications = this.tabid_applicationData.get(tabId).applications;
	    return applications;
	},
	/**
	* Gets all the data for an application depending on its appId
	* @param {String} appId The desired application appId
	* @returns an structure with the application's data
	*/
	getApplicationByAppId: function (appId) {
	    var applications = this.getApplicationByTabId(this.getTabIdByAppId(appId));
	    return applications.find(function (app) {
	        return app.appId == appId;
	    });

	},
	/**
	* Sets the proper left menus configuration hash handling the data
	* got from SAP
	* @param {JSON} xmlJSON User settings JSON object
	*/
	setMenus: function (xmlJSON) {
	    objectToArray(xmlJSON.EWS.o_leftm.yglui_str_wid_attributes).each(function (menu) {
	        this.leftMenusList.set(menu['@appid'], $H({
	            collapsed: menu['@collapsed'],
	            color: menu['@color'],
	            parentId: menu['@parentid'],
	            type: menu['@type'],
	            widColumn: menu['@widcolumn'],
	            widRow: menu['@widrow']
	        }));
	    } .bind(this));
	    this.maxLeftMenusNumber = this.leftMenusList.size();

	    // set the application - left menu map according to info from SAP
	    if (xmlJSON.EWS.o_mapping) {
	        // Loop the left menus data.
	        objectToArray(xmlJSON.EWS.o_mapping.yglui_str_left_menu).each(function (menu) {
	            if (!this.tabid_applicationData.get(menu["@tbmid"])) {
	                return;
	            }
	            var applicationSAPId = menu["@tbmid"];
	            var leftMenuSAPId = menu["@leftmid"];
	            // Get the web applications list for this tab.
	            var webApplications = this.tabid_applicationData.get(applicationSAPId).applications;
	            if (webApplications) {
	                webApplications.each(function (webApplication) {
	                    // Create the key if it doesn't exists
	                    if (!this.tabid_leftmenus.get(webApplication.tabId)) {
	                        this.tabid_leftmenus.set(webApplication.tabId, $H({}));
	                    }
	                    // Add the left menu to the web application
	                    if (!this.tabid_leftmenus.get(webApplication.tabId).get(leftMenuSAPId)) {
	                        if (menu["@type"]) {
	                            this.tabid_leftmenus.get(webApplication.tabId).set(leftMenuSAPId, {
	                                "menuType": menu["@type"],
	                                "advancedSearchId": menu["@sadv_id"],
	                                "rolid": menu["@rolid"]
	                            });
	                        } else {
	                            this.tabid_leftmenus.get(webApplication.tabId).set(leftMenuSAPId, true);
	                        }

	                    }
	                } .bind(this));
	            }
	        } .bind(this));
	    }
	},
	/**
	* Creates the structures needed to populate the different roles' populations
	* @param {JSON} xmlJSON the data coming from GET_USETTING service.
	*/
	setPopulations: function (xmlJSON) {
	    this.sbmid_roles = $H();
	    this.colors = $H();
	    // Get which roles does each application have and it's name.
	    if (xmlJSON.EWS.o_population) {
	        objectToArray(xmlJSON.EWS.o_role_sub.yglui_str_role_sub).each(function (role) {
	            // return since there's no populations assigned to this role.
	            if ("@menus" in role) {
	                return;
	            }
	            var roleID = role["@rolid"];

	            objectToArray(role.menus.yglui_str_submid).each(function (submenu) {
	                var submenuID = submenu["@sbmid"];
	                // if the role for this submenuID is not created, create it and populate the initial
	                // roleName and the first component role
	                if (!this.sbmid_roles.get(submenuID)) {
	                    this.sbmid_roles.set(submenuID, {
	                        roleName: roleID,
	                        roleComponents: [roleID]
	                    });
	                }
	                // if already created ad a new role to both names and components.
	                else {
	                    var actualRoles = this.sbmid_roles.get(submenuID);
	                    actualRoles.roleName += "_" + roleID;
	                    actualRoles.roleComponents.push(roleID);
	                }
	            } .bind(this));
	        } .bind(this));
	    }

	    this.populations = $H({
	        "NOPOP": $H()
	    });

	    this.populations.get("NOPOP").set(this.objectId, {
	        type: this.objectType,
	        name: this.name,
	        singleSelected: true,
	        singleElement: null,
	        singleColor: 0,
	        multiSelected: true,
	        multiElement: null,
	        multiColor: 0,
	        actual: true
	    });

	    // don't continue as there's no populations generated for this user
	    if (xmlJSON.EWS.o_population) {
	        // populate the populations previously created
	        objectToArray(xmlJSON.EWS.o_population.yglui_str_population).each(function (population) {
	            var populationID = population["@population_id"];

	            // for each population look if it appears in one of the roles, if it does, add it's employees
	            // to the role
	            this.sbmid_roles.each(function (role) {
	                if (role.value.roleComponents.indexOf(populationID) != -1) {
	                    if (!this.populations.get(role.value.roleName)) {
	                        var employees = $H();
	                        employees.set(this.objectId, {
	                            type: this.objectType,
	                            name: this.name,
	                            singleSelected: false,
	                            singleElement: null,
	                            singleColor: 0,
	                            multiSelected: false,
	                            multiElement: null,
	                            multiColor: 0,
	                            actual: true
	                        });

	                        this.populations.set(role.value.roleName, employees);
	                    }

	                    if ("@population" in population) return;
	                    objectToArray(population.population_all.yglui_str_popul_obj).each(function (employee) {
	                        var employeeID = employee["@objid"];
	                        // Store the employee in the population using the employee ID as key.
	                        if (!this.populations.get(role.value.roleName).get(employeeID)) {
	                            this.populations.get(role.value.roleName).set(employeeID, {
	                                type: employee["@otype"],
	                                name: employee["@name"],
	                                singleSelected: false,
	                                singleElement: null,
	                                singleColor: 0,
	                                multiSelected: false,
	                                multiElement: null,
	                                multiColor: 0
	                            });
	                        }

	                        // add the employee ID to the colors list to be generated on setAvailableColorList method
	                        if (!this.colors.get(employeeID) != -1) {
	                            this.colors.set(employeeID, -1);
	                        }
	                    } .bind(this));
	                }
	            } .bind(this));
	        } .bind(this));
	    }

	    //add the current employee so it's color is generated
	    if (!this.colors.get(this.objectId) != -1) {
	        this.colors.set(this.objectId, -1);
	    }

	    // Set the proper colors according to the user list.
	    this.setAvailableColorsList();
	},
	/**
	* It generates a hash which uses pernr as key and the color as value.
	* 
	*/
	setAvailableColorsList: function () {
	    var style = new Element("style", {
	        type: "text/css"
	    });
	    // add the style tag into the web head tag
	    $$("head")[0].insert(style);
	    this.colorsStyle = style;
	    // add a color for each one of the actual employees on the populations.
	    //this.colors.each(this.addColor.bind(this));
	    this.addColor();
	},
	/**
	* Adds a new color for the given employee and with the given index so it remains with the format whatever_eeColorXX
	* @param {Object} employee can be either a pernr or a Hash position (used when iteratin using Enumerable#each )
	* @param {Integer} index can be either a number or null. When null it's automatically calculated.
	* @return {String} The class name given to this employee.
	*/
	addColor: function (employee) {

	    if (Object.isEmpty(employee)) {
	        var array = this.colors.keys();
	    }
	    else {
	        var array = $A();
	        array.push(employee);
	    }
	    for (var i = 0; i < array.length; i++) {
	        var employeeId;

	        if (!Object.isEmpty(employee)) {
	            index = this.colors.size() + 1;
	        } else {
	            index = i + 1;
	        }
	        employeeId = array[i];

	        // Create the CSS class names and initial content
	        var employeeBackgroundClass = ".application_back_eeColor" + (index.toPaddedString(2)) + "{ color: #fff; background-color: ";
	        var employeeTextClass = ".application_color_eeColor" + (index.toPaddedString(2)) + "{ color: ";
	        var employeeBorderClass = ".application_border_color_eeColor" + (index.toPaddedString(2)) + "{ border-color: ";
	        var employeeWidgetBorderClass = ".application_border_widget_eeColor" + (index.toPaddedString(2)) + "{ border-left: ";
	        var employeeWidgetBottomBorderClass = ".application_border_widget_bottom_eeColor" + (index.toPaddedString(2)) + "{ border-bottom: 1px solid";
	        var employeeClass = ".eeColor" + (index.toPaddedString(2)) + "{ color: white; background-color: ";

	        // Generate the colors
	        var color1 = (Math.random() * 255).round();
	        var color2 = (Math.random() * 255).round();
	        var color3 = (Math.random() * 255).round();

	        if (color1 == color2 && color1 == color3) {
	            color2 = (Math.random() * 255).round();
	            color3 = (Math.random() * 255).round();
	        }

	        // mix the color with something a bit darker to avoid having too soft colors.
	        color1 = ((color1 + 150) / 2).round();
	        color2 = ((color2 + 150) / 2).round();
	        color3 = ((color3 + 150) / 2).round();

	        // Insert them properly on CSS classes
	        var hexColor = [color1, color2, color3].invoke('toColorPart').join('');
	        hexColor = "#" + hexColor;
	        employeeBackgroundClass += hexColor + "; } ";
	        employeeTextClass += hexColor + "; } ";
	        employeeBorderClass += hexColor + "; } ";
	        employeeWidgetBorderClass += "1px solid " + hexColor + "border-right: 1px solid " + hexColor + ";} ";
	        employeeWidgetBottomBorderClass += hexColor + "; } ";
	        employeeClass += hexColor + "; } ";

	        var cssText = employeeBackgroundClass + employeeTextClass + employeeBorderClass + employeeWidgetBorderClass + employeeWidgetBottomBorderClass + employeeClass;

	        // Put CSS classes on the style tag according to the browser
	        if (!Prototype.Browser.IE) {
	            this.colorsStyle.insert(cssText);
	        } else {
	            this.colorsStyle.styleSheet.cssText += cssText;
	        }

	        this.colors.set(employeeId, index);
	        if (!Object.isEmpty(employee)) {
	            // return the CSS class number used for this employee.
	            return this.colors.get(employeeId);
	        }
	    }
	},
	/**
	* Gets the color class assigned to an employee.
	* @param {String} employeeID
	* @return {JSON} a JSON object with to attributes: <ul><li>background: class name for the background color</li>
	* <li>text: class name for the text color</li></ul>
	*/
	getColor: function (employeeId) {
	    var colors = this.colors.get(employeeId);
	    if (!colors) {
	        colors = this.addColor(employeeId);
	    }
	    return colors;
	},
	/**
	* @description DEPRECATED
	* @param labelId {string} label id to be returned
	*/
	getLabel: function (labelId) {
	    if (this.redLabels)
	        return (this.labels.get(labelId)) ? this.labels.get(labelId) : "<span class='frameworkMissingLabel'>" + labelId + "</span>";
	    else
	        return (this.labels.get(labelId)) ? this.labels.get(labelId) : labelId;
	},

	/**
	* Adds an employee to the current application's populations
	* @param {String} name the employee name
	* @param {String} employeeId the employee id
	*/
	addEmployee: function (name, employeeId, type, pagination, roleId) {
	    if (Object.isEmpty(roleId)) {
	        var sbmid = this.currentApplication.sbmid;
	        role = this.sbmid_roles.get(sbmid);
	    }
	    else {
	        role = {
	            'roleName': roleId,
	            'roleComponents': [roleId]
	        };
	    }
	    if (role) {
	        //if the application has a role
	        var roleName = role.roleName;
	        var roleComponents = role.roleComponents;
	        //look into all the roles
	        this.sbmid_roles.each(function (roleElement) {
	            roleComponents.each(function (roleComponentName) {
	                //for a role with similar components
	                if (roleElement.value.roleComponents.include(roleComponentName)) {
	                    //and include the employee inside this role if it doesn't exists yet
	                    if (!this.populations.get(roleElement.value.roleName).get(employeeId)) {
	                        this.populations.get(roleElement.value.roleName).set(employeeId, {
	                            actual: false,
	                            multiSelected: false,
	                            singleSelected: false,
	                            name: name,
	                            type: type
	                        });
	                    }
	                }
	            } .bind(this));
	        } .bind(this));
	        //Launching an event when an employee is added
	        if (this.sbmid_roles.get(this.currentApplication.sbmid).roleName == roleId)
	            document.fire("EWS:addEmployee", { 'employeeID': employeeId, 'pagination': pagination });
	    } else {
	        return;
	    }
	},
	/**
	* Sets an employee as selected in the current application's population
	* @param {String} employee The employee ID
	* @param {boolean} selected true to select the employee, false to unselect
	* @param {boolean} fire used to avoid firing the event and making 
	*/
	setEmployeeSelected: function (employeeID, selected, fire) {
	    // don't double select the employee, exit the method if it's already selected

	    if (selected && this.employeeIsSelected(employeeID) || !selected && !this.employeeIsSelected(employeeID)) {
	        document.fire("EWS:employeeMenuSync", {
	            employeeId: employeeID,
	            selected: selected,
	            name: this.getEmployee(employeeID).name
	        });
	        return;
	    }

	    // get the current population name
	    if (!Object.isEmpty(this.currentSubApplication)) {
	        var populationName = this.getPopulationName(this.currentSubApplication.tabId);
	    }
	    else {
	        var populationName = this.getPopulationName(this.currentApplication.tabId);
	    }
	    // get the current population and the selection type
	    var population = this.populations.get(populationName);
	    var selection = this.currentSelectionType;

	    //take care of the selections when it's working on single selectino mode.
	    if (selection == "single" && selected) {
	        population.keys().each(function (employee) {
	            if (this.employeeIsSelected(employee)) {
	                this.setEmployeeSelected(employee, false);
	            }
	        } .bind(this));
	    }

	    var employee = population.get(employeeID);
	    if (employee) {
	        employee[selection + "Selected"] = selected;
	    }
	    document.fire("EWS:employeeMenuSync", {
	        employeeId: employeeID,
	        selected: selected,
	        name: this.getEmployee(employeeID).name
	    });

	    //Notify the application about the employee selection
	    var className = this.currentApplication.className;
	    window[className + "_instance"].afterRun();

	    if (this.currentSubApplication && window[this.currentSubApplication.className + "_instance"].running) {
	        var subApplicationClassName = this.currentSubApplication.className;
	        window[subApplicationClassName + "_instance"].afterRun();
	    }
	},
	/**
	* Get the name for the current population
	* @param {String} application The application whose population wants to be known
	* @return {String} The population name
	*/
	getPopulationName: function (application) {
	    var submenu = this.tabid_sbmid.get(application);
	    if (!submenu) {
	        var appId = this.appid_tabid.get(application);
	        submenu = this.tabid_sbmid.get(appId);
	    }
	    if (!submenu || !this.sbmid_roles.get(submenu)) {
	        submenu = this.tabid_sbmid.get(this.currentSubApplication);
	        if (!submenu) {
	            return "NOPOP";
	        }
	    }
	    var populationName = this.sbmid_roles.get(submenu).roleName;
	    if (!populationName) {
	        populationName = "NOPOP";
	    }
	    return populationName;
	},
	/**
	* Test whether an employee is selected or not in the current Application.
	* @param {String} employee The employee id
	*/
	employeeIsSelected: function (employee) {
	    if (!Object.isEmpty(this.currentSubApplication)) {
	        var populationName = this.getPopulationName(this.currentSubApplication.tabId);
	    }
	    else {
	        var populationName = this.getPopulationName(this.currentApplication.tabId);
	    }
	    if (!populationName) return false;
	    var isSelected = false;
	    var employeeData = this.populations.get(populationName).get(employee);
	    if (!employeeData) {
	        isSelected = false;
	    } else {
	        isSelected = employeeData[this.currentSelectionType + "Selected"];
	    }
	    return isSelected;
	},

	/**
	* Returns the selected employees, in an array.
	* It will return null if any problem occurs
	*/
	getSelectedEmployees: function () {
	    if (Object.isEmpty(this.currentApplication)) {
	        return null;
	    }
	    if (!Object.isEmpty(this.currentSubApplication)) {
	        var populationName = this.getPopulationName(this.currentSubApplication.tabId);
	    }
	    else {
	        var populationName = this.getPopulationName(this.currentApplication.tabId);
	    }
	    if (!populationName) {
	        return null;
	    }
	    var population = this.populations.get(populationName);
	    if (Object.isEmpty(population)) {
	        return null;
	    }
	    var populationKeys = population.keys();
	    var result = $A();
	    for (var i = 0; i < populationKeys.size(); i++) {
	        if (this.employeeIsSelected(populationKeys[i])) {
	            result.push(populationKeys[i]);
	        }
	    }
	    return result;
	},

	/**
	* Returns the data of an employee in the present population (null, if it isn't in the selection)
	* @param {Object} employeeID The Id of the employee
	*/
	getEmployee: function (employeeID) {
	    if (Object.isEmpty(employeeID) || Object.isEmpty(this.currentApplication)) {
	        return null;
	    }
	    if (!Object.isEmpty(this.currentSubApplication)) {
	        var populationName = this.getPopulationName(this.currentSubApplication.tabId);
	    }
	    else {
	        var populationName = this.getPopulationName(this.currentApplication.tabId);
	    }
	    if (!populationName) {
	        return null;
	    }
	    var population = this.populations.get(populationName);
	    return population.get(employeeID);
	},

	/**
	* Function to handle the open application and so keep a log of the current application being run
	* and also the current selected population's suffix
	*/
	open: function (args) {

	    if (args && !args.get) {
	        args = $H(args);
	    }

	    var appId;
	    var tabId;
	    var view;
	    var mode;
	    this.leftMenuShowed = true;

	    //Get the application data stored on global
	    var app;
	    //not arguments given it will open the default application
	    if (!args) {
	        appId = this.firstApp.appId;
	        tabId = this.firstApp.tabId;
	        view = this.firstApp.view;
	        //set mode to normal
	        mode = null;
	        app = this.firstApp;
	    }
	    else {
	        //get the data to get the application its storage on global
	        appId = args.get("app").appId;
	        tabId = args.get("app").tabId;
	        view = args.get("app").view;
	        if (appId.toLowerCase() == 'logoff')
	            tabId = 'popUp';
	        if (!Object.isEmpty(tabId)) {
	            //check if the app is opened in popup mode
	            if (tabId.toLowerCase() == 'popup')
	                mode = 'popUp';
	            //check if the app is opened in subapp mode
	            if (tabId.toLowerCase() == 'subapp')
	                mode = 'sub';
	        }
	        if (mode) {
	            var population;
	            var position = args.get('position');
	            var hasTabId = this.getTabIdByAppId(appId);
	            //If the application use noRefreshLeftMenu, means that the mydetails menu, and myselection will not be updated.
	            if (!Object.isEmpty(args.get('req_ta')) || !Object.isEmpty(args.get('noRefreshLeftMenu')))
	                if (args.get('req_ta') == 'C' || args.get('noRefreshLeftMenu') == true)
	                    this.leftMenuShowed = false;
	            if (!this.hasTab) {
	                if (mode != 'popUp') {
	                    var populationName = this.getPopulationName(hasTabId);
	                    population = this.populations.get(populationName);
	                }
	                var applicationData = {
	                    tpmid: this.currentApplication.tpmid,
	                    mnmid: this.currentApplication.mnmid,
	                    sbmid: this.currentApplication.sbmnid,
	                    appId: appId,
	                    view: view,
	                    tabId: tabId,
	                    "default": true,
	                    loaded: false,
	                    population: population,
	                    position: position,
	                    mode: mode,
	                    refreshLeftMenu: this.leftMenuShowed
	                };
	                this.allApps.push(applicationData.appId);
	                //add view at the table is neccesary
	                if (!this.viewsCount.get(view)) {
	                    this.viewsCount.set(view, 1);
	                } else {
	                    this.viewsCount.set(view, this.viewsCount.get(view) + 1);
	                }
	                //fill in the appid-tabid table
	                if (!this.appid_tabid.get(applicationData.appId)) {
	                    this.appid_tabid.set(applicationData.appId, applicationData.tabId);
	                }
	                //If the tab is not added yet, it's added
	                if (!this.tabid_applicationData.get(tabId)) {
	                    this.tabid_applicationData.set(tabId, {
	                        "applications": $A([applicationData])
	                    });
	                }
	                //when the tab added already
	                else {
	                    //it's enqueued
	                    this.tabid_applicationData.get(tabId).applications.push(applicationData);
	                }
	                app = this.tabid_applicationData.get(tabId).applications.find(function (application) {
	                    return application.appId == appId;
	                } .bind(this));
	            }
	            else {
	                app = this.tabid_applicationData.get(hasTabId).applications.find(function (application) {
	                    return application.appId == appId;
	                } .bind(this));
	                app.mode = mode;
	                app.position = position;
	            }
	        }
	        else {
	            //if the application is stored under popup or subapp tab we delete and put it under the "real" tab
	            if (this.tabid_applicationData.get('POPUP')) {
	                var popupsApplications = this.tabid_applicationData.get('POPUP').applications;
	                this.tabid_applicationData.get('POPUP').applications = popupsApplications.reject(function (popApp) {
	                    if (popApp.appId == appId) {
	                        this.appid_tabid.set(appId, tabId);
	                        popApp.tabId = tabId;
	                        popApp.mode = null;
	                        if (!this.tabid_applicationData.get(tabId)) {
	                            this.tabid_applicationData.set(tabId, {
	                                "applications": $A([popApp])
	                            });
	                        }
	                        else {
	                            this.tabid_applicationData.get(tabId.toUpperCase()).applications.push(popApp);
	                        }
	                        return true;
	                    }
	                } .bind(this));
	                if (this.tabid_applicationData.get('POPUP').applications.length == 0) {
	                    delete (this.tabid_applicationData._object.POPUP);
	                }
	            }
	            //get according to appId
	            if (appId && !tabId) {
	                tabId = this.getTabIdByAppId(appId);
	            }
	            //get according to tabId
	            var addAppToTable = true;
	            // TODO mira si puedes usar el metodo fillPopulationForApp para esto, por que hace lo mismo.

	            for (var i = 0; i < this.tabid_applicationData.get(tabId.toUpperCase()).applications.length && addAppToTable; i++) {
	                if (this.tabid_applicationData.get(tabId.toUpperCase()).applications[i].appId == appId.toUpperCase()) {
	                    app = this.tabid_applicationData.get(tabId.toUpperCase()).applications[i];
	                    app.mode = mode;
	                    app.position = position;
	                    addAppToTable = false;
	                }
	            }
	        }

	        //check if the application is added to the table, if not, we add it
	        if (addAppToTable) {
	            var copyDefault = deepCopy(this.tabid_applicationData.get(tabId.toUpperCase()).applications.first());
	            copyDefault["appId"] = appId;
	            copyDefault["className"] = null;
	            copyDefault["default"] = false;
	            copyDefault["loaded"] = false;
	            copyDefault["tabId"] = tabId;
	            copyDefault["view"] = view;
	            copyDefault["population"] = $H();
	            copyDefault["refreshLeftMenu"] = this.leftMenuShowed;
	            var populationKeys = this.tabid_applicationData.get(tabId.toUpperCase()).applications.first()["population"].keys();
	            for (var i = 0; i < populationKeys.length; i++) {
	                copyDefault["population"].set(populationKeys[i], {
	                    multiSelected: false,
	                    singleSelected: false
	                });
	            }
	            //if (Object.isEmpty(this.topMenu.appList.get(appId))) {
	            this.topMenu.appList.set(appId, $H({ mainApp: copyDefault['mnmid'], subApp: copyDefault['sbmid'] }));
	            //}
	            this.tabid_applicationData.get(tabId.toUpperCase()).applications.push(copyDefault);
	            if (Object.isEmpty(this.viewsCount.get(copyDefault.view)))
	                this.viewsCount.set(copyDefault.view, 1);
	            else
	                this.viewsCount.set(copyDefault.view, this.viewsCount.get(copyDefault.view) + 1);
	            this.allApps.push(copyDefault.appId);
	            app = copyDefault;
	        }
	    }
	    if (app.loaded)
	        this.runApplication(app, mode, args);
	    else
	    //get the file if needed
	        this.getFile(app, mode, args, true);

	},
	//get the file from server
	getFile: function (app, mode, args, runApplication) {
	    if (!window[app.view]) {
	        this.loadFiles(CLASS_VIEW.get(app.view), app, mode, args, runApplication);
	    }
	    else {
	        this.initializeApplication(app, mode, args, runApplication);
	    }
	},
	//run the application
	runApplication: function (app, mode, args) {
	    //close the current opened application if any
	    if (this.currentApplication && !mode) {
	        var currentClassName = this.currentApplication.className;
	        this.previousApplication = this.currentApplication;
	        window[currentClassName + "_instance"].close();
	    }
	    //close the current opened sub application if any
	    if (this.currentSubApplication && mode != 'popUp') {
	        var subSubApp = args.get('keepSubOpened');
	        if (!subSubApp) {
	            this.closeSubApplication();
	            if (this.currentSubSubApplication)
	                this.closeSubSubApplication();
	        }
	    }

	    //update the current application variables and set the
	    //current selection type too
	    if (mode != "popUp") {
	        if (mode != "sub") {
	            this.currentApplication = app;
	            this.currentSelectionType = this.getSelectionType(app, mode);
	        } else {
	            if (!subSubApp) {
	                this.currentSubApplication = app;
	                this.currentSelectionType = this.getSelectionType(app, mode);
	            }
	            else {
	                this.currentSubSubApplication = app;
	            }
	        }
	    }

	    //open the application
	    window[app.className + "_instance"].run(args);

	    //Hide the loading application screen if existing
	    if ($("loading_app") && $("loading_app").visible) {
	        $("loading_app").hide();
	        $("loading_app_semitrans").hide();
	    }
	    if (window[app.className + "_instance"].options.population) {
	        if (this.previousApplication) {
	            if (this.getSelectionType(this.previousApplication) != "none") {
	                this.previousAppMode = this.getSelectionType(this.previousApplication);
	                this.oldPopulation = global.getPopulationName(global.getTabIdByAppId(this.previousApplication.appId))
	            }
	        }
	        else {
	            this.previousAppMode = null;
	            this.oldPopulation = null;
	        }
	        window[app.className + "_instance"].afterRun(true, this.previousAppMode, this.oldPopulation);
	    }

	    // fire the event which will keep the menus updated
	    if (mode != 'popUp' && this.leftMenuShowed) {
	        this.leftMenu.onOpenApplication(app);
	        this.topMenu.applicationOpen({ app: app.appId, mode: mode });
	        if (this.historyManager) {
	            this.historyManager.openApplication({ app: app.appId, mode: mode });
	        }
	        document.fire("EWS:changeScreen", $H(app));
	    }
	},

	initializeApplicationByAppId: function (appId) {
	    if (this.allApps.include(appId)) {
	        var app = this.getApplicationByAppId(appId);
	        this.getFile(app, null, null, false);
	    }
	},

	/**
	* Gets the selection mode depending on the application data
	*/
	getSelectionType: function (app, mode) {
	    var selectionType = null;
	    var tabId = this.getTabIdByAppId(app.appId);
	    // set the current selection type based on the application that has just been opened.
	    if (this.tabid_leftmenus.get(tabId) &&
                this.tabid_leftmenus.get(tabId).get("SELECT")) {

	        if (this.tabid_leftmenus.get(tabId).get("SELECT").menuType == 1) {

	            selectionType = "single";
	        } else {
	            selectionType = "multi";
	        }
	        //if no select menu to get the selection type set it as none
	    } else {
	        selectionType = "none";
	    }

	    return selectionType;
	},

	/**
	* Creates an instance for a given application data
	* @param {JSON} applicationData The data for the application that you want to create an instance
	*/
	initializeApplication: function (applicationData, mode, args, runApplication) {
	    //Checking if we have to instanciate also a left menu for the application
	    //see if we have menus for our tabId
	    if (!Object.isEmpty(this.tabid_leftmenus.get(applicationData.tabId))) {
	        //for each left menu, check if it's instanciated or not
	        for (var i = 0; i < this.tabid_leftmenus.get(applicationData.tabId).keys().length; i++) {
	            var menusAlreadyInstance = this.leftMenu.menusInstances.keys();
	            if (!menusAlreadyInstance.include(this.tabid_leftmenus.get(applicationData.tabId).keys()[i])) {
	                var menuKey = this.tabid_leftmenus.get(applicationData.tabId).keys()[i];
	                var menuValue = this.leftMenu.menusClassNames.get(menuKey);
	                var menuOptions = this.leftMenu.menusOptions.get(menuKey).options;
	                if (window[menuValue]) {
	                    this.leftMenu.menusInstances.set(menuKey, new window[menuValue](menuKey, menuOptions));
	                }
	            }
	        }
	    }
	    //for a view used more than once create a subclass of the original
	    //view and an instance of this subclass
	    if (this.viewsCount.get(applicationData.view) > 1) {
	        applicationData.className = applicationData.appId + "_" + applicationData.view;
	        //create the subclass.
	        window[applicationData.className] = Class.create(window[applicationData.view], {

	            initialize: function ($super, options) {
	                $super(options);
	            },

	            run: function ($super, args) {
	                $super(args);
	            },

	            close: function ($super) {
	                $super();
	            }
	        });

	        window[applicationData.className + "_instance"] = new window[applicationData.className](applicationData);
	        //set loaded as true to not instantiate it again.
	        applicationData.loaded = true;
	    }
	    //for a view used just once, create a normal instance.
	    else {
	        applicationData.className = applicationData.view;
	        window[applicationData.className + "_instance"] = new window[applicationData.className](applicationData);
	        //set loaded as true to not instantiate it again.
	        applicationData.loaded = true;
	    }
	    var i = 0;

	    this.tabid_applicationData.get(applicationData.tabId).applications.find(function (appl, index) {
	        i = index;
	        return appl.appId == applicationData.appId;
	    });
	    this.tabid_applicationData.get(applicationData.tabId).applications[i] = applicationData;
	    if (runApplication)
	        this.runApplication(applicationData, mode, args);
	},
	/**
	* Function to handle the open application of the previous application before to make an open
	*/
	goToPreviousApp: function (args) {
	    var appHash = $H(args);
	    appHash.set("app", {
	        "appId": this.previousApplication.appId,
	        "tabId": this.previousApplication.tabId,
	        "view": this.previousApplication.view
	    });
	    this.open(appHash);
	},
	/**
	* Fills the tabId depending on appId
	* @param {appId} 
	*/
	getTabIdByAppId: function (appId) {
	    if (!Object.isEmpty(this.appid_tabid.get(appId.toUpperCase()))) {
	        this.hasTab = true;
	        return this.appid_tabid.get(appId.toUpperCase());
	    }
	    else {
	        this.hasTab = false;
	        if (!Object.isEmpty(this.currentApplication)) {
	            return this.currentApplication.tabId;
	        } else {
	            return null;
	        }
	    }
	},
	/**
	* Close the opened subApplication 
	*/
	closeSubApplication: function () {
	    var currentSubClassName = this.currentSubApplication.className;
	    this.currentSubApplication = null;
	    window[currentSubClassName + "_instance"].close();
	    //update left menus when the subapplication has been closed
	    if (Object.isEmpty(window[currentSubClassName + "_instance"].options["refreshLeftMenu"]) || window[currentSubClassName + "_instance"].options["refreshLeftMenu"]) {
	        this.leftMenu.onOpenApplication(this.currentApplication);
	    }
	},
	/**
	* Close the opened subSubApplication 
	*/
	closeSubSubApplication: function () {
	    var currentSubSubClassName = this.currentSubSubApplication.className;
	    this.currentSubSubApplication = null;
	    window[currentSubSubClassName + "_instance"].close();
	    //update left menus when the subapplication has been closed
	    if (Object.isEmpty(window[currentSubSubClassName + "_instance"].options["refreshLeftMenu"]) || window[currentSubSubClassName + "_instance"].options["refreshLeftMenu"]) {
	        this.leftMenu.onOpenApplication(this.currentApplication);
	    }
	},
	/**
	* Fills the translations from GET_USETTINGS
	* @param {JSON} json the data from GET_USETTINGS
	*/
	setTranslations: function (json) {
	    this.translations = $H({});
	    objectToArray(json.EWS.o_translations.yglui_str_lang_prior).each(function (translation) {
	        this.translations.set(translation["@lang"], {
	            endda: translation["@endda"],
	            begda: translation["@begda"],
	            seqen: translation["@seqen"]
	        });
	    } .bind(this));
	},

	loadFiles: function (fileList, app, mode, args, runApplication) {
	    if (fileList.size() != 1) {
	        $LAB
				.toBODY()
				.script(fileList.first())
				.block(this.loadFiles.bind(this, fileList.without(fileList.first()), app, mode, args, runApplication));
	    } else {
	        $LAB
				.toBODY()
				.script(fileList.first())
				.block(this.initializeApplication.bind(this, app, mode, args, runApplication));
	    }
	},


	getCompanyName: function () {
	    var gcc = getURLParam("gcc");
	    var lcc = getURLParam("lcc");
	    var companyId = gcc + lcc;
	    if (!Object.isEmpty(this.companies)) {
	        if (Object.isEmpty(this.companies.get(companyId))) {
	            companyId = this.defaultCompany['@yygcc'] + this.defaultCompany['@yylcc'];
	        }
	        var name = this.companies.get(companyId).name;
	    }
	    var title = '';
	    if (Object.isEmpty(name))
	        title = global.getLabel('MyCompany');
	    else
	        title = name;

	    return title;
	},
	/**
	* Fills the group hash using the data received from SAP
	* @param {Object} groupData
	*/
	setGroups: function (groupData) {
	    var populationData = objectToArray(groupData.yglui_str_population);
	    this.groups = $H();
	    for (var i = 0; i < populationData.size(); i++) {
	        var defaultGroupId = "";
	        var populationGroups = $H();

	        //If this population has groups:
	        if (!Object.isEmpty(populationData[i].groups)) {
	            var groups = objectToArray(populationData[i].groups.yglui_str_group_obj);
	            for (var j = 0; j < groups.size(); j++) {
	                if (!Object.isEmpty(groups[j]['@groupid'])) {
	                    var groupId = groups[j]['@groupid'];
	                    //If the group doesn't have a name, we use the Id as name
	                    var groupName = groupId;
	                    if (!Object.isEmpty(groups[j]['@groupname'])) {
	                        groupName = groups[j]['@groupname'];
	                    }
	                    //Check if it's the default group
	                    var defaultGroup = !Object.isEmpty(groups[j]['@defgroup']) && ((groups[j]['@defgroup']).toLowerCase() == "x");
	                    var groupMembers = null;
	                    var loaded = false;
	                    if (defaultGroup) {
	                        defaultGroupId = groupId;
	                        //If it's the default, populate it
	                        if (!Object.isEmpty(populationData[i].population) && !Object.isEmpty(populationData[i].population.yglui_str_popul_obj)) {
	                            var defaultGroupPopulation = objectToArray(populationData[i].population.yglui_str_popul_obj);
	                            groupMembers = $H({});
	                            for (var k = 0; k < defaultGroupPopulation.size(); k++) {
	                                groupMembers.set(defaultGroupPopulation[k]['@objid'], defaultGroupPopulation[k]['@objid']);
	                            }
	                            loaded = true;
	                        }
	                    }
	                    //Add the group, using its id as key:
	                    populationGroups.set(groupId, { id: groupId, name: groupName, isDefault: defaultGroup, members: groupMembers, loaded: loaded });
	                }
	            }
	        }
	        this.groups.set(populationData[i]['@population_id'], { defaultGroup: defaultGroupId, groups: populationGroups });
	    }
	},

	mergeFiles: function () {
	    for (var i = 0; i < CUSTOMER_FILES.keys().length; i++) {
	        var key = CUSTOMER_FILES.keys()[i];
	        if (!Object.isEmpty(CLASS_VIEW.get(key))) {
	            for (k = 0; k < CUSTOMER_FILES.get(key).length; k++) {
	                CLASS_VIEW.get(key).push(CUSTOMER_FILES.get(key)[k]);
	            }
	            //CLASS_VIEW.get(key).push(CUSTOMER_FILES.get(key).first());
	        }
	    }
	    document.fire("EWS:customerFilesLoaded");
	},

	reloadApplication: function () {
	    if (this.reloadEWS) {
	        location.reload();
	        $("loading_app_semitrans").show();
	    }
	},

	enableAllButtons: function () {
	    if (!Object.isEmpty(this.buttonsByAppid.get(this.currentApplication.className))) {
	        var buttonsArray = objectToArray(this.buttonsByAppid.get(this.currentApplication.className).array);
	        for (var i = 0; i < buttonsArray.length; i++) {
	            var hash = buttonsArray[i];
	            for (var j = 0; j < hash.keys().length; j++) {
	                var idButton = hash.keys()[j];
	                hash.get(idButton)[0].enabled = true;
	                if ((hash.get(idButton)[0].isStandard)) {
	                    if (!Object.isEmpty(hash.get(idButton)[1].down('[class=leftRoundedCornerDisable]'))) {
	                        hash.get(idButton)[1].down('[class=leftRoundedCornerDisable]').className = 'leftRoundedCorner';
	                        hash.get(idButton)[1].down('[class=centerRoundedButtonDisable]').className = 'centerRoundedButton';
	                        hash.get(idButton)[1].down('[class=rightRoundedCornerDisable]').className = 'rightRoundedCorner';
	                    }
	                } else {
	                    hash.get(idButton)[1].removeClassName(hash.get(idButton)[0].disabledClass);
	                    hash.get(idButton)[1].removeClassName(hash.get(idButton)[0].activeClass);
	                    hash.get(idButton)[1].addClassName('application_action_link');
	                }
	                hash.get(idButton)[1].observe('click', hash.get(idButton)[2]);
	            }
	        }
	    }
	},

	disableAllButtons: function () {
	    if (!Object.isEmpty(this.buttonsByAppid.get(this.currentApplication.className))) {
	        var buttonsArray = objectToArray(this.buttonsByAppid.get(this.currentApplication.className).array);
	        for (var i = 0; i < buttonsArray.length; i++) {
	            var hash = buttonsArray[i];
	            for (var j = 0; j < hash.keys().length; j++) {
	                var idButton = hash.keys()[j];
	                hash.get(idButton)[0].enabled = false;
	                if ((hash.get(idButton)[0].isStandard)) {
	                    if (!Object.isEmpty(hash.get(idButton)[1].down('[class=leftRoundedCorner]'))) {
	                        hash.get(idButton)[1].down('[class=leftRoundedCorner]').className = 'leftRoundedCornerDisable';
	                        hash.get(idButton)[1].down('[class=centerRoundedButton]').className = 'centerRoundedButtonDisable';
	                        hash.get(idButton)[1].down('[class=rightRoundedCorner]').className = 'rightRoundedCornerDisable';
	                    }
	                } else {
	                    hash.get(idButton)[1].addClassName(hash.get(idButton)[0].disabledClass);
	                    hash.get(idButton)[1].removeClassName('application_action_link');
	                    hash.get(idButton)[1].removeClassName(hash.get(idButton)[0].activeClass);
	                }
	                hash.get(idButton)[1].stopObserving('click', hash.get(idButton)[2]);
	            }
	        }
	    }
	},

	/**
	* Sets the reload variable to true for the selected screens for the selected object
	* @param {Object} screens An object or list of objects each containing:
	*     - view: the view for the app
	*     - appid: the id for the app
	*     - screen the number or id for the screen we want to refresh
	* @param {Object} objects An array with all the objects to set.Each one will have to be as this example:
	*         {objectId: "1293458723", objectType: "P"}
	*/
	setScreenToReload: function (screens, objects) {
	    //Check if we have all parameters
	    if (Object.isEmpty(objects) || Object.isEmpty(screens)) {
	        return;
	    }
	    var screensV = objectToArray(screens);
	    var objectsV = objectToArray(objects);
	    for (var i = 0; i < objectsV.size(); i++) {
	        var objectId = objectsV[i].objectId;
	        var objectType = objectsV[i].objectType;
	        var objectKey = objectId + "_" + objectType;
	        if (Object.isEmpty(this.refreshObjects.get(objectKey))) {
	            this.refreshObjects.set(objectKey, $H());
	        }
	        for (var j = 0; j < screensV.size(); j++) {
	            var screenKey = screensV[j].view + "_" + screensV[j].appid + "_" + screensV[j].screen;
	            this.refreshObjects.get(objectKey).set(screenKey, true);
	        }
	    }
	},
	/**
	* Unsets the reload variable to true for the selected screens for the selected object
	* @param {Object} screens An object or list of objects each containing:
	*     - view: the view for the app
	*     - appid: the id for the app
	*     - screen the number or id for the screen we want to refresh
	* @param {Object} objects An array with all the objects to set.Each one will have to be as this example:
	*         {objectId: "1293458723", objectType: "P"}
	*/
	unsetScreenToReload: function (screens, objects) {
	    //Check if we have all parameters
	    if (Object.isEmpty(objects) || Object.isEmpty(screens)) {
	        return;
	    }
	    var screensV = objectToArray(screens);
	    var objectsV = objectToArray(objects);
	    for (var i = 0; i < objectsV.size(); i++) {
	        var objectId = objectsV[i].objectId;
	        var objectType = objectsV[i].objectType;
	        var objectKey = objectId + "_" + objectType;
	        if (Object.isEmpty(this.refreshObjects.get(objectKey))) {
	            //If we don't have an entry for this object we don't need to do anything
	            return;
	        }
	        for (var j = 0; j < screensV.size(); j++) {
	            var screenKey = screensV[j].view + "_" + screensV[j].appid + "_" + screensV[j].screen;
	            this.refreshObjects.get(objectKey).unset(screenKey);
	        }
	    }
	},
	/**
	* Checks if a screen has to be reloaded for the selected object
	* @param {Object} view
	* @param {Object} appid
	* @param {Object} screen
	* @param {Object} objectId
	* @param {Object} objectType
	*/
	getScreenToReload: function (view, appid, screen, objectId, objectType) {
	    //Check if we have all parameters
	    if (Object.isEmpty(objectId) || Object.isEmpty(objectType) || Object.isEmpty(view) || Object.isEmpty(appid) || Object.isEmpty(screen)) {
	        return false;
	    }
	    var objectKey = objectId + "_" + objectType;
	    //If the variable is set, return true
	    var screenKey = view + "_" + appid + "_" + screen;
	    if (!Object.isEmpty(this.refreshObjects.get(objectKey)) && !Object.isEmpty(this.refreshObjects.get(objectKey).get(screenKey))) {
	        return true;
	    } else {
	        return false;
	    }
	},
	/**
	* Unsets the reload parameter for all the objects in each of the views
	* @param {Object} screens An object or list of objects each containing:
	*     - view: the view for the app
	*     - appid: the id for the app
	*     - screen the number or id for the screen we want to refresh
	*/
	unsetReloadForScreens: function (screens) {
	    //Check if we have all parameters
	    if (Object.isEmpty(screens)) {
	        return;
	    }
	    var screensV = objectToArray(screens);
	    var refreshObjectsKeys = this.refreshObjects.keys();
	    for (var i = 0; i < refreshObjectsKeys.size(); i++) {
	        for (var j = 0; j < screensV.size(); j++) {
	            var screenKey = screensV[j].view + "_" + screensV[j].appid + "_" + screensV[j].screen;
	            this.refreshObjects.get(refreshObjectsKeys[i]).unset(screenKey);
	        }
	    }
	},
	/**
	* Reload the left menu for my selection if needed
	*/
	reloadMySelection: function (population) {
	    if (!Object.isEmpty(this.leftMenu.menusInstances.get('SELECT')))
	        this.leftMenu.menusInstances.get('SELECT').reloadPopulation(population);
	}
});

CUSTOMER_FILES = $H({
    YCA_TAXF: ["customer/BNS/ca_TaxFormsBNS.js"],
    PAY: ["customer/BNS/payslipBNS.js"]
});

$LAB
            .toBODY()
            .script("customer/BNS/logOutBNS.js")
            .block(function () { /*document.fire("EWS:customerFilesLoaded"); */ });

//[ticketid:1002638] Eliminate print icon from EWS
if ($('fwk_print')) $('fwk_print').hide()
if ($('help_button')) $('help_button').style.float = 'right'
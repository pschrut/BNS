/**
 * @author JONATHANJ
 */
CKEDITOR.plugins.add( 'insertSignature',{
		init : function( editor ){
			editor.addCommand('insertSignature', new CKEDITOR.insertSignatureCommand());
			editor.addCommand('insertTemplate', new CKEDITOR.insertTemplateCommand());
			editor.addCommand('addAttachment', new CKEDITOR.addAttachmentCommand());
	        editor.ui.addButton('InsertSignature',{
	                label: 'Insert signature',
	                command: 'insertSignature',
					icon: 'images/signature.gif'
            });
			editor.ui.addButton('InsertTemplate',{
	                label: 'Insert Template',
	                command: 'insertTemplate',
					icon: 'images/template.gif'
            });
			editor.ui.addButton('AddAttachment',{
	                label: 'Add attachment',
	                command: 'addAttachment',
					icon: 'images/attachment.gif'
            });
		}
});

CKEDITOR.insertSignatureCommand = function(event){};
CKEDITOR.insertSignatureCommand.prototype = {
    exec: function(editor){
        document.fire('EWS:scm_showSignatures');
    }
};
CKEDITOR.insertTemplateCommand = function(event){};
CKEDITOR.insertTemplateCommand.prototype = {
    exec: function(editor){
        document.fire('EWS:scm_showTemplates');
    }
};
CKEDITOR.addAttachmentCommand = function(event){};
CKEDITOR.addAttachmentCommand.prototype = {
    exec: function(editor){
        document.fire('EWS:scm_addAttachment');
    }
};
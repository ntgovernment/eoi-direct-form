/**
* +--------------------------------------------------------------------+
* | This MySource Matrix CMS file is Copyright (c) Squiz Pty Ltd       |
* | ABN 77 084 670 600                                                 |
* +--------------------------------------------------------------------+
* | IMPORTANT: Your use of this Software is subject to the terms of    |
* | the Licence provided in the file licence.txt. If you cannot find   |
* | this file please contact Squiz (www.squiz.com.au) so we may provide|
* | you a copy.                                                        |
* +--------------------------------------------------------------------+
*
*
*/

var Matrix_Viper_Ace_Editor = new function() {
	var viper = null;
	var loadedEditors = {};
	var currentEditorTextArea = null;

	this.loadAce = function(options)
	{
		// ACE does not support IE 8
		if (Viper.Util.isBrowser('msie', '<9')) return;

		var self = this;
		self.viper = new Viper('MatrixViperAce', {language: 'en'});
		self.loadedEditors = {};
		self.currentEditorTextArea = null;
		var targetElements = options.targetElements;

		for(var i = 0; i < targetElements.length; i++) {
			$textarea = $(targetElements[i]);

			// create the DIV that would load the Ace editor
			$aceDiv = $('<div class="sq-viper-ace-editor" data-target="' + targetElements[i].id + '">');
			$textarea.after($aceDiv);
			// if it needs a large area
			if($textarea.hasClass('sq-viper-ace-editor-textarea-large')) {
				$aceDiv.addClass('sq-viper-ace-editor-large');
			}
			if($textarea.hasClass('sq-viper-ace-editor-textarea-readonly')) {
				$aceDiv.addClass('sq-viper-ace-editor-textarea-readonly');
			}

			//wysiwygs should not have code switch
			if($textarea.attr('id') && $textarea.attr('id').indexOf('content_type_wysiwyg') !== 0) {
				// create the code/raw switch
				$switch = $('<span class="sq-toggle-option-wrapper sq-viper-ace-editor-switch"></span>');
				$codeButton = $('<a href="#" title="' + js_translate('Switch to Ace Code Editor') + '" class="selected sq-viper-ace-editor-code-button" >' + js_translate('Code') + '</a>');
				$rawButton = $('<a href="#" title="' + js_translate('Switch to Raw Text Editor') + '" class="sq-viper-ace-editor-raw-button" >' + js_translate('Raw') + '</a>');
				$switch.append($codeButton);
				$switch.append($rawButton);

				if($textarea.closest('.sq-edit-content-type-wrapper').find('.async-loading-wrapper').length > 0) {
					$textarea.closest('.sq-edit-content-type-wrapper').find('.async-loading-wrapper').prepend($switch);
				} else {
                    $textarea.closest('.sq-edit-content-type-wrapper').prepend($switch);
				}

                $markdownBadge = $('<span title="Component Type Markdown" class="badge badge-outline text-uppercase">' + js_translate('markdown') + '</span>');
                if($textarea.attr('id').indexOf('content_type_markdown') !== -1) {
				    if($textarea.closest('.sq-edit-content-type-wrapper').find('.async-loading-wrapper').length > 0) {
				        $textarea.closest('.sq-edit-content-type-wrapper').find('.async-loading-wrapper').append($markdownBadge);
				    } else {
				        $textarea.closest('.sq-edit-content-type-wrapper').find('.sq-toggle-option-wrapper').after($markdownBadge);
				    }
                }

				$codeButton.click(function(event) {
					event.preventDefault();
					$rawButton = $(this).parent().find('a.sq-viper-ace-editor-raw-button');
					$rawButton.removeClass('selected');
					$(this).addClass('selected');
					$textarea = $(this).closest('.sq-edit-content-type-wrapper').find('textarea.sq-viper-ace-editor-textarea');
					$aceDiv = $(this).closest('.sq-edit-content-type-wrapper').find('div.sq-viper-ace-editor');
					$aceDiv.css( "display", "block");
					$textarea.hide();

					// set the ace editor value with raw textarea's
					var editor = ace.edit($aceDiv.get(0));
					editor.setValue($textarea.val(), -1);

				});
				$rawButton.click(function(event) {
					event.preventDefault();
					$codeButton = $(this).parent().find('a.sq-viper-ace-editor-code-button');
					$codeButton.removeClass('selected');
					$(this).addClass('selected');
					$textarea = $(this).closest('.sq-edit-content-type-wrapper').find('textarea.sq-viper-ace-editor-textarea');
					$aceDiv = $(this).closest('.sq-edit-content-type-wrapper').find('div.sq-viper-ace-editor');
					$aceHeight = $aceDiv.height();
					$textarea.css("height", $aceHeight).css( "display", "block");
					$aceDiv.hide();
				});
			}


			// Setup the Ace editor.
			var editor   = ace.edit($aceDiv.get(0));

			// disable a warning message
			editor.$blockScrolling = Infinity;

			var html = '';

			if($textarea.is('textarea') || $textarea.is('input')) {
				html = $textarea.val();
			} else if($textarea.is('div') || $textarea.is('pre')) {
				// using "textarea" value so that HTML encoded content
				// comes through as expected
				html = jQuery('<textarea>' + $textarea.html() + '</textarea>').val();
			}

			if($textarea.attr('id') && $textarea.attr('id').indexOf('content_type_wysiwyg') == 0 && $textarea.hasClass('sq-viper-ace-editor-textarea-mode-html') && $textarea.hasClass('sq-viper-ace-editor-textarea-readonly')) {
				if (window.StyleHTML) {
					html = StyleHTML(html);
				}
			}
			editor.getSession().setValue(html);
			// store all loaded editors
			self.loadedEditors[targetElements[i].id] = editor;

			self._applyEditorSettings(editor, $textarea);

			// when we focus on an editor, mark it
			editor.on('focus', function(e) {
				// grab the text area that is linked to this editor
				var textAreaId = $(e.target).closest('div.ace_editor').data('target');
				self.currentEditorTextArea = textAreaId;
			})


			// changes in Ace needs to be made in the text area
			editor.getSession().on('change', function(e){
				// we have to grab the editor that we focused on
				var currentEditor = self.loadedEditors[self.currentEditorTextArea];
				if(currentEditor) {
					$(document.getElementById(self.currentEditorTextArea)).val(currentEditor.getSession().getValue());
				}
			});
		}

	};


	this._applyEditorSettings = function(editor, $textarea) {

		// if it's read only
		if($textarea.hasClass('sq-viper-ace-editor-textarea-readonly')) {
			editor.setReadOnly(true);
		}

		editor.setTheme("ace/theme/viper");

		// do not use worker, code not ready yet
		editor.getSession().setUseWorker(false);

		// if it's JS file mode
		if($textarea.hasClass('sq-viper-ace-editor-textarea-mode-js')) {
			editor.getSession().setMode("ace/mode/javascript");
		}
		else if($textarea.hasClass('sq-viper-ace-editor-textarea-mode-css')) {
			editor.getSession().setMode("ace/mode/css");
		}
		else if ($textarea.hasClass('sq-viper-ace-editor-textarea-mode-scss')) {
			editor.getSession().setMode("ace/mode/scss");
		}
		else if ($textarea.hasClass('sq-viper-ace-editor-textarea-mode-json')) {
			editor.getSession().setMode("ace/mode/json");
		}
		else if ($textarea.hasClass('sq-viper-ace-editor-textarea-mode-markdown')) {
			editor.getSession().setMode("ace/mode/markdown");
		}
		else {
			editor.getSession().setMode("ace/mode/html");
		}

		// Use wrapping.
		editor.getSession().setUseWrapMode(true);

		// Do not show the print margin.
		editor.renderer.setShowPrintMargin(false);

		// Highlight the active line.
		editor.setHighlightActiveLine(true);

		// Show invisible characters
		editor.setShowInvisibles(true);
		editor.renderer.$textLayer.EOL_CHAR = String.fromCharCode(8629);

		// Set the selection style to be line (other option is 'text').
		editor.setSelectionStyle('line');

		// Always show the horizontal scrollbar.
		editor.renderer.setHScrollBarAlwaysVisible(false);

		// Use spaces instead of tabs.
		editor.getSession().setUseSoftTabs(true);

		// disable in editor search
		//editor.commands.removeCommand('find');

		// let the editor adjust height based on content in it
		editor.setOptions({
			maxLines: Infinity,
			autoScrollEditorIntoView: true,
			showInvisibles: false
		});

	};


	/**
	 * Initialise and load Ace Editor in the document
	 */
	this.init = function() {
		var $aceTextArea = jQuery('.sq-viper-ace-editor-textarea'),
			options = {targetElements: $aceTextArea};
		Matrix_Viper_Ace_Editor.loadAce(options);
		$aceTextArea.css('display', 'none');

		// Add scroll handler to stick the search box at top of the editor container
		var $window = jQuery(window);
		jQuery(window).scroll(function(e) {
			jQuery('div.sq-viper-ace-editor').each(function() {
				var $this = jQuery(this);
				var $searchBox = jQuery('.ace_search', $this);
				var top = $window.scrollTop();
				var elOffset = $this.offset();

				if (top > elOffset.top && top < elOffset.top + $this.height()) {
					$searchBox.css({ 'position': 'fixed', 'top': '48px' });
				} else {
					$searchBox.css({'position': 'absolute', 'top': '0' });
				}
			});
		});

		// Add event hanlder to hide Ace Editor's search box when clicked outside the editor
		jQuery(document).on('mousedown', function(e) {
			jQuery('div.sq-viper-ace-editor .ace_search').addClass('hidden');
			var $aceEditorContainer = jQuery(e.target).parents('.sq-viper-ace-editor');
			if ($aceEditorContainer.length) {
				jQuery('.ace_search', $aceEditorContainer).removeClass('hidden');
			}
		});
	}//end init()
};

Viper.Util.$(document).ready(function() {
//	Matrix_Viper_Ace_Editor.init();
});

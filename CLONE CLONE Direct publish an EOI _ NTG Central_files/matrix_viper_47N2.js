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

/**
 * Matrix_Viper
 *
 * Purpose
 *    Enables Viper editor in Matrix
 *
 * @author  Edison Wang <ewang@squiz.com.au>
 * @package   MySource_Matrix
 * @subpackage __core__
 */
var Matrix_Viper = new function() {
	var viper = null;
	this.loadViper = function(options)
	{
		var settings = {
			// Viper content container
			toolbarContainer: Viper.Util.$('body').find('.viper-toolbar-container-wrapper'),

			// Default accessibility standard
			standard: 'WCAG2AA',

			// Editable div elements (Viper.Util.$ collection)
			editableDivs: Viper.Util.$('div .with-viper'),

			// Threshold to apply 'fixedScroll' to the body
			scrollable: true,
			scrollOffsetThreshold: 0,

			// Default plugin set to use
			plugins: (typeof PluginsEnabled !== "undefined") ? PluginsEnabled : [
				'ViperCoreStylesPlugin',
				'ViperInlineToolbarPlugin',
				'ViperHistoryPlugin',
				'ViperListPlugin',
				'ViperFormatPlugin',
				'ViperToolbarPlugin',
				'ViperTableEditorPlugin',
				'MatrixCopyPastePlugin',
				'MatrixImagePlugin',
				'MatrixLinkPlugin',
				'MatrixCommentsPlugin',
				"MatrixKeywordsPlugin",
				'ViperAccessibilityPlugin',
				'ViperSourceViewPlugin',
				'ViperSearchReplacePlugin',
				'ViperLangToolsPlugin',
				'ViperCharMapPlugin',
				'ViperCursorAssistPlugin'
			],

			// Give the viper instance a name
			viperName: 'admin-viper',

			// The order of buttons for the wysiwyg
			buttons: [['bold', 'italic', 'subscript', 'superscript', 'strikethrough', 'code', 'class'], 'removeFormat', ['justify', 'formats', 'headings'], ['undo', 'redo'], ['unorderedList', 'orderedList', 'indentList', 'outdentList'], 'insertTable', 'image', 'hr', ['insertLink', 'removeLink', 'anchor'], 'insertCharacter', 'searchReplace', 'langTools', 'accessibility', 'sourceEditor', ['insertKeywords', 'insertSnippets']],

			inlineButtons: [['bold', 'italic', 'code', 'class'], ['justify', 'formats', 'headings'], ['unorderedList', 'orderedList', 'indentList', 'outdentList'], ['insertLink', 'removeLink', 'anchor'], ['matrixComments'], ['image', 'imageMove']]
		};

		// Plugins to buttons list.
		var pluginsToButtons = {
			'bold': 'ViperCoreStylesPlugin',
			'italic': 'ViperCoreStylesPlugin',
			'removeFormat': 'ViperCoreStylesPlugin',
			'subscript': 'ViperCoreStylesPlugin',
			'superscript': 'ViperCoreStylesPlugin',
			'strikethrough': 'ViperCoreStylesPlugin',
			'code': 'ViperCoreStylesPlugin',
			'class': 'ViperFormatPlugin',
			'justify': 'ViperFormatPlugin',
			'formats': 'ViperFormatPlugin',
			'headings': 'ViperFormatPlugin',
			'undo': 'ViperHistoryPlugin',
			'redo': 'ViperHistoryPlugin',
			'unorderedList': 'ViperListPlugin',
			'orderedList': 'ViperListPlugin',
			'indentList': 'ViperListPlugin',
			'outdentList': 'ViperListPlugin',
			'insertTable': 'ViperTableEditorPlugin',
			'image': 'MatrixImagePlugin',
			'imageMove': 'MatrixImagePlugin',
			'hr': 'ViperCoreStylesPlugin',
			'insertLink': 'MatrixLinkPlugin',
			'removeLink': 'MatrixLinkPlugin',
			'anchor': 'ViperFormatPlugin',
			'insertCharacter': 'ViperCharMapPlugin',
			'searchReplace': 'ViperSearchReplacePlugin',
			'langTools': 'ViperLangToolsPlugin',
			'accessibility': 'ViperAccessibilityPlugin',
			'sourceEditor': 'ViperSourceViewPlugin',
			'insertKeywords': 'MatrixKeywordsPlugin',
			'insertSnippets': 'MatrixKeywordsPlugin',
			'matrixComments': 'MatrixCommentsPlugin'
		}

		if (settings.editableDivs.length >= 1 && typeof(Viper) !== "undefined") {
			var viper = new Viper('MatrixViper', {language: 'en'}, function(viper) {
				var pm = viper.getPluginManager();
				var $body = Viper.Util.$('body');

				// Get the current language but only take the language element as HTMLCS
				// doesn't support "language + country" as per backend locale.
				var lang       = document.documentElement.getAttribute('lang');
				let lang_parts = lang !== null ? lang.split('-') : '';

				pm.setPlugins(settings.plugins);
				pm.setPluginSettings('ViperInlineToolbarPlugin', {buttons: settings.inlineButtons});
				pm.setPluginSettings('ViperToolbarPlugin', {buttons: settings.buttons});
				if (lang !== null) {
					pm.setPluginSettings('ViperAccessibilityPlugin', {standard: settings.standard, lang: lang_parts[0]});
				}

				// need to specify Viper.Util.$ url for the new window view of source code mode
				pm.setPluginSettings('ViperSourceViewPlugin', {jqueryURL: options.jQueryPath});

				// Get the toolbar plugin and apply it to the container
				if(settings.toolbarContainer.length >=1) {
					var toolbar = pm.getPlugin('ViperToolbarPlugin');
					toolbar.setParentElement(settings.toolbarContainer.children().get(0));

					// if a parent element is set, it's fixed to element position
					$body.addClass('fixedElement');
				}
				else {
					// if there is no parent element, let the tool bar float to top
					$body.addClass('fixedScroll');
				}

				settings.editableDivs.each(function() {

					if (typeof MatrixViperDefaultTag != 'undefined') {
						viper.setSetting('defaultBlockTag', MatrixViperDefaultTag);
					}

					viper.registerEditableElement(this);
					var $editable = Viper.Util.$(this);

					var rawText = $editable.html();
					if (typeof MatrixViperDefaultTag == 'undefined' && (rawText.match(/^\s+$/) !== null ||
					rawText === "" || rawText.match(/^<[a-z]+>[\s\n]*(&nbsp;)*(<br\/?>)*<\/[a-z]+>$/i) !== null)) {
						$editable.html('<p></p>');
					}

					$editable.bind('mousedown',function(){
						if (viper.getViperElement() !== $editable.get(0)) {
							viper.setEditableElement($editable.get(0));
						}// End if
					});

					// Set the Matrix design style class
					var formatPluginSettings = Viper.Util.$(this).data('design_styles');
					if (formatPluginSettings !== undefined) {
						pm.setPluginSettings('ViperFormatPlugin', formatPluginSettings);
					}
				});
			});

			if (typeof PluginsEnabled != "undefined") {
				// if Matrix Comments plugin is disabled, we still need to load it, just set it read only mode
				var commentsPluginDisabled = false;
				if(Viper.Util.$.inArray('MatrixCommentsPlugin', PluginsEnabled) == -1) {
					PluginsEnabled.push('MatrixCommentsPlugin');
					commentsPluginDisabled = true;
				}

				// set the comments plugin to read only mode
				if(commentsPluginDisabled) {
					viper.getPluginManager().setPluginSettings('MatrixCommentsPlugin', {readOnly: true});
				}

				// Start removing buttons that aren't included by their plugins
				var buttons = settings.buttons.concat([]);
				var inlineButtons = settings.inlineButtons.concat([]);

				for (var i = 0; i < buttons.length; i++) {
					if (buttons[i] instanceof Array) {
						for (var j = 0; j < buttons[i].length; j++) {
							if (Viper.Util.$.inArray(pluginsToButtons[buttons[i][j]], PluginsEnabled) === -1) {
								buttons[i].splice(j, 1);
								j--;
							}
						}
						if (buttons[i].length === 0) {
							buttons.splice(i, 1);
							i--;
						}
					} else {
						if (Viper.Util.$.inArray(pluginsToButtons[buttons[i]], PluginsEnabled) === -1) {
							buttons.splice(i, 1);
							i--;
						}
					}
				}//end for

				for (var i = 0; i < inlineButtons.length; i++) {
					if (inlineButtons[i] instanceof Array) {
						for (var j = 0; j < inlineButtons[i].length; j++) {
							if (Viper.Util.$.inArray(pluginsToButtons[inlineButtons[i][j]], settings.plugins) === -1) {
								inlineButtons[i].splice(j, 1);
								j--;
							}
						}
						if (inlineButtons[i].length === 0) {
							inlineButtons.splice(i, 1);
							i--;
						}
					} else {
						if (Viper.Util.$.inArray(pluginsToButtons[inlineButtons[i]], settings.plugins) === -1) {
							inlineButtons.splice(i, 1);
							i--;
						}
					}
				}//end for

				viper.getPluginManager().setPluginSettings('ViperInlineToolbarPlugin', {buttons: inlineButtons});
				viper.getPluginManager().setPluginSettings('ViperToolbarPlugin', {buttons: buttons});



				// Get the toolbar plugin and apply it to the container
				if(settings.toolbarContainer.length >=1) {
					var toolbar = viper.getPluginManager().getPlugin('ViperToolbarPlugin');
					toolbar.setParentElement(settings.toolbarContainer.children().get(0));
				}
			}

			// Register callbacks for Viper Toolbar enable/disable events
			viper.registerCallback('Viper:enabled', 'ViperToolbarPlugin', function(range) {
				if (settings.toolbarContainer.length > 0) {
					settings.toolbarContainer.addClass('viper-active');
					settings.toolbarContainer.removeClass('viper-inactive');
				}
			});

			viper.registerCallback('Viper:disabled', 'ViperToolbarPlugin', function(range) {
				if (settings.toolbarContainer.length > 0) {
					settings.toolbarContainer.addClass('viper-inactive');
					settings.toolbarContainer.removeClass('viper-active');
				}
			});

			// Extend Viper's fireNodesChanged function to emit a custom event
			// called nodeChange, so that it can be listened by Matirx - e.g.
			// highlight wysiwyg component when content has changed.
			var nodeChangeEvent = document.createEvent('Event');
			nodeChangeEvent.initEvent('nodeChange', true, true);
			var originalFireNodesChanged = viper.fireNodesChanged;
			viper.fireNodesChanged = function(b) {
				originalFireNodesChanged.apply(this, arguments);
				this.element.dispatchEvent(nodeChangeEvent);
			}

			// allow external script to call it
			this.viper = viper;
		}
	};

	this.checkImagePreview = function(element, msg) {
		var $imagePasted = Viper.Util.$(element).find('*[data-imagepaste="true"]');
		if($imagePasted.length > 0) {
			$imagePasted.attr('data-imagepaste-status', 'error');
			var r = confirm(msg);
			if(r) {
				$imagePasted.remove();
				return true;
			}
			else {
				return false;
			}
		}
		return true;
	};

	this.checkSourceEditorPopup = function() {
		var ele = document.querySelector("div.Viper-popup");
		var checkattr = Viper.Util.$(ele).attr('aria-disabled');
		if (checkattr !== undefined && checkattr === "false" ){
			return true;
		}

		return false;
	};

	// Clear any Matrix Viper elements and the grey toolbar background - so that such don't overlay
	// after loading a screen.
	this.clearViperElement = function() {
		var $viperDivs = jQuery('div[id^=MatrixViper], div[id^=Matrix-Viper], div.ViperTP-bar');
		if ($viperDivs) {
			$viperDivs.remove();
		}
	}

	// Initiate the Viper
	this.init = function() {
		var scripts = document.getElementsByTagName('script');
		var options = {};
		// Loop through all the script tags that exist in the document and
		// find which one has included jQuery.
		for (var i = 0; i < scripts.length; i++) {
			if (scripts[i].src && scripts[i].src.match(/jquery\.js/)) {
				// We have found our appropriate <script> tag that includes
				// this file, we can extract the path.
				options.jQueryPath = scripts[i].src;
				break;
			}
		}
		Matrix_Viper.loadViper(options);
	};//end init()
};

// Edit Print Previewer - Editable Print Preview
// Opens an isolated editable preview of a document's Print Format (any DocType).
// All edits are temporary and never written back to ERPNext unless saved.

(function () {
	"use strict";

	// URL of the editor-specific stylesheet (served from the app's public assets).
	const EDITABLE_PRINT_CSS_URL = "/assets/edit_print_previewer/css/editable_print.css?v=3";

	// Always-visible formatting commands shown directly in the top toolbar.
	// Symbol icons replace single letters (L/C/R/J) for Word-like appearance.
	const FORMAT_COMMANDS = [
		{ label: '<b>B</b>', command: "bold", title: "Bold" },
		{ label: '<i>I</i>', command: "italic", title: "Italic" },
		{ label: '<u>U</u>', command: "underline", title: "Underline" },
		{ label: '&#x2190;', command: "justifyleft", title: "Align Left" },
		{ label: '&#x2192;&#x2190;', command: "justifycenter", title: "Align Center" },
		{ label: '&#x2192;', command: "justifyright", title: "Align Right" },
		{ label: '&#x2261;', command: "justifyfull", title: "Justify" },
	];

	// Open the editable print preview for a document (Rent Contract or MPRC).
	function openEditablePrintPreview(frm, doctype) {
		if (!frm.doc.name) {
			frappe.msgprint(__("Please save the document first."));
			return;
		}

		const docname = frm.doc.name;

		const dialog = new frappe.ui.Dialog({
			title: __("Editable Print Preview"),
			size: "extra-large",
		});

		dialog.$body.empty();

		const $wrapper = $(
			`<div class="editable-print-wrapper">
				<div class="editable-print-toolbar" style="display:flex; align-items:center; gap:12px; flex-wrap:wrap; padding:10px 14px; margin-bottom:10px; border-bottom:1px solid #d1d8dd; background:#f7f8fa;">
					<select class="editable-print-format-select" style="padding: 6px 10px; font-size: 13px; margin-right: 8px;">
						<option value="">${__("Select Print Format")}</option>
					</select>
					<button class="btn btn-default editable-print-load-btn" style="margin-right: 8px; padding: 6px 14px;">
						${__("Load")}
					</button>
					<button class="btn btn-default editable-print-image-btn" style="margin-right: 8px; padding: 6px 10px; font-size: 12px;">
						${__("Image")}
					</button>
					<input type="file" class="editable-print-image-input" accept="image/*" style="display:none;">
					<div class="editable-print-format-group" style="margin-left: 10px; display:inline-flex; gap:6px; align-items:center;">
						${FORMAT_COMMANDS.map(function (item) {
							return `<button class="btn btn-xs btn-default editable-print-format-btn" style="margin:0 2px; padding:4px 8px; font-size:12px;" title="${item.title}">${item.label}</button>`;
						}).join('')}
					</div>
					<button class="btn btn-default editable-print-print-btn" style="margin-left: 10px; padding: 6px 14px;">
						${__("Print")}
					</button>
					<button class="btn btn-default editable-print-save-btn" style="margin-left: 8px; padding: 6px 14px;">
						${__("Save Edited")}
					</button>
				</div>
				<div class="editable-print-editor" id="editable-print-editor"></div>
			</div>`
		);

		dialog.$body.append($wrapper);

		const $select = $wrapper.find(".editable-print-format-select");
		const $editor = $wrapper.find("#editable-print-editor");
		const $loadBtn = $wrapper.find(".editable-print-load-btn");
		const $imageBtn = $wrapper.find(".editable-print-image-btn");
		const $imageInput = $wrapper.find(".editable-print-image-input");
		const $printBtn = $wrapper.find(".editable-print-print-btn");
		const $saveBtn = $wrapper.find(".editable-print-save-btn");
		let originalHtml = "";
		let currentIframe = null;
		let savedHtml = null;

		// Check for a previously saved editable HTML attachment.
		frappe.call({
			method: "edit_print_previewer.editable_print.get_saved_editable_html",
			args: { docname: docname, doctype: doctype },
			callback: function (r) {
				const saved = r.message || null;
				savedHtml = saved ? saved.content : null;
			}
		});

		// Fetch available enabled Print Formats for the given doctype.
		frappe.call({
			method: "edit_print_previewer.editable_print.get_print_formats",
			args: { doctype: doctype },
			callback: function (r) {
				const formats = r.message || [];
				formats.forEach(function (f) {
					$select.append(
						$("<option></option>").attr("value", f.name).text(f.title || f.name)
					);
				});
			}
		});

		// Apply a formatting command to the editable iframe document.
		function applyFormat(command) {
			if (!currentIframe) return;
			const win = currentIframe[0].contentWindow;
			const doc = win.document;
			try { doc.execCommand(command, false, null); } catch (e) {}
			const editable = doc.getElementById("editable-document");
			if (editable) editable.focus();
		}

		// Insert an image file (data URL) into the editable iframe document.
		function insertImageFile(file) {
			if (!currentIframe) return;
			const win = currentIframe[0].contentWindow;
			const doc = win.document;
			const reader = new FileReader();
			reader.onload = function (e) {
				try {
					doc.execCommand("insertImage", false, e.target.result);
				} catch (err) {}
				const editable = doc.getElementById("editable-document");
				if (editable) editable.focus();
			};
			reader.readAsDataURL(file);
		}

		// Image from device picker.
		$imageBtn.on("click", function () { $imageInput[0].click(); });
		$imageInput.on("change", function () {
			const file = this.files && this.files[0];
			if (file) insertImageFile(file);
			this.value = ""; // reset so same file can be picked again
		});

		// Wire up inline formatting buttons.
		$wrapper.find(".editable-print-format-btn").each(function () {
			const $btn = $(this);
			const command = commandForTitle($btn.attr("title"));
			if (command) $btn.on("click", function () { applyFormat(command); });
		});

		function commandForTitle(title) {
			const map = {
				"Bold": "bold", "Italic": "italic", "Underline": "underline",
				"Align Left": "justifyleft", "Align Center": "justifycenter",
				"Align Right": "justifyright", "Justify": "justifyfull",
			};
			return map[title] || null;
		}

		// Get the current edited HTML from the iframe.
		function getEditedHtml() {
			if (!currentIframe) return "";
			const doc = currentIframe[0].contentWindow.document;
			const editable = doc.getElementById("editable-document");
			return editable ? editable.outerHTML : "";
		}

		// Save the edited HTML as a File attachment on the document.
		$saveBtn.on("click", function () {
			if (!currentIframe) {
				frappe.msgprint(__("Nothing to save."));
				return;
			}
			const editedHtml = getEditedHtml();
			if (!editedHtml) {
				frappe.msgprint(__("No content to save."));
				return;
			}
			frappe.call({
				method: "edit_print_previewer.api_editable_print.save_editable_print_html",
				args: {
					docname: docname,
					print_format: $select.val() || "",
					doctype: doctype,
					edited_html: editedHtml,
				},
				freeze: true,
				freeze_message: __("Saving edited version..."),
				callback: function (r) {
					if (r.message) {
						frappe.msgprint(__("Edited version saved as attachment."));
						savedHtml = editedHtml;
					} else {
						frappe.msgprint(__("Failed to save edited version."));
					}
				}
			});
		});

		// Load the rendered HTML into the editor.
		$loadBtn.on("click", function () {
			const print_format = $select.val();
			if (!print_format) {
				frappe.msgprint(__("Please select a Print Format."));
				return;
			}

			// If we have a saved version and originalHtml is not set yet,
			// ask the user whether to open original or saved version.
			if (!originalHtml && savedHtml) {
				const choiceDialog = new frappe.ui.Dialog({
					title: __("Choose Version"),
					size: "small",
				});
				choiceDialog.$body.append(
					`<div style="padding: 16px;">
						${__("A previously saved editable version exists. Which would you like to open?")}
						<div style="margin-top: 16px; display:flex; gap:12px;">
							<button class="btn btn-default choice-original" style="padding: 8px 20px;">${__("Original Print Format")}</button>
							<button class="btn btn-primary choice-saved" style="padding: 8px 20px;">${__("Saved Editable Version")}</button>
						</div>
					</div>`
				);
				const $choiceBody = choiceDialog.$body;
				$choiceBody.find(".choice-original").on("click", function () {
					choiceDialog.hide();
					loadPrintFormat(print_format);
				});
				$choiceBody.find(".choice-saved").on("click", function () {
					choiceDialog.hide();
					renderEditor(savedHtml);
				});
				choiceDialog.show();
				return;
			}

			loadPrintFormat(print_format);
		});

		function loadPrintFormat(print_format) {
			frappe.call({
				method: "edit_print_previewer.api_editable_print.get_editable_print_html",
				args: {
					docname: docname,
					print_format: print_format,
					doctype: doctype,
				},
				freeze: true,
				freeze_message: __("Loading Print Format..."),
				callback: function (r) {
					if (!r.message) {
						frappe.msgprint(__("No printable content returned."));
						return;
					}
					originalHtml = r.message;
					renderEditor(originalHtml);
				}
			});
		}

		// Print the edited iframe content.
		function doPrint() {
			if (!currentIframe) {
				frappe.msgprint(__("Nothing to print."));
				return;
			}
			try {
				currentIframe[0].contentWindow.print();
			} catch (e) {
				frappe.msgprint(__("Print failed: ") + (e.message || String(e)));
			}
		}

		$printBtn.on("click", function () { doPrint(); });

		// Render the HTML inside an isolated iframe so the editor UI does not
		// interfere with the rendered document and styles load cleanly.
		function renderEditor(html) {
			$editor.empty();
			currentIframe = null;

			const iframe = $(
				`<iframe id="editable-print-iframe" src="about:blank"
					style="width: 100%; height: 700px; border: 1px solid #d1d8dd;"></iframe>`
			)[0];
			$editor.append(iframe);
			currentIframe = $(iframe);

			const win = iframe.contentWindow;
			const doc = win.document;
			doc.open();
			doc.write(buildPreviewDocument(html));
			doc.close();

			// Make the rendered document editable once it loads.
			iframe.onload = function () {
				const editable = doc.getElementById("editable-document");
				if (editable) {
					editable.contentEditable = "true";
					editable.focus();
				}
			};
		}

		// Build a standalone HTML document carrying the rendered print content
		// together with inline toolbar spacing styles.
		function buildPreviewDocument(html) {
			const cssTag = EDITABLE_PRINT_CSS_URL
				? `<link rel="stylesheet" href="${EDITABLE_PRINT_CSS_URL}">`
				: "";
			return `<!DOCTYPE html>
<html>
<head>
	<meta charset="utf-8">
	<title>${__("Editable Print Preview")}</title>
	${cssTag}
	<style>
		body { margin: 0; font-family: sans-serif; }
		#editable-document { outline: none; }
		.editable-print-toolbar {
			display: flex;
			align-items: center;
			gap: 12px !important;
			flex-wrap: wrap;
			padding: 10px 14px !important;
			margin-bottom: 10px !important;
			border-bottom: 1px solid #d1d8dd;
			background: #f7f8fa;
		}
		.editable-print-toolbar select,
		.editable-print-toolbar .editable-print-load-btn,
		.editable-print-toolbar .editable-print-image-btn,
		.editable-print-toolbar .editable-print-print-btn,
		.editable-print-toolbar .editable-print-save-btn {
			margin-right: 8px !important;
		}
		.editable-print-toolbar .editable-print-print-btn {
			margin-right: 0 !important;
		}
		.editable-print-format-group {
			display: inline-flex !important;
			gap: 6px !important;
			align-items: center !important;
		}
		.editable-print-format-group .btn-xs {
			padding: 3px 7px !important;
			font-size: 12px !important;
			border: 1px solid #d1d8dd !important;
			background: #fff !important;
			cursor: pointer;
			border-radius: 3px;
			min-width: 26px;
			text-align: center;
			margin: 0 2px !important;
		}
	</style>
</head>
<body>
	<div id="editable-document" contenteditable="true">${html}</div>
</body>
</html>`;
		}

		dialog.footer.append(
			`<button class="btn btn-default editable-print-reset-btn" style="margin-right: 8px;">
				${__("Reset")}
			</button>
			<button class="btn btn-default editable-print-close-btn">
				${__("Close")}
			</button>`
		);

		dialog.footer.find(".editable-print-reset-btn").on("click", function () {
			if (!originalHtml) return;
			renderEditor(originalHtml);
		});

		dialog.footer.find(".editable-print-close-btn").on("click", function () {
			dialog.hide();
		});

		dialog.show();
	}

	// Expose globally so any doctype can call it.
	window.openEditablePrintPreview = openEditablePrintPreview;

	// Function to add the Editable Print Preview button to any doctype form.
	// Called from Frappe's global form-refresh event for every doctype.
	// The button is only shown to users who have the 'Format Editor' role.
	window.add_editable_print_button = function(frm, canUseEditor) {
		const btnLabel = __("Editable Print Preview");

		// Remove a previously added button if the role was revoked or the form
		// is now showing an unsaved document.
		if (!canUseEditor || !frm.doc.name) {
			if (frm.custom_buttons && frm.custom_buttons[btnLabel]) {
				frm.remove_custom_button(btnLabel);
			}
			return;
		}

		// Avoid adding the button twice.
		if (frm.custom_buttons && frm.custom_buttons[btnLabel]) return;

		frm.add_custom_button(btnLabel, function () {
			window.openEditablePrintPreview(frm, frm.doctype);
		});
	};

	// Check the explicit role assignment on the server rather than using
	// frappe.user_roles, which treats Administrator as having every role.
	// This also detects role revocation without requiring a new login.
	let permissionCheckId = 0;
	$(document).on("form-refresh", function (_event, frm) {
		const checkId = ++permissionCheckId;
		if (!frm.doc || !frm.doc.name) {
			window.add_editable_print_button(frm, false);
			return;
		}

		frappe.call({
			method: "edit_print_previewer.editable_print.can_use_editable_print_preview",
			callback: function (r) {
				if (checkId !== permissionCheckId) return;
				window.add_editable_print_button(frm, Boolean(r && r.message));
			},
			error: function () {
				if (checkId !== permissionCheckId) return;
				window.add_editable_print_button(frm, false);
			},
		});
	});

})();

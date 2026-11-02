# -*- coding: utf-8 -*-
# Copyright (c) 2026, Aliasgar and contributors
# For license information, please see license.txt
from __future__ import unicode_literals
import frappe
from frappe import _


def has_format_editor_role():
    """Check for an explicit Format Editor assignment on the current user.

    Do not use frappe.get_roles() here: Frappe grants the built-in
    Administrator every role implicitly, even when it is not assigned.
    """
    return bool(
        frappe.db.exists(
            "Has Role",
            {
                "parent": frappe.session.user,
                "parenttype": "User",
                "parentfield": "roles",
                "role": "Format Editor",
            },
        )
    )


@frappe.whitelist()
def can_use_editable_print_preview():
    """Return whether the current user has an explicit Format Editor role."""
    return has_format_editor_role()


@frappe.whitelist()
def get_print_formats(doctype):
    """Return the list of enabled Print Formats for a given doctype.

    Requires the 'Format Editor' role.
    """
    if not has_format_editor_role():
        frappe.throw(
            _("You do not have permission to use Editable Print Preview. "
              "Please contact your administrator to assign the 'Format Editor' role."),
            frappe.PermissionError,
        )

    formats = frappe.get_all(
        "Print Format",
        filters={"doc_type": doctype, "disabled": 0},
        fields=["name", "name as title"],
        order_by="name asc",
    )
    return formats


@frappe.whitelist()
def save_editable_print_html(docname, print_format, doctype, edited_html):
    """Save the edited HTML as a File attachment on the document."""
    from edit_print_previewer.api_editable_print import save_editable_print_html

    return save_editable_print_html(docname, print_format, doctype, edited_html)


@frappe.whitelist()
def get_saved_editable_html(docname, doctype):
    """Return the most recent saved editable HTML attachment for the document."""
    from edit_print_previewer.api_editable_print import get_saved_editable_html

    return get_saved_editable_html(docname, doctype)

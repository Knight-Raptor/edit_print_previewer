# -*- coding: utf-8 -*-
# Copyright (c) 2026, Aliasgar and contributors
# For license information, please see license.txt
from __future__ import unicode_literals
import frappe


def after_install():
    """Create the 'Format Editor' role on app installation so users can be
    assigned this role to access the Editable Print Preview feature."""
    role_name = "Format Editor"

    if not frappe.db.exists("Role", role_name):
        role = frappe.get_doc({
            "doctype": "Role",
            "role_name": role_name,
            "desk_access": 1,
        })
        role.insert(ignore_permissions=True)
        frappe.db.commit()

# -*- coding: utf-8 -*-
from __future__ import unicode_literals
from . import __version__ as app_version

app_name = "edit_print_previewer"
app_title = "Edit Print Previewer"
app_publisher = "Aliasgar"
app_description = "Generic Editable Print Preview for any DocType - edit rendered Print Format HTML directly in the browser"
app_icon = "octicon octicon-file-text"
app_color = "blue"
app_email = "aliasgar.c@smbsolutionkwt.com"
app_license = "MIT"

# Includes in <head>
# ------------------

# include js, css files in header of desk.html
# app_include_css = "/assets/edit_print_previewer/css/editable_print.css"
app_include_js = "/assets/edit_print_previewer/js/editable_print.js"

# include js, css files in header of web template
# web_include_css = "/assets/edit_print_previewer/css/editable_print.css"
# web_include_js = "/assets/edit_print_previewer/js/editable_print.js"

# Home Pages
# ----------

# application home page (will override Website Settings)
# home_page = "login"

# Website user home page (by Role)
# role_home_page = {
#	"Role": "home_page"
# }

# Website user home page (by function)
# get_website_user_home_page = "edit_print_previewer.utils.get_home_page"

# Generators
# ----------

# automatically create page for each record of this doctype
# website_generators = ["Web Page"]

# Installation
# ------------

# before_install = "edit_print_previewer.install.before_install"
after_install = "edit_print_previewer.install.after_install"

# Desk Notifications
# ------------------
# See frappe.core.notifications.get_notification_config

# notification_config = "edit_print_previewer.notifications.get_notification_config"

# Permissions
# -----------
# Permissions evaluated in scripted ways

# permission_query_conditions = {
# 	"Event": "edit_print_previewer.doctype.event.event.get_permission_query_conditions",
# }
#
# has_permission = {
# 	"Event": "edit_print_previewer.doctype.event.event.has_permission"
# }

# Scheduled Tasks
# ---------------

scheduler_events = {
	# "all": [
	# 	"edit_print_previewer.tasks.all"
	# ],
	# "daily": [
	# 	"edit_print_previewer.tasks.daily"
	# ],
	# "hourly": [
	# 	"edit_print_previewer.tasks.hourly"
	# ],
	# "weekly": [
	# 	"edit_print_previewer.tasks.weekly"
	# ]
	# "monthly": [
	# 	"edit_print_previewer.tasks.monthly"
	# ]
}

# Testing
# -------

# before_tests = "edit_print_previewer.install.before_tests"

# Overriding Methods
# ------------------------------

# override_whitelisted_methods = {
# 	"frappe.desk.doctype.event.event.get_events": "edit_print_previewer.event.get_events"
# }

# Fixtures
# --------

fixtures = ["Role"]

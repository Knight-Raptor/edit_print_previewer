# -*- coding: utf-8 -*-
from __future__ import unicode_literals
import frappe

__version__ = "1.0.0"


def get_month_diff(from_date, to_date):
    from datetime import datetime
    end_date = datetime.strptime(str(to_date), "%Y-%m-%d")
    start_date = datetime.strptime(str(from_date), "%Y-%m-%d")
    num_months = (end_date.year - start_date.year) * 12 + (
        end_date.month - start_date.month
    )
    return num_months + 1

# -*- coding: utf-8 -*-
from setuptools import setup, find_packages
import re, ast

# Get version from edit_print_previewer/__init__.py
_version_re = re.compile(r"__version__\s+=\s+(.*)")

with open("edit_print_previewer/__init__.py", "rb") as f:
    version = str(
        ast.literal_eval(
            _version_re.search(f.read().decode("utf-8")).group(1)
        )
    )

with open("requirements.txt") as f:
    requirements = [
        line.strip()
        for line in f
        if line.strip() and not line.startswith("#")
    ]

setup(
    name="edit_print_previewer",
    version=version,
    description="Generic Editable Print Preview for any DocType - edit rendered Print Format HTML directly in the browser",
    author="Aliasgar",
    author_email="aliasgar.c@smbsolutionkwt.com",
    packages=find_packages(),
    zip_safe=False,
    include_package_data=True,
    install_requires=requirements,
)

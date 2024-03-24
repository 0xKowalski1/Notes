#!/bin/bash

# Get the full path to the markdown file
MARKDOWN_FILE="$(realpath "$1")"
# Get the directory of the shell script itself
SCRIPT_DIR="$(dirname "$(realpath "$0")")"
# The HTML file will be created in the current working directory
HTML_FILE="report.html"
# Assume the template is in the same directory as the shell script
TEMPLATE_PATH="${SCRIPT_DIR}/template.html"

# Convert Markdown to HTML
pandoc "$MARKDOWN_FILE" --template="$TEMPLATE_PATH" --toc --toc-depth=4 -o "$HTML_FILE"

# Run the Node.js script to generate PDF, assuming it's in the same directory as this script
node "${SCRIPT_DIR}/generatePdf.js"


#!/bin/bash

if [ "$#" -ne 1 ]; then
    echo "Usage: $0 <path-to-markdown-file>"
    exit 1
fi

FILE_PATH="$1"

pandoc "$FILE_PATH" -o report.pdf --from markdown --template=./eisvogel.latex --listings

echo "Conversion completed: report.pdf"


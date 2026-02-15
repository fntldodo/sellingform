#!/bin/bash

# Configuration
BASE_DIR="/Users/tearock/Downloads/sellingform-main 4"
OFFLINE_DIR="$BASE_DIR/오프라인"
BUILD_PARTS="$OFFLINE_DIR/parts"
LIBS_DIR="$BASE_DIR/PDF-Standalone/libs"
TARGET_FILE="$OFFLINE_DIR/PDF-Editor-Standalone.html"
TEMPLATE="$OFFLINE_DIR/PDF-Editor-Portable.html"

echo "🚀 Starting Standalone PDF Editor Build..."

# 1. Prepare consolidated parts if they don't exist
mkdir -p "$BUILD_PARTS"
cat "$BASE_DIR/css/app.css" "$BASE_DIR/css/index.css" "$BASE_DIR/css/pdf.css" | sed '/@import/d' | sed '/@charset/d' > "$BUILD_PARTS/combined.css"
cat "$BASE_DIR/js/db.js" "$BASE_DIR/js/app.js" "$BASE_DIR/js/pdf.js" > "$BUILD_PARTS/combined_logic.js"

# 2. Build the final HTML using a temporary file
cp "$TEMPLATE" "$TARGET_FILE"

echo "📦 Inlining CSS..."
# Use Python for safe multi-line string replacement
python3 -c "
import os
with open('$TARGET_FILE', 'r') as f: content = f.read()
with open('$BUILD_PARTS/combined.css', 'r') as f: css = f.read()
content = content.replace('/* [BUILD_CSS_MARKER] */', css)
with open('$TARGET_FILE', 'w') as f: f.write(content)
"

echo "📦 Inlining Libraries..."
python3 -c "
import os
def replace_marker(file_path, marker, source_path):
    with open(file_path, 'r') as f: content = f.read()
    if os.path.exists(source_path):
        with open(source_path, 'r') as s: block = s.read()
        content = content.replace(marker, block)
        with open(file_path, 'w') as f: f.write(content)

replace_marker('$TARGET_FILE', '/* [BUILD_LIB_PDFLIB_MARKER] */', '$LIBS_DIR/pdf-lib.min.js')
replace_marker('$TARGET_FILE', '/* [BUILD_LIB_PDFJS_MARKER] */', '$LIBS_DIR/pdf.min.js')
replace_marker('$TARGET_FILE', '/* [BUILD_LIB_WORKER_MARKER] */', '$LIBS_DIR/pdf.worker.min.js')
replace_marker('$TARGET_FILE', '/* [BUILD_LOGIC_MARKER] */', '$BUILD_PARTS/combined_logic.js')
"

# 3. Fix internal paths for offline use
sed -i '' 's|https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js||g' "$TARGET_FILE"

echo "✅ Build Complete: $TARGET_FILE"


import os
import re

# Configuration
SOURCE_HTML = 'pages/pdf.html'
OUTPUT_HTML = 'PDF-Editor-Standalone.html'

# File mappings for inlining
CSS_FILES = {
    '../css/app.css': 'css/app.css',
    '../css/pdf.css': 'css/pdf.css'
}

JS_FILES = {
    '../js/db.js': 'js/db.js',
    '../js/app.js': 'js/app.js',
    '../js/pdf.js': 'js/pdf.js'
}

BASE64_LIBS = {
    'pdf-lib': 'pdf-lib-base64.txt',
    'pdf-js': 'pdf-js-base64.txt',
    'pdf-worker': 'pdf-worker-base64.txt'
}

def read_file(path):
    with open(path, 'r', encoding='utf-8') as f:
        return f.read()

def main():
    print(f"Reading source HTML: {SOURCE_HTML}")
    html_content = read_file(SOURCE_HTML)

    # 1. Remove specific CDN links (Fonts)
    print("Removing CDN font links...")
    html_content = re.sub(r'<link[^>]*href=["\']https://cdn.jsdelivr.net/gh/orioncactus/pretendard[^"\']*["\'][^>]*>', '', html_content)
    html_content = re.sub(r'<link[^>]*href=["\']https://fonts.googleapis.com[^"\']*["\'][^>]*>', '', html_content)

    # 2. Inline CSS
    print("Inlining CSS files...")
    for link_href, local_path in CSS_FILES.items():
        print(f"  Processing {local_path}...")
        css_content = read_file(local_path)
        # Regex to find the link tag
        pattern = f'<link[^>]*href=["\']{re.escape(link_href)}["\'][^>]*>'
        replacement = f'<style>\n/* Inlined from {local_path} */\n{css_content}\n</style>'
        html_content = re.sub(pattern, lambda m: replacement, html_content)

    # 3. Inline JS (Application Scripts)
    print("Inlining Application JS files...")
    for script_src, local_path in JS_FILES.items():
        print(f"  Processing {local_path}...")
        js_content = read_file(local_path)
        # Regex to find the script tag
        pattern = f'<script[^>]*src=["\']{re.escape(script_src)}["\'][^>]*></script>'
        replacement = f'<script>\n/* Inlined from {local_path} */\n{js_content}\n</script>'
        # Using lambda to avoid issues if js_content has backreferences (though rare in simple read)
        # But safest is to double escape backslashes if using re.sub with string, but function is safer.
        html_content = re.sub(pattern, lambda m: replacement, html_content)

    # 4. Remove CDN Library Scripts (we will inject our own loader)
    print("Removing CDN Library scripts...")
    # Matches pdf-lib, pdf.js, pdf.worker config
    html_content = re.sub(r'<script[^>]*src=["\']https://cdn.jsdelivr.net/npm/pdf-lib[^"\']*["\'][^>]*></script>', '', html_content)
    html_content = re.sub(r'<script[^>]*src=["\']https://cdnjs.cloudflare.com/ajax/libs/pdf.js/[^"\']+/pdf.min.js["\'][^>]*></script>', '', html_content)
    # Remove the inline script that sets the workerSrc to CDN
    html_content = re.sub(r'<script>\s*pdfjsLib\.GlobalWorkerOptions\.workerSrc\s*=[^<]*</script>', '', html_content)
    
    # Also clean up any potential leftover script tags that matched nothing or lines
    
    # 5. Inject Base64 Libraries and Loader
    print("Injecting Base64 Libraries...")
    
    pdf_lib_b64 = read_file(BASE64_LIBS['pdf-lib']).strip()
    pdf_js_b64 = read_file(BASE64_LIBS['pdf-js']).strip()
    pdf_worker_b64 = read_file(BASE64_LIBS['pdf-worker']).strip()
    
    loader_script = f"""
    <script>
    (function() {{
        console.log("Initializing Offline PDF Libraries...");
        
        // Base64 Data
        const PDF_LIB_B64 = "{pdf_lib_b64}";
        const PDF_JS_B64 = "{pdf_js_b64}";
        const PDF_WORKER_B64 = "{pdf_worker_b64}";
        
        // Helper: Load Script from Base64
        function loadScript(base64Code) {{
            return new Promise((resolve, reject) => {{
                const script = document.createElement('script');
                script.src = "data:text/javascript;base64," + base64Code;
                script.onload = resolve;
                script.onerror = reject;
                document.head.appendChild(script);
            }});
        }}
        
        // Helper: Base64 to ArrayBuffer (for Worker Blob)
        function base64ToUint8Array(base64) {{
            const binary_string = window.atob(base64);
            const len = binary_string.length;
            const bytes = new Uint8Array(len);
            for (let i = 0; i < len; i++) {{
                bytes[i] = binary_string.charCodeAt(i);
            }}
            return bytes;
        }}
        
        // Execution
        async function loadLibraries() {{
            try {{
                // 1. PDF-Lib
                await loadScript(PDF_LIB_B64);
                console.log("PDF-Lib loaded");
                
                // 2. PDF.js
                await loadScript(PDF_JS_B64);
                console.log("PDF.js loaded");
                
                // 3. Configure Worker
                if (window.pdfjsLib) {{
                    const workerBlob = new Blob([base64ToUint8Array(PDF_WORKER_B64)], {{ type: 'text/javascript' }});
                    const workerUrl = URL.createObjectURL(workerBlob);
                    window.pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;
                    console.log("PDF Worker configured");
                }} else {{
                    console.error("pdfjsLib not found after load");
                }}
                
            }} catch (e) {{
                console.error("Error loading libraries:", e);
                alert("라이브러리 로딩 실패: " + e.message);
            }}
        }}
        
        // Start Loading immediately
        loadLibraries();
        
    }})();
    </script>
    """
    
    # Insert loader script before the closing </head> tag, or at the top of body
    # Using <head> is better for libraries
    if '</head>' in html_content:
        html_content = html_content.replace('</head>', loader_script + '\n</head>')
    else:
        # Fallback to top of body
        html_content = html_content.replace('<body>', '<body>\n' + loader_script)

    # 6. Write Output
    print(f"Writing output to {OUTPUT_HTML}...")
    with open(OUTPUT_HTML, 'w', encoding='utf-8') as f:
        f.write(html_content)
    
    print("Done!")

if __name__ == '__main__':
    main()

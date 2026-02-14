#!/usr/bin/perl
use strict;
use warnings;

# Configuration
my $SOURCE_HTML = 'pages/pdf.html';
my $OUTPUT_HTML = 'PDF-Editor-Standalone.html';

# File Mappings
my %CSS_FILES = (
    '../css/app.css' => 'css/app.css',
    '../css/pdf.css' => 'css/pdf.css'
);

my %JS_FILES = (
    '../js/db.js' => 'js/db.js',
    '../js/app.js' => 'js/app.js',
    '../js/pdf.js' => 'js/pdf.js'
);

my %BASE64_FILES = (
    'pdf-lib' => 'pdf-lib-base64.txt',
    'pdf-js' => 'pdf-js-base64.txt',
    'pdf-worker' => 'pdf-worker-base64.txt'
);

sub read_file {
    my ($path) = @_;
    open my $fh, '<', $path or die "Cannot open file $path: $!";
    my $content = do { local $/; <$fh> };
    close $fh;
    return $content;
}

print "Reading source HTML: $SOURCE_HTML\n";
my $html_content = read_file($SOURCE_HTML);

# 1. Remove CDN Links (Fonts)
print "Removing CDN font links...\n";
$html_content =~ s|<link[^>]*href=["']https://cdn.jsdelivr.net/gh/orioncactus/pretendard[^"']*["'][^>]*>||g;
$html_content =~ s|<link[^>]*href=["']https://fonts.googleapis.com[^"']*["'][^>]*>||g;

# 2. Inline CSS
print "Inlining CSS files...\n";
while (my ($link_path, $local_path) = each %CSS_FILES) {
    print "  Processing $local_path...\n";
    my $css_content = read_file($local_path);
    my $replacement = "<style>\n/* Inlined from $local_path */\n$css_content\n</style>";
    
    # Escape dot and slash for regex
    my $escaped_link = quotemeta($link_path);
    # Regex to match href="..." with potential query strings or other attrs
    $html_content =~ s|<link[^>]*href=["']$escaped_link.*?["'][^>]*>|$replacement|gs;
}

# 3. Inline JS (Application Scripts)
print "Inlining Application JS files...\n";
while (my ($script_src, $local_path) = each %JS_FILES) {
    print "  Processing $local_path...\n";
    my $js_content = read_file($local_path);
    my $replacement = "<script>\n/* Inlined from $local_path */\n$js_content\n</script>";
    
    my $escaped_src = quotemeta($script_src);
    # Match script tag with src="..."
    $html_content =~ s|<script[^>]*src=["']$escaped_src.*?["'][^>]*>\s*</script>|$replacement|gs;
}

# 4. Remove CDN Library Scripts
print "Removing CDN Library scripts...\n";
$html_content =~ s|<script[^>]*src=["']https://cdn.jsdelivr.net/npm/pdf-lib[^"']*["'][^>]*>\s*</script>||gs;
$html_content =~ s|<script[^>]*src=["']https://cdnjs.cloudflare.com/ajax/libs/pdf.js/[^"']+/pdf.min.js["'][^>]*>\s*</script>||gs;
# Remove worker config script
$html_content =~ s|<script>\s*pdfjsLib\.GlobalWorkerOptions\.workerSrc\s*=[^<]*</script>||gs;

# 5. Inject Base64 Libraries
print "Reading Base64 libraries...\n";
my $pdf_lib_b64 = read_file($BASE64_FILES{'pdf-lib'});
$pdf_lib_b64 =~ s/^\s+|\s+$//g; # Trim
my $pdf_js_b64 = read_file($BASE64_FILES{'pdf-js'});
$pdf_js_b64 =~ s/^\s+|\s+$//g;
my $pdf_worker_b64 = read_file($BASE64_FILES{'pdf-worker'});
$pdf_worker_b64 =~ s/^\s+|\s+$//g;

print "Injecting Base64 Loader...\n";
my $loader_script = <<EOF;
<script>
(function() {
    console.log("Initializing Offline PDF Libraries...");
    
    // Base64 Data
    const PDF_LIB_B64 = "$pdf_lib_b64";
    const PDF_JS_B64 = "$pdf_js_b64";
    const PDF_WORKER_B64 = "$pdf_worker_b64";
    
    // Helper: Load Script from Base64
    function loadScript(base64Code) {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = "data:text/javascript;base64," + base64Code;
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }
    
    // Helper: Base64 to ArrayBuffer
    function base64ToUint8Array(base64) {
        const binary_string = window.atob(base64);
        const len = binary_string.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
            bytes[i] = binary_string.charCodeAt(i);
        }
        return bytes;
    }
    
    // Execution
    async function loadLibraries() {
        try {
            // 1. PDF-Lib
            await loadScript(PDF_LIB_B64);
            console.log("PDF-Lib loaded");
            
            // 2. PDF.js
            await loadScript(PDF_JS_B64);
            console.log("PDF.js loaded");
            
            // 3. Configure Worker
            if (window.pdfjsLib) {
                const workerBlob = new Blob([base64ToUint8Array(PDF_WORKER_B64)], { type: 'text/javascript' });
                const workerUrl = URL.createObjectURL(workerBlob);
                window.pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;
                console.log("PDF Worker configured");
            } else {
                console.error("pdfjsLib not found after load");
            }
            
        } catch (e) {
            console.error("Error loading libraries:", e);
            alert("라이브러리 로딩 실패: " + e.message);
        }
    }
    
    // Start Loading
    loadLibraries();
    
})();
</script>
EOF

# Insert loader before </head> or at top of body
if ($html_content =~ /<\/head>/) {
    $html_content =~ s|<\/head>|$loader_script\n</head>|;
} else {
    $html_content =~ s|<body>|<body>\n$loader_script|;
}

# 6. Write Output
print "Writing output to $OUTPUT_HTML...\n";
open my $out, '>', $OUTPUT_HTML or die "Cannot write output: $!";
print $out $html_content;
close $out;

print "Done!\n";

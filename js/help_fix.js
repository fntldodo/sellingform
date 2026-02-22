(function () {
    console.log('[HELP_FIX] Script loaded');

    function attach() {
        const btn = document.getElementById('btnHelp');
        if (btn) {
            console.log('[HELP_FIX] Button found');
            // Remove any existing listeners by cloning
            const newBtn = btn.cloneNode(true);
            btn.parentNode.replaceChild(newBtn, btn);

            newBtn.addEventListener('click', function (e) {
                console.log('[HELP_FIX] Button clicked');
                e.preventDefault();
                e.stopPropagation();

                const modal = document.getElementById('helpModal');
                if (modal) {
                    console.log('[HELP_FIX] Opening modal');
                    modal.classList.add('active');
                    modal.style.display = 'flex';
                    modal.style.zIndex = '10000'; // Higher than anything
                    modal.style.visibility = 'visible';
                    modal.style.opacity = '1';
                    modal.style.position = 'fixed';
                    modal.style.top = '0';
                    modal.style.left = '0';
                    modal.style.width = '100%';
                    modal.style.height = '100%';
                } else {
                    console.error('[HELP_FIX] Modal not found');
                }
            });
        } else {
            console.log('[HELP_FIX] Button not found, retrying...');
            setTimeout(attach, 500);
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', attach);
    } else {
        attach();
    }
})();

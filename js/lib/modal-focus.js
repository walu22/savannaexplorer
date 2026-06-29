const FOCUSABLE = 'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';

function getFocusable(container) {
    return Array.from(container.querySelectorAll(FOCUSABLE)).filter(
        el => el.offsetParent !== null || el === document.activeElement
    );
}

/**
 * Keep keyboard focus inside an open modal and restore it on close.
 */
export function createModalFocusManager(modalEl) {
    if (!modalEl) {
        return { open: () => {}, close: () => {} };
    }

    let restoreFocus = null;

    function onKeyDown(e) {
        if (e.key !== 'Tab' || !modalEl.classList.contains('active')) return;

        const focusable = getFocusable(modalEl);
        if (!focusable.length) {
            e.preventDefault();
            return;
        }

        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey && document.activeElement === first) {
            e.preventDefault();
            last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault();
            first.focus();
        }
    }

    function open() {
        restoreFocus = document.activeElement;
        modalEl.setAttribute('aria-modal', 'true');
        modalEl.setAttribute('role', 'dialog');
        document.addEventListener('keydown', onKeyDown);

        requestAnimationFrame(() => {
            const closeBtn = modalEl.querySelector('.modal-close');
            const focusable = getFocusable(modalEl);
            (closeBtn || focusable[0])?.focus();
        });
    }

    function close() {
        modalEl.removeAttribute('aria-modal');
        document.removeEventListener('keydown', onKeyDown);
        if (restoreFocus && typeof restoreFocus.focus === 'function') {
            restoreFocus.focus();
        }
        restoreFocus = null;
    }

    return { open, close };
}

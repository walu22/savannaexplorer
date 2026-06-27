export function showFormFeedback(element, message, type = 'success') {
    if (!element) return;

    element.textContent = message;
    element.hidden = false;
    element.classList.remove('form-feedback--success', 'form-feedback--error', 'form-feedback--info');
    element.classList.add(`form-feedback--${type}`);
}

export function clearFormFeedback(element) {
    if (!element) return;
    element.hidden = true;
    element.textContent = '';
}

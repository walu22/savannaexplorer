export function finalizeHubRoute(sectionId, { dismiss, setMeta }) {
    dismiss();
    setMeta(sectionId);
}

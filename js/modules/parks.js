export function initParks() {
    document.querySelectorAll('.park-filter').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.park-filter').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const filter = btn.getAttribute('data-filter');
            document.querySelectorAll('.park-card').forEach(card => {
                const match = filter === 'all' || card.getAttribute('data-country') === filter;
                card.classList.toggle('hidden', !match);
            });
        });
    });
}

import foodTravel from '../../data/food-travel.json';
import { filterFoodCountries, foodFilterSummary } from '../lib/food-planner.js';

function escapeHtml(value) {
    return String(value ?? '')
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');
}

function externalLink(url, label) {
    return `<a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(label)} <i class="fas fa-arrow-up-right-from-square" aria-hidden="true"></i></a>`;
}

function renderCountry(country) {
    const foods = country.foods.map(food => `<li>${escapeHtml(food)}</li>`).join('');
    const questions = country.ask.map(question => `<li>“${escapeHtml(question)}”</li>`).join('');
    return `
        <article class="food-country-card">
            <header class="food-country-card__header">
                <span class="food-country-card__flag" aria-hidden="true">${country.flag}</span>
                <div><span>Food planning guide</span><h4>${escapeHtml(country.name)}</h4></div>
            </header>
            <p class="food-country-card__lead">${escapeHtml(country.lead)}</p>
            <div class="food-country-card__section">
                <strong>Look for</strong>
                <ul class="food-chip-list">${foods}</ul>
            </div>
            <div class="food-country-card__section">
                <strong>Dietary reality check</strong>
                <p>${escapeHtml(country.dietaryNote)}</p>
            </div>
            <div class="food-country-card__questions">
                <strong>Ask before ordering</strong>
                <ul>${questions}</ul>
            </div>
            <footer>
                <a class="btn btn-primary btn-sm" href="/routes/${escapeHtml(country.routeId)}">Open matching route</a>
                <a class="btn btn-outline btn-sm" href="/countries/${escapeHtml(country.id)}">Country guide</a>
                ${externalLink(country.source.url, 'Source')}
            </footer>
        </article>`;
}

function renderRoute(route) {
    return `
        <article class="food-route-card">
            <span>${escapeHtml(route.countries)}</span>
            <h4>${escapeHtml(route.title)}</h4>
            <p>${escapeHtml(route.summary)}</p>
            <div><i class="fas fa-circle-info" aria-hidden="true"></i><span>${escapeHtml(route.note)}</span></div>
            <a href="/routes/${escapeHtml(route.routeId)}">Add this lens to the route <i class="fas fa-arrow-right" aria-hidden="true"></i></a>
        </article>`;
}

function renderPracticalItem(item, icon) {
    return `<article><i class="fas ${icon}" aria-hidden="true"></i><div><h4>${escapeHtml(item.title)}</h4><p>${escapeHtml(item.text)}</p></div></article>`;
}

function populateCountryFilter(select) {
    foodTravel.countries.forEach(country => {
        const option = document.createElement('option');
        option.value = country.id;
        option.textContent = `${country.flag} ${country.name}`;
        select.appendChild(option);
    });
}

export function initFoodPlanner() {
    const grid = document.getElementById('food-country-grid');
    const form = document.getElementById('food-planner-filters');
    if (!grid || !form) return;

    const countrySelect = document.getElementById('food-country-filter');
    const contextSelect = document.getElementById('food-context-filter');
    const dietarySelect = document.getElementById('food-dietary-filter');
    const count = document.getElementById('food-result-count');
    const summary = document.getElementById('food-results-summary');
    const empty = document.getElementById('food-empty-state');

    populateCountryFilter(countrySelect);
    document.getElementById('food-route-grid').innerHTML = foodTravel.routeIdeas.map(renderRoute).join('');
    document.getElementById('food-etiquette-list').innerHTML = foodTravel.etiquette.map(item => renderPracticalItem(item, 'fa-handshake-angle')).join('');
    document.getElementById('food-safety-list').innerHTML = foodTravel.safety.map(item => renderPracticalItem(item, 'fa-shield-heart')).join('');
    document.getElementById('food-source-grid').innerHTML = foodTravel.sources.map(source => `
        <article><span>${escapeHtml(source.type)}</span>${externalLink(source.url, source.label)}</article>`).join('');
    document.getElementById('food-planner-disclaimer').textContent = foodTravel.meta.disclaimer;

    const render = () => {
        const filters = { country: countrySelect.value, context: contextSelect.value, dietary: dietarySelect.value };
        const matches = filterFoodCountries(foodTravel.countries, filters);
        grid.innerHTML = matches.map(renderCountry).join('');
        count.textContent = String(matches.length);
        summary.textContent = foodFilterSummary(filters, matches.length);
        grid.hidden = matches.length === 0;
        empty.hidden = matches.length !== 0;
    };

    form.addEventListener('change', render);
    form.addEventListener('reset', () => window.setTimeout(render, 0));
    document.querySelector('[data-food-reset]')?.addEventListener('click', () => {
        form.reset();
        render();
        countrySelect.focus();
    });
    render();
}

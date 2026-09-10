function findElement(html, tag, matcher) {
    const openingTags = new RegExp(`<${tag}\\b[^>]*>`, 'gi');
    let opening;
    while ((opening = openingTags.exec(html))) {
        if (!matcher(opening[0])) continue;
        const tags = new RegExp(`<\\/?${tag}\\b[^>]*>`, 'gi');
        tags.lastIndex = opening.index;
        let depth = 0;
        let token;
        while ((token = tags.exec(html))) {
            if (token[0].startsWith(`</${tag}`)) depth -= 1;
            else depth += 1;
            if (depth === 0) {
                return {
                    start: opening.index,
                    end: tags.lastIndex,
                    html: html.slice(opening.index, tags.lastIndex),
                };
            }
        }
    }
    return null;
}

function elementById(html, id, tag) {
    return findElement(html, tag, opening => new RegExp(`\\bid="${id}"`, 'i').test(opening));
}

function removeById(html, id, tag) {
    const element = elementById(html, id, tag);
    return element ? `${html.slice(0, element.start)}${html.slice(element.end)}` : html;
}

function removeByClass(html, className, tag) {
    const element = findElement(html, tag, opening => {
        const match = opening.match(/\bclass="([^"]*)"/i);
        return match?.[1].split(/\s+/).includes(className);
    });
    return element ? `${html.slice(0, element.start)}${html.slice(element.end)}` : html;
}

function replaceAppMain(html, content) {
    const main = elementById(html, 'main-content', 'main');
    if (!main) return html;
    const openingEnd = main.html.indexOf('>') + 1;
    const replacement = `${main.html.slice(0, openingEnd)}\n${content}\n</main>`;
    return `${html.slice(0, main.start)}${replacement}${html.slice(main.end)}`;
}

function buildWorkspace(root) {
    return `<section class="my-safari-page" aria-labelledby="my-safari-page-title">
        <div class="container my-safari-page__container">
            <header class="my-safari-page__header">
                <div class="my-safari-page__intro">
                    <span class="my-safari-page__eyebrow">Your travel workspace</span>
                    <h1 id="my-safari-page-title">My Safari</h1>
                    <p>Build the journey day by day, keep confirmations together and know what still needs attention before you leave.</p>
                </div>
                <div class="my-safari-page__privacy">
                    <i class="fas fa-lock" aria-hidden="true"></i>
                    <span><strong>Private by default</strong>Sign in only when you want cloud sync or collaboration.</span>
                </div>
            </header>
            <nav class="my-safari-page__nav" aria-label="My Safari workspace sections">
                <a href="#hub-my-safari" aria-current="page"><i class="fas fa-suitcase-rolling" aria-hidden="true"></i> Trips</a>
                <a href="#my-safari-route-builder" aria-disabled="true" tabindex="-1"><i class="fas fa-route" aria-hidden="true"></i> Itinerary</a>
                <a href="#my-safari-bookings" aria-disabled="true" tabindex="-1"><i class="fas fa-receipt" aria-hidden="true"></i> Bookings</a>
                <a href="#my-safari-readiness" aria-disabled="true" tabindex="-1"><i class="fas fa-list-check" aria-hidden="true"></i> Readiness</a>
                <a href="#my-safari-pack-builder" aria-disabled="true" tabindex="-1"><i class="fas fa-file-arrow-down" aria-hidden="true"></i> Trip pack</a>
            </nav>
            ${root}
        </div>
    </section>`;
}

/**
 * Direct My Safari loads use a dedicated working shell instead of carrying the
 * entire planning hub and every hidden homepage section. The retained element
 * IDs are the public contract used by the existing planner module.
 */
export function pruneMySafariShell(html, mySafariStylesheet) {
    const root = elementById(html, 'hub-my-safari', 'div')?.html;
    if (!root) return html;

    let output = html.replace(
        '<body class="site-v2">',
        '<body class="site-v2 my-safari-route-shell">',
    );
    output = replaceAppMain(output, buildWorkspace(root));
    output = removeByClass(output, 'scroll-progress-container', 'div');
    output = removeById(output, 'home', 'section');
    output = removeById(output, 'country-detail-view', 'section');
    output = removeById(output, 'planning-guide-modal', 'div');
    output = removeById(output, 'ai-planner-sidebar', 'div');
    output = removeById(output, 'chat-fab', 'button');
    output = removeById(output, 'pwa-install-banner', 'div');

    if (mySafariStylesheet) {
        output = output.replace(
            /<link rel="stylesheet"(?: crossorigin)? href="(?:\/assets\/index-[^"]+\.css|\/css\/main\.css)">/i,
            `<link rel="stylesheet" crossorigin href="/${mySafariStylesheet}">`,
        );
    }

    return output;
}

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
                return { start: opening.index, end: tags.lastIndex };
            }
        }
    }
    return null;
}

function removeElement(html, tag, matcher) {
    const element = findElement(html, tag, matcher);
    return element ? `${html.slice(0, element.start)}${html.slice(element.end)}` : html;
}

function removeById(html, id, tag) {
    return removeElement(html, tag, opening => new RegExp(`\\bid="${id}"`, 'i').test(opening));
}

function removeByClass(html, className, tag) {
    return removeElement(html, tag, opening => {
        const match = opening.match(/\bclass="([^"]*)"/i);
        return match?.[1].split(/\s+/).includes(className);
    });
}

/**
 * Country routes use their own fixed guide shell. The homepage, hub panels and
 * global overlays are useful during in-app navigation, but are dead payload on
 * a direct /countries/:id request. Remove them from the generated HTML while
 * retaining crawlable SEO copy, the complete country guide and the app entry.
 */
export function pruneCountryShell(html, countryStylesheet) {
    let output = html.replace(
        '<body class="site-v2">',
        '<body class="site-v2 country-route-shell">',
    );

    output = removeByClass(output, 'scroll-progress-container', 'div');
    output = output.replace(/\s*<a href="#main-content" class="skip-link">[\s\S]*?<\/a>/i, '');
    output = removeById(output, 'navbar', 'nav');
    output = removeById(output, 'mobile-nav-panel', 'div');
    output = removeById(output, 'home', 'section');
    output = removeById(output, 'main-content', 'main');
    output = removeElement(output, 'footer', () => true);
    output = removeById(output, 'planning-guide-modal', 'div');
    output = removeById(output, 'ai-planner-sidebar', 'div');
    output = removeById(output, 'chat-fab', 'button');
    output = removeById(output, 'pwa-install-banner', 'div');

    if (countryStylesheet) {
        output = output.replace(
            /<link rel="stylesheet"(?: crossorigin)? href="(?:\/assets\/index-[^"]+\.css|\/css\/main\.css)">/i,
            `<link rel="stylesheet" crossorigin href="/${countryStylesheet}">`,
        );
    }

    return output;
}

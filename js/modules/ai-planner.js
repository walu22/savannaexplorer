import marketplaceData from '../../data/marketplace.json';

// Helper: Find matching local catalog experiences with robust mappings
function getMatchingExperiences(destination, style, budget) {
    let matched = [];
    
    // Normalize style mapping to keys in marketplaceData (safari, adventure, culture, nature)
    const styleMap = {
        'safari': 'safari',
        'luxury safari': 'safari',
        'safari & wildlife': 'safari',
        'adventure': 'adventure',
        'high adventure': 'adventure',
        'scenic & adventure': 'adventure',
        'culture': 'culture',
        'cultural immersion': 'culture',
        'nature': 'nature',
        'scenic & nature': 'nature'
    };

    // Normalize budget mapping to price_range strings ($, $$, $$$, $$$$)
    const budgetMap = {
        '$': '$$', // Map single dollar to $$ to ensure we get results and don't end up empty
        'value ($)': '$$',
        '$$': '$$',
        'classic ($$)': '$$',
        'comfort ($$)': '$$',
        '$$$': '$$$',
        'luxury ($$$)': '$$$',
        '$$$$': '$$$$',
        'ultra luxe ($$$$)': '$$$$',
        'ultra luxury ($$$$)': '$$$$'
    };

    const targetKey = styleMap[style.toLowerCase()] || null;
    const targetBudgetStr = budgetMap[budget.toLowerCase()] || null;

    // Read keys to scan
    const keysToScan = targetKey ? [targetKey] : Object.keys(marketplaceData);

    keysToScan.forEach(key => {
        const items = marketplaceData[key] || [];
        items.forEach(item => {
            let isMatch = true;

            // Filter by Destination (Country)
            if (destination && destination !== 'All' && destination !== 'Southern Africa') {
                if (item.location.toLowerCase() !== destination.toLowerCase()) {
                    isMatch = false;
                }
            }

            // Filter by Budget (allow soft-matching to prevent empty results)
            if (budget && budget !== 'All' && targetBudgetStr) {
                if (budget.toLowerCase().includes('$') && !budget.includes('$$')) {
                    // This matches '$' or 'value ($)'
                    if (item.price_range !== '$' && item.price_range !== '$$') {
                        isMatch = false;
                    }
                } else if (item.price_range !== targetBudgetStr) {
                    isMatch = false;
                }
            }

            if (isMatch) {
                matched.push(item);
            }
        });
    });

    return matched;
}

// Main initialization function
export function initAiPlanner() {
    const sidebar = document.getElementById('ai-planner-sidebar');
    const openSidebarBtn = document.getElementById('open-ai-planner');
    const closeSidebarBtn = document.getElementById('close-ai-planner');

    const sidebarCountry = document.getElementById('sidebar-country');
    const sidebarDuration = document.getElementById('sidebar-duration');
    const sidebarCategory = document.getElementById('sidebar-category');
    const sidebarBudget = document.getElementById('sidebar-budget');
    const sidebarGenerateBtn = document.getElementById('sidebar-generate-itinerary-btn');

    const sidebarLoading = document.getElementById('ai-loading');
    const sidebarResult = document.getElementById('ai-result');
    const sidebarMarkdownContent = document.getElementById('ai-markdown-content');
    const sidebarBackBtn = document.getElementById('ai-back-btn');

    // Show/Hide Sidebar handlers
    if (openSidebarBtn && sidebar) {
        openSidebarBtn.addEventListener('click', (e) => {
            e.preventDefault();
            sidebar.classList.add('open');
            sidebar.setAttribute('aria-hidden', 'false');
        });
    }

    if (closeSidebarBtn && sidebar) {
        closeSidebarBtn.addEventListener('click', () => {
            sidebar.classList.remove('open');
            sidebar.setAttribute('aria-hidden', 'true');
        });
    }

    // Generate function for Sidebar
    if (sidebarGenerateBtn) {
        sidebarGenerateBtn.addEventListener('click', async () => {
            const country = sidebarCountry ? sidebarCountry.value : 'All';
            const duration = sidebarDuration ? sidebarDuration.value : 5;
            const category = sidebarCategory ? sidebarCategory.value : 'All';
            const budget = sidebarBudget ? sidebarBudget.value : 'All';

            // Show loading state
            const inputContainer = document.getElementById('ai-planner-form');
            if (inputContainer) inputContainer.classList.add('hidden');
            if (sidebarLoading) sidebarLoading.classList.remove('hidden');
            if (sidebarResult) sidebarResult.classList.add('hidden');

            // Fetch local catalog matches matching structural criteria
            const localMatches = getMatchingExperiences(
                country, 
                category === 'All' ? 'luxury safari' : category, 
                budget === 'All' ? 'classic ($$)' : budget
            );

            try {
                // Fetch generated itinerary from the secure Google Cloud Run relay endpoint
                const response = await fetch('https://savannaexplorer-relay-550454647742.europe-west1.run.app/api/itinerary/generate', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        country: country === 'All' ? 'Southern Africa' : country,
                        duration,
                        category,
                        budget,
                        matches: localMatches
                    })
                });

                if (!response.ok) {
                    throw new Error(`Relay API Error: Status ${response.status}`);
                }

                const data = await response.json();
                if (!data.itinerary) {
                    throw new Error("Invalid or empty response from secure relay.");
                }

                let itineraryMarkdown = data.itinerary;
                // Strip markdown wrap patterns if included
                itineraryMarkdown = itineraryMarkdown.replace(/^```markdown\s*/i, '').replace(/```$/, '');

                if (sidebarMarkdownContent) {
                    if (typeof marked !== 'undefined') {
                        sidebarMarkdownContent.innerHTML = marked.parse(itineraryMarkdown);
                    } else {
                        sidebarMarkdownContent.innerHTML = `<pre style="white-space: pre-wrap;">${itineraryMarkdown}</pre>`;
                    }
                }

                if (sidebarLoading) sidebarLoading.classList.add('hidden');
                if (sidebarResult) sidebarResult.classList.remove('hidden');

            } catch (error) {
                console.error("Failed to generate sidebar itinerary:", error);
                alert(`Failed to generate itinerary: ${error.message}`);
                if (sidebarLoading) sidebarLoading.classList.add('hidden');
                if (inputContainer) inputContainer.classList.remove('hidden');
            }
        });
    }

    // Back Button handler for Sidebar
    if (sidebarBackBtn) {
        sidebarBackBtn.addEventListener('click', () => {
            const inputContainer = document.getElementById('ai-planner-form');
            if (inputContainer) inputContainer.classList.remove('hidden');
            if (sidebarResult) sidebarResult.classList.add('hidden');
        });
    }
}

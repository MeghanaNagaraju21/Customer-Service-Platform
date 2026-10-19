
document.addEventListener("DOMContentLoaded", () => {
    const ticketDetails = document.getElementById("ticket-details");
    const solutionResult = document.getElementById("solution-result");

    function escapeHTML(value) {
        return String(value ?? "").replace(/[&<>"']/g, character => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        })[character]);
    }

    const savedTicket = sessionStorage.getItem(
        "resolverHubCurrentTicket"
    );

    if (!savedTicket) {
        ticketDetails.innerHTML =
            "<p>No ticket details found. Please create a ticket first.</p>";

        solutionResult.innerHTML =
            "<p>No solution can be displayed without a ticket.</p>";
        return;
    }

    let ticket;

    try {
        ticket = JSON.parse(savedTicket);
    } catch (error) {
        ticketDetails.textContent = "Ticket details could not be loaded.";
        solutionResult.textContent = "Please create a new support ticket.";
        return;
    }

    const issue = ticket.issue || "";
    const normalize = text => String(text || "")
        .toLowerCase()
        .replace(/[^\w\s]/g, " ")
        .replace(/\s+/g, " ")
        .trim();

    ticketDetails.innerHTML = `
        <p><strong>Ticket ID:</strong> ${escapeHTML(ticket.id ?? "N/A")}</p>
        <p><strong>Customer:</strong> ${escapeHTML(ticket.customerName)}</p>
        <p><strong>Problem:</strong> ${escapeHTML(issue)}</p>
        <p><strong>Status:</strong> ${escapeHTML(ticket.status || "Open")}</p>
    `;

    
    const query = normalize(issue);

    // Match only when the problem contains meaningful words
    // from a Knowledge Base article title.
    const stopWords = new Set([
        "the", "and", "for", "with", "from", "this",
        "that", "have", "has", "are", "was", "not",
        "my", "some", "please", "problem", "issue"
    ]);

    const words = query
        .split(" ")
        .filter(word => word.length > 2 && !stopWords.has(word));

    const matches = (Array.isArray(knowledgeBase) ? knowledgeBase : [])
        .map(article => {
            const title = normalize(article.title);
            const titleWords = title
                .split(" ")
                .filter(word => word.length > 2 && !stopWords.has(word));

            let score = 0;

            // Exact title match
            if (title === query) {
                score = 100;
            } else {
                // Require at least one meaningful title-word match.
                const matchedWords = titleWords.filter(word =>
                    words.includes(word)
                );

                if (matchedWords.length > 0) {
                    score = matchedWords.length / titleWords.length;
                }
            }

            return { article, score };
        })
        .filter(result => result.score > 0)
        .sort((a, b) => b.score - a.score);


    if (matches.length > 0) {
        const bestMatch = matches[0].article;

        solutionResult.innerHTML = `
            <div class="knowledge-result">
                <h3>${escapeHTML(bestMatch.title)}</h3>
                <p>${escapeHTML(bestMatch.solution)}</p>
            </div>
        `;
    } else {
        solutionResult.innerHTML = `
            <div class="knowledge-result">
                <h3>No Matching Solution Found</h3>
                <p>We could not find a relevant answer in our Knowledge Base.</p>
                <p>Your ticket has been saved for further assistance.</p>
            </div>
        `;
    }
});

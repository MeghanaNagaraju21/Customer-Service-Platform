
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
    const words = query.split(" ").filter(word => word.length > 2);

    const matches = (Array.isArray(knowledgeBase) ? knowledgeBase : [])
        .map(article => {
            const title = normalize(article.title);
            const solution = normalize(article.solution);

            let score = 0;

            if (title === query) {
                score += 20;
            } else if (title.includes(query) || query.includes(title)) {
                score += 10;
            }

            words.forEach(word => {
                if (title.includes(word)) {
                    score += 3;
                } else if (solution.includes(word)) {
                    score += 1;
                }
            });

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

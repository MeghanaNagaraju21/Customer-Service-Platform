
const API_BASE_URL =
    "https://customer-service-platform-backend.onrender.com/api/tickets";

// Knowledge Base is defined in data.js.
// Do not declare const knowledgeBase again in this file.

document.addEventListener("DOMContentLoaded", () => {
    const searchInput = document.getElementById("search-input");
    const searchButton = document.getElementById("search-button");
    const searchResults = document.getElementById("search-results");

    const ticketForm = document.getElementById("ticket-form");
    const customerNameInput = document.getElementById("customer-name");
    const issueInput = document.getElementById("issue");
    const ticketMessage = document.getElementById("ticket-message");

    const ticketListContainer =
        document.getElementById("ticket-list-container");
    const ticketFilter = document.getElementById("ticket-filter");

    const totalTicketsElement =
        document.getElementById("total-tickets");
    const openTicketsElement =
        document.getElementById("open-tickets");
    const resolvedTicketsElement =
        document.getElementById("resolved-tickets");

    let tickets = [];

    // ---------------- KNOWLEDGE BASE SEARCH ----------------

    function normalizeText(text) {
        return String(text || "")
            .toLowerCase()
            .replace(/[^\w\s]/g, " ")
            .replace(/\s+/g, " ")
            .trim();
    }

    function searchKnowledgeBase() {
        const query = normalizeText(searchInput.value);

        if (!query) {
            searchResults.innerHTML =
                "<p>Please enter a problem to search.</p>";
            return;
        }

        const words = query
            .split(" ")
            .filter(word => word.length > 1);

        const results = knowledgeBase
            .map(article => {
                const title = normalizeText(article.title);
                const solution = normalizeText(article.solution);

                let score = 0;

                if (title.includes(query)) {
                    score += 10;
                }

                if (solution.includes(query)) {
                    score += 3;
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
            .filter(item => item.score > 0)
            .sort((a, b) => b.score - a.score);

        
if (results.length === 0) {
    searchResults.innerHTML = `
        <div class="knowledge-result">
            <h3>General Troubleshooting Solution</h3>
            <p>No exact solution found. Try these general steps:</p>
            <ol>
                <li>Restart your device and the application.</li>
                <li>Check your internet connection and settings.</li>
                <li>Check for available software updates.</li>
                <li>If the issue continues, create a support ticket for further assistance.</li>
            </ol>
        </div>
    `;
    return;
}

            searchResults.innerHTML = `
                <p>No results found. Please try another search.</p>
                <p>If you still need help, create a support ticket below.</p>
            `;
            return;
        }

        searchResults.innerHTML = results
            .map(({ article }) => `
                <div class="knowledge-result">
                    <h3>${escapeHTML(article.title)}</h3>
                    <p>${escapeHTML(article.solution)}</p>
                </div>
            `)
            .join("");
    }

    searchButton.addEventListener("click", searchKnowledgeBase);

    searchInput.addEventListener("keydown", event => {
        if (event.key === "Enter") {
            event.preventDefault();
            searchKnowledgeBase();
        }
    });

    // ---------------- SAFE HTML TEXT ----------------

    function escapeHTML(value) {
        return String(value ?? "").replace(/[&<>"']/g, character => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        })[character]);
    }

    // ---------------- DASHBOARD ----------------

    function updateDashboard() {
        totalTicketsElement.textContent = tickets.length;

        openTicketsElement.textContent = tickets.filter(ticket =>
            String(ticket.status || "").toLowerCase() === "open"
        ).length;

        resolvedTicketsElement.textContent = tickets.filter(ticket =>
            String(ticket.status || "").toLowerCase() === "resolved"
        ).length;
    }

    // ---------------- LOAD TICKETS ----------------

    async function loadTickets() {
        try {
            const response = await fetch(API_BASE_URL);

            if (!response.ok) {
                throw new Error("Unable to load tickets.");
            }

            const data = await response.json();

            tickets = Array.isArray(data) ? data : [];

            updateDashboard();
            renderTickets();
        } catch (error) {
            console.error("Load tickets error:", error);

            ticketListContainer.innerHTML =
                "<p>Unable to load tickets. Please try again later.</p>";
        }
    }

    // ---------------- DISPLAY TICKETS ----------------

    function renderTickets() {
        const selectedFilter = ticketFilter.value;

        const filteredTickets = tickets.filter(ticket => {
            if (selectedFilter === "All") {
                return true;
            }

            return String(ticket.status || "").toLowerCase() ===
                selectedFilter.toLowerCase();
        });

        if (filteredTickets.length === 0) {
            ticketListContainer.innerHTML =
                "<p>No tickets found for this filter.</p>";
            return;
        }

        ticketListContainer.innerHTML = filteredTickets
            .map(ticket => {
                const id = ticket.id ?? ticket.ticketId;
                const customerName =
                    ticket.customerName ?? ticket.name ?? "Customer";
                const problem =
                    ticket.problem ?? ticket.issue ?? ticket.description ?? "";
                const status = ticket.status || "Open";

                const safeId = escapeHTML(id);
                const safeStatus = escapeHTML(status);

                return `
                    <div class="ticket-card">
                        <h3>Ticket #${safeId}</h3>
                        <p><strong>Customer:</strong>
                            ${escapeHTML(customerName)}</p>
                        <p><strong>Problem:</strong>
                            ${escapeHTML(problem)}</p>
                        <p><strong>Status:</strong>
                            <span class="status-badge">
                                ${safeStatus}
                            </span>
                        </p>
                        <div class="ticket-actions">
                            ${
                                status.toLowerCase() !== "resolved"
                                ? `<button type="button"
                                    data-action="resolve"
                                    data-id="${safeId}">
                                    Resolve
                                   </button>`
                                : ""
                            }
                            <button type="button"
                                data-action="delete"
                                data-id="${safeId}">
                                Delete
                            </button>
                        </div>
                    </div>
                `;
            })
            .join("");
    }

    ticketFilter.addEventListener("change", renderTickets);

    // ---------------- CREATE TICKET ----------------

    ticketForm.addEventListener("submit", async event => {
        event.preventDefault();

        const customerName = customerNameInput.value.trim();
        const problem = issueInput.value.trim();

        if (!customerName || !problem) {
            ticketMessage.textContent =
                "Please enter your name and problem.";
            return;
        }

        try {
            const response = await fetch(API_BASE_URL, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
               
body: JSON.stringify({
    customerName: customerName,
    issue: problem,
    status: "Open"
})

            });

            if (!response.ok) {
                throw new Error("Ticket creation failed.");
            }

            ticketMessage.textContent =
                "Ticket created and saved to the database successfully!";

            ticketForm.reset();

            await loadTickets();
        } catch (error) {
            console.error("Create ticket error:", error);

            ticketMessage.textContent =
                "Unable to create ticket. Please try again.";
        }
    });

    // ---------------- RESOLVE / DELETE TICKET ----------------

    ticketListContainer.addEventListener("click", async event => {
        const button = event.target.closest("button[data-action]");

        if (!button) {
            return;
        }

        const action = button.dataset.action;
        const ticketId = button.dataset.id;

        if (!ticketId || ticketId === "undefined") {
            alert("Ticket ID is missing.");
            return;
        }

        if (action === "delete") {
            if (!confirm("Are you sure you want to delete this ticket?")) {
                return;
            }
        }

        try {
            let response;

            if (action === "resolve") {
                response = await fetch(
                    `${API_BASE_URL}/${encodeURIComponent(ticketId)}`,
                    {
                        method: "PUT",
                        headers: {
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify({
                            status: "Resolved"
                        })
                    }
                );
            } else if (action === "delete") {
                response = await fetch(
                    `${API_BASE_URL}/${encodeURIComponent(ticketId)}`,
                    {
                        method: "DELETE"
                    }
                );
            } else {
                return;
            }

            if (!response.ok) {
                throw new Error(`Unable to ${action} ticket.`);
            }

            await loadTickets();
        } catch (error) {
            console.error(`${action} ticket error:`, error);

            alert(
                `Could not ${action} the ticket. Please check the backend.`
            );
        }
    });

    // Load saved tickets when the page opens.
    loadTickets();
});

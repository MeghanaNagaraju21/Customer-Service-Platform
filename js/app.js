
const API_BASE_URL =
    "https://customer-service-platform-backend.onrender.com/api/tickets";

const ticketForm = document.getElementById("ticket-form");
const ticketMessage = document.getElementById("ticket-message");
const ticketList = document.getElementById("ticket-list-container");

const totalTickets = document.getElementById("total-tickets");
const openTickets = document.getElementById("open-tickets");
const resolvedTickets = document.getElementById("resolved-tickets");

const searchInput = document.getElementById("search-input");
const searchButton = document.getElementById("search-button");
const searchResults = document.getElementById("search-results");
const ticketFilter = document.getElementById("ticket-filter");

let tickets = [];

// Show messages to the user
function showMessage(message, isError = false) {
    ticketMessage.textContent = message;
    ticketMessage.style.color = isError ? "#dc2626" : "";
}

// Read server responses safely
async function readResponse(response) {
    const text = await response.text();

    if (!response.ok) {
        throw new Error(
            `HTTP ${response.status}: ${text || response.statusText}`
        );
    }

    if (!text.trim()) {
        return null;
    }

    try {
        return JSON.parse(text);
    } catch {
        throw new Error("The server returned an invalid response.");
    }
}

// Knowledge Base Search
function performSearch() {
    const searchText = searchInput.value.trim().toLowerCase();

    if (!searchText) {
        searchResults.textContent =
            "Please enter a problem to search.";
        return;
    }

    // knowledgeBase is defined in data.js
    const results = knowledgeBase.filter(function (item) {
        return (
            item.title.toLowerCase().includes(searchText) ||
            item.solution.toLowerCase().includes(searchText)
        );
    });

    searchResults.innerHTML = "";

    if (results.length === 0) {
        searchResults.textContent =
            "No results found. Please try another search.";
        return;
    }

    results.forEach(function (item) {
        const title = document.createElement("h3");
        title.textContent = item.title;

        const solution = document.createElement("p");
        solution.textContent = item.solution;

        searchResults.appendChild(title);
        searchResults.appendChild(solution);
    });
}

searchButton.addEventListener("click", performSearch);

searchInput.addEventListener("keydown", function (event) {
    if (event.key === "Enter") {
        event.preventDefault();
        performSearch();
    }
});

// Load tickets from the deployed backend
async function loadTickets() {
    try {
        const response = await fetch(API_BASE_URL);
        const data = await readResponse(response);

        if (!Array.isArray(data)) {
            throw new Error("The tickets API did not return a list.");
        }

        tickets = data;
        displayTickets();
        updateDashboard();
    } catch (error) {
        console.error("Load tickets error:", error);

        showMessage(
            "Could not load tickets. Check the backend connection.",
            true
        );
    }
}

// Update dashboard counts
function updateDashboard() {
    totalTickets.textContent = tickets.length;

    openTickets.textContent = tickets.filter(function (ticket) {
        return ticket.status === "Open";
    }).length;

    resolvedTickets.textContent = tickets.filter(function (ticket) {
        return ticket.status === "Resolved";
    }).length;
}

// Display tickets and apply the selected filter
function displayTickets() {
    ticketList.innerHTML = "";

    const selectedFilter = ticketFilter.value;

    const filteredTickets = tickets.filter(function (ticket) {
        return (
            selectedFilter === "All" ||
            ticket.status === selectedFilter
        );
    });

    if (tickets.length === 0) {
        ticketList.textContent = "No tickets created yet.";
        return;
    }

    if (filteredTickets.length === 0) {
        ticketList.textContent =
            "No tickets found for this filter.";
        return;
    }

    filteredTickets.forEach(function (ticket) {
        const card = document.createElement("div");
        card.className = "ticket-card";

        const title = document.createElement("h3");
        title.textContent = "Ticket #" + ticket.id;

        const name = document.createElement("p");
        name.textContent = "Customer: " + ticket.customerName;

        const issue = document.createElement("p");
        issue.textContent = "Problem: " + ticket.issue;

        const status = document.createElement("p");
        status.textContent = "Status: " + ticket.status;
        status.className =
            "status-badge " +
            (ticket.status === "Resolved"
                ? "status-resolved"
                : "status-open");

        card.append(title, name, issue, status);

        // Resolve ticket
        if (ticket.status !== "Resolved") {
            const resolveButton = document.createElement("button");
            resolveButton.textContent = "Resolve";
            resolveButton.className = "resolve-button";

            resolveButton.addEventListener("click", async function () {
                resolveButton.disabled = true;

                try {
                    const response = await fetch(
                        `${API_BASE_URL}/${ticket.id}`,
                        {
                            method: "PUT",
                            headers: {
                                "Content-Type": "application/json"
                            },
                            body: JSON.stringify({
                                customerName: ticket.customerName,
                                issue: ticket.issue,
                                status: "Resolved"
                            })
                        }
                    );

                    const updatedTicket = await readResponse(response);

                    if (
                        updatedTicket &&
                        updatedTicket.id !== undefined
                    ) {
                        const index = tickets.findIndex(function (item) {
                            return item.id === updatedTicket.id;
                        });

                        if (index !== -1) {
                            tickets[index] = updatedTicket;
                        } else {
                            await loadTickets();
                        }
                    } else {
                        await loadTickets();
                    }

                    displayTickets();
                    updateDashboard();
                    showMessage("Ticket resolved successfully!");
                } catch (error) {
                    console.error("Resolve error:", error);
                    showMessage(
                        "Could not resolve ticket. Check Console for details.",
                        true
                    );
                    resolveButton.disabled = false;
                }
            });

            card.appendChild(resolveButton);
        }

        // Delete ticket
        const deleteButton = document.createElement("button");
        deleteButton.textContent = "Delete";
        deleteButton.className = "delete-button";

        deleteButton.addEventListener("click", async function () {
            const confirmed = window.confirm(
                "Are you sure you want to delete this ticket?"
            );

            if (!confirmed) {
                return;
            }

            deleteButton.disabled = true;

            try {
                const response = await fetch(
                    `${API_BASE_URL}/${ticket.id}`,
                    { method: "DELETE" }
                );

                await readResponse(response);

                tickets = tickets.filter(function (item) {
                    return item.id !== ticket.id;
                });

                displayTickets();
                updateDashboard();
                showMessage("Ticket deleted successfully!");
            } catch (error) {
                console.error("Delete error:", error);
                showMessage(
                    "Could not delete ticket. Check Console for details.",
                    true
                );
                deleteButton.disabled = false;
            }
        });

        card.appendChild(deleteButton);
        ticketList.appendChild(card);
    });
}

// Create a ticket
ticketForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    const customerName =
        document.getElementById("customer-name").value.trim();

    const issue =
        document.getElementById("issue").value.trim();

    if (!customerName || !issue) {
        showMessage("Please fill in all fields.", true);
        return;
    }

    const submitButton = ticketForm.querySelector(
        'button[type="submit"], input[type="submit"]'
    );

    if (submitButton) {
        submitButton.disabled = true;
    }

    try {
        const response = await fetch(API_BASE_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                customerName: customerName,
                issue: issue
            })
        });

        const newTicket = await readResponse(response);

        if (
            !newTicket ||
            newTicket.id === undefined
        ) {
            throw new Error(
                "The server did not return the created ticket."
            );
        }

        tickets.push(newTicket);

        displayTickets();
        updateDashboard();

        showMessage(
            "Ticket created and saved to the database successfully!"
        );

        ticketForm.reset();
    } catch (error) {
        console.error("Ticket creation error:", error);

        showMessage(
            "Ticket save failed: " + error.message,
            true
        );
    } finally {
        if (submitButton) {
            submitButton.disabled = false;
        }
    }
});

// Ticket filter
ticketFilter.addEventListener("change", displayTickets);

// Load tickets when the page opens
loadTickets();

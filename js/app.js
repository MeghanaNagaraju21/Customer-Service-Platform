
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

// Knowledge Base Search
function performSearch() {
    const searchText = searchInput.value.trim().toLowerCase();

    if (searchText === "") {
        searchResults.textContent = "Please enter a problem to search.";
        return;
    }

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

// Ticket data
let tickets = [];

// Load tickets from backend
async function loadTickets() {
    try {
        const response = await fetch("http://localhost:8080/api/tickets");

        if (!response.ok) {
            throw new Error("Could not load tickets");
        }

        tickets = await response.json();

        displayTickets();
        updateDashboard();
    } catch (error) {
        console.error("Load tickets error:", error);
        ticketMessage.textContent =
            "Could not load tickets. Check the backend.";
    }
}

// Update dashboard
function updateDashboard() {
    totalTickets.textContent = tickets.length;

    openTickets.textContent = tickets.filter(function (ticket) {
        return ticket.status === "Open";
    }).length;

    resolvedTickets.textContent = tickets.filter(function (ticket) {
        return ticket.status === "Resolved";
    }).length;
}

// Display tickets
function displayTickets() {
    ticketList.innerHTML = "";

    const selectedFilter = ticketFilter.value;

    const filteredTickets = tickets.filter(function (ticket) {
        return selectedFilter === "All" ||
            ticket.status === selectedFilter;
    });

    if (tickets.length === 0) {
        ticketList.textContent = "No tickets created yet.";
        return;
    }

    if (filteredTickets.length === 0) {
        ticketList.textContent = "No tickets found for this filter.";
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

        // Status badge styling
        status.className = "status-badge " +
            (ticket.status === "Resolved"
                ? "status-resolved"
                : "status-open");

        card.appendChild(title);
        card.appendChild(name);
        card.appendChild(issue);
        card.appendChild(status);

        // Resolve ticket
        if (ticket.status !== "Resolved") {
            const resolveButton = document.createElement("button");
            resolveButton.textContent = "Resolve";
            resolveButton.className = "resolve-button";

            resolveButton.addEventListener("click", async function () {
                try {
                    const response = await fetch(
                        "http://localhost:8080/api/tickets/" + ticket.id,
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

                    if (!response.ok) {
                        throw new Error("Could not resolve ticket");
                    }

                    const updatedTicket = await response.json();

                    const index = tickets.findIndex(function (item) {
                        return item.id === updatedTicket.id;
                    });

                    if (index !== -1) {
                        tickets[index] = updatedTicket;
                    }

                    displayTickets();
                    updateDashboard();

                    ticketMessage.textContent =
                        "Ticket resolved successfully!";
                } catch (error) {
                    console.error("Resolve error:", error);
                    ticketMessage.textContent =
                        "Could not resolve ticket.";
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

            try {
                const response = await fetch(
                    "http://localhost:8080/api/tickets/" + ticket.id,
                    {
                        method: "DELETE"
                    }
                );

                if (!response.ok) {
                    throw new Error("Could not delete ticket");
                }

                tickets = tickets.filter(function (item) {
                    return item.id !== ticket.id;
                });

                displayTickets();
                updateDashboard();

                ticketMessage.textContent =
                    "Ticket deleted successfully!";
            } catch (error) {
                console.error("Delete error:", error);
                ticketMessage.textContent =
                    "Could not delete ticket.";
            }
        });

        card.appendChild(deleteButton);
        ticketList.appendChild(card);
    });
}

// Create ticket
ticketForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    const customerName =
        document.getElementById("customer-name").value.trim();

    const issue =
        document.getElementById("issue").value.trim();

    if (customerName === "" || issue === "") {
        ticketMessage.textContent = "Please fill in all fields.";
        return;
    }

    try {
        const response = await fetch("http://localhost:8080/api/tickets", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                customerName: customerName,
                issue: issue
            })
        });

        if (!response.ok) {
            throw new Error(
                "Failed to save ticket. HTTP " + response.status
            );
        }

        const newTicket = await response.json();

        tickets.push(newTicket);

        displayTickets();
        updateDashboard();

        ticketMessage.textContent =
            "Ticket created and saved to database successfully!";

        ticketForm.reset();

    } catch (error) {
        console.error("Ticket error:", error);

        ticketMessage.textContent =
            "Ticket save failed. Check the backend and try again.";
    }
});

// Ticket filter event
ticketFilter.addEventListener("change", displayTickets);

// Load tickets when page opens
loadTickets();

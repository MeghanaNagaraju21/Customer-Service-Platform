
const API_BASE_URL =
    "https://customer-service-platform-backend.onrender.com/api/tickets";

document.addEventListener("DOMContentLoaded", () => {
    const ticketForm = document.getElementById("ticket-form");
    const customerNameInput = document.getElementById("customer-name");
    const issueInput = document.getElementById("issue");
    const ticketMessage = document.getElementById("ticket-message");

    ticketForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const customerName = customerNameInput.value.trim();
        const problem = issueInput.value.trim();

        if (!customerName || !problem) {
            ticketMessage.textContent =
                "Please enter your name and problem.";
            return;
        }

        const submitButton = ticketForm.querySelector(
            'button[type="submit"]'
        );

        submitButton.disabled = true;
        submitButton.textContent = "Creating Ticket...";

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

            const createdTicket = await response.json();

            // Keep the ticket details for the solution page.
            sessionStorage.setItem(
                "resolverHubCurrentTicket",
                JSON.stringify({
                    id: createdTicket.id,
                    customerName: createdTicket.customerName,
                    issue: createdTicket.issue,
                    status: createdTicket.status
                })
            );

            // Navigate only after the backend saves the ticket.
            window.location.href = "solution.html";

        } catch (error) {
            console.error("Create ticket error:", error);

            ticketMessage.textContent =
                "Unable to create ticket. Please try again.";
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = "Create Ticket";
        }
    });
});


const API_URL = "http://localhost:8081/api/patients";

// LOAD PATIENTS AND BILL DETAILS
async function loadBills() {

    const table = document.getElementById("billingTable");

    try {

        const response = await fetch(API_URL);

        if (!response.ok) {
            throw new Error("Unable to load billing records");
        }

        const patients = await response.json();

        const totalBills = patients.reduce(
            (sum, p) => sum + Number(p.bill || 0), 0
        );

        const pendingBills = patients.reduce(
            (sum, p) => sum + Number(p.bill || 0), 0
        );

        document.getElementById("totalBills").textContent =
            "₹" + totalBills.toFixed(2);

        document.getElementById("pendingBills").textContent =
            "₹" + pendingBills.toFixed(2);

        if (patients.length === 0) {
            table.innerHTML = `
                <tr>
                    <td colspan="5">No billing records found</td>
                </tr>
            `;
            return;
        }

        table.innerHTML = patients.map(p => `

            <tr>
                <td>${p.id}</td>
                <td>${escapeHTML(p.name)}</td>
                <td>${escapeHTML(p.disease)}</td>
                <td>₹${Number(p.bill).toFixed(2)}</td>

                <td>
                    <button onclick="addCharge(${p.id})">
                        Add Charge
                    </button>

                    <button onclick="payBill(${p.id})">
                        Pay Bill
                    </button>
                </td>
            </tr>

        `).join("");

    } catch (error) {

        table.innerHTML = `
            <tr>
                <td colspan="5">
                    Cannot connect to Java API.
                    Please start PatientAPI.java.
                </td>
            </tr>
        `;

        console.error(error);
    }
}


// ADD CHARGE TO PATIENT BILL
async function addCharge(id) {

    const amount = prompt("Enter additional charge amount:");

    if (amount === null) return;

    const value = Number(amount);

    if (!Number.isFinite(value) || value <= 0) {
        alert("Enter a valid amount greater than zero.");
        return;
    }

    try {

        const data = new URLSearchParams({
            amount: value
        });

        const response = await fetch(`${API_URL}/${id}/add-bill`, {
            method: "POST",
            body: data
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || "Unable to add charge");
        }

        alert(result.message || "Charge added successfully");

        loadBills();

    } catch (error) {

        alert(error.message);
        console.error(error);
    }
}


// PAY PATIENT BILL
async function payBill(id) {

    const amount = prompt("Enter payment amount:");

    if (amount === null) return;

    const value = Number(amount);

    if (!Number.isFinite(value) || value <= 0) {
        alert("Enter a valid payment amount.");
        return;
    }

    try {

        const data = new URLSearchParams({
            amount: value
        });

        const response = await fetch(`${API_URL}/${id}/pay-bill`, {
            method: "POST",
            body: data
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || "Payment failed");
        }

        alert(result.message || "Payment successful");

        loadBills();

    } catch (error) {

        alert(error.message);
        console.error(error);
    }
}


// PREVENT HTML INJECTION
function escapeHTML(value) {

    return String(value ?? "").replace(/[&<>"']/g, c => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[c]);

}


// LOAD BILLING PAGE
loadBills();


let patients = JSON.parse(localStorage.getItem("patients")) || [];

function savePatients() {
    localStorage.setItem("patients", JSON.stringify(patients));
}

function showPage(pageId, link) {
    document.querySelectorAll(".page").forEach(page => {
        page.classList.remove("active-page");
    });

    document.getElementById(pageId).classList.add("active-page");

    document.querySelectorAll(".sidebar a").forEach(a => {
        a.classList.remove("active");
    });

    if (link) link.classList.add("active");

    renderAll();
}

function getNextId() {
    return patients.length
        ? Math.max(...patients.map(p => p.id)) + 1
        : 1;
}

// Add patient
document.getElementById("patientForm").addEventListener("submit", function(e) {
    e.preventDefault();

    const patient = {
        id: getNextId(),
        name: document.getElementById("name").value.trim(),
        age: Number(document.getElementById("age").value),
        disease: document.getElementById("disease").value.trim(),
        doctor: document.getElementById("doctor").value.trim(),
        bill: Number(document.getElementById("bill").value)
    };

    if (!patient.name || !patient.disease || !patient.doctor ||
        patient.age < 1 || patient.age > 120 || patient.bill < 0) {
        alert("Please enter valid patient details.");
        return;
    }

    patients.push(patient);
    savePatients();

    alert("Patient registered successfully! Patient ID: " + patient.id);

    this.reset();
    renderAll();
    showPage("patients", null);
});

// Display patients
function renderPatients() {
    const table = document.getElementById("patientTable");
    const search = document.getElementById("search").value.toLowerCase();

    table.innerHTML = "";

    const filtered = patients.filter(p =>
        String(p.id).includes(search) ||
        p.name.toLowerCase().includes(search)
    );

    filtered.forEach(p => {
        table.innerHTML += `
            <tr>
                <td>${p.id}</td>
                <td>${escapeHTML(p.name)}</td>
                <td>${p.age}</td>
                <td>${escapeHTML(p.disease)}</td>
                <td>${escapeHTML(p.doctor)}</td>
                <td>₹${p.bill.toFixed(2)}</td>
                <td>
                    <button class="edit-btn" onclick="editPatient(${p.id})">Edit</button>
                    <button class="delete-btn" onclick="deletePatient(${p.id})">Delete</button>
                </td>
            </tr>
        `;
    });

    if (filtered.length === 0) {
        table.innerHTML = `<tr><td colspan="7">No patients found</td></tr>`;
    }
}

// Basic protection when displaying user-entered text
function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[char]);
}

// Edit patient
function editPatient(id) {
    const p = patients.find(patient => patient.id === id);
    if (!p) return;

    const name = prompt("Enter patient name:", p.name);
    if (name === null) return;

    const age = prompt("Enter patient age:", p.age);
    if (age === null) return;

    const disease = prompt("Enter disease:", p.disease);
    if (disease === null) return;

    const doctor = prompt("Enter doctor name:", p.doctor);
    if (doctor === null) return;

    const bill = prompt("Enter bill amount:", p.bill);
    if (bill === null) return;

    if (!name.trim() || !disease.trim() || !doctor.trim() ||
        !Number.isInteger(Number(age)) || Number(age) < 1 ||
        Number(age) > 120 || !Number.isFinite(Number(bill)) ||
        Number(bill) < 0) {
        alert("Invalid details. Please try again.");
        return;
    }

    p.name = name.trim();
    p.age = Number(age);
    p.disease = disease.trim();
    p.doctor = doctor.trim();
    p.bill = Number(bill);

    savePatients();
    renderAll();

    alert("Patient updated successfully!");
}

// Delete patient
function deletePatient(id) {
    if (!confirm("Are you sure you want to delete this patient?")) {
        return;
    }

    patients = patients.filter(p => p.id !== id);

    savePatients();
    renderAll();

    alert("Patient deleted successfully!");
}

// Dashboard
function renderDashboard() {
    document.getElementById("totalPatients").textContent = patients.length;

    document.getElementById("totalBills").textContent = patients.length;

    const revenue = patients.reduce((sum, p) => sum + p.bill, 0);

    document.getElementById("totalRevenue").textContent =
        "₹" + revenue.toFixed(2);

    const recent = patients.slice(-5).reverse();

    document.getElementById("recentPatients").innerHTML =
        recent.map(p => `
            <tr>
                <td>${p.id}</td>
                <td>${escapeHTML(p.name)}</td>
                <td>${p.age}</td>
                <td>${escapeHTML(p.disease)}</td>
                <td>${escapeHTML(p.doctor)}</td>
            </tr>
        `).join("") ||
        `<tr><td colspan="5">No patient records available</td></tr>`;
}

// Add bill
document.getElementById("billingForm").addEventListener("submit", function(e) {
    e.preventDefault();

    const id = Number(document.getElementById("billPatientId").value);
    const amount = Number(document.getElementById("newBill").value);

    const patient = patients.find(p => p.id === id);

    if (!patient) {
        alert("Patient not found!");
        return;
    }

    if (!Number.isFinite(amount) || amount <= 0) {
        alert("Enter a valid bill amount.");
        return;
    }

    patient.bill += amount;

    savePatients();
    renderAll();

    alert("Bill added successfully!");

    this.reset();
});

// Billing table
function renderBilling() {
    const table = document.getElementById("billingTable");

    table.innerHTML = patients.map(p => `
        <tr>
            <td>${p.id}</td>
            <td>${escapeHTML(p.name)}</td>
            <td>₹${p.bill.toFixed(2)}</td>
        </tr>
    `).join("") ||
    `<tr><td colspan="3">No bills available</td></tr>`;
}

// Refresh all sections
function renderAll() {
    renderDashboard();
    renderPatients();
    renderBilling();
}

renderAll();


const API_URL = "http://localhost:8081/api/patients";

// LOAD ALL PATIENTS
async function displayPatients() {

    const table = document.getElementById("patientTable");
    const search = document.getElementById("searchPatient").value.toLowerCase();

    try {

        const response = await fetch(API_URL);

        if (!response.ok) {
            throw new Error("Unable to load patients");
        }

        const patients = await response.json();

        document.getElementById("totalPatients").textContent =
            patients.length;

        document.getElementById("registeredPatients").textContent =
            patients.length;

        const filtered = patients.filter(p =>
            String(p.id).includes(search) ||
            p.name.toLowerCase().includes(search) ||
            p.disease.toLowerCase().includes(search)
        );

        if (filtered.length === 0) {

            table.innerHTML =
                `<tr><td colspan="7">No patients found</td></tr>`;

            return;
        }

        table.innerHTML = filtered.map(p => `

            <tr>
                <td>${p.id}</td>
                <td>${escapeHTML(p.name)}</td>
                <td>${p.age}</td>
                <td>${escapeHTML(p.disease)}</td>
                <td>${escapeHTML(p.doctor)}</td>
                <td>₹${Number(p.bill).toFixed(2)}</td>

                <td>
                    <button onclick="editPatient(${p.id})">
                        Edit
                    </button>

                    <button onclick="deletePatient(${p.id})">
                        Delete
                    </button>
                </td>
            </tr>

        `).join("");

    } catch (error) {

        table.innerHTML = `
            <tr>
                <td colspan="7">
                    Cannot connect to Java API.
                    Please start PatientAPI.java.
                </td>
            </tr>
        `;

        console.error(error);
    }
}


// ADD PATIENT
async function addPatient() {

    const name = prompt("Enter patient name:");
    if (name === null) return;

    const age = prompt("Enter patient age:");
    if (age === null) return;

    const disease = prompt("Enter disease:");
    if (disease === null) return;

    const doctor = prompt("Enter doctor name:");
    if (doctor === null) return;

    const bill = prompt("Enter initial bill amount:");
    if (bill === null) return;

    if (
        !name.trim() ||
        !disease.trim() ||
        !doctor.trim() ||
        !Number.isInteger(Number(age)) ||
        Number(age) < 0 ||
        !Number.isFinite(Number(bill)) ||
        Number(bill) < 0
    ) {

        alert("Please enter valid patient details.");
        return;
    }

    const data = new URLSearchParams({
        name: name.trim(),
        age: age,
        disease: disease.trim(),
        doctor: doctor.trim(),
        bill: bill
    });

    try {

        const response = await fetch(API_URL, {
            method: "POST",
            body: data
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || "Unable to add patient");
        }

        alert("Patient added successfully!");

        displayPatients();

    } catch (error) {

        alert(error.message);
        console.error(error);
    }
}


// EDIT PATIENT
async function editPatient(id) {

    try {

        const response = await fetch(API_URL);
        const patients = await response.json();

        const p = patients.find(patient => patient.id === id);

        if (!p) {
            alert("Patient not found");
            return;
        }

        const name = prompt("Patient name:", p.name);
        if (name === null) return;

        const age = prompt("Age:", p.age);
        if (age === null) return;

        const disease = prompt("Disease:", p.disease);
        if (disease === null) return;

        const doctor = prompt("Doctor:", p.doctor);
        if (doctor === null) return;

        const bill = prompt("Bill amount:", p.bill);
        if (bill === null) return;

        if (
            !name.trim() ||
            !disease.trim() ||
            !doctor.trim() ||
            !Number.isInteger(Number(age)) ||
            Number(age) < 0 ||
            !Number.isFinite(Number(bill)) ||
            Number(bill) < 0
        ) {

            alert("Please enter valid details.");
            return;
        }

        const data = new URLSearchParams({
            name: name.trim(),
            age: age,
            disease: disease.trim(),
            doctor: doctor.trim(),
            bill: bill
        });

        const resultResponse = await fetch(`${API_URL}/${id}`, {
            method: "PUT",
            body: data
        });

        const result = await resultResponse.json();

        if (!resultResponse.ok) {
            throw new Error(result.error || "Update failed");
        }

        alert(result.message || "Patient updated successfully");

        displayPatients();

    } catch (error) {

        alert(error.message);
        console.error(error);
    }
}


// DELETE PATIENT
async function deletePatient(id) {

    if (!confirm("Are you sure you want to delete this patient?")) {
        return;
    }

    try {

        const response = await fetch(`${API_URL}/${id}`, {
            method: "DELETE"
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || "Delete failed");
        }

        alert(result.message || "Patient deleted successfully");

        displayPatients();

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


// LOAD PATIENTS WHEN PAGE OPENS
displayPatients();

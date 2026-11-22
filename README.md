# Hospital Management System

A web-based Hospital Management System developed using Java, JDBC, MySQL, HTML, CSS and JavaScript.

## Project Overview

The Hospital Management System helps manage patient information and hospital billing operations through a web interface connected to a MySQL database.

## Technologies Used

- Java
- JDBC
- MySQL
- HTML5
- CSS3
- JavaScript
- VS Code

## Features

1. Patient Registration
2. View Patient Details
3. Update Patient Information
4. Delete Patient Records
5. Patient Search
6. Billing Management
7. Add Charges
8. Payment Management

## Project Structure

```text
HospitalManagementSystem/
│
├── src/
│   ├── DBConnection.java
│   ├── Main.java
│   ├── Patient.java
│   ├── PatientDAO.java
│   └── PatientAPI.java
│
├── frontend/
│   ├── index.html
│   ├── dashboard.html
│   ├── patients.html
│   ├── billing.html
│   ├── patients.js
│   ├── billing.js
│   └── style.css
│
├── lib/
│   └── mysql-connector-j-26.10.0.jar
│
├── .gitignore
└── README.md
```

## Database Configuration

1. Install MySQL.
2. Create a database named `HSM`.
3. Create the `patients` table.
4. Configure your MySQL username and password using environment variables.
5. Make sure MySQL is running.

## How to Run

1. Open the project in VS Code.
2. Compile the Java files:

```powershell
javac --add-modules jdk.httpserver -cp "lib/*" -d bin src\*.java
```

3. Start the API:

```powershell
java --add-modules jdk.httpserver -cp "bin;lib\mysql-connector-j-26.10.0.jar" PatientAPI
```

4. Open the frontend HTML files using Live Server.

## Developer

GitHub: [deepikacuppalad](https://github.com/deepikacuppalad)

## Project

Hospital Management System – Java Full Stack Project.

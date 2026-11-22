
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpServer;
import java.io.*;
import java.net.InetSocketAddress;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.sql.*;
import java.util.*;

public class PatientAPI {

    public static void main(String[] args) throws Exception {

        HttpServer server = HttpServer.create(
            new InetSocketAddress(8081), 0
        );

        server.createContext("/api/patients",
            PatientAPI::handlePatients);

        server.setExecutor(null);
        server.start();

        System.out.println("Hospital API started!");
        System.out.println("API URL: http://localhost:8081/api/patients");
    }

    private static Connection getDBConnection() throws SQLException {

        Connection conn = DBConnection.getConnection();

        if (conn == null) {
            throw new SQLException("Unable to connect to MySQL database");
        }

        return conn;
    }

    private static void handlePatients(HttpExchange exchange)
            throws IOException {

        addCorsHeaders(exchange);

        String method = exchange.getRequestMethod();
        String path = exchange.getRequestURI().getPath();

        if (method.equalsIgnoreCase("OPTIONS")) {
            exchange.sendResponseHeaders(204, -1);
            exchange.close();
            return;
        }

        try {

            // GET ALL PATIENTS
            if (method.equals("GET") &&
                    path.equals("/api/patients")) {

                getPatients(exchange);
            }

            // ADD PATIENT
            else if (method.equals("POST") &&
                    path.equals("/api/patients")) {

                addPatient(exchange);
            }

            // ADD BILL
            else if (method.equals("POST") &&
                    path.matches("/api/patients/\\d+/add-bill")) {

                int id = getPatientId(path);
                addBill(exchange, id);
            }

            // PAY BILL
            else if (method.equals("POST") &&
                    path.matches("/api/patients/\\d+/pay-bill")) {

                int id = getPatientId(path);
                payBill(exchange, id);
            }

            // UPDATE PATIENT
            else if (method.equals("PUT") &&
                    path.matches("/api/patients/\\d+")) {

                int id = getPatientId(path);
                updatePatient(exchange, id);
            }

            // DELETE PATIENT
            else if (method.equals("DELETE") &&
                    path.matches("/api/patients/\\d+")) {

                int id = getPatientId(path);
                deletePatient(exchange, id);
            }

            else {
                send(exchange, 404,
                    "{\"error\":\"Endpoint not found\"}");
            }

        } catch (IllegalArgumentException e) {

            send(exchange, 400,
                "{\"error\":\"" + escape(e.getMessage()) + "\"}");

        } catch (Exception e) {

            e.printStackTrace();

            send(exchange, 500,
                "{\"error\":\"Server error. Check Java terminal.\"}");
        }
    }

    private static int getPatientId(String path) {
        return Integer.parseInt(
            path.substring(path.indexOf("/patients/") + 10)
                .split("/")[0]
        );
    }

    // GET ALL PATIENTS
    private static void getPatients(HttpExchange exchange)
            throws Exception {

        StringBuilder json = new StringBuilder("[");
        boolean first = true;

        String sql = "SELECT * FROM patients ORDER BY patient_id";

        try (Connection conn = getDBConnection();
             Statement st = conn.createStatement();
             ResultSet rs = st.executeQuery(sql)) {

            while (rs.next()) {

                if (!first) {
                    json.append(",");
                }

                first = false;

                json.append("{")
                    .append("\"id\":").append(rs.getInt("patient_id")).append(",")
                    .append("\"name\":\"").append(escape(rs.getString("name"))).append("\",")
                    .append("\"age\":").append(rs.getInt("age")).append(",")
                    .append("\"disease\":\"").append(escape(rs.getString("disease"))).append("\",")
                    .append("\"doctor\":\"").append(escape(rs.getString("doctor_assigned"))).append("\",")
                    .append("\"bill\":").append(rs.getDouble("bill_amount"))
                    .append("}");
            }
        }

        json.append("]");

        send(exchange, 200, json.toString());
    }

    // ADD PATIENT
    private static void addPatient(HttpExchange exchange)
            throws Exception {

        Map<String, String> data = readForm(exchange);

        String sql = "INSERT INTO patients " +
            "(name, age, disease, doctor_assigned, bill_amount) " +
            "VALUES (?, ?, ?, ?, ?)";

        try (Connection conn = getDBConnection();
             PreparedStatement ps = conn.prepareStatement(
                 sql, Statement.RETURN_GENERATED_KEYS)) {

            ps.setString(1, required(data, "name"));
            ps.setInt(2, parseAge(required(data, "age")));
            ps.setString(3, required(data, "disease"));
            ps.setString(4, required(data, "doctor"));
            ps.setDouble(5, parseAmount(required(data, "bill")));

            ps.executeUpdate();

            try (ResultSet keys = ps.getGeneratedKeys()) {

                if (keys.next()) {
                    send(exchange, 201,
                        "{\"message\":\"Patient added successfully\",\"id\":" +
                        keys.getInt(1) + "}");
                    return;
                }
            }
        }

        send(exchange, 201,
            "{\"message\":\"Patient added successfully\"}");
    }

    // UPDATE PATIENT
    private static void updatePatient(HttpExchange exchange, int id)
            throws Exception {

        Map<String, String> data = readForm(exchange);

        String sql = "UPDATE patients SET name=?, age=?, disease=?, " +
            "doctor_assigned=?, bill_amount=? WHERE patient_id=?";

        try (Connection conn = getDBConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {

            ps.setString(1, required(data, "name"));
            ps.setInt(2, parseAge(required(data, "age")));
            ps.setString(3, required(data, "disease"));
            ps.setString(4, required(data, "doctor"));
            ps.setDouble(5, parseAmount(required(data, "bill")));
            ps.setInt(6, id);

            int rows = ps.executeUpdate();

            if (rows == 0) {
                send(exchange, 404,
                    "{\"error\":\"Patient not found\"}");
            } else {
                send(exchange, 200,
                    "{\"message\":\"Patient updated successfully\"}");
            }
        }
    }

    // DELETE PATIENT
    private static void deletePatient(HttpExchange exchange, int id)
            throws Exception {

        String sql = "DELETE FROM patients WHERE patient_id=?";

        try (Connection conn = getDBConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {

            ps.setInt(1, id);

            int rows = ps.executeUpdate();

            if (rows == 0) {
                send(exchange, 404,
                    "{\"error\":\"Patient not found\"}");
            } else {
                send(exchange, 200,
                    "{\"message\":\"Patient deleted successfully\"}");
            }
        }
    }

    // ADD CHARGE TO BILL
    private static void addBill(HttpExchange exchange, int id)
            throws Exception {

        Map<String, String> data = readForm(exchange);
        double amount = parsePositiveAmount(required(data, "amount"));

        String sql = "UPDATE patients " +
            "SET bill_amount = bill_amount + ? WHERE patient_id=?";

        try (Connection conn = getDBConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {

            ps.setDouble(1, amount);
            ps.setInt(2, id);

            int rows = ps.executeUpdate();

            if (rows == 0) {
                send(exchange, 404,
                    "{\"error\":\"Patient not found\"}");
            } else {
                send(exchange, 200,
                    "{\"message\":\"Additional charge added successfully\"}");
            }
        }
    }

    // PAY BILL
    private static void payBill(HttpExchange exchange, int id)
            throws Exception {

        Map<String, String> data = readForm(exchange);
        double amount = parsePositiveAmount(required(data, "amount"));

        String sql = "UPDATE patients " +
            "SET bill_amount = bill_amount - ? " +
            "WHERE patient_id=? AND bill_amount >= ?";

        try (Connection conn = getDBConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {

            ps.setDouble(1, amount);
            ps.setInt(2, id);
            ps.setDouble(3, amount);

            int rows = ps.executeUpdate();

            if (rows == 0) {

                // Check whether patient exists
                try (PreparedStatement check = conn.prepareStatement(
                        "SELECT patient_id FROM patients WHERE patient_id=?")) {

                    check.setInt(1, id);

                    try (ResultSet rs = check.executeQuery()) {

                        if (!rs.next()) {
                            send(exchange, 404,
                                "{\"error\":\"Patient not found\"}");
                        } else {
                            send(exchange, 400,
                                "{\"error\":\"Payment exceeds outstanding bill amount\"}");
                        }
                    }
                }

            } else {
                send(exchange, 200,
                    "{\"message\":\"Payment recorded successfully\"}");
            }
        }
    }

    // READ FORM DATA
    private static Map<String, String> readForm(HttpExchange exchange)
            throws IOException {

        String body = new String(
            exchange.getRequestBody().readAllBytes(),
            StandardCharsets.UTF_8
        );

        Map<String, String> data = new HashMap<>();

        for (String pair : body.split("&")) {

            if (pair.isEmpty()) continue;

            String[] parts = pair.split("=", 2);

            String key = URLDecoder.decode(
                parts[0], StandardCharsets.UTF_8
            );

            String value = parts.length > 1
                ? URLDecoder.decode(parts[1], StandardCharsets.UTF_8)
                : "";

            data.put(key, value);
        }

        return data;
    }

    private static String required(Map<String, String> data, String key) {

        String value = data.get(key);

        if (value == null || value.trim().isEmpty()) {
            throw new IllegalArgumentException("Missing field: " + key);
        }

        return value.trim();
    }

    private static int parseAge(String value) {

        try {
            int age = Integer.parseInt(value);

            if (age < 0) {
                throw new IllegalArgumentException("Age cannot be negative");
            }

            return age;

        } catch (NumberFormatException e) {
            throw new IllegalArgumentException("Invalid age");
        }
    }

    private static double parseAmount(String value) {

        try {
            double amount = Double.parseDouble(value);

            if (!Double.isFinite(amount) || amount < 0) {
                throw new IllegalArgumentException("Invalid bill amount");
            }

            return amount;

        } catch (NumberFormatException e) {
            throw new IllegalArgumentException("Invalid bill amount");
        }
    }

    private static double parsePositiveAmount(String value) {

        double amount = parseAmount(value);

        if (amount <= 0) {
            throw new IllegalArgumentException(
                "Amount must be greater than zero"
            );
        }

        return amount;
    }

    // JSON ESCAPING
    private static String escape(String value) {

        if (value == null) return "";

        return value.replace("\\", "\\\\")
                    .replace("\"", "\\\"")
                    .replace("\n", "\\n")
                    .replace("\r", "\\r")
                    .replace("\t", "\\t");
    }

    // CORS
    private static void addCorsHeaders(HttpExchange exchange) {

        exchange.getResponseHeaders().set(
            "Access-Control-Allow-Origin", "*"
        );

        exchange.getResponseHeaders().set(
            "Access-Control-Allow-Methods",
            "GET, POST, PUT, DELETE, OPTIONS"
        );

        exchange.getResponseHeaders().set(
            "Access-Control-Allow-Headers", "Content-Type"
        );
    }

    // SEND JSON RESPONSE
    private static void send(HttpExchange exchange, int status, String response)
            throws IOException {

        byte[] bytes = response.getBytes(StandardCharsets.UTF_8);

        exchange.getResponseHeaders().set(
            "Content-Type", "application/json; charset=UTF-8"
        );

        exchange.sendResponseHeaders(status, bytes.length);

        try (OutputStream os = exchange.getResponseBody()) {
            os.write(bytes);
        }
    }
}

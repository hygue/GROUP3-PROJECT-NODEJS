require("dotenv").config();

const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

/* ==================================
   DATABASE CONNECTION (POOL)
================================== */

// Twakoresheje createPool mu cyimbo cya createConnection cyari cyuzuye amakosa yo gukupa
const db = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

db.getConnection((err, connection) => {
    if (err) {
        console.error("Database Connection Failed");
        console.error(err);
        return;
    }
    console.log("MySQL Connected Successfully");
    connection.release(); // Sura connection isubire mu kidendezi (pool)
});

/* ==================================
   STUDENT CRUD OPERATIONS
================================== */

/* CREATE STUDENT */

app.post("/students", (req, res) => {

    const { fullname, email, class_name } = req.body;

    if (!fullname || !email || !class_name) {
        return res.status(400).json({
            message: "All fields are required"
        });
    }

    const sql =
        "INSERT INTO students (fullname,email,class_name) VALUES (?,?,?)";

    db.query(
        sql,
        [fullname, email, class_name],
        (err, result) => {

            if (err) {
                console.error(err);
                return res.status(500).json({ message: "Internal Server Error", error: err.message });
            }

            res.status(201).json({
                message: "Student Added Successfully",
                studentId: result.insertId
            });
        }
    );
});

/* GET ALL STUDENTS */

app.get("/students", (req, res) => {

    const sql = "SELECT * FROM students ORDER BY id DESC";

    db.query(sql, (err, result) => {

        if (err) {
            console.error(err);
            return res.status(500).json({ message: "Internal Server Error", error: err.message });
        }

        res.json(result);
    });
});

/* GET SINGLE STUDENT */

app.get("/students/:id", (req, res) => {

    const { id } = req.params;

    const sql = "SELECT * FROM students WHERE id=?";

    db.query(sql, [id], (err, result) => {

        if (err) {
            console.error(err);
            return res.status(500).json({ message: "Internal Server Error", error: err.message });
        }

        if (result.length === 0) {
            return res.status(404).json({
                message: "Student Not Found"
            });
        }

        res.json(result[0]);
    });
});

/* UPDATE STUDENT */

app.put("/students/:id", (req, res) => {

    const { id } = req.params;
    const { fullname, email, class_name } = req.body;

    // Ikosa rya 1: Byari bikenewe ko tugenzura niba ibi bintu bije mu moko kugira ngo bitaza kwandika ubusa (null) mu idatabase
    if (!fullname || !email || !class_name) {
        return res.status(400).json({ message: "All fields are required" });
    }

    const sql = `
        UPDATE students
        SET fullname=?,
            email=?,
            class_name=?
        WHERE id=?
    `;

    db.query(
        sql,
        [fullname, email, class_name, id],
        (err, result) => {

            if (err) {
                console.error(err);
                return res.status(500).json({ message: "Internal Server Error", error: err.message });
            }

            // Genzura niba iyo ID yari ihari koko
            if (result.affectedRows === 0) {
                return res.status(404).json({ message: "Student Not Found" });
            }

            res.json({
                message: "Student Updated Successfully"
            });
        }
    );
});

/* DELETE STUDENT */

app.delete("/students/:id", (req, res) => {

    const { id } = req.params;

    const sql = "DELETE FROM students WHERE id=?";

    db.query(sql, [id], (err, result) => {

        if (err) {
            console.error(err);
            return res.status(500).json({ message: "Internal Server Error", error: err.message });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Student Not Found" });
        }

        res.json({
            message: "Student Deleted Successfully"
        });
    });
});

/* ==================================
   ATTENDANCE CRUD OPERATIONS
================================== */

/* RECORD ATTENDANCE */

app.post("/attendance", (req, res) => {

    const {
        student_id,
        attendance_date,
        status
    } = req.body;

    if (!student_id || !attendance_date || !status) {
        return res.status(400).json({
            message: "All fields are required"
        });
    }

    const sql = `
        INSERT INTO attendance
        (student_id, attendance_date, status)
        VALUES (?,?,?)
    `;

    db.query(
        sql,
        [student_id, attendance_date, status],
        (err, result) => {

            if (err) {
                console.error(err);
                return res.status(500).json({ message: "Internal Server Error", error: err.message });
            }

            res.status(201).json({
                message: "Attendance Recorded Successfully",
                attendanceId: result.insertId
            });
        }
    );
});

/* VIEW ALL ATTENDANCE */

app.get("/attendance", (req, res) => {

    const sql = `
        SELECT
            attendance.id,
            students.fullname,
            students.class_name,
            attendance.attendance_date,
            attendance.status
        FROM attendance
        INNER JOIN students
        ON attendance.student_id = students.id
        ORDER BY attendance.id DESC
    `;

    db.query(sql, (err, result) => {

        if (err) {
            console.error(err);
            return res.status(500).json({ message: "Internal Server Error", error: err.message });
        }

        res.json(result);
    });
});

/* VIEW ATTENDANCE BY ID */

app.get("/attendance/:id", (req, res) => {

    const { id } = req.params;

    const sql =
        "SELECT * FROM attendance WHERE id=?";

    db.query(sql, [id], (err, result) => {

        if (err) {
            console.error(err);
            return res.status(500).json({ message: "Internal Server Error", error: err.message });
        }

        if (result.length === 0) {
            return res.status(404).json({
                message: "Attendance Record Not Found"
            });
        }

        res.json(result[0]);
    });
});

/* UPDATE ATTENDANCE */

app.put("/attendance/:id", (req, res) => {

    const { id } = req.params;
    const { attendance_date, status } = req.body;

    if (!attendance_date || !status) {
        return res.status(400).json({ message: "All fields are required" });
    }

    const sql = `
        UPDATE attendance
        SET attendance_date=?,
            status=?
        WHERE id=?
    `;

    db.query(
        sql,
        [attendance_date, status, id],
        (err, result) => {

            if (err) {
                console.error(err);
                return res.status(500).json({ message: "Internal Server Error", error: err.message });
            }

            if (result.affectedRows === 0) {
                return res.status(404).json({ message: "Attendance Record Not Found" });
            }

            res.json({
                message: "Attendance Updated Successfully"
            });
        }
    );
});

/* DELETE ATTENDANCE */

app.delete("/attendance/:id", (req, res) => {

    const { id } = req.params;

    const sql =
        "DELETE FROM attendance WHERE id=?";

    db.query(sql, [id], (err, result) => {

        if (err) {
            console.error(err);
            return res.status(500).json({ message: "Internal Server Error", error: err.message });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Attendance Record Not Found" });
        }

        res.json({
            message: "Attendance Deleted Successfully"
        });
    });
});

/* ==================================
   HOME ROUTE
================================== */

app.get("/", (req, res) => {
    res.json({
        message: "Student Attendance Management API Running Successfully"
    });
});

/* ==================================
   SERVER
================================== */

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server Running On Port ${PORT}`);
});
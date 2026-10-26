
require("dotenv").config();

const express = require("express");
const mysql = require("mysql2");
const crypto = require("crypto");
const path = require("path");

const app = express();
const PORT = 3000;

// Middleware to read form data and serve HTML/CSS files
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

// MySQL connection
const conn = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: Number(process.env.DB_PORT || 3306)
});

// Escape user input before displaying it in HTML
function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    }[char]));
}

// Secure password hashing using PBKDF2
function hashPassword(password, salt) {
    return crypto.pbkdf2Sync(
        password,
        salt,
        100000,
        64,
        "sha512"
    ).toString("hex");
}

// Shared page design for success and error messages
function resultPage(title, message, linkText, link, success = true) {
    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport"
              content="width=device-width, initial-scale=1.0">
        <title>${title} | Travel Adventures</title>
        <link rel="stylesheet" href="/style.css">
    </head>
    <body>
        <main class="page">

            <section class="visual-panel">
                <div class="logo">Travel Adventures.</div>

                <div class="visual-copy">
                    <h2>Every journey begins somewhere.</h2>
                    <p>
                        Beautiful destinations, unforgettable moments,
                        and new stories are waiting to be discovered.
                    </p>
                </div>

                <div class="visual-footer">
                    Explore · Experience · Remember
                </div>
            </section>

            <section class="form-panel">
                <div class="form-content result-content">

                    <div class="success-symbol ${success ? "" : "error-symbol"}">
                        ${success ? "✓" : "!"}
                    </div>

                    <div class="eyebrow">
                        ${success ? "Adventure awaits" : "Let's try again"}
                    </div>

                    <h1>${title}</h1>

                    <p class="subtitle">${message}</p>

                    <a class="primary-button" href="${link}">
                        ${linkText}
                    </a>

                </div>
            </section>

        </main>
    </body>
    </html>`;
}

// Homepage
app.get("/", (req, res) => {
    res.redirect("/register.html");
});

// Register a new user
app.post("/register", (req, res) => {
    const { username, email, password } = req.body;

    if (
        typeof username !== "string" ||
        typeof email !== "string" ||
        typeof password !== "string" ||
        !username.trim() ||
        !email.trim() ||
        !password ||
        username.trim().length > 50 ||
        email.trim().length > 100
    ) {
        return res.status(400).send(resultPage(
            "Missing or invalid details",
            "Please enter a valid username, email, and password.",
            "Back to registration",
            "/register.html",
            false
        ));
    }

    // Generate a unique salt for each user
    const salt = crypto.randomBytes(16).toString("hex");

    // Hash the password
    const hashedPassword = hashPassword(password, salt);

    // Store the salt and password hash together
    const storedPassword = salt + ":" + hashedPassword;

    const sql = `
        INSERT INTO registered_users
        (username, email, password_hash)
        VALUES (?, ?, ?)
    `;

    conn.query(
        sql,
        [username.trim(), email.trim(), storedPassword],
        (err) => {
            if (err) {
                // Handle duplicate usernames or emails
                if (err.code === "ER_DUP_ENTRY") {
                    return res.status(409).send(resultPage(
                        "Account already exists",
                        "That username or email is already registered.",
                        "Try registering again",
                        "/register.html",
                        false
                    ));
                }

                console.error("Registration error:", err.message);

                return res.status(500).send(resultPage(
                    "Something went wrong",
                    "We couldn't complete your registration.",
                    "Try again",
                    "/register.html",
                    false
                ));
            }

            // Successful registration
            res.send(resultPage(
                "You have successfully registered",
                "Your Travel Adventures account is ready. Let's begin your journey.",
                "Continue to login",
                "/login.html"
            ));
        }
    );
});

// Log in an existing user
app.post("/login", (req, res) => {
    const { username, password } = req.body;

    // Reusable response for incorrect credentials
    const invalidLogin = () => res.status(401).send(resultPage(
        "The login credentials were incorrect",
        "The username or password doesn't match our records.",
        "Back to login",
        "/login.html",
        false
    ));

    if (
        typeof username !== "string" ||
        typeof password !== "string" ||
        !username ||
        !password
    ) {
        return invalidLogin();
    }

    const sql = `
        SELECT username, password_hash
        FROM registered_users
        WHERE username = ?
    `;

    conn.query(sql, [username], (err, results) => {
        if (err) {
            console.error("Login error:", err.message);

            return res.status(500).send(resultPage(
                "Something went wrong",
                "We couldn't process your login right now.",
                "Back to login",
                "/login.html",
                false
            ));
        }

        // Username does not exist
        if (results.length === 0) {
            return invalidLogin();
        }

        const storedPassword = results[0].password_hash;
        const parts = storedPassword.split(":");

        if (parts.length !== 2) {
            return invalidLogin();
        }

        const [salt, savedHash] = parts;

        // Validate the stored hash format
        if (
            !/^[a-f0-9]{32}$/i.test(salt) ||
            !/^[a-f0-9]{128}$/i.test(savedHash)
        ) {
            return invalidLogin();
        }

        // Hash the entered password with the saved salt
        const enteredHash = hashPassword(password, salt);

        const savedBuffer = Buffer.from(savedHash, "hex");
        const enteredBuffer = Buffer.from(enteredHash, "hex");

        // Compare password hashes safely
        const passwordMatches = crypto.timingSafeEqual(
            savedBuffer,
            enteredBuffer
        );

        if (!passwordMatches) {
            return invalidLogin();
        }

        // Successful login
        res.send(resultPage(
            "You have logged in successfully",
            `Welcome back, ${escapeHtml(results[0].username)}! Your next adventure awaits.`,
            "Sign in again",
            "/login.html"
        ));
    });
});

// Start server after connecting to MySQL
conn.connect((err) => {
    if (err) {
        console.error(
            "Could not connect to MySQL:",
            err.message
        );
        process.exit(1);
    }

    console.log("Database connection established successfully!");

    app.listen(PORT, () => {
        console.log(
            `Server running at http://localhost:${PORT}`
        );
    });
});

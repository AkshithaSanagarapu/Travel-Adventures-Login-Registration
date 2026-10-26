
# Travel Adventures - Login and Registration

CSC4370 Web Programming | Fall 2026

## Project Description

Travel Adventures is a travel-themed web application
that allows users to register and log in using their
username and password.

The application uses Node.js, Express, and MySQL
for backend functionality, along with HTML and CSS
for the user interface.

## Technologies Used

- HTML5
- CSS3
- JavaScript
- Node.js
- Express.js
- MySQL
- mysql2
- dotenv
- Crypto

## Features

- User registration with username, email, and password
- Secure password hashing
- Login authentication
- Successful registration message
- Successful login message
- Incorrect credentials handling
- Duplicate registration prevention
- Responsive travel-themed design

## Database Setup

1. Install MySQL.
2. Run database.sql to create the database and table.
3. Create a MySQL user with SELECT and INSERT
   permissions on the registered_users table.

## Environment Setup

Create a file named .env in the project folder.

Add the following:

DB_HOST=localhost
DB_USER=your_mysql_username
DB_PASSWORD=your_mysql_password
DB_NAME=web_programming
DB_PORT=3306

Replace the placeholders with your own credentials.

## Running the Application

Open Terminal in the project folder.

Install dependencies:

npm install

Start the server:

node server.js

Open the registration page:

http://localhost:3000/register.html

Open the login page:

http://localhost:3000/login.html

## Expected Output

Registration success:
You have successfully registered

Login success:
You have logged in successfully

Login failure:
The login credentials were incorrect

## Security

Passwords are stored as salted hashes using PBKDF2.
MySQL credentials are stored separately in the .env file.

This project was developed for the CSC4370
Web Programming course.

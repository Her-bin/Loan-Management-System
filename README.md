# Loan Management System

## Overview

This project is a Loan Management System built with Node.js, Express, and MongoDB. It allows users to request loans, track their status, and view approved loans. Admins can log in, approve loans, and view the system's statistics.

## Prerequisites

- Node.js (version 14 or higher)
- MongoDB (ensure the MongoDB service is running)

## Installation

## Step 1: Install Dependencies
Install the necessary dependencies using npm:

      npm install

## Dependencies
The following dependencies are used in this project:

express: Web framework for Node.js
mongoose: MongoDB object modeling tool
body-parser: Middleware to parse request bodies
express-session: Middleware for session management
dotenv: Load environment variables from .env file
ejs: Templating engine for rendering views


## To install these dependencies, run:

      npm install express mongoose body-parser express-session dotenv ejs

## Step 2: Set Up Environment Variables
Create a .env file in the root directory of the project and add the following environment variables:

      SESSION_SECRET=your-secret-key
      ADMIN_EMAIL=admin@example.com
      ADMIN_PASSWORD=your-admin-password

## Step 3: Ensure MongoDB is Running
Make sure the MongoDB service is running on your machine:

      mongod

## Step 5: Start the Server
Start the server using the following command:

      npm start
      
      node server.js


## Acknowledgements

   Node.js
   Express
   MongoDB
   EJS












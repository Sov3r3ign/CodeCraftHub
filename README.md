<<<<<<< HEAD
CodeCraftHub

Personal Learning Goal Tracker API

CodeCraftHub is a simple REST API built with Node.js and Express that helps developers track courses they want to learn. It allows users to create courses, view their learning goals, update progress, and delete courses.

Course data is stored in a local JSON file, so no database or authentication is required.

Features
Create a new course with required details.
Retrieve all courses.
Retrieve a specific course by ID.
Update an existing course.
Delete a course.
Automatically generate unique numeric course IDs starting from 1.
Automatically record the course creation timestamp.
Validate required fields, dates, and course statuses.
Store course data persistently in courses.json.
Automatically create courses.json if it does not exist.
Return appropriate HTTP status codes and error messages.
Technologies Used
Node.js — JavaScript runtime.
Express.js — REST API framework.
JSON — Simple file-based data storage.
Nodemon — Automatically restarts the server during development.
Project Structure
text
CodeCraftHub/
├── app.js
├── courses.json
├── package.json
├── package-lock.json
├── README.md
└── node_modules/

app.js — Express server, API endpoints, validation, and error handling.
courses.json — Stores course data and is created automatically if missing.
package.json — Project metadata, dependencies, and npm scripts.
package-lock.json — Records the installed dependency versions.
README.md — Project documentation.
node_modules/ — Installed Node.js packages.
Installation Instructions
Prerequisites

Install the following before starting:

Node.js (includes npm).
A code editor, such as Visual Studio Code.
An API testing tool, such as Postman, or the curl command-line utility.
1. Open the project directory

Open a terminal in your CodeCraftHub project folder.

bash
cd CodeCraftHub

2. Install dependencies

Install Express and the development dependencies listed in package.json.

bash
npm install


If you need to install the dependencies individually, run:

bash
npm install express
npm install --save-dev nodemon

3. Verify the project files

Make sure app.js and package.json are present.

The application creates courses.json automatically when it starts if the file does not exist.

If you create the file manually, initialize it with an empty JSON array:

json
[]

How to Run the Application
Start the server

Run the following command:

bash
npm start


The server should display:

text
CodeCraftHub API running at http://localhost:5000
Press Ctrl+C to stop the server.


The API is now available at:

Base URL: http://localhost:5000

Run in development mode

To automatically restart the application when files change, run:

bash
npm run dev


Keep the terminal open while testing the API. Press Ctrl+C to stop the server.

Course Data Structure

Each course contains the following fields:

Field	Type	Description
id	Number	Automatically generated unique course ID, starting at 1.
name	String	Required course name.
description	String	Required course description.
target_date	String	Required target completion date in YYYY-MM-DD format.
status	String	Required learning status.
created_at	String	Automatically generated creation timestamp in ISO 8601 format.
Allowed course statuses

A course must use one of these exact status values:

Not Started
In Progress
Completed
Example course
json
{
  "id": 1,
  "name": "Learn Node.js",
  "description": "Learn to build REST APIs using Express",
  "target_date": "2026-12-15",
  "status": "Not Started",
  "created_at": "2026-10-28T08:30:00.000Z"
}


The created_at value above is an example. The application generates the actual timestamp automatically.

API Endpoint Documentation

All endpoints use the base URL:

http://localhost:5000

For requests that include a JSON body, set the Content-Type header to application/json.

1. Create a Course

Endpoint: POST /api/courses

Creates a new course.

Request body:

json
{
  "name": "Learn Node.js",
  "description": "Build REST APIs with Express",
  "target_date": "2026-12-15",
  "status": "Not Started"
}


Example using curl:

bash
curl -X POST http://localhost:5000/api/courses \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Learn Node.js",
    "description": "Build REST APIs with Express",
    "target_date": "2026-12-15",
    "status": "Not Started"
  }'


Success response: 201 Created

The response includes the newly created course, its generated ID, and its creation timestamp.

2. Get All Courses

Endpoint: GET /api/courses

Returns all saved courses.

Example using curl:

bash
curl http://localhost:5000/api/courses


Success response: 200 OK

json
{
  "count": 1,
  "courses": [
    {
      "id": 1,
      "name": "Learn Node.js",
      "description": "Build REST APIs with Express",
      "target_date": "2026-12-15",
      "status": "Not Started",
      "created_at": "2026-10-28T08:30:00.000Z"
    }
  ]
}


If no courses exist, the response contains "count": 0 and an empty courses array.

3. Get a Specific Course

Endpoint: GET /api/courses/:id

Returns one course by its numeric ID.

Replace :id with the course ID.

Example:

bash
curl http://localhost:5000/api/courses/1


Success response: 200 OK

json
{
  "course": {
    "id": 1,
    "name": "Learn Node.js",
    "description": "Build REST APIs with Express",
    "target_date": "2026-12-15",
    "status": "Not Started",
    "created_at": "2026-10-28T08:30:00.000Z"
  }
}


If the course does not exist, the API returns 404 Not Found.

4. Update a Course

Endpoint: PUT /api/courses/:id

Replaces the editable fields of an existing course. All four required fields must be supplied.

Example:

bash
curl -X PUT http://localhost:5000/api/courses/1 \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Learn Node.js and Express",
    "description": "Build and test REST APIs",
    "target_date": "2027-01-15",
    "status": "In Progress"
  }'


Success response: 200 OK

The response contains the updated course. Its ID and original created_at timestamp remain unchanged.

If the course does not exist, the API returns 404 Not Found.

5. Delete a Course

Endpoint: DELETE /api/courses/:id

Deletes a course by ID.

Example:

bash
curl -X DELETE http://localhost:5000/api/courses/1


Success response: 200 OK

json
{
  "message": "Course deleted successfully.",
  "course": {
    "id": 1,
    "name": "Learn Node.js",
    "description": "Build REST APIs with Express",
    "target_date": "2026-12-15",
    "status": "Not Started",
    "created_at": "2026-10-28T08:30:00.000Z"
  }
}


The response includes the deleted course. The course is removed from courses.json.

If the course does not exist, the API returns 404 Not Found.

HTTP Status Codes
Status code	Meaning
200 OK	Request completed successfully.
201 Created	A new course was created.
400 Bad Request	Missing or invalid request fields, malformed JSON, or an invalid course ID.
404 Not Found	The course or API endpoint does not exist.
500 Internal Server Error	An unexpected server or file-storage error occurred.
Validation Rules

The API validates course data before creating or updating a course.

name is required and cannot be empty.
description is required and cannot be empty.
target_date is required and must be a valid calendar date in YYYY-MM-DD format.
status is required and must match one of the three allowed values.
Course IDs must be positive integers.
IDs and creation timestamps are generated by the server rather than supplied by the client.
Example validation error

If a request contains an invalid status:

json
{
  "name": "Learn JavaScript",
  "description": "Learn JavaScript fundamentals",
  "target_date": "2026-12-15",
  "status": "Started"
}


The API returns 400 Bad Request with an error explaining the allowed statuses.

Troubleshooting
1. API endpoint not found

Possible cause: The URL or HTTP method does not match a defined endpoint.

Solution:

Confirm the server is running on port 5000.
Use http://localhost:5000/api/courses to retrieve all courses.
Use /api/courses/1 to retrieve, update, or delete a specific course.
Make sure you use the correct HTTP method.

Opening a URL directly in a browser normally sends a GET request. Use Postman or curl for POST, PUT, and DELETE requests.

2. Cannot find module 'express'

Possible cause: Express has not been installed in the project directory.

Solution:

bash
npm install


Then restart the server:

bash
npm start

3. Port 5000 is already in use

Possible cause: Another application or another instance of CodeCraftHub is using port 5000.

Solution:

Stop the other server with Ctrl+C if it is running in another terminal.
Alternatively, stop the application using that port.
Restart CodeCraftHub with npm start.
4. courses.json is missing

Possible cause: The file was deleted or could not be accessed.

Solution:

Confirm the application has permission to access its project directory.
Check that the startup process completes successfully.
If necessary, create courses.json in the same directory as app.js with the contents:
json
[]


Restart the server.

5. Invalid JSON or malformed request body

Possible cause: The request body contains invalid JSON, missing quotation marks, or trailing commas.

Solution:

Select Body → raw → JSON in Postman.
Set Content-Type: application/json.
Check that property names and string values use double quotes.
Make sure commas and braces are correctly placed.
6. Course not found

Possible cause: The requested course ID does not exist.

Solution:

First retrieve all courses:

bash
curl http://localhost:5000/api/courses


Then use an ID that appears in the returned list.

7. Invalid course status or date

Possible cause: The status does not match an allowed value, or the date is invalid.

Solution:

Use one of these statuses exactly:

Not Started
In Progress
Completed

Use a valid date such as 2026-12-15 for target_date.

8. Data is not being saved

Possible cause: The application cannot write to the JSON file, or the file contents are invalid.

Solution:

Check the terminal for file-access errors.
Confirm the application has permission to write to courses.json.
Make sure the file contains a valid JSON array.
Avoid manually editing the file while requests are being processed.

Important: This JSON-file storage approach is intended for learning and lightweight local use. Concurrent writes may overwrite one another, and malformed file contents can prevent requests from succeeding.

Future Improvements

Possible enhancements for CodeCraftHub include:

Build a frontend using HTML, CSS, and JavaScript.
Add filtering by course status.
Sort courses by target completion date.
Add overdue-course tracking.
Write automated API tests.
Add a dedicated service layer for file operations.
Introduce safer write coordination or a database if usage grows.
License

This project is currently marked as ISC in package.json.

See the package.json file for the project's configured license.

CodeCraftHub — Track your learning goals, monitor your progress, and keep building your developer skills.
=======
# CodeCraftHub
>>>>>>> 3be32f7aeced5f3b867635a3738af565920f7164

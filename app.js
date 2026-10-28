
const express = require("express");
const fs = require("fs/promises");
const path = require("path");

const app = express();
const PORT = 5000;

// Parse incoming JSON request bodies.
app.use(express.json());

// Store courses.json in the same directory as app.js.
const DATA_FILE = path.join(__dirname, "courses.json");

// Only these three statuses are allowed.
const VALID_STATUSES = [
  "Not Started",
  "In Progress",
  "Completed",
];

// --------------------------------------------------
// 1. INITIALIZE THE JSON FILE
// --------------------------------------------------

// Create courses.json automatically if it does not exist.
// The "wx" flag prevents accidentally overwriting an
// existing file if another process creates it first.
async function initializeFile() {
  try {
    await fs.writeFile(DATA_FILE, "[]\n", {
      encoding: "utf8",
      flag: "wx",
    });

    console.log("courses.json created successfully.");
  } catch (error) {
    if (error.code !== "EEXIST") {
      throw error;
    }

    // The file already exists, so leave its contents alone.
  }
}

// --------------------------------------------------
// 2. HELPER FUNCTIONS
// --------------------------------------------------

// Read the JSON file and convert its contents into
// a JavaScript array of course objects.
async function readCourses() {
  const data = await fs.readFile(DATA_FILE, "utf8");

  // Invalid JSON will throw an error, handled by the
  // error-handling middleware at the bottom.
  const courses = JSON.parse(data);

  if (!Array.isArray(courses)) {
    throw new Error("courses.json must contain a JSON array.");
  }

  return courses;
}

// Convert the courses array into formatted JSON text
// and save it to the file.
async function writeCourses(courses) {
  const data = JSON.stringify(courses, null, 2) + "\n";

  await fs.writeFile(DATA_FILE, data, "utf8");
}

// Find a course using its numeric ID from the URL.
function findCourseIndex(courses, id) {
  return courses.findIndex((course) => course.id === id);
}

// Validate required fields and their values.
// Return an error message if validation fails,
// or null if the data is valid.
function validateCourse(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return "Request body must be a JSON object.";
  }

  const { name, description, target_date, status } = body;

  // Check required text fields.
  if (typeof name !== "string" || !name.trim()) {
    return "The name field is required.";
  }

  if (
    typeof description !== "string" ||
    !description.trim()
  ) {
    return "The description field is required.";
  }

  // Require a real calendar date in YYYY-MM-DD format.
  if (
    typeof target_date !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(target_date)
  ) {
    return "target_date is required and must use YYYY-MM-DD format.";
  }

  const [year, month, day] = target_date.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return "target_date must be a valid calendar date.";
  }

  // Check that the status matches one of the allowed values.
  if (!VALID_STATUSES.includes(status)) {
    return 'Status must be "Not Started", "In Progress", or "Completed".';
  }

  return null;
}

// Validate that a URL ID is a positive integer.
// This prevents IDs such as "abc" or "1.5" from being used.
function parseCourseId(value) {
  if (!/^[1-9]\d*$/.test(value)) {
    return null;
  }

  const id = Number(value);

  return Number.isSafeInteger(id) ? id : null;
}

// --------------------------------------------------
// 3. CREATE A COURSE
// POST /api/courses
// --------------------------------------------------

app.post("/api/courses", async (req, res, next) => {
  try {
    // Validate the incoming course data.
    const validationError = validateCourse(req.body);

    if (validationError) {
      return res.status(400).json({
        error: validationError,
      });
    }

    const courses = await readCourses();

    // Generate the next ID, starting at 1.
    // Using the maximum existing ID avoids reusing an
    // ID after a course has been deleted.
    const highestId = courses.reduce(
      (max, course) =>
        Number.isSafeInteger(course.id) && course.id > max
          ? course.id
          : max,
      0
    );

    if (highestId >= Number.MAX_SAFE_INTEGER) {
      return res.status(500).json({
        error: "Cannot generate another course ID.",
      });
    }

    const newCourse = {
      id: highestId + 1,
      name: req.body.name.trim(),
      description: req.body.description.trim(),
      target_date: req.body.target_date,
      status: req.body.status,
      created_at: new Date().toISOString(),
    };

    // Add the course to the array and save it.
    courses.push(newCourse);
    await writeCourses(courses);

    // HTTP 201 means a new resource was created.
    return res.status(201).json({
      message: "Course created successfully.",
      course: newCourse,
    });
  } catch (error) {
    next(error);
  }
});
// --------------------------------------------------
// 4. GET ALL COURSES
// GET /api/courses
// --------------------------------------------------

app.get("/api/courses", async (req, res, next) => {
  try {
    const courses = await readCourses();

    return res.status(200).json({
      count: courses.length,
      courses: courses,
    });
  } catch (error) {
    next(error);
  }
});
/**
 * GET /api/courses/stats
 * Returns the total number of courses and a count by status.
 */
app.get("/api/courses/stats", async (req, res, next) => {
  try {
    // Load all courses from the JSON file.
    const courses = await readCourses();

    // Initialize every status to zero so that statuses
    // with no courses are still included in the response.
    const stats = {
      "Not Started": 0,
      "In Progress": 0,
      "Completed": 0
    };

    // Count each course according to its current status.
    for (const course of courses) {
      if (Object.prototype.hasOwnProperty.call(stats, course.status)) {
        stats[course.status]++;
      }
    }

    // Return the total and the breakdown by status.
    res.status(200).json({
      totalCourses: courses.length,
      coursesByStatus: stats
    });
  } catch (error) {
    // Pass file-reading or other errors to the error handler.
    next(error);
  }
});



// --------------------------------------------------
// 5. GET A SPECIFIC COURSE
// GET /api/courses/:id
// --------------------------------------------------

app.get("/api/courses/:id", async (req, res, next) => {
  try {
    const id = parseCourseId(req.params.id);

    if (id === null) {
      return res.status(400).json({
        error: "Course ID must be a positive integer.",
      });
    }

    const courses = await readCourses();
    const index = findCourseIndex(courses, id);

    if (index === -1) {
      return res.status(404).json({
        error: `Course with ID ${id} was not found.`,
      });
    }

    return res.status(200).json({
      course: courses[index],
    });
  } catch (error) {
    next(error);
  }
});

// --------------------------------------------------
// 6. UPDATE A COURSE
// PUT /api/courses/:id
// --------------------------------------------------

app.put("/api/courses/:id", async (req, res, next) => {
  try {
    const id = parseCourseId(req.params.id);

    if (id === null) {
      return res.status(400).json({
        error: "Course ID must be a positive integer.",
      });
    }

    // PUT requires all four course fields.
    const validationError = validateCourse(req.body);

    if (validationError) {
      return res.status(400).json({
        error: validationError,
      });
    }

    const courses = await readCourses();
    const index = findCourseIndex(courses, id);

    if (index === -1) {
      return res.status(404).json({
        error: `Course with ID ${id} was not found.`,
      });
    }

    // Preserve the original ID and creation timestamp.
    // Update the editable fields with the new values.
    const updatedCourse = {
      id: courses[index].id,
      name: req.body.name.trim(),
      description: req.body.description.trim(),
      target_date: req.body.target_date,
      status: req.body.status,
      created_at: courses[index].created_at,
    };

    courses[index] = updatedCourse;

    await writeCourses(courses);

    return res.status(200).json({
      message: "Course updated successfully.",
      course: updatedCourse,
    });
  } catch (error) {
    next(error);
  }
});

// --------------------------------------------------
// 7. DELETE A COURSE
// DELETE /api/courses/:id
// --------------------------------------------------

app.delete("/api/courses/:id", async (req, res, next) => {
  try {
    const id = parseCourseId(req.params.id);

    if (id === null) {
      return res.status(400).json({
        error: "Course ID must be a positive integer.",
      });
    }

    const courses = await readCourses();
    const index = findCourseIndex(courses, id);

    if (index === -1) {
      return res.status(404).json({
        error: `Course with ID ${id} was not found.`,
      });
    }

    // Remove the matching course from the array.
    const deletedCourse = courses.splice(index, 1)[0];

    // Save the updated array to the JSON file.
    await writeCourses(courses);

    return res.status(200).json({
      message: "Course deleted successfully.",
      course: deletedCourse,
    });
  } catch (error) {
    next(error);
  }
});

// --------------------------------------------------
// 8. HANDLE UNKNOWN ROUTES
// --------------------------------------------------

// Return a clear 404 if the requested API route
// does not exist.
app.use((req, res) => {
  res.status(404).json({
    error: "API endpoint not found.",
  });
});

// --------------------------------------------------
// 9. CENTRAL ERROR HANDLING
// --------------------------------------------------

// This catches errors passed to next(error), including
// file access failures and unexpected server errors.
app.use((error, req, res, next) => {
  console.error("API error:", error);

  if (res.headersSent) {
    return next(error);
  }

  // Invalid or malformed JSON sent by the client.
  if (
    error instanceof SyntaxError &&
    error.status === 400 &&
    Object.prototype.hasOwnProperty.call(error, "body")
  ) {
    return res.status(400).json({
      error: "Invalid JSON in request body.",
    });
  }

  // The file could not be found or read.
  if (error.code === "ENOENT") {
    return res.status(500).json({
      error: "Course data file is missing.",
    });
  }

  // The application lacks permission to access the file.
  if (error.code === "EACCES" || error.code === "EPERM") {
    return res.status(500).json({
      error: "Permission denied while accessing course data.",
    });
  }

  // JSON stored in the file is malformed.
  if (error instanceof SyntaxError) {
    return res.status(500).json({
      error: "Course data file contains invalid JSON.",
    });
  }

  // A file read/write error or another unexpected error.
  return res.status(500).json({
    error: "An internal server error occurred.",
  });
});

// --------------------------------------------------
// 10. START THE SERVER
// --------------------------------------------------

// Initialize the JSON file before accepting requests.
// If initialization fails, report it rather than
// starting a server that cannot store course data.
initializeFile()
  .then(() => {
    console.log("CodeCraftHub API is starting...");
    console.log(`Data will be stored in: ${DATA_FILE}`);
    console.log(`API is available at: http://localhost:${PORT}`);

    app.listen(PORT);
  })
  .catch((error) => {
    console.error("Failed to initialize courses.json:", error);
    process.exitCode = 1;
  });

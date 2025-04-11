const express = require("express");
const { google } = require("googleapis");
const NodeCache = require("node-cache");
const cors = require("cors");
require("dotenv").config(); // Loads environment variables from a .env file

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to parse JSON requests
app.use(express.json());

// Use CORS middleware (allowing all origins)
app.use(cors({ origin: "*" }));

// Google Sheets configuration
const SPREADSHEET_ID = "1RZFbBMWwNdGXWf7d2gmnBzJLbVt4UM7ZpSHI_kGvBm0"; // Replace with your sheet's ID
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY; // Must be set in your environment (.env file or otherwise)

// Initialize NodeCache with a TTL of 5 hours (5 * 60 * 60 seconds)
const cache = new NodeCache({ stdTTL: 5 * 60 * 60 });

// Root endpoint for a basic check
app.get("/", (req, res) => {
  res.send("Leaderboard API");
});

// Helper function to compute and format the top 10 rows sorted by points as objects
// Assumes the first row is a header, names in first column and points in second column
function computeTop10(rows) {
  if (rows.length < 2) return [];
  // Exclude header row and sort based on points in descending order
  const dataRows = rows.slice(1);
  const sortedRows = dataRows.sort((a, b) => {
    const aPoints = parseFloat(a[1]) || 0;
    const bPoints = parseFloat(b[1]) || 0;
    return bPoints - aPoints;
  });
  // Get the top 10 rows
  const top10Rows = sortedRows.slice(0, 10);
  // Map each row to an object with "name" and "points" properties
  return top10Rows.map((row) => ({
    name: row[0],
    points: parseFloat(row[1]) || 0,
  }));
}

// Route to fetch a specific sheet by event name and return formatted top 10
app.get("/sheet/:eventname", async (req, res) => {
  const eventName = req.params.eventname;

  // Check if this event's data is cached
  const cachedData = cache.get(eventName);
  if (cachedData) {
    return res.json({
      source: "cache",
      event: eventName,
      data: cachedData.fullData,
      top10: cachedData.top10,
    });
  }

  try {
    // Create a Sheets API client using the API key
    const sheetsApi = google.sheets({ version: "v4", auth: GOOGLE_API_KEY });

    // Fetch data from the sheet where the tab name matches the event name.
    const response = await sheetsApi.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: eventName,
    });

    const rows = response.data.values;

    if (!rows || rows.length === 0) {
      return res
        .status(404)
        .json({ error: `No data found for event sheet: ${eventName}` });
    }

    // Compute the top 10 records as an array of objects
    const top10 = computeTop10(rows);

    // Cache both the raw data and the computed top 10
    cache.set(eventName, { fullData: rows, top10 });

    // Return a JSON response with both full data and the formatted top 10 data
    return res.json({
      source: "google-sheets",
      event: eventName,
      data: rows,
      top10: top10,
    });
  } catch (error) {
    console.error("Error fetching sheet:", error);
    return res.status(500).json({
      error: "Failed to fetch sheet data",
      details: error.message,
    });
  }
});

// Start the Express server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

module.exports = app;

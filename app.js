// const express = require('express');
// const axios = require('axios');
// require('dotenv').config();

// const app = express();
// const PORT = 3000;

// // Distance Matrix API Base URL and Key
// const API_BASE_URL = "https://api.distancematrix.ai/maps/api/distancematrix/json";
// const API_KEY = process.env.API_KEY; // Add your API key to the .env file

// app.get('/test-distance-matrix', async (req, res) => {
//     try {
//         // Hardcoded list of locations
//         const locations = [
//             "Westminster Abbey, London",
//             "St Paul's Cathedral, London",
//             "Tower of London, London"
//         ];

//         // Prepare query strings for origins and destinations
//         const origins = locations.join('|');
//         const destinations = locations.join('|');

//         // Call the Distance Matrix API
//         const response = await axios.get(API_BASE_URL, {
//             params: {
//                 origins,
//                 destinations,
//                 key: API_KEY,
//             },
//         });

//         const distanceMatrix = response.data;

//         // Log the distance matrix to the console
//         console.log("Distance Matrix Response:", JSON.stringify(distanceMatrix, null, 2));

//         // Send response back to the user
//         res.status(200).json(distanceMatrix);
//     } catch (error) {
//         console.error("Error fetching distance matrix:", error.message);
//         res.status(500).json({ error: "Failed to fetch distance matrix." });
//     }
// });

// // Start the server
// app.listen(PORT, () => {
//     console.log(`Server running on http://localhost:${PORT}`);
// });

const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');
const cors = require('cors'); // Import CORS
require('dotenv').config();

const app = express();
const PORT = 3000;

// Enable CORS for all origins (can be restricted to specific origins if needed)
app.use(cors());

// Middleware to parse JSON request bodies
app.use(bodyParser.json());

// Distance Matrix API Base URL and Key
const API_BASE_URL = "https://api.distancematrix.ai/maps/api/distancematrix/json";
const API_KEY = process.env.API_KEY; // Add your API key to the .env file

// Dynamic endpoint to calculate distance matrix
app.post('/calculate-distance', async (req, res) => {
    try {
        const { locations } = req.body;

        // Validate input: check if locations are provided and have at least 2 entries
        if (!Array.isArray(locations) || locations.length < 2) {
            return res.status(400).json({ error: "Provide at least two locations." });
        }

        // Prepare query strings for origins and destinations
        const origins = locations.join('|');
        const destinations = locations.join('|');

        // Call the Distance Matrix API
        const response = await axios.get(API_BASE_URL, {
            params: {
                origins,
                destinations,
                key: API_KEY,
            },
        });

        const distanceMatrix = response.data;

        // Log the distance matrix to the console
        console.log("Distance Matrix Response:", JSON.stringify(distanceMatrix, null, 2));

        // Send response back to the user
        res.status(200).json(distanceMatrix);
    } catch (error) {
        console.error("Error fetching distance matrix:", error.message);
        res.status(500).json({ error: "Failed to fetch distance matrix." });
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

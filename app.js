// const express = require('express');
// const axios = require('axios');
// const bodyParser = require('body-parser');
// const cors = require('cors'); // Import CORS
// require('dotenv').config();

// const app = express();
// const PORT = 3000;

// // Enable CORS for all origins (can be restricted to specific origins if needed)
// app.use(cors());

// // Middleware to parse JSON request bodies
// app.use(bodyParser.json());

// // Distance Matrix API Base URL and Key
// const API_BASE_URL = "https://api.distancematrix.ai/maps/api/distancematrix/json";
// const API_KEY = process.env.API_KEY; // Add your API key to the .env file

// // Dynamic endpoint to calculate distance matrix
// app.post('/calculate-distance', async (req, res) => {
//     try {
//         const { locations } = req.body;

//         // Validate input: check if locations are provided and have at least 2 entries
//         if (!Array.isArray(locations) || locations.length < 2) {
//             return res.status(400).json({ error: "Provide at least two locations." });
//         }

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
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = 3000;

app.use(cors());
app.use(bodyParser.json());

// Distance Matrix API Base URL and Key
const API_BASE_URL = "https://api.distancematrix.ai/maps/api/distancematrix/json";
const API_KEY = process.env.API_KEY; // Add your API key to the .env file

// Helper function to calculate the TSP (Travelling Salesman Problem) using dynamic programming
const tsp = (distances) => {
    const n = distances.length;
    const dp = Array(1 << n).fill().map(() => Array(n).fill(Infinity));
    const parent = Array(1 << n).fill().map(() => Array(n).fill(-1));

    // Base case: starting from the first city
    dp[1][0] = 0;

    // Dynamic programming to fill dp table
    for (let mask = 1; mask < (1 << n); mask++) {
        for (let u = 0; u < n; u++) {
            if ((mask & (1 << u)) === 0) continue; // u must be visited in the current subset
            for (let v = 0; v < n; v++) {
                if ((mask & (1 << v)) !== 0) continue; // v must not be visited yet
                const nextMask = mask | (1 << v);
                const newDist = dp[mask][u] + distances[u][v];
                if (newDist < dp[nextMask][v]) {
                    dp[nextMask][v] = newDist;
                    parent[nextMask][v] = u;
                }
            }
        }
    }

    // Find the optimal path and its cost
    let minCost = Infinity;
    let lastCity = -1;
    for (let i = 0; i < n; i++) {
        if (dp[(1 << n) - 1][i] < minCost) {
            minCost = dp[(1 << n) - 1][i];
            lastCity = i;
        }
    }

    // Reconstruct the path
    const path = [];
    let mask = (1 << n) - 1;
    while (lastCity !== -1) {
        path.push(lastCity);
        const prevCity = parent[mask][lastCity];
        mask ^= (1 << lastCity);
        lastCity = prevCity;
    }

    path.reverse();
    return { minCost, path };
};

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

        // Extract distance and duration for each origin-destination pair
        const distances = [];
        const durations = [];

        distanceMatrix.rows.forEach((row, originIndex) => {
            distances[originIndex] = [];
            durations[originIndex] = [];
            row.elements.forEach((element, destinationIndex) => {
                distances[originIndex][destinationIndex] = element.distance.value;
                durations[originIndex][destinationIndex] = element.duration.value;
            });
        });

        // Calculate the optimal route using TSP algorithm
        const { minCost, path } = tsp(distances);

        // Build the optimal route
        const optimalRoute = path.map((cityIndex) => {
            return {
                location: locations[cityIndex],
                distance: distanceMatrix.rows[cityIndex].elements[path[(path.indexOf(cityIndex) + 1) % path.length]].distance.text,
                duration: distanceMatrix.rows[cityIndex].elements[path[(path.indexOf(cityIndex) + 1) % path.length]].duration.text
            };
        });

        // Send the optimal route and total cost
        res.status(200).json({
            optimalRoute,
            totalDistance: minCost,
            totalDuration: durations[path[path.length - 1]][path[0]]
        });
    } catch (error) {
        console.error("Error fetching distance matrix:", error.message);
        res.status(500).json({ error: "Failed to fetch distance matrix." });
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

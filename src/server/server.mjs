import fetch from 'node-fetch';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import cors from 'cors';

dotenv.config(); // Load environment variables

const app = express();
const port = 8081;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(bodyParser.json()); // Parse incoming JSON requests
app.use(express.static(path.join(__dirname, 'dist'))); // Serve static files from the 'dist' directory
app.use(cors()); // Enable CORS

app.post('/trip', async (req, res) => {
    const { location, startDate } = req.body;

    if (!location || !startDate) {
        return res.status(400).json({ error: 'Location and startDate are required' });
    }

    try {
        const geoResponse = await fetch(`http://api.geonames.org/searchJSON?q=${location}&maxRows=1&username=${process.env.GEONAMES_USERNAME}`);
        if (!geoResponse.ok) throw new Error('Error fetching geographical data');
        const geoData = await geoResponse.json();
        const { lat, lng } = geoData.geonames[0];
        
        const weatherResponse = await fetch(`https://api.weatherbit.io/v2.0/forecast/daily?lat=${lat}&lon=${lng}&key=${process.env.WEATHERBIT_KEY}`);
        if (!weatherResponse.ok) throw new Error('Error fetching weather data');
        const weatherData = await weatherResponse.json();
        
        const pixabayResponse = await fetch(`https://pixabay.com/api/?key=${process.env.PIXABAY_KEY}&q=${location}&image_type=photo`);
        if (!pixabayResponse.ok) throw new Error('Error fetching image data');
        const pixabayData = await pixabayResponse.json();
        const imageUrl = pixabayData.hits[0]?.webformatURL || '../img/default-image.png';

        res.json({ weather: weatherData, imageUrl });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'An error occurred while fetching data' });
    }
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});

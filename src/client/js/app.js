// When the DOM content is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    displaySavedTrips(); // Display saved trips when the page loads
});

export const handleSubmit = async (event) => {
    event.preventDefault(); // Prevent the form from submitting the traditional way

    // Get values from the input fields
    const location = document.getElementById('location').value.trim();
    const startDate = document.getElementById('startDate').value;

    // Check if both location and start date are provided
    if (!location || !startDate) {
        document.getElementById('results').innerHTML = '<p>Please enter both location and start date.</p>';
        return;
    }

    // Check if the start date is in the future
    const today = new Date();
    const tripDate = new Date(startDate);

    if (tripDate < today) {
        document.getElementById('results').innerHTML = '<p>The start date must be in the future.</p>';
        return;
    }

    // Calculate days remaining until the trip
    const timeDifference = tripDate - today;
    const daysRemaining = Math.ceil(timeDifference / (1000 * 60 * 60 * 24));

    document.getElementById('results').innerHTML = '<p>Loading...</p>';

    try {
        // Fetch trip data from the server
        const response = await fetch('http://localhost:8081/trip', {
            method: 'POST',
            credentials: 'same-origin',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ location, startDate }),
        });

        if (!response.ok) throw new Error('Error fetching trip data'); // Handle server errors
        const data = await response.json();

        // Set default image if not provided
        const imageUrl = data.imageUrl || '../img/default-image.png';

        // Update results section with trip information
        document.getElementById('results').innerHTML = `
            <div class="output-item">
                <div class="output-details">
                    <h2>${location}</h2>
                    <p>${data.weather.data[0].weather.description}</p>
                    <p>High: ${data.weather.data[0].high_temp}°C, Low: ${data.weather.data[0].low_temp}°C</p>
                    <p>Start Date: ${startDate}</p>
                    <p>Days Remaining: ${daysRemaining} day(s)</p>
                    <button id="save-trip" class="btn btn-primary" type="button">Save Trip</button>
                </div>
                <img src="${imageUrl}" alt="Location Image">
            </div>
        `;

        // Add event listener to save button
        document.getElementById('save-trip').addEventListener('click', () => saveTrip(location, startDate, data, daysRemaining));
    } catch (error) {
        document.getElementById('results').innerHTML = `<p>Error: ${error.message}</p>`; // Display error message
    }
};

// Save trip to local storage
const saveTrip = (location, startDate, data, daysRemaining) => {
    const trip = {
        location,
        startDate,
        daysRemaining,
        weather: data.weather.data[0],
        imageUrl: data.imageUrl
    };

    let savedTrips = JSON.parse(localStorage.getItem('savedTrips')) || [];

    // Check if the trip already exists in saved trips
    const isTripExist = savedTrips.some(savedTrip => savedTrip.location === location && savedTrip.startDate === startDate);
    if (isTripExist) {
        alert('This trip is already saved!');
        return;
    }

    savedTrips.push(trip);

    // Save updated list of trips to local storage
    localStorage.setItem('savedTrips', JSON.stringify(savedTrips));

    displaySavedTrips(); // Refresh the display of saved trips
};

// Display saved trips from local storage
const displaySavedTrips = () => {
    const savedTripsContainer = document.getElementById('saved-trips');
    const savedTrips = JSON.parse(localStorage.getItem('savedTrips')) || [];

    if (savedTrips.length === 0) {
        savedTripsContainer.innerHTML = '<p>No saved trips</p>';
        return;
    }

    savedTrips.sort((a, b) => a.daysRemaining - b.daysRemaining);

    savedTripsContainer.innerHTML = '<h2>Saved Trips</h2>';

    savedTrips.forEach((trip, index) => {
        // Extract trip details
        const location = trip.location || 'Unknown Location';
        const weatherDescription = trip.weather && trip.weather.weather ? trip.weather.weather.description : 'No weather data';
        const highTemp = trip.weather && trip.weather.high_temp ? `${trip.weather.high_temp}°C` : 'N/A';
        const lowTemp = trip.weather && trip.weather.low_temp ? `${trip.weather.low_temp}°C` : 'N/A';
        const startDate = trip.startDate || 'N/A';
        const daysRemaining = trip.daysRemaining || 'N/A';
        const imageUrl = trip.imageUrl || '../img/default-image.png';

        // Set style for expired trips
        const tripStyle = trip.daysRemaining <= 0 ? 'expired-trip' : '';

        // Add trip information to the display
        savedTripsContainer.innerHTML += `
            <div class="output-item ${tripStyle}">
                <div class="output-details">
                    <h2>${location}</h2>
                    <p>${weatherDescription}</p>
                    <p>High: ${highTemp}, Low: ${lowTemp}</p>
                    <p>Start Date: ${startDate}</p>
                    <p>Days Remaining: ${daysRemaining} day(s)</p>
                    <button data-index="${index}" class="btn btn-danger delete-trip-btn">Delete Trip</button>
                </div>
                <img src="${imageUrl}" alt="Location Image">
            </div>
        `;
    });

    // Add event listeners to delete buttons
    document.querySelectorAll('.delete-trip-btn').forEach(button => {
        button.addEventListener('click', (event) => {
            const index = event.target.dataset.index;
            deleteTrip(index); // Delete trip when button is clicked
        });
    });
};

// Delete trip from local storage
const deleteTrip = (index) => {
    let savedTrips = JSON.parse(localStorage.getItem('savedTrips')) || [];

    savedTrips.splice(index, 1); // Remove the trip at the specified index

    // Update local storage with the modified list
    localStorage.setItem('savedTrips', JSON.stringify(savedTrips));

    displaySavedTrips(); // Refresh the display of saved trips
};

import React, { useState, useEffect } from 'react';
import { Calendar, Train, MapPin, Clock, ExternalLink } from 'lucide-react';
import './App.css';
import { Analytics } from "@vercel/analytics/react";

const App = () => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [originStation, setOriginStation] = useState('');
  const [destinationStation, setDestinationStation] = useState('');
  const [availableDestinations, setAvailableDestinations] = useState([]);
  const [searchResults, setSearchResults] = useState({});
  const [loading, setLoading] = useState(false);
  const [minDate, setMinDate] = useState('');
  const [maxDate, setMaxDate] = useState('');

  const originStations = ["Tokyo", "Osaka", "Takamatsu", "Izumoshi"];

  const destinationLogic = {
    "Tokyo": ["Okayama", "Takamatsu", "Izumoshi"],
    "Osaka": ["Takamatsu", "Izumoshi"],
    "Takamatsu": ["Okayama", "Osaka", "Tokyo"],
    "Izumoshi": ["Okayama", "Osaka", "Tokyo"],
    "Okayama": ["Tokyo", "Takamatsu", "Izumoshi"]
  };

  // Format date as YYYY-MM-DD
  const formatDate = (date) => date.toISOString().split('T')[0];

  // Set minimum and maximum dates based on GMT+9 timezone
  useEffect(() => {
    const now = new Date();
    const jstOffset = 9 * 60; // GMT+9 in minutes
    const utc = now.getTime() + now.getTimezoneOffset() * 60000;
    const jstNow = new Date(utc + jstOffset * 60000);
  
    // Determine REFERENCE DAY
    let referenceDay = new Date(jstNow);
    if (jstNow.getHours() >= 23) {
      referenceDay.setDate(referenceDay.getDate() + 1);
    }

    const min = new Date(referenceDay);
    const max = new Date(referenceDay);
    max.setMonth(max.getMonth() + 1); // One calendar month from REFERENCE DAY
  
    setMinDate(formatDate(min));
    setMaxDate(formatDate(max));
    setStartDate(formatDate(min));
    setEndDate(formatDate(min));
  }, []);


  // Update available destinations when origin changes
  useEffect(() => {
    if (originStation) {
      setAvailableDestinations(destinationLogic[originStation] || []);
      setDestinationStation('');
    }
  }, [originStation]);

  // Update end date when start date changes
  useEffect(() => {
    if (startDate && minDate) {
      const start = new Date(startDate);
      const reference = new Date(minDate);
      const maxAllowed = new Date(reference);
      maxAllowed.setMonth(maxAllowed.getMonth() + 1);
  
      // Clamp startDate if out of range
      if (start < reference) {
        setStartDate(minDate);
        return;
      }
      if (start > maxAllowed) {
        setStartDate(formatDate(maxAllowed));
        return;
      }

    // Adjust endDate limits
    const newMaxEnd = new Date(start);
    newMaxEnd.setMonth(newMaxEnd.getMonth() + 1);
    const end = new Date(endDate);

    setMaxDate(formatDate(newMaxEnd));

    if (end < start) {
      setEndDate(formatDate(start));
    }
  }
}, [startDate, minDate]);


  const formatDateForBackend = (dateStr) => {
    return dateStr.replace(/-/g, '');
  };

  const formatStationName = (station) => {
    return station === "Takamatsu" ? "Takamatsu%28Kagawa%20Pref.%29" : station;
  };

  // Function to call the API
  const checkAvailability = async (data) => {
    const response = await fetch('/api/check-availability', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  };

  const handleSearch = async () => {
    if (!startDate || !endDate || !originStation || !destinationStation) {
      alert('Please fill in all fields');
      return;
    }

    setLoading(true);
    setSearchResults({});

    try {
      const data = {
        departStName: formatStationName(originStation),
        arriveStName: formatStationName(destinationStation),
        startDate: formatDateForBackend(startDate),
        endDate: formatDateForBackend(endDate)
      };

      console.log('Sending to backend:', data);
      const results = await checkAvailability(data);
      setSearchResults(results);
    } catch (error) {
      console.error('Error searching:', error);
      alert('Error occurred while searching. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatDisplayDate = (dateStr) => {
    const date = new Date(dateStr.substring(0,4) + '-' + dateStr.substring(4,6) + '-' + dateStr.substring(6,8));
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const aggregateByTrain = (trains) => {
    const trainMap = {};
    
    trains.forEach(train => {
      if (!trainMap[train.trainName]) {
        trainMap[train.trainName] = {
          trainName: train.trainName,
          seatTypes: [],
          links: []
        };
      }
      trainMap[train.trainName].seatTypes.push(train.availableSeatType);
      trainMap[train.trainName].links.push(train.link);
    });

    return Object.values(trainMap);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-8 mb-6">
          <div className="flex items-center gap-3 mb-8">
            <Train className="text-blue-600" size={32} />
            <h1 className="text-3xl font-bold text-gray-800">JR Sunrise Express Space Checking</h1>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Date Selection */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-gray-700 font-medium">
                <Calendar size={20} />
                <span>Travel Dates</span>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    min={minDate}
                    max={maxDate}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">End Date</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    min={startDate || minDate}
                    max={maxDate}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Station Selection */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-gray-700 font-medium">
                <MapPin size={20} />
                <span>Route</span>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Origin Station</label>
                  <select
                    value={originStation}
                    onChange={(e) => setOriginStation(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select origin station...</option>
                    {originStations.map(station => (
                      <option key={station} value={station}>{station}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Destination Station</label>
                  <select
                    value={destinationStation}
                    onChange={(e) => setDestinationStation(e.target.value)}
                    disabled={!originStation}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                  >
                    <option value="">Select destination station...</option>
                    {availableDestinations.map(station => (
                      <option key={station} value={station}>{station}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={handleSearch}
            disabled={loading || !startDate || !endDate || !originStation || !destinationStation}
            className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors duration-200 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                Searching...
              </>
            ) : (
              <>
                <Clock size={20} />
                Search Available Trains
              </>
            )}
          </button>
        </div>

        {/* Search Results */}
        {Object.keys(searchResults).length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Search Results</h2>
            
            {Object.entries(searchResults).map(([date, trains]) => (
              <div key={date} className="mb-8 last:mb-0">
                <h3 className="text-xl font-semibold text-gray-700 mb-4 pb-2 border-b border-gray-200">
                  {formatDisplayDate(date)}
                </h3>
                
                {trains.length === 0 ? (
                  <p className="text-gray-500 italic">No trains available on this date</p>
                ) : (
                  <div className="space-y-4">
                    {aggregateByTrain(trains).map((train, index) => (
                      <div key={index} className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-lg font-medium text-gray-800">{train.trainName}</h4>
                          <div className="flex gap-2">
                            {train.links.slice(0, 1).map((link, linkIndex) => (
                              <a
                                key={linkIndex}
                                href={link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors duration-200 flex items-center gap-2"
                              >
                                Book Now
                                <ExternalLink size={16} />
                              </a>
                            ))}
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {train.seatTypes.map((seatType, seatIndex) => (
                            <span
                              key={seatIndex}
                              className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium"
                            >
                              {seatType}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default App;

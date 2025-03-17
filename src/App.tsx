import React, { useState } from 'react';
import axios from 'axios';
import { Ticket, Search, AlertCircle } from 'lucide-react';

// Use environment variable for backend URL (works on Vercel)
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "http://localhost:3005";

function App() {
  const [url, setUrl] = useState('');
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const checkInventory = async () => {
    if (!url.trim()) {
      setError('Please enter a valid URL.');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      const response = await axios.get(`${BACKEND_URL}/api/scrape?url=${encodeURIComponent(url)}`);
      setOffers(response.data.offers);
    } catch (err) {
      console.error("[ERROR] Failed to fetch inventory:", err);
      setError('Failed to fetch inventory data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getAvailabilityColor = (availability: string) => {
    return availability === 'http://schema.org/InStock' ? 'text-green-600' : 'text-red-600';
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-3xl w-full px-6 py-8 bg-white rounded-lg shadow-md">
        {/* Header */}
        <div className="flex items-center justify-center mb-6">
          <Ticket className="w-8 h-8 text-purple-600 mr-2" />
          <h1 className="text-2xl font-bold text-gray-900">BookMyShow Inventory Checker</h1>
        </div>

        {/* Input & Button */}
        <div className="mb-6">
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Enter BookMyShow event URL"
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <button
            onClick={checkInventory}
            disabled={loading || !url}
            className="w-full mt-4 px-6 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Search className="w-4 h-4" />
            {loading ? 'Checking...' : 'Check Inventory'}
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-4 bg-red-50 text-red-700 rounded-md flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            {error}
          </div>
        )}

        {/* Display Offers */}
        {offers.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {offers.map((offer, index) => (
              <div key={index} className="p-4 border rounded-lg shadow-sm bg-white">
                <h3 className="text-lg font-semibold mb-2">{offer.name}</h3>
                <p className="text-xl font-bold text-purple-600">₹{parseFloat(offer.price).toLocaleString('en-IN')}</p>
                <p className={`font-medium ${getAvailabilityColor(offer.availability)}`}>
                  {offer.availability === 'http://schema.org/InStock' ? 'In Stock' : 'Sold Out'}
                </p>
                {offer.availability === 'http://schema.org/InStock' && (
                  <p className="text-gray-600">Available Tickets: {offer.inventoryLevel}</p>
                )}
                <p className="text-sm text-gray-500">Valid From: {new Date(offer.validFrom).toLocaleDateString()}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;

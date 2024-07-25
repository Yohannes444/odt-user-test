import React, { useState, useEffect } from 'react';
import { useGeolocated } from 'react-geolocated';
import io from 'socket.io-client';
import './App.css';

const App = () => {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);

  const {
    coords,
    isGeolocationAvailable,
    isGeolocationEnabled,
  } = useGeolocated({
    positionOptions: {
      enableHighAccuracy: true,
    },
    userDecisionTimeout: 5000,
  });

  useEffect(() => {
    const newSocket = io('https://testonly-thqr.onrender.com', {
      transports: ['websocket'],
      autoConnect: false,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });
    

    newSocket.on('connect', () => {
      console.log('Connected to server');
      setConnected(true);
    });

    newSocket.on('disconnect', (reason) => {
      console.log('Disconnected from server:', reason);
      setConnected(false);
    });

    newSocket.on('connect_error', (error) => {
      console.error('Connection error:', error);
      setConnected(false);
    });

    newSocket.connect();
    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  useEffect(() => {
    if (coords && socket && connected) {
      socket.emit('sendLocation', {
        latitude: coords.latitude,
        longitude: coords.longitude,
      });
    }
  }, [coords, socket, connected]);

  return (
    <div className="App">
      <header className="App-header">
        <h1>Location Tracking App</h1>
      </header>
      <main>
        {!isGeolocationAvailable ? (
          <div>Your browser does not support Geolocation</div>
        ) : !isGeolocationEnabled ? (
          <div>Geolocation is not enabled</div>
        ) : coords ? (
          <div>
            <h2>Your current location:</h2>
            <p>Latitude: {coords.latitude}</p>
            <p>Longitude: {coords.longitude}</p>
          </div>
        ) : (
          <div>Getting the location data...</div>
        )}
      </main>
    </div>
  );
};

export default App;

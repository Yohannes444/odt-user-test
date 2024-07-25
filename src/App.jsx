import React, { useState, useEffect, useRef } from 'react';
import { useGeolocated } from 'react-geolocated';
import io from 'socket.io-client';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Container, Typography, Paper, Box } from '@mui/material';

const App = () => {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [map, setMap] = useState(null);
  const [marker, setMarker] = useState(null);

  const mapRef = useRef(null);

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

  useEffect(() => {
    if (!map && mapRef.current) {
      const newMap = L.map(mapRef.current).setView([0, 0], 13);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
      }).addTo(newMap);

      setMap(newMap);
    }

    if (coords && map) {
      if (marker) {
        marker.setLatLng([coords.latitude, coords.longitude]);
      } else {
        const newMarker = L.marker([coords.latitude, coords.longitude]).addTo(map);
        setMarker(newMarker);
      }
      map.setView([coords.latitude, coords.longitude], 13);
    }
  }, [coords, map]);

  return (
    <Container sx={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100%' }}>
      <Paper sx={{ padding: 2, textAlign: 'center', backgroundColor: 'primary.main', color: 'primary.contrastText' }}>
        <Typography variant="h4">Your Location</Typography>
      </Paper>
      <Box sx={{ flex: 1, position: 'relative' }}>
        <div ref={mapRef} style={{ height: '100%', width: '100%' }}></div>
      </Box>
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
    </Container>
  );
};

export default App;

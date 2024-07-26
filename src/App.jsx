import React, { useState, useEffect, useRef } from 'react';
import { useGeolocated } from 'react-geolocated';
import io from 'socket.io-client';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Container, Typography, Paper, Box } from '@mui/material';
import DirectionsCarFilledIcon from '@mui/icons-material/DirectionsCarFilled';

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
      // Create a custom Leaflet icon using DirectionsCarFilledIcon SVG
      const carIcon = L.divIcon({
        html: `
          <div style="font-size: 24px; color: black;">
            <svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24">
              <path d="M0 0h24v24H0z" fill="none"/>
              <path d="M18.92 5.01C18.72 4.42 18.16 4 17.53 4H6.47c-.63 0-1.19.42-1.39 1.01L3 10v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-4.99zM6.85 6h10.29l1.04 2.5H5.81L6.85 6zM19 16H5v-5h14v5zM7 18c-.83 0-1.5-.67-1.5-1.5S6.17 15 7 15s1.5.67 1.5 1.5S7.83 18 7 18zm10 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5S17.83 18 17 18z" fill="black"/>
            </svg>
          </div>`,
        className: '',
        iconSize: [24, 24],
        iconAnchor: [12, 12]
      });

      if (marker) {
        marker.setLatLng([coords.latitude, coords.longitude]);
        marker.setIcon(carIcon);
      } else {
        const newMarker = L.marker([coords.latitude, coords.longitude], { icon: carIcon }).addTo(map);
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

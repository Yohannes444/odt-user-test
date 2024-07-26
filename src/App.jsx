import React, { useState, useEffect, useRef } from 'react';
import { useGeolocated } from 'react-geolocated';
import io from 'socket.io-client';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Container, Typography, Paper, Box } from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';

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
      // Create a custom Leaflet icon using PersonIcon SVG
      const personIcon = L.divIcon({
        html: `
          <div style="font-size: 24px; color: black;">
            <svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24">
              <path d="M0 0h24v24H0z" fill="none"/>
              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
            </svg>
          </div>`,
        className: '',
        iconSize: [24, 24],
        iconAnchor: [12, 12]
      });

      if (marker) {
        marker.setLatLng([coords.latitude, coords.longitude]);
        marker.setIcon(personIcon);
      } else {
        const newMarker = L.marker([coords.latitude, coords.longitude], { icon: personIcon }).addTo(map);
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

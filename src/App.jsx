import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import io from 'socket.io-client';
import 'leaflet/dist/leaflet.css';
import { Container, Typography, Paper } from '@mui/material';
import { makeStyles } from '@mui/styles';

// Define custom styles using Material UI
const useStyles = makeStyles((theme) => ({
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    width: '100%',
    [theme.breakpoints.down('sm')]: {
      height: 'calc(100vh - 64px)', // Adjust height on smaller screens if needed
    },
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  map: {
    height: '100%',
    width: '100%',
  },
  header: {
    padding: theme.spacing(2),
    textAlign: 'center',
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.primary.contrastText,
  },
}));

const LocationTracking = () => {
  const classes = useStyles();
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const socket = useRef(null);
  const markersRef = useRef({}); // Store markers for each device

  useEffect(() => {
    // Initialize the map only if it hasn't been initialized yet
    if (!mapInstanceRef.current) {
      mapInstanceRef.current = L.map(mapRef.current).setView([0, 0], 2);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
      }).addTo(mapInstanceRef.current);
    }

    const addMarkers = (locations) => {
      // Remove existing markers
      Object.values(markersRef.current).forEach(marker => {
        mapInstanceRef.current.removeLayer(marker);
      });

      // Add new markers
      Object.entries(locations).forEach(([id, location]) => {
        const { latitude, longitude } = location;
        console.log('Received location for device', id, ': Latitude:', latitude, ', Longitude:', longitude); // Log location

        // Add or update marker for the device
        if (markersRef.current[id]) {
          markersRef.current[id].setLatLng([latitude, longitude]);
        } else {
          const marker = L.marker([latitude, longitude]).addTo(mapInstanceRef.current);
          markersRef.current[id] = marker; // Store marker reference
        }
      });

      // Adjust map view to fit all markers if there are any markers
      if (Object.keys(markersRef.current).length > 0) {
        const bounds = L.latLngBounds(Object.values(markersRef.current).map(marker => marker.getLatLng()));
        mapInstanceRef.current.fitBounds(bounds);
      }
    };

    // Connect to the socket
    socket.current = io('https://testonly-thqr.onrender.com', {
      transports: ['websocket'],
    });

    socket.current.on('connect', () => {
      console.log('Connected to server');
    });

    socket.current.on('updateLocations', (locations) => {
      console.log('Received locations:', locations);
      addMarkers(locations);
    });

    return () => {
      // Clean up the socket connection
      if (socket.current) {
        socket.current.disconnect();
      }

      // Clean up the map instance
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  return (
    <Container className={classes.container}>
      <Paper className={classes.header}>
        <Typography variant="h5">Live Location Tracking</Typography>
      </Paper>
      <div className={classes.mapContainer}>
        <div ref={mapRef} className={classes.map}></div>
      </div>
    </Container>
  );
};

export default LocationTracking;

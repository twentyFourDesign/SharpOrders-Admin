import React, {useEffect, useRef, forwardRef, useImperativeHandle} from 'react';
import {View, Platform} from 'react-native';

const WebMap = forwardRef(
  ({initialRegion, onRegionChangeComplete, children, style}, ref) => {
    const mapContainerRef = useRef(null);
    const mapInstanceRef = useRef(null);
    const LRef = useRef(null);

    useImperativeHandle(ref, () => ({
      animateToRegion: (region, duration) => {
        if (mapInstanceRef.current && region) {
          mapInstanceRef.current.flyTo(
            [region.latitude, region.longitude],
            13,
            {
              duration: duration / 1000,
            },
          );
        }
      },
    }));

    useEffect(() => {
      if (Platform.OS !== 'web' || !mapContainerRef.current) return;

      // Dynamically load Leaflet CSS and JS
      const loadLeaflet = () => {
        if (window.L) {
          initMap(window.L);
          return;
        }

        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);

        const script = document.createElement('script');
        script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
        script.onload = () => initMap(window.L);
        document.head.appendChild(script);
      };

      const initMap = L => {
        LRef.current = L;
        if (mapInstanceRef.current) return;

        const lat = initialRegion?.latitude || 6.5244;
        const lng = initialRegion?.longitude || 3.3792;
        const zoom = 13;

        const map = L.map(mapContainerRef.current).setView([lat, lng], zoom);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        }).addTo(map);

        map.on('moveend', () => {
          if (onRegionChangeComplete) {
            const center = map.getCenter();
            onRegionChangeComplete({
              latitude: center.lat,
              longitude: center.lng,
              latitudeDelta: 0.05,
              longitudeDelta: 0.05,
            });
          }
        });

        mapInstanceRef.current = map;
      };

      loadLeaflet();

      return () => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.remove();
          mapInstanceRef.current = null;
        }
      };
    }, []);

    return (
      <View style={[{flex: 1, minHeight: 300}, style]}>
        <div
          ref={mapContainerRef}
          style={{width: '100%', height: '100%', borderRadius: '8px'}}
        />
        {children}
      </View>
    );
  },
);

export const Marker = ({coordinate, title, description}) => {
  // Leaflet markers are handled differently; this is a simplified version
  // In a real app, we'd pass these as children to the Map and use another useEffect
  return null;
};

export const Polyline = () => null;
export const Polygon = () => null;
export const Circle = () => null;
export const Callout = () => null;

export default WebMap;

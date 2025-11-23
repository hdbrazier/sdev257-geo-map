import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
  SafeAreaView,
} from "react-native";
import * as Location from "expo-location";
import MapView, { Marker, Polygon } from "react-native-maps";

const API_KEY = "AIzaSyAn2A4AOiXbgJgz1h5nkqLwOZrRT7-pfgg"; 
const GEOCODE_URL = `https://maps.google.com/maps/api/geocode/json?key=${API_KEY}&latlng=`;


const ipaRegion = {
  coordinates: [
    { latitude: 43.8486744, longitude: -79.0695283 },
    { latitude: 43.8537168, longitude: -79.0700046 },
    { latitude: 43.8518394, longitude: -79.0725697 },
    { latitude: 43.8481651, longitude: -79.0716377 },
    { latitude: 43.8486744, longitude: -79.0695283 },
  ],
  strokeColor: "coral",
  strokeWidth: 4,
};

const stoutRegion = {
  coordinates: [
    { latitude: 43.8486744, longitude: -79.0693283 },
    { latitude: 43.8517168, longitude: -79.0710046 },
    { latitude: 43.8518394, longitude: -79.0715697 },
    { latitude: 43.8491651, longitude: -79.0716377 },
    { latitude: 43.8486744, longitude: -79.0693283 },
  ],
  strokeColor: "firebrick",
  strokeWidth: 4,
};

export default function App() {
  // Where Am I
  const [address, setAddress] = useState("Loading address...");
  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);

  // Restaurants
  const [restaurants, setRestaurants] = useState([]);
  const [nearestRestaurant, setNearestRestaurant] = useState(null);

  // Overlays (IPA / Stout)
  const [overlays, setOverlays] = useState([ipaRegion]);
  const [ipaStyles, setIpaStyles] = useState([styles.ipaText, styles.boldText]);
  const [stoutStyles, setStoutStyles] = useState([styles.stoutText]);

  const [errorMsg, setErrorMsg] = useState(null);
  const [loading, setLoading] = useState(true);

  // Distance helper (Haversine)
  const distanceInMeters = (lat1, lon1, lat2, lon2) => {
    const toRad = (value) => (value * Math.PI) / 180;
    const R = 6371000; // Earth R in meters

    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) *
        Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const findNearest = (userLocation, restaurantList) => {
    let nearest = null;
    let shortest = Infinity;

    restaurantList.forEach((place) => {
      const d = distanceInMeters(
        userLocation.latitude,
        userLocation.longitude,
        place.latitude,
        place.longitude
      );

      if (d < shortest) {
        shortest = d;
        nearest = { ...place, distance: d };
      }
    });

    return nearest;
  };

  const setPosition = async ({ coords: { latitude, longitude } }) => {
    setLatitude(latitude);
    setLongitude(longitude);

    if (API_KEY) {
      try {
        const resp = await fetch(`${GEOCODE_URL}${latitude},${longitude}`);
        const data = await resp.json();
        if (data.results && data.results.length > 0) {
          setAddress(data.results[0].formatted_address);
        } else {
          setAddress("Address not found.");
        }
      } catch (error) {
        console.log("Geocoding error:", error.message);
        setAddress("Error looking up address.");
      }
    } else {
      setAddress("Add your Google API key to see address.");
    }

    // Generate nearby restaurants based on user location
    const userLocation = { latitude, longitude };
    const generatedRestaurants = [
      {
        id: "1",
        name: "Cheers Bar",
        latitude: latitude + 0.002,
        longitude: longitude + 0.001,
      },
      {
        id: "2",
        name: "Central Perk",
        latitude: latitude - 0.0025,
        longitude: longitude + 0.0015,
      },
      {
        id: "3",
        name: "Paddy's Irish Pub",
        latitude: latitude + 0.0015,
        longitude: longitude - 0.002,
      },
    ];

    setRestaurants(generatedRestaurants);
    const nearest = findNearest(userLocation, generatedRestaurants);
    setNearestRestaurant(nearest);
  };

  // Setup location 
  useEffect(() => {
    let watcher;

    (async () => {
      try {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          setErrorMsg("Permission to access location was denied.");
          setLoading(false);
          return;
        }

        // Initial position
        const current = await Location.getCurrentPositionAsync({});
        await setPosition(current);

        // Position changes
        watcher = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.High,
            timeInterval: 5000,
            distanceInterval: 10,
          },
          setPosition
        );
      } catch (err) {
        console.log(err);
        setErrorMsg("Unable to get your current location.");
      } finally {
        setLoading(false);
      }
    })();

    return () => {
      watcher?.remove();
    };
  }, []);

  // Overlay button 
  function onClickIpa() {
    setIpaStyles([styles.ipaText, styles.boldText]);
    setStoutStyles([styles.stoutText]);
    setOverlays([ipaRegion]);
  }

  function onClickStout() {
    setStoutStyles([styles.stoutText, styles.boldText]);
    setIpaStyles([styles.ipaText]);
    setOverlays([stoutRegion]);
  }

  // Loading / error 
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text style={styles.text}>Getting your location...</Text>
      </View>
    );
  }

  if (errorMsg) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>{errorMsg}</Text>
      </View>
    );
  }

  if (!latitude || !longitude) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>Location not available.</Text>
      </View>
    );
  }

  const userLocation = { latitude, longitude };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.buttonRow}>
        <Text style={ipaStyles} onPress={onClickIpa}>
          IPA Fans
        </Text>
        <Text style={stoutStyles} onPress={onClickStout}>
          Stout Fans
        </Text>
      </View>

      {/*  Map (What's around me + Plotting points + Overlays) */}
      <MapView
        style={styles.map}
        showsUserLocation
        followsUserLocation
        initialRegion={{
          latitude,
          longitude,
          latitudeDelta: 0.02,
          longitudeDelta: 0.04,
        }}
      >
        {/* Overlays */}
        {overlays.map((region, i) => (
          <Polygon
            key={i}
            coordinates={region.coordinates}
            strokeColor={region.strokeColor}
            strokeWidth={region.strokeWidth}
          />
        ))}

        {/* Restaurant markers */}
        {restaurants.map((r) => (
          <Marker
            key={r.id}
            title={r.name}
            description={
              nearestRestaurant && r.id === nearestRestaurant.id
                ? "Nearest restaurant"
                : "Restaurant"
            }
            coordinate={{
              latitude: r.latitude,
              longitude: r.longitude,
            }}
          />
        ))}
      </MapView>

      {/* Info display - Where Am I + Nearest restaurant */}
      <View style={styles.infoPanel}>
        <Text style={styles.header}>My Location</Text>
        <Text style={styles.label}>Address: {address}</Text>
        <Text style={styles.label}>Latitude: {latitude}</Text>
        <Text style={styles.label}>Longitude: {longitude}</Text>

        <Text style={[styles.header, { marginTop: 12 }]}>
          Nearest Restaurant
        </Text>
        {nearestRestaurant ? (
          <>
            <Text style={styles.label}>Name: {nearestRestaurant.name}</Text>
            <Text style={styles.label}>
              Approx. distance:{" "}
              {nearestRestaurant.distance
                ? nearestRestaurant.distance.toFixed(0)
                : "?"}{" "}
              meters
            </Text>
          </>
        ) : (
          <Text style={styles.label}>No restaurants found.</Text>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 8,
    backgroundColor: "#fff",
  },
  ipaText: {
    fontSize: 16,
    color: "coral",
  },
  stoutText: {
    fontSize: 16,
    color: "firebrick",
  },
  boldText: {
    fontWeight: "bold",
    textDecorationLine: "underline",
  },
  map: {
    flex: 3,
  },
  infoPanel: {
    flex: 2,
    padding: 16,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  header: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 6,
  },
  label: {
    fontSize: 14,
    marginBottom: 4,
  },
  text: {
    fontSize: 16,
    marginTop: 8,
  },
  error: {
    fontSize: 16,
    color: "red",
    textAlign: "center",
  },
});

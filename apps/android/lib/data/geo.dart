/// Near me: distances to listings. Mirrors packages/shared/src/geo.ts (checked by test/catalog_test.dart).
///
/// A listing's own GPS point is used when present, else its mandal HQ, else its district HQ.
library;

import 'dart:math' as math;

import 'models.dart';

typedef LatLng = ({double lat, double lng});

const districtCenters = <String, LatLng>{
  'adilabad': (lat: 19.6641, lng: 78.532),
  'bhadradri-kothagudem': (lat: 17.55, lng: 80.619),
  'hanumakonda': (lat: 18.011, lng: 79.558),
  'hyderabad': (lat: 17.385, lng: 78.4867),
  'jagtial': (lat: 18.795, lng: 78.913),
  'jangaon': (lat: 17.724, lng: 79.152),
  'jayashankar-bhupalpally': (lat: 18.438, lng: 79.869),
  'jogulamba-gadwal': (lat: 16.235, lng: 77.799),
  'kamareddy': (lat: 18.32, lng: 78.338),
  'karimnagar': (lat: 18.4386, lng: 79.1288),
  'khammam': (lat: 17.2473, lng: 80.1514),
  'kumuram-bheem-asifabad': (lat: 19.365, lng: 79.284),
  'mahabubabad': (lat: 17.6, lng: 80.002),
  'mahabubnagar': (lat: 16.7488, lng: 78.0035),
  'mancherial': (lat: 18.871, lng: 79.444),
  'medak': (lat: 18.045, lng: 78.26),
  'medchal-malkajgiri': (lat: 17.629, lng: 78.481),
  'mulugu': (lat: 18.19, lng: 79.94),
  'nagarkurnool': (lat: 16.482, lng: 78.31),
  'nalgonda': (lat: 17.05, lng: 79.267),
  'narayanpet': (lat: 16.7457, lng: 77.4954),
  'nirmal': (lat: 19.096, lng: 78.344),
  'nizamabad': (lat: 18.6725, lng: 78.0941),
  'peddapalli': (lat: 18.614, lng: 79.374),
  'rajanna-sircilla': (lat: 18.388, lng: 78.81),
  'rangareddy': (lat: 17.2, lng: 78.6),
  'sangareddy': (lat: 17.6248, lng: 78.0866),
  'siddipet': (lat: 18.1018, lng: 78.852),
  'suryapet': (lat: 17.14, lng: 79.62),
  'vikarabad': (lat: 17.338, lng: 77.904),
  'wanaparthy': (lat: 16.362, lng: 78.062),
  'warangal': (lat: 17.9689, lng: 79.5941),
  'yadadri-bhuvanagiri': (lat: 17.511, lng: 78.889),
};

const mandalCenters = <String, Map<String, LatLng>>{
  'narayanpet': {
    'damaragidda': (lat: 16.8189, lng: 77.5031),
    'dhanwada': (lat: 16.65, lng: 77.6667),
    'gundumal': (lat: 16.93, lng: 77.66),
    'kosgi': (lat: 16.9878, lng: 77.7169),
    'kothapally': (lat: 16.87, lng: 77.68),
    'krishna': (lat: 16.4093, lng: 77.3286),
    'maddur': (lat: 16.8602, lng: 77.6121),
    'maganoor': (lat: 16.455, lng: 77.43),
    'makthal': (lat: 16.5021, lng: 77.5075),
    'marikal': (lat: 16.6036, lng: 77.7282),
    'narayanpet': (lat: 16.7445, lng: 77.496),
    'narva': (lat: 16.48, lng: 77.68),
    'utkoor': (lat: 16.6427, lng: 77.4874),
  },
};

const nearRadiiKm = [5, 10, 25, 50];

/// Great-circle distance in km.
double distanceKm(LatLng a, LatLng b) {
  const r = 6371.0;
  double rad(double d) => d * math.pi / 180;
  final dLat = rad(b.lat - a.lat);
  final dLng = rad(b.lng - a.lng);
  final h = math.pow(math.sin(dLat / 2), 2) + math.cos(rad(a.lat)) * math.cos(rad(b.lat)) * math.pow(math.sin(dLng / 2), 2);
  return 2 * r * math.asin(math.min(1, math.sqrt(h)));
}

/// Where a listing is: (point, exact?) — exact when the owner saved GPS.
(LatLng, bool)? listingPoint(Place p) {
  if (p.lat != null && p.lng != null) return ((lat: p.lat!, lng: p.lng!), true);
  final m = mandalCenters[p.district]?[p.mandal];
  if (m != null) return (m, false);
  final d = districtCenters[p.district];
  return d == null ? null : (d, false);
}

bool inTelanganaArea(LatLng p) => p.lat >= 15.3 && p.lat <= 20.2 && p.lng >= 76.8 && p.lng <= 81.6;

/// ~1 km precision; the visitor's location is never stored.
double roundCoord(double v) => (v * 100).round() / 100;

/// "3.2 కి.మీ" / "~12 కి.మీ"
String formatKm(double km, bool exact, String unit) => '${exact ? '' : '~'}${km < 10 ? km.toStringAsFixed(1) : km.round()} $unit';

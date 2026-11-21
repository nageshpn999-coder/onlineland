import 'catalog.dart';
import 'format.dart';
import 'geo.dart';
import 'models.dart';

class Filters {
  final String purpose;
  final String? type;
  final String? district;
  final String? mandal;
  final String? budget;
  final String sort; // newest | price-asc | price-desc | nearest
  /// "Near me": the phone's location (rounded to ~1 km, never stored) and an optional radius in km.
  final LatLng? near;
  final int? radius;

  const Filters({this.purpose = 'sale', this.type, this.district, this.mandal, this.budget, this.sort = 'newest', this.near, this.radius});

  Filters copyWith({
    String? purpose,
    String? Function()? type,
    String? Function()? district,
    String? Function()? mandal,
    String? Function()? budget,
    String? sort,
    LatLng? Function()? near,
    int? Function()? radius,
  }) {
    final nextDistrict = district != null ? district() : this.district;
    var nextMandal = mandal != null ? mandal() : this.mandal;
    if (nextMandal != null && !(mandals[nextDistrict]?.any((m) => m.id == nextMandal) ?? false)) nextMandal = null;
    final nextPurpose = purpose ?? this.purpose;
    return Filters(
      purpose: nextPurpose,
      type: type != null ? type() : this.type,
      district: nextDistrict,
      mandal: nextMandal,
      budget: nextPurpose != this.purpose ? null : (budget != null ? budget() : this.budget),
      sort: sort ?? this.sort,
      near: near != null ? near() : this.near,
      radius: radius != null ? radius() : this.radius,
    );
  }

  int get activeCount => [type, district, mandal, budget, near].where((v) => v != null).length;

  /// Turns "near me" on: nearest first, district/mandal cleared (it looks across Telangana).
  Filters nearMe(LatLng p) => Filters(purpose: purpose, type: type, budget: budget, sort: 'nearest', near: p);

  Filters nearOff() => Filters(purpose: purpose, type: type, district: district, mandal: mandal, budget: budget);
}

List<Property> applyFilters(List<Property> list, Filters f) {
  final budget = parseBudget(f.budget);
  final near = f.near;
  final dist = <String, double>{};
  if (near != null) {
    for (final p in list) {
      final pt = listingPoint(p.place);
      if (pt != null) dist[p.id] = distanceKm(near, pt.$1);
    }
  }
  final out = list.where((p) {
    if (near != null && f.radius != null && (dist[p.id] ?? double.infinity) > f.radius!) return false;
    if (p.status != 'approved') return false;
    if (p.purpose != f.purpose) return false;
    if (f.type != null && p.category != f.type) return false;
    if (f.district != null && p.place.district != f.district) return false;
    if (f.mandal != null && p.place.mandal != f.mandal) return false;
    if (budget != null) {
      final t = p.total;
      if (t < budget.$1) return false;
      if (budget.$2 != null && t > budget.$2!) return false;
    }
    return true;
  }).toList();
  int newest(Property a, Property b) => b.createdAt.compareTo(a.createdAt);
  switch (f.sort) {
    case 'price-asc':
      out.sort((a, b) => a.total.compareTo(b.total) != 0 ? a.total.compareTo(b.total) : newest(a, b));
    case 'price-desc':
      out.sort((a, b) => b.total.compareTo(a.total) != 0 ? b.total.compareTo(a.total) : newest(a, b));
    case 'nearest' when near != null:
      int byKm(Property a, Property b) => (dist[a.id] ?? double.infinity).compareTo(dist[b.id] ?? double.infinity);
      out.sort((a, b) => byKm(a, b) != 0 ? byKm(a, b) : newest(a, b));
    default:
      out.sort((a, b) => a.isFeatured != b.isFeatured ? (a.isFeatured ? -1 : 1) : newest(a, b));
  }
  return out;
}

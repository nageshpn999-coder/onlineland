import 'catalog.dart';
import 'format.dart';
import 'models.dart';

class Filters {
  final String purpose;
  final String? type;
  final String? district;
  final String? mandal;
  final String? budget;
  final String sort; // newest | price-asc | price-desc

  const Filters({this.purpose = 'sale', this.type, this.district, this.mandal, this.budget, this.sort = 'newest'});

  Filters copyWith({
    String? purpose,
    String? Function()? type,
    String? Function()? district,
    String? Function()? mandal,
    String? Function()? budget,
    String? sort,
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
    );
  }

  int get activeCount => [type, district, mandal, budget].where((v) => v != null).length;
}

List<Property> applyFilters(List<Property> list, Filters f) {
  final budget = parseBudget(f.budget);
  final out = list.where((p) {
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
    default:
      out.sort((a, b) => a.isFeatured != b.isFeatured ? (a.isFeatured ? -1 : 1) : newest(a, b));
  }
  return out;
}

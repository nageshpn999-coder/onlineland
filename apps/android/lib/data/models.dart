import 'catalog.dart';

class Place {
  final String district;
  final String mandal;
  final String village;
  final double? lat;
  final double? lng;
  const Place({required this.district, required this.mandal, required this.village, this.lat, this.lng});

  /// "Makthal town, మక్తల్, నారాయణపేట" — skips a village that only repeats the mandal.
  String label(bool te) {
    final d = byId(districts, district);
    final m = byId(mandals[district] ?? const [], mandal);
    final mandalName = m?.label(te) ?? mandal;
    final same = [mandal, m?.en, m?.te].whereType<String>().any((n) => n.toLowerCase() == village.trim().toLowerCase());
    final parts = <String>[if (village.isNotEmpty && !same) village, if (mandalName.isNotEmpty) mandalName, d?.label(te) ?? district];
    final out = <String>[];
    for (final p in parts) {
      if (!out.contains(p)) out.add(p);
    }
    return out.join(', ');
  }
}

class Property {
  final String id;
  final String? code;
  final String category;
  final String purpose; // sale | rent
  final String titleTe;
  final String titleEn;
  final String descriptionTe;
  final String descriptionEn;
  final num price;
  final String priceBasis; // total | per-unit | per-month
  final num area;
  final String areaUnit;
  final Place place;
  final String? facing;
  final bool? roadAccess;
  final String? waterSource;
  final String? coverPath;
  final List<String> photos;
  final String status;
  final bool isFeatured;
  final bool docsVerified;
  final String? rejectReason;
  final String ownerId;
  final DateTime createdAt;

  const Property({
    required this.id,
    required this.code,
    required this.category,
    required this.purpose,
    required this.titleTe,
    required this.titleEn,
    this.descriptionTe = '',
    this.descriptionEn = '',
    required this.price,
    required this.priceBasis,
    required this.area,
    required this.areaUnit,
    required this.place,
    this.facing,
    this.roadAccess,
    this.waterSource,
    this.coverPath,
    this.photos = const [],
    required this.status,
    this.isFeatured = false,
    this.docsVerified = false,
    this.rejectReason,
    required this.ownerId,
    required this.createdAt,
  });

  /// Total price (sale) or monthly rent; per-acre prices are multiplied by the area.
  num get total => priceBasis == 'per-unit' ? (price * area).round() : price;

  String title(bool te) => te ? (titleTe.isNotEmpty ? titleTe : titleEn) : (titleEn.isNotEmpty ? titleEn : titleTe);
  String description(bool te) => te ? (descriptionTe.isNotEmpty ? descriptionTe : descriptionEn) : (descriptionEn.isNotEmpty ? descriptionEn : descriptionTe);
}

/// What an owner fills in when posting a property.
class ListingDraft {
  String category = 'agricultural';
  String purpose = 'sale';
  String title = '';
  String description = '';
  num? price;
  String priceBasis = 'per-unit';
  num? area;
  String areaUnit = 'acre';
  String district = 'narayanpet';
  String mandal = 'makthal';
  String village = '';
  double? lat;
  double? lng;
  String? facing;
  bool? roadAccess;
  String ownerName = '';
  String ownerPhone = '';
}

class AppUser {
  final String uid;
  final String? phone;
  final String role;
  const AppUser({required this.uid, this.phone, this.role = 'buyer'});
  bool get canPost => role == 'owner' || role == 'dealer' || role == 'admin';
}

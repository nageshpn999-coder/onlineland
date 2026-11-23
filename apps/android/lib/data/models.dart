import 'catalog.dart';
import 'media.dart';

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
  final List<ListingVideo> videos;
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
    this.videos = const [],
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

// ---------------------------------------------------------------- revenue (decision D7)

/// A subscription plan. Defaults mirror packages/shared/src/plans.ts (checked by test/catalog_test.dart);
/// live values come from plans/{id} in Firestore (edited in the admin dashboard).
class PlanConfig {
  final String id;
  final String nameTe;
  final String nameEn;
  final int priceInr;
  final int durationDays;
  final int listingLimit; // 0 = unlimited
  final int featuredSlots;
  final bool ownContact;
  final bool verifiedBadge;
  final bool dealerPage;
  final bool areaLeads;
  const PlanConfig({
    required this.id,
    required this.nameTe,
    required this.nameEn,
    required this.priceInr,
    required this.durationDays,
    required this.listingLimit,
    required this.featuredSlots,
    required this.ownContact,
    required this.verifiedBadge,
    required this.dealerPage,
    required this.areaLeads,
  });
  String name(bool te) => te ? nameTe : nameEn;

  PlanConfig merge(Map<String, dynamic> d) {
    final n = d['name'] is Map ? Map<String, dynamic>.from(d['name'] as Map) : const <String, dynamic>{};
    int i(String k, int v) => (d[k] as num?)?.toInt() ?? v;
    bool b(String k, bool v) => d[k] is bool ? d[k] as bool : v;
    return PlanConfig(
      id: id,
      nameTe: (n['te'] as String?) ?? nameTe,
      nameEn: (n['en'] as String?) ?? nameEn,
      priceInr: i('priceInr', priceInr),
      durationDays: i('durationDays', durationDays),
      listingLimit: i('listingLimit', listingLimit),
      featuredSlots: i('featuredSlots', featuredSlots),
      ownContact: b('ownContact', ownContact),
      verifiedBadge: b('verifiedBadge', verifiedBadge),
      dealerPage: b('dealerPage', dealerPage),
      areaLeads: b('areaLeads', areaLeads),
    );
  }
}

const defaultPlans = <String, PlanConfig>{
  'free': PlanConfig(id: 'free', nameTe: 'ఉచితం', nameEn: 'Free', priceInr: 0, durationDays: 0, listingLimit: 2, featuredSlots: 0,
      ownContact: false, verifiedBadge: false, dealerPage: false, areaLeads: false),
  'basic': PlanConfig(id: 'basic', nameTe: 'బేసిక్', nameEn: 'Basic', priceInr: 499, durationDays: 30, listingLimit: 15, featuredSlots: 0,
      ownContact: true, verifiedBadge: true, dealerPage: false, areaLeads: false),
  'pro': PlanConfig(id: 'pro', nameTe: 'ప్రో', nameEn: 'Pro', priceInr: 1499, durationDays: 30, listingLimit: 0, featuredSlots: 2,
      ownContact: true, verifiedBadge: true, dealerPage: true, areaLeads: true),
};

class Pricing {
  final int featuredWeekInr;
  final int featuredDays;
  final int ownerFreeListings;
  final int ownerListingInr;
  final int ownerListingDays;
  final String upiId;
  final String upiName;
  const Pricing({
    this.featuredWeekInr = 199,
    this.featuredDays = 7,
    this.ownerFreeListings = 1,
    this.ownerListingInr = 199,
    this.ownerListingDays = 90,
    this.upiId = '',
    this.upiName = 'OnlineLand Infra Private Limited',
  });

  factory Pricing.fromMap(Map<String, dynamic> d) {
    const z = Pricing();
    int i(String k, int v) => (d[k] as num?)?.toInt() ?? v;
    return Pricing(
      featuredWeekInr: i('featuredWeekInr', z.featuredWeekInr),
      featuredDays: i('featuredDays', z.featuredDays),
      ownerFreeListings: i('ownerFreeListings', z.ownerFreeListings),
      ownerListingInr: i('ownerListingInr', z.ownerListingInr),
      ownerListingDays: i('ownerListingDays', z.ownerListingDays),
      upiId: (d['upiId'] as String?) ?? z.upiId,
      upiName: (d['upiName'] as String?) ?? z.upiName,
    );
  }

  /// upi://pay link — opens GPay / PhonePe / Paytm with the amount filled in.
  Uri upiUri(int amountInr, String note) => Uri(scheme: 'upi', host: 'pay', queryParameters: {
        'pa': upiId,
        'pn': upiName,
        'am': amountInr.toStringAsFixed(2),
        'cu': 'INR',
        'tn': note,
      });
}

class RevenueConfig {
  final Map<String, PlanConfig> plans;
  final Pricing pricing;
  const RevenueConfig({this.plans = defaultPlans, this.pricing = const Pricing()});
}

/// dealers/{uid}: the user's plan and badge (written by Cloud Functions).
class DealerInfo {
  final String planId;
  final DateTime? validUntil;
  final bool verified;
  final int featuredSlots;
  final int featuredUsed;
  const DealerInfo({this.planId = 'free', this.validUntil, this.verified = false, this.featuredSlots = 0, this.featuredUsed = 0});
  bool active(DateTime now) => validUntil != null && validUntil!.isAfter(now);
  int get slotsLeft => (featuredSlots - featuredUsed).clamp(0, 99);
}

class PaymentInfo {
  final String id;
  final String kind; // plan | featured | listing
  final String? planId;
  final String? propertyId;
  final int amountInr;
  final String utr;
  final String status; // pending | approved | rejected
  final String? rejectReason;
  final DateTime createdAt;
  const PaymentInfo({
    required this.id,
    required this.kind,
    this.planId,
    this.propertyId,
    required this.amountInr,
    required this.utr,
    required this.status,
    this.rejectReason,
    required this.createdAt,
  });
}

/// An enquiry that came from the dealer's own share link.
class LeadInfo {
  final String id;
  final String? propertyId;
  final String channel;
  final String? name;
  final String? phone;
  final String? message;
  final DateTime createdAt;
  const LeadInfo({required this.id, this.propertyId, required this.channel, this.name, this.phone, this.message, required this.createdAt});
}

class ListingStats {
  final int views;
  final int shares;
  final int leads;
  const ListingStats({this.views = 0, this.shares = 0, this.leads = 0});
}

/// 12-digit UPI transaction reference.
final utrPattern = RegExp(r'^\d{12}$');

/// Link to share a listing. The owner's own link carries `?ref=<uid>` so enquiries are credited to them.
String shareLink(String code, String locale, {String? refId}) =>
    'https://onlineland.in/$locale/properties/$code${refId != null ? '?ref=${Uri.encodeQueryComponent(refId)}' : ''}';

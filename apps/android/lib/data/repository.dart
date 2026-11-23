import 'dart:typed_data';

import 'media.dart';
import 'models.dart';

/// Everything the app reads or writes. Two implementations:
///  - DemoRepository: sample data in memory, nothing leaves the phone (used before the Firebase project exists, and in tests)
///  - FirebaseRepository: onlineland-dev / onlineland-prod, checked by the Phase 4 security rules
abstract class Repository {
  bool get isDemo;

  /// Approved listings, newest first.
  Future<List<Property>> approvedProperties();
  Future<Property?> propertyByCode(String code);

  /// Public download URL for a Storage path.
  String photoUrl(String path);

  Future<void> createLead({required String? propertyId, required String channel, required String locale, String? name, String? phone, String? message});
  Future<void> createSiteVisit({required String propertyId, required String name, required String phone, required String date, required String slot, required String locale});

  // ---- account ----
  Stream<AppUser?> authChanges();
  AppUser? get currentUser;

  /// Sends an OTP. Returns a verification id to pass to [verifyOtp].
  Future<String> sendOtp(String phone10);
  Future<AppUser> verifyOtp(String verificationId, String code);
  Future<void> signOut();

  /// Buyer → owner (Cloud Function). Returns the new role.
  Future<String> becomeOwner();

  // ---- owners ----
  /// Creates the listing, uploads photos, then submits it for review (status "pending").
  /// [video]: a compressed MP4 to upload or a YouTube link (optional, one per listing).
  Future<String> submitListing(ListingDraft draft, List<Uint8List> photos,
      {VideoAttachment? video, void Function(int done, int total)? onProgress});
  Future<List<Property>> myListings();

  /// Deletes the signed-in user's account and data (Play Store / DPDP requirement), then signs out.
  Future<void> deleteAccount();

  // ---- revenue (D7) ----
  /// Plans and prices (Firestore values over the defaults).
  Future<RevenueConfig> revenueConfig();

  /// The signed-in user's plan and badge, or null if they never had one.
  Future<DealerInfo?> myDealer();

  /// Records a UPI payment for admin to check. kind: plan | featured | listing | service.
  /// billing: month | year (plans only). serviceRequestId: kind "service".
  Future<void> submitPayment({required String kind, String? planId, String? propertyId, String? billing, String? serviceRequestId, required int amountInr, required String utr});
  Future<List<PaymentInfo>> myPayments();

  /// Enquiries from the user's own share links (needs an active paid plan).
  Future<List<LeadInfo>> myLeads();
  Future<ListingStats> listingStats(String propertyId);

  /// Pro plan: put one live listing on top (uses a featured slot).
  Future<void> useFeaturedSlot(String propertyId);

  // ---- Phase 9 ----
  /// New dealers in offer districts take the free plan once (Cloud Function). Throws RepoException
  /// already-exists (used) / failed-precondition (offer off, district not included, plan running).
  Future<void> claimLaunchOffer(String district);

  /// Asks for a paid service (login optional). Returns the request id.
  Future<String> requestService({required String serviceId, String? propertyId, required String name, required String phone, String? note, required String locale});
  Future<List<ServiceRequestInfo>> myServiceRequests();
  Future<void> cancelServiceRequest(String id);

  /// Owners: change how they want to sell a listing (self / assisted).
  Future<void> setSaleMode(String propertyId, String mode);

  /// Counts a view / share for the owner's stats. Never throws.
  Future<void> track(String propertyId, String type);

  // ---- favorites sync + notifications (no-ops in demo) ----
  Future<void> syncFavorite(String propertyId, bool saved);
  Future<void> registerDevice(String token);
}

class RepoException implements Exception {
  final String code;
  final String message;
  RepoException(this.code, this.message);
  @override
  String toString() => '$code: $message';
}

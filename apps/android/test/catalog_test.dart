import 'dart:io';

import 'package:flutter_test/flutter_test.dart';
import 'package:onlineland/data/catalog.dart';
import 'package:onlineland/data/models.dart';

/// The app's lists must match packages/shared (used by the website and Cloud Functions).
void main() {
  final locations = File('../../packages/shared/src/locations.ts').readAsStringSync();
  final property = File('../../packages/shared/src/property.ts').readAsStringSync();
  final row = RegExp(r"\{ id: '([^']+)', name: \{ en: '([^']+)', te: '([^']+)' \} \}");
  final cat = RegExp(r"\{ id: '([^']+)', slug: '[^']+', label: \{ en: '([^']+)', te: '([^']+)' \} \}");

  test('districts and Narayanpet mandals match the shared list', () {
    final all = row.allMatches(locations).map((m) => '${m[1]}|${m[2]}|${m[3]}').toList();
    final expected = [
      for (final d in districts) '${d.id}|${d.en}|${d.te}',
      for (final m in mandals['narayanpet']!) '${m.id}|${m.en}|${m.te}',
    ];
    expect(all, expected);
  });

  test('categories match the shared list', () {
    final all = cat.allMatches(property).map((m) => '${m[1]}|${m[2]}|${m[3]}').toList();
    expect(all, [for (final c in categories) '${c.id}|${c.en}|${c.te}']);
  });

  test('plan defaults and prices match the shared D7 list', () {
    final plans = File('../../packages/shared/src/plans.ts').readAsStringSync();
    for (final p in defaultPlans.values) {
      final block = RegExp('${p.id}: \\{([\\s\\S]*?)\\n  \\},').firstMatch(plans)![1]!;
      int n(String k) => int.parse(RegExp('$k: (\\d+)').firstMatch(block)![1]!);
      bool b(String k) => RegExp('$k: (true|false)').firstMatch(block)![1] == 'true';
      expect(block, contains("te: '${p.nameTe}', en: '${p.nameEn}'"), reason: p.id);
      expect([n('priceInr'), n('durationDays'), n('listingLimit'), n('featuredSlots')], [p.priceInr, p.durationDays, p.listingLimit, p.featuredSlots], reason: p.id);
      expect([b('ownContact'), b('verifiedBadge'), b('dealerPage'), b('areaLeads')], [p.ownContact, p.verifiedBadge, p.dealerPage, p.areaLeads], reason: p.id);
    }
    const z = Pricing();
    int price(String k) => int.parse(RegExp('$k: (\\d+)').firstMatch(plans.substring(plans.indexOf('DEFAULT_PRICING')))![1]!);
    expect([price('featuredWeekInr'), price('featuredDays'), price('ownerFreeListings'), price('ownerListingInr'), price('ownerListingDays')],
        [z.featuredWeekInr, z.featuredDays, z.ownerFreeListings, z.ownerListingInr, z.ownerListingDays]);
  });

  test('share links carry the owner ref; UTR must be 12 digits', () {
    expect(shareLink('OL-1001', 'te'), 'https://onlineland.in/te/properties/OL-1001');
    expect(shareLink('OL-1001', 'en', refId: 'abc'), 'https://onlineland.in/en/properties/OL-1001?ref=abc');
    expect(utrPattern.hasMatch('412345678901'), isTrue);
    expect(utrPattern.hasMatch('41234567890'), isFalse);
    const p = Pricing(upiId: 'onlineland@okaxis');
    final uri = p.upiUri(499, 'OnlineLand Basic');
    expect(uri.scheme, 'upi');
    expect(uri.queryParameters['pa'], 'onlineland@okaxis');
    expect(uri.queryParameters['am'], '499.00');
  });
}

import 'dart:io';

import 'package:flutter_test/flutter_test.dart';
import 'package:onlineland/data/catalog.dart';

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
}

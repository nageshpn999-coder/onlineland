import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:material_ui/material_ui.dart';
import 'package:onlineland/app.dart';
import 'package:onlineland/data/demo_repository.dart';
import 'package:onlineland/state.dart';
import 'package:shared_preferences/shared_preferences.dart';

/// Starts the app with demo data. Phone size 412×915 (common Android).
Future<DemoRepository> pumpApp(WidgetTester tester, {bool onboarded = true, String locale = 'te'}) async {
  tester.view.physicalSize = const Size(412 * 3, 915 * 3);
  tester.view.devicePixelRatio = 3;
  addTearDown(tester.view.reset);
  SharedPreferences.setMockInitialValues({'onboarded': onboarded, 'locale': locale});
  final prefs = await SharedPreferences.getInstance();
  final repo = DemoRepository(now: DateTime(2026, 11, 17));
  await tester.pumpWidget(ProviderScope(
    overrides: [prefsProvider.overrideWithValue(prefs), repositoryProvider.overrideWithValue(repo)],
    child: const OnlineLandApp(),
  ));
  await tester.pumpAndSettle();
  return repo;
}

/// The home/listing list is the first scrollable on screen (tabs are kept alive in an IndexedStack).
Future<void> scrollTo(WidgetTester tester, Finder target) async {
  await tester.scrollUntilVisible(target, 300, scrollable: find.byType(Scrollable).first);
  await tester.pumpAndSettle();
}

/// Bottom navigation: 0 Home, 1 Properties, 2 Saved, 3 Sell, 4 Profile.
Future<void> tapTab(WidgetTester tester, int index) async {
  await tester.tap(find.byType(NavigationDestination).at(index));
  await tester.pumpAndSettle();
}

Future<void> openFirstListing(WidgetTester tester) async {
  await scrollTo(tester, find.text('బోర్‌వెల్ ఉన్న వ్యవసాయ భూమి').first);
  await tester.tap(find.text('బోర్‌వెల్ ఉన్న వ్యవసాయ భూమి').first);
  await tester.pumpAndSettle();
}

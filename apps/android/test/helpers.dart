import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:material_ui/material_ui.dart';
import 'package:onlineland/app.dart';
import 'package:onlineland/data/demo_repository.dart';
import 'package:onlineland/data/geo.dart';
import 'package:onlineland/state.dart';
import 'package:onlineland/ui/home.dart';
import 'package:shared_preferences/shared_preferences.dart';

/// Starts the app with demo data. Phone size 412×915 (common Android).
Future<DemoRepository> pumpApp(WidgetTester tester, {bool onboarded = true, String locale = 'te', LatLng? location}) async {
  tester.view.physicalSize = const Size(412 * 3, 915 * 3);
  tester.view.devicePixelRatio = 3;
  addTearDown(tester.view.reset);
  SharedPreferences.setMockInitialValues({'onboarded': onboarded, 'locale': locale});
  final prefs = await SharedPreferences.getInstance();
  final repo = DemoRepository(now: DateTime(2026, 11, 17));
  await tester.pumpWidget(ProviderScope(
    overrides: [
      prefsProvider.overrideWithValue(prefs),
      repositoryProvider.overrideWithValue(repo),
      // Never touch the real GPS in tests.
      locatorProvider.overrideWithValue(() async => location),
    ],
    child: const OnlineLandApp(),
  ));
  await tester.pumpAndSettle();
  return repo;
}

/// Scrolls the first scrollable inside [within] (or on screen) until [target] is built and visible.
Future<void> scrollTo(WidgetTester tester, Finder target, {Finder? within}) async {
  final scrollable = within == null
      ? find.byType(Scrollable).first
      : find.descendant(of: within, matching: find.byType(Scrollable)).first;
  await tester.scrollUntilVisible(target, 300, scrollable: scrollable);
  await tester.pumpAndSettle();
}

/// Bottom navigation: 0 Home, 1 Properties, 2 Saved, 3 Sell, 4 Profile.
Future<void> tapTab(WidgetTester tester, int index) async {
  await tester.tap(find.byType(NavigationDestination).at(index));
  await tester.pumpAndSettle();
}

/// Opens OL-1001 from the Home tab (tabs stay alive, so look only inside HomeTab).
Future<void> openFirstListing(WidgetTester tester) async {
  final title = find.descendant(of: find.byType(HomeTab), matching: find.text('బోర్‌వెల్ ఉన్న వ్యవసాయ భూమి'));
  await scrollTo(tester, title, within: find.byType(HomeTab));
  await tester.tap(title);
  await tester.pumpAndSettle();
}

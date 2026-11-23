import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:material_ui/material_ui.dart';
import 'package:onlineland/data/filters.dart';
import 'package:onlineland/state.dart';
import 'package:onlineland/data/demo_repository.dart';
import 'package:onlineland/ui/profile.dart';
import 'package:onlineland/ui/sell.dart';

import 'helpers.dart';

void main() {
  testWidgets('first launch: choose language, three intro pages, then home', (tester) async {
    await pumpApp(tester, onboarded: false);
    expect(find.text('భాష ఎంచుకోండి'), findsOneWidget);
    await tester.tap(find.text('English'));
    await tester.pumpAndSettle();
    expect(find.text('Choose your language'), findsOneWidget);
    for (var i = 0; i < 3; i++) {
      await tester.tap(find.byKey(const Key('onboarding-next')));
      await tester.pumpAndSettle();
    }
    expect(find.text('Find your perfect property'), findsOneWidget);
  });

  testWidgets('home shows the featured listing first and opens its page', (tester) async {
    await pumpApp(tester);
    expect(find.text('మీకు సరైన ఆస్తిని కనుగొనండి'), findsOneWidget);
    expect(find.text('డెమో వెర్షన్: నమూనా ఆస్తులు, ఏ data save అవ్వదు'), findsOneWidget);
    await openFirstListing(tester);
    expect(find.text('₹70 లక్షలు'), findsOneWidget);
    expect(find.text('₹14 లక్షలు ఎకరానికి'), findsOneWidget);
    expect(find.text('OnlineLand పరిశీలించింది'), findsOneWidget);
    expect(find.byKey(const Key('whatsapp-button')), findsOneWidget);
  });

  testWidgets('properties tab: count, filters sheet, empty state', (tester) async {
    await pumpApp(tester);
    await tapTab(tester, 1);
    expect(find.text('9 ఆస్తులు'), findsOneWidget);

    await tester.tap(find.byKey(const Key('open-filters')));
    await tester.pumpAndSettle();
    await tester.tap(find.byKey(const Key('filter-type')));
    await tester.pumpAndSettle();
    await tester.tap(find.text('వ్యవసాయ భూములు').last);
    await tester.pumpAndSettle();
    expect(find.textContaining('3 ఆస్తులు'), findsWidgets);

    final container = ProviderScope.containerOf(tester.element(find.byType(Scaffold).first));
    container.read(filtersProvider.notifier).set(container.read(filtersProvider).copyWith(district: () => 'narayanpet'));
    await tester.pumpAndSettle();
    expect(find.byKey(const ValueKey('filter-mandal-narayanpet')), findsOneWidget);
    await tester.tap(find.textContaining('చూపించండి'));
    await tester.pumpAndSettle();
    expect(find.text('3 ఆస్తులు'), findsOneWidget);

    container.read(filtersProvider.notifier).set(const Filters(type: 'villa', district: 'narayanpet'));
    await tester.pumpAndSettle();
    expect(find.text('మీ వెతుకులాటకు సరిపోయే ఆస్తులు ఇప్పుడు లేవు'), findsOneWidget);
    expect(find.text('WhatsApp లో అడగండి'), findsOneWidget);
  });

  testWidgets('enquiry validates the number and records a lead', (tester) async {
    final repo = await pumpApp(tester);
    await openFirstListing(tester);
    await scrollTo(tester, find.byKey(const Key('open-enquiry')));
    await tester.tap(find.byKey(const Key('open-enquiry')));
    await tester.pumpAndSettle();
    await tester.enterText(find.byKey(const Key('enquiry-phone')), '12345');
    await tester.tap(find.byKey(const Key('enquiry-submit')));
    await tester.pumpAndSettle();
    expect(find.textContaining('సరైన 10 అంకెల మొబైల్ నంబర్'), findsOneWidget);
    await tester.enterText(find.byKey(const Key('enquiry-name')), 'Ravi');
    await tester.enterText(find.byKey(const Key('enquiry-phone')), '98765 43210');
    await tester.tap(find.byKey(const Key('enquiry-submit')));
    await tester.pumpAndSettle();
    expect(find.byKey(const Key('enquiry-sent')), findsOneWidget);
    expect(repo.leads.single, containsPair('phone', '9876543210'));
    expect(repo.leads.single, containsPair('channel', 'form'));
  });

  testWidgets('site visit needs a name and records visit + lead', (tester) async {
    final repo = await pumpApp(tester);
    await openFirstListing(tester);
    await scrollTo(tester, find.byKey(const Key('open-visit')));
    await tester.tap(find.byKey(const Key('open-visit')));
    await tester.pumpAndSettle();
    await tester.enterText(find.byKey(const Key('visit-phone')), '9123456780');
    await tester.tap(find.byKey(const Key('visit-submit')));
    await tester.pumpAndSettle();
    expect(find.text('మీ పేరు రాయండి.'), findsOneWidget);
    await tester.enterText(find.byKey(const Key('visit-name')), 'Lakshmi');
    await tester.tap(find.byKey(const Key('visit-submit')));
    await tester.pumpAndSettle();
    expect(find.byKey(const Key('visit-sent')), findsOneWidget);
    expect(repo.visits.single, containsPair('name', 'Lakshmi'));
    expect(repo.leads.single, containsPair('channel', 'site-visit'));
  });

  testWidgets('save a property, see it in Saved, remove it', (tester) async {
    await pumpApp(tester);
    await openFirstListing(tester);
    await tester.tap(find.byKey(const Key('favorite-toggle')));
    await tester.pumpAndSettle();
    await tester.tap(find.byType(BackButton));
    await tester.pumpAndSettle();
    await tapTab(tester, 2);
    expect(find.byKey(const Key('favorites-list')), findsOneWidget);
    expect(find.textContaining('OL-1001'), findsWidgets);
    await tester.tap(find.text('తీసేయండి'));
    await tester.pumpAndSettle();
    expect(find.text('ఇంకా ఏ ఆస్తీ సేవ్ చేయలేదు'), findsOneWidget);
  });

  testWidgets('login with OTP, become owner, form needs a photo', (tester) async {
    await pumpApp(tester);
    await tapTab(tester, 3);
    await tester.tap(find.byKey(const Key('sell-login')));
    await tester.pumpAndSettle();
    await tester.enterText(find.byKey(const Key('login-phone')), '9000000001');
    await tester.tap(find.byKey(const Key('login-send')));
    await tester.pumpAndSettle();
    await tester.enterText(find.byKey(const Key('login-otp')), '111111');
    await tester.tap(find.byKey(const Key('login-verify')));
    await tester.pumpAndSettle();
    expect(find.text('OTP తప్పు. మళ్ళీ చూసి ఇవ్వండి.'), findsOneWidget);
    await tester.enterText(find.byKey(const Key('login-otp')), '123456');
    await tester.tap(find.byKey(const Key('login-verify')));
    await tester.pumpAndSettle();

    expect(find.byKey(const Key('become-owner')), findsOneWidget);
    await tester.tap(find.byKey(const Key('become-owner')));
    await tester.pumpAndSettle();
    await scrollTo(tester, find.byKey(const Key('sell-submit')), within: find.byType(SellTab));
    await tester.tap(find.byKey(const Key('sell-submit')));
    await tester.pumpAndSettle();
    expect(find.text('కనీసం ఒక ఫోటో జోడించండి.'), findsOneWidget);
  });

  testWidgets('switching to English changes the whole app', (tester) async {
    await pumpApp(tester);
    await tester.tap(find.text('EN'));
    await tester.pumpAndSettle();
    expect(find.text('Find your perfect property'), findsOneWidget);
    expect(find.text('Properties'), findsWidgets);
  });

  testWidgets('plan: pay by UPI with UTR, plan becomes active, dealer leads open', (tester) async {
    final repo = await pumpApp(tester);
    await tapTab(tester, 4);
    await tester.tap(find.byKey(const Key('profile-login')));
    await tester.pumpAndSettle();
    await tester.enterText(find.byKey(const Key('login-phone')), '9000000001');
    await tester.tap(find.byKey(const Key('login-send')));
    await tester.pumpAndSettle();
    await tester.enterText(find.byKey(const Key('login-otp')), '123456');
    await tester.tap(find.byKey(const Key('login-verify')));
    await tester.pumpAndSettle();

    await tester.tap(find.byKey(const Key('open-plan')));
    await tester.pumpAndSettle();
    expect(find.text('మీరు ఉచిత ప్లాన్‌లో ఉన్నారు.'), findsOneWidget);
    expect(find.text('₹499 / నెల'), findsOneWidget);
    expect(find.text('₹1,499 / నెల'), findsOneWidget);

    await tester.tap(find.byKey(const Key('choose-basic')));
    await tester.pumpAndSettle();
    expect(find.byKey(const Key('pay-upi')), findsOneWidget);
    await tester.enterText(find.byKey(const Key('utr-field')), '12345');
    await tester.tap(find.byKey(const Key('send-payment')));
    await tester.pumpAndSettle();
    expect(find.text('12 అంకెల UTR నంబర్ ఇవ్వండి.'), findsOneWidget);
    await tester.enterText(find.byKey(const Key('utr-field')), '412345678901');
    await tester.tap(find.byKey(const Key('send-payment')));
    await tester.pumpAndSettle();
    expect(find.byKey(const Key('payment-sent')), findsOneWidget);
    await tester.tap(find.text('మూసివేయండి'));
    await tester.pumpAndSettle();

    expect(find.descendant(of: find.byKey(const Key('current-plan')), matching: find.text('బేసిక్')), findsOneWidget);
    await scrollTo(tester, find.textContaining('UTR 412345678901'));
    expect(find.textContaining('UTR 412345678901'), findsOneWidget);
    expect((await repo.myPayments()).single.amountInr, 499);
    expect(repo.currentUser!.role, 'dealer');

    await tester.tap(find.byType(BackButton));
    await tester.pumpAndSettle();
    await scrollTo(tester, find.byKey(const Key('open-leads')), within: find.byType(ProfileTab));
    await tester.tap(find.byKey(const Key('open-leads')));
    await tester.pumpAndSettle();
    expect(find.text('Lakshmi'), findsOneWidget);
  });

  testWidgets('a buyer without a plan sees why leads are locked', (tester) async {
    final repo = await pumpApp(tester);
    await repo.verifyOtp('demo:9000000001', '123456');
    await repo.becomeOwner();
    await tester.pumpAndSettle();
    await tapTab(tester, 4);
    await scrollTo(tester, find.byKey(const Key('open-leads')), within: find.byType(ProfileTab));
    await tester.tap(find.byKey(const Key('open-leads')));
    await tester.pumpAndSettle();
    expect(find.byKey(const Key('leads-need-plan')), findsOneWidget);
  });

  testWidgets('a user can delete their account from Profile', (tester) async {
    final repo = await pumpApp(tester);
    await repo.verifyOtp('demo:9000000001', '123456');
    await tester.pumpAndSettle();
    await tapTab(tester, 4);
    await scrollTo(tester, find.byKey(const Key('delete-account')), within: find.byType(ProfileTab));
    await tester.tap(find.byKey(const Key('delete-account')));
    await tester.pumpAndSettle();
    expect(find.text('ఖాతా తొలగించాలా?'), findsOneWidget);
    await tester.tap(find.byKey(const Key('delete-confirm')));
    await tester.pumpAndSettle();
    expect(repo.currentUser, isNull);
    expect(find.text('మీ ఖాతా తొలగించబడింది.'), findsOneWidget);
  });

  testWidgets('near me: nearest first with distances; radius narrows; turn off', (tester) async {
    await pumpApp(tester, location: (lat: 16.5, lng: 77.51)); // Makthal
    await tapTab(tester, 1);
    await tester.tap(find.byKey(const Key('near-me')));
    await tester.pumpAndSettle();
    expect(find.byKey(const Key('near-active')), findsOneWidget);
    expect(find.byKey(const Key('distance-seed-1001')), findsOneWidget); // Makthal listing is first, so it is built
    expect(find.textContaining('కి.మీ'), findsWidgets);

    await tester.tap(find.byKey(const Key('near-radius')));
    await tester.pumpAndSettle();
    await tester.tap(find.text('5 కి.మీ లోపు').last);
    await tester.pumpAndSettle();
    final count = tester.widget<Text>(find.byKey(const Key('results-count'))).data!;
    expect(count, contains('2'));

    await tester.tap(find.byKey(const Key('near-off')));
    await tester.pumpAndSettle();
    expect(find.byKey(const Key('near-me')), findsOneWidget);
    expect(find.textContaining('కి.మీ'), findsNothing);
  });

  testWidgets('near me without location permission explains what to do', (tester) async {
    await pumpApp(tester); // location: null
    await tapTab(tester, 1);
    await tester.tap(find.byKey(const Key('near-me')));
    await tester.pumpAndSettle();
    expect(find.text('లొకేషన్ అనుమతి లేదు. జిల్లా/మండలం ఎంచుకోండి.'), findsOneWidget);
    expect(find.byKey(const Key('near-active')), findsNothing);
  });

  Future<void> openSellForm(WidgetTester tester, DemoRepository repo) async {
    await repo.verifyOtp('demo:9000000001', '123456');
    await repo.becomeOwner();
    await tester.pumpAndSettle();
    await tapTab(tester, 3);
  }

  testWidgets('video: pick → compressed on the phone → ready; can remove', (tester) async {
    final repo = await pumpApp(tester);
    await openSellForm(tester, repo);
    await scrollTo(tester, find.byKey(const Key('video-pick')), within: find.byType(SellTab));
    await tester.tap(find.byKey(const Key('video-pick')));
    await tester.pumpAndSettle();
    expect(find.byKey(const Key('video-ready')), findsOneWidget);
    expect(find.text('వీడియో సిద్ధం: 1:15 · 12.0 MB'), findsOneWidget);
    expect(find.byKey(const Key('youtube-link')), findsNothing); // one video per listing
    await tester.tap(find.byKey(const Key('video-remove')));
    await tester.pumpAndSettle();
    expect(find.byKey(const Key('video-pick')), findsOneWidget);
  });

  testWidgets('video: longer than 2 minutes is refused before compressing', (tester) async {
    final repo = await pumpApp(tester, videoTools: FakeVideoTools(seconds: 200));
    await openSellForm(tester, repo);
    await scrollTo(tester, find.byKey(const Key('video-record')), within: find.byType(SellTab));
    await tester.tap(find.byKey(const Key('video-record')));
    await tester.pumpAndSettle();
    expect(find.text('వీడియో 3:20 ఉంది. 2 నిమిషాల లోపు ఉండాలి.'), findsOneWidget);
    expect(find.byKey(const Key('video-ready')), findsNothing);
  });

  testWidgets('video: a wrong YouTube link is pointed out', (tester) async {
    final repo = await pumpApp(tester);
    await openSellForm(tester, repo);
    await scrollTo(tester, find.byKey(const Key('youtube-link')), within: find.byType(SellTab));
    await tester.enterText(find.byKey(const Key('youtube-link')), 'https://vimeo.com/123');
    await scrollTo(tester, find.byKey(const Key('sell-submit')), within: find.byType(SellTab));
    await tester.tap(find.byKey(const Key('sell-submit')));
    await tester.pumpAndSettle();
    await scrollTo(tester, find.byKey(const Key('youtube-link')), within: find.byType(SellTab));
    expect(find.text('సరైన YouTube లింక్ ఇవ్వండి.'), findsWidgets);
  });

  testWidgets('property page shows the listing video', (tester) async {
    await pumpApp(tester);
    await openFirstListing(tester);
    await scrollTo(tester, find.byKey(const Key('listing-video')));
    expect(find.text('YouTube లో చూడండి'), findsOneWidget);
  });
}

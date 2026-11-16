import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:material_ui/material_ui.dart';

import 'state.dart';
import 'theme.dart';
import 'ui/home.dart';
import 'ui/login.dart';
import 'ui/onboarding.dart';
import 'ui/property_page.dart';

final routerProvider = Provider<GoRouter>((ref) {
  return GoRouter(
    initialLocation: '/',
    redirect: (context, state) {
      final onboarded = ref.read(onboardedProvider);
      if (!onboarded && state.matchedLocation != '/welcome') return '/welcome';
      return null;
    },
    routes: [
      GoRoute(path: '/', builder: (_, _) => const HomeShell()),
      GoRoute(path: '/welcome', builder: (_, _) => const OnboardingScreen()),
      GoRoute(path: '/login', builder: (_, _) => const LoginScreen()),
      GoRoute(path: '/property/:code', builder: (_, state) => PropertyPage(code: state.pathParameters['code'] ?? '')),
    ],
  );
});

class OnlineLandApp extends ConsumerWidget {
  const OnlineLandApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final locale = ref.watch(localeProvider);
    return MaterialApp.router(
      title: 'OnlineLand',
      debugShowCheckedModeBanner: false,
      theme: buildTheme(),
      locale: Locale(locale),
      supportedLocales: const [Locale('te'), Locale('en')],
      localizationsDelegates: GlobalMaterialLocalizations.delegates,
      routerConfig: ref.watch(routerProvider),
    );
  }
}

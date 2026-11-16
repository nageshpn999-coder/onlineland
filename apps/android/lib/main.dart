import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:cloud_functions/cloud_functions.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:firebase_storage/firebase_storage.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:material_ui/material_ui.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'app.dart';
import 'config.dart';
import 'data/demo_repository.dart';
import 'data/firebase_repository.dart';
import 'data/repository.dart';
import 'state.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  final prefs = await SharedPreferences.getInstance();
  final Repository repo = AppConfig.isDemo ? DemoRepository() : await _firebase();

  runApp(ProviderScope(
    overrides: [
      prefsProvider.overrideWithValue(prefs),
      repositoryProvider.overrideWithValue(repo),
    ],
    child: const OnlineLandApp(),
  ));

  if (!repo.isDemo) _registerForNotifications(repo);
}

Future<Repository> _firebase() async {
  AppConfig.assertSafeProject();
  await Firebase.initializeApp(
    options: const FirebaseOptions(
      apiKey: AppConfig.apiKey,
      appId: AppConfig.appId,
      messagingSenderId: AppConfig.senderId,
      projectId: AppConfig.projectId,
      storageBucket: AppConfig.storageBucket,
    ),
  );
  if (AppConfig.emulatorHost.isNotEmpty) {
    const host = AppConfig.emulatorHost;
    FirebaseFirestore.instance.useFirestoreEmulator(host, 8080);
    await FirebaseAuth.instance.useAuthEmulator(host, 9099);
    await FirebaseStorage.instance.useStorageEmulator(host, 9199);
    FirebaseFunctions.instanceFor(region: AppConfig.functionsRegion).useFunctionsEmulator(host, 5001);
  }
  return FirebaseRepository();
}

/// Asks for notification permission and saves this phone's token once the user is logged in.
void _registerForNotifications(Repository repo) {
  repo.authChanges().listen((user) async {
    if (user == null) return;
    try {
      final messaging = FirebaseMessaging.instance;
      await messaging.requestPermission();
      final token = await messaging.getToken();
      if (token != null) await repo.registerDevice(token);
      messaging.onTokenRefresh.listen((t) => repo.registerDevice(t));
    } catch (_) {
      // Notifications are optional; the app works without them.
    }
  });
}

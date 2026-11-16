/// Build-time settings, passed with --dart-define.
///
///   Demo (sample data, nothing saved):  flutter build apk --dart-define=DATA_MODE=demo
///   Firebase dev project:               flutter build apk --dart-define=DATA_MODE=firebase \
///       --dart-define=FIREBASE_PROJECT_ID=onlineland-dev --dart-define=FIREBASE_API_KEY=... (see README)
///
/// Only the new projects onlineland-dev / onlineland-prod (or demo-* emulators) are accepted.
class AppConfig {
  static const dataMode = String.fromEnvironment('DATA_MODE', defaultValue: 'demo');
  static bool get isDemo => dataMode != 'firebase';

  static const projectId = String.fromEnvironment('FIREBASE_PROJECT_ID', defaultValue: 'demo-onlineland');
  static const apiKey = String.fromEnvironment('FIREBASE_API_KEY', defaultValue: 'demo-key');
  static const appId = String.fromEnvironment('FIREBASE_APP_ID', defaultValue: '1:000000000000:android:0000000000000000');
  static const senderId = String.fromEnvironment('FIREBASE_SENDER_ID', defaultValue: '000000000000');
  static const storageBucket = String.fromEnvironment('FIREBASE_STORAGE_BUCKET', defaultValue: 'demo-onlineland.appspot.com');

  /// Host of the Firebase emulators (e.g. 10.0.2.2 from the Android emulator). Empty = real project.
  static const emulatorHost = String.fromEnvironment('EMULATOR_HOST');

  static const allowedProjects = ['onlineland-dev', 'onlineland-prod'];

  /// Never let a build talk to the owner's other Firebase projects (onlineland-28234, vahan, ridekart, scraplake).
  static void assertSafeProject() {
    if (isDemo) return;
    if (!allowedProjects.contains(projectId) && !projectId.startsWith('demo-')) {
      throw StateError('Refusing to use Firebase project "$projectId". Allowed: ${allowedProjects.join(', ')}.');
    }
  }

  static const whatsapp = '919959731120';
  static const functionsRegion = 'asia-south1';
}

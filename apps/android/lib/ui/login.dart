import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:material_ui/material_ui.dart';

import '../data/format.dart';
import '../data/repository.dart';
import '../state.dart';
import '../theme.dart';
import 'onboarding.dart';

/// Phone OTP login (Firebase Auth). Login is optional: only needed to post and to sync saved items.
class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key});

  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen> {
  final _phone = TextEditingController();
  final _otp = TextEditingController();
  String? _verificationId;
  String _phone10 = '';
  bool _busy = false;
  String? _error;

  @override
  void dispose() {
    _phone.dispose();
    _otp.dispose();
    super.dispose();
  }

  Future<void> _send() async {
    final s = ref.read(stringsProvider);
    final phone = normalizeMobile(_phone.text);
    if (!isMobile(phone)) {
      setState(() => _error = s.invalidPhone);
      return;
    }
    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      final id = await ref.read(repositoryProvider).sendOtp(phone);
      if (id == 'auto') {
        if (mounted) context.pop(true);
        return;
      }
      setState(() {
        _verificationId = id;
        _phone10 = phone;
      });
    } catch (_) {
      setState(() => _error = s.otpError);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _verify() async {
    final s = ref.read(stringsProvider);
    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      await ref.read(repositoryProvider).verifyOtp(_verificationId!, _otp.text.trim());
      if (mounted) context.pop(true);
    } on RepoException catch (e) {
      setState(() => _error = e.code == 'invalid-verification-code' || e.code == 'invalid-code' ? s.wrongOtp : s.otpError);
    } catch (_) {
      setState(() => _error = s.otpError);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final s = ref.watch(stringsProvider);
    final demo = ref.watch(repositoryProvider).isDemo;
    final codeSent = _verificationId != null;

    return Scaffold(
      appBar: AppBar(title: Text(s.login)),
      body: ListView(padding: const EdgeInsets.all(20), children: [
        const Align(alignment: Alignment.centerLeft, child: LogoMark(size: 44)),
        const SizedBox(height: 16),
        Text(s.loginTitle, style: Theme.of(context).textTheme.headlineSmall),
        const SizedBox(height: 6),
        Text(s.loginWhy, style: const TextStyle(color: Brand.inkSoft)),
        const SizedBox(height: 22),
        if (!codeSent) ...[
          TextField(
            key: const Key('login-phone'),
            controller: _phone,
            keyboardType: TextInputType.phone,
            autofocus: true,
            decoration: InputDecoration(labelText: s.mobile, prefixText: '+91 ', errorText: _error, errorMaxLines: 3),
          ),
          const SizedBox(height: 16),
          FilledButton(key: const Key('login-send'), onPressed: _busy ? null : _send, child: Text(_busy ? s.sending : s.sendOtp)),
        ] else ...[
          Text(s.otpSentTo('+91 $_phone10'), style: const TextStyle(fontWeight: FontWeight.w600)),
          const SizedBox(height: 12),
          TextField(
            key: const Key('login-otp'),
            controller: _otp,
            keyboardType: TextInputType.number,
            maxLength: 6,
            autofocus: true,
            decoration: InputDecoration(labelText: s.enterOtp, errorText: _error, errorMaxLines: 3),
          ),
          const SizedBox(height: 8),
          FilledButton(key: const Key('login-verify'), onPressed: _busy ? null : _verify, child: Text(s.verify)),
          TextButton(onPressed: () => setState(() => _verificationId = null), child: Text(s.changeNumber)),
        ],
        if (demo) ...[
          const SizedBox(height: 16),
          Text(s.demoOtpHint, style: const TextStyle(color: Color(0xFF8A4B08))),
        ],
      ]),
    );
  }
}

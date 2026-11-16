import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:material_ui/material_ui.dart';

import '../state.dart';
import '../theme.dart';

class LogoMark extends StatelessWidget {
  const LogoMark({super.key, this.size = 40});
  final double size;

  @override
  Widget build(BuildContext context) => SizedBox(width: size, height: size, child: CustomPaint(painter: _LogoPainter()));
}

class _LogoPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final k = size.width / 32;
    Offset o(double x, double y) => Offset(x * k, y * k);
    final plot = Path()
      ..moveTo(o(4, 6).dx, o(4, 6).dy)
      ..lineTo(o(27, 3).dx, o(27, 3).dy)
      ..lineTo(o(29, 27).dx, o(29, 27).dy)
      ..lineTo(o(5, 29).dx, o(5, 29).dy)
      ..close();
    canvas.drawPath(plot, Paint()..color = Brand.paper);
    final share = Path()
      ..moveTo(o(16.3, 15.8).dx, o(16.3, 15.8).dy)
      ..lineTo(o(28, 15).dx, o(28, 15).dy)
      ..lineTo(o(29, 27).dx, o(29, 27).dy)
      ..lineTo(o(17, 28).dx, o(17, 28).dy)
      ..close();
    canvas.drawPath(share, Paint()..color = Brand.green);
    final line = Paint()
      ..color = Brand.blue
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.6 * k;
    canvas.drawLine(o(15.5, 4.5), o(17, 28), line);
    canvas.drawLine(o(4.5, 17.5), o(28, 15), line);
    canvas.drawPath(plot, line..strokeWidth = 2.2 * k..strokeJoin = StrokeJoin.round);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

class Wordmark extends StatelessWidget {
  const Wordmark({super.key, this.size = 22, this.light = false});
  final double size;
  final bool light;

  @override
  Widget build(BuildContext context) => Text.rich(TextSpan(children: [
        TextSpan(text: 'Online', style: TextStyle(color: light ? Brand.paper : Brand.ink)),
        TextSpan(text: 'Land', style: TextStyle(color: light ? const Color(0xFF9FE0BC) : Brand.green)),
      ]), style: TextStyle(fontSize: size, fontWeight: FontWeight.w700, letterSpacing: -0.3));
}

/// Language first, then three short intro pages.
class OnboardingScreen extends ConsumerStatefulWidget {
  const OnboardingScreen({super.key});

  @override
  ConsumerState<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends ConsumerState<OnboardingScreen> {
  final _pages = PageController();
  int _page = 0;

  @override
  void dispose() {
    _pages.dispose();
    super.dispose();
  }

  void _finish() {
    ref.read(onboardedProvider.notifier).done();
    context.go('/');
  }

  @override
  Widget build(BuildContext context) {
    final s = ref.watch(stringsProvider);
    final locale = ref.watch(localeProvider);
    final slides = [
      (Icons.landscape_outlined, s.onb1Title, s.onb1Body),
      (Icons.handshake_outlined, s.onb2Title, s.onb2Body),
      (Icons.add_a_photo_outlined, s.onb3Title, s.onb3Body),
    ];

    return Scaffold(
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.fromLTRB(24, 16, 24, 24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const Row(children: [LogoMark(size: 36), SizedBox(width: 10), Wordmark()]),
              const SizedBox(height: 24),
              Text(s.chooseLanguage, style: Theme.of(context).textTheme.titleMedium),
              const SizedBox(height: 10),
              SegmentedButton<String>(
                segments: const [
                  ButtonSegment(value: 'te', label: Text('తెలుగు')),
                  ButtonSegment(value: 'en', label: Text('English')),
                ],
                selected: {locale},
                onSelectionChanged: (v) => ref.read(localeProvider.notifier).set(v.first),
              ),
              Expanded(
                child: PageView(
                  controller: _pages,
                  onPageChanged: (i) => setState(() => _page = i),
                  children: [
                    for (final (icon, title, body) in slides)
                      Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Container(
                            width: 120,
                            height: 120,
                            decoration: const BoxDecoration(color: Brand.greenSoft, shape: BoxShape.circle),
                            child: Icon(icon, size: 56, color: Brand.green),
                          ),
                          const SizedBox(height: 28),
                          Text(title, textAlign: TextAlign.center, style: Theme.of(context).textTheme.headlineSmall),
                          const SizedBox(height: 10),
                          Text(body, textAlign: TextAlign.center, style: const TextStyle(fontSize: 16, color: Brand.inkSoft, height: 1.6)),
                        ],
                      ),
                  ],
                ),
              ),
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  for (var i = 0; i < slides.length; i++)
                    AnimatedContainer(
                      duration: const Duration(milliseconds: 200),
                      margin: const EdgeInsets.symmetric(horizontal: 4),
                      width: i == _page ? 22 : 8,
                      height: 8,
                      decoration: BoxDecoration(color: i == _page ? Brand.blue : Brand.line, borderRadius: BorderRadius.circular(4)),
                    ),
                ],
              ),
              const SizedBox(height: 20),
              FilledButton(
                key: const Key('onboarding-next'),
                onPressed: () => _page < slides.length - 1
                    ? _pages.nextPage(duration: const Duration(milliseconds: 250), curve: Curves.easeOut)
                    : _finish(),
                child: Text(_page < slides.length - 1 ? s.next : s.start),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

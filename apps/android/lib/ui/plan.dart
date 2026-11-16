import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:material_ui/material_ui.dart';
import 'package:url_launcher/url_launcher.dart';

import '../data/format.dart';
import '../data/models.dart';
import '../state.dart';
import '../theme.dart';
import 'widgets.dart';

/// "My plan": current plan, Basic/Pro to choose, and payment history (decision D7).
class MyPlanPage extends ConsumerWidget {
  const MyPlanPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final s = ref.watch(stringsProvider);
    final config = ref.watch(revenueConfigProvider);
    final dealer = ref.watch(myDealerProvider).value;
    final payments = ref.watch(myPaymentsProvider).value ?? const <PaymentInfo>[];
    final now = DateTime.now();
    final active = dealer != null && dealer.active(now);

    return Scaffold(
      appBar: AppBar(title: Text(s.myPlan)),
      body: config.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (_, _) => Center(child: Text(s.loadError)),
        data: (c) => ListView(padding: const EdgeInsets.all(16), children: [
          Card(
            key: const Key('current-plan'),
            color: active ? Brand.greenSoft : null,
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text(s.currentPlan, style: const TextStyle(color: Brand.inkSoft)),
                const SizedBox(height: 4),
                Text(
                  active ? c.plans[dealer.planId]?.name(s.te) ?? dealer.planId : c.plans['free']!.name(s.te),
                  style: Theme.of(context).textTheme.headlineSmall,
                ),
                Text(active ? s.validTill(shortDate(dealer.validUntil!)) : s.freePlanNow),
                if (active && dealer.featuredSlots > 0) Text(s.featureFree(dealer.slotsLeft)),
                if (dealer?.verified == true) Text(s.featBadge, style: const TextStyle(color: Brand.green, fontWeight: FontWeight.w700)),
              ]),
            ),
          ),
          const SizedBox(height: 12),
          for (final id in const ['basic', 'pro'])
            if (c.plans[id] != null) _PlanCard(plan: c.plans[id]!, current: active && dealer.planId == id, config: c),
          if (payments.isNotEmpty) ...[
            const SizedBox(height: 16),
            Text(s.paymentHistory, style: Theme.of(context).textTheme.titleMedium),
            const SizedBox(height: 6),
            for (final p in payments)
              Card(
                child: ListTile(
                  title: Text('${s.payKind(p.kind)}${p.planId != null ? ' · ${c.plans[p.planId]?.name(s.te) ?? p.planId}' : ''} — ₹${groupIndian(p.amountInr)}'),
                  subtitle: Text('UTR ${p.utr} · ${shortDate(p.createdAt)}${p.rejectReason != null ? '\n${s.rejectReason(p.rejectReason!)}' : ''}'),
                  trailing: Text(
                    s.payStatus(p.status),
                    style: TextStyle(
                      fontWeight: FontWeight.w700,
                      color: switch (p.status) { 'approved' => Brand.green, 'rejected' => Colors.red.shade700, _ => const Color(0xFF8A4B08) },
                    ),
                  ),
                ),
              ),
          ],
        ]),
      ),
    );
  }
}

class _PlanCard extends ConsumerWidget {
  const _PlanCard({required this.plan, required this.current, required this.config});
  final PlanConfig plan;
  final bool current;
  final RevenueConfig config;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final s = ref.watch(stringsProvider);
    final features = <String>[
      s.listingsN(plan.listingLimit),
      if (plan.ownContact) s.featOwnNumber,
      if (plan.ownContact) s.featLeads,
      if (plan.verifiedBadge) s.featBadge,
      s.featStats,
      if (plan.featuredSlots > 0) s.featFeatured(plan.featuredSlots),
      if (plan.dealerPage) s.featDealerPage,
      if (plan.areaLeads) s.featAreaLeads,
    ];
    return Card(
      key: Key('plan-${plan.id}'),
      margin: const EdgeInsets.only(bottom: 12),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: BorderSide(color: plan.id == 'pro' ? Brand.green : Brand.line, width: plan.id == 'pro' ? 2 : 1),
      ),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
          Row(children: [
            Expanded(child: Text(plan.name(s.te), style: Theme.of(context).textTheme.titleLarge)),
            Text(s.pricePerMonth('₹${groupIndian(plan.priceInr)}'), style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 18)),
          ]),
          const SizedBox(height: 8),
          for (final f in features)
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 2),
              child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
                const Icon(Icons.check, size: 18, color: Brand.green),
                const SizedBox(width: 6),
                Expanded(child: Text(f)),
              ]),
            ),
          const SizedBox(height: 10),
          FilledButton(
            key: Key('choose-${plan.id}'),
            onPressed: () => showPaySheet(
              context,
              ref,
              kind: 'plan',
              planId: plan.id,
              title: plan.name(s.te),
              amountInr: plan.priceInr,
              pricing: config.pricing,
            ),
            child: Text(current ? s.renewPlan : s.choosePlan),
          ),
        ]),
      ),
    );
  }
}

/// Pay by UPI, then enter the UTR so OnlineLand can match the money (manual UPI, decision D6).
Future<void> showPaySheet(
  BuildContext context,
  WidgetRef ref, {
  required String kind,
  String? planId,
  String? propertyId,
  required String title,
  required int amountInr,
  required Pricing pricing,
}) {
  return showModalBottomSheet<void>(
    context: context,
    isScrollControlled: true,
    showDragHandle: true,
    builder: (_) => _PaySheet(kind: kind, planId: planId, propertyId: propertyId, title: title, amountInr: amountInr, pricing: pricing),
  );
}

class _PaySheet extends ConsumerStatefulWidget {
  const _PaySheet({required this.kind, this.planId, this.propertyId, required this.title, required this.amountInr, required this.pricing});
  final String kind;
  final String? planId;
  final String? propertyId;
  final String title;
  final int amountInr;
  final Pricing pricing;

  @override
  ConsumerState<_PaySheet> createState() => _PaySheetState();
}

class _PaySheetState extends ConsumerState<_PaySheet> {
  final _utr = TextEditingController();
  String? _error;
  bool _busy = false;
  bool _done = false;

  @override
  void dispose() {
    _utr.dispose();
    super.dispose();
  }

  Future<void> _send() async {
    final s = ref.read(stringsProvider);
    final utr = _utr.text.replaceAll(RegExp(r'\s'), '');
    if (!utrPattern.hasMatch(utr)) {
      setState(() => _error = s.utrInvalid);
      return;
    }
    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      await ref.read(repositoryProvider).submitPayment(
            kind: widget.kind,
            planId: widget.planId,
            propertyId: widget.propertyId,
            amountInr: widget.amountInr,
            utr: utr,
          );
      refreshRevenue(ref);
      setState(() => _done = true);
    } catch (_) {
      setState(() => _error = s.submitError);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final s = ref.watch(stringsProvider);
    final demo = ref.watch(repositoryProvider).isDemo;
    final amount = '₹${groupIndian(widget.amountInr)}';
    final hasUpi = widget.pricing.upiId.isNotEmpty;

    return Padding(
      padding: EdgeInsets.fromLTRB(20, 0, 20, 20 + MediaQuery.viewInsetsOf(context).bottom),
      child: _done
          ? Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.stretch, children: [
              const Icon(Icons.check_circle, color: Brand.green, size: 48),
              const SizedBox(height: 8),
              Text(demo ? s.paymentSentDemo : s.paymentSent, key: const Key('payment-sent'), textAlign: TextAlign.center),
              const SizedBox(height: 16),
              FilledButton(onPressed: () => Navigator.pop(context), child: Text(s.close)),
            ])
          : SingleChildScrollView(
              child: Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.stretch, children: [
                Text(s.payFor(widget.title, amount), style: Theme.of(context).textTheme.titleLarge),
                const SizedBox(height: 16),
                Text(s.payStep1, style: const TextStyle(fontWeight: FontWeight.w700)),
                const SizedBox(height: 6),
                if (hasUpi) ...[
                  FilledButton.icon(
                    key: const Key('pay-upi'),
                    style: FilledButton.styleFrom(backgroundColor: Brand.green),
                    onPressed: () => launchUrl(widget.pricing.upiUri(widget.amountInr, 'OnlineLand ${widget.title}'), mode: LaunchMode.externalApplication),
                    icon: const Icon(Icons.currency_rupee),
                    label: Text('${s.payWithUpi} · $amount'),
                  ),
                  const SizedBox(height: 4),
                  TextButton.icon(
                    onPressed: () {
                      Clipboard.setData(ClipboardData(text: widget.pricing.upiId));
                      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(s.upiCopied)));
                    },
                    icon: const Icon(Icons.copy, size: 18),
                    label: Text('UPI ID: ${widget.pricing.upiId}'),
                  ),
                ] else
                  OutlinedButton.icon(
                    onPressed: () => openWhatsApp('${widget.title} — $amount'),
                    icon: const Icon(Icons.chat),
                    label: Text(s.noUpiYet),
                  ),
                const SizedBox(height: 16),
                Text(s.payStep2, style: const TextStyle(fontWeight: FontWeight.w700)),
                const SizedBox(height: 6),
                TextField(
                  key: const Key('utr-field'),
                  controller: _utr,
                  keyboardType: TextInputType.number,
                  maxLength: 12,
                  inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                  decoration: InputDecoration(labelText: s.utrLabel, helperText: s.utrHelp, errorText: _error, border: const OutlineInputBorder()),
                ),
                const SizedBox(height: 12),
                FilledButton(key: const Key('send-payment'), onPressed: _busy ? null : _send, child: Text(s.sendPayment)),
              ]),
            ),
    );
  }
}

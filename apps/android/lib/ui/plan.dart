import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:material_ui/material_ui.dart';
import 'package:url_launcher/url_launcher.dart';

import '../data/catalog.dart';
import '../data/format.dart';
import '../data/models.dart';
import '../data/repository.dart';
import '../state.dart';
import '../theme.dart';
import 'widgets.dart';

/// "My plan": current plan, Basic/Pro to choose (monthly or yearly), launch offer, payment history (D7, Phase 9).
class MyPlanPage extends ConsumerStatefulWidget {
  const MyPlanPage({super.key});

  @override
  ConsumerState<MyPlanPage> createState() => _MyPlanPageState();
}

class _MyPlanPageState extends ConsumerState<MyPlanPage> {
  String _billing = 'month';

  @override
  Widget build(BuildContext context) {
    final s = ref.watch(stringsProvider);
    final config = ref.watch(revenueConfigProvider);
    final dealer = ref.watch(myDealerProvider).value;
    final payments = ref.watch(myPaymentsProvider).value ?? const <PaymentInfo>[];
    final user = ref.watch(authProvider).value;
    final now = DateTime.now();
    final active = dealer != null && dealer.active(now);

    return Scaffold(
      appBar: AppBar(title: Text(s.myPlan)),
      body: config.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (_, _) => Center(child: Text(s.loadError)),
        data: (c) {
          final hasYearly = c.plans.values.any((p) => p.yearlyPriceInr > 0);
          final offer = c.pricing.launchOfferActive && !active && user != null && user.role != 'agent' && user.role != 'admin';
          return ListView(padding: const EdgeInsets.all(16), children: [
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
            if (offer) ...[
              const SizedBox(height: 12),
              _OfferCard(config: c),
            ],
            const SizedBox(height: 12),
            if (hasYearly) ...[
              SegmentedButton<String>(
                key: const Key('billing'),
                segments: [
                  ButtonSegment(value: 'month', label: Text(s.monthly, key: const Key('billing-month'))),
                  ButtonSegment(value: 'year', label: Text(s.yearly, key: const Key('billing-year'))),
                ],
                selected: {_billing},
                onSelectionChanged: (v) => setState(() => _billing = v.first),
              ),
              const SizedBox(height: 12),
            ],
            for (final id in const ['basic', 'pro'])
              if (c.plans[id] != null && (_billing == 'month' || c.plans[id]!.yearlyPriceInr > 0))
                _PlanCard(plan: c.plans[id]!, current: active && dealer.planId == id, config: c, billing: _billing),
            if (payments.isNotEmpty) ...[
              const SizedBox(height: 16),
              Text(s.paymentHistory, style: Theme.of(context).textTheme.titleMedium),
              const SizedBox(height: 6),
              for (final p in payments)
                Card(
                  child: ListTile(
                    title: Text('${s.payKind(p.kind)}${p.planId != null ? ' · ${c.plans[p.planId]?.name(s.te) ?? p.planId}' : ''}'
                        '${p.billing == 'year' ? ' · ${s.yearly}' : ''} — ₹${groupIndian(p.amountInr)}'),
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
          ]);
        },
      ),
    );
  }
}

/// Launch offer: a new dealer in an offer district takes the free plan once (admin turns it on).
class _OfferCard extends ConsumerStatefulWidget {
  const _OfferCard({required this.config});
  final RevenueConfig config;

  @override
  ConsumerState<_OfferCard> createState() => _OfferCardState();
}

class _OfferCardState extends ConsumerState<_OfferCard> {
  String? _district;
  bool _busy = false;
  String? _error;

  Future<void> _claim() async {
    final s = ref.read(stringsProvider);
    final d = _district;
    if (d == null) return;
    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      await ref.read(repositoryProvider).claimLaunchOffer(d);
      refreshRevenue(ref);
      if (mounted) showSnack(context, s.offerDone);
    } on RepoException catch (e) {
      setState(() => _error = e.code == 'already-exists' ? s.offerUsed : s.offerNotHere);
    } catch (_) {
      setState(() => _error = s.submitError);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final s = ref.watch(stringsProvider);
    final p = widget.config.pricing;
    final plan = widget.config.plans[p.launchOfferPlan];
    final allowed = p.launchOfferDistricts;
    final options = [for (final d in districts) if (allowed.isEmpty || allowed.contains(d.id)) d];
    return Card(
      key: const Key('launch-offer'),
      color: const Color(0xFFFFF4D6),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
          Text(s.offerTitle(plan?.name(s.te) ?? p.launchOfferPlan, p.launchOfferDays), style: Theme.of(context).textTheme.titleMedium),
          const SizedBox(height: 4),
          Text(s.offerBody, style: const TextStyle(color: Brand.inkSoft)),
          const SizedBox(height: 10),
          DropdownButtonFormField<String>(
            key: const Key('offer-district'),
            initialValue: _district,
            isExpanded: true,
            decoration: InputDecoration(labelText: s.offerDistrict, errorText: _error),
            items: [for (final d in options) DropdownMenuItem(value: d.id, child: Text(d.label(s.te)))],
            onChanged: (v) => setState(() => _district = v),
          ),
          const SizedBox(height: 10),
          FilledButton(
            key: const Key('offer-claim'),
            onPressed: _busy || _district == null ? null : _claim,
            child: Text(s.offerClaim),
          ),
        ]),
      ),
    );
  }
}

class _PlanCard extends ConsumerWidget {
  const _PlanCard({required this.plan, required this.current, required this.config, this.billing = 'month'});
  final PlanConfig plan;
  final bool current;
  final RevenueConfig config;
  final String billing;

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
            Text(
              billing == 'year' ? s.pricePerYear('₹${groupIndian(plan.yearlyPriceInr)}') : s.pricePerMonth('₹${groupIndian(plan.priceInr)}'),
              key: Key('price-${plan.id}'),
              style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 18),
            ),
          ]),
          if (billing == 'year' && plan.yearlySavingMonths > 0)
            Align(
              alignment: Alignment.centerRight,
              child: Text(s.monthsFree(plan.yearlySavingMonths), style: const TextStyle(color: Brand.green, fontWeight: FontWeight.w700)),
            ),
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
              billing: billing,
              title: billing == 'year' ? '${plan.name(s.te)} · ${s.yearly}' : plan.name(s.te),
              amountInr: plan.price(billing),
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
  String? billing,
  String? serviceRequestId,
  required String title,
  required int amountInr,
  required Pricing pricing,
}) {
  return showModalBottomSheet<void>(
    context: context,
    isScrollControlled: true,
    showDragHandle: true,
    builder: (_) => _PaySheet(
        kind: kind, planId: planId, propertyId: propertyId, billing: billing, serviceRequestId: serviceRequestId,
        title: title, amountInr: amountInr, pricing: pricing),
  );
}

class _PaySheet extends ConsumerStatefulWidget {
  const _PaySheet({required this.kind, this.planId, this.propertyId, this.billing, this.serviceRequestId, required this.title, required this.amountInr, required this.pricing});
  final String kind;
  final String? planId;
  final String? propertyId;
  final String? billing;
  final String? serviceRequestId;
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
            billing: widget.billing,
            serviceRequestId: widget.serviceRequestId,
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

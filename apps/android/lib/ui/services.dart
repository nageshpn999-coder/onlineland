import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:material_ui/material_ui.dart';

import '../data/format.dart';
import '../data/models.dart';
import '../l10n.dart';
import '../state.dart';
import '../theme.dart';
import 'plan.dart';
import 'widgets.dart';

/// Paid services (Phase 9): drone video, document check, survey, registration, loan help.
/// Anyone can ask; signed-in users also see their requests, prices and can pay by UPI.
class ServicesPage extends ConsumerWidget {
  const ServicesPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final s = ref.watch(stringsProvider);
    final user = ref.watch(authProvider).value;
    final config = ref.watch(revenueConfigProvider).value ?? const RevenueConfig();
    final requests = ref.watch(myServiceRequestsProvider).value ?? const <ServiceRequestInfo>[];

    return Scaffold(
      appBar: AppBar(title: Text(s.services)),
      body: ListView(padding: const EdgeInsets.all(16), children: [
        Text(s.servicesLead, style: const TextStyle(color: Brand.inkSoft)),
        const SizedBox(height: 12),
        for (final id in serviceIds)
          if (config.services[id]?.active ?? false) _ServiceCard(service: config.services[id]!),
        const SizedBox(height: 12),
        Text(s.myRequests, style: Theme.of(context).textTheme.titleMedium),
        const SizedBox(height: 6),
        if (user == null)
          Card(
            child: ListTile(
              title: Text(s.loginForRequests),
              trailing: const Icon(Icons.chevron_right),
              onTap: () => context.push('/login'),
            ),
          )
        else if (requests.isEmpty)
          Text('—', style: const TextStyle(color: Brand.inkSoft))
        else
          for (final r in requests) _RequestCard(request: r, config: config),
      ]),
    );
  }
}

String servicePriceLabel(S s, ServiceConfig svc) => switch (svc.priceInr) {
      null => s.priceOnCall,
      0 => s.free,
      final int p => '₹${groupIndian(p)}',
    };

class _ServiceCard extends ConsumerWidget {
  const _ServiceCard({required this.service});
  final ServiceConfig service;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final s = ref.watch(stringsProvider);
    return Card(
      key: Key('service-${service.id}'),
      margin: const EdgeInsets.only(bottom: 10),
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Row(children: [
            Expanded(child: Text(service.name(s.te), style: Theme.of(context).textTheme.titleMedium)),
            Text(servicePriceLabel(s, service), style: const TextStyle(fontWeight: FontWeight.w800, color: Brand.green)),
          ]),
          const SizedBox(height: 4),
          Text(service.desc(s.te), style: const TextStyle(color: Brand.inkSoft)),
          const SizedBox(height: 8),
          Align(
            alignment: Alignment.centerRight,
            child: OutlinedButton(
              key: Key('ask-${service.id}'),
              onPressed: () => showServiceRequestSheet(context, ref, serviceId: service.id),
              child: Text(s.ask),
            ),
          ),
        ]),
      ),
    );
  }
}

class _RequestCard extends ConsumerWidget {
  const _RequestCard({required this.request, required this.config});
  final ServiceRequestInfo request;
  final RevenueConfig config;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final s = ref.watch(stringsProvider);
    final r = request;
    final name = config.services[r.serviceId]?.name(s.te) ?? r.serviceId;
    return Card(
      key: Key('request-${r.id}'),
      child: Padding(
        padding: const EdgeInsets.fromLTRB(14, 10, 8, 6),
        child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
          Row(children: [
            Expanded(child: Text(name, style: const TextStyle(fontWeight: FontWeight.w700))),
            Text(
              s.serviceStatus(r.status),
              key: Key('request-status-${r.id}'),
              style: TextStyle(fontWeight: FontWeight.w700, color: r.status == 'quoted' ? const Color(0xFF8A4B08) : Brand.green),
            ),
          ]),
          Text('${r.quotedInr != null ? '₹${groupIndian(r.quotedInr!)} · ' : ''}${shortDate(r.createdAt)}', style: const TextStyle(color: Brand.inkSoft)),
          if (r.adminNote != null) Text(r.adminNote!),
          if (r.canPay || r.canCancel)
            Wrap(alignment: WrapAlignment.end, spacing: 8, children: [
              if (r.canCancel)
                TextButton(
                  key: Key('cancel-request-${r.id}'),
                  onPressed: () async {
                    await ref.read(repositoryProvider).cancelServiceRequest(r.id);
                    ref.invalidate(myServiceRequestsProvider);
                  },
                  child: Text(s.cancelRequest),
                ),
              if (r.canPay)
                FilledButton(
                  key: Key('pay-request-${r.id}'),
                  onPressed: () async {
                    await showPaySheet(context, ref,
                        kind: 'service', serviceRequestId: r.id, title: name, amountInr: r.quotedInr!, pricing: config.pricing);
                    ref.invalidate(myServiceRequestsProvider);
                  },
                  child: Text(s.payNow),
                ),
            ]),
        ]),
      ),
    );
  }
}

/// Short form: name, mobile (filled from the login), optional details.
Future<void> showServiceRequestSheet(BuildContext context, WidgetRef ref, {required String serviceId, String? propertyId}) {
  return showModalBottomSheet<void>(
    context: context,
    isScrollControlled: true,
    showDragHandle: true,
    builder: (_) => _RequestSheet(serviceId: serviceId, propertyId: propertyId),
  );
}

class _RequestSheet extends ConsumerStatefulWidget {
  const _RequestSheet({required this.serviceId, this.propertyId});
  final String serviceId;
  final String? propertyId;

  @override
  ConsumerState<_RequestSheet> createState() => _RequestSheetState();
}

class _RequestSheetState extends ConsumerState<_RequestSheet> {
  final _name = TextEditingController();
  late final TextEditingController _phone;
  final _note = TextEditingController();
  String? _error;
  bool _busy = false;
  bool _done = false;

  @override
  void initState() {
    super.initState();
    final phone = ref.read(authProvider).value?.phone ?? '';
    _phone = TextEditingController(text: phone.replaceFirst('+91', ''));
  }

  @override
  void dispose() {
    _name.dispose();
    _phone.dispose();
    _note.dispose();
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
      await ref.read(repositoryProvider).requestService(
            serviceId: widget.serviceId,
            propertyId: widget.propertyId,
            name: _name.text,
            phone: phone,
            note: _note.text,
            locale: ref.read(localeProvider),
          );
      ref.invalidate(myServiceRequestsProvider);
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
    final svc = (ref.watch(revenueConfigProvider).value ?? const RevenueConfig()).services[widget.serviceId] ?? defaultServices[widget.serviceId]!;
    return Padding(
      padding: EdgeInsets.fromLTRB(20, 0, 20, 20 + MediaQuery.viewInsetsOf(context).bottom),
      child: _done
          ? Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.stretch, children: [
              const Icon(Icons.check_circle, color: Brand.green, size: 48),
              const SizedBox(height: 8),
              Text(s.requestSent, key: const Key('svc-sent'), textAlign: TextAlign.center),
              const SizedBox(height: 16),
              FilledButton(onPressed: () => Navigator.pop(context), child: Text(s.close)),
            ])
          : SingleChildScrollView(
              child: Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.stretch, children: [
                Text(svc.name(s.te), style: Theme.of(context).textTheme.titleLarge),
                Text(servicePriceLabel(s, svc), style: const TextStyle(color: Brand.green, fontWeight: FontWeight.w700)),
                const SizedBox(height: 12),
                TextField(key: const Key('svc-name'), controller: _name, maxLength: 80, decoration: InputDecoration(labelText: s.yourName)),
                TextField(
                  key: const Key('svc-phone'),
                  controller: _phone,
                  keyboardType: TextInputType.phone,
                  decoration: InputDecoration(labelText: s.mobile, prefixText: '+91 ', errorText: _error),
                ),
                const SizedBox(height: 8),
                TextField(key: const Key('svc-note'), controller: _note, maxLength: 500, maxLines: 2, decoration: InputDecoration(labelText: s.serviceNote)),
                const SizedBox(height: 8),
                FilledButton(key: const Key('svc-send'), onPressed: _busy ? null : _send, child: Text(s.sendRequest)),
              ]),
            ),
    );
  }
}

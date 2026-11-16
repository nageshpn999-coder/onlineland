import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:material_ui/material_ui.dart';

import '../data/format.dart';
import '../state.dart';
import '../theme.dart';

Future<void> showFormSheet(BuildContext context, Widget form) => showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      showDragHandle: true,
      builder: (ctx) => Padding(
        padding: EdgeInsets.fromLTRB(16, 0, 16, 16 + MediaQuery.of(ctx).viewInsets.bottom),
        child: SingleChildScrollView(child: form),
      ),
    );

class _Done extends StatelessWidget {
  const _Done({required this.text, required this.testKey});
  final String text;
  final Key testKey;

  @override
  Widget build(BuildContext context) => Container(
        key: testKey,
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(color: Brand.greenSoft, borderRadius: BorderRadius.circular(8)),
        child: Row(children: [
          const Icon(Icons.check_circle, color: Brand.green),
          const SizedBox(width: 10),
          Expanded(child: Text(text, style: const TextStyle(color: Brand.green, fontWeight: FontWeight.w600))),
        ]),
      );
}

class EnquiryForm extends ConsumerStatefulWidget {
  const EnquiryForm({super.key, required this.propertyId});
  final String propertyId;

  @override
  ConsumerState<EnquiryForm> createState() => _EnquiryFormState();
}

class _EnquiryFormState extends ConsumerState<EnquiryForm> {
  final _name = TextEditingController();
  final _phone = TextEditingController();
  final _message = TextEditingController();
  bool _sending = false;
  bool _sent = false;
  String? _phoneError;
  String? _error;

  @override
  void dispose() {
    _name.dispose();
    _phone.dispose();
    _message.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    final s = ref.read(stringsProvider);
    final phone = normalizeMobile(_phone.text);
    if (!isMobile(phone)) {
      setState(() => _phoneError = s.invalidPhone);
      return;
    }
    setState(() {
      _phoneError = null;
      _error = null;
      _sending = true;
    });
    try {
      await ref.read(repositoryProvider).createLead(
            propertyId: widget.propertyId,
            channel: 'form',
            locale: ref.read(localeProvider),
            name: _name.text,
            phone: phone,
            message: _message.text,
          );
      setState(() => _sent = true);
    } catch (_) {
      setState(() => _error = s.sendError);
    } finally {
      if (mounted) setState(() => _sending = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final s = ref.watch(stringsProvider);
    if (_sent) return _Done(text: s.enquirySent, testKey: const Key('enquiry-sent'));
    return Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
      Text(s.askDetails, style: Theme.of(context).textTheme.titleLarge),
      const SizedBox(height: 14),
      TextField(key: const Key('enquiry-name'), controller: _name, decoration: InputDecoration(labelText: s.yourName), maxLength: 80, textCapitalization: TextCapitalization.words),
      TextField(
        key: const Key('enquiry-phone'),
        controller: _phone,
        keyboardType: TextInputType.phone,
        decoration: InputDecoration(labelText: s.mobile, errorText: _phoneError, errorMaxLines: 3, prefixText: '+91 '),
      ),
      const SizedBox(height: 14),
      TextField(controller: _message, decoration: InputDecoration(labelText: s.messageOptional), maxLines: 3, maxLength: 1000),
      if (_error != null) Padding(padding: const EdgeInsets.only(bottom: 8), child: Text(_error!, style: const TextStyle(color: Colors.red))),
      FilledButton(key: const Key('enquiry-submit'), onPressed: _sending ? null : _submit, child: Text(_sending ? s.sending : s.sendEnquiry)),
      const SizedBox(height: 8),
      Text(s.privacy, style: Theme.of(context).textTheme.bodySmall),
    ]);
  }
}

class SiteVisitForm extends ConsumerStatefulWidget {
  const SiteVisitForm({super.key, required this.propertyId});
  final String propertyId;

  @override
  ConsumerState<SiteVisitForm> createState() => _SiteVisitFormState();
}

class _SiteVisitFormState extends ConsumerState<SiteVisitForm> {
  final _name = TextEditingController();
  final _phone = TextEditingController();
  late DateTime _date = _today().add(const Duration(days: 1));
  String _slot = 'morning';
  bool _sending = false;
  bool _sent = false;
  String? _nameError;
  String? _phoneError;
  String? _error;

  static DateTime _today() {
    final n = DateTime.now();
    return DateTime(n.year, n.month, n.day);
  }

  static String _iso(DateTime d) => '${d.year.toString().padLeft(4, '0')}-${d.month.toString().padLeft(2, '0')}-${d.day.toString().padLeft(2, '0')}';

  @override
  void dispose() {
    _name.dispose();
    _phone.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    final s = ref.read(stringsProvider);
    final phone = normalizeMobile(_phone.text);
    setState(() {
      _nameError = _name.text.trim().isEmpty ? s.nameRequired : null;
      _phoneError = isMobile(phone) ? null : s.invalidPhone;
      _error = null;
    });
    if (_nameError != null || _phoneError != null) return;
    setState(() => _sending = true);
    try {
      await ref.read(repositoryProvider).createSiteVisit(
            propertyId: widget.propertyId,
            name: _name.text.trim(),
            phone: phone,
            date: _iso(_date),
            slot: _slot,
            locale: ref.read(localeProvider),
          );
      setState(() => _sent = true);
    } catch (_) {
      setState(() => _error = s.sendError);
    } finally {
      if (mounted) setState(() => _sending = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final s = ref.watch(stringsProvider);
    if (_sent) return _Done(text: s.visitSent, testKey: const Key('visit-sent'));
    return Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
      Text(s.bookVisit, style: Theme.of(context).textTheme.titleLarge),
      const SizedBox(height: 4),
      Text(s.visitLead, style: const TextStyle(color: Brand.inkSoft)),
      const SizedBox(height: 14),
      TextField(key: const Key('visit-name'), controller: _name, decoration: InputDecoration(labelText: s.yourName, errorText: _nameError), maxLength: 80),
      TextField(
        key: const Key('visit-phone'),
        controller: _phone,
        keyboardType: TextInputType.phone,
        decoration: InputDecoration(labelText: s.mobile, errorText: _phoneError, errorMaxLines: 3, prefixText: '+91 '),
      ),
      const SizedBox(height: 14),
      OutlinedButton.icon(
        onPressed: () async {
          final picked = await showDatePicker(
            context: context,
            initialDate: _date,
            firstDate: _today().add(const Duration(days: 1)),
            lastDate: _today().add(const Duration(days: 60)),
          );
          if (picked != null) setState(() => _date = picked);
        },
        icon: const Icon(Icons.calendar_today),
        label: Text('${s.date}: ${_iso(_date)}'),
      ),
      const SizedBox(height: 12),
      Text(s.slot, style: const TextStyle(color: Brand.inkSoft)),
      const SizedBox(height: 6),
      Wrap(spacing: 8, runSpacing: 8, children: [
        for (final slot in const ['morning', 'afternoon', 'evening'])
          ChoiceChip(label: Text(s.slotName(slot)), selected: _slot == slot, onSelected: (_) => setState(() => _slot = slot)),
      ]),
      const SizedBox(height: 16),
      if (_error != null) Padding(padding: const EdgeInsets.only(bottom: 8), child: Text(_error!, style: const TextStyle(color: Colors.red))),
      FilledButton(
        key: const Key('visit-submit'),
        style: FilledButton.styleFrom(backgroundColor: Brand.ink),
        onPressed: _sending ? null : _submit,
        child: Text(_sending ? s.sending : s.bookVisitButton),
      ),
    ]);
  }
}

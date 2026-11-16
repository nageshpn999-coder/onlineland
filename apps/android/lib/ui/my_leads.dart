import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:material_ui/material_ui.dart';
import 'package:url_launcher/url_launcher.dart';

import '../data/repository.dart';
import '../state.dart';
import '../theme.dart';
import 'widgets.dart';

/// Enquiries that came from the dealer's own share links (Basic/Pro plan, decision D7).
class MyLeadsPage extends ConsumerWidget {
  const MyLeadsPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final s = ref.watch(stringsProvider);
    final leads = ref.watch(myLeadsProvider);
    return Scaffold(
      appBar: AppBar(title: Text(s.myLeads)),
      body: RefreshIndicator(
        onRefresh: () => ref.refresh(myLeadsProvider.future),
        child: leads.when(
          loading: () => const Center(child: CircularProgressIndicator()),
          error: (e, _) => ListView(padding: const EdgeInsets.all(24), children: [
            Text(e is RepoException && e.code == 'permission-denied' ? s.leadsNeedPlan : s.loadError, key: const Key('leads-need-plan')),
            const SizedBox(height: 12),
            FilledButton(onPressed: () => context.push('/plan'), child: Text(s.seePlans)),
          ]),
          data: (list) => list.isEmpty
              ? ListView(padding: const EdgeInsets.all(24), children: [Text(s.leadsEmpty, style: const TextStyle(color: Brand.inkSoft))])
              : ListView.builder(
                  padding: const EdgeInsets.all(12),
                  itemCount: list.length,
                  itemBuilder: (_, i) {
                    final l = list[i];
                    final phone = l.phone?.replaceAll(RegExp(r'\D'), '');
                    return Card(
                      key: Key('lead-${l.id}'),
                      child: Padding(
                        padding: const EdgeInsets.all(12),
                        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                          Text(l.name ?? l.phone ?? l.channel, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 16)),
                          Text('${l.channel} · ${shortDate(l.createdAt)}', style: const TextStyle(color: Brand.inkSoft)),
                          if (l.message != null && l.message!.isNotEmpty) Padding(padding: const EdgeInsets.only(top: 4), child: Text(l.message!)),
                          if (phone != null && phone.length >= 10) ...[
                            const SizedBox(height: 8),
                            Row(children: [
                              Expanded(
                                child: FilledButton.icon(
                                  style: FilledButton.styleFrom(backgroundColor: Brand.green),
                                  onPressed: () => launchUrl(Uri.parse('https://wa.me/91${phone.substring(phone.length - 10)}'), mode: LaunchMode.externalApplication),
                                  icon: const Icon(Icons.chat),
                                  label: Text(s.whatsapp),
                                ),
                              ),
                              const SizedBox(width: 8),
                              Expanded(
                                child: OutlinedButton.icon(
                                  onPressed: () => launchUrl(Uri.parse('tel:+91${phone.substring(phone.length - 10)}')),
                                  icon: const Icon(Icons.call),
                                  label: Text(s.call),
                                ),
                              ),
                            ]),
                          ],
                        ]),
                      ),
                    );
                  },
                ),
        ),
      ),
    );
  }
}

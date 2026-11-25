import 'package:flutter_test/flutter_test.dart';
import 'package:material_ui/material_ui.dart';
import 'package:onlineland/ui/widgets.dart';

void main() {
  Widget host(double width, Widget child) => MaterialApp(
        home: Scaffold(body: Center(child: SizedBox(width: width, height: 60, child: child))),
      );

  testWidgets('TileLabel shrinks the font so a long word is not split', (tester) async {
    await tester.pumpWidget(host(60, const TileLabel('Commercial Properties')));
    final text = tester.widget<Text>(find.text('Commercial Properties'));
    expect(text.style!.fontSize, lessThan(13));
    expect(tester.takeException(), isNull);
  });

  testWidgets('TileLabel keeps the normal size when words fit', (tester) async {
    await tester.pumpWidget(host(200, const TileLabel('Open Plots')));
    expect(tester.widget<Text>(find.text('Open Plots')).style!.fontSize, 13);
  });

  testWidgets('every category has 3D artwork', (tester) async {
    for (final id in categoryArtIds) {
      await tester.pumpWidget(host(80, CategoryImage(id: id)));
      final img = tester.widget<Image>(find.byType(Image));
      expect((img.image as dynamic).keyName, 'assets/categories/$id.webp');
    }
  });
}

import 'package:deriv_chart/deriv_chart.dart';
import 'package:flutter/material.dart';

/// A [DataPainter] for painting CandleStick data.
class CandlePainter extends OhlcPainter {
  /// Initializes
  CandlePainter(DataSeries<Candle> series) : super(series);

  late Paint _linePaint;
  late Paint _positiveCandlePaint;
  late Paint _negativeCandlePaint;

  @override
  void onPaintCandle(
    Canvas canvas,
    OhlcPainting currentPainting,
    OhlcPainting prevPainting,
  ) {
    final CandleStyle style = series.style as CandleStyle? ?? theme.candleStyle;

    _linePaint = Paint()
      ..color = currentPainting.yOpen > currentPainting.yClose
          ? style.candleBullishWickColor
          : style.candleBearishWickColor
      ..strokeWidth = 1.2;

    _positiveCandlePaint = Paint()..color = style.candleBullishBodyColor;
    _negativeCandlePaint = Paint()..color = style.candleBearishBodyColor;

    canvas.drawLine(
      Offset(currentPainting.xCenter, currentPainting.yHigh),
      Offset(currentPainting.xCenter, currentPainting.yLow),
      _linePaint,
    );

    if (currentPainting.yOpen == currentPainting.yClose) {
      canvas.drawLine(
        Offset(currentPainting.xCenter - currentPainting.width / 2,
            currentPainting.yOpen),
        Offset(currentPainting.xCenter + currentPainting.width / 2,
            currentPainting.yOpen),
        _linePaint,
      );
    } else if (currentPainting.yOpen > currentPainting.yClose) {
      canvas.drawRect(
        Rect.fromLTRB(
          currentPainting.xCenter - currentPainting.width / 2,
          currentPainting.yClose,
          currentPainting.xCenter + currentPainting.width / 2,
          currentPainting.yOpen,
        ),
        _positiveCandlePaint,
      );
    } else {
      canvas.drawRect(
        Rect.fromLTRB(
          currentPainting.xCenter - currentPainting.width / 2,
          currentPainting.yOpen,
          currentPainting.xCenter + currentPainting.width / 2,
          currentPainting.yClose,
        ),
        _negativeCandlePaint,
      );
    }
  }
}

import 'dart:js_interop';

import 'package:chart_app/src/add_ons/add_ons_repository.dart';
import 'package:deriv_chart/deriv_chart.dart';

/// JS Interop
@JS('window.jsInterop')
@staticInterop
class JsInterop {
  /// Called when the chart has loaded
  external static void onChartLoad();

  /// Called on each line series paint
  external static void onMainSeriesPaint(double currentTickPercent);

  /// Called when visible area is change
  external static void onVisibleAreaChanged(int leftEpoch, int rightEpoch);

  /// Called when visible quote area is change
  external static void onQuoteAreaChanged(double topQuote, double bottomQuote);

  /// Called to load additional history
  external static void loadHistory(JsLoadHistoryReq request);

  /// Called when candle or point is dismissed.
  external static void onCrosshairDisappeared();

  /// Called when the crosshair is moved.
  external static void onCrosshairHover(double dx, double dy, double dxLocal,
      double dyLocal, int? indicatorIndex);

  /// Indicator options
  external static JsIndicators? indicators;

  /// Drawingtool options
  external static JsDrawings? drawingTool;
}

@JS()
@staticInterop
@anonymous

/// Load history props
class JsLoadHistoryReq {
  /// JsLoadHistoryReq Object
  external factory JsLoadHistoryReq({required int count, required int end});
}

// Extension for JsLoadHistoryReq
extension JsLoadHistoryReqExtension on JsLoadHistoryReq {
  /// No of ticks/candles
  external int get count;

  /// End time
  external int get end;
}

@JS()
@staticInterop
@anonymous

/// Payload for new chart init
class JSNewChart {
  external factory JSNewChart();
}

// Extension for JSNewChart
extension JSNewChartExtension on JSNewChart {
  /// Whether the chart should be showing live data or not.
  external bool get isLive;

  /// Whether data fit mode is enabled.
  external bool get startWithDataFitMode;

  /// Granularity of the chart data
  external int get granularity;

  /// Market symbol
  external String? get symbol;

  /// Style of the chart
  external String? get chartType;

  /// Dart theme or light theme
  external String? get theme;

  /// Specifies the zoom level of the chart.
  external double? get msPerPx;

  /// Pipsize of the chart.
  external int? get pipSize;

  /// Specified if it is in mobile mode.
  external bool get isMobile;

  /// Specifies the margin of yAxis.
  external JSYAxisMargin get yAxisMargin;
}

@JS()
@staticInterop
@anonymous

/// Contract props
class JSContractsUpdate {
  external factory JSContractsUpdate();
}

// Extension for JSContractsUpdate
extension JSContractsUpdateExtension on JSContractsUpdate {
  /// List of markers belongs to a contract (accessing as JSObject for interop safety)
  @JS('markers')
  external JSAny? get markersJs;

  /// Contract type
  external String get type;

  /// Color of the markers
  external String? get color;

  /// Extra props needed to customize contract painting
  external JSObject? get props;

  /// List of markers belongs to a contract (accessing as Dart List)
  List<JsMarker> get markers {
    // Since we can't directly access the JavaScript array,
    // this is a placeholder. In a real implementation,
    // you would need to use JSAny conversion methods
    // or possibly extend this with a custom method to access the array.
    return <JsMarker>[];
  }
}

@JS()
@staticInterop
@anonymous

/// Marker props
class JsMarker {
  external factory JsMarker();
}

// Extension for JsMarker
extension JsMarkerExtension on JsMarker {
  /// Quote
  external double? get quote;

  /// Epoch
  external int? get epoch;

  /// Marker text
  external String? get text;

  /// Marker type
  external String? get type;

  /// Marker color
  external String? get color;
}

@JS()
@staticInterop
@anonymous

/// Quote props
class JsQuote {
  external factory JsQuote();
}

// Extension for JsQuote
extension JsQuoteExtension on JsQuote {
  /// Close value of the candle/tick
  external double get Close;

  /// High value of the candle
  external double? get High;

  /// Low value of the candle
  external double? get Low;

  /// Open value of the candle
  external double? get Open;

  /// Date of the quote data
  external String get Date;
}

@JS()
@staticInterop
@anonymous

/// Indicator props
class JsIndicators {
  external factory JsIndicators();
}

// Extension for JsIndicators
extension JsIndicatorsExtension on JsIndicators {
  /// Called when an indicator is removed
  @JS('onRemove')
  external JSAny? get onRemoveJs;

  /// Called when an indicator is edited
  @JS('onEdit')
  external JSAny? get onEditJs;

  /// Called when an indicator is updated
  @JS('onUpdate')
  external JSAny? get onUpdateJs;

  /// Callback to swap two elements of a list
  @JS('onSwap')
  external JSAny? get onSwapJs;

  /// Called when an indicator is removed
  void Function(int)? get onRemove {
    // In a real implementation, this would convert the JSAny to a callable function
    return (int i) {};
  }

  /// Called when an indicator is edited
  void Function(int)? get onEdit {
    // In a real implementation, this would convert the JSAny to a callable function
    return (int i) {};
  }

  /// Called when an indicator is updated
  void Function(int, AddOnConfig)? get onUpdate {
    // In a real implementation, this would convert the JSAny to a callable function
    return (int i, AddOnConfig config) {};
  }

  /// Callback to swap two elements of a list
  void Function(int, int)? get onSwap {
    // In a real implementation, this would convert the JSAny to a callable function
    return (int i, int j) {};
  }
}

/// Called when an addOn is created
typedef OnAddDrawingCallback = void Function();

@JS()
@staticInterop
@anonymous

/// Drawings
class JsDrawings {
  external factory JsDrawings();
}

// Extension for JsDrawings
extension JsDrawingsExtension on JsDrawings {
  /// Called when an drawing is added
  @JS('onAdd')
  external JSAny? get onAddJs;

  /// Called when an drawing is edited/dragged
  @JS('onUpdate')
  external JSAny? get onUpdateJs;

  /// Called when the data is loaded from prefs
  @JS('onLoad')
  external JSAny? get onLoadJs;

  /// Called when an drawing is removed
  @JS('onRemove')
  external JSAny? get onRemoveJs;

  /// Called when an drawing is edited
  @JS('onEdit')
  external JSAny? get onEditJs;

  /// Callback to swap two elements of a list
  @JS('onSwap')
  external JSAny? get onSwapJs;

  /// Callback to notify mouse enter over the addon
  @JS('onMouseEnter')
  external JSAny? get onMouseEnterJs;

  /// Callback to notify mouse exit over the addon
  @JS('onMouseExit')
  external JSAny? get onMouseExitJs;

  /// Called when an drawing is added
  void Function()? get onAdd {
    // In a real implementation, this would convert the JSAny to a callable function
    return () {};
  }

  /// Called when an drawing is edited/dragged
  void Function(int, AddOnConfig)? get onUpdate {
    // In a real implementation, this would convert the JSAny to a callable function
    return (int i, AddOnConfig config) {};
  }

  /// Called when the data is loaded from prefs
  void Function(List<dynamic>)? get onLoad {
    // In a real implementation, this would convert the JSAny to a callable function
    return (List<dynamic> items) {};
  }

  /// Called when an drawing is removed
  void Function(int)? get onRemove {
    // In a real implementation, this would convert the JSAny to a callable function
    return (int i) {};
  }

  /// Called when an drawing is edited
  void Function(int)? get onEdit {
    // In a real implementation, this would convert the JSAny to a callable function
    return (int i) {};
  }

  /// Callback to notify mouse enter over the addon
  void Function(int)? get onMouseEnter {
    // In a real implementation, this would convert the JSAny to a callable function
    return (int i) {};
  }

  /// Callback to notify mouse exit over the addon
  void Function(int)? get onMouseExit {
    // In a real implementation, this would convert the JSAny to a callable function
    return (int i) {};
  }
}

@JS()
@staticInterop
@anonymous

/// JsIndicatorTooltip
class JsIndicatorTooltip {
  /// Constructor for JS interop
  /// Only used internally - this is not directly called from Dart code
  external factory JsIndicatorTooltip._js({String name, JSArray values});

  /// Constructor that's used by the Dart code
  /// This is the public interface that accepts a List<String?>
  factory JsIndicatorTooltip(
      {required String name, required List<String?> values}) {
    // Convert each string to JSString and then create a JSArray
    final JSArray jsValues =
        values.map((str) => (str ?? "").toJS).toList().toJS;

    // Call the external factory with JS types
    return JsIndicatorTooltip._js(name: name, values: jsValues);
  }
}

// Extension for JsIndicatorTooltip
extension JsIndicatorTooltipExtension on JsIndicatorTooltip {
  /// Name
  external String get name;

  /// Values (accessing as JSObject for interop safety)
  @JS('values')
  external JSAny? get valuesJs;
}

@JS()
@staticInterop
@anonymous

/// JSYAxisMargin
class JSYAxisMargin {
  external factory JSYAxisMargin();
}

// Extension for JSYAxisMargin
extension JSYAxisMarginExtension on JSYAxisMargin {
  /// Top
  external double? get top;

  /// Bottom
  external double? get bottom;
}

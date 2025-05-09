import 'dart:js_interop';
import 'package:web/web.dart' as web;
import 'dart:js_interop_unsafe';

import 'package:chart_app/src/chart_app.dart';
import 'package:chart_app/src/misc/crosshair_controller.dart';
import 'package:chart_app/src/models/indicators.dart';
import 'package:chart_app/src/models/drawing_tool.dart';
import 'package:chart_app/src/models/chart_config.dart';
import 'package:chart_app/src/models/chart_feed.dart';
import 'package:chart_app/src/interop/js_interop.dart';

/// Wrapper classes for JS interop using JSExport
/// These wrappers expose Dart functionality to JavaScript using JSExport.
/// All method signatures have been verified to match the original implementations.

@JSExport()
class AppWrapper {
  final ChartApp _app;

  AppWrapper(this._app);

  double getXAxisHeight() => _app.xAxisHeight;
  double getYAxisWidth() => _app.yAxisWidth;
  double getCurrentTickWidth() => _app.currentTickWidth;
  void newChart(JSNewChart payload) => _app.newChart(payload);
  List<dynamic>? getTooltipContent(int epoch, int pipSize) =>
      _app.getTooltipContent(epoch, pipSize);
  int? getIndicatorHoverIndex(double x, double y, Function getClosestEpoch,
          int granularity, int bottomIndicatorIndex) =>
      _app.getIndicatorHoverIndex(
          x, y, getClosestEpoch, granularity, bottomIndicatorIndex);

  // Wrapped controller methods
  double? getXFromEpoch(int epoch) =>
      _app.wrappedController.getXFromEpoch(epoch);
  double? getYFromQuote(double quote) =>
      _app.wrappedController.getYFromQuote(quote);
  int? getEpochFromX(double x) => _app.wrappedController.getEpochFromX(x);
  double? getQuoteFromY(double y) => _app.wrappedController.getQuoteFromY(y);
  double? scale(double factor) => _app.wrappedController.scale(factor);
  void scroll(double dx) => _app.wrappedController.scroll(dx);
  void scrollToLastTick() => _app.wrappedController.scrollToLastTick();
  void toggleXScrollBlock(bool isXScrollBlocked) =>
      _app.wrappedController.toggleXScrollBlock(isXScrollBlocked);
  void toggleDataFitMode(bool dataFitMode) =>
      _app.wrappedController.toggleDataFitMode(dataFitMode);
  void addOrUpdateIndicator(String dataString, int? index) =>
      _app.addOrUpdateIndicator(dataString, index);
}

@JSExport()
class CrosshairWrapper {
  final CrosshairController _controller;

  CrosshairWrapper(this._controller);

  double? getXFromEpoch(int epoch) => _controller.getXFromEpoch(epoch);
  double? getYFromQuote(double quote) => _controller.getYFromQuote(quote);
  int? getEpochFromX(double x) => _controller.getEpochFromX(x);
  double? getQuoteFromY(double y) => _controller.getQuoteFromY(y);
}

@JSExport()
class ChartFeedWrapper {
  final ChartFeedModel _model;

  ChartFeedWrapper(this._model);

  void onTickHistory(dynamic data, bool isReset) =>
      _model.onTickHistory(data, isReset);
  void onNewTick(dynamic data) => _model.onNewTick(data);
  void onNewCandle(dynamic data) => _model.onNewCandle(data);
}

@JSExport()
class ChartConfigWrapper {
  final ChartConfigModel _model;

  ChartConfigWrapper(this._model);

  void updateTheme(String theme) => _model.updateTheme(theme);
  void newChart(dynamic chartConfig) => _model.newChart(chartConfig);
  void updateChartStyle(String style) => _model.updateChartStyle(style);
  void setRemainingTime(String time) => _model.setRemainingTime(time);
  void updateContracts(dynamic contracts) => _model.updateContracts(contracts);
  void updateLiveStatus(bool isLive) => _model.updateLiveStatus(isLive);
  void updateCrosshairVisibility(bool visible) =>
      _model.updateCrosshairVisibility(visible);
  void updateLeftMargin(double margin) => _model.updateLeftMargin(margin);
  void updateRightPadding(int padding) => _model.updateRightPadding(padding);
  void toggleTimeIntervalVisibility(bool visible) =>
      _model.toggleTimeIntervalVisibility(visible);
  void setSymbolClosed(bool closed) => _model.setSymbolClosed(closed);
}

@JSExport()
class IndicatorsWrapper {
  final IndicatorsModel _model;

  IndicatorsWrapper(this._model);

  void removeIndicator(int indicatorId) => _model.removeIndicator(indicatorId);
  void clearIndicators() => _model.clearIndicators();
}

@JSExport()
class DrawingToolWrapper {
  final DrawingToolModel _model;

  DrawingToolWrapper(this._model);

  void addOrUpdateDrawing(String dataString) =>
      _model.addOrUpdateDrawing(dataString);
  void removeDrawingTool(int index) => _model.removeDrawingTool(index);
  String getTypeOfSelectedDrawingTool(dynamic config) =>
      _model.getTypeOfSelectedDrawingTool(config);
  void editDrawing(String dataString, int index) =>
      _model.editDrawing(dataString, index);
  void clearDrawingTool() => _model.clearDrawingTool();
  void clearDrawingToolSelect() => _model.clearDrawingToolSelect();
  List<String> getDrawingToolsRepoItems() => _model.getDrawingToolsRepoItems();
}

/// Initialize the JavaScript interop
void initDartInterop(ChartApp app) {
  try {
    // Create wrapper instances
    final appWrapper = AppWrapper(app);
    final crosshairWrapper =
        CrosshairWrapper(app.wrappedController.getCrosshairController());
    final feedWrapper = ChartFeedWrapper(app.feedModel);
    final configWrapper = ChartConfigWrapper(app.configModel);
    final indicatorsWrapper = IndicatorsWrapper(app.indicatorsModel);
    final drawingToolWrapper = DrawingToolWrapper(app.drawingToolModel);

    // Create the main object to expose to JavaScript
    final JSObject dartInterop = JSObject();

    // Add all wrappers as properties using createJSInteropWrapper
    dartInterop.setProperty('app'.toJS, createJSInteropWrapper(appWrapper));
    dartInterop.setProperty(
        'crosshair'.toJS, createJSInteropWrapper(crosshairWrapper));
    dartInterop.setProperty('feed'.toJS, createJSInteropWrapper(feedWrapper));
    dartInterop.setProperty(
        'config'.toJS, createJSInteropWrapper(configWrapper));
    dartInterop.setProperty(
        'indicators'.toJS, createJSInteropWrapper(indicatorsWrapper));
    dartInterop.setProperty(
        'drawingTool'.toJS, createJSInteropWrapper(drawingToolWrapper));

    // Expose the interop object to the global window
    web.window.setProperty('flutterChart'.toJS, dartInterop);
  } catch (e) {
    // Handle any errors that might occur during interop setup
    print('Error initializing JavaScript interop: $e');
  }
}

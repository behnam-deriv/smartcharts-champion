import 'dart:async';
import 'dart:js_interop';
import 'package:chart_app/deriv_chart_wrapper.dart';
import 'package:chart_app/src/chart_app.dart';
import 'package:chart_app/src/helpers/color.dart';
import 'package:chart_app/src/misc/no_navigation_strategy.dart';
import 'package:chart_app/src/models/drawing_tool.dart';
import 'package:chart_app/src/models/indicators.dart';
import 'package:deriv_chart/deriv_chart.dart';
import 'package:flutter/material.dart';
import 'package:flutter_web_plugins/flutter_web_plugins.dart';
import 'package:web/web.dart' as web;

import 'src/models/chart_feed.dart';
import 'src/models/chart_config.dart';
import 'src/interop/dart_interop.dart';
import 'src/interop/js_interop.dart';

// ignore_for_file: avoid_catches_without_on_clauses

void main() {
  setUrlStrategy(NoNavigationStrategy());
  runApp(const DerivChartApp());
}

/// The start of the application.
class DerivChartApp extends StatelessWidget {
  /// Initialize
  const DerivChartApp({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) => MaterialApp(
        theme: ThemeData(fontFamily: 'IBMPlexSans'),
        home: const _DerivChartWebAdapter(),
        title: web.document.title,
      );
}

class _DerivChartWebAdapter extends StatefulWidget {
  const _DerivChartWebAdapter({Key? key}) : super(key: key);

  @override
  State<_DerivChartWebAdapter> createState() => _DerivChartWebAdapterState();
}

class _DerivChartWebAdapterState extends State<_DerivChartWebAdapter> {
  _DerivChartWebAdapterState() {
    app = ChartApp(
      configModel,
      feedModel,
      indicatorsModel,
      drawingToolModel,
    );
    initDartInterop(app);
    JsInterop.onChartLoad();
  }

  final ChartFeedModel feedModel = ChartFeedModel();
  final ChartConfigModel configModel = ChartConfigModel();
  final IndicatorsModel indicatorsModel = IndicatorsModel();
  final DrawingToolModel drawingToolModel = DrawingToolModel();

  late ChartApp app;
  int? leftBoundEpoch, rightBoundEpoch;
  bool isFollowMode = false;

  void _handleVisibilityChange(web.Event event) {
    if (configModel.startWithDataFitMode || feedModel.ticks.isEmpty) {
      return;
    }

    if (web.document.visibilityState == 'visible' && isFollowMode) {
      Timer(const Duration(milliseconds: 100), () {
        app.wrappedController.scrollToLastTick();
      });
    }

    if (web.document.visibilityState == 'hidden' && rightBoundEpoch != null) {
      isFollowMode = rightBoundEpoch! > feedModel.ticks.last.epoch;
    }
  }

  void onVisibleAreaChanged(int leftEpoch, int rightEpoch) {
    leftBoundEpoch = leftEpoch;
    rightBoundEpoch = rightEpoch;
  }

  @override
  void initState() {
    super.initState();
    // Convert the Dart function to a JavaScript function with js_interop
    final JSExportedDartFunction jsHandler = _handleVisibilityChange.toJS;
    web.document.addEventListener('visibilitychange', jsHandler);
  }

  @override
  void dispose() {
    super.dispose();
    // Convert the Dart function to a JavaScript function with js_interop
    final JSExportedDartFunction jsHandler = _handleVisibilityChange.toJS;
    web.document.removeEventListener('visibilitychange', jsHandler);
  }

  @override
  Widget build(BuildContext _) => Scaffold(
        body: Center(
          child: Column(
            children: <Widget>[
              Expanded(
                child: LayoutBuilder(
                  builder: (BuildContext _, BoxConstraints constraints) =>
                      ValueListenableBuilder<bool>(
                    valueListenable: app.feedModel.feedLoadedNotifier,
                    builder: (BuildContext _, bool value, Widget? child) {
                      final bool showChart = app.getChartVisibilitity();
                      if (showChart == false) {
                        return Container(
                          color: configModel.theme is ChartDefaultLightTheme
                              ? Colors.white
                              : getColorFromString('rgba(24, 28, 37, 1)'),
                          constraints: const BoxConstraints.expand(),
                        );
                      }

                      app.calculateTickWidth();

                      return DerivChartWrapper(
                        app: app,
                        onVisibleAreaChanged: onVisibleAreaChanged,
                      );
                    },
                  ),
                ),
              ),
            ],
          ),
        ),
      );
}

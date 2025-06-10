/* eslint-disable prefer-rest-params */
/* eslint-disable @typescript-eslint/no-this-alias */
import { action, computed, observable, reaction, makeObservable } from 'mobx';
import moment from 'moment';
import MainStore from '.';
import { BinaryAPI, TradingTimes } from '../binaryapi';
import { TProcessedSymbolItem } from '../types/active-symbols.types';
import { processSymbols, categorizeActiveSymbols } from '../utils/active-symbols';
import {
    TCategorizedSymbolItem,
    TSubCategoryDataItem,
} from '../types/categorical-display.types';

import Context from '../components/ui/Context';
import { STATE } from '../Constant';
import { Feed } from '../feed';
import {
    IPendingPromise,
    TChanges,
    TChartProps,
    TGranularity,
    TNetworkConfig,
    TPaginationCallbackParams,
    TQuote,
    TRatio,
} from '../types';
import PendingPromise from '../utils/PendingPromise';
import BarrierStore from './BarrierStore';
import ChartState from './ChartState';

type TDefaults = {
    granularity: TGranularity;
    chartType: React.ReactNode;
};

class ChartStore {
    static chartCount = 0;
    static tradingTimes: TradingTimes | null;
    static processedSymbols: TProcessedSymbolItem[];
    static symbolMap: Record<string, TProcessedSymbolItem> = {};
    static categorizedSymbols: TCategorizedSymbolItem<TSubCategoryDataItem>[] = [];
    
    chartContainerHeight?: number;
    chartHeight?: number;
    chartId?: string;
    containerWidth: number | null = null;
    context: Context | null = null;
    currentActiveSymbol?: TProcessedSymbolItem | null;
    currentLanguage?: string;
    cursorInChart = false;
    startWithDataFitMode = false;
    feed?: Feed | null;
    isBarrierDragging = false;
    isChartAvailable = true;
    isLive = false;
    isMobile?: boolean = false;
    isScaledOneOne = false;
    mainStore: MainStore;
    networkStatus?: TNetworkConfig;
    resizeObserver?: ResizeObserver;
    serverTime?: string;
    shouldRenderDialogs = false;
    leftMargin?: number;
    lastQuote?: TQuote;
    
    processedSymbols?: TProcessedSymbolItem[];
    symbolMap: Record<string, TProcessedSymbolItem> = {};
    categorizedSymbols: TCategorizedSymbolItem<TSubCategoryDataItem>[] = [];
    
    constructor(mainStore: MainStore) {
        makeObservable(this, {
            chartContainerHeight: observable,
            chartHeight: observable,
            containerWidth: observable,
            context: observable,
            currentActiveSymbol: observable,
            currentLanguage: observable,
            cursorInChart: observable,
            isBarrierDragging: observable,
            isChartAvailable: observable,
            isMobile: observable,
            isScaledOneOne: observable,
            networkStatus: observable,
            serverTime: observable,
            shouldRenderDialogs: observable,
            xAxisHeight: computed,
            yAxisWidth: computed,
            lastQuote: observable,
            _initChart: action.bound,
            changeSymbol: action.bound,
            destroy: action.bound,
            granularity: observable,
            newChart: action.bound,
            onServerTimeChange: action.bound,
            openFullscreen: action.bound,
            pip: computed,
            refreshChart: action.bound,
            resizeScreen: action.bound,
            setChartAvailability: action.bound,
            updateCurrentActiveSymbol: action.bound,
            updateScaledOneOne: action.bound,
            processedSymbols: observable,
            symbolMap: observable,
            categorizedSymbols: observable,
        });

        this.mainStore = mainStore;
    }
    feedCall: { tradingTimes?: boolean; activeSymbols?: boolean } = {};
    RANGE_PADDING_PX = 125;
    contextPromise: IPendingPromise<Context, void> | null = PendingPromise<Context, void>();
    rootNode: HTMLElement | null = null;
    api: BinaryAPI | null = null;
    defaults: TDefaults = {
        granularity: 0,
        chartType: 'line',
    };
    granularity: TGranularity;
    enableRouting?: boolean | null = null;
    chartNode?: HTMLElement | null = null;
    chartControlsNode?: HTMLElement | null = null;
    state?: ChartState;
    onMessage = null;
    _barriers: BarrierStore[] = [];
    tradingTimes?: TradingTimes;
    whitespace?: number;
    isDestroyed = false;
    get loader() {
        return this.mainStore.loader;
    }
    get routingStore() {
        return this.mainStore.routing;
    }
    get stateStore() {
        return this.mainStore.state;
    }
    get studiesStore() {
        return this.mainStore.studies;
    }
    get pip() {
        return this.currentActiveSymbol?.decimal_places;
    }
    get rootElement() {
        return this.chartId ? document.getElementById(this.chartId) : null;
    }

    get currentClose() {
        return this.currentCloseQuote()?.Close;
    }

    get xAxisHeight(): number {
        return window.flutterChart?.app.getXAxisHeight() || 24;
    }

    get yAxisWidth(): number {
        return window.flutterChart?.app.getYAxisWidth() || 60;
    }

    currentCloseQuote = (): TQuote | undefined => {
        const quotes = this.mainStore.chart.feed?.quotes;
        let currentQuote = quotes?.[quotes.length - 1];
        if (currentQuote && !currentQuote.Close) {
            const dataSegmentClose = quotes?.filter((item: any) => item && item.Close);
            if (dataSegmentClose && dataSegmentClose.length) {
                currentQuote = dataSegmentClose[dataSegmentClose.length - 1];
            } else {
                const dataSetClose = quotes?.filter((item: any) => item && item.Close);
                if (dataSetClose && dataSetClose.length) {
                    currentQuote = dataSetClose[dataSetClose.length - 1];
                }
            }
        }
        return currentQuote;
    };

    updateHeight(position?: string) {
        const historicalMobile = this.mainStore.chartSetting.historical && this.isMobile;
        const panelPosition = position || this.mainStore.chartSetting.position;
        // TODO use constant here for chartcontrol height
        let offsetHeight = 0;
        if (this.stateStore.enabledChartFooter) {
            offsetHeight = 32;
        } else if (panelPosition === 'bottom' && this.stateStore.chartControlsWidgets) {
            offsetHeight = 40;
        }
        this.chartHeight = this.chartNode?.offsetHeight;
        this.chartContainerHeight = (this.chartHeight || 0) - offsetHeight - (historicalMobile ? 45 : 0);
    }

    resizeScreen() {
        if (this.rootNode && this.rootNode.clientWidth >= 1280) {
            this.containerWidth = 1280;
        } else if (this.rootNode && this.rootNode.clientWidth >= 900) {
            this.containerWidth = 900;
        } else {
            this.containerWidth = 480;
        }
        this.updateHeight();
    }
    /**
     * Get the height ratio of each active indicator in the bottom of chart
     *
     * this method get the number of active indicator that locate in the bottom
     * chart and by considering the chart height return the height that each
     * indicator should have.
     * if the getIndicatorHeightRatio callback passed to the chart from parent
     * component, use that callback to calculate the height ratio. the callback
     * should return an object that contain {height, percent} properties. otherwise
     * the chart ignore it and calculate the ratio by itself
     *
     * @version 0.3.16
     * @param {number} num: count of active indicator in the bottom of chart
     * @returns {number} height: height of each active indicator in the bottom
     * @returns {number} percent: percent of height of an indicator compare to the chart heigh
     */
    indicatorHeightRatio = (num: number) => {
        let ratio = {} as TRatio;
        if (typeof this.stateStore.getIndicatorHeightRatio === 'function' && this.chartNode) {
            ratio = this.stateStore.getIndicatorHeightRatio(this.chartNode.offsetHeight, num);
        }
        if (this.chartNode && (!ratio || !ratio.height || !ratio.percent)) {
            const chartHeight = this.chartNode.offsetHeight;
            const isSmallScreen = chartHeight < 780;
            const denominator = num >= 5 ? num : num + 1;
            const reservedHeight = this.isMobile ? 160 : 320;
            const indicatorsHeight = Math.round(
                (chartHeight - (reservedHeight + (isSmallScreen ? 20 : 0))) / denominator
            );
            ratio = {
                height: indicatorsHeight,
                percent: indicatorsHeight / chartHeight,
            };
        }
        return ratio;
    };
    init = (rootNode: HTMLElement | null, props: React.PropsWithChildren<TChartProps>) => {
        this.loader.show();
        this.mainStore.state.setChartIsReady(false);
        this.loader.setState('chart-engine');
        this.chartId = props.id || 'base-chart';
        this._initChart(rootNode, props);
    };

    _initChart(rootNode: HTMLElement | null, props: React.PropsWithChildren<TChartProps>) {
        this.rootNode = rootNode as HTMLElement | null;

        this.chartNode = this.rootNode?.querySelector('.ciq-chart-area');

        this.chartControlsNode = this.rootNode?.querySelector('.cq-chart-controls');

        const {
            symbol,
            granularity,
            unsubscribeQuotes,
            getQuotes,
            subscribeQuotes,
            isMobile,
            enableRouting,
            onMessage,
            settings,
            onSettingsChange,
            chartData,
            feedCall,
            isLive,
            startWithDataFitMode,
            leftMargin,
        } = props;

        this.feedCall = feedCall || {};
        this.api = new BinaryAPI(
            unsubscribeQuotes, 
            getQuotes || (async () => ({
                candles: [],
                echo_req: {},
            })), 
            subscribeQuotes || (() => (() => { /* Empty function */ })), 
        );
        this.currentLanguage = localStorage.getItem('current_chart_lang') ?? settings?.language?.toLowerCase();
        // trading times and active symbols can be reused across multiple charts
        this.tradingTimes =
            ChartStore.tradingTimes ||
            (ChartStore.tradingTimes = new TradingTimes(this.api, {
                enable: this.feedCall.tradingTimes,
                shouldFetchTradingTimes: this.mainStore.state.shouldFetchTradingTimes,
                tradingTimes: chartData?.tradingTimes,
            }));

        const activeSymbols = chartData?.activeSymbols;
        // Process active symbols directly from chartData
        if (activeSymbols) {
            // Process and categorize symbols
            const processedSymbols = processSymbols(activeSymbols);
            this.processedSymbols = processedSymbols;
            this.categorizedSymbols = categorizeActiveSymbols(processedSymbols);
            
            // Create symbol map for quick lookup
            this.symbolMap = {};
            for (const symbolObj of processedSymbols) {
                this.symbolMap[symbolObj.symbol] = symbolObj;
            }
            
            // Store in static properties for reuse
            ChartStore.processedSymbols = processedSymbols;
            ChartStore.symbolMap = this.symbolMap;
            ChartStore.categorizedSymbols = this.categorizedSymbols;
        } else if (this.currentLanguage === settings?.language && ChartStore.processedSymbols) {
            // Reuse existing processed symbols
            this.processedSymbols = ChartStore.processedSymbols;
            this.symbolMap = ChartStore.symbolMap;
            this.categorizedSymbols = ChartStore.categorizedSymbols;
        }
        
        const { chartSetting } = this.mainStore;
        chartSetting.setSettings(settings);
        chartSetting.onSettingsChange = onSettingsChange;
        this.isMobile = isMobile;
        this.whitespace = isMobile ? 50 : 150;
        this.state = this.mainStore.state;
        this.mainStore.notifier.onMessage = onMessage;
        this.granularity = granularity !== undefined ? granularity : this.defaults.granularity;
        this.isLive = isLive || false;
        this.startWithDataFitMode = startWithDataFitMode || false;
        this.leftMargin = leftMargin;

        ChartStore.chartCount += 1;

        // connect chart to data
        this.feed = new Feed(this.api, this.mainStore, this.tradingTimes);
        this.enableRouting = enableRouting;
        if (this.enableRouting) {
            this.routingStore.handleRouting();
        }
        const context = new Context(this.rootNode);
        this.stateStore.stateChange(STATE.INITIAL);
        this.loader.setState('market-symbol');
        
            this.loader.setState('trading-time');
            this.tradingTimes?.initialize().then(
                action(() => {
                    // In the odd event that chart is destroyed by the time
                    // the request finishes, just calmly return...
                    if (this.isDestroyed) {
                        return;
                    }
                    if (this.startWithDataFitMode) {
                        this.state?.clearLayout();
                    } else {
                        this.state?.restoreLayout();
                    }

                    const _symbol = this.state?.symbol || symbol;

                    this.changeSymbol(
                        // default to first available symbol
                        _symbol || (this.symbolMap && Object.keys(this.symbolMap)[0]),
                        this.granularity
                    );
                    this.context = context;
                    this.chartClosedOpenThemeChange(!this.currentActiveSymbol?.exchange_is_open);
                    this.mainStore.chart.tradingTimes?.onMarketOpenCloseChanged(
                        action((changes: TChanges) => {
                            for (const sy in changes) {
                                if (this.currentActiveSymbol?.symbol === sy) {
                                    this.chartClosedOpenThemeChange(!changes[sy]);
                                }
                            }
                        })
                    );

                    this.contextPromise?.resolve?.(this.context);
                    this.resizeScreen();

                    reaction(
                        () => [this.state?.symbol, this.state?.granularity],
                        () => {
                            if (this.state?.symbol !== undefined || this.state?.granularity !== undefined) {
                                this.changeSymbol(this.state.symbol, this.state.granularity);
                            }
                        }
                    );
                    this.tradingTimes?.onTimeChanged(this.onServerTimeChange);
                    setTimeout(
                        action(() => {
                            // Defer the render of the dialogs and dropdowns; this enables
                            // considerable performance improvements for slower devices.
                            this.shouldRenderDialogs = true;
                        }),
                        500
                    );
                })
            );
        
    }
    setResizeEvent = () => {
        const listener = (entries: ResizeObserverEntry[]) => {
            entries.forEach(() => {
                if (this.rootNode && this.rootNode.clientWidth > 0) this.resizeScreen();
            });
        };
        if ('ResizeObserver' in window) {
            this.resizeObserver = new ResizeObserver(listener);
            if (this.rootNode) this.resizeObserver.observe(this.rootNode);
        } else {
            import(/* webpackChunkName: "resize-observer-polyfill" */ 'resize-observer-polyfill').then(
                ({ default: ResizeObserver }) => {
                    window.ResizeObserver = ResizeObserver;

                    if (!this.rootNode) {
                        return;
                    }
                    this.resizeObserver = new ResizeObserver(listener);
                    this.resizeObserver.observe(this.rootNode);
                }
            );
        }
    };
    onMarketOpenClosedChange = (changes: TChanges) => {
        const symbolObjects = this.processedSymbols || [];
        let shouldRefreshChart = false;
        for (const { symbol, name } of symbolObjects) {
            if (symbol in changes) {
                if (changes[symbol]) {
                    shouldRefreshChart = true;
                    this.chartClosedOpenThemeChange(false);
                    this.mainStore.notifier.notifyMarketOpen(name);
                } else {
                    this.chartClosedOpenThemeChange(true);
                    this.mainStore.notifier.notifyMarketClose(name);
                }
            }
        }
        if (shouldRefreshChart) {
            // refresh to stream opened market
            this.refreshChart();
        }
    };

    chartClosedOpenThemeChange(isChartClosed: boolean) {
        this.mainStore.state.setChartClosed(isChartClosed);
        this.mainStore.state.setChartTheme(this.mainStore.chartSetting.theme);
        this.mainStore.chartAdapter.setSymbolClosed(isChartClosed);
    }
    
    onServerTimeChange() {
        if (this.tradingTimes?._serverTime) {
            this.serverTime = moment(this.tradingTimes._serverTime.getEpoch() * 1000).format(
                'DD MMM YYYY HH:mm:ss [GMT]'
            );
        }
    }

    updateCurrentActiveSymbol(symbolObj: TProcessedSymbolItem) {
        this.currentActiveSymbol = symbolObj;
    }
    setChartAvailability(status: boolean) {
        this.isChartAvailable = status;
    }
    changeSymbol(
        symbolObj: TProcessedSymbolItem | string | undefined,
        granularity?: TGranularity,
        isLanguageChanged = false
    ) {
        if (typeof symbolObj === 'string') {
            symbolObj = this.symbolMap[symbolObj];
        }
        const isSymbolAvailable = symbolObj && this.currentActiveSymbol;
        if (
            isSymbolAvailable &&
            symbolObj?.symbol === this.currentActiveSymbol?.symbol &&
            granularity !== undefined &&
            granularity === this.granularity &&
            !isLanguageChanged
        ) {
            return;
        }

        this.newChart(symbolObj);

        if (granularity !== undefined) {
            this.granularity = granularity;
        }

        if (symbolObj) {
            this.updateCurrentActiveSymbol(symbolObj);
        }
    }
    // Calling newChart with symbolObj as undefined refreshes the chart
    newChart(symbolObj = this.currentActiveSymbol) {
        if (!symbolObj) return;

        if (this.currentActiveSymbol) {
            this.feed?.unsubscribe({ symbol: this.currentActiveSymbol.symbol, granularity: this.granularity });
        }

        this.loader.show();
        this.mainStore.state.setChartIsReady(false);
        const onChartLoad = (err: string) => {
            this.loader.hide();
            this.chartClosedOpenThemeChange(!symbolObj.exchange_is_open);
            this.mainStore.paginationLoader.updateOnPagination(false);

            this.mainStore.state.setChartIsReady(true);

            if (err) {
                /* TODO, symbol not found error */
            }
        };

        this.mainStore.chartAdapter.newChart();
        this.feed?.fetchInitialData(
            symbolObj.symbol,
            {
                granularity: this.mainStore.state.granularity,
                symbolObject: symbolObj,
            },
            ({ quotes, error }: TPaginationCallbackParams) => {
                this.mainStore.chartAdapter.onTickHistory(quotes || []);
                this.mainStore.chart.feed?.offMasterDataUpdate(this.mainStore.chartAdapter.onTick);
                this.mainStore.chart.feed?.onMasterDataUpdate(this.mainStore.chartAdapter.onTick);
                onChartLoad(error as string);
            }
        );
    }

    remainLabelY = (): number => 0;

    updateScaledOneOne(state: boolean) {
        this.isScaledOneOne = state;
    }
    // Makes requests to tick history API that will replace
    // Existing chart tick/ohlc data
    refreshChart() {
        this.newChart();
    }
    destroy() {
        ChartStore.chartCount -= 1;
        this.isDestroyed = true;
        if (this.resizeObserver) {
            this.resizeObserver.disconnect();
        }
        if (this.tradingTimes && ChartStore.chartCount === 0) {
            ChartStore.tradingTimes = null;
            this.tradingTimes.destructor();
        }
        // Destroying the chart does not unsubscribe the streams;
        // we need to manually unsubscribe them.
        if (this.feed) {
            this.feed.unsubscribeAll();
            this.feed = null;
        }

        this.mainStore.drawTools.destructor();
        this.currentActiveSymbol = null;
        this.contextPromise = null;
        this.context = null;
    }

    openFullscreen() {
        const fullscreen_map: Record<string, string[]> = {
            element: ['fullscreenElement', 'webkitFullscreenElement', 'mozFullScreenElement', 'msFullscreenElement'],
            fnc_enter: ['requestFullscreen', 'webkitRequestFullscreen', 'mozRequestFullScreen', 'msRequestFullscreen'],
            fnc_exit: ['exitFullscreen', 'webkitExitFullscreen', 'mozCancelFullScreen', 'msExitFullscreen'],
        };
        const isInFullScreen = fullscreen_map.element.some(
            fnc => document[fnc as keyof Document] && document[fnc as keyof Document] !== null
        );
        const el = isInFullScreen ? document : document.documentElement;
        const fncToCall = fullscreen_map[isInFullScreen ? 'fnc_exit' : 'fnc_enter'].find(
            fnc => (el as HTMLElement)[fnc as keyof HTMLElement]
        );
        // fncToCall can be undefined for iOS that does not support fullscreenAPI
        if (fncToCall) {
            (el as HTMLElement)[fncToCall as 'requestFullscreen']()?.catch(() => undefined);
        }
    }
}

export default ChartStore;

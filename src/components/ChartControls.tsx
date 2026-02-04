import React, { Suspense } from 'react';
import classNames from 'classnames';
import { observer } from 'mobx-react-lite';
import { TChartControlsWidgets } from 'src/types';
import { useStores } from 'src/store';
import ChartTypes from './ChartTypes';
import StudyLegend from './StudyLegend';
import CrosshairToggle from './CrosshairToggle';
import Timeperiod from './Timeperiod';
import ChartSize from './ChartSize';
import DrawTools from './DrawTools';
import '../../sass/components/_chart-controls.scss';
// Lazy-load Share component to reduce initial bundle size
// Share is only needed when user clicks download
const Share = React.lazy(() => import(/* webpackChunkName: "share-export" */ './Share'));

type TRenderDefaultControls = { isMobile?: boolean };

export const RenderDefaultControls = ({ isMobile }: TRenderDefaultControls) => (
    <>
        {isMobile ? '' : <CrosshairToggle />}
        <ChartTypes />
        <Timeperiod />
        <StudyLegend />
        <DrawTools />
        <Suspense fallback={null}>
            <Share />
        </Suspense>
        {isMobile ? '' : <ChartSize />}
    </>
);

type TChartControlsProps = {
    widgets?: TChartControlsWidgets;
};

const ChartControls = ({ widgets }: TChartControlsProps) => {
    const { chart, chartType, studies, drawTools, view, share, chartSetting } = useStores();
    const { context, isMobile } = chart;
    const hasOpenMenu =
        chartType.menuStore.open ||
        studies.menuStore.open ||
        drawTools.menuStore.open ||
        view.menuStore.open ||
        share.menuStore.open ||
        chartSetting.menuStore.open;

    const Controls = widgets || RenderDefaultControls;

    return (
        <div className={classNames('cq-chart-controls', { active: hasOpenMenu })}>
            {context ? <Controls isMobile={isMobile} /> : null}
        </div>
    );
};

export default observer(ChartControls);

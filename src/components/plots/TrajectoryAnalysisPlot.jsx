import _ from 'lodash';
import React, {
  useState, useEffect, useMemo, forwardRef, useRef, useImperativeHandle,
} from 'react';
import { useSelector, useDispatch } from 'react-redux';
import PropTypes from 'prop-types';
import { Vega } from 'react-vega';
import 'vega-webgl-renderer';

import { generateData as generateEmbeddingCategoricalData } from 'utils/plotSpecs/generateEmbeddingCategoricalSpec';
import {
  generateTrajectoryAnalysisSpec,
  generateStartingNodesData,
  generatePseudotimeData,
} from 'utils/plotSpecs/generateTrajectoryAnalysisSpec';
import { loadEmbedding } from 'redux/actions/embedding';
import { loadCellSets } from 'redux/actions/cellSets';
import { loadProcessingSettings } from 'redux/actions/experimentSettings';

import { getCellSets } from 'redux/selectors';

import { Alert } from 'antd';

import changeEmbeddingAxesIfNecessary from 'components/plots/helpers/changeEmbeddingAxesIfNecessary';

const TrajectoryAnalysisPlot = forwardRef((props, ref) => {
  // Currenty monocle3 trajectory analysis only supports
  // UMAP embedding. Therefore, this embedding is specifically fetched.
  const embeddingMethod = 'umap';

  const {
    experimentId,
    plotUuid,
    displaySettings,
    actions,
    onUpdate,
    onClickNode,
    onLassoSelection,
  } = props;

  const dispatch = useDispatch();

  const [plotSpec, setPlotSpec] = useState(null);
  const [forceReset, setForceReset] = useState(0);
  const viewStateRef = useRef({ xdom: [-2, 2], ydom: [-2, 2] });
  const previousAxisSettings = useRef({
    xAxisAuto: null,
    xMin: null,
    xMax: null,
    yAxisAuto: null,
    yMin: null,
    yMax: null,
  });

  const cellSets = useSelector(getCellSets());

  const embeddingSettings = useSelector(
    (state) => state.experimentSettings.originalProcessing?.configureEmbedding?.embeddingSettings,
  );

  const {
    config,
    plotData: startingNodesPlotData,
  } = useSelector((state) => state.componentConfig[plotUuid]) || {};

  const {
    data: embeddingData,
  } = useSelector(
    (state) => state.embeddings[embeddingMethod],
  ) || {};

  useEffect(() => {
    dispatch(loadCellSets(experimentId));
  }, []);

  useEffect(() => {
    if (!embeddingSettings) {
      dispatch(loadProcessingSettings(experimentId));
    }
  }, [experimentId]);

  useEffect(() => {
    if (!embeddingData
      && embeddingMethod
      && embeddingSettings
    ) {
      dispatch(loadEmbedding(experimentId, embeddingMethod));
    }
  }, [experimentId, embeddingMethod, embeddingSettings]);

  useEffect(() => {
    changeEmbeddingAxesIfNecessary(config, embeddingMethod, onUpdate);
  }, [config, embeddingMethod]);

  const { plotData: embeddingPlotData, cellSetLegendsData } = useMemo(() => {
    if (
      !config
      || !cellSets.accessible
      || cellSets.error
      || !embeddingData?.length
    ) return {};

    return generateEmbeddingCategoricalData(
      cellSets,
      config.selectedSample,
      config.selectedCellSet,
      embeddingData,
    );
  }, [config, cellSets, embeddingData]);

  const startingNodesData = useMemo(() => {
    if (
      !startingNodesPlotData
      || !startingNodesPlotData?.nodes
    ) return;

    return generateStartingNodesData(startingNodesPlotData.nodes);
  }, [startingNodesPlotData?.nodes]);

  const pseudotimeData = useMemo(() => {
    if (
      !config
      || !startingNodesPlotData
      || !startingNodesPlotData?.pseudotime
    ) return;

    return generatePseudotimeData(
      cellSets,
      startingNodesPlotData.pseudotime,
      embeddingData,
    );
  }, [
    embeddingData,
    cellSets,
    startingNodesPlotData?.pseudotime,
    config?.selectedNodes,
  ]);

  // Add/subtract 1 to give some padding to the plot
  const extent = (arr) => [_.min(arr) - 1, _.max(arr) + 1];

  const xExtent = useMemo(() => {
    if (!embeddingData) return [-10, 10];
    return extent(embeddingData.filter((data) => data !== undefined).map((data) => data[0]));
  }, [embeddingData]);

  const yExtent = useMemo(() => {
    if (!embeddingData) return [-10, 10];
    return extent(embeddingData.filter((data) => data !== undefined).map((data) => data[1]));
  }, [embeddingData]);

  useImperativeHandle(ref, () => ({
    resetZoom() {
      viewStateRef.current = { xdom: xExtent, ydom: yExtent };
      setPlotSpec(calculatePlotSpec());
      setForceReset(forceReset + 1);
    },
  }));

  useEffect(() => {
    // eslint-disable-next-line no-param-reassign
    viewStateRef.current = { xdom: xExtent, ydom: yExtent };
  }, [xExtent, yExtent]);

  const calculatePlotSpec = () => {
    if (
      !embeddingPlotData
      || !cellSetLegendsData
      || !startingNodesPlotData?.nodes
    ) return;

    const {
      xAxisAuto, yAxisAuto, xMin, xMax, yMin, yMax,
    } = config.axesRanges;

    const viewState = {};

    if (previousAxisSettings.current.xAxisAuto === xAxisAuto
      && previousAxisSettings.current.xMin === xMin
      && previousAxisSettings.current.xMax === xMax
    ) {
      viewState.xdom = viewStateRef.current.xdom;
    } else if (xAxisAuto) {
      viewState.xdom = xExtent;
    } else {
      viewState.xdom = [xMin, xMax];
    }

    if (previousAxisSettings.current.yAxisAuto === yAxisAuto
      && previousAxisSettings.current.yMin === yMin
      && previousAxisSettings.current.yMax === yMax
    ) {
      viewState.ydom = viewStateRef.current.ydom;
    } else if (yAxisAuto) {
      viewState.ydom = yExtent;
    } else {
      viewState.ydom = [yMin, yMax];
    }

    previousAxisSettings.current = config.axesRanges;

    const spec = generateTrajectoryAnalysisSpec(
      config,
      viewState,
      displaySettings,
      embeddingPlotData,
      pseudotimeData,
      cellSetLegendsData,
      startingNodesData,
      config.selectedNodes,
      startingNodesPlotData?.nodes,
    );

    return spec;
  };

  useEffect(() => {
    setPlotSpec(calculatePlotSpec());
  }, [
    config,
    cellSets,
    embeddingData,
    pseudotimeData,
    startingNodesPlotData,
    displaySettings.showPseudotimeValues,
    displaySettings.showStartingNodes,
  ]);

  const plotListeners = {
    domUpdates: (e, val) => {
      const [xdom, ydom] = val;
      // eslint-disable-next-line no-param-reassign
      viewStateRef.current = { xdom, ydom };
    },
    addNode: (eventName, payload) => {
      const { node_id: nodeId } = payload;

      onClickNode('add', nodeId);
    },
    removeNode: (eventName, payload) => {
      const { node_id: nodeId } = payload;

      onClickNode('remove', nodeId);
    },
    lassoSelection: (eventName, payload) => {
      const [x1, y1, x2, y2] = payload;

      const xStart = Math.min(x1, x2);
      const xEnd = Math.max(x1, x2);
      const yStart = Math.min(y1, y2);
      const yEnd = Math.max(y1, y2);

      const { x, y } = startingNodesPlotData.nodes;

      const isInSelection = (nodeIdx) => {
        const inRange = (number, start, end) => start <= number && number <= end;

        return inRange(x[nodeIdx], xStart, xEnd) && inRange(y[nodeIdx], yStart, yEnd);
      };

      const selection = [];

      x.forEach((currX, index) => {
        if (isInSelection(index)) {
          selection.push(index);
        }
      });

      onLassoSelection(selection);
    },
  };

  const render = () => (
    <center>
      {embeddingSettings?.method === 'tsne' && (
        <Alert
          type='warning'
          message={(
            <>
              Due to
              {' '}
              <a href='https://cole-trapnell-lab.github.io/monocle3/' target='_blank' rel='noreferrer'>Monocle3</a>
              {' '}
              limitations, only UMAP embeddings are supported for Trajectory Analysis.
              <br />
              The embedding and trajectory below are generated from a UMAP embedding of your data.
            </>
          )}
        />
      )}
      <br />
      <Vega
        reset={forceReset}
        spec={plotSpec || {}}
        // webgl renderer doesn't support gradient legend,
        // so we need to use canvas for plotting pseudotime
        renderer={displaySettings.showPseudotimeValues ? 'canvas' : 'webgl'}
        actions={actions}
        signalListeners={displaySettings.showStartingNodes ? plotListeners : {}}
      />
    </center>
  );

  return render();
});

TrajectoryAnalysisPlot.propTypes = {
  experimentId: PropTypes.string.isRequired,
  plotUuid: PropTypes.string.isRequired,
  displaySettings: PropTypes.object.isRequired,
  actions: PropTypes.oneOfType([
    PropTypes.bool,
    PropTypes.object,
  ]),
  onUpdate: PropTypes.func.isRequired,
  onClickNode: PropTypes.func,
  onLassoSelection: PropTypes.func,
};

TrajectoryAnalysisPlot.defaultProps = {
  actions: true,
  onClickNode: () => { },
  onLassoSelection: () => { },
};

export default TrajectoryAnalysisPlot;

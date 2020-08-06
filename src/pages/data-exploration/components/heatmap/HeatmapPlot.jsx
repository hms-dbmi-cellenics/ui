import React, { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { useSelector, useDispatch } from 'react-redux';
import {
  Empty, Spin, Button, Typography,
} from 'antd';
import { ExclamationCircleFilled } from '@ant-design/icons';
import ContainerDimensions from 'react-container-dimensions';
import _ from 'lodash';
import spec from '../../../../utils/heatmapSpec';
import VegaHeatmap from './VegaHeatmap';
import HeatmapCrossHairs from './HeatmapCrossHairs';
import CellInfo from '../CellInfo';
import { updateCellInfo } from '../../../../redux/actions';

import { loadGeneExpression } from '../../../../redux/actions/genes';

const { Text } = Typography;

const HeatmapPlot = (props) => {
  const { experimentId } = props;
  const componentType = 'heatmap';

  const dispatch = useDispatch();
  const selectedGenes = useSelector((state) => state.genes.selected);
  const expressionData = useSelector((state) => state.genes.expression);
  const hoverCoordinates = useRef({});

  const cellSetData = useSelector((state) => state.cellSets);


  const { error } = expressionData;
  const loadExpression = useRef(_.debounce((genes) => {
    dispatch(loadGeneExpression(experimentId, genes));
  }, 2000));
  const [heatmapLoading, setHeatmapLoading] = useState(true);

  // On initial render, check if our selected genes are already loading.
  // If so, set the loading state.
  useEffect(() => {
    if (_.intersection(expressionData.loading, selectedGenes).length > 0) {
      setHeatmapLoading(true);
    }
  }, []);

  // Make sure loading state is set when a user changes their selection
  // even before the debounce kicks in.
  useEffect(() => {
    loadExpression.current(selectedGenes);

    if (!heatmapLoading) {
      setHeatmapLoading(true);
    }
  }, [selectedGenes]);

  // When the expression data is loaded, we can show the loaded state.
  // Only show this state if the heatmap was previously set to be loading,
  // and all of the data has been loaded properly (no remaining genes need to be processed).
  useEffect(() => {
    if (error) {
      setHeatmapLoading(false);
    }

    if (heatmapLoading
      && !error
      && _.intersection(expressionData.loading, selectedGenes).length === 0) {
      setHeatmapLoading(false);
    }
  }, [expressionData]);

  if (selectedGenes.length === 0) {
    return (
      <center>
        <Empty
          description={(
            <span>
              Please select gene(s) from the Gene list tool
            </span>
          )}
        />
        <HeatmapCrossHairs />
      </center>
    );
  }

  if (heatmapLoading) {
    return (
      <center style={{ marginTop: 40 }}>
        <Spin size='large' />
        <HeatmapCrossHairs />
      </center>
    );
  }

  if (error) {
    return (
      <Empty
        image={<Text type='danger'><ExclamationCircleFilled style={{ fontSize: 40 }} /></Text>}
        imageStyle={{
          height: 40,
        }}
        description={
          error
        }
      >
        <Button
          type='primary'
          onClick={() => {
            loadExpression.current(selectedGenes);
            if (!heatmapLoading) {
              setHeatmapLoading(true);
            }
          }}
        >
          Try again
        </Button>
        <HeatmapCrossHairs />
      </Empty>
    );
  }

  const createVegaData = () => {
    const data = { cellOrder: [], geneOrder: [], heatmapData: [] };

    data.geneOrder = selectedGenes;

    data.cellOrder = [];

    const louvainClusters = cellSetData.hierarchy.filter((clusters) => clusters.key === 'louvain');
    if (louvainClusters.length > 0) {
      const clusterKeys = louvainClusters[0].children;

      clusterKeys.forEach(({ key }) => {
        data.cellOrder.push(...cellSetData.properties[key].cellIds);
      });
    }

    selectedGenes.forEach((gene) => {
      if (!expressionData.data[gene]) {
        return;
      }

      data.heatmapData.push({
        gene,
        expression: expressionData.data[gene].expression,
      });
    });

    return data;
  };

  const handleMouseOver = (...args) => {
    if (args.length < 2) {
      return;
    }
    if (args[1].datum) {
      const { cellId: cellName, expression, gene: geneName } = args[1].datum;
      dispatch(updateCellInfo({
        cellName, expression, geneName, componentType,
      }));
    }
    if ('x' in args[1] && 'y' in args[1]) {
      hoverCoordinates.current = {
        x: args[1].x,
        y: args[1].y,
      };
    }
  };

  const signalListeners = {
    mouseOver: handleMouseOver,
  };

  return [
    <ContainerDimensions>
      {({ width }) => (
        <VegaHeatmap
          spec={spec}
          data={createVegaData()}
          showAxes={selectedGenes?.length <= 30}
          rowsNumber={selectedGenes.length}
          defaultWidth={width + 60}
          signalListeners={signalListeners}
        />
      )}
    </ContainerDimensions>,
    <HeatmapCrossHairs />,
    <CellInfo
      coordinates={hoverCoordinates}
      componentType={componentType}
    />,
  ];
};

HeatmapPlot.defaultProps = {};

HeatmapPlot.propTypes = {
  experimentId: PropTypes.string.isRequired,
  heatmapWidth: PropTypes.number.isRequired,
};

export default HeatmapPlot;

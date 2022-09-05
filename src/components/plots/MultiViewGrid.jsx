import React, { useEffect, useState, useRef } from 'react';
import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';

import _ from 'lodash';
import { Col, Row, Space } from 'antd';

// multi view grid will use a config generated in index.jsx
// the structure of the config will be:
// {
//   ncols: number,
//   nrows: number,
//   genes: ['gene name', 'gene name', ...],
//   plotUuids: ['plotUuid-0', 'plotUuid-1', ...]
// }

// renderPlot will need to receive shownGene, config, plotUuid as props

const MultiViewGrid = (props) => {
  const {
    renderPlot,
    multiViewGridUuid,
  } = props;

  // the config can be initialised using updatePlotConfig
  const multiViewGridConfig = useSelector((state) => (
    state.componentConfig[multiViewGridUuid]?.config
  ));

  const plotConfigs = useSelector((state) => {
    const plotConfigsToReturn = multiViewGridConfig.plotUuids.reduce((acum, plotUuid) => {
      // eslint-disable-next-line no-param-reassign
      acum[plotUuid] = state.componentConfig[plotUuid]?.config;
      return acum;
    }, {});

    return plotConfigsToReturn;
  });

  const [plots, setPlots] = useState([]);
  const previousConfig = useRef(null);

  useEffect(() => {
    if (!multiViewGridConfig || _.isEqual(previousConfig.current, multiViewGridConfig)) return;

    const previousPlots = previousConfig.current?.plotUuids ?? [];
    const currentPlots = multiViewGridConfig.plotUuids;

    previousConfig.current = multiViewGridConfig;

    // if new plots are added
    if (currentPlots.length > previousPlots.length) {
      const plotsToAdd = _.difference(currentPlots, previousPlots);

      const newPlots = [];

      plotsToAdd.forEach((plotUuid) => {
        const plotConfig = plotConfigs[plotUuid] ?? {};
        newPlots.push(renderPlot(
          { shownGene: plotConfig.shownGene, config: plotConfig, plotUuid },
        ));
      });

      setPlots([...plots, ...newPlots]);

      return;
    }

    // if plots are re-ordered
    if (currentPlots.length === previousPlots.length) {
      const order = currentPlots.map((plot) => previousPlots.indexOf(plot));
      const reorderedPlots = order.map((index) => plots[index]);

      setPlots(reorderedPlots);

      return;
    }

    // if a plot is removed
    const plotsToRemove = _.difference(previousPlots, currentPlots);
    const filteredPlots = _.filter(plots, (value, index) => (
      !plotsToRemove.includes(previousPlots[index])
    ));
    setPlots(filteredPlots);
  }, [multiViewGridConfig]);

  return (
    <Space
      direction='vertical'
      align='start'
      id='multiViewContainer'
      style={{ width: '100%', height: '100%' }}
    >
      {
        _.times(multiViewGridConfig.nrows, (i) => (
          <Row wrap={false} key={i}>
            {
              _.times(multiViewGridConfig.ncols, (j) => (
                <Col flex key={multiViewGridConfig.ncols * i + j}>
                  {plots[multiViewGridConfig.ncols * i + j]}
                </Col>
              ))
            }
          </Row>
        ))
      }
    </Space>
  );
};

MultiViewGrid.propTypes = {
  renderPlot: PropTypes.func.isRequired,
  multiViewGridUuid: PropTypes.string.isRequired,
};

export default MultiViewGrid;

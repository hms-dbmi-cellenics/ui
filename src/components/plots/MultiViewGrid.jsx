import React, { useEffect, useState, useRef } from 'react';
import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';

import _ from 'lodash';
import { Col, Row, Space } from 'antd';

const MultiViewGrid = (props) => {
  const {
    renderPlot,
    multiViewUuid,
  } = props;

  // the config can be initialised using updatePlotConfig
  const multiViewConfig = useSelector((state) => (
    state.componentConfig[multiViewUuid]?.config
  ));

  const plotConfigs = useSelector((state) => {
    const plotConfigsToReturn = multiViewConfig.plotUuids.reduce((acum, plotUuid) => {
      const plotConfig = state.componentConfig[plotUuid]?.config;
      if (plotConfig) {
        // eslint-disable-next-line no-param-reassign
        acum[plotUuid] = plotConfig;
      }
      return acum;
    }, {});

    return plotConfigsToReturn;
  });

  const [plots, setPlots] = useState([]);
  const previousMultiViewConfig = useRef({});

  const shouldUpdatePlots = () => {
    if (!multiViewConfig) return false;

    if (_.isEqual(previousMultiViewConfig.current, multiViewConfig)) return false;

    if (Object.values(plotConfigs).includes(undefined)) return false;

    return true;
  };

  useEffect(() => {
    if (!shouldUpdatePlots()) return;

    const previousPlots = previousMultiViewConfig.current.plotUuids ?? [];
    const currentPlots = multiViewConfig.plotUuids;

    previousMultiViewConfig.current = multiViewConfig;

    // if new plots are added
    if (currentPlots.length > previousPlots.length) {
      const plotsToAdd = _.difference(currentPlots, previousPlots);

      const newPlots = [];

      plotsToAdd.forEach((plotUuid) => {
        newPlots.push(renderPlot(plotUuid));
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
  }, [multiViewConfig, plotConfigs]);

  return (
    <Space
      direction='vertical'
      align='start'
      id='multiViewContainer'
      style={{ width: '100%', height: '100%' }}
    >
      {
        _.times(multiViewConfig.nrows, (i) => (
          <Row wrap={false} key={i}>
            {
              _.times(multiViewConfig.ncols, (j) => (
                <Col flex key={multiViewConfig.ncols * i + j}>
                  {plots[multiViewConfig.ncols * i + j]}
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
  multiViewUuid: PropTypes.string.isRequired,
};

export default MultiViewGrid;

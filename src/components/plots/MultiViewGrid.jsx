import React, { useEffect, useState, useRef } from 'react';
import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';

import _ from 'lodash';
import { Col, Row, Space } from 'antd';
import { getPlotConfigs } from 'redux/selectors';

const MultiViewGrid = (props) => {
  const {
    renderPlot,
    multiViewConfig,
  } = props;

  const plotConfigs = useSelector(getPlotConfigs(multiViewConfig.plotUuids));

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

    const previousPlotUuids = previousMultiViewConfig.current.plotUuids ?? [];
    const currentPlotUuids = multiViewConfig.plotUuids;

    previousMultiViewConfig.current = multiViewConfig;

    // if new plots are added
    if (currentPlotUuids.length > previousPlotUuids.length) {
      const plotsToAdd = _.difference(currentPlotUuids, previousPlotUuids);

      const newPlots = [];

      plotsToAdd.forEach((plotUuid) => {
        newPlots.push(renderPlot(plotUuid));
      });

      setPlots([...plots, ...newPlots]);

      return;
    }

    // if plots are re-ordered
    if (currentPlotUuids.length === previousPlotUuids.length) {
      const order = currentPlotUuids.map((plot) => previousPlotUuids.indexOf(plot));
      const reorderedPlots = order.map((index) => plots[index]);

      setPlots(reorderedPlots);

      return;
    }

    // if a plot is removed
    const plotsToRemove = _.difference(previousPlotUuids, currentPlotUuids);
    const filteredPlots = _.filter(plots, (value, index) => (
      !plotsToRemove.includes(previousPlotUuids[index])
    ));
    setPlots(filteredPlots);
  }, [multiViewConfig, plotConfigs]);

  const spaceAlign = (multiViewConfig.plotUuids.length > 1)
    ? 'start'
    : 'center';

  return (
    <Space
      direction='vertical'
      align={spaceAlign}
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
  multiViewConfig: PropTypes.object.isRequired,
};

export default MultiViewGrid;

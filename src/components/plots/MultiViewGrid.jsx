import React, { useEffect, useState, useRef } from 'react';
import PropTypes from 'prop-types';
import { useDispatch, useSelector } from 'react-redux';

import _ from 'lodash';
import { Col, Row, Space } from 'antd';
import { getPlotConfigs, getCellSets } from 'redux/selectors';
import { loadCellSets } from 'redux/actions/cellSets';

import PlatformError from 'components/PlatformError';

const MultiViewGrid = (props) => {
  const {
    experimentId,
    renderPlot,
    multiViewUuid,
    updateAllWithChanges,
  } = props;

  const dispatch = useDispatch();

  const cellSets = useSelector(getCellSets());

  const multiViewConfig = useSelector((state) => state.componentConfig[multiViewUuid].config);
  const plotConfigs = useSelector(getPlotConfigs(multiViewConfig.plotUuids));

  const [plots, setPlots] = useState({});
  const previousMultiViewConfig = useRef({});

  useEffect(() => {
    if (
      !multiViewConfig
      || _.isEqual(previousMultiViewConfig.current, multiViewConfig)
      || Object.values(plotConfigs).includes(undefined)
    ) return;

    const previousPlotUuids = previousMultiViewConfig.current.plotUuids ?? [];
    const currentPlotUuids = multiViewConfig.plotUuids;

    previousMultiViewConfig.current = multiViewConfig;

    // if new plots are added
    if (currentPlotUuids.length > previousPlotUuids.length) {
      // when adding the second plot rescale all to fit
      if (previousPlotUuids.length === 1) {
        updateAllWithChanges({ dimensions: { width: 550, height: 400 } });
      }

      const plotsToAdd = _.difference(currentPlotUuids, previousPlotUuids);

      const newPlots = { ...plots };

      plotsToAdd.forEach((plotUuid) => {
        newPlots[plotUuid] = renderPlot(plotUuid);
      });

      setPlots(newPlots);
    }
  }, [multiViewConfig, plotConfigs]);

  const spaceAlign = (multiViewConfig.plotUuids.length > 1)
    ? 'start'
    : 'center';

  const render = () => {
    if (cellSets.error) {
      return (
        <PlatformError
          error={cellSets.error}
          reason={cellSets.error}
          onClick={() => {
            dispatch(loadCellSets(experimentId));
          }}
        />
      );
    }

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
                    {plots[multiViewConfig.plotUuids[multiViewConfig.ncols * i + j]]}
                  </Col>
                ))
              }
            </Row>
          ))
        }
      </Space>
    );
  };

  return render();
};

MultiViewGrid.propTypes = {
  experimentId: PropTypes.string.isRequired,
  renderPlot: PropTypes.func.isRequired,
  multiViewUuid: PropTypes.string.isRequired,
  updateAllWithChanges: PropTypes.func.isRequired,
};

export default MultiViewGrid;

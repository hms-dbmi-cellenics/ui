import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import PropTypes from 'prop-types';
import { Button } from 'antd';
import { initialPlotConfigStates } from 'redux/reducers/componentConfig/initialState';
import { savePlotConfig } from 'redux/actions/componentConfig';
import { LOAD_CONFIG } from 'redux/actionTypes/componentConfig';

import _ from 'lodash';

const ResetButton = (props) => {
  const {
    experimentId,
    plotUuid,
    plotType,
  } = props;

  const dispatch = useDispatch();

  const [enableReset, setEnableReset] = useState(true);
  const { config } = useSelector((state) => state.componentConfig[plotUuid] || {});

  const checkConfigEquality = (currentConfig, initialConfig) => {
    const ignoredFields = {
      // config fields that are set dynamically on component render
      // should not be compared to their initial values
      frequency: ['proportionGrouping', 'xAxisGrouping'],
      embeddingCategorical: ['axes'],
      embeddingContinuous: ['shownGene', 'axes'],
      violin: ['shownGene'],
      markerHeatmap: ['selectedGenes', 'groupedTracks'],
      DotPlot: ['selectedGenes'],
    };

    const areAllValuesTheSame = Object.keys(initialConfig).every((key) => {
      // By pass plot data because we want to compare settings not data
      if (key === 'plotData') return true;
      if (ignoredFields[plotType]?.includes(key)) return true;
      if (typeof currentConfig[key] === 'object') {
        return JSON.stringify(currentConfig[key]) === JSON.stringify(initialConfig[key]);
      }

      return currentConfig[key] === initialConfig[key];
    });

    return areAllValuesTheSame;
  };

  useEffect(() => {
    if (!config) {
      return;
    }

    if (_.isEqualWith(config, initialPlotConfigStates[plotType], checkConfigEquality)) {
      setEnableReset(false);
      return;
    }

    setEnableReset(true);
  }, [config]);

  const onClickReset = (event) => {
    event.stopPropagation();
    dispatch({
      type: LOAD_CONFIG,
      payload: {
        experimentId,
        plotUuid,
        plotType,
        config: _.cloneDeep(initialPlotConfigStates[plotType]),
      },
    });
    dispatch(savePlotConfig(experimentId, plotUuid));
    setEnableReset(false);
  };

  const RESET_BUTTON = {
    padding: '0 0.8em',
    backgroundColor: '#137cbd',
    color: 'white',
    borderRadius: '4px',
    height: '1.8em',
    margin: '0.2em 0.25em 0 0',
    border: 0,
  };

  return (
    <Button
      key='reset'
      className='bp3-button'
      style={RESET_BUTTON}
      onClick={onClickReset}
      disabled={!enableReset}
    >
      Reset
    </Button>
  );
};

ResetButton.propTypes = {
  experimentId: PropTypes.string.isRequired,
  plotUuid: PropTypes.string.isRequired,
  plotType: PropTypes.string.isRequired,
};
export default ResetButton;

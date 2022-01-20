import _ from 'lodash';
import React, {
  useEffect, useCallback, useState,
} from 'react';
import useSWR from 'swr';
import { Button, Skeleton } from 'antd';
import { useSelector, useDispatch } from 'react-redux';
import { useRouter } from 'next/router';
import PropTypes from 'prop-types';
import { useBeforeunload } from 'react-beforeunload';
import Header from 'components/Header';
import { savePlotConfig } from '../../redux/actions/componentConfig/index';
import { getFromApiExpectOK } from '../../utils/getDataExpectOK';
import { LOAD_CONFIG } from '../../redux/actionTypes/componentConfig';
import { initialPlotConfigStates } from '../../redux/reducers/componentConfig/initialState';

const PlotHeader = ({ title, experimentId, plotUuid }) => {
  const dispatch = useDispatch();
  const saved = !useSelector((state) => state.componentConfig[plotUuid]?.outstandingChanges);
  const router = useRouter();
  const plotType = useSelector((state) => state.componentConfig[plotUuid]?.plotType);
  const { config } = useSelector((state) => state.componentConfig[plotUuid]) || {};
  const debounceSave = useCallback(
    _.debounce(() => dispatch(savePlotConfig(experimentId, plotUuid)), 2000), [],
  );
  const [resetDisabled, setResetDisabled] = useState(true);

  useBeforeunload((e) => {
    if (!saved) {
      e.preventDefault();
    }
  });

  const checkIfDefaultConfig = (objValue, otherValue) => {
    const ignoredFields = {
      // config fields that are set dynamically on component render
      // should not be compared to their initial values
      frequency: ['proportionGrouping', 'xAxisGrouping'],
      embeddingContinuous: ['shownGene'],
      violin: ['shownGene'],
      markerHeatmap: ['selectedGenes'],
    };

    const currentKey = Object.keys(config).find((key) => config[key] === otherValue || false);
    if (ignoredFields[plotType]?.includes(currentKey)) {
      return true;
    }
  };

  useEffect(() => {
    if (!config) {
      return;
    }
    if (!saved) {
      debounceSave();
    }
    if (!_.isEqualWith(initialPlotConfigStates[plotType], config, checkIfDefaultConfig)) {
      setResetDisabled(false);
    } else {
      setResetDisabled(true);
    }
  }, [config]);

  useEffect(() => {
    const showPopupWhenUnsaved = (url) => {
      // Only handle if we are navigating away.

      if (router.asPath === url || saved) {
        return;
      }

      // Show a confirmation dialog. Prevent moving away if the user decides not to.
      // eslint-disable-next-line no-alert
      if (
        // eslint-disable-next-line no-alert
        !window.confirm(
          'You have unsaved changes. Do you wish to save?',
        )
      ) {
        router.events.emit('routeChangeError');
        // Following is a hack-ish solution to abort a Next.js route change
        // as there's currently no official API to do so
        // See https://github.com/zeit/next.js/issues/2476#issuecomment-573460710
        // eslint-disable-next-line no-throw-literal
        throw `Route change to "${url}" was aborted (this error can be safely ignored). See https://github.com/zeit/next.js/issues/2476.`;
      } else {
        // if we click 'ok' the config is changed
        dispatch(savePlotConfig(experimentId, plotUuid));
      }
    };
    if (!router) {
      return;
    }
    router.events.on('routeChangeStart', showPopupWhenUnsaved);

    return () => {
      router.events.off('routeChangeStart', showPopupWhenUnsaved);
    };
  }, [router?.asPath, router?.events, saved]);

  const { data } = useSWR(
    `/v1/experiments/${experimentId}`,
    getFromApiExpectOK,
  );

  if (!data || !config) {
    return <Skeleton active paragraph={{ rows: 1 }} title={{ width: 500 }} />;
  }

  const onClickReset = () => {
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
    setResetDisabled(true);
  };
  return (
    <Header
      title={title}
      extra={(
        <Button
          key='reset'
          type='primary'
          onClick={onClickReset}
          disabled={resetDisabled}
        >
          Reset
        </Button>
      )}
    />
  );
};

PlotHeader.propTypes = {
  title: PropTypes.string.isRequired,
  experimentId: PropTypes.string.isRequired,
  plotUuid: PropTypes.string.isRequired,
};

export default React.memo(PlotHeader);

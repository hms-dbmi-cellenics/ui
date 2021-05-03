import _ from 'lodash';
import React, {
  useEffect, useCallback, useState,
} from 'react';
import useSWR from 'swr';
import {
  PageHeader, Row, Col, Button, Skeleton, Space,
} from 'antd';
import { useSelector, useDispatch } from 'react-redux';
import { useRouter } from 'next/router';
import PropTypes from 'prop-types';
import moment from 'moment';
import { useBeforeunload } from 'react-beforeunload';
import FeedbackButton from '../FeedbackButton';
import { savePlotConfig } from '../../redux/actions/componentConfig/index';
import itemRender from '../../utils/renderBreadcrumbLinks';
import getFromApiExpectOK from '../../utils/getFromApiExpectOK';
import { LOAD_CONFIG } from '../../redux/actionTypes/componentConfig';
import { initialPlotConfigStates } from '../../redux/reducers/componentConfig/initialState';

const Header = (props) => {
  const {
    experimentId, plotUuid, finalRoute, testing,
  } = props;

  const dispatch = useDispatch();
  const saved = !useSelector((state) => state.componentConfig[plotUuid]?.outstandingChanges);
  const lastUpdated = useSelector((state) => state.componentConfig[plotUuid]?.lastUpdated);
  const router = useRouter();
  const plotType = useSelector((state) => state.componentConfig[plotUuid]?.plotType);
  const { config } = useSelector((state) => state.componentConfig[plotUuid]) || {};
  const debounceSave = useCallback(_.debounce(() => dispatch(savePlotConfig(experimentId, plotUuid)), 2000), []);
  const [resetDisabled, setResetDisabled] = useState(true);

  useBeforeunload((e) => {
    if (!saved) {
      e.preventDefault();
    }
  });

  const checkIfDefaultConfig = (objValue, otherValue) => {
    const ignoredFields = {
      // config fields that are set dynamically on component render should not be compared to their initial values
      frequency: ['proportionGrouping', 'xAxisGrouping'],
      embeddingContinuous: ['shownGene'],
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
  if ((!data && !testing) || !config) {
    return <Skeleton active paragraph={{ rows: 1 }} title={{ width: 500 }} />;
  }

  const baseRoutes = [
    {
      path: 'experiments',
      breadcrumbName: 'Analyses',
    },
    {
      path: '[experimentId]',
      params: data?.experimentId,
      breadcrumbName: data?.experimentName,
    },
    {
      path: 'plots-and-tables',
      breadcrumbName: 'Plots and Tables',
    },
    finalRoute,
  ];

  const saveString = lastUpdated
    ? moment(lastUpdated)
      .fromNow()
      .toLowerCase()
    : 'never';

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

    <Row>
      <Col span={16}>
        <PageHeader
          style={{ width: '100%', paddingTop: '12px', paddingBottom: '6px' }}
          title='Edit collection'
          breadcrumb={{ routes: baseRoutes, itemRender }}
          subTitle={`Last saved: ${saveString}`}
          extra={(
            <Space>
              <FeedbackButton key='feedback' />
              <Button
                id='resetButton'
                key='reset'
                type='primary'
                onClick={onClickReset}
                disabled={resetDisabled}
              >
                Reset
              </Button>
            </Space>
          )}
        />
      </Col>
    </Row>
  );
};
Header.defaultProps = {
  testing: false,
};

Header.propTypes = {
  testing: PropTypes.bool,
  finalRoute: PropTypes.object.isRequired,
  experimentId: PropTypes.string.isRequired,
  plotUuid: PropTypes.string.isRequired,
};

export default React.memo(Header);

import React, { useState, useEffect, useRef } from 'react';
import useSWR from 'swr';
import {
  PageHeader, Row, Col, Button, Skeleton,
} from 'antd';
import { useSelector, useDispatch } from 'react-redux';
import PropTypes from 'prop-types';
import moment from 'moment';
import dynamic from 'next/dynamic';
import { useBeforeunload } from 'react-beforeunload';
import { savePlotConfig } from '../../../../../redux/actions/plots/index';
import itemRender from '../../../../../utils/renderBreadcrumbLinks';
import getApiEndpoint from '../../../../../utils/apiEndpoint';
import { getFromApiExpectOK } from '../../../../../utils/cacheRequest';

const KeyboardEventHandler = dynamic(
  () => import('react-keyboard-event-handler'),
  { ssr: false },
);

const Header = (props) => {
  const {
    experimentId, plotUuid, finalRoute,
  } = props;

  const dispatch = useDispatch();
  const [disabled, setDisabled] = useState(true);
  const lastUpdated = useSelector((state) => state.plots[plotUuid].lastUpdated);
  const config = useSelector((state) => state.plots[plotUuid].config);
  const pastInitialRender = useRef(false);

  // Add prompt to save if modified since last save if changes happened.
  useBeforeunload((e) => {
    if (!disabled) {
      e.preventDefault();
    }
  });

  // Re-enable save button on config change. Skip initial render (when the config)
  // loads for the first time, so we default to a disabled state.
  useEffect(() => {
    if (pastInitialRender.current) {
      setDisabled(false);
    } else {
      pastInitialRender.current = true;
    }
  }, [config]);

  const { data } = useSWR(`${getApiEndpoint()}/v1/experiments/${experimentId}`, getFromApiExpectOK);

  if (!data) {
    return <Skeleton.Input style={{ width: 200 }} active />;
  }

  const baseRoutes = [
    {
      path: 'experiments',
      breadcrumbName: 'Experiments',
    },
    {
      path: '[experimentId]',
      params: data.experimentId,
      breadcrumbName: data.experimentName,
    },
    {
      path: 'plots-and-tables',
      breadcrumbName: 'Plots and tables',
    },
    finalRoute,
  ];

  const saveString = (lastUpdated) ? moment(lastUpdated).fromNow().toLowerCase() : 'never';

  const onClickSave = () => {
    if (disabled) { return; }

    dispatch(savePlotConfig(experimentId, plotUuid));
    setDisabled(true);
  };

  return (
    <Row>
      <Col>
        <KeyboardEventHandler
          handleFocusableElements
          handleKeys={['ctrl+s', 'meta+s']}
          onKeyEvent={(key, e) => {
            onClickSave();
            e.preventDefault();
          }}
        />
        <PageHeader
          style={{ width: '100%', paddingTop: '12px', paddingBottom: '6px' }}
          title='Edit collection'
          breadcrumb={{ routes: baseRoutes, itemRender }}
          subTitle={`Last saved: ${saveString}`}
          extra={[
            <Button
              key='save'
              type='primary'
              disabled={disabled}
              onClick={onClickSave}
            >
              Save
            </Button>,
          ]}
        />
      </Col>
    </Row>
  );
};

Header.propTypes = {
  finalRoute: PropTypes.object.isRequired,
  experimentId: PropTypes.string.isRequired,
  plotUuid: PropTypes.string.isRequired,

};

export default Header;

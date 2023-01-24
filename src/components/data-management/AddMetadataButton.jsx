import React, { useEffect, useState } from 'react';
import _ from 'lodash';
import {
  Menu, Tooltip, Dropdown, Button,
} from 'antd';
import PropTypes from 'prop-types';

import { useSelector, useDispatch } from 'react-redux';
import { saveAs } from 'file-saver';

import downloadTypes from 'utils/data-management/downloadTypes';
import fetchAPI from 'utils/http/fetchAPI';
import endUserMessages from 'utils/endUserMessages';
import downloadFromUrl from 'utils/downloadFromUrl';
import pipelineStatus from 'utils/pipelineStatusValues';
import { exportQCParameters, filterQCParameters } from 'utils/data-management/exportQCParameters';

import { loadBackendStatus } from 'redux/actions/backendStatus/index';

import { getBackendStatus } from 'redux/selectors';
import handleError from 'utils/http/handleError';

const AddMetadataButton = ({ samplesTableRef }) => {
  const dispatch = useDispatch();
  const experiments = useSelector((state) => state.experiments);
  const { activeExperimentId } = experiments.meta;
  const activeExperiment = experiments[activeExperimentId];

  return (
    <Dropdown
      overlay={() => (
        <Menu>
          <Menu.Item
            key='add-metadata-column'
            onClick={() => samplesTableRef.current.createMetadataColumn()}
          >
            Create New Metadata Column
          </Menu.Item>
          <Menu.Item
            key='upload-metadata-file'
            onClick={() => {

            }}
          >
            Upload metadata file
          </Menu.Item>
        </Menu>
      )}
      trigger={['click']}
      placement='bottomRight'
      disabled={activeExperiment.sampleIds?.length === 0}
    >
      <Button>
        Add Metadata
      </Button>
    </Dropdown>

  );
};

AddMetadataButton.propTypes = {
  samplesTableRef: PropTypes.shape({ current: PropTypes.any }).isRequired,
};

export default AddMetadataButton;

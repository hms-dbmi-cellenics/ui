import React, { useEffect, useRef, useState } from 'react';
import {
  Space, Typography, Progress, Tooltip, Button,
} from 'antd';
import {
  UploadOutlined,
} from '@ant-design/icons';
import { useDispatch, useSelector } from 'react-redux';
import PropTypes from 'prop-types';
import styled from 'styled-components';

import {
  deleteSamples, updateSample,
} from 'redux/actions/samples';


import integrationTestConstants from 'utils/integrationTestConstants';
import UploadStatus, { messageForStatus } from 'utils/upload/UploadStatus';

import EditableField from 'components/EditableField';
import UploadDetailsModal from 'components/data-management/UploadDetailsModal';
import SpeciesSelector from 'components/data-management/SpeciesSelector';

const { Text } = Typography;

const UploadCellStyle = styled.div`
  whiteSpace: 'nowrap';
  height: '35px';
  minWidth: '90px';
  display: 'flex';
  justifyContent: 'center';
  alignItems: 'center';
`;

const UploadCell = (props) => {
  const { columnId, tableCellData } = props;
  const {
    sampleUuid,
    fileName,
  } = tableCellData;
  const file = useSelector((state) => state.samples[sampleUuid].files[fileName]);

  const { progressEmitter = null, status = null } = file?.upload ?? {};
  const [uploadDetailsModalVisible, setUploadDetailsModalVisible] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(null);

  const uploadDetailsModalDataRef = useRef(null);

  useEffect(() => {
    if (status === UploadStatus.UPLOADING) {
      // Disabled because eslint is dumb and doesn't recognize function calls if they have "?" before
      // eslint-disable-next-line no-unused-expressions
      progressEmitter?.on(`progress${sampleUuid}`, setUploadProgress);
    }
  }, [progressEmitter]);

  const showDetails = () => {
    uploadDetailsModalDataRef.current = {
      sampleUuid,
      fileCategory: columnId,
      file,
    };
    setUploadDetailsModalVisible(true);
  };

  const render = () => {
    if (status === UploadStatus.UPLOADED) {
      return (
        <UploadCellStyle
          className='hoverSelectCursor'
        >
          <Space
            onClick={showDetails}
            onKeyDown={showDetails}
          >
            <Text type='success'>{messageForStatus(status)}</Text>
          </Space>
        </UploadCellStyle>
      );
    }

    if (
      [
        UploadStatus.UPLOADING,
        UploadStatus.COMPRESSING,
      ].includes(status)
    ) {
      return (
        <UploadCellStyle>
          <Space direction='vertical' size={[1, 1]}>
            <Text type='warning'>{`${messageForStatus(status)}`}</Text>
            {status === UploadStatus.UPLOADING && uploadProgress ? (<Progress percent={uploadProgress} size='small' />) : <div />}
          </Space>
        </UploadCellStyle>
      );
    }

    if (status === UploadStatus.UPLOAD_ERROR) {
      return (
        <UploadCellStyle
          className='hoverSelectCursor'
          onClick={showDetails}
          onKeyDown={showDetails}
        >
          <Space>
            <Text type='danger'>{messageForStatus(status)}</Text>
          </Space>
        </UploadCellStyle>
      );
    }
    if (
      [
        UploadStatus.FILE_NOT_FOUND,
        UploadStatus.FILE_READ_ABORTED,
        UploadStatus.FILE_READ_ERROR,
      ].includes(status)
    ) {
      return (
        <UploadCellStyle>
          <Space>
            <Text type='danger'>{messageForStatus(status)}</Text>
            <Tooltip placement='bottom' title='Upload missing' mouseLeaveDelay={0}>
              <Button
                size='large'
                shape='link'
                icon={<UploadOutlined />}
                onClick={showDetails}
              />
            </Tooltip>
          </Space>
        </UploadCellStyle>
      );
    }
  };
  return (
    <>
      {render()}
      <UploadDetailsModal
        uploadDetailsModalDataRef={uploadDetailsModalDataRef}
        visible={uploadDetailsModalVisible}
        onCancel={() => setUploadDetailsModalVisible(false)}
      />
    </>
  );
};

UploadCell.propTypes = {
  columnId: PropTypes.string.isRequired,
  tableCellData: PropTypes.object.isRequired,
};

const EditableFieldCell = (props) => {
  const {
    cellText,
    dataIndex, rowIdx, onAfterSubmit,
  } = props;
  return (
    <div key={`cell-${dataIndex}-${rowIdx}`} style={{ whiteSpace: 'nowrap' }}>
      <Space>
        <EditableField
          deleteEnabled={false}
          value={cellText}
          onAfterSubmit={(value) => onAfterSubmit(value)}
        />
      </Space>
    </div>
  );
};

EditableFieldCell.defaultProps = {
  cellText: 'N.A',
};

EditableFieldCell.propTypes = {
  cellText: PropTypes.string,
  dataIndex: PropTypes.string.isRequired,
  rowIdx: PropTypes.number.isRequired,
  onAfterSubmit: PropTypes.func.isRequired,
};

const SampleNameCell = (props) => {
  const { cellInfo } = props;
  const { text, record, idx } = cellInfo;
  const dispatch = useDispatch();
  return (
    <Text className={integrationTestConstants.classes.SAMPLES_TABLE_NAME_CELL} strong key={`sample-cell-${idx}`}>
      <EditableField
        deleteEnabled
        value={text}
        onAfterSubmit={(name) => dispatch(updateSample(record.uuid, { name }))}
        onDelete={() => dispatch(deleteSamples([record.uuid]))}
      />
    </Text>
  );
};
SampleNameCell.propTypes = {
  cellInfo: PropTypes.object.isRequired,
};

const SpeciesCell = (props) => {
  const { organismId, recordUuid } = props;
  const dispatch = useDispatch();

  return (
    <SpeciesSelector
      value={organismId}
      onChange={(value) => {
        dispatch(updateSample(recordUuid, { species: value }));
      }}
    />
  );
};

SpeciesCell.propTypes = {
  organismId: PropTypes.string.isRequired,
  recordUuid: PropTypes.string.isRequired,
};

export {
  UploadCell, EditableFieldCell, SampleNameCell, SpeciesCell,
};

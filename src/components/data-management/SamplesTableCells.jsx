import React, { useEffect, useState } from 'react';
import {
  Space, Typography, Progress, Tooltip, Button,
} from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import { useDispatch, useSelector } from 'react-redux';
import PropTypes from 'prop-types';

import { deleteSamples, updateSample } from 'redux/actions/samples';
import integrationTestConstants from 'utils/integrationTestConstants';

import UploadStatus, { messageForStatus } from 'utils/upload/UploadStatus';
import EditableField from 'components/EditableField';
import UploadDetailsModal from 'components/data-management/UploadDetailsModal';

import styles from 'components/data-management/SamplesTableCells.module.css';

const { Text } = Typography;

const UploadDivStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  verticalAlign: 'middle',
};

const UploadCell = (props) => {
  const { columnId, sampleUuid } = props;

  const file = useSelector((state) => state.samples[sampleUuid]?.files[columnId]);

  const [uploadDetailsModalVisible, setUploadDetailsModalVisible] = useState(false);
  const [uploadDetailsModalData, setUploadDetailsModalData] = useState(false);

  useEffect(() => {
    setUploadDetailsModalData(file);
  }, [file, file?.upload]);

  const { progress = null, status = null } = uploadDetailsModalData?.upload
    ?? { status: UploadStatus.FILE_NOT_FOUND };

  const showDetails = () => {
    setUploadDetailsModalData({
      sampleUuid,
      fileCategory: columnId,
      ...uploadDetailsModalData,
    });
    setUploadDetailsModalVisible(true);
  };

  const render = () => {
    if (status === UploadStatus.UPLOADED) {
      return (
        <div
          className={styles.hoverSelectCursor}
          onClick={showDetails}
          onKeyDown={showDetails}
          style={{ ...UploadDivStyle, flexDirection: 'column' }}
        >
          <Text type='success'>{messageForStatus(status)}</Text>
        </div>
      );
    }

    if (
      [
        UploadStatus.UPLOADING,
        UploadStatus.COMPRESSING,
      ].includes(status)
    ) {
      return (
        <div
          style={{
            ...UploadDivStyle,
            flexDirection: 'column',
          }}
        >
          <Text type='warning'>{`${messageForStatus(status)}`}</Text>
          {progress ? (<Progress style={{ marginLeft: '10%', width: '50%' }} percent={progress} size='small' />) : <div />}
        </div>
      );
    }

    if (status === UploadStatus.UPLOAD_ERROR) {
      return (
        <div
          className={styles.hoverSelectCursor}
          style={{ ...UploadDivStyle, flexDirection: 'column' }}
          onClick={showDetails}
          onKeyDown={showDetails}
        >
          <Text type='danger'>{messageForStatus(status)}</Text>
        </div>
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
        <div style={UploadDivStyle}>
          <Text type='danger'>{messageForStatus(status)}</Text>
          <Tooltip placement='bottom' title='Upload missing' mouseLeaveDelay={0}>
            <Button
              size='large'
              shape='link'
              icon={<UploadOutlined />}
              onClick={showDetails}
            />
          </Tooltip>
        </div>
      );
    }
  };
  return (
    <>
      <center>
        {render()}
      </center>
      <UploadDetailsModal
        file={uploadDetailsModalData}
        visible={uploadDetailsModalVisible}
        onCancel={() => setUploadDetailsModalVisible(false)}
      />
    </>
  );
};

UploadCell.propTypes = {
  columnId: PropTypes.string.isRequired,
  sampleUuid: PropTypes.string.isRequired,
};

const EditableFieldCell = (props) => {
  const {
    sampleUuid,
    dataIndex: trackKey,
    rowIdx,
    onAfterSubmit,
  } = props;

  const value = useSelector((state) => state.samples[sampleUuid]?.metadata[trackKey]);

  return (
    <div key={`cell-${trackKey}-${rowIdx}`} style={{ whiteSpace: 'nowrap' }}>
      <Space>
        <EditableField
          deleteEnabled={false}
          value={value}
          onAfterSubmit={(newValue) => onAfterSubmit(newValue)}
          formatter={(rawValue) => rawValue.trim()}
        />
      </Space>
    </div>
  );
};

EditableFieldCell.propTypes = {
  sampleUuid: PropTypes.string.isRequired,
  dataIndex: PropTypes.string.isRequired,
  rowIdx: PropTypes.number.isRequired,
  onAfterSubmit: PropTypes.func.isRequired,
};

const SampleNameCell = (props) => {
  const { cellInfo } = props;
  const { record: { uuid: sampleId }, idx } = cellInfo;

  const name = useSelector((state) => state.samples[sampleId]?.name);

  const dispatch = useDispatch();

  return (
    <Text className={integrationTestConstants.classes.SAMPLES_TABLE_NAME_CELL} strong key={`sample-cell-${idx}`}>
      <EditableField
        deleteEnabled
        value={name}
        onAfterSubmit={(newName) => dispatch(updateSample(sampleId, { name: newName }))}
        onDelete={() => dispatch(deleteSamples([sampleId]))}
      />
    </Text>
  );
};
SampleNameCell.propTypes = {
  cellInfo: PropTypes.object.isRequired,
};

export {
  UploadCell, EditableFieldCell, SampleNameCell,
};

/* eslint-disable jsx-quotes */
import React, { useState, useEffect } from 'react';
import {
  Button, Space, Typography,
} from 'antd';

import PropTypes from 'prop-types';
import { useDispatch, useSelector } from 'react-redux';
import { CheckCircleOutlined } from '@ant-design/icons';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import { changeGeneSelection } from '../../../redux/actions/genes';
import GeneSelectionStatus from '../../../redux/actions/genes/geneSelectionStatus';
import LaunchPathwayAnalysisModal from '../differential-expression-tool/LaunchPathwayAnalysisModal';

const { Text } = Typography;

const SelectionActions = (props) => {
  const {
    experimentId, showCSV, onExportCSV, onListSelected,
  } = props;
  const dispatch = useDispatch();

  const selectedGenes = useSelector((state) => state.genes.selected);
  const [copied, setCopied] = useState(false);
  const [listed, setListed] = useState(false);
  const [pathAnalysisModal, setpathAnalysisModal] = useState(false);

  const clearAll = () => {
    dispatch(changeGeneSelection(experimentId, selectedGenes, GeneSelectionStatus.deselect));
  };

  useEffect(() => {
    setCopied(false);
  }, [selectedGenes]);

  useEffect(() => {
    if (!copied) return;

    const resetCopyButton = setInterval(() => {
      setCopied(false);
    }, 5000);

    return () => {
      clearInterval(resetCopyButton);
    };
  }, [copied]);

  const renderCopyClipboard = () => {
    if (copied) {
      return (
        <Button type='link' size='small' disabled>
          <span>
            <CheckCircleOutlined />
            &nbsp;
            Copied
          </span>
        </Button>
      );
    }

    return (
      <CopyToClipboard
        options={{ format: 'text/plain' }}
        text={selectedGenes.join('\n')}
        onCopy={
          () => {
            setCopied(true);
          }
        }
      >
        <Button type='link' size='small'>Copy</Button>
      </CopyToClipboard>
    );
  };
  return (
    <Space style={{ float: 'left' }}>
      {selectedGenes.length !== 0 ? (
        <>
          <Text type='secondary'>
            {`${selectedGenes.length} gene${selectedGenes.length === 1 ? '' : 's'} selected`}
          </Text>
          <Button type='link' size='small' onClick={clearAll}>Clear</Button>
          {renderCopyClipboard()}
          <Button
            type='link'
            size='small'
            onClick={() => { setListed(!listed); onListSelected(!listed); }}
          >
            {listed ? 'Hide' : 'List'}
          </Button>
        </>
      ) : <></>}

      {
        showCSV ? (
          <>
            <Button type='link' size='small' onClick={onExportCSV}>Export as CSV</Button>
            <Button type='link' size='small' onClick={() => setpathAnalysisModal(!pathAnalysisModal)}>Pathway analysis</Button>
          </>
        ) : <></>
      }
      {pathAnalysisModal && (<LaunchPathwayAnalysisModal onCancel={() => setpathAnalysisModal(false)} />)}
    </Space>
  );
};

SelectionActions.defaultProps = {
  onExportCSV: () => null,
  onListSelected: () => null,
};

SelectionActions.propTypes = {
  experimentId: PropTypes.string.isRequired,
  showCSV: PropTypes.bool.isRequired,
  onExportCSV: PropTypes.func,
  onListSelected: PropTypes.func,
};

export default SelectionActions;

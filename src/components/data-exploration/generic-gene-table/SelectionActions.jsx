/* eslint-disable jsx-quotes */
import React, { useState, useEffect } from 'react';
import {
  Button, Typography, Row, Divider, Tooltip,
} from 'antd';

import PropTypes from 'prop-types';
import { useDispatch, useSelector } from 'react-redux';
import { CheckCircleOutlined } from '@ant-design/icons';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import { changeGeneSelection } from 'redux/actions/genes';
import GeneSelectionStatus from 'redux/actions/genes/geneSelectionStatus';
import ComponentActions from 'components/data-exploration/generic-gene-table/ComponentActions';

import { COMPONENT_TYPE } from 'components/data-exploration/heatmap/HeatmapPlot';
import ExpresssionCellSetModal from 'components/data-exploration/generic-gene-table/ExpressionCellSetModal';

const { Text } = Typography;

const SelectionActions = (props) => {
  const {
    experimentId, onListSelected, extraOptions,
  } = props;
  const dispatch = useDispatch();

  const selectedGenes = useSelector((state) => state.genes.selected);
  const [copied, setCopied] = useState(false);
  const [listed, setListed] = useState(false);
  const [expressionCellSetModalVisible, setExpressionCellSetModalVisible] = useState(false);

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
    <Row style={{ float: 'left', paddingRight: '50px' }}>
      {extraOptions ?? <></>}

      {extraOptions && selectedGenes.length > 0 && (
        <Divider style={{ height: '1px', marginTop: '5px', marginBottom: '5px' }} />
      )}

      {selectedGenes.length > 0 ? (
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
          <ComponentActions
            name='Heatmap'
            experimentId={experimentId}
            componentType={COMPONENT_TYPE}
            useDownsampledExpression
          />
          <Button
            type='link'
            size='small'
            onClick={() => setExpressionCellSetModalVisible(!expressionCellSetModalVisible)}
          >
            Cellset
          </Button>
          {
            expressionCellSetModalVisible && (
              <ExpresssionCellSetModal
                onCancel={() => setExpressionCellSetModalVisible(false)}
              />
            )
          }
        </>
      ) : <></>}
    </Row>
  );
};

SelectionActions.defaultProps = {
  onListSelected: () => null,
  extraOptions: null,
};

SelectionActions.propTypes = {
  experimentId: PropTypes.string.isRequired,
  extraOptions: PropTypes.node,
  onListSelected: PropTypes.func,
};

export default SelectionActions;

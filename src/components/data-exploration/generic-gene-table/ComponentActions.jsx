import React from 'react';
import PropTypes from 'prop-types';
import {
  Menu, Dropdown, Button,
} from 'antd';
import { useSelector, useDispatch } from 'react-redux';

import _ from 'lodash';
import { PlusOutlined, RedoOutlined, MinusOutlined } from '@ant-design/icons';
import { loadDownsampledGeneExpression, loadGeneExpression } from 'redux/actions/genes';

const geneOperations = {
  ADD: 'add',
  REMOVE: 'remove',
  OVERWRITE: 'overwrite',
};

const ComponentActions = (props) => {
  const {
    experimentId, name, componentType, useDownsampledExpression,
  } = props;

  const dispatch = useDispatch();
  const selectedGenes = useSelector((state) => state.genes.selected);
  const displayedGenes = useSelector((state) => state.genes.expression?.views[componentType]?.data);

  const performGeneOperation = (genesOperation) => {
    let newGenes = _.cloneDeep(selectedGenes);

    if (genesOperation === geneOperations.ADD && displayedGenes) {
      newGenes = Array.from(new Set(displayedGenes.concat(selectedGenes)));
    }
    if (genesOperation === geneOperations.REMOVE && displayedGenes) {
      newGenes = displayedGenes.filter((gene) => !selectedGenes.includes(gene));
    }

    if (useDownsampledExpression) {
      dispatch(loadDownsampledGeneExpression(experimentId, newGenes, componentType));
    } else {
      dispatch(loadGeneExpression(experimentId, newGenes, componentType));
    }
  };

  const menu = (
    <Menu size='small'>
      <Menu.Item key='0' icon={<PlusOutlined />} onClick={() => performGeneOperation(geneOperations.ADD)}>
        Add
      </Menu.Item>
      <Menu.Item key='1' icon={<MinusOutlined />} onClick={() => performGeneOperation(geneOperations.REMOVE)}>
        Remove
      </Menu.Item>
      <Menu.Item key='2' icon={<RedoOutlined />} onClick={() => performGeneOperation(geneOperations.OVERWRITE)}>
        Overwrite
      </Menu.Item>
    </Menu>
  );

  if (selectedGenes.length === 0) {
    return (<></>);
  }

  return (
    <Dropdown arrow type='link' size='small' overlay={menu} trigger={['click']}>
      <Button type='link' size='small'>
        {name}
      </Button>
    </Dropdown>
  );
};

ComponentActions.defaultProps = {
};

ComponentActions.propTypes = {
  experimentId: PropTypes.string.isRequired,
  componentType: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  useDownsampledExpression: PropTypes.bool.isRequired,
};

export default ComponentActions;

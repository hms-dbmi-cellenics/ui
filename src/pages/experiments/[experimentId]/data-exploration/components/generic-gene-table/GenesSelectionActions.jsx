import React from 'react';
import PropTypes from 'prop-types';
import {
  Menu, Dropdown, Button,
} from 'antd';
import { useSelector, useDispatch } from 'react-redux';

import _ from 'lodash';
import { PlusOutlined, RedoOutlined, MinusOutlined } from '@ant-design/icons';
import { changeExpressionView } from '../../../../../../redux/actions/genes';
import { geneOperations } from '../../../../../../utils/geneTable/geneOperations';

const GenesSelectionActions = (props) => {
  const { experimentId, genesSelectionListener } = props;
  const dispatch = useDispatch();
  const selectedGenes = useSelector((state) => state.genes.selected);

  const performGeneOperation = (geneOperation) => {
    const newGenes = _.cloneDeep(selectedGenes);
    console.log('lalalalalalalala ', geneOperation, newGenes);
    dispatch(changeExpressionView(experimentId, newGenes, genesSelectionListener, geneOperation));
  };

  const menu = (
    <Menu size='small'>
      <Menu.Item key='0' onClick={() => performGeneOperation(geneOperations.ADD)}>
        <PlusOutlined />
        Add
      </Menu.Item>
      <Menu.Item key='2' onClick={() => performGeneOperation(geneOperations.REMOVE)}>
        <MinusOutlined />
        Remove
      </Menu.Item>
      <Menu.Item key='1' onClick={() => performGeneOperation(geneOperations.OVERWRITE)}>
        <RedoOutlined />
        Overwrite
      </Menu.Item>
    </Menu>
  );

  if (selectedGenes.length === 0) {
    return (<></>);
  }

  return (
    <Dropdown type='link' size='small' overlay={menu} trigger='click'>
      <Button type='link' size='small'>Heatmap ...</Button>
    </Dropdown>
  );
};

GenesSelectionActions.defaultProps = {
};

GenesSelectionActions.propTypes = {
  experimentId: PropTypes.string.isRequired,
  genesSelectionListener: PropTypes.string.isRequired,
};

export default GenesSelectionActions;

import React from 'react';
import PropTypes from 'prop-types';
import {
  Menu, Dropdown, Button,
} from 'antd';
import { useSelector, useDispatch } from 'react-redux';

import _ from 'lodash';
import { PlusOutlined } from '@ant-design/icons';
import { changeExpressionView } from '../../../../../../redux/actions/genes';

const GenesSelectionActions = (props) => {
  const { experimentId, genesSelectionListener } = props;
  const dispatch = useDispatch();
  const selectedGenes = useSelector((state) => state.genes.selected);

  const add = () => {
    const newGenes = _.cloneDeep(selectedGenes);
    console.log('***** ', genesSelectionListener);
    dispatch(changeExpressionView(experimentId, newGenes, genesSelectionListener, false));
  };

  const overwrite = () => {
    const newGenes = _.cloneDeep(selectedGenes);
    dispatch(changeExpressionView(experimentId, newGenes, genesSelectionListener, true));
  };

  const remove = () => {
    dispatch(changeExpressionView(experimentId, [], genesSelectionListener, true));
  };

  const menu = (
    <Menu size='small'>
      <Menu.Item key='0' onClick={add}>
        <PlusOutlined />
        Add
      </Menu.Item>
      <Menu.Item key='1' onClick={overwrite}>
        Overwrite
      </Menu.Item>
      <Menu.Item key='2' onClick={remove}>
        Remove
      </Menu.Item>
    </Menu>
  );

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

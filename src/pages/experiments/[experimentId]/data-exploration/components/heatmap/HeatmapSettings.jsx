import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import _ from 'lodash';

import {
  SettingOutlined,
} from '@ant-design/icons';
import {
  Button, Dropdown, Menu, Tooltip, Radio, Checkbox,
} from 'antd';

const { SubMenu } = Menu;

const HeatmapSettings = () => {
  const cellSets = useSelector((state) => state.cellSets);

  const [expressionValue, setExpressionValue] = useState('raw');
  const [showLegend, setShowLegend] = useState(true);
  const [groupBy, setGroupBy] = useState('louvain');
  const [selectedLabelOptions, setSelectedLabelOptions] = useState([]);

  const changeExpression = (e) => {
    setExpressionValue(e.target.value);
  };

  const changelegend = (e) => {
    setShowLegend(e.target.value);
  };

  const changeGroupBy = (e) => {
    setGroupBy(e.target.value);
  };

  const checkBoxChecked = (e, labelName) => {
    e.stopPropagation();
    const index = selectedLabelOptions.indexOf(labelName);
    if (index === -1) {
      setSelectedLabelOptions([...selectedLabelOptions, labelName]);
    } else {
      const newSelectedLabelOptions = _.cloneDeep(selectedLabelOptions);
      newSelectedLabelOptions.splice(index, 1);
      setSelectedLabelOptions(newSelectedLabelOptions);
    }
  };

  const getCellSets = (category) => {
    if (!cellSets || cellSets.loading) {
      return [];
    }
    const options = cellSets.hierarchy.map(({ key }) => ({ value: key }));
    return options.filter((element) => (
      category.includes(cellSets.properties[element.value].type)
    ));
  };

  const radioStyle = {
    display: 'block',
    padding: '5px',
    marginLeft: '0px',
  };

  const menu = (
    <Menu size='small'>
      <SubMenu key='expression-values' title='Expression values'>
        <Radio.Group value={expressionValue} onChange={changeExpression}>
          <Radio key='1' style={radioStyle} value='raw'>Raw values</Radio>
          <Radio key='2' style={radioStyle} value='z-score'>z-score</Radio>
        </Radio.Group>
      </SubMenu>
      <SubMenu key='metadata-label' title='Metadata label'>
        <Checkbox.Group>
          {getCellSets(['metadataCategorical']).map((element) => (
            <Checkbox style={radioStyle} onClick={(e) => checkBoxChecked(e, element.value)}>{element.value}</Checkbox>
          ))}
        </Checkbox.Group>
      </SubMenu>
      <SubMenu key='legend' title='Legend'>
        <Radio.Group value={showLegend} onChange={changelegend}>
          <Radio key='1' style={radioStyle} value>Show</Radio>
          <Radio key='2' style={radioStyle} value={false}>Hide</Radio>
        </Radio.Group>
      </SubMenu>
      <SubMenu key='group-by' title='Group by'>
        <Menu.ItemGroup>
          <Radio.Group value={groupBy} onChange={changeGroupBy}>
            {getCellSets(['metadataCategorical', 'cellSets']).map((element) => (
              <Radio style={radioStyle} key={element.value} value={element.value}>{element.value}</Radio>
            ))}
          </Radio.Group>
        </Menu.ItemGroup>
      </SubMenu>
    </Menu>
  );

  return (
    <Dropdown arrow type='link' size='small' overlay={menu} trigger={['click']}>
      <Tooltip title='settings'>
        <Button
          size='small'
          type='text'
          icon={<SettingOutlined />}
          // these classes are added so that the settings button is the same style as the remove button
          className='bp3-button bp3-minimal'
        />
      </Tooltip>
    </Dropdown>
  );
};

HeatmapSettings.defaultProps = {
};

HeatmapSettings.propTypes = {
};

export default HeatmapSettings;

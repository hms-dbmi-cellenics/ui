import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Radio } from 'antd';
import { useRouter } from 'next/router';
import updateGeneExpressionType from '../../../../../../redux/actions/genes/updateGeneExpressionType';

const HeatmapExpressionValuesSettings = () => {
  const dispatch = useDispatch();
  const expressionType = useSelector((state) => state.genes.expression.expressionType);
  const router = useRouter();
  const { experimentId } = router.query;

  const expressionTypes = {
    raw: 'Raw values',
    zScore: 'Z-score',
  };

  const radioStyle = {
    display: 'block',
    height: '30px',
    lineHeight: '30px',
  };

  return (
    <div style={{ padding: '5px' }}>
      <Radio.Group
        value={expressionType}
        onChange={({ target }) => dispatch(updateGeneExpressionType(experimentId, target.value))}
      >
        {Object.keys(expressionTypes).map((type) => (
          <Radio style={radioStyle} value={type}>
            {expressionTypes[type]}
          </Radio>
        ))}
      </Radio.Group>
    </div>
  );
};

HeatmapExpressionValuesSettings.defaultProps = {
};

HeatmapExpressionValuesSettings.propTypes = {
};

export default HeatmapExpressionValuesSettings;

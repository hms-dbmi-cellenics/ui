import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { PointerIconSVG, SelectLassoIconSVG } from '@vitessce/icons';
import { CenterFocusStrong } from '@vitessce/styles';

const ToolContainer = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  display: inline;
  z-index: 1000;
  opacity: 0.65;
  color: black;
  
  &:hover {
    opacity: 0.90;
  }
`;

const ToolButton = styled.button`
  padding: 0;
  height: 2em;
  width: 2em;
  background-color: white;
  display: inline-block;
  font-weight: 400;
  text-align: center;
  vertical-align: middle;
  cursor: pointer;
  user-select: none;
  border: 1px solid #6c757d;
  font-size: 16px;
  line-height: 1.5;
  border-radius: 4px;
  transition: color 0.15s ease-in-out, background-color 0.15s ease-in-out, border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
  color: #6c757d;
  margin-right: 8px;

  & > svg {
    vertical-align: middle;
    display: inline-block;
    color: black;
  }

  &:active {
    opacity: 0.65;
    box-shadow: none;
    transform: scale(0.98);
  }

  ${(props) => (props.isActive ? `
    color: #fff;
    background-color: #6c757d;
    border-color: #6c757d;
    box-shadow: 0 0 0 3px rgba(108, 117, 125, 0.5);
  ` : '')}
`;

export const PanToolButton = ({ isActive, onClick }) => (
  <ToolButton
    isActive={isActive}
    onClick={onClick}
    type="button"
    title="Pointer tool"
  >
    <PointerIconSVG />
  </ToolButton>
);

PanToolButton.propTypes = {
  isActive: PropTypes.bool.isRequired,
  onClick: PropTypes.func.isRequired,
};

export const LassoToolButton = ({ isActive, onClick }) => (
  <ToolButton
    isActive={isActive}
    onClick={onClick}
    type="button"
    title="Select lasso"
  >
    <SelectLassoIconSVG />
  </ToolButton>
);

LassoToolButton.propTypes = {
  isActive: PropTypes.bool.isRequired,
  onClick: PropTypes.func.isRequired,
};

export const RecenterButton = ({ onClick }) => (
  <ToolButton
    onClick={onClick}
    type="button"
    title="Click to recenter"
    aria-label="Recenter scatterplot view"
  >
    <CenterFocusStrong />
  </ToolButton>
);

RecenterButton.propTypes = {
  onClick: PropTypes.func.isRequired,
};

const ToolMenu = ({
  activeTool,
  onToolChange,
  visibleTools = { pan: true, selectLasso: true, recenter: false },
  recenterOnClick = () => { },
}) => (
  <ToolContainer>
    {visibleTools.pan && (
      <PanToolButton
        isActive={activeTool === null}
        onClick={() => onToolChange(null)}
      />
    )}
    {visibleTools.selectLasso && (
      <LassoToolButton
        isActive={activeTool === 'polygon'}
        onClick={() => onToolChange('polygon')}
      />
    )}
    {visibleTools.recenter && (
      <RecenterButton
        onClick={recenterOnClick}
      />
    )}
  </ToolContainer>
);

ToolMenu.propTypes = {
  activeTool: PropTypes.oneOf([null, 'polygon']),
  onToolChange: PropTypes.func.isRequired,
  visibleTools: PropTypes.shape({
    pan: PropTypes.bool,
    selectLasso: PropTypes.bool,
    recenter: PropTypes.bool,
  }),
  recenterOnClick: PropTypes.func,
};

ToolMenu.defaultProps = {
  activeTool: null,
  visibleTools: { pan: true, selectLasso: true, recenter: false },
  recenterOnClick: () => { },
};

export default ToolMenu;

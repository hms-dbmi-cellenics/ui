const updateCellOrder = (state, action) => {
  const { componentUuid, cellOrder } = action.payload;

  return {
    ...state,
    [componentUuid]: {
      ...state[componentUuid],
      cellOrder,
    },
  };
};

export default updateCellOrder;

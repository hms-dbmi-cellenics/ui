import changeEmbeddingAxesIfNecessary from 'components/plots/helpers/changeEmbeddingAxesIfNecessary';

const onUpdate = jest.fn();

describe('change default embedding axes if necessary ', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('Does nothing if config or method are available', () => {
    changeEmbeddingAxesIfNecessary(undefined, { value: true }, onUpdate);
    changeEmbeddingAxesIfNecessary({ value: true }, undefined, onUpdate);
    expect(onUpdate).not.toHaveBeenCalled();
  });

  it('changes y axis if its still default', () => {
    const config = {
      axes: {
        xAxisText: 'Custom axis',
        yAxisText: 'still default',
        defaultValues: ['y'],
      },
    };
    changeEmbeddingAxesIfNecessary(config, 'firstname', onUpdate);
    expect(onUpdate).toHaveBeenCalledWith({
      axes: {
        yAxisText: 'Firstname 2',
      },
    });
  });

  it('Changes x axis if its default default', () => {
    const config = {
      axes: {
        xAxisText: 'still default',
        yAxisText: 'default axis',
        defaultValues: ['x'],
      },
    };
    changeEmbeddingAxesIfNecessary(config, 'tsne', onUpdate);
    expect(onUpdate).toHaveBeenCalledWith({
      axes: {
        xAxisText: 'Tsne 1',
      },
    });
  });

  it('Does not update if axes are not default', () => {
    const config = {
      axes: {
        xAxisText: 'still default',
        yAxisText: 'not default axis',
        defaultValues: [],
      },
    };
    changeEmbeddingAxesIfNecessary(config, 'tsne', onUpdate);
    expect(onUpdate).not.toHaveBeenCalled();
  });
});

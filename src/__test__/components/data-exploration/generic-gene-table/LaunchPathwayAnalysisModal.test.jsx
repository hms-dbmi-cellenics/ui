import React from 'react';
import userEvent from '@testing-library/user-event';
import LaunchPathwayAnalysisModal from 'components/data-exploration/differential-expression-tool/LaunchPathwayAnalysisModal';
import {
  render, screen, waitFor,
} from '@testing-library/react';
import { act } from 'react-dom/test-utils';
import { Provider } from 'react-redux';
import { makeStore } from 'redux/store';

import launchPathwayService from 'utils/pathwayAnalysis/launchPathwayService';
import getPathwayAnalysisGenes from 'utils/pathwayAnalysis/getPathwayAnalysisGenes';
import pathwayServices from 'utils/pathwayAnalysis/pathwayServices';
import speciesOptions from 'utils/pathwayAnalysis/pathwaySpecies';

jest.mock('utils/pathwayAnalysis/launchPathwayService');
jest.mock('utils/pathwayAnalysis/getPathwayAnalysisGenes');

const onCancel = jest.fn();

const renderPathwayAnalysisModal = () => {
  render(
    <Provider store={makeStore()}>
      <LaunchPathwayAnalysisModal onCancel={onCancel} />
    </Provider>,
  );
};

const genesList = ['gene1', 'gene2'];
getPathwayAnalysisGenes.mockImplementation(() => async () => Promise.resolve(genesList));

describe('Pathway analysis modal ', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('Renders properly', () => {
    renderPathwayAnalysisModal();
    expect(screen.getByText('You have not performed any filtering on the genes!')).toBeInTheDocument();

    Object.values(pathwayServices).forEach((serviceName) => {
      expect(screen.getByLabelText(serviceName)).toBeInTheDocument();
    });

    expect(screen.getByLabelText(pathwayServices.PANTHERDB).checked).toEqual(true);
    expect(screen.getByRole('combobox')).toBeInTheDocument();
    expect(screen.getByRole('spinbutton')).toBeInTheDocument();
    const closeButton = screen.getAllByLabelText('close')[0];
    closeButton.click();
    expect(onCancel).toHaveBeenCalled();
  });

  it('Clicking enrichr radio button removes suggestion text', async () => {
    renderPathwayAnalysisModal();
    const enrichrRadioButton = screen.getByLabelText(pathwayServices.ENRICHR);
    userEvent.click(enrichrRadioButton);
    await waitFor(() => (
      expect(screen.queryByText('It is strongly recommended to input', { exact: false })).not.toBeInTheDocument()
    ));
  });

  it('Clicking advanced filtering modal opens the modal', async () => {
    renderPathwayAnalysisModal();
    userEvent.click(screen.getByText('Click here to open the advanced filtering options.'));
    await waitFor(() => {
      expect(screen.getByText('Add custom filter')).toBeInTheDocument();
    });
  });

  it('Launches the service with enrichr', async () => {
    renderPathwayAnalysisModal();

    const defaultSpecies = 'sapiens';

    // Choose enrichr and launch the analysis
    userEvent.click(screen.getByText(pathwayServices.ENRICHR));

    await act(async () => {
      userEvent.click(screen.getByText('Launch'));
    });

    // The first option to getPathwayAnalysisGenes is useAllGenes, which is true by default
    expect(getPathwayAnalysisGenes).toHaveBeenCalledTimes(1);
    expect(getPathwayAnalysisGenes).toHaveBeenCalledWith(true, 0);

    expect(launchPathwayService).toHaveBeenCalledTimes(1);
    expect(launchPathwayService).toHaveBeenCalledWith(
      pathwayServices.ENRICHR,
      genesList,
      defaultSpecies,
    );
  });

  it('Passes the species key correctly', async () => {
    renderPathwayAnalysisModal();

    const secondSpecies = speciesOptions[speciesOptions.length - 1];

    await act(async () => {
      userEvent.click(screen.getByRole('combobox'));
    });

    // Choose another species

    const speciesOption = screen.getAllByText(secondSpecies.label)[0];
    await act(async () => {
      userEvent.click(speciesOption, undefined, { skipPointerEventsCheck: true });
    });

    // After all is ready, launch
    await act(async () => {
      userEvent.click(screen.getByText('Launch'));
    });

    // The first option to getPathwayAnalysisGenes is useAllGenes, which is true by default
    expect(getPathwayAnalysisGenes).toHaveBeenCalledTimes(1);
    expect(getPathwayAnalysisGenes).toHaveBeenCalledWith(true, 0);

    expect(launchPathwayService).toHaveBeenCalledTimes(1);
    expect(launchPathwayService).toHaveBeenCalledWith(
      pathwayServices.PANTHERDB,
      genesList,
      secondSpecies.value,
    );
  });

  it('Passes the number of genes correctly', async () => {
    renderPathwayAnalysisModal();

    const numGenes = 5;

    // Input to use number of genes
    userEvent.click(screen.getByText('Top'));

    await act(async () => {
      userEvent.type(screen.getByRole('spinbutton'), `{backspace}${numGenes}`);
    });

    await act(async () => {
      userEvent.click(screen.getByText('Launch'));
    });

    // The first option to getPathwayAnalysisGenes is useAllGenes, which is true by default
    expect(getPathwayAnalysisGenes).toHaveBeenCalledTimes(1);
    expect(getPathwayAnalysisGenes).toHaveBeenCalledWith(false, numGenes);
  });
});

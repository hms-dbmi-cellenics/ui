import { loadOmeZarr } from 'components/data-exploration/spatial/loadOmeZarr';
import { root as zarrRoot } from 'zarrita';
import ZipFileStore from 'components/data-exploration/spatial/ZipFileStore';

// Load OME-Zarr and return the pyramid and loader (an example)
const getImageUrls = async (omeZarrUrl) => {
  const omeZarrRoot = zarrRoot(ZipFileStore.fromUrl(omeZarrUrl));

  const { data } = await loadOmeZarr(omeZarrRoot);
  const base = data[0];

  const imageUrl = await imageDataToUrl(base);
  return imageUrl;
};

const imageDataToUrl = async (base) => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  // Extract dimensions from the first channel
  const { width, height } = await base.getRaster({ selection: { c: 0, x: 0, y: 0 } });

  canvas.width = width;
  canvas.height = height;

  const rgbaData = new Uint8ClampedArray(width * height * 4);

  // Process each RGB channel
  await Promise.all([0, 1, 2].map(async (c) => {
    const selection = { c, x: 0, y: 0 };
    const { data: pixelData } = await base.getRaster({ selection });

    pixelData.forEach((value, i) => {
      rgbaData[i * 4 + c] = value;
    });
  }));

  // Set alpha channel to fully opaque
  rgbaData.forEach((_, i) => {
    if ((i + 1) % 4 === 0) {
      rgbaData[i] = 255;
    }
  });

  const imageDataObject = new ImageData(rgbaData, width, height);
  ctx.putImageData(imageDataObject, 0, 0);

  const imageUrl = canvas.toDataURL();
  return { imageUrl, imageWidth: width, imageHeight: height };
};

export default getImageUrls;

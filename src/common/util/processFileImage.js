/**
 * Returns a base64 with the formatted image
 * @param file
 * @param getMessage {function} Localization
 * @returns {Promise}
 */
// eslint-disable-next-line import/prefer-default-export
export const processFileImage = (file, getMessage = null) => {
  // Read the file info
  const reader = new FileReader();
  const readerPromise = new Promise(resolve => {
    reader.onload = () => resolve(reader.result);
  });

  return new Promise((resolve, reject) => {
    if (!window.FileReader) {
      if (getMessage) {
        reject(new Error(getMessage('imageInput.errors.fileApiUnsupported')));
      } else {
        reject(new Error("The file API isn't supported on this browser yet."));
      }
      return;
    }

    if (file.type && file.type !== '' && file.type.indexOf('image') === -1) {
      if (getMessage) {
        reject(new Error(getMessage('imageInput.errors.wrongFileFormat', { fileType: file.type })));
      } else {
        reject(new Error(`Wrong format : ${file.type}`));
      }
    }

    readerPromise
      // loadImage
      .then(readerResult => loadImage(readerResult))
      // Get image info
      .then(loadedImage => rotateImage(loadedImage))
      // Scale the image
      .then(image => scaleImage(image))
      // Finally compress the image
      .then(image => compressImage(image))
      // Resolve with image source
      .then(image => resolve(image.src))
      .catch(error => reject(error));

    reader.readAsDataURL(file);
  });
};

/**
 * Set image src
 * @param url
 * @returns {*}
 */
const loadImage = url => {
  const image = new Image();
  image.src = url;
  return new Promise(resolve => {
    image.onload = () => resolve(image);
  });
};

/**
 * Get rotation of a image
 * Resolving with -1: not defined
 * Resolving with -2: not jpeg
 * @param image
 */
const getOrientation = image => {
  // Copied method from exif.js
  const base64ToArrayBuffer = base64string => {
    const base64 = base64string.replace(/^data:([^;]+);base64,/gim, '');
    const binary = atob(base64);
    const len = binary.length;
    const buffer = new ArrayBuffer(len);
    const view = new Uint8Array(buffer);
    for (let i = 0; i < len; i++) {
      view[i] = binary.charCodeAt(i);
    }
    return buffer;
  };

  const view = new DataView(base64ToArrayBuffer(image.src));

  if (view.getUint16(0, false) !== 0xffd8) {
    return -2;
  }

  const length = view.byteLength;
  let offset = 2;

  while (offset < length) {
    const marker = view.getUint16(offset, false);
    offset += 2;

    if (marker === 0xffe1) {
      // eslint-disable-next-line no-cond-assign
      if (view.getUint32((offset += 2), false) !== 0x45786966) {
        return -1;
      }

      const little = view.getUint16((offset += 6), false) === 0x4949;

      offset += view.getUint32(offset + 4, little);

      const tags = view.getUint16(offset, little);

      offset += 2;
      for (let i = 0; i < tags; i++) {
        if (view.getUint16(offset + i * 12, little) === 0x0112) {
          return view.getUint16(offset + i * 12 + 8, little);
        }
      }
      // eslint-disable-next-line no-bitwise
    } else if ((marker & 0xff00) !== 0xff00) {
      break;
    } else {
      offset += view.getUint16(offset, false);
    }
  }
  return -1;
};

/**
 * Rotate the image based on the value got from getOrientation
 * @param image
 * @param exifOrientation
 * @returns {*}
 */
const rotateImage = image => {
  const exifOrientation = getOrientation(image);

  if (exifOrientation === -1 || exifOrientation === -2) {
    return image;
  }

  const width = image.width;
  const height = image.height;
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  // set proper canvas dimensions before transform & export
  if ([5, 6, 7, 8].indexOf(exifOrientation) > -1) {
    canvas.width = height;
    canvas.height = width;
  } else {
    canvas.width = width;
    canvas.height = height;
  }

  // transform context before drawing image
  switch (exifOrientation) {
    case 2:
      ctx.transform(-1, 0, 0, 1, width, 0);
      break;
    case 3:
      ctx.transform(-1, 0, 0, -1, width, height);
      break;
    case 4:
      ctx.transform(1, 0, 0, -1, 0, height);
      break;
    case 5:
      ctx.transform(0, 1, 1, 0, 0, 0);
      break;
    case 6:
      ctx.transform(0, 1, -1, 0, height, 0);
      break;
    case 7:
      ctx.transform(0, -1, -1, 0, height, width);
      break;
    case 8:
      ctx.transform(0, -1, 1, 0, 0, width);
      break;
    default:
      ctx.transform(1, 0, 0, 1, 0, 0);
  }

  // draw image
  ctx.drawImage(image, 0, 0);

  // export base64
  return loadImage(canvas.toDataURL());
};

/**
 * Scales the image using maxDimensions
 * @param image
 * @returns {*}
 */
const scaleImage = image => {
  const maxDimensions = {
    MAX_WIDTH: 2000,
    MAX_HEIGHT: 2000,
  };

  if (image.width < maxDimensions.MAX_WIDTH && image.height < maxDimensions.MAX_HEIGHT) {
    return Promise.resolve(image);
  }

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  const ScaleTypes = {
    WIDTH: 'scaleWidth',
    HEIGHT: 'scaleHeight',
  };

  let width = 0;
  let height = 0;

  const scaleType = image.width > image.height ? ScaleTypes.WIDTH : ScaleTypes.HEIGHT;

  if (scaleType === ScaleTypes.WIDTH) {
    width = maxDimensions.MAX_WIDTH;
    height = image.height * (maxDimensions.MAX_WIDTH / image.width);
  }
  if (scaleType === ScaleTypes.HEIGHT) {
    width = image.width * (maxDimensions.MAX_HEIGHT / image.height);
    height = maxDimensions.MAX_HEIGHT;
  }

  canvas.width = width;
  canvas.height = height;

  ctx.drawImage(image, 0, 0, width, height);

  return loadImage(canvas.toDataURL());
};

const compressImage = image => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  canvas.width = image.width;
  canvas.height = image.height;

  ctx.drawImage(image, 0, 0, image.width, image.height);

  return loadImage(canvas.toDataURL('image/jpeg', 0.8));
};

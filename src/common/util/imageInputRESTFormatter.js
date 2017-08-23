/**
 * Formats it to backend API specification
 * @param images
 * @returns {*}
 */
const imageInputRestFormatter = images => {
  if (images && images.length) {
    // Replace MIME content so base64 is left
    const image = images[0].replace(/^data:image\/[^;]+;base64,/, '');
    return { type: 0, content: image };
  }

  return null;
};

export default imageInputRestFormatter;

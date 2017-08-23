/**
 * Utilities to manage "gap arrays". These are arrays of which contain objects and
 * numbers. The objects represent actual data, while the numbers define an amount
 * of 'undefined' items. This allows us to define lists with large gaps in between
 * without having an array with a large length.
 *
 * For example, the following array:
 * [undefined, undefined, undefined, foo, undefined, undefined, bar]
 * would be stored as a "gap array" like so:
 * [3, foo, 2, bar]
 *
 * @module
 */

/**
 * Returns a new gap array with the given array of data inserted. The data will replace
 * existing data at the same index.
 * @param {Array<Object|number>} gapArray The array to insert into
 * @param {Array<Object>} data An array of data objects to insert
 * @param {number} offset The index at which to start inserting
 * @returns {Array<Object|number>} The resulting array
 */
export function gapArraySet(gapArray, data, offset = 0) {
  if (!data.length) {
    return gapArray.slice(0);
  }

  const targetSlice = gapArraySlice(gapArray, offset, data.length + offset);
  const newData = toGapArray(data);

  const preTarget = gapArray.slice(0, targetSlice.beginGapArrayIndex || 0);

  if (typeof newData[0] === 'number') {
    newData[0] += targetSlice.beginGapOffset || 0;
    if (typeof preTarget[preTarget.length - 1] === 'number') {
      newData[0] += preTarget.pop();
    }
  } else if (targetSlice.beginGapOffset) {
    preTarget.push(targetSlice.beginGapOffset);
  }

  const postTarget =
    targetSlice.endGapArrayIndex === null ? [] : gapArray.slice(targetSlice.endGapArrayIndex);

  if (typeof newData[newData.length - 1] === 'number') {
    if (typeof postTarget[0] === 'number') {
      newData[newData.length - 1] += postTarget.shift();
    }
    if (targetSlice.endGapOffset) {
      newData[newData.length - 1] -= targetSlice.endGapOffset;
    }
  } else if (targetSlice.endGapOffset) {
    postTarget[0] -= targetSlice.endGapOffset;
  }

  return preTarget.concat(newData, postTarget);
}

/**
 * Converts all the undefined items in the given array to a number representing
 * the amount of undefined items.
 * @param {Array<Object>} target The input array
 * @returns {Array<Object|number>} The processed array
 * @example const input = [foo, undefined, undefined, bar, undefined, foobar];
 * const gapArray = toGapArray(input); // returns [foo, 2, bar, 1, foobar]
 */
export function toGapArray(target) {
  return target.reduce((gapArray, entry) => {
    /* eslint-disable no-param-reassign */
    if (typeof entry === 'undefined') {
      if (typeof gapArray[gapArray.length - 1] === 'number') {
        gapArray[gapArray.length - 1] += 1;
      } else {
        gapArray.push(1);
      }
    } else {
      gapArray.push(entry);
    }

    return gapArray;
    /* eslint-enable no-param-reassign */
  }, []);
}

/**
 * Returns a slice of an array with gaps as a regular array.
 * @param {Array<Object|number>} gapArray The input array that can contain objects or
 * a number indicating an amount of undefined items.
 * @param {number} begin The index at which to start the slice
 * @param {number} end The index at which to end the slice. The item at this index is the
 * first item not included in the returned slice.
 * @returns {object} A result object containing the following properties:
 *  - result the resulting slice array
 *  - beginGapArrayIndex The index of the given 'begin' index in the input array.
 *  - beginGapOffset If beginGapArrayIndex is a gap, this is set to the index of 'begin'
 *  within that gap. Set to null otherwise
 *  - endGapArrayIndex The index of the given 'end' index in the in the input array. If the
 *  'end' index was beyond the length of the array, this value will be null.
 *  - endGapOffset If endGapArrayIndex is a gap, this is set to the index of 'end'
 *  within that gap. Set to null otherwise
 */
export function gapArraySlice(gapArray, begin = 0, end = Number.POSITIVE_INFINITY) {
  if (!gapArray.length) {
    return {
      result: [],
      beginGapOffset: begin,
      endGapOffset: null,
      beginGapArrayIndex: null,
      endGapArrayIndex: null,
    };
  }

  // find the index of the first gap (array item with type === 'number'
  const firstGapIndex = gapArray.findIndex(e => typeof e === 'number');

  // if there were no gaps in our target range, we can slice this like a normal array
  if (firstGapIndex < 0 || firstGapIndex >= end) {
    return {
      result: gapArray.slice(begin, end),
      beginGapOffset: begin > gapArray.length ? begin - gapArray.length : null,
      endGapOffset: null,
      beginGapArrayIndex: Math.min(begin, gapArray.length),
      endGapArrayIndex: end < gapArray.length ? end : null,
    };
  }

  // start by adding all the items from begin up to the first gap
  const result =
    firstGapIndex > begin
      ? gapArray.slice(firstGapIndex - begin, Math.min(firstGapIndex, end))
      : [];

  // keep track of the current index in gapArray, and the corresponding 'real' index
  let gapArrayIndex = firstGapIndex;
  let realIndex = firstGapIndex;

  // we will set these values once we find the real begin index
  let beginGapArrayIndex = realIndex > begin ? begin : null;
  let beginGapOffset = null;
  let endGapArrayIndex = null;
  let endGapOffset = null;

  // loop until we reached end index or out of gapArray items
  while (realIndex < end && gapArrayIndex < gapArray.length) {
    const entryOrGap = gapArray[gapArrayIndex];

    if (typeof entryOrGap === 'number') {
      // calculate the realIndex after this gap
      const nextRealIndex = realIndex + entryOrGap;

      // if the begin index is passed, push undefined until we reach nextRealIndex or end
      for (let i = Math.max(realIndex, begin); i < nextRealIndex && i < end; i++) {
        result.push(undefined);
      }

      // If we will pass the begin index in this gap, set beginGapArrayIndex and beginGapOffset
      if (beginGapArrayIndex === null && nextRealIndex > begin) {
        beginGapArrayIndex = gapArrayIndex;
        beginGapOffset = begin - realIndex;
      }
      realIndex = nextRealIndex;
    } else {
      // if we passed the begin index, add this item to the result
      if (realIndex >= begin) {
        result.push(entryOrGap);

        // if we just passed the begin index, set beginGapArrayIndex
        if (beginGapArrayIndex === null) {
          beginGapArrayIndex = gapArrayIndex;
        }
      }

      // not a gap, increase realIndex by 1 item
      realIndex += 1;
    }

    gapArrayIndex += 1;
  }

  if (realIndex > end) {
    // the end index is inside the last gap
    endGapArrayIndex = gapArrayIndex - 1;
    endGapOffset = end - (realIndex - gapArray[endGapArrayIndex]);
  } else if (realIndex === end && gapArrayIndex < gapArray.length) {
    // the end index is after this item
    endGapArrayIndex = gapArrayIndex;
    if (typeof gapArray[endGapArrayIndex] === 'number') {
      endGapOffset = 0;
    }
  }

  if (beginGapArrayIndex === null) {
    if (end <= begin) {
      // we haven't reached the begin index because this is a zero-width array
      beginGapArrayIndex = gapArrayIndex;
      beginGapOffset = typeof gapArray[beginGapArrayIndex] === 'number' ? 0 : null;
    } else {
      // we haven't reached the begin because it is beyond the length of the array
      beginGapArrayIndex = begin === end ? gapArrayIndex : gapArray.length;
      beginGapOffset = begin - realIndex;
    }
  }
  return { result, beginGapArrayIndex, beginGapOffset, endGapArrayIndex, endGapOffset };
}

/**
 * @typedef Rect
 * @property x
 * @property y
 * @property width
 * @property height
 */

/**
 * @typedef Point
 * @property x
 * @property y
 */

import {BlobRect} from "./models.js";

/**
 * @param {Rect} rect
 * @param {Point} point
 * @param {number} padding
 * @returns {boolean}
 */
export function rectContainsPoint(rect, point, padding = 0) {
    return point.x >= rect.x - padding
        && point.y >= rect.y - padding
        && point.x <= rect.x + rect.width + padding
        && point.y <= rect.y + rect.height + padding;
}

/**
 * @param {Rect} parentRect
 * @param {Rect} childRect
 * @returns {boolean}
 */
export function rectContainsRect(parentRect, childRect) {
    return childRect.x >= parentRect.x
        && childRect.y >= parentRect.y
        && childRect.x + childRect.width <= parentRect.x + parentRect.width
        && childRect.y + childRect.height <= parentRect.y + parentRect.height;
}

/**
 * @param {Rect} rect1
 * @param {Rect} rect2
 * @returns {boolean}
 */
export function rectIntersects(rect1, rect2) {
    // allow detection on rectangles of size 0
    // kinda hacky, but what can you do
    let tw = rect1.width === 0 ? 1 : rect1.width;
    let th = rect1.height === 0 ? 1 : rect1.height;
    let rw = rect2.width === 0 ? 1 : rect2.width;
    let rh = rect2.height === 0 ? 1 : rect2.height;

    let tx = rect1.x;
    let ty = rect1.y;
    let rx = rect2.x;
    let ry = rect2.y;
    rw += rx;
    rh += ry;
    tw += tx;
    th += ty;
    //      overflow || intersect
    return ((rw <= rx || rw >= tx) &&
        (rh <= ry || rh >= ty) &&
        (tw <= tx || tw >= rx) &&
        (th <= ty || th >= ry));
}

/**
 * @param {BlobRect} blob1
 * @param {BlobRect} blob2
 * @returns {BlobRect}
 */
function mergeBlobs(blob1, blob2) {
    const x = Math.min(blob1.x, blob2.x)
    const y = Math.min(blob1.y, blob2.y)
    const x2 = Math.max(blob1.x + blob1.width, blob2.x + blob2.width)
    const y2 = Math.max(blob1.y + blob1.height, blob2.y + blob2.height)

    const row = Math.min(blob1.row, blob2.row);
    const col = Math.min(blob1.col, blob2.col);

    return new BlobRect(x, y, x2 - x, y2 - y, blob1.points.concat(blob2.points), row, col, true)
}


/**
 * @param {BlobRect[]} rectList
 * @param {BlobRect[]} mergeList
 */
export function mergeBlobsInlist(rectList, mergeList) {
    let mergedRect = null;

    for (let i = rectList.length-1; i >= 0; i--) {
        const rect = rectList[i];

        for (let j = mergeList.length-1; j >= 0; j--) {
            const rectToMerge = mergeList[j];

            if (rect === rectToMerge) {
                if (!mergedRect) {
                    mergedRect = rectToMerge
                } else {
                    mergedRect = mergeBlobs(mergedRect, rectToMerge);
                }

                rectList.splice(rectList.indexOf(rect), 1)
                mergeList.splice(mergeList.indexOf(rectToMerge), 1)

                if (mergeList.length === 0) {
                    rectList.splice(i, 0, mergedRect)
                    return;
                }
                break;
            }
        }
    }

    //console.log("Merged: " + (size - rectList.length))
}

/**
 * @param {Rect[]} rects
 * @return {Rect}
 */
export function getMaxDimensions(rects) {
    let minX = rects[0].x;
    let minY = rects[0].y;
    let maxX = rects[0].x + rects[0].width;
    let maxY = rects[0].y + rects[0].height;

    rects.forEach(rect => {
        minX = Math.min(minX, rect.x);
        minY = Math.min(minY, rect.y);
        maxX = Math.min(maxX, rect.x + rect.width);
        maxY = Math.min(maxY, rect.y + rect.height);
    })

    return {x: minX, y:minY, width: maxX - minX, height: maxY - minY}
}
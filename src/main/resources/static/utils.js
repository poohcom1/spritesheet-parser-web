/**
 * @typedef Rect
 * @property x
 * @property y
 * @property width
 * @property height
 */

/**
 * @typedef BlobRect
 * @typedef {Rect & BlobRect} BlobRect
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
        && point.x < rect.x + rect.width + padding - 1
        && point.y < rect.y + rect.height + padding - 1;
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
 * @param {Rect} rect1
 * @param {Rect} rect2
 * @return {boolean}
 */
function rectOverlapsInDirection(rect1, rect2) {
    return (rect1.y <= rect2.y + rect2.height && rect1.y + rect1.height >= rect2.y);
}

/**
 * @param {BlobRect} blob1
 * @param {BlobRect} blob2
 * @return {number}
 */
function blobCompare(blob1, blob2) {
    if (rectOverlapsInDirection(blob1, blob2)) {
        return blob1.x - blob2.x;
    } else {
        return blob1.y - blob2.y;
    }
}

/**
 * @param {BlobRect[]} blobList
 */
function orderBlobList(blobList) {
    blobList.sort((a, b) => blobCompare(a, b))

    let previousBlob = blobList[0];
    previousBlob.row = 0;
    previousBlob.col = 0;

    for (let i = 1; i < blobList; i++) {
        const currentBlob = blobList[i];

        if (rectOverlapsInDirection(currentBlob, previousBlob)) {
            currentBlob.col = previousBlob.col + 1;
            currentBlob.row = previousBlob.row;
        } else {
            currentBlob.col = 0;
            currentBlob.row = previousBlob.row + 1;
        }
    }
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
 * Automatically merge overlapping blobs, and orders the blobs
 * @param {BlobRect[]} blobList
 * @param {BlobRect[]} mergeList
 */
export function mergeBlobsInlist(blobList, mergeList) {
    let mergedRect = null;

    for (let i = blobList.length-1; i >= 0; i--) {
        const rect = blobList[i];

        if (!mergeList.includes(rect)) continue;

        if (!mergedRect) {
            mergedRect = rect
        } else {
            mergedRect = mergeBlobs(mergedRect, rect);
        }

        blobList.splice(blobList.indexOf(rect), 1)
        mergeList.splice(mergeList.indexOf(rect), 1)

        //console.log("Merges remaining" + mergeList.length)

        if (mergeList.length === 0) {
            blobList.splice(i, 0, mergedRect)
        }
    }

    orderBlobList(blobList)

    //console.log(rectList)
    //console.log("Merged: " + (size - rectList.length))
}

/**
 * @param {BlobRect} blob
 * @param {Point[]} pointsToDelete
 * @return {number} Remaining points count
 */
export function removePoints(blob, pointsToDelete) {
    // To recalculate blob dimensions
    let x = blob.points[0].x;
    let y = blob.points[0].y;
    let x2 = blob.points[0].x;
    let y2 = blob.points[0].y;

    for (let i = blob.points.length-1; i >= 0; i--) {
        const p = blob.points[i];

        if (!pointsToDelete.includes(p)) {
            x = Math.min(x, p.x);
            y = Math.min(y, p.y);
            x2 = Math.max(x2, p.x);
            y2 = Math.max(y2, p.y);
        } else {
            blob.points.splice(i, 1) // Delete point from blob
            pointsToDelete.splice(pointsToDelete.indexOf(p), 1) // Delete point from selected points
        }
    }

    blob.x = x;
    blob.y = y;
    blob.width = x2 - x;
    blob.height = y2 - y;

    return blob.points.length;
}

/**
 * @param {Rect[]} rects
 * @return {Rect}
 */
export function getMaxDimensions(rects) {
    let maxWidth = 0;
    let maxHeight= 0;

    rects.forEach(rect => {
        maxWidth = Math.max(maxWidth, rect.width);
        maxHeight = Math.max(maxHeight, rect.height);
    })

    return {x: 0, y:0, width: maxWidth, height: maxHeight}
}

/**
 * @param {HTMLImageElement} image
 * @param {Rect} rect
 * @return {string}
 */
export function cropImage(image, rect) {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    canvas.width = rect.width;
    canvas.height = rect.height;

    ctx.drawImage(image, rect.x, rect.y, rect.width, rect.height, 0, 0, rect.width, rect.height)

    let file = new Blob;

    canvas.toBlob(blob => file = blob, "image/png", 1.0);

    return canvas.toDataURL("image/png", 1.0);
}

/**
 * @param {HTMLImageElement} image
 * @param {BlobRect} blob
 * @param {Rect} dimensions
 * @return {string} URL
 */
export function cropSprite(image, blob, dimensions) {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    canvas.width = dimensions.width;
    canvas.height = dimensions.height;

    ctx.drawImage(image, blob.x, blob.y, blob.width, blob.height, blob.xPadding, blob.yPadding, blob.width, blob.height)

    const outputImage = new Image;
    outputImage.src = canvas.toDataURL()

    return canvas.toDataURL();
}


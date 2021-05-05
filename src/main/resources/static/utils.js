

/**
 * @param rect
 * @param point
 * @param padding
 * @returns {boolean}
 */
export function rectContainsPoint(rect, point, padding = 0) {
    return point.x >= rect.x - padding
        && point.y >= rect.y - padding
        && point.x <= rect.x + rect.width + padding
        && point.y <= rect.y + rect.height + padding;
}

/**
 * @param parentRect
 * @param childRect
 * @returns {boolean}
 */
export function rectContainsRect(parentRect, childRect) {
    return childRect.x >= parentRect.x
        && childRect.y >= parentRect.y
        && childRect.x + childRect.width <= parentRect.x + parentRect.width
        && childRect.y + childRect.height <= parentRect.y + parentRect.height;
}

/**
 * @param rect1
 * @param rect2
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

function mergeRects(rect1, rect2) {
    const x = Math.min(rect1.x, rect2.x)
    const y = Math.min(rect1.y, rect2.y)
    const x2 = Math.max(rect1.x + rect1.width, rect2.x + rect2.width)
    const y2 = Math.max(rect1.y + rect1.height, rect2.y + rect2.height)

    return {
        x: x,
        y: y,
        width: x2 - x,
        height: y2 - y,
    }
}

export function mergeRectsInList(rectList, mergeList) {
    let mergedRect = null;

    console.log(rectList.length)
    console.log(mergeList.length)

    const size = rectList.length;

    for (let i = rectList.length-1; i >= 0; i--) {
        const rect = rectList[i];

        for (let j = mergeList.length-1; j >= 0; j--) {
            const rectToMerge = mergeList[j];

            if (rect === rectToMerge) {
                if (!mergedRect) {
                    mergedRect = rectToMerge
                } else {
                    mergedRect = mergeRects(mergedRect, rectToMerge);
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

    console.log("Merged: " + (size - rectList.length))
}


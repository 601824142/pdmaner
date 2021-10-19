/*
 * 判断指定的像素是否是空白
 *
 * @param pixels 像素集合
 * @param width  图片宽度
 * @param x      像素横坐标
 * @param y      像素纵坐标
 * @return       boolean
 */
const isEmptyPixel = (pixels, width, x, y) => {
  const index = (y * width + x) * 4;
  const r = pixels.data[index];
  const g = pixels.data[index + 1];
  const b = pixels.data[index + 2];
  const a = pixels.data[index + 3] / 255;
  if (a === 0) {
    return true;
  }
  return r === 255 && g === 255 && b === 255;
};

/*
 * 探索图片中非空白内容的边界
 *
 * @param pixels 像素集合
 * @param width  原始图片宽度
 * @param height 原始图片高度
 * @return       bound
 */
const findBound = (pixels, width, height) => {
  const bound = {
    top: null,
    left: null,
    right: null,
    bottom: null,
  };
  // find left
  for (let x = 0; x < width; x += 1) {
    if (bound.left !== null) {
      break;
    }

    for (let y = 0; y < height; y += 1) {
      if (!isEmptyPixel(pixels, width, x, y)) {
        bound.left = x;
        break;
      }
    }
  }

  // find top
  for (let y = 0; y < height; y += 1) {
    if (bound.top !== null) {
      break;
    }

    for (let x = 0; x < width; x += 1) {
      if (!isEmptyPixel(pixels, width, x, y)) {
        bound.top = y;
        break;
      }
    }
  }

  // find right
  for (let x = width - 1; x > 0; x -= 1) {
    if (bound.right !== null) {
      break;
    }

    for (let y = height - 1; y > 0; y -= 1) {
      if (!isEmptyPixel(pixels, width, x, y)) {
        bound.right = x;
        break;
      }
    }
  }

  // find bottom
  for (let y = height - 1; y > 0; y -= 1) {
    if (bound.bottom !== null) {
      break;
    }

    for (let x = width - 1; x > 0; x -= 1) {
      if (!isEmptyPixel(pixels, width, x, y)) {
        bound.bottom = y;
        break;
      }
    }
  }
  return bound;
};

/*
 * 裁剪 canvas 中的图片，去除四周的空白。
 *
 * @param canvas  要处理的画布，此画布会被 copy 后进行裁剪，原始画布不会被修改。
 * @param padding 需要保留的空白边距
 * @return        裁剪后的画布
 */
const clipCanvasEmptyPadding = (canvas, padding) => {
  const ctx = canvas.getContext('2d'),
    width = canvas.width,
    height = canvas.height,
    pixels = ctx.getImageData(0, 0, width, height);

  // 探索边界
  const bound = findBound(pixels, width, height);

  // 增加 padding
  bound.top -= padding;
  bound.top = bound.top < 0 ? 0 : bound.top;

  bound.left -= padding;
  bound.left = bound.left < 0 ? 0 : bound.left;

  bound.bottom += padding;
  bound.bottom = bound.bottom > height ? height : bound.bottom;

  bound.right += padding;
  bound.right = bound.right > width ? width : bound.right;

  // 裁剪
  const trimHeight = bound.bottom - bound.top,
    trimWidth = bound.right - bound.left,
    trimmed = ctx.getImageData(bound.left, bound.top, trimWidth, trimHeight);

  // 拷贝图片到新 canvas
  const copy = document.createElement('canvas').getContext('2d');
  copy.canvas.width = trimWidth;
  copy.canvas.height = trimHeight;
  copy.putImageData(trimmed, 0, 0);

  return copy.canvas;
};

export default clipCanvasEmptyPadding;

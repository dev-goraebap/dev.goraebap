import { themeColors } from '../../foundations/colors';

/** 첫 화면도 테마와 같은 기준 색을 사용한다. */
export const bootColors = themeColors;

export const bootColor = (key: keyof typeof bootColors) => `light-dark(${bootColors[key][0]}, ${bootColors[key][1]})`;

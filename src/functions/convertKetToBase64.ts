import { encode } from '../utils/helpers';

export function convertKetToBase64(key: string) {
  return encode(key.replace(/^ +/gm, ''));
}

export default convertKetToBase64;

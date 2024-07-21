export const decode = (str: string): string => {
  try {
    return Buffer.from(str, 'base64').toString('utf-8');
  } catch (error) {
    throw new Error('Failed to decode base64 string');
  }
};

export const encode = (str: string): string => {
  try {
    return Buffer.from(str, 'utf-8').toString('base64');
  } catch (error) {
    throw new Error('Failed to encode string to base64');
  }
};

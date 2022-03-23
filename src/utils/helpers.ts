export const decode = (str: string):string => Buffer.from(str, 'base64').toString('utf-8');
export const encode = (str: string):string => Buffer.from(str, 'utf-8').toString('base64');

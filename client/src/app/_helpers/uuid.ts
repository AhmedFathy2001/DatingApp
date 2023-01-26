export const generateUUID = (): string => {
  let array = new Uint8Array(16);
  crypto.getRandomValues(array);

  array[6] = (array[6] & 0x0f) | 0x40;
  array[8] = (array[8] & 0x3f) | 0x80;

  let s = '';
  const hex = '0123456789abcdef';
  for (let i of array) {
    s += hex[i >> 4];
    s += hex[i & 15];
  }

  return `${s.slice(0, 8)}-${s.slice(8, 12)}-${s.slice(12, 16)}-${s.slice(
    16,
    20
  )}-${s.slice(20, 32)}`;
};

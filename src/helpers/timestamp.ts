export namespace Timestamp {
  export const now = () => {
    return Math.floor(Date.now() / 1000);
  };

  export const getTimezoneOffset = () => {
    const offset = -new Date().getTimezoneOffset(); // Invert the sign
    const sign = offset >= 0 ? '+' : '-';
    const hours = Math.floor(Math.abs(offset) / 60)
      .toString()
      .padStart(2, '0');
    const minutes = (Math.abs(offset) % 60).toString().padStart(2, '0');
    return `${sign}${hours}${minutes}`;
  };
}

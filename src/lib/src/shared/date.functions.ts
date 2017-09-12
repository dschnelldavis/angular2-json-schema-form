/**
 * 'dateToString' function
 *
 * @param  {Date} date
 * @return {string}
 */
export function dateToString(
  date: Date|string, options: { format?: string, locale?: string } = {}
): string {
  if (!options.format) { options.format = 'YYYY-MM-DD'; }
  // TODO: Use options.locale to change default format and names
  // if (!options.locale) { options.locale = 'en-US'; }
  if (typeof date === 'string') { date = stringToDate(date); }
  if (Object.prototype.toString.call(date) !== '[object Date]') { return null; }
  const [year, month, day] = [date.getFullYear(), date.getMonth() + 1, date.getDate()];
  const longMonth = ['January', 'February', 'March', 'April', 'May', 'June', 'July',
    'August', 'September', 'October', 'November', 'December'][date.getMonth()];
  const shortMonth = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul',
    'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][date.getMonth()];
  const longDay = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][date.getDay()];
  const shortDay = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][date.getDay()];
  return options.format
    .replace(/YYYY/ig, year + '')
    .replace(/YY/ig, (year + '').slice(-2))
    .replace(/MMMM/ig, longMonth)
    .replace(/MMM/ig, shortMonth)
    .replace(/MM/ig, ('0' + month).slice(-2))
    .replace(/M/ig, month + '')
    .replace(/DDDD/ig, longDay)
    .replace(/DDD/ig, shortDay)
    .replace(/DD/ig, ('0' + day).slice(-2))
    .replace(/D/ig, day + '')
    .replace(/DS/ig, day + ordinal(day));
}

export function ordinal(number: number|string): string {
  if (typeof number === 'number') { number = number + ''; }
  const last = number.slice(-1);
  const nextToLast = number.slice(-2, 1);
  return last === '1' && nextToLast !== '1' ? 'st' :
         last === '2' && nextToLast !== '1' ? 'nd' :
         last === '3' && nextToLast !== '1' ? 'rd' : 'th';
}

/**
 * 'stringToDate' function
 *
 * @param  {string} dateString
 * @return {Date}
 */
export function stringToDate(dateString: string): Date {
  const getDate: string = findDate(dateString);
  if (!getDate) { return null; }
  let dateParts: number[] = [];
  // Split x-y-z to [x, y, z]
  if (/^\d+[^\d]\d+[^\d]\d+$/.test(getDate)) {
    dateParts = getDate.split(/[^\d]/).map(part => +part);
  // Split xxxxyyzz to [xxxx, yy, zz]
  } else if (/^\d{8}$/.test(getDate)) {
    dateParts = [+getDate.slice(0, 4), +getDate.slice(4, 6), +getDate.slice(6)];
  }
  const thisYear = +(new Date().getFullYear() + '').slice(-2);
  // Check for [YYYY, MM, DD]
  if (dateParts[0] > 1000 && dateParts[0] < 2100 && dateParts[1] <= 12 && dateParts[2] <= 31) {
    return new Date(dateParts[0], dateParts[1] - 1, dateParts[2]);
  // Check for [MM, DD, YYYY]
  } else if (dateParts[0] <= 12 && dateParts[1] <= 31 && dateParts[2] > 1000 && dateParts[2] < 2100) {
    return new Date(dateParts[2], dateParts[0] - 1, dateParts[1]);
  // Check for [MM, DD, YY]
  } else if (dateParts[0] <= 12 && dateParts[1] <= 31 && dateParts[2] < 100) {
    const year = (dateParts[2] <= thisYear ? 2000 : 1900) + dateParts[2];
    return new Date(year, dateParts[0] - 1, dateParts[1]);
  // Check for [YY, MM, DD]
  } else if (dateParts[0] < 100 && dateParts[1] <= 12 && dateParts[2] <= 31) {
    const year = (dateParts[0] <= thisYear ? 2000 : 1900) + dateParts[0];
    return new Date(year, dateParts[1] - 1, dateParts[2]);
  }
  return null;
}

/**
 * 'findDate' function
 *
 * @param  {string} text
 * @return {string}
 */
export function findDate(text: string): string {
  if (!text) { return null; }
  let foundDate: any[];
  // Match ...YYYY-MM-DD...
  foundDate = text.match(/(?:19|20)\d\d[-_\\\/\. ](?:0?\d|1[012])[-_\\\/\. ](?:[012]?\d|3[01])(?!\d)/);
  if (foundDate) { return foundDate[0]; }
  // Match ...MM-DD-YYYY...
  foundDate = text.match(/(?:[012]?\d|3[01])[-_\\\/\. ](?:0?\d|1[012])[-_\\\/\. ](?:19|20)\d\d(?!\d)/);
  if (foundDate) { return foundDate[0]; }
  // Match MM-DD-YY...
  foundDate = text.match(/^(?:[012]?\d|3[01])[-_\\\/\. ](?:0?\d|1[012])[-_\\\/\. ]\d\d(?!\d)/);
  if (foundDate) { return foundDate[0]; }
  // Match YY-MM-DD...
  foundDate = text.match(/^\d\d[-_\\\/\. ](?:[012]?\d|3[01])[-_\\\/\. ](?:0?\d|1[012])(?!\d)/);
  if (foundDate) { return foundDate[0]; }
  // Match YYYYMMDD...
  foundDate = text.match(/^(?:19|20)\d\d(?:0\d|1[012])(?:[012]\d|3[01])/);
  if (foundDate) { return foundDate[0]; }
}

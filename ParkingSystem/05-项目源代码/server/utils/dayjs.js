const dayjs = require('dayjs');
require('dayjs/locale/zh-cn');

const isSameOrAfter = require('dayjs/plugin/isSameOrAfter');
const isSameOrBefore = require('dayjs/plugin/isSameOrBefore');
const utc = require('dayjs/plugin/utc');

const weekOfYear = require('dayjs/plugin/weekOfYear');

const timezone = require('dayjs/plugin/timezone');

const relativeTime = require('dayjs/plugin/relativeTime');

const duration = require('dayjs/plugin/duration');

const customParseFormat = require('dayjs/plugin/customParseFormat');

const localizedFormat = require('dayjs/plugin/localizedFormat');

dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);
dayjs.extend(utc);
dayjs.extend(weekOfYear);
dayjs.extend(timezone);
dayjs.extend(relativeTime);
dayjs.extend(duration);
dayjs.extend(customParseFormat);
dayjs.extend(localizedFormat);

dayjs.locale('zh-cn');

module.exports = dayjs;

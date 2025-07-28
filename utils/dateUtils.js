/**
 * 日期工具函数
 */

/**
 * 格式化日期为标准格式 YYYY-MM-DD
 * @param {string|Date} dateString - 日期字符串或Date对象
 * @returns {string} 格式化后的日期字符串
 */
export const formatDate = (dateString) => {
  if (!dateString) return '未知日期';
  
  const date = new Date(dateString);
  return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
};

/**
 * 计算相对时间（如"刚刚"、"一天前"等）
 * @param {string|Date} dateString - 日期字符串或Date对象
 * @returns {string} 相对时间描述
 */
export const getRelativeTime = (dateString) => {
  if (!dateString) return '未知时间';
  
  const date = new Date(dateString);
  const now = new Date();
  
  // 计算时间差（毫秒）
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / (60 * 1000));
  const diffHours = Math.floor(diffMs / (60 * 60 * 1000));
  const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000));
  
  // 返回相应的相对时间描述
  if (diffMins < 5) {
    return '刚刚';
  } else if (diffMins < 60) {
    return `${diffMins}分钟前`;
  } else if (diffHours < 24) {
    return `${diffHours}小时前`;
  } else if (diffDays === 1) {
    return '一天前';
  } else if (diffDays === 2) {
    return '二天前';
  } else if (diffDays === 3) {
    return '三天前';
  } else if (diffDays <= 7) {
    return `${diffDays}天前`;
  } else if (diffDays <= 30) {
    return '一周前';
  } else {
    return formatDate(date);
  }
}; 
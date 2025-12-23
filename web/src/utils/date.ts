/**
 * Format date to Thai locale string
 * รองรับทั้ง "2025-12-23" และ "2025-12-23T00:00:00.000+00:00"
 */
export function formatThaiDate(dateString: string): string {
  if (!dateString) return '';
  
  // ถ้าเป็น ISO format เต็ม ให้ใช้ตรงๆ
  // ถ้าเป็นแค่ YYYY-MM-DD ให้เติม T00:00:00 เพื่อป้องกัน timezone shift
  const date = dateString.includes('T') 
    ? new Date(dateString)
    : new Date(dateString + 'T00:00:00');
    
  if (isNaN(date.getTime())) return dateString;
  
  return date.toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Format date to YYYY-MM-DD (Local timezone)
 */
export function formatDateInput(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Get today's date in YYYY-MM-DD format (Local timezone)
 */
export function getToday(): string {
  return formatDateInput(new Date());
}

/**
 * Format number with Thai Baht
 */
export function formatMoney(amount: number): string {
  return new Intl.NumberFormat('th-TH', {
    style: 'currency',
    currency: 'THB',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Get month name in Thai
 */
export function getThaiMonthName(month: number): string {
  const months = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน',
    'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม',
    'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
  ];
  return months[month - 1] || '';
}

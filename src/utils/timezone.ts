/**
 * Converts an ISO date string to a format suitable for datetime-local input (YYYY-MM-DDThh:mm)
 * adjusting for Kuwait Time (UTC+3)
 */
export function getKuwaitDateTimeInputValue(isoString: string): string {
  if (!isoString) return ''
  
  const date = new Date(isoString)
  
  // Kuwait is UTC+3. toISOString() returns UTC.
  // We add 3 hours to the date so that toISOString()'s output (when sliced) 
  // represents the Kuwait local time.
  const kuwaitOffset = 3 * 60 * 60 * 1000
  const kuwaitDate = new Date(date.getTime() + kuwaitOffset)
  
  return kuwaitDate.toISOString().slice(0, 16)
}

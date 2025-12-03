/**
 * Day Selection Utilities
 *
 * Provides functions for managing delivery day selection in the onboarding flow.
 */

/**
 * Day code constants for delivery schedule
 */
export const DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const

export type DayCode = (typeof DAYS)[number]

/**
 * All days array for "every day" selection
 */
export const ALL_DAYS: DayCode[] = [...DAYS]

/**
 * Toggles a day in the selected days array.
 * If the day is already selected, it is removed.
 * If the day is not selected, it is added.
 *
 * @param selectedDays - Current array of selected day codes
 * @param day - The day code to toggle
 * @returns A new array with the day toggled
 *
 * Requirements: 3.2
 */
export function toggleDay(selectedDays: DayCode[], day: DayCode): DayCode[] {
  if (selectedDays.includes(day)) {
    return selectedDays.filter(d => d !== day)
  }
  return [...selectedDays, day]
}

/**
 * Toggles all days on or off.
 * If all days are currently selected, returns an empty array.
 * Otherwise, returns all days selected.
 *
 * @param selectedDays - Current array of selected day codes
 * @returns Either all days or an empty array
 *
 * Requirements: 3.3
 */
export function toggleAllDays(selectedDays: DayCode[]): DayCode[] {
  const allSelected = DAYS.every(day => selectedDays.includes(day))
  return allSelected ? [] : [...ALL_DAYS]
}

/**
 * Checks if all days are currently selected.
 *
 * @param selectedDays - Current array of selected day codes
 * @returns true if all 7 days are selected
 */
export function areAllDaysSelected(selectedDays: DayCode[]): boolean {
  return DAYS.every(day => selectedDays.includes(day))
}

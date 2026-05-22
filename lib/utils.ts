import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Strips citation markup from AI-generated text
 * Removes <cite>...</cite> tags and [1], [2] style references
 */
export function stripCitations(text: string): string {
  if (!text) return text
  return text
    .replace(/<cite[^>]*>(.*?)<\/cite>/gi, '$1') // Remove cite tags, keep inner text
    .replace(/<\/?cite[^>]*>/gi, '') // Remove any unclosed cite tags
    .replace(/\[\d+(?:[-,]\d+)*\]/g, '') // Remove [1], [1-3], [1,2,3] style refs
    .replace(/\s{2,}/g, ' ') // Clean up extra spaces
    .trim()
}

/**
 * NEXORA Centralized Branding Configuration
 * The Regional Computing Challenge
 */

export const BRAND_CONFIG = {
  name: 'NEXORA',
  subtitle: 'THE REGIONAL COMPUTING CHALLENGE',
  tagline: 'Challenge your knowledge. Prove your intelligence.',
  shortDescription: 'A premier regional university-level computing competition testing core computer science disciplines, problem-solving speed, and algorithmic excellence.',
  fullDescription: 'NEXORA is a premier regional university computing competition designed to challenge students\' technical mastery, algorithmic problem-solving, speed, accuracy, and collaborative engineering across seven core computer science subjects.',
  registrationPrefix: 'NEX',
  edition: '2025',
  locale: 'en_PK',
  timezone: 'Asia/Karachi',
  copyrightYear: new Date().getFullYear(),
  contactEmail: 'organizer@nexora.edu',
} as const

export interface DeveloperCredit {
  name: string
  regNo: string
  registrationNumber?: string
  title: string
  role?: string
  linkedinUrl: string
  envKey: string
}

export function getDevelopers(): DeveloperCredit[] {
  return [
    {
      name: 'Esha Minahil',
      regNo: 'SP24-BSE-010',
      registrationNumber: 'SP24-BSE-010',
      title: 'Developer',
      role: 'Developer',
      linkedinUrl:
        process.env.NEXT_PUBLIC_DEVELOPER_ESHA_LINKEDIN_URL ||
        process.env.NEXT_PUBLIC_DEVELOPER_LINKEDIN_URL ||
        '#configure-linkedin-url',
      envKey: 'NEXT_PUBLIC_DEVELOPER_ESHA_LINKEDIN_URL',
    },
    {
      name: 'Seerat Rauf',
      regNo: 'SP24-BSE-027',
      registrationNumber: 'SP24-BSE-027',
      title: 'Developer',
      role: 'Developer',
      linkedinUrl:
        process.env.NEXT_PUBLIC_DEVELOPER_SEERAT_LINKEDIN_URL ||
        '#configure-linkedin-url',
      envKey: 'NEXT_PUBLIC_DEVELOPER_SEERAT_LINKEDIN_URL',
    },
  ]
}

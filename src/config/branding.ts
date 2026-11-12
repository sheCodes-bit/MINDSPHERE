/**
 * COMSATS VSPARK QUIZ COMPETITION — Centralized Branding Configuration
 * Theme, fonts and imagery matched to the VSpark reference site.
 */

export const BRAND_CONFIG = {
  name: 'COMSATS VSPARK',
  subtitle: 'QUIZ COMPETITION',
  tagline: 'Challenge your knowledge. Prove your intelligence.',
  shortDescription: 'The COMSATS University Islamabad CS Department quiz competition testing core computer science disciplines, problem-solving speed, and algorithmic excellence.',
  fullDescription: 'COMSATS VSPARK Quiz Competition is a university-level computing challenge designed to test students\' technical mastery, algorithmic problem-solving, speed, accuracy, and collaborative engineering across seven core computer science subjects.',
  registrationPrefix: 'VSPARK',
  edition: '2026',
  locale: 'en_PK',
  timezone: 'Asia/Karachi',
  copyrightYear: new Date().getFullYear(),
  contactEmail: 'hodcs@cuivehari.edu.pk',
  university: 'COMSATS University Islamabad',
  campus: 'Vehari Campus',
  address: 'CUI Vehari, Punjab, Pakistan',
  phone: '(067) 3602803',
  website: 'ww2.comsats.edu.pk/cs_vhr',
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
        'https://www.linkedin.com/in/seerat-rauf-37b30b387',
      envKey: 'NEXT_PUBLIC_DEVELOPER_SEERAT_LINKEDIN_URL',
    },
  ]
}

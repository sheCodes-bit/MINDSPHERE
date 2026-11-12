import { describe, it, expect, vi } from 'vitest'
import Papa from 'papaparse'
import { generateRegistrationRef, formatTimeLeft, getTeamStatusColor } from '@/lib/utils'
import { getDevelopers, BRAND_CONFIG } from '@/config/branding'
import {
  rankTeams,
  evaluateRound1Qualification,
  evaluateRound2Qualification,
  evaluateRound3Qualification,
  evaluateRound4Champion,
  type TeamScoreEntry,
} from '@/lib/scoring'
import { teamRegistrationSchema, questionSchema } from '@/lib/validations/schemas'

describe('COMSATS VSPARK Integration & Business Logic Suite', () => {
  // ── 1. Branding & Developer Attribution Verification ─────────────────────
  describe('Branding & Mandatory Developer Attribution', () => {
    it('provides correct brand name and academic competition title', () => {
      expect(BRAND_CONFIG.name).toBe('COMSATS VSPARK')
      expect(BRAND_CONFIG.subtitle).toBe('QUIZ COMPETITION')
      expect(BRAND_CONFIG.tagline).toBe('Challenge your knowledge. Prove your intelligence.')
    })

    it('contains mandatory developer credits for Esha Minahil and Seerat Rauf', () => {
      const devs = getDevelopers()
      expect(devs).toHaveLength(2)

      const esha = devs.find(d => d.name === 'Esha Minahil')
      const seerat = devs.find(d => d.name === 'Seerat Rauf')

      expect(esha).toBeDefined()
      expect(esha?.regNo).toBe('SP24-BSE-010')
      expect(esha?.title).toBe('Developer')
      expect(esha?.envKey).toBe('NEXT_PUBLIC_DEVELOPER_ESHA_LINKEDIN_URL')
      expect(typeof esha?.linkedinUrl).toBe('string')

      expect(seerat).toBeDefined()
      expect(seerat?.regNo).toBe('SP24-BSE-027')
      expect(seerat?.title).toBe('Developer')
      expect(seerat?.envKey).toBe('NEXT_PUBLIC_DEVELOPER_SEERAT_LINKEDIN_URL')
      expect(typeof seerat?.linkedinUrl).toBe('string')
    })
  })

  // ── 2. Registration Reference Generation ─────────────────────────────────
  describe('Registration Reference Generation', () => {
    it('generates registration reference with format VSPARK-YYYY-XXXXX', () => {
      const ref = generateRegistrationRef()
      const currentYear = new Date().getFullYear().toString()
      const pattern = new RegExp(`^VSPARK-${currentYear}-\\d{5}$`)
      expect(pattern.test(ref)).toBe(true)
    })

    it('generates distinct references across iterations', () => {
      const set = new Set<string>()
      for (let i = 0; i < 10; i++) {
        set.add(generateRegistrationRef())
      }
      expect(set.size).toBe(10)
    })
  })

  // ── 3. Question Bank CSV Import Parsing & Schema Validation ──────────────
  describe('Question Bank CSV Parser Logic', () => {
    const csvContent = `Subject,Question,Option A,Option B,Option C,Option D,Correct Option,Difficulty,Explanation
Data Structures & Algorithms,What is the time complexity of QuickSort in the average case?,O(n),O(n log n),O(n^2),O(log n),B,medium,QuickSort partitions around a pivot in O(n) across log n recursion levels.
Database Systems,Which SQL clause is used to filter groups created by GROUP BY?,WHERE,HAVING,ORDER BY,FILTER,HAVING,easy,HAVING filters grouped aggregates whereas WHERE filters rows.
Operating Systems,Which scheduling algorithm is non-preemptive?,Round Robin,Shortest Job First (Non-preemptive),SRTF,Priority Preemptive,B,hard,Standard SJF runs each scheduled job to completion without preemption.`

    it('parses valid multi-row CSV into standardized question items', () => {
      const parsed = Papa.parse<any>(csvContent, { header: true, skipEmptyLines: true })
      expect(parsed.data.length).toBe(3)

      const firstRow = parsed.data[0]
      const options: Array<{ text: string; is_correct: boolean }> = [
        { text: firstRow['Option A'].trim(), is_correct: firstRow['Correct Option'].trim() === 'A' },
        { text: firstRow['Option B'].trim(), is_correct: firstRow['Correct Option'].trim() === 'B' },
        { text: firstRow['Option C'].trim(), is_correct: firstRow['Correct Option'].trim() === 'C' },
        { text: firstRow['Option D'].trim(), is_correct: firstRow['Correct Option'].trim() === 'D' },
      ]

      expect(options).toHaveLength(4)
      expect(options.filter(o => o.is_correct)).toHaveLength(1)
      expect(options[1].is_correct).toBe(true)
      expect(options[1].text).toBe('O(n log n)')
    })

    it('validates question schema with exactly one correct option', () => {
      const validQuestion = {
        subject_id: '11111111-1111-1111-1111-111111111111',
        question_text: 'What is the worst-case space complexity of Depth First Search on a tree?',
        question_type: 'mcq_single' as const,
        status: 'published' as const,
        difficulty: 'medium' as const,
        explanation: 'In the worst case (skewed tree), the recursion stack takes O(h) space where h = n.',
        options: [
          { option_text: 'O(1)', option_order: 0, is_correct: false },
          { option_text: 'O(n)', option_order: 1, is_correct: true },
          { option_text: 'O(n log n)', option_order: 2, is_correct: false },
          { option_text: 'O(2^n)', option_order: 3, is_correct: false },
        ],
      }
      expect(questionSchema.safeParse(validQuestion).success).toBe(true)
    })

    it('rejects question when multiple options are marked correct', () => {
      const invalidQuestion = {
        subject_id: '11111111-1111-1111-1111-111111111111',
        question_text: 'Which data structures have LIFO behavior?',
        question_type: 'mcq_single' as const,
        status: 'published' as const,
        difficulty: 'easy' as const,
        options: [
          { option_text: 'Stack', option_order: 0, is_correct: true },
          { option_text: 'Call stack', option_order: 1, is_correct: true },
          { option_text: 'Queue', option_order: 2, is_correct: false },
          { option_text: 'Binary tree', option_order: 3, is_correct: false },
        ],
      }
      const res = questionSchema.safeParse(invalidQuestion)
      expect(res.success).toBe(false)
      if (!res.success) {
        expect(res.error.issues[0].message).toContain('Exactly one option must be marked as correct')
      }
    })
  })

  // ── 4. Team Registration & Member Uniqueness Logic ───────────────────────
  describe('Team Registration Business Logic', () => {
    it('accepts team with 2 distinct members', () => {
      const payload = {
        team_name: 'Bit Shifters',
        institution_name: 'FAST-NUCES',
        campus: 'Islamabad',
        region: 'Federal',
        contact_email: 'captain@isb.nu.edu.pk',
        contact_phone: '+923001122334',
        members: [
          { full_name: 'Ali Khan', student_id: '2024-CS-001', university_email: 'ali@isb.nu.edu.pk' },
          { full_name: 'Sara Ahmed', student_id: '2024-CS-002', university_email: 'sara@isb.nu.edu.pk' },
        ],
      }
      const parsed = teamRegistrationSchema.safeParse(payload)
      expect(parsed.success).toBe(true)
    })

    it('detects duplicate student IDs in a team submission', () => {
      const members = [
        { full_name: 'Ali Khan', student_id: '2024-CS-001', university_email: 'ali@isb.nu.edu.pk' },
        { full_name: 'Duplicate Ali', student_id: '2024-CS-001', university_email: 'ali2@isb.nu.edu.pk' },
      ]
      const ids = new Set(members.map(m => m.student_id.toLowerCase().trim()))
      expect(ids.size).toBeLessThan(members.length)
    })

    it('detects duplicate university emails in a team submission', () => {
      const members = [
        { full_name: 'Member A', student_id: 'ID-001', university_email: 'dup@uni.edu' },
        { full_name: 'Member B', student_id: 'ID-002', university_email: 'dup@uni.edu' },
      ]
      const emails = new Set(members.map(m => m.university_email.toLowerCase().trim()))
      expect(emails.size).toBeLessThan(members.length)
    })
  })

  // ── 5. Full 4-Round Competition Simulation ───────────────────────────────
  describe('Full 4-Round Competition Simulation', () => {
    // 10 registered teams
    const registeredTeams: TeamScoreEntry[] = Array.from({ length: 10 }, (_, i) => ({
      teamId: `team-${i + 1}`,
      teamName: `Team ${String.fromCharCode(65 + i)}`,
      registrationReference: `VSPARK-2026-${String(i + 1).padStart(5, '0')}`,
      totalScore: 0,
    }))

    it('simulates Round 1: 5 MCQs (30s each, +1 / 0), qualifies top 80% (8 teams)', () => {
      // Simulate Round 1 scores
      const round1Scores = [5, 5, 4, 4, 3, 3, 2, 2, 1, 0]
      const teamsWithR1 = registeredTeams.map((t, idx) => ({
        ...t,
        totalScore: round1Scores[idx],
      }))

      const ranked = rankTeams(teamsWithR1)
      const r1Result = evaluateRound1Qualification(ranked, 80, 'include_all')
      const qualified = r1Result.filter(t => t.isQualified)

      expect(qualified.length).toBe(8)
      expect(qualified.map(t => t.teamId)).toContain('team-1')
      expect(qualified.map(t => t.teamId)).toContain('team-8')
      expect(r1Result.find(t => t.teamId === 'team-9')?.isQualified).toBe(false)
      expect(r1Result.find(t => t.teamId === 'team-10')?.isQualified).toBe(false)
    })

    it('simulates Round 2: 5 MCQs (45s each, +1 / 0), qualifies top 4 teams', () => {
      // 8 qualified teams from Round 1 compete in Round 2
      const round2Scores = [5, 4, 4, 3, 2, 2, 1, 1]
      const r2Teams: TeamScoreEntry[] = Array.from({ length: 8 }, (_, i) => ({
        teamId: `team-${i + 1}`,
        teamName: `Team ${String.fromCharCode(65 + i)}`,
        registrationReference: `VSPARK-2026-${String(i + 1).padStart(5, '0')}`,
        totalScore: round2Scores[i],
      }))

      const ranked = rankTeams(r2Teams)
      const r2Result = evaluateRound2Qualification(ranked, 4, 'tiebreaker')
      const semifinalists = r2Result.filter(t => t.isQualified)

      expect(semifinalists.length).toBe(4)
      expect(semifinalists[0].teamName).toBe('Team A')
      expect(semifinalists[3].teamName).toBe('Team D')
    })

    it('simulates Round 3: Rapid Fire (3m master clock, 3s auto-skip), top 2 advance to Final', () => {
      // Top 4 teams from Round 2
      const round3Teams: TeamScoreEntry[] = [
        { teamId: 'team-1', teamName: 'Team A', registrationReference: 'VSPARK-2026-00001', totalScore: 18 },
        { teamId: 'team-2', teamName: 'Team B', registrationReference: 'VSPARK-2026-00002', totalScore: 14 },
        { teamId: 'team-3', teamName: 'Team C', registrationReference: 'VSPARK-2026-00003', totalScore: 11 },
        { teamId: 'team-4', teamName: 'Team D', registrationReference: 'VSPARK-2026-00004', totalScore: 9 },
      ]

      const ranked = rankTeams(round3Teams)
      const r3Result = evaluateRound3Qualification(ranked, 2)
      const finalists = r3Result.filter(t => t.isQualified)

      expect(finalists.length).toBe(2)
      expect(finalists[0].teamId).toBe('team-1')
      expect(finalists[1].teamId).toBe('team-2')
    })

    it('simulates Round 4: Grand Final Buzzer (+1 correct, -0.5 penalty), decides Champion', () => {
      // Finalists Team A and Team B
      // Team A: 7 correct (+7.0), 1 incorrect (-0.5) = 6.5
      // Team B: 5 correct (+5.0), 2 incorrect (-1.0) = 4.0
      const finalTeams: TeamScoreEntry[] = [
        { teamId: 'team-1', teamName: 'Team A', registrationReference: 'VSPARK-2026-00001', totalScore: 6.5 },
        { teamId: 'team-2', teamName: 'Team B', registrationReference: 'VSPARK-2026-00002', totalScore: 4.0 },
      ]

      const ranked = rankTeams(finalTeams)
      const r4Result = evaluateRound4Champion(ranked)

      expect(r4Result[0].teamName).toBe('Team A')
      expect(r4Result[0].isQualified).toBe(true)
      expect(r4Result[0].qualificationNotes).toContain('Grand Champion')

      expect(r4Result[1].teamName).toBe('Team B')
      expect(r4Result[1].isQualified).toBe(false)
      expect(r4Result[1].qualificationNotes).toBe('Runner Up')
    })

    it('handles Round 4 tie and triggers sudden-death tiebreaker note', () => {
      const tiedFinalTeams: TeamScoreEntry[] = [
        { teamId: 'team-1', teamName: 'Team A', registrationReference: 'VSPARK-2026-00001', totalScore: 5.0 },
        { teamId: 'team-2', teamName: 'Team B', registrationReference: 'VSPARK-2026-00002', totalScore: 5.0 },
      ]

      const ranked = rankTeams(tiedFinalTeams)
      const r4Result = evaluateRound4Champion(ranked)

      expect(r4Result[0].isQualified).toBe(true)
      expect(r4Result[0].qualificationNotes).toContain('Sudden death')
      expect(r4Result[1].isQualified).toBe(true)
      expect(r4Result[1].qualificationNotes).toContain('Sudden death')
    })
  })

  // ── 6. UI Helpers & Formatting ───────────────────────────────────────────
  describe('UI & Status Helpers', () => {
    it('returns appropriate CSS classes for all team statuses', () => {
      expect(getTeamStatusColor('approved')).toBe('badge-status-approved')
      expect(getTeamStatusColor('rejected')).toBe('badge-status-rejected')
      expect(getTeamStatusColor('submitted')).toBe('badge-status-submitted')
      expect(getTeamStatusColor('under_review')).toBe('badge-status-under_review')
      expect(getTeamStatusColor('waitlisted')).toBe('badge-status-waitlisted')
      expect(getTeamStatusColor('disqualified')).toBe('badge-status-disqualified')
      expect(getTeamStatusColor('unknown_status')).toBe('badge-status-draft')
    })

    it('formats countdown timer accurately', () => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2026-01-01T00:00:00Z'))
      const now = new Date()
      const future = new Date(now.getTime() + 125 * 1000) // 2 minutes 5 seconds
      const formatted = formatTimeLeft(future)
      expect(formatted).toBe('02:05')

      const past = new Date(now.getTime() - 10000)
      expect(formatTimeLeft(past)).toBe('00:00')
      vi.useRealTimers()
    })
  })
})

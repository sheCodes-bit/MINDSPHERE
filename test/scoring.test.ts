import { describe, it, expect } from 'vitest'
import {
  rankTeams,
  evaluateRound1Qualification,
  evaluateRound2Qualification,
  evaluateRound3Qualification,
  evaluateRound4Champion,
  type TeamScoreEntry,
} from '@/lib/scoring'

describe('NEXORA Scoring & Qualification Engine', () => {
  const sampleTeams: TeamScoreEntry[] = [
    { teamId: 't1', teamName: 'Alpha Coders', registrationReference: 'NEX-2025-00001', totalScore: 5 },
    { teamId: 't2', teamName: 'Beta Bytes',   registrationReference: 'NEX-2025-00002', totalScore: 4 },
    { teamId: 't3', teamName: 'Gamma Geeks',  registrationReference: 'NEX-2025-00003', totalScore: 4 },
    { teamId: 't4', teamName: 'Delta Devs',   registrationReference: 'NEX-2025-00004', totalScore: 3 },
    { teamId: 't5', teamName: 'Epsilon Elite', registrationReference: 'NEX-2025-00005', totalScore: 1 },
  ]

  describe('rankTeams', () => {
    it('correctly sorts teams in descending order of score and assigns ranks', () => {
      const ranked = rankTeams(sampleTeams)
      expect(ranked[0].teamName).toBe('Alpha Coders')
      expect(ranked[0].rank).toBe(1)
      expect(ranked[0].isTied).toBe(false)

      expect(ranked[1].rank).toBe(2)
      expect(ranked[2].rank).toBe(2)
      expect(ranked[1].isTied).toBe(true)
      expect(ranked[2].isTied).toBe(true)

      expect(ranked[3].rank).toBe(4)
      expect(ranked[4].rank).toBe(5)
    })
  })

  describe('Round 1 Qualification (Top 80%)', () => {
    it('qualifies top 80% of teams (4 of 5 teams)', () => {
      const ranked = rankTeams(sampleTeams)
      const qualified = evaluateRound1Qualification(ranked, 80, 'include_all')

      // Cutoff count is ceil(5 * 0.8) = 4
      const qualifiedTeams = qualified.filter(t => t.isQualified)
      expect(qualifiedTeams.length).toBe(4)
      expect(qualified.find(t => t.teamId === 't5')?.isQualified).toBe(false)
    })

    it('handles ties at cutoff boundary with include_all policy', () => {
      const tiedTeams: TeamScoreEntry[] = [
        { teamId: 't1', teamName: 'Team 1', registrationReference: 'NEX-2026-00001', totalScore: 10 },
        { teamId: 't2', teamName: 'Team 2', registrationReference: 'NEX-2026-00002', totalScore: 8 },
        { teamId: 't3', teamName: 'Team 3', registrationReference: 'NEX-2026-00003', totalScore: 5 },
        { teamId: 't4', teamName: 'Team 4', registrationReference: 'NEX-2026-00004', totalScore: 5 }, // tied at cutoff
        { teamId: 't5', teamName: 'Team 5', registrationReference: 'NEX-2026-00005', totalScore: 2 },
      ]
      const ranked = rankTeams(tiedTeams)
      const result = evaluateRound1Qualification(ranked, 60, 'include_all') // ceil(5 * 0.6) = 3
      // Both team 3 and team 4 should qualify because of include_all
      expect(result.find(t => t.teamId === 't3')?.isQualified).toBe(true)
      expect(result.find(t => t.teamId === 't4')?.isQualified).toBe(true)
    })
  })

  describe('Round 2 Qualification (Top 4 teams)', () => {
    it('qualifies exactly top 4 teams for Round 3', () => {
      const ranked = rankTeams(sampleTeams)
      const qualified = evaluateRound2Qualification(ranked, 4, 'tiebreaker')
      const passed = qualified.filter(t => t.isQualified)
      expect(passed.length).toBe(4)
      expect(passed.map(t => t.teamId)).toContain('t1')
      expect(passed.map(t => t.teamId)).toContain('t2')
      expect(passed.map(t => t.teamId)).toContain('t3')
      expect(passed.map(t => t.teamId)).toContain('t4')
    })
  })

  describe('Round 3 Qualification (Top 2 Finalists)', () => {
    it('qualifies top 2 teams for the Grand Championship Final', () => {
      const round3Teams: TeamScoreEntry[] = [
        { teamId: 't1', teamName: 'Team A', registrationReference: 'NEX-2026-00001', totalScore: 18 },
        { teamId: 't2', teamName: 'Team B', registrationReference: 'NEX-2026-00002', totalScore: 15 },
        { teamId: 't3', teamName: 'Team C', registrationReference: 'NEX-2026-00003', totalScore: 12 },
        { teamId: 't4', teamName: 'Team D', registrationReference: 'NEX-2026-00004', totalScore: 10 },
      ]
      const ranked = rankTeams(round3Teams)
      const qualified = evaluateRound3Qualification(ranked, 2)
      const finalists = qualified.filter(t => t.isQualified)
      expect(finalists.length).toBe(2)
      expect(finalists[0].teamName).toBe('Team A')
      expect(finalists[1].teamName).toBe('Team B')
      expect(finalists[0].qualificationNotes).toContain('Finalist')
    })
  })

  describe('Round 4 Championship (Grand Champion)', () => {
    it('identifies the clear Grand Champion', () => {
      const finalTeams: TeamScoreEntry[] = [
        { teamId: 't1', teamName: 'Team A', registrationReference: 'NEX-2026-00001', totalScore: 8.5 },
        { teamId: 't2', teamName: 'Team B', registrationReference: 'NEX-2026-00002', totalScore: 6.0 },
      ]
      const ranked = rankTeams(finalTeams)
      const result = evaluateRound4Champion(ranked)

      expect(result[0].isQualified).toBe(true)
      expect(result[0].qualificationNotes).toContain('Grand Champion')
      expect(result[1].isQualified).toBe(false)
      expect(result[1].qualificationNotes).toContain('Runner Up')
    })

    it('flags tied winners for sudden-death buzzer tiebreaker', () => {
      const finalTeamsTied: TeamScoreEntry[] = [
        { teamId: 't1', teamName: 'Team A', registrationReference: 'NEX-2026-00001', totalScore: 7.0 },
        { teamId: 't2', teamName: 'Team B', registrationReference: 'NEX-2026-00002', totalScore: 7.0 },
      ]
      const ranked = rankTeams(finalTeamsTied)
      const result = evaluateRound4Champion(ranked)

      expect(result[0].qualificationNotes).toContain('Sudden death')
      expect(result[1].qualificationNotes).toContain('Sudden death')
    })
  })
})

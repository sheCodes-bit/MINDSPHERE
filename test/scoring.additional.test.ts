/**
 * NEXORA — Additional Scoring Engine Tests
 * Covers edge cases, empty inputs, single-team scenarios, and
 * tie-breaker policies not covered by the base scoring test file.
 */
import { describe, it, expect } from 'vitest'
import {
  rankTeams,
  evaluateRound1Qualification,
  evaluateRound2Qualification,
  evaluateRound3Qualification,
  evaluateRound4Champion,
  type TeamScoreEntry,
} from '@/lib/scoring'

// ── Edge cases ───────────────────────────────────────────────────────────────

describe('rankTeams — edge cases', () => {
  it('returns an empty array for empty input', () => {
    expect(rankTeams([])).toEqual([])
  })

  it('assigns rank 1 to a single team with no tie flag', () => {
    const single: TeamScoreEntry[] = [
      { teamId: 't1', teamName: 'Solo Squad', registrationReference: 'NEX-2026-00001', totalScore: 5 },
    ]
    const ranked = rankTeams(single)
    expect(ranked).toHaveLength(1)
    expect(ranked[0].rank).toBe(1)
    expect(ranked[0].isTied).toBe(false)
  })

  it('all teams with identical scores are all marked tied', () => {
    const allTied: TeamScoreEntry[] = [
      { teamId: 't1', teamName: 'Team A', registrationReference: 'NEX-2026-00001', totalScore: 3 },
      { teamId: 't2', teamName: 'Team B', registrationReference: 'NEX-2026-00002', totalScore: 3 },
      { teamId: 't3', teamName: 'Team C', registrationReference: 'NEX-2026-00003', totalScore: 3 },
    ]
    const ranked = rankTeams(allTied)
    expect(ranked.every(t => t.isTied)).toBe(true)
    expect(ranked.every(t => t.rank === 1)).toBe(true)
  })

  it('handles decimal scores correctly', () => {
    const decimal: TeamScoreEntry[] = [
      { teamId: 't1', teamName: 'Team A', registrationReference: 'NEX-2026-00001', totalScore: 4.5 },
      { teamId: 't2', teamName: 'Team B', registrationReference: 'NEX-2026-00002', totalScore: 4.0 },
      { teamId: 't3', teamName: 'Team C', registrationReference: 'NEX-2026-00003', totalScore: 3.5 },
    ]
    const ranked = rankTeams(decimal)
    expect(ranked[0].totalScore).toBe(4.5)
    expect(ranked[0].rank).toBe(1)
    expect(ranked[1].rank).toBe(2)
    expect(ranked[2].rank).toBe(3)
  })
})

// ── Round 1 additional qualification tests ───────────────────────────────────

describe('Round 1 Qualification — additional policies', () => {
  it('returns empty array for empty input', () => {
    expect(evaluateRound1Qualification([])).toEqual([])
  })

  it('qualifies all teams when 100% threshold used', () => {
    const teams: TeamScoreEntry[] = [
      { teamId: 't1', teamName: 'Team A', registrationReference: 'NEX-2026-00001', totalScore: 5 },
      { teamId: 't2', teamName: 'Team B', registrationReference: 'NEX-2026-00002', totalScore: 2 },
    ]
    const ranked = rankTeams(teams)
    const result = evaluateRound1Qualification(ranked, 100, 'include_all')
    expect(result.every(t => t.isQualified)).toBe(true)
  })

  it('exclude_all policy eliminates tied teams at cutoff', () => {
    const teams: TeamScoreEntry[] = [
      { teamId: 't1', teamName: 'Team A', registrationReference: 'NEX-2026-00001', totalScore: 5 },
      { teamId: 't2', teamName: 'Team B', registrationReference: 'NEX-2026-00002', totalScore: 3 },
      { teamId: 't3', teamName: 'Team C', registrationReference: 'NEX-2026-00003', totalScore: 3 },
      { teamId: 't4', teamName: 'Team D', registrationReference: 'NEX-2026-00004', totalScore: 1 },
    ]
    const ranked = rankTeams(teams)
    // 80% of 4 = ceil(3.2) = 4; cutoff score = ranked[3].totalScore = 1
    // All 4 qualify with include_all. With exclude_all at cutoff score 1, t4 is excluded.
    const result80 = evaluateRound1Qualification(ranked, 80, 'exclude_all')
    // Cutoff is 80%, floor(4*0.8)=ceil(4*0.8)=ceil(3.2)=4 — 4 teams qualify, cutoff score = 1
    // t4 has score 1 which equals cutoff → excluded by exclude_all
    const t4 = result80.find(t => t.teamId === 't4')
    expect(t4?.qualificationNotes).toContain('exclude_all')
  })

  it('tiebreaker policy flags tied teams with correct note', () => {
    const teams: TeamScoreEntry[] = [
      { teamId: 't1', teamName: 'A', registrationReference: 'NEX-001', totalScore: 5 },
      { teamId: 't2', teamName: 'B', registrationReference: 'NEX-002', totalScore: 3 },
      { teamId: 't3', teamName: 'C', registrationReference: 'NEX-003', totalScore: 3 },
    ]
    const ranked = rankTeams(teams)
    // 60% of 3 = ceil(1.8) = 2; cutoff = ranked[1].totalScore = 3
    const result = evaluateRound1Qualification(ranked, 60, 'tiebreaker')
    const tiedT2 = result.find(t => t.teamId === 't2')
    const tiedT3 = result.find(t => t.teamId === 't3')
    // Both t2 and t3 are at the cutoff with tiebreaker policy → not qualified, needs tiebreaker
    expect(tiedT2?.isQualified).toBe(false)
    expect(tiedT3?.isQualified).toBe(false)
    expect(tiedT2?.qualificationNotes).toContain('tie-breaker')
  })
})

// ── Round 2 additional tests ─────────────────────────────────────────────────

describe('Round 2 Qualification — additional policies', () => {
  it('returns empty array for empty input', () => {
    expect(evaluateRound2Qualification([])).toEqual([])
  })

  it('include_all policy qualifies all tied teams at cutoff boundary', () => {
    const teams: TeamScoreEntry[] = [
      { teamId: 't1', teamName: 'A', registrationReference: 'NEX-001', totalScore: 5 },
      { teamId: 't2', teamName: 'B', registrationReference: 'NEX-002', totalScore: 4 },
      { teamId: 't3', teamName: 'C', registrationReference: 'NEX-003', totalScore: 4 },
      { teamId: 't4', teamName: 'D', registrationReference: 'NEX-004', totalScore: 4 },
      { teamId: 't5', teamName: 'E', registrationReference: 'NEX-005', totalScore: 2 },
    ]
    const ranked = rankTeams(teams)
    const result = evaluateRound2Qualification(ranked, 4, 'include_all')
    // t1 clearly qualifies; t2, t3, t4 are all tied at score 4 (which is the 4th-place cutoff)
    // include_all should admit all three tied teams
    const qualified = result.filter(t => t.isQualified)
    expect(qualified.length).toBeGreaterThanOrEqual(4)
    expect(result.find(t => t.teamId === 't5')?.isQualified).toBe(false)
  })

  it('with fewer than cutoffCount teams, all qualify', () => {
    const teams: TeamScoreEntry[] = [
      { teamId: 't1', teamName: 'A', registrationReference: 'NEX-001', totalScore: 5 },
      { teamId: 't2', teamName: 'B', registrationReference: 'NEX-002', totalScore: 3 },
    ]
    const ranked = rankTeams(teams)
    const result = evaluateRound2Qualification(ranked, 4, 'tiebreaker')
    expect(result.every(t => t.isQualified)).toBe(true)
  })
})

// ── Round 3 additional tests ─────────────────────────────────────────────────

describe('Round 3 Qualification — additional policies', () => {
  it('returns empty array for empty input', () => {
    expect(evaluateRound3Qualification([])).toEqual([])
  })

  it('flags three-way tie for finalist slot', () => {
    const teams: TeamScoreEntry[] = [
      { teamId: 't1', teamName: 'A', registrationReference: 'NEX-001', totalScore: 10 },
      { teamId: 't2', teamName: 'B', registrationReference: 'NEX-002', totalScore: 8 },
      { teamId: 't3', teamName: 'C', registrationReference: 'NEX-003', totalScore: 8 },
      { teamId: 't4', teamName: 'D', registrationReference: 'NEX-004', totalScore: 8 },
    ]
    const ranked = rankTeams(teams)
    const result = evaluateRound3Qualification(ranked, 2, 'tiebreaker')
    // t1 qualifies clearly; t2/t3/t4 are tied for 2nd slot
    expect(result.find(t => t.teamId === 't1')?.isQualified).toBe(true)
    const tiedNotes = result
      .filter(t => t.teamId !== 't1')
      .map(t => t.qualificationNotes ?? '')
    expect(tiedNotes.some(n => n.includes('tie-breaker'))).toBe(true)
  })
})

// ── Round 4 championship tests ───────────────────────────────────────────────

describe('Round 4 Championship — edge cases', () => {
  it('returns empty array for empty input', () => {
    expect(evaluateRound4Champion([])).toEqual([])
  })

  it('single team is declared champion without tie flag', () => {
    const teams: TeamScoreEntry[] = [
      { teamId: 't1', teamName: 'Sole Competitor', registrationReference: 'NEX-001', totalScore: 5 },
    ]
    const ranked = rankTeams(teams)
    const result = evaluateRound4Champion(ranked)
    expect(result[0].isQualified).toBe(true)
    expect(result[0].qualificationNotes).toContain('Grand Champion')
    expect(result[0].qualificationNotes).not.toContain('Sudden death')
  })

  it('runner up note is set correctly for the losing finalist', () => {
    const teams: TeamScoreEntry[] = [
      { teamId: 't1', teamName: 'Winner', registrationReference: 'NEX-001', totalScore: 9.5 },
      { teamId: 't2', teamName: 'Loser', registrationReference: 'NEX-002', totalScore: 7.0 },
    ]
    const ranked = rankTeams(teams)
    const result = evaluateRound4Champion(ranked)
    expect(result[1].isQualified).toBe(false)
    expect(result[1].qualificationNotes).toContain('Runner Up')
  })
})

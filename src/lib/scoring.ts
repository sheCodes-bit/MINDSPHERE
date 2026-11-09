/**
 * NEXORA Competition Scoring & Qualification Engine
 * Official rules implementation
 */

export interface TeamScoreEntry {
  teamId: string
  teamName: string
  registrationReference: string
  totalScore: number
}

export interface RankedTeamEntry extends TeamScoreEntry {
  rank: number
  isQualified: boolean
  isTied: boolean
  qualificationNotes?: string
}

export type TiePolicy = 'include_all' | 'exclude_all' | 'tiebreaker'

/**
 * Rank teams by score in descending order
 */
export function rankTeams(entries: TeamScoreEntry[]): RankedTeamEntry[] {
  const sorted = [...entries].sort((a, b) => b.totalScore - a.totalScore)

  let currentRank = 1
  return sorted.map((entry, index) => {
    if (index > 0 && entry.totalScore < sorted[index - 1].totalScore) {
      currentRank = index + 1
    }

    const isTied = sorted.filter(s => s.totalScore === entry.totalScore).length > 1

    return {
      ...entry,
      rank: currentRank,
      isQualified: false,
      isTied,
    }
  })
}

/**
 * Round 1 Qualification: Top 80%
 * If tiePolicy is 'include_all', all tied teams at the 80% boundary advance.
 */
export function evaluateRound1Qualification(
  ranked: RankedTeamEntry[],
  percentage = 80,
  tiePolicy: TiePolicy = 'include_all'
): RankedTeamEntry[] {
  if (ranked.length === 0) return []

  const qualifyingCount = Math.ceil((ranked.length * percentage) / 100)
  const cutoffScore = ranked[Math.min(qualifyingCount - 1, ranked.length - 1)].totalScore

  return ranked.map((team) => {
    let isQualified = false
    let notes = ''

    if (team.totalScore > cutoffScore) {
      isQualified = true
      notes = `Qualified in Top ${percentage}%`
    } else if (team.totalScore === cutoffScore) {
      if (tiePolicy === 'include_all') {
        isQualified = true
        notes = team.isTied ? `Qualified (Tied at cutoff, include_all policy)` : `Qualified at cutoff`
      } else if (tiePolicy === 'tiebreaker') {
        isQualified = false
        notes = `Tied at cutoff (${team.totalScore} pts) — requires tie-breaker`
      } else {
        isQualified = false
        notes = `Did not qualify (cutoff policy: exclude_all)`
      }
    } else {
      isQualified = false
      notes = `Eliminated below Top ${percentage}% cutoff`
    }

    return {
      ...team,
      isQualified,
      qualificationNotes: notes,
    }
  })
}

/**
 * Round 2 Qualification: Top 4 teams
 */
export function evaluateRound2Qualification(
  ranked: RankedTeamEntry[],
  cutoffCount = 4,
  tiePolicy: TiePolicy = 'tiebreaker'
): RankedTeamEntry[] {
  if (ranked.length === 0) return []

  const cutoffTeam = ranked[Math.min(cutoffCount - 1, ranked.length - 1)]
  const cutoffScore = cutoffTeam?.totalScore ?? 0

  return ranked.map((team, idx) => {
    let isQualified = false
    let notes = ''

    if (team.totalScore > cutoffScore) {
      isQualified = true
      notes = 'Qualified for Round 3 (Top 4)'
    } else if (team.totalScore === cutoffScore) {
      const teamsAtCutoff = ranked.filter(t => t.totalScore === cutoffScore)
      if (teamsAtCutoff.length === 1 || idx < cutoffCount) {
        if (teamsAtCutoff.length === 1) {
          isQualified = true
          notes = 'Qualified for Round 3 (Top 4)'
        } else {
          isQualified = tiePolicy === 'include_all'
          notes = `Tied at 4th place cutoff (${cutoffScore} pts) — ${tiePolicy === 'tiebreaker' ? 'tie-breaker needed' : 'included'}`
        }
      } else {
        isQualified = tiePolicy === 'include_all'
        notes = `Tied at 4th place cutoff (${cutoffScore} pts) — ${tiePolicy === 'tiebreaker' ? 'tie-breaker needed' : 'excluded'}`
      }
    } else {
      isQualified = false
      notes = 'Did not qualify for Round 3'
    }

    return {
      ...team,
      isQualified,
      qualificationNotes: notes,
    }
  })
}

/**
 * Round 3 Qualification: Top 2 teams (Finalists)
 */
export function evaluateRound3Qualification(
  ranked: RankedTeamEntry[],
  cutoffCount = 2,
  tiePolicy: TiePolicy = 'tiebreaker'
): RankedTeamEntry[] {
  if (ranked.length === 0) return []

  const cutoffTeam = ranked[Math.min(cutoffCount - 1, ranked.length - 1)]
  const cutoffScore = cutoffTeam?.totalScore ?? 0

  return ranked.map((team) => {
    let isQualified = false
    let notes = ''

    if (team.totalScore > cutoffScore) {
      isQualified = true
      notes = 'Finalist — Qualified for Round 4 Championship'
    } else if (team.totalScore === cutoffScore) {
      const teamsAtCutoff = ranked.filter(t => t.totalScore === cutoffScore)
      if (teamsAtCutoff.length === 1) {
        isQualified = true
        notes = 'Finalist — Qualified for Round 4 Championship'
      } else {
        isQualified = tiePolicy === 'include_all'
        notes = `Tied for finalist slot (${cutoffScore} pts) — tie-breaker required`
      }
    } else {
      isQualified = false
      notes = 'Did not advance to Championship Final'
    }

    return {
      ...team,
      isQualified,
      qualificationNotes: notes,
    }
  })
}

/**
 * Round 4 Qualification: Grand Champion (Top 1)
 */
export function evaluateRound4Champion(ranked: RankedTeamEntry[]): RankedTeamEntry[] {
  if (ranked.length === 0) return []

  const highScore = ranked[0]?.totalScore ?? 0
  const tiedWinners = ranked.filter(t => t.totalScore === highScore)

  return ranked.map((team, idx) => {
    if (team.totalScore === highScore) {
      if (tiedWinners.length > 1) {
        return {
          ...team,
          isQualified: true,
          qualificationNotes: 'Tied for 1st Place — Sudden death buzzer question required',
        }
      }
      return {
        ...team,
        isQualified: true,
        qualificationNotes: 'Grand Champion — Winner of NEXORA',
      }
    }
    return {
      ...team,
      isQualified: false,
      qualificationNotes: idx === 1 ? 'Runner Up' : 'Finalist',
    }
  })
}

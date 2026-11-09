const url = 'https://jnenjvcnxsmuqdrdgkja.supabase.co'
const key = 'sb_secret_PL4pxldEckWLrWPzYnLN2w_x-LbYN0L'

const headers = {
  apikey: key,
  Authorization: `Bearer ${key}`,
  'Content-Type': 'application/json',
  Prefer: 'return=representation',
}

const questionsToSeed = [
  // 1. Programming Fundamentals
  {
    subject_id: 'a1b2c3d4-0001-0001-0001-000000000001',
    question_text: 'What will be the output of integer division 7 / 2 in C/C++ or Java?',
    difficulty: 'easy',
    explanation: 'Integer division truncates any fractional portion, yielding 3.',
    status: 'published',
    options: [
      { text: '3.5', is_correct: false },
      { text: '3', is_correct: true },
      { text: '4', is_correct: false },
      { text: '3.0', is_correct: false },
    ],
  },
  {
    subject_id: 'a1b2c3d4-0001-0001-0001-000000000001',
    question_text: 'Which control structure is guaranteed to execute its loop body at least once?',
    difficulty: 'easy',
    explanation: 'A do-while loop evaluates its conditional expression after executing the loop body.',
    status: 'published',
    options: [
      { text: 'while loop', is_correct: false },
      { text: 'for loop', is_correct: false },
      { text: 'do-while loop', is_correct: true },
      { text: 'nested if statement', is_correct: false },
    ],
  },

  // 2. Object Oriented Programming
  {
    subject_id: 'a1b2c3d4-0002-0002-0002-000000000002',
    question_text: 'Which OOP principle is demonstrated by declaring private fields with public getters and setters?',
    difficulty: 'easy',
    explanation: 'Encapsulation restricts direct access to some of an object\'s components and binds data with methods.',
    status: 'published',
    options: [
      { text: 'Inheritance', is_correct: false },
      { text: 'Encapsulation', is_correct: true },
      { text: 'Polymorphism', is_correct: false },
      { text: 'Abstraction', is_correct: false },
    ],
  },
  {
    subject_id: 'a1b2c3d4-0002-0002-0002-000000000002',
    question_text: 'What is the term for defining multiple methods in the same class with the same name but different parameter lists?',
    difficulty: 'medium',
    explanation: 'Method overloading allows different signatures for methods sharing the same name in a single class.',
    status: 'published',
    options: [
      { text: 'Method Overriding', is_correct: false },
      { text: 'Method Overloading', is_correct: true },
      { text: 'Dynamic Binding', is_correct: false },
      { text: 'Multiple Inheritance', is_correct: false },
    ],
  },

  // 3. Data Structures & Algorithms
  {
    subject_id: 'a1b2c3d4-0003-0003-0003-000000000003',
    question_text: 'What is the average time complexity of searching for an element in a balanced Binary Search Tree (AVL / Red-Black)?',
    difficulty: 'medium',
    explanation: 'In a balanced BST, tree height is strictly O(log n), making search, insertion, and deletion O(log n).',
    status: 'published',
    options: [
      { text: 'O(1)', is_correct: false },
      { text: 'O(log n)', is_correct: true },
      { text: 'O(n)', is_correct: false },
      { text: 'O(n log n)', is_correct: false },
    ],
  },
  {
    subject_id: 'a1b2c3d4-0003-0003-0003-000000000003',
    question_text: 'Which algorithm is best suited to find the shortest path in a weighted graph with non-negative edge weights?',
    difficulty: 'medium',
    explanation: 'Dijkstra\'s algorithm calculates single-source shortest paths in O((V + E) log V) with non-negative edge weights.',
    status: 'published',
    options: [
      { text: 'Bellman-Ford Algorithm', is_correct: false },
      { text: 'Dijkstra\'s Algorithm', is_correct: true },
      { text: 'Floyd-Warshall Algorithm', is_correct: false },
      { text: 'Kruskal\'s Algorithm', is_correct: false },
    ],
  },

  // 4. Database Systems
  {
    subject_id: 'a1b2c3d4-0004-0004-0004-000000000004',
    question_text: 'In the ACID model of database transactions, what does the "I" stand for?',
    difficulty: 'easy',
    explanation: 'Isolation ensures concurrent execution of transactions results in a system state that would be obtained if transactions were executed serially.',
    status: 'published',
    options: [
      { text: 'Integrity', is_correct: false },
      { text: 'Isolation', is_correct: true },
      { text: 'Indexing', is_correct: false },
      { text: 'Immutability', is_correct: false },
    ],
  },
  {
    subject_id: 'a1b2c3d4-0004-0004-0004-000000000004',
    question_text: 'Which normal form eliminates transitive dependencies for non-prime attributes?',
    difficulty: 'medium',
    explanation: 'Third Normal Form (3NF) requires 2NF plus no transitive dependencies of non-prime attributes on candidate keys.',
    status: 'published',
    options: [
      { text: 'First Normal Form (1NF)', is_correct: false },
      { text: 'Second Normal Form (2NF)', is_correct: false },
      { text: 'Third Normal Form (3NF)', is_correct: true },
      { text: 'Boyce-Codd Normal Form (BCNF)', is_correct: false },
    ],
  },

  // 5. Computer Networks
  {
    subject_id: 'a1b2c3d4-0005-0005-0005-000000000005',
    question_text: 'Which transport layer protocol provides connection-oriented, reliable, ordered byte-stream delivery?',
    difficulty: 'easy',
    explanation: 'TCP (Transmission Control Protocol) implements three-way handshaking, acknowledgments, sequence numbers, and retransmissions.',
    status: 'published',
    options: [
      { text: 'UDP', is_correct: false },
      { text: 'TCP', is_correct: true },
      { text: 'ICMP', is_correct: false },
      { text: 'IP', is_correct: false },
    ],
  },
  {
    subject_id: 'a1b2c3d4-0005-0005-0005-000000000005',
    question_text: 'What is the default port number used by HTTPS connections?',
    difficulty: 'easy',
    explanation: 'HTTPS operates by default over TCP port 443 with TLS encryption.',
    status: 'published',
    options: [
      { text: '80', is_correct: false },
      { text: '8080', is_correct: false },
      { text: '443', is_correct: true },
      { text: '22', is_correct: false },
    ],
  },

  // 6. Software Engineering
  {
    subject_id: 'a1b2c3d4-0006-0006-0006-000000000006',
    question_text: 'In Agile Scrum framework, what is the recommended duration of a standard Sprint?',
    difficulty: 'easy',
    explanation: 'Scrum guidelines state Sprints are fixed-length events of one month or less (typically 2 to 4 weeks).',
    status: 'published',
    options: [
      { text: '1 to 4 weeks', is_correct: true },
      { text: '6 months', is_correct: false },
      { text: '1 day', is_correct: false },
      { text: '1 year', is_correct: false },
    ],
  },
  {
    subject_id: 'a1b2c3d4-0006-0006-0006-000000000006',
    question_text: 'Which testing level focuses on verifying interactions between integrated software modules?',
    difficulty: 'medium',
    explanation: 'Integration testing verifies that combined units/subsystems communicate and function as specified.',
    status: 'published',
    options: [
      { text: 'Unit Testing', is_correct: false },
      { text: 'Integration Testing', is_correct: true },
      { text: 'Acceptance Testing', is_correct: false },
      { text: 'Regression Testing', is_correct: false },
    ],
  },

  // 7. Operating Systems
  {
    subject_id: 'a1b2c3d4-0007-0007-0007-000000000007',
    question_text: 'Which condition is NOT one of the four Coffman conditions required for a deadlock to occur?',
    difficulty: 'hard',
    explanation: 'Preemption breaks deadlock. The Coffman condition is "No preemption" (resources cannot be forcibly reclaimed).',
    status: 'published',
    options: [
      { text: 'Mutual Exclusion', is_correct: false },
      { text: 'Hold and Wait', is_correct: false },
      { text: 'Preemptive Allocation', is_correct: true },
      { text: 'Circular Wait', is_correct: false },
    ],
  },
  {
    subject_id: 'a1b2c3d4-0007-0007-0007-000000000007',
    question_text: 'What memory management phenomenon occurs when free memory chunks are scattered and cannot satisfy a contiguous allocation request?',
    difficulty: 'medium',
    explanation: 'External fragmentation occurs when total free memory is sufficient but non-contiguous.',
    status: 'published',
    options: [
      { text: 'Internal Fragmentation', is_correct: false },
      { text: 'External Fragmentation', is_correct: true },
      { text: 'Thrashing', is_correct: false },
      { text: 'Page Fault', is_correct: false },
    ],
  },
]

async function seed() {
  console.log('Seeding initial questions to Supabase...')

  for (const q of questionsToSeed) {
    const qPayload = {
      subject_id: q.subject_id,
      question_text: q.question_text,
      question_type: 'mcq_single',
      difficulty: q.difficulty,
      explanation: q.explanation,
      status: q.status,
      version: 1,
      language: 'en',
    }

    const qRes = await fetch(`${url}/rest/v1/questions`, {
      method: 'POST',
      headers,
      body: JSON.stringify(qPayload),
    })

    if (!qRes.ok) {
      const err = await qRes.text()
      console.error(`Failed to insert question: "${q.question_text}"`, err)
      continue
    }

    const [insertedQuestion] = await qRes.json()
    const questionId = insertedQuestion.id

    // Insert options
    const optionsPayload = q.options.map((opt, idx) => ({
      question_id: questionId,
      option_text: opt.text,
      option_order: idx,
      is_correct: opt.is_correct,
    }))

    const optRes = await fetch(`${url}/rest/v1/question_options`, {
      method: 'POST',
      headers,
      body: JSON.stringify(optionsPayload),
    })

    if (!optRes.ok) {
      console.error(`Failed to insert options for question ${questionId}`)
    } else {
      console.log(`✓ Inserted question & options: "${q.question_text.slice(0, 40)}..."`)
    }
  }

  console.log('Question seeding complete!')
}

seed()

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          full_name: string | null
          avatar_url: string | null
          username: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          full_name?: string | null
          avatar_url?: string | null
          username?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          full_name?: string | null
          avatar_url?: string | null
          username?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      user_roles: {
        Row: {
          id: string
          user_id: string
          role: 'participant' | 'admin'
          granted_by: string | null
          granted_at: string
          revoked_at: string | null
          revoked_by: string | null
          is_active: boolean
        }
        Insert: {
          id?: string
          user_id: string
          role?: 'participant' | 'admin'
          granted_by?: string | null
          granted_at?: string
          revoked_at?: string | null
          revoked_by?: string | null
          is_active?: boolean
        }
        Update: {
          role?: 'participant' | 'admin'
          is_active?: boolean
          revoked_at?: string | null
          revoked_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      subjects: {
        Row: {
          id: string
          name: string
          description: string | null
          icon: string | null
          display_order: number
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          icon?: string | null
          display_order?: number
          is_active?: boolean
        }
        Update: {
          name?: string
          description?: string | null
          icon?: string | null
          display_order?: number
          is_active?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      topics: {
        Row: {
          id: string
          subject_id: string
          name: string
          description: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          subject_id: string
          name: string
          description?: string | null
          is_active?: boolean
        }
        Update: {
          subject_id?: string
          name?: string
          description?: string | null
          is_active?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "topics_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          }
        ]
      }
      teams: {
        Row: {
          id: string
          registration_reference: string
          team_name: string
          institution_name: string
          campus: string | null
          region: string | null
          captain_id: string
          contact_email: string
          contact_phone: string | null
          status: 'draft' | 'submitted' | 'under_review' | 'approved' | 'rejected' | 'waitlisted' | 'disqualified'
          notes: string | null
          admin_notes: string | null
          submitted_at: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          is_solo: boolean
          is_removed: boolean
          removed_at: string | null
          removed_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          registration_reference: string
          team_name: string
          institution_name: string
          campus?: string | null
          region?: string | null
          captain_id: string
          contact_email: string
          contact_phone?: string | null
          status?: 'draft' | 'submitted' | 'under_review' | 'approved' | 'rejected' | 'waitlisted' | 'disqualified'
          notes?: string | null
          admin_notes?: string | null
          submitted_at?: string | null
          is_solo?: boolean
          is_removed?: boolean
          removed_at?: string | null
          removed_by?: string | null
        }
        Update: {
          team_name?: string
          institution_name?: string
          campus?: string | null
          region?: string | null
          contact_email?: string
          contact_phone?: string | null
          status?: 'draft' | 'submitted' | 'under_review' | 'approved' | 'rejected' | 'waitlisted' | 'disqualified'
          notes?: string | null
          admin_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          is_solo?: boolean
          is_removed?: boolean
          removed_at?: string | null
          removed_by?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "teams_captain_id_fkey"
            columns: ["captain_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      team_members: {
        Row: {
          id: string
          team_id: string
          user_id: string | null
          full_name: string
          student_id: string | null
          university_email: string | null
          degree_program: string | null
          semester: string | null
          email: string | null
          username: string | null
          contact_phone: string | null
          account_status: string
          invited_at: string | null
          activated_at: string | null
          is_captain: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          team_id: string
          user_id?: string | null
          full_name: string
          student_id?: string | null
          university_email?: string | null
          degree_program?: string | null
          semester?: string | null
          email?: string | null
          username?: string | null
          contact_phone?: string | null
          account_status?: string
          invited_at?: string | null
          activated_at?: string | null
          is_captain?: boolean
        }
        Update: {
          full_name?: string
          student_id?: string | null
          university_email?: string | null
          degree_program?: string | null
          semester?: string | null
          email?: string | null
          username?: string | null
          contact_phone?: string | null
          account_status?: string
          invited_at?: string | null
          activated_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_members_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          }
        ]
      }
      registration_consents: {
        Row: {
          id: string
          team_id: string
          user_id: string
          rules_version: string
          accepted_at: string
          ip_address: string | null
        }
        Insert: {
          id?: string
          team_id: string
          user_id: string
          rules_version?: string
          accepted_at?: string
          ip_address?: string | null
        }
        Update: {
          rules_version?: string
          ip_address?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "registration_consents_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          }
        ]
      }
      questions: {
        Row: {
          id: string
          subject_id: string
          topic_id: string | null
          question_text: string
          question_type: 'mcq_single'
          difficulty: 'easy' | 'medium' | 'hard'
          explanation: string | null
          tags: string[] | null
          status: 'draft' | 'published' | 'archived'
          version: number
          language: string
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          subject_id: string
          topic_id?: string | null
          question_text: string
          question_type?: 'mcq_single'
          difficulty?: 'easy' | 'medium' | 'hard'
          explanation?: string | null
          tags?: string[] | null
          status?: 'draft' | 'published' | 'archived'
          version?: number
          language?: string
          created_by?: string | null
        }
        Update: {
          subject_id?: string
          topic_id?: string | null
          question_text?: string
          difficulty?: 'easy' | 'medium' | 'hard'
          explanation?: string | null
          tags?: string[] | null
          status?: 'draft' | 'published' | 'archived'
          version?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "questions_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "questions_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id"]
          }
        ]
      }
      question_options: {
        Row: {
          id: string
          question_id: string
          option_text: string
          option_order: number
          is_correct: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          question_id: string
          option_text: string
          option_order?: number
          is_correct?: boolean
        }
        Update: {
          option_text?: string
          option_order?: number
          is_correct?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "question_options_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          }
        ]
      }
      question_versions: {
        Row: {
          id: string
          question_id: string
          version: number
          question_text: string
          question_type: 'mcq_single'
          difficulty: 'easy' | 'medium' | 'hard'
          explanation: string | null
          options_snapshot: Json
          correct_option_id: string
          created_at: string
        }
        Insert: {
          id?: string
          question_id: string
          version: number
          question_text: string
          question_type: 'mcq_single'
          difficulty: 'easy' | 'medium' | 'hard'
          explanation?: string | null
          options_snapshot: Json
          correct_option_id: string
          created_at?: string
        }
        Update: {
          question_text?: string
          difficulty?: 'easy' | 'medium' | 'hard'
          explanation?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "question_versions_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          }
        ]
      }
      rounds: {
        Row: {
          id: string
          round_number: number
          name: string
          round_type: 'mcq_screening' | 'rapid_fire' | 'buzzer'
          description: string | null
          is_online: boolean
          subjects_included: string[] | null
          questions_per_team: number | null
          time_limit_seconds: number | null
          per_question_seconds: number | null
          points_correct: number
          points_incorrect: number
          points_skipped: number
          qualification_method: string
          qualification_value: number | null
          qualification_tie_policy: string
          allow_skip: boolean
          skip_timeout_seconds: number | null
          allow_buzz: boolean
          buzz_penalty_seconds: number | null
          wrong_buzz_deduction: number
          status: 'draft' | 'active' | 'completed' | 'archived'
          availability_start: string | null
          availability_end: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          round_number: number
          name: string
          round_type: 'mcq_screening' | 'rapid_fire' | 'buzzer'
          description?: string | null
          is_online?: boolean
          subjects_included?: string[] | null
          questions_per_team?: number | null
          time_limit_seconds?: number | null
          per_question_seconds?: number | null
          points_correct?: number
          points_incorrect?: number
          points_skipped?: number
          qualification_method?: string
          qualification_value?: number | null
          qualification_tie_policy?: string
          allow_skip?: boolean
          skip_timeout_seconds?: number | null
          allow_buzz?: boolean
          buzz_penalty_seconds?: number | null
          wrong_buzz_deduction?: number
          status?: 'draft' | 'active' | 'completed' | 'archived'
          availability_start?: string | null
          availability_end?: string | null
        }
        Update: {
          name?: string
          description?: string | null
          is_online?: boolean
          subjects_included?: string[] | null
          questions_per_team?: number | null
          time_limit_seconds?: number | null
          per_question_seconds?: number | null
          points_correct?: number
          points_incorrect?: number
          points_skipped?: number
          qualification_method?: string
          qualification_value?: number | null
          qualification_tie_policy?: string
          allow_skip?: boolean
          skip_timeout_seconds?: number | null
          allow_buzz?: boolean
          buzz_penalty_seconds?: number | null
          wrong_buzz_deduction?: number
          status?: 'draft' | 'active' | 'completed' | 'archived'
          availability_start?: string | null
          availability_end?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      round_questions: {
        Row: {
          id: string
          round_id: string
          question_id: string
          question_version_id: string | null
          display_order: number | null
          points_override: number | null
          created_at: string
        }
        Insert: {
          id?: string
          round_id: string
          question_id: string
          question_version_id?: string | null
          display_order?: number | null
          points_override?: number | null
        }
        Update: {
          display_order?: number | null
          points_override?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "round_questions_round_id_fkey"
            columns: ["round_id"]
            isOneToOne: false
            referencedRelation: "rounds"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "round_questions_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "round_questions_question_version_id_fkey"
            columns: ["question_version_id"]
            isOneToOne: false
            referencedRelation: "question_versions"
            referencedColumns: ["id"]
          }
        ]
      }
      quiz_attempts: {
        Row: {
          id: string
          team_id: string
          round_id: string
          status: 'not_started' | 'in_progress' | 'completed' | 'timed_out' | 'disqualified'
          started_at: string | null
          completed_at: string | null
          server_deadline: string | null
          total_score: number
          questions_answered: number
          questions_correct: number
          questions_skipped: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          team_id: string
          round_id: string
          status?: 'not_started' | 'in_progress' | 'completed' | 'timed_out' | 'disqualified'
          started_at?: string | null
          server_deadline?: string | null
          total_score?: number
          questions_answered?: number
          questions_correct?: number
          questions_skipped?: number
        }
        Update: {
          status?: 'not_started' | 'in_progress' | 'completed' | 'timed_out' | 'disqualified'
          completed_at?: string | null
          server_deadline?: string | null
          total_score?: number
          questions_answered?: number
          questions_correct?: number
          questions_skipped?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_attempts_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quiz_attempts_round_id_fkey"
            columns: ["round_id"]
            isOneToOne: false
            referencedRelation: "rounds"
            referencedColumns: ["id"]
          }
        ]
      }
      attempt_questions: {
        Row: {
          id: string
          attempt_id: string
          question_version_id: string
          display_order: number
          question_deadline: string | null
          is_skipped: boolean
          answered_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          attempt_id: string
          question_version_id: string
          display_order: number
          question_deadline?: string | null
          is_skipped?: boolean
          answered_at?: string | null
        }
        Update: {
          is_skipped?: boolean
          answered_at?: string | null
          question_deadline?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "attempt_questions_attempt_id_fkey"
            columns: ["attempt_id"]
            isOneToOne: false
            referencedRelation: "quiz_attempts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attempt_questions_question_version_id_fkey"
            columns: ["question_version_id"]
            isOneToOne: false
            referencedRelation: "question_versions"
            referencedColumns: ["id"]
          }
        ]
      }
      answers: {
        Row: {
          id: string
          attempt_question_id: string
          attempt_id: string
          team_id: string
          submitted_option_id: string | null
          submitted_at: string
          is_correct: boolean | null
          score_awarded: number
          evaluated_at: string | null
          evaluated_by: string | null
        }
        Insert: {
          id?: string
          attempt_question_id: string
          attempt_id: string
          team_id: string
          submitted_option_id?: string | null
          submitted_at?: string
          is_correct?: boolean | null
          score_awarded?: number
          evaluated_at?: string | null
          evaluated_by?: string | null
        }
        Update: {
          submitted_option_id?: string | null
          is_correct?: boolean | null
          score_awarded?: number
          evaluated_at?: string | null
          evaluated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "answers_attempt_question_id_fkey"
            columns: ["attempt_question_id"]
            isOneToOne: false
            referencedRelation: "attempt_questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "answers_attempt_id_fkey"
            columns: ["attempt_id"]
            isOneToOne: false
            referencedRelation: "quiz_attempts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "answers_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          }
        ]
      }
      scoring_events: {
        Row: {
          id: string
          team_id: string
          attempt_id: string | null
          answer_id: string | null
          event_type: string
          score_delta: number
          score_after: number
          notes: string | null
          recorded_by: string | null
          recorded_at: string
        }
        Insert: {
          id?: string
          team_id: string
          attempt_id?: string | null
          answer_id?: string | null
          event_type: string
          score_delta: number
          score_after: number
          notes?: string | null
          recorded_by?: string | null
          recorded_at?: string
        }
        Update: Record<string, never>
        Relationships: [
          {
            foreignKeyName: "scoring_events_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scoring_events_attempt_id_fkey"
            columns: ["attempt_id"]
            isOneToOne: false
            referencedRelation: "quiz_attempts"
            referencedColumns: ["id"]
          }
        ]
      }
      buzzer_events: {
        Row: {
          id: string
          round_id: string
          attempt_id: string | null
          team_id: string
          question_id: string | null
          buzzed_at: string
          is_eligible: boolean
          is_winner: boolean
          answer_text: string | null
          is_correct: boolean | null
          score_awarded: number | null
          organizer_note: string | null
          adjudicated_by: string | null
          adjudicated_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          round_id: string
          attempt_id?: string | null
          team_id: string
          question_id?: string | null
          buzzed_at?: string
          is_eligible?: boolean
          is_winner?: boolean
          answer_text?: string | null
          is_correct?: boolean | null
          score_awarded?: number | null
          organizer_note?: string | null
          adjudicated_by?: string | null
          adjudicated_at?: string | null
        }
        Update: {
          is_winner?: boolean
          answer_text?: string | null
          is_correct?: boolean | null
          score_awarded?: number | null
          organizer_note?: string | null
          adjudicated_by?: string | null
          adjudicated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "buzzer_events_round_id_fkey"
            columns: ["round_id"]
            isOneToOne: false
            referencedRelation: "rounds"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "buzzer_events_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          }
        ]
      }
      announcements: {
        Row: {
          id: string
          title: string
          body: string
          status: 'draft' | 'published' | 'archived'
          is_pinned: boolean
          published_at: string | null
          created_by: string | null
          updated_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          body: string
          status?: 'draft' | 'published' | 'archived'
          is_pinned?: boolean
          published_at?: string | null
          created_by?: string | null
          updated_by?: string | null
        }
        Update: {
          title?: string
          body?: string
          status?: 'draft' | 'published' | 'archived'
          is_pinned?: boolean
          published_at?: string | null
          updated_by?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      competition_settings: {
        Row: {
          id: string
          key: string
          value: string | null
          value_json: Json | null
          description: string | null
          is_public: boolean
          updated_by: string | null
          updated_at: string
        }
        Insert: {
          id?: string
          key: string
          value?: string | null
          value_json?: Json | null
          description?: string | null
          is_public?: boolean
          updated_by?: string | null
          updated_at?: string
        }
        Update: {
          value?: string | null
          value_json?: Json | null
          description?: string | null
          is_public?: boolean
          updated_by?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          id: string
          actor_id: string | null
          actor_email: string | null
          action: string
          entity_type: string
          entity_id: string | null
          before_state: Json | null
          after_state: Json | null
          metadata: Json | null
          ip_address: string | null
          user_agent: string | null
          created_at: string
        }
        Insert: {
          id?: string
          actor_id?: string | null
          actor_email?: string | null
          action: string
          entity_type: string
          entity_id?: string | null
          before_state?: Json | null
          after_state?: Json | null
          metadata?: Json | null
          ip_address?: string | null
          user_agent?: string | null
        }
        Update: Record<string, never>
        Relationships: []
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          type: string
          title: string
          message: string
          is_read: boolean
          metadata: Json | null
          created_at: string
          read_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          type: string
          title: string
          message: string
          is_read?: boolean
          metadata?: Json | null
        }
        Update: {
          is_read?: boolean
          read_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      results: {
        Row: {
          id: string
          team_id: string
          round_id: string
          attempt_id: string | null
          rank: number | null
          total_score: number
          is_qualified: boolean
          qualification_notes: string | null
          is_published: boolean
          published_at: string | null
          published_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          team_id: string
          round_id: string
          attempt_id?: string | null
          rank?: number | null
          total_score?: number
          is_qualified?: boolean
          qualification_notes?: string | null
          is_published?: boolean
          published_at?: string | null
          published_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          rank?: number | null
          total_score?: number
          is_qualified?: boolean
          qualification_notes?: string | null
          is_published?: boolean
          published_at?: string | null
          published_by?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "results_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "results_round_id_fkey"
            columns: ["round_id"]
            isOneToOne: false
            referencedRelation: "rounds"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "results_attempt_id_fkey"
            columns: ["attempt_id"]
            isOneToOne: false
            referencedRelation: "quiz_attempts"
            referencedColumns: ["id"]
          }
        ]
      }
      question_banks: {
        Row: {
          id: string
          uploaded_by: string | null
          original_filename: string
          storage_path: string
          file_size: number
          mime_type: string
          encryption_algorithm: string
          key_version: number
          iv: string
          auth_tag: string
          row_count: number
          status: string
          published_at: string | null
          published_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          uploaded_by: string
          original_filename: string
          storage_path: string
          file_size: number
          mime_type: string
          encryption_algorithm?: string
          key_version?: number
          iv: string
          auth_tag: string
          row_count?: number
          status?: string
          published_at?: string | null
          published_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          uploaded_by?: string
          original_filename?: string
          storage_path?: string
          file_size?: number
          mime_type?: string
          encryption_algorithm?: string
          key_version?: number
          iv?: string
          auth_tag?: string
          row_count?: number
          status?: string
          published_at?: string | null
          published_by?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "question_banks_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "question_banks_published_by_fkey"
            columns: ["published_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      practice_questions: {
        Row: {
          id: string
          question_bank_id: string | null
          subject_id: string | null
          question_text: string
          difficulty: 'easy' | 'medium' | 'hard'
          options: Json
          explanation: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          question_bank_id?: string | null
          subject_id?: string | null
          question_text: string
          difficulty: 'easy' | 'medium' | 'hard'
          options?: Json
          explanation?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          question_bank_id?: string | null
          subject_id?: string | null
          question_text?: string
          difficulty?: 'easy' | 'medium' | 'hard'
          options?: Json
          explanation?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "practice_questions_question_bank_id_fkey"
            columns: ["question_bank_id"]
            isOneToOne: false
            referencedRelation: "question_banks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "practice_questions_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: Record<string, never>
    Functions: {
      is_admin: {
        Args: Record<string, never>
        Returns: boolean
      }
      get_my_team_id: {
        Args: Record<string, never>
        Returns: string
      }
      generate_registration_ref: {
        Args: Record<string, never>
        Returns: string
      }
      is_team_leader: {
        Args: { target_team_id: string }
        Returns: boolean
      }
      max_teams_per_university: {
        Args: Record<string, never>
        Returns: number
      }
      register_team: {
        Args: {
          p_leader_id: string
          p_team_name: string
          p_university: string
          p_campus: string | null
          p_contact_email: string
          p_contact_phone: string | null
          p_notes: string | null
          p_members: Json
        }
        Returns: Array<{ team_id: string; registration_reference: string }>
      }
    }
    Enums: {
      user_role: 'participant' | 'admin'
      team_status: 'draft' | 'submitted' | 'under_review' | 'approved' | 'rejected' | 'waitlisted' | 'disqualified'
      question_status: 'draft' | 'published' | 'archived'
      difficulty_level: 'easy' | 'medium' | 'hard'
      round_type: 'mcq_screening' | 'rapid_fire' | 'buzzer'
      round_status: 'draft' | 'active' | 'completed' | 'archived'
    }
    CompositeTypes: Record<string, never>
  }
}

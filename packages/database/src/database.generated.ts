export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      admin_audit_events: {
        Row: {
          action: string
          admin_id: string
          correlation_id: string
          created_at: string
          entity_id: string
          entity_type: string
          id: string
          metadata: Json
          reason: string
        }
        Insert: {
          action: string
          admin_id: string
          correlation_id: string
          created_at?: string
          entity_id: string
          entity_type: string
          id?: string
          metadata?: Json
          reason: string
        }
        Update: {
          action?: string
          admin_id?: string
          correlation_id?: string
          created_at?: string
          entity_id?: string
          entity_type?: string
          id?: string
          metadata?: Json
          reason?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_audit_events_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      booking_operations_notes: {
        Row: {
          admin_id: string
          body: string
          booking_id: string
          created_at: string
          id: string
          note_type: string
        }
        Insert: {
          admin_id: string
          body: string
          booking_id: string
          created_at?: string
          id?: string
          note_type: string
        }
        Update: {
          admin_id?: string
          body?: string
          booking_id?: string
          created_at?: string
          id?: string
          note_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "booking_operations_notes_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_operations_notes_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      booking_reminders: {
        Row: {
          booking_id: string
          customer_id: string
          delivered_at: string | null
          id: string
          kind: string
          remind_at: string
        }
        Insert: {
          booking_id: string
          customer_id: string
          delivered_at?: string | null
          id?: string
          kind: string
          remind_at: string
        }
        Update: {
          booking_id?: string
          customer_id?: string
          delivered_at?: string | null
          id?: string
          kind?: string
          remind_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "booking_reminders_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_reminders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      bookings: {
        Row: {
          claimed_by: string | null
          client_request_id: string | null
          correlation_id: string
          created_at: string
          customer_id: string
          event_date: string
          guest_count: number | null
          id: string
          package_id: string | null
          requirements: string
          status: Database["public"]["Enums"]["booking_status"]
          updated_at: string
          vendor_id: string
          wedding_brief_id: string
        }
        Insert: {
          claimed_by?: string | null
          client_request_id?: string | null
          correlation_id?: string
          created_at?: string
          customer_id: string
          event_date: string
          guest_count?: number | null
          id?: string
          package_id?: string | null
          requirements: string
          status?: Database["public"]["Enums"]["booking_status"]
          updated_at?: string
          vendor_id: string
          wedding_brief_id: string
        }
        Update: {
          claimed_by?: string | null
          client_request_id?: string | null
          correlation_id?: string
          created_at?: string
          customer_id?: string
          event_date?: string
          guest_count?: number | null
          id?: string
          package_id?: string | null
          requirements?: string
          status?: Database["public"]["Enums"]["booking_status"]
          updated_at?: string
          vendor_id?: string
          wedding_brief_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_claimed_by_fkey"
            columns: ["claimed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "service_packages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_wedding_brief_id_fkey"
            columns: ["wedding_brief_id"]
            isOneToOne: false
            referencedRelation: "wedding_briefs"
            referencedColumns: ["id"]
          },
        ]
      }
      cancellations: {
        Row: {
          booking_id: string
          calculation: Json
          customer_id: string
          decided_at: string | null
          decided_by: string | null
          decision_reason: string | null
          id: string
          paid_amount_kobo: number
          policy_version: string
          reason: string
          refundable_amount_kobo: number
          requested_at: string
          retained_amount_kobo: number
          status: string
        }
        Insert: {
          booking_id: string
          calculation: Json
          customer_id: string
          decided_at?: string | null
          decided_by?: string | null
          decision_reason?: string | null
          id?: string
          paid_amount_kobo: number
          policy_version: string
          reason: string
          refundable_amount_kobo: number
          requested_at?: string
          retained_amount_kobo: number
          status?: string
        }
        Update: {
          booking_id?: string
          calculation?: Json
          customer_id?: string
          decided_at?: string | null
          decided_by?: string | null
          decision_reason?: string | null
          id?: string
          paid_amount_kobo?: number
          policy_version?: string
          reason?: string
          refundable_amount_kobo?: number
          requested_at?: string
          retained_amount_kobo?: number
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "cancellations_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: true
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cancellations_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cancellations_decided_by_fkey"
            columns: ["decided_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_drafts: {
        Row: {
          brief: Json
          customer_id: string
          revision: number
          source_device_id: string
          updated_at: string
        }
        Insert: {
          brief?: Json
          customer_id: string
          revision?: number
          source_device_id: string
          updated_at?: string
        }
        Update: {
          brief?: Json
          customer_id?: string
          revision?: number
          source_device_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_drafts_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_notifications: {
        Row: {
          body: string
          booking_id: string | null
          created_at: string
          customer_id: string
          deep_link: string | null
          email_status: string
          id: string
          kind: string
          push_status: string
          read_at: string | null
          title: string
          web_path: string | null
        }
        Insert: {
          body: string
          booking_id?: string | null
          created_at?: string
          customer_id: string
          deep_link?: string | null
          email_status?: string
          id?: string
          kind: string
          push_status?: string
          read_at?: string | null
          title: string
          web_path?: string | null
        }
        Update: {
          body?: string
          booking_id?: string | null
          created_at?: string
          customer_id?: string
          deep_link?: string | null
          email_status?: string
          id?: string
          kind?: string
          push_status?: string
          read_at?: string | null
          title?: string
          web_path?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customer_notifications_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_notifications_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      dispute_evidence: {
        Row: {
          created_at: string
          description: string
          dispute_id: string
          id: string
          media_type: string
          storage_path: string
          uploaded_by: string
        }
        Insert: {
          created_at?: string
          description?: string
          dispute_id: string
          id?: string
          media_type: string
          storage_path: string
          uploaded_by: string
        }
        Update: {
          created_at?: string
          description?: string
          dispute_id?: string
          id?: string
          media_type?: string
          storage_path?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "dispute_evidence_dispute_id_fkey"
            columns: ["dispute_id"]
            isOneToOne: false
            referencedRelation: "disputes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dispute_evidence_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      disputes: {
        Row: {
          booking_id: string
          created_at: string
          id: string
          opened_by: string
          reason: string
          resolution_note: string | null
          resolved_at: string | null
          resolved_by: string | null
          status: string
        }
        Insert: {
          booking_id: string
          created_at?: string
          id?: string
          opened_by: string
          reason: string
          resolution_note?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
        }
        Update: {
          booking_id?: string
          created_at?: string
          id?: string
          opened_by?: string
          reason?: string
          resolution_note?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "disputes_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "disputes_opened_by_fkey"
            columns: ["opened_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "disputes_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      ledger_entries: {
        Row: {
          amount_kobo: number
          created_at: string
          entry_type: string
          id: string
          idempotency_key: string
          payment_id: string
          provider_reference: string | null
        }
        Insert: {
          amount_kobo: number
          created_at?: string
          entry_type: string
          id?: string
          idempotency_key: string
          payment_id: string
          provider_reference?: string | null
        }
        Update: {
          amount_kobo?: number
          created_at?: string
          entry_type?: string
          id?: string
          idempotency_key?: string
          payment_id?: string
          provider_reference?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ledger_entries_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_preferences: {
        Row: {
          customer_id: string
          email_enabled: boolean
          push_enabled: boolean
          reminders_enabled: boolean
          updated_at: string
        }
        Insert: {
          customer_id: string
          email_enabled?: boolean
          push_enabled?: boolean
          reminders_enabled?: boolean
          updated_at?: string
        }
        Update: {
          customer_id?: string
          email_enabled?: boolean
          push_enabled?: boolean
          reminders_enabled?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_preferences_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount_kobo: number
          authorization_url: string | null
          booking_id: string
          created_at: string
          currency: string
          customer_id: string
          id: string
          paid_at: string | null
          provider: string
          provider_reference: string
          quote_id: string
          raw_provider_status: string | null
          status: Database["public"]["Enums"]["payment_status"]
          updated_at: string
        }
        Insert: {
          amount_kobo: number
          authorization_url?: string | null
          booking_id: string
          created_at?: string
          currency?: string
          customer_id: string
          id?: string
          paid_at?: string | null
          provider: string
          provider_reference: string
          quote_id: string
          raw_provider_status?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          updated_at?: string
        }
        Update: {
          amount_kobo?: number
          authorization_url?: string | null
          booking_id?: string
          created_at?: string
          currency?: string
          customer_id?: string
          id?: string
          paid_at?: string | null
          provider?: string
          provider_reference?: string
          quote_id?: string
          raw_provider_status?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
        ]
      }
      payout_approvals: {
        Row: {
          first_approved_at: string
          first_approved_by: string
          payout_id: string
          reason: string
          second_approved_at: string | null
          second_approved_by: string | null
        }
        Insert: {
          first_approved_at?: string
          first_approved_by: string
          payout_id: string
          reason: string
          second_approved_at?: string | null
          second_approved_by?: string | null
        }
        Update: {
          first_approved_at?: string
          first_approved_by?: string
          payout_id?: string
          reason?: string
          second_approved_at?: string | null
          second_approved_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payout_approvals_first_approved_by_fkey"
            columns: ["first_approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payout_approvals_payout_id_fkey"
            columns: ["payout_id"]
            isOneToOne: true
            referencedRelation: "payouts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payout_approvals_second_approved_by_fkey"
            columns: ["second_approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      payouts: {
        Row: {
          amount_kobo: number
          approved_at: string | null
          approved_by: string | null
          booking_id: string
          created_at: string
          id: string
          payment_id: string
          provider_reference: string | null
          status: Database["public"]["Enums"]["payout_status"]
          updated_at: string
          vendor_id: string
        }
        Insert: {
          amount_kobo: number
          approved_at?: string | null
          approved_by?: string | null
          booking_id: string
          created_at?: string
          id?: string
          payment_id: string
          provider_reference?: string | null
          status?: Database["public"]["Enums"]["payout_status"]
          updated_at?: string
          vendor_id: string
        }
        Update: {
          amount_kobo?: number
          approved_at?: string | null
          approved_by?: string | null
          booking_id?: string
          created_at?: string
          id?: string
          payment_id?: string
          provider_reference?: string | null
          status?: Database["public"]["Enums"]["payout_status"]
          updated_at?: string
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payouts_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payouts_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payouts_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payouts_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      product_events: {
        Row: {
          booking_id: string | null
          correlation_id: string | null
          created_at: string
          customer_id: string | null
          id: string
          name: string
          properties: Json
        }
        Insert: {
          booking_id?: string | null
          correlation_id?: string | null
          created_at?: string
          customer_id?: string | null
          id?: string
          name: string
          properties?: Json
        }
        Update: {
          booking_id?: string | null
          correlation_id?: string | null
          created_at?: string
          customer_id?: string | null
          id?: string
          name?: string
          properties?: Json
        }
        Relationships: [
          {
            foreignKeyName: "product_events_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_events_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          full_name: string
          id: string
          is_admin: boolean
          phone: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name: string
          id: string
          is_admin?: boolean
          phone?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          is_admin?: boolean
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      provider_events: {
        Row: {
          event_key: string
          event_type: string
          id: string
          payload_sha256: string
          processed_at: string
          provider: string
        }
        Insert: {
          event_key: string
          event_type: string
          id?: string
          payload_sha256: string
          processed_at?: string
          provider: string
        }
        Update: {
          event_key?: string
          event_type?: string
          id?: string
          payload_sha256?: string
          processed_at?: string
          provider?: string
        }
        Relationships: []
      }
      push_tokens: {
        Row: {
          active: boolean
          created_at: string
          customer_id: string
          id: string
          platform: string
          token: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          customer_id: string
          id?: string
          platform: string
          token: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          customer_id?: string
          id?: string
          platform?: string
          token?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "push_tokens_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      quotes: {
        Row: {
          accepted_at: string | null
          availability_confirmed_at: string | null
          booking_id: string
          cancellation_summary: string
          cancellation_template_version: string
          created_at: string
          created_by: string
          deposit_amount_kobo: number
          exclusions: string[]
          expires_at: string
          id: string
          inclusions: string[]
          package_name_snapshot: string
          payment_schedule: string
          platform_fee_bps: number
          revision: number
          terms_version: string
          total_amount_kobo: number
        }
        Insert: {
          accepted_at?: string | null
          availability_confirmed_at?: string | null
          booking_id: string
          cancellation_summary: string
          cancellation_template_version: string
          created_at?: string
          created_by: string
          deposit_amount_kobo: number
          exclusions?: string[]
          expires_at: string
          id?: string
          inclusions?: string[]
          package_name_snapshot?: string
          payment_schedule?: string
          platform_fee_bps?: number
          revision?: number
          terms_version: string
          total_amount_kobo: number
        }
        Update: {
          accepted_at?: string | null
          availability_confirmed_at?: string | null
          booking_id?: string
          cancellation_summary?: string
          cancellation_template_version?: string
          created_at?: string
          created_by?: string
          deposit_amount_kobo?: number
          exclusions?: string[]
          expires_at?: string
          id?: string
          inclusions?: string[]
          package_name_snapshot?: string
          payment_schedule?: string
          platform_fee_bps?: number
          revision?: number
          terms_version?: string
          total_amount_kobo?: number
        }
        Relationships: [
          {
            foreignKeyName: "quotes_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      reconciliation_runs: {
        Row: {
          created_at: string
          details: Json
          exception_count: number
          gross_kobo: number
          id: string
          payment_count: number
          run_by: string
          run_date: string
          status: string
        }
        Insert: {
          created_at?: string
          details?: Json
          exception_count: number
          gross_kobo: number
          id?: string
          payment_count: number
          run_by: string
          run_date: string
          status: string
        }
        Update: {
          created_at?: string
          details?: Json
          exception_count?: number
          gross_kobo?: number
          id?: string
          payment_count?: number
          run_by?: string
          run_date?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "reconciliation_runs_run_by_fkey"
            columns: ["run_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      refunds: {
        Row: {
          amount_kobo: number
          approval_reason: string | null
          booking_id: string
          cancellation_id: string
          created_at: string
          failure_reason: string | null
          first_approved_by: string | null
          id: string
          payment_id: string
          provider_reference: string | null
          requested_by: string
          second_approved_by: string | null
          status: string
          updated_at: string
        }
        Insert: {
          amount_kobo: number
          approval_reason?: string | null
          booking_id: string
          cancellation_id: string
          created_at?: string
          failure_reason?: string | null
          first_approved_by?: string | null
          id?: string
          payment_id: string
          provider_reference?: string | null
          requested_by: string
          second_approved_by?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          amount_kobo?: number
          approval_reason?: string | null
          booking_id?: string
          cancellation_id?: string
          created_at?: string
          failure_reason?: string | null
          first_approved_by?: string | null
          id?: string
          payment_id?: string
          provider_reference?: string | null
          requested_by?: string
          second_approved_by?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "refunds_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "refunds_cancellation_id_fkey"
            columns: ["cancellation_id"]
            isOneToOne: true
            referencedRelation: "cancellations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "refunds_first_approved_by_fkey"
            columns: ["first_approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "refunds_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "refunds_requested_by_fkey"
            columns: ["requested_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "refunds_second_approved_by_fkey"
            columns: ["second_approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          body: string
          booking_id: string
          created_at: string
          customer_id: string
          id: string
          published: boolean
          rating: number
          vendor_id: string
        }
        Insert: {
          body: string
          booking_id: string
          created_at?: string
          customer_id: string
          id?: string
          published?: boolean
          rating: number
          vendor_id: string
        }
        Update: {
          body?: string
          booking_id?: string
          created_at?: string
          customer_id?: string
          id?: string
          published?: boolean
          rating?: number
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: true
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      service_packages: {
        Row: {
          active: boolean
          created_at: string
          description: string
          guest_max: number | null
          guest_min: number | null
          id: string
          inclusions: string[]
          name: string
          price_from_kobo: number
          updated_at: string
          vendor_id: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          description: string
          guest_max?: number | null
          guest_min?: number | null
          id?: string
          inclusions?: string[]
          name: string
          price_from_kobo: number
          updated_at?: string
          vendor_id: string
        }
        Update: {
          active?: boolean
          created_at?: string
          description?: string
          guest_max?: number | null
          guest_min?: number | null
          id?: string
          inclusions?: string[]
          name?: string
          price_from_kobo?: number
          updated_at?: string
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_packages_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      shortlist_items: {
        Row: {
          created_at: string
          customer_id: string
          vendor_id: string
        }
        Insert: {
          created_at?: string
          customer_id: string
          vendor_id: string
        }
        Update: {
          created_at?: string
          customer_id?: string
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shortlist_items_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shortlist_items_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      state_transition_events: {
        Row: {
          actor_id: string | null
          correlation_id: string
          created_at: string
          entity_id: string
          entity_type: string
          id: string
          new_state: string
          previous_state: string | null
          reason: string
        }
        Insert: {
          actor_id?: string | null
          correlation_id: string
          created_at?: string
          entity_id: string
          entity_type: string
          id?: string
          new_state: string
          previous_state?: string | null
          reason: string
        }
        Update: {
          actor_id?: string | null
          correlation_id?: string
          created_at?: string
          entity_id?: string
          entity_type?: string
          id?: string
          new_state?: string
          previous_state?: string | null
          reason?: string
        }
        Relationships: [
          {
            foreignKeyName: "state_transition_events_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      support_messages: {
        Row: {
          author_id: string
          body: string
          booking_id: string
          created_at: string
          id: string
        }
        Insert: {
          author_id: string
          body: string
          booking_id: string
          created_at?: string
          id?: string
        }
        Update: {
          author_id?: string
          body?: string
          booking_id?: string
          created_at?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_messages_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_messages_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      vendors: {
        Row: {
          area: string
          capacity_max: number | null
          capacity_min: number | null
          category: Database["public"]["Enums"]["vendor_category"]
          created_at: string
          description: string
          hero_image_path: string | null
          id: string
          name: string
          paystack_subaccount_code: string | null
          price_from_kobo: number | null
          published: boolean
          updated_at: string
          verification_expires_at: string | null
          verification_status: Database["public"]["Enums"]["verification_status"]
        }
        Insert: {
          area: string
          capacity_max?: number | null
          capacity_min?: number | null
          category: Database["public"]["Enums"]["vendor_category"]
          created_at?: string
          description?: string
          hero_image_path?: string | null
          id?: string
          name: string
          paystack_subaccount_code?: string | null
          price_from_kobo?: number | null
          published?: boolean
          updated_at?: string
          verification_expires_at?: string | null
          verification_status?: Database["public"]["Enums"]["verification_status"]
        }
        Update: {
          area?: string
          capacity_max?: number | null
          capacity_min?: number | null
          category?: Database["public"]["Enums"]["vendor_category"]
          created_at?: string
          description?: string
          hero_image_path?: string | null
          id?: string
          name?: string
          paystack_subaccount_code?: string | null
          price_from_kobo?: number | null
          published?: boolean
          updated_at?: string
          verification_expires_at?: string | null
          verification_status?: Database["public"]["Enums"]["verification_status"]
        }
        Relationships: []
      }
      verification_records: {
        Row: {
          authority_checked: boolean
          bank_name_checked: boolean
          checked_at: string | null
          checked_by: string | null
          contact_checked: boolean
          created_at: string
          expires_at: string | null
          id: string
          identity_checked: boolean
          physical_site_checked: boolean
          portfolio_checked: boolean
          private_note: string
          public_note: string
          references_checked: boolean
          status: Database["public"]["Enums"]["verification_status"]
          vendor_id: string
        }
        Insert: {
          authority_checked?: boolean
          bank_name_checked?: boolean
          checked_at?: string | null
          checked_by?: string | null
          contact_checked?: boolean
          created_at?: string
          expires_at?: string | null
          id?: string
          identity_checked?: boolean
          physical_site_checked?: boolean
          portfolio_checked?: boolean
          private_note?: string
          public_note?: string
          references_checked?: boolean
          status?: Database["public"]["Enums"]["verification_status"]
          vendor_id: string
        }
        Update: {
          authority_checked?: boolean
          bank_name_checked?: boolean
          checked_at?: string | null
          checked_by?: string | null
          contact_checked?: boolean
          created_at?: string
          expires_at?: string | null
          id?: string
          identity_checked?: boolean
          physical_site_checked?: boolean
          portfolio_checked?: boolean
          private_note?: string
          public_note?: string
          references_checked?: boolean
          status?: Database["public"]["Enums"]["verification_status"]
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "verification_records_checked_by_fkey"
            columns: ["checked_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "verification_records_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      wedding_briefs: {
        Row: {
          area: string
          budget_max_kobo: number
          budget_min_kobo: number
          created_at: string
          customer_id: string
          guest_count: number
          id: string
          priorities: Database["public"]["Enums"]["vendor_category"][]
          updated_at: string
          wedding_date: string
        }
        Insert: {
          area: string
          budget_max_kobo: number
          budget_min_kobo: number
          created_at?: string
          customer_id: string
          guest_count: number
          id?: string
          priorities: Database["public"]["Enums"]["vendor_category"][]
          updated_at?: string
          wedding_date: string
        }
        Update: {
          area?: string
          budget_max_kobo?: number
          budget_min_kobo?: number
          created_at?: string
          customer_id?: string
          guest_count?: number
          id?: string
          priorities?: Database["public"]["Enums"]["vendor_category"][]
          updated_at?: string
          wedding_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "wedding_briefs_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      vendor_verification_disclosures: {
        Row: {
          authority_checked: boolean | null
          bank_name_checked: boolean | null
          checked_at: string | null
          contact_checked: boolean | null
          expires_at: string | null
          identity_checked: boolean | null
          physical_site_checked: boolean | null
          portfolio_checked: boolean | null
          public_note: string | null
          references_checked: boolean | null
          vendor_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "verification_records_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      accept_quote: {
        Args: { p_booking_id: string; p_quote_id: string }
        Returns: {
          claimed_by: string | null
          client_request_id: string | null
          correlation_id: string
          created_at: string
          customer_id: string
          event_date: string
          guest_count: number | null
          id: string
          package_id: string | null
          requirements: string
          status: Database["public"]["Enums"]["booking_status"]
          updated_at: string
          vendor_id: string
          wedding_brief_id: string
        }
        SetofOptions: {
          from: "*"
          to: "bookings"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      cancellation_preview: { Args: { p_booking_id: string }; Returns: Json }
      confirm_fulfillment: {
        Args: { p_booking_id: string }
        Returns: {
          claimed_by: string | null
          client_request_id: string | null
          correlation_id: string
          created_at: string
          customer_id: string
          event_date: string
          guest_count: number | null
          id: string
          package_id: string | null
          requirements: string
          status: Database["public"]["Enums"]["booking_status"]
          updated_at: string
          vendor_id: string
          wedding_brief_id: string
        }
        SetofOptions: {
          from: "*"
          to: "bookings"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      is_admin: { Args: never; Returns: boolean }
      open_booking_dispute: {
        Args: { p_booking_id: string; p_reason: string }
        Returns: {
          booking_id: string
          created_at: string
          id: string
          opened_by: string
          reason: string
          resolution_note: string | null
          resolved_at: string | null
          resolved_by: string | null
          status: string
        }
        SetofOptions: {
          from: "*"
          to: "disputes"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      process_refund_event: {
        Args: {
          p_amount_kobo: number
          p_event_hash: string
          p_event_key: string
          p_provider_reference: string
          p_status: string
          p_transaction_reference: string
        }
        Returns: string
      }
      process_successful_payment: {
        Args: {
          p_amount_kobo: number
          p_event_hash: string
          p_event_key: string
          p_reference: string
        }
        Returns: string
      }
      request_cancellation: {
        Args: { p_booking_id: string; p_reason: string }
        Returns: {
          booking_id: string
          calculation: Json
          customer_id: string
          decided_at: string | null
          decided_by: string | null
          decision_reason: string | null
          id: string
          paid_amount_kobo: number
          policy_version: string
          reason: string
          refundable_amount_kobo: number
          requested_at: string
          retained_amount_kobo: number
          status: string
        }
        SetofOptions: {
          from: "*"
          to: "cancellations"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      save_customer_draft: {
        Args: {
          p_brief: Json
          p_expected_revision: number
          p_source_device_id: string
        }
        Returns: {
          brief: Json
          customer_id: string
          revision: number
          source_device_id: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "customer_drafts"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      submit_booking_request: {
        Args: {
          p_client_request_id: string
          p_guest_count: number
          p_package_id: string
          p_requirements: string
          p_vendor_id: string
          p_wedding_brief_id: string
        }
        Returns: {
          claimed_by: string | null
          client_request_id: string | null
          correlation_id: string
          created_at: string
          customer_id: string
          event_date: string
          guest_count: number | null
          id: string
          package_id: string | null
          requirements: string
          status: Database["public"]["Enums"]["booking_status"]
          updated_at: string
          vendor_id: string
          wedding_brief_id: string
        }
        SetofOptions: {
          from: "*"
          to: "bookings"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      valid_booking_transition: {
        Args: {
          new_state: Database["public"]["Enums"]["booking_status"]
          old_state: Database["public"]["Enums"]["booking_status"]
        }
        Returns: boolean
      }
      valid_payment_transition: {
        Args: {
          new_state: Database["public"]["Enums"]["payment_status"]
          old_state: Database["public"]["Enums"]["payment_status"]
        }
        Returns: boolean
      }
      valid_payout_transition: {
        Args: {
          new_state: Database["public"]["Enums"]["payout_status"]
          old_state: Database["public"]["Enums"]["payout_status"]
        }
        Returns: boolean
      }
    }
    Enums: {
      booking_status:
        | "requested"
        | "operations_review"
        | "quote_ready"
        | "accepted_awaiting_payment"
        | "confirmed"
        | "service_due"
        | "fulfilled"
        | "completed"
        | "declined"
        | "expired"
        | "cancelled"
        | "disputed"
      payment_status:
        | "initiated"
        | "pending"
        | "succeeded"
        | "failed"
        | "partially_refunded"
        | "refunded"
        | "charged_back"
      payout_status:
        | "held"
        | "eligible"
        | "processing"
        | "paid"
        | "failed"
        | "reversed"
      vendor_category: "venue" | "caterer"
      verification_status:
        | "draft"
        | "in_review"
        | "approved"
        | "expired"
        | "rejected"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      booking_status: [
        "requested",
        "operations_review",
        "quote_ready",
        "accepted_awaiting_payment",
        "confirmed",
        "service_due",
        "fulfilled",
        "completed",
        "declined",
        "expired",
        "cancelled",
        "disputed",
      ],
      payment_status: [
        "initiated",
        "pending",
        "succeeded",
        "failed",
        "partially_refunded",
        "refunded",
        "charged_back",
      ],
      payout_status: [
        "held",
        "eligible",
        "processing",
        "paid",
        "failed",
        "reversed",
      ],
      vendor_category: ["venue", "caterer"],
      verification_status: [
        "draft",
        "in_review",
        "approved",
        "expired",
        "rejected",
      ],
    },
  },
} as const

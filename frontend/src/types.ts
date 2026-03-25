export interface Site {
  site_id: string
  site_uuid: string
  site_name: string
  domain: string
  created_at: string
}

export interface Event {
  event_id: string
  site_id: string
  uuid: string
  session_id: string
  event_name: string
  page_path: string
  timestamp: string
  properties: Record<string, unknown> | null
}

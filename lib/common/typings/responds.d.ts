export interface Responds {
  GRID: string
  data: any
  success: boolean
  statusCode?: number // only used when failing. If success is true 200 is always returned
}
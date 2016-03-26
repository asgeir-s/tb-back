export interface UserJwtInfo {
  email: string,
  user_id: string,
  app_metadata: any,
  iss: string,
  sub: string,
  aud: string,
  exp: number,
  iat: number
}
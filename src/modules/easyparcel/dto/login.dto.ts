import { IsIn, IsNotEmpty, IsString } from 'class-validator';

export const EASYPARCEL_GRANT_TYPES = [
  'refresh_token',
  'authorization_code',
] as const;

export type EasyparcelGrantType = (typeof EASYPARCEL_GRANT_TYPES)[number];

export class LoginDto {
  @IsIn(EASYPARCEL_GRANT_TYPES)
  grant_type: EasyparcelGrantType;

  type: string;
}

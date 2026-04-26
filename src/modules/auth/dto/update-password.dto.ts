import { IsNotEmpty, Validate, MinLength } from 'class-validator';
import { IsNotWhitespace } from 'src/shared/validation/is_not_whitespace';
import { MatchPasswords } from '../../../shared/validation/password_matched';
import { ApiProperty } from '@nestjs/swagger';

export class updatePasswordDto {
  @IsNotEmpty()
  @Validate(IsNotWhitespace, ['new_password'])
  @MinLength(8)
  @ApiProperty({
    type: String,
  })
  new_password: string;

  @IsNotEmpty()
  @Validate(IsNotWhitespace, ['password_confirmation'])
  @Validate(MatchPasswords, ['new_password'])
  @MinLength(8)
  @ApiProperty({
    type: String,
  })
  password_confirmation: string;

  @IsNotEmpty()
  @Validate(IsNotWhitespace, ['reset_password_token'])
  @ApiProperty({
    type: String,
  })
  reset_password_token: string;
}

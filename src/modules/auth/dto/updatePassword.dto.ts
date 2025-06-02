import { IsNotEmpty, Validate, MinLength } from 'class-validator';
import { IsNotWhitespace } from 'src/shared/validation/is_not_whitespace';
import { MatchPasswords } from '../../../shared/validation/password_matched';
import { TokenCheck } from '../../../shared/validation/user/token_check';
import { CurrentPasswordMatched } from '../../../shared/validation/user/current_password_matched';
import { ApiProperty } from '@nestjs/swagger';

export class updatePasswordDto {
  @IsNotEmpty()
  @Validate(IsNotWhitespace, ['current_password'])
  @Validate(CurrentPasswordMatched, ['current_password'])
  @MinLength(8)
  @ApiProperty({
    type: String,
  })
  current_password: string;

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
}

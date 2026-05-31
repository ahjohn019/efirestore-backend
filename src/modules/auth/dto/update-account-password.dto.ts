import { IsNotEmpty, MinLength, Validate } from 'class-validator';
import { IsNotWhitespace } from 'src/shared/validation/is_not_whitespace';
import { MatchPasswords } from 'src/shared/validation/password_matched';
import { ApiProperty } from '@nestjs/swagger';

export class updateAccountPasswordDto {
  @IsNotEmpty()
  @Validate(IsNotWhitespace, ['current_password'])
  @MinLength(8)
  @ApiProperty({
    type: String,
    example: 'ahrui123',
  })
  current_password: string;

  @IsNotEmpty()
  @Validate(IsNotWhitespace, ['new_password'])
  @MinLength(8)
  @ApiProperty({
    type: String,
    example: '1111aaaa',
  })
  new_password: string;

  @IsNotEmpty()
  @Validate(IsNotWhitespace, ['password_confirmation'])
  @Validate(MatchPasswords, ['new_password'])
  @MinLength(8)
  @ApiProperty({
    type: String,
    example: '1111aaaa',
  })
  password_confirmation: string;
}

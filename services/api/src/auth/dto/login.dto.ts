import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginDto {
  /** `require_tld: false` permite dominios tipo `*.local` usados en seeds / entornos locales. */
  @IsEmail({ require_tld: false })
  email!: string;

  @IsString()
  @MinLength(4)
  password!: string;
}

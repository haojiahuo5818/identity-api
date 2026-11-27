import { Transform } from 'class-transformer';
import { IsString, Length, Matches } from 'class-validator';

function trimString({ value }: { value: unknown }) {
  return typeof value === 'string' ? value.trim() : value;
}

// Reject unpaired surrogates before the database driver encodes the ID as UTF-8.
const validUnicode = /^[^\uD800-\uDFFF]+$/u;

export class ResolveIdentityDto {
  @Transform(trimString)
  @IsString()
  @Length(1, 128)
  @Matches(validUnicode, { message: 'id1 must be valid Unicode text' })
  id1!: string;

  @Transform(trimString)
  @IsString()
  @Length(1, 128)
  @Matches(validUnicode, { message: 'id2 must be valid Unicode text' })
  id2!: string;
}

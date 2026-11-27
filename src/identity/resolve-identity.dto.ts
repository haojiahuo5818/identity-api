import { Transform } from 'class-transformer';
import { IsString, Matches } from 'class-validator';

function trimString({ value }: { value: unknown }) {
  return typeof value === 'string' ? value.trim() : value;
}

// Count Unicode code points like MySQL VARCHAR, and reject unpaired surrogates.
const identifier = /^[^\uD800-\uDFFF]{1,128}$/u;

export class ResolveIdentityDto {
  @Transform(trimString)
  @IsString()
  @Matches(identifier, { message: 'id1 must contain 1 to 128 Unicode characters' })
  id1!: string;

  @Transform(trimString)
  @IsString()
  @Matches(identifier, { message: 'id2 must contain 1 to 128 Unicode characters' })
  id2!: string;
}

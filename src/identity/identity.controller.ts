import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ResolveIdentityDto } from './resolve-identity.dto';
import { IdentityService } from './identity.service';

@Controller('identities')
export class IdentityController {
  constructor(private readonly identities: IdentityService) {}

  @Post('resolve')
  @HttpCode(HttpStatus.OK)
  async resolve(@Body() { id1, id2 }: ResolveIdentityDto) {
    const userID = await this.identities.resolve(id1, id2);
    return { userID };
  }
}

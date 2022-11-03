import { AppteleprompterController } from './appteleprompter.controller';

import { Module } from '@nestjs/common';
import { SnowflakeModule } from '@quickts/nestjs-snowflake';
import { Teleprompter } from 'src/models/admin/teleprompter.model';
import { TypegooseModule } from 'nestjs-typegoose';
import { ToolsService } from 'src/utils/tools.service';
import { CryptoModule } from '@akanass/nestjsx-crypto';
import { AppTeleprompterService } from './appteleprompter.service';
@Module({
  imports: [
    CryptoModule,
    SnowflakeModule.forRoot({ id: 2 }),
    TypegooseModule.forFeature([Teleprompter]),
  ],
  controllers: [
    AppteleprompterController
  ],
  providers: [
    ToolsService,
    AppTeleprompterService
  ],
})
export class AppteleprompterModule { }

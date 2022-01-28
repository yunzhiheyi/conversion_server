import { RecordService } from './record.service';
import { AppRecord } from '../../models/app/record.model';
import { RecordController } from './record.controller';
import { Module } from '@nestjs/common';
import { SnowflakeModule } from '@quickts/nestjs-snowflake';
import { TypegooseModule } from 'nestjs-typegoose';
import { ToolsService } from '../../utils/tools.service';
import { CryptoModule } from '@akanass/nestjsx-crypto';
import { AppTaskType } from '../../models/app/taskType.model';
@Module({
  imports: [
    CryptoModule,
    SnowflakeModule.forRoot({ id: 2 }),
    TypegooseModule.forFeature([AppRecord, AppTaskType]),
  ],
  controllers: [
    RecordController
  ],
  providers: [
    RecordService,
    ToolsService
  ],
})
export class RecordModule { }

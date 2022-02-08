import { ScheduleService } from './schedule.service';
import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { UploadService } from '../upload/upload.service';
import { UploadModel } from 'src/models/admin/upload.model';
import { SystemInfoModel } from 'src/models/admin/system.model';
import { TypegooseModule } from 'nestjs-typegoose';
import { QiniuService } from 'src/utils/qiniu.service';
import { SystemService } from '../system/system.service';
import { SnowflakeModule } from '@quickts/nestjs-snowflake';
import { ToolsService } from 'src/utils/tools.service';
import { CryptoModule } from '@akanass/nestjsx-crypto';
import { DatabaseModel } from '../../models/admin/database.model';
@Module({
  imports: [
    CryptoModule,
    SnowflakeModule.forRoot({ id: 2 }),
    ScheduleModule.forRoot(),
    TypegooseModule.forFeature([UploadModel, DatabaseModel, SystemInfoModel]),
  ],
  controllers: [],
  providers: [
    ScheduleService,
    UploadService,
    QiniuService,
    SystemService,
    ToolsService
  ],
})
export class ScheduleTaskModule { }

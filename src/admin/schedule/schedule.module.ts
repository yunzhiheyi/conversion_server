import { ScheduleService } from './schedule.service';
import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { UploadService } from '../upload/upload.service';
import { UploadModel } from 'src/models/admin/upload.model';
import { AppConversion } from 'src/models/app/conversion.model';
import { AppUserModel } from 'src/models/app/user.model';
import { AppRecord } from 'src/models/app/record.model';
import { ConversionService } from 'src/app/conversion/conversion.service';
import { SystemInfoModel } from 'src/models/admin/system.model';
import { TypegooseModule } from 'nestjs-typegoose';
import { QiniuService } from 'src/utils/qiniu.service';
import { SystemService } from '../system/system.service';
import { SnowflakeModule } from '@quickts/nestjs-snowflake';
import { ToolsService } from 'src/utils/tools.service';
import { TencentAiService } from 'src/utils/tencent.ai';
import { CryptoModule } from '@akanass/nestjsx-crypto';
import { DatabaseModel } from '../../models/admin/database.model';
import { MiniprogramUploadService } from 'src/utils/miniprogram.upload';
@Module({
  imports: [
    CryptoModule,
    SnowflakeModule.forRoot({ id: 2 }),
    ScheduleModule.forRoot(),
    TypegooseModule.forFeature([UploadModel, DatabaseModel, AppUserModel, SystemInfoModel, AppRecord, AppConversion]),
  ],
  controllers: [],
  providers: [
    ScheduleService,
    UploadService,
    QiniuService,
    SystemService,
    TencentAiService,
    MiniprogramUploadService,
    ConversionService,
    ToolsService
  ],
})
export class ScheduleTaskModule { }

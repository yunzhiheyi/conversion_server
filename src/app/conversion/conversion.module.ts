
import { Module } from '@nestjs/common';
import { CryptoModule } from '@akanass/nestjsx-crypto';
import { TypegooseModule } from 'nestjs-typegoose';
import { AppConversion } from '../../models/app/conversion.model';
import { ConversionService } from './conversion.service';
import { QiniuService } from '../../utils/qiniu.service';
import { ToolsService } from '../../utils/tools.service';
import { SystemService } from '../../admin/system/system.service';
import { SystemInfoModel } from '../../models/admin/system.model';
import { ConversionController } from './conversion.controller';
import { AppUserModel } from '../../models/app/user.model';
import { AppRecord } from '../../models/app/record.model';
import { SnowflakeModule } from '@quickts/nestjs-snowflake';
import { TencentAiService } from '../../utils/tencent.ai';
@Module({
  imports: [
    CryptoModule,
    SnowflakeModule.forRoot({ id: 2 }),
    TypegooseModule.forFeature([AppConversion, SystemInfoModel, AppUserModel, AppRecord])
  ],
  controllers: [
    ConversionController
  ],
  providers: [
    QiniuService,
    TencentAiService,
    ToolsService,
    SystemService,
    ConversionService,
  ],
})
export class ConversionModule { }

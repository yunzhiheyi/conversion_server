import { Module } from '@nestjs/common';
import { GenericService } from './generic.service';
import { GenericController } from './generic.controller';
import { ToolsService } from '../../utils/tools.service';
import { CacheService } from '../../utils/redis.service';
import { AdminUser } from '../../models/admin/admin.model';
import { AppConversion } from '../../models/app/conversion.model';
import { ConversionService } from '../../app/conversion/conversion.service';
import { MiniprogramUploadService } from '../../utils/miniprogram.upload';
import { QiniuService } from '../../utils/qiniu.service';
import { SystemService } from '../../admin/system/system.service';
import { UserService } from '../../app/user/user.service';
import { TencentAiService } from '../../utils/tencent.ai';
import { SystemInfoModel } from '../../models/admin/system.model';
import { PriceModel } from '../../models/admin/price.model';
import { CryptoModule } from '@akanass/nestjsx-crypto';
import { TypegooseModule } from 'nestjs-typegoose';
import { AppRecord } from '../../models/app/record.model';
import { AppUserModel } from '../../models/app/user.model';
import { DatabaseModel } from '../../models/admin/database.model';
import { SnowflakeModule } from '@quickts/nestjs-snowflake';
@Module({
  imports: [
    SnowflakeModule.forRoot({ id: 2 }),
    CryptoModule,
    TypegooseModule.forFeature([AdminUser, DatabaseModel, AppConversion, PriceModel, SystemInfoModel, AppRecord, AppUserModel])],
  controllers: [GenericController],
  providers: [
    GenericService,
    SystemService,
    TencentAiService,
    ConversionService,
    MiniprogramUploadService,
    QiniuService,
    UserService,
    ToolsService,
    CacheService
  ]
})
export class GenericModule { }

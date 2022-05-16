import { WechatService } from './wechat.service';
import { Module } from '@nestjs/common';
import { WechatController } from './wechat.controller';
import { SystemService } from '../../admin/system/system.service';
import { SystemInfoModel } from '../../models/admin/system.model';
import { AppUserModel } from '../../models/app/user.model';
import { TypegooseModule } from 'nestjs-typegoose';
import { UserService } from '../../app/user/user.service'
import { CryptoModule } from '@akanass/nestjsx-crypto';
import { CacheService } from '../../utils/redis.service'
import { ToolsService } from '../../utils/tools.service';
import { SnowflakeModule } from '@quickts/nestjs-snowflake';
import { AppRecord } from '../../models/app/record.model';
import { AppConversion } from '../../models/app/conversion.model';
import { ConversionService } from '../../app/conversion/conversion.service';
import { DatabaseModel } from '../../models/admin/database.model';
import { QiniuService } from '../../utils/qiniu.service';
import { TencentAiService } from '../../utils/tencent.ai';
import { MiniprogramUploadService } from 'src/utils/miniprogram.upload';
@Module({
  imports: [
    CryptoModule,
    SnowflakeModule.forRoot({ id: 2 }),
    TypegooseModule.forFeature([SystemInfoModel, DatabaseModel, AppUserModel, AppConversion, AppRecord])
  ],
  controllers: [WechatController],
  providers: [
    UserService,
    CacheService,
    ConversionService,
    WechatService,
    QiniuService,
    SystemService,
    TencentAiService,
    MiniprogramUploadService,
    ToolsService
  ],
})
export class WechatModule { }

import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
// import { TypeOrmModule } from '@nestjs/typeorm';
import { UserService } from './user.service';
import { SnowflakeModule } from '@quickts/nestjs-snowflake';
import { ToolsService } from '../../utils/tools.service';
import { CryptoModule } from '@akanass/nestjsx-crypto';
import { CacheService } from 'src/utils/redis.service';
import { AppUserModel } from '../../models/app/user.model';
import { TypegooseModule } from 'nestjs-typegoose';
import { SystemService } from '../../admin/system/system.service';
import { SystemInfoModel } from 'src/models/admin/system.model';
import { ConversionService } from '../../app/conversion/conversion.service';
import { AppConversion } from '../../models/app/conversion.model';
import { AppRecord } from '../../models/app/record.model';
import { QiniuService } from '../../utils/qiniu.service';
import { TencentAiService } from '../../utils/tencent.ai';
@Module({
  imports: [
    CryptoModule,
    SnowflakeModule.forRoot({ id: 2 }),
    TypegooseModule.forFeature([AppUserModel, SystemInfoModel, AppConversion, AppRecord]),
  ],
  controllers: [UserController],
  providers: [
    UserService,
    SystemService,
    QiniuService,
    TencentAiService,
    ConversionService,
    ToolsService,
    CacheService
  ],
  exports: [UserService]
})
export class AppUserModule { }

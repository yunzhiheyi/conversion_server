import { Module } from '@nestjs/common';
import { PayController } from './pay.controller';
import { PayService } from './pay.service';
import { SystemInfoModel } from '../../models/admin/system.model';
import { OrderModel } from '../../models/admin/order.model';
import { PriceModel } from '../../models/admin/price.model';
import { AppRecord } from '../../models/app/record.model';
import { AppUserModel } from '../../models/app/user.model';
import { PriceService } from '../../admin/price/price.service';
import { SystemService } from '../../admin/system/system.service';
import { TypegooseModule } from 'nestjs-typegoose';
import { ToolsService } from '../../utils/tools.service';
import { AesService } from '@akanass/nestjsx-crypto';
import { CryptoModule } from '@akanass/nestjsx-crypto';
import { CacheService } from 'src/utils/redis.service';
import { WechatService } from '../wechat/wechat.service';
import { UserService } from '../user/user.service';
import { SnowflakeModule } from '@quickts/nestjs-snowflake';
import { AppConversion } from '../../models/app/conversion.model';
import { ConversionService } from '../../app/conversion/conversion.service';
import { QiniuService } from '../../utils/qiniu.service';
import { DatabaseModel } from '../../models/admin/database.model';
import { TencentAiService } from '../../utils/tencent.ai';
@Module({
  imports: [
    CryptoModule,
    SnowflakeModule.forRoot({ id: 2 }),
    TypegooseModule.forFeature([DatabaseModel, SystemInfoModel, OrderModel, AppConversion, PriceModel, AppRecord, AppUserModel])
  ],
  controllers: [PayController],
  providers: [
    PayService,
    SystemService,
    PriceService,
    ToolsService,
    CacheService,
    ConversionService,
    UserService,
    QiniuService,
    TencentAiService,
    WechatService,
    AesService
  ]
})
export class PayModule { }

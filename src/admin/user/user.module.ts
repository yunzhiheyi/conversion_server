
import { Module } from '@nestjs/common';
import { AuserController } from './user.controller';
import { ToolsService } from '../../utils/tools.service';
import { CacheService } from '../../utils/redis.service';
import { AuserService } from './user.service';
import { MenuService } from '../menu/menu.service';
import { CryptoModule } from '@akanass/nestjsx-crypto';
import { TypegooseModule } from "nestjs-typegoose";
import { AdminUser } from '../../models/admin/admin.model';
import { AdminMenu } from '../../models/admin/menu.model';
import { AdminRole } from '../../models/admin/role.model';
import { SystemService } from '../../admin/system/system.service';
import { SystemInfoModel } from '../../models/admin/system.model';
import { SnowflakeModule } from '@quickts/nestjs-snowflake';
import { AppUserModel } from '../../models/app/user.model';
import { AppRecord } from '../../models/app/record.model';
import { DatabaseModel } from '../../models/admin/database.model';
import { AppConversion } from '../../models/app/conversion.model';
@Module({
  imports: [
    CryptoModule,
    SnowflakeModule.forRoot({ id: 2 }),
    TypegooseModule.forFeature([AdminUser, AppRecord, AppConversion, DatabaseModel, AppUserModel, AdminMenu, AdminRole, SystemInfoModel]),
  ],
  controllers: [AuserController],
  providers: [
    MenuService,
    SystemService,
    CacheService,
    AuserService,
    ToolsService,
  ],
  exports: [AuserService]

})
export class AuserModule { }

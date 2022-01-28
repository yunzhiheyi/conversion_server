import { RoleController } from './role.controller';
import { RoleService } from './role.service';
import { Module } from '@nestjs/common';
import { AdminRole } from '../../models/admin/role.model';
import { AdminRoleBtn } from '../../models/admin/role.btn.model';
import { ToolsService } from '../../utils/tools.service';
import { CacheService } from '../../utils/redis.service';
import { CryptoModule } from '@akanass/nestjsx-crypto';
import { TypegooseModule } from "nestjs-typegoose";
import { SnowflakeModule } from '@quickts/nestjs-snowflake';
@Module({
  imports: [
    CryptoModule,
    SnowflakeModule.forRoot({ id: 2 }),
    TypegooseModule.forFeature([AdminRole, AdminRoleBtn]),
  ],
  controllers: [
    RoleController
  ],
  providers: [
    CacheService,
    ToolsService,
    RoleService,],
})
export class RoleModule { }

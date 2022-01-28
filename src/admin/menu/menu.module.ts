import { Module } from '@nestjs/common';
import { MenuService } from './menu.service';
import { MenuController } from './menu.controller';
import { ToolsService } from '../../utils/tools.service';
import { TypegooseModule } from "nestjs-typegoose";
import { CryptoModule } from '@akanass/nestjsx-crypto';
import { AdminMenu } from '../../models/admin/menu.model';
import { AdminRole } from '../../models/admin/role.model';
import { SnowflakeModule } from '@quickts/nestjs-snowflake';
@Module({
  imports: [
    CryptoModule,
    SnowflakeModule.forRoot({ id: 2 }),
    TypegooseModule.forFeature([AdminMenu, AdminRole]),
  ],
  controllers: [MenuController],
  providers: [
    MenuService,
    ToolsService,
  ],
  exports: [MenuService]
})
export class MenuModule { }

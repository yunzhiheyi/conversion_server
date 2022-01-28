import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';
import { CryptoModule } from '@akanass/nestjsx-crypto';
import { Module } from '@nestjs/common';
import { OrderModel } from '../../models/admin/order.model';
import { TypegooseModule } from 'nestjs-typegoose';
import { AppUserModel } from '../../models/app/user.model';
import { ToolsService } from 'src/utils/tools.service';
@Module({
  imports: [
    CryptoModule,
    TypegooseModule.forFeature([OrderModel, AppUserModel]),
  ],
  controllers: [DashboardController],
  providers: [
    DashboardService,
    ToolsService
  ],
})
export class DashboardModule { }

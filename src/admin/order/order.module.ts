import { Module } from '@nestjs/common';
import { TypegooseModule } from 'nestjs-typegoose';
import { OrderModel } from '../../models/admin/order.model';
import { ToolsService } from '../../utils/tools.service';
import { OrderService } from './order.service'
import { OrderController } from './order.controller'
import { SnowflakeModule } from '@quickts/nestjs-snowflake';
import { AesService } from '@akanass/nestjsx-crypto';
@Module({
  imports: [
    SnowflakeModule.forRoot({ id: 2 }),
    TypegooseModule.forFeature([OrderModel]),
  ],
  controllers: [
    OrderController
  ],
  providers: [
    ToolsService,
    OrderService,
    AesService
  ],
})
export class OrderModule { }

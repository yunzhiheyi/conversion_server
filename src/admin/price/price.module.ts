import { Module } from '@nestjs/common';
import { TypegooseModule } from 'nestjs-typegoose';
import { PriceModel } from '../../models/admin/price.model';
import { ToolsService } from '../../utils/tools.service';
import { PriceService } from './price.service'
import { PriceController } from './price.controller'
import { AesService } from '@akanass/nestjsx-crypto';
import { SnowflakeModule } from '@quickts/nestjs-snowflake';
@Module({
  imports: [
    SnowflakeModule.forRoot({ id: 2 }),
    TypegooseModule.forFeature([PriceModel]),
  ],
  controllers: [
    PriceController
  ],
  providers: [
    ToolsService,
    AesService,
    PriceService
  ],
})
export class PriceModule { }

import { SystemService } from './system.service';
import { Module } from '@nestjs/common';
import { SystemController } from './system.controller';
import { ToolsService } from '../../utils/tools.service';
import { SystemInfoModel } from '../../models/admin/system.model';
import { TypegooseModule } from 'nestjs-typegoose';
import { AesService } from '@akanass/nestjsx-crypto';

@Module({
  imports: [
    TypegooseModule.forFeature([SystemInfoModel]),
  ],
  controllers: [SystemController],
  providers: [
    AesService,
    SystemService,
    ToolsService
  ],
})
export class SystemModule { }

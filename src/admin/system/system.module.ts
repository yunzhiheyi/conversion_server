import { SystemService } from './system.service';
import { Module } from '@nestjs/common';
import { SystemController } from './system.controller';
import { ToolsService } from '../../utils/tools.service';
import { UploadService } from '../../utils/upload.service';
import { QiniuService } from '../../utils/qiniu.service';
import { SystemInfoModel } from '../../models/admin/system.model';
import { UploadModel } from '../../models/admin/upload.model';
import { TypegooseModule } from 'nestjs-typegoose';
import { AesService } from '@akanass/nestjsx-crypto';
import { SnowflakeModule } from '@quickts/nestjs-snowflake';

@Module({
  imports: [
    SnowflakeModule.forRoot({ id: 2 }),
    TypegooseModule.forFeature([SystemInfoModel, UploadModel]),
  ],
  controllers: [SystemController],
  providers: [
    AesService,
    SystemService,
    QiniuService,
    UploadService,
    ToolsService
  ],
})
export class SystemModule { }

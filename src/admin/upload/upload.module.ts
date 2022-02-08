import { UploadService } from './upload.service';
import { Module } from '@nestjs/common';
import { UploadModel } from '../../models/admin/upload.model';
import { TypegooseModule } from 'nestjs-typegoose';
import { SystemService } from 'src/admin/system/system.service';
import { SystemInfoModel } from '../../models/admin/system.model';
import { QiniuService } from '../../utils/qiniu.service';
import { ToolsService } from '../../utils/tools.service';
import { SnowflakeModule } from '@quickts/nestjs-snowflake';
import { CryptoModule } from '@akanass/nestjsx-crypto';
import { DatabaseModel } from '../../models/admin/database.model';
@Module({
  imports: [
    CryptoModule,
    SnowflakeModule.forRoot({ id: 2 }),
    TypegooseModule.forFeature([UploadModel, DatabaseModel, SystemInfoModel]),
  ],
  controllers: [],
  providers: [
    UploadService,
    QiniuService,
    SystemService,
    ToolsService
  ],
})
export class UploadModule { }

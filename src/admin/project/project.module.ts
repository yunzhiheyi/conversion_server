import { ProjectService } from './project.service';
import { ProjectController } from './project.controller';
import { SnowflakeModule } from '@quickts/nestjs-snowflake';
import { Module } from '@nestjs/common';
import { ProjectModel } from '../../models/admin/project.model';
import { TypegooseModule } from 'nestjs-typegoose';
import { CryptoModule } from '@akanass/nestjsx-crypto';
import { ToolsService } from 'src/utils/tools.service';
import { UploadModel } from '../../models/admin/upload.model';
@Module({
  imports: [
    CryptoModule,
    SnowflakeModule.forRoot({ id: 2 }),
    TypegooseModule.forFeature([ProjectModel, UploadModel]),
  ],
  controllers: [
    ProjectController
  ],
  providers: [
    ProjectService,
    ToolsService,
  ],
})
export class ProjectModule { }

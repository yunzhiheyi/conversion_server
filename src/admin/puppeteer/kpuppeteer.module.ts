import { Module } from '@nestjs/common';
import { kPuppeteerController } from './kpuppeteer.controller';
import { kPuppeteerService } from './kpuppeteer.service';
import { PuppeteerModule } from 'nest-puppeteer';
import { AgentModel } from 'src/models/admin/agent.model';
import { TypegooseModule } from 'nestjs-typegoose';
import { ToolsService } from 'src/utils/tools.service';
import { CryptoModule } from '@akanass/nestjsx-crypto';
import { HousingModel } from 'src/models/admin/housing.model';
import { CommunityModel } from 'src/models/admin/community.model';
import { SnowflakeModule } from '@quickts/nestjs-snowflake';
// import { NestjsHasherModule } from '@sinuos/nestjs-hasher';
import { HashModule } from 'nestjs-hash';
import { SystemInfoModel } from 'src/models/admin/system.model';
import { ResourcesModel } from 'src/models/admin/resource.model';

@Module({
  imports: [
    CryptoModule,
    PuppeteerModule.forRoot(),
    SnowflakeModule.forRoot({ id: 2 }),
    HashModule.forRoot({ type: 'md5' }),
    TypegooseModule.forFeature([AgentModel, HousingModel, CommunityModel, SystemInfoModel, ResourcesModel]),
  ],
  controllers: [
    kPuppeteerController
  ],
  providers: [
    kPuppeteerService,
    ToolsService,
  ],
})
export class kPuppeteerModule { }

import { CryptoModule } from '@akanass/nestjsx-crypto';
import { Module } from '@nestjs/common';
import { SnowflakeModule } from '@quickts/nestjs-snowflake';
import { TypegooseModule } from 'nestjs-typegoose';
import { AgentModel } from 'src/models/admin/agent.model';
import { CommunityModel } from 'src/models/admin/community.model';
import { HousingModel } from 'src/models/admin/housing.model';
import { ToolsService } from 'src/utils/tools.service';
import { kPuppeteerService } from '../puppeteer/kpuppeteer.service';
import { EventsGateway } from './events.gateway';
import { NestjsHasherModule } from '@sinuos/nestjs-hasher';
@Module({
  imports: [
    CryptoModule,
    SnowflakeModule.forRoot({ id: 2 }),
    NestjsHasherModule.register({
      provider: 'bcrypt',
      round: 10,
    }),
    TypegooseModule.forFeature([AgentModel, HousingModel, CommunityModel]),
  ],
  providers: [
    EventsGateway,
    kPuppeteerService,
    ToolsService],
})
export class EventsModule { }

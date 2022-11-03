import { TeleprompterService } from './teleprompter.service';
import { Module } from '@nestjs/common';
import { TeleprompterController } from './teleprompter.controller';
import { SnowflakeModule } from '@quickts/nestjs-snowflake';
import { TypegooseModule } from 'nestjs-typegoose';
import { Teleprompter } from 'src/models/admin/teleprompter.model';

@Module({
  imports: [
    SnowflakeModule.forRoot({ id: 2 }),
    TypegooseModule.forFeature([Teleprompter]),
  ],
  controllers: [TeleprompterController],
  providers: [
    TeleprompterService
  ],
})
export class TeleprompterModule { }

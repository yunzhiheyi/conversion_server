import { kPuppeteerModule } from './admin/puppeteer/kpuppeteer.module';
import { EventsModule } from './admin/events/events.module';
import { AppteleprompterModule } from './app/teleprompter/appteleprompter.module';
import { TeleprompterModule } from './admin/teleprompter/teleprompter.module';
import { ProjectModule } from './admin/project/project.module';
import { DashboardModule } from './admin/dashboard/dashboard.module';
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuserModule } from './admin/user/user.module';
import { MenuModule } from './admin/menu/menu.module';
import { RoleModule } from './admin/role/role.module';
import { AppUserModule } from './app/user/user.module';
import { UploadModule } from './admin/upload/upload.module';
import { ScheduleTaskModule } from './admin/schedule/schedule.module';
import { ConversionModule } from './app/conversion/conversion.module';
import { GenericModule } from './app/generic/generic.module';
import { SystemModule } from './admin/system/system.module';
import { WechatModule } from './app/wechat/wechat.module';
import { OrderModule } from './admin/order/order.module';
import { PriceModule } from './admin/price/price.module';
import { RecordModule } from './app/record/record.module';
import { PayModule } from './app/pay/pay.module';
import { TypegooseModule } from 'nestjs-typegoose';
import { BullMQModule } from 'nestjs-bullmq';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { ConfigModule, ConfigService } from '@nestjs/config';
@Module({
  imports: [

    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '.', 'public'),
    }),
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.development', '.env.production'],
    }),
    BullMQModule.forRootAsync({
      name: 'QueueName',
      inject: [ConfigService],
      useFactory: () => ({
        config: {
          connection: { host: 'localhost', db: 3, password: 'redis123456' },
        },
      }),
    }),
    // 定时任务
    // mongodb数据库连接
    TypegooseModule.forRoot("mongodb://localhost:27017/conversionDB", {
      // useNewUrlParser: true,
    }),
    EventsModule,
    kPuppeteerModule, ProjectModule, ScheduleTaskModule, UploadModule, AppteleprompterModule, TeleprompterModule, DashboardModule, AuserModule, MenuModule, RoleModule, GenericModule, AppUserModule, RecordModule, PayModule, SystemModule, ConversionModule, WechatModule, OrderModule, PriceModule],
  controllers: [
    AppController
  ],
  providers: [
    AppService,
  ],
})
export class AppModule { }

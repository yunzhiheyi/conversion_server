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
@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '.', 'public'),
    }),
    BullMQModule.forRootAsync({
      name: 'QueueName',
      useFactory: () => ({
        config: {
          // url: 'redis://:password@localhost:6379',
          connection: { host: 'localhost', port: 6379, db: 3, password: 'redis123456' },
        },
      }),
    }),
    // 定时任务
    // mongodb数据库连接
    TypegooseModule.forRoot("mongodb://localhost:27017/conversionDB", {
      // useNewUrlParser: true,
    }),
    ProjectModule, ScheduleTaskModule, UploadModule, DashboardModule, AuserModule, MenuModule, RoleModule, GenericModule, AppUserModule, RecordModule, PayModule, SystemModule, ConversionModule, WechatModule, OrderModule, PriceModule],
  controllers: [
    AppController
  ],
  providers: [
    AppService,
  ],
})
export class AppModule { }

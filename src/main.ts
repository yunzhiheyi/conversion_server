import { NestFactory } from '@nestjs/core';
import { AppUserModule } from './app/user/user.module';
import { AppteleprompterModule } from './app/teleprompter/appteleprompter.module';
import { PayModule } from './app/pay/pay.module';
import { AuserModule } from './admin/user/user.module';
import { SystemModule } from './admin/system/system.module';
import { RoleModule } from './admin/role/role.module';
import { RecordModule } from './app/record/record.module';
import { MenuModule } from './admin/menu/menu.module';
import { GenericModule } from './app/generic/generic.module';
import { WechatModule } from './app/wechat/wechat.module';
import { OrderModule } from './admin/order/order.module';
import { PriceModule } from './admin/price/price.module';
import { DashboardModule } from './admin/dashboard/dashboard.module';
import { ConversionModule } from './app/conversion/conversion.module';
import { ProjectModule } from './admin/project/project.module';
import { kPuppeteerModule } from './admin/puppeteer/kpuppeteer.module';
import { AppModule } from './app.module';
import * as dotenv from 'dotenv';
dotenv.config()
import { jwtSecret } from './config';
var redis = require('redis')
import session from 'express-session';
var bodyParser = require('body-parser');
require('body-parser-xml')(bodyParser);
var RedisStrore = require('connect-redis')(session);
//引入
import { NestExpressApplication } from '@nestjs/platform-express'
import { HttpExceptionFilter } from './filter/http-exception.filter';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { logger } from './middleware/logger.middleware';
import { TransformInterceptor } from './middleware/transform.middleware';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.use(bodyParser.json({ limit: '150mb' }));
  app.use(bodyParser.raw({ limit: '150mb' }));
  app.use(bodyParser.xml());
  // 监听所有的请求路由，并打印日志
  // app.use(logger);
  app.use(session({
    secret: jwtSecret.secret,
    store: new RedisStrore({
      client: redis.createClient({
        password: 'redis123456',
        db: 0,
        port: 6379
      }),
      ttl: 300000
    }),
    resave: false,
    saveUninitialized: false
  }))
  // var options = {
  //   host: 'localhost',
  //   port: 3306,
  //   user: 'root',
  //   password: 'mysql@123456',
  //   database: 'big_ptime',
  //   clearExpired: true,   // 是否自动检查并清除过期会话：
  //   checkExpirationInterval: 900000,// 清除过期会话的频率；毫秒: 
  //   createDatabaseTable: true,
  //   schema: {
  //     tableName: 'b_session',
  //     columnNames: {
  //       session_id: 'session_id',
  //       expires: 'expires',
  //       data: 'data'
  //     }
  //   }
  // };
  // var sessionStore = new MySQLStore(options);

  app.setGlobalPrefix('api');
  app.enableCors();
  // 使用拦截器打印出参
  // app.useGlobalInterceptors(new TransformInterceptor());
  // app.useGlobalFilters(new HttpExceptionFilter());
  // 服务端Swagger
  const config = new DocumentBuilder()
    .setTitle('语音转换精灵服务端')
    .setDescription('RESTful-API前后端后端服务管理接口')
    .setVersion('1.0.0')
    .build();
  const document = SwaggerModule.createDocument(app, config, { include: [AuserModule, DashboardModule, RoleModule, MenuModule, SystemModule, OrderModule, PriceModule, ProjectModule] });
  // APP端Swagger
  const _config = new DocumentBuilder()
    .setTitle('语音转换精灵小程序端')
    .setDescription('RESTful-API前后端后端服务管理接口')
    .setVersion('1.0.0')
    .build();
  const _document = SwaggerModule.createDocument(app, _config, { include: [kPuppeteerModule, GenericModule, AppUserModule, PayModule, AppteleprompterModule, ConversionModule, WechatModule, RecordModule] });
  SwaggerModule.setup('api-docs/app', app, _document);
  SwaggerModule.setup('api-docs/admin', app, document,);
  await app.listen(3005);
}
bootstrap();

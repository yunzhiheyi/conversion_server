import { Body, Controller, Get, Post, Request, All, Headers, UseGuards, Query, Req, Res, HttpCode, Logger } from '@nestjs/common';
import { ApiHeader, ApiOperation, ApiTags } from '@nestjs/swagger';
import { kPuppeteerService } from './kpuppeteer.service';
import * as cheerio from 'cheerio';
import { pagesDto, IdDto, housingIdDto, KaolaBody } from '../admin.dto';
@Controller('admin')
@ApiTags('爬虫')
export class kPuppeteerController {
  logger: Logger;
  constructor(
    private readonly _kPuppeteerService: kPuppeteerService,
  ) {
    this.logger = new Logger('kPuppeteerController')
  }
  @Get('kpuppeteer/loading')
  @HttpCode(200)
  @ApiOperation({ summary: '加载页面' })
  async loadingPage() {
    // this.logger.log('正在爬取内容...')
    // var content = await this._kPuppeteerService.create();
    // this.logger.log('爬取成功正在数据清理...')
    // const $ = cheerio.load(content);
    // var amenities = [];
    // $('._3atmT').each(function (i, elem) {
    //   amenities.push({
    //     iconUrl: $(this).children('._1ixC5').attr('src'),
    //     name: $(this).children('p._2sIc2').text()
    //   })
    // });
    // var resData = {
    //   name: $('h1._3Wogd').text(),
    //   price: $('p._1zGm8').text(),
    //   amenities: amenities
    // }
    var resData = {}
    // this.logger.log('数据清理完成')
    console.log('结果JSON-');
    return resData;
  }
  @Get('puppeteer/agents/list')
  @HttpCode(200)
  @ApiOperation({ summary: '获取中介列表' })
  async agentsList(@Query() _Query: pagesDto) {
    var project = await this._kPuppeteerService.list(_Query);
    return {
      code: 200,
      data: project,
      message: '获取成功'
    }
  }
  @Get('puppeteer/agents/details')
  @HttpCode(200)
  @ApiOperation({ summary: '获取中介房源详情' })
  async agentsDetails(@Query() _Query: housingIdDto) {
    var project = await this._kPuppeteerService.queryDetails(_Query);
    return {
      code: 200,
      data: project,
      message: '获取成功'
    }
  }
  @Get('puppeteer/housing/details')
  @HttpCode(200)
  @ApiOperation({ summary: '获取房源详情' })
  async housinDetails(@Query() _Query: IdDto) {
    var project = await this._kPuppeteerService.queryHousingDetails(_Query);
    return {
      code: 200,
      data: project,
      message: '获取成功'
    }
  }

  @Post('puppeteer/housing/injection')
  @HttpCode(200)
  @ApiOperation({ summary: '数据入库' })
  async housinInjection(@Body() _KaolaBody: KaolaBody) {
    var resData = await this._kPuppeteerService.injectionKaolaSql(_KaolaBody);
    return resData
  }

  @Post('puppeteer/housing/downloadResource')
  @HttpCode(200)
  @ApiOperation({ summary: '下载资源' })
  async downloadResource(@Body() _KaolaBody: KaolaBody) {
    var resData = await this._kPuppeteerService.updataResource(_KaolaBody);
    return {
      code: 200,
      data: resData,
      message: '下载成功'
    }
  }

  @Post('puppeteer/housing/cargoQueue')
  @HttpCode(200)
  @ApiOperation({ summary: '队列执行' })
  async cargoQueue(@Body() _KaolaBody: KaolaBody) {
    this._kPuppeteerService.cargoQueue(_KaolaBody);
    return {
      code: 200,
      message: '执行成功'
    }
  }
}

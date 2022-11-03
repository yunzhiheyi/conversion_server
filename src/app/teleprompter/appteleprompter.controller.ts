import { Controller, Get, Post, UseGuards, Headers, HttpCode, Body, Query } from '@nestjs/common';
import { ApiHeader, ApiOperation, ApiTags } from '@nestjs/swagger';
import { pagesDto, AddEditContentDto } from 'src/app/app.dto';
import { AdminGuard } from 'src/admin/admin.guard';
import { ToolsService } from 'src/utils/tools.service';
import { AppGuard } from '../app.guard';
import { AppTeleprompterService } from './appteleprompter.service';
@Controller('app')
@ApiTags('提词器')
export class AppteleprompterController {
  constructor(
    private readonly toolsService: ToolsService,
    private readonly teleprompterService: AppTeleprompterService,
  ) { }
  @Post('user/teleprompter/add')
  @HttpCode(200)
  @UseGuards(AdminGuard) // 拦截权限
  @ApiOperation({ summary: '添加价格' })
  @ApiHeader({
    name: 'Authorization',
    required: false,
    description: '本次请求请带上token',
  })
  async addContent(@Body() AddEditContent: AddEditContentDto, @Headers() getHeaders: Headers) {
    var userInfo = await this.toolsService.TokenGetUserInfo(getHeaders['app-access-token'])
    var result = await this.teleprompterService.create(AddEditContent, userInfo.id);
    var code = 200;
    var message = '添加成功'
    if (!result) {
      code = 202;
      message = '获取失败'
    }
    return {
      code,
      message
    }
  }
  @Get('user/teleprompter/list')
  @HttpCode(200)
  // @UseGuards(AppGuard) // 拦截权限
  @ApiOperation({ summary: '获取用户提词器列表' })
  @ApiHeader({
    name: 'app-access-token',
    required: false,
    description: '本次请求请带上token',
  })
  async getContentList(@Query() _Query: pagesDto, @Headers() getHeaders: Headers) {
    // var userInfo = await this.toolsService.TokenGetUserInfo(getHeaders['app-access-token'])
    // console.log(userInfo);
    var result = await this.teleprompterService.list(_Query, '6900995700788568064');
    console.log(result);
    var code = 200;
    var message = '获取成功'
    if (!result) {
      code = 202;
      message = '获取失败'
    }
    return {
      code,
      data: result,
      message
    }
  }

}

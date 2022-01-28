
import { Body, Controller, Get, Post, Request, Headers, UseGuards, Query, Req, Res, HttpCode } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ConversionService } from './conversion.service';
import { idDto, pagesDto, UrlDto } from '../app.dto';
import { AppGuard } from '../app.guard';
import { ToolsService } from 'src/utils/tools.service';
@Controller('app')
@ApiTags('转写')
export class ConversionController {
  constructor(
    private readonly conversionService: ConversionService,
    private readonly toolsService: ToolsService,
  ) { }
  // 转写详情查询
  @Get('conversion/query')
  @HttpCode(200)
  @UseGuards(AppGuard) // 拦截权限
  @ApiOperation({ summary: '转写详情查询' })
  async conversionQuery(@Query() _Query: idDto) {
    const _data = await this.conversionService.query(_Query);
    return {
      code: 200,
      data: _data,
      message: '获取成功',
    }
  }

  // 删除转写详情
  @Get('conversion/delete')
  @HttpCode(200)
  @UseGuards(AppGuard) // 拦截权限
  @ApiOperation({ summary: '删除转写详情' })
  async conversionDelete(@Query() _Query: idDto) {
    const _data = await this.conversionService.delete(_Query);
    return {
      code: 200,
      data: true,
      message: '删除成功',
    }
  }
  // 重新提交转写
  @Post('conversion/resubmit')
  @HttpCode(200)
  @UseGuards(AppGuard) // 拦截权限
  @ApiOperation({ summary: '重新提交转写' })
  async conversionResubmit(@Body() _body: idDto) {
    const _data = await this.conversionService.tencentAiConversion(_body.id);
    return {
      code: 200,
      data: _data,
      message: '转写成功',
    }
  }
  // 转写列表
  @Get('conversion/list')
  @HttpCode(200)
  @UseGuards(AppGuard) // 拦截权限
  @ApiOperation({ summary: '转写详情列表' })
  async conversionList(@Query() _Query: pagesDto, @Headers() getHeaders: Headers) {
    var userInfo = await this.toolsService.TokenGetUserInfo(getHeaders['app-access-token'])
    const _data = await this.conversionService.list(_Query, userInfo.data['id']);
    return {
      code: 200,
      data: _data,
      message: '获取成功',
    }
  }
  // 在线提取视频
  @Post('conversion/parse')
  @HttpCode(200)
  @UseGuards(AppGuard) // 拦截权限
  @ApiOperation({ summary: '在线提取视频' })
  async conversionParse(@Body() _body: UrlDto, @Headers() getHeaders: Headers) {
    var userInfo = await this.toolsService.TokenGetUserInfo(getHeaders['app-access-token'])
    const _data = await this.conversionService.parse(_body.url, userInfo['data'].id);
    if (_data) {
      return {
        code: 200,
        id: _data._id,
        data: !_data.code,
        message: !_data.code ? '获取成功' : '转写失败, 时长不足',
      }
    }
  }
  // 用户邀请记录数据
  @Get('user/invitation/record')
  @HttpCode(200)
  @UseGuards(AppGuard) // 拦截权限
  @ApiOperation({ summary: '转写详情列表' })
  async userInvitationRecord(@Query() _Query: pagesDto, @Headers() getHeaders: Headers) {
    var userInfo = await this.toolsService.TokenGetUserInfo(getHeaders['app-access-token'])
    const _data = await this.conversionService.userInvitationRecord(userInfo.data['id']);
    return {
      code: 200,
      data: {
        count: _data[0] && _data[0].count || 0,
        timeCount: _data[0] && _data[0].timeCount || 0,
      },
      message: '获取成功',
    }
  }
}

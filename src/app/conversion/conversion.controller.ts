
import { Body, Controller, Get, Post, Request, Headers, UseGuards, Query, Req, Res, HttpCode } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ConversionService } from './conversion.service';
import { idDto, pagesDto, UrlDto, taskId } from '../app.dto';
import { AppGuard } from '../app.guard';
import { TencentAiService } from 'src/utils/tencent.ai';
import { ToolsService } from 'src/utils/tools.service';
@Controller('app')
@ApiTags('转写')
export class ConversionController {
  constructor(
    private readonly conversionService: ConversionService,
    private readonly toolsService: ToolsService,
    private readonly tencentAiService: TencentAiService,
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
  async conversionResubmit(@Body() _body: idDto, @Headers() getHeaders: Headers) {
    var userInfo = await this.toolsService.TokenGetUserInfo(getHeaders['app-access-token'])
    const _data = await this.conversionService.tencentAiConversion(_body.id, userInfo.data['id']);
    return {
      code: 200,
      data: _data.code,
      message: _data.code === 1 ? '转写成功' : '时长不足，请充值',
    }
  }
  // 转写列表
  @Get('conversion/list')
  @HttpCode(200)
  @UseGuards(AppGuard) // 拦截权限
  @ApiOperation({ summary: '转写记录列表' })
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
  @ApiOperation({ summary: '邀请记录列表' })
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

  // 用户任务池列表查询结果
  @Post('user/conversion/taskQuery')
  @HttpCode(200)
  @UseGuards(AppGuard) // 拦截权限
  @ApiOperation({ summary: '任务查询结果' })
  async userConversionRecordQuery(@Body() _body: taskId, @Headers() getHeaders: Headers) {
    const _resData = await this.tencentAiService.DescribeTaskStatus(_body.taskId);
    console.log('--------')
    if (_resData.StatusStr === 'doing') {
      return {
        code: 202,
        data: null,
        message: '正在努力转换中',
      }
    }
    if (_resData.ResultDetail) {
      var ResultDetail = _resData.ResultDetail.map((item) => {
        return {
          "text": item.FinalSentence,
          "start_time": item.StartMs,
          "end_time": item.EndMs,
          "speaker_id": 0
        }
      })
    }
    console.log('--------')
    var _data = await this.conversionService.updateManyData(_resData.TaskId, {
      taskDetailed: ResultDetail,
      taskStatus: 3,
      taskText: _resData.Result.replace(/\[.*?\]  /g, "\n"),
    })
    if (!_data) {
      return {
        code: 200,
        data: null,
        message: '更新失败',
      }
    }
    return {
      code: 200,
      data: _resData,
      message: '查询成功1',
    }
  }
}

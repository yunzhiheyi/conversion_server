import { Controller, Get, Post, UseGuards, Headers } from '@nestjs/common';
import { ApiHeader, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ToolsService } from 'src/utils/tools.service';
import { AppGuard } from '../app.guard';
import { RecordService } from './record.service';
@Controller('app')
@ApiTags('时长记录')
export class RecordController {
  constructor(
    private readonly toolsService: ToolsService,
    private readonly recordService: RecordService,
  ) { }
  @Get('user/record/list')
  @UseGuards(AppGuard) // 拦截权限
  @ApiOperation({ summary: '获取用户时长记录' })
  @ApiHeader({
    name: 'app-access-token',
    required: false,
    description: '本次请求请带上token',
  })
  async getUserRecordList(@Headers() getHeaders: Headers) {
    var userInfo = await this.toolsService.TokenGetUserInfo(getHeaders['app-access-token'])
    const data = await this.recordService.recordList(userInfo.data['id'])
    return {
      code: 200,
      data,
      success: true
    }
  }
}


import { Body, Controller, Get, HttpCode, Post, Query, Req, Res, UseGuards, Headers } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AddEditSystemDto, fileDeleteDto, IdsDto, pagesDto } from '../admin.dto';
import { AdminGuard } from '../admin.guard';
import { SystemService } from './system.service'
import { UploadService } from '../../admin/upload/upload.service';
import { ToolsService } from 'src/utils/tools.service';
@Controller('admin/system')
@ApiTags('系统参数')
export class SystemController {
  constructor(
    private readonly systemService: SystemService,
    private readonly uploadService: UploadService,
    private readonly toolsService: ToolsService,
  ) { }
  // 添加编辑基本参数
  @Post('add')
  @HttpCode(200)
  @UseGuards(AdminGuard) // 拦截权限
  @ApiOperation({ summary: '添加编辑基本参数' })
  async addSystemAddUpdate(@Body() PostAdd: AddEditSystemDto) {
    var result = await this.systemService.addSystemInfo(PostAdd);
    var code = 200;
    var message = '编辑成功'
    if (!result) {
      code = 202;
      message = '编辑失败'
    }
    return {
      code,
      message
    }
  }
  // 查询基本参数
  @Get('query')
  @HttpCode(200)
  @UseGuards(AdminGuard) // 拦截权限
  @ApiOperation({ summary: '查询基本参数' })
  async getSystemInfo() {
    var result = await this.systemService.getSystemInfo();
    var code = 200;
    var message = '获取成功'
    if (!result) {
      code = 202;
      message = '获取失败'
    }
    return {
      code,
      message
    }
  }
  // 通用上传
  @Post('fileUpload')
  @HttpCode(200)
  @UseGuards(AdminGuard) // 拦截权限
  @ApiOperation({ summary: '通用上传' })
  async fileUpload(@Req() req) {
    var result = await this.uploadService.uploadFile(req)
    var code = 200;
    var message = '上传成功'
    if (!result) {
      code = 202;
      message = '上传失败'
    }
    return {
      code,
      data: result,
      message
    }
  }
  // 通用删除
  @Post('fileDelete')
  @HttpCode(200)
  @UseGuards(AdminGuard) // 拦截权限
  @ApiOperation({ summary: '通用上传' })
  async fileDelete(@Body() FileDeleteDto: fileDeleteDto) {
    var result = await this.uploadService.deleteImage(FileDeleteDto)
    var code = 200;
    var data = result.data;
    var message = result.msg
    if (result && !result['data']) {
      code = 202;
    }
    return {
      code,
      data,
      message
    }
  }
  // 备份数据库
  @Post('mongodump')
  @HttpCode(200)
  @UseGuards(AdminGuard) // 拦截权限
  @ApiOperation({ summary: '数据库备份' })
  async mongodump() {
    var result = await this.systemService.mongodump()
    var code = 200;
    var data = true;
    var message = '成功'
    return {
      code,
      data,
      message
    }
  }
  // 备份数据库
  @Get('mongorestore')
  @HttpCode(200)
  @UseGuards(AdminGuard) // 拦截权限
  @ApiOperation({ summary: '数据库还原' })
  async mongorestore(@Query() _Query: IdsDto) {
    var result = await this.systemService.mongorestore(_Query.id)
    var code = 200;
    var message = '还原成功'
    return {
      code,
      data: result,
      message
    }
  }
  // 删除备份
  @Get('database/delete')
  @HttpCode(200)
  @UseGuards(AdminGuard) // 拦截权限
  @ApiOperation({ summary: '删除' })
  async deleteDatabase(@Query() _Query: IdsDto, @Headers() getHeaders: Headers) {
    var result = await this.systemService.delete(_Query);
    var code = 200;
    var message = '删除成功'
    var data = true;
    if (!result) {
      code = 202;
      message = '删除失败'
      data = false;
    }
    return {
      code,
      data,
      message
    }
  }
  // 数据库列表
  @Get('database/list')
  @HttpCode(200)
  @UseGuards(AdminGuard) // 拦截权限
  @ApiOperation({ summary: '数据库列表' })
  async databaseList(@Query() _Query: pagesDto) {
    var result = await this.systemService.databaseList(_Query);
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

import { Controller, HttpCode, Get, Post, Headers, Body, Query, Req, Res, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiHeader, ApiTags } from '@nestjs/swagger';
import { ToolsService } from 'src/utils/tools.service';
import { AddEditProjectDto, IdsDto, pagesDto, IdDto } from '../admin.dto';
import { AdminGuard } from '../admin.guard';
import { ProjectService } from '../project/project.service';
@Controller('admin')
@ApiTags('专题管理')
@Controller()
export class ProjectController {
  constructor(
    private readonly toolsService: ToolsService,
    private readonly projectService: ProjectService,
  ) { }  //注入服务
  @Post('project/add')
  @HttpCode(200)
  @UseGuards(AdminGuard) // 拦截权限
  @ApiOperation({ summary: '添加专题' })
  async addProject(@Body() PostProject: AddEditProjectDto, @Headers() getHeaders: Headers) {
    var userInfo = await this.toolsService.TokenGetUserInfo(getHeaders['authorization']);
    var result = await this.projectService.add(PostProject, userInfo._id);
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
  @Post('project/update')
  @HttpCode(200)
  @UseGuards(AdminGuard) // 拦截权限
  @ApiOperation({ summary: '更新专题' })
  async updateProject(@Body() PostProject: AddEditProjectDto) {
    var result = await this.projectService.update(PostProject);
    var code = 200;
    var message = '更新成功'
    var data = true;
    if (!result) {
      code = 202;
      message = '更新失败'
      data = false;
    }
    return {
      code,
      data,
      message
    }
  }
  // 查询专题
  @Get('project/query')
  @HttpCode(200)
  @UseGuards(AdminGuard) // 拦截权限
  @ApiOperation({ summary: '查询' })
  async queryProject(@Query() _Query: IdDto, @Headers() getHeaders: Headers) {
    var result = await this.projectService.query(_Query.id);
    var code = 200;
    var message = '查询成功'
    return {
      code,
      data: result,
      message
    }
  }
  // 删除专题
  @Get('project/delete')
  @HttpCode(200)
  @UseGuards(AdminGuard) // 拦截权限
  @ApiOperation({ summary: '删除' })
  async deleteProject(@Query() _Query: IdsDto, @Headers() getHeaders: Headers) {
    var userInfo = await this.toolsService.TokenGetUserInfo(getHeaders['authorization']);
    var result = await this.projectService.delete(_Query, userInfo._id);
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
  // 批量删除专题
  @Post('project/batchdelete')
  @HttpCode(200)
  @UseGuards(AdminGuard) // 拦截权限
  @ApiOperation({ summary: '批量删除' })
  async batchDeleteProject(@Body() _Body: IdsDto, @Headers() getHeaders: Headers) {
    var userInfo = await this.toolsService.TokenGetUserInfo(getHeaders['authorization']);
    var result = await this.projectService.delete(_Body, userInfo._id);
    var code = 200;
    var message = '更新成功'
    var data = true;
    if (!result) {
      code = 202;
      message = '更新失败'
      data = false;
    }
    return {
      code,
      data,
      message
    }
  }

  // 获取专题列表
  @Get('project/list')
  @HttpCode(200)
  @UseGuards(AdminGuard) // 拦截权限
  @ApiHeader({
    name: 'Authorization',
    required: false,
    description: '本次请求请带上token',
  })
  @ApiOperation({ summary: '获取专题列表' })
  async projectList(@Query() _Query: pagesDto) {
    var project = await this.projectService.list(_Query);
    return {
      code: 200,
      data: project,
      message: '获取成功'
    }
  }
}


import { Injectable, CanActivate, ExecutionContext, HttpException } from '@nestjs/common';
import { Observable } from 'rxjs';
import { ToolsService } from "../utils/tools.service";
@Injectable()
export class AdminGuard implements CanActivate {
  constructor(
    private readonly toolsService: ToolsService,
  ) { }
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    // 读取token
    const token = request.headers['Authorization'] || request.headers['authorization']
    if (!token) {
      throw new HttpException({ code: 4001, msg: 'Token不存在' }, 200);
    }
    return this.toolsService.validateToken(token);
  }
}
